/**
 * TrainingSessionDetailView Component
 *
 * Unified detail view for Simulator and Video Training sessions.
 * Two-column layout: Media (left) + Analysis (right)
 * Responsive: stacks vertically on mobile
 *
 * Migrated to Tailwind CSS for consistent styling.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  SkipForward,
  Volume2,
  VolumeX,
  Trash2,
  Download,
  RotateCcw,
  PlayCircle,
} from 'lucide-react';
import { usePartner } from '@/context/PartnerContext';
import { useMobile } from '@/hooks/useMobile';
import { COLORS, getScoreColor } from '@/config/colors';
import { getRoleplaySessionAnalysis, getRoleplaySessionAudioUrl, getRoleplayScenario } from '@/services/roleplay-feedback-adapter';
import { parseFeedbackJSON, parseAudioAnalysisJSON, parseTranscriptJSON } from '@/utils/parseJSON';
import { getWPNonce, getWPApiUrl } from '@/services/wordpress-api';
import { Button, Card } from '@/components/ui';
import AudioAnalysisPanel from '@/components/feedback/AudioAnalysisPanel';
import { normalizeAudioMetrics, hasAudioMetricsData } from '@/utils/audioMetricsAdapter';

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
 */
const ScoreGauge = ({ score, size = 120, isHeader = false }) => {
  const percentage = Math.min(100, Math.max(0, score || 0));
  const radius = (size - 12) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;
  const color = getScoreColor(score);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={isHeader ? 'rgba(255,255,255,0.3)' : COLORS.slate[200]}
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
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span style={{ fontSize: size / 3.5, fontWeight: 700, color }}>
          {Math.round(score)}
        </span>
        <span className={`${isHeader ? 'text-white' : 'text-slate-500'}`} style={{ fontSize: size / 10 }}>
          von 100
        </span>
      </div>
    </div>
  );
};

/**
 * Audio player for individual answers
 */
const AudioPlayer = ({ audioUrl, durationHint }) => {
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
    setDuration(durationHint || 0);

    const audio = new Audio();
    audioRef.current = audio;

    const handleLoadedMetadata = () => {
      const dur = audio.duration;
      if (dur && isFinite(dur) && dur > 0) setDuration(dur);
      setIsLoading(false);
    };

    const handleDurationChange = () => {
      const dur = audio.duration;
      if (dur && isFinite(dur) && dur > 0) setDuration(dur);
    };

    const handleCanPlayThrough = () => {
      setIsLoading(false);
      const dur = audio.duration;
      if (dur && isFinite(dur) && dur > 0) setDuration(dur);
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
      <div className="p-3 bg-slate-50 rounded-lg text-slate-500 text-[13px] flex items-center gap-2">
        <AlertCircle size={16} /> {error}
      </div>
    );
  }

  if (!audioUrl) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <Card className="p-5">
      {/* Progress bar */}
      <div onClick={handleSeek} className="h-2 bg-slate-200 rounded cursor-pointer mb-4">
        <div
          className="h-full bg-primary rounded transition-all duration-100"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <button onClick={() => skip(-10)} className="p-2 bg-transparent border-none cursor-pointer text-slate-400 hover:text-slate-600">
          <SkipBack size={20} />
        </button>
        <button
          onClick={togglePlay}
          disabled={isLoading}
          className={`w-12 h-12 rounded-full bg-primary border-none flex items-center justify-center text-white ${isLoading ? 'cursor-wait opacity-70' : 'cursor-pointer'}`}
        >
          {isLoading ? (
            <Loader2 size={22} className="animate-spin" />
          ) : isPlaying ? (
            <Pause size={22} fill="white" />
          ) : (
            <Play size={22} fill="white" className="ml-0.5" />
          )}
        </button>
        <button onClick={() => skip(10)} className="p-2 bg-transparent border-none cursor-pointer text-slate-400 hover:text-slate-600">
          <SkipForward size={20} />
        </button>
      </div>
      {/* Time display */}
      <div className="text-center mt-2 text-[13px] text-slate-500">
        {formatDuration(currentTime)} / {formatDuration(duration)}
      </div>
    </Card>
  );
};

/**
 * Roleplay Audio Player - Full session audio player
 */
