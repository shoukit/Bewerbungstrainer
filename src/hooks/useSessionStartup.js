import { useState, useCallback } from 'react';
import { usePartner } from '@/context/PartnerContext';

/**
 * useSessionStartup Hook
 *
 * Abstracts common session startup logic used across DeviceSetup components.
 * Handles:
 * - Loading state (isSubmitting)
 * - Error state (submitError)
 * - Demo code from partner context
 * - Async session creation with error handling
 *
 * @returns {Object} Hook state and functions
 * @property {boolean} isSubmitting - Whether a session is being created
 * @property {string|null} submitError - Error message if session creation failed
 * @property {string|null} demoCode - Demo code from partner context
 * @property {Function} startSession - Async function to start session with error handling
 * @property {Function} clearError - Function to clear the current error
 *
 * @example
 * const { isSubmitting, submitError, demoCode, startSession, clearError } = useSessionStartup();
 *
 * const handleStart = async ({ selectedMicrophoneId }) => {
 *   await startSession(async () => {
 *     const session = await createSession({ demoCode });
 *     return {
 *       session,
 *       selectedMicrophoneId,
 *     };
 *   }, (result) => {
 *     onStart(result);
 *   });
 * };
 */
const useSessionStartup = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const { demoCode } = usePartner();

  /**
   * Execute an async session creation with loading state and error handling
   *
   * @param {Function} asyncFn - Async function that creates the session
   * @param {Function} onSuccess - Callback when session is created successfully
   * @param {Function} [onError] - Optional callback when an error occurs
   */
  const startSession = useCallback(async (asyncFn, onSuccess, onError) => {
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const result = await asyncFn();
      // Don't set isSubmitting to false here - let the parent handle navigation
      onSuccess(result);
    } catch (err) {
      console.error('[useSessionStartup] Error:', err);
      const errorMessage = err.message || 'Ein Fehler ist aufgetreten';
      setSubmitError(errorMessage);
      setIsSubmitting(false);
      onError?.(err);
    }
  }, []);

  /**
   * Clear the current error message
   */
  const clearError = useCallback(() => {
    setSubmitError(null);
  }, []);

  return {
    isSubmitting,
    submitError,
    demoCode,
    startSession,
    clearError,
  };
};

export default useSessionStartup;
