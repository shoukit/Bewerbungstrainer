/**
 * SessionHeader Component
 *
 * Compact single-line header for session detail view.
 * Uses inline styles to avoid WordPress CSS conflicts.
 */

import React from 'react';
import { Calendar, Clock, Star } from 'lucide-react';
import { usePartner } from '@/context/PartnerContext';
import { DEFAULT_BRANDING } from '@/config/partners';
import { COLORS } from '@/config/colors';

/**
 * Format seconds to M:SS
 */
function formatDuration(seconds) {
  if (!seconds || !isFinite(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format date to German locale
 */
function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function SessionHeader({ session, scenario, feedback }) {
  // Partner theming
  const { branding } = usePartner();
  const primaryAccentLight = branding?.['--primary-accent-light'] || DEFAULT_BRANDING['--primary-accent-light'];

  const overallRating = feedback?.rating?.overall;

  return (
    <div
      style={{
        backgroundColor: primaryAccentLight,
        borderBottom: `1px solid ${COLORS.slate[200]}`,
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <div
        style={{
          width: '100%',
          padding: '12px 32px',
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          flexWrap: 'wrap',
        }}
      >
        {/* Title */}
        <h1
          style={{
            fontSize: '18px',
            fontWeight: 700,
            color: COLORS.slate[900],
            margin: 0,
            whiteSpace: 'nowrap',
          }}
        >
          {scenario?.title || `Session #${session?.id}`}
        </h1>

        {/* Separator */}
        <div style={{ width: '1px', height: '20px', backgroundColor: COLORS.slate[200] }} />

        {/* Meta info - inline */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            fontSize: '14px',
            color: COLORS.slate[600],
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar style={{ width: '16px', height: '16px', color: COLORS.slate[400] }} />
            {formatDate(session?.created_at)}
          </span>

          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock style={{ width: '16px', height: '16px', color: COLORS.slate[400] }} />
            {formatDuration(session?.duration)}
          </span>

          {overallRating && (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                backgroundColor: '#fef3c7',
                color: '#92400e',
                padding: '4px 10px',
                borderRadius: '9999px',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              <Star
                style={{
                  width: '14px',
                  height: '14px',
                  fill: COLORS.yellow[400],
                  color: COLORS.yellow[500],
                }}
              />
              {overallRating}/10
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default SessionHeader;
