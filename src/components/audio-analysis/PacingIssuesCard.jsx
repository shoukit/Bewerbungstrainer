/**
 * PacingIssuesCard Component
 *
 * Shows pacing issues with clickable timestamps
 */

import React from 'react';
import { AlertTriangle, Play } from 'lucide-react';

export function PacingIssuesCard({ issues, onJumpToTimestamp }) {
  if (!issues || issues.length === 0) return null;

  return (
    <div className="mt-3 space-y-1.5">
      <p className="text-xs text-slate-500 font-medium">Auffällige Stellen:</p>
      {issues.map((issue, idx) => (
        <button
          key={idx}
          onClick={() => onJumpToTimestamp?.(issue.timestamp)}
          className="w-full flex items-center gap-2 px-2 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-amber-200 text-amber-800">
            {issue.timestamp}
          </span>
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
          <span className="text-xs text-slate-700 flex-1 truncate">{issue.issue}</span>
          <Play className="w-3 h-3 text-slate-400" />
        </button>
      ))}
    </div>
  );
}

export default PacingIssuesCard;
