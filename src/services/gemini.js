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
import { maskApiKey } from '@/utils/security';
import { audioFileToInlineData, validateAudioBlob } from '@/utils/audio';
import wordpressAPI from './wordpress-api.js';
import {
  MIN_AUDIO_SIZE_BYTES,
  NO_SPEECH_DETECTED,
  getEmptyTranscriptResult,
} from '@/config/prompts/transcriptionCore';

// =============================================================================
// DEBUG LOGGING
// =============================================================================

/**
 * Enable/disable detailed prompt logging
 * Set to true for development debugging only
 */
const DEBUG_PROMPTS = false;

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

  if (DEBUG_PROMPTS) {
    console.log(`🚀 ${logPrefix} Starting request...`);
    console.log(`🔑 ${logPrefix} API Key: ${maskApiKey(apiKey)}`);
  }

  let lastError = null;

  // Try each model in sequence
  for (const currentModel of GEMINI_MODELS.FALLBACK_ORDER) {
    try {
      if (DEBUG_PROMPTS) console.log(`🔄 ${logPrefix} Trying model: ${currentModel}`);

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: currentModel });

      const result = await model.generateContent(content);
      const response = await result.response;
      const text = response.text();

      if (DEBUG_PROMPTS) console.log(`✅ ${logPrefix} Success with ${currentModel} (${text.length} chars)`);
      return text;

    } catch (error) {
      console.error(`❌ ${logPrefix} Error with ${currentModel}:`, error.message);
      lastError = error;

      // Only try next model for 404 errors
      if (isModelNotFoundError(error)) {
        if (DEBUG_PROMPTS) console.log(`⚠️ ${logPrefix} Model not found, trying next...`);
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

  if (DEBUG_PROMPTS) console.log(`📋 [GEMINI] Found ${models.length} models`);
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

  if (DEBUG_PROMPTS) {
    console.log(`📝 [GEMINI FEEDBACK] Transcript length: ${transcript.length} chars`);
    console.log(`📝 [GEMINI FEEDBACK] Custom prompt: ${customPrompt ? 'Yes' : 'No'}`);
    console.log(`📝 [GEMINI FEEDBACK] Role type: ${roleOptions.roleType || 'interview (default)'}`);
    console.log(`📝 [GEMINI FEEDBACK] User role label: ${roleOptions.userRoleLabel || 'Bewerber (default)'}`);
  }

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
 * Performs professional voice coaching analysis including:
 * - Filler word detection with timestamps
 * - Speaking pace (WPM)
 * - Tonality and emotional tone
 * - Overall confidence assessment
 *
 * @param {File|Blob} audioFile - The audio file to analyze
 * @param {string} apiKey - Google Gemini API key
 * @param {string} modelName - Optional model name (unused, kept for API compatibility)
 * @param {object} roleOptions - Optional role configuration for audio analysis
 * @param {string} roleOptions.roleType - 'interview' or 'simulation'
 * @param {string} roleOptions.userRoleLabel - Label for the user role (e.g., 'Bewerber', 'Kundenberater')
 * @param {string} roleOptions.agentRoleLabel - Label for the AI role (e.g., 'Interviewer', 'Kunde')
 * @param {boolean} roleOptions.hasTwoVoices - Whether audio contains AI + user (default: true)
 * @param {string} roleOptions.transcript - Optional transcript for improved speaker identification
 * @returns {Promise<string>} - The generated audio analysis JSON string
 */
export async function generateAudioAnalysis(
  audioFile,
  apiKey,
  modelName = 'gemini-1.5-flash',
  roleOptions = {}
) {
  // Validate audio file exists
  if (!audioFile) {
    console.error('❌ [GEMINI AUDIO] Audio file is missing');
    throw new Error(ERROR_MESSAGES.AUDIO_FILE_MISSING);
  }

  // Validate audio file has meaningful content (prevents hallucination on empty/silent audio)
  const validation = validateAudioBlob(audioFile, { minSize: MIN_AUDIO_SIZE_BYTES });
  if (!validation.valid) {
    console.warn(`⚠️ [GEMINI AUDIO] Audio validation failed: ${validation.error}, Size: ${audioFile.size} bytes`);
    // Return centralized empty analysis result instead of sending to AI
    return JSON.stringify(getEmptyTranscriptResult('analysis'));
  }

  const userRoleLabel = roleOptions.userRoleLabel || 'Bewerber';
  const agentRoleLabel = roleOptions.agentRoleLabel || 'Gesprächspartner';
  const roleType = roleOptions.roleType || 'interview';
  const hasTwoVoices = roleOptions.hasTwoVoices !== false; // Default true for backwards compat
  const transcript = roleOptions.transcript || null;

  if (DEBUG_PROMPTS) {
    console.log(`🎵 [GEMINI AUDIO] File size: ${audioFile.size} bytes`);
    console.log(`🎵 [GEMINI AUDIO] File type: ${audioFile.type}`);
    console.log(`🎵 [GEMINI AUDIO] Role type: ${roleType}`);
    console.log(`🎵 [GEMINI AUDIO] User role: ${userRoleLabel}`);
    console.log(`🎵 [GEMINI AUDIO] Two voices: ${hasTwoVoices}`);
    console.log(`🎵 [GEMINI AUDIO] Has transcript: ${!!transcript}`);
  }

  // Convert audio to base64
  if (DEBUG_PROMPTS) console.log('🔄 [GEMINI AUDIO] Converting audio to base64...');
  const audioPart = await audioFileToInlineData(audioFile);
  if (DEBUG_PROMPTS) console.log('✅ [GEMINI AUDIO] Audio converted');

  // Build content array with prompt and audio
  const prompt = getAudioAnalysisPrompt({
    userRoleLabel,
    agentRoleLabel,
    roleType,
    hasTwoVoices,
    transcript,
  });
  const content = [prompt, audioPart];

  // Debug logging
  logPromptDebug(
    'AUDIO',
    `Audio-Analyse: Paraverbale Kommunikation. Analysiert Füllwörter, Sprechtempo, Tonalität und Selbstsicherheit des/der ${userRoleLabel}.`,
    content,
    {
      'Audio-Dateigröße': `${Math.round(audioFile.size / 1024)} KB`,
      'Audio-Typ': audioFile.type,
      'Analyse-Fokus': `Nur ${userRoleLabel}-Stimme (nicht ${agentRoleLabel})`,
      'Rollentyp': roleType,
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
    `Live-Training Audio-Analyse (${userRoleLabel})`,
    prompt,
    {
      audio_size_kb: Math.round(audioFile.size / 1024),
      audio_type: audioFile.type,
      role_type: roleType,
      user_role_label: userRoleLabel,
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
  // Validate audio file exists
  if (!audioFile) {
    console.error('❌ [GEMINI GAME] Audio file is missing');
    throw new Error(ERROR_MESSAGES.AUDIO_FILE_MISSING);
  }

  // Validate audio file has meaningful content (prevents hallucination on empty/silent audio)
  const validation = validateAudioBlob(audioFile, { minSize: MIN_AUDIO_SIZE_BYTES });
  if (!validation.valid) {
    console.warn(`⚠️ [GEMINI GAME] Audio validation failed: ${validation.error}, Size: ${audioFile.size} bytes`);
    // Return centralized empty result instead of sending to AI
    return getEmptyTranscriptResult('game');
  }

  if (DEBUG_PROMPTS) {
    console.log(`🎮 [GEMINI GAME] Starting rhetoric game analysis`);
    console.log(`🎮 [GEMINI GAME] Topic: ${topic}`);
    console.log(`🎮 [GEMINI GAME] File size: ${audioFile.size} bytes`);
  }

  // Convert audio to base64
  const audioPart = await audioFileToInlineData(audioFile);

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

    if (DEBUG_PROMPTS) {
      console.log(`✅ [GEMINI GAME] Analysis complete`);
      console.log(`✅ [GEMINI GAME] Transcript: ${result.transcript?.substring(0, 50)}...`);
    }

    // Return simplified format - scoring is done locally
    return {
      transcript: result.transcript || NO_SPEECH_DETECTED,
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

/**
 * Analyzes a decision using the "Decisio" AI coach approach
 *
 * Provides structured coaching insights:
 * - Blind Spot: Missing life areas or considerations
 * - Challenger: Questions the highest-weighted argument
 * - Intuition: Systemic question to check gut feeling
 *
 * @param {Object} decisionData - The decision data to analyze
 * @param {string} decisionData.topic - The decision question
 * @param {Array} decisionData.pros - Array of {text, weight} objects for pro arguments
 * @param {Array} decisionData.cons - Array of {text, weight} objects for contra arguments
 * @param {number} decisionData.proScore - Total pro score
 * @param {number} decisionData.contraScore - Total contra score
 * @param {string} apiKey - Google Gemini API key
 * @returns {Promise<Object>} - Parsed analysis result with summary and coaching cards
 */
export async function analyzeDecision(decisionData, apiKey) {
  const { topic, pros, cons, proScore, contraScore } = decisionData;

  // Validate input
  if (!topic || topic.trim().length === 0) {
    throw new Error('Entscheidungsfrage fehlt');
  }

  if (DEBUG_PROMPTS) {
    console.log(`🧠 [GEMINI DECISION] Starting decision analysis`);
    console.log(`🧠 [GEMINI DECISION] Topic: ${topic}`);
    console.log(`🧠 [GEMINI DECISION] Pros: ${pros.length}, Cons: ${cons.length}`);
  }

  // Format pros and cons for the prompt
  const prosFormatted = pros.map(p => `- "${p.text}" (Gewicht: ${p.weight}/10)`).join('\n');
  const consFormatted = cons.map(c => `- "${c.text}" (Gewicht: ${c.weight}/10)`).join('\n');

  // Build the system prompt as specified
  const prompt = `Du bist 'Decisio', ein analytischer Entscheidungs-Coach.
Deine Aufgabe: Analysiere die Entscheidungsmatrix des Users (Thema, Pro/Contra mit Gewichtung 1-10).
Ziel: Deck blinde Flecken auf und hinterfrage die Gewichtung kritisch. Nimm dem User die Entscheidung NICHT ab, sondern verbessere seine Datengrundlage.

INPUT:
Thema: ${topic}
Pro-Liste (Gesamtpunkte: ${proScore}):
${prosFormatted || '(keine Pro-Argumente)'}

Contra-Liste (Gesamtpunkte: ${contraScore}):
${consFormatted || '(keine Contra-Argumente)'}

Rationaler Score: ${proScore > contraScore ? 'Pro führt' : contraScore > proScore ? 'Contra führt' : 'Ausgeglichen'} (${proScore} vs ${contraScore})

GENERATION RULES:
1. "Blind Spot": Welcher Lebensbereich (Gesundheit, Langzeit, Familie, Werte, Finanzen, Karriere, Work-Life-Balance) fehlt? Welche Perspektive wurde nicht berücksichtigt?
2. "Challenger": Greife das Argument mit der HÖCHSTEN Gewichtung an. Ist es wirklich eine ${Math.max(...pros.map(p => p.weight), ...cons.map(c => c.weight))}/10? Warum könnte diese Bewertung übertrieben oder unterschätzt sein?
3. "Intuition": Stelle eine systemische Frage (z.B. 10-10-10 Methode: Wie wirst du in 10 Minuten/10 Monaten/10 Jahren darüber denken? Oder: Was würdest du einem Freund in dieser Situation raten?), um das Bauchgefühl zu prüfen.

WICHTIG: Antworte AUSSCHLIESSLICH mit einem validen JSON-Objekt. Kein Markdown, kein Intro, keine Erklärung außerhalb des JSON.

FORMATIERUNG DER INHALTE:
- Jede Card soll STRUKTURIERT sein, NICHT als Fließtext
- Verwende kurze, prägnante Aufzählungspunkte
- Maximal 3-5 Punkte pro Card
- Jeder Punkt soll ein konkreter, handlungsorientierter Gedanke sein

JSON SCHEMA:
{
  "analysis_summary": "Ein bis zwei Sätze zum rationalen Ergebnis.",
  "cards": [
    {
      "type": "blind_spot",
      "title": "Der blinde Fleck",
      "points": [
        "Erster fehlender Aspekt oder Lebensbereich",
        "Zweiter fehlender Aspekt",
        "Dritter fehlender Aspekt (optional)"
      ]
    },
    {
      "type": "challenger",
      "title": "Der Härtetest",
      "argument": "Das hinterfragte Argument (z.B. 'Mehr Geld')",
      "points": [
        "Erste kritische Frage zum Argument",
        "Zweite kritische Frage",
        "Dritte kritische Frage (optional)"
      ]
    },
    {
      "type": "intuition",
      "title": "Der Bauch-Check",
      "question": "Die zentrale Reflexionsfrage (z.B. '10-10-10 Methode')",
      "points": [
        "Erster Reflexionsimpuls",
        "Zweiter Reflexionsimpuls",
        "Dritter Reflexionsimpuls (optional)"
      ]
    }
  ]
}`;

  // Debug logging
  logPromptDebug(
    'DECISION',
    'Entscheidungs-Kompass: Analysiert Pro/Contra-Matrix mit Gewichtungen. Identifiziert blinde Flecken und hinterfragt Annahmen.',
    prompt,
    {
      'Thema': topic,
      'Pro-Argumente': pros.length,
      'Contra-Argumente': cons.length,
      'Pro-Score': proScore,
      'Contra-Score': contraScore,
      'Stärkstes Argument': Math.max(...pros.map(p => p.weight), ...cons.map(c => c.weight)),
    }
  );

  const responseText = await callGeminiWithFallback({
    apiKey,
    content: prompt,
    context: 'DECISION',
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

    if (DEBUG_PROMPTS) {
      console.log(`✅ [GEMINI DECISION] Analysis complete`);
      console.log(`✅ [GEMINI DECISION] Summary: ${result.analysis_summary?.substring(0, 50)}...`);
    }

    // Validate structure
    if (!result.cards || !Array.isArray(result.cards)) {
      throw new Error('Invalid response structure: missing cards array');
    }

    return result;
  } catch (parseError) {
    console.error('❌ [GEMINI DECISION] Failed to parse response:', parseError);
    console.error('❌ [GEMINI DECISION] Raw response:', responseText);

    // Return a default error result
    throw new Error(`Fehler beim Verarbeiten der Analyse: ${parseError.message}`);
  }
}

/**
 * Brainstorms arguments from a specific persona's perspective
 *
 * Generates 2 pro and 2 contra arguments from the viewpoint of one of 5 personas:
 * - strategist: Career, money, power, prestige
 * - security: Job security, risk minimization, stability
 * - feelgood: Work-life balance, culture, mental health
 * - growth: Learning, innovation, high risk/high reward
 * - future: Long-term perspective, regret minimization
 *
 * @param {string} topic - The decision question
 * @param {string} persona - One of: 'strategist', 'security', 'feelgood', 'growth', 'future'
 * @param {string} apiKey - Google Gemini API key
 * @returns {Promise<Object>} - Parsed result with suggestions array
 */
export async function brainstormArguments(topic, persona, apiKey) {
  // Validate input
  if (!topic || topic.trim().length === 0) {
    throw new Error('Entscheidungsfrage fehlt');
  }

  const validPersonas = ['strategist', 'security', 'feelgood', 'growth', 'future'];
  if (!validPersonas.includes(persona)) {
    throw new Error(`Ungültige Persona: ${persona}`);
  }

  if (DEBUG_PROMPTS) {
    console.log(`💭 [GEMINI BRAINSTORM] Starting brainstorm`);
    console.log(`💭 [GEMINI BRAINSTORM] Topic: ${topic}`);
    console.log(`💭 [GEMINI BRAINSTORM] Persona: ${persona}`);
  }

  const prompt = `Du bist ein kreativer Entscheidungs-Assistent für die Karriere-Plattform 'KarriereHeld'.
Deine Aufgabe: Generiere für eine spezifische Entscheidungsfrage Argumente aus der strikten Sicht einer gewählten Persona.

INPUT:
Thema: ${topic}
Persona: ${persona}

PERSONA DEFINITIONEN:
- 'strategist' (Der Stratege): Fokus auf CV, Marktwert, Geld, Macht, Karriereleiter, Prestige.
- 'security' (Der Sicherheits-Beauftragte): Fokus auf Arbeitsplatzsicherheit, Gehaltsgarantie, Risikominimierung, Beständigkeit.
- 'feelgood' (Der Feel-Good Manager): Fokus auf Mental Health, Stresslevel, Team-Kultur, Zeit für Familie, Spaß.
- 'growth' (Der Gründer): Fokus auf steile Lernkurve, Innovation, Netzwerk, "High Risk / High Reward".
- 'future' (Das Zukunfts-Ich): Fokus auf langfristigen Sinn, "Regret Minimization" (Was werde ich in 10 Jahren bereuen?), Lebensziele.

OUTPUT FORMAT (JSON):
Generiere genau 4 Vorschläge (2 Pro, 2 Contra), die extrem kurz und knackig sind (max. 10 Wörter pro Punkt).

WICHTIG: Antworte AUSSCHLIESSLICH mit einem validen JSON-Objekt. Kein Markdown, kein Intro.

{
  "suggestions": [
    { "type": "pro", "text": "Argument für JA aus Sicht der Persona" },
    { "type": "pro", "text": "Weiteres Argument für JA..." },
    { "type": "con", "text": "Argument für NEIN aus Sicht der Persona" },
    { "type": "con", "text": "Weiteres Argument für NEIN..." }
  ]
}`;

  // Debug logging
  logPromptDebug(
    'BRAINSTORM',
    `Entscheidungs-Kompass Brainstorming: Generiert Argumente aus Sicht der Persona "${persona}".`,
    prompt,
    {
      'Thema': topic,
      'Persona': persona,
    }
  );

  const responseText = await callGeminiWithFallback({
    apiKey,
    content: prompt,
    context: 'BRAINSTORM',
  });

  // Parse JSON response
  try {
    let cleanedResponse = responseText.trim();
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/```json\n?/, '').replace(/\n?```$/, '');
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/```\n?/, '').replace(/\n?```$/, '');
    }

    const result = JSON.parse(cleanedResponse);

    if (DEBUG_PROMPTS) {
      console.log(`✅ [GEMINI BRAINSTORM] Complete`);
      console.log(`✅ [GEMINI BRAINSTORM] Suggestions: ${result.suggestions?.length}`);
    }

    // Validate structure
    if (!result.suggestions || !Array.isArray(result.suggestions)) {
      throw new Error('Invalid response structure: missing suggestions array');
    }

    return result;
  } catch (parseError) {
    console.error('❌ [GEMINI BRAINSTORM] Failed to parse response:', parseError);
    console.error('❌ [GEMINI BRAINSTORM] Raw response:', responseText);
    throw new Error(`Fehler beim Verarbeiten der Vorschläge: ${parseError.message}`);
  }
}

export default {
  listAvailableModels,
  generateInterviewFeedback,
  generateAudioAnalysis,
  analyzeRhetoricGame,
  analyzeDecision,
  brainstormArguments,
};
