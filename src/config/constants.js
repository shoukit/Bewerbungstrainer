/**
 * Application Constants
 *
 * Centralized configuration for magic numbers, thresholds, and settings.
 * This makes the codebase more maintainable and allows easy adjustments.
 */

// =============================================================================
// GEMINI AI CONFIGURATION
// =============================================================================

/**
 * Model fallback order - tries each model in sequence if previous fails
 */
export const GEMINI_MODELS = {
  PRIMARY: 'gemini-2.0-flash-exp',
  FALLBACK_ORDER: [
    'gemini-2.0-flash-exp',
    'gemini-2.0-flash',
    'gemini-1.5-flash-latest',
    'gemini-1.5-pro-latest',
  ],
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

export default {
  GEMINI_MODELS,
  API_RETRY_CONFIG,
  SCORE_THRESHOLDS,
  getScoreColorScheme,
  CONFIDENCE_LABELS,
  PACING_CONFIG,
  OPTIMAL_WPM,
  TONALITY_CONFIG,
  FILLER_WORD_THRESHOLDS,
  FILLER_WORDS,
  UI_TIMING,
  AUDIO_CONFIG,
  TRANSCRIPT_CONFIG,
  ERROR_MESSAGES,
};
