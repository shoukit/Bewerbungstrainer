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
import { useMobile } from '@/hooks/useMobile';
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
}) => {
  const b = useBranding();
  const isMobile = useMobile(768);
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

  const primaryAccent = b.primaryAccent;
  const headerGradient = b.headerGradient;

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
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '16px',
      }}>
        <Loader2 size={40} color={primaryAccent} style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ color: b.textSecondary, fontSize: '14px' }}>Lade Report...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: b.pageBg }}>
      {/* Header */}
      <div style={{
        background: headerGradient,
        padding: isMobile ? '20px 16px' : '24px 32px',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Back Button */}
          {onBack && (
            <button
              onClick={onBack}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 12px',
                cursor: 'pointer',
                color: '#fff',
                fontSize: '13px',
                marginBottom: '16px',
              }}
            >
              <ArrowLeft size={16} />
              Zurück zur Übersicht
            </button>
          )}

          {/* Header Content */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
          }}>
            {/* Score Gauge - Hidden on mobile */}
            {!isMobile && (
              <ScoreGauge score={overallScore} size={100} primaryAccent={primaryAccent} isHeader />
            )}

            {/* Title & Meta */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  background: 'rgba(255,255,255,0.2)',
                  color: '#fff',
                }}>
                  Live-Simulation
                </span>
                <span style={{
                  fontSize: '12px',
                  fontWeight: 500,
                  padding: '4px 10px',
                  borderRadius: '20px',
                  background: 'rgba(255,255,255,0.9)',
                  color: getScoreColor(overallScore, primaryAccent),
                }}>
                  {getGradeLabel(overallScore)}
                </span>
              </div>
              <h1 style={{
                fontSize: isMobile ? '20px' : '24px',
                fontWeight: 700,
                color: '#fff',
                margin: 0,
                marginBottom: '8px',
              }}>
                {scenario?.title || session?.scenario_title || 'Übungssession'}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>
                  <Calendar size={14} />
                  {formatDate(session?.created_at)}
                </span>
                {session?.duration && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>
                    <Clock size={14} />
                    {formatDuration(session.duration)}
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            {!isMobile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {session?.id && (
                  <button
                    onClick={handleDownloadPdf}
                    disabled={isDownloading}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: 'rgba(255,255,255,0.2)',
                      border: '1px solid rgba(255,255,255,0.3)',
                      borderRadius: '10px',
                      padding: '10px 20px',
                      cursor: isDownloading ? 'wait' : 'pointer',
                      color: '#fff',
                      fontSize: '14px',
                      fontWeight: 500,
                      opacity: isDownloading ? 0.7 : 1,
                    }}
                  >
                    {isDownloading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={16} />}
                    PDF Export
                  </button>
                )}
                {onRepeat && (
                  <button
                    onClick={onRepeat}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: 'rgba(255,255,255,0.2)',
                      border: '1px solid rgba(255,255,255,0.3)',
                      borderRadius: '10px',
                      padding: '10px 20px',
                      cursor: 'pointer',
                      color: '#fff',
                      fontSize: '14px',
                      fontWeight: 500,
                    }}
                  >
                    <Play size={16} />
                    Erneut üben
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: 'rgba(239,68,68,0.2)',
                      border: '1px solid rgba(239,68,68,0.4)',
                      borderRadius: '10px',
                      padding: '10px 16px',
                      cursor: 'pointer',
                      color: '#fff',
                      fontSize: '14px',
                      fontWeight: 500,
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: isMobile ? '16px' : '24px 32px',
      }}>
        {/* Two Column Layout - 30:70 split */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '30fr 70fr',
          gap: '24px',
          alignItems: 'start',
        }}>
          {/* Left Column: Transcript + Audio Player */}
          <div style={{ order: isMobile ? 2 : 1 }}>
            <ReportTranscriptView
              transcript={transcript}
              scenario={scenario}
              primaryAccent={primaryAccent}
              branding={b}
              onSeekToTime={handleSeekToTime}
            />
            {/* Audio Player under Transcript */}
            <div style={{ marginTop: '16px' }}>
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
          <div style={{ order: isMobile ? 1 : 2 }}>
            {/* Tabs */}
            <div style={{
              display: 'flex',
              background: '#fff',
              borderRadius: '12px',
              padding: '4px',
              marginBottom: '16px',
              border: `1px solid ${b.borderColor}`,
            }}>
              <button
                onClick={() => setActiveTab(TABS.COACHING)}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: activeTab === TABS.COACHING ? primaryAccent : 'transparent',
                  color: activeTab === TABS.COACHING ? '#fff' : b.textSecondary,
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                Coaching
              </button>
              <button
                onClick={() => setActiveTab(TABS.ANALYSEN)}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: activeTab === TABS.ANALYSEN ? primaryAccent : 'transparent',
                  color: activeTab === TABS.ANALYSEN ? '#fff' : b.textSecondary,
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
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
        {isMobile && (
          <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {session?.id && (
              <button
                onClick={handleDownloadPdf}
                disabled={isDownloading}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: primaryAccent,
                  border: 'none',
                  borderRadius: '12px',
                  padding: '14px 24px',
                  cursor: isDownloading ? 'wait' : 'pointer',
                  color: '#fff',
                  fontSize: '15px',
                  fontWeight: 600,
                  opacity: isDownloading ? 0.7 : 1,
                }}
              >
                {isDownloading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={18} />}
                PDF Export
              </button>
            )}
            {onRepeat && (
              <button
                onClick={onRepeat}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: b.cardBg,
                  border: `1px solid ${b.borderColor}`,
                  borderRadius: '12px',
                  padding: '14px 24px',
                  cursor: 'pointer',
                  color: b.textMain,
                  fontSize: '15px',
                  fontWeight: 600,
                }}
              >
                <Play size={18} />
                Erneut üben
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: 'transparent',
                  border: '1px solid #ef4444',
                  borderRadius: '12px',
                  padding: '14px 24px',
                  cursor: 'pointer',
                  color: '#ef4444',
                  fontSize: '15px',
                  fontWeight: 600,
                }}
              >
                <Trash2 size={18} />
                Session löschen
              </button>
            )}
          </div>
        )}
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
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.5)',
                zIndex: 1000,
              }}
            />
            {/* Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: '#fff',
                borderRadius: '16px',
                padding: '24px',
                maxWidth: '400px',
                width: '90%',
                zIndex: 1001,
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'rgba(239,68,68,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}>
                  <Trash2 size={24} color="#ef4444" />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: b.textMain, marginBottom: '8px' }}>
                  Session löschen?
                </h3>
                <p style={{ fontSize: '14px', color: b.textSecondary, marginBottom: '24px' }}>
                  Diese Aktion kann nicht rückgängig gemacht werden. Dein Transkript und Feedback werden dauerhaft gelöscht.
                </p>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: `1px solid ${b.borderColor}`,
                      background: '#fff',
                      color: b.textMain,
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: isDeleting ? 'not-allowed' : 'pointer',
                      opacity: isDeleting ? 0.5 : 1,
                    }}
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
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: 'none',
                      background: '#ef4444',
                      color: '#fff',
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: isDeleting ? 'not-allowed' : 'pointer',
                      opacity: isDeleting ? 0.7 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
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

      {/* CSS for spin animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default RoleplaySessionReport;
