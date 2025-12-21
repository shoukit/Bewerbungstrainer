/**
 * Scenario Setups Configuration
 *
 * Each setup is a predefined bundle of scenarios for specific target audiences.
 * Scenarios can belong to multiple setups via their target_audience field.
 */

export const SCENARIO_SETUPS = {
  'karriere-placement': {
    id: 'karriere-placement',
    name: 'Karriere & Placement',
    description: 'Vom Berufseinstieg bis zum Jobwechsel - optimal vorbereitet ins Vorstellungsgespräch',
    icon: '🎯',
    color: '#3b82f6', // blue
    focus: 'Job bekommen',
    targetGroup: 'B2C / Arbeitsamt',
  },
  'corporate-essentials': {
    id: 'corporate-essentials',
    name: 'Corporate Essentials',
    description: 'Grundlegende Kommunikations- und Gesprächskompetenzen für den Berufsalltag',
    icon: '🏢',
    color: '#6366f1', // indigo
    focus: 'Professionell kommunizieren',
    targetGroup: 'B2B Allgemein',
  },
  'high-performance-sales': {
    id: 'high-performance-sales',
    name: 'High Performance Sales',
    description: 'Vertriebstraining für maximale Abschlussquoten und Kundengewinnung',
    icon: '💰',
    color: '#10b981', // emerald
    focus: 'Umsatz machen',
    targetGroup: 'B2B Vertrieb',
  },
  'coaching-toolkit': {
    id: 'coaching-toolkit',
    name: 'Coaching Toolkit',
    description: 'Werkzeuge und Techniken für effektives Coaching und Mitarbeiterentwicklung',
    icon: '🛠️',
    color: '#f59e0b', // amber
    focus: 'Menschen entwickeln',
    targetGroup: 'B2B HR / Coaches',
  },
  'leadership-academy': {
    id: 'leadership-academy',
    name: 'Leadership Academy',
    description: 'Führungskompetenzen für Manager und Teamleiter',
    icon: '👔',
    color: '#8b5cf6', // violet
    focus: 'Menschen führen',
    targetGroup: 'B2B HR / Führungskräfte',
  },
  'social-care': {
    id: 'social-care',
    name: 'Social & Care',
    description: 'Kommunikation im sozialen und pflegerischen Bereich',
    icon: '💚',
    color: '#ec4899', // pink
    focus: 'Helfen & Schützen',
    targetGroup: 'Public / Health',
  },
  'customer-care': {
    id: 'customer-care',
    name: 'Customer Care & Resilience',
    description: 'Kundenservice, Beschwerdemanagement und Deeskalation',
    icon: '🛡️',
    color: '#ef4444', // red
    focus: 'Deeskalieren & Lösen',
    targetGroup: 'B2B Service',
  },
};

// Array of all setups for iteration
export const SCENARIO_SETUPS_LIST = Object.values(SCENARIO_SETUPS);

// Get setup by ID
export function getSetupById(id) {
  return SCENARIO_SETUPS[id] || null;
}

// Get setup by name (for matching with target_audience field)
export function getSetupByName(name) {
  return SCENARIO_SETUPS_LIST.find(setup => setup.name === name) || null;
}

/**
 * Check if a scenario belongs to a specific setup
 * @param {object} scenario - Scenario object with target_audience field
 * @param {string} setupId - Setup ID to check
 * @returns {boolean}
 */
export function scenarioBelongsToSetup(scenario, setupId) {
  if (!scenario?.target_audience || !setupId) {
    return false;
  }

  const setup = getSetupById(setupId);
  if (!setup) {
    return false;
  }

  // Parse target_audience (semicolon separated)
  const audiences = scenario.target_audience.split(';').map(a => a.trim());

  // Check if setup name is in the audiences
  return audiences.includes(setup.name);
}

/**
 * Filter scenarios by setup
 * @param {array} scenarios - Array of scenarios
 * @param {string} setupId - Setup ID to filter by
 * @returns {array} Filtered scenarios
 */
export function filterScenariosBySetup(scenarios, setupId) {
  if (!scenarios || !Array.isArray(scenarios)) {
    return [];
  }

  if (!setupId) {
    return scenarios; // No filter, return all
  }

  return scenarios.filter(scenario => scenarioBelongsToSetup(scenario, setupId));
}

/**
 * Get all setups a scenario belongs to
 * @param {object} scenario - Scenario object with target_audience field
 * @returns {array} Array of setup objects
 */
export function getScenarioSetups(scenario) {
  if (!scenario?.target_audience) {
    return [];
  }

  const audiences = scenario.target_audience.split(';').map(a => a.trim());

  return SCENARIO_SETUPS_LIST.filter(setup => audiences.includes(setup.name));
}

export default SCENARIO_SETUPS;
