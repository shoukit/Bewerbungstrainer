import React, { useState, useEffect } from 'react';
import { Mic, ChevronDown, AlertCircle, RefreshCw } from 'lucide-react';
import { usePartner } from '@/context/PartnerContext';
import { DEFAULT_BRANDING } from '@/config/partners';

/**
 * Fallback theme colors
 */
const COLORS = {
  slate: { 50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1', 400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155', 800: '#1e293b', 900: '#0f172a' },
  red: { 50: '#fef2f2', 100: '#fee2e2', 500: '#ef4444', 600: '#dc2626' },
  white: '#ffffff',
};

/**
 * MicrophoneSelector Component
 *
 * A dropdown component for selecting audio input devices (microphones).
 * Includes device enumeration, selection persistence, and a test button.
 */
const MicrophoneSelector = ({
  selectedDeviceId,
  onDeviceChange,
  onTestClick,
  disabled = false,
}) => {
  const [devices, setDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  // Partner theming
  const { branding } = usePartner();
  const headerGradient = branding?.['--header-gradient'] || DEFAULT_BRANDING['--header-gradient'];
  const headerText = branding?.['--header-text'] || DEFAULT_BRANDING['--header-text'];
  const primaryAccent = branding?.['--primary-accent'] || DEFAULT_BRANDING['--primary-accent'];
  const primaryAccentLight = branding?.['--primary-accent-light'] || DEFAULT_BRANDING['--primary-accent-light'];

  /**
   * Request microphone permission and enumerate devices
   */
  const loadDevices = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // First request permission to access microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());

      // Now enumerate devices with labels
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = allDevices.filter(device => device.kind === 'audioinput');

      if (audioInputs.length === 0) {
        setError('Kein Mikrofon gefunden');
        setDevices([]);
      } else {
        setDevices(audioInputs);

        if (!selectedDeviceId && audioInputs.length > 0) {
          const defaultDevice = audioInputs.find(d => d.deviceId === 'default') || audioInputs[0];
          onDeviceChange?.(defaultDevice.deviceId);
        }
      }
    } catch (err) {
      console.error('Error loading microphone devices:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Mikrofonzugriff verweigert');
      } else if (err.name === 'NotFoundError') {
        setError('Kein Mikrofon gefunden');
      } else {
        setError('Fehler beim Laden der Mikrofone');
      }
      setDevices([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDevices();

    const handleDeviceChange = () => loadDevices();
    navigator.mediaDevices?.addEventListener('devicechange', handleDeviceChange);

    return () => {
      navigator.mediaDevices?.removeEventListener('devicechange', handleDeviceChange);
    };
  }, []);

  const getDeviceLabel = (device) => {
    if (device.label) {
      let label = device.label;
      label = label.replace(/^Default - /, '');
      label = label.replace(/^Kommunikation - /, '');
      label = label.replace(/^Standard - /, '');
      if (label.length > 35) {
        label = label.substring(0, 32) + '...';
      }
      return label;
    }
    return `Mikrofon ${devices.indexOf(device) + 1}`;
  };

  const handleSelect = (deviceId) => {
    onDeviceChange?.(deviceId);
    setIsOpen(false);
  };

  const selectedDevice = devices.find(d => d.deviceId === selectedDeviceId);

  return (
    <div style={{ position: 'relative' }}>
      {/* Main selector row */}
      <div style={{ display: 'flex', gap: '12px' }}>
        {/* Dropdown button */}
        <button
          onClick={() => !disabled && !isLoading && setIsOpen(!isOpen)}
          disabled={disabled || isLoading}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            padding: '12px 16px',
            borderRadius: '12px',
            border: `2px solid ${error ? COLORS.red[500] : COLORS.slate[200]}`,
            backgroundColor: error ? COLORS.red[50] : COLORS.white,
            cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
            opacity: disabled || isLoading ? 0.6 : 1,
            transition: 'all 0.2s',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: error ? COLORS.red[100] : headerGradient,
            }}>
              {error ? (
                <AlertCircle style={{ width: '22px', height: '22px', color: COLORS.red[500] }} />
              ) : (
                <Mic style={{ width: '22px', height: '22px', color: headerText }} />
              )}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '12px', color: COLORS.slate[500], fontWeight: 500, marginBottom: '2px' }}>
                Mikrofon
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: error ? COLORS.red[600] : COLORS.slate[800] }}>
                {isLoading ? 'Lade...' : error ? error : selectedDevice ? getDeviceLabel(selectedDevice) : 'Bitte wählen'}
              </div>
            </div>
          </div>
          <ChevronDown style={{
            width: '20px',
            height: '20px',
            color: COLORS.slate[400],
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 0.2s',
          }} />
        </button>

        {/* Test button */}
        {onTestClick && !error && (
          <button
            onClick={onTestClick}
            disabled={disabled || isLoading || !selectedDeviceId}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              borderRadius: '12px',
              border: `2px solid ${COLORS.slate[200]}`,
              backgroundColor: COLORS.white,
              cursor: disabled || isLoading || !selectedDeviceId ? 'not-allowed' : 'pointer',
              opacity: disabled || isLoading || !selectedDeviceId ? 0.5 : 1,
              transition: 'all 0.2s',
            }}
          >
            <Mic style={{ width: '18px', height: '18px', color: primaryAccent }} />
            <span style={{ fontSize: '14px', fontWeight: 600, color: COLORS.slate[700] }}>Testen</span>
          </button>
        )}

        {/* Refresh button on error */}
        {error && (
          <button
            onClick={loadDevices}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '12px 16px',
              borderRadius: '12px',
              border: `2px solid ${COLORS.slate[200]}`,
              backgroundColor: COLORS.white,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <RefreshCw style={{ width: '20px', height: '20px', color: COLORS.slate[600] }} />
          </button>
        )}
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
            backgroundColor: COLORS.white,
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
            border: `1px solid ${COLORS.slate[200]}`,
            zIndex: 50,
            overflow: 'hidden',
            maxHeight: '280px',
            overflowY: 'auto',
          }}>
            {devices.map((device, index) => (
              <button
                key={device.deviceId || index}
                onClick={() => handleSelect(device.deviceId)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  border: 'none',
                  backgroundColor: selectedDeviceId === device.deviceId ? primaryAccentLight : 'transparent',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (selectedDeviceId !== device.deviceId) {
                    e.currentTarget.style.backgroundColor = COLORS.slate[50];
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = selectedDeviceId === device.deviceId ? primaryAccentLight : 'transparent';
                }}
              >
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: selectedDeviceId === device.deviceId ? primaryAccent : COLORS.slate[100],
                }}>
                  <Mic style={{
                    width: '18px',
                    height: '18px',
                    color: selectedDeviceId === device.deviceId ? COLORS.white : COLORS.slate[500],
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
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: primaryAccent,
                  }} />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default MicrophoneSelector;
