<?php
/**
 * Settings Admin Page
 *
 * Provides WordPress admin interface for configuring API keys and plugin settings
 *
 * @package Bewerbungstrainer
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Settings Admin Class
 */
class Bewerbungstrainer_Settings_Admin {

    /**
     * Instance of this class
     */
    private static $instance = null;

    /**
     * Option group name
     */
    const OPTION_GROUP = 'bewerbungstrainer_settings';

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
        $this->init_hooks();
    }

    /**
     * Initialize hooks
     */
    private function init_hooks() {
        add_action('admin_menu', array($this, 'add_admin_menu'), 100); // Late priority to be at bottom
        add_action('admin_init', array($this, 'register_settings'));
    }

    /**
     * Add admin menu
     */
    public function add_admin_menu() {
        add_submenu_page(
            'bewerbungstrainer',
            __('Einstellungen', 'bewerbungstrainer'),
            __('Einstellungen', 'bewerbungstrainer'),
            'manage_options',
            'bewerbungstrainer-settings',
            array($this, 'render_settings_page'),
            99 // Last position
        );
    }

    /**
     * Register settings
     */
    public function register_settings() {
        // Register setting group
        register_setting(
            self::OPTION_GROUP,
            'bewerbungstrainer_gemini_api_key',
            array(
                'type' => 'string',
                'sanitize_callback' => 'sanitize_text_field',
                'default' => '',
            )
        );

        register_setting(
            self::OPTION_GROUP,
            'bewerbungstrainer_openai_api_key',
            array(
                'type' => 'string',
                'sanitize_callback' => 'sanitize_text_field',
                'default' => '',
            )
        );

        register_setting(
            self::OPTION_GROUP,
            'bewerbungstrainer_elevenlabs_api_key',
            array(
                'type' => 'string',
                'sanitize_callback' => 'sanitize_text_field',
                'default' => '',
            )
        );

        register_setting(
            self::OPTION_GROUP,
            'bewerbungstrainer_elevenlabs_agent_id',
            array(
                'type' => 'string',
                'sanitize_callback' => 'sanitize_text_field',
                'default' => '',
            )
        );

        // Google Gemini Section
        add_settings_section(
            'bewerbungstrainer_gemini_section',
            __('Google Gemini', 'bewerbungstrainer'),
            array($this, 'render_gemini_section'),
            'bewerbungstrainer-settings'
        );

        add_settings_field(
            'bewerbungstrainer_gemini_api_key',
            __('API Key', 'bewerbungstrainer'),
            array($this, 'render_api_key_field'),
            'bewerbungstrainer-settings',
            'bewerbungstrainer_gemini_section',
            array(
                'option_name' => 'bewerbungstrainer_gemini_api_key',
                'description' => __('Google AI Studio API Key für Feedback-Generierung und Analyse.', 'bewerbungstrainer'),
                'placeholder' => 'AIza...',
            )
        );

        // OpenAI Section
        add_settings_section(
            'bewerbungstrainer_openai_section',
            __('OpenAI (Whisper)', 'bewerbungstrainer'),
            array($this, 'render_openai_section'),
            'bewerbungstrainer-settings'
        );

        add_settings_field(
            'bewerbungstrainer_openai_api_key',
            __('API Key', 'bewerbungstrainer'),
            array($this, 'render_api_key_field'),
            'bewerbungstrainer-settings',
            'bewerbungstrainer_openai_section',
            array(
                'option_name' => 'bewerbungstrainer_openai_api_key',
                'description' => __('OpenAI API Key für Whisper Transkription (optional, verbessert Genauigkeit).', 'bewerbungstrainer'),
                'placeholder' => 'sk-...',
            )
        );

        // ElevenLabs Section
        add_settings_section(
            'bewerbungstrainer_elevenlabs_section',
            __('ElevenLabs', 'bewerbungstrainer'),
            array($this, 'render_elevenlabs_section'),
            'bewerbungstrainer-settings'
        );

        add_settings_field(
            'bewerbungstrainer_elevenlabs_api_key',
            __('API Key', 'bewerbungstrainer'),
            array($this, 'render_api_key_field'),
            'bewerbungstrainer-settings',
            'bewerbungstrainer_elevenlabs_section',
            array(
                'option_name' => 'bewerbungstrainer_elevenlabs_api_key',
                'description' => __('ElevenLabs API Key für Conversational AI (Live-Simulationen).', 'bewerbungstrainer'),
                'placeholder' => 'xi_...',
            )
        );

        add_settings_field(
            'bewerbungstrainer_elevenlabs_agent_id',
            __('Agent ID', 'bewerbungstrainer'),
            array($this, 'render_text_field'),
            'bewerbungstrainer-settings',
            'bewerbungstrainer_elevenlabs_section',
            array(
                'option_name' => 'bewerbungstrainer_elevenlabs_agent_id',
                'description' => __('ElevenLabs Conversational AI Agent ID.', 'bewerbungstrainer'),
                'placeholder' => 'agent_...',
            )
        );
    }

    /**
     * Render Gemini section description
     */
    public function render_gemini_section() {
        echo '<p>' . __('Google Gemini wird für Feedback-Generierung, Audio-Analyse und Smart Briefings verwendet.', 'bewerbungstrainer') . '</p>';
        echo '<p><a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener">' . __('API Key erstellen &rarr;', 'bewerbungstrainer') . '</a></p>';
    }

    /**
     * Render OpenAI section description
     */
    public function render_openai_section() {
        echo '<p>' . __('OpenAI Whisper wird für präzise Audio-Transkription verwendet (optional).', 'bewerbungstrainer') . '</p>';
        echo '<p><a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener">' . __('API Key erstellen &rarr;', 'bewerbungstrainer') . '</a></p>';
    }

    /**
     * Render ElevenLabs section description
     */
    public function render_elevenlabs_section() {
        echo '<p>' . __('ElevenLabs wird für die Live-Simulationen mit Sprach-KI verwendet.', 'bewerbungstrainer') . '</p>';
        echo '<p><a href="https://elevenlabs.io/app/settings/api-keys" target="_blank" rel="noopener">' . __('API Key erstellen &rarr;', 'bewerbungstrainer') . '</a></p>';
    }

    /**
     * Render API key field (password type with reveal toggle)
     */
    public function render_api_key_field($args) {
        $option_name = $args['option_name'];
        $value = get_option($option_name, '');
        $description = isset($args['description']) ? $args['description'] : '';
        $placeholder = isset($args['placeholder']) ? $args['placeholder'] : '';
        $field_id = esc_attr($option_name);

        // Mask the value for display (show first 8 and last 4 chars)
        $masked_value = '';
        if (!empty($value)) {
            if (strlen($value) > 12) {
                $masked_value = substr($value, 0, 8) . '...' . substr($value, -4);
            } else {
                $masked_value = str_repeat('*', strlen($value));
            }
        }

        ?>
        <div class="bewerbungstrainer-api-key-field">
            <input
                type="password"
                id="<?php echo $field_id; ?>"
                name="<?php echo esc_attr($option_name); ?>"
                value="<?php echo esc_attr($value); ?>"
                class="regular-text"
                placeholder="<?php echo esc_attr($placeholder); ?>"
                autocomplete="off"
            />
            <button type="button" class="button button-secondary bewerbungstrainer-toggle-key" data-target="<?php echo $field_id; ?>">
                <span class="dashicons dashicons-visibility"></span>
            </button>
            <?php if (!empty($value)): ?>
                <span class="bewerbungstrainer-key-status configured">
                    <span class="dashicons dashicons-yes-alt"></span>
                    <?php _e('Konfiguriert', 'bewerbungstrainer'); ?>
                </span>
            <?php else: ?>
                <span class="bewerbungstrainer-key-status not-configured">
                    <span class="dashicons dashicons-warning"></span>
                    <?php _e('Nicht konfiguriert', 'bewerbungstrainer'); ?>
                </span>
            <?php endif; ?>
        </div>
        <?php if ($description): ?>
            <p class="description"><?php echo esc_html($description); ?></p>
        <?php endif; ?>
        <?php
    }

    /**
     * Render regular text field
     */
    public function render_text_field($args) {
        $option_name = $args['option_name'];
        $value = get_option($option_name, '');
        $description = isset($args['description']) ? $args['description'] : '';
        $placeholder = isset($args['placeholder']) ? $args['placeholder'] : '';

        ?>
        <input
            type="text"
            id="<?php echo esc_attr($option_name); ?>"
            name="<?php echo esc_attr($option_name); ?>"
            value="<?php echo esc_attr($value); ?>"
            class="regular-text"
            placeholder="<?php echo esc_attr($placeholder); ?>"
        />
        <?php if ($description): ?>
            <p class="description"><?php echo esc_html($description); ?></p>
        <?php endif; ?>
        <?php
    }

    /**
     * Render settings page
     */
    public function render_settings_page() {
        // Check user capabilities
        if (!current_user_can('manage_options')) {
            return;
        }

        // Check if settings were saved
        if (isset($_GET['settings-updated'])) {
            add_settings_error(
                'bewerbungstrainer_messages',
                'bewerbungstrainer_message',
                __('Einstellungen gespeichert.', 'bewerbungstrainer'),
                'updated'
            );
        }

        ?>
        <div class="wrap">
            <h1><?php echo esc_html(get_admin_page_title()); ?></h1>

            <?php settings_errors('bewerbungstrainer_messages'); ?>

            <style>
                .bewerbungstrainer-api-key-field {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    flex-wrap: wrap;
                }
                .bewerbungstrainer-api-key-field input[type="password"],
                .bewerbungstrainer-api-key-field input[type="text"] {
                    font-family: monospace;
                }
                .bewerbungstrainer-toggle-key {
                    padding: 4px 8px !important;
                    min-height: 30px;
                }
                .bewerbungstrainer-toggle-key .dashicons {
                    font-size: 16px;
                    width: 16px;
                    height: 16px;
                    line-height: 1;
                }
                .bewerbungstrainer-key-status {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: 500;
                }
                .bewerbungstrainer-key-status.configured {
                    background: #d1fae5;
                    color: #065f46;
                }
                .bewerbungstrainer-key-status.not-configured {
                    background: #fef3c7;
                    color: #92400e;
                }
                .bewerbungstrainer-key-status .dashicons {
                    font-size: 14px;
                    width: 14px;
                    height: 14px;
                }
                .form-table th {
                    width: 150px;
                }
                h2 {
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #ccc;
                }
                h2:first-of-type {
                    border-top: none;
                    margin-top: 20px;
                    padding-top: 0;
                }
            </style>

            <form action="options.php" method="post">
                <?php
                settings_fields(self::OPTION_GROUP);
                do_settings_sections('bewerbungstrainer-settings');
                submit_button(__('Einstellungen speichern', 'bewerbungstrainer'));
                ?>
            </form>

            <script>
                document.addEventListener('DOMContentLoaded', function() {
                    // Toggle password visibility
                    document.querySelectorAll('.bewerbungstrainer-toggle-key').forEach(function(button) {
                        button.addEventListener('click', function() {
                            var targetId = this.getAttribute('data-target');
                            var input = document.getElementById(targetId);
                            var icon = this.querySelector('.dashicons');

                            if (input.type === 'password') {
                                input.type = 'text';
                                icon.classList.remove('dashicons-visibility');
                                icon.classList.add('dashicons-hidden');
                            } else {
                                input.type = 'password';
                                icon.classList.remove('dashicons-hidden');
                                icon.classList.add('dashicons-visibility');
                            }
                        });
                    });
                });
            </script>
        </div>
        <?php
    }
}
