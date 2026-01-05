import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { SidebarLayout } from './components/ui/sidebar';
import { PartnerProvider, usePartner, useAuth } from './context/PartnerContext';
import { LoginModal } from './components/global/LoginModal';
import { DisclaimerModal, useDisclaimerModal } from './components/global/DisclaimerModal';
import { ToastProvider } from './components/global/Toast';
import { setLoginModalOpen } from './components/global/FeatureInfoModal';
import { Loader2 } from 'lucide-react';
import { ROUTES, VIEW_TO_ROUTE, getViewFromPath, isAuthRequiredRoute } from './routes';
import { syncPreferencesFromAPI } from './services/user-preferences';
import { COLORS, GRADIENTS, hexToRgba } from './config/colors';

// Debug logging
const DEBUG_PREFIX = '[APP.JSX]';
console.log(`${DEBUG_PREFIX} 🚀 Module loaded`);

// ============================================================================
// CRITICAL PATH COMPONENTS (loaded immediately)
// These are needed for the initial render / homepage
// ============================================================================
import QuadDashboard from './components/global/QuadDashboard';

// ============================================================================
// LAZY-LOADED COMPONENTS
// These are loaded on-demand when the user navigates to them
// ============================================================================

// Live Training (Roleplay) - includes ElevenLabs SDK (~100KB+)
const RoleplayDashboard = lazy(() => import('./components/roleplay/RoleplayDashboard'));
const RoleplayDeviceSetup = lazy(() => import('./components/roleplay/RoleplayDeviceSetup'));
const RoleplayVariablesPage = lazy(() => import('./components/roleplay/RoleplayVariablesPage'));
const RoleplaySessionUnified = lazy(() => import('./components/roleplay/RoleplaySessionUnified'));

// Session History
const SessionHistory = lazy(() => import('./components/global/SessionHistory').then(m => ({ default: m.default })));
const SessionDetailView = lazy(() => import('./components/session-detail/SessionDetailView'));

// Simulator (Scenario Training)
const SimulatorApp = lazy(() => import('./components/simulator').then(m => ({ default: m.SimulatorApp })));

// Video Training
const VideoTrainingApp = lazy(() => import('./components/video-training').then(m => ({ default: m.VideoTrainingApp })));

// Rhetorik-Gym
const RhetorikGym = lazy(() => import('./components/rhetorik-gym').then(m => ({ default: m.RhetorikGym })));
const GameSession = lazy(() => import('./components/rhetorik-gym').then(m => ({ default: m.GameSession })));

// Smart Briefing
const SmartBriefingApp = lazy(() => import('./components/smartbriefing').then(m => ({ default: m.SmartBriefingApp })));

// Decision Board
const DecisionBoardApp = lazy(() => import('./components/decision-board').then(m => ({ default: m.DecisionBoardApp })));

// Ikigai
const IkigaiApp = lazy(() => import('./components/ikigai/IkigaiApp'));

// KI-Coach
const KiCoachApp = lazy(() => import('./components/ki-coach').then(m => ({ default: m.KiCoachApp })));

// Usage Limits
const UsageLimitsDisplay = lazy(() => import('./components/global/UsageLimitsDisplay'));

// Admin components (only loaded for admins)
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard'));
const ScenarioManager = lazy(() => import('./components/admin/ScenarioManager'));
const SimulatorScenarioManager = lazy(() => import('./components/admin/SimulatorScenarioManager'));
const VideoTrainingManager = lazy(() => import('./components/admin/VideoTrainingManager'));
const PartnerManager = lazy(() => import('./components/admin/PartnerManager'));

// CONNECTION_MODES - defined inline to avoid importing the adapter module eagerly
const CONNECTION_MODES = {
  DIRECT: 'direct',
  PROXY: 'proxy',
};

// SESSION_TABS - defined inline to avoid async dependency
const SESSION_TABS = {
  BRIEFINGS: 'briefings',
  SIMULATOR: 'simulator',
  VIDEO: 'video',
  ROLEPLAY: 'roleplay',
};

