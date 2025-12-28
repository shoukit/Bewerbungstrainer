<?php
/**
 * Whisper Handler
 *
 * Handles audio transcription via OpenAI Whisper API
 *
 * @package Bewerbungstrainer
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Whisper Handler Class
 */
class Bewerbungstrainer_Whisper_Handler {

    /**
     * Instance of this class
     */
    private static $instance = null;

    /**
     * Whisper API endpoint
     */
    const API_URL = 'https://api.openai.com/v1/audio/transcriptions';

    /**
     * Whisper model to use
     */
    const MODEL = 'whisper-1';

    /**
     * Default language (German)
     */
    const DEFAULT_LANGUAGE = 'de';

    /**
     * Maximum file size (25MB)
     */
    const MAX_FILE_SIZE = 25 * 1024 * 1024;

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
        // Nothing to initialize
    }

    /**
     * Get OpenAI API key from settings
     *
     * @return string|WP_Error API key or error
     */
    private function get_api_key() {
        $api_key = get_option('bewerbungstrainer_openai_api_key', '');

        if (empty($api_key)) {
            return new WP_Error(
                'missing_api_key',
                __('OpenAI API Key nicht konfiguriert. Bitte in den Plugin-Einstellungen hinterlegen.', 'bewerbungstrainer'),
                array('status' => 500)
            );
        }

        return $api_key;
    }

    /**
     * Check if Whisper is available (API key configured)
     *
     * @return bool True if Whisper can be used
     */
    public function is_available() {
        $api_key = get_option('bewerbungstrainer_openai_api_key', '');
        return !empty($api_key);
    }

    /**
     * Transcribe audio file using Whisper API
     *
     * @param string $audio_path Full path to audio file
     * @param string $mime_type MIME type of the audio file
     * @param array $options Optional settings (language, prompt)
     * @return array|WP_Error Result with 'transcript' key or error
     */
    public function transcribe($audio_path, $mime_type = 'audio/webm', $options = array()) {
        // Get API key
        $api_key = $this->get_api_key();
        if (is_wp_error($api_key)) {
            return $api_key;
        }

        // Validate file exists
        if (!file_exists($audio_path)) {
            return new WP_Error(
                'file_not_found',
                __('Audio-Datei nicht gefunden.', 'bewerbungstrainer'),
                array('status' => 400)
            );
        }

        // Validate file size
        $file_size = filesize($audio_path);
        if ($file_size > self::MAX_FILE_SIZE) {
            return new WP_Error(
                'file_too_large',
                __('Audio-Datei ist zu groß (max. 25MB).', 'bewerbungstrainer'),
                array('status' => 400)
            );
        }

        // Get file extension from mime type
        $extension = $this->get_extension_from_mime($mime_type);

        // Prepare language
        $language = isset($options['language']) ? $options['language'] : self::DEFAULT_LANGUAGE;

        // Prepare optional prompt (helps with context/accuracy)
        $prompt = isset($options['prompt']) ? $options['prompt'] : '';

        // Log the transcription attempt
        error_log("[WHISPER] Starting transcription: {$audio_path}, size: {$file_size} bytes, mime: {$mime_type}");

        // Build multipart form data
        $boundary = wp_generate_password(24, false);
        $body = $this->build_multipart_body($audio_path, $extension, $language, $prompt, $boundary);

        // Make API request
        $response = wp_remote_post(self::API_URL, array(
            'timeout' => 60,
            'headers' => array(
                'Authorization' => 'Bearer ' . $api_key,
                'Content-Type' => 'multipart/form-data; boundary=' . $boundary,
            ),
            'body' => $body,
        ));

        // Check for request error
        if (is_wp_error($response)) {
            error_log("[WHISPER] Request failed: " . $response->get_error_message());
            return new WP_Error(
                'api_request_failed',
                __('Whisper API Anfrage fehlgeschlagen: ', 'bewerbungstrainer') . $response->get_error_message(),
                array('status' => 500)
            );
        }

        // Get response code and body
        $response_code = wp_remote_retrieve_response_code($response);
        $response_body = wp_remote_retrieve_body($response);

        // Log to prompts.log
        if (function_exists('bewerbungstrainer_log_prompt')) {
            // Use scenario title if provided, otherwise generic description
            $scenario_title = isset($options['scenario_title']) ? $options['scenario_title'] : 'Audio-Transkription';

            bewerbungstrainer_log_prompt(
                'WHISPER_TRANSCRIPTION',
                $scenario_title,
                "Audio: {$audio_path}",
                array(
                    'Audio-Größe' => round($file_size / 1024) . ' KB',
                    'MIME-Type' => $mime_type,
                    'Sprache' => $language,
                    'Response-Code' => $response_code,
                )
            );
        }

        // Handle error responses
        if ($response_code !== 200) {
            $error_data = json_decode($response_body, true);
            $error_message = isset($error_data['error']['message'])
                ? $error_data['error']['message']
                : "HTTP {$response_code}";

            error_log("[WHISPER] API error: {$error_message}");

            // Log error response
            if (function_exists('bewerbungstrainer_log_response')) {
                bewerbungstrainer_log_response('WHISPER_TRANSCRIPTION', $response_body, true);
            }

            return new WP_Error(
                'api_error',
                __('Whisper API Fehler: ', 'bewerbungstrainer') . $error_message,
                array('status' => $response_code)
            );
        }

        // Parse response
        $result = json_decode($response_body, true);

        if (!isset($result['text'])) {
            error_log("[WHISPER] Unexpected response format: " . $response_body);
            return new WP_Error(
                'invalid_response',
                __('Unerwartetes Antwortformat von Whisper API.', 'bewerbungstrainer'),
                array('status' => 500)
            );
        }

        $transcript = trim($result['text']);

        // Log successful response
        if (function_exists('bewerbungstrainer_log_response')) {
            bewerbungstrainer_log_response('WHISPER_TRANSCRIPTION', $transcript);
        }

        error_log("[WHISPER] Transcription successful: " . substr($transcript, 0, 100) . "...");

        return array(
            'transcript' => $transcript,
            'language' => $language,
        );
    }

    /**
     * Transcribe audio from base64 encoded data
     *
     * @param string $audio_base64 Base64 encoded audio data
     * @param string $mime_type MIME type of the audio
     * @param array $options Optional settings
     * @return array|WP_Error Result with 'transcript' key or error
     */
    public function transcribe_base64($audio_base64, $mime_type = 'audio/webm', $options = array()) {
        // Decode base64
        $audio_data = base64_decode($audio_base64);
        if ($audio_data === false) {
            return new WP_Error(
                'invalid_base64',
                __('Ungültige Base64-Audiodaten.', 'bewerbungstrainer'),
                array('status' => 400)
            );
        }

        // Create temporary file
        $extension = $this->get_extension_from_mime($mime_type);
        $temp_file = wp_tempnam('whisper_') . '.' . $extension;

        // Write audio data to temp file
        if (file_put_contents($temp_file, $audio_data) === false) {
            return new WP_Error(
                'temp_file_failed',
                __('Temporäre Audiodatei konnte nicht erstellt werden.', 'bewerbungstrainer'),
                array('status' => 500)
            );
        }

        // Transcribe
        $result = $this->transcribe($temp_file, $mime_type, $options);

        // Clean up temp file
        @unlink($temp_file);

        return $result;
    }

    /**
     * Check if transcript indicates no speech was detected
     *
     * @param string $transcript The transcript to check
     * @return bool True if no meaningful speech was detected
     */
    public function is_empty_transcript($transcript) {
        if (empty($transcript)) {
            return true;
        }

        $transcript = trim($transcript);

        // Very short transcripts are suspicious
        if (mb_strlen($transcript) < 5) {
            return true;
        }

        // Check for common empty indicators
        $empty_patterns = array(
            '[Keine Sprache erkannt]',
            '[No speech detected]',
            '[Keine Sprache]',
            'Untertitel von',  // Whisper sometimes outputs this for silence
            'Untertitelung',
            'MBC 뉴스',  // Sometimes outputs Korean/other language placeholders
        );

        foreach ($empty_patterns as $pattern) {
            if (stripos($transcript, $pattern) !== false) {
                return true;
            }
        }

        return false;
    }

    /**
     * Build multipart form data body for Whisper API
     *
     * @param string $file_path Path to audio file
     * @param string $extension File extension
     * @param string $language Language code
     * @param string $prompt Optional context prompt
     * @param string $boundary Multipart boundary
     * @return string Multipart form body
     */
    private function build_multipart_body($file_path, $extension, $language, $prompt, $boundary) {
        $body = '';

        // Add file
        $file_content = file_get_contents($file_path);
        $filename = 'audio.' . $extension;

        $body .= "--{$boundary}\r\n";
        $body .= "Content-Disposition: form-data; name=\"file\"; filename=\"{$filename}\"\r\n";
        $body .= "Content-Type: audio/{$extension}\r\n\r\n";
        $body .= $file_content . "\r\n";

        // Add model
        $body .= "--{$boundary}\r\n";
        $body .= "Content-Disposition: form-data; name=\"model\"\r\n\r\n";
        $body .= self::MODEL . "\r\n";

        // Add language
        $body .= "--{$boundary}\r\n";
        $body .= "Content-Disposition: form-data; name=\"language\"\r\n\r\n";
        $body .= $language . "\r\n";

        // Add response format
        $body .= "--{$boundary}\r\n";
        $body .= "Content-Disposition: form-data; name=\"response_format\"\r\n\r\n";
        $body .= "json\r\n";

        // Add prompt if provided (helps with context)
        if (!empty($prompt)) {
            // Truncate prompt if too long
            $prompt = mb_substr($prompt, 0, 224);
            $body .= "--{$boundary}\r\n";
            $body .= "Content-Disposition: form-data; name=\"prompt\"\r\n\r\n";
            $body .= $prompt . "\r\n";
        }

        // End boundary
        $body .= "--{$boundary}--\r\n";

        return $body;
    }

    /**
     * Get file extension from MIME type
     *
     * @param string $mime_type MIME type
     * @return string File extension
     */
    private function get_extension_from_mime($mime_type) {
        $map = array(
            'audio/webm' => 'webm',
            'audio/mp3' => 'mp3',
            'audio/mpeg' => 'mp3',
            'audio/mp4' => 'mp4',
            'audio/m4a' => 'm4a',
            'audio/wav' => 'wav',
            'audio/wave' => 'wav',
            'audio/ogg' => 'ogg',
            'audio/flac' => 'flac',
        );

        return isset($map[$mime_type]) ? $map[$mime_type] : 'webm';
    }
}
