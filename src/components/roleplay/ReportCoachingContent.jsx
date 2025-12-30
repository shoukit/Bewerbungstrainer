import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award,
  CheckCircle2,
  TrendingUp,
  Lightbulb,
  Target,
  Star,
  ChevronDown,
} from 'lucide-react';
import RatingBar from './RatingBar';

/**
 * Coaching Tab Content for Session Reports
 * Displays summary, strengths, improvements, tips, and rating bars
 */
const ReportCoachingContent = ({ feedback, audioAnalysis, primaryAccent, branding }) => {
  const [expandedSection, setExpandedSection] = useState('summary');

  const toggleSection = (id) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Summary Section */}
      {feedback?.summary && (
        <div className="bg-primary/5 rounded-xl border border-primary/20 overflow-hidden">
          <button
            onClick={() => toggleSection('summary')}
            className="w-full px-4 py-3.5 flex items-center gap-2.5 bg-transparent border-none cursor-pointer text-left"
          >
            <Award size={18} className="text-primary" />
            <span className="flex-1 text-sm font-semibold text-slate-900">
              Gesamtbewertung
            </span>
            <ChevronDown
              size={18}
              className={`text-slate-500 transition-transform ${expandedSection === 'summary' ? 'rotate-180' : ''}`}
            />
          </button>
          <AnimatePresence>
            {expandedSection === 'summary' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4">
                  <p className="text-[13px] leading-relaxed text-slate-700">
                    {feedback.summary}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Strengths Section */}
      {feedback?.strengths?.length > 0 && (
        <div className="bg-green-50 rounded-xl border border-green-200 overflow-hidden">
          <button
            onClick={() => toggleSection('strengths')}
            className="w-full px-4 py-3.5 flex items-center gap-2.5 bg-transparent border-none cursor-pointer text-left"
          >
            <CheckCircle2 size={18} className="text-green-500" />
            <span className="flex-1 text-sm font-semibold text-green-800">
              Deine Superkräfte
            </span>
            <span className="text-xs text-green-500 font-medium">
              {feedback.strengths.length} Stärken
            </span>
            <ChevronDown
              size={18}
              className={`text-green-500 transition-transform ${expandedSection === 'strengths' ? 'rotate-180' : ''}`}
            />
          </button>
          <AnimatePresence>
            {expandedSection === 'strengths' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4">
                  {feedback.strengths.map((item, idx) => (
                    <div key={idx} className="flex gap-2.5 mb-2.5">
                      <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[11px] font-semibold text-green-500">✓</span>
                      </div>
                      <p className="text-[13px] leading-relaxed text-green-800 m-0">{item}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Improvements Section */}
      {feedback?.improvements?.length > 0 && (
        <div className="bg-amber-50 rounded-xl border border-amber-200 overflow-hidden">
          <button
            onClick={() => toggleSection('improvements')}
            className="w-full px-4 py-3.5 flex items-center gap-2.5 bg-transparent border-none cursor-pointer text-left"
          >
            <TrendingUp size={18} className="text-amber-500" />
            <span className="flex-1 text-sm font-semibold text-amber-900">
              Dein Trainingsfeld
            </span>
            <span className="text-xs text-amber-500 font-medium">
              {feedback.improvements.length} Punkte
            </span>
            <ChevronDown
              size={18}
              className={`text-amber-500 transition-transform ${expandedSection === 'improvements' ? 'rotate-180' : ''}`}
            />
          </button>
          <AnimatePresence>
            {expandedSection === 'improvements' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4">
                  {feedback.improvements.map((item, idx) => (
                    <div key={idx} className="flex gap-2.5 mb-2.5">
                      <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[11px] font-semibold text-amber-500">{idx + 1}</span>
                      </div>
                      <p className="text-[13px] leading-relaxed text-amber-900 m-0">{item}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Tips Section */}
      {feedback?.tips?.length > 0 && (
        <div className="bg-blue-50 rounded-xl border border-blue-200 overflow-hidden">
          <button
            onClick={() => toggleSection('tips')}
            className="w-full px-4 py-3.5 flex items-center gap-2.5 bg-transparent border-none cursor-pointer text-left"
          >
            <Lightbulb size={18} className="text-blue-500" />
            <span className="flex-1 text-sm font-semibold text-blue-900">
              Praktische Tipps
            </span>
            <span className="text-xs text-blue-500 font-medium">
              {feedback.tips.length} Tipps
            </span>
            <ChevronDown
              size={18}
              className={`text-blue-500 transition-transform ${expandedSection === 'tips' ? 'rotate-180' : ''}`}
            />
          </button>
          <AnimatePresence>
            {expandedSection === 'tips' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4">
                  {feedback.tips.map((item, idx) => (
                    <div key={idx} className="flex gap-2.5 mb-2.5">
                      <Target size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
                      <p className="text-[13px] leading-relaxed text-blue-900 m-0">{item}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Rating Bars */}
      {feedback?.rating && (
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-2 mb-4">
            <Star size={18} className="text-primary" />
            <span className="text-sm font-semibold text-slate-900">
              Bewertungskriterien
            </span>
          </div>
          {feedback.rating.communication !== undefined && (
            <RatingBar label="Kommunikation" value={feedback.rating.communication} primaryAccent={primaryAccent} branding={branding} />
          )}
          {feedback.rating.motivation !== undefined && (
            <RatingBar label="Motivation" value={feedback.rating.motivation} primaryAccent={primaryAccent} branding={branding} />
          )}
          {feedback.rating.professionalism !== undefined && (
            <RatingBar label="Professionalität" value={feedback.rating.professionalism} primaryAccent={primaryAccent} branding={branding} />
          )}
          {feedback.rating.preparation !== undefined && (
            <RatingBar label="Vorbereitung" value={feedback.rating.preparation} primaryAccent={primaryAccent} branding={branding} />
          )}
        </div>
      )}
    </div>
  );
};

export default ReportCoachingContent;
