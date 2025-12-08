import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Banknote,
  User,
  Presentation,
  Target,
  Mic,
  ChevronRight,
  Loader2,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import wordpressAPI from '@/services/wordpress-api';

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
 * Difficulty badge colors
 */
const DIFFICULTY_COLORS = {
  beginner: { bg: 'rgba(34, 197, 94, 0.15)', text: '#16a34a', label: 'Einsteiger' },
  intermediate: { bg: 'rgba(59, 130, 246, 0.15)', text: '#2563eb', label: 'Fortgeschritten' },
  advanced: { bg: 'rgba(168, 85, 247, 0.15)', text: '#9333ea', label: 'Experte' },
};

/**
 * Ocean theme colors
 */
const COLORS = {
  blue: { 500: '#4A9EC9', 600: '#3A7FA7', 700: '#2D6485' },
  teal: { 500: '#3DA389', 600: '#2E8A72' },
  slate: { 100: '#f1f5f9', 200: '#e2e8f0', 400: '#94a3b8', 600: '#475569', 700: '#334155', 800: '#1e293b', 900: '#0f172a' },
};

/**
 * Scenario Card Component
 */
const ScenarioCard = ({ scenario, onSelect }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const IconComponent = ICON_MAP[scenario.icon] || Briefcase;
  const difficulty = DIFFICULTY_COLORS[scenario.difficulty] || DIFFICULTY_COLORS.intermediate;

  // Handle resize for responsive layout
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleClick = (e) => {
    e.stopPropagation();
    onSelect(scenario);
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '24px',
        border: `2px solid ${isHovered ? COLORS.blue[500] : COLORS.slate[200]}`,
        boxShadow: isHovered
          ? '0 10px 25px -5px rgba(74, 158, 201, 0.2), 0 8px 10px -6px rgba(74, 158, 201, 0.1)'
          : '0 1px 3px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      {/* Icon and Difficulty Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '14px',
            background: `linear-gradient(135deg, ${COLORS.blue[500]} 0%, ${COLORS.teal[500]} 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 6px -1px rgba(74, 158, 201, 0.3)',
          }}
        >
          <IconComponent style={{ width: '28px', height: '28px', color: 'white' }} />
        </div>
        <span
          style={{
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 600,
            backgroundColor: difficulty.bg,
            color: difficulty.text,
          }}
        >
          {difficulty.label}
        </span>
      </div>

      {/* Title Row with Button (Desktop) */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'center',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? '12px' : '16px',
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: 700,
          color: COLORS.slate[900],
          margin: 0,
        }}>
          {scenario.title}
        </h3>

        {/* Start Button - inline on desktop */}
        <button
          onClick={handleClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '10px 16px',
            borderRadius: '10px',
            border: 'none',
            background: `linear-gradient(90deg, ${COLORS.blue[600]} 0%, ${COLORS.teal[500]} 100%)`,
            color: 'white',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(74, 158, 201, 0.3)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-1px)';
            e.target.style.boxShadow = '0 4px 12px rgba(74, 158, 201, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'none';
            e.target.style.boxShadow = '0 2px 8px rgba(74, 158, 201, 0.3)';
          }}
        >
          <Mic style={{ width: '16px', height: '16px' }} />
          Training starten
          <ChevronRight style={{ width: '16px', height: '16px' }} />
        </button>
      </div>

      {/* Description */}
      <p style={{
        fontSize: '14px',
        color: COLORS.slate[600],
        margin: 0,
        lineHeight: 1.5
      }}>
        {scenario.description}
      </p>

      {/* Meta Info */}
      <div style={{
        display: 'flex',
        gap: '16px',
        paddingTop: '12px',
        borderTop: `1px solid ${COLORS.slate[100]}`
      }}>
        <span style={{ fontSize: '13px', color: COLORS.slate[400] }}>
          {scenario.question_count_min}-{scenario.question_count_max} Fragen
        </span>
        <span style={{ fontSize: '13px', color: COLORS.slate[400] }}>
          {Math.round(scenario.time_limit_per_question / 60)} Min/Frage
        </span>
      </div>
    </div>
  );
};

/**
 * Simulator Dashboard Component
 *
 * Displays available training scenarios in a grid layout
 */
const SimulatorDashboard = ({ onSelectScenario }) => {
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadScenarios();
  }, []);

  const loadScenarios = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await wordpressAPI.getSimulatorScenarios();

      if (response.success && response.data?.scenarios) {
        setScenarios(response.data.scenarios);
      } else {
        throw new Error('Keine Szenarien gefunden');
      }
    } catch (err) {
      console.error('Error loading scenarios:', err);
      setError(err.message || 'Fehler beim Laden der Szenarien');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px',
        gap: '16px'
      }}>
        <Loader2
          style={{
            width: '48px',
            height: '48px',
            color: COLORS.blue[500],
            animation: 'spin 1s linear infinite'
          }}
        />
        <p style={{ color: COLORS.slate[600], fontSize: '16px' }}>
          Szenarien werden geladen...
        </p>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px',
        gap: '16px'
      }}>
        <AlertCircle style={{ width: '48px', height: '48px', color: '#ef4444' }} />
        <p style={{ color: '#ef4444', fontSize: '16px', textAlign: 'center' }}>
          {error}
        </p>
        <button
          onClick={loadScenarios}
          style={{
            padding: '12px 24px',
            borderRadius: '12px',
            border: 'none',
            background: COLORS.blue[500],
            color: 'white',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Erneut versuchen
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '12px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: `linear-gradient(135deg, ${COLORS.blue[500]} 0%, ${COLORS.teal[500]} 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Sparkles style={{ width: '24px', height: '24px', color: 'white' }} />
          </div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 700,
            color: COLORS.slate[900],
            margin: 0
          }}>
            Szenario-Training
          </h1>
        </div>
        <p style={{
          fontSize: '16px',
          color: COLORS.slate[600],
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          Trainiere wichtige Karriere-Skills mit sofortigem KI-Feedback nach jeder Antwort.
          Wähle ein Szenario und starte dein Training.
        </p>
      </div>

      {/* Scenario Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '24px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {scenarios.map(scenario => (
          <ScenarioCard
            key={scenario.id}
            scenario={scenario}
            onSelect={onSelectScenario}
          />
        ))}
      </div>

      {/* Empty State */}
      {scenarios.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: COLORS.slate[600]
        }}>
          <Mic style={{ width: '48px', height: '48px', marginBottom: '16px', opacity: 0.5 }} />
          <p>Keine Trainingsszenarien verfügbar.</p>
        </div>
      )}
    </div>
  );
};

export default SimulatorDashboard;
