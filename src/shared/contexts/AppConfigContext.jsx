import { createContext, useContext, useState, useEffect } from 'react';

const AppConfigContext = createContext(null);

/**
 * AppConfigProvider - Manages application configuration
 *
 * Features:
 * - WordPress mode detection
 * - API keys management
 * - Feature flags
 * - Environment-based configuration
 */
export function AppConfigProvider({ children }) {
  const [config, setConfig] = useState({
    isWordPressMode: false,
    apiKeys: {
      gemini: import.meta.env.VITE_GEMINI_API_KEY || '',
      elevenlabs: import.meta.env.VITE_ELEVENLABS_API_KEY || '',
      elevenlabsAgentId: import.meta.env.VITE_ELEVENLABS_AGENT_ID || ''
    },
    apiUrl: '',
    nonce: '',
    features: {
      audioRecording: true,
      videoRecording: false,
      pdfExport: true,
      guestMode: true
    },
    uploadsUrl: ''
  });

  useEffect(() => {
    detectEnvironment();
  }, []);

  /**
   * Detect if running in WordPress and load configuration
   */
  function detectEnvironment() {
    // Check if WordPress config is available
    const isWP = typeof window.bewerbungstrainerConfig !== 'undefined';

    console.log('🔧 [CONFIG] Environment detection:', {
      isWordPress: isWP,
      hasWpConfig: !!window.bewerbungstrainerConfig
    });

    if (isWP) {
      const wpConfig = window.bewerbungstrainerConfig;

      console.log('🔧 [CONFIG] WordPress mode detected');
      console.log('🔧 [CONFIG] WordPress config:', {
        apiUrl: wpConfig.apiUrl,
        hasGeminiKey: !!wpConfig.geminiApiKey,
        hasElevenlabsKey: !!wpConfig.elevenlabsApiKey,
        hasElevenlabsAgentId: !!wpConfig.elevenlabsAgentId
      });

      setConfig(prev => ({
        ...prev,
        isWordPressMode: true,
        apiKeys: {
          gemini: wpConfig.geminiApiKey || prev.apiKeys.gemini,
          elevenlabs: wpConfig.elevenlabsApiKey || prev.apiKeys.elevenlabs,
          elevenlabsAgentId: wpConfig.elevenlabsAgentId || prev.apiKeys.elevenlabsAgentId
        },
        apiUrl: wpConfig.apiUrl || '',
        nonce: wpConfig.nonce || '',
        uploadsUrl: wpConfig.uploadsUrl || ''
      }));
    } else {
      console.log('🔧 [CONFIG] Standalone mode (using .env variables)');
      console.log('🔧 [CONFIG] Environment keys:', {
        hasGeminiKey: !!import.meta.env.VITE_GEMINI_API_KEY,
        hasElevenlabsKey: !!import.meta.env.VITE_ELEVENLABS_API_KEY,
        hasElevenlabsAgentId: !!import.meta.env.VITE_ELEVENLABS_AGENT_ID
      });
    }
  }

  /**
   * Update configuration
   * @param {Object} updates - Configuration updates
   */
  const updateConfig = (updates) => {
    setConfig(prev => ({ ...prev, ...updates }));
    console.log('🔧 [CONFIG] Configuration updated:', updates);
  };

  /**
   * Get API key by name
   * @param {string} keyName - Name of the API key (gemini, elevenlabs, elevenlabsAgentId)
   * @returns {string} API key value
   */
  const getApiKey = (keyName) => {
    return config.apiKeys[keyName] || '';
  };

  /**
   * Check if a feature is enabled
   * @param {string} featureName - Name of the feature
   * @returns {boolean} Feature enabled status
   */
  const isFeatureEnabled = (featureName) => {
    return config.features[featureName] || false;
  };

  const value = {
    config,
    updateConfig,
    getApiKey,
    isFeatureEnabled,
    // Convenience accessors
    isWordPressMode: config.isWordPressMode,
    apiKeys: config.apiKeys,
    features: config.features
  };

  return (
    <AppConfigContext.Provider value={value}>
      {children}
    </AppConfigContext.Provider>
  );
}

/**
 * Hook to access app config context
 * @returns {Object} App config context value
 */
export function useAppConfig() {
  const context = useContext(AppConfigContext);
  if (!context) {
    throw new Error('useAppConfig must be used within AppConfigProvider');
  }
  return context;
}
