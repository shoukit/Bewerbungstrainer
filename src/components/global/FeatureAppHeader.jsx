/**
 * FeatureAppHeader - Reusable header for feature apps (Ikigai, DecisionBoard, etc.)
 *
 * Provides consistent header layout with:
 * - Gradient icon
 * - Title and subtitle
 * - Feature info button
 * - History/navigation button
 *
 * Usage:
 *   import FeatureAppHeader from '@/components/FeatureAppHeader';
 *
 *   <FeatureAppHeader
 *     featureId="ikigai"
 *     icon={Compass}
 *     title="Ikigai-Kompass"
 *     subtitle="Finde deine berufliche Bestimmung"
 *     gradient="linear-gradient(135deg, #a855f7, #c084fc)"
 *     historyLabel="Meine Ikigai"
 *     onNavigateToHistory={navigateToHistory}
 *   />
 */

import React from 'react';
import { FolderOpen } from 'lucide-react';
import FeatureInfoButton from './FeatureInfoButton';
import { usePartner } from '@/context/PartnerContext';
import { DEFAULT_BRANDING } from '@/config/partners';
import { COLORS } from '@/config/colors';

/**
 * FeatureAppHeader Component
 *
 * @param {string} featureId - ID for FeatureInfoButton (e.g., 'ikigai', 'decisionboard')
 * @param {React.ComponentType} icon - Lucide icon component
 * @param {string} title - Main header title
 * @param {string} subtitle - Subtitle/description
 * @param {string} gradient - CSS gradient for icon background
 * @param {string} historyLabel - Label for history button (e.g., "Meine Ikigai")
 * @param {function} onNavigateToHistory - Callback for history button click
 * @param {React.ReactNode} extraActions - Additional action buttons
 * @param {string} maxWidth - Max width of header container (default: '1200px')
 */
const FeatureAppHeader = ({
  featureId,
  icon: Icon,
  title,
  subtitle,
  gradient,
  historyLabel,
  onNavigateToHistory,
  extraActions,
  maxWidth = '1200px',
}) => {
  // Partner context for theming
  const { branding } = usePartner();
  const primaryAccent = branding?.['--primary-accent'] || DEFAULT_BRANDING['--primary-accent'];

  return (
    <div style={{ padding: '24px', maxWidth, margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          {/* Left side: Icon + Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: gradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Icon style={{ width: '24px', height: '24px', color: 'white' }} />
            </div>
            <div>
              <h1 style={{
                fontSize: '28px',
                fontWeight: 700,
                color: COLORS.slate[900],
                margin: 0
              }}>
                {title}
              </h1>
              <p style={{ fontSize: '14px', color: COLORS.slate[600], margin: 0 }}>
                {subtitle}
              </p>
            </div>
          </div>

          {/* Right side: Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Feature Info Button */}
            {featureId && (
              <FeatureInfoButton featureId={featureId} size="sm" />
            )}

            {/* Extra custom actions */}
            {extraActions}

            {/* History Button */}
            {onNavigateToHistory && historyLabel && (
              <button
                onClick={onNavigateToHistory}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  borderRadius: '12px',
                  border: `2px solid ${primaryAccent}`,
                  backgroundColor: 'white',
                  color: primaryAccent,
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <FolderOpen size={18} />
                {historyLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeatureAppHeader;
