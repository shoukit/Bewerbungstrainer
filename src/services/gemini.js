/**
 * Gemini AI Service
 *
 * Provides functions for AI-powered analysis using Google's Gemini API.
 * - Interview feedback generation (text-based)
 * - Audio analysis (multimodal)
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_MODELS, ERROR_MESSAGES } from '@/config/constants';
import { getFeedbackPrompt, applyCustomPrompt } from '@/config/prompts/feedbackPrompt';
import { getAudioAnalysisPrompt } from '@/config/prompts/audioAnalysisPrompt';

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Masks an API key for safe logging
 * @param {string} apiKey - The API key to mask
 * @returns {string} - Masked key (e.g., "AIzaSy...abcd")
 */
function maskApiKey(apiKey) {
  if (!apiKey || apiKey.length < 12) return '***';
  return `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`;
}

/**
 * Checks if an error is a model-not-found error (404)
 * @param {Error} error - The error to check
 * @returns {boolean} - True if it's a 404/not-found error
 */
function isModelNotFoundError(error) {
  return error.message?.includes('404') || error.message?.includes('not found');
}

/**
 * Checks if an error is an API key error
 * @param {Error} error - The error to check
 * @returns {boolean} - True if it's an API key error
 */
function isApiKeyError(error) {
  return error.message?.includes('API key');
}

/**
 * Converts an audio file to base64 for Gemini API
 * @param {File|Blob} audioFile - The audio file to convert
 * @returns {Promise<Object>} - Object with inlineData containing base64 and mimeType
 */
async function audioFileToBase64(audioFile) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result.split(',')[1];
      resolve({
        inlineData: {
          data: base64,
          mimeType: audioFile.type || 'audio/webm',
        },
      });
    };
    reader.onerror = () => reject(new Error('Failed to read audio file'));
    reader.readAsDataURL(audioFile);
  });
}

/**
 * Generates a user-friendly error message based on the error type
 * @param {Error} error - The error that occurred
 * @param {string} context - Context string (e.g., "Feedback" or "Audio-Analyse")
 * @returns {string} - User-friendly error message
 */
function generateErrorMessage(error, context) {
  const models = GEMINI_MODELS.FALLBACK_ORDER.join(', ');

  if (isModelNotFoundError(error)) {
    return `Kein Gemini-Modell verfügbar. Versuchte Modelle: ${models}

Mögliche Lösungen:
1. Überprüfe, ob dein API Key gültig ist
2. Stelle sicher, dass die Gemini API aktiviert ist
3. Besuche https://ai.google.dev/ um deinen API-Key zu überprüfen

Fehler: ${error.message}`;
  }

  if (isApiKeyError(error)) {
    return `API Key Problem: ${error.message}

Stelle sicher, dass:
1. VITE_GEMINI_API_KEY korrekt in der .env Datei gesetzt ist
2. Der API Key gültig ist (überprüfe auf https://ai.google.dev/)`;
  }

  return error.message || 'Unbekannter Fehler';
}

// =============================================================================
// CORE API FUNCTION
// =============================================================================

/**
 * Base function for making Gemini API requests with model fallback
 *
 * @param {Object} options - Request options
 * @param {string} options.apiKey - Gemini API key
 * @param {string|Array} options.content - Prompt string or array of content parts (for multimodal)
 * @param {string} options.context - Context for logging/errors (e.g., "FEEDBACK", "AUDIO")
 * @returns {Promise<string>} - The generated response text
 */
async function callGeminiWithFallback({ apiKey, content, context }) {
  const logPrefix = `[GEMINI ${context}]`;

  // Validate API key
  if (!apiKey) {
    console.error(`❌ ${logPrefix} API key is missing`);
    throw new Error(ERROR_MESSAGES.API_KEY_MISSING);
  }

  console.log(`🚀 ${logPrefix} Starting request...`);
  console.log(`🔑 ${logPrefix} API Key: ${maskApiKey(apiKey)}`);

  let lastError = null;

  // Try each model in sequence
  for (const currentModel of GEMINI_MODELS.FALLBACK_ORDER) {
    try {
      console.log(`🔄 ${logPrefix} Trying model: ${currentModel}`);

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: currentModel });

      const result = await model.generateContent(content);
      const response = await result.response;
      const text = response.text();

      console.log(`✅ ${logPrefix} Success with ${currentModel} (${text.length} chars)`);
      return text;

    } catch (error) {
      console.error(`❌ ${logPrefix} Error with ${currentModel}:`, error.message);
      lastError = error;

      // Only try next model for 404 errors
      if (isModelNotFoundError(error)) {
        console.log(`⚠️ ${logPrefix} Model not found, trying next...`);
        continue;
      }

      // For other errors, stop trying
      break;
    }
  }

  // All models failed
  const errorMessage = generateErrorMessage(lastError, context);
  throw new Error(`Fehler bei der ${context}: ${errorMessage}`);
}

