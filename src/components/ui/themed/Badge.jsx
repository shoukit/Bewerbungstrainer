/**
 * Badge Component - Partner-branded status badges
 *
 * Features:
 * - Automatic partner branding via CSS variables
 * - Multiple variants (success, error, warning, info, default, brand)
 * - Multiple sizes (sm, md, lg)
 * - Optional icon support
 * - Dot indicator option
 *
 * @example
 * // Basic badge
 * <Badge variant="success">Completed</Badge>
 *
 * // With icon
 * <Badge variant="info" icon={<Star />}>
 *   Featured
 * </Badge>
 *
 * // Dot indicator
 * <Badge variant="warning" dot>
 *   In Progress
 * </Badge>
 */

import React from 'react';
import { cn } from '@/lib/utils';

const Badge = React.forwardRef(({
  children,
  className,
  variant = 'default',
  size = 'md',
  icon,
  dot = false,
  ...props
}, ref) => {
  // Variant classes (using CSS utility classes from index.css)
  const variants = {
    default: 'badge-default',
    success: 'badge-success',
    error: 'badge-error',
    warning: 'badge-warning',
    info: 'badge-info',
    brand: 'badge-brand',
  };

  // Size adjustments
  const sizes = {
    sm: 'text-[10px] px-2 py-0.5',
    md: '', // Default in badge class
    lg: 'text-sm px-3 py-1.5',
  };

  return (
    <span
      ref={ref}
      className={cn(
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {/* Dot indicator */}
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            variant === 'default' ? 'bg-slate-400' : 'bg-current'
          )}
        />
      )}

      {/* Icon */}
      {icon && !dot && (
        <span className="icon-xs">{icon}</span>
      )}

      {/* Content */}
      {children}
    </span>
  );
});

Badge.displayName = 'Badge';

// =============================================================================
// STATUS BADGE (common status patterns)
// =============================================================================

const StatusBadge = ({ status, className, ...props }) => {
  const statusConfig = {
    completed: { variant: 'success', label: 'Abgeschlossen' },
    in_progress: { variant: 'warning', label: 'In Bearbeitung', dot: true },
    draft: { variant: 'default', label: 'Entwurf' },
    failed: { variant: 'error', label: 'Fehlgeschlagen' },
    pending: { variant: 'info', label: 'Ausstehend' },
    active: { variant: 'success', label: 'Aktiv', dot: true },
    inactive: { variant: 'default', label: 'Inaktiv' },
  };

  const config = statusConfig[status] || statusConfig.draft;

  return (
    <Badge
      variant={config.variant}
      dot={config.dot}
      className={className}
      {...props}
    >
      {config.label}
    </Badge>
  );
};

// =============================================================================
// SCORE BADGE (for displaying scores)
// =============================================================================

const ScoreBadge = ({ score, className, ...props }) => {
  const getVariant = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'info';
    if (score >= 40) return 'warning';
    return 'error';
  };

  return (
    <Badge
      variant={getVariant(score)}
      className={cn('font-bold', className)}
      {...props}
    >
      {score}%
    </Badge>
  );
};

export { Badge, StatusBadge, ScoreBadge };
export default Badge;
