<?php
/**
 * Base Database Class
 *
 * Provides common database operations for all database classes.
 * Reduces code duplication by extracting shared CRUD patterns.
 *
 * @package Bewerbungstrainer
 * @since 1.5.0
 */

if (!defined('ABSPATH')) {
    exit;
}

// Load singleton trait
require_once plugin_dir_path(__FILE__) . 'trait-singleton.php';

/**
 * Abstract class Bewerbungstrainer_Base_Database
 *
 * Base class for all database handlers in the plugin.
 * Provides generic CRUD operations and common utilities.
 */
abstract class Bewerbungstrainer_Base_Database {

    /**
     * Primary table name (with prefix)
     *
     * @var string
     */
    protected $table_name;

    /**
     * Fields that should be JSON encoded/decoded
     *
     * @var array
     */
    protected $json_fields = array();

    /**
     * Default field values for inserts
     *
     * @var array
     */
    protected $defaults = array();

    /**
     * Fields allowed for updates
     *
     * @var array
     */
    protected $updateable_fields = array();

    /**
     * WordPress database instance
     *
     * @var wpdb
     */
    protected $wpdb;

    /**
     * Constructor
     */
    protected function __construct() {
        global $wpdb;
        $this->wpdb = $wpdb;
    }

    // =========================================================================
    // CRUD OPERATIONS
    // =========================================================================

    /**
     * Create a new record
     *
     * @param array $data Record data.
     * @param array $format Optional format specifiers.
     * @return int|false Insert ID on success, false on failure.
     */
    protected function create(array $data, array $format = array()) {
        // Apply defaults
        $data = array_merge($this->defaults, $data);

        // Encode JSON fields
        $this->encode_json_fields($data);

        // Sanitize data
        $data = $this->sanitize_data($data);

        $result = $this->wpdb->insert($this->table_name, $data, $format);

        if ($result === false) {
            error_log("[DB] Insert failed: " . $this->wpdb->last_error);
            return false;
        }

        return $this->wpdb->insert_id;
    }

    /**
     * Get a single record by ID
     *
     * @param int $id Record ID.
     * @return object|null Record object or null.
     */
    protected function get_by_id($id) {
        $result = $this->wpdb->get_row(
            $this->wpdb->prepare(
                "SELECT * FROM {$this->table_name} WHERE id = %d",
                $id
            )
        );

        if ($result) {
            $this->decode_json_fields($result);
        }

        return $result;
    }

    /**
     * Get records by user ID
     *
     * @param int   $user_id   User ID.
     * @param array $args      Optional query arguments.
     * @return array Array of records.
     */
    protected function get_by_user($user_id, array $args = array()) {
        $defaults = array(
            'orderby'  => 'created_at',
            'order'    => 'DESC',
            'limit'    => 50,
            'offset'   => 0,
            'status'   => null,
        );

        $args = array_merge($defaults, $args);

        $where = 'WHERE user_id = %d';
        $params = array($user_id);

        // Add status filter if specified
        if (!empty($args['status'])) {
            $where .= ' AND status = %s';
            $params[] = $args['status'];
        }

        // Build ORDER BY clause
        $orderby = $this->sanitize_orderby($args['orderby']);
        $order = strtoupper($args['order']) === 'ASC' ? 'ASC' : 'DESC';

        // Build query
        $query = "SELECT * FROM {$this->table_name} {$where} ORDER BY {$orderby} {$order}";

        // Add LIMIT if specified
        if ($args['limit'] > 0) {
            $query .= " LIMIT %d OFFSET %d";
            $params[] = $args['limit'];
            $params[] = $args['offset'];
        }

        $results = $this->wpdb->get_results(
            $this->wpdb->prepare($query, $params)
        );

        // Decode JSON fields for each result
        foreach ($results as $result) {
            $this->decode_json_fields($result);
        }

        return $results;
    }

    /**
     * Get records by demo code
     *
     * @param string $demo_code Demo code.
     * @param array  $args      Optional query arguments.
     * @return array Array of records.
     */
    protected function get_by_demo_code($demo_code, array $args = array()) {
        $defaults = array(
            'orderby' => 'created_at',
            'order'   => 'DESC',
            'limit'   => 50,
        );

        $args = array_merge($defaults, $args);

        $orderby = $this->sanitize_orderby($args['orderby']);
        $order = strtoupper($args['order']) === 'ASC' ? 'ASC' : 'DESC';

        $query = "SELECT * FROM {$this->table_name} WHERE demo_code = %s ORDER BY {$orderby} {$order}";
        $params = array($demo_code);

        if ($args['limit'] > 0) {
            $query .= " LIMIT %d";
            $params[] = $args['limit'];
        }

        $results = $this->wpdb->get_results(
            $this->wpdb->prepare($query, $params)
        );

        foreach ($results as $result) {
            $this->decode_json_fields($result);
        }

        return $results;
    }

    /**
     * Update a record
     *
     * @param int   $id   Record ID.
     * @param array $data Data to update.
     * @return bool True on success, false on failure.
     */
    protected function update($id, array $data) {
        // Filter to allowed fields only
        if (!empty($this->updateable_fields)) {
            $data = array_intersect_key($data, array_flip($this->updateable_fields));
        }

        // Encode JSON fields
        $this->encode_json_fields($data);

        // Sanitize data
        $data = $this->sanitize_data($data);

        $result = $this->wpdb->update(
            $this->table_name,
            $data,
            array('id' => $id)
        );

        if ($result === false) {
            error_log("[DB] Update failed: " . $this->wpdb->last_error);
            return false;
        }

        return true;
    }

