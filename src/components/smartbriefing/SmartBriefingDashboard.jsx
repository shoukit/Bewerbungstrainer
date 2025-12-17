import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { usePartner } from '../../context/PartnerContext';
import wordpressAPI from '../../services/wordpress-api';
import {
  FileText,
  Briefcase,
  Banknote,
  Users,
  User,
  MessageCircle,
  Target,
  Award,
  Book,
  ClipboardList,
  Star,
  Lightbulb,
  Shield,
  Compass,
  Rocket,
  Loader2,
  AlertCircle,
  ChevronRight,
  Sparkles,
  FolderOpen,
  TrendingUp,
  Plus,
  Pencil,
  Trash2,
  Heart,
} from 'lucide-react';
import { COLORS } from '@/config/colors';
import { DEFAULT_BRANDING } from '@/config/partners';
import { ScenarioCard, ScenarioCardGrid } from '@/components/ui/ScenarioCard';
import MobileFilterSheet from '@/components/ui/MobileFilterSheet';

/**
 * Icon mapping for template icons
 */
const ICON_MAP = {
  'file-text': FileText,
  'briefcase': Briefcase,
  'banknote': Banknote,
  'users': Users,
  'user': User,
  'message-circle': MessageCircle,
  'target': Target,
  'award': Award,
  'book': Book,
  'clipboard': ClipboardList,
  'star': Star,
  'lightbulb': Lightbulb,
  'shield': Shield,
  'compass': Compass,
  'rocket': Rocket,
};

/**
 * Category configuration with icons for MobileFilterSheet
 */
const CATEGORIES = {
  MEINE: { label: 'Meine', color: '#ec4899', bgColor: '#fdf2f8', icon: Heart },
  CAREER: { label: 'Karriere', color: '#3b82f6', bgColor: '#eff6ff', icon: Briefcase },
  SALES: { label: 'Vertrieb', color: '#22c55e', bgColor: '#f0fdf4', icon: TrendingUp },
  LEADERSHIP: { label: 'Führung', color: '#a855f7', bgColor: '#faf5ff', icon: Users },
  COMMUNICATION: { label: 'Kommunikation', color: '#f59e0b', bgColor: '#fffbeb', icon: MessageCircle },
};

/**
 * Category Badge Component for Smart Briefing
 */
const SmartBriefingCategoryBadge = ({ category }) => {
  const config = CATEGORIES[category] || CATEGORIES.CAREER;
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
        backgroundColor: `${config.color}15`,
        color: config.color,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
      }}
    >
      {config.label}
    </span>
  );
};

/**
 * SmartBriefingDashboard Component
 *
 * Displays available briefing templates for selection
 */
