/**
 * TranscriptCard Component
 *
 * Displays conversation transcript with synchronized highlighting and clickable entries.
 */

import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, User, Bot } from 'lucide-react';
import { TRANSCRIPT_CONFIG } from '@/config/constants';

/**
 * Format elapsed time to MM:SS
 */
function formatTimeLabel(elapsedTime) {
  if (elapsedTime === undefined) return null;
  const mins = Math.floor(elapsedTime / 60);
  const secs = Math.floor(elapsedTime % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function TranscriptCard({
  transcript = [],
  activeIndex = -1,
  isPlaying = false,
  scenario,
  onSeekToEntry,
}) {
  const containerRef = useRef(null);

  // Auto-scroll to active entry during playback
  useEffect(() => {
    if (!isPlaying || activeIndex < 0 || !containerRef.current) return;

    const container = containerRef.current;
    const activeElement = container.children[activeIndex];

    if (activeElement) {
      const containerRect = container.getBoundingClientRect();
      const elementRect = activeElement.getBoundingClientRect();

      // Only scroll if element is outside visible area
      if (elementRect.top < containerRect.top || elementRect.bottom > containerRect.bottom) {
        const scrollTop =
          activeElement.offsetTop -
          container.offsetTop -
          container.clientHeight / 2 +
          activeElement.clientHeight / 2;
        container.scrollTo({
          top: Math.max(0, scrollTop),
          behavior: 'smooth',
        });
      }
    }
  }, [activeIndex, isPlaying]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white rounded-2xl shadow-lg p-6"
    >
      <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-blue-600" />
        Gesprächsverlauf
      </h2>

      {transcript.length === 0 ? (
        <p className="text-slate-500 text-center py-8">Kein Transkript verfügbar.</p>
      ) : (
        <div
          ref={containerRef}
          className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scroll-smooth"
        >
          {transcript.map((entry, idx) => {
            const isActive = idx === activeIndex;
            const isAgent = entry.role === 'agent';
            const timeDisplay = entry.timeLabel || formatTimeLabel(entry.elapsedTime);

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0.8 }}
                animate={{ opacity: isActive ? 1 : 0.8 }}
                onClick={() => onSeekToEntry?.(idx)}
                className={`flex gap-2 cursor-pointer transition-all ${
                  entry.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                } ${isActive ? 'scale-[1.01]' : 'hover:scale-[1.005]'}`}
              >
                {/* Avatar with Timestamp */}
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  {isAgent ? (
                    scenario?.interviewer_profile?.image_url ? (
                      <img
                        src={scenario.interviewer_profile.image_url}
                        alt={scenario.interviewer_profile.name || 'Interviewer'}
                        className="w-8 h-8 rounded-full object-cover shadow-sm border-2 border-blue-200"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm bg-gradient-to-br from-blue-500 to-blue-600">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    )
                  ) : (
                    <>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm bg-gradient-to-br from-teal-500 to-teal-600">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      {timeDisplay && (
                        <span className="text-[10px] font-mono text-slate-400">
                          {timeDisplay}
                        </span>
                      )}
                    </>
                  )}
                </div>

                {/* Message Bubble */}
                <div
                  className={`flex-1 px-3 py-2 rounded-xl shadow-sm transition-all ${
                    isAgent
                      ? 'bg-slate-50 border border-slate-200'
                      : 'bg-gradient-to-br from-teal-500 to-teal-600 text-white'
                  } ${isActive ? 'ring-2 ring-blue-400 ring-offset-1' : ''}`}
                >
                  <p
                    className={`text-xs leading-relaxed ${
                      isAgent ? 'text-slate-700' : 'text-white'
                    }`}
                  >
                    {entry.text}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

export default TranscriptCard;
