<?php
/**
 * Database Management Class
 *
 * Handles all database operations for the Bewerbungstrainer plugin
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

class Bewerbungstrainer_Database {

    /**
     * Instance of this class
     */
    private static $instance = null;

    /**
     * Table name for training sessions
     */
    private $table_sessions;

    /**
     * Table name for document uploads
     */
    private $table_documents;

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
        $this->table_sessions = $wpdb->prefix . 'bewerbungstrainer_sessions';
        $this->table_documents = $wpdb->prefix . 'bewerbungstrainer_documents';
    }

    /**
     * Create database tables
     */
    public static function create_tables() {
        global $wpdb;

        $charset_collate = $wpdb->get_charset_collate();
        $table_sessions = $wpdb->prefix . 'bewerbungstrainer_sessions';

        $sql = "CREATE TABLE IF NOT EXISTS $table_sessions (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            user_id bigint(20) UNSIGNED NOT NULL DEFAULT 0,
            user_name varchar(255) DEFAULT NULL,
            session_id varchar(255) NOT NULL,
            position varchar(255) NOT NULL,
            company varchar(255) NOT NULL,
            conversation_id varchar(255) DEFAULT NULL,
            audio_filename varchar(255) DEFAULT NULL,
            audio_url text DEFAULT NULL,
            transcript longtext DEFAULT NULL,
            feedback_json longtext DEFAULT NULL,
            audio_analysis_json longtext DEFAULT NULL,
            created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY user_id (user_id),
            KEY session_id (session_id),
            KEY created_at (created_at)
        ) $charset_collate;";

        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);

        // Create documents table
        $table_documents = $wpdb->prefix . 'bewerbungstrainer_documents';

        $sql_documents = "CREATE TABLE IF NOT EXISTS $table_documents (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            user_id bigint(20) UNSIGNED NOT NULL,
            document_type enum('cv', 'cover_letter') NOT NULL,
            filename varchar(255) NOT NULL,
            file_url text NOT NULL,
            file_path text NOT NULL,
            feedback_json longtext DEFAULT NULL,
            overall_rating decimal(3,1) DEFAULT NULL,
            created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY user_id (user_id),
            KEY document_type (document_type),
            KEY created_at (created_at)
        ) $charset_collate;";

        dbDelta($sql_documents);

        // Update version - 1.2.0 adds user_name column for guest users
        update_option('bewerbungstrainer_db_version', '1.2.0');
    }

    /**
     * Create a new training session
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
            'position' => '',
            'company' => '',
            'conversation_id' => null,
            'audio_filename' => null,
            'audio_url' => null,
            'transcript' => null,
            'feedback_json' => null,
            'audio_analysis_json' => null,
        );

        $data = wp_parse_args($data, $defaults);

        $result = $wpdb->insert(
            $this->table_sessions,
            array(
                'user_id' => $data['user_id'],
                'user_name' => sanitize_text_field($data['user_name']),
                'session_id' => $data['session_id'],
                'position' => sanitize_text_field($data['position']),
                'company' => sanitize_text_field($data['company']),
                'conversation_id' => sanitize_text_field($data['conversation_id']),
                'audio_filename' => sanitize_file_name($data['audio_filename']),
                'audio_url' => esc_url_raw($data['audio_url']),
                'transcript' => wp_kses_post($data['transcript']),
                'feedback_json' => $data['feedback_json'],
                'audio_analysis_json' => $data['audio_analysis_json'],
            ),
            array('%d', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s')
        );

        if ($result === false) {
            error_log('Bewerbungstrainer: Failed to create session - ' . $wpdb->last_error);
            return false;
        }

        return $wpdb->insert_id;
    }

    /**
     * Update a training session
     *
     * @param int $session_id Session ID
     * @param array $data Data to update
     * @return bool True on success, false on failure
     */
    public function update_session($session_id, $data) {
        global $wpdb;

        // Sanitize data
        $update_data = array();
        $update_format = array();

        if (isset($data['position'])) {
            $update_data['position'] = sanitize_text_field($data['position']);
            $update_format[] = '%s';
        }

        if (isset($data['company'])) {
            $update_data['company'] = sanitize_text_field($data['company']);
            $update_format[] = '%s';
        }

        if (isset($data['conversation_id'])) {
            $update_data['conversation_id'] = sanitize_text_field($data['conversation_id']);
            $update_format[] = '%s';
        }

        if (isset($data['audio_filename'])) {
            $update_data['audio_filename'] = sanitize_file_name($data['audio_filename']);
            $update_format[] = '%s';
        }

        if (isset($data['audio_url'])) {
            $update_data['audio_url'] = esc_url_raw($data['audio_url']);
            $update_format[] = '%s';
        }

        if (isset($data['transcript'])) {
            $update_data['transcript'] = wp_kses_post($data['transcript']);
            $update_format[] = '%s';
        }

        if (isset($data['feedback_json'])) {
            $update_data['feedback_json'] = $data['feedback_json'];
            $update_format[] = '%s';
        }

        if (isset($data['audio_analysis_json'])) {
            $update_data['audio_analysis_json'] = $data['audio_analysis_json'];
            $update_format[] = '%s';
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
            error_log('Bewerbungstrainer: Failed to update session - ' . $wpdb->last_error);
            return false;
        }

        return true;
    }

    /**
     * Get a training session by ID
     *
     * @param int $session_id Session ID
     * @return object|null Session data or null if not found
     */
    public function get_session($session_id) {
        global $wpdb;

        $session = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$this->table_sessions} WHERE id = %d",
                $session_id
            )
        );

        return $session;
    }

    /**
     * Get a training session by session ID (UUID)
     *
     * @param string $session_uuid Session UUID
     * @return object|null Session data or null if not found
     */
    public function get_session_by_uuid($session_uuid) {
        global $wpdb;

        $session = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$this->table_sessions} WHERE session_id = %s",
                $session_uuid
            )
        );

        return $session;
    }

    /**
     * Get all training sessions for a user
     *
     * @param int $user_id User ID (default: current user)
     * @param array $args Query arguments (limit, offset, orderby, order)
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
        );

        $args = wp_parse_args($args, $defaults);

        // Validate orderby
        $allowed_orderby = array('id', 'created_at', 'updated_at', 'position', 'company');
        if (!in_array($args['orderby'], $allowed_orderby)) {
            $args['orderby'] = 'created_at';
        }

        // Validate order
        $args['order'] = strtoupper($args['order']) === 'ASC' ? 'ASC' : 'DESC';

        $sessions = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM {$this->table_sessions}
                WHERE user_id = %d
                ORDER BY {$args['orderby']} {$args['order']}
                LIMIT %d OFFSET %d",
                $user_id,
                $args['limit'],
                $args['offset']
            )
        );

        return $sessions;
    }

    /**
     * Get total count of sessions for a user
     *
     * @param int $user_id User ID (default: current user)
     * @return int Total count
     */
    public function get_user_sessions_count($user_id = null) {
        global $wpdb;

        if ($user_id === null) {
            $user_id = get_current_user_id();
        }

        $count = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COUNT(*) FROM {$this->table_sessions} WHERE user_id = %d",
                $user_id
            )
        );

        return (int) $count;
    }

    /**
     * Delete a training session
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

        // Get session to check ownership and get audio file
        $session = $this->get_session($session_id);

        if (!$session || (int) $session->user_id !== (int) $user_id) {
            return false;
        }

        // Delete audio file if exists
        if (!empty($session->audio_filename)) {
            $audio_handler = Bewerbungstrainer_Audio_Handler::get_instance();
            $audio_handler->delete_audio($session->audio_filename);
        }

        // Delete from database
        $result = $wpdb->delete(
            $this->table_sessions,
            array(
                'id' => $session_id,
                'user_id' => $user_id,
            ),
            array('%d', '%d')
        );

        if ($result === false) {
            error_log('Bewerbungstrainer: Failed to delete session - ' . $wpdb->last_error);
            return false;
        }

        return true;
    }

    /**
     * Get table name
     *
     * @return string Table name
     */
    public function get_table_name() {
        return $this->table_sessions;
    }

    /**
     * Get all training sessions (for admin)
     *
     * @param array $args Query arguments (limit, offset, orderby, order)
     * @return array Array of session objects
     */
    public function get_all_sessions($args = array()) {
        global $wpdb;

        $defaults = array(
            'limit' => 50,
            'offset' => 0,
            'orderby' => 'created_at',
            'order' => 'DESC',
        );

        $args = wp_parse_args($args, $defaults);

        // Validate orderby
        $allowed_orderby = array('id', 'created_at', 'updated_at', 'position', 'company', 'user_name');
        if (!in_array($args['orderby'], $allowed_orderby)) {
            $args['orderby'] = 'created_at';
        }

        // Validate order
        $args['order'] = strtoupper($args['order']) === 'ASC' ? 'ASC' : 'DESC';

        $sessions = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM {$this->table_sessions}
                ORDER BY {$args['orderby']} {$args['order']}
                LIMIT %d OFFSET %d",
                $args['limit'],
                $args['offset']
            )
        );

        return $sessions;
    }

    /**
     * Get total count of all sessions (for admin)
     *
     * @return int Total count
     */
    public function get_all_sessions_count() {
        global $wpdb;

        $count = $wpdb->get_var(
            "SELECT COUNT(*) FROM {$this->table_sessions}"
        );

        return (int) $count;
    }

    /**
     * Create a new document
     *
     * @param array $data Document data
     * @return int|false Document ID or false on failure
     */
    public function create_document($data) {
        global $wpdb;

        $defaults = array(
            'user_id' => get_current_user_id(),
            'document_type' => 'cv',
            'filename' => '',
            'file_url' => '',
            'file_path' => '',
            'feedback_json' => null,
            'overall_rating' => null,
        );

        $data = wp_parse_args($data, $defaults);

        $result = $wpdb->insert(
            $this->table_documents,
            array(
                'user_id' => $data['user_id'],
                'document_type' => $data['document_type'],
                'filename' => sanitize_file_name($data['filename']),
                'file_url' => esc_url_raw($data['file_url']),
                'file_path' => sanitize_text_field($data['file_path']),
                'feedback_json' => $data['feedback_json'],
                'overall_rating' => $data['overall_rating'],
            ),
            array('%d', '%s', '%s', '%s', '%s', '%s', '%f')
        );

        if ($result === false) {
            error_log('Bewerbungstrainer: Failed to create document - ' . $wpdb->last_error);
            return false;
        }

        return $wpdb->insert_id;
    }

    /**
     * Update a document
     *
     * @param int $document_id Document ID
     * @param array $data Data to update
     * @return bool True on success, false on failure
     */
    public function update_document($document_id, $data) {
        global $wpdb;

        $update_data = array();
        $update_format = array();

        if (isset($data['feedback_json'])) {
            $update_data['feedback_json'] = $data['feedback_json'];
            $update_format[] = '%s';
        }

        if (isset($data['overall_rating'])) {
            $update_data['overall_rating'] = $data['overall_rating'];
            $update_format[] = '%f';
        }

        if (empty($update_data)) {
            return false;
        }

        $result = $wpdb->update(
            $this->table_documents,
            $update_data,
            array('id' => $document_id),
            $update_format,
            array('%d')
        );

        if ($result === false) {
            error_log('Bewerbungstrainer: Failed to update document - ' . $wpdb->last_error);
            return false;
        }

        return true;
    }

    /**
     * Get a document by ID
     *
     * @param int $document_id Document ID
     * @return object|null Document data or null if not found
     */
    public function get_document($document_id) {
        global $wpdb;

        $document = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$this->table_documents} WHERE id = %d",
                $document_id
            )
        );

        return $document;
    }

    /**
     * Get all documents for a user
     *
     * @param int $user_id User ID (default: current user)
     * @param array $args Query arguments
     * @return array Array of document objects
     */
    public function get_user_documents($user_id = null, $args = array()) {
        global $wpdb;

        if ($user_id === null) {
            $user_id = get_current_user_id();
        }

        $defaults = array(
            'limit' => 50,
            'offset' => 0,
            'document_type' => null,
            'orderby' => 'created_at',
            'order' => 'DESC',
        );

        $args = wp_parse_args($args, $defaults);

        // Validate orderby
        $allowed_orderby = array('id', 'created_at', 'updated_at', 'overall_rating');
        if (!in_array($args['orderby'], $allowed_orderby)) {
            $args['orderby'] = 'created_at';
        }

        // Validate order
        $args['order'] = strtoupper($args['order']) === 'ASC' ? 'ASC' : 'DESC';

        // Build WHERE clause
        $where = $wpdb->prepare("WHERE user_id = %d", $user_id);
        if ($args['document_type']) {
            $where .= $wpdb->prepare(" AND document_type = %s", $args['document_type']);
        }

        $documents = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM {$this->table_documents}
                {$where}
                ORDER BY {$args['orderby']} {$args['order']}
                LIMIT %d OFFSET %d",
                $args['limit'],
                $args['offset']
            )
        );

        return $documents;
    }

    /**
     * Get total count of documents for a user
     *
     * @param int $user_id User ID (default: current user)
     * @param string $document_type Optional document type filter
     * @return int Total count
     */
    public function get_user_documents_count($user_id = null, $document_type = null) {
        global $wpdb;

        if ($user_id === null) {
            $user_id = get_current_user_id();
        }

        $where = $wpdb->prepare("WHERE user_id = %d", $user_id);
        if ($document_type) {
            $where .= $wpdb->prepare(" AND document_type = %s", $document_type);
        }

        $count = $wpdb->get_var(
            "SELECT COUNT(*) FROM {$this->table_documents} {$where}"
        );

        return (int) $count;
    }

    /**
     * Delete a document
     *
     * @param int $document_id Document ID
     * @param int $user_id User ID (for security check)
     * @return bool True on success, false on failure
     */
    public function delete_document($document_id, $user_id = null) {
        global $wpdb;

        if ($user_id === null) {
            $user_id = get_current_user_id();
        }

        // Get document to check ownership and get file
        $document = $this->get_document($document_id);

        if (!$document || (int) $document->user_id !== (int) $user_id) {
            return false;
        }

        // Delete file if exists
        if (!empty($document->file_path) && file_exists($document->file_path)) {
            wp_delete_file($document->file_path);
        }

        // Delete from database
        $result = $wpdb->delete(
            $this->table_documents,
            array(
                'id' => $document_id,
                'user_id' => $user_id,
            ),
            array('%d', '%d')
        );

        if ($result === false) {
            error_log('Bewerbungstrainer: Failed to delete document - ' . $wpdb->last_error);
            return false;
        }

        return true;
    }
}
