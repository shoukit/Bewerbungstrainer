/**
 * Application Constants
 *
 * Centralized configuration for magic numbers, thresholds, and settings.
 * This makes the codebase more maintainable and allows easy adjustments.
 */

// =============================================================================
// SCENARIO CATEGORIES
// =============================================================================

/**
 * Fixed scenario categories for filtering and organization
 */
export const SCENARIO_CATEGORIES = {
  CAREER: 'CAREER',
  LEADERSHIP: 'LEADERSHIP',
  SALES: 'SALES',
  COMMUNICATION: 'COMMUNICATION',
};

/**
 * Category configuration with labels, icons, and colors
 */
export const SCENARIO_CATEGORY_CONFIG = {
  [SCENARIO_CATEGORIES.CAREER]: {
    key: SCENARIO_CATEGORIES.CAREER,
    label: 'Bewerbung & Karriere',
    shortLabel: 'Karriere',
    icon: 'Briefcase',
    color: '#3b82f6', // blue-500
    bgColor: 'rgba(59, 130, 246, 0.15)',
  },
  [SCENARIO_CATEGORIES.LEADERSHIP]: {
    key: SCENARIO_CATEGORIES.LEADERSHIP,
    label: 'Leadership & Führung',
    shortLabel: 'Führung',
    icon: 'Target',
    color: '#8b5cf6', // violet-500
    bgColor: 'rgba(139, 92, 246, 0.15)',
  },
  [SCENARIO_CATEGORIES.SALES]: {
    key: SCENARIO_CATEGORIES.SALES,
    label: 'Vertrieb & Verhandlung',
    shortLabel: 'Vertrieb',
    icon: 'TrendingUp',
    color: '#22c55e', // green-500
    bgColor: 'rgba(34, 197, 94, 0.15)',
  },
  [SCENARIO_CATEGORIES.COMMUNICATION]: {
    key: SCENARIO_CATEGORIES.COMMUNICATION,
    label: 'Kommunikation & Konflikt',
    shortLabel: 'Kommunikation',
    icon: 'MessageCircle',
    color: '#f59e0b', // amber-500
    bgColor: 'rgba(245, 158, 11, 0.15)',
  },
};

/**
 * Get category configuration by key
 * @param {string} categoryKey - The category key (e.g., 'CAREER')
 * @returns {object|null} - Category config or null if not found
 */
export function getScenarioCategoryConfig(categoryKey) {
  if (!categoryKey || typeof categoryKey !== 'string') return null;
  // Handle both uppercase keys and legacy lowercase values
  const normalizedKey = categoryKey.toUpperCase();
  return SCENARIO_CATEGORY_CONFIG[normalizedKey] || null;
}

/**
 * Map legacy category values to new enum keys
 */
export const LEGACY_CATEGORY_MAP = {
  'interview': SCENARIO_CATEGORIES.CAREER,
  'negotiation': SCENARIO_CATEGORIES.SALES,
  'presentation': SCENARIO_CATEGORIES.COMMUNICATION,
  'leadership': SCENARIO_CATEGORIES.LEADERSHIP,
  'communication': SCENARIO_CATEGORIES.COMMUNICATION,
  'sales': SCENARIO_CATEGORIES.SALES,
  'career': SCENARIO_CATEGORIES.CAREER,
};

/**
 * Normalize category value (handles legacy values)
 * @param {string} category - Category value (legacy or new)
 * @returns {string} - Normalized category key
 */
export function normalizeCategory(category) {
  if (!category || typeof category !== 'string') return null;
  const upper = category.toUpperCase();
  // If it's already a valid category key, return it
  if (SCENARIO_CATEGORIES[upper]) {
    return upper;
  }
  // Check legacy mapping
  const lower = category.toLowerCase();
  return LEGACY_CATEGORY_MAP[lower] || SCENARIO_CATEGORIES.CAREER;
}

// =============================================================================
// GEMINI AI CONFIGURATION
// =============================================================================

