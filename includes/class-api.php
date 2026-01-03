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
     * Roleplay scenarios instance (legacy CPT)
     */
    private $roleplay_scenarios;

    /**
     * Roleplay database instance (new unified table)
     */
    private $roleplay_db;

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
        $this->roleplay_db = Bewerbungstrainer_Roleplay_Database::get_instance();

        // Disable cookie authentication errors for public scenario endpoints
        add_filter('rest_authentication_errors', array($this, 'disable_cookie_check_for_public_endpoints'));

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

        // Transcribe audio using Whisper
        register_rest_route($this->namespace, '/audio/transcribe', array(
            'methods' => 'POST',
            'callback' => array($this, 'transcribe_audio'),
            'permission_callback' => array($this, 'allow_all_users'),
        ));

        // Get user info
        register_rest_route($this->namespace, '/user/info', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_user_info'),
            'permission_callback' => array($this, 'check_user_logged_in'),
        ));

        // Get user setup preference
        register_rest_route($this->namespace, '/user/setup', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_user_setup'),
            'permission_callback' => array($this, 'check_user_logged_in'),
        ));

        // Save user setup preference
        register_rest_route($this->namespace, '/user/setup', array(
            'methods' => 'POST',
            'callback' => array($this, 'save_user_setup'),
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
            'methods' => 'POST',
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

        // Get session audio from ElevenLabs (proxy to avoid CORS)
        register_rest_route($this->namespace, '/roleplays/sessions/(?P<id>\d+)/audio', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_session_audio'),
            'permission_callback' => array($this, 'check_user_logged_in'),
        ));

        // Generate ElevenLabs signed URL (SECURE - never expose API key!)
        register_rest_route($this->namespace, '/elevenlabs/signed-url', array(
            'methods' => 'POST',
            'callback' => array($this, 'generate_elevenlabs_signed_url'),
            'permission_callback' => array($this, 'allow_all_users'),
        ));

        // ===== Admin Management Endpoints =====

        // Check if current user is admin
        register_rest_route($this->namespace, '/admin/check', array(
            'methods' => 'GET',
            'callback' => array($this, 'admin_check_status'),
            'permission_callback' => array($this, 'check_user_logged_in'),
        ));

        // Admin: Get all roleplay scenarios (including drafts)
        register_rest_route($this->namespace, '/admin/roleplays', array(
            'methods' => 'GET',
            'callback' => array($this, 'admin_get_roleplay_scenarios'),
            'permission_callback' => array($this, 'check_is_admin'),
        ));

        // Admin: Create roleplay scenario
        register_rest_route($this->namespace, '/admin/roleplays', array(
            'methods' => 'POST',
            'callback' => array($this, 'admin_create_roleplay_scenario'),
            'permission_callback' => array($this, 'check_is_admin'),
        ));

        // Admin: Update roleplay scenario
        register_rest_route($this->namespace, '/admin/roleplays/(?P<id>\d+)', array(
            'methods' => 'PUT',
            'callback' => array($this, 'admin_update_roleplay_scenario'),
            'permission_callback' => array($this, 'check_is_admin'),
        ));

        // Admin: Delete roleplay scenario
        register_rest_route($this->namespace, '/admin/roleplays/(?P<id>\d+)', array(
            'methods' => 'DELETE',
            'callback' => array($this, 'admin_delete_roleplay_scenario'),
            'permission_callback' => array($this, 'check_is_admin'),
        ));

        // ===== Usage Limits Endpoints =====

        // Get usage limits for current user
        register_rest_route($this->namespace, '/usage-limits', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_usage_limits'),
            'permission_callback' => array($this, 'check_user_logged_in'),
        ));

        // Update roleplay session duration
        register_rest_route($this->namespace, '/roleplays/sessions/(?P<id>\d+)/duration', array(
            'methods' => 'POST',
            'callback' => array($this, 'update_session_duration'),
            'permission_callback' => array($this, 'allow_all_users'),
        ));

        // Admin: Get all partners
        register_rest_route($this->namespace, '/admin/partners', array(
            'methods' => 'GET',
            'callback' => array($this, 'admin_get_partners'),
            'permission_callback' => array($this, 'check_is_admin'),
        ));

        // Admin: Create partner
        register_rest_route($this->namespace, '/admin/partners', array(
            'methods' => 'POST',
            'callback' => array($this, 'admin_create_partner'),
            'permission_callback' => array($this, 'check_is_admin'),
        ));

        // Admin: Update partner
        register_rest_route($this->namespace, '/admin/partners/(?P<id>\d+)', array(
            'methods' => 'PUT',
            'callback' => array($this, 'admin_update_partner'),
            'permission_callback' => array($this, 'check_is_admin'),
        ));

        // Admin: Delete partner
        register_rest_route($this->namespace, '/admin/partners/(?P<id>\d+)', array(
            'methods' => 'DELETE',
            'callback' => array($this, 'admin_delete_partner'),
            'permission_callback' => array($this, 'check_is_admin'),
        ));

        // Admin: Get all simulator scenarios
        register_rest_route($this->namespace, '/admin/simulator-scenarios', array(
            'methods' => 'GET',
            'callback' => array($this, 'admin_get_simulator_scenarios'),
            'permission_callback' => array($this, 'check_is_admin'),
        ));

        // Admin: Get all video training scenarios
        register_rest_route($this->namespace, '/admin/video-training-scenarios', array(
            'methods' => 'GET',
            'callback' => array($this, 'admin_get_video_training_scenarios'),
            'permission_callback' => array($this, 'check_is_admin'),
        ));

        // ===== Demo Code Endpoints =====

        // Activate demo code with contact info
        // Uses allow_all_users to handle nonce validation more gracefully after login
        register_rest_route($this->namespace, '/demo/activate', array(
            'methods' => 'POST',
            'callback' => array($this, 'activate_demo_code'),
            'permission_callback' => array($this, 'allow_all_users'),
        ));

        // Validate demo code (check if valid)
        register_rest_route($this->namespace, '/demo/validate', array(
            'methods' => 'POST',
            'callback' => array($this, 'validate_demo_code'),
            'permission_callback' => array($this, 'allow_all_users'),
        ));

        // Admin: Get all demo codes
        register_rest_route($this->namespace, '/admin/demo-codes', array(
            'methods' => 'GET',
            'callback' => array($this, 'admin_get_demo_codes'),
            'permission_callback' => array($this, 'check_is_admin'),
        ));

        // Admin: Add more demo codes
        register_rest_route($this->namespace, '/admin/demo-codes/generate', array(
            'methods' => 'POST',
            'callback' => array($this, 'admin_generate_demo_codes'),
            'permission_callback' => array($this, 'check_is_admin'),
        ));

        // ===== Logging Endpoints =====

        // Log prompt (for frontend to log ElevenLabs/Gemini prompts)
        register_rest_route($this->namespace, '/log-prompt', array(
            'methods' => 'POST',
            'callback' => array($this, 'log_prompt'),
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
     * Disable cookie authentication check for public scenario endpoints
     *
     * This allows public endpoints to work without nonce validation
     * since they use the allow_all_users permission callback.
     * This fixes 403 "Cookie check failed" errors after re-login.
     *
     * @param WP_Error|null|bool $result Error from another authentication handler, null if not errors, true if authentication succeeded.
     * @return WP_Error|null|bool
     */
    public function disable_cookie_check_for_public_endpoints($result) {
        // Get the current REST route
        $route = $_SERVER['REQUEST_URI'] ?? '';

        // List of public endpoints that should bypass cookie authentication
        $public_endpoints = array(
            '/bewerbungstrainer/v1/video-training/scenarios',
            '/bewerbungstrainer/v1/video-training/sessions',
            '/bewerbungstrainer/v1/simulator/scenarios',
            '/bewerbungstrainer/v1/simulator/sessions',
            '/bewerbungstrainer/v1/roleplays',
            '/bewerbungstrainer/v1/sessions',
            '/bewerbungstrainer/v1/demo/activate',
            '/bewerbungstrainer/v1/demo/validate',
            '/bewerbungstrainer/v1/log-prompt',
            '/bewerbungstrainer/v1/smartbriefing/templates',
            '/bewerbungstrainer/v1/smartbriefing/briefings',
            '/bewerbungstrainer/v1/smartbriefing/generate',
            '/bewerbungstrainer/v1/smartbriefing/sections',
            '/bewerbungstrainer/v1/usage-limits',
            '/bewerbungstrainer/v1/disclaimer/current',
            '/bewerbungstrainer/v1/disclaimer/status',
            '/bewerbungstrainer/v1/disclaimer/acknowledge',
            '/bewerbungstrainer/v1/game/stats',
            '/bewerbungstrainer/v1/game/sessions',
        );

        // Check if this is a public endpoint
        foreach ($public_endpoints as $endpoint) {
            if (strpos($route, $endpoint) !== false) {
                // For public endpoints, override any cookie authentication errors
                // This allows demo users and users with invalid cookies to still access public endpoints
                return true;
            }
        }

        // For non-public endpoints, respect existing authentication results
        // If another auth method already succeeded, keep it
        if (true === $result) {
            return $result;
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

        // Sanitize custom_title if present
        if (isset($params['custom_title'])) {
            $params['custom_title'] = sanitize_text_field($params['custom_title']);
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
     * Get user's scenario setup preference
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response Response object
     */
    public function get_user_setup($request) {
        $user_id = get_current_user_id();
        $setup_id = get_user_meta($user_id, 'bewerbungstrainer_setup', true);

        return new WP_REST_Response(array(
            'success' => true,
            'data' => array(
                'setup_id' => $setup_id ?: null,
            ),
        ), 200);
    }

    /**
     * Save user's scenario setup preference
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response Response object
     */
    public function save_user_setup($request) {
        $user_id = get_current_user_id();
        $setup_id = $request->get_param('setup_id');

        // Validate setup_id - allow null/empty to clear
        if (empty($setup_id)) {
            delete_user_meta($user_id, 'bewerbungstrainer_setup');
        } else {
            // Sanitize and save
            $setup_id = sanitize_text_field($setup_id);
            update_user_meta($user_id, 'bewerbungstrainer_setup', $setup_id);
        }

        return new WP_REST_Response(array(
            'success' => true,
            'data' => array(
                'setup_id' => $setup_id ?: null,
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
     * @return WP_REST_Response Response with base64 PDF data
     */
    public function export_session_pdf($request) {
        $session_id = intval($request['id']);
        $user_id = get_current_user_id();

        // Get PDF as base64 for REST API response
        $result = $this->pdf_exporter->get_session_pdf_base64($session_id, $user_id);

        if (is_wp_error($result)) {
            error_log('[PDF EXPORT API] Error: ' . $result->get_error_code() . ' - ' . $result->get_error_message());
            return new WP_REST_Response(array(
                'success' => false,
                'error' => $result->get_error_message(),
                'error_code' => $result->get_error_code(),
            ), 400);
        }

        return new WP_REST_Response(array(
            'success' => true,
            'pdf_base64' => $result['pdf_base64'],
            'filename' => $result['filename'],
            'content_type' => $result['content_type'],
        ), 200);
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

        // Check if we should use the new database table
        $use_db = $this->roleplay_db->get_scenarios_count() > 0;

        if ($use_db) {
            // Use new database table
            $db_args = array(
                'is_active' => 1,
            );

            // Filter by difficulty
            if (isset($params['difficulty'])) {
                // Note: difficulty filtering would need custom implementation if needed
            }

            // Filter by category
            if (isset($params['category'])) {
                $db_args['category'] = sanitize_text_field($params['category']);
            }

            // Filter by target audience
            if (isset($params['target_audience'])) {
                $db_args['target_audience'] = sanitize_text_field($params['target_audience']);
            }

            $db_scenarios = $this->roleplay_db->get_scenarios($db_args);

            // Format for API response (match existing structure)
            $scenarios = array();
            foreach ($db_scenarios as $scenario) {
                $scenarios[] = $this->format_db_scenario_for_api($scenario);
            }

            return new WP_REST_Response(array(
                'success' => true,
                'data' => $scenarios,
                'source' => 'database',
            ), 200);
        }

        // Fallback to legacy CPT
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
            'source' => 'cpt',
        ), 200);
    }

    /**
     * Format database scenario for API response
     *
     * @param object $scenario Database scenario object
     * @return array Formatted scenario
     */
    private function format_db_scenario_for_api($scenario) {
        // Parse JSON fields
        $category = json_decode($scenario->category, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            $category = array();
        }

        $tips = json_decode($scenario->tips, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            $tips = array();
        }

        $input_configuration = json_decode($scenario->input_configuration, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            $input_configuration = array();
        }

        return array(
            'id' => intval($scenario->id),
            'title' => $scenario->title,
            'description' => $scenario->description,
            'long_description' => $scenario->long_description,
            'icon' => $scenario->icon ?: 'mic',
            'difficulty' => $scenario->difficulty,
            'target_audience' => $scenario->target_audience,
            'category' => $category,
            'role_type' => $scenario->role_type,
            'user_role_label' => $scenario->user_role_label,
            'agent_id' => $scenario->agent_id,
            'voice_id' => $scenario->voice_id ?? '',
            'initial_message' => $scenario->initial_message ?? '',
            'system_prompt' => $scenario->system_prompt,
            'content' => $scenario->system_prompt, // Alias for frontend compatibility
            'feedback_prompt' => $scenario->feedback_prompt,
            'ai_instructions' => $scenario->ai_instructions,
            'tips' => $tips,
            'variables_schema' => $input_configuration,
            'is_active' => (bool) $scenario->is_active,
            'sort_order' => intval($scenario->sort_order),
            'interviewer_profile' => array(
                'name' => $scenario->interviewer_name ?? '',
                'role' => $scenario->interviewer_role ?? '',
                'image_url' => $scenario->interviewer_image ?? '',
                'properties' => $scenario->interviewer_properties ?? '',
                'typical_objections' => $scenario->interviewer_objections ?? '',
                'important_questions' => $scenario->interviewer_questions ?? '',
                'editable_fields' => !empty($scenario->interviewer_editable_fields)
                    ? json_decode($scenario->interviewer_editable_fields, true)
                    : array(),
            ),
            'tags' => array(),
            'coaching_hints' => $scenario->coaching_hints ?? '',
        );
    }

    /**
     * Get specific roleplay scenario
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response|WP_Error Response object
     */
    public function get_roleplay_scenario($request) {
        $scenario_id = intval($request['id']);

        // Check if we should use the new database table
        $use_db = $this->roleplay_db->get_scenarios_count() > 0;

        if ($use_db) {
            // Try database first
            $db_scenario = $this->roleplay_db->get_scenario($scenario_id);

            if ($db_scenario) {
                return new WP_REST_Response(array(
                    'success' => true,
                    'data' => $this->format_db_scenario_for_api($db_scenario),
                    'source' => 'database',
                ), 200);
            }
        }

        // Fallback to legacy CPT
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
            'source' => 'cpt',
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
            'demo_code' => isset($params['demo_code']) ? strtoupper(sanitize_text_field($params['demo_code'])) : null,
        );

        // For demo users, update the demo code usage counter
        if (!empty($session_data['demo_code'])) {
            $demo_codes = Bewerbungstrainer_Demo_Codes::get_instance();
            $demo_codes->update_usage($session_data['demo_code']);
        }

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

        // Log incoming data for debugging
        error_log('Bewerbungstrainer: Update session ' . $session_id . ' with params: ' . print_r(array_keys($params), true));

        // Prepare update data
        $update_data = array();

        if (isset($params['transcript'])) {
            $update_data['transcript'] = $params['transcript'];
        }

        if (isset($params['feedback_json'])) {
            // Clean markdown wrappers before storing and ensure valid JSON
            $feedback = $params['feedback_json'];
            if (is_string($feedback)) {
                $cleaned = $this->clean_json_string($feedback);
                // Validate it's valid JSON - try with UTF8 flag as fallback
                $test_decode = json_decode($cleaned, true);
                if ($test_decode === null) {
                    $test_decode = json_decode($cleaned, true, 512, JSON_INVALID_UTF8_SUBSTITUTE);
                }
                if ($test_decode !== null) {
                    // Store as clean JSON string
                    $update_data['feedback_json'] = json_encode($test_decode, JSON_UNESCAPED_UNICODE);
                } else {
                    // Store cleaned version even if we can't parse it
                    $update_data['feedback_json'] = $cleaned;
                    error_log('Bewerbungstrainer: Could not parse feedback_json (' . json_last_error_msg() . '), storing cleaned: ' . substr($cleaned, 0, 100));
                }
            } else {
                // If it's already an array/object, encode it
                $update_data['feedback_json'] = json_encode($feedback, JSON_UNESCAPED_UNICODE);
            }
        }

        if (isset($params['audio_analysis_json'])) {
            // Clean markdown wrappers before storing and ensure valid JSON
            $audio = $params['audio_analysis_json'];
            if (is_string($audio)) {
                $cleaned = $this->clean_json_string($audio);
                // Validate it's valid JSON - try with UTF8 flag as fallback
                $test_decode = json_decode($cleaned, true);
                if ($test_decode === null) {
                    $test_decode = json_decode($cleaned, true, 512, JSON_INVALID_UTF8_SUBSTITUTE);
                }
                if ($test_decode !== null) {
                    // Store as clean JSON string
                    $update_data['audio_analysis_json'] = json_encode($test_decode, JSON_UNESCAPED_UNICODE);
                } else {
                    // Store cleaned version even if we can't parse it
                    $update_data['audio_analysis_json'] = $cleaned;
                    error_log('Bewerbungstrainer: Could not parse audio_analysis_json (' . json_last_error_msg() . '), storing cleaned: ' . substr($cleaned, 0, 100));
                }
            } else {
                // If it's already an array/object, encode it
                $update_data['audio_analysis_json'] = json_encode($audio, JSON_UNESCAPED_UNICODE);
            }
        }

        if (isset($params['conversation_id'])) {
            $update_data['conversation_id'] = $params['conversation_id'];
        }

        if (isset($params['duration'])) {
            $update_data['duration'] = intval($params['duration']);
        }

        error_log('Bewerbungstrainer: Update data keys: ' . print_r(array_keys($update_data), true));

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
        $current_user_id = get_current_user_id();
        $is_demo_user = Bewerbungstrainer_Demo_Codes::is_demo_user();

        $args = array(
            'limit' => isset($params['limit']) ? intval($params['limit']) : 50,
            'offset' => isset($params['offset']) ? intval($params['offset']) : 0,
            'orderby' => isset($params['orderby']) ? $params['orderby'] : 'created_at',
            'order' => isset($params['order']) ? $params['order'] : 'DESC',
            'scenario_id' => isset($params['scenario_id']) ? intval($params['scenario_id']) : null,
            'demo_code' => isset($params['demo_code']) ? strtoupper(sanitize_text_field($params['demo_code'])) : null,
        );

        // Check if current user is demo user and filter by demo_code
        if ($is_demo_user && !empty($args['demo_code'])) {
            // Demo user with code - filter by code
            $sessions = $this->db->get_user_roleplay_sessions($current_user_id, $args);
            $total = $this->db->get_user_roleplay_sessions_count($current_user_id, $args['scenario_id'], $args['demo_code']);
        } else if ($is_demo_user && empty($args['demo_code'])) {
            // Demo user without code - return empty (they need a code to see sessions)
            $sessions = array();
            $total = 0;
        } else {
            // Regular user - normal behavior
            $sessions = $this->db->get_user_roleplay_sessions($current_user_id, $args);
            $total = $this->db->get_user_roleplay_sessions_count($current_user_id, $args['scenario_id']);
        }

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
     * Get session audio from ElevenLabs (proxy to avoid CORS)
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response|WP_Error Response object
     */
    public function get_session_audio($request) {
        $session_id = $request->get_param('id');

        // Get session from database
        $session = $this->db->get_roleplay_session($session_id);

        if (!$session) {
            return new WP_Error('session_not_found', 'Session nicht gefunden', array('status' => 404));
        }

        // Security check: Ensure user owns this session
        if ((int) $session->user_id !== get_current_user_id()) {
            return new WP_Error('unauthorized', 'Keine Berechtigung', array('status' => 403));
        }

        // Check if conversation_id exists
        if (empty($session->conversation_id)) {
            return new WP_Error('no_conversation_id', 'Keine ElevenLabs Conversation ID gefunden', array('status' => 400));
        }

        // Get ElevenLabs API key
        $api_key = get_option('bewerbungstrainer_elevenlabs_api_key');
        if (empty($api_key)) {
            return new WP_Error('no_api_key', 'ElevenLabs API Key nicht konfiguriert', array('status' => 500));
        }

        // Fetch audio from ElevenLabs Conversation History API
        $elevenlabs_url = 'https://api.elevenlabs.io/v1/convai/conversations/' . $session->conversation_id . '/audio';

        $response = wp_remote_get($elevenlabs_url, array(
            'headers' => array(
                'xi-api-key' => $api_key,
            ),
            'timeout' => 30,
        ));

        if (is_wp_error($response)) {
            return new WP_Error('fetch_failed', 'Audio konnte nicht von ElevenLabs geladen werden: ' . $response->get_error_message(), array('status' => 500));
        }

        $status_code = wp_remote_retrieve_response_code($response);
        if ($status_code !== 200) {
            return new WP_Error('elevenlabs_error', 'ElevenLabs API Fehler (Status: ' . $status_code . ')', array('status' => $status_code));
        }

        // Get audio data
        $audio_data = wp_remote_retrieve_body($response);
        $content_type = wp_remote_retrieve_header($response, 'content-type');

        // Stream audio back to client
        header('Content-Type: ' . ($content_type ?: 'audio/mpeg'));
        header('Content-Length: ' . strlen($audio_data));
        header('Accept-Ranges: bytes');
        echo $audio_data;
        exit;
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
     * Clean JSON string by removing markdown code blocks
     *
     * Gemini API sometimes returns JSON wrapped in ```json ... ``` blocks.
     * This function strips those wrappers to get clean JSON.
     *
     * @param string $json_string The JSON string that might have markdown wrappers
     * @return string Clean JSON string
     */
    private function clean_json_string($json_string) {
        if (empty($json_string)) {
            return $json_string;
        }

        $cleaned = trim($json_string);

        // Remove ```json or ``` prefix (with optional whitespace/newlines after)
        $cleaned = preg_replace('/^```json\s*/i', '', $cleaned);
        $cleaned = preg_replace('/^```\s*/', '', $cleaned);

        // Remove trailing ``` (with optional whitespace/newlines before)
        $cleaned = preg_replace('/\s*```\s*$/', '', $cleaned);

        return trim($cleaned);
    }

    /**
     * Safely decode JSON, handling markdown-wrapped responses
     *
     * @param string $json_string The JSON string to decode
     * @return array|null Decoded array or null on failure
     */
    private function safe_json_decode($json_string) {
        if (empty($json_string)) {
            return null;
        }

        // First try to decode as-is
        $decoded = json_decode($json_string, true);
        if ($decoded !== null) {
            return $decoded;
        }

        // If that failed, try cleaning the string first (remove markdown wrappers)
        $cleaned = $this->clean_json_string($json_string);
        $decoded = json_decode($cleaned, true);

        if ($decoded !== null) {
            return $decoded;
        }

        // Try with JSON_INVALID_UTF8_SUBSTITUTE flag to handle encoding issues
        $decoded = json_decode($cleaned, true, 512, JSON_INVALID_UTF8_SUBSTITUTE);
        if ($decoded !== null) {
            return $decoded;
        }

        // Log error for debugging
        $json_error = json_last_error_msg();
        error_log('Bewerbungstrainer: Failed to decode JSON (' . $json_error . ') - ' . substr($json_string, 0, 100) . '...');

        // Return the cleaned string so frontend can try to parse it
        // This is better than returning null and losing the data
        return $cleaned;
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
            'feedback_json' => $this->safe_json_decode($session->feedback_json),
            'audio_analysis_json' => $this->safe_json_decode($session->audio_analysis_json),
            'conversation_id' => $session->conversation_id,
            'audio_filename' => $session->audio_filename ?? null,
            'audio_url' => $session->audio_url ?? null,
            'duration' => $session->duration ? (int) $session->duration : null,
            'created_at' => $session->created_at,
            'updated_at' => $session->updated_at,
        );
    }

    // ===== ADMIN MANAGEMENT ENDPOINTS =====

    /**
     * Admin: Check if user is admin
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response Response object
     */
    public function admin_check_status($request) {
        $is_admin = current_user_can('manage_options');

        return new WP_REST_Response(array(
            'success' => true,
            'data' => array(
                'isAdmin' => $is_admin,
            ),
        ), 200);
    }

    /**
     * Admin: Get all roleplay scenarios (including drafts)
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response Response object
     */
    public function admin_get_roleplay_scenarios($request) {
        $args = array(
            'post_type' => 'roleplay_scenario',
            'post_status' => array('publish', 'draft', 'pending'),
            'posts_per_page' => -1,
            'orderby' => 'title',
            'order' => 'ASC'
        );

        $query = new WP_Query($args);
        $scenarios = array();

        if ($query->have_posts()) {
            while ($query->have_posts()) {
                $query->the_post();
                $post = get_post();
                $scenarios[] = $this->format_admin_roleplay_scenario($post);
            }
            wp_reset_postdata();
        }

        return new WP_REST_Response(array(
            'success' => true,
            'data' => $scenarios,
        ), 200);
    }

    /**
     * Format roleplay scenario for admin API
     */
    private function format_admin_roleplay_scenario($post) {
        $variables_json = get_post_meta($post->ID, '_roleplay_variables_schema', true);
        $variables = $variables_json ? json_decode($variables_json, true) : array();

        $tags = wp_get_post_terms($post->ID, 'roleplay_scenario_tag', array('fields' => 'names'));

        return array(
            'id' => $post->ID,
            'title' => get_the_title($post),
            'status' => $post->post_status,
            'description' => get_post_meta($post->ID, '_roleplay_description', true),
            'content' => $post->post_content,
            'agent_id' => get_post_meta($post->ID, '_roleplay_agent_id', true),
            'initial_message' => get_post_meta($post->ID, '_roleplay_initial_message', true),
            'difficulty' => get_post_meta($post->ID, '_roleplay_difficulty', true),
            'variables_schema' => $variables,
            'allow_custom_variables' => (bool) get_post_meta($post->ID, '_roleplay_allow_custom_variables', true),
            'tags' => is_array($tags) ? $tags : array(),
            'feedback_prompt' => get_post_meta($post->ID, '_roleplay_feedback_prompt', true),
            'interviewer_profile' => array(
                'name' => get_post_meta($post->ID, '_roleplay_interviewer_name', true),
                'role' => get_post_meta($post->ID, '_roleplay_interviewer_role', true),
                'image_url' => get_post_meta($post->ID, '_roleplay_interviewer_image', true),
                'properties' => get_post_meta($post->ID, '_roleplay_interviewer_properties', true),
                'typical_objections' => get_post_meta($post->ID, '_roleplay_interviewer_objections', true),
                'important_questions' => get_post_meta($post->ID, '_roleplay_interviewer_questions', true),
            ),
            'coaching_hints' => get_post_meta($post->ID, '_roleplay_coaching_hints', true),
            'created_at' => $post->post_date,
            'updated_at' => $post->post_modified,
        );
    }

    /**
     * Admin: Create roleplay scenario
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response|WP_Error Response object
     */
    public function admin_create_roleplay_scenario($request) {
        $params = $request->get_json_params();

        if (empty($params['title'])) {
            return new WP_Error(
                'missing_title',
                __('Titel ist erforderlich.', 'bewerbungstrainer'),
                array('status' => 400)
            );
        }

        // Create post
        $post_id = wp_insert_post(array(
            'post_type' => 'roleplay_scenario',
            'post_title' => sanitize_text_field($params['title']),
            'post_content' => isset($params['content']) ? wp_kses_post($params['content']) : '',
            'post_status' => isset($params['status']) ? sanitize_text_field($params['status']) : 'draft',
        ));

        if (is_wp_error($post_id)) {
            return new WP_Error(
                'create_failed',
                __('Fehler beim Erstellen des Szenarios.', 'bewerbungstrainer'),
                array('status' => 500)
            );
        }

        // Save meta fields
        $this->save_roleplay_scenario_meta($post_id, $params);

        // Save tags
        if (!empty($params['tags']) && is_array($params['tags'])) {
            wp_set_post_terms($post_id, $params['tags'], 'roleplay_scenario_tag');
        }

        $post = get_post($post_id);

        return new WP_REST_Response(array(
            'success' => true,
            'data' => $this->format_admin_roleplay_scenario($post),
        ), 201);
    }

    /**
     * Admin: Update roleplay scenario
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response|WP_Error Response object
     */
    public function admin_update_roleplay_scenario($request) {
        $post_id = intval($request['id']);
        $post = get_post($post_id);

        if (!$post || $post->post_type !== 'roleplay_scenario') {
            return new WP_Error(
                'not_found',
                __('Szenario nicht gefunden.', 'bewerbungstrainer'),
                array('status' => 404)
            );
        }

        $params = $request->get_json_params();

        // Update post
        $update_data = array('ID' => $post_id);

        if (isset($params['title'])) {
            $update_data['post_title'] = sanitize_text_field($params['title']);
        }
        if (isset($params['content'])) {
            $update_data['post_content'] = wp_kses_post($params['content']);
        }
        if (isset($params['status'])) {
            $update_data['post_status'] = sanitize_text_field($params['status']);
        }

        $result = wp_update_post($update_data, true);

        if (is_wp_error($result)) {
            return new WP_Error(
                'update_failed',
                __('Fehler beim Aktualisieren des Szenarios.', 'bewerbungstrainer'),
                array('status' => 500)
            );
        }

        // Save meta fields
        $this->save_roleplay_scenario_meta($post_id, $params);

        // Save tags
        if (isset($params['tags']) && is_array($params['tags'])) {
            wp_set_post_terms($post_id, $params['tags'], 'roleplay_scenario_tag');
        }

        $post = get_post($post_id);

        return new WP_REST_Response(array(
            'success' => true,
            'data' => $this->format_admin_roleplay_scenario($post),
        ), 200);
    }

    /**
     * Save roleplay scenario meta fields
     */
    private function save_roleplay_scenario_meta($post_id, $params) {
        if (isset($params['agent_id'])) {
            update_post_meta($post_id, '_roleplay_agent_id', sanitize_text_field($params['agent_id']));
        }
        if (isset($params['description'])) {
            update_post_meta($post_id, '_roleplay_description', sanitize_textarea_field($params['description']));
        }
        if (isset($params['initial_message'])) {
            update_post_meta($post_id, '_roleplay_initial_message', sanitize_textarea_field($params['initial_message']));
        }
        if (isset($params['difficulty'])) {
            $difficulty = sanitize_text_field($params['difficulty']);
            if (in_array($difficulty, array('easy', 'medium', 'hard'))) {
                update_post_meta($post_id, '_roleplay_difficulty', $difficulty);
            }
        }
        if (isset($params['feedback_prompt'])) {
            update_post_meta($post_id, '_roleplay_feedback_prompt', sanitize_textarea_field($params['feedback_prompt']));
        }
        if (isset($params['coaching_hints'])) {
            update_post_meta($post_id, '_roleplay_coaching_hints', sanitize_textarea_field($params['coaching_hints']));
        }

        // Interviewer profile
        if (isset($params['interviewer_profile']) && is_array($params['interviewer_profile'])) {
            $profile = $params['interviewer_profile'];
            if (isset($profile['name'])) {
                update_post_meta($post_id, '_roleplay_interviewer_name', sanitize_text_field($profile['name']));
            }
            if (isset($profile['role'])) {
                update_post_meta($post_id, '_roleplay_interviewer_role', sanitize_text_field($profile['role']));
            }
            if (isset($profile['image_url'])) {
                update_post_meta($post_id, '_roleplay_interviewer_image', esc_url_raw($profile['image_url']));
            }
            if (isset($profile['properties'])) {
                update_post_meta($post_id, '_roleplay_interviewer_properties', sanitize_textarea_field($profile['properties']));
            }
            if (isset($profile['typical_objections'])) {
                update_post_meta($post_id, '_roleplay_interviewer_objections', sanitize_textarea_field($profile['typical_objections']));
            }
            if (isset($profile['important_questions'])) {
                update_post_meta($post_id, '_roleplay_interviewer_questions', sanitize_textarea_field($profile['important_questions']));
            }
        }

        // Variables schema
        if (isset($params['variables_schema']) && is_array($params['variables_schema'])) {
            $variables = array();
            foreach ($params['variables_schema'] as $variable) {
                if (!empty($variable['key']) && !empty($variable['label'])) {
                    $variables[] = array(
                        'key' => sanitize_key($variable['key']),
                        'label' => sanitize_text_field($variable['label']),
                        'type' => in_array($variable['type'], array('text', 'number', 'textarea')) ? $variable['type'] : 'text',
                        'default' => isset($variable['default']) ? sanitize_text_field($variable['default']) : '',
                        'required' => isset($variable['required']) ? (bool) $variable['required'] : false,
                        'user_input' => isset($variable['user_input']) ? (bool) $variable['user_input'] : true,
                    );
                }
            }
            update_post_meta($post_id, '_roleplay_variables_schema', wp_json_encode($variables));
        }
    }

    /**
     * Admin: Delete roleplay scenario
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response|WP_Error Response object
     */
    public function admin_delete_roleplay_scenario($request) {
        $post_id = intval($request['id']);
        $post = get_post($post_id);

        if (!$post || $post->post_type !== 'roleplay_scenario') {
            return new WP_Error(
                'not_found',
                __('Szenario nicht gefunden.', 'bewerbungstrainer'),
                array('status' => 404)
            );
        }

        $result = wp_delete_post($post_id, true);

        if (!$result) {
            return new WP_Error(
                'delete_failed',
                __('Fehler beim Löschen des Szenarios.', 'bewerbungstrainer'),
                array('status' => 500)
            );
        }

        return new WP_REST_Response(array(
            'success' => true,
            'message' => __('Szenario erfolgreich gelöscht.', 'bewerbungstrainer'),
        ), 200);
    }

    /**
     * Admin: Get all partners
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response Response object
     */
    public function admin_get_partners($request) {
        $args = array(
            'post_type' => 'whitelabel_partner',
            'post_status' => array('publish', 'draft', 'pending'),
            'posts_per_page' => -1,
            'orderby' => 'title',
            'order' => 'ASC'
        );

        $query = new WP_Query($args);
        $partners = array();

        if ($query->have_posts()) {
            while ($query->have_posts()) {
                $query->the_post();
                $post = get_post();
                $partners[] = $this->format_admin_partner($post);
            }
            wp_reset_postdata();
        }

        return new WP_REST_Response(array(
            'success' => true,
            'data' => $partners,
        ), 200);
    }

    /**
     * Format partner for admin API
     */
    private function format_admin_partner($post) {
        $logo_id = get_post_meta($post->ID, '_partner_logo_id', true);
        $logo_url = $logo_id ? wp_get_attachment_url($logo_id) : null;

        $branding = get_post_meta($post->ID, '_partner_branding', true);
        if (!is_array($branding)) {
            $branding = array();
        }

        $modules = get_post_meta($post->ID, '_partner_modules', true);
        if (!is_array($modules)) {
            $modules = array();
        }

        $slug = get_post_meta($post->ID, '_partner_slug', true);
        if (empty($slug)) {
            $slug = $post->post_name;
        }

        return array(
            'id' => $post->ID,
            'name' => get_the_title($post),
            'slug' => $slug,
            'status' => $post->post_status,
            'description' => get_post_meta($post->ID, '_partner_description', true),
            'logo_url' => $logo_url,
            'logo_id' => $logo_id ? intval($logo_id) : null,
            'branding' => $branding,
            'modules' => $modules,
            'custom_scenarios' => get_post_meta($post->ID, '_partner_custom_scenarios', true),
            'created_at' => $post->post_date,
            'updated_at' => $post->post_modified,
        );
    }

    /**
     * Admin: Create partner
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response|WP_Error Response object
     */
    public function admin_create_partner($request) {
        $params = $request->get_json_params();

        if (empty($params['name'])) {
            return new WP_Error(
                'missing_name',
                __('Name ist erforderlich.', 'bewerbungstrainer'),
                array('status' => 400)
            );
        }

        $slug = isset($params['slug']) ? sanitize_title($params['slug']) : sanitize_title($params['name']);

        // Create post
        $post_id = wp_insert_post(array(
            'post_type' => 'whitelabel_partner',
            'post_title' => sanitize_text_field($params['name']),
            'post_name' => $slug,
            'post_status' => isset($params['status']) ? sanitize_text_field($params['status']) : 'draft',
        ));

        if (is_wp_error($post_id)) {
            return new WP_Error(
                'create_failed',
                __('Fehler beim Erstellen des Partners.', 'bewerbungstrainer'),
                array('status' => 500)
            );
        }

        // Save meta fields
        $this->save_partner_meta($post_id, $params);

        $post = get_post($post_id);

        return new WP_REST_Response(array(
            'success' => true,
            'data' => $this->format_admin_partner($post),
        ), 201);
    }

    /**
     * Admin: Update partner
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response|WP_Error Response object
     */
    public function admin_update_partner($request) {
        $post_id = intval($request['id']);
        $post = get_post($post_id);

        if (!$post || $post->post_type !== 'whitelabel_partner') {
            return new WP_Error(
                'not_found',
                __('Partner nicht gefunden.', 'bewerbungstrainer'),
                array('status' => 404)
            );
        }

        $params = $request->get_json_params();

        // Update post
        $update_data = array('ID' => $post_id);

        if (isset($params['name'])) {
            $update_data['post_title'] = sanitize_text_field($params['name']);
        }
        if (isset($params['slug'])) {
            $update_data['post_name'] = sanitize_title($params['slug']);
        }
        if (isset($params['status'])) {
            $update_data['post_status'] = sanitize_text_field($params['status']);
        }

        $result = wp_update_post($update_data, true);

        if (is_wp_error($result)) {
            return new WP_Error(
                'update_failed',
                __('Fehler beim Aktualisieren des Partners.', 'bewerbungstrainer'),
                array('status' => 500)
            );
        }

        // Save meta fields
        $this->save_partner_meta($post_id, $params);

        $post = get_post($post_id);

        return new WP_REST_Response(array(
            'success' => true,
            'data' => $this->format_admin_partner($post),
        ), 200);
    }

    /**
     * Save partner meta fields
     */
    private function save_partner_meta($post_id, $params) {
        if (isset($params['slug'])) {
            update_post_meta($post_id, '_partner_slug', sanitize_title($params['slug']));
        }
        if (isset($params['description'])) {
            update_post_meta($post_id, '_partner_description', sanitize_textarea_field($params['description']));
        }
        if (isset($params['logo_id'])) {
            if ($params['logo_id']) {
                update_post_meta($post_id, '_partner_logo_id', absint($params['logo_id']));
            } else {
                delete_post_meta($post_id, '_partner_logo_id');
            }
        }
        if (isset($params['branding']) && is_array($params['branding'])) {
            update_post_meta($post_id, '_partner_branding', $params['branding']);
        }
        if (isset($params['modules'])) {
            update_post_meta($post_id, '_partner_modules', is_array($params['modules']) ? $params['modules'] : array());
        }
        if (isset($params['custom_scenarios'])) {
            update_post_meta($post_id, '_partner_custom_scenarios', sanitize_textarea_field($params['custom_scenarios']));
        }
    }

    /**
     * Admin: Delete partner
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response|WP_Error Response object
     */
    public function admin_delete_partner($request) {
        $post_id = intval($request['id']);
        $post = get_post($post_id);

        if (!$post || $post->post_type !== 'whitelabel_partner') {
            return new WP_Error(
                'not_found',
                __('Partner nicht gefunden.', 'bewerbungstrainer'),
                array('status' => 404)
            );
        }

        $result = wp_delete_post($post_id, true);

        if (!$result) {
            return new WP_Error(
                'delete_failed',
                __('Fehler beim Löschen des Partners.', 'bewerbungstrainer'),
                array('status' => 500)
            );
        }

        return new WP_REST_Response(array(
            'success' => true,
            'message' => __('Partner erfolgreich gelöscht.', 'bewerbungstrainer'),
        ), 200);
    }

    /**
     * Admin: Get all simulator scenarios
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response Response object
     */
    public function admin_get_simulator_scenarios($request) {
        $args = array(
            'post_type' => 'simulator_scenario',
            'post_status' => array('publish', 'draft', 'pending'),
            'posts_per_page' => -1,
            'orderby' => 'title',
            'order' => 'ASC'
        );

        $query = new WP_Query($args);
        $scenarios = array();

        if ($query->have_posts()) {
            while ($query->have_posts()) {
                $query->the_post();
                $post = get_post();
                $scenarios[] = array(
                    'id' => $post->ID,
                    'title' => get_the_title($post),
                    'status' => $post->post_status,
                    'description' => get_post_meta($post->ID, '_simulator_description', true),
                    'category' => get_post_meta($post->ID, '_simulator_category', true),
                    'difficulty' => get_post_meta($post->ID, '_simulator_difficulty', true),
                    'questions_count' => get_post_meta($post->ID, '_simulator_questions_count', true),
                    'created_at' => $post->post_date,
                    'updated_at' => $post->post_modified,
                );
            }
            wp_reset_postdata();
        }

        return new WP_REST_Response(array(
            'success' => true,
            'data' => $scenarios,
        ), 200);
    }

    /**
     * Admin: Get all video training scenarios
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response Response object
     */
    public function admin_get_video_training_scenarios($request) {
        $args = array(
            'post_type' => 'video_training_scenario',
            'post_status' => array('publish', 'draft', 'pending'),
            'posts_per_page' => -1,
            'orderby' => 'title',
            'order' => 'ASC'
        );

        $query = new WP_Query($args);
        $scenarios = array();

        if ($query->have_posts()) {
            while ($query->have_posts()) {
                $query->the_post();
                $post = get_post();
                $scenarios[] = array(
                    'id' => $post->ID,
                    'title' => get_the_title($post),
                    'status' => $post->post_status,
                    'description' => get_post_meta($post->ID, '_video_training_description', true),
                    'category' => get_post_meta($post->ID, '_video_training_category', true),
                    'difficulty' => get_post_meta($post->ID, '_video_training_difficulty', true),
                    'created_at' => $post->post_date,
                    'updated_at' => $post->post_modified,
                );
            }
            wp_reset_postdata();
        }

        return new WP_REST_Response(array(
            'success' => true,
            'data' => $scenarios,
        ), 200);
    }

    // ===== Demo Code Methods =====

    /**
     * Activate demo code with contact info
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response|WP_Error Response object
     */
    public function activate_demo_code($request) {
        $params = $request->get_json_params();

        $demo_code = isset($params['demo_code']) ? strtoupper(sanitize_text_field($params['demo_code'])) : '';

        if (empty($demo_code)) {
            return new WP_REST_Response(array(
                'success' => false,
                'error' => array(
                    'code' => 'missing_code',
                    'message' => 'Bitte geben Sie einen Demo-Code ein.',
                ),
            ), 400);
        }

        // Get demo codes instance
        $demo_codes = Bewerbungstrainer_Demo_Codes::get_instance();

        // Validate code
        if (!$demo_codes->is_valid_code($demo_code)) {
            return new WP_REST_Response(array(
                'success' => false,
                'error' => array(
                    'code' => 'invalid_code',
                    'message' => 'Der Demo-Code ist ungültig. Bitte überprüfen Sie Ihre Eingabe.',
                ),
            ), 400);
        }

        // Prepare contact data
        $contact_data = array(
            'company_name' => isset($params['company_name']) ? $params['company_name'] : '',
            'contact_name' => isset($params['contact_name']) ? $params['contact_name'] : '',
            'homepage' => isset($params['homepage']) ? $params['homepage'] : '',
            'contact_email' => isset($params['contact_email']) ? $params['contact_email'] : '',
            'phone' => isset($params['phone']) ? $params['phone'] : '',
            'privacy_accepted' => !empty($params['privacy_accepted']),
        );

        // Activate the code
        $result = $demo_codes->activate_code($demo_code, $contact_data);

        if (!$result) {
            return new WP_REST_Response(array(
                'success' => false,
                'error' => array(
                    'code' => 'activation_failed',
                    'message' => 'Der Demo-Code konnte nicht aktiviert werden.',
                ),
            ), 500);
        }

        return new WP_REST_Response(array(
            'success' => true,
            'data' => array(
                'demo_code' => $demo_code,
                'message' => 'Demo-Code erfolgreich aktiviert.',
            ),
        ), 200);
    }

    /**
     * Validate demo code (check if valid without activating)
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response Response object
     */
    public function validate_demo_code($request) {
        $params = $request->get_json_params();

        $demo_code = isset($params['demo_code']) ? strtoupper(sanitize_text_field($params['demo_code'])) : '';

        if (empty($demo_code)) {
            return new WP_REST_Response(array(
                'success' => false,
                'valid' => false,
                'error' => array(
                    'code' => 'missing_code',
                    'message' => 'Bitte geben Sie einen Demo-Code ein.',
                ),
            ), 400);
        }

        // Get demo codes instance
        $demo_codes = Bewerbungstrainer_Demo_Codes::get_instance();

        // Validate code
        $is_valid = $demo_codes->is_valid_code($demo_code);

        if (!$is_valid) {
            return new WP_REST_Response(array(
                'success' => true,
                'valid' => false,
                'is_activated' => false,
            ), 200);
        }

        // Get code details to check if already activated with contact data
        $code_data = $demo_codes->get_code($demo_code);
        $is_activated = $code_data && $code_data->is_used && !empty($code_data->contact_email);

        return new WP_REST_Response(array(
            'success' => true,
            'valid' => true,
            'is_activated' => $is_activated,
        ), 200);
    }

    /**
     * Admin: Get all demo codes
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response Response object
     */
    public function admin_get_demo_codes($request) {
        $params = $request->get_params();

        $args = array(
            'limit' => isset($params['limit']) ? intval($params['limit']) : 100,
            'offset' => isset($params['offset']) ? intval($params['offset']) : 0,
            'orderby' => isset($params['orderby']) ? $params['orderby'] : 'created_at',
            'order' => isset($params['order']) ? $params['order'] : 'ASC',
            'filter' => isset($params['filter']) ? $params['filter'] : null,
        );

        $demo_codes = Bewerbungstrainer_Demo_Codes::get_instance();
        $codes = $demo_codes->get_all_codes($args);
        $total = $demo_codes->get_codes_count($args['filter']);

        $total_used = $demo_codes->get_codes_count('used');
        $total_unused = $demo_codes->get_codes_count('unused');

        return new WP_REST_Response(array(
            'success' => true,
            'data' => $codes,
            'pagination' => array(
                'total' => $total,
                'limit' => $args['limit'],
                'offset' => $args['offset'],
            ),
            'stats' => array(
                'total' => $total_used + $total_unused,
                'used' => $total_used,
                'unused' => $total_unused,
            ),
        ), 200);
    }

    /**
     * Admin: Generate more demo codes
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response Response object
     */
    public function admin_generate_demo_codes($request) {
        $params = $request->get_json_params();

        $count = isset($params['count']) ? intval($params['count']) : 50;

        // Limit max generation to 200 at a time
        $count = min($count, 200);

        $demo_codes = Bewerbungstrainer_Demo_Codes::get_instance();
        $generated = $demo_codes->add_more_codes($count);

        return new WP_REST_Response(array(
            'success' => true,
            'data' => array(
                'requested' => $count,
                'generated' => $generated,
            ),
        ), 200);
    }

    /**
     * Log a prompt from the frontend
     *
     * Allows the frontend to log ElevenLabs/Gemini prompts to the server-side prompts.log file
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response Response object
     */
    public function log_prompt($request) {
        $params = $request->get_json_params();

        // Required parameters
        $scenario = isset($params['scenario']) ? sanitize_text_field($params['scenario']) : '';
        $description = isset($params['description']) ? sanitize_text_field($params['description']) : '';
        $prompt = isset($params['prompt']) ? $params['prompt'] : ''; // Don't sanitize - might contain special chars

        if (empty($scenario) || empty($prompt)) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => 'Missing required parameters: scenario and prompt',
            ), 400);
        }

        // Optional metadata
        $metadata = isset($params['metadata']) && is_array($params['metadata']) ? $params['metadata'] : array();

        // Add user info to metadata if logged in
        if (is_user_logged_in()) {
            $user = wp_get_current_user();
            $metadata['user_id'] = $user->ID;
            $metadata['user_name'] = $user->display_name;
        }

        // Log using the existing function
        bewerbungstrainer_log_prompt($scenario, $description, $prompt, $metadata);

        // If there's a response to log as well
        if (isset($params['response']) && !empty($params['response'])) {
            bewerbungstrainer_log_response($scenario, $params['response'], isset($params['is_error']) && $params['is_error']);
        }

        return new WP_REST_Response(array(
            'success' => true,
            'message' => 'Prompt logged successfully',
        ), 200);
    }

    /**
     * ===== Usage Limits Methods =====
     */

    /**
     * Get usage limits for current user
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response Response object
     */
    public function get_usage_limits($request) {
        $current_user_id = get_current_user_id();
        $is_demo_user = Bewerbungstrainer_Demo_Codes::is_demo_user();

        // Get demo code from request or session
        $demo_code = null;
        if ($is_demo_user) {
            $demo_code = isset($_COOKIE['bewerbungstrainer_demo_code'])
                ? sanitize_text_field($_COOKIE['bewerbungstrainer_demo_code'])
                : $request->get_param('demo_code');
        }

        // Get usage limits handler
        $usage_limits = Bewerbungstrainer_Usage_Limits::get_instance();

        // Get availability for this user/demo_code
        $availability = $usage_limits->check_availability(
            $is_demo_user ? null : $current_user_id,
            $demo_code
        );

        // Calculate next reset date (1st of next month)
        $now = current_time('timestamp');
        $next_reset = date('Y-m-01', strtotime('+1 month', $now));

        return new WP_REST_Response(array(
            'success' => true,
            'data' => array(
                'has_minutes' => $availability['has_minutes'],
                'remaining_minutes' => round($availability['remaining'], 1),
                'monthly_limit' => $availability['limit'],
                'used_minutes' => round($availability['used'], 1),
                'period_start' => $availability['period_start'] ?? date('Y-m-01', $now),
                'period_end' => $availability['period_end'] ?? date('Y-m-t', $now),
                'next_reset' => $next_reset,
                'is_demo_user' => $is_demo_user,
                'demo_code' => $demo_code,
            ),
        ), 200);
    }

    /**
     * Update roleplay session duration and add to usage
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response|WP_Error Response object
     */
    public function update_session_duration($request) {
        $session_id = intval($request['id']);
        $params = $request->get_json_params();

        $duration_seconds = isset($params['duration_seconds']) ? intval($params['duration_seconds']) : 0;

        if ($duration_seconds <= 0) {
            return new WP_Error(
                'invalid_duration',
                __('Ungültige Dauer angegeben.', 'bewerbungstrainer'),
                array('status' => 400)
            );
        }

        // Get session
        $session = $this->db->get_roleplay_session($session_id);

        if (!$session) {
            return new WP_Error(
                'session_not_found',
                __('Session nicht gefunden.', 'bewerbungstrainer'),
                array('status' => 404)
            );
        }

        // Update session duration
        $result = $this->db->update_roleplay_session($session_id, array(
            'duration' => $duration_seconds,
        ));

        if (!$result) {
            return new WP_Error(
                'update_failed',
                __('Fehler beim Aktualisieren der Session-Dauer.', 'bewerbungstrainer'),
                array('status' => 500)
            );
        }

        // Log usage to separate tracking table (independent of sessions)
        $usage_limits = Bewerbungstrainer_Usage_Limits::get_instance();
        $is_demo_user = Bewerbungstrainer_Demo_Codes::is_demo_user();

        // Get demo code from session or cookie
        $demo_code = null;
        if ($is_demo_user) {
            $demo_code = !empty($session->demo_code) ? $session->demo_code : null;
            if (empty($demo_code)) {
                $demo_code = isset($_COOKIE['bewerbungstrainer_demo_code'])
                    ? sanitize_text_field($_COOKIE['bewerbungstrainer_demo_code'])
                    : null;
            }
        }

        // Log usage to usage_log table (persists even if session is deleted)
        $usage_limits->log_usage(
            $duration_seconds,
            $is_demo_user ? null : intval($session->user_id),
            $demo_code,
            Bewerbungstrainer_Usage_Limits::USAGE_TYPE_LIVE_CONVERSATION,
            $session_id,
            'Live-Gespräch'
        );

        // Get updated availability
        $availability = $usage_limits->check_availability(
            $is_demo_user ? null : intval($session->user_id),
            $demo_code
        );

        return new WP_REST_Response(array(
            'success' => true,
            'message' => __('Session-Dauer aktualisiert.', 'bewerbungstrainer'),
            'data' => array(
                'session_id' => $session_id,
                'duration_seconds' => $duration_seconds,
                'duration_minutes' => round($duration_seconds / 60, 1),
                'usage' => array(
                    'remaining_minutes' => round($availability['remaining'], 1),
                    'used_minutes' => round($availability['used'], 1),
                    'monthly_limit' => $availability['limit'],
                ),
            ),
        ), 200);
    }

    /**
     * Transcribe audio using Whisper API
     *
     * @param WP_REST_Request $request Request object with audio_base64 and mime_type
     * @return WP_REST_Response|WP_Error Response with transcript or error
     */
    public function transcribe_audio($request) {
        $params = $request->get_json_params();

        // Get audio data
        $audio_base64 = isset($params['audio_base64']) ? $params['audio_base64'] : '';
        $mime_type = isset($params['mime_type']) ? sanitize_text_field($params['mime_type']) : 'audio/webm';

        if (empty($audio_base64)) {
            return new WP_Error(
                'missing_audio',
                __('Keine Audio-Daten übermittelt.', 'bewerbungstrainer'),
                array('status' => 400)
            );
        }

        // Get Whisper handler
        $whisper_handler = Bewerbungstrainer_Whisper_Handler::get_instance();

        if (!$whisper_handler->is_available()) {
            return new WP_Error(
                'whisper_unavailable',
                __('Whisper-Transkription ist nicht konfiguriert. OpenAI API-Key fehlt.', 'bewerbungstrainer'),
                array('status' => 500)
            );
        }

        // Transcribe
        $result = $whisper_handler->transcribe_base64(
            $audio_base64,
            $mime_type,
            array(
                'language' => 'de',
                'scenario_title' => 'Entscheidungs-Kompass Audio-Eingabe',
            )
        );

        if (is_wp_error($result)) {
            error_log("[TRANSCRIBE] Whisper error: " . $result->get_error_message());
            return $result;
        }

        $transcript = $result['transcript'];

        // Check if transcript is empty
        if ($whisper_handler->is_empty_transcript($transcript)) {
            return new WP_Error(
                'empty_transcript',
                __('Es wurde keine Sprache erkannt. Bitte sprich deutlich ins Mikrofon.', 'bewerbungstrainer'),
                array('status' => 400)
            );
        }

        return new WP_REST_Response(array(
            'success' => true,
            'data' => array(
                'transcript' => $transcript,
                'language' => $result['language'],
            ),
        ), 200);
    }
}
