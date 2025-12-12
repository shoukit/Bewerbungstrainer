import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * FormAccordion Component
 *
 * A beautiful accordion component for forms with:
 * - Soft ocean-theme header background (full-width)
 * - Icon on the left with subtle background
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

  // Color schemes with inline style values for guaranteed full-width coverage
  const colorSchemes = {
    blue: {
      headerBg: 'linear-gradient(to right, #e0f2fe, #f0f9ff)',
      headerBgHover: 'linear-gradient(to right, #bae6fd, #e0f2fe)',
      iconBg: 'rgba(255,255,255,0.9)',
      iconText: '#0284c7',
      titleText: '#075985',
    },
    green: {
      headerBg: 'linear-gradient(to right, #d1fae5, #ecfdf5)',
      headerBgHover: 'linear-gradient(to right, #a7f3d0, #d1fae5)',
      iconBg: 'rgba(255,255,255,0.9)',
      iconText: '#059669',
      titleText: '#065f46',
    },
    purple: {
      headerBg: 'linear-gradient(to right, #ede9fe, #f5f3ff)',
      headerBgHover: 'linear-gradient(to right, #ddd6fe, #ede9fe)',
      iconBg: 'rgba(255,255,255,0.9)',
      iconText: '#7c3aed',
      titleText: '#5b21b6',
    },
    orange: {
      headerBg: 'linear-gradient(to right, #fef3c7, #fffbeb)',
      headerBgHover: 'linear-gradient(to right, #fde68a, #fef3c7)',
      iconBg: 'rgba(255,255,255,0.9)',
      iconText: '#d97706',
      titleText: '#92400e',
    },
    teal: {
      headerBg: 'linear-gradient(to right, #ccfbf1, #f0fdfa)',
      headerBgHover: 'linear-gradient(to right, #99f6e4, #ccfbf1)',
      iconBg: 'rgba(255,255,255,0.9)',
      iconText: '#0d9488',
      titleText: '#115e59',
    },
  };

  const colors = colorSchemes[accentColor] || colorSchemes.blue;

  return (
    <motion.div
      className={cn(
        "bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm",
        "transition-all duration-200",
        className
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="w-full px-4 py-3 flex items-center gap-3 transition-all text-left cursor-pointer"
        style={{
          background: isHovered ? colors.headerBgHover : colors.headerBg,
        }}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {Icon && (
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm"
              style={{ backgroundColor: colors.iconBg }}
            >
              <Icon className="w-5 h-5" style={{ color: colors.iconText }} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <span
              className="font-semibold text-sm block truncate"
              style={{ color: colors.titleText }}
            >
              {title}
            </span>
            {subtitle && (
              <span className="text-xs text-slate-500 block truncate mt-0.5">
                {subtitle}
              </span>
            )}
          </div>
        </div>

        {badge && (
          <span className="text-xs font-medium text-slate-500 bg-white/80 px-2.5 py-1 rounded-full shadow-sm">
            {badge}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-3 border-t border-slate-100 bg-slate-50/30">
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
