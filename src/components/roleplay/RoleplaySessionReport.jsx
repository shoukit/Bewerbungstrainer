/**
 * RoleplaySessionReport Component
 *
 * Unified, beautiful report view for Live-Simulation sessions.
 * Used both after session completion and from Session History.
 *
 * Features:
 * - Clean header with score gauge
 * - Two-column layout (desktop) / stacked (mobile)
 * - Audio player with timeline
 * - Chat-style transcript
 * - Tabbed feedback: Coaching & Analysen
 * - Full responsive design
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  MessageSquare,
  User,
  Bot,
  ChevronDown,
  ChevronRight,
  Award,
  Star,
  CheckCircle2,
  TrendingUp,
  Lightbulb,
  Target,
  Gauge,
  Timer,
  Music2,
  AlertTriangle,
  Calendar,
  Clock,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useBranding } from '@/hooks/useBranding';
import { useMobile } from '@/hooks/useMobile';
import { getScoreColor } from '@/config/colors';
import { formatDuration } from '@/utils/formatting';
import { parseFeedbackJSON, parseAudioAnalysisJSON, parseTranscriptJSON } from '@/utils/parseJSON';
import { getRoleplaySessionAnalysis } from '@/services/roleplay-feedback-adapter';

// =============================================================================
// CONSTANTS
// =============================================================================

const TABS = {
  COACHING: 'coaching',
  ANALYSEN: 'analysen',
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const getGradeLabel = (score) => {
  if (score >= 90) return 'Ausgezeichnet!';
  if (score >= 80) return 'Sehr gut!';
  if (score >= 70) return 'Gut!';
  if (score >= 60) return 'Solide Leistung';
  if (score >= 50) return 'Ausbaufähig';
  return 'Weiter üben!';
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getConfidenceColorScheme = (score) => {
  if (score >= 80) return { color: '#22c55e', bg: '#f0fdf4', label: 'Sehr selbstsicher' };
  if (score >= 60) return { color: '#3b82f6', bg: '#eff6ff', label: 'Selbstsicher' };
  if (score >= 40) return { color: '#f59e0b', bg: '#fffbeb', label: 'Ausbaufähig' };
  return { color: '#ef4444', bg: '#fef2f2', label: 'Unsicher' };
};

const getPacingPosition = (rating) => {
  switch (rating) {
    case 'zu_langsam': return 15;
    case 'optimal': return 50;
    case 'zu_schnell': return 85;
    default: return 50;
  }
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/**
 * Score Gauge - Circular progress indicator
 */
const ScoreGauge = ({ score, size = 100, primaryAccent, isHeader = false }) => {
  const percentage = Math.min(100, Math.max(0, score || 0));
  const radius = (size - 10) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;
  const color = getScoreColor(score, primaryAccent);

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={isHeader ? 'rgba(255,255,255,0.25)' : '#e2e8f0'}
          strokeWidth={8}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={isHeader ? '#fff' : color}
          strokeWidth={8}
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
        justifyContent: 'center',
      }}>
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          style={{
            fontSize: size / 3,
            fontWeight: 700,
            color: isHeader ? '#fff' : color,
            lineHeight: 1,
          }}
        >
          {Math.round(score)}
        </motion.span>
      </div>
    </div>
  );
};

/**
 * Audio Player Component
 */
