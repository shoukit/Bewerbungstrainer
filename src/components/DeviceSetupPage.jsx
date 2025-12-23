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
import { usePartner } from '@/context/PartnerContext';
import { DEFAULT_BRANDING } from '@/config/partners';
import { COLORS } from '@/config/colors';
import MicrophoneSelector from '@/components/MicrophoneSelector';
import { formatDuration } from '@/utils/formatting';
import MicrophoneTestDialog from '@/components/MicrophoneTestDialog';
import AudioVisualizer from '@/components/AudioVisualizer';

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
  primaryAccent,
  themedGradient,
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
    <div style={{ position: 'relative', marginBottom: '16px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
        {/* Dropdown button */}
        <button
          type="button"
          onClick={() => !isLoading && setIsOpen(!isOpen)}
          disabled={isLoading}
          style={{
            flex: '1 1 100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            padding: '14px 18px',
            borderRadius: '14px',
            border: `2px solid ${error ? COLORS.red[500] : COLORS.slate[200]}`,
            backgroundColor: error ? COLORS.red[50] : '#fff',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.6 : 1,
            transition: 'all 0.2s',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: error ? COLORS.red[100] : themedGradient,
            }}>
              {error ? (
                <AlertCircle style={{ width: '24px', height: '24px', color: COLORS.red[500] }} />
              ) : (
                <Icon style={{ width: '24px', height: '24px', color: '#fff' }} />
              )}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '13px', color: COLORS.slate[500], fontWeight: 500, marginBottom: '2px' }}>
                {label}
              </div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: error ? COLORS.red[600] : COLORS.slate[800] }}>
                {isLoading ? 'Lade...' : error ? error : selectedDevice ? getDeviceLabel(selectedDevice) : 'Bitte wählen'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {error && onRefresh && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onRefresh(); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: COLORS.slate[100],
                  cursor: 'pointer',
                }}
              >
                <RefreshCw style={{ width: '18px', height: '18px', color: COLORS.slate[600] }} />
              </button>
            )}
            <ChevronDown style={{
              width: '22px',
              height: '22px',
              color: COLORS.slate[400],
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
              transition: 'transform 0.2s',
            }} />
          </div>
        </button>
      </div>

      {/* Dropdown menu */}
      {isOpen && devices.length > 0 && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 40,
            }}
          />

          {/* Dropdown */}
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            backgroundColor: '#fff',
            borderRadius: '14px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
            border: `1px solid ${COLORS.slate[200]}`,
            zIndex: 50,
            overflow: 'hidden',
            maxHeight: '300px',
            overflowY: 'auto',
          }}>
            {devices.map((device, index) => (
              <button
                key={device.deviceId || index}
                type="button"
                onClick={() => handleSelect(device.deviceId)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  border: 'none',
                  backgroundColor: selectedDeviceId === device.deviceId ? `${primaryAccent}15` : 'transparent',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (selectedDeviceId !== device.deviceId) {
                    e.currentTarget.style.backgroundColor = COLORS.slate[50];
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = selectedDeviceId === device.deviceId ? `${primaryAccent}15` : 'transparent';
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: selectedDeviceId === device.deviceId ? primaryAccent : COLORS.slate[100],
                }}>
                  <Icon style={{
                    width: '20px',
                    height: '20px',
                    color: selectedDeviceId === device.deviceId ? '#fff' : COLORS.slate[500],
                  }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: selectedDeviceId === device.deviceId ? primaryAccent : COLORS.slate[800],
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {getDeviceLabel(device)}
                  </div>
                  {device.deviceId === 'default' && (
                    <div style={{ fontSize: '12px', color: COLORS.slate[400] }}>Systemstandard</div>
                  )}
                </div>
                {selectedDeviceId === device.deviceId && (
                  <CheckCircle style={{ width: '20px', height: '20px', color: primaryAccent }} />
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
const MicrophoneTest = ({ deviceId, primaryAccent }) => {
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
    <div style={{
      padding: '16px',
      backgroundColor: COLORS.slate[50],
      borderRadius: '12px',
      marginTop: '8px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
        {/* Record/Stop Button */}
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isPlaying}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            borderRadius: '10px',
            border: 'none',
            backgroundColor: isRecording ? COLORS.red[500] : primaryAccent,
            color: '#fff',
            fontSize: '14px',
            fontWeight: 600,
            cursor: isPlaying ? 'not-allowed' : 'pointer',
            opacity: isPlaying ? 0.6 : 1,
            transition: 'all 0.2s',
          }}
        >
          {isRecording ? (
            <>
              <Square style={{ width: '16px', height: '16px' }} />
              Stoppen ({formatDuration(recordingDuration)})
            </>
          ) : (
            <>
              <Mic style={{ width: '16px', height: '16px' }} />
              Aufnehmen
            </>
          )}
        </button>

        {/* Playback Button (only show when we have a recording) */}
        {recordedBlob && !isRecording && (
          <button
            type="button"
            onClick={isPlaying ? stopPlayback : playRecording}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              borderRadius: '10px',
              border: `2px solid ${primaryAccent}`,
              backgroundColor: isPlaying ? `${primaryAccent}15` : 'white',
              color: primaryAccent,
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {isPlaying ? (
              <>
                <Square style={{ width: '16px', height: '16px' }} />
                Stoppen
              </>
            ) : (
              <>
                <Play style={{ width: '16px', height: '16px' }} />
                Abspielen
              </>
            )}
          </button>
        )}

        {/* Status text */}
        {isRecording && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: COLORS.red[500], fontSize: '13px' }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: COLORS.red[500],
              animation: 'pulse 1s infinite',
            }} />
            Aufnahme läuft...
          </div>
        )}

        {isPlaying && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: COLORS.green[600], fontSize: '13px' }}>
            <Volume2 style={{ width: '16px', height: '16px' }} />
            Wiedergabe...
          </div>
        )}

        {recordedBlob && !isRecording && !isPlaying && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: COLORS.slate[500], fontSize: '13px' }}>
            <CheckCircle style={{ width: '16px', height: '16px', color: COLORS.green[500] }} />
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
        <p style={{
          margin: 0,
          fontSize: '13px',
          color: COLORS.slate[500],
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          <Volume2 style={{ width: '14px', height: '14px' }} />
          Nimm etwas auf und spiele es ab, um dein Mikrofon zu testen.
        </p>
      )}

      {/* CSS for pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
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
      <div style={{
        aspectRatio: '16/9',
        backgroundColor: COLORS.slate[100],
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: COLORS.slate[500],
        fontSize: '14px',
      }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{
      aspectRatio: '16/9',
      backgroundColor: COLORS.slate[900],
      borderRadius: '12px',
      overflow: 'hidden',
    }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: 'scaleX(-1)', // Mirror effect
        }}
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

  // Partner theming
  const { branding } = usePartner();
  const headerGradient = branding?.['--header-gradient'] || DEFAULT_BRANDING['--header-gradient'];
  const headerText = branding?.['--header-text'] || DEFAULT_BRANDING['--header-text'];
  const buttonGradient = branding?.['--button-gradient'] || headerGradient;
  const primaryAccent = branding?.['--primary-accent'] || DEFAULT_BRANDING['--primary-accent'];

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
    <div style={{ padding: '24px', paddingBottom: '200px', maxWidth: '640px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <button
          onClick={onBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            marginBottom: '16px',
            border: 'none',
            background: 'transparent',
            color: COLORS.slate[600],
            fontSize: '14px',
            cursor: 'pointer',
            borderRadius: '8px',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => e.target.style.background = COLORS.slate[100]}
          onMouseLeave={(e) => e.target.style.background = 'transparent'}
        >
          <ArrowLeft style={{ width: '18px', height: '18px' }} />
          Zurück
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '14px',
            background: headerGradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {HeaderIcon ? (
              <HeaderIcon style={{ width: '28px', height: '28px', color: headerText }} />
            ) : (
              <Mic style={{ width: '28px', height: '28px', color: headerText }} />
            )}
          </div>
          <div>
            <h1 style={{
              fontSize: '24px',
              fontWeight: 700,
              color: COLORS.slate[900],
              margin: 0,
            }}>
              {title || scenario?.title || 'Geräte einrichten'}
            </h1>
            <p style={{
              fontSize: '14px',
              color: COLORS.slate[600],
              margin: '4px 0 0 0',
            }}>
              {includeVideo ? 'Kamera und Mikrofon auswählen' : 'Mikrofon auswählen und testen'}
            </p>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {devicesLoading && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 24px',
          backgroundColor: COLORS.slate[50],
          borderRadius: '16px',
        }}>
          <Loader2 style={{ width: '32px', height: '32px', color: primaryAccent, marginBottom: '16px' }} className="animate-spin" />
          <p style={{ color: COLORS.slate[600], margin: 0 }}>Geräte werden geladen...</p>
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
            <div style={{
              padding: '24px',
              backgroundColor: 'white',
              borderRadius: '16px',
              border: `1px solid ${COLORS.slate[200]}`,
              marginBottom: '20px',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '16px',
              }}>
                <Camera style={{ width: '22px', height: '22px', color: primaryAccent }} />
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: COLORS.slate[900],
                  margin: 0,
                }}>
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
                primaryAccent={primaryAccent}
                themedGradient={headerGradient}
              />

              {/* Camera Preview */}
              {selectedCameraId && !cameraError && (
                <CameraPreview deviceId={selectedCameraId} />
              )}
            </div>
          )}

          {/* Microphone Section */}
          <div style={{
            padding: '24px',
            backgroundColor: 'white',
            borderRadius: '16px',
            border: `1px solid ${COLORS.slate[200]}`,
            marginBottom: '24px',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '16px',
            }}>
              <Mic style={{ width: '22px', height: '22px', color: primaryAccent }} />
              <h3 style={{
                fontSize: '16px',
                fontWeight: 600,
                color: COLORS.slate[900],
                margin: 0,
              }}>
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
            <div style={{ marginBottom: '24px' }}>
              {extraContent}
            </div>
          )}

          {/* Start Button */}
          <button
            onClick={handleStart}
            disabled={!canStart}
            style={{
              width: '100%',
              padding: '16px 24px',
              borderRadius: '14px',
              border: 'none',
              background: canStart ? buttonGradient : COLORS.slate[300],
              color: 'white',
              fontSize: '16px',
              fontWeight: 600,
              cursor: canStart ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: canStart ? `0 4px 12px ${primaryAccent}4d` : 'none',
            }}
            onMouseEnter={(e) => {
              if (canStart) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = `0 6px 16px ${primaryAccent}66`;
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'none';
              e.target.style.boxShadow = canStart ? `0 4px 12px ${primaryAccent}4d` : 'none';
            }}
          >
            {startButtonLabel}
            <ArrowRight style={{ width: '20px', height: '20px' }} />
          </button>
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
