import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Wifi, WifiOff, Loader2, AlertTriangle, CheckCircle2, Info, RefreshCw } from 'lucide-react';
import DeviceSetupPage from '@/components/DeviceSetupPage';
import { testWebSocketConnectivity } from '@/services/websocket-test';
import wordpressAPI from '@/services/wordpress-api';
import { usePartner } from '@/context/PartnerContext';
import { DEFAULT_BRANDING } from '@/config/partners';
import { COLORS } from '@/config/colors';

/**
 * Connection Mode Badge Component
 * Shows the current connection mode and allows switching
 */
const ConnectionModeBadge = ({ mode, isChecking, latency, error, onSwitchMode, onRetry, primaryAccent }) => {
  if (isChecking) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '14px 18px',
        backgroundColor: '#eff6ff',
        border: '1px solid #bfdbfe',
        borderRadius: '14px',
      }}>
        <Loader2 style={{ width: '20px', height: '20px', color: '#3b82f6' }} className="animate-spin" />
        <span style={{ fontSize: '14px', fontWeight: 500, color: '#1d4ed8' }}>
          Prüfe Verbindung...
        </span>
      </div>
    );
  }

  if (mode === 'websocket') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '14px 18px',
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '14px',
        }}>
          <Wifi style={{ width: '20px', height: '20px', color: '#22c55e' }} />
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '14px', fontWeight: 500, color: '#15803d' }}>
              Echtzeit-Verbindung verfügbar
            </span>
            {latency && (
              <span style={{ fontSize: '12px', color: '#16a34a', marginLeft: '8px' }}>
                ({latency}ms)
              </span>
            )}
          </div>
          <CheckCircle2 style={{ width: '20px', height: '20px', color: '#22c55e' }} />
        </div>
        <button
          onClick={() => onSwitchMode('corporate')}
          style={{
            fontSize: '12px',
            color: COLORS.slate[500],
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textDecoration: 'underline',
            textAlign: 'left',
            padding: 0,
          }}
        >
          Verbindungsprobleme? Zum HTTP-Modus wechseln
        </button>
      </div>
    );
  }

  // Corporate mode
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '14px 18px',
        backgroundColor: '#fffbeb',
        border: '1px solid #fde68a',
        borderRadius: '14px',
      }}>
        <WifiOff style={{ width: '20px', height: '20px', color: '#f59e0b' }} />
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: '14px', fontWeight: 500, color: '#b45309' }}>
            Corporate Modus (HTTP)
          </span>
        </div>
        <AlertTriangle style={{ width: '20px', height: '20px', color: '#f59e0b' }} />
      </div>

      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          padding: '14px 18px',
          backgroundColor: COLORS.slate[50],
          border: `1px solid ${COLORS.slate[200]}`,
          borderRadius: '14px',
        }}>
          <Info style={{ width: '16px', height: '16px', color: COLORS.slate[500], flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '12px', color: COLORS.slate[600] }}>
            <p style={{ margin: 0, fontWeight: 500, marginBottom: '4px' }}>
              Echtzeit-Verbindung nicht möglich
            </p>
            <p style={{ margin: 0, marginBottom: '8px' }}>
              {error}
            </p>
            <p style={{ margin: 0, color: COLORS.slate[500] }}>
              Der HTTP-Modus funktioniert auf Firmengeräten zuverlässig. Es gibt kurze Pausen (~3s) zwischen den Antworten.
            </p>
          </div>
        </div>
      )}

      <button
        onClick={onRetry}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '12px',
          color: COLORS.slate[500],
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textDecoration: 'underline',
          padding: 0,
        }}
      >
        <RefreshCw style={{ width: '12px', height: '12px' }} />
        Erneut mit Echtzeit-Modus versuchen
      </button>
    </div>
  );
};

/**
 * RoleplayDeviceSetup Component
 *
 * Wraps DeviceSetupPage for Live-Simulationen.
 * Includes WebSocket connectivity test and mode selection.
 */
