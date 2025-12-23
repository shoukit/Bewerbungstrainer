import React from 'react';
import {
  Trophy,
  ArrowLeft,
  RotateCcw,
  Download,
  Star,
  CheckCircle,
  Clock,
  Target
} from 'lucide-react';
import { usePartner } from '@/context/PartnerContext';
import { DEFAULT_BRANDING } from '@/config/partners';
import { COLORS, getScoreColor } from '@/config/colors';

/**
 * Score Badge for Summary
 * Displays scores on scale of 100 (converts from scale of 10)
 */
const SummaryScore = ({ score, label, primaryAccent }) => {
  // Convert from scale of 10 to scale of 100
  const score100 = score != null ? score * 10 : null;

  // Use centralized getScoreColor from @/config/colors
  const color = getScoreColor(score100, primaryAccent);

  return (
    <div style={{
      textAlign: 'center',
      padding: '16px',
      backgroundColor: COLORS.slate[100],
      borderRadius: '12px',
    }}>
      <div style={{
        fontSize: '32px',
        fontWeight: 700,
        color: color,
        marginBottom: '4px',
      }}>
        {score100 != null ? Math.round(score100) : '-'}
      </div>
      <div style={{
        fontSize: '13px',
        color: COLORS.slate[600],
      }}>
        {label}
      </div>
    </div>
  );
};

/**
 * Stat Item
 */
const StatItem = ({ icon: Icon, value, label, primaryAccent }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    backgroundColor: COLORS.slate[100],
    borderRadius: '10px',
  }}>
    <Icon style={{ width: '20px', height: '20px', color: primaryAccent }} />
    <div>
      <div style={{ fontSize: '18px', fontWeight: 600, color: COLORS.slate[900] }}>{value}</div>
      <div style={{ fontSize: '12px', color: COLORS.slate[500] }}>{label}</div>
    </div>
  </div>
);

/**
 * Session Complete Component
 *
 * Displays summary after completing all questions
 */
