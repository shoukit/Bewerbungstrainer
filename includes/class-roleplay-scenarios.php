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
        // Register custom post type (still needed for legacy data access)
        add_action('init', array($this, 'register_post_type'));

        // NOTE: All admin hooks have been removed.
        // The new database-based admin is in class-roleplay-admin.php
        // This class is only kept for backwards compatibility with existing CPT data.
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
            'show_ui'               => false,  // Hidden - now using database-based admin
            'show_in_menu'          => false,  // Hidden - now using database-based admin
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
        $voice_id = get_post_meta($post->ID, '_roleplay_voice_id', true);
        $initial_message = get_post_meta($post->ID, '_roleplay_initial_message', true);
        $difficulty = get_post_meta($post->ID, '_roleplay_difficulty', true);
        $target_audience = get_post_meta($post->ID, '_roleplay_target_audience', true);
        $description = get_post_meta($post->ID, '_roleplay_description', true);
        $long_description = get_post_meta($post->ID, '_roleplay_long_description', true);
        $feedback_prompt = get_post_meta($post->ID, '_roleplay_feedback_prompt', true);
        $tips = get_post_meta($post->ID, '_roleplay_tips', true);
        $role_type = get_post_meta($post->ID, '_roleplay_role_type', true) ?: 'interview';
        $user_role_label = get_post_meta($post->ID, '_roleplay_user_role_label', true) ?: 'Bewerber';
        $category = get_post_meta($post->ID, '_roleplay_category', true);

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
                    <label for="roleplay_voice_id"><?php _e('ElevenLabs Voice ID', 'bewerbungstrainer'); ?></label>
                </th>
                <td>
                    <input type="text" id="roleplay_voice_id" name="roleplay_voice_id"
                           value="<?php echo esc_attr($voice_id); ?>"
                           class="regular-text" />
                    <p class="description">
                        <?php _e('Optional: Voice ID für dieses Szenario. Überschreibt die Standard-Stimme des Agents.', 'bewerbungstrainer'); ?>
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
                    <label><?php _e('Trainings-Setups', 'bewerbungstrainer'); ?></label>
                </th>
                <td>
                    <?php $this->render_setups_checkboxes($target_audience); ?>
                    <p class="description">
                        <?php _e('Wähle die Setups, in denen dieses Szenario angezeigt werden soll.', 'bewerbungstrainer'); ?>
                    </p>
                </td>
            </tr>

            <tr>
                <th scope="row">
                    <label><?php _e('Kategorien', 'bewerbungstrainer'); ?></label>
                </th>
                <td>
                    <?php
                    $category_array = Bewerbungstrainer_Categories_Admin::get_categories_array($category);
                    Bewerbungstrainer_Categories_Admin::render_category_checkboxes($category_array, 'roleplay_categories');
                    ?>
                    <p class="description">
                        <?php _e('Thematische Einordnung des Szenarios für die Filterung im Dashboard.', 'bewerbungstrainer'); ?>
                        <a href="<?php echo admin_url('admin.php?page=bewerbungstrainer-categories'); ?>"><?php _e('Kategorien verwalten', 'bewerbungstrainer'); ?></a>
                    </p>
                </td>
            </tr>

            <tr>
                <th scope="row">
                    <label for="roleplay_description"><?php _e('Kurzbeschreibung', 'bewerbungstrainer'); ?></label>
                </th>
                <td>
                    <textarea id="roleplay_description" name="roleplay_description"
                              rows="3" class="large-text"><?php echo esc_textarea($description); ?></textarea>
                    <p class="description">
                        <?php _e('Wird auf der Szenario-Kachel im Dashboard angezeigt (kurz halten).', 'bewerbungstrainer'); ?>
                    </p>
                </td>
            </tr>

            <tr>
                <th scope="row">
                    <label for="roleplay_long_description"><?php _e('Langbeschreibung', 'bewerbungstrainer'); ?></label>
                </th>
                <td>
                    <textarea id="roleplay_long_description" name="roleplay_long_description"
                              rows="5" class="large-text"><?php echo esc_textarea($long_description); ?></textarea>
                    <p class="description">
                        <?php _e('Detaillierte Aufgabenbeschreibung für die Vorbereitungsseite. Erklärt dem Nutzer genau, was in diesem Training passiert und was von ihm erwartet wird.', 'bewerbungstrainer'); ?>
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

            <tr>
                <th scope="row">
                    <label for="roleplay_tips"><?php _e('Tipps für Nutzer (JSON)', 'bewerbungstrainer'); ?></label>
                </th>
                <td>
                    <textarea id="roleplay_tips" name="roleplay_tips"
                              rows="8" class="large-text" style="font-family: monospace; font-size: 12px;"><?php
                        if (is_array($tips)) {
                            echo esc_textarea(json_encode($tips, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
                        } else {
                            echo esc_textarea($tips);
                        }
                    ?></textarea>
                    <p class="description">
                        <?php _e('Szenario-spezifische Tipps für die Vorbereitungsseite. Wenn leer, werden Standard-Tipps verwendet.', 'bewerbungstrainer'); ?><br>
                        <?php _e('Format:', 'bewerbungstrainer'); ?> <code>[{"icon": "target", "title": "Tipp-Titel", "text": "Tipp-Beschreibung"}]</code><br>
                        <?php _e('Icons:', 'bewerbungstrainer'); ?> <code>target, clock, mic, message-square, lightbulb, brain</code>
                    </p>
                </td>
            </tr>

            <tr>
                <th scope="row">
                    <label><?php _e('Zusätzliche Optionen', 'bewerbungstrainer'); ?></label>
                </th>
                <td>
                    <?php $allow_custom_vars = get_post_meta($post->ID, '_roleplay_allow_custom_variables', true); ?>
                    <label>
                        <input type="checkbox" name="roleplay_allow_custom_variables" value="1" <?php checked($allow_custom_vars, '1'); ?>>
                        <?php _e('Nutzer kann eigene Variablen hinzufügen', 'bewerbungstrainer'); ?>
                    </label>
                    <p class="description">
                        <?php _e('Zeigt "Zusätzliche Variablen" im Frontend, damit Nutzer eigene Kontextinformationen eingeben können.', 'bewerbungstrainer'); ?>
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

        // Save voice ID
        if (isset($_POST['roleplay_voice_id'])) {
            update_post_meta($post_id, '_roleplay_voice_id', sanitize_text_field($_POST['roleplay_voice_id']));
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

        // Save target audience (from checkboxes array to semicolon-separated string)
        if (isset($_POST['roleplay_target_audience']) && is_array($_POST['roleplay_target_audience'])) {
            $target_audience = implode('; ', array_map('sanitize_text_field', $_POST['roleplay_target_audience']));
            update_post_meta($post_id, '_roleplay_target_audience', $target_audience);
        } else {
            update_post_meta($post_id, '_roleplay_target_audience', '');
        }

        // Save categories (from checkboxes array to JSON)
        $category_json = Bewerbungstrainer_Categories_Admin::parse_categories_input($_POST['roleplay_categories'] ?? array());
        update_post_meta($post_id, '_roleplay_category', $category_json);

        // Save description
        if (isset($_POST['roleplay_description'])) {
            update_post_meta($post_id, '_roleplay_description', sanitize_textarea_field($_POST['roleplay_description']));
        }

        // Save long description
        if (isset($_POST['roleplay_long_description'])) {
            update_post_meta($post_id, '_roleplay_long_description', sanitize_textarea_field($_POST['roleplay_long_description']));
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

        // Save tips (JSON)
        if (isset($_POST['roleplay_tips'])) {
            $tips = stripslashes($_POST['roleplay_tips']);
            // Validate JSON if not empty
            if (!empty($tips)) {
                $tips_decoded = json_decode($tips, true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    update_post_meta($post_id, '_roleplay_tips', wp_json_encode($tips_decoded));
                } else {
                    // Keep as-is if not valid JSON (for error visibility)
                    update_post_meta($post_id, '_roleplay_tips', $tips);
                }
            } else {
                update_post_meta($post_id, '_roleplay_tips', '');
            }
        }

        // Save allow_custom_variables
        update_post_meta(
            $post_id,
            '_roleplay_allow_custom_variables',
            isset($_POST['roleplay_allow_custom_variables']) ? '1' : '0'
        );

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

        // Get category (JSON array)
        $category_json = get_post_meta($post->ID, '_roleplay_category', true);
        $category = Bewerbungstrainer_Categories_Admin::get_categories_array($category_json);

        // Get tips (parse JSON if stored as string)
        $tips_raw = get_post_meta($post->ID, '_roleplay_tips', true);
        $tips = null;
        if (!empty($tips_raw)) {
            if (is_array($tips_raw)) {
                $tips = $tips_raw;
            } else {
                $tips = json_decode($tips_raw, true);
                if (json_last_error() !== JSON_ERROR_NONE) {
                    $tips = null;
                }
            }
        }

        return array(
            'id' => $post->ID,
            'title' => get_the_title($post),
            'description' => get_post_meta($post->ID, '_roleplay_description', true),
            'long_description' => get_post_meta($post->ID, '_roleplay_long_description', true),
            'content' => apply_filters('the_content', $post->post_content),
            'agent_id' => get_post_meta($post->ID, '_roleplay_agent_id', true),
            'voice_id' => get_post_meta($post->ID, '_roleplay_voice_id', true),
            'initial_message' => get_post_meta($post->ID, '_roleplay_initial_message', true),
            'difficulty' => get_post_meta($post->ID, '_roleplay_difficulty', true),
            'target_audience' => get_post_meta($post->ID, '_roleplay_target_audience', true),
            'category' => $category,
            'role_type' => $role_type,
            'user_role_label' => $user_role_label,
            'variables_schema' => $variables,
            'allow_custom_variables' => (bool) get_post_meta($post->ID, '_roleplay_allow_custom_variables', true),
            'tags' => $tags,
            'tips' => $tips,
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
        $bulk_actions['update_categories'] = __('Kategorien aktualisieren', 'bewerbungstrainer');
        $bulk_actions['update_setups'] = __('Setups aktualisieren', 'bewerbungstrainer');
        return $bulk_actions;
    }

    /**
     * Handle bulk actions
     */
    public function handle_bulk_actions($redirect_to, $doaction, $post_ids) {
        if ($doaction === 'update_categories' && !empty($post_ids)) {
            $categories = isset($_REQUEST['bulk_categories']) ? (array)$_REQUEST['bulk_categories'] : array();
            $category_json = wp_json_encode(array_map('sanitize_text_field', $categories));

            foreach ($post_ids as $post_id) {
                update_post_meta($post_id, '_roleplay_category', $category_json);
            }

            $redirect_to = add_query_arg('bulk_updated', count($post_ids), $redirect_to);
        }

        if ($doaction === 'update_setups' && !empty($post_ids)) {
            $setups = isset($_REQUEST['bulk_setups']) ? (array)$_REQUEST['bulk_setups'] : array();
            $setups_string = implode('; ', array_map('sanitize_text_field', $setups));

            foreach ($post_ids as $post_id) {
                update_post_meta($post_id, '_roleplay_target_audience', $setups_string);
            }

            $redirect_to = add_query_arg('bulk_updated', count($post_ids), $redirect_to);
        }

        return $redirect_to;
    }

    /**
     * Add custom columns to post list
     */
    public function add_custom_columns($columns) {
        $new_columns = array();

        foreach ($columns as $key => $value) {
            $new_columns[$key] = $value;

            // Insert after title
            if ($key === 'title') {
                $new_columns['categories'] = __('Kategorien', 'bewerbungstrainer');
                $new_columns['setups'] = __('Setups', 'bewerbungstrainer');
            }
        }

        return $new_columns;
    }

    /**
     * Render custom columns
     */
    public function render_custom_columns($column, $post_id) {
        switch ($column) {
            case 'categories':
                $category_json = get_post_meta($post_id, '_roleplay_category', true);
                $categories = Bewerbungstrainer_Categories_Admin::get_categories_array($category_json);

                // Debug logging
                if (defined('WP_DEBUG') && WP_DEBUG) {
                    error_log("[ROLEPLAY CATEGORIES] Post $post_id - Raw: " . print_r($category_json, true) . " - Parsed: " . print_r($categories, true));
                }

                if (!empty($categories)) {
                    $all_categories = Bewerbungstrainer_Categories_Admin::get_all_categories();

                    // Debug: Log if all_categories is empty
                    if (empty($all_categories) && defined('WP_DEBUG') && WP_DEBUG) {
                        error_log("[ROLEPLAY CATEGORIES] WARNING: all_categories is empty!");
                    }

                    $badges = array();

                    foreach ($categories as $cat_slug) {
                        if (isset($all_categories[$cat_slug])) {
                            $cat = $all_categories[$cat_slug];
                            $badges[] = sprintf(
                                '<span style="display: inline-block; padding: 2px 8px; margin: 2px; border-radius: 4px; font-size: 12px; background: %s20; color: %s; border: 1px solid %s40;">%s %s</span>',
                                esc_attr($cat['color']),
                                esc_attr($cat['color']),
                                esc_attr($cat['color']),
                                esc_html($cat['icon']),
                                esc_html($cat['name'])
                            );
                        } else {
                            $badges[] = sprintf(
                                '<span style="display: inline-block; padding: 2px 8px; margin: 2px; border-radius: 4px; font-size: 12px; background: #f0f0f0; color: #666;">%s</span>',
                                esc_html($cat_slug)
                            );
                        }
                    }

                    echo implode(' ', $badges);
                } else {
                    echo '<span style="color: #999;">—</span>';
                }
                break;

            case 'setups':
                $target_audience = get_post_meta($post_id, '_roleplay_target_audience', true);
                $setup_slugs = array_filter(array_map('trim', explode(';', $target_audience)));

                if (!empty($setup_slugs)) {
                    $setups_manager = Bewerbungstrainer_Scenario_Setups::get_instance();
                    $all_setups = $setups_manager->get_all_setups();
                    $badges = array();

                    foreach ($setup_slugs as $slug) {
                        $setup = null;
                        foreach ($all_setups as $s) {
                            if ($s['slug'] === $slug) {
                                $setup = $s;
                                break;
                            }
                        }

                        if ($setup) {
                            $badges[] = sprintf(
                                '<span style="display: inline-block; padding: 2px 8px; margin: 2px; border-radius: 4px; font-size: 12px; background: %s20; color: %s; border: 1px solid %s40;">%s %s</span>',
                                esc_attr($setup['color']),
                                esc_attr($setup['color']),
                                esc_attr($setup['color']),
                                esc_html($setup['icon']),
                                esc_html($setup['name'])
                            );
                        } else {
                            $badges[] = sprintf(
                                '<span style="display: inline-block; padding: 2px 8px; margin: 2px; border-radius: 4px; font-size: 12px; background: #f0f0f0; color: #666;">%s</span>',
                                esc_html($slug)
                            );
                        }
                    }

                    echo implode(' ', $badges);
                } else {
                    echo '<span style="color: #999;">—</span>';
                }
                break;
        }
    }

    /**
     * Filter scenarios query based on category/setup filters
     */
    public function filter_scenarios_query($query) {
        if (!is_admin() || !$query->is_main_query()) {
            return;
        }

        $screen = get_current_screen();
        if (!$screen || $screen->post_type !== self::POST_TYPE) {
            return;
        }

        $meta_query = array();

        // Filter by category
        if (!empty($_GET['filter_category'])) {
            $category = sanitize_text_field($_GET['filter_category']);
            $meta_query[] = array(
                'key' => '_roleplay_category',
                'value' => $category,
                'compare' => 'LIKE'
            );
        }

        // Filter by setup
        if (!empty($_GET['filter_setup'])) {
            $setup = sanitize_text_field($_GET['filter_setup']);
            $meta_query[] = array(
                'key' => '_roleplay_target_audience',
                'value' => $setup,
                'compare' => 'LIKE'
            );
        }

        if (!empty($meta_query)) {
            $meta_query['relation'] = 'AND';
            $query->set('meta_query', $meta_query);
        }
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
        if (isset($_GET['bulk_updated'])) {
            $updated = intval($_GET['bulk_updated']);
            echo '<div class="notice notice-success is-dismissible"><p>' . sprintf(__('%d Szenario(s) aktualisiert.', 'bewerbungstrainer'), $updated) . '</p></div>';
        }

        // Get categories and setups for filters
        $all_categories = Bewerbungstrainer_Categories_Admin::get_all_categories();
        $setups_manager = Bewerbungstrainer_Scenario_Setups::get_instance();
        $all_setups = $setups_manager->get_all_setups();

        $selected_category = isset($_GET['filter_category']) ? sanitize_text_field($_GET['filter_category']) : '';
        $selected_setup = isset($_GET['filter_setup']) ? sanitize_text_field($_GET['filter_setup']) : '';

        ?>
        <!-- Filter Dropdowns -->
        <select name="filter_category" style="margin-left: 5px;">
            <option value=""><?php _e('Alle Kategorien', 'bewerbungstrainer'); ?></option>
            <?php foreach ($all_categories as $slug => $cat): ?>
                <option value="<?php echo esc_attr($slug); ?>" <?php selected($selected_category, $slug); ?>>
                    <?php echo esc_html($cat['icon'] . ' ' . $cat['name']); ?>
                </option>
            <?php endforeach; ?>
        </select>

        <select name="filter_setup" style="margin-left: 5px;">
            <option value=""><?php _e('Alle Setups', 'bewerbungstrainer'); ?></option>
            <?php foreach ($all_setups as $setup): ?>
                <option value="<?php echo esc_attr($setup['slug']); ?>" <?php selected($selected_setup, $setup['slug']); ?>>
                    <?php echo esc_html($setup['icon'] . ' ' . $setup['name']); ?>
                </option>
            <?php endforeach; ?>
        </select>

        <div style="display: inline-block; margin-left: 15px;">
            <a href="<?php echo wp_nonce_url(admin_url('edit.php?post_type=' . self::POST_TYPE . '&action=export_csv'), 'export_roleplay_scenarios'); ?>" class="button">
                <?php _e('CSV Export', 'bewerbungstrainer'); ?>
            </a>
        </div>
        <div style="display: inline-block; margin-left: 10px;">
            <a href="<?php echo admin_url('admin.php?page=roleplay-scenarios-import'); ?>" class="button">
                <?php _e('CSV Import', 'bewerbungstrainer'); ?>
            </a>
        </div>

        <!-- Bulk Action UI for Categories and Setups -->
        <div id="bulk-categories-ui" style="display: none; margin-top: 10px; padding: 10px; background: #f5f5f5; border-radius: 4px;">
            <strong><?php _e('Kategorien für ausgewählte Szenarien:', 'bewerbungstrainer'); ?></strong>
            <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px;">
                <?php foreach ($all_categories as $slug => $cat): ?>
                    <label style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; background: <?php echo esc_attr($cat['color']); ?>20; border: 1px solid <?php echo esc_attr($cat['color']); ?>40; border-radius: 4px; cursor: pointer;">
                        <input type="checkbox" name="bulk_categories[]" value="<?php echo esc_attr($slug); ?>">
                        <span><?php echo esc_html($cat['icon'] . ' ' . $cat['name']); ?></span>
                    </label>
                <?php endforeach; ?>
            </div>
        </div>

        <div id="bulk-setups-ui" style="display: none; margin-top: 10px; padding: 10px; background: #f5f5f5; border-radius: 4px;">
            <strong><?php _e('Setups für ausgewählte Szenarien:', 'bewerbungstrainer'); ?></strong>
            <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px;">
                <?php foreach ($all_setups as $setup): ?>
                    <label style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; background: <?php echo esc_attr($setup['color']); ?>20; border: 1px solid <?php echo esc_attr($setup['color']); ?>40; border-radius: 4px; cursor: pointer;">
                        <input type="checkbox" name="bulk_setups[]" value="<?php echo esc_attr($setup['slug']); ?>">
                        <span><?php echo esc_html($setup['icon'] . ' ' . $setup['name']); ?></span>
                    </label>
                <?php endforeach; ?>
            </div>
        </div>

        <script>
        jQuery(document).ready(function($) {
            // Show/hide bulk action UI based on selection
            $('select[name="action"], select[name="action2"]').on('change', function() {
                var action = $(this).val();
                $('#bulk-categories-ui').toggle(action === 'update_categories');
                $('#bulk-setups-ui').toggle(action === 'update_setups');
            });

            // Initial check
            var action1 = $('select[name="action"]').val();
            var action2 = $('select[name="action2"]').val();
            $('#bulk-categories-ui').toggle(action1 === 'update_categories' || action2 === 'update_categories');
            $('#bulk-setups-ui').toggle(action1 === 'update_setups' || action2 === 'update_setups');
        });
        </script>
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
     * Add import submenu page
     */
    public function add_import_submenu() {
        add_submenu_page(
            'edit.php?post_type=' . self::POST_TYPE,
            __('CSV Import', 'bewerbungstrainer'),
            __('CSV Import', 'bewerbungstrainer'),
            'manage_options',
            'roleplay-scenarios-import',
            array($this, 'render_import_page')
        );
    }

    /**
     * Render the import page
     */
    public function render_import_page() {
        // Get database instance
        $db = Bewerbungstrainer_Roleplay_Database::get_instance();
        $db_count = $db->get_scenarios_count(array('is_active' => null));
        $cpt_count = wp_count_posts(self::POST_TYPE);
        $cpt_total = ($cpt_count->publish ?? 0) + ($cpt_count->draft ?? 0);

        // Show notices
        if (isset($_GET['imported'])) {
            $imported = intval($_GET['imported']);
            $updated = isset($_GET['csv_updated']) ? intval($_GET['csv_updated']) : 0;
            echo '<div class="notice notice-success is-dismissible"><p>' . sprintf(__('%d Szenario(s) importiert, %d aktualisiert.', 'bewerbungstrainer'), $imported, $updated) . '</p></div>';
        }
        if (isset($_GET['db_imported'])) {
            $db_imported = intval($_GET['db_imported']);
            echo '<div class="notice notice-success is-dismissible"><p>' . sprintf(__('%d Szenario(s) in die neue Datenbank-Tabelle importiert.', 'bewerbungstrainer'), $db_imported) . '</p></div>';
        }
        if (isset($_GET['migrated'])) {
            $migrated = intval($_GET['migrated']);
            $failed = isset($_GET['failed']) ? intval($_GET['failed']) : 0;
            echo '<div class="notice notice-success is-dismissible"><p>' . sprintf(__('Migration abgeschlossen: %d Szenarios migriert, %d fehlgeschlagen.', 'bewerbungstrainer'), $migrated, $failed) . '</p></div>';
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
        <div class="wrap">
            <h1><?php _e('Live-Simulationen Import & Migration', 'bewerbungstrainer'); ?></h1>

            <!-- Migration Section -->
            <div class="card" style="max-width: 700px; padding: 20px; margin-top: 20px; border-left: 4px solid #2271b1;">
                <h2 style="margin-top: 0;">🔄 <?php _e('Migration zur neuen Datenbank-Tabelle', 'bewerbungstrainer'); ?></h2>
                <p><?php _e('Migriere alle Live-Simulationen von WordPress Custom Post Types zur neuen einheitlichen Datenbank-Tabelle.', 'bewerbungstrainer'); ?></p>

                <table class="widefat" style="margin: 15px 0; max-width: 400px;">
                    <tr>
                        <td><strong><?php _e('Custom Post Types (alt)', 'bewerbungstrainer'); ?></strong></td>
                        <td><?php echo $cpt_total; ?> <?php _e('Szenarien', 'bewerbungstrainer'); ?></td>
                    </tr>
                    <tr>
                        <td><strong><?php _e('Datenbank-Tabelle (neu)', 'bewerbungstrainer'); ?></strong></td>
                        <td><?php echo $db_count; ?> <?php _e('Szenarien', 'bewerbungstrainer'); ?></td>
                    </tr>
                </table>

                <?php if ($cpt_total > 0): ?>
                <form method="post" style="margin-top: 15px;">
                    <?php wp_nonce_field('migrate_roleplay_scenarios', 'roleplay_migrate_nonce'); ?>
                    <input type="hidden" name="roleplay_migrate_action" value="1">
                    <button type="submit" class="button button-primary" onclick="return confirm('<?php _e('Alle Szenarien von Custom Post Types zur Datenbank-Tabelle migrieren?', 'bewerbungstrainer'); ?>');">
                        <?php _e('Jetzt migrieren', 'bewerbungstrainer'); ?>
                    </button>
                    <p class="description" style="margin-top: 10px;">
                        <?php _e('Hinweis: Die originalen Custom Post Types bleiben erhalten und können später gelöscht werden.', 'bewerbungstrainer'); ?>
                    </p>
                </form>
                <?php else: ?>
                <p><em><?php _e('Keine Custom Post Types zum Migrieren vorhanden.', 'bewerbungstrainer'); ?></em></p>
                <?php endif; ?>
            </div>

            <!-- CSV Import to Database Table -->
            <div class="card" style="max-width: 700px; padding: 20px; margin-top: 20px; border-left: 4px solid #00a32a;">
                <h2 style="margin-top: 0;">📥 <?php _e('CSV in Datenbank-Tabelle importieren (empfohlen)', 'bewerbungstrainer'); ?></h2>
                <p><?php _e('Importiere CSV-Daten direkt in die neue Datenbank-Tabelle. Dies ist die empfohlene Methode.', 'bewerbungstrainer'); ?></p>

                <form method="post" enctype="multipart/form-data" style="margin-top: 20px;">
                    <?php wp_nonce_field('import_roleplay_to_db', 'roleplay_import_db_nonce'); ?>
                    <input type="hidden" name="roleplay_import_db_action" value="1">

                    <p>
                        <input type="file" name="csv_file" accept=".csv" required style="width: 100%;">
                    </p>

                    <p style="margin-top: 15px;">
                        <button type="submit" class="button button-primary"><?php _e('In Datenbank importieren', 'bewerbungstrainer'); ?></button>
                    </p>
                </form>
            </div>

            <!-- Legacy CSV Import (to CPT) -->
            <div class="card" style="max-width: 700px; padding: 20px; margin-top: 20px; border-left: 4px solid #dba617;">
                <h2 style="margin-top: 0;">📁 <?php _e('CSV in Custom Post Types importieren (Legacy)', 'bewerbungstrainer'); ?></h2>
                <p><?php _e('Importiere in das alte WordPress Custom Post Type System. Nur für Abwärtskompatibilität.', 'bewerbungstrainer'); ?></p>

                <form method="post" enctype="multipart/form-data" style="margin-top: 20px;">
                    <?php wp_nonce_field('import_roleplay_scenarios', 'roleplay_import_nonce'); ?>
                    <input type="hidden" name="roleplay_import_action" value="1">

                    <p>
                        <input type="file" name="csv_file" accept=".csv" required style="width: 100%;">
                    </p>

                    <p style="margin-top: 15px;">
                        <button type="submit" class="button"><?php _e('In Custom Post Types importieren', 'bewerbungstrainer'); ?></button>
                        <a href="<?php echo admin_url('edit.php?post_type=' . self::POST_TYPE); ?>" class="button"><?php _e('Zurück zur Übersicht', 'bewerbungstrainer'); ?></a>
                    </p>
                </form>
            </div>

            <!-- Hints -->
            <div class="card" style="max-width: 700px; padding: 20px; margin-top: 20px;">
                <h2 style="margin-top: 0;"><?php _e('Hinweise zum CSV-Format', 'bewerbungstrainer'); ?></h2>
                <ul style="list-style: disc; margin-left: 20px;">
                    <li><?php _e('Die CSV-Datei muss Semikolon (;) als Trennzeichen verwenden.', 'bewerbungstrainer'); ?></li>
                    <li><?php _e('Die erste Zeile muss die Spaltenüberschriften enthalten.', 'bewerbungstrainer'); ?></li>
                    <li><?php _e('Exportiere zuerst eine Vorlage, um das korrekte Format zu sehen.', 'bewerbungstrainer'); ?></li>
                    <li><?php _e('JSON-Felder (category, tips, variables_schema) müssen gültiges JSON enthalten.', 'bewerbungstrainer'); ?></li>
                </ul>
            </div>
        </div>
        <?php
    }

    /**
     * Handle import page form submission
     */
    public function handle_import_page_submission() {
        // Only process on our import page
        if (!isset($_GET['page']) || $_GET['page'] !== 'roleplay-scenarios-import') {
            return;
        }

        // Verify user capabilities
        if (!current_user_can('manage_options')) {
            return;
        }

        $redirect_base = 'admin.php?page=roleplay-scenarios-import';

        // Handle Migration from CPT to Database
        if (isset($_POST['roleplay_migrate_action'])) {
            error_log('[ROLEPLAY MIGRATION] Migration action triggered');

            // Verify nonce
            if (!isset($_POST['roleplay_migrate_nonce']) || !wp_verify_nonce($_POST['roleplay_migrate_nonce'], 'migrate_roleplay_scenarios')) {
                wp_die('Security check failed - Invalid nonce');
            }

            $db = Bewerbungstrainer_Roleplay_Database::get_instance();
            $results = $db->migrate_from_posts();

            error_log('[ROLEPLAY MIGRATION] Results: ' . print_r($results, true));

            wp_redirect(admin_url($redirect_base . '&migrated=' . $results['migrated'] . '&failed=' . $results['failed']));
            exit;
        }

        // Handle CSV Import to Database Table
        if (isset($_POST['roleplay_import_db_action'])) {
            error_log('[ROLEPLAY IMPORT DB] Database import action triggered');

            // Verify nonce
            if (!isset($_POST['roleplay_import_db_nonce']) || !wp_verify_nonce($_POST['roleplay_import_db_nonce'], 'import_roleplay_to_db')) {
                wp_die('Security check failed - Invalid nonce');
            }

            // Check if file was uploaded
            if (!isset($_FILES['csv_file']) || $_FILES['csv_file']['error'] !== UPLOAD_ERR_OK) {
                $error_code = isset($_FILES['csv_file']) ? $_FILES['csv_file']['error'] : 'no_file';
                wp_redirect(admin_url($redirect_base . '&import_error=upload&error_code=' . $error_code));
                exit;
            }

            $imported = $this->import_scenarios_to_database($_FILES['csv_file']);
            wp_redirect(admin_url($redirect_base . '&db_imported=' . $imported));
            exit;
        }

        // Handle Legacy CSV Import to CPT
        if (isset($_POST['roleplay_import_action'])) {
            error_log('[ROLEPLAY IMPORT] Legacy CPT import action triggered');

            // Verify nonce
            if (!isset($_POST['roleplay_import_nonce']) || !wp_verify_nonce($_POST['roleplay_import_nonce'], 'import_roleplay_scenarios')) {
                wp_die('Security check failed - Invalid nonce');
            }

            // Check if file was uploaded
            if (!isset($_FILES['csv_file']) || $_FILES['csv_file']['error'] !== UPLOAD_ERR_OK) {
                $error_code = isset($_FILES['csv_file']) ? $_FILES['csv_file']['error'] : 'no_file';
                wp_redirect(admin_url($redirect_base . '&import_error=upload&error_code=' . $error_code));
                exit;
            }

            error_log('[ROLEPLAY IMPORT] Processing file upload...');
            $this->import_scenarios_csv($_FILES['csv_file'], $redirect_base);
        }
    }

    /**
     * Import scenarios from CSV to the new database table
     *
     * @param array $file The uploaded file from $_FILES
     * @return int Number of scenarios imported
     */
    private function import_scenarios_to_database($file) {
        error_log('[ROLEPLAY IMPORT DB] import_scenarios_to_database called');

        if ($file['error'] !== UPLOAD_ERR_OK) {
            error_log('[ROLEPLAY IMPORT DB] File upload error: ' . $file['error']);
            return 0;
        }

        $handle = fopen($file['tmp_name'], 'r');
        if (!$handle) {
            error_log('[ROLEPLAY IMPORT DB] Could not open file');
            return 0;
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
            error_log('[ROLEPLAY IMPORT DB] Invalid CSV format - missing title column');
            return 0;
        }

        error_log('[ROLEPLAY IMPORT DB] CSV headers: ' . implode(', ', $header));

        $db = Bewerbungstrainer_Roleplay_Database::get_instance();
        $imported = 0;

        // Helper to restore newlines
        $restore_newlines = function($text) {
            if (empty($text)) return '';
            $text = str_replace('/n', "\n", $text);
            $text = str_replace('\\n', "\n", $text);
            return $text;
        };

        while (($row = fgetcsv($handle, 0, ';')) !== false) {
            if (count($row) < count($header)) {
                continue;
            }

            $data = array_combine($header, $row);

            // Skip empty titles
            if (empty($data['title'])) {
                error_log('[ROLEPLAY IMPORT DB] Skipping row with empty title');
                continue;
            }

            error_log('[ROLEPLAY IMPORT DB] Processing: ' . $data['title']);

            // Build system prompt from content and initial_message if not present
            $system_prompt = $data['system_prompt'] ?? '';
            if (empty($system_prompt) && !empty($data['content'])) {
                $system_prompt = $restore_newlines($data['content']);
            }

            // Build AI instructions from interviewer profile
            $ai_instructions = '';
            $interviewer_parts = array();
            if (!empty($data['interviewer_name'])) {
                $interviewer_parts[] = 'Name: ' . $restore_newlines($data['interviewer_name']);
            }
            if (!empty($data['interviewer_role'])) {
                $interviewer_parts[] = 'Rolle: ' . $restore_newlines($data['interviewer_role']);
            }
            if (!empty($data['interviewer_properties'])) {
                $interviewer_parts[] = 'Eigenschaften: ' . $restore_newlines($data['interviewer_properties']);
            }
            if (!empty($data['interviewer_objections'])) {
                $interviewer_parts[] = 'Typische Einwände: ' . $restore_newlines($data['interviewer_objections']);
            }
            if (!empty($data['interviewer_questions'])) {
                $interviewer_parts[] = 'Wichtige Fragen: ' . $restore_newlines($data['interviewer_questions']);
            }
            if (!empty($interviewer_parts)) {
                $ai_instructions = "## Interviewer-Profil\n" . implode("\n", $interviewer_parts);
            }
            if (!empty($data['coaching_hints'])) {
                $ai_instructions .= "\n\n## Coaching-Hinweise\n" . $restore_newlines($data['coaching_hints']);
            }

            // Prepare scenario data for database
            $scenario_data = array(
                'title' => sanitize_text_field($restore_newlines($data['title'])),
                'description' => sanitize_textarea_field($restore_newlines($data['description'] ?? '')),
                'long_description' => sanitize_textarea_field($restore_newlines($data['long_description'] ?? '')),
                'icon' => 'mic', // Default icon
                'difficulty' => sanitize_text_field($data['difficulty'] ?? 'medium'),
                'target_audience' => sanitize_text_field($restore_newlines($data['target_audience'] ?? '')),
                'category' => $data['category'] ?? '[]',
                'role_type' => sanitize_text_field($data['role_type'] ?? 'interview'),
                'user_role_label' => sanitize_text_field($restore_newlines($data['user_role_label'] ?? 'Bewerber')),
                'agent_id' => sanitize_text_field($data['agent_id'] ?? ''),
                'system_prompt' => $system_prompt,
                'feedback_prompt' => sanitize_textarea_field($restore_newlines($data['feedback_prompt'] ?? '')),
                'ai_instructions' => $ai_instructions,
                'tips' => $data['tips'] ?? '[]',
                'input_configuration' => $data['variables_schema'] ?? '[]',
                'is_active' => ($data['status'] ?? 'publish') === 'publish' ? 1 : 0,
                'sort_order' => 0,
            );

            $scenario_id = $db->create_scenario($scenario_data);

            if ($scenario_id) {
                $imported++;
                error_log('[ROLEPLAY IMPORT DB] Created scenario ID: ' . $scenario_id);
            } else {
                error_log('[ROLEPLAY IMPORT DB] Failed to create scenario for: ' . $data['title']);
            }
        }

        fclose($handle);

        error_log('[ROLEPLAY IMPORT DB] Done! Imported: ' . $imported);

        return $imported;
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
            'long_description',
            'content',
            'agent_id',
            'voice_id',
            'initial_message',
            'difficulty',
            'target_audience',
            'category',
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
            'tips',
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

            // Category as JSON array
            $category_json = is_array($scenario['category'])
                ? json_encode($scenario['category'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
                : '[]';

            // Tips as JSON
            $tips_json = is_array($scenario['tips'])
                ? json_encode($scenario['tips'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
                : '';

            fputcsv($output, array(
                $scenario['id'],
                $clean_text($scenario['title']),
                $clean_text($scenario['description']),
                $clean_text($scenario['long_description'] ?? ''),
                $clean_text($post->post_content),
                $scenario['agent_id'],
                $scenario['voice_id'] ?? '',
                $clean_text($scenario['initial_message']),
                $scenario['difficulty'],
                $clean_text($scenario['target_audience'] ?? ''),
                $category_json,
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
                $tips_json,
                $post->post_status
            ), ';');
        }

        fclose($output);
    }

    /**
     * Import scenarios from CSV
     *
     * @param array $file The uploaded file from $_FILES
     * @param string $redirect_base Optional base URL for redirects (default: edit.php?post_type=roleplay_scenario)
     */
    private function import_scenarios_csv($file, $redirect_base = null) {
        if ($redirect_base === null) {
            $redirect_base = 'edit.php?post_type=' . self::POST_TYPE;
        }

        error_log('[ROLEPLAY IMPORT] import_scenarios_csv called');
        error_log('[ROLEPLAY IMPORT] File: ' . print_r($file, true));

        if ($file['error'] !== UPLOAD_ERR_OK) {
            error_log('[ROLEPLAY IMPORT] File upload error: ' . $file['error']);
            wp_redirect(admin_url($redirect_base . '&import_error=upload'));
            exit;
        }

        $handle = fopen($file['tmp_name'], 'r');
        if (!$handle) {
            wp_redirect(admin_url($redirect_base . '&import_error=read'));
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
            wp_redirect(admin_url($redirect_base . '&import_error=format'));
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
                error_log('[ROLEPLAY IMPORT] Skipping row with empty title');
                continue;
            }

            error_log('[ROLEPLAY IMPORT] Processing: ' . $data['title']);

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
                    error_log('[ROLEPLAY IMPORT] Updated existing post: ' . $post_id);
                    if ($post_id && !is_wp_error($post_id)) {
                        $updated++;
                    }
                }
            }

            // Create new if not updating
            if (!$post_id || $post_id === 0) {
                $post_id = wp_insert_post($post_data);
                error_log('[ROLEPLAY IMPORT] Created new post: ' . ($post_id ? $post_id : 'FAILED'));
                if ($post_id && !is_wp_error($post_id) && $post_id > 0) {
                    $imported++;
                }
            }

            // Skip if post creation/update failed
            if (!$post_id || is_wp_error($post_id) || $post_id === 0) {
                error_log('[ROLEPLAY IMPORT] Post creation failed for: ' . $data['title']);
                continue;
            }

            // Update meta fields (restore newlines in text fields)
            update_post_meta($post_id, '_roleplay_description', sanitize_textarea_field($restore_newlines($data['description'] ?? '')));
            update_post_meta($post_id, '_roleplay_long_description', sanitize_textarea_field($restore_newlines($data['long_description'] ?? '')));
            update_post_meta($post_id, '_roleplay_agent_id', sanitize_text_field($data['agent_id'] ?? ''));
            update_post_meta($post_id, '_roleplay_voice_id', sanitize_text_field($data['voice_id'] ?? ''));
            update_post_meta($post_id, '_roleplay_initial_message', sanitize_textarea_field($restore_newlines($data['initial_message'] ?? '')));
            update_post_meta($post_id, '_roleplay_difficulty', sanitize_text_field($data['difficulty'] ?? 'medium'));
            update_post_meta($post_id, '_roleplay_target_audience', sanitize_text_field($restore_newlines($data['target_audience'] ?? '')));

            // Category (JSON array)
            if (!empty($data['category'])) {
                $category = json_decode($data['category'], true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($category)) {
                    update_post_meta($post_id, '_roleplay_category', wp_json_encode($category));
                } else {
                    // Fallback: treat as single category slug
                    update_post_meta($post_id, '_roleplay_category', wp_json_encode(array(sanitize_title($data['category']))));
                }
            }

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

            // Tips (JSON array)
            if (!empty($data['tips'])) {
                $tips = json_decode($data['tips'], true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($tips)) {
                    update_post_meta($post_id, '_roleplay_tips', wp_json_encode($tips));
                }
            }
        }

        fclose($handle);

        error_log('[ROLEPLAY IMPORT] Done! Imported: ' . $imported . ', Updated: ' . $updated);

        wp_redirect(admin_url($redirect_base . '&imported=' . $imported . '&csv_updated=' . $updated));
        exit;
    }

    /**
     * Render checkboxes for setup selection
     */
    private function render_setups_checkboxes($current_value = '') {
        // Get all active setups from database
        $setups_manager = Bewerbungstrainer_Scenario_Setups::get_instance();
        $setups = $setups_manager->get_all_setups(true);

        // Parse current value (semicolon-separated slugs)
        $selected_slugs = array_filter(array_map('trim', explode(';', $current_value)));

        if (empty($setups)) {
            echo '<p class="description">Keine Setups verfügbar. <a href="' . admin_url('admin.php?page=bewerbungstrainer-setups') . '">Setups verwalten</a></p>';
            return;
        }

        echo '<div class="setups-checkboxes" style="display: flex; flex-wrap: wrap; gap: 12px;">';
        foreach ($setups as $setup) {
            $checked = in_array($setup['slug'], $selected_slugs) ? 'checked' : '';
            ?>
            <label style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 12px; background: <?php echo esc_attr($setup['color']); ?>10; border: 2px solid <?php echo esc_attr($setup['color']); ?>30; border-radius: 8px; cursor: pointer;">
                <input type="checkbox" name="roleplay_target_audience[]" value="<?php echo esc_attr($setup['slug']); ?>" <?php echo $checked; ?> style="margin: 0;">
                <span style="font-size: 16px;"><?php echo esc_html($setup['icon']); ?></span>
                <span style="font-weight: 500; color: #333;"><?php echo esc_html($setup['name']); ?></span>
            </label>
            <?php
        }
        echo '</div>';
    }
}
