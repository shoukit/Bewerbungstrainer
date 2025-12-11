import React from 'react';
import { Lightbulb } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePartner } from '@/context/PartnerContext';
import { DEFAULT_BRANDING } from '@/config/partners';

const CoachingPanel = ({ hints }) => {
  // Get partner branding for header gradient
  const { branding } = usePartner();

  // Get themed values
  const headerGradient = branding?.['--header-gradient'] || DEFAULT_BRANDING['--header-gradient'];
  const headerText = branding?.['--header-text'] || DEFAULT_BRANDING['--header-text'];
  const iconPrimary = branding?.['--icon-primary'] || DEFAULT_BRANDING['--icon-primary'];
  const iconSecondary = branding?.['--icon-secondary'] || DEFAULT_BRANDING['--icon-secondary'];
  // Parse hints (newline or comma separated)
  const parseHints = (text) => {
    if (!text) return [];
    return text.split(/\n/).map(item => item.trim()).filter(Boolean);
  };

  const hintsList = parseHints(hints);

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div
        style={{ background: headerGradient }}
        className="px-4 py-3 flex items-center gap-2 flex-shrink-0"
      >
        <Lightbulb className="w-5 h-5" style={{ color: headerText }} />
        <h3 className="font-bold text-sm" style={{ color: headerText }}>Live Coaching</h3>
      </div>

      {/* Hints List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {hintsList.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-slate-400">
              <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-xs">Tipps erscheinen hier während des Gesprächs</p>
            </div>
          </div>
        ) : (
          hintsList.map((hint, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex gap-3 items-start"
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{
                background: `linear-gradient(to bottom right, ${branding?.['--primary-accent-light'] || DEFAULT_BRANDING['--primary-accent-light']}, ${branding?.['--primary-accent-light'] || DEFAULT_BRANDING['--primary-accent-light']})`
              }}
            >
              <Lightbulb className="w-3.5 h-3.5" style={{ color: iconPrimary }} />
            </div>
            <div className="flex-1">
              <p className="text-sm text-slate-700 leading-relaxed">{hint}</p>
            </div>
          </motion.div>
          ))
        )}
      </div>

      {/* Footer hint */}
      <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex-shrink-0">
        <p className="text-xs text-slate-500 text-center">
          💡 Hilfreiche Tipps für ein erfolgreiches Gespräch
        </p>
      </div>
    </div>
  );
};

export default CoachingPanel;
