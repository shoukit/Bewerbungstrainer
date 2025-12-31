import React from 'react';
import { Sparkles, MessageCircle, Trophy, Users } from 'lucide-react';

const Header = ({ userName, position, company }) => {
  return (
    <div className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-600 text-white overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent"></div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-400/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

      <div className="relative p-6 md:p-8">
        <div className="flex items-start justify-between gap-4 mb-6">
          {/* Logo and Title */}
          <div className="flex items-center gap-4 flex-1">
            <div className="relative group">
              {/* Logo with modern design */}
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl group-hover:scale-105 transition-transform duration-300">
                <MessageCircle className="w-8 h-8 md:w-10 md:h-10 text-white" strokeWidth={2.5} />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-violet-400 to-violet-500 rounded-full flex items-center justify-center shadow-lg">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            </div>

            {/* Title */}
            <div className="flex-1">
              <h1 className="text-2xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/90 mb-1">
                Dein Bewerbungstrainer
              </h1>
              <p className="text-indigo-200 text-sm md:text-base flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Übe, verbessere dich und glänze im Interview
              </p>
            </div>
          </div>
        </div>

        {/* User Info Cards - if provided */}
        {userName && position && company && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3 hover:bg-white/15 transition-all duration-300">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-200" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-indigo-200 mb-0.5">Bewerber</p>
                  <p className="font-semibold text-sm truncate">{userName}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3 hover:bg-white/15 transition-all duration-300">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-indigo-200" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-indigo-200 mb-0.5">Position</p>
                  <p className="font-semibold text-sm truncate">{position}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3 hover:bg-white/15 transition-all duration-300">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-indigo-200" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-indigo-200 mb-0.5">Unternehmen</p>
                  <p className="font-semibold text-sm truncate">{company}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Interviewer Info */}
        <div className="mt-4 bg-gradient-to-r from-indigo-500/20 to-indigo-600/20 backdrop-blur-sm rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-lg">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-indigo-200 mb-0.5">Dein Gesprächspartner</p>
              <p className="font-semibold">Herr Müller, Personalverantwortlicher</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
