/**
 * RoleplayProxySession Component
 *
 * Unified conversation component with explicit audio buffering.
 * Supports two connection modes:
 * - 'direct': Connect directly to ElevenLabs WebSocket API
 * - 'proxy': Connect through our WebSocket proxy server (for corporate firewalls)
 *
 * Both modes use the same buffering for smooth audio playback:
 * - audioQueueRef: FIFO queue for incoming chunks
 * - nextPlayTimeRef: Seamless scheduling (no gaps)
 * - Web Audio API with precise timing
 *
 * This solves the audio dropout issues of the @elevenlabs/react SDK.
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useMobile } from '@/hooks/useMobile';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDuration } from '@/utils/formatting';
import {
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  X,
  User,
  Bot,
  Loader2,
  AlertCircle,
  Clock,
  Volume2,
  MessageSquare,
  Settings,
  Wifi,
} from 'lucide-react';
import { Button } from '@/components/ui/base/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/base/dialog';
import InterviewerProfile from './InterviewerProfile';
import CoachingPanel from './CoachingPanel';
import DeviceSettingsDialog from './DeviceSettingsDialog';
import wordpressAPI from '@/services/wordpress-api';
import {
  createRoleplaySession,
  analyzeRoleplayTranscript,
  saveRoleplaySessionAnalysis,
} from '@/services/roleplay-feedback-adapter';
import { usePartner } from '@/context/PartnerContext';
import { DEFAULT_BRANDING } from '@/config/partners';
import {
  generateLiveCoaching,
  shouldGenerateCoaching,
  extractCoachingContext,
} from '@/services/live-coaching-engine';

// Import connection mode constants
import { CONNECTION_MODES, getWebSocketUrl } from '@/services/conversation-adapters/types';

/**
 * RoleplayProxySession - Unified WebSocket component with buffering
 *
 * @param {string} connectionMode - 'direct' or 'proxy' (default: 'direct')
 */
