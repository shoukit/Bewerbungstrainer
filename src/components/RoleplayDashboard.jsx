import React from 'react';
import {
  MessageSquare,
  Target,
  Clock,
  TrendingUp,
  Sparkles,
  Briefcase,
} from 'lucide-react';
import { getRoleplayScenarios } from '@/services/roleplay-feedback-adapter';
import ScenarioDashboard from '@/components/ui/ScenarioDashboard';
import FeatureInfoModal from '@/components/FeatureInfoModal';
import FeatureInfoButton from '@/components/FeatureInfoButton';

/**
 * Render meta information for a scenario card
 */
const renderCardMeta = (scenario) => {
  const meta = [];

  if (scenario.variables_schema && scenario.variables_schema.length > 0) {
    meta.push({ icon: Target, text: `${scenario.variables_schema.length} Variablen` });
  }

  meta.push({ icon: Clock, text: '~10 Min' });

  return meta;
};

/**
 * Get icon component for a scenario (roleplay uses default)
 */
const getIconForScenario = () => {
  return Briefcase;
};

/**
 * RoleplayDashboard Component
 *
 * Displays available roleplay scenarios for live simulation
 */
const RoleplayDashboard = ({
  onSelectScenario,
  onBack,
  onOpenHistory,
  isAuthenticated,
  requireAuth,
  setPendingAction,
  pendingScenario,
  clearPendingScenario,
  onNavigateToHistory,
}) => {
  return (
    <>
      {/* Feature Info Modal - shows on first visit */}
      <FeatureInfoModal featureId="roleplay" showOnMount />

      <ScenarioDashboard
      // Header
      title="Live-Simulationen"
      subtitle="Live Simulationen mit KI-Interviewer"
      headerIcon={MessageSquare}
      headerActions={<FeatureInfoButton featureId="roleplay" size="sm" />}

      // Data
      fetchScenarios={getRoleplayScenarios}
      moduleKey="roleplay"

      // History
      historyButtonLabel="Meine Live-Simulationen"
      onNavigateToHistory={onNavigateToHistory}

      // Selection
      onSelectScenario={onSelectScenario}

      // Card rendering
      renderCardMeta={renderCardMeta}
      getIconForScenario={getIconForScenario}
      cardActionLabel="Starten"
      cardActionIcon={TrendingUp}

      // Category
      categoryField="category"

      // Empty state
      emptyStateIcon={Sparkles}
      emptyStateTitle="Keine Szenarien gefunden."

      // Search
      searchPlaceholder="Szenarien durchsuchen..."

      // Auth
      isAuthenticated={isAuthenticated}
      requireAuth={requireAuth}
      setPendingAction={setPendingAction}

      // Pending scenario handling
      pendingScenario={pendingScenario}
      clearPendingScenario={clearPendingScenario}

      // Loading
      loadingMessage="Szenarien werden geladen..."
    />
    </>
  );
};

export default RoleplayDashboard;
