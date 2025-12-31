import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  MessageSquare,
  History,
  GraduationCap,
  Target,
  Menu,
  X,
  Dumbbell,
  Rocket,
  LogIn,
  LogOut,
  Video,
  LayoutDashboard,
  Shield,
  Users,
  Sparkles,
  Clock,
  Scale,
  Compass,
} from 'lucide-react';
import { usePartner, useAuth } from '@/context/PartnerContext';
import { useToast } from '@/components/global/Toast';
import { COLORS, hexToRgba } from '@/config/colors';

/**
 * Indigo theme colors - using centralized COLORS for consistency
 * These are the default colors used when no partner branding is active
 * Updated for Design System v2.0 "Clean Professional"
 */
const THEME_COLORS = {
  indigo: {
    50: COLORS.indigo[50],
    100: COLORS.indigo[100],
    400: COLORS.indigo[400],
    500: COLORS.indigo[500],
    600: COLORS.indigo[600],
    700: COLORS.indigo[700],
  },
  violet: {
    500: COLORS.violet[500],
    600: COLORS.violet[600],
  },
  slate: {
    50: COLORS.slate[50],
    100: COLORS.slate[100],
    200: COLORS.slate[200],
    400: COLORS.slate[400],
    600: COLORS.slate[600],
    700: COLORS.slate[700],
    900: COLORS.slate[900],
  },
};

/**
 * Default sidebar theme colors (dark sidebar for Karriereheld standard)
 * These match the PHP default_branding and partners.js DEFAULT_BRANDING
 */
const DEFAULT_SIDEBAR_COLORS = {
  sidebarBg: COLORS.slate[800],
  sidebarText: COLORS.slate[50],
  sidebarTextMuted: COLORS.slate[400],
  sidebarActiveBg: hexToRgba(COLORS.indigo[500], 0.15),
  sidebarActiveText: COLORS.indigo[400],
  sidebarHoverBg: 'rgba(255, 255, 255, 0.05)',
  primaryAccent: COLORS.indigo[500],
  borderColor: 'rgba(255, 255, 255, 0.1)',
  borderColorLight: 'rgba(255, 255, 255, 0.05)',
};

/**
 * Helper to get themed colors from partner branding or fall back to defaults
 */
const getThemedColors = (branding) => {
  if (!branding) return null;

  return {
    sidebarBg: branding['--sidebar-bg-color'] || DEFAULT_SIDEBAR_COLORS.sidebarBg,
    sidebarText: branding['--sidebar-text-color'] || DEFAULT_SIDEBAR_COLORS.sidebarText,
    sidebarTextMuted: branding['--sidebar-text-muted'] || DEFAULT_SIDEBAR_COLORS.sidebarTextMuted,
    sidebarActiveBg: branding['--sidebar-active-bg'] || DEFAULT_SIDEBAR_COLORS.sidebarActiveBg,
    sidebarActiveText: branding['--sidebar-active-text'] || DEFAULT_SIDEBAR_COLORS.sidebarActiveText,
    sidebarHoverBg: branding['--sidebar-hover-bg'] || DEFAULT_SIDEBAR_COLORS.sidebarHoverBg,
    primaryAccent: branding['--primary-accent'] || DEFAULT_SIDEBAR_COLORS.primaryAccent,
    borderColor: branding['--border-color'] || DEFAULT_SIDEBAR_COLORS.borderColor,
    borderColorLight: branding['--border-color-light'] || DEFAULT_SIDEBAR_COLORS.borderColorLight,
  };
};

/**
 * Navigation items configuration
 * moduleId maps to WordPress partner module IDs for filtering
 */
