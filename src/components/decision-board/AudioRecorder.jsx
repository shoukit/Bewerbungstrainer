import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Mic,
  X,
  Check,
  Loader2,
} from 'lucide-react';
import { getBestSupportedMimeType, fileToBase64 } from '@/utils/audio';
import wordpressAPI from '@/services/wordpress-api';
import { useBranding } from '@/hooks/useBranding';

/**
 * Format duration to M:SS format (like Gemini: 0:16)
 */
const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Common Whisper hallucination patterns to filter out
 * These appear when recording silence or very quiet audio
 */
const HALLUCINATION_PATTERNS = [
  /^untertitel/i,
  /amara\.org/i,
  /vielen dank f[üu]r'?s? zusch/i,
  /bis zum n[äa]chsten mal/i,
  /thank you for watching/i,
  /subscribe/i,
  /^\.+$/,
  /^[♪♫🎵🎶\s]+$/,
  /^\s*$/,
  /^(ähm?|uhm?|hmm?|ja|nein|ok|okay)\.?\s*$/i,
];

/**
 * Check if transcript is likely a Whisper hallucination
 */
const isHallucination = (transcript) => {
  if (!transcript || typeof transcript !== 'string') return true;

  const trimmed = transcript.trim();

  // Too short (less than 10 chars is suspicious)
  if (trimmed.length < 10) return true;

  // Check against known hallucination patterns
  for (const pattern of HALLUCINATION_PATTERNS) {
    if (pattern.test(trimmed)) {
      console.log('[AudioRecorder] Filtered hallucination:', trimmed);
      return true;
    }
  }

  return false;
};

/**
 * Simple bar waveform visualization (like Gemini)
 */
const SimpleWaveform = ({ isRecording, analyserNode, b }) => {
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

        ctx.fillStyle = b.textMain;
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
  }, [isRecording, analyserNode, b]);

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
 * 2. Recording: [X] [Waveform] [Timer] [checkmark]
 * 3. Transcribing: Loading state
 */
const AudioRecorder = ({ onTranscriptReady, disabled = false }) => {
  const b = useBranding();

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
  const speechDetectedRef = useRef(false);
  const peakLevelRef = useRef(0);
  const speechCheckIntervalRef = useRef(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (speechCheckIntervalRef.current) {
      clearInterval(speechCheckIntervalRef.current);
      speechCheckIntervalRef.current = null;
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
    speechDetectedRef.current = false;
    peakLevelRef.current = 0;
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
      speechDetectedRef.current = false;
      peakLevelRef.current = 0;

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

      // Start speech detection check
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      speechCheckIntervalRef.current = setInterval(() => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          // Calculate average level
          const average = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length;
          // Track peak level
          if (average > peakLevelRef.current) {
            peakLevelRef.current = average;
          }
          // Speech threshold: average frequency level > 20 indicates actual speech
          if (average > 20) {
            speechDetectedRef.current = true;
          }
        }
      }, 100);

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

    // Capture speech detection state before stopping
    const wasSpeechDetected = speechDetectedRef.current;
    const peakLevel = peakLevelRef.current;
    const recordingDuration = duration;

    // Stop recording
    mediaRecorderRef.current.stop();
    setIsRecording(false);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (speechCheckIntervalRef.current) {
      clearInterval(speechCheckIntervalRef.current);
      speechCheckIntervalRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Wait a bit for all data to be collected
    await new Promise(resolve => setTimeout(resolve, 100));

    if (audioChunksRef.current.length === 0) {
      setError('Keine Aufnahme');
      return;
    }

    // Check minimum duration (at least 1 second)
    if (recordingDuration < 1) {
      setError('Aufnahme zu kurz');
      cleanup();
      setDuration(0);
      return;
    }

    // Check if speech was detected
    if (!wasSpeechDetected || peakLevel < 15) {
      console.log('[AudioRecorder] No speech detected. Peak level:', peakLevel);
      setError('Keine Sprache erkannt');
      cleanup();
      setDuration(0);
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
        // Check for hallucinations
        if (isHallucination(result.transcript)) {
          throw new Error('Keine verständliche Sprache erkannt');
        }

        onTranscriptReady(result.transcript);
        cleanup();
        setDuration(0);
      } else {
        throw new Error('Keine Transkription erhalten');
      }
    } catch (err) {
      console.error('[AudioRecorder] Transcription error:', err);
      setError(err.message || 'Transkription fehlgeschlagen');
      // Clean up on error too
      cleanup();
      setDuration(0);
    } finally {
      setIsTranscribing(false);
    }
  }, [isRecording, duration, onTranscriptReady, cleanup]);

  // Transcribing state
  if (isTranscribing) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: b.space[2],
        padding: `${b.space[3]} ${b.space[4]}`,
        backgroundColor: b.cardBgHover,
        borderRadius: b.radius.full,
        border: `1px solid ${b.borderColor}`,
      }}>
        <Loader2
          size={b.iconSize['2xl']}
          color={b.textSecondary}
          style={{ animation: 'spin 1s linear infinite' }}
        />
        <span style={{ fontSize: b.fontSize.base, color: b.textSecondary }}>
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
        gap: b.space[3],
        padding: `${b.space[2]} ${b.space[3]}`,
        backgroundColor: b.cardBgHover,
        borderRadius: b.radius.full,
        border: `1px solid ${b.borderColor}`,
      }}>
        {/* Cancel button */}
        <button
          onClick={cancelRecording}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: b.radius.full,
            border: 'none',
            backgroundColor: b.borderColorLight,
            color: b.textSecondary,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: `all ${b.transition.fast}`,
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = b.borderColor;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = b.borderColorLight;
          }}
        >
          <X size={20} strokeWidth={2.5} />
        </button>

        {/* Waveform */}
        <SimpleWaveform isRecording={isRecording} analyserNode={analyserRef.current} b={b} />

        {/* Timer */}
        <span style={{
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: b.fontSize.lg,
          fontWeight: b.fontWeight.medium,
          color: b.textMain,
          minWidth: '40px',
          textAlign: 'right',
          flexShrink: 0,
        }}>
          {formatDuration(duration)}
        </span>

        {/* Confirm button */}
        <button
          onClick={confirmRecording}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: b.radius.full,
            border: 'none',
            backgroundColor: b.primaryAccent,
            color: b.white,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: `all ${b.transition.fast}`,
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.9';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
        >
          <Check size={20} strokeWidth={2.5} />
        </button>
      </div>
    );
  }

  // Idle state - just the mic button
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: b.space[2] }}>
      {error && (
        <span style={{ fontSize: b.fontSize.sm, color: b.error }}>{error}</span>
      )}
      <button
        onClick={startRecording}
        disabled={disabled}
        title="Spracheingabe"
        style={{
          width: '52px',
          height: '52px',
          borderRadius: b.radius.full,
          border: 'none',
          backgroundColor: b.textMain,
          color: b.white,
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: `all ${b.transition.fast}`,
          opacity: disabled ? 0.5 : 1,
        }}
        onMouseEnter={(e) => {
          if (!disabled) e.currentTarget.style.opacity = '0.9';
        }}
        onMouseLeave={(e) => {
          if (!disabled) e.currentTarget.style.opacity = '1';
        }}
      >
        <Mic size={24} />
      </button>
    </div>
  );
};

export default AudioRecorder;
