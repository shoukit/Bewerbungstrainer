/**
 * Card Component - Partner-branded card with multiple variants
 *
 * Features:
 * - Automatic partner branding via CSS variables
 * - Multiple variants (default, elevated, interactive)
 * - Responsive padding (smaller on mobile)
 * - Composable sub-components (Header, Body, Footer)
 *
 * @example
 * // Basic card
 * <Card>Content</Card>
 *
 * // Interactive card
 * <Card variant="interactive" onClick={handleClick}>
 *   Clickable content
 * </Card>
 *
 * // Card with header
 * <Card>
 *   <Card.Header gradient>
 *     <Card.Title>Title</Card.Title>
 *   </Card.Header>
 *   <Card.Body>Content</Card.Body>
 * </Card>
 */

import React from 'react';
import { cn } from '@/lib/utils';

// =============================================================================
// MAIN CARD COMPONENT
// =============================================================================

const Card = React.forwardRef(({
  children,
  className,
  variant = 'default',
  padding = true,
  onClick,
  ...props
}, ref) => {
  const variants = {
    default: 'bg-white rounded-2xl border border-gray-200',
    elevated: 'bg-white rounded-2xl border border-gray-200 shadow-lg',
    interactive: 'bg-white rounded-2xl border border-gray-200 transition-all duration-200 hover:shadow-lg hover:border-indigo-200',
    outline: 'bg-white rounded-2xl border-2 border-gray-300',
  };

  // Base shadow for default and interactive variants
  const baseShadow = variant === 'default' || variant === 'interactive'
    ? 'shadow-[0_4px_12px_rgba(0,0,0,0.08)]'
    : '';

  return (
    <div
      ref={ref}
      className={cn(
        variants[variant],
        baseShadow,
        padding && 'p-6',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
});
Card.displayName = 'Card';

// =============================================================================
// CARD HEADER
// =============================================================================

const CardHeader = React.forwardRef(({
  children,
  className,
  gradient = false,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        gradient ? 'card-header-gradient rounded-t-2xl' : 'card-header',
        '-m-6 mb-6', // Negative margin to extend to card edges
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});
CardHeader.displayName = 'CardHeader';

// =============================================================================
// CARD TITLE
// =============================================================================

const CardTitle = React.forwardRef(({
  children,
  className,
  as: Component = 'h3',
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
CardTitle.displayName = 'CardTitle';

// =============================================================================
// CARD DESCRIPTION
// =============================================================================

const CardDescription = React.forwardRef(({
  children,
  className,
  ...props
}, ref) => {
  return (
    <p
      ref={ref}
      className={cn('text-sm text-body-muted mt-1', className)}
      {...props}
    >
      {children}
    </p>
  );
});
CardDescription.displayName = 'CardDescription';

// =============================================================================
// CARD BODY
// =============================================================================

const CardBody = React.forwardRef(({
  children,
  className,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn('space-y-4', className)}
      {...props}
    >
      {children}
    </div>
  );
});
CardBody.displayName = 'CardBody';

// =============================================================================
// CARD FOOTER
// =============================================================================

const CardFooter = React.forwardRef(({
  children,
  className,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'card-footer',
        '-m-6 mt-6', // Negative margin to extend to card edges
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});
CardFooter.displayName = 'CardFooter';

// =============================================================================
// CARD ACTIONS (for header)
// =============================================================================

const CardActions = React.forwardRef(({
  children,
  className,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn('flex items-center gap-2', className)}
      {...props}
    >
      {children}
    </div>
  );
});
CardActions.displayName = 'CardActions';

// =============================================================================
// EXPORTS
// =============================================================================

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Body = CardBody;
Card.Footer = CardFooter;
Card.Actions = CardActions;

export { Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter, CardActions };
export default Card;
