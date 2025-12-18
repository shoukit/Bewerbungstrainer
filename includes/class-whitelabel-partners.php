<?php
/**
 * White-Label Partners Management
 *
 * Handles Custom Post Type for white-label partners with branding options
 * and provides REST API endpoints for partner configuration.
 *
 * @package Bewerbungstrainer
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

/**
 * White-Label Partners Class
 */
class Bewerbungstrainer_Whitelabel_Partners {

    /**
     * Instance of this class
     */
    private static $instance = null;

    /**
     * Post type name
     */
    private $post_type = 'whitelabel_partner';

    /**
     * API namespace
     */
    private $api_namespace = 'karriereheld/v1';

    /**
     * Default branding configuration (matches React DEFAULT_BRANDING)
     */
    private $default_branding = array(
        '--app-bg-color' => 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 50%, #f0fdfa 100%)',
        '--sidebar-bg-color' => '#ffffff',
        '--sidebar-text-color' => '#0f172a',
        '--sidebar-text-muted' => '#94a3b8',
        '--sidebar-active-bg' => '#E8F4F8',
        '--sidebar-active-text' => '#2D6485',
        '--sidebar-hover-bg' => '#f8fafc',
        '--card-bg-color' => '#ffffff',
        '--primary-accent' => '#3A7FA7',
        '--primary-accent-light' => '#E8F4F8',
        '--primary-accent-hover' => '#2D6485',
        '--button-gradient' => 'linear-gradient(135deg, #3A7FA7 0%, #3DA389 100%)',
        '--button-gradient-hover' => 'linear-gradient(135deg, #2D6485 0%, #2E8A72 100%)',
        '--button-solid' => '#3A7FA7',
        '--button-solid-hover' => '#2D6485',
        '--button-text' => '#ffffff',
        '--header-gradient' => 'linear-gradient(135deg, #3A7FA7 0%, #3DA389 100%)',
        '--header-text' => '#ffffff',
        '--icon-primary' => '#3A7FA7',
        '--icon-secondary' => '#3DA389',
        '--icon-muted' => '#94a3b8',
        '--text-main' => '#0f172a',
        '--text-secondary' => '#475569',
        '--text-muted' => '#94a3b8',
        '--border-color' => '#e2e8f0',
        '--border-color-light' => '#f1f5f9',
        '--focus-ring' => 'rgba(58, 127, 167, 0.3)',
    );

    /**
     * Branding field labels (German)
     */
    private $branding_labels = array(
        '--app-bg-color' => 'App Hintergrund',
        '--sidebar-bg-color' => 'Sidebar Hintergrund',
        '--sidebar-text-color' => 'Sidebar Text',
        '--sidebar-text-muted' => 'Sidebar Text (gedämpft)',
        '--sidebar-active-bg' => 'Sidebar Aktiv Hintergrund',
        '--sidebar-active-text' => 'Sidebar Aktiv Text',
        '--sidebar-hover-bg' => 'Sidebar Hover Hintergrund',
        '--card-bg-color' => 'Karten Hintergrund',
        '--primary-accent' => 'Primärakzent',
        '--primary-accent-light' => 'Primärakzent (hell)',
        '--primary-accent-hover' => 'Primärakzent (hover)',
        '--button-gradient' => 'Button Gradient',
        '--button-gradient-hover' => 'Button Gradient (hover)',
        '--button-solid' => 'Button Solid',
        '--button-solid-hover' => 'Button Solid (hover)',
        '--button-text' => 'Button Text',
        '--header-gradient' => 'Header Gradient',
        '--header-text' => 'Header Text',
        '--icon-primary' => 'Icon Primär',
        '--icon-secondary' => 'Icon Sekundär',
        '--icon-muted' => 'Icon (gedämpft)',
        '--text-main' => 'Text Hauptfarbe',
        '--text-secondary' => 'Text Sekundär',
        '--text-muted' => 'Text (gedämpft)',
        '--border-color' => 'Rahmenfarbe',
        '--border-color-light' => 'Rahmenfarbe (hell)',
        '--focus-ring' => 'Focus Ring',
    );

    /**
     * Available modules for partner filtering
     */
    private $available_modules = array(
        'dashboard' => 'Dashboard',
        'roleplay' => 'Live-Simulation (Roleplay)',
        'simulator' => 'Szenario-Training (Simulator)',
        'video_training' => 'Wirkungs-Analyse',
        'gym' => 'Rhetorik-Gym (Game)',
        'history' => 'Verlauf / History',
    );

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
        // Register Custom Post Type
        add_action('init', array($this, 'register_post_type'));

        // Add meta boxes
        add_action('add_meta_boxes', array($this, 'add_meta_boxes'));

        // Save meta data
        add_action('save_post_' . $this->post_type, array($this, 'save_meta_data'), 10, 2);

        // Pre-populate defaults for new partners
        add_action('wp_insert_post', array($this, 'prepopulate_defaults'), 10, 3);

        // Register REST API routes
        add_action('rest_api_init', array($this, 'register_rest_routes'));

        // Enqueue admin scripts
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_scripts'));

