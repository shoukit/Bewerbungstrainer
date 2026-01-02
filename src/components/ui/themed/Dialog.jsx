/**
 * Dialog Component - Partner-branded modal dialogs
 *
 * Features:
 * - Automatic partner branding via CSS variables
 * - Accessible (focus trap, escape to close)
 * - Smooth animations
 * - Multiple sizes (sm, md, lg, full)
 * - Backdrop blur effect
 *
 * @example
 * // Basic dialog
 * <Dialog open={isOpen} onClose={setIsOpen}>
 *   <Dialog.Header>
 *     <Dialog.Title>Confirm Action</Dialog.Title>
 *   </Dialog.Header>
 *   <Dialog.Body>
 *     Are you sure?
 *   </Dialog.Body>
 *   <Dialog.Footer>
 *     <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
 *     <Button onClick={handleConfirm}>Confirm</Button>
 *   </Dialog.Footer>
 * </Dialog>
 */

import React, { useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IconButton } from './Button';

// =============================================================================
// MAIN DIALOG COMPONENT
// =============================================================================

const Dialog = ({
  children,
  open,
  onClose,
  size = 'md',
  closeOnBackdrop = true,
  closeOnEscape = true,
  showCloseButton = true,
  className,
}) => {
  const dialogRef = useRef(null);

  // Size classes
  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-[95vw] md:max-w-4xl',
  };

  // Handle escape key
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape' && closeOnEscape) {
      onClose?.(false);
    }
  }, [closeOnEscape, onClose]);

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && closeOnBackdrop) {
      onClose?.(false);
    }
  };

  // Add/remove event listeners
  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, handleKeyDown]);

  // Focus trap
  useEffect(() => {
    if (open && dialogRef.current) {
      dialogRef.current.focus();
    }
  }, [open]);

  if (!open) return null;

  const dialog = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-modal glass-dark animate-fade-in"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Dialog Container */}
      <div
        className="fixed inset-0 z-modal flex items-center justify-center p-4"
        onClick={handleBackdropClick}
      >
        {/* Dialog Panel */}
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
          className={cn(
            'relative w-full bg-white rounded-card shadow-dialog animate-scale-in',
            'max-h-[90vh] overflow-hidden flex flex-col',
            sizes[size],
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          {showCloseButton && (
            <IconButton
              variant="ghost"
              size="sm"
              label="Schließen"
              onClick={() => onClose?.(false)}
              className="absolute top-3 right-3 z-10"
            >
              <X />
            </IconButton>
          )}

          {children}
        </div>
      </div>
    </>
  );

  // Render in portal
  return createPortal(dialog, document.body);
};

// =============================================================================
// DIALOG HEADER
// =============================================================================

const DialogHeader = React.forwardRef(({
  children,
  className,
  gradient = false,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'flex-shrink-0 px-6 pt-6 pb-4',
        gradient && 'bg-brand-gradient text-white -mx-0 -mt-0 rounded-t-card px-6 py-5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});
DialogHeader.displayName = 'DialogHeader';

// =============================================================================
// DIALOG TITLE
// =============================================================================

const DialogTitle = React.forwardRef(({
  children,
  className,
  as: Component = 'h2',
  ...props
}, ref) => {
  return (
    <Component
      ref={ref}
      className={cn('text-lg font-semibold', className)}
      {...props}
    >
      {children}
    </Component>
  );
});
DialogTitle.displayName = 'DialogTitle';

// =============================================================================
// DIALOG DESCRIPTION
// =============================================================================

const DialogDescription = React.forwardRef(({
  children,
  className,
  ...props
}, ref) => {
  return (
    <p
      ref={ref}
      className={cn('text-sm mt-1 opacity-80', className)}
      {...props}
    >
      {children}
    </p>
  );
});
DialogDescription.displayName = 'DialogDescription';

// =============================================================================
// DIALOG BODY
// =============================================================================

const DialogBody = React.forwardRef(({
  children,
  className,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn('flex-1 overflow-y-auto px-6 py-4', className)}
      {...props}
    >
      {children}
    </div>
  );
});
DialogBody.displayName = 'DialogBody';

// =============================================================================
// DIALOG FOOTER
// =============================================================================

const DialogFooter = React.forwardRef(({
  children,
  className,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'flex-shrink-0 flex items-center justify-end gap-3 px-6 py-4',
        'border-t border-slate-100',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});
DialogFooter.displayName = 'DialogFooter';

// =============================================================================
// CONFIRM DIALOG (Preset for confirmations)
// =============================================================================

const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title = 'Bestätigen',
  description,
  confirmLabel = 'Bestätigen',
  cancelLabel = 'Abbrechen',
  variant = 'primary', // primary, danger
  loading = false,
  icon,
}) => {
  const Button = require('./Button').Button;

  return (
    <Dialog open={open} onClose={onClose} size="sm" showCloseButton={false}>
      <DialogBody className="text-center pt-6">
        {icon && (
          <div
            className={cn(
              'w-14 h-14 rounded-full mx-auto mb-4 flex-center',
              variant === 'danger' ? 'bg-red-100' : 'bg-primary/10'
            )}
          >
            {React.cloneElement(icon, {
              size: 24,
              className: variant === 'danger' ? 'text-red-600' : 'text-primary',
            })}
          </div>
        )}
        <DialogTitle className="mb-2">{title}</DialogTitle>
        {description && (
          <p className="text-sm text-slate-600">
            {description}
          </p>
        )}
      </DialogBody>
      <DialogFooter>
        <Button
          variant="ghost"
          onClick={() => onClose?.(false)}
          disabled={loading}
        >
          {cancelLabel}
        </Button>
        <Button
          variant={variant === 'danger' ? 'danger' : 'primary'}
          onClick={onConfirm}
          loading={loading}
        >
          {confirmLabel}
        </Button>
      </DialogFooter>
    </Dialog>
  );
};

// =============================================================================
// EXPORTS
// =============================================================================

Dialog.Header = DialogHeader;
Dialog.Title = DialogTitle;
Dialog.Description = DialogDescription;
Dialog.Body = DialogBody;
Dialog.Footer = DialogFooter;

export {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
  ConfirmDialog,
};
export default Dialog;
