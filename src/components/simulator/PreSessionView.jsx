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
  branding
}) => {
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

  // Build label lookup from input_configuration
  const inputConfigLabels = useMemo(() => {
    if (!scenario?.input_configuration) return {};
    try {
      const config = typeof scenario.input_configuration === 'string'
        ? JSON.parse(scenario.input_configuration)
        : scenario.input_configuration;
      if (!Array.isArray(config)) return {};
      return config.reduce((acc, field) => {
        if (field.key && field.label) {
          acc[field.key] = field.label;
        }
        return acc;
      }, {});
    } catch (e) {
      return {};
    }
  }, [scenario?.input_configuration]);

  const contextInfo = variables ? Object.entries(variables)
    .filter(([key, value]) => value && value.trim && value.trim() !== '')
    .map(([key, value]) => ({
      // Use German label from input_configuration, fallback to formatted key
      label: inputConfigLabels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: value
    })) : [];

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
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <button
          onClick={onBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            marginBottom: '16px',
            border: 'none',
            background: 'transparent',
            color: branding.textSecondary,
            fontSize: '14px',
            cursor: 'pointer',
            borderRadius: '8px',
          }}
        >
          <ArrowLeft style={{ width: '18px', height: '18px' }} />
          Zurück
        </button>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: themedGradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Lightbulb style={{ width: '32px', height: '32px', color: 'white' }} />
          </div>
          <div>
            <h1 style={{
              fontSize: '28px',
              fontWeight: 700,
              color: branding.textMain,
              margin: 0,
            }}>
              Vorbereitung
            </h1>
            <p style={{
              fontSize: '16px',
              color: branding.textSecondary,
              margin: '4px 0 0 0',
            }}>
              {scenario.title}{questions.length > 0 ? ` • ${questions.length} ${questionsLabel}` : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Long Description - Scenario Task Description */}
      {scenario.long_description && (
        <div style={{
          padding: '20px 24px',
          borderRadius: '16px',
          backgroundColor: branding.cardBg,
          border: `1px solid ${branding.borderColor}`,
          marginBottom: '24px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px',
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: themedGradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Info style={{ width: '20px', height: '20px', color: 'white' }} />
            </div>
            <div>
              <h3 style={{
                fontSize: '16px',
                fontWeight: 600,
                color: branding.textMain,
                margin: '0 0 8px 0',
              }}>
                Deine Aufgabe
              </h3>
              <p style={{
                fontSize: '15px',
                lineHeight: '1.6',
                color: branding.textSecondary,
                margin: 0,
                whiteSpace: 'pre-wrap',
              }}>
                {interpolateVariables(scenario.long_description?.replace(/\/n/g, '\n'))}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Context Info */}
      {contextInfo.length > 0 && (
        <div style={{
          padding: '20px',
          borderRadius: '16px',
          backgroundColor: primaryAccentLight,
          marginBottom: '24px',
        }}>
          <h3 style={{
            fontSize: '14px',
            fontWeight: 600,
            color: primaryAccent,
            margin: '0 0 12px 0',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            Dein Profil
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
            {contextInfo.map((item, index) => (
              <div key={index}>
                <span style={{ fontSize: '12px', color: branding.textMuted, display: 'block' }}>
                  {item.label}
                </span>
                <span style={{ fontSize: '15px', fontWeight: 500, color: branding.textMain }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Microphone Selection - FIRST */}
      <div style={{
        padding: '24px',
        borderRadius: '16px',
        backgroundColor: branding.cardBg,
        border: `1px solid ${branding.borderColor}`,
        marginBottom: '24px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '16px',
        }}>
          <Mic style={{ width: '22px', height: '22px', color: primaryAccent }} />
          <h2 style={{
            fontSize: '18px',
            fontWeight: 600,
            color: branding.textMain,
            margin: 0,
          }}>
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
        style={{
          width: '100%',
          padding: '18px 28px',
          borderRadius: '14px',
          border: 'none',
          background: isLoading ? branding.borderColor : themedGradient,
          color: 'white',
          fontSize: '18px',
          fontWeight: 600,
          cursor: isLoading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          boxShadow: isLoading ? 'none' : `0 4px 12px ${primaryAccent}4d`,
          marginBottom: '24px',
          opacity: isLoading ? 0.7 : 1,
        }}
      >
        <Play style={{ width: '24px', height: '24px' }} />
        Gespräch starten
      </button>

      {/* Tips Section - THIRD */}
      <div style={{
        padding: '24px',
        borderRadius: '16px',
        backgroundColor: branding.cardBg,
        border: `1px solid ${branding.borderColor}`,
        marginBottom: '24px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '20px',
        }}>
          <Lightbulb style={{ width: '22px', height: '22px', color: branding.warning }} />
          <h2 style={{
            fontSize: '18px',
            fontWeight: 600,
            color: branding.textMain,
            margin: 0,
          }}>
            Tipps für dein Gespräch
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {generalTips.map((tip, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                gap: '16px',
                padding: '16px',
                borderRadius: '12px',
                backgroundColor: branding.cardBgHover,
              }}
            >
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: primaryAccentLight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <tip.icon style={{ width: '22px', height: '22px', color: primaryAccent }} />
              </div>
              <div>
                <h4 style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  color: branding.textMain,
                  margin: '0 0 4px 0',
                }}>
                  {tip.title}
                </h4>
                <p style={{
                  fontSize: '14px',
                  color: branding.textSecondary,
                  margin: 0,
                  lineHeight: 1.5,
                }}>
                  {tip.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Session Info */}
      <div style={{
        padding: '16px 20px',
        borderRadius: '12px',
        backgroundColor: branding.cardBgHover,
        display: 'flex',
        gap: '24px',
        flexWrap: 'wrap',
      }}>
        {questions.length > 0 && (
          <div>
            <span style={{ fontSize: '12px', color: branding.textMuted, display: 'block' }}>{questionsLabel}</span>
            <span style={{ fontSize: '18px', fontWeight: 600, color: branding.textMain }}>
              {questions.length}
            </span>
          </div>
        )}
        <div>
          <span style={{ fontSize: '12px', color: branding.textMuted, display: 'block' }}>{timePerQuestionLabel}</span>
          <span style={{ fontSize: '18px', fontWeight: 600, color: branding.textMain }}>
            {Math.round((scenario.time_limit_per_question || 120) / 60)} Min
          </span>
        </div>
        <div>
          <span style={{ fontSize: '12px', color: branding.textMuted, display: 'block' }}>Wiederholen</span>
          <span style={{ fontSize: '18px', fontWeight: 600, color: branding.textMain }}>
            {scenario.allow_retry ? 'Erlaubt' : 'Nicht erlaubt'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PreSessionView;
