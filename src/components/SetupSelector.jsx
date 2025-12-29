import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, X, Sparkles, Loader2 } from 'lucide-react';
import { usePartner } from '@/context/PartnerContext';
import { sanitizeColor } from '@/utils/colorUtils';

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
      style={{
        position: 'relative',
        width: '100%',
        textAlign: 'left',
        borderRadius: '16px',
        overflow: 'hidden',
        border: isSelected ? `2px solid ${safeColor}` : '2px solid #e5e7eb',
        backgroundColor: 'white',
        boxShadow: isHovered || isSelected
          ? `0 12px 24px -8px ${safeColor}30, 0 4px 8px -2px rgba(0,0,0,0.08)`
          : '0 2px 8px -2px rgba(0,0,0,0.06)',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        outline: 'none',
        cursor: 'pointer',
        WebkitAppearance: 'none',
      }}
    >
      {/* Colored Header Banner - Fixed height for consistency */}
      <div
        style={{
          background: `linear-gradient(135deg, ${safeColor} 0%, ${safeColor}dd 100%)`,
          height: '100px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* Selected checkmark - top right */}
        {isSelected && (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }}
          >
            <Check size={14} style={{ color: safeColor }} strokeWidth={3} />
          </div>
        )}

        {/* Large Icon */}
        <span style={{
          fontSize: '48px',
          lineHeight: 1,
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))',
        }}>
          {setup.icon}
        </span>
      </div>

      {/* Card Content - Fixed height for consistency */}
      <div style={{ padding: '20px', height: '140px', display: 'flex', flexDirection: 'column' }}>
        {/* Title */}
        <h3 style={{
          fontSize: '16px',
          fontWeight: 700,
          color: '#1e293b',
          marginBottom: '6px',
          lineHeight: 1.3,
        }}>
          {setup.name}
        </h3>

        {/* Description */}
        <p style={{
          fontSize: '13px',
          color: '#64748b',
          lineHeight: 1.5,
          marginBottom: '16px',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          flex: 1,
        }}>
          {setup.description}
        </p>

        {/* Tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: 'auto' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              fontSize: '11px',
              padding: '5px 10px',
              borderRadius: '20px',
              fontWeight: 600,
              backgroundColor: `${safeColor}15`,
              color: safeColor,
            }}
          >
            {setup.focus}
          </span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              fontSize: '11px',
              padding: '5px 10px',
              borderRadius: '20px',
              fontWeight: 500,
              backgroundColor: '#f1f5f9',
              color: '#64748b',
            }}
          >
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
        <p style={{
          fontSize: '14px',
          color: '#64748b',
          marginBottom: '8px',
          paddingLeft: '4px',
        }}>
          Filtere Trainingsszenarien nach deinem Fokus
        </p>

        <button
          onClick={() => setIsModalOpen(true)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            padding: '14px 18px',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            backgroundColor: 'white',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            outline: 'none',
            WebkitAppearance: 'none',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#cbd5e1';
            e.currentTarget.style.boxShadow = '0 4px 12px -2px rgba(0,0,0,0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e2e8f0';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {/* Left side - Current setup info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                backgroundColor: currentSetupColor ? `${currentSetupColor}15` : '#f1f5f9',
              }}
            >
              {currentSetup ? (
                <span style={{ fontSize: '24px' }}>{currentSetup.icon}</span>
              ) : (
                <Sparkles size={22} style={{ color: '#94a3b8' }} />
              )}
            </div>
            <div style={{ textAlign: 'left', minWidth: 0 }}>
              <div style={{
                fontSize: '15px',
                fontWeight: 600,
                color: '#1e293b',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {currentSetup ? currentSetup.name : 'Alle Szenarien'}
              </div>
              <div style={{
                fontSize: '13px',
                color: '#64748b',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {currentSetup
                  ? `${currentSetup.focus} • ${currentSetup.targetGroup}`
                  : 'Trainings-Setup wählen'
                }
              </div>
            </div>
          </div>

          {/* Right side - Change indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <span style={{
              fontSize: '13px',
              fontWeight: 500,
              color: '#94a3b8',
            }}>
              Ändern
            </span>
            <ChevronDown size={18} style={{ color: '#94a3b8' }} />
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
                style={{
                  position: 'fixed',
                  inset: 0,
                  backgroundColor: 'rgba(15, 23, 42, 0.5)',
                  backdropFilter: 'blur(4px)',
                  zIndex: 9999,
                }}
              />

              {/* Modal - Full screen on mobile, centered on desktop */}
              <div
                style={{
                  position: 'fixed',
                  inset: 0,
                  display: 'flex',
                  alignItems: isMobile ? 'flex-end' : 'center',
                  justifyContent: 'center',
                  padding: isMobile ? 0 : '16px',
                  zIndex: 10000,
                }}
              >
                <motion.div
                  initial={{ opacity: 0, y: isMobile ? 100 : 20, scale: isMobile ? 1 : 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: isMobile ? 100 : 20, scale: isMobile ? 1 : 0.95 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                  style={{
                    width: '100%',
                    maxWidth: isMobile ? '100%' : '720px',
                    backgroundColor: '#f8fafc',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    maxHeight: isMobile ? 'calc(100vh - 60px)' : 'calc(100vh - 2rem)',
                    borderRadius: isMobile ? '24px 24px 0 0' : '20px',
                    overflow: 'hidden',
                  }}
                >
                  {/* Header */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: isMobile ? '20px' : '24px 28px',
                    backgroundColor: 'white',
                    borderBottom: '1px solid #e2e8f0',
                    flexShrink: 0,
                  }}>
                    <div>
                      <h2 style={{
                        fontSize: isMobile ? '18px' : '22px',
                        fontWeight: 700,
                        color: '#0f172a',
                        marginBottom: '4px',
                      }}>
                        Trainings-Setup wählen
                      </h2>
                      <p style={{
                        fontSize: '14px',
                        color: '#64748b',
                        margin: 0,
                        display: isMobile ? 'none' : 'block',
                      }}>
                        Wähle deinen Schwerpunkt für passende Trainingsszenarien
                      </p>
                    </div>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        backgroundColor: '#f1f5f9',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s ease',
                        outline: 'none',
                        WebkitAppearance: 'none',
                        flexShrink: 0,
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                    >
                      <X size={20} style={{ color: '#64748b' }} />
                    </button>
                  </div>

                  {/* Body - Scrollable */}
                  <div
                    style={{
                      flex: 1,
                      overflowY: 'auto',
                      padding: isMobile ? '20px' : '24px 28px',
                      WebkitOverflowScrolling: 'touch',
                    }}
                  >
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                      gap: '16px',
                    }}>
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
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: isMobile ? '16px 20px' : '20px 28px',
                      paddingBottom: isMobile ? 'max(20px, env(safe-area-inset-bottom))' : '20px',
                      backgroundColor: 'white',
                      borderTop: '1px solid #e2e8f0',
                      flexShrink: 0,
                    }}
                  >
                    <button
                      onClick={handleShowAll}
                      style={{
                        padding: '10px 18px',
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                        backgroundColor: 'white',
                        color: '#475569',
                        fontSize: '14px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        outline: 'none',
                        WebkitAppearance: 'none',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8fafc';
                        e.currentTarget.style.borderColor = '#cbd5e1';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'white';
                        e.currentTarget.style.borderColor = '#e2e8f0';
                      }}
                    >
                      Alle anzeigen
                    </button>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      style={{
                        padding: '10px 24px',
                        borderRadius: '10px',
                        border: 'none',
                        background: primaryAccent,
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        outline: 'none',
                        WebkitAppearance: 'none',
                        boxShadow: `0 4px 12px -2px ${primaryAccent}50`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = `0 6px 16px -2px ${primaryAccent}60`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = `0 4px 12px -2px ${primaryAccent}50`;
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
