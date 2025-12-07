import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  History,
  GraduationCap,
  Target,
} from 'lucide-react';

/**
 * Ocean theme colors - defined as constants to avoid WordPress CSS conflicts
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
 * Navigation items configuration
 */
const NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Praxis-Training',
    shortLabel: 'Training',
    icon: MessageSquare,
    description: 'Live Rollenspiel-Dialoge üben',
  },
  {
    id: 'simulator',
    label: 'Skill Simulator',
    shortLabel: 'Simulator',
    icon: Target,
    description: 'Frage-Antwort Training mit KI-Feedback',
  },
  {
    id: 'history',
    label: 'Meine Sessions',
    shortLabel: 'Sessions',
    icon: History,
    description: 'Vergangene Übungen ansehen',
  },
];

/**
 * AppSidebar Component
 *
 * A collapsible sidebar navigation for the application.
 * Uses inline styles for colors to avoid WordPress/Elementor CSS conflicts.
 */
const AppSidebar = ({
  isCollapsed,
  onToggleCollapse,
  activeView,
  onNavigate,
  headerOffset = 0,
}) => {
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
        backgroundColor: '#ffffff',
        borderRight: `1px solid ${OCEAN_COLORS.slate[200]}`,
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
          borderBottom: `1px solid ${OCEAN_COLORS.slate[100]}`,
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
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: `linear-gradient(135deg, ${OCEAN_COLORS.blue[600]} 0%, ${OCEAN_COLORS.teal[500]} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
              >
                <GraduationCap style={{ width: '20px', height: '20px', color: 'white' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 700, color: OCEAN_COLORS.slate[900], fontSize: '14px', lineHeight: '1.2' }}>
                  Karriere
                </span>
                <span style={{ fontWeight: 700, color: OCEAN_COLORS.blue[600], fontSize: '14px', lineHeight: '1.2' }}>
                  Navigation
                </span>
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
                background: `linear-gradient(135deg, ${OCEAN_COLORS.blue[600]} 0%, ${OCEAN_COLORS.teal[500]} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                margin: '0 auto',
              }}
            >
              <GraduationCap style={{ width: '20px', height: '20px', color: 'white' }} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation Items */}
      <nav style={{ flex: 1, padding: '8px 12px' }}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id ||
            (item.id === 'dashboard' && activeView === 'roleplay');

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                width: '100%',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                position: 'relative',
                padding: isCollapsed ? '12px' : '12px 16px',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                backgroundColor: isActive ? OCEAN_COLORS.blue[50] : 'transparent',
                color: isActive ? OCEAN_COLORS.blue[700] : OCEAN_COLORS.slate[600],
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
                  e.currentTarget.style.backgroundColor = OCEAN_COLORS.slate[50];
                  e.currentTarget.style.color = OCEAN_COLORS.slate[900];
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = OCEAN_COLORS.slate[600];
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
                    backgroundColor: OCEAN_COLORS.blue[600],
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
                  color: isActive ? OCEAN_COLORS.blue[600] : OCEAN_COLORS.slate[400],
                }}
              />

              {!isCollapsed && (
                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>
                  <span style={{ fontSize: '12px', color: OCEAN_COLORS.slate[400], whiteSpace: 'nowrap' }}>
                    {item.description}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Collapse Toggle Button */}
      <div style={{ padding: '12px', borderTop: `1px solid ${OCEAN_COLORS.slate[100]}` }}>
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
            color: OCEAN_COLORS.slate[400],
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = OCEAN_COLORS.slate[50];
            e.currentTarget.style.color = OCEAN_COLORS.slate[600];
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = OCEAN_COLORS.slate[400];
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
 * SidebarLayout Component
 *
 * Layout wrapper that includes the sidebar and main content area.
 */
const SidebarLayout = ({ children, activeView, onNavigate, headerOffset = 0 }) => {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  // Check for saved preference
  React.useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved !== null) {
      setIsCollapsed(JSON.parse(saved));
    }
  }, []);

  const handleToggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', JSON.stringify(newState));
  };

  return (
    <div
      style={{
        minHeight: headerOffset > 0 ? `calc(100vh - ${headerOffset}px)` : '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 50%, #f0fdfa 100%)',
      }}
    >
      <AppSidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
        activeView={activeView}
        onNavigate={onNavigate}
        headerOffset={headerOffset}
      />

      {/* Main Content */}
      <motion.main
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
