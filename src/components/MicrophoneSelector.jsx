import React, { useState, useEffect } from 'react';
import { Mic, ChevronDown, Settings2, AlertCircle, RefreshCw } from 'lucide-react';

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
  compact = false,
  className = ''
}) => {
  const [devices, setDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  /**
   * Request microphone permission and enumerate devices
   */
  const loadDevices = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // First request permission to access microphone
      // This is needed to get device labels
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Stop the stream immediately - we just needed permission
      stream.getTracks().forEach(track => track.stop());

      // Now enumerate devices with labels
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = allDevices.filter(device => device.kind === 'audioinput');

      if (audioInputs.length === 0) {
        setError('Kein Mikrofon gefunden');
        setDevices([]);
      } else {
        setDevices(audioInputs);

        // If no device is selected, select the first one or default
        if (!selectedDeviceId && audioInputs.length > 0) {
          // Find default device or use first one
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

  // Load devices on mount
  useEffect(() => {
    loadDevices();

    // Listen for device changes
    const handleDeviceChange = () => {
      loadDevices();
    };

    navigator.mediaDevices?.addEventListener('devicechange', handleDeviceChange);

    return () => {
      navigator.mediaDevices?.removeEventListener('devicechange', handleDeviceChange);
    };
  }, []);

  /**
   * Get display name for a device
   */
  const getDeviceLabel = (device) => {
    if (device.label) {
      // Clean up common device label patterns
      let label = device.label;
      // Remove common prefixes
      label = label.replace(/^Default - /, '');
      label = label.replace(/^Kommunikation - /, '');
      // Truncate if too long
      if (label.length > 40) {
        label = label.substring(0, 37) + '...';
      }
      return label;
    }
    return `Mikrofon ${devices.indexOf(device) + 1}`;
  };

  /**
   * Handle device selection
   */
  const handleSelect = (deviceId) => {
    onDeviceChange?.(deviceId);
    setIsOpen(false);
  };

  // Get currently selected device
  const selectedDevice = devices.find(d => d.deviceId === selectedDeviceId);

  // Compact mode - just a small icon button
  if (compact) {
    return (
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || isLoading}
        className={`relative p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
        title="Mikrofon auswählen"
      >
        <Settings2 className="w-4 h-4 text-slate-600" />
        {isOpen && (
          <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
            {/* Dropdown content same as below */}
          </div>
        )}
      </button>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Main selector button */}
      <div className="flex gap-2">
        <button
          onClick={() => !disabled && !isLoading && setIsOpen(!isOpen)}
          disabled={disabled || isLoading}
          className={`flex-1 flex items-center justify-between gap-3 px-4 py-3 rounded-xl border
            ${error ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white hover:bg-slate-50'}
            ${disabled || isLoading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
            transition-all duration-200`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${error ? 'bg-red-100' : 'bg-gradient-to-br from-blue-500 to-teal-500'}`}>
              {error ? (
                <AlertCircle className="w-5 h-5 text-red-500" />
              ) : (
                <Mic className="w-5 h-5 text-white" />
              )}
            </div>
            <div className="text-left">
              <div className="text-xs text-slate-500 font-medium">Mikrofon</div>
              <div className={`text-sm font-semibold ${error ? 'text-red-600' : 'text-slate-800'}`}>
                {isLoading ? 'Lade...' : error ? error : selectedDevice ? getDeviceLabel(selectedDevice) : 'Mikrofon auswählen'}
              </div>
            </div>
          </div>
          <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Test button */}
        {onTestClick && !error && (
          <button
            onClick={onTestClick}
            disabled={disabled || isLoading || !selectedDeviceId}
            className={`px-4 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50
              ${disabled || isLoading || !selectedDeviceId ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
              transition-all duration-200 flex items-center gap-2`}
            title="Mikrofon testen"
          >
            <Mic className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-slate-700">Testen</span>
          </button>
        )}

        {/* Refresh button on error */}
        {error && (
          <button
            onClick={loadDevices}
            className="px-4 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all duration-200"
            title="Erneut versuchen"
          >
            <RefreshCw className="w-5 h-5 text-slate-600" />
          </button>
        )}
      </div>

      {/* Dropdown menu */}
      {isOpen && devices.length > 0 && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden max-h-64 overflow-y-auto">
            {devices.map((device, index) => (
              <button
                key={device.deviceId || index}
                onClick={() => handleSelect(device.deviceId)}
                className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-slate-50 transition-colors
                  ${selectedDeviceId === device.deviceId ? 'bg-blue-50' : ''}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center
                  ${selectedDeviceId === device.deviceId ? 'bg-blue-600' : 'bg-slate-100'}`}>
                  <Mic className={`w-4 h-4 ${selectedDeviceId === device.deviceId ? 'text-white' : 'text-slate-500'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium truncate ${selectedDeviceId === device.deviceId ? 'text-blue-700' : 'text-slate-800'}`}>
                    {getDeviceLabel(device)}
                  </div>
                  {device.deviceId === 'default' && (
                    <div className="text-xs text-slate-400">Systemstandard</div>
                  )}
                </div>
                {selectedDeviceId === device.deviceId && (
                  <div className="w-2 h-2 rounded-full bg-blue-600" />
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
