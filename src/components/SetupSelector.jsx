import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings2, ChevronRight, Check, X, Sparkles, Loader2 } from 'lucide-react';
import { usePartner } from '@/context/PartnerContext';

/**
 * SetupSelector - Compact setup selector with popup modal
 *
 * Features:
 * - Professional styling with partner branding support
 * - Responsive design for mobile and desktop
 * - Loading state while fetching setups
 */
const SetupSelector = () => {
  const {
    currentSetup,
    setSelectedSetup,
    clearSelectedSetup,
    availableSetups,
    branding,
    setupsLoading,
  } = usePartner();

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get partner-branded colors
  const primaryAccent = branding?.['--primary-accent'] || '#3A7FA7';
  const headerGradient = branding?.['--header-gradient'] || 'linear-gradient(135deg, #3A7FA7 0%, #2d6a8a 100%)';

  const handleSelectSetup = (setupId) => {
    setSelectedSetup(setupId);
    setIsModalOpen(false);
  };

  const handleClearSetup = () => {
    clearSelectedSetup();
    setIsModalOpen(false);
  };

  // Don't render anything while loading
  if (setupsLoading) {
    return (
      <div className="w-full flex items-center justify-center py-4">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  // Don't render if no setups available
  if (!availableSetups || availableSetups.length === 0) {
    return null;
  }

  return (
    <>
      {/* Compact Setup Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full"
      >
        <div
          className="flex items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border transition-all"
          style={{
            backgroundColor: currentSetup ? `${currentSetup.color}08` : '#f8fafc',
            borderColor: currentSetup ? `${currentSetup.color}30` : '#e2e8f0',
          }}
        >
          {/* Left side - Info */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                backgroundColor: currentSetup ? `${currentSetup.color}15` : `${primaryAccent}10`,
              }}
            >
              {currentSetup ? (
                <span className="text-lg sm:text-xl">{currentSetup.icon}</span>
              ) : (
                <Sparkles size={18} style={{ color: primaryAccent }} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              {currentSetup ? (
                <>
                  <div className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                    {currentSetup.name}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500 truncate hidden sm:block">
                    {currentSetup.focus} • {currentSetup.targetGroup}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-sm sm:text-base font-semibold text-gray-900">
                    Trainings-Setup
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500 hidden sm:block">
                    Wähle deinen Schwerpunkt für passende Szenarien
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right side - Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-white text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98] flex-shrink-0"
            style={{
              background: currentSetup ? currentSetup.color : headerGradient,
            }}
          >
            <Settings2 size={16} className="sm:w-[18px] sm:h-[18px]" />
            <span className="hidden xs:inline sm:inline">
              {currentSetup ? 'Ändern' : 'Wählen'}
            </span>
            <ChevronRight size={14} className="hidden sm:block" />
          </button>
        </div>
      </motion.div>

      {/* Modal Overlay */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsModalOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-[1000] p-0 sm:p-4"
          >
            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full sm:max-w-[800px] sm:rounded-2xl rounded-t-2xl max-h-[90vh] sm:max-h-[85vh] overflow-hidden shadow-2xl flex flex-col"
            >
              {/* Modal Header */}
              <div
                className="p-4 sm:p-5 flex items-center justify-between flex-shrink-0"
                style={{ background: headerGradient }}
              >
                <div className="text-white">
                  <h2 className="text-lg sm:text-xl font-bold">
                    Trainings-Setup wählen
                  </h2>
                  <p className="text-sm opacity-90 mt-0.5 hidden sm:block">
                    Wähle deinen Schwerpunkt für passende Szenarien
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Mobile drag indicator */}
              <div className="sm:hidden flex justify-center py-2 bg-gray-50">
                <div className="w-10 h-1 rounded-full bg-gray-300" />
              </div>

              {/* Modal Body - Scrollable */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5">
                {/* Setup Grid - responsive columns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {availableSetups.map((setup) => {
                    const isSelected = currentSetup?.id === setup.id;
                    return (
                      <button
                        key={setup.id}
                        onClick={() => handleSelectSetup(setup.id)}
                        className="p-4 rounded-xl text-left transition-all relative group hover:shadow-md active:scale-[0.98]"
                        style={{
                          border: `2px solid ${isSelected ? setup.color : '#e2e8f0'}`,
                          backgroundColor: isSelected ? `${setup.color}08` : 'white',
                        }}
                      >
                        {/* Selected indicator */}
                        {isSelected && (
                          <div
                            className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: setup.color }}
                          >
                            <Check size={14} color="white" />
                          </div>
                        )}

                        {/* Icon */}
                        <div
                          className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110"
                          style={{ backgroundColor: `${setup.color}15` }}
                        >
                          <span className="text-xl sm:text-2xl">{setup.icon}</span>
                        </div>

                        {/* Title */}
                        <div className="text-sm sm:text-base font-semibold text-gray-900 mb-1 pr-8">
                          {setup.name}
                        </div>

                        {/* Description */}
                        <div className="text-xs sm:text-sm text-gray-500 line-clamp-2 mb-2">
                          {setup.description}
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1.5">
                          <span
                            className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{
                              backgroundColor: `${setup.color}15`,
                              color: setup.color,
                            }}
                          >
                            {setup.focus}
                          </span>
                          <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                            {setup.targetGroup}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:p-5 border-t border-gray-100 flex items-center justify-between gap-3 flex-shrink-0 bg-gray-50">
                <button
                  onClick={handleClearSetup}
                  className="px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Alle Szenarien
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-lg text-white text-sm font-semibold transition-all hover:opacity-90"
                  style={{ background: headerGradient }}
                >
                  Fertig
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SetupSelector;
