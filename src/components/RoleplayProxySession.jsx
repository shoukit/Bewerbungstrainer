/**
 * RoleplayProxySession Component
 *
 * Like RoleplaySession, but routes through our WebSocket proxy
 * for corporate firewall compatibility.
 *
 * Uses direct WebSocket connection instead of @elevenlabs/react SDK.
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import InterviewerProfile from './InterviewerProfile';
import CoachingPanel from './CoachingPanel';
import DeviceSettingsDialog from './DeviceSettingsDialog';
import wordpressAPI from '@/services/wordpress-api';
import { usePartner } from '@/context/PartnerContext';
import { DEFAULT_BRANDING } from '@/config/partners';

// Proxy URL - can be configured
const PROXY_URL = 'wss://karriereheld-ws-proxy.onrender.com/ws';

/**
 * RoleplayProxySession - WebSocket proxy version of RoleplaySession
 */
const RoleplayProxySession = ({
  scenario,
  variables = {},
  selectedMicrophoneId,
  onEnd,
  onNavigateToSession,
}) => {
  // Partner branding
  const { branding } = usePartner();

  const themedStyles = useMemo(() => {
    const headerGradient = branding?.['--header-gradient'] || DEFAULT_BRANDING['--header-gradient'];
    const headerText = branding?.['--header-text'] || DEFAULT_BRANDING['--header-text'];
    const primaryAccent = branding?.['--primary-accent'] || DEFAULT_BRANDING['--primary-accent'];
    return { headerGradient, headerText, primaryAccent };
  }, [branding]);

  // Connection state
  const [status, setStatus] = useState('disconnected'); // disconnected, connecting, connected
  const [error, setError] = useState(null);
  const [transcript, setTranscript] = useState([]);

  // Timer state
  const [startTime, setStartTime] = useState(null);
  const [duration, setDuration] = useState(0);

  // UI state
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showDeviceSettings, setShowDeviceSettings] = useState(false);
  const [localMicrophoneId, setLocalMicrophoneId] = useState(selectedMicrophoneId);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // Refs
  const wsRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const audioQueueRef = useRef([]);
  const isPlayingRef = useRef(false);
  const transcriptEndRef = useRef(null);
  const durationIntervalRef = useRef(null);

  // Responsive handling
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    return () => cleanup();
  }, []);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Start the conversation
   */
  const startConversation = async () => {
    setStatus('connecting');
    setError(null);

    try {
      // Get microphone access
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

      // Get agent ID
      const agentId = scenario.agent_id || wordpressAPI.getElevenLabsAgentId();

      if (!agentId) {
        throw new Error('Keine Agent-ID konfiguriert');
      }

      // Connect to proxy
      const wsUrl = `${PROXY_URL}?agent_id=${agentId}`;
      console.log('[ProxySession] Connecting to:', wsUrl);

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.binaryType = 'arraybuffer';

      ws.onopen = () => {
        console.log('[ProxySession] Connected to proxy');
        setStatus('connected');
        setStartTime(Date.now());

        // Send initial configuration
        const initMessage = {
          type: 'conversation_initiation_client_data',
          conversation_config_override: {
            agent: {
              prompt: {
                prompt: scenario.content || '',
              },
              first_message: scenario.initial_message || 'Hallo! Ich freue mich auf unser Gespräch.',
            },
          },
          dynamic_variables: variables,
        };
        ws.send(JSON.stringify(initMessage));

        // Start sending audio
        startAudioCapture(stream, ws);
      };

      ws.onmessage = (event) => {
        handleMessage(event);
      };

      ws.onclose = (event) => {
        console.log('[ProxySession] Disconnected:', event.code, event.reason);
        setStatus('disconnected');
      };

      ws.onerror = (error) => {
        console.error('[ProxySession] WebSocket error:', error);
        setError('Verbindung zum Proxy fehlgeschlagen');
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
        case 'audio':
          // Base64 encoded audio
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
        case 'transcript':
          // AI message
          if (data.agent_response_event?.agent_response || data.transcript) {
            const text = data.agent_response_event?.agent_response || data.transcript;
            addToTranscript('agent', text);
          }
          break;

        case 'user_transcript':
          // User message
          if (data.user_transcription_event?.user_transcript || data.user_transcript) {
            const text = data.user_transcription_event?.user_transcript || data.user_transcript;
            addToTranscript('user', text);
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

        case 'error':
          console.error('[ProxySession] Server error:', data);
          setError(data.message || 'Server-Fehler');
          break;

        default:
          console.log('[ProxySession] Unknown message type:', data.type);
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

    setTranscript(prev => [...prev, {
      role,
      text,
      timestamp: Date.now(),
      timeLabel: formatDuration(Math.floor((Date.now() - (startTime || Date.now())) / 1000)),
    }]);
  };

  /**
   * Start capturing and sending audio
   */
  const startAudioCapture = (stream, ws) => {
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm';

    const mediaRecorder = new MediaRecorder(stream, { mimeType });
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = async (event) => {
      if (event.data.size > 0 && ws.readyState === WebSocket.OPEN && !isMuted) {
        // Convert to base64 and send as JSON
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result.split(',')[1];
          ws.send(JSON.stringify({
            user_audio_chunk: base64,
          }));
        };
        reader.readAsDataURL(event.data);
      }
    };

    mediaRecorder.start(100); // Send chunks every 100ms
  };

  /**
   * Queue audio for playback
   */
  const queueAudio = (arrayBuffer) => {
    audioQueueRef.current.push(arrayBuffer);
    if (!isPlayingRef.current) {
      playNextAudio();
    }
  };

  /**
   * Play next audio in queue
   */
  const playNextAudio = async () => {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      return;
    }

    isPlayingRef.current = true;
    const arrayBuffer = audioQueueRef.current.shift();

    try {
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({
          sampleRate: 22050,
        });
      }

      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer.slice(0));
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);

      source.onended = () => {
        playNextAudio();
      };

      source.start();
    } catch (err) {
      console.error('[ProxySession] Audio playback error:', err);
      playNextAudio(); // Try next audio
    }
  };

  /**
   * End the conversation
   */
  const endConversation = () => {
    setShowEndDialog(false);
    cleanup();

    // Navigate to results
    if (onNavigateToSession && transcript.length > 0) {
      const sessionData = {
        id: `proxy_${Date.now()}`,
        scenario_id: scenario.id,
        transcript: JSON.stringify(transcript.map(t => ({
          role: t.role,
          text: t.text,
        }))),
        duration: duration,
        created_at: new Date().toISOString(),
        mode: 'proxy',
      };
      onNavigateToSession(sessionData);
    } else if (onEnd) {
      onEnd();
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

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    audioQueueRef.current = [];
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

  // Error state
  if (error && status === 'disconnected') {
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
          {/* LEFT COLUMN - Coaching Panel */}
          {!isMobile && (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="relative h-full">
              <CoachingPanel hints={scenario.coaching_hints} isConnected={status === 'connected'} />
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
              {/* Proxy Mode Badge */}
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full">
                  <Wifi className="w-3.5 h-3.5 text-white" />
                  <span className="text-xs font-medium text-white">Proxy Modus (WebSocket)</span>
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
                            <span className={`text-[10px] mt-1 block ${entry.role === 'agent' ? 'text-slate-400' : 'text-teal-100'}`}>
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
