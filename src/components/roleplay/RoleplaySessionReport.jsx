/**
 * RoleplaySessionReport Component
 *
 * Unified, beautiful report view for Live-Simulation sessions.
 * Used both after session completion and from Session History.
 *
 * Features:
 * - Clean header with score gauge
 * - Two-column layout (desktop) / stacked (mobile)
 * - Audio player with timeline
 * - Chat-style transcript
 * - Tabbed feedback: Coaching & Analysen
 * - Full responsive design
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Play,
  Calendar,
  Clock,
  Loader2,
  Trash2,
  Download,
} from 'lucide-react';
import { useBranding } from '@/hooks/useBranding';
import { getScoreColor } from '@/config/colors';
import { formatDuration } from '@/utils/formatting';
import { parseFeedbackJSON, parseAudioAnalysisJSON, parseTranscriptJSON } from '@/utils/parseJSON';
import { getRoleplaySessionAnalysis, getRoleplaySessionAudioUrl } from '@/services/roleplay-feedback-adapter';
import { getWPNonce } from '@/services/wordpress-api';

// Extracted sub-components
import ScoreGauge from './ScoreGauge';
import ReportAudioPlayer from './ReportAudioPlayer';
import ReportTranscriptView from './ReportTranscriptView';
import ReportCoachingContent from './ReportCoachingContent';
import ReportAnalysenContent from './ReportAnalysenContent';

// =============================================================================
// CONSTANTS
// =============================================================================

const TABS = {
  COACHING: 'coaching',
  ANALYSEN: 'analysen',
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const getGradeLabel = (score) => {
  if (score >= 90) return 'Ausgezeichnet!';
  if (score >= 80) return 'Sehr gut!';
  if (score >= 70) return 'Gut!';
  if (score >= 60) return 'Solide Leistung';
  if (score >= 50) return 'Ausbaufähig';
  return 'Weiter üben!';
};

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

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const RoleplaySessionReport = ({
  session: sessionProp,
  scenario,
  feedback: feedbackProp,
  audioAnalysis: audioAnalysisProp,
  onBack,
  onRepeat,
  onDelete,
  isLoading: isLoadingProp = false,
  // Optional branding overrides - defaults come from useBranding hook
  primaryAccent: primaryAccentProp,
  headerGradient: headerGradientProp,
}) => {
  // Get branding from hook (self-contained - works without props)
  const b = useBranding();

  // Use props if provided, otherwise use branding from hook
  const primaryAccent = primaryAccentProp || b.primaryAccent;
  const headerGradient = headerGradientProp || b.headerGradient;

  const audioSeekRef = useRef(null);
  const [activeTab, setActiveTab] = useState(TABS.COACHING);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // State for full session data (fetched if needed)
  const [fullSession, setFullSession] = useState(null);
  const [isLoadingSession, setIsLoadingSession] = useState(false);

  // Use full session if available, otherwise use prop
  const session = fullSession || sessionProp;

  // Fetch full session data if audio_analysis_json is missing
  useEffect(() => {
    const needsFullData = sessionProp?.id &&
      !sessionProp?.audio_analysis_json &&
      !audioAnalysisProp &&
      !fullSession;

    if (needsFullData) {
      setIsLoadingSession(true);
      getRoleplaySessionAnalysis(sessionProp.id)
        .then(data => {
          setFullSession(data);
        })
        .catch(err => {
          console.error('Failed to fetch full session:', err);
        })
        .finally(() => {
          setIsLoadingSession(false);
        });
    }
  }, [sessionProp?.id, sessionProp?.audio_analysis_json, audioAnalysisProp, fullSession]);

  // Parse feedback and audio analysis
  const feedback = useMemo(() => {
    if (feedbackProp && typeof feedbackProp === 'object') return feedbackProp;
    if (session?.feedback_json) return parseFeedbackJSON(session.feedback_json);
    return null;
  }, [feedbackProp, session?.feedback_json]);

  const audioAnalysis = useMemo(() => {
    if (audioAnalysisProp && typeof audioAnalysisProp === 'object') return audioAnalysisProp;
    if (session?.audio_analysis_json) return parseAudioAnalysisJSON(session.audio_analysis_json);
    return null;
  }, [audioAnalysisProp, session?.audio_analysis_json]);

  const transcript = useMemo(() => {
    if (session?.transcript) return parseTranscriptJSON(session.transcript);
    return [];
  }, [session?.transcript]);

  // Get audio URL - prefer stored URL, fallback to proxy
  const audioUrl = useMemo(() => {
    // Prefer stored local URL if available
    if (session?.audio_url) {
      return session.audio_url;
    }
    // Fallback to proxy endpoint (fetches from ElevenLabs using conversation_id)
    if (session?.id) {
      return getRoleplaySessionAudioUrl(session.id);
    }
    return null;
  }, [session?.id, session?.audio_url]);

  // Calculate overall score
  const overallScore = useMemo(() => {
    if (feedback?.rating?.overall !== undefined) {
      return feedback.rating.overall * 10;
    }
    return 0;
  }, [feedback]);

  const handleSeekToTime = (time) => {
    if (audioSeekRef.current) {
      audioSeekRef.current(time);
    }
  };

  const handleDownloadPdf = async () => {
    if (!session?.id || isDownloading) return;

    setIsDownloading(true);
    try {
      const wpApiSettings = window.wpApiSettings || {};
      const baseUrl = wpApiSettings.root || '/wp-json/';
      const nonce = getWPNonce();

      const response = await fetch(`${baseUrl}bewerbungstrainer/v1/sessions/${session.id}/export-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': nonce,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('[PDF] Server error:', data);
        throw new Error(data.error || 'PDF-Export fehlgeschlagen');
      }

      if (data.pdf_base64 && data.filename) {
        // Create blob from base64
        const byteCharacters = atob(data.pdf_base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });

        // Download
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = data.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('[PDF] Download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const isLoading = isLoadingProp || isLoadingSession;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <Loader2 size={40} className="animate-spin text-primary" />
        <p className="text-sm text-slate-500">Lade Report...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div
        className="sticky top-0 z-40 p-5 px-4 md:p-6 md:px-8"
        style={{ background: headerGradient }}
      >
        <div className="max-w-[1400px] mx-auto">
          {/* Back Button */}
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 bg-white/15 border-none rounded-lg px-3 py-2 cursor-pointer text-white text-[13px] mb-4 hover:bg-white/25 transition-colors"
            >
              <ArrowLeft size={16} />
              Zurück zur Übersicht
            </button>
          )}

          {/* Header Content */}
          <div className="flex items-center gap-6">
            {/* Score Gauge - Hidden on mobile */}
            <div className="hidden md:block">
              <ScoreGauge score={overallScore} size={100} primaryAccent={primaryAccent} isHeader />
            </div>

            {/* Title & Meta */}
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full bg-white/20 text-white">
                  Live-Simulation
                </span>
                <span
                  className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/90"
                  style={{ color: getScoreColor(overallScore, primaryAccent) }}
                >
                  {getGradeLabel(overallScore)}
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-white m-0 mb-2">
                {scenario?.title || session?.scenario_title || 'Übungssession'}
              </h1>
              <div className="flex items-center gap-4 flex-wrap">
                <span className="flex items-center gap-1.5 text-[13px] text-white/80">
                  <Calendar size={14} />
                  {formatDate(session?.created_at)}
                </span>
                {session?.duration && (
                  <span className="flex items-center gap-1.5 text-[13px] text-white/80">
                    <Clock size={14} />
                    {formatDuration(session.duration)}
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons - Desktop */}
            <div className="hidden md:flex items-center gap-2">
              {session?.id && (
                <button
                  onClick={handleDownloadPdf}
                  disabled={isDownloading}
                  className="flex items-center gap-2 bg-white/20 border border-white/30 rounded-[10px] px-5 py-2.5 cursor-pointer text-white text-sm font-medium hover:bg-white/30 transition-colors disabled:opacity-70 disabled:cursor-wait"
                >
                  {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                  PDF Export
                </button>
              )}
              {onRepeat && (
                <button
                  onClick={onRepeat}
                  className="flex items-center gap-2 bg-white/20 border border-white/30 rounded-[10px] px-5 py-2.5 cursor-pointer text-white text-sm font-medium hover:bg-white/30 transition-colors"
                >
                  <Play size={16} />
                  Erneut üben
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 bg-red-500/20 border border-red-500/40 rounded-[10px] px-4 py-2.5 cursor-pointer text-white text-sm font-medium hover:bg-red-500/30 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto p-4 md:px-8 md:py-6">
        {/* Two Column Layout - 30:70 split */}
        <div className="grid grid-cols-1 md:grid-cols-[30fr_70fr] gap-6 items-start">
          {/* Left Column: Transcript + Audio Player */}
          <div className="order-2 md:order-1">
            <ReportTranscriptView
              transcript={transcript}
              scenario={scenario}
              primaryAccent={primaryAccent}
              branding={b}
              onSeekToTime={handleSeekToTime}
            />
            {/* Audio Player under Transcript */}
            <div className="mt-4">
              <ReportAudioPlayer
                audioUrl={audioUrl}
                duration={session?.duration}
                primaryAccent={primaryAccent}
                branding={b}
                onSeek={audioSeekRef}
              />
            </div>
          </div>

          {/* Right Column: Tabbed Feedback */}
          <div className="order-1 md:order-2">
            {/* Tabs */}
            <div className="flex bg-white rounded-xl p-1 mb-4 border border-slate-200">
              <button
                onClick={() => setActiveTab(TABS.COACHING)}
                className={`flex-1 py-2.5 px-4 rounded-lg border-none text-[13px] font-semibold cursor-pointer transition-all ${
                  activeTab === TABS.COACHING
                    ? 'text-white'
                    : 'bg-transparent text-slate-500 hover:text-slate-700'
                }`}
                style={activeTab === TABS.COACHING ? { background: primaryAccent } : {}}
              >
                Coaching
              </button>
              <button
                onClick={() => setActiveTab(TABS.ANALYSEN)}
                className={`flex-1 py-2.5 px-4 rounded-lg border-none text-[13px] font-semibold cursor-pointer transition-all ${
                  activeTab === TABS.ANALYSEN
                    ? 'text-white'
                    : 'bg-transparent text-slate-500 hover:text-slate-700'
                }`}
                style={activeTab === TABS.ANALYSEN ? { background: primaryAccent } : {}}
              >
                Analysen
              </button>
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === TABS.COACHING ? (
                  <ReportCoachingContent
                    feedback={feedback}
                    audioAnalysis={audioAnalysis}
                    primaryAccent={primaryAccent}
                    branding={b}
                  />
                ) : (
                  <ReportAnalysenContent
                    audioAnalysis={audioAnalysis}
                    primaryAccent={primaryAccent}
                    branding={b}
                    onJumpToTimestamp={handleSeekToTime}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile Action Buttons */}
        <div className="mt-6 flex flex-col gap-3 md:hidden">
          {session?.id && (
            <button
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              className="w-full flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 cursor-pointer text-white text-[15px] font-semibold border-none disabled:opacity-70 disabled:cursor-wait"
              style={{ background: primaryAccent }}
            >
              {isDownloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
              PDF Export
            </button>
          )}
          {onRepeat && (
            <button
              onClick={onRepeat}
              className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 rounded-xl px-6 py-3.5 cursor-pointer text-slate-900 text-[15px] font-semibold hover:bg-slate-50 transition-colors"
            >
              <Play size={18} />
              Erneut üben
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center justify-center gap-2 bg-transparent border border-red-500 rounded-xl px-6 py-3.5 cursor-pointer text-red-500 text-[15px] font-semibold hover:bg-red-50 transition-colors"
            >
              <Trash2 size={18} />
              Session löschen
            </button>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(false)}
              className="fixed inset-0 bg-black/50 z-[1000]"
            />
            {/* Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl p-6 max-w-[400px] w-[90%] z-[1001] shadow-2xl"
            >
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <Trash2 size={24} className="text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Session löschen?
                </h3>
                <p className="text-sm text-slate-500 mb-6">
                  Diese Aktion kann nicht rückgängig gemacht werden. Dein Transkript und Feedback werden dauerhaft gelöscht.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                    className="flex-1 py-3 px-4 rounded-[10px] border border-slate-200 bg-white text-slate-900 text-sm font-medium cursor-pointer hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={async () => {
                      if (!onDelete || !session?.id) return;
                      setIsDeleting(true);
                      try {
                        await onDelete(session);
                      } catch (err) {
                        console.error('Failed to delete session:', err);
                      } finally {
                        setIsDeleting(false);
                        setShowDeleteConfirm(false);
                      }
                    }}
                    disabled={isDeleting}
                    className="flex-1 py-3 px-4 rounded-[10px] border-none bg-red-500 text-white text-sm font-medium cursor-pointer flex items-center justify-center gap-2 hover:bg-red-600 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Löschen...
                      </>
                    ) : (
                      <>
                        <Trash2 size={16} />
                        Löschen
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RoleplaySessionReport;
