import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ThumbsUp,
  Target,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Quote,
  Lightbulb,
  Sparkles,
  TrendingUp,
  Award,
  Star,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * StructuredFeedbackDisplay Component
 *
 * A modern, visually impressive React component for displaying
 * AI analysis feedback in a 3-tier hierarchy:
 * 1. Executive Summary (Total Score, Top Strength, Primary Weakness)
 * 2. Category Tabs with scores
 * 3. Accordion-style detail cards
 */

// Default analysis data for testing
const defaultAnalysisData = {
  overall_analysis: {
    total_score: 72,
    summary_text: "Ein solider Start! Du wirkst sehr sympathisch, aber verlierst im Mittelteil den roten Faden.",
    top_strength: "Starke Empathie und Beziehungsaufbau",
    primary_weakness: "STAR-Methode bei Rückfragen nicht angewandt"
  },
  categories: [
    {
      id: "methodology",
      title: "Methodik & Struktur",
      score: 65,
      items: [
        {
          criterion: "Fragetechnik",
          rating: 2,
          observation: "Du hast dem Kunden keine offenen Fragen gestellt, sondern direkt dein Produkt präsentiert.",
          quote_evidence: "Hier ist unser Produkt, es kostet 50 Euro und kann...",
          improvement_suggestion: "Nutze offene W-Fragen: 'Was ist aktuell Ihre größte Herausforderung im Bereich X?'"
        },
        {
          criterion: "Gesprächsabschluss",
          rating: 5,
          observation: "Exzellente Verbindlichkeit am Ende.",
          quote_evidence: null,
          improvement_suggestion: null
        }
      ]
    },
    {
      id: "soft_skills",
      title: "Rhetorik & Wirkung",
      score: 88,
      items: [
        {
          criterion: "Tonfall",
          rating: 4,
          observation: "Sehr angenehme, ruhige Stimme. Wirkt souverän.",
          quote_evidence: null,
          improvement_suggestion: "Versuche an spannenden Stellen etwas mehr Dynamik reinzubringen."
        }
      ]
    }
  ]
};

/**
 * Circular Score Ring Component
 */
const ScoreRing = ({ score, size = 'large', className }) => {
  const isLarge = size === 'large';
  const radius = isLarge ? 54 : 32;
  const strokeWidth = isLarge ? 8 : 5;
  const viewBoxSize = isLarge ? 128 : 80;
  const center = viewBoxSize / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  // Color based on score
  const getScoreColor = (score) => {
    if (score >= 80) return { stroke: '#10b981', text: 'text-green-600' };
    if (score >= 60) return { stroke: '#3b82f6', text: 'text-blue-600' };
    if (score >= 40) return { stroke: '#f59e0b', text: 'text-amber-500' };
    return { stroke: '#ef4444', text: 'text-red-500' };
  };

  const colors = getScoreColor(score);

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        className={isLarge ? 'w-32 h-32' : 'w-20 h-20'}
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
      >
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={colors.stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.span
          className={cn("font-bold", colors.text, isLarge ? 'text-3xl' : 'text-xl')}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          {Math.round(score)}%
        </motion.span>
      </div>
    </div>
  );
};

/**
 * Rating Bar Component (1-5 scale)
 */
const RatingBar = ({ rating, maxRating = 5 }) => {
  const percentage = (rating / maxRating) * 100;

  const getBarColor = (rating, max) => {
    const ratio = rating / max;
    if (ratio >= 0.8) return 'bg-green-500';
    if (ratio >= 0.6) return 'bg-blue-500';
    if (ratio >= 0.4) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full", getBarColor(rating, maxRating))}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
      <span className="text-sm font-semibold text-slate-700 min-w-[3rem] text-right">
        {rating}/{maxRating}
      </span>
    </div>
  );
};

/**
 * Highlight Card Component
 */
