<?php
/**
 * Plugin Name: Bewerbungstrainer
 * Plugin URI: https://github.com/shoukit/Bewerbungstrainer
 * Description: AI-gestützter Bewerbungstrainer für realistische Interview-Vorbereitung mit ElevenLabs Voice AI und Google Gemini Feedback.
 * Version: 1.0.0
 * Author: Shoukit
 * Author URI: https://github.com/shoukit
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: bewerbungstrainer
 * Domain Path: /languages
 * Requires at least: 6.0
 * Requires PHP: 7.4
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('BEWERBUNGSTRAINER_VERSION', '1.0.0');

/**
 * ONE-TIME IMPORT: SprintEins Partner
 * This code runs once and creates the partner, then sets an option to prevent re-running.
 * You can delete this block after the import is complete.
 */
add_action('init', function() {
    // Only run once
    if (get_option('_sprinteins_partner_imported')) {
        return;
    }

    // Check if partner already exists
    $existing = get_posts(array(
        'post_type' => 'whitelabel_partner',
        'meta_key' => '_partner_slug',
        'meta_value' => 'sprinteins',
        'posts_per_page' => 1,
    ));

    if (!empty($existing)) {
        update_option('_sprinteins_partner_imported', true);
        return;
    }

    // SprintEins Branding - Coral/Pink primary color
    $primary_color = '#F0506E';
    $primary_color_hover = '#D94460';
    $primary_color_light = '#FEF2F4';

    $branding = array(
        '--app-bg-color' => 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
        '--sidebar-bg-color' => '#ffffff',
        '--sidebar-text-color' => '#1a1a1a',
        '--sidebar-text-muted' => '#6b7280',
        '--sidebar-active-bg' => $primary_color_light,
        '--sidebar-active-text' => $primary_color,
        '--sidebar-hover-bg' => '#f9fafb',
        '--card-bg-color' => '#ffffff',
        '--primary-accent' => $primary_color,
        '--primary-accent-light' => $primary_color_light,
        '--primary-accent-hover' => $primary_color_hover,
        '--button-gradient' => $primary_color,
        '--button-gradient-hover' => $primary_color_hover,
        '--button-solid' => $primary_color,
        '--button-solid-hover' => $primary_color_hover,
        '--button-text' => '#ffffff',
        '--header-gradient' => 'linear-gradient(135deg, ' . $primary_color . ' 0%, #E8446A 100%)',
        '--header-text' => '#ffffff',
        '--icon-primary' => $primary_color,
        '--icon-secondary' => '#E8446A',
        '--icon-muted' => '#9ca3af',
        '--text-main' => '#1a1a1a',
        '--text-secondary' => '#4b5563',
        '--text-muted' => '#9ca3af',
        '--border-color' => '#e5e7eb',
        '--border-color-light' => '#f3f4f6',
        '--focus-ring' => 'rgba(240, 80, 110, 0.3)',
    );

    // Create the partner
    $post_id = wp_insert_post(array(
        'post_type' => 'whitelabel_partner',
        'post_title' => 'SprintEins',
        'post_status' => 'publish',
        'post_name' => 'sprinteins',
    ));

    if (!is_wp_error($post_id)) {
        update_post_meta($post_id, '_partner_slug', 'sprinteins');
        update_post_meta($post_id, '_partner_branding', $branding);
        update_post_meta($post_id, '_partner_visible_modules', array(
            'dashboard', 'roleplay', 'simulator', 'video_training', 'gym', 'history', 'smart_briefing'
        ));
    }

    // Mark as imported
    update_option('_sprinteins_partner_imported', true);
}, 20);
define('BEWERBUNGSTRAINER_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('BEWERBUNGSTRAINER_PLUGIN_URL', plugin_dir_url(__FILE__));
define('BEWERBUNGSTRAINER_PLUGIN_BASENAME', plugin_basename(__FILE__));

/**
 * Log Gemini prompts to a dedicated prompts.log file
 *
 * @param string $scenario Scenario name (e.g., "SIMULATOR_QUESTIONS", "VIDEO_ANALYSIS")
 * @param string $description Human-readable description of what this prompt does
 * @param string $prompt The actual prompt text
 * @param array $metadata Additional metadata (key-value pairs)
 */
function bewerbungstrainer_log_prompt($scenario, $description, $prompt, $metadata = array()) {
    // Get upload directory for log file
    $upload_dir = wp_upload_dir();
    $log_dir = $upload_dir['basedir'] . '/bewerbungstrainer/logs/';

    // Create directory if it doesn't exist
    if (!file_exists($log_dir)) {
        wp_mkdir_p($log_dir);
        // Add .htaccess to protect logs
        file_put_contents($log_dir . '.htaccess', "Deny from all\n");
    }

    $log_file = $log_dir . 'prompts.log';
    $separator = str_repeat('=', 80);
    $timestamp = date('Y-m-d H:i:s');

    $log_content = "\n" . $separator . "\n";
    $log_content .= "🤖 GEMINI PROMPT DEBUG - " . $scenario . "\n";
    $log_content .= "📅 " . $timestamp . "\n";
    $log_content .= $separator . "\n";
    $log_content .= "📋 SZENARIO: " . $description . "\n";
    $log_content .= $separator . "\n";

    // Log metadata
    if (!empty($metadata)) {
        $log_content .= "📊 METADATA:\n";
        foreach ($metadata as $key => $value) {
            if (is_string($value) && strlen($value) > 200) {
                $log_content .= "   " . $key . ": " . substr($value, 0, 200) . "... (" . strlen($value) . " chars)\n";
            } else {
                $log_content .= "   " . $key . ": " . (is_array($value) ? json_encode($value, JSON_UNESCAPED_UNICODE) : $value) . "\n";
            }
        }
        $log_content .= $separator . "\n";
    }

    // Log prompt
    $log_content .= "📝 PROMPT:\n";
    if (strlen($prompt) > 8000) {
        $log_content .= substr($prompt, 0, 4000) . "\n";
        $log_content .= "... [TRUNCATED - " . strlen($prompt) . " total chars] ...\n";
        $log_content .= substr($prompt, -4000) . "\n";
    } else {
        $log_content .= $prompt . "\n";
    }

    $log_content .= $separator . "\n\n";

    // Append to log file
    file_put_contents($log_file, $log_content, FILE_APPEND | LOCK_EX);

    // Also log to error_log for immediate visibility
    error_log("[GEMINI PROMPT] " . $scenario . " - " . $description . " (see prompts.log for full details)");
}

/**
 * Log Gemini response to the prompts.log file
 *
 * @param string $scenario Scenario name (e.g., "SIMULATOR_QUESTIONS", "VIDEO_ANALYSIS")
 * @param string $response The response text from Gemini
 * @param bool $is_error Whether this is an error response
 */
function bewerbungstrainer_log_response($scenario, $response, $is_error = false) {
    // Get upload directory for log file
    $upload_dir = wp_upload_dir();
    $log_dir = $upload_dir['basedir'] . '/bewerbungstrainer/logs/';

    // Create directory if it doesn't exist
    if (!file_exists($log_dir)) {
        wp_mkdir_p($log_dir);
        // Add .htaccess to protect logs
        file_put_contents($log_dir . '.htaccess', "Deny from all\n");
    }

    $log_file = $log_dir . 'prompts.log';
    $separator = str_repeat('=', 80);
    $timestamp = date('Y-m-d H:i:s');

    $status_icon = $is_error ? '❌' : '✅';
    $status_text = $is_error ? 'ERROR RESPONSE' : 'RESPONSE';

    $log_content = $separator . "\n";
    $log_content .= $status_icon . " GEMINI " . $status_text . " - " . $scenario . "\n";
    $log_content .= "📅 " . $timestamp . "\n";
    $log_content .= $separator . "\n";

    // Log response
    $log_content .= "📤 RESPONSE:\n";
    if (strlen($response) > 8000) {
        $log_content .= substr($response, 0, 4000) . "\n";
        $log_content .= "... [TRUNCATED - " . strlen($response) . " total chars] ...\n";
        $log_content .= substr($response, -4000) . "\n";
    } else {
        $log_content .= $response . "\n";
    }

    $log_content .= $separator . "\n\n";

    // Append to log file
    file_put_contents($log_file, $log_content, FILE_APPEND | LOCK_EX);

    // Also log to error_log for immediate visibility
    $log_type = $is_error ? 'ERROR' : 'RESPONSE';
    error_log("[GEMINI " . $log_type . "] " . $scenario . " - " . strlen($response) . " chars (see prompts.log for full details)");
}

/**
 * Main Bewerbungstrainer Plugin Class
 */
class Bewerbungstrainer_Plugin {

    /**
     * Instance of this class
     */
    private static $instance = null;

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
        $this->load_dependencies();
        $this->init_hooks();
    }

    /**
     * Load required dependencies
     */
    private function load_dependencies() {
        // Load base classes first
        require_once BEWERBUNGSTRAINER_PLUGIN_DIR . 'includes/class-database.php';
        require_once BEWERBUNGSTRAINER_PLUGIN_DIR . 'includes/class-audio-handler.php';
        require_once BEWERBUNGSTRAINER_PLUGIN_DIR . 'includes/class-video-handler.php';
        require_once BEWERBUNGSTRAINER_PLUGIN_DIR . 'includes/class-pdf-exporter.php';
        require_once BEWERBUNGSTRAINER_PLUGIN_DIR . 'includes/class-gemini-handler.php';
        require_once BEWERBUNGSTRAINER_PLUGIN_DIR . 'includes/class-roleplay-scenarios.php';

        // Load Simulator classes
        require_once BEWERBUNGSTRAINER_PLUGIN_DIR . 'includes/class-simulator-database.php';
        require_once BEWERBUNGSTRAINER_PLUGIN_DIR . 'includes/class-simulator-api.php';
        require_once BEWERBUNGSTRAINER_PLUGIN_DIR . 'includes/class-simulator-admin.php';

        // Load Game/Rhetorik-Gym classes
        require_once BEWERBUNGSTRAINER_PLUGIN_DIR . 'includes/class-game-database.php';
        require_once BEWERBUNGSTRAINER_PLUGIN_DIR . 'includes/class-game-api.php';

        // Load Video Training classes
        require_once BEWERBUNGSTRAINER_PLUGIN_DIR . 'includes/class-video-training-database.php';
        require_once BEWERBUNGSTRAINER_PLUGIN_DIR . 'includes/class-video-training-api.php';
        require_once BEWERBUNGSTRAINER_PLUGIN_DIR . 'includes/class-video-training-admin.php';

        // Load Smart Briefing classes
        require_once BEWERBUNGSTRAINER_PLUGIN_DIR . 'includes/class-smartbriefing-database.php';
        require_once BEWERBUNGSTRAINER_PLUGIN_DIR . 'includes/class-smartbriefing-api.php';
        require_once BEWERBUNGSTRAINER_PLUGIN_DIR . 'includes/class-smartbriefing-admin.php';

        // Load White-Label Partners class
        require_once BEWERBUNGSTRAINER_PLUGIN_DIR . 'includes/class-whitelabel-partners.php';

        // Load Demo Codes class
        require_once BEWERBUNGSTRAINER_PLUGIN_DIR . 'includes/class-demo-codes.php';

        // Load Usage Limits class
        require_once BEWERBUNGSTRAINER_PLUGIN_DIR . 'includes/class-usage-limits.php';

        // Load Disclaimer class
        require_once BEWERBUNGSTRAINER_PLUGIN_DIR . 'includes/class-disclaimer.php';

        // Load Corporate Interview API (HTTP-based fallback for WebSocket-blocked environments)
        require_once BEWERBUNGSTRAINER_PLUGIN_DIR . 'includes/class-corporate-interview-api.php';

        // Load API class after its dependencies
        require_once BEWERBUNGSTRAINER_PLUGIN_DIR . 'includes/class-api.php';
        require_once BEWERBUNGSTRAINER_PLUGIN_DIR . 'includes/class-shortcodes.php';
    }

    /**
     * Initialize WordPress hooks
     */
    private function init_hooks() {
        // Activation/Deactivation hooks
        register_activation_hook(__FILE__, array($this, 'activate'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));

        // Initialize components
        add_action('plugins_loaded', array($this, 'init'));

        // Add main admin menu (priority 9 to ensure it runs before sub-menus)
        add_action('admin_menu', array($this, 'add_admin_menu'), 9);

        // Remove duplicate submenu entry (priority 999 to run after all submenus are added)
        add_action('admin_menu', array($this, 'remove_duplicate_submenu'), 999);

        // Increase upload limits for video training API
        add_filter('upload_size_limit', array($this, 'increase_upload_size_limit'));

        // Try to increase PHP limits for video uploads
        add_action('rest_api_init', array($this, 'set_video_upload_limits'));

        // Enqueue scripts and styles
        add_action('wp_enqueue_scripts', array($this, 'enqueue_frontend_assets'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_assets'));
    }

    /**
     * Add main admin menu for Bewerbungstrainer
     * Sub-menus are added by individual admin classes
     */
    public function add_admin_menu() {
        add_menu_page(
            __('Karriereheld', 'bewerbungstrainer'),
            __('Karriereheld', 'bewerbungstrainer'),
            'manage_options',
            'bewerbungstrainer',
            '__return_null',
            'dashicons-welcome-learn-more',
            30
        );
    }

    /**
     * Remove duplicate "Karriereheld" submenu entry
     */
    public function remove_duplicate_submenu() {
        remove_submenu_page('bewerbungstrainer', 'bewerbungstrainer');
    }

    /**
     * Render the main admin dashboard page
     */
    public function render_admin_dashboard() {
        ?>
        <div class="wrap">
            <h1><?php _e('Bewerbungstrainer', 'bewerbungstrainer'); ?></h1>
            <p><?php _e('Willkommen beim Bewerbungstrainer! Wählen Sie links eine der Verwaltungsoptionen.', 'bewerbungstrainer'); ?></p>

            <div class="card" style="max-width: 600px; margin-top: 20px;">
                <h2><?php _e('Module', 'bewerbungstrainer'); ?></h2>
                <ul style="list-style: disc; margin-left: 20px;">
                    <li><strong><?php _e('Szenario-Training', 'bewerbungstrainer'); ?></strong> - <?php _e('Verwalten Sie strukturierte Trainingsszenarien mit Fragen und Feedback.', 'bewerbungstrainer'); ?></li>
                    <li><strong><?php _e('Video Training', 'bewerbungstrainer'); ?></strong> - <?php _e('Verwalten Sie Video-Aufnahme-Szenarien für visuelles Training.', 'bewerbungstrainer'); ?></li>
                    <li><strong><?php _e('Smart Briefing', 'bewerbungstrainer'); ?></strong> - <?php _e('KI-gestützte Vorbereitungs-Dossiers für Gespräche und Verhandlungen.', 'bewerbungstrainer'); ?></li>
                </ul>
            </div>
        </div>
        <?php
    }

    /**
     * Plugin activation
     */
    public function activate() {
        // Create database tables
        Bewerbungstrainer_Database::create_tables();

        // Create simulator database tables
        Bewerbungstrainer_Simulator_Database::create_tables();

        // Create game database tables
        Bewerbungstrainer_Game_Database::create_tables();

        // Create video training database tables
        Bewerbungstrainer_Video_Training_Database::create_tables();

        // Create smart briefing database tables
        Bewerbungstrainer_SmartBriefing_Database::create_tables();

        // Create demo codes table
        Bewerbungstrainer_Demo_Codes::create_tables();

        // Create usage limits table
        Bewerbungstrainer_Usage_Limits::create_tables();

        // Create disclaimer tables
        Bewerbungstrainer_Disclaimer::create_tables();

        // Create upload directory for audio files
        $upload_dir = wp_upload_dir();
        $audio_dir = $upload_dir['basedir'] . '/bewerbungstrainer/audio';

        if (!file_exists($audio_dir)) {
            wp_mkdir_p($audio_dir);

            // Add .htaccess for security
            $htaccess_content = "Options -Indexes\n";
            $htaccess_content .= "<FilesMatch '\.(mp3|wav|ogg)$'>\n";
            $htaccess_content .= "    Order Allow,Deny\n";
            $htaccess_content .= "    Allow from all\n";
            $htaccess_content .= "</FilesMatch>\n";
            file_put_contents($audio_dir . '/.htaccess', $htaccess_content);
        }

        // Create upload directory for videos
        $video_dir = $upload_dir['basedir'] . '/bewerbungstrainer/videos';
        if (!file_exists($video_dir)) {
            wp_mkdir_p($video_dir);

            // Add .htaccess for security
            $htaccess_content = "Options -Indexes\n";
            $htaccess_content .= "<FilesMatch '\.(mp4|webm|ogv|mov|avi)$'>\n";
            $htaccess_content .= "    Order Allow,Deny\n";
            $htaccess_content .= "    Allow from all\n";
            $htaccess_content .= "</FilesMatch>\n";
            file_put_contents($video_dir . '/.htaccess', $htaccess_content);
        }

        // Create upload directory for documents
        $documents_dir = $upload_dir['basedir'] . '/bewerbungstrainer-documents';
        if (!file_exists($documents_dir)) {
            wp_mkdir_p($documents_dir);
        }

        // Create PDF export directory
        $pdfs_dir = $upload_dir['basedir'] . '/bewerbungstrainer-pdfs';
        if (!file_exists($pdfs_dir)) {
            wp_mkdir_p($pdfs_dir);
        }

        // Import initial partner configurations (only runs once)
        Bewerbungstrainer_Whitelabel_Partners::import_initial_partners();

        // Create upload directory for simulator audio
        $simulator_dir = $upload_dir['basedir'] . '/bewerbungstrainer/simulator';
        if (!file_exists($simulator_dir)) {
            wp_mkdir_p($simulator_dir);

            // Add .htaccess for security
            $htaccess_content = "Options -Indexes\n";
            $htaccess_content .= "<FilesMatch '\.(webm|mp3|wav|ogg)$'>\n";
            $htaccess_content .= "    Order Allow,Deny\n";
            $htaccess_content .= "    Allow from all\n";
            $htaccess_content .= "</FilesMatch>\n";
            file_put_contents($simulator_dir . '/.htaccess', $htaccess_content);
        }

        // Set default options
        add_option('bewerbungstrainer_version', BEWERBUNGSTRAINER_VERSION);

        // Flush rewrite rules
        flush_rewrite_rules();
    }

    /**
     * Plugin deactivation
     */
    public function deactivate() {
        // Flush rewrite rules
        flush_rewrite_rules();
    }

    /**
     * Increase WordPress upload size limit for video uploads
     *
     * @param int $bytes Current limit in bytes
     * @return int New limit in bytes (500MB)
     */
    public function increase_upload_size_limit($bytes) {
        return 524288000; // 500 MB
    }

    /**
     * Set PHP limits for video uploads
     * Note: These may be overridden by server configuration (nginx, .htaccess)
     */
    public function set_video_upload_limits() {
        // Only apply to video-training API endpoints
        $request_uri = isset($_SERVER['REQUEST_URI']) ? $_SERVER['REQUEST_URI'] : '';
        if (strpos($request_uri, '/video-training/') !== false) {
            // Try to increase PHP limits (may not work on all servers)
            @ini_set('upload_max_filesize', '500M');
            @ini_set('post_max_size', '512M');
            @ini_set('max_execution_time', '600');
            @ini_set('max_input_time', '600');
            @ini_set('memory_limit', '512M');
        }
    }

    /**
     * Initialize plugin components
     */
    public function init() {
        // Initialize components for all users (logged in or not)
        // This allows non-logged-in users to use the app with limited features

        // Initialize database
        Bewerbungstrainer_Database::get_instance();

        // Initialize roleplay scenarios
        Bewerbungstrainer_Roleplay_Scenarios::get_instance();

        // Initialize REST API
        Bewerbungstrainer_API::get_instance();

        // Initialize Simulator
        Bewerbungstrainer_Simulator_Database::get_instance();
        Bewerbungstrainer_Simulator_API::get_instance();

        // Initialize Simulator Admin (only in admin area)
        if (is_admin()) {
            Bewerbungstrainer_Simulator_Admin::get_instance();
        }

        // Initialize Game/Rhetorik-Gym
        Bewerbungstrainer_Game_Database::get_instance();
        Bewerbungstrainer_Game_API::get_instance();

        // Initialize Video Training
        Bewerbungstrainer_Video_Training_Database::get_instance();
        Bewerbungstrainer_Video_Training_API::get_instance();

        // Initialize Video Training Admin (only in admin area)
        if (is_admin()) {
            Bewerbungstrainer_Video_Training_Admin::get_instance();
        }

        // Initialize Smart Briefing
        Bewerbungstrainer_SmartBriefing_Database::get_instance();
        Bewerbungstrainer_SmartBriefing_API::get_instance();

        // Initialize Smart Briefing Admin (only in admin area)
        if (is_admin()) {
            Bewerbungstrainer_SmartBriefing_Admin::get_instance();
        }

        // Initialize White-Label Partners
        Bewerbungstrainer_Whitelabel_Partners::get_instance();

        // Initialize Demo Codes
        Bewerbungstrainer_Demo_Codes::get_instance();

        // Initialize Usage Limits
        Bewerbungstrainer_Usage_Limits::get_instance();

        // Initialize Disclaimer
        Bewerbungstrainer_Disclaimer::get_instance();

        // Initialize audio handler
        Bewerbungstrainer_Audio_Handler::get_instance();

        // Initialize shortcodes
        Bewerbungstrainer_Shortcodes::get_instance();

        // Load text domain for translations
        load_plugin_textdomain('bewerbungstrainer', false, dirname(BEWERBUNGSTRAINER_PLUGIN_BASENAME) . '/languages');
    }

    /**
     * Enqueue frontend assets
     */
    public function enqueue_frontend_assets() {
        // Check if shortcode is present on the page
        global $post;
        if (!is_a($post, 'WP_Post') ||
            (!has_shortcode($post->post_content, 'bewerbungstrainer_interview') &&
             !has_shortcode($post->post_content, 'bewerbungstrainer_uebungen') &&
             !has_shortcode($post->post_content, 'bewerbungstrainer_dokumente'))) {
            return;
        }

        // Enqueue React app (built version)
        $asset_file = BEWERBUNGSTRAINER_PLUGIN_DIR . 'dist/assets/index.js';
        $css_file = BEWERBUNGSTRAINER_PLUGIN_DIR . 'dist/assets/wordpress-api.css';

        // Check if build files exist
        if (!file_exists($asset_file) || !file_exists($css_file)) {
            // Show error message if build files are missing
            add_action('wp_footer', function() {
                echo '<script>console.error("Bewerbungstrainer: Build files missing! Please run: npm install && npm run build");</script>';
            });
            return;
        }

        // Enqueue CSS first
        wp_enqueue_style(
            'bewerbungstrainer-app',
            BEWERBUNGSTRAINER_PLUGIN_URL . 'dist/assets/wordpress-api.css',
            array(),
            filemtime($css_file)
        );

        // Enqueue JavaScript with wp-i18n dependency to prevent setLocaleData errors
        wp_enqueue_script(
            'bewerbungstrainer-app',
            BEWERBUNGSTRAINER_PLUGIN_URL . 'dist/assets/index.js',
            array('wp-i18n'),
            filemtime($asset_file),
            true
        );

        // Pass data to JavaScript - handle both logged-in and non-logged-in users
        $current_user_id = get_current_user_id();
        $is_logged_in = is_user_logged_in();

        wp_localize_script('bewerbungstrainer-app', 'bewerbungstrainerConfig', array(
            'apiUrl' => rest_url('bewerbungstrainer/v1'),
            'nonce' => wp_create_nonce('wp_rest'),
            'currentUser' => array(
                'id' => $current_user_id,
                'name' => $is_logged_in ? wp_get_current_user()->display_name : '',
                'firstName' => $is_logged_in ? get_user_meta($current_user_id, 'first_name', true) : '',
            ),
            'uploadsUrl' => wp_upload_dir()['baseurl'] . '/bewerbungstrainer',
            'elevenlabsAgentId' => get_option('bewerbungstrainer_elevenlabs_agent_id', ''),
            'elevenlabsApiKey' => get_option('bewerbungstrainer_elevenlabs_api_key', ''),
            'geminiApiKey' => get_option('bewerbungstrainer_gemini_api_key', ''),
        ));

        // Add type="module" to script tag for ES6 module support
        add_filter('script_loader_tag', function($tag, $handle, $src) {
            if ('bewerbungstrainer-app' === $handle) {
                $tag = '<script type="module" src="' . esc_url($src) . '"></script>';
            }
            return $tag;
        }, 10, 3);
    }

    /**
     * Enqueue admin assets
     */
    public function enqueue_admin_assets($hook) {
        // Only load on plugin settings page
        if ('toplevel_page_bewerbungstrainer' !== $hook) {
            return;
        }

        // Admin styles
        wp_enqueue_style(
            'bewerbungstrainer-admin',
            BEWERBUNGSTRAINER_PLUGIN_URL . 'assets/css/admin.css',
            array(),
            BEWERBUNGSTRAINER_VERSION
        );
    }
}

/**
 * Initialize the plugin
 */
function bewerbungstrainer_init() {
    return Bewerbungstrainer_Plugin::get_instance();
}

// Start the plugin
bewerbungstrainer_init();
