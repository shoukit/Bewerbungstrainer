import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Mic,
  Camera,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  RefreshCw,
  Play,
  Square,
  Volume2,
  Loader2,
} from 'lucide-react';
import { useBranding } from '@/hooks/useBranding';
import MicrophoneSelector from './MicrophoneSelector';
import { formatDuration } from '@/utils/formatting';
import MicrophoneTestDialog from './MicrophoneTestDialog';
import AudioVisualizer from '@/components/ui/composite/AudioVisualizer';

/**
 * DeviceSelector - Reusable component for selecting audio/video devices
 */
const DeviceSelector = ({
  type, // 'audio' or 'video'
  devices,
  selectedDeviceId,
  onDeviceChange,
  isLoading,
  error,
  onRefresh,
  branding, // useBranding() object
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const Icon = type === 'video' ? Camera : Mic;
  const label = type === 'video' ? 'Kamera' : 'Mikrofon';

  const getDeviceLabel = (device) => {
    if (device.label) {
      let lbl = device.label;
      lbl = lbl.replace(/^Default - /, '');
      lbl = lbl.replace(/^Kommunikation - /, '');
      lbl = lbl.replace(/^Standard - /, '');
      if (lbl.length > 40) {
        lbl = lbl.substring(0, 37) + '...';
      }
      return lbl;
    }
    return `${label} ${devices.indexOf(device) + 1}`;
  };

  const selectedDevice = devices.find(d => d.deviceId === selectedDeviceId);

  const handleSelect = (deviceId) => {
    onDeviceChange?.(deviceId);
    setIsOpen(false);
  };

  return (
    <div className="relative mb-4">
      <div className="flex flex-wrap gap-3">
        {/* Dropdown button */}
        <button
          type="button"
          onClick={() => !isLoading && setIsOpen(!isOpen)}
          disabled={isLoading}
          className={`flex-1 flex items-center justify-between gap-3 px-[18px] py-3.5 rounded-[14px] border-2 transition-all duration-200 ${
            error ? 'border-red-500 bg-red-50' : 'border-slate-200 bg-white'
          } ${isLoading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
        >
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              error ? 'bg-red-50' : 'bg-brand-gradient'
            }`}>
              {error ? (
                <AlertCircle className="w-6 h-6 text-red-500" />
              ) : (
                <Icon className="w-6 h-6 text-white" />
              )}
            </div>
            <div className="text-left">
              <div className="text-[13px] text-slate-500 font-medium mb-0.5">
                {label}
              </div>
              <div className={`text-[15px] font-semibold ${error ? 'text-red-700' : 'text-slate-900'}`}>
                {isLoading ? 'Lade...' : error ? error : selectedDevice ? getDeviceLabel(selectedDevice) : 'Bitte wählen'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {error && onRefresh && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onRefresh(); }}
                className="flex items-center justify-center p-2 rounded-lg border-0 bg-slate-50 cursor-pointer"
              >
                <RefreshCw className="w-[18px] h-[18px] text-slate-600" />
              </button>
            )}
            <ChevronDown className={`w-[22px] h-[22px] text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : 'rotate-0'
            }`} />
          </div>
        </button>
      </div>

      {/* Dropdown menu */}
      {isOpen && devices.length > 0 && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-40"
          />

          {/* Dropdown */}
          <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white rounded-[14px] shadow-[0_10px_40px_rgba(0,0,0,0.15)] border border-slate-200 z-50 overflow-hidden max-h-[300px] overflow-y-auto">
            {devices.map((device, index) => (
              <button
                key={device.deviceId || index}
                type="button"
                onClick={() => handleSelect(device.deviceId)}
                className={`w-full py-3.5 px-4 text-left flex items-center gap-3 border-0 cursor-pointer transition-colors duration-150 ${
                  selectedDeviceId === device.deviceId ? 'bg-primary/10' : 'bg-transparent hover:bg-slate-50'
                }`}
              >
                <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center ${
                  selectedDeviceId === device.deviceId ? 'bg-primary' : 'bg-slate-50'
                }`}>
                  <Icon className={`w-5 h-5 ${
                    selectedDeviceId === device.deviceId ? 'text-white' : 'text-slate-400'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium overflow-hidden text-ellipsis whitespace-nowrap ${
                    selectedDeviceId === device.deviceId ? 'text-primary' : 'text-slate-900'
                  }`}>
                    {getDeviceLabel(device)}
                  </div>
                  {device.deviceId === 'default' && (
                    <div className="text-xs text-slate-400">Systemstandard</div>
                  )}
                </div>
                {selectedDeviceId === device.deviceId && (
                  <CheckCircle className="w-5 h-5 text-primary" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

/**
 * MicrophoneTest - Component to test microphone with audio visualization and recording playback
 */
const MicrophoneTest = ({ deviceId }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const streamRef = useRef(null);
  const analyserRef = useRef(null);
  const animationRef = useRef(null);
  const audioContextRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const audioRef = useRef(null);
  const durationIntervalRef = useRef(null);

  const startRecording = async () => {
    try {
      // Clear previous recording
      setRecordedBlob(null);
      setRecordingDuration(0);
      chunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: deviceId ? { deviceId: { exact: deviceId } } : true,
      });
      streamRef.current = stream;

      // Set up audio context for visualization
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Set up MediaRecorder for recording
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Start duration counter
      const startTime = Date.now();
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 100);

      // Start audio level visualization
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setAudioLevel(Math.min(100, (average / 128) * 100));
        animationRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();
    } catch (err) {
      console.error('Error starting recording:', err);
    }
  };

  const stopRecording = () => {
    // Stop duration counter
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    // Stop animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    // Stop MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    // Stop stream tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setIsRecording(false);
    setAudioLevel(0);
  };

  const playRecording = () => {
    if (!recordedBlob) return;

    const audioUrl = URL.createObjectURL(recordedBlob);
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.onplay = () => setIsPlaying(true);
    audio.onended = () => {
      setIsPlaying(false);
      URL.revokeObjectURL(audioUrl);
    };
    audio.onerror = () => {
      setIsPlaying(false);
      URL.revokeObjectURL(audioUrl);
    };

    audio.play();
  };

  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsPlaying(false);
  };

  const clearRecording = () => {
    stopPlayback();
    setRecordedBlob(null);
    setRecordingDuration(0);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      stopPlayback();
    };
  }, []);

  // Stop recording when device changes
  useEffect(() => {
    if (isRecording) {
      stopRecording();
    }
    // Clear previous recording when device changes
    clearRecording();
  }, [deviceId]);


  return (
    <div className="p-4 bg-slate-50 rounded-xl mt-2">
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        {/* Record/Stop Button */}
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isPlaying}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-[10px] border-0 text-white text-sm font-semibold transition-all duration-200 ${
            isRecording ? 'bg-red-500' : 'bg-primary'
          } ${isPlaying ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
        >
          {isRecording ? (
            <>
              <Square className="w-4 h-4" />
              Stoppen ({formatDuration(recordingDuration)})
            </>
          ) : (
            <>
              <Mic className="w-4 h-4" />
              Aufnehmen
            </>
          )}
        </button>

        {/* Playback Button (only show when we have a recording) */}
        {recordedBlob && !isRecording && (
          <button
            type="button"
            onClick={isPlaying ? stopPlayback : playRecording}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-[10px] border-2 border-primary text-primary text-sm font-semibold cursor-pointer transition-all duration-200 ${
              isPlaying ? 'bg-primary/10' : 'bg-white'
            }`}
          >
            {isPlaying ? (
              <>
                <Square className="w-4 h-4" />
                Stoppen
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Abspielen
              </>
            )}
          </button>
        )}

        {/* Status text */}
        {isRecording && (
          <div className="flex items-center gap-2 text-red-500 text-[13px]">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Aufnahme läuft...
          </div>
        )}

        {isPlaying && (
          <div className="flex items-center gap-2 text-green-700 text-[13px]">
            <Volume2 className="w-4 h-4" />
            Wiedergabe...
          </div>
        )}

        {recordedBlob && !isRecording && !isPlaying && (
          <div className="flex items-center gap-2 text-slate-500 text-[13px]">
            <CheckCircle className="w-4 h-4 text-green-500" />
            Aufnahme bereit ({formatDuration(recordingDuration)})
          </div>
        )}
      </div>

      {/* Audio Level Visualization (only show when recording) */}
      {isRecording && (
        <AudioVisualizer
          audioLevel={audioLevel / 100}
          isActive={true}
          variant="bars"
          size="sm"
        />
      )}

      {/* Instructions */}
      {!isRecording && !recordedBlob && (
        <p className="m-0 text-[13px] text-slate-500 flex items-center gap-1.5">
          <Volume2 className="w-3.5 h-3.5" />
          Nimm etwas auf und spiele es ab, um dein Mikrofon zu testen.
        </p>
      )}
    </div>
  );
};

/**
 * CameraPreview - Component to preview camera feed
 */
const CameraPreview = ({ deviceId }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const startPreview = async () => {
      try {
        // Stop existing stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: deviceId ? { deviceId: { exact: deviceId } } : true,
        });
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setError(null);
      } catch (err) {
        console.error('Error starting camera preview:', err);
        setError('Kamera-Vorschau nicht verfügbar');
      }
    };

    if (deviceId) {
      startPreview();
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [deviceId]);

  if (error) {
    return (
      <div className="aspect-video bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="aspect-video bg-slate-900 rounded-xl overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover scale-x-[-1]"
      />
    </div>
  );
};

