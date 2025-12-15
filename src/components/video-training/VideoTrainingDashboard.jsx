import React, { useState, useEffect } from 'react';
import { Video, User, Briefcase, Presentation, Mic, Target, Banknote, Sparkles, AlertCircle, Loader2, Clock, TrendingUp, FolderOpen } from 'lucide-react';
import { usePartner } from '../../context/PartnerContext';
import { getWPNonce, getWPApiUrl } from '@/services/wordpress-api';
import { ScenarioCard, ScenarioCardGrid, ViewToggle } from '@/components/ui/ScenarioCard';

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

// Scenario type labels
const SCENARIO_TYPE_LABELS = {
  self_presentation: 'Selbstpräsentation',
  interview: 'Bewerbungsgespräch',
  pitch: 'Elevator Pitch',
  negotiation: 'Verhandlung',
  custom: 'Training',
};

/**
 * VideoTrainingDashboard - Scenario selection view
 */
const VideoTrainingDashboard = ({ onSelectScenario, isAuthenticated, requireAuth, setPendingScenario, onNavigateToHistory }) => {
  const [scenarios, setScenarios] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid');

  const { branding } = usePartner();

  // Get themed styles
  const themedGradient = branding?.headerGradient || 'linear-gradient(135deg, #3A7FA7 0%, #2d6a8a 100%)';
  const themedText = branding?.headerText || '#ffffff';
  const primaryAccent = branding?.primaryAccent || '#3A7FA7';

  // Fetch scenarios on mount (public endpoint - no auth required)
  useEffect(() => {
    console.log('🔄 [VideoTrainingDashboard] Loading scenarios...');
    fetchScenarios();
  }, []);

  const fetchScenarios = async () => {
    setIsLoading(true);
    setError(null);

    try {
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
        setScenarios(data.data.scenarios);
      } else {
        throw new Error('Ungültige Antwort vom Server');
      }
    } catch (err) {
      console.error('[VIDEO TRAINING] Error loading scenarios:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectScenario = (scenario) => {
    if (!isAuthenticated) {
      // Store pending scenario and show login modal
      setPendingScenario(scenario);
      requireAuth(() => {
        onSelectScenario(scenario);
      }, {
        type: 'SELECT_VIDEO_SCENARIO',
        scenario,
      });
      return;
    }

    onSelectScenario(scenario);
  };

  // Loading state
  if (isLoading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              border: '3px solid #e2e8f0',
              borderTopColor: primaryAccent,
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px',
            }}
          />
          <p style={{ color: '#64748b' }}>Szenarien werden geladen...</p>
          <style>
            {`@keyframes spin { to { transform: rotate(360deg); } }`}
          </style>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <div style={{ textAlign: 'center' }}>
          <AlertCircle size={48} color="#ef4444" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ color: '#0f172a', marginBottom: '8px' }}>Fehler beim Laden</h3>
          <p style={{ color: '#64748b', marginBottom: '16px' }}>{error}</p>
          <button
            onClick={fetchScenarios}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              background: primaryAccent,
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: themedGradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Video size={24} color={themedText} />
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
                Wirkungs-Analyse
              </h1>
              <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
                Video-Feedback zu Auftreten und Kommunikation
              </p>
            </div>
          </div>
          {/* My Analyses Button - Only for authenticated users */}
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
              Meine Wirkungs-Analysen
            </button>
          )}
        </div>
        {/* View Toggle */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
          <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />
        </div>
      </div>

      {/* Empty state */}
      {scenarios.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Video size={64} color="#cbd5e1" style={{ marginBottom: '16px' }} />
          <h3 style={{ color: '#64748b', fontWeight: 500 }}>Keine Szenarien verfügbar</h3>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>
            Bitte kontaktieren Sie den Administrator.
          </p>
        </div>
      )}

      {/* Scenario Grid */}
      <ScenarioCardGrid viewMode={viewMode}>
        {scenarios.map((scenario) => {
          const IconComponent = ICON_MAP[scenario.icon] || Video;
          const typeLabel = SCENARIO_TYPE_LABELS[scenario.scenario_type] || 'Training';
          return (
            <ScenarioCard
              key={scenario.id}
              title={scenario.title}
              description={scenario.description}
              difficulty={scenario.difficulty}
              icon={IconComponent}
              meta={[
                { icon: Video, text: typeLabel },
                { text: `${scenario.question_count} Fragen` },
                { icon: Clock, text: `~${Math.round(scenario.total_time_limit / 60)} Min.` },
              ]}
              action={{ label: 'Starten', icon: TrendingUp }}
              onClick={() => handleSelectScenario(scenario)}
              viewMode={viewMode}
            />
          );
        })}
      </ScenarioCardGrid>

      {/* Info Box */}
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
            <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6 }}>
              1. Wähle ein Szenario und konfiguriere dein Training<br />
              2. Beantworte die generierten Fragen per Video-Aufnahme<br />
              3. Die KI analysiert dein Video und gibt detailliertes Feedback zu Auftreten, Körpersprache und Kommunikation
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoTrainingDashboard;
