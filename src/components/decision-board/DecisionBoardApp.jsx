import React, { useState, useCallback, useEffect } from 'react';
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

  // Scroll to top on every view change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentView]);

  /**
   * Handle analysis complete - save to backend and transition to result view
   */
  const handleAnalysisComplete = useCallback(async (data, result) => {
    setDecisionData(data);
    setAnalysisResult(result);
    setCurrentView(VIEWS.RESULT);

    // Save decision to backend (async, don't block UI)
    try {
      const saveData = {
        topic: data.topic,
        context: data.context || null,
        pros: data.pros,
        cons: data.cons,
        pro_score: data.proScore,
        contra_score: data.contraScore,
        analysis: result,
      };

      const response = await wordpressAPI.createDecision(saveData);

      if (response.success && response.data?.decision?.id) {
        setSavedDecisionId(response.data.decision.id);
        console.log('[DecisionBoard] Decision saved with ID:', response.data.decision.id);
      }
    } catch (err) {
      console.error('[DecisionBoard] Failed to save decision:', err);
      // Don't show error to user - the analysis was successful, just saving failed
    }
  }, []);

  /**
   * Handle start new analysis - go back to input
   */
  const handleStartNew = useCallback(() => {
    setDecisionData(null);
    setAnalysisResult(null);
    setSavedDecisionId(null);
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
            isAuthenticated={isAuthenticated}
            requireAuth={requireAuth}
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
