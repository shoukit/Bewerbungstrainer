/**
 * Color Utilities
 *
 * Provides color sanitization to prevent problematic colors (magenta, red)
 * from appearing in the UI. This is a sustainable solution that works
 * regardless of what colors are stored in the database.
 */

/**
 * Problematic colors mapped to safe alternatives
 */
const BLOCKED_COLORS = {
  // Magenta / Pink variants -> Blue
  '#e91e63': '#3b82f6',
  '#ec407a': '#3b82f6',
  '#f06292': '#3b82f6',
  '#d81b60': '#3b82f6',
  '#c2185b': '#3b82f6',
  '#ad1457': '#3b82f6',
  '#880e4f': '#3b82f6',
  '#ff4081': '#3b82f6',
  '#f50057': '#3b82f6',

  // Red variants -> Blue
  '#f44336': '#3b82f6',
  '#e53935': '#3b82f6',
  '#d32f2f': '#3b82f6',
  '#c62828': '#3b82f6',
  '#b71c1c': '#3b82f6',
  '#ff1744': '#3b82f6',
  '#ff5252': '#3b82f6',
  '#ef5350': '#3b82f6',
  '#e57373': '#3b82f6',

  // Deep Orange that looks too red -> Orange
  '#ff5722': '#f59e0b',
  '#e64a19': '#f59e0b',
  '#bf360c': '#f59e0b',
};

/**
 * Check if a color is in the red/magenta family
 * Uses HSL conversion to detect colors with hue between 330-360 or 0-15
 */
const isProblematicColor = (hex) => {
  if (!hex || typeof hex !== 'string') return false;

  // Remove # if present
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length !== 6) return false;

  // Convert to RGB
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  // Convert to HSL
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return false; // Grayscale

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h;
  switch (max) {
    case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
    case g: h = ((b - r) / d + 2) / 6; break;
    case b: h = ((r - g) / d + 4) / 6; break;
    default: h = 0;
  }

  const hue = h * 360;

  // Block red/magenta hues (330-360 and 0-20) with high saturation
  if (s > 0.4 && ((hue >= 330 && hue <= 360) || (hue >= 0 && hue <= 20))) {
    return true;
  }

  return false;
};

/**
 * Sanitize a color - returns a safe alternative if the color is problematic
 *
 * @param {string} color - Hex color code (with or without #)
 * @param {string} fallback - Fallback color if input is invalid (default: blue)
 * @returns {string} Safe hex color code
 */
export const sanitizeColor = (color, fallback = '#3b82f6') => {
  if (!color || typeof color !== 'string') return fallback;

  // Normalize the color
  const normalizedColor = color.toLowerCase().trim();

  // Check against known blocked colors
  if (BLOCKED_COLORS[normalizedColor]) {
    return BLOCKED_COLORS[normalizedColor];
  }

  // Check if it's in the problematic hue range
  if (isProblematicColor(normalizedColor)) {
    return fallback;
  }

  return color;
};

/**
 * Create color variants with alpha transparency
 *
 * @param {string} hexColor - Base hex color
 * @param {number} alpha - Alpha value (0-100, will be converted to hex)
 * @returns {string} Color with alpha suffix for CSS
 */
export const withAlpha = (hexColor, alpha) => {
  const safeColor = sanitizeColor(hexColor);
  // Convert alpha (0-100) to hex (00-ff)
  const alphaHex = Math.round((alpha / 100) * 255).toString(16).padStart(2, '0');
  return `${safeColor}${alphaHex}`;
};

/**
 * Default safe color palette for the application
 */
export const SAFE_PALETTE = {
  blue: '#3b82f6',
  indigo: '#6366f1',
  purple: '#8b5cf6',
  teal: '#14b8a6',
  emerald: '#10b981',
  amber: '#f59e0b',
  orange: '#f97316',
  cyan: '#06b6d4',
  slate: '#64748b',
};

export default sanitizeColor;
