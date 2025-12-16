/**
 * WebSocket Connectivity Test Service
 *
 * Tests if WebSocket connections to ElevenLabs are possible.
 * Used to detect corporate firewalls that block WebSocket.
 * Also tests proxy connectivity for firewall bypass.
 */

// Proxy server URL
const PROXY_URL = 'wss://karriereheld-ws-proxy.onrender.com/ws';

/**
 * Test WebSocket connectivity to ElevenLabs
 *
 * @param {string} agentId - ElevenLabs Agent ID
 * @param {number} timeoutMs - Timeout in milliseconds (default: 5000)
 * @returns {Promise<{success: boolean, error?: string, latency?: number}>}
 */
export async function testWebSocketConnectivity(agentId, timeoutMs = 5000) {
  console.log('[WebSocketTest] Starting connectivity test...');

  if (!agentId) {
    return {
      success: false,
      error: 'No agent ID provided',
    };
  }

  const wsUrl = `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${agentId}`;
  const startTime = Date.now();

  return new Promise((resolve) => {
    let ws = null;
    let resolved = false;

    const cleanup = () => {
      if (ws) {
        try {
          ws.close();
        } catch (e) {
          // Ignore close errors
        }
        ws = null;
      }
    };

    const resolveOnce = (result) => {
      if (!resolved) {
        resolved = true;
        cleanup();
        resolve(result);
      }
    };

    // Timeout handler
    const timeoutId = setTimeout(() => {
      console.log('[WebSocketTest] Connection timeout after', timeoutMs, 'ms');
      resolveOnce({
        success: false,
        error: 'Connection timeout - WebSocket may be blocked by firewall',
      });
    }, timeoutMs);

    try {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        clearTimeout(timeoutId);
        const latency = Date.now() - startTime;
        console.log('[WebSocketTest] Connection successful! Latency:', latency, 'ms');

        // Close immediately - we just wanted to test connectivity
        resolveOnce({
          success: true,
          latency: latency,
        });
      };

      ws.onerror = (error) => {
        clearTimeout(timeoutId);
        console.log('[WebSocketTest] Connection error:', error);
        resolveOnce({
          success: false,
          error: 'WebSocket connection failed - may be blocked by firewall',
        });
      };

      ws.onclose = (event) => {
        clearTimeout(timeoutId);
        // If we already resolved successfully, ignore close
        if (!resolved) {
          console.log('[WebSocketTest] Connection closed:', event.code, event.reason);
          // Code 1000 is normal close, anything else might indicate a problem
          if (event.code === 1000) {
            resolveOnce({
              success: true,
              latency: Date.now() - startTime,
            });
          } else {
            resolveOnce({
              success: false,
              error: `Connection closed: ${event.code} ${event.reason || ''}`.trim(),
            });
          }
        }
      };

    } catch (error) {
      clearTimeout(timeoutId);
      console.log('[WebSocketTest] Exception:', error);
      resolveOnce({
        success: false,
        error: error.message || 'Failed to create WebSocket connection',
      });
    }
  });
}

/**
 * Test WebSocket connectivity to our proxy server
 *
 * @param {string} agentId - ElevenLabs Agent ID (used for the connection)
 * @param {number} timeoutMs - Timeout in milliseconds (default: 5000)
 * @returns {Promise<{success: boolean, error?: string, latency?: number}>}
 */
export async function testProxyConnectivity(agentId, timeoutMs = 5000) {
  console.log('[WebSocketTest] Testing proxy connectivity...');

  if (!agentId) {
    return {
      success: false,
      error: 'No agent ID provided',
    };
  }

  const wsUrl = `${PROXY_URL}?agent_id=${agentId}`;
  const startTime = Date.now();

  return new Promise((resolve) => {
    let ws = null;
    let resolved = false;

    const cleanup = () => {
      if (ws) {
        try {
          ws.close();
        } catch (e) {
          // Ignore close errors
        }
        ws = null;
      }
    };

    const resolveOnce = (result) => {
      if (!resolved) {
        resolved = true;
        cleanup();
        resolve(result);
      }
    };

    // Timeout handler
    const timeoutId = setTimeout(() => {
      console.log('[WebSocketTest] Proxy connection timeout after', timeoutMs, 'ms');
      resolveOnce({
        success: false,
        error: 'Proxy connection timeout',
      });
    }, timeoutMs);

    try {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        clearTimeout(timeoutId);
        const latency = Date.now() - startTime;
        console.log('[WebSocketTest] Proxy connection successful! Latency:', latency, 'ms');

        // Close immediately - we just wanted to test connectivity
        resolveOnce({
          success: true,
          latency: latency,
        });
      };

      ws.onerror = (error) => {
        clearTimeout(timeoutId);
        console.log('[WebSocketTest] Proxy connection error:', error);
        resolveOnce({
          success: false,
          error: 'Proxy connection failed',
        });
      };

      ws.onclose = (event) => {
        clearTimeout(timeoutId);
        if (!resolved) {
          console.log('[WebSocketTest] Proxy connection closed:', event.code, event.reason);
          if (event.code === 1000) {
            resolveOnce({
              success: true,
              latency: Date.now() - startTime,
            });
          } else {
            resolveOnce({
              success: false,
              error: `Proxy connection closed: ${event.code}`,
            });
          }
        }
      };

    } catch (error) {
      clearTimeout(timeoutId);
      console.log('[WebSocketTest] Proxy exception:', error);
      resolveOnce({
        success: false,
        error: error.message || 'Failed to connect to proxy',
      });
    }
  });
}

