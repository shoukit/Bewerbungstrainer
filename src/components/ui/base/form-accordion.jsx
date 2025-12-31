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
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isHovered, setIsHovered] = useState(false);

  // Color schemes mapped to Tailwind classes
  const colorSchemes = {
    blue: {
      headerBg: 'bg-sky-100',
      headerBgHover: 'bg-sky-200',
      iconText: 'text-sky-600',
      titleText: 'text-sky-900',
    },
    green: {
      headerBg: 'bg-emerald-100',
      headerBgHover: 'bg-emerald-200',
      iconText: 'text-emerald-600',
      titleText: 'text-emerald-900',
    },
    purple: {
      headerBg: 'bg-purple-100',
      headerBgHover: 'bg-purple-200',
      iconText: 'text-purple-600',
      titleText: 'text-purple-900',
    },
    orange: {
      headerBg: 'bg-amber-100',
      headerBgHover: 'bg-amber-200',
      iconText: 'text-amber-600',
      titleText: 'text-amber-900',
    },
    indigo: {
      headerBg: 'bg-indigo-100',
      headerBgHover: 'bg-indigo-200',
      iconText: 'text-indigo-600',
      titleText: 'text-indigo-900',
    },
  };

  const colors = colorSchemes[accentColor] || colorSchemes.blue;

  return (
    <motion.div
      className="w-full block bg-white rounded-xl overflow-hidden shadow-sm border-none mb-0"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Full-width header */}
      <div className={cn(
        'w-full block border-none m-0 p-0 transition-colors duration-200',
        isHovered ? colors.headerBgHover : colors.headerBg
      )}>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="w-full flex items-center gap-3 p-3 text-left cursor-pointer border-none bg-transparent m-0 outline-none font-inherit"
        >
          {Icon && (
            <div className="w-9 h-9 min-w-[36px] rounded-lg flex items-center justify-center bg-white shadow-sm shrink-0">
              <Icon className={cn('w-5 h-5', colors.iconText)} />
            </div>
          )}

          <div className="flex-1 min-w-0 overflow-hidden">
            <span className={cn('font-semibold text-sm leading-[1.4] block overflow-hidden text-ellipsis whitespace-nowrap m-0 p-0', colors.titleText)}>
              {title}
            </span>
            {subtitle && (
              <span className="text-xs leading-[1.4] text-slate-500 block overflow-hidden text-ellipsis whitespace-nowrap mt-0.5 p-0">
                {subtitle}
              </span>
            )}
          </div>

          {badge && (
            <span className="text-xs font-medium text-slate-500 bg-white/90 px-2.5 py-1 rounded-full shadow-sm shrink-0">
              {badge}
            </span>
          )}
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
            className="overflow-hidden"
          >
            <div className="p-3 pb-4 border-t border-slate-100 bg-slate-50/50">
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
    <div className={cn('flex flex-col gap-3 w-full', className)}>
      {children}
    </div>
  );
}

export default FormAccordion;
