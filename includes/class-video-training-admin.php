<?php
/**
 * Video Training Admin Class
 *
 * Handles WordPress admin functionality for Video Training scenarios
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

class Bewerbungstrainer_Video_Training_Admin {

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
        $this->db = Bewerbungstrainer_Video_Training_Database::get_instance();

        // Add admin menu
        add_action('admin_menu', array($this, 'add_admin_menu'));

        // Handle form submissions
        add_action('admin_init', array($this, 'handle_form_submissions'));

        // Handle CSV import/export
        add_action('admin_init', array($this, 'handle_csv_actions'));

        // Enqueue admin scripts
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_scripts'));
    }

    /**
     * Add admin menu items
     */
    public function add_admin_menu() {
        // Submenu under Bewerbungstrainer
        add_submenu_page(
            'bewerbungstrainer',
            __('Wirkungs-Analyse', 'bewerbungstrainer'),
            __('Wirkungs-Analyse', 'bewerbungstrainer'),
            'manage_options',
            'bewerbungstrainer-video-training',
            array($this, 'render_admin_page'),
            3 // Position: after Szenario-Training
        );

        // Submenu: Add New (hidden, accessed via link)
        add_submenu_page(
            null,  // Hidden from menu
            __('Neues Video-Szenario', 'bewerbungstrainer'),
            __('Neues Video-Szenario', 'bewerbungstrainer'),
            'manage_options',
            'bewerbungstrainer-video-training-new',
            array($this, 'render_new_scenario_page')
        );
    }

    /**
     * Render new scenario page (redirects to form with action=new)
     */
    public function render_new_scenario_page() {
        // Set action to 'new' for the form
        $_GET['action'] = 'new';
        $this->render_admin_page();
    }

    /**
     * Enqueue admin scripts
     */
    public function enqueue_admin_scripts($hook) {
        if (strpos($hook, 'bewerbungstrainer-video-training') === false) {
            return;
        }

        wp_enqueue_style('bewerbungstrainer-admin');
    }

    /**
     * Handle form submissions
     */
    public function handle_form_submissions() {
        if (!current_user_can('manage_options')) {
            return;
        }

        // Create scenario
        if (isset($_POST['video_training_create_scenario']) && wp_verify_nonce($_POST['_wpnonce'], 'video_training_create_scenario')) {
            $this->handle_create_scenario();
        }

        // Update scenario
        if (isset($_POST['video_training_update_scenario']) && wp_verify_nonce($_POST['_wpnonce'], 'video_training_update_scenario')) {
            $this->handle_update_scenario();
        }

        // Delete scenario
        if (isset($_GET['action']) && $_GET['action'] === 'delete' && isset($_GET['scenario_id'])) {
            if (wp_verify_nonce($_GET['_wpnonce'], 'delete_video_scenario_' . $_GET['scenario_id'])) {
                $this->handle_delete_scenario(intval($_GET['scenario_id']));
            }
        }

        // Toggle active status
        if (isset($_GET['action']) && $_GET['action'] === 'toggle_active' && isset($_GET['scenario_id'])) {
            if (wp_verify_nonce($_GET['_wpnonce'], 'toggle_video_scenario_' . $_GET['scenario_id'])) {
                $this->handle_toggle_active(intval($_GET['scenario_id']));
            }
        }
    }

    /**
     * Handle create scenario
     */
    private function handle_create_scenario() {
        $data = $this->sanitize_scenario_data($_POST);

        $result = $this->db->create_scenario($data);

        if ($result) {
            wp_redirect(admin_url('admin.php?page=bewerbungstrainer-video-training&message=created'));
            exit;
        } else {
            wp_redirect(admin_url('admin.php?page=bewerbungstrainer-video-training&error=create_failed'));
            exit;
        }
    }

    /**
     * Handle update scenario
     */
    private function handle_update_scenario() {
        $scenario_id = intval($_POST['scenario_id']);
        $data = $this->sanitize_scenario_data($_POST);

        $result = $this->db->update_scenario($scenario_id, $data);

        if ($result !== false) {
            wp_redirect(admin_url('admin.php?page=bewerbungstrainer-video-training&message=updated'));
            exit;
        } else {
            wp_redirect(admin_url('admin.php?page=bewerbungstrainer-video-training&error=update_failed'));
            exit;
        }
    }

    /**
     * Handle delete scenario
     */
    private function handle_delete_scenario($scenario_id) {
        $result = $this->db->delete_scenario($scenario_id);

        if ($result) {
            wp_redirect(admin_url('admin.php?page=bewerbungstrainer-video-training&message=deleted'));
            exit;
        } else {
            wp_redirect(admin_url('admin.php?page=bewerbungstrainer-video-training&error=delete_failed'));
            exit;
        }
    }

    /**
     * Handle toggle active status
     */
    private function handle_toggle_active($scenario_id) {
        $scenario = $this->db->get_scenario($scenario_id);

        if ($scenario) {
            $new_status = $scenario->is_active ? 0 : 1;
            $this->db->update_scenario($scenario_id, array('is_active' => $new_status));
        }

        wp_redirect(admin_url('admin.php?page=bewerbungstrainer-video-training'));
        exit;
    }

    /**
     * Sanitize scenario data from form
     */
    private function sanitize_scenario_data($data) {
        // Handle target_audience (checkboxes array to semicolon-separated string)
        $target_audience = '';
        if (isset($data['target_audience']) && is_array($data['target_audience'])) {
            $target_audience = implode('; ', array_map('sanitize_text_field', $data['target_audience']));
        }

        $sanitized = array(
            'title' => sanitize_text_field($data['title'] ?? ''),
            'description' => sanitize_textarea_field($data['description'] ?? ''),
            'icon' => sanitize_text_field($data['icon'] ?? 'video'),
            'difficulty' => sanitize_text_field($data['difficulty'] ?? 'intermediate'),
            'category' => Bewerbungstrainer_Categories_Admin::parse_categories_input($data['categories'] ?? array()),
            'target_audience' => $target_audience,
            'scenario_type' => sanitize_text_field($data['scenario_type'] ?? 'interview'),
            'system_prompt' => wp_kses_post($data['system_prompt'] ?? ''),
            'question_generation_prompt' => wp_kses_post($data['question_generation_prompt'] ?? ''),
            'feedback_prompt' => wp_kses_post($data['feedback_prompt'] ?? ''),
            'question_count' => intval($data['question_count'] ?? 5),
            'time_limit_per_question' => intval($data['time_limit_per_question'] ?? 120),
            'total_time_limit' => intval($data['total_time_limit'] ?? 900),
            'enable_tips' => isset($data['enable_tips']) ? 1 : 0,
            'enable_navigation' => isset($data['enable_navigation']) ? 1 : 0,
            'is_active' => isset($data['is_active']) ? 1 : 0,
            'sort_order' => intval($data['sort_order'] ?? 0),
        );

        // Handle input configuration JSON
        if (isset($data['input_configuration'])) {
            $config = json_decode(stripslashes($data['input_configuration']), true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $sanitized['input_configuration'] = $config;
            } else {
                $sanitized['input_configuration'] = array();
            }
        }

        return $sanitized;
    }

    /**
     * Render admin page
     */
    public function render_admin_page() {
        // Determine current view
        $action = isset($_GET['action']) ? $_GET['action'] : 'list';
        $scenario_id = isset($_GET['scenario_id']) ? intval($_GET['scenario_id']) : 0;

        // Show messages
        $this->render_admin_notices();

        switch ($action) {
            case 'new':
                $this->render_scenario_form();
                break;
            case 'edit':
                $scenario = $this->db->get_scenario($scenario_id);
                if ($scenario) {
                    $this->render_scenario_form($scenario);
                } else {
                    $this->render_scenarios_list();
                }
                break;
            default:
                $this->render_scenarios_list();
        }
    }

    /**
     * Render admin notices
     */
    private function render_admin_notices() {
        if (isset($_GET['message'])) {
            $messages = array(
                'created' => __('Szenario erfolgreich erstellt.', 'bewerbungstrainer'),
                'updated' => __('Szenario erfolgreich aktualisiert.', 'bewerbungstrainer'),
                'deleted' => __('Szenario erfolgreich gelöscht.', 'bewerbungstrainer'),
            );
            $message = isset($messages[$_GET['message']]) ? $messages[$_GET['message']] : '';
            if ($message) {
                echo '<div class="notice notice-success is-dismissible"><p>' . esc_html($message) . '</p></div>';
            }
        }

        if (isset($_GET['error'])) {
            $errors = array(
                'create_failed' => __('Fehler beim Erstellen des Szenarios.', 'bewerbungstrainer'),
                'update_failed' => __('Fehler beim Aktualisieren des Szenarios.', 'bewerbungstrainer'),
                'delete_failed' => __('Fehler beim Löschen des Szenarios.', 'bewerbungstrainer'),
            );
            $error = isset($errors[$_GET['error']]) ? $errors[$_GET['error']] : '';
            if ($error) {
                echo '<div class="notice notice-error is-dismissible"><p>' . esc_html($error) . '</p></div>';
            }
        }
    }

    /**
     * Handle CSV import/export actions
     */
    public function handle_csv_actions() {
        if (!current_user_can('manage_options')) {
            return;
        }

        // Export CSV
        if (isset($_GET['action']) && $_GET['action'] === 'export_csv' && isset($_GET['page']) && $_GET['page'] === 'bewerbungstrainer-video-training') {
            if (!wp_verify_nonce($_GET['_wpnonce'], 'export_video_scenarios')) {
                wp_die('Security check failed');
            }
            $this->export_scenarios_csv();
            exit;
        }

        // Import CSV
        if (isset($_POST['video_import_csv']) && isset($_FILES['csv_file'])) {
            if (!wp_verify_nonce($_POST['_wpnonce'], 'import_video_scenarios')) {
                wp_die('Security check failed');
            }
            $this->import_scenarios_csv($_FILES['csv_file']);
        }
    }

    /**
     * Export scenarios to CSV
     */
    private function export_scenarios_csv() {
        $scenarios = $this->db->get_scenarios(array('is_active' => null));

        $filename = 'video-training-scenarios-' . date('Y-m-d-His') . '.csv';

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
            'icon',
            'difficulty',
            'target_audience',
            'category',
            'scenario_type',
            'system_prompt',
            'question_generation_prompt',
            'feedback_prompt',
            'input_configuration',
            'question_count',
            'time_limit_per_question',
            'total_time_limit',
            'enable_tips',
            'enable_navigation',
            'is_active',
            'sort_order'
        ), ';');

        // Data rows
        foreach ($scenarios as $scenario) {
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

            // Clean JSON config - decode and re-encode with proper flags
            $input_config = $scenario->input_configuration;
            if (is_array($input_config)) {
                $input_config = json_encode($input_config, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            } elseif (is_string($input_config) && !empty($input_config)) {
                $decoded = json_decode($input_config, true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                    $input_config = json_encode($decoded, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                }
            }

            fputcsv($output, array(
                $scenario->id,
                $clean_text($scenario->title),
                $clean_text($scenario->description),
                $scenario->icon,
                $scenario->difficulty,
                $clean_text($scenario->target_audience ?? ''),
                $scenario->category,
                $scenario->scenario_type,
                $clean_text($scenario->system_prompt),
                $clean_text($scenario->question_generation_prompt),
                $clean_text($scenario->feedback_prompt),
                $input_config,
                $scenario->question_count,
                $scenario->time_limit_per_question,
                $scenario->total_time_limit,
                $scenario->enable_tips,
                $scenario->enable_navigation,
                $scenario->is_active,
                $scenario->sort_order
            ), ';');
        }

        fclose($output);
    }

    /**
     * Import scenarios from CSV
     */
    private function import_scenarios_csv($file) {
        if ($file['error'] !== UPLOAD_ERR_OK) {
            wp_redirect(admin_url('admin.php?page=bewerbungstrainer-video-training&import_error=upload'));
            exit;
        }

        $handle = fopen($file['tmp_name'], 'r');
        if (!$handle) {
            wp_redirect(admin_url('admin.php?page=bewerbungstrainer-video-training&import_error=read'));
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
            wp_redirect(admin_url('admin.php?page=bewerbungstrainer-video-training&import_error=format'));
            exit;
        }

        $imported = 0;
        $updated = 0;

        // Helper to restore newlines from literal \n
        $restore_newlines = function($text) {
            if (empty($text)) return '';
            return str_replace('\\n', "\n", $text);
        };

        while (($row = fgetcsv($handle, 0, ';')) !== false) {
            if (count($row) < count($header)) {
                continue;
            }

            $data = array_combine($header, $row);

            // Parse input_configuration JSON
            $input_config = array();
            if (!empty($data['input_configuration'])) {
                $parsed = json_decode($data['input_configuration'], true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    $input_config = $parsed;
                }
            }

            // Prepare scenario data (restore newlines in text fields)
            $scenario_data = array(
                'title' => sanitize_text_field($restore_newlines($data['title'] ?? '')),
                'description' => sanitize_textarea_field($restore_newlines($data['description'] ?? '')),
                'icon' => sanitize_text_field($data['icon'] ?? 'video'),
                'difficulty' => sanitize_text_field($data['difficulty'] ?? 'intermediate'),
                'target_audience' => sanitize_text_field($restore_newlines($data['target_audience'] ?? '')),
                'category' => Bewerbungstrainer_Categories_Admin::parse_categories_input($data['category'] ?? array()),
                'scenario_type' => sanitize_text_field($data['scenario_type'] ?? 'interview'),
                'system_prompt' => wp_kses_post($restore_newlines($data['system_prompt'] ?? '')),
                'question_generation_prompt' => wp_kses_post($restore_newlines($data['question_generation_prompt'] ?? '')),
                'feedback_prompt' => wp_kses_post($restore_newlines($data['feedback_prompt'] ?? '')),
                'input_configuration' => $input_config,
                'question_count' => intval($data['question_count'] ?? 5),
                'time_limit_per_question' => intval($data['time_limit_per_question'] ?? 120),
                'total_time_limit' => intval($data['total_time_limit'] ?? 900),
                'enable_tips' => intval($data['enable_tips'] ?? 1),
                'enable_navigation' => intval($data['enable_navigation'] ?? 1),
                'is_active' => intval($data['is_active'] ?? 1),
                'sort_order' => intval($data['sort_order'] ?? 0),
            );

            // Check if updating existing by ID
            if (!empty($data['id']) && is_numeric($data['id'])) {
                $existing = $this->db->get_scenario(intval($data['id']));
                if ($existing) {
                    $this->db->update_scenario(intval($data['id']), $scenario_data);
                    $updated++;
                    continue;
                }
            }

            // Create new
            $this->db->create_scenario($scenario_data);
            $imported++;
        }

        fclose($handle);

        wp_redirect(admin_url('admin.php?page=bewerbungstrainer-video-training&imported=' . $imported . '&csv_updated=' . $updated));
        exit;
    }

    /**
     * Render scenarios list
     */
    private function render_scenarios_list() {
        $scenarios = $this->db->get_scenarios(array('is_active' => null));

        // Show import notices
        if (isset($_GET['imported'])) {
            $imported = intval($_GET['imported']);
            $updated = isset($_GET['csv_updated']) ? intval($_GET['csv_updated']) : 0;
            echo '<div class="notice notice-success is-dismissible"><p>' . sprintf('%d Szenario(s) importiert, %d aktualisiert.', $imported, $updated) . '</p></div>';
        }
        if (isset($_GET['import_error'])) {
            $errors = array(
                'upload' => 'Fehler beim Hochladen der Datei.',
                'read' => 'Fehler beim Lesen der Datei.',
                'format' => 'Ungültiges CSV-Format. Bitte exportiere zuerst eine Vorlage.',
            );
            $error_msg = $errors[$_GET['import_error']] ?? 'Unbekannter Fehler beim Import.';
            echo '<div class="notice notice-error is-dismissible"><p>' . esc_html($error_msg) . '</p></div>';
        }
        ?>
        <div class="wrap">
            <h1 class="wp-heading-inline"><?php _e('Video Training Szenarien', 'bewerbungstrainer'); ?></h1>
            <a href="<?php echo admin_url('admin.php?page=bewerbungstrainer-video-training&action=new'); ?>" class="page-title-action">
                <?php _e('Neues Szenario', 'bewerbungstrainer'); ?>
            </a>
            <a href="<?php echo wp_nonce_url(admin_url('admin.php?page=bewerbungstrainer-video-training&action=export_csv'), 'export_video_scenarios'); ?>" class="page-title-action">
                <?php _e('CSV Export', 'bewerbungstrainer'); ?>
            </a>
            <hr class="wp-header-end">

            <!-- Import Form -->
            <div style="margin: 15px 0; padding: 15px; background: #fff; border: 1px solid #ccd0d4; border-radius: 4px;">
                <form method="post" enctype="multipart/form-data" style="display: flex; align-items: center; gap: 10px;">
                    <?php wp_nonce_field('import_video_scenarios'); ?>
                    <label><strong>CSV Import:</strong></label>
                    <input type="file" name="csv_file" accept=".csv" required>
                    <button type="submit" name="video_import_csv" class="button"><?php _e('Importieren', 'bewerbungstrainer'); ?></button>
                    <span class="description"><?php _e('CSV-Datei mit Semikolon (;) als Trennzeichen', 'bewerbungstrainer'); ?></span>
                </form>
            </div>

            <p class="description">
                <?php _e('Verwalten Sie die Video-Training Szenarien. Benutzer können diese für ihre Video-Aufnahmen auswählen.', 'bewerbungstrainer'); ?>
            </p>

            <table class="wp-list-table widefat fixed striped">
                <thead>
                    <tr>
                        <th width="5%"><?php _e('ID', 'bewerbungstrainer'); ?></th>
                        <th width="20%"><?php _e('Titel', 'bewerbungstrainer'); ?></th>
                        <th width="15%"><?php _e('Typ', 'bewerbungstrainer'); ?></th>
                        <th width="10%"><?php _e('Schwierigkeit', 'bewerbungstrainer'); ?></th>
                        <th width="10%"><?php _e('Fragen', 'bewerbungstrainer'); ?></th>
                        <th width="10%"><?php _e('Status', 'bewerbungstrainer'); ?></th>
                        <th width="10%"><?php _e('Reihenfolge', 'bewerbungstrainer'); ?></th>
                        <th width="20%"><?php _e('Aktionen', 'bewerbungstrainer'); ?></th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (empty($scenarios)): ?>
                        <tr>
                            <td colspan="8"><?php _e('Keine Szenarien gefunden.', 'bewerbungstrainer'); ?></td>
                        </tr>
                    <?php else: ?>
                        <?php foreach ($scenarios as $scenario): ?>
                            <tr>
                                <td><?php echo esc_html($scenario->id); ?></td>
                                <td>
                                    <strong><?php echo esc_html($scenario->title); ?></strong>
                                    <?php if ($scenario->description): ?>
                                        <br><small><?php echo esc_html(wp_trim_words($scenario->description, 10)); ?></small>
                                    <?php endif; ?>
                                </td>
                                <td><?php echo esc_html($this->get_scenario_type_label($scenario->scenario_type)); ?></td>
                                <td><?php echo esc_html($this->get_difficulty_label($scenario->difficulty)); ?></td>
                                <td><?php echo esc_html($scenario->question_count); ?></td>
                                <td>
                                    <?php if ($scenario->is_active): ?>
                                        <span class="dashicons dashicons-yes-alt" style="color: green;"></span> <?php _e('Aktiv', 'bewerbungstrainer'); ?>
                                    <?php else: ?>
                                        <span class="dashicons dashicons-no-alt" style="color: red;"></span> <?php _e('Inaktiv', 'bewerbungstrainer'); ?>
                                    <?php endif; ?>
                                </td>
                                <td><?php echo esc_html($scenario->sort_order); ?></td>
                                <td>
                                    <a href="<?php echo admin_url('admin.php?page=bewerbungstrainer-video-training&action=edit&scenario_id=' . $scenario->id); ?>" class="button button-small">
                                        <?php _e('Bearbeiten', 'bewerbungstrainer'); ?>
                                    </a>
                                    <a href="<?php echo wp_nonce_url(admin_url('admin.php?page=bewerbungstrainer-video-training&action=toggle_active&scenario_id=' . $scenario->id), 'toggle_video_scenario_' . $scenario->id); ?>" class="button button-small">
                                        <?php echo $scenario->is_active ? __('Deaktivieren', 'bewerbungstrainer') : __('Aktivieren', 'bewerbungstrainer'); ?>
                                    </a>
                                    <a href="<?php echo wp_nonce_url(admin_url('admin.php?page=bewerbungstrainer-video-training&action=delete&scenario_id=' . $scenario->id), 'delete_video_scenario_' . $scenario->id); ?>" class="button button-small button-link-delete" onclick="return confirm('<?php _e('Szenario wirklich löschen?', 'bewerbungstrainer'); ?>');">
                                        <?php _e('Löschen', 'bewerbungstrainer'); ?>
                                    </a>
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
     * Render scenario form (create/edit)
     */
    private function render_scenario_form($scenario = null) {
        $is_edit = $scenario !== null;
        $form_action = $is_edit ? 'video_training_update_scenario' : 'video_training_create_scenario';
        $page_title = $is_edit ? __('Szenario bearbeiten', 'bewerbungstrainer') : __('Neues Szenario', 'bewerbungstrainer');

        // Default values
        $defaults = array(
            'title' => '',
            'description' => '',
            'icon' => 'video',
            'difficulty' => 'intermediate',
            'category' => json_encode(array()),
            'scenario_type' => 'interview',
            'system_prompt' => '',
            'question_generation_prompt' => '',
            'feedback_prompt' => '',
            'input_configuration' => array(),
            'question_count' => 5,
            'time_limit_per_question' => 120,
            'total_time_limit' => 900,
            'enable_tips' => 1,
            'enable_navigation' => 1,
            'is_active' => 1,
            'sort_order' => 0,
        );

        $values = $is_edit ? (array) $scenario : $defaults;

        ?>
        <div class="wrap">
            <h1><?php echo esc_html($page_title); ?></h1>

            <form method="post" action="">
                <?php wp_nonce_field($form_action); ?>
                <?php if ($is_edit): ?>
                    <input type="hidden" name="scenario_id" value="<?php echo esc_attr($scenario->id); ?>">
                <?php endif; ?>

                <table class="form-table">
                    <!-- Basic Information -->
                    <tr>
                        <th scope="row">
                            <label for="title"><?php _e('Titel', 'bewerbungstrainer'); ?> *</label>
                        </th>
                        <td>
                            <input type="text" name="title" id="title" class="regular-text" required
                                   value="<?php echo esc_attr($values['title']); ?>">
                        </td>
                    </tr>

                    <tr>
                        <th scope="row">
                            <label for="description"><?php _e('Beschreibung', 'bewerbungstrainer'); ?></label>
                        </th>
                        <td>
                            <textarea name="description" id="description" class="large-text" rows="3"><?php echo esc_textarea($values['description']); ?></textarea>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row">
                            <label for="scenario_type"><?php _e('Szenario-Typ', 'bewerbungstrainer'); ?></label>
                        </th>
                        <td>
                            <select name="scenario_type" id="scenario_type">
                                <option value="self_presentation" <?php selected($values['scenario_type'], 'self_presentation'); ?>><?php _e('Selbstpräsentation', 'bewerbungstrainer'); ?></option>
                                <option value="interview" <?php selected($values['scenario_type'], 'interview'); ?>><?php _e('Bewerbungsgespräch', 'bewerbungstrainer'); ?></option>
                                <option value="pitch" <?php selected($values['scenario_type'], 'pitch'); ?>><?php _e('Elevator Pitch', 'bewerbungstrainer'); ?></option>
                                <option value="negotiation" <?php selected($values['scenario_type'], 'negotiation'); ?>><?php _e('Verhandlung', 'bewerbungstrainer'); ?></option>
                                <option value="custom" <?php selected($values['scenario_type'], 'custom'); ?>><?php _e('Benutzerdefiniert', 'bewerbungstrainer'); ?></option>
                            </select>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row">
                            <label for="icon"><?php _e('Icon', 'bewerbungstrainer'); ?></label>
                        </th>
                        <td>
                            <select name="icon" id="icon">
                                <option value="video" <?php selected($values['icon'], 'video'); ?>>Video</option>
                                <option value="user" <?php selected($values['icon'], 'user'); ?>>User</option>
                                <option value="briefcase" <?php selected($values['icon'], 'briefcase'); ?>>Briefcase</option>
                                <option value="presentation" <?php selected($values['icon'], 'presentation'); ?>>Presentation</option>
                                <option value="mic" <?php selected($values['icon'], 'mic'); ?>>Microphone</option>
                                <option value="target" <?php selected($values['icon'], 'target'); ?>>Target</option>
                                <option value="banknote" <?php selected($values['icon'], 'banknote'); ?>>Banknote</option>
                            </select>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row">
                            <label for="difficulty"><?php _e('Schwierigkeit', 'bewerbungstrainer'); ?></label>
                        </th>
                        <td>
                            <select name="difficulty" id="difficulty">
                                <option value="beginner" <?php selected($values['difficulty'], 'beginner'); ?>><?php _e('Einsteiger', 'bewerbungstrainer'); ?></option>
                                <option value="intermediate" <?php selected($values['difficulty'], 'intermediate'); ?>><?php _e('Fortgeschritten', 'bewerbungstrainer'); ?></option>
                                <option value="advanced" <?php selected($values['difficulty'], 'advanced'); ?>><?php _e('Experte', 'bewerbungstrainer'); ?></option>
                            </select>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row">
                            <label><?php _e('Kategorien', 'bewerbungstrainer'); ?></label>
                        </th>
                        <td>
                            <?php Bewerbungstrainer_Categories_Admin::render_category_checkboxes(
                                Bewerbungstrainer_Categories_Admin::get_categories_array($values['category']),
                                'categories'
                            ); ?>
                            <p class="description" style="margin-top: 8px;">
                                <a href="<?php echo admin_url('admin.php?page=bewerbungstrainer-categories'); ?>"><?php _e('Kategorien verwalten', 'bewerbungstrainer'); ?></a>
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row">
                            <label><?php _e('Trainings-Setups', 'bewerbungstrainer'); ?></label>
                        </th>
                        <td>
                            <?php $this->render_setups_checkboxes($values['target_audience'] ?? ''); ?>
                            <p class="description">Wähle die Setups, in denen dieses Szenario angezeigt werden soll.</p>
                        </td>
                    </tr>

                    <!-- Time Settings -->
                    <tr>
                        <th scope="row">
                            <label for="question_count"><?php _e('Anzahl Fragen', 'bewerbungstrainer'); ?></label>
                        </th>
                        <td>
                            <input type="number" name="question_count" id="question_count" class="small-text" min="1" max="20"
                                   value="<?php echo esc_attr($values['question_count']); ?>">
                        </td>
                    </tr>

                    <tr>
                        <th scope="row">
                            <label for="time_limit_per_question"><?php _e('Zeit pro Frage (Sekunden)', 'bewerbungstrainer'); ?></label>
                        </th>
                        <td>
                            <input type="number" name="time_limit_per_question" id="time_limit_per_question" class="small-text" min="30" max="600"
                                   value="<?php echo esc_attr($values['time_limit_per_question']); ?>">
                        </td>
                    </tr>

                    <tr>
                        <th scope="row">
                            <label for="total_time_limit"><?php _e('Gesamtzeit (Sekunden)', 'bewerbungstrainer'); ?></label>
                        </th>
                        <td>
                            <input type="number" name="total_time_limit" id="total_time_limit" class="small-text" min="60" max="3600"
                                   value="<?php echo esc_attr($values['total_time_limit']); ?>">
                        </td>
                    </tr>

                    <!-- Prompts -->
                    <tr>
                        <th scope="row">
                            <label for="system_prompt"><?php _e('System Prompt', 'bewerbungstrainer'); ?> *</label>
                        </th>
                        <td>
                            <textarea name="system_prompt" id="system_prompt" class="large-text code" rows="6" required><?php echo esc_textarea($values['system_prompt']); ?></textarea>
                            <p class="description"><?php _e('Kontext für die KI. Variablen: ${position}, ${company}, ${experience_level}', 'bewerbungstrainer'); ?></p>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row">
                            <label for="question_generation_prompt"><?php _e('Fragen-Generierung Prompt', 'bewerbungstrainer'); ?></label>
                        </th>
                        <td>
                            <textarea name="question_generation_prompt" id="question_generation_prompt" class="large-text code" rows="6"><?php echo esc_textarea($values['question_generation_prompt']); ?></textarea>
                            <p class="description"><?php _e('Anweisungen für die Generierung der Interviewfragen.', 'bewerbungstrainer'); ?></p>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row">
                            <label for="feedback_prompt"><?php _e('Feedback Prompt', 'bewerbungstrainer'); ?></label>
                        </th>
                        <td>
                            <textarea name="feedback_prompt" id="feedback_prompt" class="large-text code" rows="6"><?php echo esc_textarea($values['feedback_prompt']); ?></textarea>
                            <p class="description"><?php _e('Anweisungen für die Video-Analyse und Feedback-Generierung.', 'bewerbungstrainer'); ?></p>
                        </td>
                    </tr>

                    <!-- Input Configuration -->
                    <tr>
                        <th scope="row">
                            <label for="input_configuration"><?php _e('Eingabefelder (JSON)', 'bewerbungstrainer'); ?></label>
                        </th>
                        <td>
                            <textarea name="input_configuration" id="input_configuration" class="large-text code" rows="10"><?php echo esc_textarea(is_array($values['input_configuration']) ? json_encode($values['input_configuration'], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) : '[]'); ?></textarea>
                            <p class="description"><?php _e('JSON-Array mit Eingabefeld-Definitionen. Format: [{"key": "position", "label": "Zielposition", "type": "text", "required": true}]', 'bewerbungstrainer'); ?></p>
                        </td>
                    </tr>

                    <!-- Options -->
                    <tr>
                        <th scope="row"><?php _e('Optionen', 'bewerbungstrainer'); ?></th>
                        <td>
                            <label>
                                <input type="checkbox" name="enable_tips" value="1" <?php checked($values['enable_tips'], 1); ?>>
                                <?php _e('Tipps anzeigen', 'bewerbungstrainer'); ?>
                            </label>
                            <br>
                            <label>
                                <input type="checkbox" name="enable_navigation" value="1" <?php checked($values['enable_navigation'], 1); ?>>
                                <?php _e('Navigation zwischen Fragen erlauben', 'bewerbungstrainer'); ?>
                            </label>
                            <br>
                            <label>
                                <input type="checkbox" name="is_active" value="1" <?php checked($values['is_active'], 1); ?>>
                                <?php _e('Aktiv (für Benutzer sichtbar)', 'bewerbungstrainer'); ?>
                            </label>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row">
                            <label for="sort_order"><?php _e('Reihenfolge', 'bewerbungstrainer'); ?></label>
                        </th>
                        <td>
                            <input type="number" name="sort_order" id="sort_order" class="small-text"
                                   value="<?php echo esc_attr($values['sort_order']); ?>">
                        </td>
                    </tr>
                </table>

                <p class="submit">
                    <input type="submit" name="<?php echo esc_attr($form_action); ?>" class="button button-primary"
                           value="<?php echo $is_edit ? __('Szenario aktualisieren', 'bewerbungstrainer') : __('Szenario erstellen', 'bewerbungstrainer'); ?>">
                    <a href="<?php echo admin_url('admin.php?page=bewerbungstrainer-video-training'); ?>" class="button">
                        <?php _e('Abbrechen', 'bewerbungstrainer'); ?>
                    </a>
                </p>
            </form>
        </div>
        <?php
    }

    /**
     * Get scenario type label
     */
    private function get_scenario_type_label($type) {
        $labels = array(
            'self_presentation' => __('Selbstpräsentation', 'bewerbungstrainer'),
            'interview' => __('Bewerbungsgespräch', 'bewerbungstrainer'),
            'pitch' => __('Elevator Pitch', 'bewerbungstrainer'),
            'negotiation' => __('Verhandlung', 'bewerbungstrainer'),
            'custom' => __('Benutzerdefiniert', 'bewerbungstrainer'),
        );

        return isset($labels[$type]) ? $labels[$type] : $type;
    }

    /**
     * Get difficulty label
     */
    private function get_difficulty_label($difficulty) {
        $labels = array(
            'beginner' => __('Einsteiger', 'bewerbungstrainer'),
            'intermediate' => __('Fortgeschritten', 'bewerbungstrainer'),
            'advanced' => __('Experte', 'bewerbungstrainer'),
        );

        return isset($labels[$difficulty]) ? $labels[$difficulty] : $difficulty;
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
                <input type="checkbox" name="target_audience[]" value="<?php echo esc_attr($setup['slug']); ?>" <?php echo $checked; ?> style="margin: 0;">
                <span style="font-size: 16px;"><?php echo esc_html($setup['icon']); ?></span>
                <span style="font-weight: 500; color: #333;"><?php echo esc_html($setup['name']); ?></span>
            </label>
            <?php
        }
        echo '</div>';
    }
}