/**
 * Lazy Load Fallback Component
 * Shown while lazy-loaded components are being fetched
 */
const LazyLoadFallback = () => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px',
      gap: '16px',
    }}
  >
    <div
      style={{
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        background: `linear-gradient(135deg, ${COLORS.sky[400]} 0%, ${COLORS.indigo[400]} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'pulse 1.5s ease-in-out infinite',
      }}
    >
      <Loader2
        size={24}
        color="white"
        style={{ animation: 'spin 1s linear infinite' }}
      />
    </div>
    <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px' }}>
      Modul wird geladen...
    </p>
    <style>
      {`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
      `}
    </style>
  </div>
);

// Track if initial splash has been shown - persists across all renders
let initialSplashShown = false;

/**
 * Modern Loading Screen Component
 * Shown ONLY on initial app load, never on navigation
 */
const BrandingLoadingSpinner = () => {
  // Mark splash as shown on first render
  React.useEffect(() => {
    console.log(`${DEBUG_PREFIX} 🔄 BrandingLoadingSpinner MOUNT - marking initialSplashShown=true`);
    initialSplashShown = true;
    return () => {
      console.log(`${DEBUG_PREFIX} 🔄 BrandingLoadingSpinner UNMOUNT`);
    };
  }, []);

  return (
    <div
      className="fullscreen-loader"
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
        background: `linear-gradient(135deg, ${COLORS.slate[900]} 0%, ${COLORS.slate[800]} 50%, ${COLORS.slate[900]} 100%)`,
        zIndex: 9999,
      }}
    >
      {/* Animated background circles */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '10%',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: `radial-gradient(circle, ${hexToRgba(COLORS.sky[400], 0.1)} 0%, transparent 70%)`,
        animation: 'float 6s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '20%',
        right: '10%',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: `radial-gradient(circle, ${hexToRgba(COLORS.violet[500], 0.1)} 0%, transparent 70%)`,
        animation: 'float 8s ease-in-out infinite reverse',
      }} />

      {/* Main content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '32px',
          zIndex: 1,
        }}
      >
        {/* Logo icon */}
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '24px',
            background: `linear-gradient(135deg, ${COLORS.sky[400]} 0%, ${COLORS.indigo[400]} 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 20px 40px ${hexToRgba(COLORS.sky[400], 0.3)}`,
            animation: 'pulse 2s ease-in-out infinite',
          }}
        >
          <svg
            width="44"
            height="44"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>

        {/* Brand name */}
        <div style={{ textAlign: 'center', color: 'white' }}>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 700,
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            Karriereheld
          </h1>
          <p
            style={{
              fontSize: '15px',
              opacity: 0.6,
              margin: '8px 0 0 0',
              fontWeight: 400,
            }}
          >
            wird geladen...
          </p>
        </div>

        {/* Loading bar */}
        <div
          style={{
            width: '200px',
            height: '4px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '2px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: '40%',
              height: '100%',
              background: `linear-gradient(90deg, ${COLORS.sky[400]}, ${COLORS.indigo[400]}, ${COLORS.sky[400]})`,
              backgroundSize: '200% 100%',
              borderRadius: '2px',
              animation: 'loading 1.5s ease-in-out infinite',
            }}
          />
        </div>
      </div>

      <style>
        {`
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
          @keyframes loading {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(150%); }
            100% { transform: translateX(400%); }
          }
        `}
      </style>
    </div>
  );
};

// View constants - kept for backward compatibility with sidebar
const VIEWS = {
  OVERVIEW: 'overview',
  DASHBOARD: 'dashboard',
  ROLEPLAY_VARIABLES: 'roleplay_variables',
  ROLEPLAY_DEVICE_SETUP: 'roleplay_device_setup',
  ROLEPLAY: 'roleplay',
  ROLEPLAY_PROXY: 'roleplay_proxy',
  SIMULATOR: 'simulator',
  VIDEO_TRAINING: 'video_training',
  SMART_BRIEFING: 'smart_briefing',
  DECISION_BOARD: 'decision_board',
  HISTORY: 'history',
  SESSION_DETAIL: 'session_detail',
  USAGE_LIMITS: 'usage_limits',
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
 * Helper to scroll to top of page
 */
const scrollToTop = () => {
  requestAnimationFrame(() => {
    window.scrollTo(0, 0);

    const appContainer = document.getElementById('bewerbungstrainer-app');
    if (appContainer) {
      appContainer.scrollTop = 0;
    }

    const mainContent = document.querySelector('[data-main-content]');
    if (mainContent) {
      mainContent.scrollTop = 0;
    }

    const scrollableParents = document.querySelectorAll('.overflow-y-auto, .overflow-auto, [style*="overflow"]');
    scrollableParents.forEach(el => {
      if (el.scrollTop > 0) {
        el.scrollTop = 0;
      }
    });
  });
};

/**
 * Get the WP admin bar height (if visible and in viewport)
 * The admin bar is position: fixed on desktop but can be scrollable on some mobile themes
 * Mobile admin bar is typically 46px, desktop is 32px
 */
function getAdminBarHeight() {
  // Check if WordPress admin-bar class is present on body/html
  const hasAdminBarClass = document.body.classList.contains('admin-bar') ||
                           document.documentElement.classList.contains('admin-bar');

  const adminBar = document.getElementById('wpadminbar');

  // If admin bar element exists, use its actual dimensions
  if (adminBar) {
    const rect = adminBar.getBoundingClientRect();
    const style = window.getComputedStyle(adminBar);
    const isVisible = style.display !== 'none' && style.visibility !== 'hidden';

    if (!isVisible) return 0;

    // If admin bar is scrolled out of view (bottom is <= 0), return 0
    if (rect.bottom <= 0) return 0;

    // If admin bar is partially visible, return how much is still visible
    if (rect.top < 0) {
      return Math.max(0, rect.bottom);
    }

    return adminBar.offsetHeight;
  }

  // Fallback: If admin-bar class is present but element not found yet, use CSS defaults
  // WordPress mobile admin bar is 46px, desktop is 32px
  if (hasAdminBarClass) {
    const isMobile = window.innerWidth <= 782; // WordPress mobile breakpoint
    return isMobile ? 46 : 32;
  }

  return 0;
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
 * Uses React Router for navigation
 */
function AppContent() {
  // ===== ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS =====
  // React Router hooks
  const navigate = useNavigate();
  const location = useLocation();

  // Auth context and loading state
  const { isAuthenticated, authLoading, isLoading, demoCode } = usePartner();
  const { isAdmin } = useAuth();

  // Get current view from URL path (for sidebar active state)
  const currentView = getViewFromPath(location.pathname);
  const [headerOffset, setHeaderOffset] = useState(0);

  // Roleplay state
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [roleplayVariables, setRoleplayVariables] = useState({});
  const [roleplayMicrophoneId, setRoleplayMicrophoneId] = useState(null);
  const [roleplayConnectionMode, setRoleplayConnectionMode] = useState('websocket'); // 'websocket' or 'proxy'

  // Session history state
  const [selectedSession, setSelectedSession] = useState(null);
  const [historyInitialTab, setHistoryInitialTab] = useState(null);

  // Rhetorik-Gym state
  const [gameConfig, setGameConfig] = useState(null);

  // Login modal state
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const openLoginModal = () => {
    setIsLoginModalOpen(true);
    setLoginModalOpen(true); // Notify FeatureInfoModal to suppress auto-show
  };
  const closeLoginModal = () => {
    setIsLoginModalOpen(false);
    setLoginModalOpen(false); // Allow FeatureInfoModal auto-show again
  };

  // Disclaimer modal state
  const {
    isOpen: isDisclaimerModalOpen,
    closeDisclaimerModal,
    checkDisclaimerStatus,
  } = useDisclaimerModal();

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

  // Check disclaimer status on initial auth (page load when already logged in)
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      checkDisclaimerStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, authLoading]);

  // Sync user preferences from API when authenticated or demo user
  // Add small delay to allow browser to fully process session cookie after login
  // This prevents "cookie check failed" errors on immediate API calls
  useEffect(() => {
    if (!authLoading && (isAuthenticated || demoCode)) {
      const timer = setTimeout(() => {
        syncPreferencesFromAPI(isAuthenticated, demoCode);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, authLoading, demoCode]);

  /**
   * Execute a pending action after successful login
   */
  const executePendingAction = useCallback((action) => {
    if (!action) return;


    switch (action.type) {
      case 'SELECT_ROLEPLAY_SCENARIO':
        // Store the scenario - RoleplayDashboard will open the variables dialog
        setPendingRoleplayScenario(action.scenario);
        // Stay on dashboard view (already there)
        navigate(ROUTES.LIVE_TRAINING);
        break;
      case 'SELECT_SIMULATOR_SCENARIO':
        // Store the scenario - SimulatorDashboard will handle it
        setPendingSimulatorScenario(action.scenario);
        navigate(ROUTES.SCENARIO_TRAINING);
        break;
      case 'START_GYM_GAME':
        setGameConfig(action.config);
        navigate(ROUTES.RHETORIK_GYM_SESSION, { state: { gameConfig: action.config } });
        break;
      case 'SELECT_GYM_MODE':
        // Store the mode - RhetorikGym will handle it
        setPendingGymMode(action.mode);
        navigate(ROUTES.RHETORIK_GYM);
        break;
      case 'SELECT_VIDEO_TRAINING_SCENARIO':
        // Store the scenario - VideoTrainingApp will handle it
        setPendingVideoTrainingScenario(action.scenario);
        navigate(ROUTES.VIDEO_TRAINING);
        break;
      default:
        console.warn('Unknown pending action type:', action.type);
    }
  }, [navigate]);

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

    // Don't show login modal while auth is still being checked
    // This prevents the modal from flashing briefly after page reload
    if (authLoading) {
      return false;
    }

    // User not logged in - store pending action and show login modal
    if (actionData) {
      setPendingAction(actionData);
    }
    openLoginModal();
    return false;
  }, [isAuthenticated, authLoading]);

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

  // ===== SCROLL TO TOP ON EVERY ROUTE CHANGE =====
  useEffect(() => {
    // Scroll to top whenever the route changes
    scrollToTop();
  }, [location.pathname]);

  // ===== NAVIGATION HANDLER =====
  const handleSidebarNavigate = useCallback((viewId) => {
    // Scroll to top on every navigation
    scrollToTop();

    // Reset video training when navigating via sidebar
    if (viewId === 'video_training') {
      setVideoTrainingResetKey(prev => prev + 1);
    }

    // Use VIEW_TO_ROUTE mapping or fall back to overview
    const route = VIEW_TO_ROUTE[viewId];
    if (route) {
      navigate(route);
    } else {
      navigate(ROUTES.OVERVIEW);
    }
  }, [navigate]);

  // ===== ROLEPLAY HANDLERS =====
  const handleSelectScenario = useCallback((scenario) => {
    setSelectedScenario(scenario);
    setRoleplayVariables({});
    setRoleplayMicrophoneId(null); // Reset microphone selection
    navigate(ROUTES.LIVE_TRAINING_SETUP, { state: { scenario } });
  }, [navigate]);

  const handleRoleplayVariablesNext = useCallback((variables) => {
    setRoleplayVariables(variables);
    navigate(ROUTES.LIVE_TRAINING_DEVICES, { state: { scenario: selectedScenario, variables } });
  }, [navigate, selectedScenario]);

  const handleRoleplayVariablesBack = useCallback(() => {
    setSelectedScenario(null);
    setRoleplayVariables({});
    navigate(ROUTES.LIVE_TRAINING);
  }, [navigate]);

  const handleRoleplayDeviceSetupComplete = useCallback(({ selectedMicrophoneId, connectionMode = 'websocket' }) => {
    setRoleplayMicrophoneId(selectedMicrophoneId);
    setRoleplayConnectionMode(connectionMode);

    // Navigate to appropriate session based on connection mode
    const route = connectionMode === 'proxy' ? ROUTES.LIVE_TRAINING_PROXY : ROUTES.LIVE_TRAINING_SESSION;
    navigate(route, {
      state: {
        scenario: selectedScenario,
        variables: roleplayVariables,
        microphoneId: selectedMicrophoneId
      }
    });
  }, [navigate, selectedScenario, roleplayVariables]);

  const handleRoleplayDeviceSetupBack = useCallback(() => {
    setRoleplayMicrophoneId(null);
    navigate(ROUTES.LIVE_TRAINING_SETUP, { state: { scenario: selectedScenario } });
  }, [navigate, selectedScenario]);

  const handleEndRoleplay = useCallback(() => {
    setSelectedScenario(null);
    setRoleplayVariables({});
    navigate(ROUTES.LIVE_TRAINING);
  }, [navigate]);

  const handleNavigateToSession = useCallback((session) => {
    setSelectedScenario(null);
    setRoleplayVariables({});
    setSelectedSession(session);
    navigate(`/verlauf/${session.type || 'roleplay'}/${session.id}`, { state: { session } });
  }, [navigate]);

  // ===== HISTORY HANDLERS =====
  const handleOpenHistory = useCallback((tab = null) => {
    setHistoryInitialTab(tab);
    navigate(ROUTES.HISTORY, { state: { initialTab: tab } });
  }, [navigate]);

  const handleCloseHistory = useCallback(() => {
    setHistoryInitialTab(null);
    navigate(ROUTES.LIVE_TRAINING);
  }, [navigate]);

  // Navigate to history with a specific tab
  const handleNavigateToHistoryWithTab = useCallback((tabId) => {
    const tabMap = {
      'briefings': SESSION_TABS.BRIEFINGS,
      'simulator': SESSION_TABS.SIMULATOR,
      'video': SESSION_TABS.VIDEO,
      'roleplay': SESSION_TABS.ROLEPLAY,
    };
    const tab = tabMap[tabId] || null;
    setHistoryInitialTab(tab);
    navigate(ROUTES.HISTORY, { state: { initialTab: tab } });
  }, [navigate]);

  const handleSelectSession = useCallback((session) => {
    setSelectedSession(session);
    navigate(`/verlauf/${session.type || 'roleplay'}/${session.id}`, { state: { session } });
  }, [navigate]);

  const handleCloseSessionDetail = useCallback(() => {
    setSelectedSession(null);
    navigate(ROUTES.HISTORY);
  }, [navigate]);

  // ===== SIMULATOR SESSION HANDLERS =====
  const handleContinueSession = useCallback((session, scenario) => {
    setPendingContinueSession({ session, scenario });
    navigate(ROUTES.SCENARIO_TRAINING);
  }, [navigate]);

  const handleRepeatSession = useCallback((session, scenario, type) => {
    // Determine session type from parameter or session object
    const sessionType = type || session?.type;

    if (sessionType === 'roleplay') {
      // For roleplay, set the scenario and navigate to Live Training
      if (scenario) {
        setPendingRoleplayScenario(scenario);
      }
      navigate(ROUTES.LIVE_TRAINING);
    } else if (sessionType === 'video') {
      // For video training, set the scenario and navigate to Video Training
      if (scenario) {
        setPendingVideoTrainingScenario(scenario);
      }
      navigate(ROUTES.VIDEO_TRAINING);
    } else {
      // Default: Simulator (Szenario-Training)
      setPendingRepeatSession({ session, scenario });
      navigate(ROUTES.SCENARIO_TRAINING);
    }
  }, [navigate]);

  // ===== RHETORIK-GYM HANDLERS =====
  const handleStartGame = useCallback((config) => {
    setGameConfig(config);
    navigate(ROUTES.RHETORIK_GYM_SESSION, { state: { gameConfig: config } });
  }, [navigate]);

  const handleGameBack = useCallback(() => {
    setGameConfig(null);
    navigate(ROUTES.RHETORIK_GYM);
  }, [navigate]);

  const handleGameComplete = useCallback((result) => {
    // Could navigate to a results view or stay in session
  }, []);

  // Admin route guard - redirects non-admins to overview
  const AdminRoute = useCallback(({ children }) => {
    if (!isAdmin) {
      return <QuadDashboard onNavigate={handleSidebarNavigate} />;
    }
    return children;
  }, [isAdmin, handleSidebarNavigate]);

  // ===== CONDITIONAL RETURNS AFTER ALL HOOKS =====
  // Show loading spinner ONLY on initial app load, not on navigation
  // Once the splash has been shown, never show it again
  console.log(`${DEBUG_PREFIX} 🔍 Loading check: isLoading=${isLoading}, initialSplashShown=${initialSplashShown}, showSpinner=${isLoading && !initialSplashShown}`);
  if (isLoading && !initialSplashShown) {
    console.log(`${DEBUG_PREFIX} ⏳ Showing BrandingLoadingSpinner`);
    return <BrandingLoadingSpinner />;
  }

  // Helper to get state from location or fall back to component state
  const getScenario = () => location.state?.scenario || selectedScenario;
  const getVariables = () => location.state?.variables || roleplayVariables;
  const getMicrophoneId = () => location.state?.microphoneId || roleplayMicrophoneId;
  const getGameConfigFromState = () => location.state?.gameConfig || gameConfig;
  const getSessionFromState = () => location.state?.session || selectedSession;
  const getInitialTabFromState = () => location.state?.initialTab || historyInitialTab;

  // ===== CONTENT RENDERING WITH ROUTES =====
  const renderContent = () => (
    <Suspense fallback={<LazyLoadFallback />}>
      <Routes>
        {/* Overview / Home - Quad Dashboard (not lazy - critical path) */}
        <Route
          path="/"
          element={<QuadDashboard onNavigate={handleSidebarNavigate} />}
        />
        <Route
          path={ROUTES.OVERVIEW}
          element={<QuadDashboard onNavigate={handleSidebarNavigate} />}
        />

      {/* Live Training (Roleplay) Routes */}
      <Route
        path={ROUTES.LIVE_TRAINING}
        element={
          <RoleplayDashboard
            onSelectScenario={handleSelectScenario}
            onOpenHistory={handleOpenHistory}
            isAuthenticated={isAuthenticated}
            requireAuth={requireAuth}
            setPendingAction={setPendingAction}
            pendingScenario={pendingRoleplayScenario}
            clearPendingScenario={() => setPendingRoleplayScenario(null)}
            onNavigateToHistory={() => handleNavigateToHistoryWithTab('roleplay')}
          />
        }
      />
      <Route
        path={ROUTES.LIVE_TRAINING_SETUP}
        element={
          <RoleplayVariablesPage
            scenario={getScenario()}
            onBack={handleRoleplayVariablesBack}
            onNext={handleRoleplayVariablesNext}
          />
        }
      />
      <Route
        path={ROUTES.LIVE_TRAINING_DEVICES}
        element={
          <RoleplayDeviceSetup
            scenario={getScenario()}
            onBack={handleRoleplayDeviceSetupBack}
            onStart={handleRoleplayDeviceSetupComplete}
          />
        }
      />
      <Route
        path={ROUTES.LIVE_TRAINING_SESSION}
        element={
          <RoleplaySessionUnified
            scenario={getScenario()}
            variables={getVariables()}
            selectedMicrophoneId={getMicrophoneId()}
            connectionMode={CONNECTION_MODES.DIRECT}
            onEnd={handleEndRoleplay}
            onNavigateToSession={handleNavigateToSession}
          />
        }
      />
      <Route
        path={ROUTES.LIVE_TRAINING_PROXY}
        element={
          <RoleplaySessionUnified
            scenario={getScenario()}
            variables={getVariables()}
            selectedMicrophoneId={getMicrophoneId()}
            connectionMode={CONNECTION_MODES.PROXY}
            onEnd={handleEndRoleplay}
            onNavigateToSession={handleNavigateToSession}
          />
        }
      />

      {/* Scenario Training (Simulator) */}
      <Route
        path={ROUTES.SCENARIO_TRAINING}
        element={
          <SimulatorApp
            isAuthenticated={isAuthenticated}
            requireAuth={requireAuth}
            setPendingAction={setPendingAction}
            pendingContinueSession={pendingContinueSession}
            clearPendingContinueSession={() => setPendingContinueSession(null)}
            pendingRepeatSession={pendingRepeatSession}
            clearPendingRepeatSession={() => setPendingRepeatSession(null)}
            onNavigateToHistory={() => handleNavigateToHistoryWithTab('simulator')}
          />
        }
      />

      {/* Video Training */}
      <Route
        path={ROUTES.VIDEO_TRAINING}
        element={
          <VideoTrainingApp
            key={videoTrainingResetKey}
            isAuthenticated={isAuthenticated}
            requireAuth={requireAuth}
            setPendingAction={setPendingAction}
            pendingScenario={pendingVideoTrainingScenario}
            clearPendingScenario={() => setPendingVideoTrainingScenario(null)}
            onNavigateToHistory={() => handleNavigateToHistoryWithTab('video')}
          />
        }
      />

      {/* Smart Briefing */}
      <Route
        path={ROUTES.SMART_BRIEFING}
        element={
          <SmartBriefingApp
            isAuthenticated={isAuthenticated}
            requireAuth={requireAuth}
            setPendingAction={setPendingAction}
            demoCode={demoCode}
            onNavigateToSimulator={() => navigate(ROUTES.SCENARIO_TRAINING)}
            onNavigateToHistory={() => handleNavigateToHistoryWithTab('briefings')}
          />
        }
      />

      {/* Decision Board (Entscheidungs-Kompass) */}
      <Route
        path={ROUTES.DECISION_BOARD}
        element={
          <DecisionBoardApp
            isAuthenticated={isAuthenticated}
            requireAuth={requireAuth}
            setPendingAction={setPendingAction}
            onNavigateToHistory={() => navigate(ROUTES.HISTORY)}
          />
        }
      />

      {/* Ikigai Career Pathfinder */}
      <Route
        path={ROUTES.IKIGAI}
        element={
          <IkigaiApp
            isAuthenticated={isAuthenticated}
            requireAuth={requireAuth}
            setPendingAction={setPendingAction}
            onNavigateToHistory={() => navigate(ROUTES.HISTORY)}
          />
        }
      />

      {/* KI-Coach */}
      <Route
        path={ROUTES.KI_COACH}
        element={
          <KiCoachApp
            isAuthenticated={isAuthenticated}
            requireAuth={requireAuth}
            onNavigate={handleSidebarNavigate}
            onNavigateToHistory={() => navigate(ROUTES.HISTORY)}
          />
        }
      />

      {/* Rhetorik-Gym */}
      <Route
        path={ROUTES.RHETORIK_GYM}
        element={
          <RhetorikGym
            onStartGame={handleStartGame}
            isAuthenticated={isAuthenticated}
            requireAuth={requireAuth}
            setPendingAction={setPendingAction}
          />
        }
      />
      <Route
        path={ROUTES.RHETORIK_GYM_SESSION}
        element={
          <GameSession
            gameConfig={getGameConfigFromState()}
            onBack={handleGameBack}
            onComplete={handleGameComplete}
          />
        }
      />

      {/* History */}
      <Route
        path={ROUTES.HISTORY}
        element={
          <SessionHistory
            onBack={handleCloseHistory}
            onSelectSession={handleSelectSession}
            isAuthenticated={isAuthenticated}
            onLoginClick={openLoginModal}
            onContinueSession={handleContinueSession}
            onRepeatSession={handleRepeatSession}
            initialTab={getInitialTabFromState()}
            onNavigateToModule={handleSidebarNavigate}
          />
        }
      />

      {/* Session Detail - Dynamic route */}
      <Route
        path="/verlauf/:sessionType/:sessionId"
        element={
          <SessionDetailView
            session={getSessionFromState()}
            onBack={handleCloseSessionDetail}
            onRepeatSession={handleRepeatSession}
          />
        }
      />

      {/* Usage Limits */}
      <Route
        path={ROUTES.USAGE_LIMITS}
        element={
          <div style={{ padding: '24px', maxWidth: '600px', margin: '0 auto' }}>
            <UsageLimitsDisplay
              onNavigateToRoleplay={() => navigate(ROUTES.LIVE_TRAINING)}
            />
          </div>
        }
      />

      {/* Admin Routes */}
      <Route
        path={ROUTES.ADMIN}
        element={
          <AdminRoute>
            <div style={{ padding: '24px' }}>
              <AdminDashboard onNavigate={handleSidebarNavigate} />
            </div>
          </AdminRoute>
        }
      />
      <Route
        path={ROUTES.ADMIN_ROLEPLAYS}
        element={
          <AdminRoute>
            <div style={{ padding: '24px' }}>
              <ScenarioManager onBack={() => navigate(ROUTES.ADMIN)} />
            </div>
          </AdminRoute>
        }
      />
      <Route
        path={ROUTES.ADMIN_SIMULATOR}
        element={
          <AdminRoute>
            <div style={{ padding: '24px' }}>
              <SimulatorScenarioManager onBack={() => navigate(ROUTES.ADMIN)} />
            </div>
          </AdminRoute>
        }
      />
      <Route
        path={ROUTES.ADMIN_VIDEO}
        element={
          <AdminRoute>
            <div style={{ padding: '24px' }}>
              <VideoTrainingManager onBack={() => navigate(ROUTES.ADMIN)} />
            </div>
          </AdminRoute>
        }
      />
      <Route
        path={ROUTES.ADMIN_PARTNERS}
        element={
          <AdminRoute>
            <div style={{ padding: '24px' }}>
              <PartnerManager onBack={() => navigate(ROUTES.ADMIN)} />
            </div>
          </AdminRoute>
        }
      />

        {/* Fallback - redirect to overview */}
        <Route
          path="*"
          element={<QuadDashboard onNavigate={handleSidebarNavigate} />}
        />
      </Routes>
    </Suspense>
  );

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

            // If user is on a protected route and cancels login, redirect to overview
            if (!isAuthenticated && isAuthRequiredRoute(location.pathname)) {
              navigate(ROUTES.HOME);
            }
          }}
          onLoginSuccess={async (user) => {

            // Check disclaimer status after login
            await checkDisclaimerStatus();

            // Execute pending action if there was one
            if (pendingAction) {
              executePendingAction(pendingAction);
              setPendingAction(null);
            }
          }}
        />

        {/* Disclaimer Modal */}
        <DisclaimerModal
          isOpen={isDisclaimerModalOpen}
          onClose={closeDisclaimerModal}
          onAcknowledge={(dontShowAgain) => {
            closeDisclaimerModal();
          }}
        />
    </>
  );
}

/**
 * App - Main wrapper with providers and router
 * Uses HashRouter for WordPress shortcode compatibility
 */
function App() {
  return (
    <HashRouter>
      <PartnerProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </PartnerProvider>
    </HashRouter>
  );
}

export default App;
