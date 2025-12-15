import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import wordpressAPI from '@/services/wordpress-api';
import ImmediateFeedback from './ImmediateFeedback';
import MicrophoneSelector from '@/components/MicrophoneSelector';
import MicrophoneTestDialog from '@/components/MicrophoneTestDialog';
import { usePartner } from '@/context/PartnerContext';
import { DEFAULT_BRANDING } from '@/config/partners';

/**
 * Fallback theme colors
 */
const COLORS = {
  slate: { 50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1', 400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155', 800: '#1e293b', 900: '#0f172a' },
  red: { 500: '#ef4444', 100: '#fee2e2' },
  green: { 500: '#22c55e', 100: '#dcfce7' },
  amber: { 500: '#f59e0b', 100: '#fef3c7' },
};

/**
 * Progress Bar Component
 */
const ProgressBar = ({ current, total, answeredQuestions, primaryAccent, labels }) => {
  const percentage = ((current + 1) / total) * 100;
  const questionLabel = labels?.questionFallback || 'Frage';

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '14px', fontWeight: 600, color: COLORS.slate[700] }}>
          {labels?.questionCounter ? labels.questionCounter(current + 1, total) : `${questionLabel} ${current + 1} von ${total}`}
        </span>
        <span style={{ fontSize: '14px', color: COLORS.slate[500] }}>
          {Math.round(percentage)}% abgeschlossen
        </span>
      </div>
      <div style={{
        height: '8px',
        backgroundColor: COLORS.slate[200],
        borderRadius: '4px',
        overflow: 'hidden',
        marginBottom: '12px',
      }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.3 }}
          style={{
            height: '100%',
            background: primaryAccent,
            borderRadius: '4px',
          }}
        />
      </div>
      {/* Dots */}
      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
        {Array.from({ length: total }, (_, i) => {
          const isAnswered = answeredQuestions.includes(i);
          const isCurrent = i === current;
          return (
            <div
              key={i}
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: isCurrent
                  ? primaryAccent
                  : isAnswered
                    ? COLORS.green[500]
                    : COLORS.slate[300],
                transition: 'all 0.2s',
              }}
              title={`${questionLabel} ${i + 1}${isAnswered ? ' (beantwortet)' : ''}`}
            />
          );
        })}
      </div>
    </div>
  );
};

/**
 * Question Tips Accordion Component
 */
