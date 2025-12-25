/**
 * Conversation Adapters
 *
 * Provides unified interface for ElevenLabs Conversational AI connections.
 * Supports both direct SDK and WebSocket proxy connections.
 */

export * from './types';
export { useSdkAdapter } from './sdk-adapter';
export { useProxyAdapter } from './proxy-adapter';
