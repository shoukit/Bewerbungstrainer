/**
 * FeedbackTip Component
 *
 * A styled tip/feedback box used throughout the analysis components.
 * Shows helpful suggestions with an icon.
 */

import * as React from 'react';
import { cva } from 'class-variance-authority';
import { Lightbulb, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// VARIANTS
// =============================================================================

const feedbackTipVariants = cva('mt-3 p-3 rounded-lg border', {
  variants: {
    variant: {
      default: 'bg-blue-50 border-blue-200',
      success: 'bg-green-50 border-green-200',
      warning: 'bg-amber-50 border-amber-200',
      info: 'bg-slate-50 border-slate-200',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

const textColorMap = {
  default: 'text-blue-800',
  success: 'text-green-800',
  warning: 'text-amber-800',
  info: 'text-slate-700',
};

const iconColorMap = {
  default: 'text-blue-500',
  success: 'text-green-500',
  warning: 'text-amber-500',
  info: 'text-slate-500',
};

const iconMap = {
  default: Lightbulb,
  success: CheckCircle,
  warning: AlertTriangle,
  info: Info,
};

// =============================================================================
// COMPONENT
// =============================================================================

const FeedbackTip = React.forwardRef(
  ({ className, variant = 'default', icon: CustomIcon, children, ...props }, ref) => {
    const Icon = CustomIcon || iconMap[variant];
    const textColor = textColorMap[variant];
    const iconColor = iconColorMap[variant];

    return (
      <div ref={ref} className={cn(feedbackTipVariants({ variant, className }))} {...props}>
        <div className="flex items-start gap-2">
          <Icon className={cn('w-4 h-4 flex-shrink-0 mt-0.5', iconColor)} />
          <p className={cn('text-xs leading-relaxed', textColor)}>{children}</p>
        </div>
      </div>
    );
  }
);
FeedbackTip.displayName = 'FeedbackTip';

export { FeedbackTip, feedbackTipVariants };
