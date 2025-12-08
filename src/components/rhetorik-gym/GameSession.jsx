/**
 * GameSession - Recording Interface with Visual Feedback
 *
 * Handles the actual game session with:
 * - Countdown timer
 * - Audio recording
 * - Real-time visual feedback
 * - Result display with score
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  Square,
  Play,
  RotateCcw,
  ArrowLeft,
  Trophy,
  AlertTriangle,
  Clock,
  Target,
  Zap,
  Volume2,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { analyzeRhetoricGame } from '@/services/gemini';
import { getScoreFeedback } from '@/config/prompts/gamePrompts';
import wordpressAPI from '@/services/wordpress-api';
import AudioVisualizer from '@/components/AudioVisualizer';

// Game states
const GAME_STATES = {
  READY: 'ready',
  COUNTDOWN: 'countdown',
  RECORDING: 'recording',
  PROCESSING: 'processing',
  RESULTS: 'results',
  ERROR: 'error',
};

/**
 * Countdown overlay component
 */
const CountdownOverlay = ({ count }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-slate-900/90 flex items-center justify-center z-50"
  >
    <motion.div
      key={count}
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 1.5, opacity: 0 }}
      className="text-white text-center"
    >
      <div className="text-9xl font-bold mb-4">{count}</div>
      <div className="text-2xl text-slate-300">
        {count === 3 ? 'Mach dich bereit...' : count === 2 ? 'Durchatmen...' : 'Los geht\'s!'}
      </div>
    </motion.div>
  </motion.div>
);

/**
 * Timer display component
 */
const TimerDisplay = ({ seconds, total, isWarning }) => {
  const progress = (seconds / total) * 100;
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <div className="relative">
      <div className="text-6xl md:text-8xl font-mono font-bold text-center">
        <span className={isWarning ? 'text-red-500' : 'text-slate-900'}>
          {minutes}:{secs.toString().padStart(2, '0')}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mt-4 h-2 bg-slate-200 rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${isWarning ? 'bg-red-500' : 'bg-blue-500'}`}
          initial={{ width: '100%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );
};

/**
 * Recording indicator component
 */
const RecordingIndicator = ({ isRecording }) => (
  <div className="flex items-center justify-center gap-3">
    <motion.div
      animate={{ scale: isRecording ? [1, 1.2, 1] : 1, opacity: isRecording ? 1 : 0.5 }}
      transition={{ repeat: Infinity, duration: 1 }}
      className={`w-4 h-4 rounded-full ${isRecording ? 'bg-red-500' : 'bg-slate-400'}`}
    />
    <span className={`font-medium ${isRecording ? 'text-red-600' : 'text-slate-500'}`}>
      {isRecording ? 'Aufnahme läuft...' : 'Warte auf Start'}
    </span>
  </div>
);

/**
 * Filler word badge component
 */
const FillerWordBadge = ({ word, count }) => (
  <motion.div
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    className="px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-sm font-medium flex items-center gap-1"
  >
    <span>"{word}"</span>
    <span className="bg-red-200 px-1.5 rounded-full text-xs">{count}x</span>
  </motion.div>
);

/**
 * Results display component
 */
const ResultsDisplay = ({ result, onPlayAgain, onBack }) => {
  const feedback = getScoreFeedback(result.score);
  const isGoodScore = result.score >= 70;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      {/* Score Card */}
      <div className={`rounded-3xl p-8 mb-6 ${isGoodScore ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-orange-500 to-red-500'} text-white text-center`}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="text-6xl mb-2"
        >
          {feedback.emoji}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="text-8xl font-bold mb-2">{result.score}</div>
          <div className="text-xl text-white/90 mb-4">Punkte</div>
          <p className="text-lg">{feedback.message}</p>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl border border-slate-200 p-4"
        >
          <div className="flex items-center gap-2 text-red-600 mb-2">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">Füllwörter</span>
          </div>
          <div className="text-3xl font-bold text-slate-900">{result.filler_count}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl border border-slate-200 p-4"
        >
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <Volume2 className="w-5 h-5" />
            <span className="font-medium">Tempo</span>
          </div>
          <div className="text-3xl font-bold text-slate-900">{result.words_per_minute}</div>
          <div className="text-sm text-slate-500">WPM</div>
        </motion.div>
      </div>

      {/* Filler Words Detail */}
      {result.filler_words && result.filler_words.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl border border-slate-200 p-4 mb-6"
        >
          <h4 className="font-semibold text-slate-900 mb-3">Erkannte Füllwörter</h4>
          <div className="flex flex-wrap gap-2">
            {result.filler_words.map((fw, index) => (
              <FillerWordBadge key={index} word={fw.word} count={fw.count} />
            ))}
          </div>
        </motion.div>
      )}

      {/* Pace Feedback */}
      {result.pace_feedback && result.pace_feedback !== 'optimal' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6"
        >
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-800">Tempo-Hinweis</h4>
              <p className="text-sm text-amber-700">
                {result.pace_feedback === 'zu_schnell'
                  ? 'Du sprichst etwas zu schnell. Versuche, bewusst langsamer und deutlicher zu sprechen.'
                  : 'Du sprichst etwas zu langsam. Versuche, etwas mehr Energie in deine Präsentation zu legen.'}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Transcript */}
      {result.transcript && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-slate-50 rounded-xl border border-slate-200 p-4 mb-8"
        >
          <h4 className="font-semibold text-slate-900 mb-3">Transkript</h4>
          <p className="text-slate-600 text-sm leading-relaxed">{result.transcript}</p>
        </motion.div>
      )}

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <button
          onClick={onPlayAgain}
          className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-shadow"
        >
          <RotateCcw className="w-5 h-5" />
          Nochmal spielen
        </button>
        <button
          onClick={onBack}
          className="flex-1 px-6 py-4 bg-slate-100 text-slate-700 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Zurück zur Auswahl
        </button>
      </motion.div>
    </motion.div>
  );
};

