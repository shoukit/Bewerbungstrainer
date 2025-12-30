import React, { useMemo, useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Mic } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Unified Audio Visualizer Component
 *
 * Variants:
 * - 'spectrum': Professional equalizer-style bars (default)
 * - 'waveform': Smooth flowing waveform like Siri
 * - 'bars': Classic frequency bars
 * - 'pulse': Pulsing microphone icon
 * - 'minimal': Simple horizontal progress bar
 *
 * @param {number} audioLevel - Audio level from 0 to 1 (or 0 to 100)
 * @param {boolean} isActive - Whether recording/active
 * @param {'spectrum' | 'waveform' | 'bars' | 'pulse' | 'minimal'} variant - Visual style
 * @param {'sm' | 'md' | 'lg'} size - Size preset
 * @param {string} className - Additional CSS classes
 * @param {string} accentColor - Custom accent color (CSS color value)
 */
const AudioVisualizer = ({
  audioLevel = 0,
  isActive = false,
  variant = 'spectrum',
  size = 'md',
  className,
  accentColor,
}) => {
  // Normalize audioLevel to 0-1 range
  const normalizedLevel = audioLevel > 1 ? audioLevel / 100 : audioLevel;

  // Size configurations
  const sizeConfig = useMemo(() => ({
    sm: { height: 48, barCount: 40, barWidth: 3, gap: 2 },
    md: { height: 64, barCount: 50, barWidth: 4, gap: 2 },
    lg: { height: 80, barCount: 60, barWidth: 5, gap: 3 },
  }), []);

  const config = sizeConfig[size] || sizeConfig.md;

  // Render based on variant
  switch (variant) {
    case 'waveform':
      return <WaveformVisualizer level={normalizedLevel} isActive={isActive} config={config} className={className} accentColor={accentColor} />;
    case 'bars':
      return <BarsVisualizer level={normalizedLevel} isActive={isActive} config={config} className={className} accentColor={accentColor} />;
    case 'pulse':
      return <PulseVisualizer level={normalizedLevel} isActive={isActive} size={size} className={className} accentColor={accentColor} />;
    case 'minimal':
      return <MinimalVisualizer level={normalizedLevel} isActive={isActive} className={className} accentColor={accentColor} />;
    case 'spectrum':
    default:
      return <SpectrumVisualizer level={normalizedLevel} isActive={isActive} config={config} className={className} accentColor={accentColor} />;
  }
};

/**
 * Professional Spectrum/Equalizer Visualizer
 * All bars react dynamically with smooth animations
 */
