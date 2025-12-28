import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  X,
  Check,
  Loader2,
} from 'lucide-react';
import { getBestSupportedMimeType, fileToBase64 } from '@/utils/audio';
import wordpressAPI from '@/services/wordpress-api';

/**
 * Format duration to M:SS format (like Gemini: 0:16)
 */
const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Simple bar waveform visualization (like Gemini)
 */
const SimpleWaveform = ({ isRecording, analyserNode }) => {
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

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw simple vertical bars (like Gemini's waveform)
      const barCount = 50;
      const barWidth = 2;
      const gap = (canvas.width - barCount * barWidth) / (barCount - 1);
      const centerY = canvas.height / 2;

      for (let i = 0; i < barCount; i++) {
        // Sample from different parts of the frequency data
        const dataIndex = Math.floor((i / barCount) * bufferLength);
        const value = dataArray[dataIndex] || 0;
        const barHeight = Math.max(2, (value / 255) * (canvas.height * 0.8));

        ctx.fillStyle = '#1f2937'; // Dark gray like Gemini
        ctx.fillRect(
          i * (barWidth + gap),
          centerY - barHeight / 2,
          barWidth,
          barHeight
        );
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
      height={32}
      style={{
        flex: 1,
        maxWidth: '300px',
        minWidth: '100px',
      }}
    />
  );
};

/**
 * AudioRecorder - Gemini-style inline audio recorder
 *
 * States:
 * 1. Idle: Just a mic button
 * 2. Recording: [X] [Waveform] [Timer] [✓]
 * 3. Transcribing: Loading state
 */
const AudioRecorder = ({ onTranscriptReady, disabled = false }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(null);

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

      const mimeType = getBestSupportedMimeType() || 'audio/webm';
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setDuration(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('[AudioRecorder] Error starting recording:', err);
      setError('Mikrofon-Zugriff verweigert');
    }
  };

  // Cancel recording
  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    cleanup();
    setIsRecording(false);
    setDuration(0);
    setError(null);
  }, [isRecording, cleanup]);

  // Confirm and transcribe
  const confirmRecording = useCallback(async () => {
    if (!mediaRecorderRef.current || !isRecording) return;

    // Stop recording
    mediaRecorderRef.current.stop();
    setIsRecording(false);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    // Wait a bit for all data to be collected
    await new Promise(resolve => setTimeout(resolve, 100));

    if (audioChunksRef.current.length === 0) {
      setError('Keine Aufnahme');
      return;
    }

    setIsTranscribing(true);
    setError(null);

    try {
      const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

      if (audioBlob.size < 1000) {
        throw new Error('Aufnahme zu kurz');
      }

      const base64 = await fileToBase64(audioBlob);
      const result = await wordpressAPI.transcribeAudio(base64, mimeType);

      if (result.transcript) {
        onTranscriptReady(result.transcript);
        cleanup();
        setDuration(0);
      } else {
        throw new Error('Keine Transkription erhalten');
      }
    } catch (err) {
      console.error('[AudioRecorder] Transcription error:', err);
      setError(err.message || 'Transkription fehlgeschlagen');
    } finally {
      setIsTranscribing(false);
    }
  }, [isRecording, onTranscriptReady, cleanup]);

  // Transcribing state
  if (isTranscribing) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '12px 16px',
        backgroundColor: '#f9fafb',
        borderRadius: '24px',
        border: '1px solid #e5e7eb',
      }}>
        <Loader2
          size={20}
          color="#6b7280"
          style={{ animation: 'spin 1s linear infinite' }}
        />
        <span style={{ fontSize: '14px', color: '#6b7280' }}>
          Wird transkribiert...
        </span>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Recording state
  if (isRecording) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '8px 12px',
        backgroundColor: '#f9fafb',
        borderRadius: '24px',
        border: '1px solid #e5e7eb',
      }}>
        {/* Cancel button */}
        <button
          onClick={cancelRecording}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: '#f3f4f6',
            color: '#6b7280',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#e5e7eb';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#f3f4f6';
          }}
        >
          <X size={18} strokeWidth={2.5} />
        </button>

        {/* Waveform */}
        <SimpleWaveform isRecording={isRecording} analyserNode={analyserRef.current} />

        {/* Timer */}
        <span style={{
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: '14px',
          fontWeight: 500,
          color: '#374151',
          minWidth: '36px',
          textAlign: 'right',
          flexShrink: 0,
        }}>
          {formatDuration(duration)}
        </span>

        {/* Confirm button */}
        <button
          onClick={confirmRecording}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: '#1f2937',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#111827';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#1f2937';
          }}
        >
          <Check size={18} strokeWidth={2.5} />
        </button>
      </div>
    );
  }

  // Idle state - just the mic button
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {error && (
        <span style={{ fontSize: '13px', color: '#dc2626' }}>{error}</span>
      )}
      <button
        onClick={startRecording}
        disabled={disabled}
        title="Spracheingabe"
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: 'none',
          backgroundColor: '#1f2937',
          color: 'white',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.15s',
          opacity: disabled ? 0.5 : 1,
        }}
        onMouseEnter={(e) => {
          if (!disabled) e.currentTarget.style.backgroundColor = '#111827';
        }}
        onMouseLeave={(e) => {
          if (!disabled) e.currentTarget.style.backgroundColor = '#1f2937';
        }}
      >
        <Mic size={20} />
      </button>
    </div>
  );
};

export default AudioRecorder;
