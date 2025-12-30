/**
 * Card Component (shadcn/ui pattern)
 *
 * A flexible card component with variants for different use cases.
 * Uses CVA for variant management.
 */

import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// =============================================================================
// CARD VARIANTS
// =============================================================================

const cardVariants = cva('rounded-xl border bg-white', {
  variants: {
    variant: {
      default: 'border-slate-200',
      elevated: 'border-slate-200 shadow-xl',
      outline: 'border-ocean-blue-200',
      ghost: 'border-transparent bg-transparent',
      gradient: 'border-ocean-blue-100 bg-gradient-to-br from-ocean-blue-50 to-ocean-teal-50',
      ocean: 'border-ocean-blue-200 bg-ocean-blue-50',
    },
    padding: {
      none: 'p-0',
      sm: 'p-3',
      default: 'p-4',
      lg: 'p-6',
    },
  },
  defaultVariants: {
    variant: 'default',
    padding: 'default',
  },
});

// =============================================================================
// CARD COMPONENT
// =============================================================================

const Card = React.forwardRef(({ className, variant, padding, ...props }, ref) => (
  <div ref={ref} className={cn(cardVariants({ variant, padding, className }))} {...props} />
));
Card.displayName = 'Card';

// =============================================================================
// CARD HEADER
// =============================================================================

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex items-center justify-between mb-3', className)} {...props} />
));
CardHeader.displayName = 'CardHeader';

// =============================================================================
// CARD TITLE
// =============================================================================

const cardTitleVariants = cva('flex items-center gap-2', {
  variants: {
    size: {
      sm: 'text-sm',
      default: 'text-base',
      lg: 'text-lg',
    },
  },
  defaultVariants: {
    size: 'sm',
  },
});

const CardTitle = React.forwardRef(({ className, size, icon: Icon, iconColor, children, ...props }, ref) => (
  <div ref={ref} className={cn(cardTitleVariants({ size, className }))} {...props}>
    {Icon && <Icon className={cn('w-4 h-4', iconColor)} />}
    <span className="font-semibold text-slate-800">{children}</span>
  </div>
));
CardTitle.displayName = 'CardTitle';

// =============================================================================
// CARD DESCRIPTION
// =============================================================================

const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-slate-500', className)} {...props} />
));
CardDescription.displayName = 'CardDescription';

// =============================================================================
// CARD CONTENT
// =============================================================================

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('', className)} {...props} />
));
CardContent.displayName = 'CardContent';

// =============================================================================
// CARD FOOTER
// =============================================================================

const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('mt-3 pt-3 border-t border-slate-100', className)} {...props} />
));
CardFooter.displayName = 'CardFooter';

// =============================================================================
// EXPORTS
// =============================================================================

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, cardVariants };
