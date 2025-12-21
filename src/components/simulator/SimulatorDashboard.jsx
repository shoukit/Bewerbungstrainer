import React, { useState, useEffect, useMemo } from 'react';
import {
  Briefcase,
  Banknote,
  User,
  Presentation,
  Target,
  Mic,
  Loader2,
  AlertCircle,
  Sparkles,
  TrendingUp,
  MessageCircle,
  LayoutGrid,
  Clock,
  FolderOpen,
  Folder,
} from 'lucide-react';
import { getWPNonce, getWPApiUrl } from '@/services/wordpress-api';
import { usePartner } from '@/context/PartnerContext';
import { useCategories } from '@/hooks/useCategories';
import { DEFAULT_BRANDING } from '@/config/partners';
import { COLORS } from '@/config/colors';
import { ScenarioCard, ScenarioCardGrid } from '@/components/ui/ScenarioCard';
import MobileFilterSheet from '@/components/ui/MobileFilterSheet';

/**
 * Icon mapping for scenarios
 */
const ICON_MAP = {
  briefcase: Briefcase,
  banknote: Banknote,
  user: User,
  presentation: Presentation,
  target: Target,
  mic: Mic,
};

/**
 * Category Badge Component
 * Uses dynamic categories from useCategories hook
 */
const CategoryBadge = ({ category, getCategoryConfig }) => {
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
 * Simulator Dashboard Component
 *
 * Displays available training scenarios in a grid layout
 */
const SimulatorDashboard = ({ onSelectScenario, isAuthenticated, requireAuth, setPendingScenario, onNavigateToHistory }) => {
  // Partner theming and scenario filtering (includes setup filtering)
  const { branding, filterScenariosBySetupAndPartner } = usePartner();
  const { getCategoryConfig, getCategoriesForFilter, matchesCategory } = useCategories();
  const headerGradient = branding?.['--header-gradient'] || DEFAULT_BRANDING['--header-gradient'];
  const headerText = branding?.['--header-text'] || DEFAULT_BRANDING['--header-text'];
  const primaryAccent = branding?.['--primary-accent'] || DEFAULT_BRANDING['--primary-accent'];
  const [scenarios, setScenarios] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');

  /**
   * Handle scenario selection with auth check
   */
  const handleSelectScenario = (scenario) => {
    // Check authentication before allowing scenario selection
    if (!isAuthenticated) {
      // Store the scenario as pending
      if (setPendingScenario) {
        setPendingScenario(scenario);
      }
      // Open login modal
      if (requireAuth) {
        requireAuth(() => {}, null);
      }
      return;
    }

    // User is authenticated - proceed with selection
    onSelectScenario(scenario);
  };
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get base filtered scenarios (by partner and setup)
  const baseFilteredScenarios = useMemo(() => {
    return filterScenariosBySetupAndPartner([...scenarios], 'simulator');
  }, [scenarios, filterScenariosBySetupAndPartner]);

  // Get unique categories from scenarios (flattening multi-category arrays)
  const scenarioCategories = useMemo(() => {
    const allCategories = baseFilteredScenarios.flatMap(s => {
      if (Array.isArray(s.category)) return s.category;
      return s.category ? [s.category] : [];
    });
    return [...new Set(allCategories.filter(Boolean))];
  }, [baseFilteredScenarios]);

  // Get available categories for filter UI (dynamically from API)
  const availableCategories = useMemo(() => {
    return getCategoriesForFilter(scenarioCategories);
  }, [scenarioCategories, getCategoriesForFilter]);

  // Filter scenarios by partner visibility, setup, category, search, and difficulty
  const filteredScenarios = useMemo(() => {
    let filtered = [...baseFilteredScenarios];

    // Category filter (using matchesCategory for flexible matching)
    if (selectedCategory) {
      filtered = filtered.filter(scenario => matchesCategory(scenario.category, selectedCategory));
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(scenario =>
        scenario.title?.toLowerCase().includes(query) ||
        scenario.description?.toLowerCase().includes(query)
      );
    }

    // Difficulty filter
    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(scenario => scenario.difficulty === difficultyFilter);
    }

    return filtered;
  }, [baseFilteredScenarios, selectedCategory, searchQuery, difficultyFilter]);

  // Load scenarios on mount (public endpoint - no auth required)
  useEffect(() => {
    loadScenarios();
  }, []);

  const loadScenarios = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use direct fetch like VideoTrainingDashboard (no Content-Type header for GET)
      const response = await fetch(`${getWPApiUrl()}/simulator/scenarios`, {
        headers: {
          'X-WP-Nonce': getWPNonce(),
        },
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error('Fehler beim Laden der Szenarien');
      }

      const data = await response.json();

      if (data.success && data.data?.scenarios) {
        setScenarios(data.data.scenarios);
      } else {
        throw new Error('Keine Szenarien gefunden');
      }
    } catch (err) {
      console.error('Error loading scenarios:', err);
      setError(err.message || 'Fehler beim Laden der Szenarien');
    } finally {
      setLoading(false);
    }
  };

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
          Szenarien werden geladen...
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
        <AlertCircle style={{ width: '48px', height: '48px', color: '#ef4444' }} />
        <p style={{ color: '#ef4444', fontSize: '16px', textAlign: 'center' }}>
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
          Erneut versuchen
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
              <Sparkles style={{ width: '24px', height: '24px', color: headerText }} />
            </div>
            <div>
              <h1 style={{
                fontSize: '28px',
                fontWeight: 700,
                color: COLORS.slate[900],
                margin: 0
              }}>
                Szenario-Training
              </h1>
              <p style={{ fontSize: '14px', color: COLORS.slate[600], margin: 0 }}>
                Trainiere wichtige Karriere-Skills mit KI-Feedback
              </p>
            </div>
          </div>
          {/* My Trainings Button - Only for authenticated users */}
          {isAuthenticated && onNavigateToHistory && (
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
              Meine Szenario-Trainings
            </button>
          )}
        </div>

        {/* Search, Filters and Categories - Responsive */}
        <div style={{ marginTop: '24px' }}>
          <MobileFilterSheet
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Szenarien durchsuchen..."
            categories={availableCategories.map(cat => ({
              key: cat.key,
              label: cat.label,
              shortLabel: cat.shortLabel,
              color: cat.color,
              bgColor: cat.bgColor,
              icon: cat.IconComponent || cat.icon,
            }))}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            showCategories={availableCategories.length > 0}
            difficultyOptions={[
              { value: 'all', label: 'Alle Schwierigkeiten' },
              { value: 'easy', label: 'Einfach' },
              { value: 'beginner', label: 'Einsteiger' },
              { value: 'medium', label: 'Mittel' },
              { value: 'intermediate', label: 'Fortgeschritten' },
              { value: 'hard', label: 'Schwer' },
              { value: 'advanced', label: 'Experte' },
            ]}
            selectedDifficulty={difficultyFilter}
            onDifficultyChange={setDifficultyFilter}
            showDifficulty={true}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        </div>
      </div>

      {/* Scenario Grid */}
      <div>
        <ScenarioCardGrid minCardWidth="340px" viewMode={viewMode}>
          {filteredScenarios.map(scenario => {
            const IconComponent = ICON_MAP[scenario.icon] || Briefcase;
            return (
              <ScenarioCard
                key={scenario.id}
                title={scenario.title}
                description={scenario.description}
                difficulty={scenario.difficulty}
                icon={IconComponent}
                categoryBadge={scenario.category ? <CategoryBadge category={scenario.category} getCategoryConfig={getCategoryConfig} /> : null}
                meta={[
                  { text: `${scenario.question_count_min}-${scenario.question_count_max} Fragen` },
                  { icon: Clock, text: `${Math.round(scenario.time_limit_per_question / 60)} Min/Frage` },
                ]}
                action={{ label: 'Starten', icon: TrendingUp }}
                onClick={() => handleSelectScenario(scenario)}
                viewMode={viewMode}
              />
            );
          })}
        </ScenarioCardGrid>
      </div>

      {/* Empty State */}
      {filteredScenarios.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '48px 24px',
            backgroundColor: 'white',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <Mic style={{ width: '48px', height: '48px', color: '#cbd5e1' }} />
          </div>
          <h3 style={{ color: '#64748b', margin: '0 0 8px 0', fontWeight: 500 }}>
            Keine Trainingsszenarien verfügbar.
          </h3>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '14px' }}>
            {selectedCategory
              ? `In der ausgewählten Kategorie sind keine Szenarien verfügbar.`
              : 'Bitte kontaktieren Sie den Administrator.'}
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
    </div>
  );
};

export default SimulatorDashboard;