/**
 * DeviceSetupPage - Unified device setup page for all training types
 *
 * @param {Object} props
 * @param {'audio'|'audio-video'} props.mode - 'audio' for mic only, 'audio-video' for mic + camera
 * @param {Object} props.scenario - The selected scenario
 * @param {Function} props.onBack - Called when user clicks back
 * @param {Function} props.onStart - Called when user clicks start with { selectedMicrophoneId, selectedCameraId }
 * @param {string} props.title - Page title (optional, defaults to scenario.title)
 * @param {string} props.startButtonLabel - Label for start button (optional)
 * @param {React.ReactNode} props.icon - Icon component for header (optional)
 */
const DeviceSetupPage = ({
  mode = 'audio',
  scenario,
  onBack,
  onStart,
  title,
  startButtonLabel = 'Training starten',
  icon: HeaderIcon,
  extraContent = null, // Additional content to render before start button
  disabled = false, // External disabled state
}) => {
  // Mobile detection
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Device state
  const [audioDevices, setAudioDevices] = useState([]);
  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedMicrophoneId, setSelectedMicrophoneId] = useState(null);
  const [selectedCameraId, setSelectedCameraId] = useState(null);
  const [devicesLoading, setDevicesLoading] = useState(true);
  const [micError, setMicError] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [showMicTest, setShowMicTest] = useState(false);

  // Track when we last loaded devices to prevent loops on iPad Chrome
  const lastLoadTimeRef = useRef(0);
  const isLoadingRef = useRef(false);
  // Use refs to track selected devices without causing useCallback recreation
  const selectedMicRef = useRef(null);
  const selectedCamRef = useRef(null);

  // Partner theming via useBranding hook
  const b = useBranding();

  const includeVideo = mode === 'audio-video';

  // Keep refs in sync with state
  selectedMicRef.current = selectedMicrophoneId;
  selectedCamRef.current = selectedCameraId;

  // Load devices - use refs to avoid recreating callback when device IDs change
  const loadDevices = useCallback(async (fromDeviceChange = false) => {
    // Prevent re-entrancy and ignore devicechange events triggered by our own getUserMedia
    if (isLoadingRef.current) return;

    // If this is from a devicechange event, check if it's too soon after last load
    // iPad Chrome triggers devicechange when getUserMedia is called
    if (fromDeviceChange) {
      const timeSinceLastLoad = Date.now() - lastLoadTimeRef.current;
      if (timeSinceLastLoad < 2000) {
        return; // Ignore devicechange events within 2 seconds of last load
      }
    }

    isLoadingRef.current = true;
    lastLoadTimeRef.current = Date.now();
    setDevicesLoading(true);
    setMicError(null);
    if (includeVideo) setCameraError(null);

    try {
      // Request permissions
      const constraints = { audio: true };
      if (includeVideo) constraints.video = true;

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      stream.getTracks().forEach(track => track.stop());

      // Enumerate devices
      const allDevices = await navigator.mediaDevices.enumerateDevices();

      // Debug logging to help diagnose device recognition issues
      console.log('[DeviceSetupPage] All detected devices:', allDevices.map(d => ({
        kind: d.kind,
        label: d.label || '(no label)',
        deviceId: d.deviceId?.substring(0, 8) + '...'
      })));

      const audioInputs = allDevices.filter(device => device.kind === 'audioinput');
      const videoInputs = allDevices.filter(device => device.kind === 'videoinput');

      console.log('[DeviceSetupPage] Audio inputs:', audioInputs.length, 'Video inputs:', videoInputs.length);

      // Set audio devices
      if (audioInputs.length === 0) {
        console.warn('[DeviceSetupPage] No audioinput devices found');
        setMicError('Kein Mikrofon gefunden');
        setAudioDevices([]);
      } else {
        setAudioDevices(audioInputs);
        // Use ref to check current value without dependency
        if (!selectedMicRef.current) {
          const defaultMic = audioInputs.find(d => d.deviceId === 'default') || audioInputs[0];
          setSelectedMicrophoneId(defaultMic.deviceId);
        }
      }

      // Set video devices (if mode includes video)
      if (includeVideo) {
        if (videoInputs.length === 0) {
          setCameraError('Keine Kamera gefunden');
          setVideoDevices([]);
        } else {
          setVideoDevices(videoInputs);
          // Use ref to check current value without dependency
          if (!selectedCamRef.current) {
            const defaultCam = videoInputs.find(d => d.deviceId === 'default') || videoInputs[0];
            setSelectedCameraId(defaultCam.deviceId);
          }
        }
      }
    } catch (err) {
      console.error('Error loading devices:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicError('Zugriff verweigert');
        if (includeVideo) setCameraError('Zugriff verweigert');
      } else if (err.name === 'NotFoundError') {
        setMicError('Kein Mikrofon gefunden');
        if (includeVideo) setCameraError('Keine Kamera gefunden');
      } else {
        setMicError('Fehler beim Laden');
        if (includeVideo) setCameraError('Fehler beim Laden');
      }
    } finally {
      setDevicesLoading(false);
      isLoadingRef.current = false;
      lastLoadTimeRef.current = Date.now(); // Update again after completion
    }
  }, [includeVideo]); // Only depend on includeVideo which doesn't change

  useEffect(() => {
    loadDevices(false);

    // Handle device changes (e.g., plugging in a new microphone)
    // Use debounce + time check to prevent loops on iPad Chrome
    let debounceTimer = null;
    const handleDeviceChange = () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(() => {
        loadDevices(true); // Mark as from devicechange event
      }, 500);
    };
    navigator.mediaDevices?.addEventListener('devicechange', handleDeviceChange);

    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      navigator.mediaDevices?.removeEventListener('devicechange', handleDeviceChange);
    };
  }, []);

  // Handle start
  const handleStart = () => {
    onStart({
      selectedMicrophoneId,
      selectedCameraId: includeVideo ? selectedCameraId : null,
    });
  };

  // Check if can start
  const canStart = selectedMicrophoneId && !micError && (!includeVideo || (selectedCameraId && !cameraError)) && !disabled;

  return (
    <div className={`p-6 max-w-[640px] mx-auto ${isMobile ? 'pb-[120px]' : 'pb-10'}`}>
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-2 mb-4 border-0 bg-transparent text-slate-600 text-sm cursor-pointer rounded-lg hover:bg-slate-50 transition-colors duration-200"
        >
          <ArrowLeft className="w-[18px] h-[18px]" />
          Zurück
        </button>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-[14px] bg-brand-gradient flex items-center justify-center">
            {HeaderIcon ? (
              <HeaderIcon className="w-7 h-7 text-white" />
            ) : (
              <Mic className="w-7 h-7 text-white" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 m-0">
              {title || scenario?.title || 'Geräte einrichten'}
            </h1>
            <p className="text-sm text-slate-600 mt-1 mb-0">
              {includeVideo ? 'Kamera und Mikrofon auswählen' : 'Mikrofon auswählen und testen'}
            </p>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {devicesLoading && (
        <div className="flex flex-col items-center justify-center py-12 px-6 bg-slate-50 rounded-2xl">
          <Loader2 className="w-8 h-8 text-primary mb-4 animate-spin" />
          <p className="text-slate-600 m-0">Geräte werden geladen...</p>
        </div>
      )}

      {/* Device Selection */}
      {!devicesLoading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Camera Section (if video mode) */}
          {includeVideo && (
            <div className="p-6 bg-white rounded-2xl border border-slate-200 mb-5">
              <div className="flex items-center gap-2.5 mb-4">
                <Camera className="w-[22px] h-[22px] text-primary" />
                <h3 className="text-base font-semibold text-slate-900 m-0">
                  Kamera auswählen
                </h3>
              </div>

              <DeviceSelector
                type="video"
                devices={videoDevices}
                selectedDeviceId={selectedCameraId}
                onDeviceChange={setSelectedCameraId}
                isLoading={devicesLoading}
                error={cameraError}
                onRefresh={loadDevices}
              />

              {/* Camera Preview */}
              {selectedCameraId && !cameraError && (
                <CameraPreview deviceId={selectedCameraId} />
              )}
            </div>
          )}

          {/* Microphone Section */}
          <div className="p-6 bg-white rounded-2xl border border-slate-200 mb-6">
            <div className="flex items-center gap-2.5 mb-4">
              <Mic className="w-[22px] h-[22px] text-primary" />
              <h3 className="text-base font-semibold text-slate-900 m-0">
                Mikrofon testen
              </h3>
            </div>

            <MicrophoneSelector
              selectedDeviceId={selectedMicrophoneId}
              onDeviceChange={setSelectedMicrophoneId}
              onTestClick={() => setShowMicTest(true)}
            />
          </div>

          {/* Extra Content (e.g., connection mode selector) */}
          {extraContent && (
            <div className="mb-6">
              {extraContent}
            </div>
          )}

          {/* Start Button - Fixed on mobile for visibility */}
          <div
            className={isMobile ? 'fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white/95 to-transparent z-[100]' : ''}
          >
            <button
              onClick={handleStart}
              disabled={!canStart}
              className={`w-full px-6 py-4 rounded-[14px] border-0 text-white text-base font-semibold flex items-center justify-center gap-2.5 transition-all duration-200 ${
                canStart
                  ? 'bg-brand-gradient cursor-pointer shadow-[0_4px_12px_rgba(var(--primary-rgb),0.3)] hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(var(--primary-rgb),0.4)]'
                  : 'bg-slate-300 cursor-not-allowed shadow-none'
              }`}
            >
              {startButtonLabel}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Microphone Test Dialog */}
      <MicrophoneTestDialog
        isOpen={showMicTest}
        onClose={() => setShowMicTest(false)}
        deviceId={selectedMicrophoneId}
      />
    </div>
  );
};

export default DeviceSetupPage;
export { MicrophoneTest };
