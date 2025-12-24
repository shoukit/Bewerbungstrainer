import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Sparkles,
  CheckCircle,
  Info,
} from 'lucide-react';
import { useBranding } from '@/hooks/useBranding';
import { COLORS } from '@/config/colors';

/**
 * Dynamic Form Field Component
 * Renders appropriate input based on field type from input_configuration
 */
const DynamicFormField = ({ field, value, onChange, error, focusColor, branding }) => {
  const theFocusColor = focusColor || '#4a9ec9';

  const baseInputStyle = {
    width: '100%',
    padding: `${branding.space[3]} ${branding.space[4]}`,
    borderRadius: branding.radius.lg,
    border: `2px solid ${error ? COLORS.red[500] : COLORS.slate[200]}`,
    fontSize: branding.fontSize.base, // Minimum 16px to prevent iOS zoom
    color: COLORS.slate[900],
    backgroundColor: 'white',
    outline: 'none',
    transition: branding.transition.normal,
  };

  const focusStyle = {
    borderColor: theFocusColor,
    boxShadow: `0 0 0 3px ${theFocusColor}1a`,
  };

  const handleFocus = (e) => {
    Object.assign(e.target.style, focusStyle);

    // Scroll input into view on mobile when keyboard appears
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
            <option value="">Bitte wählen...</option>
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
    <div style={{ marginBottom: branding.space[5] }}>
      <label style={{
        display: 'block',
        marginBottom: branding.space[2],
        fontSize: branding.fontSize.sm,
        fontWeight: 600,
        color: COLORS.slate[700],
      }}>
        {field.label}
        {field.required && (
          <span style={{ color: COLORS.red[500], marginLeft: branding.space[1] }}>*</span>
        )}
      </label>
      {renderInput()}
      {error && (
        <p style={{
          marginTop: branding.space[1.5],
          fontSize: branding.fontSize.xs,
          color: COLORS.red[500],
          display: 'flex',
          alignItems: 'center',
          gap: branding.space[1],
        }}>
          <AlertCircle style={{ width: '14px', height: '14px' }} />
          {error}
        </p>
      )}
      {field.hint && !error && (
        <p style={{
          marginTop: branding.space[1.5],
          fontSize: branding.fontSize.xs,
          color: COLORS.slate[500],
          display: 'flex',
          alignItems: 'center',
          gap: branding.space[1],
        }}>
          <Info style={{ width: '14px', height: '14px' }} />
          {field.hint}
        </p>
      )}
    </div>
  );
};

/**
 * SimulatorVariablesPage Component
 *
 * Collects variable inputs for the scenario.
 * Does NOT include microphone selection (that's now in DeviceSetupPage).
 */
const SimulatorVariablesPage = ({ scenario, onBack, onNext }) => {
  const [formValues, setFormValues] = useState({});
  const [errors, setErrors] = useState({});

  // Partner theming
  const b = useBranding();

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

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Pass variables to next step
    onNext(formValues);
  };

  // If no variables needed, auto-proceed to next step
  useEffect(() => {
    if (inputConfig.length === 0) {
      onNext({});
    }
  }, [inputConfig, onNext]);

  // Don't render if no variables needed (will auto-proceed)
  if (inputConfig.length === 0) {
    return null;
  }

  return (
    <div style={{ padding: b.space[6], paddingBottom: '200px', maxWidth: '640px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: b.space[8] }}>
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
            fontSize: b.fontSize.sm,
            cursor: 'pointer',
            borderRadius: b.radius.md,
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
            borderRadius: b.radius.xl,
            background: b.headerGradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Sparkles style={{ width: '28px', height: '28px', color: 'white' }} />
          </div>
          <div>
            <h1 style={{
              fontSize: b.fontSize['2xl'],
              fontWeight: 700,
              color: COLORS.slate[900],
              margin: 0,
            }}>
              {scenario.title}
            </h1>
            <p style={{
              fontSize: b.fontSize.sm,
              color: COLORS.slate[600],
              margin: `${b.space[1]} 0 0 0`,
            }}>
              Personalisiere dein Training
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
          fontSize: b.fontSize.sm,
          color: COLORS.slate[700],
          margin: 0,
          lineHeight: 1.6,
        }}>
          {scenario.description}
        </p>
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
            focusColor={b.primaryAccent}
            branding={b}
          />
        ))}

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
            <span style={{ fontSize: b.fontSize.base, fontWeight: 600, color: COLORS.slate[900] }}>
              {scenario.question_count_min}-{scenario.question_count_max}
            </span>
          </div>
          <div>
            <span style={{ fontSize: b.fontSize.xs, color: COLORS.slate[500], display: 'block' }}>Zeit pro Frage</span>
            <span style={{ fontSize: b.fontSize.base, fontWeight: 600, color: COLORS.slate[900] }}>
              {Math.round(scenario.time_limit_per_question / 60)} Min
            </span>
          </div>
          <div>
            <span style={{ fontSize: b.fontSize.xs, color: COLORS.slate[500], display: 'block' }}>Wiederholen</span>
            <span style={{ fontSize: b.fontSize.base, fontWeight: 600, color: COLORS.slate[900] }}>
              {scenario.allow_retry ? 'Erlaubt' : 'Nicht erlaubt'}
            </span>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          style={{
            width: '100%',
            padding: `${b.space[4]} ${b.space[6]}`,
            borderRadius: b.radius.xl,
            border: 'none',
            background: b.buttonGradient,
            color: 'white',
            fontSize: b.fontSize.base,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: b.space[2.5],
            transition: b.transition.normal,
            boxShadow: `0 4px 12px ${b.primaryAccent}4d`,
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = `0 6px 16px ${b.primaryAccent}66`;
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'none';
            e.target.style.boxShadow = `0 4px 12px ${b.primaryAccent}4d`;
          }}
        >
          Weiter
          <ArrowRight style={{ width: '20px', height: '20px' }} />
        </button>
      </form>
    </div>
  );
};

export default SimulatorVariablesPage;
