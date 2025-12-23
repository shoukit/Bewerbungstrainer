import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Sparkles } from 'lucide-react';
import { useBranding } from '@/hooks/useBranding';
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
 * Styled Input Component
 */
const StyledInput = ({ id, type, value, onChange, placeholder, hasError, focusColor, b }) => {
  const [isFocused, setIsFocused] = useState(false);
  const theFocusColor = focusColor || COLORS.blue[500];

  const handleFocus = (e) => {
    setIsFocused(true);
    scrollIntoViewOnFocus(e);
  };

  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{
        width: '100%',
        height: '44px',
        padding: `${b.space[2]} ${b.space[4]}`,
        borderRadius: b.radius.lg,
        border: `2px solid ${hasError ? COLORS.red[500] : isFocused ? theFocusColor : COLORS.slate[200]}`,
        backgroundColor: 'white',
        color: COLORS.slate[900],
        fontSize: b.fontSize.lg, // Minimum 16px to prevent iOS zoom
        boxShadow: isFocused ? `0 0 0 3px ${theFocusColor}26` : b.shadow.sm,
        outline: 'none',
        transition: b.transition.normal,
      }}
      onFocus={handleFocus}
      onBlur={() => setIsFocused(false)}
    />
  );
};

/**
 * Styled Textarea Component
 */
const StyledTextarea = ({ id, value, onChange, placeholder, hasError, rows = 3, focusColor, b }) => {
  const [isFocused, setIsFocused] = useState(false);
  const theFocusColor = focusColor || COLORS.blue[500];

  const handleFocus = (e) => {
    setIsFocused(true);
    scrollIntoViewOnFocus(e);
  };

  return (
    <textarea
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      style={{
        width: '100%',
        minHeight: '100px',
        padding: `${b.space[3]} ${b.space[4]}`,
        borderRadius: b.radius.lg,
        border: `2px solid ${hasError ? COLORS.red[500] : isFocused ? theFocusColor : COLORS.slate[200]}`,
        backgroundColor: 'white',
        color: COLORS.slate[900],
        fontSize: b.fontSize.lg, // Minimum 16px to prevent iOS zoom
        boxShadow: isFocused ? `0 0 0 3px ${theFocusColor}26` : b.shadow.sm,
        outline: 'none',
        transition: b.transition.normal,
        resize: 'none',
      }}
      onFocus={handleFocus}
      onBlur={() => setIsFocused(false)}
    />
  );
};

/**
 * Styled Button Component
 */
