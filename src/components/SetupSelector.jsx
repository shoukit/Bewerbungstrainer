import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, X, Sparkles, Loader2 } from 'lucide-react';
import { usePartner } from '@/context/PartnerContext';
import { sanitizeColor } from '@/utils/colorUtils';

/**
 * Individual Setup Card with hover state management
 */
const SetupCard = ({ setup, isSelected, onSelect }) => {
  const [isHovered, setIsHovered] = useState(false);
  const safeColor = sanitizeColor(setup.color);

  // Determine border and background colors based on state
  const getBorderColor = () => {
    if (isSelected) return safeColor;
    if (isHovered) return '#d1d5db'; // gray-300
    return '#f3f4f6'; // gray-100
  };

  const getBackgroundColor = () => {
    if (isSelected) return `${safeColor}08`;
    if (isHovered) return '#f9fafb'; // gray-50
    return 'white';
  };

  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative p-4 rounded-xl text-left transition-all"
      style={{
        border: `2px solid ${getBorderColor()}`,
        backgroundColor: getBackgroundColor(),
        boxShadow: isHovered || isSelected ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none',
        outline: 'none',
        WebkitAppearance: 'none',
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
      <p className="text-xs text-gray-500 leading-relaxed mb-3" style={{
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        wordBreak: 'break-word',
      }}>
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
        {/* Description text above the selector */}
        <p className="text-sm text-gray-500 mb-2 px-1">
          Filtere Trainingsszenarien nach deinem Fokus
        </p>

        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full flex items-center justify-between gap-3 transition-all cursor-pointer group"
          style={{
            padding: '12px 16px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            backgroundColor: 'white',
            outline: 'none',
            WebkitAppearance: 'none',
          }}
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
                className="fixed inset-0 bg-black/40 backdrop-blur-sm"
                style={{ zIndex: 9999 }}
              />

              {/* Modal - Full screen on mobile, centered on desktop */}
              <div
                className="fixed inset-0 flex items-end sm:items-center justify-center sm:p-4"
                style={{ zIndex: 10000 }}
              >
                <motion.div
                  initial={{ opacity: 0, y: isMobile ? 100 : 20, scale: isMobile ? 1 : 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: isMobile ? 100 : 20, scale: isMobile ? 1 : 0.95 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                  className="w-full sm:max-w-2xl bg-white shadow-2xl flex flex-col"
                  style={{
                    maxHeight: isMobile ? 'calc(100vh - 60px)' : 'calc(100vh - 2rem)',
                    borderRadius: isMobile ? '20px 20px 0 0' : '16px',
                  }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 flex-shrink-0">
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                        Trainings-Setup wählen
                      </h2>
                      <p className="text-sm text-gray-500 mt-0.5 hidden sm:block">
                        Wähle deinen Schwerpunkt für passende Trainingsszenarien
                      </p>
                    </div>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="flex items-center justify-center transition-colors flex-shrink-0"
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        backgroundColor: '#f3f4f6',
                        border: 'none',
                        outline: 'none',
                        cursor: 'pointer',
                        WebkitAppearance: 'none',
                      }}
                    >
                      <X size={18} style={{ color: '#6b7280' }} />
                    </button>
                  </div>

                  {/* Body - Scrollable */}
                  <div
                    className="flex-1 overflow-y-auto p-4 sm:p-5 overscroll-contain"
                    style={{ WebkitOverflowScrolling: 'touch' }}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    className="flex items-center justify-between p-4 sm:p-5 border-t border-gray-100 bg-gray-50/80 flex-shrink-0"
                    style={{ paddingBottom: isMobile ? 'max(16px, env(safe-area-inset-bottom))' : undefined }}
                  >
                    <button
                      onClick={handleShowAll}
                      className="transition-colors"
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        backgroundColor: 'white',
                        color: '#4b5563',
                        fontSize: '14px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        outline: 'none',
                        WebkitAppearance: 'none',
                      }}
                    >
                      Alle anzeigen
                    </button>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="transition-all"
                      style={{
                        padding: '8px 20px',
                        borderRadius: '8px',
                        border: 'none',
                        background: primaryAccent,
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        outline: 'none',
                        WebkitAppearance: 'none',
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
