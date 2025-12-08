import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Sparkles } from 'lucide-react';

/**
 * Ocean theme colors
 */
const COLORS = {
  blue: { 500: '#4A9EC9', 600: '#3A7FA7', 700: '#2D6485' },
  teal: { 500: '#3DA389', 600: '#2E8A72' },
  slate: { 200: '#e2e8f0', 400: '#94a3b8', 600: '#475569', 700: '#334155', 900: '#0f172a' },
  red: { 500: '#ef4444' },
};

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
const StyledInput = ({ id, type, value, onChange, placeholder, hasError }) => {
  const [isFocused, setIsFocused] = useState(false);

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
        padding: '8px 16px',
        borderRadius: '12px',
        border: `2px solid ${hasError ? COLORS.red[500] : isFocused ? COLORS.blue[500] : COLORS.slate[200]}`,
        backgroundColor: 'white',
        color: COLORS.slate[900],
        fontSize: '16px', // Minimum 16px to prevent iOS zoom
        boxShadow: isFocused ? `0 0 0 3px rgba(74, 158, 201, 0.15)` : '0 1px 2px rgba(0, 0, 0, 0.05)',
        outline: 'none',
        transition: 'all 0.2s',
      }}
      onFocus={handleFocus}
      onBlur={() => setIsFocused(false)}
    />
  );
};

/**
 * Styled Textarea Component
 */
const StyledTextarea = ({ id, value, onChange, placeholder, hasError, rows = 3 }) => {
  const [isFocused, setIsFocused] = useState(false);

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
        padding: '12px 16px',
        borderRadius: '12px',
        border: `2px solid ${hasError ? COLORS.red[500] : isFocused ? COLORS.blue[500] : COLORS.slate[200]}`,
        backgroundColor: 'white',
        color: COLORS.slate[900],
        fontSize: '16px', // Minimum 16px to prevent iOS zoom
        boxShadow: isFocused ? `0 0 0 3px rgba(74, 158, 201, 0.15)` : '0 1px 2px rgba(0, 0, 0, 0.05)',
        outline: 'none',
        transition: 'all 0.2s',
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
const StyledButton = ({ onClick, variant = 'primary', children, className }) => {
  const [isHovered, setIsHovered] = useState(false);

  const baseStyle = {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px 24px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    border: 'none',
  };

  const variantStyles = {
    primary: {
      background: isHovered
        ? `linear-gradient(90deg, ${COLORS.blue[700]} 0%, ${COLORS.teal[600]} 100%)`
        : `linear-gradient(90deg, ${COLORS.blue[600]} 0%, ${COLORS.teal[500]} 100%)`,
      color: 'white',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    },
    outline: {
      backgroundColor: isHovered ? '#f8fafc' : 'white',
      color: COLORS.slate[700],
      border: `2px solid ${COLORS.slate[200]}`,
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
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
          <DialogTitle style={{ fontSize: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: `linear-gradient(135deg, ${COLORS.blue[500]} 0%, ${COLORS.teal[600]} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles style={{ width: '20px', height: '20px', color: 'white' }} />
            </div>
            <span style={{ color: COLORS.slate[900] }}>{scenario.title}</span>
          </DialogTitle>
          <DialogDescription style={{ fontSize: '16px', paddingTop: '8px', color: COLORS.slate[600] }}>
            Bitte fülle die folgenden Informationen aus, um das Rollenspiel zu starten.
          </DialogDescription>
        </DialogHeader>

        <div
          style={{
            padding: '24px 0',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px',
          }}
        >
          {userInputVariables.map((varDef) => (
            <div
              key={varDef.key}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                gridColumn: varDef.type === 'textarea' ? '1 / -1' : 'auto',
              }}
            >
              <label
                htmlFor={varDef.key}
                style={{
                  fontSize: '14px',
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
                />
              ) : (
                <StyledInput
                  id={varDef.key}
                  type={varDef.type === 'number' ? 'number' : 'text'}
                  value={values[varDef.key] || ''}
                  onChange={(e) => handleChange(varDef.key, e.target.value)}
                  placeholder={varDef.default || `${varDef.label} eingeben...`}
                  hasError={!!errors[varDef.key]}
                />
              )}

              {errors[varDef.key] && (
                <p style={{ fontSize: '14px', color: COLORS.red[500], margin: 0 }}>
                  {errors[varDef.key]}
                </p>
              )}
            </div>
          ))}
        </div>

        <DialogFooter style={{ display: 'flex', flexDirection: 'row', gap: '12px', paddingTop: '16px' }}>
          <StyledButton onClick={onCancel} variant="outline">
            Abbrechen
          </StyledButton>
          <StyledButton onClick={handleSubmit} variant="primary">
            <Sparkles style={{ width: '16px', height: '16px' }} />
            Rollenspiel starten
          </StyledButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RoleplayVariablesDialog;