const RoleplayProxySession = ({
  scenario,
  variables = {},
  selectedMicrophoneId,
  onEnd,
  onNavigateToSession,
  connectionMode = CONNECTION_MODES.DIRECT, // Default to direct for better audio quality
}) => {
  // Partner branding and demo code
  const { branding, demoCode } = usePartner();

  const themedStyles = useMemo(() => {
    const headerGradient = branding?.['--header-gradient'] || DEFAULT_BRANDING['--header-gradient'];
    const headerText = branding?.['--header-text'] || DEFAULT_BRANDING['--header-text'];
    const primaryAccent = branding?.['--primary-accent'] || DEFAULT_BRANDING['--primary-accent'];
    return { headerGradient, headerText, primaryAccent };
  }, [branding]);

  // Helper function to clean HTML from WordPress content for ElevenLabs prompts
  const cleanHtmlForPrompt = (text) => {
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

  // Session state
  const [sessionId, setSessionId] = useState(null);
  const [status, setStatus] = useState('disconnected'); // disconnected, connecting, connected
  const [error, setError] = useState(null);
  const [transcript, setTranscript] = useState([]);

  // Analysis state - separate from connection status (matches RoleplaySession.jsx)
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(null);

  // Analysis step definitions for progress display
  const analysisSteps = {
    audio: { label: 'Audio wird abgerufen...', progress: 20 },
    transcript: { label: 'Transkript wird ausgewertet...', progress: 50 },
    audio_analysis: { label: 'Sprechweise wird analysiert...', progress: 75 },
    saving: { label: 'Ergebnisse werden gespeichert...', progress: 90 },
  };

  // Timer state
  const [startTime, setStartTime] = useState(null);
  const [duration, setDuration] = useState(0);

  // UI state
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showDeviceSettings, setShowDeviceSettings] = useState(false);
  const [localMicrophoneId, setLocalMicrophoneId] = useState(selectedMicrophoneId);
  const isMobile = useMobile(1024);

  // Refs
  const wsRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const captureContextRef = useRef(null);  // For audio input
  const playbackContextRef = useRef(null); // For audio output
  const audioQueueRef = useRef([]);
  const isPlayingRef = useRef(false);
  const nextPlayTimeRef = useRef(0); // For seamless audio scheduling
  const transcriptEndRef = useRef(null);
  const durationIntervalRef = useRef(null);
  const transcriptRef = useRef([]); // Ref for stable transcript access
  const startTimeRef = useRef(null); // Ref for stable startTime access
  const conversationIdRef = useRef(null); // Ref for ElevenLabs conversation ID (for audio download)

  // Live coaching state
  const [dynamicCoaching, setDynamicCoaching] = useState(null);
  const [isCoachingGenerating, setIsCoachingGenerating] = useState(false);


  // Duration timer
  useEffect(() => {
    if (status === 'connected' && startTime) {
      durationIntervalRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [status, startTime]);

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [transcript]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);


  /**
   * Start the conversation
   */
  const startConversation = async () => {
    setStatus('connecting');
    setError(null);

    try {
      // Get agent ID
      const agentId = scenario.agent_id || wordpressAPI.getElevenLabsAgentId();

      if (!agentId) {
        throw new Error('Keine Agent-ID konfiguriert');
      }

      // 1. Create database session FIRST (like RoleplaySession)
      const sessionData = {
        agent_id: agentId,
        scenario_id: scenario.id,
        variables: variables,
        user_name: 'Gast',
        demo_code: demoCode || null,
        connection_mode: connectionMode,
      };

      const createdSession = await createRoleplaySession(sessionData);
      setSessionId(createdSession.id);

      // 2. Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: localMicrophoneId ? { exact: localMicrophoneId } : undefined,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
        },
      });
      streamRef.current = stream;

      // 3. Connect to ElevenLabs (direct or via proxy)
      const wsUrl = getWebSocketUrl(connectionMode, agentId);
      console.log(`[RoleplaySession] Connecting in ${connectionMode} mode to: ${wsUrl}`);

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.binaryType = 'arraybuffer';

      ws.onopen = () => {
        // Don't set connected yet - wait for conversation_initiation_metadata
        console.log(`[RoleplaySession] WebSocket opened (${connectionMode} mode)`);
      };

      ws.onmessage = (event) => {
        handleMessage(event);
      };

      ws.onclose = (event) => {
        // Only set disconnected if we're not analyzing
        if (status !== 'analyzing') {
          setStatus('disconnected');
        }
        console.log(`[RoleplaySession] WebSocket closed (${connectionMode} mode)`);
      };

      ws.onerror = (error) => {
        console.error('[RoleplaySession] WebSocket error:', error);
        const errorMsg = connectionMode === CONNECTION_MODES.PROXY
          ? 'Verbindung zum Proxy fehlgeschlagen'
          : 'Verbindung zu ElevenLabs fehlgeschlagen';
        setError(errorMsg);
        setStatus('disconnected');
      };

    } catch (err) {
      console.error('[ProxySession] Start failed:', err);
      setError(err.message || 'Verbindung fehlgeschlagen');
      setStatus('disconnected');
    }
  };

  /**
   * Handle incoming WebSocket messages
   */
  const handleMessage = (event) => {
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
          // ElevenLabs is ready - now send our config and start audio

          // Capture conversation_id for later audio download via HTTPS
          if (data.conversation_initiation_metadata_event?.conversation_id) {
            conversationIdRef.current = data.conversation_initiation_metadata_event.conversation_id;
          }

          // Build dynamic variables including interviewer info from scenario
          const dynamicVariables = {
            ...variables,
            // Add interviewer info from scenario if available
            interviewer_name: scenario?.interviewer_profile?.name || 'Interviewer',
            interviewer_role: scenario?.interviewer_profile?.role || '',
            interviewer_company: scenario?.interviewer_profile?.company || '',
          };

          // Send our configuration
          // Note: ElevenLabs expects dynamic_variables at root level
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
              // Voice override - requires "TTS Override" enabled in ElevenLabs Agent Settings
              ...(scenario?.voice_id && {
                tts: {
                  voice_id: scenario.voice_id,
                },
              }),
            },
          };

          if (scenario?.voice_id) {
            console.log('[RoleplayProxySession] Using voice override:', scenario.voice_id);
          }

          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(initMessage));

            // Now we're truly connected - start audio capture
            const now = Date.now();
            setStatus('connected');
            setStartTime(now);
            startTimeRef.current = now; // Keep ref in sync

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
            addToTranscript('agent', data.agent_response_event.agent_response);
            // Generate live coaching when agent speaks
            setTimeout(() => {
              handleGenerateCoaching(data.agent_response_event.agent_response, transcriptRef.current);
            }, 100);
          }
          break;

        case 'user_transcript':
          // User speech transcription
          if (data.user_transcription_event?.user_transcript) {
            addToTranscript('user', data.user_transcription_event.user_transcript);
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
          console.error('[ProxySession] Server error:', data);
          setError(data.message || data.error_message || 'Server-Fehler');
          break;

        default:
          // Unhandled message types ignored
          break;
      }
    } catch (err) {
      console.error('[ProxySession] Message parse error:', err);
    }
  };

  /**
   * Add message to transcript
   */
  const addToTranscript = (role, text) => {
    if (!text || text.trim() === '') return;

    const newEntry = {
      role,
      text,
      timestamp: Date.now(),
      timeLabel: formatDuration(Math.floor((Date.now() - (startTimeRef.current || Date.now())) / 1000)),
    };

    setTranscript(prev => {
      const updated = [...prev, newEntry];
      transcriptRef.current = updated; // Keep ref in sync
      return updated;
    });
  };

  /**
   * Generate live coaching when agent speaks
   */
  const handleGenerateCoaching = async (agentMessage, currentTranscript) => {
    const geminiApiKey = wordpressAPI.getGeminiApiKey();
    if (!geminiApiKey) {
      console.warn('[COACHING] No Gemini API key available');
      return;
    }

    // Check if this message warrants coaching
    if (!shouldGenerateCoaching({ role: 'agent', text: agentMessage })) {
      return;
    }

    try {
      setIsCoachingGenerating(true);
      // Clear previous coaching immediately for fresh UI
      setDynamicCoaching(null);

      const coaching = await generateLiveCoaching({
        apiKey: geminiApiKey,
        nextAgentInput: agentMessage,
        transcriptHistory: currentTranscript.slice(-4), // Last 4 messages for context
        scenarioContext: extractCoachingContext(scenario),
      });

      setDynamicCoaching(coaching);
    } catch (error) {
      console.error('[COACHING] Failed to generate coaching:', error);
    } finally {
      setIsCoachingGenerating(false);
    }
  };

  /**
   * Start capturing and sending audio using AudioWorklet/ScriptProcessor
   * ElevenLabs expects PCM16 audio at 16kHz
   */
  const startAudioCapture = async (stream, ws) => {
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

      processor.onaudioprocess = (event) => {
        if (ws.readyState !== WebSocket.OPEN || isMuted) return;

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

      // Store processor for cleanup
      mediaRecorderRef.current = { processor, source, audioContext };
    } catch (err) {
      console.error('[ProxySession] Failed to start audio capture:', err);
    }
  };

  /**
   * Queue audio for playback
   * ElevenLabs Conversational AI sends raw PCM16 audio
   */
  const queueAudio = (arrayBuffer) => {
    audioQueueRef.current.push(arrayBuffer);
    if (!isPlayingRef.current) {
      playNextAudio();
    }
  };

  /**
   * Play next audio in queue using Web Audio API
   * ElevenLabs sends PCM16 audio at specific sample rates (16000, 22050, or 24000 Hz)
   */
  const playNextAudio = async () => {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      return;
    }

    isPlayingRef.current = true;
    const arrayBuffer = audioQueueRef.current.shift();

    try {
      // ElevenLabs Conversational AI typically outputs at 16000Hz
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
      const startTime = Math.max(currentTime, nextPlayTimeRef.current);

      source.start(startTime);

      // Update next play time for seamless scheduling
      nextPlayTimeRef.current = startTime + audioBuffer.duration;

      // When this chunk ends, play next
      source.onended = () => {
        playNextAudio();
      };
    } catch (err) {
      console.error('[ProxySession] Audio playback error:', err);
      playNextAudio(); // Try next audio
    }
  };

  /**
   * End the conversation and perform analysis
   */
  const endConversation = async () => {
    // Close dialog first
    setShowEndDialog(false);

    // Stop audio playback immediately
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // Clear audio queue
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    nextPlayTimeRef.current = 0;

    // Stop microphone
    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.processor) {
        mediaRecorderRef.current.processor.disconnect();
      }
      if (mediaRecorderRef.current.source) {
        mediaRecorderRef.current.source.disconnect();
      }
      mediaRecorderRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Close audio contexts
    if (playbackContextRef.current && playbackContextRef.current.state !== 'closed') {
      playbackContextRef.current.close().catch(() => {});
      playbackContextRef.current = null;
    }
    if (captureContextRef.current && captureContextRef.current.state !== 'closed') {
      captureContextRef.current.close().catch(() => {});
      captureContextRef.current = null;
    }

    // Calculate final duration before async operations
    const finalDuration = startTimeRef.current
      ? Math.floor((Date.now() - startTimeRef.current) / 1000)
      : duration;

    // Check if we have a session and transcript
    if (!sessionId) {
      console.error('[ProxySession] No session ID, cannot save');
      cleanup();
      if (onEnd) onEnd();
      return;
    }

    if (transcriptRef.current.length === 0) {
      setError('Das Gespräch war zu kurz. Bitte versuche es erneut.');
      return;
    }

    // Analyze transcript - SET ANALYZING STATE HERE (matches RoleplaySession.jsx exactly)
    try {
      setIsAnalyzing(true);
      setAnalysisStep('audio');
      // Build scenario context for analysis
      const scenarioContext = {
        title: scenario.title || 'Live-Simulation',
        description: scenario.description || '',
        variables: variables,
        role_type: scenario.role_type || 'simulation',
        user_role_label: scenario.user_role_label || 'Teilnehmer',
        interviewer_profile: scenario.interviewer_profile,
        feedback_prompt: scenario.feedback_prompt,
      };

      // 1. FIRST: Download audio from ElevenLabs via HTTPS (needed for audio analysis)
      let audioBlob = null;
      let audioUrl = null;

      if (conversationIdRef.current) {
        try {
          const audioResult = await wordpressAPI.saveAudioFromElevenLabs(
            conversationIdRef.current,
            sessionId
          );

          // Get the audio URL from the response (API returns 'url', not 'audio_url')
          audioUrl = audioResult?.data?.url;

          // Fetch the audio as a Blob for Gemini analysis
          if (audioUrl) {
            try {
              const audioResponse = await fetch(audioUrl);
              if (audioResponse.ok) {
                audioBlob = await audioResponse.blob();
              }
            } catch (fetchError) {
              console.warn('[ProxySession] Failed to fetch audio blob:', fetchError.message);
            }
          }
        } catch (audioError) {
          console.warn('[ProxySession] Failed to save audio:', audioError.message);
        }
      }

      // 2. Run analysis WITH the audio blob (if available)
      setAnalysisStep('transcript');
      const analysis = await analyzeRoleplayTranscript(
        transcriptRef.current,
        scenarioContext,
        audioBlob, // Pass audio blob for Gemini audio analysis
        setAnalysisStep // Callback for step progress
      );

      // 3. Save analysis to database (with conversation_id if available)
      // Parameter order: sessionId, transcript, feedbackJson, audioAnalysisJson, duration, conversationId
      setAnalysisStep('saving');
      await saveRoleplaySessionAnalysis(
        sessionId,
        transcriptRef.current,
        analysis.feedbackContent,
        analysis.audioAnalysisContent, // audioAnalysisJson (4th parameter)
        finalDuration,                 // duration (5th parameter)
        conversationIdRef.current      // conversationId (6th parameter)
      );

      // Navigate to session results
      setIsAnalyzing(false);
      setAnalysisStep(null);
      if (onNavigateToSession && sessionId) {
        const sessionForNavigation = {
          id: sessionId,
          scenario_id: scenario.id,
          transcript: JSON.stringify(transcriptRef.current),
          feedback_json: analysis.feedbackContent,
          audio_analysis_json: analysis.audioAnalysisContent,
          audio_url: audioUrl, // Include the saved audio URL
          duration: finalDuration,
          conversation_id: conversationIdRef.current,
          created_at: new Date().toISOString(),
        };
        onNavigateToSession(sessionForNavigation);
      }

    } catch (err) {
      console.error('❌ [ProxySession] Analysis failed:', err);
      setError(err.message || 'Fehler bei der Analyse.');
      setIsAnalyzing(false);
      setAnalysisStep(null);
    }
  };

  /**
   * Cleanup resources
   */
  const cleanup = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // Clean up audio processor
    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.processor) {
        mediaRecorderRef.current.processor.disconnect();
      }
      if (mediaRecorderRef.current.source) {
        mediaRecorderRef.current.source.disconnect();
      }
      mediaRecorderRef.current = null;
    }

    // Close capture audio context
    if (captureContextRef.current && captureContextRef.current.state !== 'closed') {
      captureContextRef.current.close();
      captureContextRef.current = null;
    }

    // Close playback audio context
    if (playbackContextRef.current && playbackContextRef.current.state !== 'closed') {
      playbackContextRef.current.close();
      playbackContextRef.current = null;
    }

    // Reset audio scheduling
    nextPlayTimeRef.current = 0;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    audioQueueRef.current = [];
    conversationIdRef.current = null;
    setStatus('disconnected');
  };

  /**
   * Toggle mute
   */
  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => {
        track.enabled = isMuted; // Toggle opposite
      });
    }
  };

  // Analyzing state - Full screen blocking overlay to prevent navigation
  if (isAnalyzing) {
    const currentStep = analysisStep ? analysisSteps[analysisStep] : { label: 'Wird vorbereitet...', progress: 5 };
    const stepOrder = ['audio', 'transcript', 'audio_analysis', 'saving'];
    const currentStepIndex = stepOrder.indexOf(analysisStep);

    return (
      <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/30 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center"
        >
          <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4" style={{ color: themedStyles.primaryAccent }} />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Feedback wird generiert...</h2>
          <motion.p
            key={analysisStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-slate-600 min-h-[24px]"
          >
            {currentStep.label}
          </motion.p>
          <div className="mt-6">
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <motion.div
                className="h-full"
                style={{ background: themedStyles.headerGradient }}
                initial={{ width: '0%' }}
                animate={{ width: `${currentStep.progress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>
          {/* Step indicators */}
          <div className="mt-6 flex justify-center gap-2">
            {stepOrder.map((step, index) => (
              <div
                key={step}
                className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                  index < currentStepIndex
                    ? 'bg-green-500'
                    : index === currentStepIndex
                    ? 'bg-blue-500'
                    : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  // Error state
  if (error && status === 'disconnected') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/30 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center"
        >
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Verbindungsfehler</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <div className="flex gap-3">
            <Button onClick={onEnd} variant="outline" className="flex-1">
              Zurück
            </Button>
            <Button onClick={startConversation} className="flex-1">
              Erneut versuchen
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <div style={{ height: 'calc(100vh - 120px)', minHeight: '600px' }} className="bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/30 p-2 lg:p-4 overflow-hidden">
        <div
          className="w-full h-full gap-3 lg:gap-4 overflow-hidden"
          style={{
            display: isMobile ? 'flex' : 'grid',
            flexDirection: isMobile ? 'column' : undefined,
            gridTemplateColumns: isMobile ? undefined : 'minmax(250px, 1fr) minmax(350px, 2fr) minmax(250px, 1fr)',
            padding: '0 8px',
          }}
        >
          {/* LEFT COLUMN - Coaching Panel */}
          {!isMobile && (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="relative h-full">
              <CoachingPanel
                hints={scenario.coaching_hints}
                dynamicCoaching={dynamicCoaching}
                isGenerating={isCoachingGenerating}
                isConnected={status === 'connected'}
              />
            </motion.div>
          )}

          {/* CENTER COLUMN - Main Interface */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col min-h-[400px]"
          >
            {/* Header */}
            <div style={{ background: themedStyles.headerGradient }} className="rounded-t-2xl px-4 lg:px-6 py-3 lg:py-4 shadow-xl">
              {/* Connection Mode Badge */}
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full">
                  <Wifi className="w-3.5 h-3.5 text-white" />
                  <span className="text-xs font-medium text-white">
                    {connectionMode === CONNECTION_MODES.DIRECT ? 'Direkt' : 'Proxy'} (WebSocket + Buffer)
                  </span>
                </div>
              </div>

              {/* Profile Info */}
              <div className="flex items-center justify-center gap-4 mb-3">
                {scenario.interviewer_profile?.image_url ? (
                  <img
                    src={scenario.interviewer_profile.image_url}
                    alt={scenario.interviewer_profile.name}
                    className="w-20 h-20 rounded-full border-4 border-white shadow-md object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full border-4 border-white shadow-md bg-white flex items-center justify-center">
                    <User className="w-10 h-10 text-slate-400" />
                  </div>
                )}
              </div>

              <h2 className="text-xl lg:text-2xl font-bold text-white text-center mb-1">
                {scenario.interviewer_profile?.name || scenario.title}
              </h2>

              {/* Status */}
              {status === 'connected' && (
                <div className="flex items-center justify-center gap-3 pt-3 border-t border-white/20">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-sm font-semibold text-white">Verbunden</span>
                  </div>
                  <div className="h-4 w-px bg-white/30" />
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-white" />
                    <span className="font-mono text-sm font-semibold text-white">{formatDuration(duration)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="bg-white px-4 py-3 shadow-xl flex justify-center gap-3">
              <button
                onClick={() => setShowDeviceSettings(true)}
                className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                <Settings className="w-5 h-5 text-slate-600" />
              </button>

              {status === 'disconnected' ? (
                <Button
                  onClick={startConversation}
                  size="lg"
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold text-base py-6 px-8 rounded-xl shadow-lg"
                >
                  <Phone className="w-5 h-5 mr-2" />
                  Gespräch starten
                </Button>
              ) : status === 'connecting' ? (
                <Button
                  disabled
                  size="lg"
                  className="bg-slate-400 text-white font-semibold text-base py-6 px-8 rounded-xl"
                >
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Verbinde...
                </Button>
              ) : (
                <>
                  <Button
                    onClick={toggleMute}
                    size="lg"
                    variant={isMuted ? 'destructive' : 'outline'}
                    className="rounded-xl"
                  >
                    {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </Button>
                  <Button
                    onClick={() => setShowEndDialog(true)}
                    size="lg"
                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold text-base py-6 px-8 rounded-xl shadow-lg"
                  >
                    <PhoneOff className="w-5 h-5 mr-2" />
                    Beenden
                  </Button>
                </>
              )}
            </div>

            {/* Profile Content */}
            <div className="flex-1 overflow-y-auto bg-white rounded-b-2xl shadow-xl">
              {scenario.interviewer_profile && (
                <InterviewerProfile profile={scenario.interviewer_profile} />
              )}
            </div>
          </motion.div>

          {/* RIGHT COLUMN - Transcript */}
          {!isMobile && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="h-full min-h-0 overflow-hidden"
            >
              <div className="h-full min-h-0 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col">
                <div style={{ background: themedStyles.headerGradient }} className="px-4 py-3 flex items-center flex-shrink-0">
                  <div className="flex items-center gap-2" style={{ color: themedStyles.headerText }}>
                    <MessageSquare className="w-4 h-4" />
                    <h3 className="font-bold text-sm">Live-Transkript</h3>
                  </div>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
                  {transcript.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center text-slate-500">
                        <MessageSquare className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                        <p className="text-xs">Das Gespräch erscheint hier in Echtzeit</p>
                      </div>
                    </div>
                  ) : (
                    <AnimatePresence>
                      {transcript.map((entry, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex gap-2 ${entry.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                        >
                          <div className="flex-shrink-0">
                            {entry.role === 'agent' ? (
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center"
                                style={{ background: themedStyles.headerGradient }}
                              >
                                <Bot className="w-4 h-4 text-white" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-indigo-600">
                                <User className="w-4 h-4 text-white" />
                              </div>
                            )}
                          </div>

                          <div
                            className={`flex-1 px-3 py-2 rounded-xl shadow-sm ${
                              entry.role === 'agent'
                                ? 'bg-slate-50 border border-slate-200'
                                : 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white'
                            }`}
                          >
                            <p className="text-xs leading-relaxed">{entry.text}</p>
                            <span className={`text-[10px] mt-1 block ${entry.role === 'agent' ? 'text-slate-400' : 'text-indigo-100'}`}>
                              {entry.timeLabel}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                      <div ref={transcriptEndRef} />
                    </AnimatePresence>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* End Confirmation Dialog */}
      <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gespräch beenden?</DialogTitle>
            <DialogDescription>
              Möchtest du das Gespräch beenden und zur Analyse gehen?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEndDialog(false)}>
              Weitermachen
            </Button>
            <Button onClick={endConversation}>
              Beenden & Analyse
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Device Settings Dialog */}
      <DeviceSettingsDialog
        isOpen={showDeviceSettings}
        onClose={() => setShowDeviceSettings(false)}
        mode="audio"
        selectedMicrophoneId={localMicrophoneId}
        onMicrophoneChange={setLocalMicrophoneId}
      />
    </>
  );
};

export default RoleplayProxySession;
