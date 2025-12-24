import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useMobile } from '@/hooks/useMobile';
import { motion, AnimatePresence } from 'framer-motion';
import { useConversation } from '@elevenlabs/react';
import { formatDuration } from '@/utils/formatting';
import {
  Mic,
  MicOff,
  X,
  User,
  Bot,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  TrendingUp,
  MessageSquare,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Lightbulb,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import AudioVisualizer from './AudioVisualizer';
import InterviewerProfile from './InterviewerProfile';
import CoachingPanel from './CoachingPanel';
import FeedbackModal from './FeedbackModal';
import DeviceSettingsDialog from './DeviceSettingsDialog';
import {
  analyzeRoleplayTranscript,
  saveRoleplaySessionAnalysis,
  createRoleplaySession,
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
import { DEFAULT_BRANDING } from '@/config/partners';

const RoleplaySession = ({ scenario, variables = {}, selectedMicrophoneId, onEnd, onNavigateToSession }) => {
  // Partner branding and demo code
  const { branding, demoCode } = usePartner();

  // Helper function to replace {{variable}} placeholders with actual values
  const replaceVariables = (text) => {
    if (!text) return text;
    let result = text;
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, value || '');
    });
    return result;
  };

  // Memoized themed styles
  const themedStyles = useMemo(() => {
    const headerGradient = branding?.['--header-gradient'] || DEFAULT_BRANDING['--header-gradient'];
    const headerText = branding?.['--header-text'] || DEFAULT_BRANDING['--header-text'];
    const iconPrimary = branding?.['--icon-primary'] || DEFAULT_BRANDING['--icon-primary'];
    const iconSecondary = branding?.['--icon-secondary'] || DEFAULT_BRANDING['--icon-secondary'];
    const appBgColor = branding?.['--app-bg-color'] || DEFAULT_BRANDING['--app-bg-color'];
    const primaryAccent = branding?.['--primary-accent'] || DEFAULT_BRANDING['--primary-accent'];
    const primaryAccentLight = branding?.['--primary-accent-light'] || DEFAULT_BRANDING['--primary-accent-light'];

    return {
      headerGradient,
      headerText,
      iconPrimary,
      iconSecondary,
      appBgColor,
      primaryAccent,
      primaryAccentLight,
      // User message bubble gradient (keep teal for user distinction)
      userBubbleGradient: 'linear-gradient(to bottom right, #14b8a6, #0d9488)',
      // Agent avatar gradient
      agentAvatarGradient: headerGradient,
    };
  }, [branding]);

  // Session data
  const [sessionId, setSessionId] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(null);
  const [isStarted, setIsStarted] = useState(false);

  // Transcript state
  const [transcript, setTranscript] = useState([]);
  const [showTranscript, setShowTranscript] = useState(true); // Transcript panel visibility

  // End confirmation dialog
  const [showEndDialog, setShowEndDialog] = useState(false);

  // Feedback state
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackContent, setFeedbackContent] = useState(null);
  const [audioAnalysisContent, setAudioAnalysisContent] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Mobile panel state
  const [showCoachingOnMobile, setShowCoachingOnMobile] = useState(false);
  const [showTranscriptOnMobile, setShowTranscriptOnMobile] = useState(false);
  const [showProfileOnMobile, setShowProfileOnMobile] = useState(true);
  const isMobile = useMobile(1024);

  // Device settings state
  const [localMicrophoneId, setLocalMicrophoneId] = useState(selectedMicrophoneId);
  const [showDeviceSettings, setShowDeviceSettings] = useState(false);

  // Live coaching state
  const [dynamicCoaching, setDynamicCoaching] = useState(null);
  const [isCoachingGenerating, setIsCoachingGenerating] = useState(false);

  // Dynamic header height
  const [headerHeight, setHeaderHeight] = useState(80);
  const headerObserverRef = useRef(null);

  // User audio level for visualizer
  const [userAudioLevel, setUserAudioLevel] = useState(0);

  // Refs
  const durationIntervalRef = useRef(null);
  const conversationIdRef = useRef(null);
  const hasStartedRef = useRef(false);
  const transcriptEndRef = useRef(null);
  const startTimeRef = useRef(null); // Ref for stable startTime access in callbacks
  const lastMessageEndTimeRef = useRef(0); // Track when last message ended (for calculating start time)
  const lastAiEndTimeRef = useRef(0); // Track when AI last finished speaking (for user timestamp calculation)
  const transcriptRef = useRef([]); // Ref to access transcript in callbacks

  // Audio analysis refs for user voice visualization
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const userStreamRef = useRef(null);

  // Get API credentials
  const apiKey = wordpressAPI.getElevenLabsApiKey();
  const agentId = scenario.agent_id || wordpressAPI.getElevenLabsAgentId();

  // Default voice ID if not specified in scenario
  const DEFAULT_VOICE_ID = 'kaGxVtjLwllv1bi2GFag';
  const voiceId = scenario.voice_id || DEFAULT_VOICE_ID;

  // Build enhanced system prompt with interviewer profile
  const buildSystemPrompt = () => {
    let prompt = scenario.content || '';

    // Add interviewer profile information to system prompt
    if (scenario.interviewer_profile) {
      prompt += '\n\n## Dein Profil:\n';

      if (scenario.interviewer_profile.name) {
        prompt += `\nDein Name: ${scenario.interviewer_profile.name}`;
      }

      if (scenario.interviewer_profile.role) {
        prompt += `\nDeine Rolle: ${scenario.interviewer_profile.role}`;
      }

      if (scenario.interviewer_profile.properties) {
        prompt += `\n\n### Deine Eigenschaften:\n${scenario.interviewer_profile.properties}`;
      }

      if (scenario.interviewer_profile.typical_objections) {
        prompt += `\n\n### Typische Einwände, die du vorbringen solltest:\n${scenario.interviewer_profile.typical_objections}`;
      }

      if (scenario.interviewer_profile.important_questions) {
        prompt += `\n\n### Wichtige Fragen, die du stellen solltest:\n${scenario.interviewer_profile.important_questions}`;
      }
    }

    return prompt;
  };

  // Start user audio level analysis for visualizer
  const startUserAudioAnalysis = async () => {
    try {
      // Get user's microphone - separate from ElevenLabs stream
      const constraints = localMicrophoneId
        ? { audio: { deviceId: { exact: localMicrophoneId } } }
        : { audio: true };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      userStreamRef.current = stream;

      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateLevel = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        const sum = dataArray.reduce((a, b) => a + b, 0);
        const average = sum / dataArray.length;
        setUserAudioLevel(average / 255);
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      };

      updateLevel();
    } catch (err) {
      console.error('[ROLEPLAY] Audio analysis error:', err);
    }
  };

  const stopUserAudioAnalysis = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (userStreamRef.current) {
      userStreamRef.current.getTracks().forEach(track => track.stop());
      userStreamRef.current = null;
    }
    setUserAudioLevel(0);
  };

  // Generate live coaching when agent speaks
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

  // Use official @11labs/react SDK
  // NOTE: Voice must be configured directly in ElevenLabs Agent settings (overrides not supported)
  const conversation = useConversation({
    onConnect: () => {
      const now = Date.now();
      setStartTime(now);
      startTimeRef.current = now; // Also set ref for stable access in callbacks
    },
    onDisconnect: () => {
      // Session disconnected
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

          // Update both refs - AI message arrival time
          lastMessageEndTimeRef.current = currentTimeSeconds;
          lastAiEndTimeRef.current = currentTimeSeconds;
        } else {
          // For USER messages: Use when AI last finished speaking
          // This is more accurate because user transcripts arrive delayed (after STT processing)
          // The user likely started speaking right after the AI stopped
          messageStartSeconds = lastAiEndTimeRef.current;

          // Update lastMessageEndTimeRef for next AI message timing
          // but DON'T update lastAiEndTimeRef (user transcripts shouldn't affect AI timing)
          lastMessageEndTimeRef.current = currentTimeSeconds;
        }

        // Format the START time for display
        const minutes = Math.floor(messageStartSeconds / 60);
        const seconds = messageStartSeconds % 60;
        const timeLabel = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        const newEntry = {
          role: message.source === 'ai' ? 'agent' : 'user',
          text: message.message,
          timestamp: now,
          elapsedTime: messageStartSeconds, // Store START time in seconds for seeking
          timeLabel: timeLabel, // Format: "00:12" - shows START time
        };

        setTranscript((prev) => {
          const updated = [...prev, newEntry];
          transcriptRef.current = updated; // Keep ref in sync
          return updated;
        });

        // Generate coaching when agent speaks
        if (message.source === 'ai') {
          // Use setTimeout to allow state update first
          setTimeout(() => {
            handleGenerateCoaching(message.message, transcriptRef.current);
          }, 100);
        }
      }
    },
    onError: (err) => {
      console.error('❌ [RoleplaySession] Error:', err);
      setError(err.message || 'Ein Fehler ist aufgetreten.');
    },
  });

  // Auto-scroll to newest messages in transcript only
  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest'
      });
    }
  }, [transcript]);

  // Handle agent ending the call
  useEffect(() => {
    if (conversation.status === 'disconnected' && transcript.length > 0 && !isAnalyzing && !showFeedback) {
      handleEndConversation();
    }
  }, [conversation.status, transcript.length, isAnalyzing, showFeedback]);

  // Update duration every second
  useEffect(() => {
    if (conversation.status === 'connected' && startTime) {
      durationIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setDuration(elapsed);
      }, 1000);
    } else {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [conversation.status, startTime]);

  // Start/stop user audio analysis based on connection status
  useEffect(() => {
    if (conversation.status === 'connected') {
      startUserAudioAnalysis();
    } else {
      stopUserAudioAnalysis();
    }

    return () => {
      stopUserAudioAnalysis();
    };
  }, [conversation.status]);

  // Start conversation on mount - REMOVED: Now manual start with button
  useEffect(() => {
    return () => {
      if (conversation.status === 'connected') {
        conversation.endSession();
      }
    };
  }, []);

  // Dynamic header height calculation
  useEffect(() => {
    const measureHeaderHeight = () => {
      const header = document.querySelector('header, .site-header, [role="banner"]');
      if (header) {
        const height = header.offsetHeight;
        setHeaderHeight(height);
      }
    };

    // Measure on mount
    measureHeaderHeight();

    // Observe header size changes
    const header = document.querySelector('header, .site-header, [role="banner"]');
    if (header) {
      const resizeObserver = new ResizeObserver(measureHeaderHeight);
      resizeObserver.observe(header);
      headerObserverRef.current = resizeObserver;
    }

    // Also measure on window resize
    window.addEventListener('resize', measureHeaderHeight);

    return () => {
      if (headerObserverRef.current) {
        headerObserverRef.current.disconnect();
      }
      window.removeEventListener('resize', measureHeaderHeight);
    };
  }, []);

  // Prevent scroll to bottom on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);


  const handleStartCall = async () => {
    setIsStarted(true);
    // Set start time immediately when call begins
    const now = Date.now();
    setStartTime(now);
    startTimeRef.current = now; // Also set ref for stable access
    await startConversation();
  };

  const startConversation = async () => {
    try {
      setError(null);

      // Create session in database
      const currentUser = wordpressAPI.getCurrentUser();
      const sessionData = {
        agent_id: agentId,
        scenario_id: scenario.id > 0 ? scenario.id : null,
        variables: variables,
        user_name: currentUser.firstName || 'Gast',
        demo_code: demoCode || null,
      };

      const createdSession = await createRoleplaySession(sessionData);
      setSessionId(createdSession.id);

      // Auto-inject interviewer variables from profile
      const enhancedVariables = { ...variables };
      if (scenario.interviewer_profile) {
        if (scenario.interviewer_profile.name) {
          enhancedVariables.interviewer_name = scenario.interviewer_profile.name;
        }
        if (scenario.interviewer_profile.role) {
          enhancedVariables.interviewer_role = scenario.interviewer_profile.role;
        }
      }

      // Use official SDK - pass variables at session start
      // Voice override requires enabling in ElevenLabs Agent Settings -> Security -> TTS Override
      const sessionOptions = {
        agentId: agentId,
        connectionType: 'websocket', // Use websocket for override support
        dynamicVariables: enhancedVariables,
        ...(localMicrophoneId && { inputDeviceId: localMicrophoneId }),
        overrides: {
          agent: {
            prompt: {
              prompt: buildSystemPrompt(),
            },
            firstMessage: scenario.initial_message || 'Hallo! Ich freue mich auf unser Gespräch.',
          },
          ...(scenario.voice_id && {
            tts: {
              voiceId: scenario.voice_id,
            },
          }),
        },
      };

      if (scenario.voice_id) {
        console.log('[RoleplaySession] Using voice override:', scenario.voice_id);
      }

      conversationIdRef.current = await conversation.startSession(sessionOptions);

      // Log the ElevenLabs system prompt to prompts.log
      const systemPrompt = buildSystemPrompt();
      wordpressAPI.logPrompt(
        'ELEVENLABS_LIVE_SESSION',
        `Live-Training gestartet: ${scenario.title}`,
        systemPrompt,
        {
          scenario_id: scenario.id,
          scenario_title: scenario.title,
          agent_id: agentId,
          voice_id: voiceId,
          conversation_id: conversationIdRef.current,
          first_message: scenario.initial_message,
          variables: JSON.stringify(enhancedVariables),
        }
      );
    } catch (err) {
      console.error('❌ [RoleplaySession] Failed to start:', err);
      setError(err.message || 'Verbindung fehlgeschlagen.');
    }
  };

  const handleEndConversation = async () => {
    setShowEndDialog(false);

    if (conversation.status === 'connected') {
      conversation.endSession();
    }

    // Check if transcript is empty
    if (transcript.length === 0) {
      setError('Das Gespräch war zu kurz. Bitte versuche es erneut.');
      return;
    }

    // Analyze transcript
    try {
      setIsAnalyzing(true);

      const scenarioContext = {
        title: scenario.title,
        description: scenario.description,
        variables: variables,
        role_type: scenario.role_type || 'interview',
        user_role_label: scenario.user_role_label || 'Bewerber',
        interviewer_profile: scenario.interviewer_profile,
        feedback_prompt: scenario.feedback_prompt,
      };

      // Step 1: Save conversation_id to database first
      // This is required so the WordPress proxy can fetch the audio
      let audioBlob = null;
      if (sessionId && conversationIdRef.current) {
        try {
          await updateRoleplaySessionConversationId(sessionId, conversationIdRef.current);

          // Step 2: Fetch audio via WordPress proxy
          // The proxy uses the conversation_id we just saved to fetch from ElevenLabs
          audioBlob = await fetchRoleplaySessionAudio(sessionId, 10, 3000);
        } catch (audioError) {
          // Audio fetch failed - continue without audio analysis
          console.warn('[RoleplaySession] Could not fetch audio for analysis:', audioError.message);
        }
      }

      // Step 3: Run analysis (with or without audio)
      const analysis = await analyzeRoleplayTranscript(transcript, scenarioContext, audioBlob);

      // Save analysis to database
      if (sessionId && conversationIdRef.current) {
        await saveRoleplaySessionAnalysis(
          sessionId,
          transcript,
          analysis.feedbackContent,
          analysis.audioAnalysisContent,
          duration,
          conversationIdRef.current
        );
      }

      // Navigate to session detail view
      setIsAnalyzing(false);
      if (onNavigateToSession && sessionId) {
        // Create session object for navigation
        const sessionForNavigation = {
          id: sessionId,
          scenario_id: scenario.id,
          transcript: JSON.stringify(transcript),
          feedback_json: analysis.feedbackContent,
          audio_analysis_json: analysis.audioAnalysisContent,
          duration: duration,
          conversation_id: conversationIdRef.current,
          created_at: new Date().toISOString(),
        };
        onNavigateToSession(sessionForNavigation);
      } else {
        // Fallback: Show feedback modal if onNavigateToSession not provided
        setFeedbackContent(analysis.feedbackContent);
        setAudioAnalysisContent(analysis.audioAnalysisContent);
        setShowFeedback(true);
      }
    } catch (err) {
      console.error('❌ [RoleplaySession] Analysis failed:', err);
      setError(err.message || 'Fehler bei der Analyse.');
      setIsAnalyzing(false);
    }
  };

  const handleCloseFeedback = () => {
    setShowFeedback(false);
    if (onEnd) {
      onEnd();
    }
  };


  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyLabel = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return 'Einfach';
      case 'medium':
        return 'Mittel';
      case 'hard':
        return 'Schwer';
      default:
        return difficulty;
    }
  };

  // Parse coaching hints
  const parseHints = (text) => {
    if (!text) return [];
    return text.split(/\n/).map(item => item.trim()).filter(Boolean);
  };

  // Missing scenario - user likely navigated directly to this URL
  if (!scenario) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center"
        >
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Kein Szenario ausgewählt</h2>
          <p className="text-slate-600 mb-6">Bitte wähle zuerst ein Szenario aus, um eine Live-Simulation zu starten.</p>
          <Button onClick={onEnd} className="w-full">
            Zur Szenario-Auswahl
          </Button>
        </motion.div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center"
        >
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Verbindungsfehler</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <Button onClick={onEnd} className="w-full">
            Zurück zur Übersicht
          </Button>
        </motion.div>
      </div>
    );
  }

  // Analyzing state
  if (isAnalyzing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center"
        >
          <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4" style={{ color: themedStyles.iconPrimary }} />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Feedback wird generiert...</h2>
          <p className="text-slate-600">Das kann einen Moment dauern</p>
          <div className="mt-6">
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <motion.div
                className="h-full"
                style={{ background: themedStyles.headerGradient }}
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 3, repeat: Infinity }}
              />
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const audioLevel = conversation.isSpeaking ? 50 : 0;

  return (
    <>
      <div style={{ height: 'calc(100vh - 120px)', minHeight: '600px' }} className="bewerbungstrainer-session-layout bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 p-2 lg:p-4 overflow-hidden">
        {/* RESPONSIVE LAYOUT: Mobile stacked, Desktop 3-column */}
        <div
          className="w-full h-full gap-3 lg:gap-4 overflow-hidden"
          style={{
            display: isMobile ? 'flex' : 'grid',
            flexDirection: isMobile ? 'column' : undefined,
            gridTemplateColumns: isMobile ? undefined : 'minmax(250px, 1fr) minmax(350px, 2fr) minmax(250px, 1fr)',
            gridTemplateRows: isMobile ? undefined : '1fr',
            alignItems: isMobile ? undefined : 'stretch',
            padding: '0 8px',
          }}
        >

          {/* LEFT COLUMN - Coaching Panel (Desktop: sidebar, Mobile: hidden) */}
          {!isMobile && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative h-full min-h-0"
            >
              <CoachingPanel
                hints={scenario.coaching_hints}
                dynamicCoaching={dynamicCoaching}
                isGenerating={isCoachingGenerating}
                isConnected={conversation.status === 'connected'}
              />
            </motion.div>
          )}

          {/* CENTER COLUMN - Interviewer Profile (Responsive) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col min-h-[400px] order-1 lg:order-none"
          >
            {/* Profile Card with integrated status */}
            <div className="flex-1 overflow-y-auto">
              {scenario.interviewer_profile && scenario.interviewer_profile.name ? (
                <div className="h-full flex flex-col">
                  {/* Profile Header with Status (Responsive: compact on mobile, full on desktop) */}
                  <div
                    style={{ background: themedStyles.headerGradient }}
                    className="rounded-t-2xl px-4 lg:px-6 py-3 lg:py-4 shadow-xl"
                  >
                    {/* Mobile: Horizontal compact layout */}
                    {isMobile && (
                      <div className="flex items-center gap-3 mb-2">
                        {scenario.interviewer_profile.image_url ? (
                          <img
                            src={scenario.interviewer_profile.image_url}
                            alt={replaceVariables(scenario.interviewer_profile.name)}
                            className="w-12 h-12 rounded-full border-2 border-white shadow-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full border-2 border-white shadow-lg bg-white flex items-center justify-center">
                            <User className="w-6 h-6 text-slate-400" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h2 className="text-lg font-bold text-white">
                            {replaceVariables(scenario.interviewer_profile.name)}
                          </h2>
                          {scenario.interviewer_profile.role && (
                            <p className="text-blue-100 text-xs font-medium">
                              {replaceVariables(scenario.interviewer_profile.role)}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Desktop: Centered vertical layout */}
                    {!isMobile && (
                      <div>
                        <div className="flex items-center justify-center gap-4 mb-4">
                          {scenario.interviewer_profile.image_url ? (
                            <img
                              src={scenario.interviewer_profile.image_url}
                              alt={replaceVariables(scenario.interviewer_profile.name)}
                              className="w-20 h-20 rounded-full border-4 border-white shadow-lg object-cover"
                            />
                          ) : (
                            <div className="w-20 h-20 rounded-full border-4 border-white shadow-lg bg-white flex items-center justify-center">
                              <User className="w-10 h-10 text-slate-400" />
                            </div>
                          )}
                        </div>
                        <h2 className="text-2xl font-bold text-white text-center mb-1">
                          {replaceVariables(scenario.interviewer_profile.name)}
                        </h2>
                        {scenario.interviewer_profile.role && (
                          <p className="text-blue-100 text-center text-sm font-medium mb-3">
                            {replaceVariables(scenario.interviewer_profile.role)}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Status Badge on Card */}
                    {isStarted && (
                      <div className="flex items-center justify-center gap-3 pt-3 border-t border-white/20">
                        <div className="flex items-center gap-2">
                          {conversation.status === 'connecting' && (
                            <>
                              <Loader2 className="w-4 h-4 text-white animate-spin" />
                              <span className="text-sm font-semibold text-white">Verbinde...</span>
                            </>
                          )}
                          {conversation.status === 'connected' && (
                            <>
                              <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
                              <span className="text-sm font-semibold text-white">Verbunden</span>
                            </>
                          )}
                        </div>
                        <div className="h-4 w-px bg-white/30" />
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-white" />
                          <span className="font-mono text-sm font-semibold text-white">{formatDuration(duration)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Button - Between header and content */}
                  <div className="bg-white px-4 py-3 shadow-xl flex justify-center gap-3">
                    {/* Settings Button */}
                    <button
                      onClick={() => setShowDeviceSettings(true)}
                      className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
                      title="Geräte-Einstellungen"
                    >
                      <Settings className="w-5 h-5 text-slate-600" />
                    </button>
                    {!isStarted ? (
                      <Button
                        onClick={handleStartCall}
                        size="lg"
                        disabled={!localMicrophoneId}
                        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold text-base py-6 px-8 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Mic className="w-5 h-5 mr-2" />
                        {scenario.interviewer_profile?.name
                          ? `${replaceVariables(scenario.interviewer_profile.name)} anrufen`
                          : 'Anrufen'}
                      </Button>
                    ) : conversation.status === 'connected' ? (
                      <Button
                        onClick={() => setShowEndDialog(true)}
                        size="lg"
                        className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold text-base py-6 px-8 rounded-xl shadow-lg"
                      >
                        <X className="w-5 h-5 mr-2" />
                        Gespräch beenden
                      </Button>
                    ) : conversation.status === 'disconnected' ? (
                      <Button
                        disabled
                        size="lg"
                        className="bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold text-base py-6 px-8 rounded-xl shadow-lg opacity-70 cursor-not-allowed"
                      >
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Gespräch wurde beendet...
                      </Button>
                    ) : (
                      <Button
                        disabled
                        size="lg"
                        className="bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold text-base py-6 px-8 rounded-xl shadow-lg opacity-50 cursor-not-allowed"
                      >
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Verbindung wird hergestellt...
                      </Button>
                    )}
                  </div>

                  {/* Audio Visualizer - Show when connected */}
                  {conversation.status === 'connected' && (
                    <div className="bg-white px-4 py-3 border-t border-slate-100">
                      <AudioVisualizer
                        audioLevel={userAudioLevel}
                        isActive={userAudioLevel > 0.05}
                        variant="bars"
                        size="md"
                        accentColor={themedStyles.primaryAccent}
                      />
                    </div>
                  )}

                  {/* Profile Toggle Button (Mobile only) */}
                  {isMobile && (
                  <div className="bg-white px-4 py-2">
                    <button
                      onClick={() => setShowProfileOnMobile(!showProfileOnMobile)}
                      className="w-full flex items-center justify-between text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors"
                    >
                      <span>Profil-Details</span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${showProfileOnMobile ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                  )}

                  {/* Scrollable Profile Content (Mobile: collapsible, Desktop: always visible) */}
                  <AnimatePresence>
                    {(showProfileOnMobile || !isMobile) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="lg:flex-1 lg:overflow-y-auto bg-white lg:rounded-b-2xl shadow-xl overflow-hidden"
                      >
                        <InterviewerProfile profile={scenario.interviewer_profile} replaceVariables={replaceVariables} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
                    <div
                      className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center"
                      style={{ background: themedStyles.headerGradient }}
                    >
                      <Bot className="w-12 h-12" style={{ color: themedStyles.headerText }} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">{scenario.title}</h2>
                    <p className="text-slate-600 text-sm mb-6">{scenario.description}</p>
                    <span className={`inline-block px-3 py-1 rounded-lg text-xs font-semibold ${getDifficultyColor(scenario.difficulty)}`}>
                      {getDifficultyLabel(scenario.difficulty)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* RIGHT COLUMN - Transcript Panel (Desktop only, Mobile hidden) */}
          {!isMobile && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="h-full min-h-0 overflow-hidden"
            >
              <div className="h-full min-h-0 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col">
                {/* Transcript Header */}
                <div
                  style={{ background: themedStyles.headerGradient }}
                  className="px-4 py-3 flex items-center flex-shrink-0"
                >
                  <div className="flex items-center gap-2" style={{ color: themedStyles.headerText }}>
                    <MessageSquare className="w-4 h-4" />
                    <h3 className="font-bold text-sm">Live Transkript</h3>
                  </div>
                </div>

                {/* Transcript Content - Scrollable with fixed height */}
                <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
                  {transcript.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center text-slate-500">
                        <MessageSquare className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                        <p className="text-xs">Nachrichten werden während des Gesprächs angezeigt</p>
                      </div>
                    </div>
                  ) : (
                    <AnimatePresence>
                      {transcript.map((entry, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                          className={`flex gap-2 ${entry.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                        >
                          {/* Avatar with Timestamp */}
                          <div className="flex flex-col items-center gap-1 flex-shrink-0">
                            {entry.role === 'agent' ? (
                              scenario.interviewer_profile && scenario.interviewer_profile.image_url ? (
                                <img
                                  src={scenario.interviewer_profile.image_url}
                                  alt={replaceVariables(scenario.interviewer_profile.name) || 'Interviewer'}
                                  className="w-8 h-8 rounded-full object-cover shadow-sm border-2 border-blue-200"
                                />
                              ) : (
                                <div
                                  className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm"
                                  style={{ background: themedStyles.headerGradient }}
                                >
                                  <Bot className="w-4 h-4" style={{ color: themedStyles.headerText }} />
                                </div>
                              )
                            ) : (
                              <>
                                <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm bg-gradient-to-br from-teal-500 to-teal-600">
                                  <User className="w-4 h-4 text-white" />
                                </div>
                                {entry.timeLabel && (
                                  <span className="text-[10px] font-mono text-slate-400">
                                    {entry.timeLabel}
                                  </span>
                                )}
                              </>
                            )}
                          </div>

                          <div
                            className={`flex-1 px-3 py-2 rounded-xl shadow-sm ${
                              entry.role === 'agent'
                                ? 'bg-slate-50 border border-slate-200'
                                : 'bg-gradient-to-br from-teal-500 to-teal-600 text-white'
                            }`}
                          >
                            <p className="text-xs leading-relaxed">{entry.text}</p>
                          </div>
                        </motion.div>
                      ))}
                      {/* Auto-scroll anchor */}
                      <div ref={transcriptEndRef} />
                    </AnimatePresence>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Mobile Floating Action Buttons */}
        {isMobile && (
          <div className="fixed bottom-4 right-4 flex flex-col gap-3 z-50">
            {/* Coaching Button */}
            <motion.button
              onClick={() => setShowCoachingOnMobile(!showCoachingOnMobile)}
              style={{ background: themedStyles.headerGradient, color: themedStyles.headerText }}
              className="w-14 h-14 rounded-full shadow-xl flex items-center justify-center relative"
              whileTap={{ scale: 0.95 }}
            >
              <Lightbulb className="w-6 h-6" />
              {scenario.coaching_hints && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full text-xs font-bold flex items-center justify-center text-white">
                  {scenario.coaching_hints.split('\n').filter(Boolean).length}
                </span>
              )}
            </motion.button>

            {/* Transcript Button */}
            <motion.button
              onClick={() => setShowTranscriptOnMobile(!showTranscriptOnMobile)}
              style={{ background: themedStyles.headerGradient, color: themedStyles.headerText }}
              className="w-14 h-14 rounded-full shadow-xl flex items-center justify-center relative"
              whileTap={{ scale: 0.95 }}
            >
              <MessageSquare className="w-6 h-6" />
              {transcript.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs font-bold flex items-center justify-center text-white">
                  {transcript.length}
                </span>
              )}
            </motion.button>
          </div>
        )}

        {/* Mobile Bottom Sheet - Coaching */}
        <AnimatePresence>
          {showCoachingOnMobile && isMobile && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowCoachingOnMobile(false)}
                className="fixed inset-0 bg-black/50 z-40"
              />
              {/* Sheet */}
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="fixed bottom-0 left-0 right-0 z-50 max-h-[70vh] rounded-t-3xl overflow-hidden"
              >
                <div className="bg-white h-full flex flex-col">
                  <div
                    style={{ background: themedStyles.headerGradient }}
                    className="px-4 py-3 flex items-center justify-between flex-shrink-0"
                  >
                    <div className="flex items-center gap-2" style={{ color: themedStyles.headerText }}>
                      <Lightbulb className="w-5 h-5" />
                      <h3 className="font-bold text-sm">Live Coaching</h3>
                      {isCoachingGenerating && (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      )}
                    </div>
                    <button
                      onClick={() => setShowCoachingOnMobile(false)}
                      style={{ color: themedStyles.headerText }}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Show dynamic coaching when connected and available */}
                    {conversation.status === 'connected' && (dynamicCoaching || isCoachingGenerating) ? (
                      <>
                        {isCoachingGenerating && !dynamicCoaching ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="text-center text-slate-400">
                              <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
                              <p className="text-xs">Analysiere...</p>
                            </div>
                          </div>
                        ) : dynamicCoaching ? (
                          <>
                            {/* Content Impulses */}
                            {dynamicCoaching.content_impulses?.length > 0 && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  Inhalt
                                </div>
                                {dynamicCoaching.content_impulses.map((impulse, index) => (
                                  <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="flex gap-2 items-start"
                                  >
                                    <div
                                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                                      style={{ background: themedStyles.primaryAccentLight }}
                                    >
                                      <span className="text-xs font-bold" style={{ color: themedStyles.iconPrimary }}>
                                        {index + 1}
                                      </span>
                                    </div>
                                    <p className="text-sm text-slate-700 leading-snug font-medium">{impulse}</p>
                                  </motion.div>
                                ))}
                              </div>
                            )}

                            {/* Behavioral Cue */}
                            {dynamicCoaching.behavioral_cue && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 uppercase tracking-wide">
                                  <TrendingUp className="w-3.5 h-3.5" />
                                  Tonfall
                                </div>
                                <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                                  <p className="text-sm text-amber-800">{dynamicCoaching.behavioral_cue}</p>
                                </div>
                              </div>
                            )}

                            {/* Strategic Bridge */}
                            {dynamicCoaching.strategic_bridge && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 uppercase tracking-wide">
                                  <TrendingUp className="w-3.5 h-3.5" />
                                  Strategie
                                </div>
                                <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                                  <p className="text-sm text-emerald-800">{dynamicCoaching.strategic_bridge}</p>
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-center text-slate-400 py-8">
                            <Lightbulb className="w-10 h-10 mx-auto mb-2 opacity-40" />
                            <p className="text-xs">Warte auf Gesprächspartner...</p>
                          </div>
                        )}
                      </>
                    ) : (
                      /* Show static hints when not connected */
                      parseHints(scenario.coaching_hints).length === 0 ? (
                        <div className="text-center text-slate-400 py-8">
                          <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-30" />
                          <p className="text-xs">Tipps erscheinen hier während des Gesprächs</p>
                        </div>
                      ) : (
                        parseHints(scenario.coaching_hints).map((hint, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex gap-3 items-start p-3 rounded-lg"
                            style={{ backgroundColor: themedStyles.primaryAccentLight }}
                          >
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                              style={{ backgroundColor: themedStyles.primaryAccentLight }}
                            >
                              <Lightbulb className="w-3.5 h-3.5" style={{ color: themedStyles.iconPrimary }} />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-slate-700 leading-relaxed">{hint}</p>
                            </div>
                          </motion.div>
                        ))
                      )
                    )}
                  </div>
                  {/* Footer */}
                  <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex-shrink-0">
                    <p className="text-xs text-slate-500 text-center">
                      {conversation.status === 'connected'
                        ? '💡 Echtzeit-Coaching basierend auf dem Gespräch'
                        : '💡 Hilfreiche Tipps für ein erfolgreiches Gespräch'
                      }
                    </p>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Mobile Bottom Sheet - Transcript */}
        <AnimatePresence>
          {showTranscriptOnMobile && isMobile && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowTranscriptOnMobile(false)}
                className="fixed inset-0 bg-black/50 z-40"
              />
              {/* Sheet */}
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="fixed bottom-0 left-0 right-0 z-50 max-h-[70vh] rounded-t-3xl overflow-hidden"
              >
                <div className="bg-white h-full flex flex-col">
                  <div
                    style={{ background: themedStyles.headerGradient }}
                    className="px-4 py-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2" style={{ color: themedStyles.headerText }}>
                      <MessageSquare className="w-5 h-5" />
                      <h3 className="font-bold text-sm">Live Transkript</h3>
                    </div>
                    <button
                      onClick={() => setShowTranscriptOnMobile(false)}
                      style={{ color: themedStyles.headerText }}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {transcript.length === 0 ? (
                      <div className="h-full flex items-center justify-center">
                        <div className="text-center text-slate-500">
                          <MessageSquare className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                          <p className="text-xs">Nachrichten werden während des Gesprächs angezeigt</p>
                        </div>
                      </div>
                    ) : (
                      <AnimatePresence>
                        {transcript.map((entry, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className={`flex gap-2 ${entry.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                          >
                            <div className="flex flex-col items-center gap-1 flex-shrink-0">
                              {entry.role === 'agent' ? (
                                scenario.interviewer_profile && scenario.interviewer_profile.image_url ? (
                                  <img
                                    src={scenario.interviewer_profile.image_url}
                                    alt={replaceVariables(scenario.interviewer_profile.name) || 'Interviewer'}
                                    className="w-8 h-8 rounded-full object-cover shadow-sm border-2 border-blue-200"
                                  />
                                ) : (
                                  <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm"
                                    style={{ background: themedStyles.headerGradient }}
                                  >
                                    <Bot className="w-4 h-4" style={{ color: themedStyles.headerText }} />
                                  </div>
                                )
                              ) : (
                                <>
                                  <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm bg-gradient-to-br from-teal-500 to-teal-600">
                                    <User className="w-4 h-4 text-white" />
                                  </div>
                                  {entry.timeLabel && (
                                    <span className="text-[10px] font-mono text-slate-400">
                                      {entry.timeLabel}
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                            <div
                              className={`flex-1 px-3 py-2 rounded-xl shadow-sm ${
                                entry.role === 'agent'
                                  ? 'bg-slate-50 border border-slate-200'
                                  : 'bg-gradient-to-br from-teal-500 to-teal-600 text-white'
                              }`}
                            >
                              <p className="text-xs leading-relaxed">{entry.text}</p>
                            </div>
                          </motion.div>
                        ))}
                        <div ref={transcriptEndRef} />
                      </AnimatePresence>
                    )}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* End Confirmation Dialog */}
      <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gespräch beenden?</DialogTitle>
            <DialogDescription>
              Möchtest du das Rollenspiel wirklich beenden? Du erhältst anschließend dein Feedback.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEndDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleEndConversation}>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Beenden & Feedback erhalten
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Feedback Modal */}
      {showFeedback && (
        <FeedbackModal
          isOpen={showFeedback}
          onClose={handleCloseFeedback}
          feedbackContent={feedbackContent}
          audioAnalysisContent={audioAnalysisContent}
          isLoading={false}
        />
      )}

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

export default RoleplaySession;
