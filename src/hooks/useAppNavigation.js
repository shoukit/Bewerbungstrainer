/**
 * useAppNavigation Hook
 *
 * Provides navigation utilities using React Router v6.
 * Wraps useNavigate with app-specific navigation logic.
 */

import { useNavigate, useLocation } from 'react-router-dom';
import { useCallback, useEffect } from 'react';
import { ROUTES, VIEW_TO_ROUTE, getViewFromPath } from '@/routes';

/**
 * Custom navigation hook for app-wide navigation
 */
export function useAppNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  /**
   * Get current view ID based on pathname
   */
  const currentView = getViewFromPath(location.pathname);

  /**
   * Scroll to top of page
   */
  const scrollToTop = useCallback(() => {
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
  }, []);

  /**
   * Navigate to a view by ID (for backward compatibility with sidebar)
   */
  const navigateToView = useCallback((viewId, options = {}) => {
    scrollToTop();

    const route = VIEW_TO_ROUTE[viewId];
    if (route) {
      navigate(route, options);
    } else {
      console.warn(`Unknown view: ${viewId}`);
      navigate(ROUTES.OVERVIEW);
    }
  }, [navigate, scrollToTop]);

  /**
   * Navigate to a route path directly
   */
  const navigateTo = useCallback((path, options = {}) => {
    scrollToTop();
    navigate(path, options);
  }, [navigate, scrollToTop]);

  /**
   * Go back in history
   */
  const goBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  // ===== SPECIFIC NAVIGATION HELPERS =====

  /**
   * Navigate to overview/home
   */
  const goToOverview = useCallback(() => {
    navigateTo(ROUTES.OVERVIEW);
  }, [navigateTo]);

  /**
   * Navigate to live training dashboard
   */
  const goToLiveTraining = useCallback(() => {
    navigateTo(ROUTES.LIVE_TRAINING);
  }, [navigateTo]);

  /**
   * Navigate to live training setup with scenario
   */
  const goToLiveTrainingSetup = useCallback((scenario) => {
    navigateTo(ROUTES.LIVE_TRAINING_SETUP, { state: { scenario } });
  }, [navigateTo]);

  /**
   * Navigate to live training device setup
   */
  const goToLiveTrainingDevices = useCallback((scenario, variables) => {
    navigateTo(ROUTES.LIVE_TRAINING_DEVICES, { state: { scenario, variables } });
  }, [navigateTo]);

  /**
   * Navigate to live training session
   */
  const goToLiveTrainingSession = useCallback((scenario, variables, microphoneId, mode = 'websocket') => {
    const path = mode === 'proxy' ? ROUTES.LIVE_TRAINING_PROXY : ROUTES.LIVE_TRAINING_SESSION;
    navigateTo(path, { state: { scenario, variables, microphoneId } });
  }, [navigateTo]);

  /**
   * Navigate to scenario training (simulator)
   */
  const goToScenarioTraining = useCallback((options = {}) => {
    navigateTo(ROUTES.SCENARIO_TRAINING, options);
  }, [navigateTo]);

  /**
   * Navigate to video training
   */
  const goToVideoTraining = useCallback((options = {}) => {
    navigateTo(ROUTES.VIDEO_TRAINING, options);
  }, [navigateTo]);

  /**
   * Navigate to smart briefing
   */
  const goToSmartBriefing = useCallback(() => {
    navigateTo(ROUTES.SMART_BRIEFING);
  }, [navigateTo]);

  /**
   * Navigate to rhetorik gym
   */
  const goToRhetorikGym = useCallback(() => {
    navigateTo(ROUTES.RHETORIK_GYM);
  }, [navigateTo]);

  /**
   * Navigate to rhetorik gym session
   */
  const goToRhetorikGymSession = useCallback((gameConfig) => {
    navigateTo(ROUTES.RHETORIK_GYM_SESSION, { state: { gameConfig } });
  }, [navigateTo]);

  /**
   * Navigate to history
   */
  const goToHistory = useCallback((tab = null) => {
    navigateTo(ROUTES.HISTORY, { state: { initialTab: tab } });
  }, [navigateTo]);

  /**
   * Navigate to session detail
   */
  const goToSessionDetail = useCallback((sessionType, sessionId, session = null) => {
    navigateTo(`/verlauf/${sessionType}/${sessionId}`, { state: { session } });
  }, [navigateTo]);

  /**
   * Navigate to usage limits
   */
  const goToUsageLimits = useCallback(() => {
    navigateTo(ROUTES.USAGE_LIMITS);
  }, [navigateTo]);

  /**
   * Navigate to admin dashboard
   */
  const goToAdmin = useCallback(() => {
    navigateTo(ROUTES.ADMIN);
  }, [navigateTo]);

  return {
    // Current state
    currentView,
    location,

    // Generic navigation
    navigate,
    navigateTo,
    navigateToView,
    goBack,
    scrollToTop,

    // Specific navigation helpers
    goToOverview,
    goToLiveTraining,
    goToLiveTrainingSetup,
    goToLiveTrainingDevices,
    goToLiveTrainingSession,
    goToScenarioTraining,
    goToVideoTraining,
    goToSmartBriefing,
    goToRhetorikGym,
    goToRhetorikGymSession,
    goToHistory,
    goToSessionDetail,
    goToUsageLimits,
    goToAdmin,
  };
}

/**
 * Hook to scroll to top on location change
 */
export function useScrollToTopOnNavigate() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
}

export default useAppNavigation;
