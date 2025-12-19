<?php
/**
 * Video Training Database Class
 *
 * Handles all database operations for the Video Training feature
 * Following the same pattern as class-simulator-database.php
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

class Bewerbungstrainer_Video_Training_Database {

    /**
     * Instance of this class
     */
    private static $instance = null;

    /**
     * Table names
     */
    private $table_scenarios;
    private $table_sessions;

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
        global $wpdb;
        $this->table_scenarios = $wpdb->prefix . 'bewerbungstrainer_video_scenarios';
        $this->table_sessions = $wpdb->prefix . 'bewerbungstrainer_video_sessions';

        // Check if tables exist, create if not
        $this->maybe_create_tables();
    }

    /**
     * Check if tables exist and create them if not
     */
    private function maybe_create_tables() {
        global $wpdb;

        // Check if scenarios table exists
        $table_exists = $wpdb->get_var(
            $wpdb->prepare(
                "SHOW TABLES LIKE %s",
                $this->table_scenarios
            )
        );

        if (!$table_exists) {
            error_log('[VIDEO TRAINING] Tables not found, creating...');
            self::create_tables();
        }

        // Run migrations for existing installations
        $this->run_migrations();
    }

    /**
     * Run database migrations for existing installations
     */
    private function run_migrations() {
        $current_version = get_option('bewerbungstrainer_video_training_migration_version', '0');

        // Migration 1: Enable navigation for Elevator Pitch scenarios
        if (version_compare($current_version, '1.0.1', '<')) {
            global $wpdb;
            $wpdb->update(
                $this->table_scenarios,
                array('enable_navigation' => 1),
                array('scenario_type' => 'pitch', 'enable_navigation' => 0)
            );
            error_log('[VIDEO TRAINING] Migration 1.0.1: Enabled navigation for pitch scenarios');
            update_option('bewerbungstrainer_video_training_migration_version', '1.0.1');
        }

        // Migration 2: Add demo_code column for demo user session isolation
        if (version_compare($current_version, '1.0.2', '<')) {
            $this->add_demo_code_column();
            update_option('bewerbungstrainer_video_training_migration_version', '1.0.2');
        }

        // Migration 3: Re-run demo_code migration with correct column name (fix for failed 1.0.2)
        if (version_compare($current_version, '1.0.3', '<')) {
            $this->add_demo_code_column();
            update_option('bewerbungstrainer_video_training_migration_version', '1.0.3');
        }

        // Migration 4: Add target_audience column
        if (version_compare($current_version, '1.0.4', '<')) {
            $this->add_target_audience_column();
            update_option('bewerbungstrainer_video_training_migration_version', '1.0.4');
        }
    }

    /**
     * Add demo_code column to sessions table if it doesn't exist
     */
    private function add_demo_code_column() {
        global $wpdb;

        $column_exists = $wpdb->get_results(
            $wpdb->prepare(
                "SHOW COLUMNS FROM `{$this->table_sessions}` LIKE %s",
                'demo_code'
            )
        );

        if (empty($column_exists)) {
            error_log('[VIDEO TRAINING] Adding demo_code column to sessions table...');
            $result = $wpdb->query("ALTER TABLE `{$this->table_sessions}` ADD COLUMN `demo_code` varchar(10) DEFAULT NULL AFTER `summary_feedback`");
            if ($result === false) {
                error_log('[VIDEO TRAINING] Error adding demo_code column: ' . $wpdb->last_error);
            } else {
                $wpdb->query("ALTER TABLE `{$this->table_sessions}` ADD INDEX `demo_code` (`demo_code`)");
                error_log('[VIDEO TRAINING] demo_code column added successfully');
            }
        }
    }

    /**
     * Add target_audience column to scenarios table if it doesn't exist
     */
    private function add_target_audience_column() {
        global $wpdb;

        $column_exists = $wpdb->get_results(
            $wpdb->prepare(
                "SHOW COLUMNS FROM `{$this->table_scenarios}` LIKE %s",
                'target_audience'
            )
        );

        if (empty($column_exists)) {
            error_log('[VIDEO TRAINING] Adding target_audience column to scenarios table...');
            $result = $wpdb->query("ALTER TABLE `{$this->table_scenarios}` ADD COLUMN `target_audience` varchar(255) DEFAULT NULL AFTER `difficulty`");
            if ($result === false) {
                error_log('[VIDEO TRAINING] Error adding target_audience column: ' . $wpdb->last_error);
            } else {
                error_log('[VIDEO TRAINING] target_audience column added successfully');
            }
        }
    }

    /**
     * Create video training database tables
     */
    public static function create_tables() {
        global $wpdb;

        $charset_collate = $wpdb->get_charset_collate();

        // Scenarios table - stores configurable video scenario templates
        $table_scenarios = $wpdb->prefix . 'bewerbungstrainer_video_scenarios';
        $sql_scenarios = "CREATE TABLE IF NOT EXISTS `$table_scenarios` (
            `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            `title` varchar(255) NOT NULL,
            `description` text DEFAULT NULL,
            `icon` varchar(50) DEFAULT 'video',
            `difficulty` varchar(20) DEFAULT 'intermediate',
            `target_audience` varchar(255) DEFAULT NULL,
            `category` varchar(100) DEFAULT NULL,
            `scenario_type` enum('self_presentation', 'interview', 'pitch', 'negotiation', 'custom') NOT NULL DEFAULT 'interview',
            `system_prompt` longtext NOT NULL,
            `question_generation_prompt` longtext DEFAULT NULL,
            `feedback_prompt` longtext DEFAULT NULL,
            `input_configuration` longtext NOT NULL,
            `question_count` tinyint UNSIGNED DEFAULT 5,
            `time_limit_per_question` int DEFAULT 120,
            `total_time_limit` int DEFAULT 900,
            `enable_tips` tinyint(1) DEFAULT 1,
            `enable_navigation` tinyint(1) DEFAULT 1,
            `is_active` tinyint(1) DEFAULT 1,
            `sort_order` int DEFAULT 0,
            `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
            `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            KEY `is_active` (`is_active`),
            KEY `category` (`category`),
            KEY `scenario_type` (`scenario_type`),
            KEY `sort_order` (`sort_order`)
        ) $charset_collate;";

        // Sessions table - stores user video training sessions
        $table_sessions = $wpdb->prefix . 'bewerbungstrainer_video_sessions';
        $sql_sessions = "CREATE TABLE IF NOT EXISTS `$table_sessions` (
            `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            `user_id` bigint(20) UNSIGNED NOT NULL DEFAULT 0,
            `user_name` varchar(255) DEFAULT NULL,
            `session_id` varchar(36) NOT NULL,
            `scenario_id` bigint(20) UNSIGNED NOT NULL,
            `variables_json` longtext DEFAULT NULL,
            `questions_json` longtext DEFAULT NULL,
            `timeline_json` longtext DEFAULT NULL,
            `current_question_index` int DEFAULT 0,
            `status` enum('setup', 'recording', 'processing', 'completed', 'failed') DEFAULT 'setup',
            `video_filename` varchar(255) DEFAULT NULL,
            `video_url` text DEFAULT NULL,
            `video_duration_seconds` int DEFAULT NULL,
            `thumbnail_url` text DEFAULT NULL,
            `transcript` longtext DEFAULT NULL,
            `analysis_json` longtext DEFAULT NULL,
            `overall_score` decimal(5,2) DEFAULT NULL,
            `category_scores_json` longtext DEFAULT NULL,
            `summary_feedback` text DEFAULT NULL,
            `demo_code` varchar(10) DEFAULT NULL,
            `started_at` datetime DEFAULT NULL,
            `completed_at` datetime DEFAULT NULL,
            `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
            `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            UNIQUE KEY `session_id` (`session_id`),
            KEY `user_id` (`user_id`),
            KEY `scenario_id` (`scenario_id`),
            KEY `status` (`status`),
            KEY `demo_code` (`demo_code`),
            KEY `created_at` (`created_at`)
        ) $charset_collate;";

        // Execute queries directly
        $wpdb->query($sql_scenarios);
        $wpdb->query($sql_sessions);

        // Log any errors
        if ($wpdb->last_error) {
            error_log('[VIDEO TRAINING] Database error: ' . $wpdb->last_error);
        } else {
            error_log('[VIDEO TRAINING] Tables created successfully');
        }

        // Insert default scenarios if table is empty
        self::insert_default_scenarios();

        // Update version
        update_option('bewerbungstrainer_video_training_db_version', '1.0.0');
    }

    /**
     * Insert default scenario templates
     */
    private static function insert_default_scenarios() {
        global $wpdb;
        $table = $wpdb->prefix . 'bewerbungstrainer_video_scenarios';

        // Check if scenarios already exist
        $count = $wpdb->get_var("SELECT COUNT(*) FROM $table");
        if ($count > 0) {
            return;
        }

        // Default Scenario 1: Selbstpräsentation
        $wpdb->insert($table, array(
            'title' => 'Selbstpräsentation',
            'description' => 'Trainiere deine Selbstpräsentation und erhalte detailliertes Feedback zu deiner Wirkung, Körpersprache und Kommunikation.',
            'icon' => 'user',
            'difficulty' => 'beginner',
            'category' => 'presentation',
            'scenario_type' => 'self_presentation',
            'system_prompt' => 'Analysiere das Video einer Selbstpräsentation. Fokussiere auf:
- Erste Eindrücke und Gesamtwirkung
- Körpersprache und Mimik
- Sprechweise und Klarheit
- Struktur der Präsentation
- Selbstbewusstsein und Authentizität',
            'question_generation_prompt' => 'Generiere Aufgaben für eine Selbstpräsentation.

Aufgabentypen:
1. "Stell dich in 60 Sekunden vor" (Elevator Pitch)
2. "Beschreibe deinen beruflichen Werdegang"
3. "Was sind deine drei größten Stärken?"
4. "Warum bist du der/die Richtige für diese Position?"
5. "Was motiviert dich in deiner Arbeit?"',
            'feedback_prompt' => 'Analysiere die Video-Selbstpräsentation.

Bewerte:
- Auftreten und erste Eindrücke
- Körpersprache (Haltung, Gestik, Augenkontakt)
- Kommunikation (Klarheit, Struktur, Überzeugungskraft)
- Professionalität
- Authentizität und Selbstbewusstsein

Gib konstruktives, motivierendes Feedback in der "Du"-Form.',
            'input_configuration' => json_encode(array(
                array(
                    'key' => 'position',
                    'label' => 'Zielposition',
                    'type' => 'text',
                    'required' => true,
                    'placeholder' => 'z.B. Marketing Manager, Software Engineer'
                ),
                array(
                    'key' => 'experience_level',
                    'label' => 'Erfahrungslevel',
                    'type' => 'select',
                    'required' => true,
                    'default' => 'professional',
                    'options' => array(
                        array('value' => 'student', 'label' => 'Student / Praktikant'),
                        array('value' => 'entry', 'label' => 'Berufseinsteiger (0-2 Jahre)'),
                        array('value' => 'professional', 'label' => 'Professional (3-5 Jahre)'),
                        array('value' => 'senior', 'label' => 'Senior / Führungskraft (5+ Jahre)')
                    )
                ),
                array(
                    'key' => 'focus_area',
                    'label' => 'Fokusbereich',
                    'type' => 'select',
                    'required' => false,
                    'default' => 'overall',
                    'options' => array(
                        array('value' => 'overall', 'label' => 'Gesamteindruck'),
                        array('value' => 'body_language', 'label' => 'Körpersprache'),
                        array('value' => 'communication', 'label' => 'Kommunikation'),
                        array('value' => 'confidence', 'label' => 'Selbstbewusstsein')
                    )
                )
            )),
            'question_count' => 5,
            'time_limit_per_question' => 90,
            'total_time_limit' => 600,
            'enable_tips' => 1,
            'enable_navigation' => 1,
            'is_active' => 1,
            'sort_order' => 1
        ));

        // Default Scenario 2: Bewerbungsgespräch
        $wpdb->insert($table, array(
            'title' => 'Bewerbungsgespräch',
            'description' => 'Simuliere ein Video-Bewerbungsgespräch und erhalte KI-Feedback zu deinen Antworten und deinem Auftreten.',
            'icon' => 'briefcase',
            'difficulty' => 'intermediate',
            'category' => 'interview',
            'scenario_type' => 'interview',
            'system_prompt' => 'Analysiere ein Video-Bewerbungsgespräch für die Position ${position} ${company ? "bei " + company : ""}.
Der Bewerber hat ein ${experience_level}-Level.
Bewerte sowohl inhaltliche Antworten als auch die visuelle Präsentation.',
            'question_generation_prompt' => 'Generiere realistische Interviewfragen für ein Bewerbungsgespräch.

Richtlinien:
1. Beginne mit einer Einstiegsfrage ("Erzählen Sie mir von sich")
2. Mische Fragen zu: Motivation, Fachkompetenz, Soft Skills, Situative Fragen
3. Passe die Komplexität an das Erfahrungslevel an
4. Beziehe Position und Unternehmen ein
5. Ende mit einer Frage nach offenen Punkten

Jede Frage sollte eine geschätzte Antwortzeit von 60-120 Sekunden haben.',
            'feedback_prompt' => 'Bewerte das Video-Bewerbungsgespräch.

Analysiere:
1. INHALT der Antworten
   - Relevanz und Struktur
   - Konkrete Beispiele
   - STAR-Methode Anwendung

2. VISUELLE PRÄSENTATION
   - Körpersprache und Mimik
   - Augenkontakt zur Kamera
   - Professionelles Erscheinungsbild
   - Hintergrund und Beleuchtung

3. KOMMUNIKATION
   - Sprechweise und Tempo
   - Klarheit und Verständlichkeit
   - Füllwörter und Pausen

Verwende die "Du"-Form und sei konstruktiv.',
            'input_configuration' => json_encode(array(
                array(
                    'key' => 'position',
                    'label' => 'Zielposition',
                    'type' => 'text',
                    'required' => true,
                    'placeholder' => 'z.B. Product Manager, Software Engineer'
                ),
                array(
                    'key' => 'company',
                    'label' => 'Unternehmen (optional)',
                    'type' => 'text',
                    'required' => false,
                    'placeholder' => 'z.B. BMW, Siemens, Google'
                ),
                array(
                    'key' => 'experience_level',
                    'label' => 'Erfahrungslevel',
                    'type' => 'select',
                    'required' => true,
                    'default' => 'professional',
                    'options' => array(
                        array('value' => 'student', 'label' => 'Student / Praktikant'),
                        array('value' => 'entry', 'label' => 'Berufseinsteiger (0-2 Jahre)'),
                        array('value' => 'professional', 'label' => 'Professional (3-5 Jahre)'),
                        array('value' => 'senior', 'label' => 'Senior / Führungskraft (5+ Jahre)')
                    )
                ),
                array(
                    'key' => 'industry',
                    'label' => 'Branche',
                    'type' => 'select',
                    'required' => false,
                    'options' => array(
                        array('value' => 'tech', 'label' => 'IT / Technologie'),
                        array('value' => 'finance', 'label' => 'Finanzen / Banking'),
                        array('value' => 'consulting', 'label' => 'Beratung'),
                        array('value' => 'healthcare', 'label' => 'Gesundheitswesen'),
                        array('value' => 'manufacturing', 'label' => 'Industrie / Produktion'),
                        array('value' => 'retail', 'label' => 'Handel / E-Commerce'),
                        array('value' => 'other', 'label' => 'Sonstiges')
                    )
                )
            )),
            'question_count' => 5,
            'time_limit_per_question' => 120,
            'total_time_limit' => 900,
            'enable_tips' => 1,
            'enable_navigation' => 1,
            'is_active' => 1,
            'sort_order' => 2
        ));

        // Default Scenario 3: Elevator Pitch
        $wpdb->insert($table, array(
            'title' => 'Elevator Pitch',
            'description' => 'Perfektioniere deinen 60-Sekunden Elevator Pitch und lerne, dich prägnant und überzeugend zu präsentieren.',
            'icon' => 'presentation',
            'difficulty' => 'beginner',
            'category' => 'pitch',
            'scenario_type' => 'pitch',
            'system_prompt' => 'Analysiere einen Elevator Pitch. Der Sprecher hat ${time_limit} Sekunden Zeit, sich oder eine Idee zu präsentieren.
Bewerte Prägnanz, Überzeugungskraft und visuelle Präsentation.',
            'question_generation_prompt' => 'Generiere Elevator Pitch Aufgaben.

Varianten:
1. "Stell dich in 60 Sekunden vor"
2. "Präsentiere deine wichtigste Fähigkeit"
3. "Warum sollten wir dich einstellen?"
4. "Beschreibe deinen einzigartigen Wertbeitrag"',
            'feedback_prompt' => 'Analysiere den Elevator Pitch.

Kriterien:
- Einhaltung der Zeitvorgabe
- Klare Kernbotschaft
- Überzeugungskraft
- Körpersprache und Energie
- Memorability (bleibt im Gedächtnis?)

Gib konkretes, umsetzbares Feedback.',
            'input_configuration' => json_encode(array(
                array(
                    'key' => 'pitch_type',
                    'label' => 'Art des Pitches',
                    'type' => 'select',
                    'required' => true,
                    'default' => 'personal',
                    'options' => array(
                        array('value' => 'personal', 'label' => 'Persönliche Vorstellung'),
                        array('value' => 'product', 'label' => 'Produkt / Idee'),
                        array('value' => 'company', 'label' => 'Unternehmen vorstellen'),
                        array('value' => 'skill', 'label' => 'Spezifische Fähigkeit')
                    )
                ),
                array(
                    'key' => 'time_limit',
                    'label' => 'Zeitlimit (Sekunden)',
                    'type' => 'select',
                    'required' => true,
                    'default' => '60',
                    'options' => array(
                        array('value' => '30', 'label' => '30 Sekunden'),
                        array('value' => '60', 'label' => '60 Sekunden'),
                        array('value' => '90', 'label' => '90 Sekunden'),
                        array('value' => '120', 'label' => '2 Minuten')
                    )
                )
            )),
            'question_count' => 3,
            'time_limit_per_question' => 60,
            'total_time_limit' => 300,
            'enable_tips' => 1,
            'enable_navigation' => 1,
            'is_active' => 1,
            'sort_order' => 3
        ));

        // Migrate existing Elevator Pitch scenarios to enable navigation
        $wpdb->update(
            $table,
            array('enable_navigation' => 1),
            array('scenario_type' => 'pitch', 'enable_navigation' => 0)
        );
    }

    // =========================================================================
    // SCENARIO METHODS
    // =========================================================================

    /**
     * Get all active scenarios
     *
     * @param array $args Query arguments
     * @return array Array of scenario objects
     */
    public function get_scenarios($args = array()) {
        global $wpdb;

        $defaults = array(
            'category' => null,
            'difficulty' => null,
            'scenario_type' => null,
            'is_active' => 1,
            'orderby' => 'sort_order',
            'order' => 'DESC',  // Higher sort_order = shown first (more intuitive)
        );

        $args = wp_parse_args($args, $defaults);

        $where = array();
        $where_values = array();

        if ($args['is_active'] !== null) {
            $where[] = 'is_active = %d';
            $where_values[] = $args['is_active'];
        }

        if ($args['category']) {
            $where[] = 'category = %s';
            $where_values[] = $args['category'];
        }

        if ($args['difficulty']) {
            $where[] = 'difficulty = %s';
            $where_values[] = $args['difficulty'];
        }

        if ($args['scenario_type']) {
            $where[] = 'scenario_type = %s';
            $where_values[] = $args['scenario_type'];
        }

        $where_clause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

        // Validate orderby
        $allowed_orderby = array('id', 'title', 'sort_order', 'created_at', 'difficulty', 'scenario_type');
        if (!in_array($args['orderby'], $allowed_orderby)) {
            $args['orderby'] = 'sort_order';
        }

        $args['order'] = strtoupper($args['order']) === 'DESC' ? 'DESC' : 'ASC';

        // Add secondary sort by id for consistent ordering when primary sort values are equal
        $secondary_sort = ($args['orderby'] !== 'id') ? ', id ASC' : '';
        $query = "SELECT * FROM {$this->table_scenarios} {$where_clause} ORDER BY {$args['orderby']} {$args['order']}{$secondary_sort}";

        if (!empty($where_values)) {
            $scenarios = $wpdb->get_results($wpdb->prepare($query, ...$where_values));
        } else {
            $scenarios = $wpdb->get_results($query);
        }

        // Parse JSON fields
        foreach ($scenarios as &$scenario) {
            $scenario->input_configuration = json_decode($scenario->input_configuration, true);
        }

        return $scenarios;
    }

    /**
     * Get a scenario by ID
     *
     * @param int $scenario_id Scenario ID
     * @return object|null Scenario object or null
     */
    public function get_scenario($scenario_id) {
        global $wpdb;

        $scenario = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$this->table_scenarios} WHERE id = %d",
                $scenario_id
            )
        );

        if ($scenario) {
            $scenario->input_configuration = json_decode($scenario->input_configuration, true);
        }

        return $scenario;
    }

    /**
     * Create a new scenario
     *
     * @param array $data Scenario data
     * @return int|false Scenario ID or false on failure
     */
    public function create_scenario($data) {
        global $wpdb;

        $defaults = array(
            'title' => '',
            'description' => null,
            'icon' => 'video',
            'difficulty' => 'intermediate',
            'target_audience' => null,
            'category' => null,
            'scenario_type' => 'interview',
            'system_prompt' => '',
            'question_generation_prompt' => null,
            'feedback_prompt' => null,
            'input_configuration' => '[]',
            'question_count' => 5,
            'time_limit_per_question' => 120,
            'total_time_limit' => 900,
            'enable_tips' => 1,
            'enable_navigation' => 1,
            'is_active' => 1,
            'sort_order' => 0,
        );

        $data = wp_parse_args($data, $defaults);

        // Ensure input_configuration is JSON string
        if (is_array($data['input_configuration'])) {
            $data['input_configuration'] = json_encode($data['input_configuration']);
        }

        $result = $wpdb->insert(
            $this->table_scenarios,
            array(
                'title' => sanitize_text_field($data['title']),
                'description' => sanitize_textarea_field($data['description']),
                'icon' => sanitize_text_field($data['icon']),
                'difficulty' => $data['difficulty'],
                'target_audience' => sanitize_text_field($data['target_audience']),
                'category' => sanitize_text_field($data['category']),
                'scenario_type' => $data['scenario_type'],
                'system_prompt' => $data['system_prompt'],
                'question_generation_prompt' => $data['question_generation_prompt'],
                'feedback_prompt' => $data['feedback_prompt'],
                'input_configuration' => $data['input_configuration'],
                'question_count' => intval($data['question_count']),
                'time_limit_per_question' => intval($data['time_limit_per_question']),
                'total_time_limit' => intval($data['total_time_limit']),
                'enable_tips' => intval($data['enable_tips']),
                'enable_navigation' => intval($data['enable_navigation']),
                'is_active' => intval($data['is_active']),
                'sort_order' => intval($data['sort_order']),
            ),
            array('%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%d', '%d', '%d', '%d', '%d', '%d', '%d')
        );

        if ($result === false) {
            error_log('Video Training: Failed to create scenario - ' . $wpdb->last_error);
            return false;
        }

        return $wpdb->insert_id;
    }

    /**
     * Update a scenario
     *
     * @param int $scenario_id Scenario ID
     * @param array $data Data to update
     * @return bool True on success, false on failure
     */
    public function update_scenario($scenario_id, $data) {
        global $wpdb;

        // Ensure input_configuration is JSON string
        if (isset($data['input_configuration']) && is_array($data['input_configuration'])) {
            $data['input_configuration'] = json_encode($data['input_configuration']);
        }

        $result = $wpdb->update(
            $this->table_scenarios,
            $data,
            array('id' => $scenario_id)
        );

        return $result !== false;
    }

    /**
     * Delete a scenario
     *
     * @param int $scenario_id Scenario ID
     * @return bool True on success, false on failure
     */
    public function delete_scenario($scenario_id) {
        global $wpdb;

        return $wpdb->delete(
            $this->table_scenarios,
            array('id' => $scenario_id),
            array('%d')
        ) !== false;
    }

    // =========================================================================
    // SESSION METHODS
    // =========================================================================

    /**
     * Create a new video training session
     *
     * @param array $data Session data
     * @return int|false Session ID or false on failure
     */
    public function create_session($data) {
        global $wpdb;

        $defaults = array(
            'user_id' => get_current_user_id(),
            'user_name' => null,
            'session_id' => wp_generate_uuid4(),
            'scenario_id' => 0,
            'variables_json' => null,
            'questions_json' => null,
            'timeline_json' => null,
            'current_question_index' => 0,
            'status' => 'setup',
            'video_filename' => null,
            'video_url' => null,
            'video_duration_seconds' => null,
            'thumbnail_url' => null,
            'transcript' => null,
            'analysis_json' => null,
            'overall_score' => null,
            'category_scores_json' => null,
            'summary_feedback' => null,
            'demo_code' => null,
            'started_at' => null,
            'completed_at' => null,
        );

        $data = wp_parse_args($data, $defaults);

        // Ensure JSON fields are strings
        foreach (array('variables_json', 'questions_json', 'timeline_json', 'analysis_json', 'category_scores_json') as $field) {
            if (is_array($data[$field])) {
                $data[$field] = json_encode($data[$field]);
            }
        }

        $result = $wpdb->insert(
            $this->table_sessions,
            array(
                'user_id' => $data['user_id'],
                'user_name' => $data['user_name'] ? sanitize_text_field($data['user_name']) : null,
                'session_id' => $data['session_id'],
                'scenario_id' => intval($data['scenario_id']),
                'variables_json' => $data['variables_json'],
                'questions_json' => $data['questions_json'],
                'timeline_json' => $data['timeline_json'],
                'current_question_index' => intval($data['current_question_index']),
                'status' => $data['status'],
                'video_filename' => $data['video_filename'],
                'video_url' => $data['video_url'],
                'video_duration_seconds' => $data['video_duration_seconds'],
                'thumbnail_url' => $data['thumbnail_url'],
                'transcript' => $data['transcript'],
                'analysis_json' => $data['analysis_json'],
                'overall_score' => $data['overall_score'],
                'category_scores_json' => $data['category_scores_json'],
                'summary_feedback' => $data['summary_feedback'],
                'demo_code' => $data['demo_code'] ? strtoupper(sanitize_text_field($data['demo_code'])) : null,
                'started_at' => $data['started_at'],
                'completed_at' => $data['completed_at'],
            ),
            array('%d', '%s', '%s', '%d', '%s', '%s', '%s', '%d', '%s', '%s', '%s', '%d', '%s', '%s', '%s', '%f', '%s', '%s', '%s', '%s', '%s')
        );

        if ($result === false) {
            error_log('Video Training: Failed to create session - ' . $wpdb->last_error);
            return false;
        }

        return $wpdb->insert_id;
    }

    /**
     * Update a video training session
     *
     * @param int $session_id Session ID
     * @param array $data Data to update
     * @return bool True on success, false on failure
     */
    public function update_session($session_id, $data) {
        global $wpdb;

        $update_data = array();
        $update_format = array();

        $allowed_fields = array(
            'variables_json', 'questions_json', 'timeline_json', 'current_question_index',
            'status', 'video_filename', 'video_url', 'video_duration_seconds', 'thumbnail_url',
            'transcript', 'analysis_json', 'overall_score', 'category_scores_json',
            'summary_feedback', 'started_at', 'completed_at'
        );

        foreach ($allowed_fields as $field) {
            if (isset($data[$field])) {
                $value = $data[$field];

                // Convert arrays to JSON
                if (in_array($field, array('variables_json', 'questions_json', 'timeline_json', 'analysis_json', 'category_scores_json')) && is_array($value)) {
                    $value = json_encode($value);
                }

                $update_data[$field] = $value;

                // Determine format
                if (in_array($field, array('current_question_index', 'video_duration_seconds'))) {
                    $update_format[] = '%d';
                } elseif ($field === 'overall_score') {
                    $update_format[] = '%f';
                } else {
                    $update_format[] = '%s';
                }
            }
        }

        if (empty($update_data)) {
            return false;
        }

        $result = $wpdb->update(
            $this->table_sessions,
            $update_data,
            array('id' => $session_id),
            $update_format,
            array('%d')
        );

        if ($result === false) {
            error_log('Video Training: Failed to update session - ' . $wpdb->last_error);
            return false;
        }

        return true;
    }

    /**
     * Get a session by ID
     *
     * @param int $session_id Session ID
     * @return object|null Session object or null
     */
    public function get_session($session_id) {
        global $wpdb;

        $session = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT s.*, sc.title as scenario_title, sc.icon as scenario_icon, sc.scenario_type
                 FROM {$this->table_sessions} s
                 LEFT JOIN {$this->table_scenarios} sc ON s.scenario_id = sc.id
                 WHERE s.id = %d",
                $session_id
            )
        );

        if ($session) {
            $this->parse_session_json_fields($session);
        }

        return $session;
    }

    /**
     * Get a session by UUID
     *
     * @param string $session_uuid Session UUID
     * @return object|null Session object or null
     */
    public function get_session_by_uuid($session_uuid) {
        global $wpdb;

        $session = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT s.*, sc.title as scenario_title, sc.icon as scenario_icon, sc.scenario_type
                 FROM {$this->table_sessions} s
                 LEFT JOIN {$this->table_scenarios} sc ON s.scenario_id = sc.id
                 WHERE s.session_id = %s",
                $session_uuid
            )
        );

        if ($session) {
            $this->parse_session_json_fields($session);
        }

        return $session;
    }

    /**
     * Get all sessions for a user
     *
     * @param int $user_id User ID
     * @param array $args Query arguments
     * @return array Array of session objects
     */
    public function get_user_sessions($user_id = null, $args = array()) {
        global $wpdb;

        if ($user_id === null) {
            $user_id = get_current_user_id();
        }

        $defaults = array(
            'limit' => 50,
            'offset' => 0,
            'orderby' => 'created_at',
            'order' => 'DESC',
            'status' => null,
            'scenario_id' => null,
            'demo_code' => null,
        );

        $args = wp_parse_args($args, $defaults);

        // Build WHERE clause
        $where = array('s.user_id = %d');
        $where_values = array($user_id);

        if ($args['status']) {
            $where[] = 's.status = %s';
            $where_values[] = $args['status'];
        }

        if ($args['scenario_id']) {
            $where[] = 's.scenario_id = %d';
            $where_values[] = $args['scenario_id'];
        }

        // Filter by demo_code if provided (for demo users)
        if (!empty($args['demo_code'])) {
            $where[] = 's.demo_code = %s';
            $where_values[] = strtoupper($args['demo_code']);
        }

        $where_clause = implode(' AND ', $where);

        // Validate orderby
        $allowed_orderby = array('id', 'created_at', 'updated_at', 'status', 'overall_score');
        if (!in_array($args['orderby'], $allowed_orderby)) {
            $args['orderby'] = 'created_at';
        }

        $args['order'] = strtoupper($args['order']) === 'ASC' ? 'ASC' : 'DESC';

        $sessions = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT s.*, sc.title as scenario_title, sc.icon as scenario_icon, sc.scenario_type
                 FROM {$this->table_sessions} s
                 LEFT JOIN {$this->table_scenarios} sc ON s.scenario_id = sc.id
                 WHERE {$where_clause}
                 ORDER BY s.{$args['orderby']} {$args['order']}
                 LIMIT %d OFFSET %d",
                array_merge($where_values, array($args['limit'], $args['offset']))
            )
        );

        // Parse JSON fields
        foreach ($sessions as &$session) {
            $this->parse_session_json_fields($session);
        }

        return $sessions;
    }

    /**
     * Get session count for a user
     *
     * @param int $user_id User ID
     * @param string $status Optional status filter
     * @return int Count
     */
    public function get_user_sessions_count($user_id = null, $status = null, $demo_code = null) {
        global $wpdb;

        if ($user_id === null) {
            $user_id = get_current_user_id();
        }

        $where = 'user_id = %d';
        $where_values = array($user_id);

        if ($status) {
            $where .= ' AND status = %s';
            $where_values[] = $status;
        }

        if (!empty($demo_code)) {
            $where .= ' AND demo_code = %s';
            $where_values[] = strtoupper($demo_code);
        }

        $count = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COUNT(*) FROM {$this->table_sessions} WHERE {$where}",
                ...$where_values
            )
        );

        return (int) $count;
    }

    /**
     * Delete a session
     *
     * @param int $session_id Session ID
     * @param int $user_id User ID (for security check)
     * @return bool True on success, false on failure
     */
    public function delete_session($session_id, $user_id = null) {
        global $wpdb;

        if ($user_id === null) {
            $user_id = get_current_user_id();
        }

        $session = $this->get_session($session_id);

        if (!$session || (int) $session->user_id !== (int) $user_id) {
            return false;
        }

        // Delete video file if exists
        if ($session->video_filename) {
            $video_handler = Bewerbungstrainer_Video_Handler::get_instance();
            $video_handler->delete_video($session->video_filename);
        }

        // Delete session
        $result = $wpdb->delete(
            $this->table_sessions,
            array(
                'id' => $session_id,
                'user_id' => $user_id,
            ),
            array('%d', '%d')
        );

        if ($result === false) {
            error_log('Video Training: Failed to delete session - ' . $wpdb->last_error);
            return false;
        }

        return true;
    }

    /**
     * Parse JSON fields in session object
     *
     * @param object $session Session object (modified by reference)
     */
    private function parse_session_json_fields(&$session) {
        $json_fields = array('variables_json', 'questions_json', 'timeline_json', 'analysis_json', 'category_scores_json');

        foreach ($json_fields as $field) {
            if (isset($session->$field) && is_string($session->$field)) {
                $session->$field = json_decode($session->$field, true);
            }
        }
    }

    /**
     * Get table names
     */
    public function get_table_scenarios() {
        return $this->table_scenarios;
    }

    public function get_table_sessions() {
        return $this->table_sessions;
    }
}
