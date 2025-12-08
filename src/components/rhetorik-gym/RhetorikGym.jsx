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
} from 'lucide-react';
import { GAME_MODES, getRandomTopic, getRandomStressQuestion } from '@/config/prompts/gamePrompts';
import wordpressAPI from '@/services/wordpress-api';

/**
 * Ocean theme colors - consistent with other components
 */
const COLORS = {
  blue: { 500: '#4A9EC9', 600: '#3A7FA7', 700: '#2D6485' },
  teal: { 500: '#3DA389', 600: '#2E8A72' },
  slate: { 50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155', 800: '#1e293b', 900: '#0f172a' },
  amber: { 50: '#fffbeb', 100: '#fef3c7', 500: '#f59e0b', 600: '#d97706' },
  green: { 50: '#f0fdf4', 500: '#22c55e', 600: '#16a34a' },
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
 * Game Mode Card Component - styled like SimulatorDashboard
 */
const GameModeCard = ({ mode, isSelected, onSelect }) => {
  const [isHovered, setIsHovered] = useState(false);
  const IconComponent = ICON_MAP[mode.icon] || Rocket;

  return (
    <div
      onClick={() => onSelect(mode)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '24px',
        border: `2px solid ${isSelected ? COLORS.blue[500] : isHovered ? COLORS.blue[500] : COLORS.slate[200]}`,
        boxShadow: isSelected || isHovered
          ? '0 10px 25px -5px rgba(74, 158, 201, 0.2), 0 8px 10px -6px rgba(74, 158, 201, 0.1)'
          : '0 1px 3px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        cursor: 'pointer',
        position: 'relative',
      }}
    >
      {/* Selection Indicator */}
      {isSelected && (
        <div
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${COLORS.blue[500]} 0%, ${COLORS.teal[500]} 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Play style={{ width: '12px', height: '12px', color: 'white', marginLeft: '2px' }} />
        </div>
      )}

      {/* Icon */}
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '14px',
          background: `linear-gradient(135deg, ${COLORS.blue[500]} 0%, ${COLORS.teal[500]} 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 6px -1px rgba(74, 158, 201, 0.3)',
        }}
      >
        <IconComponent style={{ width: '28px', height: '28px', color: 'white' }} />
      </div>

      {/* Title */}
      <h3 style={{
        fontSize: '18px',
        fontWeight: 700,
        color: COLORS.slate[900],
        margin: 0,
      }}>
        {mode.title}
      </h3>

      {/* Subtitle */}
      <p style={{
        fontSize: '13px',
        color: COLORS.blue[600],
        margin: 0,
        fontWeight: 500,
      }}>
        {mode.subtitle}
      </p>

      {/* Description - with proper wrapping */}
      <p style={{
        fontSize: '14px',
        color: COLORS.slate[600],
        margin: 0,
        lineHeight: 1.6,
        minHeight: '44px',
      }}>
        {mode.description}
      </p>

      {/* Duration */}
      <div style={{
        display: 'flex',
        gap: '16px',
        paddingTop: '12px',
        borderTop: `1px solid ${COLORS.slate[100]}`
      }}>
        <span style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '13px',
          color: COLORS.slate[400]
        }}>
          <Clock style={{ width: '14px', height: '14px' }} />
          {mode.duration} Sekunden
        </span>
      </div>
    </div>
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
 * Topic Preview Component
 */
const TopicPreview = ({ mode, topic, onSpin, isSpinning }) => {
  if (!mode) return null;

  return (
    <div
      style={{
        background: `linear-gradient(135deg, ${COLORS.blue[500]} 0%, ${COLORS.teal[500]} 100%)`,
        borderRadius: '16px',
        padding: '24px',
        color: 'white',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {mode.id === 'klassiker' && <Rocket style={{ width: '20px', height: '20px' }} />}
          {mode.id === 'zufall' && <Shuffle style={{ width: '20px', height: '20px' }} />}
          {mode.id === 'stress' && <Zap style={{ width: '20px', height: '20px' }} />}
          <span style={{ fontWeight: 600 }}>
            {mode.id === 'klassiker' ? 'Deine Aufgabe' : mode.id === 'stress' ? 'Stress-Frage' : 'Dein Thema'}
          </span>
        </div>
        {mode.getTopic && (
          <button
            onClick={onSpin}
            disabled={isSpinning}
            style={{
              padding: '8px 16px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontSize: '13px',
              fontWeight: 500,
              cursor: isSpinning ? 'not-allowed' : 'pointer',
              opacity: isSpinning ? 0.5 : 1,
              transition: 'all 0.2s',
            }}
          >
            {isSpinning ? 'Dreht...' : 'Neu drehen'}
          </button>
        )}
      </div>

      <p style={{ fontSize: '18px', fontWeight: 500, margin: 0, lineHeight: 1.5 }}>
        "{topic}"
      </p>
    </div>
  );
};

/**
 * Main RhetorikGym Component
 */
const RhetorikGym = ({ onStartGame }) => {
  const [selectedMode, setSelectedMode] = useState(null);
  const [currentTopic, setCurrentTopic] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [userStats, setUserStats] = useState({
    totalGames: 0,
    bestScore: 0,
    avgScore: 0,
    totalPracticeTime: 0,
  });

  // Load user stats
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
    loadStats();
  }, []);

  // Initialize topic when mode is selected
  useEffect(() => {
    if (selectedMode) {
      if (selectedMode.id === 'klassiker') {
        setCurrentTopic(selectedMode.topic);
      } else if (selectedMode.getTopic) {
        setCurrentTopic(selectedMode.getTopic());
      }
    }
  }, [selectedMode]);

  const handleSpin = () => {
    if (!selectedMode || !selectedMode.getTopic) return;

    setIsSpinning(true);

    // Simulate slot machine effect
    const spinDuration = 1500;
    const spinInterval = 100;
    let elapsed = 0;

    const interval = setInterval(() => {
      setCurrentTopic(selectedMode.getTopic());
      elapsed += spinInterval;

      if (elapsed >= spinDuration) {
        clearInterval(interval);
        setIsSpinning(false);
      }
    }, spinInterval);
  };

  const handleStartGame = () => {
    if (!selectedMode || !currentTopic) return;

    onStartGame({
      mode: selectedMode,
      topic: currentTopic,
      duration: selectedMode.duration,
    });
  };

  const gameModes = Object.values(GAME_MODES);

  return (
    <div style={{ padding: '24px' }}>
      {/* Header - consistent with SimulatorDashboard */}
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '12px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: `linear-gradient(135deg, ${COLORS.blue[500]} 0%, ${COLORS.teal[500]} 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Dumbbell style={{ width: '24px', height: '24px', color: 'white' }} />
          </div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 700,
            color: COLORS.slate[900],
            margin: 0
          }}>
            Der Füllwort-Killer
          </h1>
        </div>
        <p style={{
          fontSize: '16px',
          color: COLORS.slate[600],
          maxWidth: '600px',
          margin: '0 auto'
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
          <StatsCard
            icon={Trophy}
            label="Highscore"
            value={userStats.bestScore || '-'}
            color="amber"
          />
          <StatsCard
            icon={Target}
            label="Spiele"
            value={userStats.totalGames || 0}
            color="blue"
          />
          <StatsCard
            icon={TrendingUp}
            label="Durchschnitt"
            value={userStats.avgScore ? Math.round(userStats.avgScore) : '-'}
            color="green"
          />
          <StatsCard
            icon={Clock}
            label="Trainingszeit"
            value={userStats.totalPracticeTime ? `${Math.round(userStats.totalPracticeTime / 60)}m` : '0m'}
            color="teal"
          />
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
          marginBottom: '32px',
        }}>
          {gameModes.map((mode) => (
            <GameModeCard
              key={mode.id}
              mode={mode}
              isSelected={selectedMode?.id === mode.id}
              onSelect={setSelectedMode}
            />
          ))}
        </div>

        {/* Topic Preview */}
        <AnimatePresence>
          {selectedMode && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              style={{ marginBottom: '32px' }}
            >
              <TopicPreview
                mode={selectedMode}
                topic={currentTopic}
                onSpin={handleSpin}
                isSpinning={isSpinning}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Start Button */}
        <AnimatePresence>
          {selectedMode && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{ display: 'flex', justifyContent: 'center' }}
            >
              <button
                onClick={handleStartGame}
                disabled={!currentTopic}
                style={{
                  padding: '16px 40px',
                  borderRadius: '14px',
                  border: 'none',
                  background: `linear-gradient(135deg, ${COLORS.blue[500]} 0%, ${COLORS.teal[500]} 100%)`,
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: currentTopic ? 'pointer' : 'not-allowed',
                  opacity: currentTopic ? 1 : 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  boxShadow: '0 4px 14px rgba(74, 158, 201, 0.4)',
                  transition: 'all 0.3s ease',
                }}
              >
                <Play style={{ width: '20px', height: '20px' }} />
                Spiel starten
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {!selectedMode && (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: COLORS.slate[500],
          }}>
            <p>Wähle einen Modus, um zu starten</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RhetorikGym;
