import React, { useState, useEffect } from 'react';
import { Video, User, Briefcase, Presentation, Mic, Target, Banknote, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { usePartner } from '../../context/PartnerContext';
import { getWPNonce, getWPApiUrl } from '@/services/wordpress-api';
import { motion } from 'framer-motion';

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

// Difficulty badge styles
const DIFFICULTY_STYLES = {
  beginner: { bg: 'rgba(34, 197, 94, 0.15)', text: '#16a34a', label: 'Einsteiger' },
  intermediate: { bg: 'rgba(59, 130, 246, 0.15)', text: '#2563eb', label: 'Fortgeschritten' },
  advanced: { bg: 'rgba(168, 85, 247, 0.15)', text: '#9333ea', label: 'Experte' },
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
 * ScenarioCard - Individual scenario card component
 */
const ScenarioCard = ({ scenario, onSelect, themedGradient, themedText, primaryAccent }) => {
  const IconComponent = ICON_MAP[scenario.icon] || Video;
  const difficulty = DIFFICULTY_STYLES[scenario.difficulty] || DIFFICULTY_STYLES.intermediate;
  const typeLabel = SCENARIO_TYPE_LABELS[scenario.scenario_type] || 'Training';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(scenario)}
      style={{
        background: '#fff',
        borderRadius: '16px',
        padding: '24px',
        cursor: 'pointer',
        border: '2px solid #e2e8f0',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = primaryAccent;
        e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#e2e8f0';
        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
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
          <IconComponent size={24} color="#fff" />
        </div>
        <span
          style={{
            padding: '4px 12px',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: 500,
            background: difficulty.bg,
            color: difficulty.text,
          }}
        >
          {difficulty.label}
        </span>
      </div>

      {/* Content */}
      <h3
        style={{
          fontSize: '18px',
          fontWeight: 600,
          color: '#0f172a',
          marginBottom: '8px',
        }}
      >
        {scenario.title}
      </h3>

      <p
        style={{
          fontSize: '14px',
          color: '#64748b',
          marginBottom: '16px',
          lineHeight: 1.5,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {scenario.description}
      </p>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', color: '#94a3b8' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Video size={14} />
          {typeLabel}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {scenario.question_count} Fragen
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          ~{Math.round(scenario.total_time_limit / 60)} Min.
        </span>
      </div>
    </motion.div>
  );
};

/**
 * VideoTrainingDashboard - Scenario selection view
 */
const VideoTrainingDashboard = ({ onSelectScenario, isAuthenticated, requireAuth, setPendingScenario }) => {
  const [scenarios, setScenarios] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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
    <div style={{ padding: '32px', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: themedGradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          <Video size={32} color={themedText} />
        </div>
        <h1
          style={{
            fontSize: '28px',
            fontWeight: 700,
            color: '#0f172a',
            marginBottom: '8px',
          }}
        >
          Video Training
        </h1>
        <p style={{ fontSize: '16px', color: '#64748b', maxWidth: '600px', margin: '0 auto' }}>
          Nimm dich selbst auf Video auf und erhalte detailliertes KI-Feedback zu deinem Auftreten,
          deiner Körpersprache und Kommunikation.
        </p>
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
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '24px',
        }}
      >
        {scenarios.map((scenario) => (
          <ScenarioCard
            key={scenario.id}
            scenario={scenario}
            onSelect={handleSelectScenario}
            themedGradient={themedGradient}
            themedText={themedText}
            primaryAccent={primaryAccent}
          />
        ))}
      </div>

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
