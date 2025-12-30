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
 *     primaryAccent="#3A7FA7"
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
import { useBranding } from '@/hooks/useBranding';
import { getScoreColor } from '@/config/colors';

/**
 * Rating Bar Component
 */
const RatingBar = ({ label, value, maxValue = 10, primaryAccent, branding }) => {
  const percentage = (value / maxValue) * 100;
  const displayValue = maxValue === 10 ? value * 10 : value;
  const color = getScoreColor(displayValue, primaryAccent);

  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontSize: '13px', color: branding.textSecondary }}>{label}</span>
        <span style={{ fontSize: '13px', fontWeight: 600, color }}>{displayValue}</span>
      </div>
      <div style={{ height: '6px', background: branding.cardBgHover, borderRadius: '3px', overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ height: '100%', background: color, borderRadius: '3px' }}
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
  const branding = useBranding();
  const [expandedSection, setExpandedSection] = useState(defaultExpanded);

  const toggleSection = (id) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  if (!feedback) {
    return (
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '40px 20px',
        border: `1px solid ${branding.borderColor}`,
        textAlign: 'center',
      }}>
        <Award size={32} color={branding.textMuted} style={{ marginBottom: '12px' }} />
        <p style={{ color: branding.textMuted, fontSize: '14px' }}>Kein Feedback verfügbar</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Summary Section */}
      {feedback?.summary && (
        <div style={{
          background: `${primaryAccent}08`,
          borderRadius: '12px',
          border: `1px solid ${primaryAccent}20`,
          overflow: 'hidden',
        }}>
          <button
            onClick={() => toggleSection('summary')}
            style={{
              width: '100%',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <Award size={18} color={primaryAccent} />
            <span style={{ flex: 1, fontSize: '14px', fontWeight: 600, color: branding.textMain }}>
              Gesamtbewertung
            </span>
            <ChevronDown
              size={18}
              color={branding.textMuted}
              style={{ transform: expandedSection === 'summary' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
            />
          </button>
          <AnimatePresence>
            {expandedSection === 'summary' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ padding: '0 16px 16px' }}>
                  <p style={{ fontSize: '13px', lineHeight: 1.7, color: branding.textSecondary }}>
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
        <div style={{
          background: '#f0fdf4',
          borderRadius: '12px',
          border: '1px solid #bbf7d0',
          overflow: 'hidden',
        }}>
          <button
            onClick={() => toggleSection('strengths')}
            style={{
              width: '100%',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <CheckCircle2 size={18} color="#22c55e" />
            <span style={{ flex: 1, fontSize: '14px', fontWeight: 600, color: '#166534' }}>
              Deine Superkräfte
            </span>
            <span style={{ fontSize: '12px', color: '#22c55e', fontWeight: 500 }}>
              {feedback.strengths.length} Stärken
            </span>
            <ChevronDown
              size={18}
              color="#22c55e"
              style={{ transform: expandedSection === 'strengths' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
            />
          </button>
          <AnimatePresence>
            {expandedSection === 'strengths' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ padding: '0 16px 16px' }}>
                  {feedback.strengths.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                      <CheckCircle2 size={16} color="#22c55e" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <p style={{ fontSize: '13px', lineHeight: 1.6, color: '#166534', margin: 0 }}>{item}</p>
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
        <div style={{
          background: '#fffbeb',
          borderRadius: '12px',
          border: '1px solid #fde68a',
          overflow: 'hidden',
        }}>
          <button
            onClick={() => toggleSection('improvements')}
            style={{
              width: '100%',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <TrendingUp size={18} color="#f59e0b" />
            <span style={{ flex: 1, fontSize: '14px', fontWeight: 600, color: '#92400e' }}>
              Dein Trainingsfeld
            </span>
            <span style={{ fontSize: '12px', color: '#f59e0b', fontWeight: 500 }}>
              {feedback.improvements.length} Punkte
            </span>
            <ChevronDown
              size={18}
              color="#f59e0b"
              style={{ transform: expandedSection === 'improvements' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
            />
          </button>
          <AnimatePresence>
            {expandedSection === 'improvements' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ padding: '0 16px 16px' }}>
                  {feedback.improvements.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                      <TrendingUp size={16} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <p style={{ fontSize: '13px', lineHeight: 1.6, color: '#92400e', margin: 0 }}>{item}</p>
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
        <div style={{
          background: '#eff6ff',
          borderRadius: '12px',
          border: '1px solid #bfdbfe',
          overflow: 'hidden',
        }}>
          <button
            onClick={() => toggleSection('tips')}
            style={{
              width: '100%',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <Lightbulb size={18} color="#3b82f6" />
            <span style={{ flex: 1, fontSize: '14px', fontWeight: 600, color: '#1e40af' }}>
              Praktische Tipps
            </span>
            <span style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 500 }}>
              {feedback.tips.length} Tipps
            </span>
            <ChevronDown
              size={18}
              color="#3b82f6"
              style={{ transform: expandedSection === 'tips' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
            />
          </button>
          <AnimatePresence>
            {expandedSection === 'tips' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ padding: '0 16px 16px' }}>
                  {feedback.tips.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                      <Target size={16} color="#3b82f6" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <p style={{ fontSize: '13px', lineHeight: 1.6, color: '#1e40af', margin: 0 }}>{item}</p>
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
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          padding: '16px',
          border: `1px solid ${branding.borderColor}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Star size={18} color={primaryAccent} />
            <span style={{ fontSize: '14px', fontWeight: 600, color: branding.textMain }}>
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

export default FeedbackSection;
