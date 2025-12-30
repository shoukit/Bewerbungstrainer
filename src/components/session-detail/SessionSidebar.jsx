/**
 * SessionSidebar Component
 *
 * A sidebar panel for the session detail view with:
 * - Header showing completion status and score
 * - Tabs for "Coaching" and "Analysen"
 * - Coaching tab: Shows Gemini feedback (feedback_json) - content analysis
 * - Analysen tab: Shows audio analysis (audio_analysis_json) - speech metrics
 *
 * Uses inline styles to avoid WordPress/Elementor CSS conflicts.
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  MessageSquare,
  BarChart3,
  ChevronRight,
  PanelRightClose,
} from 'lucide-react';
import { Button } from '@/components/ui/base/button';
import { cn } from '@/lib/utils';
import StructuredFeedbackDisplay from './StructuredFeedbackDisplay';
import AudioAnalysisDisplay from './AudioAnalysisDisplay';
import { useBranding } from '@/hooks/useBranding';

const SessionSidebar = ({
  session,
  scenario,
  feedback,
  audioAnalysis,
  coachingComments = [],
  onRetry,
  onCollapse,
  onJumpToTimestamp,
  isCollapsed = false,
  className,
}) => {
  const [activeTab, setActiveTab] = useState('coaching');
  const [hoveredTab, setHoveredTab] = useState(null);

  // Partner theming via useBranding hook
  const b = useBranding();

  // Calculate score from feedback
  const score = useMemo(() => {
    if (feedback?.rating?.overall) {
      return Math.round((feedback.rating.overall / 10) * 100);
    }
    return null;
  }, [feedback]);

  // Generate unique ID for scoped styles
  const styleId = useMemo(() => `session-sidebar-${Math.random().toString(36).substr(2, 9)}`, []);

  // Dynamic CSS to override Elementor's !important rules
  // Use highest possible specificity with #bewerbungstrainer-app prefix
  const dynamicStyles = useMemo(() => `
    /* Override ALL Elementor/WordPress button styles for this sidebar's tabs */
    #bewerbungstrainer-app [data-sidebar-id="${styleId}"] button[data-tab-button="true"],
    #bewerbungstrainer-app [data-sidebar-id="${styleId}"] button[data-tab-button="true"]:link,
    #bewerbungstrainer-app [data-sidebar-id="${styleId}"] button[data-tab-button="true"]:visited,
    #bewerbungstrainer-app [data-sidebar-id="${styleId}"] button[data-tab-button="true"]:hover,
    #bewerbungstrainer-app [data-sidebar-id="${styleId}"] button[data-tab-button="true"]:focus,
    #bewerbungstrainer-app [data-sidebar-id="${styleId}"] button[data-tab-button="true"]:active {
      background-color: transparent !important;
      background-image: none !important;
      color: ${b.textMuted} !important;
      border: none !important;
      border-bottom: 2px solid transparent !important;
      border-color: transparent !important;
      outline: none !important;
      box-shadow: none !important;
      text-decoration: none !important;
    }
    #bewerbungstrainer-app [data-sidebar-id="${styleId}"] button[data-tab-button="true"]:hover,
    #bewerbungstrainer-app [data-sidebar-id="${styleId}"] button[data-tab-button="true"]:focus {
      background-color: ${b.cardBgHover} !important;
      color: ${b.textSecondary} !important;
      border-bottom: 2px solid transparent !important;
    }
    #bewerbungstrainer-app [data-sidebar-id="${styleId}"] button[data-tab-button="true"][data-active="true"],
    #bewerbungstrainer-app [data-sidebar-id="${styleId}"] button[data-tab-button="true"][data-active="true"]:link,
    #bewerbungstrainer-app [data-sidebar-id="${styleId}"] button[data-tab-button="true"][data-active="true"]:visited,
    #bewerbungstrainer-app [data-sidebar-id="${styleId}"] button[data-tab-button="true"][data-active="true"]:hover,
    #bewerbungstrainer-app [data-sidebar-id="${styleId}"] button[data-tab-button="true"][data-active="true"]:focus,
    #bewerbungstrainer-app [data-sidebar-id="${styleId}"] button[data-tab-button="true"][data-active="true"]:active {
      background-color: ${b.primaryAccentLight} !important;
      color: ${b.primaryAccent} !important;
      border: none !important;
      border-bottom: 2px solid ${b.primaryAccent} !important;
    }
    /* Also override icon colors inside buttons */
    #bewerbungstrainer-app [data-sidebar-id="${styleId}"] button[data-tab-button="true"] svg,
    #bewerbungstrainer-app [data-sidebar-id="${styleId}"] button[data-tab-button="true"]:hover svg {
      color: inherit !important;
      fill: currentColor !important;
    }
  `, [styleId, b]);

  if (isCollapsed) {
    return (
      <motion.div
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: 48, opacity: 1 }}
        style={{
          backgroundColor: b.cardBgColor,
          borderLeft: `1px solid ${b.borderColor}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '16px 0',
        }}
      >
        <Button variant="ghost" size="icon" onClick={onCollapse} style={{ marginBottom: '16px' }}>
          <ChevronRight style={{ width: '16px', height: '16px' }} />
        </Button>
        <div style={{
          writingMode: 'vertical-rl',
          fontSize: '12px',
          color: b.textMuted,
          fontWeight: 500,
        }}>
          Feedback Panel
        </div>
      </motion.div>
    );
  }

  return (
    <>
      {/* Dynamic styles to override Elementor's !important rules */}
      <style>{dynamicStyles}</style>
      <motion.div
        data-sidebar-id={styleId}
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: '100%', opacity: 1 }}
        style={{
          backgroundColor: b.cardBgColor,
          borderLeft: `1px solid ${b.borderColor}`,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          height: 'calc(100vh - 120px)',
          maxHeight: '800px',
        }}
      >
      {/* Header - Partner Theme Gradient with inline styles */}
      <div style={{
        background: b.headerGradient,
        padding: '16px',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trophy style={{ width: '20px', height: '20px', color: b.warning }} />
            <span style={{ color: b.headerText, fontWeight: 600, fontSize: '14px' }}>Rollenspiel abgeschlossen</span>
          </div>
          <Button
            size="sm"
            onClick={onRetry}
            style={{
              backgroundColor: b.overlayLight,
              color: b.headerText,
              border: 'none',
              fontSize: '12px',
            }}
          >
            Erneut üben
          </Button>
        </div>
        {score !== null && (
          <p style={{ color: `${b.headerText}CC`, fontSize: '12px', margin: 0 }}>
            Ihre Punktzahl war <span style={{ color: b.headerText, fontWeight: 700 }}>{score}%</span>
          </p>
        )}
      </div>

      {/* Tab Navigation - Ocean Theme with inline styles */}
      <div style={{
        display: 'flex',
        borderBottom: `1px solid ${b.borderColor}`,
        flexShrink: 0,
      }}>
        {/* Collapse Button */}
        <button
          onClick={onCollapse}
          style={{
            padding: '12px',
            borderRight: `1px solid ${b.borderColor}`,
            color: b.textMuted,
            backgroundColor: b.transparent,
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = b.cardBgHover;
            e.currentTarget.style.color = b.textSecondary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = b.transparent;
            e.currentTarget.style.color = b.textMuted;
          }}
          title="Panel einklappen"
        >
          <PanelRightClose style={{ width: '16px', height: '16px' }} />
        </button>

        {/* Coaching Tab */}
        <button
          data-tab-button="true"
          data-active={activeTab === 'coaching' ? 'true' : undefined}
          onClick={() => setActiveTab('coaching')}
          onMouseEnter={() => setHoveredTab('coaching')}
          onMouseLeave={() => setHoveredTab(null)}
          style={{
            flex: 1,
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s',
            backgroundColor: activeTab === 'coaching' ? b.primaryAccentLight : (hoveredTab === 'coaching' ? b.cardBgHover : b.transparent),
            color: activeTab === 'coaching' ? b.primaryAccent : (hoveredTab === 'coaching' ? b.textMain : b.textMuted),
            borderBottom: activeTab === 'coaching' ? `2px solid ${b.primaryAccent}` : '2px solid transparent',
          }}
        >
          <MessageSquare style={{ width: '16px', height: '16px' }} />
          Coaching
        </button>

        {/* Analysen Tab */}
        <button
          data-tab-button="true"
          data-active={activeTab === 'analysen' ? 'true' : undefined}
          onClick={() => setActiveTab('analysen')}
          onMouseEnter={() => setHoveredTab('analysen')}
          onMouseLeave={() => setHoveredTab(null)}
          style={{
            flex: 1,
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s',
            backgroundColor: activeTab === 'analysen' ? b.primaryAccentLight : (hoveredTab === 'analysen' ? b.cardBgHover : b.transparent),
            color: activeTab === 'analysen' ? b.primaryAccent : (hoveredTab === 'analysen' ? b.textMain : b.textMuted),
            borderBottom: activeTab === 'analysen' ? `2px solid ${b.primaryAccent}` : '2px solid transparent',
          }}
        >
          <BarChart3 style={{ width: '16px', height: '16px' }} />
          Analysen
        </button>
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <AnimatePresence mode="wait">
          {activeTab === 'coaching' && (
            <motion.div
              key="coaching"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              style={{ padding: '16px' }}
            >
              <StructuredFeedbackDisplay feedback={feedback} isLoading={false} />
            </motion.div>
          )}

          {activeTab === 'analysen' && (
            <motion.div
              key="analysen"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              style={{ padding: '16px' }}
            >
              <AudioAnalysisDisplay
                audioAnalysis={audioAnalysis}
                isLoading={false}
                onJumpToTimestamp={onJumpToTimestamp}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </motion.div>
    </>
  );
};

export default SessionSidebar;
