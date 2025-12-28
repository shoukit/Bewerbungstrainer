import React, { useState, useEffect, useMemo } from 'react';
import { useMobile } from '@/hooks/useMobile';
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
  Sparkles,
  Trash2,
  Plus,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { getRoleplaySessions, getRoleplayScenarios } from '@/services/roleplay-feedback-adapter';
import { usePartner } from '@/context/PartnerContext';
import { DEFAULT_BRANDING } from '@/config/partners';
import { useBranding } from '@/hooks/useBranding';
import TrainingSessionDetailView from './TrainingSessionDetailView';
import RoleplaySessionReport from './roleplay/RoleplaySessionReport';
import { getWPNonce, getWPApiUrl } from '@/services/wordpress-api';
import wordpressAPI from '@/services/wordpress-api';
import BriefingWorkbook from './smartbriefing/BriefingWorkbook';
import DecisionBoardInput from './decision-board/DecisionBoardInput';
import DecisionBoardResult from './decision-board/DecisionBoardResult';
import { formatDateTime, formatDuration } from '@/utils/formatting';
import { BRIEFING_ICON_MAP, getBriefingIcon } from '@/utils/iconMaps';
import ConfirmDeleteDialog from '@/components/ui/ConfirmDeleteDialog';
import { BriefingCard, SessionCard, DecisionCard, IkigaiCard } from '@/components/session-history';
import IkigaiCompass from '@/components/ikigai/IkigaiCompass';
import IkigaiResults from '@/components/ikigai/IkigaiResults';
import { Scale, Compass } from 'lucide-react';

/**
 * Dimension configuration for Ikigai
 */
const IKIGAI_DIMENSIONS = {
  love: {
    key: 'love',
    label: 'Liebe',
    icon: '❤️',
    color: '#E11D48',
    question: 'Vergiss mal Geld und Karriere. Bei welchen Tätigkeiten vergisst du die Zeit?',
    placeholder: 'Erzähle mir, was du wirklich liebst zu tun...',
    description: 'Was du liebst',
  },
  talent: {
    key: 'talent',
    label: 'Talent',
    icon: '⭐',
    color: '#F59E0B',
    question: 'Worin bist du richtig gut? Was fällt dir leicht, während andere damit kämpfen?',
    placeholder: 'Beschreibe deine Stärken und Fähigkeiten...',
    description: 'Worin du gut bist',
  },
  need: {
    key: 'need',
    label: 'Welt',
    icon: '🌍',
    color: '#10B981',
    question: 'Welche Probleme der Welt würdest du gerne lösen? Wo siehst du Bedarf?',
    placeholder: 'Welchen Beitrag möchtest du leisten...',
    description: 'Was die Welt braucht',
  },
  market: {
    key: 'market',
    label: 'Markt',
    icon: '💰',
    color: '#6366F1',
    question: 'Wofür werden Menschen in deinem Bereich bezahlt? Was ist gefragt?',
    placeholder: 'Welche Berufe oder Märkte interessieren dich...',
    description: 'Wofür du bezahlt wirst',
  },
};


/**
 * Tab configuration
 */
const TABS = {
  SIMULATOR: 'simulator',
  ROLEPLAY: 'roleplay',
  VIDEO: 'video',
  BRIEFINGS: 'briefings',
  DECISIONS: 'decisions',
  IKIGAI: 'ikigai',
};

const TAB_CONFIG = [
  { id: TABS.BRIEFINGS, label: 'Smart Briefings', icon: Sparkles },
  { id: TABS.DECISIONS, label: 'Entscheidungs-Kompass', icon: Scale },
  { id: TABS.IKIGAI, label: 'Ikigai-Kompass', icon: Compass },
  { id: TABS.SIMULATOR, label: 'Szenario-Training', icon: Target },
  { id: TABS.VIDEO, label: 'Wirkungs-Analyse', icon: Video },
  { id: TABS.ROLEPLAY, label: 'Live-Simulationen', icon: MessageSquare },
];

// Export TABS for use in extracted components
export const SESSION_TABS = TABS;

