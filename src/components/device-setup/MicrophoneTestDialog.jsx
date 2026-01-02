import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Play, Square, Volume2, CheckCircle, AlertCircle, RefreshCw, X } from 'lucide-react';
import AudioVisualizer from '@/components/ui/composite/AudioVisualizer';

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
        className="fixed inset-0 bg-slate-900/60 z-[1000] flex items-center justify-center p-5"
      >
        {/* Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-brand-gradient flex items-center justify-center">
                <Mic className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900 m-0">
                  Mikrofon testen
                </h2>
                <p className="text-sm text-slate-500 m-0">
                  Prüfe deine Audioqualität
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-11 h-11 rounded-lg border-0 bg-slate-100 hover:bg-slate-200 cursor-pointer flex items-center justify-center transition-colors duration-300"
            >
              <X className="w-6 h-6 text-slate-600" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-8">
            {/* Error */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <p className="text-base text-red-600 m-0">{error}</p>
              </div>
            )}

            {/* Visual indicator */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <motion.div
                  className={`w-[120px] h-[120px] rounded-full flex items-center justify-center ${
                    status === 'recording' ? 'bg-red-50' :
                    status === 'playing' || status === 'recorded' ? 'bg-green-50' : 'bg-slate-100'
                  }`}
                >
                  {status === 'recording' && (
                    <motion.div
                      className="absolute inset-0 rounded-full border-[3px] border-red-500"
                      animate={{ scale: [1, 1 + audioLevel * 0.3], opacity: [1, 0.3] }}
                      transition={{ duration: 0.3, repeat: Infinity }}
                    />
                  )}
                  {status === 'idle' && <Mic className="w-12 h-12 text-slate-400" />}
                  {status === 'recording' && <Mic className="w-12 h-12 text-red-500" />}
                  {status === 'recorded' && <CheckCircle className="w-12 h-12 text-green-500" />}
                  {status === 'playing' && <Volume2 className="w-12 h-12 text-green-600" />}
                </motion.div>

                {status === 'recording' && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-red-500 text-white rounded-2xl text-sm font-semibold font-mono">
                    {recordingTime}s / {MAX_RECORDING_TIME}s
                  </div>
                )}
              </div>
            </div>

            {/* Audio level bars during recording */}
            {status === 'recording' && (
              <div className="mb-6">
                <AudioVisualizer
                  audioLevel={audioLevel}
                  isActive={true}
                  variant="bars"
                  size="sm"
                />
              </div>
            )}

            {/* Status text */}
            <p className="text-center text-base text-slate-600 mb-6">
              {status === 'idle' && 'Klicke auf "Aufnahme starten" um dein Mikrofon zu testen.'}
              {status === 'recording' && 'Sprich jetzt in dein Mikrofon...'}
              {status === 'recorded' && 'Aufnahme fertig! Höre dir das Ergebnis an.'}
              {status === 'playing' && 'Wiedergabe läuft...'}
            </p>

            {/* Action buttons */}
            <div className="flex justify-center gap-3">
              {status === 'idle' && (
                <button
                  onClick={startRecording}
                  className="flex items-center gap-2 px-7 py-3.5 rounded-lg border-0 bg-brand-gradient text-white text-base font-semibold cursor-pointer"
                >
                  <Mic className="w-[18px] h-[18px]" />
                  Aufnahme starten
                </button>
              )}

              {status === 'recording' && (
                <button
                  onClick={stopRecording}
                  className="flex items-center gap-2 px-7 py-3.5 rounded-lg border-0 bg-red-500 text-white text-base font-semibold cursor-pointer"
                >
                  <Square className="w-[18px] h-[18px]" />
                  Stoppen
                </button>
              )}

              {status === 'recorded' && (
                <>
                  <button
                    onClick={playRecording}
                    className="flex items-center gap-2 px-7 py-3.5 rounded-lg border-0 bg-brand-gradient text-white text-base font-semibold cursor-pointer"
                  >
                    <Play className="w-[18px] h-[18px]" />
                    Anhören
                  </button>
                  <button
                    onClick={recordAgain}
                    className="flex items-center gap-2 px-5 py-3.5 rounded-lg border-2 border-slate-200 bg-white text-slate-700 text-base font-semibold cursor-pointer"
                  >
                    <RefreshCw className="w-[18px] h-[18px]" />
                    Nochmal
                  </button>
                </>
              )}

              {status === 'playing' && (
                <>
                  <button
                    onClick={stopPlayback}
                    className="flex items-center gap-2 px-5 py-3.5 rounded-lg border-2 border-slate-200 bg-white text-slate-700 text-base font-semibold cursor-pointer"
                  >
                    <Square className="w-[18px] h-[18px]" />
                    Stoppen
                  </button>
                  <button
                    onClick={recordAgain}
                    className="flex items-center gap-2 px-5 py-3.5 rounded-lg border-2 border-slate-200 bg-white text-slate-700 text-base font-semibold cursor-pointer"
                  >
                    <RefreshCw className="w-[18px] h-[18px]" />
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
