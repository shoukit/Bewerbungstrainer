import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  AlertCircle,
  Sparkles,
  CheckCircle,
  Info,
  Mic,
  Target,
  Lightbulb,
  Clock,
  MessageSquare,
  Brain
} from 'lucide-react';
import wordpressAPI from '@/services/wordpress-api';
import MicrophoneSelector from '@/components/MicrophoneSelector';
import MicrophoneTestDialog from '@/components/MicrophoneTestDialog';
import FullscreenLoader from '@/components/ui/fullscreen-loader';
import DynamicFormField from '@/components/ui/DynamicFormField';
import { usePartner } from '@/context/PartnerContext';
import { useBranding } from '@/hooks/useBranding';
import { COLORS } from '@/config/colors';

/**
 * Icon mapping for dynamic tip icons from backend
 */
const iconMap = {
  target: Target,
  clock: Clock,
  mic: Mic,
  'message-square': MessageSquare,
  lightbulb: Lightbulb,
  brain: Brain,
  info: Info,
  check: CheckCircle,
  sparkles: Sparkles,
};

/**
 * Default tips when no custom tips are configured
 */
const defaultTips = [
  {
    icon: Target,
    title: 'Strukturiert antworten',
    description: 'Nutze die STAR-Methode (Situation, Task, Action, Result) für Beispiele.',
  },
  {
    icon: Clock,
    title: 'Zeit im Blick',
    description: 'Antworte präzise, aber ausführlich genug.',
  },
  {
    icon: Mic,
    title: 'Klar sprechen',
    description: 'Sprich in normalem Tempo. Pausen sind völlig in Ordnung.',
  },
];

// DynamicFormField is now imported from @/components/ui/DynamicFormField

/**
 * Simulator Wizard Component
 *
 * Renders a dynamic form based on scenario's input_configuration
 * and creates a session with the provided variables
 *
 * If preloadedQuestions is provided, uses those questions instead of generating new ones
 * (used when repeating a session)
 */
