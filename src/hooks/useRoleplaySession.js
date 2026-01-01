/**
 * useRoleplaySession Hook
 *
 * Unified hook for managing roleplay sessions.
 * Supports both direct SDK and proxy connections.
 *
 * Handles:
 * - Session creation in database
 * - Transcript management
 * - Timer/duration tracking
 * - Live coaching generation
 * - Post-session analysis
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSdkAdapter, useProxyAdapter, CONNECTION_MODES } from '@/services/conversation-adapters';
import {
  createRoleplaySession,
  analyzeRoleplayTranscript,
  saveRoleplaySessionAnalysis,
  updateRoleplaySessionConversationId,
  fetchRoleplaySessionAudio,
} from '@/services/roleplay-feedback-adapter';
import {
  generateLiveCoaching,
  shouldGenerateCoaching,
  extractCoachingContext,
} from '@/services/live-coaching-engine';
import wordpressAPI from '@/services/wordpress-api';
import { usePartner } from '@/context/PartnerContext';
import { startDialTone, stopDialTone } from '@/utils/dialTone';

/**
 * @typedef {Object} UseRoleplaySessionOptions
 * @property {Object} scenario - The scenario configuration
 * @property {Object} variables - Dynamic variables
 * @property {string} [microphoneId] - Selected microphone ID
 * @property {'direct' | 'proxy'} connectionMode - Connection mode
 * @property {function} [onNavigateToSession] - Callback for navigation after analysis
 * @property {function} [onEnd] - Callback when session ends
 */

/**
 * Unified hook for roleplay sessions
 *
 * @param {UseRoleplaySessionOptions} options
 * @returns {Object} Session state and controls
 */
