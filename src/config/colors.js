/**
 * Centralized Color System
 *
 * Single source of truth for all colors in the application.
 * Replaces duplicate COLORS objects across components.
 *
 * Usage:
 *   import { COLORS, SEMANTIC_COLORS, getScoreColor } from '@/config/colors';
 *
 * For partner theming, use CSS variables from branding:
 *   const { branding } = usePartner();
 *   const primaryAccent = branding?.['--primary-accent'] || COLORS.blue[600];
 */

// =============================================================================
// BASE COLOR PALETTE
// =============================================================================

/**
 * Core color palette - Tailwind-inspired scales
 * Use these for consistent styling across all components.
 */
export const COLORS = {
  // Primary Blue (Ocean Theme)
  blue: {
    50: '#E8F4F8',
    100: '#D1E9F1',
    200: '#A3D3E3',
    300: '#8BCCE3',
    400: '#5FB4D3',
    500: '#4A9EC9',
    600: '#3A7FA7',  // Primary accent
    700: '#2D6485',
    800: '#1F4A63',
    900: '#1a3d52',
  },

  // Teal (Secondary accent)
  teal: {
    50: '#f0fdfa',
    100: '#ccfbf1',
    200: '#99f6e4',
    300: '#5eead4',
    400: '#2dd4bf',
    500: '#3DA389',  // Secondary accent
    600: '#2E8A72',
    700: '#247560',
    800: '#115e59',
    900: '#134e4a',
  },

  // Slate (Neutral grays)
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

  // Semantic: Success
  green: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },

  // Semantic: Warning
  amber: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },

  // Semantic: Error
  red: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },

  // Accent: Purple
  purple: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',
    600: '#9333ea',
    700: '#7e22ce',
    800: '#6b21a8',
    900: '#581c87',
  },

  // Pure colors
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
};

// =============================================================================
// SEMANTIC COLOR ALIASES
// =============================================================================

/**
 * Semantic colors for common UI states
 * Use these for consistent meaning across the app.
 */
export const SEMANTIC_COLORS = {
  // Status colors
  success: COLORS.green[500],
  successLight: COLORS.green[50],
  successDark: COLORS.green[600],

  warning: COLORS.amber[500],
  warningLight: COLORS.amber[50],
  warningDark: COLORS.amber[600],

  error: COLORS.red[500],
  errorLight: COLORS.red[50],
  errorDark: COLORS.red[600],

  info: COLORS.blue[500],
  infoLight: COLORS.blue[50],
  infoDark: COLORS.blue[600],

  // Text colors
  textPrimary: COLORS.slate[900],
  textSecondary: COLORS.slate[600],
  textMuted: COLORS.slate[400],
  textInverse: COLORS.white,

  // Background colors
  bgPrimary: COLORS.white,
  bgSecondary: COLORS.slate[50],
  bgTertiary: COLORS.slate[100],

  // Border colors
  border: COLORS.slate[200],
  borderLight: COLORS.slate[100],
  borderDark: COLORS.slate[300],

  // Primary brand colors (can be overridden by partner branding)
  primary: COLORS.blue[600],
  primaryLight: COLORS.blue[50],
  primaryHover: COLORS.blue[700],
  secondary: COLORS.teal[500],
  secondaryHover: COLORS.teal[600],
};

// =============================================================================
// SCORE/RATING COLOR UTILITIES
// =============================================================================

/**
 * Get single color for score display (0-100)
 * Simple helper that returns just the accent color.
 *
 * @param {number} score - Score value (0-100)
 * @param {string} primaryAccent - Optional partner accent color for 60-79 range
 * @returns {string} Color hex value
 */
export function getScoreColor(score, primaryAccent) {
  if (score >= 80) return COLORS.green[500];
  if (score >= 60) return primaryAccent || COLORS.blue[500];
  if (score >= 40) return COLORS.amber[500];
  return COLORS.red[500];
}

/**
 * Get Tailwind text class for score display
 * @param {number} score - Score value (0-100)
 * @returns {string} Tailwind text color class
 */
export function getScoreTextClass(score) {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-blue-600';
  if (score >= 40) return 'text-amber-600';
  return 'text-red-600';
}

/**
 * Get color scheme based on score percentage (0-100)
 * Used for ratings, progress indicators, and score displays.
 *
 * @param {number} score - Score value (0-100)
 * @returns {object} Color scheme with bg, text, border, and gradient
 */
export function getScoreColorScheme(score) {
  if (score >= 80) {
    return {
      bg: COLORS.green[50],
      text: COLORS.green[600],
      border: COLORS.green[200],
      accent: COLORS.green[500],
      gradient: `linear-gradient(135deg, ${COLORS.green[400]} 0%, ${COLORS.green[600]} 100%)`,
      label: 'Hervorragend',
    };
  }
  if (score >= 60) {
    return {
      bg: COLORS.blue[50],
      text: COLORS.blue[600],
      border: COLORS.blue[200],
      accent: COLORS.blue[500],
      gradient: `linear-gradient(135deg, ${COLORS.blue[400]} 0%, ${COLORS.blue[600]} 100%)`,
      label: 'Gut',
    };
  }
  if (score >= 40) {
    return {
      bg: COLORS.amber[50],
      text: COLORS.amber[600],
      border: COLORS.amber[200],
      accent: COLORS.amber[500],
      gradient: `linear-gradient(135deg, ${COLORS.amber[400]} 0%, ${COLORS.amber[600]} 100%)`,
      label: 'Ausbaufähig',
    };
  }
  return {
    bg: COLORS.red[50],
    text: COLORS.red[600],
    border: COLORS.red[200],
    accent: COLORS.red[500],
    gradient: `linear-gradient(135deg, ${COLORS.red[400]} 0%, ${COLORS.red[600]} 100%)`,
    label: 'Verbesserungsbedarf',
  };
}

