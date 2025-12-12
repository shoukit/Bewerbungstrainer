import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * FormAccordion Component
 *
 * A beautiful accordion component for forms with:
 * - Clean white background
 * - Rounded corners
 * - Icon on the left
 * - Title and optional subtitle
 * - Animated chevron
 * - Smooth expand/collapse animation
 */
export function FormAccordion({
  title,
  subtitle,
  icon: Icon,
  iconColor = 'text-blue-600',
  iconBgColor = 'bg-blue-100',
  children,
  defaultExpanded = false,
  badge,
  className,
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className={cn(
        "bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm",
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
          "w-full px-4 py-3 flex items-center justify-between gap-3 transition-colors text-left",
          isHovered ? "bg-slate-50" : "bg-transparent"
        )}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {Icon && (
            <div className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
              iconBgColor
            )}>
              <Icon className={cn("w-5 h-5", iconColor)} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <span className="font-semibold text-slate-800 text-sm block truncate">
              {title}
            </span>
            {subtitle && (
              <span className="text-xs text-slate-500 block truncate">
                {subtitle}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {badge && (
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {badge}
            </span>
          )}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
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
            <div className="px-4 pb-4 pt-2 border-t border-slate-100">
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
