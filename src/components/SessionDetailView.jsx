import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  Clock,
  Calendar,
  Award,
  Star,
  MessageSquare,
  User,
  Bot,
  Loader2,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Lightbulb,
  Target,
  Download,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  getRoleplaySessionAnalysis,
  getRoleplaySessionAudioUrl,
  getRoleplayScenario,
} from '@/services/roleplay-feedback-adapter';

console.log('📦 [SESSION_DETAIL] SessionDetailView module loaded');

const SessionDetailView = ({ session, onBack }) => {
  console.log('🏗️ [SESSION_DETAIL] SessionDetailView initialized with session:', session?.id);

  const [sessionData, setSessionData] = useState(session);
  const [scenario, setScenario] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Audio player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioError, setAudioError] = useState(null);
  const [isAudioLoading, setIsAudioLoading] = useState(true);

  // Transcript state
  const [showFullFeedback, setShowFullFeedback] = useState(false);
  const [activeTranscriptIndex, setActiveTranscriptIndex] = useState(-1);

  // Refs
  const audioRef = useRef(null);
  const progressRef = useRef(null);
  const transcriptContainerRef = useRef(null);

  // Parse feedback and transcript
  const parsedFeedback = useMemo(() => {
    if (!sessionData?.feedback_json) return null;
    try {
      let jsonString = sessionData.feedback_json;
      if (typeof jsonString === 'string') {
        jsonString = jsonString.trim();
        if (jsonString.startsWith('```json')) {
          jsonString = jsonString.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
        } else if (jsonString.startsWith('```')) {
          jsonString = jsonString.replace(/```\s*/g, '').replace(/```\s*$/g, '');
        }
        return JSON.parse(jsonString);
      }
      return jsonString;
    } catch (err) {
      console.error('Failed to parse feedback:', err);
      return null;
    }
  }, [sessionData?.feedback_json]);

  const parsedTranscript = useMemo(() => {
    if (!sessionData?.transcript) return [];
    try {
      let transcript = sessionData.transcript;
      if (typeof transcript === 'string') {
        transcript = JSON.parse(transcript);
      }
      return Array.isArray(transcript) ? transcript : [];
    } catch (err) {
      console.error('Failed to parse transcript:', err);
      return [];
    }
  }, [sessionData?.transcript]);

  // Timeline markers from feedback
  const timelineMarkers = useMemo(() => {
    if (!parsedFeedback?.timeline) return [];
    return parsedFeedback.timeline.map((marker) => ({
      ...marker,
      position: duration > 0 ? (marker.timestamp / duration) * 100 : 0,
    }));
  }, [parsedFeedback, duration]);

  // Load full session data
  useEffect(() => {
    loadSessionData();
  }, [session?.id]);

  const loadSessionData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load full session data
      const fullSession = await getRoleplaySessionAnalysis(session.id);
      setSessionData(fullSession);

      // Load scenario info
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

  // Initialize Audio Player
  useEffect(() => {
    if (!sessionData?.conversation_id) return;

    const audioUrl = getRoleplaySessionAudioUrl(sessionData.id);
    console.log('🎵 [SESSION_DETAIL] Initializing audio with URL:', audioUrl);

    setIsAudioLoading(true);
    setAudioError(null);

    // Create native audio element
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    // Event listeners
    audio.addEventListener('loadedmetadata', () => {
      console.log('✅ [SESSION_DETAIL] Audio loaded');
      setDuration(audio.duration);
      setIsAudioLoading(false);
    });

    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime);
    });

    audio.addEventListener('play', () => setIsPlaying(true));
    audio.addEventListener('pause', () => setIsPlaying(false));
    audio.addEventListener('ended', () => setIsPlaying(false));

    audio.addEventListener('error', (err) => {
      console.error('❌ [SESSION_DETAIL] Audio error:', err);
      setAudioError('Audio konnte nicht geladen werden. Möglicherweise ist die Aufnahme nicht verfügbar.');
      setIsAudioLoading(false);
    });

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [sessionData?.id, sessionData?.conversation_id]);

  // Update active transcript based on current time
  useEffect(() => {
    if (!parsedTranscript.length || !currentTime) return;

    // Find the transcript entry closest to current time
    let activeIndex = -1;
    for (let i = 0; i < parsedTranscript.length; i++) {
      const entry = parsedTranscript[i];
      const entryTime = entry.timestamp || 0;
      if (entryTime <= currentTime) {
        activeIndex = i;
      } else {
        break;
      }
    }

    if (activeIndex !== activeTranscriptIndex) {
      setActiveTranscriptIndex(activeIndex);

      // Scroll to active entry
      if (activeIndex >= 0 && transcriptContainerRef.current) {
        const activeElement = transcriptContainerRef.current.children[activeIndex];
        if (activeElement) {
          activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  }, [currentTime, parsedTranscript, activeTranscriptIndex]);

  // Audio controls
  const togglePlay = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  const skipTo = useCallback((seconds) => {
    if (audioRef.current) {
      const newTime = Math.max(0, Math.min(audioRef.current.currentTime + seconds, duration));
      audioRef.current.currentTime = newTime;
    }
  }, [duration]);

  const seekToTime = useCallback((time) => {
    if (audioRef.current && duration > 0) {
      audioRef.current.currentTime = time;
    }
  }, [duration]);

  const seekToTranscript = useCallback((index) => {
    const entry = parsedTranscript[index];
    if (entry?.timestamp !== undefined) {
      seekToTime(entry.timestamp);
    }
  }, [parsedTranscript, seekToTime]);

  // Handle progress bar click
  const handleProgressClick = useCallback((e) => {
    if (!progressRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    seekToTime(newTime);
  }, [duration, seekToTime]);

  // Format time
  const formatTime = (seconds) => {
    if (!seconds || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Render rating stars
  const renderRatingStars = (rating) => {
    const fullStars = Math.floor(rating);
    return (
      <div className="flex items-center gap-1">
        {[...Array(10)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < fullStars ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-2 text-sm font-semibold text-slate-700">{rating}/10</span>
      </div>
    );
  };

  // Get marker color
  const getMarkerColor = (type) => {
    switch (type) {
      case 'positive':
        return 'bg-green-500 hover:bg-green-600';
      case 'negative':
        return 'bg-red-500 hover:bg-red-600';
      case 'tip':
        return 'bg-blue-500 hover:bg-blue-600';
      default:
        return 'bg-slate-500 hover:bg-slate-600';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Gesprächsanalyse wird geladen...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 flex items-center justify-center">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 pb-8">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onBack} size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zurück
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-slate-900 truncate">
                {scenario?.title || `Session #${sessionData?.id}`}
              </h1>
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(sessionData?.created_at)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatTime(sessionData?.duration)}
                </span>
                {parsedFeedback?.rating?.overall && (
                  <span className="flex items-center gap-1 text-yellow-600">
                    <Star className="w-4 h-4 fill-yellow-400" />
                    {parsedFeedback.rating.overall}/10
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Audio Player & Transcript */}
          <div className="lg:col-span-2 space-y-6">
            {/* Audio Player Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-blue-600" />
                Gesprächsaufnahme
              </h2>

              {/* Progress Bar */}
              <div className="relative mb-4">
                {isAudioLoading && (
                  <div className="flex items-center justify-center bg-slate-100 rounded-lg py-8">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                  </div>
                )}
                {audioError && (
                  <div className="flex items-center justify-center bg-slate-100 rounded-lg py-6">
                    <div className="text-center px-4">
                      <AlertCircle className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                      <p className="text-sm text-slate-600">{audioError}</p>
                    </div>
                  </div>
                )}
                {!audioError && !isAudioLoading && (
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

                    {/* Timeline Markers */}
                    {timelineMarkers.length > 0 && (
                      <>
                        {timelineMarkers.map((marker, idx) => (
                          <button
                            key={idx}
                            onClick={(e) => {
                              e.stopPropagation();
                              seekToTime(marker.timestamp);
                            }}
                            className={`absolute top-1 w-3 h-3 rounded-full cursor-pointer transform -translate-x-1/2 transition-transform hover:scale-150 z-10 ${getMarkerColor(
                              marker.type
                            )}`}
                            style={{ left: `${marker.position}%` }}
                            title={marker.text}
                          />
                        ))}
                      </>
                    )}

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
                      onClick={() => skipTo(-10)}
                      disabled={isAudioLoading}
                    >
                      <SkipBack className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={togglePlay}
                      disabled={isAudioLoading}
                      className="w-12 h-12 rounded-full"
                    >
                      {isPlaying ? (
                        <Pause className="w-5 h-5" />
                      ) : (
                        <Play className="w-5 h-5 ml-0.5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => skipTo(10)}
                      disabled={isAudioLoading}
                    >
                      <SkipForward className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex-1 text-center text-sm text-slate-600">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </div>

                  <Button variant="ghost" size="icon" onClick={toggleMute} disabled={isAudioLoading}>
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </Button>
                </div>
              )}

              {/* Timeline Markers Legend */}
              {timelineMarkers.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-500 mb-2">Feedback-Marker (klicken zum Springen):</p>
                  <div className="flex flex-wrap gap-2">
                    {timelineMarkers.map((marker, idx) => (
                      <button
                        key={idx}
                        onClick={() => seekToTime(marker.timestamp)}
                        className={`px-3 py-1.5 rounded-lg text-xs text-white transition-opacity hover:opacity-80 ${getMarkerColor(
                          marker.type
                        )}`}
                      >
                        {formatTime(marker.timestamp)} - {marker.text?.substring(0, 30)}
                        {marker.text?.length > 30 ? '...' : ''}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Transcript Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                Gesprächsverlauf
              </h2>

              {parsedTranscript.length === 0 ? (
                <p className="text-slate-500 text-center py-8">Kein Transkript verfügbar.</p>
              ) : (
                <div
                  ref={transcriptContainerRef}
                  className="space-y-3 max-h-96 overflow-y-auto pr-2"
                >
                  {parsedTranscript.map((entry, idx) => {
                    const isActive = idx === activeTranscriptIndex;
                    const isAgent = entry.role === 'agent';

                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0.7 }}
                        animate={{
                          opacity: isActive ? 1 : 0.7,
                          scale: isActive ? 1 : 0.98,
                        }}
                        onClick={() => seekToTranscript(idx)}
                        className={`flex gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                          isActive
                            ? 'bg-blue-50 border-2 border-blue-200 shadow-sm'
                            : 'hover:bg-slate-50 border-2 border-transparent'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isAgent
                              ? 'bg-gradient-to-br from-purple-500 to-indigo-500'
                              : 'bg-gradient-to-br from-blue-500 to-teal-500'
                          }`}
                        >
                          {isAgent ? (
                            <Bot className="w-4 h-4 text-white" />
                          ) : (
                            <User className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold text-slate-600">
                              {isAgent ? 'Interviewer' : 'Du'}
                            </span>
                            {entry.timestamp !== undefined && (
                              <span className="text-xs text-slate-400">
                                {formatTime(entry.timestamp)}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-700 leading-relaxed">{entry.text}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>

          {/* Right Column - Feedback Summary */}
          <div className="space-y-6">
            {/* Overall Score */}
            {parsedFeedback?.rating && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-500" />
                  Bewertung
                </h2>

                <div className="space-y-4">
                  {parsedFeedback.rating.overall !== undefined && (
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Gesamt</p>
                      {renderRatingStars(parsedFeedback.rating.overall)}
                    </div>
                  )}
                  {parsedFeedback.rating.communication !== undefined && (
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Kommunikation</p>
                      {renderRatingStars(parsedFeedback.rating.communication)}
                    </div>
                  )}
                  {parsedFeedback.rating.professionalism !== undefined && (
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Professionalität</p>
                      {renderRatingStars(parsedFeedback.rating.professionalism)}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Summary */}
            {parsedFeedback?.summary && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-blue-50 rounded-2xl shadow-lg p-6 border-l-4 border-blue-500"
              >
                <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Gesamteindruck
                </h3>
                <p className="text-sm text-blue-800 leading-relaxed">{parsedFeedback.summary}</p>
              </motion.div>
            )}

            {/* Strengths */}
            {parsedFeedback?.strengths?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-green-50 rounded-2xl shadow-lg p-6 border-l-4 border-green-500"
              >
                <h3 className="text-sm font-semibold text-green-900 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Stärken
                </h3>
                <ul className="space-y-2">
                  {parsedFeedback.strengths.slice(0, 3).map((strength, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-green-800">
                      <span className="text-green-600 mt-0.5">•</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Improvements */}
            {parsedFeedback?.improvements?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-orange-50 rounded-2xl shadow-lg p-6 border-l-4 border-orange-500"
              >
                <h3 className="text-sm font-semibold text-orange-900 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Verbesserungen
                </h3>
                <ul className="space-y-2">
                  {parsedFeedback.improvements.slice(0, 3).map((improvement, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-orange-800">
                      <span className="text-orange-600 mt-0.5">•</span>
                      <span>{improvement}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Tips */}
            {parsedFeedback?.tips?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-indigo-50 rounded-2xl shadow-lg p-6 border-l-4 border-indigo-500"
              >
                <h3 className="text-sm font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  Tipps
                </h3>
                <ul className="space-y-2">
                  {parsedFeedback.tips.slice(0, 3).map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-indigo-800">
                      <Target className="w-3 h-3 text-indigo-600 mt-1 flex-shrink-0" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Show more button */}
            {parsedFeedback && (
              <Button
                variant="outline"
                onClick={() => setShowFullFeedback(!showFullFeedback)}
                className="w-full"
              >
                {showFullFeedback ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-2" />
                    Weniger anzeigen
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-2" />
                    Vollständiges Feedback
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Full Feedback Modal/Expanded Section */}
        <AnimatePresence>
          {showFullFeedback && parsedFeedback && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 bg-white rounded-2xl shadow-lg p-6 overflow-hidden"
            >
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Award className="w-6 h-6 text-blue-600" />
                Vollständiges Feedback
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* All Strengths */}
                {parsedFeedback.strengths?.length > 0 && (
                  <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg">
                    <h3 className="text-sm font-semibold text-green-900 mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Alle Stärken
                    </h3>
                    <ul className="space-y-2">
                      {parsedFeedback.strengths.map((strength, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-green-800">
                          <span className="text-green-600 mt-0.5">•</span>
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* All Improvements */}
                {parsedFeedback.improvements?.length > 0 && (
                  <div className="p-4 bg-orange-50 border-l-4 border-orange-500 rounded-r-lg">
                    <h3 className="text-sm font-semibold text-orange-900 mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Alle Verbesserungen
                    </h3>
                    <ul className="space-y-2">
                      {parsedFeedback.improvements.map((improvement, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-orange-800">
                          <span className="text-orange-600 mt-0.5">•</span>
                          <span>{improvement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* All Tips */}
                {parsedFeedback.tips?.length > 0 && (
                  <div className="p-4 bg-indigo-50 border-l-4 border-indigo-500 rounded-r-lg md:col-span-2">
                    <h3 className="text-sm font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4" />
                      Alle Tipps
                    </h3>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {parsedFeedback.tips.map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-indigo-800">
                          <Target className="w-3 h-3 text-indigo-600 mt-1 flex-shrink-0" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SessionDetailView;
