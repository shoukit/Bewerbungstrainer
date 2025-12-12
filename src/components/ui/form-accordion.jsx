import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * FormAccordion Component
 *
 * A beautiful accordion component for forms with:
 * - Full-width soft colored header background
 * - Icon on the left with white background
 * - Title and optional subtitle
 * - Smooth expand/collapse animation
 */
export function FormAccordion({
  title,
  subtitle,
  icon: Icon,
  accentColor = 'blue', // blue, green, purple, orange, teal
  children,
  defaultExpanded = false,
  badge,
  className,
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isHovered, setIsHovered] = useState(false);

  // Color schemes - solid colors for reliability
  const colorSchemes = {
    blue: {
      headerBg: '#e0f2fe',
      headerBgHover: '#bae6fd',
      iconBg: '#ffffff',
      iconText: '#0284c7',
      titleText: '#075985',
    },
    green: {
      headerBg: '#d1fae5',
      headerBgHover: '#a7f3d0',
      iconBg: '#ffffff',
      iconText: '#059669',
      titleText: '#065f46',
    },
    purple: {
      headerBg: '#ede9fe',
      headerBgHover: '#ddd6fe',
      iconBg: '#ffffff',
      iconText: '#7c3aed',
      titleText: '#5b21b6',
    },
    orange: {
      headerBg: '#fef3c7',
      headerBgHover: '#fde68a',
      iconBg: '#ffffff',
      iconText: '#d97706',
      titleText: '#92400e',
    },
    teal: {
      headerBg: '#ccfbf1',
      headerBgHover: '#99f6e4',
      iconBg: '#ffffff',
      iconText: '#0d9488',
      titleText: '#115e59',
    },
  };

  const colors = colorSchemes[accentColor] || colorSchemes.blue;

  return (
    <motion.div
      className={cn(
        "rounded-xl overflow-hidden shadow-sm",
        "transition-all duration-200",
        className
      )}
      style={{
        backgroundColor: '#ffffff',
        border: 'none',
      }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Full-width header with background color */}
      <div
        style={{
          backgroundColor: isHovered ? colors.headerBgHover : colors.headerBg,
          width: '100%',
          transition: 'background-color 0.2s ease',
        }}
      >
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            width: '100%',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textAlign: 'left',
            cursor: 'pointer',
            border: 'none',
            background: 'transparent',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
            {Icon && (
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  backgroundColor: colors.iconBg,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                }}
              >
                <Icon style={{ width: '20px', height: '20px', color: colors.iconText }} />
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <span
                style={{
                  fontWeight: 600,
                  fontSize: '14px',
                  display: 'block',
                  color: colors.titleText,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {title}
              </span>
              {subtitle && (
                <span
                  style={{
                    fontSize: '12px',
                    color: '#64748b',
                    display: 'block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    marginTop: '2px',
                  }}
                >
                  {subtitle}
                </span>
              )}
            </div>
          </div>

          {badge && (
            <span
              style={{
                fontSize: '12px',
                fontWeight: 500,
                color: '#64748b',
                backgroundColor: 'rgba(255,255,255,0.8)',
                padding: '4px 10px',
                borderRadius: '9999px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              }}
            >
              {badge}
            </span>
          )}
        </button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div
              style={{
                padding: '12px 16px 16px 16px',
                borderTop: '1px solid #f1f5f9',
                backgroundColor: 'rgba(248, 250, 252, 0.3)',
              }}
            >
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/**
 * FormAccordionGroup Component
 *
 * A container for multiple FormAccordion items with consistent spacing
 */
export function FormAccordionGroup({ children, className }) {
  return (
    <div className={cn("space-y-3", className)}>
      {children}
    </div>
  );
}

export default FormAccordion;
