/**
 * RoleplaySession Component (Unified)
 *
 * Unified component for live roleplay sessions.
 * Supports both direct SDK and WebSocket proxy connections.
 *
 * @prop {Object} scenario - Scenario configuration
 * @prop {Object} variables - Dynamic variables
 * @prop {string} selectedMicrophoneId - Selected microphone device ID
 * @prop {'direct' | 'proxy'} connectionMode - Connection mode (default: 'direct')
 * @prop {function} onEnd - Callback when session ends
 * @prop {function} onNavigateToSession - Callback for navigation after analysis
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useMobile } from '@/hooks/useMobile';
import { useRoleplaySession } from '@/hooks/useRoleplaySession';
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
  CheckCircle2,
  Clock,
  TrendingUp,
  MessageSquare,
  ChevronDown,
  Lightbulb,
  Settings,
  Wifi,
} from 'lucide-react';
import { Button } from '@/components/ui/base/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/base/dialog';
import AudioVisualizer from '@/components/ui/composite/AudioVisualizer';
import InterviewerProfile from './InterviewerProfile';
import CoachingPanel from './CoachingPanel';
import DeviceSettingsDialog from '@/components/device-setup/DeviceSettingsDialog';
import { usePartner } from '@/context/PartnerContext';
import { DEFAULT_BRANDING } from '@/config/partners';
import { CONNECTION_MODES } from '@/services/conversation-adapters';

const RoleplaySessionUnified = ({
  scenario,
  variables = {},
  selectedMicrophoneId,
  connectionMode = CONNECTION_MODES.DIRECT,
  onEnd,
  onNavigateToSession,
}) => {
  // Partner branding
  const { branding } = usePartner();

  // Use the unified session hook
  const {
    transcript,
    error,
    isStarted,
    isAnalyzing,
    analysisStep,
    duration,
    dynamicCoaching,
    isCoachingGenerating,
    status,
    isSpeaking,
    startSession,
    endSession,
    setMuted,
    clearError,
  } = useRoleplaySession({
    scenario,
    variables,
    microphoneId: selectedMicrophoneId,
    connectionMode,
    onNavigateToSession,
    onEnd,
  });

  // Local UI state
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [showDeviceSettings, setShowDeviceSettings] = useState(false);
  const [localMicrophoneId, setLocalMicrophoneId] = useState(selectedMicrophoneId);
  const [isMuted, setIsMuted] = useState(false);

  // Mobile UI state
  const [showCoachingOnMobile, setShowCoachingOnMobile] = useState(false);
  const [showTranscriptOnMobile, setShowTranscriptOnMobile] = useState(false);
  const [showProfileOnMobile, setShowProfileOnMobile] = useState(true);
  const isMobile = useMobile(1024);

  // User audio level for visualizer
  const [userAudioLevel, setUserAudioLevel] = useState(0);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const userStreamRef = useRef(null);

  // Refs
  const transcriptEndRef = useRef(null);

  // Themed styles
  const themedStyles = useMemo(() => {
    const headerGradient = branding?.['--header-gradient'] || DEFAULT_BRANDING['--header-gradient'];
    const headerText = branding?.['--header-text'] || DEFAULT_BRANDING['--header-text'];
    const primaryAccent = branding?.['--primary-accent'] || DEFAULT_BRANDING['--primary-accent'];
    const primaryAccentLight = branding?.['--primary-accent-light'] || DEFAULT_BRANDING['--primary-accent-light'];
    const iconPrimary = branding?.['--icon-primary'] || DEFAULT_BRANDING['--icon-primary'];

    return {
      headerGradient,
      headerText,
      primaryAccent,
      primaryAccentLight,
      iconPrimary,
    };
  }, [branding]);

  // Helper to replace variables
  const replaceVariables = (text) => {
    if (!text) return text;
    let result = text;
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, value || '');
    });
    return result;
  };

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [transcript]);

  // Start user audio analysis for visualizer
  const startUserAudioAnalysis = async () => {
    try {
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
      console.error('[RoleplaySession] Audio analysis error:', err);
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

  // Start/stop audio analysis based on connection
  useEffect(() => {
    if (status === 'connected') {
      startUserAudioAnalysis();
    } else {
      stopUserAudioAnalysis();
    }

    return () => stopUserAudioAnalysis();
  }, [status]);

  // Handle start call
  const handleStartCall = async () => {
    if (isMobile) {
      setShowCoachingOnMobile(true);
    }
    await startSession();
  };

  // Handle end conversation
  const handleEndConversation = () => {
    setShowEndDialog(false);
    endSession();
  };

  // Handle mute toggle
  const handleToggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    setMuted(newMuted);
  };

  // Parse coaching hints
  const parseHints = (text) => {
    if (!text) return [];
    return text.split(/\n/).map(item => item.trim()).filter(Boolean);
  };

  // Missing scenario
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
          <p className="text-slate-600 mb-6">Bitte wähle zuerst ein Szenario aus.</p>
          <Button onClick={onEnd} className="w-full">Zur Szenario-Auswahl</Button>
        </motion.div>
      </div>
    );
  }

  // Error state
  if (error && status === 'disconnected' && !isAnalyzing) {
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
          <div className="flex gap-3">
            <Button onClick={onEnd} variant="outline" className="flex-1">Zurück</Button>
            <Button onClick={() => { clearError(); startSession(); }} className="flex-1">
              Erneut versuchen
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Analysis step definitions for progress display
  const analysisSteps = {
    audio: { label: 'Audio wird abgerufen...', progress: 20 },
    transcript: { label: 'Transkript wird ausgewertet...', progress: 50 },
    audio_analysis: { label: 'Sprechweise wird analysiert...', progress: 75 },
    saving: { label: 'Ergebnisse werden gespeichert...', progress: 90 },
  };

  // Analyzing state - Full screen blocking overlay to prevent navigation
  if (isAnalyzing) {
    const currentStep = analysisStep ? analysisSteps[analysisStep] : { label: 'Wird vorbereitet...', progress: 5 };
    const stepOrder = ['audio', 'transcript', 'audio_analysis', 'saving'];
    const currentStepIndex = stepOrder.indexOf(analysisStep);

    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 50%, #f0fdfa 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
        }}
      >
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
          {/* LEFT COLUMN - Coaching Panel (Desktop) */}
          {!isMobile && (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="relative h-full min-h-0">
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
            className="flex-1 flex flex-col min-h-[400px] order-1 lg:order-none"
          >
            {/* Header */}
            <div style={{ background: themedStyles.headerGradient }} className="rounded-t-2xl px-4 lg:px-6 py-3 lg:py-4 shadow-xl">
              {/* Connection Mode Badge */}
              {connectionMode === CONNECTION_MODES.PROXY && (
                <div className="flex items-center justify-center gap-2 mb-3">
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full">
                    <Wifi className="w-3.5 h-3.5 text-white" />
                    <span className="text-xs font-medium text-white">Proxy Modus</span>
                  </div>
                </div>
              )}

              {/* Profile Info */}
              <div className="flex items-center justify-center gap-4 mb-3">
                {scenario.interviewer_profile?.image_url ? (
                  <img
                    src={scenario.interviewer_profile.image_url}
                    alt={replaceVariables(scenario.interviewer_profile.name)}
                    style={{
                      width: isMobile ? '64px' : '80px',
                      height: isMobile ? '64px' : '80px',
                      borderRadius: '50%',
                      border: isMobile ? '3px solid white' : '4px solid white',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: isMobile ? '64px' : '80px',
                      height: isMobile ? '64px' : '80px',
                      borderRadius: '50%',
                      border: isMobile ? '3px solid white' : '4px solid white',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      background: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <User className={isMobile ? 'w-8 h-8' : 'w-10 h-10'} style={{ color: '#94a3b8' }} />
                  </div>
                )}
              </div>

              <h2 className="text-xl lg:text-2xl font-bold text-white text-center mb-1">
                {replaceVariables(scenario.interviewer_profile?.name) || scenario.title}
              </h2>
              {scenario.interviewer_profile?.role && (
                <p className="text-blue-100 text-center text-sm font-medium mb-3">
                  {replaceVariables(scenario.interviewer_profile.role)}
                </p>
              )}

              {/* Status Badge */}
              {isStarted && (
                <div className="flex items-center justify-center gap-3 pt-3 border-t border-white/20">
                  <div className="flex items-center gap-2">
                    {status === 'connecting' && (
                      <>
                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                        <span className="text-sm font-semibold text-white">Verbinde...</span>
                      </>
                    )}
                    {status === 'connected' && (
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
                  onClick={handleStartCall}
                  size="lg"
                  disabled={!localMicrophoneId}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold text-base py-6 px-8 rounded-xl shadow-lg disabled:opacity-50"
                >
                  <Phone className="w-5 h-5 mr-2" />
                  {scenario.interviewer_profile?.name
                    ? `${replaceVariables(scenario.interviewer_profile.name)} anrufen`
                    : 'Anrufen'}
                </Button>
              ) : status === 'connected' ? (
                <>
                  {connectionMode === CONNECTION_MODES.PROXY && (
                    <Button
                      onClick={handleToggleMute}
                      size="lg"
                      variant={isMuted ? 'destructive' : 'outline'}
                      className="rounded-xl"
                    >
                      {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </Button>
                  )}
                  <Button
                    onClick={() => setShowEndDialog(true)}
                    size="lg"
                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold text-base py-6 px-8 rounded-xl shadow-lg"
                  >
                    <PhoneOff className="w-5 h-5 mr-2" />
                    Gespräch beenden
                  </Button>
                </>
              ) : status === 'connecting' ? (
                <Button
                  disabled
                  size="lg"
                  className="bg-slate-400 text-white font-semibold text-base py-6 px-8 rounded-xl"
                >
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Verbinde...
                </Button>
              ) : null}
            </div>

            {/* Audio Visualizer */}
            {status === 'connected' && (
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

            {/* Profile Toggle (Mobile) */}
            {isMobile && (
              <div style={{ backgroundColor: 'white', padding: '8px 16px' }}>
                <button
                  onClick={() => setShowProfileOnMobile(!showProfileOnMobile)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: themedStyles.primaryAccent,
                    backgroundColor: `${themedStyles.primaryAccent}10`,
                    border: `1px solid ${themedStyles.primaryAccent}30`,
                    borderRadius: '10px',
                    padding: '12px 16px',
                    cursor: 'pointer',
                  }}
                >
                  <span>Profil-Details</span>
                  <ChevronDown
                    size={16}
                    style={{
                      transform: showProfileOnMobile ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s',
                    }}
                  />
                </button>
              </div>
            )}

            {/* Profile Content */}
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
          </motion.div>

          {/* RIGHT COLUMN - Transcript (Desktop) */}
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
                    <h3 className="font-bold text-sm">Live Transkript</h3>
                  </div>
                </div>

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
                          className={`flex gap-2 ${entry.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                        >
                          <div className="flex flex-col items-center gap-1 flex-shrink-0">
                            {entry.role === 'agent' ? (
                              scenario.interviewer_profile?.image_url ? (
                                <img
                                  src={scenario.interviewer_profile.image_url}
                                  alt="Interviewer"
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
                              <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm bg-gradient-to-br from-teal-500 to-teal-600">
                                <User className="w-4 h-4 text-white" />
                              </div>
                            )}
                            {entry.timeLabel && (
                              <span className="text-[10px] font-mono text-slate-400">{entry.timeLabel}</span>
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
          )}
        </div>

        {/* Mobile FABs */}
        {isMobile && (
          <div className="fixed bottom-4 right-4 flex flex-col gap-3 z-50">
            <motion.button
              onClick={() => setShowCoachingOnMobile(!showCoachingOnMobile)}
              style={{ background: themedStyles.headerGradient, color: themedStyles.headerText }}
              className="w-14 h-14 rounded-full shadow-xl flex items-center justify-center relative"
              whileTap={{ scale: 0.95 }}
            >
              <Lightbulb className="w-6 h-6" />
            </motion.button>

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

        {/* Mobile Bottom Sheets omitted for brevity - use same as original */}
      </div>

      {/* End Confirmation Dialog */}
      <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gespräch beenden?</DialogTitle>
            <DialogDescription>
              Möchtest du das Gespräch beenden? Du erhältst anschließend dein Feedback.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEndDialog(false)}>Abbrechen</Button>
            <Button onClick={handleEndConversation}>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Beenden & Feedback erhalten
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

export default RoleplaySessionUnified;