const NAV_ITEMS = [
  {
    id: 'overview',
    moduleId: 'overview',
    label: 'Übersicht',
    shortLabel: 'Übersicht',
    icon: LayoutDashboard,
    description: 'Alle Trainingsmöglichkeiten',
    alwaysVisible: true,
  },
  {
    id: 'ikigai',
    moduleId: 'ikigai',
    label: 'Ikigai-Kompass',
    shortLabel: 'Ikigai',
    icon: Compass,
    description: 'Finde deinen idealen Karrierepfad',
  },
  {
    id: 'decision_board',
    moduleId: 'decision_board',
    label: 'Entscheidungs-Kompass',
    shortLabel: 'Entscheidung',
    icon: Scale,
    description: 'KI-gestützte Entscheidungshilfe',
  },
  {
    id: 'smart_briefing',
    moduleId: 'smart_briefing',
    label: 'Smart Briefing',
    shortLabel: 'Briefing',
    icon: Sparkles,
    description: 'KI-Vorbereitungs-Assistent',
  },
  {
    id: 'simulator',
    moduleId: 'simulator',
    label: 'Szenario-Training',
    shortLabel: 'Szenario',
    icon: Target,
    description: 'Frage-Antwort Training mit KI-Feedback',
  },
  {
    id: 'video_training',
    moduleId: 'video_training',
    label: 'Wirkungs-Analyse',
    shortLabel: 'Wirkung',
    icon: Video,
    description: 'Video-Aufnahme mit Wirkungs-Analyse',
  },
  {
    id: 'dashboard',
    moduleId: 'roleplay',
    label: 'Live-Simulationen',
    shortLabel: 'Live',
    icon: MessageSquare,
    description: 'Live Simulationen mit KI-Interviewer',
  },
  {
    id: 'gym',
    moduleId: 'gym',
    label: 'Rhetorik-Gym',
    shortLabel: 'Gym',
    icon: Dumbbell,
    description: 'Spielerisch Rhetorik trainieren',
    subItems: [
      {
        id: 'gym_klassiker',
        label: 'Der Füllwort-Killer',
        shortLabel: 'Klassiker',
        icon: Rocket,
        description: '60s Elevator Pitch',
      },
    ],
  },
  {
    id: 'history',
    moduleId: 'history',
    label: 'Meine Sessions',
    shortLabel: 'Sessions',
    icon: History,
    description: 'Vergangene Übungen ansehen',
  },
  {
    id: 'usage_limits',
    moduleId: 'roleplay',
    label: 'Mein Kontingent',
    shortLabel: 'Kontingent',
    icon: Clock,
    description: 'Verfügbare Gesprächsminuten',
  },
];

/**
 * Admin navigation items - only visible to WordPress admins
 */
const ADMIN_NAV_ITEMS = [
  {
    id: 'admin',
    label: 'Administration',
    shortLabel: 'Admin',
    icon: Shield,
    description: 'Inhalte verwalten',
    adminOnly: true,
    subItems: [
      {
        id: 'admin_roleplays',
        label: 'Live-Simulationen',
        shortLabel: 'Live',
        icon: MessageSquare,
        description: 'Simulations-Szenarien verwalten',
      },
      {
        id: 'admin_simulator',
        label: 'Szenario-Training',
        shortLabel: 'Simulator',
        icon: Target,
        description: 'Simulator-Szenarien verwalten',
      },
      {
        id: 'admin_video',
        label: 'Wirkungs-Analyse',
        shortLabel: 'Wirkung',
        icon: Video,
        description: 'Wirkungs-Analysen verwalten',
      },
      {
        id: 'admin_partners',
        label: 'Partner-Branding',
        shortLabel: 'Partner',
        icon: Users,
        description: 'White-Label Partner verwalten',
      },
    ],
  },
];

/**
 * AppSidebar Component
 *
 * A collapsible sidebar navigation for the application.
 * Uses Tailwind classes with dynamic theming for partner branding.
 */
