import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Video,
  Info,
} from 'lucide-react';
import { usePartner } from '@/context/PartnerContext';
import { DEFAULT_BRANDING } from '@/config/partners';
import { COLORS } from '@/config/colors';

/**
 * Dynamic Form Field Component
 */
const DynamicFormField = ({ field, value, onChange, error, focusColor }) => {
  const theFocusColor = focusColor || '#4a9ec9';

  const baseInputStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '12px',
    border: `2px solid ${error ? COLORS.red[500] : COLORS.slate[200]}`,
    fontSize: '16px',
    color: COLORS.slate[900],
    backgroundColor: 'white',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };

  const focusStyle = {
    borderColor: theFocusColor,
    boxShadow: `0 0 0 3px ${theFocusColor}1a`,
  };

  const handleFocus = (e) => {
    Object.assign(e.target.style, focusStyle);
    setTimeout(() => {
      const element = e.target;
      if (element) {
        const fieldWrapper = element.closest('div');
        if (fieldWrapper) {
          fieldWrapper.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
      }
    }, 300);
  };

  const handleBlur = (e) => {
    e.target.style.borderColor = error ? COLORS.red[500] : COLORS.slate[200];
    e.target.style.boxShadow = 'none';
  };

  const renderInput = () => {
    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(field.key, e.target.value)}
            placeholder={field.placeholder || ''}
            style={baseInputStyle}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => onChange(field.key, e.target.value)}
            placeholder={field.placeholder || ''}
            rows={4}
            style={{
              ...baseInputStyle,
              resize: 'vertical',
              minHeight: '100px',
            }}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        );

      case 'select':
        return (
          <select
            value={value || field.default || ''}
            onChange={(e) => onChange(field.key, e.target.value)}
            style={{
              ...baseInputStyle,
              cursor: 'pointer',
              appearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 12px center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '20px',
              paddingRight: '44px',
            }}
            onFocus={handleFocus}
            onBlur={handleBlur}
          >
            {!field.default && <option value="">Bitte wählen...</option>}
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(field.key, e.target.value)}
            placeholder={field.placeholder || ''}
            min={field.validation?.min}
            max={field.validation?.max}
            style={baseInputStyle}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        );

      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(field.key, e.target.value)}
            placeholder={field.placeholder || ''}
            style={baseInputStyle}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        );
    }
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={{
        display: 'block',
        marginBottom: '8px',
        fontSize: '14px',
        fontWeight: 600,
        color: COLORS.slate[700],
      }}>
        {field.label}
        {field.required && (
          <span style={{ color: COLORS.red[500], marginLeft: '4px' }}>*</span>
        )}
      </label>
      {renderInput()}
      {error && (
        <p style={{
          marginTop: '6px',
          fontSize: '13px',
          color: COLORS.red[500],
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}>
          <AlertCircle style={{ width: '14px', height: '14px' }} />
          {error}
        </p>
      )}
      {field.hint && !error && (
        <p style={{
          marginTop: '6px',
          fontSize: '13px',
          color: COLORS.slate[500],
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}>
          <Info style={{ width: '14px', height: '14px' }} />
          {field.hint}
        </p>
      )}
    </div>
  );
};

/**
 * VideoTrainingVariablesPage Component
 *
 * Collects variable inputs for the video training scenario.
 */
