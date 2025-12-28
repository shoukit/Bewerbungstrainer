<?php
/**
 * Decision API Class
 *
 * REST API endpoints for the Decision Board (Entscheidungs-Kompass)
 *
 * @package Bewerbungstrainer
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Decision API Class
 */
class Bewerbungstrainer_Decision_API {

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
        $this->db = Bewerbungstrainer_Decision_Database::get_instance();
        add_action('rest_api_init', array($this, 'register_routes'));
    }

    /**
     * Register REST API routes
     */
    public function register_routes() {
        // Get all decisions for current user
        register_rest_route($this->namespace, '/decisions', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_decisions'),
            'permission_callback' => array($this, 'allow_all_users'),
        ));

        // Create new decision
        register_rest_route($this->namespace, '/decisions', array(
            'methods' => 'POST',
            'callback' => array($this, 'create_decision'),
            'permission_callback' => array($this, 'allow_all_users'),
        ));

        // Get specific decision
        register_rest_route($this->namespace, '/decisions/(?P<id>\d+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_decision'),
            'permission_callback' => array($this, 'allow_all_users'),
        ));

        // Update decision
        register_rest_route($this->namespace, '/decisions/(?P<id>\d+)', array(
            'methods' => 'PUT',
            'callback' => array($this, 'update_decision'),
            'permission_callback' => array($this, 'allow_all_users'),
        ));

        // Delete decision
        register_rest_route($this->namespace, '/decisions/(?P<id>\d+)', array(
            'methods' => 'DELETE',
            'callback' => array($this, 'delete_decision'),
            'permission_callback' => array($this, 'allow_all_users'),
        ));
    }

    /**
     * Permission callback - allow all users (logged in or demo)
     */
    public function allow_all_users() {
        return true;
    }

    /**
     * Get current user context (user_id or demo_code)
     *
     * @return array Array with 'user_id' and 'demo_code' keys
     */
    private function get_user_context() {
        $user_id = get_current_user_id();
        $demo_code = null;

        // Check for demo user
        if (!$user_id && class_exists('Bewerbungstrainer_Demo_Codes')) {
            if (Bewerbungstrainer_Demo_Codes::is_demo_user()) {
                $demo_code = isset($_COOKIE['bewerbungstrainer_demo_code'])
                    ? sanitize_text_field($_COOKIE['bewerbungstrainer_demo_code'])
                    : null;
            }
        }

        return array(
            'user_id' => $user_id ?: null,
            'demo_code' => $demo_code,
        );
    }

    /**
     * Check if current user can access a decision
     *
     * @param int $decision_id Decision ID
     * @return bool True if user can access
     */
    private function can_access_decision($decision_id) {
        $context = $this->get_user_context();

        if ($context['user_id']) {
            return $this->db->user_owns_decision($decision_id, $context['user_id']);
        }

        if ($context['demo_code']) {
            return $this->db->demo_owns_decision($decision_id, $context['demo_code']);
        }

        return false;
    }

    // =========================================================================
    // API ENDPOINTS
    // =========================================================================

    /**
     * Get all decisions for current user
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response Response
     */
    public function get_decisions($request) {
        $context = $this->get_user_context();

        if (!$context['user_id'] && !$context['demo_code']) {
            return new WP_REST_Response(array(
                'success' => true,
                'data' => array(
                    'decisions' => array(),
                ),
            ), 200);
        }

        $args = array(
            'orderby' => 'updated_at',
            'order' => 'DESC',
            'limit' => 50,
        );

        if ($context['user_id']) {
            $decisions = $this->db->get_user_decisions($context['user_id'], $args);
        } else {
            $decisions = $this->db->get_demo_decisions($context['demo_code'], $args);
        }

        // Format decisions for response
        $formatted = array_map(function($decision) {
            return $this->format_decision($decision);
        }, $decisions);

        return new WP_REST_Response(array(
            'success' => true,
            'data' => array(
                'decisions' => $formatted,
            ),
        ), 200);
    }

    /**
     * Create a new decision
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response|WP_Error Response
     */
    public function create_decision($request) {
        $context = $this->get_user_context();

        if (!$context['user_id'] && !$context['demo_code']) {
            return new WP_Error(
                'not_authorized',
                __('Du musst eingeloggt sein, um Entscheidungen zu speichern.', 'bewerbungstrainer'),
                array('status' => 401)
            );
        }

        $params = $request->get_json_params();

        // Validate required fields
        $topic = isset($params['topic']) ? sanitize_text_field($params['topic']) : '';

        if (empty($topic)) {
            return new WP_Error(
                'missing_topic',
                __('Die Entscheidungsfrage fehlt.', 'bewerbungstrainer'),
                array('status' => 400)
            );
        }

        // Prepare data
        $data = array(
            'user_id' => $context['user_id'],
            'demo_code' => $context['demo_code'],
            'topic' => $topic,
            'context' => isset($params['context']) ? sanitize_textarea_field($params['context']) : null,
            'pros_json' => isset($params['pros']) ? $params['pros'] : array(),
            'cons_json' => isset($params['cons']) ? $params['cons'] : array(),
            'pro_score' => isset($params['pro_score']) ? intval($params['pro_score']) : 0,
            'contra_score' => isset($params['contra_score']) ? intval($params['contra_score']) : 0,
            'analysis_json' => isset($params['analysis']) ? $params['analysis'] : null,
            'status' => isset($params['status']) ? sanitize_text_field($params['status']) : 'draft',
        );

        // Create decision
        $decision_id = $this->db->create_decision($data);

        if (!$decision_id) {
            return new WP_Error(
                'creation_failed',
                __('Fehler beim Speichern der Entscheidung.', 'bewerbungstrainer'),
                array('status' => 500)
            );
        }

        // Get created decision
        $decision = $this->db->get_decision($decision_id);

        return new WP_REST_Response(array(
            'success' => true,
            'message' => __('Entscheidung gespeichert.', 'bewerbungstrainer'),
            'data' => array(
                'decision' => $this->format_decision($decision),
            ),
        ), 201);
    }

    /**
     * Get a specific decision
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response|WP_Error Response
     */
    public function get_decision($request) {
        $decision_id = intval($request['id']);

        if (!$this->can_access_decision($decision_id)) {
            return new WP_Error(
                'not_found',
                __('Entscheidung nicht gefunden.', 'bewerbungstrainer'),
                array('status' => 404)
            );
        }

        $decision = $this->db->get_decision($decision_id);

        return new WP_REST_Response(array(
            'success' => true,
            'data' => array(
                'decision' => $this->format_decision($decision),
            ),
        ), 200);
    }

    /**
     * Update a decision
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response|WP_Error Response
     */
    public function update_decision($request) {
        $decision_id = intval($request['id']);

        if (!$this->can_access_decision($decision_id)) {
            return new WP_Error(
                'not_found',
                __('Entscheidung nicht gefunden.', 'bewerbungstrainer'),
                array('status' => 404)
            );
        }

        $params = $request->get_json_params();

        // Prepare update data
        $data = array();

        if (isset($params['topic'])) {
            $data['topic'] = sanitize_text_field($params['topic']);
        }

        if (isset($params['context'])) {
            $data['context'] = sanitize_textarea_field($params['context']);
        }

        if (isset($params['pros'])) {
            $data['pros_json'] = $params['pros'];
        }

        if (isset($params['cons'])) {
            $data['cons_json'] = $params['cons'];
        }

        if (isset($params['pro_score'])) {
            $data['pro_score'] = intval($params['pro_score']);
        }

        if (isset($params['contra_score'])) {
            $data['contra_score'] = intval($params['contra_score']);
        }

        if (isset($params['analysis'])) {
            $data['analysis_json'] = $params['analysis'];
        }

        if (isset($params['status'])) {
            $data['status'] = sanitize_text_field($params['status']);
        }

        if (empty($data)) {
            return new WP_Error(
                'no_data',
                __('Keine Daten zum Aktualisieren.', 'bewerbungstrainer'),
                array('status' => 400)
            );
        }

        // Update
        $result = $this->db->update_decision($decision_id, $data);

        if (!$result) {
            return new WP_Error(
                'update_failed',
                __('Fehler beim Aktualisieren der Entscheidung.', 'bewerbungstrainer'),
                array('status' => 500)
            );
        }

        // Get updated decision
        $decision = $this->db->get_decision($decision_id);

        return new WP_REST_Response(array(
            'success' => true,
            'message' => __('Entscheidung aktualisiert.', 'bewerbungstrainer'),
            'data' => array(
                'decision' => $this->format_decision($decision),
            ),
        ), 200);
    }

    /**
     * Delete a decision
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response|WP_Error Response
     */
    public function delete_decision($request) {
        $decision_id = intval($request['id']);

        if (!$this->can_access_decision($decision_id)) {
            return new WP_Error(
                'not_found',
                __('Entscheidung nicht gefunden.', 'bewerbungstrainer'),
                array('status' => 404)
            );
        }

        $result = $this->db->delete_decision($decision_id);

        if (!$result) {
            return new WP_Error(
                'delete_failed',
                __('Fehler beim Löschen der Entscheidung.', 'bewerbungstrainer'),
                array('status' => 500)
            );
        }

        return new WP_REST_Response(array(
            'success' => true,
            'message' => __('Entscheidung gelöscht.', 'bewerbungstrainer'),
        ), 200);
    }

    // =========================================================================
    // HELPER METHODS
    // =========================================================================

    /**
     * Format a decision for API response
     *
     * @param object $decision Decision object
     * @return array Formatted decision
     */
    private function format_decision($decision) {
        return array(
            'id' => intval($decision->id),
            'topic' => $decision->topic,
            'context' => $decision->context,
            'pros' => $decision->pros_json ?: array(),
            'cons' => $decision->cons_json ?: array(),
            'pro_score' => intval($decision->pro_score),
            'contra_score' => intval($decision->contra_score),
            'analysis' => $decision->analysis_json,
            'status' => $decision->status,
            'created_at' => $decision->created_at,
            'updated_at' => $decision->updated_at,
        );
    }
}
