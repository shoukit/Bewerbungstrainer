/**
 * SessionHistory Component
 *
 * Central hub for viewing all saved sessions, briefings, decisions, and ikigais.
 * Migrated to Tailwind CSS for consistent styling.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  History,
  MessageSquare,
  AlertCircle,
  Play,
  RefreshCw,
  LogIn,
  Target,
  Video,
  Sparkles,
  Trash2,
  Plus,
} from 'lucide-react';
import { Button, Card, Skeleton, SkeletonListItem } from '@/components/ui';
import { getRoleplaySessions, getRoleplayScenarios } from '@/services/roleplay-feedback-adapter';
import { usePartner } from '@/context/PartnerContext';
import TrainingSessionDetailView from '@/components/session-detail/TrainingSessionDetailView';
import RoleplaySessionReport from '@/components/roleplay/RoleplaySessionReport';
import { getWPNonce, getWPApiUrl } from '@/services/wordpress-api';
import wordpressAPI from '@/services/wordpress-api';
import BriefingWorkbook from '@/components/smartbriefing/BriefingWorkbook';
import DecisionBoardInput from '@/components/decision-board/DecisionBoardInput';
import DecisionBoardResult from '@/components/decision-board/DecisionBoardResult';
import { BriefingCard, SessionCard, DecisionCard, IkigaiCard } from '@/components/session-history';
import IkigaiCompass from '@/components/ikigai/IkigaiCompass';
import IkigaiResults from '@/components/ikigai/IkigaiResults';
import SessionDetailHeader from '@/components/session-detail/SessionDetailHeader';
import { Scale, Compass } from 'lucide-react';

import { IKIGAI_COLORS } from '@/config/colors';

/**
 * Dimension configuration for Ikigai
 * Uses centralized IKIGAI_COLORS from colors.js
 */
