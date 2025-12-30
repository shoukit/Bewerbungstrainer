import React, { useState, useRef, useEffect } from 'react';
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
import { formatDuration } from '@/utils/formatting';
import { getWPNonce } from '@/services/wordpress-api';

/**
 * Audio Player Component for Session Reports
 * Handles authenticated audio loading and playback controls
 */
const ReportAudioPlayer = ({ audioUrl, duration: durationHint, primaryAccent, branding, onSeek }) => {
  const audioRef = useRef(null);
  const progressRef = useRef(null);
  const objectUrlRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationHint || 0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!audioUrl) return;

    let isMounted = true;

    // Check if this is a proxy URL (needs authentication) or direct file URL
    const isProxyUrl = audioUrl.includes('/wp-json/') || audioUrl.includes('/api/');

    const loadAudio = async () => {
      try {
        setIsLoading(true);
        setError(null);

        let audioSrc = audioUrl;

        // Only fetch with auth headers if it's a proxy endpoint
        if (isProxyUrl) {
          const response = await fetch(audioUrl, {
            method: 'GET',
            headers: {
              'X-WP-Nonce': getWPNonce(),
            },
            credentials: 'same-origin',
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const blob = await response.blob();
          if (!isMounted) return;

          if (blob.size === 0) {
            throw new Error('Audio nicht verfügbar');
          }

          // Create object URL from blob
          const objectUrl = URL.createObjectURL(blob);
          objectUrlRef.current = objectUrl;
          audioSrc = objectUrl;
        }

        const audio = new Audio(audioSrc);
        audioRef.current = audio;

        audio.addEventListener('loadedmetadata', () => {
          if (isMounted) {
            setDuration(audio.duration);
            setIsLoading(false);
          }
        });

        audio.addEventListener('timeupdate', () => {
          if (isMounted) {
            setCurrentTime(audio.currentTime);
          }
        });

        audio.addEventListener('ended', () => {
          if (isMounted) {
            setIsPlaying(false);
            setCurrentTime(0);
          }
        });

        audio.addEventListener('error', () => {
          if (isMounted) {
            setError('Audio konnte nicht geladen werden');
            setIsLoading(false);
          }
        });
      } catch (err) {
        console.error('[AudioPlayer] Failed to load audio:', err);
        if (isMounted) {
          setError('Audio konnte nicht geladen werden');
          setIsLoading(false);
        }
      }
    };

    loadAudio();

    return () => {
      isMounted = false;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const skip = (seconds) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
  };

  const seekTo = (time) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    setCurrentTime(time);
    // Auto-play after seeking to timestamp
    if (!isPlaying) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  // Expose seek function to parent
  useEffect(() => {
    if (onSeek) {
      onSeek.current = seekTo;
    }
  }, [onSeek]);

  const handleProgressClick = (e) => {
    if (!progressRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const percentage = (e.clientX - rect.left) / rect.width;
    seekTo(percentage * duration);
  };

  // Show placeholder if no audio URL
  if (!audioUrl) {
    return (
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        padding: '20px',
        border: `1px solid ${branding.borderColor}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Volume2 size={18} color={branding.textMuted} />
          <span style={{ fontSize: '14px', fontWeight: 600, color: branding.textMain }}>
            Gesprächsaufnahme
          </span>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '80px',
          background: branding.cardBgHover,
          borderRadius: '12px',
          color: branding.textMuted,
          fontSize: '13px',
        }}>
          <VolumeX size={20} style={{ marginRight: '8px' }} />
          Keine Audioaufnahme verfügbar
        </div>
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
        <Volume2 size={18} color={primaryAccent} />
        <span style={{ fontSize: '14px', fontWeight: 600, color: branding.textMain }}>
          Gesprächsaufnahme
        </span>
      </div>

      {/* Progress Bar */}
      <div
        ref={progressRef}
        onClick={handleProgressClick}
        style={{
          position: 'relative',
          height: '48px',
          background: branding.cardBgHover,
          borderRadius: '12px',
          cursor: 'pointer',
          overflow: 'hidden',
          marginBottom: '16px',
        }}
      >
        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Loader2 size={24} color={primaryAccent} style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : error ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '8px' }}>
            <AlertCircle size={18} color={branding.warning} />
            <span style={{ fontSize: '13px', color: branding.textMuted }}>{error}</span>
          </div>
        ) : (
          <>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(90deg, ${primaryAccent}40, ${primaryAccent}60)`,
                borderRadius: '12px',
              }}
            />
            <div style={{
              position: 'absolute',
              left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
              top: 0,
              bottom: 0,
              width: '3px',
              background: primaryAccent,
              transform: 'translateX(-50%)',
            }} />
          </>
        )}
      </div>

      {/* Controls */}
      {!error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => skip(-10)}
              disabled={isLoading}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                border: 'none',
                background: branding.cardBgHover,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: isLoading ? 0.5 : 1,
              }}
            >
              <SkipBack size={20} color={branding.textSecondary} />
            </button>
            <button
              onClick={togglePlay}
              disabled={isLoading}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                border: 'none',
                background: primaryAccent,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: isLoading ? 0.5 : 1,
              }}
            >
              {isPlaying ? (
                <Pause size={20} color="#fff" />
              ) : (
                <Play size={20} color="#fff" style={{ marginLeft: '2px' }} />
              )}
            </button>
            <button
              onClick={() => skip(10)}
              disabled={isLoading}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                border: 'none',
                background: branding.cardBgHover,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: isLoading ? 0.5 : 1,
              }}
            >
              <SkipForward size={20} color={branding.textSecondary} />
            </button>
          </div>

          <div style={{ flex: 1, textAlign: 'center', fontSize: '14px', color: branding.textSecondary, fontFamily: 'monospace' }}>
            {formatDuration(currentTime)} / {formatDuration(duration)}
          </div>

          <button
            onClick={toggleMute}
            disabled={isLoading}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              border: 'none',
              background: branding.cardBgHover,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isMuted ? (
              <VolumeX size={20} color={branding.textSecondary} />
            ) : (
              <Volume2 size={20} color={branding.textSecondary} />
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default ReportAudioPlayer;
