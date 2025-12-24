/**
 * Audio Utilities
 *
 * Centralized utilities for audio file handling, encoding, and conversion.
 */

/**
 * Common audio MIME types
 */
export const AUDIO_MIME_TYPES = {
  WEBM: 'audio/webm',
  WEBM_OPUS: 'audio/webm;codecs=opus',
  MP3: 'audio/mpeg',
  WAV: 'audio/wav',
  OGG: 'audio/ogg',
  M4A: 'audio/mp4',
  AAC: 'audio/aac',
};

/**
 * Convert a File or Blob to base64 string
 *
 * @param {File|Blob} file - Audio file to convert
 * @returns {Promise<string>} - Base64 encoded string (without data URI prefix)
 *
 * @example
 * const base64 = await fileToBase64(audioBlob);
 */
export async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      // Remove the data URI prefix (e.g., "data:audio/webm;base64,")
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file as base64'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Convert a File or Blob to base64 with inline data format for Gemini API
 *
 * @param {File|Blob} audioFile - Audio file to convert
 * @returns {Promise<Object>} - Object with inlineData containing base64 and mimeType
 *
 * @example
 * const inlineData = await audioFileToInlineData(audioBlob);
 * // Returns: { inlineData: { data: "...", mimeType: "audio/webm" } }
 */
export async function audioFileToInlineData(audioFile) {
  const base64 = await fileToBase64(audioFile);

  return {
    inlineData: {
      data: base64,
      mimeType: audioFile.type || AUDIO_MIME_TYPES.WEBM,
    },
  };
}

/**
 * Alias for backward compatibility
 * @deprecated Use audioFileToInlineData instead
 */
export const audioFileToBase64 = audioFileToInlineData;

/**
 * Convert a base64 string to a Blob
 *
 * @param {string} base64 - Base64 encoded string
 * @param {string} mimeType - MIME type for the blob (default: audio/webm)
 * @returns {Blob} - Blob object
 *
 * @example
 * const blob = base64ToBlob(base64String, 'audio/webm');
 */
export function base64ToBlob(base64, mimeType = AUDIO_MIME_TYPES.WEBM) {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

/**
 * Convert a base64 data URI to a Blob
 *
 * @param {string} dataUri - Base64 data URI (e.g., "data:audio/webm;base64,...")
 * @returns {Blob} - Blob object
 */
export function dataUriToBlob(dataUri) {
  const [header, base64] = dataUri.split(',');
  const mimeType = header.match(/:(.*?);/)?.[1] || AUDIO_MIME_TYPES.WEBM;
  return base64ToBlob(base64, mimeType);
}

/**
 * Get the duration of an audio file in seconds
 *
 * @param {Blob|File|string} audio - Audio blob, file, or URL
 * @returns {Promise<number>} - Duration in seconds
 */
export async function getAudioDuration(audio) {
  return new Promise((resolve, reject) => {
    const audioElement = new Audio();

    audioElement.onloadedmetadata = () => {
      resolve(audioElement.duration);
    };

    audioElement.onerror = () => {
      reject(new Error('Failed to load audio for duration'));
    };

    if (audio instanceof Blob || audio instanceof File) {
      audioElement.src = URL.createObjectURL(audio);
    } else {
      audioElement.src = audio;
    }
  });
}

/**
 * Check if a MIME type is supported for recording
 *
 * @param {string} mimeType - MIME type to check
 * @returns {boolean} - True if supported
 */
export function isMimeTypeSupported(mimeType) {
  if (typeof MediaRecorder === 'undefined') {
    return false;
  }
  return MediaRecorder.isTypeSupported(mimeType);
}

/**
 * Get the best supported MIME type for audio recording
 *
 * @param {string[]} preferredTypes - Ordered list of preferred MIME types
 * @returns {string|null} - First supported MIME type or null
 */
export function getBestSupportedMimeType(preferredTypes = [
  AUDIO_MIME_TYPES.WEBM_OPUS,
  AUDIO_MIME_TYPES.WEBM,
  AUDIO_MIME_TYPES.OGG,
  AUDIO_MIME_TYPES.MP3,
]) {
  for (const mimeType of preferredTypes) {
    if (isMimeTypeSupported(mimeType)) {
      return mimeType;
    }
  }
  return null;
}

/**
 * Create an object URL for an audio blob with automatic cleanup
 *
 * @param {Blob} blob - Audio blob
 * @returns {Object} - { url, revoke } where revoke() cleans up the URL
 */
export function createAudioUrl(blob) {
  const url = URL.createObjectURL(blob);

  return {
    url,
    revoke: () => URL.revokeObjectURL(url),
  };
}

/**
 * Validate that a blob is a valid audio file
 *
 * @param {Blob} blob - Blob to validate
 * @param {Object} options - Validation options
 * @param {number} options.minSize - Minimum size in bytes (default: 100)
 * @param {number} options.maxSize - Maximum size in bytes (default: 100MB)
 * @param {string[]} options.allowedTypes - Allowed MIME types
 * @returns {Object} - { valid: boolean, error?: string }
 */
export function validateAudioBlob(blob, options = {}) {
  const {
    minSize = 100,
    maxSize = 100 * 1024 * 1024, // 100MB
    allowedTypes = Object.values(AUDIO_MIME_TYPES),
  } = options;

  if (!blob) {
    return { valid: false, error: 'Keine Audio-Datei vorhanden' };
  }

  if (blob.size < minSize) {
    return { valid: false, error: 'Audio-Datei ist zu klein oder leer' };
  }

  if (blob.size > maxSize) {
    return { valid: false, error: 'Audio-Datei ist zu groß' };
  }

  if (allowedTypes.length > 0 && blob.type) {
    const isAllowed = allowedTypes.some(type =>
      blob.type.startsWith(type.split(';')[0])
    );
    if (!isAllowed) {
      return { valid: false, error: `Audio-Format nicht unterstützt: ${blob.type}` };
    }
  }

  return { valid: true };
}

export default {
  AUDIO_MIME_TYPES,
  fileToBase64,
  audioFileToInlineData,
  audioFileToBase64,
  base64ToBlob,
  dataUriToBlob,
  getAudioDuration,
  isMimeTypeSupported,
  getBestSupportedMimeType,
  createAudioUrl,
  validateAudioBlob,
};