const AudioPlayer = ({ audioUrl, duration: durationHint, primaryAccent, branding, onSeek }) => {
  const audioRef = useRef(null);
  const progressRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationHint || 0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!audioUrl) return;

    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
      setIsLoading(false);
    });

    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime);
    });

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setCurrentTime(0);
    });

    audio.addEventListener('error', () => {
      setError('Audio konnte nicht geladen werden');
      setIsLoading(false);
    });

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const skip = (seconds) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
  };

  const seekTo = (time) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  // Expose seek function to parent
  useEffect(() => {
    if (onSeek) {
      onSeek.current = seekTo;
    }
  }, [onSeek]);

  const handleProgressClick = (e) => {
    if (!progressRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const percentage = (e.clientX - rect.left) / rect.width;
    seekTo(percentage * duration);
  };

  if (!audioUrl) return null;

  return (
    <div style={{
      background: '#fff',
      borderRadius: '16px',
      padding: '20px',
      border: `1px solid ${branding.borderColor}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <Volume2 size={18} color={primaryAccent} />
        <span style={{ fontSize: '14px', fontWeight: 600, color: branding.textMain }}>
          Gesprächsaufnahme
        </span>
      </div>

      {/* Progress Bar */}
      <div
        ref={progressRef}
        onClick={handleProgressClick}
        style={{
          position: 'relative',
          height: '48px',
          background: branding.cardBgHover,
          borderRadius: '12px',
          cursor: 'pointer',
          overflow: 'hidden',
          marginBottom: '16px',
        }}
      >
        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Loader2 size={24} color={primaryAccent} style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : error ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '8px' }}>
            <AlertCircle size={18} color={branding.warning} />
            <span style={{ fontSize: '13px', color: branding.textMuted }}>{error}</span>
          </div>
        ) : (
          <>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(90deg, ${primaryAccent}40, ${primaryAccent}60)`,
                borderRadius: '12px',
              }}
            />
            <div style={{
              position: 'absolute',
              left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
              top: 0,
              bottom: 0,
              width: '3px',
              background: primaryAccent,
              transform: 'translateX(-50%)',
            }} />
          </>
        )}
      </div>

      {/* Controls */}
      {!error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => skip(-10)}
              disabled={isLoading}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                border: 'none',
                background: branding.cardBgHover,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: isLoading ? 0.5 : 1,
              }}
            >
              <SkipBack size={16} color={branding.textSecondary} />
            </button>
            <button
              onClick={togglePlay}
              disabled={isLoading}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                border: 'none',
                background: primaryAccent,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: isLoading ? 0.5 : 1,
              }}
            >
              {isPlaying ? (
                <Pause size={20} color="#fff" />
              ) : (
                <Play size={20} color="#fff" style={{ marginLeft: '2px' }} />
              )}
            </button>
            <button
              onClick={() => skip(10)}
              disabled={isLoading}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                border: 'none',
                background: branding.cardBgHover,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: isLoading ? 0.5 : 1,
              }}
            >
              <SkipForward size={16} color={branding.textSecondary} />
            </button>
          </div>

          <div style={{ flex: 1, textAlign: 'center', fontSize: '14px', color: branding.textSecondary, fontFamily: 'monospace' }}>
            {formatDuration(currentTime)} / {formatDuration(duration)}
          </div>

          <button
            onClick={toggleMute}
            disabled={isLoading}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              border: 'none',
              background: branding.cardBgHover,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isMuted ? (
              <VolumeX size={16} color={branding.textSecondary} />
            ) : (
              <Volume2 size={16} color={branding.textSecondary} />
            )}
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * Chat-style Transcript
 */
