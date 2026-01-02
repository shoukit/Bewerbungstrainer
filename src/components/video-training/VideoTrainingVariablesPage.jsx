import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Video,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/base/button';
import { Input } from '@/components/ui/base/input';
import { Textarea } from '@/components/ui/base/textarea';

/**
 * Dynamic Form Field Component
 */
const DynamicFormField = ({ field, value, onChange, error, focusColor }) => {
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
              ?.slice() // Create a copy to avoid mutating the original
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
 * VideoTrainingVariablesPage Component
 *
 * Collects variable inputs for the video training scenario.
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
    <div className="p-6 pb-52 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Button
          onClick={onBack}
          variant="ghost"
          className="inline-flex items-center gap-2 px-3 py-2 mb-4 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück zur Übersicht
        </Button>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-brand-gradient flex items-center justify-center">
            <Video className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 m-0">
              {scenario.title}
            </h1>
            <p className="text-sm text-slate-600 mt-1 mb-0">
              Personalisiere dein Training
            </p>
          </div>
        </div>
      </div>

      {/* Description Card */}
      {scenario.description && (
        <div className="p-4 px-5 rounded-xl bg-slate-100 mb-6">
          <p className="text-sm text-slate-700 m-0 leading-relaxed">
            {scenario.description}
          </p>
        </div>
      )}

      {/* Info Box */}
      <div className="p-4 px-5 rounded-xl bg-primary/10 mb-6 flex items-start gap-3">
        <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-slate-900 m-0 mb-1">
            So funktioniert es
          </p>
          <p className="text-[13px] text-slate-600 m-0 leading-normal">
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
          />
        ))}

        {/* Submit Button */}
        <Button
          type="submit"
          size="lg"
          className="w-full mt-6 gap-2.5"
        >
          Weiter
          <ArrowRight className="w-5 h-5" />
        </Button>
      </form>
    </div>
  );
};

export default VideoTrainingVariablesPage;
