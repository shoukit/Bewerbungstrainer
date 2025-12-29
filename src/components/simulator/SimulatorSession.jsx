import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useMobile } from '@/hooks/useMobile';
import {
  Mic,
  MicOff,
  Square,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  RotateCcw,
  Clock,
  Loader2,
  AlertCircle,
  CheckCircle,
  X,
  Volume2,
  Lightbulb,
  Play,
  Target,
  MessageSquare,
  ArrowLeft,
  Check,
  Settings,
  Brain,
  Info
} from 'lucide-react';
import AudioVisualizer from '../AudioVisualizer';
import { formatDuration } from '@/utils/formatting';

// Icon mapping for dynamic tips from database
const iconMap = {
  target: Target,
  clock: Clock,
  mic: Mic,
  'message-square': MessageSquare,
  lightbulb: Lightbulb,
  brain: Brain,
  info: Info,
  settings: Settings,
  check: CheckCircle,
  // Fallback aliases
  Target: Target,
  Clock: Clock,
  Mic: Mic,
  MessageSquare: MessageSquare,
  Lightbulb: Lightbulb,
  Brain: Brain,
};
import { motion, AnimatePresence } from 'framer-motion';
import wordpressAPI from '@/services/wordpress-api';
import ImmediateFeedback from './ImmediateFeedback';
import ProgressBar from '@/components/ui/progress-bar';
import MicrophoneSelector from '@/components/MicrophoneSelector';
import MicrophoneTestDialog from '@/components/MicrophoneTestDialog';
import DeviceSettingsDialog from '@/components/DeviceSettingsDialog';
import FullscreenLoader from '@/components/ui/fullscreen-loader';
import { usePartner } from '@/context/PartnerContext';
import { DEFAULT_BRANDING } from '@/config/partners';
import { useBranding } from '@/hooks/useBranding';

// ProgressBar is imported from @/components/ui/progress-bar

/**
 * Question Tips Accordion Component
 */
const QuestionTips = ({ tips, primaryAccent, tipsLabel, branding }) => {
  const [isOpen, setIsOpen] = useState(true); // Default: aufgeklappt

  if (!tips || tips.length === 0) return null;

  return (
    <div
      style={{
        background: branding.cardBg,
        borderRadius: branding.radius.xl,
        border: `1px solid ${branding.borderColor}`,
        overflow: 'hidden',
      }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: `${branding.space[4]} ${branding.space[6]}`,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: branding.space[2], fontSize: branding.fontSize.base, fontWeight: branding.fontWeight.semibold, color: branding.textMain }}>
          <Lightbulb size={branding.iconSize.md} color={primaryAccent} />
          {tipsLabel || 'Tipps für diese Frage'}
        </span>
        <ChevronDown
          size={branding.iconSize.md}
          color={branding.textMuted}
          style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: branding.transition.normal }}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: `0 ${branding.space[6]} ${branding.space[6]}` }}>
              {tips.map((tip, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    gap: branding.space[3],
                    padding: `${branding.space[3]} ${branding.space[4]}`,
                    borderRadius: branding.radius.md,
                    backgroundColor: branding.warningLight,
                    marginBottom: index < tips.length - 1 ? branding.space[2] : 0,
                  }}
                >
                  <Lightbulb style={{
                    width: branding.iconSize.sm,
                    height: branding.iconSize.sm,
                    color: branding.warning,
                    flexShrink: 0,
                    marginTop: '2px',
                  }} />
                  <p style={{
                    fontSize: branding.fontSize.base,
                    color: branding.textSecondary,
                    margin: 0,
                    lineHeight: 1.5,
                  }}>
                    {tip.replace(/^Tipp \d+:\s*/i, '')}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * Timer Component
 */
const Timer = ({ seconds, maxSeconds, isRecording, branding }) => {

  const progress = maxSeconds > 0 ? (seconds / maxSeconds) * 100 : 0;
  const isWarning = progress > 75;
  const isDanger = progress > 90;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: branding.space[3],
      padding: `${branding.space[3]} ${branding.space[4]}`,
      borderRadius: branding.radius.lg,
      backgroundColor: isDanger ? branding.errorLight : isWarning ? branding.warningLight : branding.cardBgHover,
    }}>
      <Clock style={{
        width: branding.iconSize.lg,
        height: branding.iconSize.lg,
        color: isDanger ? branding.error : isWarning ? branding.warning : branding.textSecondary,
      }} />
      <span style={{
        fontSize: branding.fontSize.xl,
        fontWeight: branding.fontWeight.semibold,
        fontFamily: 'monospace',
        color: isDanger ? branding.error : isWarning ? branding.warning : branding.textSecondary,
      }}>
        {formatDuration(seconds)}
      </span>
      <span style={{ fontSize: branding.fontSize.base, color: branding.textMuted }}>
        / {formatDuration(maxSeconds)}
      </span>
    </div>
  );
};

/**
 * Audio Recorder Component - With Pause functionality
 */
