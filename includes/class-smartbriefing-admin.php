<?php
/**
 * SmartBriefing Admin Page
 *
 * Provides WordPress admin interface for managing SmartBriefing templates
 *
 * @package Bewerbungstrainer
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

/**
 * SmartBriefing Admin Class
 */
class Bewerbungstrainer_SmartBriefing_Admin {

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
        $this->db = Bewerbungstrainer_SmartBriefing_Database::get_instance();
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
        // Submenu under Bewerbungstrainer: All Templates
        add_submenu_page(
            'bewerbungstrainer',
            __('Smart Briefing', 'bewerbungstrainer'),
            __('Smart Briefing', 'bewerbungstrainer'),
            'manage_options',
            'smartbriefing-templates',
            array($this, 'render_templates_page')
        );

        // Submenu: Add New (hidden, accessed via link)
        add_submenu_page(
            null,  // Hidden from menu
            __('Neues Briefing-Template', 'bewerbungstrainer'),
            __('Neues Briefing-Template', 'bewerbungstrainer'),
            'manage_options',
            'smartbriefing-template-new',
            array($this, 'render_edit_page')
        );
    }

    /**
     * Enqueue admin scripts and styles
     */
    public function enqueue_admin_scripts($hook) {
        if (strpos($hook, 'smartbriefing-template') === false) {
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
            .smartbriefing-variables-container {
                border: 1px solid #ddd;
                border-radius: 4px;
                padding: 15px;
                background: #f9f9f9;
            }
            .smartbriefing-variable-item {
                background: #fff;
                border: 1px solid #ddd;
                border-radius: 4px;
                padding: 15px;
                margin-bottom: 10px;
                position: relative;
            }
            .smartbriefing-variable-item:hover {
                border-color: #2271b1;
            }
            .smartbriefing-variable-item .handle {
                cursor: move;
                color: #999;
                margin-right: 10px;
            }
            .smartbriefing-variable-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 10px;
                padding-bottom: 10px;
                border-bottom: 1px solid #eee;
            }
            .smartbriefing-variable-fields {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 10px;
            }
            .smartbriefing-variable-fields .full-width {
                grid-column: 1 / -1;
            }
            .smartbriefing-variable-fields label {
                display: block;
                font-weight: 600;
                margin-bottom: 4px;
                font-size: 12px;
            }
            .smartbriefing-variable-fields input,
            .smartbriefing-variable-fields select,
            .smartbriefing-variable-fields textarea {
                width: 100%;
            }
            .smartbriefing-options-container {
                margin-top: 10px;
                padding: 10px;
                background: #f5f5f5;
                border-radius: 4px;
            }
            .smartbriefing-option-item {
                display: flex;
                gap: 10px;
                margin-bottom: 5px;
            }
            .smartbriefing-option-item input {
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
            .prompt-help {
                background: #e7f3ff;
                border-left: 4px solid #2271b1;
                padding: 10px 15px;
                margin-bottom: 15px;
            }
            .prompt-help code {
                background: #fff;
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
        if (!isset($_GET['page']) || strpos($_GET['page'], 'smartbriefing-template') === false) {
            return;
        }

        // Handle delete action
        if (isset($_GET['action']) && $_GET['action'] === 'delete' && isset($_GET['id'])) {
            if (!wp_verify_nonce($_GET['_wpnonce'], 'delete_smartbriefing_template_' . $_GET['id'])) {
                wp_die('Security check failed');
            }

            $this->db->delete_template(intval($_GET['id']));
            wp_redirect(admin_url('admin.php?page=smartbriefing-templates&deleted=1'));
            exit;
        }

        // Handle form submission
        if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['smartbriefing_template_nonce'])) {
            if (!wp_verify_nonce($_POST['smartbriefing_template_nonce'], 'save_smartbriefing_template')) {
                wp_die('Security check failed');
            }

            $data = $this->sanitize_template_data($_POST);

            if (isset($_POST['template_id']) && !empty($_POST['template_id'])) {
                // Update existing
                $this->db->update_template(intval($_POST['template_id']), $data);
                wp_redirect(admin_url('admin.php?page=smartbriefing-templates&updated=1'));
            } else {
                // Create new
                $this->db->create_template($data);
                wp_redirect(admin_url('admin.php?page=smartbriefing-templates&created=1'));
            }
            exit;
        }
    }

    /**
     * Sanitize template data from form
     */
    private function sanitize_template_data($post) {
        // Build variables_schema from visual builder data
        $variables_schema = $this->build_variables_schema_from_post($post);

        // Handle target_audience (checkboxes array to semicolon-separated string)
        $target_audience = '';
        if (isset($post['target_audience']) && is_array($post['target_audience'])) {
            $target_audience = implode('; ', array_map('sanitize_text_field', $post['target_audience']));
        }

        return array(
            'title' => sanitize_text_field($post['title'] ?? ''),
            'description' => sanitize_textarea_field($post['description'] ?? ''),
            'icon' => sanitize_text_field($post['icon'] ?? 'file-text'),
            'category' => sanitize_text_field($post['category'] ?? 'CAREER'),
            'target_audience' => $target_audience,
            'system_prompt' => wp_kses_post($post['system_prompt'] ?? ''),
            'ai_role' => wp_kses_post($post['ai_role'] ?? ''),
            'ai_task' => wp_kses_post($post['ai_task'] ?? ''),
            'ai_behavior' => wp_kses_post($post['ai_behavior'] ?? ''),
            'allow_custom_variables' => isset($post['allow_custom_variables']) ? 1 : 0,
            'variables_schema' => json_encode($variables_schema, JSON_UNESCAPED_UNICODE),
            'is_active' => isset($post['is_active']) ? 1 : 0,
            'sort_order' => intval($post['sort_order'] ?? 0),
        );
    }

    /**
     * Build variables_schema array from POST data
     */
    private function build_variables_schema_from_post($post) {
        $schema = array();

        if (!isset($post['var_key']) || !is_array($post['var_key'])) {
            return $schema;
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

            $schema[] = $field;
        }

        return $schema;
    }

    /**
     * Handle CSV import/export actions
     */
    public function handle_csv_actions() {
        if (!current_user_can('manage_options')) {
            return;
        }

        // Export CSV
        if (isset($_GET['action']) && $_GET['action'] === 'export_csv' && isset($_GET['page']) && $_GET['page'] === 'smartbriefing-templates') {
            if (!wp_verify_nonce($_GET['_wpnonce'], 'export_smartbriefing_templates')) {
                wp_die('Security check failed');
            }
            $this->export_templates_csv();
            exit;
        }

        // Import CSV
        if (isset($_POST['smartbriefing_import_csv']) && isset($_FILES['csv_file'])) {
            if (!wp_verify_nonce($_POST['_wpnonce'], 'import_smartbriefing_templates')) {
                wp_die('Security check failed');
            }
            $this->import_templates_csv($_FILES['csv_file']);
        }
    }

    /**
     * Export templates to CSV
     */
    private function export_templates_csv() {
        $templates = $this->db->get_templates(array('is_active' => null));

        $filename = 'smartbriefing-templates-' . date('Y-m-d-His') . '.csv';

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
            'category',
            'target_audience',
            'system_prompt',
            'ai_role',
            'ai_task',
            'ai_behavior',
            'allow_custom_variables',
            'variables_schema',
            'is_active',
            'sort_order'
        ), ';');

        // Data rows
        foreach ($templates as $template) {
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

            // Clean JSON schema - decode and re-encode with proper flags
            $vars_schema = $template->variables_schema;
            if (is_array($vars_schema)) {
                $vars_schema = json_encode($vars_schema, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            } elseif (is_string($vars_schema) && !empty($vars_schema)) {
                // Decode existing JSON, clean it, and re-encode
                $decoded = json_decode($vars_schema, true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                    $vars_schema = json_encode($decoded, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                }
            }

            fputcsv($output, array(
                $template->id,
                $clean_text($template->title),
                $clean_text($template->description),
                $template->icon,
                $template->category,
                $clean_text($template->target_audience ?? ''),
                $clean_text($template->system_prompt),
                $clean_text($template->ai_role ?? ''),
                $clean_text($template->ai_task ?? ''),
                $clean_text($template->ai_behavior ?? ''),
                $template->allow_custom_variables ?? 0,
                $vars_schema,
                $template->is_active,
                $template->sort_order
            ), ';');
        }

        fclose($output);
    }

    /**
     * Import templates from CSV
     */
    private function import_templates_csv($file) {
        if ($file['error'] !== UPLOAD_ERR_OK) {
            wp_redirect(admin_url('admin.php?page=smartbriefing-templates&import_error=upload'));
            exit;
        }

        $handle = fopen($file['tmp_name'], 'r');
        if (!$handle) {
            wp_redirect(admin_url('admin.php?page=smartbriefing-templates&import_error=read'));
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
            wp_redirect(admin_url('admin.php?page=smartbriefing-templates&import_error=format'));
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

            // Parse variables_schema JSON
            $vars_schema = '[]';
            if (!empty($data['variables_schema'])) {
                $parsed = json_decode($data['variables_schema'], true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    $vars_schema = json_encode($parsed, JSON_UNESCAPED_UNICODE);
                }
            }

            // Prepare template data - restore newlines for text fields
            $template_data = array(
                'title' => sanitize_text_field($data['title'] ?? ''),
                'description' => sanitize_textarea_field($restore_newlines($data['description'] ?? '')),
                'icon' => sanitize_text_field($data['icon'] ?? 'file-text'),
                'category' => sanitize_text_field($data['category'] ?? 'CAREER'),
                'target_audience' => sanitize_text_field($restore_newlines($data['target_audience'] ?? '')),
                'system_prompt' => wp_kses_post($restore_newlines($data['system_prompt'] ?? '')),
                'ai_role' => wp_kses_post($restore_newlines($data['ai_role'] ?? '')),
                'ai_task' => wp_kses_post($restore_newlines($data['ai_task'] ?? '')),
                'ai_behavior' => wp_kses_post($restore_newlines($data['ai_behavior'] ?? '')),
                'allow_custom_variables' => intval($data['allow_custom_variables'] ?? 0),
                'variables_schema' => $vars_schema,
                'is_active' => intval($data['is_active'] ?? 1),
                'sort_order' => intval($data['sort_order'] ?? 0),
            );

            // Check if updating existing by ID
            if (!empty($data['id']) && is_numeric($data['id'])) {
                $existing = $this->db->get_template(intval($data['id']));
                if ($existing) {
                    $this->db->update_template(intval($data['id']), $template_data);
                    $updated++;
                    continue;
                }
            }

            // Create new
            $this->db->create_template($template_data);
            $imported++;
        }

        fclose($handle);

        wp_redirect(admin_url('admin.php?page=smartbriefing-templates&imported=' . $imported . '&csv_updated=' . $updated));
        exit;
    }

    /**
     * Render templates list page
     */
    public function render_templates_page() {
        // Get all templates including inactive ones
        $templates = $this->db->get_templates(array('is_active' => null));

        // Show notices
        if (isset($_GET['deleted'])) {
            echo '<div class="notice notice-success is-dismissible"><p>Template gelöscht.</p></div>';
        }
        if (isset($_GET['updated'])) {
            echo '<div class="notice notice-success is-dismissible"><p>Template aktualisiert.</p></div>';
        }
        if (isset($_GET['created'])) {
            echo '<div class="notice notice-success is-dismissible"><p>Template erstellt.</p></div>';
        }
        if (isset($_GET['imported'])) {
            $imported = intval($_GET['imported']);
            $updated = isset($_GET['csv_updated']) ? intval($_GET['csv_updated']) : 0;
            echo '<div class="notice notice-success is-dismissible"><p>' . sprintf('%d Template(s) importiert, %d aktualisiert.', $imported, $updated) . '</p></div>';
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
            <h1 class="wp-heading-inline">Smart Briefing - Templates</h1>
            <a href="<?php echo admin_url('admin.php?page=smartbriefing-template-new'); ?>" class="page-title-action">Neues Template hinzufügen</a>
            <a href="<?php echo wp_nonce_url(admin_url('admin.php?page=smartbriefing-templates&action=export_csv'), 'export_smartbriefing_templates'); ?>" class="page-title-action">CSV Export</a>
            <hr class="wp-header-end">

            <!-- Import Form -->
            <div style="margin: 15px 0; padding: 15px; background: #fff; border: 1px solid #ccd0d4; border-radius: 4px;">
                <form method="post" enctype="multipart/form-data" style="display: flex; align-items: center; gap: 10px;">
                    <?php wp_nonce_field('import_smartbriefing_templates'); ?>
                    <label><strong>CSV Import:</strong></label>
                    <input type="file" name="csv_file" accept=".csv" required>
                    <button type="submit" name="smartbriefing_import_csv" class="button">Importieren</button>
                    <span class="description">CSV-Datei mit Semikolon (;) als Trennzeichen</span>
                </form>
            </div>

            <p class="description">
                Mit Smart Briefing können Nutzer strukturierte Vorbereitungs-Dossiers für Gespräche, Verhandlungen und andere Situationen generieren lassen.
            </p>

            <table class="wp-list-table widefat fixed striped">
                <thead>
                    <tr>
                        <th style="width: 50px;">ID</th>
                        <th>Titel</th>
                        <th style="width: 100px;">Icon</th>
                        <th style="width: 120px;">Kategorie</th>
                        <th style="width: 100px;">Variablen</th>
                        <th style="width: 80px;">Aktiv</th>
                        <th style="width: 150px;">Aktionen</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (empty($templates)): ?>
                        <tr>
                            <td colspan="7">Keine Templates gefunden. <a href="<?php echo admin_url('admin.php?page=smartbriefing-template-new'); ?>">Erstelle dein erstes Template</a>.</td>
                        </tr>
                    <?php else: ?>
                        <?php foreach ($templates as $template): ?>
                            <tr>
                                <td><?php echo esc_html($template->id); ?></td>
                                <td>
                                    <strong>
                                        <a href="<?php echo admin_url('admin.php?page=smartbriefing-template-new&id=' . $template->id); ?>">
                                            <?php echo esc_html($template->title); ?>
                                        </a>
                                    </strong>
                                    <br>
                                    <span class="description"><?php echo esc_html(wp_trim_words($template->description, 10)); ?></span>
                                </td>
                                <td>
                                    <span class="dashicons dashicons-<?php echo esc_attr($this->get_dashicon($template->icon)); ?>"></span>
                                    <?php echo esc_html($template->icon); ?>
                                </td>
                                <td>
                                    <?php
                                    $cat_db = Bewerbungstrainer_Categories_Database::get_instance();
                                    $cat_obj = $cat_db->get_category_by_slug($template->category);
                                    if ($cat_obj) {
                                        $cat_color = esc_attr($cat_obj->color);
                                        $cat_name = esc_html($cat_obj->short_name ?: $cat_obj->name);
                                        echo '<span style="color: ' . $cat_color . ';">' . $cat_name . '</span>';
                                    } else {
                                        echo esc_html($template->category);
                                    }
                                    ?>
                                </td>
                                <td>
                                    <?php
                                    $vars = is_array($template->variables_schema) ? $template->variables_schema : array();
                                    echo count($vars);
                                    ?>
                                </td>
                                <td>
                                    <?php if ($template->is_active): ?>
                                        <span style="color: #22c55e;">&#10004; Ja</span>
                                    <?php else: ?>
                                        <span style="color: #999;">&#10008; Nein</span>
                                    <?php endif; ?>
                                </td>
                                <td>
                                    <a href="<?php echo admin_url('admin.php?page=smartbriefing-template-new&id=' . $template->id); ?>" class="button button-small">Bearbeiten</a>
                                    <a href="<?php echo wp_nonce_url(admin_url('admin.php?page=smartbriefing-templates&action=delete&id=' . $template->id), 'delete_smartbriefing_template_' . $template->id); ?>"
                                       class="button button-small button-link-delete"
                                       onclick="return confirm('Wirklich löschen?');">Löschen</a>
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
     * Render edit/new template page
     */
    public function render_edit_page() {
        $template = null;
        $is_edit = false;

        if (isset($_GET['id'])) {
            $template = $this->db->get_template(intval($_GET['id']));
            $is_edit = (bool) $template;
        }

        // Default values
        $defaults = array(
            'id' => '',
            'title' => '',
            'description' => '',
            'icon' => 'file-text',
            'category' => 'CAREER',
            'system_prompt' => '',
            'ai_role' => '',
            'ai_task' => '',
            'ai_behavior' => '',
            'allow_custom_variables' => 0,
            'variables_schema' => array(),
            'is_active' => 1,
            'sort_order' => 0,
        );

        $data = $template ? (array) $template : $defaults;

        // Ensure variables_schema is an array
        if (!is_array($data['variables_schema'])) {
            $data['variables_schema'] = array();
        }

        // Available icons
        $icons = array(
            'file-text' => 'Dokument',
            'briefcase' => 'Aktenkoffer',
            'banknote' => 'Geldschein',
            'users' => 'Benutzer',
            'user' => 'Person',
            'message-circle' => 'Sprechblase',
            'target' => 'Ziel',
            'award' => 'Auszeichnung',
            'book' => 'Buch',
            'clipboard' => 'Klemmbrett',
            'star' => 'Stern',
            'lightbulb' => 'Glühbirne',
            'shield' => 'Schild',
            'compass' => 'Kompass',
            'rocket' => 'Rakete',
        );

        // Get categories from centralized database
        $categories_db = Bewerbungstrainer_Categories_Database::get_instance();
        $categories_list = $categories_db->get_categories();
        ?>
        <div class="wrap">
            <h1><?php echo $is_edit ? 'Template bearbeiten' : 'Neues Briefing-Template'; ?></h1>

            <form method="post" action="">
                <?php wp_nonce_field('save_smartbriefing_template', 'smartbriefing_template_nonce'); ?>
                <input type="hidden" name="template_id" value="<?php echo esc_attr($data['id']); ?>">

                <div id="poststuff">
                    <div id="post-body" class="metabox-holder columns-2">

                        <!-- Main Content -->
                        <div id="post-body-content">

                            <!-- Basic Info -->
                            <div class="postbox">
                                <h2 class="hndle"><span>Grundinformationen</span></h2>
                                <div class="inside">
                                    <table class="form-table">
                                        <tr>
                                            <th><label for="title">Titel *</label></th>
                                            <td>
                                                <input type="text" name="title" id="title" class="regular-text"
                                                       value="<?php echo esc_attr($data['title']); ?>" required>
                                                <p class="description">Der Name des Briefing-Templates, z.B. "Job Interview Deep-Dive"</p>
                                            </td>
                                        </tr>
                                        <tr>
                                            <th><label for="description">Beschreibung</label></th>
                                            <td>
                                                <textarea name="description" id="description" rows="3" class="large-text"><?php echo esc_textarea($data['description']); ?></textarea>
                                                <p class="description">Kurze Beschreibung für den Nutzer</p>
                                            </td>
                                        </tr>
                                        <tr>
                                            <th><label for="icon">Icon</label></th>
                                            <td>
                                                <select name="icon" id="icon">
                                                    <?php foreach ($icons as $icon_key => $icon_label): ?>
                                                        <option value="<?php echo esc_attr($icon_key); ?>" <?php selected($data['icon'], $icon_key); ?>>
                                                            <?php echo esc_html($icon_label); ?> (<?php echo esc_html($icon_key); ?>)
                                                        </option>
                                                    <?php endforeach; ?>
                                                </select>
                                            </td>
                                        </tr>
                                        <tr>
                                            <th><label for="category">Kategorie</label></th>
                                            <td>
                                                <?php Bewerbungstrainer_Categories_Admin::render_category_dropdown($data['category'], 'category'); ?>
                                                <p class="description">
                                                    <a href="<?php echo admin_url('admin.php?page=bewerbungstrainer-categories'); ?>">Kategorien verwalten</a>
                                                </p>
                                            </td>
                                        </tr>
                                        <tr>
                                            <th><label>Trainings-Setups</label></th>
                                            <td>
                                                <?php $this->render_setups_checkboxes($data['target_audience'] ?? ''); ?>
                                                <p class="description">Wähle die Setups, in denen dieses Template angezeigt werden soll.</p>
                                            </td>
                                        </tr>
                                    </table>
                                </div>
                            </div>

                            <!-- Structured Prompt Fields -->
                            <div class="postbox">
                                <h2 class="hndle"><span>KI-Prompt (Strukturiert)</span></h2>
                                <div class="inside">
                                    <div class="prompt-help">
                                        <strong>Variable Platzhalter:</strong> Verwende <code>${variable_key}</code> um Benutzereingaben in den Prompt einzufügen.
                                        <br>Beispiel: <code>${target_company}</code> wird durch den vom Nutzer eingegebenen Firmennamen ersetzt.
                                        <br>Für optionale Variablen: <code>${?key:Prefix }</code> - wird nur eingefügt wenn die Variable einen Wert hat.
                                        <br><br><strong>Hinweis:</strong> Alle vom Nutzer erfassten Variablen werden automatisch als "User-Daten" in den Prompt eingefügt.
                                    </div>

                                    <!-- Default Values Button -->
                                    <p style="margin-bottom: 20px;">
                                        <button type="button" class="button" id="fill-defaults-btn">📝 Standard einfügen</button>
                                        <span class="description" style="margin-left: 10px;">Fügt bewährte Standardwerte für Karriere-Briefings ein</span>
                                    </p>

                                    <table class="form-table">
                                        <tr>
                                            <th><label for="ai_role">KI-Rolle (Persona)</label></th>
                                            <td>
                                                <textarea name="ai_role" id="ai_role" rows="3" class="large-text code"><?php echo esc_textarea($data['ai_role'] ?? ''); ?></textarea>
                                                <p class="description">Wer ist die KI? Z.B. "Du bist ein strategischer Karriere-Coach..."</p>
                                            </td>
                                        </tr>
                                        <tr>
                                            <th><label for="ai_task">KI-Aufgabe (Was)</label></th>
                                            <td>
                                                <textarea name="ai_task" id="ai_task" rows="12" class="large-text code"><?php echo esc_textarea($data['ai_task'] ?? ''); ?></textarea>
                                                <p class="description">Was soll die KI erstellen? Definiere Struktur und Abschnitte des Briefings.</p>
                                            </td>
                                        </tr>
                                        <tr>
                                            <th><label for="ai_behavior">KI-Verhalten (Wie)</label></th>
                                            <td>
                                                <textarea name="ai_behavior" id="ai_behavior" rows="3" class="large-text code"><?php echo esc_textarea($data['ai_behavior'] ?? ''); ?></textarea>
                                                <p class="description">Wie soll die KI antworten? Tonalität, Stil, spezielle Anweisungen.</p>
                                            </td>
                                        </tr>
                                    </table>

                                    <!-- Legacy system_prompt (hidden, for backward compatibility) -->
                                    <input type="hidden" name="system_prompt" id="system_prompt" value="<?php echo esc_attr($data['system_prompt'] ?? ''); ?>">
                                </div>
                            </div>

                            <!-- Variables Builder -->
                            <div class="postbox">
                                <h2 class="hndle"><span>Eingabefelder (Variablen)</span></h2>
                                <div class="inside">
                                    <p class="description">Definiere die Eingabefelder, die der Nutzer ausfüllen muss. Die Keys können dann im Prompt als <code>${key}</code> verwendet werden.</p>

                                    <div class="smartbriefing-variables-container" id="variables-container">
                                        <?php if (empty($data['variables_schema'])): ?>
                                            <p class="no-variables-notice">Noch keine Eingabefelder definiert. Klicke auf "Feld hinzufügen" um zu beginnen.</p>
                                        <?php else: ?>
                                            <?php foreach ($data['variables_schema'] as $index => $var): ?>
                                                <?php $this->render_variable_item($index, $var); ?>
                                            <?php endforeach; ?>
                                        <?php endif; ?>
                                    </div>

                                    <button type="button" class="button add-variable-btn" id="add-variable">+ Feld hinzufügen</button>
                                </div>
                            </div>

                        </div>

                        <!-- Sidebar -->
                        <div id="postbox-container-1" class="postbox-container">
                            <div class="postbox">
                                <h2 class="hndle"><span>Veröffentlichen</span></h2>
                                <div class="inside">
                                    <div class="submitbox">
                                        <p>
                                            <label>
                                                <input type="checkbox" name="is_active" value="1" <?php checked($data['is_active'], 1); ?>>
                                                Aktiv (für Nutzer sichtbar)
                                            </label>
                                        </p>
                                        <p>
                                            <label>
                                                <input type="checkbox" name="allow_custom_variables" value="1" <?php checked($data['allow_custom_variables'] ?? 0, 1); ?>>
                                                Nutzer kann eigene Variablen hinzufügen
                                            </label>
                                            <br><span class="description" style="font-size: 11px; color: #666;">Zeigt "Zusätzliche Variablen" im Frontend</span>
                                        </p>
                                        <p>
                                            <label for="sort_order">Reihenfolge:</label>
                                            <input type="number" name="sort_order" id="sort_order" value="<?php echo esc_attr($data['sort_order']); ?>" style="width: 60px;">
                                        </p>
                                        <hr>
                                        <p>
                                            <input type="submit" class="button button-primary button-large" value="<?php echo $is_edit ? 'Aktualisieren' : 'Template erstellen'; ?>">
                                            <a href="<?php echo admin_url('admin.php?page=smartbriefing-templates'); ?>" class="button">Abbrechen</a>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div class="postbox">
                                <h2 class="hndle"><span>Hilfe</span></h2>
                                <div class="inside">
                                    <p><strong>So funktioniert Smart Briefing:</strong></p>
                                    <ol>
                                        <li>Definiere Eingabefelder (z.B. Firma, Position)</li>
                                        <li>Schreibe einen KI-Prompt mit Platzhaltern</li>
                                        <li>Nutzer füllt die Felder aus</li>
                                        <li>KI generiert ein personalisiertes Briefing</li>
                                    </ol>
                                    <p><strong>Prompt-Tipps:</strong></p>
                                    <ul>
                                        <li>Nutze ### für Überschriften</li>
                                        <li>Definiere klare Sektionen</li>
                                        <li>Sei spezifisch mit Anweisungen</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </form>
        </div>

        <script type="text/template" id="variable-item-template">
            <?php $this->render_variable_item('{{INDEX}}', array()); ?>
        </script>

        <script type="text/template" id="option-item-template">
            <div class="smartbriefing-option-item">
                <input type="text" name="var_options[{{INDEX}}][value][]" placeholder="Wert (value)" value="">
                <input type="text" name="var_options[{{INDEX}}][label][]" placeholder="Anzeigename (label)" value="">
                <button type="button" class="remove-btn remove-option" title="Option entfernen">&times;</button>
            </div>
        </script>

        <script>
        jQuery(function($) {
            var variableIndex = <?php echo count($data['variables_schema']); ?>;

            // Make variables sortable
            $('#variables-container').sortable({
                handle: '.handle',
                items: '.smartbriefing-variable-item',
                placeholder: 'sortable-placeholder',
                update: function() {
                    // Reindex after sorting if needed
                }
            });

            // Add new variable
            $('#add-variable').on('click', function() {
                var template = $('#variable-item-template').html();
                template = template.replace(/\{\{INDEX\}\}/g, variableIndex);
                $('#variables-container').append(template);
                $('.no-variables-notice').hide();
                variableIndex++;
            });

            // Remove variable
            $(document).on('click', '.remove-variable', function() {
                $(this).closest('.smartbriefing-variable-item').remove();
                if ($('.smartbriefing-variable-item').length === 0) {
                    $('.no-variables-notice').show();
                }
            });

            // Toggle options container based on type
            $(document).on('change', '.var-type-select', function() {
                var $item = $(this).closest('.smartbriefing-variable-item');
                var type = $(this).val();
                if (type === 'select') {
                    $item.find('.smartbriefing-options-container').show();
                } else {
                    $item.find('.smartbriefing-options-container').hide();
                }
            });

            // Add option
            $(document).on('click', '.add-option-btn', function() {
                var $container = $(this).siblings('.options-list');
                var index = $(this).closest('.smartbriefing-variable-item').data('index');
                var template = $('#option-item-template').html();
                template = template.replace(/\{\{INDEX\}\}/g, index);
                $container.append(template);
            });

            // Remove option
            $(document).on('click', '.remove-option', function() {
                $(this).closest('.smartbriefing-option-item').remove();
            });

            // Auto-generate key from label
            $(document).on('blur', '.var-label-input', function() {
                var $item = $(this).closest('.smartbriefing-variable-item');
                var $keyInput = $item.find('.var-key-input');

                if ($keyInput.val() === '') {
                    var label = $(this).val();
                    // Convert to snake_case key
                    var key = label.toLowerCase()
                        .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
                        .replace(/[^a-z0-9]+/g, '_')
                        .replace(/^_|_$/g, '');
                    $keyInput.val(key);
                    $item.find('.variable-key-preview').text('${' + key + '}');
                }
            });

            // Update key preview on key change
            $(document).on('input', '.var-key-input', function() {
                var $item = $(this).closest('.smartbriefing-variable-item');
                var key = $(this).val();
                $item.find('.variable-key-preview').text('${' + key + '}');
            });

            // Fill default values button
            $('#fill-defaults-btn').on('click', function() {
                var defaultRole = 'Du bist ein strategischer Karriere-Coach. Erstelle ein maßgeschneidertes Briefing für den Nutzer.';

                var defaultTask = `Generiere eine strukturierte Checkliste in Markdown.

Struktur:
### 1. Dein Personal Pitch 👤
[Erstelle 5 provokante Leitfragen, um die Story für \${role_name} zu schärfen.]

### 2. Fachliche "Must-Haves" für \${target_company} 🛠️
[Liste 6-7 konkrete Fachbegriffe, Tools oder Trends, die für diese Firma aktuell entscheidend sind.]

### 3. Insider-Wissen & Kultur 🏢
[Was muss man über \${target_company} wissen? Werte, aktuelle News?]

### 4. Smart Questions ❓
[5 intelligente Rückfragen an den Recruiter.]`;

                var defaultBehavior = 'Sei motivierend, spezifisch und professionell und achte strikt bei der Beantwortung der Fragen auf das Karrierelevel, so dass es angemessen ist.';

                // Only fill if fields are empty, or confirm overwrite
                var hasContent = $('#ai_role').val().trim() || $('#ai_task').val().trim() || $('#ai_behavior').val().trim();

                if (hasContent) {
                    if (!confirm('Die bestehenden Werte werden überschrieben. Fortfahren?')) {
                        return;
                    }
                }

                $('#ai_role').val(defaultRole);
                $('#ai_task').val(defaultTask);
                $('#ai_behavior').val(defaultBehavior);
            });
        });
        </script>
        <?php
    }

    /**
     * Render a single variable item in the builder
     */
    private function render_variable_item($index, $var) {
        $defaults = array(
            'key' => '',
            'label' => '',
            'type' => 'text',
            'required' => false,
            'placeholder' => '',
            'default' => '',
            'options' => array(),
        );
        $var = wp_parse_args($var, $defaults);
        ?>
        <div class="smartbriefing-variable-item" data-index="<?php echo esc_attr($index); ?>">
            <div class="smartbriefing-variable-header">
                <span>
                    <span class="handle dashicons dashicons-menu"></span>
                    <span class="variable-key-preview">${<?php echo esc_html($var['key'] ?: 'key'); ?>}</span>
                </span>
                <button type="button" class="remove-btn remove-variable" title="Feld entfernen">&times;</button>
            </div>
            <div class="smartbriefing-variable-fields">
                <div>
                    <label>Key (Variable) *</label>
                    <input type="text" name="var_key[]" class="var-key-input" value="<?php echo esc_attr($var['key']); ?>" placeholder="z.B. target_company" pattern="[a-z_]+" required>
                </div>
                <div>
                    <label>Label (Anzeigename) *</label>
                    <input type="text" name="var_label[]" class="var-label-input" value="<?php echo esc_attr($var['label']); ?>" placeholder="z.B. Zielunternehmen" required>
                </div>
                <div>
                    <label>Typ</label>
                    <select name="var_type[]" class="var-type-select">
                        <option value="text" <?php selected($var['type'], 'text'); ?>>Text (einzeilig)</option>
                        <option value="textarea" <?php selected($var['type'], 'textarea'); ?>>Textarea (mehrzeilig)</option>
                        <option value="select" <?php selected($var['type'], 'select'); ?>>Dropdown (Auswahl)</option>
                    </select>
                </div>
                <div>
                    <label>
                        <input type="checkbox" name="var_required[<?php echo esc_attr($index); ?>]" value="1" <?php checked($var['required']); ?>>
                        Pflichtfeld
                    </label>
                </div>
                <div class="full-width">
                    <label>Placeholder</label>
                    <input type="text" name="var_placeholder[]" value="<?php echo esc_attr($var['placeholder']); ?>" placeholder="Hinweistext im leeren Feld">
                </div>
                <div class="full-width">
                    <label>Standardwert</label>
                    <input type="text" name="var_default[]" value="<?php echo esc_attr($var['default']); ?>" placeholder="Optionaler Standardwert">
                </div>

                <!-- Options for select type -->
                <div class="full-width smartbriefing-options-container" style="<?php echo $var['type'] !== 'select' ? 'display:none;' : ''; ?>">
                    <label>Auswahloptionen:</label>
                    <div class="options-list">
                        <?php if (!empty($var['options'])): ?>
                            <?php foreach ($var['options'] as $opt): ?>
                                <div class="smartbriefing-option-item">
                                    <input type="text" name="var_options[<?php echo esc_attr($index); ?>][value][]" placeholder="Wert (value)" value="<?php echo esc_attr($opt['value']); ?>">
                                    <input type="text" name="var_options[<?php echo esc_attr($index); ?>][label][]" placeholder="Anzeigename (label)" value="<?php echo esc_attr($opt['label']); ?>">
                                    <button type="button" class="remove-btn remove-option" title="Option entfernen">&times;</button>
                                </div>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </div>
                    <button type="button" class="button button-small add-option-btn">+ Option hinzufügen</button>
                </div>
            </div>
        </div>
        <?php
    }

    /**
     * Map icon name to dashicon
     */
    private function get_dashicon($icon) {
        $map = array(
            'file-text' => 'media-document',
            'briefcase' => 'portfolio',
            'banknote' => 'money-alt',
            'users' => 'groups',
            'user' => 'admin-users',
            'message-circle' => 'format-chat',
            'target' => 'marker',
            'award' => 'awards',
            'book' => 'book',
            'clipboard' => 'clipboard',
            'star' => 'star-filled',
            'lightbulb' => 'lightbulb',
            'shield' => 'shield',
            'compass' => 'location',
            'rocket' => 'airplane',
        );

        return isset($map[$icon]) ? $map[$icon] : 'admin-generic';
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