const SmartBriefingDashboard = ({
  onSelectTemplate,
  onShowList,
  onCreateTemplate,
  onEditTemplate,
  isAuthenticated,
  requireAuth,
  setPendingAction,
  demoCode,
}) => {
  const { branding } = usePartner();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Partner theming
  const headerGradient = branding?.['--header-gradient'] || DEFAULT_BRANDING['--header-gradient'];
  const headerText = branding?.['--header-text'] || DEFAULT_BRANDING['--header-text'];
  const primaryAccent = branding?.['--primary-accent'] || DEFAULT_BRANDING['--primary-accent'];

  // Fetch templates function
  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (demoCode) {
        params.append('demo_code', demoCode);
      }

      const response = await wordpressAPI.request(`/smartbriefing/templates?${params.toString()}`, {
        method: 'GET',
      });

      if (response.success && response.data?.templates) {
        setTemplates(response.data.templates);
      } else {
        throw new Error('Unerwartete API-Antwort');
      }
    } catch (err) {
      console.error('[SmartBriefing] Error fetching templates:', err);
      setError(err.message || 'Fehler beim Laden der Templates');
    } finally {
      setLoading(false);
    }
  }, [demoCode]);

  // Fetch templates on mount
  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Handle template selection
  const handleSelectTemplate = (template) => {
    // For now, allow non-authenticated users to view templates
    // Auth check happens when trying to generate
    onSelectTemplate(template);
  };

  // Handle create template button click
  const handleCreateTemplate = () => {
    if (!isAuthenticated && !demoCode) {
      // Require auth for creating templates
      if (requireAuth) {
        setPendingAction(() => onCreateTemplate);
        requireAuth();
      }
      return;
    }
    onCreateTemplate?.();
  };

  // Handle edit template
  const handleEditTemplate = (e, template) => {
    e.stopPropagation();
    onEditTemplate?.(template);
  };

  // Handle delete template
  const handleDeleteTemplate = async (e, template) => {
    e.stopPropagation();
    setDeleteConfirm(template);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      const params = new URLSearchParams();
      if (demoCode) {
        params.append('demo_code', demoCode);
      }

      const response = await wordpressAPI.request(
        `/smartbriefing/templates/${deleteConfirm.id}?${params.toString()}`,
        { method: 'DELETE' }
      );

      if (response.success) {
        // Refresh templates
        fetchTemplates();
      }
    } catch (err) {
      console.error('[SmartBriefing] Error deleting template:', err);
    } finally {
      setDeleteConfirm(null);
    }
  };

  // Get unique categories from templates
  const availableCategories = useMemo(() =>
    [...new Set(templates.map(t => t.category))],
    [templates]
  );

  // Filter templates by category and search
  const filteredTemplates = useMemo(() => {
    let filtered = [...templates];

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.title?.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [templates, selectedCategory, searchQuery]);

  return (
    <div
      style={{
        padding: '24px',
        maxWidth: '1200px',
        margin: '0 auto',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
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
              <Sparkles size={24} style={{ color: headerText }} />
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
                Smart Briefing
              </h1>
              <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
                Dein KI-gestützter Vorbereitungs-Assistent
              </p>
            </div>
          </div>
          {/* My Briefings Button - Only for authenticated users */}
          {isAuthenticated && onShowList && (
            <button
              onClick={onShowList}
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
              Meine Briefings
            </button>
          )}
        </div>

        {/* Search, Filters and Categories - Responsive */}
        <div style={{ marginTop: '24px' }}>
          <MobileFilterSheet
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Briefings durchsuchen..."
            categories={availableCategories.map(cat => {
              const catConfig = CATEGORIES[cat] || { label: cat, color: '#64748b', bgColor: '#f1f5f9', icon: FileText };
              return {
                key: cat,
                label: catConfig.label,
                color: catConfig.color,
                bgColor: catConfig.bgColor,
                icon: catConfig.icon,
              };
            })}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            showCategories={availableCategories.length > 1}
            showDifficulty={false}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            customActions={
              (isAuthenticated || demoCode) && onCreateTemplate ? (
                <button
                  onClick={handleCreateTemplate}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 16px',
                    borderRadius: '10px',
                    border: '2px dashed #cbd5e1',
                    backgroundColor: 'white',
                    color: '#64748b',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = primaryAccent;
                    e.currentTarget.style.color = primaryAccent;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#cbd5e1';
                    e.currentTarget.style.color = '#64748b';
                  }}
                >
                  <Plus size={18} />
                  <span className="hidden sm:inline">persönliches Template</span>
                  <span className="sm:hidden">Template</span>
                </button>
              ) : null
            }
          />
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '64px 24px',
          }}
        >
          <Loader2
            size={40}
            style={{
              color: primaryAccent,
              animation: 'spin 1s linear infinite',
            }}
          />
          <p style={{ marginTop: '16px', color: '#64748b' }}>
            Templates werden geladen...
          </p>
          <style>
            {`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}
          </style>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div
          style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '12px',
            padding: '24px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
          }}
        >
          <AlertCircle size={24} style={{ color: '#ef4444', flexShrink: 0 }} />
          <div>
            <h3 style={{ margin: '0 0 4px 0', color: '#dc2626', fontSize: '16px' }}>
              Fehler beim Laden
            </h3>
            <p style={{ margin: 0, color: '#991b1b', fontSize: '14px' }}>{error}</p>
          </div>
        </div>
      )}

      {/* Templates Grid */}
      {!loading && !error && (
        <>
          {filteredTemplates.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '48px 24px',
                backgroundColor: '#f8fafc',
                borderRadius: '16px',
              }}
            >
              <FileText size={48} style={{ color: '#cbd5e1', marginBottom: '16px' }} />
              <h3 style={{ color: '#64748b', margin: '0 0 8px 0' }}>
                Keine Templates gefunden
              </h3>
              <p style={{ color: '#94a3b8', margin: 0 }}>
                {selectedCategory
                  ? 'In dieser Kategorie sind keine Templates verfügbar.'
                  : 'Es wurden noch keine Briefing-Templates erstellt.'}
              </p>
            </div>
          ) : (
            <ScenarioCardGrid viewMode={viewMode}>
              {filteredTemplates.map(template => {
                const IconComponent = ICON_MAP[template.icon] || FileText;
                const variableCount = template.variables_schema?.length || 0;
                const isCustom = template.is_custom;
                return (
                  <ScenarioCard
                    key={template.id}
                    title={template.title}
                    description={template.description}
                    icon={IconComponent}
                    categoryBadge={<SmartBriefingCategoryBadge category={template.category} />}
                    meta={[
                      { text: `${variableCount} Eingabefeld${variableCount !== 1 ? 'er' : ''}` },
                    ]}
                    action={{ label: 'Briefing erstellen', icon: ChevronRight }}
                    onClick={() => handleSelectTemplate(template)}
                    viewMode={viewMode}
                    customActions={isCustom ? (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          onClick={(e) => handleEditTemplate(e, template)}
                          style={{
                            padding: '6px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: 'transparent',
                            color: '#64748b',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f1f5f9';
                            e.currentTarget.style.color = primaryAccent;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = '#64748b';
                          }}
                          title="Template bearbeiten"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={(e) => handleDeleteTemplate(e, template)}
                          style={{
                            padding: '6px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: 'transparent',
                            color: '#64748b',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#fef2f2';
                            e.currentTarget.style.color = '#ef4444';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = '#64748b';
                          }}
                          title="Template löschen"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ) : null}
                  />
                );
              })}
            </ScenarioCardGrid>
          )}
        </>
      )}

      {/* Info Box */}
      <div
        style={{
          marginTop: '48px',
          padding: '20px 24px',
          backgroundColor: `${primaryAccent}08`,
          borderRadius: '12px',
          border: `1px solid ${primaryAccent}20`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <Lightbulb size={20} style={{ color: primaryAccent, flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h4 style={{ margin: '0 0 4px 0', color: '#0f172a', fontSize: '14px', fontWeight: 600 }}>
              So funktioniert Smart Briefing
            </h4>
            <p style={{ margin: 0, color: '#64748b', fontSize: '13px', lineHeight: 1.6 }}>
              Wahle ein Template aus, gib deine spezifischen Informationen ein (z.B. Unternehmen, Position),
              und erhalte ein massgeschneidertes Briefing mit Insider-Wissen, Fachbegriffen und cleveren Ruckfragen.
            </p>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '16px',
          }}
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '400px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: '#fef2f2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Trash2 size={24} style={{ color: '#ef4444' }} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>
                  Template löschen?
                </h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
                  Diese Aktion kann nicht rückgängig gemacht werden.
                </p>
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '20px',
              }}
            >
              <p style={{ margin: 0, fontSize: '14px', color: '#475569' }}>
                <strong>{deleteConfirm.title}</strong>
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: 'white',
                  color: '#475569',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Abbrechen
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartBriefingDashboard;
