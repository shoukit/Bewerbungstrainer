/**
 * ScenarioCard - Unified Card Component for Dashboard Scenarios
 *
 * A reusable card component that provides consistent styling across all dashboards:
 * - Live-Simulationen (RoleplayDashboard)
 * - Video Training
 * - Szenario-Training (SimulatorDashboard)
 * - Rhetorik-Gym
 * - Smart Briefing
 *
 * Supports both grid and list views.
 *
 * Usage:
 *   import { ScenarioCard, ScenarioCardGrid, ViewToggle } from '@/components/ui/ScenarioCard';
 *
 *   const [viewMode, setViewMode] = useState('grid');
 *
 *   <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />
 *   <ScenarioCardGrid viewMode={viewMode}>
 *     <ScenarioCard
 *       title="Bewerbungsgespräch"
 *       description="Übe ein realistisches Vorstellungsgespräch"
 *       difficulty="medium"
 *       icon={Briefcase}
 *       meta={[{ icon: Clock, text: '~10 Min' }]}
 *       action={{ label: 'Starten', icon: TrendingUp }}
 *       onClick={() => handleSelect(scenario)}
 *       viewMode={viewMode}
 *     />
 *   </ScenarioCardGrid>
 */

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, LayoutGrid, List } from 'lucide-react';
import { COLORS } from '@/config/colors';
import { usePartner } from '@/context/PartnerContext';
import { DEFAULT_BRANDING } from '@/config/partners';

// =============================================================================
// DIFFICULTY CONFIGURATION
// =============================================================================

/**
 * Difficulty level styles - Tailwind classes and labels
 */
const DIFFICULTY_CONFIG = {
  easy: {
    classes: 'bg-green-100 text-green-800 border-green-200',
    label: 'Einfach',
  },
  beginner: {
    classes: 'bg-green-100 text-green-800 border-green-200',
    label: 'Einsteiger',
  },
  medium: {
    classes: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    label: 'Mittel',
  },
  intermediate: {
    classes: 'bg-blue-100 text-blue-800 border-blue-200',
    label: 'Fortgeschritten',
  },
  hard: {
    classes: 'bg-red-100 text-red-800 border-red-200',
    label: 'Schwer',
  },
  advanced: {
    classes: 'bg-purple-100 text-purple-800 border-purple-200',
    label: 'Experte',
  },
};

/**
 * Get difficulty badge configuration
 * @param {string} difficulty - Difficulty level key
 * @returns {object} Configuration with classes and label
 */
const getDifficultyConfig = (difficulty) => {
  return DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.medium;
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/**
 * Badge Component - Used for difficulty, category, and tags
 */
const Badge = ({ children, className = '', style = {} }) => (
  <span
    className={`px-3 py-1 rounded-full text-xs font-semibold border ${className}`}
    style={style}
  >
    {children}
  </span>
);

/**
 * Icon Container - Themed icon wrapper with gradient background
 */
const IconContainer = ({ icon: Icon, gradient, textColor, size = 'md' }) => {
  const sizes = {
    sm: { container: '40px', icon: '20px', radius: '10px' },
    md: { container: '48px', icon: '24px', radius: '12px' },
    lg: { container: '56px', icon: '28px', radius: '14px' },
  };

  const s = sizes[size] || sizes.md;

  return (
    <div
      style={{
        width: s.container,
        height: s.container,
        borderRadius: s.radius,
        background: gradient,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Icon style={{ width: s.icon, height: s.icon, color: textColor }} />
    </div>
  );
};

/**
 * Meta Item - Footer metadata with icon and text
 */
const MetaItem = ({ icon: Icon, text }) => (
  <div className="flex items-center gap-1">
    {Icon && <Icon className="w-3 h-3" />}
    <span>{text}</span>
  </div>
);

/**
 * Action Button - Call-to-action link in footer
 */
const ActionButton = ({ label, icon: Icon, color }) => (
  <div
    className="flex items-center gap-1 text-sm font-semibold"
    style={{ color }}
  >
    <span>{label}</span>
    {Icon && <Icon className="w-4 h-4" />}
  </div>
);

// =============================================================================
// VIEW TOGGLE COMPONENT
// =============================================================================

/**
 * ViewToggle - Toggle between grid and list view
 *
 * @param {object} props
 * @param {'grid' | 'list'} props.viewMode - Current view mode
 * @param {function} props.onViewChange - Callback when view changes
 */
export const ViewToggle = ({ viewMode, onViewChange }) => {
  const { branding } = usePartner();
  const primaryAccent = branding?.['--primary-accent'] || DEFAULT_BRANDING['--primary-accent'];

  // Use inline styles with higher specificity to override Elementor defaults
  const getButtonStyles = (isActive) => ({
    padding: '8px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
    backgroundColor: isActive ? '#ffffff' : 'transparent',
    boxShadow: isActive ? '0 1px 2px rgba(0, 0, 0, 0.05)' : 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  });

  const getIconStyles = (isActive) => ({
    width: '16px',
    height: '16px',
    color: isActive ? primaryAccent : COLORS.slate[500],
  });

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px',
        backgroundColor: COLORS.slate[100],
        borderRadius: '8px',
      }}
    >
      <button
        onClick={() => onViewChange('grid')}
        style={getButtonStyles(viewMode === 'grid')}
        title="Kachelansicht"
      >
        <LayoutGrid style={getIconStyles(viewMode === 'grid')} />
      </button>
      <button
        onClick={() => onViewChange('list')}
        style={getButtonStyles(viewMode === 'list')}
        title="Listenansicht"
      >
        <List style={getIconStyles(viewMode === 'list')} />
      </button>
    </div>
  );
};

