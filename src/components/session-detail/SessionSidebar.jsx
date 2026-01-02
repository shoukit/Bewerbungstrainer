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
        className="bg-white border-l border-slate-200 flex flex-col items-center py-4"
      >
        <Button variant="ghost" size="icon" onClick={onCollapse} className="mb-4">
          <ChevronRight className="w-4 h-4" />
        </Button>
        <div className="text-xs text-slate-500 font-medium" style={{ writingMode: 'vertical-rl' }}>
          Feedback Panel
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: '100%', opacity: 1 }}
      className="bg-white border-l border-slate-200 flex flex-col overflow-hidden"
      style={{ height: 'calc(100vh - 120px)', maxHeight: '800px' }}
    >
      {/* Header - Partner Theme Gradient */}
      <div className="bg-brand-gradient p-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span className="text-white font-semibold text-sm">Rollenspiel abgeschlossen</span>
          </div>
          <Button
            size="sm"
            onClick={onRetry}
            className="bg-white/20 hover:bg-white/30 text-white border-none text-xs"
          >
            Erneut üben
          </Button>
        </div>
        {score !== null && (
          <p className="text-white/80 text-xs m-0">
            Ihre Punktzahl war <span className="text-white font-bold">{score}%</span>
          </p>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 flex-shrink-0">
        {/* Collapse Button */}
        <button
          onClick={onCollapse}
          className="p-3 border-r border-slate-200 text-slate-500 bg-transparent border-none cursor-pointer transition-all hover:bg-slate-50 hover:text-slate-700"
          title="Panel einklappen"
        >
          <PanelRightClose className="w-4 h-4" />
        </button>

        {/* Coaching Tab */}
        <button
          onClick={() => setActiveTab('coaching')}
          className={cn(
            'flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 border-none cursor-pointer transition-all',
            activeTab === 'coaching'
              ? 'bg-primary/10 text-primary border-b-2 border-primary'
              : 'bg-transparent text-slate-500 border-b-2 border-transparent hover:bg-slate-50 hover:text-slate-900'
          )}
        >
          <MessageSquare className="w-4 h-4" />
          Coaching
        </button>

        {/* Analysen Tab */}
        <button
          onClick={() => setActiveTab('analysen')}
          className={cn(
            'flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 border-none cursor-pointer transition-all',
            activeTab === 'analysen'
              ? 'bg-primary/10 text-primary border-b-2 border-primary'
              : 'bg-transparent text-slate-500 border-b-2 border-transparent hover:bg-slate-50 hover:text-slate-900'
          )}
        >
          <BarChart3 className="w-4 h-4" />
          Analysen
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'coaching' && (
            <motion.div
              key="coaching"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="p-4"
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
              className="p-4"
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
