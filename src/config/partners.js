/**
 * Partner Configuration for White-Label System ("Modularer Baukasten")
 *
 * Each partner has:
 * - id/slug: Unique identifier used in URL (?partner=xxx or ?pid=xxx)
 * - name: Display name of the partner
 * - branding: CSS color configuration (see DEFAULT_BRANDING for all options)
 * - logo_url: Optional URL to partner's logo
 * - modules: Array of allowed scenario IDs (only these will be shown)
 */

/**
 * Default branding configuration (Karriereheld standard)
 */
export const DEFAULT_BRANDING = {
  // App Background
  '--app-bg-color': 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 50%, #f0fdfa 100%)',

  // Sidebar
  '--sidebar-bg-color': '#ffffff',
  '--sidebar-text-color': '#0f172a',
  '--sidebar-text-muted': '#94a3b8',
  '--sidebar-active-bg': '#E8F4F8',
  '--sidebar-active-text': '#2D6485',
  '--sidebar-hover-bg': '#f8fafc',

  // Cards
  '--card-bg-color': '#ffffff',

  // Primary Accent (für Links, aktive Zustände)
  '--primary-accent': '#3A7FA7',
  '--primary-accent-light': '#E8F4F8',
  '--primary-accent-hover': '#2D6485',

  // Buttons - Gradient oder Solid
  '--button-gradient': 'linear-gradient(135deg, #3A7FA7 0%, #3DA389 100%)',
  '--button-gradient-hover': 'linear-gradient(135deg, #2D6485 0%, #2E8A72 100%)',
  '--button-solid': '#3A7FA7',
  '--button-solid-hover': '#2D6485',
  '--button-text': '#ffffff',

  // Header Gradient (für Profilkarten, Feature-Header)
  '--header-gradient': 'linear-gradient(135deg, #3A7FA7 0%, #3DA389 100%)',
  '--header-text': '#ffffff',

  // Icons
  '--icon-primary': '#3A7FA7',
  '--icon-secondary': '#3DA389',
  '--icon-muted': '#94a3b8',

  // Text
  '--text-main': '#0f172a',
  '--text-secondary': '#475569',
  '--text-muted': '#94a3b8',

  // Borders
  '--border-color': '#e2e8f0',
  '--border-color-light': '#f1f5f9',

  // Focus Ring
  '--focus-ring': 'rgba(58, 127, 167, 0.3)',
};

/**
 * Mock Partners for Testing
 * In production, this would be fetched from an API/database
 */