/**
 * Model configuration for different use cases
 *
 * VIDEO_ANALYSIS: Uses Gemini 2.5 Pro for best video/vision quality
 * - Körpersprache-Analyse, Mimik, Gestik erkennung
 * - Temporal reasoning für zeitliche Abläufe
 *
 * AUDIO_TEXT: Uses Gemini 3 Flash for speed + quality balance
 * - Live-Training Feedback, Audio-Analyse, Rhetorik-Gym
 * - Smart Briefing Generierung
 */
export const GEMINI_MODELS = {
  // Default for audio/text (Feedback, Audio-Analyse, Rhetorik-Gym, Briefings)
  PRIMARY: 'gemini-2.5-flash',
  FALLBACK_ORDER: [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash-latest',
  ],

  // Video analysis specific (Wirkungs-Analyse mit Körpersprache)
  VIDEO_ANALYSIS: {
    PRIMARY: 'gemini-2.5-pro-preview',
    FALLBACK_ORDER: [
      'gemini-2.5-pro-preview',
      'gemini-2.5-pro',
      'gemini-2.5-flash',
    ],
  },
};

/**
 * API retry configuration
 */
export const API_RETRY_CONFIG = {
  MAX_ATTEMPTS: 10,
  DELAY_MS: 3000,
  BACKOFF_MULTIPLIER: 1.5,
};

// =============================================================================
// SCORE THRESHOLDS
// =============================================================================

/**
 * Score thresholds for rating displays (0-100 scale)
 */
export const SCORE_THRESHOLDS = {
  EXCELLENT: 80,
  GOOD: 60,
  FAIR: 40,
  POOR: 0,
};

/**
 * Get color scheme based on score
 * @param {number} score - Score from 0-100
 * @returns {object} - Color scheme object
 */
export function getScoreColorScheme(score) {
  if (score >= SCORE_THRESHOLDS.EXCELLENT) {
    return {
      color: 'green',
      tailwind: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-200',
      stroke: '#22c55e',
      label: 'Ausgezeichnet',
    };
  }
  if (score >= SCORE_THRESHOLDS.GOOD) {
    return {
      color: 'blue',
      tailwind: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      stroke: '#3b82f6',
      label: 'Gut',
    };
  }
  if (score >= SCORE_THRESHOLDS.FAIR) {
    return {
      color: 'amber',
      tailwind: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      stroke: '#f59e0b',
      label: 'Ausbaufähig',
    };
  }
  return {
    color: 'red',
    tailwind: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    stroke: '#ef4444',
    label: 'Verbesserungsbedarf',
  };
}

/**
 * Confidence score labels (for gauge display)
 */
export const CONFIDENCE_LABELS = {
  [SCORE_THRESHOLDS.EXCELLENT]: 'Sehr selbstsicher',
  [SCORE_THRESHOLDS.GOOD]: 'Selbstsicher',
  [SCORE_THRESHOLDS.FAIR]: 'Ausbaufähig',
  [SCORE_THRESHOLDS.POOR]: 'Unsicher',
};

// =============================================================================
// DIFFICULTY COLORS
// =============================================================================

/**
 * Difficulty level styling for scenario cards
 * Used across SimulatorDashboard, VideoTrainingDashboard, RoleplayDashboard
 */
export const DIFFICULTY_COLORS = {
  beginner: {
    bg: 'rgba(34, 197, 94, 0.15)',
    text: '#16a34a',
    label: 'Einsteiger',
    tailwind: {
      bg: 'bg-green-100',
      text: 'text-green-700',
      border: 'border-green-200',
    },
  },
  easy: {
    bg: 'rgba(34, 197, 94, 0.15)',
    text: '#16a34a',
    label: 'Leicht',
    tailwind: {
      bg: 'bg-green-100',
      text: 'text-green-700',
      border: 'border-green-200',
    },
  },
  intermediate: {
    bg: 'rgba(59, 130, 246, 0.15)',
    text: '#2563eb',
    label: 'Fortgeschritten',
    tailwind: {
      bg: 'bg-blue-100',
      text: 'text-blue-700',
      border: 'border-blue-200',
    },
  },
  medium: {
    bg: 'rgba(245, 158, 11, 0.15)',
    text: '#d97706',
    label: 'Mittel',
    tailwind: {
      bg: 'bg-amber-100',
      text: 'text-amber-700',
      border: 'border-amber-200',
    },
  },
  advanced: {
    bg: 'rgba(168, 85, 247, 0.15)',
    text: '#9333ea',
    label: 'Experte',
    tailwind: {
      bg: 'bg-purple-100',
      text: 'text-purple-700',
      border: 'border-purple-200',
    },
  },
  hard: {
    bg: 'rgba(239, 68, 68, 0.15)',
    text: '#dc2626',
    label: 'Schwer',
    tailwind: {
      bg: 'bg-red-100',
      text: 'text-red-700',
      border: 'border-red-200',
    },
  },
};

