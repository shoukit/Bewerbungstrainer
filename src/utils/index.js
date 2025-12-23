/**
 * Utilities - Central Export
 *
 * Import all utilities from this file for cleaner imports:
 * import { formatDuration, delay, maskApiKey } from '@/utils';
 */

// Formatting utilities
export {
  formatDuration,
  formatTime,
  formatDurationText,
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatFileSize,
  formatNumber,
  formatPercent,
  truncateText,
} from './formatting';

// Timing utilities
export { delay, createTimeout, debounce, throttle } from './timing';

// Retry utilities
export { retryWithBackoff, DEFAULT_RETRY_CONFIG } from './retry';

// Audio utilities
export {
  base64ToBlob,
  blobToBase64,
  audioFileToInlineData,
  getMimeTypeFromBlob,
  createAudioContext,
  createAnalyser,
  getAudioLevel,
} from './audio';

// JSON parsing utilities
export {
  decodeUnicodeEscapes,
  decodeObjectStrings,
  stripCodeBlocks,
  safeParseJSON,
  parseFeedbackJSON,
  parseAudioAnalysisJSON,
  parseTranscriptJSON,
  isNewAudioAnalysisFormat,
} from './parseJSON';

// Security utilities
export { maskApiKey } from './security';

// Color utilities
export {
  getScoreColor,
  getScoreGradient,
  getScoreBackgroundColor,
  getScoreEmoji,
} from './colorUtils';

// Icon maps
export {
  CATEGORY_ICONS,
  DIFFICULTY_ICONS,
  getCategoryIcon,
  getDifficultyIcon,
  getStatusIcon,
  getBriefingIcon,
  getGameModeIcon,
} from './iconMaps';
