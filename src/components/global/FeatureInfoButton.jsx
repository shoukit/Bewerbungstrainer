/**
 * FeatureInfoButton - Simple info icon button to show feature information modal
 *
 * Uses the standard Lucide Info icon colored in the feature's accent color.
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';
import { COLORS } from '@/config/colors';
import FeatureInfoModal from './FeatureInfoModal';
import { FEATURE_DESCRIPTIONS } from '@/config/featureDescriptions';

/**
 * FeatureInfoButton Component
 *
 * @param {string} featureId - ID of the feature (e.g., 'simulator', 'roleplay')
 * @param {string} size - 'sm' | 'md' | 'lg' (default: 'md')
 * @param {string} className - Additional CSS classes
 * @param {object} style - Additional inline styles
 */
const FeatureInfoButton = ({
  featureId,
  size = 'md',
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

  // Size configurations - just icon sizes
  const sizes = {
    sm: 20,
    md: 24,
    lg: 28,
  };

  const iconSize = sizes[size] || sizes.md;

  // Use feature color or default to indigo
  const iconColor = feature.color || COLORS.indigo[500];

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
        className={`${className} border-none bg-transparent cursor-pointer flex items-center justify-center transition-all flex-shrink-0 p-1 rounded-full hover:bg-slate-100`}
        title={`Info über ${feature.title}`}
        style={{
          opacity: isHovered ? 0.8 : 1,
          transform: isHovered ? 'scale(1.1)' : 'scale(1)',
          ...style,
        }}
      >
        <Info size={iconSize} color={iconColor} strokeWidth={2} />
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
