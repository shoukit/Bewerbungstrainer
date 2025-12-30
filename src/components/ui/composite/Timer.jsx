/**
 * Timer Component
 *
 * A reusable timer/countdown component with multiple display formats
 * and visual variants. Consolidates timer implementations across
 * SimulatorSession, GameSession, and other components.
 *
 * @example
 * // Countdown timer
 * <Timer
 *   seconds={120}
 *   variant="countdown"
 *   onComplete={() => console.log('Time up!')}
 * />
 *
 * // Recording timer
 * <Timer
 *   seconds={recordingDuration}
 *   variant="recording"
 *   size="lg"
 * />
 *
 * // Simple display
 * <Timer seconds={45} format="mm:ss" />
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Clock, AlertTriangle, Mic } from 'lucide-react';
import { COLORS } from '@/config/colors';
import { useBranding } from '@/hooks/useBranding';

/**
 * Format seconds into time string
 *
 * @param {number} totalSeconds - Total seconds to format
 * @param {string} format - Format: 'mm:ss' | 'hh:mm:ss' | 'seconds' | 'compact'
 * @returns {string} Formatted time string
 */
export const formatTime = (totalSeconds, format = 'mm:ss') => {
  const absSeconds = Math.abs(Math.floor(totalSeconds));
  const hours = Math.floor(absSeconds / 3600);
  const minutes = Math.floor((absSeconds % 3600) / 60);
  const seconds = absSeconds % 60;

  const sign = totalSeconds < 0 ? '-' : '';

  switch (format) {
    case 'hh:mm:ss':
      return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    case 'seconds':
      return `${sign}${absSeconds}s`;

    case 'compact':
      if (hours > 0) {
        return `${sign}${hours}h ${minutes}m`;
      }
      if (minutes > 0) {
        return `${sign}${minutes}m ${seconds}s`;
      }
      return `${sign}${seconds}s`;

    case 'mm:ss':
    default:
      const totalMinutes = Math.floor(absSeconds / 60);
      return `${sign}${totalMinutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
};

/**
 * Size configurations
 */
const SIZES = {
  sm: {
    fontSize: '14px',
    iconSize: 14,
    padding: '4px 8px',
    gap: '4px',
  },
  md: {
    fontSize: '18px',
    iconSize: 18,
    padding: '8px 12px',
    gap: '6px',
  },
  lg: {
    fontSize: '32px',
    iconSize: 24,
    padding: '12px 20px',
    gap: '8px',
  },
  xl: {
    fontSize: '48px',
    iconSize: 32,
    padding: '16px 24px',
    gap: '12px',
  },
};

/**
 * Get color based on remaining time (for countdown variant)
 *
 * @param {number} seconds - Remaining seconds
 * @param {number} total - Total seconds
 * @returns {string} Color value
 */
const getCountdownColor = (seconds, total) => {
  const percentage = (seconds / total) * 100;

  if (percentage <= 10) return COLORS.red[500];
  if (percentage <= 25) return COLORS.amber[500];
  return COLORS.slate[600];
};

/**
 * Timer Display Component (stateless)
 *
 * For displaying a time value without internal timer logic.
 */
export const TimerDisplay = ({
  seconds,
  format = 'mm:ss',
  size = 'md',
  variant = 'default',
  icon: CustomIcon,
  showIcon = true,
  totalSeconds, // For countdown color calculation
  accentColor,
  className = '',
  style = {},
}) => {
  const b = useBranding();
  const sizeConfig = SIZES[size] || SIZES.md;

  // Determine color
  let color = accentColor || COLORS.slate[600];
  if (variant === 'countdown' && totalSeconds) {
    color = getCountdownColor(seconds, totalSeconds);
  } else if (variant === 'recording') {
    color = COLORS.red[500];
  } else if (variant === 'primary') {
    color = b.primaryAccent;
  }

  // Determine icon
  let IconComponent = CustomIcon;
  if (!IconComponent && showIcon) {
    if (variant === 'recording') {
      IconComponent = Mic;
    } else if (variant === 'countdown' && seconds <= (totalSeconds * 0.1)) {
      IconComponent = AlertTriangle;
    } else {
      IconComponent = Clock;
    }
  }

  // Determine background
  let backgroundColor = 'transparent';
  if (variant === 'recording') {
    backgroundColor = COLORS.red[50];
  } else if (variant === 'countdown' && seconds <= (totalSeconds * 0.25)) {
    backgroundColor = seconds <= (totalSeconds * 0.1) ? COLORS.red[50] : COLORS.amber[50];
  }

  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: sizeConfig.gap,
        padding: sizeConfig.padding,
        borderRadius: '8px',
        backgroundColor,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        ...style,
      }}
    >
      {IconComponent && showIcon && (
        <IconComponent
          style={{
            width: sizeConfig.iconSize,
            height: sizeConfig.iconSize,
            color,
            ...(variant === 'recording' ? { animation: 'pulse 1.5s ease-in-out infinite' } : {}),
          }}
        />
      )}
      <span
        style={{
          fontSize: sizeConfig.fontSize,
          fontWeight: 600,
          color,
          lineHeight: 1,
        }}
      >
        {formatTime(seconds, format)}
      </span>

      {variant === 'recording' && (
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      )}
    </div>
  );
};

/**
 * Timer Component (with internal state)
 *
 * Can count up or down depending on props.
 *
 * @param {Object} props
 * @param {number} props.initialSeconds - Starting value in seconds
 * @param {boolean} props.countDown - If true, counts down to 0 (default: false, counts up)
 * @param {boolean} props.autoStart - Start timer automatically (default: true)
 * @param {Function} props.onComplete - Called when countdown reaches 0
 * @param {Function} props.onTick - Called every second with current value
 * @param {string} props.format - Time format: 'mm:ss' | 'hh:mm:ss' | 'seconds' | 'compact'
 * @param {string} props.size - Size: 'sm' | 'md' | 'lg' | 'xl'
 * @param {string} props.variant - Variant: 'default' | 'countdown' | 'recording' | 'primary'
 */
const Timer = ({
  initialSeconds = 0,
  countDown = false,
  autoStart = true,
  onComplete,
  onTick,
  format = 'mm:ss',
  size = 'md',
  variant = 'default',
  icon,
  showIcon = true,
  accentColor,
  className,
  style,
}) => {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);
  const intervalRef = useRef(null);
  const onCompleteRef = useRef(onComplete);
  const onTickRef = useRef(onTick);

  // Update refs
  onCompleteRef.current = onComplete;
  onTickRef.current = onTick;

  // Timer logic
  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      setSeconds((prev) => {
        const next = countDown ? prev - 1 : prev + 1;

        // Call onTick
        if (onTickRef.current) {
          onTickRef.current(next);
        }

        // Handle countdown completion
        if (countDown && next <= 0) {
          setIsRunning(false);
          if (onCompleteRef.current) {
            onCompleteRef.current();
          }
          return 0;
        }

        return next;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, countDown]);

  // Reset when initialSeconds changes
  useEffect(() => {
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  // Control functions
  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);
  const reset = useCallback(() => {
    setSeconds(initialSeconds);
    setIsRunning(false);
  }, [initialSeconds]);
  const toggle = useCallback(() => setIsRunning((prev) => !prev), []);

  return (
    <TimerDisplay
      seconds={seconds}
      format={format}
      size={size}
      variant={countDown ? 'countdown' : variant}
      icon={icon}
      showIcon={showIcon}
      totalSeconds={countDown ? initialSeconds : undefined}
      accentColor={accentColor}
      className={className}
      style={style}
    />
  );
};

/**
 * Countdown Timer - Pre-configured for countdown scenarios
 */
export const Countdown = ({
  seconds,
  onComplete,
  size = 'lg',
  showIcon = true,
  ...props
}) => (
  <Timer
    initialSeconds={seconds}
    countDown={true}
    onComplete={onComplete}
    size={size}
    variant="countdown"
    showIcon={showIcon}
    {...props}
  />
);

/**
 * Recording Timer - Pre-configured for recording scenarios
 */
export const RecordingTimer = ({
  seconds,
  size = 'md',
  ...props
}) => (
  <TimerDisplay
    seconds={seconds}
    size={size}
    variant="recording"
    showIcon={true}
    {...props}
  />
);

/**
 * useTimer Hook - For external timer control
 *
 * @param {Object} options
 * @param {number} options.initialSeconds - Starting value
 * @param {boolean} options.countDown - Count down instead of up
 * @param {boolean} options.autoStart - Start automatically
 * @param {Function} options.onComplete - Called when countdown completes
 */
export const useTimer = ({
  initialSeconds = 0,
  countDown = false,
  autoStart = false,
  onComplete,
} = {}) => {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      setSeconds((prev) => {
        const next = countDown ? prev - 1 : prev + 1;

        if (countDown && next <= 0) {
          setIsRunning(false);
          if (onComplete) onComplete();
          return 0;
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [isRunning, countDown, onComplete]);

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);
  const reset = useCallback((newSeconds) => {
    setSeconds(newSeconds ?? initialSeconds);
    setIsRunning(false);
  }, [initialSeconds]);
  const toggle = useCallback(() => setIsRunning((prev) => !prev), []);

  return {
    seconds,
    isRunning,
    start,
    pause,
    reset,
    toggle,
    formatted: formatTime(seconds),
  };
};

export default Timer;
