/**
 * Conversation Adapter Types
 *
 * Defines the common interface for both SDK (direct) and Proxy adapters.
 * This allows RoleplaySession to work with either connection mode.
 */

/**
 * @typedef {'disconnected' | 'connecting' | 'connected'} ConnectionStatus
 */

/**
 * @typedef {Object} TranscriptEntry
 * @property {'agent' | 'user'} role - Who spoke
 * @property {string} text - What was said
 * @property {number} timestamp - Unix timestamp
 * @property {string} timeLabel - Formatted time (e.g., "01:23")
 * @property {number} [elapsedTime] - Seconds since start
 */

/**
 * @typedef {Object} SessionConfig
 * @property {string} agentId - ElevenLabs agent ID
 * @property {Object} scenario - Scenario configuration
 * @property {string} [scenario.content] - System prompt content
 * @property {string} [scenario.initial_message] - First message from agent
 * @property {string} [scenario.voice_id] - Voice ID override
 * @property {Object} [scenario.interviewer_profile] - Interviewer profile
 * @property {Object} variables - Dynamic variables to inject
 * @property {string} [microphoneId] - Selected microphone device ID
 * @property {string} [demoCode] - Demo code for guest users
 */

/**
 * @typedef {Object} ConversationCallbacks
 * @property {function(TranscriptEntry): void} onMessage - Called when a message is received
 * @property {function(): void} onConnect - Called when connection is established
 * @property {function(): void} onDisconnect - Called when connection is closed
 * @property {function(Error): void} onError - Called on error
 */

/**
 * @typedef {Object} ConversationAdapter
 * @property {function(SessionConfig, ConversationCallbacks): Promise<string>} connect - Start the conversation, returns conversation ID
 * @property {function(): void} disconnect - End the conversation
 * @property {function(): ConnectionStatus} getStatus - Get current connection status
 * @property {function(): boolean} isSpeaking - Check if agent is currently speaking
 * @property {function(boolean): void} setMuted - Mute/unmute microphone
 * @property {function(): string|null} getConversationId - Get the ElevenLabs conversation ID
 */

/**
 * Connection mode types
 * @typedef {'direct' | 'proxy'} ConnectionMode
 */

export const CONNECTION_MODES = {
  DIRECT: 'direct',
  PROXY: 'proxy',
};

/**
 * Default voice ID if not specified in scenario
 */
export const DEFAULT_VOICE_ID = 'kaGxVtjLwllv1bi2GFag';

/**
 * Proxy WebSocket URL
 */
export const PROXY_URL = 'wss://karriereheld-ws-proxy.onrender.com/ws';

/**
 * Clean HTML from WordPress content for ElevenLabs prompts
 * Shared utility function for both adapters
 *
 * @param {string} text - HTML text to clean
 * @returns {string} Cleaned text
 */
export const cleanHtmlForPrompt = (text) => {
  if (!text) return text;

  // First, convert block elements to newlines to preserve paragraph structure
  let cleaned = text
    .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')  // </p><p> -> double newline
    .replace(/<br\s*\/?>/gi, '\n')           // <br> -> single newline
    .replace(/<\/?(p|div|h[1-6])[^>]*>/gi, '\n')  // Other block elements -> newline
    .replace(/<li[^>]*>/gi, '\n- ')          // List items -> bullet points
    .replace(/<\/li>/gi, '');                // Remove closing li tags

  // Create a temporary DOM element to decode HTML entities and strip remaining tags
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = cleaned;
  cleaned = tempDiv.textContent || tempDiv.innerText || '';

  // Clean up whitespace
  cleaned = cleaned
    .replace(/[ \t]+/g, ' ')           // Multiple spaces/tabs -> single space
    .replace(/\n /g, '\n')             // Remove leading spaces after newlines
    .replace(/ \n/g, '\n')             // Remove trailing spaces before newlines
    .replace(/\n{3,}/g, '\n\n')        // Max 2 consecutive newlines
    .trim();

  return cleaned;
};

/**
 * Build enhanced system prompt with interviewer profile
 * Shared utility function for both adapters
 *
 * @param {Object} scenario - Scenario configuration
 * @returns {string} Complete system prompt
 */
export const buildSystemPrompt = (scenario) => {
  // Clean HTML entities and tags from WordPress content
  let prompt = cleanHtmlForPrompt(scenario?.content || '');

  // Add interviewer profile information to system prompt
  if (scenario?.interviewer_profile) {
    prompt += '\n\n## Dein Profil:\n';

    if (scenario.interviewer_profile.name) {
      prompt += `\nDein Name: ${scenario.interviewer_profile.name}`;
    }

    if (scenario.interviewer_profile.role) {
      prompt += `\nDeine Rolle: ${scenario.interviewer_profile.role}`;
    }

    if (scenario.interviewer_profile.properties) {
      prompt += `\n\n### Deine Eigenschaften:\n${cleanHtmlForPrompt(scenario.interviewer_profile.properties)}`;
    }

    if (scenario.interviewer_profile.typical_objections) {
      prompt += `\n\n### Typische Einwände, die du vorbringen solltest:\n${cleanHtmlForPrompt(scenario.interviewer_profile.typical_objections)}`;
    }

    if (scenario.interviewer_profile.important_questions) {
      prompt += `\n\n### Wichtige Fragen, die du stellen solltest:\n${cleanHtmlForPrompt(scenario.interviewer_profile.important_questions)}`;
    }
  }

  return prompt;
};

/**
 * Build enhanced variables including interviewer info
 *
 * @param {Object} variables - Base variables
 * @param {Object} scenario - Scenario with interviewer profile
 * @returns {Object} Enhanced variables
 */
export const buildEnhancedVariables = (variables, scenario) => {
  const enhanced = { ...variables };

  if (scenario?.interviewer_profile) {
    if (scenario.interviewer_profile.name) {
      enhanced.interviewer_name = scenario.interviewer_profile.name;
    }
    if (scenario.interviewer_profile.role) {
      enhanced.interviewer_role = scenario.interviewer_profile.role;
    }
    if (scenario.interviewer_profile.company) {
      enhanced.interviewer_company = scenario.interviewer_profile.company;
    }
  }

  return enhanced;
};
