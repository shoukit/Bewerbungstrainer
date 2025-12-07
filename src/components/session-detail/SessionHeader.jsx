/**
 * SessionHeader Component
 *
 * Header bar for session detail view with title, date, duration, and rating.
 */

import React from 'react';
import { ArrowLeft, Calendar, Clock, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

export function SessionHeader({ session, scenario, feedback, onBack }) {
  const overallRating = feedback?.rating?.overall;

  return (
    <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="max-w-[1600px] mx-auto px-4 py-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-slate-900 truncate">
              {scenario?.title || `Session #${session?.id}`}
            </h1>
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(session?.created_at)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatDuration(session?.duration)}
              </span>
              {overallRating && (
                <span className="flex items-center gap-1 text-yellow-600">
                  <Star className="w-4 h-4 fill-yellow-400" />
                  {overallRating}/10
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SessionHeader;
