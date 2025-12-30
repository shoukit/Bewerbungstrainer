/**
 * Interview Feedback Prompt
 *
 * Used by generateInterviewFeedback() in gemini.js
 * Analyzes interview transcripts and provides coaching feedback.
 *
 * Supports two modes:
 * - interview: AI leads the conversation (e.g., job interview)
 * - simulation: User leads the conversation (e.g., customer service)
 */

/**
 * Generate the feedback prompt with transcript
 * @param {string} transcript - The conversation transcript
 * @param {object} options - Options for the feedback prompt
 * @param {string} options.roleType - 'interview' or 'simulation'
 * @param {string} options.userRoleLabel - Label for the user role (e.g., 'Bewerber', 'Kundenberater')
 * @param {string} options.agentRoleLabel - Label for the AI role (e.g., 'Interviewer', 'Kunde')
 * @returns {string} - Complete prompt for Gemini
 */
export function getFeedbackPrompt(transcript, options = {}) {
  const {
    roleType = 'interview',
    userRoleLabel = 'Bewerber',
    agentRoleLabel = 'Gesprächspartner',
  } = options;

  // Generate role-specific prompt based on type
  if (roleType === 'simulation') {
    return getSimulationFeedbackPrompt(transcript, userRoleLabel, agentRoleLabel);
  }

  return getInterviewFeedbackPrompt(transcript, userRoleLabel, agentRoleLabel);
}

/**
 * Generate feedback prompt for interview mode (AI leads)
 * @param {string} transcript - The conversation transcript
 * @param {string} userRoleLabel - Label for the user role
 * @param {string} agentRoleLabel - Label for the AI role
 * @returns {string} - Complete prompt for Gemini
 */
function getInterviewFeedbackPrompt(transcript, userRoleLabel, agentRoleLabel) {
  return `Du bist ein professioneller Karriere-Coach. Analysiere das folgende Gespräch-Transkript und gib konstruktives Feedback in "Du"-Form.

SEHR WICHTIG: Bewerte AUSSCHLIESSLICH den/die ${userRoleLabel.toUpperCase()}!
- Die Aussagen des ${agentRoleLabel} (z.B. "H. Müller", "${agentRoleLabel}", oder ähnliche Kennzeichnungen) dienen NUR als Kontext für die Fragen.
- Dein gesamtes Feedback, alle Stärken, Verbesserungen, Tipps und Bewertungen beziehen sich NUR auf die Antworten und das Verhalten des/der ${userRoleLabel}.
- Bewerte NICHT die Qualität der Fragen oder das Verhalten des ${agentRoleLabel}.

WICHTIG: Antworte NUR mit einem JSON-Objekt in folgendem Format (keine zusätzlichen Erklärungen):

{
  "summary": "Eine kurze Zusammenfassung des Gesamteindrucks des/der ${userRoleLabel} (2-3 Sätze)",
  "strengths": [
    "Stärke 1: Konkrete positive Beobachtung",
    "Stärke 2: Was gut gemacht wurde",
    "Stärke 3: Weitere Stärken"
  ],
  "improvements": [
    "Verbesserung 1: Konkreter Verbesserungsbereich",
    "Verbesserung 2: Was besser gemacht werden könnte",
    "Verbesserung 3: Weitere Verbesserungspotenziale"
  ],
  "tips": [
    "Tipp 1: Konkrete, umsetzbare Empfehlung",
    "Tipp 2: Praktischer Ratschlag",
    "Tipp 3: Weitere hilfreiche Tipps"
  ],
  "rating": {
    "overall": 7,
    "communication": 6,
    "motivation": 7,
    "professionalism": 8
  }
}

Bewertungsskala: 1-10 (1=sehr schwach, 10=exzellent)

Analysiere diese Aspekte der Antworten des/der ${userRoleLabel}:
- Struktur & Klarheit der Antworten
- Inhalt & Beispiele, die genannt werden
- Motivation & Begeisterung
- Professionalität & Selbstbewusstsein

Sei konstruktiv, ehrlich und motivierend. Fokussiere auf umsetzbare Verbesserungen.

Transkript:
${transcript}

JSON Feedback:`;
}

