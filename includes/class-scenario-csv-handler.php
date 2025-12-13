<?php
/**
 * Scenario CSV Handler
 *
 * Handles CSV export and import for both Simulator and Roleplay scenarios
 *
 * @package Bewerbungstrainer
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Scenario CSV Handler Class
 */
class Bewerbungstrainer_Scenario_CSV_Handler {

    /**
     * Instance of this class
     */
    private static $instance = null;

    /**
     * Simulator database instance
     */
    private $simulator_db;

    /**
     * Roleplay scenarios instance
     */
    private $roleplay_scenarios;

    /**
     * CSV delimiter
     */
    const CSV_DELIMITER = ';';

    /**
     * CSV enclosure
     */
    const CSV_ENCLOSURE = '"';

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
        $this->simulator_db = Bewerbungstrainer_Simulator_Database::get_instance();
        $this->roleplay_scenarios = Bewerbungstrainer_Roleplay_Scenarios::get_instance();
        $this->init_hooks();
    }

    /**
     * Initialize hooks
     */
    private function init_hooks() {
        add_action('admin_init', array($this, 'handle_csv_actions'));
    }

    /**
     * Handle CSV export/import actions
     */
    public function handle_csv_actions() {
        // Handle Simulator CSV Export
        if (isset($_GET['action']) && $_GET['action'] === 'export_simulator_csv') {
            if (!wp_verify_nonce($_GET['_wpnonce'] ?? '', 'export_simulator_csv')) {
                wp_die('Security check failed');
            }
            if (!current_user_can('manage_options')) {
                wp_die('Permission denied');
            }
            $this->export_simulator_scenarios_csv();
            exit;
        }

        // Handle Roleplay CSV Export
        if (isset($_GET['action']) && $_GET['action'] === 'export_roleplay_csv') {
            if (!wp_verify_nonce($_GET['_wpnonce'] ?? '', 'export_roleplay_csv')) {
                wp_die('Security check failed');
            }
            if (!current_user_can('manage_options')) {
                wp_die('Permission denied');
            }
            $this->export_roleplay_scenarios_csv();
            exit;
        }

        // Handle Simulator CSV Import
        if (isset($_POST['action']) && $_POST['action'] === 'import_simulator_csv') {
            if (!wp_verify_nonce($_POST['_wpnonce'] ?? '', 'import_simulator_csv')) {
                wp_die('Security check failed');
            }
            if (!current_user_can('manage_options')) {
                wp_die('Permission denied');
            }
            $this->handle_simulator_import();
        }

        // Handle Roleplay CSV Import
        if (isset($_POST['action']) && $_POST['action'] === 'import_roleplay_csv') {
            if (!wp_verify_nonce($_POST['_wpnonce'] ?? '', 'import_roleplay_csv')) {
                wp_die('Security check failed');
            }
            if (!current_user_can('manage_options')) {
                wp_die('Permission denied');
            }
            $this->handle_roleplay_import();
        }
    }

    // =========================================================================
    // SIMULATOR SCENARIOS - EXPORT
    // =========================================================================

    /**
     * Get CSV headers for Simulator scenarios
     */
    private function get_simulator_csv_headers() {
        return array(
            'id',
            'title',
            'description',
            'icon',
            'difficulty',
            'category',
            'mode',
            'system_prompt',
            'question_generation_prompt',
            'feedback_prompt',
            'input_configuration',
            'question_count_min',
            'question_count_max',
            'time_limit_per_question',
            'allow_retry',
            'is_active',
            'sort_order',
        );
    }

    /**
     * Export Simulator scenarios to CSV
     */
    public function export_simulator_scenarios_csv() {
        // Get all scenarios (including inactive)
        $scenarios = $this->simulator_db->get_scenarios(array('is_active' => null));

        // Set headers for file download
        $filename = 'simulator-scenarios-' . date('Y-m-d-His') . '.csv';
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Pragma: no-cache');
        header('Expires: 0');

        // Open output stream
        $output = fopen('php://output', 'w');

        // Add BOM for Excel UTF-8 compatibility
        fprintf($output, chr(0xEF) . chr(0xBB) . chr(0xBF));

        // Write headers
        fputcsv($output, $this->get_simulator_csv_headers(), self::CSV_DELIMITER, self::CSV_ENCLOSURE);

        // Write data rows
        foreach ($scenarios as $scenario) {
            $row = array(
                $scenario->id,
                $scenario->title,
                $scenario->description ?? '',
                $scenario->icon ?? 'briefcase',
                $scenario->difficulty ?? 'intermediate',
                $scenario->category ?? 'CAREER',
                $scenario->mode ?? 'INTERVIEW',
                $scenario->system_prompt ?? '',
                $scenario->question_generation_prompt ?? '',
                $scenario->feedback_prompt ?? '',
                // input_configuration is already decoded as array, encode it back to JSON
                is_array($scenario->input_configuration)
                    ? json_encode($scenario->input_configuration, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)
                    : ($scenario->input_configuration ?? '[]'),
                $scenario->question_count_min ?? 8,
                $scenario->question_count_max ?? 12,
                $scenario->time_limit_per_question ?? 120,
                $scenario->allow_retry ?? 1,
                $scenario->is_active ?? 1,
                $scenario->sort_order ?? 0,
            );

            fputcsv($output, $row, self::CSV_DELIMITER, self::CSV_ENCLOSURE);
        }

        fclose($output);
    }

    // =========================================================================
    // SIMULATOR SCENARIOS - IMPORT
    // =========================================================================

    /**
     * Handle Simulator CSV import
     */
    private function handle_simulator_import() {
        if (!isset($_FILES['csv_file']) || $_FILES['csv_file']['error'] !== UPLOAD_ERR_OK) {
            $this->redirect_with_message('simulator-scenarios', 'error', 'Keine Datei hochgeladen oder Fehler beim Upload.');
            return;
        }

        $file = $_FILES['csv_file'];

        // Validate file type
        $file_ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if ($file_ext !== 'csv') {
            $this->redirect_with_message('simulator-scenarios', 'error', 'Nur CSV-Dateien sind erlaubt.');
            return;
        }

        // Check import mode
        $import_mode = sanitize_text_field($_POST['import_mode'] ?? 'add');

        // Read and parse CSV
        $result = $this->parse_simulator_csv($file['tmp_name'], $import_mode);

        if ($result['success']) {
            $this->redirect_with_message(
                'simulator-scenarios',
                'success',
                sprintf(
                    'Import erfolgreich: %d Szenarien erstellt, %d aktualisiert, %d übersprungen.',
                    $result['created'],
                    $result['updated'],
                    $result['skipped']
                )
            );
        } else {
            $this->redirect_with_message('simulator-scenarios', 'error', $result['message']);
        }
    }

    /**
     * Parse Simulator CSV file
     */
    private function parse_simulator_csv($filepath, $import_mode) {
        $handle = fopen($filepath, 'r');
        if ($handle === false) {
            return array('success' => false, 'message' => 'Datei konnte nicht geöffnet werden.');
        }

        // Skip BOM if present
        $bom = fread($handle, 3);
        if ($bom !== chr(0xEF) . chr(0xBB) . chr(0xBF)) {
            rewind($handle);
        }

        // Read header row
        $headers = fgetcsv($handle, 0, self::CSV_DELIMITER, self::CSV_ENCLOSURE);
        if ($headers === false) {
            fclose($handle);
            return array('success' => false, 'message' => 'CSV-Header konnte nicht gelesen werden.');
        }

        // Clean headers (trim whitespace and BOM)
        $headers = array_map(function($h) {
            return trim(preg_replace('/[\x00-\x1F\x80-\xFF]/', '', $h));
        }, $headers);

        // Validate required headers
        $required_headers = array('title', 'system_prompt');
        foreach ($required_headers as $required) {
            if (!in_array($required, $headers)) {
                fclose($handle);
                return array('success' => false, 'message' => "Pflichtfeld '{$required}' fehlt in der CSV-Datei.");
            }
        }

        $created = 0;
        $updated = 0;
        $skipped = 0;
        $row_number = 1;

        while (($row = fgetcsv($handle, 0, self::CSV_DELIMITER, self::CSV_ENCLOSURE)) !== false) {
            $row_number++;

            // Skip empty rows
            if (empty(array_filter($row))) {
                $skipped++;
                continue;
            }

            // Create associative array from row
            $data = array();
            foreach ($headers as $index => $header) {
                $data[$header] = isset($row[$index]) ? $row[$index] : '';
            }

            // Validate required fields
            if (empty($data['title']) || empty($data['system_prompt'])) {
                $skipped++;
                continue;
            }

            // Prepare scenario data
            $scenario_data = $this->prepare_simulator_data($data);

            // Check if updating existing or creating new
            $existing_id = null;
            if ($import_mode === 'update' && !empty($data['id'])) {
                $existing = $this->simulator_db->get_scenario(intval($data['id']));
                if ($existing) {
                    $existing_id = $existing->id;
                }
            }

            if ($existing_id) {
                // Update existing scenario
                $this->simulator_db->update_scenario($existing_id, $scenario_data);
                $updated++;
            } else {
                // Create new scenario
                $this->simulator_db->create_scenario($scenario_data);
                $created++;
            }
        }

        fclose($handle);

        return array(
            'success' => true,
            'created' => $created,
            'updated' => $updated,
            'skipped' => $skipped,
        );
    }

    /**
     * Prepare simulator data from CSV row
     */
    private function prepare_simulator_data($data) {
        // Parse input_configuration JSON
        $input_config = '[]';
        if (!empty($data['input_configuration'])) {
            $decoded = json_decode($data['input_configuration'], true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $input_config = json_encode($decoded, JSON_UNESCAPED_UNICODE);
            } else {
                $input_config = $data['input_configuration'];
            }
        }

        // Validate and normalize values
        $valid_icons = array('briefcase', 'banknote', 'user', 'presentation', 'target', 'mic');
        $valid_difficulties = array('beginner', 'intermediate', 'advanced');
        $valid_categories = array('CAREER', 'LEADERSHIP', 'SALES', 'COMMUNICATION');
        $valid_modes = array('INTERVIEW', 'SIMULATION');

        $icon = strtolower(trim($data['icon'] ?? 'briefcase'));
        if (!in_array($icon, $valid_icons)) {
            $icon = 'briefcase';
        }

        $difficulty = strtolower(trim($data['difficulty'] ?? 'intermediate'));
        if (!in_array($difficulty, $valid_difficulties)) {
            $difficulty = 'intermediate';
        }

        $category = strtoupper(trim($data['category'] ?? 'CAREER'));
        $category = Bewerbungstrainer_Simulator_Database::normalize_category($category);

        $mode = strtoupper(trim($data['mode'] ?? 'INTERVIEW'));
        if (!in_array($mode, $valid_modes)) {
            $mode = 'INTERVIEW';
        }

        return array(
            'title' => sanitize_text_field($data['title']),
            'description' => sanitize_textarea_field($data['description'] ?? ''),
            'icon' => $icon,
            'difficulty' => $difficulty,
            'category' => $category,
            'mode' => $mode,
            'system_prompt' => wp_kses_post($data['system_prompt'] ?? ''),
            'question_generation_prompt' => wp_kses_post($data['question_generation_prompt'] ?? ''),
            'feedback_prompt' => wp_kses_post($data['feedback_prompt'] ?? ''),
            'input_configuration' => $input_config,
            'question_count_min' => max(1, min(50, intval($data['question_count_min'] ?? 8))),
            'question_count_max' => max(1, min(50, intval($data['question_count_max'] ?? 12))),
            'time_limit_per_question' => max(30, min(600, intval($data['time_limit_per_question'] ?? 120))),
            'allow_retry' => intval($data['allow_retry'] ?? 1) ? 1 : 0,
            'is_active' => intval($data['is_active'] ?? 1) ? 1 : 0,
            'sort_order' => intval($data['sort_order'] ?? 0),
        );
    }

    // =========================================================================
    // ROLEPLAY SCENARIOS - EXPORT
    // =========================================================================

    /**
     * Get CSV headers for Roleplay scenarios
     */
    private function get_roleplay_csv_headers() {
        return array(
            'id',
            'title',
            'content',
            'status',
            'description',
            'difficulty',
            'agent_id',
            'initial_message',
            'feedback_prompt',
            'variables_schema',
            'interviewer_name',
            'interviewer_role',
            'interviewer_image',
            'interviewer_properties',
            'interviewer_objections',
            'interviewer_questions',
            'coaching_hints',
            'tags',
        );
    }

    /**
     * Export Roleplay scenarios to CSV
     */
    public function export_roleplay_scenarios_csv() {
        // Get all scenarios (including drafts)
        $scenarios = $this->roleplay_scenarios->get_all_scenarios(array(
            'post_status' => array('publish', 'draft', 'private'),
        ));

        // Set headers for file download
        $filename = 'roleplay-scenarios-' . date('Y-m-d-His') . '.csv';
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Pragma: no-cache');
        header('Expires: 0');

        // Open output stream
        $output = fopen('php://output', 'w');

        // Add BOM for Excel UTF-8 compatibility
        fprintf($output, chr(0xEF) . chr(0xBB) . chr(0xBF));

        // Write headers
        fputcsv($output, $this->get_roleplay_csv_headers(), self::CSV_DELIMITER, self::CSV_ENCLOSURE);

        // Write data rows
        foreach ($scenarios as $scenario) {
            // Get post object for status
            $post = get_post($scenario['id']);

            // Get tags
            $tags = wp_get_post_terms($scenario['id'], 'roleplay_scenario_tag', array('fields' => 'names'));
            $tags_string = is_array($tags) ? implode(', ', $tags) : '';

            $row = array(
                $scenario['id'],
                $scenario['title'],
                $post ? $post->post_content : '',
                $post ? $post->post_status : 'publish',
                $scenario['description'] ?? '',
                $scenario['difficulty'] ?? 'medium',
                $scenario['agent_id'] ?? '',
                $scenario['initial_message'] ?? '',
                get_post_meta($scenario['id'], '_roleplay_feedback_prompt', true) ?? '',
                is_array($scenario['variables_schema'])
                    ? json_encode($scenario['variables_schema'], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)
                    : '[]',
                $scenario['interviewer_profile']['name'] ?? '',
                $scenario['interviewer_profile']['role'] ?? '',
                $scenario['interviewer_profile']['image_url'] ?? '',
                $scenario['interviewer_profile']['properties'] ?? '',
                $scenario['interviewer_profile']['typical_objections'] ?? '',
                $scenario['interviewer_profile']['important_questions'] ?? '',
                $scenario['coaching_hints'] ?? '',
                $tags_string,
            );

            fputcsv($output, $row, self::CSV_DELIMITER, self::CSV_ENCLOSURE);
        }

        fclose($output);
    }

    // =========================================================================
    // ROLEPLAY SCENARIOS - IMPORT
    // =========================================================================

    /**
     * Handle Roleplay CSV import
     */
    private function handle_roleplay_import() {
        $redirect_page = 'edit.php?post_type=roleplay_scenario&page=roleplay-import-export';

        if (!isset($_FILES['csv_file']) || $_FILES['csv_file']['error'] !== UPLOAD_ERR_OK) {
            $this->redirect_roleplay_with_message($redirect_page, 'error', 'Keine Datei hochgeladen oder Fehler beim Upload.');
            return;
        }

        $file = $_FILES['csv_file'];

        // Validate file type
        $file_ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if ($file_ext !== 'csv') {
            $this->redirect_roleplay_with_message($redirect_page, 'error', 'Nur CSV-Dateien sind erlaubt.');
            return;
        }

        // Check import mode
        $import_mode = sanitize_text_field($_POST['import_mode'] ?? 'add');

        // Read and parse CSV
        $result = $this->parse_roleplay_csv($file['tmp_name'], $import_mode);

        if ($result['success']) {
            $this->redirect_roleplay_with_message(
                $redirect_page,
                'success',
                sprintf(
                    'Import erfolgreich: %d Szenarien erstellt, %d aktualisiert, %d übersprungen.',
                    $result['created'],
                    $result['updated'],
                    $result['skipped']
                )
            );
        } else {
            $this->redirect_roleplay_with_message($redirect_page, 'error', $result['message']);
        }
    }

    /**
     * Parse Roleplay CSV file
     */
    private function parse_roleplay_csv($filepath, $import_mode) {
        $handle = fopen($filepath, 'r');
        if ($handle === false) {
            return array('success' => false, 'message' => 'Datei konnte nicht geöffnet werden.');
        }

        // Skip BOM if present
        $bom = fread($handle, 3);
        if ($bom !== chr(0xEF) . chr(0xBB) . chr(0xBF)) {
            rewind($handle);
        }

        // Read header row
        $headers = fgetcsv($handle, 0, self::CSV_DELIMITER, self::CSV_ENCLOSURE);
        if ($headers === false) {
            fclose($handle);
            return array('success' => false, 'message' => 'CSV-Header konnte nicht gelesen werden.');
        }

        // Clean headers
        $headers = array_map(function($h) {
            return trim(preg_replace('/[\x00-\x1F\x80-\xFF]/', '', $h));
        }, $headers);

        // Validate required headers
        $required_headers = array('title', 'agent_id');
        foreach ($required_headers as $required) {
            if (!in_array($required, $headers)) {
                fclose($handle);
                return array('success' => false, 'message' => "Pflichtfeld '{$required}' fehlt in der CSV-Datei.");
            }
        }

        $created = 0;
        $updated = 0;
        $skipped = 0;
        $row_number = 1;

        while (($row = fgetcsv($handle, 0, self::CSV_DELIMITER, self::CSV_ENCLOSURE)) !== false) {
            $row_number++;

            // Skip empty rows
            if (empty(array_filter($row))) {
                $skipped++;
                continue;
            }

            // Create associative array from row
            $data = array();
            foreach ($headers as $index => $header) {
                $data[$header] = isset($row[$index]) ? $row[$index] : '';
            }

            // Validate required fields
            if (empty($data['title']) || empty($data['agent_id'])) {
                $skipped++;
                continue;
            }

            // Check if updating existing or creating new
            $existing_id = null;
            if ($import_mode === 'update' && !empty($data['id'])) {
                $post = get_post(intval($data['id']));
                if ($post && $post->post_type === 'roleplay_scenario') {
                    $existing_id = $post->ID;
                }
            }

            if ($existing_id) {
                // Update existing scenario
                $this->update_roleplay_scenario($existing_id, $data);
                $updated++;
            } else {
                // Create new scenario
                $this->create_roleplay_scenario($data);
                $created++;
            }
        }

        fclose($handle);

        return array(
            'success' => true,
            'created' => $created,
            'updated' => $updated,
            'skipped' => $skipped,
        );
    }

    /**
     * Create a new Roleplay scenario from CSV data
     */
    private function create_roleplay_scenario($data) {
        // Determine post status
        $valid_statuses = array('publish', 'draft', 'private', 'pending');
        $status = strtolower(trim($data['status'] ?? 'publish'));
        if (!in_array($status, $valid_statuses)) {
            $status = 'publish';
        }

        // Create the post
        $post_data = array(
            'post_title' => sanitize_text_field($data['title']),
            'post_content' => wp_kses_post($data['content'] ?? ''),
            'post_status' => $status,
            'post_type' => 'roleplay_scenario',
        );

        $post_id = wp_insert_post($post_data);

        if (is_wp_error($post_id)) {
            return false;
        }

        // Save meta fields
        $this->save_roleplay_meta($post_id, $data);

        // Save tags
        if (!empty($data['tags'])) {
            $tags = array_map('trim', explode(',', $data['tags']));
            wp_set_post_terms($post_id, $tags, 'roleplay_scenario_tag');
        }

        return $post_id;
    }

    /**
     * Update an existing Roleplay scenario from CSV data
     */
    private function update_roleplay_scenario($post_id, $data) {
        // Determine post status
        $valid_statuses = array('publish', 'draft', 'private', 'pending');
        $status = strtolower(trim($data['status'] ?? 'publish'));
        if (!in_array($status, $valid_statuses)) {
            $status = 'publish';
        }

        // Update the post
        $post_data = array(
            'ID' => $post_id,
            'post_title' => sanitize_text_field($data['title']),
            'post_content' => wp_kses_post($data['content'] ?? ''),
            'post_status' => $status,
        );

        wp_update_post($post_data);

        // Update meta fields
        $this->save_roleplay_meta($post_id, $data);

        // Update tags
        if (!empty($data['tags'])) {
            $tags = array_map('trim', explode(',', $data['tags']));
            wp_set_post_terms($post_id, $tags, 'roleplay_scenario_tag');
        }

        return $post_id;
    }

    /**
     * Save Roleplay scenario meta fields
     */
    private function save_roleplay_meta($post_id, $data) {
        // Basic meta fields
        update_post_meta($post_id, '_roleplay_agent_id', sanitize_text_field($data['agent_id'] ?? ''));
        update_post_meta($post_id, '_roleplay_description', sanitize_textarea_field($data['description'] ?? ''));
        update_post_meta($post_id, '_roleplay_initial_message', sanitize_textarea_field($data['initial_message'] ?? ''));
        update_post_meta($post_id, '_roleplay_feedback_prompt', sanitize_textarea_field($data['feedback_prompt'] ?? ''));

        // Difficulty
        $valid_difficulties = array('easy', 'medium', 'hard');
        $difficulty = strtolower(trim($data['difficulty'] ?? 'medium'));
        if (!in_array($difficulty, $valid_difficulties)) {
            $difficulty = 'medium';
        }
        update_post_meta($post_id, '_roleplay_difficulty', $difficulty);

        // Variables schema (JSON)
        if (!empty($data['variables_schema'])) {
            $decoded = json_decode($data['variables_schema'], true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                update_post_meta($post_id, '_roleplay_variables_schema', wp_json_encode($decoded));
            } else {
                update_post_meta($post_id, '_roleplay_variables_schema', '[]');
            }
        } else {
            update_post_meta($post_id, '_roleplay_variables_schema', '[]');
        }

        // Interviewer profile
        update_post_meta($post_id, '_roleplay_interviewer_name', sanitize_text_field($data['interviewer_name'] ?? ''));
        update_post_meta($post_id, '_roleplay_interviewer_role', sanitize_text_field($data['interviewer_role'] ?? ''));
        update_post_meta($post_id, '_roleplay_interviewer_image', esc_url_raw($data['interviewer_image'] ?? ''));
        update_post_meta($post_id, '_roleplay_interviewer_properties', sanitize_textarea_field($data['interviewer_properties'] ?? ''));
        update_post_meta($post_id, '_roleplay_interviewer_objections', sanitize_textarea_field($data['interviewer_objections'] ?? ''));
        update_post_meta($post_id, '_roleplay_interviewer_questions', sanitize_textarea_field($data['interviewer_questions'] ?? ''));

        // Coaching hints
        update_post_meta($post_id, '_roleplay_coaching_hints', sanitize_textarea_field($data['coaching_hints'] ?? ''));
    }

    // =========================================================================
    // ADMIN UI RENDERING
    // =========================================================================

    /**
     * Render the export/import UI for Simulator scenarios
     */
    public function render_simulator_import_export_ui() {
        ?>
        <div class="postbox" style="margin-top: 20px;">
            <h2 class="hndle" style="padding: 10px 15px; margin: 0;">
                <span>CSV Import / Export</span>
            </h2>
            <div class="inside" style="padding: 15px;">
                <div style="display: flex; gap: 30px; flex-wrap: wrap;">
                    <!-- Export Section -->
                    <div style="flex: 1; min-width: 250px;">
                        <h3 style="margin-top: 0;">Export</h3>
                        <p class="description">Exportiere alle Simulator-Szenarien als CSV-Datei.</p>
                        <a href="<?php echo wp_nonce_url(admin_url('admin.php?action=export_simulator_csv'), 'export_simulator_csv'); ?>"
                           class="button button-primary">
                            <span class="dashicons dashicons-download" style="vertical-align: middle; margin-right: 5px;"></span>
                            CSV Exportieren
                        </a>
                    </div>

                    <!-- Import Section -->
                    <div style="flex: 1; min-width: 300px;">
                        <h3 style="margin-top: 0;">Import</h3>
                        <form method="post" enctype="multipart/form-data" action="<?php echo admin_url('admin.php?page=simulator-scenarios'); ?>">
                            <?php wp_nonce_field('import_simulator_csv', '_wpnonce'); ?>
                            <input type="hidden" name="action" value="import_simulator_csv">

                            <p>
                                <label for="csv_file">CSV-Datei auswählen:</label><br>
                                <input type="file" name="csv_file" id="csv_file" accept=".csv" required style="margin-top: 5px;">
                            </p>

                            <p>
                                <label for="import_mode">Import-Modus:</label><br>
                                <select name="import_mode" id="import_mode" style="margin-top: 5px;">
                                    <option value="add">Nur neue Szenarien erstellen</option>
                                    <option value="update">Existierende aktualisieren (per ID)</option>
                                </select>
                            </p>

                            <p class="description" style="font-size: 11px; color: #666;">
                                Bei "Existierende aktualisieren" werden Szenarien mit übereinstimmender ID aktualisiert.
                            </p>

                            <button type="submit" class="button">
                                <span class="dashicons dashicons-upload" style="vertical-align: middle; margin-right: 5px;"></span>
                                CSV Importieren
                            </button>
                        </form>
                    </div>
                </div>

                <!-- CSV Format Info -->
                <div style="margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 4px;">
                    <h4 style="margin-top: 0;">CSV Format</h4>
                    <p class="description" style="margin-bottom: 10px;">
                        Die CSV-Datei sollte folgende Spalten enthalten (Semikolon als Trennzeichen):
                    </p>
                    <code style="display: block; padding: 10px; background: #fff; border: 1px solid #ddd; border-radius: 3px; font-size: 11px; white-space: pre-wrap; word-break: break-all;">
id;title;description;icon;difficulty;category;mode;system_prompt;question_generation_prompt;feedback_prompt;input_configuration;question_count_min;question_count_max;time_limit_per_question;allow_retry;is_active;sort_order</code>
                    <p class="description" style="margin-top: 10px; font-size: 11px;">
                        <strong>Pflichtfelder:</strong> title, system_prompt<br>
                        <strong>icon:</strong> briefcase, banknote, user, presentation, target, mic<br>
                        <strong>difficulty:</strong> beginner, intermediate, advanced<br>
                        <strong>category:</strong> CAREER, LEADERSHIP, SALES, COMMUNICATION<br>
                        <strong>mode:</strong> INTERVIEW, SIMULATION<br>
                        <strong>input_configuration:</strong> JSON-Array mit Variablen-Definition
                    </p>
                </div>
            </div>
        </div>
        <?php
    }

    /**
     * Render the export/import UI for Roleplay scenarios
     */
    public function render_roleplay_import_export_ui() {
        ?>
        <div class="wrap">
            <h1>Rollenspiel-Szenarien Import/Export</h1>

            <div style="display: flex; gap: 30px; flex-wrap: wrap; margin-top: 20px;">
                <!-- Export Section -->
                <div class="postbox" style="flex: 1; min-width: 300px; margin: 0;">
                    <h2 class="hndle" style="padding: 10px 15px; margin: 0;">
                        <span>Export</span>
                    </h2>
                    <div class="inside" style="padding: 15px;">
                        <p class="description">Exportiere alle Rollenspiel-Szenarien als CSV-Datei.</p>
                        <a href="<?php echo wp_nonce_url(admin_url('admin.php?action=export_roleplay_csv'), 'export_roleplay_csv'); ?>"
                           class="button button-primary">
                            <span class="dashicons dashicons-download" style="vertical-align: middle; margin-right: 5px;"></span>
                            CSV Exportieren
                        </a>
                    </div>
                </div>

                <!-- Import Section -->
                <div class="postbox" style="flex: 1; min-width: 350px; margin: 0;">
                    <h2 class="hndle" style="padding: 10px 15px; margin: 0;">
                        <span>Import</span>
                    </h2>
                    <div class="inside" style="padding: 15px;">
                        <form method="post" enctype="multipart/form-data" action="<?php echo admin_url('edit.php?post_type=roleplay_scenario&page=roleplay-import-export'); ?>">
                            <?php wp_nonce_field('import_roleplay_csv', '_wpnonce'); ?>
                            <input type="hidden" name="action" value="import_roleplay_csv">

                            <p>
                                <label for="csv_file_roleplay">CSV-Datei auswählen:</label><br>
                                <input type="file" name="csv_file" id="csv_file_roleplay" accept=".csv" required style="margin-top: 5px;">
                            </p>

                            <p>
                                <label for="import_mode_roleplay">Import-Modus:</label><br>
                                <select name="import_mode" id="import_mode_roleplay" style="margin-top: 5px;">
                                    <option value="add">Nur neue Szenarien erstellen</option>
                                    <option value="update">Existierende aktualisieren (per ID)</option>
                                </select>
                            </p>

                            <button type="submit" class="button">
                                <span class="dashicons dashicons-upload" style="vertical-align: middle; margin-right: 5px;"></span>
                                CSV Importieren
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            <!-- CSV Format Info -->
            <div class="postbox" style="margin-top: 20px;">
                <h2 class="hndle" style="padding: 10px 15px; margin: 0;">
                    <span>CSV Format</span>
                </h2>
                <div class="inside" style="padding: 15px;">
                    <p class="description" style="margin-bottom: 10px;">
                        Die CSV-Datei sollte folgende Spalten enthalten (Semikolon als Trennzeichen):
                    </p>
                    <code style="display: block; padding: 10px; background: #f5f5f5; border: 1px solid #ddd; border-radius: 3px; font-size: 11px; white-space: pre-wrap; word-break: break-all;">
id;title;content;status;description;difficulty;agent_id;initial_message;feedback_prompt;variables_schema;interviewer_name;interviewer_role;interviewer_image;interviewer_properties;interviewer_objections;interviewer_questions;coaching_hints;tags</code>
                    <p class="description" style="margin-top: 10px; font-size: 11px;">
                        <strong>Pflichtfelder:</strong> title, agent_id<br>
                        <strong>status:</strong> publish, draft, private<br>
                        <strong>difficulty:</strong> easy, medium, hard<br>
                        <strong>variables_schema:</strong> JSON-Array mit Variablen-Definition<br>
                        <strong>tags:</strong> Komma-getrennte Liste (z.B. "Bewerbung, Interview, Karriere")
                    </p>
                </div>
            </div>
        </div>
        <?php
    }

    // =========================================================================
    // HELPER METHODS
    // =========================================================================

    /**
     * Redirect with admin notice message (for Simulator scenarios)
     */
    private function redirect_with_message($page, $type, $message) {
        // Store message in transient for display
        set_transient('bewerbungstrainer_csv_notice', array(
            'type' => $type,
            'message' => $message,
        ), 60);

        // Redirect
        wp_redirect(admin_url('admin.php?page=' . $page));
        exit;
    }

    /**
     * Redirect with admin notice message (for Roleplay scenarios)
     */
    private function redirect_roleplay_with_message($page, $type, $message) {
        // Store message in transient for display
        set_transient('bewerbungstrainer_csv_notice', array(
            'type' => $type,
            'message' => $message,
        ), 60);

        // Redirect (page already includes full path)
        wp_redirect(admin_url($page));
        exit;
    }

    /**
     * Display admin notices from import/export
     */
    public static function display_admin_notices() {
        $notice = get_transient('bewerbungstrainer_csv_notice');
        if ($notice) {
            delete_transient('bewerbungstrainer_csv_notice');
            $class = ($notice['type'] === 'success') ? 'notice-success' : 'notice-error';
            echo '<div class="notice ' . esc_attr($class) . ' is-dismissible"><p>' . esc_html($notice['message']) . '</p></div>';
        }
    }
}
