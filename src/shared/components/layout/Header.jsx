import { Link, useLocation } from 'react-router-dom';
import { Sparkles, MessageCircle, Trophy, Users, Home, History, User as UserIcon } from 'lucide-react';
import { useUser } from '@/shared/contexts';
import { ROUTES } from '@/routes/routes.config';

export default function Header() {
  const { user } = useUser();
  const location = useLocation();

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  // Navigation items
  const navItems = [
    { path: ROUTES.HOME, label: 'Dashboard', icon: Home },
    { path: ROUTES.HISTORY, label: 'Verlauf', icon: History },
    { path: ROUTES.PROFILE, label: 'Profil', icon: UserIcon },
  ];

  return (
    <div className="relative bg-gradient-to-br from-ocean-blue-600 via-ocean-deep-600 to-ocean-teal-500 text-white overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent"></div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-ocean-teal-300/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

      <div className="relative p-6 md:p-8">
        {/* Top Row: Logo + Navigation */}
        <div className="flex items-start justify-between gap-4 mb-6">
          {/* Logo and Title */}
          <Link to={ROUTES.HOME} className="flex items-center gap-4 flex-1 group">
            <div className="relative">
              {/* Logo with modern design */}
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl group-hover:scale-105 transition-transform duration-300">
                <MessageCircle className="w-8 h-8 md:w-10 md:h-10 text-white" strokeWidth={2.5} />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-ocean-teal-300 to-ocean-teal-400 rounded-full flex items-center justify-center shadow-lg">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            </div>

            {/* Title */}
            <div className="flex-1">
              <h1 className="text-2xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/90 mb-1">
                KarriereHeld
              </h1>
              <p className="text-ocean-blue-100 text-sm md:text-base flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Dein Bewerbungstrainer
              </p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200
                  ${isActive(item.path)
                    ? 'bg-white/20 backdrop-blur-sm shadow-lg'
                    : 'hover:bg-white/10'
                  }
                `}
              >
                <item.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        {/* User Info Cards - if user exists */}
        {user?.name && user?.position && user?.company && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3 hover:bg-white/15 transition-all duration-300">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-ocean-blue-200" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-ocean-blue-200 mb-0.5">Bewerber</p>
                  <p className="font-semibold text-sm truncate">{user.name}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3 hover:bg-white/15 transition-all duration-300">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-ocean-blue-200" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-ocean-blue-200 mb-0.5">Position</p>
                  <p className="font-semibold text-sm truncate">{user.position}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3 hover:bg-white/15 transition-all duration-300">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-ocean-blue-200" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-ocean-blue-200 mb-0.5">Unternehmen</p>
                  <p className="font-semibold text-sm truncate">{user.company}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Interviewer Info */}
        <div className="bg-gradient-to-r from-ocean-blue-500/20 to-ocean-deep-500/20 backdrop-blur-sm rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ocean-teal-400 to-ocean-teal-500 flex items-center justify-center shadow-lg">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-ocean-blue-100 mb-0.5">Dein Gesprächspartner</p>
              <p className="font-semibold">Herr Müller, Personalverantwortlicher</p>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden flex items-center gap-2 mt-4">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex-1 px-3 py-2 rounded-lg flex flex-col items-center gap-1 transition-all duration-200
                ${isActive(item.path)
                  ? 'bg-white/20 backdrop-blur-sm shadow-lg'
                  : 'hover:bg-white/10'
                }
              `}
            >
              <item.icon className="w-4 h-4" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
