/**
 * Proxy Conversation Hook
 *
 * A custom implementation that routes ElevenLabs Conversational AI
 * through our WebSocket proxy for corporate firewall compatibility.
 *
 * Has the same interface as @elevenlabs/react useConversation hook.
 */

import { useState, useRef, useCallback, useEffect } from 'react';

// Proxy configuration
const DEFAULT_PROXY_URL = 'wss://karriereheld-ws-proxy.onrender.com/ws';

/**
 * Check if proxy mode is enabled
 */
export function isProxyEnabled() {
  // Check localStorage for proxy setting
  const proxyEnabled = localStorage.getItem('elevenlabs_use_proxy');
  return proxyEnabled === 'true';
}

/**
 * Enable/disable proxy mode
 */
export function setProxyEnabled(enabled) {
  localStorage.setItem('elevenlabs_use_proxy', enabled ? 'true' : 'false');
}

/**
 * Get the proxy URL
 */
export function getProxyUrl() {
  return localStorage.getItem('elevenlabs_proxy_url') || DEFAULT_PROXY_URL;
}

/**
 * Set custom proxy URL
 */
export function setProxyUrl(url) {
  localStorage.setItem('elevenlabs_proxy_url', url);
}

/**
 * Custom useConversation hook that uses the WebSocket proxy
 *
 * @param {Object} options - Configuration options
 * @param {Object} options.overrides - Agent overrides (prompt, firstMessage, etc.)
 * @param {Function} options.onConnect - Called when connected
 * @param {Function} options.onDisconnect - Called when disconnected
 * @param {Function} options.onMessage - Called when a message is received
 * @param {Function} options.onError - Called on error
 */
export function useProxyConversation({
  overrides = {},
  onConnect,
  onDisconnect,
  onMessage,
  onError,
} = {}) {
  const [status, setStatus] = useState('disconnected'); // disconnected, connecting, connected
  const wsRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const streamRef = useRef(null);
  const conversationIdRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  /**
   * Start a conversation session
   */
  const startSession = useCallback(async ({
    agentId,
    dynamicVariables = {},
    inputDeviceId,
  }) => {
    if (status === 'connected' || status === 'connecting') {
      console.warn('[ProxyConversation] Already connected or connecting');
      return;
    }

    setStatus('connecting');

    try {
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: inputDeviceId ? { exact: inputDeviceId } : undefined,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // Connect to proxy
      const proxyUrl = getProxyUrl();
      const wsUrl = `${proxyUrl}?agent_id=${agentId}`;


      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      // Generate a conversation ID
      conversationIdRef.current = `proxy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      ws.onopen = () => {
        setStatus('connected');

        // Send initial configuration with overrides
        const config = {
          type: 'conversation_initiation_client_data',
          conversation_config_override: {
            agent: {
              prompt: overrides.agent?.prompt,
              first_message: overrides.agent?.firstMessage,
            },
          },
          dynamic_variables: dynamicVariables,
        };
        ws.send(JSON.stringify(config));

        onConnect?.();
      };

      ws.onmessage = (event) => {
        try {
          // Handle binary audio data
          if (event.data instanceof Blob) {
            playAudio(event.data);
            return;
          }

          // Handle JSON messages
          const data = JSON.parse(event.data);

          if (data.type === 'audio') {
            // Base64 encoded audio
            const audioData = atob(data.audio);
            const audioArray = new Uint8Array(audioData.length);
            for (let i = 0; i < audioData.length; i++) {
              audioArray[i] = audioData.charCodeAt(i);
            }
            playAudio(new Blob([audioArray], { type: 'audio/mpeg' }));
          } else if (data.type === 'transcript' || data.type === 'agent_response') {
            // AI message
            onMessage?.({
              source: 'ai',
              message: data.text || data.agent_response,
            });
          } else if (data.type === 'user_transcript') {
            // User message
            onMessage?.({
              source: 'user',
              message: data.text || data.user_transcript,
            });
          } else if (data.type === 'error') {
            onError?.(new Error(data.message || 'Unknown error'));
          }
        } catch (err) {
          console.error('[ProxyConversation] Message parse error:', err);
        }
      };

      ws.onclose = (event) => {
        setStatus('disconnected');
        cleanup();
        onDisconnect?.();
      };

      ws.onerror = (error) => {
        console.error('[ProxyConversation] WebSocket error:', error);
        onError?.(new Error('WebSocket connection failed'));
      };

      // Start sending audio
      startAudioCapture(stream, ws);

      return conversationIdRef.current;

    } catch (err) {
      console.error('[ProxyConversation] Start failed:', err);
      setStatus('disconnected');
      onError?.(err);
      throw err;
    }
  }, [status, overrides, onConnect, onDisconnect, onMessage, onError]);

  /**
   * Start capturing and sending audio
   */
  const startAudioCapture = (stream, ws) => {
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm';

    const mediaRecorder = new MediaRecorder(stream, {
      mimeType,
      audioBitsPerSecond: 16000,
    });
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
        // Send audio as binary
        ws.send(event.data);
      }
    };

    // Send audio chunks every 250ms
    mediaRecorder.start(250);
  };

  /**
   * Play received audio
   */
  const playAudio = async (audioBlob) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }

      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.start();
    } catch (err) {
      console.error('[ProxyConversation] Audio playback error:', err);
    }
  };

  /**
   * End the conversation session
   */
  const endSession = useCallback(() => {

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.close(1000, 'User ended conversation');
    }

    cleanup();
    setStatus('disconnected');
  }, []);

  /**
   * Cleanup resources
   */
  const cleanup = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  return {
    status,
    startSession,
    endSession,
    conversationId: conversationIdRef.current,
  };
}

export default {
  useProxyConversation,
  isProxyEnabled,
  setProxyEnabled,
  getProxyUrl,
  setProxyUrl,
};
