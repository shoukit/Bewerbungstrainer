<?php
/**
 * Ikigai Database Class
 *
 * Handles database operations for the Ikigai Career Pathfinder
 *
 * @package Bewerbungstrainer
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

// Load base class
require_once plugin_dir_path(__FILE__) . 'class-base-database.php';

/**
 * Ikigai Database Class
 */
class Bewerbungstrainer_Ikigai_Database extends Bewerbungstrainer_Base_Database {

    use Bewerbungstrainer_Singleton;

    /**
     * Constructor
     */
    protected function __construct() {
        parent::__construct();

        global $wpdb;
        $this->table_name = $wpdb->prefix . 'bewerbungstrainer_ikigai';

        // Define JSON fields
        $this->json_fields = array(
            'love_tags',
            'talent_tags',
            'need_tags',
            'market_tags',
            'paths_json',
        );

        // Define updatable fields
        $this->updateable_fields = array(
            'love_tags',
            'talent_tags',
            'need_tags',
            'market_tags',
            'love_input',
            'talent_input',
            'need_input',
            'market_input',
            'summary',
            'paths_json',
            'status',
        );

        // Define defaults
        $this->defaults = array(
            'status' => 'in_progress',
        );
    }

    /**
     * Create the ikigai table
     */
    public function create_table() {
        global $wpdb;
        $charset_collate = $wpdb->get_charset_collate();

        $sql = "CREATE TABLE IF NOT EXISTS {$this->table_name} (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            user_id bigint(20) unsigned DEFAULT NULL,
            demo_code varchar(50) DEFAULT NULL,
            love_input text DEFAULT NULL,
            love_tags longtext DEFAULT NULL,
            talent_input text DEFAULT NULL,
            talent_tags longtext DEFAULT NULL,
            need_input text DEFAULT NULL,
            need_tags longtext DEFAULT NULL,
            market_input text DEFAULT NULL,
            market_tags longtext DEFAULT NULL,
            summary text DEFAULT NULL,
            paths_json longtext DEFAULT NULL,
            status varchar(20) DEFAULT 'in_progress',
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY user_id (user_id),
            KEY demo_code (demo_code),
            KEY status (status),
            KEY created_at (created_at)
        ) $charset_collate;";

        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);

        error_log("[IKIGAI DB] Table created/verified: {$this->table_name}");
    }

    // =========================================================================
    // PUBLIC CRUD METHODS
    // =========================================================================

    /**
     * Create a new ikigai session
     *
     * @param array $data Ikigai data
     * @return int|false Insert ID or false on failure
     */
    public function create_ikigai(array $data) {
        // Add timestamp
        $data['created_at'] = current_time('mysql');

        return $this->create($data);
    }

    /**
     * Get an ikigai session by ID
     *
     * @param int $id Ikigai ID
     * @return object|null Ikigai object or null
     */
    public function get_ikigai($id) {
        return $this->get_by_id($id);
    }

    /**
     * Get ikigai sessions for a user
     *
     * @param int   $user_id User ID
     * @param array $args    Optional arguments
     * @return array Array of ikigai sessions
     */
    public function get_user_ikigais($user_id, array $args = array()) {
        return $this->get_by_user($user_id, $args);
    }

    /**
     * Get ikigai sessions by demo code
     *
     * @param string $demo_code Demo code
     * @param array  $args      Optional arguments
     * @return array Array of ikigai sessions
     */
    public function get_demo_ikigais($demo_code, array $args = array()) {
        return $this->get_by_demo_code($demo_code, $args);
    }

    /**
     * Update an ikigai session
     *
     * @param int   $id   Ikigai ID
     * @param array $data Data to update
     * @return bool True on success
     */
    public function update_ikigai($id, array $data) {
        return $this->update($id, $data);
    }

    /**
     * Delete an ikigai session
     *
     * @param int      $id      Ikigai ID
     * @param int|null $user_id Optional user ID for ownership check
     * @return bool True on success
     */
    public function delete_ikigai($id, $user_id = null) {
        return $this->delete($id, $user_id);
    }

    /**
     * Delete ikigai sessions by demo code
     *
     * @param string $demo_code Demo code
     * @return int Number of deleted records
     */
    public function delete_demo_ikigais($demo_code) {
        return $this->delete_by_demo_code($demo_code);
    }

    /**
     * Get ikigai count for user
     *
     * @param int $user_id User ID
     * @return int Count
     */
    public function get_user_ikigai_count($user_id) {
        return $this->count(array('user_id' => $user_id));
    }

    /**
     * Check if user owns an ikigai session
     *
     * @param int $ikigai_id Ikigai ID
     * @param int $user_id   User ID
     * @return bool True if user owns the ikigai session
     */
    public function user_owns_ikigai($ikigai_id, $user_id) {
        $ikigai = $this->get_ikigai($ikigai_id);

        if (!$ikigai) {
            return false;
        }

        return (int) $ikigai->user_id === (int) $user_id;
    }

    /**
     * Check if demo code owns an ikigai session
     *
     * @param int    $ikigai_id Ikigai ID
     * @param string $demo_code Demo code
     * @return bool True if demo code owns the ikigai session
     */
    public function demo_owns_ikigai($ikigai_id, $demo_code) {
        $ikigai = $this->get_ikigai($ikigai_id);

        if (!$ikigai) {
            return false;
        }

        return $ikigai->demo_code === $demo_code;
    }

    /**
     * Get the most recent in-progress ikigai for user
     *
     * @param int|null    $user_id   User ID
     * @param string|null $demo_code Demo code
     * @return object|null Ikigai object or null
     */
    public function get_current_ikigai($user_id = null, $demo_code = null) {
        global $wpdb;

        if ($user_id) {
            $result = $wpdb->get_row(
                $wpdb->prepare(
                    "SELECT * FROM {$this->table_name}
                     WHERE user_id = %d AND status = 'in_progress'
                     ORDER BY updated_at DESC LIMIT 1",
                    $user_id
                )
            );
        } elseif ($demo_code) {
            $result = $wpdb->get_row(
                $wpdb->prepare(
                    "SELECT * FROM {$this->table_name}
                     WHERE demo_code = %s AND status = 'in_progress'
                     ORDER BY updated_at DESC LIMIT 1",
                    $demo_code
                )
            );
        } else {
            return null;
        }

        if ($result) {
            $this->decode_json_fields($result);
        }

        return $result;
    }
}
