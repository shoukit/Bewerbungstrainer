/**
 * SimulatorSession - Training Session Component
 *
 * Handles the interview/simulation training flow with:
 * - Question display and navigation
 * - Audio recording
 * - Immediate feedback display
 *
 * Migrated to Tailwind CSS + themed components.
 */

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
import { Button, Card } from '@/components/ui';

// Extracted components
import QuestionTips from './QuestionTips';
import SimulatorAudioRecorder from './SimulatorAudioRecorder';
import PreSessionView from './PreSessionView';
import { CompleteConfirmDialog, CancelConfirmDialog } from './ConfirmationDialogs';

/**
 * Question Number Badge - Tailwind styled
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
 * Question Card Component - Tailwind styled
 */
const QuestionCard = ({ question, index, labels, isMobile }) => (
  <Card className={isMobile ? 'p-4' : 'p-6'}>
    <div className="flex items-center gap-2 mb-3 md:mb-4">
      <QuestionBadge number={index + 1} size={isMobile ? 'sm' : 'md'} />
      <span className="text-[13px] md:text-sm text-slate-500">
        {question?.category || labels.questionFallback}
      </span>
    </div>

    <h2 className={`font-semibold text-slate-900 leading-relaxed ${isMobile ? 'text-[15px]' : 'text-lg'} mb-0`}>
      {question?.question || labels.questionLoading}
    </h2>

    {question?.estimated_answer_time && (
      <div className="flex items-center gap-1.5 text-slate-500 text-[13px] md:text-sm mt-3 md:mt-4">
        <Clock size={isMobile ? 14 : 16} />
        {labels.recommendedTime}: ca. {Math.round(question.estimated_answer_time / 60)} Min
      </div>
    )}
  </Card>
);

/**
 * Error State Component - Tailwind styled
 */
