import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Video, VideoOff, Mic, MicOff, StopCircle, PlayCircle, ChevronLeft, ChevronRight,
  Clock, AlertCircle, Loader2, Lightbulb, X, Check, Camera, RefreshCw, Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getWPNonce, getWPApiUrl } from '@/services/wordpress-api';
import { useBranding } from '@/hooks/useBranding';
import { useMobile } from '@/hooks/useMobile';
import DeviceSettingsDialog from '@/components/DeviceSettingsDialog';
import AudioVisualizer from '@/components/AudioVisualizer';
import { formatDuration } from '@/utils/formatting';
import ProgressBar from '@/components/ui/progress-bar';

/**
 * QuestionTips - Collapsible tips for current question
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
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {tips.map((tip, i) => (
                  <li key={i} style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px', lineHeight: 1.5 }}>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * VideoTrainingSession - Video recording component
 */
const VideoTrainingSession = ({ session, questions, scenario, variables, onComplete, onExit, selectedMicrophoneId: initialMicId, selectedCameraId: initialCameraId }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [stream, setStream] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  // Device selection state
  const [selectedMicrophoneId, setSelectedMicrophoneId] = useState(initialMicId || null);
  const [selectedCameraId, setSelectedCameraId] = useState(initialCameraId || null);
  const [showDeviceSettings, setShowDeviceSettings] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  // Mobile detection - using shared hook
  const isMobile = useMobile();

  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const timerRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Partner theming - using shared hook
  const b = useBranding();
  const { primaryAccent, headerGradient: themedGradient } = b;

  const currentQuestion = questions[currentQuestionIndex];

  // Initialize camera on mount
  useEffect(() => {
    initializeCamera();
    return () => {
      stopCamera();
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  // Audio level analysis for visualizer
  const startAudioAnalysis = (mediaStream) => {
    try {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }

      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(mediaStream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateLevel = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        const sum = dataArray.reduce((a, b) => a + b, 0);
        const average = sum / dataArray.length;
        setAudioLevel(average / 255); // Normalize to 0-1
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      };

      updateLevel();
    } catch (err) {
      console.error('[VIDEO TRAINING] Audio analysis error:', err);
    }
  };

  const stopAudioAnalysis = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setAudioLevel(0);
  };

  // Initialize camera with selected devices
  const initializeCamera = async (micId = selectedMicrophoneId, camId = selectedCameraId) => {
    try {
      setCameraError(null);

      // Stop existing stream if any
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const videoConstraints = camId
        ? { deviceId: { exact: camId }, width: { ideal: 1280 }, height: { ideal: 720 } }
        : { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' };

      const audioConstraints = micId
        ? { deviceId: { exact: micId } }
        : true;

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: audioConstraints,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('[VIDEO TRAINING] Camera error:', err);
      setCameraError('Kamera konnte nicht gestartet werden. Bitte erlaube den Zugriff auf Kamera und Mikrofon.');
    }
  };

  // Handle device change from settings dialog
  const handleMicrophoneChange = (deviceId) => {
    setSelectedMicrophoneId(deviceId);
    // If recording, don't reinitialize - changes will take effect next session
    if (!isRecording) {
      initializeCamera(deviceId, selectedCameraId);
    }
  };

  const handleCameraChange = (deviceId) => {
    setSelectedCameraId(deviceId);
    // If recording, don't reinitialize - changes will take effect next session
    if (!isRecording) {
      initializeCamera(selectedMicrophoneId, deviceId);
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  // Start recording
  const startRecording = () => {
    if (!stream) {
      initializeCamera();
      return;
    }

    try {
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9,opus' });
      mediaRecorderRef.current = mediaRecorder;
      const chunks = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
          setRecordedChunks((prev) => [...prev, e.data]);
        }
      };

      mediaRecorder.onstop = () => {
      };

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setIsPaused(false);

      // Start audio analysis for visualizer
      startAudioAnalysis(stream);

      // Record start time for current question
      setTimeline((prev) => [
        ...prev,
        { question_index: currentQuestionIndex, start_time: recordingTime },
      ]);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('[VIDEO TRAINING] Recording error:', err);
      setError('Fehler beim Starten der Aufnahme');
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stopAudioAnalysis();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  // Go to next question
  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      // Record end time for current question and start time for next
      if (isRecording) {
        setTimeline((prev) => [
          ...prev,
          { question_index: currentQuestionIndex + 1, start_time: recordingTime },
        ]);
      }
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  // Go to previous question
  const goToPrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  // Finish and upload
  const finishRecording = async () => {
    stopRecording();
    setIsUploading(true);
    setError(null);

    try {
      // Create video blob
      const videoBlob = new Blob(recordedChunks, { type: 'video/webm' });
      const apiUrl = getWPApiUrl();

      // Use FormData for file upload (avoids 413 error with large files)
      const formData = new FormData();
      formData.append('video', videoBlob, `video_${session.id}.webm`);
      formData.append('video_duration', recordingTime.toString());
      formData.append('timeline', JSON.stringify(timeline));

      // Upload video using FormData
      const uploadResponse = await fetch(`${apiUrl}/video-training/sessions/${session.id}/video`, {
        method: 'POST',
        headers: {
          'X-WP-Nonce': getWPNonce(),
          // Don't set Content-Type - browser will set it with boundary for FormData
        },
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('[VIDEO TRAINING] Upload failed:', uploadResponse.status, errorText);
        if (uploadResponse.status === 413) {
          throw new Error('Das Video ist zu groß zum Hochladen. Bitte versuche eine kürzere Aufnahme.');
        }
        throw new Error('Fehler beim Hochladen des Videos. Status: ' + uploadResponse.status);
      }

      const uploadData = await uploadResponse.json();

      setIsUploading(false);
      setIsAnalyzing(true);

      // Analyze video
      const analyzeResponse = await fetch(`${apiUrl}/video-training/sessions/${session.id}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': getWPNonce(),
        },
      });

      if (!analyzeResponse.ok) {
        throw new Error('Fehler bei der Video-Analyse');
      }

      const analyzeData = await analyzeResponse.json();

      // Complete session
      onComplete({
        session: analyzeData.data?.session || session,
        analysis: analyzeData.data?.analysis,
        categoryScores: analyzeData.data?.category_scores,
        overallScore: analyzeData.data?.overall_score,
      });
    } catch (err) {
      console.error('[VIDEO TRAINING] Upload/Analysis error:', err);
      setError(err.message);
      setIsUploading(false);
      setIsAnalyzing(false);
    }
  };

  // Convert blob to base64
  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };


  // Handle exit
  const handleExit = () => {
    stopRecording();
    stopCamera();
    onExit();
  };

  // Upload/Analyzing state - Full screen blocking overlay to prevent navigation
  if (isUploading || isAnalyzing) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999, // Above sidebar (z-50) and all other elements
          background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 50%, #f0fdfa 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
        }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{
            background: '#fff',
            borderRadius: '20px',
            padding: '48px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
            maxWidth: '500px',
            width: '100%',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: `${primaryAccent}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}
          >
            <Loader2
              size={40}
              color={primaryAccent}
              style={{ animation: 'spin 1s linear infinite' }}
            />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
            {isUploading ? 'Video wird hochgeladen...' : 'KI analysiert dein Video...'}
          </h2>
          <p style={{ color: '#64748b', fontSize: '15px', lineHeight: 1.6 }}>
            {isUploading
              ? 'Dein Video wird sicher übertragen. Dies kann je nach Dateigröße einen Moment dauern.'
              : 'Die KI analysiert dein Auftreten, deine Körpersprache und Kommunikation. Das dauert etwa 30-60 Sekunden.'}
          </p>
        </motion.div>
        <style>
          {`@keyframes spin { to { transform: rotate(360deg); } }`}
        </style>
      </div>
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
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={handleExit}
            style={{
              padding: isMobile ? '10px 14px' : '8px 16px',
              borderRadius: '8px',
              background: '#f1f5f9',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              color: '#64748b',
              fontSize: '14px',
            }}
          >
            <X size={16} />
            Abbrechen
          </button>
        </div>
      </div>

      {/* Progress */}
      <ProgressBar current={currentQuestionIndex} total={questions.length} primaryAccent={primaryAccent} b={b} showCompleted={false} />

      {/* Main Content - Mobile: stacked, Desktop: two columns */}
      {isMobile ? (
        /* Mobile Layout - Stacked vertically: Question first, then Video */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Question Panel - Mobile */}
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
                  background: themedGradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                {currentQuestionIndex + 1}
              </div>
              <span style={{ fontSize: '13px', color: '#64748b' }}>
                {currentQuestion?.category || 'Frage'}
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
              {currentQuestion?.question || 'Frage wird geladen...'}
            </p>

            {currentQuestion?.estimated_time && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '13px', marginTop: '12px' }}>
                <Clock size={14} />
                Empfohlene Antwortzeit: ~{Math.round(currentQuestion.estimated_time / 60)} Min.
              </div>
            )}

            {/* Tips - collapsed by default on mobile */}
            {scenario?.enable_tips && currentQuestion?.tips && (
              <QuestionTips tips={currentQuestion.tips} primaryAccent={primaryAccent} />
            )}
          </div>

          {/* Video Preview - Mobile */}
          <div>
            <div
              style={{
                position: 'relative',
                background: '#000',
                borderRadius: '16px',
                overflow: 'hidden',
                aspectRatio: '16/9',
              }}
            >
              {cameraError ? (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    padding: '16px',
                    textAlign: 'center',
                  }}
                >
                  <VideoOff size={40} style={{ marginBottom: '12px', opacity: 0.6 }} />
                  <p style={{ marginBottom: '12px', fontSize: '14px' }}>{cameraError}</p>
                  <button
                    onClick={initializeCamera}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '8px',
                      background: primaryAccent,
                      color: '#fff',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '14px',
                    }}
                  >
                    <RefreshCw size={16} />
                    Erneut versuchen
                  </button>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: 'scaleX(-1)',
                  }}
                />
              )}

              {/* Recording indicator */}
              {isRecording && (
                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(0, 0, 0, 0.6)',
                    padding: '6px 12px',
                    borderRadius: '6px',
                  }}
                >
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#ef4444',
                      animation: 'pulse 1.5s infinite',
                    }}
                  />
                  <span style={{ color: '#fff', fontSize: '13px', fontWeight: 500 }}>
                    {formatDuration(recordingTime)}
                  </span>
                </div>
              )}

              {/* Time display when not recording */}
              {!isRecording && recordingTime > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(0, 0, 0, 0.6)',
                    padding: '6px 12px',
                    borderRadius: '6px',
                  }}
                >
                  <Clock size={14} color="#fff" />
                  <span style={{ color: '#fff', fontSize: '13px' }}>{formatDuration(recordingTime)}</span>
                </div>
              )}
            </div>

            {/* Audio Visualizer - Mobile */}
            {isRecording && (
              <div style={{ marginTop: '16px' }}>
                <AudioVisualizer
                  audioLevel={audioLevel}
                  isActive={true}
                  variant="bars"
                  size="sm"
                  accentColor={primaryAccent}
                />
              </div>
            )}

            {/* Controls - Mobile */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              {/* Recording button with settings */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                {/* Settings button */}
                <button
                  onClick={() => setShowDeviceSettings(true)}
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    background: '#f1f5f9',
                    border: '1px solid #e2e8f0',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Settings size={20} color="#64748b" />
                </button>

                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    disabled={!stream}
                    style={{
                      padding: '14px 24px',
                      borderRadius: '12px',
                      background: stream ? '#ef4444' : '#94a3b8',
                      color: '#fff',
                      border: 'none',
                      cursor: stream ? 'pointer' : 'not-allowed',
                      fontSize: '15px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      flex: 1,
                      justifyContent: 'center',
                      boxShadow: stream ? '0 4px 14px rgba(239, 68, 68, 0.4)' : 'none',
                    }}
                  >
                    <Video size={20} />
                    Aufnahme starten
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    style={{
                      padding: '14px 24px',
                      borderRadius: '12px',
                      background: '#f1f5f9',
                      color: '#0f172a',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '15px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      flex: 1,
                      justifyContent: 'center',
                    }}
                  >
                    <StopCircle size={20} color="#ef4444" />
                    Aufnahme pausieren
                  </button>
                )}
              </div>

              {/* Navigation and finish buttons - Mobile */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {/* Previous button */}
                {scenario?.enable_navigation && currentQuestionIndex > 0 && (
                  <button
                    onClick={goToPrevQuestion}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: '#fff',
                      border: '1px solid #e2e8f0',
                      cursor: 'pointer',
                      color: '#0f172a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      fontSize: '13px',
                      flex: 1,
                    }}
                  >
                    <ChevronLeft size={16} />
                    Zurück
                  </button>
                )}

                {/* Next button */}
                {scenario?.enable_navigation && currentQuestionIndex < questions.length - 1 && (
                  <button
                    onClick={goToNextQuestion}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: primaryAccent,
                      border: 'none',
                      cursor: 'pointer',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      fontSize: '13px',
                      fontWeight: 500,
                      flex: 1,
                    }}
                  >
                    Nächste
                    <ChevronRight size={16} />
                  </button>
                )}

                {/* Finish button */}
                <button
                  onClick={finishRecording}
                  disabled={recordedChunks.length === 0}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: recordedChunks.length === 0 ? '#94a3b8' : '#22c55e',
                    border: 'none',
                    cursor: recordedChunks.length === 0 ? 'not-allowed' : 'pointer',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    fontSize: '13px',
                    fontWeight: 600,
                    flex: 1,
                    boxShadow: recordedChunks.length > 0 ? '0 4px 14px rgba(34, 197, 94, 0.3)' : 'none',
                  }}
                >
                  <Check size={16} />
                  Abschließen
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Desktop Layout - Two columns */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Video Preview */}
          <div>
          <div
            style={{
              position: 'relative',
              background: '#000',
              borderRadius: '16px',
              overflow: 'hidden',
              aspectRatio: '16/9',
            }}
          >
            {cameraError ? (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  padding: '20px',
                  textAlign: 'center',
                }}
              >
                <VideoOff size={48} style={{ marginBottom: '16px', opacity: 0.6 }} />
                <p style={{ marginBottom: '16px' }}>{cameraError}</p>
                <button
                  onClick={initializeCamera}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    background: primaryAccent,
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <RefreshCw size={16} />
                  Erneut versuchen
                </button>
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: 'scaleX(-1)', // Mirror effect
                }}
              />
            )}

            {/* Recording indicator */}
            {isRecording && (
              <div
                style={{
                  position: 'absolute',
                  top: '16px',
                  left: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(0, 0, 0, 0.6)',
                  padding: '8px 14px',
                  borderRadius: '8px',
                }}
              >
                <div
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: '#ef4444',
                    animation: 'pulse 1.5s infinite',
                  }}
                />
                <span style={{ color: '#fff', fontSize: '14px', fontWeight: 500 }}>
                  {formatDuration(recordingTime)}
                </span>
              </div>
            )}

            {/* Time display when not recording */}
            {!isRecording && recordingTime > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '16px',
                  left: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(0, 0, 0, 0.6)',
                  padding: '8px 14px',
                  borderRadius: '8px',
                }}
              >
                <Clock size={16} color="#fff" />
                <span style={{ color: '#fff', fontSize: '14px' }}>{formatDuration(recordingTime)}</span>
              </div>
            )}
          </div>

          {/* Audio Visualizer - Desktop */}
          {isRecording && (
            <div style={{ marginTop: '20px' }}>
              <AudioVisualizer
                audioLevel={audioLevel}
                isActive={true}
                variant="bars"
                size="sm"
                accentColor={primaryAccent}
              />
            </div>
          )}

          {/* Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
            {/* Recording button with settings */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              {/* Settings button */}
              <button
                onClick={() => setShowDeviceSettings(true)}
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  background: '#f1f5f9',
                  border: '1px solid #e2e8f0',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Settings size={20} color="#64748b" />
              </button>

              {!isRecording ? (
                <button
                  onClick={startRecording}
                  disabled={!stream}
                  style={{
                    padding: '14px 28px',
                    borderRadius: '12px',
                    background: stream ? '#ef4444' : '#94a3b8',
                    color: '#fff',
                    border: 'none',
                    cursor: stream ? 'pointer' : 'not-allowed',
                    fontSize: '16px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    boxShadow: stream ? '0 4px 14px rgba(239, 68, 68, 0.4)' : 'none',
                  }}
                >
                  <Video size={20} />
                  Aufnahme starten
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  style={{
                    padding: '14px 28px',
                    borderRadius: '12px',
                    background: '#f1f5f9',
                    color: '#0f172a',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <StopCircle size={20} color="#ef4444" />
                  Aufnahme pausieren
                </button>
              )}
            </div>

            {/* Navigation buttons - always visible */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {/* Previous button - only show if enable_navigation and not first question */}
              {scenario?.enable_navigation && currentQuestionIndex > 0 && (
                <button
                  onClick={goToPrevQuestion}
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
                  Vorherige
                </button>
              )}

              {/* Next button - only show if enable_navigation and not last question */}
              {scenario?.enable_navigation && currentQuestionIndex < questions.length - 1 && (
                <button
                  onClick={goToNextQuestion}
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
                  Nächste
                  <ChevronRight size={18} />
                </button>
              )}

              {/* Finish button - always visible */}
              <button
                onClick={finishRecording}
                disabled={recordedChunks.length === 0}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  background: recordedChunks.length === 0 ? '#94a3b8' : '#22c55e',
                  border: 'none',
                  cursor: recordedChunks.length === 0 ? 'not-allowed' : 'pointer',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '14px',
                  fontWeight: 600,
                  boxShadow: recordedChunks.length > 0 ? '0 4px 14px rgba(34, 197, 94, 0.3)' : 'none',
                }}
              >
                <Check size={18} />
                Training abschließen
              </button>
            </div>
          </div>
        </div>

        {/* Question Panel */}
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
                background: themedGradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              {currentQuestionIndex + 1}
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

          {currentQuestion?.estimated_time && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '14px', marginBottom: '16px' }}>
              <Clock size={16} />
              Empfohlene Antwortzeit: ~{Math.round(currentQuestion.estimated_time / 60)} Min.
            </div>
          )}

          {/* Tips */}
          {scenario?.enable_tips && currentQuestion?.tips && (
            <QuestionTips tips={currentQuestion.tips} primaryAccent={primaryAccent} />
          )}
        </div>
      </div>
      )}

      {/* Error display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginTop: '24px',
            padding: '16px',
            background: '#fef2f2',
            borderRadius: '12px',
            border: '1px solid #fecaca',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <AlertCircle size={20} color="#ef4444" />
          <p style={{ color: '#dc2626', fontSize: '14px', flex: 1 }}>{error}</p>
          <button
            onClick={() => setError(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
          >
            <X size={16} color="#ef4444" />
          </button>
        </motion.div>
      )}

      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}
      </style>

      {/* Device Settings Dialog */}
      <DeviceSettingsDialog
        isOpen={showDeviceSettings}
        onClose={() => setShowDeviceSettings(false)}
        mode="audio-video"
        selectedMicrophoneId={selectedMicrophoneId}
        onMicrophoneChange={handleMicrophoneChange}
        selectedCameraId={selectedCameraId}
        onCameraChange={handleCameraChange}
      />
    </div>
  );
};

export default VideoTrainingSession;
