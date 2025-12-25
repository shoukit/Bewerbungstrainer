/**
 * TrainingSessionDetailView Component
 *
 * Unified detail view for Simulator and Video Training sessions.
 * Two-column layout: Media (left) + Analysis (right)
 * Responsive: stacks vertically on mobile
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDuration } from '@/utils/formatting';
import {
  ArrowLeft,
  Play,
  Pause,
  Video,
  Mic,
  Star,
  Target,
  ChevronDown,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  Clock,
  Calendar,
  FileText,
  Award,
  User,
  MessageSquare,
  Eye,
  Loader2,
  SkipBack,
  RotateCcw,
  PlayCircle,
  SkipForward,
  Volume2,
  VolumeX,
  Trash2,
  Download,
} from 'lucide-react';
import { useBranding } from '@/hooks/useBranding';
import { useMobile } from '@/hooks/useMobile';
import { getScoreColor } from '@/config/colors';
import { getRoleplaySessionAnalysis, getRoleplaySessionAudioUrl, getRoleplayScenario } from '@/services/roleplay-feedback-adapter';
import { parseFeedbackJSON, parseAudioAnalysisJSON, parseTranscriptJSON } from '@/utils/parseJSON';
import { getWPNonce, getWPApiUrl } from '@/services/wordpress-api';

// =============================================================================
// CONSTANTS
// =============================================================================

const CATEGORY_ICONS = {
  auftreten: Eye,
  selbstbewusstsein: Award,
  koerpersprache: User,
  kommunikation: MessageSquare,
  professionalitaet: Award,
  inhalt: Lightbulb,
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

// getScoreColor is imported from @/config/colors

const getGradeLabel = (score, maxScore) => {
  const percentage = maxScore === 10 ? score * 10 : score;
  if (percentage >= 90) return 'Ausgezeichnet!';
  if (percentage >= 80) return 'Sehr gut!';
  if (percentage >= 70) return 'Gut!';
  if (percentage >= 60) return 'Solide Leistung';
  if (percentage >= 50) return 'Ausbaufähig';
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

const getTypeLabel = (type) => {
  if (type === 'video') return 'Wirkungs-Analyse';
  if (type === 'roleplay') return 'Live-Simulation';
  return 'Szenario-Training';
};

const getTypeIcon = (type) => {
  if (type === 'video') return Video;
  if (type === 'roleplay') return MessageSquare;
  return Target;
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/**
 * Score display gauge
 * @param {number} score - Score value (always on scale of 100)
 * @param {number} size - Size of the gauge in pixels
 * @param {string} primaryAccent - Primary accent color
 * @param {boolean} isHeader - If true, text will be white for header display
 */
const ScoreGauge = ({ score, size = 120, primaryAccent, isHeader = false, branding }) => {
  const percentage = Math.min(100, Math.max(0, score || 0));
  const radius = (size - 12) / 2;
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
          stroke={isHeader ? 'rgba(255,255,255,0.3)' : branding.borderColor}
          strokeWidth={10}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{ fontSize: size / 3.5, fontWeight: 700, color }}>
          {Math.round(score)}
        </span>
        <span style={{ fontSize: size / 10, color: isHeader ? '#ffffff' : branding.textMuted }}>
          von 100
        </span>
      </div>
    </div>
  );
};

/**
 * Audio player for individual answers
 */
const AudioPlayer = ({ audioUrl, primaryAccent, durationHint, branding }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationHint || 0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!audioUrl) return;

    setIsLoading(true);
    setError(null);
    // Reset duration to hint or 0
    setDuration(durationHint || 0);

    const audio = new Audio();
    audioRef.current = audio;

    const handleLoadedMetadata = () => {
      const dur = audio.duration;
      // Check for valid duration (not Infinity, NaN, or 0)
      if (dur && isFinite(dur) && dur > 0) {
        setDuration(dur);
      }
      setIsLoading(false);
    };

    const handleDurationChange = () => {
      const dur = audio.duration;
      if (dur && isFinite(dur) && dur > 0) {
        setDuration(dur);
      }
    };

    const handleCanPlayThrough = () => {
      setIsLoading(false);
      // Try to get duration again when fully loaded
      const dur = audio.duration;
      if (dur && isFinite(dur) && dur > 0) {
        setDuration(dur);
      }
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('canplaythrough', handleCanPlayThrough);
    audio.addEventListener('timeupdate', () => setCurrentTime(audio.currentTime));
    audio.addEventListener('play', () => setIsPlaying(true));
    audio.addEventListener('pause', () => setIsPlaying(false));
    audio.addEventListener('ended', () => setIsPlaying(false));
    audio.addEventListener('error', () => {
      setError('Audio nicht verfügbar');
      setIsLoading(false);
    });

    // Set source and load
    audio.src = audioUrl;
    audio.load();

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('canplaythrough', handleCanPlayThrough);
      audio.src = '';
    };
  }, [audioUrl, durationHint]);


  const togglePlay = () => {
    if (audioRef.current) {
      isPlaying ? audioRef.current.pause() : audioRef.current.play();
    }
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    if (audioRef.current) audioRef.current.currentTime = percent * duration;
  };

  const skip = (seconds) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(audioRef.current.currentTime + seconds, duration));
    }
  };

  if (error) {
    return (
      <div style={{ padding: '12px', background: branding.cardBgHover, borderRadius: '10px', color: branding.textMuted, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <AlertCircle size={16} /> {error}
      </div>
    );
  }

  if (!audioUrl) return null;

  // Calculate progress percentage safely
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: `1px solid ${branding.borderColor}` }}>
      {/* Progress bar */}
      <div onClick={handleSeek} style={{ height: '8px', background: branding.borderColor, borderRadius: '4px', cursor: 'pointer', marginBottom: '16px' }}>
        <div style={{ width: `${progressPercent}%`, height: '100%', background: primaryAccent || '#0d9488', borderRadius: '4px', transition: 'width 0.1s' }} />
      </div>
      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <button onClick={() => skip(-10)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', color: branding.textMuted }}>
          <SkipBack size={20} />
        </button>
        <button
          onClick={togglePlay}
          disabled={isLoading}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: primaryAccent || '#0d9488',
            border: 'none',
            cursor: isLoading ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            opacity: isLoading ? 0.7 : 1,
          }}
        >
          {isLoading ? (
            <Loader2 size={22} color="#ffffff" style={{ animation: 'spin 1s linear infinite' }} />
          ) : isPlaying ? (
            <Pause size={22} color="#ffffff" fill="#ffffff" strokeWidth={2} />
          ) : (
            <Play size={22} color="#ffffff" fill="#ffffff" strokeWidth={2} style={{ marginLeft: '2px' }} />
          )}
        </button>
        <button onClick={() => skip(10)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', color: branding.textMuted }}>
          <SkipForward size={20} />
        </button>
      </div>
      {/* Time display */}
      <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '13px', color: branding.textMuted }}>
        {formatDuration(currentTime)} / {formatDuration(duration)}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

