import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * FormAccordion Component
 *
 * A beautiful accordion component for forms with:
 * - Full-width soft colored header background
 * - Icon on the left with white background
 * - Title and optional subtitle
 * - Smooth expand/collapse animation
 *
 * Uses 100% inline styles to avoid CSS conflicts
 */
export function FormAccordion({
  title,
  subtitle,
  icon: Icon,
  accentColor = 'blue', // blue, green, purple, orange, teal
  children,
  defaultExpanded = false,
  badge,
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

  // All styles as inline to avoid any CSS conflicts
  const containerStyle = {
    width: '100%',
    display: 'block',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    border: 'none',
    marginBottom: '0',
  };

  const headerStyle = {
    width: '100%',
    display: 'block',
    backgroundColor: isHovered ? colors.headerBgHover : colors.headerBg,
    transition: 'background-color 0.2s ease',
    border: 'none',
    margin: 0,
    padding: 0,
  };

  const buttonStyle = {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    textAlign: 'left',
    cursor: 'pointer',
    border: 'none',
    background: 'none',
    backgroundColor: 'transparent',
    margin: 0,
    outline: 'none',
    fontFamily: 'inherit',
  };

  const iconContainerStyle = {
    width: '36px',
    height: '36px',
    minWidth: '36px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.iconBg,
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    flexShrink: 0,
  };

  const titleContainerStyle = {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
  };

  const titleStyle = {
    fontWeight: 600,
    fontSize: '14px',
    lineHeight: '1.4',
    display: 'block',
    color: colors.titleText,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    margin: 0,
    padding: 0,
  };

  const subtitleStyle = {
    fontSize: '12px',
    lineHeight: '1.4',
    color: '#64748b',
    display: 'block',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    marginTop: '2px',
    padding: 0,
  };

  const badgeStyle = {
    fontSize: '12px',
    fontWeight: 500,
    color: '#64748b',
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: '4px 10px',
    borderRadius: '9999px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    flexShrink: 0,
  };

  const contentStyle = {
    padding: '12px 16px 16px 16px',
    borderTop: '1px solid #f1f5f9',
    backgroundColor: 'rgba(248, 250, 252, 0.5)',
  };

  return (
    <motion.div
      style={containerStyle}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Full-width header */}
      <div style={headerStyle}>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={buttonStyle}
        >
          {Icon && (
            <div style={iconContainerStyle}>
              <Icon style={{ width: '20px', height: '20px', color: colors.iconText }} />
            </div>
          )}

          <div style={titleContainerStyle}>
            <span style={titleStyle}>{title}</span>
            {subtitle && <span style={subtitleStyle}>{subtitle}</span>}
          </div>

          {badge && <span style={badgeStyle}>{badge}</span>}
        </button>
      </div>

      {/* Expandable content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={contentStyle}>
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
  const groupStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    width: '100%',
  };

  return (
    <div style={groupStyle} className={className}>
      {children}
    </div>
  );
}

export default FormAccordion;
