import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Lightbulb,
  ChevronDown,
  ChevronRight,
  Clock,
  MessageSquare,
  Mic2,
  BarChart3,
  Loader2,
  Volume2,
  Zap,
  Music2,
  Play,
  AlertTriangle,
  CheckCircle2,
  Gauge,
  Timer,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * AudioAnalysisDisplay Component
 *
 * Displays audio/rhetoric analysis with:
 * - Confidence Gauge (semicircle tachometer)
 * - Interactive filler word list with clickable timestamps
 * - Pacing visualization (slider)
 * - Tonality feedback
 *
 * Props:
 * - audioAnalysis: The parsed audio analysis data
 * - isLoading: Loading state
 * - onJumpToTimestamp: Callback function (timeString: "MM:SS") => void
 */

/**
 * ConfidenceGauge - Semicircle tachometer showing confidence score
 */
const ConfidenceGauge = ({ score, size = 180 }) => {
  const radius = size / 2 - 15;
  const circumference = Math.PI * radius;
  const percentage = Math.max(0, Math.min(100, score));
  const offset = circumference - (percentage / 100) * circumference;

  // Color based on score
  const getColor = (score) => {
    if (score >= 80) return { stroke: '#22c55e', bg: 'from-green-50 to-green-100', text: 'text-green-600', label: 'Sehr selbstsicher' };
    if (score >= 60) return { stroke: '#3b82f6', bg: 'from-blue-50 to-blue-100', text: 'text-blue-600', label: 'Selbstsicher' };
    if (score >= 40) return { stroke: '#f59e0b', bg: 'from-amber-50 to-amber-100', text: 'text-amber-600', label: 'Ausbaufähig' };
    return { stroke: '#ef4444', bg: 'from-red-50 to-red-100', text: 'text-red-600', label: 'Unsicher' };
  };

  const colorScheme = getColor(score);

  return (
    <div className={cn("relative flex flex-col items-center p-4 rounded-2xl bg-gradient-to-br", colorScheme.bg)}>
      <div className="relative" style={{ width: size, height: size / 2 + 20 }}>
        <svg
          width={size}
          height={size / 2 + 20}
          viewBox={`0 0 ${size} ${size / 2 + 20}`}
          className="overflow-visible"
        >
          {/* Background arc */}
          <path
            d={`M 15 ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 15} ${size / 2}`}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* Colored arc */}
          <motion.path
            d={`M 15 ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 15} ${size / 2}`}
            fill="none"
            stroke={colorScheme.stroke}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </svg>
        {/* Center score */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
            className={cn("text-4xl font-bold", colorScheme.text)}
          >
            {score}
          </motion.span>
          <span className="text-xs text-slate-500 font-medium">/ 100</span>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <Gauge className={cn("w-4 h-4", colorScheme.text)} />
        <span className={cn("text-sm font-semibold", colorScheme.text)}>
          {colorScheme.label}
        </span>
      </div>
    </div>
  );
};

/**
 * PacingSlider - Visual slider showing speaking pace
 */
