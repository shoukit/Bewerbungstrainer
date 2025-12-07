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
 * @param {string} modelName - Optional model name (defaults to 'gemini-1.5-flash')
 * @returns {Promise<string>} - The generated feedback
 */
export async function generateInterviewFeedback(transcript, apiKey, modelName = 'gemini-1.5-flash', customPrompt = null) {
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
    'gemini-2.0-flash-exp',
    'gemini-2.0-flash',
    'gemini-1.5-flash-latest',
    'gemini-1.5-pro-latest',
  ];

  console.log(`🎯 [GEMINI] Primary model: ${modelName}`);
  console.log(`🎯 [GEMINI] Fallback models: ${modelsToTry.slice(1).join(', ')}`);
  console.log(`📝 [GEMINI] Custom prompt: ${customPrompt ? 'Yes' : 'No (using default)'}`);

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

  // Use custom prompt if provided, otherwise use default prompt
  const prompt = customPrompt ? customPrompt.replace('${transcript}', transcript) : `Du bist ein professioneller Karriere-Coach. Analysiere das folgende Bewerbungsgespräch-Transkript und gib konstruktives Feedback in "Du"-Form.

SEHR WICHTIG: Bewerte AUSSCHLIESSLICH den BEWERBER/die BEWERBERIN!
- Die Aussagen des Interviewers (z.B. "H. Müller", "Interviewer", oder ähnliche Kennzeichnungen) dienen NUR als Kontext für die Fragen.
- Dein gesamtes Feedback, alle Stärken, Verbesserungen, Tipps und Bewertungen beziehen sich NUR auf die Antworten und das Verhalten des Bewerbers.
- Bewerte NICHT die Qualität der Fragen oder das Verhalten des Interviewers.

WICHTIG: Antworte NUR mit einem JSON-Objekt in folgendem Format (keine zusätzlichen Erklärungen):

{
  "summary": "Eine kurze Zusammenfassung des Gesamteindrucks des BEWERBERS (2-3 Sätze)",
  "strengths": [
    "Stärke 1: Konkrete positive Beobachtung beim Bewerber",
    "Stärke 2: Was der Bewerber gut gemacht hat",
    "Stärke 3: Weitere Stärken des Bewerbers"
  ],
  "improvements": [
    "Verbesserung 1: Konkreter Bereich, den der Bewerber verbessern kann",
    "Verbesserung 2: Was der Bewerber besser machen könnte",
    "Verbesserung 3: Weitere Verbesserungspotenziale für den Bewerber"
  ],
  "tips": [
    "Tipp 1: Konkrete, umsetzbare Empfehlung für den Bewerber",
    "Tipp 2: Praktischer Ratschlag für den Bewerber",
    "Tipp 3: Weitere hilfreiche Tipps für den Bewerber"
  ],
  "rating": {
    "overall": 7,
    "communication": 6,
    "motivation": 7,
    "professionalism": 8
  }
}

Bewertungsskala: 1-10 (1=sehr schwach, 10=exzellent)

Analysiere diese Aspekte der BEWERBER-Antworten:
- Struktur & Klarheit der Antworten des Bewerbers
- Inhalt & Beispiele, die der Bewerber nennt
- Motivation & Begeisterung des Bewerbers
- Professionalität & Selbstbewusstsein des Bewerbers

Sei konstruktiv, ehrlich und motivierend. Fokussiere auf umsetzbare Verbesserungen für den Bewerber.

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

/**
 * Converts an audio file to base64 for Gemini API
 * @param {File|Blob} audioFile - The audio file to convert
 * @returns {Promise<Object>} - Object with base64 data and mime type
 */
async function audioFileToBase64(audioFile) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result.split(',')[1]; // Remove data URL prefix
      resolve({
        inlineData: {
          data: base64,
          mimeType: audioFile.type || 'audio/webm'
        }
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(audioFile);
  });
}

/**
 * Analyzes audio of an interview to evaluate ONLY paraverbal communication (speech quality, filler words, pacing, tonality).
 * IMPORTANT: This function sends ONLY the audio file, NO transcript. This ensures filler words like "Ähm" are detected
 * that might be filtered out by transcription services.
 *
 * @param {File|Blob} audioFile - The audio file to analyze
 * @param {string} apiKey - Google Gemini API key
 * @param {string} modelName - Optional model name (defaults to 'gemini-1.5-flash')
 * @returns {Promise<string>} - The generated audio analysis feedback (pure paraverbal analysis)
 */
export async function generateAudioAnalysis(audioFile, apiKey, modelName = 'gemini-1.5-flash') {
  console.log('🎙️ [GEMINI AUDIO] Starting PURE AUDIO analysis (no transcript)...');

  if (!apiKey) {
    console.error('❌ [GEMINI AUDIO] API key is missing');
    throw new Error('Gemini API key is required');
  }

  if (!audioFile) {
    console.error('❌ [GEMINI AUDIO] Audio file is missing');
    throw new Error('Audio file is required');
  }

  // Log API key (partially masked for security)
  const maskedKey = apiKey.substring(0, 8) + '...' + apiKey.substring(apiKey.length - 4);
  console.log(`🔑 [GEMINI AUDIO] API Key: ${maskedKey}`);
  console.log(`🎵 [GEMINI AUDIO] Audio file size: ${audioFile.size} bytes`);
  console.log(`🎵 [GEMINI AUDIO] Audio file type: ${audioFile.type}`);

  // List of model names to try (in order of preference)
  // Note: Audio analysis requires multimodal models
  const modelsToTry = [
    'gemini-2.0-flash-exp',
    'gemini-2.0-flash',
    'gemini-1.5-flash-latest',
    'gemini-1.5-pro-latest',
  ];

  console.log(`🎯 [GEMINI AUDIO] Primary model: ${modelName}`);
  console.log(`🎯 [GEMINI AUDIO] Fallback models: ${modelsToTry.slice(1).join(', ')}`);

  let lastError = null;

  // Convert audio to base64
  console.log('🔄 [GEMINI AUDIO] Converting audio to base64...');
  const audioPart = await audioFileToBase64(audioFile);
  console.log('✅ [GEMINI AUDIO] Audio converted successfully');

  // Try each model in sequence
  for (const currentModel of modelsToTry) {
    try {
      console.log(`\n🔄 [GEMINI AUDIO] Attempting with model: ${currentModel}`);

      const genAI = new GoogleGenerativeAI(apiKey);
      console.log('✅ [GEMINI AUDIO] GoogleGenerativeAI instance created');

      const model = genAI.getGenerativeModel({ model: currentModel });
      console.log('✅ [GEMINI AUDIO] Model instance created');

      // PROMPT: Pure audio/paraverbal analysis - ONLY analyze the APPLICANT's voice
      const prompt = `Du bist der Voice-Coach von "KarriereHeld".
