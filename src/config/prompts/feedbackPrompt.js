/**
 * Interview Feedback Prompt
 *
 * Used by generateInterviewFeedback() in gemini.js
 * Analyzes interview transcripts and provides coaching feedback.
 *
 * Supports coach types for different scenarios:
 * - general: General communication coach
 * - interview: Career/job interview coach
 * - sales: Sales/B2B coach
 * - leadership: Leadership/management coach
 * - conflict: Conflict resolution/mediation coach
 * - customer: Customer service coach
 */

/**
 * Standard rating dimensions used across all modules for consistency
 * These match the Simulator/Szenario-Training dimensions
 */
const STANDARD_RATING_DIMENSIONS = {
  overall: 'Gesamteindruck',
  content: 'Inhalt & Argumentation',
  structure: 'Struktur & Aufbau',
  relevance: 'Relevanz & Bezug',
  delivery: 'Präsentation & Auftreten',
};

/**
 * Coach type configurations with role, rating dimensions, and analysis focus
 * All coach types use the same standard rating dimensions for consistency
 */
const COACH_TYPES = {
  general: {
    role: 'Kommunikations-Coach',
    intro: 'Du bist ein erfahrener Kommunikations-Coach. Analysiere das folgende Gespräch und gib konstruktives, praxisnahes Feedback auf Deutsch.',
    ratingDimensions: STANDARD_RATING_DIMENSIONS,
    analysisFocus: [
      'Klarheit und Struktur der Kommunikation',
      'Aktives Zuhören und Eingehen auf den Gesprächspartner',
      'Überzeugungskraft und Argumentation',
      'Professionalität und Auftreten',
    ],
  },
  interview: {
    role: 'Karriere-Coach',
    intro: 'Du bist ein erfahrener Karriere-Coach und Interview-Trainer. Analysiere das folgende Vorstellungsgespräch und gib konstruktives, praxisnahes Feedback auf Deutsch.',
    ratingDimensions: STANDARD_RATING_DIMENSIONS,
    analysisFocus: [
      'Struktur und Klarheit der Antworten (STAR-Methode)',
      'Relevante Beispiele und messbare Erfolge',
      'Authentische Motivation und Interesse',
      'Selbstbewusstsein und professionelles Auftreten',
    ],
  },
  sales: {
    role: 'Vertriebs-Coach',
    intro: 'Du bist ein erfahrener Sales-Coach und Vertriebstrainer. Analysiere das folgende Verkaufsgespräch und gib konstruktives, praxisnahes Feedback auf Deutsch.',
    ratingDimensions: STANDARD_RATING_DIMENSIONS,
    analysisFocus: [
      'Qualität der Bedarfsanalyse und Fragetechnik',
      'Nutzenargumentation und Mehrwert-Kommunikation',
      'Umgang mit Einwänden und Preisdiskussionen',
      'Verbindlichkeit und Abschlussorientierung',
    ],
  },
  leadership: {
    role: 'Führungskräfte-Coach',
    intro: 'Du bist ein erfahrener Leadership-Coach und Führungskräftetrainer. Analysiere das folgende Führungsgespräch und gib konstruktives, praxisnahes Feedback auf Deutsch.',
    ratingDimensions: STANDARD_RATING_DIMENSIONS,
    analysisFocus: [
      'Klarheit in der Kommunikation von Zielen und Erwartungen',
      'Wertschätzung und Anerkennung des Mitarbeiters',
      'Balance zwischen Führung und Autonomie',
      'Konstruktives Feedback und Entwicklungsorientierung',
    ],
  },
  conflict: {
    role: 'Konflikt- und Mediations-Coach',
    intro: 'Du bist ein erfahrener Konflikt-Coach und Mediator. Analysiere das folgende Konfliktgespräch und gib konstruktives, praxisnahes Feedback auf Deutsch.',
    ratingDimensions: STANDARD_RATING_DIMENSIONS,
    analysisFocus: [
      'Deeskalationstechniken und Ruhe bewahren',
      'Aktives Zuhören und Verständnis zeigen',
      'Neutralität und Allparteilichkeit',
      'Konstruktive Lösungsfindung',
    ],
  },
  customer: {
    role: 'Kundenservice-Coach',
    intro: 'Du bist ein erfahrener Service-Coach und Kundenservice-Trainer. Analysiere das folgende Kundengespräch und gib konstruktives, praxisnahes Feedback auf Deutsch.',
    ratingDimensions: STANDARD_RATING_DIMENSIONS,
    analysisFocus: [
      'Schnelle und effektive Problemlösung',
      'Freundlichkeit und Serviceorientierung',
      'Klare Kommunikation und Verständlichkeit',
      'Proaktives Handeln und Kundenerwartungen übertreffen',
    ],
  },
};

