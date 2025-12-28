<?php
/**
 * Decision Database Class
 *
 * Handles database operations for the Decision Board (Entscheidungs-Kompass)
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
 * Decision Database Class
 */
class Bewerbungstrainer_Decision_Database extends Bewerbungstrainer_Base_Database {

    use Bewerbungstrainer_Singleton;

    /**
     * Constructor
     */
    protected function __construct() {
        parent::__construct();

        global $wpdb;
        $this->table_name = $wpdb->prefix . 'bewerbungstrainer_decisions';

        // Define JSON fields
        $this->json_fields = array(
            'pros_json',
            'cons_json',
            'analysis_json',
        );

        // Define updatable fields
        $this->updateable_fields = array(
            'topic',
            'context',
            'pros_json',
            'cons_json',
            'pro_score',
            'contra_score',
            'analysis_json',
            'status',
        );

        // Define defaults
        $this->defaults = array(
            'status' => 'draft',
            'pro_score' => 0,
            'contra_score' => 0,
        );
    }

    /**
     * Create the decisions table
     */
    public function create_table() {
        global $wpdb;
        $charset_collate = $wpdb->get_charset_collate();

        $sql = "CREATE TABLE IF NOT EXISTS {$this->table_name} (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            user_id bigint(20) unsigned DEFAULT NULL,
            demo_code varchar(50) DEFAULT NULL,
            topic varchar(500) NOT NULL,
            context text DEFAULT NULL,
            pros_json longtext DEFAULT NULL,
            cons_json longtext DEFAULT NULL,
            pro_score int(11) DEFAULT 0,
            contra_score int(11) DEFAULT 0,
            analysis_json longtext DEFAULT NULL,
            status varchar(20) DEFAULT 'draft',
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

        error_log("[DECISION DB] Table created/verified: {$this->table_name}");
    }

    // =========================================================================
    // PUBLIC CRUD METHODS
    // =========================================================================

    /**
     * Create a new decision session
     *
     * @param array $data Decision data
     * @return int|false Insert ID or false on failure
     */
    public function create_decision(array $data) {
        // Add timestamp
        $data['created_at'] = current_time('mysql');

        return $this->create($data);
    }

    /**
     * Get a decision by ID
     *
     * @param int $id Decision ID
     * @return object|null Decision object or null
     */
    public function get_decision($id) {
        return $this->get_by_id($id);
    }

    /**
     * Get decisions for a user
     *
     * @param int   $user_id User ID
     * @param array $args    Optional arguments
     * @return array Array of decisions
     */
    public function get_user_decisions($user_id, array $args = array()) {
        return $this->get_by_user($user_id, $args);
    }

    /**
     * Get decisions by demo code
     *
     * @param string $demo_code Demo code
     * @param array  $args      Optional arguments
     * @return array Array of decisions
     */
    public function get_demo_decisions($demo_code, array $args = array()) {
        return $this->get_by_demo_code($demo_code, $args);
    }

    /**
     * Update a decision
     *
     * @param int   $id   Decision ID
     * @param array $data Data to update
     * @return bool True on success
     */
    public function update_decision($id, array $data) {
        return $this->update($id, $data);
    }

    /**
     * Delete a decision
     *
     * @param int      $id      Decision ID
     * @param int|null $user_id Optional user ID for ownership check
     * @return bool True on success
     */
    public function delete_decision($id, $user_id = null) {
        return $this->delete($id, $user_id);
    }

    /**
     * Delete decisions by demo code
     *
     * @param string $demo_code Demo code
     * @return int Number of deleted records
     */
    public function delete_demo_decisions($demo_code) {
        return $this->delete_by_demo_code($demo_code);
    }

    /**
     * Get decision count for user
     *
     * @param int $user_id User ID
     * @return int Count
     */
    public function get_user_decision_count($user_id) {
        return $this->count(array('user_id' => $user_id));
    }

    /**
     * Check if user owns a decision
     *
     * @param int $decision_id Decision ID
     * @param int $user_id     User ID
     * @return bool True if user owns the decision
     */
    public function user_owns_decision($decision_id, $user_id) {
        $decision = $this->get_decision($decision_id);

        if (!$decision) {
            return false;
        }

        return (int) $decision->user_id === (int) $user_id;
    }

    /**
     * Check if demo code owns a decision
     *
     * @param int    $decision_id Decision ID
     * @param string $demo_code   Demo code
     * @return bool True if demo code owns the decision
     */
    public function demo_owns_decision($decision_id, $demo_code) {
        $decision = $this->get_decision($decision_id);

        if (!$decision) {
            return false;
        }

        return $decision->demo_code === $demo_code;
    }
}
