/**
 * Coaching Intelligence Service
 *
 * Aggregates user data across all modules and generates
 * comprehensive AI coaching analysis with scenario-aware recommendations.
 */

import wordpressAPI, { getWPNonce, getWPApiUrl } from './wordpress-api';
import { generateInterviewFeedback } from './gemini';
import {
  generateComprehensiveCoachingPrompt,
  generateWelcomeCoachingPrompt,
} from '@/config/prompts/comprehensiveCoachingPrompt';

// =============================================================================
// CACHING
// =============================================================================

const CACHE_KEY = 'ki_coach_analysis_cache';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Generate a simple hash of session counts for cache invalidation
 * When user completes a new session, this hash changes and cache is invalidated
 */
function generateSessionCountHash(sessions) {
  const counts = {
    simulator: sessions?.simulator?.length || 0,
    video: sessions?.video?.length || 0,
    roleplay: sessions?.roleplay?.length || 0,
    games: sessions?.games?.length || 0,
  };
  return `${counts.simulator}-${counts.video}-${counts.roleplay}-${counts.games}`;
}

/**
 * Get cached coaching data if valid
 * @param {string} sessionCountHash - Current session count hash
 * @param {string|null} userFocus - Current user focus
 * @returns {Object|null} - Cached data or null if invalid
 */
function getCachedCoaching(sessionCountHash, userFocus) {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const { data, timestamp, hash, focus } = JSON.parse(cached);

    // Check TTL
    if (Date.now() - timestamp > CACHE_TTL_MS) {
      console.log('[CoachingIntelligence] Cache expired (TTL)');
      return null;
    }

    // Check if session counts changed (user completed new session)
    if (hash !== sessionCountHash) {
      console.log('[CoachingIntelligence] Cache invalidated (session count changed)');
      return null;
    }

    // Check if focus changed
    if (focus !== (userFocus || 'none')) {
      console.log('[CoachingIntelligence] Cache invalidated (focus changed)');
      return null;
    }

    console.log('[CoachingIntelligence] ✓ Using cached analysis');
    return data;
  } catch (error) {
    console.error('[CoachingIntelligence] Cache read error:', error);
    return null;
  }
}

/**
 * Cache coaching data
 */
function setCachedCoaching(data, sessionCountHash, userFocus) {
  try {
    const cacheEntry = {
      data,
      timestamp: Date.now(),
      hash: sessionCountHash,
      focus: userFocus || 'none',
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheEntry));
    console.log('[CoachingIntelligence] ✓ Analysis cached');
  } catch (error) {
    console.error('[CoachingIntelligence] Cache write error:', error);
  }
}

/**
 * Clear the coaching cache (for testing or manual invalidation)
 */
export function clearCoachingCache() {
  try {
    localStorage.removeItem(CACHE_KEY);
    console.log('[CoachingIntelligence] Cache cleared');
  } catch (error) {
    console.error('[CoachingIntelligence] Cache clear error:', error);
  }
}

// =============================================================================
// DATA FETCHING
// =============================================================================

/**
 * Fetch all user sessions across modules
 */
export async function fetchAllUserSessions() {
  const baseUrl = getWPApiUrl();
  const headers = { 'X-WP-Nonce': getWPNonce() };

  try {
    const [simulatorRes, videoRes, roleplayRes, gamesRes] = await Promise.all([
      fetch(`${baseUrl}/simulator/sessions`, { headers, credentials: 'same-origin' }),
      fetch(`${baseUrl}/video-training/sessions`, { headers, credentials: 'same-origin' }),
      fetch(`${baseUrl}/roleplays/sessions`, { headers, credentials: 'same-origin' }),  // Same endpoint as SessionHistory
      fetch(`${baseUrl}/game/sessions`, { headers, credentials: 'same-origin' }),
    ]);

    const [simulatorData, videoData, roleplayData, gamesData] = await Promise.all([
      simulatorRes.ok ? simulatorRes.json() : { data: { sessions: [] } },
      videoRes.ok ? videoRes.json() : { data: { sessions: [] } },
      roleplayRes.ok ? roleplayRes.json() : { data: [] },
      gamesRes.ok ? gamesRes.json() : { data: [] },
    ]);

    // Extract arrays from different API response structures
    // - Simulator: { success, data: { sessions: [...], pagination } }
    // - Video: { success, data: { sessions: [...], pagination } }
    // - Roleplay: { success, data: [...], pagination }
    // - Games: { success, data: [...] }
    const extractArray = (response, nestedKey = null) => {
      if (Array.isArray(response)) return response;
      if (response?.data) {
        if (nestedKey && response.data[nestedKey]) {
          return Array.isArray(response.data[nestedKey]) ? response.data[nestedKey] : [];
        }
        if (Array.isArray(response.data)) return response.data;
        // Fallback for nested sessions
        if (response.data.sessions && Array.isArray(response.data.sessions)) {
          return response.data.sessions;
        }
      }
      return [];
    };

    return {
      simulator: extractArray(simulatorData, 'sessions'),
      video: extractArray(videoData, 'sessions'),
      roleplay: extractArray(roleplayData),
      games: extractArray(gamesData),
    };
  } catch (error) {
    console.error('[CoachingIntelligence] Failed to fetch sessions:', error);
    return { simulator: [], video: [], roleplay: [], games: [] };
  }
}