Analysiere die Audio-Datei dieses Rollenspiels.

WICHTIG - QUELLEN-TRENNUNG:
Die Aufnahme enthält ZWEI Stimmen:
1. Den INTERVIEWER (KI-Stimme, akzentfrei, stellt Fragen). Die KI-Stimme ERÖFFNET das Gespräch.
2. Den BEWERBER (Mensch, antwortet auf die Fragen des Interviewers).

DEINE AUFGABE:
Höre dir das gesamte Audio an, aber bewerte AUSSCHLIESSLICH die Stimme des BEWERBERS (2).
Ignoriere alles, was der Interviewer sagt (Pausen, Tempo, Inhalt).

ANALYSE-DIMENSIONEN (NUR BEWERBER):

1. SPEECH CLEANLINESS (Füllwörter)
- Zähle "Ähm", "Öh", "Halt", "Eigentlich", "Sozusagen" beim Bewerber.
- Gib GENAUE Zeitstempel an (Format MM:SS).

2. PACING (Tempo)
- Wie wirkt das Sprechtempo in den Antwort-Phasen? (Gehetzt vs. Souverän).
- Notiere auffällige Stellen mit Zeitstempel.

3. TONALITY (Betonung & Melodie)
- Ist die Stimme monoton, natürlich oder lebendig?
- Suche nach Highlights (souverän) oder Lowlights (unsicher/brüchig).

4. CONFIDENCE (Wirkung)
- Confidence Score (0-100): Wie sicher klingt der Bewerber insgesamt?

