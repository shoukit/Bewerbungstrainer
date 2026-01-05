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
      fetch(`${baseUrl}/sessions`, { headers, credentials: 'same-origin' }),
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
  const scores = {
    overall: [],
    communication: [],
    content: [],
    structure: [],
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
      if (feedback?.scores) {
        if (feedback.scores.content != null) scores.content.push(feedback.scores.content * 10);
        if (feedback.scores.structure != null) scores.structure.push(feedback.scores.structure * 10);
      }
    } catch {}
  });

  // Process video sessions
  video.forEach(session => {
    if (session.overall_score != null) {
      const score = parseFloat(session.overall_score);
      scores.overall.push(score <= 10 ? score * 10 : score);
    }
  });

  // Process roleplay sessions - handle multiple score locations
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

      // Try communication score
      const commScore = feedback?.rating?.communication ??
        feedback?.rating?.kommunikation;
      if (commScore != null) {
        scores.communication.push(parseFloat(commScore) * 10);
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

  const averageScores = {
    'Gesamt': calculateAvg(scores.overall),
    'Kommunikation': calculateAvg(scores.communication),
    'Inhalt': calculateAvg(scores.content),
    'Struktur': calculateAvg(scores.structure),
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
  const strengthsMap = {};
  const weaknessesMap = {};

  [...simulator, ...video, ...roleplay].forEach(session => {
    try {
      // API returns summary_feedback (not summary_feedback_json)
      let feedback = session.summary_feedback || session.summary_feedback_json || session.feedback_json || session.analysis_json;
      if (typeof feedback === 'string') feedback = JSON.parse(feedback);
      if (feedback?.strengths) {
        feedback.strengths.forEach(s => {
          const key = s.toLowerCase().substring(0, 50);
          strengthsMap[key] = (strengthsMap[key] || 0) + 1;
        });
      }
      if (feedback?.improvements || feedback?.weaknesses) {
        (feedback.improvements || feedback.weaknesses || []).forEach(w => {
          const key = w.toLowerCase().substring(0, 50);
          weaknessesMap[key] = (weaknessesMap[key] || 0) + 1;
        });
      }
    } catch {}
  });

  const topStrengths = Object.entries(strengthsMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([text]) => text);

  const topWeaknesses = Object.entries(weaknessesMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([text]) => text);

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
  };
}

/**
 * Generate scenario catalog for the AI prompt
 */
