/**
 * JSON Parsing Utilities
 *
 * Centralized utilities for parsing JSON responses from AI APIs.
 * Handles common issues like markdown code blocks, whitespace, etc.
 */

/**
 * Decodes Unicode escape sequences that may appear in strings
 * Handles cases where backend returns double-escaped Unicode (e.g., "u00f6" instead of "ö")
 *
 * @param {string} str - The string to decode
 * @returns {string} - The decoded string
 */
export function decodeUnicodeEscapes(str) {
  if (!str || typeof str !== 'string') return str;

  // Match patterns like \u00f6 or u00f6 (with or without backslash)
  return str
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/(?<!\\)u([0-9a-fA-F]{4})/g, (match, hex) => {
      // Only replace if it looks like a Unicode escape (not part of a word)
      const charCode = parseInt(hex, 16);
      // Only decode if it's a reasonable character (not control chars)
      if (charCode >= 0x00A0 && charCode <= 0xFFFF) {
        return String.fromCharCode(charCode);
      }
      return match;
    });
}

/**
 * Strips markdown code block formatting from a string
 * Handles ```json, ```, and plain JSON
 *
 * @param {string} str - The string to strip
 * @returns {string} - The cleaned string
 */
export function stripCodeBlocks(str) {
  if (!str || typeof str !== 'string') return str;

  let cleaned = str.trim();

  // Remove ```json ... ``` blocks
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```\s*$/, '');
  }
  // Remove generic ``` ... ``` blocks
  else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```\s*$/, '');
  }

  return cleaned.trim();
}

/**
 * Safely parses a JSON string or returns the object if already parsed
 * Handles AI response quirks like code blocks, extra whitespace, etc.
 *
 * @param {string|object|null} input - JSON string or object to parse
 * @param {object} options - Options for parsing
 * @param {boolean} options.silent - If true, don't log errors (default: false)
 * @param {string} options.context - Context string for error logging
 * @returns {object|null} - Parsed object or null on failure
 */
export function safeParseJSON(input, options = {}) {
  const { silent = false, context = 'JSON' } = options;

  // Handle null/undefined
  if (input === null || input === undefined) {
    return null;
  }

  // Already an object, return as-is
  if (typeof input === 'object') {
    return input;
  }

  // Must be a string at this point
  if (typeof input !== 'string') {
    if (!silent) {
      console.warn(`[parseJSON] Expected string or object, got ${typeof input}`);
    }
    return null;
  }

  try {
    // Strip code blocks and whitespace
    let cleaned = stripCodeBlocks(input);

    // Decode any Unicode escape sequences
    cleaned = decodeUnicodeEscapes(cleaned);

    // Parse JSON
    const parsed = JSON.parse(cleaned);

    return parsed;
  } catch (error) {
    if (!silent) {
      console.error(`[parseJSON] Failed to parse ${context}:`, error.message);
      console.error(`[parseJSON] Input preview: ${input.substring(0, 100)}...`);
    }
    return null;
  }
}

/**
 * Parses feedback JSON from Gemini API response
 *
 * @param {string|object} feedbackJson - The feedback_json field
 * @returns {object|null} - Parsed feedback object
 */
export function parseFeedbackJSON(feedbackJson) {
  return safeParseJSON(feedbackJson, { context: 'feedback_json' });
}

/**
 * Parses audio analysis JSON from Gemini API response
 *
 * @param {string|object} audioAnalysisJson - The audio_analysis_json field
 * @returns {object|null} - Parsed audio analysis object
 */
export function parseAudioAnalysisJSON(audioAnalysisJson) {
  return safeParseJSON(audioAnalysisJson, { context: 'audio_analysis_json' });
}

/**
 * Parses transcript JSON (array of conversation entries)
 *
 * @param {string|array} transcript - The transcript field
 * @returns {array} - Parsed transcript array or empty array
 */
export function parseTranscriptJSON(transcript) {
  if (!transcript) return [];

  const parsed = safeParseJSON(transcript, { context: 'transcript' });

  // Ensure we return an array
  return Array.isArray(parsed) ? parsed : [];
}

/**
 * Validates that a parsed audio analysis has the expected structure
 *
 * @param {object} data - Parsed audio analysis object
 * @returns {boolean} - True if valid new format
 */
export function isNewAudioAnalysisFormat(data) {
  if (!data) return false;

  const audioMetrics = data.audio_metrics;
  if (!audioMetrics) return false;

  // Check for key fields in new format
  return (
    audioMetrics.confidence_score !== undefined ||
    audioMetrics.speech_cleanliness !== undefined
  );
}

/**
 * Recursively decode Unicode escapes in all string properties of an object
 * Handles the case where backend returns strings like "Betriebszugehu00f6rigkeit"
 *
 * @param {any} data - Data to decode
 * @returns {any} - Decoded data
 */
export function decodeObjectStrings(data) {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    return decodeUnicodeEscapes(data);
  }

  if (Array.isArray(data)) {
    return data.map(decodeObjectStrings);
  }

  if (typeof data === 'object') {
    const decoded = {};
    for (const key of Object.keys(data)) {
      decoded[key] = decodeObjectStrings(data[key]);
    }
    return decoded;
  }

  return data;
}

export default {
  decodeUnicodeEscapes,
  decodeObjectStrings,
  stripCodeBlocks,
  safeParseJSON,
  parseFeedbackJSON,
  parseAudioAnalysisJSON,
  parseTranscriptJSON,
  isNewAudioAnalysisFormat,
};
