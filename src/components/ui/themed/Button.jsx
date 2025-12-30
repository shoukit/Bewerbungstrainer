/**
 * Button Component - Partner-branded button with multiple variants
 *
 * Features:
 * - Automatic partner branding via CSS variables
 * - Multiple variants (primary, secondary, ghost, danger)
 * - Multiple sizes (sm, md, lg)
 * - Loading and disabled states
 * - Icon support
 * - Touch-friendly minimum size (44px)
 *
 * @example
 * // Primary button
 * <Button>Click me</Button>
 *
 * // Secondary with icon
 * <Button variant="secondary" icon={<Save />}>
 *   Save
 * </Button>
 *
 * // Loading state
 * <Button loading>Saving...</Button>
 */

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const Button = React.forwardRef(({
  children,
  className,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  type = 'button',
  ...props
}, ref) => {
  // Variant classes
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
    danger: 'btn-danger',
  };

  // Size classes
  const sizes = {
    sm: 'btn-sm',
    md: '', // Default size in btn class
    lg: 'btn-lg',
  };

  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      className={cn(
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {/* Loading spinner */}
      {loading && (
        <Loader2 className="icon-md animate-spin" />
      )}

      {/* Left icon */}
      {!loading && icon && iconPosition === 'left' && (
        <span className="icon-md">{icon}</span>
      )}

      {/* Children */}
      {children}

      {/* Right icon */}
      {!loading && icon && iconPosition === 'right' && (
        <span className="icon-md">{icon}</span>
      )}
    </button>
  );
});

Button.displayName = 'Button';

// =============================================================================
// ICON BUTTON (Square, icon only)
// =============================================================================

const IconButton = React.forwardRef(({
  children,
  className,
  variant = 'ghost',
  size = 'md',
  label,
  loading = false,
  disabled = false,
  ...props
}, ref) => {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
    danger: 'btn-danger',
  };

  // Square sizes
  const sizes = {
    sm: 'w-9 h-9 min-h-0 p-0',
    md: 'w-11 h-11 min-h-0 p-0',
    lg: 'w-13 h-13 min-h-0 p-0',
  };

  const iconSizes = {
    sm: 'icon-sm',
    md: 'icon-md',
    lg: 'icon-lg',
  };

  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      type="button"
      disabled={isDisabled}
      aria-label={label}
      title={label}
      className={cn(
        variants[variant],
        sizes[size],
        'rounded-lg',
        className
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className={cn(iconSizes[size], 'animate-spin')} />
      ) : (
        <span className={iconSizes[size]}>{children}</span>
      )}
    </button>
  );
});

IconButton.displayName = 'IconButton';

// =============================================================================
// BUTTON GROUP
// =============================================================================

const ButtonGroup = React.forwardRef(({
  children,
  className,
  orientation = 'horizontal',
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'flex gap-2',
        orientation === 'vertical' && 'flex-col',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

ButtonGroup.displayName = 'ButtonGroup';

export { Button, IconButton, ButtonGroup };
export default Button;