/**
 * Main GameSession Component
 */
const GameSession = ({ gameConfig, onBack, onComplete }) => {
  const [gameState, setGameState] = useState(GAME_STATES.READY);
  const [countdown, setCountdown] = useState(3);
  const [timeLeft, setTimeLeft] = useState(gameConfig.duration);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [audioLevel, setAudioLevel] = useState(0);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const analyserRef = useRef(null);
  const audioContextRef = useRef(null);
  const animationFrameRef = useRef(null);

  const apiKey = wordpressAPI.getGeminiApiKey();

  // Cleanup function
  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Start countdown
  const startCountdown = useCallback(async () => {
    setGameState(GAME_STATES.COUNTDOWN);
    setCountdown(3);

    // Request microphone access early
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Set up audio analysis
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      // Set up media recorder
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4',
      });

      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Countdown timer
      let count = 3;
      const countdownInterval = setInterval(() => {
        count--;
        setCountdown(count);

        if (count === 0) {
          clearInterval(countdownInterval);
          startRecording();
        }
      }, 1000);
    } catch (err) {
      console.error('Microphone access denied:', err);
      setError('Bitte erlaube den Zugriff auf das Mikrofon, um zu spielen.');
      setGameState(GAME_STATES.ERROR);
    }
  }, []);

  // Start recording
  const startRecording = useCallback(() => {
    setGameState(GAME_STATES.RECORDING);
    setTimeLeft(gameConfig.duration);

    // Start recording
    mediaRecorderRef.current.start();

    // Start audio level monitoring
    const updateAudioLevel = () => {
      if (analyserRef.current) {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(average / 255);
      }
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    };
    updateAudioLevel();

    // Timer
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          stopRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [gameConfig.duration]);

  // Stop recording
  const stopRecording = useCallback(() => {
    cleanup();
    setGameState(GAME_STATES.PROCESSING);

    // Get the recorded audio
    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, {
        type: mediaRecorderRef.current.mimeType,
      });

      // Stop all tracks
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());

      // Analyze the recording
      try {
        const analysisResult = await analyzeRhetoricGame(
          audioBlob,
          apiKey,
          gameConfig.topic,
          gameConfig.duration
        );

        setResult(analysisResult);
        setGameState(GAME_STATES.RESULTS);

        // Save to database (if API is available)
        try {
          // await wordpressAPI.saveGameSession({
          //   game_type: gameConfig.mode.id,
          //   topic: gameConfig.topic,
          //   duration_seconds: gameConfig.duration,
          //   score: analysisResult.score,
          //   filler_count: analysisResult.filler_count,
          //   analysis_json: JSON.stringify(analysisResult),
          // });
        } catch (saveError) {
          console.error('Failed to save game session:', saveError);
        }
      } catch (analysisError) {
        console.error('Analysis failed:', analysisError);
        setError(`Analyse fehlgeschlagen: ${analysisError.message}`);
        setGameState(GAME_STATES.ERROR);
      }
    };

    mediaRecorderRef.current.stop();
  }, [apiKey, gameConfig, cleanup]);

  // Handle early stop
  const handleEarlyStop = () => {
    stopRecording();
  };

  // Handle play again
  const handlePlayAgain = () => {
    setResult(null);
    setError(null);
    setTimeLeft(gameConfig.duration);
    setGameState(GAME_STATES.READY);
  };

  // Render based on game state
  const renderContent = () => {
    switch (gameState) {
      case GAME_STATES.READY:
        return (
          <div className="text-center py-12">
            <div className="max-w-xl mx-auto">
              <div className="mb-8">
                <div className="text-6xl mb-4">🎤</div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Bereit?</h2>
                <p className="text-slate-600 mb-6">{gameConfig.topic}</p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full text-slate-600">
                  <Clock className="w-4 h-4" />
                  <span>{gameConfig.duration} Sekunden</span>
                </div>
              </div>

              <button
                onClick={startCountdown}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-shadow flex items-center gap-3 mx-auto"
              >
                <Play className="w-6 h-6" />
                Aufnahme starten
              </button>

              <button
                onClick={onBack}
                className="mt-6 text-slate-500 hover:text-slate-700 flex items-center gap-2 mx-auto"
              >
                <ArrowLeft className="w-4 h-4" />
                Zurück zur Auswahl
              </button>
            </div>
          </div>
        );

      case GAME_STATES.RECORDING:
        return (
          <div className="text-center py-8">
            <div className="max-w-xl mx-auto">
              {/* Timer */}
              <TimerDisplay
                seconds={timeLeft}
                total={gameConfig.duration}
                isWarning={timeLeft <= 10}
              />

              {/* Topic reminder */}
              <div className="mt-8 mb-8 p-4 bg-slate-50 rounded-xl">
                <p className="text-slate-600 text-sm">Dein Thema:</p>
                <p className="font-medium text-slate-900">{gameConfig.topic}</p>
              </div>

              {/* Audio visualizer placeholder */}
              <div className="mb-8">
                <motion.div
                  className="h-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center"
                  animate={{ opacity: 0.5 + audioLevel * 0.5 }}
                >
                  <motion.div
                    className="w-16 h-16 rounded-full bg-white/30 flex items-center justify-center"
                    animate={{ scale: 1 + audioLevel * 0.3 }}
                  >
                    <Mic className="w-8 h-8 text-white" />
                  </motion.div>
                </motion.div>
              </div>

              {/* Recording indicator */}
              <RecordingIndicator isRecording={true} />

              {/* Stop button */}
              <button
                onClick={handleEarlyStop}
                className="mt-8 px-6 py-3 bg-red-500 text-white rounded-xl font-semibold flex items-center gap-2 mx-auto hover:bg-red-600 transition-colors"
              >
                <Square className="w-5 h-5" />
                Aufnahme beenden
              </button>
            </div>
          </div>
        );

      case GAME_STATES.PROCESSING:
        return (
          <div className="text-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-6"
            />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Analysiere deine Aufnahme...</h2>
            <p className="text-slate-500">Der Füllwort-Killer zählt nach</p>
          </div>
        );

      case GAME_STATES.RESULTS:
        return (
          <ResultsDisplay
            result={result}
            onPlayAgain={handlePlayAgain}
            onBack={onBack}
          />
        );

      case GAME_STATES.ERROR:
        return (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">Fehler</h2>
              <p className="text-slate-600 mb-6">{error}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={handlePlayAgain}
                  className="px-6 py-3 bg-blue-500 text-white rounded-xl font-semibold flex items-center gap-2 justify-center"
                >
                  <RotateCcw className="w-5 h-5" />
                  Erneut versuchen
                </button>
                <button
                  onClick={onBack}
                  className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold flex items-center gap-2 justify-center"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Zurück
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen pb-8">
      {/* Countdown overlay */}
      <AnimatePresence>
        {gameState === GAME_STATES.COUNTDOWN && (
          <CountdownOverlay count={countdown} />
        )}
      </AnimatePresence>

      {/* Header */}
      {gameState !== GAME_STATES.COUNTDOWN && gameState !== GAME_STATES.RECORDING && (
        <div className="px-6 py-4 border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Zurück</span>
            </button>
            <h1 className="font-semibold text-slate-900">{gameConfig.mode.title}</h1>
            <div className="w-20" /> {/* Spacer for centering */}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="px-6 py-8">
        <div className="max-w-3xl mx-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default GameSession;
