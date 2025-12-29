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

// Standard icon size for close buttons
const CLOSE_ICON_SIZE = 18;

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
  const [mounted, setMounted] = useState(false);

  const feature = FEATURE_DESCRIPTIONS[featureId];

  // Track mounting for portal safety
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Handle auto-show on mount
  useEffect(() => {
    if (showOnMount && feature && !isFeatureInfoDismissed(featureId)) {
      const timer = setTimeout(() => setInternalOpen(true), 400);
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

  // Don't render anything if feature not found or not mounted
  if (!feature || !mounted) {
    if (!feature && featureId) {
      console.warn(`FeatureInfoModal: Unknown feature ID "${featureId}"`);
    }
    return null;
  }

  // Only render portal when modal should be visible
  if (!internalOpen) {
    return null;
  }

  // Modal content
  const modalContent = (
    <AnimatePresence mode="wait">
      <motion.div
        key="modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={handleClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
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
          key="modal-content"
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
              padding: `${SPACING[6]} ${SPACING[6]} ${SPACING[8]}`,
              position: 'relative',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            {/* Decorative circles - pointerEvents none to not block clicks */}
            <div
              style={{
                position: 'absolute',
                top: '-40px',
                right: '-40px',
                width: '120px',
                height: '120px',
                borderRadius: RADIUS.full,
                background: 'rgba(255, 255, 255, 0.1)',
                pointerEvents: 'none',
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
                pointerEvents: 'none',
              }}
            />

            {/* Close button */}
            <button
              onClick={handleClose}
              style={{
                position: 'absolute',
                top: SPACING[3],
                right: SPACING[3],
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
                zIndex: 10,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)')}
            >
              <X size={CLOSE_ICON_SIZE} />
            </button>

            {/* Icon and Title */}
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div
                style={{
                  fontSize: '40px',
                  marginBottom: SPACING[3],
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))',
                }}
              >
                {feature.icon}
              </div>
              <h2
                style={{
                  color: COLORS.white,
                  fontSize: FONT_SIZE['2xl'],
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
                  fontSize: FONT_SIZE.sm,
                  margin: `${SPACING[1]} 0 0 0`,
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
              padding: `${SPACING[4]} ${SPACING[5]}`,
              flex: 1,
              overflowY: 'auto',
              minHeight: 0,
            }}
          >
            {/* Description */}
            <p
              style={{
                color: COLORS.slate[600],
                fontSize: FONT_SIZE.sm,
                lineHeight: 1.7,
                margin: `0 0 ${SPACING[5]} 0`,
              }}
            >
              {feature.description}
            </p>

            {/* Benefits */}
            <div style={{ marginBottom: SPACING[5] }}>
              <h3
                style={{
                  color: COLORS.slate[900],
                  fontSize: FONT_SIZE.xs,
                  fontWeight: FONT_WEIGHT.semibold,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  margin: `0 0 ${SPACING[2]} 0`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: SPACING[2],
                }}
              >
                <Sparkles size={14} style={{ color: feature.color }} />
                Vorteile
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[2] }}>
                {feature.benefits.map((benefit, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: SPACING[2],
                      padding: `${SPACING[2]} ${SPACING[3]}`,
                      backgroundColor: COLORS.slate[50],
                      borderRadius: RADIUS.md,
                      border: `1px solid ${COLORS.slate[200]}`,
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>{benefit.icon}</span>
                    <span style={{ color: COLORS.slate[700], fontSize: FONT_SIZE.xs }}>
                      {benefit.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Learning Goals */}
            <div style={{ marginBottom: SPACING[4] }}>
              <h3
                style={{
                  color: COLORS.slate[900],
                  fontSize: FONT_SIZE.xs,
                  fontWeight: FONT_WEIGHT.semibold,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  margin: `0 0 ${SPACING[2]} 0`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: SPACING[2],
                }}
              >
                <Target size={14} style={{ color: feature.color }} />
                Lernziele
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[1.5] }}>
                {feature.learningGoals.map((goal, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: SPACING[2],
                      color: COLORS.slate[600],
                      fontSize: FONT_SIZE.xs,
                    }}
                  >
                    <div
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: RADIUS.full,
                        backgroundColor: hexToRgba(feature.color, 0.1),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Check size={10} style={{ color: feature.color }} />
                    </div>
                    {goal}
                  </div>
                ))}
              </div>
            </div>

            {/* Meta info badges */}
            <div
              style={{
                display: 'flex',
                gap: SPACING[2],
                flexWrap: 'wrap',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: SPACING[1],
                  padding: `${SPACING[1]} ${SPACING[3]}`,
                  backgroundColor: hexToRgba(feature.color, 0.1),
                  borderRadius: RADIUS.full,
                  color: feature.color,
                  fontSize: FONT_SIZE.xs,
                  fontWeight: FONT_WEIGHT.medium,
                }}
              >
                <Clock size={12} />
                {feature.duration}
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: SPACING[1],
                  padding: `${SPACING[1]} ${SPACING[3]}`,
                  backgroundColor: COLORS.slate[100],
                  borderRadius: RADIUS.full,
                  color: COLORS.slate[600],
                  fontSize: FONT_SIZE.xs,
                  fontWeight: FONT_WEIGHT.medium,
                }}
              >
                <Target size={12} />
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
              padding: `${SPACING[3]} ${SPACING[5]}`,
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
                fontSize: FONT_SIZE.xs,
              }}
            >
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                style={{
                  width: '16px',
                  height: '16px',
                  accentColor: feature.color,
                  cursor: 'pointer',
                }}
              />
              Nicht mehr anzeigen
            </label>

            <button
              onClick={handleClose}
              style={{
                background: feature.gradient,
                color: COLORS.white,
                border: 'none',
                borderRadius: RADIUS.md,
                padding: `${SPACING[2]} ${SPACING[4]}`,
                fontSize: FONT_SIZE.sm,
                fontWeight: FONT_WEIGHT.semibold,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: SPACING[1],
                boxShadow: coloredShadow(feature.color, 'md'),
                transition: TRANSITIONS.normal,
                flexShrink: 0,
              }}
            >
              Los geht's
              <ChevronRight size={16} />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  // Render via portal to document body
  return createPortal(modalContent, document.body);
};

export default FeatureInfoModal;
