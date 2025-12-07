import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  RotateCcw,
  MessageSquare,
  BarChart3,
  Copy,
  Check,
  MoreVertical,
  ChevronDown,
  ChevronRight,
  PanelRightClose,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import StructuredFeedbackDisplay from './StructuredFeedbackDisplay';

/**
 * SessionSidebar Component
 *
 * A sidebar panel for the session detail view with:
 * - Header showing completion status and score
 * - Tabs for "Coaching" and "Analysen"
 * - Coaching tab: Shows coach comments/feedback
 * - Analysen tab: Shows StructuredFeedbackDisplay
 */

const SessionSidebar = ({
  session,
  scenario,
  feedback,
  coachingComments = [],
  onRetry,
  onCollapse,
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
    if (feedback?.overall_analysis?.total_score) {
      return feedback.overall_analysis.total_score;
    }
    return null;
  }, [feedback]);

  // Transform feedback to StructuredFeedbackDisplay format if needed
  const analysisData = useMemo(() => {
    if (!feedback) return null;

    // If already in correct format
    if (feedback.overall_analysis && feedback.categories) {
      return feedback;
    }

    // Transform from old format to new format
    const transformedData = {
      overall_analysis: {
        total_score: feedback.rating?.overall ? Math.round((feedback.rating.overall / 10) * 100) : 50,
        summary_text: feedback.summary || '',
        top_strength: feedback.strengths?.[0] || null,
        primary_weakness: feedback.improvements?.[0] || null,
      },
      categories: [],
    };

    // Create categories from available data
    if (feedback.rating) {
      const categoryItems = [];

      if (feedback.rating.communication !== undefined) {
        categoryItems.push({
          criterion: 'Kommunikation',
          rating: Math.round(feedback.rating.communication / 2),
          observation: 'Deine Kommunikationsfähigkeiten während des Gesprächs.',
          quote_evidence: null,
          improvement_suggestion: feedback.improvements?.find(i =>
            i.toLowerCase().includes('kommunikation') || i.toLowerCase().includes('sprache')
          ) || null,
        });
      }

      if (feedback.rating.professionalism !== undefined) {
        categoryItems.push({
          criterion: 'Professionalität',
          rating: Math.round(feedback.rating.professionalism / 2),
          observation: 'Dein professionelles Auftreten und Verhalten.',
          quote_evidence: null,
          improvement_suggestion: feedback.improvements?.find(i =>
            i.toLowerCase().includes('profession') || i.toLowerCase().includes('auftreten')
          ) || null,
        });
      }

      if (feedback.rating.motivation !== undefined) {
        categoryItems.push({
          criterion: 'Motivation',
          rating: Math.round(feedback.rating.motivation / 2),
          observation: 'Wie motiviert und engagiert du gewirkt hast.',
          quote_evidence: null,
          improvement_suggestion: null,
        });
      }

      if (categoryItems.length > 0) {
        transformedData.categories.push({
          id: 'gespraechsfuehrung',
          title: 'Gesprächsführung',
          score: feedback.rating.overall ? Math.round((feedback.rating.overall / 10) * 100) : 50,
          items: categoryItems,
        });
      }
    }

    // Add strengths as a category
    if (feedback.strengths?.length > 0) {
      transformedData.categories.push({
        id: 'staerken',
        title: 'Stärken',
        score: 85,
        items: feedback.strengths.slice(0, 3).map((strength, idx) => ({
          criterion: `Stärke ${idx + 1}`,
          rating: 5,
          observation: strength,
          quote_evidence: null,
          improvement_suggestion: null,
        })),
      });
    }

    // Add improvements as a category
    if (feedback.improvements?.length > 0) {
      transformedData.categories.push({
        id: 'verbesserungen',
        title: 'Verbesserungspotential',
        score: 40,
        items: feedback.improvements.slice(0, 3).map((improvement, idx) => ({
          criterion: `Bereich ${idx + 1}`,
          rating: 2,
          observation: improvement,
          quote_evidence: null,
          improvement_suggestion: feedback.tips?.[idx] || null,
        })),
      });
    }

    return transformedData;
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

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Format time
  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    });
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
        "bg-white border-l border-slate-200 flex flex-col h-full overflow-hidden",
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

        {/* Coaching Tab */}
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
          {coachingComments.length > 0 && (
            <span className={cn(
              "px-1.5 py-0.5 text-xs rounded-full",
              activeTab === 'coaching'
                ? "bg-blue-100 text-blue-700"
                : "bg-slate-100 text-slate-600"
            )}>
              {coachingComments.length}
            </span>
          )}
        </button>

        {/* Analysen Tab */}
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
              {/* Coaching Comments */}
              {coachingComments.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">
                    Noch keine Coaching-Kommentare vorhanden.
                  </p>
                  <p className="text-slate-400 text-xs mt-1">
                    Kommentare von Coaches erscheinen hier.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {coachingComments.map((comment, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm"
                    >
                      {/* Comment Header */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          {comment.author?.avatar ? (
                            <img
                              src={comment.author.avatar}
                              alt={comment.author.name}
                              className="w-10 h-10 rounded-full object-cover border-2 border-slate-200"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center">
                              <User className="w-5 h-5 text-white" />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-slate-800 text-sm">
                              {comment.author?.name || 'Coach'}
                            </p>
                            <p className="text-xs text-slate-400">
                              {formatDate(comment.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">
                            {formatTime(comment.created_at)}
                          </span>
                          <button className="text-slate-400 hover:text-slate-600">
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          <button className="text-slate-400 hover:text-slate-600">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Comment Body */}
                      <p className="text-sm text-slate-700 leading-relaxed">
                        {comment.text || comment.content}
                      </p>
                    </motion.div>
                  ))}
                </div>
              )}
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
              {/* Analysis Content */}
              <StructuredFeedbackDisplay
                analysisData={analysisData}
                isLoading={!feedback}
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
