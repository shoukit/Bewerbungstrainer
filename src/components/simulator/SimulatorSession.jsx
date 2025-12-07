import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Square,
  ChevronRight,
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
  ArrowLeft
} from 'lucide-react';
import wordpressAPI from '@/services/wordpress-api';
import ImmediateFeedback from './ImmediateFeedback';

/**
 * Ocean theme colors
 */
const COLORS = {
  blue: { 500: '#4A9EC9', 600: '#3A7FA7', 700: '#2D6485' },
  teal: { 500: '#3DA389', 600: '#2E8A72' },
  slate: { 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1', 400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155', 800: '#1e293b', 900: '#0f172a' },
  red: { 500: '#ef4444', 100: '#fee2e2' },
  green: { 500: '#22c55e', 100: '#dcfce7' },
  amber: { 500: '#f59e0b', 100: '#fef3c7' },
};

/**
 * Progress Bar with Navigation Component
 */
const ProgressBarWithNav = ({ current, total, onPrev, onNext, answeredQuestions }) => {
  const progress = (current / total) * 100;
  const isFirst = current === 1;
  const isLast = current === total;

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px',
      }}>
        <span style={{ fontSize: '14px', fontWeight: 600, color: COLORS.slate[700] }}>
          Frage {current} von {total}
        </span>
        <span style={{ fontSize: '14px', color: COLORS.slate[500] }}>
          {Math.round(progress)}% abgeschlossen
        </span>
      </div>
      <div style={{
        height: '8px',
        backgroundColor: COLORS.slate[200],
        borderRadius: '4px',
        overflow: 'hidden',
        marginBottom: '12px',
      }}>
        <div
          style={{
            height: '100%',
            width: `${progress}%`,
            background: `linear-gradient(90deg, ${COLORS.blue[500]} 0%, ${COLORS.teal[500]} 100%)`,
            borderRadius: '4px',
            transition: 'width 0.3s ease',
          }}
        />
      </div>
      {/* Navigation Buttons */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px',
      }}>
        <button
          onClick={onPrev}
          disabled={isFirst}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '8px',
            border: `1px solid ${isFirst ? COLORS.slate[200] : COLORS.slate[300]}`,
            backgroundColor: 'white',
            color: isFirst ? COLORS.slate[400] : COLORS.slate[700],
            fontSize: '14px',
            fontWeight: 500,
            cursor: isFirst ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <ArrowLeft style={{ width: '16px', height: '16px' }} />
          Vorherige
        </button>

        {/* Question dots */}
        <div style={{
          display: 'flex',
          gap: '6px',
          flexWrap: 'wrap',
          justifyContent: 'center',
          flex: 1,
        }}>
          {Array.from({ length: total }, (_, i) => {
            const isAnswered = answeredQuestions.includes(i);
            const isCurrent = i === current - 1;
            return (
              <div
                key={i}
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: isCurrent
                    ? COLORS.blue[500]
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

        <button
          onClick={onNext}
          disabled={isLast}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '8px',
            border: `1px solid ${isLast ? COLORS.slate[200] : COLORS.slate[300]}`,
            backgroundColor: 'white',
            color: isLast ? COLORS.slate[400] : COLORS.slate[700],
            fontSize: '14px',
            fontWeight: 500,
            cursor: isLast ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
          }}
        >
          Nächste
          <ChevronRight style={{ width: '16px', height: '16px' }} />
        </button>
      </div>
    </div>
  );
};

/**
 * Question Tips Accordion Component
 */
