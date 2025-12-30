import React, { useState } from 'react';
import { ChevronDown, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Question Tips Accordion Component
 * Displays collapsible tips for the current question/situation
 */
const QuestionTips = ({ tips, primaryAccent, tipsLabel, branding }) => {
  const [isOpen, setIsOpen] = useState(true); // Default: expanded

  if (!tips || tips.length === 0) return null;

  return (
    <div
      style={{
        background: branding.cardBg,
        borderRadius: branding.radius.xl,
        border: `1px solid ${branding.borderColor}`,
        overflow: 'hidden',
      }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: `${branding.space[4]} ${branding.space[6]}`,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: branding.space[2], fontSize: branding.fontSize.base, fontWeight: branding.fontWeight.semibold, color: branding.textMain }}>
          <Lightbulb size={branding.iconSize.md} color={primaryAccent} />
          {tipsLabel || 'Tipps für diese Frage'}
        </span>
        <ChevronDown
          size={branding.iconSize.md}
          color={branding.textMuted}
          style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: branding.transition.normal }}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: `0 ${branding.space[6]} ${branding.space[6]}` }}>
              {tips.map((tip, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    gap: branding.space[3],
                    padding: `${branding.space[3]} ${branding.space[4]}`,
                    borderRadius: branding.radius.md,
                    backgroundColor: branding.warningLight,
                    marginBottom: index < tips.length - 1 ? branding.space[2] : 0,
                  }}
                >
                  <Lightbulb style={{
                    width: branding.iconSize.sm,
                    height: branding.iconSize.sm,
                    color: branding.warning,
                    flexShrink: 0,
                    marginTop: '2px',
                  }} />
                  <p style={{
                    fontSize: branding.fontSize.base,
                    color: branding.textSecondary,
                    margin: 0,
                    lineHeight: 1.5,
                  }}>
                    {tip.replace(/^Tipp \d+:\s*/i, '')}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuestionTips;
