/**
 * AudioPlayerCard Component
 *
 * Audio player with progress bar, timeline markers, and playback controls.
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/base/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/base/card';
import { AUDIO_CONFIG, INTERACTIVE_STATES } from '@/config/constants';
import { formatDuration } from '@/utils/formatting';

/**
 * Marker color mapping for timeline
 */
const MARKER_COLORS = {
  positive: 'bg-green-500 hover:bg-green-600',
  negative: 'bg-red-500 hover:bg-red-600',
  tip: 'bg-blue-500 hover:bg-blue-600',
  default: 'bg-slate-500 hover:bg-slate-600',
};

/**
 * Get marker color based on type
 */
function getMarkerColor(type) {
  return MARKER_COLORS[type] || MARKER_COLORS.default;
}

// Use formatDuration from utils for time formatting

export function AudioPlayerCard({
  isLoading,
  audioError,
  isPlaying,
  isMuted,
  currentTime,
  duration,
  timelineMarkers = [],
  onTogglePlay,
  onToggleMute,
  onSkip,
  onSeek,
  progressRef,
}) {
  const handleProgressClick = (e) => {
    if (!progressRef?.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    onSeek?.(newTime);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card variant="elevated" padding="lg">
        <CardHeader className="mb-4">
          <CardTitle icon={Volume2} iconColor="text-slate-800" size="default">
            Gesprächsaufnahme
          </CardTitle>
        </CardHeader>

        {/* Progress Bar */}
        <div className="relative mb-4">
          {isLoading && (
            <div className="flex items-center justify-center bg-slate-100 rounded-lg py-8">
              <Loader2 className="icon-lg text-blue-600 animate-spin" />
            </div>
          )}

          {audioError && (
            <div className="flex items-center justify-center bg-slate-100 rounded-lg py-6">
              <div className="text-center px-4">
                <AlertCircle className="icon-lg text-orange-500 mx-auto mb-2" />
                <p className="text-body">{audioError}</p>
              </div>
            </div>
          )}

          {!audioError && !isLoading && (
            <div
              ref={progressRef}
              onClick={handleProgressClick}
              className="relative w-full h-12 bg-slate-100 rounded-lg cursor-pointer overflow-hidden group"
            >
              {/* Progress fill */}
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-100"
                style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
              />

              {/* Hover indicator */}
              <div className="absolute inset-0 bg-blue-400 opacity-0 group-hover:opacity-10 transition-opacity" />

              {/* Timeline Markers - Larger touch targets on mobile */}
              {timelineMarkers.length > 0 &&
                timelineMarkers.map((marker, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSeek?.(marker.timestamp);
                    }}
                    className={cn(
                      'absolute top-1/2 -translate-y-1/2 w-5 h-5 sm:w-4 sm:h-4 rounded-full cursor-pointer transform -translate-x-1/2',
                      'transition-all hover:scale-125 z-10 shadow-sm',
                      'before:content-[""] before:absolute before:inset-[-8px] before:rounded-full',
                      getMarkerColor(marker.type)
                    )}
                    style={{ left: `${marker.position}%` }}
                    title={marker.text}
                  />
                ))}

              {/* Current position indicator */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-blue-800 transform -translate-x-1/2"
                style={{ left: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
              />
            </div>
          )}
        </div>

        {/* Controls */}
        {!audioError && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onSkip?.(-AUDIO_CONFIG.SKIP_SECONDS)}
                disabled={isLoading}
              >
                <SkipBack size={20} />
              </Button>
              <Button
                onClick={onTogglePlay}
                disabled={isLoading}
                className="w-12 h-12 rounded-full"
              >
                {isPlaying ? (
                  <Pause size={22} />
                ) : (
                  <Play size={22} className="ml-0.5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onSkip?.(AUDIO_CONFIG.SKIP_SECONDS)}
                disabled={isLoading}
              >
                <SkipForward size={20} />
              </Button>
            </div>

            <div className="flex-1 text-center text-sm text-slate-600">
              {formatDuration(currentTime)} / {formatDuration(duration)}
            </div>

            <Button variant="ghost" size="icon" onClick={onToggleMute} disabled={isLoading}>
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </Button>
          </div>
        )}

        {/* Timeline Markers Legend - Touch-friendly buttons */}
        {timelineMarkers.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-label mb-2">Feedback-Marker (klicken zum Springen):</p>
            <div className="flex flex-wrap gap-2">
              {timelineMarkers.map((marker, idx) => (
                <button
                  key={idx}
                  onClick={() => onSeek?.(marker.timestamp)}
                  className={cn(
                    'px-3 py-2.5 min-h-[44px] rounded-xl text-xs text-white transition-opacity hover:opacity-80',
                    getMarkerColor(marker.type)
                  )}
                >
                  {formatDuration(marker.timestamp)} - {marker.text?.substring(0, 30)}
                  {marker.text?.length > 30 ? '...' : ''}
                </button>
              ))}
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
}

export default AudioPlayerCard;
