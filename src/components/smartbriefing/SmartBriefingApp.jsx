import React, { useState, useCallback, useEffect } from 'react';
import SmartBriefingDashboard from './SmartBriefingDashboard';
import SmartBriefingForm from './SmartBriefingForm';
import BriefingResult from './BriefingResult';
import BriefingList from './BriefingList';
import BriefingWorkbook from './BriefingWorkbook';
import CreateTemplateDialog from './CreateTemplateDialog';
import wordpressAPI from '../../services/wordpress-api';

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
  demoCode,
}) => {
  const [currentView, setCurrentView] = useState(VIEWS.DASHBOARD);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [generatedBriefing, setGeneratedBriefing] = useState(null);
  const [selectedBriefing, setSelectedBriefing] = useState(null);

  // Track pending template for after login
  const [pendingTemplate, setPendingTemplate] = useState(null);

  // Template creation/editing dialog state
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Handle pending template after login - automatically open form
  useEffect(() => {
    if (pendingTemplate && isAuthenticated) {
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

    if (onNavigateToSimulator) {
      // Navigate to simulator with pre-filled variables
      onNavigateToSimulator(variables);
    }
  }, [onNavigateToSimulator]);

  /**
   * Handle delete briefing from workbook
   */
  const handleDeleteBriefing = useCallback(async (briefing) => {
    try {
      const response = await wordpressAPI.request(`/smartbriefing/briefings/${briefing.id}`, {
        method: 'DELETE',
      });

      if (response.success) {
        // Navigate back to dashboard after successful deletion
        setSelectedBriefing(null);
        setCurrentView(VIEWS.DASHBOARD);
      } else {
        throw new Error('Fehler beim Löschen');
      }
    } catch (err) {
      console.error('[SmartBriefing] Error deleting briefing:', err);
      throw err; // Re-throw so the dialog can handle the error
    }
  }, []);

  /**
   * Handle create new custom template
   */
  const handleCreateTemplate = useCallback(() => {
    setEditingTemplate(null);
    setTemplateDialogOpen(true);
  }, []);

  /**
   * Handle edit custom template
   */
  const handleEditTemplate = useCallback((template) => {
    setEditingTemplate(template);
    setTemplateDialogOpen(true);
  }, []);

  /**
   * Handle template dialog close
   */
  const handleTemplateDialogClose = useCallback(() => {
    setTemplateDialogOpen(false);
    setEditingTemplate(null);
  }, []);

  /**
   * Handle template saved (created or updated)
   */
  const handleTemplateSaved = useCallback((template) => {
    // Trigger refresh of dashboard
    setRefreshKey(prev => prev + 1);
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
            onDelete={handleDeleteBriefing}
            onStartSimulation={onNavigateToSimulator ? handleStartSimulation : null}
          />
        );

      case VIEWS.DASHBOARD:
      default:
        return (
          <SmartBriefingDashboard
            key={refreshKey}
            onSelectTemplate={handleSelectTemplate}
            onShowList={onNavigateToHistory}
            onCreateTemplate={handleCreateTemplate}
            onEditTemplate={handleEditTemplate}
            isAuthenticated={isAuthenticated}
            requireAuth={requireAuth}
            setPendingAction={setPendingAction}
            demoCode={demoCode}
          />
        );
    }
  };

  return (
    <div style={{ minHeight: '100%' }}>
      {renderContent()}

      {/* Template Creation/Editing Dialog */}
      <CreateTemplateDialog
        isOpen={templateDialogOpen}
        onClose={handleTemplateDialogClose}
        onSave={handleTemplateSaved}
        editTemplate={editingTemplate}
        demoCode={demoCode}
      />
    </div>
  );
};

export default SmartBriefingApp;
