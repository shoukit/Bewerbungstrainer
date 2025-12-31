import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Sparkles,
  CheckCircle,
  Info,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useBranding } from '@/hooks/useBranding';
import { COLORS } from '@/config/colors';

/**
 * Dynamic Form Field Component
 * Renders appropriate input based on field type from input_configuration
 */
const DynamicFormField = ({ field, value, onChange, error, focusColor, branding }) => {
  const theFocusColor = focusColor || '#4a9ec9';

  const baseInputClasses = "w-full rounded-lg text-base outline-none transition-all";
  const paddingClasses = "px-4 py-3";
  const borderClasses = error ? "border-2 border-red-500" : "border-2 border-slate-200";

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
    const inputClasses = `${baseInputClasses} ${paddingClasses} ${borderClasses} text-slate-900 bg-white`;

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(field.key, e.target.value)}
            placeholder={field.placeholder || ''}
            className={inputClasses}
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
            className={`${inputClasses} resize-vertical min-h-[100px]`}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        );

      case 'select':
        return (
          <select
            value={value || field.default || ''}
            onChange={(e) => onChange(field.key, e.target.value)}
            className={`${inputClasses} cursor-pointer appearance-none pr-11`}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 12px center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '20px',
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
            className={inputClasses}
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
            className={inputClasses}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        );
    }
  };

  return (
    <div className="mb-5">
      <label className="block mb-2 text-sm font-semibold text-slate-700">
        {field.label}
        {field.required && (
          <span className="text-red-500 ml-1">*</span>
        )}
      </label>
      {renderInput()}
      {error && (
        <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </p>
      )}
      {field.hint && !error && (
        <p className="mt-1.5 text-xs text-slate-500 flex items-center gap-1">
          <Info className="w-3.5 h-3.5" />
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

  // Custom variables state (only used if scenario.allow_custom_variables is true)
  const [customVariables, setCustomVariables] = useState([]);
  const [showCustomVariables, setShowCustomVariables] = useState(false);

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

    // Merge form values with custom variables
    const allVariables = { ...formValues };
    customVariables.forEach(cv => {
      if (cv.key && cv.value) {
        allVariables[cv.key] = cv.value;
      }
    });

    // Pass variables to next step
    onNext(allVariables);
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
    <div className="p-6 pb-[200px] max-w-[640px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-2 mb-4 border-none bg-transparent text-slate-600 text-sm cursor-pointer rounded-lg transition-colors hover:bg-slate-100"
        >
          <ArrowLeft className="w-[18px] h-[18px]" />
          Zurück zur Übersicht
        </button>

        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: b.headerGradient }}
          >
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 m-0">
              {scenario.title}
            </h1>
            <p className="text-sm text-slate-600 m-0 mt-1">
              Personalisiere dein Training
            </p>
          </div>
        </div>
      </div>

      {/* Description Card */}
      <div className="py-4 px-5 rounded-lg bg-slate-100 mb-6">
        <p className="text-sm text-slate-700 m-0 leading-relaxed">
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

        {/* Custom Variables Section - only shown if scenario allows */}
        {scenario?.allow_custom_variables && (
          <div className="mt-5 mb-5 pt-5 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowCustomVariables(!showCustomVariables)}
              className="flex items-start gap-2 p-0 border-none bg-transparent text-slate-500 text-sm font-medium cursor-pointer text-left"
              style={{ marginBottom: showCustomVariables ? b.space[4] : '0' }}
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
                  Füge eigene Variablen hinzu, die in das Training einfließen sollen.
                </p>

                {customVariables.length > 0 && (
                  <div className="mb-3">
                    {customVariables.map((cv, index) => (
                      <div key={index} className="bg-white border border-slate-200 rounded-lg p-3 mb-3">
                        <div className="flex items-center justify-between mb-2">
                          <input
                            type="text"
                            value={cv.key || ''}
                            onChange={(e) => updateCustomVariable(index, 'key', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                            placeholder="variable_name"
                            className="p-2 px-3 rounded-lg border border-slate-200 text-sm font-mono bg-slate-50 flex-1 mr-2"
                          />
                          <button
                            type="button"
                            onClick={() => deleteCustomVariable(index)}
                            className="p-2 border-none bg-transparent cursor-pointer text-red-500 flex items-center justify-center"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <textarea
                          value={cv.value || ''}
                          onChange={(e) => updateCustomVariable(index, 'value', e.target.value)}
                          placeholder="Wert der Variable..."
                          rows={2}
                          className="w-full p-2 px-3 rounded-lg border border-slate-200 text-sm resize-vertical"
                        />
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={addCustomVariable}
                  className="flex items-center gap-2 py-2 px-3 border border-dashed border-slate-300 rounded-lg bg-white text-slate-600 text-sm cursor-pointer w-full justify-center"
                >
                  <Plus size={16} />
                  Variable hinzufügen
                </button>
              </div>
            )}
          </div>
        )}

        {/* Session Info */}
        <div className="py-4 px-5 rounded-lg mt-6 mb-6 flex gap-5 flex-wrap" style={{ backgroundColor: b.primaryAccentLight }}>
          <div>
            <span className="text-xs text-slate-500 block">Fragen</span>
            <span className="text-base font-semibold text-slate-900">
              {scenario.question_count_min}-{scenario.question_count_max}
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Zeit pro Frage</span>
            <span className="text-base font-semibold text-slate-900">
              {Math.round(scenario.time_limit_per_question / 60)} Min
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Wiederholen</span>
            <span className="text-base font-semibold text-slate-900">
              {scenario.allow_retry ? 'Erlaubt' : 'Nicht erlaubt'}
            </span>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full py-4 px-6 rounded-xl border-none text-white text-base font-semibold cursor-pointer flex items-center justify-center gap-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg bg-gradient-to-r from-indigo-500 to-violet-500 shadow-primary"
        >
          Weiter
          <ArrowRight className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

export default SimulatorVariablesPage;
