/**
 * SessionHeader Component
 *
 * Compact single-line header for session detail view.
 * Uses inline styles to avoid WordPress CSS conflicts.
 */

import React from 'react';
import { Calendar, Clock, Star } from 'lucide-react';
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
  const overallRating = feedback?.rating?.overall;

  return (
    <div className="sticky top-0 z-10 bg-primary/10 border-b border-slate-200">
      <div className="w-full px-8 py-3 flex items-center gap-6 flex-wrap">
        {/* Title */}
        <h1 className="text-lg font-bold text-slate-900 m-0 whitespace-nowrap">
          {scenario?.title || `Session #${session?.id}`}
        </h1>

        {/* Separator */}
        <div className="w-px h-5 bg-slate-200" />

        {/* Meta info - inline */}
        <div className="flex items-center gap-4 text-sm text-slate-600">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-slate-400" />
            {formatDate(session?.created_at)}
          </span>

          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-slate-400" />
            {formatDuration(session?.duration)}
          </span>

          {overallRating && (
            <span className="flex items-center gap-1 bg-amber-50 text-amber-800 px-2.5 py-1 rounded-full text-xs font-semibold">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
              {overallRating}/10
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default SessionHeader;