const SimulatorWizard = ({ scenario, onBack, onStart, preloadedQuestions }) => {
  const [formValues, setFormValues] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Microphone selection state
  const [selectedMicrophoneId, setSelectedMicrophoneId] = useState(null);
  const [showMicrophoneTest, setShowMicrophoneTest] = useState(false);

  // Partner theming and demo code
  const b = useBranding();
  const { demoCode } = usePartner();

  // Parse input configuration
  const inputConfig = React.useMemo(() => {
    if (!scenario?.input_configuration) return [];

    try {
      const config = typeof scenario.input_configuration === 'string'
        ? JSON.parse(scenario.input_configuration)
        : scenario.input_configuration;

      // Filter to only show user-input fields
      return Array.isArray(config)
        ? config.filter(field => field.user_input !== false)
        : [];
    } catch (e) {
      console.error('Error parsing input_configuration:', e);
      return [];
    }
  }, [scenario?.input_configuration]);

  // Initialize form with default values
  useEffect(() => {
    const defaults = {};
    inputConfig.forEach(field => {
      if (field.default) {
        defaults[field.key] = field.default;
      }
    });
    setFormValues(defaults);
  }, [inputConfig]);

  const handleChange = (key, value) => {
    setFormValues(prev => ({ ...prev, [key]: value }));
    // Clear error when user starts typing
    if (errors[key]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    inputConfig.forEach(field => {
      const value = formValues[field.key];

      // Required validation
      if (field.required && (!value || value.trim() === '')) {
        newErrors[field.key] = 'Dieses Feld ist erforderlich';
        return;
      }

      // Skip further validation if empty and not required
      if (!value || value.trim() === '') return;

      // Validation rules
      if (field.validation) {
        const { minLength, maxLength, min, max, pattern } = field.validation;

        if (minLength && value.length < minLength) {
          newErrors[field.key] = `Mindestens ${minLength} Zeichen erforderlich`;
        }
        if (maxLength && value.length > maxLength) {
          newErrors[field.key] = `Maximal ${maxLength} Zeichen erlaubt`;
        }
        if (min !== undefined && Number(value) < min) {
          newErrors[field.key] = `Mindestens ${min}`;
        }
        if (max !== undefined && Number(value) > max) {
          newErrors[field.key] = `Maximal ${max}`;
        }
        if (pattern && !new RegExp(pattern).test(value)) {
          newErrors[field.key] = 'Ungültiges Format';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Create session with variables (and optionally preloaded questions)
      const sessionResponse = await wordpressAPI.createSimulatorSession({
        scenario_id: scenario.id,
        variables: formValues,
        demo_code: demoCode || null,
        // If we have preloaded questions (repeating a session), include them
        questions: preloadedQuestions || null,
      });

      if (!sessionResponse.success) {
        throw new Error(sessionResponse.message || 'Fehler beim Erstellen der Session');
      }

      const session = sessionResponse.data.session;

      // 2. Generate questions only if not preloaded
      let questions;
      if (preloadedQuestions && preloadedQuestions.length > 0) {
        // Use preloaded questions - skip generation
        questions = preloadedQuestions;
        // Update session with questions_json
        await wordpressAPI.updateSimulatorSessionQuestions(session.id, questions);
      } else {
        // Generate new questions
        const questionsResponse = await wordpressAPI.generateSimulatorQuestions(session.id);

        if (!questionsResponse.success) {
          throw new Error(questionsResponse.message || 'Fehler beim Generieren der Fragen');
        }
        questions = questionsResponse.data.questions;
      }

      // 3. Start the session
      onStart({
        session: { ...session, questions_json: questions },
        questions: questions,
        scenario: scenario,
        variables: formValues,
        selectedMicrophoneId: selectedMicrophoneId,
      });

    } catch (err) {
      console.error('Error starting session:', err);
      setSubmitError(err.message || 'Ein Fehler ist aufgetreten');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: b.space[6], paddingBottom: '200px', maxWidth: '640px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <button
          onClick={onBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: b.space[2],
            padding: `${b.space[2]} ${b.space[3]}`,
            marginBottom: b.space[4],
            border: 'none',
            background: 'transparent',
            color: COLORS.slate[600],
            fontSize: b.fontSize.base,
            cursor: 'pointer',
            borderRadius: b.radius.sm,
            transition: b.transition.normal,
          }}
          onMouseEnter={(e) => e.target.style.background = COLORS.slate[100]}
          onMouseLeave={(e) => e.target.style.background = 'transparent'}
        >
          <ArrowLeft style={{ width: '18px', height: '18px' }} />
          Zurück zur Übersicht
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: b.space[4] }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: b.radius.lg,
            background: b.headerGradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Sparkles style={{ width: '28px', height: '28px', color: 'white' }} />
          </div>
          <div>
            <h1 style={{
              fontSize: b.fontSize['4xl'],
              fontWeight: 700,
              color: COLORS.slate[900],
              margin: 0,
            }}>
              {scenario.title}
            </h1>
            <p style={{
              fontSize: b.fontSize.base,
              color: COLORS.slate[600],
              margin: '4px 0 0 0',
            }}>
              Konfiguriere dein Training
            </p>
          </div>
        </div>
      </div>

      {/* Description Card */}
      <div style={{
        padding: `${b.space[4]} ${b.space[5]}`,
        borderRadius: b.radius.lg,
        backgroundColor: COLORS.slate[100],
        marginBottom: b.space[6],
      }}>
        <p style={{
          fontSize: b.fontSize.base,
          color: COLORS.slate[700],
          margin: 0,
          lineHeight: 1.6,
        }}>
          {scenario.description}
        </p>
      </div>

      {/* Long Description - Detailed task description */}
      {scenario.long_description && (
        <div style={{
          padding: `${b.space[5]} ${b.space[6]}`,
          borderRadius: b.radius.lg,
          backgroundColor: 'white',
          border: `1px solid ${COLORS.slate[200]}`,
          marginBottom: b.space[6],
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: b.radius.md,
              background: b.headerGradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Info style={{ width: '20px', height: '20px', color: 'white' }} />
            </div>
            <div>
              <h3 style={{
                fontSize: b.fontSize.md,
                fontWeight: 600,
                color: COLORS.slate[900],
                margin: `0 0 ${b.space[2]} 0`,
              }}>
                Deine Aufgabe
              </h3>
              <p style={{
                fontSize: b.fontSize.base,
                lineHeight: '1.6',
                color: COLORS.slate[700],
                margin: 0,
                whiteSpace: 'pre-wrap',
              }}>
                {scenario.long_description?.replace(/\/n/g, '\n')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tips Section */}
      {(() => {
        const tips = scenario.tips && Array.isArray(scenario.tips) && scenario.tips.length > 0
          ? scenario.tips.map((tip, idx) => {
              if (typeof tip === 'string') {
                return { icon: Lightbulb, title: `Tipp ${idx + 1}`, description: tip };
              }
              return {
                icon: iconMap[tip.icon] || iconMap[tip.icon?.toLowerCase()] || Lightbulb,
                title: tip.title || `Tipp ${idx + 1}`,
                description: tip.text || tip.description || '',
              };
            })
          : defaultTips;

        return (
          <div style={{
            padding: `${b.space[5]} ${b.space[6]}`,
            borderRadius: b.radius.lg,
            backgroundColor: 'white',
            border: `1px solid ${COLORS.slate[200]}`,
            marginBottom: b.space[6],
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: b.space[2.5], marginBottom: b.space[4] }}>
              <Lightbulb style={{ width: '20px', height: '20px', color: b.primaryAccent }} />
              <h3 style={{ fontSize: b.fontSize.lg, fontWeight: 600, color: COLORS.slate[900], margin: 0 }}>
                Tipps für dein Training
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: b.space[3] }}>
              {tips.map((tip, index) => {
                const IconComponent = tip.icon;
                return (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: b.space[3],
                    padding: `${b.space[3]} ${b.space[4]}`,
                    borderRadius: b.radius.md,
                    backgroundColor: COLORS.slate[50],
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: b.radius.sm,
                      background: b.headerGradient,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <IconComponent style={{ width: '16px', height: '16px', color: 'white' }} />
                    </div>
                    <div>
                      <h4 style={{ fontWeight: 600, color: COLORS.slate[900], fontSize: b.fontSize.base, margin: '0 0 2px 0' }}>
                        {tip.title}
                      </h4>
                      <p style={{ fontSize: b.fontSize.sm, color: COLORS.slate[600], lineHeight: 1.5, margin: 0 }}>
                        {tip.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {inputConfig.length > 0 ? (
          inputConfig.map(field => (
            <DynamicFormField
              key={field.key}
              field={field}
              value={formValues[field.key]}
              onChange={handleChange}
              error={errors[field.key]}
              focusColor={b.primaryAccent}
            />
          ))
        ) : (
          <div style={{
            padding: b.space[6],
            textAlign: 'center',
            color: COLORS.slate[500],
          }}>
            <CheckCircle style={{ width: '32px', height: '32px', marginBottom: b.space[3], opacity: 0.5 }} />
            <p style={{ margin: 0 }}>Keine zusätzliche Konfiguration erforderlich.</p>
          </div>
        )}

        {/* Session Info */}
        <div style={{
          padding: `${b.space[4]} ${b.space[5]}`,
          borderRadius: b.radius.lg,
          backgroundColor: b.primaryAccentLight,
          marginTop: b.space[6],
          marginBottom: b.space[6],
          display: 'flex',
          gap: b.space[5],
          flexWrap: 'wrap',
        }}>
          <div>
            <span style={{ fontSize: b.fontSize.xs, color: COLORS.slate[500], display: 'block' }}>Fragen</span>
            <span style={{ fontSize: b.fontSize.lg, fontWeight: 600, color: COLORS.slate[900] }}>
              {scenario.question_count_min}-{scenario.question_count_max}
            </span>
          </div>
          <div>
            <span style={{ fontSize: b.fontSize.xs, color: COLORS.slate[500], display: 'block' }}>Zeit pro Frage</span>
            <span style={{ fontSize: b.fontSize.lg, fontWeight: 600, color: COLORS.slate[900] }}>
              {Math.round(scenario.time_limit_per_question / 60)} Min
            </span>
          </div>
          <div>
            <span style={{ fontSize: b.fontSize.xs, color: COLORS.slate[500], display: 'block' }}>Wiederholen</span>
            <span style={{ fontSize: b.fontSize.lg, fontWeight: 600, color: COLORS.slate[900] }}>
              {scenario.allow_retry ? 'Erlaubt' : 'Nicht erlaubt'}
            </span>
          </div>
        </div>

        {/* Microphone Selection */}
        <div style={{
          padding: b.space[6],
          borderRadius: b.radius.xl,
          backgroundColor: 'white',
          border: `1px solid ${COLORS.slate[200]}`,
          marginBottom: b.space[6],
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: b.space[2.5],
            marginBottom: b.space[4],
          }}>
            <Mic style={{ width: '22px', height: '22px', color: b.primaryAccent }} />
            <h3 style={{
              fontSize: b.fontSize.lg,
              fontWeight: 600,
              color: COLORS.slate[900],
              margin: 0,
            }}>
              Mikrofon auswählen
            </h3>
          </div>
          <MicrophoneSelector
            selectedDeviceId={selectedMicrophoneId}
            onDeviceChange={setSelectedMicrophoneId}
            onTestClick={() => setShowMicrophoneTest(true)}
          />
        </div>

        {/* Error Message */}
        {submitError && (
          <div style={{
            padding: `${b.space[3]} ${b.space[4]}`,
            borderRadius: b.radius.lg,
            backgroundColor: COLORS.red[100],
            color: COLORS.red[500],
            marginBottom: b.space[5],
            display: 'flex',
            alignItems: 'center',
            gap: b.space[2],
          }}>
            <AlertCircle style={{ width: '18px', height: '18px' }} />
            {submitError}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            width: '100%',
            padding: `${b.space[4]} ${b.space[6]}`,
            borderRadius: b.radius.lg,
            border: 'none',
            background: isSubmitting ? COLORS.slate[300] : b.buttonGradient,
            color: 'white',
            fontSize: b.fontSize.lg,
            fontWeight: 600,
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: b.space[2.5],
            transition: b.transition.normal,
            boxShadow: isSubmitting ? 'none' : `0 4px 12px ${b.primaryAccent}4d`,
          }}
          onMouseEnter={(e) => {
            if (!isSubmitting) {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = `0 6px 16px ${b.primaryAccent}66`;
            }
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'none';
            e.target.style.boxShadow = isSubmitting ? 'none' : `0 4px 12px ${b.primaryAccent}4d`;
          }}
        >
          Training starten
          <ArrowRight style={{ width: '20px', height: '20px' }} />
        </button>
      </form>

      {/* Microphone Test Dialog */}
      <MicrophoneTestDialog
        isOpen={showMicrophoneTest}
        onClose={() => setShowMicrophoneTest(false)}
        deviceId={selectedMicrophoneId}
      />

      {/* Fullscreen Loading Overlay */}
      <FullscreenLoader
        isLoading={isSubmitting}
        message="Fragen werden generiert..."
        subMessage="Die KI erstellt personalisierte Fragen basierend auf deinen Angaben."
      />
    </div>
  );
};

export default SimulatorWizard;
