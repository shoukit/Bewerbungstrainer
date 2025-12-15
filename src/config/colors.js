/**
 * Shared color palette for consistent styling across components
 * Based on Tailwind CSS color system
 */

export const COLORS = {
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
  red: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
  },
  green: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
  },
  amber: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
  },
  purple: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    400: '#c084fc',
    500: '#a855f7',
    600: '#9333ea',
    700: '#7c3aed',
  },
  blue: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
  },
  teal: {
    50: '#f0fdfa',
    100: '#ccfbf1',
    400: '#2dd4bf',
    500: '#3DA389',
    600: '#2E8A72',
    700: '#0f766e',
  },
  orange: {
    50: '#fff7ed',
    100: '#ffedd5',
    400: '#fb923c',
    500: '#f97316',
    600: '#ea580c',
  },
};

/**
 * Semantic color mappings for common UI states
 */
export const SEMANTIC_COLORS = {
  success: COLORS.green,
  error: COLORS.red,
  warning: COLORS.amber,
  info: COLORS.blue,
  primary: COLORS.teal,
  secondary: COLORS.slate,
  accent: COLORS.purple,
};

/**
 * Get score-based color scheme
 * @param {number} score - Score value (0-100)
 * @returns {object} Color scheme with bg, text, and accent colors
 */
export const getScoreColors = (score) => {
  if (score >= 80) {
    return {
      bg: COLORS.green[50],
      text: COLORS.green[700],
      accent: COLORS.green[500],
      label: 'Sehr gut',
    };
  }
  if (score >= 60) {
    return {
      bg: COLORS.blue[50],
      text: COLORS.blue[700],
      accent: COLORS.blue[500],
      label: 'Gut',
    };
  }
  if (score >= 40) {
    return {
      bg: COLORS.amber[50],
      text: COLORS.amber[700],
      accent: COLORS.amber[500],
      label: 'Befriedigend',
    };
  }
  return {
    bg: COLORS.red[50],
    text: COLORS.red[700],
    accent: COLORS.red[500],
    label: 'Verbesserungswürdig',
  };
};

export default COLORS;
