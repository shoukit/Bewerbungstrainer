/**
 * ScenarioDashboard - Unified Dashboard Component
 *
 * A reusable dashboard component that provides consistent functionality across all dashboards:
 * - Smart Briefing
 * - Szenario-Training (Simulator)
 * - Wirkungs-Analyse (Video Training)
 * - Live-Simulationen (Roleplay)
 *
 * Features:
 * - Responsive layout with header, filters, and grid/list view
 * - Category filtering via useCategories hook or custom config
 * - Search functionality
 * - Partner/setup-based scenario filtering
 * - Loading, error, and empty states
 * - Theming via PartnerContext
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Loader2, AlertCircle, FolderOpen, Folder } from 'lucide-react';
import { usePartner } from '@/context/PartnerContext';
import { useCategories } from '@/hooks/useCategories';
import { DEFAULT_BRANDING } from '@/config/partners';
import { COLORS } from '@/config/colors';
import { ScenarioCard, ScenarioCardGrid } from '@/components/ui/ScenarioCard';
import MobileFilterSheet from '@/components/ui/MobileFilterSheet';

/**
 * Single Category Badge Component
 * Renders a single category badge
 */
const SingleCategoryBadge = ({ category, getCategoryConfig }) => {
  const config = getCategoryConfig(category);

  if (!config) return null;

  const CategoryIcon = config.IconComponent || config.icon || Folder;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        borderRadius: '16px',
        fontSize: '11px',
        fontWeight: 600,
        backgroundColor: config.bgColor,
        color: config.color,
      }}
    >
      <CategoryIcon style={{ width: '12px', height: '12px' }} />
      {config.shortLabel}
    </span>
  );
};

/**
 * Default Category Badge Component
 * Uses dynamic categories from useCategories hook
 * Supports both single category (string) and multiple categories (array)
 */
const DefaultCategoryBadge = ({ category, getCategoryConfig }) => {
  // Handle array of categories
  if (Array.isArray(category)) {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
        {category.map((cat, index) => (
          <SingleCategoryBadge key={index} category={cat} getCategoryConfig={getCategoryConfig} />
        ))}
      </div>
    );
  }

  // Handle single category (string)
  return <SingleCategoryBadge category={category} getCategoryConfig={getCategoryConfig} />;
};

/**
 * ScenarioDashboard Component
 *
 * @param {object} props
 * @param {string} props.title - Dashboard title
 * @param {string} props.subtitle - Dashboard subtitle
 * @param {React.Component} props.headerIcon - Icon component for header
 * @param {Function} props.fetchScenarios - Async function to fetch scenarios, returns array
 * @param {string} props.moduleKey - Key for filterScenariosBySetupAndPartner (e.g., 'simulator', 'briefings', 'video_training', 'roleplay')
 * @param {string} props.historyButtonLabel - Label for "My X" button
 * @param {Function} props.onNavigateToHistory - Callback when history button is clicked
 * @param {Function} props.onSelectScenario - Callback when scenario is selected
 * @param {Function} props.renderCardMeta - (scenario) => array of meta items [{icon, text}]
 * @param {Function} props.renderCategoryBadge - (scenario, getCategoryConfig) => React element (optional, uses default if not provided)
 * @param {Function} props.getIconForScenario - (scenario) => Icon component
 * @param {string} props.categoryField - Field name for category (default: 'category')
 * @param {object} props.customCategoryConfig - Custom category config like VideoTraining's SCENARIO_TYPE_CONFIG (optional)
 * @param {React.Component} props.emptyStateIcon - Icon for empty state
 * @param {string} props.searchPlaceholder - Placeholder for search input
 * @param {React.ReactNode} props.headerActions - Additional header actions (right side)
 * @param {React.ReactNode} props.filterActions - Custom actions for filter area (e.g., "Create Template" button)
 * @param {Function} props.renderInfoBox - () => React element for info box at bottom (optional)
 * @param {React.ReactNode} props.extraContent - Additional content (e.g., dialogs)
 * @param {string} props.cardActionLabel - Label for card action button (default: 'Starten')
 * @param {React.Component} props.cardActionIcon - Icon for card action button
 * @param {Function} props.getCardCustomActions - (scenario) => React element for custom card actions (e.g., edit/delete)
 * @param {boolean} props.isAuthenticated - Whether user is authenticated
 * @param {Function} props.requireAuth - Function to require authentication
 * @param {Function} props.setPendingAction - Function to set pending action for auth flow
 * @param {Function} props.setPendingScenario - Alternative: Function to set pending scenario for auth flow
 * @param {any} props.demoCode - Demo code for non-authenticated access
 * @param {boolean} props.showHistoryButton - Whether to show history button (default: true)
 */
