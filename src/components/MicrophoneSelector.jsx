import React, { useState, useEffect, useRef } from 'react';
import { Mic, ChevronDown, AlertCircle, RefreshCw } from 'lucide-react';
import { usePartner } from '@/context/PartnerContext';
import { DEFAULT_BRANDING } from '@/config/partners';
import { COLORS } from '@/config/colors';

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

  // Track when we last loaded devices to prevent loops on iPad Chrome
  const lastLoadTimeRef = useRef(0);
  const isLoadingRef = useRef(false);

  // Partner theming
  const { branding } = usePartner();
  const headerGradient = branding?.['--header-gradient'] || DEFAULT_BRANDING['--header-gradient'];
  const headerText = branding?.['--header-text'] || DEFAULT_BRANDING['--header-text'];
  const primaryAccent = branding?.['--primary-accent'] || DEFAULT_BRANDING['--primary-accent'];
  const primaryAccentLight = branding?.['--primary-accent-light'] || DEFAULT_BRANDING['--primary-accent-light'];

  /**
   * Request microphone permission and enumerate devices
   */
  const loadDevices = async (fromDeviceChange = false) => {
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
    setIsLoading(true);
    setError(null);

    try {
      // First request permission to access microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());

      // Now enumerate devices with labels
      const allDevices = await navigator.mediaDevices.enumerateDevices();

      // Debug logging to help diagnose device recognition issues
      console.log('[MicrophoneSelector] All detected devices:', allDevices.map(d => ({
        kind: d.kind,
        label: d.label || '(no label)',
        deviceId: d.deviceId?.substring(0, 8) + '...'
      })));

      const audioInputs = allDevices.filter(device => device.kind === 'audioinput');

      console.log('[MicrophoneSelector] Audio input devices:', audioInputs.length, audioInputs.map(d => d.label || d.deviceId?.substring(0, 8)));

      if (audioInputs.length === 0) {
        console.warn('[MicrophoneSelector] No audioinput devices found. All device kinds:',
          [...new Set(allDevices.map(d => d.kind))]);
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
      isLoadingRef.current = false;
      lastLoadTimeRef.current = Date.now(); // Update again after completion
    }
  };

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
    <div className="microphone-selector" style={{ position: 'relative' }}>
      {/* Main selector row - wraps on small screens */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
        {/* Dropdown button */}
        <button
          type="button"
          onClick={() => !disabled && !isLoading && setIsOpen(!isOpen)}
          disabled={disabled || isLoading}
          style={{
            flex: '1 1 250px',
            minWidth: '200px',
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
            type="button"
            onClick={onTestClick}
            disabled={disabled || isLoading || !selectedDeviceId}
            style={{
              flex: '0 0 auto',
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
              whiteSpace: 'nowrap',
            }}
          >
            <Mic style={{ width: '18px', height: '18px', color: primaryAccent }} />
            <span style={{ fontSize: '14px', fontWeight: 600, color: COLORS.slate[700] }}>Testen</span>
          </button>
        )}

        {/* Refresh button - always visible to allow device refresh */}
        <button
          type="button"
          onClick={() => loadDevices(false)}
          disabled={isLoading}
          title="Geräteliste aktualisieren"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px 16px',
            borderRadius: '12px',
            border: `2px solid ${COLORS.slate[200]}`,
            backgroundColor: COLORS.white,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.5 : 1,
            transition: 'all 0.2s',
          }}
        >
          <RefreshCw style={{
            width: '20px',
            height: '20px',
            color: COLORS.slate[600],
            animation: isLoading ? 'spin 1s linear infinite' : 'none',
          }} />
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
                type="button"
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

      {/* Helper text when devices are loaded but user might have issues */}
      {!error && devices.length > 0 && devices.length < 3 && (
        <div style={{
          marginTop: '10px',
          fontSize: '12px',
          color: COLORS.slate[500],
          lineHeight: 1.4,
        }}>
          Dein Headset wird nicht angezeigt? Klicke auf "Aktualisieren" nach dem Anschließen oder prüfe die Bluetooth-Verbindung (Headset-Modus statt Audio-Modus).
        </div>
      )}

      {/* Troubleshooting hint when no microphone found */}
      {error === 'Kein Mikrofon gefunden' && (
        <div style={{
          marginTop: '12px',
          padding: '12px 14px',
          backgroundColor: COLORS.amber[50],
          border: `1px solid ${COLORS.amber[200]}`,
          borderRadius: '10px',
          fontSize: '13px',
          color: COLORS.amber[800],
          lineHeight: 1.5,
        }}>
          <div style={{ fontWeight: 600, marginBottom: '6px' }}>
            💡 Tipps zur Fehlerbehebung:
          </div>
          <ul style={{ margin: 0, paddingLeft: '18px' }}>
            <li>Bei <strong>Bluetooth-Headsets</strong>: Stelle sicher, dass das Headset im "Headset"- oder "Hands-Free"-Modus verbunden ist (nicht nur "Audio")</li>
            <li>Bei <strong>USB-Headsets</strong>: Trenne das Gerät kurz und schließe es erneut an</li>
            <li>Prüfe die <strong>Systemeinstellungen</strong> deines Computers, ob das Mikrofon dort erkannt wird</li>
            <li>Versuche einen anderen <strong>Browser</strong> (Chrome/Edge empfohlen)</li>
          </ul>
        </div>
      )}

      {/* Hint for permission denied */}
      {error === 'Mikrofonzugriff verweigert' && (
        <div style={{
          marginTop: '12px',
          padding: '12px 14px',
          backgroundColor: COLORS.amber[50],
          border: `1px solid ${COLORS.amber[200]}`,
          borderRadius: '10px',
          fontSize: '13px',
          color: COLORS.amber[800],
          lineHeight: 1.5,
        }}>
          <div style={{ fontWeight: 600, marginBottom: '6px' }}>
            💡 So erlaubst du den Mikrofonzugriff:
          </div>
          <ul style={{ margin: 0, paddingLeft: '18px' }}>
            <li>Klicke auf das <strong>Schloss-Symbol</strong> in der Adressleiste deines Browsers</li>
            <li>Setze "Mikrofon" auf <strong>"Zulassen"</strong></li>
            <li>Lade die Seite neu und versuche es erneut</li>
          </ul>
        </div>
      )}

      {/* CSS for spin animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default MicrophoneSelector;
