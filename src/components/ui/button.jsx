/**
 * Button Component (shadcn/ui pattern)
 *
 * Professional button with ocean-theme colors and multiple variants.
 * Uses INLINE STYLES to avoid WordPress/Elementor CSS conflicts.
 * Supports white-label partner theming via PartnerContext.
 */

import * as React from 'react';
import { useState, useMemo } from 'react';
import { usePartner } from '@/context/PartnerContext';
import { DEFAULT_BRANDING } from '@/config/partners';

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

/**
 * Get variant styles based on branding configuration
 */
const getVariantStyles = (branding) => {
  // Use branding values or fall back to defaults
  const buttonGradient = branding?.['--button-gradient'] || DEFAULT_BRANDING['--button-gradient'];
  const buttonGradientHover = branding?.['--button-gradient-hover'] || DEFAULT_BRANDING['--button-gradient-hover'];
  const buttonSolid = branding?.['--button-solid'] || DEFAULT_BRANDING['--button-solid'];
  const buttonSolidHover = branding?.['--button-solid-hover'] || DEFAULT_BRANDING['--button-solid-hover'];
  const buttonText = branding?.['--button-text'] || DEFAULT_BRANDING['--button-text'];
  const primaryAccent = branding?.['--primary-accent'] || DEFAULT_BRANDING['--primary-accent'];
  const primaryAccentHover = branding?.['--primary-accent-hover'] || DEFAULT_BRANDING['--primary-accent-hover'];
  const primaryAccentLight = branding?.['--primary-accent-light'] || DEFAULT_BRANDING['--primary-accent-light'];

  return {
    default: {
      normal: {
        background: buttonGradient,
        color: buttonText,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      },
      hover: {
        background: buttonGradientHover,
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      },
    },
    solid: {
      normal: {
        backgroundColor: buttonSolid,
        color: buttonText,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      },
      hover: {
        backgroundColor: buttonSolidHover,
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
        border: `2px solid ${primaryAccent}`,
        backgroundColor: 'white',
        color: primaryAccent,
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      },
      hover: {
        backgroundColor: primaryAccentLight,
        borderColor: primaryAccentHover,
        color: primaryAccentHover,
      },
    },
    secondary: {
      normal: {
        backgroundColor: primaryAccentLight,
        color: primaryAccent,
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      },
      hover: {
        backgroundColor: primaryAccent,
        color: buttonText,
      },
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
        color: primaryAccent,
        textDecoration: 'none',
      },
      hover: {
        textDecoration: 'underline',
        color: primaryAccentHover,
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

  // Get partner branding
  const { branding } = usePartner();

  // Memoize variant styles based on branding
  const variantStyles = useMemo(() => getVariantStyles(branding), [branding]);

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
