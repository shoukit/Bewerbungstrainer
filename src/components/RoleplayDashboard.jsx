import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Target,
  ArrowLeft,
  Plus,
  MessageSquare,
  Clock,
  TrendingUp,
  Award,
  Loader2,
  AlertCircle,
  FolderOpen,
  Briefcase,
  Users,
  Banknote,
  Presentation,
  User,
  Folder,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScenarioCard, ScenarioCardGrid } from '@/components/ui/ScenarioCard';
import MobileFilterSheet from '@/components/ui/MobileFilterSheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { getRoleplayScenarios, createCustomRoleplayScenario } from '@/services/roleplay-feedback-adapter';
import { usePartner } from '@/context/PartnerContext';
import { useCategories } from '@/hooks/useCategories';
import { DEFAULT_BRANDING } from '@/config/partners';
import { COLORS } from '@/config/colors';

const RoleplayDashboard = ({ onSelectScenario, onBack, onOpenHistory, isAuthenticated, requireAuth, setPendingAction, pendingScenario, clearPendingScenario, onNavigateToHistory }) => {
  const [scenarios, setScenarios] = useState([]);
  const [filteredScenarios, setFilteredScenarios] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Partner context for white-label module filtering and setup filtering
  const { filterScenariosBySetupAndPartner, isWhiteLabel, partnerName, branding } = usePartner();
  const { getCategoryConfig, getCategoriesForFilter, matchesCategory } = useCategories();

  // Get themed styles
  const headerGradient = branding?.['--header-gradient'] || DEFAULT_BRANDING['--header-gradient'];
  const headerText = branding?.['--header-text'] || DEFAULT_BRANDING['--header-text'];
  const primaryAccent = branding?.['--primary-accent'] || DEFAULT_BRANDING['--primary-accent'];

  // Filters and view mode
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [viewMode, setViewMode] = useState('grid');

  // Get unique categories from scenarios (flattening multi-category arrays)
  const scenarioCategories = useMemo(() => {
    const allCategories = scenarios.flatMap(s => {
      if (Array.isArray(s.category)) {
        // Filter out empty strings from array
        return s.category.filter(c => c && typeof c === 'string' && c.trim());
      }
      return s.category && typeof s.category === 'string' && s.category.trim() ? [s.category] : [];
    });
    return [...new Set(allCategories)];
  }, [scenarios]);

  // Compute available categories for filter UI - only categories with valid labels
  const availableCategories = useMemo(() => {
    const cats = getCategoriesForFilter(scenarioCategories);
    // Extra safeguard: filter out any categories without proper labels
    return cats.filter(cat => cat && cat.label && cat.label.trim());
  }, [scenarioCategories, getCategoriesForFilter]);

  // Custom scenario dialog
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [customScenarioData, setCustomScenarioData] = useState({
    title: '',
    description: '',
    difficulty: 'medium',
  });

  // Load scenarios on mount (public endpoint - no auth required)
  useEffect(() => {
    loadScenarios();
  }, []);

  // Filter scenarios when search, filters, partner, or setup changes
  useEffect(() => {
    filterScenarios();
  }, [scenarios, searchQuery, difficultyFilter, selectedCategory, filterScenariosBySetupAndPartner]);

  // Handle pending scenario after login - automatically open variables dialog
  useEffect(() => {
    if (pendingScenario && isAuthenticated) {
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
      // Store the scenario selection as pending action
      setPendingAction({
        type: 'SELECT_ROLEPLAY_SCENARIO',
        scenario: scenario,
      });
      // The requireAuth function will open the login modal
      requireAuth(() => {}, null);
      return;
    }

    // Directly pass scenario to parent - variables will be collected on separate page
    onSelectScenario(scenario);
  };

  const filterScenarios = () => {
    // First, filter by partner's visible scenarios AND selected setup
    let filtered = filterScenariosBySetupAndPartner([...scenarios], 'roleplay');


    // Category filter (using matchesCategory for flexible matching)
    if (selectedCategory) {
      filtered = filtered.filter(scenario =>
        matchesCategory(scenario.category, selectedCategory)
      );
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
                Meine Live-Simulationen
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
                { value: 'medium', label: 'Mittel' },
                { value: 'hard', label: 'Schwer' },
              ]}
              selectedDifficulty={difficultyFilter}
              onDifficultyChange={setDifficultyFilter}
              showDifficulty={true}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
          </div>
        </motion.div>
      </div>

      {/* Scenarios Grid */}
      <div>
        {filteredScenarios.length === 0 ? (
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
              <Sparkles style={{ width: '48px', height: '48px', color: '#cbd5e1' }} />
            </div>
            <h3 style={{ color: '#64748b', margin: '0 0 8px 0', fontWeight: 500 }}>
              Keine Szenarien gefunden.
            </h3>
            <p style={{ color: '#94a3b8', margin: 0, fontSize: '14px' }}>
              Bitte kontaktieren Sie den Administrator.
            </p>
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

    </div>
  );
};

export default RoleplayDashboard;