const IKIGAI_DIMENSIONS = {
  love: {
    key: 'love',
    label: 'Liebe',
    icon: '❤️',
    color: IKIGAI_COLORS.love.color,
    question: 'Vergiss mal Geld und Karriere. Bei welchen Tätigkeiten vergisst du die Zeit?',
    placeholder: 'Erzähle mir, was du wirklich liebst zu tun...',
    description: 'Was du liebst',
  },
  talent: {
    key: 'talent',
    label: 'Talent',
    icon: '⭐',
    color: IKIGAI_COLORS.talent.color,
    question: 'Worin bist du richtig gut? Was fällt dir leicht, während andere damit kämpfen?',
    placeholder: 'Beschreibe deine Stärken und Fähigkeiten...',
    description: 'Worin du gut bist',
  },
  need: {
    key: 'need',
    label: 'Welt',
    icon: '🌍',
    color: IKIGAI_COLORS.need.color,
    question: 'Welche Probleme der Welt würdest du gerne lösen? Wo siehst du Bedarf?',
    placeholder: 'Welchen Beitrag möchtest du leisten...',
    description: 'Was die Welt braucht',
  },
  market: {
    key: 'market',
    label: 'Markt',
    icon: '💰',
    color: IKIGAI_COLORS.market.color,
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
  const { branding, demoCode } = usePartner();

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
      <div className="min-h-screen bg-slate-50">
        {/* Unified Header */}
        <SessionDetailHeader
          type="decision"
          title={selectedDecision.topic || 'Entscheidung'}
          status={selectedDecision.status}
          createdAt={selectedDecision.created_at}
          onBack={handleBackFromDecision}
          onDelete={() => {
            if (window.confirm('Möchtest du diese Entscheidungs-Analyse wirklich löschen?')) {
              handleDeleteDecision(selectedDecision.id);
              handleBackFromDecision();
            }
          }}
        />

        {/* Content */}
        <div className="p-6 max-w-[900px] mx-auto">
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
      </div>
    );
  }

  // Show ikigai edit view if an ikigai is selected
  if (selectedIkigai) {
    return (
      <div className="min-h-screen bg-slate-50">
        {/* Unified Header */}
        <SessionDetailHeader
          type="ikigai"
          title="Ikigai-Analyse"
          subtitle={selectedIkigai.status === 'completed' ? 'Berufliche Orientierung' : 'In Bearbeitung'}
          status={selectedIkigai.status}
          createdAt={selectedIkigai.created_at}
          onBack={handleBackFromIkigai}
          onDelete={() => {
            if (window.confirm('Möchtest du diese Ikigai-Analyse wirklich löschen?')) {
              handleDeleteIkigai(selectedIkigai.id);
              handleBackFromIkigai();
            }
          }}
        />

        {/* Content */}
        <div className="p-6 max-w-[900px] mx-auto">
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
      <div className="p-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <History className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900">
              Meine Sessions
            </h1>
          </div>
          <p className="text-lg text-slate-500 max-w-[600px] mx-auto">
            Hier findest du deine gespeicherten Übungen und Fortschritte
          </p>
        </div>

        {/* Login required message */}
        <Card className="max-w-[500px] mx-auto mt-16 p-10 text-center rounded-2xl shadow-card">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mx-auto mb-5">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">
            Anmeldung erforderlich
          </h2>
          <p className="text-slate-500 mb-6 leading-relaxed">
            Um deine gespeicherten Sessions zu sehen, musst du dich zuerst anmelden.
          </p>
          <Button
            onClick={onLoginClick}
            size="lg"
            icon={<LogIn className="w-5 h-5" />}
          >
            Jetzt anmelden
          </Button>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        {/* Skeleton Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-3 mb-3">
            <Skeleton className="w-12 h-12 rounded-2xl" />
            <Skeleton className="h-10 w-48" />
          </div>
          <Skeleton className="h-5 w-32 mx-auto" />
        </div>

        {/* Skeleton Tabs */}
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-12 w-28 rounded-xl" />
          ))}
        </div>

        {/* Skeleton List */}
        <div className="space-y-3 max-w-4xl mx-auto">
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonListItem key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center max-w-[400px] p-6">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Fehler beim Laden</h2>
          <p className="text-slate-500 mb-6">{error}</p>
          <Button onClick={loadAllData}>Erneut versuchen</Button>
        </div>
      </div>
    );
  }

  const activeSessions = getActiveSessions();
  const activeScenarioMap = getActiveScenarioMap();

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8 text-center relative">
        <div className="inline-flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
            <History className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900">
            Meine Sessions
          </h1>
        </div>
        <p className="text-lg text-slate-500 max-w-[600px] mx-auto">
          {totalSessions} {totalSessions === 1 ? 'Übung' : 'Übungen'} gespeichert
        </p>

        {/* Mobile: Refresh button in header area */}
        <button
          onClick={loadAllData}
          disabled={isLoading}
          className="absolute top-0 right-0 p-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm flex items-center justify-center md:hidden disabled:opacity-50 hover:shadow-md transition-shadow"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Desktop Tabs */}
      <div className="hidden lg:flex flex-wrap gap-2 mx-6 mb-6 bg-slate-100 p-1.5 rounded-2xl">
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
              className={`flex-1 min-w-fit py-3 px-4 rounded-xl border-none text-sm cursor-pointer flex items-center justify-center gap-2 transition-all ${
                isActive
                  ? 'bg-white text-slate-900 font-semibold shadow-md'
                  : 'bg-transparent text-slate-500 font-medium hover:bg-white/50'
              }`}
            >
              <Icon size={18} />
              <span>{tab.label}</span>
              <span className={`py-0.5 px-2 rounded-xl text-xs font-semibold min-w-[24px] text-center ${
                isActive ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Mobile Tabs - Icons with counts + active label below */}
      <div className="lg:hidden mx-4 mb-4">
        <div className="flex gap-2 justify-center mb-3">
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
                className={`flex-1 max-w-[80px] py-3 px-2 rounded-xl border-2 cursor-pointer flex flex-col items-center justify-center gap-1 transition-all ${
                  isActive
                    ? 'bg-white shadow-md border-indigo-500'
                    : 'bg-slate-100 border-transparent hover:bg-white/60'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-indigo-500' : 'text-slate-500'} />
                <span className={`py-0.5 px-1.5 rounded-lg text-[11px] font-semibold min-w-[20px] text-center ${
                  isActive ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        {/* Active tab label */}
        <div className="text-center text-[15px] font-semibold text-slate-900 py-2 px-4 bg-white rounded-xl shadow-sm">
          {TAB_CONFIG.find(t => t.id === activeTab)?.label}
        </div>
      </div>

      {/* Desktop Action buttons */}
      <div className="hidden sm:flex justify-center lg:justify-end flex-wrap gap-3 mx-6 mb-6">
        <Button variant="outline" onClick={loadAllData} disabled={isLoading} title="Aktualisieren">
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
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
          >
            <Plus className="w-4 h-4 mr-2" />
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
      <div className="mx-4 sm:mx-6">
        {activeSessions.length === 0 ? (
          <Card className="text-center py-16 px-6 rounded-2xl shadow-card">
            {activeTab === TABS.SIMULATOR && <Target className="w-12 h-12 text-slate-300 mx-auto mb-4" />}
            {activeTab === TABS.ROLEPLAY && <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />}
            {activeTab === TABS.VIDEO && <Video className="w-12 h-12 text-slate-300 mx-auto mb-4" />}
            {activeTab === TABS.BRIEFINGS && <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-4" />}
            {activeTab === TABS.DECISIONS && <Scale className="w-12 h-12 text-slate-300 mx-auto mb-4" />}
            {activeTab === TABS.IKIGAI && <Compass className="w-12 h-12 text-slate-300 mx-auto mb-4" />}
            <h3 className="text-xl font-semibold text-slate-600 mb-2">
              Noch keine {activeTab === TABS.SIMULATOR ? 'Szenario-Trainings' : activeTab === TABS.VIDEO ? 'Wirkungs-Analysen' : activeTab === TABS.BRIEFINGS ? 'Smart Briefings' : activeTab === TABS.DECISIONS ? 'Entscheidungs-Analysen' : activeTab === TABS.IKIGAI ? 'Ikigai-Analysen' : 'Live-Simulationen'}
            </h3>
            <p className="text-slate-500 mb-6">
              {activeTab === TABS.BRIEFINGS
                ? 'Erstelle dein erstes Briefing, um dich optimal vorzubereiten.'
                : activeTab === TABS.DECISIONS
                ? 'Nutze den Entscheidungs-Kompass, um deine erste Entscheidung zu analysieren.'
                : activeTab === TABS.IKIGAI
                ? 'Entdecke deinen idealen Karrierepfad mit dem Ikigai-Kompass.'
                : 'Starte dein erstes Training, um hier deine Fortschritte zu sehen.'}
            </p>
            <Button onClick={onBack}>
              <Play className="w-4 h-4 mr-2" />
              {activeTab === TABS.BRIEFINGS ? 'Briefing erstellen' : activeTab === TABS.DECISIONS ? 'Entscheidung analysieren' : activeTab === TABS.IKIGAI ? 'Ikigai entdecken' : 'Training starten'}
            </Button>
          </Card>
        ) : (
          <motion.div
            className="flex flex-col gap-3"
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
                  />
                );
              })
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SessionHistory;
