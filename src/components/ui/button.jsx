/**
 * Button Component (shadcn/ui pattern)
 *
 * Professional button with ocean-theme colors and multiple variants.
 * Uses CVA for variant management.
 */

import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// =============================================================================
// BUTTON VARIANTS - Ocean Theme
// =============================================================================

const buttonVariants = cva(
  // Base styles
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-teal-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        // Primary action - Ocean Blue gradient
        default:
          'bg-gradient-to-r from-ocean-blue-600 to-ocean-teal-600 text-white shadow-md hover:from-ocean-blue-700 hover:to-ocean-teal-700 hover:shadow-lg active:scale-[0.98]',
        // Danger/Delete actions
        destructive:
          'bg-red-600 text-white shadow-sm hover:bg-red-700 active:scale-[0.98]',
        // Secondary outlined button
        outline:
          'border-2 border-ocean-blue-300 bg-white text-ocean-blue-700 shadow-sm hover:bg-ocean-blue-50 hover:border-ocean-blue-400',
        // Subtle secondary action
        secondary:
          'bg-ocean-blue-100 text-ocean-blue-900 shadow-sm hover:bg-ocean-blue-200',
        // Minimal ghost button
        ghost:
          'text-slate-700 hover:bg-slate-100 hover:text-slate-900',
        // Text link style
        link:
          'text-ocean-blue-600 underline-offset-4 hover:underline hover:text-ocean-blue-700',
        // Success action
        success:
          'bg-green-600 text-white shadow-sm hover:bg-green-700 active:scale-[0.98]',
      },
      size: {
        default: 'h-10 px-5 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-12 rounded-lg px-8 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

// =============================================================================
// BUTTON COMPONENT
// =============================================================================

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  );
});
Button.displayName = 'Button';

export { Button, buttonVariants };
