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
import { COLORS } from '@/config/colors';
import { SPACING, FONT_SIZE, FONT_WEIGHT, RADIUS, TRANSITIONS, SHADOWS } from '@/config/designTokens';

// Base styles shared by all buttons
const baseStyles = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: SPACING[2], // 8px
  whiteSpace: 'nowrap',
  borderRadius: RADIUS.sm, // 8px
  fontSize: FONT_SIZE.base, // 14px
  fontWeight: FONT_WEIGHT.medium, // 500
  transition: `all ${TRANSITIONS.normal}`, // all 0.2s ease
  cursor: 'pointer',
  border: 'none',
  outline: 'none',
};

// Size configurations
const sizeStyles = {
  default: { height: SPACING[10], padding: `${SPACING[2]} ${SPACING[5]}` }, // 40px, 8px 20px
  sm: { height: SPACING[8], padding: `${SPACING[1]} ${SPACING[3]}`, fontSize: FONT_SIZE.xs, borderRadius: '6px' }, // 32px, 4px 12px, 12px, 6px
  lg: { height: SPACING[12], padding: `${SPACING[3]} ${SPACING[8]}`, fontSize: FONT_SIZE.lg }, // 48px, 12px 32px, 16px
  icon: { height: SPACING[10], width: SPACING[10], padding: '0' }, // 40px
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
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', // Custom button shadow for depth
      },
      hover: {
        background: buttonGradientHover,
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', // Custom hover shadow
      },
    },
    solid: {
      normal: {
        backgroundColor: buttonSolid,
        color: buttonText,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', // Custom button shadow for depth
      },
      hover: {
        backgroundColor: buttonSolidHover,
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', // Custom hover shadow
      },
    },
    destructive: {
      normal: {
        backgroundColor: COLORS.red[600],
        color: 'white',
        boxShadow: SHADOWS.xs,
      },
      hover: { backgroundColor: COLORS.red[700] },
    },
    outline: {
      normal: {
        border: `2px solid ${primaryAccent}`,
        backgroundColor: 'white',
        color: primaryAccent,
        boxShadow: SHADOWS.xs,
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
        boxShadow: SHADOWS.xs,
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
        boxShadow: SHADOWS.xs,
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
