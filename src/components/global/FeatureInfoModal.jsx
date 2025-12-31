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
import { usePartner } from '@/context/PartnerContext';

const CLOSE_ICON_SIZE = 24;

// Debug logging prefix
const DEBUG_PREFIX = '[FEATURE_INFO_MODAL]';

// Session-based tracking to prevent double auto-show (survives StrictMode remounts)
const AUTO_SHOW_SESSION_KEY = 'karriereheld_feature_info_session_shown';

// GLOBAL tracking to ensure only ONE modal per feature can be open at a time
// This prevents duplicate modals from any source
const globalOpenModals = new Set();
const globalMountedInstances = new Map(); // featureId -> mountId

const isAutoShownThisSession = (featureId) => {
  try {
    const shown = JSON.parse(sessionStorage.getItem(AUTO_SHOW_SESSION_KEY) || '{}');
    return shown[featureId] === true;
  } catch {
    return false;
  }
};

const setAutoShownThisSession = (featureId) => {
  try {
    const shown = JSON.parse(sessionStorage.getItem(AUTO_SHOW_SESSION_KEY) || '{}');
    shown[featureId] = true;
    sessionStorage.setItem(AUTO_SHOW_SESSION_KEY, JSON.stringify(shown));
  } catch {
    // Ignore storage errors
  }
};

/**
 * FeatureInfoModal Component
 */
