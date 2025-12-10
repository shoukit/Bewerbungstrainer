/**
 * Partner Configuration for White-Label System ("Modularer Baukasten")
 *
 * Each partner has:
 * - id/slug: Unique identifier used in URL (?partner=xxx or ?pid=xxx)
 * - name: Display name of the partner
 * - branding: CSS color configuration
 * - logo_url: Optional URL to partner's logo
 * - modules: Array of allowed scenario IDs (only these will be shown)
 */

/**
 * Default branding configuration (Karriereheld standard)
 */
export const DEFAULT_BRANDING = {
  '--app-bg-color': 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 50%, #f0fdfa 100%)',
  '--sidebar-bg-color': '#ffffff',
  '--card-bg-color': '#ffffff',
  '--primary-accent': '#3A7FA7', // Ocean Blue 600
  '--primary-accent-light': '#E8F4F8', // Ocean Blue 50
  '--primary-accent-hover': '#2D6485', // Ocean Blue 700
  '--text-main': '#0f172a', // Slate 900
  '--text-secondary': '#475569', // Slate 600
  '--text-muted': '#94a3b8', // Slate 400
  '--border-color': '#e2e8f0', // Slate 200
  '--border-color-light': '#f1f5f9', // Slate 100
};

/**
 * Mock Partners for Testing
 * In production, this would be fetched from an API/database
 */
export const MOCK_PARTNERS = {
  // Demo Partner 1: Vertriebstrainer Mueller
  'vertriebs-mueller': {
    id: 'vertriebs-mueller',
    slug: 'vertriebs-mueller',
    name: 'Vertriebsakademie Müller',
    branding: {
      '--app-bg-color': 'linear-gradient(135deg, #fef3c7 0%, #fff7ed 50%, #fffbeb 100%)',
      '--sidebar-bg-color': '#1e3a5f',
      '--sidebar-text-color': '#ffffff',
      '--sidebar-text-muted': '#94a3b8',
      '--sidebar-active-bg': 'rgba(251, 191, 36, 0.2)',
      '--sidebar-active-text': '#fbbf24',
      '--sidebar-hover-bg': 'rgba(255, 255, 255, 0.1)',
      '--card-bg-color': '#ffffff',
      '--primary-accent': '#d97706', // Amber 600
      '--primary-accent-light': '#fef3c7', // Amber 100
      '--primary-accent-hover': '#b45309', // Amber 700
      '--text-main': '#1c1917', // Stone 900
      '--text-secondary': '#57534e', // Stone 600
      '--text-muted': '#a8a29e', // Stone 400
      '--border-color': '#e7e5e4', // Stone 200
      '--border-color-light': '#f5f5f4', // Stone 100
    },
    logo_url: null, // Optional: 'https://example.com/logo-mueller.png'
    modules: ['kaltakquise', 'einwandbehandlung', 'abschluss', 'preisverhandlung'],
  },

  // Demo Partner 2: Sales Academy Pro
  'sales-academy-pro': {
    id: 'sales-academy-pro',
    slug: 'sales-academy-pro',
    name: 'Sales Academy Pro',
    branding: {
      '--app-bg-color': 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #f0fdfa 100%)',
      '--sidebar-bg-color': '#064e3b',
      '--sidebar-text-color': '#ffffff',
      '--sidebar-text-muted': '#a7f3d0',
      '--sidebar-active-bg': 'rgba(52, 211, 153, 0.2)',
      '--sidebar-active-text': '#34d399',
      '--sidebar-hover-bg': 'rgba(255, 255, 255, 0.1)',
      '--card-bg-color': '#ffffff',
      '--primary-accent': '#059669', // Emerald 600
      '--primary-accent-light': '#d1fae5', // Emerald 100
      '--primary-accent-hover': '#047857', // Emerald 700
      '--text-main': '#022c22', // Emerald 950
      '--text-secondary': '#065f46', // Emerald 800
      '--text-muted': '#6ee7b7', // Emerald 300
      '--border-color': '#a7f3d0', // Emerald 200
      '--border-color-light': '#d1fae5', // Emerald 100
    },
    logo_url: null,
    modules: ['kaltakquise', 'einwandbehandlung', 'followup', 'bedarfsanalyse'],
  },

  // Demo Partner 3: TechSales Institute (purple theme, limited modules)
  'techsales-institute': {
    id: 'techsales-institute',
    slug: 'techsales-institute',
    name: 'TechSales Institute',
    branding: {
      '--app-bg-color': 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 50%, #ede9fe 100%)',
      '--sidebar-bg-color': '#3b0764',
      '--sidebar-text-color': '#ffffff',
      '--sidebar-text-muted': '#c4b5fd',
      '--sidebar-active-bg': 'rgba(167, 139, 250, 0.2)',
      '--sidebar-active-text': '#a78bfa',
      '--sidebar-hover-bg': 'rgba(255, 255, 255, 0.1)',
      '--card-bg-color': '#ffffff',
      '--primary-accent': '#7c3aed', // Violet 600
      '--primary-accent-light': '#ede9fe', // Violet 100
      '--primary-accent-hover': '#6d28d9', // Violet 700
      '--text-main': '#1e1b4b', // Indigo 950
      '--text-secondary': '#4c1d95', // Violet 900
      '--text-muted': '#a78bfa', // Violet 400
      '--border-color': '#ddd6fe', // Violet 200
      '--border-color-light': '#ede9fe', // Violet 100
    },
    logo_url: null,
    modules: ['technische-demo', 'produktpraesentation', 'einwandbehandlung'],
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

  // If partner has no modules array, allow all
  if (!partner.modules || !Array.isArray(partner.modules)) return true;

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

  // If partner has no modules restriction, return all
  if (!partner.modules || !Array.isArray(partner.modules) || partner.modules.length === 0) {
    return scenarios;
  }

  // Filter scenarios: keep only those whose ID or slug is in allowed modules
  return scenarios.filter(scenario => {
    const scenarioId = scenario.id?.toLowerCase() || '';
    const scenarioSlug = scenario.slug?.toLowerCase() || '';

    return partner.modules.some(moduleId => {
      const normalizedModuleId = moduleId.toLowerCase();
      return scenarioId.includes(normalizedModuleId) ||
             scenarioSlug.includes(normalizedModuleId) ||
             normalizedModuleId.includes(scenarioId) ||
             normalizedModuleId.includes(scenarioSlug);
    });
  });
}

export default MOCK_PARTNERS;