OUTPUT FORMAT:
Antworte NUR mit einem validen JSON-Objekt. Keine Markdown-Formatierung, kein Einleitungstext.

{
  "audio_metrics": {
    "summary_text": "Kurzes Fazit zur Stimme des Bewerbers (max 2 Sätze).",
    "confidence_score": (0-100),

    "speech_cleanliness": {
      "score": (0-100, 100=Perfekt sauber),
      "filler_word_analysis": [
        {
          "word": "Ähm",
          "count": (Anzahl),
          "examples": [
            {"timestamp": "00:45", "context": "Satzanfang"},
            {"timestamp": "01:20", "context": "Nachdenken"}
          ]
        },
        {
          "word": "Halt/Eigentlich",
          "count": (Anzahl),
          "examples": [
            {"timestamp": "00:32"}
          ]
        }
      ],
      "feedback": "Tipp zur Vermeidung von Füllwörtern."
    },

    "pacing": {
      "rating": "zu_schnell" | "optimal" | "zu_langsam",
      "perceived_wpm": "string (z.B. '~140 WPM')",
      "issues_detected": [
        {"timestamp": "02:10", "issue": "Sehr schnell, wirkt gehetzt"}
      ],
      "feedback": "Feedback zur Geschwindigkeit."
    },

    "tonality": {
      "rating": "monoton" | "natürlich" | "lebendig",
      "highlights": [
        {"timestamp": "00:05", "type": "positive", "note": "Souveräner Einstieg"},
        {"timestamp": "03:20", "type": "negative", "note": "Stimme wird unsicher"}
      ],
      "feedback": "Feedback zur Melodie und Betonung."
    }
  }
}

JSON Analyse:`;

      console.log(`📤 [GEMINI AUDIO] Sending request to Gemini API...`);
      console.log(`📤 [GEMINI AUDIO] Prompt length: ${prompt.length} characters`);

      const result = await model.generateContent([prompt, audioPart]);
      console.log('✅ [GEMINI AUDIO] Request successful, processing response...');

      const response = await result.response;
      console.log('✅ [GEMINI AUDIO] Response received');

      const text = response.text();
      console.log(`✅ [GEMINI AUDIO] Audio analysis generated successfully (${text.length} characters)`);
      console.log(`📝 [GEMINI AUDIO] Analysis preview: ${text.substring(0, 100)}...`);
      console.log(`🎉 [GEMINI AUDIO] Successfully used model: ${currentModel}`);

      return text;

    } catch (error) {
      console.error(`❌ [GEMINI AUDIO] Error with model ${currentModel}:`, error);
      console.error('❌ [GEMINI AUDIO] Error type:', error.constructor.name);
      console.error('❌ [GEMINI AUDIO] Error message:', error.message);

      // Log additional error details if available
      if (error.response) {
        console.error('❌ [GEMINI AUDIO] Error response:', error.response);
      }
      if (error.status) {
        console.error('❌ [GEMINI AUDIO] Error status:', error.status);
      }
      if (error.statusText) {
        console.error('❌ [GEMINI AUDIO] Error status text:', error.statusText);
      }

      lastError = error;

      // If this is a 404 error, try the next model
      if (error.message.includes('404') || error.message.includes('not found')) {
        console.log(`⚠️ [GEMINI AUDIO] Model ${currentModel} not found, trying next model...`);
        continue;
      }

      // For other errors (API key issues, network errors, etc.), don't try other models
      console.error('❌ [GEMINI AUDIO] Non-404 error, not trying other models');
      break;
    }
  }

  // If we get here, all models failed
  console.error('❌ [GEMINI AUDIO] All models failed');

  // Provide helpful error messages based on error type
  let userMessage = lastError ? lastError.message : 'Unknown error';
  if (lastError && (lastError.message.includes('404') || lastError.message.includes('not found'))) {
    userMessage = `Kein Gemini-Modell mit Audio-Unterstützung verfügbar. Versuchte Modelle: ${modelsToTry.join(', ')}

Mögliche Lösungen:
1. Überprüfe, ob dein API Key gültig ist und Zugriff auf multimodale Gemini-Modelle hat
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

  throw new Error(`Fehler bei der Audio-Analyse: ${userMessage}`);
}
