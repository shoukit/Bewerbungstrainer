/**
 * Retry Utilities
 *
 * Centralized retry logic with exponential backoff for API calls
 * and other async operations that may fail transiently.
 */

import { delay } from './timing';

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG = {
  maxAttempts: 5,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 1.5,
  shouldRetry: () => true,
};

/**
 * Retry a function with exponential backoff
 *
 * @param {Function} fn - Async function to retry
 * @param {Object} options - Retry options
 * @param {number} options.maxAttempts - Maximum retry attempts (default: 5)
 * @param {number} options.initialDelayMs - Initial delay in ms (default: 1000)
 * @param {number} options.maxDelayMs - Maximum delay cap in ms (default: 30000)
 * @param {number} options.backoffMultiplier - Delay multiplier (default: 1.5)
 * @param {Function} options.shouldRetry - Function(error, attempt) => boolean to determine if should retry
 * @param {Function} options.onRetry - Optional callback(error, attempt, delayMs) called before each retry
 * @returns {Promise<*>} - Result of the function
 * @throws {Error} - Last error if all retries fail
 *
 * @example
 * const data = await retryWithBackoff(
 *   () => fetch('/api/data').then(r => r.json()),
 *   { maxAttempts: 3, initialDelayMs: 1000 }
 * );
 */
export async function retryWithBackoff(fn, options = {}) {
  const config = { ...DEFAULT_RETRY_CONFIG, ...options };
  const {
    maxAttempts,
    initialDelayMs,
    maxDelayMs,
    backoffMultiplier,
    shouldRetry,
    onRetry,
  } = config;

  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn(attempt);
    } catch (error) {
      lastError = error;

      // Check if we should retry
      const canRetry = attempt < maxAttempts && shouldRetry(error, attempt);

      if (!canRetry) {
        break;
      }

      // Calculate delay with exponential backoff
      const delayMs = Math.min(
        initialDelayMs * Math.pow(backoffMultiplier, attempt - 1),
        maxDelayMs
      );

      // Call onRetry callback if provided
      if (onRetry) {
        onRetry(error, attempt, delayMs);
      }

      await delay(delayMs);
    }
  }

  throw lastError;
}

/**
 * Retry specifically for HTTP requests with status code handling
 *
 * @param {Function} fetchFn - Async function that performs the fetch
 * @param {Object} options - Retry options (extends retryWithBackoff options)
 * @param {number[]} options.retryableStatuses - HTTP status codes that should trigger retry (default: [408, 429, 500, 502, 503, 504])
 * @param {number[]} options.fatalStatuses - HTTP status codes that should NOT retry (default: [400, 401, 403, 404])
 * @returns {Promise<Response>} - Fetch response
 */
export async function retryFetch(fetchFn, options = {}) {
  const {
    retryableStatuses = [408, 429, 500, 502, 503, 504],
    fatalStatuses = [400, 401, 403],
    ...retryOptions
  } = options;

  return retryWithBackoff(fetchFn, {
    ...retryOptions,
    shouldRetry: (error, attempt) => {
      // Network errors should retry
      if (error.name === 'TypeError' || error.message?.includes('network')) {
        return true;
      }

      // Check HTTP status if available
      if (error.status) {
        if (fatalStatuses.includes(error.status)) {
          return false;
        }
        if (retryableStatuses.includes(error.status)) {
          return true;
        }
      }

      // Default: check user-provided shouldRetry or retry
      if (options.shouldRetry) {
        return options.shouldRetry(error, attempt);
      }

      return true;
    },
  });
}

/**
 * Retry for audio/media downloads that may not be immediately available
 * Optimized for ElevenLabs audio download pattern
 *
 * @param {Function} fetchFn - Async function that fetches the audio
 * @param {Object} options - Retry options
 * @param {number} options.maxAttempts - Maximum attempts (default: 10)
 * @param {number} options.initialDelayMs - Initial delay (default: 3000)
 * @returns {Promise<Blob>} - Audio blob
 */
export async function retryAudioDownload(fetchFn, options = {}) {
  const config = {
    maxAttempts: 10,
    initialDelayMs: 3000,
    backoffMultiplier: 1.2,
    maxDelayMs: 10000,
    ...options,
  };

  return retryWithBackoff(fetchFn, {
    ...config,
    shouldRetry: (error, attempt) => {
      // 404 usually means audio not ready yet - keep retrying
      if (error.status === 404 || error.message?.includes('404')) {
        return true;
      }

      // Auth errors should not retry
      if (error.status === 401 || error.status === 403) {
        return false;
      }

      // Network errors and empty responses should retry
      if (error.message?.includes('empty') || error.message?.includes('network')) {
        return true;
      }

      return options.shouldRetry ? options.shouldRetry(error, attempt) : true;
    },
  });
}

/**
 * Simple retry without backoff (constant delay)
 *
 * @param {Function} fn - Async function to retry
 * @param {number} maxAttempts - Maximum attempts
 * @param {number} delayMs - Delay between attempts in ms
 * @returns {Promise<*>} - Result of the function
 */
export async function retrySimple(fn, maxAttempts = 3, delayMs = 1000) {
  return retryWithBackoff(fn, {
    maxAttempts,
    initialDelayMs: delayMs,
    backoffMultiplier: 1, // No backoff
  });
}

export default {
  retryWithBackoff,
  retryFetch,
  retryAudioDownload,
  retrySimple,
  DEFAULT_RETRY_CONFIG,
};
