import React, { useState, useCallback, useEffect } from 'react';
import VideoTrainingDashboard from './VideoTrainingDashboard';
import VideoTrainingVariablesPage from './VideoTrainingVariablesPage';
import VideoTrainingDeviceSetup from './VideoTrainingDeviceSetup';
import VideoTrainingSession from './VideoTrainingSession';
import VideoTrainingComplete from './VideoTrainingComplete';

/**
 * View states for the video training flow
 */
const VIEWS = {
  DASHBOARD: 'dashboard',
  VARIABLES: 'variables',
  DEVICE_SETUP: 'device_setup',
  SESSION: 'session',
  COMPLETE: 'complete',
};

/**
 * VideoTrainingApp - Main Component
 *
 * Coordinates the flow between:
 * 1. Dashboard (scenario selection)
 * 2. Variables (variable input - if scenario has variables)
 * 3. Device Setup (camera and microphone selection)
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

  // Track pending scenario for after login (internal state for dashboard flow)
  const [internalPendingScenario, setInternalPendingScenario] = useState(null);

  // Handle external pending scenario from App.jsx (after login redirect)
  useEffect(() => {
    if (externalPendingScenario && isAuthenticated) {
      setSelectedScenario(externalPendingScenario);
      setCurrentView(VIEWS.VARIABLES);
      if (clearPendingScenario) {
        clearPendingScenario();
      }
    }
  }, [externalPendingScenario, isAuthenticated, clearPendingScenario]);

  // Handle internal pending scenario after login - automatically open variables page
  useEffect(() => {
    if (internalPendingScenario && isAuthenticated) {
      setSelectedScenario(internalPendingScenario);
      setCurrentView(VIEWS.VARIABLES);
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
    setCurrentView(VIEWS.VARIABLES);
  }, []);

  /**
   * Handle back from variables to dashboard
   */
  const handleBackToDashboard = useCallback(() => {
    setSelectedScenario(null);
    setActiveSession(null);
    setQuestions([]);
    setVariables({});
    setCompletedSession(null);
    setSelectedMicrophoneId(null);
    setSelectedCameraId(null);
    setCurrentView(VIEWS.DASHBOARD);
  }, []);

  /**
   * Handle variables submitted - go to device setup
   */
  const handleVariablesNext = useCallback((collectedVariables) => {
    setVariables(collectedVariables);
    setCurrentView(VIEWS.DEVICE_SETUP);
  }, []);

  /**
   * Handle back from device setup to variables
   */
  const handleBackToVariables = useCallback(() => {
    setCurrentView(VIEWS.VARIABLES);
  }, []);

  /**
   * Handle session start from device setup
   */
  const handleStartSession = useCallback((data) => {
    setActiveSession(data.session);
    setQuestions(data.questions);
    setVariables(data.variables);
    setSelectedMicrophoneId(data.selectedMicrophoneId);
    setSelectedCameraId(data.selectedCameraId);
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
    setSelectedMicrophoneId(null);
    setSelectedCameraId(null);
    setCurrentView(VIEWS.VARIABLES);
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

      case VIEWS.VARIABLES:
        return (
          <VideoTrainingVariablesPage
            scenario={selectedScenario}
            onBack={handleBackToDashboard}
            onNext={handleVariablesNext}
          />
        );

      case VIEWS.DEVICE_SETUP:
        return (
          <VideoTrainingDeviceSetup
            scenario={selectedScenario}
            variables={variables}
            onBack={handleBackToVariables}
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
    </div>
  );
};

export default VideoTrainingApp;
