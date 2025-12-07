/**
 * AudioAnalysisDisplay Component
 *
 * Main component for displaying audio/rhetoric analysis.
 * Composes sub-components for confidence gauge, filler words, pacing, and tonality.
 *
 * Props:
 * - audioAnalysis: The audio analysis data (string or object)
 * - isLoading: Loading state
 * - onJumpToTimestamp: Callback function (timeString: "MM:SS") => void
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Mic2, BarChart3, Loader2, Volume2, Sparkles } from 'lucide-react';

import { safeParseJSON, isNewAudioAnalysisFormat } from '@/utils/parseJSON';
import {
  ConfidenceGauge,
  PacingSlider,
  TonalityCard,
  FillerWordCard,
  PacingIssuesCard,
} from './audio-analysis';

// =============================================================================
// LOADING & EMPTY STATES
// =============================================================================

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      >
        <Loader2 className="w-10 h-10 text-blue-600" />
      </motion.div>
      <p className="mt-3 text-slate-600 text-sm">Audio wird analysiert...</p>
    </div>
  );
}

function EmptyState() {
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

function ErrorState({ message }) {
  return (
    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
      <p className="text-sm font-medium text-amber-800">Audio-Analyse nicht verfügbar</p>
      <p className="text-xs text-amber-600 mt-1">{message}</p>
    </div>
  );
}

// =============================================================================
// NEW FORMAT DISPLAY
// =============================================================================

function NewFormatDisplay({ audioMetrics, onJumpToTimestamp }) {
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

// =============================================================================
// LEGACY FORMAT DISPLAY
// =============================================================================

function LegacyFormatDisplay({ data, onJumpToTimestamp }) {
  const audioMetrics = data.audio_metrics || data;

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
              : data.overall_analysis?.summary_text ||
                data.overall_analysis?.summary ||
                'Audio-Analyse verfügbar'}
          </p>
          {data.overall_analysis?.total_score !== undefined && (
            <div className="mt-2">
              <ConfidenceGauge score={data.overall_analysis.total_score} size={140} />
            </div>
          )}
        </motion.div>
      )}

      {/* Legacy: Pacing */}
      {audioMetrics.pacing && (
        <PacingSlider
          rating={audioMetrics.pacing.rating}
          feedback={audioMetrics.pacing.feedback}
        />
      )}

      {/* Legacy: Tonality */}
      {audioMetrics.tonality && (
        <TonalityCard
          rating={audioMetrics.tonality.rating}
          feedback={audioMetrics.tonality.feedback}
          onJumpToTimestamp={onJumpToTimestamp}
        />
      )}

      {/* Empty state */}
      {!data.overall_analysis && !audioMetrics.pacing && !audioMetrics.tonality && (
        <div className="text-center py-8">
          <BarChart3 className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Keine detaillierten Metriken verfügbar.</p>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

function AudioAnalysisDisplay({ audioAnalysis, isLoading = false, onJumpToTimestamp }) {
  // Parse JSON if needed
  const data = useMemo(() => {
    return safeParseJSON(audioAnalysis, { context: 'audio_analysis' });
  }, [audioAnalysis]);

  // Check format type
  const isNewFormat = isNewAudioAnalysisFormat(data);

  // Loading state
  if (isLoading) {
    return <LoadingState />;
  }

  // No data state
  if (!data) {
    return <EmptyState />;
  }

  // Error state
  if (data.error) {
    return <ErrorState message={data.summary || data.errorMessage || 'Unbekannter Fehler'} />;
  }

  // New format with audio_metrics
  if (isNewFormat && data.audio_metrics) {
    return (
      <NewFormatDisplay
        audioMetrics={data.audio_metrics}
        onJumpToTimestamp={onJumpToTimestamp}
      />
    );
  }

  // Legacy format
  return (
    <LegacyFormatDisplay data={data} onJumpToTimestamp={onJumpToTimestamp} />
  );
}

export default AudioAnalysisDisplay;
