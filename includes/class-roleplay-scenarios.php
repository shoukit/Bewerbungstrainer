<?php
/**
 * Roleplay Scenarios Manager
 *
 * Handles the Custom Post Type for roleplay scenarios
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

class Bewerbungstrainer_Roleplay_Scenarios {

    /**
     * Instance of this class
     */
    private static $instance = null;

    /**
     * Post type name
     */
    const POST_TYPE = 'roleplay_scenario';

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
        // Register custom post type
        add_action('init', array($this, 'register_post_type'));

        // Add meta boxes
        add_action('add_meta_boxes', array($this, 'add_meta_boxes'));

        // Save meta box data
        add_action('save_post_' . self::POST_TYPE, array($this, 'save_meta_boxes'), 10, 2);

        // Handle CSV import/export
        add_action('admin_init', array($this, 'handle_csv_actions'));

        // Handle CSV import via admin_post hook (more reliable for form submissions)
        add_action('admin_post_import_roleplay_scenarios', array($this, 'handle_import_csv'));

        // Add bulk action for export
        add_filter('bulk_actions-edit-' . self::POST_TYPE, array($this, 'add_bulk_actions'));

        // Add export/import buttons to post list
        add_action('restrict_manage_posts', array($this, 'add_import_export_buttons'));
    }

    /**
     * Register the custom post type
     */
    public function register_post_type() {
        $labels = array(
            'name'                  => _x('Live-Simulationen', 'Post type general name', 'bewerbungstrainer'),
            'singular_name'         => _x('Live-Simulation', 'Post type singular name', 'bewerbungstrainer'),
            'menu_name'             => _x('Live-Simulationen', 'Admin Menu text', 'bewerbungstrainer'),
            'name_admin_bar'        => _x('Live-Simulation', 'Add New on Toolbar', 'bewerbungstrainer'),
            'add_new'               => __('Neu hinzufügen', 'bewerbungstrainer'),
            'add_new_item'          => __('Neue Live-Simulation hinzufügen', 'bewerbungstrainer'),
            'new_item'              => __('Neue Live-Simulation', 'bewerbungstrainer'),
            'edit_item'             => __('Live-Simulation bearbeiten', 'bewerbungstrainer'),
            'view_item'             => __('Live-Simulation ansehen', 'bewerbungstrainer'),
            'all_items'             => __('Live-Simulationen', 'bewerbungstrainer'),
            'search_items'          => __('Simulationen durchsuchen', 'bewerbungstrainer'),
            'not_found'             => __('Keine Simulationen gefunden.', 'bewerbungstrainer'),
            'not_found_in_trash'    => __('Keine Simulationen im Papierkorb gefunden.', 'bewerbungstrainer'),
        );

        $args = array(
            'labels'                => $labels,
            'description'           => __('Live-Simulationen für Interview-Training', 'bewerbungstrainer'),
            'public'                => false,
            'publicly_queryable'    => false,
            'show_ui'               => true,
            'show_in_menu'          => 'bewerbungstrainer',
            'menu_icon'             => 'dashicons-format-chat',
            'query_var'             => false,
            'rewrite'               => false,
            'capability_type'       => 'post',
            'has_archive'           => false,
            'hierarchical'          => false,
            'menu_position'         => 26,
            'supports'              => array('title', 'editor'),
            'show_in_rest'          => false,
        );

        register_post_type(self::POST_TYPE, $args);

        // Register custom taxonomy for tags
        $taxonomy_labels = array(
            'name'              => _x('Szenario-Tags', 'taxonomy general name', 'bewerbungstrainer'),
            'singular_name'     => _x('Szenario-Tag', 'taxonomy singular name', 'bewerbungstrainer'),
            'search_items'      => __('Tags durchsuchen', 'bewerbungstrainer'),
            'all_items'         => __('Alle Tags', 'bewerbungstrainer'),
            'edit_item'         => __('Tag bearbeiten', 'bewerbungstrainer'),
            'update_item'       => __('Tag aktualisieren', 'bewerbungstrainer'),
            'add_new_item'      => __('Neues Tag hinzufügen', 'bewerbungstrainer'),
            'new_item_name'     => __('Neuer Tag-Name', 'bewerbungstrainer'),
            'menu_name'         => __('Szenario-Tags', 'bewerbungstrainer'),
        );

        register_taxonomy(
            'roleplay_scenario_tag',
            self::POST_TYPE,
            array(
                'labels'            => $taxonomy_labels,
                'hierarchical'      => false,
                'public'            => false,
                'show_ui'           => true,
                'show_admin_column' => true,
                'query_var'         => false,
                'rewrite'           => false,
            )
        );
    }

    /**
     * Add meta boxes
     */
    public function add_meta_boxes() {
        add_meta_box(
            'roleplay_scenario_details',
            __('Szenario-Details', 'bewerbungstrainer'),
            array($this, 'render_scenario_details_meta_box'),
            self::POST_TYPE,
            'normal',
            'high'
        );

        add_meta_box(
            'roleplay_scenario_variables',
            __('Dynamische Variablen', 'bewerbungstrainer'),
            array($this, 'render_variables_meta_box'),
            self::POST_TYPE,
            'normal',
            'high'
        );

        add_meta_box(
            'roleplay_interviewer_profile',
            __('Gesprächspartner-Profil', 'bewerbungstrainer'),
            array($this, 'render_interviewer_profile_meta_box'),
            self::POST_TYPE,
            'normal',
            'high'
        );

        add_meta_box(
            'roleplay_coaching_hints',
            __('Coaching-Hinweise', 'bewerbungstrainer'),
            array($this, 'render_coaching_hints_meta_box'),
            self::POST_TYPE,
            'normal',
            'high'
        );
    }

    /**
     * Render scenario details meta box
     */
    public function render_scenario_details_meta_box($post) {
        // Add nonce for security
        wp_nonce_field('roleplay_scenario_meta_box', 'roleplay_scenario_meta_box_nonce');

        // Get current values
        $agent_id = get_post_meta($post->ID, '_roleplay_agent_id', true);
        $initial_message = get_post_meta($post->ID, '_roleplay_initial_message', true);
        $difficulty = get_post_meta($post->ID, '_roleplay_difficulty', true);
        $description = get_post_meta($post->ID, '_roleplay_description', true);
        $feedback_prompt = get_post_meta($post->ID, '_roleplay_feedback_prompt', true);
        $role_type = get_post_meta($post->ID, '_roleplay_role_type', true) ?: 'interview';
        $user_role_label = get_post_meta($post->ID, '_roleplay_user_role_label', true) ?: 'Bewerber';

        ?>
        <table class="form-table">
            <tr>
                <th scope="row">
                    <label for="roleplay_role_type"><?php _e('Szenario-Typ', 'bewerbungstrainer'); ?></label>
                </th>
                <td>
                    <select id="roleplay_role_type" name="roleplay_role_type" class="regular-text">
                        <option value="interview" <?php selected($role_type, 'interview'); ?>><?php _e('Interview (KI führt das Gespräch)', 'bewerbungstrainer'); ?></option>
                        <option value="simulation" <?php selected($role_type, 'simulation'); ?>><?php _e('Simulation (User führt das Gespräch)', 'bewerbungstrainer'); ?></option>
                    </select>
                    <p class="description">
                        <?php _e('Interview: Die KI stellt Fragen und führt das Gespräch (z.B. Bewerbungsgespräch). Simulation: Der User führt das Gespräch und die KI reagiert (z.B. Kundenberatung).', 'bewerbungstrainer'); ?>
                    </p>
                </td>
            </tr>

            <tr>
                <th scope="row">
                    <label for="roleplay_user_role_label"><?php _e('Rolle des Users', 'bewerbungstrainer'); ?></label>
                </th>
                <td>
                    <input type="text" id="roleplay_user_role_label" name="roleplay_user_role_label"
                           value="<?php echo esc_attr($user_role_label); ?>"
                           class="regular-text" placeholder="z.B. Bewerber, Kundenberater, Versicherungsagent" />
                    <p class="description">
                        <?php _e('Die Bezeichnung für den User im Gespräch. Wird auch im Feedback verwendet. Beispiele: "Bewerber", "Kundenberater", "Versicherungsagent", "Verkäufer".', 'bewerbungstrainer'); ?>
                    </p>
                </td>
            </tr>

            <tr>
                <th scope="row">
                    <label for="roleplay_agent_id"><?php _e('ElevenLabs Agent ID', 'bewerbungstrainer'); ?></label>
                </th>
                <td>
                    <input type="text" id="roleplay_agent_id" name="roleplay_agent_id"
                           value="<?php echo esc_attr($agent_id); ?>"
                           class="regular-text" required />
                    <p class="description">
                        <?php _e('Die Agent ID aus deinem ElevenLabs Dashboard', 'bewerbungstrainer'); ?>
                    </p>
                </td>
            </tr>

            <tr>
                <th scope="row">
                    <label for="roleplay_initial_message"><?php _e('Erste Nachricht', 'bewerbungstrainer'); ?></label>
                </th>
                <td>
                    <textarea id="roleplay_initial_message" name="roleplay_initial_message"
                              rows="4" class="large-text"><?php echo esc_textarea($initial_message); ?></textarea>
                    <p class="description">
                        <?php _e('Die erste Nachricht, die der Agent sagt. Du kannst {{variable_name}} Platzhalter verwenden.', 'bewerbungstrainer'); ?>
                    </p>
                </td>
            </tr>

            <tr>
                <th scope="row">
                    <label for="roleplay_difficulty"><?php _e('Schwierigkeitsgrad', 'bewerbungstrainer'); ?></label>
                </th>
                <td>
                    <select id="roleplay_difficulty" name="roleplay_difficulty" class="regular-text">
                        <option value="easy" <?php selected($difficulty, 'easy'); ?>><?php _e('Einfach', 'bewerbungstrainer'); ?></option>
                        <option value="medium" <?php selected($difficulty, 'medium'); ?>><?php _e('Mittel', 'bewerbungstrainer'); ?></option>
                        <option value="hard" <?php selected($difficulty, 'hard'); ?>><?php _e('Schwer', 'bewerbungstrainer'); ?></option>
                    </select>
                </td>
            </tr>

            <tr>
                <th scope="row">
                    <label for="roleplay_description"><?php _e('Beschreibung', 'bewerbungstrainer'); ?></label>
                </th>
                <td>
                    <textarea id="roleplay_description" name="roleplay_description"
                              rows="3" class="large-text"><?php echo esc_textarea($description); ?></textarea>
                    <p class="description">
                        <?php _e('Kurze Beschreibung des Szenarios (wird dem User angezeigt)', 'bewerbungstrainer'); ?>
                    </p>
                </td>
            </tr>

            <tr>
                <th scope="row">
                    <label for="roleplay_feedback_prompt"><?php _e('Feedback-Prompt für Gemini', 'bewerbungstrainer'); ?></label>
                </th>
                <td>
                    <textarea id="roleplay_feedback_prompt" name="roleplay_feedback_prompt"
                              rows="10" class="large-text" style="font-family: monospace; font-size: 12px;"><?php echo esc_textarea($feedback_prompt); ?></textarea>
                    <p class="description">
                        <?php _e('Der Prompt für die KI-Bewertung nach dem Gespräch. Verwende ${transcript} als Platzhalter für das Transkript. Leer lassen für Standard-Prompt.', 'bewerbungstrainer'); ?>
                    </p>
                </td>
            </tr>
        </table>
        <?php
    }

    /**
     * Render variables meta box
     */
    public function render_variables_meta_box($post) {
        // Get current values
        $variables_json = get_post_meta($post->ID, '_roleplay_variables_schema', true);

        // Check if this is a new post (no variables saved yet) vs intentionally empty
        $is_new_scenario = ($variables_json === '' || $variables_json === false);
        $variables = $variables_json ? json_decode($variables_json, true) : array();

        ?>
        <div id="roleplay-variables-container">
            <p class="description">
                <?php _e('Definiere dynamische Variablen, die der User vor dem Gespräch eingeben kann. Diese werden als {{variable_key}} im Gespräch ersetzt.', 'bewerbungstrainer'); ?>
            </p>

            <div id="roleplay-variables-list">
                <?php
                if (!empty($variables)) {
                    // Show existing variables
                    foreach ($variables as $index => $variable) {
                        $this->render_variable_row($index, $variable);
                    }
                } elseif ($is_new_scenario) {
                    // Only show defaults for NEW scenarios (never saved before)
                    $this->render_variable_row(0, array(
                        'key' => 'company_name',
                        'label' => 'Unternehmensname',
                        'type' => 'text',
                        'default' => 'Musterfirma GmbH',
                        'required' => true
                    ));
                    $this->render_variable_row(1, array(
                        'key' => 'user_role',
                        'label' => 'Bewerbende Stelle',
                        'type' => 'text',
                        'default' => 'Projektmanager',
                        'required' => true
                    ));
                }
                ?>
            </div>

            <button type="button" id="add-roleplay-variable" class="button">
                <?php _e('+ Variable hinzufügen', 'bewerbungstrainer'); ?>
            </button>
        </div>

        <script type="text/javascript">
        jQuery(document).ready(function($) {
            let variableIndex = <?php echo count($variables); ?>;

            // Add variable button
            $('#add-roleplay-variable').on('click', function() {
                const template = `
                    <div class="roleplay-variable-row" style="margin-bottom: 15px; padding: 15px; border: 1px solid #ddd; border-radius: 4px; background: #f9f9f9;">
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                            <div>
                                <label><strong>Key</strong></label><br>
                                <input type="text" name="roleplay_variables[${variableIndex}][key]" class="regular-text" placeholder="company_name" required />
                            </div>
                            <div>
                                <label><strong>Label (für User)</strong></label><br>
                                <input type="text" name="roleplay_variables[${variableIndex}][label]" class="regular-text" placeholder="Unternehmensname" required />
                            </div>
                            <div>
                                <label><strong>Typ</strong></label><br>
                                <select name="roleplay_variables[${variableIndex}][type]" class="regular-text">
                                    <option value="text">Text</option>
                                    <option value="number">Zahl</option>
                                    <option value="textarea">Mehrzeilig</option>
                                </select>
                            </div>
                            <div>
                                <label><strong>Standardwert</strong></label><br>
                                <input type="text" name="roleplay_variables[${variableIndex}][default]" class="regular-text" />
                            </div>
                            <div>
                                <label>
                                    <input type="checkbox" name="roleplay_variables[${variableIndex}][required]" value="1" checked />
                                    Pflichtfeld
                                </label>
                            </div>
                            <div>
                                <label>
                                    <input type="checkbox" name="roleplay_variables[${variableIndex}][user_input]" value="1" checked />
                                    Von User abfragen
                                </label>
                            </div>
                            <div style="grid-column: span 2; text-align: right;">
                                <button type="button" class="button remove-variable" style="color: #a00;">Entfernen</button>
                            </div>
                        </div>
                    </div>
                `;
                $('#roleplay-variables-list').append(template);
                variableIndex++;
            });

            // Remove variable button
            $(document).on('click', '.remove-variable', function() {
                $(this).closest('.roleplay-variable-row').remove();
            });
        });
        </script>

        <input type="hidden" name="roleplay_variables_json" id="roleplay_variables_json"
               value="<?php echo esc_attr($variables_json); ?>" />
        <?php
    }

    /**
     * Render a single variable row
     */
    private function render_variable_row($index, $variable) {
        $key = isset($variable['key']) ? $variable['key'] : '';
        $label = isset($variable['label']) ? $variable['label'] : '';
        $type = isset($variable['type']) ? $variable['type'] : 'text';
        $default = isset($variable['default']) ? $variable['default'] : '';
        $required = isset($variable['required']) ? $variable['required'] : false;
        $user_input = isset($variable['user_input']) ? $variable['user_input'] : true; // Default to true for backward compatibility
        ?>
        <div class="roleplay-variable-row" style="margin-bottom: 15px; padding: 15px; border: 1px solid #ddd; border-radius: 4px; background: #f9f9f9;">
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                <div>
                    <label><strong>Key</strong></label><br>
                    <input type="text" name="roleplay_variables[<?php echo $index; ?>][key]"
                           value="<?php echo esc_attr($key); ?>" class="regular-text" required />
                </div>
                <div>
                    <label><strong>Label (für User)</strong></label><br>
                    <input type="text" name="roleplay_variables[<?php echo $index; ?>][label]"
                           value="<?php echo esc_attr($label); ?>" class="regular-text" required />
                </div>
                <div>
                    <label><strong>Typ</strong></label><br>
                    <select name="roleplay_variables[<?php echo $index; ?>][type]" class="regular-text">
                        <option value="text" <?php selected($type, 'text'); ?>>Text</option>
                        <option value="number" <?php selected($type, 'number'); ?>>Zahl</option>
                        <option value="textarea" <?php selected($type, 'textarea'); ?>>Mehrzeilig</option>
                    </select>
                </div>
                <div>
                    <label><strong>Standardwert</strong></label><br>
                    <input type="text" name="roleplay_variables[<?php echo $index; ?>][default]"
                           value="<?php echo esc_attr($default); ?>" class="regular-text" />
                </div>
                <div>
                    <label>
                        <input type="checkbox" name="roleplay_variables[<?php echo $index; ?>][required]"
                               value="1" <?php checked($required, true); ?> />
                        Pflichtfeld
                    </label>
                </div>
                <div>
                    <label>
                        <input type="checkbox" name="roleplay_variables[<?php echo $index; ?>][user_input]"
                               value="1" <?php checked($user_input, true); ?> />
                        Von User abfragen
                    </label>
                </div>
                <div style="grid-column: span 2; text-align: right;">
                    <button type="button" class="button remove-variable" style="color: #a00;">Entfernen</button>
                </div>
            </div>
        </div>
        <?php
    }

    /**
     * Save meta box data
     */
    public function save_meta_boxes($post_id, $post) {
        // Verify nonce
        if (!isset($_POST['roleplay_scenario_meta_box_nonce']) ||
            !wp_verify_nonce($_POST['roleplay_scenario_meta_box_nonce'], 'roleplay_scenario_meta_box')) {
            return;
        }

        // Check autosave
        if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
            return;
        }

        // Check permissions
        if (!current_user_can('edit_post', $post_id)) {
            return;
        }

        // Save agent ID
        if (isset($_POST['roleplay_agent_id'])) {
            update_post_meta($post_id, '_roleplay_agent_id', sanitize_text_field($_POST['roleplay_agent_id']));
        }

        // Save initial message
        if (isset($_POST['roleplay_initial_message'])) {
            update_post_meta($post_id, '_roleplay_initial_message', sanitize_textarea_field($_POST['roleplay_initial_message']));
        }

        // Save difficulty
        if (isset($_POST['roleplay_difficulty'])) {
            $difficulty = sanitize_text_field($_POST['roleplay_difficulty']);
            if (in_array($difficulty, array('easy', 'medium', 'hard'))) {
                update_post_meta($post_id, '_roleplay_difficulty', $difficulty);
            }
        }

        // Save description
        if (isset($_POST['roleplay_description'])) {
            update_post_meta($post_id, '_roleplay_description', sanitize_textarea_field($_POST['roleplay_description']));
        }

        // Save role type
        if (isset($_POST['roleplay_role_type'])) {
            $role_type = sanitize_text_field($_POST['roleplay_role_type']);
            if (in_array($role_type, array('interview', 'simulation'))) {
                update_post_meta($post_id, '_roleplay_role_type', $role_type);
            }
        }

        // Save user role label
        if (isset($_POST['roleplay_user_role_label'])) {
            update_post_meta($post_id, '_roleplay_user_role_label', sanitize_text_field($_POST['roleplay_user_role_label']));
        }

        // Save feedback prompt
        if (isset($_POST['roleplay_feedback_prompt'])) {
            update_post_meta($post_id, '_roleplay_feedback_prompt', sanitize_textarea_field($_POST['roleplay_feedback_prompt']));
        }

        // Save interviewer profile
        if (isset($_POST['roleplay_interviewer_name'])) {
            update_post_meta($post_id, '_roleplay_interviewer_name', sanitize_text_field($_POST['roleplay_interviewer_name']));
        }
        if (isset($_POST['roleplay_interviewer_role'])) {
            update_post_meta($post_id, '_roleplay_interviewer_role', sanitize_text_field($_POST['roleplay_interviewer_role']));
        }
        if (isset($_POST['roleplay_interviewer_image'])) {
            update_post_meta($post_id, '_roleplay_interviewer_image', esc_url_raw($_POST['roleplay_interviewer_image']));
        }
        if (isset($_POST['roleplay_interviewer_properties'])) {
            update_post_meta($post_id, '_roleplay_interviewer_properties', sanitize_textarea_field($_POST['roleplay_interviewer_properties']));
        }
        if (isset($_POST['roleplay_interviewer_objections'])) {
            update_post_meta($post_id, '_roleplay_interviewer_objections', sanitize_textarea_field($_POST['roleplay_interviewer_objections']));
        }
        if (isset($_POST['roleplay_interviewer_questions'])) {
            update_post_meta($post_id, '_roleplay_interviewer_questions', sanitize_textarea_field($_POST['roleplay_interviewer_questions']));
        }

        // Save coaching hints
        if (isset($_POST['roleplay_coaching_hints'])) {
            update_post_meta($post_id, '_roleplay_coaching_hints', sanitize_textarea_field($_POST['roleplay_coaching_hints']));
        }

        // Save variables schema - always update, even if empty (to allow deletion)
        $variables = array();

        if (isset($_POST['roleplay_variables']) && is_array($_POST['roleplay_variables'])) {
            foreach ($_POST['roleplay_variables'] as $variable) {
                if (!empty($variable['key']) && !empty($variable['label'])) {
                    $variables[] = array(
                        'key' => sanitize_key($variable['key']),
                        'label' => sanitize_text_field($variable['label']),
                        'type' => in_array($variable['type'], array('text', 'number', 'textarea')) ? $variable['type'] : 'text',
                        'default' => isset($variable['default']) ? sanitize_text_field($variable['default']) : '',
                        'required' => isset($variable['required']) && $variable['required'] === '1',
                        'user_input' => isset($variable['user_input']) && $variable['user_input'] === '1'
                    );
                }
            }
        }

        // Always save - even empty array to allow complete removal of variables
        update_post_meta($post_id, '_roleplay_variables_schema', wp_json_encode($variables));
    }

    /**
     * Get all published scenarios
     */
    public function get_all_scenarios($args = array()) {
        $defaults = array(
            'post_type' => self::POST_TYPE,
            'post_status' => 'publish',
            'posts_per_page' => -1,
            'orderby' => 'title',
            'order' => 'ASC'
        );

        $query_args = wp_parse_args($args, $defaults);
        $query = new WP_Query($query_args);

        $scenarios = array();
        if ($query->have_posts()) {
            while ($query->have_posts()) {
                $query->the_post();
                $scenarios[] = $this->format_scenario(get_post());
            }
            wp_reset_postdata();
        }

        return $scenarios;
    }

    /**
     * Get scenario by ID
     */
    public function get_scenario($post_id) {
        $post = get_post($post_id);

        if (!$post || $post->post_type !== self::POST_TYPE) {
            return null;
        }

        return $this->format_scenario($post);
    }

    /**
     * Format scenario for API response
     */
    private function format_scenario($post) {
        $variables_json = get_post_meta($post->ID, '_roleplay_variables_schema', true);
        $variables = $variables_json ? json_decode($variables_json, true) : array();

        // Get tags
        $tags = wp_get_post_terms($post->ID, 'roleplay_scenario_tag', array('fields' => 'names'));

        // Get role type with default
        $role_type = get_post_meta($post->ID, '_roleplay_role_type', true);
        if (empty($role_type)) {
            $role_type = 'interview';
        }

        // Get user role label with default based on role type
        $user_role_label = get_post_meta($post->ID, '_roleplay_user_role_label', true);
        if (empty($user_role_label)) {
            $user_role_label = 'Bewerber'; // Default for backwards compatibility
        }

        return array(
            'id' => $post->ID,
            'title' => get_the_title($post),
            'description' => get_post_meta($post->ID, '_roleplay_description', true),
            'content' => apply_filters('the_content', $post->post_content),
            'agent_id' => get_post_meta($post->ID, '_roleplay_agent_id', true),
            'initial_message' => get_post_meta($post->ID, '_roleplay_initial_message', true),
            'difficulty' => get_post_meta($post->ID, '_roleplay_difficulty', true),
            'role_type' => $role_type,
            'user_role_label' => $user_role_label,
            'variables_schema' => $variables,
            'tags' => $tags,
            'created_at' => $post->post_date,
            'updated_at' => $post->post_modified,
            'interviewer_profile' => array(
                'name' => get_post_meta($post->ID, '_roleplay_interviewer_name', true),
                'role' => get_post_meta($post->ID, '_roleplay_interviewer_role', true),
                'image_url' => get_post_meta($post->ID, '_roleplay_interviewer_image', true),
                'properties' => get_post_meta($post->ID, '_roleplay_interviewer_properties', true),
                'typical_objections' => get_post_meta($post->ID, '_roleplay_interviewer_objections', true),
                'important_questions' => get_post_meta($post->ID, '_roleplay_interviewer_questions', true),
            ),
            'coaching_hints' => get_post_meta($post->ID, '_roleplay_coaching_hints', true),
        );
    }

    /**
     * Render interviewer profile meta box
     */
    public function render_interviewer_profile_meta_box($post) {
        // Get current values
        $interviewer_name = get_post_meta($post->ID, '_roleplay_interviewer_name', true);
        $interviewer_role = get_post_meta($post->ID, '_roleplay_interviewer_role', true);
        $interviewer_image = get_post_meta($post->ID, '_roleplay_interviewer_image', true);
        $interviewer_properties = get_post_meta($post->ID, '_roleplay_interviewer_properties', true);
        $interviewer_objections = get_post_meta($post->ID, '_roleplay_interviewer_objections', true);
        $interviewer_questions = get_post_meta($post->ID, '_roleplay_interviewer_questions', true);

        ?>
        <table class="form-table">
            <tr>
                <th scope="row">
                    <label for="roleplay_interviewer_name"><?php _e('Name des Gesprächspartners', 'bewerbungstrainer'); ?></label>
                </th>
                <td>
                    <input type="text" id="roleplay_interviewer_name" name="roleplay_interviewer_name"
                           value="<?php echo esc_attr($interviewer_name); ?>"
                           class="regular-text" />
                    <p class="description">
                        <?php _e('Wird als {{interviewer_name}} im Gespräch verfügbar', 'bewerbungstrainer'); ?>
                    </p>
                </td>
            </tr>

            <tr>
                <th scope="row">
                    <label for="roleplay_interviewer_role"><?php _e('Rolle/Position', 'bewerbungstrainer'); ?></label>
                </th>
                <td>
                    <input type="text" id="roleplay_interviewer_role" name="roleplay_interviewer_role"
                           value="<?php echo esc_attr($interviewer_role); ?>"
                           class="regular-text" />
                    <p class="description">
                        <?php _e('Wird als {{interviewer_role}} im Gespräch verfügbar', 'bewerbungstrainer'); ?>
                    </p>
                </td>
            </tr>

            <tr>
                <th scope="row">
                    <label for="roleplay_interviewer_image"><?php _e('Profilbild URL', 'bewerbungstrainer'); ?></label>
                </th>
                <td>
                    <input type="url" id="roleplay_interviewer_image" name="roleplay_interviewer_image"
                           value="<?php echo esc_url($interviewer_image); ?>"
                           class="large-text" />
                    <p class="description">
                        <?php _e('URL zum Profilbild des Gesprächspartners (wird im Frontend angezeigt)', 'bewerbungstrainer'); ?>
                    </p>
                </td>
            </tr>

            <tr>
                <th scope="row">
                    <label for="roleplay_interviewer_properties"><?php _e('Eigenschaften', 'bewerbungstrainer'); ?></label>
                </th>
                <td>
                    <textarea id="roleplay_interviewer_properties" name="roleplay_interviewer_properties"
                              rows="4" class="large-text"><?php echo esc_textarea($interviewer_properties); ?></textarea>
                    <p class="description">
                        <?php _e('Charaktereigenschaften des Gesprächspartners (eine pro Zeile oder kommagetrennt)', 'bewerbungstrainer'); ?>
                    </p>
                </td>
            </tr>

            <tr>
                <th scope="row">
                    <label for="roleplay_interviewer_objections"><?php _e('Typische Einwände', 'bewerbungstrainer'); ?></label>
                </th>
                <td>
                    <textarea id="roleplay_interviewer_objections" name="roleplay_interviewer_objections"
                              rows="4" class="large-text"><?php echo esc_textarea($interviewer_objections); ?></textarea>
                    <p class="description">
                        <?php _e('Typische Einwände oder kritische Fragen (eine pro Zeile)', 'bewerbungstrainer'); ?>
                    </p>
                </td>
            </tr>

            <tr>
                <th scope="row">
                    <label for="roleplay_interviewer_questions"><?php _e('Wichtige Fragen', 'bewerbungstrainer'); ?></label>
                </th>
                <td>
                    <textarea id="roleplay_interviewer_questions" name="roleplay_interviewer_questions"
                              rows="4" class="large-text"><?php echo esc_textarea($interviewer_questions); ?></textarea>
                    <p class="description">
                        <?php _e('Wichtige Fragen, die der Gesprächspartner stellt (eine pro Zeile)', 'bewerbungstrainer'); ?>
                    </p>
                </td>
            </tr>
        </table>
        <?php
    }

    /**
     * Render coaching hints meta box
     */
    public function render_coaching_hints_meta_box($post) {
        // Get current values
        $coaching_hints = get_post_meta($post->ID, '_roleplay_coaching_hints', true);

        ?>
        <table class="form-table">
            <tr>
                <th scope="row">
                    <label for="roleplay_coaching_hints"><?php _e('Coaching-Hinweise', 'bewerbungstrainer'); ?></label>
                </th>
                <td>
                    <textarea id="roleplay_coaching_hints" name="roleplay_coaching_hints"
                              rows="8" class="large-text code"><?php echo esc_textarea($coaching_hints); ?></textarea>
                    <p class="description">
                        <?php _e('Hilfreiche Tipps und Hinweise für den Benutzer während des Rollenspiels (ein Hinweis pro Zeile). Diese werden im "Live Coaching" Panel angezeigt.', 'bewerbungstrainer'); ?>
                    </p>
                    <p class="description">
                        <strong><?php _e('Beispiele:', 'bewerbungstrainer'); ?></strong><br>
                        - Achten Sie auf eine klare Artikulation<br>
                        - Nennen Sie konkrete Beispiele aus Ihrer Erfahrung<br>
                        - Stellen Sie Rückfragen, wenn etwas unklar ist
                    </p>
                </td>
            </tr>
        </table>
        <?php
    }

    /**
     * Add bulk actions
     */
    public function add_bulk_actions($bulk_actions) {
        $bulk_actions['export_csv'] = __('CSV Export', 'bewerbungstrainer');
        return $bulk_actions;
    }

    /**
     * Add import/export buttons to post list
     */
    public function add_import_export_buttons($post_type) {
        if ($post_type !== self::POST_TYPE) {
            return;
        }

        // Show import notices
        if (isset($_GET['imported'])) {
            $imported = intval($_GET['imported']);
            $updated = isset($_GET['csv_updated']) ? intval($_GET['csv_updated']) : 0;
            echo '<div class="notice notice-success is-dismissible"><p>' . sprintf(__('%d Szenario(s) importiert, %d aktualisiert.', 'bewerbungstrainer'), $imported, $updated) . '</p></div>';
        }
        if (isset($_GET['import_error'])) {
            $error_code = isset($_GET['error_code']) ? ' (Code: ' . esc_html($_GET['error_code']) . ')' : '';
            $errors = array(
                'upload' => __('Fehler beim Hochladen der Datei.', 'bewerbungstrainer') . $error_code,
                'read' => __('Fehler beim Lesen der Datei.', 'bewerbungstrainer'),
                'format' => __('Ungültiges CSV-Format. Bitte exportiere zuerst eine Vorlage.', 'bewerbungstrainer'),
            );
            $error_msg = $errors[$_GET['import_error']] ?? __('Unbekannter Fehler beim Import.', 'bewerbungstrainer');
            echo '<div class="notice notice-error is-dismissible"><p>' . esc_html($error_msg) . '</p></div>';
        }

        ?>
        <div style="display: inline-block; margin-left: 15px;">
            <a href="<?php echo wp_nonce_url(admin_url('edit.php?post_type=' . self::POST_TYPE . '&action=export_csv'), 'export_roleplay_scenarios'); ?>" class="button">
                <?php _e('CSV Export', 'bewerbungstrainer'); ?>
            </a>
        </div>
        <div style="display: inline-block; margin-left: 10px;">
            <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" enctype="multipart/form-data" style="display: flex; align-items: center; gap: 5px;">
                <input type="hidden" name="action" value="import_roleplay_scenarios">
                <?php wp_nonce_field('import_roleplay_scenarios', 'roleplay_import_nonce'); ?>
                <input type="file" name="csv_file" accept=".csv" required style="width: 180px;">
                <button type="submit" class="button"><?php _e('Import', 'bewerbungstrainer'); ?></button>
            </form>
        </div>
        <?php
    }

    /**
     * Handle CSV import/export actions
     */
    public function handle_csv_actions() {
        if (!current_user_can('manage_options')) {
            return;
        }

        // Export CSV
        if (isset($_GET['action']) && $_GET['action'] === 'export_csv' && isset($_GET['post_type']) && $_GET['post_type'] === self::POST_TYPE) {
            if (!wp_verify_nonce($_GET['_wpnonce'], 'export_roleplay_scenarios')) {
                wp_die('Security check failed');
            }
            $this->export_scenarios_csv();
            exit;
        }

        // Import CSV - kept for backwards compatibility (admin_init based)
        if (isset($_POST['roleplay_import_csv'])) {
            // Check if file was uploaded
            if (!isset($_FILES['csv_file']) || $_FILES['csv_file']['error'] !== UPLOAD_ERR_OK) {
                $error_code = isset($_FILES['csv_file']) ? $_FILES['csv_file']['error'] : 'no_file';
                wp_redirect(admin_url('edit.php?post_type=' . self::POST_TYPE . '&import_error=upload&error_code=' . $error_code));
                exit;
            }

            // Verify nonce
            if (!isset($_POST['roleplay_import_nonce']) || !wp_verify_nonce($_POST['roleplay_import_nonce'], 'import_roleplay_scenarios')) {
                wp_die('Security check failed - Invalid nonce');
            }

            $this->import_scenarios_csv($_FILES['csv_file']);
        }
    }

    /**
     * Handle CSV import via admin_post hook (dedicated handler for form submissions)
     */
    public function handle_import_csv() {
        // Verify user capabilities
        if (!current_user_can('manage_options')) {
            wp_die('Unauthorized access');
        }

        // Verify nonce
        if (!isset($_POST['roleplay_import_nonce']) || !wp_verify_nonce($_POST['roleplay_import_nonce'], 'import_roleplay_scenarios')) {
            wp_die('Security check failed - Invalid nonce');
        }

        // Check if file was uploaded
        if (!isset($_FILES['csv_file']) || $_FILES['csv_file']['error'] !== UPLOAD_ERR_OK) {
            $error_code = isset($_FILES['csv_file']) ? $_FILES['csv_file']['error'] : 'no_file';
            wp_redirect(admin_url('edit.php?post_type=' . self::POST_TYPE . '&import_error=upload&error_code=' . $error_code));
            exit;
        }

        // Process the import
        $this->import_scenarios_csv($_FILES['csv_file']);
    }

    /**
     * Export scenarios to CSV
     */
    private function export_scenarios_csv() {
        $scenarios = $this->get_all_scenarios(array('post_status' => array('publish', 'draft')));

        $filename = 'roleplay-scenarios-' . date('Y-m-d-His') . '.csv';

        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename=' . $filename);

        $output = fopen('php://output', 'w');

        // UTF-8 BOM for Excel
        fprintf($output, chr(0xEF) . chr(0xBB) . chr(0xBF));

        // CSV Header
        fputcsv($output, array(
            'id',
            'title',
            'description',
            'content',
            'agent_id',
            'initial_message',
            'difficulty',
            'role_type',
            'user_role_label',
            'variables_schema',
            'tags',
            'interviewer_name',
            'interviewer_role',
            'interviewer_image',
            'interviewer_properties',
            'interviewer_objections',
            'interviewer_questions',
            'coaching_hints',
            'feedback_prompt',
            'status'
        ), ';');

        // Data rows
        foreach ($scenarios as $scenario) {
            $post = get_post($scenario['id']);

            // Clean up data: decode HTML entities, remove excessive escaping, and convert newlines
            $clean_text = function($text) {
                if (empty($text)) return '';
                // Decode HTML entities (e.g., &amp; -> &)
                $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
                // Remove excessive backslash escaping from legacy data
                while (strpos($text, '\\\\') !== false) {
                    $text = str_replace('\\\\', '\\', $text);
                }
                // Replace actual newlines with literal \n for CSV compatibility
                $text = str_replace(array("\r\n", "\r", "\n"), '\\n', $text);
                return $text;
            };

            // Clean JSON schema - encode with proper flags
            $vars_schema = is_array($scenario['variables_schema'])
                ? json_encode($scenario['variables_schema'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
                : '[]';

            fputcsv($output, array(
                $scenario['id'],
                $clean_text($scenario['title']),
                $clean_text($scenario['description']),
                $clean_text($post->post_content),
                $scenario['agent_id'],
                $clean_text($scenario['initial_message']),
                $scenario['difficulty'],
                $scenario['role_type'],
                $clean_text($scenario['user_role_label']),
                $vars_schema,
                implode(',', $scenario['tags']),
                $clean_text($scenario['interviewer_profile']['name']),
                $clean_text($scenario['interviewer_profile']['role']),
                $scenario['interviewer_profile']['image_url'],
                $clean_text($scenario['interviewer_profile']['properties']),
                $clean_text($scenario['interviewer_profile']['typical_objections']),
                $clean_text($scenario['interviewer_profile']['important_questions']),
                $clean_text($scenario['coaching_hints']),
                $clean_text(get_post_meta($scenario['id'], '_roleplay_feedback_prompt', true)),
                $post->post_status
            ), ';');
        }

        fclose($output);
    }

    /**
     * Import scenarios from CSV
     */
    private function import_scenarios_csv($file) {
        if ($file['error'] !== UPLOAD_ERR_OK) {
            wp_redirect(admin_url('edit.php?post_type=' . self::POST_TYPE . '&import_error=upload'));
            exit;
        }

        $handle = fopen($file['tmp_name'], 'r');
        if (!$handle) {
            wp_redirect(admin_url('edit.php?post_type=' . self::POST_TYPE . '&import_error=read'));
            exit;
        }

        // Skip BOM if present
        $bom = fread($handle, 3);
        if ($bom !== chr(0xEF) . chr(0xBB) . chr(0xBF)) {
            rewind($handle);
        }

        // Get header row
        $header = fgetcsv($handle, 0, ';');
        if (!$header || !in_array('title', $header)) {
            fclose($handle);
            wp_redirect(admin_url('edit.php?post_type=' . self::POST_TYPE . '&import_error=format'));
            exit;
        }

        $imported = 0;
        $updated = 0;

        // Helper to restore newlines from various formats (\\n, \n, /n)
        $restore_newlines = function($text) {
            if (empty($text)) return '';
            // Handle different newline escape formats
            $text = str_replace('/n', "\n", $text);   // Handle /n format
            $text = str_replace('\\n', "\n", $text);  // Handle \n format
            return $text;
        };

        while (($row = fgetcsv($handle, 0, ';')) !== false) {
            if (count($row) < count($header)) {
                continue;
            }

            $data = array_combine($header, $row);

            // Skip empty titles
            if (empty($data['title'])) {
                continue;
            }

            // Prepare post data (restore newlines in text fields)
            $post_data = array(
                'post_type' => self::POST_TYPE,
                'post_title' => sanitize_text_field($restore_newlines($data['title'])),
                'post_content' => wp_kses_post($restore_newlines($data['content'] ?? '')),
                'post_status' => in_array($data['status'] ?? '', array('publish', 'draft')) ? $data['status'] : 'publish',
            );

            // Check if updating existing by ID
            $post_id = null;
            if (!empty($data['id']) && is_numeric($data['id'])) {
                $existing = get_post(intval($data['id']));
                if ($existing && $existing->post_type === self::POST_TYPE) {
                    $post_data['ID'] = intval($data['id']);
                    $post_id = wp_update_post($post_data);
                    if ($post_id && !is_wp_error($post_id)) {
                        $updated++;
                    }
                }
            }

            // Create new if not updating
            if (!$post_id || $post_id === 0) {
                $post_id = wp_insert_post($post_data);
                if ($post_id && !is_wp_error($post_id) && $post_id > 0) {
                    $imported++;
                }
            }

            // Skip if post creation/update failed
            if (!$post_id || is_wp_error($post_id) || $post_id === 0) {
                continue;
            }

            // Update meta fields (restore newlines in text fields)
            update_post_meta($post_id, '_roleplay_description', sanitize_textarea_field($restore_newlines($data['description'] ?? '')));
            update_post_meta($post_id, '_roleplay_agent_id', sanitize_text_field($data['agent_id'] ?? ''));
            update_post_meta($post_id, '_roleplay_initial_message', sanitize_textarea_field($restore_newlines($data['initial_message'] ?? '')));
            update_post_meta($post_id, '_roleplay_difficulty', sanitize_text_field($data['difficulty'] ?? 'medium'));
            update_post_meta($post_id, '_roleplay_role_type', sanitize_text_field($data['role_type'] ?? 'interview'));
            update_post_meta($post_id, '_roleplay_user_role_label', sanitize_text_field($restore_newlines($data['user_role_label'] ?? 'Bewerber')));
            update_post_meta($post_id, '_roleplay_feedback_prompt', sanitize_textarea_field($restore_newlines($data['feedback_prompt'] ?? '')));
            update_post_meta($post_id, '_roleplay_coaching_hints', sanitize_textarea_field($restore_newlines($data['coaching_hints'] ?? '')));

            // Interviewer profile
            update_post_meta($post_id, '_roleplay_interviewer_name', sanitize_text_field($restore_newlines($data['interviewer_name'] ?? '')));
            update_post_meta($post_id, '_roleplay_interviewer_role', sanitize_text_field($restore_newlines($data['interviewer_role'] ?? '')));
            update_post_meta($post_id, '_roleplay_interviewer_image', esc_url_raw($data['interviewer_image'] ?? ''));
            update_post_meta($post_id, '_roleplay_interviewer_properties', sanitize_textarea_field($restore_newlines($data['interviewer_properties'] ?? '')));
            update_post_meta($post_id, '_roleplay_interviewer_objections', sanitize_textarea_field($restore_newlines($data['interviewer_objections'] ?? '')));
            update_post_meta($post_id, '_roleplay_interviewer_questions', sanitize_textarea_field($restore_newlines($data['interviewer_questions'] ?? '')));

            // Variables schema
            if (!empty($data['variables_schema'])) {
                $vars = json_decode($data['variables_schema'], true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    update_post_meta($post_id, '_roleplay_variables_schema', wp_json_encode($vars));
                }
            }

            // Tags
            if (!empty($data['tags'])) {
                $tags = array_map('trim', explode(',', $data['tags']));
                wp_set_post_terms($post_id, $tags, 'roleplay_scenario_tag');
            }
        }

        fclose($handle);

        wp_redirect(admin_url('edit.php?post_type=' . self::POST_TYPE . '&imported=' . $imported . '&csv_updated=' . $updated));
        exit;
    }
}
