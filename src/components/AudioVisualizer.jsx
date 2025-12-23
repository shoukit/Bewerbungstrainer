import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Mic } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Unified Audio Visualizer Component
 *
 * Variants:
 * - 'bars': Classic frequency bars (default)
 * - 'wave': Smooth wave-like visualization
 * - 'pulse': Pulsing microphone icon
 * - 'minimal': Simple horizontal progress bar
 *
 * @param {number} audioLevel - Audio level from 0 to 1 (or 0 to 100)
 * @param {boolean} isActive - Whether recording/active
 * @param {'bars' | 'wave' | 'pulse' | 'minimal'} variant - Visual style
 * @param {'sm' | 'md' | 'lg'} size - Size preset
 * @param {string} className - Additional CSS classes
 * @param {string} accentColor - Custom accent color (CSS color value)
 */
const AudioVisualizer = ({
  audioLevel = 0,
  isActive = false,
  variant = 'bars',
  size = 'md',
  className,
  accentColor,
}) => {
  // Normalize audioLevel to 0-1 range
  const normalizedLevel = audioLevel > 1 ? audioLevel / 100 : audioLevel;

  // Size configurations - more bars for fuller, wider look
  const sizeConfig = useMemo(() => ({
    sm: { height: 'h-12', barCount: 32, barWidth: 'flex-1 min-w-[2px] max-w-[4px]', gap: 'gap-[2px]' },
    md: { height: 'h-16', barCount: 48, barWidth: 'flex-1 min-w-[2px] max-w-[5px]', gap: 'gap-[2px]' },
    lg: { height: 'h-20', barCount: 64, barWidth: 'flex-1 min-w-[3px] max-w-[6px]', gap: 'gap-[3px]' },
  }), []);

  const config = sizeConfig[size] || sizeConfig.md;

  // Render based on variant
  switch (variant) {
    case 'wave':
      return <WaveVisualizer level={normalizedLevel} isActive={isActive} config={config} className={className} accentColor={accentColor} />;
    case 'pulse':
      return <PulseVisualizer level={normalizedLevel} isActive={isActive} size={size} className={className} accentColor={accentColor} />;
    case 'minimal':
      return <MinimalVisualizer level={normalizedLevel} isActive={isActive} className={className} accentColor={accentColor} />;
    case 'bars':
    default:
      return <BarsVisualizer level={normalizedLevel} isActive={isActive} config={config} className={className} accentColor={accentColor} />;
  }
};

/**
 * Classic frequency bars - most visually appealing
 */
const BarsVisualizer = ({ level, isActive, config, className, accentColor }) => {
  const bars = config.barCount;

  // Generate bar heights with center-weighted distribution
  const generateBarHeights = () => {
    if (!isActive) {
      // Idle state - very subtle movement
      return Array.from({ length: bars }, () => 8 + Math.random() * 8);
    }

    // Active state - dynamic heights based on audio level
    return Array.from({ length: bars }, (_, i) => {
      // Center-weighted: bars in the middle are taller
      const centerDistance = Math.abs(i - bars / 2) / (bars / 2);
      // More responsive to lower audio levels
      const adjustedLevel = Math.pow(level, 0.7); // Make it more sensitive
      const baseHeight = 15 + adjustedLevel * 70;
      const variation = Math.random() * (adjustedLevel * 35);
      const centerBoost = (1 - centerDistance * 0.6) * adjustedLevel * 30;

      return Math.min(100, Math.max(8, baseHeight + variation + centerBoost));
    });
  };

  const heights = generateBarHeights();

  return (
    <div className={cn(
      "flex items-end justify-center w-full",
      config.height,
      config.gap,
      className
    )}>
      {Array.from({ length: bars }).map((_, index) => {
        // Create wave-like delay pattern from center
        const centerIndex = bars / 2;
        const distanceFromCenter = Math.abs(index - centerIndex);
        const delay = distanceFromCenter * 0.015;

        return (
          <motion.div
            key={index}
            className={cn(
              "rounded-full",
              config.barWidth
            )}
            style={{
              background: accentColor
                ? `linear-gradient(to top, ${accentColor}, ${adjustColor(accentColor, 60)})`
                : 'linear-gradient(to top, rgb(37, 99, 235), rgb(20, 184, 166))',
              boxShadow: isActive && level > 0.15
                ? `0 0 ${6 + level * 14}px ${accentColor ? `${accentColor}60` : 'rgba(20, 184, 166, 0.5)'}`
                : 'none',
            }}
            initial={{ height: '10%' }}
            animate={{
              height: `${heights[index]}%`,
              opacity: isActive ? 0.8 + level * 0.2 : 0.3,
            }}
            transition={{
              duration: isActive ? 0.06 : 0.5,
              ease: 'easeOut',
              delay: delay,
            }}
          />
        );
      })}
    </div>
  );
};

/**
 * Wave-like smooth visualization
 */
