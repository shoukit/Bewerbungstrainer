/**
 * SessionHeader Component
 *
 * Compact single-line header for session detail view.
 * Uses inline styles to avoid WordPress CSS conflicts.
 */

import React from 'react';
import { Calendar, Clock, Star } from 'lucide-react';
import { useBranding } from '@/hooks/useBranding';
import { COLORS } from '@/config/colors';
import { formatDuration } from '@/utils/formatting';

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
  const b = useBranding();

  const overallRating = feedback?.rating?.overall;

  return (
    <div
      style={{
        backgroundColor: b.primaryAccentLight,
        borderBottom: `1px solid ${COLORS.slate[200]}`,
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <div
        style={{
          width: '100%',
          padding: `${b.space[3]} ${b.space[8]}`,
          display: 'flex',
          alignItems: 'center',
          gap: b.space[6],
          flexWrap: 'wrap',
        }}
      >
        {/* Title */}
        <h1
          style={{
            fontSize: b.fontSize.lg,
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
            gap: b.space[4],
            fontSize: b.fontSize.sm,
            color: COLORS.slate[600],
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: b.space[1.5] }}>
            <Calendar style={{ width: '16px', height: '16px', color: COLORS.slate[400] }} />
            {formatDate(session?.created_at)}
          </span>

          <span style={{ display: 'flex', alignItems: 'center', gap: b.space[1.5] }}>
            <Clock style={{ width: '16px', height: '16px', color: COLORS.slate[400] }} />
            {formatDuration(session?.duration)}
          </span>

          {overallRating && (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: b.space[1],
                backgroundColor: '#fef3c7',
                color: '#92400e',
                padding: `${b.space[1]} ${b.space[2.5]}`,
                borderRadius: b.radius.full,
                fontSize: b.fontSize.xs,
                fontWeight: 600,
              }}
            >
              <Star
                style={{
                  width: '14px',
                  height: '14px',
                  fill: COLORS.amber[400],
                  color: COLORS.amber[500],
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
