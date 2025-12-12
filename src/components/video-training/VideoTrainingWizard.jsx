import React, { useState, useCallback } from 'react';
import { ArrowLeft, Video, Info, Loader2, AlertCircle, ChevronRight, Settings, Sparkles } from 'lucide-react';
import { usePartner } from '../../context/PartnerContext';
import { motion } from 'framer-motion';
import { getWPNonce, getWPApiUrl } from '@/services/wordpress-api';
import FullscreenLoader from '@/components/ui/fullscreen-loader';

/**
 * DynamicFormField - Renders form fields based on configuration
 */
const DynamicFormField = ({ field, value, onChange, error, primaryAccent }) => {
  const commonStyles = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '10px',
    border: `2px solid ${error ? '#ef4444' : '#e2e8f0'}`,
    fontSize: '16px',
    transition: 'all 0.2s ease',
    outline: 'none',
    background: '#fff',
  };

  const handleFocus = (e) => {
    e.target.style.borderColor = primaryAccent;
    e.target.style.boxShadow = `0 0 0 3px ${primaryAccent}20`;
  };

  const handleBlur = (e) => {
    e.target.style.borderColor = error ? '#ef4444' : '#e2e8f0';
    e.target.style.boxShadow = 'none';
  };

  const renderField = () => {
    switch (field.type) {
      case 'select':
        return (
          <select
            value={value || field.default || ''}
            onChange={(e) => onChange(field.key, e.target.value)}
            style={{ ...commonStyles, cursor: 'pointer' }}
            onFocus={handleFocus}
            onBlur={handleBlur}
            required={field.required}
          >
            {!field.default && <option value="">Bitte auswählen...</option>}
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => onChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            style={{ ...commonStyles, minHeight: '100px', resize: 'vertical' }}
            onFocus={handleFocus}
            onBlur={handleBlur}
            required={field.required}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            style={commonStyles}
            onFocus={handleFocus}
            onBlur={handleBlur}
            required={field.required}
            min={field.min}
            max={field.max}
          />
        );

      default: // text
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            style={commonStyles}
            onFocus={handleFocus}
            onBlur={handleBlur}
            required={field.required}
          />
        );
    }
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      <label
        style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: 600,
          color: '#0f172a',
          marginBottom: '8px',
        }}
      >
        {field.label}
        {field.required && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
      </label>
      {renderField()}
      {field.hint && (
        <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>{field.hint}</p>
      )}
      {error && (
        <p style={{ fontSize: '13px', color: '#ef4444', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <AlertCircle size={14} />
          {error}
        </p>
      )}
    </div>
  );
};

/**
 * VideoTrainingWizard - Configuration view before starting
 */
const VideoTrainingWizard = ({ scenario, onBack, onStart }) => {
  // Initialize variables with default values from input configuration
  const [variables, setVariables] = useState(() => {
    const inputConfig = scenario?.input_configuration || [];
    const initialVars = {};
    inputConfig.forEach((field) => {
      if (field.default) {
        initialVars[field.key] = field.default;
      }
    });
    return initialVars;
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  const { branding, demoCode } = usePartner();

  // Get themed styles
  const themedGradient = branding?.headerGradient || 'linear-gradient(135deg, #3A7FA7 0%, #2d6a8a 100%)';
  const primaryAccent = branding?.primaryAccent || '#3A7FA7';

  // Handle field change
  const handleFieldChange = useCallback((key, value) => {
    setVariables((prev) => ({ ...prev, [key]: value }));
    // Clear error when field changes
    if (errors[key]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  }, [errors]);

  // Validate form
  const validateForm = useCallback(() => {
    const newErrors = {};
    const inputConfig = scenario?.input_configuration || [];

    inputConfig.forEach((field) => {
      if (field.required && !variables[field.key]) {
        newErrors[field.key] = `${field.label} ist erforderlich`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [scenario, variables]);

  // Handle start training
  const handleStart = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setApiError(null);

    try {
      const apiUrl = getWPApiUrl();

      // Step 1: Create session
      console.log('[VIDEO TRAINING] Creating session...');
      const createResponse = await fetch(`${apiUrl}/video-training/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': getWPNonce(),
        },
        body: JSON.stringify({
          scenario_id: scenario.id,
          variables: variables,
          demo_code: demoCode || null,
        }),
      });

      if (!createResponse.ok) {
        throw new Error('Fehler beim Erstellen der Sitzung');
      }

      const createData = await createResponse.json();

      if (!createData.success || !createData.data?.session) {
        throw new Error('Ungültige Antwort beim Erstellen der Sitzung');
      }

      const session = createData.data.session;
      console.log('[VIDEO TRAINING] Session created:', session.id);

      // Step 2: Generate questions
      console.log('[VIDEO TRAINING] Generating questions...');
      const questionsResponse = await fetch(`${apiUrl}/video-training/sessions/${session.id}/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': getWPNonce(),
        },
      });

      if (!questionsResponse.ok) {
        throw new Error('Fehler beim Generieren der Fragen');
      }

      const questionsData = await questionsResponse.json();

      if (!questionsData.success || !questionsData.data?.questions) {
        throw new Error('Fehler beim Generieren der Fragen');
      }

      console.log('[VIDEO TRAINING] Questions generated:', questionsData.data.questions.length);

      // Start the session
      onStart({
        session: questionsData.data.session,
        questions: questionsData.data.questions,
        variables: variables,
      });
    } catch (err) {
      console.error('[VIDEO TRAINING] Error starting session:', err);
      setApiError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const inputConfig = scenario?.input_configuration || [];

  return (
    <div style={{ padding: '32px', maxWidth: '700px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'none',
            border: 'none',
            color: '#64748b',
            cursor: 'pointer',
            fontSize: '14px',
            padding: '8px 0',
            marginBottom: '16px',
          }}
        >
          <ArrowLeft size={18} />
          Zurück zur Übersicht
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: themedGradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Video size={28} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
              {scenario?.title}
            </h1>
            <p style={{ fontSize: '14px', color: '#64748b' }}>
              Konfiguriere dein Video-Training
            </p>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          padding: '16px 20px',
          background: `linear-gradient(135deg, ${primaryAccent}10 0%, ${primaryAccent}05 100%)`,
          borderRadius: '12px',
          border: `1px solid ${primaryAccent}20`,
          marginBottom: '32px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
        }}
      >
        <Info size={20} color={primaryAccent} style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <h4 style={{ fontWeight: 600, color: '#0f172a', marginBottom: '4px', fontSize: '14px' }}>
            So funktioniert es
          </h4>
          <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
            Die KI generiert {scenario?.question_count || 5} personalisierte Fragen basierend auf deinen Angaben.
            Beantworte jede Frage vor der Kamera und erhalte anschließend detailliertes Feedback.
          </p>
        </div>
      </motion.div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          background: '#fff',
          borderRadius: '16px',
          padding: '28px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
          <Settings size={20} color={primaryAccent} />
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>
            Personalisiere dein Training
          </h2>
        </div>

        {inputConfig.map((field) => (
          <DynamicFormField
            key={field.key}
            field={field}
            value={variables[field.key]}
            onChange={handleFieldChange}
            error={errors[field.key]}
            primaryAccent={primaryAccent}
          />
        ))}

        {inputConfig.length === 0 && (
          <p style={{ color: '#64748b', textAlign: 'center', padding: '20px' }}>
            Keine zusätzliche Konfiguration erforderlich.
          </p>
        )}
      </motion.div>

      {/* Error display */}
      {apiError && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '16px',
            background: '#fef2f2',
            borderRadius: '12px',
            border: '1px solid #fecaca',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <AlertCircle size={20} color="#ef4444" />
          <p style={{ color: '#dc2626', fontSize: '14px' }}>{apiError}</p>
        </motion.div>
      )}

      {/* Training Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{
          background: '#f8fafc',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '32px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <Sparkles size={18} color={primaryAccent} />
          <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '14px' }}>Training-Details</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block' }}>Fragen</span>
            <span style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>
              {scenario?.question_count || 5}
            </span>
          </div>
          <div>
            <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block' }}>Zeit pro Frage</span>
            <span style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>
              ~{Math.round((scenario?.time_limit_per_question || 120) / 60)} Min.
            </span>
          </div>
          <div>
            <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block' }}>Gesamtdauer</span>
            <span style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>
              ~{Math.round((scenario?.total_time_limit || 900) / 60)} Min.
            </span>
          </div>
        </div>
      </motion.div>

      {/* Start Button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        onClick={handleStart}
        disabled={isLoading}
        style={{
          width: '100%',
          padding: '16px 24px',
          borderRadius: '12px',
          background: isLoading ? '#94a3b8' : themedGradient,
          color: '#fff',
          border: 'none',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
          transition: 'all 0.2s ease',
        }}
      >
        Video Training starten
        <ChevronRight size={20} />
      </motion.button>

      {/* Fullscreen Loading Overlay */}
      <FullscreenLoader
        isLoading={isLoading}
        message="Fragen werden generiert..."
        subMessage="Die KI erstellt personalisierte Fragen basierend auf deinen Angaben."
      />
    </div>
  );
};

export default VideoTrainingWizard;