const PacingSlider = ({ rating, wpm, feedback }) => {
  // Map rating to position: zu_langsam=0, optimal=50, zu_schnell=100
  const getPosition = (rating) => {
    switch (rating) {
      case 'zu_langsam': return 15;
      case 'optimal': return 50;
      case 'zu_schnell': return 85;
      default: return 50;
    }
  };

  const position = getPosition(rating);
  const isOptimal = rating === 'optimal';

  return (
    <div className="p-4 bg-white border border-slate-200 rounded-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Timer className="w-4 h-4 text-blue-500" />
          <span className="font-semibold text-slate-800 text-sm">Sprechtempo</span>
        </div>
        {wpm && (
          <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">
            {wpm}
          </span>
        )}
      </div>

      {/* Slider track */}
      <div className="relative h-8 mb-3">
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-2 rounded-full bg-gradient-to-r from-blue-200 via-green-300 to-red-200" />

        {/* Optimal zone indicator */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-4 bg-green-400/30 rounded-full border border-green-400" />

        {/* Labels */}
        <div className="absolute inset-x-0 -bottom-1 flex justify-between px-2">
          <span className="text-[10px] text-slate-400">Langsam</span>
          <span className="text-[10px] text-green-600 font-medium">Optimal</span>
          <span className="text-[10px] text-slate-400">Schnell</span>
        </div>

        {/* Marker */}
        <motion.div
          initial={{ left: '50%' }}
          animate={{ left: `${position}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={cn(
            "absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full shadow-lg border-2 border-white",
            isOptimal ? "bg-green-500" : "bg-amber-500"
          )}
        />
      </div>

      {feedback && (
        <p className="text-xs text-slate-600 mt-4 leading-relaxed">
          {feedback}
        </p>
      )}
    </div>
  );
};

/**
 * TonalityCard - Shows tonality rating with waveform visualization
 */
const TonalityCard = ({ rating, highlights, feedback, onJumpToTimestamp }) => {
  const getRatingInfo = (rating) => {
    switch (rating) {
      case 'monoton':
        return { icon: '📈', color: 'text-amber-600', bg: 'bg-amber-50', label: 'Monoton' };
      case 'lebendig':
        return { icon: '🎭', color: 'text-green-600', bg: 'bg-green-50', label: 'Lebendig' };
      default:
        return { icon: '🎵', color: 'text-blue-600', bg: 'bg-blue-50', label: 'Natürlich' };
    }
  };

  const info = getRatingInfo(rating);

  return (
    <div className="p-4 bg-white border border-slate-200 rounded-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Music2 className="w-4 h-4 text-purple-500" />
          <span className="font-semibold text-slate-800 text-sm">Betonung & Melodie</span>
        </div>
        <span className={cn("text-xs font-medium px-2 py-1 rounded-full", info.bg, info.color)}>
          {info.icon} {info.label}
        </span>
      </div>

      {/* Simple waveform visualization */}
      <div className="flex items-center justify-center gap-0.5 h-12 mb-3">
        {[...Array(30)].map((_, i) => {
          const baseHeight = rating === 'monoton' ? 30 : rating === 'lebendig' ? 20 : 25;
          const variance = rating === 'monoton' ? 5 : rating === 'lebendig' ? 25 : 15;
          const height = baseHeight + Math.sin(i * 0.5) * variance + Math.random() * (variance / 2);
          return (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${Math.max(10, Math.min(100, height))}%` }}
              transition={{ duration: 0.5, delay: i * 0.02 }}
              className={cn("w-1 rounded-full", info.bg.replace('50', '400'))}
            />
          );
        })}
      </div>

      {/* Highlights - clickable timestamps */}
      {highlights && highlights.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {highlights.map((h, idx) => (
            <button
              key={idx}
              onClick={() => onJumpToTimestamp?.(h.timestamp)}
              className={cn(
                "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all",
                "hover:scale-[1.02] active:scale-[0.98]",
                h.type === 'positive'
                  ? "bg-green-50 hover:bg-green-100 border border-green-200"
                  : "bg-red-50 hover:bg-red-100 border border-red-200"
              )}
            >
              <span className={cn(
                "font-mono text-xs px-1.5 py-0.5 rounded",
                h.type === 'positive' ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"
              )}>
                {h.timestamp}
              </span>
              {h.type === 'positive' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
              )}
              <span className="text-xs text-slate-700 flex-1 truncate">
                {h.note}
              </span>
              <Play className="w-3 h-3 text-slate-400" />
            </button>
          ))}
        </div>
      )}

      {feedback && (
        <p className="text-xs text-slate-600 leading-relaxed">
          {feedback}
        </p>
      )}
    </div>
  );
};

/**
 * FillerWordCard - Interactive list of filler words with clickable timestamps
 */