const AudioRecorder = ({ onRecordingComplete, timeLimit, disabled, deviceId, themedGradient, primaryAccent, isSubmitting, labels, onOpenSettings, branding, isMobile, onStreamChange }) => {
  const [recordingState, setRecordingState] = useState('idle'); // 'idle' | 'recording' | 'paused'
  const [seconds, setSeconds] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const streamRef = useRef(null);
  const finalDurationRef = useRef(0);
  const isRecordingRef = useRef(false); // Ref for animation frame closure

  useEffect(() => {
    return () => {
      cleanupRecording();
    };
  }, []);

  useEffect(() => {
    if (recordingState === 'recording' && seconds >= timeLimit) {
      finishRecording();
    }
  }, [seconds, timeLimit, recordingState]);

  const cleanupRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      // Notify parent that stream is cleaned up
      if (onStreamChange) onStreamChange(null);
    }
  };

  const startRecording = async () => {
    try {
      setPermissionDenied(false);
      audioChunksRef.current = [];
      setSeconds(0);

      // Use 'exact' to ensure the selected device is used (matching MicrophoneTestDialog behavior)
      // If device unavailable, show error to user instead of silently using different device
      let stream;
      const constraints = {
        audio: deviceId ? { deviceId: { exact: deviceId } } : true
      };
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (constraintErr) {
        console.error('[SIMULATOR] Selected device unavailable:', constraintErr);
        // Show user-friendly error instead of silently falling back to different device
        if (constraintErr.name === 'OverconstrainedError' || constraintErr.name === 'NotFoundError') {
          setPermissionDenied(false);
          throw new Error('Das ausgewählte Mikrofon ist nicht verfügbar. Bitte wähle ein anderes Mikrofon in den Einstellungen.');
        }
        throw constraintErr;
      }
      streamRef.current = stream;
      // Notify parent of new stream for cleanup tracking
      if (onStreamChange) onStreamChange(stream);

      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;

      const updateLevel = () => {
        if (analyserRef.current && isRecordingRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(average / 255);
        }
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      };
      // Set ref before starting animation loop
      isRecordingRef.current = true;
      updateLevel();

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

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        onRecordingComplete(audioBlob, finalDurationRef.current);
      };

      mediaRecorderRef.current.start(1000);
      setRecordingState('recording');

      timerRef.current = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Error starting recording:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionDenied(true);
      }
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setRecordingState('paused');
      isRecordingRef.current = false; // Stop audio level updates
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setAudioLevel(0);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setRecordingState('recording');
      isRecordingRef.current = true; // Resume audio level updates
      timerRef.current = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    }
  };

  const finishRecording = () => {
    // Save the duration before resetting
    finalDurationRef.current = seconds;
    isRecordingRef.current = false; // Stop audio level updates

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setRecordingState('idle');
    setAudioLevel(0);
    setSeconds(0);
  };

  const handleMainButtonClick = () => {
    if (recordingState === 'idle') {
      startRecording();
    } else if (recordingState === 'recording') {
      pauseRecording();
    } else if (recordingState === 'paused') {
      resumeRecording();
    }
  };

  if (permissionDenied) {
    return (
      <div style={{ padding: '24px', borderRadius: '16px', backgroundColor: branding.errorLight, textAlign: 'center' }}>
        <MicOff style={{ width: '48px', height: '48px', color: branding.error, marginBottom: '12px' }} />
        <p style={{ color: branding.error, fontWeight: 600, margin: 0 }}>Mikrofonzugriff verweigert</p>
        <p style={{ color: branding.textSecondary, fontSize: '14px', marginTop: '8px' }}>
          Bitte erlaube den Zugriff auf dein Mikrofon in den Browser-Einstellungen.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', borderRadius: '16px', backgroundColor: branding.cardBg, border: `1px solid ${branding.borderColor}`, position: 'relative' }}>
      {/* Settings Button - Mobile: Top right corner */}
      {isMobile && (
        <button
          onClick={onOpenSettings}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            padding: '10px',
            borderRadius: '10px',
            background: branding.cardBgHover,
            border: `1px solid ${branding.borderColor}`,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Settings size={18} color={branding.textMuted} />
        </button>
      )}

      {/* Timer */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
        <Timer seconds={seconds} maxSeconds={timeLimit} isRecording={recordingState === 'recording'} branding={branding} />
      </div>

      {/* Audio Level Visualization */}
      {recordingState === 'recording' && (
        <div style={{ marginBottom: '24px' }}>
          <AudioVisualizer
            audioLevel={audioLevel}
            isActive={true}
            variant="bars"
            size="sm"
            accentColor={primaryAccent}
          />
        </div>
      )}

      {/* Paused State Indicator */}
      {recordingState === 'paused' && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', height: '60px', marginBottom: '24px', color: branding.warning }}>
          <Mic size={24} />
          <span style={{ fontSize: '16px', fontWeight: 600 }}>Aufnahme pausiert</span>
        </div>
      )}

      {/* Recording Buttons */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
        {/* Settings Button - Desktop only (mobile has it in corner) */}
        {!isMobile && (
          <button
            onClick={onOpenSettings}
            style={{
              padding: '14px',
              borderRadius: '12px',
              background: branding.cardBgHover,
              border: `1px solid ${branding.borderColor}`,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Settings size={20} color={branding.textMuted} />
          </button>
        )}

        {/* Main Button - Start/Pause/Resume */}
        <button
          onClick={handleMainButtonClick}
          disabled={disabled || isSubmitting}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
            padding: isMobile ? '14px 20px' : '14px 28px', borderRadius: '12px', border: 'none',
            flex: isMobile ? 1 : 'none',
            background: recordingState === 'idle'
              ? ((disabled || isSubmitting) ? branding.borderColor : branding.error)
              : recordingState === 'recording'
                ? branding.warning
                : branding.success,
            color: 'white', fontSize: isMobile ? '15px' : '16px', fontWeight: 600,
            cursor: (disabled || isSubmitting) ? 'not-allowed' : 'pointer',
            boxShadow: (disabled || isSubmitting) ? 'none' : '0 4px 14px rgba(0, 0, 0, 0.2)',
          }}
        >
          {recordingState === 'idle' && <><Mic style={{ width: '20px', height: '20px' }} />Aufnahme starten</>}
          {recordingState === 'recording' && <><Square style={{ width: '18px', height: '18px' }} />Pausieren</>}
          {recordingState === 'paused' && <><Play style={{ width: '18px', height: '18px' }} />Fortsetzen</>}
        </button>

        {/* Finish Button - Only when recording or paused */}
        {(recordingState === 'recording' || recordingState === 'paused') && (
          <button
            onClick={finishRecording}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: isMobile ? '14px 16px' : '14px 24px', borderRadius: '12px', border: 'none',
              flex: isMobile ? 1 : 'none',
              backgroundColor: branding.cardBgHover, color: branding.textMain,
              fontSize: isMobile ? '15px' : '16px', fontWeight: 600, cursor: 'pointer',
            }}
          >
            <CheckCircle style={{ width: '18px', height: '18px', color: branding.success }} />
            {labels?.submitButton || 'Antwort abgeben'}
          </button>
        )}
      </div>

      {/* Recording Hint */}
      {recordingState === 'idle' && !isSubmitting && (
        <p style={{ textAlign: 'center', marginTop: '16px', color: branding.textMuted, fontSize: '14px' }}>
          {labels?.submitHint || 'Klicke auf den Button, um deine Antwort aufzunehmen'}
        </p>
      )}

      {/* Submitting State */}
      {isSubmitting && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '24px' }}>
          <Loader2 style={{ width: '32px', height: '32px', color: primaryAccent, animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '12px', color: branding.textSecondary, fontSize: '14px' }}>{labels?.analyzing || 'Antwort wird analysiert...'}</p>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.8; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

