import { useMemo } from 'react';
import { usePartner } from '../context/PartnerContext';
import { DEFAULT_BRANDING } from '../config/partners';

/**
 * Custom hook for accessing partner branding with fallback to defaults
 * Reduces boilerplate code in components that need branding values
 *
 * @returns {object} Branding values with semantic names
 */
export const useBranding = () => {
  const { branding } = usePartner();

  return useMemo(() => {
    const get = (key) => branding?.[key] || DEFAULT_BRANDING[key];

    return {
      // Header / Gradients
      headerGradient: get('--header-gradient'),
      headerText: get('--header-text'),
      buttonGradient: branding?.['--button-gradient'] || get('--header-gradient'),

      // Primary Accent Colors
      primaryAccent: get('--primary-accent'),
      primaryAccentLight: get('--primary-accent-light'),
      primaryAccentDark: get('--primary-accent-dark'),

      // Background Colors
      appBgColor: get('--app-bg-color'),
      cardBgColor: get('--card-bg-color'),
      sidebarBgColor: get('--sidebar-bg-color'),

      // Sidebar Colors
      sidebarTextColor: get('--sidebar-text-color'),
      sidebarTextMuted: get('--sidebar-text-muted'),
      sidebarActiveBg: get('--sidebar-active-bg'),
      sidebarActiveText: get('--sidebar-active-text'),
      sidebarHoverBg: get('--sidebar-hover-bg'),

      // Text Colors
      textPrimary: get('--text-primary') || '#0f172a',
      textSecondary: get('--text-secondary') || '#64748b',
      textMuted: get('--text-muted') || '#94a3b8',

      // Border Colors
      borderColor: get('--border-color') || '#e2e8f0',
      borderColorLight: get('--border-color-light') || '#f1f5f9',

      // Icon Colors
      iconColor: get('--icon-color'),
      iconActiveColor: get('--icon-active-color'),

      // Raw branding object for advanced use cases
      raw: branding,
    };
  }, [branding]);
};

/**
 * Hook to get a single branding value with fallback
 * @param {string} key - Branding key (e.g., '--primary-accent')
 * @param {string} fallback - Optional custom fallback
 * @returns {string} Branding value
 */
export const useBrandingValue = (key, fallback = null) => {
  const { branding } = usePartner();

  return useMemo(() => {
    return branding?.[key] || fallback || DEFAULT_BRANDING[key];
  }, [branding, key, fallback]);
};

/**
 * Hook for commonly used gradient/button styles
 * @returns {object} Style objects ready for use in JSX
 */
export const useBrandingStyles = () => {
  const branding = useBranding();

  return useMemo(() => ({
    // Primary button with gradient
    primaryButton: {
      background: branding.buttonGradient,
      color: branding.headerText || '#ffffff',
      border: 'none',
      borderRadius: '8px',
      fontWeight: 600,
      cursor: 'pointer',
    },

    // Secondary/outline button
    secondaryButton: {
      background: 'transparent',
      color: branding.primaryAccent,
      border: `1px solid ${branding.primaryAccent}`,
      borderRadius: '8px',
      fontWeight: 500,
      cursor: 'pointer',
    },

    // Ghost button
    ghostButton: {
      background: '#f1f5f9',
      color: '#64748b',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
    },

    // Card container
    card: {
      background: branding.cardBgColor,
      borderRadius: '16px',
      border: `1px solid ${branding.borderColor}`,
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
    },

    // Header with gradient
    gradientHeader: {
      background: branding.headerGradient,
      color: branding.headerText || '#ffffff',
    },

    // Accent badge/pill
    accentBadge: {
      background: `${branding.primaryAccent}15`,
      color: branding.primaryAccent,
      borderRadius: '9999px',
      fontWeight: 500,
    },
  }), [branding]);
};

export default useBranding;
