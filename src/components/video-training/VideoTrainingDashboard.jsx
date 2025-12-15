import React, { useState, useEffect, useMemo } from 'react';
import { Video, User, Briefcase, Presentation, Mic, Target, Banknote, Sparkles, AlertCircle, Loader2, Clock, TrendingUp, FolderOpen, Search, Filter, LayoutGrid, MessageSquare, Rocket, Handshake } from 'lucide-react';
import { usePartner } from '../../context/PartnerContext';
import { getWPNonce, getWPApiUrl } from '@/services/wordpress-api';
import { ScenarioCard, ScenarioCardGrid, ViewToggle } from '@/components/ui/ScenarioCard';
import { COLORS } from '@/config/colors';

// Icon mapping for scenarios
const ICON_MAP = {
  video: Video,
  user: User,
  briefcase: Briefcase,
  presentation: Presentation,
  mic: Mic,
  target: Target,
  banknote: Banknote,
};

// Scenario type configuration for category filter
const SCENARIO_TYPE_CONFIG = {
  self_presentation: {
    label: 'Selbstpräsentation',
    icon: User,
    color: '#3A7FA7',
    bgColor: '#E8F4F8',
  },
  interview: {
    label: 'Bewerbungsgespräch',
    icon: Briefcase,
    color: '#059669',
    bgColor: '#d1fae5',
  },
  pitch: {
    label: 'Elevator Pitch',
    icon: Rocket,
    color: '#7c3aed',
    bgColor: '#ede9fe',
  },
  negotiation: {
    label: 'Verhandlung',
    icon: Handshake,
    color: '#d97706',
    bgColor: '#fef3c7',
  },
  custom: {
    label: 'Training',
    icon: Target,
    color: '#64748b',
    bgColor: '#f1f5f9',
  },
};

/**
 * Category Filter Bar for Video Training
 */
const CategoryFilterBar = ({ selectedCategory, onSelectCategory, primaryAccent, availableCategories }) => {
  const categories = [
    { key: null, label: 'Alle', icon: LayoutGrid },
    ...availableCategories.map(key => ({
      key,
      ...SCENARIO_TYPE_CONFIG[key],
    })),
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px',
        marginBottom: '24px',
      }}
    >
      {categories.map((cat) => {
        const isSelected = selectedCategory === cat.key;
        const IconComponent = cat.icon || LayoutGrid;
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
          >
            <IconComponent style={{ width: '16px', height: '16px' }} />
            {cat.label}
          </button>
        );
      })}
    </div>
  );
};

/**
 * VideoTrainingDashboard - Scenario selection view
 */
