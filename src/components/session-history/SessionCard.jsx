/**
 * SessionCard - Unified card component for all session types
 *
 * Displays sessions for Simulator, Video Training, and Roleplay.
 * Shows score, status, progress, and actions (continue/delete).
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  ChevronRight,
  Clock,
  Loader2,
  MessageSquare,
  Play,
  Star,
  Target,
  Trash2,
  Video,
} from 'lucide-react';
import { useMobile } from '@/hooks/useMobile';
import { formatDateTime, formatDuration } from '@/utils/formatting';
import ConfirmDeleteDialog from '@/components/ui/composite/ConfirmDeleteDialog';
import { COLORS } from '@/config/colors';

/**
 * Session type constants (must match parent component)
 */
const SESSION_TYPES = {
  SIMULATOR: 'simulator',
  ROLEPLAY: 'roleplay',
  VIDEO: 'video',
};

const SessionCard = ({
  session,
  type,
  scenario,
  onClick,
  onContinueSession,
  onDeleteSession,
  headerGradient,
  headerText,
  primaryAccent,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  // Use 900px breakpoint for better tablet support - cards have many elements
  const isMobile = useMobile(900);

  const getScore = () => {
    let rawScore = null;
    if (type === SESSION_TYPES.SIMULATOR) {
      rawScore = session.overall_score || session.average_score;
    } else if (type === SESSION_TYPES.VIDEO) {
      rawScore = session.overall_score;
    } else {
      // Roleplay - extract from feedback_json
      if (session.feedback_json) {
        try {
          let parsed = session.feedback_json;
          if (typeof parsed === 'string') {
            let jsonString = parsed.trim();
            if (jsonString.startsWith('```json')) {
              jsonString = jsonString.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
            } else if (jsonString.startsWith('```')) {
              jsonString = jsonString.replace(/```\s*/g, '').replace(/```\s*$/g, '');
            }
            parsed = JSON.parse(jsonString);
          }
          rawScore = parsed.rating?.overall || null;
        } catch {
          rawScore = null;
        }
      }
    }
    // Return null if score is invalid (null, undefined, NaN, 0)
    if (rawScore === null || rawScore === undefined || isNaN(rawScore) || rawScore === 0) {
      return null;
    }
    return rawScore;
  };

  const getStatus = () => {
    if (type === SESSION_TYPES.SIMULATOR || type === SESSION_TYPES.VIDEO) {
      return session.status;
    }
    return session.feedback_json ? 'completed' : 'pending';
  };

  const score = getScore();
  const status = getStatus();
  const isCompleted = status === 'completed';

  // Check if session is resumable (Simulator only, has unanswered questions)
  const hasUnansweredQuestions = session.total_questions > 0 &&
    (session.completed_questions || 0) < session.total_questions;
  const isResumable = type === SESSION_TYPES.SIMULATOR && hasUnansweredQuestions;

  // Progress info for resumable sessions
  const getProgressInfo = () => {
    if (!isResumable) return null;
    const completed = session.completed_questions || 0;
    const total = session.total_questions || 0;
    return `${completed}/${total} Fragen`;
  };

  // Handle continue click
  const handleContinueClick = (e) => {
    e.stopPropagation();
    if (onContinueSession) {
      onContinueSession(session, scenario);
    }
  };

  // Handle delete click - opens confirmation dialog
  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  // Handle confirmed delete
  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await onDeleteSession(session, type);
      setShowDeleteDialog(false);
    } catch (err) {
      console.error('Error deleting session:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Convert score to percentage (0-100) for consistent display
  const getScoreAsPercent = () => {
    if (score === null || score === undefined || isNaN(score)) return null;
    // Simulator and Roleplay scores are 0-10, convert to percentage
    if (type === SESSION_TYPES.SIMULATOR || type === SESSION_TYPES.ROLEPLAY) {
      const percent = score <= 10 ? score * 10 : score;
      return isNaN(percent) ? null : percent;
    }
    // Video scores are already 0-100
    return isNaN(score) ? null : score;
  };

  const scorePercent = getScoreAsPercent();

  const getScoreBadgeStyle = (scoreVal) => {
    if (!scoreVal && scoreVal !== 0) return { background: COLORS.slate[100], color: COLORS.slate[500] };
    const numScore = parseFloat(scoreVal);
    if (numScore >= 80) return { background: COLORS.green[100], color: COLORS.green[800] };
    if (numScore >= 60) return { background: COLORS.amber[100], color: COLORS.amber[800] };
    return { background: COLORS.red[100], color: COLORS.red[800] };
  };

  const getIcon = () => {
    switch (type) {
      case SESSION_TYPES.SIMULATOR: return Target;
      case SESSION_TYPES.VIDEO: return Video;
      default: return MessageSquare;
    }
  };

  const Icon = getIcon();

  // Mobile-optimized card layout
  if (isMobile) {
    return (
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0 },
        }}
        whileTap={{ scale: 0.98 }}
      >
        <div
          onClick={onClick}
          className="bg-white rounded-2xl p-4 cursor-pointer border border-slate-200 shadow-sm"
        >
          {/* Top row: Icon + Title + Delete */}
          <div className="flex items-start gap-3 mb-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: headerGradient }}
            >
              <Icon className="w-[22px] h-[22px]" style={{ color: headerText }} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[15px] font-semibold text-slate-900 mb-1 leading-[1.3]">
                {scenario?.title || session.scenario_title || `Session #${session.id}`}
              </h3>
              <div className="text-[13px] text-slate-500">
                {formatDateTime(session.created_at)}
              </div>
            </div>
            {onDeleteSession && (
              <button
                onClick={handleDeleteClick}
                disabled={isDeleting}
                className="p-3 rounded-xl border-none bg-transparent text-slate-400 cursor-pointer flex items-center justify-center shrink-0 hover:text-slate-600 hover:bg-slate-100 transition-colors min-w-[44px] min-h-[44px]"
                title="Löschen"
              >
                {isDeleting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Trash2 size={18} />
                )}
              </button>
            )}
          </div>

          {/* Bottom row: Status badges + Action */}
          <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Status indicator */}
              {!isCompleted && !isResumable && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-medium">
                  <Clock size={12} />
                  In Bearbeitung
                </span>
              )}

              {/* Score badge */}
              <span
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[13px] font-semibold"
                style={getScoreBadgeStyle(scorePercent)}
              >
                <Star size={13} />
                {scorePercent !== null ? `${Math.round(scorePercent)}%` : '-- %'}
              </span>

              {/* Duration */}
              {(session.duration || session.video_duration_seconds) && (
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <Clock size={12} />
                  {formatDuration(session.duration || session.video_duration_seconds)}
                </span>
              )}

              {/* Progress for resumable */}
              {isResumable && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
                  {getProgressInfo()}
                </span>
              )}
            </div>

            {/* Resume button or Arrow */}
            {isResumable && onContinueSession ? (
              <button
                onClick={handleContinueClick}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-[10px] border-none bg-primary text-white text-[13px] font-semibold cursor-pointer shadow-md hover:shadow-lg transition-shadow shrink-0"
              >
                <Play size={14} />
                Fortsetzen
              </button>
            ) : (
              <ChevronRight size={22} className="text-slate-400 shrink-0" />
            )}
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <ConfirmDeleteDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={handleConfirmDelete}
          title="Session löschen"
          description="Möchtest du diese Session wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."
          isDeleting={isDeleting}
        />
      </motion.div>
    );
  }

  // Desktop layout
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div
        onClick={onClick}
        className="bg-white rounded-2xl p-5 cursor-pointer border border-slate-200 shadow-sm hover:shadow-lg hover:border-slate-300 transition-all"
      >
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: headerGradient }}
          >
            <Icon className="w-6 h-6" style={{ color: headerText }} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-slate-900 mb-1 whitespace-nowrap overflow-hidden text-ellipsis">
              {scenario?.title || session.scenario_title || `Session #${session.id}`}
            </h3>
            <div className="flex items-center gap-3 flex-wrap text-[13px] text-slate-500">
              <span className="flex items-center gap-1">
                <Calendar size={14} />
                {formatDateTime(session.created_at)}
              </span>
              {session.duration || session.video_duration_seconds ? (
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  {formatDuration(session.duration || session.video_duration_seconds)}
                </span>
              ) : null}
            </div>
          </div>

          {/* Status & Score */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Resume button for incomplete sessions */}
            {isResumable && onContinueSession && (
              <button
                onClick={handleContinueClick}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] border-none bg-primary text-white text-[13px] font-semibold cursor-pointer shadow-md hover:scale-105 hover:shadow-lg transition-all"
              >
                <Play size={14} />
                Fortsetzen
              </button>
            )}

            {/* Progress indicator for resumable sessions */}
            {isResumable && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
                {getProgressInfo()}
              </span>
            )}

            {/* Status indicator (only for non-resumable incomplete sessions) */}
            {!isCompleted && !isResumable && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-medium">
                <Clock size={12} />
                In Bearbeitung
              </span>
            )}

            {/* Score badge - always show for consistency */}
            <span
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold"
              style={getScoreBadgeStyle(scorePercent)}
            >
              <Star size={14} />
              {scorePercent !== null ? `${Math.round(scorePercent)}%` : '-- %'}
            </span>

            {/* Delete button - 44px touch target for accessibility */}
            {onDeleteSession && (
              <button
                onClick={handleDeleteClick}
                disabled={isDeleting}
                className="p-3 rounded-xl border-none bg-transparent text-slate-400 cursor-pointer flex items-center justify-center hover:text-red-500 hover:bg-red-50 transition-colors min-w-[44px] min-h-[44px]"
                title="Löschen"
              >
                {isDeleting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Trash2 size={18} />
                )}
              </button>
            )}

            {/* Arrow */}
            <ChevronRight size={20} className="text-slate-400" />
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        title="Session löschen"
        description="Möchtest du diese Session wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."
        isDeleting={isDeleting}
      />
    </motion.div>
  );
};

export default SessionCard;
