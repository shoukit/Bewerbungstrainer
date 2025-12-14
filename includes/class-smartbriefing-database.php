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

        // Check if tables exist, create if not
        $this->maybe_create_tables();
    }

    /**
     * Check if tables exist and create them if not
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
        }
    }

    /**
     * Create smartbriefing database tables
     */
    public static function create_tables() {
        global $wpdb;

        $charset_collate = $wpdb->get_charset_collate();

        // Templates table - stores configurable briefing templates
        $table_templates = $wpdb->prefix . 'bewerbungstrainer_smartbriefing_templates';
        $sql_templates = "CREATE TABLE IF NOT EXISTS `$table_templates` (
            `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            `title` varchar(255) NOT NULL,
            `description` text DEFAULT NULL,
            `icon` varchar(50) DEFAULT 'file-text',
            `category` varchar(100) DEFAULT 'CAREER',
            `system_prompt` longtext NOT NULL,
            `variables_schema` longtext NOT NULL,
            `is_active` tinyint(1) DEFAULT 1,
            `sort_order` int DEFAULT 0,
            `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
            `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            KEY `is_active` (`is_active`),
            KEY `category` (`category`),
            KEY `sort_order` (`sort_order`)
        ) $charset_collate;";

        // Briefings table - stores user-generated briefings
        $table_briefings = $wpdb->prefix . 'bewerbungstrainer_smartbriefing_briefings';
        $sql_briefings = "CREATE TABLE IF NOT EXISTS `$table_briefings` (
            `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            `user_id` bigint(20) UNSIGNED NOT NULL DEFAULT 0,
            `user_name` varchar(255) DEFAULT NULL,
            `template_id` bigint(20) UNSIGNED NOT NULL,
            `briefing_uuid` varchar(36) NOT NULL,
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

        // Execute queries directly
        $wpdb->query($sql_templates);
        $wpdb->query($sql_briefings);

        // Log any errors
        if ($wpdb->last_error) {
            error_log('[SMARTBRIEFING] Database error: ' . $wpdb->last_error);
        } else {
            error_log('[SMARTBRIEFING] Tables created successfully');
        }

        // Insert default templates if table is empty
        self::insert_default_templates();

        // Update version
        update_option('bewerbungstrainer_smartbriefing_db_version', '1.0.0');
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
     * Get all active templates
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

        $where_clause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

        // Validate orderby
        $allowed_orderby = array('id', 'title', 'sort_order', 'created_at', 'category');
        if (!in_array($args['orderby'], $allowed_orderby)) {
            $args['orderby'] = 'sort_order';
        }

        $args['order'] = strtoupper($args['order']) === 'DESC' ? 'DESC' : 'ASC';

        $query = "SELECT * FROM {$this->table_templates} {$where_clause} ORDER BY {$args['orderby']} {$args['order']}";

        if (!empty($where_values)) {
            $templates = $wpdb->get_results($wpdb->prepare($query, ...$where_values));
        } else {
            $templates = $wpdb->get_results($query);
        }

        // Parse JSON fields
        foreach ($templates as &$template) {
            $template->variables_schema = json_decode($template->variables_schema, true);
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
            'system_prompt' => '',
            'variables_schema' => '[]',
            'is_active' => 1,
            'sort_order' => 0,
        );

        $data = wp_parse_args($data, $defaults);

        // Ensure variables_schema is JSON string
        if (is_array($data['variables_schema'])) {
            $data['variables_schema'] = json_encode($data['variables_schema']);
        }

        $result = $wpdb->insert(
            $this->table_templates,
            array(
                'title' => sanitize_text_field($data['title']),
                'description' => sanitize_textarea_field($data['description']),
                'icon' => sanitize_text_field($data['icon']),
                'category' => sanitize_text_field($data['category']),
                'system_prompt' => $data['system_prompt'],
                'variables_schema' => $data['variables_schema'],
                'is_active' => intval($data['is_active']),
                'sort_order' => intval($data['sort_order']),
            ),
            array('%s', '%s', '%s', '%s', '%s', '%s', '%d', '%d')
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
            'title', 'description', 'icon', 'category',
            'system_prompt', 'variables_schema', 'is_active', 'sort_order'
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
                if (in_array($field, array('is_active', 'sort_order'))) {
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
     * @return bool True on success, false on failure
     */
    public function delete_template($template_id) {
        global $wpdb;

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
                'variables_json' => $data['variables_json'],
                'content_markdown' => $data['content_markdown'],
                'status' => $data['status'],
                'demo_code' => $data['demo_code'] ? strtoupper(sanitize_text_field($data['demo_code'])) : null,
            ),
            array('%d', '%s', '%d', '%s', '%s', '%s', '%s', '%s')
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
            'variables_json', 'content_markdown', 'status'
        );

        foreach ($allowed_fields as $field) {
            if (isset($data[$field])) {
                $value = $data[$field];

                // Convert arrays to JSON
                if ($field === 'variables_json' && is_array($value)) {
                    $value = json_encode($value);
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

    /**
     * Get table names
     */
    public function get_table_templates() {
        return $this->table_templates;
    }

    public function get_table_briefings() {
        return $this->table_briefings;
    }
}
