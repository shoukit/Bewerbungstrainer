/**
 * FeatureInfoButton - Info icon button to show feature information modal
 *
 * Large, prominent info buttons that are always visible on cards.
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';
import { COLORS, hexToRgba } from '@/config/colors';
import { RADIUS, TRANSITIONS } from '@/config/designTokens';
import FeatureInfoModal from './FeatureInfoModal';
import { FEATURE_DESCRIPTIONS } from '@/config/featureDescriptions';

/**
 * FeatureInfoButton Component
 *
 * @param {string} featureId - ID of the feature (e.g., 'simulator', 'roleplay')
 * @param {string} size - 'sm' | 'md' | 'lg' (default: 'md')
 * @param {string} variant - 'default' | 'subtle' | 'light' | 'dark' (default: 'default')
 * @param {string} className - Additional CSS classes
 * @param {object} style - Additional inline styles
 */
const FeatureInfoButton = ({
  featureId,
  size = 'md',
  variant = 'default',
  className = '',
  style = {},
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [portalContainer, setPortalContainer] = useState(null);

  const feature = FEATURE_DESCRIPTIONS[featureId];

  // Create portal container on mount
  useEffect(() => {
    setPortalContainer(document.body);
  }, []);

  if (!feature) {
    console.warn(`FeatureInfoButton: Unknown feature ID "${featureId}"`);
    return null;
  }

  // Size configurations - balanced sizes for visibility
  const sizes = {
    sm: { button: 32, icon: 18 },
    md: { button: 38, icon: 22 },
    lg: { button: 46, icon: 26 },
  };

  const sizeConfig = sizes[size] || sizes.md;

  // Variant configurations
  const variants = {
    default: {
      // Solid feature color background with white icon for maximum visibility
      background: feature.color,
      color: COLORS.white,
      hoverBackground: hexToRgba(feature.color, 0.85),
    },
    subtle: {
      // Subtle version with higher opacity background for visibility
      background: hexToRgba(feature.color, 0.2),
      color: feature.color,
      hoverBackground: hexToRgba(feature.color, 0.35),
    },
    light: {
      background: 'rgba(255, 255, 255, 0.3)',
      color: COLORS.white,
      hoverBackground: 'rgba(255, 255, 255, 0.5)',
    },
    dark: {
      background: COLORS.slate[600],
      color: COLORS.white,
      hoverBackground: COLORS.slate[700],
    },
  };

  const variantConfig = variants[variant] || variants.default;

  const handleClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={className}
        title={`Info über ${feature.title}`}
        style={{
          width: `${sizeConfig.button}px`,
          height: `${sizeConfig.button}px`,
          borderRadius: RADIUS.full,
          backgroundColor: isHovered ? variantConfig.hoverBackground : variantConfig.background,
          color: variantConfig.color,
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: TRANSITIONS.normal,
          flexShrink: 0,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          transform: isHovered ? 'scale(1.08)' : 'scale(1)',
          ...style,
        }}
      >
        <Info size={sizeConfig.icon} strokeWidth={2} />
      </button>

      {/* Render modal via portal to ensure it's always at body level */}
      {portalContainer && isModalOpen && createPortal(
        <FeatureInfoModal
          featureId={featureId}
          isOpen={isModalOpen}
          onClose={handleClose}
        />,
        portalContainer
      )}
    </>
  );
};

export default FeatureInfoButton;
