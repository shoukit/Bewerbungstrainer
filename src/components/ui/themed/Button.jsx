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
  // Base styles - shared across all variants
  const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none';

  // Variant classes with softer Indigo color scheme
  const variants = {
    primary: 'bg-indigo-500 text-white shadow-primary hover:bg-indigo-600 hover:-translate-y-0.5 hover:shadow-lg focus:ring-indigo-400',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 hover:-translate-y-0.5 focus:ring-slate-500',
    outline: 'border-2 border-indigo-500 text-indigo-500 hover:bg-indigo-50 hover:-translate-y-0.5 focus:ring-indigo-400',
    ghost: 'text-slate-700 hover:bg-slate-100 hover:-translate-y-0.5 focus:ring-slate-500',
    danger: 'bg-red-500 text-white shadow-[0_4px_14px_rgba(220,38,38,0.30)] hover:bg-red-600 hover:-translate-y-0.5 hover:shadow-lg focus:ring-red-400',
  };

  // Size classes
  const sizes = {
    sm: 'px-3 py-2 text-sm min-h-[36px]',
    md: 'px-4 py-3 text-base min-h-[44px]',
    lg: 'px-6 py-4 text-lg min-h-[52px]',
  };

  // Icon sizes
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {/* Loading spinner */}
      {loading && (
        <Loader2 className={cn(iconSizes[size], 'animate-spin')} />
      )}

      {/* Left icon */}
      {!loading && icon && iconPosition === 'left' && (
        <span className={iconSizes[size]}>{icon}</span>
      )}

      {/* Children */}
      {children}

      {/* Right icon */}
      {!loading && icon && iconPosition === 'right' && (
        <span className={iconSizes[size]}>{icon}</span>
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
  // Base styles for icon buttons
  const baseStyles = 'inline-flex items-center justify-center rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none';

  // Variant classes matching the main Button component (softer colors)
  const variants = {
    primary: 'bg-indigo-500 text-white shadow-primary hover:bg-indigo-600 hover:-translate-y-0.5 hover:shadow-lg focus:ring-indigo-400',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 hover:-translate-y-0.5 focus:ring-slate-500',
    ghost: 'text-slate-700 hover:bg-slate-100 hover:-translate-y-0.5 focus:ring-slate-500',
    danger: 'bg-red-500 text-white shadow-[0_4px_14px_rgba(220,38,38,0.30)] hover:bg-red-600 hover:-translate-y-0.5 hover:shadow-lg focus:ring-red-400',
  };

  // Square sizes
  const sizes = {
    sm: 'w-9 h-9 p-0',
    md: 'w-11 h-11 p-0',
    lg: 'w-13 h-13 p-0',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
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
        baseStyles,
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className={cn(iconSizes[size], 'animate-spin')} />
      ) : (
        <span className={cn('inline-flex items-center justify-center', iconSizes[size])}>{children}</span>
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
