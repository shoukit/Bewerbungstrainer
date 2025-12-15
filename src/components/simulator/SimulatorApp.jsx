import React, { useState, useCallback, useEffect } from 'react';
import SimulatorDashboard from './SimulatorDashboard';
import SimulatorWizard from './SimulatorWizard';
import SimulatorSession from './SimulatorSession';
import SessionComplete from './SessionComplete';

/**
 * View states for the simulator flow
 */
const VIEWS = {
  DASHBOARD: 'dashboard',
  WIZARD: 'wizard',
  SESSION: 'session',
  COMPLETE: 'complete',
};

/**
 * Simulator App - Main Component
 *
 * Coordinates the flow between:
 * 1. Dashboard (scenario selection)
 * 2. Wizard (variable input)
 * 3. Session (training with Q&A)
 * 4. Complete (summary)
 */
const SimulatorApp = ({
  isAuthenticated,
  requireAuth,
  setPendingAction,
  pendingContinueSession,
  clearPendingContinueSession,
  pendingRepeatSession,
  clearPendingRepeatSession,
  onNavigateToHistory,
}) => {
  const [currentView, setCurrentView] = useState(VIEWS.DASHBOARD);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [variables, setVariables] = useState({});
  const [completedSession, setCompletedSession] = useState(null);

  // Track pending scenario for after login
  const [pendingScenario, setPendingScenario] = useState(null);

  // Track which question to start from when continuing
  const [startFromQuestion, setStartFromQuestion] = useState(0);

  // Handle pending scenario after login - automatically open wizard
  useEffect(() => {
    if (pendingScenario && isAuthenticated) {
      console.log('🔐 [SimulatorApp] Processing pending scenario after login:', pendingScenario.title);
      setSelectedScenario(pendingScenario);
      setCurrentView(VIEWS.WIZARD);
      setPendingScenario(null);
    }
  }, [pendingScenario, isAuthenticated]);

  // Handle pending continue session - resume existing session
  useEffect(() => {
    if (pendingContinueSession && isAuthenticated) {
      const { session, scenario } = pendingContinueSession;
      console.log('🔄 [SimulatorApp] Continuing session:', session.id);

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
      setCurrentView(VIEWS.SESSION);

      if (clearPendingContinueSession) {
        clearPendingContinueSession();
      }
    }
  }, [pendingContinueSession, isAuthenticated, clearPendingContinueSession]);

  // Handle pending repeat session - new session with same questions
  useEffect(() => {
    if (pendingRepeatSession && isAuthenticated) {
      const { session, scenario } = pendingRepeatSession;
      console.log('🔁 [SimulatorApp] Repeating session with same questions:', session.id);

      // Parse questions from the session (API returns 'questions', database stores 'questions_json')
      const questionsData = session.questions || session.questions_json;
      const sessionQuestions = typeof questionsData === 'string'
        ? JSON.parse(questionsData)
        : questionsData || [];

      setSelectedScenario(scenario || { id: session.scenario_id, title: session.scenario_title });
      setQuestions(sessionQuestions);
      setVariables({});
      setStartFromQuestion(0);
      // Go to wizard to create a new session with pre-loaded questions
      setCurrentView(VIEWS.WIZARD);

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
    setCurrentView(VIEWS.WIZARD);
  }, []);

  /**
   * Handle back from wizard to dashboard
   */
  const handleBackToDashboard = useCallback(() => {
    setSelectedScenario(null);
    setActiveSession(null);
    setQuestions([]);
    setVariables({});
    setCompletedSession(null);
    setStartFromQuestion(0);
    setCurrentView(VIEWS.DASHBOARD);
  }, []);

  /**
   * Handle session start from wizard
   */
  const handleStartSession = useCallback((data) => {
    setActiveSession(data.session);
    setQuestions(data.questions);
    setVariables(data.variables);
    setCurrentView(VIEWS.SESSION);
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
    setCurrentView(VIEWS.WIZARD);
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

      case VIEWS.WIZARD:
        return (
          <SimulatorWizard
            scenario={selectedScenario}
            onBack={handleBackToDashboard}
            onStart={handleStartSession}
            preloadedQuestions={questions.length > 0 ? questions : null}
          />
        );

      case VIEWS.SESSION:
        return (
          <SimulatorSession
            session={activeSession}
            questions={questions}
            scenario={selectedScenario}
            variables={variables}
            onComplete={handleSessionComplete}
            onExit={handleSessionExit}
            startFromQuestion={startFromQuestion}
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
    <div style={{
      minHeight: '100%',
    }}>
      {renderView()}
    </div>
  );
};

export default SimulatorApp;
