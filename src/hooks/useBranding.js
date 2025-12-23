import { useMemo } from 'react';
import { usePartner } from '../context/PartnerContext';
import { DEFAULT_BRANDING } from '../config/partners';

/**
 * Custom hook for accessing partner branding with fallback to defaults
 * Provides all branding values needed for consistent theming across the app
 *
 * @returns {object} Branding values with semantic names
 */
export const useBranding = () => {
  const { branding } = usePartner();

  return useMemo(() => {
    const get = (key) => branding?.[key] || DEFAULT_BRANDING[key];

    return {
      // ============================================
      // Header / Gradients
      // ============================================
      headerGradient: get('--header-gradient'),
      headerText: get('--header-text'),
      buttonGradient: branding?.['--button-gradient'] || get('--header-gradient'),
      buttonGradientHover: get('--button-gradient-hover'),
      buttonSolid: get('--button-solid'),
      buttonSolidHover: get('--button-solid-hover'),
      buttonText: get('--button-text') || '#ffffff',

      // ============================================
      // Primary Accent Colors
      // ============================================
      primaryAccent: get('--primary-accent'),
      primaryAccentLight: get('--primary-accent-light'),
      primaryAccentHover: get('--primary-accent-hover'),
      // Alias for backwards compatibility
      primaryAccentDark: get('--primary-accent-hover'),

      // ============================================
      // Background Colors
      // ============================================
      appBgColor: get('--app-bg-color'),
      cardBgColor: get('--card-bg-color') || '#ffffff',
      cardBgHover: get('--card-bg-hover') || '#f8fafc',
      sidebarBgColor: get('--sidebar-bg-color'),

      // ============================================
      // Sidebar Colors
      // ============================================
      sidebarTextColor: get('--sidebar-text-color'),
      sidebarTextMuted: get('--sidebar-text-muted'),
      sidebarActiveBg: get('--sidebar-active-bg'),
      sidebarActiveText: get('--sidebar-active-text'),
      sidebarHoverBg: get('--sidebar-hover-bg'),

      // ============================================
      // Text Colors
      // ============================================
      textMain: get('--text-main') || '#0f172a',
      textSecondary: get('--text-secondary') || '#475569',
      textMuted: get('--text-muted') || '#94a3b8',
      // Aliases for backwards compatibility
      textPrimary: get('--text-main') || '#0f172a',

      // ============================================
      // Border Colors
      // ============================================
      borderColor: get('--border-color') || '#e2e8f0',
      borderColorLight: get('--border-color-light') || '#f1f5f9',

      // ============================================
      // Icon Colors
      // ============================================
      iconPrimary: get('--icon-primary'),
      iconSecondary: get('--icon-secondary'),
      iconMuted: get('--icon-muted') || '#94a3b8',
      // Aliases
      iconColor: get('--icon-primary'),
      iconActiveColor: get('--icon-secondary'),

      // ============================================
      // Focus Ring
      // ============================================
      focusRing: get('--focus-ring') || 'rgba(58, 127, 167, 0.3)',

      // ============================================
      // Semantic Colors (Success, Error, Warning, Info)
      // ============================================
      success: '#10b981',
      successLight: '#d1fae5',
      successDark: '#059669',
      error: '#ef4444',
      errorLight: '#fee2e2',
      errorDark: '#dc2626',
      warning: '#f59e0b',
      warningLight: '#fef3c7',
      warningDark: '#d97706',
      info: '#3b82f6',
      infoLight: '#dbeafe',
      infoDark: '#2563eb',

      // ============================================
      // Overlay Colors
      // ============================================
      overlayLight: 'rgba(255, 255, 255, 0.8)',
      overlayDark: 'rgba(0, 0, 0, 0.5)',
      backdropBlur: 'rgba(255, 255, 255, 0.9)',

      // ============================================
      // Common Color Values (for inline styles)
      // ============================================
      white: '#ffffff',
      transparent: 'transparent',
      disabledBg: '#cbd5e1', // slate-300 equivalent for disabled states

      // ============================================
      // Raw branding object for advanced use cases
      // ============================================
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
 * Returns style objects ready for use in JSX
 * @returns {object} Style objects for common UI elements
 */
export const useBrandingStyles = () => {
  const b = useBranding();

  return useMemo(() => ({
    // Primary button with gradient
    primaryButton: {
      background: b.buttonGradient,
      color: b.buttonText,
      border: 'none',
      borderRadius: '8px',
      fontWeight: 600,
      cursor: 'pointer',
    },

    // Primary button hover state
    primaryButtonHover: {
      background: b.buttonGradientHover,
    },

    // Secondary/outline button
    secondaryButton: {
      background: 'transparent',
      color: b.primaryAccent,
      border: `1px solid ${b.primaryAccent}`,
      borderRadius: '8px',
      fontWeight: 500,
      cursor: 'pointer',
    },

    // Ghost button
    ghostButton: {
      background: b.cardBgHover,
      color: b.textSecondary,
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
    },

    // Card container
    card: {
      background: b.cardBgColor,
      borderRadius: '16px',
      border: `1px solid ${b.borderColor}`,
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
    },

    // Header with gradient
    gradientHeader: {
      background: b.headerGradient,
      color: b.headerText,
    },

    // Accent badge/pill
    accentBadge: {
      background: `${b.primaryAccent}15`,
      color: b.primaryAccent,
      borderRadius: '9999px',
      fontWeight: 500,
    },

    // Success state
    successState: {
      background: b.successLight,
      color: b.successDark,
      border: `1px solid ${b.success}33`,
    },

    // Error state
    errorState: {
      background: b.errorLight,
      color: b.errorDark,
      border: `1px solid ${b.error}33`,
    },

    // Warning state
    warningState: {
      background: b.warningLight,
      color: b.warningDark,
      border: `1px solid ${b.warning}33`,
    },

    // Info state
    infoState: {
      background: b.infoLight,
      color: b.infoDark,
      border: `1px solid ${b.info}33`,
    },

    // Text styles
    textMain: { color: b.textMain },
    textSecondary: { color: b.textSecondary },
    textMuted: { color: b.textMuted },

    // Background colors
    bgWhite: { backgroundColor: b.cardBgColor },
    bgCard: { backgroundColor: b.cardBgColor },
    bgHover: { backgroundColor: b.cardBgHover },

  }), [b]);
};

/**
 * Hook for getting CSS variable values that can be used in inline styles
 * Useful when components need to reference CSS variables programmatically
 * @returns {object} Object with CSS variable references
 */
export const useCSSVariables = () => {
  return useMemo(() => ({
    primaryAccent: 'var(--primary-accent)',
    primaryAccentLight: 'var(--primary-accent-light)',
    primaryAccentHover: 'var(--primary-accent-hover)',
    buttonGradient: 'var(--button-gradient)',
    buttonText: 'var(--button-text)',
    headerGradient: 'var(--header-gradient)',
    headerText: 'var(--header-text)',
    cardBgColor: 'var(--card-bg-color)',
    textMain: 'var(--text-main)',
    textSecondary: 'var(--text-secondary)',
    textMuted: 'var(--text-muted)',
    borderColor: 'var(--border-color)',
    success: 'var(--color-success)',
    error: 'var(--color-error)',
    warning: 'var(--color-warning)',
    info: 'var(--color-info)',
  }), []);
};

export default useBranding;
