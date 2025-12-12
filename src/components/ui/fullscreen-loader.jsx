import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { usePartner } from '@/context/PartnerContext';
import { DEFAULT_BRANDING } from '@/config/partners';

/**
 * FullscreenLoader Component
 *
 * Displays a fullscreen loading overlay with blur effect and spinner.
 * Used during async operations like generating questions or starting sessions.
 */
const FullscreenLoader = ({
  isLoading,
  message = 'Wird geladen...',
  subMessage = null
}) => {
  // Partner theming
  const { branding } = usePartner();
  const headerGradient = branding?.['--header-gradient'] || DEFAULT_BRANDING['--header-gradient'];

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '20px',
              padding: '40px 60px',
              backgroundColor: 'white',
              borderRadius: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
            }}
          >
            {/* Spinner */}
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: headerGradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Loader2
                style={{
                  width: '32px',
                  height: '32px',
                  color: 'white',
                  animation: 'spin 1s linear infinite',
                }}
              />
            </div>

            {/* Message */}
            <div style={{ textAlign: 'center' }}>
              <p style={{
                fontSize: '18px',
                fontWeight: 600,
                color: '#0f172a',
                margin: 0,
              }}>
                {message}
              </p>
              {subMessage && (
                <p style={{
                  fontSize: '14px',
                  color: '#64748b',
                  marginTop: '8px',
                  margin: '8px 0 0 0',
                }}>
                  {subMessage}
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FullscreenLoader;
