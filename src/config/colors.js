/**
 * Centralized Color System v2.0
 *
 * "Clean Professional" Design System
 *
 * Single source of truth for all colors in the application.
 *
 * Usage:
 *   import { COLORS, SEMANTIC_COLORS, getScoreColor } from '@/config/colors';
 *
 * For partner theming, use CSS variables from branding:
 *   const { branding } = usePartner();
 *   const primaryAccent = branding?.['--primary-accent'] || COLORS.indigo[600];
 */

// =============================================================================
// BASE COLOR PALETTE
// =============================================================================

/**
 * Core color palette - Tailwind-inspired scales
 * Updated to Indigo-based "Clean Professional" theme.
 */
export const COLORS = {
  // Primary Indigo (NEW - replaces Ocean Blue)
  indigo: {
    50: '#EEF2FF',
    100: '#E0E7FF',
    200: '#C7D2FE',
    300: '#A5B4FC',
    400: '#818CF8',
    500: '#6366F1',
    600: '#4F46E5', // ⭐ PRIMARY ACCENT
    700: '#4338CA',
    800: '#3730A3',
    900: '#312E81',
  },

  // Secondary Violet (for gradients)
  violet: {
    50: '#F5F3FF',
    100: '#EDE9FE',
    200: '#DDD6FE',
    300: '#C4B5FD',
    400: '#A78BFA',
    500: '#8B5CF6',
    600: '#7C3AED', // ⭐ SECONDARY (Gradient end)
    700: '#6D28D9',
    800: '#5B21B6',
    900: '#4C1D95',
  },

  // Blue (Feature accent)
  blue: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },

  // Teal (Decision Board accent)
  teal: {
    50: '#F0FDFA',
    100: '#CCFBF1',
    200: '#99F6E4',
    300: '#5EEAD4',
    400: '#2DD4BF',
    500: '#14B8A6',
    600: '#0D9488',
    700: '#0F766E',
    800: '#115E59',
    900: '#134E4A',
  },

  // Emerald (Video Training accent)
  emerald: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
  },

  // Slate (Neutral grays) - Unchanged, perfect for the theme
  slate: {
    50: '#F8FAFC', // ⭐ PAGE BACKGROUND
    100: '#F1F5F9',
    200: '#E2E8F0', // ⭐ BORDERS
    300: '#CBD5E1',
    400: '#94A3B8', // ⭐ MUTED TEXT
    500: '#64748B', // ⭐ SECONDARY TEXT
    600: '#475569',
    700: '#334155',
    800: '#1E293B', // ⭐ SIDEBAR BG
    900: '#0F172A', // ⭐ PRIMARY TEXT
  },

  // Semantic: Success
  green: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E', // ⭐ SUCCESS
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
  },

  // Semantic: Warning
  amber: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B', // ⭐ WARNING
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },

  // Semantic: Error
  red: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444', // ⭐ ERROR
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },

  // Accent: Purple (Ikigai, Rhetorik-Gym)
  purple: {
    50: '#FAF5FF',
    100: '#F3E8FF',
    200: '#E9D5FF',
    300: '#D8B4FE',
    400: '#C084FC',
    500: '#A855F7',
    600: '#9333EA',
    700: '#7E22CE',
    800: '#6B21A8',
    900: '#581C87',
  },

  // Accent: Cyan (Decision Board personas)
  cyan: {
    50: '#ECFEFF',
    100: '#CFFAFE',
    200: '#A5F3FC',
    300: '#67E8F9',
    400: '#22D3EE',
    500: '#06B6D4',
    600: '#0891B2',
    700: '#0E7490',
    800: '#155E75',
    900: '#164E63',
  },

  // Accent: Orange (Communication features)
  orange: {
    50: '#FFF7ED',
    100: '#FFEDD5',
    200: '#FED7AA',
    300: '#FDBA74',
    400: '#FB923C',
    500: '#F97316',
    600: '#EA580C',
    700: '#C2410C',
    800: '#9A3412',
    900: '#7C2D12',
  },

  // Pure colors
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  // Legacy alias (for backwards compatibility during migration)
  // TODO: Remove after full migration
  'ocean-blue': {
    600: '#4F46E5', // Maps to indigo.600
  },
};

// =============================================================================
// SEMANTIC COLOR ALIASES
// =============================================================================

/**
 * Semantic colors for common UI states
 * Updated for "Clean Professional" theme.
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

  info: COLORS.indigo[500],
  infoLight: COLORS.indigo[50],
  infoDark: COLORS.indigo[600],

  // Text colors
  textPrimary: COLORS.slate[900],
  textSecondary: COLORS.slate[500],
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

  // Primary brand colors (NEW - Indigo based)
  primary: COLORS.indigo[600],
  primaryLight: COLORS.indigo[50],
  primaryHover: COLORS.indigo[700],
  secondary: COLORS.violet[600],
  secondaryHover: COLORS.violet[700],
};

// =============================================================================
// GRADIENTS
// =============================================================================

/**
 * Standard gradients for the application
 */
