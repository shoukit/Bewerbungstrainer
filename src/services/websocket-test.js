/**
 * WebSocket Connectivity Test Service
 *
 * Tests if WebSocket connections to ElevenLabs are possible.
 * Used to detect corporate firewalls that block WebSocket.
 */

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
 * Determine the best connection mode based on WebSocket test
 *
 * @param {string} agentId - ElevenLabs Agent ID
 * @returns {Promise<'websocket' | 'corporate'>}
 */
export async function detectBestConnectionMode(agentId) {
  if (!supportsWebSocket()) {
    console.log('[WebSocketTest] Browser does not support WebSocket, using corporate mode');
    return 'corporate';
  }

  const result = await getCachedWebSocketTest(agentId);

  if (result.success) {
    console.log('[WebSocketTest] WebSocket available, using live mode');
    return 'websocket';
  } else {
    console.log('[WebSocketTest] WebSocket blocked, using corporate mode:', result.error);
    return 'corporate';
  }
}

export default {
  testWebSocketConnectivity,
  supportsWebSocket,
  getCachedWebSocketTest,
  detectBestConnectionMode,
};
