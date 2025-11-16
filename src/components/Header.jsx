import React from 'react';

const Header = () => {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-lg">
      <div className="flex items-center gap-4">
        {/* BMW Logo Placeholder */}
        <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-lg">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 border-4 border-blue-600 rounded-full"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-blue-600 font-bold text-xl">BMW</span>
            </div>
          </div>
        </div>

        {/* Title and Subtitle */}
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Bewerbungssimulator</h1>
          <p className="text-blue-100 mt-1">Ausbildung: Mechatroniker bei BMW Group</p>
        </div>
      </div>

      {/* Interviewer Info */}
      <div className="mt-4 bg-blue-800/30 rounded-lg p-3 border border-blue-500/30">
        <p className="text-sm text-blue-100">
          <span className="font-semibold">Ihr Gesprächspartner:</span> Herr Müller, Personalverantwortlicher
        </p>
      </div>
    </div>
  );
};

export default Header;
