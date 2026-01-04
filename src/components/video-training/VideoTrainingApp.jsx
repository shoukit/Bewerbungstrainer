import React, { useState, useCallback, useEffect, useMemo } from 'react';
import VideoTrainingDashboard from './VideoTrainingDashboard';
import VideoTrainingPreparationPage from './VideoTrainingPreparationPage';
import VideoTrainingVariablesPage from './VideoTrainingVariablesPage';
import VideoTrainingSession from './VideoTrainingSession';
import VideoTrainingComplete from './VideoTrainingComplete';
import FullscreenLoader from '@/components/ui/composite/fullscreen-loader';
import { ErrorToast } from '@/components/ui/composite/StatusBanner';
import { getWPNonce, getWPApiUrl } from '@/services/wordpress-api';
import { usePartner } from '@/context/PartnerContext';

/**
 * View states for the video training flow
 */
const VIEWS = {
  DASHBOARD: 'dashboard',
  PREPARATION: 'preparation',  // NEW: Description + Device Setup first
  VARIABLES: 'variables',      // Now comes AFTER preparation
  SESSION: 'session',
  COMPLETE: 'complete',
};

/**
 * VideoTrainingApp - Main Component
 *
 * Coordinates the flow between:
 * 1. Dashboard (scenario selection)
 * 2. Preparation (description + device setup) - NEW ORDER
 * 3. Variables (variable input - if scenario has variables) - AFTER preparation
 * 4. Session (video recording)
 * 5. Complete (results)
 */
