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
import SessionSidebar from './SessionSidebar';

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

  // Sidebar state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Refs
  const audioRef = useRef(null);
  const progressRef = useRef(null);
  const transcriptContainerRef = useRef(null);
  const transcriptEndRef = useRef(null);
  const userSeekingRef = useRef(false); // Flag to prevent scrolling on user click

  // Parse feedback and transcript
  const parsedFeedback = useMemo(() => {
    console.log('📊 [SESSION_DETAIL] Parsing feedback_json:', sessionData?.feedback_json ? 'exists' : 'null');
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
        const parsed = JSON.parse(jsonString);
        console.log('✅ [SESSION_DETAIL] Feedback parsed successfully:', parsed);
        return parsed;
      }
      console.log('✅ [SESSION_DETAIL] Feedback already object:', jsonString);
      return jsonString;
    } catch (err) {
      console.error('❌ [SESSION_DETAIL] Failed to parse feedback:', err);
      console.error('❌ [SESSION_DETAIL] Raw feedback_json:', sessionData.feedback_json);
      return null;
    }
  }, [sessionData?.feedback_json]);

  // Parse audio analysis
  const parsedAudioAnalysis = useMemo(() => {
    console.log('📊 [SESSION_DETAIL] Parsing audio_analysis_json:', sessionData?.audio_analysis_json ? 'exists' : 'null');
    if (!sessionData?.audio_analysis_json) return null;
    try {
      let jsonString = sessionData.audio_analysis_json;
      if (typeof jsonString === 'string') {
        jsonString = jsonString.trim();
        if (jsonString.startsWith('```json')) {
          jsonString = jsonString.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
        } else if (jsonString.startsWith('```')) {
          jsonString = jsonString.replace(/```\s*/g, '').replace(/```\s*$/g, '');
        }
        const parsed = JSON.parse(jsonString);
        console.log('✅ [SESSION_DETAIL] Audio analysis parsed successfully:', parsed);
        return parsed;
      }
      console.log('✅ [SESSION_DETAIL] Audio analysis already object:', jsonString);
      return jsonString;
    } catch (err) {
      console.error('❌ [SESSION_DETAIL] Failed to parse audio analysis:', err);
      console.error('❌ [SESSION_DETAIL] Raw audio_analysis_json:', sessionData.audio_analysis_json);
      return null;
    }
  }, [sessionData?.audio_analysis_json]);

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

    // Get WordPress config for authentication
    const config = window.bewerbungstrainerConfig || { nonce: '' };

    // Fetch audio with authentication
    fetch(audioUrl, {
      method: 'GET',
      headers: {
        'X-WP-Nonce': config.nonce,
      },
      credentials: 'same-origin',
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.blob();
      })
      .then((blob) => {
        // Create object URL from blob
        const objectUrl = URL.createObjectURL(blob);
        const audio = new Audio(objectUrl);
        audioRef.current = audio;

        // Store object URL for cleanup
        audio._objectUrl = objectUrl;

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
          console.error('❌ [SESSION_DETAIL] Audio playback error:', err);
          setAudioError('Audio konnte nicht abgespielt werden.');
          setIsAudioLoading(false);
        });
      })
      .catch((err) => {
        console.error('❌ [SESSION_DETAIL] Audio fetch error:', err);
        setAudioError('Audio konnte nicht geladen werden. Möglicherweise ist die Aufnahme nicht verfügbar.');
        setIsAudioLoading(false);
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
  }, [sessionData?.id, sessionData?.conversation_id]);

  // Update active transcript based on current time
  useEffect(() => {
    if (!parsedTranscript.length || currentTime === undefined) return;

    // Find the transcript entry closest to current time (using elapsedTime in seconds)
    let activeIndex = -1;
    for (let i = 0; i < parsedTranscript.length; i++) {
      const entry = parsedTranscript[i];
      // Use elapsedTime (seconds from conversation start)
      const entryTime = entry.elapsedTime !== undefined ? entry.elapsedTime : 0;
      if (entryTime <= currentTime) {
        activeIndex = i;
      } else {
        break;
      }
    }

    if (activeIndex !== activeTranscriptIndex) {
      setActiveTranscriptIndex(activeIndex);

      // Only auto-scroll when audio is PLAYING (not when user clicks to seek)
      // This ensures the transcript box scrolls during playback but not on manual interaction
      if (isPlaying && activeIndex >= 0 && transcriptContainerRef.current) {
        const container = transcriptContainerRef.current;
        const activeElement = container.children[activeIndex];

        if (activeElement) {
          // Calculate if element is outside visible area of the container
          const containerRect = container.getBoundingClientRect();
          const elementRect = activeElement.getBoundingClientRect();

          // Only scroll if element is outside the visible area
          if (elementRect.top < containerRect.top || elementRect.bottom > containerRect.bottom) {
            // Scroll within container only (not the page)
            const scrollTop = activeElement.offsetTop - container.offsetTop - (container.clientHeight / 2) + (activeElement.clientHeight / 2);
            container.scrollTo({
              top: Math.max(0, scrollTop),
              behavior: 'smooth'
            });
          }
        }
      }
    }
  }, [currentTime, parsedTranscript, activeTranscriptIndex, isPlaying]);

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
    // Use elapsedTime for seeking (seconds from conversation start)
    if (entry?.elapsedTime !== undefined) {
      seekToTime(entry.elapsedTime);
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
                  className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scroll-smooth"
                >
                  {parsedTranscript.map((entry, idx) => {
                    const isActive = idx === activeTranscriptIndex;
                    const isAgent = entry.role === 'agent';
                    // Use timeLabel if available, otherwise format elapsedTime
                    const timeDisplay = entry.timeLabel || (entry.elapsedTime !== undefined
                      ? `${Math.floor(entry.elapsedTime / 60).toString().padStart(2, '0')}:${(entry.elapsedTime % 60).toString().padStart(2, '0')}`
                      : null);

                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0.8 }}
                        animate={{
                          opacity: isActive ? 1 : 0.8,
                        }}
                        onClick={() => {
                          // Use elapsedTime for seeking (seconds from start)
                          const seekTime = entry.elapsedTime !== undefined ? entry.elapsedTime : 0;
                          seekToTime(seekTime);
                        }}
                        className={`flex gap-2 cursor-pointer transition-all ${
                          entry.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                        } ${isActive ? 'scale-[1.01]' : 'hover:scale-[1.005]'}`}
                      >
                        {/* Avatar with Timestamp */}
                        <div className="flex flex-col items-center gap-1 flex-shrink-0">
                          {isAgent ? (
                            scenario?.interviewer_profile?.image_url ? (
                              <img
                                src={scenario.interviewer_profile.image_url}
                                alt={scenario.interviewer_profile.name || 'Interviewer'}
                                className="w-8 h-8 rounded-full object-cover shadow-sm border-2 border-blue-200"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm bg-gradient-to-br from-blue-500 to-blue-600">
                                <Bot className="w-4 h-4 text-white" />
                              </div>
                            )
                          ) : (
                            <>
                              <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm bg-gradient-to-br from-teal-500 to-teal-600">
                                <User className="w-4 h-4 text-white" />
                              </div>
                              {timeDisplay && (
                                <span className="text-[10px] font-mono text-slate-400">
                                  {timeDisplay}
                                </span>
                              )}
                            </>
                          )}
                        </div>

                        {/* Message Bubble */}
                        <div
                          className={`flex-1 px-3 py-2 rounded-xl shadow-sm transition-all ${
                            isAgent
                              ? 'bg-slate-50 border border-slate-200'
                              : 'bg-gradient-to-br from-teal-500 to-teal-600 text-white'
                          } ${isActive ? 'ring-2 ring-blue-400 ring-offset-1' : ''}`}
                        >
                          <p className={`text-xs leading-relaxed ${isAgent ? 'text-slate-700' : 'text-white'}`}>
                            {entry.text}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                  {/* Auto-scroll anchor */}
                  <div ref={transcriptEndRef} />
                </div>
              )}
            </motion.div>
          </div>

          {/* Right Column - Feedback Sidebar */}
          <div className={isSidebarCollapsed ? 'lg:col-span-1' : ''}>
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden sticky top-4">
              <SessionSidebar
                session={sessionData}
                scenario={scenario}
                feedback={parsedFeedback}
                audioAnalysis={parsedAudioAnalysis}
                coachingComments={[]}
                onRetry={() => {
                  // Navigate to retry the session
                  if (scenario) {
                    window.location.href = `?scenario=${scenario.id}`;
                  }
                }}
                onCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                isCollapsed={isSidebarCollapsed}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionDetailView;
