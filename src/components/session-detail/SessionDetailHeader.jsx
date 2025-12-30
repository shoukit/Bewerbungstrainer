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
import { useBranding } from '@/hooks/useBranding';
import { useMobile } from '@/hooks/useMobile';
import { usePartner } from '@/context/PartnerContext';
import { DEFAULT_BRANDING } from '@/config/partners';
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
const ScoreGauge = ({ score, size = 80, primaryAccent }) => {
  const percentage = Math.min(100, Math.max(0, score || 0));
  const radius = (size - 10) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
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
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          style={{
            fontSize: size / 3,
            fontWeight: 700,
            color: '#fff',
            lineHeight: 1,
          }}
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
  const b = useBranding();
  const isMobile = useMobile(768);
  const { branding } = usePartner();
  const headerGradient = branding?.['--header-gradient'] || DEFAULT_BRANDING['--header-gradient'];
  const primaryAccent = branding?.['--primary-accent'] || DEFAULT_BRANDING['--primary-accent'];

  const typeConfig = TYPE_CONFIG[type] || TYPE_CONFIG.simulator;
  const TypeIcon = typeConfig.icon;

  const showScore = score !== undefined && score !== null && score > 0;

  return (
    <div style={{
      background: headerGradient,
      padding: isMobile ? '20px 16px' : '24px 32px',
      position: 'sticky',
      top: 0,
      zIndex: 40,
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Back Button */}
        {onBack && (
          <button
            onClick={onBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 12px',
              cursor: 'pointer',
              color: '#fff',
              fontSize: '13px',
              marginBottom: '16px',
            }}
          >
            <ArrowLeft size={16} />
            Zurück zur Übersicht
          </button>
        )}

        {/* Header Content */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
        }}>
          {/* Score Gauge - Hidden on mobile if no score */}
          {!isMobile && showScore && (
            <ScoreGauge score={score} size={80} primaryAccent={primaryAccent} />
          )}

          {/* Title & Meta */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
              {/* Type Badge */}
              <span style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                padding: '4px 10px',
                borderRadius: '20px',
                background: 'rgba(255,255,255,0.2)',
                color: '#fff',
              }}>
                <TypeIcon size={14} />
                {typeConfig.label}
              </span>

              {/* Status Badge */}
              {showScore && (
                <span style={{
                  fontSize: '12px',
                  fontWeight: 500,
                  padding: '4px 10px',
                  borderRadius: '20px',
                  background: 'rgba(255,255,255,0.9)',
                  color: getScoreColor(score, primaryAccent),
                }}>
                  {getGradeLabel(score)}
                </span>
              )}

              {/* In Progress Badge */}
              {status === 'in_progress' && (
                <span style={{
                  fontSize: '12px',
                  fontWeight: 500,
                  padding: '4px 10px',
                  borderRadius: '20px',
                  background: 'rgba(255,255,255,0.9)',
                  color: '#f59e0b',
                }}>
                  In Bearbeitung
                </span>
              )}
            </div>

            {/* Title */}
            <h1 style={{
              fontSize: isMobile ? '20px' : '24px',
              fontWeight: 700,
              color: '#fff',
              margin: 0,
              marginBottom: subtitle ? '4px' : '8px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {title}
            </h1>

            {/* Subtitle */}
            {subtitle && (
              <p style={{
                fontSize: '14px',
                color: 'rgba(255,255,255,0.8)',
                margin: 0,
                marginBottom: '8px',
              }}>
                {subtitle}
              </p>
            )}

            {/* Meta Information */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              {createdAt && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>
                  <Calendar size={14} />
                  {formatDate(createdAt)}
                </span>
              )}
              {duration && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>
                  <Clock size={14} />
                  {Math.floor(duration / 60)}:{String(duration % 60).padStart(2, '0')} Min.
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', flexShrink: 0 }}>
            {/* Download Button */}
            {onDownload && (
              <button
                onClick={onDownload}
                disabled={isDownloading}
                title="Als PDF herunterladen"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: isMobile ? '10px' : '10px 16px',
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: isDownloading ? 'wait' : 'pointer',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 500,
                  opacity: isDownloading ? 0.7 : 1,
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
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: isMobile ? '10px' : '10px 16px',
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '8px',
                  cursor: isDeleting ? 'wait' : 'pointer',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 500,
                  opacity: isDeleting ? 0.7 : 1,
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
