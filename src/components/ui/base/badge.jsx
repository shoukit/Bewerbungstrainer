/**
 * Badge Component (shadcn/ui pattern)
 *
 * A versatile badge/tag component with color variants.
 * Uses CVA for variant management.
 */

import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// =============================================================================
// BADGE VARIANTS
// =============================================================================

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-slate-100 text-slate-700',
        secondary: 'bg-slate-200 text-slate-800',
        outline: 'border border-slate-300 text-slate-700',
        // Status colors
        success: 'bg-green-100 text-green-800',
        warning: 'bg-amber-100 text-amber-800',
        error: 'bg-red-100 text-red-800',
        info: 'bg-blue-100 text-blue-800',
        // Soft status colors (for interactive elements)
        'success-soft': 'bg-green-50 text-green-700 border border-green-200',
        'warning-soft': 'bg-amber-50 text-amber-700 border border-amber-200',
        'error-soft': 'bg-red-50 text-red-700 border border-red-200',
        'info-soft': 'bg-blue-50 text-blue-700 border border-blue-200',
      },
      size: {
        sm: 'px-1.5 py-0.5 text-[10px]',
        default: 'px-2 py-1',
        lg: 'px-2.5 py-1.5 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

// =============================================================================
// BADGE COMPONENT
// =============================================================================

const Badge = React.forwardRef(({ className, variant, size, ...props }, ref) => (
  <span ref={ref} className={cn(badgeVariants({ variant, size, className }))} {...props} />
));
Badge.displayName = 'Badge';

// =============================================================================
// TIMESTAMP BADGE (specialized for time displays)
// =============================================================================

const timestampBadgeVariants = cva('inline-flex items-center gap-1 font-mono text-xs rounded', {
  variants: {
    variant: {
      default: 'bg-slate-100 text-slate-600',
      positive: 'bg-green-200 text-green-800',
      negative: 'bg-red-200 text-red-800',
      warning: 'bg-amber-200 text-amber-800',
      info: 'bg-blue-200 text-blue-800',
    },
    size: {
      sm: 'px-1 py-0.5 text-[10px]',
      default: 'px-1.5 py-0.5',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

const TimestampBadge = React.forwardRef(({ className, variant, size, ...props }, ref) => (
  <span ref={ref} className={cn(timestampBadgeVariants({ variant, size, className }))} {...props} />
));
TimestampBadge.displayName = 'TimestampBadge';

// =============================================================================
// EXPORTS
// =============================================================================

export { Badge, TimestampBadge, badgeVariants, timestampBadgeVariants };
