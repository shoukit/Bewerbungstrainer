/**
 * Shared color palette for consistent styling across components
 * Based on Tailwind CSS color system
 */

export const COLORS = {
  white: '#ffffff',
  black: '#000000',
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
  yellow: {
    50: '#fefce8',
    100: '#fef9c3',
    200: '#fef08a',
    300: '#fde047',
    400: '#facc15',
    500: '#eab308',
    600: '#ca8a04',
    700: '#a16207',
  },
  // Ocean Blue Theme Colors (from tailwind.config.js)
  oceanBlue: {
    50: '#E8F4F8',
    100: '#D1E9F1',
    200: '#A8D8EA',
    300: '#8BCCE3',
    400: '#5FB3D8',
    500: '#4A9EC9',
    600: '#3A7FA7',
    700: '#2D6485',
    800: '#1F4963',
    900: '#1a3d52',
  },
  // Ocean Teal Theme Colors (from tailwind.config.js)
  oceanTeal: {
    50: '#E6F7F4',
    100: '#CCEFE9',
    200: '#99DFD3',
    300: '#66CFBD',
    400: '#4DB8A0',
    500: '#3DA389',
    600: '#2E8A72',
    700: '#22705B',
    800: '#165644',
    900: '#0B3C2D',
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