const VideoTrainingApp = ({
  isAuthenticated,
  requireAuth,
  setPendingAction,
  pendingScenario: externalPendingScenario,
  clearPendingScenario,
  onNavigateToHistory,
}) => {
  const [currentView, setCurrentView] = useState(VIEWS.DASHBOARD);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [variables, setVariables] = useState({});
  const [completedSession, setCompletedSession] = useState(null);
  const [selectedMicrophoneId, setSelectedMicrophoneId] = useState(null);
  const [selectedCameraId, setSelectedCameraId] = useState(null);

  // Session creation state
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [sessionError, setSessionError] = useState(null);

  // Track pending scenario for after login (internal state for dashboard flow)
  const [internalPendingScenario, setInternalPendingScenario] = useState(null);

  const { demoCode } = usePartner();

  // Check if scenario has variables that need user input
  const scenarioHasVariables = useMemo(() => {
    if (!selectedScenario?.input_configuration) return false;

    try {
      const config = Array.isArray(selectedScenario.input_configuration)
        ? selectedScenario.input_configuration
        : [];

      // Check if there are any fields that require user input
      return config.filter(field => field.user_input !== false).length > 0;
    } catch (e) {
      return false;
    }
  }, [selectedScenario?.input_configuration]);

  // Handle external pending scenario from App.jsx (after login redirect)
  useEffect(() => {
    if (externalPendingScenario && isAuthenticated) {
      setSelectedScenario(externalPendingScenario);
      setCurrentView(VIEWS.PREPARATION);  // Go to preparation first
      if (clearPendingScenario) {
        clearPendingScenario();
      }
    }
  }, [externalPendingScenario, isAuthenticated, clearPendingScenario]);

  // Handle internal pending scenario after login - automatically open preparation page
  useEffect(() => {
    if (internalPendingScenario && isAuthenticated) {
      setSelectedScenario(internalPendingScenario);
      setCurrentView(VIEWS.PREPARATION);  // Go to preparation first
      setInternalPendingScenario(null);
    }
  }, [internalPendingScenario, isAuthenticated]);

  // Scroll to top on every view change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentView]);

  /**
   * Handle scenario selection from dashboard
   */
  const handleSelectScenario = useCallback((scenario) => {
    setSelectedScenario(scenario);
    setCurrentView(VIEWS.PREPARATION);  // Go to preparation first (NEW)
  }, []);

  /**
   * Handle back from preparation to dashboard
   */
  const handleBackToDashboard = useCallback(() => {
    setSelectedScenario(null);
    setActiveSession(null);
    setQuestions([]);
    setVariables({});
    setCompletedSession(null);
    setSelectedMicrophoneId(null);
    setSelectedCameraId(null);
    setSessionError(null);
    setCurrentView(VIEWS.DASHBOARD);
  }, []);

  /**
   * Handle preparation complete - go to variables (if needed) or start session
   */
  const handlePreparationNext = useCallback((deviceData) => {
    setSelectedMicrophoneId(deviceData.selectedMicrophoneId);
    setSelectedCameraId(deviceData.selectedCameraId);

    // Check if scenario has variables - if yes, go to variables page
    // If no, directly start the session
    if (selectedScenario?.input_configuration) {
      const config = Array.isArray(selectedScenario.input_configuration)
        ? selectedScenario.input_configuration
        : [];

      const hasUserInputFields = config.filter(field => field.user_input !== false).length > 0;

      if (hasUserInputFields) {
        setCurrentView(VIEWS.VARIABLES);
        return;
      }
    }

    // No variables needed - start session directly
    startSession({}, deviceData.selectedMicrophoneId, deviceData.selectedCameraId);
  }, [selectedScenario]);

  /**
   * Handle back from variables to preparation
   */
  const handleBackToPreparation = useCallback(() => {
    setCurrentView(VIEWS.PREPARATION);
  }, []);

  /**
   * Handle variables submitted - start session
   */
  const handleVariablesNext = useCallback((collectedVariables) => {
    setVariables(collectedVariables);
    startSession(collectedVariables, selectedMicrophoneId, selectedCameraId);
  }, [selectedMicrophoneId, selectedCameraId]);

  /**
   * Start the session (create session + generate questions)
   */
  const startSession = async (vars, micId, camId) => {
    setIsCreatingSession(true);
    setSessionError(null);

    try {
      const apiUrl = getWPApiUrl();

      // 1. Create session
      const createResponse = await fetch(`${apiUrl}/video-training/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': getWPNonce(),
        },
        body: JSON.stringify({
          scenario_id: selectedScenario.id,
          variables: vars,
          demo_code: demoCode || null,
        }),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json().catch(() => ({}));
        throw new Error(errorData.message || 'Fehler beim Erstellen der Session');
      }

      const createData = await createResponse.json();
      const session = createData.data?.session || createData.session;

      if (!session) {
        throw new Error('Keine Session-ID erhalten');
      }

      // 2. Generate questions
      const questionsResponse = await fetch(`${apiUrl}/video-training/sessions/${session.id}/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': getWPNonce(),
        },
        body: JSON.stringify({ variables: vars }),
      });

      if (!questionsResponse.ok) {
        const errorData = await questionsResponse.json().catch(() => ({}));
        throw new Error(errorData.message || 'Fehler beim Generieren der Fragen');
      }

      const questionsData = await questionsResponse.json();
      const generatedQuestions = questionsData.data?.questions || questionsData.questions || [];

      // 3. Start session
      setActiveSession({ ...session, questions: generatedQuestions });
      setQuestions(generatedQuestions);
      setVariables(vars);
      setSelectedMicrophoneId(micId);
      setSelectedCameraId(camId);
      setCurrentView(VIEWS.SESSION);

    } catch (error) {
      console.error('Error starting session:', error);
      setSessionError(error.message);
    } finally {
      setIsCreatingSession(false);
    }
  };

  /**
   * Handle session completion
   */
  const handleSessionComplete = useCallback((data) => {
    setCompletedSession(data.session);
    setCurrentView(VIEWS.COMPLETE);
  }, []);

  /**
   * Handle session exit (back to dashboard)
   */
  const handleSessionExit = useCallback(() => {
    handleBackToDashboard();
  }, [handleBackToDashboard]);

  /**
   * Handle starting a new session with same scenario
   */
  const handleStartNew = useCallback(() => {
    // Reset session data but keep scenario
    setActiveSession(null);
    setQuestions([]);
    setCompletedSession(null);
    setSelectedMicrophoneId(null);
    setSelectedCameraId(null);
    setSessionError(null);
    setCurrentView(VIEWS.PREPARATION);  // Start from preparation again
  }, []);

  /**
   * Render the current view
   */
  const renderView = () => {
    switch (currentView) {
      case VIEWS.DASHBOARD:
        return (
          <VideoTrainingDashboard
            onSelectScenario={handleSelectScenario}
            isAuthenticated={isAuthenticated}
            requireAuth={requireAuth}
            setPendingScenario={setInternalPendingScenario}
            onNavigateToHistory={onNavigateToHistory}
          />
        );

      case VIEWS.PREPARATION:
        return (
          <VideoTrainingPreparationPage
            scenario={selectedScenario}
            onBack={handleBackToDashboard}
            onNext={handlePreparationNext}
            hasVariables={scenarioHasVariables}
          />
        );

      case VIEWS.VARIABLES:
        return (
          <VideoTrainingVariablesPage
            scenario={selectedScenario}
            onBack={handleBackToPreparation}
            onNext={handleVariablesNext}
          />
        );

      case VIEWS.SESSION:
        return (
          <VideoTrainingSession
            session={activeSession}
            questions={questions}
            scenario={selectedScenario}
            variables={variables}
            onComplete={handleSessionComplete}
            onExit={handleSessionExit}
            selectedMicrophoneId={selectedMicrophoneId}
            selectedCameraId={selectedCameraId}
          />
        );

      case VIEWS.COMPLETE:
        return (
          <VideoTrainingComplete
            session={completedSession}
            scenario={selectedScenario}
            onBackToDashboard={handleBackToDashboard}
            onStartNew={handleStartNew}
          />
        );

      default:
        return (
          <VideoTrainingDashboard
            onSelectScenario={handleSelectScenario}
            isAuthenticated={isAuthenticated}
            requireAuth={requireAuth}
            setPendingScenario={setInternalPendingScenario}
            onNavigateToHistory={onNavigateToHistory}
          />
        );
    }
  };

  return (
    <div className="min-h-full">
      {renderView()}

      {/* Error Display */}
      {sessionError && (
        <ErrorToast
          message={sessionError}
          onDismiss={() => setSessionError(null)}
        />
      )}

      {/* Fullscreen Loading Overlay */}
      <FullscreenLoader
        isLoading={isCreatingSession}
        message="Fragen werden generiert..."
        subMessage="Die KI erstellt personalisierte Fragen basierend auf deinen Angaben."
      />
    </div>
  );
};

export default VideoTrainingApp;
