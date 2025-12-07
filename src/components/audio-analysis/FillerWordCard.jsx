/**
 * FillerWordCard Component
 *
 * Interactive list of filler words with expandable timestamps
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, ChevronRight, CheckCircle2, Lightbulb, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SCORE_THRESHOLDS, FILLER_WORD_THRESHOLDS } from '@/config/constants';

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
    <div className="p-4 bg-white border border-slate-200 rounded-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-orange-500" />
          <span className="font-semibold text-slate-800 text-sm">Füllwörter</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">
            {totalCount}x gesamt
          </span>
          {score !== undefined && (
            <span className={cn('text-sm font-bold', getScoreColor(score))}>
              {score}/100
            </span>
          )}
        </div>
      </div>

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
                    <ChevronRight className="w-4 h-4 text-slate-400" />
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
                      <p className="text-xs text-slate-500 mb-2">Klicke zum Anhören:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {item.examples.map((example, exIdx) => (
                          <button
                            key={exIdx}
                            onClick={(e) => {
                              e.stopPropagation();
                              onJumpToTimestamp?.(example.timestamp);
                            }}
                            className="inline-flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-200 rounded-md hover:bg-blue-50 hover:border-blue-300 transition-all group"
                          >
                            <span className="font-mono text-xs text-blue-600 group-hover:text-blue-700">
                              {example.timestamp}
                            </span>
                            {example.context && (
                              <span className="text-[10px] text-slate-400 group-hover:text-slate-500">
                                ({example.context})
                              </span>
                            )}
                            <Play className="w-3 h-3 text-blue-400 group-hover:text-blue-600" />
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
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-sm">Keine Füllwörter erkannt!</span>
        </div>
      )}

      {/* Tip */}
      {feedback && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-800 leading-relaxed">{feedback}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default FillerWordCard;
