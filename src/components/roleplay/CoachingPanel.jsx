import React from 'react';
import { Lightbulb, MessageSquare, Target, Zap, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePartner } from '@/context/PartnerContext';
import { DEFAULT_BRANDING } from '@/config/partners';

/**
 * CoachingPanel - Displays real-time coaching tips during live simulation
 *
 * Props:
 * @param {string} hints - Static hints (newline-separated) - shown when no dynamic coaching
 * @param {Object} dynamicCoaching - Real-time coaching object from Live Coaching Engine
 * @param {Array} dynamicCoaching.content_impulses - Content tips (what to say)
 * @param {string} dynamicCoaching.behavioral_cue - Behavioral/tone advice
 * @param {string} dynamicCoaching.strategic_bridge - Strategic tip for pain points
 * @param {boolean} isGenerating - Whether coaching is being generated
 * @param {boolean} isConnected - Whether conversation is active
 */
const CoachingPanel = ({
  hints,
  dynamicCoaching = null,
  isGenerating = false,
  isConnected = false,
}) => {
  // Get partner branding for header gradient
  const { branding } = usePartner();

  // Get themed values
  const headerGradient = branding?.['--header-gradient'] || DEFAULT_BRANDING['--header-gradient'];
  const headerText = branding?.['--header-text'] || DEFAULT_BRANDING['--header-text'];
  const iconPrimary = branding?.['--icon-primary'] || DEFAULT_BRANDING['--icon-primary'];
  const primaryAccentLight = branding?.['--primary-accent-light'] || DEFAULT_BRANDING['--primary-accent-light'];

  // Parse static hints (newline separated)
  const parseHints = (text) => {
    if (!text) return [];
    return text.split(/\n/).map(item => item.trim()).filter(Boolean);
  };

  const staticHintsList = parseHints(hints);

  // Check if we have active dynamic coaching
  const hasDynamicCoaching = dynamicCoaching && (
    (dynamicCoaching.content_impulses && dynamicCoaching.content_impulses.length > 0) ||
    dynamicCoaching.behavioral_cue ||
    dynamicCoaching.strategic_bridge
  );

  // Show dynamic coaching when connected and has content, otherwise show static hints
  const showDynamicCoaching = isConnected && (hasDynamicCoaching || isGenerating);

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden h-full flex flex-col min-h-0">
      {/* Header */}
      <div
        style={{ background: headerGradient }}
        className="px-4 py-3 flex items-center gap-2 flex-shrink-0"
      >
        <Lightbulb className="w-5 h-5" style={{ color: headerText }} />
        <h3 className="font-bold text-sm" style={{ color: headerText }}>Live Coaching</h3>
        {isGenerating && (
          <Loader2 className="w-4 h-4 animate-spin ml-auto" style={{ color: headerText }} />
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        <AnimatePresence mode="wait">
          {showDynamicCoaching ? (
            // Dynamic Real-Time Coaching
            <motion.div
              key="dynamic-coaching"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {isGenerating && !hasDynamicCoaching ? (
                // Loading State
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-center py-8"
                >
                  <div className="text-center text-slate-400">
                    <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
                    <p className="text-xs">Analysiere...</p>
                  </div>
                </motion.div>
              ) : (
                <>
                  {/* Content Impulses */}
                  {dynamicCoaching?.content_impulses?.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      className="space-y-2"
                    >
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        <MessageSquare className="w-3.5 h-3.5" />
                        Inhalt
                      </div>
                      <div className="space-y-2">
                        {dynamicCoaching.content_impulses.map((impulse, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 + index * 0.05 }}
                            className="flex gap-2 items-start"
                          >
                            <div
                              className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                              style={{ background: primaryAccentLight }}
                            >
                              <span className="text-xs font-bold" style={{ color: iconPrimary }}>
                                {index + 1}
                              </span>
                            </div>
                            <p className="text-sm text-slate-700 leading-snug font-medium">{impulse}</p>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Behavioral Cue */}
                  {dynamicCoaching?.behavioral_cue && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.25 }}
                      className="space-y-2"
                    >
                      <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 uppercase tracking-wide">
                        <Zap className="w-3.5 h-3.5" />
                        Tonfall
                      </div>
                      <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        <p className="text-sm text-amber-800">{dynamicCoaching.behavioral_cue}</p>
                      </div>
                    </motion.div>
                  )}

                  {/* Strategic Bridge */}
                  {dynamicCoaching?.strategic_bridge && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.35 }}
                      className="space-y-2"
                    >
                      <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 uppercase tracking-wide">
                        <Target className="w-3.5 h-3.5" />
                        Strategie
                      </div>
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                        <p className="text-sm text-emerald-800">{dynamicCoaching.strategic_bridge}</p>
                      </div>
                    </motion.div>
                  )}

                  {/* Empty State for Dynamic (waiting for agent) */}
                  {!hasDynamicCoaching && !isGenerating && (
                    <div className="h-full flex items-center justify-center py-8">
                      <div className="text-center text-slate-400">
                        <Lightbulb className="w-10 h-10 mx-auto mb-2 opacity-40" />
                        <p className="text-xs">Warte auf Gesprächspartner...</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          ) : (
            // Static Hints (Before Conversation)
            <motion.div
              key="static-hints"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {staticHintsList.length === 0 ? (
                <div className="h-full flex items-center justify-center py-8">
                  <div className="text-center text-slate-400">
                    <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-xs">Tipps erscheinen hier während des Gesprächs</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {staticHintsList.map((hint, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex gap-3 items-start"
                    >
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: primaryAccentLight }}
                      >
                        <Lightbulb className="w-3.5 h-3.5" style={{ color: iconPrimary }} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-slate-700 leading-relaxed">{hint}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer hint */}
      <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex-shrink-0">
        <p className="text-xs text-slate-500 text-center">
          {showDynamicCoaching
            ? '💡 Echtzeit-Coaching basierend auf dem Gespräch'
            : '💡 Hilfreiche Tipps für ein erfolgreiches Gespräch'
          }
        </p>
      </div>
    </div>
  );
};

export default CoachingPanel;
