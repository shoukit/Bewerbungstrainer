import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronRight,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  ThumbsUp,
  MessageSquare,
  Mic,
  ChevronDown,
  ChevronUp,
  Trophy,
  Check,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Loader2,
  Volume2,
  AlertCircle,
} from 'lucide-react';
import { formatDuration } from '@/utils/formatting';
import { usePartner } from '@/context/PartnerContext';
import { DEFAULT_BRANDING } from '@/config/partners';
import { useBranding } from '@/hooks/useBranding';

/**
 * Score Badge Component
 * Now displays scores on scale of 100 (converts from scale of 10)
 */
const ScoreBadge = ({ score, label, size = 'normal', primaryAccent, branding }) => {
  // Convert from scale of 10 to scale of 100
  const score100 = score != null ? score * 10 : null;

  const getScoreColor = (s) => {
    if (s >= 80) return branding.success;
    if (s >= 60) return primaryAccent;
    if (s >= 40) return branding.warning;
    return branding.error;
  };

  const color = getScoreColor(score100);
  const isLarge = size === 'large';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: branding.space[1],
    }}>
      <div style={{
        width: isLarge ? '80px' : '56px',
        height: isLarge ? '80px' : '56px',
        borderRadius: branding.radius.full,
        backgroundColor: `${color}15`,
        border: `3px solid ${color}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <span style={{
          fontSize: isLarge ? branding.fontSize['5xl'] : branding.fontSize['2xl'],
          fontWeight: branding.fontWeight.bold,
          color: color,
        }}>
          {score100 != null ? Math.round(score100) : '-'}
        </span>
      </div>
      <span style={{
        fontSize: isLarge ? branding.fontSize.base : branding.fontSize.xs,
        color: branding.textSecondary,
        fontWeight: branding.fontWeight.medium,
      }}>
        {label}
      </span>
    </div>
  );
};

/**
 * Collapsible Section Component
 */
const CollapsibleSection = ({ title, icon: Icon, children, defaultOpen = true, primaryAccent, branding }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div style={{
      borderRadius: branding.radius.lg,
      border: `1px solid ${branding.borderColor}`,
      backgroundColor: branding.cardBg,
      overflow: 'hidden',
      marginBottom: branding.space[4],
    }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: `${branding.space[4]} ${branding.space[5]}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          border: 'none',
          backgroundColor: 'transparent',
          cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: branding.space[3] }}>
          <Icon style={{ width: branding.iconSize.lg, height: branding.iconSize.lg, color: primaryAccent }} />
          <span style={{ fontSize: branding.fontSize.md, fontWeight: branding.fontWeight.semibold, color: branding.textMain }}>
            {title}
          </span>
        </div>
        {isOpen ? (
          <ChevronUp style={{ width: branding.iconSize.lg, height: branding.iconSize.lg, color: branding.textMuted }} />
        ) : (
          <ChevronDown style={{ width: branding.iconSize.lg, height: branding.iconSize.lg, color: branding.textMuted }} />
        )}
      </button>
      {isOpen && (
        <div style={{
          padding: `0 ${branding.space[5]} ${branding.space[5]} ${branding.space[5]}`,
          borderTop: `1px solid ${branding.cardBgHover}`,
          paddingTop: branding.space[4],
        }}>
          {children}
        </div>
      )}
    </div>
  );
};

/**
 * Feedback List Item
 */
const FeedbackItem = ({ text, type, primaryAccent, primaryAccentLight, branding }) => {
  const config = {
    strength: { icon: ThumbsUp, color: branding.success, bg: branding.successLight },
    improvement: { icon: AlertTriangle, color: branding.warning, bg: branding.warningLight },
    tip: { icon: Lightbulb, color: primaryAccent, bg: primaryAccentLight },
  };

  const { icon: Icon, color, bg } = config[type] || config.tip;

  return (
    <div style={{
      display: 'flex',
      gap: branding.space[3],
      padding: branding.space[3],
      borderRadius: branding.radius.md,
      backgroundColor: bg,
      marginBottom: branding.space[2],
    }}>
      <Icon style={{ width: branding.iconSize.md, height: branding.iconSize.md, color, flexShrink: 0, marginTop: '2px' }} />
      <span style={{ fontSize: branding.fontSize.base, color: branding.textSecondary, lineHeight: 1.5 }}>
        {text}
      </span>
    </div>
  );
};

/**
 * Audio Metrics Display
 */
