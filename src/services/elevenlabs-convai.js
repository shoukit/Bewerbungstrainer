/**
 * ElevenLabs Conversational AI Service
 *
 * Handles WebSocket communication with ElevenLabs Conversational AI API
 */

import { base64ToBlob } from '@/utils/audio';

class ElevenLabsConvAIService {
  constructor() {
    this.ws = null;
    this.agentId = null;
    this.apiKey = null;
    this.conversationId = null;
    this.isConnected = false;
    this.isConnecting = false;

    // Event handlers
    this.onConnected = null;
    this.onDisconnected = null;
    this.onMessage = null;
    this.onTranscript = null;
    this.onAudioData = null;
    this.onError = null;
    this.onEnd = null;
    this.onAudioLevel = null;

    // Transcript storage
    this.transcript = [];

    // Audio context for monitoring
    this.audioContext = null;
    this.analyser = null;
    this.micStream = null;

    // Timers
    this.startTime = null;
    this.duration = 0;
  }

  /**
   * Start a conversation with an ElevenLabs agent
   *
   * @param {string} agentId - ElevenLabs Agent ID
   * @param {string} apiKey - ElevenLabs API Key
   * @param {object} options - Additional options (variables, firstMessage, etc.)
   * @returns {Promise<void>}
   */
  async startConversation(agentId, apiKey, options = {}) {
    if (this.isConnected || this.isConnecting) {
      console.warn('[ElevenLabs ConvAI] Already connected or connecting');
      return;
    }

    this.isConnecting = true;
    this.agentId = agentId;
    this.apiKey = apiKey;
    this.startTime = Date.now();
    this.transcript = [];


    try {
      // Request microphone access
      await this.initAudioInput();

      // Connect to ElevenLabs WebSocket
      await this.connectWebSocket(options);
    } catch (error) {
      console.error('[ElevenLabs ConvAI] Failed to start conversation:', error);
      this.isConnecting = false;

      if (this.onError) {
        this.onError(error);
      }

      throw error;
    }
  }

  /**
   * Initialize audio input (microphone)
   *
   * @returns {Promise<void>}
   */
  async initAudioInput() {
    try {

      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });


      // Setup audio context for monitoring
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;

      const source = this.audioContext.createMediaStreamSource(this.micStream);
      source.connect(this.analyser);

