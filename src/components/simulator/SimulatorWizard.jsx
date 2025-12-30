/**
 * SimulatorWizard - Configuration view before starting scenario training
 *
 * Migrated to Tailwind CSS for consistent styling.
 */

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  AlertCircle,
  Sparkles,
  CheckCircle,
  Info,
  Mic,
  Target,
  Lightbulb,
  Clock,
  MessageSquare,
  Brain,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import wordpressAPI from '@/services/wordpress-api';
import MicrophoneSelector from '@/components/device-setup/MicrophoneSelector';
import MicrophoneTestDialog from '@/components/device-setup/MicrophoneTestDialog';
import FullscreenLoader from '@/components/ui/composite/fullscreen-loader';
import DynamicFormField from '@/components/ui/composite/DynamicFormField';
import { usePartner } from '@/context/PartnerContext';
import { Button, Card } from '@/components/ui';

/**
 * Icon mapping for dynamic tip icons from backend
 */
const iconMap = {
  target: Target,
  clock: Clock,
  mic: Mic,
  'message-square': MessageSquare,
  lightbulb: Lightbulb,
  brain: Brain,
  info: Info,
  check: CheckCircle,
  sparkles: Sparkles,
};

/**
 * Default tips when no custom tips are configured
 */
const defaultTips = [
  {
    icon: Target,
    title: 'Strukturiert antworten',
    description: 'Nutze die STAR-Methode (Situation, Task, Action, Result) für Beispiele.',
  },
  {
    icon: Clock,
    title: 'Zeit im Blick',
    description: 'Antworte präzise, aber ausführlich genug.',
  },
  {
    icon: Mic,
    title: 'Klar sprechen',
    description: 'Sprich in normalem Tempo. Pausen sind völlig in Ordnung.',
  },
];

// DynamicFormField is now imported from @/components/ui/DynamicFormField

/**
 * Simulator Wizard Component
 *
 * Renders a dynamic form based on scenario's input_configuration
 * and creates a session with the provided variables
 *
 * If preloadedQuestions is provided, uses those questions instead of generating new ones
 * (used when repeating a session)
 */