export const useRoleplaySession = ({
  scenario,
  variables = {},
  microphoneId,
  connectionMode = CONNECTION_MODES.DIRECT,
  onNavigateToSession,
  onEnd,
}) => {
  // Partner context
  const { demoCode } = usePartner();

  // Session state
  const [sessionId, setSessionId] = useState(null);
  const [transcript, setTranscript] = useState([]);
  const [error, setError] = useState(null);
  const [isStarted, setIsStarted] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(null);

  // Timer state
  const [startTime, setStartTime] = useState(null);
  const [duration, setDuration] = useState(0);

  // Live coaching state
  const [dynamicCoaching, setDynamicCoaching] = useState(null);
  const [isCoachingGenerating, setIsCoachingGenerating] = useState(false);

  // Refs for stable access in callbacks
  const transcriptRef = useRef([]);
  const durationRef = useRef(0);
  const startTimeRef = useRef(null);
  const hasReceivedFirstAiMessageRef = useRef(false);

  // Message handler
  const handleMessage = useCallback((entry) => {
    if (!entry) return;

    setTranscript((prev) => {
      const updated = [...prev, entry];
      transcriptRef.current = updated;
      return updated;
    });

    // Generate coaching when agent speaks
    if (entry.role === 'agent') {
      // Stop dial tone on first AI message
      if (!hasReceivedFirstAiMessageRef.current) {
        hasReceivedFirstAiMessageRef.current = true;
        stopDialTone();
        console.log('[useRoleplaySession] First AI message received, dial tone stopped');
      }

      setTimeout(() => {
        handleGenerateCoaching(entry.text, transcriptRef.current);
      }, 100);
    }
  }, []);

  // Connection callbacks
  const handleConnect = useCallback(() => {
    const now = Date.now();
    setStartTime(now);
    startTimeRef.current = now;
  }, []);

  const handleDisconnect = useCallback(() => {
    // Will be handled by endSession
  }, []);

  const handleError = useCallback((err) => {
    console.error('[useRoleplaySession] Error:', err);
    setError(err.message || 'Ein Fehler ist aufgetreten.');
  }, []);

  // Create appropriate adapter based on connection mode
  const sdkAdapter = useSdkAdapter({
    onMessage: handleMessage,
    onConnect: handleConnect,
    onDisconnect: handleDisconnect,
    onError: handleError,
  });

  const proxyAdapter = useProxyAdapter({
    onMessage: handleMessage,
    onConnect: handleConnect,
    onDisconnect: handleDisconnect,
    onError: handleError,
  });

  // Select active adapter
  const adapter = connectionMode === CONNECTION_MODES.PROXY ? proxyAdapter : sdkAdapter;

  // Get agent ID
  const agentId = useMemo(() => {
    return scenario?.agent_id || wordpressAPI.getElevenLabsAgentId();
  }, [scenario?.agent_id]);

  // Duration timer
  useEffect(() => {
    let intervalId = null;

    if (adapter.status === 'connected' && startTime) {
      intervalId = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setDuration(elapsed);
        durationRef.current = elapsed;
      }, 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [adapter.status, startTime]);

  // Generate live coaching
  const handleGenerateCoaching = useCallback(async (agentMessage, currentTranscript) => {
    const geminiApiKey = wordpressAPI.getGeminiApiKey();
    if (!geminiApiKey) {
      console.warn('[COACHING] No Gemini API key available');
      return;
    }

    if (!shouldGenerateCoaching({ role: 'agent', text: agentMessage })) {
      return;
    }

    try {
      setIsCoachingGenerating(true);
      setDynamicCoaching(null);

      const coaching = await generateLiveCoaching({
        apiKey: geminiApiKey,
        nextAgentInput: agentMessage,
        transcriptHistory: currentTranscript.slice(-4),
        scenarioContext: extractCoachingContext(scenario),
      });

      setDynamicCoaching(coaching);
    } catch (err) {
      console.error('[COACHING] Failed to generate coaching:', err);
    } finally {
      setIsCoachingGenerating(false);
    }
  }, [scenario]);

  /**
   * Start the conversation
   */
  const startSession = useCallback(async () => {
    try {
      setIsStarted(true);
      setError(null);

      // Reset first message tracking and start dial tone
      hasReceivedFirstAiMessageRef.current = false;
      await startDialTone({
        frequency: 425,     // German standard
        onDuration: 1000,   // 1 second on
        offDuration: 4000,  // 4 seconds off
        volume: 0.3,        // Audible volume
      });

      // Create session in database
      const currentUser = wordpressAPI.getCurrentUser();
      const sessionData = {
        agent_id: agentId,
        scenario_id: scenario?.id > 0 ? scenario.id : null,
        variables,
        user_name: currentUser?.firstName || 'Gast',
        demo_code: demoCode || null,
        connection_mode: connectionMode,
      };

      const createdSession = await createRoleplaySession(sessionData);
      setSessionId(createdSession.id);

      // Connect using adapter
      const conversationId = await adapter.connect({
        agentId,
        scenario,
        variables,
        microphoneId,
        demoCode,
      });

      console.log(`[useRoleplaySession] Connected via ${connectionMode}, conversation ID:`, conversationId);

      // Log prompt for debugging
      if (connectionMode === CONNECTION_MODES.DIRECT) {
        wordpressAPI.logPrompt(
          'ELEVENLABS_LIVE_SESSION',
          `Live-Training gestartet: ${scenario?.title}`,
          scenario?.content || '',
          {
            scenario_id: scenario?.id,
            scenario_title: scenario?.title,
            agent_id: agentId,
            voice_id: scenario?.voice_id,
            conversation_id: conversationId,
            connection_mode: connectionMode,
          }
        );
      }
    } catch (err) {
      console.error('[useRoleplaySession] Failed to start:', err);
      stopDialTone(); // Stop dial tone on error
      setError(err.message || 'Verbindung fehlgeschlagen.');
      setIsStarted(false);
    }
  }, [agentId, scenario, variables, microphoneId, demoCode, connectionMode, adapter]);

  /**
   * End the conversation and analyze
   */
  const endSession = useCallback(async () => {
    // Stop dial tone if still playing
    stopDialTone();

    // Get conversation ID BEFORE disconnecting (cleanup clears it)
    const conversationId = adapter.getConversationId();

    // Disconnect
    adapter.disconnect();

    // Calculate final duration
    const finalDuration = startTimeRef.current
      ? Math.floor((Date.now() - startTimeRef.current) / 1000)
      : durationRef.current;

    // Check if we have data
    if (!sessionId) {
      console.error('[useRoleplaySession] No session ID');
      onEnd?.();
      return;
    }

    if (transcriptRef.current.length === 0) {
      setError('Das Gespräch war zu kurz. Bitte versuche es erneut.');
      return;
    }

    // Helper to ensure minimum step visibility
    const showStep = async (step, minDuration = 500) => {
      const startTime = Date.now();
      setAnalysisStep(step);
      // Ensure step is visible for at least minDuration ms
      await new Promise(resolve => setTimeout(resolve, Math.max(0, minDuration - (Date.now() - startTime))));
    };

    // Start analysis
    try {
      setIsAnalyzing(true);
      await showStep('audio', 800);

      const scenarioContext = {
        title: scenario?.title || 'Live-Simulation',
        description: scenario?.description || '',
        variables,
        role_type: scenario?.role_type || 'interview',
        user_role_label: scenario?.user_role_label || 'Bewerber',
        interviewer_profile: scenario?.interviewer_profile,
        feedback_prompt: scenario?.feedback_prompt,
      };

      // Fetch audio for analysis
      let audioBlob = null;

      if (sessionId && conversationId) {
        try {
          // Update conversation ID in database
          await updateRoleplaySessionConversationId(sessionId, conversationId);

          // For direct mode, fetch via WordPress proxy
          if (connectionMode === CONNECTION_MODES.DIRECT) {
            audioBlob = await fetchRoleplaySessionAudio(sessionId, 10, 3000);
          } else {
            // For proxy mode, save audio from ElevenLabs
            const audioResult = await wordpressAPI.saveAudioFromElevenLabs(conversationId, sessionId);
            const audioUrl = audioResult?.data?.url;

            if (audioUrl) {
              try {
                const audioResponse = await fetch(audioUrl);
                if (audioResponse.ok) {
                  audioBlob = await audioResponse.blob();
                }
              } catch (fetchError) {
                console.warn('[useRoleplaySession] Failed to fetch audio blob:', fetchError.message);
              }
            }
          }
        } catch (audioError) {
          console.warn('[useRoleplaySession] Could not fetch audio:', audioError.message);
        }
      }

      // Run analysis
      await showStep('transcript', 500);
      const analysis = await analyzeRoleplayTranscript(
        transcriptRef.current,
        scenarioContext,
        audioBlob,
        setAnalysisStep // Pass callback for step updates during analysis
      );

      // Save analysis
      await showStep('saving', 500);
      if (sessionId && conversationId) {
        await saveRoleplaySessionAnalysis(
          sessionId,
          transcriptRef.current,
          analysis.feedbackContent,
          analysis.audioAnalysisContent,
          finalDuration,
          conversationId
        );
      }

      // Navigate to results
      setIsAnalyzing(false);
      setAnalysisStep(null);

      if (onNavigateToSession && sessionId) {
        const sessionForNavigation = {
          id: sessionId,
          scenario_id: scenario?.id,
          transcript: JSON.stringify(transcriptRef.current),
          feedback_json: analysis.feedbackContent,
          audio_analysis_json: analysis.audioAnalysisContent,
          duration: finalDuration,
          conversation_id: conversationId,
          created_at: new Date().toISOString(),
        };
        onNavigateToSession(sessionForNavigation);
      }
    } catch (err) {
      console.error('[useRoleplaySession] Analysis failed:', err);
      setError(err.message || 'Fehler bei der Analyse.');
      setIsAnalyzing(false);
      setAnalysisStep(null);
    }
  }, [
    adapter,
    sessionId,
    scenario,
    variables,
    connectionMode,
    onNavigateToSession,
  ]);

  /**
   * Set muted state (only for proxy mode)
   */
  const setMuted = useCallback((muted) => {
    if (connectionMode === CONNECTION_MODES.PROXY) {
      proxyAdapter.setMuted(muted);
    }
  }, [connectionMode, proxyAdapter]);

  return {
    // State
    sessionId,
    transcript,
    error,
    isStarted,
    isAnalyzing,
    analysisStep,
    startTime,
    duration,
    dynamicCoaching,
    isCoachingGenerating,
    connectionMode,

    // Adapter status
    status: adapter.status,
    isSpeaking: adapter.speaking || false,

    // Controls
    startSession,
    endSession,
    setMuted,

    // Helpers
    clearError: () => setError(null),
  };
};

export default useRoleplaySession;
