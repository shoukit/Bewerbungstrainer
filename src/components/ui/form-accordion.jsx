import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * FormAccordion Component
 *
 * A beautiful accordion component for forms with:
 * - Soft ocean-theme header background
 * - Full-width colored header when expanded
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

  // Color schemes - soft ocean-theme colors
  const colorSchemes = {
    blue: {
      headerBg: 'bg-gradient-to-r from-ocean-blue-50 to-ocean-blue-100/50',
      headerBgHover: 'hover:from-ocean-blue-100 hover:to-ocean-blue-100/70',
      iconBg: 'bg-white/80',
      iconText: 'text-ocean-blue-600',
      titleText: 'text-ocean-blue-800',
    },
    green: {
      headerBg: 'bg-gradient-to-r from-emerald-50 to-emerald-100/50',
      headerBgHover: 'hover:from-emerald-100 hover:to-emerald-100/70',
      iconBg: 'bg-white/80',
      iconText: 'text-emerald-600',
      titleText: 'text-emerald-800',
    },
    purple: {
      headerBg: 'bg-gradient-to-r from-violet-50 to-violet-100/50',
      headerBgHover: 'hover:from-violet-100 hover:to-violet-100/70',
      iconBg: 'bg-white/80',
      iconText: 'text-violet-600',
      titleText: 'text-violet-800',
    },
    orange: {
      headerBg: 'bg-gradient-to-r from-amber-50 to-amber-100/50',
      headerBgHover: 'hover:from-amber-100 hover:to-amber-100/70',
      iconBg: 'bg-white/80',
      iconText: 'text-amber-600',
      titleText: 'text-amber-800',
    },
    teal: {
      headerBg: 'bg-gradient-to-r from-teal-50 to-teal-100/50',
      headerBgHover: 'hover:from-teal-100 hover:to-teal-100/70',
      iconBg: 'bg-white/80',
      iconText: 'text-teal-600',
      titleText: 'text-teal-800',
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
        className={cn(
          "w-full px-4 py-3 flex items-center gap-3 transition-all text-left",
          colors.headerBg,
          colors.headerBgHover
        )}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {Icon && (
            <div className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors shadow-sm",
              colors.iconBg
            )}>
              <Icon className={cn("w-4.5 h-4.5", colors.iconText)} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <span className={cn("font-semibold text-sm block truncate", colors.titleText)}>
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