const AudioMetricsDisplay = ({ metrics, branding }) => {
  if (!metrics) return null;

  const getSpeechRateLabel = (rate) => {
    switch (rate) {
      case 'optimal': return { label: 'Optimal', color: branding.success };
      case 'zu_schnell': return { label: 'Zu schnell', color: branding.warning };
      case 'zu_langsam': return { label: 'Zu langsam', color: branding.warning };
      default: return { label: rate || 'N/A', color: branding.textMuted };
    }
  };

  const speechRate = getSpeechRateLabel(metrics.speech_rate);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'niedrig': return branding.success;
      case 'mittel': return branding.warning;
      case 'hoch': return branding.error;
      default: return branding.textMuted;
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: branding.space[4] }}>
      {/* Speech Rate */}
      <div style={{
        padding: branding.space[4],
        borderRadius: branding.radius.md,
        backgroundColor: branding.cardBgHover,
      }}>
        <span style={{ fontSize: branding.fontSize.xs, color: branding.textMuted, display: 'block', marginBottom: branding.space[1] }}>
          Sprechtempo
        </span>
        <span style={{ fontSize: branding.fontSize.lg, fontWeight: branding.fontWeight.semibold, color: speechRate.color }}>
          {speechRate.label}
        </span>
      </div>

      {/* Filler Words */}
      {metrics.filler_words && (
        <div style={{
          padding: branding.space[4],
          borderRadius: branding.radius.md,
          backgroundColor: branding.cardBgHover,
        }}>
          <span style={{ fontSize: branding.fontSize.xs, color: branding.textMuted, display: 'block', marginBottom: branding.space[1] }}>
            Füllwörter
          </span>
          <span style={{
            fontSize: branding.fontSize.lg,
            fontWeight: 600,
            color: getSeverityColor(metrics.filler_words.severity),
          }}>
            {metrics.filler_words.count || 0}
            {metrics.filler_words.words?.length > 0 && (
              <span style={{ fontSize: '12px', fontWeight: 400, marginLeft: '8px' }}>
                ({metrics.filler_words.words.slice(0, 3).join(', ')})
              </span>
            )}
          </span>
        </div>
      )}

      {/* Confidence Score */}
      {metrics.confidence_score !== undefined && (
        <div style={{
          padding: '16px',
          borderRadius: '10px',
          backgroundColor: branding.cardBgHover,
        }}>
          <span style={{ fontSize: '12px', color: branding.textMuted, display: 'block', marginBottom: '4px' }}>
            Selbstbewusstsein
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              flex: 1,
              height: '8px',
              backgroundColor: branding.borderColor,
              borderRadius: '4px',
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${metrics.confidence_score}%`,
                height: '100%',
                backgroundColor: metrics.confidence_score >= 70 ? branding.success : branding.warning,
                borderRadius: '4px',
              }} />
            </div>
            <span style={{ fontSize: '14px', fontWeight: 600, color: branding.textSecondary }}>
              {metrics.confidence_score}%
            </span>
          </div>
        </div>
      )}

      {/* Clarity Score */}
      {metrics.clarity_score !== undefined && (
        <div style={{
          padding: '16px',
          borderRadius: '10px',
          backgroundColor: branding.cardBgHover,
        }}>
          <span style={{ fontSize: '12px', color: branding.textMuted, display: 'block', marginBottom: '4px' }}>
            Klarheit
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              flex: 1,
              height: '8px',
              backgroundColor: branding.borderColor,
              borderRadius: '4px',
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${metrics.clarity_score}%`,
                height: '100%',
                backgroundColor: metrics.clarity_score >= 70 ? branding.success : branding.warning,
                borderRadius: '4px',
              }} />
            </div>
            <span style={{ fontSize: '14px', fontWeight: 600, color: branding.textSecondary }}>
              {metrics.clarity_score}%
            </span>
          </div>
        </div>
      )}

      {/* Notes */}
      {metrics.notes && (
        <div style={{
          gridColumn: '1 / -1',
          padding: '12px 16px',
          borderRadius: '10px',
          backgroundColor: branding.primaryAccentLight,
          fontSize: '14px',
          color: branding.textSecondary,
          lineHeight: 1.5,
        }}>
          💡 {metrics.notes}
        </div>
      )}
    </div>
  );
};

/**
 * Compact Audio Player for feedback view
 */
