import React, { useState, useCallback, useRef } from 'react';
import { Scale } from 'lucide-react';
import DecisionBoardDashboard from './DecisionBoardDashboard';
import DecisionBoardInput from './DecisionBoardInput';
import DecisionBoardResult from './DecisionBoardResult';
import wordpressAPI from '@/services/wordpress-api';
import FeatureAppHeader from '@/components/global/FeatureAppHeader';
import MicrophoneTestDialog from '@/components/device-setup/MicrophoneTestDialog';
import { COLORS, createGradient } from '@/config/colors';
import { useScrollToTop } from '@/hooks';

/**
 * View states for the decision board flow
 */
const VIEWS = {
  DASHBOARD: 'dashboard',
  INPUT: 'input',
  RESULT: 'result',
};

/**
 * DecisionBoard App - Main Component
 *
 * "Der Entscheidungs-Kompass" - AI Decision Support System
 *
 * Coordinates the flow between:
 * 1. Dashboard with feature info and session list (public)
 * 2. Input (decision question + pro/contra with weights) (requires auth)
 * 3. Result (rational score + AI coaching cards)
 */
const DecisionBoardApp = ({
  isAuthenticated,
  requireAuth,
  setPendingAction,
  onNavigateToHistory,
}) => {
  const [currentView, setCurrentView] = useState(VIEWS.DASHBOARD);
  const [decisionData, setDecisionData] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [savedDecisionId, setSavedDecisionId] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Microphone state - managed at app level so it persists across views
  const [selectedMicrophoneId, setSelectedMicrophoneId] = useState(null);
  const [showMicrophoneTest, setShowMicrophoneTest] = useState(false);

  // Track if session was saved to avoid duplicate saves
  const sessionSavedRef = useRef(false);

  // Decision Board feature gradient (teal)
  const decisionGradient = createGradient(COLORS.teal[500], COLORS.teal[400]);

  // Scroll to top hook
  useScrollToTop({ dependencies: [currentView] });

  /**
   * Handle start new from dashboard
   */
  const handleStartNew = useCallback(() => {
    setDecisionData(null);
    setAnalysisResult(null);
    setSavedDecisionId(null);
    sessionSavedRef.current = false;
    setCurrentView(VIEWS.INPUT);
  }, []);

  /**
   * Handle continue existing session from dashboard
   */
  const handleContinueSession = useCallback(async (session) => {
    try {
      // Load session data
      setSavedDecisionId(session.id);
      sessionSavedRef.current = true;

      // Set decision data from session
      const data = {
        topic: session.topic || '',
        context: session.context || '',
        pros: session.pros || [],
        cons: session.cons || [],
        proScore: session.pro_score || 0,
        contraScore: session.contra_score || 0,
      };
      setDecisionData(data);

      // If session has analysis result, show results
      if (session.status === 'completed' && session.analysis) {
        setAnalysisResult(session.analysis);
        setCurrentView(VIEWS.RESULT);
      } else {
        // Otherwise go to input
        setCurrentView(VIEWS.INPUT);
      }
    } catch (err) {
      console.error('[DecisionBoard] Failed to load session:', err);
    }
  }, []);

  /**
   * Handle back to dashboard
   */
  const handleBackToDashboard = useCallback(() => {
    setCurrentView(VIEWS.DASHBOARD);
  }, []);

  /**
   * Save session immediately (called when topic changes)
   */
  const saveSessionDraft = useCallback(async (data) => {
    // Don't save if already saved or no topic
    if (sessionSavedRef.current || !data.topic?.trim()) {
      return null;
    }

    try {
      const saveData = {
        topic: data.topic,
        context: data.context || null,
        pros: data.pros || [],
        cons: data.cons || [],
        pro_score: data.proScore || 0,
        contra_score: data.contraScore || 0,
        status: 'draft',
      };

      const response = await wordpressAPI.createDecision(saveData);

      if (response?.id) {
        sessionSavedRef.current = true;
        setSavedDecisionId(response.id);
        console.log('[DecisionBoard] Draft session saved with ID:', response.id);
        return response.id;
      }
    } catch (err) {
      console.error('[DecisionBoard] Failed to save draft session:', err);
    }
    return null;
  }, []);

  /**
   * Update existing session
   */
  const updateSession = useCallback(async (id, data) => {
    if (!id) return;

    try {
      const updateData = {
        topic: data.topic,
        context: data.context || null,
        pros: data.pros || [],
        cons: data.cons || [],
        pro_score: data.proScore || 0,
        contra_score: data.contraScore || 0,
        analysis: data.analysis || null,
        status: data.status || 'completed',
      };

      await wordpressAPI.updateDecision(id, updateData);
      console.log('[DecisionBoard] Session updated:', id);
    } catch (err) {
      console.error('[DecisionBoard] Failed to update session:', err);
    }
  }, []);

  /**
   * Delete session (for cancel)
   */
  const deleteSession = useCallback(async (id) => {
    if (!id) return;

    try {
      await wordpressAPI.deleteDecision(id);
      console.log('[DecisionBoard] Session deleted:', id);
    } catch (err) {
      console.error('[DecisionBoard] Failed to delete session:', err);
    }
  }, []);

  /**
   * Handle analysis complete - update session with results
   */
  const handleAnalysisComplete = useCallback(async (data, result) => {
    setDecisionData(data);
    setAnalysisResult(result);
    setCurrentView(VIEWS.RESULT);

    // Save or update session with analysis results
    try {
      if (savedDecisionId) {
        // Update existing session
        await updateSession(savedDecisionId, {
          ...data,
          analysis: result,
          status: 'completed',
        });
      } else {
        // Create new session with results
        const saveData = {
          topic: data.topic,
          context: data.context || null,
          pros: data.pros,
          cons: data.cons,
          pro_score: data.proScore,
          contra_score: data.contraScore,
          analysis: result,
          status: 'completed',
        };

        const response = await wordpressAPI.createDecision(saveData);

        if (response?.id) {
          setSavedDecisionId(response.id);
          sessionSavedRef.current = true;
          console.log('[DecisionBoard] Decision saved with ID:', response.id);
        }
      }
    } catch (err) {
      console.error('[DecisionBoard] Failed to save decision:', err);
    }
  }, [savedDecisionId, updateSession]);

  /**
   * Handle edit current decision - go back to input with data preserved
   */
  const handleEditDecision = useCallback(() => {
    // Keep decisionData so it can be edited
    setAnalysisResult(null);
    setCurrentView(VIEWS.INPUT);
  }, []);

  /**
   * Handle cancel - delete draft and go back to dashboard
   */
  const handleCancel = useCallback(async () => {
    // Delete the draft session if it was saved
    if (savedDecisionId) {
      await deleteSession(savedDecisionId);
    }

    // Reset state
    setDecisionData(null);
    setAnalysisResult(null);
    setSavedDecisionId(null);
    sessionSavedRef.current = false;

    // Go back to dashboard
    setCurrentView(VIEWS.DASHBOARD);
  }, [savedDecisionId, deleteSession]);

  /**
   * Render current view
   */
  const renderContent = () => {
    switch (currentView) {
      case VIEWS.DASHBOARD:
        return (
          <DecisionBoardDashboard
            onStartNew={handleStartNew}
            onContinueSession={handleContinueSession}
            onNavigateToHistory={onNavigateToHistory}
            isAuthenticated={isAuthenticated}
            requireAuth={requireAuth}
            setPendingAction={setPendingAction}
            selectedMicrophoneId={selectedMicrophoneId}
            onMicrophoneChange={setSelectedMicrophoneId}
            onTestMicrophone={() => setShowMicrophoneTest(true)}
          />
        );

      case VIEWS.RESULT:
        return (
          <>
            <FeatureAppHeader
              featureId="decisionboard"
              icon={Scale}
              title="Entscheidungs-Board"
              subtitle="Deine Analyse"
              gradient={decisionGradient}
              showBackButton
              onBack={handleBackToDashboard}
            />
            <DecisionBoardResult
              decisionData={decisionData}
              analysisResult={analysisResult}
              onStartNew={handleStartNew}
              onEditDecision={handleEditDecision}
            />
          </>
        );

      case VIEWS.INPUT:
      default:
        return (
          <>
            <FeatureAppHeader
              featureId="decisionboard"
              icon={Scale}
              title="Entscheidungs-Board"
              subtitle="Strukturierte Entscheidungsfindung"
              gradient={decisionGradient}
              showBackButton
              onBack={handleBackToDashboard}
            />
            <DecisionBoardInput
              initialData={decisionData}
              onAnalysisComplete={handleAnalysisComplete}
              onCancel={handleCancel}
              isAuthenticated={isAuthenticated}
              requireAuth={requireAuth}
              savedDecisionId={savedDecisionId}
              onSaveDraft={saveSessionDraft}
              onUpdateSession={updateSession}
              onDecisionIdChange={setSavedDecisionId}
              selectedMicrophoneId={selectedMicrophoneId}
              onMicrophoneChange={setSelectedMicrophoneId}
            />
          </>
        );
    }
  };

  return (
    <div className="min-h-full">
      {renderContent()}

      {/* Microphone Test Dialog - available from dashboard */}
      <MicrophoneTestDialog
        isOpen={showMicrophoneTest}
        onClose={() => setShowMicrophoneTest(false)}
        deviceId={selectedMicrophoneId}
      />
    </div>
  );
};

export default DecisionBoardApp;