/**
 * Base prompt template that gets filled with coach-specific content
 */
function buildBasePrompt(coachConfig, customIntro, extraFocus, userRoleLabel) {
  const intro = customIntro || coachConfig.intro;
  const dimensions = coachConfig.ratingDimensions;
  const focus = coachConfig.analysisFocus;

  // Build rating schema object for JSON
  const ratingSchema = {};
  Object.keys(dimensions).forEach((key) => {
    ratingSchema[key] = 0;
  });

  // Build rating description
  const ratingDescription = Object.entries(dimensions)
    .map(([key, label]) => `    "${key}": "1-10 für ${label}"`)
    .join(',\n');

  let prompt = `${intro}

## BEWERTUNGS-DIMENSIONEN
${Object.entries(dimensions).map(([key, label]) => `- **${label}** (${key})`).join('\n')}

## ANALYSE-FOKUS
${focus.map((f) => `- ${f}`).join('\n')}
`;

  if (extraFocus) {
    prompt += `
## ZUSÄTZLICHER FOKUS
${extraFocus}
`;
  }

  prompt += `
## BEWERTUNGSSKALA (1-10)
- 1-3: Deutliche Defizite, grundlegende Verbesserungen nötig
- 4-5: Basis vorhanden, aber wichtige Aspekte fehlen
- 6-7: Solide Leistung mit Verbesserungspotenzial
- 8-9: Sehr gut, nur Feinschliff nötig
- 10: Exzellent, kaum Verbesserungspotenzial

## AUSGABEFORMAT
Antworte NUR mit diesem JSON-Objekt:
{
  "summary": "2-3 Sätze Gesamteindruck - was war der rote Faden?",
  "strengths": [
    "Stärke 1: Konkrete positive Beobachtung mit Beispiel aus dem Gespräch",
    "Stärke 2: Was gut gemacht wurde"
  ],
  "improvements": [
    "Verbesserung 1: Was genau war suboptimal und warum?",
    "Verbesserung 2: Konkreter Verbesserungsbereich"
  ],
  "tips": [
    "Tipp 1: Konkreter, sofort umsetzbarer Ratschlag",
    "Tipp 2: Praktische Empfehlung für das nächste Gespräch"
  ],
  "rating": {
${ratingDescription}
  }
}

## WICHTIG
- Gib 2-4 Items pro Kategorie (strengths, improvements, tips)
- Beziehe dich auf KONKRETE Aussagen aus dem Transkript
- Formuliere Verbesserungen konstruktiv, nicht kritisierend
- Tipps müssen sofort umsetzbar sein
- Bewerte NUR den/die ${userRoleLabel}, NICHT den Gesprächspartner`;

  return prompt;
}

/**
 * Generate the feedback prompt with transcript
 * @param {string} transcript - The conversation transcript
 * @param {object} options - Options for the feedback prompt
 * @param {string} options.coachType - Coach type: 'general', 'interview', 'sales', 'leadership', 'conflict', 'customer'
 * @param {string} options.customIntro - Optional custom intro to override coach default
 * @param {string} options.extraFocus - Optional extra focus areas
 * @param {string} options.feedbackPrompt - Optional complete custom prompt (legacy, overrides everything)
 * @param {string} options.roleType - 'interview' or 'simulation' (legacy)
 * @param {string} options.userRoleLabel - Label for the user role (e.g., 'Bewerber', 'Kundenberater')
 * @param {string} options.agentRoleLabel - Label for the AI role (e.g., 'Interviewer', 'Kunde')
 * @returns {string} - Complete prompt for Gemini
 */
