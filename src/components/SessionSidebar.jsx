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
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import StructuredFeedbackDisplay from './StructuredFeedbackDisplay';
import AudioAnalysisDisplay from './AudioAnalysisDisplay';

// Ocean theme colors for inline styles
const COLORS = {
  blue: {
    50: '#E8F4F8',
    100: '#D1E9F1',
    600: '#3A7FA7',
    700: '#2D6485',
  },
  teal: {
    50: '#E6F7F4',
    600: '#2E8A72',
    700: '#247560',
  },
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
  },
  amber: { 300: '#fcd34d' },
};

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

  // Calculate score from feedback
  const score = useMemo(() => {
    if (feedback?.rating?.overall) {
      return Math.round((feedback.rating.overall / 10) * 100);
    }
    return null;
  }, [feedback]);

  if (isCollapsed) {
    return (
      <motion.div
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: 48, opacity: 1 }}
        style={{
          backgroundColor: 'white',
          borderLeft: `1px solid ${COLORS.slate[200]}`,
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
          color: COLORS.slate[500],
          fontWeight: 500,
        }}>
          Feedback Panel
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: '100%', opacity: 1 }}
      style={{
        backgroundColor: 'white',
        borderLeft: `1px solid ${COLORS.slate[200]}`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        height: 'calc(100vh - 120px)',
        maxHeight: '800px',
      }}
    >
      {/* Header - Ocean Theme Gradient with inline styles */}
      <div style={{
        background: `linear-gradient(90deg, ${COLORS.blue[700]} 0%, ${COLORS.teal[600]} 100%)`,
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
            <Trophy style={{ width: '20px', height: '20px', color: COLORS.amber[300] }} />
            <span style={{ color: 'white', fontWeight: 600, fontSize: '14px' }}>Rollenspiel abgeschlossen</span>
          </div>
          <Button
            size="sm"
            onClick={onRetry}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              color: 'white',
              border: 'none',
              fontSize: '12px',
            }}
          >
            Erneut üben
          </Button>
        </div>
        {score !== null && (
          <p style={{ color: COLORS.blue[100], fontSize: '12px', margin: 0 }}>
            Ihre Punktzahl war <span style={{ color: 'white', fontWeight: 700 }}>{score}%</span>
          </p>
        )}
      </div>

      {/* Tab Navigation - Ocean Theme with inline styles */}
      <div style={{
        display: 'flex',
        borderBottom: `1px solid ${COLORS.slate[200]}`,
        flexShrink: 0,
      }}>
        {/* Collapse Button */}
        <button
          onClick={onCollapse}
          style={{
            padding: '12px',
            borderRight: `1px solid ${COLORS.slate[200]}`,
            color: COLORS.slate[400],
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.slate[50];
            e.currentTarget.style.color = COLORS.slate[600];
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = COLORS.slate[400];
          }}
          title="Panel einklappen"
        >
          <PanelRightClose style={{ width: '16px', height: '16px' }} />
        </button>

        {/* Coaching Tab */}
        <button
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
            backgroundColor: activeTab === 'coaching' ? COLORS.blue[50] : (hoveredTab === 'coaching' ? COLORS.slate[50] : 'transparent'),
            color: activeTab === 'coaching' ? COLORS.blue[700] : (hoveredTab === 'coaching' ? COLORS.slate[700] : COLORS.slate[500]),
            borderBottom: activeTab === 'coaching' ? `2px solid ${COLORS.blue[600]}` : '2px solid transparent',
          }}
        >
          <MessageSquare style={{ width: '16px', height: '16px' }} />
          Coaching
        </button>

        {/* Analysen Tab */}
        <button
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
            backgroundColor: activeTab === 'analysen' ? COLORS.teal[50] : (hoveredTab === 'analysen' ? COLORS.slate[50] : 'transparent'),
            color: activeTab === 'analysen' ? COLORS.teal[700] : (hoveredTab === 'analysen' ? COLORS.slate[700] : COLORS.slate[500]),
            borderBottom: activeTab === 'analysen' ? `2px solid ${COLORS.teal[600]}` : '2px solid transparent',
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
  );
};

export default SessionSidebar;