/**
 * Fetch all available scenarios across modules
 */
export async function fetchAllScenarios() {
  const baseUrl = getWPApiUrl();
  const headers = { 'X-WP-Nonce': getWPNonce() };

  try {
    const [simulatorRes, videoRes, roleplayRes, briefingRes] = await Promise.all([
      fetch(`${baseUrl}/simulator/scenarios`, { headers, credentials: 'same-origin' }),
      fetch(`${baseUrl}/video-training/scenarios`, { headers, credentials: 'same-origin' }),
      fetch(`${baseUrl}/roleplays`, { headers, credentials: 'same-origin' }),
      fetch(`${baseUrl}/smartbriefing/templates`, { headers, credentials: 'same-origin' }),
    ]);

    const [simulatorData, videoData, roleplayData, briefingData] = await Promise.all([
      simulatorRes.ok ? simulatorRes.json() : { data: { scenarios: [] } },
      videoRes.ok ? videoRes.json() : { data: { scenarios: [] } },
      roleplayRes.ok ? roleplayRes.json() : { data: [] },
      briefingRes.ok ? briefingRes.json() : { data: [] },
    ]);

    // Extract arrays from different API response structures
    // - Simulator scenarios: { success, data: { scenarios: [...] } }
    // - Video scenarios: { success, data: { scenarios: [...] } }
    // - Roleplay scenarios: { success, data: [...] }
    // - Briefing templates: { success, data: [...] }
    const extractArray = (response, nestedKey = null) => {
      if (Array.isArray(response)) return response;
      if (response?.data) {
        if (nestedKey && response.data[nestedKey]) {
          return Array.isArray(response.data[nestedKey]) ? response.data[nestedKey] : [];
        }
        if (Array.isArray(response.data)) return response.data;
      }
      return [];
    };

    return {
      simulator: extractArray(simulatorData, 'scenarios'),
      video: extractArray(videoData, 'scenarios'),
      roleplay: extractArray(roleplayData),
      briefingTemplates: extractArray(briefingData),
    };
  } catch (error) {
    console.error('[CoachingIntelligence] Failed to fetch scenarios:', error);
    return { simulator: [], video: [], roleplay: [], briefingTemplates: [] };
  }
}

// =============================================================================
// DATA AGGREGATION
// =============================================================================

/**
 * Aggregate session statistics for coaching analysis
 */
