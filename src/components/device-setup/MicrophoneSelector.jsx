import React, { useState, useEffect, useRef } from 'react';
import { Mic, ChevronDown, AlertCircle, RefreshCw } from 'lucide-react';

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
    <div className="microphone-selector relative">
      {/* Main selector row - wraps on small screens */}
      <div className="flex flex-wrap gap-3">
        {/* Dropdown button */}
        <button
          type="button"
          onClick={() => !disabled && !isLoading && setIsOpen(!isOpen)}
          disabled={disabled || isLoading}
          className={`flex-1 min-w-[200px] flex items-center justify-between gap-3 px-4 py-3 rounded-lg border-2 transition-all duration-300 ${
            error ? 'border-red-500 bg-red-50' : 'border-slate-200 bg-white'
          } ${disabled || isLoading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-md flex items-center justify-center ${
              error ? 'bg-red-100' : 'bg-brand-gradient'
            }`}>
              {error ? (
                <AlertCircle className="w-[22px] h-[22px] text-red-500" />
              ) : (
                <Mic className="w-[22px] h-[22px] text-white" />
              )}
            </div>
            <div className="text-left">
              <div className="text-xs text-slate-500 font-medium mb-0.5">
                Mikrofon
              </div>
              <div className={`text-base font-semibold ${error ? 'text-red-600' : 'text-slate-800'}`}>
                {isLoading ? 'Lade...' : error ? error : selectedDevice ? getDeviceLabel(selectedDevice) : 'Bitte wählen'}
              </div>
            </div>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
          />
        </button>

        {/* Test button */}
        {onTestClick && !error && (
          <button
            type="button"
            onClick={onTestClick}
            disabled={disabled || isLoading || !selectedDeviceId}
            className={`flex-none flex items-center gap-2 px-5 py-3 rounded-lg border-2 border-slate-200 bg-white whitespace-nowrap transition-all duration-300 ${
              disabled || isLoading || !selectedDeviceId ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
            }`}
          >
            <Mic className="w-[18px] h-[18px] text-primary" />
            <span className="text-base font-semibold text-slate-700">Testen</span>
          </button>
        )}

        {/* Refresh button - always visible to allow device refresh */}
        <button
          type="button"
          onClick={() => loadDevices(false)}
          disabled={isLoading}
          title="Geräteliste aktualisieren"
          className={`flex items-center justify-center px-4 py-3 rounded-lg border-2 border-slate-200 bg-white transition-all duration-300 ${
            isLoading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
          }`}
        >
          <RefreshCw className={`w-5 h-5 text-slate-600 ${isLoading ? 'animate-spin' : ''}`} />
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
          <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white rounded-lg shadow-lg border border-slate-200 z-50 overflow-hidden max-h-[280px] overflow-y-auto">
            {devices.map((device, index) => (
              <button
                type="button"
                key={device.deviceId || index}
                onClick={() => handleSelect(device.deviceId)}
                className={`w-full py-3.5 px-4 text-left flex items-center gap-3 border-0 cursor-pointer transition-colors duration-150 ${
                  selectedDeviceId === device.deviceId ? 'bg-primary/10' : 'bg-transparent hover:bg-slate-50'
                }`}
              >
                <div className={`w-9 h-9 rounded-sm flex items-center justify-center ${
                  selectedDeviceId === device.deviceId ? 'bg-primary' : 'bg-slate-100'
                }`}>
                  <Mic className={`w-[18px] h-[18px] ${
                    selectedDeviceId === device.deviceId ? 'text-white' : 'text-slate-500'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-base font-medium overflow-hidden text-ellipsis whitespace-nowrap ${
                    selectedDeviceId === device.deviceId ? 'text-primary' : 'text-slate-800'
                  }`}>
                    {getDeviceLabel(device)}
                  </div>
                  {device.deviceId === 'default' && (
                    <div className="text-xs text-slate-400">Systemstandard</div>
                  )}
                </div>
                {selectedDeviceId === device.deviceId && (
                  <div className="w-2 h-2 rounded-full bg-primary" />
                )}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Helper text when devices are loaded but user might have issues */}
      {!error && devices.length > 0 && devices.length < 3 && (
        <div className="mt-2.5 text-xs text-slate-500 leading-normal">
          Dein Headset wird nicht angezeigt? Klicke auf "Aktualisieren" nach dem Anschließen oder prüfe die Bluetooth-Verbindung (Headset-Modus statt Audio-Modus).
        </div>
      )}

      {/* Troubleshooting hint when no microphone found */}
      {error === 'Kein Mikrofon gefunden' && (
        <div className="mt-3 px-3.5 py-3 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-800 leading-relaxed">
          <div className="font-semibold mb-1.5">
            💡 Tipps zur Fehlerbehebung:
          </div>
          <ul className="m-0 pl-[18px]">
            <li>Bei <strong>Bluetooth-Headsets</strong>: Stelle sicher, dass das Headset im "Headset"- oder "Hands-Free"-Modus verbunden ist (nicht nur "Audio")</li>
            <li>Bei <strong>USB-Headsets</strong>: Trenne das Gerät kurz und schließe es erneut an</li>
            <li>Prüfe die <strong>Systemeinstellungen</strong> deines Computers, ob das Mikrofon dort erkannt wird</li>
            <li>Versuche einen anderen <strong>Browser</strong> (Chrome/Edge empfohlen)</li>
          </ul>
        </div>
      )}

      {/* Hint for permission denied */}
      {error === 'Mikrofonzugriff verweigert' && (
        <div className="mt-3 px-3.5 py-3 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-800 leading-relaxed">
          <div className="font-semibold mb-1.5">
            💡 So erlaubst du den Mikrofonzugriff:
          </div>
          <ul className="m-0 pl-[18px]">
            <li>Klicke auf das <strong>Schloss-Symbol</strong> in der Adressleiste deines Browsers</li>
            <li>Setze "Mikrofon" auf <strong>"Zulassen"</strong></li>
            <li>Lade die Seite neu und versuche es erneut</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default MicrophoneSelector;
