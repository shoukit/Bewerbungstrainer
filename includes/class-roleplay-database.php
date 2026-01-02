<?php
/**
 * Roleplay Database Class
 *
 * Database management for Live-Simulation scenarios
 * Similar architecture to Simulator and Video Training
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

class Bewerbungstrainer_Roleplay_Database {

    /**
     * Instance of this class
     */
    private static $instance = null;

    /**
     * Table names
     */
    private $table_scenarios;

    /**
     * Database version
     */
    const DB_VERSION = '1.1.0';

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
        $this->table_scenarios = $wpdb->prefix . 'bewerbungstrainer_roleplay_scenarios';
        error_log('[ROLEPLAY DB] Constructor called, initializing...');
        $this->maybe_create_tables();
    }

    /**
     * Get table name
     */
    public function get_table_name() {
        return $this->table_scenarios;
    }

    /**
     * Create database tables
     */
    public static function create_tables() {
        global $wpdb;

        $charset_collate = $wpdb->get_charset_collate();

        // Roleplay Scenarios table
        $table_scenarios = $wpdb->prefix . 'bewerbungstrainer_roleplay_scenarios';
        $sql_scenarios = "CREATE TABLE IF NOT EXISTS `$table_scenarios` (
            `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            `title` varchar(255) NOT NULL,
            `description` text DEFAULT NULL,
            `long_description` text DEFAULT NULL,
            `icon` varchar(50) DEFAULT 'mic',
            `difficulty` varchar(20) DEFAULT 'medium',
            `target_audience` varchar(500) DEFAULT NULL,
            `category` varchar(500) DEFAULT NULL,
            `role_type` varchar(20) DEFAULT 'interview',
            `user_role_label` varchar(100) DEFAULT 'Bewerber',
            `agent_id` varchar(100) DEFAULT NULL,
            `voice_id` varchar(100) DEFAULT NULL,
            `initial_message` text DEFAULT NULL,
            `system_prompt` longtext DEFAULT NULL,
            `feedback_prompt` longtext DEFAULT NULL,
            `feedback_coach_type` varchar(50) DEFAULT 'general',
            `feedback_custom_intro` text DEFAULT NULL,
            `feedback_extra_focus` text DEFAULT NULL,
            `ai_instructions` longtext DEFAULT NULL,
            `tips` longtext DEFAULT NULL,
            `input_configuration` longtext DEFAULT NULL,
            `interviewer_name` varchar(255) DEFAULT NULL,
            `interviewer_role` varchar(255) DEFAULT NULL,
            `interviewer_image` text DEFAULT NULL,
            `interviewer_properties` text DEFAULT NULL,
            `interviewer_objections` text DEFAULT NULL,
            `interviewer_questions` text DEFAULT NULL,
            `interviewer_editable_fields` text DEFAULT NULL,
            `coaching_hints` text DEFAULT NULL,
            `is_active` tinyint(1) DEFAULT 1,
            `sort_order` int DEFAULT 0,
            `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
            `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            KEY `is_active` (`is_active`),
            KEY `category` (`category`(191)),
            KEY `role_type` (`role_type`),
            KEY `sort_order` (`sort_order`)
        ) $charset_collate;";

        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql_scenarios);

        if ($wpdb->last_error) {
            error_log('[ROLEPLAY DB] Error creating scenarios table: ' . $wpdb->last_error);
        } else {
            error_log('[ROLEPLAY DB] Scenarios table created/updated successfully');
        }

        update_option('bewerbungstrainer_roleplay_db_version', self::DB_VERSION);
    }

    /**
     * Check if tables exist and create if not
     */
    public function maybe_create_tables() {
        global $wpdb;

        $table_exists = $wpdb->get_var(
            $wpdb->prepare("SHOW TABLES LIKE %s", $this->table_scenarios)
        );

        if (!$table_exists) {
            error_log('[ROLEPLAY DB] Table does not exist, creating...');
            self::create_tables();
        } else {
            // Always check for schema upgrades
            error_log('[ROLEPLAY DB] Table exists, checking schema...');
            $this->maybe_upgrade_schema();
        }
    }

    /**
     * Check and upgrade schema if needed
     * Always checks for missing columns regardless of version
     */
    private function maybe_upgrade_schema() {
        global $wpdb;

        // Always check for missing columns (not version-dependent)
        $columns_to_add = array(
            'voice_id' => "ALTER TABLE `{$this->table_scenarios}` ADD COLUMN `voice_id` varchar(100) DEFAULT NULL AFTER `agent_id`",
            'initial_message' => "ALTER TABLE `{$this->table_scenarios}` ADD COLUMN `initial_message` text DEFAULT NULL AFTER `voice_id`",
            'interviewer_name' => "ALTER TABLE `{$this->table_scenarios}` ADD COLUMN `interviewer_name` varchar(255) DEFAULT NULL AFTER `input_configuration`",
            'interviewer_role' => "ALTER TABLE `{$this->table_scenarios}` ADD COLUMN `interviewer_role` varchar(255) DEFAULT NULL AFTER `interviewer_name`",
            'interviewer_image' => "ALTER TABLE `{$this->table_scenarios}` ADD COLUMN `interviewer_image` text DEFAULT NULL AFTER `interviewer_role`",
            'interviewer_properties' => "ALTER TABLE `{$this->table_scenarios}` ADD COLUMN `interviewer_properties` text DEFAULT NULL AFTER `interviewer_image`",
            'interviewer_objections' => "ALTER TABLE `{$this->table_scenarios}` ADD COLUMN `interviewer_objections` text DEFAULT NULL AFTER `interviewer_properties`",
            'interviewer_questions' => "ALTER TABLE `{$this->table_scenarios}` ADD COLUMN `interviewer_questions` text DEFAULT NULL AFTER `interviewer_objections`",
            'interviewer_editable_fields' => "ALTER TABLE `{$this->table_scenarios}` ADD COLUMN `interviewer_editable_fields` text DEFAULT NULL AFTER `interviewer_questions`",
            'coaching_hints' => "ALTER TABLE `{$this->table_scenarios}` ADD COLUMN `coaching_hints` text DEFAULT NULL AFTER `interviewer_editable_fields`",
            'feedback_coach_type' => "ALTER TABLE `{$this->table_scenarios}` ADD COLUMN `feedback_coach_type` varchar(50) DEFAULT 'general' AFTER `feedback_prompt`",
            'feedback_custom_intro' => "ALTER TABLE `{$this->table_scenarios}` ADD COLUMN `feedback_custom_intro` text DEFAULT NULL AFTER `feedback_coach_type`",
            'feedback_extra_focus' => "ALTER TABLE `{$this->table_scenarios}` ADD COLUMN `feedback_extra_focus` text DEFAULT NULL AFTER `feedback_custom_intro`",
        );

        $columns_added = 0;
        foreach ($columns_to_add as $column => $sql) {
            // Check if column exists
            $column_exists = $wpdb->get_var(
                $wpdb->prepare(
                    "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = %s AND TABLE_NAME = %s AND COLUMN_NAME = %s",
                    DB_NAME,
                    $this->table_scenarios,
                    $column
                )
            );

            if (!$column_exists) {
                $wpdb->query($sql);
                if ($wpdb->last_error) {
                    error_log("[ROLEPLAY DB] Error adding column {$column}: " . $wpdb->last_error);
                } else {
                    error_log("[ROLEPLAY DB] Added column {$column}");
                    $columns_added++;
                }
            }
        }

        if ($columns_added > 0) {
            error_log("[ROLEPLAY DB] Schema upgrade complete: {$columns_added} columns added");
        }

        update_option('bewerbungstrainer_roleplay_db_version', self::DB_VERSION);
    }

    /**
     * Get all scenarios
     *
     * @param array $args Query arguments
     * @return array Array of scenario objects
     */
    public function get_scenarios($args = array()) {
        global $wpdb;

        $defaults = array(
            'is_active' => 1,
            'category' => null,
            'target_audience' => null,
            'role_type' => null,
            'orderby' => 'sort_order',
            'order' => 'ASC',
            'limit' => null,
            'offset' => null,
        );

        $args = wp_parse_args($args, $defaults);

        $where = array();
        $where_values = array();

        if ($args['is_active'] !== null) {
            $where[] = 'is_active = %d';
            $where_values[] = $args['is_active'];
        }

        if ($args['category'] !== null) {
            $where[] = 'category LIKE %s';
            $where_values[] = '%' . $wpdb->esc_like($args['category']) . '%';
        }

        if ($args['target_audience'] !== null) {
            $where[] = 'target_audience LIKE %s';
            $where_values[] = '%' . $wpdb->esc_like($args['target_audience']) . '%';
        }

        if ($args['role_type'] !== null) {
            $where[] = 'role_type = %s';
            $where_values[] = $args['role_type'];
        }

        $where_clause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

        // Validate orderby
        $allowed_orderby = array('id', 'title', 'sort_order', 'created_at', 'difficulty');
        if (!in_array($args['orderby'], $allowed_orderby)) {
            $args['orderby'] = 'sort_order';
        }

        $args['order'] = strtoupper($args['order']) === 'DESC' ? 'DESC' : 'ASC';

        $limit_clause = '';
        if ($args['limit'] !== null) {
            $limit_clause = 'LIMIT ' . intval($args['limit']);
            if ($args['offset'] !== null) {
                $limit_clause .= ' OFFSET ' . intval($args['offset']);
            }
        }

        $query = "SELECT * FROM {$this->table_scenarios} {$where_clause} ORDER BY {$args['orderby']} {$args['order']} {$limit_clause}";

        if (!empty($where_values)) {
            $scenarios = $wpdb->get_results($wpdb->prepare($query, ...$where_values));
        } else {
            $scenarios = $wpdb->get_results($query);
        }

        return $scenarios;
    }

    /**
     * Get scenario by ID
     *
     * @param int $id Scenario ID
     * @return object|null Scenario object or null
     */
    public function get_scenario($id) {
        global $wpdb;

        return $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$this->table_scenarios} WHERE id = %d",
                $id
            )
        );
    }

    /**
     * Create scenario
     *
     * @param array $data Scenario data
     * @return int|false Scenario ID or false on failure
     */
    public function create_scenario($data) {
        global $wpdb;

        $defaults = array(
            'title' => '',
            'description' => '',
            'long_description' => '',
            'icon' => 'mic',
            'difficulty' => 'medium',
            'target_audience' => '',
            'category' => '[]',
            'role_type' => 'interview',
            'user_role_label' => 'Bewerber',
            'agent_id' => '',
            'voice_id' => '',
            'initial_message' => '',
            'system_prompt' => '',
            'feedback_prompt' => '',
            'feedback_coach_type' => 'general',
            'feedback_custom_intro' => '',
            'feedback_extra_focus' => '',
            'ai_instructions' => '',
            'tips' => '[]',
            'input_configuration' => '[]',
            'interviewer_name' => '',
            'interviewer_role' => '',
            'interviewer_image' => '',
            'interviewer_properties' => '',
            'interviewer_objections' => '',
            'interviewer_questions' => '',
            'coaching_hints' => '',
            'is_active' => 1,
            'sort_order' => 0,
        );

        $data = wp_parse_args($data, $defaults);

        $result = $wpdb->insert(
            $this->table_scenarios,
            array(
                'title' => $data['title'],
                'description' => $data['description'],
                'long_description' => $data['long_description'],
                'icon' => $data['icon'],
                'difficulty' => $data['difficulty'],
                'target_audience' => $data['target_audience'],
                'category' => $data['category'],
                'role_type' => $data['role_type'],
                'user_role_label' => $data['user_role_label'],
                'agent_id' => $data['agent_id'],
                'voice_id' => $data['voice_id'],
                'initial_message' => $data['initial_message'],
                'system_prompt' => $data['system_prompt'],
                'feedback_prompt' => $data['feedback_prompt'],
                'feedback_coach_type' => $data['feedback_coach_type'],
                'feedback_custom_intro' => $data['feedback_custom_intro'],
                'feedback_extra_focus' => $data['feedback_extra_focus'],
                'ai_instructions' => $data['ai_instructions'],
                'tips' => $data['tips'],
                'input_configuration' => $data['input_configuration'],
                'interviewer_name' => $data['interviewer_name'],
                'interviewer_role' => $data['interviewer_role'],
                'interviewer_image' => $data['interviewer_image'],
                'interviewer_properties' => $data['interviewer_properties'],
                'interviewer_objections' => $data['interviewer_objections'],
                'interviewer_questions' => $data['interviewer_questions'],
                'coaching_hints' => $data['coaching_hints'],
                'is_active' => $data['is_active'],
                'sort_order' => $data['sort_order'],
            ),
            array('%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%d', '%d')
        );

        if ($result === false) {
            error_log('[ROLEPLAY DB] Failed to create scenario: ' . $wpdb->last_error);
            return false;
        }

        return $wpdb->insert_id;
    }

    /**
     * Update scenario
     *
     * @param int $id Scenario ID
     * @param array $data Scenario data
     * @return bool Success status
     */
    public function update_scenario($id, $data) {
        global $wpdb;

        $allowed_fields = array(
            'title', 'description', 'long_description', 'icon', 'difficulty',
            'target_audience', 'category', 'role_type', 'user_role_label',
            'agent_id', 'voice_id', 'initial_message', 'system_prompt',
            'feedback_prompt', 'feedback_coach_type', 'feedback_custom_intro', 'feedback_extra_focus',
            'ai_instructions', 'tips', 'input_configuration',
            'interviewer_name', 'interviewer_role', 'interviewer_image',
            'interviewer_properties', 'interviewer_objections', 'interviewer_questions',
            'interviewer_editable_fields', 'coaching_hints', 'is_active', 'sort_order'
        );

        $update_data = array();
        $format = array();

        foreach ($data as $key => $value) {
            if (in_array($key, $allowed_fields)) {
                $update_data[$key] = $value;
                $format[] = in_array($key, array('is_active', 'sort_order')) ? '%d' : '%s';
            }
        }

        if (empty($update_data)) {
            return false;
        }

        $result = $wpdb->update(
            $this->table_scenarios,
            $update_data,
            array('id' => $id),
            $format,
            array('%d')
        );

        if ($result === false) {
            error_log('[ROLEPLAY DB] Failed to update scenario: ' . $wpdb->last_error);
            return false;
        }

        return true;
    }

    /**
     * Delete scenario
     *
     * @param int $id Scenario ID
     * @return bool Success status
     */
    public function delete_scenario($id) {
        global $wpdb;

        $result = $wpdb->delete(
            $this->table_scenarios,
            array('id' => $id),
            array('%d')
        );

        return $result !== false;
    }

    /**
     * Get scenarios count
     *
     * @param array $args Query arguments
     * @return int Count
     */
    public function get_scenarios_count($args = array()) {
        global $wpdb;

        $where = array();
        $where_values = array();

        if (isset($args['is_active'])) {
            $where[] = 'is_active = %d';
            $where_values[] = $args['is_active'];
        }

        $where_clause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

        $query = "SELECT COUNT(*) FROM {$this->table_scenarios} {$where_clause}";

        if (!empty($where_values)) {
            return (int) $wpdb->get_var($wpdb->prepare($query, ...$where_values));
        }

        return (int) $wpdb->get_var($query);
    }

    /**
     * Import scenario from CSV row
     *
     * @param array $row CSV row data
     * @return int|false Scenario ID or false on failure
     */
    public function import_scenario($row) {
        // Map CSV columns to database columns
        $data = array(
            'title' => $row['title'] ?? $row['post_title'] ?? '',
            'description' => $row['description'] ?? $row['_roleplay_description'] ?? '',
            'long_description' => $row['long_description'] ?? $row['_roleplay_long_description'] ?? '',
            'icon' => $row['icon'] ?? 'mic',
            'difficulty' => $row['difficulty'] ?? $row['_roleplay_difficulty'] ?? 'medium',
            'target_audience' => $row['target_audience'] ?? $row['_roleplay_target_audience'] ?? '',
            'category' => $row['category'] ?? $row['_roleplay_category'] ?? '[]',
            'role_type' => $row['role_type'] ?? $row['_roleplay_role_type'] ?? 'interview',
            'user_role_label' => $row['user_role_label'] ?? $row['_roleplay_user_role_label'] ?? 'Bewerber',
            'agent_id' => $row['agent_id'] ?? $row['_roleplay_agent_id'] ?? '',
            'system_prompt' => $row['system_prompt'] ?? $row['_roleplay_system_prompt'] ?? '',
            'feedback_prompt' => $row['feedback_prompt'] ?? $row['_roleplay_feedback_prompt'] ?? '',
            'ai_instructions' => $row['ai_instructions'] ?? $row['_roleplay_ai_instructions'] ?? '',
            'tips' => $row['tips'] ?? $row['_roleplay_tips'] ?? '[]',
            'input_configuration' => $row['input_configuration'] ?? $row['_roleplay_input_configuration'] ?? '[]',
            'is_active' => isset($row['is_active']) ? (int)$row['is_active'] : 1,
            'sort_order' => isset($row['sort_order']) ? (int)$row['sort_order'] : 0,
        );

        return $this->create_scenario($data);
    }

    /**
     * Find scenario by title
     *
     * @param string $title Scenario title
     * @return object|null Scenario object or null
     */
    public function get_scenario_by_title($title) {
        global $wpdb;

        return $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$this->table_scenarios} WHERE title = %s LIMIT 1",
                $title
            )
        );
    }

    /**
     * Migrate from WordPress Custom Post Type to new table
     * Updates empty fields in existing scenarios, creates new ones if not found
     *
     * @return array Migration result with counts
     */
    public function migrate_from_posts() {
        global $wpdb;

        $results = array(
            'total' => 0,
            'created' => 0,
            'updated' => 0,
            'skipped' => 0,
            'failed' => 0,
            'errors' => array(),
        );

        // Get all roleplay_scenario posts
        $posts = get_posts(array(
            'post_type' => 'roleplay_scenario',
            'post_status' => array('publish', 'draft', 'private'),
            'posts_per_page' => -1,
        ));

        $results['total'] = count($posts);

        error_log('[ROLEPLAY MIGRATION] Starting migration of ' . $results['total'] . ' posts');

        foreach ($posts as $post) {
            // Get system prompt from post content if not in meta
            $system_prompt = get_post_meta($post->ID, '_roleplay_system_prompt', true);
            if (empty($system_prompt) && !empty($post->post_content)) {
                $system_prompt = $post->post_content;
            }

            // Build AI instructions from interviewer profile
            $ai_instructions = get_post_meta($post->ID, '_roleplay_ai_instructions', true);
            if (empty($ai_instructions)) {
                $interviewer_parts = array();
                $interviewer_name = get_post_meta($post->ID, '_roleplay_interviewer_name', true);
                $interviewer_role = get_post_meta($post->ID, '_roleplay_interviewer_role', true);
                $interviewer_properties = get_post_meta($post->ID, '_roleplay_interviewer_properties', true);
                $interviewer_objections = get_post_meta($post->ID, '_roleplay_interviewer_objections', true);
                $interviewer_questions = get_post_meta($post->ID, '_roleplay_interviewer_questions', true);
                $coaching_hints = get_post_meta($post->ID, '_roleplay_coaching_hints', true);

                if (!empty($interviewer_name)) {
                    $interviewer_parts[] = 'Name: ' . $interviewer_name;
                }
                if (!empty($interviewer_role)) {
                    $interviewer_parts[] = 'Rolle: ' . $interviewer_role;
                }
                if (!empty($interviewer_properties)) {
                    $interviewer_parts[] = 'Eigenschaften: ' . $interviewer_properties;
                }
                if (!empty($interviewer_objections)) {
                    $interviewer_parts[] = 'Typische Einwände: ' . $interviewer_objections;
                }
                if (!empty($interviewer_questions)) {
                    $interviewer_parts[] = 'Wichtige Fragen: ' . $interviewer_questions;
                }
                if (!empty($interviewer_parts)) {
                    $ai_instructions = "## Interviewer-Profil\n" . implode("\n", $interviewer_parts);
                }
                if (!empty($coaching_hints)) {
                    $ai_instructions .= (!empty($ai_instructions) ? "\n\n" : '') . "## Coaching-Hinweise\n" . $coaching_hints;
                }
            }

            // Get input configuration from variables_schema if not in meta
            $input_configuration = get_post_meta($post->ID, '_roleplay_input_configuration', true);
            if (empty($input_configuration)) {
                $input_configuration = get_post_meta($post->ID, '_roleplay_variables_schema', true) ?: '[]';
            }

            // Collect CPT data
            $cpt_data = array(
                'title' => $post->post_title,
                'description' => get_post_meta($post->ID, '_roleplay_description', true),
                'long_description' => get_post_meta($post->ID, '_roleplay_long_description', true),
                'icon' => 'mic',
                'difficulty' => get_post_meta($post->ID, '_roleplay_difficulty', true) ?: 'medium',
                'target_audience' => get_post_meta($post->ID, '_roleplay_target_audience', true),
                'category' => get_post_meta($post->ID, '_roleplay_category', true) ?: '[]',
                'role_type' => get_post_meta($post->ID, '_roleplay_role_type', true) ?: 'interview',
                'user_role_label' => get_post_meta($post->ID, '_roleplay_user_role_label', true) ?: 'Bewerber',
                'agent_id' => get_post_meta($post->ID, '_roleplay_agent_id', true),
                'voice_id' => get_post_meta($post->ID, '_roleplay_voice_id', true),
                'initial_message' => get_post_meta($post->ID, '_roleplay_initial_message', true),
                'system_prompt' => $system_prompt,
                'feedback_prompt' => get_post_meta($post->ID, '_roleplay_feedback_prompt', true),
                'ai_instructions' => $ai_instructions,
                'tips' => get_post_meta($post->ID, '_roleplay_tips', true) ?: '[]',
                'input_configuration' => $input_configuration,
                'interviewer_name' => get_post_meta($post->ID, '_roleplay_interviewer_name', true),
                'interviewer_role' => get_post_meta($post->ID, '_roleplay_interviewer_role', true),
                'interviewer_image' => get_post_meta($post->ID, '_roleplay_interviewer_image', true),
                'interviewer_properties' => get_post_meta($post->ID, '_roleplay_interviewer_properties', true),
                'interviewer_objections' => get_post_meta($post->ID, '_roleplay_interviewer_objections', true),
                'interviewer_questions' => get_post_meta($post->ID, '_roleplay_interviewer_questions', true),
                'coaching_hints' => get_post_meta($post->ID, '_roleplay_coaching_hints', true),
                'is_active' => $post->post_status === 'publish' ? 1 : 0,
                'sort_order' => $post->menu_order,
            );

            // Check if scenario with same title exists
            $existing = $this->get_scenario_by_title($post->post_title);

            if ($existing) {
                // Update only empty fields in existing scenario
                $update_data = array();
                $fields_to_check = array(
                    'description', 'long_description', 'target_audience',
                    'agent_id', 'voice_id', 'initial_message', 'system_prompt',
                    'feedback_prompt', 'ai_instructions',
                    'interviewer_name', 'interviewer_role', 'interviewer_image',
                    'interviewer_properties', 'interviewer_objections', 'interviewer_questions',
                    'coaching_hints'
                );

                foreach ($fields_to_check as $field) {
                    // Check if existing field is empty and CPT has data
                    $existing_value = $existing->$field ?? '';
                    $cpt_value = $cpt_data[$field] ?? '';

                    if (empty($existing_value) && !empty($cpt_value)) {
                        $update_data[$field] = $cpt_value;
                    }
                }

                if (!empty($update_data)) {
                    $update_result = $this->update_scenario($existing->id, $update_data);
                    if ($update_result) {
                        $results['updated']++;
                        $updated_fields = implode(', ', array_keys($update_data));
                        error_log('[ROLEPLAY MIGRATION] Updated scenario ' . $existing->id . ' (' . $post->post_title . ') - Fields: ' . $updated_fields);
                        update_post_meta($post->ID, '_migrated_to_scenario_id', $existing->id);
                    } else {
                        $results['failed']++;
                        $results['errors'][] = "Failed to update scenario ID {$existing->id}: {$post->post_title}";
                    }
                } else {
                    $results['skipped']++;
                    error_log('[ROLEPLAY MIGRATION] Skipped (no empty fields to fill): ' . $post->post_title);
                }
            } else {
                // Create new scenario
                error_log('[ROLEPLAY MIGRATION] Creating new: ' . $post->post_title);

                $scenario_id = $this->create_scenario($cpt_data);

                if ($scenario_id) {
                    $results['created']++;
                    update_post_meta($post->ID, '_migrated_to_scenario_id', $scenario_id);
                    error_log('[ROLEPLAY MIGRATION] Created scenario ' . $scenario_id . ' from post ' . $post->ID);
                } else {
                    $results['failed']++;
                    $results['errors'][] = "Failed to create scenario from post ID {$post->ID}: {$post->post_title}";
                    error_log('[ROLEPLAY MIGRATION] Failed to create from post ' . $post->ID);
                }
            }
        }

        // For backwards compatibility, set migrated = created + updated
        $results['migrated'] = $results['created'] + $results['updated'];

        error_log('[ROLEPLAY MIGRATION] Complete. Created: ' . $results['created'] . ', Updated: ' . $results['updated'] . ', Skipped: ' . $results['skipped'] . ', Failed: ' . $results['failed']);

        return $results;
    }

    /**
     * Export scenarios to array for CSV export
     *
     * @return array Array of scenarios ready for CSV export
     */
    public function export_scenarios() {
        $scenarios = $this->get_scenarios(array('is_active' => null));

        $export = array();
        foreach ($scenarios as $scenario) {
            $export[] = array(
                'id' => $scenario->id,
                'title' => $scenario->title,
                'description' => $scenario->description,
                'long_description' => $scenario->long_description,
                'icon' => $scenario->icon,
                'difficulty' => $scenario->difficulty,
                'target_audience' => $scenario->target_audience,
                'category' => $scenario->category,
                'role_type' => $scenario->role_type,
                'user_role_label' => $scenario->user_role_label,
                'agent_id' => $scenario->agent_id,
                'voice_id' => $scenario->voice_id,
                'initial_message' => $scenario->initial_message,
                'system_prompt' => $scenario->system_prompt,
                'feedback_prompt' => $scenario->feedback_prompt,
                'feedback_coach_type' => $scenario->feedback_coach_type,
                'feedback_custom_intro' => $scenario->feedback_custom_intro,
                'feedback_extra_focus' => $scenario->feedback_extra_focus,
                'ai_instructions' => $scenario->ai_instructions,
                'tips' => $scenario->tips,
                'input_configuration' => $scenario->input_configuration,
                'interviewer_name' => $scenario->interviewer_name,
                'interviewer_role' => $scenario->interviewer_role,
                'interviewer_image' => $scenario->interviewer_image,
                'interviewer_properties' => $scenario->interviewer_properties,
                'interviewer_objections' => $scenario->interviewer_objections,
                'interviewer_questions' => $scenario->interviewer_questions,
                'coaching_hints' => $scenario->coaching_hints,
                'is_active' => $scenario->is_active,
                'sort_order' => $scenario->sort_order,
            );
        }

        return $export;
    }
}
