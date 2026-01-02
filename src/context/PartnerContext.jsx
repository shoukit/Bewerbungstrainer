import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  getPartnerIdFromUrl,
  getPartnerConfig,
  fetchPartnerConfig,
  filterScenariosByPartner,
  filterScenariosByVisibility,
  isModuleAllowed,
  loginUser,
  logoutUser,
  getCurrentUser,
  DEFAULT_BRANDING,
} from '@/config/partners';
import { filterScenariosBySetup as filterBySetup, SCENARIO_SETUPS as FALLBACK_SETUPS, SCENARIO_SETUPS_LIST as FALLBACK_SETUPS_LIST } from '@/config/scenarioSetups';

/**
 * Partner Context
 * Provides partner configuration throughout the app for white-labeling
 */
const PartnerContext = createContext(null);

/**
 * PartnerProvider Component
 * Wraps the app and provides partner configuration and authentication to all children
 */
// Minimum splash screen duration in milliseconds
const SPLASH_MIN_DURATION = 3000;

// Track if app has been initialized (persists across re-renders)
let hasAppInitialized = false;

// LocalStorage key for cached partner config
const PARTNER_CACHE_KEY = 'bewerbungstrainer_partner_cache';

/**
 * Get cached partner config from localStorage
 */
const getCachedPartnerConfig = (partnerId) => {
  if (typeof window === 'undefined' || !partnerId) return null;
  try {
    const cached = localStorage.getItem(PARTNER_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      // Check if cached config matches the requested partner
      if (parsed && parsed.slug === partnerId) {
        console.log('🏷️ [PartnerContext] Using cached partner config for:', partnerId);
        return parsed;
      }
    }
  } catch (e) {
    console.warn('🏷️ [PartnerContext] Failed to read cached partner config:', e);
  }
  return null;
};

/**
 * Save partner config to localStorage
 */
const setCachedPartnerConfig = (config) => {
  if (typeof window === 'undefined' || !config) return;
  try {
    localStorage.setItem(PARTNER_CACHE_KEY, JSON.stringify(config));
    console.log('🏷️ [PartnerContext] Cached partner config for:', config.slug);
  } catch (e) {
    console.warn('🏷️ [PartnerContext] Failed to cache partner config:', e);
  }
};

