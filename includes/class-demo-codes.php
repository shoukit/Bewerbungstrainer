<?php
/**
 * Demo Codes Management Class
 *
 * Handles demo codes for customer trials with session isolation
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

class Bewerbungstrainer_Demo_Codes {

    /**
     * Instance of this class
     */
    private static $instance = null;

    /**
     * Table name for demo codes
     */
    private $table_demo_codes;

    /**
     * Demo user login name
     */
    const DEMO_USERNAME = 'demo';

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
        $this->table_demo_codes = $wpdb->prefix . 'bewerbungstrainer_demo_codes';

        // Add admin menu
        add_action('admin_menu', array($this, 'add_admin_menu'));
    }

    /**
     * Add admin menu for demo codes
     */
    public function add_admin_menu() {
        add_submenu_page(
            'bewerbungstrainer',
            __('Demo-Codes', 'bewerbungstrainer'),
            __('Demo-Codes', 'bewerbungstrainer'),
            'manage_options',
            'bewerbungstrainer-demo-codes',
            array($this, 'render_admin_page')
        );
    }

    /**
     * Render admin page for demo codes
     */
    public function render_admin_page() {
        // Handle generate codes action
        if (isset($_POST['generate_codes']) && check_admin_referer('generate_demo_codes')) {
            $count = isset($_POST['code_count']) ? intval($_POST['code_count']) : 50;
            $count = min($count, 200); // Max 200 at a time
            $generated = $this->add_more_codes($count);
            echo '<div class="notice notice-success"><p>' . sprintf(__('%d neue Demo-Codes wurden generiert.', 'bewerbungstrainer'), $generated) . '</p></div>';
        }

        // Get filter
        $filter = isset($_GET['filter']) ? sanitize_text_field($_GET['filter']) : null;

        // Get codes
        $codes = $this->get_all_codes(array(
            'filter' => $filter,
            'limit' => 200,
            'orderby' => 'created_at',
            'order' => 'ASC',
        ));

        $total_all = $this->get_codes_count();
        $total_used = $this->get_codes_count('used');
        $total_unused = $this->get_codes_count('unused');

        ?>
        <div class="wrap">
            <h1><?php _e('Demo-Codes Verwaltung', 'bewerbungstrainer'); ?></h1>

            <!-- Stats Cards -->
            <div style="display: flex; gap: 20px; margin: 20px 0;">
                <div class="card" style="padding: 15px 20px; margin: 0;">
                    <h3 style="margin: 0 0 5px 0; font-size: 14px; color: #666;"><?php _e('Gesamt', 'bewerbungstrainer'); ?></h3>
                    <span style="font-size: 28px; font-weight: bold; color: #2271b1;"><?php echo $total_all; ?></span>
                </div>
                <div class="card" style="padding: 15px 20px; margin: 0;">
                    <h3 style="margin: 0 0 5px 0; font-size: 14px; color: #666;"><?php _e('Verwendet', 'bewerbungstrainer'); ?></h3>
                    <span style="font-size: 28px; font-weight: bold; color: #00a32a;"><?php echo $total_used; ?></span>
                </div>
                <div class="card" style="padding: 15px 20px; margin: 0;">
                    <h3 style="margin: 0 0 5px 0; font-size: 14px; color: #666;"><?php _e('Verfügbar', 'bewerbungstrainer'); ?></h3>
                    <span style="font-size: 28px; font-weight: bold; color: #dba617;"><?php echo $total_unused; ?></span>
                </div>
            </div>

            <!-- Generate New Codes -->
            <div class="card" style="max-width: 400px; margin-bottom: 20px;">
                <h2><?php _e('Neue Codes generieren', 'bewerbungstrainer'); ?></h2>
                <form method="post">
                    <?php wp_nonce_field('generate_demo_codes'); ?>
                    <p>
                        <label for="code_count"><?php _e('Anzahl:', 'bewerbungstrainer'); ?></label>
                        <input type="number" name="code_count" id="code_count" value="50" min="1" max="200" style="width: 80px; margin-left: 10px;">
                    </p>
                    <p>
                        <input type="submit" name="generate_codes" class="button button-primary" value="<?php _e('Codes generieren', 'bewerbungstrainer'); ?>">
                    </p>
                </form>
            </div>

            <!-- Filter Links -->
            <ul class="subsubsub" style="margin-bottom: 10px;">
                <li>
                    <a href="<?php echo admin_url('admin.php?page=bewerbungstrainer-demo-codes'); ?>" <?php echo !$filter ? 'class="current"' : ''; ?>>
                        <?php _e('Alle', 'bewerbungstrainer'); ?> <span class="count">(<?php echo $total_all; ?>)</span>
                    </a> |
                </li>
                <li>
                    <a href="<?php echo admin_url('admin.php?page=bewerbungstrainer-demo-codes&filter=used'); ?>" <?php echo $filter === 'used' ? 'class="current"' : ''; ?>>
                        <?php _e('Verwendet', 'bewerbungstrainer'); ?> <span class="count">(<?php echo $total_used; ?>)</span>
                    </a> |
                </li>
                <li>
                    <a href="<?php echo admin_url('admin.php?page=bewerbungstrainer-demo-codes&filter=unused'); ?>" <?php echo $filter === 'unused' ? 'class="current"' : ''; ?>>
                        <?php _e('Verfügbar', 'bewerbungstrainer'); ?> <span class="count">(<?php echo $total_unused; ?>)</span>
                    </a>
                </li>
            </ul>

            <!-- Codes Table -->
            <table class="wp-list-table widefat fixed striped">
                <thead>
                    <tr>
                        <th style="width: 100px;"><?php _e('Code', 'bewerbungstrainer'); ?></th>
                        <th style="width: 80px;"><?php _e('Status', 'bewerbungstrainer'); ?></th>
                        <th><?php _e('Firma', 'bewerbungstrainer'); ?></th>
                        <th><?php _e('Ansprechpartner', 'bewerbungstrainer'); ?></th>
                        <th><?php _e('E-Mail', 'bewerbungstrainer'); ?></th>
                        <th style="width: 80px;"><?php _e('Sessions', 'bewerbungstrainer'); ?></th>
                        <th style="width: 140px;"><?php _e('Erste Nutzung', 'bewerbungstrainer'); ?></th>
                        <th style="width: 140px;"><?php _e('Letzte Nutzung', 'bewerbungstrainer'); ?></th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (empty($codes)): ?>
                        <tr>
                            <td colspan="8"><?php _e('Keine Codes gefunden.', 'bewerbungstrainer'); ?></td>
                        </tr>
                    <?php else: ?>
                        <?php foreach ($codes as $code): ?>
                            <tr>
                                <td>
                                    <code style="font-size: 14px; font-weight: bold; letter-spacing: 1px;"><?php echo esc_html($code->demo_code); ?></code>
                                </td>
                                <td>
                                    <?php if ($code->is_used): ?>
                                        <span style="color: #00a32a; font-weight: 500;"><?php _e('Verwendet', 'bewerbungstrainer'); ?></span>
                                    <?php else: ?>
                                        <span style="color: #dba617;"><?php _e('Verfügbar', 'bewerbungstrainer'); ?></span>
                                    <?php endif; ?>
                                </td>
                                <td><?php echo esc_html($code->company_name ?: '-'); ?></td>
                                <td><?php echo esc_html($code->contact_name ?: '-'); ?></td>
                                <td>
                                    <?php if ($code->contact_email): ?>
                                        <a href="mailto:<?php echo esc_attr($code->contact_email); ?>"><?php echo esc_html($code->contact_email); ?></a>
                                    <?php else: ?>
                                        -
                                    <?php endif; ?>
                                </td>
                                <td style="text-align: center;"><?php echo intval($code->session_count); ?></td>
                                <td>
                                    <?php if ($code->first_used_at): ?>
                                        <?php echo date_i18n(get_option('date_format') . ' ' . get_option('time_format'), strtotime($code->first_used_at)); ?>
                                    <?php else: ?>
                                        -
                                    <?php endif; ?>
                                </td>
                                <td>
                                    <?php if ($code->last_used_at): ?>
                                        <?php echo date_i18n(get_option('date_format') . ' ' . get_option('time_format'), strtotime($code->last_used_at)); ?>
                                    <?php else: ?>
                                        -
                                    <?php endif; ?>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>

            <!-- Copy Codes Section for Unused Codes -->
            <?php if ($total_unused > 0): ?>
            <div class="card" style="max-width: 600px; margin-top: 20px;">
                <h2><?php _e('Verfügbare Codes kopieren', 'bewerbungstrainer'); ?></h2>
                <p><?php _e('Klicken Sie auf den Button, um alle verfügbaren Codes zu kopieren:', 'bewerbungstrainer'); ?></p>
                <?php
                $unused_codes = $this->get_all_codes(array('filter' => 'unused', 'limit' => 500));
                $code_list = implode("\n", array_column($unused_codes, 'demo_code'));
                ?>
                <textarea id="unused-codes-list" readonly style="width: 100%; height: 150px; font-family: monospace; font-size: 14px; letter-spacing: 1px;"><?php echo esc_textarea($code_list); ?></textarea>
                <p>
                    <button type="button" class="button" onclick="navigator.clipboard.writeText(document.getElementById('unused-codes-list').value).then(() => alert('<?php _e('Codes wurden in die Zwischenablage kopiert!', 'bewerbungstrainer'); ?>'));">
                        <?php _e('Alle kopieren', 'bewerbungstrainer'); ?>
                    </button>
                </p>
            </div>
            <?php endif; ?>
        </div>
        <?php
    }

    /**
     * Create demo codes table
     */
    public static function create_tables() {
        global $wpdb;

        $charset_collate = $wpdb->get_charset_collate();
        $table_demo_codes = $wpdb->prefix . 'bewerbungstrainer_demo_codes';

        $sql = "CREATE TABLE IF NOT EXISTS $table_demo_codes (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            demo_code varchar(10) NOT NULL,
            company_name varchar(255) DEFAULT NULL,
            contact_name varchar(255) DEFAULT NULL,
            homepage varchar(500) DEFAULT NULL,
            contact_email varchar(255) DEFAULT NULL,
            phone varchar(50) DEFAULT NULL,
            privacy_accepted tinyint(1) NOT NULL DEFAULT 0,
            privacy_accepted_at datetime DEFAULT NULL,
            is_used tinyint(1) NOT NULL DEFAULT 0,
            first_used_at datetime DEFAULT NULL,
            last_used_at datetime DEFAULT NULL,
            session_count int DEFAULT 0,
            notes text DEFAULT NULL,
            created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY demo_code (demo_code),
            KEY is_used (is_used),
            KEY company_name (company_name),
            KEY created_at (created_at)
        ) $charset_collate;";

        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);

        // Generate initial 100 codes if table is empty
        self::generate_initial_codes();
    }

    /**
     * Generate 100 initial demo codes
     */
    public static function generate_initial_codes() {
        global $wpdb;

        $table = $wpdb->prefix . 'bewerbungstrainer_demo_codes';

        // Check if we already have codes
        $count = $wpdb->get_var("SELECT COUNT(*) FROM $table");

        if ($count > 0) {
            return; // Codes already exist
        }

        // Generate 100 unique codes
        $codes = self::generate_unique_codes(100);

        foreach ($codes as $code) {
            $wpdb->insert(
                $table,
                array('demo_code' => $code),
                array('%s')
            );
        }

        error_log('Bewerbungstrainer: Generated 100 demo codes');
    }

    /**
     * Generate unique 5-character codes
     *
     * @param int $count Number of codes to generate
     * @return array Array of unique codes
     */
    private static function generate_unique_codes($count) {
        $codes = array();
        $characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded similar characters: I, O, 0, 1

        while (count($codes) < $count) {
            $code = '';
            for ($i = 0; $i < 5; $i++) {
                $code .= $characters[random_int(0, strlen($characters) - 1)];
            }

            // Ensure uniqueness
            if (!in_array($code, $codes)) {
                $codes[] = $code;
            }
        }

        return $codes;
    }

    /**
     * Check if code is valid
     *
     * @param string $code Demo code to validate
     * @return bool True if valid, false otherwise
     */
    public function is_valid_code($code) {
        global $wpdb;

        $code = strtoupper(sanitize_text_field($code));

        $exists = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COUNT(*) FROM {$this->table_demo_codes} WHERE demo_code = %s",
                $code
            )
        );

        return $exists > 0;
    }

    /**
     * Get demo code details
     *
     * @param string $code Demo code
     * @return object|null Code data or null
     */
    public function get_code($code) {
        global $wpdb;

        $code = strtoupper(sanitize_text_field($code));

        return $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$this->table_demo_codes} WHERE demo_code = %s",
                $code
            )
        );
    }

    /**
     * Activate code with contact details
     *
     * @param string $code Demo code
     * @param array $contact_data Contact information
     * @return bool Success status
     */
    public function activate_code($code, $contact_data) {
        global $wpdb;

        $code = strtoupper(sanitize_text_field($code));

        // Check if code exists
        if (!$this->is_valid_code($code)) {
            return false;
        }

        $update_data = array(
            'company_name' => sanitize_text_field($contact_data['company_name'] ?? ''),
            'contact_name' => sanitize_text_field($contact_data['contact_name'] ?? ''),
            'homepage' => esc_url_raw($contact_data['homepage'] ?? ''),
            'contact_email' => sanitize_email($contact_data['contact_email'] ?? ''),
            'phone' => sanitize_text_field($contact_data['phone'] ?? ''),
            'privacy_accepted' => !empty($contact_data['privacy_accepted']) ? 1 : 0,
            'privacy_accepted_at' => !empty($contact_data['privacy_accepted']) ? current_time('mysql') : null,
            'is_used' => 1,
            'last_used_at' => current_time('mysql'),
        );

        // Set first_used_at only if not already set
        $existing = $this->get_code($code);
        if ($existing && empty($existing->first_used_at)) {
            $update_data['first_used_at'] = current_time('mysql');
        }

        $result = $wpdb->update(
            $this->table_demo_codes,
            $update_data,
            array('demo_code' => $code),
            array('%s', '%s', '%s', '%s', '%s', '%d', '%s', '%d', '%s'),
            array('%s')
        );

        return $result !== false;
    }

    /**
     * Update last used timestamp and increment session count
     *
     * @param string $code Demo code
     * @return bool Success status
     */
    public function update_usage($code) {
        global $wpdb;

        $code = strtoupper(sanitize_text_field($code));

        return $wpdb->query(
            $wpdb->prepare(
                "UPDATE {$this->table_demo_codes}
                SET last_used_at = %s, session_count = session_count + 1
                WHERE demo_code = %s",
                current_time('mysql'),
                $code
            )
        ) !== false;
    }

    /**
     * Get all demo codes (for admin)
     *
     * @param array $args Query arguments
     * @return array Array of code objects
     */
    public function get_all_codes($args = array()) {
        global $wpdb;

        // Ensure table exists
        $this->ensure_table_exists();

        $defaults = array(
            'limit' => 100,
            'offset' => 0,
            'orderby' => 'created_at',
            'order' => 'ASC',
            'filter' => null, // 'used', 'unused', or null for all
        );

        $args = wp_parse_args($args, $defaults);

        // Validate orderby
        $allowed_orderby = array('id', 'demo_code', 'company_name', 'is_used', 'first_used_at', 'session_count', 'created_at');
        if (!in_array($args['orderby'], $allowed_orderby)) {
            $args['orderby'] = 'created_at';
        }

        // Validate order
        $args['order'] = strtoupper($args['order']) === 'DESC' ? 'DESC' : 'ASC';

        // Build WHERE clause
        $where = '1=1';
        if ($args['filter'] === 'used') {
            $where .= ' AND is_used = 1';
        } elseif ($args['filter'] === 'unused') {
            $where .= ' AND is_used = 0';
        }

        $query = $wpdb->prepare(
            "SELECT * FROM {$this->table_demo_codes}
            WHERE {$where}
            ORDER BY {$args['orderby']} {$args['order']}
            LIMIT %d OFFSET %d",
            $args['limit'],
            $args['offset']
        );

        return $wpdb->get_results($query);
    }

    /**
     * Get count of demo codes
     *
     * @param string|null $filter Filter ('used', 'unused', or null)
     * @return int Count
     */
    public function get_codes_count($filter = null) {
        global $wpdb;

        // Ensure table exists
        $this->ensure_table_exists();

        $where = '1=1';
        if ($filter === 'used') {
            $where .= ' AND is_used = 1';
        } elseif ($filter === 'unused') {
            $where .= ' AND is_used = 0';
        }

        return (int) $wpdb->get_var(
            "SELECT COUNT(*) FROM {$this->table_demo_codes} WHERE {$where}"
        );
    }

    /**
     * Add more codes
     *
     * @param int $count Number of codes to add
     * @return int Number of codes added
     */
    public function add_more_codes($count = 50) {
        global $wpdb;

        // Ensure table exists
        $this->ensure_table_exists();

        // Get existing codes
        $existing = $wpdb->get_col("SELECT demo_code FROM {$this->table_demo_codes}");
        if (!is_array($existing)) {
            $existing = array();
        }

        // Generate new unique codes
        $new_codes = array();
        $characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        $attempts = 0;
        $max_attempts = $count * 10;

        while (count($new_codes) < $count && $attempts < $max_attempts) {
            $code = '';
            for ($i = 0; $i < 5; $i++) {
                $code .= $characters[random_int(0, strlen($characters) - 1)];
            }

            if (!in_array($code, $existing) && !in_array($code, $new_codes)) {
                $new_codes[] = $code;
            }
            $attempts++;
        }

        // Insert new codes
        $inserted = 0;
        foreach ($new_codes as $code) {
            $result = $wpdb->insert(
                $this->table_demo_codes,
                array('demo_code' => $code),
                array('%s')
            );
            if ($result) {
                $inserted++;
            }
        }

        return $inserted;
    }

    /**
     * Update notes for a code
     *
     * @param string $code Demo code
     * @param string $notes Notes text
     * @return bool Success status
     */
    public function update_notes($code, $notes) {
        global $wpdb;

        $code = strtoupper(sanitize_text_field($code));

        return $wpdb->update(
            $this->table_demo_codes,
            array('notes' => sanitize_textarea_field($notes)),
            array('demo_code' => $code),
            array('%s'),
            array('%s')
        ) !== false;
    }

    /**
     * Ensure the demo codes table exists
     */
    private function ensure_table_exists() {
        global $wpdb;

        // Check if table exists
        $table_exists = $wpdb->get_var(
            $wpdb->prepare(
                "SHOW TABLES LIKE %s",
                $this->table_demo_codes
            )
        );

        if (!$table_exists) {
            // Create table
            self::create_tables();
        }
    }

    /**
     * Check if current user is demo user
     *
     * @return bool True if demo user
     */
    public static function is_demo_user() {
        $user = wp_get_current_user();
        return $user && $user->user_login === self::DEMO_USERNAME;
    }

    /**
     * Get table name
     *
     * @return string Table name
     */
    public function get_table_name() {
        return $this->table_demo_codes;
    }
}
