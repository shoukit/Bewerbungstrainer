import React from 'react';
import { motion } from 'framer-motion';
import { getScoreColor } from '@/config/colors';

/**
 * Rating Bar Component
 * Displays a horizontal progress bar with label and value
 */
const RatingBar = ({ label, value, maxValue = 10, primaryAccent, branding }) => {
  const percentage = (value / maxValue) * 100;
  const displayValue = maxValue === 10 ? value * 10 : value;
  const color = getScoreColor(displayValue, primaryAccent);

  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontSize: '13px', color: branding.textSecondary }}>{label}</span>
        <span style={{ fontSize: '13px', fontWeight: 600, color }}>{displayValue}</span>
      </div>
      <div style={{ height: '6px', background: branding.cardBgHover, borderRadius: '3px', overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ height: '100%', background: color, borderRadius: '3px' }}
        />
      </div>
    </div>
  );
};

export default RatingBar;
