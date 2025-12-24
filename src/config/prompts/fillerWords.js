/**
 * Filler Words Configuration
 *
 * Centralized list of German filler words detected during audio analysis.
 * Used by both audioAnalysisPrompt.js and gamePrompts.js for consistency.
 */

/**
 * German filler words to detect in speech
 * These are common hesitation markers that indicate uncertainty or nervousness
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
  'Also',      // when used as hesitation at sentence start
  'Genau',     // when used as filler, not confirmation
  'Ja also',
];

/**
 * Get filler words as comma-separated string for prompts
 * @returns {string} - Filler words formatted for prompt inclusion
 */
export function getFillerWordsForPrompt() {
  return FILLER_WORDS.map(word => `"${word}"`).join(', ');
}

/**
 * Get filler words list with note about context-dependent words
 * @returns {string} - Formatted string with context notes
 */
export function getFillerWordsWithContext() {
  const baseWords = FILLER_WORDS.slice(0, 9).map(word => `"${word}"`).join(', ');
  return `${baseWords}, "Also" (am Satzanfang), "Genau" (als Füllwort), "Ja also"`;
}

export default {
  FILLER_WORDS,
  getFillerWordsForPrompt,
  getFillerWordsWithContext,
};
