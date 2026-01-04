import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Video,
  Info,
  Target,
  Lightbulb,
  Mic,
  Camera,
  Clock,
  CheckCircle,
  MessageSquare,
  Settings,
  Sparkles,
  User,
  AlertCircle,
  ChevronDown,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/base/button';
import { Card } from '@/components/ui';
import MicrophoneSelector from '@/components/device-setup/MicrophoneSelector';
import MicrophoneTestDialog from '@/components/device-setup/MicrophoneTestDialog';

/**
 * Render text with **bold** markdown syntax
 */
const renderBoldText = (text) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

/**
 * Icon mapping for dynamic tip icons from backend
 */
const iconMap = {
  target: Target,
  clock: Clock,
  mic: Mic,
  camera: Camera,
  video: Video,
  'message-square': MessageSquare,
  lightbulb: Lightbulb,
  brain: Lightbulb,
  info: Info,
  settings: Settings,
  check: CheckCircle,
  sparkles: Sparkles,
  user: User,
  x: AlertCircle,
};

/**
 * Default tips for video training
 */
const defaultVideoTips = [
  { icon: 'camera', text: 'Schaue direkt in die Kamera für Augenkontakt.' },
  { icon: 'lightbulb', text: 'Achte auf gute Beleuchtung von vorne.' },
  { icon: 'target', text: 'Struktur: Wer → Was → Warum.' },
  { icon: 'mic', text: 'Sprich deutlich und in ruhigem Tempo.' },
];

/**
 * Device Selector Component
 */