const RoleplayAudioPlayer = ({ sessionId, conversationId }) => {
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
      <div className="bg-slate-50 rounded-2xl p-6 text-center">
        <Loader2 size={24} className="text-primary animate-spin mx-auto" />
        <p className="text-[13px] text-slate-500 mt-2">Audio wird geladen...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-50 rounded-2xl p-6 text-center">
        <AlertCircle size={24} className="text-slate-400 mx-auto" />
        <p className="text-[13px] text-slate-500 mt-2">{error}</p>
      </div>
    );
  }

  return (
    <Card className="p-5">
      <h3 className="text-[15px] font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <Mic size={18} className="text-primary" /> Gesprächsaufnahme
      </h3>
      {/* Progress bar */}
      <div onClick={handleSeek} className="h-2 bg-slate-200 rounded cursor-pointer mb-4">
        <div className="h-full bg-primary rounded transition-all duration-100" style={{ width: `${(currentTime / duration) * 100 || 0}%` }} />
      </div>
      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <button onClick={() => skip(-10)} className="p-2 bg-transparent border-none cursor-pointer text-slate-400 hover:text-slate-600">
          <SkipBack size={20} />
        </button>
        <button onClick={togglePlay} className="w-12 h-12 rounded-full bg-primary border-none cursor-pointer flex items-center justify-center text-white">
          {isPlaying ? <Pause size={22} fill="white" /> : <Play size={22} fill="white" className="ml-0.5" />}
        </button>
        <button onClick={() => skip(10)} className="p-2 bg-transparent border-none cursor-pointer text-slate-400 hover:text-slate-600">
          <SkipForward size={20} />
        </button>
        <button onClick={toggleMute} className="p-2 bg-transparent border-none cursor-pointer text-slate-400 hover:text-slate-600 ml-auto">
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
      </div>
      <div className="text-center mt-2 text-[13px] text-slate-500">
        {formatDuration(currentTime)} / {formatDuration(duration)}
      </div>
    </Card>
  );
};

/**
 * Transcript Entry Component for roleplay conversations
 */
