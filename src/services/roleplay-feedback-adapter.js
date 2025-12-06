/**
 * Roleplay Feedback Adapter
 *
 * Handles transcript analysis for roleplay sessions
 * Converts roleplay transcripts to the format expected by FeedbackModal
 */

import { generateInterviewFeedback, generateAudioAnalysis } from './gemini.js';
import wordpressAPI from './wordpress-api.js';

/**
 * Analyze roleplay conversation transcript
 *
 * @param {array} transcript - Array of transcript messages [{role, text, timestamp}]
 * @param {object} scenarioContext - Context about the roleplay scenario
 * @param {object} audioFile - Optional audio file for audio analysis
 * @returns {Promise<object>} Analysis results with feedback and audio analysis
 */
export async function analyzeRoleplayTranscript(transcript, scenarioContext = {}, audioFile = null) {
  console.log('🎭 [Roleplay Feedback] Starting analysis...');
  console.log('🎭 [Roleplay Feedback] Transcript entries:', transcript.length);
  console.log('🎭 [Roleplay Feedback] Scenario context:', scenarioContext);

  if (!transcript || transcript.length === 0) {
    throw new Error('Transkript ist leer. Das Gespräch muss mindestens einen Austausch enthalten.');
  }

  // Format transcript for Gemini
  const formattedTranscript = formatTranscriptForGemini(transcript, scenarioContext);

  console.log('🎭 [Roleplay Feedback] Formatted transcript:', formattedTranscript.substring(0, 200) + '...');

  // Get Gemini API key
  const geminiApiKey = wordpressAPI.getGeminiApiKey();

  if (!geminiApiKey) {
    throw new Error('Gemini API Key ist nicht konfiguriert. Bitte kontaktiere den Administrator.');
  }

  const results = {
    feedbackContent: null,
    audioAnalysisContent: null,
  };

  try {
    // Generate feedback (transcript analysis)
    console.log('🎭 [Roleplay Feedback] Generating feedback...');

    // Use custom feedback prompt from scenario if available
    const customPrompt = scenarioContext.feedback_prompt || null;
    if (customPrompt) {
      console.log('🎭 [Roleplay Feedback] Using custom feedback prompt from scenario');
    }

    results.feedbackContent = await generateInterviewFeedback(
      formattedTranscript,
      geminiApiKey,
      'gemini-1.5-flash', // modelName as 3rd parameter
      customPrompt // customPrompt as 4th parameter
    );
    console.log('✅ [Roleplay Feedback] Feedback generated successfully');
  } catch (error) {
    console.error('❌ [Roleplay Feedback] Failed to generate feedback:', error);
    throw new Error(`Fehler bei der Feedback-Generierung: ${error.message}`);
  }

  // Generate audio analysis if audio file is provided
  if (audioFile) {
    try {
      console.log('🎭 [Roleplay Feedback] Generating audio analysis...');
      results.audioAnalysisContent = await generateAudioAnalysis(audioFile, geminiApiKey);
      console.log('✅ [Roleplay Feedback] Audio analysis generated successfully');
    } catch (error) {
      console.error('❌ [Roleplay Feedback] Failed to generate audio analysis:', error);

      // Create error response in expected format
      results.audioAnalysisContent = JSON.stringify({
        error: true,
        summary: 'Audio-Analyse konnte nicht durchgeführt werden.',
        errorMessage: error.message,
        troubleshooting: [
          'Stelle sicher, dass dein Mikrofon richtig funktioniert',
          'Versuche das Gespräch erneut zu starten',
          'Überprüfe, ob keine andere Anwendung das Mikrofon blockiert',
        ],
      });
    }
  }

  console.log('✅ [Roleplay Feedback] Analysis complete');

  return results;
}

/**
 * Format transcript for Gemini analysis
 *
 * @param {array} transcript - Array of transcript messages
 * @param {object} scenarioContext - Context about the roleplay scenario
 * @returns {string} Formatted transcript
 */
