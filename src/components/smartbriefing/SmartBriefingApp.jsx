import React, { useState, useCallback, useEffect } from 'react';
import SmartBriefingDashboard from './SmartBriefingDashboard';
import SmartBriefingForm from './SmartBriefingForm';
import BriefingResult from './BriefingResult';

/**
 * View states for the smart briefing flow
 */
const VIEWS = {
  DASHBOARD: 'dashboard',
  FORM: 'form',
  RESULT: 'result',
};

/**
 * SmartBriefing App - Main Component
 *
 * Coordinates the flow between:
 * 1. Dashboard (template selection)
 * 2. Form (variable input)
 * 3. Result (generated briefing display)
 */
const SmartBriefingApp = ({
  isAuthenticated,
  requireAuth,
  setPendingAction,
}) => {
  const [currentView, setCurrentView] = useState(VIEWS.DASHBOARD);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [generatedBriefing, setGeneratedBriefing] = useState(null);

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
    setCurrentView(VIEWS.DASHBOARD);
  }, []);

  /**
   * Handle briefing generated
   */
  const handleBriefingGenerated = useCallback((briefing) => {
    console.log('[SmartBriefing] Briefing generated:', briefing.id);
    setGeneratedBriefing(briefing);
    setCurrentView(VIEWS.RESULT);
  }, []);

  /**
   * Handle create new briefing (from result view)
   */
  const handleCreateNew = useCallback(() => {
    setGeneratedBriefing(null);
    setSelectedTemplate(null);
    setCurrentView(VIEWS.DASHBOARD);
  }, []);

  /**
   * Handle generate another with same template
   */
  const handleGenerateAnother = useCallback(() => {
    setGeneratedBriefing(null);
    setCurrentView(VIEWS.FORM);
  }, []);

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

      case VIEWS.DASHBOARD:
      default:
        return (
          <SmartBriefingDashboard
            onSelectTemplate={handleSelectTemplate}
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
