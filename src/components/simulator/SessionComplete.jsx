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
    <div className="text-center p-4 bg-slate-100 rounded-lg">
      <div className="text-4xl font-bold mb-1" style={{ color }}>
        {score100 != null ? Math.round(score100) : '-'}
      </div>
      <div className="text-sm text-slate-600">
        {label}
      </div>
    </div>
  );
};

/**
 * Stat Item
 */
const StatItem = ({ icon: Icon, value, label, primaryAccent, b }) => (
  <div className="flex items-center gap-3 p-3 bg-slate-100 rounded-lg">
    <Icon className="w-5 h-5" style={{ color: primaryAccent }} />
    <div>
      <div className="text-xl font-semibold text-slate-900">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
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
    <div className="p-6 max-w-[640px] mx-auto">
      {/* Success Header */}
      <div className="text-center mb-8">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{
            background: b.headerGradient,
            boxShadow: `0 8px 24px ${b.primaryAccent}4d`,
          }}
        >
          <Trophy className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-5xl font-bold text-slate-900 m-0 mb-2">
          Training abgeschlossen! {grade.emoji}
        </h1>
        <p className="text-lg text-slate-600 m-0">
          {scenario?.title || 'Skill Training'} - {grade.text}
        </p>
      </div>

      {/* Overall Score Card */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 text-center mb-6">
        <div
          className="w-[120px] h-[120px] rounded-full flex items-center justify-center mx-auto mb-4"
          style={{
            border: `6px solid ${b.primaryAccent}`,
            backgroundColor: b.primaryAccentLight,
          }}
        >
          <span className="text-5xl font-bold" style={{ color: b.primaryAccent }}>
            {overallScore ? Math.round(overallScore) : '-'}
          </span>
        </div>
        <p className="text-base text-slate-500 m-0">
          {overallScore ? 'Gesamtbewertung (von 100)' : 'Keine Fragen beantwortet'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
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
        <div className="grid grid-cols-4 gap-3 mb-6">
          <SummaryScore score={summaryFeedback.scores.content} label="Inhalt" primaryAccent={b.primaryAccent} b={b} />
          <SummaryScore score={summaryFeedback.scores.structure} label="Struktur" primaryAccent={b.primaryAccent} b={b} />
          <SummaryScore score={summaryFeedback.scores.relevance} label="Relevanz" primaryAccent={b.primaryAccent} b={b} />
          <SummaryScore score={summaryFeedback.scores.delivery} label="Präsentation" primaryAccent={b.primaryAccent} b={b} />
        </div>
      )}

      {/* Summary Feedback */}
      {summaryFeedback?.summary && (
        <div className="p-5 rounded-lg bg-slate-100 mb-6">
          <h3 className="text-base font-semibold text-slate-700 m-0 mb-2">
            Zusammenfassung
          </h3>
          <p className="text-base text-slate-600 m-0 leading-relaxed">
            {summaryFeedback.summary}
          </p>
        </div>
      )}

      {/* Key Takeaways */}
      {summaryFeedback?.key_takeaways?.length > 0 && (
        <div className="p-5 rounded-lg bg-green-100 mb-6">
          <h3 className="text-base font-semibold text-green-500 m-0 mb-3">
            💡 Die wichtigsten Erkenntnisse
          </h3>
          <ul className="m-0 pl-5 text-slate-700 text-base leading-relaxed">
            {summaryFeedback.key_takeaways.map((takeaway, i) => (
              <li key={i} className="mb-2">{takeaway}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 mt-8">
        <button
          onClick={onBackToDashboard}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-lg border-2 border-slate-300 bg-white text-slate-700 text-base font-semibold cursor-pointer transition-all hover:border-primary hover:text-primary"
        >
          <ArrowLeft className="w-[18px] h-[18px]" />
          Zur Übersicht
        </button>
        <button
          onClick={onStartNew}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl border-none text-white text-base font-semibold cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg bg-gradient-to-r from-indigo-600 to-violet-600 shadow-primary"
        >
          <RotateCcw className="w-[18px] h-[18px]" />
          Nochmal üben
        </button>
      </div>
    </div>
  );
};

export default SessionComplete;
