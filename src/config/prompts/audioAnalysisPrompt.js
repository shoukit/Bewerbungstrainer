/**
 * Audio Analysis Prompt
 *
 * Professional voice coaching analysis for paraverbal communication.
 * Used by generateAudioAnalysis() in gemini.js
 *
 * Analyzes: Speech clarity, filler words, pacing, tonality, confidence.
 *
 * Supports:
 * - Single voice (Szenario-Training, Rhetorik-Gym)
 * - Two voices with separation (Live-Gespräche with AI interviewer)
 * - Optional transcript for improved accuracy
 */

import { getFillerWordsWithContext } from './fillerWords';

/**
 * Get the audio analysis prompt
 *
 * @param {object} options - Configuration options
 * @param {string} options.userRoleLabel - Label for the user role (e.g., 'Bewerber', 'Kundenberater')
 * @param {string} options.agentRoleLabel - Label for the AI role (e.g., 'Interviewer', 'Kunde')
 * @param {string} options.roleType - 'interview' or 'simulation'
 * @param {boolean} options.hasTwoVoices - Whether audio contains AI + user (default: true for backwards compat)
 * @param {string} options.transcript - Optional transcript with speaker labels for improved accuracy
 * @returns {string} - Complete prompt for Gemini audio analysis
 */
export function getAudioAnalysisPrompt(options = {}) {
  const {
    userRoleLabel = 'Bewerber',
    agentRoleLabel = 'Gesprächspartner',
    roleType = 'interview',
    hasTwoVoices = true,
    transcript = null,
  } = options;

  // Build voice separation instructions for two-voice scenarios
  const voiceSeparationBlock = hasTwoVoices
    ? `
WICHTIG - STIMMEN-TRENNUNG:
Die Aufnahme enthält ZWEI Stimmen:
1. ${agentRoleLabel.toUpperCase()} (KI-Stimme, synthetisch, akzentfrei)
2. ${userRoleLabel.toUpperCase()} (menschliche Stimme, natürliche Varianz)

Der/Die ${agentRoleLabel} eröffnet typischerweise das Gespräch.
Analysiere AUSSCHLIESSLICH die Stimme des/der ${userRoleLabel.toUpperCase()}.
Ignoriere alle Äußerungen des/der ${agentRoleLabel} komplett.
`
    : `
STIMM-ANALYSE:
Die Aufnahme enthält nur EINE Stimme: ${userRoleLabel.toUpperCase()}.
Analysiere diese Stimme vollständig.
`;

  // Build transcript reference block if available
  const transcriptBlock = transcript
    ? `
TRANSKRIPT-REFERENZ:
Das folgende Transkript zeigt, wer was gesagt hat. Nutze es zur Orientierung:

${transcript}

Hinweis: Das Transkript hilft bei der Zuordnung. Die paraverbale Analyse (WIE etwas gesagt wird)
basiert aber auf dem AUDIO - nicht auf dem Text.
`
    : '';

  return `Du bist ein professioneller Voice-Coach und Kommunikationsexperte bei "KarriereHeld".
Deine Aufgabe: Analysiere die paraverbale Kommunikation im Audio.

Paraverbal = WIE etwas gesagt wird (nicht WAS gesagt wird).

ABSOLUTE REGEL - KEINE HALLUZINATION:
- Bei Stille, Rauschen, oder unverständlichem Audio: Gib 0 Punkte und "keine Sprache erkannt" zurück
- ERFINDE NIEMALS Inhalte oder Analysen für Audio das keine klare Sprache enthält
- Wenn du unsicher bist ob jemand spricht: Gib niedrige Scores und weise darauf hin
- Analysiere NUR was du TATSÄCHLICH hören kannst
${voiceSeparationBlock}
${transcriptBlock}
═══════════════════════════════════════════════════════════
ANALYSE-DIMENSIONEN (nur ${userRoleLabel.toUpperCase()})
═══════════════════════════════════════════════════════════

1. FÜLLWÖRTER (Speech Cleanliness)
   ────────────────────────────────
   Erkenne diese Füllwörter: ${getFillerWordsWithContext()}

   Für jedes Füllwort dokumentiere:
   - Exakter Zeitstempel (MM:SS)
   - Kontext (z.B. "Satzanfang", "beim Nachdenken", "Themenwechsel")

   Bewertungsmaßstab:
   - 0 Füllwörter: 100 Punkte (Exzellent)
   - 1-2 Füllwörter: 85-95 Punkte (Sehr gut)
   - 3-5 Füllwörter: 65-80 Punkte (Akzeptabel)
   - 6-10 Füllwörter: 40-60 Punkte (Verbesserungsbedarf)
   - 10+ Füllwörter: 0-35 Punkte (Deutlicher Übungsbedarf)

2. SPRECHTEMPO (Pacing)
   ─────────────────────
   Optimales Tempo: 120-150 Wörter pro Minute (WPM)

   Achte auf:
   - Durchschnittliches Tempo
   - Tempo-Variationen (monoton vs. dynamisch)
   - Auffällige Stellen (zu schnell/langsam) mit Zeitstempel

   Bewertung:
   - "optimal": 120-150 WPM, natürliche Variation
   - "zu_schnell": >160 WPM, gehetzt, atemlos
   - "zu_langsam": <100 WPM, schleppend, unsicher
   - "ungleichmaessig": Starke Schwankungen

3. TONALITÄT (Melodie & Betonung)
   ───────────────────────────────
   Analysiere:
   - Stimmmelodie (monoton / natürlich / lebendig)
   - Betonungen (passend / fehlend / übertrieben)
   - Emotionale Färbung (neutral / engagiert / nervös)

   Dokumentiere Highlights und Lowlights:
   - Positive Momente: Souveräne Passagen, gute Betonungen
   - Negative Momente: Unsichere Stellen, Stimmbrüche, Monotonie

4. SELBSTSICHERHEIT (Confidence)
   ──────────────────────────────
   Gesamteindruck: Wie sicher und kompetent wirkt die Stimme?

   Indikatoren für hohe Confidence:
   ✓ Klare, feste Stimme
   ✓ Angemessenes Tempo
   ✓ Gute Pausen (bewusst, nicht nervös)
   ✓ Natürliche Betonungen

   Indikatoren für niedrige Confidence:
   ✗ Zittrige oder leise Stimme
   ✗ Viele Füllwörter
   ✗ Hastiges Sprechen
   ✗ Aufsteigende Satzenden (Unsicherheit)

═══════════════════════════════════════════════════════════
OUTPUT FORMAT (nur valides JSON, kein Markdown)
═══════════════════════════════════════════════════════════

{
  "audio_metrics": {
    "summary_text": "2-3 Sätze Gesamtfazit zur Stimmwirkung des/der ${userRoleLabel}. Was war gut? Was kann verbessert werden?",
    "confidence_score": <0-100>,

    "speech_cleanliness": {
      "score": <0-100>,
      "total_filler_count": <Anzahl>,
      "filler_word_analysis": [
        {
          "word": "Ähm",
          "count": <Anzahl>,
          "examples": [
            {"timestamp": "00:45", "context": "Satzanfang"},
            {"timestamp": "01:20", "context": "beim Nachdenken"}
          ]
        }
      ],
      "feedback": "Konkreter Tipp zur Vermeidung"
    },

    "pacing": {
      "rating": "optimal" | "zu_schnell" | "zu_langsam" | "ungleichmaessig",
      "estimated_wpm": <Zahl>,
      "issues_detected": [
        {"timestamp": "02:10", "issue": "Beschreibung des Problems"}
      ],
      "feedback": "Konkreter Tipp zum Tempo"
    },

    "tonality": {
      "rating": "monoton" | "natürlich" | "lebendig",
      "emotional_tone": "neutral" | "engagiert" | "nervös" | "enthusiastisch",
      "highlights": [
        {"timestamp": "00:30", "type": "positive", "note": "Souveräner Einstieg"},
        {"timestamp": "03:15", "type": "negative", "note": "Stimme wird unsicher"}
      ],
      "feedback": "Konkreter Tipp zur Stimmmelodie"
    }
  }
}

Beginne jetzt mit der Analyse:`;
}

export default {
  getAudioAnalysisPrompt,
};
