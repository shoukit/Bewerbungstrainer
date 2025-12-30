/**
 * SmartBriefingDashboard Component
 *
 * Displays available briefing templates for selection.
 * Migrated to Tailwind CSS for consistent styling.
 */

import React, { useState, useCallback } from 'react';
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
import ScenarioDashboard from '@/components/ui/composite/ScenarioDashboard';
import FeatureInfoModal from '@/components/global/FeatureInfoModal';
import FeatureInfoButton from '@/components/global/FeatureInfoButton';
import { Button } from '@/components/ui';

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
      <div className="flex gap-1">
        <button
          onClick={(e) => handleEditTemplate(e, template)}
          className="p-1.5 rounded-md border-none bg-transparent text-slate-500 cursor-pointer flex items-center justify-center transition-all hover:bg-slate-100 hover:text-primary"
          title="Template bearbeiten"
        >
          <Pencil size={16} />
        </button>
        <button
          onClick={(e) => handleDeleteTemplate(e, template)}
          className="p-1.5 rounded-md border-none bg-transparent text-slate-500 cursor-pointer flex items-center justify-center transition-all hover:bg-red-50 hover:text-red-500"
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
      className="flex items-center gap-2 py-2.5 px-4 rounded-[10px] border-2 border-dashed border-slate-300 bg-white text-slate-500 text-sm font-medium cursor-pointer transition-all whitespace-nowrap hover:border-primary hover:text-primary"
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
    <div className="mt-12 py-5 px-6 bg-primary/5 rounded-xl border border-primary/20">
      <div className="flex items-start gap-3">
        <Lightbulb size={20} className="text-primary flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-slate-900 mb-1">
            So funktioniert Smart Briefing
          </h4>
          <p className="text-[13px] text-slate-500 leading-relaxed">
            Wähle ein Template aus, gib deine spezifischen Informationen ein (z.B. Unternehmen, Position),
            und erhalte ein maßgeschneidertes Briefing mit Insider-Wissen, Fachbegriffen und cleveren Rückfragen.
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
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={() => setDeleteConfirm(null)}
    >
      <div
        className="bg-white rounded-2xl p-6 max-w-[400px] w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
            <Trash2 size={24} className="text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Template löschen?
            </h3>
            <p className="text-sm text-slate-500">
              Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg p-3 mb-5">
          <p className="text-sm text-slate-600">
            <strong>{deleteConfirm.title}</strong>
          </p>
        </div>

        <div className="flex gap-3 justify-end">
          <Button
            variant="secondary"
            onClick={() => setDeleteConfirm(null)}
          >
            Abbrechen
          </Button>
          <Button
            variant="danger"
            onClick={confirmDelete}
          >
            Löschen
          </Button>
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
