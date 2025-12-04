import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const AudioVisualizer = ({ audioLevel = 0, isActive = false }) => {
  const bars = 24; // Number of bars

  // Generate bar heights based on audio level
  const generateBarHeights = () => {
    if (!isActive) {
      // Idle state - low random movement
      return Array.from({ length: bars }, () => 20 + Math.random() * 10);
    }

    // Active state - vary heights based on audio level
    return Array.from({ length: bars }, (_, i) => {
      const centerDistance = Math.abs(i - bars / 2) / (bars / 2);
      const baseHeight = 20 + audioLevel * 0.8;
      const variation = Math.random() * (audioLevel / 2);
      const centerBoost = (1 - centerDistance) * audioLevel * 0.5;

      return Math.min(100, baseHeight + variation + centerBoost);
    });
  };

  return (
    <div className="flex items-center justify-center gap-1 h-32 px-4">
      {Array.from({ length: bars }).map((_, index) => (
        <motion.div
          key={index}
          className="flex-1 rounded-full bg-gradient-to-t from-blue-600 to-teal-500"
          initial={{ height: '20%' }}
          animate={{
            height: `${generateBarHeights()[index]}%`,
          }}
          transition={{
            duration: isActive ? 0.15 : 0.8,
            ease: 'easeInOut',
            repeat: Infinity,
            repeatType: 'mirror',
            delay: index * 0.02,
          }}
          style={{
            minHeight: '8px',
            opacity: isActive ? 1 : 0.5,
          }}
        />
      ))}
    </div>
  );
};

export default AudioVisualizer;
