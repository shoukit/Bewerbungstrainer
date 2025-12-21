/**
 * useCategories Hook
 *
 * Provides centralized category management for all dashboards.
 * Fetches categories from the WordPress API and provides utilities
 * for matching scenario categories to the centralized system.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import wordpressAPI from '@/services/wordpress-api';
import {
  Briefcase,
  Users,
  TrendingUp,
  MessageCircle,
  Shield,
  Heart,
  Target,
  Folder,
} from 'lucide-react';

/**
 * Icon mapping from slug to Lucide component
 */
const ICON_MAP = {
  briefcase: Briefcase,
  users: Users,
  'trending-up': TrendingUp,
  'message-circle': MessageCircle,
  shield: Shield,
  heart: Heart,
  target: Target,
  folder: Folder,
};

/**
 * Default icon for unknown icon names
 */
const DEFAULT_ICON = Folder;

/**
 * Get icon component from icon name
 */
const getIconComponent = (iconName) => {
  if (!iconName) return DEFAULT_ICON;
  return ICON_MAP[iconName.toLowerCase()] || DEFAULT_ICON;
};

/**
 * Normalize a category string for matching
 * Handles various formats: "CAREER", "career", "Karriere", "karriere", etc.
 */
const normalizeForMatching = (value) => {
  if (!value) return '';
  return value
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]/g, '');
};

/**
 * Category slug aliases for legacy/alternate naming conventions
 */
const CATEGORY_ALIASES = {
  // Standard uppercase mappings
  'career': 'karriere',
  'leadership': 'fuehrung',
  'sales': 'vertrieb',
  'communication': 'kommunikation',
  'service': 'service',
  'social': 'social',

  // German normalized (without umlauts)
  'karriere': 'karriere',
  'fuehrung': 'fuehrung',
  'vertrieb': 'vertrieb',
  'kommunikation': 'kommunikation',

  // Smart Briefing specific
  'meine': 'meine',

  // Video Training specific (scenario types)
  'selfpresentation': 'karriere',
  'interview': 'karriere',
  'pitch': 'vertrieb',
  'negotiation': 'vertrieb',

  // Roleplay specific
  'vorstellungsgespraech': 'karriere',
  'gehaltsverhandlung': 'vertrieb',
  'fuehrungsgespraech': 'fuehrung',
  'praesentation': 'kommunikation',
  'selbstvorstellung': 'karriere',
  'training': 'kommunikation',
};

// Module-level cache for categories
let categoriesCache = null;
let cacheTimestamp = null;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

/**
 * useCategories Hook
 *
 * @returns {object} Categories data and utilities
 */
export function useCategories() {
  const [categories, setCategories] = useState(categoriesCache || []);
  const [loading, setLoading] = useState(!categoriesCache);
  const [error, setError] = useState(null);

  /**
   * Fetch categories from API
   */
  const fetchCategories = useCallback(async () => {
    // Check cache validity
    if (categoriesCache && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION_MS)) {
      setCategories(categoriesCache);
      setLoading(false);
      return categoriesCache;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await wordpressAPI.getCategories();

      // Update cache
      categoriesCache = data;
      cacheTimestamp = Date.now();

      setCategories(data);
      return data;
    } catch (err) {
      console.error('[useCategories] Failed to fetch categories:', err);
      setError(err.message || 'Failed to fetch categories');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  /**
   * Get category configuration by slug
   * Returns the full category object with icon component added
   */
  const getCategoryBySlug = useCallback((slug) => {
    if (!slug || !categories.length) return null;

    const normalizedSlug = normalizeForMatching(slug);
    const aliasedSlug = CATEGORY_ALIASES[normalizedSlug] || normalizedSlug;

    const category = categories.find(cat =>
      normalizeForMatching(cat.slug) === aliasedSlug ||
      normalizeForMatching(cat.name) === aliasedSlug
    );

    if (!category) return null;

    return {
      ...category,
      IconComponent: getIconComponent(category.icon),
      bgColor: `${category.color}15`,
    };
  }, [categories]);

  /**
   * Get category configuration for display
   * Matches scenario category field to centralized categories
   */
  const getCategoryConfig = useCallback((categoryValue) => {
    const category = getCategoryBySlug(categoryValue);

    if (!category) {
      // Return a default config for unknown categories
      return {
        key: categoryValue || 'unknown',
        label: categoryValue || 'Unbekannt',
        shortLabel: categoryValue || 'Unbekannt',
        icon: DEFAULT_ICON,
        IconComponent: DEFAULT_ICON,
        color: '#64748b',
        bgColor: '#f1f5f9',
      };
    }

    return {
      key: category.slug,
      label: category.name,
      shortLabel: category.shortName || category.name,
      icon: getIconComponent(category.icon),
      IconComponent: getIconComponent(category.icon),
      color: category.color,
      bgColor: category.bgColor,
    };
  }, [getCategoryBySlug]);

  /**
   * Get all categories formatted for filter UI
   * @param {Array} scenarioCategories - Array of category slugs/values from scenarios
   * @returns {Array} Category configs for filter buttons
   */
  const getCategoriesForFilter = useCallback((scenarioCategories = []) => {
    if (!categories.length) return [];

    // If no scenario categories provided, return all categories
    if (!scenarioCategories.length) {
      return categories.map(cat => ({
        key: cat.slug,
        label: cat.name,
        shortLabel: cat.shortName || cat.name,
        icon: getIconComponent(cat.icon),
        IconComponent: getIconComponent(cat.icon),
        color: cat.color,
        bgColor: `${cat.color}15`,
      }));
    }

    // Match scenario categories to centralized categories
    const matchedCategories = new Map();

    scenarioCategories.forEach(scenarioCat => {
      const config = getCategoryConfig(scenarioCat);
      if (config && config.key !== 'unknown' && !matchedCategories.has(config.key)) {
        matchedCategories.set(config.key, config);
      }
    });

    return Array.from(matchedCategories.values());
  }, [categories, getCategoryConfig]);

  /**
   * Check if a category value matches a category slug
   */
  const matchesCategory = useCallback((scenarioCategory, filterCategory) => {
    if (!scenarioCategory || !filterCategory) return false;

    const normalizedScenario = normalizeForMatching(scenarioCategory);
    const aliasedScenario = CATEGORY_ALIASES[normalizedScenario] || normalizedScenario;

    const normalizedFilter = normalizeForMatching(filterCategory);

    return aliasedScenario === normalizedFilter;
  }, []);

  /**
   * Categories as a map for quick lookup
   */
  const categoriesMap = useMemo(() => {
    const map = new Map();
    categories.forEach(cat => {
      map.set(cat.slug, {
        ...cat,
        IconComponent: getIconComponent(cat.icon),
        bgColor: `${cat.color}15`,
      });
    });
    return map;
  }, [categories]);

  return {
    categories,
    categoriesMap,
    loading,
    error,
    refetch: fetchCategories,
    getCategoryBySlug,
    getCategoryConfig,
    getCategoriesForFilter,
    matchesCategory,
  };
}

/**
 * Clear the categories cache
 * Useful when categories are updated in admin
 */
export function clearCategoriesCache() {
  categoriesCache = null;
  cacheTimestamp = null;
}

export default useCategories;
