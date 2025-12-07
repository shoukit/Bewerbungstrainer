/**
 * Button Component (shadcn/ui pattern)
 *
 * Professional button with ocean-theme colors and multiple variants.
 * Uses INLINE STYLES to avoid WordPress/Elementor CSS conflicts.
 */

import * as React from 'react';
import { useState } from 'react';

// Ocean theme colors - inline to avoid WordPress CSS conflicts
const COLORS = {
  blue: {
    50: '#E8F4F8',
    100: '#D1E9F1',
    300: '#8BCCE3',
    600: '#3A7FA7',
    700: '#2D6485',
    900: '#1a3d52',
  },
  teal: {
    500: '#3DA389',
    600: '#2E8A72',
    700: '#247560',
  },
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    700: '#334155',
    900: '#0f172a',
  },
  red: { 600: '#dc2626', 700: '#b91c1c' },
  green: { 600: '#16a34a', 700: '#15803d' },
};

// Base styles shared by all buttons
const baseStyles = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  whiteSpace: 'nowrap',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: 500,
  transition: 'all 0.2s',
  cursor: 'pointer',
  border: 'none',
  outline: 'none',
};

// Size configurations
const sizeStyles = {
  default: { height: '40px', padding: '8px 20px' },
  sm: { height: '32px', padding: '4px 12px', fontSize: '12px', borderRadius: '6px' },
  lg: { height: '48px', padding: '12px 32px', fontSize: '16px' },
  icon: { height: '40px', width: '40px', padding: '0' },
};

// Variant configurations (normal and hover states)
const variantStyles = {
  default: {
    normal: {
      background: `linear-gradient(90deg, ${COLORS.blue[600]} 0%, ${COLORS.teal[500]} 100%)`,
      color: 'white',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    },
    hover: {
      background: `linear-gradient(90deg, ${COLORS.blue[700]} 0%, ${COLORS.teal[600]} 100%)`,
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    },
  },
  destructive: {
    normal: {
      backgroundColor: COLORS.red[600],
      color: 'white',
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    },
    hover: { backgroundColor: COLORS.red[700] },
  },
  outline: {
    normal: {
      border: `2px solid ${COLORS.blue[300]}`,
      backgroundColor: 'white',
      color: COLORS.blue[700],
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    },
    hover: {
      backgroundColor: COLORS.blue[50],
      borderColor: COLORS.blue[600],
    },
  },
  secondary: {
    normal: {
      backgroundColor: COLORS.blue[100],
      color: COLORS.blue[900],
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    },
    hover: { backgroundColor: COLORS.blue[300] },
  },
  ghost: {
    normal: {
      backgroundColor: 'transparent',
      color: COLORS.slate[700],
    },
    hover: {
      backgroundColor: COLORS.slate[100],
      color: COLORS.slate[900],
    },
  },
  link: {
    normal: {
      backgroundColor: 'transparent',
      color: COLORS.blue[600],
      textDecoration: 'none',
    },
    hover: {
      textDecoration: 'underline',
      color: COLORS.blue[700],
    },
  },
  success: {
    normal: {
      backgroundColor: COLORS.green[600],
      color: 'white',
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    },
    hover: { backgroundColor: COLORS.green[700] },
  },
};

// =============================================================================
// BUTTON COMPONENT
// =============================================================================

const Button = React.forwardRef(({
  className,
  variant = 'default',
  size = 'default',
  disabled = false,
  style: customStyle,
  children,
  ...props
}, ref) => {
  const [isHovered, setIsHovered] = useState(false);

  const variantConfig = variantStyles[variant] || variantStyles.default;
  const sizeConfig = sizeStyles[size] || sizeStyles.default;

  const computedStyle = {
    ...baseStyles,
    ...sizeConfig,
    ...variantConfig.normal,
    ...(isHovered && !disabled ? variantConfig.hover : {}),
    ...(disabled ? { opacity: 0.5, cursor: 'not-allowed', pointerEvents: 'none' } : {}),
    ...customStyle,
  };

  return (
    <button
      ref={ref}
      style={computedStyle}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      {children}
    </button>
  );
});
Button.displayName = 'Button';

// Export colors for reuse
export { Button, COLORS as BUTTON_COLORS };
