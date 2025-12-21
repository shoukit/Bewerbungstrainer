<?php
/**
 * Categories Database Class
 *
 * Centralized database management for scenario categories
 * Used by all modules: Smart Briefing, Simulator, Video Training, Roleplay
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

class Bewerbungstrainer_Categories_Database {

    /**
     * Instance of this class
     */
    private static $instance = null;

    /**
     * Table name
     */
    private $table_categories;

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
        $this->table_categories = $wpdb->prefix . 'bewerbungstrainer_categories';

        // Check if table exists, create if not
        $this->maybe_create_tables();
    }

    /**
     * Check if table exists and create if not
     */
    private function maybe_create_tables() {
        global $wpdb;

        $table_exists = $wpdb->get_var(
            $wpdb->prepare(
                "SHOW TABLES LIKE %s",
                $this->table_categories
            )
        );

        if (!$table_exists) {
            error_log('[CATEGORIES] Table not found, creating...');
            self::create_tables();
        }
    }

    /**
     * Create categories table
     */
    public static function create_tables() {
        global $wpdb;

        $charset_collate = $wpdb->get_charset_collate();
        $table = $wpdb->prefix . 'bewerbungstrainer_categories';

        $sql = "CREATE TABLE IF NOT EXISTS `$table` (
            `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            `slug` varchar(50) NOT NULL,
            `name` varchar(100) NOT NULL,
            `short_name` varchar(50) DEFAULT NULL,
            `icon` varchar(50) DEFAULT 'folder',
            `color` varchar(20) DEFAULT '#3b82f6',
            `sort_order` int(11) DEFAULT 0,
            `is_active` tinyint(1) DEFAULT 1,
            `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
            `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            UNIQUE KEY `slug` (`slug`),
            KEY `is_active` (`is_active`),
            KEY `sort_order` (`sort_order`)
        ) $charset_collate;";

        $wpdb->query($sql);

        if ($wpdb->last_error) {
            error_log('[CATEGORIES] Database error: ' . $wpdb->last_error);
        } else {
            error_log('[CATEGORIES] Table created successfully');
        }

        // Insert default categories
        self::insert_default_categories();

        // Update version
        update_option('bewerbungstrainer_categories_db_version', '1.0.0');
    }

    /**
     * Insert default categories
     */
    private static function insert_default_categories() {
        global $wpdb;
        $table = $wpdb->prefix . 'bewerbungstrainer_categories';

        // Check if categories already exist
        $count = $wpdb->get_var("SELECT COUNT(*) FROM $table");
        if ($count > 0) {
            return;
        }

        $default_categories = array(
            array(
                'slug' => 'karriere',
                'name' => 'Bewerbung & Karriere',
                'short_name' => 'Karriere',
                'icon' => 'briefcase',
                'color' => '#3b82f6',
                'sort_order' => 1,
            ),
            array(
                'slug' => 'fuehrung',
                'name' => 'Leadership & Führung',
                'short_name' => 'Führung',
                'icon' => 'users',
                'color' => '#8b5cf6',
                'sort_order' => 2,
            ),
            array(
                'slug' => 'vertrieb',
                'name' => 'Vertrieb & Verhandlung',
                'short_name' => 'Vertrieb',
                'icon' => 'trending-up',
                'color' => '#22c55e',
                'sort_order' => 3,
            ),
            array(
                'slug' => 'kommunikation',
                'name' => 'Kommunikation & Konflikt',
                'short_name' => 'Kommunikation',
                'icon' => 'message-circle',
                'color' => '#f59e0b',
                'sort_order' => 4,
            ),
            array(
                'slug' => 'service',
                'name' => 'Kundenservice & Support',
                'short_name' => 'Service',
                'icon' => 'headphones',
                'color' => '#06b6d4',
                'sort_order' => 5,
            ),
            array(
                'slug' => 'social',
                'name' => 'Soziales & Pflege',
                'short_name' => 'Social',
                'icon' => 'heart',
                'color' => '#ec4899',
                'sort_order' => 6,
            ),
        );

        foreach ($default_categories as $category) {
            $wpdb->insert(
                $table,
                array(
                    'slug' => $category['slug'],
                    'name' => $category['name'],
                    'short_name' => $category['short_name'],
                    'icon' => $category['icon'],
                    'color' => $category['color'],
                    'sort_order' => $category['sort_order'],
                    'is_active' => 1,
                ),
                array('%s', '%s', '%s', '%s', '%s', '%d', '%d')
            );
        }

        error_log('[CATEGORIES] Default categories inserted');
    }

    /**
     * Get all active categories
     *
     * @param array $args Query arguments
     * @return array Array of category objects
     */
    public function get_categories($args = array()) {
        global $wpdb;

        $defaults = array(
            'is_active' => 1,
            'orderby' => 'sort_order',
            'order' => 'ASC',
        );

        $args = wp_parse_args($args, $defaults);

        $where = array();
        $where_values = array();

        if ($args['is_active'] !== null) {
            $where[] = 'is_active = %d';
            $where_values[] = $args['is_active'];
        }

        $where_clause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

        // Validate orderby
        $allowed_orderby = array('id', 'slug', 'name', 'sort_order', 'created_at');
        if (!in_array($args['orderby'], $allowed_orderby)) {
            $args['orderby'] = 'sort_order';
        }

        $args['order'] = strtoupper($args['order']) === 'DESC' ? 'DESC' : 'ASC';

        $query = "SELECT * FROM {$this->table_categories} {$where_clause} ORDER BY {$args['orderby']} {$args['order']}";

        if (!empty($where_values)) {
            $categories = $wpdb->get_results($wpdb->prepare($query, ...$where_values));
        } else {
            $categories = $wpdb->get_results($query);
        }

        return $categories;
    }

    /**
     * Get category by ID
     *
     * @param int $id Category ID
     * @return object|null Category object or null
     */
    public function get_category($id) {
        global $wpdb;

        return $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$this->table_categories} WHERE id = %d",
                $id
            )
        );
    }

    /**
     * Get category by slug
     *
     * @param string $slug Category slug
     * @return object|null Category object or null
     */
    public function get_category_by_slug($slug) {
        global $wpdb;

        return $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$this->table_categories} WHERE slug = %s",
                $slug
            )
        );
    }

    /**
     * Create a new category
     *
     * @param array $data Category data
     * @return int|false Category ID or false on failure
     */
    public function create_category($data) {
        global $wpdb;

        $defaults = array(
            'slug' => '',
            'name' => '',
            'short_name' => null,
            'icon' => 'folder',
            'color' => '#3b82f6',
            'sort_order' => 0,
            'is_active' => 1,
        );

        $data = wp_parse_args($data, $defaults);

        // Generate slug from name if not provided
        if (empty($data['slug']) && !empty($data['name'])) {
            $data['slug'] = sanitize_title($data['name']);
        }

        $result = $wpdb->insert(
            $this->table_categories,
            array(
                'slug' => sanitize_title($data['slug']),
                'name' => sanitize_text_field($data['name']),
                'short_name' => $data['short_name'] ? sanitize_text_field($data['short_name']) : null,
                'icon' => sanitize_text_field($data['icon']),
                'color' => sanitize_hex_color($data['color']) ?: '#3b82f6',
                'sort_order' => intval($data['sort_order']),
                'is_active' => intval($data['is_active']),
            ),
            array('%s', '%s', '%s', '%s', '%s', '%d', '%d')
        );

        if ($result === false) {
            error_log('[CATEGORIES] Failed to create category - ' . $wpdb->last_error);
            return false;
        }

        return $wpdb->insert_id;
    }

    /**
     * Update a category
     *
     * @param int $id Category ID
     * @param array $data Category data to update
     * @return bool True on success, false on failure
     */
    public function update_category($id, $data) {
        global $wpdb;

        $update_data = array();
        $update_format = array();

        $allowed_fields = array('slug', 'name', 'short_name', 'icon', 'color', 'sort_order', 'is_active');

        foreach ($allowed_fields as $field) {
            if (isset($data[$field])) {
                $value = $data[$field];

                // Sanitize based on field type
                switch ($field) {
                    case 'slug':
                        $value = sanitize_title($value);
                        break;
                    case 'name':
                    case 'short_name':
                    case 'icon':
                        $value = sanitize_text_field($value);
                        break;
                    case 'color':
                        $value = sanitize_hex_color($value) ?: '#3b82f6';
                        break;
                    case 'sort_order':
                    case 'is_active':
                        $value = intval($value);
                        break;
                }

                $update_data[$field] = $value;

                // Determine format
                if (in_array($field, array('sort_order', 'is_active'))) {
                    $update_format[] = '%d';
                } else {
                    $update_format[] = '%s';
                }
            }
        }

        if (empty($update_data)) {
            return false;
        }

        $result = $wpdb->update(
            $this->table_categories,
            $update_data,
            array('id' => $id),
            $update_format,
            array('%d')
        );

        if ($result === false) {
            error_log('[CATEGORIES] Failed to update category - ' . $wpdb->last_error);
            return false;
        }

        return true;
    }

    /**
     * Delete a category
     *
     * @param int $id Category ID
     * @return bool True on success, false on failure
     */
    public function delete_category($id) {
        global $wpdb;

        $result = $wpdb->delete(
            $this->table_categories,
            array('id' => $id),
            array('%d')
        );

        if ($result === false) {
            error_log('[CATEGORIES] Failed to delete category - ' . $wpdb->last_error);
            return false;
        }

        return true;
    }

    /**
     * Get categories as options array (for dropdowns)
     *
     * @return array Associative array of slug => name
     */
    public function get_categories_as_options() {
        $categories = $this->get_categories();
        $options = array();

        foreach ($categories as $category) {
            $options[$category->slug] = $category->name;
        }

        return $options;
    }

    /**
     * Get table name
     */
    public function get_table_name() {
        return $this->table_categories;
    }
}
