/**
 * SessionHeader Component
 *
 * Header bar for session detail view with title, date, duration, and rating.
 */

import React from 'react';
import { ArrowLeft, Calendar, Clock, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
            <ArrowLeft className="icon-sm mr-2" />
            Zurück
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-slate-900 truncate">
              {scenario?.title || `Session #${session?.id}`}
            </h1>
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1">
                <Calendar className="icon-sm" />
                {formatDate(session?.created_at)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="icon-sm" />
                {formatDuration(session?.duration)}
              </span>
              {overallRating && (
                <Badge variant="warning" className="flex items-center gap-1">
                  <Star className="icon-sm fill-yellow-400" />
                  {overallRating}/10
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SessionHeader;
