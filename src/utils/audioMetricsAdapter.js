/**
 * Audio Metrics Adapter
 *
 * Converts different audio analysis formats to the unified AudioAnalysisPanel format.
 *
 * Supports:
 * - Simulator format (PHP backend)
 * - Video Training format (PHP backend)
 * - Professional format (audioAnalysisPrompt.js / Live-Simulation)
 */

/**
 * Detect the format of audio metrics
 *
 * @param {object} metrics - The audio metrics object
 * @returns {'professional'|'simulator'|'video'|'unknown'} - The detected format
 */
export function detectAudioMetricsFormat(metrics) {
  if (!metrics) return 'unknown';

  // Professional format has speech_cleanliness with filler_word_analysis array
  if (metrics.speech_cleanliness?.filler_word_analysis) {
    return 'professional';
  }

  // Professional format nested in audio_metrics
  if (metrics.audio_metrics?.speech_cleanliness?.filler_word_analysis) {
    return 'professional';
  }

  // Simulator format has filler_words with words array (not filler_word_analysis)
  if (metrics.filler_words?.words !== undefined) {
    return 'simulator';
  }

  // Video training format has speech_metrics
  if (metrics.speech_metrics || metrics.filler_words?.severity !== undefined) {
    return 'video';
  }

  // If has confidence_score but no other markers, likely simulator
  if (metrics.confidence_score !== undefined && metrics.speech_rate !== undefined) {
    return 'simulator';
  }

  return 'unknown';
}

/**
 * Convert Simulator format to AudioAnalysisPanel format
 *
 * Simulator format:
 * {
 *   speech_rate: "optimal|zu_schnell|zu_langsam",
 *   filler_words: { count: N, words: ["ähm"], severity: "niedrig" },
 *   confidence_score: 0-100,
 *   clarity_score: 0-100,
 *   notes: "..."
 * }
 *
 * AudioAnalysisPanel format:
 * {
 *   confidence_score: 75,
 *   summary_text: "...",
 *   speech_cleanliness: {
 *     score: 80,
 *     total_filler_count: 3,
 *     filler_word_analysis: [{ word: "Ähm", count: 2, examples: [...] }],
 *     feedback: "..."
 *   },
 *   pacing: { rating: "optimal", estimated_wpm: 135, feedback: "..." },
 *   tonality: { rating: "natürlich", feedback: "..." }
 * }
 */
function convertSimulatorFormat(metrics) {
  const fillerCount = metrics.filler_words?.count || 0;
  const fillerWords = metrics.filler_words?.words || [];

  // Convert filler words array to analysis format (without timestamps)
  const fillerWordAnalysis = fillerWords.map((word) => ({
    word: word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
    count: 1, // We only have the word list, not individual counts
    examples: [], // No timestamps in simulator format
  }));

  // Calculate speech cleanliness score from filler count
  let cleanlinessScore = 100;
  if (fillerCount > 0) {
    if (fillerCount <= 2) cleanlinessScore = 90;
    else if (fillerCount <= 5) cleanlinessScore = 70;
    else if (fillerCount <= 10) cleanlinessScore = 50;
    else cleanlinessScore = 30;
  }

  // Map speech_rate to pacing rating
  const pacingRating = metrics.speech_rate === 'optimal' ? 'optimal'
    : metrics.speech_rate === 'zu_schnell' ? 'zu_schnell'
    : metrics.speech_rate === 'zu_langsam' ? 'zu_langsam'
    : 'optimal';

  return {
    confidence_score: metrics.confidence_score,
    summary_text: metrics.notes || null,

    speech_cleanliness: {
      score: cleanlinessScore,
      total_filler_count: fillerCount,
      filler_word_analysis: fillerWordAnalysis,
      feedback: getSeverityFeedback(metrics.filler_words?.severity),
    },

    pacing: {
      rating: pacingRating,
      estimated_wpm: null, // Not available in simulator format
      issues_detected: [],
      feedback: getPacingFeedback(pacingRating),
    },

    tonality: {
      rating: 'natürlich', // Not analyzed in simulator format
      emotional_tone: 'neutral',
      highlights: [],
      feedback: null,
    },
  };
}

/**
 * Convert Video Training format to AudioAnalysisPanel format
 *
 * Video format (embedded in analysis_json):
 * {
 *   filler_words: { count: 5, words: ["ähm"], severity: "niedrig" },
 *   speech_metrics: { pace: "optimal", clarity: 80, energy: 75 }
 * }
 */
