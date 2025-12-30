/**
 * RhetorikGym - Dashboard Component
 *
 * Main interface for the Rhetorik-Gym "Füllwort-Killer" game.
 * Uses Ocean theme design consistent with other features.
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
import { GAME_MODES, getRandomTopic, getRandomStressQuestion } from '@/config/prompts/gamePrompts';
import wordpressAPI from '@/services/wordpress-api';
import MicrophoneSelector from '@/components/device-setup/MicrophoneSelector';
import MicrophoneTestDialog from '@/components/device-setup/MicrophoneTestDialog';
import { useBranding } from '@/hooks/useBranding';
import { COLORS, GAME_MODE_COLORS } from '@/config/colors';
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
 * Stats Card Component
 */
const StatsCard = ({ icon: Icon, label, value, primaryAccent, primaryAccentLight, isMobile, b }) => {
  // Use branding colors for all stats cards

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: isMobile ? b.radius.md : b.radius.lg,
      padding: isMobile ? b.space[3] : b.space[4],
      border: `1px solid ${COLORS.slate[200]}`,
    }}>
      <div style={{
        width: isMobile ? '32px' : '40px',
        height: isMobile ? '32px' : '40px',
        borderRadius: isMobile ? b.radius.sm : b.radius.md,
        backgroundColor: primaryAccentLight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: isMobile ? b.space[2] : b.space[3],
      }}>
        <Icon style={{ width: isMobile ? '16px' : '20px', height: isMobile ? '16px' : '20px', color: primaryAccent }} />
      </div>
      <div style={{ fontSize: isMobile ? b.fontSize.xl : b.fontSize['2xl'], fontWeight: 700, color: COLORS.slate[900] }}>{value}</div>
      <div style={{ fontSize: isMobile ? b.fontSize['2xs'] : b.fontSize.xs, color: COLORS.slate[500] }}>{label}</div>
    </div>
  );
};

/**
 * Topic Selection Screen Component
 */