const TranscriptEntry = ({ entry }) => {
  const isUser = entry.role === 'user';
  return (
    <div className="flex gap-3 mb-4">
      <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${isUser ? 'bg-primary' : 'bg-slate-200'}`}>
        <User size={16} className={isUser ? 'text-white' : 'text-slate-500'} />
      </div>
      <div className="flex-1">
        <div className={`text-xs font-semibold mb-1 ${isUser ? 'text-primary' : 'text-slate-400'}`}>
          {isUser ? 'Du' : 'Interviewer'}
        </div>
        <p className="text-sm text-slate-900 leading-relaxed m-0">{entry.text || entry.message}</p>
      </div>
    </div>
  );
};

/**
 * Collapsible Section for accordion functionality
 */
const CollapsibleSection = ({ title, icon: Icon, iconColor = 'text-primary', children, defaultOpen = true, className = '' }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`border border-slate-100 rounded-lg overflow-hidden ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2.5 bg-slate-50 border-none cursor-pointer flex items-center gap-2 text-left hover:bg-slate-100 transition-colors"
      >
        {Icon && <Icon size={14} className={iconColor} />}
        <span className="flex-1 text-[13px] font-semibold text-slate-900">{title}</span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-3">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * Expandable answer card for simulator sessions
 */
const AnswerCard = ({ answer, index }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const audioRef = useRef(null);
  const feedback = answer.feedback ? (typeof answer.feedback === 'string' ? JSON.parse(answer.feedback) : answer.feedback) : null;
  const audioMetrics = answer.audio_analysis ? (typeof answer.audio_analysis === 'string' ? JSON.parse(answer.audio_analysis) : answer.audio_analysis) : null;
  const isNoSpeech = answer.transcript === '[Keine Sprache erkannt]' || audioMetrics?.speech_rate === 'keine_sprache';

  // Normalize audio metrics for the professional panel
  const normalizedMetrics = useMemo(() => normalizeAudioMetrics(audioMetrics), [audioMetrics]);
  const showAudioAnalysis = hasAudioMetricsData(audioMetrics) && !isNoSpeech;

  // Handler to jump to timestamp in audio
  const handleJumpToTimestamp = (seconds) => {
    if (audioRef.current) {
      audioRef.current.currentTime = seconds;
      audioRef.current.play();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="mb-4 overflow-hidden p-0">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-4 bg-transparent border-none cursor-pointer flex items-center gap-3 text-left"
        >
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
            {index + 1}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-slate-900 m-0 truncate">
              {answer.question_text || `Frage ${index + 1}`}
            </h4>
          </div>
          {answer.overall_score != null && (
            <span className="text-base font-bold" style={{ color: isNoSpeech ? COLORS.slate[400] : getScoreColor(answer.overall_score * 10) }}>
              {isNoSpeech ? '–' : `${Math.round(answer.overall_score * 10)}%`}
            </span>
          )}
          <ChevronDown size={18} className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="px-4 pb-4 pt-3 border-t border-slate-100 flex flex-col gap-3">
                {/* Full Question */}
                {answer.question_text && (
                  <CollapsibleSection title="Frage / Situation" icon={MessageSquare} defaultOpen={false}>
                    <p className="text-sm text-slate-900 leading-relaxed bg-primary/5 p-3 rounded-lg m-0 border border-primary/10">
                      {answer.question_text}
                    </p>
                  </CollapsibleSection>
                )}

                {/* Audio Player */}
                {answer.audio_url && (
                  <CollapsibleSection title="Deine Aufnahme" icon={Mic} defaultOpen={true}>
                    <AudioPlayer audioUrl={answer.audio_url} durationHint={answer.audio_duration_seconds} />
                  </CollapsibleSection>
                )}

                {/* Transcript */}
                {answer.transcript && (
                  <CollapsibleSection title="Transkript" icon={FileText} defaultOpen={true}>
                    <p className={`text-[13px] leading-relaxed bg-slate-50 p-3 rounded-lg m-0 italic break-words ${isNoSpeech ? 'text-slate-400' : 'text-slate-600'}`}>
                      "{answer.transcript}"
                    </p>
                  </CollapsibleSection>
                )}

                {/* Scores Grid */}
                {feedback?.scores && !isNoSpeech && (
                  <CollapsibleSection title="Bewertung" icon={Star} defaultOpen={true}>
                    <div className="grid grid-cols-4 gap-2 mb-2">
                      {[
                        { key: 'content', label: 'Inhalt' },
                        { key: 'structure', label: 'Struktur' },
                        { key: 'relevance', label: 'Relevanz' },
                        { key: 'delivery', label: 'Präsentation' },
                      ].map(({ key, label }) => {
                        const rawScore = feedback.scores[key];
                        const score = rawScore != null ? rawScore * 10 : null;
                        return (
                          <div key={key} className="p-2.5 bg-slate-50 rounded-lg text-center">
                            <div className="text-base font-bold" style={{ color: score != null ? getScoreColor(score) : COLORS.slate[400] }}>
                              {score != null ? Math.round(score) : '-'}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">{label}</div>
                          </div>
                        );
                      })}
                    </div>
                    {/* Overall score */}
                    {(() => {
                      const rawScore = feedback.scores.overall;
                      const score = rawScore != null ? rawScore * 10 : null;
                      return (
                        <div className="p-3 bg-primary/10 rounded-lg text-center border border-primary/20 flex items-center justify-center gap-3">
                          <div className="text-[10px] text-slate-500">Gesamt</div>
                          <div className="text-xl font-bold" style={{ color: score != null ? getScoreColor(score) : COLORS.slate[400] }}>
                            {score != null ? Math.round(score) : '-'}
                          </div>
                        </div>
                      );
                    })()}
                    {/* Summary */}
                    {feedback?.summary && <p className="text-[13px] text-slate-600 leading-snug mt-3">{feedback.summary}</p>}
                  </CollapsibleSection>
                )}

                {/* Strengths */}
                {feedback?.strengths?.length > 0 && !isNoSpeech && (
                  <CollapsibleSection title="Stärken" icon={CheckCircle} iconColor="text-green-600" defaultOpen={true}>
                    <ul className="m-0 pl-4 text-slate-600 text-xs">
                      {feedback.strengths.map((s, i) => <li key={i} className="mb-1">{s}</li>)}
                    </ul>
                  </CollapsibleSection>
                )}

                {/* Improvements */}
                {feedback?.improvements?.length > 0 && (
                  <CollapsibleSection title="Verbesserungspotenzial" icon={AlertCircle} iconColor="text-amber-600" defaultOpen={true}>
                    <ul className="m-0 pl-4 text-slate-600 text-xs">
                      {feedback.improvements.map((s, i) => <li key={i} className="mb-1">{s}</li>)}
                    </ul>
                  </CollapsibleSection>
                )}

                {/* Tips */}
                {feedback?.tips?.length > 0 && !isNoSpeech && (
                  <CollapsibleSection title="Tipps" icon={Lightbulb} iconColor="text-primary" defaultOpen={true}>
                    <ul className="m-0 pl-4 text-slate-600 text-xs">
                      {feedback.tips.map((s, i) => <li key={i} className="mb-1">{s}</li>)}
                    </ul>
                  </CollapsibleSection>
                )}

                {/* Audio Metrics - Professional Panel */}
                {showAudioAnalysis && (
                  <CollapsibleSection title="Sprechanalyse" icon={Mic} defaultOpen={false}>
                    <AudioAnalysisPanel
                      audioAnalysis={normalizedMetrics}
                      onJumpToTimestamp={handleJumpToTimestamp}
                    />
                  </CollapsibleSection>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};

/**
 * Delete confirmation dialog
 */
const DeleteConfirmDialog = ({ isOpen, onClose, onConfirm, isDeleting }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl p-6 max-w-[400px] w-[90%] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
            <Trash2 size={24} className="text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 m-0">Session löschen?</h3>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed mb-6">
          Möchtest du diese Session wirklich löschen? Alle Antworten und Feedback werden unwiderruflich entfernt.
        </p>

        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={onClose} disabled={isDeleting}>
            Abbrechen
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            disabled={isDeleting}
            icon={isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
          >
            {isDeleting ? 'Löschen...' : 'Löschen'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

/**
 * Category score card for video training
 */
const CategoryScoreCard = ({ category }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const IconComponent = CATEGORY_ICONS[category.category] || Star;
  const color = getScoreColor(category.score);

  return (
    <Card className="mb-2.5 overflow-hidden p-0">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3.5 bg-transparent border-none cursor-pointer flex items-center gap-3"
      >
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
          <IconComponent size={18} style={{ color }} />
        </div>
        <div className="flex-1 text-left">
          <h4 className="text-sm font-semibold text-slate-900 m-0">{category.label}</h4>
        </div>
        <span className="text-base font-bold" style={{ color }}>{Math.round(category.score)}%</span>
        <ChevronDown size={18} className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 pt-3 border-t border-slate-100">
              {category.feedback && <p className="text-[13px] text-slate-600 leading-snug mb-2.5">{category.feedback}</p>}
              {category.strengths?.length > 0 && (
                <div className="mb-2.5">
                  <h6 className="text-xs font-semibold text-green-600 mb-1 flex items-center gap-1"><CheckCircle size={12} /> Stärken</h6>
                  <ul className="m-0 pl-4 text-xs text-slate-600">{category.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
                </div>
              )}
              {category.improvements?.length > 0 && (
                <div>
                  <h6 className="text-xs font-semibold text-amber-600 mb-1 flex items-center gap-1"><Lightbulb size={12} /> Tipps</h6>
                  <ul className="m-0 pl-4 text-xs text-slate-600">{category.improvements.map((s, i) => <li key={i}>{s}</li>)}</ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const TrainingSessionDetailView = ({ session, type, scenario, onBack, onContinueSession, onRepeatSession, onDeleteSession }) => {
  const isMobile = useMobile();
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

  const [answers, setAnswers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [roleplayData, setRoleplayData] = useState(null);
  const [roleplayScenario, setRoleplayScenario] = useState(scenario);

  const isVideo = type === 'video';
  const isSimulator = type === 'simulator';
  const isRoleplay = type === 'roleplay';

  const hasQuestions = (() => {
    const questionsData = session?.questions || session?.questions_json;
    if (!questionsData) return false;
    try {
      const questions = typeof questionsData === 'string' ? JSON.parse(questionsData) : questionsData;
      return Array.isArray(questions) && questions.length > 0;
    } catch {
      return false;
    }
  })();

  const isResumable = (() => {
    if (!isSimulator || !hasQuestions) return false;
    const totalQuestions = session?.total_questions || 0;
    const completedQuestions = session?.completed_questions || 0;
    return totalQuestions > 0 && completedQuestions < totalQuestions;
  })();

  const handleDeleteSession = async () => {
    if (!onDeleteSession) return;
    setIsDeleting(true);
    try {
      await onDeleteSession(session, type);
    } catch (err) {
      console.error('Failed to delete session:', err);
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (isDownloadingPdf || !session?.id) return;
    setIsDownloadingPdf(true);
    try {
      let endpoint;
      if (isSimulator) endpoint = `${getWPApiUrl()}/simulator/sessions/${session.id}/export-pdf`;
      else if (isVideo) endpoint = `${getWPApiUrl()}/video-training/sessions/${session.id}/export-pdf`;
      else if (isRoleplay) endpoint = `${getWPApiUrl()}/sessions/${session.id}/export-pdf`;
      else throw new Error('Unsupported session type for PDF export');

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'X-WP-Nonce': getWPNonce(), 'Content-Type': 'application/json' },
        credentials: 'same-origin',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
      if (!data.success || !data.pdf_base64) throw new Error(data.error || 'PDF generation failed');

      const byteCharacters = atob(data.pdf_base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: data.content_type || 'application/pdf' });

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
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  useEffect(() => {
    if (isSimulator && session?.id) loadSimulatorAnswers();
    else if (isRoleplay && session?.id) loadRoleplayData();
    else setIsLoading(false);
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

  const summaryFeedback = session?.summary_feedback_json
    ? (typeof session.summary_feedback_json === 'string' ? JSON.parse(session.summary_feedback_json) : session.summary_feedback_json)
    : null;

  const categoryScores = session?.category_scores || [];
  const analysis = session?.analysis || {};

  // Video Training audio metrics from analysis object
  const videoRef = useRef(null);
  const videoAudioMetrics = useMemo(() => {
    if (!isVideo || !analysis) return null;
    if (analysis.filler_words || analysis.speech_metrics) {
      return { filler_words: analysis.filler_words, speech_metrics: analysis.speech_metrics };
    }
    return null;
  }, [isVideo, analysis]);
  const normalizedVideoAudioMetrics = useMemo(() => normalizeAudioMetrics(videoAudioMetrics), [videoAudioMetrics]);
  const showVideoAudioAnalysis = hasAudioMetricsData(videoAudioMetrics);

  // Handler to jump to timestamp in video
  const handleVideoJumpToTimestamp = (seconds) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      videoRef.current.play();
    }
  };

  const getOverallScore = () => {
    let rawScore = 0;
    if (isRoleplay && roleplayData?.feedback?.rating?.overall) rawScore = roleplayData.feedback.rating.overall;
    else rawScore = session?.overall_score || summaryFeedback?.overall_score || 0;
    if ((isSimulator || isRoleplay) && rawScore <= 10) return rawScore * 10;
    return rawScore;
  };

  const overallScore = getOverallScore();

  if (isLoading) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center p-10">
        <div className="text-center">
          <Loader2 size={48} className="text-primary animate-spin mx-auto" />
          <p className="text-slate-500 mt-4">Analyse wird geladen...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center max-w-[400px] p-6">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Fehler beim Laden</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <Button variant="secondary" onClick={onBack}>Zurück</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 overflow-hidden max-w-full">
      {/* Header */}
      <div
        className={`sticky top-0 z-40 ${isMobile ? 'px-4 py-5' : 'px-8 py-6'}`}
        style={{ background: 'var(--header-gradient, linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%))' }}
      >
        <div className="max-w-[1400px] mx-auto">
          {/* Back Button */}
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 bg-white/15 border-none rounded-lg px-3 py-2 cursor-pointer text-white text-[13px] mb-4 hover:bg-white/25 transition-colors"
            >
              <ArrowLeft size={16} />
              Zurück zur Übersicht
            </button>
          )}

          {/* Header Content */}
          <div className="flex items-center gap-6">
            {/* Score Gauge - Hidden on mobile */}
            {!isMobile && <ScoreGauge score={overallScore} size={100} isHeader />}

            {/* Title & Meta */}
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full bg-white/20 text-white">
                  {getTypeLabel(type)}
                </span>
                <span
                  className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/90"
                  style={{ color: getScoreColor(overallScore) }}
                >
                  {getGradeLabel(overallScore)}
                </span>
              </div>
              <h1 className={`font-bold text-white m-0 mb-2 ${isMobile ? 'text-xl' : 'text-2xl'}`}>
                {(isRoleplay ? roleplayScenario?.title : scenario?.title) || session?.scenario_title || session?.position || 'Training'}
              </h1>
              <div className="flex items-center gap-4 flex-wrap">
                <span className="flex items-center gap-1.5 text-[13px] text-white/80">
                  <Calendar size={14} />
                  {formatDate(session?.created_at)}
                </span>
                {session?.duration && (
                  <span className="flex items-center gap-1.5 text-[13px] text-white/80">
                    <Clock size={14} />
                    {formatDuration(session.duration)}
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleDownloadPdf}
                disabled={isDownloadingPdf}
                title="Als PDF herunterladen"
                className={`flex items-center justify-center bg-white/20 border border-white/30 rounded-lg px-3 py-2.5 text-white outline-none transition-colors hover:bg-white/30 ${isDownloadingPdf ? 'cursor-wait opacity-70' : 'cursor-pointer'}`}
              >
                {isDownloadingPdf ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              </button>
              {!isMobile && onRepeatSession && (
                <button
                  onClick={() => onRepeatSession(session, scenario)}
                  className="flex items-center gap-2 bg-white/20 border border-white/30 rounded-lg px-5 py-2.5 cursor-pointer text-white text-sm font-medium outline-none hover:bg-white/30 transition-colors"
                >
                  <RotateCcw size={16} />
                  Erneut üben
                </button>
              )}
              {onDeleteSession && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className={`flex items-center gap-2 bg-red-500/20 border border-red-500/40 rounded-lg cursor-pointer text-white text-sm font-medium outline-none hover:bg-red-500/30 transition-colors ${isMobile ? 'px-3 py-2.5' : 'px-4 py-2.5'}`}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`overflow-hidden ${isMobile ? 'p-4' : 'px-8 py-6'}`}>
        {/* Video Training - Compact Layout */}
        {isVideo && (
          <div className="max-w-[1400px] mx-auto">
            {/* Top Row: Video + Summary side by side */}
            <div className={`grid gap-5 mb-5 ${(isMobile || isTablet) ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {/* Video Player - Compact */}
              {session?.video_url && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <Card className="p-4 h-full">
                    <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <Video size={16} className="text-primary" /> Deine Aufnahme
                    </h3>
                    <video
                      ref={videoRef}
                      src={session.video_url}
                      controls
                      className="w-full rounded-xl bg-black object-contain"
                      style={{ maxHeight: '280px' }}
                    />
                  </Card>
                </motion.div>
              )}

              {/* Summary + Main Score */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <Card className="p-4 h-full flex flex-col">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <Award size={16} className="text-primary" /> Gesamtbewertung
                  </h3>
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <ScoreGauge score={overallScore} size={100} />
                    <p className="text-lg font-semibold mt-2" style={{ color: getScoreColor(overallScore) }}>
                      {getGradeLabel(overallScore)}
                    </p>
                    {session?.summary_feedback && (
                      <p className="text-[13px] text-slate-600 leading-relaxed text-center mt-3 line-clamp-4">
                        {session.summary_feedback}
                      </p>
                    )}
                  </div>
                </Card>
              </motion.div>
            </div>

            {/* Middle Row: Categories + Audio Analysis side by side */}
            <div className={`grid gap-5 mb-5 ${(isMobile || isTablet) ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {/* Category Scores */}
              {categoryScores.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <Card className="p-4">
                    <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <Star size={16} className="text-primary" /> Detaillierte Bewertung
                    </h3>
                    {/* Only limit height on desktop - no nested scrolling on mobile */}
                    <div className={!(isMobile || isTablet) ? 'max-h-[300px] overflow-y-auto pr-1' : ''}>
                      {categoryScores.map((category, index) => (
                        <CategoryScoreCard key={category.category || index} category={category} />
                      ))}
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Audio/Speech Analysis */}
              {showVideoAudioAnalysis && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                  <Card className="p-4">
                    <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <Mic size={16} className="text-primary" /> Sprechanalyse
                    </h3>
                    {/* Only limit height on desktop - no nested scrolling on mobile */}
                    <div className={!(isMobile || isTablet) ? 'max-h-[300px] overflow-y-auto pr-1' : ''}>
                      <AudioAnalysisPanel
                        audioAnalysis={normalizedVideoAudioMetrics}
                        onJumpToTimestamp={handleVideoJumpToTimestamp}
                      />
                    </div>
                  </Card>
                </motion.div>
              )}
            </div>

            {/* Bottom Row: Strengths + Tips side by side */}
            {(analysis.key_strengths?.length > 0 || analysis.actionable_tips?.length > 0) && (
              <div className={`grid gap-5 ${(isMobile || isTablet) ? 'grid-cols-1' : 'grid-cols-2'}`}>
                {/* Strengths */}
                {analysis.key_strengths?.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <Card className="p-4 h-full">
                      <h4 className="text-sm font-semibold text-green-600 mb-3 flex items-center gap-1.5">
                        <CheckCircle size={16} /> Deine Stärken
                      </h4>
                      <ul className="m-0 pl-5">
                        {analysis.key_strengths.map((item, i) => (
                          <li key={i} className="text-[13px] text-slate-600 mb-1.5 leading-snug">{item}</li>
                        ))}
                      </ul>
                    </Card>
                  </motion.div>
                )}

                {/* Tips */}
                {analysis.actionable_tips?.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                    <Card className="p-4 h-full">
                      <h4 className="text-sm font-semibold text-primary mb-3 flex items-center gap-1.5">
                        <Lightbulb size={16} /> Tipps zur Verbesserung
                      </h4>
                      <ul className="m-0 pl-5">
                        {analysis.actionable_tips.map((item, i) => (
                          <li key={i} className="text-[13px] text-slate-600 mb-1.5 leading-snug">{item}</li>
                        ))}
                      </ul>
                    </Card>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Non-Video Sessions (Simulator, Roleplay) - Original 2-Column Layout */}
        {!isVideo && (
        <div
          className="grid gap-6 overflow-hidden"
          style={{ gridTemplateColumns: (isMobile || isTablet) ? '1fr' : '1fr 400px' }}
        >
          {/* LEFT COLUMN - Media */}
          <div className="min-w-0 overflow-hidden">

            {/* Simulator Answers */}
            {isSimulator && answers.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <MessageSquare size={18} className="text-primary" /> Deine Antworten ({answers.length})
                </h3>
                {answers.map((answer, index) => (
                  <AnswerCard key={answer.id || index} answer={answer} index={index} />
                ))}

                {/* Resumable Session Actions */}
                {isResumable && (onContinueSession || onRepeatSession) && (
                  <div className="flex gap-3 justify-center flex-wrap mt-6 p-5 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <p className="w-full text-center text-slate-600 text-sm mb-3">
                      Diese Session ist noch nicht abgeschlossen.
                    </p>
                    {onContinueSession && (
                      <Button onClick={() => onContinueSession(session, scenario)} icon={<PlayCircle size={18} />}>
                        Fortsetzen
                      </Button>
                    )}
                    {onRepeatSession && (
                      <Button variant="secondary" onClick={() => onRepeatSession(session, scenario)} icon={<RotateCcw size={18} />}>
                        Erneut starten
                      </Button>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* Empty state for simulator */}
            {isSimulator && answers.length === 0 && (
              <div className="text-center py-12 px-6 bg-slate-50 rounded-2xl">
                <AlertCircle size={48} className="text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Keine Antworten vorhanden</h3>
                <p className="text-slate-500 mb-6">
                  {hasQuestions
                    ? 'Diese Session wurde nicht abgeschlossen. Du kannst sie fortsetzen oder erneut starten.'
                    : 'Diese Session wurde verlassen, bevor Fragen generiert wurden.'}
                </p>
                {isResumable && (onContinueSession || onRepeatSession) && (
                  <div className="flex gap-3 justify-center flex-wrap">
                    {onContinueSession && (
                      <Button onClick={() => onContinueSession(session, scenario)} icon={<PlayCircle size={18} />}>
                        Fortsetzen
                      </Button>
                    )}
                    {onRepeatSession && (
                      <Button variant="secondary" onClick={() => onRepeatSession(session, scenario)} icon={<RotateCcw size={18} />}>
                        Erneut starten
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Roleplay Audio Player */}
            {isRoleplay && roleplayData && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-5">
                <RoleplayAudioPlayer sessionId={session.id} conversationId={roleplayData.conversation_id} />
              </motion.div>
            )}

            {/* Roleplay Transcript */}
            {isRoleplay && roleplayData?.transcript?.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="p-5">
                  <h3 className="text-[15px] font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <FileText size={18} className="text-primary" /> Gesprächsverlauf
                  </h3>
                  <div className="max-h-[500px] overflow-y-auto">
                    {roleplayData.transcript.map((entry, index) => (
                      <TranscriptEntry key={index} entry={entry} />
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}
          </div>

          {/* RIGHT COLUMN - Analysis */}
          <div className="min-w-0 overflow-hidden">
            {/* Simulator Summary */}
            {isSimulator && summaryFeedback && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                {summaryFeedback.summary && (
                  <Card className="mb-5 p-5">
                    <h4 className="text-sm font-semibold text-slate-900 mb-2.5">Zusammenfassung</h4>
                    <p className="text-[13px] text-slate-600 leading-relaxed m-0">{summaryFeedback.summary}</p>
                  </Card>
                )}

                {summaryFeedback.scores && (
                  <Card className="mb-5 p-5">
                    <h4 className="text-sm font-semibold text-slate-900 mb-3">Bewertung</h4>
                    <div className="grid grid-cols-2 gap-2.5">
                      {Object.entries(summaryFeedback.scores).map(([key, value]) => {
                        const score100 = value != null ? value * 10 : null;
                        return (
                          <div key={key} className="p-3 bg-slate-50 rounded-lg text-center">
                            <div className="text-xl font-bold" style={{ color: getScoreColor(score100) }}>{score100 != null ? Math.round(score100) : '-'}</div>
                            <div className="text-[11px] text-slate-500 capitalize">{key}</div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                )}

                {summaryFeedback.key_takeaways?.length > 0 && (
                  <div className="bg-green-50 rounded-2xl p-5">
                    <h4 className="text-sm font-semibold text-green-600 mb-2.5 flex items-center gap-1.5">
                      <Lightbulb size={16} /> Wichtigste Erkenntnisse
                    </h4>
                    <ul className="m-0 pl-5 text-[13px] text-slate-900 leading-snug">
                      {summaryFeedback.key_takeaways.map((t, i) => <li key={i} className="mb-1.5">{t}</li>)}
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
                  <Card className="mb-5 p-5">
                    <h4 className="text-[15px] font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <Star size={16} className="text-primary" /> Bewertungskriterien
                    </h4>
                    <div className="flex flex-col gap-2.5">
                      {Object.entries(roleplayData.feedback.rating)
                        .filter(([key]) => key !== 'overall')
                        .map(([key, value]) => {
                          const score100 = value * 10;
                          return (
                            <div key={key} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                              <div className="flex-1 text-[13px] font-medium text-slate-900 capitalize">
                                {key.replace(/_/g, ' ')}
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-20 h-1.5 bg-slate-200 rounded">
                                  <div className="h-full rounded" style={{ width: `${score100}%`, backgroundColor: getScoreColor(score100) }} />
                                </div>
                                <span className="text-sm font-semibold min-w-[45px]" style={{ color: getScoreColor(score100) }}>
                                  {Math.round(score100)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </Card>
                )}

                {/* Strengths */}
                {roleplayData.feedback.strengths?.length > 0 && (
                  <Card className="mb-5 p-5">
                    <h4 className="text-sm font-semibold text-green-600 mb-3 flex items-center gap-1.5">
                      <CheckCircle size={16} /> Deine Stärken
                    </h4>
                    <ul className="m-0 pl-5">
                      {roleplayData.feedback.strengths.map((item, i) => (
                        <li key={i} className="text-[13px] text-slate-600 mb-2 leading-snug">{item}</li>
                      ))}
                    </ul>
                  </Card>
                )}

                {/* Improvements */}
                {roleplayData.feedback.improvements?.length > 0 && (
                  <Card className="mb-5 p-5">
                    <h4 className="text-sm font-semibold text-amber-600 mb-3 flex items-center gap-1.5">
                      <Lightbulb size={16} /> Verbesserungspotenzial
                    </h4>
                    <ul className="m-0 pl-5">
                      {roleplayData.feedback.improvements.map((item, i) => (
                        <li key={i} className="text-[13px] text-slate-600 mb-2 leading-snug">{item}</li>
                      ))}
                    </ul>
                  </Card>
                )}

                {/* Summary */}
                {roleplayData.feedback.summary && (
                  <div className="bg-slate-50 rounded-2xl p-5">
                    <h4 className="text-sm font-semibold text-slate-900 mb-2.5">Zusammenfassung</h4>
                    <p className="text-[13px] text-slate-600 leading-relaxed m-0">{roleplayData.feedback.summary}</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Roleplay Empty State */}
            {isRoleplay && !roleplayData?.feedback && (
              <div className="bg-slate-50 rounded-2xl p-6 text-center">
                <AlertCircle size={32} className="text-slate-400 mx-auto mb-3" />
                <p className="text-sm text-slate-500 m-0">
                  Keine Analyse verfügbar für dieses Gespräch.
                </p>
              </div>
            )}
          </div>
        </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteSession}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default TrainingSessionDetailView;