function convertVideoFormat(metrics) {
  const fillerCount = metrics.filler_words?.count || 0;
  const fillerWords = metrics.filler_words?.words || [];

  // Convert filler words array to analysis format
  const fillerWordAnalysis = fillerWords.map((word) => ({
    word: word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
    count: 1,
    examples: [],
  }));

  // Calculate cleanliness score
  let cleanlinessScore = 100;
  if (fillerCount > 0) {
    if (fillerCount <= 2) cleanlinessScore = 90;
    else if (fillerCount <= 5) cleanlinessScore = 70;
    else if (fillerCount <= 10) cleanlinessScore = 50;
    else cleanlinessScore = 30;
  }

  // Map pace to rating
  const pace = metrics.speech_metrics?.pace || 'optimal';
  const pacingRating = pace === 'zu schnell' ? 'zu_schnell'
    : pace === 'zu langsam' ? 'zu_langsam'
    : 'optimal';

  // Use clarity as confidence approximation
  const confidenceScore = metrics.speech_metrics?.clarity || metrics.speech_metrics?.energy || 70;

  return {
    confidence_score: confidenceScore,
    summary_text: null,

    speech_cleanliness: {
      score: cleanlinessScore,
      total_filler_count: fillerCount,
      filler_word_analysis: fillerWordAnalysis,
      feedback: getSeverityFeedback(metrics.filler_words?.severity),
    },

    pacing: {
      rating: pacingRating,
      estimated_wpm: null,
      issues_detected: [],
      feedback: getPacingFeedback(pacingRating),
    },

    tonality: {
      rating: 'natürlich',
      emotional_tone: 'neutral',
      highlights: [],
      feedback: null,
    },
  };
}

/**
 * Get feedback text for filler word severity
 */
function getSeverityFeedback(severity) {
  switch (severity) {
    case 'hoch':
      return 'Versuche, bewusster zu sprechen und Pausen statt Füllwörter zu nutzen.';
    case 'mittel':
      return 'Gute Basis! Mit etwas Übung kannst du die Füllwörter weiter reduzieren.';
    case 'niedrig':
      return 'Sehr gut! Du sprichst bereits sehr klar und flüssig.';
    case 'keine':
      return 'Perfekt! Keine Füllwörter erkannt.';
    default:
      return null;
  }
}

/**
 * Get feedback text for pacing rating
 */
function getPacingFeedback(rating) {
  switch (rating) {
    case 'zu_schnell':
      return 'Versuche, etwas langsamer zu sprechen und bewusste Pausen einzubauen.';
    case 'zu_langsam':
      return 'Du könntest etwas zügiger sprechen, um mehr Energie zu vermitteln.';
    case 'optimal':
      return 'Dein Sprechtempo ist optimal für gute Verständlichkeit.';
    default:
      return null;
  }
}

/**
 * Normalize audio metrics to AudioAnalysisPanel format
 *
 * This is the main function to use - it auto-detects the format and converts.
 *
 * @param {object} metrics - Audio metrics in any supported format
 * @returns {object|null} - Normalized metrics for AudioAnalysisPanel, or null if no data
 */
export function normalizeAudioMetrics(metrics) {
  if (!metrics) return null;

  const format = detectAudioMetricsFormat(metrics);

  switch (format) {
    case 'professional':
      // Already in the right format, but might be nested
      return metrics.audio_metrics || metrics;

    case 'simulator':
      return convertSimulatorFormat(metrics);

    case 'video':
      return convertVideoFormat(metrics);

    default:
      // Return as-is and let AudioAnalysisPanel handle it
      return metrics;
  }
}

/**
 * Check if audio metrics have meaningful data worth displaying
 *
 * @param {object} metrics - Audio metrics in any format
 * @returns {boolean} - True if there's data to display
 */
export function hasAudioMetricsData(metrics) {
  if (!metrics) return false;

  const normalized = normalizeAudioMetrics(metrics);
  if (!normalized) return false;

  // Check if we have at least confidence or speech cleanliness data
  return (
    normalized.confidence_score !== undefined ||
    normalized.speech_cleanliness?.total_filler_count !== undefined ||
    normalized.pacing?.rating !== undefined
  );
}

export default {
  detectAudioMetricsFormat,
  normalizeAudioMetrics,
  hasAudioMetricsData,
};
