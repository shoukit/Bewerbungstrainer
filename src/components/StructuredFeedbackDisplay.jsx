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
  Loader2,
  Mic2,
  Volume2,
  Timer,
  Activity,
  BarChart3,
  MessageSquare,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * StructuredFeedbackDisplay Component
 *
 * Displays AI analysis feedback from Gemini in a structured format:
 * 1. Executive Summary (Total Score, Top Strength, Primary Weakness)
 * 2. Bewertungskriterien (Rating criteria with expandable details)
 * 3. Audio Analysis (Speech metrics if available)
 */

/**
 * Circular Score Ring Component
 */
const ScoreRing = ({ score, size = 'large', maxScore = 100, className }) => {
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
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        className={isLarge ? 'w-32 h-32' : 'w-16 h-16'}
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
          {Math.round(score)}{maxScore === 10 ? '' : '%'}
        </motion.span>
        {maxScore === 10 && (
          <span className="text-xs text-slate-400">/10</span>
        )}
      </div>
    </div>
  );
};

/**
 * Rating Bar Component (1-5 or 1-10 scale)
 */
const RatingBar = ({ rating, maxRating = 5, showLabel = true }) => {
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
 * Feedback Criterion Card (Accordion style)
 */
const CriterionCard = ({ criterion, rating, maxRating = 5, observation, quote, suggestion, index }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const percentage = (rating / maxRating) * 100;

  const getStatusIcon = (pct) => {
    if (pct >= 80) return { icon: CheckCircle2, color: 'text-green-500' };
    if (pct >= 40) return { icon: TrendingUp, color: 'text-amber-500' };
    return { icon: AlertTriangle, color: 'text-red-500' };
  };

  const status = getStatusIcon(percentage);
  const StatusIcon = status.icon;

  const hasDetails = observation || quote || suggestion;

  return (
    <motion.div
      className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <button
        onClick={() => hasDetails && setIsExpanded(!isExpanded)}
        disabled={!hasDetails}
        className={cn(
          "w-full px-4 py-3 flex items-center justify-between gap-3 transition-colors",
          hasDetails ? "hover:bg-slate-50 cursor-pointer" : "cursor-default"
        )}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <StatusIcon className={cn("w-5 h-5 flex-shrink-0", status.color)} />
          <span className="font-medium text-slate-800 text-sm truncate">
            {criterion}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-24 hidden sm:block">
            <RatingBar rating={rating} maxRating={maxRating} />
          </div>
          <span className={cn(
            "text-sm font-bold sm:hidden",
            percentage >= 80 ? "text-green-600" :
            percentage >= 40 ? "text-amber-600" : "text-red-600"
          )}>
            {rating}/{maxRating}
          </span>
          {hasDetails && (
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
        {isExpanded && hasDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 space-y-3 border-t border-slate-100">
              {observation && (
                <div className="text-sm text-slate-600 leading-relaxed">
                  {observation}
                </div>
              )}

              {quote && (
                <blockquote className="text-sm text-slate-500 italic bg-slate-50 p-3 rounded-lg border-l-4 border-slate-300">
                  "{quote}"
                </blockquote>
              )}

              {suggestion && (
                <div className="flex gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <Lightbulb className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800">{suggestion}</p>
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
 * Audio Metric Card
 */
const AudioMetricCard = ({ icon: Icon, label, rating, maxRating = 10, feedback, extra }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const percentage = (rating / maxRating) * 100;

  return (
    <motion.div
      className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 flex items-center justify-between gap-2 hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Icon className="w-4 h-4 text-slate-500 flex-shrink-0" />
          <span className="text-xs font-medium text-slate-700 truncate">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-xs font-bold",
            percentage >= 70 ? "text-green-600" :
            percentage >= 50 ? "text-amber-600" : "text-red-600"
          )}>
            {rating}/{maxRating}
          </span>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </motion.div>
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-1 border-t border-slate-200">
              {feedback && (
                <p className="text-xs text-slate-600 leading-relaxed">{feedback}</p>
              )}
              {extra && (
                <p className="text-xs text-slate-500 mt-1">{extra}</p>
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
function StructuredFeedbackDisplay({ analysisData, audioAnalysis, isLoading = false }) {
  // Parse JSON if needed
  const feedback = useMemo(() => {
    if (!analysisData) return null;
    if (typeof analysisData === 'string') {
      try {
        return JSON.parse(analysisData);
      } catch {
        return null;
      }
    }
    // Check if it's the transformed format or original Gemini format
    if (analysisData.overall_analysis) {
      // It's already transformed - extract the original format
      return {
        summary: analysisData.overall_analysis.summary_text,
        rating: {
          overall: Math.round((analysisData.overall_analysis.total_score / 100) * 10),
        },
        strengths: analysisData.overall_analysis.top_strength ? [analysisData.overall_analysis.top_strength] : [],
        improvements: analysisData.overall_analysis.primary_weakness ? [analysisData.overall_analysis.primary_weakness] : [],
        categories: analysisData.categories,
      };
    }
    return analysisData;
  }, [analysisData]);

  const audio = useMemo(() => {
    if (!audioAnalysis) return null;
    if (typeof audioAnalysis === 'string') {
      try {
        return JSON.parse(audioAnalysis);
      } catch {
        return null;
      }
    }
    return audioAnalysis;
  }, [audioAnalysis]);

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
        <p className="mt-3 text-slate-600 text-sm">Analyse wird geladen...</p>
      </div>
    );
  }

  // No data state
  if (!feedback) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <BarChart3 className="w-12 h-12 text-slate-200 mb-3" />
        <p className="text-slate-500 text-sm">Keine Analysedaten verfügbar.</p>
        <p className="text-slate-400 text-xs mt-1">
          Die Analyse erscheint hier nach dem Gespräch.
        </p>
      </div>
    );
  }

  // Calculate overall score (convert 1-10 to percentage)
  const overallScore = feedback.rating?.overall
    ? Math.round((feedback.rating.overall / 10) * 100)
    : null;

  return (
    <div className="space-y-6">
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
              {feedback.summary && (
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                  {feedback.summary}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Highlight Cards */}
        <div className="grid grid-cols-1 gap-3">
          {feedback.strengths?.[0] && (
            <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                <ThumbsUp className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                  Deine Superkraft
                </p>
                <p className="text-sm text-green-900 mt-0.5 leading-relaxed">
                  {feedback.strengths[0]}
                </p>
              </div>
            </div>
          )}

          {feedback.improvements?.[0] && (
            <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Target className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                  Dein Trainingsfeld
                </p>
                <p className="text-sm text-amber-900 mt-0.5 leading-relaxed">
                  {feedback.improvements[0]}
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Bewertungskriterien */}
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
          {/* Rating criteria from Gemini */}
          {feedback.rating?.communication !== undefined && (
            <CriterionCard
              criterion="Kommunikation"
              rating={feedback.rating.communication}
              maxRating={10}
              observation="Wie klar und verständlich du dich ausdrückst."
              index={0}
            />
          )}

          {feedback.rating?.motivation !== undefined && (
            <CriterionCard
              criterion="Motivation"
              rating={feedback.rating.motivation}
              maxRating={10}
              observation="Wie motiviert und engagiert du wirkst."
              index={1}
            />
          )}

          {feedback.rating?.professionalism !== undefined && (
            <CriterionCard
              criterion="Professionalität"
              rating={feedback.rating.professionalism}
              maxRating={10}
              observation="Dein professionelles Auftreten."
              index={2}
            />
          )}

          {/* Categories from transformed data */}
          {feedback.categories?.map((category, catIdx) => (
            category.items?.map((item, itemIdx) => (
              <CriterionCard
                key={`${category.id}-${itemIdx}`}
                criterion={item.criterion}
                rating={item.rating}
                maxRating={5}
                observation={item.observation}
                quote={item.quote_evidence}
                suggestion={item.improvement_suggestion}
                index={catIdx * 10 + itemIdx + 3}
              />
            ))
          ))}
        </div>
      </motion.div>

      {/* Additional Strengths */}
      {feedback.strengths?.length > 1 && (
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
            {feedback.strengths.slice(1).map((strength, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-green-700">
                <span className="text-green-500 mt-0.5">•</span>
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Additional Improvements */}
      {feedback.improvements?.length > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="p-4 bg-amber-50 border border-amber-200 rounded-xl"
        >
          <h4 className="text-sm font-bold text-amber-800 mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Weitere Verbesserungen
          </h4>
          <ul className="space-y-1.5">
            {feedback.improvements.slice(1).map((improvement, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-amber-700">
                <span className="text-amber-500 mt-0.5">•</span>
                <span>{improvement}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Tips */}
      {feedback.tips?.length > 0 && (
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
            {feedback.tips.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-blue-700">
                <Zap className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Audio Analysis Section */}
      {audio && !audio.error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
            <Mic2 className="w-4 h-4 text-blue-600" />
            Audio-Analyse
          </h4>

          {audio.summary && (
            <p className="text-xs text-slate-600 mb-3 p-3 bg-slate-50 rounded-lg">
              {audio.summary}
            </p>
          )}

          <div className="grid grid-cols-2 gap-2">
            {audio.clarity && (
              <AudioMetricCard
                icon={Volume2}
                label="Deutlichkeit"
                rating={audio.clarity.rating}
                feedback={audio.clarity.feedback}
              />
            )}

            {audio.pace && (
              <AudioMetricCard
                icon={Timer}
                label="Tempo"
                rating={audio.pace.rating}
                feedback={audio.pace.feedback}
                extra={audio.pace.wordsPerMinute ? `${audio.pace.wordsPerMinute} WpM` : null}
              />
            )}

            {audio.fillerWords && (
              <AudioMetricCard
                icon={MessageSquare}
                label="Füllwörter"
                rating={audio.fillerWords.rating}
                feedback={audio.fillerWords.feedback}
                extra={audio.fillerWords.count ? `${audio.fillerWords.count} gefunden` : null}
              />
            )}

            {audio.nervousness && (
              <AudioMetricCard
                icon={Activity}
                label="Ruhe"
                rating={audio.nervousness.rating}
                feedback={audio.nervousness.feedback}
              />
            )}

            {audio.confidence && (
              <AudioMetricCard
                icon={Award}
                label="Selbstsicherheit"
                rating={audio.confidence.rating}
                feedback={audio.confidence.feedback}
              />
            )}

            {audio.tonalModulation && (
              <AudioMetricCard
                icon={BarChart3}
                label="Tonmodulation"
                rating={audio.tonalModulation.rating}
                feedback={audio.tonalModulation.feedback}
              />
            )}
          </div>

          {/* Audio Strengths */}
          {audio.strengths?.length > 0 && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-xs font-semibold text-green-700 mb-1">Sprech-Stärken:</p>
              <ul className="space-y-1">
                {audio.strengths.map((s, idx) => (
                  <li key={idx} className="text-xs text-green-600 flex items-start gap-1">
                    <span>•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Audio Improvements */}
          {audio.overallImprovement?.length > 0 && (
            <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs font-semibold text-amber-700 mb-1">Sprech-Tipps:</p>
              <ul className="space-y-1">
                {audio.overallImprovement.map((tip, idx) => (
                  <li key={idx} className="text-xs text-amber-600 flex items-start gap-1">
                    <span>•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      )}

      {/* Audio Error State */}
      {audio?.error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="p-4 bg-orange-50 border border-orange-200 rounded-xl"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-orange-800">Audio-Analyse nicht verfügbar</p>
              <p className="text-xs text-orange-600 mt-1">{audio.summary}</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default StructuredFeedbackDisplay;