const SpectrumVisualizer = ({ level, isActive, config, className, accentColor }) => {
  const [bars, setBars] = useState([]);
  const animationRef = useRef(null);
  const lastUpdateRef = useRef(0);

  const baseColor = accentColor || '#3b82f6';
  const glowColor = accentColor ? `${accentColor}60` : 'rgba(59, 130, 246, 0.4)';

  // Generate dynamic bar heights
  useEffect(() => {
    const barCount = config.barCount;

    const updateBars = () => {
      const now = Date.now();
      // Update every ~50ms for smooth animation
      if (now - lastUpdateRef.current < 50) {
        animationRef.current = requestAnimationFrame(updateBars);
        return;
      }
      lastUpdateRef.current = now;

      const newBars = Array.from({ length: barCount }, (_, i) => {
        if (!isActive) {
          // Idle: subtle random movement
          return 8 + Math.random() * 12;
        }

        // Active: dynamic response to audio level
        const sensitivity = Math.pow(level, 0.5); // More sensitive to lower levels
        const baseHeight = 15 + sensitivity * 60;

        // Create natural frequency distribution - different "frequencies" respond differently
        const frequencyResponse = Math.sin((i / barCount) * Math.PI * 2 + now * 0.003) * 0.3 + 0.7;
        const randomVariation = (Math.random() - 0.5) * sensitivity * 40;

        // Add some wave motion across the bars
        const waveOffset = Math.sin((i / barCount) * Math.PI * 3 + now * 0.005) * sensitivity * 15;

        const height = baseHeight * frequencyResponse + randomVariation + waveOffset;
        return Math.min(95, Math.max(8, height));
      });

      setBars(newBars);
      animationRef.current = requestAnimationFrame(updateBars);
    };

    updateBars();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, level, config.barCount]);

  return (
    <div
      className={cn("relative w-full flex items-end justify-center", className)}
      style={{ height: config.height }}
    >
      {/* Gradient background glow when active */}
      {isActive && level > 0.1 && (
        <div
          className="absolute inset-0 rounded-lg opacity-30"
          style={{
            background: `radial-gradient(ellipse at center, ${glowColor} 0%, transparent 70%)`,
          }}
        />
      )}

      {/* Bars container */}
      <div
        className="flex items-end justify-center h-full"
        style={{ gap: config.gap }}
      >
        {bars.map((height, index) => (
          <div
            key={index}
            className="rounded-full transition-all"
            style={{
              width: config.barWidth,
              height: `${height}%`,
              background: isActive
                ? `linear-gradient(to top, ${baseColor}, ${adjustColor(baseColor, 40)})`
                : `linear-gradient(to top, ${adjustColor(baseColor, -30)}, ${adjustColor(baseColor, 10)})`,
              opacity: isActive ? 0.85 + level * 0.15 : 0.4,
              boxShadow: isActive && level > 0.2
                ? `0 0 ${4 + level * 8}px ${glowColor}`
                : 'none',
              transition: 'height 0.08s ease-out, opacity 0.15s ease-out',
            }}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * Smooth Waveform Visualizer (Siri-like)
 */
const WaveformVisualizer = ({ level, isActive, config, className, accentColor }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const phaseRef = useRef(0);

  const baseColor = accentColor || '#3b82f6';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      const amplitude = isActive ? 0.3 + level * 0.5 : 0.15;
      const frequency = isActive ? 2 + level : 1.5;
      phaseRef.current += isActive ? 0.08 + level * 0.04 : 0.02;

      // Create gradient
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, adjustColor(baseColor, -20) + '80');
      gradient.addColorStop(0.5, baseColor);
      gradient.addColorStop(1, adjustColor(baseColor, -20) + '80');

      // Draw main wave
      ctx.beginPath();
      ctx.moveTo(0, height / 2);

      for (let x = 0; x <= width; x++) {
        const normalizedX = x / width;

        // Multiple waves combined for organic look
        const wave1 = Math.sin(normalizedX * Math.PI * frequency + phaseRef.current) * amplitude;
        const wave2 = Math.sin(normalizedX * Math.PI * frequency * 1.5 + phaseRef.current * 1.3) * amplitude * 0.5;
        const wave3 = Math.sin(normalizedX * Math.PI * frequency * 2.5 + phaseRef.current * 0.7) * amplitude * 0.25;

        // Envelope to fade at edges
        const envelope = Math.sin(normalizedX * Math.PI);

        const y = height / 2 + (wave1 + wave2 + wave3) * height * envelope;
        ctx.lineTo(x, y);
      }

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Draw subtle reflection
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);

      for (let x = 0; x <= width; x++) {
        const normalizedX = x / width;
        const wave1 = Math.sin(normalizedX * Math.PI * frequency + phaseRef.current + 0.5) * amplitude * 0.6;
        const envelope = Math.sin(normalizedX * Math.PI);
        const y = height / 2 + wave1 * height * envelope;
        ctx.lineTo(x, y);
      }

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.globalAlpha = 1;

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, level, baseColor]);

  return (
    <div className={cn("relative w-full", className)} style={{ height: config.height }}>
      <canvas
        ref={canvasRef}
        width={500}
        height={config.height}
        className="w-full h-full"
        style={{ filter: isActive && level > 0.2 ? `drop-shadow(0 0 8px ${baseColor}60)` : 'none' }}
      />
    </div>
  );
};

/**
 * Classic frequency bars with improved distribution
 */
const BarsVisualizer = ({ level, isActive, config, className, accentColor }) => {
  const bars = config.barCount;
  const baseColor = accentColor || '#3b82f6';

  // Generate bar heights - evenly distributed, all responsive
  const generateBarHeights = () => {
    if (!isActive) {
      return Array.from({ length: bars }, () => 8 + Math.random() * 10);
    }

    const sensitivity = Math.pow(level, 0.6);
    return Array.from({ length: bars }, (_, i) => {
      const baseHeight = 20 + sensitivity * 55;
      const variation = Math.random() * sensitivity * 30;
      // Subtle wave pattern
      const wave = Math.sin((i / bars) * Math.PI * 4 + Date.now() * 0.005) * sensitivity * 10;
      return Math.min(95, Math.max(10, baseHeight + variation + wave));
    });
  };

  const heights = generateBarHeights();

  return (
    <div
      className={cn("flex items-end justify-center w-full", className)}
      style={{ height: config.height, gap: config.gap }}
    >
      {heights.map((height, index) => (
        <motion.div
          key={index}
          className="rounded-sm"
          style={{
            width: config.barWidth,
            background: `linear-gradient(to top, ${baseColor}, ${adjustColor(baseColor, 50)})`,
            boxShadow: isActive && level > 0.15
              ? `0 0 ${4 + level * 10}px ${baseColor}50`
              : 'none',
          }}
          animate={{
            height: `${height}%`,
            opacity: isActive ? 0.8 + level * 0.2 : 0.35,
          }}
          transition={{
            duration: 0.08,
            ease: 'easeOut',
          }}
        />
      ))}
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
  const baseColor = accentColor || '#3b82f6';

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      {/* Outer pulsing rings */}
      {isActive && (
        <>
          <motion.div
            className={cn("absolute rounded-full border-2 opacity-30", config.ring)}
            style={{
              borderColor: baseColor,
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
            className={cn("absolute rounded-full border-2 opacity-30", config.ring)}
            style={{
              borderColor: baseColor,
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
  const baseColor = accentColor || '#3b82f6';

  const getColor = () => {
    if (!isActive) return 'rgb(148, 163, 184)';
    if (level > 0.7) return 'rgb(34, 197, 94)';
    if (level > 0.3) return baseColor;
    return 'rgb(148, 163, 184)';
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
    let num;
    if (hex.length === 3) {
      num = parseInt(hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2], 16);
    } else {
      num = parseInt(hex, 16);
    }
    const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
    const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
    return `rgb(${r}, ${g}, ${b})`;
  }

  return color;
}

export default AudioVisualizer;

// Named exports for specific variants
export { SpectrumVisualizer, WaveformVisualizer, BarsVisualizer, PulseVisualizer, MinimalVisualizer };
