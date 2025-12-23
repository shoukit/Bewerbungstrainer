/**
 * Timing Utilities
 *
 * Centralized timing and async control flow utilities.
 */

/**
 * Promise-based delay function
 *
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise<void>} - Resolves after the specified delay
 *
 * @example
 * await delay(1000); // Wait 1 second
 */
export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Delay with cancellation support
 *
 * @param {number} ms - Milliseconds to wait
 * @returns {Object} - { promise, cancel } where cancel() aborts the delay
 *
 * @example
 * const { promise, cancel } = delayWithCancel(5000);
 * setTimeout(cancel, 2000); // Cancel after 2 seconds
 * await promise; // Rejects with 'Cancelled' after 2 seconds
 */
export const delayWithCancel = (ms) => {
  let timeoutId;
  let rejectFn;

  const promise = new Promise((resolve, reject) => {
    rejectFn = reject;
    timeoutId = setTimeout(resolve, ms);
  });

  const cancel = () => {
    clearTimeout(timeoutId);
    rejectFn(new Error('Cancelled'));
  };

  return { promise, cancel };
};

/**
 * Debounce a function
 *
 * @param {Function} fn - Function to debounce
 * @param {number} ms - Debounce delay in ms
 * @returns {Function} - Debounced function
 *
 * @example
 * const debouncedSearch = debounce((query) => search(query), 300);
 */
export const debounce = (fn, ms) => {
  let timeoutId;

  const debounced = (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  };

  debounced.cancel = () => clearTimeout(timeoutId);

  return debounced;
};

/**
 * Throttle a function
 *
 * @param {Function} fn - Function to throttle
 * @param {number} ms - Throttle interval in ms
 * @returns {Function} - Throttled function
 *
 * @example
 * const throttledScroll = throttle(() => updatePosition(), 100);
 */
export const throttle = (fn, ms) => {
  let lastCall = 0;
  let timeoutId;

  return (...args) => {
    const now = Date.now();
    const remaining = ms - (now - lastCall);

    if (remaining <= 0) {
      clearTimeout(timeoutId);
      lastCall = now;
      fn(...args);
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        timeoutId = null;
        fn(...args);
      }, remaining);
    }
  };
};

/**
 * Wait for a condition to be true
 *
 * @param {Function} condition - Function that returns true when ready
 * @param {Object} options - Options
 * @param {number} options.interval - Check interval in ms (default: 100)
 * @param {number} options.timeout - Timeout in ms (default: 10000)
 * @returns {Promise<void>} - Resolves when condition is true
 * @throws {Error} - If timeout is reached
 *
 * @example
 * await waitFor(() => document.getElementById('myElement') !== null);
 */
export const waitFor = async (condition, { interval = 100, timeout = 10000 } = {}) => {
  const startTime = Date.now();

  while (!condition()) {
    if (Date.now() - startTime >= timeout) {
      throw new Error(`waitFor timed out after ${timeout}ms`);
    }
    await delay(interval);
  }
};

/**
 * Execute a function with a timeout
 *
 * @param {Function} fn - Async function to execute
 * @param {number} timeoutMs - Timeout in ms
 * @param {string} errorMessage - Error message on timeout
 * @returns {Promise<*>} - Result of the function
 * @throws {Error} - If timeout is reached
 *
 * @example
 * const result = await withTimeout(fetchData, 5000, 'Fetch timed out');
 */
export const withTimeout = async (fn, timeoutMs, errorMessage = 'Operation timed out') => {
  return Promise.race([
    fn(),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    ),
  ]);
};

/**
 * Sleep for a random duration within a range
 * Useful for avoiding rate limiting patterns
 *
 * @param {number} minMs - Minimum delay in ms
 * @param {number} maxMs - Maximum delay in ms
 * @returns {Promise<void>}
 */
export const randomDelay = (minMs, maxMs) => {
  const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return delay(ms);
};

export default {
  delay,
  delayWithCancel,
  debounce,
  throttle,
  waitFor,
  withTimeout,
  randomDelay,
};
