/**
 * RhetorikGym - Dashboard Component
 *
 * Main interface for the Rhetorik-Gym "Füllwort-Killer" game.
 * Uses Ocean theme design consistent with other features.
 */

import React, { useState, useEffect } from 'react';
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
import MicrophoneSelector from '@/components/MicrophoneSelector';
import MicrophoneTestDialog from '@/components/MicrophoneTestDialog';
import { usePartner } from '@/context/PartnerContext';
import { DEFAULT_BRANDING } from '@/config/partners';

/**
 * Ocean theme colors - consistent with other components
 */
const COLORS = {
  blue: { 50: '#eff6ff', 100: '#dbeafe', 500: '#4A9EC9', 600: '#3A7FA7', 700: '#2D6485' },
  teal: { 500: '#3DA389', 600: '#2E8A72' },
  slate: { 50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155', 800: '#1e293b', 900: '#0f172a' },
  amber: { 50: '#fffbeb', 100: '#fef3c7', 500: '#f59e0b', 600: '#d97706' },
  green: { 50: '#f0fdf4', 500: '#22c55e', 600: '#16a34a' },
  purple: { 50: '#faf5ff', 100: '#f3e8ff', 500: '#a855f7', 600: '#9333ea' },
  red: { 50: '#fef2f2', 500: '#ef4444', 600: '#dc2626' },
};

/**
 * Icon mapping for game modes
 */
const ICON_MAP = {
  rocket: Rocket,
  shuffle: Shuffle,
  zap: Zap,
};

/**
 * Mode color gradients
 */
const MODE_COLORS = {
  klassiker: { from: COLORS.blue[500], to: COLORS.teal[500] },
  zufall: { from: COLORS.purple[500], to: COLORS.blue[500] },
  stress: { from: COLORS.red[500], to: COLORS.amber[500] },
};

// ================== SUB-COMPONENTS ==================

/**
 * Game Mode Card Component
 */
const GameModeCard = ({ mode, onSelect }) => {
  const [isHovered, setIsHovered] = useState(false);
  const IconComponent = ICON_MAP[mode.icon] || Rocket;
  const colors = MODE_COLORS[mode.id] || MODE_COLORS.klassiker;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(mode)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '24px',
        border: `2px solid ${isHovered ? colors.from : COLORS.slate[200]}`,
        boxShadow: isHovered
          ? `0 10px 25px -5px ${colors.from}33, 0 8px 10px -6px ${colors.from}22`
          : '0 1px 3px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '14px',
          background: `linear-gradient(135deg, ${colors.from} 0%, ${colors.to} 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
        }}
      >
        <IconComponent style={{ width: '28px', height: '28px', color: 'white' }} />
      </div>

      {/* Title */}
      <h3 style={{
        fontSize: '18px',
        fontWeight: 700,
        color: COLORS.slate[900],
        margin: '0 0 4px 0',
      }}>
        {mode.title}
      </h3>

      {/* Subtitle */}
      <div style={{
        fontSize: '13px',
        color: colors.from,
        fontWeight: 600,
        marginBottom: '12px',
      }}>
        {mode.subtitle}
      </div>

      {/* Description */}
      <p style={{
        fontSize: '14px',
        color: COLORS.slate[600],
        margin: '0 0 16px 0',
        lineHeight: 1.6,
        minHeight: '44px',
      }}>
        {mode.description}
      </p>

      {/* Duration */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '13px',
        color: COLORS.slate[400],
      }}>
        <Clock style={{ width: '14px', height: '14px' }} />
        {mode.duration} Sekunden
      </div>
    </motion.div>
  );
};

/**
 * Stats Card Component
 */
const StatsCard = ({ icon: Icon, label, value, color = 'blue' }) => {
  const colorMap = {
    blue: { bg: 'rgba(74, 158, 201, 0.1)', icon: COLORS.blue[500] },
    amber: { bg: 'rgba(245, 158, 11, 0.1)', icon: COLORS.amber[500] },
    green: { bg: 'rgba(34, 197, 94, 0.1)', icon: COLORS.green[500] },
    teal: { bg: 'rgba(61, 163, 137, 0.1)', icon: COLORS.teal[500] },
  };
  const colors = colorMap[color] || colorMap.blue;

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '16px',
      border: `1px solid ${COLORS.slate[200]}`,
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '10px',
        backgroundColor: colors.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '12px',
      }}>
        <Icon style={{ width: '20px', height: '20px', color: colors.icon }} />
      </div>
      <div style={{ fontSize: '24px', fontWeight: 700, color: COLORS.slate[900] }}>{value}</div>
      <div style={{ fontSize: '13px', color: COLORS.slate[500] }}>{label}</div>
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
  const colors = MODE_COLORS[mode.id] || MODE_COLORS.klassiker;

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
      padding: '24px',
    }}>
      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={onBack}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 16px',
          backgroundColor: 'white',
          border: `1px solid ${COLORS.slate[200]}`,
          borderRadius: '10px',
          color: COLORS.slate[600],
          fontSize: '14px',
          fontWeight: 500,
          cursor: 'pointer',
          marginBottom: '32px',
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
          style={{ textAlign: 'center', marginBottom: '32px' }}
        >
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '20px',
            background: `linear-gradient(135deg, ${colors.from} 0%, ${colors.to} 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: `0 10px 30px ${colors.from}44`,
          }}>
            <IconComponent style={{ width: '40px', height: '40px', color: 'white' }} />
          </div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 700,
            color: COLORS.slate[900],
            margin: '0 0 8px 0',
          }}>
            {mode.title}
          </h1>
          <p style={{
            fontSize: '15px',
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
            background: `linear-gradient(135deg, ${colors.from} 0%, ${colors.to} 100%)`,
            borderRadius: '20px',
            padding: '32px',
            marginBottom: '24px',
            boxShadow: `0 20px 40px ${colors.from}33`,
          }}
        >
          {/* Topic Label */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: 'rgba(255,255,255,0.9)',
            }}>
              <MessageCircle style={{ width: '20px', height: '20px' }} />
              <span style={{ fontWeight: 600, fontSize: '15px' }}>
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
                  gap: '8px',
                  padding: '10px 18px',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '10px',
                  color: 'white',
                  fontSize: '14px',
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
                fontSize: '22px',
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
            borderRadius: '14px',
            padding: '24px',
            marginBottom: '24px',
            border: `1px solid ${COLORS.slate[200]}`,
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '16px',
            color: COLORS.slate[700],
          }}>
            <Mic style={{ width: '20px', height: '20px', color: COLORS.blue[500] }} />
            <span style={{ fontWeight: 600, fontSize: '15px' }}>Mikrofon auswählen</span>
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
            borderRadius: '14px',
            padding: '20px',
            marginBottom: '32px',
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px',
            color: COLORS.slate[700],
          }}>
            <Sparkles style={{ width: '18px', height: '18px', color: COLORS.amber[500] }} />
            <span style={{ fontWeight: 600, fontSize: '14px' }}>Tipps für deine Antwort</span>
          </div>
          <ul style={{
            margin: 0,
            paddingLeft: '20px',
            color: COLORS.slate[600],
            fontSize: '14px',
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
            padding: '18px 32px',
            borderRadius: '14px',
            border: 'none',
            background: `linear-gradient(135deg, ${colors.from} 0%, ${colors.to} 100%)`,
            color: 'white',
            fontSize: '17px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            boxShadow: `0 8px 20px ${colors.from}44`,
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
const RhetorikGym = ({ onStartGame }) => {
  const [currentView, setCurrentView] = useState(VIEWS.MODES);
  const [selectedMode, setSelectedMode] = useState(null);
  const [userStats, setUserStats] = useState({
    totalGames: 0,
    bestScore: 0,
    avgScore: 0,
    totalPracticeTime: 0,
  });

  // Partner theming
  const { branding } = usePartner();
  const headerGradient = branding?.['--header-gradient'] || DEFAULT_BRANDING['--header-gradient'];
  const headerText = branding?.['--header-text'] || DEFAULT_BRANDING['--header-text'];

  // Load user stats - reload when returning to mode selection view
  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await wordpressAPI.getGameStats();
        console.log('🎮 [RhetorikGym] Stats response:', response);
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

  const handleSelectMode = (mode) => {
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
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '12px',
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: headerGradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Dumbbell style={{ width: '24px', height: '24px', color: headerText }} />
          </div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 700,
            color: COLORS.slate[900],
            margin: 0,
          }}>
            Der Füllwort-Killer
          </h1>
        </div>
        <p style={{
          fontSize: '16px',
          color: COLORS.slate[600],
          maxWidth: '600px',
          margin: '0 auto',
        }}>
          Trainiere deine Rhetorik - sprich flüssig und überzeugend ohne Ähm und Öh!
        </p>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Stats Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}>
          <StatsCard icon={Trophy} label="Highscore" value={userStats.bestScore || '-'} color="amber" />
          <StatsCard icon={Target} label="Spiele" value={userStats.totalGames || 0} color="blue" />
          <StatsCard icon={TrendingUp} label="Durchschnitt" value={userStats.avgScore ? Math.round(userStats.avgScore) : '-'} color="green" />
          <StatsCard icon={Clock} label="Trainingszeit" value={userStats.totalPracticeTime ? `${Math.round(userStats.totalPracticeTime / 60)}m` : '0m'} color="teal" />
        </div>

        {/* Section Title */}
        <h2 style={{
          fontSize: '18px',
          fontWeight: 600,
          color: COLORS.slate[800],
          marginBottom: '16px',
        }}>
          Wähle deinen Modus
        </h2>

        {/* Game Mode Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '24px',
        }}>
          {gameModes.map((mode) => (
            <GameModeCard
              key={mode.id}
              mode={mode}
              onSelect={handleSelectMode}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default RhetorikGym;