export function generateScenarioCatalog(scenarios) {
  // Ensure all scenario types are arrays
  const simulator = Array.isArray(scenarios?.simulator) ? scenarios.simulator : [];
  const video = Array.isArray(scenarios?.video) ? scenarios.video : [];
  const roleplay = Array.isArray(scenarios?.roleplay) ? scenarios.roleplay : [];
  const briefingTemplates = Array.isArray(scenarios?.briefingTemplates) ? scenarios.briefingTemplates : [];

  let catalog = '\n## VERFÜGBARE TRAININGS-SZENARIEN\n\n';

  // Szenario-Training
  if (simulator.length > 0) {
    catalog += '### Szenario-Training (strukturiertes Q&A mit Feedback)\n';
    simulator.forEach(s => {
      const difficulty = s.difficulty || s.meta?.difficulty || 'Mittel';
      catalog += `- ID:${s.id} "${s.title}" [${difficulty}]${s.description ? ` - ${s.description.substring(0, 100)}` : ''}\n`;
    });
    catalog += '\n';
  }

  // Video Training
  if (video.length > 0) {
    catalog += '### Wirkungs-Analyse (Video-Training mit Körpersprache-Feedback)\n';
    video.forEach(s => {
      catalog += `- ID:${s.id} "${s.title}"${s.description ? ` - ${s.description.substring(0, 100)}` : ''}\n`;
    });
    catalog += '\n';
  }

  // Live Simulation
  if (roleplay.length > 0) {
    catalog += '### Live-Simulation (Echtzeit-Gespräch mit KI)\n';
    roleplay.forEach(s => {
      catalog += `- ID:${s.id} "${s.title}"${s.description ? ` - ${s.description.substring(0, 100)}` : ''}\n`;
    });
    catalog += '\n';
  }

  // Smart Briefing Templates
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
export async function generateCoachingAnalysis(sessionStats, scenarios) {
  const { totalSessions } = sessionStats;

  // For new users or users with very few sessions
  if (totalSessions < 3) {
    console.log('[CoachingIntelligence] New user - using welcome prompt');
    const welcomePrompt = generateWelcomeCoachingPrompt();

    try {
      // Use a simple call to get the welcome response
      const response = await callGeminiForCoaching(welcomePrompt);
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
  const scenarioCatalog = generateScenarioCatalog(scenarios);
  const basePrompt = generateComprehensiveCoachingPrompt(sessionStats);
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
    const response = await callGeminiForCoaching(fullPrompt);
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
async function callGeminiForCoaching(prompt) {
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
    return JSON.parse(jsonString);
  } catch (parseError) {
    console.error('[CoachingIntelligence] Failed to parse Gemini response:', parseError);
    console.log('[CoachingIntelligence] Raw response:', text);
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
      description: 'Bereit für den Start!',
    },
    summary: 'Willkommen bei deinem persönlichen Karriere-Coach! Starte jetzt mit deinem ersten Training.',
    strengths: [
      {
        title: 'Motivation',
        description: 'Du bist hier - das ist der erste Schritt',
        evidence: 'Interesse an Verbesserung ist die beste Voraussetzung',
      },
    ],
    focusAreas: [
      {
        title: 'Erste Erfahrungen sammeln',
        priority: 'hoch',
        description: 'Lerne die Module kennen',
        currentState: 'Noch keine Trainings',
        targetState: '5 Sessions in der ersten Woche',
      },
    ],
    recommendations: [
      {
        action: 'Starte mit dem Rhetorik-Gym',
        module: 'rhetorik-gym',
        reason: 'Kurze Sessions zum Einstieg',
        frequency: '1x täglich',
      },
    ],
    nextStep: {
      title: 'Dein erstes Rhetorik-Gym',
      description: 'Sprich 60 Sekunden zu einem Thema deiner Wahl',
      module: 'rhetorik-gym',
      estimatedTime: '2 Minuten',
    },
    motivation: 'Jede Reise beginnt mit dem ersten Schritt!',
    generatedAt: new Date().toISOString(),
  };
}

// =============================================================================
// MAIN EXPORT
// =============================================================================

/**
 * Main function to get complete coaching intelligence
 */
export async function getCoachingIntelligence() {
  console.log('[CoachingIntelligence] Starting analysis...');

  // Fetch all data in parallel
  const [sessions, scenarios] = await Promise.all([
    fetchAllUserSessions(),
    fetchAllScenarios(),
  ]);

  console.log('[CoachingIntelligence] Data fetched:', {
    sessions: {
      simulator: sessions.simulator.length,
      video: sessions.video.length,
      roleplay: sessions.roleplay.length,
      games: sessions.games.length,
    },
    scenarios: {
      simulator: scenarios.simulator.length,
      video: scenarios.video.length,
      roleplay: scenarios.roleplay.length,
      briefingTemplates: scenarios.briefingTemplates.length,
    },
  });

  // Debug: Log sample session data to understand structure
  if (sessions.simulator.length > 0) {
    console.log('[CoachingIntelligence] Sample simulator session:', {
      id: sessions.simulator[0].id,
      overall_score: sessions.simulator[0].overall_score,
      created_at: sessions.simulator[0].created_at,
    });
  }
  if (sessions.roleplay.length > 0) {
    console.log('[CoachingIntelligence] Sample roleplay session:', {
      id: sessions.roleplay[0].id,
      feedback_json: sessions.roleplay[0].feedback_json ? 'present' : 'missing',
      rating: sessions.roleplay[0].feedback_json?.rating,
      created_at: sessions.roleplay[0].created_at,
    });
  }
  if (sessions.games.length > 0) {
    console.log('[CoachingIntelligence] Sample game session:', {
      id: sessions.games[0].id,
      score: sessions.games[0].score,
      created_at: sessions.games[0].created_at,
    });
  }

  // Aggregate statistics
  const stats = aggregateSessionStats(sessions);
  console.log('[CoachingIntelligence] Stats aggregated:', {
    totalSessions: stats.totalSessions,
    averageScores: stats.averageScores,
    daysSinceLastSession: stats.daysSinceLastSession,
    lastSessionDate: stats.lastSessionDate,
    moduleBreakdown: stats.moduleBreakdown,
  });

  // Generate AI analysis
  const coaching = await generateCoachingAnalysis(stats, scenarios);

  return {
    coaching,
    stats,
    scenarios,
    sessions,
  };
}

export default {
  getCoachingIntelligence,
  fetchAllUserSessions,
  fetchAllScenarios,
  aggregateSessionStats,
  generateCoachingAnalysis,
};
