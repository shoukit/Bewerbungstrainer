<?php
/**
 * User Preferences Database Class
 *
 * Handles database operations for user preferences (e.g., dismissed feature info modals)
 * Supports both logged-in users (user_id) and demo users (demo_code)
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
 * User Preferences Database Class
 */
class Bewerbungstrainer_User_Preferences_Database extends Bewerbungstrainer_Base_Database {

    use Bewerbungstrainer_Singleton;

    /**
     * Constructor
     */
    protected function __construct() {
        parent::__construct();

        global $wpdb;
        $this->table_name = $wpdb->prefix . 'bewerbungstrainer_user_preferences';

        // Define JSON fields
        $this->json_fields = array(
            'preference_value',
        );

        // Define updatable fields
        $this->updateable_fields = array(
            'preference_value',
        );

        // Define defaults
        $this->defaults = array();
    }

    /**
     * Create the user preferences table
     */
    public function create_table() {
        global $wpdb;
        $charset_collate = $wpdb->get_charset_collate();

        $sql = "CREATE TABLE IF NOT EXISTS {$this->table_name} (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            user_id bigint(20) unsigned DEFAULT NULL,
            demo_code varchar(50) DEFAULT NULL,
            preference_key varchar(100) NOT NULL,
            preference_value longtext DEFAULT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY user_preference (user_id, preference_key),
            UNIQUE KEY demo_preference (demo_code, preference_key),
            KEY user_id (user_id),
            KEY demo_code (demo_code),
            KEY preference_key (preference_key)
        ) $charset_collate;";

        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);

        error_log("[USER_PREFS DB] Table created/verified: {$this->table_name}");
    }

    // =========================================================================
    // PUBLIC METHODS
    // =========================================================================

    /**
     * Get a preference value for a user
     *
     * @param int|null    $user_id        User ID (for logged-in users)
     * @param string|null $demo_code      Demo code (for demo users)
     * @param string      $preference_key Preference key
     * @param mixed       $default        Default value if not found
     * @return mixed Preference value or default
     */
    public function get_preference($user_id, $demo_code, $preference_key, $default = null) {
        $where_clause = '';
        $params = array();

        if ($user_id) {
            $where_clause = 'user_id = %d AND preference_key = %s';
            $params = array($user_id, $preference_key);
        } elseif ($demo_code) {
            $where_clause = 'demo_code = %s AND preference_key = %s';
            $params = array($demo_code, $preference_key);
        } else {
            return $default;
        }

        $result = $this->wpdb->get_row(
            $this->wpdb->prepare(
                "SELECT * FROM {$this->table_name} WHERE {$where_clause}",
                $params
            )
        );

        if (!$result) {
            return $default;
        }

        // Decode JSON value
        $this->decode_json_fields($result);

        return $result->preference_value;
    }

    /**
     * Set a preference value for a user
     *
     * @param int|null    $user_id        User ID (for logged-in users)
     * @param string|null $demo_code      Demo code (for demo users)
     * @param string      $preference_key Preference key
     * @param mixed       $value          Preference value (will be JSON encoded if array/object)
     * @return bool True on success
     */
    public function set_preference($user_id, $demo_code, $preference_key, $value) {
        // Check if preference already exists
        $existing = $this->get_preference_record($user_id, $demo_code, $preference_key);

        $data = array(
            'preference_value' => $value,
        );

        if ($existing) {
            // Update existing
            return $this->update($existing->id, $data);
        } else {
            // Insert new
            $insert_data = array(
                'user_id' => $user_id,
                'demo_code' => $demo_code,
                'preference_key' => $preference_key,
                'preference_value' => $value,
                'created_at' => current_time('mysql'),
            );

            return $this->create($insert_data) !== false;
        }
    }

    /**
     * Delete a preference for a user
     *
     * @param int|null    $user_id        User ID
     * @param string|null $demo_code      Demo code
     * @param string      $preference_key Preference key
     * @return bool True on success
     */
    public function delete_preference($user_id, $demo_code, $preference_key) {
        $where = array('preference_key' => $preference_key);

        if ($user_id) {
            $where['user_id'] = $user_id;
        } elseif ($demo_code) {
            $where['demo_code'] = $demo_code;
        } else {
            return false;
        }

        return $this->wpdb->delete($this->table_name, $where) !== false;
    }

    /**
     * Get all preferences for a user
     *
     * @param int|null    $user_id   User ID
     * @param string|null $demo_code Demo code
     * @return array Associative array of preference_key => preference_value
     */
    public function get_all_preferences($user_id, $demo_code) {
        $where_clause = '';
        $params = array();

        if ($user_id) {
            $where_clause = 'user_id = %d';
            $params = array($user_id);
        } elseif ($demo_code) {
            $where_clause = 'demo_code = %s';
            $params = array($demo_code);
        } else {
            return array();
        }

        $results = $this->wpdb->get_results(
            $this->wpdb->prepare(
                "SELECT * FROM {$this->table_name} WHERE {$where_clause}",
                $params
            )
        );

        $preferences = array();
        foreach ($results as $result) {
            $this->decode_json_fields($result);
            $preferences[$result->preference_key] = $result->preference_value;
        }

        return $preferences;
    }

    /**
     * Delete all preferences for a demo code (cleanup)
     *
     * @param string $demo_code Demo code
     * @return int Number of deleted records
     */
    public function delete_demo_preferences($demo_code) {
        return $this->delete_by_demo_code($demo_code);
    }

    /**
     * Migrate preferences from one demo code to a user ID (when user registers/logs in)
     *
     * @param string $demo_code Demo code
     * @param int    $user_id   User ID
     * @return int Number of migrated preferences
     */
    public function migrate_demo_to_user($demo_code, $user_id) {
        if (!$demo_code || !$user_id) {
            return 0;
        }

        // Get all demo preferences
        $demo_prefs = $this->get_all_preferences(null, $demo_code);

        $migrated = 0;
        foreach ($demo_prefs as $key => $value) {
            // Only migrate if user doesn't already have this preference
            $existing = $this->get_preference($user_id, null, $key);
            if ($existing === null) {
                $this->set_preference($user_id, null, $key, $value);
                $migrated++;
            }
        }

        // Delete demo preferences after migration
        if ($migrated > 0) {
            $this->delete_demo_preferences($demo_code);
        }

        return $migrated;
    }

    // =========================================================================
    // PRIVATE HELPER METHODS
    // =========================================================================

    /**
     * Get the full preference record (not just value)
     *
     * @param int|null    $user_id        User ID
     * @param string|null $demo_code      Demo code
     * @param string      $preference_key Preference key
     * @return object|null Record or null
     */
    private function get_preference_record($user_id, $demo_code, $preference_key) {
        $where_clause = '';
        $params = array();

        if ($user_id) {
            $where_clause = 'user_id = %d AND preference_key = %s';
            $params = array($user_id, $preference_key);
        } elseif ($demo_code) {
            $where_clause = 'demo_code = %s AND preference_key = %s';
            $params = array($demo_code, $preference_key);
        } else {
            return null;
        }

        return $this->wpdb->get_row(
            $this->wpdb->prepare(
                "SELECT * FROM {$this->table_name} WHERE {$where_clause}",
                $params
            )
        );
    }
}
