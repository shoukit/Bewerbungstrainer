import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  RotateCcw,
  MessageSquare,
  BarChart3,
  Copy,
  Check,
  ChevronRight,
  PanelRightClose,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import StructuredFeedbackDisplay from './StructuredFeedbackDisplay';
import AudioAnalysisDisplay from './AudioAnalysisDisplay';

/**
 * SessionSidebar Component
 *
 * A sidebar panel for the session detail view with:
 * - Header showing completion status and score
 * - Tabs for "Coaching" and "Analysen"
 * - Coaching tab: Shows Gemini feedback (feedback_json) - content analysis
 * - Analysen tab: Shows audio analysis (audio_analysis_json) - speech metrics
 */

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
  const [copiedFeedback, setCopiedFeedback] = useState(false);

  // Calculate score from feedback
  const score = useMemo(() => {
    if (feedback?.rating?.overall) {
      return Math.round((feedback.rating.overall / 10) * 100);
    }
    return null;
  }, [feedback]);

  // Copy feedback to clipboard
  const handleCopyFeedback = async () => {
    if (!feedback) return;

    try {
      const text = JSON.stringify(feedback, null, 2);
      await navigator.clipboard.writeText(text);
      setCopiedFeedback(true);
      setTimeout(() => setCopiedFeedback(false), 2000);
    } catch (err) {
      console.error('Failed to copy feedback:', err);
    }
  };

  if (isCollapsed) {
    return (
      <motion.div
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: 48, opacity: 1 }}
        className="bg-white border-l border-slate-200 flex flex-col items-center py-4"
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={onCollapse}
          className="mb-4"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
        <div className="writing-mode-vertical text-xs text-slate-500 font-medium">
          Feedback Panel
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: '100%', opacity: 1 }}
      className={cn(
        "bg-white border-l border-slate-200 flex flex-col overflow-hidden",
        "h-[calc(100vh-120px)] max-h-[800px]", // Fixed height like Yoodli
        className
      )}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span className="text-white font-semibold text-sm">
              Rollenspiel abgeschlossen
            </span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={onRetry}
            className="bg-white/10 hover:bg-white/20 text-white border-0 text-xs"
          >
            Erneut üben
          </Button>
        </div>
        {score !== null && (
          <p className="text-slate-300 text-xs">
            Ihre Punktzahl war <span className="text-white font-bold">{score}%</span>
          </p>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 flex-shrink-0">
        {/* Collapse Button */}
        <button
          onClick={onCollapse}
          className="px-3 py-3 border-r border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
          title="Panel einklappen"
        >
          <PanelRightClose className="w-4 h-4" />
        </button>

        {/* Coaching Tab - Shows Gemini content feedback */}
        <button
          onClick={() => setActiveTab('coaching')}
          className={cn(
            "flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2",
            activeTab === 'coaching'
              ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50"
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
          )}
        >
          <MessageSquare className="w-4 h-4" />
          Coaching
        </button>

        {/* Analysen Tab - Shows audio analysis */}
        <button
          onClick={() => setActiveTab('analysen')}
          className={cn(
            "flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2",
            activeTab === 'analysen'
              ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50"
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
          )}
        >
          <BarChart3 className="w-4 h-4" />
          Analysen
        </button>
      </div>

      {/* Copy Feedback Button */}
      <div className="px-4 py-2 border-b border-slate-100 flex-shrink-0">
        <button
          onClick={handleCopyFeedback}
          className="flex items-center gap-2 text-xs text-slate-500 hover:text-blue-600 transition-colors ml-auto"
        >
          {copiedFeedback ? (
            <>
              <Check className="w-3.5 h-3.5 text-green-500" />
              <span className="text-green-600">Kopiert!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Feedback kopieren</span>
            </>
          )}
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
              {/* Coaching Content - Shows Gemini feedback_json */}
              <StructuredFeedbackDisplay
                feedback={feedback}
                isLoading={false}
              />
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
              {/* Audio Analysis Content - Shows audio_analysis_json */}
              <AudioAnalysisDisplay
                audioAnalysis={audioAnalysis}
                isLoading={false}
                onJumpToTimestamp={onJumpToTimestamp}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex-shrink-0">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Nochmal üben
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default SessionSidebar;