    /**
     * Delete a record
     *
     * @param int      $id      Record ID.
     * @param int|null $user_id Optional user ID for ownership check.
     * @return bool True on success, false on failure.
     */
    protected function delete($id, $user_id = null) {
        $where = array('id' => $id);

        // Add user ownership check if provided
        if ($user_id !== null) {
            $where['user_id'] = $user_id;
        }

        $result = $this->wpdb->delete($this->table_name, $where);

        return $result !== false;
    }

    /**
     * Delete records by demo code
     *
     * @param string $demo_code Demo code.
     * @return int Number of deleted records.
     */
    protected function delete_by_demo_code($demo_code) {
        return $this->wpdb->delete(
            $this->table_name,
            array('demo_code' => $demo_code)
        );
    }

    // =========================================================================
    // JSON FIELD HANDLING
    // =========================================================================

    /**
     * Encode JSON fields before insert/update
     *
     * @param array $data Data array (modified in place).
     */
    protected function encode_json_fields(array &$data) {
        foreach ($this->json_fields as $field) {
            if (isset($data[$field]) && !is_string($data[$field])) {
                $data[$field] = wp_json_encode($data[$field]);
            }
        }
    }

    /**
     * Decode JSON fields after retrieval
     *
     * @param object $record Record object (modified in place).
     */
    protected function decode_json_fields(&$record) {
        foreach ($this->json_fields as $field) {
            if (isset($record->$field) && is_string($record->$field)) {
                $decoded = json_decode($record->$field, true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    $record->$field = $decoded;
                }
            }
        }
    }

    // =========================================================================
    // UTILITY METHODS
    // =========================================================================

    /**
     * Sanitize orderby field to prevent SQL injection
     *
     * @param string $orderby Field name to order by.
     * @return string Sanitized field name.
     */
    protected function sanitize_orderby($orderby) {
        // Only allow alphanumeric and underscore characters
        $sanitized = preg_replace('/[^a-zA-Z0-9_]/', '', $orderby);

        // Default to created_at if invalid
        return !empty($sanitized) ? $sanitized : 'created_at';
    }

    /**
     * Sanitize data array
     *
     * @param array $data Data to sanitize.
     * @return array Sanitized data.
     */
    protected function sanitize_data(array $data) {
        $sanitized = array();

        foreach ($data as $key => $value) {
            if (is_string($value)) {
                // Don't sanitize JSON strings
                if (in_array($key, $this->json_fields)) {
                    $sanitized[$key] = $value;
                } else {
                    $sanitized[$key] = sanitize_text_field($value);
                }
            } elseif (is_int($value) || is_float($value)) {
                $sanitized[$key] = $value;
            } elseif (is_null($value)) {
                $sanitized[$key] = null;
            } else {
                $sanitized[$key] = $value;
            }
        }

        return $sanitized;
    }

    /**
     * Check if a column exists in the table
     *
     * @param string $column Column name.
     * @return bool True if column exists.
     */
    protected function column_exists($column) {
        $result = $this->wpdb->get_results(
            $this->wpdb->prepare(
                "SHOW COLUMNS FROM `{$this->table_name}` LIKE %s",
                $column
            )
        );

        return !empty($result);
    }

    /**
     * Add a column to the table if it doesn't exist
     *
     * @param string $column      Column name.
     * @param string $definition  Column definition (e.g., "varchar(255) DEFAULT NULL").
     * @param string $after       Column to add after (optional).
     * @return bool True if column was added or already exists.
     */
    protected function maybe_add_column($column, $definition, $after = null) {
        if ($this->column_exists($column)) {
            return true;
        }

        $sql = "ALTER TABLE `{$this->table_name}` ADD COLUMN `{$column}` {$definition}";

        if ($after) {
            $sql .= " AFTER `{$after}`";
        }

        $result = $this->wpdb->query($sql);

        if ($result !== false) {
            error_log("[DB] Added column {$column} to {$this->table_name}");
        }

        return $result !== false;
    }

    /**
     * Add an index to a column if it doesn't exist
     *
     * @param string $column Column name.
     * @return bool True if index was added or already exists.
     */
    protected function maybe_add_index($column) {
        // Check if index exists
        $index_exists = $this->wpdb->get_var(
            $this->wpdb->prepare(
                "SELECT COUNT(*) FROM information_schema.STATISTICS
                 WHERE table_schema = %s
                 AND table_name = %s
                 AND index_name = %s",
                DB_NAME,
                $this->table_name,
                $column
            )
        );

        if ($index_exists > 0) {
            return true;
        }

        $result = $this->wpdb->query(
            "ALTER TABLE `{$this->table_name}` ADD INDEX `{$column}` (`{$column}`)"
        );

        return $result !== false;
    }

    /**
     * Check if table exists
     *
     * @return bool True if table exists.
     */
    protected function table_exists() {
        $result = $this->wpdb->get_var(
            $this->wpdb->prepare(
                "SHOW TABLES LIKE %s",
                $this->table_name
            )
        );

        return $result !== null;
    }

    /**
     * Get count of records
     *
     * @param array $where Optional WHERE conditions.
     * @return int Record count.
     */
    protected function count(array $where = array()) {
        if (empty($where)) {
            return (int) $this->wpdb->get_var(
                "SELECT COUNT(*) FROM {$this->table_name}"
            );
        }

        $conditions = array();
        $params = array();

        foreach ($where as $field => $value) {
            if (is_int($value)) {
                $conditions[] = "`{$field}` = %d";
            } else {
                $conditions[] = "`{$field}` = %s";
            }
            $params[] = $value;
        }

        $where_clause = implode(' AND ', $conditions);

        return (int) $this->wpdb->get_var(
            $this->wpdb->prepare(
                "SELECT COUNT(*) FROM {$this->table_name} WHERE {$where_clause}",
                $params
            )
        );
    }
}
