<?php
/**
 * Scenario Setups Management Class
 *
 * Handles database operations and admin UI for managing scenario setups
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

class Bewerbungstrainer_Scenario_Setups {

    /**
     * Instance of this class
     */
    private static $instance = null;

    /**
     * Table name
     */
    private $table_name;

    /**
     * Current database version
     */
    private $db_version = '1.0.0';

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
        $this->table_name = $wpdb->prefix . 'bewerbungstrainer_setups';

        // Create table on activation
        add_action('plugins_loaded', array($this, 'maybe_create_table'));

        // Admin menu
        add_action('admin_menu', array($this, 'add_admin_menu'));

        // REST API
        add_action('rest_api_init', array($this, 'register_rest_routes'));

        // Admin scripts
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_scripts'));
    }

    /**
     * Create database table if needed
     */
    public function maybe_create_table() {
        $installed_version = get_option('bewerbungstrainer_setups_db_version', '0');

        if (version_compare($installed_version, $this->db_version, '<')) {
            $this->create_table();
            update_option('bewerbungstrainer_setups_db_version', $this->db_version);
        }
    }

    /**
     * Create the setups table
     */
    private function create_table() {
        global $wpdb;

        $charset_collate = $wpdb->get_charset_collate();

        $sql = "CREATE TABLE {$this->table_name} (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            slug varchar(100) NOT NULL,
            name varchar(255) NOT NULL,
            description text,
            icon varchar(50) DEFAULT '🎯',
            color varchar(20) DEFAULT '#3b82f6',
            focus varchar(255) DEFAULT '',
            target_group varchar(255) DEFAULT '',
            sort_order int(11) DEFAULT 0,
            is_active tinyint(1) DEFAULT 1,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY slug (slug)
        ) $charset_collate;";

        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);

        // Insert default setups if table is empty
        $this->maybe_insert_defaults();
    }

    /**
     * Insert default setups if table is empty
     */
    private function maybe_insert_defaults() {
        global $wpdb;

        $count = $wpdb->get_var("SELECT COUNT(*) FROM {$this->table_name}");

        if ($count == 0) {
            $defaults = array(
                array(
                    'slug' => 'karriere-placement',
                    'name' => 'Karriere & Placement',
                    'description' => 'Vom Berufseinstieg bis zum Jobwechsel – optimal vorbereitet ins Vorstellungsgespräch',
                    'icon' => '🎯',
                    'color' => '#3b82f6',
                    'focus' => 'Job bekommen',
                    'target_group' => 'B2C / Arbeitsamt',
                    'sort_order' => 1,
                ),
                array(
                    'slug' => 'corporate-essentials',
                    'name' => 'Corporate Essentials',
                    'description' => 'Grundlegende Kommunikations- und Gesprächskompetenzen für den Berufsalltag',
                    'icon' => '🏢',
                    'color' => '#6366f1',
                    'focus' => 'Professionell kommunizieren',
                    'target_group' => 'B2B Allgemein',
                    'sort_order' => 2,
                ),
                array(
                    'slug' => 'high-performance-sales',
                    'name' => 'High Performance Sales',
                    'description' => 'Vertriebstraining für maximale Abschlussquoten und Kundengewinnung',
                    'icon' => '💰',
                    'color' => '#f59e0b',
                    'focus' => 'Umsatz machen',
                    'target_group' => 'B2B Vertrieb',
                    'sort_order' => 3,
                ),
                array(
                    'slug' => 'coaching-toolkit',
                    'name' => 'Coaching Toolkit',
                    'description' => 'Werkzeuge und Techniken für effektives Coaching und Mitarbeiterentwicklung',
                    'icon' => '🛠️',
                    'color' => '#8b5cf6',
                    'focus' => 'Menschen entwickeln',
                    'target_group' => 'B2B HR / Coaches',
                    'sort_order' => 4,
                ),
                array(
                    'slug' => 'leadership-academy',
                    'name' => 'Leadership Academy',
                    'description' => 'Führungskompetenzen für Manager und Teamleiter',
                    'icon' => '👔',
                    'color' => '#ec4899',
                    'focus' => 'Menschen führen',
                    'target_group' => 'B2B HR / Führungskräfte',
                    'sort_order' => 5,
                ),
                array(
                    'slug' => 'social-care',
                    'name' => 'Social & Care',
                    'description' => 'Kommunikation im sozialen und pflegerischen Bereich',
                    'icon' => '💚',
                    'color' => '#10b981',
                    'focus' => 'Helfen & Schützen',
                    'target_group' => 'Public / Health',
                    'sort_order' => 6,
                ),
                array(
                    'slug' => 'customer-care-resilience',
                    'name' => 'Customer Care & Resilience',
                    'description' => 'Kundenservice, Beschwerdemanagement und Deeskalation',
                    'icon' => '🛡️',
                    'color' => '#06b6d4',
                    'focus' => 'Deeskalieren & Lösen',
                    'target_group' => 'B2B Service',
                    'sort_order' => 7,
                ),
            );

            foreach ($defaults as $setup) {
                $wpdb->insert($this->table_name, $setup);
            }
        }
    }

    /**
     * Add admin menu
     */
    public function add_admin_menu() {
        add_submenu_page(
            'bewerbungstrainer',
            'Trainings-Setups',
            'Trainings-Setups',
            'manage_options',
            'bewerbungstrainer-setups',
            array($this, 'render_admin_page'),
            11 // Position: settings section
        );
    }

    /**
     * Enqueue admin scripts
     */
    public function enqueue_admin_scripts($hook) {
        if (strpos($hook, 'bewerbungstrainer-setups') === false) {
            return;
        }

        wp_enqueue_style(
            'bewerbungstrainer-setups-admin',
            plugins_url('assets/css/setups-admin.css', dirname(__FILE__)),
            array(),
            '1.0.0'
        );
    }

    /**
     * Register REST API routes
     */
    public function register_rest_routes() {
        register_rest_route('bewerbungstrainer/v1', '/setups', array(
            'methods' => 'GET',
            'callback' => array($this, 'api_get_setups'),
            'permission_callback' => '__return_true', // Public endpoint
        ));

        register_rest_route('bewerbungstrainer/v1', '/setups', array(
            'methods' => 'POST',
            'callback' => array($this, 'api_create_setup'),
            'permission_callback' => array($this, 'check_admin_permission'),
        ));

        register_rest_route('bewerbungstrainer/v1', '/setups/(?P<id>\d+)', array(
            'methods' => 'PUT',
            'callback' => array($this, 'api_update_setup'),
            'permission_callback' => array($this, 'check_admin_permission'),
        ));

        register_rest_route('bewerbungstrainer/v1', '/setups/(?P<id>\d+)', array(
            'methods' => 'DELETE',
            'callback' => array($this, 'api_delete_setup'),
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
     * API: Get all setups
     */
    public function api_get_setups($request) {
        $setups = $this->get_all_setups();

        return new WP_REST_Response(array(
            'success' => true,
            'data' => array('setups' => $setups),
        ), 200);
    }

    /**
     * API: Create setup
     */
    public function api_create_setup($request) {
        $data = array(
            'slug' => sanitize_title($request->get_param('name')),
            'name' => sanitize_text_field($request->get_param('name')),
            'description' => sanitize_textarea_field($request->get_param('description')),
            'icon' => sanitize_text_field($request->get_param('icon') ?: '🎯'),
            'color' => sanitize_hex_color($request->get_param('color') ?: '#3b82f6'),
            'focus' => sanitize_text_field($request->get_param('focus')),
            'target_group' => sanitize_text_field($request->get_param('target_group')),
            'sort_order' => intval($request->get_param('sort_order') ?: 0),
        );

        $setup = $this->create_setup($data);

        if ($setup) {
            return new WP_REST_Response(array(
                'success' => true,
                'data' => $setup,
            ), 201);
        }

        return new WP_REST_Response(array(
            'success' => false,
            'error' => 'Failed to create setup',
        ), 500);
    }

    /**
     * API: Update setup
     */
    public function api_update_setup($request) {
        $id = intval($request->get_param('id'));

        $data = array();

        if ($request->has_param('name')) {
            $data['name'] = sanitize_text_field($request->get_param('name'));
            $data['slug'] = sanitize_title($request->get_param('name'));
        }
        if ($request->has_param('description')) {
            $data['description'] = sanitize_textarea_field($request->get_param('description'));
        }
        if ($request->has_param('icon')) {
            $data['icon'] = sanitize_text_field($request->get_param('icon'));
        }
        if ($request->has_param('color')) {
            $data['color'] = sanitize_hex_color($request->get_param('color'));
        }
        if ($request->has_param('focus')) {
            $data['focus'] = sanitize_text_field($request->get_param('focus'));
        }
        if ($request->has_param('target_group')) {
            $data['target_group'] = sanitize_text_field($request->get_param('target_group'));
        }
        if ($request->has_param('sort_order')) {
            $data['sort_order'] = intval($request->get_param('sort_order'));
        }
        if ($request->has_param('is_active')) {
            $data['is_active'] = intval($request->get_param('is_active'));
        }

        $result = $this->update_setup($id, $data);

        if ($result) {
            $setup = $this->get_setup($id);
            return new WP_REST_Response(array(
                'success' => true,
                'data' => $setup,
            ), 200);
        }

        return new WP_REST_Response(array(
            'success' => false,
            'error' => 'Failed to update setup',
        ), 500);
    }

    /**
     * API: Delete setup
     */
    public function api_delete_setup($request) {
        $id = intval($request->get_param('id'));

        $result = $this->delete_setup($id);

        if ($result) {
            return new WP_REST_Response(array(
                'success' => true,
            ), 200);
        }

        return new WP_REST_Response(array(
            'success' => false,
            'error' => 'Failed to delete setup',
        ), 500);
    }

    /**
     * Get all setups
     */
    public function get_all_setups($active_only = false) {
        global $wpdb;

        $where = $active_only ? "WHERE is_active = 1" : "";

        $results = $wpdb->get_results(
            "SELECT * FROM {$this->table_name} {$where} ORDER BY sort_order ASC, name ASC",
            ARRAY_A
        );

        return $results ?: array();
    }

    /**
     * Get setup by ID
     */
    public function get_setup($id) {
        global $wpdb;

        return $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM {$this->table_name} WHERE id = %d", $id),
            ARRAY_A
        );
    }

    /**
     * Get setup by slug
     */
    public function get_setup_by_slug($slug) {
        global $wpdb;

        return $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM {$this->table_name} WHERE slug = %s", $slug),
            ARRAY_A
        );
    }

    /**
     * Create setup
     */
    public function create_setup($data) {
        global $wpdb;

        // Ensure unique slug
        $base_slug = $data['slug'];
        $counter = 1;
        while ($this->get_setup_by_slug($data['slug'])) {
            $data['slug'] = $base_slug . '-' . $counter;
            $counter++;
        }

        $result = $wpdb->insert($this->table_name, $data);

        if ($result) {
            return $this->get_setup($wpdb->insert_id);
        }

        return false;
    }

    /**
     * Update setup
     */
    public function update_setup($id, $data) {
        global $wpdb;

        return $wpdb->update(
            $this->table_name,
            $data,
            array('id' => $id)
        );
    }

    /**
     * Delete setup
     */
    public function delete_setup($id) {
        global $wpdb;

        return $wpdb->delete(
            $this->table_name,
            array('id' => $id)
        );
    }

    /**
     * Get setups as options array for select fields
     */
    public function get_setups_for_select() {
        $setups = $this->get_all_setups(true);
        $options = array();

        foreach ($setups as $setup) {
            $options[$setup['slug']] = $setup['icon'] . ' ' . $setup['name'];
        }

        return $options;
    }

    /**
     * Render admin page
     */
    public function render_admin_page() {
        // Handle form submissions
        if (isset($_POST['action'])) {
            $this->handle_form_submission();
        }

        $setups = $this->get_all_setups();
        $editing = isset($_GET['edit']) ? $this->get_setup(intval($_GET['edit'])) : null;
        ?>
        <div class="wrap bewerbungstrainer-setups-admin">
            <h1>
                <?php echo $editing ? 'Setup bearbeiten' : 'Trainings-Setups'; ?>
                <?php if (!$editing): ?>
                    <a href="<?php echo admin_url('admin.php?page=bewerbungstrainer-setups&add=1'); ?>" class="page-title-action">Neues Setup</a>
                <?php endif; ?>
            </h1>

            <?php if (isset($_GET['add']) || $editing): ?>
                <!-- Add/Edit Form -->
                <div class="setup-form-container">
                    <form method="post" class="setup-form">
                        <?php wp_nonce_field('bewerbungstrainer_setup_action', 'setup_nonce'); ?>
                        <input type="hidden" name="action" value="<?php echo $editing ? 'update' : 'create'; ?>">
                        <?php if ($editing): ?>
                            <input type="hidden" name="setup_id" value="<?php echo $editing['id']; ?>">
                        <?php endif; ?>

                        <table class="form-table">
                            <tr>
                                <th><label for="name">Name *</label></th>
                                <td>
                                    <input type="text" id="name" name="name" class="regular-text"
                                           value="<?php echo esc_attr($editing['name'] ?? ''); ?>" required>
                                </td>
                            </tr>
                            <tr>
                                <th><label for="icon">Icon</label></th>
                                <td>
                                    <input type="text" id="icon" name="icon" class="small-text"
                                           value="<?php echo esc_attr($editing['icon'] ?? '🎯'); ?>"
                                           placeholder="🎯">
                                    <p class="description">Emoji als Icon (z.B. 🎯, 💼, 🏢)</p>
                                </td>
                            </tr>
                            <tr>
                                <th><label for="description">Beschreibung</label></th>
                                <td>
                                    <textarea id="description" name="description" class="large-text" rows="3"><?php echo esc_textarea($editing['description'] ?? ''); ?></textarea>
                                </td>
                            </tr>
                            <tr>
                                <th><label for="color">Farbe</label></th>
                                <td>
                                    <input type="color" id="color" name="color"
                                           value="<?php echo esc_attr($editing['color'] ?? '#3b82f6'); ?>">
                                </td>
                            </tr>
                            <tr>
                                <th><label for="focus">Fokus</label></th>
                                <td>
                                    <input type="text" id="focus" name="focus" class="regular-text"
                                           value="<?php echo esc_attr($editing['focus'] ?? ''); ?>"
                                           placeholder="z.B. Job bekommen">
                                    <p class="description">Kurze Beschreibung des Hauptziels</p>
                                </td>
                            </tr>
                            <tr>
                                <th><label for="target_group">Zielgruppe</label></th>
                                <td>
                                    <input type="text" id="target_group" name="target_group" class="regular-text"
                                           value="<?php echo esc_attr($editing['target_group'] ?? ''); ?>"
                                           placeholder="z.B. B2C / Arbeitsamt">
                                </td>
                            </tr>
                            <tr>
                                <th><label for="sort_order">Sortierung</label></th>
                                <td>
                                    <input type="number" id="sort_order" name="sort_order" class="small-text"
                                           value="<?php echo esc_attr($editing['sort_order'] ?? 0); ?>">
                                </td>
                            </tr>
                            <tr>
                                <th><label for="is_active">Aktiv</label></th>
                                <td>
                                    <label>
                                        <input type="checkbox" id="is_active" name="is_active" value="1"
                                            <?php checked($editing['is_active'] ?? 1, 1); ?>>
                                        Setup ist aktiv und wird angezeigt
                                    </label>
                                </td>
                            </tr>
                        </table>

                        <p class="submit">
                            <button type="submit" class="button button-primary">
                                <?php echo $editing ? 'Speichern' : 'Setup erstellen'; ?>
                            </button>
                            <a href="<?php echo admin_url('admin.php?page=bewerbungstrainer-setups'); ?>" class="button">Abbrechen</a>
                        </p>
                    </form>
                </div>
            <?php else: ?>
                <!-- Setups List -->
                <table class="wp-list-table widefat fixed striped">
                    <thead>
                        <tr>
                            <th style="width: 60px;">Icon</th>
                            <th>Name</th>
                            <th>Beschreibung</th>
                            <th>Fokus</th>
                            <th>Zielgruppe</th>
                            <th style="width: 80px;">Sortierung</th>
                            <th style="width: 80px;">Status</th>
                            <th style="width: 120px;">Aktionen</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php if (empty($setups)): ?>
                            <tr>
                                <td colspan="8">Keine Setups vorhanden.</td>
                            </tr>
                        <?php else: ?>
                            <?php foreach ($setups as $setup): ?>
                                <tr>
                                    <td>
                                        <span class="setup-icon" style="background-color: <?php echo esc_attr($setup['color']); ?>20;">
                                            <?php echo esc_html($setup['icon']); ?>
                                        </span>
                                    </td>
                                    <td>
                                        <strong><?php echo esc_html($setup['name']); ?></strong>
                                        <br><code style="font-size: 11px; color: #666;"><?php echo esc_html($setup['slug']); ?></code>
                                    </td>
                                    <td><?php echo esc_html(wp_trim_words($setup['description'], 10)); ?></td>
                                    <td>
                                        <span class="setup-tag" style="background-color: <?php echo esc_attr($setup['color']); ?>20; color: <?php echo esc_attr($setup['color']); ?>;">
                                            <?php echo esc_html($setup['focus']); ?>
                                        </span>
                                    </td>
                                    <td><?php echo esc_html($setup['target_group']); ?></td>
                                    <td><?php echo esc_html($setup['sort_order']); ?></td>
                                    <td>
                                        <?php if ($setup['is_active']): ?>
                                            <span class="status-active">Aktiv</span>
                                        <?php else: ?>
                                            <span class="status-inactive">Inaktiv</span>
                                        <?php endif; ?>
                                    </td>
                                    <td>
                                        <a href="<?php echo admin_url('admin.php?page=bewerbungstrainer-setups&edit=' . $setup['id']); ?>" class="button button-small">Bearbeiten</a>
                                        <form method="post" style="display: inline;">
                                            <?php wp_nonce_field('bewerbungstrainer_setup_action', 'setup_nonce'); ?>
                                            <input type="hidden" name="action" value="delete">
                                            <input type="hidden" name="setup_id" value="<?php echo $setup['id']; ?>">
                                            <button type="submit" class="button button-small button-link-delete" onclick="return confirm('Setup wirklich löschen?');">Löschen</button>
                                        </form>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </tbody>
                </table>
            <?php endif; ?>
        </div>

        <style>
            .bewerbungstrainer-setups-admin .setup-icon {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 40px;
                height: 40px;
                border-radius: 10px;
                font-size: 20px;
            }
            .bewerbungstrainer-setups-admin .setup-tag {
                display: inline-block;
                padding: 3px 10px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 500;
            }
            .bewerbungstrainer-setups-admin .status-active {
                color: #059669;
                font-weight: 500;
            }
            .bewerbungstrainer-setups-admin .status-inactive {
                color: #dc2626;
            }
            .bewerbungstrainer-setups-admin .setup-form-container {
                background: #fff;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                max-width: 800px;
            }
            .bewerbungstrainer-setups-admin input[type="color"] {
                width: 60px;
                height: 40px;
                padding: 0;
                border: 1px solid #ddd;
                border-radius: 4px;
                cursor: pointer;
            }
        </style>
        <?php
    }

    /**
     * Handle form submission
     */
    private function handle_form_submission() {
        if (!isset($_POST['setup_nonce']) || !wp_verify_nonce($_POST['setup_nonce'], 'bewerbungstrainer_setup_action')) {
            return;
        }

        if (!current_user_can('manage_options')) {
            return;
        }

        $action = sanitize_text_field($_POST['action']);

        switch ($action) {
            case 'create':
                $data = array(
                    'slug' => sanitize_title($_POST['name']),
                    'name' => sanitize_text_field($_POST['name']),
                    'description' => sanitize_textarea_field($_POST['description']),
                    'icon' => sanitize_text_field($_POST['icon'] ?: '🎯'),
                    'color' => sanitize_hex_color($_POST['color'] ?: '#3b82f6'),
                    'focus' => sanitize_text_field($_POST['focus']),
                    'target_group' => sanitize_text_field($_POST['target_group']),
                    'sort_order' => intval($_POST['sort_order']),
                    'is_active' => isset($_POST['is_active']) ? 1 : 0,
                );
                $this->create_setup($data);
                wp_redirect(admin_url('admin.php?page=bewerbungstrainer-setups&created=1'));
                exit;

            case 'update':
                $id = intval($_POST['setup_id']);
                $data = array(
                    'slug' => sanitize_title($_POST['name']),
                    'name' => sanitize_text_field($_POST['name']),
                    'description' => sanitize_textarea_field($_POST['description']),
                    'icon' => sanitize_text_field($_POST['icon'] ?: '🎯'),
                    'color' => sanitize_hex_color($_POST['color'] ?: '#3b82f6'),
                    'focus' => sanitize_text_field($_POST['focus']),
                    'target_group' => sanitize_text_field($_POST['target_group']),
                    'sort_order' => intval($_POST['sort_order']),
                    'is_active' => isset($_POST['is_active']) ? 1 : 0,
                );
                $this->update_setup($id, $data);
                wp_redirect(admin_url('admin.php?page=bewerbungstrainer-setups&updated=1'));
                exit;

            case 'delete':
                $id = intval($_POST['setup_id']);
                $this->delete_setup($id);
                wp_redirect(admin_url('admin.php?page=bewerbungstrainer-setups&deleted=1'));
                exit;
        }
    }
}

// Initialize
Bewerbungstrainer_Scenario_Setups::get_instance();