/**
 * Roleplay Audio Player - Full session audio player
 */
const RoleplayAudioPlayer = ({ sessionId, conversationId, primaryAccent, branding }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!conversationId) {
      setIsLoading(false);
      setError('Keine Audio-Aufnahme verfügbar');
      return;
    }

    const audioUrl = getRoleplaySessionAudioUrl(sessionId);

    setIsLoading(true);
    setError(null);

    fetch(audioUrl, { headers: { 'X-WP-Nonce': getWPNonce() }, credentials: 'same-origin' })
      .then((res) => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.blob(); })
      .then((blob) => {
        const objectUrl = URL.createObjectURL(blob);
        const audio = new Audio(objectUrl);
        audioRef.current = audio;
        audio._objectUrl = objectUrl;

        audio.addEventListener('loadedmetadata', () => { setDuration(audio.duration); setIsLoading(false); });
        audio.addEventListener('timeupdate', () => setCurrentTime(audio.currentTime));
        audio.addEventListener('play', () => setIsPlaying(true));
        audio.addEventListener('pause', () => setIsPlaying(false));
        audio.addEventListener('ended', () => setIsPlaying(false));
        audio.addEventListener('error', () => { setError('Audio konnte nicht abgespielt werden.'); setIsLoading(false); });
      })
      .catch(() => { setError('Audio nicht verfügbar.'); setIsLoading(false); });

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        if (audioRef.current._objectUrl) URL.revokeObjectURL(audioRef.current._objectUrl);
        audioRef.current = null;
      }
    };
  }, [sessionId, conversationId]);


  const togglePlay = () => { if (audioRef.current) isPlaying ? audioRef.current.pause() : audioRef.current.play(); };
  const toggleMute = () => { if (audioRef.current) { audioRef.current.muted = !isMuted; setIsMuted(!isMuted); } };
  const skip = (seconds) => { if (audioRef.current) audioRef.current.currentTime = Math.max(0, Math.min(audioRef.current.currentTime + seconds, duration)); };
  const handleSeek = (e) => { const rect = e.currentTarget.getBoundingClientRect(); const percent = (e.clientX - rect.left) / rect.width; if (audioRef.current) audioRef.current.currentTime = percent * duration; };

  if (isLoading) {
    return (
      <div style={{ background: branding.cardBgHover, borderRadius: '16px', padding: '24px', textAlign: 'center' }}>
        <Loader2 size={24} color={primaryAccent} style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} />
        <p style={{ fontSize: '13px', color: branding.textMuted, marginTop: '8px' }}>Audio wird geladen...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ background: branding.cardBgHover, borderRadius: '16px', padding: '24px', textAlign: 'center' }}>
        <AlertCircle size={24} color={branding.textMuted} style={{ margin: '0 auto' }} />
        <p style={{ fontSize: '13px', color: branding.textMuted, marginTop: '8px' }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: `1px solid ${branding.borderColor}` }}>
      <h3 style={{ fontSize: '15px', fontWeight: 600, color: branding.textMain, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Mic size={18} color={primaryAccent} /> Gesprächsaufnahme
      </h3>
      {/* Progress bar */}
      <div onClick={handleSeek} style={{ height: '8px', background: branding.borderColor, borderRadius: '4px', cursor: 'pointer', marginBottom: '16px' }}>
        <div style={{ width: `${(currentTime / duration) * 100 || 0}%`, height: '100%', background: primaryAccent, borderRadius: '4px', transition: 'width 0.1s' }} />
      </div>
      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <button onClick={() => skip(-10)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', color: branding.textMuted }}>
          <SkipBack size={20} />
        </button>
        <button onClick={togglePlay} style={{ width: '48px', height: '48px', borderRadius: '50%', background: primaryAccent, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
          {isPlaying ? <Pause size={22} color="#ffffff" fill="#ffffff" strokeWidth={2} /> : <Play size={22} color="#ffffff" fill="#ffffff" strokeWidth={2} style={{ marginLeft: '2px' }} />}
        </button>
        <button onClick={() => skip(10)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', color: branding.textMuted }}>
          <SkipForward size={20} />
        </button>
        <button onClick={toggleMute} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', color: branding.textMuted, marginLeft: 'auto' }}>
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
      </div>
      <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '13px', color: branding.textMuted }}>
        {formatDuration(currentTime)} / {formatDuration(duration)}
      </div>
    </div>
  );
};

/**
 * Transcript Entry Component for roleplay conversations
 */
const TranscriptEntry = ({ entry, index, primaryAccent, branding }) => {
  const isUser = entry.role === 'user';
  return (
    <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
      <div style={{
        width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
        background: isUser ? primaryAccent : branding.disabledBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <User size={16} color={isUser ? '#fff' : branding.textSecondary} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: isUser ? primaryAccent : branding.textMuted, marginBottom: '4px' }}>
          {isUser ? 'Du' : 'Interviewer'}
        </div>
        <p style={{ fontSize: '14px', color: branding.textMain, lineHeight: 1.6, margin: 0 }}>{entry.text || entry.message}</p>
      </div>
    </div>
  );
};

/**
 * Expandable answer card for simulator sessions
 */
const AnswerCard = ({ answer, index, primaryAccent, branding }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const feedback = answer.feedback ? (typeof answer.feedback === 'string' ? JSON.parse(answer.feedback) : answer.feedback) : null;
  const audioMetrics = answer.audio_analysis ? (typeof answer.audio_analysis === 'string' ? JSON.parse(answer.audio_analysis) : answer.audio_analysis) : null;

  // Check if no speech was detected
  const isNoSpeech = answer.transcript === '[Keine Sprache erkannt]' || audioMetrics?.speech_rate === 'keine_sprache';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      style={{ background: '#fff', borderRadius: '16px', border: `1px solid ${branding.borderColor}`, overflow: 'hidden', marginBottom: '16px' }}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ width: '100%', padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left', overflow: 'hidden' }}
      >
        <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: `${primaryAccent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: primaryAccent, fontWeight: 700, fontSize: '14px', flexShrink: 0 }}>
          {index + 1}
        </div>
        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 600, color: branding.textMain, margin: 0, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {answer.question_text || `Frage ${index + 1}`}
          </h4>
        </div>
        {answer.overall_score !== null && answer.overall_score !== undefined && (
          <span style={{ fontSize: '16px', fontWeight: 700, color: isNoSpeech ? branding.textMuted : getScoreColor(answer.overall_score * 10, primaryAccent) }}>
            {isNoSpeech ? '–' : `${Math.round(answer.overall_score * 10)}%`}
          </span>
        )}
        <ChevronDown size={18} color={branding.textMuted} style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
            <div style={{ padding: '0 20px 20px', borderTop: `1px solid ${branding.borderColor}`, paddingTop: '16px' }}>
              {/* Full Question/Situation Text */}
              {answer.question_text && (
                <div style={{ marginBottom: '16px' }}>
                  <h5 style={{ fontSize: '13px', fontWeight: 600, color: branding.textMain, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MessageSquare size={14} color={primaryAccent} /> Frage / Situation
                  </h5>
                  <p style={{
                    fontSize: '14px',
                    color: branding.textMain,
                    lineHeight: 1.6,
                    background: `${primaryAccent}08`,
                    padding: '12px 16px',
                    borderRadius: '10px',
                    margin: 0,
                    border: `1px solid ${primaryAccent}20`,
                  }}>
                    {answer.question_text}
                  </p>
                </div>
              )}

              {/* Audio Player */}
              {answer.audio_url && (
                <div style={{ marginBottom: '16px' }}>
                  <h5 style={{ fontSize: '13px', fontWeight: 600, color: branding.textMain, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Mic size={14} color={primaryAccent} /> Deine Aufnahme
                  </h5>
                  <AudioPlayer audioUrl={answer.audio_url} primaryAccent={primaryAccent} durationHint={answer.audio_duration_seconds} branding={branding} />
                </div>
              )}

              {/* Transcript */}
              {answer.transcript && (
                <div style={{ marginBottom: '16px' }}>
                  <h5 style={{ fontSize: '13px', fontWeight: 600, color: branding.textMain, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileText size={14} color={primaryAccent} /> Transkript
                  </h5>
                  <p style={{
                    fontSize: '13px',
                    color: isNoSpeech ? branding.textMuted : branding.textSecondary,
                    lineHeight: 1.6,
                    background: branding.cardBgHover,
                    padding: '12px 16px',
                    borderRadius: '10px',
                    margin: 0,
                    fontStyle: 'italic',
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                  }}>
                    "{answer.transcript}"
                  </p>
                </div>
              )}

              {/* Scores Grid - nur anzeigen wenn Sprache erkannt wurde */}
              {feedback?.scores && !isNoSpeech && (
                <div style={{ marginBottom: '16px' }}>
                  <h5 style={{ fontSize: '13px', fontWeight: 600, color: branding.textMain, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Star size={14} color={primaryAccent} /> Bewertung
                  </h5>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                    {[
                      { key: 'content', label: 'Inhalt' },
                      { key: 'structure', label: 'Struktur' },
                      { key: 'relevance', label: 'Relevanz' },
                      { key: 'delivery', label: 'Präsentation' },
                      { key: 'overall', label: 'Gesamt' },
                    ].map(({ key, label }) => {
                      const rawScore = feedback.scores[key];
                      // Convert from scale of 10 to scale of 100
                      const score = rawScore != null ? rawScore * 10 : null;
                      return (
                        <div key={key} style={{
                          padding: '10px 8px',
                          background: key === 'overall' ? `${primaryAccent}15` : branding.cardBgHover,
                          borderRadius: '8px',
                          textAlign: 'center',
                          border: key === 'overall' ? `1px solid ${primaryAccent}30` : 'none',
                        }}>
                          <div style={{
                            fontSize: '16px',
                            fontWeight: 700,
                            color: score != null ? getScoreColor(score, primaryAccent) : branding.textMuted,
                          }}>
                            {score != null ? Math.round(score) : '-'}
                          </div>
                          <div style={{ fontSize: '10px', color: branding.textMuted, marginTop: '2px' }}>
                            {label}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Summary */}
              {feedback?.summary && <p style={{ fontSize: '13px', color: branding.textSecondary, lineHeight: 1.5, marginBottom: '12px' }}>{feedback.summary}</p>}

              {/* Strengths */}
              {feedback?.strengths?.length > 0 && !isNoSpeech && (
                <div style={{ marginBottom: '12px' }}>
                  <h6 style={{ fontSize: '12px', fontWeight: 600, color: branding.success, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle size={12} /> Stärken
                  </h6>
                  <ul style={{ margin: 0, paddingLeft: '18px', color: branding.textSecondary, fontSize: '12px' }}>
                    {feedback.strengths.map((s, i) => <li key={i} style={{ marginBottom: '4px' }}>{s}</li>)}
                  </ul>
                </div>
              )}

              {/* Improvements */}
              {feedback?.improvements?.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <h6 style={{ fontSize: '12px', fontWeight: 600, color: branding.warning, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertCircle size={12} /> Verbesserungspotenzial
                  </h6>
                  <ul style={{ margin: 0, paddingLeft: '18px', color: branding.textSecondary, fontSize: '12px' }}>
                    {feedback.improvements.map((s, i) => <li key={i} style={{ marginBottom: '4px' }}>{s}</li>)}
                  </ul>
                </div>
              )}

              {/* Tips */}
              {feedback?.tips?.length > 0 && !isNoSpeech && (
                <div style={{ marginBottom: '12px' }}>
                  <h6 style={{ fontSize: '12px', fontWeight: 600, color: primaryAccent, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Lightbulb size={12} /> Tipps
                  </h6>
                  <ul style={{ margin: 0, paddingLeft: '18px', color: branding.textSecondary, fontSize: '12px' }}>
                    {feedback.tips.map((s, i) => <li key={i} style={{ marginBottom: '4px' }}>{s}</li>)}
                  </ul>
                </div>
              )}

              {/* Audio Metrics - nur anzeigen wenn Sprache erkannt wurde */}
              {audioMetrics && !isNoSpeech && (
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${branding.borderColor}` }}>
                  <h5 style={{ fontSize: '13px', fontWeight: 600, color: branding.textMain, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Mic size={14} color={primaryAccent} /> Sprechanalyse
                  </h5>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                    {/* Speech Rate */}
                    {audioMetrics.speech_rate && (
                      <div style={{ padding: '12px', background: branding.cardBgHover, borderRadius: '10px' }}>
                        <div style={{ fontSize: '11px', color: branding.textMuted, marginBottom: '4px' }}>Sprechtempo</div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: branding.textMain, textTransform: 'capitalize' }}>
                          {audioMetrics.speech_rate === 'optimal' ? '✓ Optimal' : audioMetrics.speech_rate === 'zu_schnell' ? '⚡ Zu schnell' : audioMetrics.speech_rate === 'zu_langsam' ? '🐢 Zu langsam' : audioMetrics.speech_rate}
                        </div>
                      </div>
                    )}

                    {/* Filler Words */}
                    {audioMetrics.filler_words && (
                      <div style={{ padding: '12px', background: branding.cardBgHover, borderRadius: '10px' }}>
                        <div style={{ fontSize: '11px', color: branding.textMuted, marginBottom: '4px' }}>Füllwörter</div>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: 600,
                          color: audioMetrics.filler_words.count <= 2 ? branding.success : audioMetrics.filler_words.count <= 5 ? branding.warning : branding.error
                        }}>
                          {audioMetrics.filler_words.count || 0} erkannt
                        </div>
                        {audioMetrics.filler_words.words?.length > 0 && (
                          <div style={{ fontSize: '11px', color: branding.textMuted, marginTop: '4px' }}>
                            {audioMetrics.filler_words.words.slice(0, 5).join(', ')}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Confidence Score */}
                    {audioMetrics.confidence_score != null && (
                      <div style={{ padding: '12px', background: branding.cardBgHover, borderRadius: '10px' }}>
                        <div style={{ fontSize: '11px', color: branding.textMuted, marginBottom: '4px' }}>Selbstsicherheit</div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: getScoreColor(audioMetrics.confidence_score, primaryAccent) }}>
                          {audioMetrics.confidence_score}%
                        </div>
                      </div>
                    )}

                    {/* Clarity Score */}
                    {audioMetrics.clarity_score != null && (
                      <div style={{ padding: '12px', background: branding.cardBgHover, borderRadius: '10px' }}>
                        <div style={{ fontSize: '11px', color: branding.textMuted, marginBottom: '4px' }}>Klarheit</div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: getScoreColor(audioMetrics.clarity_score, primaryAccent) }}>
                          {audioMetrics.clarity_score}%
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {audioMetrics.notes && (
                    <p style={{ fontSize: '12px', color: branding.textMuted, marginTop: '10px', fontStyle: 'italic' }}>
                      {audioMetrics.notes}
                    </p>
                  )}
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
 * Delete confirmation dialog
 */
