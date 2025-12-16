import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  Square,
  Play,
  Pause,
  X,
  User,
  Bot,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Volume2,
  VolumeX,
  MessageSquare,
  Lightbulb,
  Settings,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import InterviewerProfile from './InterviewerProfile';
import CoachingPanel from './CoachingPanel';
import DeviceSettingsDialog from './DeviceSettingsDialog';
import wordpressAPI from '@/services/wordpress-api';
import { usePartner } from '@/context/PartnerContext';
import { DEFAULT_BRANDING } from '@/config/partners';

/**
 * Corporate Mode Session Component
 *
 * HTTP-based turn-by-turn interview for corporate environments
 * where WebSocket connections are blocked by firewalls.
 */
const CorporateModeSession = ({ scenario, variables = {}, selectedMicrophoneId, onEnd, onNavigateToSession }) => {
  // Partner branding
  const { branding, demoCode } = usePartner();

  // Memoized themed styles
  const themedStyles = useMemo(() => {
    const headerGradient = branding?.['--header-gradient'] || DEFAULT_BRANDING['--header-gradient'];
    const headerText = branding?.['--header-text'] || DEFAULT_BRANDING['--header-text'];
    const iconPrimary = branding?.['--icon-primary'] || DEFAULT_BRANDING['--icon-primary'];
    const primaryAccent = branding?.['--primary-accent'] || DEFAULT_BRANDING['--primary-accent'];
    const primaryAccentLight = branding?.['--primary-accent-light'] || DEFAULT_BRANDING['--primary-accent-light'];

    return {
      headerGradient,
      headerText,
      iconPrimary,
      primaryAccent,
      primaryAccentLight,
    };
  }, [branding]);

  // Session state
  const [sessionId, setSessionId] = useState(null);
  const [isStarted, setIsStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Conversation state
  const [transcript, setTranscript] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  // Audio playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudioUrl, setCurrentAudioUrl] = useState(null);

  // Timer state
  const [startTime, setStartTime] = useState(null);
  const [duration, setDuration] = useState(0);

  // UI state
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [localMicrophoneId, setLocalMicrophoneId] = useState(selectedMicrophoneId);
  const [showDeviceSettings, setShowDeviceSettings] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // Refs
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);
  const streamRef = useRef(null);
  const recordingIntervalRef = useRef(null);
  const durationIntervalRef = useRef(null);
  const transcriptEndRef = useRef(null);

  // Track mobile/desktop state
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [transcript]);

  // Duration timer
  useEffect(() => {
    if (isStarted && startTime) {
      durationIntervalRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [isStarted, startTime]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Start the corporate mode session
   */
  const handleStartSession = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${wordpressAPI.getBaseUrl()}/corporate-interview/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': wordpressAPI.getNonce(),
        },
        body: JSON.stringify({
          scenario_id: scenario.id,
          scenario_content: scenario.content,
          initial_message: scenario.initial_message,
          variables: variables,
          interviewer_profile: scenario.interviewer_profile,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Fehler beim Starten der Session');
      }

      setSessionId(data.session_id);
      setIsStarted(true);
      setStartTime(Date.now());

      // Add initial message to transcript
      setTranscript([{
        role: 'agent',
        text: data.initial_message.text,
        audioUrl: data.initial_message.audio_url,
        timestamp: Date.now(),
      }]);

      // Play initial message
      playAudio(data.initial_message.audio_url);

    } catch (err) {
      console.error('[CorporateMode] Start error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Start recording user audio
   */
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: localMicrophoneId ? { exact: localMicrophoneId } : undefined,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;
      audioChunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4';

      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.start(1000); // Collect data every second
      setIsRecording(true);
      setRecordingTime(0);

      // Start recording timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('[CorporateMode] Recording error:', err);
      setError('Mikrofon-Zugriff fehlgeschlagen. Bitte erlaube den Zugriff.');
    }
  };

  /**
   * Stop recording and process the audio
   */
  const stopRecording = async () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
      return;
    }

    // Clear recording timer
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }

    return new Promise((resolve) => {
      mediaRecorderRef.current.onstop = async () => {
        // Stop stream tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }

        setIsRecording(false);
        setIsProcessing(true);

        try {
          // Convert to base64
          const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorderRef.current.mimeType });
          const base64 = await blobToBase64(audioBlob);

          // Send to backend
          await processTurn(base64);

        } catch (err) {
          console.error('[CorporateMode] Processing error:', err);
          setError(err.message);
        } finally {
          setIsProcessing(false);
          resolve();
        }
      };

      mediaRecorderRef.current.stop();
    });
  };

  /**
   * Convert blob to base64
   */
  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  /**
   * Process a conversation turn
   */
  const processTurn = async (audioBase64, endConversation = false) => {
    try {
      const response = await fetch(`${wordpressAPI.getBaseUrl()}/corporate-interview/turn`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': wordpressAPI.getNonce(),
        },
        body: JSON.stringify({
          session_id: sessionId,
          audio_base64: audioBase64,
          end_conversation: endConversation,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Fehler bei der Verarbeitung');
      }

      // Add user message to transcript
      setTranscript(prev => [...prev, {
        role: 'user',
        text: data.user_transcript,
        timestamp: Date.now(),
      }]);

      if (data.conversation_ended) {
        // Conversation finished - navigate to results
        handleConversationEnd(data.full_transcript);
        return;
      }

      // Add interviewer response to transcript
      setTranscript(prev => [...prev, {
        role: 'agent',
        text: data.interviewer_response.text,
        audioUrl: data.interviewer_response.audio_url,
        timestamp: Date.now(),
      }]);

      // Play interviewer response
      playAudio(data.interviewer_response.audio_url);

      // Check if interview should end
      if (data.should_end) {
        setTimeout(() => {
          handleConversationEnd();
        }, 3000);
      }

    } catch (err) {
      console.error('[CorporateMode] Turn error:', err);
      throw err;
    }
  };

  /**
   * Play audio from URL
   */
  const playAudio = (url) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(url);
    audioRef.current = audio;
    setCurrentAudioUrl(url);
    setIsPlaying(true);

    audio.onended = () => {
      setIsPlaying(false);
      setCurrentAudioUrl(null);
    };

    audio.onerror = () => {
      setIsPlaying(false);
      setCurrentAudioUrl(null);
      console.error('[CorporateMode] Audio playback error');
    };

    audio.play().catch(err => {
      console.error('[CorporateMode] Audio play failed:', err);
      setIsPlaying(false);
    });
  };

  /**
   * Toggle audio playback
   */
  const toggleAudioPlayback = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  /**
   * Handle end of conversation
   */
  const handleConversationEnd = async (fullTranscript = null) => {
    setShowEndDialog(false);

    // Use provided transcript or current state
    const finalTranscript = fullTranscript || transcript;

    // Navigate to analysis (similar to RoleplaySession)
    if (onNavigateToSession) {
      const sessionForNavigation = {
        id: sessionId,
        scenario_id: scenario.id,
        transcript: JSON.stringify(finalTranscript.map(t => ({
          role: t.role === 'agent' ? 'agent' : 'user',
          text: t.text,
        }))),
        duration: duration,
        created_at: new Date().toISOString(),
        mode: 'corporate',
      };
      onNavigateToSession(sessionForNavigation);
    } else if (onEnd) {
      onEnd();
    }
  };

  /**
   * Handle manual end request
   */
  const handleEndRequest = async () => {
    setShowEndDialog(false);

    if (isRecording) {
      await stopRecording();
    }

    // Process final turn with end flag
    if (audioChunksRef.current.length > 0) {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const base64 = await blobToBase64(audioBlob);
      await processTurn(base64, true);
    } else {
      handleConversationEnd();
    }
  };

  // Error state
  if (error && !isStarted) {
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

  return (
    <>
      <div style={{ height: 'calc(100vh - 120px)', minHeight: '600px' }} className="bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 p-2 lg:p-4 overflow-hidden">
        <div
          className="w-full h-full gap-3 lg:gap-4 overflow-hidden"
          style={{
            display: isMobile ? 'flex' : 'grid',
            flexDirection: isMobile ? 'column' : undefined,
            gridTemplateColumns: isMobile ? undefined : 'minmax(250px, 1fr) minmax(350px, 2fr) minmax(250px, 1fr)',
            padding: '0 8px',
          }}
        >
          {/* LEFT COLUMN - Coaching Panel (Desktop only) */}
          {!isMobile && (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="relative h-full">
              <CoachingPanel
                hints={scenario.coaching_hints}
                isConnected={isStarted}
              />
            </motion.div>
          )}

          {/* CENTER COLUMN - Main Interface */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col min-h-[400px]"
          >
            {/* Header with Profile */}
            <div
              style={{ background: themedStyles.headerGradient }}
              className="rounded-t-2xl px-4 lg:px-6 py-3 lg:py-4 shadow-xl"
            >
              {/* Corporate Mode Badge */}
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full">
                  <WifiOff className="w-3.5 h-3.5 text-white" />
                  <span className="text-xs font-medium text-white">Corporate Modus (HTTP)</span>
                </div>
              </div>

              {/* Profile Info */}
              <div className="flex items-center justify-center gap-4 mb-3">
                {scenario.interviewer_profile?.image_url ? (
                  <img
                    src={scenario.interviewer_profile.image_url}
                    alt={scenario.interviewer_profile.name}
                    className="w-16 h-16 lg:w-20 lg:h-20 rounded-full border-4 border-white shadow-lg object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full border-4 border-white shadow-lg bg-white flex items-center justify-center">
                    <User className="w-8 h-8 lg:w-10 lg:h-10 text-slate-400" />
                  </div>
                )}
              </div>

              <h2 className="text-xl lg:text-2xl font-bold text-white text-center mb-1">
                {scenario.interviewer_profile?.name || scenario.title}
              </h2>

              {scenario.interviewer_profile?.role && (
                <p className="text-blue-100 text-center text-sm font-medium mb-3">
                  {scenario.interviewer_profile.role}
                </p>
              )}

              {/* Status */}
              {isStarted && (
                <div className="flex items-center justify-center gap-3 pt-3 border-t border-white/20">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-sm font-semibold text-white">Aktiv</span>
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
                title="Geräte-Einstellungen"
              >
                <Settings className="w-5 h-5 text-slate-600" />
              </button>

              {!isStarted ? (
                <Button
                  onClick={handleStartSession}
                  size="lg"
                  disabled={isLoading || !localMicrophoneId}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold text-base py-6 px-8 rounded-xl shadow-lg disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <Mic className="w-5 h-5 mr-2" />
                  )}
                  {isLoading ? 'Wird gestartet...' : 'Gespräch starten'}
                </Button>
              ) : (
                <Button
                  onClick={() => setShowEndDialog(true)}
                  size="lg"
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold text-base py-6 px-8 rounded-xl shadow-lg"
                >
                  <X className="w-5 h-5 mr-2" />
                  Beenden
                </Button>
              )}
            </div>

            {/* Recording Controls */}
            {isStarted && (
              <div className="bg-white px-4 py-4 border-t border-slate-200">
                <div className="flex flex-col items-center gap-3">
                  {/* Recording/Processing Status */}
                  {isProcessing ? (
                    <div className="flex items-center gap-3 text-blue-600">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span className="font-medium">Verarbeite Antwort...</span>
                    </div>
                  ) : isPlaying ? (
                    <div className="flex items-center gap-3 text-green-600">
                      <Volume2 className="w-6 h-6 animate-pulse" />
                      <span className="font-medium">Interviewer spricht...</span>
                      <button
                        onClick={toggleAudioPlayback}
                        className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200"
                      >
                        <Pause className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      {isRecording ? (
                        <>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                            <span className="font-mono text-lg font-semibold text-red-600">
                              {formatDuration(recordingTime)}
                            </span>
                          </div>
                          <Button
                            onClick={stopRecording}
                            size="lg"
                            className="bg-red-500 hover:bg-red-600 text-white rounded-full w-16 h-16"
                          >
                            <Square className="w-6 h-6" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          onClick={startRecording}
                          size="lg"
                          disabled={isPlaying}
                          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full w-16 h-16 disabled:opacity-50"
                        >
                          <Mic className="w-6 h-6" />
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Help text */}
                  <p className="text-xs text-slate-500 text-center">
                    {isRecording
                      ? 'Klicke auf Stop, wenn du fertig bist'
                      : isPlaying
                        ? 'Warte, bis der Interviewer fertig ist'
                        : 'Klicke auf das Mikrofon, um zu antworten'}
                  </p>
                </div>
              </div>
            )}

            {/* Scrollable Profile Content */}
            <div className="flex-1 overflow-y-auto bg-white rounded-b-2xl shadow-xl">
              {scenario.interviewer_profile && (
                <InterviewerProfile profile={scenario.interviewer_profile} />
              )}
            </div>
          </motion.div>

          {/* RIGHT COLUMN - Transcript (Desktop only) */}
          {!isMobile && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="h-full min-h-0 overflow-hidden"
            >
              <div className="h-full min-h-0 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col">
                <div
                  style={{ background: themedStyles.headerGradient }}
                  className="px-4 py-3 flex items-center flex-shrink-0"
                >
                  <div className="flex items-center gap-2" style={{ color: themedStyles.headerText }}>
                    <MessageSquare className="w-4 h-4" />
                    <h3 className="font-bold text-sm">Gesprächsverlauf</h3>
                  </div>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
                  {transcript.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center text-slate-500">
                        <MessageSquare className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                        <p className="text-xs">Starte das Gespräch, um den Verlauf zu sehen</p>
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
                              scenario.interviewer_profile?.image_url ? (
                                <img
                                  src={scenario.interviewer_profile.image_url}
                                  alt="Interviewer"
                                  className="w-8 h-8 rounded-full object-cover border-2 border-blue-200"
                                />
                              ) : (
                                <div
                                  className="w-8 h-8 rounded-full flex items-center justify-center"
                                  style={{ background: themedStyles.headerGradient }}
                                >
                                  <Bot className="w-4 h-4 text-white" />
                                </div>
                              )
                            ) : (
                              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-teal-500 to-teal-600">
                                <User className="w-4 h-4 text-white" />
                              </div>
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
                            {entry.audioUrl && entry.role === 'agent' && (
                              <button
                                onClick={() => playAudio(entry.audioUrl)}
                                className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                              >
                                <Play className="w-3 h-3" />
                                Abspielen
                              </button>
                            )}
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
              Möchtest du das Gespräch wirklich beenden? Du erhältst anschließend dein Feedback.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEndDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleEndRequest}>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Beenden & Feedback
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

export default CorporateModeSession;
