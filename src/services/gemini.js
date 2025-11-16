import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Generates feedback for a job interview based on the conversation transcript
 * @param {string} transcript - The full conversation transcript
 * @param {string} apiKey - Google Gemini API key
 * @returns {Promise<string>} - The generated feedback
 */
export async function generateInterviewFeedback(transcript, apiKey) {
  if (!apiKey) {
    throw new Error('Gemini API key is required');
  }

  if (!transcript || transcript.trim().length === 0) {
    throw new Error('Transcript is empty');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  const prompt = `Du bist ein professioneller Karriere-Coach. Deine Aufgabe ist es, das folgende Bewerbungsgespräch-Transkript zu analysieren. Der Bewerber (User) übt für eine Ausbildung zum Mechatroniker bei BMW.

Gib dem Bewerber konstruktives Feedback in "Du"-Form.

Analysiere:
1. **Struktur der Antworten:** Waren die Antworten klar und strukturiert?
2. **Inhalt:** Hat der Bewerber gute Beispiele genannt? War die Motivation klar?
3. **Tonfall (abgeleitet):** Wirkte der Bewerber selbstbewusst und professionell?
4. **Verbesserungsvorschläge:** Gib 3-4 konkrete, umsetzbare Tipps.

Formatiere dein Feedback in klar gegliederte Abschnitte. Sei konstruktiv, motivierend und ehrlich.

Transkript:
${transcript}

Dein Feedback:`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return text;
  } catch (error) {
    console.error('Error generating feedback:', error);
    throw new Error(`Fehler bei der Feedback-Generierung: ${error.message}`);
  }
}
