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
  MessageSquare,
} from 'lucide-react';
import RatingBar from './RatingBar';

/**
 * Helper to extract text from feedback items that can be either strings or objects
 * Gemini may return: "string" OR {point: "...", detail: "..."} OR {point: "...", action: "..."}
 */
const getItemText = (item) => {
  if (typeof item === 'string') return item;
  if (typeof item === 'object' && item !== null) {
    // Combine point and detail/action for full context
    const parts = [];
    if (item.point) parts.push(item.point);
    if (item.detail) parts.push(item.detail);
    if (item.action) parts.push(item.action);
    return parts.join(': ') || JSON.stringify(item);
  }
  return String(item);
};

/**
 * Helper to convert camelCase/snake_case to readable German labels
 */
const formatLabel = (key) => {
  const labelMap = {
    'selbstkundgabe': 'Selbstkundgabe',
    'beziehung': 'Beziehungsebene',
    'sachinhalt': 'Sachinhalt',
    'appell': 'Appell',
    'bewertung': 'Bewertung',
    'begruendung': 'Begründung',
    'nachricht': 'Nachricht',
    'analyse_nachricht': 'Nachricht-Analyse',
    'overall_assessment': 'Gesamtbewertung',
    'deescalation_score': 'Deeskalations-Score',
    'score_explanation': 'Score-Erklärung',
  };

  // Check direct match first
  const lowerKey = key.toLowerCase();
  if (labelMap[lowerKey]) return labelMap[lowerKey];

  // Convert snake_case/camelCase to readable format
  return key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
};

/**
 * Recursively render any JSON value in a readable format
 */
const renderValue = (value, depth = 0) => {
  if (value === null || value === undefined) return null;

  if (typeof value === 'string') {
    return <p className="text-[13px] leading-relaxed text-slate-700 m-0 whitespace-pre-wrap">{value}</p>;
  }

  if (typeof value === 'number') {
    return <span className="text-[13px] font-semibold text-primary">{value}</span>;
  }

  if (typeof value === 'boolean') {
    return <span className={`text-[13px] font-semibold ${value ? 'text-green-600' : 'text-red-600'}`}>{value ? 'Ja' : 'Nein'}</span>;
  }

  if (Array.isArray(value)) {
    return (
      <div className="space-y-2">
        {value.map((item, idx) => (
          <div key={idx} className="flex gap-2">
            <span className="text-slate-400 text-[13px]">•</span>
            <div className="flex-1">{renderValue(item, depth + 1)}</div>
          </div>
        ))}
      </div>
    );
  }

  if (typeof value === 'object') {
    return (
      <div className={`space-y-3 ${depth > 0 ? 'pl-3 border-l-2 border-slate-200' : ''}`}>
        {Object.entries(value).map(([key, val]) => (
          <div key={key}>
            <span className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide">
              {formatLabel(key)}
            </span>
            <div className="mt-1">{renderValue(val, depth + 1)}</div>
          </div>
        ))}
      </div>
    );
  }

  return <span className="text-[13px] text-slate-700">{String(value)}</span>;
};

/**
 * Check if feedback has any of the standard fields
 */
const hasStandardFormat = (feedback) => {
  if (!feedback) return false;
  return !!(
    feedback.summary ||
    feedback.overall_assessment ||
    feedback.strengths?.length > 0 ||
    feedback.improvements?.length > 0 ||
    feedback.areas_for_improvement?.length > 0 ||
    feedback.tips?.length > 0 ||
    feedback.suggestions?.length > 0 ||
    feedback.rating
  );
};

/**
 * Coaching Tab Content for Session Reports
 * Displays summary, strengths, improvements, tips, and rating bars
 */
const ReportCoachingContent = ({ feedback: rawFeedback, audioAnalysis, primaryAccent, branding }) => {
  // Determine initial expanded section based on feedback format
  const initialSection = hasStandardFormat(rawFeedback) ? 'summary' : 'custom-feedback';
  const [expandedSection, setExpandedSection] = useState(initialSection);

  // Normalize feedback to handle both old and new Gemini response formats
  const feedback = rawFeedback ? {
    summary: rawFeedback.summary || rawFeedback.overall_assessment || null,
    strengths: rawFeedback.strengths || [],
    improvements: rawFeedback.improvements || rawFeedback.areas_for_improvement || [],
    tips: rawFeedback.tips || rawFeedback.suggestions || [],
    rating: rawFeedback.rating || null,
  } : null;

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
                      <p className="text-[13px] leading-relaxed text-green-800 m-0">{getItemText(item)}</p>
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
                      <p className="text-[13px] leading-relaxed text-amber-900 m-0">{getItemText(item)}</p>
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
                      <p className="text-[13px] leading-relaxed text-blue-900 m-0">{getItemText(item)}</p>
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

      {/* Fallback: Generic JSON display for custom feedback formats */}
      {!hasStandardFormat(rawFeedback) && rawFeedback && (
        <div className="bg-primary/5 rounded-xl border border-primary/20 overflow-hidden">
          <button
            onClick={() => toggleSection('custom-feedback')}
            className="w-full px-4 py-3.5 flex items-center gap-2.5 bg-transparent border-none cursor-pointer text-left"
          >
            <MessageSquare size={18} className="text-primary" />
            <span className="flex-1 text-sm font-semibold text-slate-900">
              Feedback-Analyse
            </span>
            <ChevronDown
              size={18}
              className={`text-slate-500 transition-transform ${expandedSection === 'custom-feedback' ? 'rotate-180' : ''}`}
            />
          </button>
          <AnimatePresence>
            {expandedSection === 'custom-feedback' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4">
                  {renderValue(rawFeedback)}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default ReportCoachingContent;
