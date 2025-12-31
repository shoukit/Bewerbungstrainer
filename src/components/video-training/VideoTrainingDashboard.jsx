import React from 'react';
import {
  Video,
  User,
  Briefcase,
  Presentation,
  Mic,
  Target,
  Banknote,
  Sparkles,
  Clock,
  TrendingUp,
  Rocket,
  Handshake,
} from 'lucide-react';
import { getWPNonce, getWPApiUrl } from '@/services/wordpress-api';
import ScenarioDashboard from '@/components/ui/composite/ScenarioDashboard';
import FeatureInfoModal from '@/components/global/FeatureInfoModal';
import FeatureInfoButton from '@/components/global/FeatureInfoButton';

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
    color: '#6366f1',
    bgColor: '#eef2ff',
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
 * Fetch video training scenarios from the API
 */
const fetchVideoScenarios = async () => {
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
    return data.data.scenarios;
  }

  throw new Error('Ungültige Antwort vom Server');
};

/**
 * Get icon component for a scenario
 */
const getIconForScenario = (scenario) => {
  return ICON_MAP[scenario.icon] || Video;
};

/**
 * Render meta information for a scenario card
 */
const renderCardMeta = (scenario) => [
  { text: `${scenario.question_count} Fragen` },
  { icon: Clock, text: `~${Math.round(scenario.total_time_limit / 60)} Min.` },
];

/**
 * Render info box for video training
 */
const renderInfoBox = () => (
  <div className="mt-10 p-5 bg-primary/5 rounded-xl border border-primary/20">
    <div className="flex items-start gap-3">
      <Sparkles size={20} className="text-primary flex-shrink-0 mt-0.5" />
      <div>
        <h4 className="font-semibold text-slate-900 mb-1">
          Wie funktioniert das Video Training?
        </h4>
        <p className="text-sm text-slate-600 leading-relaxed m-0">
          1. Wähle ein Szenario und konfiguriere dein Training<br />
          2. Beantworte die generierten Fragen per Video-Aufnahme<br />
          3. Die KI analysiert dein Video und gibt detailliertes Feedback zu Auftreten, Körpersprache und Kommunikation
        </p>
      </div>
    </div>
  </div>
);

/**
 * VideoTrainingDashboard - Scenario selection view
 */
const VideoTrainingDashboard = ({
  onSelectScenario,
  isAuthenticated,
  requireAuth,
  setPendingScenario,
  onNavigateToHistory,
}) => {
  return (
    <>
      {/* Feature Info Modal - shows on first visit */}
      <FeatureInfoModal featureId="videotraining" showOnMount />

      <ScenarioDashboard
      // Header
      title="Wirkungs-Analyse"
      subtitle="Video-Feedback zu Auftreten und Kommunikation"
      headerIcon={Video}
      headerActions={<FeatureInfoButton featureId="videotraining" size="sm" />}

      // Data
      fetchScenarios={fetchVideoScenarios}
      moduleKey="video_training"

      // History
      historyButtonLabel="Meine Wirkungs-Analysen"
      onNavigateToHistory={onNavigateToHistory}

      // Selection
      onSelectScenario={onSelectScenario}

      // Card rendering
      renderCardMeta={renderCardMeta}
      getIconForScenario={getIconForScenario}
      cardActionLabel="Starten"
      cardActionIcon={TrendingUp}

      // Category - use scenario_type with custom config
      categoryField="scenario_type"
      customCategoryConfig={SCENARIO_TYPE_CONFIG}

      // Empty state
      emptyStateIcon={Video}
      emptyStateTitle="Keine Szenarien verfügbar"

      // Search
      searchPlaceholder="Szenarien durchsuchen..."

      // Info box
      renderInfoBox={renderInfoBox}

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

export default VideoTrainingDashboard;
