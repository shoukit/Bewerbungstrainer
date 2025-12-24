/**
 * Centralized Transcription Core
 *
 * Provides shared transcription logic for all Gemini-based audio analysis:
 * - Szenario-Training (via PHP backend)
 * - Rhetorik-Gym (frontend)
 * - Audio-Analyse (frontend)
 *
 * NOT used for ElevenLabs Live-Simulation (uses WebSocket transcription).
 *
 * Ensures consistent:
 * - Anti-hallucination rules
 * - "No speech detected" handling
 * - Output format validation
 */

import { getFillerWordsWithContext } from './fillerWords';

/**
 * Standard message when no speech is detected
 * Used consistently across all transcription modules
 */
export const NO_SPEECH_DETECTED = '[Keine Sprache erkannt]';

/**
 * Standard anti-hallucination rules for all Gemini transcription prompts
 * @returns {string} - The anti-hallucination prompt section
 */
export function getAntiHallucinationRules() {
  return `ABSOLUTE REGEL - KEINE HALLUZINATION:
Du DARFST NUR transkribieren, was TATSÄCHLICH in der Audio-Datei gesprochen wird.
- Bei Stille, Rauschen, oder unverständlichem Audio: transcript = "${NO_SPEECH_DETECTED}"
- Bei nur 1-2 Sekunden Audio ohne klare Sprache: transcript = "${NO_SPEECH_DETECTED}"
- ERFINDE NIEMALS Wörter, Sätze oder Inhalte!
- Wenn du unsicher bist, ob etwas gesagt wurde: NICHT transkribieren!
- Wenn jemand nur "Weiß ich nicht" oder "Keine Ahnung" sagt, transkribiere GENAU DAS
- Eine kurze Antwort wie "Ich weiß es nicht" ist eine valide Transkription
- HALLUZINIERE KEINE ausführlichen Antworten wenn der Sprecher das nicht gesagt hat`;
}

/**
 * Standard filler word detection instructions
 * @returns {string} - The filler word detection prompt section
 */
export function getFillerWordInstructions() {
  return `FÜLLWÖRTER-ERKENNUNG:
Erkenne diese deutschen Füllwörter im Transkript: ${getFillerWordsWithContext()}

Für jedes gefundene Füllwort dokumentiere:
- Das Wort selbst
- Wie oft es vorkommt
- Optional: Zeitstempel oder Kontext`;
}

/**
 * Standard empty result for when no speech is detected
 * Used in frontend validation to avoid sending to AI
 *
 * @param {string} mode - 'game' | 'analysis' | 'simulator'
 * @returns {object} - Empty result object appropriate for the mode
 */
export function getEmptyTranscriptResult(mode = 'game') {
  const baseMessage = 'Es wurde keine Sprache erkannt. Bitte stellen Sie sicher, dass Ihr Mikrofon funktioniert und Sie während der Aufnahme sprechen.';

  switch (mode) {
    case 'game':
      return {
        transcript: NO_SPEECH_DETECTED,
        filler_words: [],
        content_score: 0,
        content_feedback: baseMessage,
      };

    case 'analysis':
      return {
        audio_metrics: {
          summary_text: baseMessage,
          confidence_score: 0,
          speech_cleanliness: {
            score: 0,
            total_filler_count: 0,
            filler_word_analysis: [],
            feedback: 'Keine Sprache zur Analyse erkannt.',
          },
          pacing: {
            rating: 'keine_sprache',
            estimated_wpm: 0,
            issues_detected: [],
            feedback: 'Keine Sprache zur Analyse erkannt.',
          },
          tonality: {
            rating: 'keine_sprache',
            emotional_tone: 'neutral',
            highlights: [],
            feedback: 'Keine Sprache zur Analyse erkannt.',
          },
        },
      };

    case 'simulator':
      return {
        transcript: NO_SPEECH_DETECTED,
        feedback: {
          summary: baseMessage,
          strengths: [],
          improvements: ['Bitte versuchen Sie es erneut und sprechen Sie klar und deutlich ins Mikrofon.'],
          tips: ['Achten Sie darauf, dass Ihr Mikrofon funktioniert und nicht stummgeschaltet ist.'],
          scores: { content: 0, structure: 0, relevance: 0, delivery: 0, overall: 0 },
        },
        audio_metrics: {
          speech_rate: 'keine_sprache',
          filler_words: { count: 0, words: [], severity: 'keine' },
          confidence_score: 0,
          clarity_score: 0,
          notes: 'Keine Sprache erkannt',
        },
      };

    default:
      return {
        transcript: NO_SPEECH_DETECTED,
        error: baseMessage,
      };
  }
}

/**
 * Check if a transcript indicates no speech was detected
 * @param {string} transcript - The transcript to check
 * @returns {boolean} - True if no speech was detected
 */
export function isEmptyTranscript(transcript) {
  if (!transcript) return true;
  const normalized = transcript.trim().toLowerCase();
  return (
    normalized === '' ||
    normalized === NO_SPEECH_DETECTED.toLowerCase() ||
    normalized.includes('keine sprache erkannt') ||
    normalized.includes('no speech detected')
  );
}

/**
 * Minimum audio size in bytes to consider as potentially containing speech
 * Anything smaller is likely silence or noise
 */
export const MIN_AUDIO_SIZE_BYTES = 5000;

export default {
  NO_SPEECH_DETECTED,
  MIN_AUDIO_SIZE_BYTES,
  getAntiHallucinationRules,
  getFillerWordInstructions,
  getEmptyTranscriptResult,
  isEmptyTranscript,
};
