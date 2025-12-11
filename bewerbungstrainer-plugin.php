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
define('BEWERBUNGSTRAINER_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('BEWERBUNGSTRAINER_PLUGIN_URL', plugin_dir_url(__FILE__));
define('BEWERBUNGSTRAINER_PLUGIN_BASENAME', plugin_basename(__FILE__));

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

        // Load White-Label Partners class
        require_once BEWERBUNGSTRAINER_PLUGIN_DIR . 'includes/class-whitelabel-partners.php';

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

        // Increase upload limits for video training API
        add_filter('upload_size_limit', array($this, 'increase_upload_size_limit'));

        // Try to increase PHP limits for video uploads
        add_action('rest_api_init', array($this, 'set_video_upload_limits'));

        // Enqueue scripts and styles
        add_action('wp_enqueue_scripts', array($this, 'enqueue_frontend_assets'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_assets'));
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

        // Initialize White-Label Partners
        Bewerbungstrainer_Whitelabel_Partners::get_instance();

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
