import React, { useMemo } from 'react';
import {
  Mic,
  Clock,
  Lightbulb,
  Play,
  Target,
  MessageSquare,
  ArrowLeft,
  Brain,
  Info,
  Settings,
  CheckCircle,
} from 'lucide-react';
import MicrophoneSelector from '@/components/device-setup/MicrophoneSelector';
import { useBranding } from '@/hooks/useBranding';

/**
 * Render text with **bold** markdown syntax
 * @param {string} text - Text with **bold** markers
 * @returns {React.ReactNode[]} - Array of text and <strong> elements
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

// Icon mapping for dynamic tips from database
const iconMap = {
  target: Target,
  clock: Clock,
  mic: Mic,
  'message-square': MessageSquare,
  lightbulb: Lightbulb,
  brain: Brain,
  info: Info,
  settings: Settings,
  check: CheckCircle,
  // Fallback aliases
  Target: Target,
  Clock: Clock,
  Mic: Mic,
  MessageSquare: MessageSquare,
  Lightbulb: Lightbulb,
  Brain: Brain,
};

/**
 * Pre-Session View Component
 * Shows preparation tips before starting the interview
 * Order: Microphone test, Start button, then Tips
 */
const PreSessionView = ({
  scenario,
  variables,
  questions,
  onStart,
  onBack,
  selectedMicrophoneId,
  onMicrophoneChange,
  onMicrophoneTest,
  themedGradient,
  primaryAccent,
  primaryAccentLight,
  isLoading,
  branding: brandingProp
}) => {
  // Get branding from hook (self-contained)
  const b = useBranding();
  // Use prop if provided, otherwise use hook values
  const branding = brandingProp || b;

  // Mode-based labels
  const isSimulation = scenario?.mode === 'SIMULATION';
  const questionsLabel = isSimulation ? 'Situationen' : 'Fragen';
  const timePerQuestionLabel = isSimulation ? 'Zeit pro Situation' : 'Zeit pro Frage';

  // Default tips if no custom tips are configured
  const defaultTips = [
    {
      icon: Target,
      title: 'Strukturiert antworten',
      description: 'Nutze die STAR-Methode (Situation, Task, Action, Result) für Beispiele aus deiner Erfahrung.',
    },
    {
      icon: Clock,
      title: 'Zeit im Blick behalten',
      description: `Du hast ${Math.round((scenario.time_limit_per_question || 120) / 60)} Minuten pro ${isSimulation ? 'Situation' : 'Frage'}. ${isSimulation ? 'Reagiere' : 'Antworte'} präzise, aber ausführlich genug.`,
    },
    {
      icon: Mic,
      title: 'Klar und deutlich sprechen',
      description: 'Sprich in normalem Tempo. Kurze Pausen zum Nachdenken sind völlig in Ordnung.',
    },
    {
      icon: MessageSquare,
      title: 'Konkrete Beispiele nennen',
      description: 'Belege deine Aussagen mit konkreten Beispielen und Zahlen wo möglich.',
    },
  ];

  // Use custom tips from scenario if available, otherwise use defaults
  // Supports both string arrays (legacy) and object arrays (new format)
  const generalTips = scenario.tips && Array.isArray(scenario.tips) && scenario.tips.length > 0
    ? scenario.tips.map((tip, index) => {
        // Handle legacy string format: ["Tip text 1", "Tip text 2"]
        if (typeof tip === 'string') {
          return {
            icon: Lightbulb,
            title: `Tipp ${index + 1}`,
            description: tip,
          };
        }
        // Handle new object format: [{icon, title, text}]
        return {
          icon: iconMap[tip.icon] || iconMap[tip.icon?.toLowerCase()] || Lightbulb,
          title: tip.title || `Tipp ${index + 1}`,
          description: tip.text || tip.description || '',
        };
      })
    : defaultTips;

  // Build label lookup and select options from input_configuration
  const { inputConfigLabels, selectOptionsMap } = useMemo(() => {
    if (!scenario?.input_configuration) return { inputConfigLabels: {}, selectOptionsMap: {} };
    try {
      const config = typeof scenario.input_configuration === 'string'
        ? JSON.parse(scenario.input_configuration)
        : scenario.input_configuration;
      if (!Array.isArray(config)) return { inputConfigLabels: {}, selectOptionsMap: {} };

      const labels = {};
      const options = {};

      config.forEach(field => {
        if (field.key && field.label) {
          labels[field.key] = field.label;
        }
        // Store select options for value-to-label lookup
        if (field.type === 'select' && field.options) {
          options[field.key] = field.options;
        }
      });

      return { inputConfigLabels: labels, selectOptionsMap: options };
    } catch (e) {
      return { inputConfigLabels: {}, selectOptionsMap: {} };
    }
  }, [scenario?.input_configuration]);

  /**
   * Get display value for a variable
   * For select fields, returns the label instead of the technical value
   */
  const getDisplayValue = (key, value) => {
    // Skip _label suffix keys (they're already the display value)
    if (key.endsWith('_label')) return null;

    // If there's a _label version in variables, use that
    if (variables[`${key}_label`]) {
      return variables[`${key}_label`];
    }

    // If this is a select field, find the label from options
    if (selectOptionsMap[key]) {
      const option = selectOptionsMap[key].find(opt => opt.value === value);
      if (option) return option.label;
    }

    return value;
  };

  const contextInfo = variables ? Object.entries(variables)
    .filter(([key, value]) => {
      // Skip _label suffix keys
      if (key.endsWith('_label')) return false;
      return value && (typeof value === 'string' ? value.trim() !== '' : true);
    })
    .map(([key, value]) => ({
      // Use German label from input_configuration, fallback to formatted key
      label: inputConfigLabels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: getDisplayValue(key, value)
    }))
    .filter(item => item.value) : [];

  /**
   * Interpolate variables in text (e.g., ${variable_name} -> value)
   */
  const interpolateVariables = (text) => {
    if (!text || !variables) return text;

    let result = text;
    Object.entries(variables).forEach(([key, value]) => {
      if (value) {
        result = result.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), value);
        result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
      }
    });
    return result;
  };

  return (
    <div className="p-6 max-w-[800px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-2 mb-4 border-none bg-transparent cursor-pointer rounded-lg hover:bg-slate-100 transition-colors"
          style={{ color: branding.textSecondary }}
        >
          <ArrowLeft className="w-[18px] h-[18px]" />
          Zurück
        </button>

        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: themedGradient }}
          >
            <Lightbulb className="w-8 h-8 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium m-0 mb-1" style={{ color: branding.primaryAccent }}>
              Vorbereitung{questions.length > 0 ? ` • ${questions.length} ${questionsLabel}` : ''}
            </p>
            <h1 className="text-[24px] font-bold m-0" style={{ color: branding.textMain }}>
              {scenario.title}
            </h1>
          </div>
        </div>
      </div>

      {/* Long Description - Scenario Task Description */}
      {scenario.long_description && (
        <div
          className="p-5 px-6 rounded-2xl mb-6"
          style={{
            backgroundColor: branding.cardBg,
            border: `1px solid ${branding.borderColor}`,
          }}
        >
          <div className="flex items-start gap-3.5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: themedGradient }}
            >
              <Info className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-semibold m-0 mb-2" style={{ color: branding.textMain }}>
                Deine Aufgabe
              </h3>
              <div className="text-[15px] leading-relaxed m-0 whitespace-pre-wrap" style={{ color: branding.textSecondary }}>
                {renderBoldText(interpolateVariables(scenario.long_description?.replace(/\/n/g, '\n')))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Context Info */}
      {contextInfo.length > 0 && (
        <div
          className="p-5 rounded-2xl mb-6"
          style={{ backgroundColor: primaryAccentLight }}
        >
          <h3
            className="text-sm font-semibold m-0 mb-3 uppercase tracking-wide"
            style={{ color: primaryAccent }}
          >
            Dein Profil
          </h3>
          <div className="flex flex-wrap gap-4">
            {contextInfo.map((item, index) => (
              <div key={index}>
                <span className="text-xs block" style={{ color: branding.textMuted }}>
                  {item.label}
                </span>
                <span className="text-[15px] font-medium" style={{ color: branding.textMain }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Microphone Selection - FIRST */}
      <div
        className="p-6 rounded-2xl mb-6"
        style={{
          backgroundColor: branding.cardBg,
          border: `1px solid ${branding.borderColor}`,
        }}
      >
        <div className="flex items-center gap-2.5 mb-4">
          <Mic className="w-[22px] h-[22px]" style={{ color: primaryAccent }} />
          <h2 className="text-lg font-semibold m-0" style={{ color: branding.textMain }}>
            Mikrofon testen
          </h2>
        </div>
        <MicrophoneSelector
          selectedDeviceId={selectedMicrophoneId}
          onDeviceChange={onMicrophoneChange}
          onTestClick={onMicrophoneTest}
        />
      </div>

      {/* Start Button - SECOND (before tips) */}
      <button
        onClick={onStart}
        disabled={isLoading}
        className="w-full py-[18px] px-7 rounded-xl border-none text-white text-lg font-semibold flex items-center justify-center gap-3 mb-6 disabled:cursor-not-allowed disabled:opacity-70 disabled:bg-slate-400 transition-all duration-200 hover:enabled:-translate-y-0.5 hover:enabled:shadow-lg bg-gradient-to-r from-indigo-500 to-violet-500 shadow-primary"
      >
        <Play className="w-6 h-6" />
        Gespräch starten
      </button>

      {/* Tips Section - THIRD */}
      <div
        className="p-6 rounded-2xl mb-6"
        style={{
          backgroundColor: branding.cardBg,
          border: `1px solid ${branding.borderColor}`,
        }}
      >
        <div className="flex items-center gap-2.5 mb-5">
          <Lightbulb className="w-[22px] h-[22px]" style={{ color: branding.warning }} />
          <h2 className="text-lg font-semibold m-0" style={{ color: branding.textMain }}>
            Tipps für dein Gespräch
          </h2>
        </div>

        <div className="flex flex-col gap-4">
          {generalTips.map((tip, index) => (
            <div
              key={index}
              className="flex gap-4 p-4 rounded-xl"
              style={{ backgroundColor: branding.cardBgHover }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: primaryAccentLight }}
              >
                <tip.icon className="w-[22px] h-[22px]" style={{ color: primaryAccent }} />
              </div>
              <div>
                <h4 className="text-[15px] font-semibold m-0 mb-1" style={{ color: branding.textMain }}>
                  {tip.title}
                </h4>
                <p className="text-sm m-0 leading-normal" style={{ color: branding.textSecondary }}>
                  {tip.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Session Info */}
      <div
        className="py-4 px-5 rounded-xl flex gap-6 flex-wrap"
        style={{ backgroundColor: branding.cardBgHover }}
      >
        {questions.length > 0 && (
          <div>
            <span className="text-xs block" style={{ color: branding.textMuted }}>{questionsLabel}</span>
            <span className="text-lg font-semibold" style={{ color: branding.textMain }}>
              {questions.length}
            </span>
          </div>
        )}
        <div>
          <span className="text-xs block" style={{ color: branding.textMuted }}>{timePerQuestionLabel}</span>
          <span className="text-lg font-semibold" style={{ color: branding.textMain }}>
            {Math.round((scenario.time_limit_per_question || 120) / 60)} Min
          </span>
        </div>
        <div>
          <span className="text-xs block" style={{ color: branding.textMuted }}>Wiederholen</span>
          <span className="text-lg font-semibold" style={{ color: branding.textMain }}>
            {scenario.allow_retry ? 'Erlaubt' : 'Nicht erlaubt'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PreSessionView;
