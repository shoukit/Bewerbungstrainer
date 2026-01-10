/**
 * KiCoachApp - AI-Powered Personal Career Coach
 *
 * Comprehensive coaching dashboard that:
 * - Shows user statistics and progress
 * - Provides AI-generated insights based on all sessions
 * - Recommends specific scenarios based on weaknesses
 * - Tracks improvement over time
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  TrendingUp,
  Target,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Loader2,
  RefreshCw,
  Award,
  Zap,
  Star,
  ArrowRight,
  Sparkles,
  BarChart3,
  Calendar,
  Clock,
  Mic,
  Video,
  MessageSquare,
  FileText,
  Play,
  Settings,
} from 'lucide-react';
import { Card, Button } from '@/components/ui';
import { usePartner } from '@/context/PartnerContext';
import { useMobile } from '@/hooks/useMobile';
import { COLORS, getScoreColor, createGradient } from '@/config/colors';
import ProgressChart from '@/components/progress/ProgressChart';
import FeatureAppHeader from '@/components/global/FeatureAppHeader';
import { getCoachingIntelligence } from '@/services/coaching-intelligence';
import FocusSelectionWizard, { hasSelectedFocus, getUserFocus, clearUserFocus, FOCUS_CATEGORIES } from './FocusSelectionWizard';

// =============================================================================
// CONSTANTS
// =============================================================================

const MODULE_ICONS = {
  'rhetorik-gym': Mic,
  'szenario-training': Target,
  'wirkungs-analyse': Video,
  'live-simulation': MessageSquare,
  'smart-briefing': FileText,
};

const MODULE_ROUTES = {
  'rhetorik-gym': 'gym',
  'szenario-training': 'simulator',
  'wirkungs-analyse': 'video_training',
  'live-simulation': 'dashboard',  // Maps to Live Training dashboard, not session
  'smart-briefing': 'smart_briefing',
};

const LEVEL_COLORS = {
  'Einsteiger': COLORS.slate[400],
  'Anfänger': COLORS.amber[500],
  'Fortgeschritten': COLORS.blue[500],
  'Profi': COLORS.emerald[500],
  'Experte': COLORS.purple[500],
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/**
 * Level Badge with animated ring
 */
const LevelBadge = ({ level }) => {
  const color = LEVEL_COLORS[level.name] || COLORS.indigo[500];
  const percentage = level.score || 0;
  const radius = 54;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative" style={{ width: 140, height: 140 }}>
        <svg width={140} height={140} style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx={70}
            cy={70}
            r={radius}
            fill="none"
            stroke={COLORS.slate[200]}
            strokeWidth={10}
          />
          <motion.circle
            cx={70}
            cy={70}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Award size={32} style={{ color }} />
          <span className="text-2xl font-bold text-slate-900 mt-1">{level.score}</span>
        </div>
      </div>
      <div className="mt-3 text-center">
        <span
          className="text-lg font-bold px-4 py-1 rounded-full"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {level.name}
        </span>
        <p className="text-sm text-slate-500 mt-2">{level.description}</p>
      </div>
    </div>
  );
};

/**
 * Strength Card
 */
const StrengthCard = ({ strength, index }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.1 }}
  >
    <Card className="p-4 border-l-4 border-l-green-500">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
          <CheckCircle size={18} className="text-green-600" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-slate-900">{strength.title}</h4>
          <p className="text-xs text-slate-600 mt-1 break-words">{strength.description}</p>
          {strength.evidence && (
            <p className="text-xs text-slate-400 mt-1 italic break-words">{strength.evidence}</p>
          )}
        </div>
      </div>
    </Card>
  </motion.div>
);

/**
 * Focus Area Card with Training Recommendations
 */
