/**
 * ProgressBar Component
 *
 * Shared progress bar with dots for question-based training flows.
 *
 * @param {number} current - Current question index (0-based)
 * @param {number} total - Total number of questions
 * @param {number[]} answeredQuestions - Array of answered question indices (optional)
 * @param {string} primaryAccent - Primary accent color for the bar
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
    <div style={{ marginBottom: '24px' }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '14px', fontWeight: 600, color: COLORS.slate[700] }}>
          {getQuestionCounterText()}
        </span>
        <span style={{
          fontSize: '14px',
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
        borderRadius: '4px',
        overflow: 'hidden',
        marginBottom: '12px',
      }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.3 }}
          style={{
            height: '100%',
            background: primaryAccent,
            borderRadius: '4px',
          }}
        />
      </div>

      {/* Dots */}
      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: getDotStyle(i),
              transition: 'all 0.2s',
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
