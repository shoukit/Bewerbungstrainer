/**
 * FeatureAppHeader - Reusable header for feature apps (Ikigai, DecisionBoard, etc.)
 *
 * Provides consistent header layout with:
 * - Gradient icon
 * - Title and subtitle
 * - Feature info button
 * - History/navigation button
 *
 * Updated to match "Clean Professional" design system with:
 * - Indigo to Violet gradient
 * - Improved spacing and breathing room
 * - Enhanced hover states with smooth transitions
 *
 * Usage:
 *   import FeatureAppHeader from '@/components/FeatureAppHeader';
 *
 *   <FeatureAppHeader
 *     featureId="ikigai"
 *     icon={Compass}
 *     title="Ikigai-Kompass"
 *     subtitle="Finde deine berufliche Bestimmung"
 *     gradient="linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)"
 *     historyLabel="Meine Ikigai"
 *     onNavigateToHistory={navigateToHistory}
 *   />
 */

import React from 'react';
import { FolderOpen } from 'lucide-react';
import FeatureInfoButton from './FeatureInfoButton';
import { usePartner } from '@/context/PartnerContext';
import { DEFAULT_BRANDING } from '@/config/partners';
import { GRADIENTS } from '@/config/colors';

/**
 * FeatureAppHeader Component
 *
 * @param {string} featureId - ID for FeatureInfoButton (e.g., 'ikigai', 'decisionboard')
 * @param {React.ComponentType} icon - Lucide icon component
 * @param {string} title - Main header title
 * @param {string} subtitle - Subtitle/description
 * @param {string} gradient - CSS gradient for icon background (default: Indigo to Violet)
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
  gradient = GRADIENTS.header, // New default gradient
  historyLabel,
  onNavigateToHistory,
  extraActions,
  maxWidth = '1200px',
}) => {
  // Partner context for theming
  const { branding } = usePartner();
  const primaryAccent = branding?.['--primary-accent'] || DEFAULT_BRANDING['--primary-accent'];

  return (
    <div className="px-8 py-8 mx-auto" style={{ maxWidth }}>
      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-6">
          {/* Left side: Icon + Title */}
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center shadow-lg transition-transform duration-300 hover:scale-105"
              style={{ background: gradient }}
            >
              <Icon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 m-0 leading-tight">
                {title}
              </h1>
              <p className="text-sm text-slate-600 m-0 mt-1">
                {subtitle}
              </p>
            </div>
          </div>

          {/* Right side: Actions */}
          <div className="flex items-center gap-3">
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
                className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 bg-white text-sm font-semibold cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
                style={{
                  borderColor: primaryAccent,
                  color: primaryAccent,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${primaryAccent}10`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
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
