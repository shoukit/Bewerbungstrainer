import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useMobile } from '@/hooks/useMobile';
import {
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Clock,
  Loader2,
  AlertCircle,
  X,
  Check,
} from 'lucide-react';

import wordpressAPI from '@/services/wordpress-api';
import ImmediateFeedback from './ImmediateFeedback';
import ProgressBar from '@/components/ui/composite/progress-bar';
import MicrophoneTestDialog from '@/components/device-setup/MicrophoneTestDialog';
import DeviceSettingsDialog from '@/components/device-setup/DeviceSettingsDialog';
import FullscreenLoader from '@/components/ui/composite/fullscreen-loader';
import { usePartner } from '@/context/PartnerContext';
import { DEFAULT_BRANDING } from '@/config/partners';
import { useBranding } from '@/hooks/useBranding';

// Extracted components
import QuestionTips from './QuestionTips';
import SimulatorAudioRecorder from './SimulatorAudioRecorder';
import PreSessionView from './PreSessionView';
import { CompleteConfirmDialog, CancelConfirmDialog } from './ConfirmationDialogs';

/**
 * Simulator Session Component
 * Two-column layout like VideoTraining
 */
const SimulatorSession = ({
  session: initialSession,
  questions: initialQuestions,
  scenario,
  variables,
  preloadedQuestions,
  onSessionCreated,
  onComplete,
  onExit,
  startFromQuestion = 0,
  initialMicrophoneId,
}) => {
  // Mobile detection
  const isMobile = useMobile();

  // Internal state for session and questions (can be created during preparation)
  const [session, setSession] = useState(initialSession);
  const [questions, setQuestions] = useState(initialQuestions || []);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [sessionCreateError, setSessionCreateError] = useState(null);

  const { demoCode } = usePartner();

  // Mode-based labels (INTERVIEW vs SIMULATION)
  const isSimulation = scenario?.mode === 'SIMULATION';
  const labels = {
    questionLabel: isSimulation ? 'Situation / Aussage des Gegenübers:' : 'Interviewfrage:',
    questionFallback: isSimulation ? 'Situation' : 'Frage',
    questionLoading: isSimulation ? 'Situation wird geladen...' : 'Frage wird geladen...',
    answerPlaceholder: isSimulation ? 'Deine Reaktion...' : 'Deine Antwort...',
    submitButton: isSimulation ? 'Reaktion abgeben' : 'Antwort abgeben',
    submitHint: isSimulation ? 'Klicke auf den Button, um deine Reaktion aufzunehmen' : 'Klicke auf den Button, um deine Antwort aufzunehmen',
    analyzing: isSimulation ? 'Reaktion wird analysiert...' : 'Antwort wird analysiert...',
    questionCounter: (current, total) => isSimulation ? `Situation ${current} von ${total}` : `Frage ${current} von ${total}`,
    questionsCount: (count) => isSimulation ? `${count} Situationen` : `${count} Fragen`,
    answeredCount: (answered, total) => isSimulation
      ? `${answered} von ${total} Situationen`
      : `${answered} von ${total} Fragen`,
    tipsLabel: isSimulation ? 'Tipps für diese Situation' : 'Tipps für diese Frage',
    nextButton: isSimulation ? 'Nächste Situation' : 'Nächste Frage',
    timePerQuestion: isSimulation ? 'Zeit pro Situation' : 'Zeit pro Frage',
    questionsLabel: isSimulation ? 'Situationen' : 'Fragen',
    recommendedTime: isSimulation ? 'Empfohlene Reaktionszeit' : 'Empfohlene Antwortzeit',
  };

  // Determine if this is a continuation (skip preparation) or repeat (has preloaded questions)
  const isContinuation = startFromQuestion > 0;
  const isRepeat = preloadedQuestions && preloadedQuestions.length > 0;

  // Initialize with previously answered questions when continuing
  const initialAnsweredQuestions = isContinuation
    ? Array.from({ length: startFromQuestion }, (_, i) => i)
    : [];

  const [phase, setPhase] = useState(isContinuation ? 'interview' : 'preparation');
  const [currentIndex, setCurrentIndex] = useState(startFromQuestion || session?.current_question_index || 0);
  const [feedback, setFeedback] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [completedAnswers, setCompletedAnswers] = useState([]);
  const [answeredQuestions, setAnsweredQuestions] = useState(initialAnsweredQuestions);

  // Microphone selection - restore from localStorage if not provided (for session continuation)
  const MICROPHONE_STORAGE_KEY = 'karriereheld_selected_microphone';
  const [selectedMicrophoneId, setSelectedMicrophoneId] = useState(() => {
    if (initialMicrophoneId) return initialMicrophoneId;
    // Try to restore from localStorage for session continuation
    try {
      return localStorage.getItem(MICROPHONE_STORAGE_KEY) || null;
    } catch {
      return null;
    }
  });
  const [showMicrophoneTest, setShowMicrophoneTest] = useState(false);
  const [showDeviceSettings, setShowDeviceSettings] = useState(false);

  // Track active media stream for cleanup
  const activeStreamRef = useRef(null);

  // Cleanup function that can be called from anywhere
  const cleanupMediaStream = useCallback(() => {
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach(track => track.stop());
      activeStreamRef.current = null;
    }
  }, []);

  // Handler to track stream changes from AudioRecorder
  const handleStreamChange = useCallback((stream) => {
    activeStreamRef.current = stream;
  }, []);

  // Global cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupMediaStream();
    };
  }, [cleanupMediaStream]);

  // Save microphone selection to localStorage whenever it changes
  useEffect(() => {
    if (selectedMicrophoneId) {
      try {
        localStorage.setItem(MICROPHONE_STORAGE_KEY, selectedMicrophoneId);
      } catch {
        // localStorage might be unavailable
      }
    }
  }, [selectedMicrophoneId]);

  // Confirmation dialog states
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // SIMULATION mode: Pre-load next question while showing feedback
  const [isLoadingNextTurn, setIsLoadingNextTurn] = useState(false);
  const [preloadedNextQuestion, setPreloadedNextQuestion] = useState(null);
  const [isConversationFinished, setIsConversationFinished] = useState(false);

  const { branding } = usePartner();
  const b = useBranding();
  const headerGradient = branding?.['--header-gradient'] || DEFAULT_BRANDING['--header-gradient'];
  const buttonGradient = branding?.['--button-gradient'] || headerGradient;
  const primaryAccent = branding?.['--primary-accent'] || DEFAULT_BRANDING['--primary-accent'];
  const primaryAccentLight = branding?.['--primary-accent-light'] || DEFAULT_BRANDING['--primary-accent-light'];

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const isFirstQuestion = currentIndex === 0;

  const handleRecordingComplete = async (audioBlob, audioDuration) => {
    // Validate minimum audio duration (at least 2 seconds)
    if (audioDuration < 2) {
      setSubmitError('Die Aufnahme ist zu kurz. Bitte sprechen Sie mindestens 2 Sekunden.');
      return;
    }

    // Validate audio blob size (at least 5KB to have meaningful speech content)
    if (audioBlob.size < 5000) {
      console.warn('[SimulatorSession] Audio too small:', audioBlob.size, 'bytes');
      setSubmitError('Die Aufnahme enthält keine verwertbaren Audiodaten. Bitte sprechen Sie während der Aufnahme und versuchen Sie es erneut.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await wordpressAPI.submitSimulatorAnswer(
        session.id,
        audioBlob,
        currentIndex,
        currentQuestion.question,
        currentQuestion.category,
        audioDuration
      );

      if (!response.success) {
        throw new Error(response.message || 'Fehler beim Analysieren der Antwort');
      }

      setFeedback(response.data);
      setShowFeedback(true);

      setCompletedAnswers(prev => [
        ...prev.filter(a => a.questionIndex !== currentIndex),
        { questionIndex: currentIndex, feedback: response.data }
      ]);

      setAnsweredQuestions(prev =>
        prev.includes(currentIndex) ? prev : [...prev, currentIndex]
      );

      // SIMULATION mode: Start generating next turn in background
      if (isSimulation && !isConversationFinished) {
        setIsLoadingNextTurn(true);
        setPreloadedNextQuestion(null);

        // Check if this is a retry (user already answered this question before)
        const isRetryAttempt = answeredQuestions.includes(currentIndex);

        try {
          const nextTurnResponse = await wordpressAPI.generateNextTurn(session.id);

          if (nextTurnResponse.success) {
            const nextQuestion = nextTurnResponse.data.next_question;

            if (nextTurnResponse.data.is_finished) {
              // Conversation is ending - but we still have a final response to show
              setPreloadedNextQuestion(nextQuestion);
              if (isRetryAttempt) {
                // Replace the next question instead of appending
                setQuestions(prev => {
                  const updated = [...prev];
                  updated[currentIndex + 1] = nextQuestion;
                  return updated.slice(0, currentIndex + 2); // Remove any questions after
                });
              } else {
                setQuestions(prev => [...prev, nextQuestion]);
              }
              setIsConversationFinished(true);
            } else {
              setPreloadedNextQuestion(nextQuestion);
              if (isRetryAttempt) {
                // Replace the next question instead of appending
                setQuestions(prev => {
                  const updated = [...prev];
                  updated[currentIndex + 1] = nextQuestion;
                  return updated.slice(0, currentIndex + 2); // Remove any questions after
                });
                // Also reset conversation finished state if it was set
                setIsConversationFinished(false);
              } else {
                // First attempt - append new question
                setQuestions(prev => [...prev, nextQuestion]);
              }
            }
          }
        } catch (nextTurnErr) {
          console.error('Error generating next turn:', nextTurnErr);
          // Don't show error to user, just log it - they can still see feedback
        } finally {
          setIsLoadingNextTurn(false);
        }
      }

    } catch (err) {
      console.error('Error submitting answer:', err);
      setSubmitError(err.message || 'Ein Fehler ist aufgetreten');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setFeedback(null);
    setShowFeedback(false);
    setSubmitError(null);
  };

  const handleNext = () => {
    setFeedback(null);
    setShowFeedback(false);
    setSubmitError(null);

    if (isSimulation) {
      // SIMULATION mode: Move to the next dynamically generated question
      if (preloadedNextQuestion) {
        // There's a next question to show - move to it
        setCurrentIndex(prev => prev + 1);
        setPreloadedNextQuestion(null);
        // Don't complete yet - let user respond to this question first
        return;
      }

      // If conversation is finished AND no more questions to show, complete
      if (isConversationFinished) {
        handleCompleteSession();
        return;
      }
    } else {
      // INTERVIEW mode: Standard navigation
      if (!isLastQuestion) {
        setCurrentIndex(prev => prev + 1);
      }
    }
  };

  const handlePrev = () => {
    setFeedback(null);
    setShowFeedback(false);
    setSubmitError(null);
    if (!isFirstQuestion) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  // Show confirmation dialog for completing session
  const handleCompleteClick = () => {
    setShowCompleteConfirm(true);
  };

  // Actually complete the session after confirmation
  const handleCompleteSession = async () => {
    setShowCompleteConfirm(false);
    // Close any open dialogs to trigger their cleanup
    setShowDeviceSettings(false);
    setShowMicrophoneTest(false);
    // Explicitly cleanup any active media stream
    cleanupMediaStream();
    try {
      const response = await wordpressAPI.completeSimulatorSession(session.id);
      if (response.success) {
        onComplete(response.data);
      } else {
        onComplete({ session: { ...session, status: 'completed' } });
      }
    } catch (err) {
      console.error('Error completing session:', err);
      onComplete({ session: { ...session, status: 'completed' } });
    }
  };

  // Show confirmation dialog for canceling session
  const handleCancelClick = () => {
    setShowCancelConfirm(true);
  };

  // Actually cancel the session after confirmation
  const handleCancelSession = () => {
    setShowCancelConfirm(false);
    // Close any open dialogs to trigger their cleanup
    setShowDeviceSettings(false);
    setShowMicrophoneTest(false);
    // Explicitly cleanup any active media stream
    cleanupMediaStream();
    onExit();
  };

  const handleStartInterview = async () => {
    // If we already have a session and questions (continuation or repeat), just start
    if (session && questions.length > 0) {
      setPhase('interview');
      return;
    }

    // Otherwise, create session and generate questions
    setIsCreatingSession(true);
    setSessionCreateError(null);

    try {
      // 1. Create session with variables
      const sessionResponse = await wordpressAPI.createSimulatorSession({
        scenario_id: scenario.id,
        variables: variables,
        demo_code: demoCode || null,
        questions: preloadedQuestions || null,
      });

      if (!sessionResponse.success) {
        throw new Error(sessionResponse.message || 'Fehler beim Erstellen der Session');
      }

      const newSession = sessionResponse.data.session;

      // 2. Generate or use preloaded questions
      let newQuestions;
      if (preloadedQuestions && preloadedQuestions.length > 0) {
        newQuestions = preloadedQuestions;
        await wordpressAPI.updateSimulatorSessionQuestions(newSession.id, newQuestions);
      } else {
        const questionsResponse = await wordpressAPI.generateSimulatorQuestions(newSession.id);
        if (!questionsResponse.success) {
          throw new Error(questionsResponse.message || 'Fehler beim Generieren der Fragen');
        }
        newQuestions = questionsResponse.data.questions;
      }

      // 3. Update internal state
      setSession({ ...newSession, questions_json: newQuestions });
      setQuestions(newQuestions);

      // 4. Notify parent
      if (onSessionCreated) {
        onSessionCreated({
          session: { ...newSession, questions_json: newQuestions },
          questions: newQuestions,
          selectedMicrophoneId: selectedMicrophoneId,
        });
      }

      // 5. Start interview
      setPhase('interview');

    } catch (err) {
      console.error('Error creating session:', err);
      setSessionCreateError(err.message || 'Ein Fehler ist aufgetreten');
    } finally {
      setIsCreatingSession(false);
    }
  };

  // Show preparation view first
  if (phase === 'preparation') {
    return (
      <>
        <PreSessionView
          scenario={scenario}
          variables={variables}
          questions={questions}
          onStart={handleStartInterview}
          onBack={onExit}
          selectedMicrophoneId={selectedMicrophoneId}
          onMicrophoneChange={setSelectedMicrophoneId}
          onMicrophoneTest={() => setShowMicrophoneTest(true)}
          themedGradient={buttonGradient}
          primaryAccent={primaryAccent}
          primaryAccentLight={primaryAccentLight}
          isLoading={isCreatingSession}
          branding={b}
        />
        <MicrophoneTestDialog
          isOpen={showMicrophoneTest}
          onClose={() => setShowMicrophoneTest(false)}
          deviceId={selectedMicrophoneId}
        />

        {/* Error Display */}
        {sessionCreateError && (
          <div style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '12px 24px',
            borderRadius: '12px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            fontSize: '14px',
            fontWeight: 500,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            zIndex: 100,
          }}>
            {sessionCreateError}
          </div>
        )}

        {/* Fullscreen Loading Overlay */}
        <FullscreenLoader
          isLoading={isCreatingSession}
          message={isSimulation ? "Situationen werden generiert..." : "Fragen werden generiert..."}
          subMessage="Die KI erstellt personalisierte Inhalte basierend auf deinen Angaben."
        />
      </>
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
        <div style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          justifyContent: isMobile ? 'space-between' : 'flex-end',
        }}>
          {/* Training beenden - hide when training is truly complete */}
          {!(showFeedback && (
            (isSimulation && isConversationFinished && !preloadedNextQuestion) ||
            (!isSimulation && isLastQuestion)
          )) && (
            <button
              onClick={handleCompleteClick}
              style={{
                padding: isMobile ? '10px 14px' : '8px 16px',
                borderRadius: '8px',
                background: '#22c55e',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: 'white',
                fontSize: '14px',
                fontWeight: 600,
                boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)',
                flex: isMobile ? 1 : 'none',
                justifyContent: 'center',
              }}
            >
              <Check size={16} />
              {isMobile ? 'Beenden' : 'Training beenden'}
            </button>
          )}
          <button
            onClick={handleCancelClick}
            style={{
              padding: isMobile ? '10px 14px' : '8px 16px',
              borderRadius: '8px',
              background: '#f1f5f9',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#64748b',
              fontSize: '14px',
              flex: isMobile ? 1 : 'none',
              justifyContent: 'center',
            }}
          >
            <X size={16} />
            Abbrechen
          </button>
        </div>
      </div>

      {/* Confirmation Dialogs */}
      <CompleteConfirmDialog
        isOpen={showCompleteConfirm}
        onClose={() => setShowCompleteConfirm(false)}
        onConfirm={handleCompleteSession}
        answeredCount={answeredQuestions.length}
        totalCount={questions.length}
        labels={labels}
      />
      <CancelConfirmDialog
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={handleCancelSession}
        answeredCount={answeredQuestions.length}
        labels={labels}
      />

      {/* Navigation Buttons - only show during recording (not feedback) and NOT in SIMULATION mode */}
      {!showFeedback && !isSimulation && (
        <div style={{
          display: 'flex',
          gap: isMobile ? '8px' : '12px',
          justifyContent: 'center',
          marginBottom: '16px',
        }}>
          <button
            onClick={handlePrev}
            disabled={isFirstQuestion}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: isMobile ? '10px 14px' : '12px 20px',
              borderRadius: '10px',
              border: `2px solid ${b.borderColor}`,
              backgroundColor: b.cardBg,
              color: isFirstQuestion ? b.textMuted : b.textSecondary,
              fontSize: isMobile ? '13px' : '14px',
              fontWeight: 600,
              cursor: isFirstQuestion ? 'not-allowed' : 'pointer',
              opacity: isFirstQuestion ? 0.5 : 1,
              flex: isMobile ? 1 : 'none',
              justifyContent: 'center',
            }}
          >
            <ChevronLeft size={16} />
            Zurück
          </button>
          <button
            onClick={handleNext}
            disabled={isLastQuestion}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: isMobile ? '10px 14px' : '12px 20px',
              borderRadius: '10px',
              border: `2px solid ${b.borderColor}`,
              backgroundColor: b.cardBg,
              color: isLastQuestion ? b.textMuted : b.textSecondary,
              fontSize: isMobile ? '13px' : '14px',
              fontWeight: 600,
              cursor: isLastQuestion ? 'not-allowed' : 'pointer',
              opacity: isLastQuestion ? 0.5 : 1,
              flex: isMobile ? 1 : 'none',
              justifyContent: 'center',
            }}
          >
            {isMobile ? 'Überspringen' : 'Frage überspringen'}
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Progress */}
      <ProgressBar
        current={currentIndex}
        total={questions.length}
        answeredQuestions={answeredQuestions}
        primaryAccent={primaryAccent}
        b={b}
        labels={labels}
      />

      {/* Main Content */}
      {showFeedback ? (
        /* Single Column Layout for Feedback View */
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', justifyContent: 'flex-end' }}>
            {/* Retry button */}
            {scenario.allow_retry && (
              <button
                onClick={handleRetry}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  borderRadius: '10px',
                  border: `2px solid ${b.borderColor}`,
                  backgroundColor: b.cardBg,
                  color: b.textSecondary,
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <RotateCcw size={16} />
                Nochmal versuchen
              </button>
            )}
            <button
              onClick={
                isSimulation
                  ? ((isConversationFinished && !preloadedNextQuestion) ? handleCompleteSession : handleNext)
                  : (isLastQuestion ? handleCompleteSession : handleNext)
              }
              disabled={isSimulation && isLoadingNextTurn && !isConversationFinished}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                borderRadius: '10px',
                border: 'none',
                background: (isSimulation && isLoadingNextTurn && !isConversationFinished)
                  ? b.textMuted
                  : buttonGradient,
                color: 'white',
                fontSize: '14px',
                fontWeight: 600,
                cursor: (isSimulation && isLoadingNextTurn && !isConversationFinished)
                  ? 'wait'
                  : 'pointer',
                boxShadow: (isSimulation && isLoadingNextTurn && !isConversationFinished)
                  ? 'none'
                  : `0 4px 12px ${primaryAccent}4d`,
                opacity: (isSimulation && isLoadingNextTurn && !isConversationFinished) ? 0.7 : 1,
              }}
            >
              {isSimulation && isLoadingNextTurn && !isConversationFinished ? (
                <>
                  <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                  Gesprächspartner tippt...
                </>
              ) : (isSimulation ? (
                // Show "abschließen" only when finished AND no more questions to show
                (isConversationFinished && !preloadedNextQuestion) ? 'Training abschließen' : labels.nextButton
              ) : (
                isLastQuestion ? 'Training abschließen' : labels.nextButton
              ))}
              {!isLoadingNextTurn && !(isSimulation ? (isConversationFinished && !preloadedNextQuestion) : isLastQuestion) && <ChevronRight size={16} />}
            </button>
          </div>

          {/* Question Card */}
          <div
            style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '20px',
              border: '1px solid #e2e8f0',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: buttonGradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                {currentIndex + 1}
              </div>
              <span style={{ fontSize: '14px', color: '#64748b' }}>
                {currentQuestion?.category || labels.questionFallback}
              </span>
            </div>
            <p style={{ fontSize: '16px', fontWeight: 500, color: '#0f172a', margin: 0, lineHeight: 1.5 }}>
              {currentQuestion?.question || labels.questionLoading}
            </p>
          </div>

          {/* Feedback Content */}
          <ImmediateFeedback
            transcript={feedback.transcript}
            feedback={feedback.feedback}
            audioMetrics={feedback.audio_analysis}
            audioUrl={feedback.audio_url}
            hideButtons={true}
          />
        </div>
      ) : (
        /* Recording View Layout */
        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '24px' }}>
          {/* Mobile: Question First, then Recording. Desktop: Two columns */}
          {isMobile ? (
            /* Mobile Layout - Stacked vertically */
            <>
              {/* Question Card - Mobile */}
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
                      background: buttonGradient,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: '12px',
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    {currentIndex + 1}
                  </div>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>
                    {currentQuestion?.category || labels.questionFallback}
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
                  {currentQuestion?.question || labels.questionLoading}
                </p>

                {currentQuestion?.estimated_answer_time && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '13px', marginTop: '12px' }}>
                    <Clock size={14} />
                    {labels.recommendedTime}: ca. {Math.round(currentQuestion.estimated_answer_time / 60)} Min
                  </div>
                )}
              </div>

              {/* Recording Area - Mobile */}
              <SimulatorAudioRecorder
                onRecordingComplete={handleRecordingComplete}
                timeLimit={scenario.time_limit_per_question || 120}
                disabled={false}
                deviceId={selectedMicrophoneId}
                themedGradient={buttonGradient}
                primaryAccent={primaryAccent}
                isSubmitting={isSubmitting}
                labels={labels}
                onOpenSettings={() => setShowDeviceSettings(true)}
                branding={b}
                isMobile={true}
                onStreamChange={handleStreamChange}
              />

              {/* Error State - Mobile */}
              {submitError && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '16px',
                  borderRadius: '12px',
                  backgroundColor: b.errorLight,
                }}>
                  <AlertCircle style={{ width: '24px', height: '24px', color: b.error }} />
                  <p style={{
                    marginTop: '8px',
                    color: b.error,
                    fontWeight: 500,
                    fontSize: '14px',
                    textAlign: 'center',
                  }}>
                    {submitError}
                  </p>
                  <button
                    onClick={handleRetry}
                    style={{
                      marginTop: '12px',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: b.error,
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    Erneut versuchen
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Desktop Layout - Two Column Grid */
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Left Column - Recording */}
              <div>
                <SimulatorAudioRecorder
                  onRecordingComplete={handleRecordingComplete}
                  timeLimit={scenario.time_limit_per_question || 120}
                  disabled={false}
                  deviceId={selectedMicrophoneId}
                  themedGradient={buttonGradient}
                  primaryAccent={primaryAccent}
                  isSubmitting={isSubmitting}
                  labels={labels}
                  onOpenSettings={() => setShowDeviceSettings(true)}
                  branding={b}
                  isMobile={false}
                  onStreamChange={handleStreamChange}
                />

                {/* Error State */}
                {submitError && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '20px',
                    marginTop: '16px',
                    borderRadius: '12px',
                    backgroundColor: b.errorLight,
                  }}>
                    <AlertCircle style={{ width: '24px', height: '24px', color: b.error }} />
                    <p style={{
                      marginTop: '8px',
                      color: b.error,
                      fontWeight: 500,
                      fontSize: '14px',
                      textAlign: 'center',
                    }}>
                      {submitError}
                    </p>
                    <button
                      onClick={handleRetry}
                      style={{
                        marginTop: '12px',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: b.error,
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      Erneut versuchen
                    </button>
                  </div>
                )}
              </div>

              {/* Right Column - Question */}
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
                      background: buttonGradient,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: '13px',
                      fontWeight: 600,
                    }}
                  >
                    {currentIndex + 1}
                  </div>
                  <span style={{ fontSize: '14px', color: '#64748b' }}>
                    {currentQuestion?.category || labels.questionFallback}
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
                  {currentQuestion?.question || labels.questionLoading}
                </h2>

                {currentQuestion?.estimated_answer_time && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '14px' }}>
                    <Clock size={16} />
                    {labels.recommendedTime}: ca. {Math.round(currentQuestion.estimated_answer_time / 60)} Min
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Full Width Tips Section */}
          {currentQuestion?.tips && currentQuestion.tips.length > 0 && (
            <QuestionTips tips={currentQuestion.tips} primaryAccent={primaryAccent} tipsLabel={labels.tipsLabel} branding={b} />
          )}
        </div>
      )}

      {/* Device Settings Dialog */}
      <DeviceSettingsDialog
        isOpen={showDeviceSettings}
        onClose={() => setShowDeviceSettings(false)}
        mode="audio"
        selectedMicrophoneId={selectedMicrophoneId}
        onMicrophoneChange={setSelectedMicrophoneId}
      />
    </div>
  );
};

export default SimulatorSession;