export const MOCK_PARTNERS = {
  // Demo Partner 1: Vertriebstrainer Mueller (Amber/Gold Theme)
  'vertriebs-mueller': {
    id: 'vertriebs-mueller',
    slug: 'vertriebs-mueller',
    name: 'Vertriebsakademie Müller',
    branding: {
      // App Background - warmes Amber
      '--app-bg-color': 'linear-gradient(135deg, #fef3c7 0%, #fff7ed 50%, #fffbeb 100%)',

      // Sidebar - dunkles Blau mit Gold-Akzenten
      '--sidebar-bg-color': '#1e3a5f',
      '--sidebar-text-color': '#ffffff',
      '--sidebar-text-muted': '#94a3b8',
      '--sidebar-active-bg': 'rgba(251, 191, 36, 0.2)',
      '--sidebar-active-text': '#fbbf24',
      '--sidebar-hover-bg': 'rgba(255, 255, 255, 0.1)',

      // Cards
      '--card-bg-color': '#ffffff',

      // Primary Accent - Amber
      '--primary-accent': '#d97706',
      '--primary-accent-light': '#fef3c7',
      '--primary-accent-hover': '#b45309',

      // Buttons - Gold Gradient
      '--button-gradient': 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      '--button-gradient-hover': 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
      '--button-solid': '#d97706',
      '--button-solid-hover': '#b45309',
      '--button-text': '#ffffff',

      // Header Gradient - Gold zu Amber
      '--header-gradient': 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      '--header-text': '#ffffff',

      // Icons - Amber Töne
      '--icon-primary': '#d97706',
      '--icon-secondary': '#f59e0b',
      '--icon-muted': '#a8a29e',

      // Text
      '--text-main': '#1c1917',
      '--text-secondary': '#57534e',
      '--text-muted': '#a8a29e',

      // Borders
      '--border-color': '#e7e5e4',
      '--border-color-light': '#f5f5f4',

      // Focus Ring
      '--focus-ring': 'rgba(217, 119, 6, 0.3)',
    },
    logo_url: null,
    // Alle Szenarien erlauben für Tests
    modules: [],
  },

  // Demo Partner 2: Sales Academy Pro (Emerald/Green Theme)
  'sales-academy-pro': {
    id: 'sales-academy-pro',
    slug: 'sales-academy-pro',
    name: 'Sales Academy Pro',
    branding: {
      // App Background - frisches Grün
      '--app-bg-color': 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #f0fdfa 100%)',

      // Sidebar - dunkles Emerald
      '--sidebar-bg-color': '#064e3b',
      '--sidebar-text-color': '#ffffff',
      '--sidebar-text-muted': '#a7f3d0',
      '--sidebar-active-bg': 'rgba(52, 211, 153, 0.2)',
      '--sidebar-active-text': '#34d399',
      '--sidebar-hover-bg': 'rgba(255, 255, 255, 0.1)',

      // Cards
      '--card-bg-color': '#ffffff',

      // Primary Accent - Emerald
      '--primary-accent': '#059669',
      '--primary-accent-light': '#d1fae5',
      '--primary-accent-hover': '#047857',

      // Buttons - Emerald Gradient
      '--button-gradient': 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      '--button-gradient-hover': 'linear-gradient(135deg, #059669 0%, #047857 100%)',
      '--button-solid': '#059669',
      '--button-solid-hover': '#047857',
      '--button-text': '#ffffff',

      // Header Gradient - Emerald
      '--header-gradient': 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      '--header-text': '#ffffff',

      // Icons - Emerald Töne
      '--icon-primary': '#059669',
      '--icon-secondary': '#10b981',
      '--icon-muted': '#6ee7b7',

      // Text
      '--text-main': '#022c22',
      '--text-secondary': '#065f46',
      '--text-muted': '#6ee7b7',

      // Borders
      '--border-color': '#a7f3d0',
      '--border-color-light': '#d1fae5',

      // Focus Ring
      '--focus-ring': 'rgba(5, 150, 105, 0.3)',
    },
    logo_url: null,
    modules: [],
  },

  // Demo Partner 3: TechSales Institute (Purple/Violet Theme)
  'techsales-institute': {
    id: 'techsales-institute',
    slug: 'techsales-institute',
    name: 'TechSales Institute',
    branding: {
      // App Background - sanftes Violett
      '--app-bg-color': 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 50%, #ede9fe 100%)',

      // Sidebar - dunkles Violett
      '--sidebar-bg-color': '#3b0764',
      '--sidebar-text-color': '#ffffff',
      '--sidebar-text-muted': '#c4b5fd',
      '--sidebar-active-bg': 'rgba(167, 139, 250, 0.2)',
      '--sidebar-active-text': '#a78bfa',
      '--sidebar-hover-bg': 'rgba(255, 255, 255, 0.1)',

      // Cards
      '--card-bg-color': '#ffffff',

      // Primary Accent - Violet
      '--primary-accent': '#7c3aed',
      '--primary-accent-light': '#ede9fe',
      '--primary-accent-hover': '#6d28d9',

      // Buttons - Violet Gradient
      '--button-gradient': 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      '--button-gradient-hover': 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
      '--button-solid': '#7c3aed',
      '--button-solid-hover': '#6d28d9',
      '--button-text': '#ffffff',

      // Header Gradient - Violet
      '--header-gradient': 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      '--header-text': '#ffffff',

      // Icons - Violet Töne
      '--icon-primary': '#7c3aed',
      '--icon-secondary': '#8b5cf6',
      '--icon-muted': '#a78bfa',

      // Text
      '--text-main': '#1e1b4b',
      '--text-secondary': '#4c1d95',
      '--text-muted': '#a78bfa',

      // Borders
      '--border-color': '#ddd6fe',
      '--border-color-light': '#ede9fe',

      // Focus Ring
      '--focus-ring': 'rgba(124, 58, 237, 0.3)',
    },
    logo_url: null,
    modules: [],
  },

  // En Garde Verhandlungstraining (Orange/Charcoal Theme)
  'engarde-training': {
    id: 'engarde-training',
    slug: 'engarde-training',
    name: 'En Garde Verhandlungstraining',
    branding: {
      // App Background - hell/neutral
      '--app-bg-color': 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 50%, #fafafa 100%)',

      // Sidebar - dunkles Charcoal
      '--sidebar-bg-color': '#333333',
      '--sidebar-text-color': '#ffffff',
      '--sidebar-text-muted': '#9ca3af',
      '--sidebar-active-bg': 'rgba(234, 88, 12, 0.2)',
      '--sidebar-active-text': '#f97316',
      '--sidebar-hover-bg': 'rgba(255, 255, 255, 0.1)',

      // Cards
      '--card-bg-color': '#ffffff',

      // Primary Accent - Orange
      '--primary-accent': '#ea580c',
      '--primary-accent-light': '#fff7ed',
      '--primary-accent-hover': '#c2410c',

      // Buttons - Orange
      '--button-gradient': 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
      '--button-gradient-hover': 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
      '--button-solid': '#ea580c',
      '--button-solid-hover': '#c2410c',
      '--button-text': '#ffffff',

      // Header Gradient - Orange
      '--header-gradient': 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
      '--header-text': '#ffffff',

      // Icons - Orange Töne
      '--icon-primary': '#ea580c',
      '--icon-secondary': '#f97316',
      '--icon-muted': '#9ca3af',

      // Text
      '--text-main': '#1f2937',
      '--text-secondary': '#4b5563',
      '--text-muted': '#9ca3af',

      // Borders
      '--border-color': '#e5e7eb',
      '--border-color-light': '#f3f4f6',

      // Focus Ring
      '--focus-ring': 'rgba(234, 88, 12, 0.3)',
    },
    logo_url: null,
    modules: [],
  },
};