const VideoTrainingDashboard = ({ onSelectScenario, isAuthenticated, requireAuth, setPendingScenario, onNavigateToHistory }) => {
  const [scenarios, setScenarios] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState(null);

  const { branding } = usePartner();

  // Get themed styles
  const themedGradient = branding?.headerGradient || branding?.['--header-gradient'] || 'linear-gradient(135deg, #3A7FA7 0%, #2d6a8a 100%)';
  const themedText = branding?.headerText || branding?.['--header-text'] || '#ffffff';
  const primaryAccent = branding?.primaryAccent || branding?.['--primary-accent'] || '#3A7FA7';

  // Get available categories from scenarios
  const availableCategories = useMemo(() => {
    const types = new Set();
    scenarios.forEach(scenario => {
      if (scenario.scenario_type && SCENARIO_TYPE_CONFIG[scenario.scenario_type]) {
        types.add(scenario.scenario_type);
      }
    });
    return Array.from(types);
  }, [scenarios]);

  // Filter scenarios by search, difficulty, and category
  const filteredScenarios = useMemo(() => {
    let filtered = [...scenarios];

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(scenario => scenario.scenario_type === selectedCategory);
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
  }, [scenarios, selectedCategory, searchQuery, difficultyFilter]);

  // Fetch scenarios on mount (public endpoint - no auth required)
  useEffect(() => {
    console.log('🔄 [VideoTrainingDashboard] Loading scenarios...');
    fetchScenarios();
  }, []);

  const fetchScenarios = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${getWPApiUrl()}/video-training/scenarios`, {
        headers: {
          'X-WP-Nonce': getWPNonce(),
        },
      });

      if (!response.ok) {
        throw new Error('Fehler beim Laden der Szenarien');
      }

      const data = await response.json();

      if (data.success && data.data?.scenarios) {
        setScenarios(data.data.scenarios);
      } else {
        throw new Error('Ungültige Antwort vom Server');
      }
    } catch (err) {
      console.error('[VIDEO TRAINING] Error loading scenarios:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectScenario = (scenario) => {
    if (!isAuthenticated) {
      // Store pending scenario and show login modal
      setPendingScenario(scenario);
      requireAuth(() => {
        onSelectScenario(scenario);
      }, {
        type: 'SELECT_VIDEO_SCENARIO',
        scenario,
      });
      return;
    }

    onSelectScenario(scenario);
  };

  // Loading state
  if (isLoading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              border: '3px solid #e2e8f0',
              borderTopColor: primaryAccent,
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px',
            }}
          />
          <p style={{ color: '#64748b' }}>Szenarien werden geladen...</p>
          <style>
            {`@keyframes spin { to { transform: rotate(360deg); } }`}
          </style>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <div style={{ textAlign: 'center' }}>
          <AlertCircle size={48} color="#ef4444" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ color: '#0f172a', marginBottom: '8px' }}>Fehler beim Laden</h3>
          <p style={{ color: '#64748b', marginBottom: '16px' }}>{error}</p>
          <button
            onClick={fetchScenarios}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              background: primaryAccent,
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: themedGradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Video size={24} color={themedText} />
            </div>
            <div>
              <h1
                style={{
                  fontSize: '28px',
                  fontWeight: 700,
                  color: '#0f172a',
                  margin: 0,
                }}
              >
                Wirkungs-Analyse
              </h1>
              <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
                Video-Feedback zu Auftreten und Kommunikation
              </p>
            </div>
          </div>
          {/* My Analyses Button - Only for authenticated users */}
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
              Meine Wirkungs-Analysen
            </button>
          )}
        </div>

        {/* Search and Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '24px', alignItems: 'center' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
            <Search
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '18px',
                height: '18px',
                color: COLORS.slate[400],
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              placeholder="Szenarien durchsuchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px 12px 44px',
                borderRadius: '12px',
                border: `1px solid ${COLORS.slate[200]}`,
                fontSize: '14px',
                color: COLORS.slate[900],
                backgroundColor: '#fff',
                outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = primaryAccent;
                e.target.style.boxShadow = `0 0 0 3px ${primaryAccent}20`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = COLORS.slate[200];
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Difficulty Filter */}
          <div style={{ position: 'relative', minWidth: '180px' }}>
            <Filter
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '16px',
                height: '16px',
                color: COLORS.slate[400],
                pointerEvents: 'none',
              }}
            />
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px 12px 40px',
                borderRadius: '12px',
                border: `1px solid ${COLORS.slate[200]}`,
                fontSize: '14px',
                color: COLORS.slate[900],
                backgroundColor: '#fff',
                cursor: 'pointer',
                outline: 'none',
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
                paddingRight: '40px',
              }}
            >
              <option value="all">Alle Schwierigkeiten</option>
              <option value="easy">Einfach</option>
              <option value="beginner">Einsteiger</option>
              <option value="medium">Mittel</option>
              <option value="intermediate">Fortgeschritten</option>
              <option value="hard">Schwer</option>
              <option value="advanced">Experte</option>
            </select>
          </div>

          {/* View Toggle */}
          <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />
        </div>
      </div>

      {/* Category Filter */}
      {availableCategories.length > 0 && (
        <CategoryFilterBar
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          primaryAccent={primaryAccent}
          availableCategories={availableCategories}
        />
      )}

      {/* Empty state */}
      {filteredScenarios.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Video size={64} color="#cbd5e1" style={{ marginBottom: '16px' }} />
          <h3 style={{ color: '#64748b', fontWeight: 500 }}>Keine Szenarien verfügbar</h3>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>
            Bitte kontaktieren Sie den Administrator.
          </p>
        </div>
      )}

      {/* Scenario Grid */}
      <ScenarioCardGrid viewMode={viewMode}>
        {filteredScenarios.map((scenario) => {
          const IconComponent = ICON_MAP[scenario.icon] || Video;
          return (
            <ScenarioCard
              key={scenario.id}
              title={scenario.title}
              description={scenario.description}
              difficulty={scenario.difficulty}
              icon={IconComponent}
              meta={[
                { text: `${scenario.question_count} Fragen` },
                { icon: Clock, text: `~${Math.round(scenario.total_time_limit / 60)} Min.` },
              ]}
              action={{ label: 'Starten', icon: TrendingUp }}
              onClick={() => handleSelectScenario(scenario)}
              viewMode={viewMode}
            />
          );
        })}
      </ScenarioCardGrid>

      {/* Info Box */}
      <div
        style={{
          marginTop: '40px',
          padding: '20px',
          background: `linear-gradient(135deg, ${primaryAccent}10 0%, ${primaryAccent}05 100%)`,
          borderRadius: '12px',
          border: `1px solid ${primaryAccent}20`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <Sparkles size={20} color={primaryAccent} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h4 style={{ fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
              Wie funktioniert das Video Training?
            </h4>
            <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6 }}>
              1. Wähle ein Szenario und konfiguriere dein Training<br />
              2. Beantworte die generierten Fragen per Video-Aufnahme<br />
              3. Die KI analysiert dein Video und gibt detailliertes Feedback zu Auftreten, Körpersprache und Kommunikation
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoTrainingDashboard;
