import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { getRoleplayScenarios, createCustomRoleplayScenario } from '@/services/roleplay-feedback-adapter';
import RoleplayVariablesDialog from './RoleplayVariablesDialog';
import { usePartner } from '@/context/PartnerContext';
import { DEFAULT_BRANDING } from '@/config/partners';

const RoleplayDashboard = ({ onSelectScenario, onBack, onOpenHistory }) => {
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

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');

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

  // Load scenarios on mount
  useEffect(() => {
    loadScenarios();
  }, []);

  // Filter scenarios when search, filters, or partner changes
  useEffect(() => {
    filterScenarios();
  }, [scenarios, searchQuery, difficultyFilter, filterByPartner]);

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

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'hard':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

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
    <div className="min-h-screen py-4 lg:py-8 px-2 lg:px-4 overflow-x-hidden">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-4 lg:mb-8 px-2">
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

          {/* Title */}
          <div style={{ marginBottom: '24px', textAlign: 'center' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '12px'
            }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  background: headerGradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MessageSquare style={{ width: '24px', height: '24px', color: headerText }} />
              </div>
              <h1 style={{
                fontSize: '28px',
                fontWeight: 700,
                color: '#0f172a',
                margin: 0
              }}>
                Praxis-Training
              </h1>
            </div>
            <p style={{
              fontSize: '16px',
              color: '#475569',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              Wähle ein Szenario und übe realistische Gespräche
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mt-6">
            {/* Search */}
            <div className="relative flex-1">
              <Search
                className="absolute top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none"
                style={{ left: '16px', color: '#94a3b8' }}
              />
              <input
                type="text"
                placeholder="Szenarien durchsuchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  height: '44px',
                  paddingLeft: '48px',
                  paddingRight: '16px',
                  borderRadius: '12px',
                  border: '2px solid #e2e8f0',
                  backgroundColor: 'white',
                  color: '#1e293b',
                  fontSize: '14px',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                  outline: 'none',
                  transition: 'all 0.2s',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = primaryAccent;
                  e.target.style.boxShadow = `0 0 0 3px ${focusRing}`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
                }}
              />
            </div>

            {/* Difficulty filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5" style={{ color: iconPrimary }} />
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                style={{
                  height: '44px',
                  padding: '8px 16px',
                  borderRadius: '12px',
                  border: '2px solid #e2e8f0',
                  backgroundColor: 'white',
                  color: '#1e293b',
                  fontSize: '14px',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'all 0.2s',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = primaryAccent;
                  e.target.style.boxShadow = `0 0 0 3px ${focusRing}`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
                }}
              >
                <option value="all">Alle Schwierigkeiten</option>
                <option value="easy">Einfach</option>
                <option value="medium">Mittel</option>
                <option value="hard">Schwer</option>
              </select>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Scenarios Grid */}
      <div className="max-w-6xl mx-auto px-2">
        {filteredScenarios.length === 0 ? (
          <div className="text-center py-12">
            <Sparkles className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">Keine Szenarien gefunden.</p>
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1,
                },
              },
            }}
          >
            {filteredScenarios.map((scenario) => (
              <motion.div
                key={scenario.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div
                  onClick={() => handleScenarioClick(scenario)}
                  className="bg-white rounded-3xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 cursor-pointer border border-slate-100 h-full flex flex-col"
                >
                  {/* Difficulty Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold border ${getDifficultyColor(
                        scenario.difficulty
                      )}`}
                    >
                      {getDifficultyLabel(scenario.difficulty)}
                    </span>

                    {/* Tags */}
                    {scenario.tags && scenario.tags.length > 0 && (
                      <div className="flex gap-1">
                        {scenario.tags.slice(0, 2).map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{scenario.title}</h3>

                  {/* Description */}
                  <p className="text-slate-600 text-sm mb-4 flex-1 line-clamp-3">{scenario.description}</p>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      {scenario.variables_schema && scenario.variables_schema.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          <span>{scenario.variables_schema.length} Variablen</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>~10 Min</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-ocean-blue-600 text-sm font-semibold">
                      <span>Starten</span>
                      <TrendingUp className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
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
