import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Scale, FolderOpen } from 'lucide-react';
import DecisionBoardInput from './DecisionBoardInput';
import DecisionBoardResult from './DecisionBoardResult';
import wordpressAPI from '@/services/wordpress-api';
import FeatureInfoModal from '@/components/FeatureInfoModal';
import FeatureInfoButton from '@/components/FeatureInfoButton';
import { usePartner } from '@/context/PartnerContext';
import { DEFAULT_BRANDING } from '@/config/partners';
import { COLORS, createGradient } from '@/config/colors';

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

  // Partner context for theming
  const { branding } = usePartner();
  const primaryAccent = branding?.['--primary-accent'] || DEFAULT_BRANDING['--primary-accent'];

  // Decision Board feature gradient (teal)
  const decisionGradient = createGradient(COLORS.teal[500], COLORS.teal[400]);

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
    <>
      {/* Feature Info Modal - shows on first visit */}
      <FeatureInfoModal featureId="decisionboard" showOnMount />

      <div style={{ minHeight: '100%' }}>
        {/* Header */}
        <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: decisionGradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Scale style={{ width: '24px', height: '24px', color: 'white' }} />
                </div>
                <div>
                  <h1 style={{
                    fontSize: '28px',
                    fontWeight: 700,
                    color: COLORS.slate[900],
                    margin: 0
                  }}>
                    Entscheidungs-Board
                  </h1>
                  <p style={{ fontSize: '14px', color: COLORS.slate[600], margin: 0 }}>
                    Strukturierte Entscheidungsfindung
                  </p>
                </div>
              </div>

              {/* Right side: Info button + History button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <FeatureInfoButton featureId="decisionboard" size="sm" />

                {/* Meine Entscheidungen Button - Only for authenticated users */}
                {isAuthenticated && onNavigateToHistory && (
                  <button
                    onClick={onNavigateToHistory}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px 20px',
                      borderRadius: '12px',
                      border: `2px solid ${primaryAccent}`,
                      backgroundColor: 'white',
                      color: primaryAccent,
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <FolderOpen size={18} />
                    Meine Entscheidungen
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {renderContent()}
      </div>
    </>
  );
};

export default DecisionBoardApp;
