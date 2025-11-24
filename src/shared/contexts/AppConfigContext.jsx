import { createContext, useContext, useState, useEffect } from 'react';

const AppConfigContext = createContext(null);

export function AppConfigProvider({ children }) {
  const [config, setConfig] = useState({
    isWordPressMode: false,
    apiKeys: {
      gemini: import.meta.env.VITE_GEMINI_API_KEY || '',
      elevenlabs: import.meta.env.VITE_ELEVENLABS_API_KEY || '',
    },
    features: {
      audioRecording: true,
      videoRecording: false,
      pdfExport: true,
      interviewModule: true,
      situationsModule: false, // Will be enabled after implementation
    },
    elevenlabs: {
      agentId: import.meta.env.VITE_ELEVENLABS_AGENT_ID || '',
    },
    branding: {
      companyName: 'KarriereHeld',
      appName: 'Bewerbungstrainer',
      logoUrl: '/logo.png',
    },
  });

  useEffect(() => {
    // Detect if running in WordPress
    const isWP = window.bewerbungstrainerData !== undefined;

    if (isWP) {
      // Override with WordPress configuration
      setConfig(prev => ({
        ...prev,
        isWordPressMode: true,
        apiKeys: {
          gemini: window.bewerbungstrainerData.geminiApiKey || prev.apiKeys.gemini,
          elevenlabs: window.bewerbungstrainerData.elevenlabsApiKey || prev.apiKeys.elevenlabs,
        },
        elevenlabs: {
          agentId: window.bewerbungstrainerData.elevenlabsAgentId || prev.elevenlabs.agentId,
        },
        features: {
          ...prev.features,
          // WordPress may have different feature flags
          pdfExport: window.bewerbungstrainerData.features?.pdfExport ?? prev.features.pdfExport,
        },
      }));
    }
  }, []);

  const updateFeature = (featureName, enabled) => {
    setConfig(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [featureName]: enabled,
      },
    }));
  };

  const value = {
    ...config,
    updateFeature,
  };

  return (
    <AppConfigContext.Provider value={value}>
      {children}
    </AppConfigContext.Provider>
  );
}

export function useAppConfig() {
  const context = useContext(AppConfigContext);
  if (!context) {
    throw new Error('useAppConfig must be used within AppConfigProvider');
  }
  return context;
}
