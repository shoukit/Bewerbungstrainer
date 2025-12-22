import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Sparkles,
  Info,
  Clock,
  User,
} from 'lucide-react';
import { usePartner } from '@/context/PartnerContext';
import { DEFAULT_BRANDING } from '@/config/partners';
import { COLORS } from '@/config/colors';

/**
 * Scroll element into view for mobile keyboard
 */
const scrollIntoViewOnFocus = (e) => {
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
    fontSize: '16px', // Minimum 16px to prevent iOS zoom
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
    scrollIntoViewOnFocus(e);
  };

  const handleBlur = (e) => {
    e.target.style.borderColor = error ? COLORS.red[500] : COLORS.slate[200];
    e.target.style.boxShadow = 'none';
  };

  const renderInput = () => {
    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => onChange(field.key, e.target.value)}
            placeholder={field.default || field.placeholder || `${field.label} eingeben...`}
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
              <option key={option.value || option} value={option.value || option}>
                {option.label || option}
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
            placeholder={field.default || field.placeholder || `${field.label} eingeben...`}
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
            placeholder={field.default || field.placeholder || `${field.label} eingeben...`}
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
 * RoleplayVariablesPage Component
 *
 * Collects variable inputs for the roleplay scenario.
 * Replaces the popup dialog with a full page.
 */
const RoleplayVariablesPage = ({ scenario, onBack, onNext }) => {
  const [formValues, setFormValues] = useState({});
  const [errors, setErrors] = useState({});

  // Partner theming
  const { branding } = usePartner();
  const headerGradient = branding?.['--header-gradient'] || DEFAULT_BRANDING['--header-gradient'];
  const headerText = branding?.['--header-text'] || DEFAULT_BRANDING['--header-text'];
  const buttonGradient = branding?.['--button-gradient'] || headerGradient;
  const primaryAccent = branding?.['--primary-accent'] || DEFAULT_BRANDING['--primary-accent'];
  const primaryAccentLight = branding?.['--primary-accent-light'] || DEFAULT_BRANDING['--primary-accent-light'];

  // Parse variables schema - filter to only user input fields
  const userInputVariables = React.useMemo(() => {
    if (!scenario?.variables_schema) return [];
    return scenario.variables_schema.filter(varDef => varDef.user_input !== false);
  }, [scenario?.variables_schema]);

  // Initialize form with default values (all variables, not just user input)
  useEffect(() => {
    if (scenario?.variables_schema) {
      const defaults = {};
      scenario.variables_schema.forEach(varDef => {
        if (varDef.default) {
          defaults[varDef.key] = varDef.default;
        }
      });
      setFormValues(defaults);
    }
  }, [scenario?.variables_schema]);

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

    userInputVariables.forEach(field => {
      const value = formValues[field.key];

      // Required validation
      if (field.required && (!value || value.toString().trim() === '')) {
        newErrors[field.key] = `${field.label} ist ein Pflichtfeld`;
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

    // Pass all variables (user-provided and auto-filled) to next step
    onNext(formValues);
  };

  // If no variables need user input, auto-proceed to next step
  useEffect(() => {
    if (userInputVariables.length === 0) {
      // Still pass all default values
      const defaults = {};
      scenario?.variables_schema?.forEach(varDef => {
        if (varDef.default) {
          defaults[varDef.key] = varDef.default;
        }
      });
      onNext(defaults);
    }
  }, [userInputVariables, scenario, onNext]);

  // Don't render if no user input variables needed (will auto-proceed)
  if (userInputVariables.length === 0) {
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
            <Sparkles style={{ width: '28px', height: '28px', color: headerText }} />
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
              Personalisiere dein Rollenspiel
            </p>
          </div>
        </div>
      </div>

      {/* Long Description - Detailed task description */}
      {scenario.long_description && (
        <div style={{
          padding: '20px 24px',
          borderRadius: '14px',
          backgroundColor: 'white',
          border: `1px solid ${COLORS.slate[200]}`,
          marginBottom: '24px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px',
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: headerGradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Info style={{ width: '20px', height: '20px', color: 'white' }} />
            </div>
            <div>
              <h3 style={{
                fontSize: '15px',
                fontWeight: 600,
                color: COLORS.slate[900],
                margin: '0 0 8px 0',
              }}>
                Deine Aufgabe
              </h3>
              <p style={{
                fontSize: '14px',
                lineHeight: '1.6',
                color: COLORS.slate[700],
                margin: 0,
                whiteSpace: 'pre-wrap',
              }}>
                {scenario.long_description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Short Description - Only show if no long_description */}
      {!scenario.long_description && scenario.description && (
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

      {/* Interviewer Profile Preview */}
      {scenario.interviewer_profile && (
        <div style={{
          padding: '16px 20px',
          borderRadius: '12px',
          border: `1px solid ${COLORS.slate[200]}`,
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}>
          {scenario.interviewer_profile.image_url ? (
            <img
              src={scenario.interviewer_profile.image_url}
              alt={scenario.interviewer_profile.name}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: primaryAccentLight,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <User style={{ width: '24px', height: '24px', color: primaryAccent }} />
            </div>
          )}
          <div>
            <p style={{ fontSize: '14px', fontWeight: 600, color: COLORS.slate[900], margin: 0 }}>
              Dein Gesprächspartner: {scenario.interviewer_profile.name}
            </p>
            {scenario.interviewer_profile.role && (
              <p style={{ fontSize: '13px', color: COLORS.slate[600], margin: '2px 0 0 0' }}>
                {scenario.interviewer_profile.role}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {userInputVariables.map(field => (
          <DynamicFormField
            key={field.key}
            field={field}
            value={formValues[field.key]}
            onChange={handleChange}
            error={errors[field.key]}
            focusColor={primaryAccent}
          />
        ))}

        {/* Session Info */}
        <div style={{
          padding: '16px 20px',
          borderRadius: '12px',
          backgroundColor: primaryAccentLight,
          marginTop: '24px',
          marginBottom: '24px',
          display: 'flex',
          gap: '20px',
          flexWrap: 'wrap',
        }}>
          <div>
            <span style={{ fontSize: '12px', color: COLORS.slate[500], display: 'block' }}>
              <Clock style={{ width: '12px', height: '12px', display: 'inline', marginRight: '4px' }} />
              Dauer
            </span>
            <span style={{ fontSize: '16px', fontWeight: 600, color: COLORS.slate[900] }}>
              ca. 10 Min
            </span>
          </div>
          <div>
            <span style={{ fontSize: '12px', color: COLORS.slate[500], display: 'block' }}>Typ</span>
            <span style={{ fontSize: '16px', fontWeight: 600, color: COLORS.slate[900] }}>
              Live-Gespräch
            </span>
          </div>
        </div>

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

export default RoleplayVariablesPage;