const AppSidebar = ({
  isCollapsed,
  onToggleCollapse,
  activeView,
  onNavigate,
  headerOffset = 0,
  onLoginClick,
}) => {
  const [expandedItems, setExpandedItems] = React.useState([]);

  // Get partner branding for theming
  const { branding, isWhiteLabel, partnerName, logoUrl, checkModuleAllowed } = usePartner();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { showSuccess } = useToast();
  const themedColors = getThemedColors(branding);

  // Filter nav items based on partner module configuration
  const filteredNavItems = React.useMemo(() => {
    const regularItems = NAV_ITEMS.filter(item => {
      if (item.alwaysVisible) return true;
      const moduleToCheck = item.moduleId || item.id;
      return checkModuleAllowed(moduleToCheck);
    });

    if (isAdmin) {
      return [...regularItems, ...ADMIN_NAV_ITEMS];
    }

    return regularItems;
  }, [checkModuleAllowed, isAdmin]);

  // Handle logout with toast notification
  const handleLogout = async () => {
    await logout();
    showSuccess('Sie wurden erfolgreich abgemeldet', 3000);
  };

  // Determine colors based on whether we have partner branding
  // Falls back to dark sidebar theme matching DEFAULT_SIDEBAR_COLORS
  const colors = React.useMemo(() => {
    if (themedColors) {
      return {
        sidebarBg: themedColors.sidebarBg,
        sidebarText: themedColors.sidebarText,
        sidebarTextMuted: themedColors.sidebarTextMuted,
        activeBg: themedColors.sidebarActiveBg,
        activeText: themedColors.sidebarActiveText,
        hoverBg: themedColors.sidebarHoverBg,
        primaryAccent: themedColors.primaryAccent,
        borderColor: themedColors.borderColor,
        borderColorLight: themedColors.borderColorLight,
      };
    }
    // Default: Dark sidebar with light text (Karriereheld standard theme)
    return {
      sidebarBg: DEFAULT_SIDEBAR_COLORS.sidebarBg,
      sidebarText: DEFAULT_SIDEBAR_COLORS.sidebarText,
      sidebarTextMuted: DEFAULT_SIDEBAR_COLORS.sidebarTextMuted,
      activeBg: DEFAULT_SIDEBAR_COLORS.sidebarActiveBg,
      activeText: DEFAULT_SIDEBAR_COLORS.sidebarActiveText,
      hoverBg: DEFAULT_SIDEBAR_COLORS.sidebarHoverBg,
      primaryAccent: DEFAULT_SIDEBAR_COLORS.primaryAccent,
      borderColor: DEFAULT_SIDEBAR_COLORS.borderColor,
      borderColorLight: DEFAULT_SIDEBAR_COLORS.borderColorLight,
    };
  }, [themedColors]);

  const toggleExpanded = (itemId) => {
    setExpandedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleNavClick = (item) => {
    if (item.subItems && !isCollapsed) {
      toggleExpanded(item.id);
    } else {
      onNavigate(item.id);
    }
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 72 : 280 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="fixed left-0 bottom-0 z-40 flex flex-col shadow-lg"
      style={{
        top: headerOffset,
        backgroundColor: colors.sidebarBg,
        borderRight: `1px solid ${colors.borderColor}`,
      }}
    >
      {/* Header / Logo */}
      <div
        className="h-16 flex items-center justify-between px-4"
        style={{ borderBottom: `1px solid ${colors.borderColorLight}` }}
      >
        <AnimatePresence mode="wait">
          {!isCollapsed ? (
            <motion.div
              key="logo-full"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-3"
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={partnerName}
                  className="w-10 h-10 rounded-xl object-contain"
                />
              ) : (
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shadow"
                  style={{
                    background: isWhiteLabel
                      ? colors.primaryAccent
                      : `linear-gradient(135deg, ${THEME_COLORS.indigo[600]} 0%, ${THEME_COLORS.violet[500]} 100%)`,
                  }}
                >
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
              )}
              <div className="flex flex-col">
                {isWhiteLabel ? (
                  <span className="font-bold text-sm leading-snug" style={{ color: colors.sidebarText }}>
                    {partnerName}
                  </span>
                ) : (
                  <>
                    <span className="font-bold text-sm leading-tight" style={{ color: colors.sidebarText }}>
                      Karriere
                    </span>
                    <span className="font-bold text-sm leading-tight" style={{ color: colors.primaryAccent }}>
                      Navigation
                    </span>
                  </>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="logo-collapsed"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow mx-auto overflow-hidden"
              style={{
                background: isWhiteLabel
                  ? colors.primaryAccent
                  : `linear-gradient(135deg, ${THEME_COLORS.indigo[600]} 0%, ${THEME_COLORS.violet[500]} 100%)`,
              }}
            >
              {logoUrl ? (
                <img src={logoUrl} alt={partnerName} className="w-full h-full object-contain" />
              ) : (
                <GraduationCap className="w-5 h-5 text-white" />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 py-2 px-3 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id ||
            (item.id === 'dashboard' && activeView === 'roleplay') ||
            (item.id === 'gym' && activeView.startsWith('gym')) ||
            (item.id === 'admin' && activeView.startsWith('admin'));
          const hasSubItems = item.subItems && item.subItems.length > 0;
          const isExpanded = expandedItems.includes(item.id);
          const isAdminItem = item.adminOnly;

          return (
            <div key={item.id}>
              {/* Separator before admin section */}
              {isAdminItem && (
                <div className="my-3" style={{ borderTop: `1px solid ${colors.borderColor}` }}>
                  {!isCollapsed && (
                    <span
                      className="block text-xs font-semibold uppercase tracking-wide mt-3 mb-2 pl-3"
                      style={{ color: colors.sidebarTextMuted }}
                    >
                      Admin
                    </span>
                  )}
                </div>
              )}
              <button
                onClick={() => handleNavClick(item)}
                className="w-full rounded-xl flex items-center gap-3 relative mb-1 transition-all duration-200 text-left border-none cursor-pointer"
                style={{
                  padding: isCollapsed ? '12px' : '12px 16px',
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  backgroundColor: isActive ? colors.activeBg : 'transparent',
                  color: isActive ? colors.activeText : colors.sidebarText,
                  fontWeight: isActive ? 600 : 400,
                  fontSize: '14px',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = colors.hoverBg;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full"
                    style={{ backgroundColor: colors.primaryAccent }}
                  />
                )}

                <Icon
                  className="w-5 h-5 shrink-0"
                  style={{ color: isActive ? colors.primaryAccent : colors.sidebarTextMuted }}
                />

                {!isCollapsed && (
                  <>
                    <div className="flex flex-col overflow-hidden flex-1 min-w-0">
                      <span className="whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</span>
                      <span className="text-xs leading-snug" style={{ color: colors.sidebarTextMuted }}>
                        {item.description}
                      </span>
                    </div>
                    {hasSubItems && (
                      <ChevronDown
                        className="w-4 h-4 transition-transform duration-200"
                        style={{
                          color: colors.sidebarTextMuted,
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        }}
                      />
                    )}
                  </>
                )}
              </button>

              {/* Sub-items */}
              {hasSubItems && !isCollapsed && (
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden ml-4"
                    >
                      {item.subItems.map((subItem) => {
                        const SubIcon = subItem.icon;
                        const isSubActive = activeView === subItem.id;

                        return (
                          <button
                            key={subItem.id}
                            onClick={() => onNavigate(subItem.id)}
                            className="w-full rounded-lg flex items-center gap-2.5 mb-0.5 transition-all duration-200 text-left border-none cursor-pointer"
                            style={{
                              padding: '10px 14px',
                              backgroundColor: isSubActive ? colors.activeBg : 'transparent',
                              color: isSubActive ? colors.activeText : colors.sidebarText,
                              fontWeight: isSubActive ? 600 : 400,
                              fontSize: '13px',
                            }}
                            onMouseEnter={(e) => {
                              if (!isSubActive) {
                                e.currentTarget.style.backgroundColor = colors.hoverBg;
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isSubActive) {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }
                            }}
                          >
                            <SubIcon
                              className="w-4 h-4 shrink-0"
                              style={{ color: isSubActive ? colors.primaryAccent : colors.sidebarTextMuted }}
                            />
                            <span className="whitespace-nowrap">{subItem.label}</span>
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-3" style={{ borderTop: `1px solid ${colors.borderColorLight}` }}>
        {isAuthenticated && user ? (
          <div className="mb-2">
            {!isCollapsed && (
              <div
                className="flex items-center gap-2.5 p-2.5 rounded-xl mb-2"
                style={{ border: `1px solid ${colors.borderColor}` }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0"
                  style={{ backgroundColor: colors.primaryAccent }}
                >
                  {(user.firstName || user.displayName || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div
                    className="font-semibold text-sm whitespace-nowrap overflow-hidden text-ellipsis"
                    style={{ color: colors.sidebarText }}
                  >
                    {user.displayName || user.firstName || 'Benutzer'}
                  </div>
                  {user.email && (
                    <div
                      className="text-xs opacity-70 whitespace-nowrap overflow-hidden text-ellipsis"
                      style={{ color: colors.sidebarText }}
                    >
                      {user.email}
                    </div>
                  )}
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="w-full rounded-xl flex items-center gap-2.5 transition-all duration-200 border-none cursor-pointer text-sm"
              style={{
                padding: '10px 12px',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                color: colors.sidebarText,
                backgroundColor: 'transparent',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.hoverBg;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title="Abmelden"
            >
              <LogOut className="w-[18px] h-[18px] shrink-0" />
              {!isCollapsed && <span>Abmelden</span>}
            </button>
          </div>
        ) : (
          <button
            onClick={onLoginClick}
            className="w-full rounded-xl flex items-center gap-2.5 transition-all duration-200 cursor-pointer text-sm font-medium mb-2"
            style={{
              padding: '10px 12px',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              color: colors.sidebarText,
              backgroundColor: 'transparent',
              border: `1px solid ${colors.borderColor}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.hoverBg;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title="Anmelden"
          >
            <LogIn className="w-[18px] h-[18px] shrink-0" />
            {!isCollapsed && <span>Anmelden</span>}
          </button>
        )}
      </div>

      {/* Collapse Toggle Button */}
      <div className="px-3 pb-3">
        <button
          onClick={onToggleCollapse}
          className="w-full rounded-xl flex items-center gap-3 transition-all duration-200 border-none cursor-pointer text-sm"
          style={{
            padding: '12px',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            color: colors.sidebarTextMuted,
            backgroundColor: 'transparent',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.hoverBg;
            e.currentTarget.style.color = colors.sidebarText;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = colors.sidebarTextMuted;
          }}
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span>Einklappen</span>
            </>
          )}
        </button>
      </div>
    </motion.aside>
  );
};

/**
 * Mobile Navigation Component
 * Shows a burger menu that opens a slide-out menu on mobile
 */
const MobileNavigation = ({ activeView, onNavigate, headerOffset = 0, onLoginClick }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [expandedItems, setExpandedItems] = React.useState([]);

  const { branding, isWhiteLabel, partnerName, logoUrl, checkModuleAllowed } = usePartner();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { showSuccess } = useToast();
  const themedColors = getThemedColors(branding);

  const filteredNavItems = React.useMemo(() => {
    const regularItems = NAV_ITEMS.filter(item => {
      const moduleToCheck = item.moduleId || item.id;
      return checkModuleAllowed(moduleToCheck);
    });

    if (isAdmin) {
      return [...regularItems, ...ADMIN_NAV_ITEMS];
    }

    return regularItems;
  }, [checkModuleAllowed, isAdmin]);

  const handleLogout = async () => {
    await logout();
    showSuccess('Sie wurden erfolgreich abgemeldet', 3000);
  };

  // Mobile colors: header uses dark theme, menu panel uses light theme
  const colors = React.useMemo(() => {
    if (themedColors) {
      return {
        headerBg: themedColors.sidebarBg,
        headerText: themedColors.sidebarText,
        headerTextMuted: themedColors.sidebarTextMuted,
        menuBg: THEME_COLORS.white,
        activeBg: themedColors.sidebarActiveBg,
        activeText: themedColors.sidebarActiveText,
        hoverBg: themedColors.sidebarHoverBg,
        primaryAccent: themedColors.primaryAccent,
        borderColor: themedColors.borderColor,
        textMain: THEME_COLORS.slate[700],
        textMuted: THEME_COLORS.slate[400],
      };
    }
    // Default: Dark header matching desktop sidebar (Karriereheld standard)
    return {
      headerBg: DEFAULT_SIDEBAR_COLORS.sidebarBg,
      headerText: DEFAULT_SIDEBAR_COLORS.sidebarText,
      headerTextMuted: DEFAULT_SIDEBAR_COLORS.sidebarTextMuted,
      menuBg: THEME_COLORS.white,
      activeBg: DEFAULT_SIDEBAR_COLORS.sidebarActiveBg,
      activeText: DEFAULT_SIDEBAR_COLORS.sidebarActiveText,
      hoverBg: THEME_COLORS.slate[50],
      primaryAccent: DEFAULT_SIDEBAR_COLORS.primaryAccent,
      borderColor: DEFAULT_SIDEBAR_COLORS.borderColor,
      textMain: THEME_COLORS.slate[700],
      textMuted: THEME_COLORS.slate[400],
    };
  }, [themedColors]);

  const handleNavigate = (id) => {
    onNavigate(id);
    setIsOpen(false);
  };

  const toggleExpanded = (itemId) => {
    setExpandedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  return (
    <>
      {/* Mobile Header Bar */}
      <div
        className="fixed left-0 right-0 h-14 flex items-center justify-between px-4 z-50 shadow-sm transition-[top] duration-150"
        style={{
          top: headerOffset,
          backgroundColor: colors.headerBg,
          borderBottom: `1px solid ${colors.borderColor}`,
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          {logoUrl ? (
            <img src={logoUrl} alt={partnerName} className="w-9 h-9 rounded-lg object-contain" />
          ) : (
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{
                background: isWhiteLabel
                  ? colors.primaryAccent
                  : `linear-gradient(135deg, ${THEME_COLORS.indigo[600]} 0%, ${THEME_COLORS.violet[500]} 100%)`,
              }}
            >
              <GraduationCap className="w-[18px] h-[18px] text-white" />
            </div>
          )}
          <span className="font-bold text-[15px]" style={{ color: colors.headerText }}>
            {isWhiteLabel ? partnerName : 'Karriere Navigation'}
          </span>
        </div>

        {/* Burger Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 rounded-xl border-none flex items-center justify-center cursor-pointer"
          style={{ backgroundColor: isOpen ? colors.hoverBg : 'transparent' }}
        >
          {isOpen ? (
            <X className="w-10 h-10" style={{ color: colors.headerText }} />
          ) : (
            <Menu className="w-10 h-10" style={{ color: colors.headerText }} />
          )}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed left-0 right-0 bottom-0 z-40 bg-black/30"
              style={{ top: headerOffset + 56 }}
            />

            {/* Menu Panel */}
            <motion.nav
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="fixed left-0 right-0 z-[45] p-2 shadow-lg rounded-b-2xl max-h-[70vh] overflow-y-auto"
              style={{
                top: headerOffset + 56,
                backgroundColor: colors.menuBg,
              }}
            >
              {filteredNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id ||
                  (item.id === 'dashboard' && activeView === 'roleplay') ||
                  (item.id === 'gym' && activeView.startsWith('gym')) ||
                  (item.id === 'admin' && activeView.startsWith('admin'));
                const hasSubItems = item.subItems && item.subItems.length > 0;
                const isExpanded = expandedItems.includes(item.id);
                const isAdminItem = item.adminOnly;

                return (
                  <div key={item.id}>
                    {isAdminItem && (
                      <div className="mx-2 my-3" style={{ borderTop: `1px solid ${colors.borderColor}` }}>
                        <span
                          className="block text-xs font-semibold uppercase tracking-wide mt-3 mb-2 pl-2"
                          style={{ color: colors.textMuted }}
                        >
                          Admin
                        </span>
                      </div>
                    )}
                    <button
                      onClick={() => hasSubItems ? toggleExpanded(item.id) : handleNavigate(item.id)}
                      className="w-full flex items-center gap-3 rounded-xl mb-1 text-left border-none cursor-pointer"
                      style={{
                        padding: '14px 16px',
                        backgroundColor: isActive ? colors.activeBg : 'transparent',
                        color: isActive ? colors.activeText : colors.textMain,
                        fontSize: '15px',
                        fontWeight: isActive ? 600 : 500,
                      }}
                    >
                      <Icon
                        className="w-[22px] h-[22px]"
                        style={{ color: isActive ? colors.primaryAccent : colors.textMuted }}
                      />
                      <div className="flex-1">
                        <div>{item.label}</div>
                        <div className="text-xs font-normal" style={{ color: colors.textMuted }}>
                          {item.description}
                        </div>
                      </div>
                      {hasSubItems && (
                        <ChevronDown
                          className="w-[18px] h-[18px] transition-transform duration-200"
                          style={{
                            color: colors.textMuted,
                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          }}
                        />
                      )}
                    </button>

                    {hasSubItems && isExpanded && (
                      <div className="ml-5 mb-2">
                        {item.subItems.map((subItem) => {
                          const SubIcon = subItem.icon;
                          const isSubActive = activeView === subItem.id;

                          return (
                            <button
                              key={subItem.id}
                              onClick={() => handleNavigate(subItem.id)}
                              className="w-full flex items-center gap-2.5 rounded-lg mb-1 text-left border-none cursor-pointer"
                              style={{
                                padding: '12px 14px',
                                backgroundColor: isSubActive ? colors.activeBg : 'transparent',
                                color: isSubActive ? colors.activeText : colors.textMain,
                                fontSize: '14px',
                                fontWeight: isSubActive ? 600 : 400,
                              }}
                            >
                              <SubIcon
                                className="w-[18px] h-[18px]"
                                style={{ color: isSubActive ? colors.primaryAccent : colors.textMuted }}
                              />
                              <span>{subItem.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* User Section in Mobile Menu */}
              <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${colors.borderColor}` }}>
                {isAuthenticated && user ? (
                  <>
                    <div
                      className="flex items-center gap-3 p-3 rounded-xl mb-2"
                      style={{ border: `1px solid ${colors.borderColor}` }}
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-base shrink-0"
                        style={{ backgroundColor: colors.primaryAccent }}
                      >
                        {(user.firstName || user.displayName || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-[15px]" style={{ color: colors.textMain }}>
                          {user.displayName || user.firstName || 'Benutzer'}
                        </div>
                        {user.email && (
                          <div className="text-[13px] opacity-70" style={{ color: colors.textMain }}>
                            {user.email}
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsOpen(false);
                      }}
                      className="w-full flex items-center gap-3 rounded-xl border-none cursor-pointer text-left"
                      style={{
                        padding: '12px 16px',
                        backgroundColor: 'transparent',
                        color: colors.textMain,
                        fontSize: '15px',
                        fontWeight: 500,
                      }}
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Abmelden</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      if (onLoginClick) onLoginClick();
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center gap-3 rounded-xl cursor-pointer text-left"
                    style={{
                      padding: '14px 16px',
                      border: `1px solid ${colors.borderColor}`,
                      backgroundColor: 'transparent',
                      color: colors.textMain,
                      fontSize: '15px',
                      fontWeight: 600,
                    }}
                  >
                    <LogIn className="w-5 h-5" />
                    <span>Anmelden</span>
                  </button>
                )}
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

/**
 * SidebarLayout Component
 *
 * Layout wrapper that includes the sidebar and main content area.
 * Responsive: Shows sidebar on desktop, burger menu on mobile.
 */
const SidebarLayout = ({ children, activeView, onNavigate, headerOffset = 0, onLoginClick }) => {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);

  const { branding } = usePartner();

  const appBackground = React.useMemo(() => {
    if (branding) {
      const bgStart = branding['--app-bg-start'] || THEME_COLORS.slate[50];
      const bgMid = branding['--app-bg-mid'] || THEME_COLORS.blue[50];
      const bgEnd = branding['--app-bg-end'] || THEME_COLORS.teal[50];
      return `linear-gradient(135deg, ${bgStart} 0%, ${bgMid} 50%, ${bgEnd} 100%)`;
    }
    return `linear-gradient(135deg, ${THEME_COLORS.slate[50]} 0%, ${THEME_COLORS.blue[50]} 50%, ${THEME_COLORS.teal[50]} 100%)`;
  }, [branding]);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved !== null) {
      setIsCollapsed(JSON.parse(saved));
    }

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleToggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', JSON.stringify(newState));
  };

  // Mobile Layout
  if (isMobile) {
    return (
      <>
        {/* Fixed full-page background */}
        <div className="fixed inset-0 -z-10" style={{ background: appBackground }} />
        <div style={{ minHeight: headerOffset > 0 ? `calc(100vh - ${headerOffset}px)` : '100vh' }}>
          <MobileNavigation
            activeView={activeView}
            onNavigate={onNavigate}
            headerOffset={headerOffset}
            onLoginClick={onLoginClick}
          />
          <main
            data-main-content
            className="pt-14"
            style={{ minHeight: headerOffset > 0 ? `calc(100vh - ${headerOffset}px)` : '100vh' }}
          >
            {children}
          </main>
        </div>
      </>
    );
  }

  // Desktop Layout
  return (
    <>
      {/* Fixed full-page background */}
      <div className="fixed inset-0 -z-10" style={{ background: appBackground }} />
      <div style={{ minHeight: headerOffset > 0 ? `calc(100vh - ${headerOffset}px)` : '100vh' }}>
        <AppSidebar
          isCollapsed={isCollapsed}
          onToggleCollapse={handleToggleCollapse}
          activeView={activeView}
          onNavigate={onNavigate}
          headerOffset={headerOffset}
          onLoginClick={onLoginClick}
        />
        <motion.main
          data-main-content
          initial={false}
          animate={{ marginLeft: isCollapsed ? 72 : 280 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          style={{ minHeight: headerOffset > 0 ? `calc(100vh - ${headerOffset}px)` : '100vh' }}
        >
          {children}
        </motion.main>
      </div>
    </>
  );
};

export { AppSidebar, SidebarLayout, NAV_ITEMS, THEME_COLORS };
