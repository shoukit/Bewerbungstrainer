/**
 * useAudioRecorder Hook
 *
 * Provides audio recording functionality with:
 * - MediaRecorder integration
 * - Audio level visualization
 * - Pause/resume support
 * - Timer tracking
 * - Cleanup on unmount
 *
 * Used by: SimulatorSession, GameSession, and other recording components
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { getBestSupportedMimeType, AUDIO_MIME_TYPES } from '@/utils/audio';

/**
 * Recording states
 */
export const RECORDING_STATES = {
  IDLE: 'idle',
  RECORDING: 'recording',
  PAUSED: 'paused',
  STOPPED: 'stopped',
};

/**
 * Default configuration
 */
const DEFAULT_CONFIG = {
  timeLimit: 120, // 2 minutes default
  timeslice: 1000, // Collect data every 1 second
  fftSize: 256, // For audio level visualization
  visualizationEnabled: true,
};

/**
 * Custom hook for audio recording with visualization
 *
 * @param {Object} options - Configuration options
 * @param {string} options.deviceId - Specific microphone device ID
 * @param {number} options.timeLimit - Maximum recording time in seconds
 * @param {Function} options.onRecordingComplete - Callback when recording finishes
 * @param {Function} options.onError - Callback for errors
 * @param {boolean} options.autoStopOnTimeLimit - Auto-stop when time limit reached
 * @param {boolean} options.visualizationEnabled - Enable audio level visualization
 * @returns {Object} Recording controls and state
 */
export function useAudioRecorder(options = {}) {
  const {
    deviceId = null,
    timeLimit = DEFAULT_CONFIG.timeLimit,
    onRecordingComplete,
    onError,
    autoStopOnTimeLimit = true,
    visualizationEnabled = DEFAULT_CONFIG.visualizationEnabled,
  } = options;

  // State
  const [recordingState, setRecordingState] = useState(RECORDING_STATES.IDLE);
  const [seconds, setSeconds] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [error, setError] = useState(null);

  // Refs for resources that need cleanup
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const streamRef = useRef(null);
  const finalDurationRef = useRef(0);
  const mimeTypeRef = useRef(null);

  /**
   * Cleanup all resources
   */
  const cleanup = useCallback(() => {
    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Stop animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    // Stop media stream tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    analyserRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Auto-stop when time limit reached
  useEffect(() => {
    if (autoStopOnTimeLimit && recordingState === RECORDING_STATES.RECORDING && seconds >= timeLimit) {
      stopRecording();
    }
  }, [seconds, timeLimit, recordingState, autoStopOnTimeLimit]);

  /**
   * Update audio level visualization
   */
  const updateAudioLevel = useCallback(() => {
    if (analyserRef.current && recordingState === RECORDING_STATES.RECORDING) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      setAudioLevel(average / 255);
    }
    animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
  }, [recordingState]);

  /**
   * Start recording
   */
  const startRecording = useCallback(async () => {
    try {
      setPermissionDenied(false);
      setError(null);
      audioChunksRef.current = [];
      setSeconds(0);

      // Get audio stream
      const audioConstraints = deviceId
        ? { deviceId: { exact: deviceId }, echoCancellation: true, noiseSuppression: true }
        : { echoCancellation: true, noiseSuppression: true };

      const stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });
      streamRef.current = stream;

      // Setup audio analysis for visualization
      if (visualizationEnabled) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);
        analyserRef.current.fftSize = DEFAULT_CONFIG.fftSize;
      }

      // Determine best MIME type
      const mimeType = getBestSupportedMimeType() || AUDIO_MIME_TYPES.WEBM;
      mimeTypeRef.current = mimeType;

      // Create MediaRecorder
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeTypeRef.current });
        if (onRecordingComplete) {
          onRecordingComplete(audioBlob, finalDurationRef.current);
        }
      };

      mediaRecorderRef.current.onerror = (event) => {
        const errorMsg = event.error?.message || 'Recording error';
        setError(errorMsg);
        if (onError) {
          onError(new Error(errorMsg));
        }
      };

      // Start recording
      mediaRecorderRef.current.start(DEFAULT_CONFIG.timeslice);
      setRecordingState(RECORDING_STATES.RECORDING);

      // Start timer
      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);

      // Start visualization
      if (visualizationEnabled) {
        updateAudioLevel();
      }
    } catch (err) {
      console.error('[useAudioRecorder] Error starting recording:', err);

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionDenied(true);
      }

      setError(err.message);
      if (onError) {
        onError(err);
      }
    }
  }, [deviceId, visualizationEnabled, onRecordingComplete, onError, updateAudioLevel]);

  /**
   * Pause recording
   */
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setRecordingState(RECORDING_STATES.PAUSED);

      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      setAudioLevel(0);
    }
  }, []);

  /**
   * Resume recording
   */
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setRecordingState(RECORDING_STATES.RECORDING);

      // Resume timer
      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);

      // Resume visualization
      if (visualizationEnabled && analyserRef.current) {
        updateAudioLevel();
      }
    }
  }, [visualizationEnabled, updateAudioLevel]);

  /**
   * Stop recording and get audio blob
   */
  const stopRecording = useCallback(() => {
    // Save final duration before resetting
    finalDurationRef.current = seconds;

    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Stop animation
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    // Stop MediaRecorder (triggers onstop callback)
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    // Stop stream tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setRecordingState(RECORDING_STATES.STOPPED);
    setAudioLevel(0);
    setSeconds(0);
  }, [seconds]);

  /**
   * Cancel recording without saving
   */
  const cancelRecording = useCallback(() => {
    cleanup();
    audioChunksRef.current = [];
    setRecordingState(RECORDING_STATES.IDLE);
    setAudioLevel(0);
    setSeconds(0);
  }, [cleanup]);

  /**
   * Reset recorder to initial state
   */
  const reset = useCallback(() => {
    cleanup();
    audioChunksRef.current = [];
    setRecordingState(RECORDING_STATES.IDLE);
    setAudioLevel(0);
    setSeconds(0);
    setError(null);
    setPermissionDenied(false);
  }, [cleanup]);

  /**
   * Toggle recording (start/pause/resume)
   */
  const toggleRecording = useCallback(() => {
    switch (recordingState) {
      case RECORDING_STATES.IDLE:
      case RECORDING_STATES.STOPPED:
        startRecording();
        break;
      case RECORDING_STATES.RECORDING:
        pauseRecording();
        break;
      case RECORDING_STATES.PAUSED:
        resumeRecording();
        break;
      default:
        break;
    }
  }, [recordingState, startRecording, pauseRecording, resumeRecording]);

  // Computed values
  const isRecording = recordingState === RECORDING_STATES.RECORDING;
  const isPaused = recordingState === RECORDING_STATES.PAUSED;
  const isIdle = recordingState === RECORDING_STATES.IDLE || recordingState === RECORDING_STATES.STOPPED;
  const progress = timeLimit > 0 ? (seconds / timeLimit) * 100 : 0;
  const isWarning = progress > 75;
  const isDanger = progress > 90;

  return {
    // State
    recordingState,
    seconds,
    audioLevel,
    permissionDenied,
    error,

    // Computed
    isRecording,
    isPaused,
    isIdle,
    progress,
    isWarning,
    isDanger,
    timeLimit,

    // Actions
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelRecording,
    toggleRecording,
    reset,
    cleanup,
  };
}

export default useAudioRecorder;