export function PartnerProvider({ children }) {
  // Initialize partner from localStorage cache immediately to prevent flash
  const [partner, setPartner] = useState(() => {
    const partnerId = typeof window !== 'undefined' ? getPartnerIdFromUrl() : null;
    return getCachedPartnerConfig(partnerId);
  });
  const [dataLoading, setDataLoading] = useState(true); // Internal loading state for data

  // Splash screen minimum time - ensures loader shows for at least 3 seconds
  // Only on FIRST app load, not on navigation
  const [splashMinTimeElapsed, setSplashMinTimeElapsed] = useState(hasAppInitialized);

  // Setups from database
  const [setupsFromDb, setSetupsFromDb] = useState(null);
  const [setupsLoading, setSetupsLoading] = useState(true);

  // Start splash timer on mount - only if app hasn't been initialized yet
  useEffect(() => {
    if (hasAppInitialized) {
      // App was already initialized, skip splash
      setSplashMinTimeElapsed(true);
      return;
    }

    const timer = setTimeout(() => {
      setSplashMinTimeElapsed(true);
      hasAppInitialized = true; // Mark as initialized for future navigations
    }, SPLASH_MIN_DURATION);

    return () => clearTimeout(timer);
  }, []);

  // Combined loading state: show loader until BOTH conditions are met
  // 1. Minimum splash time has elapsed (3 seconds) - only on first load
  // 2. Data has finished loading
  const isLoading = !splashMinTimeElapsed || dataLoading;

  // Authentication state
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Demo user state
  const [demoCode, setDemoCodeState] = useState(() => {
    // Initialize from localStorage if available
    if (typeof window !== 'undefined') {
      return localStorage.getItem('bewerbungstrainer_demo_code') || null;
    }
    return null;
  });
  const [isDemoUser, setIsDemoUser] = useState(false);

  // Scenario Setup selection state
  const [selectedSetup, setSelectedSetupState] = useState(() => {
    // Initialize from localStorage if available
    if (typeof window !== 'undefined') {
      return localStorage.getItem('bewerbungstrainer_selected_setup') || null;
    }
    return null;
  });

  /**
   * Get SCENARIO_SETUPS object (from DB or fallback)
   */
  const getSetupsObject = useCallback(() => {
    if (setupsFromDb) {
      const obj = {};
      setupsFromDb.forEach(s => {
        obj[s.slug] = {
          id: s.slug,
          name: s.name,
          description: s.description,
          icon: s.icon,
          color: s.color,
          focus: s.focus,
          targetGroup: s.target_group,
        };
      });
      return obj;
    }
    return FALLBACK_SETUPS;
  }, [setupsFromDb]);

  /**
   * Get setups list (from DB or fallback)
   */
  const getSetupsList = useCallback(() => {
    if (setupsFromDb) {
      return setupsFromDb.map(s => ({
        id: s.slug,
        name: s.name,
        description: s.description,
        icon: s.icon,
        color: s.color,
        focus: s.focus,
        targetGroup: s.target_group,
      }));
    }
    return FALLBACK_SETUPS_LIST;
  }, [setupsFromDb]);

  /**
   * Load setups from database
   */
  const loadSetupsFromApi = async () => {
    try {
      const apiUrl = window.bewerbungstrainerConfig?.apiUrl || '/wp-json/bewerbungstrainer/v1';
      const response = await fetch(`${apiUrl}/setups`, {
        method: 'GET',
        credentials: 'same-origin',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.setups) {
          setSetupsFromDb(data.data.setups);
          return data.data.setups;
        }
      }
    } catch (error) {
      console.error('Failed to load setups from API:', error);
    }
    setSetupsLoading(false);
    return null;
  };

  /**
   * Load setup preference from user profile
   */
  const loadUserSetupPreference = async () => {
    const setupsObj = getSetupsObject();
    try {
      const apiUrl = window.bewerbungstrainerConfig?.apiUrl || '/wp-json/bewerbungstrainer/v1';
      const response = await fetch(`${apiUrl}/user/setup`, {
        method: 'GET',
        credentials: 'same-origin',
        headers: {
          'X-WP-Nonce': window.bewerbungstrainerConfig?.nonce || '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.setup_id && setupsObj[data.data.setup_id]) {
          setSelectedSetupState(data.data.setup_id);
          // Also update localStorage to stay in sync
          localStorage.setItem('bewerbungstrainer_selected_setup', data.data.setup_id);
          return data.data.setup_id;
        }
      }
    } catch (error) {
      console.error('Failed to load setup from user profile:', error);
    }
    return null;
  };

  // Load setups from API on mount
  useEffect(() => {
    loadSetupsFromApi().then(() => setSetupsLoading(false));
  }, []);

  // Initialize partner from URL on mount - now fetches from API
  // Note: Partner may already be set from localStorage cache (in useState initializer)
  useEffect(() => {
    const initializePartner = async () => {
      const partnerId = getPartnerIdFromUrl();

      // If no partner ID in URL, clear cache and partner state
      if (!partnerId) {
        if (partner) {
          setPartner(null);
          localStorage.removeItem(PARTNER_CACHE_KEY);
        }
        setDataLoading(false);
        return;
      }

      try {
        // Fetch fresh config from API
        const partnerConfig = await fetchPartnerConfig(partnerId);

        if (partnerConfig) {
          // Update state and cache
          setPartner(partnerConfig);
          setCachedPartnerConfig(partnerConfig);
        } else {
          // API returned nothing - clear cache and state
          console.warn('🏷️ [PartnerContext] Partner not found:', partnerId);
          setPartner(null);
          localStorage.removeItem(PARTNER_CACHE_KEY);
        }
      } catch (error) {
        console.error('🏷️ [PartnerContext] Error loading partner config:', error);

        // Keep cached version if available, otherwise try mock
        if (!partner && partnerId) {
          const mockConfig = getPartnerConfig(partnerId);
          if (mockConfig) {
            setPartner(mockConfig);
          }
        }
      }

      setDataLoading(false);
    };

    initializePartner();
  }, []);

  /**
   * Check if current user is admin via API
   */
  const checkAdminStatus = async () => {
    try {
      const apiUrl = window.bewerbungstrainerConfig?.apiUrl || '/wp-json/bewerbungstrainer/v1';
      const response = await fetch(`${apiUrl}/admin/check`, {
        method: 'GET',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': window.bewerbungstrainerConfig?.nonce || '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.data?.isAdmin || false;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  // Initialize authentication state from WordPress config
  useEffect(() => {
    const initializeAuth = async () => {
      // Check if user is already logged in via WordPress
      const wpConfig = window.bewerbungstrainerConfig;

      // Check for incomplete demo process - if demo user refreshed without completing registration
      const demoPending = localStorage.getItem('bewerbungstrainer_demo_pending');
      const storedDemoCode = localStorage.getItem('bewerbungstrainer_demo_code');
      const isDemoUsername = wpConfig?.currentUser?.login?.toLowerCase() === 'demo';

      if (demoPending === 'true' && isDemoUsername && !storedDemoCode) {
        // Clear the pending flag
        localStorage.removeItem('bewerbungstrainer_demo_pending');

        // Log out the demo user
        try {
          await logoutUser();
        } catch (error) {
          console.error('🔐 [PartnerContext] Error logging out demo user:', error);
        }

        setAuthLoading(false);
        return; // Don't proceed with normal auth initialization
      }

      if (wpConfig?.currentUser?.id && wpConfig.currentUser.id > 0) {

        // For demo users, also check if they have a valid demo code
        if (isDemoUsername && !storedDemoCode) {
          try {
            await logoutUser();
          } catch (error) {
            console.error('🔐 [PartnerContext] Error logging out demo user:', error);
          }
          setAuthLoading(false);
          return;
        }

        setUser({
          id: wpConfig.currentUser.id,
          displayName: wpConfig.currentUser.name,
          firstName: wpConfig.currentUser.firstName,
        });
        setIsAuthenticated(true);

        // Set demo user state if applicable
        if (isDemoUsername && storedDemoCode) {
          setIsDemoUser(true);
          setDemoCodeState(storedDemoCode);
        }

        // Check admin status
        const adminStatus = await checkAdminStatus();
        setIsAdmin(adminStatus);

        // Load setup preference from user profile
        if (!isDemoUsername) {
          await loadUserSetupPreference();
        }
      } else {
        // Try to get current user from API (in case cookies are set but config wasn't updated)
        try {
          const apiUser = await getCurrentUser();
          if (apiUser) {
            // Check if this is a demo user without a code
            const apiIsDemoUser = apiUser.login?.toLowerCase() === 'demo';
            if (apiIsDemoUser && !storedDemoCode) {
              await logoutUser();
              setAuthLoading(false);
              return;
            }

            setUser(apiUser);
            setIsAuthenticated(true);

            // Set demo user state if applicable
            if (apiIsDemoUser && storedDemoCode) {
              setIsDemoUser(true);
              setDemoCodeState(storedDemoCode);
            }

            // Check admin status
            const adminStatus = await checkAdminStatus();
            setIsAdmin(adminStatus);

            // Load setup preference from user profile
            if (!apiIsDemoUser) {
              await loadUserSetupPreference();
            }
          }
        } catch (error) {
        }
      }
      setAuthLoading(false);
    };

    initializeAuth();
  }, []);

  // Apply CSS variables when partner changes
  useEffect(() => {
    applyBranding(partner);
  }, [partner]);

  /**
   * Apply branding CSS variables to the document root
   */
  const applyBranding = (partnerConfig) => {
    const root = document.documentElement;
    const appContainer = document.getElementById('bewerbungstrainer-app') || document.getElementById('root');

    // Get branding config, fallback to defaults
    const branding = partnerConfig?.branding || DEFAULT_BRANDING;


    // Apply CSS variables to :root
    Object.entries(branding).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });

    // Also apply to app container for scoped styling
    if (appContainer) {
      Object.entries(branding).forEach(([property, value]) => {
        appContainer.style.setProperty(property, value);
      });
    }
  };

  /**
   * Legacy: Filter scenarios based on partner's allowed modules
   */
  const filterScenarios = (scenarios) => {
    return filterScenariosByPartner(scenarios, partner);
  };

  /**
   * Filter scenarios by visibility configuration
   * Uses the new checkbox-based system where scenarios are explicitly selected per type
   * @param {Array} scenarios - Array of scenario objects
   * @param {string} scenarioType - Type: 'roleplay', 'simulator', or 'video_training'
   * @returns {Array} Filtered scenarios
   */
  const filterScenariosByType = (scenarios, scenarioType) => {
    return filterScenariosByVisibility(scenarios, partner, scenarioType);
  };

  /**
   * Check if a specific module is allowed for current partner
   */
  const checkModuleAllowed = (moduleId) => {
    return isModuleAllowed(partner, moduleId);
  };

  /**
   * Get the current branding configuration
   */
  const getBranding = () => {
    return partner?.branding || DEFAULT_BRANDING;
  };

  /**
   * Get partner's logo URL if available
   */
  const getLogoUrl = () => {
    return partner?.logo_url || null;
  };

  /**
   * Check if we're in white-label mode (partner is active)
   */
  const isWhiteLabel = () => {
    return !!partner;
  };

  /**
   * Handle user login
   * @param {string} username - Username or email
   * @param {string} password - Password
   * @returns {Promise<Object>} Result with success status and user or error
   */
  const handleLogin = useCallback(async (username, password) => {

    const result = await loginUser(username, password);

    if (result.success) {
      // Wait for browser to process the auth cookie
      // Then verify the cookie is working by making a test API call

      // Try up to 3 times with increasing delays to verify cookie is set
      let cookieVerified = false;
      const delays = [200, 400, 600];

      for (let i = 0; i < delays.length; i++) {
        await new Promise(resolve => setTimeout(resolve, delays[i]));

        try {
          // Test if the cookie works by making a simple authenticated request
          const testResponse = await fetch(
            `${window.bewerbungstrainerConfig?.apiUrl || '/wp-json/bewerbungstrainer/v1'}/user/info`,
            {
              method: 'GET',
              headers: { 'X-WP-Nonce': result.nonce },
              credentials: 'same-origin',
            }
          );

          if (testResponse.ok) {
            cookieVerified = true;
            break;
          } else {
          }
        } catch (e) {
        }
      }

      if (!cookieVerified) {
        console.warn('⚠️ [PartnerContext] Cookie could not be verified, proceeding anyway');
      }

      // CRITICAL: Update the global nonce with the new one from login
      // This ensures all subsequent API calls use the authenticated nonce
      if (result.nonce && window.bewerbungstrainerConfig) {
        console.log('🔐 [PartnerContext] Updating global nonce after login');
        window.bewerbungstrainerConfig.nonce = result.nonce;
      }

      setUser(result.user);
      setIsAuthenticated(true);

      // Check admin status after login
      const adminStatus = await checkAdminStatus();
      setIsAdmin(adminStatus);
    } else {
      console.warn('⚠️ [PartnerContext] Login failed:', result.error);
    }

    return result;
  }, []);

  /**
   * Handle user logout
   * @returns {Promise<Object>} Result with success status
   */
  const handleLogout = useCallback(async () => {

    const result = await logoutUser();

    // Always clear local state, even if API call fails
    setUser(null);
    setIsAuthenticated(false);
    setIsAdmin(false);

    // Clear demo code on logout
    setDemoCodeState(null);
    setIsDemoUser(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('bewerbungstrainer_demo_code');
    }


    return result;
  }, []);

  /**
   * Set demo code for demo user sessions
   * @param {string} code - The demo code to set
   */
  const setDemoCode = useCallback((code) => {
    if (code) {
      const upperCode = code.toUpperCase();
      setDemoCodeState(upperCode);
      setIsDemoUser(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('bewerbungstrainer_demo_code', upperCode);
      }
    } else {
      setDemoCodeState(null);
      setIsDemoUser(false);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('bewerbungstrainer_demo_code');
      }
    }
  }, []);

  /**
   * Clear demo code
   */
  const clearDemoCode = useCallback(() => {
    setDemoCode(null);
  }, [setDemoCode]);

  /**
   * Set selected scenario setup
   * @param {string} setupId - The setup ID to select (e.g., 'karriere-placement')
   */
  const setSelectedSetup = useCallback(async (setupId) => {
    const setupsObj = getSetupsObject();
    const newSetup = setupId && setupsObj[setupId] ? setupId : null;
    setSelectedSetupState(newSetup);

    // Save to localStorage as fallback
    if (typeof window !== 'undefined') {
      if (newSetup) {
        localStorage.setItem('bewerbungstrainer_selected_setup', newSetup);
      } else {
        localStorage.removeItem('bewerbungstrainer_selected_setup');
      }
    }

    // Save to user profile if authenticated
    if (isAuthenticated && !isDemoUser) {
      try {
        const apiUrl = window.bewerbungstrainerConfig?.apiUrl || '/wp-json/bewerbungstrainer/v1';
        await fetch(`${apiUrl}/user/setup`, {
          method: 'POST',
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/json',
            'X-WP-Nonce': window.bewerbungstrainerConfig?.nonce || '',
          },
          body: JSON.stringify({ setup_id: newSetup }),
        });
      } catch (error) {
        console.error('Failed to save setup to user profile:', error);
      }
    }
  }, [isAuthenticated, isDemoUser, getSetupsObject]);

  /**
   * Clear selected setup
   */
  const clearSelectedSetup = useCallback(() => {
    setSelectedSetup(null);
  }, [setSelectedSetup]);

  /**
   * Get current setup object
   */
  const getCurrentSetup = useCallback(() => {
    const setupsObj = getSetupsObject();
    if (selectedSetup && setupsObj[selectedSetup]) {
      return setupsObj[selectedSetup];
    }
    return null;
  }, [selectedSetup, getSetupsObject]);

  /**
   * Filter scenarios by setup AND partner visibility
   * This combines setup filtering with partner configuration
   * @param {Array} scenarios - Array of scenario objects
   * @param {string} scenarioType - Type: 'roleplay', 'simulator', 'video_training', 'briefings'
   * @returns {Array} Filtered scenarios
   */
  const filterScenariosBySetupAndPartner = useCallback((scenarios, scenarioType) => {
    // First apply partner visibility filter
    let filtered = filterScenariosByVisibility(scenarios, partner, scenarioType);

    // Then apply setup filter if a setup is selected
    if (selectedSetup) {
      filtered = filterBySetup(filtered, selectedSetup);
    }

    return filtered;
  }, [partner, selectedSetup]);

  /**
   * Refresh user data from API
   */
  const refreshUser = useCallback(async () => {
    try {
      const apiUser = await getCurrentUser();
      if (apiUser) {
        setUser(apiUser);
        setIsAuthenticated(true);
        return apiUser;
      } else {
        setUser(null);
        setIsAuthenticated(false);
        return null;
      }
    } catch (error) {
      console.error('❌ [PartnerContext] Failed to refresh user:', error);
      return null;
    }
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    // Partner data
    partner,
    isLoading,
    isWhiteLabel: !!partner,

    // Helper functions
    filterScenarios,
    filterScenariosByType,
    checkModuleAllowed,
    getBranding,
    getLogoUrl,

    // Raw branding for direct access
    branding: partner?.branding || DEFAULT_BRANDING,
    logoUrl: partner?.logo_url || null,
    partnerName: partner?.name || 'Karriereheld',
    appName: partner?.app_name || null,              // Replaces "Karriereheld" on homepage
    dashboardSubtitle: partner?.dashboard_subtitle || null, // Replaces "Erst denken, dann handeln..."

    // Authentication
    user,
    isAuthenticated,
    isAdmin,
    authLoading,
    login: handleLogin,
    logout: handleLogout,
    refreshUser,

    // Demo user support
    demoCode,
    isDemoUser,
    setDemoCode,
    clearDemoCode,

    // Scenario Setup selection
    selectedSetup,
    currentSetup: getCurrentSetup(),
    setSelectedSetup,
    clearSelectedSetup,
    filterScenariosBySetupAndPartner,
    availableSetups: getSetupsList(),
    SCENARIO_SETUPS: getSetupsObject(),
    setupsLoading,
  }), [
    partner,
    isLoading,
    filterScenarios,
    filterScenariosByType,
    checkModuleAllowed,
    getBranding,
    getLogoUrl,
    user,
    isAuthenticated,
    isAdmin,
    authLoading,
    handleLogin,
    handleLogout,
    refreshUser,
    demoCode,
    isDemoUser,
    setDemoCode,
    clearDemoCode,
    selectedSetup,
    getCurrentSetup,
    setSelectedSetup,
    clearSelectedSetup,
    filterScenariosBySetupAndPartner,
    getSetupsList,
    getSetupsObject,
    setupsLoading,
  ]);

  return (
    <PartnerContext.Provider value={contextValue}>
      {children}
    </PartnerContext.Provider>
  );
}

/**
 * usePartner Hook
 * Access partner context from any component
 */
export function usePartner() {
  const context = useContext(PartnerContext);
  if (!context) {
    throw new Error('usePartner must be used within a PartnerProvider');
  }
  return context;
}

/**
 * usePartnerBranding Hook
 * Convenience hook for accessing just the branding
 */
export function usePartnerBranding() {
  const { branding, isWhiteLabel, partnerName } = usePartner();
  return { branding, isWhiteLabel, partnerName };
}

/**
 * useAuth Hook
 * Convenience hook for accessing authentication state and methods
 */
export function useAuth() {
  const { user, isAuthenticated, isAdmin, authLoading, login, logout, refreshUser } = usePartner();
  return {
    user,
    isAuthenticated,
    isAdmin,
    isLoading: authLoading,
    login,
    logout,
    refreshUser,
  };
}

export default PartnerContext;
