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
  Zap,
  Shuffle,
  Rocket,
  User,
  LogIn,
  LogOut,
  Video,
  LayoutDashboard,
  Shield,
  Users,
  Settings,
} from 'lucide-react';
import { usePartner, useAuth } from '@/context/PartnerContext';
import { useToast } from '@/components/Toast';

/**
 * Ocean theme colors - defined as constants to avoid WordPress CSS conflicts
 * These are the default colors used when no partner branding is active
 */
const OCEAN_COLORS = {
  blue: {
    50: '#E8F4F8',
    100: '#D1E9F1',
    400: '#5FB3D8',
    500: '#4A9EC9',
    600: '#3A7FA7',
    700: '#2D6485',
  },
  teal: {
    500: '#3DA389',
    600: '#2E8A72',
  },
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    400: '#94a3b8',
    600: '#475569',
    700: '#334155',
    900: '#0f172a',
  },
};

/**
 * Helper to get themed colors from partner branding or fall back to defaults
 */
const getThemedColors = (branding) => {
  if (!branding) return null;

  return {
    sidebarBg: branding['--sidebar-bg-color'] || OCEAN_COLORS.slate[50],
    sidebarText: branding['--sidebar-text-color'] || OCEAN_COLORS.slate[900],
    sidebarTextMuted: branding['--sidebar-text-muted'] || OCEAN_COLORS.slate[400],
    sidebarActiveBg: branding['--sidebar-active-bg'] || OCEAN_COLORS.blue[50],
    sidebarActiveText: branding['--sidebar-active-text'] || OCEAN_COLORS.blue[700],
    sidebarHoverBg: branding['--sidebar-hover-bg'] || OCEAN_COLORS.slate[50],
    primaryAccent: branding['--primary-accent'] || OCEAN_COLORS.blue[600],
    borderColor: branding['--border-color'] || OCEAN_COLORS.slate[200],
    borderColorLight: branding['--border-color-light'] || OCEAN_COLORS.slate[100],
  };
};

/**
 * Navigation items configuration
 * moduleId maps to WordPress partner module IDs for filtering
 */
