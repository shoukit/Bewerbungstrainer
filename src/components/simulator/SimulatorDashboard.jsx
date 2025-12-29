import React from 'react';
import {
  Briefcase,
  Banknote,
  User,
  Presentation,
  Target,
  Mic,
  Sparkles,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { getWPNonce, getWPApiUrl } from '@/services/wordpress-api';
import ScenarioDashboard from '@/components/ui/ScenarioDashboard';
import FeatureInfoModal from '@/components/FeatureInfoModal';

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
 * Fetch simulator scenarios from the API
 */
const fetchSimulatorScenarios = async () => {
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
    return data.data.scenarios;
  }

  throw new Error('Keine Szenarien gefunden');
};

/**
 * Get icon component for a scenario
 */
const getIconForScenario = (scenario) => {
  return ICON_MAP[scenario.icon] || Briefcase;
};

/**
 * Render meta information for a scenario card
 */
const renderCardMeta = (scenario) => [
  { text: `${scenario.question_count_min}-${scenario.question_count_max} Fragen` },
  { icon: Clock, text: `${Math.round(scenario.time_limit_per_question / 60)} Min/Frage` },
];

/**
 * Simulator Dashboard Component
 *
 * Displays available training scenarios in a grid layout
 */
const SimulatorDashboard = ({
  onSelectScenario,
  isAuthenticated,
  requireAuth,
  setPendingScenario,
  onNavigateToHistory,
}) => {
  return (
    <>
      {/* Feature Info Modal - shows on first visit */}
      <FeatureInfoModal featureId="simulator" showOnMount />

      <ScenarioDashboard
      // Header
      title="Szenario-Training"
      subtitle="Trainiere wichtige Karriere-Skills mit KI-Feedback"
      headerIcon={Sparkles}

      // Data
      fetchScenarios={fetchSimulatorScenarios}
      moduleKey="simulator"

      // History
      historyButtonLabel="Meine Szenario-Trainings"
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
      emptyStateIcon={Mic}
      emptyStateTitle="Keine Trainingsszenarien verfügbar."

      // Search
      searchPlaceholder="Szenarien durchsuchen..."

      // Auth
      isAuthenticated={isAuthenticated}
      requireAuth={requireAuth}
      setPendingScenario={setPendingScenario}

      // Loading
      loadingMessage="Szenarien werden geladen..."
    />
    </>
  );
};

export default SimulatorDashboard;
