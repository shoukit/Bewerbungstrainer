<?php
/**
 * Video Handler Class
 *
 * Handles video file uploads, downloads, and management
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

class Bewerbungstrainer_Video_Handler {

    /**
     * Instance of this class
     */
    private static $instance = null;

    /**
     * Video upload directory
     */
    private $video_dir;

    /**
     * Video upload URL
     */
    private $video_url;

    /**
     * Allowed video MIME types
     */
    private $allowed_types = array(
        'video/mp4',
        'video/webm',
        'video/ogg',
        'video/quicktime',
        'video/x-msvideo',
    );

    /**
     * Max file size (500MB)
     */
    private $max_file_size = 524288000;

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
        $this->video_dir = $upload_dir['basedir'] . '/bewerbungstrainer/videos';
        $this->video_url = $upload_dir['baseurl'] . '/bewerbungstrainer/videos';

        // Ensure directory exists
        if (!file_exists($this->video_dir)) {
            wp_mkdir_p($this->video_dir);

            // Create .htaccess for security
            $htaccess_path = $this->video_dir . '/.htaccess';
            if (!file_exists($htaccess_path)) {
                $htaccess_content = "# Protect video files\n";
                $htaccess_content .= "Options -Indexes\n";
                $htaccess_content .= "<FilesMatch '\.(mp4|webm|ogg|mov|avi)$'>\n";
                $htaccess_content .= "    Require all granted\n";
                $htaccess_content .= "</FilesMatch>\n";
                file_put_contents($htaccess_path, $htaccess_content);
            }
        }
    }

    /**
     * Upload video from multipart form data
     *
     * @param array $file_data File data from $_FILES
     * @param string $session_id Session ID for filename
     * @return array|WP_Error Array with filename, url, and size, or WP_Error on failure
     */
    public function upload_video($file_data, $session_id) {
        // Validate file data
        if (!isset($file_data['tmp_name']) || !isset($file_data['size']) || !isset($file_data['type'])) {
            return new WP_Error(
                'invalid_data',
                __('Ungültige Video-Daten.', 'bewerbungstrainer')
            );
        }

        // Check for upload errors
        if ($file_data['error'] !== UPLOAD_ERR_OK) {
            return new WP_Error(
                'upload_error',
                sprintf(
                    __('Upload-Fehler: %s', 'bewerbungstrainer'),
                    $this->get_upload_error_message($file_data['error'])
                )
            );
        }

        // Validate MIME type
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime_type = finfo_file($finfo, $file_data['tmp_name']);
        finfo_close($finfo);

        if (!in_array($mime_type, $this->allowed_types)) {
            return new WP_Error(
                'invalid_type',
                sprintf(
                    __('Ungültiger Video-Dateityp: %s. Erlaubt: MP4, WebM, OGG', 'bewerbungstrainer'),
                    $mime_type
                )
            );
        }

        // Check file size
        if ($file_data['size'] > $this->max_file_size) {
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

        // Move uploaded file
        $file_path = $this->video_dir . '/' . $filename;
        $result = move_uploaded_file($file_data['tmp_name'], $file_path);

        if ($result === false) {
            return new WP_Error(
                'file_save_error',
                __('Fehler beim Speichern der Video-Datei.', 'bewerbungstrainer')
            );
        }

        // Set proper permissions
        chmod($file_path, 0644);

        return array(
            'filename' => $filename,
            'url' => $this->video_url . '/' . $filename,
            'path' => $file_path,
            'size' => filesize($file_path),
        );
    }

    /**
     * Upload video from blob data
     *
     * @param string $blob_data Binary blob data
     * @param string $session_id Session ID for filename
     * @param string $mime_type MIME type of the video
     * @return array|WP_Error Array with filename, url, and size, or WP_Error on failure
     */
    public function upload_video_blob($blob_data, $session_id, $mime_type = 'video/webm') {
        // Validate MIME type
        if (!in_array($mime_type, $this->allowed_types)) {
            return new WP_Error(
                'invalid_type',
                __('Ungültiger Video-Dateityp.', 'bewerbungstrainer')
            );
        }

        // Check file size
        if (strlen($blob_data) > $this->max_file_size) {
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
        $file_path = $this->video_dir . '/' . $filename;
        $result = file_put_contents($file_path, $blob_data);

        if ($result === false) {
            return new WP_Error(
                'file_save_error',
                __('Fehler beim Speichern der Video-Datei.', 'bewerbungstrainer')
            );
        }

        // Set proper permissions
        chmod($file_path, 0644);

        return array(
            'filename' => $filename,
            'url' => $this->video_url . '/' . $filename,
            'path' => $file_path,
            'size' => filesize($file_path),
        );
    }

    /**
     * Delete video file
     *
     * @param string $filename Video filename
     * @return bool True on success, false on failure
     */
    public function delete_video($filename) {
        // Sanitize filename
        $filename = sanitize_file_name($filename);

        // Construct file path
        $file_path = $this->video_dir . '/' . $filename;

        // Check if file exists
        if (!file_exists($file_path)) {
            return false;
        }

        // Delete file
        return unlink($file_path);
    }

    /**
     * Get video file URL
     *
     * @param string $filename Video filename
     * @return string|false Video URL or false if file doesn't exist
     */
    public function get_video_url($filename) {
        $filename = sanitize_file_name($filename);
        $file_path = $this->video_dir . '/' . $filename;

        if (!file_exists($file_path)) {
            return false;
        }

        return $this->video_url . '/' . $filename;
    }

    /**
     * Get video file path
     *
     * @param string $filename Video filename
     * @return string|false Video path or false if file doesn't exist
     */
    public function get_video_path($filename) {
        $filename = sanitize_file_name($filename);
        $file_path = $this->video_dir . '/' . $filename;

        if (!file_exists($file_path)) {
            return false;
        }

        return $file_path;
    }

    /**
     * Check if video file exists
     *
     * @param string $filename Video filename
     * @return bool True if exists, false otherwise
     */
    public function video_exists($filename) {
        $filename = sanitize_file_name($filename);
        $file_path = $this->video_dir . '/' . $filename;

        return file_exists($file_path);
    }

    /**
     * Generate unique filename
     *
     * @param string $identifier Unique identifier (session ID, etc.)
     * @param string $mime_type MIME type
     * @return string Unique filename
     */
    private function generate_unique_filename($identifier, $mime_type = 'video/webm') {
        // Map MIME types to extensions
        $extensions = array(
            'video/mp4' => 'mp4',
            'video/webm' => 'webm',
            'video/ogg' => 'ogv',
            'video/quicktime' => 'mov',
            'video/x-msvideo' => 'avi',
        );

        $extension = isset($extensions[$mime_type]) ? $extensions[$mime_type] : 'webm';

        // Generate filename: {user_id}_{identifier}_{timestamp}.{extension}
        $user_id = get_current_user_id() ?: 'guest';
        $timestamp = time();
        $safe_identifier = sanitize_file_name($identifier);

        return "{$user_id}_{$safe_identifier}_{$timestamp}.{$extension}";
    }

    /**
     * Get upload error message
     *
     * @param int $error_code PHP upload error code
     * @return string Error message
     */
    private function get_upload_error_message($error_code) {
        $errors = array(
            UPLOAD_ERR_INI_SIZE => 'Die Datei überschreitet die upload_max_filesize Direktive in php.ini',
            UPLOAD_ERR_FORM_SIZE => 'Die Datei überschreitet die MAX_FILE_SIZE Direktive im HTML-Formular',
            UPLOAD_ERR_PARTIAL => 'Die Datei wurde nur teilweise hochgeladen',
            UPLOAD_ERR_NO_FILE => 'Keine Datei wurde hochgeladen',
            UPLOAD_ERR_NO_TMP_DIR => 'Temporäres Verzeichnis fehlt',
            UPLOAD_ERR_CANT_WRITE => 'Fehler beim Schreiben der Datei auf die Festplatte',
            UPLOAD_ERR_EXTENSION => 'Eine PHP-Erweiterung hat den Upload gestoppt',
        );

        return isset($errors[$error_code]) ? $errors[$error_code] : 'Unbekannter Fehler';
    }

    /**
     * Clean up old video files (for maintenance)
     *
     * @param int $days Delete files older than X days
     * @return int Number of files deleted
     */
    public function cleanup_old_files($days = 90) {
        $files = glob($this->video_dir . '/*');
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
     * Get video directory path
     *
     * @return string Directory path
     */
    public function get_video_dir() {
        return $this->video_dir;
    }

    /**
     * Get video directory URL
     *
     * @return string Directory URL
     */
    public function get_video_url_base() {
        return $this->video_url;
    }

    /**
     * Get max file size
     *
     * @return int Max file size in bytes
     */
    public function get_max_file_size() {
        return $this->max_file_size;
    }

    /**
     * Get allowed MIME types
     *
     * @return array Allowed MIME types
     */
    public function get_allowed_types() {
        return $this->allowed_types;
    }
}
