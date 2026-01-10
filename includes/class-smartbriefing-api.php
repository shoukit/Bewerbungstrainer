<?php
/**
 * SmartBriefing REST API Class
 *
 * Handles all REST API endpoints for the Smart Briefing feature
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

class Bewerbungstrainer_SmartBriefing_API {

    use Bewerbungstrainer_API_Utils;

    /**
     * Instance of this class
     */
    private static $instance = null;

    /**
     * API namespace
     */
    private $namespace = 'bewerbungstrainer/v1';

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

        add_action('rest_api_init', array($this, 'register_routes'));
    }

    /**
     * Register REST API routes
     */
    public function register_routes() {
        // ===== Template Endpoints =====

        // Get all templates
        register_rest_route($this->namespace, '/smartbriefing/templates', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_templates'),
            'permission_callback' => array($this, 'allow_all_users'),
        ));

        // Get specific template
        register_rest_route($this->namespace, '/smartbriefing/templates/(?P<id>\d+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_template'),
            'permission_callback' => array($this, 'allow_all_users'),
        ));

        // Create custom template (user-created)
        register_rest_route($this->namespace, '/smartbriefing/templates', array(
            'methods' => 'POST',
            'callback' => array($this, 'create_template'),
            'permission_callback' => array($this, 'allow_all_users'), // Allow demo users too
        ));

        // Update custom template
        register_rest_route($this->namespace, '/smartbriefing/templates/(?P<id>\d+)', array(
            'methods' => 'PUT',
            'callback' => array($this, 'update_template'),
            'permission_callback' => array($this, 'allow_all_users'),
        ));

        // Delete custom template
        register_rest_route($this->namespace, '/smartbriefing/templates/(?P<id>\d+)', array(
            'methods' => 'DELETE',
            'callback' => array($this, 'delete_template'),
            'permission_callback' => array($this, 'allow_all_users'),
        ));

        // ===== Briefing Endpoints =====

        // Generate briefing (create and generate content in one call)
        register_rest_route($this->namespace, '/smartbriefing/generate', array(
            'methods' => 'POST',
            'callback' => array($this, 'generate_briefing'),
            'permission_callback' => array($this, 'allow_all_users'),
        ));

        // Get all briefings for user
        register_rest_route($this->namespace, '/smartbriefing/briefings', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_briefings'),
            'permission_callback' => array($this, 'check_user_logged_in'),
        ));

        // Get specific briefing
        register_rest_route($this->namespace, '/smartbriefing/briefings/(?P<id>\d+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_briefing'),
            'permission_callback' => array($this, 'allow_all_users'),
        ));

        // Update briefing (for renaming title)
        register_rest_route($this->namespace, '/smartbriefing/briefings/(?P<id>\d+)', array(
            'methods' => 'PUT',
            'callback' => array($this, 'update_briefing'),
            'permission_callback' => array($this, 'check_user_logged_in'),
        ));

        // Delete briefing
        register_rest_route($this->namespace, '/smartbriefing/briefings/(?P<id>\d+)', array(
            'methods' => 'DELETE',
            'callback' => array($this, 'delete_briefing'),
            'permission_callback' => array($this, 'check_user_logged_in'),
        ));

        // ===== Section Endpoints =====

        // Update section (for user notes)
        register_rest_route($this->namespace, '/smartbriefing/sections/(?P<id>\d+)', array(
            'methods' => 'PATCH',
            'callback' => array($this, 'update_section'),
            'permission_callback' => array($this, 'check_user_logged_in'),
        ));

        // Update item within a section (for per-item notes and deletion)
        register_rest_route($this->namespace, '/smartbriefing/sections/(?P<section_id>\d+)/items/(?P<item_id>[a-f0-9-]+)', array(
            'methods' => 'PATCH',
            'callback' => array($this, 'update_section_item'),
            'permission_callback' => array($this, 'check_user_logged_in'),
        ));

        // Generate more items for a section
        register_rest_route($this->namespace, '/smartbriefing/sections/(?P<section_id>\d+)/generate-more', array(
            'methods' => 'POST',
            'callback' => array($this, 'generate_more_items'),
            'permission_callback' => array($this, 'check_user_logged_in'),
        ));

        // Ask AI about a specific item (explain, examples, how-to, or custom question)
        register_rest_route($this->namespace, '/smartbriefing/sections/(?P<section_id>\d+)/items/(?P<item_id>[a-f0-9-]+)/ask', array(
            'methods' => 'POST',
            'callback' => array($this, 'ask_item'),
            'permission_callback' => array($this, 'check_user_logged_in'),
        ));

        // Delete an AI explanation from an item
        register_rest_route($this->namespace, '/smartbriefing/sections/(?P<section_id>\d+)/items/(?P<item_id>[a-f0-9-]+)/explanations/(?P<explanation_id>[a-f0-9-]+)', array(
            'methods' => 'DELETE',
            'callback' => array($this, 'delete_item_explanation'),
            'permission_callback' => array($this, 'check_user_logged_in'),
        ));

        // ===== PDF Export Endpoint =====

        // Export briefing as PDF
        register_rest_route($this->namespace, '/smartbriefing/briefings/(?P<id>\d+)/pdf', array(
            'methods' => 'GET',
            'callback' => array($this, 'export_briefing_pdf'),
            'permission_callback' => array($this, 'check_user_logged_in'),
        ));
    }

    // Note: Permission callbacks (check_user_logged_in, allow_all_users, etc.)
    // are provided by Bewerbungstrainer_API_Utils trait

    // =========================================================================
    // TEMPLATE ENDPOINTS
    // =========================================================================

    /**
     * Get all templates (system + user's own custom templates)
     */
    public function get_templates($request) {
        $params = $request->get_params();

        $args = array(
            'category' => isset($params['category']) ? $params['category'] : null,
            'is_active' => 1,
            'user_id' => get_current_user_id(),
            'demo_code' => isset($params['demo_code']) ? $params['demo_code'] : null,
            'include_user_templates' => true,
        );

        $templates = $this->db->get_templates($args);

        // Format for frontend
        $formatted = array_map(function($template) {
            return array(
                'id' => (int) $template->id,
                'title' => $template->title,
                'description' => $template->description,
                'icon' => $template->icon,
                'category' => Bewerbungstrainer_Categories_Admin::get_categories_array($template->category),
                'target_audience' => $template->target_audience ?? '',
                'variables_schema' => $template->variables_schema,
                'is_custom' => !empty($template->is_custom),
                'system_prompt' => !empty($template->is_custom) ? $template->system_prompt : null, // Only expose for custom templates
                'allow_custom_variables' => !empty($template->allow_custom_variables),
            );
        }, $templates);

        return new WP_REST_Response(array(
            'success' => true,
            'data' => array('templates' => $formatted),
        ), 200);
    }

    /**
     * Get specific template
     */
    public function get_template($request) {
        $template_id = intval($request['id']);
        $template = $this->db->get_template($template_id);

        if (!$template) {
            return new WP_Error(
                'not_found',
                __('Template nicht gefunden.', 'bewerbungstrainer'),
                array('status' => 404)
            );
        }

        $user_id = get_current_user_id();
        $params = $request->get_params();
        $demo_code = isset($params['demo_code']) ? $params['demo_code'] : null;

        // Check if user can access this template
        $is_owner = $this->db->user_owns_template($template, $user_id, $demo_code);
        $is_system = empty($template->user_id) && empty($template->demo_code);

        return new WP_REST_Response(array(
            'success' => true,
            'data' => array(
                'id' => (int) $template->id,
                'title' => $template->title,
                'description' => $template->description,
                'icon' => $template->icon,
                'category' => Bewerbungstrainer_Categories_Admin::get_categories_array($template->category),
                'variables_schema' => $template->variables_schema,
                'is_custom' => !$is_system,
                'system_prompt' => ($is_owner || $is_system) ? $template->system_prompt : null,
                'allow_custom_variables' => !empty($template->allow_custom_variables),
            ),
        ), 200);
    }

    /**
     * Create a custom template (user-created)
     */
    public function create_template($request) {
        $params = $request->get_json_params();

        if (empty($params)) {
            $params = $request->get_params();
        }

        // Validate required fields
        if (empty($params['title'])) {
            return new WP_Error(
                'missing_fields',
                __('Titel ist erforderlich.', 'bewerbungstrainer'),
                array('status' => 400)
            );
        }

        if (empty($params['system_prompt'])) {
            return new WP_Error(
                'missing_fields',
                __('System Prompt ist erforderlich.', 'bewerbungstrainer'),
                array('status' => 400)
            );
        }

        // Get user identification
        $user_id = get_current_user_id();
        $demo_code = isset($params['demo_code']) ? strtoupper(sanitize_text_field($params['demo_code'])) : null;

        // Require either logged-in user or demo code
        if (!$user_id && empty($demo_code)) {
            return new WP_Error(
                'unauthorized',
                __('Du musst angemeldet sein oder einen Demo-Code verwenden.', 'bewerbungstrainer'),
                array('status' => 401)
            );
        }

        // Prepare template data
        $template_data = array(
            'title' => sanitize_text_field($params['title']),
            'description' => isset($params['description']) ? sanitize_textarea_field($params['description']) : '',
            'icon' => isset($params['icon']) ? sanitize_text_field($params['icon']) : 'file-text',
            'category' => 'MEINE', // Always set to MEINE for custom templates
            'system_prompt' => $params['system_prompt'], // Don't over-sanitize the prompt
            'ai_role' => isset($params['ai_role']) ? $params['ai_role'] : '',
            'ai_task' => isset($params['ai_task']) ? $params['ai_task'] : '',
            'ai_behavior' => isset($params['ai_behavior']) ? $params['ai_behavior'] : '',
            'variables_schema' => isset($params['variables_schema']) ? $params['variables_schema'] : array(),
            'allow_custom_variables' => !empty($params['allow_user_variables']) ? 1 : 0,
            'is_active' => 1,
            'sort_order' => 0,
            'user_id' => $user_id ?: null,
            'demo_code' => $demo_code,
        );

        $template_id = $this->db->create_template($template_data);

        if (!$template_id) {
            return new WP_Error(
                'create_failed',
                __('Fehler beim Erstellen des Templates.', 'bewerbungstrainer'),
                array('status' => 500)
            );
        }

        // Get created template
        $template = $this->db->get_template($template_id);

        return new WP_REST_Response(array(
            'success' => true,
            'data' => array(
                'template' => array(
                    'id' => (int) $template->id,
                    'title' => $template->title,
                    'description' => $template->description,
                    'icon' => $template->icon,
                    'category' => Bewerbungstrainer_Categories_Admin::get_categories_array($template->category),
                    'variables_schema' => $template->variables_schema,
                    'system_prompt' => $template->system_prompt,
                    'is_custom' => true,
                ),
            ),
            'message' => __('Template erfolgreich erstellt.', 'bewerbungstrainer'),
        ), 201);
    }

    /**
     * Update a custom template
     */
    public function update_template($request) {
        $template_id = intval($request['id']);
        $params = $request->get_json_params();

        if (empty($params)) {
            $params = $request->get_params();
        }

        // Get template
        $template = $this->db->get_template($template_id);

        if (!$template) {
            return new WP_Error(
                'not_found',
                __('Template nicht gefunden.', 'bewerbungstrainer'),
                array('status' => 404)
            );
        }

        // Verify ownership
        $user_id = get_current_user_id();
        $demo_code = isset($params['demo_code']) ? $params['demo_code'] : null;

        if (!$this->db->user_owns_template($template, $user_id, $demo_code)) {
            return new WP_Error(
                'unauthorized',
                __('Du bist nicht berechtigt, dieses Template zu bearbeiten.', 'bewerbungstrainer'),
                array('status' => 403)
            );
        }

        // Prepare update data
        $update_data = array();

        if (isset($params['title'])) {
            $update_data['title'] = sanitize_text_field($params['title']);
        }

        if (isset($params['description'])) {
            $update_data['description'] = sanitize_textarea_field($params['description']);
        }

        if (isset($params['icon'])) {
            $update_data['icon'] = sanitize_text_field($params['icon']);
        }

        if (isset($params['system_prompt'])) {
            $update_data['system_prompt'] = $params['system_prompt'];
        }

        if (isset($params['ai_role'])) {
            $update_data['ai_role'] = $params['ai_role'];
        }

        if (isset($params['ai_task'])) {
            $update_data['ai_task'] = $params['ai_task'];
        }

        if (isset($params['ai_behavior'])) {
            $update_data['ai_behavior'] = $params['ai_behavior'];
        }

        if (isset($params['variables_schema'])) {
            $update_data['variables_schema'] = $params['variables_schema'];
        }

        if (isset($params['allow_user_variables'])) {
            $update_data['allow_custom_variables'] = !empty($params['allow_user_variables']) ? 1 : 0;
        }

        if (empty($update_data)) {
            return new WP_Error(
                'no_data',
                __('Keine Daten zum Aktualisieren.', 'bewerbungstrainer'),
                array('status' => 400)
            );
        }

        $result = $this->db->update_template($template_id, $update_data);

        if (!$result) {
            return new WP_Error(
                'update_failed',
                __('Fehler beim Aktualisieren des Templates.', 'bewerbungstrainer'),
                array('status' => 500)
            );
        }

        // Get updated template
        $template = $this->db->get_template($template_id);

        return new WP_REST_Response(array(
            'success' => true,
            'data' => array(
                'template' => array(
                    'id' => (int) $template->id,
                    'title' => $template->title,
                    'description' => $template->description,
                    'icon' => $template->icon,
                    'category' => Bewerbungstrainer_Categories_Admin::get_categories_array($template->category),
                    'variables_schema' => $template->variables_schema,
                    'system_prompt' => $template->system_prompt,
                    'is_custom' => true,
                ),
            ),
            'message' => __('Template erfolgreich aktualisiert.', 'bewerbungstrainer'),
        ), 200);
    }

    /**
     * Delete a custom template
     */
    public function delete_template($request) {
        $template_id = intval($request['id']);
        $params = $request->get_params();

        // Get user identification
        $user_id = get_current_user_id();
        $demo_code = isset($params['demo_code']) ? $params['demo_code'] : null;

        $result = $this->db->delete_template($template_id, $user_id, $demo_code);

        if (!$result) {
            return new WP_Error(
                'delete_failed',
                __('Fehler beim Löschen des Templates. Möglicherweise bist du nicht berechtigt.', 'bewerbungstrainer'),
                array('status' => 403)
            );
        }

        return new WP_REST_Response(array(
            'success' => true,
            'message' => __('Template erfolgreich gelöscht.', 'bewerbungstrainer'),
        ), 200);
    }

    // =========================================================================
    // BRIEFING ENDPOINTS
    // =========================================================================

    /**
     * Generate a briefing using Gemini
     */
    public function generate_briefing($request) {
        $params = $request->get_json_params();

        if (empty($params)) {
            $params = $request->get_params();
        }

        // Validate required fields
        if (empty($params['template_id'])) {
            return new WP_Error(
                'missing_fields',
                __('Template ist erforderlich.', 'bewerbungstrainer'),
                array('status' => 400)
            );
        }

        // Verify template exists
        $template = $this->db->get_template($params['template_id']);
        if (!$template) {
            return new WP_Error(
                'invalid_template',
                __('Ungültiges Template.', 'bewerbungstrainer'),
                array('status' => 400)
            );
        }

        // Get API key
        $api_key = get_option('bewerbungstrainer_gemini_api_key', '');
        if (empty($api_key)) {
            return new WP_Error(
                'missing_api_key',
                __('Gemini API Key ist nicht konfiguriert.', 'bewerbungstrainer'),
                array('status' => 500)
            );
        }

        // Get user info
        $user_id = get_current_user_id();
        $variables = isset($params['variables']) ? $params['variables'] : array();

        // Merge custom variables (always allowed)
        $custom_variables = isset($params['custom_variables']) ? $params['custom_variables'] : array();
        if (!empty($custom_variables) && is_array($custom_variables)) {
            // Custom variables take precedence
            $variables = array_merge($variables, $custom_variables);
            error_log('[SMARTBRIEFING] Custom variables added: ' . json_encode(array_keys($custom_variables)));
        }

        // Generate title from variables or date
        $briefing_title = $this->generate_briefing_title($template, $variables);

        // Create briefing record first
        $briefing_data = array(
            'user_id' => $user_id,
            'user_name' => isset($params['user_name']) ? $params['user_name'] : null,
            'template_id' => $params['template_id'],
            'title' => $briefing_title,
            'variables_json' => $variables,
            'status' => 'generating',
            'demo_code' => isset($params['demo_code']) ? strtoupper(sanitize_text_field($params['demo_code'])) : null,
        );

        $briefing_id = $this->db->create_briefing($briefing_data);

        if (!$briefing_id) {
            return new WP_Error(
                'create_failed',
                __('Fehler beim Erstellen des Briefings.', 'bewerbungstrainer'),
                array('status' => 500)
            );
        }

        // Build prompt using structured fields (includes all variables in User-Daten section)
        $system_prompt = $this->build_structured_prompt($template, $variables);

        // Build full prompt requesting JSON output
        $full_prompt = $this->build_briefing_prompt_json($system_prompt, $variables, $template->title);

        // Log prompt
        if (function_exists('bewerbungstrainer_log_prompt')) {
            bewerbungstrainer_log_prompt(
                'SMARTBRIEFING_GENERATE',
                'Smart Briefing: Generierung eines maßgeschneiderten Briefings basierend auf Template und Benutzervariablen.',
                $full_prompt,
                array(
                    'Template' => $template->title,
                    'Template-ID' => $template->id,
                    'Variablen' => $variables,
                    'Briefing-ID' => $briefing_id,
                )
            );
        }

        // Call Gemini API
        $response = $this->call_gemini_api($full_prompt, $api_key);

        if (is_wp_error($response)) {
            // Update briefing status to failed
            $this->db->update_briefing($briefing_id, array(
                'status' => 'failed',
                'content_markdown' => 'Fehler bei der Generierung: ' . $response->get_error_message(),
            ));

            // Log error response
            if (function_exists('bewerbungstrainer_log_response')) {
                bewerbungstrainer_log_response('SMARTBRIEFING_GENERATE', $response->get_error_message(), true);
            }

            return $response;
        }

        // Log successful response
        if (function_exists('bewerbungstrainer_log_response')) {
            bewerbungstrainer_log_response('SMARTBRIEFING_GENERATE', $response);
        }

        // Parse JSON response and create sections
        $sections_data = $this->parse_sections_response($response);

        if (is_wp_error($sections_data)) {
            // Fallback: Store raw response as markdown
            error_log('[SMARTBRIEFING] Failed to parse JSON, using raw response');
            $this->db->update_briefing($briefing_id, array(
                'content_markdown' => $response,
                'status' => 'completed',
            ));
        } else {
            // Create sections in database
            $this->db->create_sections($briefing_id, $sections_data);

            // Also store full markdown for backward compatibility
            $full_markdown = $this->sections_to_markdown($sections_data);
            $this->db->update_briefing($briefing_id, array(
                'content_markdown' => $full_markdown,
                'status' => 'completed',
            ));
        }

        // Get updated briefing with sections
        $briefing = $this->db->get_briefing($briefing_id);
        $sections = $this->db->get_briefing_sections($briefing_id);

        return new WP_REST_Response(array(
            'success' => true,
            'data' => array(
                'briefing' => $this->format_briefing($briefing, $sections),
            ),
        ), 201);
    }

    /**
     * Get all briefings for user
     */
    public function get_briefings($request) {
        $params = $request->get_params();

        $args = array(
            'limit' => isset($params['limit']) ? intval($params['limit']) : 50,
            'offset' => isset($params['offset']) ? intval($params['offset']) : 0,
            'status' => isset($params['status']) ? $params['status'] : null,
            'template_id' => isset($params['template_id']) ? intval($params['template_id']) : null,
            'demo_code' => isset($params['demo_code']) ? $params['demo_code'] : null,
        );

        $briefings = $this->db->get_user_briefings(get_current_user_id(), $args);
        $total = $this->db->get_user_briefings_count(get_current_user_id(), $args['status'], $args['demo_code']);

        $formatted = array_map(array($this, 'format_briefing'), $briefings);

        return new WP_REST_Response(array(
            'success' => true,
            'data' => array(
                'briefings' => $formatted,
                'pagination' => array(
                    'total' => $total,
                    'limit' => $args['limit'],
                    'offset' => $args['offset'],
                ),
            ),
        ), 200);
    }

    /**
     * Get specific briefing with sections
     */
    public function get_briefing($request) {
        $briefing_id = intval($request['id']);
        $briefing = $this->db->get_briefing($briefing_id);

        if (!$briefing) {
            return new WP_Error(
                'not_found',
                __('Briefing nicht gefunden.', 'bewerbungstrainer'),
                array('status' => 404)
            );
        }

        // Get sections for this briefing
        $sections = $this->db->get_briefing_sections($briefing_id);

        return new WP_REST_Response(array(
            'success' => true,
            'data' => array(
                'briefing' => $this->format_briefing($briefing, $sections),
            ),
        ), 200);
    }

    /**
     * Update a section (user notes)
     */
    public function update_section($request) {
        $section_id = intval($request['id']);
        $params = $request->get_json_params();

        if (empty($params)) {
            $params = $request->get_params();
        }

        // Get the section
        $section = $this->db->get_section($section_id);

        if (!$section) {
            return new WP_Error(
                'not_found',
                __('Section nicht gefunden.', 'bewerbungstrainer'),
                array('status' => 404)
            );
        }

        // Verify user owns this briefing
        $briefing = $this->db->get_briefing($section->briefing_id);
        if (!$briefing || (int) $briefing->user_id !== get_current_user_id()) {
            return new WP_Error(
                'unauthorized',
                __('Du bist nicht berechtigt, diese Section zu bearbeiten.', 'bewerbungstrainer'),
                array('status' => 403)
            );
        }

        // Update user_notes
        $update_data = array();
        if (isset($params['user_notes'])) {
            $update_data['user_notes'] = $params['user_notes'];
        }

        if (empty($update_data)) {
            return new WP_Error(
                'no_data',
                __('Keine Daten zum Aktualisieren.', 'bewerbungstrainer'),
                array('status' => 400)
            );
        }

        $result = $this->db->update_section($section_id, $update_data);

        if (!$result) {
            return new WP_Error(
                'update_failed',
                __('Fehler beim Aktualisieren der Section.', 'bewerbungstrainer'),
                array('status' => 500)
            );
        }

        // Return updated section
        $updated_section = $this->db->get_section($section_id);

        return new WP_REST_Response(array(
            'success' => true,
            'data' => array(
                'section' => $this->format_section($updated_section),
            ),
        ), 200);
    }

    /**
     * Update an item within a section (for per-item notes and deletion)
     */
    public function update_section_item($request) {
        $section_id = intval($request['section_id']);
        $item_id = sanitize_text_field($request['item_id']);
        $params = $request->get_json_params();

        if (empty($params)) {
            $params = $request->get_params();
        }

        // Get the section
        $section = $this->db->get_section($section_id);

        if (!$section) {
            return new WP_Error(
                'not_found',
                __('Section nicht gefunden.', 'bewerbungstrainer'),
                array('status' => 404)
            );
        }

        // Verify user owns this briefing
        $briefing = $this->db->get_briefing($section->briefing_id);
        if (!$briefing || (int) $briefing->user_id !== get_current_user_id()) {
            return new WP_Error(
                'unauthorized',
                __('Du bist nicht berechtigt, diese Section zu bearbeiten.', 'bewerbungstrainer'),
                array('status' => 403)
            );
        }

        // Parse ai_content as JSON to get items
        $ai_content = json_decode($section->ai_content, true);

        // Check if this is the new items format
        if (!$ai_content || !isset($ai_content['items']) || !is_array($ai_content['items'])) {
            return new WP_Error(
                'invalid_format',
                __('Diese Section unterstützt keine Item-Bearbeitung.', 'bewerbungstrainer'),
                array('status' => 400)
            );
        }

        // Find and update the item
        $item_found = false;
        foreach ($ai_content['items'] as &$item) {
            if ($item['id'] === $item_id) {
                $item_found = true;

                // Update user_note if provided
                if (isset($params['user_note'])) {
                    $item['user_note'] = $params['user_note'];
                }

                // Update deleted status if provided
                if (isset($params['deleted'])) {
                    $item['deleted'] = (bool) $params['deleted'];
                }

                break;
            }
        }

        if (!$item_found) {
            return new WP_Error(
                'item_not_found',
                __('Item nicht gefunden.', 'bewerbungstrainer'),
                array('status' => 404)
            );
        }

        // Save updated ai_content
        $result = $this->db->update_section($section_id, array(
            'ai_content' => json_encode($ai_content, JSON_UNESCAPED_UNICODE),
        ));

        if (!$result) {
            return new WP_Error(
                'update_failed',
                __('Fehler beim Aktualisieren des Items.', 'bewerbungstrainer'),
                array('status' => 500)
            );
        }

        // Return updated section
        $updated_section = $this->db->get_section($section_id);

        return new WP_REST_Response(array(
            'success' => true,
            'data' => array(
                'section' => $this->format_section($updated_section),
            ),
        ), 200);
    }

    /**
     * Generate more items for a section using AI
     */
    public function generate_more_items($request) {
        $section_id = intval($request['section_id']);

        // Get the section
        $section = $this->db->get_section($section_id);

        if (!$section) {
            return new WP_Error(
                'not_found',
                __('Section nicht gefunden.', 'bewerbungstrainer'),
                array('status' => 404)
            );
        }

        // Verify user owns this briefing
        $briefing = $this->db->get_briefing($section->briefing_id);
        if (!$briefing || (int) $briefing->user_id !== get_current_user_id()) {
            return new WP_Error(
                'unauthorized',
                __('Du bist nicht berechtigt, diese Section zu bearbeiten.', 'bewerbungstrainer'),
                array('status' => 403)
            );
        }

        // Parse ai_content to get existing items
        $ai_content = json_decode($section->ai_content, true);

        if (!$ai_content || !isset($ai_content['items']) || !is_array($ai_content['items'])) {
            return new WP_Error(
                'invalid_format',
                __('Diese Section unterstützt keine Item-Generierung.', 'bewerbungstrainer'),
                array('status' => 400)
            );
        }

        // Get existing items (not deleted)
        $existing_items = array_filter($ai_content['items'], function($item) {
            return empty($item['deleted']);
        });

        // Get API key
        $api_key = get_option('bewerbungstrainer_gemini_api_key', '');
        if (empty($api_key)) {
            return new WP_Error(
                'missing_api_key',
                __('Gemini API Key ist nicht konfiguriert.', 'bewerbungstrainer'),
                array('status' => 500)
            );
        }

        // Get template for context
        $template = $this->db->get_template($briefing->template_id);

        // Build prompt for generating more items
        $prompt = $this->build_generate_more_prompt(
            $briefing->variables_json,
            $section->section_title,
            $existing_items,
            $template ? $template->title : 'Briefing'
        );

        // Log prompt
        if (function_exists('bewerbungstrainer_log_prompt')) {
            bewerbungstrainer_log_prompt(
                'SMARTBRIEFING_GENERATE_MORE',
                'Smart Briefing: Generierung von 5 zusätzlichen Punkten für eine Section.',
                $prompt,
                array(
                    'Section' => $section->section_title,
                    'Section-ID' => $section_id,
                    'Existing Items' => count($existing_items),
                )
            );
        }

        // Call Gemini API
        $response = $this->call_gemini_api($prompt, $api_key);

        if (is_wp_error($response)) {
            if (function_exists('bewerbungstrainer_log_response')) {
                bewerbungstrainer_log_response('SMARTBRIEFING_GENERATE_MORE', $response->get_error_message(), true);
            }
            return $response;
        }

        // Log successful response
        if (function_exists('bewerbungstrainer_log_response')) {
            bewerbungstrainer_log_response('SMARTBRIEFING_GENERATE_MORE', $response);
        }

        // Parse new items from response
        $new_items = $this->parse_new_items_response($response);

        if (is_wp_error($new_items)) {
            return $new_items;
        }

        // Add unique IDs to new items
        foreach ($new_items as &$item) {
            $item['id'] = wp_generate_uuid4();
            $item['user_note'] = '';
            $item['deleted'] = false;
        }

        // Merge new items with existing items
        $ai_content['items'] = array_merge($ai_content['items'], $new_items);

        // Save updated ai_content
        $result = $this->db->update_section($section_id, array(
            'ai_content' => json_encode($ai_content, JSON_UNESCAPED_UNICODE),
        ));

        if (!$result) {
            return new WP_Error(
                'update_failed',
                __('Fehler beim Speichern der neuen Items.', 'bewerbungstrainer'),
                array('status' => 500)
            );
        }

        // Return updated section
        $updated_section = $this->db->get_section($section_id);

        return new WP_REST_Response(array(
            'success' => true,
            'data' => array(
                'section' => $this->format_section($updated_section),
                'new_items_count' => count($new_items),
            ),
        ), 200);
    }

    /**
     * Update briefing (e.g., rename title)
     */
    public function update_briefing($request) {
        $briefing_id = intval($request['id']);
        $user_id = get_current_user_id();
        $params = $request->get_json_params();

        // Validate briefing ownership
        $briefing = $this->db->get_briefing($briefing_id);
        if (!$briefing || (int) $briefing->user_id !== $user_id) {
            return new WP_Error(
                'not_found',
                __('Briefing nicht gefunden.', 'bewerbungstrainer'),
                array('status' => 404)
            );
        }

        // Build update data (only allow specific fields)
        $update_data = array();
        if (isset($params['title'])) {
            $update_data['title'] = sanitize_text_field($params['title']);
        }

        if (empty($update_data)) {
            return new WP_Error(
                'no_data',
                __('Keine Daten zum Aktualisieren.', 'bewerbungstrainer'),
                array('status' => 400)
            );
        }

        $result = $this->db->update_briefing($briefing_id, $update_data);

        if (!$result) {
            return new WP_Error(
                'update_failed',
                __('Fehler beim Aktualisieren des Briefings.', 'bewerbungstrainer'),
                array('status' => 500)
            );
        }

        // Get updated briefing
        $updated_briefing = $this->db->get_briefing($briefing_id);

        return new WP_REST_Response(array(
            'success' => true,
            'data' => array(
                'briefing' => $this->format_briefing($updated_briefing),
            ),
        ), 200);
    }

    /**
     * Delete a briefing
     */
    public function delete_briefing($request) {
        $briefing_id = intval($request['id']);
        $user_id = get_current_user_id();

        $result = $this->db->delete_briefing($briefing_id, $user_id);

        if (!$result) {
            return new WP_Error(
                'delete_failed',
                __('Fehler beim Löschen des Briefings.', 'bewerbungstrainer'),
                array('status' => 500)
            );
        }

        return new WP_REST_Response(array(
            'success' => true,
            'message' => __('Briefing gelöscht.', 'bewerbungstrainer'),
        ), 200);
    }

    // =========================================================================
    // ASK ITEM METHODS (AI-powered explanations for items)
    // =========================================================================

    /**
     * Ask AI about a specific item (explain, examples, how-to, or custom question)
     *
     * @param WP_REST_Request $request Request object with section_id, item_id, and question/quick_action
     * @return WP_REST_Response|WP_Error Response with AI answer
     */
    public function ask_item($request) {
        $section_id = intval($request['section_id']);
        $item_id = sanitize_text_field($request['item_id']);
        $params = $request->get_json_params();

        if (empty($params)) {
            $params = $request->get_params();
        }

        // Get question - either custom question or quick_action
        $question = isset($params['question']) ? sanitize_text_field($params['question']) : '';
        $quick_action = isset($params['quick_action']) ? sanitize_text_field($params['quick_action']) : '';

        if (empty($question) && empty($quick_action)) {
            return new WP_Error(
                'missing_question',
                __('Bitte stelle eine Frage oder wähle eine Aktion.', 'bewerbungstrainer'),
                array('status' => 400)
            );
        }

        // Get the section
        $section = $this->db->get_section($section_id);

        if (!$section) {
            return new WP_Error(
                'not_found',
                __('Section nicht gefunden.', 'bewerbungstrainer'),
                array('status' => 404)
            );
        }

        // Verify user owns this briefing
        $briefing = $this->db->get_briefing($section->briefing_id);
        if (!$briefing || (int) $briefing->user_id !== get_current_user_id()) {
            return new WP_Error(
                'unauthorized',
                __('Du bist nicht berechtigt, diese Section zu bearbeiten.', 'bewerbungstrainer'),
                array('status' => 403)
            );
        }

        // Parse ai_content to get items
        $ai_content = json_decode($section->ai_content, true);

        if (!$ai_content || !isset($ai_content['items']) || !is_array($ai_content['items'])) {
            return new WP_Error(
                'invalid_format',
                __('Diese Section unterstützt keine Item-Fragen.', 'bewerbungstrainer'),
                array('status' => 400)
            );
        }

        // Find the item
        $item_found = null;
        $item_index = null;
        foreach ($ai_content['items'] as $index => $item) {
            if ($item['id'] === $item_id) {
                $item_found = $item;
                $item_index = $index;
                break;
            }
        }

        if (!$item_found) {
            return new WP_Error(
                'item_not_found',
                __('Item nicht gefunden.', 'bewerbungstrainer'),
                array('status' => 404)
            );
        }

        // Get API key
        $api_key = get_option('bewerbungstrainer_gemini_api_key', '');
        if (empty($api_key)) {
            return new WP_Error(
                'missing_api_key',
                __('Gemini API Key ist nicht konfiguriert.', 'bewerbungstrainer'),
                array('status' => 500)
            );
        }

        // Build the actual question from quick_action if provided
        if (!empty($quick_action)) {
            $question = $this->get_quick_action_question($quick_action, $item_found);
        }

        // Get template for context
        $template = $this->db->get_template($briefing->template_id);

        // Build prompt for asking about the item
        $prompt = $this->build_ask_item_prompt(
            $item_found,
            $question,
            $section->section_title,
            $briefing->variables_json,
            $template ? $template->title : 'Briefing'
        );

        // Log prompt
        if (function_exists('bewerbungstrainer_log_prompt')) {
            bewerbungstrainer_log_prompt(
                'SMARTBRIEFING_ASK_ITEM',
                'Smart Briefing: KI-Frage zu einem Punkt.',
                $prompt,
                array(
                    'Item' => $item_found['label'],
                    'Question' => $question,
                    'Quick-Action' => $quick_action,
                )
            );
        }

        // Call Gemini API
        $response = $this->call_gemini_api($prompt, $api_key);

        if (is_wp_error($response)) {
            if (function_exists('bewerbungstrainer_log_response')) {
                bewerbungstrainer_log_response('SMARTBRIEFING_ASK_ITEM', $response->get_error_message(), true);
            }
            return $response;
        }

        // Log successful response
        if (function_exists('bewerbungstrainer_log_response')) {
            bewerbungstrainer_log_response('SMARTBRIEFING_ASK_ITEM', $response);
        }

        // Create explanation entry
        $explanation = array(
            'id' => wp_generate_uuid4(),
            'question' => $question,
            'quick_action' => $quick_action,
            'answer' => $response,
            'created_at' => current_time('mysql'),
        );

        // Initialize ai_explanations array if not exists
        if (!isset($ai_content['items'][$item_index]['ai_explanations'])) {
            $ai_content['items'][$item_index]['ai_explanations'] = array();
        }

        // Add explanation to item
        $ai_content['items'][$item_index]['ai_explanations'][] = $explanation;

        // Save updated ai_content
        $result = $this->db->update_section($section_id, array(
            'ai_content' => json_encode($ai_content, JSON_UNESCAPED_UNICODE),
        ));

        if (!$result) {
            return new WP_Error(
                'update_failed',
                __('Fehler beim Speichern der Erklärung.', 'bewerbungstrainer'),
                array('status' => 500)
            );
        }

        return new WP_REST_Response(array(
            'success' => true,
            'data' => array(
                'explanation' => $explanation,
                'item' => $ai_content['items'][$item_index],
            ),
        ), 200);
    }

    /**
     * Delete an AI explanation from an item
     *
     * @param WP_REST_Request $request Request object with section_id, item_id, explanation_id
     * @return WP_REST_Response|WP_Error Response
     */
    public function delete_item_explanation($request) {
        $section_id = intval($request['section_id']);
        $item_id = sanitize_text_field($request['item_id']);
        $explanation_id = sanitize_text_field($request['explanation_id']);

        // Get the section
        $section = $this->db->get_section($section_id);

        if (!$section) {
            return new WP_Error(
                'not_found',
                __('Section nicht gefunden.', 'bewerbungstrainer'),
                array('status' => 404)
            );
        }

        // Verify user owns this briefing
        $briefing = $this->db->get_briefing($section->briefing_id);
        if (!$briefing || (int) $briefing->user_id !== get_current_user_id()) {
            return new WP_Error(
                'unauthorized',
                __('Du bist nicht berechtigt, diese Section zu bearbeiten.', 'bewerbungstrainer'),
                array('status' => 403)
            );
        }

        // Parse ai_content
        $ai_content = json_decode($section->ai_content, true);

        if (!$ai_content || !isset($ai_content['items']) || !is_array($ai_content['items'])) {
            return new WP_Error(
                'invalid_format',
                __('Ungültiges Format.', 'bewerbungstrainer'),
                array('status' => 400)
            );
        }

        // Find and update the item
        $item_found = false;
        $explanation_found = false;

        foreach ($ai_content['items'] as &$item) {
            if ($item['id'] === $item_id) {
                $item_found = true;

                if (isset($item['ai_explanations']) && is_array($item['ai_explanations'])) {
                    $original_count = count($item['ai_explanations']);
                    $item['ai_explanations'] = array_values(array_filter(
                        $item['ai_explanations'],
                        function($exp) use ($explanation_id) {
                            return $exp['id'] !== $explanation_id;
                        }
                    ));
                    $explanation_found = $original_count > count($item['ai_explanations']);
                }
                break;
            }
        }

        if (!$item_found) {
            return new WP_Error(
                'item_not_found',
                __('Item nicht gefunden.', 'bewerbungstrainer'),
                array('status' => 404)
            );
        }

        if (!$explanation_found) {
            return new WP_Error(
                'explanation_not_found',
                __('Erklärung nicht gefunden.', 'bewerbungstrainer'),
                array('status' => 404)
            );
        }

        // Save updated ai_content
        $result = $this->db->update_section($section_id, array(
            'ai_content' => json_encode($ai_content, JSON_UNESCAPED_UNICODE),
        ));

        if (!$result) {
            return new WP_Error(
                'update_failed',
                __('Fehler beim Löschen der Erklärung.', 'bewerbungstrainer'),
                array('status' => 500)
            );
        }

        return new WP_REST_Response(array(
            'success' => true,
            'message' => __('Erklärung gelöscht.', 'bewerbungstrainer'),
        ), 200);
    }

    /**
     * Get the question text for a quick action
     *
     * @param string $quick_action Quick action type (explain, examples, howto)
     * @param array $item The item to ask about
     * @return string The question text
     */
    private function get_quick_action_question($quick_action, $item) {
        $label = $item['label'];

        switch ($quick_action) {
            case 'explain':
                return "Erkläre mir genauer, was mit \"{$label}\" gemeint ist und warum das wichtig ist.";
            case 'examples':
                return "Gib mir konkrete Beispiele und Formulierungen für \"{$label}\".";
            case 'howto':
                return "Wie setze ich \"{$label}\" praktisch um? Gib mir konkrete Schritte.";
            default:
                return "Erkläre mir mehr über \"{$label}\".";
        }
    }

    /**
     * Build prompt for asking AI about an item
     *
     * @param array $item The item to ask about
     * @param string $question The question to ask
     * @param string $section_title The section title for context
     * @param array $variables The briefing variables for context
     * @param string $template_title The template title for context
     * @return string The prompt
     */
    private function build_ask_item_prompt($item, $question, $section_title, $variables, $template_title) {
        $variables_json = is_string($variables) ? $variables : json_encode($variables, JSON_UNESCAPED_UNICODE);
        $variables_arr = is_array($variables) ? $variables : json_decode($variables, true);

        $variables_text = '';
        if (is_array($variables_arr)) {
            foreach ($variables_arr as $key => $value) {
                if (!empty($value)) {
                    $variables_text .= "- {$key}: {$value}\n";
                }
            }
        }

        return <<<PROMPT
Du bist ein hilfreicher Karriere-Coach und Experte für berufliche Kommunikation.

KONTEXT:
Der Nutzer arbeitet an einem "{$template_title}" Briefing.
{$variables_text}
Im Abschnitt "{$section_title}" gibt es folgenden Punkt:

PUNKT:
Titel: {$item['label']}
Inhalt: {$item['content']}

FRAGE DES NUTZERS:
{$question}

ANWEISUNGEN:
- Beantworte die Frage präzise und hilfreich
- Beziehe dich auf den spezifischen Kontext (Position, Unternehmen, etc.)
- Gib praktische, umsetzbare Tipps
- Halte die Antwort kompakt (2-4 Absätze oder 3-5 Bulletpoints)
- Schreibe auf Deutsch
- Nutze einen freundlichen, coaching-artigen Ton

ANTWORT:
PROMPT;
    }

    // =========================================================================
    // HELPER METHODS
    // =========================================================================

    /**
     * Format briefing for API response
     */
    private function format_briefing($briefing, $sections = null) {
        $formatted = array(
            'id' => (int) $briefing->id,
            'briefing_uuid' => $briefing->briefing_uuid,
            'template_id' => (int) $briefing->template_id,
            'template_title' => $briefing->template_title,
            'template_icon' => $briefing->template_icon,
            'title' => $briefing->title,
            'variables' => $briefing->variables_json,
            'content_markdown' => $briefing->content_markdown,
            'status' => $briefing->status,
            'created_at' => $briefing->created_at,
            'updated_at' => $briefing->updated_at,
        );

        // Include sections if provided
        if ($sections !== null) {
            $formatted['sections'] = array_map(array($this, 'format_section'), $sections);
        }

        return $formatted;
    }

    /**
     * Format section for API response
     */
    private function format_section($section) {
        return array(
            'id' => (int) $section->id,
            'briefing_id' => (int) $section->briefing_id,
            'sort_order' => (int) $section->sort_order,
            'section_title' => $section->section_title,
            'ai_content' => $section->ai_content,
            'user_notes' => $section->user_notes,
            'created_at' => $section->created_at,
            'updated_at' => $section->updated_at,
        );
    }

    /**
     * Generate a title for the briefing from variables
     * Creates a descriptive, speaking name based on the template type and user inputs
     */
    private function generate_briefing_title($template, $variables) {
        // Template-specific title generation based on template title/category
        $template_lower = strtolower($template->title);

        // Job Interview Deep-Dive: "[Position] bei [Company]"
        if (strpos($template_lower, 'interview') !== false || strpos($template_lower, 'job') !== false) {
            $position = $this->get_variable_value($variables, array('role_name', 'position', 'rolle'));
            $company = $this->get_variable_value($variables, array('target_company', 'company', 'firma', 'unternehmen'));

            if ($position && $company) {
                return "$position bei $company";
            } elseif ($position) {
                return "Interview: $position";
            } elseif ($company) {
                return "Interview bei $company";
            }
        }

        // Gehaltsverhandlung: "Gehaltsverhandlung [Position]" or "[Current] → [Target]"
        if (strpos($template_lower, 'gehalt') !== false || strpos($template_lower, 'salary') !== false) {
            $position = $this->get_variable_value($variables, array('position', 'rolle', 'role'));
            $target = $this->get_variable_value($variables, array('target_salary', 'zielgehalt'));
            $context = $this->get_variable_value($variables, array('negotiation_context', 'kontext'));

            if ($position) {
                $context_label = '';
                if ($context) {
                    $context_map = array(
                        'neuer_job' => 'Einstieg',
                        'jahresgespraech' => 'Jahresgespräch',
                        'befoerderung' => 'Beförderung',
                        'gegenangebot' => 'Gegenangebot',
                    );
                    $context_label = isset($context_map[$context]) ? " ({$context_map[$context]})" : '';
                }
                return "Gehalt: $position$context_label";
            }
        }

        // Kundengespräch: "[Kunde] - [Ziel]"
        if (strpos($template_lower, 'kunde') !== false || strpos($template_lower, 'customer') !== false || strpos($template_lower, 'sales') !== false) {
            $customer = $this->get_variable_value($variables, array('customer_name', 'kunde', 'firma', 'client'));
            $goal = $this->get_variable_value($variables, array('meeting_goal', 'ziel'));

            if ($customer) {
                $goal_label = '';
                if ($goal) {
                    $goal_map = array(
                        'erstgespraech' => 'Erstgespräch',
                        'praesentation' => 'Präsentation',
                        'angebot' => 'Angebot',
                        'abschluss' => 'Abschluss',
                        'upsell' => 'Upselling',
                    );
                    $goal_label = isset($goal_map[$goal]) ? " - {$goal_map[$goal]}" : '';
                }
                return "$customer$goal_label";
            }
        }

        // Generic fallback: Try to build a title from common variable names
        $title_parts = array();
        $priority_keys = array(
            'target_company', 'company', 'customer_name', 'kunde', 'firma',
            'role_name', 'position', 'rolle',
        );

        foreach ($priority_keys as $key) {
            if (!empty($variables[$key])) {
                $title_parts[] = $variables[$key];
                if (count($title_parts) >= 2) {
                    break;
                }
            }
        }

        if (!empty($title_parts)) {
            return implode(' - ', $title_parts);
        }

        // Ultimate fallback: Template title + date
        $date = date_i18n('d.m.Y H:i');
        return $template->title . ' - ' . $date;
    }

    /**
     * Helper to get first non-empty value from a list of variable keys
     */
    private function get_variable_value($variables, $keys) {
        foreach ($keys as $key) {
            if (!empty($variables[$key])) {
                return $variables[$key];
            }
        }
        return null;
    }

    /**
     * Build prompt for generating 5 more items for a section
     */
    private function build_generate_more_prompt($variables, $section_title, $existing_items, $template_title) {
        $prompt = "Du bist ein KI-Assistent, der professionelle Briefings erstellt.\n\n";
        $prompt .= "=== AUFGABE ===\n";
        $prompt .= "Generiere GENAU 5 neue, zusätzliche Punkte für den Abschnitt \"$section_title\" eines $template_title Briefings.\n\n";

        // Add context from variables
        if (!empty($variables) && is_array($variables)) {
            $prompt .= "=== KONTEXT ===\n";
            foreach ($variables as $key => $value) {
                if (!empty($value)) {
                    $display_key = ucfirst(str_replace('_', ' ', $key));
                    $prompt .= "- $display_key: $value\n";
                }
            }
            $prompt .= "\n";
        }

        // Add existing items to avoid duplicates
        $prompt .= "=== BEREITS VORHANDENE PUNKTE (NICHT WIEDERHOLEN) ===\n";
        foreach ($existing_items as $item) {
            $prompt .= "- " . $item['label'] . ": " . ($item['content'] ?? '') . "\n";
        }
        $prompt .= "\n";

        $prompt .= "=== OUTPUT FORMAT ===\n";
        $prompt .= "KRITISCH: Antworte NUR mit einem validen JSON-Array. KEINE Code-Blöcke, KEIN Markdown, KEIN Text davor oder danach.\n";
        $prompt .= "Deine Antwort MUSS mit [ beginnen und mit ] enden.\n\n";
        $prompt .= "Erwartete JSON-Struktur:\n";
        $prompt .= "[\n";
        $prompt .= "  {\"label\": \"Neuer Punkt 1\", \"content\": \"Beschreibung oder Erklärung.\"},\n";
        $prompt .= "  {\"label\": \"Neuer Punkt 2\", \"content\": \"Weitere Details.\"},\n";
        $prompt .= "  {\"label\": \"Neuer Punkt 3\", \"content\": \"...\"},\n";
        $prompt .= "  {\"label\": \"Neuer Punkt 4\", \"content\": \"...\"},\n";
        $prompt .= "  {\"label\": \"Neuer Punkt 5\", \"content\": \"...\"}\n";
        $prompt .= "]\n\n";

        $prompt .= "=== WICHTIGE REGELN ===\n";
        $prompt .= "- Generiere GENAU 5 neue Punkte\n";
        $prompt .= "- KEINE Wiederholung der bereits vorhandenen Punkte\n";
        $prompt .= "- Jeder Punkt muss zum Thema \"$section_title\" passen\n";
        $prompt .= "- Sei spezifisch und konkret bezogen auf den Kontext\n";
        $prompt .= "- Nutze **fett** für wichtige Begriffe in 'content'\n";
        $prompt .= "- Halte 'label' kurz und prägnant (2-5 Wörter)\n";
        $prompt .= "- 'content' sollte 1-2 Sätze sein\n\n";
        $prompt .= "ERINNERUNG: Starte deine Antwort DIREKT mit [ - kein Text, keine Backticks.\n";

        return $prompt;
    }

    /**
     * Parse new items response from LLM
     */
    private function parse_new_items_response($response) {
        $original = $response;
        $cleaned = trim($response);

        // Try to extract JSON from code blocks first
        if (preg_match('/```(?:json)?\s*([\s\S]*?)\s*```/', $cleaned, $matches)) {
            $cleaned = trim($matches[1]);
        } else {
            // Strip leading/trailing markers if present
            $cleaned = preg_replace('/^```json\s*/i', '', $cleaned);
            $cleaned = preg_replace('/^```\s*/', '', $cleaned);
            $cleaned = preg_replace('/\s*```\s*$/', '', $cleaned);
            $cleaned = trim($cleaned);
        }

        // Try to parse JSON
        $data = json_decode($cleaned, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            // Fallback - try to find JSON array in original response
            $start = strpos($original, '[');
            $end = strrpos($original, ']');
            if ($start !== false && $end !== false && $end > $start) {
                $extracted = substr($original, $start, $end - $start + 1);
                $data = json_decode($extracted, true);
            }

            if (json_last_error() !== JSON_ERROR_NONE) {
                error_log('[SMARTBRIEFING] Failed to parse new items JSON: ' . json_last_error_msg());
                return new WP_Error('json_parse_error', 'Failed to parse JSON response: ' . json_last_error_msg());
            }
        }

        if (!is_array($data)) {
            return new WP_Error('invalid_structure', 'Response is not an array');
        }

        // Validate and transform items
        $items = array();
        foreach ($data as $item) {
            if (!isset($item['label'])) {
                continue;
            }
            $items[] = array(
                'label' => $item['label'],
                'content' => isset($item['content']) ? $item['content'] : '',
            );
        }

        if (empty($items)) {
            return new WP_Error('no_items', 'No valid items found in response');
        }

        error_log('[SMARTBRIEFING] Successfully parsed ' . count($items) . ' new items');
        return $items;
    }

    /**
     * Build briefing generation prompt for JSON output with items
     */
    private function build_briefing_prompt_json($system_prompt, $variables, $template_title) {
        $prompt = "Du bist ein KI-Assistent, der professionelle Briefings erstellt.\n\n";
        $prompt .= "=== AUFGABE ===\n";
        $prompt .= "Erstelle ein strukturiertes, umfassendes Briefing basierend auf den folgenden Anweisungen.\n\n";
        $prompt .= "=== SYSTEM-ANWEISUNGEN ===\n";
        $prompt .= $system_prompt . "\n\n";
        $prompt .= "=== OUTPUT FORMAT ===\n";
        $prompt .= "KRITISCH: Antworte NUR mit einem validen JSON-Objekt. KEINE Code-Blöcke, KEIN Markdown, KEIN Text davor oder danach.\n";
        $prompt .= "Deine Antwort MUSS mit { beginnen und mit } enden.\n\n";
        $prompt .= "Jede Section MUSS ein Array von Items enthalten. Jedes Item hat einen Titel (label) und eine Beschreibung (content).\n\n";
        $prompt .= "Erwartete JSON-Struktur:\n";
        $prompt .= "{\n";
        $prompt .= "  \"sections\": [\n";
        $prompt .= "    {\n";
        $prompt .= "      \"title\": \"1. Abschnittstitel 🎯\",\n";
        $prompt .= "      \"items\": [\n";
        $prompt .= "        {\"label\": \"Punkt-Titel\", \"content\": \"Beschreibung oder Erklärung.\"},\n";
        $prompt .= "        {\"label\": \"Zweiter Punkt\", \"content\": \"Weitere Details.\"}\n";
        $prompt .= "      ]\n";
        $prompt .= "    }\n";
        $prompt .= "  ]\n";
        $prompt .= "}\n\n";
        $prompt .= "=== INHALT-RICHTLINIEN ===\n";
        $prompt .= "- Jede Section hat einen nummerierten Titel mit Emoji (z.B. '1. Dein Personal Pitch 👤')\n";
        $prompt .= "- Jede Section enthält 3-7 konkrete Items\n";
        $prompt .= "- Jedes Item hat:\n";
        $prompt .= "  - 'label': Kurzer, prägnanter Titel (z.B. 'Diagnosesoftware (ISTA)', 'Elevator Pitch')\n";
        $prompt .= "  - 'content': Erklärung oder Tipp (1-2 Sätze, kann **fett** für Hervorhebungen nutzen)\n";
        $prompt .= "- Halte den Ton professionell aber motivierend\n";
        $prompt .= "- Sei spezifisch und konkret - vermeide allgemeine Phrasen\n";
        $prompt .= "- Beziehe dich auf die konkreten Angaben des Nutzers\n";
        $prompt .= "- Erstelle 4-6 aussagekräftige Sections\n\n";
        $prompt .= "ERINNERUNG: Starte deine Antwort DIREKT mit { - kein Text, keine Backticks, kein 'json' Marker.\n";

        return $prompt;
    }

    /**
     * Parse JSON sections response from LLM
     * Now supports items per section with individual notes capability
     */
    private function parse_sections_response($response) {
        $original = $response;
        $cleaned = trim($response);

        // Debug: Log first part of raw response
        error_log('[SMARTBRIEFING] Raw response (first 300 chars): ' . substr($cleaned, 0, 300));

        // Step 1: Try to extract JSON from code blocks FIRST (before any stripping)
        // This handles: ```json\n{...}\n``` or ```\n{...}\n```
        if (preg_match('/```(?:json)?\s*([\s\S]*?)\s*```/', $cleaned, $matches)) {
            $cleaned = trim($matches[1]);
            error_log('[SMARTBRIEFING] Extracted from code block');
        } else {
            // Step 2: No code block found, strip leading/trailing markers if present
            $cleaned = preg_replace('/^```json\s*/i', '', $cleaned);
            $cleaned = preg_replace('/^```\s*/', '', $cleaned);
            $cleaned = preg_replace('/\s*```\s*$/', '', $cleaned);
            $cleaned = trim($cleaned);
        }

        // Debug logging
        error_log('[SMARTBRIEFING] Cleaned response (first 300 chars): ' . substr($cleaned, 0, 300));

        // Step 3: Try to parse JSON
        $data = json_decode($cleaned, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            error_log('[SMARTBRIEFING] JSON parse error: ' . json_last_error_msg());

            // Step 4: Fallback - try to find JSON object containing "sections" anywhere in original response
            if (preg_match('/\{[^{}]*"sections"\s*:\s*\[[\s\S]*?\]\s*\}/', $original, $jsonMatch)) {
                $data = json_decode($jsonMatch[0], true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    error_log('[SMARTBRIEFING] Successfully extracted JSON using fallback regex');
                }
            }

            // Step 5: More aggressive fallback - find anything that looks like our JSON structure
            if (json_last_error() !== JSON_ERROR_NONE) {
                // Find the first { and last } to extract full JSON
                $start = strpos($original, '{');
                $end = strrpos($original, '}');
                if ($start !== false && $end !== false && $end > $start) {
                    $extracted = substr($original, $start, $end - $start + 1);
                    $data = json_decode($extracted, true);
                    if (json_last_error() === JSON_ERROR_NONE && isset($data['sections'])) {
                        error_log('[SMARTBRIEFING] Successfully extracted JSON using brace extraction');
                    }
                }
            }

            if (json_last_error() !== JSON_ERROR_NONE) {
                error_log('[SMARTBRIEFING] All parsing attempts failed');
                return new WP_Error('json_parse_error', 'Failed to parse JSON response: ' . json_last_error_msg());
            }
        }

        if (!isset($data['sections']) || !is_array($data['sections'])) {
            error_log('[SMARTBRIEFING] Invalid response structure - no sections array');
            error_log('[SMARTBRIEFING] Data keys: ' . print_r(array_keys($data ?? []), true));
            return new WP_Error('invalid_structure', 'Response missing sections array');
        }

        error_log('[SMARTBRIEFING] Found ' . count($data['sections']) . ' sections');

        // Transform to database format
        $sections = array();
        foreach ($data['sections'] as $index => $section) {
            if (!isset($section['title'])) {
                error_log('[SMARTBRIEFING] Section ' . $index . ' missing title, skipping');
                continue;
            }

            // Check if we have items array (new format) or content (old format)
            if (isset($section['items']) && is_array($section['items'])) {
                // New format with items - transform items and add unique IDs
                $items = array();
                foreach ($section['items'] as $item_index => $item) {
                    if (!isset($item['label'])) {
                        continue;
                    }
                    $items[] = array(
                        'id' => wp_generate_uuid4(),
                        'label' => $item['label'],
                        'content' => isset($item['content']) ? $item['content'] : '',
                        'user_note' => '',
                        'deleted' => false,
                    );
                }

                error_log('[SMARTBRIEFING] Section "' . $section['title'] . '" has ' . count($items) . ' items');

                $sections[] = array(
                    'sort_order' => $index,
                    'section_title' => $section['title'],
                    'ai_content' => json_encode(array('items' => $items), JSON_UNESCAPED_UNICODE),
                    'user_notes' => null,
                );
            } elseif (isset($section['content'])) {
                // Old format with content - keep as is for backward compatibility
                $sections[] = array(
                    'sort_order' => $index,
                    'section_title' => $section['title'],
                    'ai_content' => $section['content'],
                    'user_notes' => null,
                );
            }
        }

        if (empty($sections)) {
            error_log('[SMARTBRIEFING] No valid sections found after processing');
            return new WP_Error('no_sections', 'No valid sections found in response');
        }

        error_log('[SMARTBRIEFING] Successfully parsed ' . count($sections) . ' sections');
        return $sections;
    }

    /**
     * Convert sections array back to markdown
     */
    private function sections_to_markdown($sections) {
        $markdown = '';

        foreach ($sections as $section) {
            $title = isset($section['section_title']) ? $section['section_title'] : $section['title'];
            $content = isset($section['ai_content']) ? $section['ai_content'] : $section['content'];

            $markdown .= "### " . $title . "\n\n";

            // Check if content is JSON with items (new format)
            $json_content = json_decode($content, true);
            if ($json_content && isset($json_content['items']) && is_array($json_content['items'])) {
                // Convert items to markdown
                foreach ($json_content['items'] as $item) {
                    if (isset($item['deleted']) && $item['deleted']) {
                        continue; // Skip deleted items
                    }
                    $label = isset($item['label']) ? $item['label'] : '';
                    $item_content = isset($item['content']) ? $item['content'] : '';
                    $markdown .= "- **" . $label . "**: " . $item_content . "\n";
                }
                $markdown .= "\n";
            } else {
                // Old format - use content as is
                $markdown .= $content . "\n\n";
            }
        }

        return trim($markdown);
    }

    /**
     * Build the complete prompt from structured template fields
     *
     * Combines ai_role, auto-generated variables section, ai_task, and ai_behavior
     * Falls back to legacy system_prompt if new fields are empty
     *
     * @param object $template Template object
     * @param array $variables Variables from user input (includes custom variables)
     * @return string The complete system prompt
     */
    private function build_structured_prompt($template, $variables) {
        $prompt_parts = array();

        // Check if we have the new structured fields
        $has_new_structure = !empty($template->ai_role) || !empty($template->ai_task);
        $has_legacy_prompt = !empty($template->system_prompt);

        // 1. AI Role - "Die KI agiert als" (or fallback)
        if (!empty($template->ai_role)) {
            $prompt_parts[] = $this->interpolate_variables($template->ai_role, $variables);
        } elseif (!$has_new_structure && $has_legacy_prompt) {
            // Use legacy system_prompt if no new structure
            $prompt_parts[] = $this->interpolate_variables($template->system_prompt, $variables);
        } else {
            // Fallback: Generate a sensible default role based on template
            $template_title = !empty($template->title) ? $template->title : 'Briefing';
            $prompt_parts[] = "Du bist ein professioneller Coach und Experte für {$template_title}. Erstelle ein maßgeschneidertes, praxisnahes Briefing für den Nutzer basierend auf seinen Angaben.";
        }

        // 2. Auto-inject ALL variables as "User-Daten" section - ALWAYS
        if (!empty($variables) && is_array($variables)) {
            $user_data_lines = array();
            $user_data_lines[] = "\n=== USER-DATEN (Alle erfassten Variablen) ===";

            // Get variable labels from schema if available
            $schema_labels = array();
            if (!empty($template->variables_schema) && is_array($template->variables_schema)) {
                foreach ($template->variables_schema as $field) {
                    if (isset($field['key']) && isset($field['label'])) {
                        $schema_labels[$field['key']] = $field['label'];
                    }
                }
            }

            foreach ($variables as $key => $value) {
                if ($value !== '' && $value !== null) {
                    // Use label from schema if available, otherwise format the key nicely
                    $label = isset($schema_labels[$key])
                        ? $schema_labels[$key]
                        : ucfirst(str_replace('_', ' ', $key));
                    $user_data_lines[] = "- {$label}: {$value}";
                }
            }

            if (count($user_data_lines) > 1) { // More than just the header
                $prompt_parts[] = implode("\n", $user_data_lines);
            }
        }

        // 3. AI Task - "Was" the AI should produce
        if (!empty($template->ai_task)) {
            $prompt_parts[] = "\n" . $this->interpolate_variables($template->ai_task, $variables);
        } elseif (!$has_new_structure && !$has_legacy_prompt) {
            // Fallback: Generate a sensible default task
            $prompt_parts[] = "\n=== AUFGABE ===\nErstelle ein strukturiertes Briefing mit 4-6 Abschnitten. Jeder Abschnitt soll 3-5 konkrete, umsetzbare Punkte enthalten. Beziehe dich auf ALLE oben genannten User-Daten und passe die Inhalte individuell an.";
        }

        // 4. AI Behavior - How the AI should behave
        if (!empty($template->ai_behavior)) {
            $prompt_parts[] = "\n" . $this->interpolate_variables($template->ai_behavior, $variables);
        }

        return implode("\n", $prompt_parts);
    }

    /**
     * Interpolate variables in a string
     *
     * Supports:
     * - ${key} - Simple replacement
     * - ${?key:prefix} - Conditional with prefix
     */
    private function interpolate_variables($string, $variables) {
        if (!$variables || !is_array($variables)) {
            return $string;
        }

        // Handle conditional prefix: ${?key:prefix text}
        $string = preg_replace_callback(
            '/\$\{\?(\w+):([^}]*)\}/',
            function($matches) use ($variables) {
                $key = $matches[1];
                $prefix = $matches[2];

                if (isset($variables[$key]) && $variables[$key] !== '' && $variables[$key] !== null) {
                    return $prefix . $variables[$key];
                }
                return '';
            },
            $string
        );

        // Handle simple ${key} replacement
        foreach ($variables as $key => $value) {
            if ($value === null) {
                $value = '';
            }
            $string = str_replace('${' . $key . '}', $value, $string);
        }

        return $string;
    }

    /**
     * Call Gemini API with retry logic
     */
    private function call_gemini_api($prompt, $api_key, $max_retries = 3) {
        $models = array(
            'gemini-2.0-flash-exp',
            'gemini-2.0-flash',
            'gemini-1.5-flash-latest',
            'gemini-1.5-pro-latest',
        );

        $last_error = null;

        foreach ($models as $model) {
            for ($attempt = 1; $attempt <= $max_retries; $attempt++) {
                $url = 'https://generativelanguage.googleapis.com/v1beta/models/' . $model . ':generateContent?key=' . $api_key;

                $body = array(
                    'contents' => array(
                        array(
                            'parts' => array(
                                array('text' => $prompt)
                            )
                        )
                    ),
                    'generationConfig' => array(
                        'temperature' => 0.7,
                        'topK' => 40,
                        'topP' => 0.95,
                        'maxOutputTokens' => 8192,
                    )
                );

                error_log("[SMARTBRIEFING] Gemini API call - Model: $model, Attempt: $attempt/$max_retries");

                $response = wp_remote_post($url, array(
                    'headers' => array('Content-Type' => 'application/json'),
                    'body' => json_encode($body),
                    'timeout' => 60,
                ));

                // Handle WordPress HTTP errors
                if (is_wp_error($response)) {
                    $last_error = $response;
                    error_log("[SMARTBRIEFING] WP Error: " . $response->get_error_message());
                    if ($attempt < $max_retries) {
                        sleep(pow(2, $attempt - 1)); // Exponential backoff
                    }
                    continue;
                }

                $response_code = wp_remote_retrieve_response_code($response);

                // 404 - model not found, try next model
                if ($response_code === 404) {
                    error_log("[SMARTBRIEFING] Model $model not found, trying next...");
                    break;
                }

                // 429/5xx - retry with backoff
                if ($response_code === 429 || $response_code >= 500) {
                    $error_body = wp_remote_retrieve_body($response);
                    error_log("[SMARTBRIEFING] Error ($response_code): $error_body");
                    if ($attempt < $max_retries) {
                        sleep(pow(2, $attempt - 1));
                    }
                    continue;
                }

                // Other errors - don't retry
                if ($response_code !== 200) {
                    $error_body = wp_remote_retrieve_body($response);
                    error_log("[SMARTBRIEFING] Error ($response_code): $error_body");
                    return new WP_Error(
                        'api_error',
                        __('Gemini API Fehler: ', 'bewerbungstrainer') . $response_code,
                        array('status' => 500)
                    );
                }

                // Success!
                $response_body = wp_remote_retrieve_body($response);
                $data = json_decode($response_body, true);

                if (!isset($data['candidates'][0]['content']['parts'][0]['text'])) {
                    $last_error = new WP_Error(
                        'invalid_response',
                        __('Ungültige Antwort von Gemini API.', 'bewerbungstrainer'),
                        array('status' => 500)
                    );
                    if ($attempt < $max_retries) {
                        sleep(1);
                    }
                    continue;
                }

                error_log("[SMARTBRIEFING] Success with model: $model");
                return $data['candidates'][0]['content']['parts'][0]['text'];
            }
        }

        // All attempts failed
        error_log("[SMARTBRIEFING] All retries exhausted");
        return $last_error ?: new WP_Error(
            'api_error',
            __('Gemini API nicht verfügbar.', 'bewerbungstrainer'),
            array('status' => 500)
        );
    }

    // =========================================================================
    // PDF EXPORT
    // =========================================================================

    /**
     * Export briefing as PDF
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response|WP_Error
     */
    public function export_briefing_pdf($request) {
        $briefing_id = intval($request['id']);
        $user_id = get_current_user_id();

        // Check if PDF exporter is available
        if (!class_exists('Bewerbungstrainer_PDF_Exporter')) {
            return new WP_Error(
                'not_available',
                __('PDF Export nicht verfugbar.', 'bewerbungstrainer'),
                array('status' => 500)
            );
        }

        $pdf_exporter = Bewerbungstrainer_PDF_Exporter::get_instance();
        $result = $pdf_exporter->get_briefing_pdf_base64($briefing_id, $user_id);

        if (is_wp_error($result)) {
            return new WP_Error(
                $result->get_error_code(),
                $result->get_error_message(),
                array('status' => $result->get_error_data()['status'] ?? 500)
            );
        }

        return new WP_REST_Response(array(
            'success' => true,
            'data' => $result,
        ), 200);
    }
}
