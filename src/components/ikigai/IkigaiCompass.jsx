import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, Sparkles, ArrowRight, Heart, Star, Globe, Coins, Settings2, Check } from 'lucide-react';
import { useBranding } from '@/hooks/useBranding';
import { useMobile } from '@/hooks/useMobile';
import { Card, CardContent } from '@/components/ui/base/card';
import { Button } from '@/components/ui/base/button';
import AudioRecorder from '@/components/decision-board/AudioRecorder';
import DeviceSettingsDialog from '@/components/device-setup/DeviceSettingsDialog';

/**
 * Dimension icon components
 */
const DIMENSION_ICONS = {
  love: Heart,
  talent: Star,
  need: Globe,
  market: Coins,
};

/**
 * Circular Progress Ring Component
 */
const ProgressRing = ({ progress, size = 100, strokeWidth = 6 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 4) * circumference;

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      {/* Background ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth={strokeWidth}
      />
      {/* Progress ring with gradient */}
      <defs>
        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F43F5E" />
          <stop offset="33%" stopColor="#F59E0B" />
          <stop offset="66%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="url(#progressGradient)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.6s ease-out' }}
      />
    </svg>
  );
};

/**
 * IkigaiCompass - Visual Venn Diagram Component
 *
 * Displays 4 overlapping circles for the Ikigai model.
 * Each circle can be clicked to open a chat input.
 * Keywords are extracted and displayed as chips.
 */
