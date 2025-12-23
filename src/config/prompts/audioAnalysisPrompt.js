/**
 * Audio Analysis Prompt
 *
 * Used by generateAudioAnalysis() in gemini.js
 * Analyzes audio files for paraverbal communication (speech quality, filler words, pacing, tonality).
 *
 * IMPORTANT: This prompt instructs the AI to analyze ONLY the user's voice,
 * ignoring the AI partner who may open the conversation.
 *
 * Supports dynamic role labels for different training scenarios:
 * - Interview mode: User is "Bewerber", AI is "Interviewer"
 * - Simulation mode: User is e.g. "Kundenberater", AI is e.g. "Kunde"
 */

import { getFillerWordsWithContext } from './fillerWords';

/**
 * Get the audio analysis prompt
 * @param {object} options - Options for the prompt
 * @param {string} options.userRoleLabel - Label for the user role (e.g., 'Bewerber', 'Kundenberater')
 * @param {string} options.agentRoleLabel - Label for the AI role (e.g., 'Interviewer', 'Kunde')
 * @param {string} options.roleType - 'interview' or 'simulation'
 * @returns {string} - Complete prompt for Gemini audio analysis
 */
export function getAudioAnalysisPrompt(options = {}) {
  const {
    userRoleLabel = 'Bewerber',
    agentRoleLabel = 'Gesprächspartner',
    roleType = 'interview',
  } = options;

  // Determine who opens the conversation based on role type
  const whoOpens = roleType === 'simulation'
    ? `Der/Die ${agentRoleLabel} ERÖFFNET das Gespräch (KI-Stimme).`
    : `Der/Die ${agentRoleLabel} ERÖFFNET das Gespräch (KI-Stimme, stellt Fragen).`;

  return `Du bist der Voice-Coach von "KarriereHeld".
Analysiere die Audio-Datei dieses Rollenspiels.

WICHTIG - QUELLEN-TRENNUNG:
Die Aufnahme enthält ZWEI Stimmen:
1. ${agentRoleLabel.toUpperCase()} (KI-Stimme, akzentfrei). ${whoOpens}
2. ${userRoleLabel.toUpperCase()} (Mensch, der trainiert wird).

DEINE AUFGABE:
Höre dir das gesamte Audio an, aber bewerte AUSSCHLIESSLICH die Stimme des/der ${userRoleLabel.toUpperCase()} (2).
Ignoriere alles, was der/die ${agentRoleLabel} sagt (Pausen, Tempo, Inhalt).

ANALYSE-DIMENSIONEN (NUR ${userRoleLabel.toUpperCase()}):

1. SPEECH CLEANLINESS (Füllwörter)
- Zähle diese Füllwörter beim/bei der ${userRoleLabel}: ${getFillerWordsWithContext()}
- Gib GENAUE Zeitstempel an (Format MM:SS).

2. PACING (Tempo)
- Wie wirkt das Sprechtempo in den Sprech-Phasen? (Gehetzt vs. Souverän).
- Notiere auffällige Stellen mit Zeitstempel.

3. TONALITY (Betonung & Melodie)
- Ist die Stimme monoton, natürlich oder lebendig?
- Suche nach Highlights (souverän) oder Lowlights (unsicher/brüchig).

4. CONFIDENCE (Wirkung)
- Confidence Score (0-100): Wie sicher klingt der/die ${userRoleLabel} insgesamt?

OUTPUT FORMAT:
Antworte NUR mit einem validen JSON-Objekt. Keine Markdown-Formatierung, kein Einleitungstext.

{
  "audio_metrics": {
    "summary_text": "Kurzes Fazit zur Stimme des/der ${userRoleLabel} (max 2 Sätze).",
    "confidence_score": (0-100),

    "speech_cleanliness": {
      "score": (0-100, 100=Perfekt sauber),
      "filler_word_analysis": [
        {
          "word": "Ähm",
          "count": (Anzahl),
          "examples": [
            {"timestamp": "00:45", "context": "Satzanfang"},
            {"timestamp": "01:20", "context": "Nachdenken"}
          ]
        },
        {
          "word": "Halt/Eigentlich",
          "count": (Anzahl),
          "examples": [
            {"timestamp": "00:32"}
          ]
        }
      ],
      "feedback": "Tipp zur Vermeidung von Füllwörtern."
    },

    "pacing": {
      "rating": "zu_schnell" | "optimal" | "zu_langsam",
      "perceived_wpm": "string (z.B. '~140 WPM')",
      "issues_detected": [
        {"timestamp": "02:10", "issue": "Sehr schnell, wirkt gehetzt"}
      ],
      "feedback": "Feedback zur Geschwindigkeit."
    },

    "tonality": {
      "rating": "monoton" | "natürlich" | "lebendig",
      "highlights": [
        {"timestamp": "00:05", "type": "positive", "note": "Souveräner Einstieg"},
        {"timestamp": "03:20", "type": "negative", "note": "Stimme wird unsicher"}
      ],
      "feedback": "Feedback zur Melodie und Betonung."
    }
  }
}

JSON Analyse:`;
}

export default {
  getAudioAnalysisPrompt,
};