const ScenarioDashboard = ({
  // Header
  title,
  subtitle,
  headerIcon: HeaderIcon,

  // Data fetching
  fetchScenarios,
  moduleKey,

  // History navigation
  historyButtonLabel = 'Meine Sessions',
  onNavigateToHistory,
  showHistoryButton = true,

  // Scenario selection
  onSelectScenario,

  // Card rendering
  renderCardMeta,
  renderCategoryBadge,
  getIconForScenario,
  cardActionLabel = 'Starten',
  cardActionIcon,
  getCardCustomActions,

  // Category system
  categoryField = 'category',
  customCategoryConfig,

  // Empty state
  emptyStateIcon: EmptyStateIcon,
  emptyStateTitle = 'Keine Szenarien verfügbar',
  emptyStateMessage = 'Bitte kontaktieren Sie den Administrator.',

  // Search
  searchPlaceholder = 'Durchsuchen...',

  // Additional content
  headerActions,
  filterActions,
  renderInfoBox,
  extraContent,

  // Authentication
  isAuthenticated,
  requireAuth,
  setPendingAction,
  setPendingScenario,
  demoCode,

  // Pending scenario handling (for post-login auto-selection)
  pendingScenario,
  clearPendingScenario,

  // Loading messages
  loadingMessage = 'Szenarien werden geladen...',
  errorRetryLabel = 'Erneut versuchen',
}) => {
  // State
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');

  // Partner context
  const { branding, filterScenariosBySetupAndPartner } = usePartner();
  const { getCategoryConfig, getCategoriesForFilter, matchesCategory } = useCategories();

  // Theming
  const headerGradient = branding?.['--header-gradient'] || DEFAULT_BRANDING['--header-gradient'];
  const headerText = branding?.['--header-text'] || DEFAULT_BRANDING['--header-text'];
  const primaryAccent = branding?.['--primary-accent'] || DEFAULT_BRANDING['--primary-accent'];

  // Fetch scenarios on mount
  const loadScenarios = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchScenarios();
      setScenarios(data || []);
    } catch (err) {
      console.error(`[${title}] Error loading scenarios:`, err);
      setError(err.message || 'Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  }, [fetchScenarios, title]);

  useEffect(() => {
    loadScenarios();
  }, [loadScenarios]);

  // Handle pending scenario after login - automatically trigger selection
  const pendingHandled = useRef(false);
  useEffect(() => {
    if (pendingScenario && isAuthenticated && !pendingHandled.current) {
      pendingHandled.current = true;
      // Clear the pending scenario first
      if (clearPendingScenario) {
        clearPendingScenario();
      }
      // Then trigger the selection
      onSelectScenario(pendingScenario);
    }
  }, [pendingScenario, isAuthenticated, clearPendingScenario, onSelectScenario]);

  // Get base filtered scenarios (by partner and setup)
  const baseFilteredScenarios = useMemo(() => {
    return filterScenariosBySetupAndPartner([...scenarios], moduleKey);
  }, [scenarios, filterScenariosBySetupAndPartner, moduleKey]);

  // Get unique categories from scenarios
  const scenarioCategories = useMemo(() => {
    if (customCategoryConfig) {
      // Use custom category system (like VideoTraining's scenario_type)
      const types = new Set();
      baseFilteredScenarios.forEach(scenario => {
        const catValue = scenario[categoryField];
        if (catValue && customCategoryConfig[catValue]) {
          types.add(catValue);
        }
      });
      return Array.from(types);
    }

    // Use useCategories hook system (flattening multi-category arrays)
    const allCategories = baseFilteredScenarios.flatMap(s => {
      const catValue = s[categoryField];
      if (Array.isArray(catValue)) {
        return catValue.filter(c => c && typeof c === 'string' && c.trim());
      }
      return catValue && typeof catValue === 'string' && catValue.trim() ? [catValue] : [];
    });
    return [...new Set(allCategories)];
  }, [baseFilteredScenarios, categoryField, customCategoryConfig]);

  // Get available categories for filter UI - only categories with at least one scenario
  const availableCategories = useMemo(() => {
    if (customCategoryConfig) {
      // Use custom category config - only include categories that have scenarios
      return scenarioCategories
        .filter(key => {
          // Check if at least one scenario matches this category
          return baseFilteredScenarios.some(scenario => scenario[categoryField] === key);
        })
        .map(key => ({
          key,
          label: customCategoryConfig[key]?.label || key,
          shortLabel: customCategoryConfig[key]?.label || key,
          color: customCategoryConfig[key]?.color,
          bgColor: customCategoryConfig[key]?.bgColor,
          icon: customCategoryConfig[key]?.icon,
          IconComponent: customCategoryConfig[key]?.icon,
        }));
    }

    // Use useCategories hook
    const cats = getCategoriesForFilter(scenarioCategories);

    // Filter to only include categories that have at least one matching scenario
    return cats.filter(cat => {
      if (!cat || !cat.label || !cat.label.trim()) return false;
      // Check if at least one scenario matches this category
      return baseFilteredScenarios.some(scenario =>
        matchesCategory(scenario[categoryField], cat.key)
      );
    });
  }, [scenarioCategories, customCategoryConfig, getCategoriesForFilter, baseFilteredScenarios, categoryField, matchesCategory]);

  // Filter scenarios by category and search
  const filteredScenarios = useMemo(() => {
    let filtered = [...baseFilteredScenarios];

    // Category filter
    if (selectedCategory) {
      if (customCategoryConfig) {
        // Direct field match for custom category system
        filtered = filtered.filter(scenario => scenario[categoryField] === selectedCategory);
      } else {
        // Use matchesCategory for flexible matching with useCategories
        filtered = filtered.filter(scenario =>
          matchesCategory(scenario[categoryField], selectedCategory)
        );
      }
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(scenario =>
        scenario.title?.toLowerCase().includes(query) ||
        scenario.description?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [baseFilteredScenarios, selectedCategory, searchQuery, categoryField, customCategoryConfig, matchesCategory]);

  // Handle scenario selection with auth check
  const handleSelectScenario = useCallback((scenario) => {
    if (!isAuthenticated && !demoCode) {
      // Store the scenario as pending
      if (setPendingScenario) {
        setPendingScenario(scenario);
      } else if (setPendingAction) {
        setPendingAction({
          type: 'SELECT_SCENARIO',
          scenario,
        });
      }
      // Open login modal
      if (requireAuth) {
        requireAuth(() => {
          onSelectScenario(scenario);
        }, { type: 'SELECT_SCENARIO', scenario });
      }
      return;
    }

    onSelectScenario(scenario);
  }, [isAuthenticated, demoCode, setPendingScenario, setPendingAction, requireAuth, onSelectScenario]);

  // Render category badge (with fallback to default)
  const renderCategoryBadgeInternal = useCallback((scenario) => {
    const categoryValue = scenario[categoryField];
    if (!categoryValue) return null;

    if (renderCategoryBadge) {
      return renderCategoryBadge(scenario, getCategoryConfig);
    }

    if (customCategoryConfig && customCategoryConfig[categoryValue]) {
      const config = customCategoryConfig[categoryValue];
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '16px',
            fontSize: '11px',
            fontWeight: 600,
            backgroundColor: config.bgColor,
            color: config.color,
          }}
        >
          {config.icon && <config.icon style={{ width: '12px', height: '12px' }} />}
          {config.label}
        </span>
      );
    }

    return <DefaultCategoryBadge category={categoryValue} getCategoryConfig={getCategoryConfig} />;
  }, [categoryField, renderCategoryBadge, customCategoryConfig, getCategoryConfig]);

  // Loading state
  if (loading) {
    return (
      <div style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px',
        gap: '16px'
      }}>
        <Loader2
          style={{
            width: '48px',
            height: '48px',
            color: primaryAccent,
            animation: 'spin 1s linear infinite'
          }}
        />
        <p style={{ color: COLORS.slate[600], fontSize: '16px' }}>
          {loadingMessage}
        </p>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px',
        gap: '16px'
      }}>
        <AlertCircle style={{ width: '48px', height: '48px', color: COLORS.red[500] }} />
        <p style={{ color: COLORS.red[500], fontSize: '16px', textAlign: 'center' }}>
          {error}
        </p>
        <button
          onClick={loadScenarios}
          style={{
            padding: '12px 24px',
            borderRadius: '12px',
            border: 'none',
            background: primaryAccent,
            color: 'white',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          {errorRetryLabel}
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: headerGradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {HeaderIcon && <HeaderIcon style={{ width: '24px', height: '24px', color: headerText }} />}
            </div>
            <div>
              <h1 style={{
                fontSize: '28px',
                fontWeight: 700,
                color: COLORS.slate[900],
                margin: 0
              }}>
                {title}
              </h1>
              <p style={{ fontSize: '14px', color: COLORS.slate[600], margin: 0 }}>
                {subtitle}
              </p>
            </div>
          </div>

          {/* Right side: History button + custom header actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {headerActions}

            {/* My Sessions Button - Always visible when onNavigateToHistory is provided */}
            {showHistoryButton && onNavigateToHistory && (
              <button
                onClick={onNavigateToHistory}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  borderRadius: '12px',
                  border: `2px solid ${primaryAccent}`,
                  backgroundColor: 'white',
                  color: primaryAccent,
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <FolderOpen size={18} />
                {historyButtonLabel}
              </button>
            )}
          </div>
        </div>

        {/* Search, Filters and Categories */}
        <div style={{ marginTop: '24px' }}>
          <MobileFilterSheet
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder={searchPlaceholder}
            categories={availableCategories.map(cat => ({
              key: cat.key,
              label: cat.label,
              shortLabel: cat.shortLabel || cat.label,
              color: cat.color,
              bgColor: cat.bgColor,
              icon: cat.IconComponent || cat.icon,
            }))}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            showCategories={availableCategories.length > 0}
            showDifficulty={false}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            customActions={filterActions}
          />
        </div>
      </div>

      {/* Scenario Grid */}
      {filteredScenarios.length > 0 ? (
        <ScenarioCardGrid minCardWidth="340px" viewMode={viewMode}>
          {filteredScenarios.map(scenario => {
            const IconComponent = getIconForScenario ? getIconForScenario(scenario) : null;
            const meta = renderCardMeta ? renderCardMeta(scenario) : [];
            const customActions = getCardCustomActions ? getCardCustomActions(scenario) : null;

            return (
              <ScenarioCard
                key={scenario.id}
                title={scenario.title}
                description={scenario.description}
                icon={IconComponent}
                categoryBadge={renderCategoryBadgeInternal(scenario)}
                meta={meta}
                action={cardActionIcon ? { label: cardActionLabel, icon: cardActionIcon } : { label: cardActionLabel }}
                onClick={() => handleSelectScenario(scenario)}
                viewMode={viewMode}
                customActions={customActions}
              />
            );
          })}
        </ScenarioCardGrid>
      ) : (
        /* Empty State */
        <div
          style={{
            textAlign: 'center',
            padding: '48px 24px',
            backgroundColor: 'white',
            borderRadius: '16px',
            border: `1px solid ${COLORS.slate[200]}`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            {EmptyStateIcon ? (
              <EmptyStateIcon style={{ width: '48px', height: '48px', color: COLORS.slate[300] }} />
            ) : (
              <Folder style={{ width: '48px', height: '48px', color: COLORS.slate[300] }} />
            )}
          </div>
          <h3 style={{ color: COLORS.slate[500], margin: '0 0 8px 0', fontWeight: 500 }}>
            {emptyStateTitle}
          </h3>
          <p style={{ color: COLORS.slate[400], margin: 0, fontSize: '14px' }}>
            {selectedCategory
              ? 'In der ausgewählten Kategorie sind keine Szenarien verfügbar.'
              : emptyStateMessage}
          </p>
          {selectedCategory && baseFilteredScenarios.length > 0 && (
            <button
              onClick={() => setSelectedCategory(null)}
              style={{
                marginTop: '16px',
                padding: '10px 20px',
                borderRadius: '20px',
                border: `2px solid ${primaryAccent}`,
                backgroundColor: 'white',
                color: primaryAccent,
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Alle Szenarien anzeigen
            </button>
          )}
        </div>
      )}

      {/* Info Box */}
      {renderInfoBox && renderInfoBox()}

      {/* Extra Content (Dialogs, etc.) */}
      {extraContent}
    </div>
  );
};

export default ScenarioDashboard;