const QuestionTips = ({ tips }) => {
  const [isOpen, setIsOpen] = useState(true);

  if (!tips || tips.length === 0) return null;

  return (
    <div style={{
      marginBottom: '24px',
      borderRadius: '16px',
      backgroundColor: 'white',
      border: `1px solid ${COLORS.slate[200]}`,
      overflow: 'hidden',
    }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          border: 'none',
          backgroundColor: 'transparent',
          cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Lightbulb style={{ width: '20px', height: '20px', color: COLORS.amber[500] }} />
          <span style={{ fontSize: '15px', fontWeight: 600, color: COLORS.slate[800] }}>
            Tipps
          </span>
        </div>
        <ChevronDown style={{
          width: '20px',
          height: '20px',
          color: COLORS.slate[500],
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
          transition: 'transform 0.2s',
        }} />
      </button>

      {isOpen && (
        <div style={{
          padding: '0 20px 20px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          {tips.map((tip, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                gap: '12px',
                padding: '14px 16px',
                borderRadius: '12px',
                backgroundColor: COLORS.amber[100] + '50',
              }}
            >
              <Lightbulb style={{
                width: '18px',
                height: '18px',
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
      )}
    </div>
  );
};

/**
 * Question Display Component
 */
const QuestionDisplay = ({ question, questionNumber }) => {
  return (
    <div style={{
      padding: '24px',
      borderRadius: '16px',
      backgroundColor: 'white',
      border: `1px solid ${COLORS.slate[200]}`,
      marginBottom: '24px',
    }}>
      <div style={{
        display: 'inline-block',
        padding: '4px 12px',
        borderRadius: '20px',
        backgroundColor: COLORS.blue[500] + '15',
        color: COLORS.blue[600],
        fontSize: '12px',
        fontWeight: 600,
        marginBottom: '12px',
      }}>
        {question.category || 'Frage'}
      </div>
      <p style={{
        fontSize: '18px',
        fontWeight: 500,
        color: COLORS.slate[900],
        margin: 0,
        lineHeight: 1.5,
      }}>
        {question.question}
      </p>
      {question.estimated_answer_time && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginTop: '12px',
          color: COLORS.slate[500],
          fontSize: '13px',
        }}>
          <Clock style={{ width: '14px', height: '14px' }} />
          Empfohlene Antwortzeit: ca. {Math.round(question.estimated_answer_time / 60)} Min
        </div>
      )}
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
 * Audio Recorder Component
 */
const AudioRecorder = ({ onRecordingComplete, timeLimit, disabled }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
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

  // Cleanup on unmount
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

  // Auto-stop when time limit reached
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

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Set up audio analyzer for level visualization
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;

      // Start level monitoring
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

      // Set up MediaRecorder
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

      mediaRecorderRef.current.start(1000); // Collect data every second
      setIsRecording(true);

      // Start timer
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
      // Reset for next recording
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
                  backgroundColor: COLORS.blue[500],
                  borderRadius: '3px',
                  transition: 'height 0.1s ease',
                }}
              />
            );
          })}
        </div>
      )}

      {/* Recording Button */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
        {!isRecording ? (
          <button
            onClick={startRecording}
            disabled={disabled}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              padding: '16px 32px',
              borderRadius: '50px',
              border: 'none',
              background: disabled
                ? COLORS.slate[300]
                : `linear-gradient(90deg, ${COLORS.blue[600]} 0%, ${COLORS.teal[500]} 100%)`,
              color: 'white',
              fontSize: '16px',
              fontWeight: 600,
              cursor: disabled ? 'not-allowed' : 'pointer',
              boxShadow: disabled ? 'none' : '0 4px 12px rgba(74, 158, 201, 0.3)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!disabled) {
                e.target.style.transform = 'scale(1.05)';
                e.target.style.boxShadow = '0 6px 16px rgba(74, 158, 201, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = disabled ? 'none' : '0 4px 12px rgba(74, 158, 201, 0.3)';
            }}
          >
            <Mic style={{ width: '24px', height: '24px' }} />
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
              padding: '16px 32px',
              borderRadius: '50px',
              border: 'none',
              backgroundColor: COLORS.red[500],
              color: 'white',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
              animation: 'pulse 2s infinite',
            }}
          >
            <Square style={{ width: '20px', height: '20px' }} />
            Aufnahme beenden
          </button>
        )}
      </div>

      {/* Recording Hint */}
      {!isRecording && (
        <p style={{
          textAlign: 'center',
          marginTop: '16px',
          color: COLORS.slate[500],
          fontSize: '14px',
        }}>
          Klicke auf den Button, um deine Antwort aufzunehmen
        </p>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};

/**
 * Pre-Session View Component
 * Shows preparation tips before starting the interview
 */
const PreSessionView = ({ scenario, variables, questions, onStart, onBack }) => {
  // Tips for interview preparation
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

  // Context-specific info from variables
  const contextInfo = variables ? Object.entries(variables)
    .filter(([key, value]) => value && value.trim && value.trim() !== '')
    .map(([key, value]) => ({
      label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: value
    })) : [];

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      {/* Header with Start Button */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '24px',
        }}>
          <button
            onClick={onBack}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              border: 'none',
              background: 'transparent',
              color: COLORS.slate[600],
              fontSize: '14px',
              cursor: 'pointer',
              borderRadius: '8px',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => e.target.style.background = COLORS.slate[100]}
            onMouseLeave={(e) => e.target.style.background = 'transparent'}
          >
            <ArrowLeft style={{ width: '18px', height: '18px' }} />
            Zurück
          </button>

          {/* Start Button - prominently placed at top */}
          <button
            onClick={onStart}
            style={{
              padding: '14px 28px',
              borderRadius: '12px',
              border: 'none',
              background: `linear-gradient(90deg, ${COLORS.blue[600]} 0%, ${COLORS.teal[500]} 100%)`,
              color: 'white',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 4px 12px rgba(74, 158, 201, 0.3)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 16px rgba(74, 158, 201, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'none';
              e.target.style.boxShadow = '0 4px 12px rgba(74, 158, 201, 0.3)';
            }}
          >
            <Play style={{ width: '20px', height: '20px' }} />
            Gespräch starten
          </button>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: `linear-gradient(135deg, ${COLORS.blue[500]} 0%, ${COLORS.teal[500]} 100%)`,
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
          backgroundColor: COLORS.blue[500] + '10',
          marginBottom: '24px',
        }}>
          <h3 style={{
            fontSize: '14px',
            fontWeight: 600,
            color: COLORS.blue[600],
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

      {/* Tips Section */}
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
                backgroundColor: COLORS.blue[500] + '15',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <tip.icon style={{ width: '22px', height: '22px', color: COLORS.blue[600] }} />
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
        marginBottom: '32px',
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
        <div>
          <span style={{ fontSize: '12px', color: COLORS.slate[500], display: 'block' }}>Geschätzte Dauer</span>
          <span style={{ fontSize: '18px', fontWeight: 600, color: COLORS.slate[900] }}>
            ~{Math.round((questions.length * (scenario.time_limit_per_question || 120)) / 60)} Min
          </span>
        </div>
      </div>

    </div>
  );
};

