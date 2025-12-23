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
import { useBranding } from '@/hooks/useBranding';
import { COLORS, getScoreColor } from '@/config/colors';

/**
 * Score Badge for Summary
 * Displays scores on scale of 100 (converts from scale of 10)
 */
const SummaryScore = ({ score, label, primaryAccent, b }) => {
  // Convert from scale of 10 to scale of 100
  const score100 = score != null ? score * 10 : null;

  // Use centralized getScoreColor from @/config/colors
  const color = getScoreColor(score100, primaryAccent);

  return (
    <div style={{
      textAlign: 'center',
      padding: b.space[4],
      backgroundColor: COLORS.slate[100],
      borderRadius: b.radius.lg,
    }}>
      <div style={{
        fontSize: b.fontSize['4xl'],
        fontWeight: 700,
        color: color,
        marginBottom: '4px',
      }}>
        {score100 != null ? Math.round(score100) : '-'}
      </div>
      <div style={{
        fontSize: b.fontSize.sm,
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
const StatItem = ({ icon: Icon, value, label, primaryAccent, b }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: b.space[3],
    padding: `${b.space[3]} ${b.space[4]}`,
    backgroundColor: COLORS.slate[100],
    borderRadius: b.radius.md,
  }}>
    <Icon style={{ width: '20px', height: '20px', color: primaryAccent }} />
    <div>
      <div style={{ fontSize: b.fontSize.xl, fontWeight: 600, color: COLORS.slate[900] }}>{value}</div>
      <div style={{ fontSize: b.fontSize.xs, color: COLORS.slate[500] }}>{label}</div>
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
  const b = useBranding();

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
    <div style={{ padding: b.space[6], maxWidth: '640px', margin: '0 auto' }}>
      {/* Success Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '32px',
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: b.headerGradient,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          boxShadow: `0 8px 24px ${b.primaryAccent}4d`,
        }}>
          <Trophy style={{ width: '40px', height: '40px', color: 'white' }} />
        </div>
        <h1 style={{
          fontSize: b.fontSize['5xl'],
          fontWeight: 700,
          color: COLORS.slate[900],
          margin: '0 0 8px 0',
        }}>
          Training abgeschlossen! {grade.emoji}
        </h1>
        <p style={{
          fontSize: b.fontSize.lg,
          color: COLORS.slate[600],
          margin: 0,
        }}>
          {scenario?.title || 'Skill Training'} - {grade.text}
        </p>
      </div>

      {/* Overall Score Card */}
      <div style={{
        padding: b.space[6],
        borderRadius: b.radius.xl,
        backgroundColor: 'white',
        border: `1px solid ${COLORS.slate[200]}`,
        textAlign: 'center',
        marginBottom: b.space[6],
      }}>
        <div style={{
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          border: `6px solid ${b.primaryAccent}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          backgroundColor: b.primaryAccentLight,
        }}>
          <span style={{
            fontSize: b.fontSize['5xl'],
            fontWeight: 700,
            color: b.primaryAccent,
          }}>
            {overallScore ? Math.round(overallScore) : '-'}
          </span>
        </div>
        <p style={{
          fontSize: b.fontSize.base,
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
        gap: b.space[3],
        marginBottom: b.space[6],
      }}>
        <StatItem
          icon={CheckCircle}
          value={`${session.completed_questions ?? 0}/${session.total_questions || '-'}`}
          label="Fragen"
          primaryAccent={b.primaryAccent}
          b={b}
        />
        <StatItem
          icon={Target}
          value={summaryFeedback?.average_content_score ? Math.round(summaryFeedback.average_content_score * 10) : '-'}
          label="Ø Inhalt"
          primaryAccent={b.primaryAccent}
          b={b}
        />
        <StatItem
          icon={Star}
          value={summaryFeedback?.average_delivery_score ? Math.round(summaryFeedback.average_delivery_score * 10) : '-'}
          label="Ø Präsentation"
          primaryAccent={b.primaryAccent}
          b={b}
        />
      </div>

      {/* Score Breakdown */}
      {summaryFeedback?.scores && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: b.space[3],
          marginBottom: b.space[6],
        }}>
          <SummaryScore score={summaryFeedback.scores.content} label="Inhalt" primaryAccent={b.primaryAccent} b={b} />
          <SummaryScore score={summaryFeedback.scores.structure} label="Struktur" primaryAccent={b.primaryAccent} b={b} />
          <SummaryScore score={summaryFeedback.scores.relevance} label="Relevanz" primaryAccent={b.primaryAccent} b={b} />
          <SummaryScore score={summaryFeedback.scores.delivery} label="Präsentation" primaryAccent={b.primaryAccent} b={b} />
        </div>
      )}

      {/* Summary Feedback */}
      {summaryFeedback?.summary && (
        <div style={{
          padding: b.space[5],
          borderRadius: b.radius.lg,
          backgroundColor: COLORS.slate[100],
          marginBottom: b.space[6],
        }}>
          <h3 style={{
            fontSize: b.fontSize.base,
            fontWeight: 600,
            color: COLORS.slate[700],
            margin: '0 0 8px 0',
          }}>
            Zusammenfassung
          </h3>
          <p style={{
            fontSize: b.fontSize.base,
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
          padding: b.space[5],
          borderRadius: b.radius.lg,
          backgroundColor: COLORS.green[100],
          marginBottom: b.space[6],
        }}>
          <h3 style={{
            fontSize: b.fontSize.base,
            fontWeight: 600,
            color: COLORS.green[500],
            margin: '0 0 12px 0',
          }}>
            💡 Die wichtigsten Erkenntnisse
          </h3>
          <ul style={{
            margin: 0,
            paddingLeft: b.space[5],
            color: COLORS.slate[700],
            fontSize: b.fontSize.base,
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
        gap: b.space[3],
        marginTop: '32px',
      }}>
        <button
          onClick={onBackToDashboard}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: b.space[2],
            padding: `${b.space[3.5]} ${b.space[6]}`,
            borderRadius: b.radius.lg,
            border: `2px solid ${COLORS.slate[300]}`,
            backgroundColor: 'white',
            color: COLORS.slate[700],
            fontSize: b.fontSize.base,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.target.style.borderColor = b.primaryAccent;
            e.target.style.color = b.primaryAccent;
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
            gap: b.space[2],
            padding: `${b.space[3.5]} ${b.space[6]}`,
            borderRadius: b.radius.lg,
            border: 'none',
            background: b.buttonGradient,
            color: 'white',
            fontSize: b.fontSize.base,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: `0 4px 12px ${b.primaryAccent}4d`,
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = `0 6px 16px ${b.primaryAccent}66`;
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'none';
            e.target.style.boxShadow = `0 4px 12px ${b.primaryAccent}4d`;
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
