import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Target,
  ArrowLeft,
  Plus,
  Filter,
  Search,
  MessageSquare,
  Clock,
  TrendingUp,
  Award,
  Loader2,
  AlertCircle,
  FolderOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScenarioCard, ScenarioCardGrid, ViewToggle } from '@/components/ui/ScenarioCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { getRoleplayScenarios, createCustomRoleplayScenario } from '@/services/roleplay-feedback-adapter';
import RoleplayVariablesDialog from './RoleplayVariablesDialog';
import { usePartner } from '@/context/PartnerContext';
import { DEFAULT_BRANDING } from '@/config/partners';
import { COLORS } from '@/config/colors';

/**
 * Shared input styles for consistent form elements
 */
const getInputStyles = (primaryAccent, focusRing) => ({
  base: {
    height: '44px',
    borderRadius: '12px',
    border: `2px solid ${COLORS.slate[200]}`,
    backgroundColor: COLORS.white,
    color: COLORS.slate[800],
    fontSize: '14px',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
    outline: 'none',
    transition: 'all 0.2s',
  },
  focus: {
    borderColor: primaryAccent,
    boxShadow: `0 0 0 3px ${focusRing}`,
  },
  blur: {
    borderColor: COLORS.slate[200],
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
  },
});

const RoleplayDashboard = ({ onSelectScenario, onBack, onOpenHistory, isAuthenticated, requireAuth, setPendingAction, pendingScenario, clearPendingScenario, onNavigateToHistory }) => {
  const [scenarios, setScenarios] = useState([]);
  const [filteredScenarios, setFilteredScenarios] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Partner context for white-label module filtering
  const { filterScenarios: filterByPartner, isWhiteLabel, partnerName, branding } = usePartner();

  // Get themed styles
  const headerGradient = branding?.['--header-gradient'] || DEFAULT_BRANDING['--header-gradient'];
  const headerText = branding?.['--header-text'] || DEFAULT_BRANDING['--header-text'];
  const iconPrimary = branding?.['--icon-primary'] || DEFAULT_BRANDING['--icon-primary'];
  const primaryAccent = branding?.['--primary-accent'] || DEFAULT_BRANDING['--primary-accent'];
  const focusRing = branding?.['--focus-ring'] || DEFAULT_BRANDING['--focus-ring'];

  // Memoized input styles
  const inputStyles = useMemo(
    () => getInputStyles(primaryAccent, focusRing),
    [primaryAccent, focusRing]
  );

  // Filters and view mode
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');

  // Custom scenario dialog
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [customScenarioData, setCustomScenarioData] = useState({
    title: '',
    description: '',
    difficulty: 'medium',
  });

  // Variables dialog
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [showVariablesDialog, setShowVariablesDialog] = useState(false);

  // Load scenarios on mount (public endpoint - no auth required)
  useEffect(() => {
    console.log('🔄 [RoleplayDashboard] Loading scenarios...');
    loadScenarios();
  }, []);

  // Filter scenarios when search, filters, or partner changes
  useEffect(() => {
    filterScenarios();
  }, [scenarios, searchQuery, difficultyFilter, filterByPartner]);

  // Handle pending scenario after login - automatically open variables dialog
  useEffect(() => {
    if (pendingScenario && isAuthenticated) {
      console.log('🔐 [RoleplayDashboard] Processing pending scenario after login:', pendingScenario.title);
      setSelectedScenario(pendingScenario);
      setShowVariablesDialog(true);
      // Clear the pending scenario
      if (clearPendingScenario) {
        clearPendingScenario();
      }
    }
  }, [pendingScenario, isAuthenticated, clearPendingScenario]);

  const loadScenarios = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await getRoleplayScenarios();
      setScenarios(data);
    } catch (err) {
      console.error('Failed to load scenarios:', err);
      setError(err.message || 'Fehler beim Laden der Szenarien');
    } finally {
      setIsLoading(false);
    }
  };

  const handleScenarioClick = (scenario) => {
    // Check authentication before allowing scenario selection
    if (!isAuthenticated) {
      console.log('🔐 [RoleplayDashboard] Auth required - storing pending action for scenario:', scenario.title);
      // Store the scenario selection as pending action
      setPendingAction({
        type: 'SELECT_ROLEPLAY_SCENARIO',
        scenario: scenario,
        variables: {}, // Will be collected after login
      });
      // The requireAuth function will open the login modal
      requireAuth(() => {}, null);
      return;
    }

    setSelectedScenario(scenario);
    setShowVariablesDialog(true);
  };

  const handleVariablesSubmit = (variables) => {
    console.log('📝 [RoleplayDashboard] Variables collected:', variables);
    setShowVariablesDialog(false);
    onSelectScenario(selectedScenario, variables);
  };

  const handleVariablesCancel = () => {
    setShowVariablesDialog(false);
    setSelectedScenario(null);
  };

  const filterScenarios = () => {
    // First, filter by partner's allowed modules (white-label filtering)
    let filtered = filterByPartner([...scenarios]);

    // Log filtering for debugging in white-label mode
    if (isWhiteLabel) {
      console.log('🏷️ [RoleplayDashboard] Partner filtering applied:', {
        total: scenarios.length,
        afterPartnerFilter: filtered.length,
      });
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (scenario) =>
          scenario.title.toLowerCase().includes(query) ||
          (scenario.description && scenario.description.toLowerCase().includes(query))
      );
    }

    // Difficulty filter
    if (difficultyFilter !== 'all') {
      filtered = filtered.filter((scenario) => scenario.difficulty === difficultyFilter);
    }

    setFilteredScenarios(filtered);
  };

  const handleCreateCustomScenario = async () => {
    try {
      // Validate
      if (!customScenarioData.title || !customScenarioData.description) {
        alert('Bitte fülle Titel und Beschreibung aus.');
        return;
      }

      const customScenario = await createCustomRoleplayScenario(customScenarioData);
      setShowCustomDialog(false);

      // Immediately start the custom scenario
      onSelectScenario(customScenario);
    } catch (err) {
      console.error('Failed to create custom scenario:', err);
      alert(err.message || 'Fehler beim Erstellen des eigenen Szenarios');
    }
  };

  // getDifficultyLabel helper - used in custom dialog
  const getDifficultyLabel = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return 'Einfach';
      case 'medium':
        return 'Mittel';
      case 'hard':
        return 'Schwer';
      default:
        return difficulty;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-ocean-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Szenarien werden geladen...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Fehler beim Laden</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <Button onClick={loadScenarios}>Erneut versuchen</Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Back button */}
          {onBack && (
            <Button variant="ghost" onClick={onBack} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zurück
            </Button>
          )}

          {/* Title Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: headerGradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MessageSquare style={{ width: '24px', height: '24px', color: headerText }} />
              </div>
              <div>
                <h1 style={{ fontSize: '28px', fontWeight: 700, color: COLORS.slate[900], margin: 0 }}>
                  Live-Simulationen
                </h1>
                <p style={{ fontSize: '14px', color: COLORS.slate[600], margin: 0 }}>
                  Live Simulationen mit KI-Interviewer
                </p>
              </div>
            </div>
            {/* My Simulations Button - Only for authenticated users */}
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
                Meine Simulationen
              </button>
            )}
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mt-6">
            {/* Search */}
            <div className="relative flex-1">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none"
                style={{ color: COLORS.slate[400] }}
              />
              <input
                type="text"
                placeholder="Szenarien durchsuchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  ...inputStyles.base,
                  width: '100%',
                  paddingLeft: '48px',
                  paddingRight: '16px',
                }}
                onFocus={(e) => Object.assign(e.target.style, inputStyles.focus)}
                onBlur={(e) => Object.assign(e.target.style, inputStyles.blur)}
              />
            </div>

            {/* Difficulty filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5" style={{ color: iconPrimary }} />
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                style={{
                  ...inputStyles.base,
                  padding: '8px 16px',
                  cursor: 'pointer',
                }}
                onFocus={(e) => Object.assign(e.target.style, inputStyles.focus)}
                onBlur={(e) => Object.assign(e.target.style, inputStyles.blur)}
              >
                <option value="all">Alle Schwierigkeiten</option>
                <option value="easy">Einfach</option>
                <option value="medium">Mittel</option>
                <option value="hard">Schwer</option>
              </select>
            </div>

            {/* View Toggle */}
            <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />
          </div>
        </motion.div>
      </div>

      {/* Scenarios Grid */}
      <div>
        {filteredScenarios.length === 0 ? (
          <div className="text-center py-12">
            <Sparkles className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">Keine Szenarien gefunden.</p>
          </div>
        ) : (
          <ScenarioCardGrid viewMode={viewMode}>
            {filteredScenarios.map((scenario) => (
              <ScenarioCard
                key={scenario.id}
                title={scenario.title}
                description={scenario.description}
                difficulty={scenario.difficulty}
                tags={scenario.tags || []}
                meta={[
                  ...(scenario.variables_schema && scenario.variables_schema.length > 0
                    ? [{ icon: Target, text: `${scenario.variables_schema.length} Variablen` }]
                    : []),
                  { icon: Clock, text: '~10 Min' },
                ]}
                action={{ label: 'Starten', icon: TrendingUp }}
                onClick={() => handleScenarioClick(scenario)}
                viewMode={viewMode}
              />
            ))}
          </ScenarioCardGrid>
        )}
      </div>

      {/* Custom Scenario Dialog */}
      <Dialog open={showCustomDialog} onOpenChange={setShowCustomDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              Eigenes Rollenspiel-Szenario erstellen
            </DialogTitle>
            <DialogDescription>
              Erstelle dein eigenes Szenario mit individuellen Anforderungen
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Titel des Szenarios *
              </label>
              <input
                type="text"
                value={customScenarioData.title}
                onChange={(e) =>
                  setCustomScenarioData({ ...customScenarioData, title: e.target.value })
                }
                placeholder="z.B. Gehaltsverhandlung bei Accenture"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Beschreibung & Kontext *
              </label>
              <textarea
                value={customScenarioData.description}
                onChange={(e) =>
                  setCustomScenarioData({ ...customScenarioData, description: e.target.value })
                }
                placeholder="Beschreibe das Szenario und worauf du dich fokussieren möchtest..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Schwierigkeitsgrad
              </label>
              <div className="grid grid-cols-3 gap-3">
                {['easy', 'medium', 'hard'].map((difficulty) => (
                  <button
                    key={difficulty}
                    onClick={() =>
                      setCustomScenarioData({ ...customScenarioData, difficulty: difficulty })
                    }
                    className={`px-4 py-3 rounded-xl border-2 font-semibold transition-all ${
                      customScenarioData.difficulty === difficulty
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {getDifficultyLabel(difficulty)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCustomDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleCreateCustomScenario}>
              <Award className="w-4 h-4 mr-2" />
              Szenario starten
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Variables Input Dialog */}
      <RoleplayVariablesDialog
        open={showVariablesDialog}
        scenario={selectedScenario}
        onSubmit={handleVariablesSubmit}
        onCancel={handleVariablesCancel}
      />
    </div>
  );
};

export default RoleplayDashboard;