export function aggregateSessionStats(sessions) {
  // Ensure all session types are arrays
  const simulator = Array.isArray(sessions?.simulator) ? sessions.simulator : [];
  const video = Array.isArray(sessions?.video) ? sessions.video : [];
  const roleplay = Array.isArray(sessions?.roleplay) ? sessions.roleplay : [];
  const games = Array.isArray(sessions?.games) ? sessions.games : [];

  const allSessions = [
    ...simulator.map(s => ({ ...s, module: 'Szenario-Training' })),
    ...video.map(s => ({ ...s, module: 'Wirkungs-Analyse' })),
    ...roleplay.map(s => ({ ...s, module: 'Live-Simulation' })),
    ...games.map(s => ({ ...s, module: 'Rhetorik-Gym' })),
  ];

  const totalSessions = allSessions.length;

  // Module breakdown
  const moduleBreakdown = {
    'Szenario-Training': simulator.length,
    'Wirkungs-Analyse': video.length,
    'Live-Simulation': roleplay.length,
    'Rhetorik-Gym': games.length,
  };

  // Calculate average scores per category
  // Using unified dimensions across all modules:
  // - overall, content, structure, relevance, delivery
  const scores = {
    overall: [],
    content: [],
    structure: [],
    relevance: [],
    delivery: [],
    // Legacy dimensions (kept for backwards compatibility)
    communication: [],
    confidence: [],
    fillerWords: [],
  };

  // Process simulator sessions
  simulator.forEach(session => {
    if (session.overall_score != null) {
      const score = parseFloat(session.overall_score);
      // Normalize to 0-100 if needed
      scores.overall.push(score <= 10 ? score * 10 : score);
    }
    // Extract feedback scores (API returns summary_feedback, not summary_feedback_json)
    try {
      const feedbackData = session.summary_feedback || session.summary_feedback_json;
      const feedback = typeof feedbackData === 'string'
        ? JSON.parse(feedbackData)
        : feedbackData;

      // Try new format (scores object) first, then fall back to legacy format
      if (feedback?.scores) {
        if (feedback.scores.content != null) scores.content.push(feedback.scores.content * 10);
        if (feedback.scores.structure != null) scores.structure.push(feedback.scores.structure * 10);
        if (feedback.scores.relevance != null) scores.relevance.push(feedback.scores.relevance * 10);
        if (feedback.scores.delivery != null) scores.delivery.push(feedback.scores.delivery * 10);
      } else {
        // Legacy format: average_content_score, average_delivery_score
        if (feedback?.average_content_score != null) scores.content.push(feedback.average_content_score * 10);
        if (feedback?.average_delivery_score != null) scores.delivery.push(feedback.average_delivery_score * 10);
      }
    } catch {}
  });

  // Process video sessions
  video.forEach(session => {
    if (session.overall_score != null) {
      const score = parseFloat(session.overall_score);
      scores.overall.push(score <= 10 ? score * 10 : score);
    }
    // Extract scores from category_scores (video-specific structure)
    try {
      const categoryScores = session.category_scores || session.category_scores_json;
      const cats = typeof categoryScores === 'string' ? JSON.parse(categoryScores) : categoryScores;
      if (Array.isArray(cats)) {
        cats.forEach(cat => {
          // Map video categories to standard dimensions
          if (cat.category === 'inhalt' && cat.score != null) {
            scores.content.push(parseFloat(cat.score));
          }
          if (cat.category === 'kommunikation' && cat.score != null) {
            scores.delivery.push(parseFloat(cat.score));
          }
        });
      }
    } catch {}
  });

  // Process roleplay sessions - handle both old and new rating formats
  roleplay.forEach(session => {
    try {
      const feedback = typeof session.feedback_json === 'string'
        ? JSON.parse(session.feedback_json)
        : session.feedback_json;

      // Try multiple score locations (different feedback formats)
      const overallScore = feedback?.rating?.overall ??
        feedback?.rating?.gesamteindruck ??
        feedback?.overall_score ??
        feedback?.overallScore ??
        feedback?.score;

      if (overallScore != null) {
        // Normalize: if <= 10, multiply by 10
        const normalized = parseFloat(overallScore) <= 10 ? parseFloat(overallScore) * 10 : parseFloat(overallScore);
        scores.overall.push(normalized);
      }

      // Extract unified dimensions (new format after prompt update)
      const rating = feedback?.rating;
      if (rating) {
        if (rating.content != null) scores.content.push(parseFloat(rating.content) * 10);
        if (rating.structure != null) scores.structure.push(parseFloat(rating.structure) * 10);
        if (rating.relevance != null) scores.relevance.push(parseFloat(rating.relevance) * 10);
        if (rating.delivery != null) scores.delivery.push(parseFloat(rating.delivery) * 10);

        // Legacy dimensions (for backwards compatibility with old sessions)
        if (rating.communication != null) scores.communication.push(parseFloat(rating.communication) * 10);
      }
    } catch {}
  });

  // Process games (Rhetorik-Gym)
  let totalFillerWords = 0;
  let fillerWordCount = 0;
  games.forEach(game => {
    if (game.score != null) {
      scores.overall.push(parseFloat(game.score));
    }
    if (game.filler_count != null) {
      totalFillerWords += parseInt(game.filler_count);
      fillerWordCount++;
    }
  });

  // Calculate averages
  const calculateAvg = (arr) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

  // Unified score dimensions matching all modules
  const averageScores = {
    'Gesamt': calculateAvg(scores.overall),
    'Inhalt': calculateAvg(scores.content),
    'Struktur': calculateAvg(scores.structure),
    'Relevanz': calculateAvg(scores.relevance),
    'Präsentation': calculateAvg(scores.delivery),
  };

  // Calculate trend (last 30 days vs before)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentScores = [];
  const olderScores = [];

  // Helper to get date from session (try multiple fields)
  const getSessionDate = (session) => {
    const dateStr = session.created_at || session.started_at || session.updated_at;
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  };

  // Helper to get score from session
  const getSessionScore = (session) => {
    // Direct score fields
    if (session.overall_score != null) {
      const s = parseFloat(session.overall_score);
      return s <= 10 ? s * 10 : s;
    }
    if (session.score != null) {
      return parseFloat(session.score);
    }
    // Try to extract from feedback_json
    try {
      const feedback = typeof session.feedback_json === 'string'
        ? JSON.parse(session.feedback_json)
        : session.feedback_json;
      const score = feedback?.rating?.overall ??
        feedback?.rating?.gesamteindruck ??
        feedback?.overall_score;
      if (score != null) {
        const s = parseFloat(score);
        return s <= 10 ? s * 10 : s;
      }
    } catch {}
    return null;
  };

  allSessions.forEach(session => {
    const sessionDate = getSessionDate(session);
    const score = getSessionScore(session);
    if (sessionDate && score != null) {
      if (sessionDate >= thirtyDaysAgo) {
        recentScores.push(score);
      } else {
        olderScores.push(score);
      }
    }
  });

  const recentAvg = calculateAvg(recentScores);
  const olderAvg = calculateAvg(olderScores);
  const recentTrend = (recentAvg != null && olderAvg != null && olderAvg > 0)
    ? ((recentAvg - olderAvg) / olderAvg) * 100
    : null;

  // Extract common strengths and weaknesses from feedback
  // Store full text with count for better AI analysis
  const strengthsMap = {};
  const weaknessesMap = {};

  // Also track which scenarios were practiced
  const practicedScenarios = {
    simulator: new Set(),
    video: new Set(),
    roleplay: new Set(),
  };

  [...simulator, ...video, ...roleplay].forEach(session => {
    // Track practiced scenarios
    if (session.scenario_id) {
      if (simulator.includes(session)) practicedScenarios.simulator.add(session.scenario_id);
      else if (video.includes(session)) practicedScenarios.video.add(session.scenario_id);
      else if (roleplay.includes(session)) practicedScenarios.roleplay.add(session.scenario_id);
    }

    try {
      // API returns summary_feedback (not summary_feedback_json)
      let feedback = session.summary_feedback || session.summary_feedback_json || session.feedback_json || session.analysis_json;
      if (typeof feedback === 'string') feedback = JSON.parse(feedback);
      if (feedback?.strengths) {
        feedback.strengths.forEach(s => {
          // Use full text, normalize for deduplication
          const key = s.toLowerCase().trim();
          if (key.length > 10) { // Skip very short entries
            strengthsMap[key] = (strengthsMap[key] || 0) + 1;
          }
        });
      }
      if (feedback?.improvements || feedback?.weaknesses) {
        (feedback.improvements || feedback.weaknesses || []).forEach(w => {
          const key = w.toLowerCase().trim();
          if (key.length > 10) { // Skip very short entries
            weaknessesMap[key] = (weaknessesMap[key] || 0) + 1;
          }
        });
      }
    } catch {}
  });

  // Get top 20 strengths and weaknesses with full text
  const topStrengths = Object.entries(strengthsMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([text, count]) => ({ text, count }));

  const topWeaknesses = Object.entries(weaknessesMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([text, count]) => ({ text, count }));

  // Find last session date
  const sessionsWithDates = allSessions
    .map(s => ({ session: s, date: getSessionDate(s) }))
    .filter(({ date }) => date !== null);

  const sortedByDate = sessionsWithDates.sort((a, b) => b.date - a.date);

  const lastSessionDate = sortedByDate[0]?.date
    ? sortedByDate[0].date.toLocaleDateString('de-DE')
    : null;

  const daysSinceLastSession = sortedByDate[0]?.date
    ? Math.floor((Date.now() - sortedByDate[0].date) / (1000 * 60 * 60 * 24))
    : null;

  // Pacing issues from audio analysis (games API renames analysis_json to analysis)
  const pacingIssues = [];
  [...simulator, ...games].forEach(session => {
    try {
      let analysis = session.analysis || session.audio_analysis || session.analysis_json;
      if (typeof analysis === 'string') analysis = JSON.parse(analysis);
      if (analysis?.pacing?.rating && analysis.pacing.rating !== 'optimal') {
        if (!pacingIssues.includes(analysis.pacing.rating)) {
          pacingIssues.push(analysis.pacing.rating);
        }
      }
    } catch {}
  });

  return {
    totalSessions,
    moduleBreakdown,
    averageScores,
    recentTrend,
    topStrengths,
    topWeaknesses,
    fillerWordAverage: fillerWordCount > 0 ? totalFillerWords / fillerWordCount : null,
    pacingIssues,
    lastSessionDate,
    daysSinceLastSession: daysSinceLastSession ?? 999,
    rawSessions: sessions,
    practicedScenarios: {
      simulator: Array.from(practicedScenarios.simulator),
      video: Array.from(practicedScenarios.video),
      roleplay: Array.from(practicedScenarios.roleplay),
    },
  };
}

