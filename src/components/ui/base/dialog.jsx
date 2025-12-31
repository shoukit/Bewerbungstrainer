/**
 * Dialog Component (shadcn/ui pattern)
 *
 * Professional modal dialog with ocean-theme styling.
 * Built on Radix UI Dialog primitive.
 */

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// DIALOG ROOT
// =============================================================================

const Dialog = React.forwardRef(({ onOpenChange, ...props }, ref) => {
  const wrappedOnOpenChange = React.useCallback(
    (open) => {
      if (onOpenChange) {
        onOpenChange(open);
      }
    },
    [onOpenChange]
  );

  return <DialogPrimitive.Root onOpenChange={wrappedOnOpenChange} {...props} />;
});
Dialog.displayName = 'Dialog';

const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

// =============================================================================
// DIALOG OVERLAY
// =============================================================================

const DialogOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-[99] bg-slate-900/60 backdrop-blur-sm',
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

// =============================================================================
// DIALOG CONTENT
// =============================================================================

const DialogContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        // Position & Layout - Bottom sheet on mobile, centered on desktop
        'fixed z-[99] grid w-full gap-4',
        // Mobile: Bottom sheet
        'bottom-0 left-0 right-0 max-h-[90vh] overflow-y-auto',
        'rounded-t-2xl',
        // Desktop: Centered modal
        'sm:bottom-auto sm:left-[50%] sm:top-[50%] sm:right-auto sm:max-h-none',
        'sm:translate-x-[-50%] sm:translate-y-[-50%] sm:max-w-lg sm:rounded-2xl',
        // Styling - Clean white card
        'border border-slate-200 bg-white p-6 shadow-2xl',
        // Animations
        'duration-200',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        // Mobile: slide up/down
        'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
        // Desktop: zoom and slide
        'sm:data-[state=closed]:slide-out-to-bottom-0 sm:data-[state=open]:slide-in-from-bottom-0',
        'sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:zoom-in-95',
        'sm:data-[state=closed]:slide-out-to-left-1/2 sm:data-[state=closed]:slide-out-to-top-[48%]',
        'sm:data-[state=open]:slide-in-from-left-1/2 sm:data-[state=open]:slide-in-from-top-[48%]',
        className
      )}
      {...props}
    >
      {children}
      {/* Close button - 44x44px touch target for accessibility */}
      <DialogPrimitive.Close
        className="absolute right-3 top-3 rounded-xl w-10 h-10 text-slate-400 bg-transparent border-none cursor-pointer transition-all flex items-center justify-center hover:text-slate-600 hover:bg-slate-100"
      >
        <X className="w-5 h-5" />
        <span className="sr-only">Schließen</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

// =============================================================================
// DIALOG HEADER
// =============================================================================

const DialogHeader = ({ className, ...props }) => (
  <div
    className={cn('flex flex-col space-y-2 text-center sm:text-left', className)}
    {...props}
  />
);
DialogHeader.displayName = 'DialogHeader';

// =============================================================================
// DIALOG FOOTER
// =============================================================================

const DialogFooter = ({ className, ...props }) => (
  <div
    className={cn(
      'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end pt-4',
      className
    )}
    {...props}
  />
);
DialogFooter.displayName = 'DialogFooter';

// =============================================================================
// DIALOG TITLE
// =============================================================================

const DialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-xl font-semibold text-slate-900 leading-none tracking-tight', className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

// =============================================================================
// DIALOG DESCRIPTION
// =============================================================================

const DialogDescription = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-slate-600 leading-relaxed', className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

// =============================================================================
// EXPORTS
// =============================================================================

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