const TopicSelectionScreen = ({ mode, onBack, onStart }) => {
  const [topic, setTopic] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedMicrophoneId, setSelectedMicrophoneId] = useState(null);
  const [showMicrophoneTest, setShowMicrophoneTest] = useState(false);
  const IconComponent = ICON_MAP[mode.icon] || Rocket;
  const colors = GAME_MODE_COLORS[mode.id] || GAME_MODE_COLORS.klassiker;

  // Partner theming
  const b = useBranding();

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
    <div style={{
      minHeight: '100%',
      display: 'flex',
      flexDirection: 'column',
      padding: b.space[6],
    }}>
      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={onBack}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: b.space[2],
          padding: `${b.space[2.5]} ${b.space[4]}`,
          backgroundColor: 'white',
          border: `1px solid ${COLORS.slate[200]}`,
          borderRadius: b.radius.md,
          color: COLORS.slate[600],
          fontSize: b.fontSize.sm,
          fontWeight: 500,
          cursor: 'pointer',
          marginBottom: b.space[8],
          width: 'fit-content',
        }}
      >
        <ArrowLeft style={{ width: '18px', height: '18px' }} />
        Zurück zur Auswahl
      </motion.button>

      {/* Center Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        maxWidth: '600px',
        margin: '0 auto',
        width: '100%',
      }}>
        {/* Mode Icon & Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ textAlign: 'center', marginBottom: b.space[8] }}
        >
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: b.radius['2xl'],
            background: b.headerGradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: `0 auto ${b.space[5]}`,
            boxShadow: b.coloredShadow(b.primaryAccent, 'lg'),
          }}>
            <IconComponent style={{ width: '40px', height: '40px', color: 'white' }} />
          </div>
          <h1 style={{
            fontSize: b.fontSize['3xl'],
            fontWeight: 700,
            color: COLORS.slate[900],
            margin: `0 0 ${b.space[2]} 0`,
          }}>
            {mode.title}
          </h1>
          <p style={{
            fontSize: b.fontSize.md,
            color: COLORS.slate[500],
            margin: 0,
          }}>
            {mode.duration} Sekunden • {mode.subtitle}
          </p>
        </motion.div>

        {/* Topic Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          style={{
            width: '100%',
            background: b.headerGradient,
            borderRadius: b.radius['2xl'],
            padding: b.space[8],
            marginBottom: b.space[6],
            boxShadow: b.coloredShadow(b.primaryAccent, 'xl'),
          }}
        >
          {/* Topic Label */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: b.space[5],
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: b.space[2.5],
              color: 'rgba(255,255,255,0.9)',
            }}>
              <MessageCircle style={{ width: '20px', height: '20px' }} />
              <span style={{ fontWeight: 600, fontSize: b.fontSize.md }}>
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
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: b.space[2],
                  padding: `${b.space[2.5]} ${b.space[4.5]}`,
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: b.radius.md,
                  color: 'white',
                  fontSize: b.fontSize.sm,
                  fontWeight: 600,
                  cursor: isSpinning ? 'not-allowed' : 'pointer',
                }}
              >
                <RefreshCw
                  style={{
                    width: '16px',
                    height: '16px',
                    animation: isSpinning ? 'spin 0.5s linear infinite' : 'none',
                  }}
                />
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
              style={{
                fontSize: b.fontSize['2xl'],
                fontWeight: 600,
                color: 'white',
                margin: 0,
                lineHeight: 1.5,
                minHeight: '66px',
              }}
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
          style={{
            width: '100%',
            backgroundColor: 'white',
            borderRadius: b.radius.xl,
            padding: b.space[6],
            marginBottom: b.space[6],
            border: `1px solid ${COLORS.slate[200]}`,
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: b.space[2.5],
            marginBottom: b.space[4],
            color: COLORS.slate[700],
          }}>
            <Mic style={{ width: '20px', height: '20px', color: b.primaryAccent }} />
            <span style={{ fontWeight: 600, fontSize: b.fontSize.md }}>Mikrofon auswählen</span>
          </div>
          <MicrophoneSelector
            selectedDeviceId={selectedMicrophoneId}
            onDeviceChange={setSelectedMicrophoneId}
            onTestClick={() => setShowMicrophoneTest(true)}
          />
        </motion.div>

        {/* Tips Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{
            width: '100%',
            backgroundColor: COLORS.slate[50],
            borderRadius: b.radius.xl,
            padding: b.space[5],
            marginBottom: b.space[8],
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: b.space[2],
            marginBottom: b.space[3],
            color: COLORS.slate[700],
          }}>
            <Sparkles style={{ width: '18px', height: '18px', color: COLORS.amber[500] }} />
            <span style={{ fontWeight: 600, fontSize: b.fontSize.sm }}>Tipps für deine Antwort</span>
          </div>
          <ul style={{
            margin: 0,
            paddingLeft: b.space[5],
            color: COLORS.slate[600],
            fontSize: b.fontSize.sm,
            lineHeight: 1.7,
          }}>
            <li>Atme tief durch bevor du beginnst</li>
            <li>Sprich in einem ruhigen, gleichmäßigen Tempo</li>
            <li>Mache bewusst Pausen statt "Ähm" zu sagen</li>
            <li>Strukturiere deine Antwort: Einleitung → Hauptteil → Schluss</li>
          </ul>
        </motion.div>

        {/* Start Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleStart}
          style={{
            width: '100%',
            maxWidth: '400px',
            padding: `${b.space[4.5]} ${b.space[8]}`,
            borderRadius: b.radius.xl,
            border: 'none',
            background: b.buttonGradient,
            color: 'white',
            fontSize: b.fontSize.lg,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: b.space[3],
            boxShadow: b.coloredShadow(b.primaryAccent, 'md'),
          }}
        >
          <Play style={{ width: '22px', height: '22px' }} />
          Aufnahme starten
        </motion.button>
      </div>

      {/* CSS for spin animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

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
 * Main RhetorikGym Component
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

  // Partner theming
  const b = useBranding();

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

      <div style={{ padding: isMobile ? b.space[4] : b.space[6] }}>
      {/* Header - Compact on mobile */}
      <div style={{ marginBottom: isMobile ? b.space[5] : b.space[8], textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: isMobile ? b.space[2.5] : b.space[3],
          marginBottom: isMobile ? b.space[2] : b.space[3],
        }}>
          <div style={{
            width: isMobile ? '40px' : '48px',
            height: isMobile ? '40px' : '48px',
            borderRadius: isMobile ? b.radius.lg : b.radius.xl,
            background: b.headerGradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Dumbbell style={{ width: isMobile ? '20px' : '24px', height: isMobile ? '20px' : '24px', color: b.headerText }} />
          </div>
          <h1 style={{
            fontSize: isMobile ? b.fontSize['2xl'] : b.fontSize['3xl'],
            fontWeight: 700,
            color: COLORS.slate[900],
            margin: 0,
          }}>
            Der Füllwort-Killer
          </h1>
        </div>
        <p style={{
          fontSize: isMobile ? b.fontSize.sm : b.fontSize.base,
          color: COLORS.slate[600],
          maxWidth: '600px',
          margin: '0 auto',
        }}>
          Trainiere deine Rhetorik - sprich flüssig und überzeugend ohne Ähm und Öh!
        </p>
      </div>

      <div style={{ padding: isMobile ? `0 ${b.space[2]}` : `0 ${b.space[6]}` }}>
        {/* Stats Row - 2x2 grid on mobile */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: isMobile ? b.space[2.5] : b.space[4],
          marginBottom: isMobile ? b.space[6] : b.space[8],
        }}>
          <StatsCard icon={Trophy} label="Highscore" value={userStats.bestScore || '-'} primaryAccent={b.primaryAccent} primaryAccentLight={b.primaryAccentLight} isMobile={isMobile} b={b} />
          <StatsCard icon={Target} label="Spiele" value={userStats.totalGames || 0} primaryAccent={b.primaryAccent} primaryAccentLight={b.primaryAccentLight} isMobile={isMobile} b={b} />
          <StatsCard icon={TrendingUp} label="Durchschnitt" value={userStats.avgScore ? Math.round(userStats.avgScore) : '-'} primaryAccent={b.primaryAccent} primaryAccentLight={b.primaryAccentLight} isMobile={isMobile} b={b} />
          <StatsCard icon={Clock} label="Trainingszeit" value={userStats.totalPracticeTime ? `${Math.round(userStats.totalPracticeTime / 60)}m` : '0m'} primaryAccent={b.primaryAccent} primaryAccentLight={b.primaryAccentLight} isMobile={isMobile} b={b} />
        </div>

        {/* Section Title with View Toggle */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: b.space[4],
        }}>
          <h2 style={{
            fontSize: b.fontSize.lg,
            fontWeight: 600,
            color: COLORS.slate[800],
            margin: 0,
          }}>
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
