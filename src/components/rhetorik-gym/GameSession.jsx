/**
 * GameSession - Recording Interface with Visual Feedback
 *
 * Handles the actual game session with:
 * - Countdown timer
 * - Audio recording
 * - Real-time visual feedback
 * - Result display with score
 *
 * Migrated to Tailwind CSS + themed components.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  Square,
  Play,
  RotateCcw,
  ArrowLeft,
  AlertTriangle,
  Clock,
  Volume2,
  XCircle,
  MessageCircle,
} from 'lucide-react';
import { analyzeRhetoricGame } from '@/services/gemini';
import { getScoreFeedback } from '@/config/prompts/gamePrompts';
import wordpressAPI from '@/services/wordpress-api';
import { validateAudioBlob } from '@/utils/audio';
import {
  MIN_AUDIO_SIZE_BYTES,
  getEmptyTranscriptResult,
} from '@/config/prompts/transcriptionCore';
import { Button, Card, Badge } from '@/components/ui';

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
 * Countdown overlay component - Tailwind styled
 */
const CountdownOverlay = ({ count }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-slate-900/90 flex-center z-50"
  >
    <motion.div
      key={count}
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 1.5, opacity: 0 }}
      className="text-white text-center"
    >
      <div className="text-[120px] font-bold mb-4">{count}</div>
      <div className="text-2xl text-slate-400">
        {count === 3 ? 'Mach dich bereit...' : count === 2 ? 'Durchatmen...' : "Los geht's!"}
      </div>
    </motion.div>
  </motion.div>
);

/**
 * Timer display component - Clean Professional Design
 */
