import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getPartnerIdFromUrl,
  getPartnerConfig,
  filterScenariosByPartner,
  isModuleAllowed,
  DEFAULT_BRANDING,
} from '@/config/partners';

/**
 * Partner Context
 * Provides partner configuration throughout the app for white-labeling
 */
const PartnerContext = createContext(null);

/**
 * PartnerProvider Component
 * Wraps the app and provides partner configuration to all children
 */
export function PartnerProvider({ children }) {
  const [partner, setPartner] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize partner from URL on mount
  useEffect(() => {
    const initializePartner = () => {
      const partnerId = getPartnerIdFromUrl();
      console.log('🏷️ [PartnerContext] Partner ID from URL:', partnerId);

      if (partnerId) {
        const partnerConfig = getPartnerConfig(partnerId);
        if (partnerConfig) {
          console.log('🏷️ [PartnerContext] Partner loaded:', partnerConfig.name);
          setPartner(partnerConfig);
        } else {
          console.warn('🏷️ [PartnerContext] Partner not found:', partnerId);
        }
      } else {
        console.log('🏷️ [PartnerContext] No partner specified, using default branding');
      }

      setIsLoading(false);
    };

    initializePartner();
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

export default PartnerContext;
