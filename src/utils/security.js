/**
 * Security utilities for handling sensitive data
 */

/**
 * Mask sensitive values like API keys for safe logging
 * @param {string} value - Sensitive value to mask
 * @param {number} visibleStart - Characters to show at start
 * @param {number} visibleEnd - Characters to show at end
 * @returns {string} Masked value
 */
export const maskSensitiveValue = (value, visibleStart = 8, visibleEnd = 4) => {
  if (!value || typeof value !== 'string') return '***';
  if (value.length < visibleStart + visibleEnd + 3) return '***';

  const start = value.substring(0, visibleStart);
  const end = value.substring(value.length - visibleEnd);
  return `${start}...${end}`;
};

/**
 * Mask API key for logging
 * @param {string} apiKey - API key to mask
 * @returns {string} Masked API key
 */
export const maskApiKey = (apiKey) => maskSensitiveValue(apiKey, 8, 4);

/**
 * Mask email address
 * @param {string} email - Email to mask
 * @returns {string} Masked email
 */
export const maskEmail = (email) => {
  if (!email || typeof email !== 'string') return '***';

  const parts = email.split('@');
  if (parts.length !== 2) return '***';

  const [local, domain] = parts;
  const maskedLocal = local.length > 2
    ? `${local[0]}${'*'.repeat(Math.min(local.length - 2, 5))}${local[local.length - 1]}`
    : local;

  return `${maskedLocal}@${domain}`;
};

/**
 * Check if a string looks like an API key (for preventing accidental logging)
 * @param {string} str - String to check
 * @returns {boolean} True if string looks like an API key
 */
export const looksLikeApiKey = (str) => {
  if (!str || typeof str !== 'string') return false;

  // Common API key patterns
  const patterns = [
    /^sk-[a-zA-Z0-9]{20,}$/,           // OpenAI style
    /^AIza[a-zA-Z0-9_-]{35}$/,         // Google style
    /^[a-f0-9]{32}$/i,                  // 32-char hex
    /^[a-zA-Z0-9]{40,}$/,              // Long alphanumeric
  ];

  return patterns.some(pattern => pattern.test(str));
};

/**
 * Safe JSON stringify that masks sensitive fields
 * @param {object} obj - Object to stringify
 * @param {string[]} sensitiveFields - Fields to mask
 * @returns {string} JSON string with masked sensitive fields
 */
export const safeStringify = (obj, sensitiveFields = ['apiKey', 'api_key', 'password', 'token', 'secret']) => {
  const maskValue = (key, value) => {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
      return maskSensitiveValue(String(value));
    }
    if (typeof value === 'string' && looksLikeApiKey(value)) {
      return maskSensitiveValue(value);
    }
    return value;
  };

  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      return value;
    }
    return maskValue(key, value);
  }, 2);
};
