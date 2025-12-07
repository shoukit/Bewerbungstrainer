import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

/**
 * SelectNative Component
 *
 * A styled native select element with ocean-theme styling.
 * Uses native browser select for maximum compatibility.
 */
const SelectNative = React.forwardRef(({ className, children, ...props }, ref) => {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          // Base styles
          'flex h-11 w-full appearance-none rounded-xl border-2 bg-white pl-4 pr-10 py-2 text-sm text-slate-900',
          // Border & shadow
          'border-slate-200 shadow-sm',
          // Focus state - explicit ocean colors
          'focus:outline-none focus:border-ocean-blue-400 focus:ring-2 focus:ring-ocean-blue-100',
          // Disabled state
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50',
          // Hover state
          'hover:border-slate-300',
          // Cursor
          'cursor-pointer',
          // Transition
          'transition-all duration-200',
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
    </div>
  );
});
SelectNative.displayName = 'SelectNative';

export { SelectNative };
