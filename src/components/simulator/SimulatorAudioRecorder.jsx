import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Square,
  Loader2,
  CheckCircle,
  Play,
  Settings,
} from 'lucide-react';
import AudioVisualizer from '@/components/ui/composite/AudioVisualizer';
import SessionTimer from './SessionTimer';

/**
 * Audio Recorder Component - With Pause functionality
 * Handles microphone recording with pause/resume capability
 */
const SimulatorAudioRecorder = ({
  onRecordingComplete,
  timeLimit,
  disabled,
  deviceId,
  themedGradient,
  primaryAccent,
  isSubmitting,
  labels,
  onOpenSettings,
  branding,
  isMobile,
  onStreamChange
}) => {
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
      <div
        className="p-6 rounded-2xl text-center"
        style={{ backgroundColor: branding.errorLight }}
      >
        <MicOff className="w-12 h-12 mb-3 mx-auto" style={{ color: branding.error }} />
        <p className="font-semibold m-0" style={{ color: branding.error }}>Mikrofonzugriff verweigert</p>
        <p className="text-sm mt-2" style={{ color: branding.textSecondary }}>
          Bitte erlaube den Zugriff auf dein Mikrofon in den Browser-Einstellungen.
        </p>
      </div>
    );
  }

  // Dynamic button styles based on recording state
  const getMainButtonStyle = () => {
    const baseStyle = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      padding: isMobile ? '14px 20px' : '14px 28px',
      borderRadius: '12px',
      border: 'none',
      color: 'white',
      fontSize: isMobile ? '15px' : '16px',
      fontWeight: 600,
      cursor: (disabled || isSubmitting) ? 'not-allowed' : 'pointer',
      flex: isMobile ? 1 : 'none',
    };

    if (disabled || isSubmitting) {
      return {
        ...baseStyle,
        background: branding.borderColor,
        boxShadow: 'none',
      };
    }

    if (recordingState === 'idle') {
      return {
        ...baseStyle,
        background: branding.error,
        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)',
      };
    } else if (recordingState === 'recording') {
      return {
        ...baseStyle,
        background: branding.warning,
        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)',
      };
    } else {
      return {
        ...baseStyle,
        background: branding.success,
        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)',
      };
    }
  };

  return (
    <div
      className="p-6 rounded-2xl relative"
      style={{
        backgroundColor: branding.cardBg,
        border: `1px solid ${branding.borderColor}`,
      }}
    >
      {/* Settings Button - Mobile: Top right corner */}
      {isMobile && (
        <button
          onClick={onOpenSettings}
          className="absolute top-3 right-3 p-2.5 rounded-xl flex items-center justify-center"
          style={{
            background: branding.cardBgHover,
            border: `1px solid ${branding.borderColor}`,
          }}
        >
          <Settings size={18} style={{ color: branding.textMuted }} />
        </button>
      )}

      {/* Timer */}
      <div className="flex justify-center mb-6">
        <SessionTimer seconds={seconds} maxSeconds={timeLimit} isRecording={recordingState === 'recording'} branding={branding} />
      </div>

      {/* Audio Level Visualization */}
      {recordingState === 'recording' && (
        <div className="mb-6">
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
        <div className="flex justify-center items-center gap-2 h-[60px] mb-6" style={{ color: branding.warning }}>
          <Mic size={24} />
          <span className="text-base font-semibold">Aufnahme pausiert</span>
        </div>
      )}

      {/* Recording Buttons */}
      <div className="flex justify-center gap-3">
        {/* Settings Button - Desktop only (mobile has it in corner) */}
        {!isMobile && (
          <button
            onClick={onOpenSettings}
            className="p-3.5 rounded-xl flex items-center justify-center"
            style={{
              background: branding.cardBgHover,
              border: `1px solid ${branding.borderColor}`,
            }}
          >
            <Settings size={20} style={{ color: branding.textMuted }} />
          </button>
        )}

        {/* Main Button - Start/Pause/Resume */}
        <button
          onClick={handleMainButtonClick}
          disabled={disabled || isSubmitting}
          style={getMainButtonStyle()}
        >
          {recordingState === 'idle' && <><Mic className="w-5 h-5" />Aufnahme starten</>}
          {recordingState === 'recording' && <><Square className="w-[18px] h-[18px]" />Pausieren</>}
          {recordingState === 'paused' && <><Play className="w-[18px] h-[18px]" />Fortsetzen</>}
        </button>

        {/* Finish Button - Only when recording or paused */}
        {(recordingState === 'recording' || recordingState === 'paused') && (
          <button
            onClick={finishRecording}
            className="flex items-center justify-center gap-2 rounded-xl border-none font-semibold cursor-pointer"
            style={{
              padding: isMobile ? '14px 16px' : '14px 24px',
              flex: isMobile ? 1 : 'none',
              backgroundColor: branding.cardBgHover,
              color: branding.textMain,
              fontSize: isMobile ? '15px' : '16px',
            }}
          >
            <CheckCircle className="w-[18px] h-[18px]" style={{ color: branding.success }} />
            {labels?.submitButton || 'Antwort abgeben'}
          </button>
        )}
      </div>

      {/* Recording Hint */}
      {recordingState === 'idle' && !isSubmitting && (
        <p className="text-center mt-4 text-sm" style={{ color: branding.textMuted }}>
          {labels?.submitHint || 'Klicke auf den Button, um deine Antwort aufzunehmen'}
        </p>
      )}

      {/* Submitting State */}
      {isSubmitting && (
        <div className="flex flex-col items-center mt-6">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: primaryAccent }} />
          <p className="mt-3 text-sm" style={{ color: branding.textSecondary }}>
            {labels?.analyzing || 'Antwort wird analysiert...'}
          </p>
        </div>
      )}
    </div>
  );
};

export default SimulatorAudioRecorder;
