import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Input Component
 *
 * Professional text input with ocean-theme styling.
 * Uses explicit colors to avoid CSS variable conflicts.
 */
const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        // Base styles
        'flex h-11 w-full rounded-xl border-2 bg-white px-4 py-2 text-sm text-slate-900',
        // Border & shadow
        'border-slate-200 shadow-sm',
        // Placeholder
        'placeholder:text-slate-400',
        // Focus state - explicit ocean colors
        'focus:outline-none focus:border-ocean-blue-400 focus:ring-2 focus:ring-ocean-blue-100',
        // Disabled state
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50',
        // File input
        'file:border-0 file:bg-ocean-blue-50 file:text-ocean-blue-700 file:text-sm file:font-medium file:mr-4 file:px-4 file:py-2 file:rounded-lg',
        // Hover state
        'hover:border-slate-300',
        // Transition
        'transition-all duration-200',
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = 'Input';

export { Input };