/**
 * Generate scenario catalog for the AI prompt
 * @param {Object} scenarios - All available scenarios
 * @param {Object} practicedScenarios - IDs of scenarios the user has already practiced
 */
export function generateScenarioCatalog(scenarios, practicedScenarios = {}) {
  // Ensure all scenario types are arrays
  const simulator = Array.isArray(scenarios?.simulator) ? scenarios.simulator : [];
  const video = Array.isArray(scenarios?.video) ? scenarios.video : [];
  const roleplay = Array.isArray(scenarios?.roleplay) ? scenarios.roleplay : [];
  const briefingTemplates = Array.isArray(scenarios?.briefingTemplates) ? scenarios.briefingTemplates : [];

  // Convert practiced arrays to Sets for fast lookup
  const practicedSim = new Set(practicedScenarios?.simulator || []);
  const practicedVid = new Set(practicedScenarios?.video || []);
  const practicedRole = new Set(practicedScenarios?.roleplay || []);

  let catalog = '\n## VERFÜGBARE TRAININGS-SZENARIEN\n';
  catalog += '(✓ = bereits geübt, empfehle bevorzugt NEUE Szenarien)\n\n';

  // Szenario-Training
  if (simulator.length > 0) {
    catalog += '### Szenario-Training (strukturiertes Q&A mit Feedback)\n';
    simulator.forEach(s => {
      const practiced = practicedSim.has(s.id) || practicedSim.has(String(s.id));
      const marker = practiced ? '✓ ' : '';
      catalog += `- ${marker}ID:${s.id} "${s.title}"\n`;
    });
    catalog += '\n';
  }

  // Video Training
  if (video.length > 0) {
    catalog += '### Wirkungs-Analyse (Video-Training mit Körpersprache-Feedback)\n';
    video.forEach(s => {
      const practiced = practicedVid.has(s.id) || practicedVid.has(String(s.id));
      const marker = practiced ? '✓ ' : '';
      catalog += `- ${marker}ID:${s.id} "${s.title}"\n`;
    });
    catalog += '\n';
  }

  // Live Simulation
  if (roleplay.length > 0) {
    catalog += '### Live-Simulation (Echtzeit-Gespräch mit KI)\n';
    roleplay.forEach(s => {
      const practiced = practicedRole.has(s.id) || practicedRole.has(String(s.id));
      const marker = practiced ? '✓ ' : '';
      catalog += `- ${marker}ID:${s.id} "${s.title}"\n`;
    });
    catalog += '\n';
  }

  // Smart Briefing Templates (no practice tracking)
  if (briefingTemplates.length > 0) {
    catalog += '### Smart Briefing (KI-generierte Wissenspakete)\n';
    briefingTemplates.forEach(t => {
      catalog += `- ID:${t.id} "${t.title}" [${t.category || 'Allgemein'}]\n`;
    });
    catalog += '\n';
  }

  // Rhetorik-Gym (always available, no scenarios)
  catalog += '### Rhetorik-Gym (Kurze Sprechübungen)\n';
  catalog += '- "Der Klassiker" - 60 Sekunden freies Sprechen\n';
  catalog += '- "Zufalls-Thema" - Überraschungsthema per Zufall\n';
  catalog += '- "Stress-Test" - 90 Sekunden mit wechselnden Fragen\n';

  return catalog;
}