const RoleplayDeviceSetup = ({
  scenario,
  onBack,
  onStart,
}) => {
  const { branding } = usePartner();
  const primaryAccent = branding?.['--primary-accent'] || DEFAULT_BRANDING['--primary-accent'];

  // Connection mode state
  const [connectionMode, setConnectionMode] = useState('websocket');
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);
  const [connectionError, setConnectionError] = useState(null);
  const [connectionLatency, setConnectionLatency] = useState(null);

  // Test WebSocket connectivity on mount
  useEffect(() => {
    checkConnection();
  }, [scenario]);

  const checkConnection = async () => {
    setIsCheckingConnection(true);
    setConnectionError(null);

    try {
      const agentId = scenario?.agent_id || wordpressAPI.getElevenLabsAgentId();

      if (!agentId) {
        console.log('[DeviceSetup] No agent ID, using corporate mode');
        setConnectionMode('corporate');
        setConnectionError('Keine Agent-ID konfiguriert');
        setIsCheckingConnection(false);
        return;
      }

      console.log('[DeviceSetup] Testing WebSocket connectivity...');
      const result = await testWebSocketConnectivity(agentId, 5000);

      if (result.success) {
        console.log('[DeviceSetup] WebSocket available, latency:', result.latency);
        setConnectionMode('websocket');
        setConnectionLatency(result.latency);
        setConnectionError(null);
      } else {
        console.log('[DeviceSetup] WebSocket blocked:', result.error);
        setConnectionMode('corporate');
        setConnectionError(result.error);
      }
    } catch (err) {
      console.error('[DeviceSetup] Connection check failed:', err);
      setConnectionMode('corporate');
      setConnectionError(err.message);
    } finally {
      setIsCheckingConnection(false);
    }
  };

  const handleSwitchMode = (newMode) => {
    setConnectionMode(newMode);
    if (newMode === 'corporate') {
      setConnectionError(null);
    }
  };

  const handleRetry = () => {
    checkConnection();
  };

  const handleStart = ({ selectedMicrophoneId }) => {
    onStart({
      selectedMicrophoneId,
      connectionMode,
    });
  };

  // Get interviewer name for button label
  const interviewerName = scenario?.interviewer_profile?.name;
  let startLabel;

  if (connectionMode === 'corporate') {
    startLabel = 'Gespräch starten (HTTP)';
  } else if (interviewerName) {
    startLabel = `${interviewerName} anrufen`;
  } else {
    startLabel = 'Gespräch starten';
  }

  // Extra content for connection mode display
  const connectionModeContent = (
    <div style={{
      padding: '20px',
      backgroundColor: 'white',
      borderRadius: '16px',
      border: `1px solid ${COLORS.slate[200]}`,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '16px',
      }}>
        {connectionMode === 'websocket' ? (
          <Wifi style={{ width: '20px', height: '20px', color: primaryAccent }} />
        ) : (
          <WifiOff style={{ width: '20px', height: '20px', color: primaryAccent }} />
        )}
        <h3 style={{
          fontSize: '16px',
          fontWeight: 600,
          color: COLORS.slate[900],
          margin: 0,
        }}>
          Verbindungsmodus
        </h3>
      </div>

      <ConnectionModeBadge
        mode={connectionMode}
        isChecking={isCheckingConnection}
        latency={connectionLatency}
        error={connectionError}
        onSwitchMode={handleSwitchMode}
        onRetry={handleRetry}
        primaryAccent={primaryAccent}
      />
    </div>
  );

  return (
    <DeviceSetupPage
      mode="audio"
      scenario={scenario}
      onBack={onBack}
      onStart={handleStart}
      title={scenario?.title}
      startButtonLabel={startLabel}
      icon={MessageSquare}
      disabled={isCheckingConnection}
      extraContent={connectionModeContent}
    />
  );
};

export default RoleplayDeviceSetup;