const FocusAreaCard = ({ area, index, onNavigate, scenarios }) => {
  const priorityColors = {
    hoch: { bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-500' },
    mittel: { bg: 'bg-amber-100', text: 'text-amber-600', border: 'border-amber-500' },
    niedrig: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-500' },
  };
  const colors = priorityColors[area.priority] || priorityColors.mittel;

  // Get suggested trainings from AI or find matching scenarios
  const suggestedTrainings = area.suggestedTrainings || [];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className={`p-4 border-l-4 ${colors.border}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-slate-900">{area.title}</h4>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                {area.priority}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">{area.description}</p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
              <div>
                <span className="text-slate-400">Aktuell: </span>
                <span className="text-slate-600">{area.currentState}</span>
              </div>
              <div>
                <span className="text-slate-400">Ziel: </span>
                <span className="text-green-600 font-medium">{area.targetState}</span>
              </div>
            </div>

            {/* Suggested Trainings */}
            {suggestedTrainings.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-2">Passende Trainings:</p>
                <div className="flex flex-col gap-1.5">
                  {suggestedTrainings.slice(0, 2).map((training, i) => {
                    const ModuleIcon = MODULE_ICONS[training.module] || Target;
                    return (
                      <button
                        key={i}
                        onClick={() => onNavigate?.(training.module, training.scenario_id)}
                        className="flex items-center gap-2 px-2.5 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-slate-700 text-left w-full"
                      >
                        <ModuleIcon size={14} className="flex-shrink-0 text-slate-500" />
                        <span className="flex-1">{training.title}</span>
                        <ChevronRight size={14} className="text-slate-400 flex-shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <Target size={20} className={colors.text} />
        </div>
      </Card>
    </motion.div>
  );
};

/**
 * Recommendation Card with action button
 */
const RecommendationCard = ({ rec, index, onNavigate }) => {
  const ModuleIcon = MODULE_ICONS[rec.module] || Target;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <ModuleIcon size={20} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-slate-900">{rec.action}</h4>
            <p className="text-xs text-slate-500 mt-0.5">{rec.reason}</p>
            {rec.frequency && (
              <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
                <Clock size={12} />
                <span>{rec.frequency}</span>
              </div>
            )}
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="flex-shrink-0"
            onClick={() => onNavigate(rec.module, rec.scenario_id)}
          >
            <Play size={14} />
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};

/**
 * Next Step CTA Card
 */
const NextStepCard = ({ nextStep, onNavigate }) => {
  const ModuleIcon = MODULE_ICONS[nextStep.module] || Zap;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3 }}
    >
      <Card
        className="p-6 cursor-pointer hover:shadow-lg transition-all border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5"
        onClick={() => onNavigate(nextStep.module, nextStep.scenario_id)}
      >
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={20} className="text-primary" />
          <span className="text-xs font-semibold text-primary uppercase tracking-wide">
            Nächster Schritt
          </span>
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">{nextStep.title}</h3>
        <p className="text-sm text-slate-600 mb-4">{nextStep.description}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <div className="flex items-center gap-1">
              <ModuleIcon size={16} />
              <span className="capitalize">{nextStep.module?.replace('-', ' ')}</span>
            </div>
            {nextStep.estimatedTime && (
              <div className="flex items-center gap-1">
                <Clock size={16} />
                <span>{nextStep.estimatedTime}</span>
              </div>
            )}
          </div>
          <Button icon={<ArrowRight size={16} />}>
            Jetzt starten
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};

/**
 * Stats Overview Cards
 */
const StatsOverview = ({ stats }) => {
  const statCards = [
    {
      label: 'Gesamt Sessions',
      value: stats.totalSessions,
      icon: BarChart3,
      color: COLORS.indigo[500],
    },
    {
      label: 'Ø Bewertung',
      value: stats.averageScores?.['Gesamt'] != null
        ? `${Math.round(stats.averageScores['Gesamt'])}%`
        : '—',
      icon: Star,
      color: COLORS.amber[500],
    },
    {
      label: 'Trend (30 Tage)',
      value: stats.recentTrend != null
        ? `${stats.recentTrend > 0 ? '+' : ''}${stats.recentTrend.toFixed(1)}%`
        : '—',
      icon: TrendingUp,
      color: stats.recentTrend > 0 ? COLORS.emerald[500] : COLORS.red[500],
    },
    {
      label: 'Letztes Training',
      value: stats.daysSinceLastSession != null && stats.daysSinceLastSession < 999
        ? stats.daysSinceLastSession === 0
          ? 'Heute'
          : `Vor ${stats.daysSinceLastSession}d`
        : '—',
      icon: Calendar,
      color: COLORS.blue[500],
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statCards.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <Card className="p-4 text-center">
            <stat.icon size={24} className="mx-auto mb-2" style={{ color: stat.color }} />
            <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
            <div className="text-xs text-slate-500">{stat.label}</div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const KiCoachApp = ({
  isAuthenticated,
  requireAuth,
  onNavigate,
}) => {
  const isMobile = useMobile();
  const { branding } = usePartner();
  const primaryAccent = branding?.primaryAccent || COLORS.indigo[500];

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [coachingData, setCoachingData] = useState(null);
  const [showFocusWizard, setShowFocusWizard] = useState(false);
  const [userFocus, setUserFocus] = useState(getUserFocus());

  // Load coaching intelligence
  // Note: userFocus is NOT in dependencies to prevent re-analysis when resetting focus
  // Focus is either passed explicitly or read from localStorage
  const loadCoaching = useCallback(async (isRefresh = false, focus = null) => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      // Use provided focus or get from localStorage (not state, to avoid dependency)
      const currentFocus = focus ?? getUserFocus();
      // Pass forceRefresh=true when manually refreshing to bypass cache
      const data = await getCoachingIntelligence(currentFocus, isRefresh);

      // Log cache status
      if (data.fromCache) {
        console.log('[KiCoach] ✓ Loaded from cache (no Gemini API call)');
      } else {
        console.log('[KiCoach] Generated fresh analysis');
      }

      setCoachingData(data);
    } catch (err) {
      console.error('[KiCoach] Failed to load coaching:', err);
      setError('Fehler beim Laden der Coaching-Analyse');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadCoaching();
  }, [loadCoaching]);

  // Check if we should show focus wizard on first visit
  useEffect(() => {
    if (isAuthenticated && !isLoading && coachingData && !hasSelectedFocus()) {
      // Show wizard after a short delay to let the page render first
      const timer = setTimeout(() => setShowFocusWizard(true), 500);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isLoading, coachingData]);

  // Handle focus wizard completion
  const handleFocusComplete = (selectedFocus) => {
    setUserFocus(selectedFocus);
    setShowFocusWizard(false);
    // Refresh coaching with the new focus to get focus-specific recommendations
    loadCoaching(true, selectedFocus);
  };

  // Handle focus wizard skip
  const handleFocusSkip = () => {
    setShowFocusWizard(false);
  };

  // Handle resetting focus (from settings)
  const handleResetFocus = () => {
    clearUserFocus();
    setUserFocus(null);
    setShowFocusWizard(true);
  };

  // Handle navigation to module
  const handleNavigate = (module, scenarioId) => {
    const route = MODULE_ROUTES[module] || module;
    if (onNavigate) {
      onNavigate(route, scenarioId);
    }
  };

  // Require auth for this feature
  useEffect(() => {
    if (!isAuthenticated && requireAuth) {
      requireAuth();
    }
  }, [isAuthenticated, requireAuth]);

  // Header gradient
  const headerGradient = createGradient(COLORS.indigo[600], COLORS.purple[500]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <FeatureAppHeader
          title="KI-Coach"
          subtitle="Dein persönlicher Karriere-Coach"
          icon={Brain}
          gradient={headerGradient}
        />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 size={48} className="text-primary animate-spin mx-auto" />
            <p className="text-slate-500 mt-4">Analysiere deine Trainings...</p>
          </div>
        </div>
      </div>
    );
  }

  // Auth required state
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50">
        <FeatureAppHeader
          title="KI-Coach"
          subtitle="Dein persönlicher Karriere-Coach"
          icon={Brain}
          gradient={headerGradient}
        />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="p-8 text-center max-w-md">
            <Brain size={48} className="text-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Anmeldung erforderlich</h2>
            <p className="text-slate-600 mb-6">
              Um deinen persönlichen KI-Coach zu nutzen, musst du angemeldet sein.
            </p>
            <Button onClick={requireAuth}>Anmelden</Button>
          </Card>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !coachingData) {
    return (
      <div className="min-h-screen bg-slate-50">
        <FeatureAppHeader
          title="KI-Coach"
          subtitle="Dein persönlicher Karriere-Coach"
          icon={Brain}
          gradient={headerGradient}
        />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="p-8 text-center max-w-md">
            <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Fehler beim Laden</h2>
            <p className="text-slate-600 mb-6">{error}</p>
            <Button onClick={() => loadCoaching()}>Erneut versuchen</Button>
          </Card>
        </div>
      </div>
    );
  }

  const { coaching, stats, sessions, scenarios } = coachingData || {};

  // Get current focus category info
  const currentFocusCategory = userFocus
    ? FOCUS_CATEGORIES.find(f => f.id === userFocus)
    : null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Focus Selection Wizard */}
      <AnimatePresence>
        {showFocusWizard && (
          <FocusSelectionWizard
            onComplete={handleFocusComplete}
            onSkip={handleFocusSkip}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <FeatureAppHeader
        title="KI-Coach"
        subtitle="Dein persönlicher Karriere-Coach"
        icon={Brain}
        gradient={headerGradient}
        rightContent={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => loadCoaching(true)}
            disabled={isRefreshing}
            className="bg-white/20 border-white/30 text-white hover:bg-white/30"
          >
            {isRefreshing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
            <span className="ml-2 hidden sm:inline">Aktualisieren</span>
          </Button>
        }
      />

      {/* Focus Selector Banner */}
      <div className="bg-white border-b border-slate-200">
        <div className={`${isMobile ? 'px-4 py-3' : 'px-8 py-4'} max-w-6xl mx-auto`}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500">Mein Fokus:</span>
              {currentFocusCategory ? (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg">
                  <currentFocusCategory.icon size={16} style={{ color: currentFocusCategory.color }} />
                  <span className="text-sm font-medium text-slate-700">{currentFocusCategory.title}</span>
                </div>
              ) : (
                <span className="text-sm text-slate-400 italic">Nicht festgelegt</span>
              )}
            </div>
            <button
              onClick={handleResetFocus}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              <Settings size={14} />
              <span>{currentFocusCategory ? 'Ändern' : 'Festlegen'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`${isMobile ? 'p-4' : 'px-8 py-6'}`}>
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Top Section: Level + Stats */}
          <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
            {/* Level Badge */}
            <Card className="p-6 flex items-center justify-center">
              {coaching?.level && <LevelBadge level={coaching.level} />}
            </Card>

            {/* Stats Overview */}
            <div className={`${isMobile ? '' : 'col-span-2'}`}>
              {stats && <StatsOverview stats={stats} />}

              {/* Summary */}
              {coaching?.summary && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mt-4"
                >
                  <Card className="p-4 bg-gradient-to-r from-slate-50 to-slate-100">
                    <p className="text-sm text-slate-700 leading-relaxed">{coaching.summary}</p>
                  </Card>
                </motion.div>
              )}
            </div>
          </div>

          {/* Next Step CTA */}
          {coaching?.nextStep && (
            <NextStepCard nextStep={coaching.nextStep} onNavigate={handleNavigate} />
          )}

          {/* Strengths & Focus Areas */}
          <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {/* Strengths */}
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <CheckCircle size={20} className="text-green-500" />
                Deine Stärken
              </h3>
              <div className="space-y-3">
                {coaching?.strengths?.map((strength, i) => (
                  <StrengthCard key={i} strength={strength} index={i} />
                ))}
                {(!coaching?.strengths || coaching.strengths.length === 0) && (
                  <Card className="p-4 text-center text-slate-500 text-sm">
                    Noch keine Stärken identifiziert. Absolviere mehr Trainings!
                  </Card>
                )}
              </div>
            </div>

            {/* Focus Areas */}
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Target size={20} className="text-amber-500" />
                Fokus-Bereiche
              </h3>
              <div className="space-y-3">
                {coaching?.focusAreas?.map((area, i) => (
                  <FocusAreaCard
                    key={i}
                    area={area}
                    index={i}
                    onNavigate={handleNavigate}
                    scenarios={scenarios}
                  />
                ))}
                {(!coaching?.focusAreas || coaching.focusAreas.length === 0) && (
                  <Card className="p-4 text-center text-slate-500 text-sm">
                    Noch keine Fokus-Bereiche identifiziert.
                  </Card>
                )}
              </div>
            </div>
          </div>

          {/* Recommendations */}
          {coaching?.recommendations?.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Lightbulb size={20} className="text-primary" />
                Empfehlungen für dich
              </h3>
              <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
                {coaching.recommendations.map((rec, i) => (
                  <RecommendationCard
                    key={i}
                    rec={rec}
                    index={i}
                    onNavigate={handleNavigate}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Progress Chart */}
          {sessions && (
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <BarChart3 size={20} className="text-indigo-500" />
                Dein Fortschritt
              </h3>
              <Card className="p-4">
                <ProgressChart
                  simulatorSessions={sessions.simulator}
                  videoSessions={sessions.video}
                  roleplaySessions={sessions.roleplay}
                  gameSessions={sessions.games}
                />
              </Card>
            </div>
          )}

          {/* Motivation Quote */}
          {coaching?.motivation && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-center py-8"
            >
              <Sparkles size={24} className="text-primary mx-auto mb-3" />
              <p className="text-lg font-medium text-slate-700 italic">
                "{coaching.motivation}"
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KiCoachApp;
