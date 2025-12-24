/**
 * GameSession - Recording Interface with Visual Feedback
 *
 * Handles the actual game session with:
 * - Countdown timer
 * - Audio recording
 * - Real-time visual feedback
 * - Result display with score
 *
 * Uses Ocean theme design consistent with other features.
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
  CheckCircle,
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
import { usePartner } from '@/context/PartnerContext';
import { DEFAULT_BRANDING } from '@/config/partners';
import { useBranding } from '@/hooks/useBranding';

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
const CountdownOverlay = ({ count, branding }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
    }}
  >
    <motion.div
      key={count}
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 1.5, opacity: 0 }}
      style={{ color: 'white', textAlign: 'center' }}
    >
      <div style={{ fontSize: '120px', fontWeight: 700, marginBottom: '16px' }}>{count}</div>
      <div style={{ fontSize: '24px', color: branding.textMuted }}>
        {count === 3 ? 'Mach dich bereit...' : count === 2 ? 'Durchatmen...' : "Los geht's!"}
      </div>
    </motion.div>
  </motion.div>
);

/**
 * Timer display component
 */
const TimerDisplay = ({ seconds, total, isWarning, primaryAccent, branding }) => {
  const progress = (seconds / total) * 100;
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <div>
      <div style={{
        fontSize: '64px',
        fontWeight: 700,
        fontFamily: 'monospace',
        textAlign: 'center',
        color: isWarning ? branding.error : branding.textMain,
      }}>
        {minutes}:{secs.toString().padStart(2, '0')}
      </div>

      {/* Progress bar */}
      <div style={{
        marginTop: '16px',
        height: '8px',
        backgroundColor: branding.borderColor,
        borderRadius: '4px',
        overflow: 'hidden',
      }}>
        <motion.div
          style={{
            height: '100%',
            backgroundColor: isWarning ? branding.error : primaryAccent,
            borderRadius: '4px',
          }}
          initial={{ width: '100%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );
};

/**
 * Filler word badge component
 */
const FillerWordBadge = ({ word, count, branding }) => (
  <span style={{
    display: 'inline-flex',
    alignItems: 'center',
    gap: branding.space[1],
    padding: `${branding.space[1.5]} ${branding.space[3]}`,
    backgroundColor: branding.errorLight,
    color: branding.error,
    borderRadius: branding.radius['2xl'],
    fontSize: branding.fontSize.base,
    fontWeight: branding.fontWeight.medium,
  }}>
    "{word}"
    <span style={{
      backgroundColor: `${branding.error}30`,
      padding: `${branding.space[0.5] || '2px'} ${branding.space[1.5]}`,
      borderRadius: branding.radius.md,
      fontSize: branding.fontSize.xs,
    }}>{count}x</span>
  </span>
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
 * Results display component
 */
const ResultsDisplay = ({ result, onPlayAgain, onBack, buttonGradient, primaryAccent, primaryAccentLight, branding }) => {
  const feedback = getScoreFeedback(result.score);
  const isGoodScore = result.score >= 70;
  const isNoSpeech = result.pace_feedback === 'keine_sprache' || result.transcript === '[Keine Sprache erkannt]';

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      {/* Score Card */}
      <div style={{
        borderRadius: branding.radius['2xl'],
        padding: branding.space[8],
        marginBottom: branding.space[6],
        background: isNoSpeech
          ? `linear-gradient(135deg, ${branding.textSecondary} 0%, ${branding.textMuted} 100%)`
          : isGoodScore
            ? `linear-gradient(135deg, ${branding.success} 0%, ${primaryAccent} 100%)`
            : `linear-gradient(135deg, ${branding.warning} 0%, ${branding.warningDark || branding.warning} 100%)`,
        color: 'white',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: branding.iconSize['4xl'], marginBottom: branding.space[2] }}>
          {isNoSpeech ? '🎤' : feedback.emoji}
        </div>
        <div style={{ fontSize: '72px', fontWeight: branding.fontWeight.bold, marginBottom: branding.space[2] }}>{result.score}</div>
        <div style={{ fontSize: branding.fontSize.xl, opacity: 0.9, marginBottom: branding.space[4] }}>Punkte</div>
        <p style={{ fontSize: branding.fontSize.lg, margin: 0 }}>
          {isNoSpeech ? 'Keine Sprache erkannt. Bitte sprich lauter ins Mikrofon.' : feedback.message}
        </p>
      </div>

      {/* Stats Grid - 2x2 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: branding.space[3],
        marginBottom: branding.space[6],
      }}>
        {/* Total Words */}
        <div style={{
          backgroundColor: branding.cardBg,
          borderRadius: branding.radius.lg,
          padding: branding.space[3.5],
          border: `1px solid ${branding.borderColor}`,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: branding.space[1.5],
            color: primaryAccent,
            marginBottom: branding.space[1.5],
          }}>
            <MessageCircle style={{ width: branding.iconSize.sm, height: branding.iconSize.sm }} />
            <span style={{ fontWeight: branding.fontWeight.medium, fontSize: branding.fontSize.sm }}>Wörter</span>
          </div>
          <div style={{ fontSize: branding.fontSize['4xl'], fontWeight: branding.fontWeight.bold, color: branding.textMain }}>{result.total_words}</div>
          <div style={{ fontSize: branding.fontSize['2xs'], color: branding.textMuted }}>gesprochen</div>
        </div>

        {/* Filler Count */}
        <div style={{
          backgroundColor: branding.cardBg,
          borderRadius: branding.radius.lg,
          padding: branding.space[3.5],
          border: `1px solid ${branding.borderColor}`,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: branding.error,
            marginBottom: '6px',
          }}>
            <AlertTriangle style={{ width: '16px', height: '16px' }} />
            <span style={{ fontWeight: 500, fontSize: '13px' }}>Füllwörter</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: branding.textMain }}>{result.filler_count}</div>
          <div style={{ fontSize: '11px', color: branding.textMuted }}>
            {result.filler_percentage?.toFixed(1) || '0'}%
          </div>
        </div>

        {/* Words Per Minute */}
        <div style={{
          backgroundColor: branding.cardBg,
          borderRadius: '12px',
          padding: '14px',
          border: `1px solid ${branding.borderColor}`,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: primaryAccent,
            marginBottom: '6px',
          }}>
            <Volume2 style={{ width: '16px', height: '16px' }} />
            <span style={{ fontWeight: 500, fontSize: '13px' }}>Tempo</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: branding.textMain }}>{result.words_per_minute}</div>
          <div style={{ fontSize: '11px', color: branding.textMuted }}>WPM</div>
        </div>

        {/* Speaking Time */}
        <div style={{
          backgroundColor: branding.cardBg,
          borderRadius: '12px',
          padding: '14px',
          border: `1px solid ${branding.borderColor}`,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: branding.textSecondary,
            marginBottom: '6px',
          }}>
            <Clock style={{ width: '16px', height: '16px' }} />
            <span style={{ fontWeight: 500, fontSize: '13px' }}>Sprechzeit</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: branding.textMain }}>{result.duration_seconds || 0}</div>
          <div style={{ fontSize: '11px', color: branding.textMuted }}>Sekunden</div>
        </div>
      </div>

      {/* Filler Words Detail */}
      {result.filler_words && result.filler_words.length > 0 && (
        <div style={{
          backgroundColor: branding.cardBg,
          borderRadius: '12px',
          padding: '16px',
          border: `1px solid ${branding.borderColor}`,
          marginBottom: '24px',
        }}>
          <h4 style={{ fontWeight: 600, color: branding.textMain, marginBottom: '12px', fontSize: '15px' }}>
            Erkannte Füllwörter
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {result.filler_words.map((fw, index) => (
              <FillerWordBadge key={index} word={fw.word} count={fw.count} branding={branding} />
            ))}
          </div>
        </div>
      )}

      {/* Score Breakdown */}
      {!isNoSpeech && (
        <div style={{
          backgroundColor: primaryAccentLight,
          border: `1px solid ${primaryAccent}26`,
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '24px',
        }}>
          <h4 style={{ fontWeight: 600, color: primaryAccent, marginBottom: '12px', fontSize: '15px' }}>
            Bewertung im Detail
          </h4>

          {/* Score Breakdown Grid */}
          {result.score_breakdown && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              marginBottom: result.content_feedback ? '12px' : 0,
            }}>
              <div style={{ fontSize: '13px', color: branding.textSecondary }}>
                📝 Wortanzahl: <strong>{result.score_breakdown.words_score || 0}/25</strong>
              </div>
              <div style={{ fontSize: '13px', color: branding.textSecondary }}>
                🚫 Füllwörter: <strong>{result.score_breakdown.filler_score || 0}/25</strong>
              </div>
              <div style={{ fontSize: '13px', color: branding.textSecondary }}>
                ⏱️ Tempo: <strong>{result.score_breakdown.tempo_score || 0}/10</strong>
              </div>
              <div style={{ fontSize: '13px', color: branding.textSecondary }}>
                💡 Inhalt: <strong>{result.score_breakdown.content_score || 0}/40</strong>
              </div>
            </div>
          )}

          {/* Content Feedback Text */}
          {result.content_feedback && (
            <div style={{
              paddingTop: '12px',
              borderTop: `1px solid ${primaryAccent}26`,
            }}>
              <p style={{ fontSize: '14px', color: branding.textSecondary, margin: 0, lineHeight: 1.5 }}>
                <strong>Inhaltliches Feedback:</strong> {result.content_feedback}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Pace Feedback */}
      {result.pace_feedback && result.pace_feedback !== 'optimal' && result.pace_feedback !== 'keine_sprache' && (
        <div style={{
          backgroundColor: branding.warningLight,
          border: `1px solid ${branding.warning}40`,
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '24px',
        }}>
          <h4 style={{ fontWeight: 600, color: branding.warning, marginBottom: '8px', fontSize: '15px' }}>
            Tempo-Hinweis
          </h4>
          <p style={{ fontSize: '14px', color: branding.textSecondary, margin: 0 }}>
            {result.pace_feedback === 'zu_schnell'
              ? 'Du sprichst etwas zu schnell. Versuche, bewusst langsamer und deutlicher zu sprechen.'
              : 'Du sprichst etwas zu langsam. Versuche, etwas mehr Energie in deine Präsentation zu legen.'}
          </p>
        </div>
      )}

      {/* Transcript */}
      {result.transcript && result.transcript !== '[Keine Sprache erkannt]' && (
        <div style={{
          backgroundColor: branding.cardBgHover,
          borderRadius: '12px',
          border: `1px solid ${branding.borderColor}`,
          padding: '16px',
          marginBottom: '32px',
        }}>
          <h4 style={{ fontWeight: 600, color: branding.textMain, marginBottom: '12px', fontSize: '15px' }}>
            Transkript
          </h4>
          <p style={{ fontSize: '14px', color: branding.textSecondary, lineHeight: 1.6, margin: 0 }}>
            {result.transcript}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '16px' }}>
        <button
          onClick={onPlayAgain}
          style={{
            flex: 1,
            padding: '14px 24px',
            borderRadius: '12px',
            border: 'none',
            background: buttonGradient,
            color: 'white',
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <RotateCcw style={{ width: '18px', height: '18px' }} />
          Nochmal spielen
        </button>
        <button
          onClick={onBack}
          style={{
            flex: 1,
            padding: '14px 24px',
            borderRadius: '12px',
            border: `1px solid ${branding.borderColor}`,
            backgroundColor: branding.cardBg,
            color: branding.textSecondary,
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <ArrowLeft style={{ width: '18px', height: '18px' }} />
          Zurück
        </button>
      </div>
    </div>
  );
};

/**
 * Main GameSession Component
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

  // Partner theming
  const { branding } = usePartner();
  const headerGradient = branding?.['--header-gradient'] || DEFAULT_BRANDING['--header-gradient'];
  const buttonGradient = branding?.['--button-gradient'] || headerGradient;
  const primaryAccent = branding?.['--primary-accent'] || DEFAULT_BRANDING['--primary-accent'];
  const primaryAccentLight = branding?.['--primary-accent-light'] || DEFAULT_BRANDING['--primary-accent-light'];

  // Get full branding object for sub-components
  const b = useBranding();

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
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ maxWidth: '500px', margin: '0 auto' }}>
              <div style={{ fontSize: '64px', marginBottom: '24px' }}>🎤</div>
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: b.textMain, marginBottom: '12px' }}>
                Bereit?
              </h2>
              <p style={{ fontSize: '16px', color: b.textSecondary, marginBottom: '24px', lineHeight: 1.6 }}>
                {gameConfig.topic}
              </p>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                backgroundColor: b.cardBgHover,
                borderRadius: '20px',
                color: b.textSecondary,
                fontSize: '14px',
                marginBottom: '32px',
              }}>
                <Clock style={{ width: '16px', height: '16px' }} />
                {gameConfig.duration} Sekunden
              </div>

              <div>
                <button
                  onClick={startCountdown}
                  style={{
                    padding: '16px 40px',
                    borderRadius: '14px',
                    border: 'none',
                    background: buttonGradient,
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px',
                    boxShadow: `0 4px 14px ${primaryAccent}66`,
                  }}
                >
                  <Play style={{ width: '20px', height: '20px' }} />
                  Aufnahme starten
                </button>
              </div>

              <button
                onClick={onBack}
                style={{
                  marginTop: '24px',
                  padding: '10px 20px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: b.textMuted,
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <ArrowLeft style={{ width: '16px', height: '16px' }} />
                Zurück zur Auswahl
              </button>
            </div>
          </div>
        );

      case GAME_STATES.RECORDING:
        return (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ maxWidth: '500px', margin: '0 auto' }}>
              <TimerDisplay
                seconds={timeLeft}
                total={gameConfig.duration}
                isWarning={timeLeft <= 10}
                primaryAccent={primaryAccent}
                branding={b}
              />

              {/* Topic reminder */}
              <div style={{
                marginTop: '32px',
                marginBottom: '32px',
                padding: '16px',
                backgroundColor: b.cardBgHover,
                borderRadius: '12px',
              }}>
                <p style={{ fontSize: '13px', color: b.textMuted, marginBottom: '4px' }}>Dein Thema:</p>
                <p style={{ fontSize: '15px', fontWeight: 500, color: b.textMain, margin: 0 }}>
                  {gameConfig.topic}
                </p>
              </div>

              {/* Audio visualizer */}
              <div style={{ marginBottom: '32px' }}>
                <motion.div
                  style={{
                    height: '80px',
                    background: buttonGradient,
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  animate={{ opacity: 0.6 + audioLevel * 0.4 }}
                >
                  <motion.div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255, 255, 255, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    animate={{ scale: 1 + audioLevel * 0.3 }}
                  >
                    <Mic style={{ width: '28px', height: '28px', color: 'white' }} />
                  </motion.div>
                </motion.div>
              </div>

              {/* Recording indicator */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '32px',
              }}>
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: 1 }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: b.error,
                  }}
                />
                <span style={{ fontWeight: 500, color: b.error, fontSize: '14px' }}>
                  Aufnahme läuft...
                </span>
              </div>

              <button
                onClick={handleEarlyStop}
                style={{
                  padding: '12px 24px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: b.error,
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Square style={{ width: '16px', height: '16px' }} />
                Aufnahme beenden
              </button>
            </div>
          </div>
        );

      case GAME_STATES.PROCESSING:
        return (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              style={{
                width: '56px',
                height: '56px',
                border: `4px solid ${primaryAccent}`,
                borderTopColor: 'transparent',
                borderRadius: '50%',
                margin: '0 auto 24px',
              }}
            />
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: b.textMain, marginBottom: '8px' }}>
              Analysiere deine Aufnahme...
            </h2>
            <p style={{ color: b.textMuted }}>Der Füllwort-Killer zählt nach</p>
          </div>
        );

      case GAME_STATES.RESULTS:
        return (
          <ResultsDisplay
            result={result}
            onPlayAgain={handlePlayAgain}
            onBack={onBack}
            buttonGradient={buttonGradient}
            primaryAccent={primaryAccent}
            primaryAccentLight={primaryAccentLight}
            branding={b}
          />
        );

      case GAME_STATES.ERROR:
        return (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ maxWidth: '400px', margin: '0 auto' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: b.errorLight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
              }}>
                <XCircle style={{ width: '32px', height: '32px', color: b.error }} />
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: b.textMain, marginBottom: '12px' }}>
                Fehler
              </h2>
              <p style={{ color: b.textSecondary, marginBottom: '24px' }}>{error}</p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button
                  onClick={handlePlayAgain}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '12px',
                    border: 'none',
                    background: buttonGradient,
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <RotateCcw style={{ width: '16px', height: '16px' }} />
                  Erneut versuchen
                </button>
                <button
                  onClick={onBack}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '12px',
                    border: `1px solid ${b.borderColor}`,
                    backgroundColor: b.cardBg,
                    color: b.textSecondary,
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <ArrowLeft style={{ width: '16px', height: '16px' }} />
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
    <div style={{ minHeight: '100%', paddingBottom: '32px' }}>
      {/* Countdown overlay */}
      <AnimatePresence>
        {gameState === GAME_STATES.COUNTDOWN && (
          <CountdownOverlay count={countdown} branding={b} />
        )}
      </AnimatePresence>

      {/* Header - only show when not recording */}
      {gameState !== GAME_STATES.COUNTDOWN && gameState !== GAME_STATES.RECORDING && (
        <div style={{
          padding: '16px 24px',
          borderBottom: `1px solid ${b.borderColor}`,
          backgroundColor: b.cardBg,
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}>
          <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button
              onClick={onBack}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                border: 'none',
                backgroundColor: 'transparent',
                color: b.textSecondary,
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              <ArrowLeft style={{ width: '18px', height: '18px' }} />
              Zurück
            </button>
            <h1 style={{ fontWeight: 600, color: b.textMain, fontSize: '16px', margin: 0 }}>
              {gameConfig.mode.title}
            </h1>
            <div style={{ width: '60px' }} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div style={{ padding: '24px' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default GameSession;
