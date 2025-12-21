import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings2, ChevronRight, Check, X, Sparkles } from 'lucide-react';
import { usePartner } from '@/context/PartnerContext';

/**
 * SetupSelector - Compact setup selector with popup modal
 *
 * Shows a brief description with a configure button that opens
 * a modal for selecting the training setup.
 */
const SetupSelector = () => {
  const {
    currentSetup,
    setSelectedSetup,
    clearSelectedSetup,
    availableSetups,
    branding,
  } = usePartner();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const primaryAccent = branding?.['--primary-accent'] || '#3A7FA7';

  const handleSelectSetup = (setupId) => {
    setSelectedSetup(setupId);
    setIsModalOpen(false);
  };

  const handleClearSetup = () => {
    clearSelectedSetup();
    setIsModalOpen(false);
  };

  return (
    <>
      {/* Compact Setup Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full"
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            padding: '16px 20px',
            backgroundColor: '#f8fafc',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
          }}
        >
          {/* Left side - Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: currentSetup ? `${currentSetup.color}15` : `${primaryAccent}10`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {currentSetup ? (
                <span style={{ fontSize: '20px' }}>{currentSetup.icon}</span>
              ) : (
                <Sparkles size={20} style={{ color: primaryAccent }} />
              )}
            </div>
            <div style={{ minWidth: 0 }}>
              {currentSetup ? (
                <>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                    {currentSetup.name}
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>
                    {currentSetup.focus} • {currentSetup.targetGroup}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                    Trainings-Setup konfigurieren
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>
                    Wähle deinen Schwerpunkt – wir zeigen dir passende Szenarien
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right side - Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: currentSetup ? currentSetup.color : primaryAccent,
              color: 'white',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}
          >
            <Settings2 size={18} />
            <span className="hidden sm:inline">
              {currentSetup ? 'Ändern' : 'Setup wählen'}
            </span>
            <ChevronRight size={16} className="hidden sm:block" />
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
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '16px',
            }}
          >
            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: 'white',
                borderRadius: '20px',
                width: '100%',
                maxWidth: '800px',
                maxHeight: '90vh',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              }}
            >
              {/* Modal Header */}
              <div
                style={{
                  padding: '20px 24px',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>
                    Trainings-Setup wählen
                  </h2>
                  <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#64748b' }}>
                    Wähle deinen Schwerpunkt für passende Trainingsszenarien
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: '#f1f5f9',
                    color: '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body - Scrollable */}
              <div
                style={{
                  padding: '20px 24px',
                  maxHeight: 'calc(90vh - 180px)',
                  overflowY: 'auto',
                }}
              >
                {/* Setup Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                    gap: '12px',
                  }}
                >
                  {availableSetups.map((setup) => {
                    const isSelected = currentSetup?.id === setup.id;
                    return (
                      <button
                        key={setup.id}
                        onClick={() => handleSelectSetup(setup.id)}
                        style={{
                          padding: '16px',
                          borderRadius: '12px',
                          border: `2px solid ${isSelected ? setup.color : '#e2e8f0'}`,
                          backgroundColor: isSelected ? `${setup.color}08` : 'white',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.2s',
                          position: 'relative',
                        }}
                      >
                        {/* Selected indicator */}
                        {isSelected && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '8px',
                              right: '8px',
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              backgroundColor: setup.color,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Check size={14} color="white" />
                          </div>
                        )}

                        {/* Icon */}
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            backgroundColor: `${setup.color}15`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '12px',
                          }}
                        >
                          <span style={{ fontSize: '20px' }}>{setup.icon}</span>
                        </div>

                        {/* Title */}
                        <div
                          style={{
                            fontSize: '14px',
                            fontWeight: 600,
                            color: '#0f172a',
                            marginBottom: '4px',
                          }}
                        >
                          {setup.name}
                        </div>

                        {/* Description */}
                        <div
                          style={{
                            fontSize: '12px',
                            color: '#64748b',
                            lineHeight: 1.4,
                            marginBottom: '8px',
                          }}
                        >
                          {setup.description}
                        </div>

                        {/* Tags */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          <span
                            style={{
                              fontSize: '10px',
                              padding: '2px 8px',
                              borderRadius: '10px',
                              backgroundColor: `${setup.color}15`,
                              color: setup.color,
                              fontWeight: 500,
                            }}
                          >
                            {setup.focus}
                          </span>
                          <span
                            style={{
                              fontSize: '10px',
                              padding: '2px 8px',
                              borderRadius: '10px',
                              backgroundColor: '#f1f5f9',
                              color: '#64748b',
                              fontWeight: 500,
                            }}
                          >
                            {setup.targetGroup}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer */}
              <div
                style={{
                  padding: '16px 24px',
                  borderTop: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <button
                  onClick={handleClearSetup}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: 'white',
                    color: '#64748b',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Alle Szenarien anzeigen
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: primaryAccent,
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
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
