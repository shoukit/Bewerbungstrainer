import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Loader2, CheckCircle2, Info, RefreshCw, Server, Globe, AlertTriangle } from 'lucide-react';
import DeviceSetupPage from '@/components/DeviceSetupPage';
import { testWebSocketConnectivity, testProxyConnectivity, detectBestConnectionMode } from '@/services/websocket-test';
import wordpressAPI from '@/services/wordpress-api';
import { useBranding } from '@/hooks/useBranding';
import { COLORS } from '@/config/colors';

/**
 * Connection Mode Badge Component
 * Shows the current connection mode and allows switching
 * Only supports: websocket (direct) and proxy modes
 */
const ConnectionModeBadge = ({ mode, isChecking, latency, proxyLatency, error, onSwitchMode, onRetry, directAvailable, proxyAvailable, b }) => {
  if (isChecking) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: b.space[2.5],
        padding: `${b.space[3.5]} ${b.space[4]}`,
        backgroundColor: COLORS.blue[50],
        border: `1px solid ${COLORS.blue[200]}`,
        borderRadius: b.radius.lg,
      }}>
        <Loader2 style={{ width: '20px', height: '20px', color: COLORS.blue[500] }} className="animate-spin" />
        <span style={{ fontSize: b.fontSize.base, fontWeight: b.fontWeight.medium, color: COLORS.blue[700] }}>
          Prüfe Verbindung...
        </span>
      </div>
    );
  }

  // Error state - neither mode works
  if (error && !directAvailable && !proxyAvailable) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: b.space[3] }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: b.space[2.5],
          padding: `${b.space[3.5]} ${b.space[4]}`,
          backgroundColor: COLORS.red[50],
          border: `1px solid ${COLORS.red[200]}`,
          borderRadius: b.radius.lg,
        }}>
          <AlertTriangle style={{ width: '20px', height: '20px', color: COLORS.red[600] }} />
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: b.fontSize.base, fontWeight: b.fontWeight.medium, color: COLORS.red[800] }}>
              Keine Verbindung möglich
            </span>
          </div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: b.space[2.5],
          padding: `${b.space[3.5]} ${b.space[4]}`,
          backgroundColor: COLORS.slate[50],
          border: `1px solid ${COLORS.slate[200]}`,
          borderRadius: b.radius.lg,
        }}>
          <Info style={{ width: '16px', height: '16px', color: COLORS.slate[500], flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: b.fontSize.xs, color: COLORS.slate[600] }}>
            <p style={{ margin: 0, fontWeight: b.fontWeight.medium, marginBottom: b.space[1] }}>
              WebSocket-Verbindungen blockiert
            </p>
            <p style={{ margin: 0 }}>
              {error}
            </p>
          </div>
        </div>

        <button
          onClick={onRetry}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: b.space[1.5],
            fontSize: b.fontSize.xs,
            color: COLORS.slate[500],
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textDecoration: 'underline',
            padding: 0,
          }}
        >
          <RefreshCw style={{ width: '12px', height: '12px' }} />
          Verbindung erneut prüfen
        </button>
      </div>
    );
  }

  // Direct WebSocket mode
  if (mode === 'websocket') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: b.space[2] }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: b.space[2.5],
          padding: `${b.space[3.5]} ${b.space[4]}`,
          backgroundColor: COLORS.green[50],
          border: `1px solid ${COLORS.green[200]}`,
          borderRadius: b.radius.lg,
        }}>
          <Globe style={{ width: '20px', height: '20px', color: COLORS.green[500] }} />
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: b.fontSize.base, fontWeight: b.fontWeight.medium, color: COLORS.green[700] }}>
              Direkte Echtzeit-Verbindung
            </span>
            {latency && (
              <span style={{ fontSize: b.fontSize.xs, color: COLORS.green[600], marginLeft: b.space[2] }}>
                ({latency}ms)
              </span>
            )}
          </div>
          <CheckCircle2 style={{ width: '20px', height: '20px', color: COLORS.green[500] }} />
        </div>
        <button
          onClick={() => onSwitchMode('proxy')}
          style={{
            fontSize: b.fontSize.xs,
            color: COLORS.slate[500],
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textDecoration: 'underline',
            textAlign: 'left',
            padding: 0,
          }}
        >
          Proxy-Modus testen
        </button>
      </div>
    );
  }

  // Proxy mode
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: b.space[2] }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: b.space[2.5],
        padding: `${b.space[3.5]} ${b.space[4]}`,
        backgroundColor: COLORS.blue[50],
        border: `1px solid ${COLORS.blue[200]}`,
        borderRadius: b.radius.lg,
      }}>
        <Server style={{ width: '20px', height: '20px', color: COLORS.blue[500] }} />
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: b.fontSize.base, fontWeight: b.fontWeight.medium, color: COLORS.blue[700] }}>
            Proxy-Modus (Echtzeit via Server)
          </span>
          {proxyLatency && (
            <span style={{ fontSize: b.fontSize.xs, color: COLORS.blue[500], marginLeft: b.space[2] }}>
              ({proxyLatency}ms)
            </span>
          )}
        </div>
        <CheckCircle2 style={{ width: '20px', height: '20px', color: COLORS.blue[500] }} />
      </div>

      {!directAvailable && (
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: b.space[2.5],
          padding: `${b.space[3]} ${b.space[4]}`,
          backgroundColor: COLORS.slate[50],
          border: `1px solid ${COLORS.slate[200]}`,
          borderRadius: b.radius.lg,
        }}>
          <Info style={{ width: '14px', height: '14px', color: COLORS.slate[500], flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: b.fontSize.xs, color: COLORS.slate[600] }}>
            <p style={{ margin: 0 }}>
              Direkte Verbindung blockiert. Der Proxy-Server ermöglicht Echtzeit-Gespräche trotz Firewall.
            </p>
          </div>
        </div>
      )}

      {directAvailable && (
        <button
          onClick={() => onSwitchMode('websocket')}
          style={{
            fontSize: b.fontSize.xs,
            color: COLORS.slate[500],
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textDecoration: 'underline',
            textAlign: 'left',
            padding: 0,
          }}
        >
          Direkte Verbindung nutzen
        </button>
      )}
    </div>
  );
};

