import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Info,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/base/button';
import { Input } from '@/components/ui/base/input';
import { Textarea } from '@/components/ui/base/textarea';
import { Card } from '@/components/ui';

/**
 * Helper function to get the display label for a field value
 * For select fields, returns the label instead of the technical value
 */
const getDisplayValue = (field, value) => {
  if (!value) return null;

  if (field.type === 'select' && field.options) {
    const option = field.options.find(opt => opt.value === value);
    return option ? option.label : value;
  }

  return value;
};

/**
 * Dynamic Form Field Component
 */
const DynamicFormField = ({ field, value, onChange, error }) => {
  const handleFocus = (e) => {
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

  const renderInput = () => {
    const baseClassName = error ? "border-red-500" : "";

    switch (field.type) {
      case 'text':
        return (
          <Input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(field.key, e.target.value)}
            placeholder={field.placeholder || ''}
            className={baseClassName}
            onFocus={handleFocus}
          />
        );

      case 'textarea':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => onChange(field.key, e.target.value)}
            placeholder={field.placeholder || ''}
            rows={4}
            className={`${baseClassName} min-h-[100px] resize-y`}
            onFocus={handleFocus}
          />
        );

      case 'select':
        return (
          <select
            value={value || field.default || ''}
            onChange={(e) => onChange(field.key, e.target.value)}
            className={`w-full px-4 py-3 rounded-xl border-2 text-base text-slate-900 bg-white outline-none transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3e%3cpath stroke=%27%236b7280%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3e%3c/svg%3e')] bg-[position:right_12px_center] bg-no-repeat bg-[length:20px] pr-11 focus:border-primary focus:ring-2 focus:ring-primary/20 ${error ? 'border-red-500' : 'border-slate-200'}`}
            onFocus={handleFocus}
          >
            {!field.default && <option value="">Bitte wählen...</option>}
            {field.options
              ?.slice()
              .sort((a, b) => a.label.localeCompare(b.label, 'de'))
              .map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(field.key, e.target.value)}
            placeholder={field.placeholder || ''}
            min={field.validation?.min}
            max={field.validation?.max}
            className={baseClassName}
            onFocus={handleFocus}
          />
        );

      default:
        return (
          <Input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(field.key, e.target.value)}
            placeholder={field.placeholder || ''}
            className={baseClassName}
            onFocus={handleFocus}
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
        <p className="mt-1.5 text-[13px] text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </p>
      )}
      {field.hint && !error && (
        <p className="mt-1.5 text-[13px] text-slate-500 flex items-center gap-1">
          <Info className="w-3.5 h-3.5" />
          {field.hint}
        </p>
      )}
    </div>
  );
};

/**
 * Profile Summary Component
 * Shows selected values with labels (not technical values)
 */
const ProfileSummary = ({ inputConfig, formValues }) => {
  const filledFields = inputConfig.filter(field => {
    const value = formValues[field.key];
    return value && (typeof value !== 'string' || value.trim() !== '');
  });

  if (filledFields.length === 0) return null;

  return (
    <Card className="p-4 mb-5 bg-slate-50 border-slate-200">
      <div className="text-xs font-semibold text-primary uppercase tracking-wide mb-3">
        Dein Profil
      </div>
      <div className="space-y-2">
        {filledFields.map(field => (
          <div key={field.key} className="flex flex-col">
            <span className="text-xs text-slate-500">{field.label}</span>
            <span className="text-sm font-medium text-slate-900">
              {getDisplayValue(field, formValues[field.key])}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
};

/**
 * VideoTrainingVariablesPage Component
 *
 * Simple form-only page for collecting variables.
 * Description and device setup are handled in PreparationPage.
 */
const VideoTrainingVariablesPage = ({ scenario, onBack, onNext }) => {
  const [formValues, setFormValues] = useState({});
  const [errors, setErrors] = useState({});

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

    // Build variables object with both values and labels for display
    const variables = { ...formValues };

    // Add _label suffix for select fields to store the display label
    inputConfig.forEach(field => {
      if (field.type === 'select' && formValues[field.key]) {
        variables[`${field.key}_label`] = getDisplayValue(field, formValues[field.key]);
      }
    });

    onNext(variables);
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
    <div className="p-6 md:p-8 pb-52 max-w-[700px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 bg-transparent border-none text-slate-500 cursor-pointer text-sm py-2 mb-4 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft size={18} />
          Zurück
        </button>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-gradient flex items-center justify-center">
            <User size={32} className="text-white" />
          </div>
          <div>
            <h1 className="text-[28px] font-bold text-slate-900 m-0">
              Personalisierung
            </h1>
            <p className="text-base text-slate-500 m-0 mt-1">
              {scenario?.title}
            </p>
          </div>
        </div>
      </div>

      {/* Profile Summary - Shows filled values with labels */}
      <ProfileSummary inputConfig={inputConfig} formValues={formValues} />

      {/* Form Card */}
      <Card className="p-5 md:p-6 mb-6">
        <div className="flex items-start gap-3.5 mb-5">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 m-0">
              Dein Profil anpassen
            </h3>
            <p className="text-sm text-slate-500 m-0 mt-0.5">
              Diese Informationen personalisieren die Fragen
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} id="variables-form">
          {inputConfig.map(field => (
            <DynamicFormField
              key={field.key}
              field={field}
              value={formValues[field.key]}
              onChange={handleChange}
              error={errors[field.key]}
            />
          ))}
        </form>
      </Card>

      {/* Submit Button */}
      <Button
        type="submit"
        form="variables-form"
        size="lg"
        className="w-full gap-2.5"
      >
        Video-Training starten
        <ArrowRight className="w-5 h-5" />
      </Button>
    </div>
  );
};

export default VideoTrainingVariablesPage;
