/**
 * Dial Tone Generator
 *
 * Generates a realistic German dial tone (Freizeichen) using Web Audio API.
 * German dial tone: 425 Hz, 1 second on, 4 seconds off pattern
 * We use a faster pattern for better UX during connection.
 */

let audioContext = null;
let oscillator = null;
let gainNode = null;
let isPlaying = false;
let intervalId = null;

/**
 * Initialize the audio context (must be called after user interaction)
 */
function initAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    console.log('[DIAL_TONE] AudioContext created, state:', audioContext.state);
  }
  return audioContext;
}

/**
 * Start playing the dial tone
 * @param {Object} options - Configuration options
 * @param {number} options.frequency - Tone frequency in Hz (default: 425 for German)
 * @param {number} options.onDuration - Duration of tone in ms (default: 1000)
 * @param {number} options.offDuration - Duration of silence in ms (default: 4000)
 * @param {number} options.volume - Volume from 0 to 1 (default: 0.3)
 */
export async function startDialTone(options = {}) {
  const {
    frequency = 425,      // German standard dial tone frequency
    onDuration = 1000,    // 1 second on
    offDuration = 4000,   // 4 seconds off (standard German pattern)
    volume = 0.3,         // Volume (increased for audibility)
  } = options;

  if (isPlaying) {
    console.log('[DIAL_TONE] Already playing, skipping');
    return;
  }

  try {
    const ctx = initAudioContext();

    // Resume context if suspended (browser autoplay policy)
    if (ctx.state === 'suspended') {
      console.log('[DIAL_TONE] Resuming suspended AudioContext...');
      await ctx.resume();
      console.log('[DIAL_TONE] AudioContext resumed, state:', ctx.state);
    }

    // Create and connect gain node
    gainNode = ctx.createGain();
    gainNode.connect(ctx.destination);
    gainNode.gain.value = volume; // Set initial volume

    isPlaying = true;
    console.log('[DIAL_TONE] Started with frequency:', frequency, 'Hz');

    // Function to create and play a single tone burst
    const playToneBurst = () => {
      if (!isPlaying || !audioContext) {
        console.log('[DIAL_TONE] Skipping burst - not playing or no context');
        return;
      }

      try {
        // Create new oscillator for each burst
        oscillator = ctx.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        oscillator.connect(gainNode);

        // Start the oscillator
        oscillator.start();
        console.log('[DIAL_TONE] Tone burst started');

        // Schedule stop after onDuration
        setTimeout(() => {
          if (oscillator && isPlaying) {
            try {
              oscillator.stop();
              oscillator.disconnect();
              console.log('[DIAL_TONE] Tone burst ended');
            } catch (e) {
              // Oscillator already stopped
            }
            oscillator = null;
          }
        }, onDuration);
      } catch (e) {
        console.error('[DIAL_TONE] Error in playToneBurst:', e);
      }
    };

    // Play first burst immediately
    playToneBurst();

    // Schedule subsequent bursts
    intervalId = setInterval(playToneBurst, onDuration + offDuration);

  } catch (error) {
    console.error('[DIAL_TONE] Error starting:', error);
    isPlaying = false;
  }
}

/**
 * Stop the dial tone
 */
export function stopDialTone() {
  if (!isPlaying) {
    console.log('[DIAL_TONE] Not playing, nothing to stop');
    return;
  }

  console.log('[DIAL_TONE] Stopping...');
  isPlaying = false;

  // Clear the interval
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }

  // Stop oscillator
  if (oscillator) {
    try {
      oscillator.stop();
      oscillator.disconnect();
    } catch (e) {
      // Already stopped
    }
    oscillator = null;
  }

  // Disconnect gain node
  if (gainNode) {
    try {
      gainNode.disconnect();
    } catch (e) {
      // Already disconnected
    }
    gainNode = null;
  }

  console.log('[DIAL_TONE] Stopped');
}

/**
 * Check if dial tone is currently playing
 */
export function isDialTonePlaying() {
  return isPlaying;
}

/**
 * Cleanup and close audio context
 */
export function cleanupDialTone() {
  stopDialTone();
  if (audioContext && audioContext.state !== 'closed') {
    audioContext.close();
    audioContext = null;
  }
}

export default {
  start: startDialTone,
  stop: stopDialTone,
  isPlaying: isDialTonePlaying,
  cleanup: cleanupDialTone,
};
