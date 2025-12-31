/**
 * ConfidenceGauge Component
 *
 * Semicircle tachometer showing confidence score (0-100)
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Gauge } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SCORE_THRESHOLDS } from '@/config/constants';
import { COLORS } from '@/config/colors';

/**
 * Get color scheme based on confidence score
 */
function getConfidenceColorScheme(score) {
  if (score >= SCORE_THRESHOLDS.EXCELLENT) {
    return {
      stroke: COLORS.green[500],
      bg: 'from-green-50 to-green-100',
      text: 'text-green-600',
      label: 'Sehr selbstsicher',
    };
  }
  if (score >= SCORE_THRESHOLDS.GOOD) {
    return {
      stroke: COLORS.blue[500],
      bg: 'from-blue-50 to-blue-100',
      text: 'text-blue-600',
      label: 'Selbstsicher',
    };
  }
  if (score >= SCORE_THRESHOLDS.FAIR) {
    return {
      stroke: COLORS.amber[500],
      bg: 'from-amber-50 to-amber-100',
      text: 'text-amber-600',
      label: 'Ausbaufähig',
    };
  }
  return {
    stroke: COLORS.red[500],
    bg: 'from-red-50 to-red-100',
    text: 'text-red-600',
    label: 'Unsicher',
  };
}

export function ConfidenceGauge({ score, size = 160 }) {
  const radius = size / 2 - 15;
  const circumference = Math.PI * radius;
  const percentage = Math.max(0, Math.min(100, score));
  const offset = circumference - (percentage / 100) * circumference;
  const colorScheme = getConfidenceColorScheme(score);

  return (
    <div className={cn('relative flex flex-col items-center p-4 rounded-2xl bg-gradient-to-br', colorScheme.bg)}>
      <div className="relative" style={{ width: size, height: size / 2 + 20 }}>
        <svg
          width={size}
          height={size / 2 + 20}
          viewBox={`0 0 ${size} ${size / 2 + 20}`}
          className="overflow-visible"
        >
          {/* Background arc */}
          <path
            d={`M 15 ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 15} ${size / 2}`}
            fill="none"
            stroke={COLORS.slate[200]}
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* Colored arc */}
          <motion.path
            d={`M 15 ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 15} ${size / 2}`}
            fill="none"
            stroke={colorScheme.stroke}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </svg>
        {/* Center score */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
            className={cn('text-4xl font-bold', colorScheme.text)}
          >
            {score}
          </motion.span>
          <span className="text-xs text-slate-500 font-medium">/ 100</span>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <Gauge className={cn('w-4 h-4', colorScheme.text)} />
        <span className={cn('text-sm font-semibold', colorScheme.text)}>
          {colorScheme.label}
        </span>
      </div>
    </div>
  );
}

export default ConfidenceGauge;
