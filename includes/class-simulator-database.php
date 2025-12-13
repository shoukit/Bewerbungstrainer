<?php
/**
 * Simulator Database Class
 *
 * Handles all database operations for the Skill Simulator feature
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

class Bewerbungstrainer_Simulator_Database {

    /**
     * Instance of this class
     */
    private static $instance = null;

    /**
     * Table names
     */
    private $table_scenarios;
    private $table_sessions;
    private $table_answers;

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
        $this->table_scenarios = $wpdb->prefix . 'bewerbungstrainer_simulator_scenarios';
        $this->table_sessions = $wpdb->prefix . 'bewerbungstrainer_simulator_sessions';
        $this->table_answers = $wpdb->prefix . 'bewerbungstrainer_simulator_answers';

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
            error_log('[SIMULATOR] Tables not found, creating...');
            self::create_tables();
        } else {
            // Check if demo_code column exists, add if not
            $this->maybe_add_demo_code_column();
            // Check if mode column exists, add if not
            $this->maybe_add_mode_column();
        }
    }

    /**
     * Add mode column to scenarios table if it doesn't exist
     */
    private function maybe_add_mode_column() {
        global $wpdb;

        $column_exists = $wpdb->get_results(
            $wpdb->prepare(
                "SHOW COLUMNS FROM `{$this->table_scenarios}` LIKE %s",
                'mode'
            )
        );

        if (empty($column_exists)) {
            error_log('[SIMULATOR] Adding mode column to scenarios table...');
            $wpdb->query("ALTER TABLE `{$this->table_scenarios}` ADD COLUMN `mode` varchar(20) DEFAULT 'INTERVIEW' AFTER `category`");
            $wpdb->query("ALTER TABLE `{$this->table_scenarios}` ADD INDEX `mode` (`mode`)");
            error_log('[SIMULATOR] mode column added successfully');
        }
    }

    /**
     * Add demo_code column to sessions table if it doesn't exist
     */
    private function maybe_add_demo_code_column() {
        global $wpdb;

        $column_exists = $wpdb->get_results(
            $wpdb->prepare(
                "SHOW COLUMNS FROM `{$this->table_sessions}` LIKE %s",
                'demo_code'
            )
        );

        if (empty($column_exists)) {
            error_log('[SIMULATOR] Adding demo_code column to sessions table...');
            $wpdb->query("ALTER TABLE `{$this->table_sessions}` ADD COLUMN `demo_code` varchar(10) DEFAULT NULL AFTER `summary_feedback_json`");
            $wpdb->query("ALTER TABLE `{$this->table_sessions}` ADD INDEX `demo_code` (`demo_code`)");
            error_log('[SIMULATOR] demo_code column added successfully');
        }
    }

    /**
     * Create simulator database tables
     */
    public static function create_tables() {
        global $wpdb;

        $charset_collate = $wpdb->get_charset_collate();

        // Scenarios table - stores configurable scenario templates
        $table_scenarios = $wpdb->prefix . 'bewerbungstrainer_simulator_scenarios';
        $sql_scenarios = "CREATE TABLE IF NOT EXISTS `$table_scenarios` (
            `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            `title` varchar(255) NOT NULL,
            `description` text DEFAULT NULL,
            `icon` varchar(50) DEFAULT 'briefcase',
            `difficulty` varchar(20) DEFAULT 'intermediate',
            `category` varchar(100) DEFAULT NULL,
            `mode` varchar(20) DEFAULT 'INTERVIEW',
            `system_prompt` longtext NOT NULL,
            `question_generation_prompt` longtext DEFAULT NULL,
            `feedback_prompt` longtext DEFAULT NULL,
            `input_configuration` longtext NOT NULL,
            `question_count_min` tinyint UNSIGNED DEFAULT 8,
            `question_count_max` tinyint UNSIGNED DEFAULT 12,
            `time_limit_per_question` int DEFAULT 120,
            `allow_retry` tinyint(1) DEFAULT 1,
            `is_active` tinyint(1) DEFAULT 1,
            `sort_order` int DEFAULT 0,
            `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
            `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            KEY `is_active` (`is_active`),
            KEY `category` (`category`),
            KEY `mode` (`mode`),
            KEY `sort_order` (`sort_order`)
        ) $charset_collate;";

        // Sessions table - stores user training sessions
        $table_sessions = $wpdb->prefix . 'bewerbungstrainer_simulator_sessions';
        $sql_sessions = "CREATE TABLE IF NOT EXISTS `$table_sessions` (
            `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            `user_id` bigint(20) UNSIGNED NOT NULL DEFAULT 0,
            `user_name` varchar(255) DEFAULT NULL,
            `session_id` varchar(36) NOT NULL,
            `scenario_id` bigint(20) UNSIGNED NOT NULL,
            `variables_json` longtext DEFAULT NULL,
            `questions_json` longtext DEFAULT NULL,
            `current_question_index` int DEFAULT 0,
            `status` varchar(20) DEFAULT 'setup',
            `total_questions` int DEFAULT 0,
            `completed_questions` int DEFAULT 0,
            `overall_score` decimal(5,2) DEFAULT NULL,
            `summary_feedback_json` longtext DEFAULT NULL,
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

        // Answers table - stores individual question-answer pairs with feedback
        $table_answers = $wpdb->prefix . 'bewerbungstrainer_simulator_answers';
        $sql_answers = "CREATE TABLE IF NOT EXISTS `$table_answers` (
            `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            `session_id` bigint(20) UNSIGNED NOT NULL,
            `question_index` int NOT NULL,
            `question_text` text NOT NULL,
            `question_category` varchar(100) DEFAULT NULL,
            `audio_filename` varchar(255) DEFAULT NULL,
            `audio_url` text DEFAULT NULL,
            `audio_duration_seconds` int DEFAULT NULL,
            `transcript` longtext DEFAULT NULL,
            `feedback_json` longtext DEFAULT NULL,
            `audio_analysis_json` longtext DEFAULT NULL,
            `content_score` decimal(3,1) DEFAULT NULL,
            `delivery_score` decimal(3,1) DEFAULT NULL,
            `overall_score` decimal(3,1) DEFAULT NULL,
            `attempt_number` int DEFAULT 1,
            `is_final_attempt` tinyint(1) DEFAULT 1,
            `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
            `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            KEY `session_id` (`session_id`),
            KEY `question_index` (`question_index`),
            KEY `is_final_attempt` (`is_final_attempt`)
        ) $charset_collate;";

        // Execute queries directly
        $wpdb->query($sql_scenarios);
        $wpdb->query($sql_sessions);
        $wpdb->query($sql_answers);

        // Log any errors
        if ($wpdb->last_error) {
            error_log('[SIMULATOR] Database error: ' . $wpdb->last_error);
        } else {
            error_log('[SIMULATOR] Tables created successfully');
        }

        // Insert default scenarios if table is empty
        self::insert_default_scenarios();

        // Run migrations for existing installations
        self::run_migrations();

        // Update version
        update_option('bewerbungstrainer_simulator_db_version', '1.1.0');
    }

    /**
     * Run database migrations for existing installations
     */
    private static function run_migrations() {
        global $wpdb;
        $table_scenarios = $wpdb->prefix . 'bewerbungstrainer_simulator_scenarios';

        // Migration: Add 'mode' column if it doesn't exist
        $column_exists = $wpdb->get_results("SHOW COLUMNS FROM `$table_scenarios` LIKE 'mode'");
        if (empty($column_exists)) {
            $wpdb->query("ALTER TABLE `$table_scenarios` ADD COLUMN `mode` varchar(20) DEFAULT 'INTERVIEW' AFTER `category`");
            $wpdb->query("ALTER TABLE `$table_scenarios` ADD KEY `mode` (`mode`)");
            error_log('[SIMULATOR] Migration: Added mode column to scenarios table');
        }
    }

    /**
     * Insert default scenario templates
     */
    private static function insert_default_scenarios() {
        global $wpdb;
        $table = $wpdb->prefix . 'bewerbungstrainer_simulator_scenarios';

        // Check if scenarios already exist
        $count = $wpdb->get_var("SELECT COUNT(*) FROM $table");
        if ($count > 0) {
            return;
        }

        // Default Scenario 1: Bewerbungsgespräch
        $wpdb->insert($table, array(
            'title' => 'Bewerbungsgespräch',
            'description' => 'Übe typische Fragen aus einem Vorstellungsgespräch und erhalte sofortiges Feedback zu deinen Antworten.',
            'icon' => 'briefcase',
            'difficulty' => 'intermediate',
            'category' => 'interview',
            'mode' => 'INTERVIEW',
            'system_prompt' => 'Du bist ein erfahrener HR-Manager mit 15 Jahren Erfahrung in der Personalauswahl. Du führst Bewerbungsgespräche für die Position ${position}${?company: bei } durch. Der Bewerber hat ein ${experience_level}-Level. Stelle professionelle, aber faire Fragen, die dem Erfahrungslevel angemessen sind.',
            'question_generation_prompt' => 'Generiere realistische Interviewfragen für ein Bewerbungsgespräch.

Richtlinien:
1. Beginne mit einer Einstiegsfrage ("Erzählen Sie mir von sich")
2. Mische Fragen zu: Motivation, Fachkompetenz, Soft Skills, Situative Fragen
3. Passe die Komplexität an das Erfahrungslevel an
4. Beziehe das Unternehmen ein, wenn angegeben
5. Ende mit einer Frage nach offenen Punkten

Jede Frage sollte eine geschätzte Antwortzeit von 60-120 Sekunden haben.',
            'feedback_prompt' => 'Bewerte die Antwort des Bewerbers.

Fokussiere auf:
- Relevanz für die Position
- STAR-Methode (Situation, Task, Action, Result)
- Professionalität und Selbstbewusstsein
- Konkrete Beispiele und Zahlen

Sei konstruktiv und motivierend. Verwende die "Du"-Form.',
            'input_configuration' => json_encode(array(
                array(
                    'key' => 'position',
                    'label' => 'Zielposition',
                    'type' => 'text',
                    'required' => true,
                    'placeholder' => 'z.B. Product Manager, Software Engineer',
                    'validation' => array('minLength' => 2, 'maxLength' => 100)
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
                )
            )),
            'question_count_min' => 8,
            'question_count_max' => 12,
            'time_limit_per_question' => 120,
            'allow_retry' => 1,
            'is_active' => 1,
            'sort_order' => 1
        ));

        // Default Scenario 2: Gehaltsverhandlung
        $wpdb->insert($table, array(
            'title' => 'Gehaltsverhandlung',
            'description' => 'Trainiere Argumentationen und Reaktionen für Gehaltsverhandlungen - vom Einstieg bis zur Erhöhung.',
            'icon' => 'banknote',
            'difficulty' => 'advanced',
            'category' => 'negotiation',
            'mode' => 'INTERVIEW',
            'system_prompt' => 'Du bist ein erfahrener Personalleiter, der eine Gehaltsverhandlung mit einem Mitarbeiter führt. Die Person arbeitet als ${position} und hat ${years_experience} Jahre Erfahrung. Das aktuelle Gehalt liegt bei ${current_salary}. Sei professionell aber auch herausfordernd - teste die Verhandlungsfähigkeiten.',
            'question_generation_prompt' => 'Generiere realistische Fragen und Situationen für eine Gehaltsverhandlung.

Szenarien sollten beinhalten:
1. Eröffnung der Verhandlung durch den Mitarbeiter
2. Fragen nach Begründung für die Gehaltsvorstellung
3. Einwände und Gegenargumente des Arbeitgebers
4. Fragen zu alternativen Vergütungen (Benefits, Bonus)
5. Reaktionen auf "Nein" oder "Später"',
            'feedback_prompt' => 'Bewerte die Verhandlungsantwort.

Kriterien:
- Selbstbewusstsein ohne Arroganz
- Konkrete Leistungsnachweise und Marktwert-Argumente
- Flexibilität und Win-Win-Orientierung
- Professionelle Reaktion auf Einwände',
            'input_configuration' => json_encode(array(
                array(
                    'key' => 'negotiation_type',
                    'label' => 'Art der Verhandlung',
                    'type' => 'select',
                    'required' => true,
                    'default' => 'raise',
                    'options' => array(
                        array('value' => 'new_job', 'label' => 'Neuer Job - Einstiegsgehalt verhandeln'),
                        array('value' => 'raise', 'label' => 'Gehaltserhöhung im aktuellen Job'),
                        array('value' => 'promotion', 'label' => 'Gehaltsverhandlung bei Beförderung')
                    )
                ),
                array(
                    'key' => 'position',
                    'label' => 'Aktuelle / Zielposition',
                    'type' => 'text',
                    'required' => true,
                    'placeholder' => 'z.B. Senior Developer'
                ),
                array(
                    'key' => 'years_experience',
                    'label' => 'Jahre Berufserfahrung',
                    'type' => 'select',
                    'required' => true,
                    'options' => array(
                        array('value' => '1-2', 'label' => '1-2 Jahre'),
                        array('value' => '3-5', 'label' => '3-5 Jahre'),
                        array('value' => '5-10', 'label' => '5-10 Jahre'),
                        array('value' => '10+', 'label' => 'Mehr als 10 Jahre')
                    )
                ),
                array(
                    'key' => 'current_salary',
                    'label' => 'Aktuelles Jahresgehalt (brutto)',
                    'type' => 'text',
                    'required' => true,
                    'placeholder' => 'z.B. 55.000 €'
                ),
                array(
                    'key' => 'target_salary',
                    'label' => 'Zielgehalt (brutto)',
                    'type' => 'text',
                    'required' => true,
                    'placeholder' => 'z.B. 65.000 €'
                )
            )),
            'question_count_min' => 6,
            'question_count_max' => 10,
            'time_limit_per_question' => 90,
            'allow_retry' => 1,
            'is_active' => 1,
            'sort_order' => 2
        ));

        // Default Scenario 3: Selbstpräsentation
        $wpdb->insert($table, array(
            'title' => 'Selbstpräsentation',
            'description' => 'Perfektioniere deine Selbstvorstellung und lerne, dich überzeugend zu präsentieren.',
            'icon' => 'user',
            'difficulty' => 'beginner',
            'category' => 'presentation',
            'mode' => 'INTERVIEW',
            'system_prompt' => 'Du bist ein erfahrener Karrierecoach, der Bewerbern hilft, ihre Selbstpräsentation zu verbessern. Der Teilnehmer möchte sich für die Position ${position} bewerben und hat ${experience_level} Erfahrung.',
            'question_generation_prompt' => 'Generiere Fragen und Aufgaben zur Selbstpräsentation.

Beinhalte:
1. "Erzählen Sie mir von sich" (Klassiker)
2. Elevator Pitch (30 Sekunden Version)
3. Beruflicher Werdegang (strukturiert)
4. Stärken und Alleinstellungsmerkmale
5. Motivation und Zukunftsziele

Jede Aufgabe sollte eine klare Anweisung zur Zeitdauer enthalten.',
            'feedback_prompt' => 'Bewerte die Selbstpräsentation.

Fokussiere auf:
- Struktur und roter Faden
- Relevanz für die Zielposition
- Authentizität und Überzeugungskraft
- Zeitmanagement

Gib konkrete Formulierungsvorschläge.',
            'input_configuration' => json_encode(array(
                array(
                    'key' => 'position',
                    'label' => 'Zielposition',
                    'type' => 'text',
                    'required' => true,
                    'placeholder' => 'z.B. Marketing Manager'
                ),
                array(
                    'key' => 'experience_level',
                    'label' => 'Erfahrungslevel',
                    'type' => 'select',
                    'required' => true,
                    'default' => 'professional',
                    'options' => array(
                        array('value' => 'student', 'label' => 'Student / Praktikant'),
                        array('value' => 'entry', 'label' => 'Berufseinsteiger'),
                        array('value' => 'professional', 'label' => 'Professional'),
                        array('value' => 'senior', 'label' => 'Senior / Führungskraft')
                    )
                ),
                array(
                    'key' => 'key_achievements',
                    'label' => 'Wichtigste Erfolge/Erfahrungen',
                    'type' => 'textarea',
                    'required' => false,
                    'placeholder' => 'Nenne 2-3 deiner wichtigsten beruflichen Erfolge oder Erfahrungen...'
                )
            )),
            'question_count_min' => 5,
            'question_count_max' => 8,
            'time_limit_per_question' => 90,
            'allow_retry' => 1,
            'is_active' => 1,
            'sort_order' => 3
        ));
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
            'is_active' => 1,
            'orderby' => 'sort_order',
            'order' => 'ASC',
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

        $where_clause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

        // Validate orderby
        $allowed_orderby = array('id', 'title', 'sort_order', 'created_at', 'difficulty');
        if (!in_array($args['orderby'], $allowed_orderby)) {
            $args['orderby'] = 'sort_order';
        }

        $args['order'] = strtoupper($args['order']) === 'DESC' ? 'DESC' : 'ASC';

        $query = "SELECT * FROM {$this->table_scenarios} {$where_clause} ORDER BY {$args['orderby']} {$args['order']}";

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
            'icon' => 'briefcase',
            'difficulty' => 'intermediate',
            'category' => null,
            'system_prompt' => '',
            'question_generation_prompt' => null,
            'feedback_prompt' => null,
            'input_configuration' => '[]',
            'question_count_min' => 8,
            'question_count_max' => 12,
            'time_limit_per_question' => 120,
            'allow_retry' => 1,
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
                'category' => sanitize_text_field($data['category']),
                'system_prompt' => $data['system_prompt'],
                'question_generation_prompt' => $data['question_generation_prompt'],
                'feedback_prompt' => $data['feedback_prompt'],
                'input_configuration' => $data['input_configuration'],
                'question_count_min' => intval($data['question_count_min']),
                'question_count_max' => intval($data['question_count_max']),
                'time_limit_per_question' => intval($data['time_limit_per_question']),
                'allow_retry' => intval($data['allow_retry']),
                'is_active' => intval($data['is_active']),
                'sort_order' => intval($data['sort_order']),
            ),
            array('%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%d', '%d', '%d', '%d', '%d', '%d')
        );

        if ($result === false) {
            error_log('Bewerbungstrainer Simulator: Failed to create scenario - ' . $wpdb->last_error);
            return false;
        }

        return $wpdb->insert_id;
    }

    /**
     * Update a scenario
     *
     * @param int $scenario_id Scenario ID
     * @param array $data Scenario data to update
     * @return bool True on success, false on failure
     */
    public function update_scenario($scenario_id, $data) {
        global $wpdb;

        $update_data = array();
        $update_format = array();

        $allowed_fields = array(
            'title', 'description', 'icon', 'difficulty', 'category',
            'system_prompt', 'question_generation_prompt', 'feedback_prompt',
            'input_configuration', 'question_count_min', 'question_count_max',
            'time_limit_per_question', 'allow_retry', 'is_active', 'sort_order'
        );

        foreach ($allowed_fields as $field) {
            if (isset($data[$field])) {
                $value = $data[$field];

                // Convert arrays to JSON for input_configuration
                if ($field === 'input_configuration' && is_array($value)) {
                    $value = json_encode($value, JSON_UNESCAPED_UNICODE);
                }

                // Sanitize based on field type
                if (in_array($field, array('title', 'icon', 'difficulty', 'category'))) {
                    $value = sanitize_text_field($value);
                } elseif ($field === 'description') {
                    $value = sanitize_textarea_field($value);
                }

                $update_data[$field] = $value;

                // Determine format
                if (in_array($field, array('question_count_min', 'question_count_max', 'time_limit_per_question', 'allow_retry', 'is_active', 'sort_order'))) {
                    $update_format[] = '%d';
                } else {
                    $update_format[] = '%s';
                }
            }
        }

        if (empty($update_data)) {
            return false;
        }

        $result = $wpdb->update(
            $this->table_scenarios,
            $update_data,
            array('id' => $scenario_id),
            $update_format,
            array('%d')
        );

        if ($result === false) {
            error_log('Bewerbungstrainer Simulator: Failed to update scenario - ' . $wpdb->last_error);
            return false;
        }

        return true;
    }

    /**
     * Delete a scenario
     *
     * @param int $scenario_id Scenario ID
     * @return bool True on success, false on failure
     */
    public function delete_scenario($scenario_id) {
        global $wpdb;

        $result = $wpdb->delete(
            $this->table_scenarios,
            array('id' => $scenario_id),
            array('%d')
        );

        if ($result === false) {
            error_log('Bewerbungstrainer Simulator: Failed to delete scenario - ' . $wpdb->last_error);
            return false;
        }

        return true;
    }

    // =========================================================================
    // SESSION METHODS
    // =========================================================================

    /**
     * Create a new simulator session
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
            'current_question_index' => 0,
            'status' => 'setup',
            'total_questions' => 0,
            'completed_questions' => 0,
            'overall_score' => null,
            'summary_feedback_json' => null,
            'demo_code' => null,
            'started_at' => null,
            'completed_at' => null,
        );

        $data = wp_parse_args($data, $defaults);

        // Ensure JSON fields are strings
        if (is_array($data['variables_json'])) {
            $data['variables_json'] = json_encode($data['variables_json']);
        }
        if (is_array($data['questions_json'])) {
            $data['questions_json'] = json_encode($data['questions_json']);
        }
        if (is_array($data['summary_feedback_json'])) {
            $data['summary_feedback_json'] = json_encode($data['summary_feedback_json']);
        }

        $result = $wpdb->insert(
            $this->table_sessions,
            array(
                'user_id' => $data['user_id'],
                'user_name' => $data['user_name'] ? sanitize_text_field($data['user_name']) : null,
                'session_id' => $data['session_id'],
                'scenario_id' => intval($data['scenario_id']),
                'variables_json' => $data['variables_json'],
                'demo_code' => $data['demo_code'] ? strtoupper(sanitize_text_field($data['demo_code'])) : null,
                'questions_json' => $data['questions_json'],
                'current_question_index' => intval($data['current_question_index']),
                'status' => $data['status'],
                'total_questions' => intval($data['total_questions']),
                'completed_questions' => intval($data['completed_questions']),
                'overall_score' => $data['overall_score'],
                'summary_feedback_json' => $data['summary_feedback_json'],
                'started_at' => $data['started_at'],
                'completed_at' => $data['completed_at'],
            ),
            array('%d', '%s', '%s', '%d', '%s', '%s', '%s', '%d', '%s', '%d', '%d', '%f', '%s', '%s', '%s')
        );

        if ($result === false) {
            error_log('Bewerbungstrainer Simulator: Failed to create session - ' . $wpdb->last_error);
            return false;
        }

        return $wpdb->insert_id;
    }

    /**
     * Update a simulator session
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
            'variables_json', 'questions_json', 'current_question_index',
            'status', 'total_questions', 'completed_questions', 'overall_score',
            'summary_feedback_json', 'started_at', 'completed_at'
        );

        foreach ($allowed_fields as $field) {
            if (isset($data[$field])) {
                $value = $data[$field];

                // Convert arrays to JSON
                if (in_array($field, array('variables_json', 'questions_json', 'summary_feedback_json')) && is_array($value)) {
                    $value = json_encode($value);
                }

                $update_data[$field] = $value;

                // Determine format
                if (in_array($field, array('current_question_index', 'total_questions', 'completed_questions'))) {
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
            error_log('Bewerbungstrainer Simulator: Failed to update session - ' . $wpdb->last_error);
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
                "SELECT s.*, sc.title as scenario_title, sc.icon as scenario_icon
                 FROM {$this->table_sessions} s
                 LEFT JOIN {$this->table_scenarios} sc ON s.scenario_id = sc.id
                 WHERE s.id = %d",
                $session_id
            )
        );

        if ($session) {
            $session->variables_json = json_decode($session->variables_json, true);
            $session->questions_json = json_decode($session->questions_json, true);
            $session->summary_feedback_json = json_decode($session->summary_feedback_json, true);
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
                "SELECT s.*, sc.title as scenario_title, sc.icon as scenario_icon
                 FROM {$this->table_sessions} s
                 LEFT JOIN {$this->table_scenarios} sc ON s.scenario_id = sc.id
                 WHERE s.session_id = %s",
                $session_uuid
            )
        );

        if ($session) {
            $session->variables_json = json_decode($session->variables_json, true);
            $session->questions_json = json_decode($session->questions_json, true);
            $session->summary_feedback_json = json_decode($session->summary_feedback_json, true);
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
                "SELECT s.*, sc.title as scenario_title, sc.icon as scenario_icon
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
            $session->variables_json = json_decode($session->variables_json, true);
            $session->questions_json = json_decode($session->questions_json, true);
            $session->summary_feedback_json = json_decode($session->summary_feedback_json, true);
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

        // Delete all answers first (cascade)
        $wpdb->delete(
            $this->table_answers,
            array('session_id' => $session_id),
            array('%d')
        );

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
            error_log('Bewerbungstrainer Simulator: Failed to delete session - ' . $wpdb->last_error);
            return false;
        }

        return true;
    }

    // =========================================================================
    // ANSWER METHODS
    // =========================================================================

    /**
     * Create a new answer
     *
     * @param array $data Answer data
     * @return int|false Answer ID or false on failure
     */
    public function create_answer($data) {
        global $wpdb;

        $defaults = array(
            'session_id' => 0,
            'question_index' => 0,
            'question_text' => '',
            'question_category' => null,
            'audio_filename' => null,
            'audio_url' => null,
            'audio_duration_seconds' => null,
            'transcript' => null,
            'feedback_json' => null,
            'audio_analysis_json' => null,
            'content_score' => null,
            'delivery_score' => null,
            'overall_score' => null,
            'attempt_number' => 1,
            'is_final_attempt' => 1,
        );

        $data = wp_parse_args($data, $defaults);

        // Ensure JSON fields are strings
        if (is_array($data['feedback_json'])) {
            $data['feedback_json'] = json_encode($data['feedback_json']);
        }
        if (is_array($data['audio_analysis_json'])) {
            $data['audio_analysis_json'] = json_encode($data['audio_analysis_json']);
        }

        $result = $wpdb->insert(
            $this->table_answers,
            array(
                'session_id' => intval($data['session_id']),
                'question_index' => intval($data['question_index']),
                'question_text' => $data['question_text'],
                'question_category' => $data['question_category'] ? sanitize_text_field($data['question_category']) : null,
                'audio_filename' => $data['audio_filename'] ? sanitize_file_name($data['audio_filename']) : null,
                'audio_url' => $data['audio_url'] ? esc_url_raw($data['audio_url']) : null,
                'audio_duration_seconds' => $data['audio_duration_seconds'] ? intval($data['audio_duration_seconds']) : null,
                'transcript' => $data['transcript'],
                'feedback_json' => $data['feedback_json'],
                'audio_analysis_json' => $data['audio_analysis_json'],
                'content_score' => $data['content_score'],
                'delivery_score' => $data['delivery_score'],
                'overall_score' => $data['overall_score'],
                'attempt_number' => intval($data['attempt_number']),
                'is_final_attempt' => intval($data['is_final_attempt']),
            ),
            array('%d', '%d', '%s', '%s', '%s', '%s', '%d', '%s', '%s', '%s', '%f', '%f', '%f', '%d', '%d')
        );

        if ($result === false) {
            error_log('Bewerbungstrainer Simulator: Failed to create answer - ' . $wpdb->last_error);
            return false;
        }

        return $wpdb->insert_id;
    }

    /**
     * Update an answer
     *
     * @param int $answer_id Answer ID
     * @param array $data Data to update
     * @return bool True on success, false on failure
     */
    public function update_answer($answer_id, $data) {
        global $wpdb;

        $update_data = array();
        $update_format = array();

        $allowed_fields = array(
            'audio_filename', 'audio_url', 'audio_duration_seconds',
            'transcript', 'feedback_json', 'audio_analysis_json',
            'content_score', 'delivery_score', 'overall_score',
            'is_final_attempt'
        );

        foreach ($allowed_fields as $field) {
            if (isset($data[$field])) {
                $value = $data[$field];

                // Convert arrays to JSON
                if (in_array($field, array('feedback_json', 'audio_analysis_json')) && is_array($value)) {
                    $value = json_encode($value);
                }

                $update_data[$field] = $value;

                // Determine format
                if (in_array($field, array('audio_duration_seconds', 'is_final_attempt'))) {
                    $update_format[] = '%d';
                } elseif (in_array($field, array('content_score', 'delivery_score', 'overall_score'))) {
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
            $this->table_answers,
            $update_data,
            array('id' => $answer_id),
            $update_format,
            array('%d')
        );

        return $result !== false;
    }

    /**
     * Get answers for a session
     *
     * @param int $session_id Session ID
     * @param bool $final_only Only get final attempts
     * @return array Array of answer objects
     */
    public function get_session_answers($session_id, $final_only = true) {
        global $wpdb;

        $where = 'session_id = %d';
        if ($final_only) {
            $where .= ' AND is_final_attempt = 1';
        }

        $answers = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM {$this->table_answers}
                 WHERE {$where}
                 ORDER BY question_index ASC, attempt_number DESC",
                $session_id
            )
        );

        // Parse JSON fields
        foreach ($answers as &$answer) {
            $answer->feedback_json = json_decode($answer->feedback_json, true);
            $answer->audio_analysis_json = json_decode($answer->audio_analysis_json, true);
        }

        return $answers;
    }

    /**
     * Get a specific answer
     *
     * @param int $answer_id Answer ID
     * @return object|null Answer object or null
     */
    public function get_answer($answer_id) {
        global $wpdb;

        $answer = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$this->table_answers} WHERE id = %d",
                $answer_id
            )
        );

        if ($answer) {
            $answer->feedback_json = json_decode($answer->feedback_json, true);
            $answer->audio_analysis_json = json_decode($answer->audio_analysis_json, true);
        }

        return $answer;
    }

    /**
     * Get the latest answer for a question in a session
     *
     * @param int $session_id Session ID
     * @param int $question_index Question index
     * @return object|null Answer object or null
     */
    public function get_latest_answer_for_question($session_id, $question_index) {
        global $wpdb;

        $answer = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$this->table_answers}
                 WHERE session_id = %d AND question_index = %d
                 ORDER BY attempt_number DESC
                 LIMIT 1",
                $session_id,
                $question_index
            )
        );

        if ($answer) {
            $answer->feedback_json = json_decode($answer->feedback_json, true);
            $answer->audio_analysis_json = json_decode($answer->audio_analysis_json, true);
        }

        return $answer;
    }

    /**
     * Mark previous answers for a question as not final
     *
     * @param int $session_id Session ID
     * @param int $question_index Question index
     * @return bool True on success
     */
    public function mark_previous_answers_not_final($session_id, $question_index) {
        global $wpdb;

        $result = $wpdb->update(
            $this->table_answers,
            array('is_final_attempt' => 0),
            array(
                'session_id' => $session_id,
                'question_index' => $question_index,
            ),
            array('%d'),
            array('%d', '%d')
        );

        return $result !== false;
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

    public function get_table_answers() {
        return $this->table_answers;
    }
}