/**
 * Get difficulty configuration by level
 * @param {string} level - Difficulty level (beginner, easy, intermediate, medium, advanced, hard)
 * @returns {object} - Difficulty config with bg, text, label
 */
export function getDifficultyConfig(level) {
  return DIFFICULTY_COLORS[level] || DIFFICULTY_COLORS.intermediate;
}

// =============================================================================
// PACING CONFIGURATION
// =============================================================================

/**
 * Pacing ratings and their visual positions (0-100 scale for slider)
 */
export const PACING_CONFIG = {
  zu_langsam: { position: 15, label: 'Zu langsam', isOptimal: false },
  optimal: { position: 50, label: 'Optimal', isOptimal: true },
  zu_schnell: { position: 85, label: 'Zu schnell', isOptimal: false },
};

/**
 * Optimal words per minute range
 */
export const OPTIMAL_WPM = {
  MIN: 120,
  MAX: 150,
  IDEAL: 135,
};

// =============================================================================
// TONALITY CONFIGURATION
// =============================================================================

/**
 * Tonality ratings and their display properties
 */
export const TONALITY_CONFIG = {
  monoton: {
    icon: '📈',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    label: 'Monoton',
    waveformVariance: 5,
  },
  natürlich: {
    icon: '🎵',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    label: 'Natürlich',
    waveformVariance: 15,
  },
  lebendig: {
    icon: '🎭',
    color: 'text-green-600',
    bg: 'bg-green-50',
    label: 'Lebendig',
    waveformVariance: 25,
  },
};

// =============================================================================
// FILLER WORD CONFIGURATION
// =============================================================================

/**
 * Filler word count thresholds for color coding
 */
export const FILLER_WORD_THRESHOLDS = {
  GOOD: 2,    // 0-2 = green
  MODERATE: 5, // 3-5 = amber
  // > 5 = red
};

/**
 * List of filler words to detect (German)
 */
export const FILLER_WORDS = [
  'Ähm',
  'Äh',
  'Öh',
  'Mh',
  'Halt',
  'Eigentlich',
  'Sozusagen',
  'Quasi',
  'Irgendwie',
  'Also',
];

// =============================================================================
// UI TIMING CONFIGURATION
// =============================================================================

/**
 * Animation and UI timing constants
 */
export const UI_TIMING = {
  COPY_CONFIRMATION_MS: 2000,
  DEBOUNCE_MS: 150,
  SCROLL_BEHAVIOR: 'smooth',
  ANIMATION_DURATION_FAST: 0.2,
  ANIMATION_DURATION_NORMAL: 0.4,
  ANIMATION_DURATION_SLOW: 0.8,
};

// =============================================================================
// BORDER RADIUS TOKENS
// =============================================================================

/**
 * Standardized border radius values for consistent UI
 * Usage: borderRadius: BORDER_RADIUS.md
 *
 * Conventions:
 * - xs (4px): Progress bars, small dividers, inline elements
 * - sm (8px): Buttons, badges, small inputs
 * - md (12px): Cards, dialogs, medium inputs
 * - lg (16px): Large cards, sections, modals
 * - xl (24px): Hero sections, large feature cards
 * - full (9999px): Pills, circular buttons, avatars
 */
export const BORDER_RADIUS = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  full: '9999px',
};

// =============================================================================
// SPACING TOKENS
// =============================================================================

