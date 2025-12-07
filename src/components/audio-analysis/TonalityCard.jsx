/**
 * TonalityCard Component
 *
 * Shows tonality rating with waveform visualization and clickable highlights
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Music2, CheckCircle2, AlertTriangle, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TONALITY_CONFIG, INTERACTIVE_STATES } from '@/config/constants';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge, TimestampBadge } from '@/components/ui/badge';

export function TonalityCard({ rating, highlights, feedback, onJumpToTimestamp }) {
  const config = TONALITY_CONFIG[rating] || TONALITY_CONFIG.natürlich;

  // Generate waveform bars with consistent heights (using seeded values)
  const waveformBars = useMemo(() => {
    const bars = [];
    const baseHeight = rating === 'monoton' ? 30 : rating === 'lebendig' ? 20 : 25;
    const variance = config.waveformVariance;

    for (let i = 0; i < 30; i++) {
      // Use deterministic "random" based on index to avoid re-renders
      const pseudoRandom = ((Math.sin(i * 12.9898) * 43758.5453) % 1);
      const height = baseHeight + Math.sin(i * 0.5) * variance + pseudoRandom * (variance / 2);
      bars.push(Math.max(10, Math.min(100, height)));
    }
    return bars;
  }, [rating, config.waveformVariance]);

  return (
    <Card>
      <CardHeader>
        <CardTitle icon={Music2} iconColor="text-ocean-teal-600">
          Betonung & Melodie
        </CardTitle>
        <Badge variant="default" className={cn(config.bg, config.color)}>
          {config.icon} {config.label}
        </Badge>
      </CardHeader>

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
          {highlights.map((h, idx) => {
            const stateStyle = h.type === 'positive' ? INTERACTIVE_STATES.positive : INTERACTIVE_STATES.negative;
            return (
              <button
                key={idx}
                onClick={() => onJumpToTimestamp?.(h.timestamp)}
                className={cn(
                  'w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left',
                  'interactive-scale',
                  stateStyle.all
                )}
              >
                <TimestampBadge variant={h.type === 'positive' ? 'positive' : 'negative'}>
                  {h.timestamp}
                </TimestampBadge>
                {h.type === 'positive' ? (
                  <CheckCircle2 className="icon-sm text-green-500 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="icon-sm text-red-500 flex-shrink-0" />
                )}
                <span className="text-xs text-slate-700 flex-1 truncate">{h.note}</span>
                <Play className="icon-xs text-slate-400" />
              </button>
            );
          })}
        </div>
      )}

      {feedback && <p className="text-body-muted">{feedback}</p>}
    </Card>
  );
}

export default TonalityCard;
