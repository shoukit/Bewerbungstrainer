import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ChevronRight,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  ThumbsUp,
  MessageSquare,
  Mic,
  ChevronDown,
  ChevronUp,
  Trophy,
  Check,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Loader2,
  Volume2,
  AlertCircle,
} from 'lucide-react';
import { formatDuration } from '@/utils/formatting';
import { usePartner } from '@/context/PartnerContext';
import { DEFAULT_BRANDING } from '@/config/partners';
import { useBranding } from '@/hooks/useBranding';
import AudioAnalysisPanel from '@/components/feedback/AudioAnalysisPanel';
import { normalizeAudioMetrics, hasAudioMetricsData } from '@/utils/audioMetricsAdapter';

/**
 * Score Badge Component
 * Now displays scores on scale of 100 (converts from scale of 10)
 */
const ScoreBadge = ({ score, label, size = 'normal', variant = 'default' }) => {
  // Convert from scale of 10 to scale of 100
  const score100 = score != null ? score * 10 : null;

  const getScoreColorClasses = (s) => {
    if (variant === 'white') {
      // White variant for gradient backgrounds
      return 'bg-white/20 border-white text-white';
    }
    // Default variant
    if (s >= 80) return 'bg-green-50 border-green-500 text-green-600';
    if (s >= 60) return 'bg-blue-50 border-blue-500 text-blue-600';
    if (s >= 40) return 'bg-amber-50 border-amber-500 text-amber-600';
    return 'bg-red-50 border-red-500 text-red-600';
  };

  const colorClasses = getScoreColorClasses(score100);
  const isLarge = size === 'large';

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`
        ${isLarge ? 'w-20 h-20' : 'w-14 h-14'}
        rounded-full border-3 flex items-center justify-center
        ${colorClasses}
      `}>
        <span className={`
          ${isLarge ? 'text-3xl' : 'text-2xl'}
          font-bold
        `}>
          {score100 != null ? Math.round(score100) : '-'}
        </span>
      </div>
      <span className={`
        ${isLarge ? 'text-sm' : 'text-xs'}
        ${variant === 'white' ? 'text-white' : 'text-slate-600'}
        font-medium
      `}>
        {label}
      </span>
    </div>
  );
};

/**
 * Collapsible Section Component
 */
const CollapsibleSection = ({ title, icon: Icon, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden mb-4 shadow-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between border-none bg-transparent cursor-pointer hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-blue-600" />
          <span className="text-base font-semibold text-slate-900">
            {title}
          </span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        )}
      </button>
      {isOpen && (
        <div className="px-6 pb-6 border-t border-slate-100 pt-4">
          {children}
        </div>
      )}
    </div>
  );
};

/**
 * Feedback List Item
 */
const FeedbackItem = ({ text, type }) => {
  const config = {
    strength: {
      icon: ThumbsUp,
      iconClass: 'text-green-600',
      bgClass: 'bg-green-50'
    },
    improvement: {
      icon: AlertTriangle,
      iconClass: 'text-amber-600',
      bgClass: 'bg-amber-50'
    },
    tip: {
      icon: Lightbulb,
      iconClass: 'text-blue-600',
      bgClass: 'bg-blue-50'
    },
  };

  const { icon: Icon, iconClass, bgClass } = config[type] || config.tip;

  return (
    <div className={`flex gap-3 p-3 rounded-xl ${bgClass} mb-2`}>
      <Icon className={`w-5 h-5 ${iconClass} flex-shrink-0 mt-0.5`} />
      <span className="text-sm text-slate-700 leading-relaxed">
        {text}
      </span>
    </div>
  );
};


/**
 * Compact Audio Player for feedback view
 */
