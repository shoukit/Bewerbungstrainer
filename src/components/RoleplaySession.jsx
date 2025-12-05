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

  // Get API credentials
  const apiKey = wordpressAPI.getElevenLabsApiKey();
  const agentId = scenario.agent_id || wordpressAPI.getElevenLabsAgentId();

  // Use official @11labs/react SDK with overrides for system prompt and first message
  const conversation = useConversation({
    overrides: {
      agent: {
        prompt: {
          prompt: scenario.content || '', // System prompt from scenario
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

  // Auto-scroll removed - users can manually scroll transcript

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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-7xl overflow-hidden flex flex-col md:flex-row"
          style={{ height: 'calc(100vh - 100px)', maxHeight: '900px' }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-teal-500 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {conversation.status === 'connecting' && (
                    <>
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                      <span className="text-white font-semibold">Verbinde...</span>
                    </>
                  )}
                  {conversation.status === 'connected' && (
                    <>
                      <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-white font-semibold">Verbunden</span>
                    </>
                  )}
                </div>

                <div className="h-6 w-px bg-white/30" />

                <div className="flex items-center gap-2 text-white">
                  <Clock className="w-4 h-4" />
                  <span className="font-mono">{formatDuration(duration)}</span>
                </div>
              </div>

              <Button
                onClick={() => setShowEndDialog(true)}
                variant="ghost"
                className="text-white hover:bg-white/20"
                disabled={conversation.status !== 'connected'}
              >
                <X className="w-5 h-5 mr-2" />
                Beenden
              </Button>
            </div>

            {/* Scenario info */}
            <div className="mt-3 flex items-center gap-3">
              <h2 className="text-white font-bold text-lg">{scenario.title}</h2>
              <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${getDifficultyColor(scenario.difficulty)}`}>
                {getDifficultyLabel(scenario.difficulty)}
              </span>
            </div>
          </div>

          {/* Main Content */}
          <div className="p-6 space-y-6" style={{ height: 'calc(100vh - 200px)', maxHeight: '600px' }}>
            {/* Audio Visualizer */}
            <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-6 border border-slate-200">
              <div className="text-center mb-4">
                <div className="flex items-center justify-center gap-2 text-slate-700">
                  {conversation.status === 'connected' ? (
                    <>
                      <Mic className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold">Spreche frei mit dem Agent</span>
                    </>
                  ) : (
                    <>
                      <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                      <span className="font-semibold">Verbindung wird hergestellt...</span>
                    </>
                  )}
                </div>
              </div>

              <AudioVisualizer audioLevel={audioLevel} isActive={conversation.status === 'connected'} />
            </div>

            {/* Transcript */}
            <div className="flex-1 overflow-hidden">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-5 h-5 text-slate-600" />
                <h3 className="font-semibold text-slate-900">Live-Transkript</h3>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 h-64 overflow-y-auto space-y-3 border border-slate-200">
                {transcript.length === 0 ? (
                  <div className="text-center text-slate-500 py-8">
                    <p className="text-sm">Das Gespräch wird hier live mitgeschrieben...</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {transcript.map((entry, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`flex gap-3 ${entry.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            entry.role === 'agent' ? 'bg-blue-100' : 'bg-teal-100'
                          }`}
                        >
                          {entry.role === 'agent' ? (
                            <Bot className="w-4 h-4 text-blue-600" />
                          ) : (
                            <User className="w-4 h-4 text-teal-600" />
                          )}
                        </div>

                        <div
                          className={`flex-1 px-4 py-2 rounded-2xl ${
                            entry.role === 'agent'
                              ? 'bg-white border border-slate-200'
                              : 'bg-teal-600 text-white'
                          }`}
                        >
                          <p className="text-sm">{entry.text}</p>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </div>
          </div>
        </motion.div>
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
