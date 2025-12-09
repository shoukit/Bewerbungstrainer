<?php
/**
 * Game Database Management Class
 *
 * Handles database operations for Rhetorik-Gym game sessions
 * and scenario templates for Szenario-Training
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

class Bewerbungstrainer_Game_Database {

    /**
     * Instance of this class
     */
    private static $instance = null;

    /**
     * Table name for scenario templates
     */
    private $table_scenario_templates;

    /**
     * Table name for game sessions
     */
    private $table_game_sessions;

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
        $this->table_scenario_templates = $wpdb->prefix . 'bewerbungstrainer_scenario_templates';
        $this->table_game_sessions = $wpdb->prefix . 'bewerbungstrainer_game_sessions';
    }

    /**
     * Create database tables
     */
    public static function create_tables() {
        global $wpdb;

        $charset_collate = $wpdb->get_charset_collate();

        // Scenario Templates Table
        $table_scenario_templates = $wpdb->prefix . 'bewerbungstrainer_scenario_templates';

        $sql_scenario_templates = "CREATE TABLE IF NOT EXISTS $table_scenario_templates (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            title varchar(255) NOT NULL,
            description text DEFAULT NULL,
            category varchar(100) NOT NULL DEFAULT 'allgemein',
            difficulty enum('leicht', 'mittel', 'schwer') NOT NULL DEFAULT 'mittel',
            system_prompt longtext NOT NULL,
            wizard_config_json longtext DEFAULT NULL,
            question_count int DEFAULT 5,
            estimated_duration int DEFAULT 15,
            icon varchar(50) DEFAULT 'briefcase',
            is_active tinyint(1) NOT NULL DEFAULT 1,
            sort_order int DEFAULT 0,
            created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY category (category),
            KEY is_active (is_active),
            KEY sort_order (sort_order)
        ) $charset_collate;";

        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql_scenario_templates);

        // Game Sessions Table (for Rhetorik-Gym)
        $table_game_sessions = $wpdb->prefix . 'bewerbungstrainer_game_sessions';

        $sql_game_sessions = "CREATE TABLE IF NOT EXISTS $table_game_sessions (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            user_id bigint(20) UNSIGNED NOT NULL DEFAULT 0,
            session_id varchar(255) NOT NULL,
            game_type enum('klassiker', 'zufall', 'stress') NOT NULL DEFAULT 'klassiker',
            topic varchar(500) DEFAULT NULL,
            duration_seconds int DEFAULT NULL,
            audio_filename varchar(255) DEFAULT NULL,
            audio_url text DEFAULT NULL,
            transcript longtext DEFAULT NULL,
            analysis_json longtext DEFAULT NULL,
            score int DEFAULT NULL,
            filler_count int DEFAULT NULL,
            words_per_minute int DEFAULT NULL,
            highscore_rank int DEFAULT NULL,
            created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY user_id (user_id),
            KEY session_id (session_id),
            KEY game_type (game_type),
            KEY score (score),
            KEY created_at (created_at)
        ) $charset_collate;";

        dbDelta($sql_game_sessions);

        // Insert default scenario templates
        self::seed_default_templates($table_scenario_templates);

        // Update version
        update_option('bewerbungstrainer_game_db_version', '1.0.0');
    }

    /**
     * Seed default scenario templates
     */
    private static function seed_default_templates($table_name) {
        global $wpdb;

        // Check if templates already exist
        $count = $wpdb->get_var("SELECT COUNT(*) FROM $table_name");
        if ($count > 0) {
            return;
        }

        $templates = array(
            array(
                'title' => 'Klassisches Vorstellungsgespräch',
                'description' => 'Übe die typischen Fragen eines Bewerbungsgesprächs für eine Festanstellung.',
                'category' => 'bewerbung',
                'difficulty' => 'mittel',
                'system_prompt' => 'Du bist ein erfahrener HR-Manager und führst ein professionelles Vorstellungsgespräch. Stelle klassische Interviewfragen zu Motivation, Stärken/Schwächen, Berufserfahrung und Zukunftszielen. Sei freundlich aber professionell.',
                'wizard_config_json' => json_encode(array(
                    'fields' => array(
                        array('id' => 'position', 'label' => 'Position', 'type' => 'text', 'required' => true, 'placeholder' => 'z.B. Marketing Manager'),
                        array('id' => 'company', 'label' => 'Unternehmen', 'type' => 'text', 'required' => true, 'placeholder' => 'z.B. BMW AG'),
                        array('id' => 'industry', 'label' => 'Branche', 'type' => 'select', 'required' => false, 'options' => array('IT', 'Finanzen', 'Marketing', 'Vertrieb', 'Produktion', 'Andere'))
                    )
                )),
                'question_count' => 6,
                'estimated_duration' => 20,
                'icon' => 'briefcase'
            ),
            array(
                'title' => 'Stärken & Schwächen',
                'description' => 'Fokussiertes Training zur überzeugenden Darstellung deiner Stärken und ehrlichen Reflexion über Verbesserungspotenziale.',
                'category' => 'bewerbung',
                'difficulty' => 'leicht',
                'system_prompt' => 'Du bist ein Coach für Bewerbungsgespräche. Fokussiere dich auf Fragen zu persönlichen Stärken und Schwächen. Hilf dem Bewerber, authentische und überzeugende Antworten zu formulieren.',
                'wizard_config_json' => json_encode(array(
                    'fields' => array(
                        array('id' => 'position', 'label' => 'Zielposition', 'type' => 'text', 'required' => true, 'placeholder' => 'z.B. Projektleiter'),
                        array('id' => 'experience_years', 'label' => 'Berufserfahrung (Jahre)', 'type' => 'number', 'required' => false)
                    )
                )),
                'question_count' => 4,
                'estimated_duration' => 10,
                'icon' => 'target'
            ),
            array(
                'title' => 'Gehaltsverhandlung',
                'description' => 'Trainiere die heikle Phase der Gehaltsverhandlung mit Argumentationsstrategien.',
                'category' => 'verhandlung',
                'difficulty' => 'schwer',
                'system_prompt' => 'Du führst eine Gehaltsverhandlung mit einem Bewerber. Stelle kritische Fragen zum Gehaltswunsch und fordere Begründungen. Simuliere verschiedene Verhandlungstaktiken.',
                'wizard_config_json' => json_encode(array(
                    'fields' => array(
                        array('id' => 'current_salary', 'label' => 'Aktuelles Gehalt (optional)', 'type' => 'text', 'required' => false, 'placeholder' => 'z.B. 55.000 EUR'),
                        array('id' => 'desired_salary', 'label' => 'Wunschgehalt', 'type' => 'text', 'required' => true, 'placeholder' => 'z.B. 65.000 EUR'),
                        array('id' => 'position', 'label' => 'Position', 'type' => 'text', 'required' => true)
                    )
                )),
                'question_count' => 5,
                'estimated_duration' => 15,
                'icon' => 'euro'
            ),
            array(
                'title' => 'Elevator Pitch',
                'description' => 'Perfektioniere deine 60-Sekunden-Selbstpräsentation.',
                'category' => 'pitch',
                'difficulty' => 'mittel',
                'system_prompt' => 'Du bist ein Business Coach. Bewerte Elevator Pitches auf Struktur, Klarheit und Überzeugungskraft. Gib konstruktives Feedback.',
                'wizard_config_json' => json_encode(array(
                    'fields' => array(
                        array('id' => 'goal', 'label' => 'Ziel des Pitches', 'type' => 'select', 'required' => true, 'options' => array('Job bekommen', 'Investor überzeugen', 'Netzwerken', 'Kunden gewinnen')),
                        array('id' => 'name', 'label' => 'Dein Name', 'type' => 'text', 'required' => true)
                    )
                )),
                'question_count' => 3,
                'estimated_duration' => 10,
                'icon' => 'rocket'
            ),
            array(
                'title' => 'Stressfragen meistern',
                'description' => 'Lerne, mit provokanten und unangenehmen Fragen professionell umzugehen.',
                'category' => 'advanced',
                'difficulty' => 'schwer',
                'system_prompt' => 'Du führst ein Stressinterview. Stelle provokante, unerwartete und kritische Fragen. Teste die Belastbarkeit und Schlagfertigkeit des Bewerbers, bleibe dabei aber respektvoll.',
                'wizard_config_json' => json_encode(array(
                    'fields' => array(
                        array('id' => 'position', 'label' => 'Position', 'type' => 'text', 'required' => true),
                        array('id' => 'weak_points', 'label' => 'Mögliche Angriffspunkte im CV', 'type' => 'textarea', 'required' => false, 'placeholder' => 'z.B. Lücken im Lebenslauf, häufige Jobwechsel...')
                    )
                )),
                'question_count' => 5,
                'estimated_duration' => 15,
                'icon' => 'zap'
            )
        );

        foreach ($templates as $index => $template) {
            $wpdb->insert(
                $table_name,
                array_merge($template, array('sort_order' => $index)),
                array('%s', '%s', '%s', '%s', '%s', '%s', '%d', '%d', '%s', '%d')
            );
        }
    }

    // ===== Scenario Templates Methods =====

    /**
     * Get all active scenario templates
     */
    public function get_scenario_templates($args = array()) {
        global $wpdb;

        $defaults = array(
            'category' => null,
            'difficulty' => null,
            'active_only' => true,
            'orderby' => 'sort_order',
            'order' => 'ASC'
        );

        $args = wp_parse_args($args, $defaults);

        $where = array();

        if ($args['active_only']) {
            $where[] = 'is_active = 1';
        }

        if ($args['category']) {
            $where[] = $wpdb->prepare('category = %s', $args['category']);
        }

        if ($args['difficulty']) {
            $where[] = $wpdb->prepare('difficulty = %s', $args['difficulty']);
        }

        $where_clause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

        $allowed_orderby = array('id', 'title', 'category', 'difficulty', 'sort_order', 'created_at');
        if (!in_array($args['orderby'], $allowed_orderby)) {
            $args['orderby'] = 'sort_order';
        }
        $args['order'] = strtoupper($args['order']) === 'DESC' ? 'DESC' : 'ASC';

        $sql = "SELECT * FROM {$this->table_scenario_templates} {$where_clause} ORDER BY {$args['orderby']} {$args['order']}";

        return $wpdb->get_results($sql);
    }

    /**
     * Get scenario template by ID
     */
    public function get_scenario_template($template_id) {
        global $wpdb;

        return $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$this->table_scenario_templates} WHERE id = %d",
                $template_id
            )
        );
    }

    /**
     * Get scenario categories
     */
    public function get_scenario_categories() {
        global $wpdb;

        return $wpdb->get_col(
            "SELECT DISTINCT category FROM {$this->table_scenario_templates} WHERE is_active = 1 ORDER BY category"
        );
    }

    // ===== Game Sessions Methods =====

    /**
     * Create a new game session
     */
    public function create_game_session($data) {
        global $wpdb;

        $defaults = array(
            'user_id' => get_current_user_id(),
            'session_id' => wp_generate_uuid4(),
            'game_type' => 'klassiker',
            'topic' => null,
            'duration_seconds' => null,
            'audio_filename' => null,
            'audio_url' => null,
            'transcript' => null,
            'analysis_json' => null,
            'score' => null,
            'filler_count' => null,
            'words_per_minute' => null,
        );

        $data = wp_parse_args($data, $defaults);

        $result = $wpdb->insert(
            $this->table_game_sessions,
            array(
                'user_id' => $data['user_id'],
                'session_id' => $data['session_id'],
                'game_type' => $data['game_type'],
                'topic' => sanitize_text_field($data['topic']),
                'duration_seconds' => $data['duration_seconds'],
                'audio_filename' => $data['audio_filename'] ? sanitize_file_name($data['audio_filename']) : null,
                'audio_url' => $data['audio_url'] ? esc_url_raw($data['audio_url']) : null,
                'transcript' => $data['transcript'],
                'analysis_json' => $data['analysis_json'],
                'score' => $data['score'],
                'filler_count' => $data['filler_count'],
                'words_per_minute' => $data['words_per_minute'],
            ),
            array('%d', '%s', '%s', '%s', '%d', '%s', '%s', '%s', '%s', '%d', '%d', '%d')
        );

        if ($result === false) {
            error_log('Bewerbungstrainer: Failed to create game session - ' . $wpdb->last_error);
            return false;
        }

        return $wpdb->insert_id;
    }

    /**
     * Update game session
     */
    public function update_game_session($session_id, $data) {
        global $wpdb;

        $update_data = array();
        $update_format = array();

        $allowed_fields = array(
            'topic' => '%s',
            'duration_seconds' => '%d',
            'audio_filename' => '%s',
            'audio_url' => '%s',
            'transcript' => '%s',
            'analysis_json' => '%s',
            'score' => '%d',
            'filler_count' => '%d',
            'words_per_minute' => '%d',
            'highscore_rank' => '%d'
        );

        foreach ($allowed_fields as $field => $format) {
            if (isset($data[$field])) {
                $update_data[$field] = $data[$field];
                $update_format[] = $format;
            }
        }

        if (empty($update_data)) {
            return false;
        }

        $result = $wpdb->update(
            $this->table_game_sessions,
            $update_data,
            array('id' => $session_id),
            $update_format,
            array('%d')
        );

        return $result !== false;
    }

    /**
     * Get game session by ID
     */
    public function get_game_session($session_id) {
        global $wpdb;

        return $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$this->table_game_sessions} WHERE id = %d",
                $session_id
            )
        );
    }

    /**
     * Get user's game sessions
     */
    public function get_user_game_sessions($user_id = null, $args = array()) {
        global $wpdb;

        if ($user_id === null) {
            $user_id = get_current_user_id();
        }

        $defaults = array(
            'game_type' => null,
            'limit' => 50,
            'offset' => 0,
            'orderby' => 'created_at',
            'order' => 'DESC'
        );

        $args = wp_parse_args($args, $defaults);

        $where = $wpdb->prepare('user_id = %d', $user_id);

        if ($args['game_type']) {
            $where .= $wpdb->prepare(' AND game_type = %s', $args['game_type']);
        }

        $allowed_orderby = array('id', 'created_at', 'score', 'filler_count');
        if (!in_array($args['orderby'], $allowed_orderby)) {
            $args['orderby'] = 'created_at';
        }
        $args['order'] = strtoupper($args['order']) === 'ASC' ? 'ASC' : 'DESC';

        return $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM {$this->table_game_sessions}
                WHERE {$where}
                ORDER BY {$args['orderby']} {$args['order']}
                LIMIT %d OFFSET %d",
                $args['limit'],
                $args['offset']
            )
        );
    }

    /**
     * Get user's highscore for a game type
     */
    public function get_user_highscore($user_id = null, $game_type = null) {
        global $wpdb;

        if ($user_id === null) {
            $user_id = get_current_user_id();
        }

        $where = $wpdb->prepare('user_id = %d AND score IS NOT NULL', $user_id);

        if ($game_type) {
            $where .= $wpdb->prepare(' AND game_type = %s', $game_type);
        }

        return $wpdb->get_var(
            "SELECT MAX(score) FROM {$this->table_game_sessions} WHERE {$where}"
        );
    }

    /**
     * Get leaderboard
     */
    public function get_leaderboard($game_type = null, $limit = 10) {
        global $wpdb;

        $where = 'score IS NOT NULL';
        if ($game_type) {
            $where .= $wpdb->prepare(' AND game_type = %s', $game_type);
        }

        return $wpdb->get_results(
            $wpdb->prepare(
                "SELECT
                    gs.user_id,
                    u.display_name,
                    MAX(gs.score) as best_score,
                    COUNT(*) as total_games,
                    AVG(gs.score) as avg_score
                FROM {$this->table_game_sessions} gs
                LEFT JOIN {$wpdb->users} u ON gs.user_id = u.ID
                WHERE {$where}
                GROUP BY gs.user_id
                ORDER BY best_score DESC
                LIMIT %d",
                $limit
            )
        );
    }

    /**
     * Get user stats
     */
    public function get_user_game_stats($user_id = null) {
        global $wpdb;

        if ($user_id === null) {
            $user_id = get_current_user_id();
        }

        return $wpdb->get_row(
            $wpdb->prepare(
                "SELECT
                    COUNT(*) as total_games,
                    MAX(score) as best_score,
                    AVG(score) as avg_score,
                    MIN(filler_count) as best_filler_count,
                    AVG(filler_count) as avg_filler_count,
                    SUM(duration_seconds) as total_practice_time
                FROM {$this->table_game_sessions}
                WHERE user_id = %d AND score IS NOT NULL",
                $user_id
            )
        );
    }

    /**
     * Delete game session
     */
    public function delete_game_session($session_id, $user_id = null) {
        global $wpdb;

        if ($user_id === null) {
            $user_id = get_current_user_id();
        }

        $session = $this->get_game_session($session_id);

        if (!$session || (int) $session->user_id !== (int) $user_id) {
            return false;
        }

        // Delete audio file if exists
        if (!empty($session->audio_filename)) {
            $audio_handler = Bewerbungstrainer_Audio_Handler::get_instance();
            $audio_handler->delete_audio($session->audio_filename);
        }

        return $wpdb->delete(
            $this->table_game_sessions,
            array('id' => $session_id, 'user_id' => $user_id),
            array('%d', '%d')
        ) !== false;
    }
}