// =============================================================================
// MAIN COMPONENT - GRID VIEW
// =============================================================================

/**
 * ScenarioCardGrid - Grid view of the card
 */
const ScenarioCardGridView = ({
  title,
  description,
  difficulty,
  icon,
  subtitle,
  meta = [],
  tags = [],
  action = { label: 'Starten', icon: TrendingUp },
  categoryBadge,
  onClick,
  className = '',
  style = {},
  headerGradient,
  headerText,
  primaryAccent,
  difficultyConfig,
}) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 },
    }}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
  >
    <div
      onClick={onClick}
      className={`bg-white rounded-3xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 cursor-pointer border border-slate-100 h-full flex flex-col ${className}`}
      style={style}
    >
      {/* Header Row - Badges and Icon */}
      <div className="flex items-start justify-between mb-4">
        {/* Left side: Icon or Difficulty Badge */}
        {icon ? (
          <IconContainer
            icon={icon}
            gradient={headerGradient}
            textColor={headerText}
            size="lg"
          />
        ) : difficulty ? (
          <Badge className={difficultyConfig.classes}>
            {difficultyConfig.label}
          </Badge>
        ) : null}

        {/* Right side: Difficulty (if icon shown) + Category + Tags */}
        <div className="flex flex-col items-end gap-2">
          {/* Difficulty badge when icon is shown */}
          {icon && difficulty && (
            <Badge className={difficultyConfig.classes}>
              {difficultyConfig.label}
            </Badge>
          )}

          {/* Category badge (custom component) */}
          {categoryBadge}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex gap-1">
              {tags.slice(0, 2).map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Title */}
      <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>

      {/* Subtitle (optional - used by RhetorikGym) */}
      {subtitle && (
        <div
          className="text-sm font-semibold mb-2"
          style={{ color: primaryAccent }}
        >
          {subtitle}
        </div>
      )}

      {/* Description */}
      {description && (
        <p className="text-slate-600 text-sm mb-4 flex-1 line-clamp-3">
          {description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        {/* Meta information */}
        <div className="flex items-center gap-4 text-xs text-slate-500">
          {meta.map((item, idx) => (
            <MetaItem key={idx} icon={item.icon} text={item.text} />
          ))}
        </div>

        {/* Action button */}
        {action && (
          <ActionButton
            label={action.label}
            icon={action.icon}
            color={primaryAccent}
          />
        )}
      </div>
    </div>
  </motion.div>
);

// =============================================================================
// MAIN COMPONENT - LIST VIEW
// =============================================================================

/**
 * ScenarioCardListView - List/row view of the card
 * Uses inline styles for better compatibility with WordPress/Elementor
 * Responsive: stacks vertically on mobile, horizontal on desktop
 */
const ScenarioCardListView = ({
  title,
  description,
  difficulty,
  icon,
  subtitle,
  meta = [],
  tags = [],
  action = { label: 'Starten', icon: TrendingUp },
  categoryBadge,
  onClick,
  className = '',
  style = {},
  headerGradient,
  headerText,
  primaryAccent,
  difficultyConfig,
}) => {
  // Check if we're on mobile (will be used for initial render, CSS handles the rest)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0 },
      }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div
        onClick={onClick}
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          padding: '16px',
          cursor: 'pointer',
          border: '1px solid #f1f5f9',
          transition: 'all 0.3s',
          ...style,
        }}
        className={className}
      >
        {/* Row 1: Icon + Title + Difficulty Badge */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
          {/* Icon */}
          {icon && (
            <IconContainer
              icon={icon}
              gradient={headerGradient}
              textColor={headerText}
              size="sm"
            />
          )}

          {/* Title & Subtitle */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{
              fontSize: '15px',
              fontWeight: 700,
              color: '#0f172a',
              margin: 0,
              lineHeight: 1.3,
            }}>
              {title}
            </h3>
            {subtitle && (
              <span style={{ fontSize: '12px', fontWeight: 600, color: primaryAccent }}>
                {subtitle}
              </span>
            )}
          </div>

          {/* Difficulty Badge - always visible */}
          {difficulty && (
            <Badge className={difficultyConfig.classes}>
              {difficultyConfig.label}
            </Badge>
          )}
        </div>

        {/* Row 2: Description (if exists) */}
        {description && (
          <p style={{
            color: '#475569',
            fontSize: '13px',
            margin: '0 0 8px 0',
            lineHeight: 1.4,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {description}
          </p>
        )}

        {/* Row 3: Meta + Category + Action */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
        }}>
          {/* Meta information */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: '#64748b' }}>
            {meta.slice(0, 2).map((item, idx) => (
              <MetaItem key={idx} icon={item.icon} text={item.text} />
            ))}
          </div>

          {/* Category + Action */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Category badge */}
            {categoryBadge}

            {/* Action button */}
            {action && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '14px',
                fontWeight: 600,
                color: primaryAccent,
              }}>
                <span>{action.label}</span>
                {action.icon && <action.icon style={{ width: '16px', height: '16px' }} />}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * ScenarioCard Component
 *
 * @param {object} props
 * @param {string} props.title - Card title (required)
 * @param {string} props.description - Card description
 * @param {string} props.difficulty - Difficulty level: easy, medium, hard, beginner, intermediate, advanced
 * @param {React.Component} props.icon - Lucide icon component to display
 * @param {string} props.subtitle - Optional subtitle shown below title (used by RhetorikGym)
 * @param {Array<{icon?: Component, text: string}>} props.meta - Footer metadata items
 * @param {Array<string>} props.tags - Optional tags shown in header
 * @param {{label: string, icon?: Component}} props.action - Call-to-action button config
 * @param {React.Component} props.categoryBadge - Custom category badge component
 * @param {function} props.onClick - Click handler
 * @param {'grid' | 'list'} props.viewMode - View mode (default: 'grid')
 * @param {string} props.className - Additional CSS classes
 * @param {object} props.style - Additional inline styles
 */
