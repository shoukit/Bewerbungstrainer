/**
 * Centralized route configuration
 * All application routes are defined here for consistency
 */

export const ROUTES = {
  // Core pages
  HOME: '/',
  MODULES: '/modules',
  WIZARD: '/wizard',

  // Interview Trainer Module
  INTERVIEW: '/interview',
  INTERVIEW_SETUP: '/interview/setup',
  INTERVIEW_SESSION: '/interview/session/:sessionId',
  INTERVIEW_FEEDBACK: '/interview/feedback/:sessionId',

  // Situations Coach Module
  SITUATIONS: '/situations',
  SITUATIONS_BROWSE: '/situations/browse',
  SITUATIONS_SCENARIO: '/situations/scenario/:scenarioId',
  SITUATIONS_PRACTICE: '/situations/practice/:scenarioId',
  SITUATIONS_FEEDBACK: '/situations/feedback/:attemptId',

  // User Pages
  PROFILE: '/profile',
  HISTORY: '/history',
  SETTINGS: '/settings',

  // Special
  NOT_FOUND: '*',
};

/**
 * Helper to generate dynamic routes
 */
export const generateRoute = {
  interviewSession: (sessionId) => `/interview/session/${sessionId}`,
  interviewFeedback: (sessionId) => `/interview/feedback/${sessionId}`,
  situationsScenario: (scenarioId) => `/situations/scenario/${scenarioId}`,
  situationsPractice: (scenarioId) => `/situations/practice/${scenarioId}`,
  situationsFeedback: (attemptId) => `/situations/feedback/${attemptId}`,
};