const NAV_ITEMS = [
  {
    id: 'overview',
    moduleId: 'overview', // Always visible
    label: 'Übersicht',
    shortLabel: 'Übersicht',
    icon: LayoutDashboard,
    description: 'Alle Trainingsmöglichkeiten',
    alwaysVisible: true, // This item is always shown regardless of partner config
  },
  {
    id: 'simulator',
    moduleId: 'simulator', // Maps to WordPress module
    label: 'Szenario-Training',
    shortLabel: 'Szenario',
    icon: Target,
    description: 'Frage-Antwort Training mit KI-Feedback',
  },
  {
    id: 'video_training',
    moduleId: 'video_training', // Maps to WordPress module
    label: 'Video-Training',
    shortLabel: 'Video',
    icon: Video,
    description: 'Video-Aufnahme mit KI-Analyse',
  },
  {
    id: 'dashboard',
    moduleId: 'roleplay', // Maps to WordPress module (Live-Gespräche = roleplay)
    label: 'Live-Gespräche',
    shortLabel: 'Live',
    icon: MessageSquare,
    description: 'Live Rollenspiel-Dialoge üben',
  },
  {
    id: 'gym',
    moduleId: 'gym', // Maps to WordPress module
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
    moduleId: 'history', // Maps to WordPress module
    label: 'Meine Sessions',
    shortLabel: 'Sessions',
    icon: History,
    description: 'Vergangene Übungen ansehen',
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
        label: 'Live-Gespräche',
        shortLabel: 'Roleplays',
        icon: MessageSquare,
        description: 'Roleplay-Szenarien verwalten',
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
        label: 'Video-Training',
        shortLabel: 'Video',
        icon: Video,
        description: 'Video-Trainings verwalten',
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
 * Uses inline styles for colors to avoid WordPress/Elementor CSS conflicts.
 * Supports white-label partner theming via PartnerContext.
 */
const AppSidebar = ({
  isCollapsed,
  onToggleCollapse,
  activeView,
  onNavigate,
  headerOffset = 0,
  onLoginClick,
}) => {
  const [expandedItems, setExpandedItems] = React.useState(['gym']); // Gym expanded by default

  // Get partner branding for theming
  const { branding, isWhiteLabel, partnerName, logoUrl, checkModuleAllowed } = usePartner();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { showSuccess } = useToast();
  const themedColors = getThemedColors(branding);

  // Filter nav items based on partner module configuration
  const filteredNavItems = React.useMemo(() => {
    const regularItems = NAV_ITEMS.filter(item => {
      // Always show items marked as alwaysVisible
      if (item.alwaysVisible) return true;
      // Use moduleId if available, otherwise fall back to item id
      const moduleToCheck = item.moduleId || item.id;
      return checkModuleAllowed(moduleToCheck);
    });

    // Add admin items if user is admin
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
    // Default colors (no partner)
    return {
      sidebarBg: '#ffffff',
      sidebarText: OCEAN_COLORS.slate[900],
      sidebarTextMuted: OCEAN_COLORS.slate[400],
      activeBg: OCEAN_COLORS.blue[50],
      activeText: OCEAN_COLORS.blue[700],
      hoverBg: OCEAN_COLORS.slate[50],
      primaryAccent: OCEAN_COLORS.blue[600],
      borderColor: OCEAN_COLORS.slate[200],
      borderColorLight: OCEAN_COLORS.slate[100],
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
      style={{
        position: 'fixed',
        left: 0,
        top: headerOffset,
        bottom: 0,
        zIndex: 40,
        backgroundColor: colors.sidebarBg,
        borderRight: `1px solid ${colors.borderColor}`,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      }}
    >
      {/* Header / Logo */}
      <div
        style={{
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          borderBottom: `1px solid ${colors.borderColorLight}`,
        }}
      >
        <AnimatePresence mode="wait">
          {!isCollapsed ? (
            <motion.div
              key="logo-full"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
            >
              {/* Partner logo or default gradient logo */}
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={partnerName}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    objectFit: 'contain',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: isWhiteLabel
                      ? colors.primaryAccent
                      : `linear-gradient(135deg, ${OCEAN_COLORS.blue[600]} 0%, ${OCEAN_COLORS.teal[500]} 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  <GraduationCap style={{ width: '20px', height: '20px', color: 'white' }} />
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {isWhiteLabel ? (
                  <span style={{ fontWeight: 700, color: colors.sidebarText, fontSize: '14px', lineHeight: '1.4' }}>
                    {partnerName}
                  </span>
                ) : (
                  <>
                    <span style={{ fontWeight: 700, color: colors.sidebarText, fontSize: '14px', lineHeight: '1.2' }}>
                      Karriere
                    </span>
                    <span style={{ fontWeight: 700, color: colors.primaryAccent, fontSize: '14px', lineHeight: '1.2' }}>
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
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: isWhiteLabel
                  ? colors.primaryAccent
                  : `linear-gradient(135deg, ${OCEAN_COLORS.blue[600]} 0%, ${OCEAN_COLORS.teal[500]} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                margin: '0 auto',
                overflow: 'hidden',
              }}
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={partnerName}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              ) : (
                <GraduationCap style={{ width: '20px', height: '20px', color: 'white' }} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation Items */}
      <nav style={{ flex: 1, padding: '8px 12px', overflowY: 'auto' }}>
        {filteredNavItems.map((item, index) => {
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
                <div
                  style={{
                    margin: '12px 0',
                    padding: isCollapsed ? '0' : '0 4px',
                    borderTop: `1px solid ${colors.borderColor}`,
                  }}
                >
                  {!isCollapsed && (
                    <span
                      style={{
                        display: 'block',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: colors.sidebarTextMuted,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginTop: '12px',
                        marginBottom: '8px',
                        paddingLeft: '12px',
                      }}
                    >
                      Admin
                    </span>
                  )}
                </div>
              )}
              <button
                onClick={() => handleNavClick(item)}
                style={{
                  width: '100%',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  position: 'relative',
                  padding: isCollapsed ? '12px' : '12px 16px',
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  backgroundColor: isActive ? colors.activeBg : 'transparent',
                  color: isActive ? colors.activeText : colors.sidebarText,
                  fontWeight: isActive ? 600 : 400,
                  fontSize: '14px',
                  border: 'none',
                  cursor: 'pointer',
                  marginBottom: '4px',
                  transition: 'all 0.2s',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = colors.hoverBg;
                    e.currentTarget.style.color = colors.sidebarText;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = colors.sidebarText;
                  }
                }}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '4px',
                      height: '32px',
                      backgroundColor: colors.primaryAccent,
                      borderTopRightRadius: '9999px',
                      borderBottomRightRadius: '9999px',
                    }}
                  />
                )}

                <Icon
                  style={{
                    width: '20px',
                    height: '20px',
                    flexShrink: 0,
                    color: isActive ? colors.primaryAccent : colors.sidebarTextMuted,
                  }}
                />

                {!isCollapsed && (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1, minWidth: 0 }}>
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
                      <span style={{ fontSize: '12px', color: colors.sidebarTextMuted, whiteSpace: 'normal', lineHeight: 1.3 }}>
                        {item.description}
                      </span>
                    </div>
                    {hasSubItems && (
                      <ChevronDown
                        style={{
                          width: '16px',
                          height: '16px',
                          color: colors.sidebarTextMuted,
                          transition: 'transform 0.2s',
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
                      style={{ overflow: 'hidden', marginLeft: '16px' }}
                    >
                      {item.subItems.map((subItem) => {
                        const SubIcon = subItem.icon;
                        const isSubActive = activeView === subItem.id;

                        return (
                          <button
                            key={subItem.id}
                            onClick={() => onNavigate(subItem.id)}
                            style={{
                              width: '100%',
                              borderRadius: '10px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              padding: '10px 14px',
                              backgroundColor: isSubActive ? colors.activeBg : 'transparent',
                              color: isSubActive ? colors.activeText : colors.sidebarText,
                              fontWeight: isSubActive ? 600 : 400,
                              fontSize: '13px',
                              border: 'none',
                              cursor: 'pointer',
                              marginBottom: '2px',
                              transition: 'all 0.2s',
                              textAlign: 'left',
                            }}
                            onMouseEnter={(e) => {
                              if (!isSubActive) {
                                e.currentTarget.style.backgroundColor = colors.hoverBg;
                                e.currentTarget.style.color = colors.sidebarText;
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isSubActive) {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = colors.sidebarText;
                              }
                            }}
                          >
                            <SubIcon
                              style={{
                                width: '16px',
                                height: '16px',
                                flexShrink: 0,
                                color: isSubActive ? colors.primaryAccent : colors.sidebarTextMuted,
                              }}
                            />
                            <span style={{ whiteSpace: 'nowrap' }}>{subItem.label}</span>
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
      <div style={{ padding: '12px', borderTop: `1px solid ${colors.borderColorLight}` }}>
        {isAuthenticated && user ? (
          // Logged in user
          <div style={{ marginBottom: '8px' }}>
            {!isCollapsed && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px',
                  borderRadius: '12px',
                  backgroundColor: 'transparent',
                  border: `1px solid ${colors.borderColor}`,
                  marginBottom: '8px',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: colors.primaryAccent,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '14px',
                    flexShrink: 0,
                  }}
                >
                  {(user.firstName || user.displayName || 'U').charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: colors.sidebarText, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user.displayName || user.firstName || 'Benutzer'}
                  </div>
                  {user.email && (
                    <div style={{ fontSize: '12px', color: colors.sidebarText, opacity: 0.7, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user.email}
                    </div>
                  )}
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                borderRadius: '12px',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                color: colors.sidebarText,
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.hoverBg;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title="Abmelden"
            >
              <LogOut style={{ width: '18px', height: '18px', flexShrink: 0 }} />
              {!isCollapsed && <span>Abmelden</span>}
            </button>
          </div>
        ) : (
          // Not logged in
          <button
            onClick={onLoginClick}
            style={{
              width: '100%',
              borderRadius: '12px',
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              color: colors.sidebarText,
              backgroundColor: 'transparent',
              border: `1px solid ${colors.borderColor}`,
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              transition: 'all 0.2s',
              marginBottom: '8px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.hoverBg;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title="Anmelden"
          >
            <LogIn style={{ width: '18px', height: '18px', flexShrink: 0 }} />
            {!isCollapsed && <span>Anmelden</span>}
          </button>
        )}
      </div>

      {/* Collapse Toggle Button */}
      <div style={{ padding: '0 12px 12px 12px' }}>
        <button
          onClick={onToggleCollapse}
          style={{
            width: '100%',
            borderRadius: '12px',
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            color: colors.sidebarTextMuted,
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'all 0.2s',
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
            <ChevronRight style={{ width: '20px', height: '20px' }} />
          ) : (
            <>
              <ChevronLeft style={{ width: '20px', height: '20px' }} />
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
 * Supports white-label partner theming via PartnerContext.
 */
const MobileNavigation = ({ activeView, onNavigate, headerOffset = 0, onLoginClick }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [expandedItems, setExpandedItems] = React.useState(['gym']);

  // Get partner branding for theming
  const { branding, isWhiteLabel, partnerName, logoUrl, checkModuleAllowed } = usePartner();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { showSuccess } = useToast();
  const themedColors = getThemedColors(branding);

  // Filter nav items based on partner module configuration
  const filteredNavItems = React.useMemo(() => {
    const regularItems = NAV_ITEMS.filter(item => {
      const moduleToCheck = item.moduleId || item.id;
      return checkModuleAllowed(moduleToCheck);
    });

    // Add admin items if user is admin
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
  const colors = React.useMemo(() => {
    if (themedColors) {
      return {
        headerBg: themedColors.sidebarBg,
        headerText: themedColors.sidebarText,
        headerTextMuted: themedColors.sidebarTextMuted,
        menuBg: '#ffffff', // Menu panel stays white for readability
        activeBg: themedColors.sidebarActiveBg,
        activeText: themedColors.sidebarActiveText,
        hoverBg: themedColors.sidebarHoverBg,
        primaryAccent: themedColors.primaryAccent,
        borderColor: themedColors.borderColor,
        textMain: OCEAN_COLORS.slate[700],
        textMuted: OCEAN_COLORS.slate[400],
      };
    }
    // Default colors (no partner)
    return {
      headerBg: '#ffffff',
      headerText: OCEAN_COLORS.slate[900],
      headerTextMuted: OCEAN_COLORS.slate[400],
      menuBg: '#ffffff',
      activeBg: OCEAN_COLORS.blue[50],
      activeText: OCEAN_COLORS.blue[700],
      hoverBg: OCEAN_COLORS.slate[50],
      primaryAccent: OCEAN_COLORS.blue[600],
      borderColor: OCEAN_COLORS.slate[200],
      textMain: OCEAN_COLORS.slate[700],
      textMuted: OCEAN_COLORS.slate[400],
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
        style={{
          position: 'fixed',
          top: headerOffset,
          left: 0,
          right: 0,
          height: '56px',
          backgroundColor: colors.headerBg,
          borderBottom: `1px solid ${colors.borderColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          zIndex: 50,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          transition: 'top 0.15s ease-out',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={partnerName}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                objectFit: 'contain',
              }}
            />
          ) : (
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: isWhiteLabel
                  ? colors.primaryAccent
                  : `linear-gradient(135deg, ${OCEAN_COLORS.blue[600]} 0%, ${OCEAN_COLORS.teal[500]} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <GraduationCap style={{ width: '18px', height: '18px', color: 'white' }} />
            </div>
          )}
          <span style={{ fontWeight: 700, color: colors.headerText, fontSize: '15px' }}>
            {isWhiteLabel ? partnerName : 'Karriere Navigation'}
          </span>
        </div>

        {/* Burger Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            border: 'none',
            backgroundColor: isOpen ? colors.hoverBg : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          {isOpen ? (
            <X style={{ width: '24px', height: '24px', color: colors.headerText }} />
          ) : (
            <Menu style={{ width: '24px', height: '24px', color: colors.headerText }} />
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
              style={{
                position: 'fixed',
                top: headerOffset + 56,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                zIndex: 40,
              }}
            />

            {/* Menu Panel */}
            <motion.nav
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'fixed',
                top: headerOffset + 56,
                left: 0,
                right: 0,
                backgroundColor: colors.menuBg,
                zIndex: 45,
                padding: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                borderBottomLeftRadius: '16px',
                borderBottomRightRadius: '16px',
                maxHeight: '70vh',
                overflowY: 'auto',
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
                    {/* Separator before admin section */}
                    {isAdminItem && (
                      <div
                        style={{
                          margin: '12px 8px',
                          borderTop: `1px solid ${colors.borderColor}`,
                        }}
                      >
                        <span
                          style={{
                            display: 'block',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: colors.textMuted,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            marginTop: '12px',
                            marginBottom: '8px',
                            paddingLeft: '8px',
                          }}
                        >
                          Admin
                        </span>
                      </div>
                    )}
                    <button
                      onClick={() => hasSubItems ? toggleExpanded(item.id) : handleNavigate(item.id)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '14px 16px',
                        borderRadius: '12px',
                        border: 'none',
                        backgroundColor: isActive ? colors.activeBg : 'transparent',
                        color: isActive ? colors.activeText : colors.textMain,
                        fontSize: '15px',
                        fontWeight: isActive ? 600 : 500,
                        cursor: 'pointer',
                        textAlign: 'left',
                        marginBottom: '4px',
                      }}
                    >
                      <Icon
                        style={{
                          width: '22px',
                          height: '22px',
                          color: isActive ? colors.primaryAccent : colors.textMuted,
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div>{item.label}</div>
                        <div style={{ fontSize: '12px', color: colors.textMuted, fontWeight: 400 }}>
                          {item.description}
                        </div>
                      </div>
                      {hasSubItems && (
                        <ChevronDown
                          style={{
                            width: '18px',
                            height: '18px',
                            color: colors.textMuted,
                            transition: 'transform 0.2s',
                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          }}
                        />
                      )}
                    </button>

                    {/* Sub-items for mobile */}
                    {hasSubItems && isExpanded && (
                      <div style={{ marginLeft: '20px', marginBottom: '8px' }}>
                        {item.subItems.map((subItem) => {
                          const SubIcon = subItem.icon;
                          const isSubActive = activeView === subItem.id;

                          return (
                            <button
                              key={subItem.id}
                              onClick={() => handleNavigate(subItem.id)}
                              style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '12px 14px',
                                borderRadius: '10px',
                                border: 'none',
                                backgroundColor: isSubActive ? colors.activeBg : 'transparent',
                                color: isSubActive ? colors.activeText : colors.textMain,
                                fontSize: '14px',
                                fontWeight: isSubActive ? 600 : 400,
                                cursor: 'pointer',
                                textAlign: 'left',
                                marginBottom: '4px',
                              }}
                            >
                              <SubIcon
                                style={{
                                  width: '18px',
                                  height: '18px',
                                  color: isSubActive ? colors.primaryAccent : colors.textMuted,
                                }}
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
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${colors.borderColor}` }}>
                {isAuthenticated && user ? (
                  // Logged in user
                  <>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        backgroundColor: 'transparent',
                        border: `1px solid ${colors.borderColor}`,
                        marginBottom: '8px',
                      }}
                    >
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          backgroundColor: colors.primaryAccent,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontWeight: 600,
                          fontSize: '16px',
                          flexShrink: 0,
                        }}
                      >
                        {(user.firstName || user.displayName || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '15px', color: colors.textMain }}>
                          {user.displayName || user.firstName || 'Benutzer'}
                        </div>
                        {user.email && (
                          <div style={{ fontSize: '13px', color: colors.textMain, opacity: 0.7 }}>
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
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: colors.textMain,
                        fontSize: '15px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <LogOut style={{ width: '20px', height: '20px' }} />
                      <span>Abmelden</span>
                    </button>
                  </>
                ) : (
                  // Not logged in
                  <button
                    onClick={() => {
                      if (onLoginClick) {
                        onLoginClick();
                      }
                      setIsOpen(false);
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '14px 16px',
                      borderRadius: '12px',
                      border: `1px solid ${colors.borderColor}`,
                      backgroundColor: 'transparent',
                      color: colors.textMain,
                      fontSize: '15px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <LogIn style={{ width: '20px', height: '20px' }} />
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
 * Supports white-label partner theming via PartnerContext.
 */
const SidebarLayout = ({ children, activeView, onNavigate, headerOffset = 0, onLoginClick }) => {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);

  // Get partner branding for background
  const { branding } = usePartner();

  // Build background gradient from branding variables
  const appBackground = React.useMemo(() => {
    if (branding) {
      const bgStart = branding['--app-bg-start'] || '#f8fafc';
      const bgMid = branding['--app-bg-mid'] || '#eff6ff';
      const bgEnd = branding['--app-bg-end'] || '#f0fdfa';
      return `linear-gradient(135deg, ${bgStart} 0%, ${bgMid} 50%, ${bgEnd} 100%)`;
    }
    return 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 50%, #f0fdfa 100%)';
  }, [branding]);

  // Check for mobile and saved preference
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
      <div
        style={{
          minHeight: headerOffset > 0 ? `calc(100vh - ${headerOffset}px)` : '100vh',
          background: appBackground,
        }}
      >
        <MobileNavigation
          activeView={activeView}
          onNavigate={onNavigate}
          headerOffset={headerOffset}
          onLoginClick={onLoginClick}
        />

        {/* Main Content with top padding for mobile header */}
        <main
          data-main-content
          style={{
            paddingTop: '56px',
            minHeight: headerOffset > 0 ? `calc(100vh - ${headerOffset}px)` : '100vh',
          }}
        >
          {children}
        </main>
      </div>
    );
  }

  // Desktop Layout
  return (
    <div
      style={{
        minHeight: headerOffset > 0 ? `calc(100vh - ${headerOffset}px)` : '100vh',
        background: appBackground,
      }}
    >
      <AppSidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
        activeView={activeView}
        onNavigate={onNavigate}
        headerOffset={headerOffset}
        onLoginClick={onLoginClick}
      />

      {/* Main Content */}
      <motion.main
        data-main-content
        initial={false}
        animate={{ marginLeft: isCollapsed ? 72 : 280 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        style={{
          minHeight: headerOffset > 0 ? `calc(100vh - ${headerOffset}px)` : '100vh',
        }}
      >
        {children}
      </motion.main>
    </div>
  );
};

export { AppSidebar, SidebarLayout, NAV_ITEMS, OCEAN_COLORS };
