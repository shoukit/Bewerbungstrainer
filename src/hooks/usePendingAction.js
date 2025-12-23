/**
 * usePendingAction Hook
 *
 * Manages pending actions that require authentication.
 * Stores actions to execute after successful login.
 *
 * Used by: App.jsx and components that need auth-gated actions
 */

import { useState, useCallback } from 'react';

/**
 * Pending action types for type-safe action handling
 */
export const PENDING_ACTION_TYPES = {
  SELECT_ROLEPLAY_SCENARIO: 'SELECT_ROLEPLAY_SCENARIO',
  SELECT_SIMULATOR_SCENARIO: 'SELECT_SIMULATOR_SCENARIO',
  START_GYM_GAME: 'START_GYM_GAME',
  SELECT_GYM_MODE: 'SELECT_GYM_MODE',
  SELECT_VIDEO_TRAINING_SCENARIO: 'SELECT_VIDEO_TRAINING_SCENARIO',
  CONTINUE_SESSION: 'CONTINUE_SESSION',
  REPEAT_SESSION: 'REPEAT_SESSION',
};

/**
 * Custom hook for managing pending actions that require authentication
 *
 * @param {Object} options - Configuration options
 * @param {boolean} options.isAuthenticated - Whether user is currently authenticated
 * @param {Function} options.onOpenLogin - Callback to open login modal
 * @returns {Object} Pending action controls and state
 *
 * @example
 * const { requireAuth, pendingAction, executePendingAction, clearPendingAction } = usePendingAction({
 *   isAuthenticated,
 *   onOpenLogin: () => setLoginModalOpen(true),
 * });
 *
 * // In component - gate an action behind auth
 * const handleSelectScenario = (scenario) => {
 *   requireAuth(
 *     () => startScenario(scenario),
 *     { type: PENDING_ACTION_TYPES.SELECT_SIMULATOR_SCENARIO, scenario }
 *   );
 * };
 *
 * // After login success
 * if (pendingAction) {
 *   executePendingAction(pendingAction, actionHandlers);
 *   clearPendingAction();
 * }
 */
export function usePendingAction({ isAuthenticated, onOpenLogin }) {
  // Main pending action state
  const [pendingAction, setPendingAction] = useState(null);

  /**
   * Require authentication for an action
   * If authenticated, executes immediately. Otherwise stores for after login.
   *
   * @param {Function} action - Immediate action to execute if authenticated
   * @param {Object} actionData - Data to store if action is deferred
   * @returns {boolean} True if action was executed immediately
   */
  const requireAuth = useCallback((action, actionData = null) => {
    if (isAuthenticated) {
      // User is logged in - execute action immediately
      action();
      return true;
    }

    // User not logged in - store pending action and show login modal
    if (actionData) {
      setPendingAction(actionData);
    }

    if (onOpenLogin) {
      onOpenLogin();
    }

    return false;
  }, [isAuthenticated, onOpenLogin]);

  /**
   * Execute a pending action with provided handlers
   *
   * @param {Object} action - The pending action to execute
   * @param {Object} handlers - Map of action type to handler function
   */
  const executePendingAction = useCallback((action, handlers) => {
    if (!action || !handlers) return;

    const handler = handlers[action.type];
    if (handler) {
      handler(action);
    } else {
      console.warn('[usePendingAction] Unknown action type:', action.type);
    }
  }, []);

  /**
   * Clear the pending action
   */
  const clearPendingAction = useCallback(() => {
    setPendingAction(null);
  }, []);

  /**
   * Set a pending action directly
   */
  const setAction = useCallback((action) => {
    setPendingAction(action);
  }, []);

  return {
    // State
    pendingAction,

    // Actions
    requireAuth,
    executePendingAction,
    clearPendingAction,
    setPendingAction: setAction,

    // Helpers
    hasPendingAction: pendingAction !== null,
    pendingActionType: pendingAction?.type || null,
  };
}

/**
 * Create action data helper
 * @param {string} type - Action type from PENDING_ACTION_TYPES
 * @param {Object} data - Additional action data
 * @returns {Object} Formatted action object
 */
export function createPendingAction(type, data = {}) {
  return { type, ...data };
}

export default usePendingAction;
