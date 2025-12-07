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
        // Main menu item
        add_menu_page(
            'Skill Simulator',
            'Skill Simulator',
            'manage_options',
            'simulator-scenarios',
            array($this, 'render_scenarios_page'),
            'dashicons-target',
            31
        );

        // Submenu: All Scenarios
        add_submenu_page(
            'simulator-scenarios',
            'Alle Szenarien',
            'Alle Szenarien',
            'manage_options',
            'simulator-scenarios',
            array($this, 'render_scenarios_page')
        );

        // Submenu: Add New
        add_submenu_page(
            'simulator-scenarios',
            'Neues Szenario',
            'Neues Szenario',
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

        wp_enqueue_style('wp-codemirror');
        wp_enqueue_script('wp-codemirror');
        wp_enqueue_script('csslint');
        wp_enqueue_script('jshint');

        // CodeMirror JSON mode
        $cm_settings = wp_enqueue_code_editor(array('type' => 'application/json'));

        wp_add_inline_script(
            'wp-codemirror',
            'window.cmSettings = ' . wp_json_encode($cm_settings) . ';'
        );
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
        return array(
            'title' => sanitize_text_field($post['title'] ?? ''),
            'description' => sanitize_textarea_field($post['description'] ?? ''),
            'icon' => sanitize_text_field($post['icon'] ?? 'briefcase'),
            'difficulty' => sanitize_text_field($post['difficulty'] ?? 'intermediate'),
            'category' => sanitize_text_field($post['category'] ?? ''),
            'system_prompt' => wp_kses_post($post['system_prompt'] ?? ''),
            'question_generation_prompt' => wp_kses_post($post['question_generation_prompt'] ?? ''),
            'feedback_prompt' => wp_kses_post($post['feedback_prompt'] ?? ''),
            'input_configuration' => $post['input_configuration'] ?? '[]',
            'question_count_min' => intval($post['question_count_min'] ?? 8),
            'question_count_max' => intval($post['question_count_max'] ?? 12),
            'time_limit_per_question' => intval($post['time_limit_per_question'] ?? 120),
            'allow_retry' => isset($post['allow_retry']) ? 1 : 0,
            'is_active' => isset($post['is_active']) ? 1 : 0,
            'sort_order' => intval($post['sort_order'] ?? 0),
        );
    }

    /**
     * Render scenarios list page
     */
    public function render_scenarios_page() {
        $scenarios = $this->db->get_all_scenarios(false); // Include inactive

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
            <h1 class="wp-heading-inline">Skill Simulator - Szenarien</h1>
            <a href="<?php echo admin_url('admin.php?page=simulator-scenario-new'); ?>" class="page-title-action">Neues Szenario</a>
            <hr class="wp-header-end">

            <table class="wp-list-table widefat fixed striped">
                <thead>
                    <tr>
                        <th style="width: 50px;">ID</th>
                        <th>Titel</th>
                        <th style="width: 100px;">Icon</th>
                        <th style="width: 120px;">Schwierigkeit</th>
                        <th style="width: 100px;">Fragen</th>
                        <th style="width: 80px;">Aktiv</th>
                        <th style="width: 150px;">Aktionen</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (empty($scenarios)): ?>
                        <tr>
                            <td colspan="7">Keine Szenarien gefunden.</td>
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
            'category' => 'interview',
            'system_prompt' => 'Du bist ein erfahrener HR-Manager und führst ein professionelles Gespräch.',
            'question_generation_prompt' => '',
            'feedback_prompt' => '',
            'input_configuration' => '[]',
            'question_count_min' => 8,
            'question_count_max' => 12,
            'time_limit_per_question' => 120,
            'allow_retry' => 1,
            'is_active' => 1,
            'sort_order' => 0,
        );

        $data = $scenario ? (array) $scenario : $defaults;

        // Parse input_configuration for display
        $input_config = $data['input_configuration'];
        if (is_string($input_config)) {
            // Pretty print JSON
            $decoded = json_decode($input_config);
            if ($decoded !== null) {
                $input_config = json_encode($decoded, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
            }
        }
        ?>
        <div class="wrap">
            <h1><?php echo $is_edit ? 'Szenario bearbeiten' : 'Neues Szenario'; ?></h1>

            <form method="post" action="">
                <?php wp_nonce_field('save_simulator_scenario', 'simulator_scenario_nonce'); ?>
                <input type="hidden" name="scenario_id" value="<?php echo esc_attr($data['id']); ?>">

                <table class="form-table">
                    <!-- Basic Info -->
                    <tr>
                        <th scope="row"><label for="title">Titel *</label></th>
                        <td>
                            <input type="text" name="title" id="title" value="<?php echo esc_attr($data['title']); ?>" class="regular-text" required>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row"><label for="description">Beschreibung</label></th>
                        <td>
                            <textarea name="description" id="description" rows="3" class="large-text"><?php echo esc_textarea($data['description']); ?></textarea>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row"><label for="icon">Icon</label></th>
                        <td>
                            <select name="icon" id="icon">
                                <option value="briefcase" <?php selected($data['icon'], 'briefcase'); ?>>briefcase - Bewerbung</option>
                                <option value="banknote" <?php selected($data['icon'], 'banknote'); ?>>banknote - Gehalt</option>
                                <option value="user" <?php selected($data['icon'], 'user'); ?>>user - Person</option>
                                <option value="presentation" <?php selected($data['icon'], 'presentation'); ?>>presentation - Präsentation</option>
                                <option value="target" <?php selected($data['icon'], 'target'); ?>>target - Ziel</option>
                                <option value="mic" <?php selected($data['icon'], 'mic'); ?>>mic - Mikrofon</option>
                            </select>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row"><label for="difficulty">Schwierigkeit</label></th>
                        <td>
                            <select name="difficulty" id="difficulty">
                                <option value="beginner" <?php selected($data['difficulty'], 'beginner'); ?>>Einsteiger</option>
                                <option value="intermediate" <?php selected($data['difficulty'], 'intermediate'); ?>>Fortgeschritten</option>
                                <option value="advanced" <?php selected($data['difficulty'], 'advanced'); ?>>Experte</option>
                            </select>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row"><label for="category">Kategorie</label></th>
                        <td>
                            <input type="text" name="category" id="category" value="<?php echo esc_attr($data['category']); ?>" class="regular-text">
                            <p class="description">z.B. interview, negotiation, presentation</p>
                        </td>
                    </tr>

                    <!-- AI Prompts -->
                    <tr>
                        <th colspan="2"><h2>KI-Prompts</h2></th>
                    </tr>

                    <tr>
                        <th scope="row"><label for="system_prompt">System Prompt *</label></th>
                        <td>
                            <textarea name="system_prompt" id="system_prompt" rows="6" class="large-text" required><?php echo esc_textarea($data['system_prompt']); ?></textarea>
                            <p class="description">Definiert die Rolle der KI. Variablen: ${variable_name}</p>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row"><label for="question_generation_prompt">Fragen-Generierung Prompt</label></th>
                        <td>
                            <textarea name="question_generation_prompt" id="question_generation_prompt" rows="6" class="large-text"><?php echo esc_textarea($data['question_generation_prompt']); ?></textarea>
                            <p class="description">Optional: Spezifische Anweisungen für Fragengenerierung</p>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row"><label for="feedback_prompt">Feedback Prompt</label></th>
                        <td>
                            <textarea name="feedback_prompt" id="feedback_prompt" rows="6" class="large-text"><?php echo esc_textarea($data['feedback_prompt']); ?></textarea>
                            <p class="description">Optional: Spezifische Anweisungen für Feedback-Generierung</p>
                        </td>
                    </tr>

                    <!-- Input Configuration -->
                    <tr>
                        <th colspan="2"><h2>Eingabe-Konfiguration (JSON)</h2></th>
                    </tr>

                    <tr>
                        <th scope="row"><label for="input_configuration">Input Configuration</label></th>
                        <td>
                            <textarea name="input_configuration" id="input_configuration" rows="20" class="large-text code"><?php echo esc_textarea($input_config); ?></textarea>
                            <p class="description">
                                JSON-Array mit Eingabefeldern. Beispiel:<br>
                                <code>[{"key": "position", "label": "Zielposition", "type": "text", "required": true}]</code><br>
                                Typen: text, textarea, select, number
                            </p>
                        </td>
                    </tr>

                    <!-- Settings -->
                    <tr>
                        <th colspan="2"><h2>Einstellungen</h2></th>
                    </tr>

                    <tr>
                        <th scope="row"><label>Anzahl Fragen</label></th>
                        <td>
                            <input type="number" name="question_count_min" value="<?php echo esc_attr($data['question_count_min']); ?>" min="1" max="50" style="width: 80px;"> bis
                            <input type="number" name="question_count_max" value="<?php echo esc_attr($data['question_count_max']); ?>" min="1" max="50" style="width: 80px;">
                        </td>
                    </tr>

                    <tr>
                        <th scope="row"><label for="time_limit_per_question">Zeitlimit pro Frage (Sekunden)</label></th>
                        <td>
                            <input type="number" name="time_limit_per_question" id="time_limit_per_question" value="<?php echo esc_attr($data['time_limit_per_question']); ?>" min="30" max="600" style="width: 100px;">
                            <span class="description">(<?php echo round($data['time_limit_per_question'] / 60, 1); ?> Minuten)</span>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row">Optionen</th>
                        <td>
                            <label>
                                <input type="checkbox" name="allow_retry" value="1" <?php checked($data['allow_retry'], 1); ?>>
                                Wiederholung erlauben
                            </label>
                            <br><br>
                            <label>
                                <input type="checkbox" name="is_active" value="1" <?php checked($data['is_active'], 1); ?>>
                                Aktiv (für Benutzer sichtbar)
                            </label>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row"><label for="sort_order">Sortierung</label></th>
                        <td>
                            <input type="number" name="sort_order" id="sort_order" value="<?php echo esc_attr($data['sort_order']); ?>" min="0" style="width: 80px;">
                            <p class="description">Niedrigere Zahlen werden zuerst angezeigt</p>
                        </td>
                    </tr>
                </table>

                <p class="submit">
                    <input type="submit" name="submit" class="button button-primary" value="<?php echo $is_edit ? 'Szenario aktualisieren' : 'Szenario erstellen'; ?>">
                    <a href="<?php echo admin_url('admin.php?page=simulator-scenarios'); ?>" class="button">Abbrechen</a>
                </p>
            </form>
        </div>

        <script>
        jQuery(document).ready(function($) {
            // Initialize CodeMirror for JSON field
            if (window.cmSettings && typeof wp.codeEditor !== 'undefined') {
                var editorSettings = wp.codeEditor.defaultSettings ? _.clone(wp.codeEditor.defaultSettings) : {};
                editorSettings.codemirror = _.extend({}, editorSettings.codemirror, {
                    mode: 'application/json',
                    lineNumbers: true,
                    lineWrapping: true,
                    autoCloseBrackets: true,
                    matchBrackets: true
                });
                wp.codeEditor.initialize($('#input_configuration'), editorSettings);
            }
        });
        </script>
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
}
