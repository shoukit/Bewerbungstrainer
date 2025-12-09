import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Play, Square, X, Volume2, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

/**
 * MicrophoneTestDialog Component
 *
 * A popup dialog for testing microphone recording quality.
 * Users can record a short audio clip and play it back to verify their microphone works.
 * No audio is sent to the backend - everything is local.
 */
const MicrophoneTestDialog = ({ isOpen, onClose, deviceId }) => {
  // States
  const [status, setStatus] = useState('idle'); // idle | recording | recorded | playing
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordedUrl, setRecordedUrl] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState(null);

  // Refs
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const timerRef = useRef(null);
  const audioElementRef = useRef(null);

  // Constants
  const MAX_RECORDING_TIME = 10; // seconds

  /**
   * Cleanup on unmount or close
   */
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  /**
   * Reset state when dialog opens
   */
  useEffect(() => {
    if (isOpen) {
      resetState();
    } else {
      cleanup();
    }
  }, [isOpen]);

  /**
   * Reset all state
   */
  const resetState = () => {
    setStatus('idle');
    setAudioLevel(0);
    setRecordedBlob(null);
    setRecordingTime(0);
    setError(null);
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
      setRecordedUrl(null);
    }
  };

  /**
   * Cleanup all resources
   */
  const cleanup = () => {
    // Stop recording timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Stop animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }
    mediaRecorderRef.current = null;

    // Stop audio context
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (e) {}
      audioContextRef.current = null;
    }

    // Stop stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Stop audio playback
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.src = '';
    }

    // Revoke object URL
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
    }
  };

  /**
   * Start recording
   */
  const startRecording = async () => {
    try {
      setError(null);
      audioChunksRef.current = [];
      setRecordingTime(0);

      // Get microphone access with specific device if provided
      const constraints = {
        audio: deviceId ? { deviceId: { exact: deviceId } } : true
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Setup audio analyzer for level visualization
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;

      // Start level monitoring
      const updateLevel = () => {
        if (analyserRef.current && status === 'recording') {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          setAudioLevel(average / 255);
        }
        if (status === 'recording') {
          animationFrameRef.current = requestAnimationFrame(updateLevel);
        }
      };

      // Setup MediaRecorder
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
        setRecordedBlob(audioBlob);

        // Create URL for playback
        const url = URL.createObjectURL(audioBlob);
        setRecordedUrl(url);

        setStatus('recorded');
        setAudioLevel(0);
      };

      mediaRecorderRef.current.start(100);
      setStatus('recording');

      // Start recording timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= MAX_RECORDING_TIME - 1) {
            stopRecording();
            return MAX_RECORDING_TIME;
          }
          return prev + 1;
        });
      }, 1000);

      // Start level monitoring after state is set
      requestAnimationFrame(updateLevel);

    } catch (err) {
      console.error('Error starting recording:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Mikrofonzugriff verweigert. Bitte erlaube den Zugriff in den Browser-Einstellungen.');
      } else if (err.name === 'NotFoundError') {
        setError('Kein Mikrofon gefunden. Bitte schließe ein Mikrofon an.');
      } else if (err.name === 'OverconstrainedError') {
        setError('Das ausgewählte Mikrofon ist nicht verfügbar.');
      } else {
        setError('Fehler beim Starten der Aufnahme: ' + err.message);
      }
    }
  };

  /**
   * Stop recording
   */
  const stopRecording = () => {
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

    // Stop audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Stop media recorder (triggers onstop callback)
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    // Stop stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  /**
   * Play recorded audio
   */
  const playRecording = () => {
    if (!recordedUrl) return;

    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }

    audioElementRef.current = new Audio(recordedUrl);
    audioElementRef.current.onended = () => {
      setStatus('recorded');
    };
    audioElementRef.current.play();
    setStatus('playing');
  };

  /**
   * Stop playback
   */
  const stopPlayback = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.currentTime = 0;
    }
    setStatus('recorded');
  };

  /**
   * Record again
   */
  const recordAgain = () => {
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
    }
    setRecordedBlob(null);
    setRecordedUrl(null);
    setRecordingTime(0);
    setStatus('idle');
  };

  /**
   * Format time as MM:SS
   */
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="w-5 h-5 text-blue-600" />
            Mikrofon testen
          </DialogTitle>
          <DialogDescription>
            Nimm eine kurze Testaufnahme auf und höre sie dir an, um sicherzustellen, dass dein Mikrofon gut funktioniert.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {/* Error message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Recording visualization */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              {/* Main circle */}
              <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300
                ${status === 'recording' ? 'bg-red-100' : status === 'playing' ? 'bg-green-100' : 'bg-slate-100'}`}>

                {/* Audio level rings when recording */}
                {status === 'recording' && (
                  <>
                    <motion.div
                      className="absolute inset-0 rounded-full bg-red-200"
                      animate={{ scale: [1, 1 + audioLevel * 0.3], opacity: [0.5, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    />
                    <motion.div
                      className="absolute inset-0 rounded-full bg-red-300"
                      animate={{ scale: [1, 1 + audioLevel * 0.2], opacity: [0.3, 0] }}
                      transition={{ duration: 0.3, repeat: Infinity, delay: 0.1 }}
                    />
                  </>
                )}

                {/* Playing animation */}
                {status === 'playing' && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-green-200"
                    animate={{ scale: [1, 1.1], opacity: [0.5, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                )}

                {/* Icon */}
                {status === 'idle' && <Mic className="w-12 h-12 text-slate-400" />}
                {status === 'recording' && <Mic className="w-12 h-12 text-red-500" />}
                {status === 'recorded' && <CheckCircle className="w-12 h-12 text-green-500" />}
                {status === 'playing' && <Volume2 className="w-12 h-12 text-green-600" />}
              </div>

              {/* Timer badge */}
              {status === 'recording' && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-red-500 text-white rounded-full text-sm font-mono">
                  {formatTime(recordingTime)} / {formatTime(MAX_RECORDING_TIME)}
                </div>
              )}
            </div>
          </div>

          {/* Audio level bars when recording */}
          {status === 'recording' && (
            <div className="flex justify-center items-center gap-1 h-12 mb-6">
              {[...Array(20)].map((_, i) => {
                const height = Math.max(8, Math.min(40, audioLevel * 100 * (0.5 + Math.random() * 0.5)));
                return (
                  <motion.div
                    key={i}
                    className="w-2 bg-gradient-to-t from-blue-500 to-teal-400 rounded-full"
                    animate={{ height }}
                    transition={{ duration: 0.1 }}
                  />
                );
              })}
            </div>
          )}

          {/* Status text */}
          <p className="text-center text-slate-600 mb-6">
            {status === 'idle' && 'Klicke auf "Aufnahme starten" um deinen Test zu beginnen.'}
            {status === 'recording' && 'Sprich jetzt in dein Mikrofon...'}
            {status === 'recorded' && 'Aufnahme fertig! Höre dir das Ergebnis an.'}
            {status === 'playing' && 'Wiedergabe läuft...'}
          </p>

          {/* Action buttons */}
          <div className="flex justify-center gap-3">
            {status === 'idle' && (
              <Button
                onClick={startRecording}
                className="bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white px-6"
              >
                <Mic className="w-4 h-4 mr-2" />
                Aufnahme starten
              </Button>
            )}

            {status === 'recording' && (
              <Button
                onClick={stopRecording}
                variant="destructive"
                className="px-6"
              >
                <Square className="w-4 h-4 mr-2" />
                Aufnahme stoppen
              </Button>
            )}

            {status === 'recorded' && (
              <>
                <Button
                  onClick={playRecording}
                  className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white px-6"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Anhören
                </Button>
                <Button
                  onClick={recordAgain}
                  variant="outline"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Nochmal
                </Button>
              </>
            )}

            {status === 'playing' && (
              <>
                <Button
                  onClick={stopPlayback}
                  variant="outline"
                >
                  <Square className="w-4 h-4 mr-2" />
                  Stoppen
                </Button>
                <Button
                  onClick={recordAgain}
                  variant="outline"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Nochmal
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t pt-4">
          <Button onClick={onClose} variant="outline">
            Schließen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MicrophoneTestDialog;