const TranscriptView = ({ transcript, scenario, primaryAccent, branding, onSeekToTime }) => {
  if (!transcript || transcript.length === 0) {
    return (
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        padding: '40px 20px',
        border: `1px solid ${branding.borderColor}`,
        textAlign: 'center',
      }}>
        <MessageSquare size={32} color={branding.textMuted} style={{ marginBottom: '12px' }} />
        <p style={{ color: branding.textMuted, fontSize: '14px' }}>Kein Transkript verfügbar</p>
      </div>
    );
  }

  return (
    <div style={{
      background: '#fff',
      borderRadius: '16px',
      padding: '20px',
      border: `1px solid ${branding.borderColor}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <MessageSquare size={18} color={primaryAccent} />
        <span style={{ fontSize: '14px', fontWeight: 600, color: branding.textMain }}>
          Gesprächsverlauf
        </span>
      </div>

      <div style={{ maxHeight: '500px', overflowY: 'auto', paddingRight: '8px' }}>
        {transcript.map((entry, idx) => {
          const isAgent = entry.role === 'agent';
          const timeLabel = entry.timeLabel || (entry.elapsedTime !== undefined ? formatDuration(entry.elapsedTime) : null);

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              style={{
                display: 'flex',
                gap: '10px',
                marginBottom: '12px',
                flexDirection: isAgent ? 'row' : 'row-reverse',
              }}
            >
              {/* Avatar */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                {isAgent ? (
                  scenario?.interviewer_profile?.image_url ? (
                    <img
                      src={scenario.interviewer_profile.image_url}
                      alt={scenario.interviewer_profile.name || 'Interviewer'}
                      style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${primaryAccent}30` }}
                    />
                  ) : (
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${primaryAccent}, ${primaryAccent}cc)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Bot size={16} color="#fff" />
                    </div>
                  )
                ) : (
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <User size={16} color="#fff" />
                  </div>
                )}
                {!isAgent && timeLabel && (
                  <button
                    onClick={() => onSeekToTime?.(entry.elapsedTime)}
                    style={{
                      fontSize: '10px',
                      fontFamily: 'monospace',
                      color: primaryAccent,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    {timeLabel}
                  </button>
                )}
              </div>

              {/* Message Bubble */}
              <div style={{
                maxWidth: '85%',
                padding: '10px 14px',
                borderRadius: isAgent ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                background: isAgent ? branding.cardBgHover : 'linear-gradient(135deg, #14b8a6, #0d9488)',
                color: isAgent ? branding.textMain : '#fff',
                fontSize: '13px',
                lineHeight: 1.5,
                border: isAgent ? `1px solid ${branding.borderColor}` : 'none',
              }}>
                {entry.text}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Rating Bar Component
 */
const RatingBar = ({ label, value, maxValue = 10, primaryAccent, branding }) => {
  const percentage = (value / maxValue) * 100;
  const displayValue = maxValue === 10 ? value * 10 : value;
  const color = getScoreColor(displayValue, primaryAccent);

  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontSize: '13px', color: branding.textSecondary }}>{label}</span>
        <span style={{ fontSize: '13px', fontWeight: 600, color }}>{displayValue}</span>
      </div>
      <div style={{ height: '6px', background: branding.cardBgHover, borderRadius: '3px', overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ height: '100%', background: color, borderRadius: '3px' }}
        />
      </div>
    </div>
  );
};

/**
 * Coaching Tab Content
 */
