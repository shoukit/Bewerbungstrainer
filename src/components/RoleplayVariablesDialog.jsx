import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Sparkles, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
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

  // Custom variables state (only used if scenario.allow_custom_variables is true)
  const [customVariables, setCustomVariables] = useState([]);
  const [showCustomVariables, setShowCustomVariables] = useState(false);

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

  // Custom variables handlers
  const addCustomVariable = () => {
    setCustomVariables(prev => [...prev, { key: '', value: '' }]);
  };

  const updateCustomVariable = (index, field, value) => {
    setCustomVariables(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const deleteCustomVariable = (index) => {
    setCustomVariables(prev => prev.filter((_, i) => i !== index));
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

    // Merge standard values with custom variables
    const allValues = { ...values };
    customVariables.forEach(cv => {
      if (cv.key && cv.value) {
        allValues[cv.key] = cv.value;
      }
    });

    // Submit ALL values (both user-provided, auto-filled, and custom)
    onSubmit(allValues);
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

        {/* Custom Variables Section - only shown if scenario allows */}
        {scenario?.allow_custom_variables && (
          <div style={{
            marginTop: b.space[4],
            paddingTop: b.space[4],
            borderTop: `1px solid ${COLORS.slate[200]}`,
          }}>
            <button
              type="button"
              onClick={() => setShowCustomVariables(!showCustomVariables)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: b.space[2],
                padding: '0',
                border: 'none',
                background: 'none',
                color: COLORS.slate[500],
                fontSize: b.fontSize.sm,
                fontWeight: 500,
                cursor: 'pointer',
                marginBottom: showCustomVariables ? b.space[4] : '0',
                textAlign: 'left',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: b.space[2], flexShrink: 0 }}>
                {showCustomVariables ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                <Plus size={16} />
              </span>
              <span style={{ lineHeight: '1.4' }}>Zusätzliche Variablen hinzufügen (optional)</span>
            </button>

            {showCustomVariables && (
              <div style={{
                backgroundColor: COLORS.slate[50],
                borderRadius: b.radius.lg,
                padding: b.space[4],
              }}>
                <p style={{
                  fontSize: b.fontSize.sm,
                  color: COLORS.slate[500],
                  margin: `0 0 ${b.space[3]} 0`,
                }}>
                  Füge eigene Variablen hinzu, die in das Gespräch einfließen sollen.
                </p>

                {customVariables.length > 0 && (
                  <div style={{ marginBottom: b.space[3] }}>
                    {customVariables.map((cv, index) => (
                      <div key={index} style={{
                        backgroundColor: 'white',
                        border: `1px solid ${COLORS.slate[200]}`,
                        borderRadius: b.radius.md,
                        padding: b.space[3],
                        marginBottom: b.space[3],
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: b.space[2],
                        }}>
                          <input
                            type="text"
                            value={cv.key || ''}
                            onChange={(e) => updateCustomVariable(index, 'key', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                            placeholder="variable_name"
                            style={{
                              padding: `${b.space[2]} ${b.space[3]}`,
                              borderRadius: b.radius.md,
                              border: `1px solid ${COLORS.slate[200]}`,
                              fontSize: b.fontSize.sm,
                              fontFamily: 'monospace',
                              backgroundColor: COLORS.slate[50],
                              flex: 1,
                              marginRight: b.space[2],
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => deleteCustomVariable(index)}
                            style={{
                              padding: b.space[2],
                              border: 'none',
                              backgroundColor: 'transparent',
                              cursor: 'pointer',
                              color: '#ef4444',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                        <textarea
                          value={cv.value || ''}
                          onChange={(e) => updateCustomVariable(index, 'value', e.target.value)}
                          placeholder="Wert eingeben... (mehrzeilig möglich)"
                          rows={3}
                          style={{
                            width: '100%',
                            padding: `${b.space[2]} ${b.space[3]}`,
                            borderRadius: b.radius.md,
                            border: `1px solid ${COLORS.slate[200]}`,
                            fontSize: b.fontSize.sm,
                            resize: 'vertical',
                            minHeight: '80px',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={addCustomVariable}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: b.space[1.5],
                    padding: `${b.space[2]} ${b.space[3]}`,
                    border: `1px dashed ${COLORS.slate[300]}`,
                    borderRadius: b.radius.md,
                    background: 'transparent',
                    color: COLORS.slate[600],
                    fontSize: b.fontSize.sm,
                    cursor: 'pointer',
                    width: '100%',
                    justifyContent: 'center',
                  }}
                >
                  <Plus size={16} />
                  Variable hinzufügen
                </button>
              </div>
            )}
          </div>
        )}

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
