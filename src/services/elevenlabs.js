/**
 * ElevenLabs API Service
 * Handles interactions with the ElevenLabs Conversational AI API
 */

const ELEVENLABS_API_BASE = 'https://api.elevenlabs.io/v1';

/**
 * Downloads the audio recording of a complete conversation from ElevenLabs
 *
 * IMPORTANT: The "Audio Saving" feature must be enabled in your Agent settings
 * in the ElevenLabs dashboard for this to work.
 *
 * @param {string} conversationId - The ID of the conversation to download audio for
 * @param {string} apiKey - ElevenLabs API key
 * @returns {Promise<Blob>} - The audio file as a Blob
 * @throws {Error} - If the download fails or audio saving is not enabled
 */
export async function downloadConversationAudio(conversationId, apiKey) {
  console.log('🎵 [ELEVENLABS] Starting conversation audio download...');
  console.log(`🆔 [ELEVENLABS] Conversation ID: ${conversationId}`);

  if (!conversationId) {
    throw new Error('Conversation ID is required');
  }

  if (!apiKey) {
    throw new Error('ElevenLabs API key is required');
  }

  // Log API key (partially masked for security)
  const maskedKey = apiKey.substring(0, 8) + '...' + apiKey.substring(apiKey.length - 4);
  console.log(`🔑 [ELEVENLABS] API Key: ${maskedKey}`);

  const url = `${ELEVENLABS_API_BASE}/convai/conversations/${conversationId}/audio`;
  console.log(`📡 [ELEVENLABS] Request URL: ${url}`);

  try {
    console.log('📤 [ELEVENLABS] Sending download request...');

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey,
      },
    });

    console.log(`📥 [ELEVENLABS] Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      // Try to get error details from response
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

      try {
        const errorData = await response.json();
        console.error('❌ [ELEVENLABS] Error response:', errorData);
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch (e) {
        // Response might not be JSON
        const errorText = await response.text();
        if (errorText) {
          console.error('❌ [ELEVENLABS] Error response (text):', errorText);
          errorMessage = errorText;
        }
      }

      // Provide helpful error messages
      if (response.status === 404) {
        throw new Error(
          `Konversations-Audio nicht gefunden.\n\n` +
          `Mögliche Ursachen:\n` +
          `1. Die "Audio Saving" Funktion ist nicht in den Agent-Einstellungen aktiviert\n` +
          `2. Die Konversation existiert nicht oder wurde gelöscht\n` +
          `3. Die Konversation ist noch nicht abgeschlossen\n\n` +
          `Bitte aktiviere "Audio Saving" im ElevenLabs Dashboard unter Agent-Einstellungen.`
        );
      } else if (response.status === 401 || response.status === 403) {
        throw new Error(
          `Authentifizierungsfehler: ${errorMessage}\n\n` +
          `Bitte überprüfe deinen ElevenLabs API Key.`
        );
      } else {
        throw new Error(`Fehler beim Herunterladen des Audios: ${errorMessage}`);
      }
    }

    // Get the audio blob
    const audioBlob = await response.blob();
    console.log(`✅ [ELEVENLABS] Audio downloaded successfully`);
    console.log(`📊 [ELEVENLABS] Audio size: ${audioBlob.size} bytes`);
    console.log(`🎵 [ELEVENLABS] Audio type: ${audioBlob.type}`);

    if (audioBlob.size === 0) {
      throw new Error('Das heruntergeladene Audio ist leer. Möglicherweise wurde keine Audio-Aufnahme gespeichert.');
    }

    return audioBlob;

  } catch (error) {
    // If it's already our custom error, re-throw it
    if (error.message.includes('Konversations-Audio') ||
        error.message.includes('Authentifizierungsfehler') ||
        error.message.includes('Fehler beim Herunterladen')) {
      throw error;
    }

    // Handle network errors
    console.error('❌ [ELEVENLABS] Network or unexpected error:', error);
    throw new Error(
      `Netzwerkfehler beim Herunterladen des Audios: ${error.message}\n\n` +
      `Bitte überprüfe deine Internetverbindung und versuche es erneut.`
    );
  }
}

/**
 * Gets information about a specific conversation
 *
 * @param {string} conversationId - The ID of the conversation
 * @param {string} apiKey - ElevenLabs API key
 * @returns {Promise<Object>} - Conversation details
 */
export async function getConversationInfo(conversationId, apiKey) {
  console.log('📋 [ELEVENLABS] Fetching conversation info...');
  console.log(`🆔 [ELEVENLABS] Conversation ID: ${conversationId}`);

  if (!conversationId) {
    throw new Error('Conversation ID is required');
  }

  if (!apiKey) {
    throw new Error('ElevenLabs API key is required');
  }

  const url = `${ELEVENLABS_API_BASE}/convai/conversations/${conversationId}`;
  console.log(`📡 [ELEVENLABS] Request URL: ${url}`);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey,
      },
    });

    console.log(`📥 [ELEVENLABS] Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch (e) {
        // Ignore JSON parse errors
      }

      throw new Error(`Fehler beim Abrufen der Konversations-Info: ${errorMessage}`);
    }

    const conversationData = await response.json();
    console.log('✅ [ELEVENLABS] Conversation info retrieved successfully');
    console.log('📊 [ELEVENLABS] Conversation data:', conversationData);

    return conversationData;

  } catch (error) {
    console.error('❌ [ELEVENLABS] Error fetching conversation info:', error);
    throw error;
  }
}
