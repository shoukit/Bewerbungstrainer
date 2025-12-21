<?php
/**
 * Categories REST API Class
 *
 * REST API endpoints for scenario categories
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

class Bewerbungstrainer_Categories_API {

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
        $this->db = Bewerbungstrainer_Categories_Database::get_instance();

        add_action('rest_api_init', array($this, 'register_routes'));
    }

    /**
     * Register REST API routes
     */
    public function register_routes() {
        // Get all categories (public)
        register_rest_route($this->namespace, '/categories', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_categories'),
            'permission_callback' => '__return_true',
        ));

        // Get single category (public)
        register_rest_route($this->namespace, '/categories/(?P<id>\d+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_category'),
            'permission_callback' => '__return_true',
        ));

        // Create category (admin only)
        register_rest_route($this->namespace, '/categories', array(
            'methods' => 'POST',
            'callback' => array($this, 'create_category'),
            'permission_callback' => array($this, 'check_admin_permission'),
        ));

        // Update category (admin only)
        register_rest_route($this->namespace, '/categories/(?P<id>\d+)', array(
            'methods' => 'PUT',
            'callback' => array($this, 'update_category'),
            'permission_callback' => array($this, 'check_admin_permission'),
        ));

        // Delete category (admin only)
        register_rest_route($this->namespace, '/categories/(?P<id>\d+)', array(
            'methods' => 'DELETE',
            'callback' => array($this, 'delete_category'),
            'permission_callback' => array($this, 'check_admin_permission'),
        ));
    }

    /**
     * Check admin permission
     */
    public function check_admin_permission() {
        return current_user_can('manage_options');
    }

    /**
     * Get all categories
     */
    public function get_categories($request) {
        $params = $request->get_params();

        $args = array(
            'is_active' => isset($params['include_inactive']) ? null : 1,
        );

        $categories = $this->db->get_categories($args);

        // Format for frontend
        $formatted = array_map(function($category) {
            return array(
                'id' => (int) $category->id,
                'slug' => $category->slug,
                'name' => $category->name,
                'shortName' => $category->short_name ?: $category->name,
                'icon' => $category->icon,
                'color' => $category->color,
                'sortOrder' => (int) $category->sort_order,
                'isActive' => (bool) $category->is_active,
            );
        }, $categories);

        return new WP_REST_Response(array(
            'success' => true,
            'data' => array('categories' => $formatted),
        ), 200);
    }

    /**
     * Get single category
     */
    public function get_category($request) {
        $id = $request->get_param('id');
        $category = $this->db->get_category($id);

        if (!$category) {
            return new WP_REST_Response(array(
                'success' => false,
                'error' => 'Kategorie nicht gefunden',
            ), 404);
        }

        return new WP_REST_Response(array(
            'success' => true,
            'data' => array(
                'category' => array(
                    'id' => (int) $category->id,
                    'slug' => $category->slug,
                    'name' => $category->name,
                    'shortName' => $category->short_name ?: $category->name,
                    'icon' => $category->icon,
                    'color' => $category->color,
                    'sortOrder' => (int) $category->sort_order,
                    'isActive' => (bool) $category->is_active,
                ),
            ),
        ), 200);
    }

    /**
     * Create category
     */
    public function create_category($request) {
        $params = $request->get_json_params();

        $data = array(
            'slug' => sanitize_title($params['slug'] ?? ''),
            'name' => sanitize_text_field($params['name'] ?? ''),
            'short_name' => sanitize_text_field($params['shortName'] ?? ''),
            'icon' => sanitize_text_field($params['icon'] ?? 'folder'),
            'color' => sanitize_hex_color($params['color'] ?? '#3b82f6'),
            'sort_order' => intval($params['sortOrder'] ?? 0),
            'is_active' => isset($params['isActive']) ? (int) $params['isActive'] : 1,
        );

        if (empty($data['name'])) {
            return new WP_REST_Response(array(
                'success' => false,
                'error' => 'Name ist erforderlich',
            ), 400);
        }

        $id = $this->db->create_category($data);

        if (!$id) {
            return new WP_REST_Response(array(
                'success' => false,
                'error' => 'Fehler beim Erstellen der Kategorie',
            ), 500);
        }

        $category = $this->db->get_category($id);

        return new WP_REST_Response(array(
            'success' => true,
            'data' => array(
                'category' => array(
                    'id' => (int) $category->id,
                    'slug' => $category->slug,
                    'name' => $category->name,
                    'shortName' => $category->short_name ?: $category->name,
                    'icon' => $category->icon,
                    'color' => $category->color,
                    'sortOrder' => (int) $category->sort_order,
                    'isActive' => (bool) $category->is_active,
                ),
            ),
        ), 201);
    }

    /**
     * Update category
     */
    public function update_category($request) {
        $id = $request->get_param('id');
        $params = $request->get_json_params();

        $category = $this->db->get_category($id);
        if (!$category) {
            return new WP_REST_Response(array(
                'success' => false,
                'error' => 'Kategorie nicht gefunden',
            ), 404);
        }

        $data = array();

        if (isset($params['slug'])) {
            $data['slug'] = sanitize_title($params['slug']);
        }
        if (isset($params['name'])) {
            $data['name'] = sanitize_text_field($params['name']);
        }
        if (isset($params['shortName'])) {
            $data['short_name'] = sanitize_text_field($params['shortName']);
        }
        if (isset($params['icon'])) {
            $data['icon'] = sanitize_text_field($params['icon']);
        }
        if (isset($params['color'])) {
            $data['color'] = sanitize_hex_color($params['color']);
        }
        if (isset($params['sortOrder'])) {
            $data['sort_order'] = intval($params['sortOrder']);
        }
        if (isset($params['isActive'])) {
            $data['is_active'] = (int) $params['isActive'];
        }

        $result = $this->db->update_category($id, $data);

        if ($result === false) {
            return new WP_REST_Response(array(
                'success' => false,
                'error' => 'Fehler beim Aktualisieren der Kategorie',
            ), 500);
        }

        $category = $this->db->get_category($id);

        return new WP_REST_Response(array(
            'success' => true,
            'data' => array(
                'category' => array(
                    'id' => (int) $category->id,
                    'slug' => $category->slug,
                    'name' => $category->name,
                    'shortName' => $category->short_name ?: $category->name,
                    'icon' => $category->icon,
                    'color' => $category->color,
                    'sortOrder' => (int) $category->sort_order,
                    'isActive' => (bool) $category->is_active,
                ),
            ),
        ), 200);
    }

    /**
     * Delete category
     */
    public function delete_category($request) {
        $id = $request->get_param('id');

        $category = $this->db->get_category($id);
        if (!$category) {
            return new WP_REST_Response(array(
                'success' => false,
                'error' => 'Kategorie nicht gefunden',
            ), 404);
        }

        $result = $this->db->delete_category($id);

        if (!$result) {
            return new WP_REST_Response(array(
                'success' => false,
                'error' => 'Fehler beim Löschen der Kategorie',
            ), 500);
        }

        return new WP_REST_Response(array(
            'success' => true,
            'message' => 'Kategorie erfolgreich gelöscht',
        ), 200);
    }
}
