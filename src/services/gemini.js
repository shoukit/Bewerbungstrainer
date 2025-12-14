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
import { getRhetoricGamePrompt } from '@/config/prompts/gamePrompts';
import wordpressAPI from './wordpress-api.js';

// =============================================================================
// DEBUG LOGGING
// =============================================================================

/**
 * Enable/disable detailed prompt logging
 * Set to true to see full prompts in console
 */
const DEBUG_PROMPTS = true;

/**
 * Logs a Gemini prompt with full context for debugging
 * @param {string} scenario - The scenario name (e.g., "FEEDBACK", "AUDIO", "GAME")
 * @param {string} description - Human-readable description of what this prompt does
 * @param {string|Array} prompt - The actual prompt or content array
 * @param {Object} metadata - Additional metadata about the request
 */
function logPromptDebug(scenario, description, prompt, metadata = {}) {
  if (!DEBUG_PROMPTS) return;

  const separator = '='.repeat(80);
  const timestamp = new Date().toISOString();

  console.log(`\n${separator}`);
  console.log(`🤖 GEMINI PROMPT DEBUG - ${scenario}`);
  console.log(`📅 ${timestamp}`);
  console.log(separator);
  console.log(`📋 SZENARIO: ${description}`);
  console.log(separator);

  // Log metadata
  if (Object.keys(metadata).length > 0) {
    console.log('📊 METADATA:');
    Object.entries(metadata).forEach(([key, value]) => {
      if (typeof value === 'string' && value.length > 200) {
        console.log(`   ${key}: ${value.substring(0, 200)}... (${value.length} chars)`);
      } else {
        console.log(`   ${key}:`, value);
      }
    });
    console.log(separator);
  }

  // Log prompt
  console.log('📝 PROMPT:');
  if (Array.isArray(prompt)) {
    prompt.forEach((part, index) => {
      if (typeof part === 'string') {
        console.log(`--- Teil ${index + 1} (Text) ---`);
        console.log(part);
      } else if (part.inlineData) {
        console.log(`--- Teil ${index + 1} (Audio/Media) ---`);
        console.log(`   Type: ${part.inlineData.mimeType}`);
        console.log(`   Size: ${Math.round(part.inlineData.data.length * 0.75 / 1024)} KB (base64)`);
      } else {
        console.log(`--- Teil ${index + 1} (Other) ---`);
        console.log(JSON.stringify(part, null, 2));
      }
    });
  } else {
    console.log(prompt);
  }

  console.log(separator);
  console.log(`\n`);
}

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
 * @param {object} roleOptions - Optional role configuration for feedback generation
 * @param {string} roleOptions.roleType - 'interview' or 'simulation'
 * @param {string} roleOptions.userRoleLabel - Label for the user role (e.g., 'Bewerber', 'Kundenberater')
 * @param {string} roleOptions.agentRoleLabel - Label for the AI role (e.g., 'Interviewer', 'Kunde')
 * @returns {Promise<string>} - The generated feedback JSON string
 */
export async function generateInterviewFeedback(
  transcript,
  apiKey,
  modelName = 'gemini-1.5-flash',
  customPrompt = null,
  roleOptions = {}
) {
  // Validate transcript
  if (!transcript || transcript.trim().length === 0) {
    console.error('❌ [GEMINI FEEDBACK] Transcript is empty');
    throw new Error(ERROR_MESSAGES.TRANSCRIPT_EMPTY);
  }

  console.log(`📝 [GEMINI FEEDBACK] Transcript length: ${transcript.length} chars`);
  console.log(`📝 [GEMINI FEEDBACK] Custom prompt: ${customPrompt ? 'Yes' : 'No'}`);
  console.log(`📝 [GEMINI FEEDBACK] Role type: ${roleOptions.roleType || 'interview (default)'}`);
  console.log(`📝 [GEMINI FEEDBACK] User role label: ${roleOptions.userRoleLabel || 'Bewerber (default)'}`);

  // Build prompt - pass role options to getFeedbackPrompt
  const prompt = customPrompt
    ? applyCustomPrompt(customPrompt, transcript)
    : getFeedbackPrompt(transcript, roleOptions);

  // Debug logging
  const roleTypeLabel = roleOptions.roleType === 'simulation' ? 'Simulation' : 'Interview';
  const userLabel = roleOptions.userRoleLabel || 'Bewerber';
  logPromptDebug(
    'FEEDBACK',
    `Live-Training (${roleTypeLabel}): Analyse des Gesprächs-Transkripts. Bewertet Kommunikation, Professionalität des/der ${userLabel}.`,
    prompt,
    {
      'Transkript-Länge': `${transcript.length} Zeichen`,
      'Custom Prompt': customPrompt ? 'Ja' : 'Nein (Standard-Prompt)',
      'Rollentyp': roleTypeLabel,
      'User-Rolle': userLabel,
      'Transkript-Vorschau': transcript.substring(0, 300),
    }
  );

  // Call Gemini API
  const response = await callGeminiWithFallback({
    apiKey,
    content: prompt,
    context: 'FEEDBACK',
  });

  // Log prompt and response to server-side prompts.log
  wordpressAPI.logPrompt(
    'GEMINI_LIVE_FEEDBACK',
    `Live-Training Feedback-Generierung (${roleTypeLabel})`,
    prompt,
    {
      transcript_length: transcript.length,
      custom_prompt: customPrompt ? 'Ja' : 'Nein',
      role_type: roleOptions.roleType || 'interview',
      user_role_label: userLabel,
    },
    response // Include response in the log
  );

  return response;
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

  // Debug logging
  logPromptDebug(
    'AUDIO',
    'Audio-Analyse: Paraverbale Kommunikation. Analysiert Füllwörter, Sprechtempo, Tonalität und Selbstsicherheit der Stimme.',
    content,
    {
      'Audio-Dateigröße': `${Math.round(audioFile.size / 1024)} KB`,
      'Audio-Typ': audioFile.type,
      'Analyse-Fokus': 'Nur BEWERBER-Stimme (nicht Interviewer)',
      'Metriken': 'Füllwörter, Pacing (WPM), Tonalität, Confidence Score',
    }
  );

  // Call Gemini API
  const response = await callGeminiWithFallback({
    apiKey,
    content,
    context: 'AUDIO',
  });

  // Log prompt and response to server-side prompts.log
  // Note: We don't log the audio itself (too large), just the prompt text
  wordpressAPI.logPrompt(
    'GEMINI_LIVE_AUDIO_ANALYSIS',
    'Live-Training Audio-Analyse',
    prompt,
    {
      audio_size_kb: Math.round(audioFile.size / 1024),
      audio_type: audioFile.type,
    },
    response // Include response in the log
  );

  return response;
}

