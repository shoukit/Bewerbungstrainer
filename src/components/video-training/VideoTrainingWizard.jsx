import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ArrowLeft, Video, Info, Loader2, AlertCircle, ChevronRight, Settings, Sparkles, Mic, Camera, ChevronDown, RefreshCw, Target, Lightbulb, Brain, MessageSquare, CheckCircle, Clock } from 'lucide-react';
import { usePartner } from '../../context/PartnerContext';
import { motion } from 'framer-motion';
import { getWPNonce, getWPApiUrl } from '@/services/wordpress-api';
import FullscreenLoader from '@/components/ui/composite/fullscreen-loader';

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
  primaryAccent,
  themedGradient
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
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
        {/* Dropdown button */}
        <button
          type="button"
          onClick={() => !isLoading && setIsOpen(!isOpen)}
          disabled={isLoading}
          style={{
            flex: '1 1 250px',
            minWidth: '200px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            padding: '12px 16px',
            borderRadius: '12px',
            border: `2px solid ${error ? '#ef4444' : '#e2e8f0'}`,
            backgroundColor: error ? '#fef2f2' : '#fff',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.6 : 1,
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
              background: error ? '#fee2e2' : themedGradient,
            }}>
              {error ? (
                <AlertCircle style={{ width: '22px', height: '22px', color: '#ef4444' }} />
              ) : (
                <Icon style={{ width: '22px', height: '22px', color: '#fff' }} />
              )}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, marginBottom: '2px' }}>
                {label}
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: error ? '#dc2626' : '#1e293b' }}>
                {isLoading ? 'Lade...' : error ? error : selectedDevice ? getDeviceLabel(selectedDevice) : 'Bitte wählen'}
              </div>
            </div>
          </div>
          <ChevronDown style={{
            width: '20px',
            height: '20px',
            color: '#94a3b8',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 0.2s',
          }} />
        </button>

        {/* Refresh button on error */}
        {error && onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '12px 16px',
              borderRadius: '12px',
              border: '2px solid #e2e8f0',
              backgroundColor: '#fff',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <RefreshCw style={{ width: '20px', height: '20px', color: '#475569' }} />
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
            backgroundColor: '#fff',
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
            border: '1px solid #e2e8f0',
            zIndex: 50,
            overflow: 'hidden',
            maxHeight: '280px',
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
                    e.currentTarget.style.backgroundColor = '#f8fafc';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = selectedDeviceId === device.deviceId ? `${primaryAccent}15` : 'transparent';
                }}
              >
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: selectedDeviceId === device.deviceId ? primaryAccent : '#f1f5f9',
                }}>
                  <Icon style={{
                    width: '18px',
                    height: '18px',
                    color: selectedDeviceId === device.deviceId ? '#fff' : '#64748b',
                  }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: selectedDeviceId === device.deviceId ? primaryAccent : '#1e293b',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {getDeviceLabel(device)}
                  </div>
                  {device.deviceId === 'default' && (
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>Systemstandard</div>
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

/**
 * DynamicFormField - Renders form fields based on configuration
 */
const DynamicFormField = ({ field, value, onChange, error, primaryAccent }) => {
  const commonStyles = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '10px',
    border: `2px solid ${error ? '#ef4444' : '#e2e8f0'}`,
    fontSize: '16px',
    transition: 'all 0.2s ease',
    outline: 'none',
    background: '#fff',
  };

  const handleFocus = (e) => {
    e.target.style.borderColor = primaryAccent;
    e.target.style.boxShadow = `0 0 0 3px ${primaryAccent}20`;
  };

  const handleBlur = (e) => {
    e.target.style.borderColor = error ? '#ef4444' : '#e2e8f0';
    e.target.style.boxShadow = 'none';
  };

  const renderField = () => {
    switch (field.type) {
      case 'select':
        return (
          <select
            value={value || field.default || ''}
            onChange={(e) => onChange(field.key, e.target.value)}
            style={{ ...commonStyles, cursor: 'pointer' }}
            onFocus={handleFocus}
            onBlur={handleBlur}
            required={field.required}
          >
            {!field.default && <option value="">Bitte auswählen...</option>}
            {field.options?.map((opt) => (
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
            style={{ ...commonStyles, minHeight: '100px', resize: 'vertical' }}
            onFocus={handleFocus}
            onBlur={handleBlur}
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
            style={commonStyles}
            onFocus={handleFocus}
            onBlur={handleBlur}
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
            style={commonStyles}
            onFocus={handleFocus}
            onBlur={handleBlur}
            required={field.required}
          />
        );
    }
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      <label
        style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: 600,
          color: '#0f172a',
          marginBottom: '8px',
        }}
      >
        {field.label}
        {field.required && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
      </label>
      {renderField()}
      {field.hint && (
        <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>{field.hint}</p>
      )}
      {error && (
        <p style={{ fontSize: '13px', color: '#ef4444', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <AlertCircle size={14} />
          {error}
        </p>
      )}
    </div>
  );
};

/**
 * VideoTrainingWizard - Configuration view before starting
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

  const { branding, demoCode } = usePartner();

  // Get themed styles
  const themedGradient = branding?.headerGradient || 'linear-gradient(135deg, #3A7FA7 0%, #2d6a8a 100%)';
  const primaryAccent = branding?.primaryAccent || '#3A7FA7';

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

  return (
    <div style={{ padding: '32px', maxWidth: '700px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'none',
            border: 'none',
            color: '#64748b',
            cursor: 'pointer',
            fontSize: '14px',
            padding: '8px 0',
            marginBottom: '16px',
          }}
        >
          <ArrowLeft size={18} />
          Zurück zur Übersicht
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: themedGradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Video size={28} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
              {scenario?.title}
            </h1>
            <p style={{ fontSize: '14px', color: '#64748b' }}>
              Konfiguriere deine Wirkungs-Analyse
            </p>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          padding: '16px 20px',
          background: `linear-gradient(135deg, ${primaryAccent}10 0%, ${primaryAccent}05 100%)`,
          borderRadius: '12px',
          border: `1px solid ${primaryAccent}20`,
          marginBottom: '32px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
        }}
      >
        <Info size={20} color={primaryAccent} style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <h4 style={{ fontWeight: 600, color: '#0f172a', marginBottom: '4px', fontSize: '14px' }}>
            So funktioniert es
          </h4>
          <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
            Die KI generiert {scenario?.question_count || 5} personalisierte Fragen basierend auf deinen Angaben.
            Beantworte jede Frage vor der Kamera und erhalte anschließend detailliertes Feedback.
          </p>
        </div>
      </motion.div>

      {/* Long Description - Detailed task description */}
      {scenario?.long_description && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          style={{
            padding: '20px 24px',
            borderRadius: '14px',
            backgroundColor: 'white',
            border: '1px solid #e2e8f0',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: themedGradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Info style={{ width: '20px', height: '20px', color: 'white' }} />
            </div>
            <div>
              <h3 style={{
                fontSize: '15px',
                fontWeight: 600,
                color: '#0f172a',
                margin: '0 0 8px 0',
              }}>
                Deine Aufgabe
              </h3>
              <p style={{
                fontSize: '14px',
                lineHeight: '1.6',
                color: '#475569',
                margin: 0,
                whiteSpace: 'pre-wrap',
              }}>
                {scenario.long_description?.replace(/\/n/g, '\n')}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tips Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          background: '#fff',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #e2e8f0',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <Lightbulb size={20} color={primaryAccent} />
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>
            Tipps für dein Video-Training
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          {(scenario?.tips && Array.isArray(scenario.tips) && scenario.tips.length > 0
            ? scenario.tips.map((tip, idx) => {
                // Handle legacy string format: ["Tip text 1", "Tip text 2"]
                if (typeof tip === 'string') {
                  return {
                    icon: Lightbulb,
                    title: `Tipp ${idx + 1}`,
                    description: tip,
                  };
                }
                // Handle new object format: [{icon, title, text}]
                return {
                  icon: iconMap[tip.icon] || iconMap[tip.icon?.toLowerCase()] || Lightbulb,
                  title: tip.title || `Tipp ${idx + 1}`,
                  description: tip.text || tip.description || '',
                };
              })
            : defaultVideoTips
          ).map((tip, index) => {
            const IconComponent = tip.icon;
            return (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '16px',
                  borderRadius: '12px',
                  backgroundColor: '#f8fafc',
                }}
              >
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: themedGradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <IconComponent style={{ width: '18px', height: '18px', color: '#fff' }} />
                </div>
                <div>
                  <h4 style={{ fontWeight: 600, color: '#0f172a', fontSize: '14px', marginBottom: '4px' }}>
                    {tip.title}
                  </h4>
                  <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
                    {tip.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        style={{
          background: '#fff',
          borderRadius: '16px',
          padding: '28px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
          <Settings size={20} color={primaryAccent} />
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>
            Personalisiere dein Training
          </h2>
        </div>

        {inputConfig.map((field) => (
          <DynamicFormField
            key={field.key}
            field={field}
            value={variables[field.key]}
            onChange={handleFieldChange}
            error={errors[field.key]}
            primaryAccent={primaryAccent}
          />
        ))}

        {inputConfig.length === 0 && (
          <p style={{ color: '#64748b', textAlign: 'center', padding: '20px' }}>
            Keine zusätzliche Konfiguration erforderlich.
          </p>
        )}
      </motion.div>

      {/* Device Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        style={{
          background: '#fff',
          borderRadius: '16px',
          padding: '28px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
          <Camera size={20} color={primaryAccent} />
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>
            Kamera & Mikrofon
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Camera Selection */}
          <DeviceSelector
            type="video"
            devices={videoDevices}
            selectedDeviceId={selectedCameraId}
            onDeviceChange={setSelectedCameraId}
            isLoading={devicesLoading}
            error={cameraError}
            onRefresh={loadDevices}
            primaryAccent={primaryAccent}
            themedGradient={themedGradient}
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
            primaryAccent={primaryAccent}
            themedGradient={themedGradient}
          />
        </div>

        {/* Permission hint */}
        {(micError || cameraError) && (
          <p style={{
            fontSize: '13px',
            color: '#94a3b8',
            marginTop: '16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
          }}>
            <Info size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            Bitte erlaube den Zugriff auf Kamera und Mikrofon in deinen Browser-Einstellungen, um die Geräte nutzen zu können.
          </p>
        )}
      </motion.div>

      {/* Error display */}
      {apiError && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '16px',
            background: '#fef2f2',
            borderRadius: '12px',
            border: '1px solid #fecaca',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <AlertCircle size={20} color="#ef4444" />
          <p style={{ color: '#dc2626', fontSize: '14px' }}>{apiError}</p>
        </motion.div>
      )}

      {/* Training Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{
          background: '#f8fafc',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '32px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <Sparkles size={18} color={primaryAccent} />
          <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '14px' }}>Training-Details</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block' }}>Fragen</span>
            <span style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>
              {scenario?.question_count || 5}
            </span>
          </div>
          <div>
            <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block' }}>Zeit pro Frage</span>
            <span style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>
              ~{Math.round((scenario?.time_limit_per_question || 120) / 60)} Min.
            </span>
          </div>
          <div>
            <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block' }}>Gesamtdauer</span>
            <span style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>
              ~{Math.round((scenario?.total_time_limit || 900) / 60)} Min.
            </span>
          </div>
        </div>
      </motion.div>

      {/* Start Button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        onClick={handleStart}
        disabled={isLoading}
        style={{
          width: '100%',
          padding: '16px 24px',
          borderRadius: '12px',
          background: isLoading ? '#94a3b8' : themedGradient,
          color: '#fff',
          border: 'none',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
          transition: 'all 0.2s ease',
        }}
      >
        Video Training starten
        <ChevronRight size={20} />
      </motion.button>

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
