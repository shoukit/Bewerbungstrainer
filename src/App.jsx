import React, { useState, useEffect } from 'react';
import RoleplayDashboard from './components/RoleplayDashboard';
import RoleplaySession from './components/RoleplaySession';
import SessionHistory from './components/SessionHistory';
import SessionDetailView from './components/SessionDetailView';
import { SimulatorApp } from './components/simulator';
import { RhetorikGym, GameSession } from './components/rhetorik-gym';
import { SidebarLayout } from './components/ui/sidebar';
import { PartnerProvider } from './context/PartnerContext';

console.log('📦 [APP] App.jsx module loaded');

// View constants
const VIEWS = {
  DASHBOARD: 'dashboard',
  ROLEPLAY: 'roleplay',
  SIMULATOR: 'simulator',
  HISTORY: 'history',
  SESSION_DETAIL: 'session_detail',
  GYM: 'gym',
  GYM_KLASSIKER: 'gym_klassiker',
  GYM_SESSION: 'gym_session',
};

/**
 * Get the WP admin bar height (if visible)
 */
function getAdminBarHeight() {
  const adminBar = document.getElementById('wpadminbar');
  return adminBar ? adminBar.offsetHeight : 0;
}

/**
 * Detect WordPress header height
 * Returns the sticky offset considering scroll position
 * When WP header scrolls out of view, returns admin bar height only
 */
function getWPHeaderHeight() {
  const appContainer = document.getElementById('bewerbungstrainer-app');
  const adminBarHeight = getAdminBarHeight();

  // Method 1: Check what element is at the top center of the viewport
  // This finds the header even if selectors don't match
  const topElement = document.elementFromPoint(window.innerWidth / 2, adminBarHeight + 10);
  if (topElement) {
    // Walk up to find header/nav container
    let current = topElement;
    while (current && current !== document.body) {
      const tagName = current.tagName?.toLowerCase();
      const isHeader = tagName === 'header' ||
                       tagName === 'nav' ||
                       current.classList?.contains('site-header') ||
                       current.classList?.contains('elementor-location-header') ||
                       current.id === 'masthead';

      if (isHeader && (!appContainer || !appContainer.contains(current))) {
        const rect = current.getBoundingClientRect();
        const headerBottom = rect.bottom;
        // If header bottom is above admin bar, header is scrolled out
        if (headerBottom <= adminBarHeight) {
          return adminBarHeight;
        }
        return Math.max(adminBarHeight, headerBottom);
      }
      current = current.parentElement;
    }
  }

  // Method 2: Try various header selectors
  const headerSelectors = [
    'header.site-header',
    '#masthead',
    '.site-header',
    '.elementor-location-header',
    '[data-elementor-type="header"]',
    '.ast-header-wrap', // Astra theme
    '#starter-header', // Starter theme
    '.header-wrapper',
    'header',
  ];

  for (const selector of headerSelectors) {
    const header = document.querySelector(selector);
    if (header && (!appContainer || !appContainer.contains(header))) {
      const rect = header.getBoundingClientRect();
      const headerBottom = rect.bottom;
      // If header bottom is at or above admin bar, header is scrolled out
      if (headerBottom <= adminBarHeight) {
        return adminBarHeight;
      }
      return Math.max(adminBarHeight, headerBottom);
    }
  }

  // Method 3: Check parent of app container
  if (appContainer) {
    let sibling = appContainer.previousElementSibling;
    while (sibling) {
      const rect = sibling.getBoundingClientRect();
      if (rect.height > 30 && rect.top < 100) {
        const headerBottom = rect.bottom;
        if (headerBottom <= adminBarHeight) {
          return adminBarHeight;
        }
        return Math.max(adminBarHeight, headerBottom);
      }
      sibling = sibling.previousElementSibling;
    }
  }

  return adminBarHeight;
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

  // Rhetorik-Gym state
  const [gameConfig, setGameConfig] = useState(null);

  // Detect WP header height on mount
  useEffect(() => {
    const updateHeaderOffset = () => {
      const offset = getWPHeaderHeight();
      setHeaderOffset(offset);
    };

    // Initial calculation - try multiple times to ensure DOM is ready
    const tryUpdate = (attempts = 0) => {
      updateHeaderOffset();
      if (attempts < 5) {
        setTimeout(() => tryUpdate(attempts + 1), 200);
      }
    };

    // Initial calculation
    requestAnimationFrame(() => {
      setTimeout(() => tryUpdate(), 50);
    });

    // Also try after window load
    const handleLoad = () => setTimeout(updateHeaderOffset, 100);
    window.addEventListener('load', handleLoad);

    // Recalculate on resize and scroll (header might be sticky)
    window.addEventListener('resize', updateHeaderOffset);
    window.addEventListener('scroll', updateHeaderOffset, { passive: true });

    return () => {
      window.removeEventListener('load', handleLoad);
      window.removeEventListener('resize', updateHeaderOffset);
      window.removeEventListener('scroll', updateHeaderOffset);
    };
  }, []);

  // ===== NAVIGATION HANDLER =====
  const handleSidebarNavigate = (viewId) => {
    console.log('🧭 [APP] Sidebar navigation to:', viewId);
    switch (viewId) {
      case 'dashboard':
        setCurrentView(VIEWS.DASHBOARD);
        break;
      case 'simulator':
        setCurrentView(VIEWS.SIMULATOR);
        break;
      case 'history':
        setCurrentView(VIEWS.HISTORY);
        break;
      case 'gym':
      case 'gym_klassiker':
        setCurrentView(VIEWS.GYM_KLASSIKER);
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

  // ===== RHETORIK-GYM HANDLERS =====
  const handleStartGame = (config) => {
    console.log('🎮 [APP] Starting game with config:', config);
    setGameConfig(config);
    setCurrentView(VIEWS.GYM_SESSION);
  };

  const handleGameBack = () => {
    console.log('🎮 [APP] Returning to gym dashboard');
    setGameConfig(null);
    setCurrentView(VIEWS.GYM_KLASSIKER);
  };

  const handleGameComplete = (result) => {
    console.log('🎮 [APP] Game completed with result:', result);
    // Could navigate to a results view or stay in session
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

      case VIEWS.SIMULATOR:
        return <SimulatorApp />;

      case VIEWS.GYM:
      case VIEWS.GYM_KLASSIKER:
        return (
          <RhetorikGym
            onStartGame={handleStartGame}
          />
        );

      case VIEWS.GYM_SESSION:
        return (
          <GameSession
            gameConfig={gameConfig}
            onBack={handleGameBack}
            onComplete={handleGameComplete}
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

  // All views now use the sidebar layout for consistent navigation
  return (
    <PartnerProvider>
      <SidebarLayout
        activeView={currentView}
        onNavigate={handleSidebarNavigate}
        headerOffset={headerOffset}
      >
        {renderContent()}
      </SidebarLayout>
    </PartnerProvider>
  );
}

export default App;
