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
const ProgressBar = ({ current, total, answeredQuestions, primaryAccent }) => {
  const percentage = ((current + 1) / total) * 100;

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '14px', fontWeight: 600, color: COLORS.slate[700] }}>
          Frage {current + 1} von {total}
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
              title={`Frage ${i + 1}${isAnswered ? ' (beantwortet)' : ''}`}
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
const QuestionTips = ({ tips, primaryAccent }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!tips || tips.length === 0) return null;

  return (
    <div
      style={{
        marginTop: '16px',
        background: `linear-gradient(135deg, ${primaryAccent}08 0%, ${primaryAccent}04 100%)`,
        borderRadius: '12px',
        border: `1px solid ${primaryAccent}15`,
        overflow: 'hidden',
      }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '14px 16px',
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
          Tipps für diese Frage
        </span>
        <ChevronRight
          size={18}
          color="#64748b"
          style={{ transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}
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
            <div style={{ padding: '0 16px 16px' }}>
              {tips.map((tip, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    padding: '12px',
                    borderRadius: '10px',
                    backgroundColor: COLORS.amber[100] + '50',
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
 * Audio Recorder Component - Simplified for two-column layout
 */
const AudioRecorder = ({ onRecordingComplete, timeLimit, disabled, deviceId, themedGradient, primaryAccent, isSubmitting }) => {
  const [isRecording, setIsRecording] = useState(false);
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

  useEffect(() => {
    return () => {
      stopRecording(true);
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (isRecording && seconds >= timeLimit) {
      stopRecording();
    }
  }, [seconds, timeLimit, isRecording]);

  const startRecording = async () => {
    try {
      setPermissionDenied(false);
      audioChunksRef.current = [];
      setSeconds(0);

      const audioConstraints = deviceId
        ? { deviceId: { exact: deviceId } }
        : true;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });
      streamRef.current = stream;

      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;

      const updateLevel = () => {
        if (analyserRef.current) {
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
        onRecordingComplete(audioBlob);
      };

      mediaRecorderRef.current.start(1000);
      setIsRecording(true);

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

  const stopRecording = (cleanup = false) => {
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

    setIsRecording(false);
    setAudioLevel(0);

    if (!cleanup) {
      setSeconds(0);
    }
  };

  if (permissionDenied) {
    return (
      <div style={{
        padding: '24px',
        borderRadius: '16px',
        backgroundColor: COLORS.red[100],
        textAlign: 'center',
      }}>
        <MicOff style={{ width: '48px', height: '48px', color: COLORS.red[500], marginBottom: '12px' }} />
        <p style={{ color: COLORS.red[500], fontWeight: 600, margin: 0 }}>
          Mikrofonzugriff verweigert
        </p>
        <p style={{ color: COLORS.slate[600], fontSize: '14px', marginTop: '8px' }}>
          Bitte erlaube den Zugriff auf dein Mikrofon in den Browser-Einstellungen.
        </p>
      </div>
    );
  }

  return (
    <div style={{
      padding: '24px',
      borderRadius: '16px',
      backgroundColor: 'white',
      border: `1px solid ${COLORS.slate[200]}`,
    }}>
      {/* Timer */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
        <Timer seconds={seconds} maxSeconds={timeLimit} isRecording={isRecording} />
      </div>

      {/* Audio Level Visualization */}
      {isRecording && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '4px',
          height: '60px',
          marginBottom: '24px',
        }}>
          {[...Array(20)].map((_, i) => {
            const height = Math.max(8, Math.min(50, audioLevel * 100 * Math.random() * 2));
            return (
              <div
                key={i}
                style={{
                  width: '6px',
                  height: `${height}px`,
                  backgroundColor: primaryAccent,
                  borderRadius: '3px',
                  transition: 'height 0.1s ease',
                }}
              />
            );
          })}
        </div>
      )}

      {/* Recording Button */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        {!isRecording ? (
          <button
            onClick={startRecording}
            disabled={disabled || isSubmitting}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              padding: '14px 28px',
              borderRadius: '12px',
              border: 'none',
              background: (disabled || isSubmitting) ? COLORS.slate[300] : '#ef4444',
              color: 'white',
              fontSize: '16px',
              fontWeight: 600,
              cursor: (disabled || isSubmitting) ? 'not-allowed' : 'pointer',
              boxShadow: (disabled || isSubmitting) ? 'none' : '0 4px 14px rgba(239, 68, 68, 0.4)',
            }}
          >
            <Mic style={{ width: '20px', height: '20px' }} />
            Aufnahme starten
          </button>
        ) : (
          <button
            onClick={() => stopRecording()}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              padding: '14px 28px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: COLORS.slate[100],
              color: COLORS.slate[900],
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Square style={{ width: '18px', height: '18px', color: COLORS.red[500] }} />
            Aufnahme beenden
          </button>
        )}
      </div>

      {/* Recording Hint */}
      {!isRecording && !isSubmitting && (
        <p style={{
          textAlign: 'center',
          marginTop: '16px',
          color: COLORS.slate[500],
          fontSize: '14px',
        }}>
          Klicke auf den Button, um deine Antwort aufzunehmen
        </p>
      )}

      {/* Submitting State */}
      {isSubmitting && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginTop: '24px',
        }}>
          <Loader2 style={{
            width: '32px',
            height: '32px',
            color: primaryAccent,
            animation: 'spin 1s linear infinite',
          }} />
          <p style={{
            marginTop: '12px',
            color: COLORS.slate[700],
            fontSize: '14px',
          }}>
            Antwort wird analysiert...
          </p>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
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
  const generalTips = [
    {
      icon: Target,
      title: 'Strukturiert antworten',
      description: 'Nutze die STAR-Methode (Situation, Task, Action, Result) für Beispiele aus deiner Erfahrung.',
    },
    {
      icon: Clock,
      title: 'Zeit im Blick behalten',
      description: `Du hast ${Math.round((scenario.time_limit_per_question || 120) / 60)} Minuten pro Frage. Antworte präzise, aber ausführlich genug.`,
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
              {scenario.title} • {questions.length} Fragen
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
          <span style={{ fontSize: '12px', color: COLORS.slate[500], display: 'block' }}>Fragen</span>
          <span style={{ fontSize: '18px', fontWeight: 600, color: COLORS.slate[900] }}>
            {questions.length}
          </span>
        </div>
        <div>
          <span style={{ fontSize: '12px', color: COLORS.slate[500], display: 'block' }}>Zeit pro Frage</span>
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
const SimulatorSession = ({ session, questions, scenario, variables, onComplete, onExit }) => {
  const [phase, setPhase] = useState('preparation');
  const [currentIndex, setCurrentIndex] = useState(session.current_question_index || 0);
  const [feedback, setFeedback] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [completedAnswers, setCompletedAnswers] = useState([]);
  const [answeredQuestions, setAnsweredQuestions] = useState([]);

  const [selectedMicrophoneId, setSelectedMicrophoneId] = useState(null);
  const [showMicrophoneTest, setShowMicrophoneTest] = useState(false);

  const { branding } = usePartner();
  const headerGradient = branding?.['--header-gradient'] || DEFAULT_BRANDING['--header-gradient'];
  const buttonGradient = branding?.['--button-gradient'] || headerGradient;
  const primaryAccent = branding?.['--primary-accent'] || DEFAULT_BRANDING['--primary-accent'];
  const primaryAccentLight = branding?.['--primary-accent-light'] || DEFAULT_BRANDING['--primary-accent-light'];

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const isFirstQuestion = currentIndex === 0;

  const handleRecordingComplete = async (audioBlob) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await wordpressAPI.submitSimulatorAnswer(
        session.id,
        audioBlob,
        currentIndex,
        currentQuestion.question,
        currentQuestion.category
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

  const handleCompleteSession = async () => {
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

  const handleExitConfirm = () => {
    if (window.confirm('Möchtest du das Training wirklich abbrechen? Dein bisheriger Fortschritt wird gespeichert.')) {
      onExit();
    }
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
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#0f172a' }}>
          {scenario?.title}
        </h1>
        <button
          onClick={handleExitConfirm}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            background: '#f1f5f9',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#64748b',
            fontSize: '14px',
          }}
        >
          <X size={16} />
          Beenden
        </button>
      </div>

      {/* Progress */}
      <ProgressBar
        current={currentIndex}
        total={questions.length}
        answeredQuestions={answeredQuestions}
        primaryAccent={primaryAccent}
      />

      {/* Main Content - Two Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Left Column - Recording */}
        <div>
          {/* Show feedback or recorder */}
          {showFeedback ? (
            <ImmediateFeedback
              transcript={feedback.transcript}
              feedback={feedback.feedback}
              audioMetrics={feedback.audio_analysis}
              onRetry={scenario.allow_retry ? handleRetry : null}
              onNext={handleNext}
              isLastQuestion={isLastQuestion}
            />
          ) : (
            <AudioRecorder
              onRecordingComplete={handleRecordingComplete}
              timeLimit={scenario.time_limit_per_question || 120}
              disabled={false}
              deviceId={selectedMicrophoneId}
              themedGradient={buttonGradient}
              primaryAccent={primaryAccent}
              isSubmitting={isSubmitting}
            />
          )}

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

          {/* Navigation Buttons - Below Recording (like VideoTraining) */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginTop: '20px' }}>
            {/* Previous button */}
            {!isFirstQuestion && (
              <button
                onClick={handlePrev}
                style={{
                  padding: '10px 16px',
                  borderRadius: '8px',
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  cursor: 'pointer',
                  color: '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '14px',
                }}
              >
                <ChevronLeft size={18} />
                Vorherige Frage
              </button>
            )}

            {/* Next button */}
            {!isLastQuestion && (
              <button
                onClick={handleNext}
                style={{
                  padding: '10px 16px',
                  borderRadius: '8px',
                  background: primaryAccent,
                  border: 'none',
                  cursor: 'pointer',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                Nächste Frage
                <ChevronRight size={18} />
              </button>
            )}

            {/* Finish button - always visible */}
            <button
              onClick={handleCompleteSession}
              disabled={answeredQuestions.length === 0}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                background: answeredQuestions.length === 0 ? '#94a3b8' : '#22c55e',
                border: 'none',
                cursor: answeredQuestions.length === 0 ? 'not-allowed' : 'pointer',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '14px',
                fontWeight: 600,
                boxShadow: answeredQuestions.length > 0 ? '0 4px 14px rgba(34, 197, 94, 0.3)' : 'none',
              }}
            >
              <Check size={18} />
              Training abschließen
            </button>
          </div>
        </div>

        {/* Right Column - Question and Tips */}
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
              {currentQuestion?.category || 'Frage'}
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
            {currentQuestion?.question || 'Frage wird geladen...'}
          </h2>

          {currentQuestion?.estimated_answer_time && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '14px', marginBottom: '16px' }}>
              <Clock size={16} />
              Empfohlene Antwortzeit: ca. {Math.round(currentQuestion.estimated_answer_time / 60)} Min
            </div>
          )}

          {/* Tips */}
          {currentQuestion?.tips && currentQuestion.tips.length > 0 && !showFeedback && (
            <QuestionTips tips={currentQuestion.tips} primaryAccent={primaryAccent} />
          )}
        </div>
      </div>

      {/* Responsive styles for mobile */}
      <style>{`
        @media (max-width: 768px) {
          div[style*="gridTemplateColumns"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default SimulatorSession;
