import React, { useState, useEffect } from 'react';
import { Settings, X, Mic, Video, RefreshCw, AlertCircle, Check } from 'lucide-react';
import { MicrophoneTest } from './DeviceSetupPage';
import { COLORS } from '@/config/colors';

/**
 * DeviceSettingsDialog Component
 *
 * A modal dialog for changing audio/video device settings during a session.
 * Supports both audio-only and audio+video modes.
 */
const DeviceSettingsDialog = ({
  isOpen,
  onClose,
  mode = 'audio', // 'audio' or 'audio-video'
  selectedMicrophoneId,
  onMicrophoneChange,
  selectedCameraId,
  onCameraChange,
}) => {
  const [audioDevices, setAudioDevices] = useState([]);
  const [videoDevices, setVideoDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Local state for pending changes
  const [pendingMicId, setPendingMicId] = useState(selectedMicrophoneId);
  const [pendingCameraId, setPendingCameraId] = useState(selectedCameraId);

  // Load devices when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadDevices();
      setPendingMicId(selectedMicrophoneId);
      setPendingCameraId(selectedCameraId);
    }
  }, [isOpen, selectedMicrophoneId, selectedCameraId]);

  const loadDevices = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Request permissions
      const constraints = mode === 'audio-video'
        ? { audio: true, video: true }
        : { audio: true };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      stream.getTracks().forEach(track => track.stop());

      // Enumerate devices
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = allDevices.filter(device => device.kind === 'audioinput');
      const videoInputs = allDevices.filter(device => device.kind === 'videoinput');

      setAudioDevices(audioInputs);
      if (mode === 'audio-video') {
        setVideoDevices(videoInputs);
      }
    } catch (err) {
      console.error('Error loading devices:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Zugriff auf Geräte verweigert');
      } else {
        setError('Fehler beim Laden der Geräte');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (pendingMicId !== selectedMicrophoneId) {
      onMicrophoneChange?.(pendingMicId);
    }
    if (mode === 'audio-video' && pendingCameraId !== selectedCameraId) {
      onCameraChange?.(pendingCameraId);
    }
    onClose();
  };

  const getDeviceLabel = (device, index, type) => {
    if (device.label) {
      let label = device.label;
      label = label.replace(/^Default - /, '');
      label = label.replace(/^Kommunikation - /, '');
      label = label.replace(/^Standard - /, '');
      if (label.length > 40) {
        label = label.substring(0, 37) + '...';
      }
      return label;
    }
    return type === 'audio' ? `Mikrofon ${index + 1}` : `Kamera ${index + 1}`;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/50 z-[1000]"
      />

      {/* Dialog */}
      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl w-[90%] max-w-[480px] max-h-[80vh] overflow-hidden shadow-xl z-[1001]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-brand-gradient px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-white">
            <Settings size={20} />
            <h3 className="m-0 text-base font-semibold">
              Geräte-Einstellungen
            </h3>
          </div>
          <button
            onClick={onClose}
            className="bg-white/20 border-0 rounded-md p-1.5 cursor-pointer flex items-center justify-center"
          >
            <X size={18} color="white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 max-h-[calc(80vh-140px)] overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-10 h-10 border-[3px] border-slate-200 border-t-primary rounded-full animate-spin mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Geräte werden geladen...</p>
            </div>
          ) : error ? (
            <div className="text-center py-6">
              <AlertCircle size={40} color={COLORS.red[500]} className="mb-3 mx-auto" />
              <p className="text-red-600 font-medium">{error}</p>
              <button
                onClick={loadDevices}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-md border border-slate-300 bg-white cursor-pointer text-sm text-slate-700"
              >
                <RefreshCw size={16} />
                Erneut versuchen
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {/* Microphone Selection */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2.5">
                  <Mic size={18} className="text-primary" />
                  Mikrofon
                </label>
                <div className="flex flex-col gap-1.5">
                  {audioDevices.map((device, index) => (
                    <button
                      key={device.deviceId || index}
                      onClick={() => setPendingMicId(device.deviceId)}
                      className={`flex items-center gap-3 px-3.5 py-3 rounded-md cursor-pointer text-left w-full transition-all duration-300 ${
                        pendingMicId === device.deviceId
                          ? 'border-2 border-primary bg-primary/10'
                          : 'border border-slate-200 bg-white'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 ${
                        pendingMicId === device.deviceId ? 'bg-primary' : 'bg-slate-100'
                      }`}>
                        <Mic
                          size={16}
                          color={pendingMicId === device.deviceId ? 'white' : COLORS.slate[500]}
                        />
                      </div>
                      <span className={`flex-1 text-sm ${
                        pendingMicId === device.deviceId ? 'text-primary font-medium' : 'text-slate-700'
                      }`}>
                        {getDeviceLabel(device, index, 'audio')}
                      </span>
                      {pendingMicId === device.deviceId && (
                        <Check size={18} className="text-primary" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Microphone Test */}
                {pendingMicId && (
                  <div className="mt-3">
                    <MicrophoneTest deviceId={pendingMicId} />
                  </div>
                )}
              </div>

              {/* Camera Selection (only for audio-video mode) */}
              {mode === 'audio-video' && videoDevices.length > 0 && (
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2.5">
                    <Video size={18} className="text-primary" />
                    Kamera
                  </label>
                  <div className="flex flex-col gap-1.5">
                    {videoDevices.map((device, index) => (
                      <button
                        key={device.deviceId || index}
                        onClick={() => setPendingCameraId(device.deviceId)}
                        className={`flex items-center gap-3 px-3.5 py-3 rounded-md cursor-pointer text-left w-full transition-all duration-300 ${
                          pendingCameraId === device.deviceId
                            ? 'border-2 border-primary bg-primary/10'
                            : 'border border-slate-200 bg-white'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 ${
                          pendingCameraId === device.deviceId ? 'bg-primary' : 'bg-slate-100'
                        }`}>
                          <Video
                            size={16}
                            color={pendingCameraId === device.deviceId ? 'white' : COLORS.slate[500]}
                          />
                        </div>
                        <span className={`flex-1 text-sm ${
                          pendingCameraId === device.deviceId ? 'text-primary font-medium' : 'text-slate-700'
                        }`}>
                          {getDeviceLabel(device, index, 'video')}
                        </span>
                        {pendingCameraId === device.deviceId && (
                          <Check size={18} className="text-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!isLoading && !error && (
          <div className="px-5 py-4 border-t border-slate-200 flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-md border border-slate-300 bg-white text-slate-600 text-sm font-medium cursor-pointer"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2.5 rounded-md border-0 bg-primary text-white text-sm font-semibold cursor-pointer"
            >
              Speichern
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default DeviceSettingsDialog;