const SessionHistory = ({ onBack, onSelectSession, isAuthenticated, onLoginClick, onContinueSession, onRepeatSession, initialTab, onNavigateToModule }) => {
  // Partner branding
  const { branding, demoCode, isDemoUser } = usePartner();
  const b = useBranding();
  const headerGradient = branding?.['--header-gradient'] || DEFAULT_BRANDING['--header-gradient'];
  const headerText = branding?.['--header-text'] || DEFAULT_BRANDING['--header-text'];
  const primaryAccent = branding?.['--primary-accent'] || DEFAULT_BRANDING['--primary-accent'];

  // Active tab - use initialTab prop if provided, otherwise default to Smart Briefings
  const [activeTab, setActiveTab] = useState(initialTab || TABS.BRIEFINGS);

  // Update active tab when initialTab prop changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

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
  const [decisions, setDecisions] = useState([]);
  const [ikigais, setIkigais] = useState([]);
  const [roleplayScenarios, setRoleplayScenarios] = useState([]);
  const [simulatorScenarios, setSimulatorScenarios] = useState([]);
  const [videoScenarios, setVideoScenarios] = useState([]);

  // Selected briefing for workbook view
  const [selectedBriefing, setSelectedBriefing] = useState(null);

  // Selected decision for detail view
  const [selectedDecision, setSelectedDecision] = useState(null);
  const [decisionAnalysisResult, setDecisionAnalysisResult] = useState(null);

  // Selected ikigai for edit view
  const [selectedIkigai, setSelectedIkigai] = useState(null);
  const [ikigaiDimensions, setIkigaiDimensions] = useState({
    love: { input: '', tags: [] },
    talent: { input: '', tags: [] },
    need: { input: '', tags: [] },
    market: { input: '', tags: [] },
  });
  const [ikigaiSynthesisResult, setIkigaiSynthesisResult] = useState(null);
  const [isIkigaiSynthesizing, setIsIkigaiSynthesizing] = useState(false);

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
        decisionsData,
        ikigaisData,
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
        // Decision Board entries (pass demo_code)
        wordpressAPI.getDecisions().catch(() => ({ success: false, data: { decisions: [] } })),
        // Ikigai Career Pathfinder entries
        wordpressAPI.getIkigais().catch(() => ({ success: false, data: { ikigais: [] } })),
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
      setDecisions(decisionsData?.data?.decisions || []);
      setIkigais(ikigaisData?.data?.ikigais || []);
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
      case TABS.DECISIONS: return decisions;
      case TABS.IKIGAI: return ikigais;
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
  const totalSessions = roleplaySessions.length + simulatorSessions.length + videoSessions.length + briefings.length + decisions.length;

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

  // Delete decision handler
  const handleDeleteDecision = async (decisionId) => {
    const response = await wordpressAPI.deleteDecision(decisionId);

    if (response.success) {
      setDecisions((prev) => prev.filter((d) => d.id !== decisionId));
    }
  };

  // Handle delete ikigai
  const handleDeleteIkigai = async (ikigaiId) => {
    const result = await wordpressAPI.deleteIkigai(ikigaiId);

    if (result) {
      setIkigais((prev) => prev.filter((i) => i.id !== ikigaiId));
    }
  };

  // Handle decision click - open detail view
  const handleDecisionClick = (decision) => {
    setSelectedDecision(decision);
  };

  // Handle back from decision detail
  const handleBackFromDecision = () => {
    setSelectedDecision(null);
    setDecisionAnalysisResult(null);
  };

  // Handle ikigai click - open edit view with existing data
  const handleIkigaiClick = (ikigai) => {
    setSelectedIkigai(ikigai);
    // Transform ikigai data to dimensions format
    setIkigaiDimensions({
      love: { input: ikigai.love_input || '', tags: ikigai.love_tags || [] },
      talent: { input: ikigai.talent_input || '', tags: ikigai.talent_tags || [] },
      need: { input: ikigai.need_input || '', tags: ikigai.need_tags || [] },
      market: { input: ikigai.market_input || '', tags: ikigai.market_tags || [] },
    });
    // Set synthesis result if completed
    if (ikigai.status === 'completed' && ikigai.paths) {
      setIkigaiSynthesisResult({
        summary: ikigai.summary,
        paths: ikigai.paths,
      });
    } else {
      setIkigaiSynthesisResult(null);
    }
  };

  // Handle back from ikigai edit
  const handleBackFromIkigai = () => {
    setSelectedIkigai(null);
    setIkigaiDimensions({
      love: { input: '', tags: [] },
      talent: { input: '', tags: [] },
      need: { input: '', tags: [] },
      market: { input: '', tags: [] },
    });
    setIkigaiSynthesisResult(null);
  };

  // Handle ikigai dimension update
  const handleIkigaiUpdateDimension = async (dimensionKey, input, tags) => {
    setIkigaiDimensions((prev) => ({
      ...prev,
      [dimensionKey]: { input, tags },
    }));

    // Save to backend
    if (selectedIkigai?.id) {
      try {
        await wordpressAPI.updateIkigai(selectedIkigai.id, {
          [`${dimensionKey}_input`]: input,
          [`${dimensionKey}_tags`]: tags,
        });
      } catch (err) {
        console.error('[Ikigai] Failed to save dimension:', err);
      }
    }
  };

  // Handle ikigai keyword extraction
  const handleIkigaiExtractKeywords = async (dimensionKey, userInput) => {
    try {
      const response = await wordpressAPI.extractIkigaiKeywords(dimensionKey, userInput);
      return response?.keywords || [];
    } catch (err) {
      console.error('[Ikigai] Failed to extract keywords:', err);
      return [];
    }
  };

  // Handle ikigai remove tag
  const handleIkigaiRemoveTag = (dimensionKey, tagToRemove) => {
    setIkigaiDimensions((prev) => {
      const newTags = prev[dimensionKey].tags.filter((tag) => tag !== tagToRemove);
      return {
        ...prev,
        [dimensionKey]: { ...prev[dimensionKey], tags: newTags },
      };
    });
  };

  // Handle ikigai synthesis
  const handleIkigaiSynthesize = async () => {
    const allFilled = Object.values(ikigaiDimensions).every(
      (dim) => dim.tags && dim.tags.length > 0
    );
    if (!allFilled) return;

    setIsIkigaiSynthesizing(true);

    try {
      const response = await wordpressAPI.synthesizeIkigaiPaths({
        love_tags: ikigaiDimensions.love.tags,
        talent_tags: ikigaiDimensions.talent.tags,
        need_tags: ikigaiDimensions.need.tags,
        market_tags: ikigaiDimensions.market.tags,
      });

      if (response) {
        setIkigaiSynthesisResult(response);

        // Save synthesis to backend
        if (selectedIkigai?.id) {
          await wordpressAPI.updateIkigai(selectedIkigai.id, {
            summary: response.summary,
            paths: response.paths,
            status: 'completed',
          });

          // Update local ikigais state
          setIkigais((prev) =>
            prev.map((i) =>
              i.id === selectedIkigai.id
                ? { ...i, summary: response.summary, paths: response.paths, status: 'completed' }
                : i
            )
          );
        }
      }
    } catch (err) {
      console.error('[Ikigai] Failed to synthesize paths:', err);
    } finally {
      setIsIkigaiSynthesizing(false);
    }
  };

  // Check if all ikigai dimensions are filled
  const allIkigaiDimensionsFilled = Object.values(ikigaiDimensions).every(
    (dim) => dim.tags && dim.tags.length > 0
  );

  // Handle decision update (from edit view)
  const handleDecisionUpdate = (updatedDecision) => {
    setDecisions((prev) =>
      prev.map((d) => (d.id === updatedDecision.id ? updatedDecision : d))
    );
    setSelectedDecision(updatedDecision);
  };

  // Handle session click
  const handleSessionClick = (session) => {
    // Use unified TrainingSessionDetailView for all session types
    setSelectedTrainingSession(session);
    setSelectedSessionType(activeTab);
  };

  // Handle back from detail view
  const handleBackFromDetail = () => {
    setSelectedTrainingSession(null);
    setSelectedSessionType(null);
  };

  // Handle delete session
  const handleDeleteSession = async (session, type) => {
    const apiUrl = getWPApiUrl();

    try {
      let endpoint;
      let updateState;

      switch (type) {
        case TABS.SIMULATOR:
          endpoint = `${apiUrl}/simulator/sessions/${session.id}`;
          updateState = () => setSimulatorSessions((prev) => prev.filter((s) => s.id !== session.id));
          break;
        case TABS.ROLEPLAY:
          endpoint = `${apiUrl}/sessions/${session.id}`;
          updateState = () => setRoleplaySessions((prev) => prev.filter((s) => s.id !== session.id));
          break;
        case TABS.VIDEO:
          endpoint = `${apiUrl}/video-training/sessions/${session.id}`;
          updateState = () => setVideoSessions((prev) => prev.filter((s) => s.id !== session.id));
          break;
        default:
          throw new Error('Unknown session type');
      }

      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'X-WP-Nonce': getWPNonce() },
      });
      const data = await response.json();

      if (data.success) {
        // Remove from local state
        updateState();
        // Navigate back to list if in detail view
        if (selectedTrainingSession) {
          handleBackFromDetail();
        }
      } else {
        throw new Error(data.message || 'Delete failed');
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
      throw err;
    }
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
        onDelete={handleDeleteBriefing}
      />
    );
  }

  // Show decision edit view if a decision is selected
  if (selectedDecision) {
    // Transform decision data to format expected by DecisionBoardInput
    const initialDecisionData = {
      topic: selectedDecision.topic || '',
      context: selectedDecision.context || '',
      pros: selectedDecision.pros || [],
      cons: selectedDecision.cons || [],
      proScore: selectedDecision.pro_score || 0,
      contraScore: selectedDecision.contra_score || 0,
    };

    // Handler for when analysis completes - update the decision and show results
    const handleDecisionAnalysisComplete = async (data, result) => {
      try {
        const updateData = {
          topic: data.topic,
          context: data.context || null,
          pros: data.pros,
          cons: data.cons,
          pro_score: data.proScore,
          contra_score: data.contraScore,
          analysis: result,
          status: 'completed',
        };

        await wordpressAPI.updateDecision(selectedDecision.id, updateData);

        // Update local state
        const updatedDecision = {
          ...selectedDecision,
          ...updateData,
        };
        handleDecisionUpdate(updatedDecision);

        // Show the result view
        setDecisionAnalysisResult({ data, result });
      } catch (err) {
        console.error('[SessionHistory] Failed to update decision:', err);
      }
    };

    // Handler for auto-save during editing
    const handleDecisionDraftSave = async (data) => {
      // This is an existing decision, so we don't need to create a new one
      return selectedDecision.id;
    };

    // Handler for updating during editing
    const handleDecisionSessionUpdate = async (id, data) => {
      try {
        await wordpressAPI.updateDecision(id, {
          topic: data.topic,
          context: data.context || null,
          pros: data.pros,
          cons: data.cons,
          pro_score: data.proScore,
          contra_score: data.contraScore,
          status: data.status || 'draft',
        });
      } catch (err) {
        console.error('[SessionHistory] Failed to update decision:', err);
      }
    };

    return (
      <div>
        {/* Header with back button */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: b.space[4],
          paddingBottom: b.space[4],
          borderBottom: `1px solid ${b.borderColor}`,
        }}>
          <button
            onClick={handleBackFromDecision}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: b.space[2],
              padding: `${b.space[2]} ${b.space[3]}`,
              backgroundColor: 'transparent',
              border: `1px solid ${b.borderColor}`,
              borderRadius: b.radius.md,
              cursor: 'pointer',
              color: b.textSecondary,
              fontSize: b.fontSize.base,
            }}
          >
            <ArrowLeft size={b.iconSize.md} />
            Zurück
          </button>

          <button
            onClick={() => {
              if (window.confirm('Möchtest du diese Entscheidungs-Analyse wirklich löschen?')) {
                handleDeleteDecision(selectedDecision.id);
                handleBackFromDecision();
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: b.space[2],
              padding: `${b.space[2]} ${b.space[3]}`,
              backgroundColor: 'transparent',
              border: `1px solid ${b.error}`,
              borderRadius: b.radius.md,
              cursor: 'pointer',
              color: b.error,
              fontSize: b.fontSize.base,
            }}
          >
            <Trash2 size={b.iconSize.md} />
            Löschen
          </button>
        </div>

        {/* Show Result if analysis is complete, otherwise show Input */}
        {decisionAnalysisResult ? (
          <DecisionBoardResult
            decisionData={decisionAnalysisResult.data}
            analysisResult={decisionAnalysisResult.result}
            onStartNew={() => {
              setDecisionAnalysisResult(null);
              setSelectedDecision(null);
            }}
            onEditDecision={() => {
              setDecisionAnalysisResult(null);
            }}
          />
        ) : (
          <DecisionBoardInput
            initialData={initialDecisionData}
            onAnalysisComplete={handleDecisionAnalysisComplete}
            isAuthenticated={isAuthenticated}
            savedDecisionId={selectedDecision.id}
            onSaveDraft={handleDecisionDraftSave}
            onUpdateSession={handleDecisionSessionUpdate}
            onDecisionIdChange={() => {}}
          />
        )}
      </div>
    );
  }

  // Show ikigai edit view if an ikigai is selected
  if (selectedIkigai) {
    return (
      <div style={{ padding: b.space[6], maxWidth: '900px', margin: '0 auto' }}>
        {/* Back button and title */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: b.space[6],
        }}>
          <button
            onClick={handleBackFromIkigai}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: b.space[2],
              padding: `${b.space[2]} ${b.space[4]}`,
              backgroundColor: 'transparent',
              border: `1px solid ${b.borderColor}`,
              borderRadius: b.radius.lg,
              color: b.textSecondary,
              cursor: 'pointer',
              fontSize: b.fontSize.sm,
              fontWeight: b.fontWeight.medium,
            }}
          >
            <ArrowLeft size={16} />
            Zurück
          </button>
          <button
            onClick={() => {
              if (window.confirm('Möchtest du diese Ikigai-Analyse wirklich löschen?')) {
                handleDeleteIkigai(selectedIkigai.id);
                handleBackFromIkigai();
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: b.space[2],
              padding: `${b.space[2]} ${b.space[3]}`,
              backgroundColor: 'transparent',
              border: `1px solid ${b.error}`,
              borderRadius: b.radius.lg,
              color: b.error,
              cursor: 'pointer',
              fontSize: b.fontSize.sm,
              fontWeight: b.fontWeight.medium,
            }}
          >
            <Trash2 size={16} />
            Löschen
          </button>
        </div>

        {/* Show Results if synthesis is complete, otherwise show Compass */}
        {ikigaiSynthesisResult ? (
          <IkigaiResults
            dimensions={ikigaiDimensions}
            synthesisResult={ikigaiSynthesisResult}
            onStartNew={handleBackFromIkigai}
            onEdit={() => setIkigaiSynthesisResult(null)}
            DIMENSIONS={IKIGAI_DIMENSIONS}
          />
        ) : (
          <IkigaiCompass
            dimensions={ikigaiDimensions}
            DIMENSIONS={IKIGAI_DIMENSIONS}
            onExtractKeywords={handleIkigaiExtractKeywords}
            onUpdateDimension={handleIkigaiUpdateDimension}
            onRemoveTag={handleIkigaiRemoveTag}
            allDimensionsFilled={allIkigaiDimensionsFilled}
            onSynthesize={handleIkigaiSynthesize}
            isSynthesizing={isIkigaiSynthesizing}
          />
        )}
      </div>
    );
  }

  // Show detail view for selected training session
  if (selectedTrainingSession) {
    // Use RoleplaySessionReport for Live-Simulations
    if (selectedSessionType === TABS.ROLEPLAY) {
      const roleplayScenario = getScenarioForSession(selectedTrainingSession, selectedSessionType);
      return (
        <RoleplaySessionReport
          session={selectedTrainingSession}
          scenario={roleplayScenario}
          onBack={handleBackFromDetail}
          onRepeat={() => onRepeatSession?.(selectedTrainingSession, roleplayScenario, 'roleplay')}
          onDelete={(session) => handleDeleteSession(session, TABS.ROLEPLAY)}
        />
      );
    }

    // Use TrainingSessionDetailView for Simulator and Video
    // Map tab types to session type strings
    const typeMap = {
      [TABS.SIMULATOR]: 'simulator',
      [TABS.VIDEO]: 'video',
    };
    const sessionTypeString = typeMap[selectedSessionType] || 'simulator';

    return (
      <TrainingSessionDetailView
        session={selectedTrainingSession}
        type={selectedSessionType}
        scenario={getScenarioForSession(selectedTrainingSession, selectedSessionType)}
        onBack={handleBackFromDetail}
        onContinueSession={onContinueSession}
        onRepeatSession={(session, scenario) => onRepeatSession?.(session, scenario, sessionTypeString)}
        onDeleteSession={handleDeleteSession}
      />
    );
  }

  // Show login required screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div style={{ padding: b.space[6] }}>
        {/* Header */}
        <div style={{ marginBottom: b.space[8], textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: b.space[3],
            marginBottom: b.space[3],
          }}>
            <div style={{
              width: b.space[12],
              height: b.space[12],
              borderRadius: b.radius.lg,
              background: headerGradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <History style={{ width: b.iconSize['2xl'], height: b.iconSize['2xl'], color: headerText }} />
            </div>
            <h1 style={{
              fontSize: b.fontSize['5xl'],
              fontWeight: b.fontWeight.bold,
              color: b.textMain,
              margin: 0,
            }}>
              Meine Sessions
            </h1>
          </div>
          <p style={{
            fontSize: b.fontSize.lg,
            color: b.textSecondary,
            maxWidth: '600px',
            margin: '0 auto',
          }}>
            Hier findest du deine gespeicherten Übungen und Fortschritte
          </p>
        </div>

        {/* Login required message */}
        <div style={{
          maxWidth: '500px',
          margin: `${b.space[15]} auto`,
          textAlign: 'center',
          padding: b.space[10],
          backgroundColor: b.cardBg,
          borderRadius: b.radius['2xl'],
          boxShadow: b.shadow.md,
        }}>
          <div style={{
            width: b.space[16],
            height: b.space[16],
            borderRadius: b.radius.xl,
            background: headerGradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: `0 auto ${b.space[5]}`,
          }}>
            <LogIn style={{ width: b.iconSize['3xl'], height: b.iconSize['3xl'], color: headerText }} />
          </div>
          <h2 style={{
            fontSize: b.fontSize['3xl'],
            fontWeight: b.fontWeight.bold,
            color: b.textMain,
            marginBottom: b.space[3],
          }}>
            Anmeldung erforderlich
          </h2>
          <p style={{
            fontSize: b.fontSize.md,
            color: b.textMuted,
            marginBottom: b.space[6],
            lineHeight: 1.6,
          }}>
            Um deine gespeicherten Sessions zu sehen, musst du dich zuerst anmelden.
          </p>
          <button
            onClick={onLoginClick}
            style={{
              padding: `${b.space[3.5]} ${b.space[8]}`,
              borderRadius: b.radius.lg,
              border: 'none',
              background: headerGradient,
              color: headerText,
              fontSize: b.fontSize.lg,
              fontWeight: b.fontWeight.semibold,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: b.space[2.5],
              boxShadow: b.coloredShadow(primaryAccent, 'md'),
            }}
          >
            <LogIn style={{ width: b.iconSize.lg, height: b.iconSize.lg }} />
            Jetzt anmelden
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: b.space[10] }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 style={{ width: b.iconSize['4xl'], height: b.iconSize['4xl'], color: primaryAccent, animation: 'spin 1s linear infinite', margin: '0 auto' }} />
          <p style={{ color: b.textMuted, marginTop: b.space[4] }}>Sessions werden geladen...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px', padding: b.space[6] }}>
          <AlertCircle style={{ width: b.iconSize['4xl'], height: b.iconSize['4xl'], color: b.error, margin: `0 auto ${b.space[4]}` }} />
          <h2 style={{ fontSize: b.fontSize['2xl'], fontWeight: b.fontWeight.bold, color: b.textMain, marginBottom: b.space[2] }}>Fehler beim Laden</h2>
          <p style={{ color: b.textMuted, marginBottom: b.space[6] }}>{error}</p>
          <Button onClick={loadAllData}>Erneut versuchen</Button>
        </div>
      </div>
    );
  }

  const activeSessions = getActiveSessions();
  const activeScenarioMap = getActiveScenarioMap();

  return (
    <div style={{ padding: b.space[6] }}>
      {/* Header */}
      <div style={{ marginBottom: b.space[8], textAlign: 'center', position: 'relative' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: b.space[3],
          marginBottom: b.space[3],
        }}>
          <div style={{
            width: b.space[12],
            height: b.space[12],
            borderRadius: b.radius.lg,
            background: headerGradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <History style={{ width: b.iconSize['2xl'], height: b.iconSize['2xl'], color: headerText }} />
          </div>
          <h1 style={{
            fontSize: b.fontSize['5xl'],
            fontWeight: b.fontWeight.bold,
            color: b.textMain,
            margin: 0,
          }}>
            Meine Sessions
          </h1>
        </div>
        <p style={{
          fontSize: b.fontSize.lg,
          color: b.textSecondary,
          maxWidth: '600px',
          margin: '0 auto',
        }}>
          {totalSessions} {totalSessions === 1 ? 'Übung' : 'Übungen'} gespeichert
        </p>
      </div>

      {/* Tabs - Responsive: icons on mobile, full tabs on desktop */}
      <style>{`
        .session-tabs-desktop {
          margin: 0 24px 24px;
          display: flex;
          gap: 8px;
          background: #f1f5f9;
          padding: 6px;
          border-radius: 14px;
        }
        .session-tab-btn-desktop {
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
        .session-tabs-mobile {
          margin: 0 16px 16px;
        }
        .session-tabs-mobile-icons {
          display: flex;
          gap: 8px;
          justify-content: center;
          margin-bottom: 12px;
        }
        .session-tab-btn-mobile {
          flex: 1;
          max-width: 80px;
          padding: 12px 8px;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          transition: all 0.2s;
        }
        .session-tab-mobile-label {
          text-align: center;
          font-size: 15px;
          font-weight: 600;
          color: #0f172a;
          padding: 8px 16px;
          background: #fff;
          border-radius: 10px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }
        .mobile-refresh-btn {
          display: none;
        }
        .desktop-actions {
          margin: 0 24px 24px;
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 12px;
        }
        .sessions-list-container {
          margin: 0 24px;
        }
        @media (min-width: 1025px) {
          .session-tabs-mobile { display: none; }
        }
        @media (min-width: 641px) and (max-width: 1023px) {
          .desktop-actions {
            flex-direction: column;
          }
          .desktop-actions button {
            width: 100%;
            justify-content: center;
          }
        }
        @media (min-width: 1024px) {
          .desktop-actions {
            justify-content: flex-end;
          }
        }
        @media (max-width: 1024px) {
          .session-tabs-desktop { display: none; }
        }
        @media (max-width: 640px) {
          .desktop-actions { display: none; }
          .mobile-refresh-btn {
            display: flex !important;
            position: absolute;
            top: 0;
            right: 0;
          }
          .sessions-list-container {
            margin: 0 16px;
          }
        }
      `}</style>

      {/* Mobile: Refresh button in header area */}
      <button
        onClick={loadAllData}
        disabled={isLoading}
        className="mobile-refresh-btn"
        style={{
          padding: b.space[2.5],
          borderRadius: b.radius.md,
          border: `1px solid ${b.borderColor}`,
          background: b.cardBgColor,
          color: b.textSecondary,
          cursor: isLoading ? 'not-allowed' : 'pointer',
          opacity: isLoading ? 0.5 : 1,
          boxShadow: b.shadow.sm,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <RefreshCw style={{ width: b.iconSize.md, height: b.iconSize.md }} className={isLoading ? 'animate-spin' : ''} />
      </button>

      {/* Desktop Tabs */}
      <div className="session-tabs-desktop">
        {TAB_CONFIG.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const count = tab.id === TABS.SIMULATOR ? simulatorSessions.length :
                       tab.id === TABS.VIDEO ? videoSessions.length :
                       tab.id === TABS.BRIEFINGS ? briefings.length :
                       tab.id === TABS.DECISIONS ? decisions.length :
                       tab.id === TABS.IKIGAI ? ikigais.length :
                       roleplaySessions.length;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="session-tab-btn-desktop"
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
                color: isActive ? 'white' : '#64748b',
                fontSize: '12px',
                fontWeight: 600,
                minWidth: '24px',
                textAlign: 'center',
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Mobile Tabs - Icons with counts + active label below */}
      <div className="session-tabs-mobile">
        <div className="session-tabs-mobile-icons">
          {TAB_CONFIG.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const count = tab.id === TABS.SIMULATOR ? simulatorSessions.length :
                         tab.id === TABS.VIDEO ? videoSessions.length :
                         tab.id === TABS.BRIEFINGS ? briefings.length :
                         tab.id === TABS.DECISIONS ? decisions.length :
                         roleplaySessions.length;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="session-tab-btn-mobile"
                style={{
                  background: isActive ? '#fff' : '#f1f5f9',
                  boxShadow: isActive ? '0 2px 8px rgba(0, 0, 0, 0.1)' : 'none',
                  border: isActive ? `2px solid ${primaryAccent}` : '2px solid transparent',
                }}
              >
                <Icon size={20} style={{ color: isActive ? primaryAccent : '#64748b' }} />
                <span style={{
                  padding: '2px 6px',
                  borderRadius: '8px',
                  background: isActive ? primaryAccent : '#e2e8f0',
                  color: isActive ? 'white' : '#64748b',
                  fontSize: '11px',
                  fontWeight: 600,
                  minWidth: '20px',
                  textAlign: 'center',
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        {/* Active tab label */}
        <div className="session-tab-mobile-label">
          {TAB_CONFIG.find(t => t.id === activeTab)?.label}
        </div>
      </div>

      {/* Desktop Action buttons */}
      <div className="desktop-actions">
        <Button variant="outline" onClick={loadAllData} disabled={isLoading}>
          <RefreshCw style={{ width: '16px', height: '16px', marginRight: '8px' }} className={isLoading ? 'animate-spin' : ''} />
          Aktualisieren
        </Button>
        {onNavigateToModule && (
          <Button
            onClick={() => {
              // Navigate to the corresponding module based on active tab
              const moduleMap = {
                [TABS.BRIEFINGS]: 'smart_briefing',
                [TABS.DECISIONS]: 'decision_board',
                [TABS.IKIGAI]: 'ikigai',
                [TABS.SIMULATOR]: 'simulator',
                [TABS.VIDEO]: 'video_training',
                [TABS.ROLEPLAY]: 'dashboard',
              };
              onNavigateToModule(moduleMap[activeTab] || 'overview');
            }}
            style={{
              background: headerGradient,
              color: headerText,
            }}
          >
            <Plus style={{ width: '16px', height: '16px', marginRight: '8px' }} />
            {activeTab === TABS.BRIEFINGS ? 'Neues Briefing' :
             activeTab === TABS.DECISIONS ? 'Neue Entscheidungs-Analyse' :
             activeTab === TABS.IKIGAI ? 'Neue Ikigai-Analyse' :
             activeTab === TABS.SIMULATOR ? 'Neues Szenario-Training' :
             activeTab === TABS.VIDEO ? 'Neue Wirkungs-Analyse' :
             'Neue Live-Simulation'}
          </Button>
        )}
      </div>

      {/* Sessions List */}
      <div className="sessions-list-container">
        {activeSessions.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: `${b.space[15]} ${b.space[6]}`,
            background: b.cardBg,
            borderRadius: b.radius['2xl'],
            boxShadow: b.shadow.sm,
          }}>
            {activeTab === TABS.SIMULATOR && <Target style={{ width: b.iconSize['4xl'], height: b.iconSize['4xl'], color: b.textMuted, margin: `0 auto ${b.space[4]}`, display: 'block' }} />}
            {activeTab === TABS.ROLEPLAY && <MessageSquare style={{ width: b.iconSize['4xl'], height: b.iconSize['4xl'], color: b.textMuted, margin: `0 auto ${b.space[4]}`, display: 'block' }} />}
            {activeTab === TABS.VIDEO && <Video style={{ width: b.iconSize['4xl'], height: b.iconSize['4xl'], color: b.textMuted, margin: `0 auto ${b.space[4]}`, display: 'block' }} />}
            {activeTab === TABS.BRIEFINGS && <Sparkles style={{ width: b.iconSize['4xl'], height: b.iconSize['4xl'], color: b.textMuted, margin: `0 auto ${b.space[4]}`, display: 'block' }} />}
            {activeTab === TABS.DECISIONS && <Scale style={{ width: b.iconSize['4xl'], height: b.iconSize['4xl'], color: b.textMuted, margin: `0 auto ${b.space[4]}`, display: 'block' }} />}
            {activeTab === TABS.IKIGAI && <Compass style={{ width: b.iconSize['4xl'], height: b.iconSize['4xl'], color: b.textMuted, margin: `0 auto ${b.space[4]}`, display: 'block' }} />}
            <h3 style={{ fontSize: b.fontSize['2xl'], fontWeight: b.fontWeight.semibold, color: b.textSecondary, marginBottom: b.space[2] }}>
              Noch keine {activeTab === TABS.SIMULATOR ? 'Szenario-Trainings' : activeTab === TABS.VIDEO ? 'Wirkungs-Analysen' : activeTab === TABS.BRIEFINGS ? 'Smart Briefings' : activeTab === TABS.DECISIONS ? 'Entscheidungs-Analysen' : activeTab === TABS.IKIGAI ? 'Ikigai-Analysen' : 'Live-Simulationen'}
            </h3>
            <p style={{ color: b.textMuted, fontSize: b.fontSize.base, marginBottom: b.space[6] }}>
              {activeTab === TABS.BRIEFINGS
                ? 'Erstelle dein erstes Briefing, um dich optimal vorzubereiten.'
                : activeTab === TABS.DECISIONS
                ? 'Nutze den Entscheidungs-Kompass, um deine erste Entscheidung zu analysieren.'
                : activeTab === TABS.IKIGAI
                ? 'Entdecke deinen idealen Karrierepfad mit dem Ikigai-Kompass.'
                : 'Starte dein erstes Training, um hier deine Fortschritte zu sehen.'}
            </p>
            <Button onClick={onBack}>
              <Play style={{ width: b.iconSize.sm, height: b.iconSize.sm, marginRight: b.space[2] }} />
              {activeTab === TABS.BRIEFINGS ? 'Briefing erstellen' : activeTab === TABS.DECISIONS ? 'Entscheidung analysieren' : activeTab === TABS.IKIGAI ? 'Ikigai entdecken' : 'Training starten'}
            </Button>
          </div>
        ) : (
          <motion.div
            style={{ display: 'flex', flexDirection: 'column', gap: b.space[3] }}
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
            ) : activeTab === TABS.DECISIONS ? (
              // Render decisions
              decisions.map((decision) => (
                <DecisionCard
                  key={decision.id}
                  decision={decision}
                  onClick={() => handleDecisionClick(decision)}
                  onDelete={handleDeleteDecision}
                  headerGradient={headerGradient}
                  headerText={headerText}
                  primaryAccent={primaryAccent}
                />
              ))
            ) : activeTab === TABS.IKIGAI ? (
              // Render ikigai analyses
              ikigais.map((ikigai) => (
                <IkigaiCard
                  key={ikigai.id}
                  ikigai={ikigai}
                  onDelete={handleDeleteIkigai}
                  onNavigate={() => handleIkigaiClick(ikigai)}
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
                    onDeleteSession={handleDeleteSession}
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
