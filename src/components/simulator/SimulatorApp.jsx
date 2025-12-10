import React, { useState, useCallback } from 'react';
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
const SimulatorApp = () => {
  const [currentView, setCurrentView] = useState(VIEWS.DASHBOARD);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [variables, setVariables] = useState({});
  const [completedSession, setCompletedSession] = useState(null);

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
          />
        );

      case VIEWS.WIZARD:
        return (
          <SimulatorWizard
            scenario={selectedScenario}
            onBack={handleBackToDashboard}
            onStart={handleStartSession}
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
