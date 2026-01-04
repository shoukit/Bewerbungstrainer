import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Video,
  Info,
  Target,
  Lightbulb,
  Mic,
  Camera,
  Clock,
  CheckCircle,
  MessageSquare,
  Settings,
  Sparkles,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/base/button';
import { Input } from '@/components/ui/base/input';
import { Textarea } from '@/components/ui/base/textarea';
import { Card } from '@/components/ui';

/**
 * Render text with **bold** markdown syntax
 */
const renderBoldText = (text) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

/**
 * Icon mapping for dynamic tip icons from backend
 */
const iconMap = {
  target: Target,
  clock: Clock,
  mic: Mic,
  camera: Camera,
  video: Video,
  'message-square': MessageSquare,
  lightbulb: Lightbulb,
  brain: Lightbulb,
  info: Info,
  settings: Settings,
  check: CheckCircle,
  sparkles: Sparkles,
  user: User,
  x: AlertCircle,
};

/**
 * Default tips for video training
 */
const defaultVideoTips = [
  { icon: 'camera', text: 'Schaue direkt in die Kamera für Augenkontakt.' },
  { icon: 'lightbulb', text: 'Achte auf gute Beleuchtung von vorne.' },
  { icon: 'target', text: 'Struktur: Wer → Was → Warum.' },
  { icon: 'mic', text: 'Sprich deutlich und in ruhigem Tempo.' },
];

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
 * VideoTrainingVariablesPage Component
 *
 * Layout matches SimulatorWizard for consistency.
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

  // Get tips from scenario or use defaults
  const tips = scenario?.tips && Array.isArray(scenario.tips) && scenario.tips.length > 0
    ? scenario.tips
    : defaultVideoTips;

  return (
    <div className="p-6 md:p-8 pb-52 max-w-[700px] mx-auto">
      {/* Header - matches SimulatorWizard */}
      <div className="mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 bg-transparent border-none text-slate-500 cursor-pointer text-sm py-2 mb-4 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft size={18} />
          Zurück zur Übersicht
        </button>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-gradient flex items-center justify-center">
            <Lightbulb size={32} className="text-white" />
          </div>
          <div>
            <h1 className="text-[28px] font-bold text-slate-900 m-0">
              Vorbereitung
            </h1>
            <p className="text-base text-slate-500 m-0 mt-1">
              {scenario?.title}
            </p>
          </div>
        </div>
      </div>

      {/* Long Description - "Deine Aufgabe" Card */}
      {scenario?.long_description && (
        <Card className="p-5 md:p-6 mb-6">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center flex-shrink-0">
              <Info className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 m-0 mb-2">
                Deine Aufgabe
              </h3>
              <div className="text-[15px] leading-relaxed text-slate-600 m-0 whitespace-pre-wrap">
                {renderBoldText(scenario.long_description)}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Form Card - "Dein Profil" */}
      <Card className="p-5 md:p-6 mb-6">
        <div className="flex items-start gap-3.5 mb-5">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 m-0">
              Dein Profil
            </h3>
            <p className="text-sm text-slate-500 m-0 mt-0.5">
              Personalisiere dein Training
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

      {/* Submit Button - Before Tips */}
      <Button
        type="submit"
        form="variables-form"
        size="lg"
        className="w-full mb-6 gap-2.5"
      >
        Weiter
        <ArrowRight className="w-5 h-5" />
      </Button>

      {/* Tips Section - After Button */}
      {tips.length > 0 && (
        <Card className="p-5 md:p-6 mb-6">
          <div className="flex items-start gap-3.5 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 m-0">
                Tipps für dein Training
              </h3>
              <p className="text-sm text-slate-500 m-0 mt-0.5">
                Beachte diese Hinweise für optimale Ergebnisse
              </p>
            </div>
          </div>

          <div className="grid gap-3">
            {tips.map((tip, index) => {
              const IconComponent = iconMap[tip.icon] || iconMap[tip.icon?.toLowerCase()] || Lightbulb;
              return (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-xl bg-slate-50"
                >
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                    <IconComponent className="w-4 h-4 text-slate-600" />
                  </div>
                  <p className="text-sm text-slate-700 m-0 pt-1">
                    {tip.text || tip.description}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Session Info */}
      <div className="flex items-center justify-center gap-6 text-sm text-slate-400">
        <div className="flex items-center gap-2">
          <MessageSquare size={16} />
          <span>{scenario?.question_count || 5} Fragen</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={16} />
          <span>~{Math.ceil(((scenario?.question_count || 5) * (scenario?.time_limit_per_question || 90)) / 60)} Min.</span>
        </div>
      </div>
    </div>
  );
};

export default VideoTrainingVariablesPage;
