/**
 * Services - Central Export
 *
 * Import all services from this file for cleaner imports:
 * import { wordpressAPI, geminiService } from '@/services';
 */

// WordPress REST API client (singleton)
export { default as wordpressAPI, getWPNonce, getWPApiUrl } from './wordpress-api';

// Gemini AI service
export {
  default as geminiService,
  listAvailableModels,
  generateInterviewFeedback,
  generateAudioAnalysis,
  analyzeRhetoricGame,
} from './gemini';

// ElevenLabs services
export {
  downloadConversationAudio,
  getConversationInfo,
} from './elevenlabs';

export { default as elevenlabsConvAI } from './elevenlabs-convai';

// Live coaching engine
export { generateCoachingTip } from './live-coaching-engine';

// Roleplay feedback adapter
export {
  analyzeRoleplayTranscript,
  saveRoleplaySessionAnalysis,
  getRoleplaySessionAnalysis,
  getRoleplaySessions,
  getRoleplaySessionAudioUrl,
  fetchRoleplaySessionAudio,
  updateRoleplaySessionConversationId,
  createRoleplaySession,
  getRoleplayScenarios,
  getRoleplayScenario,
  createCustomRoleplayScenario,
} from './roleplay-feedback-adapter';

// Proxy conversation (for firewall bypass)
export {
  useProxyConversation,
  isProxyEnabled,
  setProxyEnabled,
  getProxyUrl,
  setProxyUrl,
} from './proxy-conversation';

// WebSocket connectivity testing
export {
  testWebSocketConnectivity,
  testProxyConnectivity,
  shouldUseProxy,
} from './websocket-test';