export const GRADIENTS = {
  // Primary header gradient
  header: `linear-gradient(135deg, ${COLORS.indigo[600]} 0%, ${COLORS.violet[600]} 100%)`,

  // Button gradient
  button: `linear-gradient(135deg, ${COLORS.indigo[600]} 0%, ${COLORS.indigo[500]} 100%)`,

  // Subtle hero background
  hero: `linear-gradient(180deg, ${COLORS.slate[50]} 0%, ${COLORS.indigo[50]} 100%)`,

  // Feature-specific gradients
  briefing: `linear-gradient(135deg, ${COLORS.indigo[600]} 0%, ${COLORS.violet[600]} 100%)`,
  simulator: `linear-gradient(135deg, ${COLORS.blue[600]} 0%, ${COLORS.indigo[600]} 100%)`,
  video: `linear-gradient(135deg, ${COLORS.emerald[600]} 0%, ${COLORS.teal[600]} 100%)`,
  rhetorik: `linear-gradient(135deg, ${COLORS.violet[600]} 0%, ${COLORS.purple[600]} 100%)`,
  decision: `linear-gradient(135deg, ${COLORS.teal[600]} 0%, ${COLORS.emerald[600]} 100%)`,
  ikigai: `linear-gradient(135deg, ${COLORS.purple[600]} 0%, ${COLORS.violet[600]} 100%)`,
};

// =============================================================================
// SCORE/RATING COLOR UTILITIES
// =============================================================================

/**
 * Get single color for score display (0-100)
 * Updated to use indigo for good scores.
 *
 * @param {number} score - Score value (0-100)
 * @param {string} primaryAccent - Optional partner accent color for 60-79 range
 * @returns {string} Color hex value
 */
export function getScoreColor(score, primaryAccent) {
  if (score >= 80) return COLORS.green[500];
  if (score >= 60) return primaryAccent || COLORS.indigo[500];
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
  if (score >= 60) return 'text-indigo-600';
  if (score >= 40) return 'text-amber-600';
  return 'text-red-600';
}

/**
 * Get color scheme based on score percentage (0-100)
 * Updated to use indigo for good scores.
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
      bg: COLORS.indigo[50],
      text: COLORS.indigo[600],
      border: COLORS.indigo[200],
      accent: COLORS.indigo[500],
      gradient: `linear-gradient(135deg, ${COLORS.indigo[400]} 0%, ${COLORS.indigo[600]} 100%)`,
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
      bg: 'bg-indigo-50',
      text: 'text-indigo-600',
      border: 'border-indigo-200',
      ring: 'ring-indigo-500',
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
      stroke: COLORS.indigo[500],
      fill: COLORS.indigo[50],
      text: COLORS.indigo[600],
      bg: 'from-indigo-50 to-indigo-100',
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
 * Updated with new color palette.
 */
export const GAME_MODE_COLORS = {
  klassiker: {
    from: COLORS.indigo[500],
    to: COLORS.violet[500],
    gradient: `linear-gradient(135deg, ${COLORS.indigo[500]} 0%, ${COLORS.violet[500]} 100%)`,
  },
  zufall: {
    from: COLORS.violet[500],
    to: COLORS.purple[500],
    gradient: `linear-gradient(135deg, ${COLORS.violet[500]} 0%, ${COLORS.purple[500]} 100%)`,
  },
  stress: {
    from: COLORS.red[500],
    to: COLORS.amber[500],
    gradient: `linear-gradient(135deg, ${COLORS.red[500]} 0%, ${COLORS.amber[500]} 100%)`,
  },
};

// =============================================================================
// FEATURE MODULE COLORS
// =============================================================================

/**
 * Identity colors for each feature module
 * Used in OverviewDashboard, feature headers, etc.
 */
export const FEATURE_COLORS = {
  smart_briefing: {
    primary: '#EC4899', // pink-500
    secondary: '#DB2777', // pink-600
    gradient: `linear-gradient(135deg, #EC4899 0%, #DB2777 100%)`,
  },
  simulator: {
    primary: COLORS.emerald[500],
    secondary: COLORS.emerald[600],
    gradient: `linear-gradient(135deg, ${COLORS.emerald[500]} 0%, ${COLORS.emerald[600]} 100%)`,
  },
  video_training: {
    primary: COLORS.violet[500],
    secondary: COLORS.violet[600],
    gradient: `linear-gradient(135deg, ${COLORS.violet[500]} 0%, ${COLORS.violet[600]} 100%)`,
  },
  dashboard: {
    primary: COLORS.blue[500],
    secondary: COLORS.blue[600],
    gradient: `linear-gradient(135deg, ${COLORS.blue[500]} 0%, ${COLORS.blue[600]} 100%)`,
  },
  gym: {
    primary: COLORS.amber[500],
    secondary: COLORS.amber[600],
    gradient: `linear-gradient(135deg, ${COLORS.amber[500]} 0%, ${COLORS.amber[600]} 100%)`,
  },
  decision_board: {
    primary: COLORS.teal[500],
    secondary: COLORS.teal[600],
    gradient: `linear-gradient(135deg, ${COLORS.teal[500]} 0%, ${COLORS.teal[600]} 100%)`,
  },
  ikigai: {
    primary: COLORS.purple[500],
    secondary: COLORS.purple[600],
    gradient: `linear-gradient(135deg, ${COLORS.purple[500]} 0%, ${COLORS.purple[600]} 100%)`,
  },
};

