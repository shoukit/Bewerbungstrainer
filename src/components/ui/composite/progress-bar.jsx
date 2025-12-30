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
    <div className="mb-6">
      {/* Header row */}
      <div className="flex justify-between mb-2">
        <span className="text-sm font-semibold text-slate-700">
          {getQuestionCounterText()}
        </span>
        <span
          className={`text-sm ${showCompleted ? 'font-normal' : 'font-semibold'}`}
          style={{ color: showCompleted ? COLORS.slate[500] : primaryAccent }}
        >
          {Math.round(percentage)}%{showCompleted ? ' abgeschlossen' : ''}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-slate-200 rounded-sm overflow-hidden mb-3">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.4 }}
          className="h-full rounded-sm"
          style={{ background: primaryAccent }}
        />
      </div>

      {/* Dots */}
      <div className="flex gap-1.5 justify-center">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className="w-2.5 h-2.5 rounded-full transition-all duration-400"
            style={{ backgroundColor: getDotStyle(i) }}
            title={getDotTitle(i)}
          />
        ))}
      </div>
    </div>
  );
};

export { ProgressBar };
export default ProgressBar;