// =============================================================================
// AI COACHING GENERATION
// =============================================================================

/**
 * Generate comprehensive coaching analysis using Gemini
 */
export async function generateCoachingAnalysis(sessionStats, scenarios, userFocus = null) {
  const { totalSessions } = sessionStats;

  // For new users or users with very few sessions
  if (totalSessions < 3) {
    console.log('[CoachingIntelligence] New user - using welcome prompt');
    const welcomePrompt = generateWelcomeCoachingPrompt();

    try {
      // Use a simple call to get the welcome response
      const response = await callGeminiForCoaching(welcomePrompt, {
        type: 'welcome',
        totalSessions,
        userFocus: userFocus || 'none',
      });
      return {
        ...response,
        isWelcome: true,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[CoachingIntelligence] Failed to generate welcome coaching:', error);
      return getDefaultWelcomeCoaching();
    }
  }

  // For users with enough data - generate comprehensive analysis
  const scenarioCatalog = generateScenarioCatalog(scenarios, sessionStats.practicedScenarios);
  const basePrompt = generateComprehensiveCoachingPrompt(sessionStats, userFocus);
  const fullPrompt = basePrompt + '\n' + scenarioCatalog + `

## WICHTIG FÜR EMPFEHLUNGEN

Wenn du ein Training empfiehlst, nutze die IDs aus dem Szenario-Katalog oben.
Format für Empfehlungen:
{
  "scenario_id": <ID aus Katalog oder null für Rhetorik-Gym>,
  "scenario_title": "<Exakter Titel aus Katalog>",
  "module": "szenario-training|wirkungs-analyse|live-simulation|smart-briefing|rhetorik-gym"
}`;

  try {
    const response = await callGeminiForCoaching(fullPrompt, {
      type: 'comprehensive',
      totalSessions,
      userFocus: userFocus || 'none',
      moduleBreakdown: sessionStats.moduleBreakdown,
      scenarioCatalogLength: scenarioCatalog.length,
      scenarioCounts: {
        simulator: scenarios.simulator?.length || 0,
        video: scenarios.video?.length || 0,
        roleplay: scenarios.roleplay?.length || 0,
        briefingTemplates: scenarios.briefingTemplates?.length || 0,
      },
      practicedCounts: {
        simulator: sessionStats.practicedScenarios?.simulator?.length || 0,
        video: sessionStats.practicedScenarios?.video?.length || 0,
        roleplay: sessionStats.practicedScenarios?.roleplay?.length || 0,
      },
    });
    return {
      ...response,
      isWelcome: false,
      generatedAt: new Date().toISOString(),
      sessionStats,
    };
  } catch (error) {
    console.error('[CoachingIntelligence] Failed to generate coaching analysis:', error);
    throw error;
  }
}

/**
 * Call Gemini API for coaching analysis
 */
async function callGeminiForCoaching(prompt, metadata = {}) {
  // Import dynamically to avoid circular dependencies
  const { GoogleGenerativeAI } = await import('@google/generative-ai');

  // Get API key from WordPress config (same as other Gemini services)
  const apiKey = wordpressAPI.getGeminiApiKey();
  if (!apiKey) {
    throw new Error('Gemini API key not configured');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  // Parse JSON from response
  try {
    // Extract JSON from markdown code blocks if present
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonString = jsonMatch ? jsonMatch[1].trim() : text.trim();
    const parsed = JSON.parse(jsonString);

    // Log prompt and response to server-side prompts.log
    wordpressAPI.logPrompt(
      'KI_COACH_ANALYSIS',
      'KI-Coach: Umfassende Coaching-Analyse basierend auf allen User-Sessions.',
      prompt,
      {
        ...metadata,
        model: 'gemini-2.0-flash-exp',
        promptLength: prompt.length,
        responseLength: text.length,
      },
      text,
      false
    );

    return parsed;
  } catch (parseError) {
    console.error('[CoachingIntelligence] Failed to parse Gemini response:', parseError);
    console.log('[CoachingIntelligence] Raw response:', text);

    // Log error to prompts.log
    wordpressAPI.logPrompt(
      'KI_COACH_ANALYSIS',
      'KI-Coach: Umfassende Coaching-Analyse - PARSE ERROR',
      prompt,
      {
        ...metadata,
        model: 'gemini-2.0-flash-exp',
        promptLength: prompt.length,
        responseLength: text.length,
        error: parseError.message,
      },
      text,
      true
    );

    throw new Error('Failed to parse AI response');
  }
}

/**
 * Default welcome coaching for when AI fails
 */
function getDefaultWelcomeCoaching() {
  return {
    isWelcome: true,
    level: {
      name: 'Einsteiger',
      score: 0,
      description: 'Bereit für den Start deiner Trainingsreise!',
    },
    summary: 'Herzlich willkommen! Du befindest dich am Anfang einer spannenden Reise zur Verbesserung deiner Kommunikationsfähigkeiten. Wir freuen uns, dich dabei zu unterstützen. Regelmäßiges Training wird dir helfen, deine Ziele zu erreichen und selbstbewusster zu werden.',
    strengths: [
      {
        title: 'Motivation',
        description: 'Du hast den ersten Schritt gemacht und dich für das Training entschieden!',
        evidence: 'Dein Interesse an persönlicher Weiterentwicklung ist der wichtigste Ausgangspunkt für deinen Erfolg.',
      },
      {
        title: 'Offenheit',
        description: 'Du bist bereit, Neues zu lernen und dich selbst zu verbessern.',
        evidence: 'Die Bereitschaft, Feedback anzunehmen und sich neuen Herausforderungen zu stellen, ist ein großer Vorteil.',
      },
    ],
    focusAreas: [
      {
        title: 'Erste Trainingserfahrungen sammeln',
        priority: 'hoch',
        description: 'Lerne die verschiedenen Trainingsmodule kennen und finde heraus, welche am besten zu dir passen.',
        currentState: 'Noch keine Trainings absolviert',
        targetState: '3-5 verschiedene Sessions in der ersten Woche ausprobieren',
        suggestedTrainings: [
          {
            title: 'Rhetorik-Gym: Der Klassiker',
            module: 'rhetorik-gym',
            scenario_id: null,
          },
          {
            title: 'Smart Briefing erstellen',
            module: 'smart-briefing',
            scenario_id: null,
          },
        ],
      },
      {
        title: 'Sprechsicherheit aufbauen',
        priority: 'mittel',
        description: 'Übe strukturiertes Sprechen und erhalte direktes Feedback zu deiner Performance.',
        currentState: 'Noch keine Übungserfahrung',
        targetState: '2-3 strukturierte Trainings absolvieren',
        suggestedTrainings: [
          {
            title: 'Szenario-Training',
            module: 'szenario-training',
            scenario_id: null,
          },
          {
            title: 'Live-Simulation mit KI',
            module: 'live-simulation',
            scenario_id: null,
          },
        ],
      },
      {
        title: 'Gesamtwirkung verstehen',
        priority: 'niedrig',
        description: 'Lerne, wie du auf andere wirkst - verbal und nonverbal.',
        currentState: 'Noch keine Selbsteinschätzung',
        targetState: 'Erste Wirkungs-Analyse durchführen',
        suggestedTrainings: [
          {
            title: 'Wirkungs-Analyse (Video)',
            module: 'wirkungs-analyse',
            scenario_id: null,
          },
          {
            title: 'Rhetorik-Gym: Stress-Test',
            module: 'rhetorik-gym',
            scenario_id: null,
          },
        ],
      },
    ],
    recommendations: [
      {
        action: 'Starte mit dem Rhetorik-Gym',
        module: 'rhetorik-gym',
        reason: 'Kurze Sessions (60 Sekunden) - perfekt zum Einstieg ohne Zeitdruck',
        frequency: '1x täglich',
      },
      {
        action: 'Erstelle dein erstes Smart Briefing',
        module: 'smart-briefing',
        reason: 'Bereite dich strukturiert auf ein konkretes Gespräch vor',
        frequency: 'Vor wichtigen Terminen',
      },
      {
        action: 'Probiere das Szenario-Training',
        module: 'szenario-training',
        reason: 'Strukturiertes Üben mit sofortigem KI-Feedback nach jeder Antwort',
        frequency: '2-3x pro Woche',
      },
      {
        action: 'Teste die Live-Simulation',
        module: 'live-simulation',
        reason: 'Erlebe ein realistisches Gespräch mit dem KI-Interviewer',
        frequency: '1x pro Woche',
      },
      {
        action: 'Analysiere deine Wirkung',
        module: 'wirkungs-analyse',
        reason: 'Video-Feedback zu Körpersprache und Auftreten',
        frequency: 'Alle 2 Wochen',
      },
    ],
    nextStep: {
      title: 'Dein erstes Rhetorik-Gym Spiel',
      description: 'Sprich 60 Sekunden frei zu einem Thema deiner Wahl. Du erhältst sofort Feedback zu deinen Füllwörtern, deinem Sprechtempo und weiteren Aspekten deiner Performance.',
      module: 'rhetorik-gym',
      estimatedTime: '2 Minuten',
    },
    motivation: 'Jede Reise beginnt mit dem ersten Schritt - und du hast ihn gerade gemacht!',
    generatedAt: new Date().toISOString(),
  };
}

// =============================================================================
// MAIN EXPORT
// =============================================================================

/**
 * Main function to get complete coaching intelligence
 * @param {string|null} userFocus - User's selected focus area
 * @param {boolean} forceRefresh - If true, bypass cache and regenerate analysis
 */
export async function getCoachingIntelligence(userFocus = null, forceRefresh = false) {
  console.log('[CoachingIntelligence] Starting...', {
    userFocus: userFocus || 'none',
    forceRefresh,
  });

  // Step 1: Fetch sessions first (quick, needed for cache validation)
  const sessions = await fetchAllUserSessions();
  const sessionCountHash = generateSessionCountHash(sessions);

  console.log('[CoachingIntelligence] Sessions fetched:', {
    simulator: sessions.simulator.length,
    video: sessions.video.length,
    roleplay: sessions.roleplay.length,
    games: sessions.games.length,
    hash: sessionCountHash,
  });

  // Step 2: Check cache (unless force refresh)
  if (!forceRefresh) {
    const cached = getCachedCoaching(sessionCountHash, userFocus);
    if (cached) {
      // Return cached data but with fresh session data for the progress chart
      return {
        ...cached,
        sessions, // Fresh session data for charts
        fromCache: true,
      };
    }
  } else {
    console.log('[CoachingIntelligence] Force refresh requested');
    clearCoachingCache();
  }

  // Step 3: Fetch scenarios (only if not cached)
  const scenarios = await fetchAllScenarios();
  console.log('[CoachingIntelligence] Scenarios fetched:', {
    simulator: scenarios.simulator.length,
    video: scenarios.video.length,
    roleplay: scenarios.roleplay.length,
    briefingTemplates: scenarios.briefingTemplates.length,
  });

  // Step 4: Aggregate statistics
  const stats = aggregateSessionStats(sessions);
  console.log('[CoachingIntelligence] Stats aggregated:', {
    totalSessions: stats.totalSessions,
    averageScores: stats.averageScores,
    daysSinceLastSession: stats.daysSinceLastSession,
    lastSessionDate: stats.lastSessionDate,
    moduleBreakdown: stats.moduleBreakdown,
  });

  // Step 5: Generate AI analysis (the expensive part)
  console.log('[CoachingIntelligence] Generating AI analysis...');
  const coaching = await generateCoachingAnalysis(stats, scenarios, userFocus);

  const result = {
    coaching,
    stats,
    scenarios,
    sessions,
    fromCache: false,
  };

  // Step 6: Cache the result
  setCachedCoaching(result, sessionCountHash, userFocus);

  return result;
}

export default {
  getCoachingIntelligence,
  clearCoachingCache,
  fetchAllUserSessions,
  fetchAllScenarios,
  aggregateSessionStats,
  generateCoachingAnalysis,
};
