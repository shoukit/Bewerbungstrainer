/**
 * SDK Adapter for ElevenLabs Conversational AI
 *
 * Wraps the official @elevenlabs/react SDK to provide a unified interface.
 * This adapter is used for direct connections (non-proxy mode).
 */

import { useCallback, useRef, useState, useEffect } from 'react';
import { useConversation } from '@elevenlabs/react';
import { buildSystemPrompt, buildEnhancedVariables, DEFAULT_VOICE_ID } from './types';

/**
 * Custom hook that wraps the ElevenLabs SDK
 *
 * @param {Object} callbacks - Event callbacks
 * @param {function} callbacks.onMessage - Called when a message is received
 * @param {function} callbacks.onConnect - Called when connected
 * @param {function} callbacks.onDisconnect - Called when disconnected
 * @param {function} callbacks.onError - Called on error
 * @returns {Object} Adapter interface
 */
export const useSdkAdapter = ({
  onMessage,
  onConnect,
  onDisconnect,
  onError,
}) => {
  const conversationIdRef = useRef(null);
  const startTimeRef = useRef(null);
  const lastMessageEndTimeRef = useRef(0);
  const lastAiEndTimeRef = useRef(0);

  // Use the official ElevenLabs SDK hook
  const conversation = useConversation({
    onConnect: () => {
      const now = Date.now();
      startTimeRef.current = now;
      onConnect?.();
    },
    onDisconnect: () => {
      onDisconnect?.();
    },
    onMessage: (message) => {
      if (message.source === 'ai' || message.source === 'user') {
        const currentStartTime = startTimeRef.current;
        const now = Date.now();
        const currentTimeSeconds = currentStartTime ? Math.floor((now - currentStartTime) / 1000) : 0;

        let messageStartSeconds;

        if (message.source === 'ai') {
          // For AI messages: Use when the previous message ended
          messageStartSeconds = lastMessageEndTimeRef.current;
          lastMessageEndTimeRef.current = currentTimeSeconds;
          lastAiEndTimeRef.current = currentTimeSeconds;
        } else {
          // For USER messages: Use when AI last finished speaking
          messageStartSeconds = lastAiEndTimeRef.current;
          lastMessageEndTimeRef.current = currentTimeSeconds;
        }

        // Format the START time for display
        const minutes = Math.floor(messageStartSeconds / 60);
        const seconds = messageStartSeconds % 60;
        const timeLabel = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        const entry = {
          role: message.source === 'ai' ? 'agent' : 'user',
          text: message.message,
          timestamp: now,
          elapsedTime: messageStartSeconds,
          timeLabel,
        };

        onMessage?.(entry);
      }
    },
    onError: (err) => {
      console.error('❌ [SDKAdapter] Error:', err);
      onError?.(new Error(err.message || 'Ein Fehler ist aufgetreten.'));
    },
  });

  /**
   * Start the conversation
   *
   * @param {Object} config - Session configuration
   * @returns {Promise<string>} Conversation ID
   */
  const connect = useCallback(async (config) => {
    const { agentId, scenario, variables, microphoneId } = config;

    // Reset timing refs
    startTimeRef.current = null;
    lastMessageEndTimeRef.current = 0;
    lastAiEndTimeRef.current = 0;

    // Build enhanced variables
    const enhancedVariables = buildEnhancedVariables(variables, scenario);

    // Build session options
    const sessionOptions = {
      agentId,
      connectionType: 'websocket', // Use websocket for override support
      dynamicVariables: enhancedVariables,
      ...(microphoneId && { inputDeviceId: microphoneId }),
      overrides: {
        agent: {
          prompt: {
            prompt: buildSystemPrompt(scenario),
          },
          // Prefix with "..." to absorb initial audio buffering speed burst
          firstMessage: '... ' + (scenario?.initial_message || 'Hallo! Ich freue mich auf unser Gespräch.'),
        },
        // Voice override - requires TTS Override enabled in ElevenLabs Agent Settings
        ...(scenario?.voice_id && {
          tts: {
            voiceId: scenario.voice_id,
          },
        }),
      },
    };

    if (scenario?.voice_id) {
      console.log('[SDKAdapter] Using voice override:', scenario.voice_id);
    }

    conversationIdRef.current = await conversation.startSession(sessionOptions);

    return conversationIdRef.current;
  }, [conversation]);

  /**
   * End the conversation
   */
  const disconnect = useCallback(() => {
    if (conversation.status === 'connected') {
      conversation.endSession();
    }
  }, [conversation]);

  /**
   * Get current connection status
   * @returns {'disconnected' | 'connecting' | 'connected'}
   */
  const getStatus = useCallback(() => {
    return conversation.status;
  }, [conversation.status]);

  /**
   * Check if agent is currently speaking
   * @returns {boolean}
   */
  const isSpeaking = useCallback(() => {
    return conversation.isSpeaking;
  }, [conversation.isSpeaking]);

  /**
   * Get the conversation ID
   * @returns {string|null}
   */
  const getConversationId = useCallback(() => {
    return conversationIdRef.current;
  }, []);

  /**
   * Get start time
   * @returns {number|null}
   */
  const getStartTime = useCallback(() => {
    return startTimeRef.current;
  }, []);

  return {
    connect,
    disconnect,
    getStatus,
    isSpeaking,
    getConversationId,
    getStartTime,
    // Expose raw status for reactive updates
    status: conversation.status,
    speaking: conversation.isSpeaking,
  };
};

export default useSdkAdapter;
