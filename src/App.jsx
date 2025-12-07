import React, { useState } from 'react';
import RoleplayDashboard from './components/RoleplayDashboard';
import RoleplaySession from './components/RoleplaySession';
import SessionHistory from './components/SessionHistory';
import SessionDetailView from './components/SessionDetailView';
import { SidebarLayout } from './components/ui/sidebar';

console.log('📦 [APP] App.jsx module loaded');

// View constants
const VIEWS = {
  DASHBOARD: 'dashboard',
  ROLEPLAY: 'roleplay',
  HISTORY: 'history',
  SESSION_DETAIL: 'session_detail',
};

function App() {
  console.log('🏗️ [APP] App component initialized');

  // Current view state
  const [currentView, setCurrentView] = useState(VIEWS.DASHBOARD);

  // Roleplay state
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [roleplayVariables, setRoleplayVariables] = useState({});

  // Session history state
  const [selectedSession, setSelectedSession] = useState(null);

  // ===== NAVIGATION HANDLER =====
  const handleSidebarNavigate = (viewId) => {
    console.log('🧭 [APP] Sidebar navigation to:', viewId);
    switch (viewId) {
      case 'dashboard':
        setCurrentView(VIEWS.DASHBOARD);
        break;
      case 'history':
        setCurrentView(VIEWS.HISTORY);
        break;
      default:
        setCurrentView(VIEWS.DASHBOARD);
    }
  };

  // ===== ROLEPLAY HANDLERS =====
  const handleSelectScenario = (scenario, variables = {}) => {
    console.log('🎭 [APP] Scenario selected:', scenario);
    console.log('🎭 [APP] Variables received:', variables);
    setSelectedScenario(scenario);
    setRoleplayVariables(variables);
    setCurrentView(VIEWS.ROLEPLAY);
  };

  const handleEndRoleplay = () => {
    console.log('🎭 [APP] Roleplay ended - returning to dashboard');
    setSelectedScenario(null);
    setRoleplayVariables({});
    setCurrentView(VIEWS.DASHBOARD);
  };

  const handleNavigateToSession = (session) => {
    console.log('🎭 [APP] Navigating to session analysis:', session.id);
    setSelectedScenario(null);
    setRoleplayVariables({});
    setSelectedSession(session);
    setCurrentView(VIEWS.SESSION_DETAIL);
  };

  // ===== HISTORY HANDLERS =====
  const handleOpenHistory = () => {
    console.log('📜 [APP] Opening session history');
    setCurrentView(VIEWS.HISTORY);
  };

  const handleCloseHistory = () => {
    console.log('📜 [APP] Closing session history');
    setCurrentView(VIEWS.DASHBOARD);
  };

  const handleSelectSession = (session) => {
    console.log('📜 [APP] Session selected:', session.id);
    setSelectedSession(session);
    setCurrentView(VIEWS.SESSION_DETAIL);
  };

  const handleCloseSessionDetail = () => {
    console.log('📜 [APP] Closing session detail');
    setSelectedSession(null);
    setCurrentView(VIEWS.HISTORY);
  };

  // ===== CONTENT RENDERING =====
  const renderContent = () => {
    switch (currentView) {
      case VIEWS.ROLEPLAY:
        return (
          <RoleplaySession
            scenario={selectedScenario}
            variables={roleplayVariables}
            onEnd={handleEndRoleplay}
            onNavigateToSession={handleNavigateToSession}
          />
        );

      case VIEWS.HISTORY:
        return (
          <SessionHistory
            onBack={handleCloseHistory}
            onSelectSession={handleSelectSession}
          />
        );

      case VIEWS.SESSION_DETAIL:
        return (
          <SessionDetailView
            session={selectedSession}
            onBack={handleCloseSessionDetail}
          />
        );

      case VIEWS.DASHBOARD:
      default:
        return (
          <RoleplayDashboard
            onSelectScenario={handleSelectScenario}
            onOpenHistory={handleOpenHistory}
          />
        );
    }
  };

  // Full-screen views (no sidebar)
  const isFullScreenView = currentView === VIEWS.ROLEPLAY;

  if (isFullScreenView) {
    return renderContent();
  }

  // Views with sidebar
  return (
    <SidebarLayout
      activeView={currentView}
      onNavigate={handleSidebarNavigate}
    >
      {renderContent()}
    </SidebarLayout>
  );
}

export default App;
