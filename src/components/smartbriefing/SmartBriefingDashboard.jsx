import React, { useState, useCallback } from 'react';
import { usePartner } from '@/context/PartnerContext';
import wordpressAPI from '@/services/wordpress-api';
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
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  Heart,
  Folder,
  TrendingUp,
} from 'lucide-react';
import { DEFAULT_BRANDING } from '@/config/partners';
import ScenarioDashboard from '@/components/ui/ScenarioDashboard';
import FeatureInfoModal from '@/components/FeatureInfoModal';
import FeatureInfoButton from '@/components/FeatureInfoButton';

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
  'heart': Heart,
  'folder': Folder,
  'trending-up': TrendingUp,
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
  const primaryAccent = branding?.['--primary-accent'] || DEFAULT_BRANDING['--primary-accent'];

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  /**
   * Fetch templates function
   */
  const fetchTemplates = useCallback(async () => {
    const params = new URLSearchParams();
    if (demoCode) {
      params.append('demo_code', demoCode);
    }

    const response = await wordpressAPI.request(`/smartbriefing/templates?${params.toString()}`, {
      method: 'GET',
    });

    if (response.success && response.data?.templates) {
      return response.data.templates;
    }

    throw new Error('Unerwartete API-Antwort');
  }, [demoCode, refreshKey]);

  /**
   * Handle create template button click
   */
  const handleCreateTemplate = () => {
    if (!isAuthenticated && !demoCode) {
      if (requireAuth) {
        setPendingAction(() => onCreateTemplate);
        requireAuth();
      }
      return;
    }
    onCreateTemplate?.();
  };

  /**
   * Handle edit template
   */
  const handleEditTemplate = (e, template) => {
    e.stopPropagation();
    onEditTemplate?.(template);
  };

  /**
   * Handle delete template
   */
  const handleDeleteTemplate = (e, template) => {
    e.stopPropagation();
    setDeleteConfirm(template);
  };

  /**
   * Confirm delete
   */
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
        // Trigger refetch by updating key
        setRefreshKey(prev => prev + 1);
      }
    } catch (err) {
      console.error('[SmartBriefing] Error deleting template:', err);
    } finally {
      setDeleteConfirm(null);
    }
  };

  /**
   * Get icon for a template
   */
  const getIconForScenario = (template) => {
    return ICON_MAP[template.icon] || FileText;
  };

  /**
   * Render meta for a template card
   */
  const renderCardMeta = (template) => {
    const variableCount = template.variables_schema?.length || 0;
    return [
      { text: `${variableCount} Eingabefeld${variableCount !== 1 ? 'er' : ''}` },
    ];
  };

  /**
   * Render custom actions (edit/delete) for user templates
   */
  const getCardCustomActions = (template) => {
    if (!template.is_custom) return null;

    return (
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
    );
  };

  /**
   * Render filter actions (create template button)
   */
  const filterActions = (isAuthenticated || demoCode) && onCreateTemplate ? (
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
  ) : null;

  /**
   * Render info box
   */
  const renderInfoBox = () => (
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
  );

  /**
   * Render delete confirmation dialog
   */
  const deleteDialog = deleteConfirm && (
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
  );

  return (
    <>
      {/* Feature Info Modal - shows on first visit */}
      <FeatureInfoModal featureId="smartbriefing" showOnMount />

      <ScenarioDashboard
        key={refreshKey}

      // Header
      title="Smart Briefing"
      subtitle="Dein KI-gestützter Vorbereitungs-Assistent"
      headerIcon={FileText}
      headerActions={<FeatureInfoButton featureId="smartbriefing" size="sm" />}

      // Data
      fetchScenarios={fetchTemplates}
      moduleKey="briefings"

      // History
      historyButtonLabel="Meine Briefings"
      onNavigateToHistory={onShowList}

      // Selection
      onSelectScenario={onSelectTemplate}

      // Card rendering
      renderCardMeta={renderCardMeta}
      getIconForScenario={getIconForScenario}
      getCardCustomActions={getCardCustomActions}
      cardActionLabel="Briefing erstellen"
      cardActionIcon={ChevronRight}

      // Category
      categoryField="category"

      // Empty state
      emptyStateIcon={FileText}
      emptyStateTitle="Keine Templates gefunden"
      emptyStateMessage="Es wurden noch keine Briefing-Templates erstellt."

      // Search
      searchPlaceholder="Briefings durchsuchen..."

      // Filter actions
      filterActions={filterActions}

      // Info box
      renderInfoBox={renderInfoBox}

      // Extra content (delete dialog)
      extraContent={deleteDialog}

      // Auth
      isAuthenticated={isAuthenticated}
      requireAuth={requireAuth}
      setPendingAction={setPendingAction}
      demoCode={demoCode}

      // Loading
      loadingMessage="Templates werden geladen..."
      />
    </>
  );
};

export default SmartBriefingDashboard;
