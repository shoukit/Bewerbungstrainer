import { useEffect, useMemo } from 'react';
import { usePartner } from '@/context/PartnerContext';
import { DEFAULT_BRANDING } from '@/config/partners';

/**
 * usePartnerTheming Hook
 *
 * Provides theming utilities for components that need to respond to partner branding.
 * Injects CSS variables and provides helper functions for styled components.
 */
export function usePartnerTheming() {
  const { branding, isWhiteLabel, partner } = usePartner();

  /**
   * Get a CSS variable value from the current branding
   * @param {string} variableName - CSS variable name (e.g., '--primary-accent')
   * @param {string} fallback - Fallback value if variable not found
   * @returns {string} CSS variable value
   */
  const getVar = (variableName, fallback = '') => {
    return branding?.[variableName] || DEFAULT_BRANDING[variableName] || fallback;
  };

  /**
   * Get inline styles object for a component based on theming
   * Useful for components that need to override default styles
   */
  const getThemedStyles = useMemo(() => ({
    // App background
    appBackground: {
      background: getVar('--app-bg-color'),
    },

    // Sidebar styles
    sidebar: {
      backgroundColor: getVar('--sidebar-bg-color'),
      color: getVar('--sidebar-text-color', getVar('--text-main')),
    },

    sidebarText: {
      color: getVar('--sidebar-text-color', getVar('--text-main')),
    },

    sidebarTextMuted: {
      color: getVar('--sidebar-text-muted', getVar('--text-muted')),
    },

    sidebarActive: {
      backgroundColor: getVar('--sidebar-active-bg', getVar('--primary-accent-light')),
      color: getVar('--sidebar-active-text', getVar('--primary-accent')),
    },

    sidebarHover: {
      backgroundColor: getVar('--sidebar-hover-bg', 'rgba(0, 0, 0, 0.05)'),
    },

    // Card styles
    card: {
      backgroundColor: getVar('--card-bg-color'),
      borderColor: getVar('--border-color'),
    },

    // Primary accent (buttons, links, etc.)
    primaryAccent: {
      backgroundColor: getVar('--primary-accent'),
      color: '#ffffff',
    },

    primaryAccentText: {
      color: getVar('--primary-accent'),
    },

    primaryAccentLight: {
      backgroundColor: getVar('--primary-accent-light'),
      color: getVar('--primary-accent'),
    },

    // Text styles
    textMain: {
      color: getVar('--text-main'),
    },

    textSecondary: {
      color: getVar('--text-secondary'),
    },

    textMuted: {
      color: getVar('--text-muted'),
    },

    // Border styles
    border: {
      borderColor: getVar('--border-color'),
    },

    borderLight: {
      borderColor: getVar('--border-color-light'),
    },
  }), [branding]);

  /**
   * Check if sidebar should use dark/light text based on background
   * Simple heuristic: if sidebar bg starts with # and is dark, use light text
   */
  const sidebarUsesDarkBg = useMemo(() => {
    const sidebarBg = getVar('--sidebar-bg-color');
    if (!sidebarBg) return false;

    // If there's an explicit sidebar text color set, we're in dark mode
    return !!branding?.['--sidebar-text-color'];
  }, [branding]);

  return {
    // Raw branding object
    branding,

    // Helper functions
    getVar,

    // Pre-computed style objects
    styles: getThemedStyles,

    // Flags
    isWhiteLabel,
    sidebarUsesDarkBg,

    // Partner info
    partnerName: partner?.name || 'Karriereheld',
    logoUrl: partner?.logo_url || null,
  };
}

/**
 * useThemedColor Hook
 *
 * Returns a single themed color value
 * @param {string} variableName - CSS variable name
 * @param {string} fallback - Fallback color
 */
export function useThemedColor(variableName, fallback = '') {
  const { getVar } = usePartnerTheming();
  return getVar(variableName, fallback);
}

/**
 * Apply partner CSS variables to a container element
 * Can be called directly without the hook if needed
 *
 * @param {HTMLElement} element - DOM element to apply styles to
 * @param {Object} branding - Branding configuration object
 */
export function applyPartnerCssVars(element, branding) {
  if (!element || !branding) return;

  Object.entries(branding).forEach(([property, value]) => {
    element.style.setProperty(property, value);
  });
}

export default usePartnerTheming;
