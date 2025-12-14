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
  FileText,
  Briefcase,
  Banknote,
  Users,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getRoleplaySessions, getRoleplayScenarios } from '@/services/roleplay-feedback-adapter';
import { usePartner } from '@/context/PartnerContext';
import { DEFAULT_BRANDING } from '@/config/partners';
import TrainingSessionDetailView from './TrainingSessionDetailView';
import { getWPNonce, getWPApiUrl } from '@/services/wordpress-api';
import wordpressAPI from '@/services/wordpress-api';
import BriefingWorkbook from './smartbriefing/BriefingWorkbook';

console.log('📦 [SESSION_HISTORY] SessionHistory module loaded');

/**
 * Tab configuration
 */
const TABS = {
  SIMULATOR: 'simulator',
  ROLEPLAY: 'roleplay',
  VIDEO: 'video',
  BRIEFINGS: 'briefings',
};

const TAB_CONFIG = [
  { id: TABS.SIMULATOR, label: 'Szenario-Training', icon: Target },
  { id: TABS.BRIEFINGS, label: 'Smart Briefings', icon: Sparkles },
  { id: TABS.ROLEPLAY, label: 'Live-Simulationen', icon: MessageSquare },
  { id: TABS.VIDEO, label: 'Wirkungs-Analyse', icon: Video },
];

/**
 * Icon mapping for briefing template icons
 */
const BRIEFING_ICON_MAP = {
  'file-text': FileText,
  'briefcase': Briefcase,
  'banknote': Banknote,
  'users': Users,
};

/**
 * BriefingCard - Card component for Smart Briefings
 */
