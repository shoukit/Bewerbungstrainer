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
import { usePartner } from '@/context/PartnerContext';
import ScenarioDashboard from '@/components/ui/ScenarioDashboard';
import FeatureInfoModal from '@/components/FeatureInfoModal';

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
const renderInfoBox = (primaryAccent) => (
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
        <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
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
  const { branding } = usePartner();
  const primaryAccent = branding?.primaryAccent || branding?.['--primary-accent'] || '#3A7FA7';

  return (
    <>
      {/* Feature Info Modal - shows on first visit */}
      <FeatureInfoModal featureId="videotraining" showOnMount />

      <ScenarioDashboard
      // Header
      title="Wirkungs-Analyse"
      subtitle="Video-Feedback zu Auftreten und Kommunikation"
      headerIcon={Video}

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
      renderInfoBox={() => renderInfoBox(primaryAccent)}

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
