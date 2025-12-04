<?php
/**
 * REST API Class
 *
 * Handles all REST API endpoints for the Bewerbungstrainer plugin
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

class Bewerbungstrainer_API {

    /**
     * Instance of this class
     */
    private static $instance = null;

    /**
     * API namespace
     */
    private $namespace = 'bewerbungstrainer/v1';

    /**
     * Database instance
     */
    private $db;

    /**
     * Audio handler instance
     */
    private $audio_handler;

    /**
     * Video handler instance
     */
    private $video_handler;

    /**
     * PDF exporter instance
     */
    private $pdf_exporter;

    /**
     * Gemini handler instance
     */
    private $gemini_handler;

    /**
     * Roleplay scenarios instance
     */
    private $roleplay_scenarios;

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
        $this->db = Bewerbungstrainer_Database::get_instance();
        $this->audio_handler = Bewerbungstrainer_Audio_Handler::get_instance();
        $this->video_handler = Bewerbungstrainer_Video_Handler::get_instance();
        $this->pdf_exporter = Bewerbungstrainer_PDF_Exporter::get_instance();
        $this->gemini_handler = Bewerbungstrainer_Gemini_Handler::get_instance();
        $this->roleplay_scenarios = Bewerbungstrainer_Roleplay_Scenarios::get_instance();

        // Disable cookie authentication errors for video training endpoints
        add_filter('rest_authentication_errors', array($this, 'disable_cookie_check_for_video_training'));

        add_action('rest_api_init', array($this, 'register_routes'));
    }

    /**
     * Register REST API routes
     */
    public function register_routes() {
        // Create new session (allow all users - logged in or guest)
        register_rest_route($this->namespace, '/sessions', array(
            'methods' => 'POST',
            'callback' => array($this, 'create_session'),
            'permission_callback' => array($this, 'allow_all_users'),
        ));

        // Get all sessions for current user
        register_rest_route($this->namespace, '/sessions', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_sessions'),
            'permission_callback' => array($this, 'check_user_logged_in'),
        ));

        // Get specific session
        register_rest_route($this->namespace, '/sessions/(?P<id>\d+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_session'),
            'permission_callback' => array($this, 'check_user_logged_in'),
        ));

        // Update session (allow all users to update their own session)
        register_rest_route($this->namespace, '/sessions/(?P<id>\d+)', array(
            'methods' => 'PUT',
            'callback' => array($this, 'update_session'),
            'permission_callback' => array($this, 'allow_all_users'),
        ));

        // Delete session
        register_rest_route($this->namespace, '/sessions/(?P<id>\d+)', array(
            'methods' => 'DELETE',
            'callback' => array($this, 'delete_session'),
            'permission_callback' => array($this, 'check_user_logged_in'),
        ));

        // Save audio from ElevenLabs (allow all users)
        register_rest_route($this->namespace, '/audio/save-elevenlabs', array(
            'methods' => 'POST',
            'callback' => array($this, 'save_audio_elevenlabs'),
            'permission_callback' => array($this, 'allow_all_users'),
        ));

        // Upload audio (base64)
        register_rest_route($this->namespace, '/audio/upload', array(
            'methods' => 'POST',
            'callback' => array($this, 'upload_audio'),
            'permission_callback' => array($this, 'check_user_logged_in'),
        ));

        // Get user info
        register_rest_route($this->namespace, '/user/info', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_user_info'),
            'permission_callback' => array($this, 'check_user_logged_in'),
        ));

        // Get settings (API keys, etc.)
        register_rest_route($this->namespace, '/settings', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_settings'),
            'permission_callback' => array($this, 'check_user_logged_in'),
        ));

        // Export session as PDF
        register_rest_route($this->namespace, '/sessions/(?P<id>\d+)/export-pdf', array(
            'methods' => 'GET',
            'callback' => array($this, 'export_session_pdf'),
            'permission_callback' => array($this, 'check_user_logged_in'),
        ));

        // Upload document
        register_rest_route($this->namespace, '/documents/upload', array(
            'methods' => 'POST',
            'callback' => array($this, 'upload_document'),
            'permission_callback' => array($this, 'check_user_logged_in'),
        ));

        // Get all documents for current user
        register_rest_route($this->namespace, '/documents', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_documents'),
            'permission_callback' => array($this, 'check_user_logged_in'),
        ));

        // Get specific document
        register_rest_route($this->namespace, '/documents/(?P<id>\d+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_document'),
            'permission_callback' => array($this, 'check_user_logged_in'),
        ));

        // Delete document
        register_rest_route($this->namespace, '/documents/(?P<id>\d+)', array(
            'methods' => 'DELETE',
            'callback' => array($this, 'delete_document'),
            'permission_callback' => array($this, 'check_user_logged_in'),
        ));

        // Admin: Get all sessions
        register_rest_route($this->namespace, '/admin/sessions', array(
            'methods' => 'GET',
            'callback' => array($this, 'admin_get_all_sessions'),
            'permission_callback' => array($this, 'check_is_admin'),
        ));

        // Admin: Get specific session
        register_rest_route($this->namespace, '/admin/sessions/(?P<id>\d+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'admin_get_session'),
            'permission_callback' => array($this, 'check_is_admin'),
        ));

        // ===== Video Training Endpoints =====

        // Generate interview questions
        register_rest_route($this->namespace, '/video-training/generate-questions', array(
            'methods' => 'POST',
            'callback' => array($this, 'generate_questions'),
            'permission_callback' => array($this, 'allow_all_users'),
        ));

        // Create video training session
        register_rest_route($this->namespace, '/video-training', array(
            'methods' => 'POST',
            'callback' => array($this, 'create_video_training'),
            'permission_callback' => array($this, 'allow_all_users'),
        ));

        // Upload video
        register_rest_route($this->namespace, '/video-training/(?P<id>\d+)/upload', array(
            'methods' => 'POST',
            'callback' => array($this, 'upload_video'),
            'permission_callback' => array($this, 'allow_all_users'),
        ));

        // Trigger video analysis
        register_rest_route($this->namespace, '/video-training/(?P<id>\d+)/analyze', array(
            'methods' => 'POST',
            'callback' => array($this, 'analyze_video_training'),
            'permission_callback' => array($this, 'allow_all_users'),
        ));

        // Get video training session
        register_rest_route($this->namespace, '/video-training/(?P<id>\d+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_video_training'),
            'permission_callback' => array($this, 'allow_all_users'),
        ));

        // Get all video trainings for user
        register_rest_route($this->namespace, '/video-training', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_video_trainings'),
            'permission_callback' => array($this, 'check_user_logged_in'),
        ));

        // Delete video training
        register_rest_route($this->namespace, '/video-training/(?P<id>\d+)', array(
            'methods' => 'DELETE',
            'callback' => array($this, 'delete_video_training'),
            'permission_callback' => array($this, 'check_user_logged_in'),
        ));

        // ===== Roleplay Endpoints =====

        // Get all roleplay scenarios
        register_rest_route($this->namespace, '/roleplays', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_roleplay_scenarios'),
            'permission_callback' => array($this, 'allow_all_users'),
        ));

        // Get specific roleplay scenario
        register_rest_route($this->namespace, '/roleplays/(?P<id>\d+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_roleplay_scenario'),
            'permission_callback' => array($this, 'allow_all_users'),
        ));

        // Create custom roleplay scenario (temporary)
        register_rest_route($this->namespace, '/roleplays/custom', array(
            'methods' => 'POST',
            'callback' => array($this, 'create_custom_roleplay'),
            'permission_callback' => array($this, 'allow_all_users'),
        ));

        // Create roleplay session
        register_rest_route($this->namespace, '/roleplays/sessions', array(
            'methods' => 'POST',
            'callback' => array($this, 'create_roleplay_session'),
            'permission_callback' => array($this, 'allow_all_users'),
        ));

        // Update roleplay session
        register_rest_route($this->namespace, '/roleplays/sessions/(?P<id>\d+)', array(
            'methods' => 'PUT',
            'callback' => array($this, 'update_roleplay_session'),
            'permission_callback' => array($this, 'allow_all_users'),
        ));

        // Get roleplay session
        register_rest_route($this->namespace, '/roleplays/sessions/(?P<id>\d+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_roleplay_session'),
            'permission_callback' => array($this, 'allow_all_users'),
        ));

        // Get all roleplay sessions for user
        register_rest_route($this->namespace, '/roleplays/sessions', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_roleplay_sessions'),
            'permission_callback' => array($this, 'check_user_logged_in'),
        ));

        // Delete roleplay session
        register_rest_route($this->namespace, '/roleplays/sessions/(?P<id>\d+)', array(
            'methods' => 'DELETE',
            'callback' => array($this, 'delete_roleplay_session'),
            'permission_callback' => array($this, 'check_user_logged_in'),
        ));

        // Generate ElevenLabs signed URL (SECURE - never expose API key!)
        register_rest_route($this->namespace, '/elevenlabs/signed-url', array(
            'methods' => 'POST',
            'callback' => array($this, 'generate_elevenlabs_signed_url'),
            'permission_callback' => array($this, 'allow_all_users'),
        ));
    }

    /**
     * Permission callback - check if user is logged in
     */
    public function check_user_logged_in() {
        return is_user_logged_in();
    }

    /**
     * Disable cookie authentication check for video training endpoints
     *
     * This allows video training endpoints to work without nonce validation
     * since they use the allow_all_users permission callback.
     *
     * @param WP_Error|null|bool $result Error from another authentication handler, null if not errors, true if authentication succeeded.
     * @return WP_Error|null|bool
     */
    public function disable_cookie_check_for_video_training($result) {
        // If another auth method already succeeded or failed, don't override it
        if (true === $result || is_wp_error($result)) {
            return $result;
        }

        // Get the current REST route
        $route = $_SERVER['REQUEST_URI'] ?? '';

        // Check if this is a video training endpoint
        if (strpos($route, '/bewerbungstrainer/v1/video-training') !== false) {
            // Allow the request without cookie authentication
            return true;
        }

        return $result;
    }

    /**
     * Permission callback - allow all users (logged in or not)
     *
     * For logged-in users, this verifies the nonce.
     * For non-logged-in users, this allows access without authentication.
     */
    public function allow_all_users($request) {
        // If user is logged in, verify nonce for security
        if (is_user_logged_in()) {
            // Check if nonce is provided in header
            $nonce = $request->get_header('X-WP-Nonce');

            if (!$nonce) {
                // Try getting from parameter as fallback
                $nonce = $request->get_param('_wpnonce');
            }

            if ($nonce && wp_verify_nonce($nonce, 'wp_rest')) {
                return true;
            }

            // If nonce verification fails but user is logged in, still allow
            // This is for backward compatibility and testing
            return true;
        }

        // Allow guest users
        return true;
    }

    /**
     * Permission callback - check if user is admin
     */
    public function check_is_admin() {
        return current_user_can('manage_options');
    }

    /**
     * Create new training session
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response|WP_Error Response object
     */
    public function create_session($request) {
        $params = $request->get_json_params();

        if (empty($params)) {
            $params = $request->get_params();
        }

        // Validate required fields
        if (empty($params['position'])) {
            return new WP_Error(
                'missing_fields',
                __('Position ist erforderlich.', 'bewerbungstrainer'),
                array('status' => 400)
            );
        }

        // For non-logged-in users, user_name is required
        $user_id = get_current_user_id();
        if ($user_id === 0 && empty($params['user_name'])) {
            return new WP_Error(
                'missing_fields',
                __('Name ist für Gäste erforderlich.', 'bewerbungstrainer'),
                array('status' => 400)
            );
        }

        // Create session
        $session_data = array(
            'user_id' => $user_id,
            'user_name' => isset($params['user_name']) ? $params['user_name'] : null,
            'session_id' => isset($params['session_id']) ? $params['session_id'] : wp_generate_uuid4(),
            'position' => $params['position'],
            'company' => isset($params['company']) ? $params['company'] : '',
            'conversation_id' => isset($params['conversation_id']) ? $params['conversation_id'] : null,
        );

        $session_id = $this->db->create_session($session_data);

        if (!$session_id) {
            return new WP_Error(
                'create_failed',
                __('Fehler beim Erstellen der Sitzung.', 'bewerbungstrainer'),
                array('status' => 500)
            );
        }

        $session = $this->db->get_session($session_id);

        return new WP_REST_Response(array(
            'success' => true,
            'data' => $this->format_session($session),
        ), 201);
    }

    /**
     * Get all sessions for current user
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response Response object
     */
    public function get_sessions($request) {
        $params = $request->get_params();

        $args = array(
            'limit' => isset($params['limit']) ? intval($params['limit']) : 50,
            'offset' => isset($params['offset']) ? intval($params['offset']) : 0,
            'orderby' => isset($params['orderby']) ? $params['orderby'] : 'created_at',
            'order' => isset($params['order']) ? $params['order'] : 'DESC',
        );

        $sessions = $this->db->get_user_sessions(get_current_user_id(), $args);
        $total = $this->db->get_user_sessions_count(get_current_user_id());

        $formatted_sessions = array_map(array($this, 'format_session'), $sessions);

        return new WP_REST_Response(array(
            'success' => true,
            'data' => $formatted_sessions,
            'pagination' => array(
                'total' => $total,
                'limit' => $args['limit'],
                'offset' => $args['offset'],
            ),
        ), 200);
    }

    /**
     * Get specific session
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response|WP_Error Response object
     */
    public function get_session($request) {
        $session_id = intval($request['id']);
        $session = $this->db->get_session($session_id);

        if (!$session) {
            return new WP_Error(
                'not_found',
                __('Sitzung nicht gefunden.', 'bewerbungstrainer'),
                array('status' => 404)
            );
        }

        // Check ownership
        if ((int) $session->user_id !== get_current_user_id()) {
            return new WP_Error(
                'forbidden',
                __('Keine Berechtigung.', 'bewerbungstrainer'),
                array('status' => 403)
            );
        }

        return new WP_REST_Response(array(
            'success' => true,
            'data' => $this->format_session($session),
        ), 200);
    }

    /**
     * Update session
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response|WP_Error Response object
     */
    public function update_session($request) {
        $session_id = intval($request['id']);
        $session = $this->db->get_session($session_id);

        if (!$session) {
            return new WP_Error(
                'not_found',
                __('Sitzung nicht gefunden.', 'bewerbungstrainer'),
                array('status' => 404)
            );
        }

        // Check ownership - guest sessions (user_id = 0) can be updated by anyone
        // This allows guests to save their feedback during the same session
        $current_user_id = get_current_user_id();
        if ((int) $session->user_id !== 0 && (int) $session->user_id !== $current_user_id) {
            return new WP_Error(
                'forbidden',
                __('Keine Berechtigung.', 'bewerbungstrainer'),
                array('status' => 403)
            );
        }

        $params = $request->get_json_params();
        if (empty($params)) {
            $params = $request->get_params();
        }

        // Update session
        $result = $this->db->update_session($session_id, $params);

        if (!$result) {
            return new WP_Error(
                'update_failed',
                __('Fehler beim Aktualisieren der Sitzung.', 'bewerbungstrainer'),
                array('status' => 500)
            );
        }

        $updated_session = $this->db->get_session($session_id);

        return new WP_REST_Response(array(
            'success' => true,
            'data' => $this->format_session($updated_session),
        ), 200);
    }

    /**
     * Delete session
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response|WP_Error Response object
     */
    public function delete_session($request) {
        $session_id = intval($request['id']);
        $result = $this->db->delete_session($session_id, get_current_user_id());

        if (!$result) {
            return new WP_Error(
                'delete_failed',
                __('Fehler beim Löschen der Sitzung oder keine Berechtigung.', 'bewerbungstrainer'),
                array('status' => 500)
            );
        }

        return new WP_REST_Response(array(
            'success' => true,
            'message' => __('Sitzung erfolgreich gelöscht.', 'bewerbungstrainer'),
        ), 200);
    }

    /**
     * Save audio from ElevenLabs
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response|WP_Error Response object
     */
    public function save_audio_elevenlabs($request) {
        $params = $request->get_json_params();
        if (empty($params)) {
            $params = $request->get_params();
        }

        if (empty($params['conversation_id']) || empty($params['session_id'])) {
            return new WP_Error(
                'missing_fields',
                __('Conversation ID und Session ID sind erforderlich.', 'bewerbungstrainer'),
                array('status' => 400)
            );
        }

        // Get API key from settings
        $api_key = get_option('bewerbungstrainer_elevenlabs_api_key', '');

        if (empty($api_key)) {
            return new WP_Error(
                'missing_api_key',
                __('ElevenLabs API Key ist nicht konfiguriert.', 'bewerbungstrainer'),
                array('status' => 400)
            );
        }

        // Download and save audio
        $result = $this->audio_handler->save_audio_from_elevenlabs(
            $params['conversation_id'],
            $api_key
        );

        if (is_wp_error($result)) {
            return $result;
        }

        // Update session with audio information
        $session_id = intval($params['session_id']);
        $this->db->update_session($session_id, array(
            'conversation_id' => $params['conversation_id'],
            'audio_filename' => $result['filename'],
            'audio_url' => $result['url'],
        ));

        return new WP_REST_Response(array(
            'success' => true,
            'data' => $result,
        ), 200);
    }

    /**
     * Upload audio (base64)
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response|WP_Error Response object
     */
    public function upload_audio($request) {
        $params = $request->get_json_params();
        if (empty($params)) {
            $params = $request->get_params();
        }

        if (empty($params['audio_data']) || empty($params['session_id'])) {
            return new WP_Error(
                'missing_fields',
                __('Audio-Daten und Session ID sind erforderlich.', 'bewerbungstrainer'),
                array('status' => 400)
            );
        }

        $result = $this->audio_handler->upload_audio_base64(
            $params['audio_data'],
            $params['session_id']
        );

        if (is_wp_error($result)) {
            return $result;
        }

        // Update session with audio information
        $session_id = intval($params['session_id']);
        $this->db->update_session($session_id, array(
            'audio_filename' => $result['filename'],
            'audio_url' => $result['url'],
        ));

        return new WP_REST_Response(array(
            'success' => true,
            'data' => $result,
        ), 200);
    }

    /**
     * Get user info
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response Response object
     */
    public function get_user_info($request) {
        $user = wp_get_current_user();

        return new WP_REST_Response(array(
            'success' => true,
            'data' => array(
                'id' => $user->ID,
                'username' => $user->user_login,
                'email' => $user->user_email,
                'display_name' => $user->display_name,
                'first_name' => get_user_meta($user->ID, 'first_name', true),
                'last_name' => get_user_meta($user->ID, 'last_name', true),
            ),
        ), 200);
    }

    /**
     * Get settings (API keys, etc.)
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response Response object
     */
    public function get_settings($request) {
        return new WP_REST_Response(array(
            'success' => true,
            'data' => array(
                'elevenlabs_agent_id' => get_option('bewerbungstrainer_elevenlabs_agent_id', ''),
                'has_elevenlabs_api_key' => !empty(get_option('bewerbungstrainer_elevenlabs_api_key', '')),
                'has_gemini_api_key' => !empty(get_option('bewerbungstrainer_gemini_api_key', '')),
            ),
        ), 200);
    }

    /**
     * Format session for API response
     *
     * @param object $session Session object from database
     * @return array Formatted session data
     */
    private function format_session($session) {
        // Get display name for session
        $display_name = '';
        if (!empty($session->user_name)) {
            $display_name = $session->user_name;
        } elseif ($session->user_id > 0) {
            $user = get_userdata($session->user_id);
            $display_name = $user ? $user->display_name : '';
        }

        return array(
            'id' => (int) $session->id,
            'session_id' => $session->session_id,
            'user_id' => (int) $session->user_id,
            'user_name' => $session->user_name,
            'display_name' => $display_name,
            'position' => $session->position,
            'company' => $session->company,
            'conversation_id' => $session->conversation_id,
            'audio_filename' => $session->audio_filename,
            'audio_url' => $session->audio_url,
            'transcript' => $session->transcript,
            'feedback_json' => $session->feedback_json ? json_decode($session->feedback_json, true) : null,
            'audio_analysis_json' => $session->audio_analysis_json ? json_decode($session->audio_analysis_json, true) : null,
            'created_at' => $session->created_at,
            'updated_at' => $session->updated_at,
        );
    }

    /**
     * Export session as PDF
     *
     * @param WP_REST_Request $request Request object
     * @return void Streams PDF to browser
     */
    public function export_session_pdf($request) {
        $session_id = intval($request['id']);
        $this->pdf_exporter->stream_session_pdf($session_id, get_current_user_id());
    }

    /**
     * Upload document
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response|WP_Error Response object
     */
    public function upload_document($request) {
        $files = $request->get_file_params();
        $params = $request->get_params();

        if (empty($files['file'])) {
            return new WP_Error(
                'missing_file',
                __('Keine Datei hochgeladen.', 'bewerbungstrainer'),
                array('status' => 400)
            );
        }

        if (empty($params['document_type']) || !in_array($params['document_type'], array('cv', 'cover_letter'))) {
            return new WP_Error(
                'invalid_type',
                __('Ungültiger Dokumenttyp.', 'bewerbungstrainer'),
                array('status' => 400)
            );
        }

        $file = $files['file'];

        // Validate file type
        $allowed_types = array('application/pdf');
        if (!in_array($file['type'], $allowed_types)) {
            return new WP_Error(
                'invalid_file_type',
                __('Nur PDF-Dateien sind erlaubt.', 'bewerbungstrainer'),
                array('status' => 400)
            );
        }

        // Validate file size (max 10MB)
        $max_size = 10 * 1024 * 1024; // 10MB
        if ($file['size'] > $max_size) {
            return new WP_Error(
                'file_too_large',
                __('Datei ist zu groß. Maximal 10MB erlaubt.', 'bewerbungstrainer'),
                array('status' => 400)
            );
        }

        // Create uploads directory
        $upload_dir = wp_upload_dir();
        $bewerbungstrainer_dir = $upload_dir['basedir'] . '/bewerbungstrainer-documents';

        if (!file_exists($bewerbungstrainer_dir)) {
            wp_mkdir_p($bewerbungstrainer_dir);
        }

        // Generate unique filename
        $filename = wp_unique_filename($bewerbungstrainer_dir, $file['name']);
        $file_path = $bewerbungstrainer_dir . '/' . $filename;

        // Move uploaded file
        if (!move_uploaded_file($file['tmp_name'], $file_path)) {
            return new WP_Error(
                'upload_failed',
                __('Fehler beim Hochladen der Datei.', 'bewerbungstrainer'),
                array('status' => 500)
            );
        }

        // Generate file URL
        $file_url = $upload_dir['baseurl'] . '/bewerbungstrainer-documents/' . $filename;

        // Create database entry
        $document_id = $this->db->create_document(array(
            'user_id' => get_current_user_id(),
            'document_type' => $params['document_type'],
            'filename' => $filename,
            'file_url' => $file_url,
            'file_path' => $file_path,
        ));

        if (!$document_id) {
            // Clean up file if database insert failed
            wp_delete_file($file_path);
            return new WP_Error(
                'create_failed',
                __('Fehler beim Speichern des Dokuments.', 'bewerbungstrainer'),
                array('status' => 500)
            );
        }

        // Analyze document with Gemini AI
        $feedback = $this->gemini_handler->analyze_document($file_path, $params['document_type']);

        if (!is_wp_error($feedback)) {
            // Update document with feedback
            $this->db->update_document($document_id, array(
                'feedback_json' => json_encode($feedback),
                'overall_rating' => isset($feedback['overall_rating']) ? $feedback['overall_rating'] : null,
            ));
        }

        // Get updated document
        $document = $this->db->get_document($document_id);

        return new WP_REST_Response(array(
            'success' => true,
            'data' => $this->format_document($document),
        ), 201);
    }

    /**
     * Get all documents for current user
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response Response object
     */
    public function get_documents($request) {
        $params = $request->get_params();

        $args = array(
            'limit' => isset($params['limit']) ? intval($params['limit']) : 50,
            'offset' => isset($params['offset']) ? intval($params['offset']) : 0,
            'document_type' => isset($params['document_type']) ? $params['document_type'] : null,
            'orderby' => isset($params['orderby']) ? $params['orderby'] : 'created_at',
            'order' => isset($params['order']) ? $params['order'] : 'DESC',
        );

        $documents = $this->db->get_user_documents(get_current_user_id(), $args);
        $total = $this->db->get_user_documents_count(get_current_user_id(), $args['document_type']);

        $formatted_documents = array_map(array($this, 'format_document'), $documents);

        return new WP_REST_Response(array(
            'success' => true,
            'data' => $formatted_documents,
            'pagination' => array(
                'total' => $total,
                'limit' => $args['limit'],
                'offset' => $args['offset'],
            ),
        ), 200);
    }

    /**
     * Get specific document
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response|WP_Error Response object
     */
    public function get_document($request) {
        $document_id = intval($request['id']);
        $document = $this->db->get_document($document_id);

        if (!$document) {
            return new WP_Error(
                'not_found',
                __('Dokument nicht gefunden.', 'bewerbungstrainer'),
                array('status' => 404)
            );
        }

        // Check ownership
        if ((int) $document->user_id !== get_current_user_id()) {
            return new WP_Error(
                'forbidden',
                __('Keine Berechtigung.', 'bewerbungstrainer'),
                array('status' => 403)
            );
        }

        return new WP_REST_Response(array(
            'success' => true,
            'data' => $this->format_document($document),
        ), 200);
    }

    /**
     * Delete document
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response|WP_Error Response object
     */
    public function delete_document($request) {
        $document_id = intval($request['id']);
        $result = $this->db->delete_document($document_id, get_current_user_id());

        if (!$result) {
            return new WP_Error(
                'delete_failed',
                __('Fehler beim Löschen des Dokuments oder keine Berechtigung.', 'bewerbungstrainer'),
                array('status' => 500)
            );
        }

        return new WP_REST_Response(array(
            'success' => true,
            'message' => __('Dokument erfolgreich gelöscht.', 'bewerbungstrainer'),
        ), 200);
    }

    /**
     * Format document for API response
     *
     * @param object $document Document object from database
     * @return array Formatted document data
     */
    private function format_document($document) {
        return array(
            'id' => (int) $document->id,
            'user_id' => (int) $document->user_id,
            'document_type' => $document->document_type,
            'filename' => $document->filename,
            'file_url' => $document->file_url,
            'feedback' => $document->feedback_json ? json_decode($document->feedback_json, true) : null,
            'overall_rating' => $document->overall_rating ? (float) $document->overall_rating : null,
            'created_at' => $document->created_at,
            'updated_at' => $document->updated_at,
        );
    }

    /**
     * Admin: Get all sessions (for admin view)
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response Response object
     */
    public function admin_get_all_sessions($request) {
        $params = $request->get_params();

        $args = array(
            'limit' => isset($params['limit']) ? intval($params['limit']) : 50,
            'offset' => isset($params['offset']) ? intval($params['offset']) : 0,
            'orderby' => isset($params['orderby']) ? $params['orderby'] : 'created_at',
            'order' => isset($params['order']) ? $params['order'] : 'DESC',
        );

        $sessions = $this->db->get_all_sessions($args);
        $total = $this->db->get_all_sessions_count();

        $formatted_sessions = array_map(array($this, 'format_session'), $sessions);

        return new WP_REST_Response(array(
            'success' => true,
            'data' => $formatted_sessions,
            'pagination' => array(
                'total' => $total,
                'limit' => $args['limit'],
                'offset' => $args['offset'],
            ),
        ), 200);
    }

    /**
     * Admin: Get specific session
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response|WP_Error Response object
     */
    public function admin_get_session($request) {
        $session_id = intval($request['id']);
        $session = $this->db->get_session($session_id);

        if (!$session) {
            return new WP_Error(
                'not_found',
                __('Sitzung nicht gefunden.', 'bewerbungstrainer'),
                array('status' => 404)
            );
        }

        return new WP_REST_Response(array(
            'success' => true,
            'data' => $this->format_session($session),
        ), 200);
    }

    /**
     * ===== Video Training Endpoint Callbacks =====
     */

    /**
     * Generate interview questions
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response|WP_Error Response object
     */
    public function generate_questions($request) {
        $params = $request->get_json_params();

        $position = isset($params['position']) ? sanitize_text_field($params['position']) : '';
        $company = isset($params['company']) ? sanitize_text_field($params['company']) : '';
        $experience_level = isset($params['experience_level']) ? sanitize_text_field($params['experience_level']) : 'professional';

        if (empty($position)) {
            return new WP_Error(
                'missing_parameter',
                __('Position ist erforderlich.', 'bewerbungstrainer'),
                array('status' => 400)
            );
        }

        // Generate questions using Gemini
        $questions = $this->gemini_handler->generate_interview_questions($position, $company, $experience_level);

        if (is_wp_error($questions)) {
            return new WP_Error(
                'generation_failed',
                $questions->get_error_message(),
                array('status' => 500)
            );
        }

        return new WP_REST_Response(array(
            'success' => true,
            'data' => array(
                'questions' => $questions,
            ),
        ), 200);
    }

    /**
     * Create video training session
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response|WP_Error Response object
     */
    public function create_video_training($request) {
        $params = $request->get_json_params();

        $name = isset($params['name']) ? sanitize_text_field($params['name']) : null;
        $position = isset($params['position']) ? sanitize_text_field($params['position']) : '';
        $company = isset($params['company']) ? sanitize_text_field($params['company']) : null;
        $experience_level = isset($params['experience_level']) ? sanitize_text_field($params['experience_level']) : 'professional';
        $questions = isset($params['questions']) ? $params['questions'] : array();

        if (empty($position)) {
            return new WP_Error(
                'missing_parameter',
                __('Position ist erforderlich.', 'bewerbungstrainer'),
                array('status' => 400)
            );
        }

        // Ensure database tables exist
        global $wpdb;
        $table_name = $wpdb->prefix . 'bewerbungstrainer_video_trainings';
        if ($wpdb->get_var("SHOW TABLES LIKE '$table_name'") != $table_name) {
            error_log('Bewerbungstrainer: Video training table does not exist, creating tables...');
            Bewerbungstrainer_Database::create_tables();
        }

        // Create session
        $user_id = get_current_user_id();
        $session_id = wp_generate_uuid4();

        $data = array(
            'user_id' => $user_id,
            'user_name' => $name,
            'session_id' => $session_id,
            'name' => $name,
            'position' => $position,
            'company' => $company,
            'experience_level' => $experience_level,
            'questions_json' => json_encode($questions),
        );

        $training_id = $this->db->create_video_training($data);

        if (!$training_id) {
            error_log('Bewerbungstrainer: Failed to create video training session');
            error_log('Bewerbungstrainer: Data sent: ' . print_r($data, true));
            return new WP_Error(
                'creation_failed',
                __('Fehler beim Erstellen der Video-Training-Sitzung.', 'bewerbungstrainer'),
                array('status' => 500)
            );
        }

        $training = $this->db->get_video_training($training_id);

        return new WP_REST_Response(array(
            'success' => true,
            'data' => $this->format_video_training($training),
        ), 201);
    }

    /**
     * Upload video
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response|WP_Error Response object
     */
    public function upload_video($request) {
        $training_id = intval($request['id']);
        $training = $this->db->get_video_training($training_id);

        if (!$training) {
            return new WP_Error(
                'not_found',
                __('Video-Training nicht gefunden.', 'bewerbungstrainer'),
                array('status' => 404)
            );
        }

        // Get files from request
        $files = $request->get_file_params();

        if (!isset($files['video'])) {
            return new WP_Error(
                'no_file',
                __('Keine Video-Datei hochgeladen.', 'bewerbungstrainer'),
                array('status' => 400)
            );
        }

        // Upload video
        $result = $this->video_handler->upload_video($files['video'], $training->session_id);

        if (is_wp_error($result)) {
            return new WP_Error(
                'upload_failed',
                $result->get_error_message(),
                array('status' => 500)
            );
        }

        // Get timeline from request body
        $params = $request->get_json_params();
        $timeline = isset($params['timeline']) ? $params['timeline'] : array();

        // Update training with video info
        $update_data = array(
            'video_filename' => $result['filename'],
            'video_url' => $result['url'],
            'timeline_json' => json_encode($timeline),
        );

        $updated = $this->db->update_video_training($training_id, $update_data);

        if (!$updated) {
            return new WP_Error(
                'update_failed',
                __('Fehler beim Aktualisieren der Video-Training-Daten.', 'bewerbungstrainer'),
                array('status' => 500)
            );
        }

        $training = $this->db->get_video_training($training_id);

        return new WP_REST_Response(array(
            'success' => true,
            'data' => $this->format_video_training($training),
        ), 200);
    }

    /**
     * Analyze video training
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response|WP_Error Response object
     */
    public function analyze_video_training($request) {
        error_log('=== ANALYZE VIDEO TRAINING DEBUG ===');
        $training_id = intval($request['id']);
        error_log('Training ID: ' . $training_id);

        $training = $this->db->get_video_training($training_id);

        if (!$training) {
            error_log('ERROR: Video training not found');
            return new WP_Error(
                'not_found',
                __('Video-Training nicht gefunden.', 'bewerbungstrainer'),
                array('status' => 404)
            );
        }

        error_log('Training found: ' . json_encode(array(
            'id' => $training->id,
            'video_filename' => $training->video_filename,
            'position' => $training->position,
        )));

        if (empty($training->video_filename)) {
            error_log('ERROR: No video uploaded');
            return new WP_Error(
                'no_video',
                __('Kein Video hochgeladen.', 'bewerbungstrainer'),
                array('status' => 400)
            );
        }

        // Get video path
        $video_path = $this->video_handler->get_video_path($training->video_filename);
        error_log('Video path: ' . $video_path);

        if (!$video_path) {
            error_log('ERROR: Video path is empty');
            return new WP_Error(
                'video_not_found',
                __('Video-Datei nicht gefunden.', 'bewerbungstrainer'),
                array('status' => 404)
            );
        }

        if (!file_exists($video_path)) {
            error_log('ERROR: Video file does not exist at path: ' . $video_path);
            return new WP_Error(
                'video_not_found',
                __('Video-Datei nicht gefunden.', 'bewerbungstrainer'),
                array('status' => 404)
            );
        }

        error_log('Video file exists, size: ' . filesize($video_path) . ' bytes');

        // Get questions
        $questions = json_decode($training->questions_json, true);
        $timeline = json_decode($training->timeline_json, true);
        error_log('Questions count: ' . count($questions));
        error_log('Timeline count: ' . count($timeline));

        // Analyze video with Gemini
        error_log('Starting Gemini analysis...');
        try {
            $analysis = $this->gemini_handler->analyze_video_interview(
                $video_path,
                $questions,
                $timeline,
                array(
                    'position' => $training->position,
                    'company' => $training->company,
                    'experience_level' => $training->experience_level,
                    'name' => $training->name,
                )
            );
        } catch (Exception $e) {
            error_log('EXCEPTION during analysis: ' . $e->getMessage());
            error_log('Stack trace: ' . $e->getTraceAsString());
            return new WP_Error(
                'analysis_exception',
                'Fehler bei der Analyse: ' . $e->getMessage(),
                array('status' => 500)
            );
        }

        if (is_wp_error($analysis)) {
            error_log('ERROR: Gemini analysis returned WP_Error: ' . $analysis->get_error_message());
            error_log('Error code: ' . $analysis->get_error_code());
            return new WP_Error(
                'analysis_failed',
                $analysis->get_error_message(),
                array('status' => 500)
            );
        }

        error_log('Analysis completed successfully');

        // Update training with analysis
        $update_data = array(
            'transcript' => isset($analysis['transcript']) ? $analysis['transcript'] : null,
            'analysis_json' => json_encode($analysis),
            'overall_score' => isset($analysis['overall_score']) ? $analysis['overall_score'] : null,
        );

        error_log('Updating training with analysis data...');
        $updated = $this->db->update_video_training($training_id, $update_data);

        if (!$updated) {
            error_log('ERROR: Failed to update training with analysis');
            return new WP_Error(
                'update_failed',
                __('Fehler beim Speichern der Analyse.', 'bewerbungstrainer'),
                array('status' => 500)
            );
        }

        error_log('Training updated successfully');
        $training = $this->db->get_video_training($training_id);

        error_log('=== END DEBUG ===');
        return new WP_REST_Response(array(
            'success' => true,
            'data' => $this->format_video_training($training),
        ), 200);
    }

    /**
     * Get video training session
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response|WP_Error Response object
     */
    public function get_video_training($request) {
        $training_id = intval($request['id']);
        $training = $this->db->get_video_training($training_id);

        if (!$training) {
            return new WP_Error(
                'not_found',
                __('Video-Training nicht gefunden.', 'bewerbungstrainer'),
                array('status' => 404)
            );
        }

        return new WP_REST_Response(array(
            'success' => true,
            'data' => $this->format_video_training($training),
        ), 200);
    }

    /**
     * Get all video trainings for current user
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response Response object
     */
    public function get_video_trainings($request) {
        $user_id = get_current_user_id();
        $params = $request->get_params();

        $args = array(
            'limit' => isset($params['limit']) ? intval($params['limit']) : 50,
            'offset' => isset($params['offset']) ? intval($params['offset']) : 0,
            'orderby' => isset($params['orderby']) ? $params['orderby'] : 'created_at',
            'order' => isset($params['order']) ? $params['order'] : 'DESC',
        );

        $trainings = $this->db->get_user_video_trainings($user_id, $args);
        $formatted_trainings = array_map(array($this, 'format_video_training'), $trainings);

        return new WP_REST_Response(array(
            'success' => true,
            'data' => $formatted_trainings,
        ), 200);
    }

    /**
     * Delete video training
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response|WP_Error Response object
     */
    public function delete_video_training($request) {
        $training_id = intval($request['id']);
        $user_id = get_current_user_id();

        $deleted = $this->db->delete_video_training($training_id, $user_id);

        if (!$deleted) {
            return new WP_Error(
                'delete_failed',
                __('Fehler beim Löschen des Video-Trainings.', 'bewerbungstrainer'),
                array('status' => 500)
            );
        }

        return new WP_REST_Response(array(
            'success' => true,
            'message' => __('Video-Training erfolgreich gelöscht.', 'bewerbungstrainer'),
        ), 200);
    }

    /**
     * Format video training for API response
     *
     * @param object $training Training object from database
     * @return array Formatted training data
     */
    private function format_video_training($training) {
        return array(
            'id' => (int) $training->id,
            'user_id' => (int) $training->user_id,
            'user_name' => $training->user_name,
            'session_id' => $training->session_id,
            'name' => $training->name,
            'position' => $training->position,
            'company' => $training->company,
            'experience_level' => $training->experience_level,
            'questions' => $training->questions_json ? json_decode($training->questions_json, true) : array(),
            'timeline' => $training->timeline_json ? json_decode($training->timeline_json, true) : array(),
            'video_filename' => $training->video_filename,
            'video_url' => $training->video_url,
            'transcript' => $training->transcript,
            'analysis' => $training->analysis_json ? json_decode($training->analysis_json, true) : null,
            'overall_score' => $training->overall_score ? (float) $training->overall_score : null,
            'created_at' => $training->created_at,
            'updated_at' => $training->updated_at,
        );
    }

    /**
     * ===== Roleplay Endpoint Callbacks =====
     */

    /**
     * Get all roleplay scenarios
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response Response object
     */
    public function get_roleplay_scenarios($request) {
        $params = $request->get_params();

        $args = array();

        // Filter by difficulty
        if (isset($params['difficulty'])) {
            $args['meta_query'] = array(
                array(
                    'key' => '_roleplay_difficulty',
                    'value' => sanitize_text_field($params['difficulty']),
                    'compare' => '='
                )
            );
        }

        // Filter by tags
        if (isset($params['tag'])) {
            $args['tax_query'] = array(
                array(
                    'taxonomy' => 'roleplay_scenario_tag',
                    'field' => 'slug',
                    'terms' => sanitize_text_field($params['tag'])
                )
            );
        }

        $scenarios = $this->roleplay_scenarios->get_all_scenarios($args);

        return new WP_REST_Response(array(
            'success' => true,
            'data' => $scenarios,
        ), 200);
    }

    /**
     * Get specific roleplay scenario
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response|WP_Error Response object
     */
    public function get_roleplay_scenario($request) {
        $scenario_id = intval($request['id']);
        $scenario = $this->roleplay_scenarios->get_scenario($scenario_id);

        if (!$scenario) {
            return new WP_Error(
                'not_found',
                __('Rollenspiel-Szenario nicht gefunden.', 'bewerbungstrainer'),
                array('status' => 404)
            );
        }

        return new WP_REST_Response(array(
            'success' => true,
            'data' => $scenario,
        ), 200);
    }

    /**
     * Create custom roleplay scenario (temporary - not saved to database)
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response|WP_Error Response object
     */
    public function create_custom_roleplay($request) {
        $params = $request->get_json_params();

        if (empty($params)) {
            $params = $request->get_params();
        }

        // Validate required fields
        if (empty($params['title']) || empty($params['description'])) {
            return new WP_Error(
                'missing_fields',
                __('Titel und Beschreibung sind erforderlich.', 'bewerbungstrainer'),
                array('status' => 400)
            );
        }

        // Get default agent ID from settings
        $agent_id = get_option('bewerbungstrainer_elevenlabs_agent_id', '');

        // Create custom scenario object (not saved to database)
        $custom_scenario = array(
            'id' => 0, // Temporary ID
            'title' => sanitize_text_field($params['title']),
            'description' => sanitize_textarea_field($params['description']),
            'agent_id' => isset($params['agent_id']) ? sanitize_text_field($params['agent_id']) : $agent_id,
            'difficulty' => isset($params['difficulty']) ? sanitize_text_field($params['difficulty']) : 'medium',
            'variables_schema' => isset($params['variables']) ? $params['variables'] : array(),
            'tags' => array('custom'),
            'is_custom' => true,
        );

        return new WP_REST_Response(array(
            'success' => true,
            'data' => $custom_scenario,
        ), 200);
    }

    /**
     * Create roleplay session
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response|WP_Error Response object
     */
    public function create_roleplay_session($request) {
        $params = $request->get_json_params();

        if (empty($params)) {
            $params = $request->get_params();
        }

        // Validate required fields
        if (empty($params['agent_id'])) {
            return new WP_Error(
                'missing_fields',
                __('Agent ID ist erforderlich.', 'bewerbungstrainer'),
                array('status' => 400)
            );
        }

        // For non-logged-in users, user_name is required
        $user_id = get_current_user_id();
        if ($user_id === 0 && empty($params['user_name'])) {
            return new WP_Error(
                'missing_fields',
                __('Name ist für Gäste erforderlich.', 'bewerbungstrainer'),
                array('status' => 400)
            );
        }

        // Create session
        $session_data = array(
            'user_id' => $user_id,
            'user_name' => isset($params['user_name']) ? $params['user_name'] : null,
            'session_id' => isset($params['session_id']) ? $params['session_id'] : wp_generate_uuid4(),
            'scenario_id' => isset($params['scenario_id']) ? intval($params['scenario_id']) : null,
            'agent_id' => sanitize_text_field($params['agent_id']),
            'variables_json' => isset($params['variables']) ? wp_json_encode($params['variables']) : null,
            'conversation_id' => isset($params['conversation_id']) ? $params['conversation_id'] : null,
        );

        $session_id = $this->db->create_roleplay_session($session_data);

        if (!$session_id) {
            return new WP_Error(
                'create_failed',
                __('Fehler beim Erstellen der Rollenspiel-Sitzung.', 'bewerbungstrainer'),
                array('status' => 500)
            );
        }

        $session = $this->db->get_roleplay_session($session_id);

        return new WP_REST_Response(array(
            'success' => true,
            'data' => $this->format_roleplay_session($session),
        ), 201);
    }

    /**
     * Update roleplay session
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response|WP_Error Response object
     */
    public function update_roleplay_session($request) {
        $session_id = intval($request['id']);
        $session = $this->db->get_roleplay_session($session_id);

        if (!$session) {
            return new WP_Error(
                'not_found',
                __('Rollenspiel-Sitzung nicht gefunden.', 'bewerbungstrainer'),
                array('status' => 404)
            );
        }

        // Check ownership - guest sessions (user_id = 0) can be updated by anyone
        $current_user_id = get_current_user_id();
        if ((int) $session->user_id !== 0 && (int) $session->user_id !== $current_user_id) {
            return new WP_Error(
                'forbidden',
                __('Keine Berechtigung.', 'bewerbungstrainer'),
                array('status' => 403)
            );
        }

        $params = $request->get_json_params();
        if (empty($params)) {
            $params = $request->get_params();
        }

        // Prepare update data
        $update_data = array();

        if (isset($params['transcript'])) {
            $update_data['transcript'] = $params['transcript'];
        }

        if (isset($params['feedback_json'])) {
            $update_data['feedback_json'] = $params['feedback_json'];
        }

        if (isset($params['audio_analysis_json'])) {
            $update_data['audio_analysis_json'] = $params['audio_analysis_json'];
        }

        if (isset($params['conversation_id'])) {
            $update_data['conversation_id'] = $params['conversation_id'];
        }

        if (isset($params['duration'])) {
            $update_data['duration'] = intval($params['duration']);
        }

        // Update session
        $result = $this->db->update_roleplay_session($session_id, $update_data);

        if (!$result) {
            return new WP_Error(
                'update_failed',
                __('Fehler beim Aktualisieren der Rollenspiel-Sitzung.', 'bewerbungstrainer'),
                array('status' => 500)
            );
        }

        $updated_session = $this->db->get_roleplay_session($session_id);

        return new WP_REST_Response(array(
            'success' => true,
            'data' => $this->format_roleplay_session($updated_session),
        ), 200);
    }

    /**
     * Get roleplay session
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response|WP_Error Response object
     */
    public function get_roleplay_session($request) {
        $session_id = intval($request['id']);
        $session = $this->db->get_roleplay_session($session_id);

        if (!$session) {
            return new WP_Error(
                'not_found',
                __('Rollenspiel-Sitzung nicht gefunden.', 'bewerbungstrainer'),
                array('status' => 404)
            );
        }

        return new WP_REST_Response(array(
            'success' => true,
            'data' => $this->format_roleplay_session($session),
        ), 200);
    }

    /**
     * Get roleplay sessions for current user
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response Response object
     */
    public function get_roleplay_sessions($request) {
        $params = $request->get_params();

        $args = array(
            'limit' => isset($params['limit']) ? intval($params['limit']) : 50,
            'offset' => isset($params['offset']) ? intval($params['offset']) : 0,
            'orderby' => isset($params['orderby']) ? $params['orderby'] : 'created_at',
            'order' => isset($params['order']) ? $params['order'] : 'DESC',
            'scenario_id' => isset($params['scenario_id']) ? intval($params['scenario_id']) : null,
        );

        $sessions = $this->db->get_user_roleplay_sessions(get_current_user_id(), $args);
        $total = $this->db->get_user_roleplay_sessions_count(get_current_user_id(), $args['scenario_id']);

        $formatted_sessions = array_map(array($this, 'format_roleplay_session'), $sessions);

        return new WP_REST_Response(array(
            'success' => true,
            'data' => $formatted_sessions,
            'pagination' => array(
                'total' => $total,
                'limit' => $args['limit'],
                'offset' => $args['offset'],
            ),
        ), 200);
    }

    /**
     * Delete roleplay session
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response|WP_Error Response object
     */
    public function delete_roleplay_session($request) {
        $session_id = intval($request['id']);
        $result = $this->db->delete_roleplay_session($session_id, get_current_user_id());

        if (!$result) {
            return new WP_Error(
                'delete_failed',
                __('Fehler beim Löschen der Rollenspiel-Sitzung oder keine Berechtigung.', 'bewerbungstrainer'),
                array('status' => 500)
            );
        }

        return new WP_REST_Response(array(
            'success' => true,
            'message' => __('Rollenspiel-Sitzung erfolgreich gelöscht.', 'bewerbungstrainer'),
        ), 200);
    }

    /**
     * Generate ElevenLabs signed URL (SECURE - API key never exposed)
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response|WP_Error Response object
     */
    public function generate_elevenlabs_signed_url($request) {
        $params = $request->get_json_params();

        if (empty($params)) {
            $params = $request->get_params();
        }

        // Get API key from settings (NEVER send to frontend!)
        $api_key = get_option('bewerbungstrainer_elevenlabs_api_key', '');

        if (empty($api_key)) {
            return new WP_Error(
                'missing_api_key',
                __('ElevenLabs API Key ist nicht konfiguriert.', 'bewerbungstrainer'),
                array('status' => 400)
            );
        }

        // Get agent ID
        $agent_id = isset($params['agent_id']) ? sanitize_text_field($params['agent_id']) : get_option('bewerbungstrainer_elevenlabs_agent_id', '');

        if (empty($agent_id)) {
            return new WP_Error(
                'missing_agent_id',
                __('Agent ID ist erforderlich.', 'bewerbungstrainer'),
                array('status' => 400)
            );
        }

        // NOTE: ElevenLabs Conversational AI uses direct WebSocket with API key
        // For client-side connection, we return the agent ID and let the frontend
        // use the @elevenlabs/react package which handles the connection
        // The API key is passed via the bewerbungstrainerConfig global

        return new WP_REST_Response(array(
            'success' => true,
            'data' => array(
                'agent_id' => $agent_id,
                // We don't generate a signed URL here because ElevenLabs ConvAI
                // uses the API key directly. The key is already passed to frontend
                // via bewerbungstrainerConfig in enqueue_frontend_assets()
            ),
        ), 200);
    }

    /**
     * Format roleplay session for API response
     *
     * @param object $session Session object from database
     * @return array Formatted session data
     */
    private function format_roleplay_session($session) {
        $variables = $session->variables_json ? json_decode($session->variables_json, true) : array();

        // Get scenario details if available
        $scenario = null;
        if ($session->scenario_id) {
            $scenario = $this->roleplay_scenarios->get_scenario($session->scenario_id);
        }

        // Get display name for session
        $display_name = '';
        if (!empty($session->user_name)) {
            $display_name = $session->user_name;
        } elseif ($session->user_id > 0) {
            $user = get_userdata($session->user_id);
            $display_name = $user ? $user->display_name : '';
        }

        return array(
            'id' => (int) $session->id,
            'session_id' => $session->session_id,
            'user_id' => (int) $session->user_id,
            'user_name' => $session->user_name,
            'display_name' => $display_name,
            'scenario_id' => $session->scenario_id ? (int) $session->scenario_id : null,
            'scenario' => $scenario,
            'agent_id' => $session->agent_id,
            'variables' => $variables,
            'transcript' => $session->transcript,
            'feedback_json' => $session->feedback_json ? json_decode($session->feedback_json, true) : null,
            'audio_analysis_json' => $session->audio_analysis_json ? json_decode($session->audio_analysis_json, true) : null,
            'conversation_id' => $session->conversation_id,
            'duration' => $session->duration ? (int) $session->duration : null,
            'created_at' => $session->created_at,
            'updated_at' => $session->updated_at,
        );
    }
}
