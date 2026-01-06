import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Bot, User } from 'lucide-react';
import { formatDuration } from '@/utils/formatting';

/**
 * Chat-style Transcript View for Session Reports
 * Displays conversation between agent and user with clickable timestamps
 */
const ReportTranscriptView = ({ transcript, scenario, primaryAccent, branding, onSeekToTime }) => {
  if (!transcript || transcript.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center">
        <MessageSquare size={32} className="text-slate-400 mb-3 mx-auto" />
        <p className="text-slate-500 text-sm">Kein Transkript verfügbar</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare size={18} className="text-primary" />
        <span className="text-sm font-semibold text-slate-900">
          Gesprächsverlauf
        </span>
      </div>

      <div className="max-h-[500px] overflow-y-auto pr-2">
        {transcript.map((entry, idx) => {
          const isAgent = entry.role === 'agent';
          const timeLabel = entry.timeLabel || (entry.elapsedTime !== undefined ? formatDuration(entry.elapsedTime) : null);

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className={`flex gap-2.5 mb-3 ${isAgent ? 'flex-row' : 'flex-row-reverse'}`}
            >
              {/* Avatar */}
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                {isAgent ? (
                  scenario?.interviewer_profile?.image_url ? (
                    <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-primary/20">
                      <img
                        src={scenario.interviewer_profile.image_url}
                        alt={scenario.interviewer_profile.name || 'Interviewer'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-brand-gradient flex items-center justify-center">
                      <Bot size={16} className="text-white" />
                    </div>
                  )
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                    <User size={16} className="text-white" />
                  </div>
                )}
                {!isAgent && timeLabel && (
                  <button
                    onClick={() => onSeekToTime?.(entry.elapsedTime)}
                    className="text-[10px] font-mono text-primary bg-transparent border-none cursor-pointer p-0"
                  >
                    {timeLabel}
                  </button>
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] px-3.5 py-2.5 text-[13px] leading-relaxed border ${
                  isAgent
                    ? 'rounded-[4px_16px_16px_16px] bg-slate-50 text-slate-900 border-slate-200'
                    : 'rounded-[16px_4px_16px_16px] bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-transparent'
                }`}
              >
                {entry.text}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ReportTranscriptView;
