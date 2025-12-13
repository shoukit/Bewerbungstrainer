import React, { useState, useEffect, useCallback } from 'react';
import OverviewDashboard from './components/OverviewDashboard';
import RoleplayDashboard from './components/RoleplayDashboard';
import RoleplaySession from './components/RoleplaySession';
import SessionHistory from './components/SessionHistory';
import SessionDetailView from './components/SessionDetailView';
import { SimulatorApp } from './components/simulator';
import { VideoTrainingApp } from './components/video-training';
import { RhetorikGym, GameSession } from './components/rhetorik-gym';
import { SidebarLayout } from './components/ui/sidebar';
import { PartnerProvider, usePartner, useAuth } from './context/PartnerContext';
import { LoginModal } from './components/LoginModal';
import { ToastProvider } from './components/Toast';
import { Loader2 } from 'lucide-react';

// Admin components
import AdminDashboard from './components/admin/AdminDashboard';
import ScenarioManager from './components/admin/ScenarioManager';
import SimulatorScenarioManager from './components/admin/SimulatorScenarioManager';
import VideoTrainingManager from './components/admin/VideoTrainingManager';
import PartnerManager from './components/admin/PartnerManager';

console.log('📦 [APP] App.jsx module loaded');

/**
 * Loading Spinner Component
 * Shown while partner branding is being loaded
 */
