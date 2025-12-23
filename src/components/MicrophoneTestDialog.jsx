import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Play, Square, Volume2, CheckCircle, AlertCircle, RefreshCw, X } from 'lucide-react';
import { usePartner } from '@/context/PartnerContext';
import { DEFAULT_BRANDING } from '@/config/partners';
import { COLORS } from '@/config/colors';
import AudioVisualizer from './AudioVisualizer';

/**
 * MicrophoneTestDialog Component
 *
 * A popup dialog for testing microphone recording quality.
 * Users can record a short audio clip and play it back to verify their microphone works.
 */
const MicrophoneTestDialog = ({ isOpen, onClose, deviceId }) => {
  const [status, setStatus] = useState('idle'); // idle | recording | recorded | playing
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordedUrl, setRecordedUrl] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState(null);

  // Partner theming
  const { branding } = usePartner();
  const headerGradient = branding?.['--header-gradient'] || DEFAULT_BRANDING['--header-gradient'];
  const buttonGradient = branding?.['--button-gradient'] || headerGradient;

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const timerRef = useRef(null);
  const audioElementRef = useRef(null);

  const MAX_RECORDING_TIME = 10;

  useEffect(() => {
    return () => cleanup();
  }, []);

  useEffect(() => {
    if (isOpen) {
      resetState();
    } else {
      cleanup();
    }
  }, [isOpen]);

  const resetState = () => {
    setStatus('idle');
    setAudioLevel(0);
    setRecordingTime(0);
    setError(null);
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
      setRecordedUrl(null);
    }
  };

  const cleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch (e) {}
    }
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch (e) {}
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.src = '';
    }
  };

  const startRecording = async () => {
    try {
      setError(null);
      audioChunksRef.current = [];
      setRecordingTime(0);

      const constraints = {
        audio: deviceId ? { deviceId: { exact: deviceId } } : true
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';

      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(audioBlob);
        setRecordedUrl(url);
        setStatus('recorded');
        setAudioLevel(0);
      };

      mediaRecorderRef.current.start(100);
      setStatus('recording');

      // Level monitoring
      const updateLevel = () => {
        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          setAudioLevel(average / 255);
        }
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= MAX_RECORDING_TIME - 1) {
            stopRecording();
            return MAX_RECORDING_TIME;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err) {
      console.error('Error starting recording:', err);
      if (err.name === 'NotAllowedError') {
        setError('Mikrofonzugriff verweigert');
      } else if (err.name === 'NotFoundError') {
        setError('Kein Mikrofon gefunden');
      } else {
        setError('Fehler beim Starten der Aufnahme');
      }
    }
  };

  const stopRecording = () => {
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
  };

  const playRecording = () => {
    if (!recordedUrl) return;
    if (audioElementRef.current) audioElementRef.current.pause();
    audioElementRef.current = new Audio(recordedUrl);
    audioElementRef.current.onended = () => setStatus('recorded');
    audioElementRef.current.play();
    setStatus('playing');
  };

  const stopPlayback = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.currentTime = 0;
    }
    setStatus('recorded');
  };

  const recordAgain = () => {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedUrl(null);
    setRecordingTime(0);
    setStatus('idle');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}
      >
        {/* Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: COLORS.white,
            borderRadius: '20px',
            width: '100%',
            maxWidth: '400px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '20px 24px',
            borderBottom: `1px solid ${COLORS.slate[200]}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: headerGradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Mic style={{ width: '20px', height: '20px', color: COLORS.white }} />
              </div>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: COLORS.slate[900], margin: 0 }}>
                  Mikrofon testen
                </h2>
                <p style={{ fontSize: '13px', color: COLORS.slate[500], margin: 0 }}>
                  Prüfe deine Audioqualität
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: COLORS.slate[100],
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = COLORS.slate[200]}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = COLORS.slate[100]}
            >
              <X style={{ width: '24px', height: '24px', color: COLORS.slate[600] }} />
            </button>
          </div>

          {/* Content */}
          <div style={{ padding: '32px 24px' }}>
            {/* Error */}
            {error && (
              <div style={{
                marginBottom: '24px',
                padding: '16px',
                backgroundColor: COLORS.red[50],
                border: `1px solid ${COLORS.red[100]}`,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}>
                <AlertCircle style={{ width: '20px', height: '20px', color: COLORS.red[500] }} />
                <p style={{ fontSize: '14px', color: COLORS.red[600], margin: 0 }}>{error}</p>
              </div>
            )}

            {/* Visual indicator */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
              <div style={{ position: 'relative' }}>
                <motion.div
                  style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    backgroundColor: status === 'recording' ? COLORS.red[50] :
                                     status === 'playing' ? COLORS.green[50] :
                                     status === 'recorded' ? COLORS.green[50] : COLORS.slate[100],
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {status === 'recording' && (
                    <motion.div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '50%',
                        border: `3px solid ${COLORS.red[500]}`,
                      }}
                      animate={{ scale: [1, 1 + audioLevel * 0.3], opacity: [1, 0.3] }}
                      transition={{ duration: 0.3, repeat: Infinity }}
                    />
                  )}
                  {status === 'idle' && <Mic style={{ width: '48px', height: '48px', color: COLORS.slate[400] }} />}
                  {status === 'recording' && <Mic style={{ width: '48px', height: '48px', color: COLORS.red[500] }} />}
                  {status === 'recorded' && <CheckCircle style={{ width: '48px', height: '48px', color: COLORS.green[500] }} />}
                  {status === 'playing' && <Volume2 style={{ width: '48px', height: '48px', color: COLORS.green[600] }} />}
                </motion.div>

                {status === 'recording' && (
                  <div style={{
                    position: 'absolute',
                    bottom: '-8px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    padding: '4px 12px',
                    backgroundColor: COLORS.red[500],
                    color: COLORS.white,
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: 600,
                    fontFamily: 'monospace',
                  }}>
                    {recordingTime}s / {MAX_RECORDING_TIME}s
                  </div>
                )}
              </div>
            </div>

            {/* Audio level bars during recording */}
            {status === 'recording' && (
              <div style={{ marginBottom: '24px' }}>
                <AudioVisualizer
                  audioLevel={audioLevel}
                  isActive={true}
                  variant="bars"
                  size="sm"
                />
              </div>
            )}

            {/* Status text */}
            <p style={{
              textAlign: 'center',
              fontSize: '15px',
              color: COLORS.slate[600],
              marginBottom: '24px',
            }}>
              {status === 'idle' && 'Klicke auf "Aufnahme starten" um dein Mikrofon zu testen.'}
              {status === 'recording' && 'Sprich jetzt in dein Mikrofon...'}
              {status === 'recorded' && 'Aufnahme fertig! Höre dir das Ergebnis an.'}
              {status === 'playing' && 'Wiedergabe läuft...'}
            </p>

            {/* Action buttons */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              {status === 'idle' && (
                <button
                  onClick={startRecording}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '14px 28px',
                    borderRadius: '12px',
                    border: 'none',
                    background: buttonGradient,
                    color: COLORS.white,
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Mic style={{ width: '18px', height: '18px' }} />
                  Aufnahme starten
                </button>
              )}

              {status === 'recording' && (
                <button
                  onClick={stopRecording}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '14px 28px',
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: COLORS.red[500],
                    color: COLORS.white,
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Square style={{ width: '18px', height: '18px' }} />
                  Stoppen
                </button>
              )}

              {status === 'recorded' && (
                <>
                  <button
                    onClick={playRecording}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '14px 28px',
                      borderRadius: '12px',
                      border: 'none',
                      background: buttonGradient,
                      color: COLORS.white,
                      fontSize: '15px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <Play style={{ width: '18px', height: '18px' }} />
                    Anhören
                  </button>
                  <button
                    onClick={recordAgain}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '14px 20px',
                      borderRadius: '12px',
                      border: `2px solid ${COLORS.slate[200]}`,
                      backgroundColor: COLORS.white,
                      color: COLORS.slate[700],
                      fontSize: '15px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <RefreshCw style={{ width: '18px', height: '18px' }} />
                    Nochmal
                  </button>
                </>
              )}

              {status === 'playing' && (
                <>
                  <button
                    onClick={stopPlayback}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '14px 20px',
                      borderRadius: '12px',
                      border: `2px solid ${COLORS.slate[200]}`,
                      backgroundColor: COLORS.white,
                      color: COLORS.slate[700],
                      fontSize: '15px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <Square style={{ width: '18px', height: '18px' }} />
                    Stoppen
                  </button>
                  <button
                    onClick={recordAgain}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '14px 20px',
                      borderRadius: '12px',
                      border: `2px solid ${COLORS.slate[200]}`,
                      backgroundColor: COLORS.white,
                      color: COLORS.slate[700],
                      fontSize: '15px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <RefreshCw style={{ width: '18px', height: '18px' }} />
                    Nochmal
                  </button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MicrophoneTestDialog;
