/**
 * Confetti Component
 *
 * A celebratory confetti animation for training completion.
 * Uses framer-motion for smooth animations without additional dependencies.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Generate random confetti particles
 */
const generateParticles = (count = 50) => {
  const colors = [
    '#6366f1', // indigo-500
    '#8b5cf6', // violet-500
    '#a855f7', // purple-500
    '#ec4899', // pink-500
    '#f43f5e', // rose-500
    '#f97316', // orange-500
    '#eab308', // yellow-500
    '#22c55e', // green-500
    '#4F46E5', // indigo-600
    '#06b6d4', // cyan-500
  ];

  const shapes = ['square', 'circle', 'triangle'];

  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100, // start position (0-100%)
    color: colors[Math.floor(Math.random() * colors.length)],
    shape: shapes[Math.floor(Math.random() * shapes.length)],
    size: Math.random() * 8 + 6, // 6-14px
    rotation: Math.random() * 360,
    delay: Math.random() * 0.5,
    duration: Math.random() * 1.5 + 2, // 2-3.5s
    amplitude: Math.random() * 100 + 50, // horizontal drift
  }));
};

/**
 * Single confetti particle
 */
const ConfettiParticle = ({ particle }) => {
  const shapeStyle = useMemo(() => {
    const base = {
      width: particle.size,
      height: particle.size,
      backgroundColor: particle.color,
    };

    switch (particle.shape) {
      case 'circle':
        return { ...base, borderRadius: '50%' };
      case 'triangle':
        return {
          width: 0,
          height: 0,
          backgroundColor: 'transparent',
          borderLeft: `${particle.size / 2}px solid transparent`,
          borderRight: `${particle.size / 2}px solid transparent`,
          borderBottom: `${particle.size}px solid ${particle.color}`,
        };
      default: // square
        return { ...base, borderRadius: '2px' };
    }
  }, [particle]);

  return (
    <motion.div
      initial={{
        x: `${particle.x}vw`,
        y: -20,
        rotate: particle.rotation,
        opacity: 1,
        scale: 0,
      }}
      animate={{
        y: '110vh',
        x: [
          `${particle.x}vw`,
          `${particle.x + (Math.random() > 0.5 ? 1 : -1) * (particle.amplitude / 3)}vw`,
          `${particle.x + (Math.random() > 0.5 ? -1 : 1) * (particle.amplitude / 2)}vw`,
          `${particle.x}vw`,
        ],
        rotate: particle.rotation + (Math.random() > 0.5 ? 360 : -360) * 3,
        opacity: [1, 1, 1, 0.8, 0],
        scale: [0, 1, 1, 1, 0.8],
      }}
      transition={{
        duration: particle.duration,
        delay: particle.delay,
        ease: 'easeOut',
        x: {
          duration: particle.duration,
          repeat: 0,
          ease: 'easeInOut',
        },
      }}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        ...shapeStyle,
      }}
    />
  );
};

/**
 * Confetti Component
 *
 * @param {boolean} active - Whether confetti should be playing
 * @param {number} count - Number of confetti particles (default: 50)
 * @param {number} duration - Total animation duration in ms (default: 4000)
 * @param {function} onComplete - Callback when animation completes
 */
export function Confetti({
  active = false,
  count = 50,
  duration = 4000,
  onComplete
}) {
  const [particles, setParticles] = useState([]);
  const [isActive, setIsActive] = useState(false);

  // Start confetti
  useEffect(() => {
    if (active && !isActive) {
      setIsActive(true);
      setParticles(generateParticles(count));

      // Clear after duration
      const timer = setTimeout(() => {
        setIsActive(false);
        setParticles([]);
        onComplete?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [active, count, duration, onComplete, isActive]);

  // Reset when active becomes false
  useEffect(() => {
    if (!active) {
      setIsActive(false);
    }
  }, [active]);

  if (!isActive || particles.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 9999,
        overflow: 'hidden',
      }}
      aria-hidden="true"
    >
      <AnimatePresence>
        {particles.map((particle) => (
          <ConfettiParticle key={particle.id} particle={particle} />
        ))}
      </AnimatePresence>
    </div>
  );
}

/**
 * useConfetti Hook
 *
 * Provides an easy way to trigger confetti from any component.
 *
 * @example
 * const { triggerConfetti, ConfettiComponent } = useConfetti();
 *
 * // Trigger on success
 * triggerConfetti();
 *
 * // Render in component
 * return (
 *   <>
 *     <ConfettiComponent />
 *     <button onClick={handleComplete}>Complete Training</button>
 *   </>
 * );
 */
export function useConfetti(options = {}) {
  const [isActive, setIsActive] = useState(false);

  const triggerConfetti = useCallback(() => {
    setIsActive(true);
  }, []);

  const ConfettiComponent = useCallback(() => (
    <Confetti
      active={isActive}
      count={options.count || 50}
      duration={options.duration || 4000}
      onComplete={() => {
        setIsActive(false);
        options.onComplete?.();
      }}
    />
  ), [isActive, options]);

  return {
    triggerConfetti,
    isActive,
    ConfettiComponent,
  };
}

export default Confetti;
