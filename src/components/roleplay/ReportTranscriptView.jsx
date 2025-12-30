import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Bot, User } from 'lucide-react';
import { formatDuration } from '@/utils/formatting';

/**
 * Chat-style Transcript View for Session Reports
 * Displays conversation between agent and user with clickable timestamps
 */
const ReportTranscriptView = ({ transcript, scenario, primaryAccent, branding, onSeekToTime }) => {
  if (!transcript || transcript.length === 0) {
    return (
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        padding: '40px 20px',
        border: `1px solid ${branding.borderColor}`,
        textAlign: 'center',
      }}>
        <MessageSquare size={32} color={branding.textMuted} style={{ marginBottom: '12px' }} />
        <p style={{ color: branding.textMuted, fontSize: '14px' }}>Kein Transkript verfügbar</p>
      </div>
    );
  }

  return (
    <div style={{
      background: '#fff',
      borderRadius: '16px',
      padding: '20px',
      border: `1px solid ${branding.borderColor}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <MessageSquare size={18} color={primaryAccent} />
        <span style={{ fontSize: '14px', fontWeight: 600, color: branding.textMain }}>
          Gesprächsverlauf
        </span>
      </div>

      <div style={{ maxHeight: '500px', overflowY: 'auto', paddingRight: '8px' }}>
        {transcript.map((entry, idx) => {
          const isAgent = entry.role === 'agent';
          const timeLabel = entry.timeLabel || (entry.elapsedTime !== undefined ? formatDuration(entry.elapsedTime) : null);

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              style={{
                display: 'flex',
                gap: '10px',
                marginBottom: '12px',
                flexDirection: isAgent ? 'row' : 'row-reverse',
              }}
            >
              {/* Avatar */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                {isAgent ? (
                  scenario?.interviewer_profile?.image_url ? (
                    <img
                      src={scenario.interviewer_profile.image_url}
                      alt={scenario.interviewer_profile.name || 'Interviewer'}
                      style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${primaryAccent}30` }}
                    />
                  ) : (
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${primaryAccent}, ${primaryAccent}cc)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Bot size={16} color="#fff" />
                    </div>
                  )
                ) : (
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <User size={16} color="#fff" />
                  </div>
                )}
                {!isAgent && timeLabel && (
                  <button
                    onClick={() => onSeekToTime?.(entry.elapsedTime)}
                    style={{
                      fontSize: '10px',
                      fontFamily: 'monospace',
                      color: primaryAccent,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    {timeLabel}
                  </button>
                )}
              </div>

              {/* Message Bubble */}
              <div style={{
                maxWidth: '85%',
                padding: '10px 14px',
                borderRadius: isAgent ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                background: isAgent ? branding.cardBgHover : 'linear-gradient(135deg, #14b8a6, #0d9488)',
                color: isAgent ? branding.textMain : '#fff',
                fontSize: '13px',
                lineHeight: 1.5,
                border: isAgent ? `1px solid ${branding.borderColor}` : 'none',
              }}>
                {entry.text}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ReportTranscriptView;