        // Add admin styles
        add_action('admin_head', array($this, 'admin_styles'));
    }

    /**
     * Register Custom Post Type
     */
    public function register_post_type() {
        $labels = array(
            'name'                  => 'Partner Branding',
            'singular_name'         => 'Partner',
            'menu_name'             => 'Partner Branding',
            'name_admin_bar'        => 'Partner',
            'add_new'               => 'Neuen Partner anlegen',
            'add_new_item'          => 'Neuen Partner anlegen',
            'new_item'              => 'Neuer Partner',
            'edit_item'             => 'Partner bearbeiten',
            'view_item'             => 'Partner anzeigen',
            'all_items'             => 'Partner Branding',
            'search_items'          => 'Partner suchen',
            'not_found'             => 'Keine Partner gefunden',
            'not_found_in_trash'    => 'Keine Partner im Papierkorb',
        );

        $args = array(
            'labels'              => $labels,
            'public'              => false,
            'publicly_queryable'  => false,
            'show_ui'             => true,
            'show_in_menu'        => 'bewerbungstrainer',
            'menu_position'       => 30,
            'menu_icon'           => 'dashicons-groups',
            'query_var'           => false,
            'rewrite'             => false,
            'capability_type'     => 'post',
            'has_archive'         => false,
            'hierarchical'        => false,
            'supports'            => array('title'),
            'show_in_rest'        => false,
        );

        register_post_type($this->post_type, $args);
    }

    /**
     * Add meta boxes
     */
    public function add_meta_boxes() {
        // Partner Info Meta Box
        add_meta_box(
            'whitelabel_partner_info',
            'Partner-Informationen',
            array($this, 'render_info_meta_box'),
            $this->post_type,
            'normal',
            'high'
        );

        // Branding Meta Box
        add_meta_box(
            'whitelabel_partner_branding',
            'Branding / Farben',
            array($this, 'render_branding_meta_box'),
            $this->post_type,
            'normal',
            'high'
        );

        // Logo Meta Box
        add_meta_box(
            'whitelabel_partner_logo',
            'Logo',
            array($this, 'render_logo_meta_box'),
            $this->post_type,
            'side',
            'default'
        );

        // Modules Meta Box
        add_meta_box(
            'whitelabel_partner_modules',
            'Erlaubte Module',
            array($this, 'render_modules_meta_box'),
            $this->post_type,
            'side',
            'default'
        );

        // Scenario Visibility Meta Box (main content area for better layout)
        add_meta_box(
            'whitelabel_partner_scenarios',
            'Szenario-Sichtbarkeit',
            array($this, 'render_scenario_visibility_meta_box'),
            $this->post_type,
            'normal',
            'default'
        );
    }

    /**
     * Render Partner Info Meta Box
     */
    public function render_info_meta_box($post) {
        wp_nonce_field('whitelabel_partner_meta', 'whitelabel_partner_nonce');

        $slug = get_post_meta($post->ID, '_partner_slug', true);
        if (empty($slug) && $post->post_name) {
            $slug = $post->post_name;
        }

        $description = get_post_meta($post->ID, '_partner_description', true);
        ?>
        <table class="form-table">
            <tr>
                <th><label for="partner_slug">Partner-Slug (URL-ID)</label></th>
                <td>
                    <input type="text" id="partner_slug" name="partner_slug" value="<?php echo esc_attr($slug); ?>" class="regular-text" pattern="[a-z0-9-]+" />
                    <p class="description">
                        Wird in der URL verwendet: <code>?partner=<?php echo esc_html($slug ?: 'ihr-slug'); ?></code><br>
                        Nur Kleinbuchstaben, Zahlen und Bindestriche erlaubt.
                    </p>
                </td>
            </tr>
            <tr>
                <th><label for="partner_description">Beschreibung</label></th>
                <td>
                    <textarea id="partner_description" name="partner_description" rows="3" class="large-text"><?php echo esc_textarea($description); ?></textarea>
                </td>
            </tr>
        </table>
        <?php
    }

    /**
     * Gradient fields configuration (field => array of default start/end colors)
     */
    private $gradient_fields = array(
        '--app-bg-color' => array('start' => '#f8fafc', 'end' => '#f0fdfa', 'mid' => '#eff6ff'),
        '--button-gradient' => array('start' => '#3A7FA7', 'end' => '#3DA389'),
        '--button-gradient-hover' => array('start' => '#2D6485', 'end' => '#2E8A72'),
        '--header-gradient' => array('start' => '#3A7FA7', 'end' => '#3DA389'),
    );

    /**
     * Render Branding Meta Box with Color Pickers
     */
    public function render_branding_meta_box($post) {
        $saved_branding = get_post_meta($post->ID, '_partner_branding', true);
        if (!is_array($saved_branding)) {
            $saved_branding = array();
        }

        // Get gradient colors (stored separately)
        $saved_gradients = get_post_meta($post->ID, '_partner_gradient_colors', true);
        if (!is_array($saved_gradients)) {
            $saved_gradients = array();
        }

        // Group CSS variables by category
        $categories = array(
            'app' => array(
                'label' => 'App / Allgemein',
                'fields' => array('--app-bg-color', '--card-bg-color'),
            ),
            'sidebar' => array(
                'label' => 'Sidebar',
                'fields' => array(
                    '--sidebar-bg-color', '--sidebar-text-color', '--sidebar-text-muted',
                    '--sidebar-active-bg', '--sidebar-active-text', '--sidebar-hover-bg',
                ),
            ),
            'accent' => array(
                'label' => 'Akzentfarben',
                'fields' => array('--primary-accent', '--primary-accent-light', '--primary-accent-hover'),
            ),
            'buttons' => array(
                'label' => 'Buttons',
                'fields' => array(
                    '--button-gradient', '--button-gradient-hover',
                    '--button-solid', '--button-solid-hover', '--button-text',
                ),
            ),
            'header' => array(
                'label' => 'Header',
                'fields' => array('--header-gradient', '--header-text'),
            ),
            'icons' => array(
                'label' => 'Icons',
                'fields' => array('--icon-primary', '--icon-secondary', '--icon-muted'),
            ),
            'text' => array(
                'label' => 'Text',
                'fields' => array('--text-main', '--text-secondary', '--text-muted'),
            ),
            'borders' => array(
                'label' => 'Rahmen & Focus',
                'fields' => array('--border-color', '--border-color-light', '--focus-ring'),
            ),
        );

        ?>
        <div class="partner-branding-container">
            <p class="description" style="margin-bottom: 15px;">
                Konfigurieren Sie die Farben für diesen Partner. Leere Felder verwenden die Standardwerte.
            </p>

            <div class="branding-actions" style="margin-bottom: 15px;">
                <button type="button" class="button" id="reset-to-defaults">Auf Standardwerte zurücksetzen</button>
                <button type="button" class="button" id="toggle-all-categories">Alle aufklappen/zuklappen</button>
            </div>

            <?php foreach ($categories as $cat_key => $category): ?>
                <div class="branding-category" data-category="<?php echo esc_attr($cat_key); ?>">
                    <h4 class="branding-category-header" style="cursor: pointer; padding: 10px; background: #f0f0f1; margin: 10px 0 0 0; border-radius: 4px 4px 0 0;">
                        <span class="dashicons dashicons-arrow-down-alt2"></span>
                        <?php echo esc_html($category['label']); ?>
                    </h4>
                    <div class="branding-category-content" style="padding: 15px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 4px 4px; display: block;">
                        <table class="form-table" style="margin: 0;">
                            <?php foreach ($category['fields'] as $field): ?>
                                <?php
                                $value = isset($saved_branding[$field]) ? $saved_branding[$field] : '';
                                $default = isset($this->default_branding[$field]) ? $this->default_branding[$field] : '';
                                $label = isset($this->branding_labels[$field]) ? $this->branding_labels[$field] : $field;
                                $is_gradient = isset($this->gradient_fields[$field]);
                                $field_id = 'branding_' . str_replace(array('-', ' '), '_', $field);
                                ?>
                                <tr>
                                    <th style="width: 180px;">
                                        <label><?php echo esc_html($label); ?></label>
                                        <br><code style="font-size: 10px; color: #666;"><?php echo esc_html($field); ?></code>
                                    </th>
                                    <td>
                                        <?php if ($is_gradient): ?>
                                            <?php
                                            $gradient_defaults = $this->gradient_fields[$field];
                                            $saved_start = isset($saved_gradients[$field]['start']) ? $saved_gradients[$field]['start'] : '';
                                            $saved_end = isset($saved_gradients[$field]['end']) ? $saved_gradients[$field]['end'] : '';
                                            $has_mid = isset($gradient_defaults['mid']);
                                            $saved_mid = isset($saved_gradients[$field]['mid']) ? $saved_gradients[$field]['mid'] : '';
                                            ?>
                                            <div class="gradient-picker-container" data-field="<?php echo esc_attr($field); ?>" style="display: flex; flex-wrap: wrap; gap: 15px; align-items: flex-start;">
                                                <div style="flex: 1; min-width: 120px;">
                                                    <label style="font-size: 12px; font-weight: 500; display: block; margin-bottom: 5px;">Startfarbe</label>
                                                    <input type="text"
                                                           name="partner_gradient[<?php echo esc_attr($field); ?>][start]"
                                                           value="<?php echo esc_attr($saved_start); ?>"
                                                           class="gradient-color-start"
                                                           data-default-color="<?php echo esc_attr($gradient_defaults['start']); ?>" />
                                                </div>
                                                <?php if ($has_mid): ?>
                                                <div style="flex: 1; min-width: 120px;">
                                                    <label style="font-size: 12px; font-weight: 500; display: block; margin-bottom: 5px;">Mitte</label>
                                                    <input type="text"
                                                           name="partner_gradient[<?php echo esc_attr($field); ?>][mid]"
                                                           value="<?php echo esc_attr($saved_mid); ?>"
                                                           class="gradient-color-mid"
                                                           data-default-color="<?php echo esc_attr($gradient_defaults['mid']); ?>" />
                                                </div>
                                                <?php endif; ?>
                                                <div style="flex: 1; min-width: 120px;">
                                                    <label style="font-size: 12px; font-weight: 500; display: block; margin-bottom: 5px;">Endfarbe</label>
                                                    <input type="text"
                                                           name="partner_gradient[<?php echo esc_attr($field); ?>][end]"
                                                           value="<?php echo esc_attr($saved_end); ?>"
                                                           class="gradient-color-end"
                                                           data-default-color="<?php echo esc_attr($gradient_defaults['end']); ?>" />
                                                </div>
                                            </div>
                                            <div class="gradient-preview" data-field="<?php echo esc_attr($field); ?>" style="margin-top: 10px; height: 40px; border-radius: 8px; background: <?php echo esc_attr($value ?: $default); ?>; border: 1px solid #ddd;"></div>
                                            <input type="hidden"
                                                   id="<?php echo esc_attr($field_id); ?>"
                                                   name="partner_branding[<?php echo esc_attr($field); ?>]"
                                                   value="<?php echo esc_attr($value); ?>"
                                                   class="gradient-value-field"
                                                   data-field="<?php echo esc_attr($field); ?>"
                                                   data-has-mid="<?php echo $has_mid ? '1' : '0'; ?>" />
                                        <?php else: ?>
                                            <input type="text"
                                                   id="<?php echo esc_attr($field_id); ?>"
                                                   name="partner_branding[<?php echo esc_attr($field); ?>]"
                                                   value="<?php echo esc_attr($value); ?>"
                                                   class="branding-color-field"
                                                   data-default-color="<?php echo esc_attr($default); ?>"
                                                   placeholder="<?php echo esc_attr($default); ?>" />
                                        <?php endif; ?>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </table>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>

        <script>
        jQuery(document).ready(function($) {
            // Function to update gradient value from color pickers
            function updateGradientValue($container) {
                var field = $container.data('field');
                var $valueField = $('input.gradient-value-field[data-field="' + field + '"]');
                var $preview = $('.gradient-preview[data-field="' + field + '"]');
                var hasMid = $valueField.data('has-mid') === 1;

                var startColor = $container.find('.gradient-color-start').val() || $container.find('.gradient-color-start').data('default-color');
                var endColor = $container.find('.gradient-color-end').val() || $container.find('.gradient-color-end').data('default-color');

                var gradient;
                if (hasMid) {
                    var midColor = $container.find('.gradient-color-mid').val() || $container.find('.gradient-color-mid').data('default-color');
                    gradient = 'linear-gradient(135deg, ' + startColor + ' 0%, ' + midColor + ' 50%, ' + endColor + ' 100%)';
                } else {
                    gradient = 'linear-gradient(135deg, ' + startColor + ' 0%, ' + endColor + ' 100%)';
                }

                $valueField.val(gradient);
                $preview.css('background', gradient);
            }

            // Initialize color pickers for regular fields
            $('.branding-color-field').wpColorPicker({
                change: function(event, ui) {
                    $(this).val(ui.color.toString());
                },
                clear: function() {
                    $(this).val('');
                }
            });

            // Initialize color pickers for gradient start/mid/end colors
            $('.gradient-color-start, .gradient-color-mid, .gradient-color-end').each(function() {
                var $input = $(this);
                var $container = $input.closest('.gradient-picker-container');

                $input.wpColorPicker({
                    change: function(event, ui) {
                        $(this).val(ui.color.toString());
                        updateGradientValue($container);
                    },
                    clear: function() {
                        $(this).val('');
                        updateGradientValue($container);
                    }
                });
            });

            // Initial gradient update
            $('.gradient-picker-container').each(function() {
                updateGradientValue($(this));
            });

            // Toggle categories
            $('.branding-category-header').on('click', function() {
                var $content = $(this).next('.branding-category-content');
                var $icon = $(this).find('.dashicons');
                $content.slideToggle(200);
                $icon.toggleClass('dashicons-arrow-down-alt2 dashicons-arrow-up-alt2');
            });

            // Toggle all categories
            $('#toggle-all-categories').on('click', function() {
                var $contents = $('.branding-category-content');
                var anyVisible = $contents.filter(':visible').length > 0;
                if (anyVisible) {
                    $contents.slideUp(200);
                    $('.branding-category-header .dashicons').removeClass('dashicons-arrow-up-alt2').addClass('dashicons-arrow-down-alt2');
                } else {
                    $contents.slideDown(200);
                    $('.branding-category-header .dashicons').removeClass('dashicons-arrow-down-alt2').addClass('dashicons-arrow-up-alt2');
                }
            });

            // Reset to defaults
            $('#reset-to-defaults').on('click', function() {
                if (confirm('Alle Farbwerte auf Standardwerte zurücksetzen?')) {
                    // Reset regular color fields
                    $('.branding-color-field').each(function() {
                        $(this).val('').wpColorPicker('color', '');
                    });

                    // Reset gradient color pickers
                    $('.gradient-color-start, .gradient-color-mid, .gradient-color-end').each(function() {
                        $(this).val('').wpColorPicker('color', '');
                    });

                    // Update gradient previews
                    $('.gradient-picker-container').each(function() {
                        updateGradientValue($(this));
                    });
                }
            });
        });
        </script>
        <?php
    }

    /**
     * Render Logo Meta Box
     */
    public function render_logo_meta_box($post) {
        $logo_id = get_post_meta($post->ID, '_partner_logo_id', true);
        $logo_url = $logo_id ? wp_get_attachment_image_url($logo_id, 'medium') : '';
        ?>
        <div class="partner-logo-container">
            <div id="logo-preview" style="margin-bottom: 10px; <?php echo $logo_url ? '' : 'display: none;'; ?>">
                <img src="<?php echo esc_url($logo_url); ?>" style="max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 4px;" />
            </div>
            <input type="hidden" id="partner_logo_id" name="partner_logo_id" value="<?php echo esc_attr($logo_id); ?>" />
            <button type="button" class="button" id="upload-logo-btn">
                <?php echo $logo_url ? 'Logo ändern' : 'Logo hochladen'; ?>
            </button>
            <button type="button" class="button" id="remove-logo-btn" <?php echo $logo_url ? '' : 'style="display: none;"'; ?>>
                Logo entfernen
            </button>
            <p class="description" style="margin-top: 10px;">
                Empfohlenes Format: PNG oder SVG mit transparentem Hintergrund.<br>
                Max. Breite: 200px
            </p>
        </div>

        <script>
        jQuery(document).ready(function($) {
            var mediaUploader;

            $('#upload-logo-btn').on('click', function(e) {
                e.preventDefault();

                if (mediaUploader) {
                    mediaUploader.open();
                    return;
                }

                mediaUploader = wp.media({
                    title: 'Partner-Logo auswählen',
                    button: { text: 'Logo verwenden' },
                    multiple: false,
                    library: { type: 'image' }
                });

                mediaUploader.on('select', function() {
                    var attachment = mediaUploader.state().get('selection').first().toJSON();
                    $('#partner_logo_id').val(attachment.id);
                    var imgUrl = attachment.sizes && attachment.sizes.medium ? attachment.sizes.medium.url : attachment.url;
                    $('#logo-preview img').attr('src', imgUrl);
                    $('#logo-preview').show();
                    $('#upload-logo-btn').text('Logo ändern');
                    $('#remove-logo-btn').show();
                });

                mediaUploader.open();
            });

            $('#remove-logo-btn').on('click', function(e) {
                e.preventDefault();
                $('#partner_logo_id').val('');
                $('#logo-preview').hide();
                $('#upload-logo-btn').text('Logo hochladen');
                $(this).hide();
            });
        });
        </script>
        <?php
    }

    /**
     * Render Modules Meta Box
     */
    public function render_modules_meta_box($post) {
        $saved_modules = get_post_meta($post->ID, '_partner_modules', true);
        if (!is_array($saved_modules)) {
            $saved_modules = array();
        }

        $all_modules_enabled = empty($saved_modules);
        ?>
        <div class="partner-modules-container">
            <p class="description">
                Wählen Sie die Module aus, die dieser Partner nutzen darf.<br>
                <strong>Keine Auswahl = Alle Module erlaubt</strong>
            </p>

            <label style="display: block; margin: 10px 0; padding: 8px; background: #f0f0f1; border-radius: 4px;">
                <input type="checkbox" id="enable_all_modules" <?php checked($all_modules_enabled); ?> />
                <strong>Alle Module erlauben</strong>
            </label>

            <div id="modules-list" style="<?php echo $all_modules_enabled ? 'opacity: 0.5; pointer-events: none;' : ''; ?>">
                <?php foreach ($this->available_modules as $module_id => $module_label): ?>
                    <label style="display: block; margin: 5px 0; padding: 5px;">
                        <input type="checkbox"
                               name="partner_modules[]"
                               value="<?php echo esc_attr($module_id); ?>"
                               <?php checked(in_array($module_id, $saved_modules)); ?> />
                        <?php echo esc_html($module_label); ?>
                    </label>
                <?php endforeach; ?>
            </div>

        </div>

        <script>
        jQuery(document).ready(function($) {
            $('#enable_all_modules').on('change', function() {
                var $list = $('#modules-list');
                if ($(this).is(':checked')) {
                    $list.css({ opacity: 0.5, 'pointer-events': 'none' });
                    $list.find('input[type="checkbox"]').prop('checked', false);
                } else {
                    $list.css({ opacity: 1, 'pointer-events': 'auto' });
                }
            });
        });
        </script>
        <?php
    }

    /**
     * Render scenario visibility meta box with checkboxes for each scenario type
     */
    public function render_scenario_visibility_meta_box($post) {
        global $wpdb;

        // Get saved visible scenarios
        $visible_scenarios = get_post_meta($post->ID, '_partner_visible_scenarios', true);
        if (!is_array($visible_scenarios)) {
            $visible_scenarios = array();
        }

        // Fetch all scenarios from different sources
        $all_scenarios = array();

        // 1. Roleplay scenarios (Custom Post Type)
        $roleplay_scenarios = get_posts(array(
            'post_type' => 'roleplay_scenario',
            'posts_per_page' => -1,
            'post_status' => 'publish',
            'orderby' => 'title',
            'order' => 'ASC',
        ));
        foreach ($roleplay_scenarios as $scenario) {
            $all_scenarios['roleplay'][] = array(
                'id' => $scenario->ID,
                'title' => $scenario->post_title,
                'difficulty' => get_post_meta($scenario->ID, '_roleplay_difficulty', true),
            );
        }

        // 2. Simulator scenarios (Database table)
        $simulator_table = $wpdb->prefix . 'bewerbungstrainer_simulator_scenarios';
        $simulator_scenarios = $wpdb->get_results(
            "SELECT id, title, difficulty FROM {$simulator_table} WHERE is_active = 1 ORDER BY title ASC"
        );
        if ($simulator_scenarios) {
            foreach ($simulator_scenarios as $scenario) {
                $all_scenarios['simulator'][] = array(
                    'id' => (int) $scenario->id,
                    'title' => $scenario->title,
                    'difficulty' => $scenario->difficulty,
                );
            }
        }

        // 3. Video Training scenarios (Database table)
        $video_table = $wpdb->prefix . 'bewerbungstrainer_video_scenarios';
        $video_scenarios = $wpdb->get_results(
            "SELECT id, title, difficulty FROM {$video_table} WHERE is_active = 1 ORDER BY title ASC"
        );
        if ($video_scenarios) {
            foreach ($video_scenarios as $scenario) {
                $all_scenarios['video_training'][] = array(
                    'id' => (int) $scenario->id,
                    'title' => $scenario->title,
                    'difficulty' => $scenario->difficulty,
                );
            }
        }

        // Define scenario types with their labels
        $scenario_types = array(
            'roleplay' => array(
                'label' => 'Live-Simulationen',
                'icon' => '🎭',
                'color' => '#9333ea',
            ),
            'simulator' => array(
                'label' => 'Szenario-Training',
                'icon' => '📋',
                'color' => '#0073aa',
            ),
            'video_training' => array(
                'label' => 'Wirkungs-Analyse',
                'icon' => '🎥',
                'color' => '#059669',
            ),
        );

        ?>
        <style>
            .scenario-visibility-container {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 20px;
                margin-top: 10px;
            }
            @media (max-width: 1200px) {
                .scenario-visibility-container {
                    grid-template-columns: repeat(2, 1fr);
                }
            }
            @media (max-width: 800px) {
                .scenario-visibility-container {
                    grid-template-columns: 1fr;
                }
            }
            .scenario-type-box {
                border: 1px solid #ddd;
                border-radius: 8px;
                overflow: hidden;
                background: #fff;
            }
            .scenario-type-header {
                padding: 12px 15px;
                color: #fff;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .scenario-type-header h4 {
                margin: 0;
                font-size: 14px;
                font-weight: 600;
            }
            .scenario-type-header .count {
                background: rgba(255,255,255,0.2);
                padding: 2px 8px;
                border-radius: 10px;
                font-size: 12px;
            }
            .scenario-type-controls {
                padding: 10px 15px;
                background: #f9f9f9;
                border-bottom: 1px solid #eee;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .scenario-type-list {
                max-height: 300px;
                overflow-y: auto;
                padding: 10px;
            }
            .scenario-item {
                display: flex;
                align-items: center;
                padding: 8px 10px;
                margin: 4px 0;
                background: #f9f9f9;
                border-radius: 4px;
                cursor: pointer;
                transition: background 0.2s;
            }
            .scenario-item:hover {
                background: #f0f0f0;
            }
            .scenario-item input[type="checkbox"] {
                margin-right: 10px;
            }
            .scenario-item .title {
                flex: 1;
                font-size: 13px;
            }
            .scenario-item .difficulty-badge {
                font-size: 10px;
                padding: 2px 6px;
                border-radius: 3px;
                color: #fff;
                margin-left: 8px;
            }
            .difficulty-easy { background: #4caf50; }
            .difficulty-medium { background: #ff9800; }
            .difficulty-hard { background: #f44336; }
            .scenario-type-list.disabled {
                opacity: 0.5;
                pointer-events: none;
            }
            .no-scenarios {
                padding: 20px;
                text-align: center;
                color: #666;
                font-style: italic;
            }
        </style>

        <p class="description" style="margin-bottom: 15px;">
            Wählen Sie die Szenarien aus, die dieser Partner sehen kann.<br>
            <strong>Neue Szenarien sind standardmäßig nicht sichtbar</strong> – Sie müssen sie hier explizit aktivieren.
        </p>

        <div class="scenario-visibility-container">
            <?php foreach ($scenario_types as $type_key => $type_info): ?>
                <?php
                $scenarios = isset($all_scenarios[$type_key]) ? $all_scenarios[$type_key] : array();
                $saved_for_type = isset($visible_scenarios[$type_key]) && is_array($visible_scenarios[$type_key])
                    ? $visible_scenarios[$type_key]
                    : array();
                $all_selected = in_array('__all__', $saved_for_type);
                ?>
                <div class="scenario-type-box">
                    <div class="scenario-type-header" style="background: <?php echo esc_attr($type_info['color']); ?>;">
                        <h4><?php echo $type_info['icon']; ?> <?php echo esc_html($type_info['label']); ?></h4>
                        <span class="count"><?php echo count($scenarios); ?> Szenarien</span>
                    </div>

                    <div class="scenario-type-controls">
                        <label style="font-size: 13px; cursor: pointer;">
                            <input type="checkbox"
                                   class="select-all-scenarios"
                                   data-type="<?php echo esc_attr($type_key); ?>"
                                   <?php checked($all_selected); ?> />
                            Alle auswählen
                        </label>
                        <span class="selected-count" data-type="<?php echo esc_attr($type_key); ?>" style="font-size: 12px; color: #666;">
                            <?php
                            if ($all_selected) {
                                echo 'Alle ausgewählt';
                            } else {
                                $count = count(array_filter($saved_for_type, function($id) { return $id !== '__all__'; }));
                                echo $count . ' ausgewählt';
                            }
                            ?>
                        </span>
                    </div>

                    <div class="scenario-type-list <?php echo $all_selected ? 'disabled' : ''; ?>" data-type="<?php echo esc_attr($type_key); ?>">
                        <?php if (empty($scenarios)): ?>
                            <div class="no-scenarios">Keine Szenarien vorhanden</div>
                        <?php else: ?>
                            <?php foreach ($scenarios as $scenario): ?>
                                <?php
                                $is_checked = $all_selected || in_array($scenario['id'], $saved_for_type);
                                $difficulty = $scenario['difficulty'];
                                $difficulty_class = $difficulty ? 'difficulty-' . $difficulty : '';
                                ?>
                                <label class="scenario-item">
                                    <input type="checkbox"
                                           name="partner_visible_scenarios[<?php echo esc_attr($type_key); ?>][]"
                                           value="<?php echo esc_attr($scenario['id']); ?>"
                                           <?php checked($is_checked); ?> />
                                    <span class="title"><?php echo esc_html($scenario['title']); ?></span>
                                    <?php if ($difficulty): ?>
                                        <span class="difficulty-badge <?php echo esc_attr($difficulty_class); ?>">
                                            <?php echo esc_html(ucfirst($difficulty)); ?>
                                        </span>
                                    <?php endif; ?>
                                </label>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </div>

                    <!-- Hidden input to track "all selected" state -->
                    <input type="hidden"
                           name="partner_visible_scenarios_all[<?php echo esc_attr($type_key); ?>]"
                           value="<?php echo $all_selected ? '1' : '0'; ?>"
                           class="all-selected-flag"
                           data-type="<?php echo esc_attr($type_key); ?>" />
                </div>
            <?php endforeach; ?>
        </div>

        <script>
        jQuery(document).ready(function($) {
            // Handle "Alle auswählen" checkbox
            $('.select-all-scenarios').on('change', function() {
                var type = $(this).data('type');
                var $list = $('.scenario-type-list[data-type="' + type + '"]');
                var $flag = $('.all-selected-flag[data-type="' + type + '"]');
                var $count = $('.selected-count[data-type="' + type + '"]');

                if ($(this).is(':checked')) {
                    $list.addClass('disabled');
                    $list.find('input[type="checkbox"]').prop('checked', true);
                    $flag.val('1');
                    $count.text('Alle ausgewählt');
                } else {
                    $list.removeClass('disabled');
                    $flag.val('0');
                    updateSelectedCount(type);
                }
            });

            // Update count when individual checkboxes change
            $('.scenario-type-list input[type="checkbox"]').on('change', function() {
                var type = $(this).closest('.scenario-type-list').data('type');
                updateSelectedCount(type);
            });

            function updateSelectedCount(type) {
                var $list = $('.scenario-type-list[data-type="' + type + '"]');
                var count = $list.find('input[type="checkbox"]:checked').length;
                $('.selected-count[data-type="' + type + '"]').text(count + ' ausgewählt');
            }
        });
        </script>
        <?php
    }

    /**
     * Save meta data
     */
    public function save_meta_data($post_id, $post) {
        // Security checks
        if (!isset($_POST['whitelabel_partner_nonce']) ||
            !wp_verify_nonce($_POST['whitelabel_partner_nonce'], 'whitelabel_partner_meta')) {
            return;
        }

        if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
            return;
        }

        if (!current_user_can('edit_post', $post_id)) {
            return;
        }

        // Save slug
        if (isset($_POST['partner_slug'])) {
            $slug = sanitize_title($_POST['partner_slug']);
            update_post_meta($post_id, '_partner_slug', $slug);

            // Also update the post_name (permalink slug)
            if ($slug && $slug !== $post->post_name) {
                remove_action('save_post_' . $this->post_type, array($this, 'save_meta_data'), 10);
                wp_update_post(array(
                    'ID' => $post_id,
                    'post_name' => $slug,
                ));
                add_action('save_post_' . $this->post_type, array($this, 'save_meta_data'), 10, 2);
            }
        }

        // Save description
        if (isset($_POST['partner_description'])) {
            update_post_meta($post_id, '_partner_description', sanitize_textarea_field($_POST['partner_description']));
        }

        // Save branding
        if (isset($_POST['partner_branding']) && is_array($_POST['partner_branding'])) {
            $branding = array();
            foreach ($_POST['partner_branding'] as $key => $value) {
                $value = trim($value);
                if (!empty($value)) {
                    // Sanitize CSS value (allow gradients, colors, rgba)
                    $branding[sanitize_text_field($key)] = $this->sanitize_css_value($value);
                }
            }
            update_post_meta($post_id, '_partner_branding', $branding);
        }

        // Save gradient colors (for easier editing later)
        if (isset($_POST['partner_gradient']) && is_array($_POST['partner_gradient'])) {
            $gradients = array();
            foreach ($_POST['partner_gradient'] as $field => $colors) {
                $field = sanitize_text_field($field);
                $gradients[$field] = array();

                if (isset($colors['start']) && !empty(trim($colors['start']))) {
                    $gradients[$field]['start'] = sanitize_hex_color($colors['start']);
                }
                if (isset($colors['mid']) && !empty(trim($colors['mid']))) {
                    $gradients[$field]['mid'] = sanitize_hex_color($colors['mid']);
                }
                if (isset($colors['end']) && !empty(trim($colors['end']))) {
                    $gradients[$field]['end'] = sanitize_hex_color($colors['end']);
                }

                // Remove empty arrays
                if (empty($gradients[$field])) {
                    unset($gradients[$field]);
                }
            }
            update_post_meta($post_id, '_partner_gradient_colors', $gradients);
        }

        // Save logo
        if (isset($_POST['partner_logo_id'])) {
            $logo_id = absint($_POST['partner_logo_id']);
            if ($logo_id) {
                update_post_meta($post_id, '_partner_logo_id', $logo_id);
            } else {
                delete_post_meta($post_id, '_partner_logo_id');
            }
        }

        // Save modules
        if (isset($_POST['enable_all_modules']) || empty($_POST['partner_modules'])) {
            // All modules enabled - store empty array
            update_post_meta($post_id, '_partner_modules', array());
        } else {
            $modules = array_map('sanitize_text_field', $_POST['partner_modules']);
            update_post_meta($post_id, '_partner_modules', $modules);
        }

        // Save visible scenarios (new checkbox-based system)
        $visible_scenarios = array();
        $scenario_types = array('roleplay', 'simulator', 'video_training');

        foreach ($scenario_types as $type) {
            // Check if "all" was selected for this type
            $all_selected = isset($_POST['partner_visible_scenarios_all'][$type]) &&
                           $_POST['partner_visible_scenarios_all'][$type] === '1';

            if ($all_selected) {
                // Store special marker for "all scenarios"
                $visible_scenarios[$type] = array('__all__');
            } elseif (isset($_POST['partner_visible_scenarios'][$type]) && is_array($_POST['partner_visible_scenarios'][$type])) {
                // Store selected scenario IDs
                $visible_scenarios[$type] = array_map('absint', $_POST['partner_visible_scenarios'][$type]);
            } else {
                // No scenarios selected for this type
                $visible_scenarios[$type] = array();
            }
        }

        update_post_meta($post_id, '_partner_visible_scenarios', $visible_scenarios);

        // Keep legacy custom scenarios for backwards compatibility (but deprecated)
        if (isset($_POST['partner_custom_scenarios'])) {
            update_post_meta($post_id, '_partner_custom_scenarios', sanitize_textarea_field($_POST['partner_custom_scenarios']));
        }
    }

    /**
     * Pre-populate default branding values for new partners
     * Only runs when a new partner is created (not on updates)
     */
    public function prepopulate_defaults($post_id, $post, $update) {
        // Only for our post type
        if ($post->post_type !== $this->post_type) {
            return;
        }

        // Only for new posts, not updates
        if ($update) {
            return;
        }

        // Skip auto-drafts
        if ($post->post_status === 'auto-draft') {
            return;
        }

        // Check if branding already exists (shouldn't for new posts, but safety check)
        $existing_branding = get_post_meta($post_id, '_partner_branding', true);
        if (!empty($existing_branding) && is_array($existing_branding)) {
            return;
        }

        // Save default branding values to database
        update_post_meta($post_id, '_partner_branding', $this->default_branding);

        // Also save default gradient colors for easier editing
        $default_gradient_colors = array();
        foreach ($this->gradient_fields as $field => $colors) {
            $default_gradient_colors[$field] = $colors;
        }
        update_post_meta($post_id, '_partner_gradient_colors', $default_gradient_colors);

        // Set default modules (empty = all allowed)
        update_post_meta($post_id, '_partner_modules', array());
    }

    /**
     * Import initial partner configurations from MOCK_PARTNERS
     * This runs once during plugin activation
     * Will NOT overwrite existing partners
     */
    public static function import_initial_partners() {
        // Check if import has already been done
        if (get_option('bewerbungstrainer_partners_imported', false)) {
            return;
        }

        // Define all MOCK_PARTNERS from src/config/partners.js
        $mock_partners = array(
            // Demo Partner 1: Vertriebstrainer Mueller (Amber/Gold Theme)
            'vertriebs-mueller' => array(
                'name' => 'Vertriebsakademie Müller',
                'slug' => 'vertriebs-mueller',
                'description' => 'Demo Partner mit Amber/Gold Theme',
                'branding' => array(
                    '--app-bg-color' => 'linear-gradient(135deg, #fef3c7 0%, #fff7ed 50%, #fffbeb 100%)',
                    '--sidebar-bg-color' => '#1e3a5f',
                    '--sidebar-text-color' => '#ffffff',
                    '--sidebar-text-muted' => '#94a3b8',
                    '--sidebar-active-bg' => 'rgba(251, 191, 36, 0.2)',
                    '--sidebar-active-text' => '#fbbf24',
                    '--sidebar-hover-bg' => 'rgba(255, 255, 255, 0.1)',
                    '--card-bg-color' => '#ffffff',
                    '--primary-accent' => '#d97706',
                    '--primary-accent-light' => '#fef3c7',
                    '--primary-accent-hover' => '#b45309',
                    '--button-gradient' => 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    '--button-gradient-hover' => 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                    '--button-solid' => '#d97706',
                    '--button-solid-hover' => '#b45309',
                    '--button-text' => '#ffffff',
                    '--header-gradient' => 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    '--header-text' => '#ffffff',
                    '--icon-primary' => '#d97706',
                    '--icon-secondary' => '#f59e0b',
                    '--icon-muted' => '#a8a29e',
                    '--text-main' => '#1c1917',
                    '--text-secondary' => '#57534e',
                    '--text-muted' => '#a8a29e',
                    '--border-color' => '#e7e5e4',
                    '--border-color-light' => '#f5f5f4',
                    '--focus-ring' => 'rgba(217, 119, 6, 0.3)',
                ),
                'gradient_colors' => array(
                    '--app-bg-color' => array('start' => '#fef3c7', 'mid' => '#fff7ed', 'end' => '#fffbeb'),
                    '--button-gradient' => array('start' => '#f59e0b', 'end' => '#d97706'),
                    '--button-gradient-hover' => array('start' => '#d97706', 'end' => '#b45309'),
                    '--header-gradient' => array('start' => '#f59e0b', 'end' => '#d97706'),
                ),
                'modules' => array(),
            ),

            // Demo Partner 2: Sales Academy Pro (Emerald/Green Theme)
            'sales-academy-pro' => array(
                'name' => 'Sales Academy Pro',
                'slug' => 'sales-academy-pro',
                'description' => 'Demo Partner mit Emerald/Green Theme',
                'branding' => array(
                    '--app-bg-color' => 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #f0fdfa 100%)',
                    '--sidebar-bg-color' => '#064e3b',
                    '--sidebar-text-color' => '#ffffff',
                    '--sidebar-text-muted' => '#a7f3d0',
                    '--sidebar-active-bg' => 'rgba(52, 211, 153, 0.2)',
                    '--sidebar-active-text' => '#34d399',
                    '--sidebar-hover-bg' => 'rgba(255, 255, 255, 0.1)',
                    '--card-bg-color' => '#ffffff',
                    '--primary-accent' => '#059669',
                    '--primary-accent-light' => '#d1fae5',
                    '--primary-accent-hover' => '#047857',
                    '--button-gradient' => 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    '--button-gradient-hover' => 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    '--button-solid' => '#059669',
                    '--button-solid-hover' => '#047857',
                    '--button-text' => '#ffffff',
                    '--header-gradient' => 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    '--header-text' => '#ffffff',
                    '--icon-primary' => '#059669',
                    '--icon-secondary' => '#10b981',
                    '--icon-muted' => '#6ee7b7',
                    '--text-main' => '#022c22',
                    '--text-secondary' => '#065f46',
                    '--text-muted' => '#6ee7b7',
                    '--border-color' => '#a7f3d0',
                    '--border-color-light' => '#d1fae5',
                    '--focus-ring' => 'rgba(5, 150, 105, 0.3)',
                ),
                'gradient_colors' => array(
                    '--app-bg-color' => array('start' => '#f0fdf4', 'mid' => '#ecfdf5', 'end' => '#f0fdfa'),
                    '--button-gradient' => array('start' => '#10b981', 'end' => '#059669'),
                    '--button-gradient-hover' => array('start' => '#059669', 'end' => '#047857'),
                    '--header-gradient' => array('start' => '#10b981', 'end' => '#059669'),
                ),
                'modules' => array(),
            ),

            // Demo Partner 3: TechSales Institute (Purple/Violet Theme)
            'techsales-institute' => array(
                'name' => 'TechSales Institute',
                'slug' => 'techsales-institute',
                'description' => 'Demo Partner mit Purple/Violet Theme',
                'branding' => array(
                    '--app-bg-color' => 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 50%, #ede9fe 100%)',
                    '--sidebar-bg-color' => '#3b0764',
                    '--sidebar-text-color' => '#ffffff',
                    '--sidebar-text-muted' => '#c4b5fd',
                    '--sidebar-active-bg' => 'rgba(167, 139, 250, 0.2)',
                    '--sidebar-active-text' => '#a78bfa',
                    '--sidebar-hover-bg' => 'rgba(255, 255, 255, 0.1)',
                    '--card-bg-color' => '#ffffff',
                    '--primary-accent' => '#7c3aed',
                    '--primary-accent-light' => '#ede9fe',
                    '--primary-accent-hover' => '#6d28d9',
                    '--button-gradient' => 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    '--button-gradient-hover' => 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                    '--button-solid' => '#7c3aed',
                    '--button-solid-hover' => '#6d28d9',
                    '--button-text' => '#ffffff',
                    '--header-gradient' => 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    '--header-text' => '#ffffff',
                    '--icon-primary' => '#7c3aed',
                    '--icon-secondary' => '#8b5cf6',
                    '--icon-muted' => '#a78bfa',
                    '--text-main' => '#1e1b4b',
                    '--text-secondary' => '#4c1d95',
                    '--text-muted' => '#a78bfa',
                    '--border-color' => '#ddd6fe',
                    '--border-color-light' => '#ede9fe',
                    '--focus-ring' => 'rgba(124, 58, 237, 0.3)',
                ),
                'gradient_colors' => array(
                    '--app-bg-color' => array('start' => '#faf5ff', 'mid' => '#f3e8ff', 'end' => '#ede9fe'),
                    '--button-gradient' => array('start' => '#8b5cf6', 'end' => '#7c3aed'),
                    '--button-gradient-hover' => array('start' => '#7c3aed', 'end' => '#6d28d9'),
                    '--header-gradient' => array('start' => '#8b5cf6', 'end' => '#7c3aed'),
                ),
                'modules' => array(),
            ),

            // En Garde Verhandlungstraining (Orange/Charcoal Theme)
            'engarde-training' => array(
                'name' => 'En Garde Verhandlungstraining',
                'slug' => 'engarde-training',
                'description' => 'Orange/Charcoal Theme für Verhandlungstraining',
                'branding' => array(
                    '--app-bg-color' => 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 50%, #fafafa 100%)',
                    '--sidebar-bg-color' => '#333333',
                    '--sidebar-text-color' => '#ffffff',
                    '--sidebar-text-muted' => '#9ca3af',
                    '--sidebar-active-bg' => 'rgba(234, 88, 12, 0.2)',
                    '--sidebar-active-text' => '#f97316',
                    '--sidebar-hover-bg' => 'rgba(255, 255, 255, 0.1)',
                    '--card-bg-color' => '#ffffff',
                    '--primary-accent' => '#ea580c',
                    '--primary-accent-light' => '#fff7ed',
                    '--primary-accent-hover' => '#c2410c',
                    '--button-gradient' => 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                    '--button-gradient-hover' => 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                    '--button-solid' => '#ea580c',
                    '--button-solid-hover' => '#c2410c',
                    '--button-text' => '#ffffff',
                    '--header-gradient' => 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                    '--header-text' => '#ffffff',
                    '--icon-primary' => '#ea580c',
                    '--icon-secondary' => '#f97316',
                    '--icon-muted' => '#9ca3af',
                    '--text-main' => '#1f2937',
                    '--text-secondary' => '#4b5563',
                    '--text-muted' => '#9ca3af',
                    '--border-color' => '#e5e7eb',
                    '--border-color-light' => '#f3f4f6',
                    '--focus-ring' => 'rgba(234, 88, 12, 0.3)',
                ),
                'gradient_colors' => array(
                    '--app-bg-color' => array('start' => '#fafafa', 'mid' => '#f5f5f5', 'end' => '#fafafa'),
                    '--button-gradient' => array('start' => '#f97316', 'end' => '#ea580c'),
                    '--button-gradient-hover' => array('start' => '#ea580c', 'end' => '#c2410c'),
                    '--header-gradient' => array('start' => '#f97316', 'end' => '#ea580c'),
                ),
                'modules' => array(),
            ),

            // Stärkentrainer (Olive/Green Theme) - staerkentrainer.de
            'staerkentrainer' => array(
                'name' => 'Stärkentrainer',
                'slug' => 'staerkentrainer',
                'description' => 'Olive/Green Theme für Stärkentrainer',
                'branding' => array(
                    '--app-bg-color' => 'linear-gradient(135deg, #fafafa 0%, #f5f7f2 50%, #fafafa 100%)',
                    '--sidebar-bg-color' => '#2d2d2d',
                    '--sidebar-text-color' => '#ffffff',
                    '--sidebar-text-muted' => '#a3a3a3',
                    '--sidebar-active-bg' => 'rgba(106, 128, 50, 0.2)',
                    '--sidebar-active-text' => '#8aa83a',
                    '--sidebar-hover-bg' => 'rgba(255, 255, 255, 0.1)',
                    '--card-bg-color' => '#ffffff',
                    '--primary-accent' => '#6a8032',
                    '--primary-accent-light' => '#f0f4e8',
                    '--primary-accent-hover' => '#556827',
                    '--button-gradient' => 'linear-gradient(135deg, #8aa83a 0%, #6a8032 100%)',
                    '--button-gradient-hover' => 'linear-gradient(135deg, #6a8032 0%, #556827 100%)',
                    '--button-solid' => '#6a8032',
                    '--button-solid-hover' => '#556827',
                    '--button-text' => '#ffffff',
                    '--header-gradient' => 'linear-gradient(135deg, #8aa83a 0%, #6a8032 100%)',
                    '--header-text' => '#ffffff',
                    '--icon-primary' => '#6a8032',
                    '--icon-secondary' => '#8aa83a',
                    '--icon-muted' => '#a3a3a3',
                    '--text-main' => '#1a1a1a',
                    '--text-secondary' => '#525252',
                    '--text-muted' => '#a3a3a3',
                    '--border-color' => '#e5e5e5',
                    '--border-color-light' => '#f5f5f5',
                    '--focus-ring' => 'rgba(106, 128, 50, 0.3)',
                ),
                'gradient_colors' => array(
                    '--app-bg-color' => array('start' => '#fafafa', 'mid' => '#f5f7f2', 'end' => '#fafafa'),
                    '--button-gradient' => array('start' => '#8aa83a', 'end' => '#6a8032'),
                    '--button-gradient-hover' => array('start' => '#6a8032', 'end' => '#556827'),
                    '--header-gradient' => array('start' => '#8aa83a', 'end' => '#6a8032'),
                ),
                'modules' => array(),
            ),

            // Joachim Simon Leadership ID (Petrol/Teal Theme) - joachimsimon.de
            'leadership-id' => array(
                'name' => 'Joachim Simon - Leadership ID',
                'slug' => 'leadership-id',
                'description' => 'Petrol/Teal Theme für Leadership ID',
                'branding' => array(
                    '--app-bg-color' => 'linear-gradient(135deg, #fafafa 0%, #f0f7f9 50%, #fafafa 100%)',
                    '--sidebar-bg-color' => '#1a5f7a',
                    '--sidebar-text-color' => '#ffffff',
                    '--sidebar-text-muted' => '#8ecfe0',
                    '--sidebar-active-bg' => 'rgba(255, 255, 255, 0.2)',
                    '--sidebar-active-text' => '#ffffff',
                    '--sidebar-hover-bg' => 'rgba(255, 255, 255, 0.1)',
                    '--card-bg-color' => '#ffffff',
                    '--primary-accent' => '#1a5f7a',
                    '--primary-accent-light' => '#e0f2f7',
                    '--primary-accent-hover' => '#134a5f',
                    '--button-gradient' => 'linear-gradient(135deg, #2980a8 0%, #1a5f7a 100%)',
                    '--button-gradient-hover' => 'linear-gradient(135deg, #1a5f7a 0%, #134a5f 100%)',
                    '--button-solid' => '#1a5f7a',
                    '--button-solid-hover' => '#134a5f',
                    '--button-text' => '#ffffff',
                    '--header-gradient' => 'linear-gradient(135deg, #2980a8 0%, #1a5f7a 100%)',
                    '--header-text' => '#ffffff',
                    '--icon-primary' => '#1a5f7a',
                    '--icon-secondary' => '#2980a8',
                    '--icon-muted' => '#8ecfe0',
                    '--text-main' => '#1a1a1a',
                    '--text-secondary' => '#525252',
                    '--text-muted' => '#9ca3af',
                    '--border-color' => '#e5e7eb',
                    '--border-color-light' => '#f3f4f6',
                    '--focus-ring' => 'rgba(26, 95, 122, 0.3)',
                ),
                'gradient_colors' => array(
                    '--app-bg-color' => array('start' => '#fafafa', 'mid' => '#f0f7f9', 'end' => '#fafafa'),
                    '--button-gradient' => array('start' => '#2980a8', 'end' => '#1a5f7a'),
                    '--button-gradient-hover' => array('start' => '#1a5f7a', 'end' => '#134a5f'),
                    '--header-gradient' => array('start' => '#2980a8', 'end' => '#1a5f7a'),
                ),
                'modules' => array(),
            ),
        );

        $imported_count = 0;

        foreach ($mock_partners as $slug => $partner_data) {
            // Check if partner already exists by slug
            $existing = get_posts(array(
                'post_type' => 'whitelabel_partner',
                'post_status' => 'any',
                'meta_query' => array(
                    array(
                        'key' => '_partner_slug',
                        'value' => $slug,
                    ),
                ),
                'posts_per_page' => 1,
            ));

            // Also check by post_name
            if (empty($existing)) {
                $existing = get_posts(array(
                    'post_type' => 'whitelabel_partner',
                    'post_status' => 'any',
                    'name' => $slug,
                    'posts_per_page' => 1,
                ));
            }

            // Skip if partner already exists
            if (!empty($existing)) {
                continue;
            }

            // Create new partner post
            $post_id = wp_insert_post(array(
                'post_type' => 'whitelabel_partner',
                'post_title' => $partner_data['name'],
                'post_name' => $slug,
                'post_status' => 'publish',
            ));

            if (is_wp_error($post_id) || !$post_id) {
                continue;
            }

            // Save meta data
            update_post_meta($post_id, '_partner_slug', $slug);
            update_post_meta($post_id, '_partner_description', $partner_data['description']);
            update_post_meta($post_id, '_partner_branding', $partner_data['branding']);
            update_post_meta($post_id, '_partner_gradient_colors', $partner_data['gradient_colors']);
            update_post_meta($post_id, '_partner_modules', $partner_data['modules']);

            $imported_count++;
        }

        // Mark import as done
        update_option('bewerbungstrainer_partners_imported', true);

        // Log the import
        if ($imported_count > 0) {
            error_log("Bewerbungstrainer: Imported {$imported_count} initial partner configurations.");
        }

        return $imported_count;
    }

    /**
     * Sanitize CSS value (colors, gradients, rgba)
     */
    private function sanitize_css_value($value) {
        // Remove potentially dangerous characters but allow CSS functions
        $value = preg_replace('/[<>"\']/', '', $value);

        // Allow: hex colors, rgb/rgba, hsl/hsla, linear-gradient, radial-gradient
        if (preg_match('/^(#[a-fA-F0-9]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\)|linear-gradient\([^)]+\)|radial-gradient\([^)]+\))$/i', $value)) {
            return $value;
        }

        // For complex gradients with multiple stops
        if (strpos($value, 'gradient') !== false) {
            return $value;
        }

        return $value;
    }

    /**
     * Register REST API routes
     */
    public function register_rest_routes() {
        // GET /karriereheld/v1/config?partner_slug=xyz
        register_rest_route($this->api_namespace, '/config', array(
            'methods'             => 'GET',
            'callback'            => array($this, 'api_get_config'),
            'permission_callback' => '__return_true', // Public endpoint
            'args'                => array(
                'partner_slug' => array(
                    'required'          => false,
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ),
            ),
        ));

        // POST /karriereheld/v1/login
        register_rest_route($this->api_namespace, '/login', array(
            'methods'             => 'POST',
            'callback'            => array($this, 'api_login'),
            'permission_callback' => '__return_true', // Public endpoint
            'args'                => array(
                'username' => array(
                    'required'          => true,
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_user',
                ),
                'password' => array(
                    'required'          => true,
                    'type'              => 'string',
                ),
            ),
        ));

        // GET /karriereheld/v1/user - Get current user info
        register_rest_route($this->api_namespace, '/user', array(
            'methods'             => 'GET',
            'callback'            => array($this, 'api_get_user'),
            'permission_callback' => array($this, 'check_user_logged_in'),
        ));

        // POST /karriereheld/v1/logout
        register_rest_route($this->api_namespace, '/logout', array(
            'methods'             => 'POST',
            'callback'            => array($this, 'api_logout'),
            'permission_callback' => '__return_true',
        ));
    }

    /**
     * API: Get partner configuration
     */
    public function api_get_config($request) {
        $partner_slug = $request->get_param('partner_slug');

        // If no slug provided, return default configuration
        if (empty($partner_slug)) {
            return new WP_REST_Response(array(
                'success' => true,
                'data'    => $this->get_default_config(),
            ), 200);
        }

        // Find partner by slug
        $partner = $this->get_partner_by_slug($partner_slug);

        if (!$partner) {
            // Partner not found - return defaults
            return new WP_REST_Response(array(
                'success' => true,
                'data'    => $this->get_default_config(),
                'message' => 'Partner not found, using defaults',
            ), 200);
        }

        // Build partner configuration
        $config = $this->build_partner_config($partner);

        return new WP_REST_Response(array(
            'success' => true,
            'data'    => $config,
        ), 200);
    }

    /**
     * Get partner by slug
     */
    private function get_partner_by_slug($slug) {
        $slug = sanitize_title($slug);

        // First try by meta field
        $query = new WP_Query(array(
            'post_type'      => $this->post_type,
            'post_status'    => 'publish',
            'posts_per_page' => 1,
            'meta_query'     => array(
                array(
                    'key'   => '_partner_slug',
                    'value' => $slug,
                ),
            ),
        ));

        if ($query->have_posts()) {
            return $query->posts[0];
        }

        // Fallback: try by post_name
        $query = new WP_Query(array(
            'post_type'      => $this->post_type,
            'post_status'    => 'publish',
            'posts_per_page' => 1,
            'name'           => $slug,
        ));

        if ($query->have_posts()) {
            return $query->posts[0];
        }

        return null;
    }

    /**
     * Get default configuration
     */
    private function get_default_config() {
        return array(
            'id'                => 'default',
            'slug'              => 'default',
            'name'              => 'Karriereheld',
            'branding'          => $this->default_branding,
            'logo_url'          => null,
            'modules'           => array(), // Empty = all allowed
            'visible_scenarios' => array(), // Empty = all scenarios visible
        );
    }

    /**
     * Build partner configuration from post
     */
    private function build_partner_config($post) {
        $post_id = $post->ID;

        // Get saved branding and merge with defaults
        $saved_branding = get_post_meta($post_id, '_partner_branding', true);
        if (!is_array($saved_branding)) {
            $saved_branding = array();
        }
        $branding = array_merge($this->default_branding, $saved_branding);

        // Get logo URL
        $logo_id = get_post_meta($post_id, '_partner_logo_id', true);
        $logo_url = $logo_id ? wp_get_attachment_url($logo_id) : null;

        // Get modules
        $modules = get_post_meta($post_id, '_partner_modules', true);
        if (!is_array($modules)) {
            $modules = array();
        }

        // Get visible scenarios (new checkbox-based system)
        $visible_scenarios = get_post_meta($post_id, '_partner_visible_scenarios', true);
        if (!is_array($visible_scenarios)) {
            $visible_scenarios = array();
        }

        // Legacy: Add custom scenarios to modules for backwards compatibility
        $custom_scenarios = get_post_meta($post_id, '_partner_custom_scenarios', true);
        if (!empty($custom_scenarios)) {
            $custom_array = array_map('trim', explode(',', $custom_scenarios));
            $custom_array = array_filter($custom_array);
            $modules = array_merge($modules, $custom_array);
        }

        // Get slug
        $slug = get_post_meta($post_id, '_partner_slug', true);
        if (empty($slug)) {
            $slug = $post->post_name;
        }

        return array(
            'id'                => $slug,
            'slug'              => $slug,
            'name'              => $post->post_title,
            'branding'          => $branding,
            'logo_url'          => $logo_url,
            'modules'           => $modules,
            'visible_scenarios' => $visible_scenarios,
        );
    }

    /**
     * API: Login
     */
    public function api_login($request) {
        $username = $request->get_param('username');
        $password = $request->get_param('password');

        // Authenticate user
        $user = wp_authenticate($username, $password);

        if (is_wp_error($user)) {
            return new WP_REST_Response(array(
                'success' => false,
                'error'   => array(
                    'code'    => 'invalid_credentials',
                    'message' => 'Benutzername oder Passwort ist falsch.',
                ),
            ), 401);
        }

        // Set auth cookie
        wp_set_current_user($user->ID);
        wp_set_auth_cookie($user->ID, true);

        // Get user data
        $user_data = array(
            'id'          => $user->ID,
            'username'    => $user->user_login,
            'email'       => $user->user_email,
            'displayName' => $user->display_name,
            'firstName'   => get_user_meta($user->ID, 'first_name', true),
            'lastName'    => get_user_meta($user->ID, 'last_name', true),
            'roles'       => $user->roles,
        );

        return new WP_REST_Response(array(
            'success' => true,
            'data'    => array(
                'user'  => $user_data,
                'nonce' => wp_create_nonce('wp_rest'),
            ),
        ), 200);
    }

    /**
     * API: Get current user
     */
    public function api_get_user($request) {
        $user = wp_get_current_user();

        if (!$user || !$user->ID) {
            return new WP_REST_Response(array(
                'success' => false,
                'error'   => array(
                    'code'    => 'not_logged_in',
                    'message' => 'Nicht eingeloggt.',
                ),
            ), 401);
        }

        $user_data = array(
            'id'          => $user->ID,
            'username'    => $user->user_login,
            'email'       => $user->user_email,
            'displayName' => $user->display_name,
            'firstName'   => get_user_meta($user->ID, 'first_name', true),
            'lastName'    => get_user_meta($user->ID, 'last_name', true),
            'roles'       => $user->roles,
        );

        return new WP_REST_Response(array(
            'success' => true,
            'data'    => array('user' => $user_data),
        ), 200);
    }

    /**
     * API: Logout
     */
    public function api_logout($request) {
        wp_logout();

        return new WP_REST_Response(array(
            'success' => true,
            'message' => 'Erfolgreich ausgeloggt.',
        ), 200);
    }

    /**
     * Permission callback: check if user is logged in
     */
    public function check_user_logged_in() {
        return is_user_logged_in();
    }

    /**
     * Enqueue admin scripts
     */
    public function enqueue_admin_scripts($hook) {
        global $post_type;

        if ($post_type !== $this->post_type) {
            return;
        }

        // Enqueue WordPress color picker
        wp_enqueue_style('wp-color-picker');
        wp_enqueue_script('wp-color-picker');

        // Enqueue media uploader
        wp_enqueue_media();
    }

    /**
     * Admin styles
     */
    public function admin_styles() {
        global $post_type;

        if ($post_type !== $this->post_type) {
            return;
        }

        ?>
        <style>
            .partner-branding-container .form-table th {
                padding: 10px 10px 10px 0;
                vertical-align: top;
            }
            .partner-branding-container .form-table td {
                padding: 10px 0;
            }
            .branding-category {
                margin-bottom: 15px;
            }
            .branding-category-header:hover {
                background: #e0e0e0 !important;
            }
            .wp-picker-container {
                display: inline-block;
            }
            .wp-picker-container .wp-color-result.button {
                margin: 0;
            }
        </style>
        <?php
    }
}
