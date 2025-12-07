/**
 * SessionDetailView Component
 *
 * Main view for displaying a completed session with audio playback,
 * transcript, and feedback sidebar.
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import {
  getRoleplaySessionAnalysis,
  getRoleplaySessionAudioUrl,
  getRoleplayScenario,
} from '@/services/roleplay-feedback-adapter';
import { parseFeedbackJSON, parseAudioAnalysisJSON, parseTranscriptJSON } from '@/utils/parseJSON';

import { SessionHeader, AudioPlayerCard, TranscriptCard } from './session-detail';
import SessionSidebar from './SessionSidebar';

// =============================================================================
// CUSTOM HOOKS
// =============================================================================

/**
 * Hook for managing audio player state and controls
 */
function useAudioPlayer(sessionId, conversationId) {
  const audioRef = useRef(null);
  const progressRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioError, setAudioError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize audio
  useEffect(() => {
    if (!conversationId) return;

    const audioUrl = getRoleplaySessionAudioUrl(sessionId);
    console.log('🎵 [AUDIO] Loading audio:', audioUrl);

    setIsLoading(true);
    setAudioError(null);

    const config = window.bewerbungstrainerConfig || { nonce: '' };

    fetch(audioUrl, {
      method: 'GET',
      headers: { 'X-WP-Nonce': config.nonce },
      credentials: 'same-origin',
    })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.blob();
      })
      .then((blob) => {
        const objectUrl = URL.createObjectURL(blob);
        const audio = new Audio(objectUrl);
        audioRef.current = audio;
        audio._objectUrl = objectUrl;

        audio.addEventListener('loadedmetadata', () => {
          setDuration(audio.duration);
          setIsLoading(false);
        });
        audio.addEventListener('timeupdate', () => setCurrentTime(audio.currentTime));
        audio.addEventListener('play', () => setIsPlaying(true));
        audio.addEventListener('pause', () => setIsPlaying(false));
        audio.addEventListener('ended', () => setIsPlaying(false));
        audio.addEventListener('error', () => {
          setAudioError('Audio konnte nicht abgespielt werden.');
          setIsLoading(false);
        });
      })
      .catch((err) => {
        console.error('❌ [AUDIO] Load error:', err);
        setAudioError('Audio nicht verfügbar.');
        setIsLoading(false);
      });

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        if (audioRef.current._objectUrl) {
          URL.revokeObjectURL(audioRef.current._objectUrl);
        }
        audioRef.current = null;
      }
    };
  }, [sessionId, conversationId]);

  const togglePlay = useCallback(() => {
    if (audioRef.current) {
      isPlaying ? audioRef.current.pause() : audioRef.current.play();
    }
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  const skip = useCallback(
    (seconds) => {
      if (audioRef.current) {
        audioRef.current.currentTime = Math.max(
          0,
          Math.min(audioRef.current.currentTime + seconds, duration)
        );
      }
    },
    [duration]
  );

  const seekToTime = useCallback(
    (time) => {
      if (audioRef.current && duration > 0) {
        audioRef.current.currentTime = time;
      }
    },
    [duration]
  );

  return {
    audioRef,
    progressRef,
    isPlaying,
    isMuted,
    currentTime,
    duration,
    audioError,
    isLoading,
    togglePlay,
    toggleMute,
    skip,
    seekToTime,
  };
}

/**
 * Hook for tracking active transcript entry based on current time
 */
function useActiveTranscriptIndex(transcript, currentTime) {
  return useMemo(() => {
    if (!transcript?.length) return -1;

    let activeIndex = -1;
    for (let i = 0; i < transcript.length; i++) {
      const entryTime = transcript[i].elapsedTime ?? 0;
      if (entryTime <= currentTime) {
        activeIndex = i;
      } else {
        break;
      }
    }
    return activeIndex;
  }, [transcript, currentTime]);
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

function SessionDetailView({ session, onBack }) {
  const [sessionData, setSessionData] = useState(session);
  const [scenario, setScenario] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Audio player
  const audio = useAudioPlayer(sessionData?.id, sessionData?.conversation_id);

  // Parse data
  const parsedFeedback = useMemo(
    () => parseFeedbackJSON(sessionData?.feedback_json),
    [sessionData?.feedback_json]
  );

  const parsedAudioAnalysis = useMemo(
    () => parseAudioAnalysisJSON(sessionData?.audio_analysis_json),
    [sessionData?.audio_analysis_json]
  );

  const parsedTranscript = useMemo(
    () => parseTranscriptJSON(sessionData?.transcript),
    [sessionData?.transcript]
  );

  // Active transcript index
  const activeTranscriptIndex = useActiveTranscriptIndex(parsedTranscript, audio.currentTime);

  // Timeline markers from feedback
  const timelineMarkers = useMemo(() => {
    if (!parsedFeedback?.timeline || !audio.duration) return [];
    return parsedFeedback.timeline.map((marker) => ({
      ...marker,
      position: (marker.timestamp / audio.duration) * 100,
    }));
  }, [parsedFeedback, audio.duration]);

  // Load session data
  useEffect(() => {
    loadSessionData();
  }, [session?.id]);

  const loadSessionData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const fullSession = await getRoleplaySessionAnalysis(session.id);

      // Merge with initial data (preserves data passed during navigation)
      setSessionData((prev) => ({
        ...fullSession,
        feedback_json: fullSession.feedback_json || prev?.feedback_json,
        audio_analysis_json: fullSession.audio_analysis_json || prev?.audio_analysis_json,
        transcript: fullSession.transcript || prev?.transcript,
        conversation_id: fullSession.conversation_id || prev?.conversation_id,
      }));

      // Load scenario
      if (fullSession.scenario_id) {
        try {
          const scenarioData = await getRoleplayScenario(fullSession.scenario_id);
          setScenario(scenarioData);
        } catch (err) {
          console.warn('Could not load scenario:', err);
        }
      }
    } catch (err) {
      console.error('Failed to load session:', err);
      setError(err.message || 'Fehler beim Laden der Session');
    } finally {
      setIsLoading(false);
    }
  };

  // Parse timestamp string (MM:SS) to seconds
  const parseTimestamp = useCallback((timeString) => {
    if (!timeString) return 0;
    const parts = timeString.split(':');
    if (parts.length === 2) {
      return (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
    }
    return 0;
  }, []);

  // Handle jump to timestamp
  const handleJumpToTimestamp = useCallback(
    (timeString) => {
      const seconds = parseTimestamp(timeString);
      console.log(`🎯 [SESSION] Jump to ${timeString} (${seconds}s)`);
      audio.seekToTime(seconds);
      if (audio.audioRef.current && !audio.isPlaying) {
        audio.audioRef.current.play().catch(() => {});
      }
    },
    [parseTimestamp, audio]
  );

  // Handle seek to transcript entry
  const handleSeekToEntry = useCallback(
    (index) => {
      const entry = parsedTranscript[index];
      if (entry?.elapsedTime !== undefined) {
        audio.seekToTime(entry.elapsedTime);
      }
    },
    [parsedTranscript, audio]
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-ocean-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Gesprächsanalyse wird geladen...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Fehler beim Laden</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={onBack}>
              Zurück
            </Button>
            <Button onClick={loadSessionData}>Erneut versuchen</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <SessionHeader
        session={sessionData}
        scenario={scenario}
        feedback={parsedFeedback}
      />

      <div className="max-w-[1600px] mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          {/* Left Column - Audio Player & Transcript */}
          <div className="lg:col-span-3 space-y-6">
            <AudioPlayerCard
              isLoading={audio.isLoading}
              audioError={audio.audioError}
              isPlaying={audio.isPlaying}
              isMuted={audio.isMuted}
              currentTime={audio.currentTime}
              duration={audio.duration}
              timelineMarkers={timelineMarkers}
              onTogglePlay={audio.togglePlay}
              onToggleMute={audio.toggleMute}
              onSkip={audio.skip}
              onSeek={audio.seekToTime}
              progressRef={audio.progressRef}
            />

            <TranscriptCard
              transcript={parsedTranscript}
              activeIndex={activeTranscriptIndex}
              isPlaying={audio.isPlaying}
              scenario={scenario}
              onSeekToEntry={handleSeekToEntry}
            />
          </div>

          {/* Right Column - Feedback Sidebar */}
          <div className={cn('lg:col-span-2 self-start', isSidebarCollapsed && 'lg:col-span-1')}>
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <SessionSidebar
                session={sessionData}
                scenario={scenario}
                feedback={parsedFeedback}
                audioAnalysis={parsedAudioAnalysis}
                coachingComments={[]}
                onRetry={() => {
                  if (scenario) {
                    window.location.href = `?scenario=${scenario.id}`;
                  }
                }}
                onCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                onJumpToTimestamp={handleJumpToTimestamp}
                isCollapsed={isSidebarCollapsed}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SessionDetailView;