// =============================================================================
// PUBLIC API FUNCTIONS
// =============================================================================

/**
 * Lists all available models for the given API key
 * @param {string} apiKey - Google Gemini API key
 * @returns {Promise<Array>} - List of available models
 */
export async function listAvailableModels(apiKey) {
  if (!apiKey) {
    throw new Error(ERROR_MESSAGES.API_KEY_MISSING);
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const models = await genAI.listModels();

  console.log(`📋 [GEMINI] Found ${models.length} models`);
  return models;
}

/**
 * Generates feedback for a job interview based on the conversation transcript
 *
 * @param {string} transcript - The full conversation transcript
 * @param {string} apiKey - Google Gemini API key
 * @param {string} modelName - Optional model name (unused, kept for API compatibility)
 * @param {string|null} customPrompt - Optional custom prompt with ${transcript} placeholder
 * @returns {Promise<string>} - The generated feedback JSON string
 */
export async function generateInterviewFeedback(
  transcript,
  apiKey,
  modelName = 'gemini-1.5-flash',
  customPrompt = null
) {
  // Validate transcript
  if (!transcript || transcript.trim().length === 0) {
    console.error('❌ [GEMINI FEEDBACK] Transcript is empty');
    throw new Error(ERROR_MESSAGES.TRANSCRIPT_EMPTY);
  }

  console.log(`📝 [GEMINI FEEDBACK] Transcript length: ${transcript.length} chars`);
  console.log(`📝 [GEMINI FEEDBACK] Custom prompt: ${customPrompt ? 'Yes' : 'No'}`);

  // Build prompt
  const prompt = customPrompt
    ? applyCustomPrompt(customPrompt, transcript)
    : getFeedbackPrompt(transcript);

  return callGeminiWithFallback({
    apiKey,
    content: prompt,
    context: 'FEEDBACK',
  });
}

/**
 * Analyzes audio of an interview to evaluate paraverbal communication
 *
 * IMPORTANT: This function sends ONLY the audio file, NO transcript.
 * This ensures filler words like "Ähm" are detected that might be filtered
 * out by transcription services.
 *
 * @param {File|Blob} audioFile - The audio file to analyze
 * @param {string} apiKey - Google Gemini API key
 * @param {string} modelName - Optional model name (unused, kept for API compatibility)
 * @returns {Promise<string>} - The generated audio analysis JSON string
 */
export async function generateAudioAnalysis(
  audioFile,
  apiKey,
  modelName = 'gemini-1.5-flash'
) {
  // Validate audio file
  if (!audioFile) {
    console.error('❌ [GEMINI AUDIO] Audio file is missing');
    throw new Error(ERROR_MESSAGES.AUDIO_FILE_MISSING);
  }

  console.log(`🎵 [GEMINI AUDIO] File size: ${audioFile.size} bytes`);
  console.log(`🎵 [GEMINI AUDIO] File type: ${audioFile.type}`);

  // Convert audio to base64
  console.log('🔄 [GEMINI AUDIO] Converting audio to base64...');
  const audioPart = await audioFileToBase64(audioFile);
  console.log('✅ [GEMINI AUDIO] Audio converted');

  // Build content array with prompt and audio
  const prompt = getAudioAnalysisPrompt();
  const content = [prompt, audioPart];

  return callGeminiWithFallback({
    apiKey,
    content,
    context: 'AUDIO',
  });
}

export default {
  listAvailableModels,
  generateInterviewFeedback,
  generateAudioAnalysis,
};
