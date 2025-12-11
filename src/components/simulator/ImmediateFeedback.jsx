import React, { useState } from 'react';
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
  Check
} from 'lucide-react';
import { usePartner } from '@/context/PartnerContext';
import { DEFAULT_BRANDING } from '@/config/partners';

/**
 * Fallback theme colors
 */
const COLORS = {
  slate: { 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1', 400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155', 800: '#1e293b', 900: '#0f172a' },
  red: { 500: '#ef4444', 100: '#fee2e2' },
  green: { 500: '#22c55e', 100: '#dcfce7' },
  amber: { 500: '#f59e0b', 100: '#fef3c7' },
  purple: { 500: '#a855f7', 100: '#f3e8ff' },
};

/**
 * Score Badge Component
 * Now displays scores on scale of 100 (converts from scale of 10)
 */
const ScoreBadge = ({ score, label, size = 'normal', primaryAccent }) => {
  // Convert from scale of 10 to scale of 100
  const score100 = score != null ? score * 10 : null;

  const getScoreColor = (s) => {
    if (s >= 80) return COLORS.green[500];
    if (s >= 60) return primaryAccent;
    if (s >= 40) return COLORS.amber[500];
    return COLORS.red[500];
  };

  const color = getScoreColor(score100);
  const isLarge = size === 'large';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '4px',
    }}>
      <div style={{
        width: isLarge ? '80px' : '56px',
        height: isLarge ? '80px' : '56px',
        borderRadius: '50%',
        backgroundColor: `${color}15`,
        border: `3px solid ${color}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <span style={{
          fontSize: isLarge ? '28px' : '20px',
          fontWeight: 700,
          color: color,
        }}>
          {score100 != null ? Math.round(score100) : '-'}
        </span>
      </div>
      <span style={{
        fontSize: isLarge ? '14px' : '12px',
        color: COLORS.slate[600],
        fontWeight: 500,
      }}>
        {label}
      </span>
    </div>
  );
};

/**
 * Collapsible Section Component
 */
const CollapsibleSection = ({ title, icon: Icon, children, defaultOpen = true, primaryAccent }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div style={{
      borderRadius: '12px',
      border: `1px solid ${COLORS.slate[200]}`,
      backgroundColor: 'white',
      overflow: 'hidden',
      marginBottom: '16px',
    }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          border: 'none',
          backgroundColor: 'transparent',
          cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Icon style={{ width: '20px', height: '20px', color: primaryAccent }} />
          <span style={{ fontSize: '15px', fontWeight: 600, color: COLORS.slate[800] }}>
            {title}
          </span>
        </div>
        {isOpen ? (
          <ChevronUp style={{ width: '20px', height: '20px', color: COLORS.slate[400] }} />
        ) : (
          <ChevronDown style={{ width: '20px', height: '20px', color: COLORS.slate[400] }} />
        )}
      </button>
      {isOpen && (
        <div style={{
          padding: '0 20px 20px 20px',
          borderTop: `1px solid ${COLORS.slate[100]}`,
          paddingTop: '16px',
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
const FeedbackItem = ({ text, type, primaryAccent, primaryAccentLight }) => {
  const config = {
    strength: { icon: ThumbsUp, color: COLORS.green[500], bg: COLORS.green[100] },
    improvement: { icon: AlertTriangle, color: COLORS.amber[500], bg: COLORS.amber[100] },
    tip: { icon: Lightbulb, color: primaryAccent, bg: primaryAccentLight },
  };

  const { icon: Icon, color, bg } = config[type] || config.tip;

  return (
    <div style={{
      display: 'flex',
      gap: '12px',
      padding: '12px',
      borderRadius: '10px',
      backgroundColor: bg,
      marginBottom: '8px',
    }}>
      <Icon style={{ width: '18px', height: '18px', color, flexShrink: 0, marginTop: '2px' }} />
      <span style={{ fontSize: '14px', color: COLORS.slate[700], lineHeight: 1.5 }}>
        {text}
      </span>
    </div>
  );
};

/**
 * Audio Metrics Display
 */
const AudioMetricsDisplay = ({ metrics }) => {
  if (!metrics) return null;

  const getSpeechRateLabel = (rate) => {
    switch (rate) {
      case 'optimal': return { label: 'Optimal', color: COLORS.green[500] };
      case 'zu_schnell': return { label: 'Zu schnell', color: COLORS.amber[500] };
      case 'zu_langsam': return { label: 'Zu langsam', color: COLORS.amber[500] };
      default: return { label: rate || 'N/A', color: COLORS.slate[500] };
    }
  };

  const speechRate = getSpeechRateLabel(metrics.speech_rate);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'niedrig': return COLORS.green[500];
      case 'mittel': return COLORS.amber[500];
      case 'hoch': return COLORS.red[500];
      default: return COLORS.slate[500];
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
      {/* Speech Rate */}
      <div style={{
        padding: '16px',
        borderRadius: '10px',
        backgroundColor: COLORS.slate[100],
      }}>
        <span style={{ fontSize: '12px', color: COLORS.slate[500], display: 'block', marginBottom: '4px' }}>
          Sprechtempo
        </span>
        <span style={{ fontSize: '16px', fontWeight: 600, color: speechRate.color }}>
          {speechRate.label}
        </span>
      </div>

      {/* Filler Words */}
      {metrics.filler_words && (
        <div style={{
          padding: '16px',
          borderRadius: '10px',
          backgroundColor: COLORS.slate[100],
        }}>
          <span style={{ fontSize: '12px', color: COLORS.slate[500], display: 'block', marginBottom: '4px' }}>
            Füllwörter
          </span>
          <span style={{
            fontSize: '16px',
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
          backgroundColor: COLORS.slate[100],
        }}>
          <span style={{ fontSize: '12px', color: COLORS.slate[500], display: 'block', marginBottom: '4px' }}>
            Selbstbewusstsein
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              flex: 1,
              height: '8px',
              backgroundColor: COLORS.slate[200],
              borderRadius: '4px',
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${metrics.confidence_score}%`,
                height: '100%',
                backgroundColor: metrics.confidence_score >= 70 ? COLORS.green[500] : COLORS.amber[500],
                borderRadius: '4px',
              }} />
            </div>
            <span style={{ fontSize: '14px', fontWeight: 600, color: COLORS.slate[700] }}>
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
          backgroundColor: COLORS.slate[100],
        }}>
          <span style={{ fontSize: '12px', color: COLORS.slate[500], display: 'block', marginBottom: '4px' }}>
            Klarheit
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              flex: 1,
              height: '8px',
              backgroundColor: COLORS.slate[200],
              borderRadius: '4px',
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${metrics.clarity_score}%`,
                height: '100%',
                backgroundColor: metrics.clarity_score >= 70 ? COLORS.green[500] : COLORS.amber[500],
                borderRadius: '4px',
              }} />
            </div>
            <span style={{ fontSize: '14px', fontWeight: 600, color: COLORS.slate[700] }}>
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
          backgroundColor: COLORS.purple[100],
          fontSize: '14px',
          color: COLORS.slate[700],
          lineHeight: 1.5,
        }}>
          💡 {metrics.notes}
        </div>
      )}
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
  onRetry,
  onNext,
  onComplete,
  isLastQuestion,
  hideButtons = false,
}) => {
  // Partner theming
  const { branding } = usePartner();
  const buttonGradient = branding?.['--button-gradient'] || branding?.['--header-gradient'] || DEFAULT_BRANDING['--header-gradient'];
  const primaryAccent = branding?.['--primary-accent'] || DEFAULT_BRANDING['--primary-accent'];
  const primaryAccentLight = branding?.['--primary-accent-light'] || DEFAULT_BRANDING['--primary-accent-light'];

  // Parse feedback if it's a string
  const parsedFeedback = typeof feedback === 'string' ? JSON.parse(feedback) : feedback;

  return (
    <div style={{
      backgroundColor: COLORS.slate[100],
      borderRadius: '16px',
      padding: '24px',
    }}>
      {/* Summary Header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '20px',
        marginBottom: '24px',
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '12px',
      }}>
        <ScoreBadge
          score={parsedFeedback?.scores?.overall}
          label="Gesamt"
          size="large"
          primaryAccent={primaryAccent}
        />
        <div style={{ flex: 1 }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: 600,
            color: COLORS.slate[900],
            margin: '0 0 8px 0',
          }}>
            Feedback zu deiner Antwort
          </h3>
          <p style={{
            fontSize: '14px',
            color: COLORS.slate[600],
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
          backgroundColor: 'white',
          borderRadius: '12px',
        }}>
          <ScoreBadge score={parsedFeedback.scores.content} label="Inhalt" primaryAccent={primaryAccent} />
          <ScoreBadge score={parsedFeedback.scores.structure} label="Struktur" primaryAccent={primaryAccent} />
          <ScoreBadge score={parsedFeedback.scores.relevance} label="Relevanz" primaryAccent={primaryAccent} />
        </div>
      )}

      {/* Transcript */}
      <CollapsibleSection title="Transkript" icon={MessageSquare} defaultOpen={true} primaryAccent={primaryAccent}>
        <div style={{
          padding: '16px',
          borderRadius: '10px',
          backgroundColor: COLORS.slate[100],
          fontStyle: 'italic',
          color: COLORS.slate[700],
          lineHeight: 1.6,
          fontSize: '14px',
        }}>
          "{transcript || 'Keine Transkription verfügbar.'}"
        </div>
      </CollapsibleSection>

      {/* Strengths */}
      {parsedFeedback?.strengths?.length > 0 && (
        <CollapsibleSection title="Stärken" icon={ThumbsUp} defaultOpen={true} primaryAccent={primaryAccent}>
          {parsedFeedback.strengths.map((strength, i) => (
            <FeedbackItem key={i} text={strength} type="strength" primaryAccent={primaryAccent} primaryAccentLight={primaryAccentLight} />
          ))}
        </CollapsibleSection>
      )}

      {/* Improvements */}
      {parsedFeedback?.improvements?.length > 0 && (
        <CollapsibleSection title="Verbesserungen" icon={AlertTriangle} defaultOpen={true} primaryAccent={primaryAccent}>
          {parsedFeedback.improvements.map((improvement, i) => (
            <FeedbackItem key={i} text={improvement} type="improvement" primaryAccent={primaryAccent} primaryAccentLight={primaryAccentLight} />
          ))}
        </CollapsibleSection>
      )}

      {/* Tips */}
      {parsedFeedback?.tips?.length > 0 && (
        <CollapsibleSection title="Tipps" icon={Lightbulb} defaultOpen={false} primaryAccent={primaryAccent}>
          {parsedFeedback.tips.map((tip, i) => (
            <FeedbackItem key={i} text={tip} type="tip" primaryAccent={primaryAccent} primaryAccentLight={primaryAccentLight} />
          ))}
        </CollapsibleSection>
      )}

      {/* Audio Metrics */}
      {audioMetrics && (
        <CollapsibleSection title="Sprechanalyse" icon={Mic} defaultOpen={false} primaryAccent={primaryAccent}>
          <AudioMetricsDisplay metrics={audioMetrics} />
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
                border: `2px solid ${COLORS.slate[300]}`,
                backgroundColor: 'white',
                color: COLORS.slate[700],
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
                e.target.style.borderColor = COLORS.slate[300];
                e.target.style.color = COLORS.slate[700];
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