/**
 * Analyzes audio for the Rhetorik-Gym game (Füllwort-Killer)
 *
 * OPTIMIZED FOR SPEED - focuses only on:
 * - Filler word counting
 * - Speech pace (WPM)
 * - Basic transcription
 *
 * @param {File|Blob} audioFile - The audio file to analyze
 * @param {string} apiKey - Google Gemini API key
 * @param {string} topic - The topic the user spoke about
 * @param {number} durationSeconds - Expected duration in seconds
 * @returns {Promise<Object>} - Parsed analysis result with score, filler_count, etc.
 */
export async function analyzeRhetoricGame(
  audioFile,
  apiKey,
  topic = 'Elevator Pitch',
  durationSeconds = 60
) {
  // Validate audio file
  if (!audioFile) {
    console.error('❌ [GEMINI GAME] Audio file is missing');
    throw new Error(ERROR_MESSAGES.AUDIO_FILE_MISSING);
  }

  console.log(`🎮 [GEMINI GAME] Starting rhetoric game analysis`);
  console.log(`🎮 [GEMINI GAME] Topic: ${topic}`);
  console.log(`🎮 [GEMINI GAME] File size: ${audioFile.size} bytes`);

  // Convert audio to base64
  const audioPart = await audioFileToBase64(audioFile);

  // Build content array with optimized game prompt and audio
  const prompt = getRhetoricGamePrompt(topic, durationSeconds);
  const content = [prompt, audioPart];

  // Debug logging
  logPromptDebug(
    'GAME',
    'Rhetorik-Gym / Füllwort-Killer: Gamification-Analyse. Zählt Füllwörter, transkribiert Audio, bewertet Inhalt.',
    content,
    {
      'Thema': topic,
      'Erwartete Dauer': `${durationSeconds} Sekunden`,
      'Audio-Dateigröße': `${Math.round(audioFile.size / 1024)} KB`,
      'Spielmodus': durationSeconds === 60 ? 'Klassiker/Zufall (60s)' : 'Stress-Test (90s)',
      'Scoring': 'Lokal berechnet: 100 - (Füllwörter × 10) + Content-Score',
    }
  );

  const responseText = await callGeminiWithFallback({
    apiKey,
    content,
    context: 'GAME',
  });

  // Parse JSON response
  try {
    // Clean up the response - remove markdown code blocks if present
    let cleanedResponse = responseText.trim();
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/```json\n?/, '').replace(/\n?```$/, '');
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/```\n?/, '').replace(/\n?```$/, '');
    }

    const result = JSON.parse(cleanedResponse);

    console.log(`✅ [GEMINI GAME] Analysis complete`);
    console.log(`✅ [GEMINI GAME] Transcript: ${result.transcript?.substring(0, 50)}...`);

    // Return simplified format - scoring is done locally
    return {
      transcript: result.transcript || '[Keine Sprache erkannt]',
      filler_words: result.filler_words || [],
      content_score: Math.max(0, Math.min(40, result.content_score || 0)),
      content_feedback: result.content_feedback || '',
    };
  } catch (parseError) {
    console.error('❌ [GEMINI GAME] Failed to parse response:', parseError);
    console.error('❌ [GEMINI GAME] Raw response:', responseText);

    // Return a default error result
    throw new Error(`${ERROR_MESSAGES.JSON_PARSE_FAILED}: ${parseError.message}`);
  }
}

export default {
  listAvailableModels,
  generateInterviewFeedback,
  generateAudioAnalysis,
  analyzeRhetoricGame,
};
