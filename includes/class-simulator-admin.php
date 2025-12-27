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
        add_action('admin_init', array($this, 'handle_csv_actions'));
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
            array($this, 'render_scenarios_page'),
            2 // Position: after Live-Simulationen
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

        // Handle bulk actions
        if (isset($_POST['simulator_bulk_action']) && wp_verify_nonce($_POST['_wpnonce'], 'simulator_bulk_action')) {
            $this->handle_bulk_action();
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
     * Handle bulk action
     */
    private function handle_bulk_action() {
        $action = sanitize_text_field($_POST['bulk_action'] ?? '');
        $scenario_ids = isset($_POST['scenario_ids']) ? array_map('intval', $_POST['scenario_ids']) : array();

        if (empty($scenario_ids)) {
            wp_redirect(admin_url('admin.php?page=simulator-scenarios&error=no_selection'));
            exit;
        }

        $updated = 0;

        switch ($action) {
            case 'update_categories':
                $categories = isset($_POST['bulk_categories']) ? array_map('sanitize_text_field', $_POST['bulk_categories']) : array();
                $category_json = wp_json_encode($categories);
                foreach ($scenario_ids as $id) {
                    $result = $this->db->update_scenario($id, array('category' => $category_json));
                    if ($result !== false) {
                        $updated++;
                    }
                }
                break;

            case 'update_setups':
                $setups = isset($_POST['bulk_setups']) ? array_map('sanitize_text_field', $_POST['bulk_setups']) : array();
                $setups_string = implode('; ', $setups);
                foreach ($scenario_ids as $id) {
                    $result = $this->db->update_scenario($id, array('target_audience' => $setups_string));
                    if ($result !== false) {
                        $updated++;
                    }
                }
                break;

            case 'activate':
                foreach ($scenario_ids as $id) {
                    $result = $this->db->update_scenario($id, array('is_active' => 1));
                    if ($result !== false) {
                        $updated++;
                    }
                }
                break;

            case 'deactivate':
                foreach ($scenario_ids as $id) {
                    $result = $this->db->update_scenario($id, array('is_active' => 0));
                    if ($result !== false) {
                        $updated++;
                    }
                }
                break;

            case 'delete':
                foreach ($scenario_ids as $id) {
                    if ($this->db->delete_scenario($id)) {
                        $updated++;
                    }
                }
                break;
        }

        wp_redirect(admin_url('admin.php?page=simulator-scenarios&bulk_updated=' . $updated));
        exit;
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

        // Handle target_audience (checkboxes array to semicolon-separated string)
        $target_audience = '';
        if (isset($post['target_audience']) && is_array($post['target_audience'])) {
            $target_audience = implode('; ', array_map('sanitize_text_field', $post['target_audience']));
        }

        // Parse tips JSON
        $tips = null;
        if (!empty($post['tips'])) {
            $tips_decoded = json_decode(stripslashes($post['tips']), true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $tips = json_encode($tips_decoded, JSON_UNESCAPED_UNICODE);
            } else {
                $tips = $post['tips']; // Keep as-is if not valid JSON
            }
        }

        return array(
            'title' => sanitize_text_field($post['title'] ?? ''),
            'description' => sanitize_textarea_field($post['description'] ?? ''),
            'long_description' => sanitize_textarea_field($post['long_description'] ?? ''),
            'icon' => sanitize_text_field($post['icon'] ?? 'briefcase'),
            'difficulty' => sanitize_text_field($post['difficulty'] ?? 'intermediate'),
            'category' => Bewerbungstrainer_Categories_Admin::parse_categories_input($post['categories'] ?? array()),
            'target_audience' => $target_audience,
            'mode' => $mode,
            'system_prompt' => wp_kses_post($post['system_prompt'] ?? ''),
            'question_generation_prompt' => wp_kses_post($post['question_generation_prompt'] ?? ''),
            'feedback_prompt' => wp_kses_post($post['feedback_prompt'] ?? ''),
            'tips' => $tips,
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
     * Handle CSV import/export actions
     */
    public function handle_csv_actions() {
        if (!current_user_can('manage_options')) {
            return;
        }

        // Export CSV
        if (isset($_GET['action']) && $_GET['action'] === 'export_csv' && isset($_GET['page']) && $_GET['page'] === 'simulator-scenarios') {
            if (!wp_verify_nonce($_GET['_wpnonce'], 'export_simulator_scenarios')) {
                wp_die('Security check failed');
            }
            $this->export_scenarios_csv();
            exit;
        }

        // Import CSV
        if (isset($_POST['simulator_import_csv']) && isset($_FILES['csv_file'])) {
            if (!wp_verify_nonce($_POST['_wpnonce'], 'import_simulator_scenarios')) {
                wp_die('Security check failed');
            }
            $this->import_scenarios_csv($_FILES['csv_file']);
        }
    }

    /**
     * Export scenarios to CSV
     */
    private function export_scenarios_csv() {
        // Ensure database columns exist before export
        $this->db->ensure_schema_updated();

        $scenarios = $this->db->get_scenarios(array('is_active' => null));

        $filename = 'simulator-scenarios-' . date('Y-m-d-His') . '.csv';

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
            'icon',
            'difficulty',
            'target_audience',
            'category',
            'mode',
            'system_prompt',
            'question_generation_prompt',
            'feedback_prompt',
            'tips',
            'input_configuration',
            'question_count_min',
            'question_count_max',
            'time_limit_per_question',
            'allow_retry',
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

            // Clean tips JSON
            $tips = $scenario->tips ?? '';
            if (is_array($tips)) {
                $tips = json_encode($tips, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            } elseif (is_string($tips) && !empty($tips)) {
                $decoded = json_decode($tips, true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                    $tips = json_encode($decoded, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                }
            }

            fputcsv($output, array(
                $scenario->id,
                $clean_text($scenario->title),
                $clean_text($scenario->description),
                $clean_text($scenario->long_description ?? ''),
                $scenario->icon,
                $scenario->difficulty,
                $clean_text($scenario->target_audience ?? ''),
                $scenario->category,
                $scenario->mode ?? 'INTERVIEW',
                $clean_text($scenario->system_prompt),
                $clean_text($scenario->question_generation_prompt),
                $clean_text($scenario->feedback_prompt),
                $tips,
                $input_config,
                $scenario->question_count_min,
                $scenario->question_count_max,
                $scenario->time_limit_per_question,
                $scenario->allow_retry,
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
            wp_redirect(admin_url('admin.php?page=simulator-scenarios&import_error=upload'));
            exit;
        }

        $handle = fopen($file['tmp_name'], 'r');
        if (!$handle) {
            wp_redirect(admin_url('admin.php?page=simulator-scenarios&import_error=read'));
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
            wp_redirect(admin_url('admin.php?page=simulator-scenarios&import_error=format'));
            exit;
        }

        $imported = 0;
        $updated = 0;

        while (($row = fgetcsv($handle, 0, ';')) !== false) {
            if (count($row) < count($header)) {
                continue;
            }

            $data = array_combine($header, $row);

            // Helper to restore newlines from \n placeholder
            $restore_newlines = function($text) {
                if (empty($text)) return '';
                return str_replace('\\n', "\n", $text);
            };

            // Parse input_configuration JSON
            if (!empty($data['input_configuration'])) {
                $input_config = json_decode($data['input_configuration'], true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    $data['input_configuration'] = json_encode($input_config, JSON_UNESCAPED_UNICODE);
                }
            }

            // Parse tips JSON if present
            $tips = null;
            if (!empty($data['tips'])) {
                $tips_decoded = json_decode($data['tips'], true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    $tips = json_encode($tips_decoded, JSON_UNESCAPED_UNICODE);
                } else {
                    $tips = $data['tips'];
                }
            }

            // Prepare scenario data - restore newlines for text fields
            $scenario_data = array(
                'title' => sanitize_text_field($data['title'] ?? ''),
                'description' => sanitize_textarea_field($restore_newlines($data['description'] ?? '')),
                'long_description' => sanitize_textarea_field($restore_newlines($data['long_description'] ?? '')),
                'icon' => sanitize_text_field($data['icon'] ?? 'briefcase'),
                'difficulty' => sanitize_text_field($data['difficulty'] ?? 'intermediate'),
                'target_audience' => sanitize_text_field($restore_newlines($data['target_audience'] ?? '')),
                'category' => Bewerbungstrainer_Categories_Admin::parse_categories_input($data['category'] ?? array()),
                'mode' => in_array($data['mode'] ?? '', array('INTERVIEW', 'SIMULATION')) ? $data['mode'] : 'INTERVIEW',
                'system_prompt' => wp_kses_post($restore_newlines($data['system_prompt'] ?? '')),
                'question_generation_prompt' => wp_kses_post($restore_newlines($data['question_generation_prompt'] ?? '')),
                'feedback_prompt' => wp_kses_post($restore_newlines($data['feedback_prompt'] ?? '')),
                'tips' => $tips,
                'input_configuration' => $data['input_configuration'] ?? '[]',
                'question_count_min' => intval($data['question_count_min'] ?? 8),
                'question_count_max' => intval($data['question_count_max'] ?? 12),
                'time_limit_per_question' => intval($data['time_limit_per_question'] ?? 120),
                'allow_retry' => intval($data['allow_retry'] ?? 1),
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

        wp_redirect(admin_url('admin.php?page=simulator-scenarios&imported=' . $imported . '&updated=' . $updated));
        exit;
    }

    /**
     * Render scenarios list page
     */
    public function render_scenarios_page() {
        // Get filter values
        $filter_category = isset($_GET['filter_category']) ? sanitize_text_field($_GET['filter_category']) : '';
        $filter_setup = isset($_GET['filter_setup']) ? sanitize_text_field($_GET['filter_setup']) : '';

        // Get all scenarios including inactive ones
        $scenarios = $this->db->get_scenarios(array('is_active' => null));

        // Apply filters
        if ($filter_category || $filter_setup) {
            $scenarios = array_filter($scenarios, function($scenario) use ($filter_category, $filter_setup) {
                $matches = true;
                if ($filter_category) {
                    $categories = Bewerbungstrainer_Categories_Admin::get_categories_array($scenario->category ?? '');
                    $matches = $matches && in_array($filter_category, $categories);
                }
                if ($filter_setup) {
                    $setups = array_filter(array_map('trim', explode(';', $scenario->target_audience ?? '')));
                    $matches = $matches && in_array($filter_setup, $setups);
                }
                return $matches;
            });
        }

        // Get all categories and setups for filters
        $all_categories = Bewerbungstrainer_Categories_Admin::get_all_categories();
        $setups_manager = Bewerbungstrainer_Scenario_Setups::get_instance();
        $all_setups = $setups_manager->get_all_setups(true);

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
        if (isset($_GET['imported'])) {
            $imported = intval($_GET['imported']);
            $csv_updated = isset($_GET['updated']) ? intval($_GET['updated']) : 0;
            echo '<div class="notice notice-success is-dismissible"><p>' . sprintf('%d Szenario(s) importiert, %d aktualisiert.', $imported, $csv_updated) . '</p></div>';
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
        if (isset($_GET['bulk_updated'])) {
            $count = intval($_GET['bulk_updated']);
            echo '<div class="notice notice-success is-dismissible"><p>' . sprintf('%d Szenario(s) aktualisiert.', $count) . '</p></div>';
        }
        if (isset($_GET['error']) && $_GET['error'] === 'no_selection') {
            echo '<div class="notice notice-warning is-dismissible"><p>Bitte wähle mindestens ein Szenario aus.</p></div>';
        }
        ?>
        <div class="wrap">
            <h1 class="wp-heading-inline">Szenario-Training Szenarien</h1>
            <a href="<?php echo admin_url('admin.php?page=simulator-scenario-new'); ?>" class="page-title-action">Neu hinzufügen</a>
            <a href="<?php echo wp_nonce_url(admin_url('admin.php?page=simulator-scenarios&action=export_csv'), 'export_simulator_scenarios'); ?>" class="page-title-action">CSV Export</a>
            <hr class="wp-header-end">

            <!-- Filter Bar -->
            <div class="tablenav top">
                <form method="get" style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                    <input type="hidden" name="page" value="simulator-scenarios">

                    <!-- Category Filter -->
                    <select name="filter_category">
                        <option value="">Alle Kategorien</option>
                        <?php foreach ($all_categories as $cat): ?>
                            <option value="<?php echo esc_attr($cat['slug']); ?>" <?php selected($filter_category, $cat['slug']); ?>>
                                <?php echo esc_html($cat['icon'] . ' ' . $cat['name']); ?>
                            </option>
                        <?php endforeach; ?>
                    </select>

                    <!-- Setup Filter -->
                    <select name="filter_setup">
                        <option value="">Alle Setups</option>
                        <?php foreach ($all_setups as $setup): ?>
                            <option value="<?php echo esc_attr($setup['slug']); ?>" <?php selected($filter_setup, $setup['slug']); ?>>
                                <?php echo esc_html($setup['icon'] . ' ' . $setup['name']); ?>
                            </option>
                        <?php endforeach; ?>
                    </select>

                    <button type="submit" class="button">Filtern</button>
                    <?php if ($filter_category || $filter_setup): ?>
                        <a href="<?php echo admin_url('admin.php?page=simulator-scenarios'); ?>" class="button">Filter zurücksetzen</a>
                    <?php endif; ?>

                    <!-- CSV Import -->
                    <span style="margin-left: auto; display: flex; align-items: center; gap: 8px;">
                        <strong>CSV Import:</strong>
                        <input type="file" name="csv_file" accept=".csv" form="csv-import-form">
                        <button type="submit" form="csv-import-form" name="simulator_import_csv" class="button">Importieren</button>
                    </span>
                </form>
                <form id="csv-import-form" method="post" enctype="multipart/form-data" style="display:none;">
                    <?php wp_nonce_field('import_simulator_scenarios'); ?>
                </form>
            </div>

            <!-- Bulk Actions Form -->
            <form method="post" id="bulk-action-form">
                <?php wp_nonce_field('simulator_bulk_action'); ?>

                <!-- Bulk Action Bar -->
                <div class="tablenav top" style="margin-top: 10px;">
                    <div class="alignleft actions bulkactions">
                        <select name="bulk_action" id="bulk-action-select">
                            <option value="">Bulk-Aktionen</option>
                            <option value="update_categories">Kategorien setzen</option>
                            <option value="update_setups">Setups setzen</option>
                            <option value="activate">Aktivieren</option>
                            <option value="deactivate">Deaktivieren</option>
                            <option value="delete">Löschen</option>
                        </select>
                        <button type="submit" name="simulator_bulk_action" class="button action">Anwenden</button>
                    </div>

                    <!-- Bulk Categories Selection (hidden by default) -->
                    <div id="bulk-categories-select" style="display: none; margin-left: 20px;" class="alignleft">
                        <strong>Kategorien:</strong>
                        <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 5px;">
                            <?php foreach ($all_categories as $cat): ?>
                                <label style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; background: <?php echo esc_attr($cat['color']); ?>20; border: 1px solid <?php echo esc_attr($cat['color']); ?>40; border-radius: 4px; cursor: pointer;">
                                    <input type="checkbox" name="bulk_categories[]" value="<?php echo esc_attr($cat['slug']); ?>">
                                    <?php echo esc_html($cat['icon'] . ' ' . $cat['name']); ?>
                                </label>
                            <?php endforeach; ?>
                        </div>
                    </div>

                    <!-- Bulk Setups Selection (hidden by default) -->
                    <div id="bulk-setups-select" style="display: none; margin-left: 20px;" class="alignleft">
                        <strong>Setups:</strong>
                        <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 5px;">
                            <?php foreach ($all_setups as $setup): ?>
                                <label style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; background: <?php echo esc_attr($setup['color']); ?>20; border: 1px solid <?php echo esc_attr($setup['color']); ?>40; border-radius: 4px; cursor: pointer;">
                                    <input type="checkbox" name="bulk_setups[]" value="<?php echo esc_attr($setup['slug']); ?>">
                                    <?php echo esc_html($setup['icon'] . ' ' . $setup['name']); ?>
                                </label>
                            <?php endforeach; ?>
                        </div>
                    </div>
                </div>

                <table class="wp-list-table widefat fixed striped">
                    <thead>
                        <tr>
                            <td class="manage-column column-cb check-column" style="width: 30px;">
                                <input type="checkbox" id="cb-select-all">
                            </td>
                            <th style="width: 50px;">ID</th>
                            <th>Titel</th>
                            <th style="width: 60px;">Icon</th>
                            <th style="width: 100px;">Modus</th>
                            <th style="width: 180px;">Kategorien</th>
                            <th style="width: 180px;">Setups</th>
                            <th style="width: 80px;">Variablen</th>
                            <th style="width: 80px;">Fragen</th>
                            <th style="width: 60px;">Aktiv</th>
                            <th style="width: 120px;">Aktionen</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php if (empty($scenarios)): ?>
                            <tr>
                                <td colspan="11">Keine Szenarien gefunden. <a href="<?php echo admin_url('admin.php?page=simulator-scenario-new'); ?>">Erstelle dein erstes Szenario</a>.</td>
                            </tr>
                        <?php else: ?>
                            <?php foreach ($scenarios as $scenario): ?>
                                <?php
                                $categories = Bewerbungstrainer_Categories_Admin::get_categories_array($scenario->category ?? '');
                                $setups = array_filter(array_map('trim', explode(';', $scenario->target_audience ?? '')));
                                $vars = is_array($scenario->input_configuration) ? $scenario->input_configuration : (json_decode($scenario->input_configuration ?? '[]', true) ?: array());
                                ?>
                                <tr>
                                    <th scope="row" class="check-column">
                                        <input type="checkbox" name="scenario_ids[]" value="<?php echo esc_attr($scenario->id); ?>">
                                    </th>
                                    <td><?php echo esc_html($scenario->id); ?></td>
                                    <td>
                                        <strong>
                                            <a href="<?php echo admin_url('admin.php?page=simulator-scenario-new&id=' . $scenario->id); ?>">
                                                <?php echo esc_html($scenario->title); ?>
                                            </a>
                                        </strong>
                                        <?php if ($scenario->description): ?>
                                            <br><span class="description"><?php echo esc_html(wp_trim_words($scenario->description, 10)); ?></span>
                                        <?php endif; ?>
                                    </td>
                                    <td>
                                        <?php echo esc_html($this->get_icon_display($scenario->icon ?? 'briefcase')); ?>
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
                                        <?php $this->render_category_badges($categories, $all_categories); ?>
                                    </td>
                                    <td>
                                        <?php $this->render_setup_badges($setups, $all_setups); ?>
                                    </td>
                                    <td><?php echo count($vars); ?></td>
                                    <td><?php echo esc_html($scenario->question_count_min . '-' . $scenario->question_count_max); ?></td>
                                    <td>
                                        <?php if ($scenario->is_active): ?>
                                            <span style="color: #22c55e;">&#10003;</span>
                                        <?php else: ?>
                                            <span style="color: #94a3b8;">&#10007;</span>
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
            </form>

            <script>
            jQuery(document).ready(function($) {
                // Select all checkbox
                $('#cb-select-all').on('change', function() {
                    $('input[name="scenario_ids[]"]').prop('checked', this.checked);
                });

                // Show/hide bulk action options based on selected action
                $('#bulk-action-select').on('change', function() {
                    var action = $(this).val();
                    $('#bulk-categories-select, #bulk-setups-select').hide();
                    if (action === 'update_categories') {
                        $('#bulk-categories-select').show();
                    } else if (action === 'update_setups') {
                        $('#bulk-setups-select').show();
                    }
                });

                // Confirm delete action
                $('#bulk-action-form').on('submit', function(e) {
                    var action = $('#bulk-action-select').val();
                    if (action === 'delete') {
                        if (!confirm('Ausgewählte Szenarien wirklich löschen?')) {
                            e.preventDefault();
                            return false;
                        }
                    }
                });
            });
            </script>
        </div>
        <?php
    }

    /**
     * Render category badges
     */
    private function render_category_badges($categories, $all_categories) {
        if (empty($categories)) {
            echo '<span style="color: #94a3b8;">—</span>';
            return;
        }
        $category_map = array();
        foreach ($all_categories as $cat) {
            $category_map[$cat['slug']] = $cat;
        }
        echo '<div style="display: flex; flex-wrap: wrap; gap: 4px;">';
        foreach ($categories as $slug) {
            if (isset($category_map[$slug])) {
                $cat = $category_map[$slug];
                echo '<span style="display: inline-flex; align-items: center; gap: 2px; padding: 2px 6px; background: ' . esc_attr($cat['color']) . '20; border-radius: 3px; font-size: 11px;">';
                echo esc_html($cat['icon'] . ' ' . $cat['name']);
                echo '</span>';
            }
        }
        echo '</div>';
    }

    /**
     * Render setup badges
     */
    private function render_setup_badges($setups, $all_setups) {
        if (empty($setups)) {
            echo '<span style="color: #94a3b8;">—</span>';
            return;
        }
        $setup_map = array();
        foreach ($all_setups as $setup) {
            $setup_map[$setup['slug']] = $setup;
        }
        echo '<div style="display: flex; flex-wrap: wrap; gap: 4px;">';
        foreach ($setups as $slug) {
            if (isset($setup_map[$slug])) {
                $setup = $setup_map[$slug];
                echo '<span style="display: inline-flex; align-items: center; gap: 2px; padding: 2px 6px; background: ' . esc_attr($setup['color']) . '20; border-radius: 3px; font-size: 11px;">';
                echo esc_html($setup['icon'] . ' ' . $setup['name']);
                echo '</span>';
            }
        }
        echo '</div>';
    }

    /**
     * Get icon display
     */
    private function get_icon_display($icon) {
        $icon_map = array(
            'briefcase' => '💼',
            'banknote' => '💰',
            'user' => '👤',
            'handshake' => '🤝',
            'users' => '👥',
            'presentation' => '📊',
            'mic' => '🎤',
            'graduation-cap' => '🎓',
            'building' => '🏢',
        );
        return isset($icon_map[$icon]) ? $icon_map[$icon] : $icon;
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
            'category' => json_encode(array()),
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

        // Ensure category is array for checkboxes
        $data['category'] = Bewerbungstrainer_Categories_Admin::get_categories_array($data['category'] ?? array());
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
                                            <th><label for="description">Kurzbeschreibung</label></th>
                                            <td>
                                                <textarea name="description" id="description" rows="3" class="large-text"><?php echo esc_textarea($data['description']); ?></textarea>
                                                <p class="description">Wird auf der Szenario-Kachel im Dashboard angezeigt (kurz halten).</p>
                                            </td>
                                        </tr>
                                        <tr>
                                            <th><label for="long_description">Langbeschreibung</label></th>
                                            <td>
                                                <textarea name="long_description" id="long_description" rows="5" class="large-text"><?php echo esc_textarea($data['long_description'] ?? ''); ?></textarea>
                                                <p class="description">Detaillierte Aufgabenbeschreibung für die Vorbereitungsseite. Erklärt dem Nutzer genau, was in diesem Training passiert und was von ihm erwartet wird.</p>
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
                                            <th><label>Kategorien</label></th>
                                            <td>
                                                <?php Bewerbungstrainer_Categories_Admin::render_category_checkboxes($data['category'], 'categories'); ?>
                                                <p class="description" style="margin-top: 8px;">
                                                    Thematische Einordnung des Szenarios für die Filterung im Dashboard.<br>
                                                    <a href="<?php echo admin_url('admin.php?page=bewerbungstrainer-categories'); ?>">Kategorien verwalten</a>
                                                </p>
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
                                        <tr>
                                            <th><label>Trainings-Setups</label></th>
                                            <td>
                                                <?php $this->render_setups_checkboxes($data['target_audience'] ?? ''); ?>
                                                <p class="description">Wähle die Setups, in denen dieses Szenario angezeigt werden soll.</p>
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

                            <!-- Tips -->
                            <div class="postbox">
                                <h2 class="hndle">Tipps für Nutzer</h2>
                                <div class="inside">
                                    <p class="description" style="margin-bottom: 15px;">
                                        Szenario-spezifische Tipps, die auf der Vorbereitungsseite angezeigt werden. Wenn leer, werden die Standard-Tipps verwendet.
                                    </p>
                                    <table class="form-table">
                                        <tr>
                                            <th><label for="tips">Tipps (JSON)</label></th>
                                            <td>
                                                <textarea name="tips" id="tips" rows="10" class="large-text code"><?php
                                                    $tips_value = $data['tips'] ?? '';
                                                    if (is_array($tips_value)) {
                                                        echo esc_textarea(json_encode($tips_value, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
                                                    } else {
                                                        echo esc_textarea($tips_value);
                                                    }
                                                ?></textarea>
                                                <p class="description">
                                                    JSON-Array mit Tipps. Format:<br>
                                                    <code>[{"icon": "target", "title": "Tipp-Titel", "text": "Tipp-Beschreibung"}]</code><br><br>
                                                    Verfügbare Icons: <code>target</code>, <code>clock</code>, <code>mic</code>, <code>message-square</code>, <code>lightbulb</code>, <code>brain</code>
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
                    // Re-index after sort - update data-index and name attributes
                    $('#variables-container .simulator-variable-item').each(function(newIndex) {
                        var $item = $(this);
                        var oldIndex = $item.data('index');

                        // Update data-index
                        $item.data('index', newIndex);
                        $item.attr('data-index', newIndex);

                        // Update var_required checkbox name
                        $item.find('input[name^="var_required["]').attr('name', 'var_required[' + newIndex + ']');

                        // Update var_options names
                        $item.find('input[name^="var_options["]').each(function() {
                            var name = $(this).attr('name');
                            // Replace old index with new index in name like var_options[0][value][]
                            var newName = name.replace(/var_options\[\d+\]/, 'var_options[' + newIndex + ']');
                            $(this).attr('name', newName);
                        });
                    });
                }
            });
        });
        </script>
        <?php
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
