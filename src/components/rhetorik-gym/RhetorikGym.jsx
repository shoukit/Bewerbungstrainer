/**
 * RhetorikGym - Dashboard Component
 *
 * Main interface for the Rhetorik-Gym "Füllwort-Killer" game.
 * Migrated to Tailwind CSS + themed components for consistent styling.
 */

import React, { useState, useEffect } from 'react';
import { useMobile } from '@/hooks/useMobile';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Rocket,
  Shuffle,
  Zap,
  Trophy,
  Target,
  Clock,
  Play,
  TrendingUp,
  Dumbbell,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  MessageCircle,
  Mic,
} from 'lucide-react';
import { GAME_MODES } from '@/config/prompts/gamePrompts';
import wordpressAPI from '@/services/wordpress-api';
import MicrophoneSelector from '@/components/device-setup/MicrophoneSelector';
import MicrophoneTestDialog from '@/components/device-setup/MicrophoneTestDialog';
import { Button, Card } from '@/components/ui';
import { ScenarioCard, ScenarioCardGrid, ViewToggle } from '@/components/ui/composite/ScenarioCard';
import FeatureInfoModal from '@/components/global/FeatureInfoModal';

/**
 * Icon mapping for game modes
 */
const ICON_MAP = {
  rocket: Rocket,
  shuffle: Shuffle,
  zap: Zap,
};

// ================== SUB-COMPONENTS ==================

/**
 * Stats Card Component - Clean Professional Design
 */
const StatsCard = ({ icon: Icon, label, value, isMobile }) => (
  <Card className="p-4 md:p-6 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5">
    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex-center mb-3 shadow-sm">
      <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
    </div>
    <div className="text-2xl md:text-3xl font-bold text-slate-900">{value}</div>
    <div className="text-xs md:text-sm text-slate-500 font-medium">{label}</div>
  </Card>
);

/**
 * Topic Selection Screen Component - Uses Tailwind + themed Button
 */
const TopicSelectionScreen = ({ mode, onBack, onStart }) => {
  const [topic, setTopic] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedMicrophoneId, setSelectedMicrophoneId] = useState(null);
  const [showMicrophoneTest, setShowMicrophoneTest] = useState(false);
  const IconComponent = ICON_MAP[mode.icon] || Rocket;

  // Initialize topic
  useEffect(() => {
    if (mode.id === 'klassiker') {
      setTopic(mode.topic);
    } else if (mode.getTopic) {
      setTopic(mode.getTopic());
    }
  }, [mode]);

  const handleSpin = () => {
    if (!mode.getTopic) return;

    setIsSpinning(true);
    const spinDuration = 1500;
    const spinInterval = 100;
    let elapsed = 0;

    const interval = setInterval(() => {
      setTopic(mode.getTopic());
      elapsed += spinInterval;

      if (elapsed >= spinDuration) {
        clearInterval(interval);
        setIsSpinning(false);
      }
    }, spinInterval);
  };

  const handleStart = () => {
    onStart({
      mode,
      topic,
      duration: mode.duration,
      selectedMicrophoneId,
    });
  };

  return (
    <div className="min-h-full flex flex-col p-6">
      {/* Back Button */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <Button variant="secondary" size="sm" icon={<ArrowLeft />} onClick={onBack} className="mb-8 w-fit">
          Zurück zur Auswahl
        </Button>
      </motion.div>

      {/* Center Content */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-[600px] mx-auto w-full">
        {/* Mode Icon & Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8"
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex-center mx-auto mb-5 shadow-lg">
            <IconComponent className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{mode.title}</h1>
          <p className="text-base text-slate-500">
            {mode.duration} Sekunden • {mode.subtitle}
          </p>
        </motion.div>

        {/* Topic Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="w-full bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-8 mb-6 shadow-card"
        >
          {/* Topic Label */}
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-2.5 text-white/90">
              <MessageCircle className="w-5 h-5" />
              <span className="font-semibold text-base">
                {mode.id === 'klassiker' ? 'Deine Aufgabe' : mode.id === 'stress' ? 'Die Frage' : 'Dein Thema'}
              </span>
            </div>

            {/* Spin Button (only for random modes) */}
            {mode.getTopic && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSpin}
                disabled={isSpinning}
                className="btn-glass flex items-center gap-2 px-4 py-2.5 border border-white/30 rounded-lg text-sm font-semibold disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
                {isSpinning ? 'Dreht...' : 'Neu würfeln'}
              </motion.button>
            )}
          </div>

          {/* Topic Text */}
          <AnimatePresence mode="wait">
            <motion.p
              key={topic}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-2xl font-semibold text-white leading-relaxed min-h-[66px]"
            >
              "{topic}"
            </motion.p>
          </AnimatePresence>
        </motion.div>

        {/* Microphone Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="w-full mb-6 shadow-card">
            <div className="flex items-center gap-2.5 mb-4 text-slate-700">
              <Mic className="w-5 h-5 text-violet-600" />
              <span className="font-semibold text-base">Mikrofon auswählen</span>
            </div>
            <MicrophoneSelector
              selectedDeviceId={selectedMicrophoneId}
              onDeviceChange={setSelectedMicrophoneId}
              onTestClick={() => setShowMicrophoneTest(true)}
            />
          </Card>
        </motion.div>

        {/* Tips Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="w-full bg-violet-50 border border-violet-100 rounded-2xl p-5 mb-8 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-3 text-violet-900">
            <Sparkles className="w-4.5 h-4.5 text-violet-600" />
            <span className="font-semibold text-sm">Tipps für deine Antwort</span>
          </div>
          <ul className="m-0 pl-5 text-slate-600 text-sm leading-relaxed list-disc">
            <li>Atme tief durch bevor du beginnst</li>
            <li>Sprich in einem ruhigen, gleichmäßigen Tempo</li>
            <li>Mache bewusst Pausen statt "Ähm" zu sagen</li>
            <li>Strukturiere deine Antwort: Einleitung → Hauptteil → Schluss</li>
          </ul>
        </motion.div>

        {/* Start Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="w-full max-w-[400px]"
        >
          <Button size="lg" icon={<Play />} onClick={handleStart} fullWidth>
            Aufnahme starten
          </Button>
        </motion.div>
      </div>

      {/* Microphone Test Dialog */}
      <MicrophoneTestDialog
        isOpen={showMicrophoneTest}
        onClose={() => setShowMicrophoneTest(false)}
        deviceId={selectedMicrophoneId}
      />
    </div>
  );
};

