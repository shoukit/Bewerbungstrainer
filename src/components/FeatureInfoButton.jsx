/**
 * FeatureInfoButton - Info icon button to show feature information modal
 *
 * Use this button on dashboard cards and feature headers to allow users
 * to view the feature description and learning goals.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
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
 * @param {string} variant - 'default' | 'light' | 'dark' (default: 'default')
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

  const feature = FEATURE_DESCRIPTIONS[featureId];

  if (!feature) {
    console.warn(`FeatureInfoButton: Unknown feature ID "${featureId}"`);
    return null;
  }

  // Size configurations - icon is 70% of button size
  const sizes = {
    sm: { button: 36, icon: 25 },
    md: { button: 44, icon: 31 },
    lg: { button: 52, icon: 36 },
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
      // Subtle version with low opacity background
      background: hexToRgba(feature.color, 0.15),
      color: feature.color,
      hoverBackground: hexToRgba(feature.color, 0.25),
    },
    light: {
      background: 'rgba(255, 255, 255, 0.2)',
      color: COLORS.white,
      hoverBackground: 'rgba(255, 255, 255, 0.3)',
    },
    dark: {
      background: COLORS.slate[500],
      color: COLORS.white,
      hoverBackground: COLORS.slate[600],
    },
  };

  const variantConfig = variants[variant] || variants.default;

  const handleClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setIsModalOpen(true);
  };

  return (
    <>
      <motion.button
        type="button"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleClick}
        className={className}
        title={`Info über ${feature.title}`}
        style={{
          width: `${sizeConfig.button}px`,
          height: `${sizeConfig.button}px`,
          borderRadius: RADIUS.full,
          backgroundColor: variantConfig.background,
          color: variantConfig.color,
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: TRANSITIONS.normal,
          flexShrink: 0,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          ...style,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = variantConfig.hoverBackground;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = variantConfig.background;
        }}
      >
        <Info size={sizeConfig.icon} />
      </motion.button>

      <FeatureInfoModal
        featureId={featureId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

export default FeatureInfoButton;
