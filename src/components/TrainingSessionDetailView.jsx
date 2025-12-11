/**
 * TrainingSessionDetailView Component
 *
 * Unified detail view for Simulator and Video Training sessions.
 * Two-column layout: Media (left) + Analysis (right)
 * Responsive: stacks vertically on mobile
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  FileText,
  Award,
  User,
  MessageSquare,
  Eye,
  Loader2,
  SkipBack,
  SkipForward,
} from 'lucide-react';
import { usePartner } from '@/context/PartnerContext';
import { DEFAULT_BRANDING } from '@/config/partners';

// =============================================================================
// CONSTANTS
// =============================================================================

const COLORS = {
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  green: { 500: '#22c55e', 100: '#dcfce7' },
  amber: { 500: '#f59e0b', 100: '#fef3c7' },
  red: { 500: '#ef4444', 100: '#fee2e2' },
};

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

const getScoreColor = (score, maxScore = 100, primaryAccent) => {
  const percentage = maxScore === 10 ? score * 10 : score;
  if (percentage >= 80) return COLORS.green[500];
  if (percentage >= 60) return primaryAccent;
  if (percentage >= 40) return COLORS.amber[500];
  return COLORS.red[500];
};

const getGradeLabel = (score, maxScore) => {
  const percentage = maxScore === 10 ? score * 10 : score;
  if (percentage >= 90) return 'Ausgezeichnet!';
  if (percentage >= 80) return 'Sehr gut!';
  if (percentage >= 70) return 'Gut!';
  if (percentage >= 60) return 'Solide Leistung';
  if (percentage >= 50) return 'Ausbaufähig';
  return 'Weiter üben!';
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/**
 * Score display gauge
 */
const ScoreGauge = ({ score, maxScore = 100, size = 120, primaryAccent }) => {
  const percentage = maxScore === 10 ? (score / 10) * 100 : score;
  const radius = (size - 12) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;
  const color = getScoreColor(score, maxScore, primaryAccent);

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={COLORS.slate[200]}
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
          {maxScore === 10 ? score.toFixed(1) : Math.round(score)}
        </span>
        <span style={{ fontSize: size / 10, color: COLORS.slate[500] }}>
          von {maxScore}
        </span>
      </div>
    </div>
  );
};

/**
 * Audio player for individual answers
 */
const AudioPlayer = ({ audioUrl, primaryAccent }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!audioUrl) return;
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.addEventListener('loadedmetadata', () => setDuration(audio.duration));
    audio.addEventListener('timeupdate', () => setCurrentTime(audio.currentTime));
    audio.addEventListener('play', () => setIsPlaying(true));
    audio.addEventListener('pause', () => setIsPlaying(false));
    audio.addEventListener('ended', () => setIsPlaying(false));
    audio.addEventListener('error', () => setError('Audio nicht verfügbar'));

    return () => { audio.pause(); audio.src = ''; };
  }, [audioUrl]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
      <div style={{ padding: '12px', background: COLORS.slate[100], borderRadius: '10px', color: COLORS.slate[500], fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <AlertCircle size={16} /> {error}
      </div>
    );
  }

  if (!audioUrl) return null;

  return (
    <div style={{ background: COLORS.slate[100], borderRadius: '12px', padding: '12px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={() => skip(-10)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: COLORS.slate[500] }}>
          <SkipBack size={16} />
        </button>
        <button
          onClick={togglePlay}
          style={{ width: '36px', height: '36px', borderRadius: '50%', background: primaryAccent, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: '2px' }} />}
        </button>
        <button onClick={() => skip(10)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: COLORS.slate[500] }}>
          <SkipForward size={16} />
        </button>
        <div onClick={handleSeek} style={{ flex: 1, height: '6px', background: COLORS.slate[300], borderRadius: '3px', cursor: 'pointer' }}>
          <div style={{ width: `${(currentTime / duration) * 100 || 0}%`, height: '100%', background: primaryAccent, borderRadius: '3px', transition: 'width 0.1s' }} />
        </div>
        <span style={{ fontSize: '12px', color: COLORS.slate[500], minWidth: '70px' }}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
    </div>
  );
};

/**
 * Expandable answer card for simulator sessions
 */
