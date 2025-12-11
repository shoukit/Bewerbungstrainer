/**
 * TrainingSessionDetailView Component
 *
 * Unified detail view for Simulator and Video Training sessions.
 * - For Video Training: Shows video player + analysis
 * - For Simulator: Shows audio players + transcripts per question
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Video,
  Mic,
  Star,
  Trophy,
  Target,
  ChevronDown,
  ChevronRight,
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
  RefreshCw,
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

  const getColor = () => {
    if (percentage >= 80) return COLORS.green[500];
    if (percentage >= 60) return primaryAccent;
    if (percentage >= 40) return COLORS.amber[500];
    return COLORS.red[500];
  };

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
          stroke={getColor()}
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
        <span style={{ fontSize: size / 3.5, fontWeight: 700, color: getColor() }}>
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
  const [isMuted, setIsMuted] = useState(false);
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

    return () => {
      audio.pause();
      audio.src = '';
    };
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
    if (audioRef.current) {
      audioRef.current.currentTime = percent * duration;
    }
  };

  const skip = (seconds) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(audioRef.current.currentTime + seconds, duration));
    }
  };

  if (error) {
    return (
      <div style={{
        padding: '12px',
        background: COLORS.slate[100],
        borderRadius: '10px',
        color: COLORS.slate[500],
        fontSize: '13px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <AlertCircle size={16} />
        {error}
      </div>
    );
  }

  if (!audioUrl) {
    return null;
  }

  return (
    <div style={{
      background: COLORS.slate[100],
      borderRadius: '12px',
      padding: '12px 16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Skip back */}
        <button
          onClick={() => skip(-10)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            color: COLORS.slate[500],
          }}
        >
          <SkipBack size={16} />
        </button>

        {/* Play/Pause */}
        <button
          onClick={togglePlay}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: primaryAccent,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
          }}
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: '2px' }} />}
        </button>

        {/* Skip forward */}
        <button
          onClick={() => skip(10)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            color: COLORS.slate[500],
          }}
        >
          <SkipForward size={16} />
        </button>

        {/* Progress bar */}
        <div
          onClick={handleSeek}
          style={{
            flex: 1,
            height: '6px',
            background: COLORS.slate[300],
            borderRadius: '3px',
            cursor: 'pointer',
            position: 'relative',
          }}
        >
          <div
            style={{
              width: `${(currentTime / duration) * 100 || 0}%`,
              height: '100%',
              background: primaryAccent,
              borderRadius: '3px',
              transition: 'width 0.1s',
            }}
          />
        </div>

        {/* Time */}
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

  // Parse feedback if string
  const feedback = answer.feedback
    ? (typeof answer.feedback === 'string' ? JSON.parse(answer.feedback) : answer.feedback)
    : null;

  const getScoreColor = (score) => {
    if (score >= 8) return COLORS.green[500];
    if (score >= 6) return primaryAccent;
    if (score >= 4) return COLORS.amber[500];
    return COLORS.red[500];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      style={{
        background: '#fff',
        borderRadius: '16px',
        border: `1px solid ${COLORS.slate[200]}`,
        overflow: 'hidden',
        marginBottom: '16px',
      }}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: '100%',
          padding: '20px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          textAlign: 'left',
        }}
      >
        {/* Question number */}
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: `${primaryAccent}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: primaryAccent,
            fontWeight: 700,
            fontSize: '16px',
            flexShrink: 0,
          }}
        >
          {index + 1}
        </div>

        {/* Question text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4 style={{
            fontSize: '15px',
            fontWeight: 600,
            color: COLORS.slate[900],
            margin: 0,
            marginBottom: '4px',
          }}>
            {answer.question_text || `Frage ${index + 1}`}
          </h4>
          {answer.question_category && (
            <span style={{
              fontSize: '12px',
              color: COLORS.slate[500],
              background: COLORS.slate[100],
              padding: '2px 8px',
              borderRadius: '4px',
            }}>
              {answer.question_category}
            </span>
          )}
        </div>

        {/* Score */}
        {answer.overall_score && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span style={{
              fontSize: '18px',
              fontWeight: 700,
              color: getScoreColor(answer.overall_score),
            }}>
              {answer.overall_score.toFixed(1)}
            </span>
            <Star size={16} color={getScoreColor(answer.overall_score)} />
          </div>
        )}

        {/* Expand icon */}
        <ChevronDown
          size={20}
          color={COLORS.slate[400]}
          style={{
            transform: isExpanded ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s',
          }}
        />
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 20px 20px', borderTop: `1px solid ${COLORS.slate[200]}`, paddingTop: '20px' }}>
              {/* Audio Player */}
              {answer.audio_url && (
                <div style={{ marginBottom: '16px' }}>
                  <h5 style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: COLORS.slate[700],
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}>
                    <Mic size={14} color={primaryAccent} />
                    Deine Aufnahme
                  </h5>
                  <AudioPlayer audioUrl={answer.audio_url} primaryAccent={primaryAccent} />
                </div>
              )}

              {/* Transcript */}
              {answer.transcript && (
                <div style={{ marginBottom: '16px' }}>
                  <h5 style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: COLORS.slate[700],
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}>
                    <FileText size={14} color={primaryAccent} />
                    Transkript
                  </h5>
                  <p style={{
                    fontSize: '14px',
                    color: COLORS.slate[600],
                    lineHeight: 1.7,
                    background: COLORS.slate[50],
                    padding: '12px 16px',
                    borderRadius: '10px',
                    margin: 0,
                    fontStyle: 'italic',
                  }}>
                    "{answer.transcript}"
                  </p>
                </div>
              )}

              {/* Scores */}
              {(answer.content_score || answer.delivery_score) && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '12px',
                  marginBottom: '16px',
                }}>
                  {answer.content_score && (
                    <div style={{
                      padding: '12px',
                      background: COLORS.slate[100],
                      borderRadius: '10px',
                      textAlign: 'center',
                    }}>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: getScoreColor(answer.content_score) }}>
                        {answer.content_score.toFixed(1)}
                      </div>
                      <div style={{ fontSize: '12px', color: COLORS.slate[500] }}>Inhalt</div>
                    </div>
                  )}
                  {answer.delivery_score && (
                    <div style={{
                      padding: '12px',
                      background: COLORS.slate[100],
                      borderRadius: '10px',
                      textAlign: 'center',
                    }}>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: getScoreColor(answer.delivery_score) }}>
                        {answer.delivery_score.toFixed(1)}
                      </div>
                      <div style={{ fontSize: '12px', color: COLORS.slate[500] }}>Präsentation</div>
                    </div>
                  )}
                </div>
              )}

              {/* Feedback */}
              {feedback && (
                <div>
                  {feedback.summary && (
                    <p style={{
                      fontSize: '14px',
                      color: COLORS.slate[600],
                      lineHeight: 1.6,
                      marginBottom: '12px',
                    }}>
                      {feedback.summary}
                    </p>
                  )}

                  {/* Strengths */}
                  {feedback.strengths && feedback.strengths.length > 0 && (
                    <div style={{ marginBottom: '12px' }}>
                      <h6 style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: COLORS.green[500],
                        marginBottom: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}>
                        <CheckCircle size={14} />
                        Stärken
                      </h6>
                      <ul style={{ margin: 0, paddingLeft: '20px', color: COLORS.slate[600], fontSize: '13px' }}>
                        {feedback.strengths.map((s, i) => (
                          <li key={i} style={{ marginBottom: '4px' }}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Improvements */}
                  {feedback.improvements && feedback.improvements.length > 0 && (
                    <div>
                      <h6 style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: COLORS.amber[500],
                        marginBottom: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}>
                        <Lightbulb size={14} />
                        Verbesserungspotenzial
                      </h6>
                      <ul style={{ margin: 0, paddingLeft: '20px', color: COLORS.slate[600], fontSize: '13px' }}>
                        {feedback.improvements.map((s, i) => (
                          <li key={i} style={{ marginBottom: '4px' }}>{s}</li>
                        ))}
                      </ul>
                    </div>
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
 * Category score card for video training
 */
const CategoryScoreCard = ({ category, primaryAccent }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const IconComponent = CATEGORY_ICONS[category.category] || Star;

  const getScoreColor = (score) => {
    if (score >= 80) return COLORS.green[500];
    if (score >= 60) return primaryAccent;
    if (score >= 40) return COLORS.amber[500];
    return COLORS.red[500];
  };

  return (
    <div style={{
      background: '#fff',
      borderRadius: '12px',
      border: `1px solid ${COLORS.slate[200]}`,
      overflow: 'hidden',
      marginBottom: '12px',
    }}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: '100%',
          padding: '16px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: `${getScoreColor(category.score)}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <IconComponent size={20} color={getScoreColor(category.score)} />
        </div>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <h4 style={{ fontSize: '15px', fontWeight: 600, color: COLORS.slate[900], margin: 0 }}>
            {category.label}
          </h4>
        </div>
        <span style={{ fontSize: '20px', fontWeight: 700, color: getScoreColor(category.score) }}>
          {Math.round(category.score)}%
        </span>
        <ChevronDown
          size={20}
          color={COLORS.slate[400]}
          style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
        />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 16px 16px', borderTop: `1px solid ${COLORS.slate[200]}`, paddingTop: '16px' }}>
              {category.feedback && (
                <p style={{ fontSize: '14px', color: COLORS.slate[600], lineHeight: 1.6, marginBottom: '12px' }}>
                  {category.feedback}
                </p>
              )}
              {category.strengths && category.strengths.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <h6 style={{ fontSize: '13px', fontWeight: 600, color: COLORS.green[500], marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle size={14} /> Stärken
                  </h6>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: COLORS.slate[600] }}>
                    {category.strengths.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}
              {category.improvements && category.improvements.length > 0 && (
                <div>
                  <h6 style={{ fontSize: '13px', fontWeight: 600, color: COLORS.amber[500], marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Lightbulb size={14} /> Tipps
                  </h6>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: COLORS.slate[600] }}>
                    {category.improvements.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
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

      if (data.success && data.data?.answers) {
        setAnswers(data.data.answers);
      } else if (Array.isArray(data.data)) {
        setAnswers(data.data);
      }
    } catch (err) {
      console.error('Failed to load answers:', err);
      setError('Fehler beim Laden der Antworten');
    } finally {
      setIsLoading(false);
    }
  };

  // Parse session data
  const summaryFeedback = session?.summary_feedback_json
    ? (typeof session.summary_feedback_json === 'string'
        ? JSON.parse(session.summary_feedback_json)
        : session.summary_feedback_json)
    : null;

  const categoryScores = session?.category_scores || [];
  const analysis = session?.analysis || {};
  const overallScore = session?.overall_score || summaryFeedback?.overall_score || 0;
  const maxScore = isSimulator ? 10 : 100;

  const getGradeLabel = (score, max) => {
    const percentage = max === 10 ? score * 10 : score;
    if (percentage >= 90) return 'Ausgezeichnet!';
    if (percentage >= 80) return 'Sehr gut!';
    if (percentage >= 70) return 'Gut!';
    if (percentage >= 60) return 'Solide Leistung';
    if (percentage >= 50) return 'Ausbaufähig';
    return 'Weiter üben!';
  };

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
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: COLORS.slate[900], marginBottom: '8px' }}>
            Fehler beim Laden
          </h2>
          <p style={{ color: COLORS.slate[600], marginBottom: '24px' }}>{error}</p>
          <button
            onClick={onBack}
            style={{
              padding: '12px 24px',
              borderRadius: '10px',
              background: COLORS.slate[100],
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            Zurück
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 16px',
          borderRadius: '10px',
          background: COLORS.slate[100],
          border: 'none',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 500,
          color: COLORS.slate[700],
          marginBottom: '24px',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = COLORS.slate[200]; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = COLORS.slate[100]; }}
      >
        <ArrowLeft size={18} />
        Zurück zur Übersicht
      </button>

      {/* Header with score */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: '#fff',
          borderRadius: '20px',
          padding: '32px',
          marginBottom: '24px',
          border: `1px solid ${COLORS.slate[200]}`,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '32px',
          flexWrap: 'wrap',
        }}>
          {/* Score gauge */}
          <div style={{ textAlign: 'center' }}>
            <ScoreGauge score={overallScore} maxScore={maxScore} size={140} primaryAccent={primaryAccent} />
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              background: `${primaryAccent}15`,
              borderRadius: '20px',
              marginBottom: '12px',
            }}>
              {isVideo ? <Video size={16} color={primaryAccent} /> : <Target size={16} color={primaryAccent} />}
              <span style={{ fontSize: '13px', fontWeight: 500, color: primaryAccent }}>
                {isVideo ? 'Video-Training' : 'Szenario-Training'}
              </span>
            </div>

            <h1 style={{
              fontSize: '24px',
              fontWeight: 700,
              color: COLORS.slate[900],
              margin: '0 0 8px 0',
            }}>
              {scenario?.title || session?.scenario_title || 'Training'}
            </h1>

            <p style={{
              fontSize: '16px',
              color: primaryAccent,
              fontWeight: 600,
              margin: '0 0 12px 0',
            }}>
              {getGradeLabel(overallScore, maxScore)}
            </p>

            <div style={{
              display: 'flex',
              gap: '16px',
              fontSize: '13px',
              color: COLORS.slate[500],
              flexWrap: 'wrap',
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={14} />
                {new Date(session.created_at).toLocaleDateString('de-DE', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              {(session.total_questions || answers.length > 0) && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MessageSquare size={14} />
                  {session.completed_questions || answers.length} / {session.total_questions || answers.length} Fragen
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Video Player (for video training) */}
      {isVideo && session?.video_url && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px',
            border: `1px solid ${COLORS.slate[200]}`,
          }}
        >
          <h3 style={{
            fontSize: '16px',
            fontWeight: 600,
            color: COLORS.slate[900],
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <Video size={18} color={primaryAccent} />
            Deine Aufnahme
          </h3>
          <video
            src={session.video_url}
            controls
            style={{
              width: '100%',
              borderRadius: '12px',
              background: '#000',
            }}
          />
        </motion.div>
      )}

      {/* Category Scores (for video training) */}
      {isVideo && categoryScores.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ marginBottom: '24px' }}
        >
          <h3 style={{
            fontSize: '18px',
            fontWeight: 600,
            color: COLORS.slate[900],
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <Star size={20} color={primaryAccent} />
            Detaillierte Bewertung
          </h3>
          {categoryScores.map((category, index) => (
            <CategoryScoreCard
              key={category.category || index}
              category={category}
              primaryAccent={primaryAccent}
            />
          ))}
        </motion.div>
      )}

      {/* Analysis Details (for video training) */}
      {isVideo && (analysis.key_strengths?.length > 0 || analysis.actionable_tips?.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px',
            border: `1px solid ${COLORS.slate[200]}`,
          }}
        >
          {analysis.key_strengths && analysis.key_strengths.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{
                fontSize: '16px',
                fontWeight: 600,
                color: COLORS.green[500],
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <CheckCircle size={18} />
                Deine Stärken
              </h4>
              <ul style={{ margin: 0, paddingLeft: '24px' }}>
                {analysis.key_strengths.map((item, i) => (
                  <li key={i} style={{ fontSize: '14px', color: COLORS.slate[600], marginBottom: '8px', lineHeight: 1.5 }}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {analysis.actionable_tips && analysis.actionable_tips.length > 0 && (
            <div>
              <h4 style={{
                fontSize: '16px',
                fontWeight: 600,
                color: primaryAccent,
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <Lightbulb size={18} />
                Tipps zur Verbesserung
              </h4>
              <ul style={{ margin: 0, paddingLeft: '24px' }}>
                {analysis.actionable_tips.map((item, i) => (
                  <li key={i} style={{ fontSize: '14px', color: COLORS.slate[600], marginBottom: '8px', lineHeight: 1.5 }}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      )}

      {/* Summary (for video training) */}
      {isVideo && session?.summary_feedback && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{
            background: COLORS.slate[100],
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px',
          }}
        >
          <h4 style={{
            fontSize: '16px',
            fontWeight: 600,
            color: COLORS.slate[900],
            marginBottom: '12px',
          }}>
            Zusammenfassung
          </h4>
          <p style={{
            fontSize: '14px',
            color: COLORS.slate[600],
            lineHeight: 1.7,
            margin: 0,
          }}>
            {session.summary_feedback}
          </p>
        </motion.div>
      )}

      {/* Simulator Answers */}
      {isSimulator && answers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 style={{
            fontSize: '18px',
            fontWeight: 600,
            color: COLORS.slate[900],
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <MessageSquare size={20} color={primaryAccent} />
            Deine Antworten
          </h3>
          {answers.map((answer, index) => (
            <AnswerCard
              key={answer.id || index}
              answer={answer}
              index={index}
              primaryAccent={primaryAccent}
            />
          ))}
        </motion.div>
      )}

      {/* Simulator Summary */}
      {isSimulator && summaryFeedback && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Summary text */}
          {summaryFeedback.summary && (
            <div style={{
              background: COLORS.slate[100],
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '24px',
            }}>
              <h4 style={{
                fontSize: '16px',
                fontWeight: 600,
                color: COLORS.slate[900],
                marginBottom: '12px',
              }}>
                Zusammenfassung
              </h4>
              <p style={{
                fontSize: '14px',
                color: COLORS.slate[600],
                lineHeight: 1.7,
                margin: 0,
              }}>
                {summaryFeedback.summary}
              </p>
            </div>
          )}

          {/* Key takeaways */}
          {summaryFeedback.key_takeaways && summaryFeedback.key_takeaways.length > 0 && (
            <div style={{
              background: COLORS.green[100],
              borderRadius: '16px',
              padding: '24px',
            }}>
              <h4 style={{
                fontSize: '16px',
                fontWeight: 600,
                color: COLORS.green[500],
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <Lightbulb size={18} />
                Die wichtigsten Erkenntnisse
              </h4>
              <ul style={{
                margin: 0,
                paddingLeft: '24px',
                fontSize: '14px',
                color: COLORS.slate[700],
                lineHeight: 1.6,
              }}>
                {summaryFeedback.key_takeaways.map((takeaway, i) => (
                  <li key={i} style={{ marginBottom: '8px' }}>{takeaway}</li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      )}

      {/* Empty state */}
      {isSimulator && answers.length === 0 && !summaryFeedback && (
        <div style={{
          textAlign: 'center',
          padding: '48px 24px',
          background: COLORS.slate[100],
          borderRadius: '16px',
        }}>
          <AlertCircle size={48} color={COLORS.slate[400]} style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: COLORS.slate[700], marginBottom: '8px' }}>
            Keine Antworten vorhanden
          </h3>
          <p style={{ color: COLORS.slate[500] }}>
            Diese Session wurde möglicherweise nicht abgeschlossen.
          </p>
        </div>
      )}
    </div>
  );
};

export default TrainingSessionDetailView;