const QuestionTips = ({ tips, primaryAccent, tipsLabel }) => {
  const [isOpen, setIsOpen] = useState(true); // Default: aufgeklappt

  if (!tips || tips.length === 0) return null;

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
      }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '16px 24px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
          <Lightbulb size={18} color={primaryAccent} />
          {tipsLabel || 'Tipps für diese Frage'}
        </span>
        <ChevronDown
          size={18}
          color="#64748b"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
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
            <div style={{ padding: '0 24px 24px' }}>
              {tips.map((tip, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    backgroundColor: COLORS.amber[100] + '60',
                    marginBottom: index < tips.length - 1 ? '8px' : 0,
                  }}
                >
                  <Lightbulb style={{
                    width: '16px',
                    height: '16px',
                    color: COLORS.amber[500],
                    flexShrink: 0,
                    marginTop: '2px',
                  }} />
                  <p style={{
                    fontSize: '14px',
                    color: COLORS.slate[700],
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
const Timer = ({ seconds, maxSeconds, isRecording }) => {
  const formatTime = (s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = maxSeconds > 0 ? (seconds / maxSeconds) * 100 : 0;
  const isWarning = progress > 75;
  const isDanger = progress > 90;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 16px',
      borderRadius: '12px',
      backgroundColor: isDanger ? COLORS.red[100] : isWarning ? COLORS.amber[100] : COLORS.slate[100],
    }}>
      <Clock style={{
        width: '20px',
        height: '20px',
        color: isDanger ? COLORS.red[500] : isWarning ? COLORS.amber[500] : COLORS.slate[600],
      }} />
      <span style={{
        fontSize: '18px',
        fontWeight: 600,
        fontFamily: 'monospace',
        color: isDanger ? COLORS.red[500] : isWarning ? COLORS.amber[500] : COLORS.slate[700],
      }}>
        {formatTime(seconds)}
      </span>
      <span style={{ fontSize: '14px', color: COLORS.slate[500] }}>
        / {formatTime(maxSeconds)}
      </span>
    </div>
  );
};

/**
 * Audio Recorder Component - With Pause functionality
 */
const AudioRecorder = ({ onRecordingComplete, timeLimit, disabled, deviceId, themedGradient, primaryAccent, isSubmitting, labels }) => {
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
    }
  };

  const startRecording = async () => {
    try {
      setPermissionDenied(false);
      audioChunksRef.current = [];
      setSeconds(0);

      const audioConstraints = deviceId ? { deviceId: { exact: deviceId } } : true;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });
      streamRef.current = stream;

      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;

      const updateLevel = () => {
        if (analyserRef.current && recordingState === 'recording') {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(average / 255);
        }
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      };
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
      timerRef.current = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    }
  };

  const finishRecording = () => {
    // Save the duration before resetting
    finalDurationRef.current = seconds;

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
      <div style={{ padding: '24px', borderRadius: '16px', backgroundColor: COLORS.red[100], textAlign: 'center' }}>
        <MicOff style={{ width: '48px', height: '48px', color: COLORS.red[500], marginBottom: '12px' }} />
        <p style={{ color: COLORS.red[500], fontWeight: 600, margin: 0 }}>Mikrofonzugriff verweigert</p>
        <p style={{ color: COLORS.slate[600], fontSize: '14px', marginTop: '8px' }}>
          Bitte erlaube den Zugriff auf dein Mikrofon in den Browser-Einstellungen.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', borderRadius: '16px', backgroundColor: 'white', border: `1px solid ${COLORS.slate[200]}` }}>
      {/* Timer */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
        <Timer seconds={seconds} maxSeconds={timeLimit} isRecording={recordingState === 'recording'} />
      </div>

      {/* Audio Level Visualization */}
      {recordingState === 'recording' && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', height: '60px', marginBottom: '24px' }}>
          {[...Array(20)].map((_, i) => {
            const height = Math.max(8, Math.min(50, audioLevel * 100 * Math.random() * 2));
            return (
              <div key={i} style={{ width: '6px', height: `${height}px`, backgroundColor: primaryAccent, borderRadius: '3px', transition: 'height 0.1s ease' }} />
            );
          })}
        </div>
      )}

      {/* Paused State Indicator */}
      {recordingState === 'paused' && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', height: '60px', marginBottom: '24px', color: COLORS.amber[500] }}>
          <Mic size={24} />
          <span style={{ fontSize: '16px', fontWeight: 600 }}>Aufnahme pausiert</span>
        </div>
      )}

      {/* Recording Buttons */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
        {/* Main Button - Start/Pause/Resume */}
        <button
          onClick={handleMainButtonClick}
          disabled={disabled || isSubmitting}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
            padding: '14px 28px', borderRadius: '12px', border: 'none',
            background: recordingState === 'idle'
              ? ((disabled || isSubmitting) ? COLORS.slate[300] : '#ef4444')
              : recordingState === 'recording'
                ? COLORS.amber[500]
                : COLORS.green[500],
            color: 'white', fontSize: '16px', fontWeight: 600,
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
              padding: '14px 24px', borderRadius: '12px', border: 'none',
              backgroundColor: COLORS.slate[100], color: COLORS.slate[900],
              fontSize: '16px', fontWeight: 600, cursor: 'pointer',
            }}
          >
            <CheckCircle style={{ width: '18px', height: '18px', color: COLORS.green[500] }} />
            {labels?.submitButton || 'Antwort abgeben'}
          </button>
        )}
      </div>

      {/* Recording Hint */}
      {recordingState === 'idle' && !isSubmitting && (
        <p style={{ textAlign: 'center', marginTop: '16px', color: COLORS.slate[500], fontSize: '14px' }}>
          {labels?.submitHint || 'Klicke auf den Button, um deine Antwort aufzunehmen'}
        </p>
      )}

      {/* Submitting State */}
      {isSubmitting && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '24px' }}>
          <Loader2 style={{ width: '32px', height: '32px', color: primaryAccent, animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '12px', color: COLORS.slate[700], fontSize: '14px' }}>{labels?.analyzing || 'Antwort wird analysiert...'}</p>
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
const PreSessionView = ({ scenario, variables, questions, onStart, onBack, selectedMicrophoneId, onMicrophoneChange, onMicrophoneTest, themedGradient, primaryAccent, primaryAccentLight }) => {
  // Mode-based labels
  const isSimulation = scenario?.mode === 'SIMULATION';
  const questionsLabel = isSimulation ? 'Situationen' : 'Fragen';
  const timePerQuestionLabel = isSimulation ? 'Zeit pro Situation' : 'Zeit pro Frage';

  const generalTips = [
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

  const contextInfo = variables ? Object.entries(variables)
    .filter(([key, value]) => value && value.trim && value.trim() !== '')
    .map(([key, value]) => ({
      label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: value
    })) : [];

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
            color: COLORS.slate[600],
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
              color: COLORS.slate[900],
              margin: 0,
            }}>
              Vorbereitung
            </h1>
            <p style={{
              fontSize: '16px',
              color: COLORS.slate[600],
              margin: '4px 0 0 0',
            }}>
              {scenario.title} • {questions.length} {questionsLabel}
            </p>
          </div>
        </div>
      </div>

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
                <span style={{ fontSize: '12px', color: COLORS.slate[500], display: 'block' }}>
                  {item.label}
                </span>
                <span style={{ fontSize: '15px', fontWeight: 500, color: COLORS.slate[800] }}>
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
        backgroundColor: 'white',
        border: `1px solid ${COLORS.slate[200]}`,
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
            color: COLORS.slate[900],
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
        style={{
          width: '100%',
          padding: '18px 28px',
          borderRadius: '14px',
          border: 'none',
          background: themedGradient,
          color: 'white',
          fontSize: '18px',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          boxShadow: `0 4px 12px ${primaryAccent}4d`,
          marginBottom: '24px',
        }}
      >
        <Play style={{ width: '24px', height: '24px' }} />
        Gespräch starten
      </button>

      {/* Tips Section - THIRD */}
      <div style={{
        padding: '24px',
        borderRadius: '16px',
        backgroundColor: 'white',
        border: `1px solid ${COLORS.slate[200]}`,
        marginBottom: '24px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '20px',
        }}>
          <Lightbulb style={{ width: '22px', height: '22px', color: COLORS.amber[500] }} />
          <h2 style={{
            fontSize: '18px',
            fontWeight: 600,
            color: COLORS.slate[900],
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
                backgroundColor: COLORS.slate[50],
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
                  color: COLORS.slate[800],
                  margin: '0 0 4px 0',
                }}>
                  {tip.title}
                </h4>
                <p style={{
                  fontSize: '14px',
                  color: COLORS.slate[600],
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
        backgroundColor: COLORS.slate[100],
        display: 'flex',
        gap: '24px',
        flexWrap: 'wrap',
      }}>
        <div>
          <span style={{ fontSize: '12px', color: COLORS.slate[500], display: 'block' }}>{questionsLabel}</span>
          <span style={{ fontSize: '18px', fontWeight: 600, color: COLORS.slate[900] }}>
            {questions.length}
          </span>
        </div>
        <div>
          <span style={{ fontSize: '12px', color: COLORS.slate[500], display: 'block' }}>{timePerQuestionLabel}</span>
          <span style={{ fontSize: '18px', fontWeight: 600, color: COLORS.slate[900] }}>
            {Math.round((scenario.time_limit_per_question || 120) / 60)} Min
          </span>
        </div>
        <div>
          <span style={{ fontSize: '12px', color: COLORS.slate[500], display: 'block' }}>Wiederholen</span>
          <span style={{ fontSize: '18px', fontWeight: 600, color: COLORS.slate[900] }}>
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
const SimulatorSession = ({ session, questions, scenario, variables, onComplete, onExit, startFromQuestion = 0 }) => {
  // Mobile detection
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // Determine if this is a continuation (skip preparation)
  const isContinuation = startFromQuestion > 0;

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

  const [selectedMicrophoneId, setSelectedMicrophoneId] = useState(null);
  const [showMicrophoneTest, setShowMicrophoneTest] = useState(false);

  // Confirmation dialog states
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const { branding } = usePartner();
  const headerGradient = branding?.['--header-gradient'] || DEFAULT_BRANDING['--header-gradient'];
  const buttonGradient = branding?.['--button-gradient'] || headerGradient;
  const primaryAccent = branding?.['--primary-accent'] || DEFAULT_BRANDING['--primary-accent'];
  const primaryAccentLight = branding?.['--primary-accent-light'] || DEFAULT_BRANDING['--primary-accent-light'];

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const isFirstQuestion = currentIndex === 0;

  const handleRecordingComplete = async (audioBlob, audioDuration) => {
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
    if (!isLastQuestion) {
      setCurrentIndex(prev => prev + 1);
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
    onExit();
  };

  const handleStartInterview = () => {
    setPhase('interview');
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
        />
        <MicrophoneTestDialog
          isOpen={showMicrophoneTest}
          onClose={() => setShowMicrophoneTest(false)}
          deviceId={selectedMicrophoneId}
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
          {/* Training beenden - immer sichtbar wenn mind. 1 Frage beantwortet */}
          {answeredQuestions.length > 0 && (
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
              flex: isMobile && answeredQuestions.length === 0 ? 1 : 'none',
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
            <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, marginBottom: '8px' }}>
              Du hast <strong>{labels.answeredCount(answeredQuestions.length, questions.length)}</strong> beantwortet.
            </p>
            <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, marginBottom: '24px' }}>
              Möchtest du das Training jetzt mit den bisherigen Antworten abschließen oder weitere {labels.questionsLabel} beantworten?
            </p>
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
                Zurück zum Training
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
                Training abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons - only show during recording (not feedback) */}
      {!showFeedback && (
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
              border: `2px solid ${COLORS.slate[300]}`,
              backgroundColor: 'white',
              color: isFirstQuestion ? COLORS.slate[400] : COLORS.slate[700],
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
              border: `2px solid ${COLORS.slate[300]}`,
              backgroundColor: 'white',
              color: isLastQuestion ? COLORS.slate[400] : COLORS.slate[700],
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
        labels={labels}
      />

      {/* Main Content */}
      {showFeedback ? (
        /* Single Column Layout for Feedback View */
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', justifyContent: 'flex-end' }}>
            {scenario.allow_retry && (
              <button
                onClick={handleRetry}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  borderRadius: '10px',
                  border: `2px solid ${COLORS.slate[300]}`,
                  backgroundColor: 'white',
                  color: COLORS.slate[700],
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
              onClick={isLastQuestion ? handleCompleteSession : handleNext}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                borderRadius: '10px',
                border: 'none',
                background: buttonGradient,
                color: 'white',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: `0 4px 12px ${primaryAccent}4d`,
              }}
            >
              {isLastQuestion ? 'Training abschließen' : labels.nextButton}
              {!isLastQuestion && <ChevronRight size={16} />}
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
              />

              {/* Error State - Mobile */}
              {submitError && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '16px',
                  borderRadius: '12px',
                  backgroundColor: COLORS.red[100],
                }}>
                  <AlertCircle style={{ width: '24px', height: '24px', color: COLORS.red[500] }} />
                  <p style={{
                    marginTop: '8px',
                    color: COLORS.red[500],
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
                      backgroundColor: COLORS.red[500],
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
                    backgroundColor: COLORS.red[100],
                  }}>
                    <AlertCircle style={{ width: '24px', height: '24px', color: COLORS.red[500] }} />
                    <p style={{
                      marginTop: '8px',
                      color: COLORS.red[500],
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
                        backgroundColor: COLORS.red[500],
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
            <QuestionTips tips={currentQuestion.tips} primaryAccent={primaryAccent} tipsLabel={labels.tipsLabel} />
          )}
        </div>
      )}

    </div>
  );
};

export default SimulatorSession;
