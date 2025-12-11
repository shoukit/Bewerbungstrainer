import React, { useState } from 'react';
import {
  Trophy, ArrowLeft, RefreshCw, Star, ChevronDown, ChevronRight, CheckCircle,
  AlertCircle, Lightbulb, Video, User, MessageSquare, Eye, Mic, Award
} from 'lucide-react';
import { usePartner } from '../../context/PartnerContext';
import { motion, AnimatePresence } from 'framer-motion';

// Category icons
const CATEGORY_ICONS = {
  auftreten: Eye,
  selbstbewusstsein: Award,
  koerpersprache: User,
  kommunikation: MessageSquare,
  professionalitaet: Award,
  inhalt: Lightbulb,
};

/**
 * ScoreGauge - Circular progress gauge for score display
 */
const ScoreGauge = ({ score, size = 120, strokeWidth = 10, primaryAccent }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  // Color based on score
  const getColor = () => {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return primaryAccent;
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      {/* Score text */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{ fontSize: size / 3, fontWeight: 700, color: getColor() }}>
          {Math.round(score)}
        </span>
        <span style={{ fontSize: size / 10, color: '#64748b' }}>von 100</span>
      </div>
    </div>
  );
};

/**
 * CategoryScoreCard - Expandable card for category details
 */
const CategoryScoreCard = ({ category, primaryAccent }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const IconComponent = CATEGORY_ICONS[category.category] || Star;

  // Color based on score
  const getScoreColor = (score) => {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return primaryAccent;
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: '#fff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        marginBottom: '12px',
      }}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: '100%',
          padding: '16px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: `${getScoreColor(category.score)}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconComponent size={20} color={getScoreColor(category.score)} />
        </div>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', marginBottom: '2px' }}>
            {category.label}
          </h4>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            {category.feedback?.substring(0, 60)}...
          </p>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <span
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: getScoreColor(category.score),
            }}
          >
            {Math.round(category.score)}
          </span>
          <ChevronDown
            size={20}
            color="#64748b"
            style={{
              transform: isExpanded ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s',
            }}
          />
        </div>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 16px 16px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
              {/* Full feedback */}
              <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, marginBottom: '16px' }}>
                {category.feedback}
              </p>

              {/* Strengths */}
              {category.strengths && category.strengths.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <h5 style={{ fontSize: '13px', fontWeight: 600, color: '#22c55e', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle size={14} />
                    Stärken
                  </h5>
                  <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    {category.strengths.map((item, i) => (
                      <li key={i} style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Improvements */}
              {category.improvements && category.improvements.length > 0 && (
                <div>
                  <h5 style={{ fontSize: '13px', fontWeight: 600, color: '#f59e0b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertCircle size={14} />
                    Verbesserungspotenzial
                  </h5>
                  <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    {category.improvements.map((item, i) => (
                      <li key={i} style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/**
 * VideoTrainingComplete - Results view
 */
const VideoTrainingComplete = ({ session, scenario, onBackToDashboard, onStartNew }) => {
  const { branding } = usePartner();
  const primaryAccent = branding?.primaryAccent || '#3A7FA7';
  const themedGradient = branding?.headerGradient || 'linear-gradient(135deg, #3A7FA7 0%, #2d6a8a 100%)';

  const overallScore = session?.overall_score || 0;
  const categoryScores = session?.category_scores || [];
  const analysis = session?.analysis || {};
  const summary = session?.summary_feedback || '';

  // Get grade label
  const getGradeLabel = (score) => {
    if (score >= 90) return 'Ausgezeichnet!';
    if (score >= 80) return 'Sehr gut!';
    if (score >= 70) return 'Gut!';
    if (score >= 60) return 'Solide Leistung';
    if (score >= 50) return 'Ausbaufähig';
    return 'Weiter üben!';
  };

  return (
    <div style={{ padding: '32px', maxWidth: '900px', margin: '0 auto' }}>
      {/* Success Header */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{
          textAlign: 'center',
          marginBottom: '40px',
        }}
      >
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: themedGradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
          }}
        >
          <Trophy size={40} color="#fff" />
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
          Training abgeschlossen!
        </h1>
        <p style={{ fontSize: '16px', color: '#64748b' }}>
          {scenario?.title} - Deine Auswertung ist bereit
        </p>
      </motion.div>

      {/* Main Score */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        style={{
          background: '#fff',
          borderRadius: '20px',
          padding: '32px',
          textAlign: 'center',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
          marginBottom: '24px',
        }}
      >
        <ScoreGauge score={overallScore} size={160} primaryAccent={primaryAccent} />
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginTop: '20px', marginBottom: '8px' }}>
          {getGradeLabel(overallScore)}
        </h2>
        <p style={{ fontSize: '15px', color: '#64748b', maxWidth: '500px', margin: '0 auto', lineHeight: 1.6 }}>
          {summary || 'Deine Video-Analyse wurde erfolgreich abgeschlossen.'}
        </p>
      </motion.div>

      {/* Category Scores */}
      {categoryScores.length > 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{ marginBottom: '24px' }}
        >
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Star size={20} color={primaryAccent} />
            Detaillierte Bewertung
          </h3>
          {categoryScores.map((category, index) => (
            <CategoryScoreCard
              key={category.category || index}
              category={category}
              primaryAccent={primaryAccent}
            />
          ))}
        </motion.div>
      )}

      {/* Analysis Details */}
      {analysis && (analysis.key_strengths?.length > 0 || analysis.actionable_tips?.length > 0) && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid #e2e8f0',
            marginBottom: '24px',
          }}
        >
          {/* Key Strengths */}
          {analysis.key_strengths && analysis.key_strengths.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#22c55e', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={18} />
                Deine Stärken
              </h4>
              <ul style={{ margin: 0, paddingLeft: '24px' }}>
                {analysis.key_strengths.map((item, i) => (
                  <li key={i} style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px', lineHeight: 1.5 }}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actionable Tips */}
          {analysis.actionable_tips && analysis.actionable_tips.length > 0 && (
            <div>
              <h4 style={{ fontSize: '16px', fontWeight: 600, color: primaryAccent, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lightbulb size={18} />
                Tipps zur Verbesserung
              </h4>
              <ul style={{ margin: 0, paddingLeft: '24px' }}>
                {analysis.actionable_tips.map((item, i) => (
                  <li key={i} style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px', lineHeight: 1.5 }}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      )}

      {/* Video Player */}
      {session?.video_url && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid #e2e8f0',
            marginBottom: '24px',
          }}
        >
          <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Video size={18} color={primaryAccent} />
            Deine Aufnahme
          </h4>
          <video
            src={session.video_url}
            controls
            style={{
              width: '100%',
              borderRadius: '12px',
              background: '#000',
            }}
          />
        </motion.div>
      )}

      {/* Action Buttons */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        style={{
          display: 'flex',
          gap: '16px',
          justifyContent: 'center',
        }}
      >
        <button
          onClick={onBackToDashboard}
          style={{
            padding: '14px 28px',
            borderRadius: '12px',
            background: '#f1f5f9',
            color: '#0f172a',
            border: 'none',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <ArrowLeft size={18} />
          Zur Übersicht
        </button>
        <button
          onClick={onStartNew}
          style={{
            padding: '14px 28px',
            borderRadius: '12px',
            background: themedGradient,
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
          }}
        >
          <RefreshCw size={18} />
          Nochmal üben
        </button>
      </motion.div>
    </div>
  );
};

export default VideoTrainingComplete;
