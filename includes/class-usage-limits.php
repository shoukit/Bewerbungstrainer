<?php
/**
 * Usage Limits Management Class
 *
 * Handles per-user monthly usage limits for Live-Gespräche (Roleplay)
 * Uses separate usage_log table to track usage independent of sessions
 *
 * @package Bewerbungstrainer
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

class Bewerbungstrainer_Usage_Limits {

    /**
     * Instance of this class
     */
    private static $instance = null;

    /**
     * Table name for usage limits configuration
     */
    private $table_usage_limits;

    /**
     * Table name for usage log (tracking)
     */
    private $table_usage_log;

    /**
     * Default monthly minutes
     */
    const DEFAULT_MONTHLY_MINUTES = 10;

    /**
     * Usage types
     */
    const USAGE_TYPE_LIVE_CONVERSATION = 'live_conversation';
    const USAGE_TYPE_VIDEO_TRAINING = 'video_training';
    const USAGE_TYPE_SIMULATOR = 'simulator';

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
        $this->table_usage_limits = $wpdb->prefix . 'bewerbungstrainer_usage_limits';
        $this->table_usage_log = $wpdb->prefix . 'bewerbungstrainer_usage_log';

        // Add admin menu
        add_action('admin_menu', array($this, 'add_admin_menu'));

        // Handle admin form submissions
        add_action('admin_init', array($this, 'handle_admin_actions'));

        // Run migrations
        $this->run_migrations();
    }

    /**
     * Run database migrations
     */
    private function run_migrations() {
        $current_version = get_option('bewerbungstrainer_usage_limits_version', '0');

        // Migration 1.0.0: Set existing roleplay sessions duration to 0
        if (version_compare($current_version, '1.0.0', '<')) {
            $this->migrate_existing_sessions();
            update_option('bewerbungstrainer_usage_limits_version', '1.0.0');
        }
    }

    /**
     * Migrate existing roleplay sessions to have duration = 0
     */
    private function migrate_existing_sessions() {
        global $wpdb;

        $table_roleplay = $wpdb->prefix . 'bewerbungstrainer_roleplay_sessions';

        // Check if table exists
        $table_exists = $wpdb->get_var("SHOW TABLES LIKE '$table_roleplay'");
        if (!$table_exists) {
            return;
        }

        // Update all NULL durations to 0
        $wpdb->query("UPDATE $table_roleplay SET duration = 0 WHERE duration IS NULL");

        error_log('[USAGE_LIMITS] Migrated existing roleplay sessions - set NULL durations to 0');
    }

    /**
     * Add admin menu for usage limits
     */
    public function add_admin_menu() {
        add_submenu_page(
            'bewerbungstrainer',
            __('Nutzungslimits', 'bewerbungstrainer'),
            __('Nutzungslimits', 'bewerbungstrainer'),
            'manage_options',
            'bewerbungstrainer-usage-limits',
            array($this, 'render_admin_page')
        );
    }

    /**
     * Handle admin form actions
     */
    public function handle_admin_actions() {
        if (!isset($_GET['page']) || $_GET['page'] !== 'bewerbungstrainer-usage-limits') {
            return;
        }

        // Handle save limit action
        if (isset($_POST['save_limit']) && check_admin_referer('save_usage_limit')) {
            $user_identifier = sanitize_text_field($_POST['user_identifier'] ?? '');
            $identifier_type = sanitize_text_field($_POST['identifier_type'] ?? 'user_id');
            $monthly_minutes = intval($_POST['monthly_minutes'] ?? self::DEFAULT_MONTHLY_MINUTES);

            if (!empty($user_identifier)) {
                $this->set_user_limit($user_identifier, $identifier_type, $monthly_minutes);
                wp_redirect(admin_url('admin.php?page=bewerbungstrainer-usage-limits&saved=1'));
                exit;
            }
        }

        // Handle delete limit action
        if (isset($_GET['action']) && $_GET['action'] === 'delete' && isset($_GET['id'])) {
            if (!wp_verify_nonce($_GET['_wpnonce'], 'delete_limit_' . $_GET['id'])) {
                wp_die('Security check failed');
            }

            $this->delete_limit(intval($_GET['id']));
            wp_redirect(admin_url('admin.php?page=bewerbungstrainer-usage-limits&deleted=1'));
            exit;
        }

        // Handle reset usage action (clears usage log for this period)
        if (isset($_GET['action']) && $_GET['action'] === 'reset' && isset($_GET['id'])) {
            if (!wp_verify_nonce($_GET['_wpnonce'], 'reset_limit_' . $_GET['id'])) {
                wp_die('Security check failed');
            }

            $this->reset_usage(intval($_GET['id']));
            wp_redirect(admin_url('admin.php?page=bewerbungstrainer-usage-limits&reset=1'));
            exit;
        }
    }

    /**
     * Create database tables
     */
    public static function create_tables() {
        global $wpdb;

        $charset_collate = $wpdb->get_charset_collate();
        $table_usage_limits = $wpdb->prefix . 'bewerbungstrainer_usage_limits';
        $table_usage_log = $wpdb->prefix . 'bewerbungstrainer_usage_log';

        // Table for per-user/demo-code limits configuration
        $sql_limits = "CREATE TABLE IF NOT EXISTS $table_usage_limits (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            user_id bigint(20) UNSIGNED DEFAULT NULL,
            demo_code varchar(10) DEFAULT NULL,
            monthly_minutes int NOT NULL DEFAULT 10,
            notes text DEFAULT NULL,
            created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY user_id (user_id),
            UNIQUE KEY demo_code (demo_code)
        ) $charset_collate;";

        // Table for usage tracking (independent of sessions)
        $sql_log = "CREATE TABLE IF NOT EXISTS $table_usage_log (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            user_id bigint(20) UNSIGNED DEFAULT NULL,
            demo_code varchar(10) DEFAULT NULL,
            usage_type varchar(50) NOT NULL DEFAULT 'live_conversation',
            duration_seconds int NOT NULL DEFAULT 0,
            session_id bigint(20) UNSIGNED DEFAULT NULL,
            description varchar(255) DEFAULT NULL,
            created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY user_id (user_id),
            KEY demo_code (demo_code),
            KEY usage_type (usage_type),
            KEY created_at (created_at),
            KEY session_id (session_id)
        ) $charset_collate;";

        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql_limits);
        dbDelta($sql_log);

        error_log('[USAGE_LIMITS] Created usage limits and usage log tables');
    }

    /**
     * Get current period start and end dates
     *
     * @return array ['start' => date, 'end' => date]
     */
    private function get_current_period() {
        $now = current_time('timestamp');
        $start = date('Y-m-01', $now);
        $end = date('Y-m-t', $now);

        return array(
            'start' => $start,
            'end' => $end,
        );
    }

    /**
     * Get usage limit configuration for a user/demo_code
     * Returns the monthly minutes limit
     *
     * @param int|null $user_id WordPress user ID
     * @param string|null $demo_code Demo code (for demo users)
     * @return object|null Limit configuration or null for default
     */
    public function get_user_limit_config($user_id = null, $demo_code = null) {
        global $wpdb;

        $this->ensure_tables_exist();

        // Determine query based on identifier
        if (!empty($demo_code)) {
            $demo_code = strtoupper(sanitize_text_field($demo_code));
            return $wpdb->get_row(
                $wpdb->prepare(
                    "SELECT * FROM {$this->table_usage_limits} WHERE demo_code = %s",
                    $demo_code
                )
            );
        } else if (!empty($user_id)) {
            return $wpdb->get_row(
                $wpdb->prepare(
                    "SELECT * FROM {$this->table_usage_limits} WHERE user_id = %d AND demo_code IS NULL",
                    $user_id
                )
            );
        }

        return null;
    }

    /**
     * Calculate total usage for current period from usage log
     *
     * @param int|null $user_id WordPress user ID
     * @param string|null $demo_code Demo code
     * @param string $usage_type Usage type filter (default: all)
     * @return float Total minutes used this period
     */
    public function get_usage_this_period($user_id = null, $demo_code = null, $usage_type = null) {
        global $wpdb;

        $this->ensure_tables_exist();

        $period = $this->get_current_period();

        // Build query
        $where_clauses = array();
        $where_values = array();

        // Date range
        $where_clauses[] = "created_at >= %s";
        $where_values[] = $period['start'] . ' 00:00:00';
        $where_clauses[] = "created_at <= %s";
        $where_values[] = $period['end'] . ' 23:59:59';

        // User/Demo code filter
        if (!empty($demo_code)) {
            $demo_code = strtoupper(sanitize_text_field($demo_code));
            $where_clauses[] = "demo_code = %s";
            $where_values[] = $demo_code;
        } else if (!empty($user_id)) {
            $where_clauses[] = "user_id = %d AND (demo_code IS NULL OR demo_code = '')";
            $where_values[] = $user_id;
        } else {
            return 0;
        }

        // Usage type filter
        if (!empty($usage_type)) {
            $where_clauses[] = "usage_type = %s";
            $where_values[] = $usage_type;
        }

        $where_sql = implode(' AND ', $where_clauses);

        $total_seconds = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COALESCE(SUM(duration_seconds), 0) FROM {$this->table_usage_log} WHERE $where_sql",
                $where_values
            )
        );

        return floatval($total_seconds) / 60; // Return minutes
    }

    /**
     * Set usage limit for a user/demo_code
     *
     * @param string $identifier User ID or demo code
     * @param string $type 'user_id' or 'demo_code'
     * @param int $monthly_minutes Monthly minutes limit
     * @return bool Success
     */
    public function set_user_limit($identifier, $type, $monthly_minutes) {
        global $wpdb;

        $this->ensure_tables_exist();

        if ($type === 'demo_code') {
            $demo_code = strtoupper(sanitize_text_field($identifier));

            // Check if exists
            $existing = $wpdb->get_var(
                $wpdb->prepare(
                    "SELECT id FROM {$this->table_usage_limits} WHERE demo_code = %s",
                    $demo_code
                )
            );

            if ($existing) {
                return $wpdb->update(
                    $this->table_usage_limits,
                    array('monthly_minutes' => $monthly_minutes),
                    array('demo_code' => $demo_code),
                    array('%d'),
                    array('%s')
                ) !== false;
            } else {
                return $wpdb->insert(
                    $this->table_usage_limits,
                    array(
                        'demo_code' => $demo_code,
                        'monthly_minutes' => $monthly_minutes,
                    ),
                    array('%s', '%d')
                ) !== false;
            }
        } else {
            $user_id = intval($identifier);

            // Check if exists
            $existing = $wpdb->get_var(
                $wpdb->prepare(
                    "SELECT id FROM {$this->table_usage_limits} WHERE user_id = %d AND demo_code IS NULL",
                    $user_id
                )
            );

            if ($existing) {
                return $wpdb->update(
                    $this->table_usage_limits,
                    array('monthly_minutes' => $monthly_minutes),
                    array('user_id' => $user_id, 'demo_code' => null),
                    array('%d'),
                    array('%d', '%s')
                ) !== false;
            } else {
                return $wpdb->insert(
                    $this->table_usage_limits,
                    array(
                        'user_id' => $user_id,
                        'monthly_minutes' => $monthly_minutes,
                    ),
                    array('%d', '%d')
                ) !== false;
            }
        }
    }

    /**
     * Log usage to the usage_log table
     *
     * @param int $seconds Seconds to log
     * @param int|null $user_id WordPress user ID
     * @param string|null $demo_code Demo code (for demo users)
     * @param string $usage_type Type of usage (live_conversation, video_training, etc.)
     * @param int|null $session_id Reference to session ID
     * @param string|null $description Optional description
     * @return bool Success
     */
    public function log_usage($seconds, $user_id = null, $demo_code = null, $usage_type = self::USAGE_TYPE_LIVE_CONVERSATION, $session_id = null, $description = null) {
        global $wpdb;

        $this->ensure_tables_exist();

        if ($seconds <= 0) {
            return true; // Nothing to log
        }

        // Sanitize demo_code
        if (!empty($demo_code)) {
            $demo_code = strtoupper(sanitize_text_field($demo_code));
        }

        $data = array(
            'duration_seconds' => intval($seconds),
            'usage_type' => sanitize_text_field($usage_type),
        );
        $formats = array('%d', '%s');

        if (!empty($user_id)) {
            $data['user_id'] = intval($user_id);
            $formats[] = '%d';
        }

        if (!empty($demo_code)) {
            $data['demo_code'] = $demo_code;
            $formats[] = '%s';
        }

        if (!empty($session_id)) {
            $data['session_id'] = intval($session_id);
            $formats[] = '%d';
        }

        if (!empty($description)) {
            $data['description'] = sanitize_text_field($description);
            $formats[] = '%s';
        }

        $result = $wpdb->insert($this->table_usage_log, $data, $formats);

        if ($result) {
            error_log(sprintf(
                '[USAGE_LIMITS] Logged usage: %d seconds for %s (type: %s)',
                $seconds,
                !empty($demo_code) ? "demo_code=$demo_code" : "user_id=$user_id",
                $usage_type
            ));
        }

        return $result !== false;
    }

    /**
     * Check if user has remaining minutes
     *
     * @param int|null $user_id WordPress user ID
     * @param string|null $demo_code Demo code
     * @return array ['has_minutes' => bool, 'remaining' => float, 'limit' => int, 'used' => float]
     */
    public function check_availability($user_id = null, $demo_code = null) {
        // Get configured limit (or default)
        $config = $this->get_user_limit_config($user_id, $demo_code);
        $monthly_limit = $config ? intval($config->monthly_minutes) : self::DEFAULT_MONTHLY_MINUTES;

        // Get usage from log table
        $used = $this->get_usage_this_period($user_id, $demo_code);

        $remaining = $monthly_limit - $used;
        $period = $this->get_current_period();

        return array(
            'has_minutes' => $remaining > 0,
            'remaining' => max(0, $remaining),
            'limit' => $monthly_limit,
            'used' => $used,
            'period_start' => $period['start'],
            'period_end' => $period['end'],
        );
    }

    /**
     * Get all usage limits (for admin)
     *
     * @param array $args Query arguments
     * @return array Array of usage limit records with calculated usage
     */
    public function get_all_limits($args = array()) {
        global $wpdb;

        $this->ensure_tables_exist();

        $defaults = array(
            'limit' => 100,
            'offset' => 0,
            'orderby' => 'created_at',
            'order' => 'DESC',
        );

        $args = wp_parse_args($args, $defaults);

        // Validate orderby
        $allowed_orderby = array('id', 'user_id', 'demo_code', 'monthly_minutes', 'created_at');
        if (!in_array($args['orderby'], $allowed_orderby)) {
            $args['orderby'] = 'created_at';
        }

        $args['order'] = strtoupper($args['order']) === 'ASC' ? 'ASC' : 'DESC';

        $limits = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM {$this->table_usage_limits}
                ORDER BY {$args['orderby']} {$args['order']}
                LIMIT %d OFFSET %d",
                $args['limit'],
                $args['offset']
            )
        );

        // Add calculated usage to each record
        foreach ($limits as &$limit) {
            $limit->minutes_used_this_month = $this->get_usage_this_period(
                $limit->user_id,
                $limit->demo_code
            );
        }

        return $limits;
    }

    /**
     * Get usage log entries
     *
     * @param array $args Query arguments
     * @return array Array of usage log entries
     */
    public function get_usage_log($args = array()) {
        global $wpdb;

        $this->ensure_tables_exist();

        $defaults = array(
            'user_id' => null,
            'demo_code' => null,
            'usage_type' => null,
            'limit' => 50,
            'offset' => 0,
        );

        $args = wp_parse_args($args, $defaults);

        $where_clauses = array('1=1');
        $where_values = array();

        if (!empty($args['user_id'])) {
            $where_clauses[] = "user_id = %d";
            $where_values[] = intval($args['user_id']);
        }

        if (!empty($args['demo_code'])) {
            $where_clauses[] = "demo_code = %s";
            $where_values[] = strtoupper(sanitize_text_field($args['demo_code']));
        }

        if (!empty($args['usage_type'])) {
            $where_clauses[] = "usage_type = %s";
            $where_values[] = sanitize_text_field($args['usage_type']);
        }

        $where_sql = implode(' AND ', $where_clauses);

        if (!empty($where_values)) {
            return $wpdb->get_results(
                $wpdb->prepare(
                    "SELECT * FROM {$this->table_usage_log}
                    WHERE $where_sql
                    ORDER BY created_at DESC
                    LIMIT %d OFFSET %d",
                    array_merge($where_values, array($args['limit'], $args['offset']))
                )
            );
        }

        return $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM {$this->table_usage_log}
                ORDER BY created_at DESC
                LIMIT %d OFFSET %d",
                $args['limit'],
                $args['offset']
            )
        );
    }

    /**
     * Delete a usage limit record
     *
     * @param int $id Record ID
     * @return bool Success
     */
    public function delete_limit($id) {
        global $wpdb;

        return $wpdb->delete(
            $this->table_usage_limits,
            array('id' => $id),
            array('%d')
        ) !== false;
    }

    /**
     * Reset usage for a limit record (deletes log entries for current period)
     *
     * @param int $id Limit record ID
     * @return bool Success
     */
    public function reset_usage($id) {
        global $wpdb;

        // Get the limit record to find user_id or demo_code
        $limit = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$this->table_usage_limits} WHERE id = %d",
                $id
            )
        );

        if (!$limit) {
            return false;
        }

        $period = $this->get_current_period();

        // Delete log entries for this period
        if (!empty($limit->demo_code)) {
            return $wpdb->query(
                $wpdb->prepare(
                    "DELETE FROM {$this->table_usage_log}
                    WHERE demo_code = %s
                    AND created_at >= %s
                    AND created_at <= %s",
                    $limit->demo_code,
                    $period['start'] . ' 00:00:00',
                    $period['end'] . ' 23:59:59'
                )
            ) !== false;
        } else if (!empty($limit->user_id)) {
            return $wpdb->query(
                $wpdb->prepare(
                    "DELETE FROM {$this->table_usage_log}
                    WHERE user_id = %d AND (demo_code IS NULL OR demo_code = '')
                    AND created_at >= %s
                    AND created_at <= %s",
                    $limit->user_id,
                    $period['start'] . ' 00:00:00',
                    $period['end'] . ' 23:59:59'
                )
            ) !== false;
        }

        return false;
    }

    /**
     * Ensure the tables exist
     */
    private function ensure_tables_exist() {
        global $wpdb;

        $table_exists = $wpdb->get_var(
            $wpdb->prepare(
                "SHOW TABLES LIKE %s",
                $this->table_usage_limits
            )
        );

        if (!$table_exists) {
            self::create_tables();
        }
    }

    /**
     * Render admin page
     */
    public function render_admin_page() {
        // Get all limits
        $limits = $this->get_all_limits();

        // Get demo users list from demo codes
        $demo_codes_handler = Bewerbungstrainer_Demo_Codes::get_instance();
        $used_demo_codes = $demo_codes_handler->get_all_codes(array('filter' => 'used', 'limit' => 500));

        // Get total stats
        $total_limits = count($limits);

        // Show notices
        if (isset($_GET['saved'])) {
            echo '<div class="notice notice-success is-dismissible"><p>Nutzungslimit gespeichert.</p></div>';
        }
        if (isset($_GET['deleted'])) {
            echo '<div class="notice notice-success is-dismissible"><p>Nutzungslimit gelöscht.</p></div>';
        }
        if (isset($_GET['reset'])) {
            echo '<div class="notice notice-success is-dismissible"><p>Nutzung zurückgesetzt.</p></div>';
        }
        ?>
        <div class="wrap">
            <h1><?php _e('Nutzungslimits - Live-Gespräche', 'bewerbungstrainer'); ?></h1>

            <p class="description">
                Hier können Sie die monatlichen Gesprächsminuten für Live-Gespräche pro Benutzer oder Demo-Code konfigurieren.<br>
                Der Standard ist <?php echo self::DEFAULT_MONTHLY_MINUTES; ?> Minuten pro Monat. Die Minuten werden automatisch am 1. jedes Monats zurückgesetzt.<br>
                <strong>Hinweis:</strong> Die Nutzung wird in einer separaten Tabelle protokolliert und bleibt erhalten, auch wenn Sessions gelöscht werden.
            </p>

            <!-- Stats Cards -->
            <div style="display: flex; gap: 20px; margin: 20px 0;">
                <div class="card" style="padding: 15px 20px; margin: 0;">
                    <h3 style="margin: 0 0 5px 0; font-size: 14px; color: #666;"><?php _e('Konfigurierte Limits', 'bewerbungstrainer'); ?></h3>
                    <span style="font-size: 28px; font-weight: bold; color: #2271b1;"><?php echo $total_limits; ?></span>
                </div>
                <div class="card" style="padding: 15px 20px; margin: 0;">
                    <h3 style="margin: 0 0 5px 0; font-size: 14px; color: #666;"><?php _e('Standard-Minuten/Monat', 'bewerbungstrainer'); ?></h3>
                    <span style="font-size: 28px; font-weight: bold; color: #00a32a;"><?php echo self::DEFAULT_MONTHLY_MINUTES; ?></span>
                </div>
                <div class="card" style="padding: 15px 20px; margin: 0;">
                    <h3 style="margin: 0 0 5px 0; font-size: 14px; color: #666;"><?php _e('Aktive Demo-Codes', 'bewerbungstrainer'); ?></h3>
                    <span style="font-size: 28px; font-weight: bold; color: #dba617;"><?php echo count($used_demo_codes); ?></span>
                </div>
            </div>

            <!-- Add New Limit Form -->
            <div class="card" style="max-width: 500px; margin-bottom: 20px;">
                <h2><?php _e('Neues Limit hinzufügen', 'bewerbungstrainer'); ?></h2>
                <form method="post">
                    <?php wp_nonce_field('save_usage_limit'); ?>
                    <table class="form-table">
                        <tr>
                            <th><label for="identifier_type"><?php _e('Typ', 'bewerbungstrainer'); ?></label></th>
                            <td>
                                <select name="identifier_type" id="identifier_type" style="width: 100%;">
                                    <option value="demo_code"><?php _e('Demo-Code (karriereheld + Code)', 'bewerbungstrainer'); ?></option>
                                    <option value="user_id"><?php _e('WordPress Benutzer-ID', 'bewerbungstrainer'); ?></option>
                                </select>
                            </td>
                        </tr>
                        <tr>
                            <th><label for="user_identifier"><?php _e('Identifikator', 'bewerbungstrainer'); ?></label></th>
                            <td>
                                <input type="text" name="user_identifier" id="user_identifier" class="regular-text" required placeholder="z.B. ABC12 oder Benutzer-ID">
                                <p class="description" id="identifier_help"><?php _e('Demo-Code eingeben (z.B. ABC12) oder WordPress Benutzer-ID', 'bewerbungstrainer'); ?></p>
                            </td>
                        </tr>
                        <tr>
                            <th><label for="monthly_minutes"><?php _e('Minuten/Monat', 'bewerbungstrainer'); ?></label></th>
                            <td>
                                <input type="number" name="monthly_minutes" id="monthly_minutes" value="<?php echo self::DEFAULT_MONTHLY_MINUTES; ?>" min="0" max="1000" style="width: 100px;">
                                <p class="description"><?php _e('Anzahl der Gesprächsminuten pro Monat', 'bewerbungstrainer'); ?></p>
                            </td>
                        </tr>
                    </table>
                    <p>
                        <input type="submit" name="save_limit" class="button button-primary" value="<?php _e('Limit speichern', 'bewerbungstrainer'); ?>">
                    </p>
                </form>
            </div>

            <!-- Existing Limits Table -->
            <h2><?php _e('Konfigurierte Limits', 'bewerbungstrainer'); ?></h2>
            <table class="wp-list-table widefat fixed striped">
                <thead>
                    <tr>
                        <th style="width: 50px;"><?php _e('ID', 'bewerbungstrainer'); ?></th>
                        <th style="width: 120px;"><?php _e('Typ', 'bewerbungstrainer'); ?></th>
                        <th><?php _e('Benutzer / Demo-Code', 'bewerbungstrainer'); ?></th>
                        <th style="width: 100px;"><?php _e('Limit', 'bewerbungstrainer'); ?></th>
                        <th style="width: 100px;"><?php _e('Verbraucht', 'bewerbungstrainer'); ?></th>
                        <th style="width: 100px;"><?php _e('Verfügbar', 'bewerbungstrainer'); ?></th>
                        <th style="width: 120px;"><?php _e('Periode', 'bewerbungstrainer'); ?></th>
                        <th style="width: 150px;"><?php _e('Aktionen', 'bewerbungstrainer'); ?></th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (empty($limits)): ?>
                        <tr>
                            <td colspan="8"><?php _e('Keine Limits konfiguriert. Benutzer ohne explizites Limit erhalten den Standard von ', 'bewerbungstrainer'); ?><?php echo self::DEFAULT_MONTHLY_MINUTES; ?> <?php _e('Minuten.', 'bewerbungstrainer'); ?></td>
                        </tr>
                    <?php else: ?>
                        <?php foreach ($limits as $limit): ?>
                            <?php
                            $remaining = $limit->monthly_minutes - floatval($limit->minutes_used_this_month);
                            $percent_used = $limit->monthly_minutes > 0 ? (floatval($limit->minutes_used_this_month) / $limit->monthly_minutes) * 100 : 0;
                            $period = $this->get_current_period();

                            // Get user info if user_id
                            $user_display = '-';
                            if (!empty($limit->user_id)) {
                                $user = get_user_by('id', $limit->user_id);
                                if ($user) {
                                    $user_display = esc_html($user->user_login . ' (' . $user->display_name . ')');
                                } else {
                                    $user_display = '<span style="color: #ef4444;">User #' . esc_html($limit->user_id) . ' (nicht gefunden)</span>';
                                }
                            } elseif (empty($limit->demo_code)) {
                                $user_display = '<span style="color: #f59e0b;">Kein Benutzer zugewiesen</span>';
                            }
                            ?>
                            <tr>
                                <td><?php echo esc_html($limit->id); ?></td>
                                <td>
                                    <?php if (!empty($limit->demo_code)): ?>
                                        <span style="color: #a855f7; font-weight: 500;"><?php _e('Demo-Code', 'bewerbungstrainer'); ?></span>
                                    <?php else: ?>
                                        <span style="color: #3b82f6; font-weight: 500;"><?php _e('Benutzer', 'bewerbungstrainer'); ?></span>
                                    <?php endif; ?>
                                </td>
                                <td>
                                    <?php if (!empty($limit->demo_code)): ?>
                                        <code style="font-size: 14px; font-weight: bold; letter-spacing: 1px;"><?php echo esc_html($limit->demo_code); ?></code>
                                        <br><small style="color: #666;">karriereheld + <?php echo esc_html($limit->demo_code); ?></small>
                                    <?php else: ?>
                                        <?php echo $user_display; ?>
                                    <?php endif; ?>
                                </td>
                                <td>
                                    <strong><?php echo esc_html($limit->monthly_minutes); ?></strong> <?php _e('Min.', 'bewerbungstrainer'); ?>
                                </td>
                                <td>
                                    <?php echo number_format(floatval($limit->minutes_used_this_month), 1, ',', '.'); ?> <?php _e('Min.', 'bewerbungstrainer'); ?>
                                    <div style="background: #e5e7eb; border-radius: 4px; height: 4px; margin-top: 4px;">
                                        <div style="background: <?php echo $percent_used > 80 ? '#ef4444' : ($percent_used > 50 ? '#f59e0b' : '#22c55e'); ?>; width: <?php echo min(100, $percent_used); ?>%; height: 100%; border-radius: 4px;"></div>
                                    </div>
                                </td>
                                <td>
                                    <span style="color: <?php echo $remaining <= 0 ? '#ef4444' : ($remaining < 3 ? '#f59e0b' : '#22c55e'); ?>; font-weight: 500;">
                                        <?php echo number_format(max(0, $remaining), 1, ',', '.'); ?> <?php _e('Min.', 'bewerbungstrainer'); ?>
                                    </span>
                                </td>
                                <td>
                                    <small>
                                        <?php echo date_i18n('d.m.Y', strtotime($period['start'])); ?> -<br>
                                        <?php echo date_i18n('d.m.Y', strtotime($period['end'])); ?>
                                    </small>
                                </td>
                                <td>
                                    <a href="<?php echo wp_nonce_url(admin_url('admin.php?page=bewerbungstrainer-usage-limits&action=reset&id=' . $limit->id), 'reset_limit_' . $limit->id); ?>"
                                       class="button button-small"
                                       onclick="return confirm('Nutzung wirklich zurücksetzen? Alle Nutzungseinträge für diesen Monat werden gelöscht.');"
                                       title="<?php _e('Nutzung auf 0 zurücksetzen', 'bewerbungstrainer'); ?>">
                                        <?php _e('Reset', 'bewerbungstrainer'); ?>
                                    </a>
                                    <a href="<?php echo wp_nonce_url(admin_url('admin.php?page=bewerbungstrainer-usage-limits&action=delete&id=' . $limit->id), 'delete_limit_' . $limit->id); ?>"
                                       class="button button-small button-link-delete"
                                       onclick="return confirm('Limit wirklich löschen?');">
                                        <?php _e('Löschen', 'bewerbungstrainer'); ?>
                                    </a>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>

            <!-- Quick Add Demo Codes -->
            <?php if (!empty($used_demo_codes)): ?>
            <div class="card" style="max-width: 800px; margin-top: 20px;">
                <h2><?php _e('Aktive Demo-Codes', 'bewerbungstrainer'); ?></h2>
                <p class="description"><?php _e('Demo-Codes, die bereits verwendet wurden. Klicken Sie auf einen Code, um ein Limit hinzuzufügen.', 'bewerbungstrainer'); ?></p>
                <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 15px;">
                    <?php foreach ($used_demo_codes as $code): ?>
                        <?php
                        // Check if limit exists for this code
                        $has_limit = false;
                        foreach ($limits as $limit) {
                            if ($limit->demo_code === $code->demo_code) {
                                $has_limit = true;
                                break;
                            }
                        }
                        ?>
                        <button type="button"
                                class="button <?php echo $has_limit ? 'button-disabled' : ''; ?>"
                                <?php echo $has_limit ? 'disabled' : ''; ?>
                                onclick="document.getElementById('identifier_type').value='demo_code'; document.getElementById('user_identifier').value='<?php echo esc_attr($code->demo_code); ?>'; document.getElementById('user_identifier').focus();"
                                title="<?php echo $has_limit ? __('Limit bereits konfiguriert', 'bewerbungstrainer') : esc_attr($code->company_name ?: $code->contact_name ?: $code->demo_code); ?>">
                            <code><?php echo esc_html($code->demo_code); ?></code>
                            <?php if ($has_limit): ?>
                                <span style="color: #22c55e;">&#10003;</span>
                            <?php endif; ?>
                        </button>
                    <?php endforeach; ?>
                </div>
            </div>
            <?php endif; ?>

            <!-- WordPress Users Management -->
            <?php
            // Get WordPress users (exclude demo user 'karriereheld')
            $wp_users = get_users(array(
                'orderby' => 'display_name',
                'order' => 'ASC',
                'number' => 100,
                'exclude' => array(), // Could exclude specific users
            ));

            // Filter out the demo user
            $wp_users = array_filter($wp_users, function($user) {
                return $user->user_login !== 'karriereheld';
            });

            // Build lookup for existing limits by user_id
            $user_limits_lookup = array();
            foreach ($limits as $limit) {
                if (!empty($limit->user_id) && empty($limit->demo_code)) {
                    $user_limits_lookup[$limit->user_id] = $limit;
                }
            }
            ?>

            <?php if (!empty($wp_users)): ?>
            <div class="card" style="margin-top: 20px;">
                <h2><?php _e('WordPress Benutzer verwalten', 'bewerbungstrainer'); ?></h2>
                <p class="description"><?php _e('Hier können Sie Limits für WordPress-Benutzer konfigurieren. Benutzer ohne Limit erhalten den Standard von ', 'bewerbungstrainer'); ?><?php echo self::DEFAULT_MONTHLY_MINUTES; ?> <?php _e('Minuten.', 'bewerbungstrainer'); ?></p>

                <table class="wp-list-table widefat striped" style="margin-top: 15px; table-layout: auto;">
                    <thead>
                        <tr>
                            <th style="width: 40px; white-space: nowrap;"><?php _e('ID', 'bewerbungstrainer'); ?></th>
                            <th style="white-space: nowrap;"><?php _e('Benutzer', 'bewerbungstrainer'); ?></th>
                            <th style="white-space: nowrap;"><?php _e('E-Mail', 'bewerbungstrainer'); ?></th>
                            <th style="width: 140px; white-space: nowrap;"><?php _e('Minuten/Monat', 'bewerbungstrainer'); ?></th>
                            <th style="width: 100px; white-space: nowrap;"><?php _e('Verbraucht', 'bewerbungstrainer'); ?></th>
                            <th style="width: 120px; white-space: nowrap;"><?php _e('Aktion', 'bewerbungstrainer'); ?></th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($wp_users as $wp_user): ?>
                            <?php
                            $existing_limit = isset($user_limits_lookup[$wp_user->ID]) ? $user_limits_lookup[$wp_user->ID] : null;
                            $current_minutes = $existing_limit ? intval($existing_limit->monthly_minutes) : self::DEFAULT_MONTHLY_MINUTES;
                            $used_minutes = $existing_limit ? floatval($existing_limit->minutes_used_this_month) : $this->get_usage_this_period($wp_user->ID, null);
                            $percent_used = $current_minutes > 0 ? ($used_minutes / $current_minutes) * 100 : 0;
                            $color = $percent_used > 80 ? '#ef4444' : ($percent_used > 50 ? '#f59e0b' : '#22c55e');
                            ?>
                            <tr>
                                <td style="vertical-align: middle;"><?php echo esc_html($wp_user->ID); ?></td>
                                <td style="vertical-align: middle; white-space: nowrap;">
                                    <strong style="display: block;"><?php echo esc_html($wp_user->display_name); ?></strong>
                                    <span style="color: #666; font-size: 12px;"><?php echo esc_html($wp_user->user_login); ?></span>
                                </td>
                                <td style="vertical-align: middle; white-space: nowrap;">
                                    <a href="mailto:<?php echo esc_attr($wp_user->user_email); ?>"><?php echo esc_html($wp_user->user_email); ?></a>
                                </td>
                                <td style="vertical-align: middle;">
                                    <form method="post" style="display: inline-flex; align-items: center; gap: 5px; margin: 0;">
                                        <?php wp_nonce_field('save_usage_limit'); ?>
                                        <input type="hidden" name="identifier_type" value="user_id">
                                        <input type="hidden" name="user_identifier" value="<?php echo esc_attr($wp_user->ID); ?>">
                                        <input type="number" name="monthly_minutes" value="<?php echo esc_attr($current_minutes); ?>" min="0" max="1000" style="width: 60px; padding: 4px;">
                                        <button type="submit" name="save_limit" class="button button-small" title="<?php _e('Speichern', 'bewerbungstrainer'); ?>" style="padding: 2px 6px;">
                                            ✓
                                        </button>
                                    </form>
                                </td>
                                <td style="vertical-align: middle; white-space: nowrap;">
                                    <span style="color: <?php echo $color; ?>; font-weight: 500;">
                                        <?php echo number_format($used_minutes, 1, ',', '.'); ?> Min.
                                    </span>
                                </td>
                                <td style="vertical-align: middle; white-space: nowrap;">
                                    <?php if ($existing_limit): ?>
                                        <span style="color: #22c55e; margin-right: 5px;">✓</span>
                                        <a href="<?php echo wp_nonce_url(admin_url('admin.php?page=bewerbungstrainer-usage-limits&action=reset&id=' . $existing_limit->id), 'reset_limit_' . $existing_limit->id); ?>"
                                           class="button button-small"
                                           onclick="return confirm('Nutzung wirklich zurücksetzen?');"
                                           style="padding: 2px 8px;">
                                            Reset
                                        </a>
                                    <?php else: ?>
                                        <span style="color: #94a3b8;">Standard</span>
                                    <?php endif; ?>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
            <?php endif; ?>
        </div>

        <script>
        jQuery(document).ready(function($) {
            $('#identifier_type').on('change', function() {
                var type = $(this).val();
                var $help = $('#identifier_help');
                var $input = $('#user_identifier');

                if (type === 'demo_code') {
                    $help.text('Demo-Code eingeben (z.B. ABC12)');
                    $input.attr('placeholder', 'z.B. ABC12');
                } else {
                    $help.text('WordPress Benutzer-ID eingeben');
                    $input.attr('placeholder', 'z.B. 123');
                }
            });
        });
        </script>
        <?php
    }

    /**
     * Get table names
     *
     * @return array Table names
     */
    public function get_table_names() {
        return array(
            'limits' => $this->table_usage_limits,
            'log' => $this->table_usage_log,
        );
    }
}
