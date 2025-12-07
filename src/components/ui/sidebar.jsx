import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  History,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
 * Features smooth animations and ocean-theme styling.
 */
const AppSidebar = ({
  isCollapsed,
  onToggleCollapse,
  activeView,
  onNavigate,
  className,
}) => {
  return (
    <motion.aside
      initial={false}
      animate={{
        width: isCollapsed ? 72 : 280,
      }}
      transition={{
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1],
      }}
      className={cn(
        'fixed left-0 top-0 bottom-0 z-40',
        'bg-white border-r border-slate-200',
        'flex flex-col',
        'shadow-lg',
        className
      )}
    >
      {/* Header / Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100">
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
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ocean-blue-600 to-ocean-teal-500 flex items-center justify-center shadow-md">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-slate-900 text-sm leading-tight">
                  Bewerbungs
                </span>
                <span className="font-bold text-ocean-blue-600 text-sm leading-tight">
                  trainer
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
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-ocean-blue-600 to-ocean-teal-500 flex items-center justify-center shadow-md mx-auto"
            >
              <GraduationCap className="w-5 h-5 text-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main CTA Button */}
      <div className="p-3">
        <motion.button
          onClick={() => onNavigate('dashboard')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            'w-full rounded-xl font-semibold transition-all duration-200',
            'bg-gradient-to-r from-ocean-blue-600 to-ocean-teal-500',
            'hover:from-ocean-blue-700 hover:to-ocean-teal-600',
            'text-white shadow-md hover:shadow-lg',
            'flex items-center justify-center gap-2',
            isCollapsed ? 'p-3' : 'px-4 py-3'
          )}
        >
          <Sparkles className="w-5 h-5" />
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="whitespace-nowrap overflow-hidden"
              >
                Üben
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id ||
            (item.id === 'dashboard' && activeView === 'roleplay');

          return (
            <motion.button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              whileHover={{ x: isCollapsed ? 0 : 4 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'w-full rounded-xl transition-all duration-200',
                'flex items-center gap-3',
                'group relative',
                isCollapsed ? 'justify-center p-3' : 'px-4 py-3',
                isActive
                  ? 'bg-ocean-blue-50 text-ocean-blue-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <Icon
                className={cn(
                  'w-5 h-5 flex-shrink-0 transition-colors',
                  isActive ? 'text-ocean-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                )}
              />

              <AnimatePresence mode="wait">
                {!isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col items-start text-left overflow-hidden"
                  >
                    <span className="text-sm whitespace-nowrap">{item.label}</span>
                    <span className="text-xs text-slate-400 whitespace-nowrap">
                      {item.description}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div
                  className={cn(
                    'absolute left-full ml-2 px-3 py-2 rounded-lg',
                    'bg-slate-900 text-white text-sm',
                    'opacity-0 group-hover:opacity-100 pointer-events-none',
                    'transition-opacity duration-200',
                    'whitespace-nowrap z-50'
                  )}
                >
                  {item.label}
                  <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45" />
                </div>
              )}

              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-ocean-blue-600 rounded-r-full"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                />
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Collapse Toggle Button */}
      <div className="p-3 border-t border-slate-100">
        <button
          onClick={onToggleCollapse}
          className={cn(
            'w-full rounded-xl p-3 transition-all duration-200',
            'text-slate-400 hover:text-slate-600 hover:bg-slate-50',
            'flex items-center gap-3',
            isCollapsed ? 'justify-center' : 'justify-start'
          )}
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm">Einklappen</span>
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
const SidebarLayout = ({ children, activeView, onNavigate }) => {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50">
      <AppSidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
        activeView={activeView}
        onNavigate={onNavigate}
      />

      {/* Main Content */}
      <motion.main
        initial={false}
        animate={{
          marginLeft: isCollapsed ? 72 : 280,
        }}
        transition={{
          duration: 0.3,
          ease: [0.4, 0, 0.2, 1],
        }}
        className="min-h-screen"
      >
        {children}
      </motion.main>
    </div>
  );
};

export { AppSidebar, SidebarLayout, NAV_ITEMS };
