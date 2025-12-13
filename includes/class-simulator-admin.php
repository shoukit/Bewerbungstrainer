<?php
/**
 * Simulator Admin Page
 *
 * Provides WordPress admin interface for managing Simulator scenarios
 *
 * @package Bewerbungstrainer
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Simulator Admin Class
 */
class Bewerbungstrainer_Simulator_Admin {

    /**
     * Instance of this class
     */
    private static $instance = null;

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
        $this->db = Bewerbungstrainer_Simulator_Database::get_instance();
        $this->init_hooks();
    }

    /**
     * Initialize hooks
     */
    private function init_hooks() {
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'handle_form_actions'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_scripts'));
    }

    /**
     * Add admin menu
     */
    public function add_admin_menu() {
        // Submenu under Bewerbungstrainer: All Scenarios
        add_submenu_page(
            'bewerbungstrainer',
            __('Szenario-Training', 'bewerbungstrainer'),
            __('Szenario-Training', 'bewerbungstrainer'),
            'manage_options',
            'simulator-scenarios',
            array($this, 'render_scenarios_page')
        );

        // Submenu: Add New (hidden, accessed via link)
        add_submenu_page(
            null,  // Hidden from menu
            __('Neues Szenario', 'bewerbungstrainer'),
            __('Neues Szenario', 'bewerbungstrainer'),
            'manage_options',
            'simulator-scenario-new',
            array($this, 'render_edit_page')
        );
    }

    /**
     * Enqueue admin scripts and styles
     */
    public function enqueue_admin_scripts($hook) {
        if (strpos($hook, 'simulator-scenario') === false) {
            return;
        }

        wp_enqueue_script('jquery-ui-sortable');

        // Add inline styles
        wp_add_inline_style('wp-admin', $this->get_admin_styles());
    }

    /**
     * Get admin CSS styles
     */
    private function get_admin_styles() {
        return '
            .simulator-variables-container {
                border: 1px solid #ddd;
                border-radius: 4px;
                padding: 15px;
                background: #f9f9f9;
            }
            .simulator-variable-item {
                background: #fff;
                border: 1px solid #ddd;
                border-radius: 4px;
                padding: 15px;
                margin-bottom: 10px;
                position: relative;
            }
            .simulator-variable-item:hover {
                border-color: #2271b1;
            }
            .simulator-variable-item .handle {
                cursor: move;
                color: #999;
                margin-right: 10px;
            }
            .simulator-variable-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 10px;
                padding-bottom: 10px;
                border-bottom: 1px solid #eee;
            }
            .simulator-variable-fields {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 10px;
            }
            .simulator-variable-fields .full-width {
                grid-column: 1 / -1;
            }
            .simulator-variable-fields label {
                display: block;
                font-weight: 600;
                margin-bottom: 4px;
                font-size: 12px;
            }
            .simulator-variable-fields input,
            .simulator-variable-fields select,
            .simulator-variable-fields textarea {
                width: 100%;
            }
            .simulator-options-container {
                margin-top: 10px;
                padding: 10px;
                background: #f5f5f5;
                border-radius: 4px;
            }
            .simulator-option-item {
                display: flex;
                gap: 10px;
                margin-bottom: 5px;
            }
            .simulator-option-item input {
                flex: 1;
            }
            .add-variable-btn, .add-option-btn {
                margin-top: 10px;
            }
            .remove-btn {
                color: #b32d2e;
                cursor: pointer;
                background: none;
                border: none;
                padding: 5px;
            }
            .remove-btn:hover {
                color: #dc3232;
            }
            .variable-key-preview {
                font-family: monospace;
                font-size: 11px;
                color: #666;
                background: #f0f0f0;
                padding: 2px 6px;
                border-radius: 3px;
            }
        ';
    }

    /**
     * Handle form submissions
     */
    public function handle_form_actions() {
        // Check if we're on our admin page
        if (!isset($_GET['page']) || strpos($_GET['page'], 'simulator-scenario') === false) {
            return;
        }

        // Handle delete action
        if (isset($_GET['action']) && $_GET['action'] === 'delete' && isset($_GET['id'])) {
            if (!wp_verify_nonce($_GET['_wpnonce'], 'delete_scenario_' . $_GET['id'])) {
                wp_die('Security check failed');
            }

            $this->db->delete_scenario(intval($_GET['id']));
            wp_redirect(admin_url('admin.php?page=simulator-scenarios&deleted=1'));
            exit;
        }

        // Handle form submission
        if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['simulator_scenario_nonce'])) {
            if (!wp_verify_nonce($_POST['simulator_scenario_nonce'], 'save_simulator_scenario')) {
                wp_die('Security check failed');
            }

            $data = $this->sanitize_scenario_data($_POST);

            if (isset($_POST['scenario_id']) && !empty($_POST['scenario_id'])) {
                // Update existing
                $this->db->update_scenario(intval($_POST['scenario_id']), $data);
                wp_redirect(admin_url('admin.php?page=simulator-scenarios&updated=1'));
            } else {
                // Create new
                $this->db->create_scenario($data);
                wp_redirect(admin_url('admin.php?page=simulator-scenarios&created=1'));
            }
            exit;
        }
    }

    /**
     * Sanitize scenario data from form
     */
    private function sanitize_scenario_data($post) {
        // Build input_configuration from visual builder data
        $input_configuration = $this->build_input_configuration_from_post($post);

        // Validate mode - only allow INTERVIEW or SIMULATION
        $mode = sanitize_text_field($post['mode'] ?? 'INTERVIEW');
        if (!in_array($mode, array('INTERVIEW', 'SIMULATION'))) {
            $mode = 'INTERVIEW';
        }

        return array(
            'title' => sanitize_text_field($post['title'] ?? ''),
            'description' => sanitize_textarea_field($post['description'] ?? ''),
            'icon' => sanitize_text_field($post['icon'] ?? 'briefcase'),
            'difficulty' => sanitize_text_field($post['difficulty'] ?? 'intermediate'),
            'category' => sanitize_text_field($post['category'] ?? ''),
            'mode' => $mode,
            'system_prompt' => wp_kses_post($post['system_prompt'] ?? ''),
            'question_generation_prompt' => wp_kses_post($post['question_generation_prompt'] ?? ''),
            'feedback_prompt' => wp_kses_post($post['feedback_prompt'] ?? ''),
            'input_configuration' => json_encode($input_configuration, JSON_UNESCAPED_UNICODE),
            'question_count_min' => intval($post['question_count_min'] ?? 8),
            'question_count_max' => intval($post['question_count_max'] ?? 12),
            'time_limit_per_question' => intval($post['time_limit_per_question'] ?? 120),
            'allow_retry' => isset($post['allow_retry']) ? 1 : 0,
            'is_active' => isset($post['is_active']) ? 1 : 0,
            'sort_order' => intval($post['sort_order'] ?? 0),
        );
    }

    /**
     * Build input_configuration array from POST data
     */
    private function build_input_configuration_from_post($post) {
        $config = array();

        if (!isset($post['var_key']) || !is_array($post['var_key'])) {
            return $config;
        }

        $count = count($post['var_key']);

        for ($i = 0; $i < $count; $i++) {
            $key = sanitize_key($post['var_key'][$i] ?? '');
            if (empty($key)) continue;

            $field = array(
                'key' => $key,
                'label' => sanitize_text_field($post['var_label'][$i] ?? ''),
                'type' => sanitize_text_field($post['var_type'][$i] ?? 'text'),
                'required' => isset($post['var_required'][$i]),
                'placeholder' => sanitize_text_field($post['var_placeholder'][$i] ?? ''),
            );

            // Handle default value
            if (!empty($post['var_default'][$i])) {
                $field['default'] = sanitize_text_field($post['var_default'][$i]);
            }

            // Handle options for select type
            if ($field['type'] === 'select' && isset($post['var_options'][$i])) {
                $options = array();
                $opt_values = $post['var_options'][$i]['value'] ?? array();
                $opt_labels = $post['var_options'][$i]['label'] ?? array();

                for ($j = 0; $j < count($opt_values); $j++) {
                    $opt_val = sanitize_text_field($opt_values[$j] ?? '');
                    $opt_label = sanitize_text_field($opt_labels[$j] ?? '');
                    if (!empty($opt_val)) {
                        $options[] = array('value' => $opt_val, 'label' => $opt_label);
                    }
                }

                if (!empty($options)) {
                    $field['options'] = $options;
                }
            }

            $config[] = $field;
        }

        return $config;
    }

    /**
     * Render scenarios list page
     */
    public function render_scenarios_page() {
        // Get all scenarios including inactive ones
        $scenarios = $this->db->get_scenarios(array('is_active' => null));

        // Show notices
        if (isset($_GET['deleted'])) {
            echo '<div class="notice notice-success is-dismissible"><p>Szenario gelöscht.</p></div>';
        }
        if (isset($_GET['updated'])) {
            echo '<div class="notice notice-success is-dismissible"><p>Szenario aktualisiert.</p></div>';
        }
        if (isset($_GET['created'])) {
            echo '<div class="notice notice-success is-dismissible"><p>Szenario erstellt.</p></div>';
        }
        ?>
        <div class="wrap">
            <h1 class="wp-heading-inline">Szenario-Training - Szenarien</h1>
            <a href="<?php echo admin_url('admin.php?page=simulator-scenario-new'); ?>" class="page-title-action">Neues Szenario hinzufügen</a>
            <hr class="wp-header-end">

            <table class="wp-list-table widefat fixed striped">
                <thead>
                    <tr>
                        <th style="width: 50px;">ID</th>
                        <th>Titel</th>
                        <th style="width: 100px;">Modus</th>
                        <th style="width: 100px;">Icon</th>
                        <th style="width: 120px;">Schwierigkeit</th>
                        <th style="width: 100px;">Variablen</th>
                        <th style="width: 100px;">Fragen</th>
                        <th style="width: 80px;">Aktiv</th>
                        <th style="width: 150px;">Aktionen</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (empty($scenarios)): ?>
                        <tr>
                            <td colspan="9">Keine Szenarien gefunden. <a href="<?php echo admin_url('admin.php?page=simulator-scenario-new'); ?>">Erstelle dein erstes Szenario</a>.</td>
                        </tr>
                    <?php else: ?>
                        <?php foreach ($scenarios as $scenario): ?>
                            <tr>
                                <td><?php echo esc_html($scenario->id); ?></td>
                                <td>
                                    <strong>
                                        <a href="<?php echo admin_url('admin.php?page=simulator-scenario-new&id=' . $scenario->id); ?>">
                                            <?php echo esc_html($scenario->title); ?>
                                        </a>
                                    </strong>
                                    <br>
                                    <span class="description"><?php echo esc_html(wp_trim_words($scenario->description, 10)); ?></span>
                                </td>
                                <td>
                                    <?php
                                    $mode = $scenario->mode ?? 'INTERVIEW';
                                    if ($mode === 'SIMULATION') {
                                        echo '<span style="color: #a855f7;">Simulation</span>';
                                    } else {
                                        echo '<span style="color: #3b82f6;">Interview</span>';
                                    }
                                    ?>
                                </td>
                                <td>
                                    <span class="dashicons dashicons-<?php echo esc_attr($this->get_dashicon($scenario->icon)); ?>"></span>
                                    <?php echo esc_html($scenario->icon); ?>
                                </td>
                                <td>
                                    <?php
                                    $diff_labels = array(
                                        'beginner' => '<span style="color: #22c55e;">Einsteiger</span>',
                                        'intermediate' => '<span style="color: #3b82f6;">Fortgeschritten</span>',
                                        'advanced' => '<span style="color: #a855f7;">Experte</span>',
                                    );
                                    echo $diff_labels[$scenario->difficulty] ?? esc_html($scenario->difficulty);
                                    ?>
                                </td>
                                <td>
                                    <?php
                                    $vars = is_array($scenario->input_configuration) ? $scenario->input_configuration : array();
                                    echo count($vars);
                                    ?>
                                </td>
                                <td><?php echo esc_html($scenario->question_count_min . '-' . $scenario->question_count_max); ?></td>
                                <td>
                                    <?php if ($scenario->is_active): ?>
                                        <span style="color: #22c55e;">&#10003; Ja</span>
                                    <?php else: ?>
                                        <span style="color: #94a3b8;">&#10007; Nein</span>
                                    <?php endif; ?>
                                </td>
                                <td>
                                    <a href="<?php echo admin_url('admin.php?page=simulator-scenario-new&id=' . $scenario->id); ?>" class="button button-small">Bearbeiten</a>
                                    <a href="<?php echo wp_nonce_url(admin_url('admin.php?page=simulator-scenarios&action=delete&id=' . $scenario->id), 'delete_scenario_' . $scenario->id); ?>"
                                       class="button button-small button-link-delete"
                                       onclick="return confirm('Szenario wirklich löschen?');">Löschen</a>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>

            <?php
            // Render CSV Import/Export UI
            $csv_handler = Bewerbungstrainer_Scenario_CSV_Handler::get_instance();
            $csv_handler->render_simulator_import_export_ui();
            ?>
        </div>
        <?php
    }

    /**
     * Render edit/new scenario page
     */
    public function render_edit_page() {
        $scenario = null;
        $is_edit = false;

        if (isset($_GET['id'])) {
            $scenario = $this->db->get_scenario(intval($_GET['id']));
            $is_edit = true;
        }

        // Default values for new scenario
        $defaults = array(
            'id' => '',
            'title' => '',
            'description' => '',
            'icon' => 'briefcase',
            'difficulty' => 'intermediate',
            'category' => 'CAREER',
            'system_prompt' => 'Du bist ein erfahrener HR-Manager und führst ein professionelles Gespräch. Der Bewerber ist ${name} und bewirbt sich für die Position ${position}.',
            'question_generation_prompt' => '',
            'feedback_prompt' => '',
            'input_configuration' => array(),
            'question_count_min' => 8,
            'question_count_max' => 12,
            'time_limit_per_question' => 120,
            'allow_retry' => 1,
            'is_active' => 1,
            'sort_order' => 0,
        );

        $data = $scenario ? (array) $scenario : $defaults;

        // Ensure input_configuration is an array
        if (!is_array($data['input_configuration'])) {
            $data['input_configuration'] = json_decode($data['input_configuration'], true) ?? array();
        }

        // Normalize legacy category values to new enum format
        $data['category'] = $this->normalize_category($data['category'] ?? 'CAREER');
        ?>
        <div class="wrap">
            <h1><?php echo $is_edit ? 'Szenario bearbeiten' : 'Neues Szenario erstellen'; ?></h1>

            <form method="post" action="">
                <?php wp_nonce_field('save_simulator_scenario', 'simulator_scenario_nonce'); ?>
                <input type="hidden" name="scenario_id" value="<?php echo esc_attr($data['id']); ?>">

                <div id="poststuff">
                    <div id="post-body" class="metabox-holder columns-2">

                        <!-- Main Content -->
                        <div id="post-body-content">

                            <!-- Basic Info -->
                            <div class="postbox">
                                <h2 class="hndle">Basis-Informationen</h2>
                                <div class="inside">
                                    <table class="form-table">
                                        <tr>
                                            <th><label for="title">Titel *</label></th>
                                            <td>
                                                <input type="text" name="title" id="title" value="<?php echo esc_attr($data['title']); ?>" class="regular-text" required>
                                            </td>
                                        </tr>
                                        <tr>
                                            <th><label for="description">Beschreibung</label></th>
                                            <td>
                                                <textarea name="description" id="description" rows="3" class="large-text"><?php echo esc_textarea($data['description']); ?></textarea>
                                                <p class="description">Wird den Nutzern bei der Szenario-Auswahl angezeigt.</p>
                                            </td>
                                        </tr>
                                        <tr>
                                            <th><label for="icon">Icon</label></th>
                                            <td>
                                                <select name="icon" id="icon">
                                                    <option value="briefcase" <?php selected($data['icon'], 'briefcase'); ?>>💼 Bewerbung</option>
                                                    <option value="banknote" <?php selected($data['icon'], 'banknote'); ?>>💰 Gehalt</option>
                                                    <option value="user" <?php selected($data['icon'], 'user'); ?>>👤 Person</option>
                                                    <option value="presentation" <?php selected($data['icon'], 'presentation'); ?>>📊 Präsentation</option>
                                                    <option value="target" <?php selected($data['icon'], 'target'); ?>>🎯 Ziel</option>
                                                    <option value="mic" <?php selected($data['icon'], 'mic'); ?>>🎤 Mikrofon</option>
                                                </select>
                                            </td>
                                        </tr>
                                        <tr>
                                            <th><label for="difficulty">Schwierigkeit</label></th>
                                            <td>
                                                <select name="difficulty" id="difficulty">
                                                    <option value="beginner" <?php selected($data['difficulty'], 'beginner'); ?>>Einsteiger</option>
                                                    <option value="intermediate" <?php selected($data['difficulty'], 'intermediate'); ?>>Fortgeschritten</option>
                                                    <option value="advanced" <?php selected($data['difficulty'], 'advanced'); ?>>Experte</option>
                                                </select>
                                            </td>
                                        </tr>
                                        <tr>
                                            <th><label for="category">Kategorie</label></th>
                                            <td>
                                                <select name="category" id="category" class="regular-text">
                                                    <option value="CAREER" <?php selected($data['category'], 'CAREER'); ?>>Bewerbung & Karriere</option>
                                                    <option value="LEADERSHIP" <?php selected($data['category'], 'LEADERSHIP'); ?>>Leadership & Führung</option>
                                                    <option value="SALES" <?php selected($data['category'], 'SALES'); ?>>Vertrieb & Verhandlung</option>
                                                    <option value="COMMUNICATION" <?php selected($data['category'], 'COMMUNICATION'); ?>>Kommunikation & Konflikt</option>
                                                </select>
                                                <p class="description">Thematische Einordnung des Szenarios für die Filterung im Dashboard.</p>
                                            </td>
                                        </tr>
                                        <tr>
                                            <th><label for="mode">Modus</label></th>
                                            <td>
                                                <select name="mode" id="mode">
                                                    <option value="INTERVIEW" <?php selected($data['mode'] ?? 'INTERVIEW', 'INTERVIEW'); ?>>Interview (KI stellt Fragen)</option>
                                                    <option value="SIMULATION" <?php selected($data['mode'] ?? 'INTERVIEW', 'SIMULATION'); ?>>Simulation (KI als Gegenspieler)</option>
                                                </select>
                                                <p class="description">
                                                    <strong>Interview:</strong> KI stellt Fragen, Nutzer antwortet.<br>
                                                    <strong>Simulation:</strong> KI agiert als Gegenspieler (Kunde, Klient, etc.), Nutzer reagiert/verhandelt.
                                                </p>
                                            </td>
                                        </tr>
                                    </table>
                                </div>
                            </div>

                            <!-- Variables -->
                            <div class="postbox">
                                <h2 class="hndle">Benutzer-Variablen</h2>
                                <div class="inside">
                                    <p class="description">Diese Variablen werden vom Benutzer vor dem Training eingegeben und können in den Prompts mit <code>${variable_key}</code> verwendet werden.</p>

                                    <div class="simulator-variables-container" id="variables-container">
                                        <?php
                                        if (!empty($data['input_configuration'])):
                                            foreach ($data['input_configuration'] as $index => $var):
                                                $this->render_variable_item($var, $index);
                                            endforeach;
                                        endif;
                                        ?>
                                    </div>

                                    <button type="button" class="button add-variable-btn" id="add-variable-btn">
                                        + Variable hinzufügen
                                    </button>
                                </div>
                            </div>

                            <!-- AI Prompts -->
                            <div class="postbox">
                                <h2 class="hndle">KI-Prompts</h2>
                                <div class="inside">
                                    <table class="form-table">
                                        <tr>
                                            <th><label for="system_prompt">System Prompt *</label></th>
                                            <td>
                                                <textarea name="system_prompt" id="system_prompt" rows="6" class="large-text" required><?php echo esc_textarea($data['system_prompt']); ?></textarea>
                                                <p class="description">
                                                    Definiert die Rolle der KI. Verwende <code>${variable_key}</code> für Variablen.<br>
                                                    Dieser Prompt wird an den Standard-System-Prompt angehängt.
                                                </p>
                                            </td>
                                        </tr>
                                        <tr>
                                            <th><label for="question_generation_prompt">Fragen-Generierung</label></th>
                                            <td>
                                                <textarea name="question_generation_prompt" id="question_generation_prompt" rows="6" class="large-text"><?php echo esc_textarea($data['question_generation_prompt']); ?></textarea>
                                                <p class="description">
                                                    Optional: Zusätzliche Anweisungen für die Fragengenerierung.<br>
                                                    Wird an den Standard-Prompt angehängt.
                                                </p>
                                            </td>
                                        </tr>
                                        <tr>
                                            <th><label for="feedback_prompt">Feedback-Prompt</label></th>
                                            <td>
                                                <textarea name="feedback_prompt" id="feedback_prompt" rows="6" class="large-text"><?php echo esc_textarea($data['feedback_prompt']); ?></textarea>
                                                <p class="description">
                                                    Optional: Zusätzliche Anweisungen für das Feedback.<br>
                                                    Wird an den Standard-Feedback-Prompt angehängt.
                                                </p>
                                            </td>
                                        </tr>
                                    </table>
                                </div>
                            </div>

                        </div>

                        <!-- Sidebar -->
                        <div id="postbox-container-1" class="postbox-container">

                            <!-- Publish Box -->
                            <div class="postbox">
                                <h2 class="hndle">Veröffentlichen</h2>
                                <div class="inside">
                                    <div class="submitbox">
                                        <p>
                                            <label>
                                                <input type="checkbox" name="is_active" value="1" <?php checked($data['is_active'], 1); ?>>
                                                <strong>Aktiv</strong> (für Benutzer sichtbar)
                                            </label>
                                        </p>
                                        <p>
                                            <label for="sort_order">Sortierung:</label>
                                            <input type="number" name="sort_order" id="sort_order" value="<?php echo esc_attr($data['sort_order']); ?>" min="0" style="width: 60px;">
                                        </p>
                                        <hr>
                                        <p>
                                            <input type="submit" name="submit" class="button button-primary button-large" value="<?php echo $is_edit ? 'Aktualisieren' : 'Erstellen'; ?>">
                                            <a href="<?php echo admin_url('admin.php?page=simulator-scenarios'); ?>" class="button">Abbrechen</a>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <!-- Settings Box -->
                            <div class="postbox">
                                <h2 class="hndle">Einstellungen</h2>
                                <div class="inside">
                                    <p>
                                        <label><strong>Anzahl Fragen:</strong></label><br>
                                        <input type="number" name="question_count_min" value="<?php echo esc_attr($data['question_count_min']); ?>" min="1" max="50" style="width: 60px;"> bis
                                        <input type="number" name="question_count_max" value="<?php echo esc_attr($data['question_count_max']); ?>" min="1" max="50" style="width: 60px;">
                                    </p>
                                    <p>
                                        <label for="time_limit_per_question"><strong>Zeitlimit pro Frage:</strong></label><br>
                                        <input type="number" name="time_limit_per_question" id="time_limit_per_question" value="<?php echo esc_attr($data['time_limit_per_question']); ?>" min="30" max="600" style="width: 80px;"> Sekunden
                                        <br><small>(= <?php echo round($data['time_limit_per_question'] / 60, 1); ?> Min)</small>
                                    </p>
                                    <p>
                                        <label>
                                            <input type="checkbox" name="allow_retry" value="1" <?php checked($data['allow_retry'], 1); ?>>
                                            Wiederholung erlauben
                                        </label>
                                    </p>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </form>
        </div>

        <!-- Variable Template (hidden) -->
        <template id="variable-template">
            <?php $this->render_variable_item(array(), '__INDEX__'); ?>
        </template>

        <script>
        jQuery(document).ready(function($) {
            var variableIndex = <?php echo !empty($data['input_configuration']) ? count($data['input_configuration']) : 0; ?>;

            // Add new variable
            $('#add-variable-btn').on('click', function() {
                var template = $('#variable-template').html();
                template = template.replace(/__INDEX__/g, variableIndex);
                $('#variables-container').append(template);
                variableIndex++;
            });

            // Remove variable
            $(document).on('click', '.remove-variable-btn', function() {
                $(this).closest('.simulator-variable-item').remove();
            });

            // Toggle options container based on type
            $(document).on('change', '.var-type-select', function() {
                var $container = $(this).closest('.simulator-variable-item');
                var $options = $container.find('.simulator-options-container');
                if ($(this).val() === 'select') {
                    $options.show();
                } else {
                    $options.hide();
                }
            });

            // Add option
            $(document).on('click', '.add-option-btn', function() {
                var $container = $(this).closest('.simulator-options-container');
                var $list = $container.find('.options-list');
                var index = $(this).closest('.simulator-variable-item').data('index');
                var optionHtml = '<div class="simulator-option-item">' +
                    '<input type="text" name="var_options[' + index + '][value][]" placeholder="Wert">' +
                    '<input type="text" name="var_options[' + index + '][label][]" placeholder="Anzeigetext">' +
                    '<button type="button" class="remove-btn remove-option-btn" title="Option entfernen">&times;</button>' +
                    '</div>';
                $list.append(optionHtml);
            });

            // Remove option
            $(document).on('click', '.remove-option-btn', function() {
                $(this).closest('.simulator-option-item').remove();
            });

            // Auto-generate key from label
            $(document).on('input', '.var-label-input', function() {
                var $item = $(this).closest('.simulator-variable-item');
                var $keyInput = $item.find('.var-key-input');
                var $keyPreview = $item.find('.variable-key-preview');

                // Only auto-generate if key is empty or was auto-generated
                if ($keyInput.data('manual') !== true) {
                    var label = $(this).val();
                    var key = label.toLowerCase()
                        .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
                        .replace(/[^a-z0-9]/g, '_')
                        .replace(/_+/g, '_')
                        .replace(/^_|_$/g, '');
                    $keyInput.val(key);
                    $keyPreview.text('${' + key + '}');
                }
            });

            // Mark key as manually edited
            $(document).on('input', '.var-key-input', function() {
                $(this).data('manual', true);
                var $item = $(this).closest('.simulator-variable-item');
                $item.find('.variable-key-preview').text('${' + $(this).val() + '}');
            });

            // Make variables sortable
            $('#variables-container').sortable({
                handle: '.handle',
                placeholder: 'ui-state-highlight',
                update: function() {
                    // Re-index after sort if needed
                }
            });
        });
        </script>
        <?php
    }

    /**
     * Render a single variable item
     */
    private function render_variable_item($var, $index) {
        $var = wp_parse_args($var, array(
            'key' => '',
            'label' => '',
            'type' => 'text',
            'required' => false,
            'placeholder' => '',
            'default' => '',
            'options' => array(),
        ));
        ?>
        <div class="simulator-variable-item" data-index="<?php echo esc_attr($index); ?>">
            <div class="simulator-variable-header">
                <span>
                    <span class="handle dashicons dashicons-menu"></span>
                    <strong class="var-title"><?php echo esc_html($var['label'] ?: 'Neue Variable'); ?></strong>
                    <span class="variable-key-preview">${<?php echo esc_html($var['key']); ?>}</span>
                </span>
                <button type="button" class="remove-btn remove-variable-btn" title="Variable entfernen">
                    <span class="dashicons dashicons-trash"></span>
                </button>
            </div>

            <div class="simulator-variable-fields">
                <div>
                    <label>Bezeichnung *</label>
                    <input type="text" name="var_label[]" value="<?php echo esc_attr($var['label']); ?>" class="var-label-input" required>
                </div>
                <div>
                    <label>Schlüssel (key) *</label>
                    <input type="text" name="var_key[]" value="<?php echo esc_attr($var['key']); ?>" class="var-key-input" pattern="[a-z_][a-z0-9_]*" required>
                </div>
                <div>
                    <label>Feldtyp</label>
                    <select name="var_type[]" class="var-type-select">
                        <option value="text" <?php selected($var['type'], 'text'); ?>>Text (einzeilig)</option>
                        <option value="textarea" <?php selected($var['type'], 'textarea'); ?>>Textbereich (mehrzeilig)</option>
                        <option value="select" <?php selected($var['type'], 'select'); ?>>Auswahl (Dropdown)</option>
                        <option value="number" <?php selected($var['type'], 'number'); ?>>Zahl</option>
                    </select>
                </div>
                <div>
                    <label>
                        <input type="checkbox" name="var_required[<?php echo esc_attr($index); ?>]" value="1" <?php checked($var['required'], true); ?>>
                        Pflichtfeld
                    </label>
                </div>
                <div class="full-width">
                    <label>Platzhalter-Text</label>
                    <input type="text" name="var_placeholder[]" value="<?php echo esc_attr($var['placeholder']); ?>">
                </div>
                <div class="full-width">
                    <label>Standardwert</label>
                    <input type="text" name="var_default[]" value="<?php echo esc_attr($var['default']); ?>">
                </div>
            </div>

            <!-- Options for select type -->
            <div class="simulator-options-container" style="<?php echo $var['type'] !== 'select' ? 'display:none;' : ''; ?>">
                <label><strong>Auswahloptionen:</strong></label>
                <div class="options-list">
                    <?php if (!empty($var['options'])): ?>
                        <?php foreach ($var['options'] as $option): ?>
                            <div class="simulator-option-item">
                                <input type="text" name="var_options[<?php echo esc_attr($index); ?>][value][]" value="<?php echo esc_attr($option['value']); ?>" placeholder="Wert">
                                <input type="text" name="var_options[<?php echo esc_attr($index); ?>][label][]" value="<?php echo esc_attr($option['label']); ?>" placeholder="Anzeigetext">
                                <button type="button" class="remove-btn remove-option-btn" title="Option entfernen">&times;</button>
                            </div>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </div>
                <button type="button" class="button button-small add-option-btn">+ Option hinzufügen</button>
            </div>
        </div>
        <?php
    }

    /**
     * Map icon names to dashicons
     */
    private function get_dashicon($icon) {
        $map = array(
            'briefcase' => 'portfolio',
            'banknote' => 'money-alt',
            'user' => 'admin-users',
            'presentation' => 'slides',
            'target' => 'yes',
            'mic' => 'microphone',
        );
        return $map[$icon] ?? 'admin-generic';
    }

    /**
     * Normalize legacy category values to new enum format
     *
     * @param string $category Category value (legacy or new)
     * @return string Normalized category key (CAREER, LEADERSHIP, SALES, COMMUNICATION)
     */
    private function normalize_category($category) {
        if (empty($category)) {
            return 'CAREER';
        }

        // Already in new format
        $upper = strtoupper($category);
        $valid_categories = array('CAREER', 'LEADERSHIP', 'SALES', 'COMMUNICATION');
        if (in_array($upper, $valid_categories)) {
            return $upper;
        }

        // Map legacy values to new format
        $legacy_map = array(
            'interview' => 'CAREER',
            'negotiation' => 'SALES',
            'presentation' => 'COMMUNICATION',
            'leadership' => 'LEADERSHIP',
            'communication' => 'COMMUNICATION',
            'sales' => 'SALES',
            'career' => 'CAREER',
        );

        $lower = strtolower($category);
        return $legacy_map[$lower] ?? 'CAREER';
    }

    /**
     * Get category label for display
     *
     * @param string $category Category key
     * @return string German label
     */
    private function get_category_label($category) {
        $labels = array(
            'CAREER' => 'Bewerbung & Karriere',
            'LEADERSHIP' => 'Leadership & Führung',
            'SALES' => 'Vertrieb & Verhandlung',
            'COMMUNICATION' => 'Kommunikation & Konflikt',
        );
        return $labels[strtoupper($category)] ?? $category;
    }
}