const HighlightCard = ({ type, title, content, icon: Icon }) => {
  const isStrength = type === 'strength';

  return (
    <motion.div
      className={cn(
        "p-4 rounded-xl border-2 flex items-start gap-3",
        isStrength
          ? "bg-green-50 border-green-200"
          : "bg-amber-50 border-amber-200"
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className={cn(
        "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
        isStrength ? "bg-green-100" : "bg-amber-100"
      )}>
        <Icon className={cn(
          "w-5 h-5",
          isStrength ? "text-green-600" : "text-amber-600"
        )} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-xs font-semibold uppercase tracking-wide mb-1",
          isStrength ? "text-green-600" : "text-amber-600"
        )}>
          {title}
        </p>
        <p className={cn(
          "text-sm font-medium leading-relaxed",
          isStrength ? "text-green-900" : "text-amber-900"
        )}>
          {content}
        </p>
      </div>
    </motion.div>
  );
};

/**
 * Category Tab Component
 */
const CategoryTab = ({ category, isActive, onClick }) => {
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        "relative px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
        isActive
          ? "bg-blue-600 text-white shadow-md"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <span className="truncate">{category.title}</span>
      <span className={cn(
        "px-2 py-0.5 rounded-full text-xs font-bold",
        isActive
          ? "bg-white/20 text-white"
          : "bg-slate-200 text-slate-600"
      )}>
        {category.score}%
      </span>
    </motion.button>
  );
};

/**
 * Feedback Item Accordion Component
 */
