/**
 * Game Prompts Configuration
 *
 * Optimized prompts for Rhetorik-Gym games.
 * Designed for FAST processing and focused on filler word detection.
 */

import { getFillerWordsWithContext } from './fillerWords';

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
  return `AUDIO-TRANSKRIPTION UND ANALYSE

THEMA: "${topic}"

ABSOLUTE REGEL - KEINE HALLUZINATION:
Du DARFST NUR transkribieren, was TATSÄCHLICH in der Audio-Datei gesprochen wird.
- Bei Stille, Rauschen, oder unverständlichem Audio: transcript = "[Keine Sprache erkannt]"
- Bei nur 1-2 Sekunden Audio ohne klare Sprache: transcript = "[Keine Sprache erkannt]"
- ERFINDE NIEMALS Wörter, Sätze oder Inhalte!
- Wenn du unsicher bist, ob etwas gesagt wurde: NICHT transkribieren!

DEINE AUFGABE (NUR bei klar erkennbarer Sprache):
1. TRANSKRIBIEREN: Schreibe WÖRTLICH was gesprochen wird - nichts hinzufügen
2. FÜLLWÖRTER: Finde diese Wörter im Transkript: ${getFillerWordsWithContext()}
3. INHALT: Bewerte wie gut die Antwort zum Thema passt (0-40 Punkte)

INHALTSBEWERTUNG (content_score):
- 0: Keine Sprache / am Thema vorbei / unverständlich
- 10: Nur ansatzweise zum Thema
- 20: Teilweise zum Thema, aber oberflächlich
- 30: Gut zum Thema, mit Substanz
- 40: Exzellent, strukturiert und überzeugend

OUTPUT - NUR valides JSON:
{
  "transcript": "[Keine Sprache erkannt]",
  "filler_words": [],
  "content_score": 0,
  "content_feedback": "Keine Sprache erkannt."
}

ODER bei erkannter Sprache:
{
  "transcript": "Das was tatsächlich gesagt wurde...",
  "filler_words": [{"word": "Ähm", "count": 1}],
  "content_score": 30,
  "content_feedback": "Kurzes Feedback (1-2 Sätze)"
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
