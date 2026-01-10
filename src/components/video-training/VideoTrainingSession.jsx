/**
 * VideoTrainingSession - Video Recording Component
 *
 * Handles video recording for training sessions with:
 * - Camera/microphone access
 * - Recording controls
 * - Question navigation
 * - Video upload and analysis
 *
 * Migrated to Tailwind CSS + themed components.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Video, VideoOff, StopCircle, ChevronLeft, ChevronRight,
  Clock, AlertCircle, Loader2, Lightbulb, X, Check, RefreshCw, Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getWPNonce, getWPApiUrl } from '@/services/wordpress-api';
import { usePartner } from '@/context/PartnerContext';
import { useMobile } from '@/hooks/useMobile';
import DeviceSettingsDialog from '@/components/device-setup/DeviceSettingsDialog';
import AudioVisualizer from '@/components/ui/composite/AudioVisualizer';
import { formatDuration } from '@/utils/formatting';
import ProgressBar from '@/components/ui/composite/progress-bar';
import { Button, Card } from '@/components/ui';

/**
 * QuestionTips - Collapsible tips component - Tailwind styled
 */
const QuestionTips = ({ tips, primaryAccent }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!tips || tips.length === 0) return null;

  return (
    <div className="mt-4 rounded-xl border overflow-hidden bg-primary-light/50 border-primary/10">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3.5 bg-transparent border-none cursor-pointer flex items-center justify-between"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Lightbulb size={18} className="text-primary" />
          Tipps für diese Frage
        </span>
        <ChevronRight
          size={18}
          className={`text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              <ul className="m-0 pl-5 list-disc">
                {tips.map((tip, i) => (
                  <li key={i} className="text-sm text-slate-500 mb-2 leading-relaxed">
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
 * Question Badge - Tailwind styled
 */
const QuestionBadge = ({ number, size = 'md' }) => {
  const sizes = {
    sm: 'w-[26px] h-[26px] text-xs',
    md: 'w-7 h-7 text-[13px]',
  };

  return (
    <div className={`${sizes[size]} rounded-full bg-brand-gradient flex-center text-white font-semibold flex-shrink-0`}>
      {number}
    </div>
  );
};

/**
 * Question Card - Tailwind styled
 */
const VideoQuestionCard = ({ question, index, scenario, isMobile }) => (
  <Card className={isMobile ? 'p-4' : 'p-6'}>
    <div className="flex items-center gap-2 mb-3 md:mb-4">
      <QuestionBadge number={index + 1} size={isMobile ? 'sm' : 'md'} />
      <span className="text-[13px] md:text-sm text-slate-500">
        {question?.category || 'Frage'}
      </span>
    </div>

    <h2 className={`font-semibold text-slate-900 leading-relaxed ${isMobile ? 'text-[15px]' : 'text-lg'} mb-0`}>
      {question?.question || 'Frage wird geladen...'}
    </h2>

    {question?.estimated_time && (
      <div className="flex items-center gap-1.5 text-slate-500 text-[13px] md:text-sm mt-3 md:mt-4">
        <Clock size={isMobile ? 14 : 16} />
        Empfohlene Antwortzeit: ~{Math.round(question.estimated_time / 60)} Min.
      </div>
    )}

    {/* Tips */}
    {scenario?.enable_tips && question?.tips && (
      <QuestionTips tips={question.tips} />
    )}
  </Card>
);

/**
 * Recording Indicator Overlay - Tailwind styled
 */
const RecordingIndicator = ({ time, isRecording }) => (
  <div className="absolute top-3 md:top-4 left-3 md:left-4 flex items-center gap-1.5 md:gap-2 bg-black/60 px-3 py-1.5 rounded-lg">
    {isRecording ? (
      <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-red-500 animate-pulse" />
    ) : (
      <Clock size={14} className="text-white" />
    )}
    <span className="text-white text-[13px] md:text-sm font-medium">
      {formatDuration(time)}
    </span>
  </div>
);

/**
 * Camera Error State - Tailwind styled
 */
const CameraError = ({ error, onRetry }) => (
  <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4 md:p-5 text-center">
    <VideoOff size={40} className="mb-3 md:mb-4 opacity-60" />
    <p className="mb-3 md:mb-4 text-sm md:text-base">{error}</p>
    <Button onClick={onRetry} icon={<RefreshCw size={16} />}>
      Erneut versuchen
    </Button>
  </div>
);

/**
 * Loading Overlay - Tailwind styled
 */
const LoadingOverlay = ({ isUploading, isAnalyzing }) => (
  <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/30 flex items-center justify-center p-4">
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="bg-white rounded-2xl p-12 shadow-xl max-w-[500px] w-full text-center"
    >
      <div className="w-20 h-20 rounded-full bg-primary-light flex-center mx-auto mb-6">
        <Loader2 size={40} className="text-primary animate-spin" />
      </div>
      <h2 className="text-xl md:text-[22px] font-bold text-slate-900 mb-3">
        {isUploading ? 'Video wird hochgeladen...' : 'KI analysiert dein Video...'}
      </h2>
      <p className="text-slate-500 text-[15px] leading-relaxed">
        {isUploading
          ? 'Dein Video wird sicher übertragen. Dies kann je nach Dateigröße einen Moment dauern.'
          : 'Die KI analysiert dein Auftreten, deine Körpersprache und Kommunikation. Das dauert etwa 30-60 Sekunden.'}
      </p>
    </motion.div>
  </div>
);

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

  // Mobile detection
  const isMobile = useMobile();

  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const timerRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Partner theming
  const { branding } = usePartner();
  const primaryAccent = branding?.['--primary-accent'];

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
        setAudioLevel(average / 255);
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

  const handleMicrophoneChange = (deviceId) => {
    setSelectedMicrophoneId(deviceId);
    if (!isRecording) {
      initializeCamera(deviceId, selectedCameraId);
    }
  };

  const handleCameraChange = (deviceId) => {
    setSelectedCameraId(deviceId);
    if (!isRecording) {
      initializeCamera(selectedMicrophoneId, deviceId);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

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

      mediaRecorder.onstop = () => {};

      mediaRecorder.start(1000);
      setIsRecording(true);
      setIsPaused(false);

      startAudioAnalysis(stream);

      setTimeline((prev) => [
        ...prev,
        { question_index: currentQuestionIndex, start_time: recordingTime },
      ]);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('[VIDEO TRAINING] Recording error:', err);
      setError('Fehler beim Starten der Aufnahme');
    }
  };

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

  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      if (isRecording) {
        setTimeline((prev) => [
          ...prev,
          { question_index: currentQuestionIndex + 1, start_time: recordingTime },
        ]);
      }
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const goToPrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const finishRecording = async () => {
    stopRecording();
    stopCamera();
    setIsUploading(true);
    setError(null);

    try {
      const videoBlob = new Blob(recordedChunks, { type: 'video/webm' });
      const apiUrl = getWPApiUrl();

      const formData = new FormData();
      formData.append('video', videoBlob, `video_${session.id}.webm`);
      formData.append('video_duration', recordingTime.toString());
      formData.append('timeline', JSON.stringify(timeline));

      const uploadResponse = await fetch(`${apiUrl}/video-training/sessions/${session.id}/video`, {
        method: 'POST',
        headers: {
          'X-WP-Nonce': getWPNonce(),
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

  const handleExit = () => {
    stopRecording();
    stopCamera();
    onExit();
  };

  // Loading overlay
  if (isUploading || isAnalyzing) {
    return <LoadingOverlay isUploading={isUploading} isAnalyzing={isAnalyzing} />;
  }

  const hasRecordings = recordedChunks.length > 0;
  const canNavigatePrev = scenario?.enable_navigation && currentQuestionIndex > 0;
  const canNavigateNext = scenario?.enable_navigation && currentQuestionIndex < questions.length - 1;

  return (
    <div className={`${isMobile ? 'p-4' : 'p-6'} max-w-[1000px] mx-auto`}>
      {/* Header */}
      <div className={`flex ${isMobile ? 'flex-col gap-3' : 'flex-row justify-between items-center'} mb-6`}>
        <h1 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold text-slate-900`}>
          {scenario?.title}
        </h1>
        <div className={`flex gap-2 items-center ${isMobile ? 'justify-between' : 'justify-end'}`}>
          <button
            onClick={finishRecording}
            disabled={!hasRecordings}
            className={`${isMobile ? 'flex-1 py-2.5 px-3.5' : 'py-2.5 px-4'} rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-1.5 transition-all ${
              hasRecordings
                ? 'bg-green-500 shadow-md hover:bg-green-600 hover:shadow-lg'
                : 'bg-slate-300 cursor-not-allowed'
            }`}
          >
            <Check size={16} />
            {isMobile ? 'Abschließen' : 'Training abschließen'}
          </button>
          <button
            onClick={handleExit}
            className={`${isMobile ? 'flex-1 py-2.5 px-3.5' : 'py-2.5 px-4'} rounded-xl bg-slate-100 text-slate-600 text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-slate-200 transition-colors`}
          >
            <X size={16} />
            Abbrechen
          </button>
        </div>
      </div>

      {/* Progress */}
      <ProgressBar
        current={currentQuestionIndex}
        total={questions.length}
        primaryAccent={primaryAccent}
        showCompleted={false}
      />

      {/* Main Content */}
      {isMobile ? (
        /* Mobile Layout - Stacked */
        <div className="flex flex-col gap-4">
          {/* Question Card - Mobile */}
          <VideoQuestionCard
            question={currentQuestion}
            index={currentQuestionIndex}
            scenario={scenario}
            isMobile={true}
          />

          {/* Video Preview - Mobile */}
          <div>
            <div className="relative bg-black rounded-2xl overflow-hidden aspect-video">
              {cameraError ? (
                <CameraError error={cameraError} onRetry={initializeCamera} />
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              )}

              {/* Recording/Time indicator */}
              {(isRecording || recordingTime > 0) && (
                <RecordingIndicator time={recordingTime} isRecording={isRecording} />
              )}
            </div>

            {/* Audio Visualizer */}
            {isRecording && (
              <div className="mt-4">
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
            <div className="flex flex-col gap-3 mt-4">
              {/* Recording button with settings */}
              <div className="flex justify-center gap-2.5">
                <button
                  onClick={() => setShowDeviceSettings(true)}
                  className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 flex-center"
                >
                  <Settings size={20} className="text-slate-500" />
                </button>

                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    disabled={!stream}
                    className={`flex-1 py-3.5 px-6 rounded-xl text-white text-[15px] font-semibold flex items-center justify-center gap-2.5 ${
                      stream
                        ? 'bg-red-500 shadow-lg shadow-red-500/40'
                        : 'bg-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <Video size={20} />
                    Aufnahme starten
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="flex-1 py-3.5 px-6 rounded-xl bg-slate-100 text-slate-900 text-[15px] font-semibold flex items-center justify-center gap-2.5"
                  >
                    <StopCircle size={20} className="text-red-500" />
                    Aufnahme pausieren
                  </button>
                )}
              </div>

              {/* Navigation buttons */}
              {(canNavigatePrev || canNavigateNext) && (
                <div className="flex gap-2">
                  {canNavigatePrev && (
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<ChevronLeft size={16} />}
                      onClick={goToPrevQuestion}
                      className="flex-1"
                    >
                      Zurück
                    </Button>
                  )}

                  {canNavigateNext && (
                    <Button
                      size="sm"
                      iconPosition="right"
                      icon={<ChevronRight size={16} />}
                      onClick={goToNextQuestion}
                      className="flex-1"
                    >
                      Nächste
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Desktop Layout - Two columns */
        <div className="grid grid-cols-2 gap-6">
          {/* Video Preview - Desktop */}
          <div>
            <div className="relative bg-black rounded-2xl overflow-hidden aspect-video">
              {cameraError ? (
                <CameraError error={cameraError} onRetry={initializeCamera} />
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              )}

              {/* Recording/Time indicator */}
              {(isRecording || recordingTime > 0) && (
                <RecordingIndicator time={recordingTime} isRecording={isRecording} />
              )}
            </div>

            {/* Audio Visualizer */}
            {isRecording && (
              <div className="mt-5">
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
            <div className="flex flex-col gap-4 mt-5">
              {/* Recording button with settings */}
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setShowDeviceSettings(true)}
                  className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 flex-center"
                >
                  <Settings size={20} className="text-slate-500" />
                </button>

                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    disabled={!stream}
                    className={`py-3.5 px-7 rounded-xl text-white text-base font-semibold flex items-center gap-2.5 ${
                      stream
                        ? 'bg-red-500 shadow-lg shadow-red-500/40'
                        : 'bg-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <Video size={20} />
                    Aufnahme starten
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="py-3.5 px-7 rounded-xl bg-slate-100 text-slate-900 text-base font-semibold flex items-center gap-2.5"
                  >
                    <StopCircle size={20} className="text-red-500" />
                    Aufnahme pausieren
                  </button>
                )}
              </div>

              {/* Navigation buttons */}
              {(canNavigatePrev || canNavigateNext) && (
                <div className="flex justify-center gap-3 flex-wrap">
                  {canNavigatePrev && (
                    <Button
                      variant="secondary"
                      icon={<ChevronLeft size={18} />}
                      onClick={goToPrevQuestion}
                    >
                      Vorherige
                    </Button>
                  )}

                  {canNavigateNext && (
                    <Button
                      iconPosition="right"
                      icon={<ChevronRight size={18} />}
                      onClick={goToNextQuestion}
                    >
                      Nächste
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Question Card - Desktop */}
          <VideoQuestionCard
            question={currentQuestion}
            index={currentQuestionIndex}
            scenario={scenario}
            isMobile={false}
          />
        </div>
      )}

      {/* Error display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-red-50 rounded-xl border border-red-200 flex items-center gap-3"
        >
          <AlertCircle size={20} className="text-red-500" />
          <p className="text-red-600 text-sm flex-1">{error}</p>
          <button
            onClick={() => setError(null)}
            className="bg-transparent border-none cursor-pointer p-1"
          >
            <X size={16} className="text-red-500" />
          </button>
        </motion.div>
      )}

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