/**
 * Get Tailwind classes for score display
 * @param {number} score - Score value (0-100)
 * @returns {object} Tailwind class strings
 */
export function getScoreTailwindClasses(score) {
  if (score >= 80) {
    return {
      bg: 'bg-green-50',
      text: 'text-green-600',
      border: 'border-green-200',
      ring: 'ring-green-500',
    };
  }
  if (score >= 60) {
    return {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-200',
      ring: 'ring-blue-500',
    };
  }
  if (score >= 40) {
    return {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-200',
      ring: 'ring-amber-500',
    };
  }
  return {
    bg: 'bg-red-50',
    text: 'text-red-600',
    border: 'border-red-200',
    ring: 'ring-red-500',
  };
}

/**
 * Get color for confidence gauge (0-100)
 * @param {number} confidence - Confidence value (0-100)
 * @returns {object} Color scheme for gauge
 */
export function getConfidenceColorScheme(confidence) {
  if (confidence >= 70) {
    return {
      stroke: COLORS.green[500],
      fill: COLORS.green[50],
      text: COLORS.green[600],
      bg: 'from-green-50 to-green-100',
    };
  }
  if (confidence >= 40) {
    return {
      stroke: COLORS.blue[500],
      fill: COLORS.blue[50],
      text: COLORS.blue[600],
      bg: 'from-blue-50 to-blue-100',
    };
  }
  return {
    stroke: COLORS.amber[500],
    fill: COLORS.amber[50],
    text: COLORS.amber[600],
    bg: 'from-amber-50 to-amber-100',
  };
}

/**
 * Get color for filler word count
 * @param {number} count - Number of filler words
 * @returns {object} Color scheme
 */
export function getFillerWordColorScheme(count) {
  if (count <= 2) {
    return {
      bg: COLORS.green[50],
      text: COLORS.green[600],
      accent: COLORS.green[500],
      label: 'Sehr gut',
    };
  }
  if (count <= 5) {
    return {
      bg: COLORS.amber[50],
      text: COLORS.amber[600],
      accent: COLORS.amber[500],
      label: 'Akzeptabel',
    };
  }
  return {
    bg: COLORS.red[50],
    text: COLORS.red[600],
    accent: COLORS.red[500],
    label: 'Zu viele',
  };
}

/**
 * Get color for pacing (words per minute)
 * Optimal range: 120-150 WPM
 * @param {number} wpm - Words per minute
 * @returns {object} Color scheme
 */
export function getPacingColorScheme(wpm) {
  if (wpm >= 120 && wpm <= 150) {
    return {
      bg: COLORS.green[50],
      text: COLORS.green[600],
      accent: COLORS.green[500],
      label: 'Optimal',
    };
  }
  if ((wpm >= 100 && wpm < 120) || (wpm > 150 && wpm <= 170)) {
    return {
      bg: COLORS.amber[50],
      text: COLORS.amber[600],
      accent: COLORS.amber[500],
      label: wpm < 120 ? 'Etwas langsam' : 'Etwas schnell',
    };
  }
  return {
    bg: COLORS.red[50],
    text: COLORS.red[600],
    accent: COLORS.red[500],
    label: wpm < 100 ? 'Zu langsam' : 'Zu schnell',
  };
}

// =============================================================================
// GAME MODE COLORS (Rhetorik-Gym)
// =============================================================================

/**
 * Color gradients for Rhetorik-Gym game modes
 */
export const GAME_MODE_COLORS = {
  klassiker: {
    from: COLORS.blue[500],
    to: COLORS.teal[500],
    gradient: `linear-gradient(135deg, ${COLORS.blue[500]} 0%, ${COLORS.teal[500]} 100%)`,
  },
  zufall: {
    from: COLORS.purple[500],
    to: COLORS.blue[500],
    gradient: `linear-gradient(135deg, ${COLORS.purple[500]} 0%, ${COLORS.blue[500]} 100%)`,
  },
  stress: {
    from: COLORS.red[500],
    to: COLORS.amber[500],
    gradient: `linear-gradient(135deg, ${COLORS.red[500]} 0%, ${COLORS.amber[500]} 100%)`,
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Add alpha transparency to a hex color
 * @param {string} hex - Hex color (e.g., '#3A7FA7')
 * @param {number} alpha - Alpha value (0-1)
 * @returns {string} RGBA color string
 */
export function hexToRgba(hex, alpha = 1) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;

  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Create a gradient string from two colors
 * @param {string} from - Start color
 * @param {string} to - End color
 * @param {number} angle - Gradient angle in degrees (default: 135)
 * @returns {string} CSS gradient string
 */
export function createGradient(from, to, angle = 135) {
  return `linear-gradient(${angle}deg, ${from} 0%, ${to} 100%)`;
}

// Default export for convenience
export default COLORS;