const DeviceSelector = ({
  type,
  devices,
  selectedDeviceId,
  onDeviceChange,
  isLoading,
  error,
  onRefresh,
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

      {isOpen && devices.length > 0 && (
        <>
          <div onClick={() => setIsOpen(false)} className="fixed inset-0 z-40" />
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
 * Camera Preview Component
 */
const CameraPreview = ({ deviceId }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const startPreview = async () => {
      try {
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
 * VideoTrainingPreparationPage Component
 *
 * Shows description, device setup, and tips.
 * Then proceeds to variables (if needed) or directly to session.
 */
const VideoTrainingPreparationPage = ({
  scenario,
  onBack,
  onNext,
  hasVariables = false,
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

  const lastLoadTimeRef = useRef(0);
  const isLoadingRef = useRef(false);
  const selectedMicRef = useRef(null);
  const selectedCamRef = useRef(null);

  selectedMicRef.current = selectedMicrophoneId;
  selectedCamRef.current = selectedCameraId;

  // Load devices
  const loadDevices = useCallback(async (fromDeviceChange = false) => {
    if (isLoadingRef.current) return;

    if (fromDeviceChange) {
      const timeSinceLastLoad = Date.now() - lastLoadTimeRef.current;
      if (timeSinceLastLoad < 2000) return;
    }

    isLoadingRef.current = true;
    lastLoadTimeRef.current = Date.now();
    setDevicesLoading(true);
    setMicError(null);
    setCameraError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      stream.getTracks().forEach(track => track.stop());

      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = allDevices.filter(device => device.kind === 'audioinput');
      const videoInputs = allDevices.filter(device => device.kind === 'videoinput');

      if (audioInputs.length === 0) {
        setMicError('Kein Mikrofon gefunden');
        setAudioDevices([]);
      } else {
        setAudioDevices(audioInputs);
        if (!selectedMicRef.current) {
          const defaultMic = audioInputs.find(d => d.deviceId === 'default') || audioInputs[0];
          setSelectedMicrophoneId(defaultMic.deviceId);
        }
      }

      if (videoInputs.length === 0) {
        setCameraError('Keine Kamera gefunden');
        setVideoDevices([]);
      } else {
        setVideoDevices(videoInputs);
        if (!selectedCamRef.current) {
          const defaultCam = videoInputs.find(d => d.deviceId === 'default') || videoInputs[0];
          setSelectedCameraId(defaultCam.deviceId);
        }
      }
    } catch (err) {
      console.error('Error loading devices:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicError('Zugriff verweigert');
        setCameraError('Zugriff verweigert');
      } else if (err.name === 'NotFoundError') {
        setMicError('Kein Mikrofon gefunden');
        setCameraError('Keine Kamera gefunden');
      } else {
        setMicError('Fehler beim Laden');
        setCameraError('Fehler beim Laden');
      }
    } finally {
      setDevicesLoading(false);
      isLoadingRef.current = false;
      lastLoadTimeRef.current = Date.now();
    }
  }, []);

  useEffect(() => {
    loadDevices(false);

    let debounceTimer = null;
    const handleDeviceChange = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => loadDevices(true), 500);
    };
    navigator.mediaDevices?.addEventListener('devicechange', handleDeviceChange);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      navigator.mediaDevices?.removeEventListener('devicechange', handleDeviceChange);
    };
  }, [loadDevices]);

  const handleStart = () => {
    onNext({
      selectedMicrophoneId,
      selectedCameraId,
    });
  };

  const canStart = selectedMicrophoneId && !micError && selectedCameraId && !cameraError;

  // Get tips from scenario or use defaults
  const tips = scenario?.tips && Array.isArray(scenario.tips) && scenario.tips.length > 0
    ? scenario.tips
    : defaultVideoTips;

  return (
    <div className="p-6 md:p-8 pb-52 max-w-[700px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 bg-transparent border-none text-slate-500 cursor-pointer text-sm py-2 mb-4 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft size={18} />
          Zurück zur Übersicht
        </button>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-gradient flex items-center justify-center">
            <Video size={32} className="text-white" />
          </div>
          <div>
            <h1 className="text-[28px] font-bold text-slate-900 m-0">
              Vorbereitung
            </h1>
            <p className="text-base text-slate-500 m-0 mt-1">
              {scenario?.title}
            </p>
          </div>
        </div>
      </div>

      {/* 1. Long Description - "Deine Aufgabe" Card */}
      {scenario?.long_description && (
        <Card className="p-5 md:p-6 mb-6">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center flex-shrink-0">
              <Info className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 m-0 mb-2">
                Deine Aufgabe
              </h3>
              <div className="text-[15px] leading-relaxed text-slate-600 m-0 whitespace-pre-wrap">
                {renderBoldText(scenario.long_description)}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* 2. Tips Section */}
      {tips.length > 0 && (
        <Card className="p-5 md:p-6 mb-6">
          <div className="flex items-start gap-3.5 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 m-0">
                Tipps für dein Training
              </h3>
              <p className="text-sm text-slate-500 m-0 mt-0.5">
                Beachte diese Hinweise für optimale Ergebnisse
              </p>
            </div>
          </div>

          <div className="grid gap-3">
            {tips.map((tip, index) => {
              const IconComponent = iconMap[tip.icon] || iconMap[tip.icon?.toLowerCase()] || Lightbulb;
              return (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-xl bg-slate-50"
                >
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                    <IconComponent className="w-4 h-4 text-slate-600" />
                  </div>
                  <p className="text-sm text-slate-700 m-0 pt-1">
                    {tip.text || tip.description}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* 3. Device Setup Section */}
      {devicesLoading ? (
        <Card className="p-6 mb-6">
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-8 h-8 text-primary mb-4 animate-spin" />
            <p className="text-slate-600 m-0">Geräte werden geladen...</p>
          </div>
        </Card>
      ) : (
        <>
          {/* Camera Section */}
          <Card className="p-5 md:p-6 mb-5">
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

            {selectedCameraId && !cameraError && (
              <CameraPreview deviceId={selectedCameraId} />
            )}
          </Card>

          {/* Microphone Section */}
          <Card className="p-5 md:p-6 mb-6">
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
          </Card>
        </>
      )}

      {/* 4. Submit Button */}
      <Button
        onClick={handleStart}
        disabled={!canStart}
        size="lg"
        className="w-full gap-2.5"
      >
        {hasVariables ? 'Weiter zur Konfiguration' : 'Video-Training starten'}
        <ArrowRight className="w-5 h-5" />
      </Button>

      {/* Microphone Test Dialog */}
      <MicrophoneTestDialog
        isOpen={showMicTest}
        onClose={() => setShowMicTest(false)}
        deviceId={selectedMicrophoneId}
      />
    </div>
  );
};

export default VideoTrainingPreparationPage;
