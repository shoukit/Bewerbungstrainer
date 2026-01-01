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
export function startDialTone(options = {}) {
  const {
    frequency = 425,      // German standard dial tone frequency
    onDuration = 1000,    // 1 second on
    offDuration = 4000,   // 4 seconds off (standard German pattern)
    volume = 0.25,        // Moderate volume
  } = options;

  if (isPlaying) return;

  try {
    const ctx = initAudioContext();

    // Resume context if suspended (browser autoplay policy)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    gainNode = ctx.createGain();
    gainNode.connect(ctx.destination);
    gainNode.gain.value = 0; // Start silent

    isPlaying = true;

    // Function to create and play a single tone burst
    const playToneBurst = () => {
      if (!isPlaying) return;

      // Create new oscillator for each burst
      oscillator = ctx.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      oscillator.connect(gainNode);

      // Fade in
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.02);

      oscillator.start();

      // Schedule fade out and stop
      setTimeout(() => {
        if (gainNode && isPlaying) {
          gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.02);
        }
        setTimeout(() => {
          if (oscillator) {
            try {
              oscillator.stop();
              oscillator.disconnect();
            } catch (e) {
              // Oscillator already stopped
            }
          }
        }, 30);
      }, onDuration - 30);
    };

    // Play first burst immediately
    playToneBurst();

    // Schedule subsequent bursts
    intervalId = setInterval(playToneBurst, onDuration + offDuration);

    console.log('[DIAL_TONE] Started');
  } catch (error) {
    console.error('[DIAL_TONE] Error starting:', error);
    isPlaying = false;
  }
}

/**
 * Stop the dial tone
 */
export function stopDialTone() {
  if (!isPlaying) return;

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

  // Fade out gain
  if (gainNode) {
    try {
      gainNode.gain.setValueAtTime(gainNode.gain.value, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.05);
    } catch (e) {
      // Context closed
    }
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
  gainNode = null;
}

export default {
  start: startDialTone,
  stop: stopDialTone,
  isPlaying: isDialTonePlaying,
  cleanup: cleanupDialTone,
};