const CompactAudioPlayer = ({ audioUrl, externalAudioRef }) => {
  const internalRef = useRef(null);
  const audioRef = externalAudioRef || internalRef;
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!audioUrl) return;

    setIsLoading(true);
    setError(null);

    const audio = new Audio();
    audioRef.current = audio;

    // Enable preloading for better duration detection
    audio.preload = 'auto';

    const updateDuration = () => {
      const dur = audio.duration;
      if (dur && isFinite(dur) && dur > 0) {
        setDuration(dur);
      }
    };

    const handleLoadedMetadata = () => {
      updateDuration();
      setIsLoading(false);

      // For WebM/Opus files, duration might be Infinity initially
      // Try seeking to end to force browser to calculate duration
      if (!isFinite(audio.duration) || audio.duration === 0) {
        const savedTime = audio.currentTime;
        audio.currentTime = Number.MAX_SAFE_INTEGER;
        setTimeout(() => {
          updateDuration();
          audio.currentTime = savedTime;
        }, 100);
      }
    };

    const handleCanPlayThrough = () => {
      setIsLoading(false);
      updateDuration();
    };

    const handleDurationChange = () => {
      updateDuration();
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      // Also check duration on timeupdate in case it wasn't available before
      updateDuration();
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('canplaythrough', handleCanPlayThrough);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', () => setIsPlaying(true));
    audio.addEventListener('pause', () => setIsPlaying(false));
    audio.addEventListener('ended', () => setIsPlaying(false));
    audio.addEventListener('error', () => {
      setError('Audio nicht verfügbar');
      setIsLoading(false);
    });

    audio.src = audioUrl;
    audio.load();

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [audioUrl]);

  const togglePlay = () => {
    if (audioRef.current) {
      isPlaying ? audioRef.current.pause() : audioRef.current.play();
    }
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    if (audioRef.current && duration > 0) {
      audioRef.current.currentTime = percent * duration;
    }
  };

  const skip = (seconds) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(audioRef.current.currentTime + seconds, duration));
    }
  };

  if (!audioUrl) return null;

  if (error) {
    return (
      <div className="p-3 bg-slate-50 rounded-xl text-slate-500 text-sm flex items-center gap-2">
        <AlertCircle size={16} /> {error}
      </div>
    );
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="bg-slate-50 rounded-xl p-4">
      {/* Progress bar */}
      <div
        onClick={handleSeek}
        className="h-1.5 bg-slate-200 rounded-full cursor-pointer mb-3"
      >
        <div
          className="h-full bg-blue-500 rounded-full transition-all"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => skip(-10)}
          className="bg-transparent border-none cursor-pointer p-1.5 text-slate-500 hover:text-slate-700 flex items-center transition-colors"
        >
          <SkipBack size={20} />
        </button>

        <button
          onClick={togglePlay}
          disabled={isLoading}
          className={`w-11 h-11 rounded-full bg-blue-500 hover:bg-blue-600 border-none flex items-center justify-center text-white shadow-md transition-all ${
            isLoading ? 'cursor-wait opacity-70' : 'cursor-pointer'
          }`}
        >
          {isLoading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : isPlaying ? (
            <Pause size={20} fill="white" />
          ) : (
            <Play size={20} fill="white" className="ml-0.5" />
          )}
        </button>

        <button
          onClick={() => skip(10)}
          className="bg-transparent border-none cursor-pointer p-1.5 text-slate-500 hover:text-slate-700 flex items-center transition-colors"
        >
          <SkipForward size={20} />
        </button>
      </div>

      {/* Time display */}
      <div className="text-center mt-2 text-xs text-slate-500">
        {formatDuration(currentTime)} / {formatDuration(duration)}
      </div>
    </div>
  );
};

/**
 * Immediate Feedback Component
 *
 * Displays transcript, feedback, and audio metrics after each answer
 */
