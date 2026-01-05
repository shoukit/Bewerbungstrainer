import React, { useState, useCallback, useEffect, useMemo } from 'react';
import SimulatorDashboard from './SimulatorDashboard';
import SimulatorPreparationPage from './SimulatorPreparationPage';
import SimulatorVariablesPage from './SimulatorVariablesPage';
import SimulatorSession from './SimulatorSession';
import SessionComplete from './SessionComplete';

/**
 * View states for the simulator flow
 */
const VIEWS = {
  DASHBOARD: 'dashboard',
  PREPARATION: 'preparation',  // NEW: Description + Device Setup first
  VARIABLES: 'variables',      // Now comes AFTER preparation
  SESSION: 'session',
  COMPLETE: 'complete',
};

/**
 * Simulator App - Main Component
 *
 * Coordinates the flow between:
 * 1. Dashboard (scenario selection)
 * 2. Preparation (description + device setup) - NEW ORDER
 * 3. Variables (variable input - if scenario has variables) - AFTER preparation
 * 4. Session (training with Q&A)
 * 5. Complete (summary)
 */
const SimulatorApp = ({
  isAuthenticated,
  requireAuth,
  setPendingAction,
  pendingContinueSession,
  clearPendingContinueSession,
  pendingRepeatSession,
  clearPendingRepeatSession,
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

  // Track pending scenario for after login (internal state or from external prop)
  const [pendingScenario, setPendingScenario] = useState(null);

  // Handle external pending scenario from KI-Coach navigation
  useEffect(() => {
    if (externalPendingScenario && isAuthenticated) {
      setPendingScenario(externalPendingScenario);
      clearPendingScenario?.();
    }
  }, [externalPendingScenario, isAuthenticated, clearPendingScenario]);

  // Track which question to start from when continuing
  const [startFromQuestion, setStartFromQuestion] = useState(0);

  // Track if we should skip the PreSessionView in SimulatorSession
  // (when coming from the new PREPARATION flow)
  const [skipPreSession, setSkipPreSession] = useState(false);

  // Check if scenario has variables that need user input
  const scenarioHasVariables = useMemo(() => {
    if (!selectedScenario?.input_configuration) return false;

    try {
      const config = typeof selectedScenario.input_configuration === 'string'
        ? JSON.parse(selectedScenario.input_configuration)
        : selectedScenario.input_configuration;

      if (!Array.isArray(config)) return false;

      // Check if there are any fields that require user input
      return config.filter(field => field.user_input !== false).length > 0;
    } catch (e) {
      return false;
    }
  }, [selectedScenario?.input_configuration]);

  // Handle pending scenario after login - automatically open preparation page
  useEffect(() => {
    const loadAndSelectScenario = async () => {
      if (pendingScenario && isAuthenticated) {
        let scenarioToSelect = pendingScenario;

        // If we only have an ID (no title), fetch the full scenario from API
        if (pendingScenario.id && !pendingScenario.title) {
          try {
            const baseUrl = window.bewerbungstrainerData?.restUrl || '/wp-json/bewerbungstrainer/v1';
            const response = await fetch(`${baseUrl}/simulator/scenarios/${pendingScenario.id}`);

            if (response.ok) {
              scenarioToSelect = await response.json();
              console.log('[SimulatorApp] Fetched scenario:', scenarioToSelect.title);
            } else {
              console.error('[SimulatorApp] Failed to fetch scenario:', response.status);
              setPendingScenario(null);
              return;
            }
          } catch (error) {
            console.error('[SimulatorApp] Error fetching scenario:', error);
            setPendingScenario(null);
            return;
          }
        }

        setSelectedScenario(scenarioToSelect);
        setCurrentView(VIEWS.PREPARATION);  // Go to preparation first
        setPendingScenario(null);
      }
    };

    loadAndSelectScenario();
  }, [pendingScenario, isAuthenticated]);

  // Handle pending continue session - resume existing session (go directly to session)
  useEffect(() => {
    if (pendingContinueSession && isAuthenticated) {
      const { session, scenario } = pendingContinueSession;

      // Parse questions from the session (API returns 'questions', database stores 'questions_json')
      const questionsData = session.questions || session.questions_json;
      const sessionQuestions = typeof questionsData === 'string'
        ? JSON.parse(questionsData)
        : questionsData || [];

      // Find the first unanswered question
      const answeredCount = session.completed_questions || session.answered_count || 0;

      setSelectedScenario(scenario || { id: session.scenario_id, title: session.scenario_title });
      setActiveSession(session);
      setQuestions(sessionQuestions);
      setVariables({}); // Variables not stored in session, but not needed for continuation
      setStartFromQuestion(answeredCount);
      setSkipPreSession(true);  // Skip preparation when continuing
      setCurrentView(VIEWS.SESSION);

      if (clearPendingContinueSession) {
        clearPendingContinueSession();
      }
    }
  }, [pendingContinueSession, isAuthenticated, clearPendingContinueSession]);

  // Handle pending repeat session - new session with same questions (go to preparation)
  useEffect(() => {
    if (pendingRepeatSession && isAuthenticated) {
      const { session, scenario } = pendingRepeatSession;

      // Parse questions from the session (API returns 'questions', database stores 'questions_json')
      const questionsData = session.questions || session.questions_json;
      const sessionQuestions = typeof questionsData === 'string'
        ? JSON.parse(questionsData)
        : questionsData || [];

      setSelectedScenario(scenario || { id: session.scenario_id, title: session.scenario_title });
      setQuestions(sessionQuestions);
      setVariables({});
      setStartFromQuestion(0);
      // For repeat, start from preparation
      setCurrentView(VIEWS.PREPARATION);

      if (clearPendingRepeatSession) {
        clearPendingRepeatSession();
      }
    }
  }, [pendingRepeatSession, isAuthenticated, clearPendingRepeatSession]);

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
    setStartFromQuestion(0);
    setSelectedMicrophoneId(null);
    setSkipPreSession(false);
    setCurrentView(VIEWS.DASHBOARD);
  }, []);

  /**
   * Handle preparation complete - go to variables (if needed) or session
   */
  const handlePreparationNext = useCallback((deviceData) => {
    setSelectedMicrophoneId(deviceData.selectedMicrophoneId);

    // Check if scenario has variables - if yes, go to variables page
    if (selectedScenario?.input_configuration) {
      const config = typeof selectedScenario.input_configuration === 'string'
        ? JSON.parse(selectedScenario.input_configuration)
        : selectedScenario.input_configuration;

      if (Array.isArray(config)) {
        const hasUserInputFields = config.filter(field => field.user_input !== false).length > 0;

        if (hasUserInputFields) {
          setCurrentView(VIEWS.VARIABLES);
          return;
        }
      }
    }

    // No variables needed - start session directly
    setSkipPreSession(true);
    setCurrentView(VIEWS.SESSION);
  }, [selectedScenario]);

  /**
   * Handle back from variables to preparation
   */
  const handleBackToPreparation = useCallback(() => {
    setCurrentView(VIEWS.PREPARATION);
  }, []);

  /**
   * Handle variables submitted - go to session
   */
  const handleVariablesNext = useCallback((collectedVariables) => {
    setVariables(collectedVariables);
    setSkipPreSession(true);  // Skip PreSessionView since we already did preparation
    setCurrentView(VIEWS.SESSION);
  }, []);

  /**
   * Handle session created in SimulatorSession
   */
  const handleSessionCreated = useCallback((data) => {
    setActiveSession(data.session);
    setQuestions(data.questions);
    if (data.selectedMicrophoneId) {
      setSelectedMicrophoneId(data.selectedMicrophoneId);
    }
  }, []);

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
    setStartFromQuestion(0);
    setSelectedMicrophoneId(null);
    setSkipPreSession(false);
    setCurrentView(VIEWS.PREPARATION);  // Start from preparation again
  }, []);

  /**
   * Render the current view
   */
  const renderView = () => {
    switch (currentView) {
      case VIEWS.DASHBOARD:
        return (
          <SimulatorDashboard
            onSelectScenario={handleSelectScenario}
            isAuthenticated={isAuthenticated}
            requireAuth={requireAuth}
            setPendingScenario={setPendingScenario}
            onNavigateToHistory={onNavigateToHistory}
          />
        );

      case VIEWS.PREPARATION:
        return (
          <SimulatorPreparationPage
            scenario={selectedScenario}
            onBack={handleBackToDashboard}
            onNext={handlePreparationNext}
            hasVariables={scenarioHasVariables}
          />
        );

      case VIEWS.VARIABLES:
        return (
          <SimulatorVariablesPage
            scenario={selectedScenario}
            onBack={handleBackToPreparation}
            onNext={handleVariablesNext}
          />
        );

      case VIEWS.SESSION:
        return (
          <SimulatorSession
            session={activeSession}
            questions={questions}
            scenario={selectedScenario}
            variables={variables}
            preloadedQuestions={questions.length > 0 ? questions : null}
            onSessionCreated={handleSessionCreated}
            onComplete={handleSessionComplete}
            onExit={handleSessionExit}
            startFromQuestion={startFromQuestion}
            initialMicrophoneId={selectedMicrophoneId}
            skipPreSession={skipPreSession}
          />
        );

      case VIEWS.COMPLETE:
        return (
          <SessionComplete
            session={completedSession}
            scenario={selectedScenario}
            onBackToDashboard={handleBackToDashboard}
            onStartNew={handleStartNew}
          />
        );

      default:
        return (
          <SimulatorDashboard
            onSelectScenario={handleSelectScenario}
            isAuthenticated={isAuthenticated}
            requireAuth={requireAuth}
            setPendingScenario={setPendingScenario}
            onNavigateToHistory={onNavigateToHistory}
          />
        );
    }
  };

  return (
    <div className="min-h-full">
      {renderView()}
    </div>
  );
};

export default SimulatorApp;
