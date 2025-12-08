/**
 * Game Prompts Configuration
 *
 * Optimized prompts for Rhetorik-Gym games.
 * Designed for FAST processing and focused on filler word detection.
 */

/**
 * Random topics for "Zufalls-Thema" game mode
 */
export const RANDOM_TOPICS = [
  // Professional Topics
  'Warum bin ich die beste Wahl für diese Position?',
  'Meine größte berufliche Errungenschaft',
  'Was motiviert mich jeden Tag aufzustehen?',
  'Wie ich mit schwierigen Kollegen umgehe',
  'Mein Führungsstil in 60 Sekunden',
  'Die wichtigste Lektion meiner Karriere',
  'Wie ich unter Druck arbeite',
  'Warum Teamarbeit mir wichtig ist',

  // Creative Topics
  'Wenn ich ein Tier wäre, welches und warum?',
  'Mein perfekter Tag sieht so aus...',
  'Die beste Erfindung der Menschheit',
  'Wenn ich die Welt verändern könnte...',
  'Ein Buch, das mein Leben verändert hat',
  'Mein Lieblingshobby und warum',

  // Challenging Topics
  'Drei Dinge, die ich niemals machen würde',
  'Warum Scheitern wichtig ist',
  'Meine kontroverseste Meinung',
  'Wie ich mit Kritik umgehe',
];

/**
 * Stress questions for "Stress-Test" game mode
 */
export const STRESS_QUESTIONS = [
  'Warum sollten wir ausgerechnet Sie einstellen und nicht einen der 50 anderen Bewerber?',
  'Ihr Lebenslauf zeigt eine Lücke. Was haben Sie in dieser Zeit wirklich gemacht?',
  'Nennen Sie mir drei echte Schwächen - und bitte keine getarnten Stärken.',
  'Warum haben Sie Ihren letzten Job wirklich verlassen?',
  'Wo sehen Sie sich in 5 Jahren? Und seien Sie ehrlich.',
  'Was würde Ihr schlimmster Feind über Sie sagen?',
  'Wenn ich Ihren letzten Chef anrufe - was wird er mir sagen?',
  'Sie sind offensichtlich überqualifiziert. Werden Sie nicht schnell gelangweilt sein?',
  'Warum haben Sie in Ihrer Karriere nicht mehr erreicht?',
  'Überzeugen Sie mich in 30 Sekunden, dass Sie kein Risiko sind.',
  'Was war Ihr größter beruflicher Misserfolg?',
  'Haben Sie andere Angebote? Warum sind wir nicht Ihre erste Wahl?',
];

/**
 * Get the rhetoric game analysis prompt
 * Optimized for speed - focuses ONLY on filler words and pace
 *
 * @param {string} topic - The topic the user spoke about
 * @param {number} durationSeconds - Expected duration in seconds
 * @returns {string} - The analysis prompt
 */
export function getRhetoricGamePrompt(topic = 'Elevator Pitch', durationSeconds = 60) {
  return `AUDIO-ANALYSE - Rhetorik-Spiel "Füllwort-Killer"

KONTEXT:
- Thema: "${topic}"
- Ziel-Dauer: ${durationSeconds} Sekunden
- Dies ist ein SPIEL - schnelles, klares Feedback ist wichtig!

KRITISCHE REGELN:
1. Analysiere NUR das, was in der Audio-Datei TATSÄCHLICH gesprochen wird
2. Wenn die Audio-Datei STILL ist oder nur Rauschen enthält:
   - score: 0
   - filler_count: 0
   - filler_words: []
   - words_per_minute: 0
   - transcript: "[Keine Sprache erkannt]"
   - pace_feedback: "keine_sprache"
3. ERFINDE NIEMALS Inhalte oder Transkripte!
4. Transkribiere WÖRTLICH was gesagt wird - nichts hinzufügen

DEINE AUFGABE (nur bei erkannter Sprache):
1. Transkribiere EXAKT was gesprochen wird
2. Zähle ALLE Füllwörter: "Ähm", "Äh", "Öh", "Mh", "Halt", "Eigentlich", "Sozusagen", "Quasi", "Irgendwie", "Also" (am Satzanfang), "Genau", "Ja also"
3. Schätze das Sprechtempo (Wörter pro Minute)

WICHTIG:
- KEINE inhaltliche Bewertung
- KEINE Verbesserungsvorschläge
- NUR Füllwörter zählen und Tempo messen
- Bei Stille oder unverständlicher Audio: score = 0

SCORING (nur bei erkannter Sprache):
- Basis: 100 Punkte
- Pro Füllwort: -10 Punkte
- Zu schnell (>160 WPM): -10 Punkte
- Zu langsam (<100 WPM): -10 Punkte
- Minimum: 0 Punkte

OUTPUT FORMAT:
Antworte NUR mit validem JSON. Keine Einleitung, kein Markdown.

{
  "score": (0-100),
  "filler_count": (Anzahl),
  "filler_words": [
    {"word": "Ähm", "count": 2},
    {"word": "Also", "count": 1}
  ],
  "words_per_minute": (geschätzte WPM, 0 bei Stille),
  "transcript": "EXAKTE Transkription oder '[Keine Sprache erkannt]'",
  "duration_estimate_seconds": (geschätzte Dauer),
  "pace_feedback": "optimal" | "zu_schnell" | "zu_langsam" | "keine_sprache"
}

ANALYSE DER AUDIO-DATEI:`;
}