const CoachingContent = ({ feedback, audioAnalysis, primaryAccent, branding }) => {
  const [expandedSection, setExpandedSection] = useState('summary');

  const sections = [
    { id: 'summary', title: 'Gesamtbewertung', icon: Award, color: primaryAccent },
    { id: 'strengths', title: 'Deine Superkräfte', icon: CheckCircle2, color: '#22c55e' },
    { id: 'improvements', title: 'Dein Trainingsfeld', icon: TrendingUp, color: '#f59e0b' },
    { id: 'tips', title: 'Praktische Tipps', icon: Lightbulb, color: '#3b82f6' },
  ];

  const toggleSection = (id) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Summary Section */}
      {feedback?.summary && (
        <div style={{
          background: `${primaryAccent}08`,
          borderRadius: '12px',
          border: `1px solid ${primaryAccent}20`,
          overflow: 'hidden',
        }}>
          <button
            onClick={() => toggleSection('summary')}
            style={{
              width: '100%',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <Award size={18} color={primaryAccent} />
            <span style={{ flex: 1, fontSize: '14px', fontWeight: 600, color: branding.textMain }}>
              Gesamtbewertung
            </span>
            <ChevronDown
              size={18}
              color={branding.textMuted}
              style={{ transform: expandedSection === 'summary' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
            />
          </button>
          <AnimatePresence>
            {expandedSection === 'summary' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ padding: '0 16px 16px' }}>
                  <p style={{ fontSize: '13px', lineHeight: 1.7, color: branding.textSecondary }}>
                    {feedback.summary}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Strengths Section */}
      {feedback?.strengths?.length > 0 && (
        <div style={{
          background: '#f0fdf4',
          borderRadius: '12px',
          border: '1px solid #bbf7d0',
          overflow: 'hidden',
        }}>
          <button
            onClick={() => toggleSection('strengths')}
            style={{
              width: '100%',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <CheckCircle2 size={18} color="#22c55e" />
            <span style={{ flex: 1, fontSize: '14px', fontWeight: 600, color: '#166534' }}>
              Deine Superkräfte
            </span>
            <span style={{ fontSize: '12px', color: '#22c55e', fontWeight: 500 }}>
              {feedback.strengths.length} Stärken
            </span>
            <ChevronDown
              size={18}
              color="#22c55e"
              style={{ transform: expandedSection === 'strengths' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
            />
          </button>
          <AnimatePresence>
            {expandedSection === 'strengths' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ padding: '0 16px 16px' }}>
                  {feedback.strengths.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: '#dcfce7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px',
                      }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#22c55e' }}>✓</span>
                      </div>
                      <p style={{ fontSize: '13px', lineHeight: 1.6, color: '#166534', margin: 0 }}>{item}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Improvements Section */}
      {feedback?.improvements?.length > 0 && (
        <div style={{
          background: '#fffbeb',
          borderRadius: '12px',
          border: '1px solid #fde68a',
          overflow: 'hidden',
        }}>
          <button
            onClick={() => toggleSection('improvements')}
            style={{
              width: '100%',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <TrendingUp size={18} color="#f59e0b" />
            <span style={{ flex: 1, fontSize: '14px', fontWeight: 600, color: '#92400e' }}>
              Dein Trainingsfeld
            </span>
            <span style={{ fontSize: '12px', color: '#f59e0b', fontWeight: 500 }}>
              {feedback.improvements.length} Punkte
            </span>
            <ChevronDown
              size={18}
              color="#f59e0b"
              style={{ transform: expandedSection === 'improvements' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
            />
          </button>
          <AnimatePresence>
            {expandedSection === 'improvements' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ padding: '0 16px 16px' }}>
                  {feedback.improvements.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: '#fef3c7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px',
                      }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#f59e0b' }}>{idx + 1}</span>
                      </div>
                      <p style={{ fontSize: '13px', lineHeight: 1.6, color: '#92400e', margin: 0 }}>{item}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Tips Section */}
      {feedback?.tips?.length > 0 && (
        <div style={{
          background: '#eff6ff',
          borderRadius: '12px',
          border: '1px solid #bfdbfe',
          overflow: 'hidden',
        }}>
          <button
            onClick={() => toggleSection('tips')}
            style={{
              width: '100%',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <Lightbulb size={18} color="#3b82f6" />
            <span style={{ flex: 1, fontSize: '14px', fontWeight: 600, color: '#1e40af' }}>
              Praktische Tipps
            </span>
            <span style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 500 }}>
              {feedback.tips.length} Tipps
            </span>
            <ChevronDown
              size={18}
              color="#3b82f6"
              style={{ transform: expandedSection === 'tips' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
            />
          </button>
          <AnimatePresence>
            {expandedSection === 'tips' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ padding: '0 16px 16px' }}>
                  {feedback.tips.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                      <Target size={16} color="#3b82f6" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <p style={{ fontSize: '13px', lineHeight: 1.6, color: '#1e40af', margin: 0 }}>{item}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Rating Bars */}
      {feedback?.rating && (
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          padding: '16px',
          border: `1px solid ${branding.borderColor}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Star size={18} color={primaryAccent} />
            <span style={{ fontSize: '14px', fontWeight: 600, color: branding.textMain }}>
              Bewertungskriterien
            </span>
          </div>
          {feedback.rating.communication !== undefined && (
            <RatingBar label="Kommunikation" value={feedback.rating.communication} primaryAccent={primaryAccent} branding={branding} />
          )}
          {feedback.rating.motivation !== undefined && (
            <RatingBar label="Motivation" value={feedback.rating.motivation} primaryAccent={primaryAccent} branding={branding} />
          )}
          {feedback.rating.professionalism !== undefined && (
            <RatingBar label="Professionalität" value={feedback.rating.professionalism} primaryAccent={primaryAccent} branding={branding} />
          )}
          {feedback.rating.preparation !== undefined && (
            <RatingBar label="Vorbereitung" value={feedback.rating.preparation} primaryAccent={primaryAccent} branding={branding} />
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Analysen Tab Content
 */
const AnalysenContent = ({ audioAnalysis, primaryAccent, branding, onJumpToTimestamp }) => {
  if (!audioAnalysis) {
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Confidence Gauge */}
      {audioAnalysis.confidence?.rating !== undefined && (
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
              const score = audioAnalysis.confidence.rating * 10;
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
                        {score}
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

          {audioAnalysis.confidence.feedback && (
            <p style={{ fontSize: '13px', lineHeight: 1.6, color: branding.textSecondary, textAlign: 'center' }}>
              {audioAnalysis.confidence.feedback}
            </p>
          )}
        </div>
      )}

      {/* Filler Words */}
      {audioAnalysis.fillerWords && (
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
            {audioAnalysis.fillerWords.count !== undefined && (
              <span style={{
                fontSize: '13px',
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: '20px',
                background: audioAnalysis.fillerWords.count <= 2 ? '#dcfce7' : audioAnalysis.fillerWords.count <= 5 ? '#fef3c7' : '#fee2e2',
                color: audioAnalysis.fillerWords.count <= 2 ? '#166534' : audioAnalysis.fillerWords.count <= 5 ? '#92400e' : '#991b1b',
              }}>
                {audioAnalysis.fillerWords.count}x gesamt
              </span>
            )}
          </div>

          {audioAnalysis.fillerWords.examples?.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
              {audioAnalysis.fillerWords.examples.map((word, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: '13px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    background: '#fef3c7',
                    color: '#92400e',
                    fontWeight: 500,
                  }}
                >
                  "{word}"
                </span>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#22c55e' }}>
              <CheckCircle2 size={16} />
              <span style={{ fontSize: '13px' }}>Keine Füllwörter erkannt!</span>
            </div>
          )}

          {audioAnalysis.fillerWords.feedback && (
            <p style={{ fontSize: '13px', lineHeight: 1.6, color: branding.textSecondary, marginTop: '12px' }}>
              {audioAnalysis.fillerWords.feedback}
            </p>
          )}
        </div>
      )}

      {/* Pacing */}
      {audioAnalysis.pace && (
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
            {audioAnalysis.pace.wordsPerMinute && (
              <span style={{
                fontSize: '12px',
                fontFamily: 'monospace',
                padding: '4px 10px',
                borderRadius: '6px',
                background: branding.cardBgHover,
                color: branding.textSecondary,
              }}>
                ~{audioAnalysis.pace.wordsPerMinute} WPM
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
              animate={{ left: `${getPacingPosition(audioAnalysis.pace.rating)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                top: '50%',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: audioAnalysis.pace.rating === 'optimal' ? '#22c55e' : '#f59e0b',
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

          {audioAnalysis.pace.feedback && (
            <p style={{ fontSize: '13px', lineHeight: 1.6, color: branding.textSecondary, marginTop: '16px' }}>
              {audioAnalysis.pace.feedback}
            </p>
          )}
        </div>
      )}

      {/* Tonality */}
      {audioAnalysis.tonalModulation && (
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
              {audioAnalysis.tonalModulation.rating >= 8 ? 'Natürlich' :
               audioAnalysis.tonalModulation.rating >= 5 ? 'Ausbaufähig' : 'Monoton'}
            </span>
          </div>

          {/* Simple Waveform */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px', height: '48px', marginBottom: '12px' }}>
            {Array.from({ length: 30 }).map((_, i) => {
              const baseHeight = audioAnalysis.tonalModulation.rating >= 7 ? 25 : 35;
              const variance = audioAnalysis.tonalModulation.rating >= 7 ? 25 : 10;
              const height = baseHeight + Math.sin(i * 0.5) * variance + (Math.sin(i * 12.9898) % 1) * (variance / 2);
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

          {audioAnalysis.tonalModulation.feedback && (
            <p style={{ fontSize: '13px', lineHeight: 1.6, color: branding.textSecondary }}>
              {audioAnalysis.tonalModulation.feedback}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const RoleplaySessionReport = ({
  session: sessionProp,
  scenario,
  feedback: feedbackProp,
  audioAnalysis: audioAnalysisProp,
  onBack,
  onRepeat,
  isLoading: isLoadingProp = false,
}) => {
  const b = useBranding();
  const isMobile = useMobile(768);
  const audioSeekRef = useRef(null);
  const [activeTab, setActiveTab] = useState(TABS.COACHING);

  // State for full session data (fetched if needed)
  const [fullSession, setFullSession] = useState(null);
  const [isLoadingSession, setIsLoadingSession] = useState(false);

  // Use full session if available, otherwise use prop
  const session = fullSession || sessionProp;

  // Fetch full session data if audio_analysis_json is missing
  useEffect(() => {
    const needsFullData = sessionProp?.id &&
      !sessionProp?.audio_analysis_json &&
      !audioAnalysisProp &&
      !fullSession;

    if (needsFullData) {
      setIsLoadingSession(true);
      getRoleplaySessionAnalysis(sessionProp.id)
        .then(data => {
          setFullSession(data);
        })
        .catch(err => {
          console.error('Failed to fetch full session:', err);
        })
        .finally(() => {
          setIsLoadingSession(false);
        });
    }
  }, [sessionProp?.id, sessionProp?.audio_analysis_json, audioAnalysisProp, fullSession]);

  // Parse feedback and audio analysis
  const feedback = useMemo(() => {
    if (feedbackProp && typeof feedbackProp === 'object') return feedbackProp;
    if (session?.feedback_json) return parseFeedbackJSON(session.feedback_json);
    return null;
  }, [feedbackProp, session?.feedback_json]);

  const audioAnalysis = useMemo(() => {
    if (audioAnalysisProp && typeof audioAnalysisProp === 'object') return audioAnalysisProp;
    if (session?.audio_analysis_json) return parseAudioAnalysisJSON(session.audio_analysis_json);
    return null;
  }, [audioAnalysisProp, session?.audio_analysis_json]);

  const transcript = useMemo(() => {
    if (session?.transcript) return parseTranscriptJSON(session.transcript);
    return [];
  }, [session?.transcript]);

  // Calculate overall score
  const overallScore = useMemo(() => {
    if (feedback?.rating?.overall !== undefined) {
      return feedback.rating.overall * 10;
    }
    return 0;
  }, [feedback]);

  const primaryAccent = b.primaryAccent;
  const headerGradient = b.headerGradient;

  const handleSeekToTime = (time) => {
    if (audioSeekRef.current) {
      audioSeekRef.current(time);
    }
  };

  const isLoading = isLoadingProp || isLoadingSession;

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '16px',
      }}>
        <Loader2 size={40} color={primaryAccent} style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ color: b.textSecondary, fontSize: '14px' }}>Lade Report...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: b.pageBg }}>
      {/* Header */}
      <div style={{
        background: headerGradient,
        padding: isMobile ? '20px 16px' : '24px 32px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Back Button */}
          {onBack && (
            <button
              onClick={onBack}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 12px',
                cursor: 'pointer',
                color: '#fff',
                fontSize: '13px',
                marginBottom: '16px',
              }}
            >
              <ArrowLeft size={16} />
              Zurück zur Übersicht
            </button>
          )}

          {/* Header Content */}
          <div style={{
            display: 'flex',
            alignItems: isMobile ? 'flex-start' : 'center',
            gap: isMobile ? '16px' : '24px',
            flexDirection: isMobile ? 'column' : 'row',
          }}>
            {/* Score Gauge */}
            <ScoreGauge score={overallScore} size={isMobile ? 80 : 100} primaryAccent={primaryAccent} isHeader />

            {/* Title & Meta */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  background: 'rgba(255,255,255,0.2)',
                  color: '#fff',
                }}>
                  Live-Simulation
                </span>
                <span style={{
                  fontSize: '12px',
                  fontWeight: 500,
                  padding: '4px 10px',
                  borderRadius: '20px',
                  background: 'rgba(255,255,255,0.9)',
                  color: getScoreColor(overallScore, primaryAccent),
                }}>
                  {getGradeLabel(overallScore)}
                </span>
              </div>
              <h1 style={{
                fontSize: isMobile ? '20px' : '24px',
                fontWeight: 700,
                color: '#fff',
                margin: 0,
                marginBottom: '8px',
              }}>
                {scenario?.title || session?.scenario_title || 'Übungssession'}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>
                  <Calendar size={14} />
                  {formatDate(session?.created_at)}
                </span>
                {session?.duration && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>
                    <Clock size={14} />
                    {formatDuration(session.duration)}
                  </span>
                )}
              </div>
            </div>

            {/* Repeat Button */}
            {onRepeat && !isMobile && (
              <button
                onClick={onRepeat}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(255,255,255,0.2)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '10px',
                  padding: '10px 20px',
                  cursor: 'pointer',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                <Play size={16} />
                Erneut üben
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: isMobile ? '16px' : '24px 32px',
      }}>
        {/* Audio Player (Full Width) */}
        <div style={{ marginBottom: '24px' }}>
          <AudioPlayer
            audioUrl={session?.audio_url}
            duration={session?.duration}
            primaryAccent={primaryAccent}
            branding={b}
            onSeek={audioSeekRef}
          />
        </div>

        {/* Two Column Layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 420px',
          gap: '24px',
          alignItems: 'start',
        }}>
          {/* Left Column: Transcript */}
          <div style={{ order: isMobile ? 2 : 1 }}>
            <TranscriptView
              transcript={transcript}
              scenario={scenario}
              primaryAccent={primaryAccent}
              branding={b}
              onSeekToTime={handleSeekToTime}
            />
          </div>

          {/* Right Column: Tabbed Feedback */}
          <div style={{ order: isMobile ? 1 : 2 }}>
            {/* Tabs */}
            <div style={{
              display: 'flex',
              background: '#fff',
              borderRadius: '12px',
              padding: '4px',
              marginBottom: '16px',
              border: `1px solid ${b.borderColor}`,
            }}>
              <button
                onClick={() => setActiveTab(TABS.COACHING)}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: activeTab === TABS.COACHING ? primaryAccent : 'transparent',
                  color: activeTab === TABS.COACHING ? '#fff' : b.textSecondary,
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                Coaching
              </button>
              <button
                onClick={() => setActiveTab(TABS.ANALYSEN)}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: activeTab === TABS.ANALYSEN ? primaryAccent : 'transparent',
                  color: activeTab === TABS.ANALYSEN ? '#fff' : b.textSecondary,
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                Analysen
              </button>
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === TABS.COACHING ? (
                  <CoachingContent
                    feedback={feedback}
                    audioAnalysis={audioAnalysis}
                    primaryAccent={primaryAccent}
                    branding={b}
                  />
                ) : (
                  <AnalysenContent
                    audioAnalysis={audioAnalysis}
                    primaryAccent={primaryAccent}
                    branding={b}
                    onJumpToTimestamp={handleSeekToTime}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile Repeat Button */}
        {onRepeat && isMobile && (
          <div style={{ marginTop: '24px' }}>
            <button
              onClick={onRepeat}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: primaryAccent,
                border: 'none',
                borderRadius: '12px',
                padding: '14px 24px',
                cursor: 'pointer',
                color: '#fff',
                fontSize: '15px',
                fontWeight: 600,
              }}
            >
              <Play size={18} />
              Erneut üben
            </button>
          </div>
        )}
      </div>

      {/* CSS for spin animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default RoleplaySessionReport;
