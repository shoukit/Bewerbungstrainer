/**
 * Formatting utilities for consistent display across the application
 */

/**
 * Format seconds as mm:ss or hh:mm:ss
 * @param {number} seconds - Total seconds
 * @param {boolean} showHours - Include hours even if 0
 * @returns {string} Formatted time string
 */
export const formatDuration = (seconds, showHours = false) => {
  if (seconds === null || seconds === undefined || isNaN(seconds)) {
    return '0:00';
  }

  const totalSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hours > 0 || showHours) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Alias for formatDuration for backwards compatibility
 */
export const formatTime = formatDuration;

/**
 * Format seconds as human-readable German text
 * @param {number} seconds - Total seconds
 * @returns {string} Human-readable duration (e.g., "2 Min. 30 Sek.")
 */
export const formatDurationText = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0 Sek.';

  const totalSeconds = Math.floor(seconds);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;

  if (mins === 0) {
    return `${secs} Sek.`;
  }
  if (secs === 0) {
    return `${mins} Min.`;
  }
  return `${mins} Min. ${secs} Sek.`;
};

/**
 * Parse WordPress/MySQL date string correctly
 * WordPress stores dates in local server time, not UTC.
 * This function normalizes the date string to be parsed as local time.
 *
 * @param {string|Date} dateString - Date to parse
 * @returns {Date} Parsed date object
 */
export const parseWordPressDate = (dateString) => {
  if (!dateString) return new Date(0);
  if (dateString instanceof Date) return dateString;

  // WordPress stores dates in local server time, not UTC
  // Remove any timezone suffix (Z or +00:00) and normalize format
  const normalized = String(dateString)
    .replace(' ', 'T')           // MySQL format: "YYYY-MM-DD HH:MM:SS" -> "YYYY-MM-DDTHH:MM:SS"
    .replace(/Z$/, '')           // Remove UTC marker
    .replace(/[+-]\d{2}:\d{2}$/, ''); // Remove timezone offset

  return new Date(normalized);
};

/**
 * Format date string to German locale
 * @param {string|Date} dateString - Date to format
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString, options = {}) => {
  if (!dateString) return '-';

  try {
    const date = parseWordPressDate(dateString);
    if (isNaN(date.getTime())) return '-';

    const defaults = {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    };

    return date.toLocaleDateString('de-DE', { ...defaults, ...options });
  } catch {
    return '-';
  }
};

/**
 * Format date with time
 * @param {string|Date} dateString - Date to format
 * @returns {string} Formatted date and time string
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return '-';

  try {
    const date = parseWordPressDate(dateString);
    if (isNaN(date.getTime())) return '-';

    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
};

/**
 * Format relative time (e.g., "vor 5 Minuten")
 * @param {string|Date} dateString - Date to format
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (dateString) => {
  if (!dateString) return '-';

  try {
    const date = parseWordPressDate(dateString);
    if (isNaN(date.getTime())) return '-';

    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 0) return 'Gerade eben'; // Future dates (clock skew)
    if (diffSecs < 60) return 'Gerade eben';
    if (diffMins < 60) return `vor ${diffMins} ${diffMins === 1 ? 'Minute' : 'Minuten'}`;
    if (diffHours < 24) return `vor ${diffHours} ${diffHours === 1 ? 'Stunde' : 'Stunden'}`;
    if (diffDays < 7) return `vor ${diffDays} ${diffDays === 1 ? 'Tag' : 'Tagen'}`;

    return formatDate(dateString);
  } catch {
    return '-';
  }
};

/**
 * Format file size in human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (!bytes || isNaN(bytes)) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`;
};

/**
 * Format number with German locale (e.g., 1.234,56)
 * @param {number} num - Number to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted number
 */
export const formatNumber = (num, decimals = 0) => {
  if (num === null || num === undefined || isNaN(num)) return '-';
  return num.toLocaleString('de-DE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

/**
 * Format percentage
 * @param {number} value - Value (0-100 or 0-1)
 * @param {boolean} isDecimal - If true, value is 0-1, otherwise 0-100
 * @returns {string} Formatted percentage
 */
export const formatPercent = (value, isDecimal = false) => {
  if (value === null || value === undefined || isNaN(value)) return '-';
  const percent = isDecimal ? value * 100 : value;
  return `${Math.round(percent)}%`;
};

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};