const FeedbackItemCard = ({ item, index }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusIcon = (rating, maxRating = 5) => {
    const ratio = rating / maxRating;
    if (ratio >= 0.8) return { icon: CheckCircle2, color: 'text-green-500' };
    if (ratio >= 0.4) return { icon: TrendingUp, color: 'text-amber-500' };
    return { icon: AlertTriangle, color: 'text-red-500' };
  };

  const status = getStatusIcon(item.rating);
  const StatusIcon = status.icon;

  return (
    <motion.div
      className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      layout
    >
      {/* Collapsed Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <StatusIcon className={cn("w-5 h-5 flex-shrink-0", status.color)} />
          <span className="font-semibold text-slate-800 truncate">
            {item.criterion}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:block w-32">
            <RatingBar rating={item.rating} />
          </div>
          <div className="sm:hidden">
            <span className={cn(
              "text-sm font-bold",
              item.rating >= 4 ? "text-green-600" :
              item.rating >= 3 ? "text-amber-600" : "text-red-600"
            )}>
              {item.rating}/5
            </span>
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-5 h-5 text-slate-400" />
          </motion.div>
        </div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-2 space-y-4 border-t border-slate-100">
              {/* Observation */}
              {item.observation && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">
                      Beobachtung
                    </p>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {item.observation}
                    </p>
                  </div>
                </div>
              )}

              {/* Quote Evidence */}
              {item.quote_evidence && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <Quote className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                      Zitat aus dem Gespräch
                    </p>
                    <blockquote className="text-sm text-slate-600 italic bg-slate-50 p-3 rounded-lg border-l-4 border-slate-300">
                      "{item.quote_evidence}"
                    </blockquote>
                  </div>
                </div>
              )}

              {/* Improvement Suggestion */}
              {item.improvement_suggestion && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <Lightbulb className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">
                      Action Item
                    </p>
                    <p className="text-sm text-slate-700 leading-relaxed bg-amber-50 p-3 rounded-lg border border-amber-200">
                      {item.improvement_suggestion}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/**
 * Main StructuredFeedbackDisplay Component
 */
function StructuredFeedbackDisplay({ analysisData = defaultAnalysisData, isLoading = false }) {
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  // Parse and validate analysis data
  const parsedData = useMemo(() => {
    if (!analysisData) return null;

    // Support both object and JSON string input
    if (typeof analysisData === 'string') {
      try {
        let jsonString = analysisData.trim();
        // Remove markdown code blocks if present
        if (jsonString.startsWith('```json')) {
          jsonString = jsonString.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
        } else if (jsonString.startsWith('```')) {
          jsonString = jsonString.replace(/```\s*/g, '').replace(/```\s*$/g, '');
        }
        return JSON.parse(jsonString);
      } catch (error) {
        console.error('Error parsing analysis JSON:', error);
        return null;
      }
    }

    return analysisData;
  }, [analysisData]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="w-12 h-12 text-blue-600" />
        </motion.div>
        <p className="mt-4 text-slate-600 font-medium">Analyse wird geladen...</p>
        <p className="mt-1 text-sm text-slate-500">Das kann einen Moment dauern</p>
      </div>
    );
  }

  // Error/No data state
  if (!parsedData || !parsedData.overall_analysis) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8 text-slate-400" />
        </div>
        <p className="text-slate-600 font-medium">Keine Analysedaten verfügbar</p>
        <p className="mt-1 text-sm text-slate-500 text-center max-w-md">
          Bitte führe zuerst ein Rollenspiel durch, um eine Analyse zu erhalten.
        </p>
      </div>
    );
  }

  const { overall_analysis, categories = [] } = parsedData;
  const activeCategory = categories[activeTabIndex];

  return (
    <div className="space-y-6">
      {/* ============================================ */}
      {/* EBENE 1: Executive Summary */}
      {/* ============================================ */}
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Total Score + Summary */}
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Score Ring */}
            <div className="flex-shrink-0">
              <ScoreRing score={overall_analysis.total_score} size="large" />
            </div>

            {/* Summary Text */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <Award className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-800">Gesamtbewertung</h3>
              </div>
              <p className="text-slate-600 leading-relaxed">
                {overall_analysis.summary_text}
              </p>
            </div>
          </div>
        </div>

        {/* Highlight Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {overall_analysis.top_strength && (
            <HighlightCard
              type="strength"
              title="Deine Superkraft"
              content={overall_analysis.top_strength}
              icon={ThumbsUp}
            />
          )}
          {overall_analysis.primary_weakness && (
            <HighlightCard
              type="weakness"
              title="Dein Trainingsfeld"
              content={overall_analysis.primary_weakness}
              icon={Target}
            />
          )}
        </div>
      </motion.div>

      {/* ============================================ */}
      {/* EBENE 2: Category Tabs */}
      {/* ============================================ */}
      {categories.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-slate-200">
            {categories.map((category, index) => (
              <CategoryTab
                key={category.id || index}
                category={category}
                isActive={activeTabIndex === index}
                onClick={() => setActiveTabIndex(index)}
              />
            ))}
          </div>

          {/* ============================================ */}
          {/* EBENE 3: Detail Cards (Akkordeon) */}
          {/* ============================================ */}
          <AnimatePresence mode="wait">
            {activeCategory && (
              <motion.div
                key={activeCategory.id || activeTabIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-3"
              >
                {/* Category Header with Score */}
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-bold text-slate-800">
                    {activeCategory.title}
                  </h4>
                  <div className="flex items-center gap-2">
                    <ScoreRing score={activeCategory.score} size="small" />
                  </div>
                </div>

                {/* Feedback Items */}
                {activeCategory.items && activeCategory.items.length > 0 ? (
                  <div className="space-y-3">
                    {activeCategory.items.map((item, index) => (
                      <FeedbackItemCard
                        key={item.criterion || index}
                        item={item}
                        index={index}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 rounded-xl">
                    <p className="text-slate-500">
                      Keine Details für diese Kategorie verfügbar.
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Empty Categories State */}
      {categories.length === 0 && (
        <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
          <Star className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">Keine Kategorien verfügbar</p>
          <p className="text-sm text-slate-500 mt-1">
            Die detaillierte Analyse wird hier angezeigt, sobald sie verfügbar ist.
          </p>
        </div>
      )}
    </div>
  );
}

export default StructuredFeedbackDisplay;
