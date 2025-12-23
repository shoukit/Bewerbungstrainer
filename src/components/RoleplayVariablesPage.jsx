import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Sparkles,
  Clock,
  User,
} from 'lucide-react';
import { useBranding } from '@/hooks/useBranding';
import { COLORS } from '@/config/colors';
import DynamicFormField from '@/components/ui/DynamicFormField';

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
  const b = useBranding();

  // Helper function to replace {{variable}} placeholders with current form values
  const replaceVariables = (text) => {
    if (!text) return text;
    let result = text;
    Object.entries(formValues).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, value || '');
    });
    return result;
  };

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
            transition: `background ${b.transition.normal}`,
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
            <Sparkles style={{ width: '28px', height: '28px', color: b.headerText }} />
          </div>
          <div>
            <h1 style={{
              fontSize: b.fontSize.xl,
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
              Personalisiere dein Rollenspiel
            </p>
          </div>
        </div>
      </div>

      {/* Long Description - Detailed task description */}
      {scenario.long_description && (
        <div style={{
          padding: `${b.space[5]} ${b.space[6]}`,
          borderRadius: b.radius.xl,
          backgroundColor: 'white',
          border: `1px solid ${COLORS.slate[200]}`,
          marginBottom: b.space[6],
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: b.space[3.5],
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: b.radius.lg,
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
                fontSize: b.fontSize.base,
                fontWeight: 600,
                color: COLORS.slate[900],
                margin: `0 0 ${b.space[2]} 0`,
              }}>
                Deine Aufgabe
              </h3>
              <p style={{
                fontSize: b.fontSize.sm,
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

      {/* Short Description - Only show if no long_description */}
      {!scenario.long_description && scenario.description && (
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
      )}

      {/* Interviewer Profile Preview */}
      {scenario.interviewer_profile && (
        <div style={{
          padding: `${b.space[4]} ${b.space[5]}`,
          borderRadius: b.radius.lg,
          border: `1px solid ${COLORS.slate[200]}`,
          marginBottom: b.space[6],
          display: 'flex',
          alignItems: 'center',
          gap: b.space[4],
        }}>
          {scenario.interviewer_profile.image_url ? (
            <img
              src={scenario.interviewer_profile.image_url}
              alt={replaceVariables(scenario.interviewer_profile.name)}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: b.radius.full,
                objectFit: 'cover',
              }}
            />
          ) : (
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: b.radius.full,
              background: b.primaryAccentLight,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <User style={{ width: '24px', height: '24px', color: b.primaryAccent }} />
            </div>
          )}
          <div>
            <p style={{ fontSize: b.fontSize.sm, fontWeight: 600, color: COLORS.slate[900], margin: 0 }}>
              Dein Gesprächspartner: {replaceVariables(scenario.interviewer_profile.name)}
            </p>
            {scenario.interviewer_profile.role && (
              <p style={{ fontSize: b.fontSize.sm, color: COLORS.slate[600], margin: `${b.space[0.5]} 0 0 0` }}>
                {replaceVariables(scenario.interviewer_profile.role)}
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
            focusColor={b.primaryAccent}
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
            <span style={{ fontSize: b.fontSize.xs, color: COLORS.slate[500], display: 'block' }}>
              <Clock style={{ width: '12px', height: '12px', display: 'inline', marginRight: b.space[1] }} />
              Dauer
            </span>
            <span style={{ fontSize: b.fontSize.base, fontWeight: 600, color: COLORS.slate[900] }}>
              ca. 10 Min
            </span>
          </div>
          <div>
            <span style={{ fontSize: b.fontSize.xs, color: COLORS.slate[500], display: 'block' }}>Typ</span>
            <span style={{ fontSize: b.fontSize.base, fontWeight: 600, color: COLORS.slate[900] }}>
              Live-Gespräch
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
            transition: `transform ${b.transition.normal}, box-shadow ${b.transition.normal}`,
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

export default RoleplayVariablesPage;
