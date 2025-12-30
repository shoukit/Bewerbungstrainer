/**
 * AudioAnalysisPanel - Reusable audio analysis display component
 *
 * Displays paraverbal speech analysis:
 * - Confidence gauge (Selbstsicherheit)
 * - Filler words (Füllwörter)
 * - Pacing/tempo (Sprechtempo)
 * - Tonality (Betonung & Melodie)
 *
 * Usage:
 *   import AudioAnalysisPanel from '@/components/feedback/AudioAnalysisPanel';
 *
 *   <AudioAnalysisPanel
 *     audioAnalysis={{
 *       confidence_score: 75,
 *       speech_cleanliness: { ... },
 *       pacing: { ... },
 *       tonality: { ... }
 *     }}
 *     primaryAccent="#3A7FA7"
 *     onJumpToTimestamp={(seconds) => audioPlayer.seekTo(seconds)}
 *   />
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  Gauge,
  MessageSquare,
  Timer,
  Music2,
  CheckCircle2,
  AlertTriangle,
  Play,
} from 'lucide-react';

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get color scheme based on confidence score
 */
const getConfidenceColorScheme = (score) => {
  if (score >= 80) return { color: '#22c55e', bg: '#f0fdf4', label: 'Sehr selbstsicher' };
  if (score >= 60) return { color: '#3b82f6', bg: '#eff6ff', label: 'Selbstsicher' };
  if (score >= 40) return { color: '#f59e0b', bg: '#fffbeb', label: 'Ausbaufähig' };
  return { color: '#ef4444', bg: '#fef2f2', label: 'Unsicher' };
};

/**
 * Get pacing slider position based on rating
 */
const getPacingPosition = (rating) => {
  switch (rating) {
    case 'zu_langsam': return 15;
    case 'optimal': return 50;
    case 'zu_schnell': return 85;
    default: return 50;
  }
};

/**
 * Get tonality label from rating
 */
const getTonalityLabel = (rating) => {
  if (rating === 'lebendig') return 'Lebendig';
  if (rating === 'natürlich') return 'Natürlich';
  return 'Monoton';
};

/**
 * Get tonality waveform variance
 */
const getTonalityVariance = (rating) => {
  if (rating === 'lebendig') return { base: 20, variance: 30 };
  if (rating === 'natürlich') return { base: 25, variance: 20 };
  return { base: 35, variance: 8 };
};

/**
 * Parse timestamp string "MM:SS" to seconds
 */
