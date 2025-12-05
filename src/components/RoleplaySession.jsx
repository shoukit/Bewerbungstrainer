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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import AudioVisualizer from './AudioVisualizer';
import InterviewerProfile from './InterviewerProfile';
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
        setTranscript((prev) => [
          ...prev,
          {
            role: message.source === 'ai' ? 'agent' : 'user',
            text: message.message,
            timestamp: Date.now(),
          },
        ]);
      }
    },
    onError: (err) => {
      console.error('❌ [RoleplaySession] Error:', err);
      setError(err.message || 'Ein Fehler ist aufgetreten.');
    },
  });

  // Auto-scroll to newest messages
  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcript]);

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

  // Start conversation on mount
  useEffect(() => {
    if (!hasStartedRef.current && agentId && apiKey) {
      hasStartedRef.current = true;
      startConversation();
    }

    return () => {
      if (conversation.status === 'connected') {
        conversation.endSession();
      }
    };
  }, []);

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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 p-6 relative">

        {/* Transcript Panel - Top Right (Collapsible) */}
        <AnimatePresence>
          {showTranscript ? (
            <motion.div
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute top-6 right-6 w-96 h-[calc(100vh-3rem)] bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col z-20"
            >
              {/* Transcript Header */}
              <div className="bg-gradient-to-r from-blue-600 to-teal-500 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-white">
                  <MessageSquare className="w-4 h-4" />
                  <h3 className="font-bold text-sm">Live Transkript</h3>
                </div>
                <Button
                  onClick={() => setShowTranscript(false)}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20 h-8 w-8 p-0"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Transcript Content */}
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
                        {/* Avatar */}
                        {entry.role === 'agent' ? (
                          // Show interviewer photo if available
                          scenario.interviewer_profile && scenario.interviewer_profile.image_url ? (
                            <img
                              src={scenario.interviewer_profile.image_url}
                              alt={scenario.interviewer_profile.name || 'Interviewer'}
                              className="w-8 h-8 rounded-full object-cover flex-shrink-0 shadow-sm border-2 border-blue-200"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm bg-gradient-to-br from-blue-500 to-blue-600">
                              <Bot className="w-4 h-4 text-white" />
                            </div>
                          )
                        ) : (
                          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm bg-gradient-to-br from-teal-500 to-teal-600">
                            <User className="w-4 h-4 text-white" />
                          </div>
                        )}

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
            </motion.div>
          ) : (
            <motion.button
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              onClick={() => setShowTranscript(true)}
              className="absolute top-6 right-6 bg-white rounded-xl shadow-lg border border-slate-200 px-4 py-3 flex items-center gap-2 hover:bg-blue-50 transition-colors z-10 group"
            >
              <MessageSquare className="w-4 h-4 text-slate-600 group-hover:text-blue-600" />
              <span className="text-sm font-semibold text-slate-700 group-hover:text-blue-600">Live Transkript</span>
              <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* CENTERED MAIN CONTENT - Interviewer Profile */}
        <div className="flex items-center justify-center min-h-screen">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl"
          >
            {/* Audio Visualizer - Above Profile */}
            {conversation.status === 'connected' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-8"
              >
                <div className="flex justify-center mb-3">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mic className="w-4 h-4" />
                    <span className="text-sm font-medium">Spreche frei mit dem Interviewer</span>
                  </div>
                </div>
                <AudioVisualizer audioLevel={audioLevel} isActive={conversation.status === 'connected'} />
              </motion.div>
            )}

            {/* Interviewer Profile Card */}
            {scenario.interviewer_profile && scenario.interviewer_profile.name ? (
              <InterviewerProfile profile={scenario.interviewer_profile} />
            ) : (
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
            )}

            {/* Status Bar - Above Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-8 mb-4 flex items-center justify-center gap-4"
            >
              <div className="flex items-center gap-2 text-slate-700">
                {conversation.status === 'connecting' && (
                  <>
                    <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                    <span className="text-sm font-semibold">Verbinde...</span>
                  </>
                )}
                {conversation.status === 'connected' && (
                  <>
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm font-semibold">Verbunden</span>
                  </>
                )}
              </div>

              <div className="h-4 w-px bg-slate-300" />

              <div className="flex items-center gap-2 text-slate-600">
                <Clock className="w-4 h-4" />
                <span className="font-mono text-sm font-semibold">{formatDuration(duration)}</span>
              </div>
            </motion.div>

            {/* Action Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {conversation.status === 'connected' ? (
                <Button
                  onClick={() => setShowEndDialog(true)}
                  size="lg"
                  className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold text-base py-6 rounded-xl shadow-lg"
                >
                  <X className="w-5 h-5 mr-2" />
                  Gespräch beenden
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
            </motion.div>
          </motion.div>
        </div>
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
