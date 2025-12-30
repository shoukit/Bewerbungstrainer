import React from 'react';
import { Clock } from 'lucide-react';
import { formatDuration } from '@/utils/formatting';
import { useBranding } from '@/hooks/useBranding';

/**
 * Session Timer Component
 * Displays recording time with warning states based on progress
 */
const SessionTimer = ({ seconds, maxSeconds, isRecording, branding: brandingProp }) => {
  // Get branding from hook (self-contained)
  const b = useBranding();
  const branding = brandingProp || b;
  const progress = maxSeconds > 0 ? (seconds / maxSeconds) * 100 : 0;
  const isWarning = progress > 75;
  const isDanger = progress > 90;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: branding.space[3],
      padding: `${branding.space[3]} ${branding.space[4]}`,
      borderRadius: branding.radius.lg,
      backgroundColor: isDanger ? branding.errorLight : isWarning ? branding.warningLight : branding.cardBgHover,
    }}>
      <Clock style={{
        width: branding.iconSize.lg,
        height: branding.iconSize.lg,
        color: isDanger ? branding.error : isWarning ? branding.warning : branding.textSecondary,
      }} />
      <span style={{
        fontSize: branding.fontSize.xl,
        fontWeight: branding.fontWeight.semibold,
        fontFamily: 'monospace',
        color: isDanger ? branding.error : isWarning ? branding.warning : branding.textSecondary,
      }}>
        {formatDuration(seconds)}
      </span>
      <span style={{ fontSize: branding.fontSize.base, color: branding.textMuted }}>
        / {formatDuration(maxSeconds)}
      </span>
    </div>
  );
};

export default SessionTimer;
