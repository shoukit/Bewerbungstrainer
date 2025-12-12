import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * FormAccordion Component
 *
 * A beautiful accordion component for forms with:
 * - Clean white background
 * - Colored left border accent when expanded
 * - Icon on the left with subtle background
 * - Title and optional subtitle
 * - Animated chevron
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

  // Color schemes - softer, more professional colors
  const colorSchemes = {
    blue: {
      iconBg: 'bg-sky-50',
      iconText: 'text-sky-600',
      border: 'border-l-sky-500',
      hoverBg: 'hover:bg-sky-50/50',
    },
    green: {
      iconBg: 'bg-emerald-50',
      iconText: 'text-emerald-600',
      border: 'border-l-emerald-500',
      hoverBg: 'hover:bg-emerald-50/50',
    },
    purple: {
      iconBg: 'bg-violet-50',
      iconText: 'text-violet-600',
      border: 'border-l-violet-500',
      hoverBg: 'hover:bg-violet-50/50',
    },
    orange: {
      iconBg: 'bg-amber-50',
      iconText: 'text-amber-600',
      border: 'border-l-amber-500',
      hoverBg: 'hover:bg-amber-50/50',
    },
    teal: {
      iconBg: 'bg-teal-50',
      iconText: 'text-teal-600',
      border: 'border-l-teal-500',
      hoverBg: 'hover:bg-teal-50/50',
    },
  };

  const colors = colorSchemes[accentColor] || colorSchemes.blue;

  return (
    <motion.div
      className={cn(
        "bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm",
        "border-l-4 transition-all duration-200",
        isExpanded ? colors.border : "border-l-transparent",
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
        className={cn(
          "w-full px-4 py-3.5 flex items-center justify-between gap-3 transition-colors text-left",
          isHovered && "bg-slate-50/70"
        )}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {Icon && (
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors",
              colors.iconBg
            )}>
              <Icon className={cn("w-5 h-5", colors.iconText)} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <span className="font-semibold text-slate-700 text-sm block truncate">
              {title}
            </span>
            {subtitle && (
              <span className="text-xs text-slate-400 block truncate mt-0.5">
                {subtitle}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {badge && (
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              {badge}
            </span>
          )}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0"
          >
            <ChevronDown className="w-5 h-5 text-slate-400" />
          </motion.div>
        </div>
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
