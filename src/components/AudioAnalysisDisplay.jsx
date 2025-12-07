import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Lightbulb,
  ChevronDown,
  ChevronRight,
  Clock,
  MessageSquare,
  Repeat,
  Scissors,
  Quote,
  HelpCircle,
  Mic2,
  BarChart3,
  Loader2,
  ExternalLink,
  Volume2,
  Zap,
  Music2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * AudioAnalysisDisplay Component
 *
 * Displays audio analysis (audio_analysis_json) for the Analysen tab.
 * Supports both old format and new KarriereHeld format with:
 * - overall_analysis
 * - audio_metrics (speech_cleanliness_score, filler_words, pacing, tonality)
 * - categories
 */

/**
 * Metric Card Component - Expandable card for metrics
 */
const MetricCard = ({
  icon: Icon,
  label,
  value,
  valueLabel,
  score,
  feedback,
  tip,
  tipLink,
  examples,
  isPositive = true,
  index
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasDetails = feedback || tip || examples?.length > 0;

  // Determine color based on score
  const getScoreColor = (score) => {
    if (score >= 7) return 'text-green-600';
    if (score >= 5) return 'text-amber-600';
    return 'text-red-500';
  };

  return (
    <motion.div
      className="border rounded-xl overflow-hidden bg-white border-slate-200"
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
          {hasDetails ? (
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </motion.div>
          ) : (
            <div className="w-4" />
          )}
          <Icon className={cn("w-4 h-4", isPositive ? "text-blue-500" : "text-amber-500")} />
          <span className="font-medium text-slate-800 text-sm">
            {label}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {score !== undefined && (
            <span className={cn("text-sm font-bold", getScoreColor(score))}>
              {score}/10
            </span>
          )}
          {value && (
            <span className={cn(
              "text-sm font-semibold",
              isPositive ? "text-blue-600" : "text-amber-600"
            )}>
              {value}
              {valueLabel && <span className="text-slate-400 font-normal ml-1">{valueLabel}</span>}
            </span>
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
            <div className="px-4 pb-4 pt-1 space-y-3 border-t border-slate-100 ml-7">
              {/* Tip Box */}
              {tip && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-800 leading-relaxed">
                    {tip}
                  </p>
                  {tipLink && (
                    <a
                      href={tipLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Mehr erfahren
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}

              {/* Feedback */}
              {feedback && (
                <p className="text-sm text-slate-600 leading-relaxed">
                  {feedback}
                </p>
              )}

              {/* Examples */}
              {examples?.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 font-medium">Beispiele:</p>
                  {examples.map((example, idx) => (
                    <p key={idx} className="text-sm text-slate-500 italic pl-2 border-l-2 border-slate-200">
                      "{example}"
                    </p>
                  ))}
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
 * Category Card for displaying category-based metrics (STAR, Aktives Zuhören, etc.)
 */
const CategoryCard = ({ category, index }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasInsights = category.insights?.length > 0;

  return (
    <motion.div
      className="border rounded-xl overflow-hidden bg-white border-slate-200"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <button
        onClick={() => hasInsights && setIsExpanded(!isExpanded)}
        disabled={!hasInsights}
        className={cn(
          "w-full px-4 py-3 flex items-start gap-3 transition-colors text-left",
          hasInsights ? "hover:bg-slate-50 cursor-pointer" : "cursor-default"
        )}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="font-semibold text-slate-800 text-sm flex items-center gap-2">
              {hasInsights && (
                <motion.div
                  animate={{ rotate: isExpanded ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </motion.div>
              )}
              {category.name}
            </span>
            <span className={cn(
              "text-sm font-bold",
              category.score >= 4 ? "text-green-600" : category.score >= 2 ? "text-amber-600" : "text-red-500"
            )}>
              {category.score}/5
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {category.feedback}
          </p>
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && hasInsights && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 space-y-2 border-t border-slate-100">
              <p className="text-xs text-slate-500 font-medium">Erkenntnisse:</p>
              {category.insights.map((insight, idx) => (
                <p key={idx} className="text-sm text-slate-600 pl-3 border-l-2 border-blue-200">
                  {insight}
                </p>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/**
 * Main AudioAnalysisDisplay Component
 */
function AudioAnalysisDisplay({ audioAnalysis, isLoading = false }) {
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

  // Check if this is the new KarriereHeld format
  const isNewFormat = data?.audio_metrics !== undefined || data?.overall_analysis !== undefined;
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
        <p className="mt-3 text-slate-600 text-sm">Analyse wird geladen...</p>
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
          Die Sprachanalyse erscheint hier, sobald sie durchgeführt wurde.
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
        {data.troubleshooting && (
          <ul className="mt-2 space-y-1">
            {data.troubleshooting.map((tip, idx) => (
              <li key={idx} className="text-xs text-amber-600 flex items-start gap-1">
                <span>•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  // NEW FORMAT: KarriereHeld audio analysis
  if (isNewFormat) {
    const audioMetrics = data.audio_metrics || {};

    return (
      <div className="space-y-5">
        {/* Overall Analysis Summary */}
        {data.overall_analysis && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-gradient-to-br from-blue-50 to-slate-50 border border-blue-200 rounded-xl"
          >
            <h4 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-blue-500" />
              Gesamtbewertung Audio
            </h4>
            <p className="text-sm text-slate-700 leading-relaxed">
              {/* Handle both string and object formats for overall_analysis */}
              {typeof data.overall_analysis === 'string'
                ? data.overall_analysis
                : data.overall_analysis?.summary_text || data.overall_analysis?.summary ||
                  (typeof data.overall_analysis === 'object'
                    ? 'Audio-Analyse verfügbar'
                    : String(data.overall_analysis))}
            </p>
          </motion.div>
        )}

        {/* Audio Metrics Section */}
        {(audioMetrics.speech_cleanliness_score !== undefined ||
          audioMetrics.filler_words ||
          audioMetrics.pacing ||
          audioMetrics.tonality) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-500" />
              Stimmanalyse
            </h4>
            <div className="space-y-2">
              {/* Speech Cleanliness Score */}
              {audioMetrics.speech_cleanliness_score !== undefined && (
                <MetricCard
                  icon={Mic2}
                  label="Redefluss"
                  score={audioMetrics.speech_cleanliness_score}
                  feedback={`Bewertung der Klarheit und Flüssigkeit deiner Sprache.`}
                  isPositive={audioMetrics.speech_cleanliness_score >= 6}
                  index={0}
                />
              )}

              {/* Filler Words */}
              {audioMetrics.filler_words && (
                <MetricCard
                  icon={MessageSquare}
                  label="Füllwörter"
                  value={`${audioMetrics.filler_words.count || 0} gefunden`}
                  score={audioMetrics.filler_words.rating}
                  feedback={audioMetrics.filler_words.list?.length > 0
                    ? `Erkannte Füllwörter: ${audioMetrics.filler_words.list.join(', ')}`
                    : 'Keine Füllwörter erkannt.'}
                  tip={audioMetrics.filler_words.count > 3
                    ? 'Versuche Füllwörter wie "ähm", "äh", "also" zu reduzieren.'
                    : null}
                  isPositive={audioMetrics.filler_words.rating >= 6}
                  index={1}
                />
              )}

              {/* Pacing */}
              {audioMetrics.pacing && (
                <MetricCard
                  icon={Clock}
                  label="Sprechtempo"
                  value={audioMetrics.pacing.words_per_minute
                    ? `${audioMetrics.pacing.words_per_minute} WpM`
                    : audioMetrics.pacing.assessment}
                  score={audioMetrics.pacing.rating}
                  feedback={audioMetrics.pacing.assessment}
                  tip={audioMetrics.pacing.rating < 6
                    ? 'Ein optimales Sprechtempo liegt bei 120-150 Wörtern pro Minute.'
                    : null}
                  isPositive={audioMetrics.pacing.rating >= 6}
                  index={2}
                />
              )}

              {/* Tonality */}
              {audioMetrics.tonality && (
                <MetricCard
                  icon={Music2}
                  label="Betonung & Tonalität"
                  value={audioMetrics.tonality.variety_score !== undefined
                    ? `Varianz: ${audioMetrics.tonality.variety_score}/10`
                    : null}
                  score={audioMetrics.tonality.rating}
                  feedback={audioMetrics.tonality.assessment}
                  tip={audioMetrics.tonality.rating < 6
                    ? 'Variiere deine Stimmlage und Betonung für mehr Ausdruckskraft.'
                    : null}
                  isPositive={audioMetrics.tonality.rating >= 6}
                  index={3}
                />
              )}
            </div>
          </motion.div>
        )}

        {/* Categories Section (STAR, Aktives Zuhören, etc.) */}
        {data.categories?.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              Bewertungskriterien
            </h4>
            <div className="space-y-2">
              {data.categories.map((category, idx) => (
                <CategoryCard key={idx} category={category} index={idx} />
              ))}
            </div>
          </motion.div>
        )}
      </div>
    );
  }

  // OLD FORMAT: Legacy audio analysis fields
  const positiveMetrics = [];
  const improvementMetrics = [];

  // Speaking time
  if (data.speakingTime) {
    positiveMetrics.push({
      icon: Clock,
      label: 'Sprechzeit',
      value: data.speakingTime.value || data.speakingTime.duration,
      feedback: data.speakingTime.feedback,
    });
  }

  // Monologues
  if (data.monologues !== undefined) {
    const count = typeof data.monologues === 'object' ? data.monologues.count : data.monologues;
    if (count <= 2) {
      positiveMetrics.push({
        icon: MessageSquare,
        label: 'Monologe',
        value: count,
        feedback: data.monologues?.feedback,
      });
    } else {
      improvementMetrics.push({
        icon: MessageSquare,
        label: 'Monologe',
        value: count,
        feedback: data.monologues?.feedback,
        tip: 'Versuche kürzere Antworten zu geben und mehr Dialog zu führen.',
      });
    }
  }

  // Repetitions
  if (data.repetition || data.wiederholung) {
    const rep = data.repetition || data.wiederholung;
    const count = typeof rep === 'object' ? rep.count : rep;
    const percentage = typeof rep === 'object' ? rep.percentage : null;
    positiveMetrics.push({
      icon: Repeat,
      label: 'Wiederholung',
      value: `${count} Wiederholung(en)`,
      valueLabel: percentage ? `, ${percentage}` : null,
      feedback: rep?.feedback,
    });
  }

  // Conciseness
  if (data.conciseness || data.praegnanz) {
    const con = data.conciseness || data.praegnanz;
    const value = typeof con === 'object' ? con.value || con.percentage : con;
    positiveMetrics.push({
      icon: Scissors,
      label: 'Prägnanz',
      value: value,
      feedback: con?.feedback,
    });
  }

  // Sentence starters
  if (data.sentenceStarters || data.satzanfaenge) {
    const ss = data.sentenceStarters || data.satzanfaenge;
    const mostUsed = typeof ss === 'object' ? ss.mostUsed || ss.example : null;
    const percentage = typeof ss === 'object' ? ss.percentage : ss;
    improvementMetrics.push({
      icon: Quote,
      label: 'Satzanfänge',
      value: mostUsed ? `"${mostUsed}"` : '',
      valueLabel: percentage ? `${percentage}` : null,
      feedback: ss?.feedback,
      tip: 'Variiere deine Satzanfänge für mehr Dynamik.',
      examples: ss?.examples,
    });
  }

  // Questions
  if (data.questions || data.fragen) {
    const q = data.questions || data.fragen;
    const count = typeof q === 'object' ? q.count : q;
    improvementMetrics.push({
      icon: HelpCircle,
      label: 'Fragen',
      value: count,
      feedback: q?.feedback,
      tip: 'Überlege, mindestens 5 Fragen zu stellen, um andere zu involvieren.',
      tipLink: q?.learnMoreLink,
      examples: q?.examples,
    });
  }

  // Filler words (old format)
  if (data.fillerWords || data.fuellwoerter) {
    const fw = data.fillerWords || data.fuellwoerter;
    const count = typeof fw === 'object' ? fw.count : fw;
    const rating = typeof fw === 'object' ? fw.rating : null;
    if (count > 5 || (rating && rating < 6)) {
      improvementMetrics.push({
        icon: MessageSquare,
        label: 'Füllwörter',
        value: `${count} gefunden`,
        feedback: fw?.feedback,
        tip: 'Versuche Füllwörter wie "ähm", "äh", "also" zu reduzieren.',
        examples: fw?.examples,
      });
    } else {
      positiveMetrics.push({
        icon: MessageSquare,
        label: 'Füllwörter',
        value: `${count} gefunden`,
        feedback: fw?.feedback,
      });
    }
  }

  // Pace (old format)
  if (data.pace || data.tempo) {
    const p = data.pace || data.tempo;
    const wpm = typeof p === 'object' ? p.wordsPerMinute : p;
    const rating = typeof p === 'object' ? p.rating : null;
    if (rating && rating >= 6) {
      positiveMetrics.push({
        icon: Clock,
        label: 'Sprechtempo',
        value: wpm ? `${wpm} WpM` : 'Gut',
        feedback: p?.feedback,
      });
    } else {
      improvementMetrics.push({
        icon: Clock,
        label: 'Sprechtempo',
        value: wpm ? `${wpm} WpM` : 'Anpassen',
        feedback: p?.feedback,
        tip: 'Ein optimales Sprechtempo liegt bei 120-150 Wörtern pro Minute.',
      });
    }
  }

  // Clarity
  if (data.clarity) {
    if (data.clarity.rating >= 7) {
      positiveMetrics.push({
        icon: Mic2,
        label: 'Deutlichkeit',
        value: `${data.clarity.rating}/10`,
        feedback: data.clarity.feedback,
      });
    } else {
      improvementMetrics.push({
        icon: Mic2,
        label: 'Deutlichkeit',
        value: `${data.clarity.rating}/10`,
        feedback: data.clarity.feedback,
        tip: 'Achte auf eine klare Aussprache und deutliche Artikulation.',
      });
    }
  }

  // Confidence
  if (data.confidence) {
    if (data.confidence.rating >= 7) {
      positiveMetrics.push({
        icon: Trophy,
        label: 'Selbstsicherheit',
        value: `${data.confidence.rating}/10`,
        feedback: data.confidence.feedback,
      });
    } else {
      improvementMetrics.push({
        icon: Trophy,
        label: 'Selbstsicherheit',
        value: `${data.confidence.rating}/10`,
        feedback: data.confidence.feedback,
        tip: 'Sprich mit fester Stimme und halte Blickkontakt.',
      });
    }
  }

  // If we have old-style strengths/improvements, add them
  if (data.strengths?.length > 0 && positiveMetrics.length === 0) {
    data.strengths.forEach((s, idx) => {
      positiveMetrics.push({
        icon: Trophy,
        label: `Stärke ${idx + 1}`,
        value: '',
        feedback: s,
      });
    });
  }

  if (data.overallImprovement?.length > 0 && improvementMetrics.length === 0) {
    data.overallImprovement.forEach((s, idx) => {
      improvementMetrics.push({
        icon: Lightbulb,
        label: `Verbesserung ${idx + 1}`,
        value: '',
        feedback: s,
      });
    });
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      {data.summary && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-slate-50 border border-slate-200 rounded-xl"
        >
          <p className="text-sm text-slate-700 leading-relaxed">
            {data.summary}
          </p>
        </motion.div>
      )}

      {/* Positive Metrics - "Was gut gelaufen ist" */}
      {positiveMetrics.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            Was gut gelaufen ist
          </h4>
          <div className="space-y-2">
            {positiveMetrics.map((metric, idx) => (
              <MetricCard
                key={idx}
                {...metric}
                isPositive={true}
                index={idx}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Improvement Metrics - "Was hätte besser laufen können" */}
      {improvementMetrics.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            Was hätte besser laufen können
          </h4>
          <div className="space-y-2">
            {improvementMetrics.map((metric, idx) => (
              <MetricCard
                key={idx}
                {...metric}
                isPositive={false}
                index={idx}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Empty state if no metrics */}
      {positiveMetrics.length === 0 && improvementMetrics.length === 0 && !data.summary && (
        <div className="text-center py-8">
          <BarChart3 className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Keine detaillierten Metriken verfügbar.</p>
        </div>
      )}
    </div>
  );
}

export default AudioAnalysisDisplay;
