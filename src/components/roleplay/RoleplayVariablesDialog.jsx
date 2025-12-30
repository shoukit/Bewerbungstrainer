import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/base/dialog';
import { Sparkles, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
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
const StyledInput = ({ id, type, value, onChange, placeholder, hasError, focusColor }) => {
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
      className="w-full h-11 px-4 py-2 rounded-lg bg-white text-slate-900 text-base outline-none transition-all shadow-sm"
      style={{
        border: `2px solid ${hasError ? COLORS.red[500] : isFocused ? (focusColor || COLORS.blue[500]) : COLORS.slate[200]}`,
        boxShadow: isFocused ? `0 0 0 3px ${(focusColor || COLORS.blue[500])}26` : undefined,
      }}
      onFocus={handleFocus}
      onBlur={() => setIsFocused(false)}
    />
  );
};

/**
 * Styled Textarea Component
 */
const StyledTextarea = ({ id, value, onChange, placeholder, hasError, rows = 3, focusColor }) => {
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
      className="w-full min-h-[100px] px-4 py-3 rounded-lg bg-white text-slate-900 text-base outline-none transition-all shadow-sm resize-none"
      style={{
        border: `2px solid ${hasError ? COLORS.red[500] : isFocused ? (focusColor || COLORS.blue[500]) : COLORS.slate[200]}`,
        boxShadow: isFocused ? `0 0 0 3px ${(focusColor || COLORS.blue[500])}26` : undefined,
      }}
      onFocus={handleFocus}
      onBlur={() => setIsFocused(false)}
    />
  );
};

/**
 * Styled Button Component
 */
const StyledButton = ({ onClick, variant = 'primary', children, className, themedGradient, themedGradientHover }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-base font-semibold cursor-pointer transition-all border-none ${
        variant === 'primary'
          ? 'text-white shadow-md'
          : 'bg-white text-slate-700 border-2 border-slate-200 shadow-sm hover:bg-slate-50'
      } ${className || ''}`}
      style={variant === 'primary' ? {
        background: isHovered ? (themedGradientHover || themedGradient) : themedGradient,
      } : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </button>
  );
};

/**
 * Dialog to collect variable values from the user before starting roleplay
 */
const RoleplayVariablesDialog = ({ open, scenario, onSubmit, onCancel, primaryAccent, headerGradient, buttonGradient, buttonGradientHover }) => {
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});

  // Custom variables state (only used if scenario.allow_custom_variables is true)
  const [customVariables, setCustomVariables] = useState([]);
  const [showCustomVariables, setShowCustomVariables] = useState(false);

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
          <DialogTitle className="text-2xl flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: headerGradient }}
            >
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-slate-900">{scenario.title}</span>
          </DialogTitle>
          <DialogDescription className="text-lg pt-2 text-slate-600">
            Bitte fülle die folgenden Informationen aus, um das Rollenspiel zu starten.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
          {userInputVariables.map((varDef) => (
            <div
              key={varDef.key}
              className="flex flex-col gap-2"
              style={{ gridColumn: varDef.type === 'textarea' ? '1 / -1' : 'auto' }}
            >
              <label
                htmlFor={varDef.key}
                className="text-base font-semibold text-slate-700"
              >
                {varDef.label}
                {varDef.required && <span className="text-red-500 ml-1">*</span>}
              </label>

              {varDef.type === 'textarea' ? (
                <StyledTextarea
                  id={varDef.key}
                  value={values[varDef.key] || ''}
                  onChange={(e) => handleChange(varDef.key, e.target.value)}
                  placeholder={varDef.default || `${varDef.label} eingeben...`}
                  hasError={!!errors[varDef.key]}
                  rows={3}
                  focusColor={primaryAccent}
                />
              ) : (
                <StyledInput
                  id={varDef.key}
                  type={varDef.type === 'number' ? 'number' : 'text'}
                  value={values[varDef.key] || ''}
                  onChange={(e) => handleChange(varDef.key, e.target.value)}
                  placeholder={varDef.default || `${varDef.label} eingeben...`}
                  hasError={!!errors[varDef.key]}
                  focusColor={primaryAccent}
                />
              )}

              {errors[varDef.key] && (
                <p className="text-base text-red-500 m-0">
                  {errors[varDef.key]}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Custom Variables Section - only shown if scenario allows */}
        {scenario?.allow_custom_variables && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowCustomVariables(!showCustomVariables)}
              className="flex items-start gap-2 p-0 border-none bg-transparent text-slate-500 text-sm font-medium cursor-pointer text-left"
              style={{ marginBottom: showCustomVariables ? '1rem' : '0' }}
            >
              <span className="flex items-center gap-2 flex-shrink-0">
                {showCustomVariables ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                <Plus size={16} />
              </span>
              <span className="leading-snug">Zusätzliche Variablen hinzufügen (optional)</span>
            </button>

            {showCustomVariables && (
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm text-slate-500 m-0 mb-3">
                  Füge eigene Variablen hinzu, die in das Gespräch einfließen sollen.
                </p>

                {customVariables.length > 0 && (
                  <div className="mb-3">
                    {customVariables.map((cv, index) => (
                      <div key={index} className="bg-white border border-slate-200 rounded-md p-3 mb-3">
                        <div className="flex items-center justify-between mb-2">
                          <input
                            type="text"
                            value={cv.key || ''}
                            onChange={(e) => updateCustomVariable(index, 'key', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                            placeholder="variable_name"
                            className="px-3 py-2 rounded-md border border-slate-200 text-sm font-mono bg-slate-50 flex-1 mr-2"
                          />
                          <button
                            type="button"
                            onClick={() => deleteCustomVariable(index)}
                            className="p-2 border-none bg-transparent cursor-pointer text-red-500 flex items-center justify-center"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                        <textarea
                          value={cv.value || ''}
                          onChange={(e) => updateCustomVariable(index, 'value', e.target.value)}
                          placeholder="Wert eingeben... (mehrzeilig möglich)"
                          rows={3}
                          className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm resize-y min-h-[80px] box-border"
                        />
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={addCustomVariable}
                  className="flex items-center gap-1.5 px-3 py-2 border border-dashed border-slate-300 rounded-md bg-transparent text-slate-600 text-sm cursor-pointer w-full justify-center"
                >
                  <Plus size={16} />
                  Variable hinzufügen
                </button>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex flex-row gap-3 pt-4">
          <StyledButton onClick={onCancel} variant="outline">
            Abbrechen
          </StyledButton>
          <StyledButton
            onClick={handleSubmit}
            variant="primary"
            themedGradient={buttonGradient || headerGradient}
            themedGradientHover={buttonGradientHover}
          >
            <Sparkles className="w-4 h-4" />
            Rollenspiel starten
          </StyledButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RoleplayVariablesDialog;