const TimerDisplay = ({ seconds, total, isWarning }) => {
  const progress = (seconds / total) * 100;
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <div className="bg-white rounded-2xl shadow-card p-8 mb-6">
      <div className={`text-7xl md:text-8xl font-bold font-mono text-center mb-4 ${isWarning ? 'text-red-500' : 'bg-gradient-to-br from-violet-600 to-purple-600 bg-clip-text text-transparent'}`}>
        {minutes}:{secs.toString().padStart(2, '0')}
      </div>

      {/* Progress bar */}
      <div className="h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
        <motion.div
          className={`h-full rounded-full ${isWarning ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-violet-500 to-purple-600'}`}
          initial={{ width: '100%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );
};

/**
 * Filler word badge component - Uses themed Badge
 */
const FillerWordBadge = ({ word, count }) => (
  <Badge variant="error" className="gap-1">
    "{word}"
    <span className="bg-red-500/20 px-1.5 py-0.5 rounded text-xs">{count}x</span>
  </Badge>
);

/**
 * Count words in a string
 */
const countWords = (text) => {
  if (!text || text === '[Keine Sprache erkannt]') return 0;
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
};

/**
 * Calculate filler count from filler_words array
 */
const calculateFillerCount = (fillerWords) => {
  if (!fillerWords || !Array.isArray(fillerWords)) return 0;
  return fillerWords.reduce((sum, fw) => sum + (fw.count || 0), 0);
};

/**
 * Calculate all scores from raw data
 */
const calculateScores = (transcript, fillerWords, contentScore, actualDurationSeconds) => {
  const totalWords = countWords(transcript);
  const fillerCount = calculateFillerCount(fillerWords);
  const fillerPercentage = totalWords > 0 ? (fillerCount / totalWords) * 100 : 0;
  const wpm = actualDurationSeconds > 0 ? Math.round((totalWords / actualDurationSeconds) * 60) : 0;

  // Word score (0-25)
  let wordsScore = 0;
  if (totalWords >= 60) wordsScore = 25;
  else if (totalWords >= 40) wordsScore = 15;
  else if (totalWords >= 20) wordsScore = 10;
  else if (totalWords >= 10) wordsScore = 5;

  // Filler score (0-25)
  let fillerScore = 25;
  if (fillerPercentage > 25) fillerScore = 0;
  else if (fillerPercentage > 15) fillerScore = 10;
  else if (fillerPercentage > 10) fillerScore = 15;
  else if (fillerPercentage > 5) fillerScore = 20;

  // Tempo score (0-10)
  let tempoScore = 0;
  let paceFeedback = 'keine_sprache';
  if (totalWords > 0) {
    if (wpm >= 100 && wpm <= 140) {
      tempoScore = 10;
      paceFeedback = 'optimal';
    } else if ((wpm >= 80 && wpm < 100) || (wpm > 140 && wpm <= 160)) {
      tempoScore = 5;
      paceFeedback = wpm < 100 ? 'zu_langsam' : 'zu_schnell';
    } else {
      tempoScore = 0;
      paceFeedback = wpm < 80 ? 'zu_langsam' : 'zu_schnell';
    }
  }

  // Content score comes from AI (0-40), default to 0
  const validContentScore = Math.min(40, Math.max(0, contentScore || 0));

  const totalScore = wordsScore + fillerScore + tempoScore + validContentScore;

  return {
    total_words: totalWords,
    filler_count: fillerCount,
    filler_percentage: fillerPercentage,
    words_per_minute: wpm,
    pace_feedback: paceFeedback,
    score: totalScore,
    score_breakdown: {
      words_score: wordsScore,
      filler_score: fillerScore,
      tempo_score: tempoScore,
      content_score: validContentScore,
    },
  };
};

/**
 * Results display component - Tailwind + themed components
 */
const ResultsDisplay = ({ result, onPlayAgain, onBack }) => {
  const feedback = getScoreFeedback(result.score);
  const isGoodScore = result.score >= 70;
  const isNoSpeech = result.pace_feedback === 'keine_sprache' || result.transcript === '[Keine Sprache erkannt]';

  // Score card gradient based on result
  const scoreGradient = isNoSpeech
    ? 'bg-gradient-to-br from-slate-500 to-slate-600'
    : isGoodScore
      ? 'bg-gradient-to-br from-green-500 to-primary'
      : 'bg-gradient-to-br from-amber-500 to-orange-500';

  return (
    <div className="max-w-[600px] mx-auto">
      {/* Score Card */}
      <div className={`${scoreGradient} rounded-2xl p-10 mb-8 text-white text-center shadow-card`}>
        <div className="text-6xl mb-4">{isNoSpeech ? '🎤' : feedback.emoji}</div>
        <div className="text-8xl font-bold mb-3">{result.score}</div>
        <div className="text-2xl opacity-90 mb-5 font-semibold">Punkte</div>
        <p className="text-lg leading-relaxed">
          {isNoSpeech ? 'Keine Sprache erkannt. Bitte sprich lauter ins Mikrofon.' : feedback.message}
        </p>
      </div>

      {/* Stats Grid - 2x2 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Total Words */}
        <Card className="p-5 shadow-card">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-3">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">{result.total_words}</div>
          <div className="text-sm text-slate-600 font-medium">Wörter gesprochen</div>
        </Card>

        {/* Filler Count */}
        <Card className="p-5 shadow-card">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mb-3">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">{result.filler_count}</div>
          <div className="text-sm text-slate-600 font-medium">Füllwörter ({result.filler_percentage?.toFixed(1) || '0'}%)</div>
        </Card>

        {/* Words Per Minute */}
        <Card className="p-5 shadow-card">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-3">
            <Volume2 className="w-5 h-5 text-white" />
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">{result.words_per_minute}</div>
          <div className="text-sm text-slate-600 font-medium">WPM Tempo</div>
        </Card>

        {/* Speaking Time */}
        <Card className="p-5 shadow-card">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center mb-3">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">{result.duration_seconds || 0}</div>
          <div className="text-sm text-slate-600 font-medium">Sekunden Sprechzeit</div>
        </Card>
      </div>

      {/* Filler Words Detail */}
      {result.filler_words && result.filler_words.length > 0 && (
        <Card className="mb-6 shadow-card">
          <h4 className="font-semibold text-slate-900 mb-4 text-base">Erkannte Füllwörter</h4>
          <div className="flex flex-wrap gap-2">
            {result.filler_words.map((fw, index) => (
              <FillerWordBadge key={index} word={fw.word} count={fw.count} />
            ))}
          </div>
        </Card>
      )}

      {/* Score Breakdown */}
      {!isNoSpeech && (
        <div className="bg-violet-50 border border-violet-200 rounded-2xl p-5 mb-6 shadow-sm">
          <h4 className="font-semibold text-violet-900 mb-4 text-base">Bewertung im Detail</h4>

          {result.score_breakdown && (
            <div className={`grid grid-cols-2 gap-2 ${result.content_feedback ? 'mb-3' : ''}`}>
              <div className="text-[13px] text-slate-600">📝 Wortanzahl: <strong>{result.score_breakdown.words_score || 0}/25</strong></div>
              <div className="text-[13px] text-slate-600">🚫 Füllwörter: <strong>{result.score_breakdown.filler_score || 0}/25</strong></div>
              <div className="text-[13px] text-slate-600">⏱️ Tempo: <strong>{result.score_breakdown.tempo_score || 0}/10</strong></div>
              <div className="text-[13px] text-slate-600">💡 Inhalt: <strong>{result.score_breakdown.content_score || 0}/40</strong></div>
            </div>
          )}

          {result.content_feedback && (
            <div className="pt-4 border-t border-violet-200">
              <p className="text-sm text-slate-700 leading-relaxed">
                <strong className="text-violet-900">Inhaltliches Feedback:</strong> {result.content_feedback}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Pace Feedback */}
      {result.pace_feedback && result.pace_feedback !== 'optimal' && result.pace_feedback !== 'keine_sprache' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6 shadow-sm">
          <h4 className="font-semibold text-amber-700 mb-3 text-base">Tempo-Hinweis</h4>
          <p className="text-sm text-slate-700 leading-relaxed">
            {result.pace_feedback === 'zu_schnell'
              ? 'Du sprichst etwas zu schnell. Versuche, bewusst langsamer und deutlicher zu sprechen.'
              : 'Du sprichst etwas zu langsam. Versuche, etwas mehr Energie in deine Präsentation zu legen.'}
          </p>
        </div>
      )}

      {/* Transcript */}
      {result.transcript && result.transcript !== '[Keine Sprache erkannt]' && (
        <Card className="mb-8 bg-slate-50 shadow-card">
          <h4 className="font-semibold text-slate-900 mb-4 text-base">Transkript</h4>
          <p className="text-sm text-slate-700 leading-relaxed">{result.transcript}</p>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button icon={<RotateCcw />} onClick={onPlayAgain} fullWidth>
          Nochmal spielen
        </Button>
        <Button variant="secondary" icon={<ArrowLeft />} onClick={onBack} fullWidth>
          Zurück
        </Button>
      </div>
    </div>
  );
};

/**
 * Main GameSession Component - Tailwind + themed components
 */
const GameSession = ({ gameConfig, onBack, onComplete }) => {
  // Start directly with COUNTDOWN state - no intermediate "Ready?" screen
  const [gameState, setGameState] = useState(GAME_STATES.COUNTDOWN);
  const [countdown, setCountdown] = useState(3);
  const [timeLeft, setTimeLeft] = useState(gameConfig.duration);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const analyserRef = useRef(null);
  const audioContextRef = useRef(null);
  const animationFrameRef = useRef(null);
  const recordingStartTimeRef = useRef(null);

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

  // Auto-start countdown when component mounts
  useEffect(() => {
    if (!hasStarted) {
      setHasStarted(true);
      startCountdownOnMount();
    }
  }, [hasStarted]);

  // Start countdown on mount - requests mic access and starts countdown
  const startCountdownOnMount = async () => {
    setGameState(GAME_STATES.COUNTDOWN);
    setCountdown(3);

    try {
      // Use selected microphone if provided
      const audioConstraints = gameConfig.selectedMicrophoneId
        ? { deviceId: { exact: gameConfig.selectedMicrophoneId } }
        : true;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });

      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4',
      });

      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

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
  };

  // Start countdown (for replay/retry)
  const startCountdown = useCallback(async () => {
    setGameState(GAME_STATES.COUNTDOWN);
    setCountdown(3);

    try {
      // Use selected microphone if provided
      const audioConstraints = gameConfig.selectedMicrophoneId
        ? { deviceId: { exact: gameConfig.selectedMicrophoneId } }
        : true;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });

      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4',
      });

      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

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
  }, [gameConfig.selectedMicrophoneId]);

  // Start recording
  const startRecording = useCallback(() => {
    setGameState(GAME_STATES.RECORDING);
    setTimeLeft(gameConfig.duration);

    recordingStartTimeRef.current = Date.now();
    mediaRecorderRef.current.start();

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
    // Calculate actual recording duration
    const actualDurationSeconds = recordingStartTimeRef.current
      ? Math.round((Date.now() - recordingStartTimeRef.current) / 1000)
      : gameConfig.duration;

    cleanup();
    setGameState(GAME_STATES.PROCESSING);

    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, {
        type: mediaRecorderRef.current.mimeType,
      });

      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());

      // Validate audio blob before sending for analysis
      const validation = validateAudioBlob(audioBlob, { minSize: MIN_AUDIO_SIZE_BYTES });
      if (!validation.valid) {
        console.warn('[GameSession] Audio validation failed:', validation.error, 'Size:', audioBlob.size);
        // Return centralized empty result instead of sending to AI (prevents hallucination)
        const emptyResult = {
          ...getEmptyTranscriptResult('game'),
          score: 0,
          word_count: 0,
          filler_count: 0,
          words_per_minute: 0,
          duration_seconds: actualDurationSeconds,
        };
        setResult(emptyResult);
        setGameState(GAME_STATES.RESULTS);
        return;
      }

      try {
        // AI only returns: transcript, filler_words, content_score, content_feedback
        const aiResult = await analyzeRhetoricGame(
          audioBlob,
          apiKey,
          gameConfig.topic,
          gameConfig.duration
        );

        // Calculate all metrics ourselves
        const calculatedScores = calculateScores(
          aiResult.transcript,
          aiResult.filler_words,
          aiResult.content_score,
          actualDurationSeconds
        );

        // Combine AI result with calculated scores
        const fullResult = {
          ...calculatedScores,
          transcript: aiResult.transcript || '[Keine Sprache erkannt]',
          filler_words: aiResult.filler_words || [],
          content_feedback: aiResult.content_feedback || '',
          duration_seconds: actualDurationSeconds,
        };

        setResult(fullResult);
        setGameState(GAME_STATES.RESULTS);

        // Save to database
        try {
          const sessionData = {
            game_type: gameConfig.mode.id,
            topic: gameConfig.topic,
            duration_seconds: actualDurationSeconds,
            score: fullResult.score,
            filler_count: fullResult.filler_count,
            words_per_minute: fullResult.words_per_minute,
            transcript: fullResult.transcript,
            analysis_json: JSON.stringify(fullResult),
          };
          await wordpressAPI.createGameSession(sessionData);
        } catch (saveError) {
          console.error('[GameSession] Failed to save game session:', saveError);
        }
      } catch (analysisError) {
        console.error('Analysis failed:', analysisError);
        setError(`Analyse fehlgeschlagen: ${analysisError.message}`);
        setGameState(GAME_STATES.ERROR);
      }
    };

    mediaRecorderRef.current.stop();
  }, [apiKey, gameConfig, cleanup]);

  const handleEarlyStop = () => {
    stopRecording();
  };

  const handlePlayAgain = () => {
    setResult(null);
    setError(null);
    setTimeLeft(gameConfig.duration);
    // Start countdown directly for replay
    startCountdown();
  };

  const renderContent = () => {
    switch (gameState) {
      case GAME_STATES.READY:
        return (
          <div className="text-center py-10 px-5">
            <div className="max-w-[500px] mx-auto">
              <div className="text-6xl mb-6">🎤</div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">Bereit?</h2>
              <p className="text-base text-slate-600 mb-6 leading-relaxed">{gameConfig.topic}</p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full text-slate-600 text-sm mb-8">
                <Clock className="w-4 h-4" />
                {gameConfig.duration} Sekunden
              </div>

              <div>
                <Button size="lg" icon={<Play />} onClick={startCountdown}>
                  Aufnahme starten
                </Button>
              </div>

              <button
                onClick={onBack}
                className="mt-6 px-5 py-2.5 border-none bg-transparent text-slate-400 text-sm cursor-pointer inline-flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                Zurück zur Auswahl
              </button>
            </div>
          </div>
        );

      case GAME_STATES.RECORDING:
        return (
          <div className="text-center py-10 px-5">
            <div className="max-w-[500px] mx-auto">
              <TimerDisplay seconds={timeLeft} total={gameConfig.duration} isWarning={timeLeft <= 10} />

              {/* Topic reminder */}
              <div className="mb-8 p-5 bg-violet-50 border border-violet-100 rounded-2xl shadow-sm">
                <p className="text-sm text-violet-600 mb-2 font-medium">Dein Thema:</p>
                <p className="text-base font-semibold text-slate-900">{gameConfig.topic}</p>
              </div>

              {/* Audio visualizer */}
              <div className="mb-8">
                <motion.div
                  className="h-24 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex-center shadow-card"
                  animate={{ opacity: 0.7 + audioLevel * 0.3 }}
                >
                  <motion.div
                    className="w-16 h-16 rounded-full bg-white/30 flex-center backdrop-blur-sm"
                    animate={{ scale: 1 + audioLevel * 0.4 }}
                  >
                    <Mic className="w-8 h-8 text-white" />
                  </motion.div>
                </motion.div>
              </div>

              {/* Recording indicator */}
              <div className="flex-center gap-2 mb-8">
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: 1 }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="w-3 h-3 rounded-full bg-red-500"
                />
                <span className="font-medium text-red-500 text-sm">Aufnahme läuft...</span>
              </div>

              <Button variant="danger" icon={<Square />} onClick={handleEarlyStop}>
                Aufnahme beenden
              </Button>
            </div>
          </div>
        );

      case GAME_STATES.PROCESSING:
        return (
          <div className="text-center py-20 px-5">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="w-16 h-16 border-4 border-violet-600 border-t-transparent rounded-full mx-auto mb-6"
            />
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Analysiere deine Aufnahme...</h2>
            <p className="text-base text-slate-600">Der Füllwort-Killer zählt nach</p>
          </div>
        );

      case GAME_STATES.RESULTS:
        return <ResultsDisplay result={result} onPlayAgain={handlePlayAgain} onBack={onBack} />;

      case GAME_STATES.ERROR:
        return (
          <div className="text-center py-16 px-5">
            <div className="max-w-[400px] mx-auto">
              <div className="w-20 h-20 rounded-2xl bg-red-100 flex-center mx-auto mb-6 shadow-sm">
                <XCircle className="w-10 h-10 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Fehler</h2>
              <p className="text-base text-slate-600 mb-8 leading-relaxed">{error}</p>
              <div className="flex gap-3 justify-center">
                <Button icon={<RotateCcw />} onClick={handlePlayAgain}>
                  Erneut versuchen
                </Button>
                <Button variant="secondary" icon={<ArrowLeft />} onClick={onBack}>
                  Zurück
                </Button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-full pb-8">
      {/* Countdown overlay */}
      <AnimatePresence>
        {gameState === GAME_STATES.COUNTDOWN && <CountdownOverlay count={countdown} />}
      </AnimatePresence>

      {/* Header - only show when not recording */}
      {gameState !== GAME_STATES.COUNTDOWN && gameState !== GAME_STATES.RECORDING && (
        <div className="px-6 py-4 border-b border-slate-200 bg-white sticky top-0 z-10">
          <div className="max-w-[600px] mx-auto flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 border-none bg-transparent text-slate-600 text-sm cursor-pointer"
            >
              <ArrowLeft className="w-4.5 h-4.5" />
              Zurück
            </button>
            <h1 className="font-semibold text-slate-900 text-base">
              {gameConfig.mode.title}
            </h1>
            <div className="w-[60px]" />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="p-6">
        <div className="max-w-[600px] mx-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default GameSession;
