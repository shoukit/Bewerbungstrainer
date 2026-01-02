/**
 * Application Routes Configuration
 *
 * Defines all routes for the application using React Router v6.
 * Routes are organized by module for clarity.
 */

// Route path constants - used throughout the app for navigation
export const ROUTES = {
  // Main routes
  HOME: '/',
  OVERVIEW: '/uebersicht',

  // Live Training (Roleplay) routes
  LIVE_TRAINING: '/live-training',
  LIVE_TRAINING_SETUP: '/live-training/vorbereitung',
  LIVE_TRAINING_DEVICES: '/live-training/geraete',
  LIVE_TRAINING_SESSION: '/live-training/session',
  LIVE_TRAINING_PROXY: '/live-training/session-proxy',

  // Scenario Training (Simulator) routes
  SCENARIO_TRAINING: '/szenario-training',

  // Video Training (Wirkungs-Analyse) routes
  VIDEO_TRAINING: '/wirkungs-analyse',

  // Smart Briefing routes
  SMART_BRIEFING: '/smart-briefing',

  // Decision Board routes
  DECISION_BOARD: '/entscheidungs-kompass',

  // Ikigai Career Pathfinder routes
  IKIGAI: '/ikigai-kompass',

  // Rhetorik-Gym routes
  RHETORIK_GYM: '/rhetorik-gym',
  RHETORIK_GYM_SESSION: '/rhetorik-gym/session',

  // History routes
  HISTORY: '/verlauf',
  SESSION_DETAIL: '/verlauf/:sessionType/:sessionId',

  // Usage limits
  USAGE_LIMITS: '/nutzung',

  // Admin routes
  ADMIN: '/admin',
  ADMIN_ROLEPLAYS: '/admin/szenarien',
  ADMIN_SIMULATOR: '/admin/simulator',
  ADMIN_VIDEO: '/admin/video',
  ADMIN_PARTNERS: '/admin/partner',
};

/**
 * Routes that require authentication
 *
 * Note: All features now use action-based auth instead of route-based auth.
 * This means users can view the public dashboard/landing page for any feature,
 * but authentication is required when they click "Start" to begin a session.
 *
 * This array is kept for potential future use but is currently empty.
 */
export const AUTH_REQUIRED_ROUTES = [
  // All features now use action-based auth (dashboard-first pattern)
];

/**
 * Check if a route requires authentication
 */
export function isAuthRequiredRoute(pathname) {
  return AUTH_REQUIRED_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'));
}

/**
 * Map old VIEWS constants to new routes for backward compatibility
 */
export const VIEW_TO_ROUTE = {
  overview: ROUTES.OVERVIEW,
  dashboard: ROUTES.LIVE_TRAINING,
  roleplay_variables: ROUTES.LIVE_TRAINING_SETUP,
  roleplay_device_setup: ROUTES.LIVE_TRAINING_DEVICES,
  roleplay: ROUTES.LIVE_TRAINING_SESSION,
  roleplay_proxy: ROUTES.LIVE_TRAINING_PROXY,
  simulator: ROUTES.SCENARIO_TRAINING,
  video_training: ROUTES.VIDEO_TRAINING,
  smart_briefing: ROUTES.SMART_BRIEFING,
  decision_board: ROUTES.DECISION_BOARD,
  ikigai: ROUTES.IKIGAI,
  history: ROUTES.HISTORY,
  session_detail: ROUTES.SESSION_DETAIL,
  usage_limits: ROUTES.USAGE_LIMITS,
  gym: ROUTES.RHETORIK_GYM,
  gym_klassiker: ROUTES.RHETORIK_GYM,
  gym_session: ROUTES.RHETORIK_GYM_SESSION,
  admin: ROUTES.ADMIN,
  admin_roleplays: ROUTES.ADMIN_ROLEPLAYS,
  admin_simulator: ROUTES.ADMIN_SIMULATOR,
  admin_video: ROUTES.ADMIN_VIDEO,
  admin_partners: ROUTES.ADMIN_PARTNERS,
};

/**
 * Map routes back to view IDs for sidebar active state
 */
export const ROUTE_TO_VIEW = {
  [ROUTES.HOME]: 'overview',
  [ROUTES.OVERVIEW]: 'overview',
  [ROUTES.LIVE_TRAINING]: 'dashboard',
  [ROUTES.LIVE_TRAINING_SETUP]: 'dashboard',
  [ROUTES.LIVE_TRAINING_DEVICES]: 'dashboard',
  [ROUTES.LIVE_TRAINING_SESSION]: 'dashboard',
  [ROUTES.LIVE_TRAINING_PROXY]: 'dashboard',
  [ROUTES.SCENARIO_TRAINING]: 'simulator',
  [ROUTES.VIDEO_TRAINING]: 'video_training',
  [ROUTES.SMART_BRIEFING]: 'smart_briefing',
  [ROUTES.DECISION_BOARD]: 'decision_board',
  [ROUTES.IKIGAI]: 'ikigai',
  [ROUTES.RHETORIK_GYM]: 'gym_klassiker',
  [ROUTES.RHETORIK_GYM_SESSION]: 'gym_klassiker',
  [ROUTES.HISTORY]: 'history',
  [ROUTES.USAGE_LIMITS]: 'usage_limits',
  [ROUTES.ADMIN]: 'admin',
  [ROUTES.ADMIN_ROLEPLAYS]: 'admin_roleplays',
  [ROUTES.ADMIN_SIMULATOR]: 'admin_simulator',
  [ROUTES.ADMIN_VIDEO]: 'admin_video',
  [ROUTES.ADMIN_PARTNERS]: 'admin_partners',
};

/**
 * Get route path for session detail
 */
export function getSessionDetailPath(sessionType, sessionId) {
  return `/verlauf/${sessionType}/${sessionId}`;
}

/**
 * Get the view ID from the current pathname
 */
export function getViewFromPath(pathname) {
  // Exact matches first
  if (ROUTE_TO_VIEW[pathname]) {
    return ROUTE_TO_VIEW[pathname];
  }

  // Check for dynamic routes
  if (pathname.startsWith('/verlauf/')) {
    return 'history';
  }

  // Default to overview
  return 'overview';
}
