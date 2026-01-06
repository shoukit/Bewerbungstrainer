/**
 * Conversation Adapter for ElevenLabs Conversational AI
 *
 * Supports two connection modes:
 * - 'direct': Connect directly to ElevenLabs WebSocket API
 * - 'proxy': Connect through our WebSocket proxy server (for corporate firewalls)
 *
 * Both modes use the same explicit audio buffering for smooth playback:
 * - audioQueueRef: FIFO queue for incoming audio chunks
 * - nextPlayTimeRef: Seamless scheduling tracker (no gaps between chunks)
 * - playNextAudio(): Web Audio API with precise timing
 *
 * This buffering solves the audio dropout issues of the SDK approach.
 *
 * Handles:
 * - WebSocket connection (direct or via proxy)
 * - Manual audio capture (PCM16 at 16kHz, 256ms chunks)
 * - Manual audio playback via Web Audio API with jitter buffering
 * - Message handling and transcript generation
 */

import { useCallback, useRef, useState, useEffect } from 'react';
import { CONNECTION_MODES, getWebSocketUrl, buildSystemPrompt, buildEnhancedVariables, cleanHtmlForPrompt } from './types';
import { formatDuration } from '@/utils/formatting';

/**
 * Custom hook that manages WebSocket proxy connection
 *
 * @param {Object} callbacks - Event callbacks
 * @param {function} callbacks.onMessage - Called when a message is received
 * @param {function} callbacks.onConnect - Called when connected
 * @param {function} callbacks.onDisconnect - Called when disconnected
 * @param {function} callbacks.onError - Called on error
 * @returns {Object} Adapter interface
 */
