/**
 * SessionDetailHeader - Unified header for session detail views
 *
 * Provides consistent header style for all session types in "Meine Sessions":
 * - Gradient background
 * - Score gauge (optional)
 * - Type label and title
 * - Meta information (date, duration)
 * - Action buttons (back, delete, etc.)
 *
 * Usage:
 *   import SessionDetailHeader from '@/components/SessionDetailHeader';
 *
 *   <SessionDetailHeader
 *     type="ikigai"
 *     title="Mein Ikigai"
 *     subtitle="Berufliche Orientierung"
 *     score={85}
 *     createdAt="2025-12-29T14:30:00"
 *     onBack={() => navigate(-1)}
 *     onDelete={() => handleDelete()}
 *   />
 */

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Clock, Trash2, Download, Compass, Scale, Sparkles, Target, Video, MessageSquare } from 'lucide-react';
import { useMobile } from '@/hooks/useMobile';
import { getScoreColor } from '@/config/colors';

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getGradeLabel = (score) => {
  if (score >= 90) return 'Ausgezeichnet!';
  if (score >= 80) return 'Sehr gut!';
  if (score >= 70) return 'Gut!';
  if (score >= 60) return 'Solide Leistung';
  if (score >= 50) return 'Ausbaufähig';
  return 'In Arbeit';
};

const TYPE_CONFIG = {
  ikigai: {
    label: 'Ikigai-Kompass',
    icon: Compass,
  },
  decision: {
    label: 'Entscheidungs-Board',
    icon: Scale,
  },
  briefing: {
    label: 'Smart Briefing',
    icon: Sparkles,
  },
  simulator: {
    label: 'Szenario-Training',
    icon: Target,
  },
  video: {
    label: 'Wirkungs-Analyse',
    icon: Video,
  },
  roleplay: {
    label: 'Live-Simulation',
    icon: MessageSquare,
  },
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/**
 * Score Gauge - Circular progress indicator
 */
const ScoreGauge = ({ score, size = 80 }) => {
  const percentage = Math.min(100, Math.max(0, score || 0));
  const radius = (size - 10) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.25)"
          strokeWidth={8}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#fff"
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="font-bold text-white leading-none"
          style={{ fontSize: size / 3 }}
        >
          {Math.round(score)}
        </motion.span>
      </div>
    </div>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * SessionDetailHeader Component
 *
 * @param {string} type - Session type: 'ikigai' | 'decision' | 'briefing' | 'simulator' | 'video' | 'roleplay'
 * @param {string} title - Main title
 * @param {string} subtitle - Optional subtitle
 * @param {number} score - Score value (0-100), optional
 * @param {string} status - Status text (e.g., 'completed', 'in_progress')
 * @param {string} createdAt - Creation date string
 * @param {number} duration - Duration in seconds (optional)
 * @param {function} onBack - Callback for back button
 * @param {function} onDelete - Callback for delete button (optional)
 * @param {function} onDownload - Callback for download button (optional)
 * @param {boolean} isDeleting - Show loading state on delete button
 * @param {boolean} isDownloading - Show loading state on download button
 * @param {React.ReactNode} extraActions - Additional action buttons
 */
const SessionDetailHeader = ({
  type,
  title,
  subtitle,
  score,
  status,
  createdAt,
  duration,
  onBack,
  onDelete,
  onDownload,
  isDeleting = false,
  isDownloading = false,
  extraActions,
}) => {
  const isMobile = useMobile(768);

  const typeConfig = TYPE_CONFIG[type] || TYPE_CONFIG.simulator;
  const TypeIcon = typeConfig.icon;

  const showScore = score !== undefined && score !== null && score > 0;

  return (
    <div className="sticky top-0 z-40 bg-brand-gradient" style={{ padding: isMobile ? '20px 16px' : '24px 32px' }}>
      <div className="max-w-[1400px] mx-auto">
        {/* Back Button */}
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 bg-white/15 border-none rounded-lg px-3 py-2 cursor-pointer text-white text-[13px] mb-4 hover:bg-white/25 transition-colors"
          >
            <ArrowLeft size={16} />
            Zurück zur Übersicht
          </button>
        )}

        {/* Header Content */}
        <div className="flex items-center gap-6">
          {/* Score Gauge - Hidden on mobile if no score */}
          {!isMobile && showScore && (
            <ScoreGauge score={score} size={80} />
          )}

          {/* Title & Meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-2">
              {/* Type Badge */}
              <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/20 text-white">
                <TypeIcon size={14} />
                {typeConfig.label}
              </span>

              {/* Status Badge */}
              {showScore && (
                <span
                  className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/90"
                  style={{ color: getScoreColor(score) }}
                >
                  {getGradeLabel(score)}
                </span>
              )}

              {/* In Progress Badge */}
              {status === 'in_progress' && (
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/90 text-amber-600">
                  In Bearbeitung
                </span>
              )}
            </div>

            {/* Title */}
            <h1
              className="font-bold text-white m-0 truncate"
              style={{
                fontSize: isMobile ? '20px' : '24px',
                marginBottom: subtitle ? '4px' : '8px'
              }}
            >
              {title}
            </h1>

            {/* Subtitle */}
            {subtitle && (
              <p className="text-sm text-white/80 m-0 mb-2">
                {subtitle}
              </p>
            )}

            {/* Meta Information */}
            <div className="flex items-center gap-4 flex-wrap">
              {createdAt && (
                <span className="flex items-center gap-1.5 text-[13px] text-white/80">
                  <Calendar size={14} />
                  {formatDate(createdAt)}
                </span>
              )}
              {duration && (
                <span className="flex items-center gap-1.5 text-[13px] text-white/80">
                  <Clock size={14} />
                  {Math.floor(duration / 60)}:{String(duration % 60).padStart(2, '0')} Min.
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 flex-shrink-0">
            {/* Download Button */}
            {onDownload && (
              <button
                onClick={onDownload}
                disabled={isDownloading}
                title="Als PDF herunterladen"
                className="flex items-center justify-center gap-1.5 bg-white/15 border-none rounded-lg text-white text-[13px] font-medium hover:bg-white/25 transition-colors disabled:opacity-70"
                style={{
                  padding: isMobile ? '10px' : '10px 16px',
                  cursor: isDownloading ? 'wait' : 'pointer',
                }}
              >
                <Download size={16} />
                {!isMobile && 'PDF'}
              </button>
            )}

            {/* Extra Actions */}
            {extraActions}

            {/* Delete Button */}
            {onDelete && (
              <button
                onClick={onDelete}
                disabled={isDeleting}
                title="Löschen"
                className="flex items-center justify-center gap-1.5 bg-red-500/20 border border-red-500/40 rounded-lg text-white text-[13px] font-medium hover:bg-red-500/30 transition-colors disabled:opacity-70"
                style={{
                  padding: isMobile ? '10px' : '10px 16px',
                  cursor: isDeleting ? 'wait' : 'pointer',
                }}
              >
                <Trash2 size={16} />
                {!isMobile && 'Löschen'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionDetailHeader;
