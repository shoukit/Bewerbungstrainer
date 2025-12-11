import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getPartnerIdFromUrl,
  getPartnerConfig,
  fetchPartnerConfig,
  filterScenariosByPartner,
  isModuleAllowed,
  loginUser,
  logoutUser,
  getCurrentUser,
  DEFAULT_BRANDING,
} from '@/config/partners';

/**
 * Partner Context
 * Provides partner configuration throughout the app for white-labeling
 */
const PartnerContext = createContext(null);

/**
 * PartnerProvider Component
 * Wraps the app and provides partner configuration and authentication to all children
 */
export function PartnerProvider({ children }) {
  const [partner, setPartner] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Authentication state
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Initialize partner from URL on mount - now fetches from API
  useEffect(() => {
    const initializePartner = async () => {
      const partnerId = getPartnerIdFromUrl();
      console.log('🏷️ [PartnerContext] Partner ID from URL:', partnerId);

      try {
        // Try to fetch from API first
        const partnerConfig = await fetchPartnerConfig(partnerId);

        if (partnerConfig) {
          console.log('🏷️ [PartnerContext] Partner loaded:', partnerConfig.name);
          setPartner(partnerConfig);
        } else if (partnerId) {
          // API returned nothing and we had a partner ID - log warning
          console.warn('🏷️ [PartnerContext] Partner not found:', partnerId);
        } else {
          console.log('🏷️ [PartnerContext] No partner specified, using default branding');
        }
      } catch (error) {
        console.error('🏷️ [PartnerContext] Error loading partner config:', error);

        // Fallback to mock if API fails
        if (partnerId) {
          const mockConfig = getPartnerConfig(partnerId);
          if (mockConfig) {
            console.log('🏷️ [PartnerContext] Using mock fallback:', mockConfig.name);
            setPartner(mockConfig);
          }
        }
      }

      setIsLoading(false);
    };

    initializePartner();
  }, []);

  // Initialize authentication state from WordPress config
  useEffect(() => {
    const initializeAuth = async () => {
      // Check if user is already logged in via WordPress
      const wpConfig = window.bewerbungstrainerConfig;
      if (wpConfig?.currentUser?.id && wpConfig.currentUser.id > 0) {
        console.log('🔐 [PartnerContext] User from WordPress config:', wpConfig.currentUser.name);
        setUser({
          id: wpConfig.currentUser.id,
          displayName: wpConfig.currentUser.name,
          firstName: wpConfig.currentUser.firstName,
        });
        setIsAuthenticated(true);
      } else {
        // Try to get current user from API (in case cookies are set but config wasn't updated)
        try {
          const apiUser = await getCurrentUser();
          if (apiUser) {
            console.log('🔐 [PartnerContext] User from API:', apiUser.displayName);
            setUser(apiUser);
            setIsAuthenticated(true);
          }
        } catch (error) {
          console.log('🔐 [PartnerContext] No authenticated user');
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

    console.log('🎨 [PartnerContext] Applying branding:', partnerConfig?.name || 'Default');

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
   * Filter scenarios based on partner's allowed modules
   */
  const filterScenarios = (scenarios) => {
    return filterScenariosByPartner(scenarios, partner);
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
    console.log('🔐 [PartnerContext] Attempting login...');

    const result = await loginUser(username, password);

    if (result.success) {
      // Delay to ensure browser processes the auth cookie before state updates
      // This prevents race condition where API calls are made before cookie is set
      // 300ms gives the browser enough time to process Set-Cookie headers
      console.log('⏳ [PartnerContext] Waiting for cookie to be processed...');
      await new Promise(resolve => setTimeout(resolve, 300));

      setUser(result.user);
      setIsAuthenticated(true);
      console.log('✅ [PartnerContext] Login successful:', result.user.displayName);
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
    console.log('🔐 [PartnerContext] Logging out...');

    const result = await logoutUser();

    // Always clear local state, even if API call fails
    setUser(null);
    setIsAuthenticated(false);
    console.log('✅ [PartnerContext] Logout completed');

    return result;
  }, []);

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

  const contextValue = {
    // Partner data
    partner,
    isLoading,
    isWhiteLabel: isWhiteLabel(),

    // Helper functions
    filterScenarios,
    checkModuleAllowed,
    getBranding,
    getLogoUrl,

    // Raw branding for direct access
    branding: partner?.branding || DEFAULT_BRANDING,
    logoUrl: partner?.logo_url || null,
    partnerName: partner?.name || 'Karriereheld',

    // Authentication
    user,
    isAuthenticated,
    authLoading,
    login: handleLogin,
    logout: handleLogout,
    refreshUser,
  };

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
  const { user, isAuthenticated, authLoading, login, logout, refreshUser } = usePartner();
  return {
    user,
    isAuthenticated,
    isLoading: authLoading,
    login,
    logout,
    refreshUser,
  };
}

export default PartnerContext;
