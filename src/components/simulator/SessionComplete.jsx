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

/**
 * Ocean theme colors
 */
const COLORS = {
  blue: { 500: '#4A9EC9', 600: '#3A7FA7', 700: '#2D6485' },
  teal: { 500: '#3DA389', 600: '#2E8A72' },
  slate: { 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1', 400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155', 800: '#1e293b', 900: '#0f172a' },
  green: { 500: '#22c55e', 100: '#dcfce7' },
  amber: { 500: '#f59e0b', 100: '#fef3c7' },
};

/**
 * Score Badge for Summary
 */
const SummaryScore = ({ score, label }) => {
  const getScoreColor = (s) => {
    if (s >= 8) return COLORS.green[500];
    if (s >= 6) return COLORS.blue[500];
    if (s >= 4) return COLORS.amber[500];
    return '#ef4444';
  };

  const color = getScoreColor(score);

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
        {score?.toFixed(1) || '-'}
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
const StatItem = ({ icon: Icon, value, label }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    backgroundColor: COLORS.slate[100],
    borderRadius: '10px',
  }}>
    <Icon style={{ width: '20px', height: '20px', color: COLORS.blue[500] }} />
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
  // Parse summary feedback if it's a string
  const summaryFeedback = session.summary_feedback_json
    ? (typeof session.summary_feedback_json === 'string'
        ? JSON.parse(session.summary_feedback_json)
        : session.summary_feedback_json)
    : null;

  const overallScore = session.overall_score || summaryFeedback?.overall_score || 0;

  const getGradeLabel = (score) => {
    if (score >= 9) return { text: 'Ausgezeichnet!', emoji: '🌟' };
    if (score >= 8) return { text: 'Sehr gut!', emoji: '🎉' };
    if (score >= 7) return { text: 'Gut!', emoji: '👏' };
    if (score >= 6) return { text: 'Solide Leistung', emoji: '👍' };
    if (score >= 5) return { text: 'Ausbaufähig', emoji: '💪' };
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
          background: `linear-gradient(135deg, ${COLORS.blue[500]} 0%, ${COLORS.teal[500]} 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          boxShadow: '0 8px 24px rgba(74, 158, 201, 0.3)',
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
          border: `6px solid ${COLORS.blue[500]}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          backgroundColor: COLORS.blue[500] + '10',
        }}>
          <span style={{
            fontSize: '48px',
            fontWeight: 700,
            color: COLORS.blue[600],
          }}>
            {overallScore.toFixed(1)}
          </span>
        </div>
        <p style={{
          fontSize: '14px',
          color: COLORS.slate[500],
          margin: 0,
        }}>
          Gesamtbewertung (von 10)
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
          value={`${session.completed_questions || session.total_questions}/${session.total_questions}`}
          label="Fragen"
        />
        <StatItem
          icon={Target}
          value={summaryFeedback?.average_content_score?.toFixed(1) || '-'}
          label="Ø Inhalt"
        />
        <StatItem
          icon={Star}
          value={summaryFeedback?.average_delivery_score?.toFixed(1) || '-'}
          label="Ø Präsentation"
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
          <SummaryScore score={summaryFeedback.scores.content} label="Inhalt" />
          <SummaryScore score={summaryFeedback.scores.structure} label="Struktur" />
          <SummaryScore score={summaryFeedback.scores.relevance} label="Relevanz" />
          <SummaryScore score={summaryFeedback.scores.delivery} label="Präsentation" />
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
            e.target.style.borderColor = COLORS.blue[500];
            e.target.style.color = COLORS.blue[600];
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
            background: `linear-gradient(90deg, ${COLORS.blue[600]} 0%, ${COLORS.teal[500]} 100%)`,
            color: 'white',
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(74, 158, 201, 0.3)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 6px 16px rgba(74, 158, 201, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'none';
            e.target.style.boxShadow = '0 4px 12px rgba(74, 158, 201, 0.3)';
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