const SimulatorWizard = ({ scenario, onBack, onStart, preloadedQuestions }) => {
  const [formValues, setFormValues] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Microphone selection state
  const [selectedMicrophoneId, setSelectedMicrophoneId] = useState(null);
  const [showMicrophoneTest, setShowMicrophoneTest] = useState(false);

  // Custom variables state (only used if scenario.allow_custom_variables is true)
  const [customVariables, setCustomVariables] = useState([]);
  const [showCustomVariables, setShowCustomVariables] = useState(false);

  // Partner demo code
  const { demoCode } = usePartner();

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

  /**
   * Interpolate variables in text (e.g., ${variable_name} -> value)
   * @param {string} text - Text with variable placeholders
   * @param {object} values - Object with variable values
   * @returns {string} - Text with variables replaced
   */
  const interpolateVariables = (text, values) => {
    if (!text) return text;

    let result = text;

    // Replace ${key} and {key} patterns
    Object.entries(values || {}).forEach(([key, value]) => {
      if (value) {
        result = result.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), value);
        result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
      }
    });

    return result;
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Merge form values with custom variables
      const allVariables = { ...formValues };
      customVariables.forEach(cv => {
        if (cv.key && cv.value) {
          allVariables[cv.key] = cv.value;
        }
      });

      // 1. Create session with variables (and optionally preloaded questions)
      const sessionResponse = await wordpressAPI.createSimulatorSession({
        scenario_id: scenario.id,
        variables: allVariables,
        demo_code: demoCode || null,
        // If we have preloaded questions (repeating a session), include them
        questions: preloadedQuestions || null,
      });

      if (!sessionResponse.success) {
        throw new Error(sessionResponse.message || 'Fehler beim Erstellen der Session');
      }

      const session = sessionResponse.data.session;

      // 2. Generate questions only if not preloaded
      let questions;
      if (preloadedQuestions && preloadedQuestions.length > 0) {
        // Use preloaded questions - skip generation
        questions = preloadedQuestions;
        // Update session with questions_json
        await wordpressAPI.updateSimulatorSessionQuestions(session.id, questions);
      } else {
        // Generate new questions
        const questionsResponse = await wordpressAPI.generateSimulatorQuestions(session.id);

        if (!questionsResponse.success) {
          throw new Error(questionsResponse.message || 'Fehler beim Generieren der Fragen');
        }
        questions = questionsResponse.data.questions;
      }

      // 3. Start the session
      onStart({
        session: { ...session, questions_json: questions },
        questions: questions,
        scenario: scenario,
        variables: allVariables,
        selectedMicrophoneId: selectedMicrophoneId,
      });

    } catch (err) {
      console.error('Error starting session:', err);
      setSubmitError(err.message || 'Ein Fehler ist aufgetreten');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 pb-[200px] max-w-[640px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 py-2 px-3 mb-4 border-none bg-transparent text-slate-600 text-base cursor-pointer rounded-md transition-all hover:bg-slate-100"
        >
          <ArrowLeft className="w-[18px] h-[18px]" />
          Zurück zur Übersicht
        </button>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-brand-gradient flex items-center justify-center">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
              {scenario.title}
            </h1>
            <p className="text-base text-slate-600 mt-1">
              Konfiguriere dein Training
            </p>
          </div>
        </div>
      </div>

      {/* Description Card */}
      <div className="py-4 px-5 rounded-xl bg-slate-100 mb-6">
        <p className="text-base text-slate-700 leading-relaxed">
          {scenario.description}
        </p>
      </div>

      {/* Long Description - Detailed task description */}
      {scenario.long_description && (
        <Card className="p-5 md:p-6 mb-6">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-brand-gradient flex items-center justify-center flex-shrink-0">
              <Info className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-slate-900 mb-2">
                Deine Aufgabe
              </h3>
              <p className="text-base leading-relaxed text-slate-700 whitespace-pre-wrap">
                {interpolateVariables(scenario.long_description?.replace(/\/n/g, '\n'), formValues)}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Tips Section */}
      {(() => {
        const tips = scenario.tips && Array.isArray(scenario.tips) && scenario.tips.length > 0
          ? scenario.tips.map((tip, idx) => {
              if (typeof tip === 'string') {
                return { icon: Lightbulb, title: `Tipp ${idx + 1}`, description: tip };
              }
              return {
                icon: iconMap[tip.icon] || iconMap[tip.icon?.toLowerCase()] || Lightbulb,
                title: tip.title || `Tipp ${idx + 1}`,
                description: tip.text || tip.description || '',
              };
            })
          : defaultTips;

        return (
          <Card className="p-5 md:p-6 mb-6">
            <div className="flex items-center gap-2.5 mb-4">
              <Lightbulb className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-slate-900">
                Tipps für dein Training
              </h3>
            </div>
            <div className="flex flex-col gap-3">
              {tips.map((tip, index) => {
                const IconComponent = tip.icon;
                return (
                  <div key={index} className="flex items-start gap-3 p-3 md:p-4 rounded-lg bg-slate-50">
                    <div className="w-8 h-8 rounded-md bg-brand-gradient flex items-center justify-center flex-shrink-0">
                      <IconComponent className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 text-base mb-0.5">
                        {tip.title}
                      </h4>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {tip.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })()}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {inputConfig.length > 0 ? (
          inputConfig.map(field => (
            <DynamicFormField
              key={field.key}
              field={field}
              value={formValues[field.key]}
              onChange={handleChange}
              error={errors[field.key]}
            />
          ))
        ) : (
          <div className="p-6 text-center text-slate-500">
            <CheckCircle className="w-8 h-8 mb-3 mx-auto opacity-50" />
            <p>Keine zusätzliche Konfiguration erforderlich.</p>
          </div>
        )}

        {/* Custom Variables Section - only shown if scenario allows */}
        {scenario?.allow_custom_variables && (
          <div className="my-5 pt-5 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowCustomVariables(!showCustomVariables)}
              className={`flex items-start gap-2 p-0 border-none bg-transparent text-slate-500 text-sm font-medium cursor-pointer text-left ${showCustomVariables ? 'mb-4' : ''}`}
            >
              <span className="flex items-center gap-2 flex-shrink-0">
                {showCustomVariables ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                <Plus size={16} />
              </span>
              <span className="leading-relaxed">Zusätzliche Variablen hinzufügen (optional)</span>
            </button>

            {showCustomVariables && (
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-sm text-slate-500 mb-3">
                  Füge eigene Variablen hinzu, die in die Fragen-Generierung und Feedback einfließen sollen.
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
                            className="flex-1 py-2 px-3 rounded-lg border border-slate-200 text-sm font-mono bg-slate-50 mr-2"
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
                          className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm resize-y min-h-[80px] box-border"
                        />
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={addCustomVariable}
                  className="flex items-center gap-1.5 py-2 px-3 border border-dashed border-slate-300 rounded-lg bg-transparent text-slate-600 text-sm cursor-pointer w-full justify-center hover:border-primary hover:text-primary transition-colors"
                >
                  <Plus size={16} />
                  Variable hinzufügen
                </button>
              </div>
            )}
          </div>
        )}

        {/* Session Info */}
        <div className="py-4 px-5 rounded-xl bg-primary/10 my-6 flex flex-wrap gap-5">
          <div>
            <span className="text-xs text-slate-500 block">Fragen</span>
            <span className="text-lg font-semibold text-slate-900">
              {scenario.question_count_min}-{scenario.question_count_max}
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Zeit pro Frage</span>
            <span className="text-lg font-semibold text-slate-900">
              {Math.round(scenario.time_limit_per_question / 60)} Min
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Wiederholen</span>
            <span className="text-lg font-semibold text-slate-900">
              {scenario.allow_retry ? 'Erlaubt' : 'Nicht erlaubt'}
            </span>
          </div>
        </div>

        {/* Microphone Selection */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-2.5 mb-4">
            <Mic className="w-[22px] h-[22px] text-primary" />
            <h3 className="text-lg font-semibold text-slate-900">
              Mikrofon auswählen
            </h3>
          </div>
          <MicrophoneSelector
            selectedDeviceId={selectedMicrophoneId}
            onDeviceChange={setSelectedMicrophoneId}
            onTestClick={() => setShowMicrophoneTest(true)}
          />
        </Card>

        {/* Error Message */}
        {submitError && (
          <div className="py-3 px-4 rounded-xl bg-red-100 text-red-500 mb-5 flex items-center gap-2">
            <AlertCircle className="w-[18px] h-[18px]" />
            {submitError}
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isSubmitting}
          size="lg"
          fullWidth
          iconPosition="right"
          icon={<ArrowRight className="w-5 h-5" />}
        >
          Training starten
        </Button>
      </form>

      {/* Microphone Test Dialog */}
      <MicrophoneTestDialog
        isOpen={showMicrophoneTest}
        onClose={() => setShowMicrophoneTest(false)}
        deviceId={selectedMicrophoneId}
      />

      {/* Fullscreen Loading Overlay */}
      <FullscreenLoader
        isLoading={isSubmitting}
        message="Fragen werden generiert..."
        subMessage="Die KI erstellt personalisierte Fragen basierend auf deinen Angaben."
      />
    </div>
  );
};

export default SimulatorWizard;
