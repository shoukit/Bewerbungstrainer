<?php
/**
 * Audio Handler Class
 *
 * Handles audio file uploads, downloads, and management
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

class Bewerbungstrainer_Audio_Handler {

    /**
     * Instance of this class
     */
    private static $instance = null;

    /**
     * Audio upload directory
     */
    private $audio_dir;

    /**
     * Audio upload URL
     */
    private $audio_url;

    /**
     * Allowed audio MIME types
     */
    private $allowed_types = array(
        'audio/mpeg',
        'audio/mp3',
        'audio/wav',
        'audio/x-wav',
        'audio/ogg',
        'audio/webm',
    );

    /**
     * Max file size (50MB)
     */
    private $max_file_size = 52428800;

    /**
     * Get singleton instance
     */
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Constructor
     */
    private function __construct() {
        $upload_dir = wp_upload_dir();
        $this->audio_dir = $upload_dir['basedir'] . '/bewerbungstrainer/audio';
        $this->audio_url = $upload_dir['baseurl'] . '/bewerbungstrainer/audio';

        // Ensure directory exists
        if (!file_exists($this->audio_dir)) {
            wp_mkdir_p($this->audio_dir);
        }
    }

    /**
     * Save audio from ElevenLabs API
     *
     * @param string $conversation_id ElevenLabs conversation ID
     * @param string $api_key ElevenLabs API key
     * @return array|WP_Error Array with filename and url, or WP_Error on failure
     */
    public function save_audio_from_elevenlabs($conversation_id, $api_key) {
        // Download audio from ElevenLabs with retry logic
        $audio_data = $this->download_elevenlabs_audio($conversation_id, $api_key);

        if (is_wp_error($audio_data)) {
            return $audio_data;
        }

        // Generate unique filename
        $filename = $this->generate_unique_filename($conversation_id);

        // Save to file
        $file_path = $this->audio_dir . '/' . $filename;
        $result = file_put_contents($file_path, $audio_data);

        if ($result === false) {
            return new WP_Error(
                'file_save_error',
                __('Fehler beim Speichern der Audio-Datei.', 'bewerbungstrainer')
            );
        }

        return array(
            'filename' => $filename,
            'url' => $this->audio_url . '/' . $filename,
            'size' => filesize($file_path),
        );
    }

    /**
     * Download audio from ElevenLabs API with retry logic
     *
     * @param string $conversation_id Conversation ID
     * @param string $api_key API key
     * @param int $max_retries Maximum number of retries
     * @param int $initial_delay Initial delay in seconds
     * @return string|WP_Error Audio data or WP_Error on failure
     */
    private function download_elevenlabs_audio($conversation_id, $api_key, $max_retries = 5, $initial_delay = 2) {
        $url = "https://api.elevenlabs.io/v1/convai/conversations/{$conversation_id}/audio";

        for ($attempt = 0; $attempt <= $max_retries; $attempt++) {
            // Wait before retry (skip on first attempt)
            if ($attempt > 0) {
                $delay = $initial_delay * pow(2, $attempt - 1); // Exponential backoff: 2, 4, 8, 16, 32 seconds
                sleep($delay);
            }

            // Make API request
            $response = wp_remote_get($url, array(
                'headers' => array(
                    'xi-api-key' => $api_key,
                ),
                'timeout' => 30,
            ));

            if (is_wp_error($response)) {
                // Network error, retry
                if ($attempt < $max_retries) {
                    continue;
                }
                return $response;
            }

            $status_code = wp_remote_retrieve_response_code($response);
            $body = wp_remote_retrieve_body($response);

            if ($status_code === 200) {
                // Success!
                return $body;
            }

            // Handle 404 with missing_conversation_audio (audio still processing)
            if ($status_code === 404 && strpos($body, 'missing_conversation_audio') !== false) {
                // Audio not ready yet, retry
                if ($attempt < $max_retries) {
                    continue;
                }

                return new WP_Error(
                    'audio_not_ready',
                    __('Das Gesprächsaudio ist noch nicht verfügbar. Möglicherweise ist die Aufzeichnung in den Agent-Einstellungen nicht aktiviert.', 'bewerbungstrainer')
                );
            }

            // Other error, don't retry
            return new WP_Error(
                'api_error',
                sprintf(
                    __('API-Fehler (%d): %s', 'bewerbungstrainer'),
                    $status_code,
                    $body
                )
            );
        }

        return new WP_Error(
            'max_retries_exceeded',
            __('Audio-Download fehlgeschlagen nach mehreren Versuchen.', 'bewerbungstrainer')
        );
    }

    /**
     * Upload audio from base64 data
     *
     * @param string $base64_data Base64 encoded audio data
     * @param string $session_id Session ID for filename
     * @return array|WP_Error Array with filename and url, or WP_Error on failure
     */
    public function upload_audio_base64($base64_data, $session_id) {
        // Validate base64 data
        if (strpos($base64_data, 'data:audio/') !== 0) {
            return new WP_Error(
                'invalid_data',
                __('Ungültige Audio-Daten.', 'bewerbungstrainer')
            );
        }

        // Extract MIME type and data
        preg_match('/data:(audio\/[^;]+);base64,(.+)/', $base64_data, $matches);

        if (count($matches) !== 3) {
            return new WP_Error(
                'invalid_format',
                __('Ungültiges Datenformat.', 'bewerbungstrainer')
            );
        }

        $mime_type = $matches[1];
        $data = base64_decode($matches[2]);

        if ($data === false) {
            return new WP_Error(
                'decode_error',
                __('Fehler beim Dekodieren der Audio-Daten.', 'bewerbungstrainer')
            );
        }

        // Validate MIME type
        if (!in_array($mime_type, $this->allowed_types)) {
            return new WP_Error(
                'invalid_type',
                __('Ungültiger Audio-Dateityp.', 'bewerbungstrainer')
            );
        }

        // Check file size
        if (strlen($data) > $this->max_file_size) {
            return new WP_Error(
                'file_too_large',
                sprintf(
                    __('Datei ist zu groß. Maximum: %s', 'bewerbungstrainer'),
                    size_format($this->max_file_size)
                )
            );
        }

        // Generate unique filename
        $filename = $this->generate_unique_filename($session_id, $mime_type);

        // Save to file
        $file_path = $this->audio_dir . '/' . $filename;
        $result = file_put_contents($file_path, $data);

        if ($result === false) {
            return new WP_Error(
                'file_save_error',
                __('Fehler beim Speichern der Audio-Datei.', 'bewerbungstrainer')
            );
        }

        return array(
            'filename' => $filename,
            'url' => $this->audio_url . '/' . $filename,
            'size' => filesize($file_path),
        );
    }

    /**
     * Delete audio file
     *
     * @param string $filename Audio filename
     * @return bool True on success, false on failure
     */
    public function delete_audio($filename) {
        // Sanitize filename
        $filename = sanitize_file_name($filename);

        // Construct file path
        $file_path = $this->audio_dir . '/' . $filename;

        // Check if file exists
        if (!file_exists($file_path)) {
            return false;
        }

        // Delete file
        return unlink($file_path);
    }

    /**
     * Get audio file URL
     *
     * @param string $filename Audio filename
     * @return string|false Audio URL or false if file doesn't exist
     */
    public function get_audio_url($filename) {
        $filename = sanitize_file_name($filename);
        $file_path = $this->audio_dir . '/' . $filename;

        if (!file_exists($file_path)) {
            return false;
        }

        return $this->audio_url . '/' . $filename;
    }

    /**
     * Check if audio file exists
     *
     * @param string $filename Audio filename
     * @return bool True if exists, false otherwise
     */
    public function audio_exists($filename) {
        $filename = sanitize_file_name($filename);
        $file_path = $this->audio_dir . '/' . $filename;

        return file_exists($file_path);
    }

    /**
     * Generate unique filename
     *
     * @param string $identifier Unique identifier (session ID, conversation ID, etc.)
     * @param string $mime_type MIME type (optional, defaults to mp3)
     * @return string Unique filename
     */
    private function generate_unique_filename($identifier, $mime_type = 'audio/mpeg') {
        // Map MIME types to extensions
        $extensions = array(
            'audio/mpeg' => 'mp3',
            'audio/mp3' => 'mp3',
            'audio/wav' => 'wav',
            'audio/x-wav' => 'wav',
            'audio/ogg' => 'ogg',
            'audio/webm' => 'webm',
        );

        $extension = isset($extensions[$mime_type]) ? $extensions[$mime_type] : 'mp3';

        // Generate filename: {user_id}_{identifier}_{timestamp}.{extension}
        $user_id = get_current_user_id();
        $timestamp = time();
        $safe_identifier = sanitize_file_name($identifier);

        return "{$user_id}_{$safe_identifier}_{$timestamp}.{$extension}";
    }

    /**
     * Clean up old audio files (for maintenance)
     *
     * @param int $days Delete files older than X days
     * @return int Number of files deleted
     */
    public function cleanup_old_files($days = 90) {
        $files = glob($this->audio_dir . '/*');
        $deleted_count = 0;
        $cutoff_time = time() - ($days * DAY_IN_SECONDS);

        foreach ($files as $file) {
            if (is_file($file) && filemtime($file) < $cutoff_time) {
                if (unlink($file)) {
                    $deleted_count++;
                }
            }
        }

        return $deleted_count;
    }

    /**
     * Get audio directory path
     *
     * @return string Directory path
     */
    public function get_audio_dir() {
        return $this->audio_dir;
    }

    /**
     * Get audio directory URL
     *
     * @return string Directory URL
     */
    public function get_audio_url_base() {
        return $this->audio_url;
    }
}
