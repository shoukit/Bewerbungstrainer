/**
 * Roleplay Feedback Adapter
 *
 * Handles transcript analysis for roleplay sessions
 * Converts roleplay transcripts to the format expected by FeedbackModal
 */

import { generateInterviewFeedback, generateAudioAnalysis } from './gemini.js';
import wordpressAPI, { getWPNonce, getWPApiUrl } from './wordpress-api.js';
import { decodeObjectStrings } from '../utils/parseJSON.js';
import { delay } from '../utils/timing.js';

/**
 * Analyze roleplay conversation transcript
 *
 * @param {array} transcript - Array of transcript messages [{role, text, timestamp}]
 * @param {object} scenarioContext - Context about the roleplay scenario
 * @param {object} audioFile - Optional audio file for audio analysis
 * @param {function} onStepChange - Optional callback to report progress steps
 * @returns {Promise<object>} Analysis results with feedback and audio analysis
 */
export async function analyzeRoleplayTranscript(transcript, scenarioContext = {}, audioFile = null, onStepChange = null) {

  if (!transcript || transcript.length === 0) {
    throw new Error('Transkript ist leer. Das Gespräch muss mindestens einen Austausch enthalten.');
  }

  // Format transcript for Gemini
  const formattedTranscript = formatTranscriptForGemini(transcript, scenarioContext);


  // Get Gemini API key
  const geminiApiKey = wordpressAPI.getGeminiApiKey();

  if (!geminiApiKey) {
    throw new Error('Gemini API Key ist nicht konfiguriert. Bitte kontaktiere den Administrator.');
  }

  const results = {
    feedbackContent: null,
    audioAnalysisContent: null,
  };

  // Build role options for dynamic feedback prompt (defined outside try blocks for shared access)
  const roleOptions = {
    roleType: scenarioContext.role_type || 'interview',
    userRoleLabel: scenarioContext.user_role_label || 'Bewerber',
    agentRoleLabel: scenarioContext.interviewer_profile?.role || 'Gesprächspartner',
  };

  try {
    // Generate feedback (transcript analysis)

    // Use custom feedback prompt from scenario if available
    const customPrompt = scenarioContext.feedback_prompt || null;
    if (customPrompt) {
    }

    results.feedbackContent = await generateInterviewFeedback(
      formattedTranscript,
      geminiApiKey,
      'gemini-1.5-flash', // modelName as 3rd parameter
      customPrompt, // customPrompt as 4th parameter
      roleOptions // roleOptions as 5th parameter
    );
  } catch (error) {
    console.error('❌ [Roleplay Feedback] Failed to generate feedback:', error);
    throw new Error(`Fehler bei der Feedback-Generierung: ${error.message}`);
  }

  // Generate audio analysis if audio file is provided
  if (audioFile) {
    // Report step change before starting audio analysis
    if (onStepChange) {
      onStepChange('audio_analysis');
    }
    try {
      // Include transcript for improved speaker identification in audio analysis
      results.audioAnalysisContent = await generateAudioAnalysis(
        audioFile,
        geminiApiKey,
        'gemini-1.5-flash', // modelName
        {
          ...roleOptions,
          hasTwoVoices: true, // Live-Gespräche have AI + user voices
          transcript: formattedTranscript, // Help Gemini identify speakers
        }
      );
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

  // Determine speaker labels based on scenario configuration
  // Default to "Interviewer"/"Bewerber" for backwards compatibility
  const userRoleLabel = scenarioContext.user_role_label || 'Bewerber';
  const agentRoleLabel = scenarioContext.interviewer_profile?.role || 'Gesprächspartner';

  // Format each transcript entry with appropriate speaker labels
  transcript.forEach((entry) => {
    const speaker = entry.role === 'agent' ? agentRoleLabel : userRoleLabel;
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


    // Update usage limits if duration > 0
    if (duration > 0) {
      try {
        await wordpressAPI.request(`/roleplays/sessions/${sessionId}/duration`, {
          method: 'POST',
          body: JSON.stringify({ duration_seconds: duration }),
        });
      } catch (usageError) {
        // Log error but don't fail the save operation
        console.warn('⚠️ [Roleplay Feedback] Failed to update usage limits:', usageError.message);
      }
    }


    return response.data;
  } catch (error) {
    console.error('❌ [Roleplay Feedback] ========= SAVE FAILED =========');
    console.error('❌ [Roleplay Feedback] Error:', error);
    console.error('❌ [Roleplay Feedback] Error message:', error.message);
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

  try {
    const response = await wordpressAPI.request(`/roleplays/sessions/${sessionId}`, {
      method: 'GET',
    });


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

  try {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/roleplays/sessions?${queryString}` : '/roleplays/sessions';

    const response = await wordpressAPI.request(endpoint, {
      method: 'GET',
    });


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
 * Fetch audio blob for a roleplay session via WordPress proxy
 * This is more reliable than direct ElevenLabs API as the proxy handles
 * authentication and retries server-side.
 *
 * @param {number} sessionId - Roleplay session ID
 * @param {number} maxRetries - Maximum retry attempts (default: 10)
 * @param {number} retryDelayMs - Delay between retries in ms (default: 3000)
 * @returns {Promise<Blob|null>} Audio blob or null if not available
 */
export async function fetchRoleplaySessionAudio(sessionId, maxRetries = 10, retryDelayMs = 3000) {

  const audioUrl = getRoleplaySessionAudioUrl(sessionId);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {

      const response = await fetch(audioUrl, {
        method: 'GET',
        headers: {
          'X-WP-Nonce': getWPNonce(),
        },
        credentials: 'same-origin',
      });


      if (response.ok) {
        const audioBlob = await response.blob();

        if (audioBlob.size === 0) {
          console.warn('⚠️ [Roleplay Feedback] Audio blob is empty, retrying...');
          if (attempt < maxRetries) {
            await delay(retryDelayMs);
            continue;
          }
          return null;
        }

        return audioBlob;
      }

      // 404 means audio not ready yet - retry
      if (response.status === 404 && attempt < maxRetries) {
        await delay(retryDelayMs);
        continue;
      }

      // Other errors
      console.error(`❌ [Roleplay Feedback] Failed to fetch audio: HTTP ${response.status}`);
      if (attempt < maxRetries) {
        await delay(retryDelayMs);
        continue;
      }

    } catch (error) {
      console.error(`❌ [Roleplay Feedback] Error fetching audio on attempt ${attempt}:`, error);
      if (attempt < maxRetries) {
        await delay(retryDelayMs);
        continue;
      }
    }
  }

  console.warn('⚠️ [Roleplay Feedback] All retry attempts failed, audio not available');
  return null;
}

/**
 * Update a roleplay session with conversation_id
 *
 * @param {number} sessionId - Roleplay session ID
 * @param {string} conversationId - ElevenLabs conversation ID
 * @returns {Promise<object>} Updated session data
 */
export async function updateRoleplaySessionConversationId(sessionId, conversationId) {

  try {
    const response = await wordpressAPI.request(`/roleplays/sessions/${sessionId}`, {
      method: 'PUT',
      body: JSON.stringify({
        conversation_id: conversationId,
      }),
    });

    return response.data;
  } catch (error) {
    console.error('❌ [Roleplay Feedback] Failed to update session conversation_id:', error);
    throw new Error(`Fehler beim Aktualisieren der Session: ${error.message}`);
  }
}

/**
 * Create a new roleplay session
 *
 * @param {object} sessionData - Session data
 * @returns {Promise<object>} Created session data
 */
export async function createRoleplaySession(sessionData) {

  try {
    const response = await wordpressAPI.request('/roleplays/sessions', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });


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

  try {
    // Use direct fetch like VideoTrainingDashboard (no Content-Type header for GET)
    const response = await fetch(`${getWPApiUrl()}/roleplays`, {
      headers: {
        'X-WP-Nonce': getWPNonce(),
      },
      credentials: 'same-origin',
    });

    if (!response.ok) {
      throw new Error('Fehler beim Laden der Szenarien');
    }

    const data = await response.json();


    // Decode Unicode escapes in scenario data (e.g., "u00f6" -> "ö")
    return decodeObjectStrings(data.data || []);
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

  try {
    const response = await wordpressAPI.request(`/roleplays/${scenarioId}`, {
      method: 'GET',
    });


    // Decode Unicode escapes in scenario data (e.g., "u00f6" -> "ö")
    return decodeObjectStrings(response.data);
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

  try {
    const response = await wordpressAPI.request('/roleplays/custom', {
      method: 'POST',
      body: JSON.stringify(scenarioData),
    });


    return response.data;
  } catch (error) {
    console.error('❌ [Roleplay Feedback] Failed to create custom scenario:', error);
    throw new Error(`Fehler beim Erstellen des eigenen Szenarios: ${error.message}`);
  }
}