const BrandingLoadingSpinner = () => {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        zIndex: 9999,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <Loader2
          style={{
            width: '48px',
            height: '48px',
            color: '#3A7FA7',
            animation: 'spin 1s linear infinite',
          }}
        />
        <p
          style={{
            fontSize: '16px',
            color: '#64748b',
            fontWeight: 500,
            margin: 0,
          }}
        >
          Trainingscenter wird geladen...
        </p>
      </div>
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

// View constants
const VIEWS = {
  OVERVIEW: 'overview',
  DASHBOARD: 'dashboard',
  ROLEPLAY: 'roleplay',
  SIMULATOR: 'simulator',
  VIDEO_TRAINING: 'video_training',
  HISTORY: 'history',
  SESSION_DETAIL: 'session_detail',
  GYM: 'gym',
  GYM_KLASSIKER: 'gym_klassiker',
  GYM_SESSION: 'gym_session',
  // Admin views
  ADMIN: 'admin',
  ADMIN_ROLEPLAYS: 'admin_roleplays',
  ADMIN_SIMULATOR: 'admin_simulator',
  ADMIN_VIDEO: 'admin_video',
  ADMIN_PARTNERS: 'admin_partners',
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

/**
 * AppContent - Inner component with access to auth context
 */
function AppContent() {
  console.log('🏗️ [APP] App component initialized');

  // Auth context and loading state
  const { isAuthenticated, authLoading, isLoading } = usePartner();
  const { isAdmin } = useAuth();

  // Show loading spinner while branding is loading
  if (isLoading) {
    return <BrandingLoadingSpinner />;
  }

  // Current view state - start with overview
  const [currentView, setCurrentView] = useState(VIEWS.OVERVIEW);
  const [headerOffset, setHeaderOffset] = useState(0);

  // Roleplay state
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [roleplayVariables, setRoleplayVariables] = useState({});

  // Session history state
  const [selectedSession, setSelectedSession] = useState(null);

  // Rhetorik-Gym state
  const [gameConfig, setGameConfig] = useState(null);

  // Login modal state
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);

  // Pending action state - stores action to execute after successful login
  const [pendingAction, setPendingAction] = useState(null);

  // Pending scenario for roleplay (needs variables collection after login)
  const [pendingRoleplayScenario, setPendingRoleplayScenario] = useState(null);

  // Pending scenario for simulator (needs to trigger selection after login)
  const [pendingSimulatorScenario, setPendingSimulatorScenario] = useState(null);

  // Pending game mode for RhetorikGym (needs to trigger mode selection after login)
  const [pendingGymMode, setPendingGymMode] = useState(null);

  // Pending scenario for video training (needs to trigger selection after login)
  const [pendingVideoTrainingScenario, setPendingVideoTrainingScenario] = useState(null);

  // Pending session for continue/repeat in simulator
  const [pendingContinueSession, setPendingContinueSession] = useState(null);
  const [pendingRepeatSession, setPendingRepeatSession] = useState(null);

  // Reset key for video training - increments to trigger reset to dashboard
  const [videoTrainingResetKey, setVideoTrainingResetKey] = useState(0);

  /**
   * Execute a pending action after successful login
   */
  const executePendingAction = useCallback((action) => {
    if (!action) return;

    console.log('🔐 [APP] Executing pending action:', action.type);

    switch (action.type) {
      case 'SELECT_ROLEPLAY_SCENARIO':
        // Store the scenario - RoleplayDashboard will open the variables dialog
        setPendingRoleplayScenario(action.scenario);
        // Stay on dashboard view (already there)
        setCurrentView(VIEWS.DASHBOARD);
        break;
      case 'SELECT_SIMULATOR_SCENARIO':
        // Store the scenario - SimulatorDashboard will handle it
        setPendingSimulatorScenario(action.scenario);
        setCurrentView(VIEWS.SIMULATOR);
        break;
      case 'START_GYM_GAME':
        setGameConfig(action.config);
        setCurrentView(VIEWS.GYM_SESSION);
        break;
      case 'SELECT_GYM_MODE':
        // Store the mode - RhetorikGym will handle it
        setPendingGymMode(action.mode);
        setCurrentView(VIEWS.GYM_KLASSIKER);
        break;
      case 'SELECT_VIDEO_TRAINING_SCENARIO':
        // Store the scenario - VideoTrainingApp will handle it
        setPendingVideoTrainingScenario(action.scenario);
        setCurrentView(VIEWS.VIDEO_TRAINING);
        break;
      default:
        console.warn('Unknown pending action type:', action.type);
    }
  }, []);

  /**
   * Require authentication - either execute action immediately or store it for after login
   * @param {Function} action - The action callback to execute
   * @param {Object} actionData - Data to store for pending action (optional, for cross-component actions)
   * @returns {boolean} - True if authenticated and action was executed
   */
  const requireAuth = useCallback((action, actionData = null) => {
    if (isAuthenticated) {
      // User is logged in - execute action immediately
      action();
      return true;
    }

    // User not logged in - store pending action and show login modal
    console.log('🔐 [APP] Auth required - storing pending action');
    if (actionData) {
      setPendingAction(actionData);
    }
    openLoginModal();
    return false;
  }, [isAuthenticated]);

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

  // ===== SCROLL TO TOP HELPER =====
  const scrollToTop = useCallback(() => {
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      // Scroll window to top immediately (not smooth - more reliable)
      window.scrollTo(0, 0);

      // Also scroll the app container
      const appContainer = document.getElementById('bewerbungstrainer-app');
      if (appContainer) {
        appContainer.scrollTop = 0;
      }

      // Try to scroll the main content area if it exists
      const mainContent = document.querySelector('[data-main-content]');
      if (mainContent) {
        mainContent.scrollTop = 0;
      }

      // Also scroll parent containers that might have overflow
      const scrollableParents = document.querySelectorAll('.overflow-y-auto, .overflow-auto, [style*="overflow"]');
      scrollableParents.forEach(el => {
        if (el.scrollTop > 0) {
          el.scrollTop = 0;
        }
      });
    });
  }, []);

  // ===== SCROLL TO TOP ON EVERY VIEW CHANGE =====
  useEffect(() => {
    // Scroll to top whenever the view changes
    scrollToTop();
  }, [currentView, scrollToTop]);

  // ===== NAVIGATION HANDLER =====
  const handleSidebarNavigate = (viewId) => {
    console.log('🧭 [APP] Sidebar navigation to:', viewId);

    // Scroll to top on every navigation
    scrollToTop();

    switch (viewId) {
      case 'overview':
        setCurrentView(VIEWS.OVERVIEW);
        break;
      case 'dashboard':
        setCurrentView(VIEWS.DASHBOARD);
        break;
      case 'simulator':
        setCurrentView(VIEWS.SIMULATOR);
        break;
      case 'video_training':
        // Reset the video training module to dashboard when clicking sidebar
        setVideoTrainingResetKey(prev => prev + 1);
        setCurrentView(VIEWS.VIDEO_TRAINING);
        break;
      case 'history':
        setCurrentView(VIEWS.HISTORY);
        break;
      case 'gym':
      case 'gym_klassiker':
        setCurrentView(VIEWS.GYM_KLASSIKER);
        break;
      // Admin views
      case 'admin':
        setCurrentView(VIEWS.ADMIN);
        break;
      case 'admin_roleplays':
        setCurrentView(VIEWS.ADMIN_ROLEPLAYS);
        break;
      case 'admin_simulator':
        setCurrentView(VIEWS.ADMIN_SIMULATOR);
        break;
      case 'admin_video':
        setCurrentView(VIEWS.ADMIN_VIDEO);
        break;
      case 'admin_partners':
        setCurrentView(VIEWS.ADMIN_PARTNERS);
        break;
      default:
        setCurrentView(VIEWS.OVERVIEW);
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

  // ===== SIMULATOR SESSION HANDLERS =====
  const handleContinueSession = (session, scenario) => {
    console.log('🔄 [APP] Continuing simulator session:', session.id);
    setPendingContinueSession({ session, scenario });
    setCurrentView(VIEWS.SIMULATOR);
  };

  const handleRepeatSession = (session, scenario) => {
    console.log('🔁 [APP] Repeating simulator session with same questions:', session.id);
    setPendingRepeatSession({ session, scenario });
    setCurrentView(VIEWS.SIMULATOR);
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
        return (
          <SimulatorApp
            isAuthenticated={isAuthenticated}
            requireAuth={requireAuth}
            setPendingAction={setPendingAction}
            pendingContinueSession={pendingContinueSession}
            clearPendingContinueSession={() => setPendingContinueSession(null)}
            pendingRepeatSession={pendingRepeatSession}
            clearPendingRepeatSession={() => setPendingRepeatSession(null)}
          />
        );

      case VIEWS.VIDEO_TRAINING:
        return (
          <VideoTrainingApp
            key={videoTrainingResetKey}
            isAuthenticated={isAuthenticated}
            requireAuth={requireAuth}
            setPendingAction={setPendingAction}
            pendingScenario={pendingVideoTrainingScenario}
            clearPendingScenario={() => setPendingVideoTrainingScenario(null)}
          />
        );

      case VIEWS.GYM:
      case VIEWS.GYM_KLASSIKER:
        return (
          <RhetorikGym
            onStartGame={handleStartGame}
            isAuthenticated={isAuthenticated}
            requireAuth={requireAuth}
            setPendingAction={setPendingAction}
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
            isAuthenticated={isAuthenticated}
            onLoginClick={openLoginModal}
            onContinueSession={handleContinueSession}
            onRepeatSession={handleRepeatSession}
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
        return (
          <RoleplayDashboard
            onSelectScenario={handleSelectScenario}
            onOpenHistory={handleOpenHistory}
            isAuthenticated={isAuthenticated}
            requireAuth={requireAuth}
            setPendingAction={setPendingAction}
            pendingScenario={pendingRoleplayScenario}
            clearPendingScenario={() => setPendingRoleplayScenario(null)}
          />
        );

      case VIEWS.OVERVIEW:
        return (
          <OverviewDashboard
            onNavigate={handleSidebarNavigate}
          />
        );

      // Admin views - only accessible to admins
      case VIEWS.ADMIN:
        if (!isAdmin) {
          return <OverviewDashboard onNavigate={handleSidebarNavigate} />;
        }
        return (
          <div style={{ padding: '24px' }}>
            <AdminDashboard onNavigate={handleSidebarNavigate} />
          </div>
        );

      case VIEWS.ADMIN_ROLEPLAYS:
        if (!isAdmin) {
          return <OverviewDashboard onNavigate={handleSidebarNavigate} />;
        }
        return (
          <div style={{ padding: '24px' }}>
            <ScenarioManager onBack={() => setCurrentView(VIEWS.ADMIN)} />
          </div>
        );

      case VIEWS.ADMIN_SIMULATOR:
        if (!isAdmin) {
          return <OverviewDashboard onNavigate={handleSidebarNavigate} />;
        }
        return (
          <div style={{ padding: '24px' }}>
            <SimulatorScenarioManager onBack={() => setCurrentView(VIEWS.ADMIN)} />
          </div>
        );

      case VIEWS.ADMIN_VIDEO:
        if (!isAdmin) {
          return <OverviewDashboard onNavigate={handleSidebarNavigate} />;
        }
        return (
          <div style={{ padding: '24px' }}>
            <VideoTrainingManager onBack={() => setCurrentView(VIEWS.ADMIN)} />
          </div>
        );

      case VIEWS.ADMIN_PARTNERS:
        if (!isAdmin) {
          return <OverviewDashboard onNavigate={handleSidebarNavigate} />;
        }
        return (
          <div style={{ padding: '24px' }}>
            <PartnerManager onBack={() => setCurrentView(VIEWS.ADMIN)} />
          </div>
        );

      default:
        return (
          <OverviewDashboard
            onNavigate={handleSidebarNavigate}
          />
        );
    }
  };

  // All views now use the sidebar layout for consistent navigation
  return (
    <>
      <SidebarLayout
        activeView={currentView}
        onNavigate={handleSidebarNavigate}
        headerOffset={headerOffset}
        onLoginClick={openLoginModal}
      >
        {renderContent()}
      </SidebarLayout>

      {/* Login Modal */}
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => {
            closeLoginModal();
            // Clear pending action if user cancels login
            setPendingAction(null);
          }}
          onLoginSuccess={(user) => {
            console.log('✅ [APP] User logged in:', user.displayName);
            // Execute pending action if there was one
            if (pendingAction) {
              console.log('🔐 [APP] Executing pending action after login:', pendingAction.type);
              executePendingAction(pendingAction);
              setPendingAction(null);
            }
          }}
        />
    </>
  );
}

/**
 * App - Main wrapper with providers
 */
function App() {
  return (
    <PartnerProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </PartnerProvider>
  );
}

export default App;