/**
 * Standardized spacing values (based on 4px grid)
 * Usage: padding: SPACING[4] (16px)
 */
export const SPACING = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
};

// =============================================================================
// AUDIO PLAYER CONFIGURATION
// =============================================================================

/**
 * Audio player settings
 */
export const AUDIO_CONFIG = {
  SKIP_SECONDS: 10,
  DEFAULT_VOLUME: 1.0,
  PROGRESS_UPDATE_INTERVAL_MS: 100,
};

// =============================================================================
// TRANSCRIPT CONFIGURATION
// =============================================================================

/**
 * Transcript display settings
 */
export const TRANSCRIPT_CONFIG = {
  MAX_HEIGHT_PX: 400,
  SCROLL_OFFSET_PX: 100,
  SPEAKER_LABELS: {
    agent: 'Interviewer',
    user: 'Bewerber',
  },
};

// =============================================================================
// INTERACTIVE STATE STYLES
// =============================================================================

/**
 * Interactive state styles for buttons and clickable elements
 * Use with cn() to conditionally apply styles
 */
export const INTERACTIVE_STATES = {
  positive: {
    base: 'bg-green-50 border border-green-200',
    hover: 'hover:bg-green-100',
    text: 'text-green-700',
    icon: 'text-green-500',
    // Combined for convenience
    all: 'bg-green-50 border border-green-200 hover:bg-green-100',
  },
  negative: {
    base: 'bg-red-50 border border-red-200',
    hover: 'hover:bg-red-100',
    text: 'text-red-700',
    icon: 'text-red-500',
    all: 'bg-red-50 border border-red-200 hover:bg-red-100',
  },
  warning: {
    base: 'bg-amber-50 border border-amber-200',
    hover: 'hover:bg-amber-100',
    text: 'text-amber-700',
    icon: 'text-amber-500',
    all: 'bg-amber-50 border border-amber-200 hover:bg-amber-100',
  },
  info: {
    base: 'bg-blue-50 border border-blue-200',
    hover: 'hover:bg-blue-100',
    text: 'text-blue-700',
    icon: 'text-blue-500',
    all: 'bg-blue-50 border border-blue-200 hover:bg-blue-100',
  },
  neutral: {
    base: 'bg-white border border-slate-200',
    hover: 'hover:bg-blue-50 hover:border-blue-300',
    text: 'text-slate-700',
    icon: 'text-slate-500',
    all: 'bg-white border border-slate-200 hover:bg-blue-50 hover:border-blue-300',
  },
};

/**
 * Get interactive state styles by type
 * @param {string} type - 'positive' | 'negative' | 'warning' | 'info' | 'neutral'
 * @returns {object} - Style object
 */
export function getInteractiveState(type) {
  return INTERACTIVE_STATES[type] || INTERACTIVE_STATES.neutral;
}

// =============================================================================
// SPEAKER STYLES (for transcript)
// =============================================================================

/**
 * Speaker-specific styles for transcript display
 */
export const SPEAKER_STYLES = {
  agent: {
    bg: 'bg-slate-50',
    border: 'border-l-slate-400',
    label: 'Interviewer',
    labelColor: 'text-slate-600',
  },
  user: {
    bg: 'bg-blue-50',
    border: 'border-l-blue-400',
    label: 'Bewerber',
    labelColor: 'text-blue-600',
  },
};

// =============================================================================
// ERROR MESSAGES
// =============================================================================

/**
 * Centralized error messages (German)
 */
export const ERROR_MESSAGES = {
  API_KEY_MISSING: 'Gemini API key is required',
  AUDIO_FILE_MISSING: 'Audio file is required',
  TRANSCRIPT_EMPTY: 'Transcript is empty',
  AUDIO_LOAD_FAILED: 'Audio konnte nicht geladen werden',
  AUDIO_PLAY_FAILED: 'Audio konnte nicht abgespielt werden',
  ANALYSIS_FAILED: 'Analyse konnte nicht durchgeführt werden',
  NETWORK_ERROR: 'Netzwerkfehler - bitte versuche es erneut',
  JSON_PARSE_FAILED: 'Fehler beim Parsen der Antwort',
};

