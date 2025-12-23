/**
 * ElevenLabs API Service
 * Handles interactions with the ElevenLabs Conversational AI API
 */

import { delay } from '@/utils/timing';

const ELEVENLABS_API_BASE = 'https://api.elevenlabs.io/v1';

/**
 * Downloads the audio recording of a complete conversation from ElevenLabs
 * with retry logic since audio may not be immediately available after conversation ends.
 *
 * IMPORTANT: The "Audio Saving" feature must be enabled in your Agent settings
 * in the ElevenLabs dashboard for this to work.
 *
 * @param {string} conversationId - The ID of the conversation to download audio for
 * @param {string} apiKey - ElevenLabs API key
 * @param {number} maxRetries - Maximum number of retry attempts (default: 5)
 * @param {number} retryDelayMs - Delay between retries in ms (default: 3000)
 * @returns {Promise<Blob>} - The audio file as a Blob
 * @throws {Error} - If the download fails or audio saving is not enabled
 */
export async function downloadConversationAudio(conversationId, apiKey, maxRetries = 5, retryDelayMs = 3000) {

  if (!conversationId) {
    throw new Error('Conversation ID is required');
  }

  if (!apiKey) {
    throw new Error('ElevenLabs API key is required');
  }

  // Log API key (partially masked for security)
  const maskedKey = apiKey.substring(0, 8) + '...' + apiKey.substring(apiKey.length - 4);

  const url = `${ELEVENLABS_API_BASE}/convai/conversations/${conversationId}/audio`;

  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'xi-api-key': apiKey,
        },
      });


      if (response.ok) {
        // Get the audio blob
        const audioBlob = await response.blob();

        if (audioBlob.size === 0) {
          throw new Error('Das heruntergeladene Audio ist leer. Möglicherweise wurde keine Audio-Aufnahme gespeichert.');
        }

        return audioBlob;
      }

      // Handle errors
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

      // For 404, retry since audio might not be ready yet
      if (response.status === 404 && attempt < maxRetries) {
        await delay(retryDelayMs);
        continue;
      }

      // Handle other error codes
      if (response.status === 401 || response.status === 403) {
        throw new Error(
          `Authentifizierungsfehler: ${errorMessage}\n\n` +
          `Bitte überprüfe deinen ElevenLabs API Key.`
        );
      } else if (response.status === 404) {
        lastError = new Error(
          `Konversations-Audio nicht gefunden nach ${maxRetries} Versuchen.\n\n` +
          `Mögliche Ursachen:\n` +
          `1. Die "Audio Saving" Funktion ist nicht in den Agent-Einstellungen aktiviert\n` +
          `2. Die Konversation existiert nicht oder wurde gelöscht\n` +
          `3. Das Audio wird noch verarbeitet\n\n` +
          `Bitte aktiviere "Store Call Audio" im ElevenLabs Dashboard unter Agent → Privacy.`
        );
      } else {
        throw new Error(`Fehler beim Herunterladen des Audios: ${errorMessage}`);
      }

    } catch (error) {
      // If it's our auth error, throw immediately
      if (error.message.includes('Authentifizierungsfehler')) {
        throw error;
      }

      lastError = error;

      // Retry for network errors
      if (attempt < maxRetries) {
        await delay(retryDelayMs);
      }
    }
  }

  // All retries exhausted
  console.error('❌ [ELEVENLABS] All retry attempts failed');
  throw lastError || new Error('Audio-Download fehlgeschlagen nach mehreren Versuchen.');
}

/**
 * Gets information about a specific conversation
 *
 * @param {string} conversationId - The ID of the conversation
 * @param {string} apiKey - ElevenLabs API key
 * @returns {Promise<Object>} - Conversation details
 */
export async function getConversationInfo(conversationId, apiKey) {

  if (!conversationId) {
    throw new Error('Conversation ID is required');
  }

  if (!apiKey) {
    throw new Error('ElevenLabs API key is required');
  }

  const url = `${ELEVENLABS_API_BASE}/convai/conversations/${conversationId}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey,
      },
    });


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

    return conversationData;

  } catch (error) {
    console.error('❌ [ELEVENLABS] Error fetching conversation info:', error);
    throw error;
  }
}
