import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History,
  Calendar,
  Clock,
  Award,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Loader2,
  AlertCircle,
  Play,
  Star,
  TrendingUp,
  RefreshCw,
  LogIn,
  Target,
  Video,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getRoleplaySessions, getRoleplayScenarios } from '@/services/roleplay-feedback-adapter';
import { usePartner } from '@/context/PartnerContext';
import { DEFAULT_BRANDING } from '@/config/partners';
import TrainingSessionDetailView from './TrainingSessionDetailView';

console.log('📦 [SESSION_HISTORY] SessionHistory module loaded');

/**
 * Tab configuration
 */
const TABS = {
  SIMULATOR: 'simulator',
  ROLEPLAY: 'roleplay',
  VIDEO: 'video',
};

const TAB_CONFIG = [
  { id: TABS.SIMULATOR, label: 'Szenario-Training', icon: Target },
  { id: TABS.ROLEPLAY, label: 'Live-Gespräche', icon: MessageSquare },
  { id: TABS.VIDEO, label: 'Video-Training', icon: Video },
];

/**
 * SessionCard - Unified card component for all session types
 */
const SessionCard = ({ session, type, scenario, onClick, headerGradient, headerText }) => {
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScore = () => {
    if (type === TABS.SIMULATOR) {
      return session.overall_score || session.average_score;
    }
    if (type === TABS.VIDEO) {
      return session.overall_score;
    }
    // Roleplay - extract from feedback_json
    if (session.feedback_json) {
      try {
        let parsed = session.feedback_json;
        if (typeof parsed === 'string') {
          let jsonString = parsed.trim();
          if (jsonString.startsWith('```json')) {
            jsonString = jsonString.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
          } else if (jsonString.startsWith('```')) {
            jsonString = jsonString.replace(/```\s*/g, '').replace(/```\s*$/g, '');
          }
          parsed = JSON.parse(jsonString);
        }
        return parsed.rating?.overall || null;
      } catch {
        return null;
      }
    }
    return null;
  };

  const getStatus = () => {
    if (type === TABS.SIMULATOR || type === TABS.VIDEO) {
      return session.status;
    }
    return session.feedback_json ? 'completed' : 'pending';
  };

  const score = getScore();
  const status = getStatus();
  const isCompleted = status === 'completed';

  const getScoreBadgeStyle = (score) => {
    if (!score) return { background: '#f1f5f9', color: '#64748b' };
    const numScore = parseFloat(score);
    if (numScore >= 80) return { background: '#dcfce7', color: '#166534' };
    if (numScore >= 60) return { background: '#fef9c3', color: '#854d0e' };
    return { background: '#fee2e2', color: '#991b1b' };
  };

  const getIcon = () => {
    switch (type) {
      case TABS.SIMULATOR: return Target;
      case TABS.VIDEO: return Video;
      default: return MessageSquare;
    }
  };

  const Icon = getIcon();

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div
        onClick={onClick}
        style={{
          background: '#fff',
          borderRadius: '16px',
          padding: '20px',
          cursor: 'pointer',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.08)';
          e.currentTarget.style.borderColor = '#cbd5e1';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
          e.currentTarget.style.borderColor = '#e2e8f0';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Icon */}
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: headerGradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon style={{ width: '24px', height: '24px', color: headerText }} />
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: 600,
              color: '#0f172a',
              marginBottom: '4px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {scenario?.title || session.scenario_title || `Session #${session.id}`}
            </h3>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap',
              fontSize: '13px',
              color: '#64748b',
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={14} />
                {formatDate(session.created_at)}
              </span>
              {session.duration || session.video_duration_seconds ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={14} />
                  {formatDuration(session.duration || session.video_duration_seconds)}
                </span>
              ) : null}
            </div>
          </div>

          {/* Status & Score */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
            {/* Status indicator */}
            {!isCompleted && (
              <span style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: '20px',
                background: '#fef3c7',
                color: '#92400e',
                fontSize: '12px',
                fontWeight: 500,
              }}>
                <Clock size={12} />
                In Bearbeitung
              </span>
            )}

            {/* Score badge */}
            {score !== null && (
              <span style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: 600,
                ...getScoreBadgeStyle(score),
              }}>
                <Star size={14} />
                {type === TABS.ROLEPLAY ? `${score}/10` : `${Math.round(score)}%`}
              </span>
            )}

            {/* Arrow */}
            <ChevronRight size={20} style={{ color: '#94a3b8' }} />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const SessionHistory = ({ onBack, onSelectSession, isAuthenticated, onLoginClick }) => {
  console.log('🏗️ [SESSION_HISTORY] SessionHistory component initialized');

  // Partner branding
  const { branding } = usePartner();
  const headerGradient = branding?.['--header-gradient'] || DEFAULT_BRANDING['--header-gradient'];
  const headerText = branding?.['--header-text'] || DEFAULT_BRANDING['--header-text'];
  const primaryAccent = branding?.['--primary-accent'] || DEFAULT_BRANDING['--primary-accent'];

  // Active tab
  const [activeTab, setActiveTab] = useState(TABS.SIMULATOR);

  // Selected session for detail view
  const [selectedTrainingSession, setSelectedTrainingSession] = useState(null);
  const [selectedSessionType, setSelectedSessionType] = useState(null);

  // Data states
  const [roleplaySessions, setRoleplaySessions] = useState([]);
  const [simulatorSessions, setSimulatorSessions] = useState([]);
  const [videoSessions, setVideoSessions] = useState([]);
  const [roleplayScenarios, setRoleplayScenarios] = useState([]);
  const [simulatorScenarios, setSimulatorScenarios] = useState([]);
  const [videoScenarios, setVideoScenarios] = useState([]);

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load all data on mount
  useEffect(() => {
    if (isAuthenticated) {
      loadAllData();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const loadAllData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const config = window.bewerbungstrainerConfig || {};

      // Load all sessions in parallel
      const [
        roleplayData,
        simulatorData,
        videoData,
        roleplayScenariosData,
        simulatorScenariosData,
        videoScenariosData,
      ] = await Promise.all([
        // Roleplay sessions
        getRoleplaySessions({ limit: 50 }).catch(() => ({ data: [] })),
        // Simulator sessions
        fetch(`${config.apiUrl}/simulator/sessions?limit=50`, {
          headers: { 'X-WP-Nonce': config.nonce },
        }).then(r => r.json()).catch(() => ({ data: [] })),
        // Video training sessions
        fetch(`${config.apiUrl}/video-training/sessions?limit=50`, {
          headers: { 'X-WP-Nonce': config.nonce },
        }).then(r => r.json()).catch(() => ({ data: [] })),
        // Roleplay scenarios
        getRoleplayScenarios().catch(() => []),
        // Simulator scenarios
        fetch(`${config.apiUrl}/simulator/scenarios`, {
          headers: { 'X-WP-Nonce': config.nonce },
        }).then(r => r.json()).catch(() => ({ data: [] })),
        // Video scenarios
        fetch(`${config.apiUrl}/video-training/scenarios`, {
          headers: { 'X-WP-Nonce': config.nonce },
        }).then(r => r.json()).catch(() => ({ data: [] })),
      ]);

      // Extract sessions from API responses - each API has different structure
      // Simulator & Video: { success: true, data: { sessions: [...] } }
      // Roleplay: { data: [...] }
      const extractSessions = (response, key = 'sessions') => {
        if (Array.isArray(response?.data)) return response.data;
        if (Array.isArray(response?.data?.[key])) return response.data[key];
        if (Array.isArray(response?.[key])) return response[key];
        if (Array.isArray(response)) return response;
        return [];
      };

      const extractScenarios = (response) => {
        if (Array.isArray(response?.data?.scenarios)) return response.data.scenarios;
        if (Array.isArray(response?.data)) return response.data;
        if (Array.isArray(response)) return response;
        return [];
      };

      setRoleplaySessions(extractSessions(roleplayData));
      setSimulatorSessions(extractSessions(simulatorData));
      setVideoSessions(extractSessions(videoData));
      setRoleplayScenarios(extractScenarios(roleplayScenariosData));
      setSimulatorScenarios(extractScenarios(simulatorScenariosData));
      setVideoScenarios(extractScenarios(videoScenariosData));
    } catch (err) {
      console.error('Failed to load sessions:', err);
      setError(err.message || 'Fehler beim Laden der Daten');
    } finally {
      setIsLoading(false);
    }
  };

  // Create scenario lookup maps
  const roleplayScenarioMap = useMemo(() => {
    const map = {};
    roleplayScenarios.forEach((s) => { map[s.id] = s; });
    return map;
  }, [roleplayScenarios]);

  const simulatorScenarioMap = useMemo(() => {
    const map = {};
    simulatorScenarios.forEach((s) => { map[s.id] = s; });
    return map;
  }, [simulatorScenarios]);

  const videoScenarioMap = useMemo(() => {
    const map = {};
    videoScenarios.forEach((s) => { map[s.id] = s; });
    return map;
  }, [videoScenarios]);

  // Get sessions for active tab
  const getActiveSessions = () => {
    switch (activeTab) {
      case TABS.SIMULATOR: return simulatorSessions;
      case TABS.VIDEO: return videoSessions;
      default: return roleplaySessions;
    }
  };

  const getActiveScenarioMap = () => {
    switch (activeTab) {
      case TABS.SIMULATOR: return simulatorScenarioMap;
      case TABS.VIDEO: return videoScenarioMap;
      default: return roleplayScenarioMap;
    }
  };

  // Total sessions count
  const totalSessions = roleplaySessions.length + simulatorSessions.length + videoSessions.length;

  // Handle session click
  const handleSessionClick = (session) => {
    if (activeTab === TABS.ROLEPLAY) {
      onSelectSession(session);
    } else {
      // For simulator and video, show the training detail view
      console.log('Session clicked:', activeTab, session);
      setSelectedTrainingSession(session);
      setSelectedSessionType(activeTab);
    }
  };

  // Handle back from detail view
  const handleBackFromDetail = () => {
    setSelectedTrainingSession(null);
    setSelectedSessionType(null);
  };

  // Get scenario for selected session
  const getScenarioForSession = (session, type) => {
    const scenarioMap = type === TABS.SIMULATOR ? simulatorScenarioMap :
                        type === TABS.VIDEO ? videoScenarioMap :
                        roleplayScenarioMap;
    return scenarioMap[session?.scenario_id];
  };

  // Show detail view for selected training session
  if (selectedTrainingSession) {
    return (
      <TrainingSessionDetailView
        session={selectedTrainingSession}
        type={selectedSessionType}
        scenario={getScenarioForSession(selectedTrainingSession, selectedSessionType)}
        onBack={handleBackFromDetail}
      />
    );
  }

  // Show login required screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div style={{ padding: '24px' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '12px',
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: headerGradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <History style={{ width: '24px', height: '24px', color: headerText }} />
            </div>
            <h1 style={{
              fontSize: '28px',
              fontWeight: 700,
              color: '#0f172a',
              margin: 0,
            }}>
              Meine Sessions
            </h1>
          </div>
          <p style={{
            fontSize: '16px',
            color: '#475569',
            maxWidth: '600px',
            margin: '0 auto',
          }}>
            Hier findest du deine gespeicherten Übungen und Fortschritte
          </p>
        </div>

        {/* Login required message */}
        <div style={{
          maxWidth: '500px',
          margin: '60px auto',
          textAlign: 'center',
          padding: '40px',
          backgroundColor: 'white',
          borderRadius: '20px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: headerGradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <LogIn style={{ width: '32px', height: '32px', color: headerText }} />
          </div>
          <h2 style={{
            fontSize: '22px',
            fontWeight: 700,
            color: '#0f172a',
            marginBottom: '12px',
          }}>
            Anmeldung erforderlich
          </h2>
          <p style={{
            fontSize: '15px',
            color: '#64748b',
            marginBottom: '24px',
            lineHeight: 1.6,
          }}>
            Um deine gespeicherten Sessions zu sehen, musst du dich zuerst anmelden.
          </p>
          <button
            onClick={onLoginClick}
            style={{
              padding: '14px 32px',
              borderRadius: '12px',
              border: 'none',
              background: headerGradient,
              color: headerText,
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: `0 4px 12px ${primaryAccent}44`,
            }}
          >
            <LogIn style={{ width: '20px', height: '20px' }} />
            Jetzt anmelden
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 style={{ width: '48px', height: '48px', color: primaryAccent, animation: 'spin 1s linear infinite' }} />
          <p style={{ color: '#64748b', marginTop: '16px' }}>Sessions werden geladen...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px', padding: '24px' }}>
          <AlertCircle style={{ width: '48px', height: '48px', color: '#ef4444', margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Fehler beim Laden</h2>
          <p style={{ color: '#64748b', marginBottom: '24px' }}>{error}</p>
          <Button onClick={loadAllData}>Erneut versuchen</Button>
        </div>
      </div>
    );
  }

  const activeSessions = getActiveSessions();
  const activeScenarioMap = getActiveScenarioMap();

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '12px',
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: headerGradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <History style={{ width: '24px', height: '24px', color: headerText }} />
          </div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 700,
            color: '#0f172a',
            margin: 0,
          }}>
            Meine Sessions
          </h1>
        </div>
        <p style={{
          fontSize: '16px',
          color: '#475569',
          maxWidth: '600px',
          margin: '0 auto',
        }}>
          {totalSessions} {totalSessions === 1 ? 'Übung' : 'Übungen'} gespeichert
        </p>
      </div>

      {/* Tabs - Responsive: stack vertically on mobile */}
      <style>{`
        .session-tabs {
          max-width: 800px;
          margin: 0 auto 32px;
          display: flex;
          gap: 8px;
          background: #f1f5f9;
          padding: 6px;
          border-radius: 14px;
        }
        .session-tab-btn {
          flex: 1;
          padding: 12px 16px;
          border-radius: 10px;
          border: none;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
        }
        @media (max-width: 640px) {
          .session-tabs {
            flex-direction: column;
          }
          .session-tab-btn {
            padding: 14px 16px;
          }
        }
      `}</style>
      <div className="session-tabs">
        {TAB_CONFIG.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const count = tab.id === TABS.SIMULATOR ? simulatorSessions.length :
                       tab.id === TABS.VIDEO ? videoSessions.length :
                       roleplaySessions.length;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="session-tab-btn"
              style={{
                background: isActive ? '#fff' : 'transparent',
                color: isActive ? '#0f172a' : '#64748b',
                fontWeight: isActive ? 600 : 500,
                boxShadow: isActive ? '0 2px 8px rgba(0, 0, 0, 0.08)' : 'none',
              }}
            >
              <Icon size={18} />
              <span>{tab.label}</span>
              <span style={{
                padding: '2px 8px',
                borderRadius: '10px',
                background: isActive ? primaryAccent : '#e2e8f0',
                color: isActive ? '#fff' : '#64748b',
                fontSize: '12px',
                fontWeight: 600,
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Refresh button */}
      <div style={{ maxWidth: '800px', margin: '0 auto 24px', display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="outline" onClick={loadAllData} disabled={isLoading}>
          <RefreshCw style={{ width: '16px', height: '16px', marginRight: '8px' }} className={isLoading ? 'animate-spin' : ''} />
          Aktualisieren
        </Button>
      </div>

      {/* Sessions List */}
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {activeSessions.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 24px',
            background: '#fff',
            borderRadius: '20px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          }}>
            {activeTab === TABS.SIMULATOR && <Target style={{ width: '48px', height: '48px', color: '#94a3b8', margin: '0 auto 16px' }} />}
            {activeTab === TABS.ROLEPLAY && <MessageSquare style={{ width: '48px', height: '48px', color: '#94a3b8', margin: '0 auto 16px' }} />}
            {activeTab === TABS.VIDEO && <Video style={{ width: '48px', height: '48px', color: '#94a3b8', margin: '0 auto 16px' }} />}
            <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
              Noch keine {activeTab === TABS.SIMULATOR ? 'Szenario-Trainings' : activeTab === TABS.VIDEO ? 'Video-Trainings' : 'Live-Gespräche'}
            </h3>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>
              Starte dein erstes Training, um hier deine Fortschritte zu sehen.
            </p>
            <Button onClick={onBack}>
              <Play style={{ width: '16px', height: '16px', marginRight: '8px' }} />
              Training starten
            </Button>
          </div>
        ) : (
          <motion.div
            style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.05 },
              },
            }}
          >
            {activeSessions.map((session) => {
              const scenario = activeScenarioMap[session.scenario_id];
              return (
                <SessionCard
                  key={session.id}
                  session={session}
                  type={activeTab}
                  scenario={scenario}
                  onClick={() => handleSessionClick(session)}
                  headerGradient={headerGradient}
                  headerText={headerText}
                />
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SessionHistory;
