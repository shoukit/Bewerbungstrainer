import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, X, Sparkles, Loader2 } from 'lucide-react';
import { usePartner } from '@/context/PartnerContext';
import { sanitizeColor } from '@/utils/colorUtils';
import { COLORS } from '@/config/colors';

/**
 * Individual Setup Card with premium styling
 */
const SetupCard = ({ setup, isSelected, onSelect }) => {
  const [isHovered, setIsHovered] = useState(false);
  const safeColor = sanitizeColor(setup.color);

  return (
    <motion.button
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      className="relative w-full text-left rounded-2xl overflow-hidden bg-white transition-all duration-200 outline-none cursor-pointer"
      style={{
        border: isSelected ? `2px solid ${safeColor}` : `2px solid ${COLORS.slate[200]}`,
        boxShadow: isHovered || isSelected
          ? `0 12px 24px -8px ${safeColor}30, 0 4px 8px -2px rgba(0,0,0,0.08)`
          : '0 2px 8px -2px rgba(0,0,0,0.06)',
      }}
    >
      {/* Colored Header Banner - Fixed height for consistency */}
      <div
        className="h-[100px] flex items-center justify-center relative"
        style={{
          background: `linear-gradient(135deg, ${safeColor} 0%, ${safeColor}dd 100%)`,
        }}
      >
        {/* Selected checkmark - top right */}
        {isSelected && (
          <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-md">
            <Check size={14} style={{ color: safeColor }} strokeWidth={3} />
          </div>
        )}

        {/* Large Icon */}
        <span className="text-5xl leading-none" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }}>
          {setup.icon}
        </span>
      </div>

      {/* Card Content - Fixed height for consistency */}
      <div className="p-5 h-[140px] flex flex-col">
        {/* Title */}
        <h3 className="text-base font-bold text-slate-800 mb-1.5 leading-tight">
          {setup.name}
        </h3>

        {/* Description */}
        <p className="text-[13px] text-slate-500 leading-relaxed mb-4 line-clamp-2 flex-1">
          {setup.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-auto">
          <span
            className="inline-flex items-center text-[11px] px-2.5 py-1 rounded-full font-semibold"
            style={{
              backgroundColor: `${safeColor}15`,
              color: safeColor,
            }}
          >
            {setup.focus}
          </span>
          <span className="inline-flex items-center text-[11px] px-2.5 py-1 rounded-full font-medium bg-slate-100 text-slate-500">
            {setup.targetGroup}
          </span>
        </div>
      </div>
    </motion.button>
  );
};

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
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile on mount and resize
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Get partner-branded colors
  const primaryAccent = branding?.['--primary-accent'] || COLORS.indigo[500];

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
        {/* Description text above the selector */}
        <p className="text-sm text-slate-500 mb-2 pl-1">
          Filtere Trainingsszenarien nach deinem Fokus
        </p>

        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl border border-slate-200 bg-white cursor-pointer transition-all duration-200 outline-none hover:border-slate-300 hover:shadow-md"
        >
          {/* Left side - Current setup info */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                backgroundColor: currentSetupColor ? `${currentSetupColor}15` : COLORS.slate[100],
              }}
            >
              {currentSetup ? (
                <span className="text-2xl">{currentSetup.icon}</span>
              ) : (
                <Sparkles size={22} className="text-slate-400" />
              )}
            </div>
            <div className="text-left min-w-0">
              <div className="text-[15px] font-semibold text-slate-800 truncate">
                {currentSetup ? currentSetup.name : 'Alle Szenarien'}
              </div>
              <div className="text-[13px] text-slate-500 truncate">
                {currentSetup
                  ? `${currentSetup.focus} • ${currentSetup.targetGroup}`
                  : 'Trainings-Setup wählen'
                }
              </div>
            </div>
          </div>

          {/* Right side - Change indicator */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[13px] font-medium text-slate-400">
              Ändern
            </span>
            <ChevronDown size={18} className="text-slate-400" />
          </div>
        </button>
      </motion.div>

      {/* Modal Overlay - Rendered via Portal to escape transformed parent */}
      {createPortal(
        <AnimatePresence>
          {isModalOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsModalOpen(false)}
                className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[9999]"
              />

              {/* Modal - Full screen on mobile, centered on desktop */}
              <div
                className={`fixed inset-0 flex ${isMobile ? 'items-end' : 'items-center'} justify-center ${isMobile ? 'p-0' : 'p-4'} z-[10000]`}
              >
                <motion.div
                  initial={{ opacity: 0, y: isMobile ? 100 : 20, scale: isMobile ? 1 : 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: isMobile ? 100 : 20, scale: isMobile ? 1 : 0.95 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                  className={`w-full ${isMobile ? 'max-w-full' : 'max-w-[720px]'} bg-slate-50 shadow-2xl flex flex-col ${isMobile ? 'max-h-[calc(100vh-60px)]' : 'max-h-[calc(100vh-2rem)]'} ${isMobile ? 'rounded-t-3xl' : 'rounded-2xl'} overflow-hidden`}
                >
                  {/* Header */}
                  <div className={`flex items-center justify-between ${isMobile ? 'p-5' : 'px-7 py-6'} bg-white border-b border-slate-200 flex-shrink-0`}>
                    <div>
                      <h2 className={`${isMobile ? 'text-lg' : 'text-[22px]'} font-bold text-slate-900 mb-1`}>
                        Trainings-Setup wählen
                      </h2>
                      <p className={`text-sm text-slate-500 m-0 ${isMobile ? 'hidden' : 'block'}`}>
                        Wähle deinen Schwerpunkt für passende Trainingsszenarien
                      </p>
                    </div>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 border-0 flex items-center justify-center cursor-pointer transition-colors outline-none flex-shrink-0"
                    >
                      <X size={20} className="text-slate-500" />
                    </button>
                  </div>

                  {/* Body - Scrollable */}
                  <div className={`flex-1 overflow-y-auto ${isMobile ? 'p-5' : 'px-7 py-6'}`}>
                    <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
                      {availableSetups.map((setup) => (
                        <SetupCard
                          key={setup.id}
                          setup={setup}
                          isSelected={currentSetup?.id === setup.id}
                          onSelect={() => handleSelectSetup(setup.id)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Footer - Fixed at bottom */}
                  <div
                    className={`flex items-center justify-between ${isMobile ? 'px-5 py-4' : 'px-7 py-5'} bg-white border-t border-slate-200 flex-shrink-0`}
                    style={{ paddingBottom: isMobile ? 'max(20px, env(safe-area-inset-bottom))' : '20px' }}
                  >
                    <button
                      onClick={handleShowAll}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-600 text-sm font-medium cursor-pointer transition-all outline-none"
                    >
                      Alle anzeigen
                    </button>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="px-6 py-2.5 rounded-xl border-0 bg-primary text-white text-sm font-semibold cursor-pointer transition-all outline-none hover:-translate-y-0.5"
                      style={{
                        backgroundColor: primaryAccent,
                        boxShadow: `0 4px 12px -2px ${primaryAccent}50`,
                      }}
                    >
                      Fertig
                    </button>
                  </div>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default SetupSelector;
