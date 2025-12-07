/**
 * PacingIssuesCard Component
 *
 * Shows pacing issues with clickable timestamps
 */

import React from 'react';
import { AlertTriangle, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { INTERACTIVE_STATES } from '@/config/constants';
import { TimestampBadge } from '@/components/ui/badge';

export function PacingIssuesCard({ issues, onJumpToTimestamp }) {
  if (!issues || issues.length === 0) return null;

  return (
    <div className="mt-3 space-y-1.5">
      <p className="text-label font-medium">Auffällige Stellen:</p>
      {issues.map((issue, idx) => (
        <button
          key={idx}
          onClick={() => onJumpToTimestamp?.(issue.timestamp)}
          className={cn(
            'w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left',
            'interactive-scale',
            INTERACTIVE_STATES.warning.all
          )}
        >
          <TimestampBadge variant="warning">{issue.timestamp}</TimestampBadge>
          <AlertTriangle className="icon-sm text-amber-500 flex-shrink-0" />
          <span className="text-xs text-slate-700 flex-1 truncate">{issue.issue}</span>
          <Play className="icon-xs text-slate-400" />
        </button>
      ))}
    </div>
  );
}

export default PacingIssuesCard;
