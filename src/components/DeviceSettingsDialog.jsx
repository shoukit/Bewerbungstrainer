import React, { useState, useEffect } from 'react';
import { Settings, X, Mic, Video, RefreshCw, AlertCircle, Check } from 'lucide-react';
import { usePartner } from '@/context/PartnerContext';
import { DEFAULT_BRANDING } from '@/config/partners';
import { COLORS } from '@/config/colors';
import { MicrophoneTest } from './DeviceSetupPage';

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

  // Partner theming
  const { branding } = usePartner();
  const primaryAccent = branding?.['--primary-accent'] || DEFAULT_BRANDING['--primary-accent'];
  const headerGradient = branding?.['--header-gradient'] || DEFAULT_BRANDING['--header-gradient'];

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
          borderRadius: '16px',
          width: '90%',
          maxWidth: '480px',
          maxHeight: '80vh',
          overflow: 'hidden',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.2)',
          zIndex: 1001,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            background: headerGradient,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'white' }}>
            <Settings size={20} />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
              Geräte-Einstellungen
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '8px',
              padding: '6px',
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
        <div style={{ padding: '20px', maxHeight: 'calc(80vh - 140px)', overflowY: 'auto' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '32px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  border: `3px solid ${COLORS.slate[200]}`,
                  borderTopColor: primaryAccent,
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 12px',
                }}
              />
              <p style={{ color: COLORS.slate[500], fontSize: '14px' }}>Geräte werden geladen...</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '24px' }}>
              <AlertCircle size={40} color={COLORS.red[500]} style={{ marginBottom: '12px' }} />
              <p style={{ color: COLORS.red[600], fontWeight: 500 }}>{error}</p>
              <button
                onClick={loadDevices}
                style={{
                  marginTop: '16px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: `1px solid ${COLORS.slate[300]}`,
                  background: 'white',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: COLORS.slate[700],
                }}
              >
                <RefreshCw size={16} />
                Erneut versuchen
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Microphone Selection */}
              <div>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: COLORS.slate[700],
                    marginBottom: '10px',
                  }}
                >
                  <Mic size={18} color={primaryAccent} />
                  Mikrofon
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {audioDevices.map((device, index) => (
                    <button
                      key={device.deviceId || index}
                      onClick={() => setPendingMicId(device.deviceId)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        border: pendingMicId === device.deviceId
                          ? `2px solid ${primaryAccent}`
                          : `1px solid ${COLORS.slate[200]}`,
                        background: pendingMicId === device.deviceId
                          ? `${primaryAccent}10`
                          : 'white',
                        cursor: 'pointer',
                        textAlign: 'left',
                        width: '100%',
                        transition: 'all 0.15s',
                      }}
                    >
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: pendingMicId === device.deviceId ? primaryAccent : COLORS.slate[100],
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
                          fontSize: '14px',
                          color: pendingMicId === device.deviceId ? primaryAccent : COLORS.slate[700],
                          fontWeight: pendingMicId === device.deviceId ? 500 : 400,
                        }}
                      >
                        {getDeviceLabel(device, index, 'audio')}
                      </span>
                      {pendingMicId === device.deviceId && (
                        <Check size={18} color={primaryAccent} />
                      )}
                    </button>
                  ))}
                </div>

                {/* Microphone Test */}
                {pendingMicId && (
                  <div style={{ marginTop: '12px' }}>
                    <MicrophoneTest deviceId={pendingMicId} primaryAccent={primaryAccent} />
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
                      gap: '8px',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: COLORS.slate[700],
                      marginBottom: '10px',
                    }}
                  >
                    <Video size={18} color={primaryAccent} />
                    Kamera
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {videoDevices.map((device, index) => (
                      <button
                        key={device.deviceId || index}
                        onClick={() => setPendingCameraId(device.deviceId)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px 14px',
                          borderRadius: '10px',
                          border: pendingCameraId === device.deviceId
                            ? `2px solid ${primaryAccent}`
                            : `1px solid ${COLORS.slate[200]}`,
                          background: pendingCameraId === device.deviceId
                            ? `${primaryAccent}10`
                            : 'white',
                          cursor: 'pointer',
                          textAlign: 'left',
                          width: '100%',
                          transition: 'all 0.15s',
                        }}
                      >
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: pendingCameraId === device.deviceId ? primaryAccent : COLORS.slate[100],
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
                            fontSize: '14px',
                            color: pendingCameraId === device.deviceId ? primaryAccent : COLORS.slate[700],
                            fontWeight: pendingCameraId === device.deviceId ? 500 : 400,
                          }}
                        >
                          {getDeviceLabel(device, index, 'video')}
                        </span>
                        {pendingCameraId === device.deviceId && (
                          <Check size={18} color={primaryAccent} />
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
              padding: '16px 20px',
              borderTop: `1px solid ${COLORS.slate[200]}`,
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
            }}
          >
            <button
              onClick={onClose}
              style={{
                padding: '10px 20px',
                borderRadius: '10px',
                border: `1px solid ${COLORS.slate[300]}`,
                background: 'white',
                color: COLORS.slate[600],
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Abbrechen
            </button>
            <button
              onClick={handleSave}
              style={{
                padding: '10px 20px',
                borderRadius: '10px',
                border: 'none',
                background: primaryAccent,
                color: 'white',
                fontSize: '14px',
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