const SessionComplete = ({ session, scenario, onBackToDashboard, onStartNew }) => {
  // Partner theming
  const { branding } = usePartner();
  const headerGradient = branding?.['--header-gradient'] || DEFAULT_BRANDING['--header-gradient'];
  const buttonGradient = branding?.['--button-gradient'] || headerGradient;
  const primaryAccent = branding?.['--primary-accent'] || DEFAULT_BRANDING['--primary-accent'];
  const primaryAccentLight = branding?.['--primary-accent-light'] || DEFAULT_BRANDING['--primary-accent-light'];

  // Parse summary feedback if it's a string
  // Backend returns summary_feedback, not summary_feedback_json
  const rawSummary = session.summary_feedback || session.summary_feedback_json;
  const summaryFeedback = rawSummary
    ? (typeof rawSummary === 'string'
        ? JSON.parse(rawSummary)
        : rawSummary)
    : null;

  // Convert overall score from scale of 10 to scale of 100
  const rawScore = session.overall_score || summaryFeedback?.overall_score || 0;
  const overallScore = rawScore <= 10 ? rawScore * 10 : rawScore;

  const getGradeLabel = (score) => {
    if (score >= 90) return { text: 'Ausgezeichnet!', emoji: '🌟' };
    if (score >= 80) return { text: 'Sehr gut!', emoji: '🎉' };
    if (score >= 70) return { text: 'Gut!', emoji: '👏' };
    if (score >= 60) return { text: 'Solide Leistung', emoji: '👍' };
    if (score >= 50) return { text: 'Ausbaufähig', emoji: '💪' };
    return { text: 'Weiter üben!', emoji: '📚' };
  };

  const grade = getGradeLabel(overallScore);

  return (
    <div style={{ padding: '24px', maxWidth: '640px', margin: '0 auto' }}>
      {/* Success Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '32px',
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: headerGradient,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          boxShadow: `0 8px 24px ${primaryAccent}4d`,
        }}>
          <Trophy style={{ width: '40px', height: '40px', color: 'white' }} />
        </div>
        <h1 style={{
          fontSize: '28px',
          fontWeight: 700,
          color: COLORS.slate[900],
          margin: '0 0 8px 0',
        }}>
          Training abgeschlossen! {grade.emoji}
        </h1>
        <p style={{
          fontSize: '16px',
          color: COLORS.slate[600],
          margin: 0,
        }}>
          {scenario?.title || 'Skill Training'} - {grade.text}
        </p>
      </div>

      {/* Overall Score Card */}
      <div style={{
        padding: '24px',
        borderRadius: '16px',
        backgroundColor: 'white',
        border: `1px solid ${COLORS.slate[200]}`,
        textAlign: 'center',
        marginBottom: '24px',
      }}>
        <div style={{
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          border: `6px solid ${primaryAccent}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          backgroundColor: primaryAccentLight,
        }}>
          <span style={{
            fontSize: '48px',
            fontWeight: 700,
            color: primaryAccent,
          }}>
            {overallScore ? Math.round(overallScore) : '-'}
          </span>
        </div>
        <p style={{
          fontSize: '14px',
          color: COLORS.slate[500],
          margin: 0,
        }}>
          {overallScore ? 'Gesamtbewertung (von 100)' : 'Keine Fragen beantwortet'}
        </p>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px',
        marginBottom: '24px',
      }}>
        <StatItem
          icon={CheckCircle}
          value={`${session.completed_questions ?? 0}/${session.total_questions || '-'}`}
          label="Fragen"
          primaryAccent={primaryAccent}
        />
        <StatItem
          icon={Target}
          value={summaryFeedback?.average_content_score ? Math.round(summaryFeedback.average_content_score * 10) : '-'}
          label="Ø Inhalt"
          primaryAccent={primaryAccent}
        />
        <StatItem
          icon={Star}
          value={summaryFeedback?.average_delivery_score ? Math.round(summaryFeedback.average_delivery_score * 10) : '-'}
          label="Ø Präsentation"
          primaryAccent={primaryAccent}
        />
      </div>

      {/* Score Breakdown */}
      {summaryFeedback?.scores && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px',
          marginBottom: '24px',
        }}>
          <SummaryScore score={summaryFeedback.scores.content} label="Inhalt" primaryAccent={primaryAccent} />
          <SummaryScore score={summaryFeedback.scores.structure} label="Struktur" primaryAccent={primaryAccent} />
          <SummaryScore score={summaryFeedback.scores.relevance} label="Relevanz" primaryAccent={primaryAccent} />
          <SummaryScore score={summaryFeedback.scores.delivery} label="Präsentation" primaryAccent={primaryAccent} />
        </div>
      )}

      {/* Summary Feedback */}
      {summaryFeedback?.summary && (
        <div style={{
          padding: '20px',
          borderRadius: '12px',
          backgroundColor: COLORS.slate[100],
          marginBottom: '24px',
        }}>
          <h3 style={{
            fontSize: '14px',
            fontWeight: 600,
            color: COLORS.slate[700],
            margin: '0 0 8px 0',
          }}>
            Zusammenfassung
          </h3>
          <p style={{
            fontSize: '14px',
            color: COLORS.slate[600],
            margin: 0,
            lineHeight: 1.6,
          }}>
            {summaryFeedback.summary}
          </p>
        </div>
      )}

      {/* Key Takeaways */}
      {summaryFeedback?.key_takeaways?.length > 0 && (
        <div style={{
          padding: '20px',
          borderRadius: '12px',
          backgroundColor: COLORS.green[100],
          marginBottom: '24px',
        }}>
          <h3 style={{
            fontSize: '14px',
            fontWeight: 600,
            color: COLORS.green[500],
            margin: '0 0 12px 0',
          }}>
            💡 Die wichtigsten Erkenntnisse
          </h3>
          <ul style={{
            margin: 0,
            paddingLeft: '20px',
            color: COLORS.slate[700],
            fontSize: '14px',
            lineHeight: 1.6,
          }}>
            {summaryFeedback.key_takeaways.map((takeaway, i) => (
              <li key={i} style={{ marginBottom: '8px' }}>{takeaway}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginTop: '32px',
      }}>
        <button
          onClick={onBackToDashboard}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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
          <ArrowLeft style={{ width: '18px', height: '18px' }} />
          Zur Übersicht
        </button>
        <button
          onClick={onStartNew}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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
          <RotateCcw style={{ width: '18px', height: '18px' }} />
          Nochmal üben
        </button>
      </div>
    </div>
  );
};

export default SessionComplete;
