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
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: '#dcfce7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px',
                      }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#22c55e' }}>✓</span>
                      </div>
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
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: '#fef3c7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px',
                      }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#f59e0b' }}>{idx + 1}</span>
                      </div>
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
      {feedback?.rating && (
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

export default ReportCoachingContent;
