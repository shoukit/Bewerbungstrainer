/**
 * ProgressChart Component
 *
 * Beautiful progress visualization with Recharts.
 * Shows user's training progress over time across all modules.
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  ComposedChart,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Trophy,
  Target,
  BarChart3,
  Calendar,
  ChevronDown,
  Eye,
  EyeOff,
  Sparkles,
  Video,
  MessageSquare,
  Mic,
  Activity,
} from 'lucide-react';
import { Card } from '@/components/ui';

/**
 * Module configuration with colors and labels
 */
const MODULE_CONFIG = {
  overall: {
    key: 'overall',
    label: 'Gesamt',
    shortLabel: 'Ø',
    color: '#6366F1', // Indigo
    icon: Activity,
    description: 'Durchschnitt aller Module',
  },
  rhetorik: {
    key: 'rhetorik',
    label: 'Rhetorik-Gym',
    shortLabel: 'RG',
    color: '#10B981', // Emerald
    icon: Mic,
    description: 'Sprechtraining & Füllwörter',
  },
  simulator: {
    key: 'simulator',
    label: 'Szenario-Training',
    shortLabel: 'ST',
    color: '#F59E0B', // Amber
    icon: Target,
    description: 'Strukturiertes Q&A Training',
  },
  video: {
    key: 'video',
    label: 'Wirkungs-Analyse',
    shortLabel: 'WA',
    color: '#F43F5E', // Rose
    icon: Video,
    description: 'Video-Training mit Körpersprache',
  },
  roleplay: {
    key: 'roleplay',
    label: 'Live-Simulation',
    shortLabel: 'LS',
    color: '#06B6D4', // Cyan
    icon: MessageSquare,
    description: 'Echtzeit-Gespräche mit KI',
  },
};

/**
 * Time range options
 */
const TIME_RANGES = [
  { value: 7, label: 'Letzte 7 Tage' },
  { value: 30, label: 'Letzte 30 Tage' },
  { value: 90, label: 'Letzte 90 Tage' },
  { value: 365, label: 'Letztes Jahr' },
  { value: 0, label: 'Alle Zeit' },
];

