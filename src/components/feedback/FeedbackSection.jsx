/**
 * FeedbackSection - Reusable feedback display component
 *
 * Displays structured feedback with collapsible sections:
 * - Summary (Gesamtbewertung)
 * - Strengths (Deine Superkräfte)
 * - Improvements (Dein Trainingsfeld)
 * - Tips (Praktische Tipps)
 * - Rating bars (Bewertungskriterien)
 *
 * Usage:
 *   import FeedbackSection from '@/components/feedback/FeedbackSection';
 *
 *   <FeedbackSection
 *     feedback={{
 *       summary: "...",
 *       strengths: ["...", "..."],
 *       improvements: ["...", "..."],
 *       tips: ["...", "..."],
 *       rating: { communication: 8, motivation: 7, ... }
 *     }}
 *     primaryAccent="#4F46E5"
 *   />
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award,
  Star,
  CheckCircle2,
  TrendingUp,
  Lightbulb,
  Target,
  ChevronDown,
} from 'lucide-react';
import { getScoreColor } from '@/config/colors';

/**
 * Rating Bar Component
 */
const RatingBar = ({ label, value, maxValue = 10, primaryAccent }) => {
  const percentage = (value / maxValue) * 100;
  const displayValue = maxValue === 10 ? value * 10 : value;
  const color = getScoreColor(displayValue, primaryAccent);

  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-[13px] text-slate-600">{label}</span>
        <span className="text-[13px] font-semibold" style={{ color }}>{displayValue}</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
};

/**
 * FeedbackSection Component
 *
 * @param {object} feedback - Feedback data with summary, strengths, improvements, tips, rating
 * @param {string} primaryAccent - Primary accent color for theming
 * @param {string} defaultExpanded - Which section to expand by default ('summary' | 'strengths' | 'improvements' | 'tips')
 * @param {boolean} showRatings - Whether to show rating bars (default: true)
 */
const FeedbackSection = ({
  feedback,
  primaryAccent,
  defaultExpanded = 'summary',
  showRatings = true,
}) => {
  const [expandedSection, setExpandedSection] = useState(defaultExpanded);

  const toggleSection = (id) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  if (!feedback) {
    return (
      <div className="bg-white rounded-xl p-10 border border-slate-200 text-center">
        <Award size={32} className="text-slate-400 mb-3 mx-auto" />
        <p className="text-slate-400 text-sm">Kein Feedback verfügbar</p>
      </div>
    );
  }

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
            <span className="flex-1 text-sm font-semibold text-slate-800">
              Gesamtbewertung
            </span>
            <ChevronDown
              size={18}
              className="text-slate-400 transition-transform duration-200"
              style={{ transform: expandedSection === 'summary' ? 'rotate(180deg)' : 'none' }}
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
                  <p className="text-[13px] leading-relaxed text-slate-600">
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
              className="text-green-500 transition-transform duration-200"
              style={{ transform: expandedSection === 'strengths' ? 'rotate(180deg)' : 'none' }}
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
                      <CheckCircle2 size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
                      <p className="text-[13px] leading-normal text-green-800 m-0">{item}</p>
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
            <span className="flex-1 text-sm font-semibold text-amber-800">
              Dein Trainingsfeld
            </span>
            <span className="text-xs text-amber-500 font-medium">
              {feedback.improvements.length} Punkte
            </span>
            <ChevronDown
              size={18}
              className="text-amber-500 transition-transform duration-200"
              style={{ transform: expandedSection === 'improvements' ? 'rotate(180deg)' : 'none' }}
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
                      <TrendingUp size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-[13px] leading-normal text-amber-800 m-0">{item}</p>
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
            <span className="flex-1 text-sm font-semibold text-blue-800">
              Praktische Tipps
            </span>
            <span className="text-xs text-blue-500 font-medium">
              {feedback.tips.length} Tipps
            </span>
            <ChevronDown
              size={18}
              className="text-blue-500 transition-transform duration-200"
              style={{ transform: expandedSection === 'tips' ? 'rotate(180deg)' : 'none' }}
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
                      <p className="text-[13px] leading-normal text-blue-800 m-0">{item}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Rating Bars */}
      {showRatings && feedback?.rating && (
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-2 mb-4">
            <Star size={18} className="text-primary" />
            <span className="text-sm font-semibold text-slate-800">
              Bewertungskriterien
            </span>
          </div>
          {feedback.rating.communication !== undefined && (
            <RatingBar label="Kommunikation" value={feedback.rating.communication} primaryAccent={primaryAccent} />
          )}
          {feedback.rating.motivation !== undefined && (
            <RatingBar label="Motivation" value={feedback.rating.motivation} primaryAccent={primaryAccent} />
          )}
          {feedback.rating.professionalism !== undefined && (
            <RatingBar label="Professionalität" value={feedback.rating.professionalism} primaryAccent={primaryAccent} />
          )}
          {feedback.rating.preparation !== undefined && (
            <RatingBar label="Vorbereitung" value={feedback.rating.preparation} primaryAccent={primaryAccent} />
          )}
        </div>
      )}
    </div>
  );
};

export default FeedbackSection;
