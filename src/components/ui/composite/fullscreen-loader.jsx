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
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/70 backdrop-blur-lg"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="flex flex-col items-center gap-5 py-10 px-15 bg-white rounded-3xl shadow-2xl"
          >
            {/* Spinner */}
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: headerGradient }}
            >
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>

            {/* Message */}
            <div className="text-center">
              <p className="text-lg font-semibold text-slate-900 m-0">
                {message}
              </p>
              {subMessage && (
                <p className="text-sm text-slate-600 mt-2 m-0">
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
