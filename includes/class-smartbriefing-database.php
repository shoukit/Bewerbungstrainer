<?php
/**
 * SmartBriefing Database Class
 *
 * Handles all database operations for the Smart Briefing feature
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

class Bewerbungstrainer_SmartBriefing_Database {

    /**
     * Instance of this class
     */
    private static $instance = null;

    /**
     * Table names
     */
    private $table_templates;
    private $table_briefings;
    private $table_sections;

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
        $this->table_templates = $wpdb->prefix . 'bewerbungstrainer_smartbriefing_templates';
        $this->table_briefings = $wpdb->prefix . 'bewerbungstrainer_smartbriefing_briefings';
        $this->table_sections = $wpdb->prefix . 'bewerbungstrainer_smartbriefing_sections';

        // Check if tables exist, create if not
        $this->maybe_create_tables();
    }

    /**
     * Check if tables exist and create them if not
     * Also runs migrations for schema updates
     */
    private function maybe_create_tables() {
        global $wpdb;

        // Check if templates table exists
        $table_exists = $wpdb->get_var(
            $wpdb->prepare(
                "SHOW TABLES LIKE %s",
                $this->table_templates
            )
        );

        if (!$table_exists) {
            error_log('[SMARTBRIEFING] Tables not found, creating...');
            self::create_tables();
        } else {
            // Tables exist - run migrations for schema updates
            $this->run_migrations();
        }
    }

    /**
     * Run database migrations for schema updates
     * This handles adding new columns/tables to existing installations
     */
    private function run_migrations() {
        global $wpdb;

        $current_version = get_option('bewerbungstrainer_smartbriefing_db_version', '1.0.0');

        // Migration 1.5.0: Add target_audience column to templates table
        if (version_compare($current_version, '1.5.0', '<')) {
            error_log('[SMARTBRIEFING] Running migration to 1.5.0...');

            // Check if target_audience column exists in templates table
            $target_audience_exists = $wpdb->get_results(
                $wpdb->prepare(
                    "SHOW COLUMNS FROM {$this->table_templates} LIKE %s",
                    'target_audience'
                )
            );

            if (empty($target_audience_exists)) {
                error_log('[SMARTBRIEFING] Adding target_audience column to templates table...');

                $wpdb->query(
                    "ALTER TABLE {$this->table_templates} ADD COLUMN `target_audience` varchar(255) DEFAULT NULL AFTER `category`"
                );

                if ($wpdb->last_error) {
                    error_log('[SMARTBRIEFING] Error adding target_audience column: ' . $wpdb->last_error);
                } else {
                    error_log('[SMARTBRIEFING] target_audience column added successfully');
                }
            }

            // Update version
            update_option('bewerbungstrainer_smartbriefing_db_version', '1.5.0');
            error_log('[SMARTBRIEFING] Migration to 1.5.0 completed');
        }

        // Migration 1.6.0: Expand category column to varchar(500) for multi-category support
        if (version_compare($current_version, '1.6.0', '<')) {
            error_log('[SMARTBRIEFING] Running migration to 1.6.0...');

            $wpdb->query(
                "ALTER TABLE {$this->table_templates} MODIFY COLUMN `category` varchar(500) DEFAULT 'CAREER'"
            );

            if ($wpdb->last_error) {
                error_log('[SMARTBRIEFING] Error expanding category column: ' . $wpdb->last_error);
            } else {
                error_log('[SMARTBRIEFING] category column expanded to varchar(500) successfully');
            }

            update_option('bewerbungstrainer_smartbriefing_db_version', '1.6.0');
            error_log('[SMARTBRIEFING] Migration to 1.6.0 completed');
        }

        // Migration 1.4.0: Add ai_role, ai_task, ai_behavior columns to templates table
        if (version_compare($current_version, '1.4.0', '<')) {
            error_log('[SMARTBRIEFING] Running migration to 1.4.0...');

            // Check if ai_role column exists in templates table
            $ai_role_exists = $wpdb->get_results(
                $wpdb->prepare(
                    "SHOW COLUMNS FROM {$this->table_templates} LIKE %s",
                    'ai_role'
                )
            );

            if (empty($ai_role_exists)) {
                error_log('[SMARTBRIEFING] Adding ai_role, ai_task, ai_behavior columns to templates table...');

                $wpdb->query(
                    "ALTER TABLE {$this->table_templates} ADD COLUMN `ai_role` longtext DEFAULT NULL AFTER `system_prompt`"
                );
                $wpdb->query(
                    "ALTER TABLE {$this->table_templates} ADD COLUMN `ai_task` longtext DEFAULT NULL AFTER `ai_role`"
                );
                $wpdb->query(
                    "ALTER TABLE {$this->table_templates} ADD COLUMN `ai_behavior` longtext DEFAULT NULL AFTER `ai_task`"
                );

                if ($wpdb->last_error) {
                    error_log('[SMARTBRIEFING] Error adding structured prompt columns: ' . $wpdb->last_error);
                } else {
                    error_log('[SMARTBRIEFING] Structured prompt columns added successfully');
                }
            }

            // Update version
            update_option('bewerbungstrainer_smartbriefing_db_version', '1.4.0');
            error_log('[SMARTBRIEFING] Migration to 1.4.0 completed');
        }

        // Migration 1.3.0: Add allow_custom_variables column to templates table
        if (version_compare($current_version, '1.3.0', '<')) {
            error_log('[SMARTBRIEFING] Running migration to 1.3.0...');

            // Check if allow_custom_variables column exists in templates table
            $allow_custom_vars_exists = $wpdb->get_results(
                $wpdb->prepare(
                    "SHOW COLUMNS FROM {$this->table_templates} LIKE %s",
                    'allow_custom_variables'
                )
            );

            if (empty($allow_custom_vars_exists)) {
                error_log('[SMARTBRIEFING] Adding allow_custom_variables column to templates table...');

                $wpdb->query(
                    "ALTER TABLE {$this->table_templates} ADD COLUMN `allow_custom_variables` tinyint(1) DEFAULT 0 AFTER `demo_code`"
                );

                if ($wpdb->last_error) {
                    error_log('[SMARTBRIEFING] Error adding allow_custom_variables column: ' . $wpdb->last_error);
                } else {
                    error_log('[SMARTBRIEFING] allow_custom_variables column added successfully');
                }
            }

            // Update version
            update_option('bewerbungstrainer_smartbriefing_db_version', '1.3.0');
            error_log('[SMARTBRIEFING] Migration to 1.3.0 completed');
        }

        // Migration 1.2.0: Add user_id and demo_code columns to templates table for custom templates
        if (version_compare($current_version, '1.2.0', '<')) {
            error_log('[SMARTBRIEFING] Running migration to 1.2.0...');

            // Check if user_id column exists in templates table
            $user_id_exists = $wpdb->get_results(
                $wpdb->prepare(
                    "SHOW COLUMNS FROM {$this->table_templates} LIKE %s",
                    'user_id'
                )
            );

            if (empty($user_id_exists)) {
                error_log('[SMARTBRIEFING] Adding user_id and demo_code columns to templates table...');

                // Add user_id column (NULL = system template, value = user-created template)
                $wpdb->query(
                    "ALTER TABLE {$this->table_templates} ADD COLUMN `user_id` bigint(20) UNSIGNED DEFAULT NULL AFTER `sort_order`"
                );

                // Add demo_code column for demo users
                $wpdb->query(
                    "ALTER TABLE {$this->table_templates} ADD COLUMN `demo_code` varchar(50) DEFAULT NULL AFTER `user_id`"
                );

                // Add index for user_id
                $wpdb->query(
                    "ALTER TABLE {$this->table_templates} ADD KEY `user_id` (`user_id`)"
                );

                // Add index for demo_code
                $wpdb->query(
                    "ALTER TABLE {$this->table_templates} ADD KEY `demo_code` (`demo_code`)"
                );

                if ($wpdb->last_error) {
                    error_log('[SMARTBRIEFING] Error adding user template columns: ' . $wpdb->last_error);
                } else {
                    error_log('[SMARTBRIEFING] User template columns added successfully');
                }
            }

            // Update version
            update_option('bewerbungstrainer_smartbriefing_db_version', '1.2.0');
            error_log('[SMARTBRIEFING] Migration to 1.2.0 completed');
        }

        // Migration 1.1.0: Add title column to briefings table and create sections table
        if (version_compare($current_version, '1.1.0', '<')) {
            error_log('[SMARTBRIEFING] Running migration to 1.1.0...');

            // Check if title column exists in briefings table
            $title_exists = $wpdb->get_results(
                $wpdb->prepare(
                    "SHOW COLUMNS FROM {$this->table_briefings} LIKE %s",
                    'title'
                )
            );

            if (empty($title_exists)) {
                error_log('[SMARTBRIEFING] Adding title column to briefings table...');
                $wpdb->query(
                    "ALTER TABLE {$this->table_briefings} ADD COLUMN `title` varchar(255) DEFAULT NULL AFTER `briefing_uuid`"
                );

                if ($wpdb->last_error) {
                    error_log('[SMARTBRIEFING] Error adding title column: ' . $wpdb->last_error);
                } else {
                    error_log('[SMARTBRIEFING] Title column added successfully');
                }
            }

            // Check if sections table exists
            $sections_exists = $wpdb->get_var(
                $wpdb->prepare(
                    "SHOW TABLES LIKE %s",
                    $this->table_sections
                )
            );

            if (!$sections_exists) {
                error_log('[SMARTBRIEFING] Creating sections table...');
                $charset_collate = $wpdb->get_charset_collate();

                $sql_sections = "CREATE TABLE IF NOT EXISTS `{$this->table_sections}` (
                    `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
                    `briefing_id` bigint(20) UNSIGNED NOT NULL,
                    `sort_order` int(11) NOT NULL DEFAULT 0,
                    `section_title` varchar(255) NOT NULL,
                    `ai_content` longtext DEFAULT NULL,
                    `user_notes` longtext DEFAULT NULL,
                    `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
                    `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    PRIMARY KEY (`id`),
                    KEY `briefing_id` (`briefing_id`),
                    KEY `sort_order` (`sort_order`)
                ) $charset_collate;";

                $wpdb->query($sql_sections);

                if ($wpdb->last_error) {
                    error_log('[SMARTBRIEFING] Error creating sections table: ' . $wpdb->last_error);
                } else {
                    error_log('[SMARTBRIEFING] Sections table created successfully');
                }
            }

            // Update version
            update_option('bewerbungstrainer_smartbriefing_db_version', '1.1.0');
            error_log('[SMARTBRIEFING] Migration to 1.1.0 completed');
        }
    }

    /**
     * Create smartbriefing database tables
     */
    public static function create_tables() {
        global $wpdb;

        $charset_collate = $wpdb->get_charset_collate();

        // Templates table - stores configurable briefing templates
        // user_id = NULL means system template, user_id = value means user-created template
        $table_templates = $wpdb->prefix . 'bewerbungstrainer_smartbriefing_templates';
        $sql_templates = "CREATE TABLE IF NOT EXISTS `$table_templates` (
            `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            `title` varchar(255) NOT NULL,
            `description` text DEFAULT NULL,
            `icon` varchar(50) DEFAULT 'file-text',
            `category` varchar(500) DEFAULT 'CAREER',
            `target_audience` varchar(255) DEFAULT NULL,
            `system_prompt` longtext NOT NULL,
            `ai_role` longtext DEFAULT NULL,
            `ai_task` longtext DEFAULT NULL,
            `ai_behavior` longtext DEFAULT NULL,
            `variables_schema` longtext NOT NULL,
            `is_active` tinyint(1) DEFAULT 1,
            `sort_order` int DEFAULT 0,
            `user_id` bigint(20) UNSIGNED DEFAULT NULL,
            `demo_code` varchar(50) DEFAULT NULL,
            `allow_custom_variables` tinyint(1) DEFAULT 0,
            `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
            `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            KEY `is_active` (`is_active`),
            KEY `category` (`category`),
            KEY `sort_order` (`sort_order`),
            KEY `user_id` (`user_id`),
            KEY `demo_code` (`demo_code`)
        ) $charset_collate;";

        // Briefings table - stores user-generated briefings (UserBriefing container)
        $table_briefings = $wpdb->prefix . 'bewerbungstrainer_smartbriefing_briefings';
        $sql_briefings = "CREATE TABLE IF NOT EXISTS `$table_briefings` (
            `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            `user_id` bigint(20) UNSIGNED NOT NULL DEFAULT 0,
            `user_name` varchar(255) DEFAULT NULL,
            `template_id` bigint(20) UNSIGNED NOT NULL,
            `briefing_uuid` varchar(36) NOT NULL,
            `title` varchar(255) DEFAULT NULL,
            `variables_json` longtext DEFAULT NULL,
            `content_markdown` longtext DEFAULT NULL,
            `status` varchar(20) DEFAULT 'generating',
            `demo_code` varchar(10) DEFAULT NULL,
            `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
            `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            UNIQUE KEY `briefing_uuid` (`briefing_uuid`),
            KEY `user_id` (`user_id`),
            KEY `template_id` (`template_id`),
            KEY `status` (`status`),
            KEY `demo_code` (`demo_code`),
            KEY `created_at` (`created_at`)
        ) $charset_collate;";

        // Sections table - stores individual briefing sections (BriefingSection)
        $table_sections = $wpdb->prefix . 'bewerbungstrainer_smartbriefing_sections';
        $sql_sections = "CREATE TABLE IF NOT EXISTS `$table_sections` (
            `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            `briefing_id` bigint(20) UNSIGNED NOT NULL,
            `sort_order` int(11) NOT NULL DEFAULT 0,
            `section_title` varchar(255) NOT NULL,
            `ai_content` longtext DEFAULT NULL,
            `user_notes` longtext DEFAULT NULL,
            `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
            `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            KEY `briefing_id` (`briefing_id`),
            KEY `sort_order` (`sort_order`)
        ) $charset_collate;";

        // Execute queries directly
        $wpdb->query($sql_templates);
        $wpdb->query($sql_briefings);
        $wpdb->query($sql_sections);

        // Log any errors
        if ($wpdb->last_error) {
            error_log('[SMARTBRIEFING] Database error: ' . $wpdb->last_error);
        } else {
            error_log('[SMARTBRIEFING] Tables created successfully');
        }

        // Insert default templates if table is empty
        self::insert_default_templates();

        // Update version to latest
        update_option('bewerbungstrainer_smartbriefing_db_version', '1.4.0');
    }

    /**
     * Insert default briefing templates
     */
    private static function insert_default_templates() {
        global $wpdb;
        $table = $wpdb->prefix . 'bewerbungstrainer_smartbriefing_templates';

        // Check if templates already exist
        $count = $wpdb->get_var("SELECT COUNT(*) FROM $table");
        if ($count > 0) {
            return;
        }

        // Default Template 1: Job Interview Deep-Dive
        $wpdb->insert($table, array(
            'title' => 'Job Interview Deep-Dive',
            'description' => 'Erhalte ein maßgeschneidertes Briefing mit Insider-Wissen, fachlichen Must-Haves und cleveren Rückfragen für dein Vorstellungsgespräch.',
            'icon' => 'briefcase',
            'category' => 'CAREER',
            'system_prompt' => 'Du bist ein strategischer Karriere-Coach. Erstelle ein maßgeschneidertes Briefing für den Nutzer.

User-Daten:
- Rolle: ${role_name}
- Firma: ${target_company}
- Fokus: ${interview_type}

Generiere eine strukturierte Checkliste in Markdown.

Struktur:
### 1. Dein Personal Pitch 👤
[Erstelle 3 provokante Leitfragen, um die Story für ${role_name} zu schärfen.]

### 2. Fachliche "Must-Haves" für ${target_company} 🛠️
[Liste 4-5 konkrete Fachbegriffe, Tools oder Trends, die für diese Firma aktuell entscheidend sind.]

### 3. Insider-Wissen & Kultur 🏢
[Was muss man über ${target_company} wissen? Werte, aktuelle News?]

### 4. Smart Questions ❓
[3 intelligente Rückfragen an den Recruiter.]

Sei motivierend, spezifisch und professionell.',
            'variables_schema' => json_encode(array(
                array(
                    'key' => 'role_name',
                    'label' => 'Deine Ziel-Rolle',
                    'type' => 'text',
                    'required' => true,
                    'placeholder' => 'z.B. KFZ-Mechatroniker, Product Manager'
                ),
                array(
                    'key' => 'target_company',
                    'label' => 'Unternehmen',
                    'type' => 'text',
                    'required' => true,
                    'placeholder' => 'z.B. BMW München, Siemens AG'
                ),
                array(
                    'key' => 'interview_type',
                    'label' => 'Art des Gesprächs',
                    'type' => 'select',
                    'required' => true,
                    'default' => 'erstgespraech',
                    'options' => array(
                        array('value' => 'erstgespraech', 'label' => 'Erstgespräch / Telefoninterview'),
                        array('value' => 'fachgespraech', 'label' => 'Fachgespräch'),
                        array('value' => 'assessment', 'label' => 'Assessment Center'),
                        array('value' => 'final', 'label' => 'Finalgespräch mit Geschäftsführung')
                    )
                )
            )),
            'is_active' => 1,
            'sort_order' => 1
        ));

        // Default Template 2: Gehaltsverhandlung Prep
        $wpdb->insert($table, array(
            'title' => 'Gehaltsverhandlung Prep',
            'description' => 'Bereite dich mit Marktwert-Daten, Argumentationsstrategien und Verhandlungstaktiken auf deine Gehaltsverhandlung vor.',
            'icon' => 'banknote',
            'category' => 'CAREER',
            'system_prompt' => 'Du bist ein erfahrener Verhandlungscoach. Erstelle ein strategisches Briefing für eine Gehaltsverhandlung.

User-Daten:
- Position: ${position}
- Aktuelles Gehalt: ${current_salary}
- Zielgehalt: ${target_salary}
- Verhandlungskontext: ${negotiation_context}

Generiere ein strukturiertes Briefing in Markdown:

### 1. Marktwert-Check 📊
[Einschätzung des Marktwerts für ${position}. Ist das Zielgehalt realistisch?]

### 2. Deine Top-3 Argumente 💪
[3 konkrete, evidenzbasierte Argumente für die Gehaltserhöhung, bezogen auf Leistung und Mehrwert.]

### 3. Gegenargument-Parry 🛡️
[Die 3 häufigsten Einwände des Arbeitgebers und wie du sie elegant entkräftest.]

### 4. Verhandlungstaktiken 🎯
[2-3 konkrete Taktiken für diese spezifische Verhandlungssituation.]

### 5. Dein Walk-Away-Point 🚪
[Definiere deine Schmerzgrenze und alternative Benefits, die du verhandeln kannst.]

Sei strategisch, datenorientiert und selbstbewusst im Ton.',
            'variables_schema' => json_encode(array(
                array(
                    'key' => 'position',
                    'label' => 'Deine Position',
                    'type' => 'text',
                    'required' => true,
                    'placeholder' => 'z.B. Senior Developer, Teamleiter Vertrieb'
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
                    'label' => 'Dein Zielgehalt (brutto)',
                    'type' => 'text',
                    'required' => true,
                    'placeholder' => 'z.B. 65.000 €'
                ),
                array(
                    'key' => 'negotiation_context',
                    'label' => 'Verhandlungskontext',
                    'type' => 'select',
                    'required' => true,
                    'default' => 'jahresgespraech',
                    'options' => array(
                        array('value' => 'neuer_job', 'label' => 'Neuer Job - Einstiegsgehalt'),
                        array('value' => 'jahresgespraech', 'label' => 'Jahresgespräch / reguläre Erhöhung'),
                        array('value' => 'befoerderung', 'label' => 'Beförderung'),
                        array('value' => 'gegenangebot', 'label' => 'Gegenangebot bei Kündigung')
                    )
                )
            )),
            'is_active' => 1,
            'sort_order' => 2
        ));

        // Default Template 3: Kundengespräch Vorbereitung
        $wpdb->insert($table, array(
            'title' => 'Kundengespräch Vorbereitung',
            'description' => 'Bereite dich optimal auf wichtige Kundentermine vor - mit Gesprächsstrategie, Einwandbehandlung und Abschlusstaktiken.',
            'icon' => 'users',
            'category' => 'SALES',
            'system_prompt' => 'Du bist ein erfahrener Sales-Coach. Erstelle ein strategisches Briefing für ein wichtiges Kundengespräch.

User-Daten:
- Kunde/Firma: ${customer_name}
- Branche: ${industry}
- Gesprächsziel: ${meeting_goal}
- Bekannte Herausforderungen: ${customer_challenges}

Generiere ein strukturiertes Briefing in Markdown:

### 1. Kunden-Quick-Check 🔍
[Kurze Analyse: Was solltest du über ${customer_name} und die ${industry}-Branche wissen?]

### 2. Gesprächseröffnung 🎬
[2-3 starke Eröffnungsfragen, die Interesse wecken und den Kunden zum Reden bringen.]

### 3. Pain Points & Lösungen 💡
[Verbinde ${customer_challenges} mit konkreten Lösungsansätzen.]

### 4. Einwandbehandlung 🛡️
[Die 3 wahrscheinlichsten Einwände und deine Antworten.]

### 5. Nächste Schritte & Abschluss 🎯
[Klare Call-to-Actions für das Gespräch. Wie sicherst du den nächsten Schritt?]

Sei kundenorientiert, lösungsfokussiert und konkret.',
            'variables_schema' => json_encode(array(
                array(
                    'key' => 'customer_name',
                    'label' => 'Kunde / Firmenname',
                    'type' => 'text',
                    'required' => true,
                    'placeholder' => 'z.B. Müller GmbH, Deutsche Bahn'
                ),
                array(
                    'key' => 'industry',
                    'label' => 'Branche',
                    'type' => 'text',
                    'required' => true,
                    'placeholder' => 'z.B. Maschinenbau, Einzelhandel'
                ),
                array(
                    'key' => 'meeting_goal',
                    'label' => 'Ziel des Gesprächs',
                    'type' => 'select',
                    'required' => true,
                    'default' => 'erstgespraech',
                    'options' => array(
                        array('value' => 'erstgespraech', 'label' => 'Erstgespräch / Kennenlernen'),
                        array('value' => 'praesentation', 'label' => 'Produktpräsentation'),
                        array('value' => 'angebot', 'label' => 'Angebotsbesprechung'),
                        array('value' => 'abschluss', 'label' => 'Abschlussgespräch'),
                        array('value' => 'upsell', 'label' => 'Upselling / Cross-Selling')
                    )
                ),
                array(
                    'key' => 'customer_challenges',
                    'label' => 'Bekannte Herausforderungen des Kunden',
                    'type' => 'textarea',
                    'required' => false,
                    'placeholder' => 'z.B. Hohe Kosten, langsame Prozesse, Fachkräftemangel...'
                )
            )),
            'is_active' => 1,
            'sort_order' => 3
        ));

        error_log('[SMARTBRIEFING] Default templates inserted');
    }

    // =========================================================================
    // TEMPLATE METHODS
    // =========================================================================

    /**
     * Get all active templates (system templates + user's own templates)
     *
     * @param array $args Query arguments
     * @return array Array of template objects
     */
    public function get_templates($args = array()) {
        global $wpdb;

        $defaults = array(
            'category' => null,
            'is_active' => 1,
            'orderby' => 'sort_order',
            'order' => 'DESC',  // Higher sort_order = shown first (more intuitive)
            'user_id' => null,      // Include user's templates
            'demo_code' => null,    // Include demo user's templates
            'include_user_templates' => true, // Include user-created templates
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

        // Build ownership filter:
        // - System templates (user_id IS NULL)
        // - OR User's own templates (user_id = current user OR demo_code matches)
        if ($args['include_user_templates']) {
            $ownership_conditions = array('user_id IS NULL');

            if ($args['user_id']) {
                $ownership_conditions[] = $wpdb->prepare('user_id = %d', $args['user_id']);
            }

            if (!empty($args['demo_code'])) {
                $ownership_conditions[] = $wpdb->prepare('demo_code = %s', strtoupper($args['demo_code']));
            }

            $where[] = '(' . implode(' OR ', $ownership_conditions) . ')';
        } else {
            // Only system templates
            $where[] = 'user_id IS NULL';
        }

        $where_clause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

        // Validate orderby
        $allowed_orderby = array('id', 'title', 'sort_order', 'created_at', 'category');
        if (!in_array($args['orderby'], $allowed_orderby)) {
            $args['orderby'] = 'sort_order';
        }

        $args['order'] = strtoupper($args['order']) === 'DESC' ? 'DESC' : 'ASC';

        // Add secondary sort by id for consistent ordering when primary sort values are equal
        $secondary_sort = ($args['orderby'] !== 'id') ? ', id ASC' : '';
        // Order by: user templates first (category = MEINE), then by sort_order
        $query = "SELECT * FROM {$this->table_templates} {$where_clause} ORDER BY CASE WHEN user_id IS NOT NULL THEN 0 ELSE 1 END, {$args['orderby']} {$args['order']}{$secondary_sort}";

        if (!empty($where_values)) {
            $templates = $wpdb->get_results($wpdb->prepare($query, ...$where_values));
        } else {
            $templates = $wpdb->get_results($query);
        }

        // Parse JSON fields and add is_custom flag
        foreach ($templates as &$template) {
            $template->variables_schema = json_decode($template->variables_schema, true);
            $template->is_custom = !empty($template->user_id) || !empty($template->demo_code);

            // Parse category if it's a JSON array string (e.g., from CSV import)
            // Handles double-encoded JSON like: ["[\"karriere\",\"fuehrung\"]"]
            if (!empty($template->category) && is_string($template->category) && strpos($template->category, '[') === 0) {
                $parsed_category = json_decode($template->category, true);
                if (is_array($parsed_category)) {
                    // Check for double-encoded JSON: array with single string element that looks like JSON
                    if (count($parsed_category) === 1 && is_string($parsed_category[0]) && strpos($parsed_category[0], '[') === 0) {
                        $double_parsed = json_decode($parsed_category[0], true);
                        if (is_array($double_parsed)) {
                            $parsed_category = $double_parsed;
                        }
                    }
                    $template->category = $parsed_category;
                }
            }
        }

        return $templates;
    }

    /**
     * Get only user's custom templates
     *
     * @param int $user_id User ID
     * @param string $demo_code Demo code
     * @return array Array of template objects
     */
    public function get_user_templates($user_id = null, $demo_code = null) {
        global $wpdb;

        $where = array('is_active = 1');
        $where_values = array();

        $ownership_conditions = array();

        if ($user_id) {
            $ownership_conditions[] = 'user_id = %d';
            $where_values[] = $user_id;
        }

        if (!empty($demo_code)) {
            $ownership_conditions[] = 'demo_code = %s';
            $where_values[] = strtoupper($demo_code);
        }

        if (empty($ownership_conditions)) {
            return array();
        }

        $where[] = '(' . implode(' OR ', $ownership_conditions) . ')';
        $where_clause = 'WHERE ' . implode(' AND ', $where);

        $query = "SELECT * FROM {$this->table_templates} {$where_clause} ORDER BY created_at DESC";

        $templates = $wpdb->get_results($wpdb->prepare($query, ...$where_values));

        // Parse JSON fields
        foreach ($templates as &$template) {
            $template->variables_schema = json_decode($template->variables_schema, true);
            $template->is_custom = true;
        }

        return $templates;
    }

    /**
     * Get a template by ID
     *
     * @param int $template_id Template ID
     * @return object|null Template object or null
     */
    public function get_template($template_id) {
        global $wpdb;

        $template = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$this->table_templates} WHERE id = %d",
                $template_id
            )
        );

        if ($template) {
            $template->variables_schema = json_decode($template->variables_schema, true);

            // Parse category if it's a JSON array string (e.g., from CSV import)
            // Handles double-encoded JSON like: ["[\"karriere\",\"fuehrung\"]"]
            if (!empty($template->category) && is_string($template->category) && strpos($template->category, '[') === 0) {
                $parsed_category = json_decode($template->category, true);
                if (is_array($parsed_category)) {
                    // Check for double-encoded JSON: array with single string element that looks like JSON
                    if (count($parsed_category) === 1 && is_string($parsed_category[0]) && strpos($parsed_category[0], '[') === 0) {
                        $double_parsed = json_decode($parsed_category[0], true);
                        if (is_array($double_parsed)) {
                            $parsed_category = $double_parsed;
                        }
                    }
                    $template->category = $parsed_category;
                }
            }
        }

        return $template;
    }

    /**
     * Create a new template
     *
     * @param array $data Template data
     * @return int|false Template ID or false on failure
     */
    public function create_template($data) {
        global $wpdb;

        $defaults = array(
            'title' => '',
            'description' => null,
            'icon' => 'file-text',
            'category' => 'CAREER',
            'target_audience' => null,
            'system_prompt' => '',
            'ai_role' => null,      // Structured prompt: KI-Rolle (Persona)
            'ai_task' => null,      // Structured prompt: KI-Aufgabe (Was)
            'ai_behavior' => null,  // Structured prompt: KI-Verhalten (Wie)
            'variables_schema' => '[]',
            'is_active' => 1,
            'sort_order' => 0,
            'user_id' => null,      // NULL for system templates, user ID for custom
            'demo_code' => null,    // Demo code for demo users
            'allow_custom_variables' => 0,  // Allow users to add custom variables
        );

        $data = wp_parse_args($data, $defaults);

        // Ensure variables_schema is JSON string
        if (is_array($data['variables_schema'])) {
            $data['variables_schema'] = json_encode($data['variables_schema']);
        }

        // For user-created templates, always set category to MEINE
        if (!empty($data['user_id']) || !empty($data['demo_code'])) {
            $data['category'] = 'MEINE';
        }

        $result = $wpdb->insert(
            $this->table_templates,
            array(
                'title' => sanitize_text_field($data['title']),
                'description' => sanitize_textarea_field($data['description']),
                'icon' => sanitize_text_field($data['icon']),
                'category' => sanitize_text_field($data['category']),
                'target_audience' => sanitize_text_field($data['target_audience']),
                'system_prompt' => $data['system_prompt'],
                'ai_role' => $data['ai_role'],
                'ai_task' => $data['ai_task'],
                'ai_behavior' => $data['ai_behavior'],
                'variables_schema' => $data['variables_schema'],
                'is_active' => intval($data['is_active']),
                'sort_order' => intval($data['sort_order']),
                'user_id' => $data['user_id'] ? intval($data['user_id']) : null,
                'demo_code' => $data['demo_code'] ? strtoupper(sanitize_text_field($data['demo_code'])) : null,
                'allow_custom_variables' => intval($data['allow_custom_variables']),
            ),
            array('%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%d', '%d', '%d', '%s', '%d')
        );

        if ($result === false) {
            error_log('[SMARTBRIEFING] Failed to create template - ' . $wpdb->last_error);
            return false;
        }

        return $wpdb->insert_id;
    }

    /**
     * Update a template
     *
     * @param int $template_id Template ID
     * @param array $data Template data to update
     * @return bool True on success, false on failure
     */
    public function update_template($template_id, $data) {
        global $wpdb;

        $update_data = array();
        $update_format = array();

        $allowed_fields = array(
            'title', 'description', 'icon', 'category', 'target_audience',
            'system_prompt', 'ai_role', 'ai_task', 'ai_behavior',
            'variables_schema', 'is_active', 'sort_order',
            'allow_custom_variables'
        );

        foreach ($allowed_fields as $field) {
            if (isset($data[$field])) {
                $value = $data[$field];

                // Convert arrays to JSON for variables_schema
                if ($field === 'variables_schema' && is_array($value)) {
                    $value = json_encode($value, JSON_UNESCAPED_UNICODE);
                }

                // Sanitize based on field type
                if (in_array($field, array('title', 'icon', 'category'))) {
                    $value = sanitize_text_field($value);
                } elseif ($field === 'description') {
                    $value = sanitize_textarea_field($value);
                }

                $update_data[$field] = $value;

                // Determine format
                if (in_array($field, array('is_active', 'sort_order', 'allow_custom_variables'))) {
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
            $this->table_templates,
            $update_data,
            array('id' => $template_id),
            $update_format,
            array('%d')
        );

        if ($result === false) {
            error_log('[SMARTBRIEFING] Failed to update template - ' . $wpdb->last_error);
            return false;
        }

        return true;
    }

    /**
     * Delete a template
     *
     * @param int $template_id Template ID
     * @param int $user_id User ID for ownership check (optional)
     * @param string $demo_code Demo code for ownership check (optional)
     * @return bool True on success, false on failure
     */
    public function delete_template($template_id, $user_id = null, $demo_code = null) {
        global $wpdb;

        // Check if it's a user template and verify ownership
        $template = $this->get_template($template_id);
        if (!$template) {
            return false;
        }

        // System templates (user_id IS NULL) cannot be deleted via this method
        if (empty($template->user_id) && empty($template->demo_code)) {
            error_log('[SMARTBRIEFING] Cannot delete system template');
            return false;
        }

        // Verify ownership
        if (!$this->user_owns_template($template, $user_id, $demo_code)) {
            error_log('[SMARTBRIEFING] User does not own this template');
            return false;
        }

        $result = $wpdb->delete(
            $this->table_templates,
            array('id' => $template_id),
            array('%d')
        );

        if ($result === false) {
            error_log('[SMARTBRIEFING] Failed to delete template - ' . $wpdb->last_error);
            return false;
        }

        return true;
    }

    /**
     * Delete a template as admin (bypasses ownership check)
     *
     * This method allows administrators to delete any template,
     * including system templates. Should only be called from admin pages.
     *
     * @param int $template_id Template ID
     * @return bool True on success, false on failure
     */
    public function delete_template_admin($template_id) {
        global $wpdb;

        // Verify admin capabilities
        if (!current_user_can('manage_options')) {
            error_log('[SMARTBRIEFING] Admin delete attempted without proper capabilities');
            return false;
        }

        $template = $this->get_template($template_id);
        if (!$template) {
            error_log('[SMARTBRIEFING] Template not found for admin delete: ' . $template_id);
            return false;
        }

        $result = $wpdb->delete(
            $this->table_templates,
            array('id' => $template_id),
            array('%d')
        );

        if ($result === false) {
            error_log('[SMARTBRIEFING] Failed to admin delete template - ' . $wpdb->last_error);
            return false;
        }

        return true;
    }

    /**
     * Check if user owns a template
     *
     * @param object $template Template object
     * @param int $user_id User ID
     * @param string $demo_code Demo code
     * @return bool True if user owns the template
     */
    public function user_owns_template($template, $user_id = null, $demo_code = null) {
        if (!$template) {
            return false;
        }

        // System templates are not owned by any user
        if (empty($template->user_id) && empty($template->demo_code)) {
            return false;
        }

        // Check user_id ownership
        if ($user_id && !empty($template->user_id) && (int)$template->user_id === (int)$user_id) {
            return true;
        }

        // Check demo_code ownership
        if (!empty($demo_code) && !empty($template->demo_code) && strtoupper($template->demo_code) === strtoupper($demo_code)) {
            return true;
        }

        return false;
    }

    // =========================================================================
    // BRIEFING METHODS
    // =========================================================================

    /**
     * Create a new briefing
     *
     * @param array $data Briefing data
     * @return int|false Briefing ID or false on failure
     */
    public function create_briefing($data) {
        global $wpdb;

        $defaults = array(
            'user_id' => get_current_user_id(),
            'user_name' => null,
            'template_id' => 0,
            'briefing_uuid' => wp_generate_uuid4(),
            'title' => null,
            'variables_json' => null,
            'content_markdown' => null,
            'status' => 'generating',
            'demo_code' => null,
        );

        $data = wp_parse_args($data, $defaults);

        // Ensure JSON fields are strings
        if (is_array($data['variables_json'])) {
            $data['variables_json'] = json_encode($data['variables_json']);
        }

        $result = $wpdb->insert(
            $this->table_briefings,
            array(
                'user_id' => $data['user_id'],
                'user_name' => $data['user_name'] ? sanitize_text_field($data['user_name']) : null,
                'template_id' => intval($data['template_id']),
                'briefing_uuid' => $data['briefing_uuid'],
                'title' => $data['title'] ? sanitize_text_field($data['title']) : null,
                'variables_json' => $data['variables_json'],
                'content_markdown' => $data['content_markdown'],
                'status' => $data['status'],
                'demo_code' => $data['demo_code'] ? strtoupper(sanitize_text_field($data['demo_code'])) : null,
            ),
            array('%d', '%s', '%d', '%s', '%s', '%s', '%s', '%s', '%s')
        );

        if ($result === false) {
            error_log('[SMARTBRIEFING] Failed to create briefing - ' . $wpdb->last_error);
            return false;
        }

        return $wpdb->insert_id;
    }

    /**
     * Update a briefing
     *
     * @param int $briefing_id Briefing ID
     * @param array $data Data to update
     * @return bool True on success, false on failure
     */
    public function update_briefing($briefing_id, $data) {
        global $wpdb;

        $update_data = array();
        $update_format = array();

        $allowed_fields = array(
            'title', 'variables_json', 'content_markdown', 'status'
        );

        foreach ($allowed_fields as $field) {
            if (isset($data[$field])) {
                $value = $data[$field];

                // Convert arrays to JSON
                if ($field === 'variables_json' && is_array($value)) {
                    $value = json_encode($value);
                }

                // Sanitize title
                if ($field === 'title') {
                    $value = sanitize_text_field($value);
                }

                $update_data[$field] = $value;
                $update_format[] = '%s';
            }
        }

        if (empty($update_data)) {
            return false;
        }

        $result = $wpdb->update(
            $this->table_briefings,
            $update_data,
            array('id' => $briefing_id),
            $update_format,
            array('%d')
        );

        if ($result === false) {
            error_log('[SMARTBRIEFING] Failed to update briefing - ' . $wpdb->last_error);
            return false;
        }

        return true;
    }

    /**
     * Get a briefing by ID
     *
     * @param int $briefing_id Briefing ID
     * @return object|null Briefing object or null
     */
    public function get_briefing($briefing_id) {
        global $wpdb;

        $briefing = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT b.*, t.title as template_title, t.icon as template_icon
                 FROM {$this->table_briefings} b
                 LEFT JOIN {$this->table_templates} t ON b.template_id = t.id
                 WHERE b.id = %d",
                $briefing_id
            )
        );

        if ($briefing) {
            $briefing->variables_json = json_decode($briefing->variables_json, true);
        }

        return $briefing;
    }

    /**
     * Get a briefing by UUID
     *
     * @param string $briefing_uuid Briefing UUID
     * @return object|null Briefing object or null
     */
    public function get_briefing_by_uuid($briefing_uuid) {
        global $wpdb;

        $briefing = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT b.*, t.title as template_title, t.icon as template_icon
                 FROM {$this->table_briefings} b
                 LEFT JOIN {$this->table_templates} t ON b.template_id = t.id
                 WHERE b.briefing_uuid = %s",
                $briefing_uuid
            )
        );

        if ($briefing) {
            $briefing->variables_json = json_decode($briefing->variables_json, true);
        }

        return $briefing;
    }

    /**
     * Get all briefings for a user
     *
     * @param int $user_id User ID
     * @param array $args Query arguments
     * @return array Array of briefing objects
     */
    public function get_user_briefings($user_id = null, $args = array()) {
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
            'template_id' => null,
            'demo_code' => null,
        );

        $args = wp_parse_args($args, $defaults);

        // Build WHERE clause
        $where = array('b.user_id = %d');
        $where_values = array($user_id);

        if ($args['status']) {
            $where[] = 'b.status = %s';
            $where_values[] = $args['status'];
        }

        if ($args['template_id']) {
            $where[] = 'b.template_id = %d';
            $where_values[] = $args['template_id'];
        }

        if (!empty($args['demo_code'])) {
            $where[] = 'b.demo_code = %s';
            $where_values[] = strtoupper($args['demo_code']);
        }

        $where_clause = implode(' AND ', $where);

        // Validate orderby
        $allowed_orderby = array('id', 'created_at', 'updated_at', 'status');
        if (!in_array($args['orderby'], $allowed_orderby)) {
            $args['orderby'] = 'created_at';
        }

        $args['order'] = strtoupper($args['order']) === 'ASC' ? 'ASC' : 'DESC';

        $briefings = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT b.*, t.title as template_title, t.icon as template_icon
                 FROM {$this->table_briefings} b
                 LEFT JOIN {$this->table_templates} t ON b.template_id = t.id
                 WHERE {$where_clause}
                 ORDER BY b.{$args['orderby']} {$args['order']}
                 LIMIT %d OFFSET %d",
                array_merge($where_values, array($args['limit'], $args['offset']))
            )
        );

        // Parse JSON fields
        foreach ($briefings as &$briefing) {
            $briefing->variables_json = json_decode($briefing->variables_json, true);
        }

        return $briefings;
    }

    /**
     * Get briefing count for a user
     *
     * @param int $user_id User ID
     * @param string $status Optional status filter
     * @param string $demo_code Optional demo code filter
     * @return int Count
     */
    public function get_user_briefings_count($user_id = null, $status = null, $demo_code = null) {
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
                "SELECT COUNT(*) FROM {$this->table_briefings} WHERE {$where}",
                ...$where_values
            )
        );

        return (int) $count;
    }

    /**
     * Delete a briefing
     *
     * @param int $briefing_id Briefing ID
     * @param int $user_id User ID (for security check)
     * @return bool True on success, false on failure
     */
    public function delete_briefing($briefing_id, $user_id = null) {
        global $wpdb;

        if ($user_id === null) {
            $user_id = get_current_user_id();
        }

        $briefing = $this->get_briefing($briefing_id);

        if (!$briefing || (int) $briefing->user_id !== (int) $user_id) {
            return false;
        }

        // Delete all associated sections first (cascade)
        $wpdb->delete(
            $this->table_sections,
            array('briefing_id' => $briefing_id),
            array('%d')
        );

        // Then delete the briefing
        $result = $wpdb->delete(
            $this->table_briefings,
            array(
                'id' => $briefing_id,
                'user_id' => $user_id,
            ),
            array('%d', '%d')
        );

        if ($result === false) {
            error_log('[SMARTBRIEFING] Failed to delete briefing - ' . $wpdb->last_error);
            return false;
        }

        return true;
    }

    // =========================================================================
    // SECTION METHODS
    // =========================================================================

    /**
     * Create a new section
     *
     * @param array $data Section data
     * @return int|false Section ID or false on failure
     */
    public function create_section($data) {
        global $wpdb;

        $defaults = array(
            'briefing_id' => 0,
            'sort_order' => 0,
            'section_title' => '',
            'ai_content' => null,
            'user_notes' => null,
        );

        $data = wp_parse_args($data, $defaults);

        $result = $wpdb->insert(
            $this->table_sections,
            array(
                'briefing_id' => intval($data['briefing_id']),
                'sort_order' => intval($data['sort_order']),
                'section_title' => sanitize_text_field($data['section_title']),
                'ai_content' => $data['ai_content'],
                'user_notes' => $data['user_notes'],
            ),
            array('%d', '%d', '%s', '%s', '%s')
        );

        if ($result === false) {
            error_log('[SMARTBRIEFING] Failed to create section - ' . $wpdb->last_error);
            return false;
        }

        return $wpdb->insert_id;
    }

    /**
     * Create multiple sections for a briefing
     *
     * @param int $briefing_id Briefing ID
     * @param array $sections Array of section data
     * @return array Array of created section IDs
     */
    public function create_sections($briefing_id, $sections) {
        $created_ids = array();

        foreach ($sections as $index => $section) {
            $section['briefing_id'] = $briefing_id;
            $section['sort_order'] = isset($section['sort_order']) ? $section['sort_order'] : $index;

            $section_id = $this->create_section($section);
            if ($section_id) {
                $created_ids[] = $section_id;
            }
        }

        return $created_ids;
    }

    /**
     * Get a section by ID
     *
     * @param int $section_id Section ID
     * @return object|null Section object or null
     */
    public function get_section($section_id) {
        global $wpdb;

        return $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$this->table_sections} WHERE id = %d",
                $section_id
            )
        );
    }

    /**
     * Get all sections for a briefing
     *
     * @param int $briefing_id Briefing ID
     * @return array Array of section objects
     */
    public function get_briefing_sections($briefing_id) {
        global $wpdb;

        return $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM {$this->table_sections}
                 WHERE briefing_id = %d
                 ORDER BY sort_order ASC",
                $briefing_id
            )
        );
    }

    /**
     * Update a section
     *
     * @param int $section_id Section ID
     * @param array $data Data to update
     * @return bool True on success, false on failure
     */
    public function update_section($section_id, $data) {
        global $wpdb;

        $update_data = array();
        $update_format = array();

        $allowed_fields = array(
            'sort_order', 'section_title', 'ai_content', 'user_notes'
        );

        foreach ($allowed_fields as $field) {
            if (isset($data[$field])) {
                $value = $data[$field];

                // Sanitize title
                if ($field === 'section_title') {
                    $value = sanitize_text_field($value);
                }

                $update_data[$field] = $value;
                $update_format[] = ($field === 'sort_order') ? '%d' : '%s';
            }
        }

        if (empty($update_data)) {
            return false;
        }

        $result = $wpdb->update(
            $this->table_sections,
            $update_data,
            array('id' => $section_id),
            $update_format,
            array('%d')
        );

        if ($result === false) {
            error_log('[SMARTBRIEFING] Failed to update section - ' . $wpdb->last_error);
            return false;
        }

        return true;
    }

    /**
     * Delete a section
     *
     * @param int $section_id Section ID
     * @return bool True on success, false on failure
     */
    public function delete_section($section_id) {
        global $wpdb;

        $result = $wpdb->delete(
            $this->table_sections,
            array('id' => $section_id),
            array('%d')
        );

        if ($result === false) {
            error_log('[SMARTBRIEFING] Failed to delete section - ' . $wpdb->last_error);
            return false;
        }

        return true;
    }

    /**
     * Get table names
     */
    public function get_table_templates() {
        return $this->table_templates;
    }

    public function get_table_briefings() {
        return $this->table_briefings;
    }

    public function get_table_sections() {
        return $this->table_sections;
    }
}
