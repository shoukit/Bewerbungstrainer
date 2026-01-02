import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Textarea Component
 *
 * Professional multi-line text input with indigo-theme styling.
 * Uses explicit colors to avoid CSS variable conflicts.
 */
const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        // Base styles
        'flex min-h-[100px] w-full rounded-xl border-2 bg-white px-4 py-3 text-sm text-slate-900',
        // Border & shadow
        'border-slate-200 shadow-sm',
        // Placeholder
        'placeholder:text-slate-400',
        // Focus state - explicit indigo colors
        'focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100',
        // Disabled state
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50',
        // Hover state
        'hover:border-slate-300',
        // Resize
        'resize-none',
        // Transition
        'transition-all duration-200',
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = 'Textarea';

export { Textarea };
