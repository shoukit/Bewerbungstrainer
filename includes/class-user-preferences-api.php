<?php
/**
 * User Preferences API Class
 *
 * REST API endpoints for user preferences
 *
 * @package Bewerbungstrainer
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

/**
 * User Preferences API Class
 */
class Bewerbungstrainer_User_Preferences_API {

    /**
     * Singleton instance
     *
     * @var Bewerbungstrainer_User_Preferences_API|null
     */
    private static $instance = null;

    /**
     * Database instance
     *
     * @var Bewerbungstrainer_User_Preferences_Database
     */
    private $db;

    /**
     * API namespace
     *
     * @var string
     */
    private $namespace = 'bewerbungstrainer/v1';

    /**
     * Get singleton instance
     *
     * @return Bewerbungstrainer_User_Preferences_API
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
        require_once plugin_dir_path(__FILE__) . 'class-user-preferences-database.php';
        $this->db = Bewerbungstrainer_User_Preferences_Database::get_instance();
        add_action('rest_api_init', array($this, 'register_routes'));
    }

    /**
     * Register REST API routes
     */
    public function register_routes() {
        // Get a single preference
        register_rest_route($this->namespace, '/preferences/(?P<key>[a-zA-Z0-9_-]+)', array(
            array(
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => array($this, 'get_preference'),
                'permission_callback' => array($this, 'check_permission'),
                'args'                => array(
                    'key' => array(
                        'required'          => true,
                        'type'              => 'string',
                        'sanitize_callback' => 'sanitize_text_field',
                    ),
                    'demo_code' => array(
                        'type'              => 'string',
                        'sanitize_callback' => 'sanitize_text_field',
                    ),
                ),
            ),
            array(
                'methods'             => WP_REST_Server::CREATABLE,
                'callback'            => array($this, 'set_preference'),
                'permission_callback' => array($this, 'check_permission'),
                'args'                => array(
                    'key' => array(
                        'required'          => true,
                        'type'              => 'string',
                        'sanitize_callback' => 'sanitize_text_field',
                    ),
                    'value' => array(
                        'required' => true,
                    ),
                    'demo_code' => array(
                        'type'              => 'string',
                        'sanitize_callback' => 'sanitize_text_field',
                    ),
                ),
            ),
            array(
                'methods'             => WP_REST_Server::DELETABLE,
                'callback'            => array($this, 'delete_preference'),
                'permission_callback' => array($this, 'check_permission'),
                'args'                => array(
                    'key' => array(
                        'required'          => true,
                        'type'              => 'string',
                        'sanitize_callback' => 'sanitize_text_field',
                    ),
                    'demo_code' => array(
                        'type'              => 'string',
                        'sanitize_callback' => 'sanitize_text_field',
                    ),
                ),
            ),
        ));

        // Get all preferences
        register_rest_route($this->namespace, '/preferences', array(
            'methods'             => WP_REST_Server::READABLE,
            'callback'            => array($this, 'get_all_preferences'),
            'permission_callback' => array($this, 'check_permission'),
            'args'                => array(
                'demo_code' => array(
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ),
            ),
        ));
    }

    /**
     * Permission callback - allows both logged-in users and demo users
     *
     * @param WP_REST_Request $request Request object
     * @return bool True if permitted
     */
    public function check_permission($request) {
        // Logged-in users are always allowed
        if (is_user_logged_in()) {
            return true;
        }

        // Demo users need a valid demo_code
        $demo_code = $request->get_param('demo_code');
        if (!empty($demo_code)) {
            return true;
        }

        // Not allowed without authentication or demo code
        return false;
    }

    /**
     * Get user identity (user_id or demo_code)
     *
     * @param WP_REST_Request $request Request object
     * @return array ['user_id' => int|null, 'demo_code' => string|null]
     */
    private function get_user_identity($request) {
        $user_id = null;
        $demo_code = null;

        if (is_user_logged_in()) {
            $user_id = get_current_user_id();
        } else {
            $demo_code = $request->get_param('demo_code');
        }

        return array(
            'user_id'   => $user_id,
            'demo_code' => $demo_code,
        );
    }

    /**
     * Get a single preference
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response|WP_Error Response
     */
    public function get_preference($request) {
        $key = $request->get_param('key');
        $identity = $this->get_user_identity($request);

        $value = $this->db->get_preference(
            $identity['user_id'],
            $identity['demo_code'],
            $key,
            null
        );

        return rest_ensure_response(array(
            'success' => true,
            'key'     => $key,
            'value'   => $value,
        ));
    }

    /**
     * Set a preference
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response|WP_Error Response
     */
    public function set_preference($request) {
        $key = $request->get_param('key');
        $value = $request->get_param('value');
        $identity = $this->get_user_identity($request);

        // Validate key format
        if (!preg_match('/^[a-zA-Z0-9_-]+$/', $key)) {
            return new WP_Error(
                'invalid_key',
                'Preference key contains invalid characters',
                array('status' => 400)
            );
        }

        $success = $this->db->set_preference(
            $identity['user_id'],
            $identity['demo_code'],
            $key,
            $value
        );

        if (!$success) {
            return new WP_Error(
                'save_failed',
                'Failed to save preference',
                array('status' => 500)
            );
        }

        return rest_ensure_response(array(
            'success' => true,
            'key'     => $key,
            'value'   => $value,
        ));
    }

    /**
     * Delete a preference
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response|WP_Error Response
     */
    public function delete_preference($request) {
        $key = $request->get_param('key');
        $identity = $this->get_user_identity($request);

        $success = $this->db->delete_preference(
            $identity['user_id'],
            $identity['demo_code'],
            $key
        );

        return rest_ensure_response(array(
            'success' => $success,
            'key'     => $key,
        ));
    }

    /**
     * Get all preferences
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response Response
     */
    public function get_all_preferences($request) {
        $identity = $this->get_user_identity($request);

        $preferences = $this->db->get_all_preferences(
            $identity['user_id'],
            $identity['demo_code']
        );

        return rest_ensure_response(array(
            'success'     => true,
            'preferences' => $preferences,
        ));
    }
}
