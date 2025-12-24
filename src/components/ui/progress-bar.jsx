/**
 * ProgressBar Component
 *
 * Shared progress bar with dots for question-based training flows.
 *
 * @param {number} current - Current question index (0-based)
 * @param {number} total - Total number of questions
 * @param {number[]} answeredQuestions - Array of answered question indices (optional)
 * @param {string} primaryAccent - Primary accent color for the bar
 * @param {object} b - Branding object with design tokens
 * @param {object} labels - Custom labels object { questionFallback, questionCounter(current, total) }
 * @param {boolean} showCompleted - Show "abgeschlossen" text (default: true)
 */

import { motion } from 'framer-motion';
import { COLORS } from '@/config/colors';

const ProgressBar = ({
  current,
  total,
  answeredQuestions = [],
  primaryAccent,
  b,
  labels,
  showCompleted = true,
}) => {
  const percentage = ((current + 1) / total) * 100;
  const questionLabel = labels?.questionFallback || 'Frage';

  // Determine dot state: answered (green), current (accent), or pending (gray)
  const getDotStyle = (index) => {
    const isCurrent = index === current;
    const isAnswered = answeredQuestions.length > 0
      ? answeredQuestions.includes(index)
      : index < current;

    if (isCurrent) {
      return primaryAccent;
    }
    if (isAnswered) {
      return COLORS.green[500];
    }
    return COLORS.slate[300];
  };

  const getDotTitle = (index) => {
    const isAnswered = answeredQuestions.length > 0
      ? answeredQuestions.includes(index)
      : index < current;
    return `${questionLabel} ${index + 1}${isAnswered ? ' (beantwortet)' : ''}`;
  };

  // Get the question counter text
  const getQuestionCounterText = () => {
    if (labels?.questionCounter) {
      return labels.questionCounter(current + 1, total);
    }
    return `${questionLabel} ${current + 1} von ${total}`;
  };

  return (
    <div style={{ marginBottom: b.space[6] }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: b.space[2] }}>
        <span style={{ fontSize: b.fontSize.sm, fontWeight: 600, color: COLORS.slate[700] }}>
          {getQuestionCounterText()}
        </span>
        <span style={{
          fontSize: b.fontSize.sm,
          fontWeight: showCompleted ? 400 : 600,
          color: showCompleted ? COLORS.slate[500] : primaryAccent
        }}>
          {Math.round(percentage)}%{showCompleted ? ' abgeschlossen' : ''}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{
        height: '8px',
        backgroundColor: COLORS.slate[200],
        borderRadius: b.radius.sm,
        overflow: 'hidden',
        marginBottom: b.space[3],
      }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: parseFloat(b.transition.normal.replace('s', '')) }}
          style={{
            height: '100%',
            background: primaryAccent,
            borderRadius: b.radius.sm,
          }}
        />
      </div>

      {/* Dots */}
      <div style={{ display: 'flex', gap: b.space[1.5], justifyContent: 'center' }}>
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: getDotStyle(i),
              transition: `all ${b.transition.normal}`,
            }}
            title={getDotTitle(i)}
          />
        ))}
      </div>
    </div>
  );
};

export { ProgressBar };
export default ProgressBar;