// =============================================================================
// TOAST NOTIFICATION COLORS
// =============================================================================

/**
 * Colors for toast notifications
 */
export const TOAST_COLORS = {
  success: {
    bg: COLORS.emerald[500],
    text: COLORS.white,
  },
  error: {
    bg: COLORS.red[500],
    text: COLORS.white,
  },
  info: {
    bg: COLORS.blue[500],
    text: COLORS.white,
  },
  warning: {
    bg: COLORS.amber[500],
    text: COLORS.white,
  },
};

// =============================================================================
// IKIGAI DIMENSION COLORS
// =============================================================================

/**
 * Colors for Ikigai dimensions
 */
export const IKIGAI_COLORS = {
  love: {
    color: '#E11D48', // rose-600
    bg: '#FEE2E2',
  },
  talent: {
    color: COLORS.amber[500],
    bg: COLORS.amber[100],
  },
  need: {
    color: COLORS.emerald[500],
    bg: COLORS.emerald[100],
  },
  market: {
    color: COLORS.indigo[500],
    bg: COLORS.indigo[100],
  },
};

// =============================================================================
// DIFFICULTY LEVEL COLORS
// =============================================================================

/**
 * Colors for difficulty levels
 */
export const DIFFICULTY_COLORS = {
  easy: {
    color: COLORS.indigo[500],
    bg: COLORS.indigo[50],
  },
  medium: {
    color: COLORS.emerald[600],
    bg: COLORS.emerald[100],
  },
  hard: {
    color: COLORS.violet[600],
    bg: COLORS.violet[100],
  },
  expert: {
    color: COLORS.amber[600],
    bg: COLORS.amber[100],
  },
  default: {
    color: COLORS.slate[500],
    bg: COLORS.slate[100],
  },
};

// =============================================================================
// DECISION BOARD PERSONA COLORS
// =============================================================================

/**
 * Colors for Decision Board personas
 */
export const PERSONA_COLORS = {
  analytisch: {
    color: COLORS.indigo[500],
  },
  kreativ: {
    color: '#0891b2', // cyan-600
  },
  praktisch: {
    color: COLORS.emerald[500],
  },
  risikofreudig: {
    color: COLORS.amber[500],
  },
  vorsichtig: {
    color: COLORS.violet[500],
  },
};

// =============================================================================
// SVG STROKE COLORS (for gauges, rings, etc.)
// =============================================================================

/**
 * SVG stroke colors for various score visualizations
 */
export const SVG_COLORS = {
  trackLight: COLORS.slate[200],
  trackLightRgba: 'rgba(255,255,255,0.25)',
  trackDark: COLORS.slate[200],
};

// =============================================================================
// CONFETTI COLORS (Celebration animations)
// =============================================================================

/**
 * Colors for confetti celebration animations
 */
export const CONFETTI_COLORS = [
  COLORS.indigo[500],
  COLORS.violet[500],
  COLORS.purple[500],
  COLORS.pink[500],
  COLORS.rose[500],
  COLORS.orange[500],
  COLORS.yellow[500],
  COLORS.green[500],
  COLORS.indigo[600],
  COLORS.cyan[500],
];

// =============================================================================
// DEFAULT BRANDING (fallback values)
// =============================================================================

/**
 * Default branding values when no partner context is available
 */
export const DEFAULT_BRANDING_COLORS = {
  primaryAccent: COLORS.indigo[500],
  primaryAccentHover: COLORS.indigo[600],
  headerGradient: GRADIENTS.header,
  buttonGradient: GRADIENTS.button,
  headerText: COLORS.white,
  sidebarBg: COLORS.slate[800],
  sidebarText: COLORS.slate[50],
  sidebarTextMuted: COLORS.slate[400],
  sidebarActiveBg: `rgba(79, 70, 229, 0.2)`,
  sidebarActiveText: COLORS.indigo[300],
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Add alpha transparency to a hex color
 * @param {string} hex - Hex color (e.g., '#4F46E5')
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

/**
 * Create a colored shadow for buttons
 * @param {string} color - Hex color
 * @param {number} opacity - Shadow opacity (0-1, default: 0.35)
 * @returns {string} Box shadow string
 */
export function createColoredShadow(color, opacity = 0.35) {
  return `0 4px 14px ${hexToRgba(color, opacity)}`;
}

// Default export for convenience
export default COLORS;
