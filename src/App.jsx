import React, { useState, useEffect } from 'react';
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

/**
 * Detect WordPress header height
 * Looks for common WP header elements and calculates total offset
 */
function getWPHeaderHeight() {
  // Check for WP admin bar (32px when logged in)
  const adminBar = document.getElementById('wpadminbar');
  const adminBarHeight = adminBar ? adminBar.offsetHeight : 0;

  // Check for theme header - try common selectors
  const themeHeader =
    document.querySelector('header.site-header') ||
    document.querySelector('#masthead') ||
    document.querySelector('.site-header') ||
    document.querySelector('header');

  // Only count theme header if it's outside our app container
  let themeHeaderHeight = 0;
  if (themeHeader) {
    const appContainer = document.getElementById('bewerbungstrainer-app');
    if (appContainer && !appContainer.contains(themeHeader)) {
      themeHeaderHeight = themeHeader.offsetHeight;
    }
  }

  return adminBarHeight + themeHeaderHeight;
}

function App() {
  console.log('🏗️ [APP] App component initialized');

  // Current view state
  const [currentView, setCurrentView] = useState(VIEWS.DASHBOARD);
  const [headerOffset, setHeaderOffset] = useState(0);

  // Roleplay state
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [roleplayVariables, setRoleplayVariables] = useState({});

  // Session history state
  const [selectedSession, setSelectedSession] = useState(null);

  // Detect WP header height on mount
  useEffect(() => {
    const updateHeaderOffset = () => {
      const offset = getWPHeaderHeight();
      console.log('📐 [APP] WP header offset:', offset);
      setHeaderOffset(offset);
    };

    // Initial calculation (with delay to ensure DOM is ready)
    setTimeout(updateHeaderOffset, 100);

    // Recalculate on resize
    window.addEventListener('resize', updateHeaderOffset);
    return () => window.removeEventListener('resize', updateHeaderOffset);
  }, []);

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
      headerOffset={headerOffset}
    >
      {renderContent()}
    </SidebarLayout>
  );
}

export default App;
