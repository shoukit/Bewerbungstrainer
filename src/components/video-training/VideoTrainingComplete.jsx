import React, { useState, useEffect } from 'react';
import {
  Trophy, ArrowLeft, RefreshCw, Star, ChevronDown, ChevronRight, CheckCircle,
  AlertCircle, Lightbulb, Video, User, MessageSquare, Eye, Mic, Award
} from 'lucide-react';
import { usePartner } from '../../context/PartnerContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/base/button';
import { useConfetti } from '@/components/ui/composite/Confetti';
import { COLORS, getScoreColor } from '@/config/colors';

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

  // Color based on score - using centralized color function
  const color = getScoreColor(score, primaryAccent);

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={COLORS.slate[200]}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      {/* Score text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-bold text-slate-600" style={{ fontSize: size / 3, color }}>
          {Math.round(score)}
        </span>
        <span className="text-slate-500" style={{ fontSize: size / 10 }}>von 100</span>
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

  // Color based on score - using centralized color function
  const scoreColor = getScoreColor(category.score, primaryAccent);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-3"
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 bg-transparent border-none cursor-pointer flex items-center gap-3"
      >
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ background: `${scoreColor}15` }}
        >
          <IconComponent size={20} color={scoreColor} />
        </div>
        <div className="flex-1 text-left min-w-0 overflow-hidden">
          <h4 className="text-[15px] font-semibold text-slate-900 mb-0.5">
            {category.label}
          </h4>
          <p className="text-[13px] text-slate-600 m-0 overflow-hidden text-ellipsis whitespace-nowrap">
            {category.feedback?.substring(0, 60)}...
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="text-xl font-bold"
            style={{ color: scoreColor }}
          >
            {Math.round(category.score)}
          </span>
          <ChevronDown
            size={20}
            className="text-slate-500 transition-transform duration-200"
            style={{ transform: isExpanded ? 'rotate(180deg)' : 'none' }}
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
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-slate-200 pt-4">
              {/* Full feedback */}
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                {category.feedback}
              </p>

              {/* Strengths */}
              {category.strengths && category.strengths.length > 0 && (
                <div className="mb-3">
                  <h5 className="text-[13px] font-semibold text-green-600 mb-2 flex items-center gap-1.5">
                    <CheckCircle size={14} />
                    Stärken
                  </h5>
                  <ul className="m-0 pl-5">
                    {category.strengths.map((item, i) => (
                      <li key={i} className="text-[13px] text-slate-600 mb-1">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Improvements */}
              {category.improvements && category.improvements.length > 0 && (
                <div>
                  <h5 className="text-[13px] font-semibold text-amber-600 mb-2 flex items-center gap-1.5">
                    <AlertCircle size={14} />
                    Verbesserungspotenzial
                  </h5>
                  <ul className="m-0 pl-5">
                    {category.improvements.map((item, i) => (
                      <li key={i} className="text-[13px] text-slate-600 mb-1">
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
  const primaryAccent = branding?.primaryAccent || COLORS.indigo[500];

  // Confetti celebration for good scores
  const { triggerConfetti, ConfettiComponent } = useConfetti();

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

  // Trigger confetti on mount for good scores (70+)
  useEffect(() => {
    if (overallScore >= 70) {
      triggerConfetti();
    }
  }, [overallScore, triggerConfetti]);

  return (
    <>
      <ConfettiComponent />
    <div className="p-8 max-w-4xl mx-auto">
      {/* Success Header */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center mb-10"
      >
        <div className="w-20 h-20 rounded-full bg-brand-gradient flex items-center justify-center mx-auto mb-5 shadow-xl">
          <Trophy size={40} color="#fff" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Training abgeschlossen!
        </h1>
        <p className="text-base text-slate-600">
          {scenario?.title} - Deine Auswertung ist bereit
        </p>
      </motion.div>

      {/* Main Score */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl p-8 text-center border border-slate-200 shadow-md mb-6"
      >
        <ScoreGauge score={overallScore} size={160} primaryAccent={primaryAccent} />
        <h2 className="text-2xl font-bold text-slate-900 mt-5 mb-2">
          {getGradeLabel(overallScore)}
        </h2>
        <p className="text-[15px] text-slate-600 max-w-lg mx-auto leading-relaxed">
          {summary || 'Deine Video-Analyse wurde erfolgreich abgeschlossen.'}
        </p>
      </motion.div>

      {/* Category Scores */}
      {categoryScores.length > 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
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
          className="bg-white rounded-2xl p-6 border border-slate-200 mb-6"
        >
          {/* Key Strengths */}
          {analysis.key_strengths && analysis.key_strengths.length > 0 && (
            <div className="mb-5">
              <h4 className="text-base font-semibold text-green-600 mb-3 flex items-center gap-2">
                <CheckCircle size={18} />
                Deine Stärken
              </h4>
              <ul className="m-0 pl-6">
                {analysis.key_strengths.map((item, i) => (
                  <li key={i} className="text-sm text-slate-600 mb-2 leading-normal">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actionable Tips */}
          {analysis.actionable_tips && analysis.actionable_tips.length > 0 && (
            <div>
              <h4 className="text-base font-semibold mb-3 flex items-center gap-2" style={{ color: primaryAccent }}>
                <Lightbulb size={18} />
                Tipps zur Verbesserung
              </h4>
              <ul className="m-0 pl-6">
                {analysis.actionable_tips.map((item, i) => (
                  <li key={i} className="text-sm text-slate-600 mb-2 leading-normal">
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
          className="bg-white rounded-2xl p-6 border border-slate-200 mb-6"
        >
          <h4 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Video size={18} color={primaryAccent} />
            Deine Aufnahme
          </h4>
          <video
            src={session.video_url}
            controls
            className="w-full max-w-[640px] max-h-[360px] rounded-xl bg-black object-contain"
          />
        </motion.div>
      )}

      {/* Action Buttons */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex gap-4 justify-center"
      >
        <Button
          onClick={onBackToDashboard}
          variant="outline"
          size="lg"
          className="gap-2"
        >
          <ArrowLeft size={18} />
          Zur Übersicht
        </Button>
        <Button
          onClick={onStartNew}
          size="lg"
          className="gap-2 shadow-lg"
        >
          <RefreshCw size={18} />
          Nochmal üben
        </Button>
      </motion.div>
    </div>
    </>
  );
};

export default VideoTrainingComplete;
