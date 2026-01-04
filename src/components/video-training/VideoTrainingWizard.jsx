/**
 * VideoTrainingWizard - Configuration view before starting video training
 *
 * Layout matches SimulatorWizard/PreSessionView for consistency.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Video,
  Info,
  Loader2,
  AlertCircle,
  Play,
  Settings,
  Sparkles,
  Mic,
  Camera,
  ChevronDown,
  RefreshCw,
  Target,
  Lightbulb,
  Brain,
  MessageSquare,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { usePartner } from '../../context/PartnerContext';
import { motion } from 'framer-motion';
import { getWPNonce, getWPApiUrl } from '@/services/wordpress-api';
import FullscreenLoader from '@/components/ui/composite/fullscreen-loader';
import { Button, Card } from '@/components/ui';

/**
 * Render text with **bold** markdown syntax
 * @param {string} text - Text with **bold** markers
 * @returns {React.ReactNode[]} - Array of text and <strong> elements
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
  brain: Brain,
  info: Info,
  settings: Settings,
  check: CheckCircle,
  sparkles: Sparkles,
};

/**
 * Default tips for video training when no custom tips are configured
 */
const defaultVideoTips = [
  {
    icon: Camera,
    title: 'Blick in die Kamera',
    description: 'Schaue direkt in die Kamera, um Augenkontakt zu simulieren.',
  },
  {
    icon: Lightbulb,
    title: 'Gute Beleuchtung',
    description: 'Achte auf ausreichend Licht von vorne, um professionell zu wirken.',
  },
  {
    icon: Mic,
    title: 'Klare Aussprache',
    description: 'Sprich deutlich und in angemessenem Tempo.',
  },
  {
    icon: Target,
    title: 'Strukturierte Antworten',
    description: 'Nutze die STAR-Methode: Situation, Task, Action, Result.',
  },
];

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
      if (lbl.length > 35) {
        lbl = lbl.substring(0, 32) + '...';
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
    <div className="relative">
      <div className="flex flex-wrap gap-3">
        {/* Dropdown button */}
        <button
          type="button"
          onClick={() => !isLoading && setIsOpen(!isOpen)}
          disabled={isLoading}
          className={`flex-1 min-w-[200px] flex items-center justify-between gap-3 p-3 rounded-xl border-2 transition-all
            ${error ? 'border-red-500 bg-red-50' : 'border-slate-200 bg-white'}
            ${isLoading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center
              ${error ? 'bg-red-100' : 'bg-brand-gradient'}`}
            >
              {error ? (
                <AlertCircle className="w-[22px] h-[22px] text-red-500" />
              ) : (
                <Icon className="w-[22px] h-[22px] text-white" />
              )}
            </div>
            <div className="text-left">
              <div className="text-xs text-slate-500 font-medium mb-0.5">
                {label}
              </div>
              <div className={`text-sm font-semibold ${error ? 'text-red-600' : 'text-slate-900'}`}>
                {isLoading ? 'Lade...' : error ? error : selectedDevice ? getDeviceLabel(selectedDevice) : 'Bitte wählen'}
              </div>
            </div>
          </div>
          <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Refresh button on error */}
        {error && onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="flex items-center justify-center px-4 py-3 rounded-xl border-2 border-slate-200 bg-white cursor-pointer hover:bg-slate-50 transition-colors"
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
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-40"
          />

          {/* Dropdown */}
          <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden max-h-[280px] overflow-y-auto">
            {devices.map((device, index) => {
              const isSelected = selectedDeviceId === device.deviceId;
              return (
                <button
                  key={device.deviceId || index}
                  type="button"
                  onClick={() => handleSelect(device.deviceId)}
                  className={`w-full py-3.5 px-4 text-left flex items-center gap-3 border-none cursor-pointer transition-colors
                    ${isSelected ? 'bg-primary/10' : 'bg-transparent hover:bg-slate-50'}`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center
                    ${isSelected ? 'bg-primary' : 'bg-slate-100'}`}
                  >
                    <Icon className={`w-[18px] h-[18px] ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium truncate ${isSelected ? 'text-primary' : 'text-slate-900'}`}>
                      {getDeviceLabel(device)}
                    </div>
                    {device.deviceId === 'default' && (
                      <div className="text-xs text-slate-400">Systemstandard</div>
                    )}
                  </div>
                  {isSelected && (
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

/**
 * DynamicFormField - Renders form fields based on configuration
 */
const DynamicFormField = ({ field, value, onChange, error }) => {
  const baseInputClasses = `w-full py-3 px-4 rounded-[10px] border-2 text-base transition-all outline-none bg-white
    ${error ? 'border-red-500' : 'border-slate-200'}
    focus:border-primary focus:ring-2 focus:ring-primary/20`;

  const renderField = () => {
    switch (field.type) {
      case 'select':
        return (
          <select
            value={value || field.default || ''}
            onChange={(e) => onChange(field.key, e.target.value)}
            className={`${baseInputClasses} cursor-pointer`}
            required={field.required}
          >
            {!field.default && <option value="">Bitte auswählen...</option>}
            {field.options
              ?.slice() // Create a copy to avoid mutating the original
              .sort((a, b) => a.label.localeCompare(b.label, 'de'))
              .map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => onChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            className={`${baseInputClasses} min-h-[100px] resize-y`}
            required={field.required}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            className={baseInputClasses}
            required={field.required}
            min={field.min}
            max={field.max}
          />
        );

      default: // text
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            className={baseInputClasses}
            required={field.required}
          />
        );
    }
  };

  return (
    <div className="mb-5">
      <label className="block text-sm font-semibold text-slate-900 mb-2">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {renderField()}
      {field.hint && (
        <p className="text-[13px] text-slate-400 mt-1">{field.hint}</p>
      )}
      {error && (
        <p className="text-[13px] text-red-500 mt-1 flex items-center gap-1">
          <AlertCircle size={14} />
          {error}
        </p>
      )}
    </div>
  );
};

/**
 * VideoTrainingWizard - Configuration view before starting
 * Layout matches SimulatorWizard/PreSessionView
 */
const VideoTrainingWizard = ({ scenario, onBack, onStart }) => {
  // Initialize variables with default values from input configuration
  const [variables, setVariables] = useState(() => {
    const inputConfig = scenario?.input_configuration || [];
    const initialVars = {};
    inputConfig.forEach((field) => {
      if (field.default) {
        initialVars[field.key] = field.default;
      }
    });
    return initialVars;
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Device selection state
  const [audioDevices, setAudioDevices] = useState([]);
  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedMicrophoneId, setSelectedMicrophoneId] = useState(null);
  const [selectedCameraId, setSelectedCameraId] = useState(null);
  const [devicesLoading, setDevicesLoading] = useState(true);
  const [micError, setMicError] = useState(null);
  const [cameraError, setCameraError] = useState(null);

  // Track when we last loaded devices to prevent loops on iPad Chrome
  const lastLoadTimeRef = useRef(0);
  const isLoadingRef = useRef(false);
  // Flag to completely ignore devicechange events after initial load (for iPad)
  const ignoreDeviceChangeRef = useRef(true);
  // Count devicechange events to detect loops
  const deviceChangeCountRef = useRef(0);
  // Use refs to track selected devices without causing useCallback recreation
  const selectedMicRef = useRef(null);
  const selectedCamRef = useRef(null);

  const { demoCode } = usePartner();

  // Keep refs in sync with state
  selectedMicRef.current = selectedMicrophoneId;
  selectedCamRef.current = selectedCameraId;

  // Load available devices on mount - use refs to avoid recreating callback
  const loadDevices = useCallback(async (fromDeviceChange = false) => {
    // Prevent re-entrancy and ignore devicechange events triggered by our own getUserMedia
    if (isLoadingRef.current) {
      console.log('[VideoTraining] Skipping loadDevices - already loading');
      return;
    }

    // If this is from a devicechange event, apply strict filtering
    // iPad triggers devicechange when getUserMedia is called, creating loops
    if (fromDeviceChange) {
      // If we're ignoring devicechange events (during/after initial load), skip
      if (ignoreDeviceChangeRef.current) {
        console.log('[VideoTraining] Skipping devicechange - ignore flag set');
        return;
      }

      // Check time since last load - use 5 seconds for iPad
      const timeSinceLastLoad = Date.now() - lastLoadTimeRef.current;
      if (timeSinceLastLoad < 5000) {
        console.log('[VideoTraining] Skipping devicechange - too soon:', timeSinceLastLoad, 'ms');
        return;
      }

      // Count and limit devicechange events to prevent loops
      deviceChangeCountRef.current += 1;
      if (deviceChangeCountRef.current > 3) {
        console.log('[VideoTraining] Skipping devicechange - too many events:', deviceChangeCountRef.current);
        return;
      }
    }

    isLoadingRef.current = true;
    lastLoadTimeRef.current = Date.now();
    setDevicesLoading(true);
    setMicError(null);
    setCameraError(null);

    try {
      // Request permission for both audio and video
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      stream.getTracks().forEach(track => track.stop());

      // Enumerate devices with labels
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = allDevices.filter(device => device.kind === 'audioinput');
      const videoInputs = allDevices.filter(device => device.kind === 'videoinput');

      // Set audio devices
      if (audioInputs.length === 0) {
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

      // Set video devices
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
      setAudioDevices([]);
      setVideoDevices([]);
    } finally {
      setDevicesLoading(false);
      isLoadingRef.current = false;
      lastLoadTimeRef.current = Date.now(); // Update again after completion

      // After initial load completes, wait 5 seconds before allowing devicechange events
      // This prevents iPad's getUserMedia-triggered devicechange loops
      if (!fromDeviceChange) {
        setTimeout(() => {
          ignoreDeviceChangeRef.current = false;
          console.log('[VideoTraining] Now accepting devicechange events');
        }, 5000);
      }
    }
  }, []); // No dependencies - uses refs instead

  useEffect(() => {
    loadDevices(false);

    // Handle device changes (e.g., plugging in a new microphone)
    // Use debounce + strict filtering to prevent loops on iPad
    let debounceTimer = null;
    const handleDeviceChange = () => {
      // Quick early exit if we're ignoring devicechange events
      if (ignoreDeviceChangeRef.current || isLoadingRef.current) {
        return;
      }

      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(() => {
        loadDevices(true); // Mark as from devicechange event
      }, 1000); // Increased debounce to 1 second
    };
    navigator.mediaDevices?.addEventListener('devicechange', handleDeviceChange);

    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      navigator.mediaDevices?.removeEventListener('devicechange', handleDeviceChange);
    };
  }, []);

  // Handle field change
  const handleFieldChange = useCallback((key, value) => {
    setVariables((prev) => ({ ...prev, [key]: value }));
    // Clear error when field changes
    if (errors[key]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  }, [errors]);

  // Validate form
  const validateForm = useCallback(() => {
    const newErrors = {};
    const inputConfig = scenario?.input_configuration || [];

    inputConfig.forEach((field) => {
      if (field.required && !variables[field.key]) {
        newErrors[field.key] = `${field.label} ist erforderlich`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [scenario, variables]);

  // Handle start training
  const handleStart = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setApiError(null);

    try {
      const apiUrl = getWPApiUrl();

      // Step 1: Create session
      const createResponse = await fetch(`${apiUrl}/video-training/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': getWPNonce(),
        },
        body: JSON.stringify({
          scenario_id: scenario.id,
          variables: variables,
          demo_code: demoCode || null,
        }),
      });

      if (!createResponse.ok) {
        throw new Error('Fehler beim Erstellen der Sitzung');
      }

      const createData = await createResponse.json();

      if (!createData.success || !createData.data?.session) {
        throw new Error('Ungültige Antwort beim Erstellen der Sitzung');
      }

      const session = createData.data.session;

      // Step 2: Generate questions
      const questionsResponse = await fetch(`${apiUrl}/video-training/sessions/${session.id}/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': getWPNonce(),
        },
      });

      if (!questionsResponse.ok) {
        throw new Error('Fehler beim Generieren der Fragen');
      }

      const questionsData = await questionsResponse.json();

      if (!questionsData.success || !questionsData.data?.questions) {
        throw new Error('Fehler beim Generieren der Fragen');
      }


      // Start the session with selected devices
      onStart({
        session: questionsData.data.session,
        questions: questionsData.data.questions,
        variables: variables,
        selectedMicrophoneId: selectedMicrophoneId,
        selectedCameraId: selectedCameraId,
      });
    } catch (err) {
      console.error('[VIDEO TRAINING] Error starting session:', err);
      setApiError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const inputConfig = scenario?.input_configuration || [];

  // Get tips from scenario or use defaults
  const tips = scenario?.tips && Array.isArray(scenario.tips) && scenario.tips.length > 0
    ? scenario.tips.map((tip, idx) => {
        if (typeof tip === 'string') {
          return { icon: Lightbulb, title: `Tipp ${idx + 1}`, description: tip };
        }
        return {
          icon: iconMap[tip.icon] || iconMap[tip.icon?.toLowerCase()] || Lightbulb,
          title: tip.title || `Tipp ${idx + 1}`,
          description: tip.text || tip.description || '',
        };
      })
    : defaultVideoTips;

  return (
    <div className="p-6 md:p-8 max-w-[700px] mx-auto">
      {/* Header - matches SimulatorWizard/PreSessionView */}
      <div className="mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 bg-transparent border-none text-slate-500 cursor-pointer text-sm py-2 mb-4 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft size={18} />
          Zurück
        </button>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-gradient flex items-center justify-center">
            <Lightbulb size={32} className="text-white" />
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

      {/* Long Description - "Deine Aufgabe" (like SimulatorWizard) */}
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
                {renderBoldText(scenario.long_description?.replace(/\/n/g, '\n'))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Form Fields - Only if there are input fields */}
      {inputConfig.length > 0 && (
        <Card className="p-5 md:p-6 mb-6">
          <div className="flex items-center gap-2.5 mb-4">
            <Settings size={20} className="text-primary" />
            <h2 className="text-lg font-semibold text-slate-900 m-0">
              Dein Profil
            </h2>
          </div>
          {inputConfig.map((field) => (
            <DynamicFormField
              key={field.key}
              field={field}
              value={variables[field.key]}
              onChange={handleFieldChange}
              error={errors[field.key]}
            />
          ))}
        </Card>
      )}

      {/* Device Selection - Camera & Microphone */}
      <Card className="p-5 md:p-6 mb-6">
        <div className="flex items-center gap-2.5 mb-4">
          <Camera size={20} className="text-primary" />
          <h2 className="text-lg font-semibold text-slate-900 m-0">
            Kamera & Mikrofon
          </h2>
        </div>

        <div className="flex flex-col gap-4">
          {/* Camera Selection */}
          <DeviceSelector
            type="video"
            devices={videoDevices}
            selectedDeviceId={selectedCameraId}
            onDeviceChange={setSelectedCameraId}
            isLoading={devicesLoading}
            error={cameraError}
            onRefresh={loadDevices}
          />

          {/* Microphone Selection */}
          <DeviceSelector
            type="audio"
            devices={audioDevices}
            selectedDeviceId={selectedMicrophoneId}
            onDeviceChange={setSelectedMicrophoneId}
            isLoading={devicesLoading}
            error={micError}
            onRefresh={loadDevices}
          />
        </div>

        {/* Permission hint */}
        {(micError || cameraError) && (
          <p className="text-[13px] text-slate-400 mt-4 flex items-start gap-2">
            <Info size={16} className="flex-shrink-0 mt-0.5" />
            Bitte erlaube den Zugriff auf Kamera und Mikrofon in deinen Browser-Einstellungen.
          </p>
        )}
      </Card>

      {/* Error display */}
      {apiError && (
        <div className="p-4 bg-red-50 rounded-xl border border-red-200 mb-6 flex items-center gap-3">
          <AlertCircle size={20} className="text-red-500" />
          <p className="text-red-600 text-sm m-0">{apiError}</p>
        </div>
      )}

      {/* Start Button - prominent, before tips */}
      <Button
        onClick={handleStart}
        disabled={isLoading}
        size="lg"
        fullWidth
        icon={<Play size={20} />}
        className="mb-6"
      >
        Video Training starten
      </Button>

      {/* Tips Section - after button (like SimulatorWizard) */}
      <Card className="p-5 md:p-6 mb-6">
        <div className="flex items-center gap-2.5 mb-4">
          <Lightbulb size={20} className="text-amber-500" />
          <h2 className="text-lg font-semibold text-slate-900 m-0">
            Tipps für dein Video-Training
          </h2>
        </div>

        <div className="flex flex-col gap-3">
          {tips.map((tip, index) => {
            const IconComponent = tip.icon;
            return (
              <div key={index} className="flex items-start gap-3 p-3 md:p-4 rounded-xl bg-slate-50">
                <div className="w-9 h-9 rounded-[10px] bg-brand-gradient flex items-center justify-center flex-shrink-0">
                  <IconComponent className="w-[18px] h-[18px] text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm mb-0.5">
                    {tip.title}
                  </h4>
                  <p className="text-[13px] text-slate-500 leading-relaxed m-0">
                    {tip.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Session Info - at bottom */}
      <div className="bg-slate-50 rounded-xl py-4 px-5 flex flex-wrap gap-6">
        <div>
          <span className="text-xs text-slate-400 block">Fragen</span>
          <span className="text-lg font-semibold text-slate-900">
            {scenario?.question_count || 5}
          </span>
        </div>
        <div>
          <span className="text-xs text-slate-400 block">Zeit pro Frage</span>
          <span className="text-lg font-semibold text-slate-900">
            ~{Math.round((scenario?.time_limit_per_question || 120) / 60)} Min
          </span>
        </div>
        <div>
          <span className="text-xs text-slate-400 block">Gesamtdauer</span>
          <span className="text-lg font-semibold text-slate-900">
            ~{Math.round((scenario?.total_time_limit || 900) / 60)} Min
          </span>
        </div>
      </div>

      {/* Fullscreen Loading Overlay */}
      <FullscreenLoader
        isLoading={isLoading}
        message="Fragen werden generiert..."
        subMessage="Die KI erstellt personalisierte Fragen basierend auf deinen Angaben."
      />
    </div>
  );
};

export default VideoTrainingWizard;
