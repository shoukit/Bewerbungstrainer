import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Loader2, CheckCircle2, Info, RefreshCw, Server, Globe, AlertTriangle } from 'lucide-react';
import DeviceSetupPage from '@/components/device-setup/DeviceSetupPage';
import { testWebSocketConnectivity, testProxyConnectivity, detectBestConnectionMode } from '@/services/websocket-test';
import wordpressAPI from '@/services/wordpress-api';
import { COLORS } from '@/config/colors';

/**
 * Connection Mode Badge Component
 * Shows the current connection mode and allows switching
 * Only supports: websocket (direct) and proxy modes
 */
const ConnectionModeBadge = ({ mode, isChecking, latency, proxyLatency, error, onSwitchMode, onRetry, directAvailable, proxyAvailable }) => {
  if (isChecking) {
    return (
      <div className="flex items-center gap-2.5 p-3.5 px-4 bg-blue-50 border border-blue-200 rounded-lg">
        <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
        <span className="text-base font-medium text-blue-700">
          Prüfe Verbindung...
        </span>
      </div>
    );
  }

  // Error state - neither mode works
  if (error && !directAvailable && !proxyAvailable) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2.5 p-3.5 px-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <div className="flex-1">
            <span className="text-base font-medium text-red-800">
              Keine Verbindung möglich
            </span>
          </div>
        </div>

        <div className="flex items-start gap-2.5 p-3.5 px-4 bg-slate-50 border border-slate-200 rounded-lg">
          <Info className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600">
            <p className="m-0 font-medium mb-1">
              WebSocket-Verbindungen blockiert
            </p>
            <p className="m-0">
              {error}
            </p>
          </div>
        </div>

        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 text-xs text-slate-500 bg-transparent border-none cursor-pointer underline p-0"
        >
          <RefreshCw className="w-3 h-3" />
          Verbindung erneut prüfen
        </button>
      </div>
    );
  }

  // Direct WebSocket mode
  if (mode === 'websocket') {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2.5 p-3.5 px-4 bg-green-50 border border-green-200 rounded-lg">
          <Globe className="w-5 h-5 text-green-500" />
          <div className="flex-1">
            <span className="text-base font-medium text-green-700">
              Direkte Echtzeit-Verbindung
            </span>
            {latency && (
              <span className="text-xs text-green-600 ml-2">
                ({latency}ms)
              </span>
            )}
          </div>
          <CheckCircle2 className="w-5 h-5 text-green-500" />
        </div>
        <button
          onClick={() => onSwitchMode('proxy')}
          className="text-xs text-slate-500 bg-transparent border-none cursor-pointer underline text-left p-0"
        >
          Proxy-Modus testen
        </button>
      </div>
    );
  }

  // Proxy mode
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2.5 p-3.5 px-4 bg-blue-50 border border-blue-200 rounded-lg">
        <Server className="w-5 h-5 text-blue-500" />
        <div className="flex-1">
          <span className="text-base font-medium text-blue-700">
            Proxy-Modus (Echtzeit via Server)
          </span>
          {proxyLatency && (
            <span className="text-xs text-blue-500 ml-2">
              ({proxyLatency}ms)
            </span>
          )}
        </div>
        <CheckCircle2 className="w-5 h-5 text-blue-500" />
      </div>

      {!directAvailable && (
        <div className="flex items-start gap-2.5 p-3 px-4 bg-slate-50 border border-slate-200 rounded-lg">
          <Info className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600">
            <p className="m-0">
              Direkte Verbindung blockiert. Der Proxy-Server ermöglicht Echtzeit-Gespräche trotz Firewall.
            </p>
          </div>
        </div>
      )}

      {directAvailable && (
        <button
          onClick={() => onSwitchMode('websocket')}
          className="text-xs text-slate-500 bg-transparent border-none cursor-pointer underline text-left p-0"
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
  primaryAccent,
}) => {

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
      return <Server className="w-5 h-5 text-primary" />;
    } else {
      return <Globe className="w-5 h-5 text-primary" />;
    }
  };

  // Extra content for connection mode display
  const connectionModeContent = (
    <div className="p-5 bg-white rounded-xl border border-slate-200">
      <div className="flex items-center gap-2.5 mb-4">
        {getModeIcon()}
        <h3 className="text-lg font-semibold text-slate-900 m-0">
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