/**
 * Simulator Session Component
 *
 * Main session interface with question display, audio recording,
 * and immediate feedback after each answer
 */
const SimulatorSession = ({ session, questions, scenario, variables, onComplete, onExit }) => {
  const [phase, setPhase] = useState('preparation'); // 'preparation' | 'interview'
  const [currentIndex, setCurrentIndex] = useState(session.current_question_index || 0);
  const [feedback, setFeedback] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [completedAnswers, setCompletedAnswers] = useState([]);
  const [answeredQuestions, setAnsweredQuestions] = useState([]);

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const isFirstQuestion = currentIndex === 0;

  const handleRecordingComplete = async (audioBlob) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Submit audio and get immediate feedback
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

      // Track completed answer
      setCompletedAnswers(prev => [
        ...prev.filter(a => a.questionIndex !== currentIndex),
        { questionIndex: currentIndex, feedback: response.data }
      ]);

      // Track answered question
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

  const handleNext = async () => {
    setFeedback(null);
    setShowFeedback(false);
    setSubmitError(null);

    if (isLastQuestion) {
      // Complete the session
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
    } else {
      setCurrentIndex(prev => prev + 1);
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

  // Navigation handlers for skipping questions
  const handleNavPrev = () => {
    if (currentIndex > 0) {
      setFeedback(null);
      setShowFeedback(false);
      setSubmitError(null);
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleNavNext = () => {
    if (currentIndex < questions.length - 1) {
      setFeedback(null);
      setShowFeedback(false);
      setSubmitError(null);
      setCurrentIndex(prev => prev + 1);
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

  // Show preparation view first
  if (phase === 'preparation') {
    return (
      <PreSessionView
        scenario={scenario}
        variables={variables}
        questions={questions}
        onStart={handleStartInterview}
        onBack={onExit}
      />
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
      }}>
        <div>
          <h1 style={{
            fontSize: '20px',
            fontWeight: 700,
            color: COLORS.slate[900],
            margin: 0,
          }}>
            {scenario.title}
          </h1>
          <p style={{
            fontSize: '14px',
            color: COLORS.slate[500],
            margin: '4px 0 0 0',
          }}>
            Beantworte die Fragen mit deinem Mikrofon
          </p>
        </div>
        <button
          onClick={handleExitConfirm}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 12px',
            border: `1px solid ${COLORS.slate[300]}`,
            borderRadius: '8px',
            backgroundColor: 'white',
            color: COLORS.slate[600],
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.target.style.borderColor = COLORS.red[500];
            e.target.style.color = COLORS.red[500];
          }}
          onMouseLeave={(e) => {
            e.target.style.borderColor = COLORS.slate[300];
            e.target.style.color = COLORS.slate[600];
          }}
        >
          <X style={{ width: '16px', height: '16px' }} />
          Beenden
        </button>
      </div>

      {/* Progress with Navigation */}
      <ProgressBarWithNav
        current={currentIndex + 1}
        total={questions.length}
        onPrev={handleNavPrev}
        onNext={handleNavNext}
        answeredQuestions={answeredQuestions}
      />

      {/* Question */}
      <QuestionDisplay
        question={currentQuestion}
        questionNumber={currentIndex + 1}
      />

      {/* Question-specific Tips */}
      {currentQuestion.tips && currentQuestion.tips.length > 0 && !showFeedback && (
        <QuestionTips tips={currentQuestion.tips} />
      )}

      {/* Recording or Feedback */}
      {!showFeedback ? (
        <>
          <AudioRecorder
            onRecordingComplete={handleRecordingComplete}
            timeLimit={scenario.time_limit_per_question || 120}
            disabled={isSubmitting}
          />

          {/* Submitting State */}
          {isSubmitting && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '32px',
              marginTop: '24px',
              borderRadius: '16px',
              backgroundColor: COLORS.slate[100],
            }}>
              <Loader2 style={{
                width: '48px',
                height: '48px',
                color: COLORS.blue[500],
                animation: 'spin 1s linear infinite',
              }} />
              <p style={{
                marginTop: '16px',
                color: COLORS.slate[700],
                fontSize: '16px',
                fontWeight: 500,
              }}>
                Deine Antwort wird analysiert...
              </p>
              <p style={{
                marginTop: '4px',
                color: COLORS.slate[500],
                fontSize: '14px',
              }}>
                Die KI transkribiert und bewertet deine Antwort
              </p>
            </div>
          )}

          {/* Error State */}
          {submitError && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '24px',
              marginTop: '24px',
              borderRadius: '16px',
              backgroundColor: COLORS.red[100],
            }}>
              <AlertCircle style={{ width: '32px', height: '32px', color: COLORS.red[500] }} />
              <p style={{
                marginTop: '12px',
                color: COLORS.red[500],
                fontWeight: 600,
              }}>
                {submitError}
              </p>
              <button
                onClick={handleRetry}
                style={{
                  marginTop: '16px',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: COLORS.red[500],
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Erneut versuchen
              </button>
            </div>
          )}
        </>
      ) : (
        <ImmediateFeedback
          transcript={feedback.transcript}
          feedback={feedback.feedback}
          audioMetrics={feedback.audio_analysis}
          onRetry={scenario.allow_retry ? handleRetry : null}
          onNext={handleNext}
          isLastQuestion={isLastQuestion}
        />
      )}

      {/* Bottom Navigation */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '24px',
        paddingTop: '24px',
        borderTop: `1px solid ${COLORS.slate[200]}`,
      }}>
        <button
          onClick={handleNavPrev}
          disabled={isFirstQuestion}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '12px 20px',
            borderRadius: '10px',
            border: `1px solid ${isFirstQuestion ? COLORS.slate[200] : COLORS.slate[300]}`,
            backgroundColor: 'white',
            color: isFirstQuestion ? COLORS.slate[400] : COLORS.slate[700],
            fontSize: '14px',
            fontWeight: 500,
            cursor: isFirstQuestion ? 'not-allowed' : 'pointer',
          }}
        >
          <ArrowLeft style={{ width: '16px', height: '16px' }} />
          Vorherige Frage
        </button>

        {/* Complete button when all questions answered or on last question */}
        {(answeredQuestions.length === questions.length || isLastQuestion) && (
          <button
            onClick={handleCompleteSession}
            style={{
              padding: '12px 24px',
              borderRadius: '10px',
              border: 'none',
              background: `linear-gradient(90deg, ${COLORS.green[500]} 0%, ${COLORS.teal[500]} 100%)`,
              color: 'white',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <CheckCircle style={{ width: '18px', height: '18px' }} />
            Training abschließen
          </button>
        )}

        <button
          onClick={handleNavNext}
          disabled={isLastQuestion}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '12px 20px',
            borderRadius: '10px',
            border: `1px solid ${isLastQuestion ? COLORS.slate[200] : COLORS.slate[300]}`,
            backgroundColor: 'white',
            color: isLastQuestion ? COLORS.slate[400] : COLORS.slate[700],
            fontSize: '14px',
            fontWeight: 500,
            cursor: isLastQuestion ? 'not-allowed' : 'pointer',
          }}
        >
          Nächste Frage
          <ChevronRight style={{ width: '16px', height: '16px' }} />
        </button>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SimulatorSession;