const WaveVisualizer = ({ level, isActive, config, className, accentColor }) => {
  const points = config.barCount;

  // Generate smooth wave path
  const generateWavePath = () => {
    const width = 100;
    const height = 100;
    const amplitude = isActive ? 20 + level * 40 : 10;

    let path = `M 0 ${height / 2}`;

    for (let i = 0; i <= points; i++) {
      const x = (i / points) * width;
      const phase = (i / points) * Math.PI * 4 + Date.now() * 0.002;
      const y = height / 2 + Math.sin(phase) * amplitude * (0.5 + Math.random() * 0.5);
      path += ` L ${x} ${y}`;
    }

    return path;
  };

  return (
    <div className={cn("relative", config.height, className)}>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={accentColor || "rgb(37, 99, 235)"} stopOpacity="0.8" />
            <stop offset="50%" stopColor={accentColor ? adjustColor(accentColor, 30) : "rgb(20, 184, 166)"} stopOpacity="1" />
            <stop offset="100%" stopColor={accentColor || "rgb(37, 99, 235)"} stopOpacity="0.8" />
          </linearGradient>
        </defs>
        <motion.path
          d={generateWavePath()}
          fill="none"
          stroke="url(#waveGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          animate={{
            opacity: isActive ? 1 : 0.5,
          }}
          transition={{ duration: 0.1 }}
        />
      </svg>
    </div>
  );
};

/**
 * Pulsing microphone visualization
 */
const PulseVisualizer = ({ level, isActive, size, className, accentColor }) => {
  const sizeMap = {
    sm: { container: 'w-16 h-16', icon: 'w-6 h-6', ring: 'w-20 h-20' },
    md: { container: 'w-20 h-20', icon: 'w-8 h-8', ring: 'w-28 h-28' },
    lg: { container: 'w-24 h-24', icon: 'w-10 h-10', ring: 'w-36 h-36' },
  };

  const config = sizeMap[size] || sizeMap.md;
  const baseColor = accentColor || 'rgb(20, 184, 166)';

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      {/* Outer pulsing rings */}
      {isActive && (
        <>
          <motion.div
            className={cn("absolute rounded-full", config.ring)}
            style={{
              border: `2px solid ${baseColor}`,
              opacity: 0.3,
            }}
            animate={{
              scale: [1, 1.3 + level * 0.4],
              opacity: [0.4, 0],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
          <motion.div
            className={cn("absolute rounded-full", config.ring)}
            style={{
              border: `2px solid ${baseColor}`,
              opacity: 0.3,
            }}
            animate={{
              scale: [1, 1.2 + level * 0.3],
              opacity: [0.3, 0],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: 'easeOut',
              delay: 0.3,
            }}
          />
        </>
      )}

      {/* Main circle with mic */}
      <motion.div
        className={cn(
          "rounded-full flex items-center justify-center",
          config.container
        )}
        style={{
          background: `linear-gradient(135deg, ${baseColor}, ${adjustColor(baseColor, -20)})`,
          boxShadow: isActive
            ? `0 0 ${20 + level * 30}px ${baseColor}40`
            : `0 4px 12px ${baseColor}20`,
        }}
        animate={{
          scale: isActive ? 1 + level * 0.15 : 1,
        }}
        transition={{ duration: 0.1 }}
      >
        <Mic className={cn(config.icon, "text-white")} />
      </motion.div>
    </div>
  );
};

/**
 * Minimal horizontal progress bar
 */
const MinimalVisualizer = ({ level, isActive, className, accentColor }) => {
  const baseColor = accentColor || 'rgb(20, 184, 166)';

  // Color based on level
  const getColor = () => {
    if (!isActive) return 'rgb(148, 163, 184)'; // slate-400
    if (level > 0.7) return 'rgb(34, 197, 94)'; // green-500
    if (level > 0.3) return baseColor;
    return 'rgb(148, 163, 184)'; // slate-400
  };

  return (
    <div className={cn("h-3 bg-slate-200 rounded-full overflow-hidden", className)}>
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: getColor() }}
        animate={{
          width: `${Math.max(5, level * 100)}%`,
        }}
        transition={{ duration: 0.1, ease: 'easeOut' }}
      />
    </div>
  );
};

/**
 * Helper: Adjust color brightness
 */
function adjustColor(color, amount) {
  // Handle rgb format
  const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (rgbMatch) {
    const r = Math.min(255, Math.max(0, parseInt(rgbMatch[1]) + amount));
    const g = Math.min(255, Math.max(0, parseInt(rgbMatch[2]) + amount));
    const b = Math.min(255, Math.max(0, parseInt(rgbMatch[3]) + amount));
    return `rgb(${r}, ${g}, ${b})`;
  }

  // Handle hex format
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const num = parseInt(hex, 16);
    const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
    const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
    return `rgb(${r}, ${g}, ${b})`;
  }

  return color;
}

export default AudioVisualizer;

// Named exports for specific variants
export { BarsVisualizer, WaveVisualizer, PulseVisualizer, MinimalVisualizer };
