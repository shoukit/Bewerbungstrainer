import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Label Component
 *
 * Professional form label with consistent styling.
 */
const Label = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <label
      ref={ref}
      className={cn(
        'text-sm font-semibold text-slate-700 leading-none',
        'peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className
      )}
      {...props}
    />
  );
});
Label.displayName = 'Label';

export { Label };