/**
 * RoleplayDeviceSetup Component
 *
 * Wraps DeviceSetupPage for Live-Simulationen.
 * Includes WebSocket connectivity test and mode selection.
 * Supports two modes: websocket (direct) and proxy.
 */
const RoleplayDeviceSetup = ({
  scenario,
  onBack,
  onStart,
}) => {
  const b = useBranding();

  // Connection mode state
  const [connectionMode, setConnectionMode] = useState('websocket');
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);
  const [connectionError, setConnectionError] = useState(null);
  const [connectionLatency, setConnectionLatency] = useState(null);
  const [proxyLatency, setProxyLatency] = useState(null);
  const [directAvailable, setDirectAvailable] = useState(false);
  const [proxyAvailable, setProxyAvailable] = useState(false);

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
        setConnectionMode('websocket'); // Default to websocket, will show error
        setConnectionError('Keine Agent-ID konfiguriert');
        setDirectAvailable(false);
        setProxyAvailable(false);
        setIsCheckingConnection(false);
        return;
      }

      const result = await detectBestConnectionMode(agentId);


      setConnectionMode(result.mode);
      setDirectAvailable(result.directAvailable);
      setProxyAvailable(result.proxyAvailable);
      setConnectionLatency(result.directLatency || null);
      setProxyLatency(result.proxyLatency || null);
      setConnectionError(result.error || null);

    } catch (err) {
      console.error('[DeviceSetup] Connection check failed:', err);
      setConnectionMode('websocket'); // Default, will show error state
      setConnectionError(err.message);
      setDirectAvailable(false);
      setProxyAvailable(false);
    } finally {
      setIsCheckingConnection(false);
    }
  };

  const handleSwitchMode = async (newMode) => {
    const agentId = scenario?.agent_id || wordpressAPI.getElevenLabsAgentId();

    // If switching to proxy, test it first if we haven't already
    if (newMode === 'proxy' && !proxyAvailable && agentId) {
      setIsCheckingConnection(true);
      const proxyResult = await testProxyConnectivity(agentId, 5000);
      setIsCheckingConnection(false);

      if (proxyResult.success) {
        setProxyAvailable(true);
        setProxyLatency(proxyResult.latency);
        setConnectionMode('proxy');
      } else {
        // Proxy test failed, stay on current mode
        setConnectionError('Proxy-Verbindung nicht verfügbar: ' + proxyResult.error);
        return;
      }
    } else {
      setConnectionMode(newMode);
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

  if (connectionMode === 'proxy') {
    startLabel = interviewerName ? `${interviewerName} anrufen (Proxy)` : 'Gespräch starten (Proxy)';
  } else if (interviewerName) {
    startLabel = `${interviewerName} anrufen`;
  } else {
    startLabel = 'Gespräch starten';
  }

  // Get icon for current mode
  const getModeIcon = () => {
    if (connectionMode === 'proxy') {
      return <Server style={{ width: '20px', height: '20px', color: b.primaryAccent }} />;
    } else {
      return <Globe style={{ width: '20px', height: '20px', color: b.primaryAccent }} />;
    }
  };

  // Extra content for connection mode display
  const connectionModeContent = (
    <div style={{
      padding: b.space[5],
      backgroundColor: 'white',
      borderRadius: b.radius.xl,
      border: `1px solid ${COLORS.slate[200]}`,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: b.space[2.5],
        marginBottom: b.space[4],
      }}>
        {getModeIcon()}
        <h3 style={{
          fontSize: b.fontSize.lg,
          fontWeight: b.fontWeight.semibold,
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
        proxyLatency={proxyLatency}
        error={connectionError}
        onSwitchMode={handleSwitchMode}
        onRetry={handleRetry}
        directAvailable={directAvailable}
        proxyAvailable={proxyAvailable}
        b={b}
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