const ImmediateFeedback = ({
  transcript,
  feedback,
  audioMetrics,
  audioUrl,
  onRetry,
  onNext,
  onComplete,
  isLastQuestion,
  hideButtons = false,
}) => {
  const audioRef = useRef(null);

  // Parse feedback if it's a string
  const parsedFeedback = typeof feedback === 'string' ? JSON.parse(feedback) : feedback;

  // Normalize audio metrics for the professional panel
  const normalizedMetrics = useMemo(
    () => normalizeAudioMetrics(audioMetrics),
    [audioMetrics]
  );
  const showAudioAnalysis = hasAudioMetricsData(audioMetrics);

  // Handler to jump to timestamp in audio
  const handleJumpToTimestamp = (seconds) => {
    if (audioRef.current) {
      audioRef.current.currentTime = seconds;
      audioRef.current.play();
    }
  };

  return (
    <div className="bg-slate-50 rounded-2xl p-6 shadow-card">
      {/* Summary Header with softer blue gradient background */}
      <div className="flex items-start gap-5 mb-6 p-6 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-2xl shadow-lg">
        <ScoreBadge
          score={parsedFeedback?.scores?.overall}
          label="Gesamt"
          size="large"
          variant="white"
        />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-2">
            Feedback zu deiner Antwort
          </h3>
          <p className="text-sm text-blue-50 leading-relaxed">
            {parsedFeedback?.summary || 'Deine Antwort wurde analysiert.'}
          </p>
        </div>
      </div>

      {/* Score Breakdown */}
      {parsedFeedback?.scores && (
        <div className="flex justify-center gap-8 p-4 mb-4 bg-white rounded-2xl shadow-sm">
          <ScoreBadge score={parsedFeedback.scores.content} label="Inhalt" />
          <ScoreBadge score={parsedFeedback.scores.structure} label="Struktur" />
          <ScoreBadge score={parsedFeedback.scores.relevance} label="Relevanz" />
        </div>
      )}

      {/* Transcript */}
      <CollapsibleSection title="Transkript" icon={MessageSquare} defaultOpen={true}>
        <div className="p-4 rounded-xl bg-slate-50 italic text-slate-700 leading-relaxed text-sm">
          "{transcript || 'Keine Transkription verfügbar.'}"
        </div>
      </CollapsibleSection>

      {/* Audio Player - own section between transcript and strengths */}
      {audioUrl && (
        <CollapsibleSection title="Deine Aufnahme" icon={Volume2} defaultOpen={true}>
          <CompactAudioPlayer audioUrl={audioUrl} externalAudioRef={audioRef} />
        </CollapsibleSection>
      )}

      {/* Strengths */}
      {parsedFeedback?.strengths?.length > 0 && (
        <CollapsibleSection title="Stärken" icon={ThumbsUp} defaultOpen={true}>
          {parsedFeedback.strengths.map((strength, i) => (
            <FeedbackItem key={i} text={strength} type="strength" />
          ))}
        </CollapsibleSection>
      )}

      {/* Improvements */}
      {parsedFeedback?.improvements?.length > 0 && (
        <CollapsibleSection title="Verbesserungen" icon={AlertTriangle} defaultOpen={true}>
          {parsedFeedback.improvements.map((improvement, i) => (
            <FeedbackItem key={i} text={improvement} type="improvement" />
          ))}
        </CollapsibleSection>
      )}

      {/* Tips */}
      {parsedFeedback?.tips?.length > 0 && (
        <CollapsibleSection title="Tipps" icon={Lightbulb} defaultOpen={true}>
          {parsedFeedback.tips.map((tip, i) => (
            <FeedbackItem key={i} text={tip} type="tip" />
          ))}
        </CollapsibleSection>
      )}

      {/* Audio Metrics - Professional Panel */}
      {showAudioAnalysis && (
        <CollapsibleSection title="Sprechanalyse" icon={Mic} defaultOpen={true}>
          <AudioAnalysisPanel
            audioAnalysis={normalizedMetrics}
            onJumpToTimestamp={handleJumpToTimestamp}
          />
        </CollapsibleSection>
      )}

      {/* Action Buttons - only show when not hidden */}
      {!hideButtons && (
        <div className="flex gap-3 mt-6 justify-end flex-wrap">
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl border-2 border-slate-300 bg-white text-slate-700 text-sm font-semibold cursor-pointer transition-all hover:border-blue-500 hover:text-blue-600 shadow-sm"
            >
              <RotateCcw className="w-4 h-4" />
              Nochmal versuchen
            </button>
          )}

          {/* Nächste Frage / Training abschließen */}
          <button
            onClick={isLastQuestion ? onComplete : onNext}
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl border-none bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-semibold cursor-pointer shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
          >
            {isLastQuestion ? (
              <>
                <Trophy className="w-4 h-4" />
                Training abschließen
              </>
            ) : (
              <>
                Nächste Frage
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default ImmediateFeedback;