const CompactAudioPlayer = ({ audioUrl, primaryAccent, branding }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!audioUrl) return;

    setIsLoading(true);
    setError(null);

    const audio = new Audio();
    audioRef.current = audio;

    const handleLoadedMetadata = () => {
      const dur = audio.duration;
      if (dur && isFinite(dur) && dur > 0) {
        setDuration(dur);
      }
      setIsLoading(false);
    };

    const handleCanPlayThrough = () => {
      setIsLoading(false);
      const dur = audio.duration;
      if (dur && isFinite(dur) && dur > 0) {
        setDuration(dur);
      }
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
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
      audio.src = '';
    };
  }, [audioUrl]);

  const togglePlay = () => {
    if (audioRef.current) {
      isPlaying ? audioRef.current.pause() : audioRef.current.play();
    }
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    if (audioRef.current && duration > 0) {
      audioRef.current.currentTime = percent * duration;
    }
  };

  const skip = (seconds) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(audioRef.current.currentTime + seconds, duration));
    }
  };

  if (!audioUrl) return null;

  if (error) {
    return (
      <div style={{
        padding: '12px 16px',
        background: branding.cardBgHover,
        borderRadius: '10px',
        color: branding.textMuted,
        fontSize: '13px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <AlertCircle size={16} /> {error}
      </div>
    );
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div style={{
      background: branding.cardBg,
      borderRadius: '12px',
      padding: '16px',
      border: `1px solid ${branding.borderColor}`,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '12px',
        fontSize: '13px',
        fontWeight: 600,
        color: branding.textSecondary,
      }}>
        <Volume2 size={16} color={primaryAccent} />
        Deine Aufnahme
      </div>

      {/* Progress bar */}
      <div
        onClick={handleSeek}
        style={{
          height: '6px',
          background: branding.borderColor,
          borderRadius: '3px',
          cursor: 'pointer',
          marginBottom: '12px',
        }}
      >
        <div style={{
          width: `${progressPercent}%`,
          height: '100%',
          background: primaryAccent,
          borderRadius: '3px',
          transition: 'width 0.1s',
        }} />
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
        <button
          onClick={() => skip(-10)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '6px',
            color: branding.textMuted,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <SkipBack size={18} />
        </button>

        <button
          onClick={togglePlay}
          disabled={isLoading}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: primaryAccent,
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
            <Loader2 size={20} color="#ffffff" style={{ animation: 'spin 1s linear infinite' }} />
          ) : isPlaying ? (
            <Pause size={20} color="#ffffff" fill="#ffffff" />
          ) : (
            <Play size={20} color="#ffffff" fill="#ffffff" style={{ marginLeft: '2px' }} />
          )}
        </button>

        <button
          onClick={() => skip(10)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '6px',
            color: branding.textMuted,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <SkipForward size={18} />
        </button>
      </div>

      {/* Time display */}
      <div style={{
        textAlign: 'center',
        marginTop: '8px',
        fontSize: '12px',
        color: branding.textMuted,
      }}>
        {formatDuration(currentTime)} / {formatDuration(duration)}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

/**
 * Immediate Feedback Component
 *
 * Displays transcript, feedback, and audio metrics after each answer
 */
const ImmediateFeedback = ({
  transcript,
  feedback,
  audioMetrics,
  audioUrl,
  onRetry,
  onNext,
  onComplete,
  isLastQuestion,
  hideButtons = false,
}) => {
  // Partner theming
  const { branding } = usePartner();
  const b = useBranding();
  const buttonGradient = branding?.['--button-gradient'] || branding?.['--header-gradient'] || DEFAULT_BRANDING['--header-gradient'];
  const primaryAccent = branding?.['--primary-accent'] || DEFAULT_BRANDING['--primary-accent'];
  const primaryAccentLight = branding?.['--primary-accent-light'] || DEFAULT_BRANDING['--primary-accent-light'];

  // Parse feedback if it's a string
  const parsedFeedback = typeof feedback === 'string' ? JSON.parse(feedback) : feedback;

  return (
    <div style={{
      backgroundColor: b.cardBgHover,
      borderRadius: b.radius.xl,
      padding: b.space[6],
    }}>
      {/* Summary Header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '20px',
        marginBottom: '24px',
        padding: b.space[5],
        backgroundColor: b.cardBg,
        borderRadius: b.radius.lg,
      }}>
        <ScoreBadge
          score={parsedFeedback?.scores?.overall}
          label="Gesamt"
          size="large"
          primaryAccent={primaryAccent}
          branding={b}
        />
        <div style={{ flex: 1 }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: 600,
            color: b.textMain,
            margin: '0 0 8px 0',
          }}>
            Feedback zu deiner Antwort
          </h3>
          <p style={{
            fontSize: '14px',
            color: b.textSecondary,
            margin: 0,
            lineHeight: 1.5,
          }}>
            {parsedFeedback?.summary || 'Deine Antwort wurde analysiert.'}
          </p>
        </div>
      </div>

      {/* Score Breakdown */}
      {parsedFeedback?.scores && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '32px',
          padding: '16px',
          marginBottom: '16px',
          backgroundColor: b.cardBg,
          borderRadius: '12px',
        }}>
          <ScoreBadge score={parsedFeedback.scores.content} label="Inhalt" primaryAccent={primaryAccent} branding={b} />
          <ScoreBadge score={parsedFeedback.scores.structure} label="Struktur" primaryAccent={primaryAccent} branding={b} />
          <ScoreBadge score={parsedFeedback.scores.relevance} label="Relevanz" primaryAccent={primaryAccent} branding={b} />
        </div>
      )}

      {/* Transcript */}
      <CollapsibleSection title="Transkript" icon={MessageSquare} defaultOpen={true} primaryAccent={primaryAccent} branding={b}>
        <div style={{
          padding: '16px',
          borderRadius: '10px',
          backgroundColor: b.cardBgHover,
          fontStyle: 'italic',
          color: b.textSecondary,
          lineHeight: 1.6,
          fontSize: '14px',
        }}>
          "{transcript || 'Keine Transkription verfügbar.'}"
        </div>

        {/* Audio Player - below transcript */}
        {audioUrl && (
          <div style={{ marginTop: '16px' }}>
            <CompactAudioPlayer audioUrl={audioUrl} primaryAccent={primaryAccent} branding={b} />
          </div>
        )}
      </CollapsibleSection>

      {/* Strengths */}
      {parsedFeedback?.strengths?.length > 0 && (
        <CollapsibleSection title="Stärken" icon={ThumbsUp} defaultOpen={true} primaryAccent={primaryAccent} branding={b}>
          {parsedFeedback.strengths.map((strength, i) => (
            <FeedbackItem key={i} text={strength} type="strength" primaryAccent={primaryAccent} primaryAccentLight={primaryAccentLight} branding={b} />
          ))}
        </CollapsibleSection>
      )}

      {/* Improvements */}
      {parsedFeedback?.improvements?.length > 0 && (
        <CollapsibleSection title="Verbesserungen" icon={AlertTriangle} defaultOpen={true} primaryAccent={primaryAccent} branding={b}>
          {parsedFeedback.improvements.map((improvement, i) => (
            <FeedbackItem key={i} text={improvement} type="improvement" primaryAccent={primaryAccent} primaryAccentLight={primaryAccentLight} branding={b} />
          ))}
        </CollapsibleSection>
      )}

      {/* Tips */}
      {parsedFeedback?.tips?.length > 0 && (
        <CollapsibleSection title="Tipps" icon={Lightbulb} defaultOpen={false} primaryAccent={primaryAccent} branding={b}>
          {parsedFeedback.tips.map((tip, i) => (
            <FeedbackItem key={i} text={tip} type="tip" primaryAccent={primaryAccent} primaryAccentLight={primaryAccentLight} branding={b} />
          ))}
        </CollapsibleSection>
      )}

      {/* Audio Metrics */}
      {audioMetrics && (
        <CollapsibleSection title="Sprechanalyse" icon={Mic} defaultOpen={false} primaryAccent={primaryAccent} branding={b}>
          <AudioMetricsDisplay metrics={audioMetrics} branding={b} />
        </CollapsibleSection>
      )}

      {/* Action Buttons - only show when not hidden */}
      {!hideButtons && (
        <div style={{
          display: 'flex',
          gap: '12px',
          marginTop: '24px',
          justifyContent: 'flex-end',
          flexWrap: 'wrap',
        }}>
          {onRetry && (
            <button
              onClick={onRetry}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '14px 24px',
                borderRadius: '12px',
                border: `2px solid ${b.borderColor}`,
                backgroundColor: b.cardBg,
                color: b.textSecondary,
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = primaryAccent;
                e.target.style.color = primaryAccent;
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = b.borderColor;
                e.target.style.color = b.textSecondary;
              }}
            >
              <RotateCcw style={{ width: '18px', height: '18px' }} />
              Nochmal versuchen
            </button>
          )}

          {/* Nächste Frage / Training abschließen */}
          <button
            onClick={isLastQuestion ? onComplete : onNext}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '14px 24px',
              borderRadius: '12px',
              border: 'none',
              background: buttonGradient,
              color: 'white',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: `0 4px 12px ${primaryAccent}4d`,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = `0 6px 16px ${primaryAccent}66`;
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'none';
              e.target.style.boxShadow = `0 4px 12px ${primaryAccent}4d`;
            }}
          >
            {isLastQuestion ? (
              <>
                <Trophy style={{ width: '18px', height: '18px' }} />
                Training abschließen
              </>
            ) : (
              <>
                Nächste Frage
                <ChevronRight style={{ width: '18px', height: '18px' }} />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default ImmediateFeedback;
