import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Video, Circle, ChevronLeft, ChevronRight, Check, Loader2, Upload } from 'lucide-react';

/**
 * VideoRecorder Component
 *
 * Handles continuous video recording for interview training:
 * - Shows questions one by one
 * - Records continuously as user navigates
 * - Tracks timeline of question changes
 * - Uploads video when complete
 */
function VideoRecorder({ questions, cameraStream, trainingData, onComplete, onCancel }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [timeline, setTimeline] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const videoPreviewRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const questionStartTimeRef = useRef(0);

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;

  /**
   * Initialize video preview
   */
  useEffect(() => {
    if (videoPreviewRef.current && cameraStream) {
      videoPreviewRef.current.srcObject = cameraStream;
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [cameraStream]);

  /**
   * Start recording
   */
  const startRecording = () => {
    if (!cameraStream) {
      console.error('No camera stream available');
      return;
    }

    try {
      // Create MediaRecorder
      const options = {
        mimeType: 'video/webm;codecs=vp9',
      };

      // Fallback to vp8 if vp9 is not supported
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'video/webm;codecs=vp8';
      }

      const mediaRecorder = new MediaRecorder(cameraStream, options);
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = handleRecordingComplete;

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      questionStartTimeRef.current = 0;

      // Start timer
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Record first question start
      setTimeline([{
        question_index: 0,
        question_id: currentQuestion.id,
        start_time: 0
      }]);

    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Fehler beim Starten der Aufnahme: ' + error.message);
    }
  };

  /**
   * Stop recording
   */
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }

      // Update last question end time
      setTimeline(prev => {
        const updated = [...prev];
        if (updated.length > 0) {
          updated[updated.length - 1].end_time = recordingTime;
        }
        return updated;
      });
    }
  };

  /**
   * Handle recording complete
   */
  const handleRecordingComplete = async () => {
    const blob = new Blob(recordedChunksRef.current, {
      type: 'video/webm'
    });

    await uploadVideo(blob);
  };

  /**
   * Upload video to backend
   */
  const uploadVideo = async (videoBlob) => {
    setUploading(true);
    setUploadProgress(0);

    try {
      const file = new File([videoBlob], `interview-${Date.now()}.webm`, {
        type: 'video/webm'
      });

      // Create training session first (if not already created)
      const response = await fetch('/wp-json/bewerbungstrainer/v1/video-training', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: trainingData.name,
          position: trainingData.position,
          company: trainingData.company,
          experience_level: trainingData.experience_level,
          questions: questions
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create training session');
      }

      const sessionData = await response.json();
      const trainingId = sessionData.data.id;

      // Upload video with timeline
      const formData = new FormData();
      formData.append('video', file);
      formData.append('timeline', JSON.stringify(timeline));

      const uploadResponse = await fetch(
        `/wp-json/bewerbungstrainer/v1/video-training/${trainingId}/upload`,
        {
          method: 'POST',
          body: formData
        }
      );

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload video');
      }

      setUploadProgress(100);

      // Trigger analysis
      const analysisResponse = await fetch(
        `/wp-json/bewerbungstrainer/v1/video-training/${trainingId}/analyze`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (!analysisResponse.ok) {
        throw new Error('Failed to start analysis');
      }

      const analysisData = await analysisResponse.json();

      // Pass results to parent
      onComplete(analysisData.data);

    } catch (error) {
      console.error('Error uploading video:', error);
      alert('Fehler beim Hochladen des Videos: ' + error.message);
      setUploading(false);
    }
  };

  /**
   * Navigate to next question
   */
  const goToNextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      // Record end time for current question
      const currentTime = recordingTime;

      setTimeline(prev => {
        const updated = [...prev];
        if (updated.length > 0) {
          updated[updated.length - 1].end_time = currentTime;
        }
        return updated;
      });

      // Move to next question
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);

      // Record start time for next question
      setTimeline(prev => [...prev, {
        question_index: nextIndex,
        question_id: questions[nextIndex].id,
        start_time: currentTime
      }]);
    }
  };

  /**
   * Navigate to previous question
   */
  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      const currentTime = recordingTime;

      setTimeline(prev => {
        const updated = [...prev];
        if (updated.length > 0) {
          updated[updated.length - 1].end_time = currentTime;
        }
        return updated;
      });

      const prevIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prevIndex);

      setTimeline(prev => [...prev, {
        question_index: prevIndex,
        question_id: questions[prevIndex].id,
        start_time: currentTime
      }]);
    }
  };

  /**
   * Format time as MM:SS
   */
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Handle interview complete
   */
  const handleComplete = () => {
    if (window.confirm('Möchtest du das Interview beenden und die Aufnahme hochladen?')) {
      stopRecording();
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">KarriereHeld Coach</h2>
          <p className="text-gray-600">
            Video-Interview Training für {trainingData.position}
          </p>
        </div>

        {/* Recording indicator */}
        {isRecording && (
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Circle className="w-4 h-4 text-red-600 fill-current animate-pulse" />
              <span className="text-red-600 font-semibold">REC</span>
            </div>
            <span className="text-2xl font-mono font-bold text-gray-800">
              {formatTime(recordingTime)}
            </span>
          </div>
        )}
      </div>

      {/* Video and Question - Side by Side on larger screens */}
      <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Video preview */}
        <div className="bg-black rounded-lg overflow-hidden shadow-2xl">
          <video
            ref={videoPreviewRef}
            autoPlay
            playsInline
            muted
            className="w-full aspect-video"
          />
        </div>

        {/* Question display */}
        <div className="p-6 bg-ocean-50 border-2 border-ocean-200 rounded-lg flex flex-col justify-center">
          <div className="flex items-start justify-between mb-4">
            <div className="text-sm font-semibold text-ocean-600">
              Frage {currentQuestionIndex + 1} von {totalQuestions}
            </div>
            {currentQuestion.category && (
              <span className="px-3 py-1 text-xs rounded-full bg-ocean-100 text-ocean-700">
                {currentQuestion.category}
              </span>
            )}
          </div>
          <p className="text-xl font-medium text-gray-800 leading-relaxed">
            {currentQuestion.question}
          </p>
        </div>
      </div>

      {/* Controls */}
      {!isRecording && !uploading && (
        <div className="flex justify-center">
          <Button
            onClick={startRecording}
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 text-lg font-semibold"
            size="lg"
          >
            <Circle className="w-6 h-6 mr-2 fill-current" />
            Aufnahme starten
          </Button>
        </div>
      )}

      {isRecording && (
        <div className="space-y-4">
          {/* Question navigation */}
          <div className="flex items-center justify-between">
            <Button
              onClick={goToPreviousQuestion}
              disabled={currentQuestionIndex === 0}
              variant="outline"
              className="px-6 py-3"
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
              Vorherige Frage
            </Button>

            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">
                Frage {currentQuestionIndex + 1} / {totalQuestions}
              </div>
              <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-ocean-600 transition-all duration-300"
                  style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
                />
              </div>
            </div>

            <Button
              onClick={goToNextQuestion}
              disabled={currentQuestionIndex === totalQuestions - 1}
              variant="outline"
              className="px-6 py-3"
            >
              Nächste Frage
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>

          {/* Complete button */}
          <div className="flex justify-center">
            <Button
              onClick={handleComplete}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg font-semibold"
            >
              <Check className="w-5 h-5 mr-2" />
              Interview beenden
            </Button>
          </div>
        </div>
      )}

      {/* Upload progress */}
      {uploading && (
        <div className="space-y-4">
          <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-center mb-4">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mr-3" />
              <p className="text-lg font-semibold text-blue-800">
                Video wird hochgeladen und analysiert...
              </p>
            </div>

            {uploadProgress > 0 && (
              <div className="w-full bg-blue-100 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}

            <p className="text-sm text-blue-700 text-center mt-4">
              Die KI analysiert jetzt dein Video. Das kann einen Moment dauern...
            </p>
          </div>
        </div>
      )}

      {/* Help text */}
      {!isRecording && !uploading && (
        <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-2">Tipps für dein Video-Interview:</h3>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
            <li>Achte auf gute Beleuchtung und einen ruhigen Hintergrund</li>
            <li>Sprich klar und deutlich, halte Blickkontakt zur Kamera</li>
            <li>Nimm dir Zeit für deine Antworten, aber bleibe fokussiert</li>
            <li>Du kannst jederzeit zwischen den Fragen navigieren</li>
            <li>Die Aufnahme läuft durchgehend, aber du bestimmst das Tempo</li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default VideoRecorder;
