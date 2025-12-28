import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  Square,
  Pause,
  Play,
  Trash2,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { getBestSupportedMimeType, fileToBase64 } from '@/utils/audio';
import wordpressAPI from '@/services/wordpress-api';

/**
 * Format duration in seconds to MM:SS format
 */
const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * AudioWaveform - Visual feedback during recording
 */
const AudioWaveform = ({ isRecording, analyserNode }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!isRecording || !analyserNode || !canvasRef.current) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!isRecording) return;

      analyserNode.getByteFrequencyData(dataArray);

      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.8;

        // Gradient from primary color
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#6366f1');
        gradient.addColorStop(1, '#8b5cf6');
        ctx.fillStyle = gradient;

        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
        x += barWidth + 1;
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRecording, analyserNode]);

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={40}
      style={{
        borderRadius: '8px',
        backgroundColor: '#f1f5f9',
      }}
    />
  );
};

/**
 * AudioRecorder Component
 *
 * ChatGPT-style audio recorder with:
 * - Record/Stop functionality
 * - Pause/Resume support
 * - Visual waveform
 * - Timer display
 * - Delete to discard
 * - Transcribe and append to text
 */
const AudioRecorder = ({ onTranscriptReady, disabled = false }) => {
  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Refs
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    audioChunksRef.current = [];
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Start recording
  const startRecording = async () => {
    try {
      setError(null);
      setSuccess(false);

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // Set up audio context for visualization
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      // Get best supported MIME type
      const mimeType = getBestSupportedMimeType() || 'audio/webm';

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      setIsPaused(false);
      setDuration(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('[AudioRecorder] Error starting recording:', err);
      setError('Mikrofon-Zugriff verweigert. Bitte erlaube den Zugriff auf das Mikrofon.');
    }
  };

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    }
  }, [isRecording]);

  // Pause/Resume recording
  const togglePause = useCallback(() => {
    if (mediaRecorderRef.current) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        timerRef.current = setInterval(() => {
          setDuration(prev => prev + 1);
        }, 1000);
      } else {
        mediaRecorderRef.current.pause();
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
      setIsPaused(!isPaused);
    }
  }, [isPaused]);

  // Delete recording
  const deleteRecording = useCallback(() => {
    cleanup();
    setIsRecording(false);
    setIsPaused(false);
    setDuration(0);
    setError(null);
  }, [cleanup]);

  // Transcribe and send
  const transcribeAndSend = useCallback(async () => {
    if (audioChunksRef.current.length === 0) {
      setError('Keine Audio-Aufnahme vorhanden.');
      return;
    }

    setIsTranscribing(true);
    setError(null);

    try {
      // Create blob from chunks
      const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

      // Check minimum size
      if (audioBlob.size < 1000) {
        throw new Error('Aufnahme zu kurz. Bitte sprich länger.');
      }

      // Convert to base64
      const base64 = await fileToBase64(audioBlob);

      // Send to Whisper API
      const result = await wordpressAPI.transcribeAudio(base64, mimeType);

      if (result.transcript) {
        onTranscriptReady(result.transcript);
        setSuccess(true);

        // Reset after success
        setTimeout(() => {
          deleteRecording();
          setSuccess(false);
        }, 1500);
      } else {
        throw new Error('Keine Transkription erhalten.');
      }
    } catch (err) {
      console.error('[AudioRecorder] Transcription error:', err);
      setError(err.message || 'Fehler bei der Transkription.');
    } finally {
      setIsTranscribing(false);
    }
  }, [onTranscriptReady, deleteRecording]);

  // Has recorded audio?
  const hasRecording = audioChunksRef.current.length > 0 && !isRecording;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '10px',
              color: '#dc2626',
              fontSize: '13px',
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success message */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '10px',
              color: '#16a34a',
              fontSize: '13px',
            }}
          >
            <CheckCircle size={16} />
            <span>Text erfolgreich hinzugefügt!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recording UI */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 16px',
          backgroundColor: isRecording ? '#fef3f2' : '#f8fafc',
          border: `1px solid ${isRecording ? '#fecaca' : '#e2e8f0'}`,
          borderRadius: '12px',
          transition: 'all 0.2s',
        }}
      >
        {/* Main Record/Stop Button */}
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={disabled || isTranscribing}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: isRecording ? '#ef4444' : '#6366f1',
            color: 'white',
            cursor: disabled ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            boxShadow: isRecording
              ? '0 0 0 4px rgba(239, 68, 68, 0.2)'
              : '0 2px 8px rgba(99, 102, 241, 0.3)',
          }}
        >
          {isRecording ? (
            <Square size={18} fill="white" />
          ) : (
            <Mic size={20} />
          )}
        </button>

        {/* Waveform or Timer */}
        {isRecording ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <AudioWaveform isRecording={isRecording} analyserNode={analyserRef.current} />
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: '16px',
                fontWeight: 600,
                color: isPaused ? '#94a3b8' : '#ef4444',
                minWidth: '60px',
              }}
            >
              {formatDuration(duration)}
            </span>
          </div>
        ) : hasRecording ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
            <span style={{ fontSize: '14px', color: '#64748b' }}>
              Aufnahme bereit ({formatDuration(duration)})
            </span>
          </div>
        ) : (
          <span style={{ fontSize: '14px', color: '#94a3b8', flex: 1 }}>
            Zum Starten auf das Mikrofon klicken
          </span>
        )}

        {/* Control Buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {/* Pause/Resume */}
          {isRecording && (
            <button
              onClick={togglePause}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                backgroundColor: 'white',
                color: '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
              }}
            >
              {isPaused ? <Play size={16} /> : <Pause size={16} />}
            </button>
          )}

          {/* Delete */}
          {(isRecording || hasRecording) && (
            <button
              onClick={deleteRecording}
              disabled={isTranscribing}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                border: '1px solid #fecaca',
                backgroundColor: '#fef2f2',
                color: '#dc2626',
                cursor: isTranscribing ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                opacity: isTranscribing ? 0.5 : 1,
              }}
            >
              <Trash2 size={16} />
            </button>
          )}

          {/* Send/Transcribe */}
          {hasRecording && (
            <button
              onClick={transcribeAndSend}
              disabled={isTranscribing}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#22c55e',
                color: 'white',
                cursor: isTranscribing ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)',
              }}
            >
              {isTranscribing ? (
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Send size={16} />
              )}
            </button>
          )}
        </div>
      </div>

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default AudioRecorder;