const parseTimestamp = (timestamp) => {
  if (typeof timestamp === 'number') return timestamp;
  if (!timestamp || typeof timestamp !== 'string') return 0;

  const parts = timestamp.split(':');
  if (parts.length === 2) {
    const minutes = parseInt(parts[0], 10) || 0;
    const seconds = parseInt(parts[1], 10) || 0;
    return minutes * 60 + seconds;
  }
  if (parts.length === 3) {
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    const seconds = parseInt(parts[2], 10) || 0;
    return hours * 3600 + minutes * 60 + seconds;
  }
  return parseFloat(timestamp) || 0;
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * AudioAnalysisPanel Component
 *
 * @param {object} audioAnalysis - Audio analysis data with metrics
 * @param {string} primaryAccent - Primary accent color for theming
 * @param {function} onJumpToTimestamp - Callback when clicking timestamp (receives seconds)
 */
const AudioAnalysisPanel = ({
  audioAnalysis,
  primaryAccent,
  onJumpToTimestamp,
}) => {
  // Extract audio_metrics from the data (new format has it nested)
  const metrics = audioAnalysis?.audio_metrics || audioAnalysis;

  // Check if we have any valid data
  const hasData = metrics && (
    metrics.confidence_score !== undefined ||
    metrics.speech_cleanliness ||
    metrics.pacing ||
    metrics.tonality
  );

  if (!audioAnalysis || !hasData) {
    return (
      <div className="bg-white rounded-xl p-10 border border-slate-200 text-center">
        <Gauge size={32} className="text-slate-400 mb-3 mx-auto" />
        <p className="text-slate-400 text-sm">Keine Audio-Analyse verfügbar</p>
      </div>
    );
  }

  // Extract data from the correct structure
  const confidenceScore = metrics.confidence_score;
  const speechCleanliness = metrics.speech_cleanliness;
  const pacing = metrics.pacing;
  const tonality = metrics.tonality;

  // Extract filler words from speech_cleanliness
  const fillerCount = speechCleanliness?.total_filler_count || 0;
  const fillerWordAnalysis = speechCleanliness?.filler_word_analysis || [];
  const fillerFeedback = speechCleanliness?.feedback;

  return (
    <div className="flex flex-col gap-4">
      {/* Confidence Gauge */}
      {confidenceScore !== undefined && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200">
          <div className="flex items-center gap-2 mb-4">
            <Gauge size={18} className="text-primary" />
            <span className="text-sm font-semibold text-slate-800">
              Selbstsicherheit
            </span>
          </div>

          {/* Semicircle Gauge */}
          <div className="flex justify-center mb-4">
            {(() => {
              const score = confidenceScore;
              const colorScheme = getConfidenceColorScheme(score);
              const size = 140;
              const radius = size / 2 - 12;
              const circumference = Math.PI * radius;
              const offset = circumference - (score / 100) * circumference;

              return (
                <div className="rounded-2xl px-8 py-5 flex flex-col items-center" style={{ backgroundColor: colorScheme.bg }}>
                  <div className="relative" style={{ width: size, height: size / 2 + 20 }}>
                    <svg width={size} height={size / 2 + 20} className="overflow-visible">
                      <path
                        d={`M 12 ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 12} ${size / 2}`}
                        fill="none"
                        stroke="#e2e8f0"
                        strokeWidth="10"
                        strokeLinecap="round"
                      />
                      <motion.path
                        d={`M 12 ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 12} ${size / 2}`}
                        fill="none"
                        stroke={colorScheme.color}
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: offset }}
                        transition={{ duration: 1.2, ease: 'easeOut' }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
                      <motion.span
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-[32px] font-bold"
                        style={{ color: colorScheme.color }}
                      >
                        {Math.round(score)}
                      </motion.span>
                      <span className="text-[11px] text-slate-400">/ 100</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2">
                    <Gauge size={14} style={{ color: colorScheme.color }} />
                    <span className="text-[13px] font-semibold" style={{ color: colorScheme.color }}>
                      {colorScheme.label}
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>

          {metrics.summary_text && (
            <p className="text-[13px] leading-normal text-slate-600 text-center">
              {metrics.summary_text}
            </p>
          )}
        </div>
      )}

      {/* Filler Words */}
      {speechCleanliness && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MessageSquare size={18} className="text-orange-500" />
              <span className="text-sm font-semibold text-slate-800">
                Füllwörter
              </span>
            </div>
            <span className={`text-[13px] font-semibold px-2.5 py-1 rounded-full ${
              fillerCount <= 2 ? 'bg-green-200 text-green-800' :
              fillerCount <= 5 ? 'bg-amber-200 text-amber-800' :
              'bg-red-200 text-red-800'
            }`}>
              {fillerCount}x gesamt
            </span>
          </div>

          {fillerWordAnalysis.length > 0 ? (
            <div className="flex flex-col gap-2 mb-3">
              {fillerWordAnalysis.map((item, idx) => (
                <div key={idx} className="rounded-lg bg-amber-100 overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-[13px] text-amber-800 font-medium">
                      "{item.word}"
                    </span>
                    <span className="text-xs text-amber-800 font-semibold">
                      {item.count}x
                    </span>
                  </div>
                  {item.examples?.length > 0 && onJumpToTimestamp && (
                    <div className="flex flex-wrap gap-1.5 px-3 py-2 bg-amber-50 border-t border-amber-200">
                      {item.examples.map((example, exIdx) => (
                        <button
                          key={exIdx}
                          onClick={() => onJumpToTimestamp(parseTimestamp(example.timestamp))}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md border-none bg-amber-100 cursor-pointer text-[11px] text-amber-800 transition-all hover:bg-amber-200"
                        >
                          <span className="font-mono font-semibold">{example.timestamp}</span>
                          <Play size={10} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-green-500">
              <CheckCircle2 size={16} />
              <span className="text-[13px]">Keine Füllwörter erkannt!</span>
            </div>
          )}

          {fillerFeedback && (
            <p className="text-[13px] leading-normal text-slate-600 mt-3">
              {fillerFeedback}
            </p>
          )}
        </div>
      )}

      {/* Pacing */}
      {pacing && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Timer size={18} className="text-blue-500" />
              <span className="text-sm font-semibold text-slate-800">
                Sprechtempo
              </span>
            </div>
            {pacing.estimated_wpm && (
              <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-slate-100 text-slate-600">
                ~{pacing.estimated_wpm} WPM
              </span>
            )}
          </div>

          {/* Pacing Slider */}
          <div className="relative h-10 mb-2">
            <div className="absolute top-1/2 left-0 right-0 h-2 rounded -translate-y-1/2 bg-gradient-to-r from-blue-300 via-green-300 to-red-300" />
            <div className="absolute top-1/2 left-1/2 w-15 h-4 bg-green-500/20 border border-green-500 rounded-lg -translate-x-1/2 -translate-y-1/2" />
            <motion.div
              initial={{ left: '50%' }}
              animate={{ left: `${getPacingPosition(pacing.rating)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="absolute top-1/2 w-4 h-4 rounded-full border-2 border-white shadow-md -translate-x-1/2 -translate-y-1/2"
              style={{ backgroundColor: pacing.rating === 'optimal' ? '#22c55e' : '#f59e0b' }}
            />
            <div className="absolute -bottom-1 left-0 right-0 flex justify-between text-[10px] text-slate-400">
              <span>Langsam</span>
              <span className="text-green-500 font-medium">Optimal</span>
              <span>Schnell</span>
            </div>
          </div>

          {pacing.feedback && (
            <p className="text-[13px] leading-normal text-slate-600 mt-4">
              {pacing.feedback}
            </p>
          )}
        </div>
      )}

      {/* Tonality */}
      {tonality && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Music2 size={18} className="text-teal-500" />
              <span className="text-sm font-semibold text-slate-800">
                Betonung & Melodie
              </span>
            </div>
            <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-teal-50 text-teal-700">
              {getTonalityLabel(tonality.rating)}
            </span>
          </div>

          {/* Simple Waveform */}
          <div className="flex items-center justify-center gap-0.5 h-12 mb-3">
            {Array.from({ length: 30 }).map((_, i) => {
              const { base, variance } = getTonalityVariance(tonality.rating);
              const height = base + Math.sin(i * 0.5) * variance + (Math.sin(i * 12.9898) % 1) * (variance / 2);
              return (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(10, Math.min(100, height))}%` }}
                  transition={{ duration: 0.5, delay: i * 0.02 }}
                  className="w-1 rounded-sm bg-teal-500"
                />
              );
            })}
          </div>

          {/* Highlights with timestamps */}
          {tonality.highlights?.length > 0 && onJumpToTimestamp && (
            <div className="mb-3">
              {tonality.highlights.map((highlight, idx) => (
                <button
                  key={idx}
                  onClick={() => onJumpToTimestamp(parseTimestamp(highlight.timestamp))}
                  className={`w-full flex items-start gap-2 px-3 py-2.5 mb-1.5 rounded-lg border-none cursor-pointer text-left ${
                    highlight.type === 'positive' ? 'bg-green-50' : 'bg-red-50'
                  }`}
                >
                  <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded flex-shrink-0 ${
                    highlight.type === 'positive' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                  }`}>
                    {highlight.timestamp}
                  </span>
                  <span className="flex-shrink-0 mt-0.5">
                    {highlight.type === 'positive' ? (
                      <CheckCircle2 size={14} className="text-green-500" />
                    ) : (
                      <AlertTriangle size={14} className="text-red-500" />
                    )}
                  </span>
                  <span className="text-xs text-slate-600 flex-1 leading-relaxed break-words">
                    {highlight.note}
                  </span>
                  <Play size={12} className="text-slate-400 flex-shrink-0 mt-0.5" />
                </button>
              ))}
            </div>
          )}

          {tonality.feedback && (
            <p className="text-[13px] leading-normal text-slate-600">
              {tonality.feedback}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default AudioAnalysisPanel;
