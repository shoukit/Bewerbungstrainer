/**
 * FillerWordCard Component
 *
 * Interactive list of filler words with expandable timestamps
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, ChevronRight, CheckCircle2, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SCORE_THRESHOLDS, FILLER_WORD_THRESHOLDS, INTERACTIVE_STATES } from '@/config/constants';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FeedbackTip } from '@/components/ui/feedback-tip';

/**
 * Get color class for filler word count
 */
function getCountColor(count) {
  if (count <= FILLER_WORD_THRESHOLDS.GOOD) return 'text-green-500';
  if (count <= FILLER_WORD_THRESHOLDS.MODERATE) return 'text-amber-500';
  return 'text-red-500';
}

/**
 * Get color class for score
 */
function getScoreColor(score) {
  if (score >= SCORE_THRESHOLDS.EXCELLENT) return 'text-green-600';
  if (score >= SCORE_THRESHOLDS.GOOD) return 'text-blue-600';
  if (score >= SCORE_THRESHOLDS.FAIR) return 'text-amber-600';
  return 'text-red-600';
}

export function FillerWordCard({ fillerWordAnalysis, score, feedback, onJumpToTimestamp }) {
  const [expandedWord, setExpandedWord] = useState(null);

  // Calculate total count
  const totalCount = fillerWordAnalysis?.reduce((sum, item) => sum + (item.count || 0), 0) || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle icon={MessageSquare} iconColor="text-orange-500">
          Füllwörter
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="default">{totalCount}x gesamt</Badge>
          {score !== undefined && (
            <span className={cn('text-sm font-bold', getScoreColor(score))}>{score}/100</span>
          )}
        </div>
      </CardHeader>

      {/* Filler word list */}
      {fillerWordAnalysis && fillerWordAnalysis.length > 0 ? (
        <div className="space-y-2">
          {fillerWordAnalysis.map((item, idx) => (
            <div key={idx} className="border border-slate-100 rounded-lg overflow-hidden">
              {/* Word header - clickable to expand */}
              <button
                onClick={() => setExpandedWord(expandedWord === idx ? null : idx)}
                className="w-full flex items-center justify-between px-3 py-2 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: expandedWord === idx ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronRight className="icon-sm text-slate-400" />
                  </motion.div>
                  <span className="font-medium text-slate-700 text-sm">"{item.word}"</span>
                </div>
                <span className={cn('text-sm font-bold', getCountColor(item.count))}>
                  {item.count}x
                </span>
              </button>

              {/* Expanded: Show timestamps */}
              <AnimatePresence>
                {expandedWord === idx && item.examples && item.examples.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 pb-3 pt-1 bg-slate-50 border-t border-slate-100">
                      <p className="text-label mb-2">Klicke zum Anhören:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {item.examples.map((example, exIdx) => (
                          <button
                            key={exIdx}
                            onClick={(e) => {
                              e.stopPropagation();
                              onJumpToTimestamp?.(example.timestamp);
                            }}
                            className={cn(
                              'inline-flex items-center gap-1.5 px-2 py-1 rounded-md transition-all group',
                              INTERACTIVE_STATES.neutral.all
                            )}
                          >
                            <span className="font-mono text-xs text-blue-600 group-hover:text-blue-700">
                              {example.timestamp}
                            </span>
                            {example.context && (
                              <span className="text-[10px] text-slate-400 group-hover:text-slate-500">
                                ({example.context})
                              </span>
                            )}
                            <Play className="icon-xs text-blue-400 group-hover:text-blue-600" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-2 text-green-600 py-2">
          <CheckCircle2 className="icon-sm" />
          <span className="text-sm">Keine Füllwörter erkannt!</span>
        </div>
      )}

      {/* Tip */}
      {feedback && <FeedbackTip>{feedback}</FeedbackTip>}
    </Card>
  );
}

export default FillerWordCard;
