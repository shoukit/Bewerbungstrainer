import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Lists all available models for the given API key
 * @param {string} apiKey - Google Gemini API key
 * @returns {Promise<Array>} - List of available models
 */
export async function listAvailableModels(apiKey) {
  console.log('📋 [GEMINI] Listing available models...');

  if (!apiKey) {
    console.error('❌ [GEMINI] API key is required to list models');
    throw new Error('Gemini API key is required');
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const models = await genAI.listModels();

    console.log('✅ [GEMINI] Available models:', models);
    console.log('📋 [GEMINI] Model count:', models.length);

    models.forEach((model, index) => {
      console.log(`  ${index + 1}. ${model.name} - ${model.displayName}`);
      console.log(`     Supported methods:`, model.supportedGenerationMethods);
    });

    return models;
  } catch (error) {
    console.error('❌ [GEMINI] Error listing models:', error);
    throw error;
  }
}

/**
 * Generates feedback for a job interview based on the conversation transcript
 * @param {string} transcript - The full conversation transcript
 * @param {string} apiKey - Google Gemini API key
 * @param {string} modelName - Optional model name (defaults to 'gemini-1.5-pro')
 * @returns {Promise<string>} - The generated feedback
 */
export async function generateInterviewFeedback(transcript, apiKey, modelName = 'gemini-1.5-pro') {
  console.log('🤖 [GEMINI] Starting feedback generation...');

  if (!apiKey) {
    console.error('❌ [GEMINI] API key is missing');
    throw new Error('Gemini API key is required');
  }

  // Log API key (partially masked for security)
  const maskedKey = apiKey.substring(0, 8) + '...' + apiKey.substring(apiKey.length - 4);
  console.log(`🔑 [GEMINI] API Key: ${maskedKey}`);
  console.log(`📝 [GEMINI] Transcript length: ${transcript.length} characters`);

  if (!transcript || transcript.trim().length === 0) {
    console.error('❌ [GEMINI] Transcript is empty');
    throw new Error('Transcript is empty');
  }

  // List of model names to try (in order of preference)
  const modelsToTry = [
    modelName,
    'gemini-pro',
    'gemini-1.5-flash',
    'gemini-2.0-flash-exp'
  ];

  console.log(`🎯 [GEMINI] Primary model: ${modelName}`);
  console.log(`🎯 [GEMINI] Fallback models: ${modelsToTry.slice(1).join(', ')}`);

  let lastError = null;

  // Try each model in sequence
  for (const currentModel of modelsToTry) {
    try {
      console.log(`\n🔄 [GEMINI] Attempting with model: ${currentModel}`);

      const genAI = new GoogleGenerativeAI(apiKey);
      console.log('✅ [GEMINI] GoogleGenerativeAI instance created');

      const model = genAI.getGenerativeModel({ model: currentModel });
      console.log('✅ [GEMINI] Model instance created');
      console.log(`📡 [GEMINI] Model config:`, { model: currentModel });

  const prompt = `Du bist ein professioneller Karriere-Coach. Analysiere das folgende Bewerbungsgespräch-Transkript und gib konstruktives Feedback in "Du"-Form.

WICHTIG: Antworte NUR mit einem JSON-Objekt in folgendem Format (keine zusätzlichen Erklärungen):

{
  "summary": "Eine kurze Zusammenfassung des Gesamteindrucks (2-3 Sätze)",
  "strengths": [
    "Stärke 1: Konkrete positive Beobachtung",
    "Stärke 2: Was gut gemacht wurde",
    "Stärke 3: Weitere Stärken"
  ],
  "improvements": [
    "Verbesserung 1: Konkreter Bereich, der verbessert werden kann",
    "Verbesserung 2: Was besser sein könnte",
    "Verbesserung 3: Weitere Verbesserungspotenziale"
  ],
  "tips": [
    "Tipp 1: Konkrete, umsetzbare Empfehlung",
    "Tipp 2: Praktischer Ratschlag",
    "Tipp 3: Weitere hilfreiche Tipps"
  ],
  "rating": {
    "overall": 7,
    "communication": 6,
    "motivation": 7,
    "professionalism": 8
  }
}

Bewertungsskala: 1-10 (1=sehr schwach, 10=exzellent)

Analysiere diese Aspekte:
- Struktur & Klarheit der Antworten
- Inhalt & Beispiele
- Motivation & Begeisterung
- Professionalität & Selbstbewusstsein

Sei konstruktiv, ehrlich und motivierend. Fokussiere auf umsetzbare Verbesserungen.

Transkript:
${transcript}

JSON Feedback:`;

      console.log(`📤 [GEMINI] Sending request to Gemini API...`);
      console.log(`📤 [GEMINI] Prompt length: ${prompt.length} characters`);

      const result = await model.generateContent(prompt);
      console.log('✅ [GEMINI] Request successful, processing response...');
      console.log('📥 [GEMINI] Raw result:', JSON.stringify(result, null, 2));

      const response = await result.response;
      console.log('✅ [GEMINI] Response received');
      console.log('📥 [GEMINI] Response object:', JSON.stringify(response, null, 2));

      const text = response.text();
      console.log(`✅ [GEMINI] Feedback generated successfully (${text.length} characters)`);
      console.log(`📝 [GEMINI] Feedback preview: ${text.substring(0, 100)}...`);
      console.log(`🎉 [GEMINI] Successfully used model: ${currentModel}`);

      return text;

    } catch (error) {
      console.error(`❌ [GEMINI] Error with model ${currentModel}:`, error);
      console.error('❌ [GEMINI] Error type:', error.constructor.name);
      console.error('❌ [GEMINI] Error message:', error.message);

      // Log additional error details if available
      if (error.response) {
        console.error('❌ [GEMINI] Error response:', error.response);
      }
      if (error.status) {
        console.error('❌ [GEMINI] Error status:', error.status);
      }
      if (error.statusText) {
        console.error('❌ [GEMINI] Error status text:', error.statusText);
      }

      lastError = error;

      // If this is a 404 error, try the next model
      if (error.message.includes('404') || error.message.includes('not found')) {
        console.log(`⚠️ [GEMINI] Model ${currentModel} not found, trying next model...`);
        continue;
      }

      // For other errors (API key issues, network errors, etc.), don't try other models
      console.error('❌ [GEMINI] Non-404 error, not trying other models');
      break;
    }
  }

  // If we get here, all models failed
  console.error('❌ [GEMINI] All models failed');

  // Provide helpful error messages based on error type
  let userMessage = lastError ? lastError.message : 'Unknown error';
  if (lastError && (lastError.message.includes('404') || lastError.message.includes('not found'))) {
    userMessage = `Kein Gemini-Modell verfügbar. Versuchte Modelle: ${modelsToTry.join(', ')}

Mögliche Lösungen:
1. Überprüfe, ob dein API Key gültig ist und Zugriff auf Gemini-Modelle hat
2. Stelle sicher, dass die Gemini API in deinem Google Cloud Projekt aktiviert ist
3. Überprüfe, ob du ein kostenloses API-Kontingent hast
4. Besuche https://ai.google.dev/ um deinen API-Key zu überprüfen

Letzter Fehler: ${lastError.message}`;
  } else if (lastError && lastError.message.includes('API key')) {
    userMessage = `API Key Problem: ${lastError.message}

Stelle sicher, dass:
1. VITE_GEMINI_API_KEY korrekt in der .env Datei gesetzt ist
2. Der API Key gültig ist (überprüfe auf https://ai.google.dev/)
3. Der API Key nicht abgelaufen ist`;
  }

  throw new Error(`Fehler bei der Feedback-Generierung: ${userMessage}`);
}
