/**
 * FeatureInfoModal - Stylish info popup for feature descriptions
 *
 * Uses the project's design system (colors, shadows, radius, spacing)
 * for consistent styling across the application.
 *
 * Uses React Portal to render at body level, avoiding transform ancestor issues.
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Clock, Target, Sparkles, ChevronRight } from 'lucide-react';
import { COLORS, hexToRgba } from '@/config/colors';
import { SHADOWS, RADIUS, SPACING, FONT_SIZE, FONT_WEIGHT, TRANSITIONS, coloredShadow } from '@/config/designTokens';
import {
  FEATURE_DESCRIPTIONS,
  isFeatureInfoDismissed,
  setFeatureInfoDismissed,
} from '@/config/featureDescriptions';

/**
 * FeatureInfoModal Component
 *
 * @param {string} featureId - ID of the feature (e.g., 'simulator', 'roleplay')
 * @param {boolean} isOpen - Whether the modal is open (controlled mode)
 * @param {function} onClose - Callback when modal is closed
 * @param {boolean} showOnMount - If true, shows automatically on mount (respects dismissed state)
 */
const FeatureInfoModal = ({ featureId, isOpen, onClose, showOnMount = false }) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [internalOpen, setInternalOpen] = useState(false);

  const feature = FEATURE_DESCRIPTIONS[featureId];

  // Handle auto-show on mount
  useEffect(() => {
    if (showOnMount && feature && !isFeatureInfoDismissed(featureId)) {
      const timer = setTimeout(() => setInternalOpen(true), 300);
      return () => clearTimeout(timer);
    }
  }, [showOnMount, featureId, feature]);

  // Sync external isOpen with internal state
  useEffect(() => {
    if (isOpen !== undefined) {
      setInternalOpen(isOpen);
    }
  }, [isOpen]);

  const handleClose = () => {
    if (dontShowAgain && feature) {
      setFeatureInfoDismissed(featureId, true);
    }
    setInternalOpen(false);
    setDontShowAgain(false);
    onClose?.();
  };

  if (!feature) {
    console.warn(`FeatureInfoModal: Unknown feature ID "${featureId}"`);
    return null;
  }

  // Modal content - rendered via portal to avoid transform ancestor issues
  const modalContent = (
    <AnimatePresence>
      {internalOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: hexToRgba(COLORS.slate[900], 0.6),
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
            }}
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: COLORS.white,
                borderRadius: RADIUS['2xl'],
                maxWidth: '560px',
                width: '100%',
                maxHeight: 'calc(100vh - 32px)',
                overflow: 'hidden',
                boxShadow: SHADOWS.xl,
                border: `1px solid ${COLORS.slate[200]}`,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Header with gradient */}
              <div
                style={{
                  background: feature.gradient,
                  padding: `${SPACING[8]} ${SPACING[8]} ${SPACING[10]}`,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Decorative circles */}
                <div
                  style={{
                    position: 'absolute',
                    top: '-40px',
                    right: '-40px',
                    width: '120px',
                    height: '120px',
                    borderRadius: RADIUS.full,
                    background: 'rgba(255, 255, 255, 0.1)',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: '-20px',
                    left: '25%',
                    width: '60px',
                    height: '60px',
                    borderRadius: RADIUS.full,
                    background: 'rgba(255, 255, 255, 0.08)',
                  }}
                />

                {/* Close button */}
                <button
                  onClick={handleClose}
                  style={{
                    position: 'absolute',
                    top: SPACING[4],
                    right: SPACING[4],
                    width: '36px',
                    height: '36px',
                    borderRadius: RADIUS.full,
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: COLORS.white,
                    transition: TRANSITIONS.normal,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)')}
                >
                  <X size={20} />
                </button>

                {/* Icon and Title */}
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.1 }}
                    style={{
                      fontSize: '48px',
                      marginBottom: SPACING[4],
                      filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))',
                    }}
                  >
                    {feature.icon}
                  </motion.div>
                  <h2
                    style={{
                      color: COLORS.white,
                      fontSize: FONT_SIZE['4xl'],
                      fontWeight: FONT_WEIGHT.bold,
                      margin: 0,
                      textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    }}
                  >
                    {feature.title}
                  </h2>
                  <p
                    style={{
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontSize: FONT_SIZE.md,
                      margin: `${SPACING[2]} 0 0 0`,
                      fontWeight: FONT_WEIGHT.medium,
                    }}
                  >
                    {feature.subtitle}
                  </p>
                </div>
              </div>

              {/* Content - scrollable */}
              <div
                style={{
                  padding: `${SPACING[5]} ${SPACING[6]}`,
                  flex: 1,
                  overflowY: 'auto',
                  minHeight: 0,
                }}
              >
                {/* Description */}
                <p
                  style={{
                    color: COLORS.slate[600],
                    fontSize: FONT_SIZE.base,
                    lineHeight: 1.7,
                    margin: `0 0 ${SPACING[6]} 0`,
                  }}
                >
                  {feature.description}
                </p>

                {/* Benefits */}
                <div style={{ marginBottom: SPACING[6] }}>
                  <h3
                    style={{
                      color: COLORS.slate[900],
                      fontSize: FONT_SIZE.xs,
                      fontWeight: FONT_WEIGHT.semibold,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      margin: `0 0 ${SPACING[3]} 0`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: SPACING[2],
                    }}
                  >
                    <Sparkles size={16} style={{ color: feature.color }} />
                    Vorteile
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[2.5] }}>
                    {feature.benefits.map((benefit, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + index * 0.05 }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: SPACING[3],
                          padding: `${SPACING[3]} ${SPACING[4]}`,
                          backgroundColor: COLORS.slate[50],
                          borderRadius: RADIUS.lg,
                          border: `1px solid ${COLORS.slate[200]}`,
                        }}
                      >
                        <span style={{ fontSize: '20px' }}>{benefit.icon}</span>
                        <span style={{ color: COLORS.slate[700], fontSize: FONT_SIZE.sm }}>
                          {benefit.text}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Learning Goals */}
                <div style={{ marginBottom: SPACING[6] }}>
                  <h3
                    style={{
                      color: COLORS.slate[900],
                      fontSize: FONT_SIZE.xs,
                      fontWeight: FONT_WEIGHT.semibold,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      margin: `0 0 ${SPACING[3]} 0`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: SPACING[2],
                    }}
                  >
                    <Target size={16} style={{ color: feature.color }} />
                    Lernziele
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[2] }}>
                    {feature.learningGoals.map((goal, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + index * 0.05 }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: SPACING[2.5],
                          color: COLORS.slate[600],
                          fontSize: FONT_SIZE.sm,
                        }}
                      >
                        <div
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: RADIUS.full,
                            backgroundColor: hexToRgba(feature.color, 0.1),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Check size={12} style={{ color: feature.color }} />
                        </div>
                        {goal}
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Meta info badges */}
                <div
                  style={{
                    display: 'flex',
                    gap: SPACING[3],
                    flexWrap: 'wrap',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: SPACING[2],
                      padding: `${SPACING[2]} ${SPACING[4]}`,
                      backgroundColor: hexToRgba(feature.color, 0.1),
                      borderRadius: RADIUS.full,
                      color: feature.color,
                      fontSize: FONT_SIZE.xs,
                      fontWeight: FONT_WEIGHT.medium,
                    }}
                  >
                    <Clock size={14} />
                    {feature.duration}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: SPACING[2],
                      padding: `${SPACING[2]} ${SPACING[4]}`,
                      backgroundColor: COLORS.slate[100],
                      borderRadius: RADIUS.full,
                      color: COLORS.slate[600],
                      fontSize: FONT_SIZE.xs,
                      fontWeight: FONT_WEIGHT.medium,
                    }}
                  >
                    <Target size={14} />
                    {feature.idealFor}
                  </div>
                </div>
              </div>

              {/* Sticky Footer with checkbox and button */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: `${SPACING[4]} ${SPACING[6]}`,
                  borderTop: `1px solid ${COLORS.slate[200]}`,
                  gap: SPACING[3],
                  flexWrap: 'wrap',
                  backgroundColor: COLORS.white,
                  flexShrink: 0,
                }}
              >
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: SPACING[2],
                    cursor: 'pointer',
                    color: COLORS.slate[500],
                    fontSize: FONT_SIZE.sm,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={dontShowAgain}
                    onChange={(e) => setDontShowAgain(e.target.checked)}
                    style={{
                      width: '18px',
                      height: '18px',
                      accentColor: feature.color,
                      cursor: 'pointer',
                    }}
                  />
                  Nicht mehr anzeigen
                </label>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleClose}
                  style={{
                    background: feature.gradient,
                    color: COLORS.white,
                    border: 'none',
                    borderRadius: RADIUS.lg,
                    padding: `${SPACING[3]} ${SPACING[5]}`,
                    fontSize: FONT_SIZE.sm,
                    fontWeight: FONT_WEIGHT.semibold,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: SPACING[2],
                    boxShadow: coloredShadow(feature.color, 'md'),
                    transition: TRANSITIONS.normal,
                    flexShrink: 0,
                  }}
                >
                  Los geht's
                  <ChevronRight size={16} />
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  // Render via portal to document body to avoid transform ancestor issues
  return createPortal(modalContent, document.body);
};

export default FeatureInfoModal;