export const useProxyAdapter = ({
  onMessage,
  onConnect,
  onDisconnect,
  onError,
}) => {
  const [status, setStatus] = useState('disconnected');
  const [isMuted, setIsMutedState] = useState(false);

  // Refs for WebSocket and audio
  const wsRef = useRef(null);
  const streamRef = useRef(null);
  const captureContextRef = useRef(null);
  const playbackContextRef = useRef(null);
  const processorRef = useRef(null);
  const audioQueueRef = useRef([]);
  const isPlayingRef = useRef(false);
  const nextPlayTimeRef = useRef(0);
  const conversationIdRef = useRef(null);
  const startTimeRef = useRef(null);
  const isMutedRef = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  /**
   * Start audio capture and send to WebSocket
   */
  const startAudioCapture = useCallback(async (stream, ws) => {
    try {
      // Create audio context at 16kHz for ElevenLabs
      const audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 16000,
      });
      captureContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);

      // Use ScriptProcessor for wider browser support
      // Buffer size of 4096 at 16kHz = ~256ms chunks
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (event) => {
        if (ws.readyState !== WebSocket.OPEN || isMutedRef.current) return;

        const inputData = event.inputBuffer.getChannelData(0);

        // Convert Float32 to Int16 PCM
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const sample = Math.max(-1, Math.min(1, inputData[i]));
          pcmData[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        }

        // Convert to base64
        const uint8Array = new Uint8Array(pcmData.buffer);
        let binary = '';
        for (let i = 0; i < uint8Array.length; i++) {
          binary += String.fromCharCode(uint8Array[i]);
        }
        const base64Audio = btoa(binary);

        // Send in ElevenLabs format
        ws.send(JSON.stringify({
          user_audio_chunk: base64Audio,
        }));
      };

      source.connect(processor);
      processor.connect(audioContext.destination);
    } catch (err) {
      console.error('[ProxyAdapter] Failed to start audio capture:', err);
    }
  }, []);

  /**
   * Queue audio for playback
   */
  const queueAudio = useCallback((arrayBuffer) => {
    audioQueueRef.current.push(arrayBuffer);
    if (!isPlayingRef.current) {
      playNextAudio();
    }
  }, []);

  /**
   * Play next audio in queue using Web Audio API
   */
  const playNextAudio = useCallback(async () => {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      return;
    }

    isPlayingRef.current = true;
    const arrayBuffer = audioQueueRef.current.shift();

    try {
      const SAMPLE_RATE = 16000;

      // Create or resume playback context
      if (!playbackContextRef.current || playbackContextRef.current.state === 'closed') {
        playbackContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        nextPlayTimeRef.current = 0;
      }

      const ctx = playbackContextRef.current;

      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      // Convert raw PCM16 bytes to Float32 samples
      const int16Array = new Int16Array(arrayBuffer);
      const floatArray = new Float32Array(int16Array.length);

      for (let i = 0; i < int16Array.length; i++) {
        floatArray[i] = int16Array[i] / 32768.0;
      }

      // Create audio buffer at source sample rate
      const audioBuffer = ctx.createBuffer(1, floatArray.length, SAMPLE_RATE);
      audioBuffer.getChannelData(0).set(floatArray);

      // Create source node
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);

      // Schedule playback for seamless audio
      const currentTime = ctx.currentTime;
      const scheduleTime = Math.max(currentTime, nextPlayTimeRef.current);

      source.start(scheduleTime);

      // Update next play time for seamless scheduling
      nextPlayTimeRef.current = scheduleTime + audioBuffer.duration;

      // When this chunk ends, play next
      source.onended = () => {
        playNextAudio();
      };
    } catch (err) {
      console.error('[ProxyAdapter] Audio playback error:', err);
      playNextAudio(); // Try next audio
    }
  }, []);

  /**
   * Handle incoming WebSocket messages
   */
  const handleMessage = useCallback((event, scenario, variables) => {
    // Binary data = audio
    if (event.data instanceof ArrayBuffer) {
      queueAudio(event.data);
      return;
    }

    // Text data = JSON
    try {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'conversation_initiation_metadata':
          // ElevenLabs is ready - now send our config
          if (data.conversation_initiation_metadata_event?.conversation_id) {
            conversationIdRef.current = data.conversation_initiation_metadata_event.conversation_id;
          }

          // Build dynamic variables
          const dynamicVariables = buildEnhancedVariables(variables, scenario);

          // Send our configuration
          const initMessage = {
            type: 'conversation_initiation_client_data',
            dynamic_variables: dynamicVariables,
            conversation_config_override: {
              agent: {
                prompt: {
                  prompt: cleanHtmlForPrompt(scenario?.content || ''),
                },
                first_message: scenario?.initial_message || 'Hallo! Ich freue mich auf unser Gespräch.',
              },
              // Voice override - requires TTS Override enabled in ElevenLabs Agent Settings
              ...(scenario?.voice_id && {
                tts: {
                  voice_id: scenario.voice_id,
                },
              }),
            },
          };

          // Debug: Log scenario and voice_id
          console.log('[ProxyAdapter] Scenario:', scenario);
          console.log('[ProxyAdapter] voice_id:', scenario?.voice_id);
          console.log('[ProxyAdapter] initMessage:', JSON.stringify(initMessage, null, 2));

          if (scenario?.voice_id) {
            console.log('[ProxyAdapter] Using voice override:', scenario.voice_id);
          } else {
            console.log('[ProxyAdapter] No voice_id in scenario');
          }

          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(initMessage));

            // Now we're truly connected
            const now = Date.now();
            startTimeRef.current = now;
            setStatus('connected');
            onConnect?.();

            // Start audio capture
            if (streamRef.current) {
              startAudioCapture(streamRef.current, wsRef.current);
            }
          }
          break;

        case 'audio':
          // Base64 encoded audio from ElevenLabs
          if (data.audio_event?.audio_base_64) {
            const binaryString = atob(data.audio_event.audio_base_64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            queueAudio(bytes.buffer);
          }
          break;

        case 'agent_response':
          // AI response text
          if (data.agent_response_event?.agent_response) {
            const entry = createTranscriptEntry('agent', data.agent_response_event.agent_response);
            onMessage?.(entry);
          }
          break;

        case 'user_transcript':
          // User speech transcription
          if (data.user_transcription_event?.user_transcript) {
            const entry = createTranscriptEntry('user', data.user_transcription_event.user_transcript);
            onMessage?.(entry);
          }
          break;

        case 'interruption':
          // User interrupted - clear audio queue
          audioQueueRef.current = [];
          break;

        case 'ping':
          // Respond to ping
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'pong', event_id: data.ping_event?.event_id }));
          }
          break;

        case 'internal_vad_score':
        case 'internal_turn_probability':
        case 'internal_tentative_agent_response':
          // Internal debugging messages - ignore silently
          break;

        case 'error':
          console.error('[ProxyAdapter] Server error:', data);
          onError?.(new Error(data.message || data.error_message || 'Server-Fehler'));
          break;

        case 'conversation_end':
          // ElevenLabs signals end of conversation - close WebSocket to trigger onclose handler
          console.log('[ProxyAdapter] Received conversation_end event from ElevenLabs');
          if (wsRef.current) {
            wsRef.current.close();
          }
          break;

        default:
          // Unhandled message types ignored
          break;
      }
    } catch (err) {
      console.error('[ProxyAdapter] Message parse error:', err);
    }
  }, [onConnect, onMessage, onError, onDisconnect, queueAudio, startAudioCapture]);

  /**
   * Create a transcript entry
   */
  const createTranscriptEntry = useCallback((role, text) => {
    if (!text || text.trim() === '') return null;

    const now = Date.now();
    const elapsedSeconds = startTimeRef.current
      ? Math.floor((now - startTimeRef.current) / 1000)
      : 0;

    return {
      role,
      text,
      timestamp: now,
      elapsedTime: elapsedSeconds,
      timeLabel: formatDuration(elapsedSeconds),
    };
  }, []);

  /**
   * Start the conversation
   *
   * @param {Object} config - Connection configuration
   * @param {string} config.agentId - ElevenLabs agent ID
   * @param {Object} config.scenario - Scenario configuration
   * @param {Object} config.variables - Dynamic variables
   * @param {string} [config.microphoneId] - Selected microphone device ID
   * @param {string} [config.connectionMode='proxy'] - 'direct' or 'proxy'
   */
  const connect = useCallback(async (config) => {
    const { agentId, scenario, variables, microphoneId, connectionMode = CONNECTION_MODES.PROXY } = config;

    setStatus('connecting');
    console.log(`[ConversationAdapter] Starting in ${connectionMode} mode`);

    try {
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: microphoneId ? { exact: microphoneId } : undefined,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
        },
      });
      streamRef.current = stream;

      // Connect to ElevenLabs (direct or via proxy)
      const wsUrl = getWebSocketUrl(connectionMode, agentId);
      console.log(`[ConversationAdapter] Connecting to: ${wsUrl}`);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      ws.binaryType = 'arraybuffer';

      ws.onopen = () => {
        // Don't set connected yet - wait for conversation_initiation_metadata
      };

      ws.onmessage = (event) => {
        handleMessage(event, scenario, variables);
      };

      ws.onclose = () => {
        setStatus('disconnected');
        onDisconnect?.();
      };

      ws.onerror = (error) => {
        console.error('[ProxyAdapter] WebSocket error:', error);
        onError?.(new Error('Verbindung zum Proxy fehlgeschlagen'));
        setStatus('disconnected');
      };

      // Return a promise that resolves when connected
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 30000);

        const checkConnection = setInterval(() => {
          if (conversationIdRef.current) {
            clearTimeout(timeout);
            clearInterval(checkConnection);
            resolve(conversationIdRef.current);
          }
        }, 100);
      });
    } catch (err) {
      console.error('[ProxyAdapter] Start failed:', err);
      setStatus('disconnected');
      throw err;
    }
  }, [handleMessage, onDisconnect, onError]);

  /**
   * End the conversation
   */
  const disconnect = useCallback(() => {
    cleanup();
  }, []);

  /**
   * Cleanup all resources
   */
  const cleanup = useCallback(() => {
    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // Clean up audio processor
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    // Close audio contexts
    if (captureContextRef.current && captureContextRef.current.state !== 'closed') {
      captureContextRef.current.close().catch(() => {});
      captureContextRef.current = null;
    }
    if (playbackContextRef.current && playbackContextRef.current.state !== 'closed') {
      playbackContextRef.current.close().catch(() => {});
      playbackContextRef.current = null;
    }

    // Stop microphone
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Clear audio queue
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    nextPlayTimeRef.current = 0;
    conversationIdRef.current = null;

    setStatus('disconnected');
  }, []);

  /**
   * Get current connection status
   */
  const getStatus = useCallback(() => {
    return status;
  }, [status]);

  /**
   * Set muted state
   */
  const setMuted = useCallback((muted) => {
    setIsMutedState(muted);
    isMutedRef.current = muted;

    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !muted;
      });
    }
  }, []);

  /**
   * Check if agent is speaking (audio queue not empty)
   */
  const isSpeaking = useCallback(() => {
    return isPlayingRef.current || audioQueueRef.current.length > 0;
  }, []);

  /**
   * Get the conversation ID
   */
  const getConversationId = useCallback(() => {
    return conversationIdRef.current;
  }, []);

  /**
   * Get start time
   */
  const getStartTime = useCallback(() => {
    return startTimeRef.current;
  }, []);

  return {
    connect,
    disconnect,
    getStatus,
    isSpeaking,
    setMuted,
    getConversationId,
    getStartTime,
    // Expose reactive status
    status,
    speaking: isPlayingRef.current,
    muted: isMuted,
  };
};

export default useProxyAdapter;
