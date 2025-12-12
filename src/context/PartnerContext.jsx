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
      console.log('🔐 [PartnerContext] Admin check failed:', error);
      return false;
    }
  };

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

        // Check admin status
        const adminStatus = await checkAdminStatus();
        setIsAdmin(adminStatus);
        console.log('🔐 [PartnerContext] Admin status:', adminStatus);
      } else {
        // Try to get current user from API (in case cookies are set but config wasn't updated)
        try {
          const apiUser = await getCurrentUser();
          if (apiUser) {
            console.log('🔐 [PartnerContext] User from API:', apiUser.displayName);
            setUser(apiUser);
            setIsAuthenticated(true);

            // Check admin status
            const adminStatus = await checkAdminStatus();
            setIsAdmin(adminStatus);
            console.log('🔐 [PartnerContext] Admin status:', adminStatus);
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
      // Wait for browser to process the auth cookie
      // Then verify the cookie is working by making a test API call
      console.log('⏳ [PartnerContext] Waiting for cookie to be processed...');

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
            console.log('✅ [PartnerContext] Cookie verified on attempt', i + 1);
            cookieVerified = true;
            break;
          } else {
            console.log(`⏳ [PartnerContext] Cookie not ready yet (attempt ${i + 1}), waiting...`);
          }
        } catch (e) {
          console.log(`⏳ [PartnerContext] Cookie verification failed (attempt ${i + 1}):`, e.message);
        }
      }

      if (!cookieVerified) {
        console.warn('⚠️ [PartnerContext] Cookie could not be verified, proceeding anyway');
      }

      setUser(result.user);
      setIsAuthenticated(true);

      // Check admin status after login
      const adminStatus = await checkAdminStatus();
      setIsAdmin(adminStatus);
      console.log('✅ [PartnerContext] Login successful:', result.user.displayName, '| Admin:', adminStatus);
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
    setIsAdmin(false);

    // Clear demo code on logout
    setDemoCodeState(null);
    setIsDemoUser(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('bewerbungstrainer_demo_code');
    }

    console.log('✅ [PartnerContext] Logout completed');

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
      console.log('🎫 [PartnerContext] Demo code set:', upperCode);
    } else {
      setDemoCodeState(null);
      setIsDemoUser(false);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('bewerbungstrainer_demo_code');
      }
      console.log('🎫 [PartnerContext] Demo code cleared');
    }
  }, []);

  /**
   * Clear demo code
   */
  const clearDemoCode = useCallback(() => {
    setDemoCode(null);
  }, [setDemoCode]);

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
