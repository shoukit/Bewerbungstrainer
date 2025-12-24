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
import ConfirmDeleteDialog from '@/components/ui/ConfirmDeleteDialog';

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
    if (!scoreVal && scoreVal !== 0) return { background: '#f1f5f9', color: '#64748b' };
    const numScore = parseFloat(scoreVal);
    if (numScore >= 80) return { background: '#dcfce7', color: '#166534' };
    if (numScore >= 60) return { background: '#fef9c3', color: '#854d0e' };
    return { background: '#fee2e2', color: '#991b1b' };
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
          style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '16px',
            cursor: 'pointer',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
          }}
        >
          {/* Top row: Icon + Title + Delete */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: headerGradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon style={{ width: '22px', height: '22px', color: headerText }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{
                fontSize: '15px',
                fontWeight: 600,
                color: '#0f172a',
                marginBottom: '4px',
                lineHeight: '1.3',
              }}>
                {scenario?.title || session.scenario_title || `Session #${session.id}`}
              </h3>
              <div style={{ fontSize: '13px', color: '#64748b' }}>
                {formatDateTime(session.created_at)}
              </div>
            </div>
            {onDeleteSession && (
              <button
                onClick={handleDeleteClick}
                disabled={isDeleting}
                style={{
                  padding: '8px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
                title="Löschen"
              >
                {isDeleting ? (
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <Trash2 size={18} />
                )}
              </button>
            )}
          </div>

          {/* Bottom row: Status badges + Action */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            paddingTop: '12px',
            borderTop: '1px solid #f1f5f9',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {/* Status indicator */}
              {!isCompleted && !isResumable && (
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  background: '#fef3c7',
                  color: '#92400e',
                  fontSize: '12px',
                  fontWeight: 500,
                }}>
                  <Clock size={12} />
                  In Bearbeitung
                </span>
              )}

              {/* Score badge */}
              <span style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 10px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 600,
                ...getScoreBadgeStyle(scorePercent),
              }}>
                <Star size={13} />
                {scorePercent !== null ? `${Math.round(scorePercent)}%` : '-- %'}
              </span>

              {/* Duration */}
              {(session.duration || session.video_duration_seconds) && (
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  color: '#64748b',
                }}>
                  <Clock size={12} />
                  {formatDuration(session.duration || session.video_duration_seconds)}
                </span>
              )}

              {/* Progress for resumable */}
              {isResumable && (
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  background: '#dbeafe',
                  color: '#1e40af',
                  fontSize: '12px',
                  fontWeight: 500,
                }}>
                  {getProgressInfo()}
                </span>
              )}
            </div>

            {/* Resume button or Arrow */}
            {isResumable && onContinueSession ? (
              <button
                onClick={handleContinueClick}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  background: primaryAccent || '#3B82F6',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: `0 2px 8px ${primaryAccent || '#3B82F6'}40`,
                  flexShrink: 0,
                }}
              >
                <Play size={14} />
                Fortsetzen
              </button>
            ) : (
              <ChevronRight size={22} style={{ color: '#94a3b8', flexShrink: 0 }} />
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
        style={{
          background: '#fff',
          borderRadius: '16px',
          padding: '20px',
          cursor: 'pointer',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.08)';
          e.currentTarget.style.borderColor = '#cbd5e1';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
          e.currentTarget.style.borderColor = '#e2e8f0';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Icon */}
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: headerGradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon style={{ width: '24px', height: '24px', color: headerText }} />
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: 600,
              color: '#0f172a',
              marginBottom: '4px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {scenario?.title || session.scenario_title || `Session #${session.id}`}
            </h3>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap',
              fontSize: '13px',
              color: '#64748b',
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={14} />
                {formatDateTime(session.created_at)}
              </span>
              {session.duration || session.video_duration_seconds ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={14} />
                  {formatDuration(session.duration || session.video_duration_seconds)}
                </span>
              ) : null}
            </div>
          </div>

          {/* Status & Score */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
            {/* Resume button for incomplete sessions */}
            {isResumable && onContinueSession && (
              <button
                onClick={handleContinueClick}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  background: primaryAccent || '#3B82F6',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: `0 2px 8px ${primaryAccent || '#3B82F6'}40`,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.boxShadow = `0 4px 12px ${primaryAccent || '#3B82F6'}50`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = `0 2px 8px ${primaryAccent || '#3B82F6'}40`;
                }}
              >
                <Play size={14} />
                Fortsetzen
              </button>
            )}

            {/* Progress indicator for resumable sessions */}
            {isResumable && (
              <span style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: '20px',
                background: '#dbeafe',
                color: '#1e40af',
                fontSize: '12px',
                fontWeight: 500,
              }}>
                {getProgressInfo()}
              </span>
            )}

            {/* Status indicator (only for non-resumable incomplete sessions) */}
            {!isCompleted && !isResumable && (
              <span style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: '20px',
                background: '#fef3c7',
                color: '#92400e',
                fontSize: '12px',
                fontWeight: 500,
              }}>
                <Clock size={12} />
                In Bearbeitung
              </span>
            )}

            {/* Score badge - always show for consistency */}
            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: 600,
              ...getScoreBadgeStyle(scorePercent),
            }}>
              <Star size={14} />
              {scorePercent !== null ? `${Math.round(scorePercent)}%` : '-- %'}
            </span>

            {/* Delete button */}
            {onDeleteSession && (
              <button
                onClick={handleDeleteClick}
                disabled={isDeleting}
                style={{
                  padding: '8px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#ef4444';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#94a3b8';
                }}
                title="Löschen"
              >
                {isDeleting ? (
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <Trash2 size={18} />
                )}
              </button>
            )}

            {/* Arrow */}
            <ChevronRight size={20} style={{ color: '#94a3b8' }} />
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
