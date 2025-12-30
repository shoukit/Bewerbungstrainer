/**
 * Accordion Component
 *
 * A reusable collapsible/accordion component that consolidates
 * CollapsibleSection, QuestionTips, and similar implementations.
 *
 * @example
 * // Single accordion item
 * <Accordion title="Tipps anzeigen" defaultOpen={false}>
 *   <p>Content here...</p>
 * </Accordion>
 *
 * // Accordion group (only one open at a time)
 * <AccordionGroup>
 *   <AccordionItem title="Section 1">Content 1</AccordionItem>
 *   <AccordionItem title="Section 2">Content 2</AccordionItem>
 * </AccordionGroup>
 */

import React, { useState, useCallback, createContext, useContext } from 'react';
import { ChevronDown, ChevronRight, Lightbulb, Info, HelpCircle, Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { COLORS } from '@/config/colors';
import { useBranding } from '@/hooks/useBranding';

/**
 * Context for AccordionGroup
 */
const AccordionGroupContext = createContext(null);

/**
 * Variant configurations
 */
const VARIANTS = {
  default: {
    headerBg: COLORS.slate[50],
    headerBgHover: COLORS.slate[100],
    headerText: COLORS.slate[700],
    borderColor: COLORS.slate[200],
    contentBg: 'white',
    icon: ChevronDown,
  },
  tips: {
    headerBg: COLORS.amber[50],
    headerBgHover: COLORS.amber[100],
    headerText: COLORS.amber[700],
    borderColor: COLORS.amber[200],
    contentBg: COLORS.amber[50],
    icon: Lightbulb,
  },
  info: {
    headerBg: COLORS.blue[50],
    headerBgHover: COLORS.blue[100],
    headerText: COLORS.blue[700],
    borderColor: COLORS.blue[200],
    contentBg: COLORS.blue[50],
    icon: Info,
  },
  help: {
    headerBg: COLORS.purple[50],
    headerBgHover: COLORS.purple[100],
    headerText: COLORS.purple[700],
    borderColor: COLORS.purple[200],
    contentBg: COLORS.purple[50],
    icon: HelpCircle,
  },
  minimal: {
    headerBg: 'transparent',
    headerBgHover: COLORS.slate[50],
    headerText: COLORS.slate[600],
    borderColor: 'transparent',
    contentBg: 'transparent',
    icon: ChevronRight,
  },
  card: {
    headerBg: 'white',
    headerBgHover: COLORS.slate[50],
    headerText: COLORS.slate[800],
    borderColor: COLORS.slate[200],
    contentBg: 'white',
    icon: ChevronDown,
  },
};

/**
 * Accordion Component
 *
 * @param {Object} props
 * @param {string} props.title - Accordion header text
 * @param {React.ReactNode} props.children - Content to show when expanded
 * @param {boolean} props.defaultOpen - Initial open state (default: false)
 * @param {boolean} props.isOpen - Controlled open state (optional)
 * @param {Function} props.onToggle - Called when toggled (receives new state)
 * @param {string} props.variant - Visual variant: 'default' | 'tips' | 'info' | 'help' | 'minimal' | 'card'
 * @param {React.Component} props.icon - Custom icon component
 * @param {string} props.iconPosition - Icon position: 'left' | 'right'
 * @param {boolean} props.showPlusMinus - Show +/- instead of chevron
 * @param {string} props.id - Unique ID for AccordionGroup
 */
const Accordion = ({
  title,
  children,
  defaultOpen = false,
  isOpen: controlledIsOpen,
  onToggle,
  variant = 'default',
  icon: CustomIcon,
  iconPosition = 'left',
  showPlusMinus = false,
  id,
  className = '',
  style = {},
  headerStyle = {},
  contentStyle = {},
}) => {
  const b = useBranding();
  const groupContext = useContext(AccordionGroupContext);

  // Determine if we're in group mode
  const isInGroup = groupContext !== null;
  const isGroupControlled = isInGroup && id;

  // State management
  const [internalOpen, setInternalOpen] = useState(defaultOpen);

  // Determine actual open state
  let isOpen;
  if (controlledIsOpen !== undefined) {
    isOpen = controlledIsOpen;
  } else if (isGroupControlled) {
    isOpen = groupContext.activeId === id;
  } else {
    isOpen = internalOpen;
  }

  // Handle toggle
  const handleToggle = useCallback(() => {
    const newState = !isOpen;

    if (controlledIsOpen !== undefined) {
      // Controlled mode - just call callback
      onToggle?.(newState);
    } else if (isGroupControlled) {
      // Group mode - tell group
      groupContext.setActiveId(isOpen ? null : id);
    } else {
      // Internal state
      setInternalOpen(newState);
      onToggle?.(newState);
    }
  }, [isOpen, controlledIsOpen, onToggle, isGroupControlled, groupContext, id]);

  // Get variant config
  const variantConfig = VARIANTS[variant] || VARIANTS.default;

  // Determine icon
  const IconComponent = CustomIcon || variantConfig.icon;
  const ToggleIcon = showPlusMinus ? (isOpen ? Minus : Plus) : IconComponent;

  return (
    <div
      className={className}
      style={{
        borderRadius: '12px',
        border: `1px solid ${variantConfig.borderColor}`,
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* Header */}
      <button
        onClick={handleToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '14px 16px',
          backgroundColor: variantConfig.headerBg,
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'background-color 0.2s',
          ...headerStyle,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = variantConfig.headerBgHover;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = variantConfig.headerBg;
        }}
      >
        {/* Left icon */}
        {iconPosition === 'left' && ToggleIcon && (
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.2s',
              transform: !showPlusMinus && isOpen && IconComponent === ChevronDown
                ? 'rotate(180deg)'
                : !showPlusMinus && isOpen && IconComponent === ChevronRight
                  ? 'rotate(90deg)'
                  : 'rotate(0deg)',
            }}
          >
            <ToggleIcon
              style={{
                width: '18px',
                height: '18px',
                color: variantConfig.headerText,
              }}
            />
          </span>
        )}

        {/* Title */}
        <span
          style={{
            flex: 1,
            fontSize: '14px',
            fontWeight: 600,
            color: variantConfig.headerText,
          }}
        >
          {title}
        </span>

        {/* Right icon */}
        {iconPosition === 'right' && ToggleIcon && (
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.2s',
              transform: !showPlusMinus && isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          >
            <ToggleIcon
              style={{
                width: '18px',
                height: '18px',
                color: variantConfig.headerText,
              }}
            />
          </span>
        )}
      </button>

      {/* Content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div
              style={{
                padding: '16px',
                backgroundColor: variantConfig.contentBg,
                borderTop: `1px solid ${variantConfig.borderColor}`,
                ...contentStyle,
              }}
            >
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * AccordionGroup - Container for mutually exclusive accordions
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - AccordionItem children
 * @param {string} props.defaultActiveId - Initially open accordion ID
 * @param {boolean} props.allowAllClosed - Allow all to be closed (default: true)
 */
export const AccordionGroup = ({
  children,
  defaultActiveId = null,
  allowAllClosed = true,
}) => {
  const [activeId, setActiveId] = useState(defaultActiveId);

  const handleSetActiveId = useCallback((id) => {
    if (!allowAllClosed && id === null && activeId !== null) {
      return; // Don't allow closing if allowAllClosed is false
    }
    setActiveId(id);
  }, [allowAllClosed, activeId]);

  return (
    <AccordionGroupContext.Provider value={{ activeId, setActiveId: handleSetActiveId }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {children}
      </div>
    </AccordionGroupContext.Provider>
  );
};

/**
 * TipsAccordion - Pre-configured for tips display
 */
export const TipsAccordion = ({
  tips,
  title = 'Tipps anzeigen',
  defaultOpen = false,
  ...props
}) => {
  // Handle both string and array tips
  const tipsContent = Array.isArray(tips) ? (
    <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {tips.map((tip, index) => (
        <li key={index} style={{ color: COLORS.amber[800], fontSize: '14px', lineHeight: 1.6 }}>
          {tip}
        </li>
      ))}
    </ul>
  ) : (
    <p style={{ margin: 0, color: COLORS.amber[800], fontSize: '14px', lineHeight: 1.6 }}>
      {tips}
    </p>
  );

  return (
    <Accordion
      title={title}
      variant="tips"
      defaultOpen={defaultOpen}
      {...props}
    >
      {tipsContent}
    </Accordion>
  );
};

/**
 * CollapsibleSection - Simpler alias for minimal variant
 */
export const CollapsibleSection = ({
  title,
  children,
  defaultOpen = true,
  ...props
}) => (
  <Accordion
    title={title}
    variant="minimal"
    defaultOpen={defaultOpen}
    iconPosition="right"
    {...props}
  >
    {children}
  </Accordion>
);

/**
 * InfoAccordion - Pre-configured for info/help content
 */
export const InfoAccordion = ({
  title = 'Mehr erfahren',
  children,
  ...props
}) => (
  <Accordion
    title={title}
    variant="info"
    {...props}
  >
    {children}
  </Accordion>
);

export default Accordion;
