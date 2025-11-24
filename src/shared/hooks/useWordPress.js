import { useState, useCallback } from 'react';
import wordpressApi from '@/shared/services/api/wordpressApi';

/**
 * Hook for WordPress API interactions
 * Provides loading states and error handling for WordPress API calls
 */
export function useWordPress() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRequest = useCallback(async (requestFn) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await requestFn();
      return result;
    } catch (err) {
      setError(err.message || 'API request failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sessions
  const createSession = useCallback((sessionData) =>
    handleRequest(() => wordpressApi.createSession(sessionData)),
    [handleRequest]
  );

  const getSession = useCallback((sessionId) =>
    handleRequest(() => wordpressApi.getSession(sessionId)),
    [handleRequest]
  );

  const getSessions = useCallback((params) =>
    handleRequest(() => wordpressApi.getSessions(params)),
    [handleRequest]
  );

  const updateSession = useCallback((sessionId, data) =>
    handleRequest(() => wordpressApi.updateSession(sessionId, data)),
    [handleRequest]
  );

  const deleteSession = useCallback((sessionId) =>
    handleRequest(() => wordpressApi.deleteSession(sessionId)),
    [handleRequest]
  );

  // Audio
  const saveAudioFromElevenLabs = useCallback((conversationId, sessionId) =>
    handleRequest(() => wordpressApi.saveAudioFromElevenLabs(conversationId, sessionId)),
    [handleRequest]
  );

  const uploadAudio = useCallback((audioData, sessionId) =>
    handleRequest(() => wordpressApi.uploadAudio(audioData, sessionId)),
    [handleRequest]
  );

  // User
  const getUserInfo = useCallback(() =>
    handleRequest(() => wordpressApi.getUserInfo()),
    [handleRequest]
  );

  // Settings
  const getSettings = useCallback(() =>
    handleRequest(() => wordpressApi.getSettings()),
    [handleRequest]
  );

  // Helpers
  const isWordPress = useCallback(() =>
    wordpressApi.isWordPress(),
    []
  );

  const getCurrentUser = useCallback(() =>
    wordpressApi.getCurrentUser(),
    []
  );

  return {
    isLoading,
    error,
    // Sessions
    createSession,
    getSession,
    getSessions,
    updateSession,
    deleteSession,
    // Audio
    saveAudioFromElevenLabs,
    uploadAudio,
    // User
    getUserInfo,
    getCurrentUser,
    // Settings
    getSettings,
    // Helpers
    isWordPress,
  };
}