export const ScenarioCard = ({
  title,
  description,
  difficulty,
  icon,
  subtitle,
  meta = [],
  tags = [],
  action = { label: 'Starten', icon: TrendingUp },
  categoryBadge,
  onClick,
  viewMode = 'grid',
  className = '',
  style = {},
}) => {
  // Partner theming
  const { branding } = usePartner();
  const headerGradient = branding?.['--header-gradient'] || DEFAULT_BRANDING['--header-gradient'];
  const headerText = branding?.['--header-text'] || DEFAULT_BRANDING['--header-text'];
  const primaryAccent = branding?.['--primary-accent'] || DEFAULT_BRANDING['--primary-accent'];

  const difficultyConfig = getDifficultyConfig(difficulty);

  const commonProps = {
    title,
    description,
    difficulty,
    icon,
    subtitle,
    meta,
    tags,
    action,
    categoryBadge,
    onClick,
    className,
    style,
    headerGradient,
    headerText,
    primaryAccent,
    difficultyConfig,
  };

  if (viewMode === 'list') {
    return <ScenarioCardListView {...commonProps} />;
  }

  return <ScenarioCardGridView {...commonProps} />;
};

// =============================================================================
// CARD GRID/LIST CONTAINER
// =============================================================================

/**
 * ScenarioCardGrid - Responsive container for scenario cards (grid or list)
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - ScenarioCard components
 * @param {string} props.minCardWidth - Minimum card width for grid (default: 320px)
 * @param {'grid' | 'list'} props.viewMode - View mode (default: 'grid')
 */
export const ScenarioCardGrid = ({
  children,
  minCardWidth = '320px',
  viewMode = 'grid',
  className = '',
}) => {
  const isListView = viewMode === 'list';

  return (
    <motion.div
      className={`${isListView ? 'flex flex-col gap-3' : 'grid gap-6'} ${className}`}
      style={
        isListView
          ? {}
          : {
              gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${minCardWidth}), 1fr))`,
            }
      }
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: isListView ? 0.05 : 0.1,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
};

// =============================================================================
// EXPORTS
// =============================================================================

export default ScenarioCard;

// Re-export helpers for convenience
export { getDifficultyConfig, DIFFICULTY_CONFIG };
