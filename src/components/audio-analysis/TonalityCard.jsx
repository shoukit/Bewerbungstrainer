/**
 * TonalityCard Component
 *
 * Shows tonality rating with waveform visualization and clickable highlights
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Music2, CheckCircle2, AlertTriangle, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TONALITY_CONFIG } from '@/config/constants';

export function TonalityCard({ rating, highlights, feedback, onJumpToTimestamp }) {
  const config = TONALITY_CONFIG[rating] || TONALITY_CONFIG.natürlich;

  // Generate waveform bars with consistent heights (using seeded values)
  const waveformBars = useMemo(() => {
    const bars = [];
    const baseHeight = rating === 'monoton' ? 30 : rating === 'lebendig' ? 20 : 25;
    const variance = config.waveformVariance;

    for (let i = 0; i < 30; i++) {
      // Use deterministic "random" based on index to avoid re-renders
      const pseudoRandom = Math.sin(i * 12.9898) * 43758.5453 % 1;
      const height = baseHeight + Math.sin(i * 0.5) * variance + pseudoRandom * (variance / 2);
      bars.push(Math.max(10, Math.min(100, height)));
    }
    return bars;
  }, [rating, config.waveformVariance]);

  return (
    <div className="p-4 bg-white border border-slate-200 rounded-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Music2 className="w-4 h-4 text-purple-500" />
          <span className="font-semibold text-slate-800 text-sm">Betonung & Melodie</span>
        </div>
        <span className={cn('text-xs font-medium px-2 py-1 rounded-full', config.bg, config.color)}>
          {config.icon} {config.label}
        </span>
      </div>

      {/* Waveform visualization */}
      <div className="flex items-center justify-center gap-0.5 h-12 mb-3">
        {waveformBars.map((height, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: `${height}%` }}
            transition={{ duration: 0.5, delay: i * 0.02 }}
            className={cn('w-1 rounded-full', config.bg.replace('50', '400'))}
          />
        ))}
      </div>

      {/* Highlights - clickable timestamps */}
      {highlights && highlights.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {highlights.map((h, idx) => (
            <button
              key={idx}
              onClick={() => onJumpToTimestamp?.(h.timestamp)}
              className={cn(
                'w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all',
                'hover:scale-[1.02] active:scale-[0.98]',
                h.type === 'positive'
                  ? 'bg-green-50 hover:bg-green-100 border border-green-200'
                  : 'bg-red-50 hover:bg-red-100 border border-red-200'
              )}
            >
              <span
                className={cn(
                  'font-mono text-xs px-1.5 py-0.5 rounded',
                  h.type === 'positive' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                )}
              >
                {h.timestamp}
              </span>
              {h.type === 'positive' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
              )}
              <span className="text-xs text-slate-700 flex-1 truncate">{h.note}</span>
              <Play className="w-3 h-3 text-slate-400" />
            </button>
          ))}
        </div>
      )}

      {feedback && (
        <p className="text-xs text-slate-600 leading-relaxed">{feedback}</p>
      )}
    </div>
  );
}

export default TonalityCard;
