import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, Sparkles, ArrowRight, Heart, Star, Globe, Coins } from 'lucide-react';
import { useBranding } from '@/hooks/useBranding';
import { useMobile } from '@/hooks/useMobile';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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
   * Handle key press in textarea
   */
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

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
                  background: config.color,
                  color: 'white',
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
                  background: `${config.color}20`,
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
   * Render desktop Venn diagram circle
   */
  const renderDesktopCircle = (key, config, position) => {
    const Icon = DIMENSION_ICONS[key];
    const isFilled = hasTags(key);
    const tags = dimensions[key]?.tags || [];

    return (
      <motion.div
        key={key}
        className="absolute cursor-pointer"
        style={{
          width: '200px',
          height: '200px',
          ...position,
        }}
        whileHover={{ scale: 1.05 }}
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
            transition: 'all 0.3s ease',
          }}
        >
          <Icon size={32} style={{ color: config.color, marginBottom: b.space[2] }} />
          <span style={{ fontWeight: b.fontWeight.semibold, fontSize: b.fontSize.base, color: config.color }}>
            {config.label}
          </span>
          <span style={{ fontSize: b.fontSize.xs, color: `${config.color}99`, textAlign: 'center', padding: `0 ${b.space[3]}` }}>
            {config.description}
          </span>

          {/* Tags preview */}
          {isFilled && (
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '4px', marginTop: b.space[2], padding: `0 ${b.space[2]}`, maxHeight: '50px', overflow: 'hidden' }}>
              {tags.slice(0, 3).map((tag, idx) => (
                <span
                  key={idx}
                  style={{
                    padding: '2px 8px',
                    borderRadius: b.radius.full,
                    fontSize: b.fontSize.xs,
                    fontWeight: b.fontWeight.medium,
                    background: config.color,
                    color: 'white',
                  }}
                >
                  {tag}
                </span>
              ))}
              {tags.length > 3 && (
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: b.radius.full,
                    fontSize: b.fontSize.xs,
                    fontWeight: b.fontWeight.medium,
                    background: `${config.color}30`,
                    color: config.color,
                  }}
                >
                  +{tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  // Desktop circle positions for Venn diagram
  const desktopPositions = {
    love: { top: '0', left: '80px' },
    talent: { top: '0', right: '80px' },
    need: { bottom: '0', left: '0' },
    market: { bottom: '0', right: '0' },
  };

  return (
    <div style={{ padding: isMobile ? b.space[4] : b.space[8], maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: b.space[6] }}>
        <h1 style={{ fontSize: isMobile ? b.fontSize['2xl'] : b.fontSize['3xl'], fontWeight: b.fontWeight.bold, color: b.textMain, marginBottom: b.space[2] }}>
          Der Ikigai-Kompass
        </h1>
        <p style={{ fontSize: b.fontSize.base, color: b.textSecondary }}>
          Entdecke deinen idealen Karrierepfad
        </p>
        <p style={{ fontSize: b.fontSize.sm, color: b.textMuted, marginTop: b.space[2] }}>
          Klicke auf einen Bereich und erzähle mir davon. Die KI extrahiert die Kernpunkte.
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: b.space[3], marginBottom: b.space[6] }}>
          {Object.entries(DIMENSIONS).map(([key, config]) => renderMobileCircle(key, config))}
        </div>
      ) : (
        /* Desktop: Venn Diagram */
        <div
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '500px',
            height: '420px',
            margin: `0 auto ${b.space[8]}`,
          }}
        >
          {Object.entries(DIMENSIONS).map(([key, config]) =>
            renderDesktopCircle(key, config, desktopPositions[key])
          )}

          {/* Center "Ikigai" indicator */}
          <motion.div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 10,
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
      )}

      {/* Tags display and edit area (Desktop only when not mobile) */}
      {!isMobile && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: b.space[4], marginBottom: b.space[6] }}>
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
                          background: config.color,
                          color: 'white',
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
                          <X size={14} color="white" />
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

      {/* Synthesize button */}
      {allDimensionsFilled && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', justifyContent: 'center' }}
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
                      {currentDimension.label}
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
                          background: currentDimension.color,
                          color: 'white',
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
                    onKeyDown={handleKeyPress}
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
                <p style={{ fontSize: b.fontSize.xs, color: b.textMuted, marginTop: b.space[2], textAlign: 'center' }}>
                  Drücke Enter zum Absenden oder Shift+Enter für neue Zeile
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default IkigaiCompass;
