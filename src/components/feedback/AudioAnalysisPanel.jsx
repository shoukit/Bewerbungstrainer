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
import { useBranding } from '@/hooks/useBranding';

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
  const branding = useBranding();

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
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '40px 20px',
        border: `1px solid ${branding.borderColor}`,
        textAlign: 'center',
      }}>
        <Gauge size={32} color={branding.textMuted} style={{ marginBottom: '12px' }} />
        <p style={{ color: branding.textMuted, fontSize: '14px' }}>Keine Audio-Analyse verfügbar</p>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Confidence Gauge */}
      {confidenceScore !== undefined && (
        <div style={{
          background: '#fff',
          borderRadius: '16px',
          padding: '20px',
          border: `1px solid ${branding.borderColor}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Gauge size={18} color={primaryAccent} />
            <span style={{ fontSize: '14px', fontWeight: 600, color: branding.textMain }}>
              Selbstsicherheit
            </span>
          </div>

          {/* Semicircle Gauge */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            {(() => {
              const score = confidenceScore;
              const colorScheme = getConfidenceColorScheme(score);
              const size = 140;
              const radius = size / 2 - 12;
              const circumference = Math.PI * radius;
              const offset = circumference - (score / 100) * circumference;

              return (
                <div style={{
                  background: colorScheme.bg,
                  borderRadius: '16px',
                  padding: '20px 30px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}>
                  <div style={{ position: 'relative', width: size, height: size / 2 + 20 }}>
                    <svg width={size} height={size / 2 + 20} style={{ overflow: 'visible' }}>
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
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      paddingBottom: '4px',
                    }}>
                      <motion.span
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 }}
                        style={{ fontSize: '32px', fontWeight: 700, color: colorScheme.color }}
                      >
                        {Math.round(score)}
                      </motion.span>
                      <span style={{ fontSize: '11px', color: branding.textMuted }}>/ 100</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
                    <Gauge size={14} color={colorScheme.color} />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: colorScheme.color }}>
                      {colorScheme.label}
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>

          {metrics.summary_text && (
            <p style={{ fontSize: '13px', lineHeight: 1.6, color: branding.textSecondary, textAlign: 'center' }}>
              {metrics.summary_text}
            </p>
          )}
        </div>
      )}

      {/* Filler Words */}
      {speechCleanliness && (
        <div style={{
          background: '#fff',
          borderRadius: '16px',
          padding: '20px',
          border: `1px solid ${branding.borderColor}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={18} color="#f97316" />
              <span style={{ fontSize: '14px', fontWeight: 600, color: branding.textMain }}>
                Füllwörter
              </span>
            </div>
            <span style={{
              fontSize: '13px',
              fontWeight: 600,
              padding: '4px 10px',
              borderRadius: '20px',
              background: fillerCount <= 2 ? '#dcfce7' : fillerCount <= 5 ? '#fef3c7' : '#fee2e2',
              color: fillerCount <= 2 ? '#166534' : fillerCount <= 5 ? '#92400e' : '#991b1b',
            }}>
              {fillerCount}x gesamt
            </span>
          </div>

          {fillerWordAnalysis.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
              {fillerWordAnalysis.map((item, idx) => (
                <div key={idx} style={{ borderRadius: '8px', background: '#fef3c7', overflow: 'hidden' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                  }}>
                    <span style={{ fontSize: '13px', color: '#92400e', fontWeight: 500 }}>
                      "{item.word}"
                    </span>
                    <span style={{ fontSize: '12px', color: '#92400e', fontWeight: 600 }}>
                      {item.count}x
                    </span>
                  </div>
                  {item.examples?.length > 0 && onJumpToTimestamp && (
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '6px',
                      padding: '8px 12px',
                      background: '#fef9e7',
                      borderTop: '1px solid #fde68a',
                    }}>
                      {item.examples.map((example, exIdx) => (
                        <button
                          key={exIdx}
                          onClick={() => onJumpToTimestamp(parseTimestamp(example.timestamp))}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            border: 'none',
                            background: '#fef3c7',
                            cursor: 'pointer',
                            fontSize: '11px',
                            color: '#92400e',
                            transition: 'all 0.15s',
                          }}
                          onMouseOver={(e) => e.currentTarget.style.background = '#fde68a'}
                          onMouseOut={(e) => e.currentTarget.style.background = '#fef3c7'}
                        >
                          <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{example.timestamp}</span>
                          <Play size={10} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#22c55e' }}>
              <CheckCircle2 size={16} />
              <span style={{ fontSize: '13px' }}>Keine Füllwörter erkannt!</span>
            </div>
          )}

          {fillerFeedback && (
            <p style={{ fontSize: '13px', lineHeight: 1.6, color: branding.textSecondary, marginTop: '12px' }}>
              {fillerFeedback}
            </p>
          )}
        </div>
      )}

      {/* Pacing */}
      {pacing && (
        <div style={{
          background: '#fff',
          borderRadius: '16px',
          padding: '20px',
          border: `1px solid ${branding.borderColor}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Timer size={18} color="#3b82f6" />
              <span style={{ fontSize: '14px', fontWeight: 600, color: branding.textMain }}>
                Sprechtempo
              </span>
            </div>
            {pacing.estimated_wpm && (
              <span style={{
                fontSize: '12px',
                fontFamily: 'monospace',
                padding: '4px 10px',
                borderRadius: '6px',
                background: branding.cardBgHover,
                color: branding.textSecondary,
              }}>
                ~{pacing.estimated_wpm} WPM
              </span>
            )}
          </div>

          {/* Pacing Slider */}
          <div style={{ position: 'relative', height: '40px', marginBottom: '8px' }}>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              right: 0,
              height: '8px',
              borderRadius: '4px',
              background: 'linear-gradient(90deg, #93c5fd, #86efac, #fca5a5)',
              transform: 'translateY(-50%)',
            }} />
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '60px',
              height: '16px',
              background: 'rgba(34, 197, 94, 0.2)',
              border: '1px solid #22c55e',
              borderRadius: '8px',
              transform: 'translate(-50%, -50%)',
            }} />
            <motion.div
              initial={{ left: '50%' }}
              animate={{ left: `${getPacingPosition(pacing.rating)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                top: '50%',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: pacing.rating === 'optimal' ? '#22c55e' : '#f59e0b',
                border: '2px solid #fff',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                transform: 'translate(-50%, -50%)',
              }}
            />
            <div style={{
              position: 'absolute',
              bottom: '-4px',
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '10px',
              color: branding.textMuted,
            }}>
              <span>Langsam</span>
              <span style={{ color: '#22c55e', fontWeight: 500 }}>Optimal</span>
              <span>Schnell</span>
            </div>
          </div>

          {pacing.feedback && (
            <p style={{ fontSize: '13px', lineHeight: 1.6, color: branding.textSecondary, marginTop: '16px' }}>
              {pacing.feedback}
            </p>
          )}
        </div>
      )}

      {/* Tonality */}
      {tonality && (
        <div style={{
          background: '#fff',
          borderRadius: '16px',
          padding: '20px',
          border: `1px solid ${branding.borderColor}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Music2 size={18} color="#14b8a6" />
              <span style={{ fontSize: '14px', fontWeight: 600, color: branding.textMain }}>
                Betonung & Melodie
              </span>
            </div>
            <span style={{
              fontSize: '12px',
              fontWeight: 500,
              padding: '4px 10px',
              borderRadius: '6px',
              background: '#f0fdfa',
              color: '#0d9488',
            }}>
              {getTonalityLabel(tonality.rating)}
            </span>
          </div>

          {/* Simple Waveform */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px', height: '48px', marginBottom: '12px' }}>
            {Array.from({ length: 30 }).map((_, i) => {
              const { base, variance } = getTonalityVariance(tonality.rating);
              const height = base + Math.sin(i * 0.5) * variance + (Math.sin(i * 12.9898) % 1) * (variance / 2);
              return (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(10, Math.min(100, height))}%` }}
                  transition={{ duration: 0.5, delay: i * 0.02 }}
                  style={{ width: '4px', borderRadius: '2px', background: '#14b8a6' }}
                />
              );
            })}
          </div>

          {/* Highlights with timestamps */}
          {tonality.highlights?.length > 0 && onJumpToTimestamp && (
            <div style={{ marginBottom: '12px' }}>
              {tonality.highlights.map((highlight, idx) => (
                <button
                  key={idx}
                  onClick={() => onJumpToTimestamp(parseTimestamp(highlight.timestamp))}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    padding: '10px 12px',
                    marginBottom: '6px',
                    borderRadius: '8px',
                    border: 'none',
                    background: highlight.type === 'positive' ? '#f0fdf4' : '#fef2f2',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span style={{
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: highlight.type === 'positive' ? '#dcfce7' : '#fee2e2',
                    color: highlight.type === 'positive' ? '#166534' : '#991b1b',
                    flexShrink: 0,
                  }}>
                    {highlight.timestamp}
                  </span>
                  <span style={{ flexShrink: 0, marginTop: '1px' }}>
                    {highlight.type === 'positive' ? (
                      <CheckCircle2 size={14} color="#22c55e" />
                    ) : (
                      <AlertTriangle size={14} color="#ef4444" />
                    )}
                  </span>
                  <span style={{
                    fontSize: '12px',
                    color: branding.textSecondary,
                    flex: 1,
                    lineHeight: 1.5,
                    wordBreak: 'break-word',
                    whiteSpace: 'normal',
                  }}>
                    {highlight.note}
                  </span>
                  <Play size={12} color={branding.textMuted} style={{ flexShrink: 0, marginTop: '2px' }} />
                </button>
              ))}
            </div>
          )}

          {tonality.feedback && (
            <p style={{ fontSize: '13px', lineHeight: 1.6, color: branding.textSecondary }}>
              {tonality.feedback}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default AudioAnalysisPanel;
