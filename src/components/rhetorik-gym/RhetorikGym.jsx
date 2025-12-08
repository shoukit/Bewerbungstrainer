/**
 * RhetorikGym - Arcade Dashboard Component
 *
 * Main interface for the Rhetorik-Gym "Füllwort-Killer" game.
 * Provides game mode selection with an arcade-style UI.
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
  Star,
  Flame,
  TrendingUp,
} from 'lucide-react';
import { GAME_MODES, getRandomTopic, getRandomStressQuestion } from '@/config/prompts/gamePrompts';
import wordpressAPI from '@/services/wordpress-api';

/**
 * Arcade-style game card component
 */
const GameModeCard = ({ mode, isSelected, onSelect, stats }) => {
  const iconMap = {
    rocket: Rocket,
    shuffle: Shuffle,
    zap: Zap,
  };

  const colorMap = {
    blue: {
      gradient: 'from-blue-500 to-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      accent: '#3b82f6',
    },
    purple: {
      gradient: 'from-purple-500 to-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-700',
      accent: '#8b5cf6',
    },
    red: {
      gradient: 'from-red-500 to-orange-500',
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      accent: '#ef4444',
    },
  };

  const Icon = iconMap[mode.icon] || Rocket;
  const colors = colorMap[mode.color] || colorMap.blue;

  return (
    <motion.button
      onClick={() => onSelect(mode)}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      className={`
        relative w-full p-6 rounded-2xl text-left transition-all duration-300
        ${isSelected ? `${colors.bg} ${colors.border} border-2 shadow-lg` : 'bg-white border border-slate-200 hover:shadow-md'}
      `}
    >
      {/* Icon Badge */}
      <div
        className={`
          w-14 h-14 rounded-xl flex items-center justify-center mb-4
          bg-gradient-to-br ${colors.gradient} shadow-lg
        `}
      >
        <Icon className="w-7 h-7 text-white" />
      </div>

      {/* Content */}
      <h3 className={`text-xl font-bold mb-1 ${isSelected ? colors.text : 'text-slate-900'}`}>
        {mode.title}
      </h3>
      <p className="text-sm text-slate-500 mb-3">{mode.subtitle}</p>
      <p className="text-sm text-slate-600 mb-4">{mode.description}</p>

      {/* Duration Badge */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Clock className="w-3.5 h-3.5" />
          <span>{mode.duration}s</span>
        </div>
        {stats && stats.bestScore > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-amber-600">
            <Trophy className="w-3.5 h-3.5" />
            <span>Best: {stats.bestScore}</span>
          </div>
        )}
      </div>

      {/* Selection indicator */}
      {isSelected && (
        <motion.div
          layoutId="selectedIndicator"
          className="absolute top-4 right-4"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        >
          <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${colors.gradient} flex items-center justify-center`}>
            <Play className="w-3 h-3 text-white ml-0.5" />
          </div>
        </motion.div>
      )}
    </motion.button>
  );
};

/**
 * Stats card component
 */
const StatsCard = ({ icon: Icon, label, value, subtext, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className={`w-10 h-10 rounded-lg ${colorClasses[color]} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="text-sm text-slate-500">{label}</div>
      {subtext && <div className="text-xs text-slate-400 mt-1">{subtext}</div>}
    </div>
  );
};

/**
 * Slot machine animation for random topic
 */
const SlotMachine = ({ isSpinning, topic, onSpin }) => {
  return (
    <motion.div
      className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-6 text-white"
      animate={{ scale: isSpinning ? [1, 1.02, 1] : 1 }}
      transition={{ repeat: isSpinning ? Infinity : 0, duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold flex items-center gap-2">
          <Shuffle className="w-5 h-5" />
          Dein Thema
        </h4>
        <button
          onClick={onSpin}
          disabled={isSpinning}
          className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {isSpinning ? 'Dreht...' : 'Neu drehen'}
        </button>
      </div>

      <div className="min-h-[60px] flex items-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={topic}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-lg font-medium"
          >
            {isSpinning ? '...' : `"${topic}"`}
          </motion.p>
        </AnimatePresence>
      </div>
    </motion.div>
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
        // Stats would be loaded from the API - for now use placeholder
        // const stats = await wordpressAPI.getGameStats();
        // setUserStats(stats);
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
    <div className="min-h-screen pb-8">
      {/* Header */}
      <div className="px-6 py-8 md:px-8">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-2"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                Der Füllwort-Killer
              </h1>
              <p className="text-slate-500">
                Trainiere deine Rhetorik - ohne Ähm und Öh!
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="px-6 md:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Stats Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          >
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
              color="purple"
            />
          </motion.div>

          {/* Game Mode Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Wähle deinen Modus</h2>
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              {gameModes.map((mode) => (
                <GameModeCard
                  key={mode.id}
                  mode={mode}
                  isSelected={selectedMode?.id === mode.id}
                  onSelect={setSelectedMode}
                />
              ))}
            </div>
          </motion.div>

          {/* Topic Preview / Slot Machine */}
          <AnimatePresence>
            {selectedMode && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-8"
              >
                {selectedMode.id === 'klassiker' ? (
                  <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
                    <h4 className="font-semibold flex items-center gap-2 mb-4">
                      <Rocket className="w-5 h-5" />
                      Deine Aufgabe
                    </h4>
                    <p className="text-lg">{currentTopic}</p>
                  </div>
                ) : selectedMode.id === 'zufall' ? (
                  <SlotMachine
                    isSpinning={isSpinning}
                    topic={currentTopic}
                    onSpin={handleSpin}
                  />
                ) : (
                  <div className="bg-gradient-to-br from-red-600 to-orange-500 rounded-2xl p-6 text-white">
                    <h4 className="font-semibold flex items-center gap-2 mb-4">
                      <Zap className="w-5 h-5" />
                      Stress-Frage
                    </h4>
                    <p className="text-lg font-medium mb-4">{currentTopic}</p>
                    <button
                      onClick={handleSpin}
                      className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
                    >
                      Andere Frage
                    </button>
                  </div>
                )}
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
                className="flex justify-center"
              >
                <motion.button
                  onClick={handleStartGame}
                  disabled={!currentTopic}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`
                    px-8 py-4 rounded-2xl font-bold text-lg shadow-lg
                    flex items-center gap-3 transition-all
                    ${selectedMode.color === 'blue' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                      selectedMode.color === 'purple' ? 'bg-gradient-to-r from-purple-500 to-purple-600' :
                      'bg-gradient-to-r from-red-500 to-orange-500'}
                    text-white hover:shadow-xl disabled:opacity-50
                  `}
                >
                  <Play className="w-6 h-6" />
                  Spiel starten
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Instructions */}
          {!selectedMode && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-center py-8"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full text-slate-600 text-sm">
                <Star className="w-4 h-4" />
                Wähle einen Modus, um zu starten
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RhetorikGym;