function formatTranscriptForGemini(transcript, scenarioContext = {}) {
  let formatted = '';

  // Add scenario context if available
  if (scenarioContext.title) {
    formatted += `Rollenspiel-Szenario: ${scenarioContext.title}\n`;
  }

  if (scenarioContext.description) {
    formatted += `Beschreibung: ${scenarioContext.description}\n`;
  }

  if (scenarioContext.variables) {
    formatted += '\nKontext-Variablen:\n';
    Object.entries(scenarioContext.variables).forEach(([key, value]) => {
      formatted += `- ${key}: ${value}\n`;
    });
  }

  formatted += '\n--- Gesprächsverlauf ---\n\n';

  // Format each transcript entry
  transcript.forEach((entry) => {
    const speaker = entry.role === 'agent' ? 'Interviewer' : 'Bewerber';
    formatted += `${speaker}: ${entry.text}\n\n`;
  });

  return formatted;
}

/**
 * Save roleplay session with analysis results
 *
 * @param {number} sessionId - Roleplay session ID
 * @param {string} transcript - Raw transcript (JSON string or array)
 * @param {string} feedbackJson - Feedback JSON string
 * @param {string} audioAnalysisJson - Audio analysis JSON string
 * @param {number} duration - Session duration in seconds
 * @param {string} conversationId - ElevenLabs conversation ID
 * @returns {Promise<object>} Updated session data
 */
export async function saveRoleplaySessionAnalysis(
  sessionId,
  transcript,
  feedbackJson,
  audioAnalysisJson = null,
  duration = 0,
  conversationId = null
) {
  console.log('💾 [Roleplay Feedback] Saving session analysis...');
  console.log('💾 [Roleplay Feedback] Session ID:', sessionId);

  try {
    // Prepare transcript (ensure it's a string)
    let transcriptString = transcript;
    if (Array.isArray(transcript)) {
      transcriptString = JSON.stringify(transcript);
    }

    // Prepare update data
    const updateData = {
      transcript: transcriptString,
      feedback_json: feedbackJson,
      duration: duration,
    };

    if (audioAnalysisJson) {
      updateData.audio_analysis_json = audioAnalysisJson;
    }

    if (conversationId) {
      updateData.conversation_id = conversationId;
    }

    // Update session via API
    const response = await wordpressAPI.request(`/roleplays/sessions/${sessionId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });

    console.log('✅ [Roleplay Feedback] Session analysis saved successfully');

    return response.data;
  } catch (error) {
    console.error('❌ [Roleplay Feedback] Failed to save session analysis:', error);
    throw new Error(`Fehler beim Speichern der Analyse: ${error.message}`);
  }
}

/**
 * Get roleplay session with analysis
 *
 * @param {number} sessionId - Roleplay session ID
 * @returns {Promise<object>} Session data with analysis
 */
export async function getRoleplaySessionAnalysis(sessionId) {
  console.log('📖 [Roleplay Feedback] Loading session analysis...');
  console.log('📖 [Roleplay Feedback] Session ID:', sessionId);

  try {
    const response = await wordpressAPI.request(`/roleplays/sessions/${sessionId}`, {
      method: 'GET',
    });

    console.log('✅ [Roleplay Feedback] Session analysis loaded successfully');

    return response.data;
  } catch (error) {
    console.error('❌ [Roleplay Feedback] Failed to load session analysis:', error);
    throw new Error(`Fehler beim Laden der Analyse: ${error.message}`);
  }
}

/**
 * Get all roleplay sessions for current user
 *
 * @param {object} params - Query parameters (limit, offset, scenario_id)
 * @returns {Promise<object>} Sessions data with pagination
 */
export async function getRoleplaySessions(params = {}) {
  console.log('📋 [Roleplay Feedback] Loading user sessions...');
  console.log('📋 [Roleplay Feedback] Params:', params);

  try {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/roleplays/sessions?${queryString}` : '/roleplays/sessions';

    const response = await wordpressAPI.request(endpoint, {
      method: 'GET',
    });

    console.log('✅ [Roleplay Feedback] Sessions loaded successfully');
    console.log('✅ [Roleplay Feedback] Sessions count:', response.data?.length || 0);

    return response;
  } catch (error) {
    console.error('❌ [Roleplay Feedback] Failed to load sessions:', error);
    throw new Error(`Fehler beim Laden der Sessions: ${error.message}`);
  }
}

/**
 * Get audio URL for a roleplay session (via proxy)
 *
 * @param {number} sessionId - Roleplay session ID
 * @returns {string} Audio URL
 */
export function getRoleplaySessionAudioUrl(sessionId) {
  const config = window.bewerbungstrainerConfig || { apiUrl: '/wp-json/bewerbungstrainer/v1' };
  return `${config.apiUrl}/roleplays/sessions/${sessionId}/audio`;
}

/**
 * Create a new roleplay session
 *
 * @param {object} sessionData - Session data
 * @returns {Promise<object>} Created session data
 */
export async function createRoleplaySession(sessionData) {
  console.log('📝 [Roleplay Feedback] Creating new session...');
  console.log('📝 [Roleplay Feedback] Session data:', sessionData);

  try {
    const response = await wordpressAPI.request('/roleplays/sessions', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });

    console.log('✅ [Roleplay Feedback] Session created successfully');
    console.log('✅ [Roleplay Feedback] Session ID:', response.data.id);

    return response.data;
  } catch (error) {
    console.error('❌ [Roleplay Feedback] Failed to create session:', error);
    throw new Error(`Fehler beim Erstellen der Session: ${error.message}`);
  }
}