const IkigaiCompass = ({
  dimensions,
  DIMENSIONS,
  onExtractKeywords,
  onUpdateDimension,
  onRemoveTag,
  allDimensionsFilled,
  onSynthesize,
  isSynthesizing,
  selectedMicrophoneId: propSelectedMicrophoneId,
  onMicrophoneChange: propOnMicrophoneChange,
}) => {
  const b = useBranding();
  const isMobile = useMobile(768);
  const [activeCircle, setActiveCircle] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [showDeviceSettings, setShowDeviceSettings] = useState(false);

  // Use props if provided, otherwise use local state
  const [localSelectedMicrophoneId, setLocalSelectedMicrophoneId] = useState(null);
  const selectedMicrophoneId = propSelectedMicrophoneId ?? localSelectedMicrophoneId;
  const setSelectedMicrophoneId = propOnMicrophoneChange ?? setLocalSelectedMicrophoneId;

  const textareaRef = useRef(null);

  // Focus textarea when chat opens
  useEffect(() => {
    if (activeCircle && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [activeCircle]);

  // Get current dimension config
  const currentDimension = activeCircle ? DIMENSIONS[activeCircle] : null;

  /**
   * Handle circle click
   */
  const handleCircleClick = (dimensionKey) => {
    setActiveCircle(dimensionKey);
    setInputValue(dimensions[dimensionKey]?.input || '');
  };

  /**
   * Handle submit input
   */
  const handleSubmit = async () => {
    if (!inputValue.trim() || !activeCircle || isExtracting) return;

    setIsExtracting(true);

    try {
      const keywords = await onExtractKeywords(activeCircle, inputValue.trim());

      if (keywords && keywords.length > 0) {
        // Merge with existing tags (avoid duplicates)
        const existingTags = dimensions[activeCircle]?.tags || [];
        const newTags = [...new Set([...existingTags, ...keywords])];

        await onUpdateDimension(activeCircle, inputValue.trim(), newTags);
      }

      // Close chat after successful extraction
      setActiveCircle(null);
      setInputValue('');
    } catch (err) {
      console.error('[IkigaiCompass] Extraction failed:', err);
    } finally {
      setIsExtracting(false);
    }
  };

  /**
   * Handle audio transcript from AudioRecorder
   */
  const handleTranscriptReady = useCallback((transcript) => {
    setInputValue((prev) => {
      if (prev.trim()) {
        return prev.trim() + '\n\n' + transcript;
      }
      return transcript;
    });
  }, []);

  /**
   * Check if dimension has tags
   */
  const hasTags = (key) => dimensions[key]?.tags?.length > 0;

  /**
   * Get fill count for progress
   */
  const filledCount = Object.keys(dimensions).filter((key) => hasTags(key)).length;

  /**
   * Render dimension circle for mobile (card style) - Enhanced design
   */
  const renderMobileCircle = (key, config) => {
    const Icon = DIMENSION_ICONS[key];
    const isFilled = hasTags(key);
    const tags = dimensions[key]?.tags || [];

    return (
      <motion.div
        key={key}
        whileTap={{ scale: 0.98 }}
        whileHover={{ scale: 1.01 }}
        onClick={() => handleCircleClick(key)}
        animate={isFilled ? {
          boxShadow: `0 4px 20px ${config.color}20`,
        } : {}}
        style={{
          background: isFilled
            ? `linear-gradient(135deg, ${config.color}10 0%, ${config.color}05 100%)`
            : 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.9) 100%)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRadius: '20px',
          padding: '18px',
          cursor: 'pointer',
          border: `2px solid ${isFilled ? config.color : 'rgba(0,0,0,0.06)'}`,
          boxShadow: isFilled
            ? `0 4px 20px ${config.color}20, inset 0 0 20px ${config.color}05`
            : '0 2px 12px rgba(0,0,0,0.06)',
          transition: 'all 0.3s ease',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle gradient overlay */}
        {isFilled && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '100px',
              height: '100px',
              background: `radial-gradient(circle at top right, ${config.color}15 0%, transparent 70%)`,
              pointerEvents: 'none',
            }}
          />
        )}

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          marginBottom: tags.length > 0 || !isFilled ? '14px' : 0,
          position: 'relative',
          zIndex: 1,
        }}>
          <motion.div
            animate={isFilled ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: isFilled
                ? `linear-gradient(135deg, ${config.color}30 0%, ${config.color}15 100%)`
                : `linear-gradient(135deg, ${config.color}15 0%, ${config.color}08 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: isFilled ? `0 4px 12px ${config.color}25` : 'none',
            }}
          >
            <Icon
              size={24}
              style={{
                color: config.color,
                filter: isFilled ? `drop-shadow(0 0 4px ${config.color}40)` : 'none',
              }}
            />
          </motion.div>
          <div style={{ flex: 1 }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: 700,
              color: isFilled ? config.color : b.textMain,
              marginBottom: '3px',
              textShadow: isFilled ? `0 0 20px ${config.color}20` : 'none',
            }}>
              {config.label}
            </h3>
            <p style={{
              fontSize: '12px',
              color: b.textMuted,
              lineHeight: 1.4,
            }}>
              {config.description}
            </p>
          </div>
          {isFilled && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: config.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 2px 8px ${config.color}40`,
              }}
            >
              <Check size={14} color="white" strokeWidth={3} />
            </motion.div>
          )}
        </div>

        {/* Tags */}
        {tags.length > 0 ? (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            position: 'relative',
            zIndex: 1,
          }}>
            {tags.slice(0, 4).map((tag, idx) => (
              <motion.span
                key={idx}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                style={{
                  padding: '5px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  background: `linear-gradient(135deg, white 0%, ${config.color}08 100%)`,
                  border: `1.5px solid ${config.color}`,
                  color: config.color,
                  boxShadow: `0 2px 6px ${config.color}15`,
                }}
              >
                {tag}
              </motion.span>
            ))}
            {tags.length > 4 && (
              <span
                style={{
                  padding: '5px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  background: `${config.color}10`,
                  border: `1.5px dashed ${config.color}60`,
                  color: config.color,
                }}
              >
                +{tags.length - 4}
              </span>
            )}
          </div>
        ) : (
          <p style={{
            fontSize: '13px',
            color: b.textMuted,
            fontStyle: 'italic',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: config.color,
              opacity: 0.5,
            }} />
            Tippe, um auszufüllen...
          </p>
        )}
      </motion.div>
    );
  };

  /**
   * Render desktop Venn diagram circle using CSS Grid positioning
   * Enhanced with glassmorphism and animations
   */
  const renderDesktopCircle = (key, config, gridArea) => {
    const Icon = DIMENSION_ICONS[key];
    const isFilled = hasTags(key);
    const tags = dimensions[key]?.tags || [];
    const circleSize = 'min(220px, 24vw)';

    return (
      <motion.div
        key={key}
        style={{
          gridArea,
          width: circleSize,
          height: circleSize,
          cursor: 'pointer',
          justifySelf: gridArea === 'love' || gridArea === 'need' ? 'end' : 'start',
          alignSelf: gridArea === 'love' || gridArea === 'talent' ? 'end' : 'start',
        }}
        whileHover={{ scale: 1.05, zIndex: 10 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => handleCircleClick(key)}
        animate={isFilled ? {
          boxShadow: [
            `0 0 20px ${config.color}30`,
            `0 0 40px ${config.color}40`,
            `0 0 20px ${config.color}30`,
          ],
        } : {}}
        transition={isFilled ? {
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        } : {}}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            // Glassmorphism effect
            background: isFilled
              ? `linear-gradient(135deg, ${config.color}35 0%, ${config.color}15 100%)`
              : `linear-gradient(135deg, ${config.color}15 0%, ${config.color}08 100%)`,
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: `2px solid ${isFilled ? `${config.color}80` : `${config.color}30`}`,
            boxShadow: isFilled
              ? `inset 0 0 30px ${config.color}20, 0 8px 32px ${config.color}25`
              : `inset 0 0 20px ${config.color}08, 0 4px 16px rgba(0,0,0,0.1)`,
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {/* Inner glow overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: `radial-gradient(circle at 30% 30%, ${config.color}20 0%, transparent 60%)`,
              pointerEvents: 'none',
            }}
          />

          {/* Icon with glow */}
          <motion.div
            style={{
              position: 'relative',
              zIndex: 1,
              marginBottom: '6px',
            }}
            animate={isFilled ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Icon
              size={32}
              style={{
                color: config.color,
                filter: isFilled ? `drop-shadow(0 0 8px ${config.color}60)` : 'none',
              }}
            />
          </motion.div>

          <span style={{
            fontWeight: 700,
            fontSize: '15px',
            color: config.color,
            textShadow: isFilled ? `0 0 10px ${config.color}40` : 'none',
            position: 'relative',
            zIndex: 1,
          }}>
            {config.label}
          </span>
          <span style={{
            fontSize: '11px',
            color: isFilled ? config.color : `${config.color}90`,
            textAlign: 'center',
            padding: '0 12px',
            opacity: 0.85,
            position: 'relative',
            zIndex: 1,
          }}>
            {config.description}
          </span>

          {/* Tags preview with floating animation */}
          {isFilled && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: '4px',
                marginTop: '8px',
                padding: '0 8px',
                maxHeight: '50px',
                overflow: 'hidden',
                position: 'relative',
                zIndex: 1,
              }}
            >
              {tags.slice(0, 2).map((tag, idx) => (
                <motion.span
                  key={idx}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '12px',
                    fontSize: '10px',
                    fontWeight: 600,
                    background: `linear-gradient(135deg, white 0%, ${config.color}10 100%)`,
                    border: `1.5px solid ${config.color}`,
                    color: config.color,
                    maxWidth: '75px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    boxShadow: `0 2px 8px ${config.color}20`,
                  }}
                >
                  {tag}
                </motion.span>
              ))}
              {tags.length > 2 && (
                <span
                  style={{
                    padding: '3px 8px',
                    borderRadius: '12px',
                    fontSize: '10px',
                    fontWeight: 600,
                    background: `${config.color}15`,
                    border: `1.5px dashed ${config.color}60`,
                    color: config.color,
                  }}
                >
                  +{tags.length - 2}
                </span>
              )}
            </motion.div>
          )}

          {/* Checkmark badge for filled circles */}
          {isFilled && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: config.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 2px 8px ${config.color}50`,
                zIndex: 2,
              }}
            >
              <Check size={14} color="white" strokeWidth={3} />
            </motion.div>
          )}
        </div>
      </motion.div>
    );
  };

  // Grid areas for Venn diagram layout
  const gridAreas = {
    love: 'love',
    talent: 'talent',
    need: 'need',
    market: 'market',
  };

  return (
    <div style={{ padding: isMobile ? b.space[4] : b.space[8], maxWidth: '900px', margin: '0 auto' }}>
      {/* Instructions */}
      <div style={{ textAlign: 'center', marginBottom: b.space[6] }}>
        <p style={{ fontSize: b.fontSize.sm, color: b.textMuted }}>
          Fülle die 4 Kreise mit deinen Gedanken. Dein KI-Coach extrahiert daraus automatisch deine Stärken und Ziele.
        </p>
      </div>

      {/* Progress indicator - enhanced design */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '10px',
        marginBottom: b.space[6],
        flexWrap: 'wrap',
      }}>
        {Object.entries(DIMENSIONS).map(([key, config]) => {
          const Icon = DIMENSION_ICONS[key];
          const filled = hasTags(key);
          return (
            <motion.div
              key={key}
              initial={false}
              animate={{
                scale: filled ? 1 : 1,
                boxShadow: filled ? `0 4px 16px ${config.color}25` : '0 2px 8px rgba(0,0,0,0.05)',
              }}
              whileHover={{ scale: 1.05 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                background: filled
                  ? `linear-gradient(135deg, ${config.color}20 0%, ${config.color}10 100%)`
                  : 'rgba(255,255,255,0.8)',
                color: filled ? config.color : b.textMuted,
                border: `2px solid ${filled ? config.color : 'rgba(0,0,0,0.08)'}`,
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                transition: 'all 0.3s ease',
              }}
              onClick={() => handleCircleClick(key)}
            >
              <Icon size={16} style={{ opacity: filled ? 1 : 0.6 }} />
              <span>{config.label}</span>
              {filled && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: config.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginLeft: '2px',
                  }}
                >
                  <Check size={11} color="white" strokeWidth={3} />
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Mobile: Card Grid */}
      {isMobile ? (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: b.space[3], marginBottom: b.space[4] }}>
            {Object.entries(DIMENSIONS).map(([key, config]) => renderMobileCircle(key, config))}
          </div>

          {/* Synthesize button - directly after mobile cards - Premium design */}
          {allDimensionsFilled && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              style={{ display: 'flex', justifyContent: 'center', marginBottom: b.space[6] }}
            >
              <motion.button
                onClick={onSynthesize}
                disabled={isSynthesizing}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 50%, #4F46E5 100%)',
                  color: 'white',
                  padding: '16px 24px',
                  fontSize: '16px',
                  fontWeight: 700,
                  borderRadius: '18px',
                  border: 'none',
                  boxShadow: '0 8px 32px rgba(139,92,246,0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  justifyContent: 'center',
                  cursor: isSynthesizing ? 'wait' : 'pointer',
                  opacity: isSynthesizing ? 0.85 : 1,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Shimmer effect */}
                {!isSynthesizing && (
                  <motion.div
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1 }}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '50%',
                      height: '100%',
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                      pointerEvents: 'none',
                    }}
                  />
                )}
                {isSynthesizing ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    <span>Analysiere...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    <span>Mein Ikigai finden</span>
                    <ArrowRight size={20} />
                  </>
                )}
              </motion.button>
            </motion.div>
          )}
        </>
      ) : (
        /* Desktop: Venn Diagram with CSS Grid - Enhanced overlap */
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateAreas: `
                "love talent"
                "center center"
                "need market"
              `,
              gridTemplateColumns: '1fr 1fr',
              gridTemplateRows: 'auto 1fr auto',
              gap: '0px',
              width: '100%',
              maxWidth: '520px',
              margin: '0 auto',
              marginBottom: b.space[4],
              padding: '0 10px',
            }}
          >
            {Object.entries(DIMENSIONS).map(([key, config]) =>
              renderDesktopCircle(key, config, gridAreas[key])
            )}

            {/* Center "Ikigai" indicator with progress ring */}
            <motion.div
              style={{
                gridArea: 'center',
                justifySelf: 'center',
                alignSelf: 'center',
                zIndex: 10,
                marginTop: '-60px',
                marginBottom: '-60px',
                position: 'relative',
              }}
              animate={allDimensionsFilled ? {
                scale: [1, 1.08, 1],
              } : {}}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              {/* Outer glow for completed state */}
              {allDimensionsFilled && (
                <motion.div
                  animate={{
                    opacity: [0.5, 0.8, 0.5],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  style={{
                    position: 'absolute',
                    inset: '-20px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)',
                    pointerEvents: 'none',
                  }}
                />
              )}

              {/* Progress ring wrapper */}
              <div style={{ position: 'relative' }}>
                <ProgressRing progress={filledCount} size={100} strokeWidth={5} />

                {/* Center content */}
                <div
                  style={{
                    position: 'absolute',
                    inset: '8px',
                    borderRadius: '50%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: allDimensionsFilled
                      ? 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 50%, #4F46E5 100%)'
                      : 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.9) 100%)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    boxShadow: allDimensionsFilled
                      ? '0 8px 32px rgba(139,92,246,0.4), inset 0 0 20px rgba(255,255,255,0.2)'
                      : '0 4px 16px rgba(0,0,0,0.1), inset 0 0 20px rgba(255,255,255,0.5)',
                    border: allDimensionsFilled
                      ? '2px solid rgba(255,255,255,0.3)'
                      : '2px solid rgba(0,0,0,0.05)',
                    transition: 'all 0.5s ease',
                  }}
                >
                  {allDimensionsFilled ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                      style={{ textAlign: 'center' }}
                    >
                      <Sparkles size={18} color="white" style={{ marginBottom: '2px' }} />
                      <span style={{
                        color: 'white',
                        fontWeight: 800,
                        fontSize: '13px',
                        letterSpacing: '0.5px',
                        textShadow: '0 2px 8px rgba(0,0,0,0.2)',
                      }}>
                        Ikigai
                      </span>
                    </motion.div>
                  ) : (
                    <div style={{ textAlign: 'center' }}>
                      <span style={{
                        color: b.textMain,
                        fontWeight: 800,
                        fontSize: '20px',
                        lineHeight: 1,
                      }}>
                        {filledCount}
                      </span>
                      <span style={{
                        color: b.textMuted,
                        fontWeight: 600,
                        fontSize: '12px',
                      }}>
                        /4
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Synthesize button - right after circles on desktop - Premium design */}
          {allDimensionsFilled && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              style={{ display: 'flex', justifyContent: 'center', marginBottom: b.space[6] }}
            >
              <motion.button
                onClick={onSynthesize}
                disabled={isSynthesizing}
                whileHover={{ scale: 1.03, boxShadow: '0 12px 40px rgba(139,92,246,0.4)' }}
                whileTap={{ scale: 0.98 }}
                style={{
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 50%, #4F46E5 100%)',
                  color: 'white',
                  padding: '18px 36px',
                  fontSize: '17px',
                  fontWeight: 700,
                  borderRadius: '20px',
                  border: 'none',
                  boxShadow: '0 8px 32px rgba(139,92,246,0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: isSynthesizing ? 'wait' : 'pointer',
                  opacity: isSynthesizing ? 0.85 : 1,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Shimmer effect */}
                {!isSynthesizing && (
                  <motion.div
                    animate={{
                      x: ['-100%', '200%'],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      repeatDelay: 1,
                    }}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '50%',
                      height: '100%',
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                      pointerEvents: 'none',
                    }}
                  />
                )}
                {isSynthesizing ? (
                  <>
                    <Loader2 className="animate-spin" size={22} />
                    <span>Analysiere dein Ikigai...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={22} />
                    <span>Mein Ikigai finden</span>
                    <ArrowRight size={22} />
                  </>
                )}
              </motion.button>
            </motion.div>
          )}
        </>
      )}

      {/* Tags display and edit area (Desktop only) - Enhanced glassmorphism design */}
      {!isMobile && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '16px',
            marginTop: b.space[4],
          }}
        >
          {Object.entries(DIMENSIONS).map(([key, config]) => {
            const tags = dimensions[key]?.tags || [];
            if (tags.length === 0) return null;

            const Icon = DIMENSION_ICONS[key];

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                style={{
                  background: `linear-gradient(135deg, ${config.color}12 0%, ${config.color}05 100%)`,
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: `1px solid ${config.color}25`,
                  borderRadius: '20px',
                  padding: '20px',
                  boxShadow: `0 4px 24px ${config.color}10`,
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '14px',
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '10px',
                    background: `linear-gradient(135deg, ${config.color}25 0%, ${config.color}15 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Icon size={18} style={{ color: config.color }} />
                  </div>
                  <span style={{
                    fontWeight: 700,
                    fontSize: '15px',
                    color: config.color,
                  }}>
                    {config.label}
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {tags.map((tag, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      whileHover={{ scale: 1.05 }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 14px',
                        borderRadius: '14px',
                        fontSize: '13px',
                        fontWeight: 600,
                        background: `linear-gradient(135deg, white 0%, ${config.color}08 100%)`,
                        border: `1.5px solid ${config.color}`,
                        color: config.color,
                        boxShadow: `0 2px 8px ${config.color}15`,
                        cursor: 'default',
                      }}
                    >
                      <span>{tag}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveTag(key, tag);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: '2px',
                          cursor: 'pointer',
                          display: 'flex',
                          borderRadius: '50%',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = `${config.color}20`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'none';
                        }}
                      >
                        <X size={14} color={config.color} />
                      </button>
                    </motion.div>
                  ))}
                  <motion.button
                    whileHover={{ scale: 1.05, borderStyle: 'solid' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleCircleClick(key)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '14px',
                      fontSize: '13px',
                      fontWeight: 600,
                      border: `2px dashed ${config.color}50`,
                      background: 'transparent',
                      color: config.color,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    + Mehr
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Chat overlay for dimension input */}
      <AnimatePresence>
        {activeCircle && currentDimension && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: b.zIndex.modal,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: b.overlayDark,
              backdropFilter: 'blur(4px)',
              padding: b.space[4],
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget && !isExtracting) {
                setActiveCircle(null);
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                background: b.cardBgColor,
                borderRadius: b.radius['2xl'],
                boxShadow: b.shadow.xl,
                width: '100%',
                maxWidth: '500px',
                overflow: 'hidden',
              }}
            >
              {/* Header */}
              <div
                style={{
                  padding: `${b.space[4]} ${b.space[6]}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: `${currentDimension.color}10`,
                  borderBottom: `1px solid ${currentDimension.color}20`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: b.space[3] }}>
                  {React.createElement(DIMENSION_ICONS[activeCircle], {
                    size: 28,
                    style: { color: currentDimension.color },
                  })}
                  <div>
                    <h3 style={{ fontWeight: b.fontWeight.bold, fontSize: b.fontSize.lg, color: currentDimension.color }}>
                      {currentDimension.title || currentDimension.label}
                    </h3>
                    <p style={{ fontSize: b.fontSize.sm, color: b.textSecondary }}>
                      {currentDimension.description}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => !isExtracting && setActiveCircle(null)}
                  disabled={isExtracting}
                  style={{
                    padding: b.space[2],
                    borderRadius: b.radius.lg,
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <X size={20} style={{ color: b.textMuted }} />
                </button>
              </div>

              {/* Question */}
              <div style={{ padding: `${b.space[4]} ${b.space[6]}` }}>
                <p style={{ color: b.textMain, fontSize: b.fontSize.base, fontWeight: b.fontWeight.medium, lineHeight: 1.5 }}>
                  {currentDimension.question}
                </p>
              </div>

              {/* Existing tags */}
              {dimensions[activeCircle]?.tags?.length > 0 && (
                <div style={{ padding: `0 ${b.space[6]} ${b.space[4]}` }}>
                  <p style={{ fontSize: b.fontSize.sm, color: b.textMuted, marginBottom: b.space[2] }}>Bereits erfasst:</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: b.space[2] }}>
                    {dimensions[activeCircle].tags.map((tag, idx) => (
                      <span
                        key={idx}
                        style={{
                          padding: `${b.space[1]} ${b.space[3]}`,
                          borderRadius: b.radius.full,
                          fontSize: b.fontSize.sm,
                          fontWeight: b.fontWeight.medium,
                          background: 'transparent',
                          border: `1.5px solid ${currentDimension.color}`,
                          color: currentDimension.color,
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <div style={{ padding: `0 ${b.space[6]} ${b.space[6]}` }}>
                <div style={{ position: 'relative' }}>
                  <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={currentDimension.placeholder}
                    rows={4}
                    disabled={isExtracting}
                    style={{
                      width: '100%',
                      padding: b.space[4],
                      paddingRight: b.space[12],
                      borderRadius: b.radius.xl,
                      border: `2px solid ${currentDimension.color}30`,
                      resize: 'none',
                      fontSize: b.fontSize.base,
                      fontFamily: 'inherit',
                      outline: 'none',
                      background: b.cardBgColor,
                    }}
                  />
                  <button
                    onClick={handleSubmit}
                    disabled={!inputValue.trim() || isExtracting}
                    style={{
                      position: 'absolute',
                      bottom: b.space[4],
                      right: b.space[4],
                      padding: b.space[3],
                      borderRadius: b.radius.full,
                      background: currentDimension.color,
                      color: 'white',
                      border: 'none',
                      cursor: inputValue.trim() && !isExtracting ? 'pointer' : 'not-allowed',
                      opacity: inputValue.trim() && !isExtracting ? 1 : 0.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isExtracting ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <Send size={20} />
                    )}
                  </button>
                </div>

                {/* Audio Recorder with Settings */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: b.space[2],
                  marginTop: b.space[3],
                }}>
                  <AudioRecorder
                    onTranscriptReady={handleTranscriptReady}
                    disabled={isExtracting}
                    warmUp={!!selectedMicrophoneId}
                    deviceId={selectedMicrophoneId}
                  />
                  <button
                    onClick={() => setShowDeviceSettings(true)}
                    title="Audio-Einstellungen"
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: b.radius.full,
                      border: `1px solid ${b.borderColor}`,
                      background: b.cardBgHover,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Settings2 size={18} style={{ color: b.textMuted }} />
                  </button>
                </div>

                <p style={{ fontSize: b.fontSize.xs, color: b.textMuted, marginTop: b.space[2], textAlign: 'center' }}>
                  Tippe oder sprich deine Gedanken ein
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Device Settings Dialog */}
      <DeviceSettingsDialog
        isOpen={showDeviceSettings}
        onClose={() => setShowDeviceSettings(false)}
        mode="audio"
        selectedMicrophoneId={selectedMicrophoneId}
        onMicrophoneChange={setSelectedMicrophoneId}
      />
    </div>
  );
};

export default IkigaiCompass;