/**
 * Check if browser supports WebSocket
 *
 * @returns {boolean}
 */
export function supportsWebSocket() {
  return typeof WebSocket !== 'undefined';
}

/**
 * Get cached WebSocket test result or perform new test
 *
 * Results are cached for 5 minutes to avoid repeated tests.
 *
 * @param {string} agentId - ElevenLabs Agent ID
 * @param {boolean} forceRetest - Force a new test even if cached
 * @returns {Promise<{success: boolean, error?: string, latency?: number, cached?: boolean}>}
 */
export async function getCachedWebSocketTest(agentId, forceRetest = false) {
  const CACHE_KEY = 'websocket_test_result';
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  if (!forceRetest) {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const { result, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          console.log('[WebSocketTest] Using cached result');
          return { ...result, cached: true };
        }
      }
    } catch (e) {
      // Ignore cache errors
    }
  }

  const result = await testWebSocketConnectivity(agentId);

  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({
      result,
      timestamp: Date.now(),
    }));
  } catch (e) {
    // Ignore cache errors
  }

  return result;
}

/**
 * Determine the best connection mode based on WebSocket tests
 *
 * Priority: websocket (direct) > proxy
 * If both fail, returns proxy mode with error (UI will show error state)
 *
 * @param {string} agentId - ElevenLabs Agent ID
 * @returns {Promise<{mode: 'websocket' | 'proxy', directAvailable: boolean, proxyAvailable: boolean, directLatency?: number, proxyLatency?: number, error?: string}>}
 */
export async function detectBestConnectionMode(agentId) {
  if (!supportsWebSocket()) {
    console.log('[WebSocketTest] Browser does not support WebSocket');
    return {
      mode: 'proxy', // Will show error in UI
      directAvailable: false,
      proxyAvailable: false,
      error: 'Browser unterstützt keine WebSocket-Verbindungen',
    };
  }

  // Test direct connection first
  const directResult = await testWebSocketConnectivity(agentId, 5000);

  if (directResult.success) {
    console.log('[WebSocketTest] Direct WebSocket available, using websocket mode');
    return {
      mode: 'websocket',
      directAvailable: true,
      proxyAvailable: false, // Not tested yet
      directLatency: directResult.latency,
    };
  }

  // Direct failed - test proxy
  console.log('[WebSocketTest] Direct WebSocket failed, testing proxy...');
  const proxyResult = await testProxyConnectivity(agentId, 5000);

  if (proxyResult.success) {
    console.log('[WebSocketTest] Proxy available, using proxy mode');
    return {
      mode: 'proxy',
      directAvailable: false,
      proxyAvailable: true,
      proxyLatency: proxyResult.latency,
      error: directResult.error, // Note why direct failed
    };
  }

  // Both failed - return proxy mode with error (UI will show error state)
  console.log('[WebSocketTest] All WebSocket connections blocked');
  return {
    mode: 'proxy', // Default, UI will show error since proxyAvailable is false
    directAvailable: false,
    proxyAvailable: false,
    error: 'Alle WebSocket-Verbindungen werden durch Firewall blockiert',
  };
}

/**
 * Get proxy URL
 * @returns {string}
 */
export function getProxyUrl() {
  return PROXY_URL;
}

export default {
  testWebSocketConnectivity,
  testProxyConnectivity,
  supportsWebSocket,
  getCachedWebSocketTest,
  detectBestConnectionMode,
  getProxyUrl,
};
