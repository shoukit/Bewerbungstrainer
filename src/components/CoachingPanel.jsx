import React from 'react';
import { Lightbulb, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const CoachingPanel = ({ hints }) => {
  // Parse hints (newline or comma separated)
  const parseHints = (text) => {
    if (!text) return [];
    return text.split(/\n/).map(item => item.trim()).filter(Boolean);
  };

  const hintsList = parseHints(hints);

  if (hintsList.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-teal-500 px-4 py-3 flex items-center gap-2">
        <Lightbulb className="w-5 h-5 text-white" />
        <h3 className="font-bold text-white text-sm">Live Coaching</h3>
        <ChevronRight className="w-4 h-4 text-white ml-auto" />
      </div>

      {/* Hints List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {hintsList.map((hint, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex gap-3 items-start"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-100 to-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Lightbulb className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-slate-700 leading-relaxed">{hint}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Footer hint */}
      <div className="px-4 py-3 bg-slate-50 border-t border-slate-200">
        <p className="text-xs text-slate-500 text-center">
          💡 Hilfreiche Tipps für ein erfolgreiches Gespräch
        </p>
      </div>
    </div>
  );
};

export default CoachingPanel;
