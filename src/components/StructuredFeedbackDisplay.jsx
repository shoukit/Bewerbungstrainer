import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ThumbsUp,
  Target,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Sparkles,
  TrendingUp,
  Award,
  Loader2,
  BarChart3,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * StructuredFeedbackDisplay Component
 *
 * Displays Gemini feedback (feedback_json) for the Coaching tab:
 * - Summary with overall score
 * - Top strength & primary weakness
 * - Rating criteria (communication, motivation, professionalism)
 * - Additional strengths, improvements, and tips
 */

/**
 * Circular Score Ring Component
 */
const ScoreRing = ({ score, size = 'large', maxScore = 100 }) => {
  const isLarge = size === 'large';
  const radius = isLarge ? 54 : 28;
  const strokeWidth = isLarge ? 8 : 4;
  const viewBoxSize = isLarge ? 128 : 72;
  const center = viewBoxSize / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = (score / maxScore) * 100;
  const progress = (percentage / 100) * circumference;

  const getScoreColor = (pct) => {
    if (pct >= 80) return { stroke: '#10b981', text: 'text-green-600' };
    if (pct >= 60) return { stroke: '#3b82f6', text: 'text-blue-600' };
    if (pct >= 40) return { stroke: '#f59e0b', text: 'text-amber-500' };
    return { stroke: '#ef4444', text: 'text-red-500' };
  };

  const colors = getScoreColor(percentage);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        className={isLarge ? 'w-28 h-28' : 'w-16 h-16'}
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
        />
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
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className={cn("font-bold", colors.text, isLarge ? 'text-2xl' : 'text-sm')}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {Math.round(score)}%
        </motion.span>
      </div>
    </div>
  );
};

/**
 * Rating Bar Component
 */
