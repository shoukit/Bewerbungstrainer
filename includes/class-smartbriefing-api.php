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
    }

    /**
     * Permission callbacks
     */
    public function check_user_logged_in() {
        return is_user_logged_in();
    }

    public function allow_all_users($request) {
        return true;
    }

    // =========================================================================
    // TEMPLATE ENDPOINTS
    // =========================================================================

    /**
     * Get all templates
     */
    public function get_templates($request) {
        $params = $request->get_params();

        $args = array(
            'category' => isset($params['category']) ? $params['category'] : null,
            'is_active' => 1,
        );

        $templates = $this->db->get_templates($args);

        // Format for frontend
        $formatted = array_map(function($template) {
            return array(
                'id' => (int) $template->id,
                'title' => $template->title,
                'description' => $template->description,
                'icon' => $template->icon,
                'category' => $template->category,
                'variables_schema' => $template->variables_schema,
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

        return new WP_REST_Response(array(
            'success' => true,
            'data' => array(
                'id' => (int) $template->id,
                'title' => $template->title,
                'description' => $template->description,
                'icon' => $template->icon,
                'category' => $template->category,
                'variables_schema' => $template->variables_schema,
            ),
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

        // Build prompt with variable interpolation
        $system_prompt = $this->interpolate_variables($template->system_prompt, $variables);

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
     */
    private function generate_briefing_title($template, $variables) {
        // Try to create a meaningful title from variables
        $title_parts = array();

        // Common variable keys for title generation
        $priority_keys = array(
            'target_company', 'company', 'customer_name', 'kunde',
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

        // If we have variable-based title parts, use them
        if (!empty($title_parts)) {
            return implode(' - ', $title_parts);
        }

        // Fallback: Template title + date
        $date = date_i18n('d.m.Y H:i');
        return $template->title . ' - ' . $date;
    }

    /**
     * Build briefing generation prompt for JSON output
     */
    private function build_briefing_prompt_json($system_prompt, $variables, $template_title) {
        $prompt = "Du bist ein KI-Assistent, der professionelle Briefings erstellt.\n\n";
        $prompt .= "=== AUFGABE ===\n";
        $prompt .= "Erstelle ein strukturiertes, umfassendes Briefing basierend auf den folgenden Anweisungen.\n\n";
        $prompt .= "=== SYSTEM-ANWEISUNGEN ===\n";
        $prompt .= $system_prompt . "\n\n";
        $prompt .= "=== OUTPUT FORMAT ===\n";
        $prompt .= "WICHTIG: Antworte ausschließlich mit einem validen JSON-Objekt. Keine Erklärungen, kein Markdown drumherum.\n\n";
        $prompt .= "Struktur:\n";
        $prompt .= "```json\n";
        $prompt .= "{\n";
        $prompt .= "  \"sections\": [\n";
        $prompt .= "    {\n";
        $prompt .= "      \"title\": \"1. Abschnittstitel\",\n";
        $prompt .= "      \"content\": \"Inhalt mit **Markdown** Formatierung (Bulletpoints, fett, etc.)\"\n";
        $prompt .= "    },\n";
        $prompt .= "    ...\n";
        $prompt .= "  ]\n";
        $prompt .= "}\n";
        $prompt .= "```\n\n";
        $prompt .= "=== INHALT-RICHTLINIEN ===\n";
        $prompt .= "- Formatiere 'content' mit Markdown (Bulletpoints mit -, fett mit **, etc.)\n";
        $prompt .= "- Jede Section sollte einen klar nummerierten Titel haben (z.B. '1. Dein Personal Pitch')\n";
        $prompt .= "- Halte den Ton professionell aber motivierend\n";
        $prompt .= "- Sei spezifisch und konkret - vermeide allgemeine Phrasen\n";
        $prompt .= "- Beziehe dich auf die konkreten Angaben des Nutzers\n";
        $prompt .= "- Erstelle 4-6 aussagekräftige Sections\n\n";
        $prompt .= "=== WICHTIG ===\n";
        $prompt .= "Gib NUR das JSON-Objekt zurück. Kein ```json, kein Text davor oder danach.\n";

        return $prompt;
    }

    /**
     * Parse JSON sections response from LLM
     */
    private function parse_sections_response($response) {
        // Clean up the response - remove markdown code blocks if present
        $cleaned = trim($response);
        $cleaned = preg_replace('/^```json\s*/i', '', $cleaned);
        $cleaned = preg_replace('/^```\s*/i', '', $cleaned);
        $cleaned = preg_replace('/\s*```$/i', '', $cleaned);
        $cleaned = trim($cleaned);

        // Try to parse JSON
        $data = json_decode($cleaned, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            error_log('[SMARTBRIEFING] JSON parse error: ' . json_last_error_msg());
            error_log('[SMARTBRIEFING] Raw response: ' . substr($response, 0, 500));
            return new WP_Error('json_parse_error', 'Failed to parse JSON response');
        }

        if (!isset($data['sections']) || !is_array($data['sections'])) {
            error_log('[SMARTBRIEFING] Invalid response structure - no sections array');
            return new WP_Error('invalid_structure', 'Response missing sections array');
        }

        // Transform to database format
        $sections = array();
        foreach ($data['sections'] as $index => $section) {
            if (!isset($section['title']) || !isset($section['content'])) {
                continue;
            }

            $sections[] = array(
                'sort_order' => $index,
                'section_title' => $section['title'],
                'ai_content' => $section['content'],
                'user_notes' => null,
            );
        }

        if (empty($sections)) {
            return new WP_Error('no_sections', 'No valid sections found in response');
        }

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
            $markdown .= $content . "\n\n";
        }

        return trim($markdown);
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
}