/**
 * Get partner configuration by ID/slug
 * @param {string} partnerId - Partner slug from URL parameter
 * @returns {Object|null} Partner configuration or null if not found
 */
export function getPartnerConfig(partnerId) {
  if (!partnerId) return null;

  const normalizedId = partnerId.toLowerCase().trim();
  return MOCK_PARTNERS[normalizedId] || null;
}

/**
 * Get partner ID from URL parameters
 * Checks for both ?partner= and ?pid= parameters
 * @returns {string|null} Partner ID or null
 */
export function getPartnerIdFromUrl() {
  if (typeof window === 'undefined') return null;

  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('partner') || urlParams.get('pid') || null;
}

/**
 * Check if a module/scenario is allowed for a partner
 * @param {Object} partner - Partner configuration object
 * @param {string} moduleId - Module/Scenario ID to check
 * @returns {boolean} True if module is allowed, false otherwise
 */
export function isModuleAllowed(partner, moduleId) {
  // If no partner (default mode), all modules are allowed
  if (!partner) return true;

  // If partner has no modules array or empty array, allow all
  if (!partner.modules || !Array.isArray(partner.modules) || partner.modules.length === 0) {
    return true;
  }

  // Check if module is in the allowed list
  return partner.modules.includes(moduleId);
}

/**
 * Filter scenarios based on partner's allowed modules
 * @param {Array} scenarios - Array of scenario objects
 * @param {Object} partner - Partner configuration object
 * @returns {Array} Filtered scenarios
 */
export function filterScenariosByPartner(scenarios, partner) {
  // If no partner, return all scenarios
  if (!partner) return scenarios;

  // If partner has no modules restriction (empty array), return all
  if (!partner.modules || !Array.isArray(partner.modules) || partner.modules.length === 0) {
    return scenarios;
  }

  // Filter scenarios: keep only those whose ID, slug, or title matches allowed modules
  return scenarios.filter(scenario => {
    // Convert to strings and lowercase (id might be a number)
    const scenarioId = String(scenario.id || '').toLowerCase();
    const scenarioSlug = String(scenario.slug || '').toLowerCase();
    const scenarioTitle = String(scenario.title || '').toLowerCase();

    return partner.modules.some(moduleId => {
      const normalizedModuleId = String(moduleId).toLowerCase();
      return scenarioId.includes(normalizedModuleId) ||
             scenarioSlug.includes(normalizedModuleId) ||
             scenarioTitle.includes(normalizedModuleId) ||
             normalizedModuleId.includes(scenarioId) ||
             normalizedModuleId.includes(scenarioSlug) ||
             normalizedModuleId.includes(scenarioTitle);
    });
  });
}

export default MOCK_PARTNERS;