/**
 * Custom Tooltip for the chart
 */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200 p-4 min-w-[180px]">
      <p className="text-sm font-medium text-slate-600 mb-2">{label}</p>
      <div className="space-y-1.5">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-slate-700">{entry.name}</span>
            </div>
            <span className="text-sm font-semibold text-slate-900">
              {entry.value?.toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Module Toggle Button
 */
const ModuleToggle = ({ module, isActive, onClick }) => {
  const Icon = module.icon;

  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all duration-200
        ${isActive
          ? 'border-current bg-current/10 shadow-sm'
          : 'border-slate-200 bg-white hover:border-slate-300 opacity-50'
        }
      `}
      style={{
        borderColor: isActive ? module.color : undefined,
        color: module.color,
      }}
    >
      <Icon size={16} className={isActive ? '' : 'text-slate-400'} />
      <span className={`text-sm font-medium ${isActive ? '' : 'text-slate-400'}`}>
        {module.label}
      </span>
      {isActive ? (
        <Eye size={14} className="ml-1" />
      ) : (
        <EyeOff size={14} className="ml-1 text-slate-400" />
      )}
    </button>
  );
};

/**
 * Stat Card Component
 */
const StatCard = ({ icon: Icon, label, value, subValue, trend, color }) => {
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor = trend > 0 ? 'text-emerald-500' : trend < 0 ? 'text-rose-500' : 'text-slate-400';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Background gradient */}
      <div
        className="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-20"
        style={{ backgroundColor: color }}
      />

      <div className="relative">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${color}20` }}
          >
            <Icon size={20} style={{ color }} />
          </div>
          <span className="text-sm font-medium text-slate-500">{label}</span>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <div className="text-3xl font-bold text-slate-900">{value}</div>
            {subValue && (
              <div className="text-sm text-slate-500 mt-1">{subValue}</div>
            )}
          </div>

          {trend !== undefined && trend !== null && (
            <div className={`flex items-center gap-1 ${trendColor}`}>
              <TrendIcon size={18} />
              <span className="text-sm font-semibold">
                {trend > 0 ? '+' : ''}{trend.toFixed(0)}%
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

/**
 * Time Range Dropdown
 */
const TimeRangeDropdown = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selected = TIME_RANGES.find(r => r.value === value);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow text-sm font-medium text-slate-700"
      >
        <Calendar size={16} className="text-slate-400" />
        {selected?.label}
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-20 min-w-[180px]"
            >
              {TIME_RANGES.map((range) => (
                <button
                  key={range.value}
                  onClick={() => {
                    onChange(range.value);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-3 text-left text-sm transition-colors ${
                    value === range.value
                      ? 'bg-indigo-50 text-indigo-600 font-medium'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * Empty State Component
 */
const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-16 px-6">
    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-6">
      <BarChart3 size={40} className="text-indigo-500" />
    </div>
    <h3 className="text-xl font-semibold text-slate-700 mb-2">
      Noch nicht genügend Daten
    </h3>
    <p className="text-slate-500 text-center max-w-md">
      Schließe ein paar Trainings ab, um deinen Fortschritt hier zu sehen.
      Wir zeigen dir dann, wie du dich über die Zeit verbesserst!
    </p>
  </div>
);

/**
 * Main ProgressChart Component
 */
const ProgressChart = ({
  simulatorSessions = [],
  videoSessions = [],
  roleplaySessions = [],
  gameSessions = [],
}) => {
  // State
  const [timeRange, setTimeRange] = useState(30);
  const [activeModules, setActiveModules] = useState({
    overall: true,
    rhetorik: true,
    simulator: true,
    video: true,
    roleplay: true,
  });

  // Process data
  const chartData = useMemo(() => {
    // Use start of today for accurate day-based filtering
    const now = new Date();
    // Create today at end of day (local timezone)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    // Calculate cutoff date using date arithmetic (safer than milliseconds)
    // This properly handles month/year boundaries
    let cutoffDate;
    if (timeRange === 0) {
      cutoffDate = new Date(0); // All time
    } else {
      // Create a new date at start of cutoff day
      cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (timeRange - 1), 0, 0, 0, 0);
    }

    console.log('[ProgressChart] Date range:', {
      today: today.toLocaleDateString('de-DE'),
      cutoffDate: cutoffDate.toLocaleDateString('de-DE'),
      timeRange: timeRange === 0 ? 'all' : `${timeRange} days`,
    });

    // Helper to normalize scores to 0-100
    const normalizeScore = (score, maxScore = 10) => {
      if (score === null || score === undefined) return null;
      const numScore = parseFloat(score);
      if (isNaN(numScore)) return null;
      // If score is already 0-100 range, keep it
      if (maxScore === 100) return Math.min(100, Math.max(0, numScore));
      // Otherwise scale to 0-100
      return Math.min(100, Math.max(0, (numScore / maxScore) * 100));
    };

    // Helper to parse date
    const parseDate = (dateStr) => {
      if (!dateStr) return null;
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? null : date;
    };

    // Debug: Log all raw session counts and dates
    console.log('[ProgressChart] Raw session data:', {
      simulator: simulatorSessions.length,
      video: videoSessions.length,
      roleplay: roleplaySessions.length,
      games: gameSessions.length,
      cutoffDate: cutoffDate.toLocaleDateString('de-DE'),
      today: today.toLocaleDateString('de-DE'),
    });

    // Collect all sessions with normalized scores
    const allSessions = [];
    const skippedSessions = { noDate: 0, beforeCutoff: 0, noScore: 0 };

    // Rhetorik-Gym sessions (score is 0-100)
    gameSessions.forEach(session => {
      const date = parseDate(session.created_at);
      // Score can be in different fields depending on API response
      // Also handle string scores by parsing them
      let score = session.score ?? session.total_score ?? session.game_score;
      if (typeof score === 'string') {
        score = parseFloat(score);
      }

      if (!date) { skippedSessions.noDate++; return; }
      if (date < cutoffDate) {
        skippedSessions.beforeCutoff++;
        console.log('[ProgressChart] Game session before cutoff:', date.toLocaleDateString('de-DE'));
        return;
      }
      if (score === null || score === undefined || isNaN(score)) { skippedSessions.noScore++; return; }

      allSessions.push({
        date,
        module: 'rhetorik',
        score: normalizeScore(score, 100),
      });
    });

    // Simulator sessions (overall_score is 0-10)
    simulatorSessions.forEach(session => {
      const date = parseDate(session.created_at);
      let score = session.overall_score;
      if (typeof score === 'string') score = parseFloat(score);

      if (!date) { skippedSessions.noDate++; return; }
      if (date < cutoffDate) {
        skippedSessions.beforeCutoff++;
        console.log('[ProgressChart] Simulator session before cutoff:', date.toLocaleDateString('de-DE'));
        return;
      }
      if (score === null || score === undefined || isNaN(score)) { skippedSessions.noScore++; return; }

      allSessions.push({
        date,
        module: 'simulator',
        score: normalizeScore(score, 10),
      });
    });

    // Video sessions (overall_score is 0-10)
    videoSessions.forEach(session => {
      const date = parseDate(session.created_at);
      let score = session.overall_score;
      if (typeof score === 'string') score = parseFloat(score);

      if (!date) { skippedSessions.noDate++; return; }
      if (date < cutoffDate) {
        skippedSessions.beforeCutoff++;
        console.log('[ProgressChart] Video session before cutoff:', date.toLocaleDateString('de-DE'));
        return;
      }
      if (score === null || score === undefined || isNaN(score)) { skippedSessions.noScore++; return; }

      allSessions.push({
        date,
        module: 'video',
        score: normalizeScore(score, 10),
      });
    });

    // Roleplay sessions - extract score from feedback_json or audio_analysis_json
    roleplaySessions.forEach(session => {
      const date = parseDate(session.created_at);

      if (!date) { skippedSessions.noDate++; return; }
      if (date < cutoffDate) {
        skippedSessions.beforeCutoff++;
        console.log('[ProgressChart] Roleplay session before cutoff:', date.toLocaleDateString('de-DE'));
        return;
      }

      let overallScore = null;

      // Try feedback_json first (skip if it's literally "missing" or invalid)
      if (session.feedback_json && session.feedback_json !== 'missing') {
        try {
          const feedback = typeof session.feedback_json === 'string'
            ? JSON.parse(session.feedback_json)
            : session.feedback_json;

          // Try to find an overall score in the feedback
          // The feedback structure is: { rating: { overall: 1-10, ... }, ... }
          overallScore =
            feedback?.rating?.overall ||           // Standard format from feedbackPrompt
            feedback?.rating?.gesamteindruck ||    // German variant
            feedback?.overall_score ||             // Legacy format
            feedback?.overallScore ||              // camelCase variant
            feedback?.gesamtbewertung ||           // German legacy
            feedback?.score;                       // Fallback
        } catch (e) {
          // Invalid JSON, continue to try other fields
        }
      }

      // Try audio_analysis_json as fallback (might have confidence score)
      if (overallScore === null && session.audio_analysis_json && session.audio_analysis_json !== 'missing') {
        try {
          const audioAnalysis = typeof session.audio_analysis_json === 'string'
            ? JSON.parse(session.audio_analysis_json)
            : session.audio_analysis_json;

          // Audio analysis might have a confidence score (0-100)
          if (audioAnalysis?.confidence?.score !== undefined) {
            overallScore = audioAnalysis.confidence.score / 10; // Convert to 0-10 scale
          }
        } catch (e) {
          // Invalid JSON
        }
      }

      if (overallScore === undefined || overallScore === null) {
        skippedSessions.noScore++;
        return;
      }

      allSessions.push({
        date,
        module: 'roleplay',
        score: normalizeScore(overallScore, 10),
      });
    });

    // Sort by date
    allSessions.sort((a, b) => a.date - b.date);

    // Debug: Log session counts per module
    const moduleCounts = { rhetorik: 0, simulator: 0, video: 0, roleplay: 0 };
    allSessions.forEach(s => moduleCounts[s.module]++);
    console.log('[ProgressChart] Sessions in range:', {
      total: allSessions.length,
      ...moduleCounts,
      timeRange: timeRange === 0 ? 'all' : `${timeRange} days`,
      cutoffDate: cutoffDate.toISOString(),
      skipped: skippedSessions,
    });

    // If no data, return empty
    if (allSessions.length === 0) return [];

    // Helper to get local date key (YYYY-MM-DD in local timezone)
    const getLocalDateKey = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Group by date (day) - using local timezone
    const dateGroups = new Map();

    allSessions.forEach(session => {
      const dateKey = getLocalDateKey(session.date);
      if (!dateGroups.has(dateKey)) {
        dateGroups.set(dateKey, {
          date: session.date,
          rhetorik: [],
          simulator: [],
          video: [],
          roleplay: [],
        });
      }
      dateGroups.get(dateKey)[session.module].push(session.score);
    });

    // Convert to chart data format
    const data = [];
    const dateFormatter = new Intl.DateTimeFormat('de-DE', {
      day: 'numeric',
      month: 'short'
    });

    // Generate all dates in the selected range (for non-zero timeRange)
    if (timeRange > 0) {
      const endDate = new Date(today);
      const startDate = new Date(cutoffDate);

      // Create entries for each day in the range
      const currentDate = new Date(startDate);
      const seenDates = new Set(); // Prevent duplicates

      while (currentDate <= endDate) {
        const dateKey = getLocalDateKey(currentDate);

        // Skip if we've already processed this date
        if (seenDates.has(dateKey)) {
          currentDate.setDate(currentDate.getDate() + 1);
          continue;
        }
        seenDates.add(dateKey);

        const group = dateGroups.get(dateKey) || {
          date: new Date(currentDate),
          rhetorik: [],
          simulator: [],
          video: [],
          roleplay: [],
        };

        const entry = {
          date: dateKey,
          dateFormatted: dateFormatter.format(new Date(currentDate)),
        };

        // Calculate average for each module
        ['rhetorik', 'simulator', 'video', 'roleplay'].forEach(module => {
          if (group[module].length > 0) {
            entry[module] = group[module].reduce((a, b) => a + b, 0) / group[module].length;
          }
        });

        // Calculate overall average
        const allScores = [
          ...group.rhetorik,
          ...group.simulator,
          ...group.video,
          ...group.roleplay,
        ];
        if (allScores.length > 0) {
          entry.overall = allScores.reduce((a, b) => a + b, 0) / allScores.length;
        }

        data.push(entry);
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else {
      // For "All time", just show days with data
      dateGroups.forEach((group, dateKey) => {
        const entry = {
          date: dateKey,
          dateFormatted: dateFormatter.format(group.date),
        };

        // Calculate average for each module
        ['rhetorik', 'simulator', 'video', 'roleplay'].forEach(module => {
          if (group[module].length > 0) {
            entry[module] = group[module].reduce((a, b) => a + b, 0) / group[module].length;
          }
        });

        // Calculate overall average
        const allScores = [
          ...group.rhetorik,
          ...group.simulator,
          ...group.video,
          ...group.roleplay,
        ];
        if (allScores.length > 0) {
          entry.overall = allScores.reduce((a, b) => a + b, 0) / allScores.length;
        }

        data.push(entry);
      });
    }

    return data;
  }, [simulatorSessions, videoSessions, roleplaySessions, gameSessions, timeRange]);

  // Calculate statistics
  const stats = useMemo(() => {
    // Collect all individual scores from all modules for accurate counting
    const allScores = [];

    // Get scores from chart data (grouped by day, so we need individual scores)
    chartData.forEach(day => {
      if (day.rhetorik !== undefined) allScores.push(day.rhetorik);
      if (day.simulator !== undefined) allScores.push(day.simulator);
      if (day.video !== undefined) allScores.push(day.video);
      if (day.roleplay !== undefined) allScores.push(day.roleplay);
    });

    if (allScores.length === 0) {
      return {
        average: 0,
        trend: 0,
        best: 0,
        totalSessions: 0,
      };
    }

    const average = allScores.reduce((a, b) => a + b, 0) / allScores.length;
    const best = Math.max(...allScores);

    // Calculate trend (compare first half to second half of time period)
    // Use overall scores per day for trend calculation
    const overallScores = chartData
      .filter(d => d.overall !== undefined)
      .map(d => d.overall);

    let trend = 0;
    if (overallScores.length >= 2) {
      const midpoint = Math.floor(overallScores.length / 2);
      const firstHalf = overallScores.slice(0, midpoint);
      const secondHalf = overallScores.slice(midpoint);

      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

      trend = secondAvg - firstAvg;
    }

    return {
      average,
      trend,
      best,
      totalSessions: allScores.length,
    };
  }, [chartData]);

  // Toggle module visibility
  const toggleModule = (moduleKey) => {
    setActiveModules(prev => ({
      ...prev,
      [moduleKey]: !prev[moduleKey],
    }));
  };

  // Check if there's any data
  const hasData = chartData.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            Mein Fortschritt
          </h2>
          <p className="text-slate-500 mt-1">
            Verfolge deine Entwicklung über alle Module hinweg
          </p>
        </div>
        <TimeRangeDropdown value={timeRange} onChange={setTimeRange} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={BarChart3}
          label="Durchschnitt"
          value={`${stats.average.toFixed(0)}%`}
          subValue="über alle Module"
          color="#6366F1"
        />
        <StatCard
          icon={TrendingUp}
          label="Entwicklung"
          value={`${stats.trend >= 0 ? '+' : ''}${stats.trend.toFixed(0)}%`}
          subValue={stats.trend > 0 ? 'Verbesserung 📈' : stats.trend < 0 ? 'Rückgang 📉' : 'Stabil ➡️'}
          trend={stats.trend}
          color="#10B981"
        />
        <StatCard
          icon={Trophy}
          label="Beste Session"
          value={`${stats.best.toFixed(0)}%`}
          subValue="Höchstwert"
          color="#F59E0B"
        />
        <StatCard
          icon={Target}
          label="Sessions"
          value={stats.totalSessions}
          subValue="mit Score"
          color="#F43F5E"
        />
      </div>

      {/* Chart Card */}
      <Card className="p-6 rounded-2xl shadow-sm border border-slate-200">
        {/* Module Toggles */}
        <div className="flex flex-wrap gap-2 mb-6">
          {Object.values(MODULE_CONFIG).map((module) => (
            <ModuleToggle
              key={module.key}
              module={module}
              isActive={activeModules[module.key]}
              onClick={() => toggleModule(module.key)}
            />
          ))}
        </div>

        {/* Chart */}
        {hasData ? (
          <div className="w-full" style={{ height: 400, minHeight: 400 }}>
            <ResponsiveContainer width="100%" height={400} minHeight={400}>
              <ComposedChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
              >
                <defs>
                  {Object.values(MODULE_CONFIG).map((module) => (
                    <linearGradient
                      key={`gradient-${module.key}`}
                      id={`gradient-${module.key}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor={module.color} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={module.color} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#E2E8F0"
                  vertical={false}
                />

                <XAxis
                  dataKey="dateFormatted"
                  tick={{ fontSize: 12, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={{ stroke: '#E2E8F0' }}
                  dy={10}
                />

                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 12, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}%`}
                  dx={-10}
                />

                <Tooltip content={<CustomTooltip />} />

                {/* Area fills for active modules */}
                {activeModules.overall && (
                  <Area
                    type="monotone"
                    dataKey="overall"
                    stroke="none"
                    fill={`url(#gradient-overall)`}
                    connectNulls
                  />
                )}

                {/* Lines for each module */}
                {Object.values(MODULE_CONFIG).map((module) => (
                  activeModules[module.key] && (
                    <Line
                      key={module.key}
                      type="monotone"
                      dataKey={module.key}
                      name={module.label}
                      stroke={module.color}
                      strokeWidth={module.key === 'overall' ? 3 : 2}
                      dot={{
                        fill: module.color,
                        strokeWidth: 2,
                        stroke: '#fff',
                        r: module.key === 'overall' ? 5 : 4,
                      }}
                      activeDot={{
                        fill: module.color,
                        strokeWidth: 3,
                        stroke: '#fff',
                        r: 7,
                      }}
                      connectNulls
                    />
                  )
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState />
        )}
      </Card>

      {/* Legend / Help */}
      {hasData && (
        <div className="flex flex-wrap gap-4 justify-center text-sm text-slate-500">
          {Object.values(MODULE_CONFIG).map((module) => (
            <div key={module.key} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: module.color }}
              />
              <span>{module.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProgressChart;