// =============================================================================
// RHETORIK-GYM GAME CONFIGURATION
// =============================================================================

/**
 * Game mode configurations
 */
export const GAME_CONFIG = {
  KLASSIKER: {
    id: 'klassiker',
    duration: 60,
    title: 'Der Klassiker',
    subtitle: 'Elevator Pitch',
  },
  ZUFALL: {
    id: 'zufall',
    duration: 60,
    title: 'Zufalls-Thema',
    subtitle: 'Slot Machine',
  },
  STRESS: {
    id: 'stress',
    duration: 90,
    title: 'Stress-Test',
    subtitle: 'Überraschungsfrage',
  },
};

/**
 * Game score thresholds
 */
export const GAME_SCORE_THRESHOLDS = {
  EXCELLENT: 90,
  GOOD: 70,
  MEDIUM: 50,
  NEEDS_WORK: 30,
};

/**
 * Filler word penalty per occurrence
 */
export const FILLER_WORD_PENALTY = 10;

/**
 * Pace penalty thresholds for game scoring
 */
export const GAME_PACE_THRESHOLDS = {
  MIN_WPM: 100,  // Below this = too slow
  MAX_WPM: 160,  // Above this = too fast
  OPTIMAL_MIN: 120,
  OPTIMAL_MAX: 150,
};

/**
 * Get game score color scheme
 * @param {number} score - Score from 0-100
 * @returns {object} - Color scheme object
 */
export function getGameScoreColorScheme(score) {
  if (score >= GAME_SCORE_THRESHOLDS.EXCELLENT) {
    return {
      gradient: 'from-green-500 to-emerald-600',
      text: 'text-green-600',
      bg: 'bg-green-50',
      emoji: '🏆',
      label: 'Ausgezeichnet',
    };
  }
  if (score >= GAME_SCORE_THRESHOLDS.GOOD) {
    return {
      gradient: 'from-blue-500 to-blue-600',
      text: 'text-blue-600',
      bg: 'bg-blue-50',
      emoji: '🌟',
      label: 'Sehr gut',
    };
  }
  if (score >= GAME_SCORE_THRESHOLDS.MEDIUM) {
    return {
      gradient: 'from-amber-500 to-orange-500',
      text: 'text-amber-600',
      bg: 'bg-amber-50',
      emoji: '💪',
      label: 'Gut',
    };
  }
  if (score >= GAME_SCORE_THRESHOLDS.NEEDS_WORK) {
    return {
      gradient: 'from-orange-500 to-red-500',
      text: 'text-orange-600',
      bg: 'bg-orange-50',
      emoji: '🎯',
      label: 'Ausbaufähig',
    };
  }
  return {
    gradient: 'from-red-500 to-red-600',
    text: 'text-red-600',
    bg: 'bg-red-50',
    emoji: '🔄',
    label: 'Übung macht den Meister',
  };
}

export default {
  SCENARIO_CATEGORIES,
  SCENARIO_CATEGORY_CONFIG,
  getScenarioCategoryConfig,
  LEGACY_CATEGORY_MAP,
  normalizeCategory,
  GEMINI_MODELS,
  API_RETRY_CONFIG,
  SCORE_THRESHOLDS,
  getScoreColorScheme,
  CONFIDENCE_LABELS,
  DIFFICULTY_COLORS,
  getDifficultyConfig,
  PACING_CONFIG,
  OPTIMAL_WPM,
  TONALITY_CONFIG,
  FILLER_WORD_THRESHOLDS,
  FILLER_WORDS,
  UI_TIMING,
  BORDER_RADIUS,
  SPACING,
  AUDIO_CONFIG,
  TRANSCRIPT_CONFIG,
  INTERACTIVE_STATES,
  getInteractiveState,
  SPEAKER_STYLES,
  ERROR_MESSAGES,
  GAME_CONFIG,
  GAME_SCORE_THRESHOLDS,
  FILLER_WORD_PENALTY,
  GAME_PACE_THRESHOLDS,
  getGameScoreColorScheme,
};
