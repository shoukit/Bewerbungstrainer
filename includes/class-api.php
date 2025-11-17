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

        add_action('rest_api_init', array($this, 'register_routes'));
    }

    /**
     * Register REST API routes
     */
    public function register_routes() {
        // Create new session
        register_rest_route($this->namespace, '/sessions', array(
            'methods' => 'POST',
            'callback' => array($this, 'create_session'),
            'permission_callback' => array($this, 'check_user_logged_in'),
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

        // Update session
        register_rest_route($this->namespace, '/sessions/(?P<id>\d+)', array(
            'methods' => 'PUT',
            'callback' => array($this, 'update_session'),
            'permission_callback' => array($this, 'check_user_logged_in'),
        ));

        // Delete session
        register_rest_route($this->namespace, '/sessions/(?P<id>\d+)', array(
            'methods' => 'DELETE',
            'callback' => array($this, 'delete_session'),
            'permission_callback' => array($this, 'check_user_logged_in'),
        ));

        // Save audio from ElevenLabs
        register_rest_route($this->namespace, '/audio/save-elevenlabs', array(
            'methods' => 'POST',
            'callback' => array($this, 'save_audio_elevenlabs'),
            'permission_callback' => array($this, 'check_user_logged_in'),
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
    }

    /**
     * Permission callback - check if user is logged in
     */
    public function check_user_logged_in() {
        return is_user_logged_in();
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
        if (empty($params['position']) || empty($params['company'])) {
            return new WP_Error(
                'missing_fields',
                __('Position und Unternehmen sind erforderlich.', 'bewerbungstrainer'),
                array('status' => 400)
            );
        }

        // Create session
        $session_data = array(
            'user_id' => get_current_user_id(),
            'session_id' => isset($params['session_id']) ? $params['session_id'] : wp_generate_uuid4(),
            'position' => $params['position'],
            'company' => $params['company'],
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

        // Check ownership
        if ((int) $session->user_id !== get_current_user_id()) {
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
        return array(
            'id' => (int) $session->id,
            'session_id' => $session->session_id,
            'user_id' => (int) $session->user_id,
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
}