/**
 * Pre-Session View Component
 * Shows preparation tips before starting the interview
 * Order: Microphone test, Start button, then Tips
 */
const PreSessionView = ({ scenario, variables, questions, onStart, onBack, selectedMicrophoneId, onMicrophoneChange, onMicrophoneTest, themedGradient, primaryAccent, primaryAccentLight, isLoading, branding }) => {
  // Mode-based labels
  const isSimulation = scenario?.mode === 'SIMULATION';
  const questionsLabel = isSimulation ? 'Situationen' : 'Fragen';
  const timePerQuestionLabel = isSimulation ? 'Zeit pro Situation' : 'Zeit pro Frage';

  // Default tips if no custom tips are configured
  const defaultTips = [
    {
      icon: Target,
      title: 'Strukturiert antworten',
      description: 'Nutze die STAR-Methode (Situation, Task, Action, Result) für Beispiele aus deiner Erfahrung.',
    },
    {
      icon: Clock,
      title: 'Zeit im Blick behalten',
      description: `Du hast ${Math.round((scenario.time_limit_per_question || 120) / 60)} Minuten pro ${isSimulation ? 'Situation' : 'Frage'}. ${isSimulation ? 'Reagiere' : 'Antworte'} präzise, aber ausführlich genug.`,
    },
    {
      icon: Mic,
      title: 'Klar und deutlich sprechen',
      description: 'Sprich in normalem Tempo. Kurze Pausen zum Nachdenken sind völlig in Ordnung.',
    },
    {
      icon: MessageSquare,
      title: 'Konkrete Beispiele nennen',
      description: 'Belege deine Aussagen mit konkreten Beispielen und Zahlen wo möglich.',
    },
  ];

  // Use custom tips from scenario if available, otherwise use defaults
  // Supports both string arrays (legacy) and object arrays (new format)
  const generalTips = scenario.tips && Array.isArray(scenario.tips) && scenario.tips.length > 0
    ? scenario.tips.map((tip, index) => {
        // Handle legacy string format: ["Tip text 1", "Tip text 2"]
        if (typeof tip === 'string') {
          return {
            icon: Lightbulb,
            title: `Tipp ${index + 1}`,
            description: tip,
          };
        }
        // Handle new object format: [{icon, title, text}]
        return {
          icon: iconMap[tip.icon] || iconMap[tip.icon?.toLowerCase()] || Lightbulb,
          title: tip.title || `Tipp ${index + 1}`,
          description: tip.text || tip.description || '',
        };
      })
    : defaultTips;

  // Build label lookup from input_configuration
  const inputConfigLabels = React.useMemo(() => {
    if (!scenario?.input_configuration) return {};
    try {
      const config = typeof scenario.input_configuration === 'string'
        ? JSON.parse(scenario.input_configuration)
        : scenario.input_configuration;
      if (!Array.isArray(config)) return {};
      return config.reduce((acc, field) => {
        if (field.key && field.label) {
          acc[field.key] = field.label;
        }
        return acc;
      }, {});
    } catch (e) {
      return {};
    }
  }, [scenario?.input_configuration]);

  const contextInfo = variables ? Object.entries(variables)
    .filter(([key, value]) => value && value.trim && value.trim() !== '')
    .map(([key, value]) => ({
      // Use German label from input_configuration, fallback to formatted key
      label: inputConfigLabels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: value
    })) : [];

  /**
   * Interpolate variables in text (e.g., ${variable_name} -> value)
   */
  const interpolateVariables = (text) => {
    if (!text || !variables) return text;

    let result = text;
    Object.entries(variables).forEach(([key, value]) => {
      if (value) {
        result = result.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), value);
        result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
      }
    });
    return result;
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <button
          onClick={onBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            marginBottom: '16px',
            border: 'none',
            background: 'transparent',
            color: branding.textSecondary,
            fontSize: '14px',
            cursor: 'pointer',
            borderRadius: '8px',
          }}
        >
          <ArrowLeft style={{ width: '18px', height: '18px' }} />
          Zurück
        </button>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: themedGradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Lightbulb style={{ width: '32px', height: '32px', color: 'white' }} />
          </div>
          <div>
            <h1 style={{
              fontSize: '28px',
              fontWeight: 700,
              color: branding.textMain,
              margin: 0,
            }}>
              Vorbereitung
            </h1>
            <p style={{
              fontSize: '16px',
              color: branding.textSecondary,
              margin: '4px 0 0 0',
            }}>
              {scenario.title}{questions.length > 0 ? ` • ${questions.length} ${questionsLabel}` : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Long Description - Scenario Task Description */}
      {scenario.long_description && (
        <div style={{
          padding: '20px 24px',
          borderRadius: '16px',
          backgroundColor: branding.cardBg,
          border: `1px solid ${branding.borderColor}`,
          marginBottom: '24px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px',
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: themedGradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Info style={{ width: '20px', height: '20px', color: 'white' }} />
            </div>
            <div>
              <h3 style={{
                fontSize: '16px',
                fontWeight: 600,
                color: branding.textMain,
                margin: '0 0 8px 0',
              }}>
                Deine Aufgabe
              </h3>
              <p style={{
                fontSize: '15px',
                lineHeight: '1.6',
                color: branding.textSecondary,
                margin: 0,
                whiteSpace: 'pre-wrap',
              }}>
                {interpolateVariables(scenario.long_description?.replace(/\/n/g, '\n'))}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Context Info */}
      {contextInfo.length > 0 && (
        <div style={{
          padding: '20px',
          borderRadius: '16px',
          backgroundColor: primaryAccentLight,
          marginBottom: '24px',
        }}>
          <h3 style={{
            fontSize: '14px',
            fontWeight: 600,
            color: primaryAccent,
            margin: '0 0 12px 0',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            Dein Profil
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
            {contextInfo.map((item, index) => (
              <div key={index}>
                <span style={{ fontSize: '12px', color: branding.textMuted, display: 'block' }}>
                  {item.label}
                </span>
                <span style={{ fontSize: '15px', fontWeight: 500, color: branding.textMain }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Microphone Selection - FIRST */}
      <div style={{
        padding: '24px',
        borderRadius: '16px',
        backgroundColor: branding.cardBg,
        border: `1px solid ${branding.borderColor}`,
        marginBottom: '24px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '16px',
        }}>
          <Mic style={{ width: '22px', height: '22px', color: primaryAccent }} />
          <h2 style={{
            fontSize: '18px',
            fontWeight: 600,
            color: branding.textMain,
            margin: 0,
          }}>
            Mikrofon testen
          </h2>
        </div>
        <MicrophoneSelector
          selectedDeviceId={selectedMicrophoneId}
          onDeviceChange={onMicrophoneChange}
          onTestClick={onMicrophoneTest}
        />
      </div>

      {/* Start Button - SECOND (before tips) */}
      <button
        onClick={onStart}
        disabled={isLoading}
        style={{
          width: '100%',
          padding: '18px 28px',
          borderRadius: '14px',
          border: 'none',
          background: isLoading ? branding.borderColor : themedGradient,
          color: 'white',
          fontSize: '18px',
          fontWeight: 600,
          cursor: isLoading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          boxShadow: isLoading ? 'none' : `0 4px 12px ${primaryAccent}4d`,
          marginBottom: '24px',
          opacity: isLoading ? 0.7 : 1,
        }}
      >
        <Play style={{ width: '24px', height: '24px' }} />
        Gespräch starten
      </button>

      {/* Tips Section - THIRD */}
      <div style={{
        padding: '24px',
        borderRadius: '16px',
        backgroundColor: branding.cardBg,
        border: `1px solid ${branding.borderColor}`,
        marginBottom: '24px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '20px',
        }}>
          <Lightbulb style={{ width: '22px', height: '22px', color: branding.warning }} />
          <h2 style={{
            fontSize: '18px',
            fontWeight: 600,
            color: branding.textMain,
            margin: 0,
          }}>
            Tipps für dein Gespräch
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {generalTips.map((tip, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                gap: '16px',
                padding: '16px',
                borderRadius: '12px',
                backgroundColor: branding.cardBgHover,
              }}
            >
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: primaryAccentLight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <tip.icon style={{ width: '22px', height: '22px', color: primaryAccent }} />
              </div>
              <div>
                <h4 style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  color: branding.textMain,
                  margin: '0 0 4px 0',
                }}>
                  {tip.title}
                </h4>
                <p style={{
                  fontSize: '14px',
                  color: branding.textSecondary,
                  margin: 0,
                  lineHeight: 1.5,
                }}>
                  {tip.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Session Info */}
      <div style={{
        padding: '16px 20px',
        borderRadius: '12px',
        backgroundColor: branding.cardBgHover,
        display: 'flex',
        gap: '24px',
        flexWrap: 'wrap',
      }}>
        {questions.length > 0 && (
          <div>
            <span style={{ fontSize: '12px', color: branding.textMuted, display: 'block' }}>{questionsLabel}</span>
            <span style={{ fontSize: '18px', fontWeight: 600, color: branding.textMain }}>
              {questions.length}
            </span>
          </div>
        )}
        <div>
          <span style={{ fontSize: '12px', color: branding.textMuted, display: 'block' }}>{timePerQuestionLabel}</span>
          <span style={{ fontSize: '18px', fontWeight: 600, color: branding.textMain }}>
            {Math.round((scenario.time_limit_per_question || 120) / 60)} Min
          </span>
        </div>
        <div>
          <span style={{ fontSize: '12px', color: branding.textMuted, display: 'block' }}>Wiederholen</span>
          <span style={{ fontSize: '18px', fontWeight: 600, color: branding.textMain }}>
            {scenario.allow_retry ? 'Erlaubt' : 'Nicht erlaubt'}
          </span>
        </div>
      </div>
    </div>
  );
};

/**
 * Simulator Session Component
 * Two-column layout like VideoTraining
 */
const SimulatorSession = ({
  session: initialSession,
  questions: initialQuestions,
  scenario,
  variables,
  preloadedQuestions,
  onSessionCreated,
  onComplete,
  onExit,
  startFromQuestion = 0,
  initialMicrophoneId,
}) => {
  // Mobile detection
  const isMobile = useMobile();

  // Internal state for session and questions (can be created during preparation)
  const [session, setSession] = useState(initialSession);
  const [questions, setQuestions] = useState(initialQuestions || []);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [sessionCreateError, setSessionCreateError] = useState(null);

  const { demoCode } = usePartner();

  // Mode-based labels (INTERVIEW vs SIMULATION)
  const isSimulation = scenario?.mode === 'SIMULATION';
  const labels = {
    questionLabel: isSimulation ? 'Situation / Aussage des Gegenübers:' : 'Interviewfrage:',
    questionFallback: isSimulation ? 'Situation' : 'Frage',
    questionLoading: isSimulation ? 'Situation wird geladen...' : 'Frage wird geladen...',
    answerPlaceholder: isSimulation ? 'Deine Reaktion...' : 'Deine Antwort...',
    submitButton: isSimulation ? 'Reaktion abgeben' : 'Antwort abgeben',
    submitHint: isSimulation ? 'Klicke auf den Button, um deine Reaktion aufzunehmen' : 'Klicke auf den Button, um deine Antwort aufzunehmen',
    analyzing: isSimulation ? 'Reaktion wird analysiert...' : 'Antwort wird analysiert...',
    questionCounter: (current, total) => isSimulation ? `Situation ${current} von ${total}` : `Frage ${current} von ${total}`,
    questionsCount: (count) => isSimulation ? `${count} Situationen` : `${count} Fragen`,
    answeredCount: (answered, total) => isSimulation
      ? `${answered} von ${total} Situationen`
      : `${answered} von ${total} Fragen`,
    tipsLabel: isSimulation ? 'Tipps für diese Situation' : 'Tipps für diese Frage',
    nextButton: isSimulation ? 'Nächste Situation' : 'Nächste Frage',
    timePerQuestion: isSimulation ? 'Zeit pro Situation' : 'Zeit pro Frage',
    questionsLabel: isSimulation ? 'Situationen' : 'Fragen',
    recommendedTime: isSimulation ? 'Empfohlene Reaktionszeit' : 'Empfohlene Antwortzeit',
  };

  // Determine if this is a continuation (skip preparation) or repeat (has preloaded questions)
  const isContinuation = startFromQuestion > 0;
  const isRepeat = preloadedQuestions && preloadedQuestions.length > 0;

  // Initialize with previously answered questions when continuing
  const initialAnsweredQuestions = isContinuation
    ? Array.from({ length: startFromQuestion }, (_, i) => i)
    : [];

  const [phase, setPhase] = useState(isContinuation ? 'interview' : 'preparation');
  const [currentIndex, setCurrentIndex] = useState(startFromQuestion || session?.current_question_index || 0);
  const [feedback, setFeedback] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [completedAnswers, setCompletedAnswers] = useState([]);
  const [answeredQuestions, setAnsweredQuestions] = useState(initialAnsweredQuestions);

  // Microphone selection - restore from localStorage if not provided (for session continuation)
  const MICROPHONE_STORAGE_KEY = 'karriereheld_selected_microphone';
  const [selectedMicrophoneId, setSelectedMicrophoneId] = useState(() => {
    if (initialMicrophoneId) return initialMicrophoneId;
    // Try to restore from localStorage for session continuation
    try {
      return localStorage.getItem(MICROPHONE_STORAGE_KEY) || null;
    } catch {
      return null;
    }
  });
  const [showMicrophoneTest, setShowMicrophoneTest] = useState(false);
  const [showDeviceSettings, setShowDeviceSettings] = useState(false);

  // Track active media stream for cleanup
  const activeStreamRef = useRef(null);

  // Cleanup function that can be called from anywhere
  const cleanupMediaStream = useCallback(() => {
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach(track => track.stop());
      activeStreamRef.current = null;
    }
  }, []);

  // Handler to track stream changes from AudioRecorder
  const handleStreamChange = useCallback((stream) => {
    activeStreamRef.current = stream;
  }, []);

  // Global cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupMediaStream();
    };
  }, [cleanupMediaStream]);

  // Save microphone selection to localStorage whenever it changes
  useEffect(() => {
    if (selectedMicrophoneId) {
      try {
        localStorage.setItem(MICROPHONE_STORAGE_KEY, selectedMicrophoneId);
      } catch {
        // localStorage might be unavailable
      }
    }
  }, [selectedMicrophoneId]);

  // Confirmation dialog states
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // SIMULATION mode: Pre-load next question while showing feedback
  const [isLoadingNextTurn, setIsLoadingNextTurn] = useState(false);
  const [preloadedNextQuestion, setPreloadedNextQuestion] = useState(null);
  const [isConversationFinished, setIsConversationFinished] = useState(false);

  const { branding } = usePartner();
  const b = useBranding();
  const headerGradient = branding?.['--header-gradient'] || DEFAULT_BRANDING['--header-gradient'];
  const buttonGradient = branding?.['--button-gradient'] || headerGradient;
  const primaryAccent = branding?.['--primary-accent'] || DEFAULT_BRANDING['--primary-accent'];
  const primaryAccentLight = branding?.['--primary-accent-light'] || DEFAULT_BRANDING['--primary-accent-light'];

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const isFirstQuestion = currentIndex === 0;

  const handleRecordingComplete = async (audioBlob, audioDuration) => {
    // Validate minimum audio duration (at least 2 seconds)
    if (audioDuration < 2) {
      setSubmitError('Die Aufnahme ist zu kurz. Bitte sprechen Sie mindestens 2 Sekunden.');
      return;
    }

    // Validate audio blob size (at least 5KB to have meaningful speech content)
    // Smaller files are typically silence/noise and would cause AI hallucination
    if (audioBlob.size < 5000) {
      console.warn('[SimulatorSession] Audio too small:', audioBlob.size, 'bytes');
      setSubmitError('Die Aufnahme enthält keine verwertbaren Audiodaten. Bitte sprechen Sie während der Aufnahme und versuchen Sie es erneut.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await wordpressAPI.submitSimulatorAnswer(
        session.id,
        audioBlob,
        currentIndex,
        currentQuestion.question,
        currentQuestion.category,
        audioDuration
      );

      if (!response.success) {
        throw new Error(response.message || 'Fehler beim Analysieren der Antwort');
      }

      setFeedback(response.data);
      setShowFeedback(true);

      setCompletedAnswers(prev => [
        ...prev.filter(a => a.questionIndex !== currentIndex),
        { questionIndex: currentIndex, feedback: response.data }
      ]);

      setAnsweredQuestions(prev =>
        prev.includes(currentIndex) ? prev : [...prev, currentIndex]
      );

      // SIMULATION mode: Start generating next turn in background
      if (isSimulation && !isConversationFinished) {
        setIsLoadingNextTurn(true);
        setPreloadedNextQuestion(null);

        // Check if this is a retry (user already answered this question before)
        const isRetryAttempt = answeredQuestions.includes(currentIndex);

        try {
          const nextTurnResponse = await wordpressAPI.generateNextTurn(session.id);

          if (nextTurnResponse.success) {
            const nextQuestion = nextTurnResponse.data.next_question;

            if (nextTurnResponse.data.is_finished) {
              // Conversation is ending - but we still have a final response to show
              setPreloadedNextQuestion(nextQuestion);
              if (isRetryAttempt) {
                // Replace the next question instead of appending
                setQuestions(prev => {
                  const updated = [...prev];
                  updated[currentIndex + 1] = nextQuestion;
                  return updated.slice(0, currentIndex + 2); // Remove any questions after
                });
              } else {
                setQuestions(prev => [...prev, nextQuestion]);
              }
              setIsConversationFinished(true);
            } else {
              setPreloadedNextQuestion(nextQuestion);
              if (isRetryAttempt) {
                // Replace the next question instead of appending
                setQuestions(prev => {
                  const updated = [...prev];
                  updated[currentIndex + 1] = nextQuestion;
                  return updated.slice(0, currentIndex + 2); // Remove any questions after
                });
                // Also reset conversation finished state if it was set
                setIsConversationFinished(false);
              } else {
                // First attempt - append new question
                setQuestions(prev => [...prev, nextQuestion]);
              }
            }
          }
        } catch (nextTurnErr) {
          console.error('Error generating next turn:', nextTurnErr);
          // Don't show error to user, just log it - they can still see feedback
        } finally {
          setIsLoadingNextTurn(false);
        }
      }

    } catch (err) {
      console.error('Error submitting answer:', err);
      setSubmitError(err.message || 'Ein Fehler ist aufgetreten');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setFeedback(null);
    setShowFeedback(false);
    setSubmitError(null);
  };

  const handleNext = () => {
    setFeedback(null);
    setShowFeedback(false);
    setSubmitError(null);

    if (isSimulation) {
      // SIMULATION mode: Move to the next dynamically generated question
      if (preloadedNextQuestion) {
        // There's a next question to show - move to it
        setCurrentIndex(prev => prev + 1);
        setPreloadedNextQuestion(null);
        // Don't complete yet - let user respond to this question first
        return;
      }

      // If conversation is finished AND no more questions to show, complete
      if (isConversationFinished) {
        handleCompleteSession();
        return;
      }
    } else {
      // INTERVIEW mode: Standard navigation
      if (!isLastQuestion) {
        setCurrentIndex(prev => prev + 1);
      }
    }
  };

  const handlePrev = () => {
    setFeedback(null);
    setShowFeedback(false);
    setSubmitError(null);
    if (!isFirstQuestion) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  // Show confirmation dialog for completing session
  const handleCompleteClick = () => {
    setShowCompleteConfirm(true);
  };

  // Actually complete the session after confirmation
  const handleCompleteSession = async () => {
    setShowCompleteConfirm(false);
    // Close any open dialogs to trigger their cleanup
    setShowDeviceSettings(false);
    setShowMicrophoneTest(false);
    // Explicitly cleanup any active media stream
    cleanupMediaStream();
    try {
      const response = await wordpressAPI.completeSimulatorSession(session.id);
      if (response.success) {
        onComplete(response.data);
      } else {
        onComplete({ session: { ...session, status: 'completed' } });
      }
    } catch (err) {
      console.error('Error completing session:', err);
      onComplete({ session: { ...session, status: 'completed' } });
    }
  };

  // Show confirmation dialog for canceling session
  const handleCancelClick = () => {
    setShowCancelConfirm(true);
  };

  // Actually cancel the session after confirmation
  const handleCancelSession = () => {
    setShowCancelConfirm(false);
    // Close any open dialogs to trigger their cleanup
    setShowDeviceSettings(false);
    setShowMicrophoneTest(false);
    // Explicitly cleanup any active media stream
    cleanupMediaStream();
    onExit();
  };

  const handleStartInterview = async () => {
    // If we already have a session and questions (continuation or repeat), just start
    if (session && questions.length > 0) {
      setPhase('interview');
      return;
    }

    // Otherwise, create session and generate questions
    setIsCreatingSession(true);
    setSessionCreateError(null);

    try {
      // 1. Create session with variables
      const sessionResponse = await wordpressAPI.createSimulatorSession({
        scenario_id: scenario.id,
        variables: variables,
        demo_code: demoCode || null,
        questions: preloadedQuestions || null,
      });

      if (!sessionResponse.success) {
        throw new Error(sessionResponse.message || 'Fehler beim Erstellen der Session');
      }

      const newSession = sessionResponse.data.session;

      // 2. Generate or use preloaded questions
      let newQuestions;
      if (preloadedQuestions && preloadedQuestions.length > 0) {
        newQuestions = preloadedQuestions;
        await wordpressAPI.updateSimulatorSessionQuestions(newSession.id, newQuestions);
      } else {
        const questionsResponse = await wordpressAPI.generateSimulatorQuestions(newSession.id);
        if (!questionsResponse.success) {
          throw new Error(questionsResponse.message || 'Fehler beim Generieren der Fragen');
        }
        newQuestions = questionsResponse.data.questions;
      }

      // 3. Update internal state
      setSession({ ...newSession, questions_json: newQuestions });
      setQuestions(newQuestions);

      // 4. Notify parent
      if (onSessionCreated) {
        onSessionCreated({
          session: { ...newSession, questions_json: newQuestions },
          questions: newQuestions,
          selectedMicrophoneId: selectedMicrophoneId,
        });
      }

      // 5. Start interview
      setPhase('interview');

    } catch (err) {
      console.error('Error creating session:', err);
      setSessionCreateError(err.message || 'Ein Fehler ist aufgetreten');
    } finally {
      setIsCreatingSession(false);
    }
  };

  // Show preparation view first
  if (phase === 'preparation') {
    return (
      <>
        <PreSessionView
          scenario={scenario}
          variables={variables}
          questions={questions}
          onStart={handleStartInterview}
          onBack={onExit}
          selectedMicrophoneId={selectedMicrophoneId}
          onMicrophoneChange={setSelectedMicrophoneId}
          onMicrophoneTest={() => setShowMicrophoneTest(true)}
          themedGradient={buttonGradient}
          primaryAccent={primaryAccent}
          primaryAccentLight={primaryAccentLight}
          isLoading={isCreatingSession}
          branding={b}
        />
        <MicrophoneTestDialog
          isOpen={showMicrophoneTest}
          onClose={() => setShowMicrophoneTest(false)}
          deviceId={selectedMicrophoneId}
        />

        {/* Error Display */}
        {sessionCreateError && (
          <div style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '12px 24px',
            borderRadius: '12px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            fontSize: '14px',
            fontWeight: 500,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            zIndex: 100,
          }}>
            {sessionCreateError}
          </div>
        )}

        {/* Fullscreen Loading Overlay */}
        <FullscreenLoader
          isLoading={isCreatingSession}
          message={isSimulation ? "Situationen werden generiert..." : "Fragen werden generiert..."}
          subMessage="Die KI erstellt personalisierte Inhalte basierend auf deinen Angaben."
        />
      </>
    );
  }

  return (
    <div style={{ padding: isMobile ? '16px' : '24px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header - Mobile responsive */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'stretch' : 'center',
        gap: isMobile ? '12px' : '0',
        marginBottom: '24px',
      }}>
        <h1 style={{
          fontSize: isMobile ? '18px' : '20px',
          fontWeight: 600,
          color: '#0f172a',
          margin: 0,
        }}>
          {scenario?.title}
        </h1>
        <div style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          justifyContent: isMobile ? 'space-between' : 'flex-end',
        }}>
          {/* Training beenden - hide when training is truly complete (bottom shows "Training abschließen") */}
          {!(showFeedback && (
            (isSimulation && isConversationFinished && !preloadedNextQuestion) ||
            (!isSimulation && isLastQuestion)
          )) && (
            <button
              onClick={handleCompleteClick}
              style={{
                padding: isMobile ? '10px 14px' : '8px 16px',
                borderRadius: '8px',
                background: '#22c55e',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: 'white',
                fontSize: '14px',
                fontWeight: 600,
                boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)',
                flex: isMobile ? 1 : 'none',
                justifyContent: 'center',
              }}
            >
              <Check size={16} />
              {isMobile ? 'Beenden' : 'Training beenden'}
            </button>
          )}
          <button
            onClick={handleCancelClick}
            style={{
              padding: isMobile ? '10px 14px' : '8px 16px',
              borderRadius: '8px',
              background: '#f1f5f9',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#64748b',
              fontSize: '14px',
              flex: isMobile ? 1 : 'none',
              justifyContent: 'center',
            }}
          >
            <X size={16} />
            Abbrechen
          </button>
        </div>
      </div>

      {/* Confirmation Dialog for Complete Session */}
      {showCompleteConfirm && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowCompleteConfirm(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '420px',
              width: '90%',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: '#dcfce7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Check size={24} color="#22c55e" />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                Training beenden?
              </h3>
            </div>
            {answeredQuestions.length > 0 ? (
              <>
                <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, marginBottom: '8px' }}>
                  Du hast <strong>{labels.answeredCount(answeredQuestions.length, questions.length)}</strong> beantwortet.
                </p>
                <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, marginBottom: '24px' }}>
                  Möchtest du das Training jetzt mit den bisherigen Antworten abschließen oder weitere {labels.questionsLabel} beantworten?
                </p>
              </>
            ) : (
              <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, marginBottom: '24px' }}>
                Du hast noch keine {labels.questionsLabel} beantwortet. Möchtest du das Training wirklich beenden?
              </p>
            )}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowCompleteConfirm(false)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  background: 'white',
                  color: '#64748b',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Weiter trainieren
              </button>
              <button
                onClick={handleCompleteSession}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#22c55e',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)',
                }}
              >
                Training beenden
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Cancel Session */}
      {showCancelConfirm && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowCancelConfirm(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '420px',
              width: '90%',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: '#fee2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <AlertCircle size={24} color="#ef4444" />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                Training abbrechen?
              </h3>
            </div>
            <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, marginBottom: '24px' }}>
              <strong>Achtung:</strong> Wenn du das Training abbrichst, werden alle deine bisherigen Antworten
              {answeredQuestions.length > 0 ? ` (${answeredQuestions.length} ${labels.questionsLabel})` : ''} <strong>nicht gespeichert</strong> und gehen verloren.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowCancelConfirm(false)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  background: 'white',
                  color: '#64748b',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Zurück
              </button>
              <button
                onClick={handleCancelSession}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#ef4444',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
                }}
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons - only show during recording (not feedback) and NOT in SIMULATION mode */}
      {!showFeedback && !isSimulation && (
        <div style={{
          display: 'flex',
          gap: isMobile ? '8px' : '12px',
          justifyContent: 'center',
          marginBottom: '16px',
        }}>
          <button
            onClick={handlePrev}
            disabled={isFirstQuestion}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: isMobile ? '10px 14px' : '12px 20px',
              borderRadius: '10px',
              border: `2px solid ${b.borderColor}`,
              backgroundColor: b.cardBg,
              color: isFirstQuestion ? b.textMuted : b.textSecondary,
              fontSize: isMobile ? '13px' : '14px',
              fontWeight: 600,
              cursor: isFirstQuestion ? 'not-allowed' : 'pointer',
              opacity: isFirstQuestion ? 0.5 : 1,
              flex: isMobile ? 1 : 'none',
              justifyContent: 'center',
            }}
          >
            <ChevronLeft size={16} />
            Zurück
          </button>
          <button
            onClick={handleNext}
            disabled={isLastQuestion}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: isMobile ? '10px 14px' : '12px 20px',
              borderRadius: '10px',
              border: `2px solid ${b.borderColor}`,
              backgroundColor: b.cardBg,
              color: isLastQuestion ? b.textMuted : b.textSecondary,
              fontSize: isMobile ? '13px' : '14px',
              fontWeight: 600,
              cursor: isLastQuestion ? 'not-allowed' : 'pointer',
              opacity: isLastQuestion ? 0.5 : 1,
              flex: isMobile ? 1 : 'none',
              justifyContent: 'center',
            }}
          >
            {isMobile ? 'Überspringen' : 'Frage überspringen'}
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Progress */}
      <ProgressBar
        current={currentIndex}
        total={questions.length}
        answeredQuestions={answeredQuestions}
        primaryAccent={primaryAccent}
        b={b}
        labels={labels}
      />

      {/* Main Content */}
      {showFeedback ? (
        /* Single Column Layout for Feedback View */
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', justifyContent: 'flex-end' }}>
            {/* Retry button */}
            {scenario.allow_retry && (
              <button
                onClick={handleRetry}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  borderRadius: '10px',
                  border: `2px solid ${b.borderColor}`,
                  backgroundColor: b.cardBg,
                  color: b.textSecondary,
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <RotateCcw size={16} />
                Nochmal versuchen
              </button>
            )}
            <button
              onClick={
                isSimulation
                  ? ((isConversationFinished && !preloadedNextQuestion) ? handleCompleteSession : handleNext)
                  : (isLastQuestion ? handleCompleteSession : handleNext)
              }
              disabled={isSimulation && isLoadingNextTurn && !isConversationFinished}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                borderRadius: '10px',
                border: 'none',
                background: (isSimulation && isLoadingNextTurn && !isConversationFinished)
                  ? b.textMuted
                  : buttonGradient,
                color: 'white',
                fontSize: '14px',
                fontWeight: 600,
                cursor: (isSimulation && isLoadingNextTurn && !isConversationFinished)
                  ? 'wait'
                  : 'pointer',
                boxShadow: (isSimulation && isLoadingNextTurn && !isConversationFinished)
                  ? 'none'
                  : `0 4px 12px ${primaryAccent}4d`,
                opacity: (isSimulation && isLoadingNextTurn && !isConversationFinished) ? 0.7 : 1,
              }}
            >
              {isSimulation && isLoadingNextTurn && !isConversationFinished ? (
                <>
                  <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                  Gesprächspartner tippt...
                </>
              ) : (isSimulation ? (
                // Show "abschließen" only when finished AND no more questions to show
                (isConversationFinished && !preloadedNextQuestion) ? 'Training abschließen' : labels.nextButton
              ) : (
                isLastQuestion ? 'Training abschließen' : labels.nextButton
              ))}
              {!isLoadingNextTurn && !(isSimulation ? (isConversationFinished && !preloadedNextQuestion) : isLastQuestion) && <ChevronRight size={16} />}
            </button>
          </div>

          {/* Question Card */}
          <div
            style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '20px',
              border: '1px solid #e2e8f0',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: buttonGradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                {currentIndex + 1}
              </div>
              <span style={{ fontSize: '14px', color: '#64748b' }}>
                {currentQuestion?.category || labels.questionFallback}
              </span>
            </div>
            <p style={{ fontSize: '16px', fontWeight: 500, color: '#0f172a', margin: 0, lineHeight: 1.5 }}>
              {currentQuestion?.question || labels.questionLoading}
            </p>
          </div>

          {/* Feedback Content */}
          <ImmediateFeedback
            transcript={feedback.transcript}
            feedback={feedback.feedback}
            audioMetrics={feedback.audio_analysis}
            audioUrl={feedback.audio_url}
            hideButtons={true}
          />
        </div>
      ) : (
        /* Recording View Layout */
        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '24px' }}>
          {/* Mobile: Question First, then Recording. Desktop: Two columns */}
          {isMobile ? (
            /* Mobile Layout - Stacked vertically */
            <>
              {/* Question Card - Mobile */}
              <div
                style={{
                  background: '#fff',
                  borderRadius: '16px',
                  padding: '16px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <div
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      background: buttonGradient,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: '12px',
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    {currentIndex + 1}
                  </div>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>
                    {currentQuestion?.category || labels.questionFallback}
                  </span>
                </div>

                <p
                  style={{
                    fontSize: '15px',
                    fontWeight: 600,
                    color: '#0f172a',
                    lineHeight: 1.5,
                    margin: 0,
                  }}
                >
                  {currentQuestion?.question || labels.questionLoading}
                </p>

                {currentQuestion?.estimated_answer_time && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '13px', marginTop: '12px' }}>
                    <Clock size={14} />
                    {labels.recommendedTime}: ca. {Math.round(currentQuestion.estimated_answer_time / 60)} Min
                  </div>
                )}
              </div>

              {/* Recording Area - Mobile */}
              <AudioRecorder
                onRecordingComplete={handleRecordingComplete}
                timeLimit={scenario.time_limit_per_question || 120}
                disabled={false}
                deviceId={selectedMicrophoneId}
                themedGradient={buttonGradient}
                primaryAccent={primaryAccent}
                isSubmitting={isSubmitting}
                labels={labels}
                onOpenSettings={() => setShowDeviceSettings(true)}
                branding={b}
                isMobile={true}
                onStreamChange={handleStreamChange}
              />

              {/* Error State - Mobile */}
              {submitError && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '16px',
                  borderRadius: '12px',
                  backgroundColor: b.errorLight,
                }}>
                  <AlertCircle style={{ width: '24px', height: '24px', color: b.error }} />
                  <p style={{
                    marginTop: '8px',
                    color: b.error,
                    fontWeight: 500,
                    fontSize: '14px',
                    textAlign: 'center',
                  }}>
                    {submitError}
                  </p>
                  <button
                    onClick={handleRetry}
                    style={{
                      marginTop: '12px',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: b.error,
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    Erneut versuchen
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Desktop Layout - Two Column Grid */
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Left Column - Recording */}
              <div>
                <AudioRecorder
                  onRecordingComplete={handleRecordingComplete}
                  timeLimit={scenario.time_limit_per_question || 120}
                  disabled={false}
                  deviceId={selectedMicrophoneId}
                  themedGradient={buttonGradient}
                  primaryAccent={primaryAccent}
                  isSubmitting={isSubmitting}
                  labels={labels}
                  onOpenSettings={() => setShowDeviceSettings(true)}
                  branding={b}
                  isMobile={false}
                  onStreamChange={handleStreamChange}
                />

                {/* Error State */}
                {submitError && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '20px',
                    marginTop: '16px',
                    borderRadius: '12px',
                    backgroundColor: b.errorLight,
                  }}>
                    <AlertCircle style={{ width: '24px', height: '24px', color: b.error }} />
                    <p style={{
                      marginTop: '8px',
                      color: b.error,
                      fontWeight: 500,
                      fontSize: '14px',
                      textAlign: 'center',
                    }}>
                      {submitError}
                    </p>
                    <button
                      onClick={handleRetry}
                      style={{
                        marginTop: '12px',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: b.error,
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      Erneut versuchen
                    </button>
                  </div>
                )}
              </div>

              {/* Right Column - Question */}
              <div
                style={{
                  background: '#fff',
                  borderRadius: '16px',
                  padding: '24px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: buttonGradient,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: '13px',
                      fontWeight: 600,
                    }}
                  >
                    {currentIndex + 1}
                  </div>
                  <span style={{ fontSize: '14px', color: '#64748b' }}>
                    {currentQuestion?.category || labels.questionFallback}
                  </span>
                </div>

                <h2
                  style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    color: '#0f172a',
                    lineHeight: 1.5,
                    marginBottom: '16px',
                  }}
                >
                  {currentQuestion?.question || labels.questionLoading}
                </h2>

                {currentQuestion?.estimated_answer_time && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '14px' }}>
                    <Clock size={16} />
                    {labels.recommendedTime}: ca. {Math.round(currentQuestion.estimated_answer_time / 60)} Min
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Full Width Tips Section */}
          {currentQuestion?.tips && currentQuestion.tips.length > 0 && (
            <QuestionTips tips={currentQuestion.tips} primaryAccent={primaryAccent} tipsLabel={labels.tipsLabel} branding={b} />
          )}
        </div>
      )}

      {/* Device Settings Dialog */}
      <DeviceSettingsDialog
        isOpen={showDeviceSettings}
        onClose={() => setShowDeviceSettings(false)}
        mode="audio"
        selectedMicrophoneId={selectedMicrophoneId}
        onMicrophoneChange={setSelectedMicrophoneId}
      />
    </div>
  );
};

export default SimulatorSession;
