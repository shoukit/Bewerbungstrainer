import React, { useState, useEffect } from 'react';
import { Settings, X, Mic, Video, RefreshCw, AlertCircle, Check } from 'lucide-react';
import { COLORS } from '@/config/colors';
import { MicrophoneTest } from './DeviceSetupPage';
import { useBranding } from '@/hooks/useBranding';

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

  // Get branding object
  const b = useBranding();

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
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
        }}
      />

      {/* Dialog */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'white',
          borderRadius: b.radius.xl,
          width: '90%',
          maxWidth: '480px',
          maxHeight: '80vh',
          overflow: 'hidden',
          boxShadow: b.shadow.xl,
          zIndex: 1001,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            background: b.headerGradient,
            padding: `${b.space['4']} ${b.space['5']}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: b.space['2.5'], color: 'white' }}>
            <Settings size={20} />
            <h3 style={{ margin: 0, fontSize: b.fontSize.base, fontWeight: 600 }}>
              Geräte-Einstellungen
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: b.radius.md,
              padding: b.space['1.5'],
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} color="white" />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: b.space['5'], maxHeight: 'calc(80vh - 140px)', overflowY: 'auto' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: b.space['8'] }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  border: `3px solid ${COLORS.slate[200]}`,
                  borderTopColor: b.primaryAccent,
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: `0 auto ${b.space['3']}`,
                }}
              />
              <p style={{ color: COLORS.slate[500], fontSize: b.fontSize.sm }}>Geräte werden geladen...</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: b.space['6'] }}>
              <AlertCircle size={40} color={COLORS.red[500]} style={{ marginBottom: b.space['3'] }} />
              <p style={{ color: COLORS.red[600], fontWeight: 500 }}>{error}</p>
              <button
                onClick={loadDevices}
                style={{
                  marginTop: b.space['4'],
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: b.space['2'],
                  padding: `${b.space['2.5']} ${b.space['4']}`,
                  borderRadius: b.radius.md,
                  border: `1px solid ${COLORS.slate[300]}`,
                  background: 'white',
                  cursor: 'pointer',
                  fontSize: b.fontSize.sm,
                  color: COLORS.slate[700],
                }}
              >
                <RefreshCw size={16} />
                Erneut versuchen
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: b.space['5'] }}>
              {/* Microphone Selection */}
              <div>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: b.space['2'],
                    fontSize: b.fontSize.sm,
                    fontWeight: 600,
                    color: COLORS.slate[700],
                    marginBottom: b.space['2.5'],
                  }}
                >
                  <Mic size={18} color={b.primaryAccent} />
                  Mikrofon
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: b.space['1.5'] }}>
                  {audioDevices.map((device, index) => (
                    <button
                      key={device.deviceId || index}
                      onClick={() => setPendingMicId(device.deviceId)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: b.space['3'],
                        padding: `${b.space['3']} ${b.space['3.5']}`,
                        borderRadius: b.radius.md,
                        border: pendingMicId === device.deviceId
                          ? `2px solid ${b.primaryAccent}`
                          : `1px solid ${COLORS.slate[200]}`,
                        background: pendingMicId === device.deviceId
                          ? `${b.primaryAccent}10`
                          : 'white',
                        cursor: 'pointer',
                        textAlign: 'left',
                        width: '100%',
                        transition: b.transition.normal,
                      }}
                    >
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: b.radius.md,
                          background: pendingMicId === device.deviceId ? b.primaryAccent : COLORS.slate[100],
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Mic
                          size={16}
                          color={pendingMicId === device.deviceId ? 'white' : COLORS.slate[500]}
                        />
                      </div>
                      <span
                        style={{
                          flex: 1,
                          fontSize: b.fontSize.sm,
                          color: pendingMicId === device.deviceId ? b.primaryAccent : COLORS.slate[700],
                          fontWeight: pendingMicId === device.deviceId ? 500 : 400,
                        }}
                      >
                        {getDeviceLabel(device, index, 'audio')}
                      </span>
                      {pendingMicId === device.deviceId && (
                        <Check size={18} color={b.primaryAccent} />
                      )}
                    </button>
                  ))}
                </div>

                {/* Microphone Test */}
                {pendingMicId && (
                  <div style={{ marginTop: b.space['3'] }}>
                    <MicrophoneTest deviceId={pendingMicId} branding={b} />
                  </div>
                )}
              </div>

              {/* Camera Selection (only for audio-video mode) */}
              {mode === 'audio-video' && videoDevices.length > 0 && (
                <div>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: b.space['2'],
                      fontSize: b.fontSize.sm,
                      fontWeight: 600,
                      color: COLORS.slate[700],
                      marginBottom: b.space['2.5'],
                    }}
                  >
                    <Video size={18} color={b.primaryAccent} />
                    Kamera
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: b.space['1.5'] }}>
                    {videoDevices.map((device, index) => (
                      <button
                        key={device.deviceId || index}
                        onClick={() => setPendingCameraId(device.deviceId)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: b.space['3'],
                          padding: `${b.space['3']} ${b.space['3.5']}`,
                          borderRadius: b.radius.md,
                          border: pendingCameraId === device.deviceId
                            ? `2px solid ${b.primaryAccent}`
                            : `1px solid ${COLORS.slate[200]}`,
                          background: pendingCameraId === device.deviceId
                            ? `${b.primaryAccent}10`
                            : 'white',
                          cursor: 'pointer',
                          textAlign: 'left',
                          width: '100%',
                          transition: b.transition.normal,
                        }}
                      >
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: b.radius.md,
                            background: pendingCameraId === device.deviceId ? b.primaryAccent : COLORS.slate[100],
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Video
                            size={16}
                            color={pendingCameraId === device.deviceId ? 'white' : COLORS.slate[500]}
                          />
                        </div>
                        <span
                          style={{
                            flex: 1,
                            fontSize: b.fontSize.sm,
                            color: pendingCameraId === device.deviceId ? b.primaryAccent : COLORS.slate[700],
                            fontWeight: pendingCameraId === device.deviceId ? 500 : 400,
                          }}
                        >
                          {getDeviceLabel(device, index, 'video')}
                        </span>
                        {pendingCameraId === device.deviceId && (
                          <Check size={18} color={b.primaryAccent} />
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
          <div
            style={{
              padding: `${b.space['4']} ${b.space['5']}`,
              borderTop: `1px solid ${COLORS.slate[200]}`,
              display: 'flex',
              gap: b.space['3'],
              justifyContent: 'flex-end',
            }}
          >
            <button
              onClick={onClose}
              style={{
                padding: `${b.space['2.5']} ${b.space['5']}`,
                borderRadius: b.radius.md,
                border: `1px solid ${COLORS.slate[300]}`,
                background: 'white',
                color: COLORS.slate[600],
                fontSize: b.fontSize.sm,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Abbrechen
            </button>
            <button
              onClick={handleSave}
              style={{
                padding: `${b.space['2.5']} ${b.space['5']}`,
                borderRadius: b.radius.md,
                border: 'none',
                background: b.primaryAccent,
                color: 'white',
                fontSize: b.fontSize.sm,
                fontWeight: 600,
                cursor: 'pointer',
              }}
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
