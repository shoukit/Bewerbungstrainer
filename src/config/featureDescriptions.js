/**
 * Feature Descriptions for Info Popups
 * Used in FeatureInfoModal component
 */

import { COLORS, createGradient } from '@/config/colors';

export const FEATURE_DESCRIPTIONS = {
  smartbriefing: {
    id: 'smartbriefing',
    title: 'Smart Briefings',
    subtitle: 'Intelligente Wissenspakete',
    icon: '📋',
    color: COLORS.purple[500],
    gradient: createGradient(COLORS.purple[500], COLORS.purple[400]),
    description: 'Smart Briefings generiert mithilfe von KI personalisierte Wissenspakete für bevorstehende berufliche Gespräche. Basierend auf Ihren Eingaben erstellt das System ein strukturiertes Briefing mit relevanten Informationen, Formulierungshilfen und strategischen Tipps.',
    benefits: [
      { icon: '⏱️', text: 'Zeitersparnis: In Sekunden statt Stunden vorbereitet' },
      { icon: '📊', text: 'Strukturierte Vorbereitung in logischen Abschnitten' },
      { icon: '✏️', text: 'Interaktives Workbook mit persönlichen Notizen' },
      { icon: '💾', text: 'Jederzeit abrufbar für die Wiederholung' },
    ],
    learningGoals: [
      'Fundiertes Wissen über Zielunternehmen aufbauen',
      'Typische Fragen und Antwortstrategien kennenlernen',
      'Selbstvertrauen durch gründliche Vorbereitung gewinnen',
      'Eigene Stärken strukturiert aufbereiten',
    ],
    duration: '~10 Sekunden Generierung',
    idealFor: 'Vor jedem wichtigen Gespräch',
  },

  simulator: {
    id: 'simulator',
    title: 'Szenario-Training',
    subtitle: 'Strukturiertes Lernen mit Sofort-Feedback',
    icon: '🎯',
    color: COLORS.green[500],
    gradient: createGradient(COLORS.green[500], COLORS.teal[400]),
    description: 'Das Szenario-Training ist ein geführtes Frage-Antwort-Format, bei dem Sie vordefinierte Interview-Fragen beantworten und nach jeder einzelnen Antwort sofortiges, detailliertes Feedback erhalten. Dies ermöglicht gezieltes Lernen in Ihrem eigenen Tempo.',
    benefits: [
      { icon: '⚡', text: 'Sofortiges Feedback direkt nach jeder Antwort' },
      { icon: '🔄', text: 'Wiederholungsmöglichkeit bis die Antwort sitzt' },
      { icon: '💡', text: 'Konkrete Verbesserungsvorschläge' },
      { icon: '📈', text: 'Fortschrittsverfolgung über alle Fragen' },
    ],
    learningGoals: [
      'Klassische Interview-Fragen souverän beantworten',
      'Die STAR-Methode verinnerlichen',
      'Eigene Erfahrungen überzeugend präsentieren',
      'Schwächen identifizieren und gezielt verbessern',
    ],
    duration: '~15-30 Minuten',
    idealFor: 'Anfänger und systematische Lerner',
  },

  roleplay: {
    id: 'roleplay',
    title: 'Live-Simulation',
    subtitle: 'Realistische Echtzeit-Gespräche',
    icon: '🎙️',
    color: COLORS.amber[500],
    gradient: createGradient(COLORS.amber[500], COLORS.amber[400]),
    description: 'Die Live-Simulation ermöglicht echte, bidirektionale Sprachgespräche mit einem KI-gesteuerten Interviewer. Sie sprechen über Ihr Mikrofon und erhalten in Echtzeit gesprochene Antworten und Nachfragen – genau wie in einem echten Vorstellungsgespräch.',
    benefits: [
      { icon: '🎭', text: 'Realistische Drucksituation mit spontanen Reaktionen' },
      { icon: '🎚️', text: 'Verschiedene Interviewer-Stile wählbar' },
      { icon: '📝', text: 'Echtzeit-Transkript für spätere Analyse' },
      { icon: '🔊', text: 'Paraverbale Analyse von Tempo und Tonalität' },
    ],
    learningGoals: [
      'Spontanes Reagieren auf unerwartete Fragen',
      'Unter Zeitdruck strukturiert antworten',
      'Nervosität in Gesprächssituationen reduzieren',
      'Eigene Sprechgewohnheiten erkennen',
    ],
    duration: '~10-15 Minuten',
    idealFor: 'Fortgeschrittene, die unter Druck üben wollen',
  },

  videotraining: {
    id: 'videotraining',
    title: 'Wirkungs-Analyse',
    subtitle: 'Video-Training mit Körpersprache-Feedback',
    icon: '🎬',
    color: COLORS.red[400],
    gradient: createGradient(COLORS.red[400], COLORS.red[300]),
    description: 'Die Wirkungs-Analyse ist ein videobasiertes Training, bei dem Sie Ihre Antworten per Webcam aufnehmen. Die KI analysiert nicht nur das Gesprochene, sondern auch Körpersprache, Mimik und Auftreten – und gibt konkretes Feedback zur Gesamtwirkung.',
    benefits: [
      { icon: '📹', text: 'Sichtbare Selbstwahrnehmung durch Video' },
      { icon: '🧘', text: 'Ganzheitliche Analyse von Körpersprache' },
      { icon: '👁️', text: 'Feedback zu Augenkontakt und Mimik' },
      { icon: '💪', text: 'Verbesserung der Gesamtpräsenz' },
    ],
    learningGoals: [
      'Eigene Körpersprache bewusst wahrnehmen',
      'Nervöse Ticks identifizieren und reduzieren',
      'Selbstbewusstes Auftreten entwickeln',
      'Präsenz vor der Kamera verbessern',
    ],
    duration: '~15-30 Minuten',
    idealFor: 'Wer an seiner Präsenz arbeiten will',
  },

  rhetorikgym: {
    id: 'rhetorikgym',
    title: 'Rhetorik-Gym',
    subtitle: 'Spielerisches Sprechtraining',
    icon: '🏋️',
    color: COLORS.blue[500],
    gradient: createGradient(COLORS.blue[500], COLORS.teal[500]),
    description: 'Das Rhetorik-Gym ist ein gamifiziertes Kurzformat (60-90 Sekunden), das gezielt Füllwörter reduziert und die Sprechflüssigkeit verbessert. Mit Punktesystem, Highscores und schnellem Feedback macht es Spaß, die eigene Redegewandtheit zu trainieren.',
    benefits: [
      { icon: '⚡', text: 'Kurze, intensive Übungen für zwischendurch' },
      { icon: '🎮', text: 'Motivierendes Punktesystem mit Highscores' },
      { icon: '🔢', text: 'Füllwort-Zähler macht Unbewusstes sichtbar' },
      { icon: '⏱️', text: 'Tempo-Feedback für optimales Sprechen' },
    ],
    learningGoals: [
      'Füllwörter drastisch reduzieren',
      'Flüssiger und selbstsicherer sprechen',
      'Optimales Sprechtempo finden',
      'Spontan zu beliebigen Themen sprechen',
    ],
    duration: '60-90 Sekunden',
    idealFor: 'Alle, regelmäßig zwischendurch',
  },

  ikigai: {
    id: 'ikigai',
    title: 'Ikigai-Kompass',
    subtitle: 'Finde deine berufliche Bestimmung',
    icon: '🧭',
    color: COLORS.purple[500],
    gradient: createGradient(COLORS.purple[500], COLORS.purple[400]),
    description: 'Der Ikigai-Kompass hilft Ihnen, den Schnittpunkt Ihrer Talente, Leidenschaften und beruflichen Möglichkeiten zu finden. Durch geführte Reflexionsfragen entdecken Sie, was Sie wirklich antreibt und wo Ihre Stärken liegen.',
    benefits: [
      { icon: '💡', text: 'Klarheit über eigene Stärken und Werte' },
      { icon: '🎯', text: 'Fokus auf das, was wirklich wichtig ist' },
      { icon: '🗺️', text: 'Orientierung für Karriereentscheidungen' },
      { icon: '✨', text: 'Motivation durch Sinnfindung' },
    ],
    learningGoals: [
      'Eigene Stärken und Talente identifizieren',
      'Berufliche Leidenschaften erkennen',
      'Werte und Prioritäten klären',
      'Karriereziele definieren',
    ],
    duration: '~15-20 Minuten',
    idealFor: 'Alle vor wichtigen Karriereentscheidungen',
  },

  decisionboard: {
    id: 'decisionboard',
    title: 'Entscheidungs-Board',
    subtitle: 'Strukturierte Entscheidungsfindung',
    icon: '⚖️',
    color: COLORS.teal[500],
    gradient: createGradient(COLORS.teal[500], COLORS.teal[400]),
    description: 'Das Entscheidungs-Board unterstützt Sie bei komplexen Karriereentscheidungen. Durch strukturierte Bewertung von Pro- und Contra-Argumenten sowie gewichteten Kriterien gelangen Sie zu fundierten Entscheidungen.',
    benefits: [
      { icon: '📊', text: 'Strukturierte Analyse aller Optionen' },
      { icon: '⚖️', text: 'Gewichtete Bewertungskriterien' },
      { icon: '🧠', text: 'Reduzierung von emotionalen Fehlentscheidungen' },
      { icon: '📋', text: 'Dokumentation für spätere Reflexion' },
    ],
    learningGoals: [
      'Entscheidungen systematisch analysieren',
      'Prioritäten setzen und gewichten',
      'Emotionen und Fakten trennen',
      'Selbstbewusst Entscheidungen treffen',
    ],
    duration: '~10-15 Minuten',
    idealFor: 'Bei wichtigen Karriereentscheidungen',
  },
};

/**
 * localStorage key for "don't show again" preferences
 */
export const FEATURE_INFO_STORAGE_KEY = 'karriereheld_feature_info_dismissed';

/**
 * Get dismissed state for a feature
 */
export const isFeatureInfoDismissed = (featureId) => {
  try {
    const dismissed = JSON.parse(localStorage.getItem(FEATURE_INFO_STORAGE_KEY) || '{}');
    return dismissed[featureId] === true;
  } catch {
    return false;
  }
};

/**
 * Set dismissed state for a feature
 */
export const setFeatureInfoDismissed = (featureId, dismissed = true) => {
  try {
    const current = JSON.parse(localStorage.getItem(FEATURE_INFO_STORAGE_KEY) || '{}');
    current[featureId] = dismissed;
    localStorage.setItem(FEATURE_INFO_STORAGE_KEY, JSON.stringify(current));
  } catch (e) {
    console.error('Failed to save feature info preference:', e);
  }
};

/**
 * Reset all dismissed states
 */
export const resetAllFeatureInfoDismissed = () => {
  try {
    localStorage.removeItem(FEATURE_INFO_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to reset feature info preferences:', e);
  }
};