const FeatureInfoModal = ({ featureId, isOpen, onClose, showOnMount = false }) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [internalOpen, setInternalOpen] = useState(false);
  const hasAutoShownRef = useRef(false);
  const mountIdRef = useRef(Math.random().toString(36).substr(2, 9));

  // Get user context for API sync
  const { isAuthenticated, demoCode } = usePartner();

  const feature = FEATURE_DESCRIPTIONS[featureId];

  // Log on mount/unmount and track globally
  useEffect(() => {
    const mountId = mountIdRef.current;
    const existingMountId = globalMountedInstances.get(featureId);

    console.log(`${DEBUG_PREFIX} 🔵 MOUNT featureId="${featureId}" mountId=${mountId} showOnMount=${showOnMount} existingInstance=${existingMountId || 'none'}`);

    // Register this instance
    globalMountedInstances.set(featureId, mountId);

    return () => {
      console.log(`${DEBUG_PREFIX} 🔴 UNMOUNT featureId="${featureId}" mountId=${mountId}`);
      // Only remove if this is the current instance
      if (globalMountedInstances.get(featureId) === mountId) {
        globalMountedInstances.delete(featureId);
      }
      // Also remove from open modals
      globalOpenModals.delete(featureId);
    };
  }, [featureId, showOnMount]);

  // Handle auto-show on mount
  // Uses both ref (for within-render protection) and sessionStorage (for StrictMode/remount protection)
  useEffect(() => {
    const isDismissed = isFeatureInfoDismissed(featureId);
    const isSessionShown = isAutoShownThisSession(featureId);
    const isGloballyOpen = globalOpenModals.has(featureId);

    console.log(`${DEBUG_PREFIX} 🔄 Auto-show effect for "${featureId}":`, {
      showOnMount,
      hasFeature: !!feature,
      isDismissed,
      hasAutoShownRef: hasAutoShownRef.current,
      isSessionShown,
      isGloballyOpen,
      willShow: showOnMount && feature && !isDismissed && !hasAutoShownRef.current && !isSessionShown && !isGloballyOpen,
    });

    if (showOnMount && feature && !isDismissed && !hasAutoShownRef.current && !isSessionShown && !isGloballyOpen) {
      console.log(`${DEBUG_PREFIX} ✅ Will auto-show "${featureId}" in 400ms`);
      hasAutoShownRef.current = true;
      setAutoShownThisSession(featureId);
      globalOpenModals.add(featureId); // Mark as globally open immediately

      // Track if component is still mounted
      let isMounted = true;

      const timer = setTimeout(() => {
        // Double-check all conditions again in case of race condition
        const alreadyOpen = globalOpenModals.has(featureId) && internalOpen;
        console.log(`${DEBUG_PREFIX} 🎉 Timer fired for "${featureId}": isMounted=${isMounted}, alreadyOpen=${alreadyOpen}`);

        if (isMounted && !internalOpen) {
          setInternalOpen(true);
        } else if (!isMounted) {
          console.log(`${DEBUG_PREFIX} ⚠️ Component unmounted before timer, skipping open`);
          globalOpenModals.delete(featureId);
        }
      }, 400);

      return () => {
        console.log(`${DEBUG_PREFIX} 🧹 Cleanup: clearing timer for "${featureId}"`);
        isMounted = false;
        clearTimeout(timer);
      };
    }
  }, [showOnMount, featureId, feature, internalOpen]);

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
    console.log(`${DEBUG_PREFIX} 🚪 handleClose for "${featureId}"`);
    // Always save the checkbox state (true or false)
    // Pass user context for API sync
    if (feature) {
      setFeatureInfoDismissed(featureId, dontShowAgain, isAuthenticated, demoCode);
    }
    setInternalOpen(false);
    globalOpenModals.delete(featureId); // Remove from global tracking
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

  // CRITICAL: Check if another instance already has this modal open
  // This prevents duplicate modals even if multiple components try to open the same featureId
  const currentMountId = mountIdRef.current;
  const registeredMountId = globalMountedInstances.get(featureId);
  if (registeredMountId && registeredMountId !== currentMountId) {
    console.log(`${DEBUG_PREFIX} ⛔ Blocking render - another instance (${registeredMountId}) owns this modal`);
    return null;
  }

  // Mark as globally open when rendering
  if (!globalOpenModals.has(featureId)) {
    globalOpenModals.add(featureId);
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
        className="fixed inset-0 w-full h-full backdrop-blur-lg z-[999999] flex items-center justify-center p-4 pt-[calc(16px+env(safe-area-inset-top,0px))] pb-[calc(16px+env(safe-area-inset-bottom,0px))] box-border"
        style={{
          backgroundColor: hexToRgba(COLORS.slate[900], 0.7),
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
          className="bg-white rounded-2xl max-w-[500px] w-full max-h-[min(calc(100vh-100px),700px)] overflow-hidden shadow-2xl border border-slate-200 flex flex-col"
        >
          {/* Header with gradient */}
          <div
            className="px-6 pt-6 pb-8 relative overflow-hidden flex-shrink-0"
            style={{ background: feature.gradient }}
          >
            {/* Decorative circles */}
            <div className="absolute -top-10 -right-10 w-[120px] h-[120px] rounded-full bg-white/10 pointer-events-none" />
            <div className="absolute -bottom-5 left-1/4 w-[60px] h-[60px] rounded-full bg-white/[0.08] pointer-events-none" />

            {/* Close button - LARGE and prominent */}
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 w-11 h-11 rounded-full bg-white/25 border-none cursor-pointer flex items-center justify-center text-white transition-all z-10 hover:bg-white/40"
            >
              <X size={CLOSE_ICON_SIZE} strokeWidth={2.5} />
            </button>

            {/* Icon and Title */}
            <div className="relative z-[1]">
              <div className="text-[44px] mb-3 drop-shadow-md">
                {feature.icon}
              </div>
              <h2 className="text-white text-2xl font-bold m-0 drop-shadow-sm">
                {feature.title}
              </h2>
              <p className="text-white/90 text-sm mt-1 mb-0 font-medium">
                {feature.subtitle}
              </p>
            </div>
          </div>

          {/* Content - scrollable */}
          <div className="p-5 px-6 flex-1 overflow-y-auto min-h-0 overflow-touch">
            {/* Description */}
            <p className="text-slate-600 text-sm leading-relaxed m-0 mb-5">
              {feature.description}
            </p>

            {/* Benefits */}
            <div className="mb-5">
              <h3 className="text-slate-900 text-[11px] font-semibold uppercase tracking-wide m-0 mb-2.5 flex items-center gap-2">
                <Sparkles size={14} style={{ color: feature.color }} />
                Vorteile
              </h3>
              <div className="flex flex-col gap-2">
                {feature.benefits.map((benefit, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2.5 px-3 py-2.5 bg-slate-50 rounded-lg border border-slate-200"
                  >
                    <span className="text-lg flex-shrink-0">{benefit.icon}</span>
                    <span className="text-slate-700 text-[13px]">
                      {benefit.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Learning Goals */}
            <div className="mb-4">
              <h3 className="text-slate-900 text-[11px] font-semibold uppercase tracking-wide m-0 mb-2.5 flex items-center gap-2">
                <Target size={14} style={{ color: feature.color }} />
                Lernziele
              </h3>
              <div className="flex flex-col gap-2">
                {feature.learningGoals.map((goal, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2.5 text-slate-600 text-[13px]"
                  >
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: hexToRgba(feature.color, 0.15) }}
                    >
                      <Check size={12} style={{ color: feature.color }} />
                    </div>
                    {goal}
                  </div>
                ))}
              </div>
            </div>

            {/* Meta info badges */}
            <div className="flex gap-2 flex-wrap">
              <div
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: hexToRgba(feature.color, 0.1),
                  color: feature.color,
                }}
              >
                <Clock size={14} />
                {feature.duration}
              </div>
              <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 rounded-full text-slate-600 text-xs font-medium">
                <Target size={14} />
                {feature.idealFor}
              </div>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 gap-4 flex-wrap bg-white flex-shrink-0">
            <label className="flex items-center gap-2.5 cursor-pointer text-slate-500 text-[13px]">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="w-[18px] h-[18px] cursor-pointer"
                style={{ accentColor: feature.color }}
              />
              Nicht mehr automatisch anzeigen
            </label>

            <button
              onClick={handleClose}
              className="text-white border-none rounded-xl px-6 py-3 text-[15px] font-semibold cursor-pointer flex items-center gap-1.5 transition-all flex-shrink-0"
              style={{
                background: feature.gradient,
                boxShadow: coloredShadow(feature.color, 'md'),
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
