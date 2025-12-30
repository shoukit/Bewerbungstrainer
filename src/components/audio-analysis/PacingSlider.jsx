/**
 * PacingSlider Component
 *
 * Visual slider showing speaking pace (zu_langsam, optimal, zu_schnell)
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PACING_CONFIG } from '@/config/constants';
import { Card, CardHeader, CardTitle } from '@/components/ui/base/card';
import { Badge } from '@/components/ui/base/badge';

export function PacingSlider({ rating, wpm, feedback }) {
  const config = PACING_CONFIG[rating] || PACING_CONFIG.optimal;
  const { position, isOptimal } = config;

  return (
    <Card>
      <CardHeader>
        <CardTitle icon={Timer} iconColor="text-blue-500">
          Sprechtempo
        </CardTitle>
        {wpm && (
          <Badge variant="default" className="font-mono">
            {wpm}
          </Badge>
        )}
      </CardHeader>

      {/* Slider track */}
      <div className="relative h-8 mb-3">
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-2 rounded-full bg-gradient-to-r from-blue-200 via-green-300 to-red-200" />

        {/* Optimal zone indicator */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-4 bg-green-400/30 rounded-full border border-green-400" />

        {/* Labels */}
        <div className="absolute inset-x-0 -bottom-1 flex justify-between px-2">
          <span className="text-[10px] text-slate-400">Langsam</span>
          <span className="text-[10px] text-green-600 font-medium">Optimal</span>
          <span className="text-[10px] text-slate-400">Schnell</span>
        </div>

        {/* Marker */}
        <motion.div
          initial={{ left: '50%' }}
          animate={{ left: `${position}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={cn(
            'absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full shadow-lg border-2 border-white',
            isOptimal ? 'bg-green-500' : 'bg-amber-500'
          )}
        />
      </div>

      {feedback && <p className="text-body-muted mt-4">{feedback}</p>}
    </Card>
  );
}

export default PacingSlider;