const AnswerCard = ({ answer, index, primaryAccent }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const feedback = answer.feedback ? (typeof answer.feedback === 'string' ? JSON.parse(answer.feedback) : answer.feedback) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      style={{ background: '#fff', borderRadius: '16px', border: `1px solid ${COLORS.slate[200]}`, overflow: 'hidden', marginBottom: '16px' }}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ width: '100%', padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left' }}
      >
        <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: `${primaryAccent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: primaryAccent, fontWeight: 700, fontSize: '14px', flexShrink: 0 }}>
          {index + 1}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4 style={{ fontSize: '14px', fontWeight: 600, color: COLORS.slate[900], margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {answer.question_text || `Frage ${index + 1}`}
          </h4>
        </div>
        {answer.overall_score && (
          <span style={{ fontSize: '16px', fontWeight: 700, color: getScoreColor(answer.overall_score, 10, primaryAccent) }}>
            {answer.overall_score.toFixed(1)}
          </span>
        )}
        <ChevronDown size={18} color={COLORS.slate[400]} style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
            <div style={{ padding: '0 20px 20px', borderTop: `1px solid ${COLORS.slate[200]}`, paddingTop: '16px' }}>
              {answer.audio_url && (
                <div style={{ marginBottom: '16px' }}>
                  <h5 style={{ fontSize: '13px', fontWeight: 600, color: COLORS.slate[700], marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Mic size={14} color={primaryAccent} /> Deine Aufnahme
                  </h5>
                  <AudioPlayer audioUrl={answer.audio_url} primaryAccent={primaryAccent} />
                </div>
              )}
              {answer.transcript && (
                <div style={{ marginBottom: '16px' }}>
                  <h5 style={{ fontSize: '13px', fontWeight: 600, color: COLORS.slate[700], marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileText size={14} color={primaryAccent} /> Transkript
                  </h5>
                  <p style={{ fontSize: '13px', color: COLORS.slate[600], lineHeight: 1.6, background: COLORS.slate[50], padding: '12px 16px', borderRadius: '10px', margin: 0, fontStyle: 'italic' }}>
                    "{answer.transcript}"
                  </p>
                </div>
              )}
              {feedback?.summary && <p style={{ fontSize: '13px', color: COLORS.slate[600], lineHeight: 1.5, marginBottom: '12px' }}>{feedback.summary}</p>}
              {feedback?.strengths?.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <h6 style={{ fontSize: '12px', fontWeight: 600, color: COLORS.green[500], marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={12} /> Stärken</h6>
                  <ul style={{ margin: 0, paddingLeft: '18px', color: COLORS.slate[600], fontSize: '12px' }}>{feedback.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
                </div>
              )}
              {feedback?.improvements?.length > 0 && (
                <div>
                  <h6 style={{ fontSize: '12px', fontWeight: 600, color: COLORS.amber[500], marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}><Lightbulb size={12} /> Tipps</h6>
                  <ul style={{ margin: 0, paddingLeft: '18px', color: COLORS.slate[600], fontSize: '12px' }}>{feedback.improvements.map((s, i) => <li key={i}>{s}</li>)}</ul>
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
 * Category score card for video training
 */
const CategoryScoreCard = ({ category, primaryAccent }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const IconComponent = CATEGORY_ICONS[category.category] || Star;
  const color = getScoreColor(category.score, 100, primaryAccent);

  return (
    <div style={{ background: '#fff', borderRadius: '12px', border: `1px solid ${COLORS.slate[200]}`, overflow: 'hidden', marginBottom: '10px' }}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ width: '100%', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}
      >
        <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconComponent size={18} color={color} />
        </div>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 600, color: COLORS.slate[900], margin: 0 }}>{category.label}</h4>
        </div>
        <span style={{ fontSize: '16px', fontWeight: 700, color }}>{Math.round(category.score)}%</span>
        <ChevronDown size={18} color={COLORS.slate[400]} style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
            <div style={{ padding: '0 16px 16px', borderTop: `1px solid ${COLORS.slate[200]}`, paddingTop: '12px' }}>
              {category.feedback && <p style={{ fontSize: '13px', color: COLORS.slate[600], lineHeight: 1.5, marginBottom: '10px' }}>{category.feedback}</p>}
              {category.strengths?.length > 0 && (
                <div style={{ marginBottom: '10px' }}>
                  <h6 style={{ fontSize: '12px', fontWeight: 600, color: COLORS.green[500], marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={12} /> Stärken</h6>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: COLORS.slate[600] }}>{category.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
                </div>
              )}
              {category.improvements?.length > 0 && (
                <div>
                  <h6 style={{ fontSize: '12px', fontWeight: 600, color: COLORS.amber[500], marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><Lightbulb size={12} /> Tipps</h6>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: COLORS.slate[600] }}>{category.improvements.map((s, i) => <li key={i}>{s}</li>)}</ul>
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

const TrainingSessionDetailView = ({ session, type, scenario, onBack }) => {
  const { branding } = usePartner();
  const headerGradient = branding?.['--header-gradient'] || DEFAULT_BRANDING['--header-gradient'];
  const primaryAccent = branding?.['--primary-accent'] || DEFAULT_BRANDING['--primary-accent'];

  const [answers, setAnswers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const isVideo = type === 'video';
  const isSimulator = type === 'simulator';

  // Load answers for simulator sessions
  useEffect(() => {
    if (isSimulator && session?.id) {
      loadSimulatorAnswers();
    } else {
      setIsLoading(false);
    }
  }, [session?.id, type]);

  const loadSimulatorAnswers = async () => {
    try {
      setIsLoading(true);
      const config = window.bewerbungstrainerConfig || {};
      const response = await fetch(`${config.apiUrl}/simulator/sessions/${session.id}/answers`, {
        headers: { 'X-WP-Nonce': config.nonce },
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

  // Parse session data
  const summaryFeedback = session?.summary_feedback_json
    ? (typeof session.summary_feedback_json === 'string' ? JSON.parse(session.summary_feedback_json) : session.summary_feedback_json)
    : null;

  const categoryScores = session?.category_scores || [];
  const analysis = session?.analysis || {};
  const overallScore = session?.overall_score || summaryFeedback?.overall_score || 0;
  const maxScore = isSimulator ? 10 : 100;

  // Loading state
  if (isLoading) {
    return (
      <div style={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={48} color={primaryAccent} style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ color: COLORS.slate[500], marginTop: '16px' }}>Analyse wird geladen...</p>
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
          <AlertCircle size={48} color={COLORS.red[500]} style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: COLORS.slate[900], marginBottom: '8px' }}>Fehler beim Laden</h2>
          <p style={{ color: COLORS.slate[600], marginBottom: '24px' }}>{error}</p>
          <button onClick={onBack} style={{ padding: '12px 24px', borderRadius: '10px', background: COLORS.slate[100], border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>
            Zurück
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Responsive styles */}
      <style>{`
        .detail-grid { display: grid; grid-template-columns: 1fr 400px; gap: 24px; max-width: 1200px; margin: 0 auto; }
        @media (max-width: 900px) { .detail-grid { grid-template-columns: 1fr; } }
      `}</style>

      {/* Back button */}
      <div style={{ maxWidth: '1200px', margin: '0 auto 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px',
            borderRadius: '10px', background: COLORS.slate[100], border: 'none',
            cursor: 'pointer', fontSize: '14px', fontWeight: 500, color: COLORS.slate[700],
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = COLORS.slate[200]; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = COLORS.slate[100]; }}
        >
          <ArrowLeft size={18} />
          Zurück zur Übersicht
        </button>
        <button
          onClick={onBack}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px',
            borderRadius: '10px', background: COLORS.red[100], border: 'none',
            cursor: 'pointer', fontSize: '14px', fontWeight: 500, color: COLORS.red[500],
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#fecaca'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = COLORS.red[100]; }}
        >
          Abbrechen
        </button>
      </div>

      {/* Two-column layout */}
      <div className="detail-grid">
        {/* LEFT COLUMN - Media */}
        <div>
          {/* Header Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: headerGradient,
              borderRadius: '20px',
              padding: '24px',
              marginBottom: '20px',
              color: '#fff',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <ScoreGauge score={overallScore} maxScore={maxScore} size={100} primaryAccent="#fff" />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', opacity: 0.9 }}>
                  {isVideo ? <Video size={16} /> : <Target size={16} />}
                  <span style={{ fontSize: '13px', fontWeight: 500 }}>
                    {isVideo ? 'Video-Training' : 'Szenario-Training'}
                  </span>
                </div>
                <h1 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 6px 0' }}>
                  {scenario?.title || session?.scenario_title || 'Training'}
                </h1>
                <p style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 8px 0', opacity: 0.9 }}>
                  {getGradeLabel(overallScore, maxScore)}
                </p>
                <div style={{ display: 'flex', gap: '12px', fontSize: '12px', opacity: 0.8 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} />
                    {new Date(session.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Video Player */}
          {isVideo && session?.video_url && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: `1px solid ${COLORS.slate[200]}`, marginBottom: '20px' }}
            >
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: COLORS.slate[900], marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Video size={18} color={primaryAccent} /> Deine Aufnahme
              </h3>
              <video src={session.video_url} controls style={{ width: '100%', borderRadius: '12px', background: '#000' }} />
            </motion.div>
          )}

          {/* Simulator Answers */}
          {isSimulator && answers.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: COLORS.slate[900], marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare size={18} color={primaryAccent} /> Deine Antworten ({answers.length})
              </h3>
              {answers.map((answer, index) => (
                <AnswerCard key={answer.id || index} answer={answer} index={index} primaryAccent={primaryAccent} />
              ))}
            </motion.div>
          )}

          {/* Empty state for simulator */}
          {isSimulator && answers.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 24px', background: COLORS.slate[100], borderRadius: '16px' }}>
              <AlertCircle size={48} color={COLORS.slate[400]} style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: COLORS.slate[700], marginBottom: '8px' }}>Keine Antworten vorhanden</h3>
              <p style={{ color: COLORS.slate[500] }}>Diese Session wurde möglicherweise nicht abgeschlossen.</p>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN - Analysis */}
        <div>
          {/* Category Scores (Video) */}
          {isVideo && categoryScores.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: COLORS.slate[900], marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Star size={16} color={primaryAccent} /> Detaillierte Bewertung
              </h3>
              {categoryScores.map((category, index) => (
                <CategoryScoreCard key={category.category || index} category={category} primaryAccent={primaryAccent} />
              ))}
            </motion.div>
          )}

          {/* Analysis Details (Video) */}
          {isVideo && (analysis.key_strengths?.length > 0 || analysis.actionable_tips?.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: `1px solid ${COLORS.slate[200]}`, marginBottom: '20px' }}
            >
              {analysis.key_strengths?.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: COLORS.green[500], marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle size={16} /> Deine Stärken
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    {analysis.key_strengths.map((item, i) => (
                      <li key={i} style={{ fontSize: '13px', color: COLORS.slate[600], marginBottom: '6px', lineHeight: 1.4 }}>{item}</li>
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
                      <li key={i} style={{ fontSize: '13px', color: COLORS.slate[600], marginBottom: '6px', lineHeight: 1.4 }}>{item}</li>
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
              style={{ background: COLORS.slate[100], borderRadius: '16px', padding: '20px' }}
            >
              <h4 style={{ fontSize: '14px', fontWeight: 600, color: COLORS.slate[900], marginBottom: '10px' }}>Zusammenfassung</h4>
              <p style={{ fontSize: '13px', color: COLORS.slate[600], lineHeight: 1.6, margin: 0 }}>{session.summary_feedback}</p>
            </motion.div>
          )}

          {/* Simulator Summary */}
          {isSimulator && summaryFeedback && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              {summaryFeedback.summary && (
                <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: `1px solid ${COLORS.slate[200]}`, marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: COLORS.slate[900], marginBottom: '10px' }}>Zusammenfassung</h4>
                  <p style={{ fontSize: '13px', color: COLORS.slate[600], lineHeight: 1.6, margin: 0 }}>{summaryFeedback.summary}</p>
                </div>
              )}

              {summaryFeedback.scores && (
                <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: `1px solid ${COLORS.slate[200]}`, marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: COLORS.slate[900], marginBottom: '12px' }}>Bewertung</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                    {Object.entries(summaryFeedback.scores).map(([key, value]) => (
                      <div key={key} style={{ padding: '12px', background: COLORS.slate[50], borderRadius: '10px', textAlign: 'center' }}>
                        <div style={{ fontSize: '20px', fontWeight: 700, color: getScoreColor(value, 10, primaryAccent) }}>{value?.toFixed(1) || '-'}</div>
                        <div style={{ fontSize: '11px', color: COLORS.slate[500], textTransform: 'capitalize' }}>{key}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {summaryFeedback.key_takeaways?.length > 0 && (
                <div style={{ background: COLORS.green[100], borderRadius: '16px', padding: '20px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: COLORS.green[500], marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Lightbulb size={16} /> Wichtigste Erkenntnisse
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: COLORS.slate[700], lineHeight: 1.5 }}>
                    {summaryFeedback.key_takeaways.map((t, i) => <li key={i} style={{ marginBottom: '6px' }}>{t}</li>)}
                  </ul>
                </div>
              )}
            </motion.div>
          )}

          {/* Placeholder when no analysis data */}
          {isSimulator && !summaryFeedback && answers.length > 0 && (
            <div style={{ background: COLORS.slate[100], borderRadius: '16px', padding: '24px', textAlign: 'center' }}>
              <Star size={32} color={COLORS.slate[400]} style={{ margin: '0 auto 12px' }} />
              <p style={{ fontSize: '14px', color: COLORS.slate[500], margin: 0 }}>
                Die Gesamtauswertung wird nach Abschluss des Trainings angezeigt.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrainingSessionDetailView;
