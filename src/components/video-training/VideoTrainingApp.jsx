import React, { useState, useCallback, useEffect } from 'react';
import VideoTrainingDashboard from './VideoTrainingDashboard';
import VideoTrainingWizard from './VideoTrainingWizard';
import VideoTrainingSession from './VideoTrainingSession';
import VideoTrainingComplete from './VideoTrainingComplete';

/**
 * View states for the video training flow
 */
const VIEWS = {
  DASHBOARD: 'dashboard',
  WIZARD: 'wizard',
  SESSION: 'session',
  COMPLETE: 'complete',
};

/**
 * VideoTrainingApp - Main Component
 *
 * Coordinates the flow between:
 * 1. Dashboard (scenario selection)
 * 2. Wizard (variable input)
 * 3. Session (video recording)
 * 4. Complete (results)
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

  // Track pending scenario for after login (internal state for dashboard flow)
  const [internalPendingScenario, setInternalPendingScenario] = useState(null);

  // Handle external pending scenario from App.jsx (after login redirect)
  useEffect(() => {
    if (externalPendingScenario && isAuthenticated) {
      console.log('[VIDEO TRAINING] Processing external pending scenario after login:', externalPendingScenario.title);
      setSelectedScenario(externalPendingScenario);
      setCurrentView(VIEWS.WIZARD);
      if (clearPendingScenario) {
        clearPendingScenario();
      }
    }
  }, [externalPendingScenario, isAuthenticated, clearPendingScenario]);

  // Handle internal pending scenario after login - automatically open wizard
  useEffect(() => {
    if (internalPendingScenario && isAuthenticated) {
      console.log('[VIDEO TRAINING] Processing internal pending scenario after login:', internalPendingScenario.title);
      setSelectedScenario(internalPendingScenario);
      setCurrentView(VIEWS.WIZARD);
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
    console.log('[VIDEO TRAINING] Scenario selected:', scenario.title);
    setSelectedScenario(scenario);
    setCurrentView(VIEWS.WIZARD);
  }, []);

  /**
   * Handle back from wizard to dashboard
   */
  const handleBackToDashboard = useCallback(() => {
    console.log('[VIDEO TRAINING] Returning to dashboard');
    setSelectedScenario(null);
    setActiveSession(null);
    setQuestions([]);
    setVariables({});
    setCompletedSession(null);
    setCurrentView(VIEWS.DASHBOARD);
  }, []);

  /**
   * Handle session start from wizard
   */
  const handleStartSession = useCallback((data) => {
    console.log('[VIDEO TRAINING] Starting session with', data.questions.length, 'questions');
    setActiveSession(data.session);
    setQuestions(data.questions);
    setVariables(data.variables);
    setCurrentView(VIEWS.SESSION);
  }, []);

  /**
   * Handle session completion
   */
  const handleSessionComplete = useCallback((data) => {
    console.log('[VIDEO TRAINING] Session completed:', data.session?.id);
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
    console.log('[VIDEO TRAINING] Starting new session with same scenario');
    // Reset session data but keep scenario
    setActiveSession(null);
    setQuestions([]);
    setCompletedSession(null);
    setCurrentView(VIEWS.WIZARD);
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

      case VIEWS.WIZARD:
        return (
          <VideoTrainingWizard
            scenario={selectedScenario}
            onBack={handleBackToDashboard}
            onStart={handleStartSession}
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
    <div style={{ minHeight: '100%' }}>
      {renderView()}
    </div>
  );
};

export default VideoTrainingApp;