const DeleteConfirmDialog = ({ isOpen, onClose, onConfirm, isDeleting, primaryAccent, branding }) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '24px',
          maxWidth: '400px',
          width: '90%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: branding.errorLight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Trash2 size={24} color={branding.error} />
          </div>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: branding.textMain, margin: 0 }}>
              Session löschen?
            </h3>
          </div>
        </div>

        <p style={{ fontSize: '14px', color: branding.textSecondary, lineHeight: 1.6, marginBottom: '24px' }}>
          Möchtest du diese Session wirklich löschen? Alle Antworten und Feedback werden unwiderruflich entfernt.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            disabled={isDeleting}
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              border: `1px solid ${branding.disabledBg}`,
              backgroundColor: 'white',
              color: branding.textMain,
              fontSize: '14px',
              fontWeight: 500,
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              opacity: isDeleting ? 0.5 : 1,
              outline: 'none',
              WebkitAppearance: 'none',
            }}
          >
            Abbrechen
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: branding.error,
              color: 'white',
              fontSize: '14px',
              fontWeight: 500,
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: isDeleting ? 0.7 : 1,
              outline: 'none',
              WebkitAppearance: 'none',
            }}
          >
            {isDeleting ? (
              <>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                Löschen...
              </>
            ) : (
              <>
                <Trash2 size={16} />
                Löschen
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

/**
 * Category score card for video training
 */
const CategoryScoreCard = ({ category, primaryAccent, branding }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const IconComponent = CATEGORY_ICONS[category.category] || Star;
  const color = getScoreColor(category.score, primaryAccent);

  return (
    <div style={{ background: '#fff', borderRadius: '12px', border: `1px solid ${branding.borderColor}`, overflow: 'hidden', marginBottom: '10px' }}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ width: '100%', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}
      >
        <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconComponent size={18} color={color} />
        </div>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 600, color: branding.textMain, margin: 0 }}>{category.label}</h4>
        </div>
        <span style={{ fontSize: '16px', fontWeight: 700, color }}>{Math.round(category.score)}%</span>
        <ChevronDown size={18} color={branding.textMuted} style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
            <div style={{ padding: '0 16px 16px', borderTop: `1px solid ${branding.borderColor}`, paddingTop: '12px' }}>
              {category.feedback && <p style={{ fontSize: '13px', color: branding.textSecondary, lineHeight: 1.5, marginBottom: '10px' }}>{category.feedback}</p>}
              {category.strengths?.length > 0 && (
                <div style={{ marginBottom: '10px' }}>
                  <h6 style={{ fontSize: '12px', fontWeight: 600, color: branding.success, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={12} /> Stärken</h6>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: branding.textSecondary }}>{category.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
                </div>
              )}
              {category.improvements?.length > 0 && (
                <div>
                  <h6 style={{ fontSize: '12px', fontWeight: 600, color: branding.warning, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><Lightbulb size={12} /> Tipps</h6>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: branding.textSecondary }}>{category.improvements.map((s, i) => <li key={i}>{s}</li>)}</ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const TrainingSessionDetailView = ({ session, type, scenario, onBack, onContinueSession, onRepeatSession, onDeleteSession }) => {
  // Partner theming via useBranding hook
  const b = useBranding();
  const isMobile = useMobile();
  // Tablet detection: between 768px and 1024px, or use single column for screens < 1024px
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkTablet = () => {
      const width = window.innerWidth;
      setIsTablet(width >= 768 && width < 1200);
    };
    checkTablet();
    window.addEventListener('resize', checkTablet);
    return () => window.removeEventListener('resize', checkTablet);
  }, []);

  const headerGradient = b.headerGradient;
  const primaryAccent = b.primaryAccent;

  const [answers, setAnswers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // PDF download state
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Roleplay-specific state
  const [roleplayData, setRoleplayData] = useState(null);
  const [roleplayScenario, setRoleplayScenario] = useState(scenario);

  const isVideo = type === 'video';
  const isSimulator = type === 'simulator';
  const isRoleplay = type === 'roleplay';

  // Check if session has questions (handle both field names and formats)
  const hasQuestions = (() => {
    // API returns 'questions', database stores 'questions_json'
    const questionsData = session?.questions || session?.questions_json;
    if (!questionsData) return false;
    try {
      const questions = typeof questionsData === 'string'
        ? JSON.parse(questionsData)
        : questionsData;
      return Array.isArray(questions) && questions.length > 0;
    } catch {
      return false;
    }
  })();

  // Check if session is resumable (has unanswered questions, regardless of status)
  const isResumable = (() => {
    if (!isSimulator || !hasQuestions) return false;
    const totalQuestions = session?.total_questions || 0;
    const completedQuestions = session?.completed_questions || 0;
    return totalQuestions > 0 && completedQuestions < totalQuestions;
  })();

  // Handle delete session
  const handleDeleteSession = async () => {
    if (!onDeleteSession) return;

    setIsDeleting(true);
    try {
      await onDeleteSession(session, type);
      // onDeleteSession should handle navigation back
    } catch (err) {
      console.error('Failed to delete session:', err);
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Handle PDF download
  const handleDownloadPdf = async () => {
    if (isDownloadingPdf || !session?.id) return;

    setIsDownloadingPdf(true);
    try {
      // Determine endpoint based on session type
      let endpoint;
      if (isSimulator) {
        endpoint = `${getWPApiUrl()}/simulator/sessions/${session.id}/export-pdf`;
      } else if (isVideo) {
        endpoint = `${getWPApiUrl()}/video-training/sessions/${session.id}/export-pdf`;
      } else if (isRoleplay) {
        endpoint = `${getWPApiUrl()}/sessions/${session.id}/export-pdf`;
      } else {
        throw new Error('Unsupported session type for PDF export');
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'X-WP-Nonce': getWPNonce(),
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
      });

      // Always try to parse JSON response to get error message
      const data = await response.json();

      if (!response.ok) {
        console.error('[PDF] Server error response:', data);
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      if (!data.success || !data.pdf_base64) {
        console.error('[PDF] Invalid response data:', data);
        throw new Error(data.error || 'PDF generation failed');
      }

      // Convert base64 to blob
      const byteCharacters = atob(data.pdf_base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: data.content_type || 'application/pdf' });

      // Trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = data.filename || 'Training.pdf';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download PDF:', err);
      // Could show a toast notification here
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Load data based on session type
  useEffect(() => {
    if (isSimulator && session?.id) {
      loadSimulatorAnswers();
    } else if (isRoleplay && session?.id) {
      loadRoleplayData();
    } else {
      setIsLoading(false);
    }
  }, [session?.id, type]);

  const loadSimulatorAnswers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${getWPApiUrl()}/simulator/sessions/${session.id}/answers`, {
        headers: { 'X-WP-Nonce': getWPNonce() },
      });
      const data = await response.json();
      if (data.success && data.data?.answers) setAnswers(data.data.answers);
      else if (Array.isArray(data.data)) setAnswers(data.data);
    } catch (err) {
      console.error('Failed to load answers:', err);
      setError('Fehler beim Laden der Antworten');
    } finally {
      setIsLoading(false);
    }
  };

  const loadRoleplayData = async () => {
    try {
      setIsLoading(true);
      const fullSession = await getRoleplaySessionAnalysis(session.id);
      setRoleplayData({
        ...session,
        ...fullSession,
        feedback: parseFeedbackJSON(fullSession.feedback_json || session.feedback_json),
        audioAnalysis: parseAudioAnalysisJSON(fullSession.audio_analysis_json || session.audio_analysis_json),
        transcript: parseTranscriptJSON(fullSession.transcript || session.transcript),
      });

      // Load scenario if not provided
      if (!scenario && fullSession.scenario_id) {
        try {
          const scenarioData = await getRoleplayScenario(fullSession.scenario_id);
          setRoleplayScenario(scenarioData);
        } catch (e) { console.warn('Could not load scenario:', e); }
      }
    } catch (err) {
      console.error('Failed to load roleplay data:', err);
      setError('Fehler beim Laden der Gesprächsdaten');
    } finally {
      setIsLoading(false);
    }
  };

  // Parse session data
  const summaryFeedback = session?.summary_feedback_json
    ? (typeof session.summary_feedback_json === 'string' ? JSON.parse(session.summary_feedback_json) : session.summary_feedback_json)
    : null;

  const categoryScores = session?.category_scores || [];
  const analysis = session?.analysis || {};

  // Get overall score based on type - ALWAYS return on scale of 100
  const getOverallScore = () => {
    let rawScore = 0;

    if (isRoleplay && roleplayData?.feedback?.rating?.overall) {
      rawScore = roleplayData.feedback.rating.overall;
    } else {
      rawScore = session?.overall_score || summaryFeedback?.overall_score || 0;
    }

    // Convert from scale of 10 to scale of 100 for Simulator and Roleplay
    if ((isSimulator || isRoleplay) && rawScore <= 10) {
      return rawScore * 10;
    }

    return rawScore;
  };

  const overallScore = getOverallScore();

  // Loading state
  if (isLoading) {
    return (
      <div style={{ width: '100%', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={48} color={primaryAccent} style={{ animation: 'spin 1s linear infinite', display: 'block', margin: '0 auto' }} />
          <p style={{ color: b.textMuted, marginTop: '16px' }}>Analyse wird geladen...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px', padding: '24px' }}>
          <AlertCircle size={48} color={b.error} style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: b.textMain, marginBottom: '8px' }}>Fehler beim Laden</h2>
          <p style={{ color: b.textSecondary, marginBottom: '24px' }}>{error}</p>
          <button onClick={onBack} style={{ padding: '12px 24px', borderRadius: '10px', background: b.cardBgHover, border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>
            Zurück
          </button>
        </div>
      </div>
    );
  }

  const TypeIcon = getTypeIcon(type);

  return (
    <div style={{ minHeight: '100vh', background: b.pageBg, overflow: 'hidden', maxWidth: '100vw' }}>
      {/* Header - Full width sticky */}
      <div style={{
        background: headerGradient,
        padding: isMobile ? '20px 16px' : '24px 32px',
        position: 'sticky',
        top: 0,
        zIndex: 40,
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
            alignItems: 'center',
            gap: '24px',
          }}>
            {/* Score Gauge - Hidden on mobile */}
            {!isMobile && (
              <ScoreGauge score={overallScore} size={100} primaryAccent={primaryAccent} isHeader branding={b} />
            )}

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
                  {getTypeLabel(type)}
                </span>
                <span style={{
                  fontSize: '12px',
                  fontWeight: 500,
                  padding: '4px 10px',
                  borderRadius: '20px',
                  background: 'rgba(255,255,255,0.9)',
                  color: getScoreColor(overallScore, primaryAccent),
                }}>
                  {getGradeLabel(overallScore, 100)}
                </span>
              </div>
              <h1 style={{
                fontSize: isMobile ? '20px' : '24px',
                fontWeight: 700,
                color: '#fff',
                margin: 0,
                marginBottom: '8px',
              }}>
                {(isRoleplay ? roleplayScenario?.title : scenario?.title) || session?.scenario_title || session?.position || 'Training'}
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

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              {/* PDF Download Button */}
              <button
                onClick={handleDownloadPdf}
                disabled={isDownloadingPdf}
                title="Als PDF herunterladen"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(255,255,255,0.2)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  cursor: isDownloadingPdf ? 'wait' : 'pointer',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 500,
                  outline: 'none',
                  WebkitAppearance: 'none',
                  opacity: isDownloadingPdf ? 0.7 : 1,
                }}
              >
                {isDownloadingPdf ? (
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <Download size={16} />
                )}
              </button>
              {/* Repeat Button - Desktop only */}
              {!isMobile && onRepeatSession && (
                <button
                  onClick={() => onRepeatSession(session, scenario)}
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
                    outline: 'none',
                    WebkitAppearance: 'none',
                  }}
                >
                  <RotateCcw size={16} />
                  Erneut üben
                </button>
              )}
              {/* Delete Button - for all session types, mobile and desktop */}
              {onDeleteSession && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'rgba(239,68,68,0.2)',
                    border: '1px solid rgba(239,68,68,0.4)',
                    borderRadius: '10px',
                    padding: isMobile ? '10px 12px' : '10px 16px',
                    cursor: 'pointer',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 500,
                    outline: 'none',
                    WebkitAppearance: 'none',
                  }}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: isMobile ? '16px' : '24px 32px',
        overflow: 'hidden',
      }}>
        {/* Two-column layout - single column on mobile and tablet */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: (isMobile || isTablet) ? '1fr' : '1fr 400px',
          gap: '24px',
          overflow: 'hidden',
        }}>
          {/* LEFT COLUMN - Media */}
          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            {/* Video Player */}
          {isVideo && session?.video_url && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: `1px solid ${b.borderColor}`, marginBottom: '20px' }}
            >
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: b.textMain, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Video size={18} color={primaryAccent} /> Deine Aufnahme
              </h3>
              <video
                src={session.video_url}
                controls
                style={{
                  width: '100%',
                  maxWidth: '640px',
                  maxHeight: '360px',
                  borderRadius: '12px',
                  background: '#000',
                  objectFit: 'contain',
                }}
              />
            </motion.div>
          )}

          {/* Simulator Answers */}
          {isSimulator && answers.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: b.textMain, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare size={18} color={primaryAccent} /> Deine Antworten ({answers.length})
              </h3>
              {answers.map((answer, index) => (
                <AnswerCard key={answer.id || index} answer={answer} index={index} primaryAccent={primaryAccent} branding={b} />
              ))}

              {/* Action Buttons for resumable sessions with answers */}
              {isResumable && (onContinueSession || onRepeatSession) && (
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                  marginTop: '24px',
                  padding: '20px',
                  background: b.cardBgHover,
                  borderRadius: '12px',
                  border: `1px dashed ${b.disabledBg}`,
                }}>
                  <p style={{ width: '100%', textAlign: 'center', color: b.textSecondary, fontSize: '14px', marginBottom: '12px' }}>
                    Diese Session ist noch nicht abgeschlossen.
                  </p>
                  {onContinueSession && (
                    <button
                      onClick={() => onContinueSession(session, scenario)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 24px',
                        borderRadius: '12px',
                        border: 'none',
                        background: primaryAccent,
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        boxShadow: `0 4px 12px ${primaryAccent}4d`,
                      }}
                    >
                      <PlayCircle size={18} />
                      Fortsetzen
                    </button>
                  )}
                  {onRepeatSession && (
                    <button
                      onClick={() => onRepeatSession(session, scenario)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 24px',
                        borderRadius: '12px',
                        border: `2px solid ${b.disabledBg}`,
                        background: 'white',
                        color: b.textMain,
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <RotateCcw size={18} />
                      Erneut starten
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* Empty state for simulator */}
          {isSimulator && answers.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 24px', background: b.cardBgHover, borderRadius: '16px' }}>
              <AlertCircle size={48} color={b.textMuted} style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: b.textMain, marginBottom: '8px' }}>Keine Antworten vorhanden</h3>
              <p style={{ color: b.textMuted, marginBottom: hasQuestions ? '24px' : '0' }}>
                {hasQuestions
                  ? 'Diese Session wurde nicht abgeschlossen. Du kannst sie fortsetzen oder erneut starten.'
                  : 'Diese Session wurde verlassen, bevor Fragen generiert wurden.'}
              </p>

              {/* Action Buttons - only show if session is resumable */}
              {isResumable && (onContinueSession || onRepeatSession) && (
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '24px' }}>
                  {onContinueSession && (
                    <button
                      onClick={() => onContinueSession(session, scenario)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 24px',
                        borderRadius: '12px',
                        border: 'none',
                        background: primaryAccent,
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        boxShadow: `0 4px 12px ${primaryAccent}4d`,
                      }}
                    >
                      <PlayCircle size={18} />
                      Fortsetzen
                    </button>
                  )}
                  {onRepeatSession && (
                    <button
                      onClick={() => onRepeatSession(session, scenario)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 24px',
                        borderRadius: '12px',
                        border: `2px solid ${b.disabledBg}`,
                        background: 'white',
                        color: b.textMain,
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <RotateCcw size={18} />
                      Erneut starten
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Roleplay Audio Player */}
          {isRoleplay && roleplayData && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ marginBottom: '20px' }}>
              <RoleplayAudioPlayer sessionId={session.id} conversationId={roleplayData.conversation_id} primaryAccent={primaryAccent} branding={b} />
            </motion.div>
          )}

          {/* Roleplay Transcript */}
          {isRoleplay && roleplayData?.transcript?.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: `1px solid ${b.borderColor}` }}
            >
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: b.textMain, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color={primaryAccent} /> Gesprächsverlauf
              </h3>
              <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                {roleplayData.transcript.map((entry, index) => (
                  <TranscriptEntry key={index} entry={entry} index={index} primaryAccent={primaryAccent} branding={b} />
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* RIGHT COLUMN - Analysis */}
        <div style={{ minWidth: 0, overflow: 'hidden' }}>
          {/* Category Scores (Video) */}
          {isVideo && categoryScores.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: b.textMain, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Star size={16} color={primaryAccent} /> Detaillierte Bewertung
              </h3>
              {categoryScores.map((category, index) => (
                <CategoryScoreCard key={category.category || index} category={category} primaryAccent={primaryAccent} branding={b} />
              ))}
            </motion.div>
          )}

          {/* Analysis Details (Video) */}
          {isVideo && (analysis.key_strengths?.length > 0 || analysis.actionable_tips?.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: `1px solid ${b.borderColor}`, marginBottom: '20px' }}
            >
              {analysis.key_strengths?.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: b.success, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle size={16} /> Deine Stärken
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    {analysis.key_strengths.map((item, i) => (
                      <li key={i} style={{ fontSize: '13px', color: b.textSecondary, marginBottom: '6px', lineHeight: 1.4 }}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {analysis.actionable_tips?.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: primaryAccent, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Lightbulb size={16} /> Tipps zur Verbesserung
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    {analysis.actionable_tips.map((item, i) => (
                      <li key={i} style={{ fontSize: '13px', color: b.textSecondary, marginBottom: '6px', lineHeight: 1.4 }}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          )}

          {/* Summary (Video) */}
          {isVideo && session?.summary_feedback && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              style={{ background: b.cardBgHover, borderRadius: '16px', padding: '20px' }}
            >
              <h4 style={{ fontSize: '14px', fontWeight: 600, color: b.textMain, marginBottom: '10px' }}>Zusammenfassung</h4>
              <p style={{ fontSize: '13px', color: b.textSecondary, lineHeight: 1.6, margin: 0 }}>{session.summary_feedback}</p>
            </motion.div>
          )}

          {/* Simulator Summary */}
          {isSimulator && summaryFeedback && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              {summaryFeedback.summary && (
                <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: `1px solid ${b.borderColor}`, marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: b.textMain, marginBottom: '10px' }}>Zusammenfassung</h4>
                  <p style={{ fontSize: '13px', color: b.textSecondary, lineHeight: 1.6, margin: 0 }}>{summaryFeedback.summary}</p>
                </div>
              )}

              {summaryFeedback.scores && (
                <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: `1px solid ${b.borderColor}`, marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: b.textMain, marginBottom: '12px' }}>Bewertung</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                    {Object.entries(summaryFeedback.scores).map(([key, value]) => {
                      // Convert from scale of 10 to scale of 100
                      const score100 = value != null ? value * 10 : null;
                      return (
                        <div key={key} style={{ padding: '12px', background: b.cardBgHover, borderRadius: '10px', textAlign: 'center' }}>
                          <div style={{ fontSize: '20px', fontWeight: 700, color: getScoreColor(score100, primaryAccent) }}>{score100 != null ? Math.round(score100) : '-'}</div>
                          <div style={{ fontSize: '11px', color: b.textMuted, textTransform: 'capitalize' }}>{key}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {summaryFeedback.key_takeaways?.length > 0 && (
                <div style={{ background: b.successLight, borderRadius: '16px', padding: '20px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: b.success, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Lightbulb size={16} /> Wichtigste Erkenntnisse
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: b.textMain, lineHeight: 1.5 }}>
                    {summaryFeedback.key_takeaways.map((t, i) => <li key={i} style={{ marginBottom: '6px' }}>{t}</li>)}
                  </ul>
                </div>
              )}
            </motion.div>
          )}

          {/* Roleplay Feedback */}
          {isRoleplay && roleplayData?.feedback && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              {/* Rating Scores */}
              {roleplayData.feedback.rating && (
                <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: `1px solid ${b.borderColor}`, marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, color: b.textMain, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Star size={16} color={primaryAccent} /> Bewertungskriterien
                  </h4>
                  <div style={{ display: 'grid', gap: '10px' }}>
                    {Object.entries(roleplayData.feedback.rating)
                      .filter(([key]) => key !== 'overall')
                      .map(([key, value]) => {
                        // Convert from scale of 10 to scale of 100
                        const score100 = value * 10;
                        return (
                          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: b.cardBgHover, borderRadius: '10px' }}>
                            <div style={{ flex: 1, fontSize: '13px', fontWeight: 500, color: b.textMain, textTransform: 'capitalize' }}>
                              {key.replace(/_/g, ' ')}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ width: '80px', height: '6px', background: b.borderColor, borderRadius: '3px' }}>
                                <div style={{ width: `${score100}%`, height: '100%', background: getScoreColor(score100, primaryAccent), borderRadius: '3px' }} />
                              </div>
                              <span style={{ fontSize: '14px', fontWeight: 600, color: getScoreColor(score100, primaryAccent), minWidth: '45px' }}>
                                {Math.round(score100)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Strengths */}
              {roleplayData.feedback.strengths?.length > 0 && (
                <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: `1px solid ${b.borderColor}`, marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: b.success, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle size={16} /> Deine Stärken
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    {roleplayData.feedback.strengths.map((item, i) => (
                      <li key={i} style={{ fontSize: '13px', color: b.textSecondary, marginBottom: '8px', lineHeight: 1.5 }}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Improvements */}
              {roleplayData.feedback.improvements?.length > 0 && (
                <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: `1px solid ${b.borderColor}`, marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: b.warning, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Lightbulb size={16} /> Verbesserungspotenzial
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    {roleplayData.feedback.improvements.map((item, i) => (
                      <li key={i} style={{ fontSize: '13px', color: b.textSecondary, marginBottom: '8px', lineHeight: 1.5 }}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Summary */}
              {roleplayData.feedback.summary && (
                <div style={{ background: b.cardBgHover, borderRadius: '16px', padding: '20px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: b.textMain, marginBottom: '10px' }}>Zusammenfassung</h4>
                  <p style={{ fontSize: '13px', color: b.textSecondary, lineHeight: 1.6, margin: 0 }}>{roleplayData.feedback.summary}</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Roleplay Empty State */}
          {isRoleplay && !roleplayData?.feedback && (
            <div style={{ background: b.cardBgHover, borderRadius: '16px', padding: '24px', textAlign: 'center' }}>
              <AlertCircle size={32} color={b.textMuted} style={{ margin: '0 auto 12px' }} />
              <p style={{ fontSize: '14px', color: b.textMuted, margin: 0 }}>
                Keine Analyse verfügbar für dieses Gespräch.
              </p>
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteSession}
        isDeleting={isDeleting}
        primaryAccent={primaryAccent}
        branding={b}
      />
    </div>
  );
};

export default TrainingSessionDetailView;