const VideoTrainingVariablesPage = ({ scenario, onBack, onNext }) => {
  const [formValues, setFormValues] = useState({});
  const [errors, setErrors] = useState({});

  // Partner theming
  const { branding } = usePartner();
  const headerGradient = branding?.['--header-gradient'] || DEFAULT_BRANDING['--header-gradient'];
  const buttonGradient = branding?.['--button-gradient'] || headerGradient;
  const primaryAccent = branding?.['--primary-accent'] || DEFAULT_BRANDING['--primary-accent'];
  const primaryAccentLight = branding?.['--primary-accent-light'] || DEFAULT_BRANDING['--primary-accent-light'];

  // Parse input configuration
  const inputConfig = useMemo(() => {
    if (!scenario?.input_configuration) return [];

    try {
      const config = Array.isArray(scenario.input_configuration)
        ? scenario.input_configuration
        : [];

      return config.filter(field => field.user_input !== false);
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

      if (field.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
        newErrors[field.key] = 'Dieses Feld ist erforderlich';
        return;
      }

      if (!value || (typeof value === 'string' && value.trim() === '')) return;

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

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onNext(formValues);
  };

  // If no variables needed, auto-proceed to next step
  useEffect(() => {
    if (inputConfig.length === 0) {
      onNext({});
    }
  }, [inputConfig, onNext]);

  // Don't render if no variables needed
  if (inputConfig.length === 0) {
    return null;
  }

  return (
    <div style={{ padding: '24px', paddingBottom: '200px', maxWidth: '640px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <button
          onClick={onBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            marginBottom: '16px',
            border: 'none',
            background: 'transparent',
            color: COLORS.slate[600],
            fontSize: '14px',
            cursor: 'pointer',
            borderRadius: '8px',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => e.target.style.background = COLORS.slate[100]}
          onMouseLeave={(e) => e.target.style.background = 'transparent'}
        >
          <ArrowLeft style={{ width: '18px', height: '18px' }} />
          Zurück zur Übersicht
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '14px',
            background: headerGradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Video style={{ width: '28px', height: '28px', color: 'white' }} />
          </div>
          <div>
            <h1 style={{
              fontSize: '24px',
              fontWeight: 700,
              color: COLORS.slate[900],
              margin: 0,
            }}>
              {scenario.title}
            </h1>
            <p style={{
              fontSize: '14px',
              color: COLORS.slate[600],
              margin: '4px 0 0 0',
            }}>
              Personalisiere dein Training
            </p>
          </div>
        </div>
      </div>

      {/* Description Card */}
      {scenario.description && (
        <div style={{
          padding: '16px 20px',
          borderRadius: '12px',
          backgroundColor: COLORS.slate[100],
          marginBottom: '24px',
        }}>
          <p style={{
            fontSize: '14px',
            color: COLORS.slate[700],
            margin: 0,
            lineHeight: 1.6,
          }}>
            {scenario.description}
          </p>
        </div>
      )}

      {/* Info Box */}
      <div style={{
        padding: '16px 20px',
        borderRadius: '12px',
        backgroundColor: primaryAccentLight,
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
      }}>
        <Info style={{ width: '20px', height: '20px', color: primaryAccent, flexShrink: 0, marginTop: '2px' }} />
        <div>
          <p style={{
            fontSize: '14px',
            fontWeight: 600,
            color: COLORS.slate[900],
            margin: '0 0 4px 0',
          }}>
            So funktioniert es
          </p>
          <p style={{
            fontSize: '13px',
            color: COLORS.slate[600],
            margin: 0,
            lineHeight: 1.5,
          }}>
            Die KI generiert {scenario.question_count || 5} personalisierte Fragen basierend auf deinen Angaben.
            Beantworte jede Frage vor der Kamera und erhalte anschließend detailliertes Feedback.
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {inputConfig.map(field => (
          <DynamicFormField
            key={field.key}
            field={field}
            value={formValues[field.key]}
            onChange={handleChange}
            error={errors[field.key]}
            focusColor={primaryAccent}
          />
        ))}

        {/* Submit Button */}
        <button
          type="submit"
          style={{
            width: '100%',
            padding: '16px 24px',
            borderRadius: '14px',
            border: 'none',
            background: buttonGradient,
            color: 'white',
            fontSize: '16px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            transition: 'transform 0.2s, box-shadow 0.2s',
            boxShadow: `0 4px 12px ${primaryAccent}4d`,
            marginTop: '24px',
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = `0 6px 16px ${primaryAccent}66`;
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'none';
            e.target.style.boxShadow = `0 4px 12px ${primaryAccent}4d`;
          }}
        >
          Weiter
          <ArrowRight style={{ width: '20px', height: '20px' }} />
        </button>
      </form>
    </div>
  );
};

export default VideoTrainingVariablesPage;
