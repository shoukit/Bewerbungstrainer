import React from 'react';
import { motion } from 'framer-motion';
import { getScoreColor } from '@/config/colors';
import { useBranding } from '@/hooks/useBranding';

/**
 * Rating Bar Component
 * Displays a horizontal progress bar with label and value
 */
const RatingBar = ({ label, value, maxValue = 10, primaryAccent, branding: brandingProp }) => {
  // Get branding from hook (self-contained)
  const b = useBranding();
  const branding = brandingProp || b;
  const percentage = (value / maxValue) * 100;
  const displayValue = maxValue === 10 ? value * 10 : value;
  const color = getScoreColor(displayValue, primaryAccent);

  return (
    <div className="mb-3">
      <div className="flex justify-between mb-1.5">
        <span className="text-[13px] text-slate-600">{label}</span>
        <span className="text-[13px] font-semibold" style={{ color }}>{displayValue}</span>
      </div>
      <div className="h-1.5 rounded overflow-hidden" style={{ background: branding.cardBgHover }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded"
          style={{ background: color }}
        />
      </div>
    </div>
  );
};

export default RatingBar;
