import React, { useState, useCallback, useEffect } from 'react';
import SmartBriefingDashboard from './SmartBriefingDashboard';
import SmartBriefingForm from './SmartBriefingForm';
import BriefingResult from './BriefingResult';
import BriefingList from './BriefingList';
import BriefingWorkbook from './BriefingWorkbook';

/**
 * View states for the smart briefing flow
 */
const VIEWS = {
  DASHBOARD: 'dashboard',
  FORM: 'form',
  RESULT: 'result',
  LIST: 'list',
  WORKBOOK: 'workbook',
};

/**
 * SmartBriefing App - Main Component
 *
 * Coordinates the flow between:
 * 1. Dashboard (template selection)
 * 2. Form (variable input)
 * 3. Result (generated briefing display)
 * 4. List (saved briefings overview)
 * 5. Workbook (detailed briefing view with notes)
 */
const SmartBriefingApp = ({
  isAuthenticated,
  requireAuth,
  setPendingAction,
  onNavigateToSimulator,
  onNavigateToHistory,
}) => {
  const [currentView, setCurrentView] = useState(VIEWS.DASHBOARD);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [generatedBriefing, setGeneratedBriefing] = useState(null);
  const [selectedBriefing, setSelectedBriefing] = useState(null);

  // Track pending template for after login
  const [pendingTemplate, setPendingTemplate] = useState(null);

  // Handle pending template after login - automatically open form
  useEffect(() => {
    if (pendingTemplate && isAuthenticated) {
      console.log('[SmartBriefing] Processing pending template after login:', pendingTemplate.title);
      setSelectedTemplate(pendingTemplate);
      setCurrentView(VIEWS.FORM);
      setPendingTemplate(null);
    }
  }, [pendingTemplate, isAuthenticated]);

  // Scroll to top on every view change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentView]);

  /**
   * Handle template selection from dashboard
   */
  const handleSelectTemplate = useCallback((template) => {
    console.log('[SmartBriefing] Template selected:', template.title);
    setSelectedTemplate(template);
    setCurrentView(VIEWS.FORM);
  }, []);

  /**
   * Handle back from form to dashboard
   */
  const handleBackToDashboard = useCallback(() => {
    setSelectedTemplate(null);
    setGeneratedBriefing(null);
    setSelectedBriefing(null);
    setCurrentView(VIEWS.DASHBOARD);
  }, []);

  /**
   * Handle briefing generated - now goes to workbook instead of result
   */
  const handleBriefingGenerated = useCallback((briefing) => {
    console.log('[SmartBriefing] Briefing generated:', briefing.id);
    setGeneratedBriefing(briefing);
    setSelectedBriefing(briefing);
    // Go directly to workbook view for the new section-based experience
    setCurrentView(VIEWS.WORKBOOK);
  }, []);

  /**
   * Handle create new briefing (from list or workbook)
   */
  const handleCreateNew = useCallback(() => {
    setGeneratedBriefing(null);
    setSelectedBriefing(null);
    setSelectedTemplate(null);
    setCurrentView(VIEWS.DASHBOARD);
  }, []);

  /**
   * Handle generate another with same template
   */
  const handleGenerateAnother = useCallback(() => {
    setGeneratedBriefing(null);
    setSelectedBriefing(null);
    setCurrentView(VIEWS.FORM);
  }, []);

  /**
   * Handle navigate to saved briefings list
   */
  const handleShowList = useCallback(() => {
    setCurrentView(VIEWS.LIST);
  }, []);

  /**
   * Handle open briefing from list
   */
  const handleOpenBriefing = useCallback((briefing) => {
    console.log('[SmartBriefing] Opening briefing:', briefing.id);
    setSelectedBriefing(briefing);
    setCurrentView(VIEWS.WORKBOOK);
  }, []);

  /**
   * Handle back from workbook to list
   */
  const handleBackToList = useCallback(() => {
    setSelectedBriefing(null);
    setCurrentView(VIEWS.LIST);
  }, []);

  /**
   * Handle start simulation from workbook
   * Bridge feature: Pre-fill simulator with briefing variables
   */
  const handleStartSimulation = useCallback((variables) => {
    console.log('[SmartBriefing] Starting simulation with variables:', variables);

    if (onNavigateToSimulator) {
      // Navigate to simulator with pre-filled variables
      onNavigateToSimulator(variables);
    }
  }, [onNavigateToSimulator]);

  /**
   * Render current view
   */
  const renderContent = () => {
    switch (currentView) {
      case VIEWS.FORM:
        return (
          <SmartBriefingForm
            template={selectedTemplate}
            onBack={handleBackToDashboard}
            onBriefingGenerated={handleBriefingGenerated}
            isAuthenticated={isAuthenticated}
          />
        );

      case VIEWS.RESULT:
        return (
          <BriefingResult
            briefing={generatedBriefing}
            template={selectedTemplate}
            onBack={handleBackToDashboard}
            onCreateNew={handleCreateNew}
            onGenerateAnother={handleGenerateAnother}
          />
        );

      case VIEWS.LIST:
        return (
          <BriefingList
            onOpenBriefing={handleOpenBriefing}
            onCreateNew={handleCreateNew}
            isAuthenticated={isAuthenticated}
          />
        );

      case VIEWS.WORKBOOK:
        return (
          <BriefingWorkbook
            briefing={selectedBriefing}
            onBack={handleBackToDashboard}
            onStartSimulation={onNavigateToSimulator ? handleStartSimulation : null}
          />
        );

      case VIEWS.DASHBOARD:
      default:
        return (
          <SmartBriefingDashboard
            onSelectTemplate={handleSelectTemplate}
            onShowList={onNavigateToHistory}
            isAuthenticated={isAuthenticated}
            requireAuth={requireAuth}
            setPendingAction={setPendingAction}
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

export default SmartBriefingApp;
