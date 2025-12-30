<?php
/**
 * Roleplay Admin Page (Database-based)
 *
 * Provides WordPress admin interface for managing Roleplay scenarios
 * using the new unified database table.
 *
 * @package Bewerbungstrainer
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Roleplay Admin Class
 */
class Bewerbungstrainer_Roleplay_Admin {

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
        $this->db = Bewerbungstrainer_Roleplay_Database::get_instance();
        $this->init_hooks();
    }

    /**
     * Initialize hooks
     */
    private function init_hooks() {
        // Priority 15 to ensure parent menu (priority 9) is registered first
        add_action('admin_menu', array($this, 'add_admin_menu'), 15);
        add_action('admin_init', array($this, 'handle_form_actions'));
        add_action('admin_init', array($this, 'handle_csv_actions'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_scripts'));
    }

    /**
     * Add admin menu
     */
    public function add_admin_menu() {
        // Main menu item for Live-Simulationen
        add_submenu_page(
            'bewerbungstrainer',
            __('Live-Simulationen', 'bewerbungstrainer'),
            __('Live-Simulationen', 'bewerbungstrainer'),
            'manage_options',
            'roleplay-scenarios',
            array($this, 'render_scenarios_page'),
            1
        );

        // Hidden page for editing
        add_submenu_page(
            null,
            __('Szenario bearbeiten', 'bewerbungstrainer'),
            __('Szenario bearbeiten', 'bewerbungstrainer'),
            'manage_options',
            'roleplay-scenario-edit',
            array($this, 'render_edit_page')
        );
    }

    /**
     * Enqueue admin scripts and styles
     */
    public function enqueue_admin_scripts($hook) {
        if (strpos($hook, 'roleplay-scenario') === false) {
            return;
        }

        wp_enqueue_script('jquery-ui-sortable');
        wp_add_inline_style('wp-admin', $this->get_admin_styles());
    }

    /**
     * Get admin CSS styles
     */
    private function get_admin_styles() {
        return '
            .roleplay-variables-container {
                border: 1px solid #ddd;
                border-radius: 4px;
                padding: 15px;
                background: #f9f9f9;
            }
            .roleplay-variable-item {
                background: #fff;
                border: 1px solid #ddd;
                border-radius: 4px;
                padding: 15px;
                margin-bottom: 10px;
                position: relative;
            }
            .roleplay-variable-item:hover {
                border-color: #2271b1;
            }
            .roleplay-variable-item .handle {
                cursor: move;
                color: #999;
                margin-right: 10px;
            }
            .roleplay-variable-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 10px;
                padding-bottom: 10px;
                border-bottom: 1px solid #eee;
            }
            .roleplay-variable-fields {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 10px;
            }
            .roleplay-variable-fields .full-width {
                grid-column: 1 / -1;
            }
            .roleplay-variable-fields label {
                display: block;
                margin-bottom: 5px;
                font-weight: 500;
            }
            .roleplay-variable-fields input,
            .roleplay-variable-fields select {
                width: 100%;
            }
        ';
    }

    /**
     * Handle form actions
     */
    public function handle_form_actions() {
        // Check if we're on our admin page
        if (!isset($_GET['page']) || strpos($_GET['page'], 'roleplay-scenario') === false) {
            return;
        }

        // Handle delete action
        if (isset($_GET['action']) && $_GET['action'] === 'delete' && isset($_GET['id'])) {
            if (!wp_verify_nonce($_GET['_wpnonce'], 'delete_roleplay_scenario_' . $_GET['id'])) {
                wp_die('Security check failed');
            }

            $this->db->delete_scenario(intval($_GET['id']));
            wp_redirect(admin_url('admin.php?page=roleplay-scenarios&deleted=1'));
            exit;
        }

        // Handle bulk actions
        if (isset($_POST['roleplay_bulk_action']) && wp_verify_nonce($_POST['_wpnonce'], 'roleplay_bulk_action')) {
            $this->handle_bulk_action();
        }

        // Handle migration from CPT
        if (isset($_GET['action']) && $_GET['action'] === 'migrate_from_cpt') {
            if (!wp_verify_nonce($_GET['_wpnonce'], 'migrate_roleplay_from_cpt')) {
                wp_die('Security check failed');
            }

            $results = $this->db->migrate_from_posts();
            $query_args = array(
                'page' => 'roleplay-scenarios',
                'migration_created' => $results['created'],
                'migration_updated' => $results['updated'],
                'migration_skipped' => $results['skipped'],
                'migration_failed' => $results['failed'],
            );
            wp_redirect(add_query_arg($query_args, admin_url('admin.php')));
            exit;
        }

        // Handle form submission
        if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['roleplay_scenario_nonce'])) {
            if (!wp_verify_nonce($_POST['roleplay_scenario_nonce'], 'save_roleplay_scenario')) {
                wp_die('Security check failed');
            }

            $data = $this->sanitize_scenario_data($_POST);

            if (isset($_POST['scenario_id']) && !empty($_POST['scenario_id'])) {
                // Update existing
                $this->db->update_scenario(intval($_POST['scenario_id']), $data);
                wp_redirect(admin_url('admin.php?page=roleplay-scenarios&updated=1'));
            } else {
                // Create new
                $this->db->create_scenario($data);
                wp_redirect(admin_url('admin.php?page=roleplay-scenarios&created=1'));
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
            wp_redirect(admin_url('admin.php?page=roleplay-scenarios&error=no_selection'));
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

        wp_redirect(admin_url('admin.php?page=roleplay-scenarios&bulk_updated=' . $updated));
        exit;
    }

    /**
     * Sanitize scenario data from form
     */
    private function sanitize_scenario_data($post) {
        // Build input_configuration - either from visual builder or JSON textarea
        $input_configuration = array();
        if (!empty($post['input_configuration'])) {
            // JSON textarea input
            $decoded = json_decode(stripslashes($post['input_configuration']), true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                $input_configuration = $decoded;
            }
        } elseif (isset($post['var_key']) && is_array($post['var_key'])) {
            // Visual builder input
            $input_configuration = $this->build_input_configuration_from_post($post);
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
                $tips = $post['tips'];
            }
        }

        return array(
            'title' => sanitize_text_field(wp_unslash($post['title'] ?? '')),
            'description' => sanitize_textarea_field(wp_unslash($post['description'] ?? '')),
            'long_description' => sanitize_textarea_field(wp_unslash($post['long_description'] ?? '')),
            'icon' => sanitize_text_field($post['icon'] ?? 'mic'),
            'difficulty' => sanitize_text_field($post['difficulty'] ?? 'medium'),
            'category' => Bewerbungstrainer_Categories_Admin::parse_categories_input($post['categories'] ?? array()),
            'target_audience' => $target_audience,
            'role_type' => sanitize_text_field($post['role_type'] ?? 'interview'),
            'user_role_label' => sanitize_text_field(wp_unslash($post['user_role_label'] ?? 'Bewerber')),
            'agent_id' => sanitize_text_field($post['agent_id'] ?? ''),
            'voice_id' => sanitize_text_field($post['voice_id'] ?? ''),
            'initial_message' => sanitize_textarea_field(wp_unslash($post['initial_message'] ?? '')),
            'system_prompt' => wp_kses_post(wp_unslash($post['system_prompt'] ?? '')),
            'feedback_prompt' => wp_kses_post(wp_unslash($post['feedback_prompt'] ?? '')),
            'ai_instructions' => wp_kses_post(wp_unslash($post['ai_instructions'] ?? '')),
            'tips' => $tips,
            'input_configuration' => json_encode($input_configuration, JSON_UNESCAPED_UNICODE),
            'interviewer_name' => sanitize_text_field(wp_unslash($post['interviewer_name'] ?? '')),
            'interviewer_role' => sanitize_text_field(wp_unslash($post['interviewer_role'] ?? '')),
            'interviewer_image' => esc_url_raw($post['interviewer_image'] ?? ''),
            'interviewer_properties' => sanitize_textarea_field(wp_unslash($post['interviewer_properties'] ?? '')),
            'interviewer_objections' => sanitize_textarea_field(wp_unslash($post['interviewer_objections'] ?? '')),
            'interviewer_questions' => sanitize_textarea_field(wp_unslash($post['interviewer_questions'] ?? '')),
            'coaching_hints' => sanitize_textarea_field(wp_unslash($post['coaching_hints'] ?? '')),
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

            if (!empty($post['var_default'][$i])) {
                $field['default'] = sanitize_text_field($post['var_default'][$i]);
            }

            if ($field['type'] === 'select' && isset($post['var_options'][$i])) {
                $options = array();
                $opt_values = $post['var_options'][$i]['value'] ?? array();
                $opt_labels = $post['var_options'][$i]['label'] ?? array();

                for ($j = 0; $j < count($opt_values); $j++) {
                    if (!empty($opt_values[$j])) {
                        $options[] = array(
                            'value' => sanitize_text_field($opt_values[$j]),
                            'label' => sanitize_text_field($opt_labels[$j] ?? $opt_values[$j])
                        );
                    }
                }
                $field['options'] = $options;
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
        if (isset($_GET['action']) && $_GET['action'] === 'export_csv' && isset($_GET['page']) && $_GET['page'] === 'roleplay-scenarios') {
            if (!wp_verify_nonce($_GET['_wpnonce'], 'export_roleplay_scenarios')) {
                wp_die('Security check failed');
            }
            $this->export_scenarios_csv();
            exit;
        }

        // Import CSV
        if (isset($_POST['roleplay_import_csv']) && isset($_FILES['csv_file'])) {
            if (!wp_verify_nonce($_POST['_wpnonce'], 'import_roleplay_scenarios')) {
                wp_die('Security check failed');
            }
            $force_update = isset($_POST['force_update']) && $_POST['force_update'] === '1';
            $this->import_scenarios_csv($_FILES['csv_file'], $force_update);
        }
    }

    /**
     * Export scenarios to CSV
     */
    private function export_scenarios_csv() {
        // Ensure schema is up to date before export
        $this->db->maybe_create_tables();

        $scenarios = $this->db->get_scenarios(array('is_active' => null));

        $filename = 'roleplay-scenarios-' . date('Y-m-d-His') . '.csv';

        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename=' . $filename);

        $output = fopen('php://output', 'w');

        // UTF-8 BOM for Excel
        fprintf($output, chr(0xEF) . chr(0xBB) . chr(0xBF));

        // CSV Header - all fields including new ones
        fputcsv($output, array(
            'id',
            'title',
            'description',
            'long_description',
            'icon',
            'difficulty',
            'target_audience',
            'category',
            'role_type',
            'user_role_label',
            'agent_id',
            'voice_id',
            'initial_message',
            'system_prompt',
            'feedback_prompt',
            'ai_instructions',
            'tips',
            'input_configuration',
            'interviewer_name',
            'interviewer_role',
            'interviewer_image',
            'interviewer_properties',
            'interviewer_objections',
            'interviewer_questions',
            'coaching_hints',
            'is_active',
            'sort_order'
        ), ';');

        foreach ($scenarios as $scenario) {
            $clean_text = function($text) {
                if (empty($text)) return '';
                $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
                while (strpos($text, '\\\\') !== false) {
                    $text = str_replace('\\\\', '\\', $text);
                }
                $text = str_replace(array("\r\n", "\r", "\n"), '\\n', $text);
                return $text;
            };

            fputcsv($output, array(
                $scenario->id,
                $clean_text($scenario->title),
                $clean_text($scenario->description),
                $clean_text($scenario->long_description ?? ''),
                $scenario->icon ?? 'mic',
                $scenario->difficulty ?? 'medium',
                $clean_text($scenario->target_audience ?? ''),
                $scenario->category ?? '[]',
                $scenario->role_type ?? 'interview',
                $clean_text($scenario->user_role_label ?? 'Bewerber'),
                $scenario->agent_id ?? '',
                $scenario->voice_id ?? '',
                $clean_text($scenario->initial_message ?? ''),
                $clean_text($scenario->system_prompt ?? ''),
                $clean_text($scenario->feedback_prompt ?? ''),
                $clean_text($scenario->ai_instructions ?? ''),
                $scenario->tips ?? '[]',
                $scenario->input_configuration ?? '[]',
                $clean_text($scenario->interviewer_name ?? ''),
                $clean_text($scenario->interviewer_role ?? ''),
                $scenario->interviewer_image ?? '',
                $clean_text($scenario->interviewer_properties ?? ''),
                $clean_text($scenario->interviewer_objections ?? ''),
                $clean_text($scenario->interviewer_questions ?? ''),
                $clean_text($scenario->coaching_hints ?? ''),
                $scenario->is_active,
                $scenario->sort_order
            ), ';');
        }

        fclose($output);
    }

    /**
     * Import scenarios from CSV
     *
     * @param array $file Uploaded file data
     * @param bool $force_update If true, overwrite all fields (not just empty ones)
     */
    private function import_scenarios_csv($file, $force_update = false) {
        if ($file['error'] !== UPLOAD_ERR_OK) {
            wp_redirect(admin_url('admin.php?page=roleplay-scenarios&import_error=upload'));
            exit;
        }

        $handle = fopen($file['tmp_name'], 'r');
        if (!$handle) {
            wp_redirect(admin_url('admin.php?page=roleplay-scenarios&import_error=read'));
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
            wp_redirect(admin_url('admin.php?page=roleplay-scenarios&import_error=format'));
            exit;
        }

        $imported = 0;
        $updated = 0;

        $restore_newlines = function($text) {
            if (empty($text)) return '';
            return str_replace('\\n', "\n", $text);
        };

        while (($row = fgetcsv($handle, 0, ';')) !== false) {
            if (count($row) < count($header)) {
                continue;
            }

            $data = array_combine($header, $row);

            if (empty($data['title'])) {
                continue;
            }

            $scenario_data = array(
                'title' => sanitize_text_field($restore_newlines($data['title'])),
                'description' => sanitize_textarea_field($restore_newlines($data['description'] ?? '')),
                'long_description' => sanitize_textarea_field($restore_newlines($data['long_description'] ?? '')),
                'icon' => sanitize_text_field($data['icon'] ?? 'mic'),
                'difficulty' => sanitize_text_field($data['difficulty'] ?? 'medium'),
                'target_audience' => sanitize_text_field($restore_newlines($data['target_audience'] ?? '')),
                'category' => $data['category'] ?? '[]',
                'role_type' => sanitize_text_field($data['role_type'] ?? 'interview'),
                'user_role_label' => sanitize_text_field($restore_newlines($data['user_role_label'] ?? 'Bewerber')),
                'agent_id' => sanitize_text_field($data['agent_id'] ?? ''),
                'voice_id' => sanitize_text_field($data['voice_id'] ?? ''),
                'initial_message' => $restore_newlines($data['initial_message'] ?? ''),
                // Support both 'system_prompt' and 'content' column names (use empty() not ??)
                'system_prompt' => $restore_newlines(
                    !empty($data['system_prompt']) ? $data['system_prompt'] :
                    (!empty($data['content']) ? $data['content'] : '')
                ),
                'feedback_prompt' => $restore_newlines($data['feedback_prompt'] ?? ''),
                'ai_instructions' => $restore_newlines($data['ai_instructions'] ?? ''),
                'tips' => !empty($data['tips']) ? $data['tips'] : '[]',
                // Support both 'input_configuration' and 'variables_schema' column names (use empty() not ??)
                'input_configuration' => !empty($data['input_configuration']) ? $data['input_configuration'] :
                    (!empty($data['variables_schema']) ? $data['variables_schema'] : '[]'),
                'interviewer_name' => sanitize_text_field($restore_newlines($data['interviewer_name'] ?? '')),
                'interviewer_role' => sanitize_text_field($restore_newlines($data['interviewer_role'] ?? '')),
                'interviewer_image' => esc_url_raw($data['interviewer_image'] ?? ''),
                'interviewer_properties' => sanitize_textarea_field($restore_newlines($data['interviewer_properties'] ?? '')),
                'interviewer_objections' => sanitize_textarea_field($restore_newlines($data['interviewer_objections'] ?? '')),
                'interviewer_questions' => sanitize_textarea_field($restore_newlines($data['interviewer_questions'] ?? '')),
                'coaching_hints' => sanitize_textarea_field($restore_newlines($data['coaching_hints'] ?? '')),
                // Support both 'is_active' (0/1) and 'status' (publish/draft) column names (use !empty() not isset())
                'is_active' => !empty($data['status'])
                    ? ($data['status'] === 'publish' ? 1 : 0)
                    : intval($data['is_active'] ?? 1),
                'sort_order' => intval($data['sort_order'] ?? 0),
            );

            // Match by title only (IDs may have changed)
            $existing = $this->db->get_scenario_by_title($scenario_data['title']);

            if ($existing) {
                // Update existing
                $update_data = array();
                foreach ($scenario_data as $field => $value) {
                    if ($field === 'title') continue; // Don't update title

                    if ($force_update) {
                        // Force mode: update all non-empty values from CSV
                        if (!empty($value)) {
                            $update_data[$field] = $value;
                        }
                    } else {
                        // Normal mode: only fill empty fields in DB
                        $existing_value = $existing->$field ?? '';
                        if (empty($existing_value) && !empty($value)) {
                            $update_data[$field] = $value;
                        }
                    }
                }

                if (!empty($update_data)) {
                    $this->db->update_scenario($existing->id, $update_data);
                    $updated++;
                }
                continue;
            }

            // Create new
            $this->db->create_scenario($scenario_data);
            $imported++;
        }

        fclose($handle);

        wp_redirect(admin_url('admin.php?page=roleplay-scenarios&imported=' . $imported . '&csv_updated=' . $updated));
        exit;
    }

    /**
     * Render scenarios list page
     */
    public function render_scenarios_page() {
        // Get filters
        $filter_category = sanitize_text_field($_GET['filter_category'] ?? '');
        $filter_setup = sanitize_text_field($_GET['filter_setup'] ?? '');

        // Get scenarios from database
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
        $this->render_admin_notices();

        // Check for CPT scenarios that can be migrated
        $cpt_count = wp_count_posts('roleplay_scenario');
        $cpt_total = isset($cpt_count->publish) ? $cpt_count->publish : 0;
        $cpt_total += isset($cpt_count->draft) ? $cpt_count->draft : 0;
        $cpt_total += isset($cpt_count->private) ? $cpt_count->private : 0;

        ?>
        <div class="wrap">
            <h1 class="wp-heading-inline">Live-Simulationen</h1>
            <a href="<?php echo admin_url('admin.php?page=roleplay-scenario-edit'); ?>" class="page-title-action">Neu hinzufügen</a>
            <a href="<?php echo wp_nonce_url(admin_url('admin.php?page=roleplay-scenarios&action=export_csv'), 'export_roleplay_scenarios'); ?>" class="page-title-action">CSV Export</a>
            <?php if ($cpt_total > 0): ?>
                <a href="<?php echo wp_nonce_url(admin_url('admin.php?page=roleplay-scenarios&action=migrate_from_cpt'), 'migrate_roleplay_from_cpt'); ?>" class="page-title-action" style="background: #2271b1; color: white; border-color: #2271b1;" onclick="return confirm('<?php echo esc_js(sprintf('%d Szenario(s) aus Custom Post Types migrieren?\n\n• Neue Szenarien werden erstellt\n• Bestehende Szenarien: Nur LEERE Felder werden mit CPT-Daten gefüllt\n• Bereits gefüllte Felder bleiben unverändert', $cpt_total)); ?>')">
                    ⬆️ <?php echo $cpt_total; ?> CPT-Szenarien migrieren
                </a>
            <?php endif; ?>
            <hr class="wp-header-end">

            <!-- Filter Bar -->
            <div class="tablenav top">
                <form method="get" style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                    <input type="hidden" name="page" value="roleplay-scenarios">

                    <select name="filter_category">
                        <option value="">Alle Kategorien</option>
                        <?php foreach ($all_categories as $cat): ?>
                            <option value="<?php echo esc_attr($cat['slug']); ?>" <?php selected($filter_category, $cat['slug']); ?>>
                                <?php echo esc_html($cat['icon'] . ' ' . $cat['name']); ?>
                            </option>
                        <?php endforeach; ?>
                    </select>

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
                        <a href="<?php echo admin_url('admin.php?page=roleplay-scenarios'); ?>" class="button">Filter zurücksetzen</a>
                    <?php endif; ?>

                    <span style="margin-left: auto; display: flex; align-items: center; gap: 8px;">
                        <strong>CSV Import:</strong>
                        <input type="file" name="csv_file" accept=".csv" form="csv-import-form">
                        <label style="display: flex; align-items: center; gap: 4px; font-size: 12px;" form="csv-import-form">
                            <input type="checkbox" name="force_update" value="1" form="csv-import-form">
                            Überschreiben
                        </label>
                        <button type="submit" form="csv-import-form" name="roleplay_import_csv" class="button">Importieren</button>
                    </span>
                </form>
                <form id="csv-import-form" method="post" enctype="multipart/form-data" style="display:none;">
                    <?php wp_nonce_field('import_roleplay_scenarios'); ?>
                </form>
            </div>

            <!-- Bulk Actions Form -->
            <form method="post" id="bulk-action-form">
                <?php wp_nonce_field('roleplay_bulk_action'); ?>

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
                        <button type="submit" name="roleplay_bulk_action" class="button action">Anwenden</button>
                    </div>

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
                            <th style="width: 180px;">Kategorien</th>
                            <th style="width: 180px;">Setups</th>
                            <th style="width: 100px;">Schwierigkeit</th>
                            <th style="width: 80px;">Variablen</th>
                            <th style="width: 60px;">Aktiv</th>
                            <th style="width: 120px;">Aktionen</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php if (empty($scenarios)): ?>
                            <tr>
                                <td colspan="9">Keine Szenarien gefunden. <a href="<?php echo admin_url('admin.php?page=roleplay-scenario-edit'); ?>">Erstelle dein erstes Szenario</a>.</td>
                            </tr>
                        <?php else: ?>
                            <?php foreach ($scenarios as $scenario): ?>
                                <?php
                                $categories = Bewerbungstrainer_Categories_Admin::get_categories_array($scenario->category ?? '');
                                $setups = array_filter(array_map('trim', explode(';', $scenario->target_audience ?? '')));
                                $vars = json_decode($scenario->input_configuration ?? '[]', true) ?: array();
                                ?>
                                <tr>
                                    <th scope="row" class="check-column">
                                        <input type="checkbox" name="scenario_ids[]" value="<?php echo esc_attr($scenario->id); ?>">
                                    </th>
                                    <td><?php echo esc_html($scenario->id); ?></td>
                                    <td>
                                        <strong>
                                            <a href="<?php echo admin_url('admin.php?page=roleplay-scenario-edit&id=' . $scenario->id); ?>">
                                                <?php echo esc_html($scenario->title); ?>
                                            </a>
                                        </strong>
                                        <?php if ($scenario->description): ?>
                                            <br><span class="description"><?php echo esc_html(wp_trim_words($scenario->description, 10)); ?></span>
                                        <?php endif; ?>
                                    </td>
                                    <td>
                                        <?php $this->render_category_badges($categories, $all_categories); ?>
                                    </td>
                                    <td>
                                        <?php $this->render_setup_badges($setups, $all_setups); ?>
                                    </td>
                                    <td>
                                        <?php
                                        $difficulty_labels = array(
                                            'easy' => '<span style="color: #22c55e;">Leicht</span>',
                                            'medium' => '<span style="color: #eab308;">Mittel</span>',
                                            'hard' => '<span style="color: #ef4444;">Schwer</span>',
                                        );
                                        echo $difficulty_labels[$scenario->difficulty] ?? $scenario->difficulty;
                                        ?>
                                    </td>
                                    <td><?php echo count($vars); ?></td>
                                    <td>
                                        <?php if ($scenario->is_active): ?>
                                            <span style="color: #22c55e;">&#10003;</span>
                                        <?php else: ?>
                                            <span style="color: #94a3b8;">&#10007;</span>
                                        <?php endif; ?>
                                    </td>
                                    <td>
                                        <a href="<?php echo admin_url('admin.php?page=roleplay-scenario-edit&id=' . $scenario->id); ?>" class="button button-small">Bearbeiten</a>
                                        <a href="<?php echo wp_nonce_url(admin_url('admin.php?page=roleplay-scenarios&action=delete&id=' . $scenario->id), 'delete_roleplay_scenario_' . $scenario->id); ?>"
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
                $('#cb-select-all').on('change', function() {
                    $('input[name="scenario_ids[]"]').prop('checked', this.checked);
                });

                $('#bulk-action-select').on('change', function() {
                    var action = $(this).val();
                    $('#bulk-categories-select, #bulk-setups-select').hide();
                    if (action === 'update_categories') {
                        $('#bulk-categories-select').show();
                    } else if (action === 'update_setups') {
                        $('#bulk-setups-select').show();
                    }
                });

                $('#bulk-action-form').on('submit', function(e) {
                    var action = $('#bulk-action-select').val();
                    if (action === 'delete') {
                        if (!confirm('Ausgewählte Szenarien wirklich löschen?')) {
                            e.preventDefault();
                        }
                    }
                });
            });
            </script>

            <p class="description" style="margin-top: 20px;">
                <strong>Gesamt:</strong> <?php echo count($scenarios); ?> Szenarien
            </p>
        </div>
        <?php
    }

    /**
     * Render admin notices
     */
    private function render_admin_notices() {
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
            $csv_updated = isset($_GET['csv_updated']) ? intval($_GET['csv_updated']) : 0;
            echo '<div class="notice notice-success is-dismissible"><p>' . sprintf('%d Szenario(s) importiert, %d aktualisiert.', $imported, $csv_updated) . '</p></div>';
        }
        if (isset($_GET['import_error'])) {
            $errors = array(
                'upload' => 'Fehler beim Hochladen der Datei.',
                'read' => 'Fehler beim Lesen der Datei.',
                'format' => 'Ungültiges CSV-Format.',
            );
            $error_msg = $errors[$_GET['import_error']] ?? 'Unbekannter Fehler beim Import.';
            echo '<div class="notice notice-error is-dismissible"><p>' . esc_html($error_msg) . '</p></div>';
        }
        if (isset($_GET['bulk_updated'])) {
            $count = intval($_GET['bulk_updated']);
            echo '<div class="notice notice-success is-dismissible"><p>' . sprintf('%d Szenario(s) aktualisiert.', $count) . '</p></div>';
        }
        if (isset($_GET['migration_created']) || isset($_GET['migration_updated'])) {
            $created = intval($_GET['migration_created'] ?? 0);
            $updated = intval($_GET['migration_updated'] ?? 0);
            $skipped = intval($_GET['migration_skipped'] ?? 0);
            $failed = intval($_GET['migration_failed'] ?? 0);

            $parts = array();
            if ($created > 0) $parts[] = sprintf('%d neu erstellt', $created);
            if ($updated > 0) $parts[] = sprintf('%d aktualisiert (leere Felder gefüllt)', $updated);
            if ($skipped > 0) $parts[] = sprintf('%d übersprungen (alle Felder bereits gefüllt)', $skipped);
            if ($failed > 0) $parts[] = sprintf('%d fehlgeschlagen', $failed);

            $message = 'CPT-Migration abgeschlossen: ' . implode(', ', $parts);

            if ($failed > 0) {
                echo '<div class="notice notice-warning is-dismissible"><p>' . esc_html($message) . '</p></div>';
            } else {
                echo '<div class="notice notice-success is-dismissible"><p>' . esc_html($message) . '</p></div>';
            }
        }
        if (isset($_GET['error']) && $_GET['error'] === 'no_selection') {
            echo '<div class="notice notice-warning is-dismissible"><p>Bitte wähle mindestens ein Szenario aus.</p></div>';
        }
    }

    /**
     * Render category badges
     */
    private function render_category_badges($categories, $all_categories) {
        if (empty($categories)) {
            echo '<span style="color: #999;">—</span>';
            return;
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
    }

    /**
     * Render setup badges
     */
    private function render_setup_badges($setups, $all_setups) {
        if (empty($setups)) {
            echo '<span style="color: #999;">—</span>';
            return;
        }

        $badges = array();
        foreach ($setups as $slug) {
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
    }

    /**
     * Render edit page
     */
    public function render_edit_page() {
        $scenario = null;
        $is_edit = false;

        if (isset($_GET['id']) && !empty($_GET['id'])) {
            $scenario = $this->db->get_scenario(intval($_GET['id']));
            $is_edit = true;
        }

        // Get categories and setups
        $all_categories = Bewerbungstrainer_Categories_Admin::get_all_categories();
        $setups_manager = Bewerbungstrainer_Scenario_Setups::get_instance();
        $all_setups = $setups_manager->get_all_setups(true);

        // Parse current values
        $current_categories = $scenario ? Bewerbungstrainer_Categories_Admin::get_categories_array($scenario->category ?? '') : array();
        $current_setups = $scenario ? array_filter(array_map('trim', explode(';', $scenario->target_audience ?? ''))) : array();
        $input_config = $scenario ? (json_decode($scenario->input_configuration ?? '[]', true) ?: array()) : array();
        $tips = $scenario ? (json_decode($scenario->tips ?? '[]', true) ?: array()) : array();

        ?>
        <div class="wrap">
            <h1><?php echo $is_edit ? 'Szenario bearbeiten' : 'Neues Szenario'; ?></h1>

            <form method="post" action="">
                <?php wp_nonce_field('save_roleplay_scenario', 'roleplay_scenario_nonce'); ?>
                <?php if ($is_edit): ?>
                    <input type="hidden" name="scenario_id" value="<?php echo esc_attr($scenario->id); ?>">
                <?php endif; ?>

                <table class="form-table">
                    <tr>
                        <th><label for="title">Titel *</label></th>
                        <td><input type="text" name="title" id="title" class="regular-text" required value="<?php echo esc_attr($scenario->title ?? ''); ?>"></td>
                    </tr>
                    <tr>
                        <th><label for="description">Kurzbeschreibung</label></th>
                        <td><textarea name="description" id="description" rows="2" class="large-text"><?php echo esc_textarea($scenario->description ?? ''); ?></textarea></td>
                    </tr>
                    <tr>
                        <th><label for="long_description">Ausführliche Beschreibung</label></th>
                        <td><textarea name="long_description" id="long_description" rows="4" class="large-text"><?php echo esc_textarea($scenario->long_description ?? ''); ?></textarea></td>
                    </tr>
                    <tr>
                        <th><label>Kategorien</label></th>
                        <td>
                            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                                <?php foreach ($all_categories as $cat): ?>
                                    <label style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; background: <?php echo esc_attr($cat['color']); ?>20; border: 1px solid <?php echo esc_attr($cat['color']); ?>40; border-radius: 4px; cursor: pointer;">
                                        <input type="checkbox" name="categories[]" value="<?php echo esc_attr($cat['slug']); ?>" <?php checked(in_array($cat['slug'], $current_categories)); ?>>
                                        <?php echo esc_html($cat['icon'] . ' ' . $cat['name']); ?>
                                    </label>
                                <?php endforeach; ?>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <th><label>Setups</label></th>
                        <td>
                            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                                <?php foreach ($all_setups as $setup): ?>
                                    <label style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; background: <?php echo esc_attr($setup['color']); ?>20; border: 1px solid <?php echo esc_attr($setup['color']); ?>40; border-radius: 4px; cursor: pointer;">
                                        <input type="checkbox" name="target_audience[]" value="<?php echo esc_attr($setup['slug']); ?>" <?php checked(in_array($setup['slug'], $current_setups)); ?>>
                                        <?php echo esc_html($setup['icon'] . ' ' . $setup['name']); ?>
                                    </label>
                                <?php endforeach; ?>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <th><label for="difficulty">Schwierigkeit</label></th>
                        <td>
                            <select name="difficulty" id="difficulty">
                                <option value="easy" <?php selected($scenario->difficulty ?? 'medium', 'easy'); ?>>Leicht</option>
                                <option value="medium" <?php selected($scenario->difficulty ?? 'medium', 'medium'); ?>>Mittel</option>
                                <option value="hard" <?php selected($scenario->difficulty ?? 'medium', 'hard'); ?>>Schwer</option>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <th><label for="role_type">Typ</label></th>
                        <td>
                            <select name="role_type" id="role_type">
                                <option value="interview" <?php selected($scenario->role_type ?? 'interview', 'interview'); ?>>Interview</option>
                                <option value="simulation" <?php selected($scenario->role_type ?? 'interview', 'simulation'); ?>>Simulation</option>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <th><label for="user_role_label">Nutzer-Rolle Label</label></th>
                        <td><input type="text" name="user_role_label" id="user_role_label" class="regular-text" value="<?php echo esc_attr($scenario->user_role_label ?? 'Bewerber'); ?>"></td>
                    </tr>
                    <tr>
                        <th><label for="agent_id">ElevenLabs Agent ID</label></th>
                        <td><input type="text" name="agent_id" id="agent_id" class="regular-text" value="<?php echo esc_attr($scenario->agent_id ?? ''); ?>"></td>
                    </tr>
                    <tr>
                        <th><label for="voice_id">ElevenLabs Voice ID</label></th>
                        <td>
                            <input type="text" name="voice_id" id="voice_id" class="regular-text" value="<?php echo esc_attr($scenario->voice_id ?? ''); ?>">
                            <p class="description">Die Voice ID für die Stimme des KI-Interviewers (z.B. "ErXwobaYiN019PkySvjV")</p>
                        </td>
                    </tr>
                    <tr>
                        <th><label for="initial_message">Begrüßungsnachricht</label></th>
                        <td>
                            <textarea name="initial_message" id="initial_message" rows="3" class="large-text"><?php echo esc_textarea($scenario->initial_message ?? ''); ?></textarea>
                            <p class="description">Die erste Nachricht, die der KI-Interviewer sagt</p>
                        </td>
                    </tr>
                    <tr>
                        <th><label for="system_prompt">System Prompt</label></th>
                        <td><textarea name="system_prompt" id="system_prompt" rows="10" class="large-text code"><?php echo esc_textarea($scenario->system_prompt ?? ''); ?></textarea></td>
                    </tr>
                    <tr>
                        <th><label for="ai_instructions">KI-Anweisungen</label></th>
                        <td><textarea name="ai_instructions" id="ai_instructions" rows="6" class="large-text code"><?php echo esc_textarea($scenario->ai_instructions ?? ''); ?></textarea></td>
                    </tr>
                    <tr>
                        <th><label for="feedback_prompt">Feedback Prompt</label></th>
                        <td><textarea name="feedback_prompt" id="feedback_prompt" rows="6" class="large-text code"><?php echo esc_textarea($scenario->feedback_prompt ?? ''); ?></textarea></td>
                    </tr>
                    <tr>
                        <th><label for="tips">Tipps (JSON)</label></th>
                        <td><textarea name="tips" id="tips" rows="4" class="large-text code"><?php echo esc_textarea(json_encode($tips, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)); ?></textarea></td>
                    </tr>
                    <tr>
                        <th><label for="input_configuration">Variablen-Konfiguration (JSON)</label></th>
                        <td>
                            <?php
                            $input_config = $scenario->input_configuration ?? '[]';
                            if (!is_string($input_config)) {
                                $input_config = json_encode($input_config, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                            } else {
                                $decoded = json_decode($input_config, true);
                                if ($decoded !== null) {
                                    $input_config = json_encode($decoded, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                                }
                            }
                            ?>
                            <textarea name="input_configuration" id="input_configuration" rows="8" class="large-text code"><?php echo esc_textarea($input_config); ?></textarea>
                            <p class="description">JSON-Array mit Variablen, die der Nutzer vor dem Gespräch eingibt. Beispiel:<br>
                            <code>[{"key":"user_name","label":"Dein Name","type":"text","required":true}]</code></p>
                        </td>
                    </tr>
                </table>

                <h2>Interviewer-Profil</h2>
                <p class="description">Diese Informationen werden dem Nutzer vor dem Gespräch angezeigt.</p>
                <table class="form-table">
                    <tr>
                        <th><label for="interviewer_name">Name des Gesprächspartners</label></th>
                        <td>
                            <input type="text" name="interviewer_name" id="interviewer_name" class="regular-text" value="<?php echo esc_attr($scenario->interviewer_name ?? ''); ?>">
                            <p class="description">Wird als {{interviewer_name}} im System-Prompt verfügbar</p>
                        </td>
                    </tr>
                    <tr>
                        <th><label for="interviewer_role">Rolle/Position</label></th>
                        <td>
                            <input type="text" name="interviewer_role" id="interviewer_role" class="regular-text" value="<?php echo esc_attr($scenario->interviewer_role ?? ''); ?>">
                            <p class="description">z.B. "HR-Manager", "Abteilungsleiter"</p>
                        </td>
                    </tr>
                    <tr>
                        <th><label for="interviewer_image">Profilbild URL</label></th>
                        <td>
                            <input type="url" name="interviewer_image" id="interviewer_image" class="large-text" value="<?php echo esc_attr($scenario->interviewer_image ?? ''); ?>">
                            <p class="description">URL zu einem Profilbild des Interviewers</p>
                        </td>
                    </tr>
                    <tr>
                        <th><label for="interviewer_properties">Eigenschaften</label></th>
                        <td>
                            <textarea name="interviewer_properties" id="interviewer_properties" rows="3" class="large-text"><?php echo esc_textarea($scenario->interviewer_properties ?? ''); ?></textarea>
                            <p class="description">Charaktereigenschaften, zeilengetrennt oder kommagetrennt</p>
                        </td>
                    </tr>
                    <tr>
                        <th><label for="interviewer_objections">Typische Einwände</label></th>
                        <td>
                            <textarea name="interviewer_objections" id="interviewer_objections" rows="3" class="large-text"><?php echo esc_textarea($scenario->interviewer_objections ?? ''); ?></textarea>
                            <p class="description">Typische kritische Fragen oder Einwände</p>
                        </td>
                    </tr>
                    <tr>
                        <th><label for="interviewer_questions">Wichtige Fragen</label></th>
                        <td>
                            <textarea name="interviewer_questions" id="interviewer_questions" rows="3" class="large-text"><?php echo esc_textarea($scenario->interviewer_questions ?? ''); ?></textarea>
                            <p class="description">Wichtige Fragen, die der Interviewer stellen wird</p>
                        </td>
                    </tr>
                </table>

                <h2>Coaching</h2>
                <table class="form-table">
                    <tr>
                        <th><label for="coaching_hints">Coaching-Tipps</label></th>
                        <td>
                            <textarea name="coaching_hints" id="coaching_hints" rows="4" class="large-text"><?php echo esc_textarea($scenario->coaching_hints ?? ''); ?></textarea>
                            <p class="description">Statische Tipps für das Coaching-Panel während des Gesprächs (zeilengetrennt)</p>
                        </td>
                    </tr>
                </table>

                <h2>Einstellungen</h2>
                <table class="form-table">
                    <tr>
                        <th><label>Aktiv</label></th>
                        <td>
                            <label>
                                <input type="checkbox" name="is_active" value="1" <?php checked($scenario->is_active ?? 1, 1); ?>>
                                Szenario ist aktiv und wird im Frontend angezeigt
                            </label>
                        </td>
                    </tr>
                    <tr>
                        <th><label for="sort_order">Sortierung</label></th>
                        <td><input type="number" name="sort_order" id="sort_order" class="small-text" value="<?php echo esc_attr($scenario->sort_order ?? 0); ?>"></td>
                    </tr>
                </table>

                <p class="submit">
                    <input type="submit" class="button button-primary" value="<?php echo $is_edit ? 'Speichern' : 'Erstellen'; ?>">
                    <a href="<?php echo admin_url('admin.php?page=roleplay-scenarios'); ?>" class="button">Abbrechen</a>
                </p>
            </form>
        </div>
        <?php
    }
}