const FillerWordCard = ({ fillerWordAnalysis, score, feedback, onJumpToTimestamp }) => {
  const [expandedWord, setExpandedWord] = useState(null);

  // Calculate total count
  const totalCount = fillerWordAnalysis?.reduce((sum, item) => sum + (item.count || 0), 0) || 0;

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="p-4 bg-white border border-slate-200 rounded-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-orange-500" />
          <span className="font-semibold text-slate-800 text-sm">Füllwörter</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">
            {totalCount}x gesamt
          </span>
          {score !== undefined && (
            <span className={cn("text-sm font-bold", getScoreColor(score))}>
              {score}/100
            </span>
          )}
        </div>
      </div>

      {/* Filler word list */}
      {fillerWordAnalysis && fillerWordAnalysis.length > 0 ? (
        <div className="space-y-2">
          {fillerWordAnalysis.map((item, idx) => (
            <div key={idx} className="border border-slate-100 rounded-lg overflow-hidden">
              {/* Word header - clickable to expand */}
              <button
                onClick={() => setExpandedWord(expandedWord === idx ? null : idx)}
                className="w-full flex items-center justify-between px-3 py-2 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: expandedWord === idx ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </motion.div>
                  <span className="font-medium text-slate-700 text-sm">"{item.word}"</span>
                </div>
                <span className={cn(
                  "text-sm font-bold",
                  item.count > 5 ? "text-red-500" : item.count > 2 ? "text-amber-500" : "text-green-500"
                )}>
                  {item.count}x
                </span>
              </button>

              {/* Expanded: Show timestamps */}
              <AnimatePresence>
                {expandedWord === idx && item.examples && item.examples.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 pb-3 pt-1 bg-slate-50 border-t border-slate-100">
                      <p className="text-xs text-slate-500 mb-2">Klicke zum Anhören:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {item.examples.map((example, exIdx) => (
                          <button
                            key={exIdx}
                            onClick={(e) => {
                              e.stopPropagation();
                              onJumpToTimestamp?.(example.timestamp);
                            }}
                            className="inline-flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-200 rounded-md hover:bg-blue-50 hover:border-blue-300 transition-all group"
                          >
                            <span className="font-mono text-xs text-blue-600 group-hover:text-blue-700">
                              {example.timestamp}
                            </span>
                            {example.context && (
                              <span className="text-[10px] text-slate-400 group-hover:text-slate-500">
                                ({example.context})
                              </span>
                            )}
                            <Play className="w-3 h-3 text-blue-400 group-hover:text-blue-600" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-2 text-green-600 py-2">
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-sm">Keine Füllwörter erkannt!</span>
        </div>
      )}

      {/* Tip */}
      {feedback && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-800 leading-relaxed">{feedback}</p>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * PacingIssuesCard - Shows pacing issues with clickable timestamps
 */
const PacingIssuesCard = ({ issues, onJumpToTimestamp }) => {
  if (!issues || issues.length === 0) return null;

  return (
    <div className="mt-3 space-y-1.5">
      <p className="text-xs text-slate-500 font-medium">Auffällige Stellen:</p>
      {issues.map((issue, idx) => (
        <button
          key={idx}
          onClick={() => onJumpToTimestamp?.(issue.timestamp)}
          className="w-full flex items-center gap-2 px-2 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-amber-200 text-amber-800">
            {issue.timestamp}
          </span>
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
          <span className="text-xs text-slate-700 flex-1 truncate">
            {issue.issue}
          </span>
          <Play className="w-3 h-3 text-slate-400" />
        </button>
      ))}
    </div>
  );
};

/**
 * Main AudioAnalysisDisplay Component
 */
function AudioAnalysisDisplay({ audioAnalysis, isLoading = false, onJumpToTimestamp }) {
  console.log('🎵 [AUDIO_DISPLAY] Received audioAnalysis:', audioAnalysis ? 'exists' : 'null', typeof audioAnalysis);

  // Parse JSON if needed
  const data = useMemo(() => {
    if (!audioAnalysis) {
      console.log('🎵 [AUDIO_DISPLAY] No audioAnalysis provided');
      return null;
    }
    if (typeof audioAnalysis === 'string') {
      try {
        let jsonString = audioAnalysis.trim();
        if (jsonString.startsWith('```json')) {
          jsonString = jsonString.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
        } else if (jsonString.startsWith('```')) {
          jsonString = jsonString.replace(/```\s*/g, '').replace(/```\s*$/g, '');
        }
        const parsed = JSON.parse(jsonString);
        console.log('🎵 [AUDIO_DISPLAY] Parsed audio analysis:', parsed);
        return parsed;
      } catch (e) {
        console.error('🎵 [AUDIO_DISPLAY] Failed to parse audio analysis:', e);
        return null;
      }
    }
    console.log('🎵 [AUDIO_DISPLAY] Audio analysis object:', audioAnalysis);
    return audioAnalysis;
  }, [audioAnalysis]);

  // Check format type
  const audioMetrics = data?.audio_metrics;
  const isNewFormat = audioMetrics?.confidence_score !== undefined || audioMetrics?.speech_cleanliness !== undefined;

  console.log('🎵 [AUDIO_DISPLAY] Data:', data, 'isNewFormat:', isNewFormat);

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
        <p className="mt-3 text-slate-600 text-sm">Audio wird analysiert...</p>
      </div>
    );
  }

  // No data state
  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Mic2 className="w-12 h-12 text-slate-200 mb-3" />
        <p className="text-slate-500 text-sm">Keine Audio-Analyse verfügbar.</p>
        <p className="text-slate-400 text-xs mt-1 text-center">
          Die Stimmanalyse erscheint hier nach der Aufnahme.
        </p>
      </div>
    );
  }

  // Error state
  if (data.error) {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <p className="text-sm font-medium text-amber-800">Audio-Analyse nicht verfügbar</p>
        <p className="text-xs text-amber-600 mt-1">{data.summary || data.errorMessage}</p>
      </div>
    );
  }

  // NEW FORMAT: Pure audio/rhetoric analysis with timestamps
  if (isNewFormat && audioMetrics) {
    return (
      <div className="space-y-4">
        {/* Confidence Gauge - Top Hero */}
        {audioMetrics.confidence_score !== undefined && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h4 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Selbstsicherheit
            </h4>
            <ConfidenceGauge score={audioMetrics.confidence_score} size={160} />
          </motion.div>
        )}

        {/* Summary */}
        {audioMetrics.summary_text && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="p-3 bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-200 rounded-xl"
          >
            <p className="text-sm text-slate-700 leading-relaxed">
              {audioMetrics.summary_text}
            </p>
          </motion.div>
        )}

        {/* Speech Cleanliness / Filler Words */}
        {audioMetrics.speech_cleanliness && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <FillerWordCard
              fillerWordAnalysis={audioMetrics.speech_cleanliness.filler_word_analysis}
              score={audioMetrics.speech_cleanliness.score}
              feedback={audioMetrics.speech_cleanliness.feedback}
              onJumpToTimestamp={onJumpToTimestamp}
            />
          </motion.div>
        )}

        {/* Pacing */}
        {audioMetrics.pacing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <PacingSlider
              rating={audioMetrics.pacing.rating}
              wpm={audioMetrics.pacing.perceived_wpm}
              feedback={audioMetrics.pacing.feedback}
            />
            <PacingIssuesCard
              issues={audioMetrics.pacing.issues_detected}
              onJumpToTimestamp={onJumpToTimestamp}
            />
          </motion.div>
        )}

        {/* Tonality */}
        {audioMetrics.tonality && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            <TonalityCard
              rating={audioMetrics.tonality.rating}
              highlights={audioMetrics.tonality.highlights}
              feedback={audioMetrics.tonality.feedback}
              onJumpToTimestamp={onJumpToTimestamp}
            />
          </motion.div>
        )}
      </div>
    );
  }

  // LEGACY FORMAT: Handle old audio analysis structure
  // This maintains backwards compatibility with existing data
  const legacyMetrics = data.audio_metrics || data;

  return (
    <div className="space-y-4">
      {/* Legacy: Overall Analysis */}
      {data.overall_analysis && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-gradient-to-br from-blue-50 to-slate-50 border border-blue-200 rounded-xl"
        >
          <h4 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-blue-500" />
            Gesamtbewertung
          </h4>
          <p className="text-sm text-slate-700 leading-relaxed">
            {typeof data.overall_analysis === 'string'
              ? data.overall_analysis
              : data.overall_analysis?.summary_text || data.overall_analysis?.summary || 'Audio-Analyse verfügbar'}
          </p>
          {data.overall_analysis?.total_score !== undefined && (
            <div className="mt-2">
              <ConfidenceGauge score={data.overall_analysis.total_score} size={140} />
            </div>
          )}
        </motion.div>
      )}

      {/* Legacy: Speech cleanliness score */}
      {legacyMetrics.speech_cleanliness_score !== undefined && (
        <div className="p-4 bg-white border border-slate-200 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Mic2 className="w-4 h-4 text-blue-500" />
              <span className="font-semibold text-slate-800 text-sm">Redefluss</span>
            </div>
            <span className={cn(
              "text-sm font-bold",
              legacyMetrics.speech_cleanliness_score >= 70 ? "text-green-600" :
              legacyMetrics.speech_cleanliness_score >= 40 ? "text-amber-600" : "text-red-600"
            )}>
              {legacyMetrics.speech_cleanliness_score}/100
            </span>
          </div>
        </div>
      )}

      {/* Legacy: Filler words */}
      {legacyMetrics.filler_words_detected && legacyMetrics.filler_words_detected.length > 0 && (
        <div className="p-4 bg-white border border-slate-200 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-4 h-4 text-orange-500" />
            <span className="font-semibold text-slate-800 text-sm">Füllwörter erkannt</span>
          </div>
          <div className="space-y-2">
            {legacyMetrics.filler_words_detected.map((fw, idx) => (
              <div key={idx} className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-700">"{fw.word}"</span>
                <span className={cn(
                  "text-sm font-bold",
                  fw.count > 5 ? "text-red-500" : fw.count > 2 ? "text-amber-500" : "text-green-500"
                )}>
                  {fw.count}x
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legacy: Pacing */}
      {legacyMetrics.pacing && (
        <PacingSlider
          rating={legacyMetrics.pacing.rating}
          feedback={legacyMetrics.pacing.feedback}
        />
      )}

      {/* Legacy: Tonality */}
      {legacyMetrics.tonality && (
        <div className="p-4 bg-white border border-slate-200 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Music2 className="w-4 h-4 text-purple-500" />
              <span className="font-semibold text-slate-800 text-sm">Tonalität</span>
            </div>
            <span className={cn(
              "text-xs font-medium px-2 py-1 rounded-full",
              legacyMetrics.tonality.rating === 'monoton' ? "bg-amber-50 text-amber-600" :
              legacyMetrics.tonality.rating === 'lebendig' ? "bg-green-50 text-green-600" :
              "bg-blue-50 text-blue-600"
            )}>
              {legacyMetrics.tonality.rating}
            </span>
          </div>
          {legacyMetrics.tonality.feedback && (
            <p className="text-xs text-slate-600 leading-relaxed">
              {legacyMetrics.tonality.feedback}
            </p>
          )}
        </div>
      )}

      {/* Empty state */}
      {!data.overall_analysis && !legacyMetrics.speech_cleanliness_score &&
       !legacyMetrics.filler_words_detected && !legacyMetrics.pacing && !legacyMetrics.tonality && (
        <div className="text-center py-8">
          <BarChart3 className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Keine detaillierten Metriken verfügbar.</p>
        </div>
      )}
    </div>
  );
}

export default AudioAnalysisDisplay;
