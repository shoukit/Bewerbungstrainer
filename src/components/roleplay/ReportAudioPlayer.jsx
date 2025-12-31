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
    if (!audioRef.current) {
      console.warn('[AudioPlayer] Cannot seek - audio not loaded');
      return;
    }
    console.log('[AudioPlayer] Seeking to', time);
    audioRef.current.currentTime = time;
    setCurrentTime(time);
    // Auto-play after seeking to timestamp
    if (!isPlaying) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  // Expose seek function to parent - update when audio is ready
  useEffect(() => {
    if (onSeek && !isLoading && audioRef.current) {
      onSeek.current = seekTo;
    }
  }, [onSeek, isLoading]);

  const handleProgressClick = (e) => {
    if (!progressRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const percentage = (e.clientX - rect.left) / rect.width;
    seekTo(percentage * duration);
  };

  // Show placeholder if no audio URL
  if (!audioUrl) {
    return (
      <div className="bg-white rounded-2xl p-5 border border-slate-200">
        <div className="flex items-center gap-2 mb-4">
          <Volume2 size={18} className="text-slate-400" />
          <span className="text-sm font-semibold text-slate-900">
            Gesprächsaufnahme
          </span>
        </div>
        <div className="flex items-center justify-center h-20 bg-slate-50 rounded-xl text-slate-500 text-sm">
          <VolumeX size={20} className="mr-2" />
          Keine Audioaufnahme verfügbar
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200">
      <div className="flex items-center gap-2 mb-4">
        <Volume2 size={18} className="text-indigo-600" />
        <span className="text-sm font-semibold text-slate-900">
          Gesprächsaufnahme
        </span>
      </div>

      {/* Progress Bar */}
      <div
        ref={progressRef}
        onClick={handleProgressClick}
        className="relative h-12 bg-slate-50 rounded-xl cursor-pointer overflow-hidden mb-4"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={24} className="text-indigo-600 animate-spin" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full gap-2">
            <AlertCircle size={18} className="text-red-500" />
            <span className="text-sm text-slate-500">{error}</span>
          </div>
        ) : (
          <>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              className="absolute inset-0 bg-indigo-500/25 rounded-xl"
            />
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-indigo-500 -translate-x-1/2"
              style={{ left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            />
          </>
        )}
      </div>

      {/* Controls */}
      {!error && (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => skip(-10)}
              disabled={isLoading}
              className="w-9 h-9 rounded-lg border-none bg-slate-50 cursor-pointer flex items-center justify-center disabled:opacity-50"
            >
              <SkipBack size={20} className="text-slate-600" />
            </button>
            <button
              onClick={togglePlay}
              disabled={isLoading}
              className="w-12 h-12 rounded-full border-none bg-indigo-500 cursor-pointer flex items-center justify-center disabled:opacity-50 hover:bg-indigo-600 transition-colors shadow-md"
            >
              {isPlaying ? (
                <Pause size={20} className="text-white" />
              ) : (
                <Play size={20} className="text-white ml-0.5" fill="white" />
              )}
            </button>
            <button
              onClick={() => skip(10)}
              disabled={isLoading}
              className="w-9 h-9 rounded-lg border-none bg-slate-50 cursor-pointer flex items-center justify-center disabled:opacity-50"
            >
              <SkipForward size={20} className="text-slate-600" />
            </button>
          </div>

          <div className="flex-1 text-center text-sm text-slate-600 font-mono">
            {formatDuration(currentTime)} / {formatDuration(duration)}
          </div>

          <button
            onClick={toggleMute}
            disabled={isLoading}
            className="w-9 h-9 rounded-lg border-none bg-slate-50 cursor-pointer flex items-center justify-center"
          >
            {isMuted ? (
              <VolumeX size={20} className="text-slate-600" />
            ) : (
              <Volume2 size={20} className="text-slate-600" />
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default ReportAudioPlayer;