/**
 * Quick feedback messages based on score
 */
export const SCORE_FEEDBACK = {
  excellent: {
    range: [90, 100],
    messages: [
      'Perfekt! Du bist ein Rhetorik-Champion!',
      'Wow! Makellose Präsentation!',
      'Ausgezeichnet! So sieht ein Profi aus!',
    ],
    emoji: '🏆',
  },
  good: {
    range: [70, 89],
    messages: [
      'Sehr gut! Nur kleine Verbesserungen nötig.',
      'Stark! Fast perfekt!',
      'Beeindruckend! Weiter so!',
    ],
    emoji: '🌟',
  },
  medium: {
    range: [50, 69],
    messages: [
      'Solide Leistung! Übung macht den Meister.',
      'Guter Ansatz! Da geht noch mehr.',
      'Auf dem richtigen Weg!',
    ],
    emoji: '💪',
  },
  needsWork: {
    range: [30, 49],
    messages: [
      'Nicht schlecht, aber hier ist Potenzial!',
      'Die Füllwörter haben dich erwischt!',
      'Bleib dran - Verbesserung ist möglich!',
    ],
    emoji: '🎯',
  },
  poor: {
    range: [0, 29],
    messages: [
      'Ähm... da müssen wir üben!',
      'Die Füllwörter haben gewonnen. Revanche?',
      'Kopf hoch! Jeder Profi hat so angefangen.',
    ],
    emoji: '🔄',
  },
};

/**
 * Get feedback message based on score
 *
 * @param {number} score - Score from 0-100
 * @returns {object} - Feedback object with message and emoji
 */
export function getScoreFeedback(score) {
  for (const [, config] of Object.entries(SCORE_FEEDBACK)) {
    if (score >= config.range[0] && score <= config.range[1]) {
      const randomIndex = Math.floor(Math.random() * config.messages.length);
      return {
        message: config.messages[randomIndex],
        emoji: config.emoji,
      };
    }
  }
  return {
    message: 'Weiter üben!',
    emoji: '💪',
  };
}

/**
 * Get a random topic
 */
export function getRandomTopic() {
  return RANDOM_TOPICS[Math.floor(Math.random() * RANDOM_TOPICS.length)];
}

/**
 * Get a random stress question
 */
export function getRandomStressQuestion() {
  return STRESS_QUESTIONS[Math.floor(Math.random() * STRESS_QUESTIONS.length)];
}

/**
 * Game mode configurations
 */
export const GAME_MODES = {
  klassiker: {
    id: 'klassiker',
    title: 'Der Klassiker',
    subtitle: 'Elevator Pitch',
    description: '60 Sekunden, um zu überzeugen. Präsentiere dich selbst ohne Füllwörter!',
    duration: 60,
    icon: 'rocket',
    color: 'blue',
    topic: 'Stelle dich selbst vor - wer bist du, was machst du, was ist dein Ziel?',
  },
  zufall: {
    id: 'zufall',
    title: 'Zufalls-Thema',
    subtitle: 'Slot Machine',
    description: 'Ein zufälliges Thema, spontan und fließend präsentiert.',
    duration: 60,
    icon: 'shuffle',
    color: 'purple',
    getTopic: getRandomTopic,
  },
  stress: {
    id: 'stress',
    title: 'Stress-Test',
    subtitle: 'Überraschungsfrage',
    description: 'Eine knallharte Interview-Frage. Behalte die Nerven!',
    duration: 90,
    icon: 'zap',
    color: 'red',
    getTopic: getRandomStressQuestion,
  },
};

export default {
  RANDOM_TOPICS,
  STRESS_QUESTIONS,
  getRhetoricGamePrompt,
  SCORE_FEEDBACK,
  getScoreFeedback,
  getRandomTopic,
  getRandomStressQuestion,
  GAME_MODES,
};
