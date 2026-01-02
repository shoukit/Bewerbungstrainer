/**
 * User Preferences Service
 *
 * Handles user preferences with:
 * - API storage for logged-in users and demo users
 * - localStorage fallback for unauthenticated users
 * - Sync between localStorage and API
 */

import wordpressAPI from './wordpress-api';

// Preference keys
export const PREF_KEYS = {
  FEATURE_INFO_DISMISSED: 'feature_info_dismissed',
};

// localStorage key (for fallback and quick reads)
const LOCAL_STORAGE_KEY = 'karriereheld_feature_info_dismissed';

// Sync state tracking - prevents race conditions with FeatureInfoModal
let isSyncInProgress = false;
let syncPromise = null;

/**
 * Check if preferences sync is currently in progress
 * Used by FeatureInfoModal to wait for sync before auto-showing
 */
export function isPreferencesSyncInProgress() {
  return isSyncInProgress;
}

/**
 * Wait for preferences sync to complete
 * Returns immediately if no sync is in progress
 */
export async function waitForPreferencesSync() {
  if (syncPromise) {
    await syncPromise;
  }
}

/**
 * Get feature info dismissed state from localStorage
 * Used for quick synchronous reads
 */
export function getLocalFeatureInfoDismissed(featureId) {
  try {
    const dismissed = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
    return dismissed[featureId] === true;
  } catch {
    return false;
  }
}

/**
 * Set feature info dismissed state in localStorage
 * Used for quick synchronous writes
 */
export function setLocalFeatureInfoDismissed(featureId, dismissed = true) {
  try {
    const current = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
    current[featureId] = dismissed;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(current));
  } catch (e) {
    console.error('Failed to save feature info preference to localStorage:', e);
  }
}

/**
 * Get all locally dismissed features
 */
export function getAllLocalDismissed() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

/**
 * Set all local dismissed features (used for sync from API)
 */
export function setAllLocalDismissed(dismissed) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dismissed || {}));
  } catch (e) {
    console.error('Failed to save feature info preferences to localStorage:', e);
  }
}

/**
 * Sync preferences from API to localStorage
 * Call this on app load for logged-in/demo users
 *
 * @param {boolean} isAuthenticated - Whether user is logged in
 * @param {string|null} demoCode - Demo code if demo user
 */
export async function syncPreferencesFromAPI(isAuthenticated, demoCode) {
  // Only sync if user has context (logged in or demo)
  if (!isAuthenticated && !demoCode) {
    console.log('[UserPrefs] No user context, using localStorage only');
    return;
  }

  // Set sync in progress flag to prevent race conditions
  isSyncInProgress = true;

  // Create a promise that external code can await
  syncPromise = (async () => {
    try {
      console.log('[UserPrefs] Syncing preferences from API...');
      const apiPrefs = await wordpressAPI.getAllPreferences(demoCode);

      // Sync feature info dismissed state
      if (apiPrefs[PREF_KEYS.FEATURE_INFO_DISMISSED]) {
        const apiDismissed = apiPrefs[PREF_KEYS.FEATURE_INFO_DISMISSED];
        const localDismissed = getAllLocalDismissed();

        // Merge: API takes precedence, but keep local additions
        const merged = { ...localDismissed, ...apiDismissed };
        setAllLocalDismissed(merged);

        console.log('[UserPrefs] Synced feature_info_dismissed from API:', merged);
      }
    } catch (error) {
      console.error('[UserPrefs] Failed to sync preferences from API:', error);
    } finally {
      isSyncInProgress = false;
      syncPromise = null;
    }
  })();

  await syncPromise;
}

/**
 * Save feature info dismissed state to API (background, non-blocking)
 *
 * @param {boolean} isAuthenticated - Whether user is logged in
 * @param {string|null} demoCode - Demo code if demo user
 */
export async function saveFeatureInfoDismissedToAPI(isAuthenticated, demoCode) {
  // Only save to API if user has context
  if (!isAuthenticated && !demoCode) {
    return;
  }

  try {
    const dismissed = getAllLocalDismissed();
    await wordpressAPI.setPreference(PREF_KEYS.FEATURE_INFO_DISMISSED, dismissed, demoCode);
    console.log('[UserPrefs] Saved feature_info_dismissed to API');
  } catch (error) {
    console.error('[UserPrefs] Failed to save preferences to API:', error);
  }
}

/**
 * Check if feature info is dismissed (sync, uses localStorage)
 * This is the quick synchronous version for immediate UI decisions
 */
export function isFeatureInfoDismissed(featureId) {
  return getLocalFeatureInfoDismissed(featureId);
}

/**
 * Set feature info dismissed state
 * Saves to localStorage immediately, then syncs to API in background
 *
 * @param {string} featureId - Feature ID
 * @param {boolean} dismissed - Dismissed state
 * @param {boolean} isAuthenticated - Whether user is logged in
 * @param {string|null} demoCode - Demo code if demo user
 */
export function setFeatureInfoDismissed(featureId, dismissed, isAuthenticated = false, demoCode = null) {
  // Save to localStorage immediately (synchronous)
  setLocalFeatureInfoDismissed(featureId, dismissed);

  // Save to API in background (async, non-blocking)
  saveFeatureInfoDismissedToAPI(isAuthenticated, demoCode);
}

/**
 * Reset all dismissed states
 */
export function resetAllFeatureInfoDismissed() {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to reset feature info preferences:', e);
  }
}