const BriefingCard = ({ briefing, onClick, onDelete, headerGradient, headerText, primaryAccent }) => {
  const [isDeleting, setIsDeleting] = useState(false);

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

  const Icon = BRIEFING_ICON_MAP[briefing.template_icon] || FileText;

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm('Briefing wirklich löschen?')) return;

    setIsDeleting(true);
    try {
      await onDelete(briefing.id);
    } catch (err) {
      console.error('Error deleting briefing:', err);
    } finally {
      setIsDeleting(false);
    }
  };

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
              background: `linear-gradient(135deg, ${primaryAccent}15, ${primaryAccent}30)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon style={{ width: '24px', height: '24px', color: primaryAccent }} />
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
              {briefing.title || 'Briefing'}
            </h3>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap',
              fontSize: '13px',
              color: '#64748b',
            }}>
              <span style={{
                backgroundColor: `${primaryAccent}15`,
                color: primaryAccent,
                padding: '2px 8px',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: 500,
              }}>
                {briefing.template_title}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={14} />
                {formatDate(briefing.created_at)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              style={{
                padding: '8px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: 'transparent',
                color: '#94a3b8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Löschen"
            >
              {isDeleting ? (
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Trash2 size={18} />
              )}
            </button>
            <ChevronRight size={20} style={{ color: '#94a3b8' }} />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/**
 * SessionCard - Unified card component for all session types
 */
const SessionCard = ({ session, type, scenario, onClick, onContinueSession, headerGradient, headerText, primaryAccent }) => {
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
    let rawScore = null;
    if (type === TABS.SIMULATOR) {
      rawScore = session.overall_score || session.average_score;
    } else if (type === TABS.VIDEO) {
      rawScore = session.overall_score;
    } else {
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
          rawScore = parsed.rating?.overall || null;
        } catch {
          rawScore = null;
        }
      }
    }
    // Return null if score is invalid (null, undefined, NaN, 0)
    if (rawScore === null || rawScore === undefined || isNaN(rawScore) || rawScore === 0) {
      return null;
    }
    return rawScore;
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

  // Check if session is resumable (Simulator only, has unanswered questions)
  const isResumable = type === TABS.SIMULATOR &&
    !isCompleted &&
    session.total_questions > 0 &&
    (session.completed_questions || 0) < session.total_questions;

  // Progress info for resumable sessions
  const getProgressInfo = () => {
    if (!isResumable) return null;
    const completed = session.completed_questions || 0;
    const total = session.total_questions || 0;
    return `${completed}/${total} Fragen`;
  };

  // Handle continue click
  const handleContinueClick = (e) => {
    e.stopPropagation();
    if (onContinueSession) {
      onContinueSession(session, scenario);
    }
  };

  // Convert score to percentage (0-100) for consistent display
  const getScoreAsPercent = () => {
    if (score === null || score === undefined || isNaN(score)) return null;
    // Simulator and Roleplay scores are 0-10, convert to percentage
    if (type === TABS.SIMULATOR || type === TABS.ROLEPLAY) {
      const percent = score <= 10 ? score * 10 : score;
      return isNaN(percent) ? null : percent;
    }
    // Video scores are already 0-100
    return isNaN(score) ? null : score;
  };

  const scorePercent = getScoreAsPercent();

  const getScoreBadgeStyle = (scoreVal) => {
    if (!scoreVal && scoreVal !== 0) return { background: '#f1f5f9', color: '#64748b' };
    const numScore = parseFloat(scoreVal);
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
            {/* Resume button for incomplete sessions */}
            {isResumable && onContinueSession && (
              <button
                onClick={handleContinueClick}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  background: primaryAccent || '#3B82F6',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: `0 2px 8px ${primaryAccent || '#3B82F6'}40`,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.boxShadow = `0 4px 12px ${primaryAccent || '#3B82F6'}50`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = `0 2px 8px ${primaryAccent || '#3B82F6'}40`;
                }}
              >
                <Play size={14} />
                Fortsetzen
              </button>
            )}

            {/* Progress indicator for resumable sessions */}
            {isResumable && (
              <span style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: '20px',
                background: '#dbeafe',
                color: '#1e40af',
                fontSize: '12px',
                fontWeight: 500,
              }}>
                {getProgressInfo()}
              </span>
            )}

            {/* Status indicator (only for non-resumable incomplete sessions) */}
            {!isCompleted && !isResumable && (
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
            {scorePercent !== null && (
              <span style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: 600,
                ...getScoreBadgeStyle(scorePercent),
              }}>
                <Star size={14} />
                {Math.round(scorePercent)}%
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

const SessionHistory = ({ onBack, onSelectSession, isAuthenticated, onLoginClick, onContinueSession, onRepeatSession }) => {
  console.log('🏗️ [SESSION_HISTORY] SessionHistory component initialized');

  // Partner branding
  const { branding, demoCode, isDemoUser } = usePartner();
  const headerGradient = branding?.['--header-gradient'] || DEFAULT_BRANDING['--header-gradient'];
  const headerText = branding?.['--header-text'] || DEFAULT_BRANDING['--header-text'];
  const primaryAccent = branding?.['--primary-accent'] || DEFAULT_BRANDING['--primary-accent'];

  // Active tab
  const [activeTab, setActiveTab] = useState(TABS.SIMULATOR);

  // Selected session for detail view
  const [selectedTrainingSession, setSelectedTrainingSession] = useState(null);
  const [selectedSessionType, setSelectedSessionType] = useState(null);

  // Scroll to top when tab changes or detail view changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab, selectedTrainingSession]);

  // Data states
  const [roleplaySessions, setRoleplaySessions] = useState([]);
  const [simulatorSessions, setSimulatorSessions] = useState([]);
  const [videoSessions, setVideoSessions] = useState([]);
  const [briefings, setBriefings] = useState([]);
  const [roleplayScenarios, setRoleplayScenarios] = useState([]);
  const [simulatorScenarios, setSimulatorScenarios] = useState([]);
  const [videoScenarios, setVideoScenarios] = useState([]);

  // Selected briefing for workbook view
  const [selectedBriefing, setSelectedBriefing] = useState(null);

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
      // Get fresh nonce and API URL for each request
      const apiUrl = getWPApiUrl();

      // Build query params with demo_code if applicable
      const demoQueryParam = demoCode ? `&demo_code=${encodeURIComponent(demoCode)}` : '';

      // Load all sessions in parallel
      const [
        roleplayData,
        simulatorData,
        videoData,
        briefingsData,
        roleplayScenariosData,
        simulatorScenariosData,
        videoScenariosData,
      ] = await Promise.all([
        // Roleplay sessions (only pass demo_code if it exists)
        getRoleplaySessions({ limit: 50, ...(demoCode && { demo_code: demoCode }) }).catch(() => ({ data: [] })),
        // Simulator sessions (pass demo_code)
        fetch(`${apiUrl}/simulator/sessions?limit=50${demoQueryParam}`, {
          headers: { 'X-WP-Nonce': getWPNonce() },
        }).then(r => r.json()).catch(() => ({ data: [] })),
        // Video training sessions (pass demo_code)
        fetch(`${apiUrl}/video-training/sessions?limit=50${demoQueryParam}`, {
          headers: { 'X-WP-Nonce': getWPNonce() },
        }).then(r => r.json()).catch(() => ({ data: [] })),
        // Smart Briefings (pass demo_code)
        wordpressAPI.request(`/smartbriefing/briefings?limit=50${demoCode ? `&demo_code=${encodeURIComponent(demoCode)}` : ''}`, {
          method: 'GET',
        }).catch(() => ({ success: false, data: { briefings: [] } })),
        // Roleplay scenarios
        getRoleplayScenarios().catch(() => []),
        // Simulator scenarios
        fetch(`${apiUrl}/simulator/scenarios`, {
          headers: { 'X-WP-Nonce': getWPNonce() },
        }).then(r => r.json()).catch(() => ({ data: [] })),
        // Video scenarios
        fetch(`${apiUrl}/video-training/scenarios`, {
          headers: { 'X-WP-Nonce': getWPNonce() },
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
      setBriefings(briefingsData?.data?.briefings || []);
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
      case TABS.BRIEFINGS: return briefings;
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
  const totalSessions = roleplaySessions.length + simulatorSessions.length + videoSessions.length + briefings.length;

  // Delete briefing handler
  const handleDeleteBriefing = async (briefingId) => {
    const response = await wordpressAPI.request(`/smartbriefing/briefings/${briefingId}`, {
      method: 'DELETE',
    });

    if (response.success) {
      setBriefings((prev) => prev.filter((b) => b.id !== briefingId));
    }
  };

  // Handle briefing click - open workbook
  const handleBriefingClick = (briefing) => {
    setSelectedBriefing(briefing);
  };

  // Handle back from briefing workbook
  const handleBackFromBriefing = () => {
    setSelectedBriefing(null);
  };

  // Handle session click
  const handleSessionClick = (session) => {
    // Use unified TrainingSessionDetailView for all session types
    console.log('Session clicked:', activeTab, session);
    setSelectedTrainingSession(session);
    setSelectedSessionType(activeTab);
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

  // Show briefing workbook if a briefing is selected
  if (selectedBriefing) {
    return (
      <BriefingWorkbook
        briefing={selectedBriefing}
        onBack={handleBackFromBriefing}
      />
    );
  }

  // Show detail view for selected training session
  if (selectedTrainingSession) {
    return (
      <TrainingSessionDetailView
        session={selectedTrainingSession}
        type={selectedSessionType}
        scenario={getScenarioForSession(selectedTrainingSession, selectedSessionType)}
        onBack={handleBackFromDetail}
        onContinueSession={onContinueSession}
        onRepeatSession={onRepeatSession}
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
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 style={{ width: '48px', height: '48px', color: primaryAccent, animation: 'spin 1s linear infinite', margin: '0 auto' }} />
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
          margin: 0 24px 32px;
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
                       tab.id === TABS.BRIEFINGS ? briefings.length :
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
      <div style={{ margin: '0 24px 24px', display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="outline" onClick={loadAllData} disabled={isLoading}>
          <RefreshCw style={{ width: '16px', height: '16px', marginRight: '8px' }} className={isLoading ? 'animate-spin' : ''} />
          Aktualisieren
        </Button>
      </div>

      {/* Sessions List */}
      <div style={{ margin: '0 24px' }}>
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
            {activeTab === TABS.BRIEFINGS && <Sparkles style={{ width: '48px', height: '48px', color: '#94a3b8', margin: '0 auto 16px' }} />}
            <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
              Noch keine {activeTab === TABS.SIMULATOR ? 'Szenario-Trainings' : activeTab === TABS.VIDEO ? 'Wirkungs-Analysen' : activeTab === TABS.BRIEFINGS ? 'Smart Briefings' : 'Live-Simulationen'}
            </h3>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>
              {activeTab === TABS.BRIEFINGS
                ? 'Erstelle dein erstes Briefing, um dich optimal vorzubereiten.'
                : 'Starte dein erstes Training, um hier deine Fortschritte zu sehen.'}
            </p>
            <Button onClick={onBack}>
              <Play style={{ width: '16px', height: '16px', marginRight: '8px' }} />
              {activeTab === TABS.BRIEFINGS ? 'Briefing erstellen' : 'Training starten'}
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
            {activeTab === TABS.BRIEFINGS ? (
              // Render briefings
              briefings.map((briefing) => (
                <BriefingCard
                  key={briefing.id}
                  briefing={briefing}
                  onClick={() => handleBriefingClick(briefing)}
                  onDelete={handleDeleteBriefing}
                  headerGradient={headerGradient}
                  headerText={headerText}
                  primaryAccent={primaryAccent}
                />
              ))
            ) : (
              // Render regular sessions
              activeSessions.map((session) => {
                const scenario = activeScenarioMap[session.scenario_id];
                return (
                  <SessionCard
                    key={session.id}
                    session={session}
                    type={activeTab}
                    scenario={scenario}
                    onClick={() => handleSessionClick(session)}
                    onContinueSession={onContinueSession}
                    headerGradient={headerGradient}
                    headerText={headerText}
                    primaryAccent={primaryAccent}
                  />
                );
              })
            )}
          </motion.div>
        )}
      </div>

      <style>
        {`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}
      </style>
    </div>
  );
};

export default SessionHistory;
