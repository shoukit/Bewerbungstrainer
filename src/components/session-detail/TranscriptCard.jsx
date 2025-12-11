/**
 * TranscriptCard Component
 *
 * Displays conversation transcript with synchronized highlighting and clickable entries.
 */

import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, User, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TRANSCRIPT_CONFIG, SPEAKER_STYLES } from '@/config/constants';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { usePartner } from '@/context/PartnerContext';
import { DEFAULT_BRANDING } from '@/config/partners';

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
  const { branding } = usePartner();
  const primaryAccent = branding?.['--primary-accent'] || DEFAULT_BRANDING['--primary-accent'];

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
    >
      <Card variant="elevated" padding="lg">
        <CardHeader className="mb-4">
          <CardTitle icon={MessageSquare} iconColor="text-slate-800" size="default">
            Gesprächsverlauf
          </CardTitle>
        </CardHeader>

        {transcript.length === 0 ? (
          <p className="text-slate-500 text-center py-8">Kein Transkript verfügbar.</p>
        ) : (
          <div
            ref={containerRef}
            className="space-y-3 overflow-y-auto pr-2 scroll-smooth pt-1"
            style={{ maxHeight: 'calc(100vh - 400px)', minHeight: '200px' }}
          >
            {transcript.map((entry, idx) => {
              const isActive = idx === activeIndex;
              const isAgent = entry.role === 'agent';
              const timeDisplay = entry.timeLabel || formatTimeLabel(entry.elapsedTime);
              const speakerStyle = SPEAKER_STYLES[entry.role] || SPEAKER_STYLES.user;

              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0.8 }}
                  animate={{ opacity: isActive ? 1 : 0.8 }}
                  onClick={() => onSeekToEntry?.(idx)}
                  className={cn(
                    'flex gap-2 cursor-pointer transition-all',
                    entry.role === 'user' ? 'flex-row-reverse' : 'flex-row',
                    isActive ? 'scale-[1.01]' : 'hover:scale-[1.005]'
                  )}
                >
                  {/* Avatar with Timestamp */}
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    {isAgent ? (
                      scenario?.interviewer_profile?.image_url ? (
                        <img
                          src={scenario.interviewer_profile.image_url}
                          alt={scenario.interviewer_profile.name || SPEAKER_STYLES.agent.label}
                          className="w-8 h-8 rounded-full object-cover shadow-sm border-2 border-blue-200"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm bg-gradient-to-br from-blue-500 to-blue-600">
                          <Bot className="icon-sm text-white" />
                        </div>
                      )
                    ) : (
                      <>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm bg-gradient-to-br from-teal-500 to-teal-600">
                          <User className="icon-sm text-white" />
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
                    className={cn(
                      'flex-1 px-3 py-2 rounded-xl shadow-sm transition-all',
                      isAgent
                        ? 'bg-slate-50 border'
                        : 'bg-gradient-to-br from-teal-500 to-teal-600 text-white',
                      isActive && 'ring-2 ring-offset-1'
                    )}
                    style={{
                      ...(isAgent && { borderColor: `${primaryAccent}40` }),
                      ...(isActive && { '--tw-ring-color': primaryAccent }),
                    }}
                  >
                    <p
                      className={cn(
                        'text-xs leading-relaxed',
                        isAgent ? 'text-slate-700' : 'text-white'
                      )}
                    >
                      {entry.text}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </Card>
    </motion.div>
  );
}

export default TranscriptCard;