/**
 * Generate feedback prompt for simulation mode (User leads)
 * @param {string} transcript - The conversation transcript
 * @param {string} userRoleLabel - Label for the user role (e.g., 'Kundenberater')
 * @param {string} agentRoleLabel - Label for the AI role (e.g., 'Kunde')
 * @returns {string} - Complete prompt for Gemini
 */
function getSimulationFeedbackPrompt(transcript, userRoleLabel, agentRoleLabel) {
  return `Du bist ein professioneller Coach für Kommunikation und Gesprächsführung. Analysiere das folgende Gespräch-Transkript und gib konstruktives Feedback in "Du"-Form.

KONTEXT: Dies ist eine Simulation, bei der der/die ${userRoleLabel} das Gespräch führt und der/die ${agentRoleLabel} darauf reagiert.

SEHR WICHTIG: Bewerte AUSSCHLIESSLICH den/die ${userRoleLabel.toUpperCase()}!
- Die Aussagen des/der ${agentRoleLabel} dienen als Kontext für die Reaktionen.
- Dein gesamtes Feedback bezieht sich NUR auf die Gesprächsführung, Reaktionen und das Verhalten des/der ${userRoleLabel}.
- Bewerte die Fähigkeit, das Gespräch professionell zu führen und auf den/die ${agentRoleLabel} einzugehen.

WICHTIG: Antworte NUR mit einem JSON-Objekt in folgendem Format (keine zusätzlichen Erklärungen):

{
  "summary": "Eine kurze Zusammenfassung der Gesprächsführung des/der ${userRoleLabel} (2-3 Sätze)",
  "strengths": [
    "Stärke 1: Konkrete positive Beobachtung zur Gesprächsführung",
    "Stärke 2: Was in der Kommunikation gut gemacht wurde",
    "Stärke 3: Weitere Stärken im Umgang mit dem/der ${agentRoleLabel}"
  ],
  "improvements": [
    "Verbesserung 1: Konkreter Verbesserungsbereich in der Gesprächsführung",
    "Verbesserung 2: Wie besser auf den/die ${agentRoleLabel} eingegangen werden könnte",
    "Verbesserung 3: Weitere Verbesserungspotenziale"
  ],
  "tips": [
    "Tipp 1: Konkrete, umsetzbare Empfehlung für ähnliche Situationen",
    "Tipp 2: Praktischer Ratschlag zur Gesprächsführung",
    "Tipp 3: Weitere hilfreiche Tipps"
  ],
  "rating": {
    "overall": 7,
    "communication": 6,
    "motivation": 7,
    "professionalism": 8
  }
}

Bewertungsskala: 1-10 (1=sehr schwach, 10=exzellent)

Analysiere diese Aspekte der Gesprächsführung des/der ${userRoleLabel}:
- Gesprächsführung & Struktur (Wie gut wurde das Gespräch geleitet?)
- Kundenorientierung & Empathie (Wie gut wurde auf den/die ${agentRoleLabel} eingegangen?)
- Problemlösungskompetenz (Wie effektiv wurden Anliegen bearbeitet?)
- Professionalität & Souveränität (Wie professionell war das Auftreten?)

Sei konstruktiv, ehrlich und motivierend. Fokussiere auf umsetzbare Verbesserungen für die Gesprächsführung.

Transkript:
${transcript}

JSON Feedback:`;
}

/**
 * Apply custom prompt with transcript substitution
 * @param {string} customPrompt - Custom prompt template with ${transcript} placeholder
 * @param {string} transcript - The conversation transcript
 * @returns {string} - Complete prompt with transcript inserted
 */
export function applyCustomPrompt(customPrompt, transcript) {
  // If the custom prompt contains ${transcript} placeholder, replace it
  if (customPrompt.includes('${transcript}')) {
    return customPrompt.replace('${transcript}', transcript);
  }

  // Otherwise, append the transcript to the prompt
  // This ensures the transcript is always included even if the placeholder is missing
  return `${customPrompt}

=== TRANSKRIPT ===
${transcript}
=== ENDE TRANSKRIPT ===

Analysiere das obige Transkript und gib dein Feedback als JSON zurück.`;
}

export default {
  getFeedbackPrompt,
  applyCustomPrompt,
};
