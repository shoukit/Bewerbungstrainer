/**
 * FeatureInfoModal - Stylish info popup for feature descriptions
 *
 * Can be used in two ways:
 * 1. Controlled mode: Pass isOpen and onClose props (used by FeatureInfoButton)
 * 2. Auto-show mode: Pass showOnMount to auto-show on first visit
 */

import React, { useState, useEffect, useRef } from 'react';
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

const CLOSE_ICON_SIZE = 24;

/**
 * FeatureInfoModal Component
 */
const FeatureInfoModal = ({ featureId, isOpen, onClose, showOnMount = false }) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [internalOpen, setInternalOpen] = useState(false);
  const hasAutoShownRef = useRef(false);

  const feature = FEATURE_DESCRIPTIONS[featureId];

  // Handle auto-show on mount
  useEffect(() => {
    if (showOnMount && feature && !isFeatureInfoDismissed(featureId) && !hasAutoShownRef.current) {
      hasAutoShownRef.current = true;
      const timer = setTimeout(() => setInternalOpen(true), 400);
      return () => clearTimeout(timer);
    }
  }, [showOnMount, featureId, feature]);

  // Sync external isOpen with internal state and load saved checkbox state
  useEffect(() => {
    if (isOpen !== undefined) {
      setInternalOpen(isOpen);
      // When opening, load the saved preference
      if (isOpen && featureId) {
        setDontShowAgain(isFeatureInfoDismissed(featureId));
      }
    }
  }, [isOpen, featureId]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (internalOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [internalOpen]);

  const handleClose = () => {
    // Always save the checkbox state (true or false)
    if (feature) {
      setFeatureInfoDismissed(featureId, dontShowAgain);
    }
    setInternalOpen(false);
    onClose?.();
  };

  if (!feature) {
    if (featureId) {
      console.warn(`FeatureInfoModal: Unknown feature ID "${featureId}"`);
    }
    return null;
  }

  if (!internalOpen) {
    return null;
  }

  // Modal content - always renders as a fixed overlay
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
          width: '100%',
          height: '100%',
          backgroundColor: hexToRgba(COLORS.slate[900], 0.7),
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))',
          paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
          boxSizing: 'border-box',
          // Prevent any parent transforms from affecting positioning
          contain: 'layout',
        }}
      >
        {/* Modal */}
        <motion.div
          key="modal-content"
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: COLORS.white,
            borderRadius: RADIUS['2xl'],
            maxWidth: '500px',
            width: '100%',
            // Use vh as fallback, with max constraint for mobile
            maxHeight: 'min(calc(100vh - 100px), 700px)',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
            border: `1px solid ${COLORS.slate[200]}`,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header with gradient */}
          <div
            style={{
              background: feature.gradient,
              padding: '24px 24px 32px',
              position: 'relative',
              overflow: 'hidden',
              flexShrink: 0,
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
                borderRadius: '50%',
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
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.08)',
                pointerEvents: 'none',
              }}
            />

            {/* Close button - LARGE and prominent */}
            <button
              onClick={handleClose}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: COLORS.white,
                transition: TRANSITIONS.normal,
                zIndex: 10,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.4)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)')}
            >
              <X size={CLOSE_ICON_SIZE} strokeWidth={2.5} />
            </button>

            {/* Icon and Title */}
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div
                style={{
                  fontSize: '44px',
                  marginBottom: '12px',
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))',
                }}
              >
                {feature.icon}
              </div>
              <h2
                style={{
                  color: COLORS.white,
                  fontSize: '24px',
                  fontWeight: 700,
                  margin: 0,
                  textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}
              >
                {feature.title}
              </h2>
              <p
                style={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '14px',
                  margin: '4px 0 0 0',
                  fontWeight: 500,
                }}
              >
                {feature.subtitle}
              </p>
            </div>
          </div>

          {/* Content - scrollable */}
          <div
            style={{
              padding: '20px 24px',
              flex: 1,
              overflowY: 'auto',
              minHeight: 0,
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {/* Description */}
            <p
              style={{
                color: COLORS.slate[600],
                fontSize: '14px',
                lineHeight: 1.7,
                margin: '0 0 20px 0',
              }}
            >
              {feature.description}
            </p>

            {/* Benefits */}
            <div style={{ marginBottom: '20px' }}>
              <h3
                style={{
                  color: COLORS.slate[900],
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  margin: '0 0 10px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Sparkles size={14} style={{ color: feature.color }} />
                Vorteile
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {feature.benefits.map((benefit, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      backgroundColor: COLORS.slate[50],
                      borderRadius: '8px',
                      border: `1px solid ${COLORS.slate[200]}`,
                    }}
                  >
                    <span style={{ fontSize: '18px', flexShrink: 0 }}>{benefit.icon}</span>
                    <span style={{ color: COLORS.slate[700], fontSize: '13px' }}>
                      {benefit.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Learning Goals */}
            <div style={{ marginBottom: '16px' }}>
              <h3
                style={{
                  color: COLORS.slate[900],
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  margin: '0 0 10px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Target size={14} style={{ color: feature.color }} />
                Lernziele
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {feature.learningGoals.map((goal, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      color: COLORS.slate[600],
                      fontSize: '13px',
                    }}
                  >
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: hexToRgba(feature.color, 0.15),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Check size={12} style={{ color: feature.color }} />
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
                gap: '8px',
                flexWrap: 'wrap',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  backgroundColor: hexToRgba(feature.color, 0.1),
                  borderRadius: '20px',
                  color: feature.color,
                  fontSize: '12px',
                  fontWeight: 500,
                }}
              >
                <Clock size={14} />
                {feature.duration}
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  backgroundColor: COLORS.slate[100],
                  borderRadius: '20px',
                  color: COLORS.slate[600],
                  fontSize: '12px',
                  fontWeight: 500,
                }}
              >
                <Target size={14} />
                {feature.idealFor}
              </div>
            </div>
          </div>

          {/* Sticky Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 24px',
              borderTop: `1px solid ${COLORS.slate[200]}`,
              gap: '16px',
              flexWrap: 'wrap',
              backgroundColor: COLORS.white,
              flexShrink: 0,
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                color: COLORS.slate[500],
                fontSize: '13px',
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
              Nicht mehr automatisch anzeigen
            </label>

            <button
              onClick={handleClose}
              style={{
                background: feature.gradient,
                color: COLORS.white,
                border: 'none',
                borderRadius: '10px',
                padding: '12px 24px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: coloredShadow(feature.color, 'md'),
                transition: TRANSITIONS.normal,
                flexShrink: 0,
              }}
            >
              Los geht's
              <ChevronRight size={18} />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  // When used with showOnMount, we need to portal ourselves
  // When used via FeatureInfoButton, the button handles portaling
  if (showOnMount) {
    return createPortal(modalContent, document.body);
  }

  // Direct render for controlled mode (button handles portal)
  return modalContent;
};

export default FeatureInfoModal;
