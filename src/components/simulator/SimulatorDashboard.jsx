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
  Clock
} from 'lucide-react';
import { getWPNonce, getWPApiUrl } from '@/services/wordpress-api';
import { usePartner } from '@/context/PartnerContext';
import { DEFAULT_BRANDING } from '@/config/partners';
import { COLORS } from '@/config/colors';
import { ScenarioCard, ScenarioCardGrid, ViewToggle } from '@/components/ui/ScenarioCard';
import {
  SCENARIO_CATEGORIES,
  SCENARIO_CATEGORY_CONFIG,
  normalizeCategory,
  getScenarioCategoryConfig
} from '@/config/constants';

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
 * Category icon mapping
 */
const CATEGORY_ICON_MAP = {
  Briefcase: Briefcase,
  Target: Target,
  TrendingUp: TrendingUp,
  MessageCircle: MessageCircle,
};

/**
 * Get category icon component
 */
const getCategoryIcon = (iconName) => {
  return CATEGORY_ICON_MAP[iconName] || Briefcase;
};

/**
 * Category Badge Component
 */
const CategoryBadge = ({ category }) => {
  const normalizedCategory = normalizeCategory(category);
  const config = getScenarioCategoryConfig(normalizedCategory);

  if (!config) return null;

  const CategoryIcon = getCategoryIcon(config.icon);

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
 * Category Filter Bar Component
 */
const CategoryFilterBar = ({ selectedCategory, onSelectCategory, primaryAccent }) => {
  const categories = [
    { key: null, label: 'Alle', icon: LayoutGrid },
    { key: SCENARIO_CATEGORIES.CAREER, ...SCENARIO_CATEGORY_CONFIG[SCENARIO_CATEGORIES.CAREER] },
    { key: SCENARIO_CATEGORIES.LEADERSHIP, ...SCENARIO_CATEGORY_CONFIG[SCENARIO_CATEGORIES.LEADERSHIP] },
    { key: SCENARIO_CATEGORIES.SALES, ...SCENARIO_CATEGORY_CONFIG[SCENARIO_CATEGORIES.SALES] },
    { key: SCENARIO_CATEGORIES.COMMUNICATION, ...SCENARIO_CATEGORY_CONFIG[SCENARIO_CATEGORIES.COMMUNICATION] },
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px',
        marginBottom: '24px',
        padding: '0 24px',
      }}
    >
      {categories.map((cat) => {
        const isSelected = selectedCategory === cat.key;
        const IconComponent = cat.key === null
          ? LayoutGrid
          : getCategoryIcon(cat.icon);
        const chipColor = cat.key === null ? primaryAccent : cat.color;

        return (
          <button
            key={cat.key || 'all'}
            onClick={() => onSelectCategory(cat.key)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '24px',
              fontSize: '14px',
              fontWeight: 600,
              border: `2px solid ${isSelected ? chipColor : COLORS.slate[200]}`,
              backgroundColor: isSelected ? (cat.key === null ? `${primaryAccent}15` : cat.bgColor) : 'white',
              color: isSelected ? chipColor : COLORS.slate[600],
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (!isSelected) {
                e.target.style.borderColor = chipColor;
                e.target.style.backgroundColor = cat.key === null ? `${primaryAccent}10` : cat.bgColor;
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                e.target.style.borderColor = COLORS.slate[200];
                e.target.style.backgroundColor = 'white';
              }
            }}
          >
            <IconComponent style={{ width: '16px', height: '16px' }} />
            {cat.key === null ? 'Alle' : cat.shortLabel}
          </button>
        );
      })}
    </div>
  );
};

/**
 * Simulator Dashboard Component
 *
 * Displays available training scenarios in a grid layout
 */
const SimulatorDashboard = ({ onSelectScenario, isAuthenticated, requireAuth, setPendingScenario }) => {
  // Partner theming
  const { branding } = usePartner();
  const headerGradient = branding?.['--header-gradient'] || DEFAULT_BRANDING['--header-gradient'];
  const headerText = branding?.['--header-text'] || DEFAULT_BRANDING['--header-text'];
  const primaryAccent = branding?.['--primary-accent'] || DEFAULT_BRANDING['--primary-accent'];
  const [scenarios, setScenarios] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [viewMode, setViewMode] = useState('grid');

  /**
   * Handle scenario selection with auth check
   */
  const handleSelectScenario = (scenario) => {
    // Check authentication before allowing scenario selection
    if (!isAuthenticated) {
      console.log('🔐 [SimulatorDashboard] Auth required - storing pending scenario:', scenario.title);
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

  // Filter scenarios by selected category - must be before any conditional returns
  const filteredScenarios = useMemo(() => {
    if (!selectedCategory) {
      return scenarios;
    }
    return scenarios.filter(scenario => {
      const normalizedCategory = normalizeCategory(scenario.category);
      return normalizedCategory === selectedCategory;
    });
  }, [scenarios, selectedCategory]);

  // Load scenarios on mount (public endpoint - no auth required)
  useEffect(() => {
    console.log('🔄 [SimulatorDashboard] Loading scenarios...');
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
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '12px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: headerGradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Sparkles style={{ width: '24px', height: '24px', color: headerText }} />
          </div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 700,
            color: COLORS.slate[900],
            margin: 0
          }}>
            Szenario-Training
          </h1>
        </div>
        <p style={{
          fontSize: '16px',
          color: COLORS.slate[600],
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          Trainiere wichtige Karriere-Skills mit sofortigem KI-Feedback nach jeder Antwort.
          Wähle ein Szenario und starte dein Training.
        </p>
        {/* View Toggle */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
          <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />
        </div>
      </div>

      {/* Category Filter */}
      <CategoryFilterBar
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        primaryAccent={primaryAccent}
      />

      {/* Scenario Grid */}
      <div style={{ padding: '0 24px' }}>
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
                categoryBadge={scenario.category ? <CategoryBadge category={scenario.category} /> : null}
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
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: COLORS.slate[600]
        }}>
          <Mic style={{ width: '48px', height: '48px', marginBottom: '16px', opacity: 0.5 }} />
          <p>
            {selectedCategory
              ? `Keine Szenarien in der Kategorie "${SCENARIO_CATEGORY_CONFIG[selectedCategory]?.shortLabel || selectedCategory}" gefunden.`
              : 'Keine Trainingsszenarien verfügbar.'}
          </p>
          {selectedCategory && scenarios.length > 0 && (
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