const RatingBar = ({ rating, maxRating = 10, showLabel = true }) => {
  const percentage = (rating / maxRating) * 100;

  const getBarColor = (pct) => {
    if (pct >= 80) return 'bg-green-500';
    if (pct >= 60) return 'bg-blue-500';
    if (pct >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getTextColor = (pct) => {
    if (pct >= 80) return 'text-green-600';
    if (pct >= 60) return 'text-blue-600';
    if (pct >= 40) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full", getBarColor(percentage))}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
      {showLabel && (
        <span className={cn("text-sm font-semibold min-w-[2.5rem] text-right", getTextColor(percentage))}>
          {rating}/{maxRating}
        </span>
      )}
    </div>
  );
};

/**
 * Rating Criterion Card (Accordion style)
 */
const CriterionCard = ({ label, rating, maxRating = 10, description, index }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const percentage = (rating / maxRating) * 100;

  const getStatusIcon = (pct) => {
    if (pct >= 80) return { icon: CheckCircle2, color: 'text-green-500' };
    if (pct >= 40) return { icon: TrendingUp, color: 'text-amber-500' };
    return { icon: AlertTriangle, color: 'text-red-500' };
  };

  const status = getStatusIcon(percentage);
  const StatusIcon = status.icon;

  return (
    <motion.div
      className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <button
        onClick={() => description && setIsExpanded(!isExpanded)}
        disabled={!description}
        className={cn(
          "w-full px-4 py-3 flex items-center justify-between gap-3 transition-colors",
          description ? "hover:bg-slate-50 cursor-pointer" : "cursor-default"
        )}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <StatusIcon className={cn("w-5 h-5 flex-shrink-0", status.color)} />
          <span className="font-medium text-slate-800 text-sm truncate">
            {label}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-20">
            <RatingBar rating={rating} maxRating={maxRating} />
          </div>
          {description && (
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </motion.div>
          )}
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && description && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 border-t border-slate-100">
              <p className="text-sm text-slate-600 leading-relaxed">
                {description}
              </p>
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
function StructuredFeedbackDisplay({ feedback, isLoading = false }) {
  // Parse JSON if needed
  const data = useMemo(() => {
    if (!feedback) return null;
    if (typeof feedback === 'string') {
      try {
        let jsonString = feedback.trim();
        if (jsonString.startsWith('```json')) {
          jsonString = jsonString.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
        } else if (jsonString.startsWith('```')) {
          jsonString = jsonString.replace(/```\s*/g, '').replace(/```\s*$/g, '');
        }
        return JSON.parse(jsonString);
      } catch (e) {
        console.error('Failed to parse feedback:', e);
        return null;
      }
    }
    return feedback;
  }, [feedback]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="w-10 h-10 text-blue-600" />
        </motion.div>
        <p className="mt-3 text-slate-600 text-sm">Feedback wird geladen...</p>
      </div>
    );
  }

  // No data state
  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <BarChart3 className="w-12 h-12 text-slate-200 mb-3" />
        <p className="text-slate-500 text-sm">Kein Feedback verfügbar.</p>
        <p className="text-slate-400 text-xs mt-1">
          Das Feedback erscheint hier nach dem Gespräch.
        </p>
      </div>
    );
  }

  // Calculate overall score (convert 1-10 to percentage)
  const overallScore = data.rating?.overall
    ? Math.round((data.rating.overall / 10) * 100)
    : null;

  return (
    <div className="space-y-5">
      {/* Executive Summary */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {/* Score + Summary */}
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-4">
            {overallScore !== null && (
              <ScoreRing score={overallScore} size="large" />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-2">
                <Award className="w-4 h-4 text-blue-600" />
                Gesamtbewertung
              </h3>
              {data.summary && (
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                  {data.summary}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Highlight Cards */}
        <div className="grid grid-cols-1 gap-3">
          {data.strengths?.[0] && (
            <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                <ThumbsUp className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                  Deine Superkraft
                </p>
                <p className="text-sm text-green-900 mt-0.5 leading-relaxed">
                  {data.strengths[0]}
                </p>
              </div>
            </div>
          )}

          {data.improvements?.[0] && (
            <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Target className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                  Dein Trainingsfeld
                </p>
                <p className="text-sm text-amber-900 mt-0.5 leading-relaxed">
                  {data.improvements[0]}
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Bewertungskriterien */}
      {data.rating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            Bewertungskriterien
          </h4>

          <div className="space-y-2">
            {data.rating.communication !== undefined && (
              <CriterionCard
                label="Kommunikation"
                rating={data.rating.communication}
                maxRating={10}
                description="Wie klar und verständlich du dich während des Gesprächs ausgedrückt hast."
                index={0}
              />
            )}

            {data.rating.motivation !== undefined && (
              <CriterionCard
                label="Motivation"
                rating={data.rating.motivation}
                maxRating={10}
                description="Wie motiviert und engagiert du während des Gesprächs gewirkt hast."
                index={1}
              />
            )}

            {data.rating.professionalism !== undefined && (
              <CriterionCard
                label="Professionalität"
                rating={data.rating.professionalism}
                maxRating={10}
                description="Dein professionelles Auftreten und Verhalten im Gespräch."
                index={2}
              />
            )}
          </div>
        </motion.div>
      )}

      {/* Additional Strengths */}
      {data.strengths?.length > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="p-4 bg-green-50 border border-green-200 rounded-xl"
        >
          <h4 className="text-sm font-bold text-green-800 mb-2 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Weitere Stärken
          </h4>
          <ul className="space-y-1.5">
            {data.strengths.slice(1).map((strength, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-green-700">
                <span className="text-green-500 mt-0.5">•</span>
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Additional Improvements */}
      {data.improvements?.length > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="p-4 bg-amber-50 border border-amber-200 rounded-xl"
        >
          <h4 className="text-sm font-bold text-amber-800 mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Verbesserungspotential
          </h4>
          <ul className="space-y-1.5">
            {data.improvements.slice(1).map((improvement, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-amber-700">
                <span className="text-amber-500 mt-0.5">•</span>
                <span>{improvement}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Tips */}
      {data.tips?.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="p-4 bg-blue-50 border border-blue-200 rounded-xl"
        >
          <h4 className="text-sm font-bold text-blue-800 mb-2 flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Praktische Tipps
          </h4>
          <ul className="space-y-1.5">
            {data.tips.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-blue-700">
                <Zap className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  );
}

export default StructuredFeedbackDisplay;