const ErrorState = ({ error, onRetry, isMobile }) => (
  <div className={`flex flex-col items-center ${isMobile ? 'p-4' : 'p-5 mt-4'} rounded-xl bg-red-50`}>
    <AlertCircle className="w-6 h-6 text-red-500" />
    <p className="mt-2 text-red-500 font-medium text-sm text-center">
      {error}
    </p>
    <Button variant="danger" size="sm" onClick={onRetry} className="mt-3">
      Erneut versuchen
    </Button>
  </div>
);

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

  const { demoCode, branding } = usePartner();

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
              setPreloadedNextQuestion(nextQuestion);
              if (isRetryAttempt) {
                setQuestions(prev => {
                  const updated = [...prev];
                  updated[currentIndex + 1] = nextQuestion;
                  return updated.slice(0, currentIndex + 2);
                });
              } else {
                setQuestions(prev => [...prev, nextQuestion]);
              }
              setIsConversationFinished(true);
            } else {
              setPreloadedNextQuestion(nextQuestion);
              if (isRetryAttempt) {
                setQuestions(prev => {
                  const updated = [...prev];
                  updated[currentIndex + 1] = nextQuestion;
                  return updated.slice(0, currentIndex + 2);
                });
                setIsConversationFinished(false);
              } else {
                setQuestions(prev => [...prev, nextQuestion]);
              }
            }
          }
        } catch (nextTurnErr) {
          console.error('Error generating next turn:', nextTurnErr);
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
      if (preloadedNextQuestion) {
        setCurrentIndex(prev => prev + 1);
        setPreloadedNextQuestion(null);
        return;
      }

      if (isConversationFinished) {
        handleCompleteSession();
        return;
      }
    } else {
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

  const handleCompleteClick = () => {
    setShowCompleteConfirm(true);
  };

  const handleCompleteSession = async () => {
    setShowCompleteConfirm(false);
    setShowDeviceSettings(false);
    setShowMicrophoneTest(false);
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

  const handleCancelClick = () => {
    setShowCancelConfirm(true);
  };

  const handleCancelSession = () => {
    setShowCancelConfirm(false);
    setShowDeviceSettings(false);
    setShowMicrophoneTest(false);
    cleanupMediaStream();
    onExit();
  };

  const handleStartInterview = async () => {
    if (session && questions.length > 0) {
      setPhase('interview');
      return;
    }

    setIsCreatingSession(true);
    setSessionCreateError(null);

    try {
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

      setSession({ ...newSession, questions_json: newQuestions });
      setQuestions(newQuestions);

      if (onSessionCreated) {
        onSessionCreated({
          session: { ...newSession, questions_json: newQuestions },
          questions: newQuestions,
          selectedMicrophoneId: selectedMicrophoneId,
        });
      }

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
          themedGradient={branding?.['--button-gradient'] || branding?.['--header-gradient']}
          primaryAccent={branding?.['--primary-accent']}
          primaryAccentLight={branding?.['--primary-accent-light']}
          isLoading={isCreatingSession}
        />
        <MicrophoneTestDialog
          isOpen={showMicrophoneTest}
          onClose={() => setShowMicrophoneTest(false)}
          deviceId={selectedMicrophoneId}
        />

        {/* Error Display */}
        {sessionCreateError && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium shadow-lg z-[100]">
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

  // Check if training is complete (for hiding "Beenden" button)
  const isTrainingComplete = showFeedback && (
    (isSimulation && isConversationFinished && !preloadedNextQuestion) ||
    (!isSimulation && isLastQuestion)
  );

  return (
    <div className={`${isMobile ? 'p-4' : 'p-6'} max-w-[1000px] mx-auto`}>
      {/* Header */}
      <div className={`flex ${isMobile ? 'flex-col gap-3' : 'flex-row justify-between items-center'} mb-6`}>
        <h1 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold text-slate-900`}>
          {scenario?.title}
        </h1>
        <div className={`flex gap-2 items-center ${isMobile ? 'justify-between' : 'justify-end'}`}>
          {/* Training beenden - hide when training is truly complete */}
          {!isTrainingComplete && (
            <button
              onClick={handleCompleteClick}
              className={`${isMobile ? 'flex-1 py-2.5 px-3.5' : 'py-2 px-4'} rounded-lg bg-green-500 text-white text-sm font-semibold flex items-center justify-center gap-1.5 shadow-md hover:bg-green-600 transition-colors`}
            >
              <Check size={16} />
              {isMobile ? 'Beenden' : 'Training beenden'}
            </button>
          )}
          <button
            onClick={handleCancelClick}
            className={`${isMobile ? 'flex-1 py-2.5 px-3.5' : 'py-2 px-4'} rounded-lg bg-slate-100 text-slate-500 text-sm flex items-center justify-center gap-1.5 hover:bg-slate-200 transition-colors`}
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
        <div className={`flex ${isMobile ? 'gap-2' : 'gap-3'} justify-center mb-4`}>
          <Button
            variant="secondary"
            size={isMobile ? 'sm' : 'md'}
            icon={<ChevronLeft size={16} />}
            onClick={handlePrev}
            disabled={isFirstQuestion}
            className={isMobile ? 'flex-1' : ''}
          >
            Zurück
          </Button>
          <Button
            variant="secondary"
            size={isMobile ? 'sm' : 'md'}
            iconPosition="right"
            icon={<ChevronRight size={16} />}
            onClick={handleNext}
            disabled={isLastQuestion}
            className={isMobile ? 'flex-1' : ''}
          >
            {isMobile ? 'Überspringen' : 'Frage überspringen'}
          </Button>
        </div>
      )}

      {/* Progress */}
      <ProgressBar
        current={currentIndex}
        total={questions.length}
        answeredQuestions={answeredQuestions}
        primaryAccent={branding?.['--primary-accent']}
        labels={labels}
      />

      {/* Main Content */}
      {showFeedback ? (
        /* Single Column Layout for Feedback View */
        <div className="max-w-[800px] mx-auto">
          {/* Action Buttons */}
          <div className="flex gap-3 mb-4 justify-end">
            {/* Retry button */}
            {scenario.allow_retry && (
              <Button variant="secondary" icon={<RotateCcw size={16} />} onClick={handleRetry}>
                Nochmal versuchen
              </Button>
            )}
            <Button
              onClick={
                isSimulation
                  ? ((isConversationFinished && !preloadedNextQuestion) ? handleCompleteSession : handleNext)
                  : (isLastQuestion ? handleCompleteSession : handleNext)
              }
              disabled={isSimulation && isLoadingNextTurn && !isConversationFinished}
              icon={isLoadingNextTurn ? <Loader2 size={16} className="animate-spin" /> : null}
              iconPosition="left"
            >
              {isSimulation && isLoadingNextTurn && !isConversationFinished ? (
                'Gesprächspartner tippt...'
              ) : (isSimulation ? (
                (isConversationFinished && !preloadedNextQuestion) ? 'Training abschließen' : labels.nextButton
              ) : (
                isLastQuestion ? 'Training abschließen' : labels.nextButton
              ))}
              {!isLoadingNextTurn && !(isSimulation ? (isConversationFinished && !preloadedNextQuestion) : isLastQuestion) && (
                <ChevronRight size={16} className="ml-1" />
              )}
            </Button>
          </div>

          {/* Question Card */}
          <QuestionCard
            question={currentQuestion}
            index={currentIndex}
            labels={labels}
            isMobile={isMobile}
          />

          {/* Feedback Content */}
          <div className="mt-4">
            <ImmediateFeedback
              transcript={feedback.transcript}
              feedback={feedback.feedback}
              audioMetrics={feedback.audio_analysis}
              audioUrl={feedback.audio_url}
              hideButtons={true}
            />
          </div>
        </div>
      ) : (
        /* Recording View Layout */
        <div className={`flex flex-col ${isMobile ? 'gap-4' : 'gap-6'}`}>
          {isMobile ? (
            /* Mobile Layout - Stacked vertically */
            <>
              {/* Question Card - Mobile */}
              <QuestionCard
                question={currentQuestion}
                index={currentIndex}
                labels={labels}
                isMobile={true}
              />

              {/* Recording Area - Mobile */}
              <SimulatorAudioRecorder
                onRecordingComplete={handleRecordingComplete}
                timeLimit={scenario.time_limit_per_question || 120}
                disabled={false}
                deviceId={selectedMicrophoneId}
                themedGradient={branding?.['--button-gradient'] || branding?.['--header-gradient']}
                primaryAccent={branding?.['--primary-accent']}
                isSubmitting={isSubmitting}
                labels={labels}
                onOpenSettings={() => setShowDeviceSettings(true)}
                isMobile={true}
                onStreamChange={handleStreamChange}
              />

              {/* Error State - Mobile */}
              {submitError && (
                <ErrorState error={submitError} onRetry={handleRetry} isMobile={true} />
              )}
            </>
          ) : (
            /* Desktop Layout - Two Column Grid */
            <div className="grid grid-cols-2 gap-6">
              {/* Left Column - Recording */}
              <div>
                <SimulatorAudioRecorder
                  onRecordingComplete={handleRecordingComplete}
                  timeLimit={scenario.time_limit_per_question || 120}
                  disabled={false}
                  deviceId={selectedMicrophoneId}
                  themedGradient={branding?.['--button-gradient'] || branding?.['--header-gradient']}
                  primaryAccent={branding?.['--primary-accent']}
                  isSubmitting={isSubmitting}
                  labels={labels}
                  onOpenSettings={() => setShowDeviceSettings(true)}
                  isMobile={false}
                  onStreamChange={handleStreamChange}
                />

                {/* Error State */}
                {submitError && (
                  <ErrorState error={submitError} onRetry={handleRetry} isMobile={false} />
                )}
              </div>

              {/* Right Column - Question */}
              <QuestionCard
                question={currentQuestion}
                index={currentIndex}
                labels={labels}
                isMobile={false}
              />
            </div>
          )}

          {/* Full Width Tips Section */}
          {currentQuestion?.tips && currentQuestion.tips.length > 0 && (
            <QuestionTips
              tips={currentQuestion.tips}
              primaryAccent={branding?.['--primary-accent']}
              tipsLabel={labels.tipsLabel}
            />
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
