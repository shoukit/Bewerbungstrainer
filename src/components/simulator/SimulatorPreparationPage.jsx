import React, { useMemo } from 'react';
import {
  Mic,
  Clock,
  Lightbulb,
  ArrowRight,
  Target,
  MessageSquare,
  ArrowLeft,
  Brain,
  Info,
  Settings,
  CheckCircle,
} from 'lucide-react';
import MicrophoneSelector from '@/components/device-setup/MicrophoneSelector';
import MicrophoneTestDialog from '@/components/device-setup/MicrophoneTestDialog';
import { useBranding } from '@/hooks/useBranding';
import { Card } from '@/components/ui';
import { Button } from '@/components/ui/base/button';

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
  Target: Target,
  Clock: Clock,
  Mic: Mic,
  MessageSquare: MessageSquare,
  Lightbulb: Lightbulb,
  Brain: Brain,
};

/**
 * SimulatorPreparationPage Component
 *
 * Shows description, device setup, and tips BEFORE variables.
 * This is the first step after selecting a scenario.
 */
const SimulatorPreparationPage = ({
  scenario,
  onBack,
  onNext,
  hasVariables = false,
}) => {
  const [selectedMicrophoneId, setSelectedMicrophoneId] = React.useState(null);
  const [showMicTest, setShowMicTest] = React.useState(false);

  const b = useBranding();

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
      description: `Du hast ${Math.round((scenario?.time_limit_per_question || 120) / 60)} Minuten pro ${isSimulation ? 'Situation' : 'Frage'}. ${isSimulation ? 'Reagiere' : 'Antworte'} präzise, aber ausführlich genug.`,
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
  const generalTips = useMemo(() => {
    if (!scenario?.tips || !Array.isArray(scenario.tips) || scenario.tips.length === 0) {
      return defaultTips;
    }

    return scenario.tips.map((tip, index) => {
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
    });
  }, [scenario?.tips, isSimulation]);

  const handleNext = () => {
    onNext({
      selectedMicrophoneId,
    });
  };

  return (
    <div className="p-6 md:p-8 pb-52 max-w-[700px] mx-auto">
      {/* Header */}
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

      {/* 1. Long Description - "Deine Aufgabe" Card */}
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
                {renderBoldText(scenario.long_description?.replace(/\/n/g, '\n'))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* 2. Tips Section */}
      <Card className="p-5 md:p-6 mb-6">
        <div className="flex items-start gap-3.5 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Lightbulb className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 m-0">
              Tipps für dein Gespräch
            </h3>
            <p className="text-sm text-slate-500 m-0 mt-0.5">
              Beachte diese Hinweise für optimale Ergebnisse
            </p>
          </div>
        </div>

        <div className="grid gap-3">
          {generalTips.map((tip, index) => {
            const TipIcon = tip.icon;
            return (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-xl bg-slate-50"
              >
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  <TipIcon className="w-4 h-4 text-slate-600" />
                </div>
                <div className="pt-0.5">
                  <h4 className="text-sm font-semibold text-slate-900 m-0 mb-0.5">
                    {tip.title}
                  </h4>
                  <p className="text-sm text-slate-600 m-0">
                    {tip.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* 3. Microphone Selection */}
      <Card className="p-5 md:p-6 mb-6">
        <div className="flex items-center gap-2.5 mb-4">
          <Mic className="w-[22px] h-[22px] text-primary" />
          <h3 className="text-base font-semibold text-slate-900 m-0">
            Mikrofon testen
          </h3>
        </div>
        <MicrophoneSelector
          selectedDeviceId={selectedMicrophoneId}
          onDeviceChange={setSelectedMicrophoneId}
          onTestClick={() => setShowMicTest(true)}
        />
      </Card>

      {/* 4. Submit Button */}
      <Button
        onClick={handleNext}
        disabled={!selectedMicrophoneId}
        size="lg"
        className="w-full mb-6 gap-2.5"
      >
        {hasVariables ? 'Weiter zur Konfiguration' : 'Training starten'}
        <ArrowRight className="w-5 h-5" />
      </Button>

      {/* Session Info */}
      <div className="flex items-center justify-center gap-6 text-sm text-slate-400">
        <div className="flex items-center gap-2">
          <MessageSquare size={16} />
          <span>
            {scenario?.question_count_min}-{scenario?.question_count_max} {questionsLabel}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={16} />
          <span>
            {Math.round((scenario?.time_limit_per_question || 120) / 60)} Min/{isSimulation ? 'Situation' : 'Frage'}
          </span>
        </div>
      </div>

      {/* Microphone Test Dialog */}
      <MicrophoneTestDialog
        isOpen={showMicTest}
        onClose={() => setShowMicTest(false)}
        deviceId={selectedMicrophoneId}
      />
    </div>
  );
};

export default SimulatorPreparationPage;