export function getFeedbackPrompt(transcript, options = {}) {
  const {
    coachType = 'general',
    customIntro = '',
    extraFocus = '',
    feedbackPrompt = '',
    roleType = 'interview',
    userRoleLabel = 'Bewerber',
    agentRoleLabel = 'Gesprächspartner',
  } = options;

  // If a complete custom feedback prompt is provided, use it (legacy support)
  if (feedbackPrompt && feedbackPrompt.trim()) {
    return applyCustomPrompt(feedbackPrompt, transcript);
  }

  // Get coach configuration (fallback to general if unknown type)
  const coachConfig = COACH_TYPES[coachType] || COACH_TYPES.general;

  // Build the prompt from coach type configuration
  const basePrompt = buildBasePrompt(coachConfig, customIntro, extraFocus, userRoleLabel);

  return `${basePrompt}

---
TRANSKRIPT:
${transcript}

JSON Feedback:`;
}

/**
 * Standard JSON output format that should be used for all feedback
 */
const STANDARD_JSON_FORMAT = `
WICHTIG: Antworte NUR mit einem JSON-Objekt in diesem Format:
{
  "summary": "Eine kurze Zusammenfassung des Gesamteindrucks (2-3 Sätze)",
  "strengths": [
    "Stärke 1: Konkrete positive Beobachtung",
    "Stärke 2: Was gut gemacht wurde"
  ],
  "improvements": [
    "Verbesserung 1: Konkreter Verbesserungsbereich",
    "Verbesserung 2: Was besser gemacht werden könnte"
  ],
  "tips": [
    "Tipp 1: Konkrete, umsetzbare Empfehlung",
    "Tipp 2: Praktischer Ratschlag"
  ],
  "rating": {
    "overall": "1-10 Gesamtbewertung der Leistung"
  }
}`;

/**
 * Apply custom prompt with transcript substitution (legacy support)
 * @param {string} customPrompt - Custom prompt template with ${transcript} placeholder
 * @param {string} transcript - The conversation transcript
 * @returns {string} - Complete prompt with transcript inserted
 */
export function applyCustomPrompt(customPrompt, transcript) {
  // If the custom prompt contains ${transcript} placeholder, replace it
  // and append the standard format if not already specified
  if (customPrompt.includes('${transcript}')) {
    const replaced = customPrompt.replace('${transcript}', transcript);
    // Check if the prompt already specifies JSON format
    if (replaced.toLowerCase().includes('"summary"') || replaced.toLowerCase().includes('"strengths"')) {
      return replaced;
    }
    return `${replaced}\n${STANDARD_JSON_FORMAT}`;
  }

  // Otherwise, append the transcript and standard format to the prompt
  // This ensures the transcript is always included even if the placeholder is missing
  return `${customPrompt}

=== TRANSKRIPT ===
${transcript}
=== ENDE TRANSKRIPT ===

Analysiere das obige Transkript und gib dein Feedback.
${STANDARD_JSON_FORMAT}`;
}

/**
 * Get available coach types for UI
 * @returns {Array} Array of coach type objects with value and label
 */
export function getCoachTypes() {
  return Object.entries(COACH_TYPES).map(([key, config]) => ({
    value: key,
    label: config.role,
    intro: config.intro,
    ratingDimensions: config.ratingDimensions,
  }));
}

/**
 * Get coach configuration by type
 * @param {string} coachType - Coach type key
 * @returns {object} Coach configuration
 */
export function getCoachConfig(coachType) {
  return COACH_TYPES[coachType] || COACH_TYPES.general;
}

export default {
  getFeedbackPrompt,
  applyCustomPrompt,
  getCoachTypes,
  getCoachConfig,
  COACH_TYPES,
  STANDARD_RATING_DIMENSIONS,
};