/**
 * Get all roleplay scenarios
 *
 * @returns {Promise<array>} Array of scenarios
 */
export async function getRoleplayScenarios() {
  console.log('📋 [Roleplay Feedback] Loading scenarios...');

  try {
    const response = await wordpressAPI.request('/roleplays', {
      method: 'GET',
    });

    console.log('✅ [Roleplay Feedback] Scenarios loaded successfully');
    console.log('✅ [Roleplay Feedback] Scenarios count:', response.data.length);

    return response.data;
  } catch (error) {
    console.error('❌ [Roleplay Feedback] Failed to load scenarios:', error);
    throw new Error(`Fehler beim Laden der Szenarien: ${error.message}`);
  }
}

/**
 * Get specific roleplay scenario
 *
 * @param {number} scenarioId - Scenario ID
 * @returns {Promise<object>} Scenario data
 */
export async function getRoleplayScenario(scenarioId) {
  console.log('📋 [Roleplay Feedback] Loading scenario...');
  console.log('📋 [Roleplay Feedback] Scenario ID:', scenarioId);

  try {
    const response = await wordpressAPI.request(`/roleplays/${scenarioId}`, {
      method: 'GET',
    });

    console.log('✅ [Roleplay Feedback] Scenario loaded successfully');

    return response.data;
  } catch (error) {
    console.error('❌ [Roleplay Feedback] Failed to load scenario:', error);
    throw new Error(`Fehler beim Laden des Szenarios: ${error.message}`);
  }
}

/**
 * Create custom roleplay scenario (temporary)
 *
 * @param {object} scenarioData - Custom scenario data
 * @returns {Promise<object>} Custom scenario data
 */
export async function createCustomRoleplayScenario(scenarioData) {
  console.log('🎨 [Roleplay Feedback] Creating custom scenario...');
  console.log('🎨 [Roleplay Feedback] Scenario data:', scenarioData);

  try {
    const response = await wordpressAPI.request('/roleplays/custom', {
      method: 'POST',
      body: JSON.stringify(scenarioData),
    });

    console.log('✅ [Roleplay Feedback] Custom scenario created successfully');

    return response.data;
  } catch (error) {
    console.error('❌ [Roleplay Feedback] Failed to create custom scenario:', error);
    throw new Error(`Fehler beim Erstellen des eigenen Szenarios: ${error.message}`);
  }
}
