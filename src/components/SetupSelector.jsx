import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, X, Sparkles, Loader2 } from 'lucide-react';
import { usePartner } from '@/context/PartnerContext';
import { sanitizeColor } from '@/utils/colorUtils';

/**
 * SetupSelector - Compact setup selector with popup modal
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

  const handleSelectSetup = (setupId) => {
    setSelectedSetup(setupId);
    setIsModalOpen(false);
  };

  const handleShowAll = () => {
    clearSelectedSetup();
    setIsModalOpen(false);
  };

  // Sanitize current setup color
  const currentSetupColor = currentSetup ? sanitizeColor(currentSetup.color) : null;

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
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full flex items-center justify-between gap-3 p-3 sm:p-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all cursor-pointer group"
        >
          {/* Left side - Current setup info */}
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                backgroundColor: currentSetupColor ? `${currentSetupColor}15` : '#f1f5f9',
              }}
            >
              {currentSetup ? (
                <span className="text-xl">{currentSetup.icon}</span>
              ) : (
                <Sparkles size={20} className="text-gray-400" />
              )}
            </div>
            <div className="text-left min-w-0">
              <div className="text-sm font-semibold text-gray-900 truncate">
                {currentSetup ? currentSetup.name : 'Alle Szenarien'}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {currentSetup
                  ? `${currentSetup.focus} • ${currentSetup.targetGroup}`
                  : 'Trainings-Setup wählen'
                }
              </div>
            </div>
          </div>

          {/* Right side - Change indicator */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs font-medium text-gray-400 hidden sm:inline group-hover:text-gray-600">
              Ändern
            </span>
            <ChevronDown size={18} className="text-gray-400 group-hover:text-gray-600" />
          </div>
        </button>
      </motion.div>

      {/* Modal Overlay */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999]"
            />

            {/* Modal - properly centered */}
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden pointer-events-auto"
              >
                {/* Header */}
                <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 flex-shrink-0">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                      Trainings-Setup wählen
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Wähle deinen Schwerpunkt für passende Trainingsszenarien
                    </p>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors flex-shrink-0"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Body - Scrollable */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {availableSetups.map((setup) => {
                      const isSelected = currentSetup?.id === setup.id;
                      // Sanitize each setup's color
                      const safeColor = sanitizeColor(setup.color);

                      return (
                        <button
                          key={setup.id}
                          onClick={() => handleSelectSetup(setup.id)}
                          className={`relative p-4 rounded-xl text-left transition-all border-2 hover:shadow-md ${
                            isSelected
                              ? 'shadow-sm'
                              : 'border-gray-100 hover:border-gray-200 bg-white'
                          }`}
                          style={{
                            borderColor: isSelected ? safeColor : undefined,
                            backgroundColor: isSelected ? `${safeColor}08` : undefined,
                          }}
                        >
                          {/* Selected checkmark */}
                          {isSelected && (
                            <div
                              className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: safeColor }}
                            >
                              <Check size={12} className="text-white" strokeWidth={3} />
                            </div>
                          )}

                          {/* Icon */}
                          <div
                            className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
                            style={{ backgroundColor: `${safeColor}15` }}
                          >
                            <span className="text-2xl">{setup.icon}</span>
                          </div>

                          {/* Title */}
                          <h3 className="text-sm font-semibold text-gray-900 mb-1 pr-6">
                            {setup.name}
                          </h3>

                          {/* Description */}
                          <p className="text-xs text-gray-500 leading-relaxed mb-3 line-clamp-2">
                            {setup.description}
                          </p>

                          {/* Tags */}
                          <div className="flex flex-wrap gap-1.5">
                            <span
                              className="inline-flex text-[10px] px-2 py-0.5 rounded-full font-medium"
                              style={{
                                backgroundColor: `${safeColor}15`,
                                color: safeColor,
                              }}
                            >
                              {setup.focus}
                            </span>
                            <span className="inline-flex text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                              {setup.targetGroup}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-4 sm:p-5 border-t border-gray-100 bg-gray-50/80 flex-shrink-0">
                  <button
                    onClick={handleShowAll}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                  >
                    Alle Szenarien anzeigen
                  </button>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
                    style={{ background: primaryAccent }}
                  >
                    Fertig
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default SetupSelector;