// ================== MAIN COMPONENT ==================

/**
 * View states
 */
const VIEWS = {
  MODES: 'modes',
  TOPIC: 'topic',
};

/**
 * Main RhetorikGym Component - Uses Tailwind for styling
 */
const RhetorikGym = ({ onStartGame, isAuthenticated, requireAuth, setPendingAction }) => {
  const [currentView, setCurrentView] = useState(VIEWS.MODES);
  const [selectedMode, setSelectedMode] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [userStats, setUserStats] = useState({
    totalGames: 0,
    bestScore: 0,
    avgScore: 0,
    totalPracticeTime: 0,
  });

  // Mobile detection
  const isMobile = useMobile();

  // Pending mode for after login
  const [pendingMode, setPendingMode] = useState(null);

  // Load user stats - reload when returning to mode selection view
  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await wordpressAPI.getGameStats();
        if (response.success && response.data) {
          setUserStats({
            totalGames: response.data.total_games || 0,
            bestScore: response.data.best_score || 0,
            avgScore: response.data.avg_score || 0,
            totalPracticeTime: response.data.total_practice_time || 0,
          });
        }
      } catch (error) {
        console.error('Failed to load stats:', error);
      }
    };
    // Load stats on mount and when returning to mode selection
    if (currentView === VIEWS.MODES) {
      loadStats();
    }
  }, [currentView]);

  // Handle pending mode after login - automatically open topic selection
  useEffect(() => {
    if (pendingMode && isAuthenticated) {
      setSelectedMode(pendingMode);
      setCurrentView(VIEWS.TOPIC);
      setPendingMode(null);
    }
  }, [pendingMode, isAuthenticated]);

  // Scroll to top on every view change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentView]);

  const handleSelectMode = (mode) => {
    // Check authentication before allowing mode selection
    if (!isAuthenticated) {
      // Store the mode as pending
      setPendingMode(mode);
      // Open login modal
      if (requireAuth) {
        requireAuth(() => {}, null);
      }
      return;
    }

    // User is authenticated - proceed with selection
    setSelectedMode(mode);
    setCurrentView(VIEWS.TOPIC);
  };

  const handleBack = () => {
    setSelectedMode(null);
    setCurrentView(VIEWS.MODES);
  };

  const handleStartGame = (config) => {
    onStartGame(config);
  };

  const gameModes = Object.values(GAME_MODES);

  // Topic Selection View
  if (currentView === VIEWS.TOPIC && selectedMode) {
    return (
      <TopicSelectionScreen
        mode={selectedMode}
        onBack={handleBack}
        onStart={handleStartGame}
      />
    );
  }

  // Main Mode Selection View
  return (
    <>
      {/* Feature Info Modal - shows on first visit */}
      <FeatureInfoModal featureId="rhetorikgym" showOnMount />

      <div className="p-4 md:p-6">
        {/* Header - Compact on mobile */}
        <div className="mb-5 md:mb-8 text-center">
          <div className="inline-flex items-center gap-2.5 md:gap-3 mb-2 md:mb-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex-center shadow-lg">
              <Dumbbell className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
              Der Füllwort-Killer
            </h1>
          </div>
          <p className="text-sm md:text-base text-slate-600 max-w-[600px] mx-auto">
            Trainiere deine Rhetorik - sprich flüssig und überzeugend ohne Ähm und Öh!
          </p>
        </div>

        <div className="px-2 md:px-6">
          {/* Stats Row - 2x2 grid on mobile */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-4 mb-6 md:mb-8">
            <StatsCard icon={Trophy} label="Highscore" value={userStats.bestScore || '-'} isMobile={isMobile} />
            <StatsCard icon={Target} label="Spiele" value={userStats.totalGames || 0} isMobile={isMobile} />
            <StatsCard icon={TrendingUp} label="Durchschnitt" value={userStats.avgScore ? Math.round(userStats.avgScore) : '-'} isMobile={isMobile} />
            <StatsCard icon={Clock} label="Trainingszeit" value={userStats.totalPracticeTime ? `${Math.round(userStats.totalPracticeTime / 60)}m` : '0m'} isMobile={isMobile} />
          </div>

          {/* Section Title with View Toggle */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-slate-800">
              Wähle deinen Modus
            </h2>
            <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />
          </div>

          {/* Game Mode Grid */}
          <ScenarioCardGrid minCardWidth="280px" viewMode={viewMode}>
            {gameModes.map((mode) => {
              const IconComponent = ICON_MAP[mode.icon] || Rocket;
              return (
                <ScenarioCard
                  key={mode.id}
                  title={mode.title}
                  subtitle={mode.subtitle}
                  description={mode.description}
                  icon={IconComponent}
                  meta={[
                    { icon: Clock, text: `${mode.duration} Sekunden` },
                  ]}
                  action={{ label: 'Starten', icon: TrendingUp }}
                  onClick={() => handleSelectMode(mode)}
                  viewMode={viewMode}
                />
              );
            })}
          </ScenarioCardGrid>
        </div>
      </div>
    </>
  );
};

export default RhetorikGym;
