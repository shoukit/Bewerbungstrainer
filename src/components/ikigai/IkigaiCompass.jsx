import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, Sparkles, ArrowRight, Heart, Star, Globe, Coins, Settings2 } from 'lucide-react';
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
}) => {
  const b = useBranding();
  const isMobile = useMobile(768);
  const [activeCircle, setActiveCircle] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [showDeviceSettings, setShowDeviceSettings] = useState(false);
  const [selectedMicrophoneId, setSelectedMicrophoneId] = useState(null);
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
   * Render dimension circle for mobile (card style)
   */
  const renderMobileCircle = (key, config) => {
    const Icon = DIMENSION_ICONS[key];
    const isFilled = hasTags(key);
    const tags = dimensions[key]?.tags || [];

    return (
      <motion.div
        key={key}
        whileTap={{ scale: 0.98 }}
        onClick={() => handleCircleClick(key)}
        style={{
          background: b.cardBgColor,
          borderRadius: b.radius.xl,
          padding: b.space[4],
          cursor: 'pointer',
          border: `2px solid ${isFilled ? config.color : b.borderColor}`,
          boxShadow: isFilled ? b.coloredShadow(config.color, 'sm') : b.shadow.xs,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: b.space[3], marginBottom: b.space[3] }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: b.radius.lg,
              background: `${config.color}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon size={22} style={{ color: config.color }} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: b.fontSize.base, fontWeight: b.fontWeight.semibold, color: b.textMain, marginBottom: '2px' }}>
              {config.label}
            </h3>
            <p style={{ fontSize: b.fontSize.xs, color: b.textMuted }}>
              {config.description}
            </p>
          </div>
          {isFilled && (
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: b.radius.full,
                background: config.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ color: 'white', fontSize: b.fontSize.xs, fontWeight: b.fontWeight.bold }}>✓</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {tags.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: b.space[2] }}>
            {tags.slice(0, 4).map((tag, idx) => (
              <span
                key={idx}
                style={{
                  padding: `${b.space[1]} ${b.space[2]}`,
                  borderRadius: b.radius.full,
                  fontSize: b.fontSize.xs,
                  fontWeight: b.fontWeight.medium,
                  background: 'transparent',
                  border: `1.5px solid ${config.color}`,
                  color: config.color,
                }}
              >
                {tag}
              </span>
            ))}
            {tags.length > 4 && (
              <span
                style={{
                  padding: `${b.space[1]} ${b.space[2]}`,
                  borderRadius: b.radius.full,
                  fontSize: b.fontSize.xs,
                  fontWeight: b.fontWeight.medium,
                  background: 'transparent',
                  border: `1.5px solid ${config.color}50`,
                  color: config.color,
                }}
              >
                +{tags.length - 4}
              </span>
            )}
          </div>
        ) : (
          <p style={{ fontSize: b.fontSize.sm, color: b.textMuted, fontStyle: 'italic' }}>
            Tippe, um auszufüllen...
          </p>
        )}
      </motion.div>
    );
  };

  /**
   * Render desktop Venn diagram circle using CSS Grid positioning
   */
  const renderDesktopCircle = (key, config, gridArea) => {
    const Icon = DIMENSION_ICONS[key];
    const isFilled = hasTags(key);
    const tags = dimensions[key]?.tags || [];
    const circleSize = 'min(200px, 22vw)';

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
        whileHover={{ scale: 1.03, zIndex: 10 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => handleCircleClick(key)}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: b.radius.full,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: isFilled ? `${config.color}25` : `${config.color}10`,
            border: `3px solid ${isFilled ? config.color : `${config.color}40`}`,
            boxShadow: isFilled ? b.coloredShadow(config.color, 'md') : 'none',
            transition: 'background 0.3s ease, border 0.3s ease, box-shadow 0.3s ease',
          }}
        >
          <Icon size={28} style={{ color: config.color, marginBottom: b.space[1] }} />
          <span style={{ fontWeight: b.fontWeight.semibold, fontSize: b.fontSize.sm, color: config.color }}>
            {config.label}
          </span>
          <span style={{ fontSize: '11px', color: `${config.color}99`, textAlign: 'center', padding: `0 ${b.space[2]}` }}>
            {config.description}
          </span>

          {/* Tags preview */}
          {isFilled && (
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '3px', marginTop: b.space[1], padding: `0 ${b.space[1]}`, maxHeight: '44px', overflow: 'hidden' }}>
              {tags.slice(0, 2).map((tag, idx) => (
                <span
                  key={idx}
                  style={{
                    padding: '2px 6px',
                    borderRadius: b.radius.full,
                    fontSize: '10px',
                    fontWeight: b.fontWeight.medium,
                    background: 'white',
                    border: `1.5px solid ${config.color}`,
                    color: config.color,
                    maxWidth: '70px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {tag}
                </span>
              ))}
              {tags.length > 2 && (
                <span
                  style={{
                    padding: '2px 6px',
                    borderRadius: b.radius.full,
                    fontSize: '10px',
                    fontWeight: b.fontWeight.medium,
                    background: 'white',
                    border: `1.5px solid ${config.color}50`,
                    color: config.color,
                  }}
                >
                  +{tags.length - 2}
                </span>
              )}
            </div>
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

      {/* Progress indicator */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: b.space[2], marginBottom: b.space[6], flexWrap: 'wrap' }}>
        {Object.entries(DIMENSIONS).map(([key, config]) => {
          const Icon = DIMENSION_ICONS[key];
          const filled = hasTags(key);
          return (
            <div
              key={key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: b.space[1],
                padding: `${b.space[1]} ${b.space[3]}`,
                borderRadius: b.radius.full,
                fontSize: b.fontSize.sm,
                fontWeight: b.fontWeight.medium,
                background: filled ? `${config.color}15` : b.cardBgHover,
                color: filled ? config.color : b.textMuted,
                border: `1px solid ${filled ? config.color : b.borderColor}`,
              }}
            >
              <Icon size={14} />
              <span>{config.label}</span>
              {filled && <span>✓</span>}
            </div>
          );
        })}
      </div>

      {/* Mobile: Card Grid */}
      {isMobile ? (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: b.space[3], marginBottom: b.space[4] }}>
            {Object.entries(DIMENSIONS).map(([key, config]) => renderMobileCircle(key, config))}
          </div>

          {/* Synthesize button - directly after mobile cards */}
          {allDimensionsFilled && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', justifyContent: 'center', marginBottom: b.space[6] }}
            >
              <Button
                onClick={onSynthesize}
                disabled={isSynthesizing}
                size="lg"
                style={{
                  background: b.headerGradient,
                  color: 'white',
                  padding: `${b.space[3]} ${b.space[6]}`,
                  fontSize: b.fontSize.base,
                  fontWeight: b.fontWeight.semibold,
                  borderRadius: b.radius.xl,
                  boxShadow: b.shadow.lg,
                  display: 'flex',
                  alignItems: 'center',
                  gap: b.space[2],
                  width: '100%',
                  justifyContent: 'center',
                }}
              >
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
              </Button>
            </motion.div>
          )}
        </>
      ) : (
        /* Desktop: Venn Diagram with CSS Grid */
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
              gridTemplateRows: 'auto auto auto',
              gap: '-30px',
              width: '100%',
              maxWidth: '480px',
              margin: '0 auto',
              marginBottom: b.space[4],
            }}
          >
            {Object.entries(DIMENSIONS).map(([key, config]) =>
              renderDesktopCircle(key, config, gridAreas[key])
            )}

            {/* Center "Ikigai" indicator */}
            <motion.div
              style={{
                gridArea: 'center',
                justifySelf: 'center',
                alignSelf: 'center',
                zIndex: 10,
                marginTop: '-50px',
                marginBottom: '-50px',
              }}
              animate={{
                scale: allDimensionsFilled ? [1, 1.05, 1] : 1,
              }}
              transition={{
                duration: 2,
                repeat: allDimensionsFilled ? Infinity : 0,
                ease: 'easeInOut',
              }}
            >
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: b.radius.full,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: allDimensionsFilled
                    ? b.headerGradient
                    : b.cardBgHover,
                  boxShadow: allDimensionsFilled ? b.shadow.lg : b.shadow.sm,
                  border: `2px solid ${allDimensionsFilled ? 'transparent' : b.borderColor}`,
                }}
              >
                <span style={{
                  color: allDimensionsFilled ? 'white' : b.textMuted,
                  fontWeight: b.fontWeight.bold,
                  fontSize: b.fontSize.base,
                }}>
                  {allDimensionsFilled ? 'Ikigai' : `${filledCount}/4`}
                </span>
              </div>
            </motion.div>
          </div>

          {/* Synthesize button - right after circles on desktop */}
          {allDimensionsFilled && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', justifyContent: 'center', marginBottom: b.space[6] }}
            >
              <Button
                onClick={onSynthesize}
                disabled={isSynthesizing}
                size="lg"
                style={{
                  background: b.headerGradient,
                  color: 'white',
                  padding: `${b.space[4]} ${b.space[8]}`,
                  fontSize: b.fontSize.lg,
                  fontWeight: b.fontWeight.semibold,
                  borderRadius: b.radius.xl,
                  boxShadow: b.shadow.lg,
                  display: 'flex',
                  alignItems: 'center',
                  gap: b.space[3],
                }}
              >
                {isSynthesizing ? (
                  <>
                    <Loader2 className="animate-spin" size={24} />
                    <span>Analysiere dein Ikigai...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={24} />
                    <span>Mein Ikigai finden</span>
                    <ArrowRight size={24} />
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </>
      )}

      {/* Tags display and edit area (Desktop only) */}
      {!isMobile && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: b.space[4] }}>
          {Object.entries(DIMENSIONS).map(([key, config]) => {
            const tags = dimensions[key]?.tags || [];
            if (tags.length === 0) return null;

            const Icon = DIMENSION_ICONS[key];

            return (
              <Card key={key} style={{ background: `${config.color}08`, border: `1px solid ${config.color}20` }}>
                <CardContent style={{ padding: b.space[4] }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: b.space[2], marginBottom: b.space[3] }}>
                    <Icon size={18} style={{ color: config.color }} />
                    <span style={{ fontWeight: b.fontWeight.semibold, color: config.color }}>
                      {config.label}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: b.space[2] }}>
                    {tags.map((tag, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: b.space[1],
                          padding: `${b.space[1]} ${b.space[3]}`,
                          borderRadius: b.radius.full,
                          fontSize: b.fontSize.sm,
                          fontWeight: b.fontWeight.medium,
                          background: 'transparent',
                          border: `1.5px solid ${config.color}`,
                          color: config.color,
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
                            padding: 0,
                            cursor: 'pointer',
                            opacity: 0.8,
                            display: 'flex',
                          }}
                        >
                          <X size={14} color={config.color} />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => handleCircleClick(key)}
                      style={{
                        padding: `${b.space[1]} ${b.space[3]}`,
                        borderRadius: b.radius.full,
                        fontSize: b.fontSize.sm,
                        fontWeight: b.fontWeight.medium,
                        border: `2px dashed ${config.color}50`,
                        background: 'transparent',
                        color: config.color,
                        cursor: 'pointer',
                      }}
                    >
                      + Mehr
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
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
