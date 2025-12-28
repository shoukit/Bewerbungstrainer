import React, { useState, useCallback, useEffect, useRef } from 'react';
import DecisionBoardInput from './DecisionBoardInput';
import DecisionBoardResult from './DecisionBoardResult';
import wordpressAPI from '@/services/wordpress-api';

/**
 * View states for the decision board flow
 */
const VIEWS = {
  INPUT: 'input',
  RESULT: 'result',
};

/**
 * DecisionBoard App - Main Component
 *
 * "Der Entscheidungs-Kompass" - AI Decision Support System
 *
 * Coordinates the flow between:
 * 1. Input (decision question + pro/contra with weights)
 * 2. Result (rational score + AI coaching cards)
 */
const DecisionBoardApp = ({
  isAuthenticated,
  requireAuth,
  setPendingAction,
  onNavigateToHistory,
}) => {
  const [currentView, setCurrentView] = useState(VIEWS.INPUT);
  const [decisionData, setDecisionData] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [savedDecisionId, setSavedDecisionId] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Track if session was saved to avoid duplicate saves
  const sessionSavedRef = useRef(false);

  // Scroll to top on every view change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentView]);

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
   * Handle start new analysis - go back to input
   */
  const handleStartNew = useCallback(() => {
    setDecisionData(null);
    setAnalysisResult(null);
    setSavedDecisionId(null);
    sessionSavedRef.current = false;
    setCurrentView(VIEWS.INPUT);
  }, []);

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

    // Navigate to history/dashboard
    if (onNavigateToHistory) {
      onNavigateToHistory();
    }
  }, [savedDecisionId, deleteSession, onNavigateToHistory]);

  /**
   * Render current view
   */
  const renderContent = () => {
    switch (currentView) {
      case VIEWS.RESULT:
        return (
          <DecisionBoardResult
            decisionData={decisionData}
            analysisResult={analysisResult}
            onStartNew={handleStartNew}
            onEditDecision={handleEditDecision}
          />
        );

      case VIEWS.INPUT:
      default:
        return (
          <DecisionBoardInput
            initialData={decisionData}
            onAnalysisComplete={handleAnalysisComplete}
            onCancel={onNavigateToHistory ? handleCancel : null}
            isAuthenticated={isAuthenticated}
            requireAuth={requireAuth}
            savedDecisionId={savedDecisionId}
            onSaveDraft={saveSessionDraft}
            onUpdateSession={updateSession}
            onDecisionIdChange={setSavedDecisionId}
          />
        );
    }
  };

  return (
    <div style={{ minHeight: '100%' }}>
      {renderContent()}
    </div>
  );
};

export default DecisionBoardApp;