const StyledButton = ({ onClick, variant = 'primary', children, className, themedGradient, themedGradientHover, b }) => {
  const [isHovered, setIsHovered] = useState(false);

  const baseStyle = {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: b.space[2],
    padding: `${b.space[3]} ${b.space[6]}`,
    borderRadius: b.radius.lg,
    fontSize: b.fontSize.base,
    fontWeight: 600,
    cursor: 'pointer',
    transition: b.transition.normal,
    border: 'none',
  };

  const variantStyles = {
    primary: {
      background: isHovered ? (themedGradientHover || themedGradient) : themedGradient,
      color: 'white',
      boxShadow: b.shadow.md,
    },
    outline: {
      backgroundColor: isHovered ? '#f8fafc' : 'white',
      color: COLORS.slate[700],
      border: `2px solid ${COLORS.slate[200]}`,
      boxShadow: b.shadow.sm,
    },
  };

  return (
    <button
      onClick={onClick}
      style={{ ...baseStyle, ...variantStyles[variant] }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={className}
    >
      {children}
    </button>
  );
};

/**
 * Dialog to collect variable values from the user before starting roleplay
 */
const RoleplayVariablesDialog = ({ open, scenario, onSubmit, onCancel }) => {
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});

  // Design tokens
  const b = useBranding();

  // Initialize values with defaults when scenario changes
  useEffect(() => {
    if (scenario?.variables_schema) {
      const initialValues = {};

      // Initialize ALL variables (both user_input=true and user_input=false)
      scenario.variables_schema.forEach((varDef) => {
        initialValues[varDef.key] = varDef.default || '';
      });

      setValues(initialValues);
      setErrors({});
    }
  }, [scenario]);

  const handleChange = (key, value) => {
    setValues((prev) => ({
      ...prev,
      [key]: value,
    }));

    // Clear error for this field
    if (errors[key]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  const handleSubmit = () => {
    // Filter to only show variables that require user input
    const userInputVariables = scenario.variables_schema.filter((varDef) => {
      // If user_input is undefined (backward compatibility), default to true
      return varDef.user_input !== false;
    });

    // Validate required fields (only for user input variables)
    const newErrors = {};
    userInputVariables.forEach((varDef) => {
      if (varDef.required && !values[varDef.key]?.trim()) {
        newErrors[varDef.key] = `${varDef.label} ist ein Pflichtfeld`;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Submit ALL values (both user-provided and auto-filled)
    onSubmit(values);
  };

  // Filter to only show variables that require user input
  const userInputVariables = scenario?.variables_schema?.filter((varDef) => {
    // If user_input is undefined (backward compatibility), default to true
    return varDef.user_input !== false;
  }) || [];

  if (!scenario?.variables_schema || scenario.variables_schema.length === 0) {
    // No variables to collect, submit immediately
    if (open) {
      onSubmit({});
    }
    return null;
  }

  // If no variables require user input, submit immediately with auto-filled values
  if (userInputVariables.length === 0) {
    if (open) {
      onSubmit(values);
    }
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle style={{ fontSize: b.fontSize['2xl'], display: 'flex', alignItems: 'center', gap: b.space[3] }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: b.radius.lg,
                background: b.headerGradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles style={{ width: '20px', height: '20px', color: b.headerText }} />
            </div>
            <span style={{ color: COLORS.slate[900] }}>{scenario.title}</span>
          </DialogTitle>
          <DialogDescription style={{ fontSize: b.fontSize.lg, paddingTop: b.space[2], color: COLORS.slate[600] }}>
            Bitte fülle die folgenden Informationen aus, um das Rollenspiel zu starten.
          </DialogDescription>
        </DialogHeader>

        <div
          style={{
            padding: `${b.space[6]} 0`,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: b.space[4],
          }}
        >
          {userInputVariables.map((varDef) => (
            <div
              key={varDef.key}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: b.space[2],
                gridColumn: varDef.type === 'textarea' ? '1 / -1' : 'auto',
              }}
            >
              <label
                htmlFor={varDef.key}
                style={{
                  fontSize: b.fontSize.base,
                  fontWeight: 600,
                  color: COLORS.slate[700],
                }}
              >
                {varDef.label}
                {varDef.required && <span style={{ color: COLORS.red[500], marginLeft: '4px' }}>*</span>}
              </label>

              {varDef.type === 'textarea' ? (
                <StyledTextarea
                  id={varDef.key}
                  value={values[varDef.key] || ''}
                  onChange={(e) => handleChange(varDef.key, e.target.value)}
                  placeholder={varDef.default || `${varDef.label} eingeben...`}
                  hasError={!!errors[varDef.key]}
                  rows={3}
                  focusColor={b.primaryAccent}
                  b={b}
                />
              ) : (
                <StyledInput
                  id={varDef.key}
                  type={varDef.type === 'number' ? 'number' : 'text'}
                  value={values[varDef.key] || ''}
                  onChange={(e) => handleChange(varDef.key, e.target.value)}
                  placeholder={varDef.default || `${varDef.label} eingeben...`}
                  hasError={!!errors[varDef.key]}
                  focusColor={b.primaryAccent}
                  b={b}
                />
              )}

              {errors[varDef.key] && (
                <p style={{ fontSize: b.fontSize.base, color: COLORS.red[500], margin: 0 }}>
                  {errors[varDef.key]}
                </p>
              )}
            </div>
          ))}
        </div>

        <DialogFooter style={{ display: 'flex', flexDirection: 'row', gap: b.space[3], paddingTop: b.space[4] }}>
          <StyledButton onClick={onCancel} variant="outline" b={b}>
            Abbrechen
          </StyledButton>
          <StyledButton
            onClick={handleSubmit}
            variant="primary"
            themedGradient={b.headerGradient}
            themedGradientHover={b.buttonGradientHover}
            b={b}
          >
            <Sparkles style={{ width: '16px', height: '16px' }} />
            Rollenspiel starten
          </StyledButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RoleplayVariablesDialog;
