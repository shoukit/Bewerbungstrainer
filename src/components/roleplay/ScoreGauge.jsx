import React from 'react';
import { motion } from 'framer-motion';
import { getScoreColor } from '@/config/colors';

/**
 * Score Gauge - Circular progress indicator
 * Used in report headers to display overall scores
 */
const ScoreGauge = ({ score, size = 100, primaryAccent, isHeader = false }) => {
  const percentage = Math.min(100, Math.max(0, score || 0));
  const radius = (size - 10) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;
  const color = getScoreColor(score, primaryAccent);

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={isHeader ? 'rgba(255,255,255,0.25)' : '#e2e8f0'}
          strokeWidth={8}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={isHeader ? '#fff' : color}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          style={{
            fontSize: size / 3,
            fontWeight: 700,
            color: isHeader ? '#fff' : color,
            lineHeight: 1,
          }}
        >
          {Math.round(score)}
        </motion.span>
      </div>
    </div>
  );
};

export default ScoreGauge;
