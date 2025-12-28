import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, Sparkles, ArrowRight } from 'lucide-react';
import { useBranding } from '@/hooks/useBranding';

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
  const branding = useBranding();
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
   * Circle positions for Venn diagram
   */
  const circlePositions = {
    love: { top: '0%', left: '25%' },
    talent: { top: '0%', left: '55%' },
    need: { top: '35%', left: '10%' },
    market: { top: '35%', left: '70%' },
  };

  /**
   * Check if dimension has tags
   */
  const hasTags = (key) => dimensions[key]?.tags?.length > 0;

  /**
   * Get fill count for progress
   */
  const filledCount = Object.keys(dimensions).filter((key) => hasTags(key)).length;

  return (
    <div className="px-4 py-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1
          className="text-3xl font-bold mb-2"
          style={{ color: branding.colors?.text?.primary || '#1e293b' }}
        >
          Der Ikigai-Kompass
        </h1>
        <p
          className="text-lg"
          style={{ color: branding.colors?.text?.secondary || '#64748b' }}
        >
          Entdecke deinen idealen Karrierepfad
        </p>
        <p
          className="text-sm mt-2"
          style={{ color: branding.colors?.text?.muted || '#94a3b8' }}
        >
          Klicke auf einen Kreis und erzähle mir davon. Die KI extrahiert die Kernpunkte.
        </p>
      </div>

      {/* Progress indicator */}
      <div className="flex justify-center gap-2 mb-8">
        {Object.keys(DIMENSIONS).map((key) => (
          <div
            key={key}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all"
            style={{
              backgroundColor: hasTags(key)
                ? `${DIMENSIONS[key].color}20`
                : '#f1f5f9',
              color: hasTags(key)
                ? DIMENSIONS[key].color
                : '#94a3b8',
              border: hasTags(key)
                ? `2px solid ${DIMENSIONS[key].color}`
                : '2px solid #e2e8f0',
            }}
          >
            <span>{DIMENSIONS[key].icon}</span>
            <span>{DIMENSIONS[key].label}</span>
            {hasTags(key) && <span className="ml-1">✓</span>}
          </div>
        ))}
      </div>

      {/* Venn Diagram Container */}
      <div
        className="relative mx-auto mb-8"
        style={{
          width: '100%',
          maxWidth: '600px',
          height: '500px',
        }}
      >
        {/* Render circles */}
        {Object.entries(DIMENSIONS).map(([key, config]) => {
          const isActive = activeCircle === key;
          const isFilled = hasTags(key);
          const position = circlePositions[key];

          return (
            <motion.div
              key={key}
              className="absolute cursor-pointer"
              style={{
                width: '220px',
                height: '220px',
                top: position.top,
                left: position.left,
                transform: 'translate(-50%, 0)',
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleCircleClick(key)}
            >
              {/* Circle */}
              <div
                className="w-full h-full rounded-full flex flex-col items-center justify-center transition-all duration-300"
                style={{
                  backgroundColor: isFilled
                    ? `${config.color}30`
                    : `${config.color}15`,
                  border: `3px solid ${isFilled ? config.color : `${config.color}50`}`,
                  boxShadow: isActive
                    ? `0 0 30px ${config.color}50`
                    : isFilled
                      ? `0 0 20px ${config.color}20`
                      : 'none',
                }}
              >
                {/* Icon and label */}
                <span className="text-4xl mb-2">{config.icon}</span>
                <span
                  className="font-semibold text-lg"
                  style={{ color: config.color }}
                >
                  {config.label}
                </span>
                <span
                  className="text-xs text-center px-4 mt-1"
                  style={{ color: `${config.color}99` }}
                >
                  {config.description}
                </span>

                {/* Tags preview */}
                {isFilled && (
                  <div className="flex flex-wrap justify-center gap-1 mt-3 px-4 max-h-16 overflow-hidden">
                    {dimensions[key].tags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: config.color,
                          color: 'white',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                    {dimensions[key].tags.length > 3 && (
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `${config.color}40`,
                          color: config.color,
                        }}
                      >
                        +{dimensions[key].tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}

        {/* Center "Ikigai" indicator */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center z-10"
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
            className="w-24 h-24 rounded-full flex items-center justify-center"
            style={{
              background: allDimensionsFilled
                ? 'linear-gradient(135deg, #E11D48, #F59E0B, #10B981, #6366F1)'
                : 'linear-gradient(135deg, #e2e8f0, #f1f5f9)',
              boxShadow: allDimensionsFilled
                ? '0 0 40px rgba(99, 102, 241, 0.5)'
                : 'none',
            }}
          >
            <span className="text-white font-bold text-lg">
              {allDimensionsFilled ? 'Ikigai' : `${filledCount}/4`}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Tags display and edit area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {Object.entries(DIMENSIONS).map(([key, config]) => {
          const tags = dimensions[key]?.tags || [];
          if (tags.length === 0) return null;

          return (
            <div
              key={key}
              className="p-4 rounded-xl"
              style={{
                backgroundColor: `${config.color}10`,
                border: `1px solid ${config.color}30`,
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span>{config.icon}</span>
                <span
                  className="font-semibold"
                  style={{ color: config.color }}
                >
                  {config.label}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium group"
                    style={{
                      backgroundColor: config.color,
                      color: 'white',
                    }}
                  >
                    <span>{tag}</span>
                    <button
                      onClick={() => onRemoveTag(key, tag)}
                      className="opacity-70 hover:opacity-100 transition-opacity"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => handleCircleClick(key)}
                  className="px-3 py-1.5 rounded-full text-sm font-medium border-2 border-dashed transition-colors"
                  style={{
                    borderColor: `${config.color}50`,
                    color: config.color,
                  }}
                >
                  + Mehr hinzufügen
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Synthesize button */}
      {allDimensionsFilled && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center"
        >
          <button
            onClick={onSynthesize}
            disabled={isSynthesizing}
            className="flex items-center gap-3 px-8 py-4 rounded-xl text-white font-semibold text-lg shadow-lg transition-all hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, #E11D48, #6366F1)',
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
          </button>
        </motion.div>
      )}

      {/* Chat overlay for dimension input */}
      <AnimatePresence>
        {activeCircle && currentDimension && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
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
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              {/* Header */}
              <div
                className="px-6 py-4 flex items-center justify-between"
                style={{ backgroundColor: `${currentDimension.color}15` }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{currentDimension.icon}</span>
                  <div>
                    <h3
                      className="font-bold text-lg"
                      style={{ color: currentDimension.color }}
                    >
                      {currentDimension.label}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {currentDimension.description}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => !isExtracting && setActiveCircle(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  disabled={isExtracting}
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              {/* Question */}
              <div className="px-6 py-4">
                <p className="text-gray-700 text-lg font-medium">
                  {currentDimension.question}
                </p>
              </div>

              {/* Existing tags */}
              {dimensions[activeCircle]?.tags?.length > 0 && (
                <div className="px-6 pb-4">
                  <p className="text-sm text-gray-500 mb-2">Bereits erfasst:</p>
                  <div className="flex flex-wrap gap-2">
                    {dimensions[activeCircle].tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-full text-sm font-medium"
                        style={{
                          backgroundColor: currentDimension.color,
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
              <div className="px-6 pb-6">
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder={currentDimension.placeholder}
                    rows={4}
                    className="w-full p-4 rounded-xl border-2 resize-none focus:outline-none focus:ring-2 transition-all"
                    style={{
                      borderColor: `${currentDimension.color}30`,
                      focus: { ringColor: currentDimension.color },
                    }}
                    disabled={isExtracting}
                  />
                  <button
                    onClick={handleSubmit}
                    disabled={!inputValue.trim() || isExtracting}
                    className="absolute bottom-4 right-4 p-3 rounded-full text-white transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: currentDimension.color }}
                  >
                    {isExtracting ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <Send size={20} />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2 text-center">
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
