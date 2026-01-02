<?php
/**
 * Ikigai API Class
 *
 * REST API endpoints for the Ikigai Career Pathfinder
 *
 * @package Bewerbungstrainer
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Ikigai API Class
 */
class Bewerbungstrainer_Ikigai_API {

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
        $this->db = Bewerbungstrainer_Ikigai_Database::get_instance();
        add_action('rest_api_init', array($this, 'register_routes'));
    }

    /**
     * Register REST API routes
     */
    public function register_routes() {
        // Collection routes: GET (list) and POST (create)
        register_rest_route($this->namespace, '/ikigai', array(
            array(
                'methods' => 'GET',
                'callback' => array($this, 'get_ikigais'),
                'permission_callback' => array($this, 'allow_all_users'),
            ),
            array(
                'methods' => 'POST',
                'callback' => array($this, 'create_ikigai'),
                'permission_callback' => array($this, 'allow_all_users'),
            ),
        ));

        // Item routes: GET (single), PUT (update), DELETE
        register_rest_route($this->namespace, '/ikigai/(?P<id>\d+)', array(
            array(
                'methods' => 'GET',
                'callback' => array($this, 'get_ikigai'),
                'permission_callback' => array($this, 'allow_all_users'),
            ),
            array(
                'methods' => 'PUT',
                'callback' => array($this, 'update_ikigai'),
                'permission_callback' => array($this, 'allow_all_users'),
            ),
            array(
                'methods' => 'DELETE',
                'callback' => array($this, 'delete_ikigai'),
                'permission_callback' => array($this, 'allow_all_users'),
            ),
        ));

        // Extract keywords from user input (AI endpoint)
        register_rest_route($this->namespace, '/ikigai/extract', array(
            'methods' => 'POST',
            'callback' => array($this, 'extract_keywords'),
            'permission_callback' => array($this, 'allow_all_users'),
        ));

        // Synthesize career paths from all dimensions (AI endpoint)
        register_rest_route($this->namespace, '/ikigai/synthesize', array(
            'methods' => 'POST',
            'callback' => array($this, 'synthesize_paths'),
            'permission_callback' => array($this, 'allow_all_users'),
        ));

        // Get current (in-progress) ikigai session
        register_rest_route($this->namespace, '/ikigai/current', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_current_ikigai'),
            'permission_callback' => array($this, 'allow_all_users'),
        ));
    }

    /**
     * Permission callback - allow all users (logged in or demo)
     */
    public function allow_all_users() {
        return true;
    }

    /**
     * Get current user context (user_id and/or demo_code)
     *
     * Both can be present if a user logged in after using demo code.
     *
     * @return array Array with 'user_id' and 'demo_code' keys
     */
    private function get_user_context() {
        $user_id = get_current_user_id();
        $demo_code = null;

        // Always check for demo code cookie (even if logged in)
        // This handles cases where user created content with demo code then logged in
        if (class_exists('Bewerbungstrainer_Demo_Codes')) {
            $demo_code = isset($_COOKIE['bewerbungstrainer_demo_code'])
                ? sanitize_text_field($_COOKIE['bewerbungstrainer_demo_code'])
                : null;
        }

        return array(
            'user_id' => $user_id ?: null,
            'demo_code' => $demo_code,
        );
    }

    /**
     * Check if current user can access an ikigai session
     *
     * Checks both user_id and demo_code ownership to handle cases
     * where content was created with demo code before user logged in.
     *
     * @param int $ikigai_id Ikigai ID
     * @return bool True if user can access
     */
    private function can_access_ikigai($ikigai_id) {
        $context = $this->get_user_context();

        // Check user ownership first
        if ($context['user_id']) {
            if ($this->db->user_owns_ikigai($ikigai_id, $context['user_id'])) {
                return true;
            }
        }

        // Also check demo ownership (handles content created before login)
        if ($context['demo_code']) {
            if ($this->db->demo_owns_ikigai($ikigai_id, $context['demo_code'])) {
                return true;
            }
        }

        return false;
    }

    // =========================================================================
    // API ENDPOINTS
    // =========================================================================

    /**
     * Get all ikigai sessions for current user
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response Response
     */
    public function get_ikigais($request) {
        $context = $this->get_user_context();

        if (!$context['user_id'] && !$context['demo_code']) {
            return new WP_REST_Response(array(
                'success' => true,
                'data' => array(
                    'ikigais' => array(),
                ),
            ), 200);
        }

        $args = array(
            'orderby' => 'updated_at',
            'order' => 'DESC',
            'limit' => 50,
        );

        if ($context['user_id']) {
            $ikigais = $this->db->get_user_ikigais($context['user_id'], $args);
        } else {
            $ikigais = $this->db->get_demo_ikigais($context['demo_code'], $args);
        }

        // Format ikigais for response
        $formatted = array_map(function($ikigai) {
            return $this->format_ikigai($ikigai);
        }, $ikigais);

        return new WP_REST_Response(array(
            'success' => true,
            'data' => array(
                'ikigais' => $formatted,
            ),
        ), 200);
    }

    /**
     * Create a new ikigai session
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response|WP_Error Response
     */
    public function create_ikigai($request) {
        $context = $this->get_user_context();

        if (!$context['user_id'] && !$context['demo_code']) {
            return new WP_Error(
                'not_authorized',
                __('Du musst eingeloggt sein, um dein Ikigai zu speichern.', 'bewerbungstrainer'),
                array('status' => 401)
            );
        }

        $params = $request->get_json_params();

        // Prepare data
        $data = array(
            'user_id' => $context['user_id'],
            'demo_code' => $context['demo_code'],
            'status' => 'in_progress',
        );

        // Create ikigai session
        $ikigai_id = $this->db->create_ikigai($data);

        if (!$ikigai_id) {
            return new WP_Error(
                'creation_failed',
                __('Fehler beim Erstellen der Ikigai-Analyse.', 'bewerbungstrainer'),
                array('status' => 500)
            );
        }

        // Get created ikigai
        $ikigai = $this->db->get_ikigai($ikigai_id);

        return new WP_REST_Response(array(
            'success' => true,
            'message' => __('Ikigai-Analyse gestartet.', 'bewerbungstrainer'),
            'data' => array(
                'ikigai' => $this->format_ikigai($ikigai),
            ),
        ), 201);
    }

    /**
     * Get a specific ikigai session
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response|WP_Error Response
     */
    public function get_ikigai($request) {
        $ikigai_id = intval($request['id']);

        if (!$this->can_access_ikigai($ikigai_id)) {
            return new WP_Error(
                'not_found',
                __('Ikigai-Analyse nicht gefunden.', 'bewerbungstrainer'),
                array('status' => 404)
            );
        }

        $ikigai = $this->db->get_ikigai($ikigai_id);

        return new WP_REST_Response(array(
            'success' => true,
            'data' => array(
                'ikigai' => $this->format_ikigai($ikigai),
            ),
        ), 200);
    }

    /**
     * Get current (in-progress) ikigai session
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response Response
     */
    public function get_current_ikigai($request) {
        $context = $this->get_user_context();

        if (!$context['user_id'] && !$context['demo_code']) {
            return new WP_REST_Response(array(
                'success' => true,
                'data' => array(
                    'ikigai' => null,
                ),
            ), 200);
        }

        $ikigai = $this->db->get_current_ikigai($context['user_id'], $context['demo_code']);

        return new WP_REST_Response(array(
            'success' => true,
            'data' => array(
                'ikigai' => $ikigai ? $this->format_ikigai($ikigai) : null,
            ),
        ), 200);
    }

    /**
     * Update an ikigai session
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response|WP_Error Response
     */
    public function update_ikigai($request) {
        $ikigai_id = intval($request['id']);

        if (!$this->can_access_ikigai($ikigai_id)) {
            return new WP_Error(
                'not_found',
                __('Ikigai-Analyse nicht gefunden.', 'bewerbungstrainer'),
                array('status' => 404)
            );
        }

        $params = $request->get_json_params();

        // Prepare update data
        $data = array();

        // Update dimension inputs and tags
        $dimensions = array('love', 'talent', 'need', 'market');
        foreach ($dimensions as $dim) {
            if (isset($params[$dim . '_input'])) {
                $data[$dim . '_input'] = sanitize_textarea_field($params[$dim . '_input']);
            }
            if (isset($params[$dim . '_tags'])) {
                $data[$dim . '_tags'] = $params[$dim . '_tags'];
            }
        }

        // Update synthesis results
        if (isset($params['summary'])) {
            $data['summary'] = sanitize_textarea_field($params['summary']);
        }

        if (isset($params['paths'])) {
            $data['paths_json'] = $params['paths'];
        }

        if (isset($params['status'])) {
            $data['status'] = sanitize_text_field($params['status']);
        }

        if (empty($data)) {
            return new WP_Error(
                'no_data',
                __('Keine Daten zum Aktualisieren.', 'bewerbungstrainer'),
                array('status' => 400)
            );
        }

        // Update
        $result = $this->db->update_ikigai($ikigai_id, $data);

        if (!$result) {
            return new WP_Error(
                'update_failed',
                __('Fehler beim Aktualisieren der Ikigai-Analyse.', 'bewerbungstrainer'),
                array('status' => 500)
            );
        }

        // Get updated ikigai
        $ikigai = $this->db->get_ikigai($ikigai_id);

        return new WP_REST_Response(array(
            'success' => true,
            'message' => __('Ikigai-Analyse aktualisiert.', 'bewerbungstrainer'),
            'data' => array(
                'ikigai' => $this->format_ikigai($ikigai),
            ),
        ), 200);
    }

    /**
     * Delete an ikigai session
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response|WP_Error Response
     */
    public function delete_ikigai($request) {
        $ikigai_id = intval($request['id']);

        if (!$this->can_access_ikigai($ikigai_id)) {
            return new WP_Error(
                'not_found',
                __('Ikigai-Analyse nicht gefunden.', 'bewerbungstrainer'),
                array('status' => 404)
            );
        }

        $result = $this->db->delete_ikigai($ikigai_id);

        if (!$result) {
            return new WP_Error(
                'delete_failed',
                __('Fehler beim Löschen der Ikigai-Analyse.', 'bewerbungstrainer'),
                array('status' => 500)
            );
        }

        return new WP_REST_Response(array(
            'success' => true,
            'message' => __('Ikigai-Analyse gelöscht.', 'bewerbungstrainer'),
        ), 200);
    }

    /**
     * Extract keywords from user input using AI
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response|WP_Error Response
     */
    public function extract_keywords($request) {
        $params = $request->get_json_params();

        $dimension = isset($params['dimension']) ? sanitize_text_field($params['dimension']) : '';
        $user_input = isset($params['user_input']) ? sanitize_textarea_field($params['user_input']) : '';

        // Validate dimension
        $valid_dimensions = array('love', 'talent', 'need', 'market');
        if (!in_array($dimension, $valid_dimensions)) {
            return new WP_Error(
                'invalid_dimension',
                __('Ungültige Dimension.', 'bewerbungstrainer'),
                array('status' => 400)
            );
        }

        if (empty($user_input)) {
            return new WP_Error(
                'empty_input',
                __('Bitte gib etwas Text ein.', 'bewerbungstrainer'),
                array('status' => 400)
            );
        }

        // Get Gemini API key
        $gemini_api_key = get_option('bewerbungstrainer_gemini_api_key');

        if (empty($gemini_api_key)) {
            return new WP_Error(
                'api_key_missing',
                __('Gemini API-Schlüssel nicht konfiguriert.', 'bewerbungstrainer'),
                array('status' => 500)
            );
        }

        // Build the extraction prompt
        $dimension_labels = array(
            'love' => 'Was du liebst (Leidenschaft, Interessen, Freude)',
            'talent' => 'Worin du gut bist (Fähigkeiten, Talente, Stärken)',
            'need' => 'Was die Welt braucht (Probleme lösen, Beitrag leisten)',
            'market' => 'Wofür du bezahlt wirst (Berufe, Märkte, Nachfrage)',
        );

        $prompt = $this->build_extraction_prompt($dimension, $dimension_labels[$dimension], $user_input);

        // Log the prompt
        if (function_exists('bewerbungstrainer_log_prompt')) {
            bewerbungstrainer_log_prompt(
                'IKIGAI_EXTRACT',
                'Extrahiere Keywords aus User-Input für Ikigai-Dimension',
                $prompt,
                array(
                    'dimension' => $dimension,
                    'input_length' => strlen($user_input),
                )
            );
        }

        // Call Gemini API
        $result = $this->call_gemini_api($gemini_api_key, $prompt);

        if (is_wp_error($result)) {
            return $result;
        }

        // Log the response
        if (function_exists('bewerbungstrainer_log_response')) {
            bewerbungstrainer_log_response('IKIGAI_EXTRACT', json_encode($result));
        }

        return new WP_REST_Response(array(
            'success' => true,
            'data' => array(
                'keywords' => isset($result['keywords']) ? $result['keywords'] : array(),
            ),
        ), 200);
    }

    /**
     * Synthesize career paths from all four dimensions
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response|WP_Error Response
     */
    public function synthesize_paths($request) {
        $params = $request->get_json_params();

        $love_tags = isset($params['love_tags']) ? $params['love_tags'] : array();
        $talent_tags = isset($params['talent_tags']) ? $params['talent_tags'] : array();
        $need_tags = isset($params['need_tags']) ? $params['need_tags'] : array();
        $market_tags = isset($params['market_tags']) ? $params['market_tags'] : array();

        // Validate that all dimensions have at least some tags
        if (empty($love_tags) || empty($talent_tags) || empty($need_tags) || empty($market_tags)) {
            return new WP_Error(
                'incomplete_dimensions',
                __('Bitte fülle alle vier Dimensionen aus.', 'bewerbungstrainer'),
                array('status' => 400)
            );
        }

        // Get Gemini API key
        $gemini_api_key = get_option('bewerbungstrainer_gemini_api_key');

        if (empty($gemini_api_key)) {
            return new WP_Error(
                'api_key_missing',
                __('Gemini API-Schlüssel nicht konfiguriert.', 'bewerbungstrainer'),
                array('status' => 500)
            );
        }

        // Build the synthesis prompt
        $prompt = $this->build_synthesis_prompt($love_tags, $talent_tags, $need_tags, $market_tags);

        // Log the prompt
        if (function_exists('bewerbungstrainer_log_prompt')) {
            bewerbungstrainer_log_prompt(
                'IKIGAI_SYNTHESIZE',
                'Synthese der Ikigai-Karrierepfade aus allen 4 Dimensionen',
                $prompt,
                array(
                    'love_count' => count($love_tags),
                    'talent_count' => count($talent_tags),
                    'need_count' => count($need_tags),
                    'market_count' => count($market_tags),
                )
            );
        }

        // Call Gemini API
        $result = $this->call_gemini_api($gemini_api_key, $prompt);

        if (is_wp_error($result)) {
            return $result;
        }

        // Log the response
        if (function_exists('bewerbungstrainer_log_response')) {
            bewerbungstrainer_log_response('IKIGAI_SYNTHESIZE', json_encode($result));
        }

        return new WP_REST_Response(array(
            'success' => true,
            'data' => array(
                'summary' => isset($result['summary']) ? $result['summary'] : '',
                'paths' => isset($result['paths']) ? $result['paths'] : array(),
            ),
        ), 200);
    }

    // =========================================================================
    // HELPER METHODS
    // =========================================================================

    /**
     * Build the extraction prompt for a dimension
     *
     * @param string $dimension     Dimension key
     * @param string $label         Dimension label
     * @param string $user_input    User's text input
     * @return string Prompt
     */
    private function build_extraction_prompt($dimension, $label, $user_input) {
        return <<<PROMPT
Du bist ein analytischer Karriere-Coach für das Ikigai-Modell.
Deine Aufgabe: Extrahiere aus dem Text des Users 3 bis 5 prägnante Schlagworte (Keywords/Skills) für das Ikigai-Modell.

DIMENSION: {$dimension} - {$label}

USER TEXT:
"{$user_input}"

ANWEISUNGEN:
- Extrahiere 3-5 Keywords, die die Kernaussagen des Users zusammenfassen
- Die Keywords sollten prägnant sein (1-3 Wörter)
- Fokussiere auf konkrete Fähigkeiten, Interessen oder Themen
- Vermeide zu generische Begriffe wie "Menschen helfen" - sei spezifischer
- Die Keywords sollten zur Dimension passen

WICHTIG: Antworte NUR mit gültigem JSON, ohne Markdown-Formatierung.

OUTPUT FORMAT:
{
  "keywords": ["Keyword1", "Keyword2", "Keyword3"]
}
PROMPT;
    }

    /**
     * Build the synthesis prompt for career paths
     *
     * @param array $love_tags   Love dimension tags
     * @param array $talent_tags Talent dimension tags
     * @param array $need_tags   Need dimension tags
     * @param array $market_tags Market dimension tags
     * @return string Prompt
     */
    private function build_synthesis_prompt($love_tags, $talent_tags, $need_tags, $market_tags) {
        $love_str = implode(', ', $love_tags);
        $talent_str = implode(', ', $talent_tags);
        $need_str = implode(', ', $need_tags);
        $market_str = implode(', ', $market_tags);

        return <<<PROMPT
Du bist ein visionärer Karriere-Architekt für das Ikigai-Modell.
Deine Aufgabe: Finde das "Ikigai" (den Schnittpunkt) aus den 4 Dimensionen des Users.
Konstruiere 3 konkrete Karriere-Pfade, die ALLE 4 Bereiche bestmöglich vereinen.

INPUT DATEN:
1. ❤️ LIEBE (Was du liebst): {$love_str}
2. ⭐ TALENT (Worin du gut bist): {$talent_str}
3. 🌍 WELT BRAUCHT (Was die Welt braucht): {$need_str}
4. 💰 MARKT (Wofür du bezahlt wirst): {$market_str}

GENERATION RULES:
- Sei kreativ und verbinde ungewöhnliche Punkte miteinander
- Beispiel: "Design" + "Psychologie" = "UX Researcher"
- Jeder Pfad sollte einen inspirierenden Titel haben
- Erkläre warum dieser Pfad zum User passt
- WICHTIG: Generiere für jeden Pfad "training_tags" (z.B. "sales", "leadership", "kommunikation"), damit wir passende Übungen empfehlen können

MÖGLICHE TRAINING TAGS (wähle passende aus):
- interview (Vorstellungsgespräche)
- sales (Vertrieb, Verhandlung)
- leadership (Führung, Management)
- kommunikation (Allgemeine Kommunikation)
- konflikt (Konfliktsituationen)
- praesentation (Präsentieren)
- feedback (Feedback geben/nehmen)
- moderation (Meetings, Workshops)

WICHTIG: Antworte NUR mit gültigem JSON, ohne Markdown-Formatierung.

OUTPUT FORMAT:
{
  "summary": "Ein inspirierender Satz über den roten Faden des Users, der die Verbindung zwischen den 4 Dimensionen aufzeigt.",
  "paths": [
    {
      "role_title": "Der kreative Titel der Rolle",
      "description": "Beschreibung was diese Rolle beinhaltet und warum sie zum User passt (2-3 Sätze).",
      "why_fit": "Kurze Erklärung wie diese Rolle alle 4 Dimensionen verbindet.",
      "training_tags": ["tag1", "tag2", "tag3"]
    },
    {
      "role_title": "...",
      "description": "...",
      "why_fit": "...",
      "training_tags": ["..."]
    },
    {
      "role_title": "...",
      "description": "...",
      "why_fit": "...",
      "training_tags": ["..."]
    }
  ]
}
PROMPT;
    }

    /**
     * Call the Gemini API
     *
     * @param string $api_key API key
     * @param string $prompt  Prompt text
     * @return array|WP_Error Parsed response or error
     */
    private function call_gemini_api($api_key, $prompt) {
        // Try different models in order
        $models = array(
            'gemini-2.0-flash-exp',
            'gemini-1.5-flash-latest',
            'gemini-1.5-pro-latest',
        );

        $last_error = null;

        foreach ($models as $model) {
            $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$api_key}";

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
                    'maxOutputTokens' => 2048,
                ),
            );

            $response = wp_remote_post($url, array(
                'headers' => array(
                    'Content-Type' => 'application/json',
                ),
                'body' => wp_json_encode($body),
                'timeout' => 60,
            ));

            if (is_wp_error($response)) {
                $last_error = $response;
                continue;
            }

            $response_code = wp_remote_retrieve_response_code($response);
            $response_body = wp_remote_retrieve_body($response);

            // If model not found, try next one
            if ($response_code === 404) {
                error_log("[IKIGAI] Model {$model} not found, trying next...");
                continue;
            }

            if ($response_code !== 200) {
                $last_error = new WP_Error(
                    'api_error',
                    "Gemini API Fehler (HTTP {$response_code}): {$response_body}",
                    array('status' => 500)
                );
                continue;
            }

            // Parse response
            $data = json_decode($response_body, true);

            if (!isset($data['candidates'][0]['content']['parts'][0]['text'])) {
                $last_error = new WP_Error(
                    'invalid_response',
                    __('Ungültige Antwort von Gemini API.', 'bewerbungstrainer'),
                    array('status' => 500)
                );
                continue;
            }

            $text = $data['candidates'][0]['content']['parts'][0]['text'];

            // Clean up markdown formatting if present
            $text = preg_replace('/^```json\s*/i', '', $text);
            $text = preg_replace('/\s*```$/i', '', $text);
            $text = trim($text);

            // Parse JSON
            $result = json_decode($text, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                error_log("[IKIGAI] JSON parse error: " . json_last_error_msg() . " - Raw: " . substr($text, 0, 500));
                $last_error = new WP_Error(
                    'json_error',
                    __('Fehler beim Parsen der KI-Antwort.', 'bewerbungstrainer'),
                    array('status' => 500)
                );
                continue;
            }

            return $result;
        }

        return $last_error ?: new WP_Error(
            'all_models_failed',
            __('Alle Gemini-Modelle sind fehlgeschlagen.', 'bewerbungstrainer'),
            array('status' => 500)
        );
    }

    /**
     * Format an ikigai session for API response
     *
     * @param object $ikigai Ikigai object
     * @return array Formatted ikigai
     */
    private function format_ikigai($ikigai) {
        return array(
            'id' => intval($ikigai->id),
            'love_input' => $ikigai->love_input,
            'love_tags' => $ikigai->love_tags ?: array(),
            'talent_input' => $ikigai->talent_input,
            'talent_tags' => $ikigai->talent_tags ?: array(),
            'need_input' => $ikigai->need_input,
            'need_tags' => $ikigai->need_tags ?: array(),
            'market_input' => $ikigai->market_input,
            'market_tags' => $ikigai->market_tags ?: array(),
            'summary' => $ikigai->summary,
            'paths' => $ikigai->paths_json ?: array(),
            'status' => $ikigai->status,
            'created_at' => $ikigai->created_at,
            'updated_at' => $ikigai->updated_at,
        );
    }
}
