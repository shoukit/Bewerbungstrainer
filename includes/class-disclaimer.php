<?php
/**
 * Disclaimer Management Class
 *
 * Handles disclaimer versioning and user acknowledgments
 * for the Bewerbungstrainer plugin
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

class Bewerbungstrainer_Disclaimer {

    /**
     * Instance of this class
     */
    private static $instance = null;

    /**
     * API namespace
     */
    private $namespace = 'bewerbungstrainer/v1';

    /**
     * Table name for disclaimer versions
     */
    private $table_disclaimers;

    /**
     * Table name for user acknowledgments
     */
    private $table_acknowledgments;

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
        global $wpdb;
        $this->table_disclaimers = $wpdb->prefix . 'bewerbungstrainer_disclaimers';
        $this->table_acknowledgments = $wpdb->prefix . 'bewerbungstrainer_disclaimer_acks';

        add_action('rest_api_init', array($this, 'register_routes'));
    }

    /**
     * Create database tables
     */
    public static function create_tables() {
        global $wpdb;

        $charset_collate = $wpdb->get_charset_collate();

        // Table for disclaimer versions
        $table_disclaimers = $wpdb->prefix . 'bewerbungstrainer_disclaimers';
        $sql_disclaimers = "CREATE TABLE IF NOT EXISTS $table_disclaimers (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            version varchar(20) NOT NULL,
            title varchar(255) NOT NULL,
            content longtext NOT NULL,
            is_active tinyint(1) NOT NULL DEFAULT 1,
            created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY version (version),
            KEY is_active (is_active)
        ) $charset_collate;";

        // Table for user acknowledgments
        $table_acknowledgments = $wpdb->prefix . 'bewerbungstrainer_disclaimer_acks';
        $sql_acknowledgments = "CREATE TABLE IF NOT EXISTS $table_acknowledgments (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            user_id bigint(20) UNSIGNED NOT NULL,
            disclaimer_id bigint(20) UNSIGNED NOT NULL,
            disclaimer_version varchar(20) NOT NULL,
            acknowledged_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            dont_show_again tinyint(1) NOT NULL DEFAULT 0,
            PRIMARY KEY (id),
            KEY user_id (user_id),
            KEY disclaimer_id (disclaimer_id),
            UNIQUE KEY user_disclaimer (user_id, disclaimer_id)
        ) $charset_collate;";

        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql_disclaimers);
        dbDelta($sql_acknowledgments);

        // Insert default disclaimer if table is empty
        $count = $wpdb->get_var("SELECT COUNT(*) FROM $table_disclaimers");
        if ($count == 0) {
            self::insert_default_disclaimer();
        }
    }

    /**
     * Insert the default disclaimer
     */
    private static function insert_default_disclaimer() {
        global $wpdb;
        $table_disclaimers = $wpdb->prefix . 'bewerbungstrainer_disclaimers';

        $default_content = "Diese Anwendung dient ausschließlich zu Trainings- und Übungszwecken.\n\n" .
            "Zur Simulation von Gesprächssituationen werden KI-basierte Funktionen eingesetzt, " .
            "die Eingaben automatisiert verarbeiten und darauf reagieren.\n\n" .
            "Bitte gib keine realen personenbezogenen Daten ein (z. B. echte Namen, Firmen, " .
            "Kontaktdaten oder vertrauliche Inhalte).\n\n" .
            "Nutze fiktive Beispiele, um Gesprächssituationen realitätsnah zu üben.\n\n" .
            "Die Verantwortung für die eingegebenen Inhalte liegt beim Nutzer.";

        $wpdb->insert(
            $table_disclaimers,
            array(
                'version' => '1.0.0',
                'title' => 'Hinweis zur Nutzung',
                'content' => $default_content,
                'is_active' => 1,
            ),
            array('%s', '%s', '%s', '%d')
        );
    }

    /**
     * Register REST API routes
     */
    public function register_routes() {
        // Get current/active disclaimer
        register_rest_route($this->namespace, '/disclaimer/current', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_current_disclaimer'),
            'permission_callback' => '__return_true', // Public endpoint
        ));

        // Check if user needs to see disclaimer
        // Uses allow_all_users to handle nonce validation more gracefully after login
        register_rest_route($this->namespace, '/disclaimer/status', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_disclaimer_status'),
            'permission_callback' => array($this, 'allow_all_users'),
        ));

        // Acknowledge disclaimer
        // Uses allow_all_users to handle nonce validation more gracefully after login
        register_rest_route($this->namespace, '/disclaimer/acknowledge', array(
            'methods' => 'POST',
            'callback' => array($this, 'acknowledge_disclaimer'),
            'permission_callback' => array($this, 'allow_all_users'),
        ));

        // Admin: Get all disclaimers
        register_rest_route($this->namespace, '/admin/disclaimers', array(
            'methods' => 'GET',
            'callback' => array($this, 'admin_get_disclaimers'),
            'permission_callback' => array($this, 'check_is_admin'),
        ));

        // Admin: Create new disclaimer version
        register_rest_route($this->namespace, '/admin/disclaimers', array(
            'methods' => 'POST',
            'callback' => array($this, 'admin_create_disclaimer'),
            'permission_callback' => array($this, 'check_is_admin'),
        ));

        // Admin: Update disclaimer
        register_rest_route($this->namespace, '/admin/disclaimers/(?P<id>\d+)', array(
            'methods' => 'PUT',
            'callback' => array($this, 'admin_update_disclaimer'),
            'permission_callback' => array($this, 'check_is_admin'),
        ));
    }

    /**
     * Permission callback: Allow all users
     * This is used for endpoints that need to work during the login process
     * when WordPress cookie authentication may not be fully synchronized yet.
     */
    public function allow_all_users($request) {
        return true;
    }

    /**
     * Permission callback: Check if user is logged in
     */
    public function check_user_logged_in() {
        return is_user_logged_in();
    }

    /**
     * Permission callback: Check if user is admin
     */
    public function check_is_admin() {
        return current_user_can('manage_options');
    }

    /**
     * Get the current active disclaimer
     */
    public function get_current_disclaimer($request) {
        global $wpdb;

        $disclaimer = $wpdb->get_row(
            "SELECT id, version, title, content, created_at
             FROM {$this->table_disclaimers}
             WHERE is_active = 1
             ORDER BY created_at DESC
             LIMIT 1"
        );

        if (!$disclaimer) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => 'Kein aktiver Hinweis gefunden',
            ), 404);
        }

        return new WP_REST_Response(array(
            'success' => true,
            'disclaimer' => array(
                'id' => (int) $disclaimer->id,
                'version' => $disclaimer->version,
                'title' => $disclaimer->title,
                'content' => $disclaimer->content,
                'created_at' => $disclaimer->created_at,
            ),
        ), 200);
    }

    /**
     * Get disclaimer status for current user
     * Returns whether the user needs to see the disclaimer
     */
    public function get_disclaimer_status($request) {
        global $wpdb;

        $user_id = get_current_user_id();

        // If user is not logged in, don't require disclaimer
        if (!$user_id) {
            return new WP_REST_Response(array(
                'success' => true,
                'needs_acknowledgment' => false,
                'message' => 'Nicht eingeloggt',
            ), 200);
        }

        // Get current active disclaimer
        $disclaimer = $wpdb->get_row(
            "SELECT id, version, title, content, created_at
             FROM {$this->table_disclaimers}
             WHERE is_active = 1
             ORDER BY created_at DESC
             LIMIT 1"
        );

        if (!$disclaimer) {
            return new WP_REST_Response(array(
                'success' => true,
                'needs_acknowledgment' => false,
                'message' => 'Kein aktiver Hinweis vorhanden',
            ), 200);
        }

        // Check if user has acknowledged this specific disclaimer version with dont_show_again
        $acknowledgment = $wpdb->get_row($wpdb->prepare(
            "SELECT id, acknowledged_at, dont_show_again
             FROM {$this->table_acknowledgments}
             WHERE user_id = %d AND disclaimer_id = %d",
            $user_id,
            $disclaimer->id
        ));

        // User needs to see disclaimer if:
        // 1. They haven't acknowledged this version at all, OR
        // 2. They acknowledged but didn't check "don't show again"
        $needs_acknowledgment = !$acknowledgment || !$acknowledgment->dont_show_again;

        return new WP_REST_Response(array(
            'success' => true,
            'needs_acknowledgment' => $needs_acknowledgment,
            'disclaimer' => array(
                'id' => (int) $disclaimer->id,
                'version' => $disclaimer->version,
                'title' => $disclaimer->title,
                'content' => $disclaimer->content,
                'created_at' => $disclaimer->created_at,
            ),
            'last_acknowledgment' => $acknowledgment ? array(
                'acknowledged_at' => $acknowledgment->acknowledged_at,
                'dont_show_again' => (bool) $acknowledgment->dont_show_again,
            ) : null,
        ), 200);
    }

    /**
     * Acknowledge disclaimer
     */
    public function acknowledge_disclaimer($request) {
        global $wpdb;

        $user_id = get_current_user_id();

        // Check if user is logged in
        if (!$user_id) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => 'Nicht eingeloggt',
            ), 401);
        }

        $params = $request->get_json_params();

        $disclaimer_id = isset($params['disclaimer_id']) ? intval($params['disclaimer_id']) : 0;
        $dont_show_again = isset($params['dont_show_again']) ? (bool) $params['dont_show_again'] : false;

        if (!$disclaimer_id) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => 'Disclaimer ID ist erforderlich',
            ), 400);
        }

        // Verify disclaimer exists
        $disclaimer = $wpdb->get_row($wpdb->prepare(
            "SELECT id, version FROM {$this->table_disclaimers} WHERE id = %d",
            $disclaimer_id
        ));

        if (!$disclaimer) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => 'Hinweis nicht gefunden',
            ), 404);
        }

        // Check if acknowledgment already exists
        $existing = $wpdb->get_row($wpdb->prepare(
            "SELECT id FROM {$this->table_acknowledgments}
             WHERE user_id = %d AND disclaimer_id = %d",
            $user_id,
            $disclaimer_id
        ));

        if ($existing) {
            // Update existing acknowledgment
            $result = $wpdb->update(
                $this->table_acknowledgments,
                array(
                    'acknowledged_at' => current_time('mysql'),
                    'dont_show_again' => $dont_show_again ? 1 : 0,
                ),
                array('id' => $existing->id),
                array('%s', '%d'),
                array('%d')
            );
        } else {
            // Insert new acknowledgment
            $result = $wpdb->insert(
                $this->table_acknowledgments,
                array(
                    'user_id' => $user_id,
                    'disclaimer_id' => $disclaimer_id,
                    'disclaimer_version' => $disclaimer->version,
                    'acknowledged_at' => current_time('mysql'),
                    'dont_show_again' => $dont_show_again ? 1 : 0,
                ),
                array('%d', '%d', '%s', '%s', '%d')
            );
        }

        if ($result === false) {
            error_log('Bewerbungstrainer: Failed to save acknowledgment - ' . $wpdb->last_error);
            return new WP_REST_Response(array(
                'success' => false,
                'message' => 'Fehler beim Speichern der Bestätigung',
            ), 500);
        }

        return new WP_REST_Response(array(
            'success' => true,
            'message' => 'Hinweis bestätigt',
            'dont_show_again' => $dont_show_again,
        ), 200);
    }

    /**
     * Admin: Get all disclaimers
     */
    public function admin_get_disclaimers($request) {
        global $wpdb;

        $disclaimers = $wpdb->get_results(
            "SELECT id, version, title, content, is_active, created_at, updated_at
             FROM {$this->table_disclaimers}
             ORDER BY created_at DESC"
        );

        $formatted = array_map(function($d) {
            return array(
                'id' => (int) $d->id,
                'version' => $d->version,
                'title' => $d->title,
                'content' => $d->content,
                'is_active' => (bool) $d->is_active,
                'created_at' => $d->created_at,
                'updated_at' => $d->updated_at,
            );
        }, $disclaimers);

        return new WP_REST_Response(array(
            'success' => true,
            'disclaimers' => $formatted,
        ), 200);
    }

    /**
     * Admin: Create new disclaimer version
     */
    public function admin_create_disclaimer($request) {
        global $wpdb;

        $params = $request->get_json_params();

        $version = isset($params['version']) ? sanitize_text_field($params['version']) : '';
        $title = isset($params['title']) ? sanitize_text_field($params['title']) : '';
        $content = isset($params['content']) ? wp_kses_post($params['content']) : '';
        $is_active = isset($params['is_active']) ? (bool) $params['is_active'] : true;

        if (empty($version) || empty($title) || empty($content)) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => 'Version, Titel und Inhalt sind erforderlich',
            ), 400);
        }

        // Check if version already exists
        $existing = $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM {$this->table_disclaimers} WHERE version = %s",
            $version
        ));

        if ($existing) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => 'Diese Version existiert bereits',
            ), 400);
        }

        // If new disclaimer is active, deactivate others
        if ($is_active) {
            $wpdb->update(
                $this->table_disclaimers,
                array('is_active' => 0),
                array('is_active' => 1),
                array('%d'),
                array('%d')
            );
        }

        // Insert new disclaimer
        $result = $wpdb->insert(
            $this->table_disclaimers,
            array(
                'version' => $version,
                'title' => $title,
                'content' => $content,
                'is_active' => $is_active ? 1 : 0,
            ),
            array('%s', '%s', '%s', '%d')
        );

        if ($result === false) {
            error_log('Bewerbungstrainer: Failed to create disclaimer - ' . $wpdb->last_error);
            return new WP_REST_Response(array(
                'success' => false,
                'message' => 'Fehler beim Erstellen des Hinweises',
            ), 500);
        }

        return new WP_REST_Response(array(
            'success' => true,
            'message' => 'Hinweis erstellt',
            'id' => $wpdb->insert_id,
        ), 201);
    }

    /**
     * Admin: Update disclaimer
     */
    public function admin_update_disclaimer($request) {
        global $wpdb;

        $id = intval($request->get_param('id'));
        $params = $request->get_json_params();

        // Verify disclaimer exists
        $existing = $wpdb->get_row($wpdb->prepare(
            "SELECT id FROM {$this->table_disclaimers} WHERE id = %d",
            $id
        ));

        if (!$existing) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => 'Hinweis nicht gefunden',
            ), 404);
        }

        $update_data = array();
        $update_format = array();

        if (isset($params['title'])) {
            $update_data['title'] = sanitize_text_field($params['title']);
            $update_format[] = '%s';
        }

        if (isset($params['content'])) {
            $update_data['content'] = wp_kses_post($params['content']);
            $update_format[] = '%s';
        }

        if (isset($params['is_active'])) {
            $is_active = (bool) $params['is_active'];

            // If setting this one to active, deactivate others first
            if ($is_active) {
                $wpdb->update(
                    $this->table_disclaimers,
                    array('is_active' => 0),
                    array('is_active' => 1),
                    array('%d'),
                    array('%d')
                );
            }

            $update_data['is_active'] = $is_active ? 1 : 0;
            $update_format[] = '%d';
        }

        if (empty($update_data)) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => 'Keine Änderungen',
            ), 400);
        }

        $result = $wpdb->update(
            $this->table_disclaimers,
            $update_data,
            array('id' => $id),
            $update_format,
            array('%d')
        );

        if ($result === false) {
            error_log('Bewerbungstrainer: Failed to update disclaimer - ' . $wpdb->last_error);
            return new WP_REST_Response(array(
                'success' => false,
                'message' => 'Fehler beim Aktualisieren',
            ), 500);
        }

        return new WP_REST_Response(array(
            'success' => true,
            'message' => 'Hinweis aktualisiert',
        ), 200);
    }
}
