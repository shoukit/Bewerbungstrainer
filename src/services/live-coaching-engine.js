/**
 * Live Coaching Engine Service
 *
 * Provides real-time coaching tips during live simulation sessions.
 * Uses Gemini AI to analyze agent messages and generate strategic coaching impulses.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_MODELS } from '@/config/constants';
import { getLiveCoachingPrompt } from '@/config/prompts/liveCoachingPrompt';

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * Use fastest model for real-time coaching (lower latency)
 */
const COACHING_MODEL = 'gemini-2.0-flash-exp';

/**
 * Fallback models if primary is unavailable
 */
const COACHING_FALLBACK_MODELS = [
  'gemini-2.0-flash-exp',
  'gemini-2.0-flash',
  'gemini-1.5-flash-latest',
];

/**
 * Default coaching response when generation fails
 */
const DEFAULT_COACHING = {
  content_impulses: [],
  behavioral_cue: '',
  strategic_bridge: '',
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Parse JSON response from Gemini, handling markdown code blocks
 * @param {string} responseText - Raw response from Gemini
 * @returns {Object} - Parsed coaching object
 */
function parseCoachingResponse(responseText) {
  let cleaned = responseText.trim();

  // Remove markdown code blocks if present
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/```json\n?/, '').replace(/\n?```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/```\n?/, '').replace(/\n?```$/, '');
  }

  try {
    const parsed = JSON.parse(cleaned);

    // Validate structure
    return {
      content_impulses: Array.isArray(parsed.content_impulses)
        ? parsed.content_impulses.slice(0, 3) // Max 3 impulses
        : [],
      behavioral_cue: typeof parsed.behavioral_cue === 'string'
        ? parsed.behavioral_cue
        : '',
      strategic_bridge: typeof parsed.strategic_bridge === 'string'
        ? parsed.strategic_bridge
        : '',
    };
  } catch (parseError) {
    console.error('[COACHING] Failed to parse response:', parseError);
    console.error('[COACHING] Raw response:', responseText);
    return DEFAULT_COACHING;
  }
}

/**
 * Check if error is a model-not-found error
 * @param {Error} error - The error to check
 * @returns {boolean}
 */
function isModelNotFoundError(error) {
  return error.message?.includes('404') || error.message?.includes('not found');
}

// =============================================================================
// MAIN COACHING FUNCTION
// =============================================================================

/**
 * Generate real-time coaching tips based on the agent's next message
 *
 * @param {Object} options - Configuration options
 * @param {string} options.apiKey - Gemini API key
 * @param {string} options.nextAgentInput - The text the agent will say next
 * @param {Array} options.transcriptHistory - Recent transcript [{role, text}]
 * @param {Object} options.scenarioContext - Scenario configuration
 * @returns {Promise<Object>} - Coaching tips object
 */
export async function generateLiveCoaching({
  apiKey,
  nextAgentInput,
  transcriptHistory = [],
  scenarioContext = {},
}) {
  const logPrefix = '[COACHING]';

  // Validate inputs
  if (!apiKey) {
    console.error(`${logPrefix} API key is missing`);
    return DEFAULT_COACHING;
  }

  if (!nextAgentInput || nextAgentInput.trim().length === 0) {
    return DEFAULT_COACHING;
  }

  // Build prompt with all scenario context
  const prompt = getLiveCoachingPrompt({
    scenarioTitle: scenarioContext.scenarioTitle || '',
    scenarioDescription: scenarioContext.scenarioDescription || '',
    userRole: scenarioContext.userRole || 'Bewerber',
    agentRole: scenarioContext.agentRole || 'Interviewer',
    agentName: scenarioContext.agentName || '',
    agentProperties: scenarioContext.agentProperties || '',
    agentPainPoints: scenarioContext.agentPainPoints || '',
    agentQuestions: scenarioContext.agentQuestions || '',
    transcriptHistory,
    nextAgentInput,
  });


  // Try each model until one works
  for (const modelName of COACHING_FALLBACK_MODELS) {
    try {

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: modelName });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();


      const coaching = parseCoachingResponse(text);

      // Log result for debugging

      return coaching;

    } catch (error) {
      console.error(`${logPrefix} Error with ${modelName}:`, error.message);

      if (isModelNotFoundError(error)) {
        continue;
      }

      // For other errors, stop trying
      break;
    }
  }

  console.error(`${logPrefix} All models failed, returning default coaching`);
  return DEFAULT_COACHING;
}

/**
 * Check if coaching should be generated for a message
 * Only generate coaching for agent messages that are substantial
 *
 * @param {Object} message - Transcript message
 * @param {string} message.role - 'agent' or 'user'
 * @param {string} message.text - Message text
 * @returns {boolean}
 */
export function shouldGenerateCoaching(message) {
  // Only for agent messages
  if (message.role !== 'agent') {
    return false;
  }

  // Skip very short messages (greetings, acknowledgments)
  if (message.text.length < 20) {
    return false;
  }

  // Skip common filler phrases
  const skipPhrases = [
    'mhm',
    'ja',
    'okay',
    'verstehe',
    'interessant',
    'gut',
  ];

  const lowerText = message.text.toLowerCase().trim();
  if (skipPhrases.some(phrase => lowerText === phrase)) {
    return false;
  }

  return true;
}

/**
 * Extract scenario context from a scenario object
 * Maps scenario data structure to coaching context format
 *
 * @param {Object} scenario - Full scenario object
 * @returns {Object} - Coaching context object
 */
export function extractCoachingContext(scenario) {
  const profile = scenario?.interviewer_profile || {};

  return {
    // Scenario info
    scenarioTitle: scenario?.title || '',
    scenarioDescription: scenario?.long_description || scenario?.description || '',

    // Role info
    userRole: scenario?.user_role_label || 'Bewerber',
    agentRole: profile.role || 'Interviewer',

    // Agent personality
    agentName: profile.name || '',
    agentProperties: profile.properties || '',
    agentPainPoints: Array.isArray(profile.typical_objections)
      ? profile.typical_objections.join('\n')
      : (profile.typical_objections || ''),
    agentQuestions: Array.isArray(profile.important_questions)
      ? profile.important_questions.join('\n')
      : (profile.important_questions || ''),
  };
}

export default {
  generateLiveCoaching,
  shouldGenerateCoaching,
  extractCoachingContext,
};
