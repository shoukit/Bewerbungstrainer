import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConversation } from '@elevenlabs/react';
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
  Lightbulb,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import AudioVisualizer from './AudioVisualizer';
import InterviewerProfile from './InterviewerProfile';
import CoachingPanel from './CoachingPanel';
import FeedbackModal from './FeedbackModal';
import {
  analyzeRoleplayTranscript,
  saveRoleplaySessionAnalysis,
  createRoleplaySession,
} from '@/services/roleplay-feedback-adapter';
import wordpressAPI from '@/services/wordpress-api';

const RoleplaySession = ({ scenario, variables = {}, onEnd }) => {
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

  // Dynamic header height
  const [headerHeight, setHeaderHeight] = useState(80);
  const headerObserverRef = useRef(null);

  // Refs
  const durationIntervalRef = useRef(null);
  const conversationIdRef = useRef(null);
  const hasStartedRef = useRef(false);
  const transcriptEndRef = useRef(null);

  // Get API credentials
  const apiKey = wordpressAPI.getElevenLabsApiKey();
  const agentId = scenario.agent_id || wordpressAPI.getElevenLabsAgentId();

  // Build enhanced system prompt with interviewer profile
  const buildSystemPrompt = () => {
    let prompt = scenario.content || '';

    // Add interviewer profile information to system prompt
    if (scenario.interviewer_profile) {
      prompt += '\n\n## Dein Profil als Interviewer:\n';

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

  // Use official @11labs/react SDK with overrides for system prompt and first message
  const conversation = useConversation({
    overrides: {
      agent: {
        prompt: {
          prompt: buildSystemPrompt(), // Enhanced system prompt with profile
        },
        firstMessage: scenario.initial_message || 'Hallo! Ich freue mich auf unser Gespräch.',
      },
    },
    onConnect: () => {
      console.log('✅ [RoleplaySession] Connected to ElevenLabs');
      console.log('📝 [RoleplaySession] System prompt:', scenario.content?.substring(0, 100) + '...');
      console.log('💬 [RoleplaySession] First message:', scenario.initial_message);
      setStartTime(Date.now());
    },
    onDisconnect: () => {
      console.log('ℹ️ [RoleplaySession] Disconnected from ElevenLabs');
    },
    onMessage: (message) => {
      if (message.source === 'ai' || message.source === 'user') {
        // Calculate elapsed time since conversation started
        const elapsedSeconds = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
        const minutes = Math.floor(elapsedSeconds / 60);
        const seconds = elapsedSeconds % 60;
        const timeLabel = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        setTranscript((prev) => [
          ...prev,
          {
            role: message.source === 'ai' ? 'agent' : 'user',
            text: message.message,
            timestamp: Date.now(),
            elapsedTime: elapsedSeconds, // Store seconds for later seeking
            timeLabel: timeLabel, // Format: "00:12"
          },
        ]);
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
    if (conversation.status === 'disconnected' && transcript.length > 0 && !isAnalyzing) {
      console.log('🔔 [RoleplaySession] Agent ended the call - starting analysis');
      handleEndConversation();
    }
  }, [conversation.status]);

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

  const handleStartCall = async () => {
    setIsStarted(true);
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
      };

      const createdSession = await createRoleplaySession(sessionData);
      setSessionId(createdSession.id);

      console.log('🚀 [RoleplaySession] Starting:', agentId);
      console.log('🚀 [RoleplaySession] Variables:', variables);

      // Auto-inject interviewer variables from profile
      const enhancedVariables = { ...variables };
      if (scenario.interviewer_profile) {
        if (scenario.interviewer_profile.name) {
          enhancedVariables.interviewer_name = scenario.interviewer_profile.name;
        }
        if (scenario.interviewer_profile.role) {
          enhancedVariables.interviewer_role = scenario.interviewer_profile.role;
        }
        console.log('✨ [RoleplaySession] Enhanced with interviewer variables:', enhancedVariables);
      }

      // Use official SDK - pass variables as dynamicVariables (same as standard interview)
      conversationIdRef.current = await conversation.startSession({
        agentId: agentId,
        dynamicVariables: enhancedVariables,
      });

      console.log('✅ [RoleplaySession] Session started:', conversationIdRef.current);
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

    console.log('🏁 [RoleplaySession] Ending conversation');

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
      };

      const analysis = await analyzeRoleplayTranscript(transcript, scenarioContext, null);

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

      // Show feedback
      setFeedbackContent(analysis.feedbackContent);
      setAudioAnalysisContent(analysis.audioAnalysisContent);
      setIsAnalyzing(false);
      setShowFeedback(true);
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

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Feedback wird generiert...</h2>
          <p className="text-slate-600">Das kann einen Moment dauern</p>
          <div className="mt-6">
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-600 to-teal-500"
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
      <div style={{ height: `calc(100vh - ${headerHeight}px)` }} className="bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 p-2 lg:p-4 overflow-hidden flex items-center justify-center">
        {/* RESPONSIVE LAYOUT: Mobile stacked, Desktop 3-column */}
        <div className="h-full w-full max-w-[1320px] flex flex-col lg:grid lg:grid-cols-[320px_640px_320px] gap-3 lg:gap-5">

          {/* LEFT COLUMN - Coaching Panel (Desktop: sidebar, Mobile: collapsible) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden lg:block lg:h-full"
          >
            <CoachingPanel hints={scenario.coaching_hints} />
          </motion.div>

          {/* CENTER COLUMN - Interviewer Profile (Responsive) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 lg:h-full flex flex-col overflow-hidden order-1 lg:order-none"
          >
            {/* Profile Card with integrated status */}
            <div className="flex-1 overflow-y-auto">
              {scenario.interviewer_profile && scenario.interviewer_profile.name ? (
                <div className="h-full flex flex-col">
                  {/* Profile Header with Status (Responsive: compact on mobile, full on desktop) */}
                  <div className="bg-gradient-to-r from-blue-600 to-teal-500 rounded-t-2xl px-4 lg:px-6 py-3 lg:py-4 shadow-xl">
                    {/* Mobile: Horizontal compact layout */}
                    <div className="flex lg:hidden items-center gap-3 mb-2">
                      {scenario.interviewer_profile.image_url ? (
                        <img
                          src={scenario.interviewer_profile.image_url}
                          alt={scenario.interviewer_profile.name}
                          className="w-12 h-12 rounded-full border-2 border-white shadow-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full border-2 border-white shadow-lg bg-white flex items-center justify-center">
                          <User className="w-6 h-6 text-slate-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h2 className="text-lg font-bold text-white">
                          {scenario.interviewer_profile.name}
                        </h2>
                        {scenario.interviewer_profile.role && (
                          <p className="text-blue-100 text-xs font-medium">
                            {scenario.interviewer_profile.role}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Desktop: Centered vertical layout */}
                    <div className="hidden lg:block">
                      <div className="flex items-center justify-center gap-4 mb-4">
                        {scenario.interviewer_profile.image_url ? (
                          <img
                            src={scenario.interviewer_profile.image_url}
                            alt={scenario.interviewer_profile.name}
                            className="w-20 h-20 rounded-full border-4 border-white shadow-lg object-cover"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-full border-4 border-white shadow-lg bg-white flex items-center justify-center">
                            <User className="w-10 h-10 text-slate-400" />
                          </div>
                        )}
                      </div>
                      <h2 className="text-2xl font-bold text-white text-center mb-1">
                        {scenario.interviewer_profile.name}
                      </h2>
                      {scenario.interviewer_profile.role && (
                        <p className="text-blue-100 text-center text-sm font-medium mb-3">
                          {scenario.interviewer_profile.role}
                        </p>
                      )}
                    </div>

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
                  <div className="bg-white px-4 py-3 shadow-xl">
                    {!isStarted ? (
                      <Button
                        onClick={handleStartCall}
                        size="lg"
                        className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold text-base py-6 rounded-xl shadow-lg"
                      >
                        <Mic className="w-5 h-5 mr-2" />
                        {scenario.interviewer_profile?.name
                          ? `${scenario.interviewer_profile.name} anrufen`
                          : 'Anrufen'}
                      </Button>
                    ) : conversation.status === 'connected' ? (
                      <Button
                        onClick={() => setShowEndDialog(true)}
                        size="lg"
                        className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold text-base py-6 rounded-xl shadow-lg"
                      >
                        <X className="w-5 h-5 mr-2" />
                        Gespräch beenden
                      </Button>
                    ) : conversation.status === 'disconnected' ? (
                      <Button
                        disabled
                        size="lg"
                        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold text-base py-6 rounded-xl shadow-lg opacity-70 cursor-not-allowed"
                      >
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Gespräch wurde beendet...
                      </Button>
                    ) : (
                      <Button
                        disabled
                        size="lg"
                        className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold text-base py-6 rounded-xl shadow-lg opacity-50 cursor-not-allowed"
                      >
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Verbindung wird hergestellt...
                      </Button>
                    )}
                  </div>

                  {/* Scrollable Profile Content (Hidden on mobile) */}
                  <div className="hidden lg:block lg:flex-1 lg:overflow-y-auto bg-white rounded-b-2xl shadow-xl">
                    <InterviewerProfile profile={scenario.interviewer_profile} />
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 mx-auto mb-4 flex items-center justify-center">
                      <Bot className="w-12 h-12 text-white" />
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

          {/* RIGHT COLUMN - Transcript Panel (Desktop only, Mobile uses bottom sheet) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden lg:block lg:h-full"
          >
            <div className="h-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col">
              {/* Transcript Header */}
              <div className="bg-gradient-to-r from-blue-600 to-teal-500 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-white">
                  <MessageSquare className="w-4 h-4" />
                  <h3 className="font-bold text-sm">Live Transkript</h3>
                </div>
                <ChevronRight className="w-4 h-4 text-white" />
              </div>

              {/* Transcript Content - Scrollable */}
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
                        {/* Avatar with Timestamp */}
                        <div className="flex flex-col items-center gap-1 flex-shrink-0">
                          {entry.role === 'agent' ? (
                            scenario.interviewer_profile && scenario.interviewer_profile.image_url ? (
                              <img
                                src={scenario.interviewer_profile.image_url}
                                alt={scenario.interviewer_profile.name || 'Interviewer'}
                                className="w-8 h-8 rounded-full object-cover shadow-sm border-2 border-blue-200"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm bg-gradient-to-br from-blue-500 to-blue-600">
                                <Bot className="w-4 h-4 text-white" />
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
        </div>

        {/* Mobile Floating Action Buttons */}
        <div className="lg:hidden fixed bottom-4 right-4 flex flex-col gap-3 z-50">
          {/* Coaching Button */}
          <motion.button
            onClick={() => setShowCoachingOnMobile(!showCoachingOnMobile)}
            className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-teal-500 shadow-xl flex items-center justify-center text-white relative"
            whileTap={{ scale: 0.95 }}
          >
            <Lightbulb className="w-6 h-6" />
            {scenario.coaching_hints && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full text-xs font-bold flex items-center justify-center">
                {scenario.coaching_hints.split('\n').filter(Boolean).length}
              </span>
            )}
          </motion.button>

          {/* Transcript Button */}
          <motion.button
            onClick={() => setShowTranscriptOnMobile(!showTranscriptOnMobile)}
            className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-teal-500 shadow-xl flex items-center justify-center text-white relative"
            whileTap={{ scale: 0.95 }}
          >
            <MessageSquare className="w-6 h-6" />
            {transcript.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs font-bold flex items-center justify-center">
                {transcript.length}
              </span>
            )}
          </motion.button>
        </div>

        {/* Mobile Bottom Sheet - Coaching */}
        <AnimatePresence>
          {showCoachingOnMobile && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowCoachingOnMobile(false)}
                className="lg:hidden fixed inset-0 bg-black/50 z-40"
              />
              {/* Sheet */}
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="lg:hidden fixed bottom-0 left-0 right-0 z-50 max-h-[70vh] rounded-t-3xl overflow-hidden"
              >
                <div className="bg-white h-full overflow-y-auto">
                  <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-teal-500 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white">
                      <Lightbulb className="w-5 h-5" />
                      <h3 className="font-bold text-sm">Live Coaching</h3>
                    </div>
                    <button
                      onClick={() => setShowCoachingOnMobile(false)}
                      className="text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="p-4">
                    <CoachingPanel hints={scenario.coaching_hints} />
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Mobile Bottom Sheet - Transcript */}
        <AnimatePresence>
          {showTranscriptOnMobile && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowTranscriptOnMobile(false)}
                className="lg:hidden fixed inset-0 bg-black/50 z-40"
              />
              {/* Sheet */}
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="lg:hidden fixed bottom-0 left-0 right-0 z-50 max-h-[70vh] rounded-t-3xl overflow-hidden"
              >
                <div className="bg-white h-full flex flex-col">
                  <div className="bg-gradient-to-r from-blue-600 to-teal-500 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white">
                      <MessageSquare className="w-5 h-5" />
                      <h3 className="font-bold text-sm">Live Transkript</h3>
                    </div>
                    <button
                      onClick={() => setShowTranscriptOnMobile(false)}
                      className="text-white"
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
                                    alt={scenario.interviewer_profile.name || 'Interviewer'}
                                    className="w-8 h-8 rounded-full object-cover shadow-sm border-2 border-blue-200"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm bg-gradient-to-br from-blue-500 to-blue-600">
                                    <Bot className="w-4 h-4 text-white" />
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
    </>
  );
};

export default RoleplaySession;
