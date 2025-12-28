import React, { useState, useCallback, useEffect } from 'react';
import DecisionBoardInput from './DecisionBoardInput';
import DecisionBoardResult from './DecisionBoardResult';

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
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Scroll to top on every view change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentView]);

  /**
   * Handle analysis complete - transition to result view
   */
  const handleAnalysisComplete = useCallback((data, result) => {
    setDecisionData(data);
    setAnalysisResult(result);
    setCurrentView(VIEWS.RESULT);
  }, []);

  /**
   * Handle start new analysis - go back to input
   */
  const handleStartNew = useCallback(() => {
    setDecisionData(null);
    setAnalysisResult(null);
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