      // Start monitoring audio level
      this.startAudioLevelMonitoring();
    } catch (error) {
      console.error('[ElevenLabs ConvAI] Microphone access denied:', error);
      throw new Error('Mikrofon-Zugriff verweigert. Bitte erlaube den Mikrofon-Zugriff.');
    }
  }

  /**
   * Start monitoring audio level for visualization
   */
  startAudioLevelMonitoring() {
    if (!this.analyser) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const monitor = () => {
      if (!this.isConnected) return;

      this.analyser.getByteFrequencyData(dataArray);

      // Calculate average volume (0-100)
      const average = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
      const level = Math.min(100, Math.round((average / 255) * 100));

      if (this.onAudioLevel) {
        this.onAudioLevel(level);
      }

      requestAnimationFrame(monitor);
    };

    monitor();
  }

  /**
   * Connect to ElevenLabs WebSocket
   *
   * @param {object} options - Connection options
   * @returns {Promise<void>}
   */
  connectWebSocket(options = {}) {
    return new Promise((resolve, reject) => {
      const wsUrl = `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${this.agentId}`;


      this.ws = new WebSocket(wsUrl);

      // Setup event handlers
      this.ws.onopen = () => {
        this.isConnected = true;
        this.isConnecting = false;

        // Send initial configuration
        const initMessage = {
          type: 'conversation_initiation_client_data',
          conversation_config_override: {
            agent: {
              prompt: {
                prompt: options.prompt || '',
              },
              first_message: options.firstMessage || '',
              language: 'de',
            },
            tts: {
              stability: 0.5,
              similarity_boost: 0.75,
            },
          },
        };

        // Add dynamic variables at top agent level
        if (options.variables && Object.keys(options.variables).length > 0) {
          initMessage.conversation_config_override.agent.dynamic_variables = options.variables;
        }


        this.ws.send(JSON.stringify(initMessage));

        if (this.onConnected) {
          this.onConnected();
        }

        resolve();
      };

      this.ws.onerror = (error) => {
        console.error('[ElevenLabs ConvAI] WebSocket error:', error);
        this.isConnecting = false;

        if (this.onError) {
          this.onError(new Error('WebSocket-Verbindung fehlgeschlagen.'));
        }

        reject(error);
      };

      this.ws.onclose = (event) => {
        this.isConnected = false;

        this.cleanup();

        if (this.onDisconnected) {
          this.onDisconnected();
        }
      };

      this.ws.onmessage = (event) => {
        this.handleWebSocketMessage(event);
      };

      // Setup timeout
      setTimeout(() => {
        if (this.isConnecting) {
          console.error('[ElevenLabs ConvAI] Connection timeout');
          this.ws.close();
          reject(new Error('Verbindungs-Timeout. Bitte versuche es erneut.'));
        }
      }, 10000); // 10 second timeout
    });
  }

  /**
   * Handle incoming WebSocket messages
   *
   * @param {MessageEvent} event - WebSocket message event
   */
  handleWebSocketMessage(event) {
    try {
      // Check if message is binary (audio data)
      if (event.data instanceof Blob) {
        if (this.onAudioData) {
          this.onAudioData(event.data);
        }
        return;
      }

      // Parse JSON message
      const message = JSON.parse(event.data);

      if (this.onMessage) {
        this.onMessage(message);
      }

      // Handle different message types
      switch (message.type) {
        case 'conversation_initiation_metadata':
          this.conversationId = message.conversation_initiation_metadata_event?.conversation_id;
          break;

        case 'audio':
          // Audio chunk received
          if (message.audio_event?.audio_base_64) {
            const audioData = base64ToBlob(message.audio_event.audio_base_64, 'audio/mp3');
            if (this.onAudioData) {
              this.onAudioData(audioData);
            }
          }
          break;

        case 'user_transcript':
          // User (customer) speech transcription
          const userText = message.user_transcription_event?.user_transcript;
          if (userText) {
            this.transcript.push({
              role: 'user',
              text: userText,
              timestamp: Date.now(),
            });

            if (this.onTranscript) {
              this.onTranscript({
                role: 'user',
                text: userText,
                timestamp: Date.now(),
              });
            }
          }
          break;

        case 'agent_response':
          // Agent speech transcription
          const agentText = message.agent_response_event?.agent_response;
          if (agentText) {
            this.transcript.push({
              role: 'agent',
              text: agentText,
              timestamp: Date.now(),
            });

            if (this.onTranscript) {
              this.onTranscript({
                role: 'agent',
                text: agentText,
                timestamp: Date.now(),
              });
            }
          }
          break;

        case 'interruption':
          break;

        case 'ping':
          // Respond to ping
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'pong', event_id: message.ping_event?.event_id }));
          }
          break;

        case 'conversation_end':
          if (this.onEnd) {
            this.onEnd();
          }
          this.stopConversation();
          break;

        default:
      }
    } catch (error) {
      console.error('[ElevenLabs ConvAI] Error handling message:', error);
    }
  }

  /**
   * Convert base64 to Blob
   * @deprecated Use base64ToBlob from @/utils/audio instead
   */
  base64ToBlob(base64Data, mimeType) {
    return base64ToBlob(base64Data, mimeType);
  }

  /**
   * Stop the conversation
   */
  stopConversation() {

    // Calculate duration
    if (this.startTime) {
      this.duration = Math.round((Date.now() - this.startTime) / 1000); // in seconds
    }

    // Close WebSocket
    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.close();
      }
      this.ws = null;
    }

    // Stop microphone
    this.cleanup();

    this.isConnected = false;

    if (this.onDisconnected) {
      this.onDisconnected();
    }
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    // Stop microphone stream
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }

    // Close audio context
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.analyser = null;
  }

  /**
   * Get the current transcript
   *
   * @returns {array} Array of transcript messages
   */
  getTranscript() {
    return this.transcript;
  }

  /**
   * Get conversation duration in seconds
   *
   * @returns {number} Duration in seconds
   */
  getDuration() {
    return this.duration;
  }

  /**
   * Get conversation ID
   *
   * @returns {string|null} Conversation ID
   */
  getConversationId() {
    return this.conversationId;
  }

  /**
   * Format transcript for API/Gemini
   *
   * @returns {string} Formatted transcript as string
   */
  getFormattedTranscript() {
    return this.transcript
      .map((msg) => `${msg.role === 'agent' ? 'Interviewer' : 'Bewerber'}: ${msg.text}`)
      .join('\n\n');
  }

  /**
   * Check if currently connected
   *
   * @returns {boolean} Connection status
   */
  isCurrentlyConnected() {
    return this.isConnected;
  }
}

// Export singleton instance
const elevenlabsConvAI = new ElevenLabsConvAIService();
export default elevenlabsConvAI;
