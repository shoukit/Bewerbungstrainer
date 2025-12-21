<?php
/**
 * Simulator REST API Class
 *
 * Handles all REST API endpoints for the Skill Simulator feature
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

class Bewerbungstrainer_Simulator_API {

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
     * Audio handler instance
     */
    private $audio_handler;

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
        $this->db = Bewerbungstrainer_Simulator_Database::get_instance();
        $this->audio_handler = Bewerbungstrainer_Audio_Handler::get_instance();

        add_action('rest_api_init', array($this, 'register_routes'));
    }

    /**
     * Register REST API routes
     */
    public function register_routes() {
        // ===== Scenario Endpoints =====

        // Get all scenarios
        register_rest_route($this->namespace, '/simulator/scenarios', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_scenarios'),
            'permission_callback' => array($this, 'allow_all_users'),
        ));

        // Get specific scenario
        register_rest_route($this->namespace, '/simulator/scenarios/(?P<id>\d+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_scenario'),
            'permission_callback' => array($this, 'allow_all_users'),
        ));

        // ===== Session Endpoints =====

        // Create simulator session
        register_rest_route($this->namespace, '/simulator/sessions', array(
            'methods' => 'POST',
            'callback' => array($this, 'create_session'),
            'permission_callback' => array($this, 'allow_all_users'),
        ));

        // Generate questions for session
        register_rest_route($this->namespace, '/simulator/sessions/(?P<id>\d+)/questions', array(
            'methods' => 'POST',
            'callback' => array($this, 'generate_questions'),
            'permission_callback' => array($this, 'allow_all_users'),
        ));

        // Submit answer and get feedback
        register_rest_route($this->namespace, '/simulator/sessions/(?P<id>\d+)/answer', array(
            'methods' => 'POST',
            'callback' => array($this, 'submit_answer'),
            'permission_callback' => array($this, 'allow_all_users'),
        ));

        // Update session (status, progress)
        register_rest_route($this->namespace, '/simulator/sessions/(?P<id>\d+)', array(
            'methods' => 'PUT',
            'callback' => array($this, 'update_session'),
            'permission_callback' => array($this, 'allow_all_users'),
        ));

        // Get specific session
        register_rest_route($this->namespace, '/simulator/sessions/(?P<id>\d+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_session'),
            'permission_callback' => array($this, 'allow_all_users'),
        ));

        // Get all sessions for user
        register_rest_route($this->namespace, '/simulator/sessions', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_sessions'),
            'permission_callback' => array($this, 'check_user_logged_in'),
        ));

        // Delete session
        register_rest_route($this->namespace, '/simulator/sessions/(?P<id>\d+)', array(
            'methods' => 'DELETE',
            'callback' => array($this, 'delete_session'),
            'permission_callback' => array($this, 'check_user_logged_in'),
        ));

        // Get session answers
        register_rest_route($this->namespace, '/simulator/sessions/(?P<id>\d+)/answers', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_session_answers'),
            'permission_callback' => array($this, 'allow_all_users'),
        ));

        // Complete session and generate summary
        register_rest_route($this->namespace, '/simulator/sessions/(?P<id>\d+)/complete', array(
            'methods' => 'POST',
            'callback' => array($this, 'complete_session'),
            'permission_callback' => array($this, 'allow_all_users'),
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
    // SCENARIO ENDPOINTS
    // =========================================================================

    /**
     * Get all scenarios
     */
    public function get_scenarios($request) {
        $params = $request->get_params();

        $args = array(
            'category' => isset($params['category']) ? $params['category'] : null,
            'difficulty' => isset($params['difficulty']) ? $params['difficulty'] : null,
            'is_active' => 1,
        );

        $scenarios = $this->db->get_scenarios($args);

        // Format for frontend (include input_configuration for wizard)
        $formatted = array_map(function($scenario) {
            return array(
                'id' => (int) $scenario->id,
                'title' => $scenario->title,
                'description' => $scenario->description,
                'icon' => $scenario->icon,
                'difficulty' => $scenario->difficulty,
                'category' => $scenario->category,
                'target_audience' => $scenario->target_audience ?? '',
                'mode' => $scenario->mode ?? 'INTERVIEW',
                'input_configuration' => $scenario->input_configuration,
                'question_count_min' => (int) $scenario->question_count_min,
                'question_count_max' => (int) $scenario->question_count_max,
                'time_limit_per_question' => (int) $scenario->time_limit_per_question,
                'allow_retry' => (bool) $scenario->allow_retry,
            );
        }, $scenarios);

        return new WP_REST_Response(array(
            'success' => true,
            'data' => array('scenarios' => $formatted),
        ), 200);
    }

    /**
     * Get specific scenario with full details
     */
    public function get_scenario($request) {
        $scenario_id = intval($request['id']);
        $scenario = $this->db->get_scenario($scenario_id);

        if (!$scenario) {
            return new WP_Error(
                'not_found',
                __('Szenario nicht gefunden.', 'bewerbungstrainer'),
                array('status' => 404)
            );
        }

        return new WP_REST_Response(array(
            'success' => true,
            'data' => array(
                'id' => (int) $scenario->id,
                'title' => $scenario->title,
                'description' => $scenario->description,
                'icon' => $scenario->icon,
                'difficulty' => $scenario->difficulty,
                'category' => $scenario->category,
                'mode' => $scenario->mode ?? 'INTERVIEW',
                'system_prompt' => $scenario->system_prompt,
                'input_configuration' => $scenario->input_configuration,
                'question_count_min' => (int) $scenario->question_count_min,
                'question_count_max' => (int) $scenario->question_count_max,
                'time_limit_per_question' => (int) $scenario->time_limit_per_question,
                'allow_retry' => (bool) $scenario->allow_retry,
            ),
        ), 200);
    }

    // =========================================================================
    // SESSION ENDPOINTS
    // =========================================================================

    /**
     * Create a new simulator session
     */
    public function create_session($request) {
        $params = $request->get_json_params();

        if (empty($params)) {
            $params = $request->get_params();
        }

        // Validate required fields
        if (empty($params['scenario_id'])) {
            return new WP_Error(
                'missing_fields',
                __('Szenario ist erforderlich.', 'bewerbungstrainer'),
                array('status' => 400)
            );
        }

        // Verify scenario exists
        $scenario = $this->db->get_scenario($params['scenario_id']);
        if (!$scenario) {
            return new WP_Error(
                'invalid_scenario',
                __('Ungültiges Szenario.', 'bewerbungstrainer'),
                array('status' => 400)
            );
        }

        // For non-logged-in users, user_name is optional but helpful
        $user_id = get_current_user_id();

        // Create session
        $session_data = array(
            'user_id' => $user_id,
            'user_name' => isset($params['user_name']) ? $params['user_name'] : null,
            'scenario_id' => $params['scenario_id'],
            'variables_json' => isset($params['variables']) ? $params['variables'] : null,
            'status' => 'setup',
            'demo_code' => isset($params['demo_code']) ? strtoupper(sanitize_text_field($params['demo_code'])) : null,
        );

        // For demo users, update the demo code usage counter
        if (!empty($session_data['demo_code'])) {
            $demo_codes = Bewerbungstrainer_Demo_Codes::get_instance();
            $demo_codes->update_usage($session_data['demo_code']);
        }

        $session_id = $this->db->create_session($session_data);

        if (!$session_id) {
            return new WP_Error(
                'create_failed',
                __('Fehler beim Erstellen der Sitzung.', 'bewerbungstrainer'),
                array('status' => 500)
            );
        }

        $session = $this->db->get_session($session_id);

        return new WP_REST_Response(array(
            'success' => true,
            'data' => array(
                'session' => array(
                    'id' => (int) $session->id,
                    'session_id' => $session->session_id,
                    'scenario_id' => (int) $session->scenario_id,
                    'status' => $session->status,
                ),
            ),
        ), 201);
    }

    /**
     * Generate questions for a session using Gemini
     */
    public function generate_questions($request) {
        error_log("[SIMULATOR_QUESTIONS] ========== START generate_questions ==========");

        $session_id = intval($request['id']);
        error_log("[SIMULATOR_QUESTIONS] Session ID: $session_id");

        $session = $this->db->get_session($session_id);

        if (!$session) {
            error_log("[SIMULATOR_QUESTIONS] ERROR: Session not found");
            return new WP_Error(
                'not_found',
                __('Sitzung nicht gefunden.', 'bewerbungstrainer'),
                array('status' => 404)
            );
        }
        error_log("[SIMULATOR_QUESTIONS] Session found, scenario_id: " . $session->scenario_id);

        // Get scenario
        $scenario = $this->db->get_scenario($session->scenario_id);
        if (!$scenario) {
            error_log("[SIMULATOR_QUESTIONS] ERROR: Scenario not found");
            return new WP_Error(
                'scenario_not_found',
                __('Szenario nicht gefunden.', 'bewerbungstrainer'),
                array('status' => 404)
            );
        }
        error_log("[SIMULATOR_QUESTIONS] Scenario: " . $scenario->title . " (mode: " . ($scenario->mode ?? 'INTERVIEW') . ")");

        // Get API key
        $api_key = get_option('bewerbungstrainer_gemini_api_key', '');
        if (empty($api_key)) {
            error_log("[SIMULATOR_QUESTIONS] ERROR: API key missing");
            return new WP_Error(
                'missing_api_key',
                __('Gemini API Key ist nicht konfiguriert.', 'bewerbungstrainer'),
                array('status' => 500)
            );
        }
        error_log("[SIMULATOR_QUESTIONS] API key found (length: " . strlen($api_key) . ")");

        // Build prompt with variable interpolation
        $variables = $session->variables_json ?: array();
        error_log("[SIMULATOR_QUESTIONS] Variables: " . json_encode($variables));

        $system_prompt = $this->interpolate_variables($scenario->system_prompt, $variables);
        $question_prompt = $scenario->question_generation_prompt ?: $this->get_default_question_prompt();
        $question_prompt = $this->interpolate_variables($question_prompt, $variables);

        // Calculate question count
        $question_count = rand($scenario->question_count_min, $scenario->question_count_max);
        error_log("[SIMULATOR_QUESTIONS] Question count: $question_count (min: {$scenario->question_count_min}, max: {$scenario->question_count_max})");

        // Get scenario mode (INTERVIEW or SIMULATION)
        $mode = $scenario->mode ?? 'INTERVIEW';

        // Build full prompt
        $full_prompt = $this->build_question_generation_prompt(
            $system_prompt,
            $question_prompt,
            $variables,
            $question_count,
            $mode
        );
        error_log("[SIMULATOR_QUESTIONS] Prompt built, length: " . strlen($full_prompt) . " chars");

        // Log prompt to prompts.log
        if (function_exists('bewerbungstrainer_log_prompt')) {
            bewerbungstrainer_log_prompt(
                'SIMULATOR_QUESTIONS',
                'Szenario-Training: Generierung von Interview-Fragen basierend auf Szenario-Konfiguration und Benutzervariablen.',
                $full_prompt,
                array(
                    'Szenario' => $scenario->title,
                    'Szenario-ID' => $scenario->id,
                    'Anzahl Fragen' => $question_count,
                    'Variablen' => $variables,
                    'Session-ID' => $session_id,
                )
            );
        }

        // Call Gemini API
        error_log("[SIMULATOR_QUESTIONS] Calling Gemini API...");
        $response = $this->call_gemini_api($full_prompt, $api_key);

        if (is_wp_error($response)) {
            error_log("[SIMULATOR_QUESTIONS] ERROR: Gemini API returned WP_Error: " . $response->get_error_message());
            // Log error response
            if (function_exists('bewerbungstrainer_log_response')) {
                bewerbungstrainer_log_response('SIMULATOR_QUESTIONS', $response->get_error_message(), true);
            }
            return $response;
        }

        error_log("[SIMULATOR_QUESTIONS] Gemini API success, response length: " . strlen($response) . " chars");
        error_log("[SIMULATOR_QUESTIONS] Response preview: " . substr($response, 0, 500));

        // Log successful response
        if (function_exists('bewerbungstrainer_log_response')) {
            bewerbungstrainer_log_response('SIMULATOR_QUESTIONS', $response);
        }

        // Parse questions from response
        error_log("[SIMULATOR_QUESTIONS] Parsing questions from response...");
        $questions = $this->parse_questions_response($response);

        if (empty($questions)) {
            error_log("[SIMULATOR_QUESTIONS] ERROR: parse_questions_response returned empty array!");
            error_log("[SIMULATOR_QUESTIONS] Full response was: " . $response);
            return new WP_Error(
                'generation_failed',
                __('Fehler beim Generieren der Fragen.', 'bewerbungstrainer'),
                array('status' => 500)
            );
        }

        error_log("[SIMULATOR_QUESTIONS] Successfully parsed " . count($questions) . " questions");

        // Update session with questions
        $this->db->update_session($session_id, array(
            'questions_json' => $questions,
            'total_questions' => count($questions),
            'status' => 'in_progress',
            'started_at' => current_time('mysql'),
        ));

        // Refresh session to get updated data
        $session = $this->db->get_session($session_id);

        return new WP_REST_Response(array(
            'success' => true,
            'data' => array(
                'session' => $this->format_session($session),
                'questions' => $questions,
                'total_questions' => count($questions),
            ),
        ), 200);
    }

    /**
     * Submit an audio answer and get immediate feedback
     */
    public function submit_answer($request) {
        $session_id = intval($request['id']);
        $session = $this->db->get_session($session_id);

        if (!$session) {
            return new WP_Error(
                'not_found',
                __('Sitzung nicht gefunden.', 'bewerbungstrainer'),
                array('status' => 404)
            );
        }

        // Get parameters
        $params = $request->get_params();
        $question_index = isset($params['question_index']) ? intval($params['question_index']) : 0;
        $question_text = isset($params['question_text']) ? $params['question_text'] : '';

        // Handle audio file upload
        $files = $request->get_file_params();
        $audio_file = isset($files['audio']) ? $files['audio'] : null;

        // Also check for base64 audio in body
        $body_params = $request->get_json_params();
        $audio_base64 = isset($body_params['audio_base64']) ? $body_params['audio_base64'] : null;

        if (!$audio_file && !$audio_base64) {
            return new WP_Error(
                'missing_audio',
                __('Audio-Datei ist erforderlich.', 'bewerbungstrainer'),
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

        // Get scenario for feedback prompt
        $scenario = $this->db->get_scenario($session->scenario_id);
        $variables = $session->variables_json ?: array();

        // Process audio - either file upload or base64
        $audio_data = null;
        $audio_url = null;
        $audio_filename = null;

        if ($audio_base64) {
            // Handle base64 audio
            $audio_data = base64_decode($audio_base64);
            $mime_type = isset($body_params['audio_mime_type']) ? $body_params['audio_mime_type'] : 'audio/webm';

            // Save to file
            $upload_dir = wp_upload_dir();
            $simulator_dir = $upload_dir['basedir'] . '/bewerbungstrainer/simulator/';

            if (!file_exists($simulator_dir)) {
                wp_mkdir_p($simulator_dir);
            }

            $audio_filename = 'sim_' . $session->session_id . '_q' . $question_index . '_' . time() . '.webm';
            $audio_path = $simulator_dir . $audio_filename;

            file_put_contents($audio_path, $audio_data);
            $audio_url = $upload_dir['baseurl'] . '/bewerbungstrainer/simulator/' . $audio_filename;

        } elseif ($audio_file) {
            // Handle file upload
            $upload_dir = wp_upload_dir();
            $simulator_dir = $upload_dir['basedir'] . '/bewerbungstrainer/simulator/';

            if (!file_exists($simulator_dir)) {
                wp_mkdir_p($simulator_dir);
            }

            $audio_filename = 'sim_' . $session->session_id . '_q' . $question_index . '_' . time() . '.' . pathinfo($audio_file['name'], PATHINFO_EXTENSION);
            $audio_path = $simulator_dir . $audio_filename;

            move_uploaded_file($audio_file['tmp_name'], $audio_path);
            $audio_url = $upload_dir['baseurl'] . '/bewerbungstrainer/simulator/' . $audio_filename;
            $audio_data = file_get_contents($audio_path);
            $mime_type = $audio_file['type'];
        }

        // Mark previous answers as not final (for retry)
        $this->db->mark_previous_answers_not_final($session_id, $question_index);

        // Get attempt number
        $latest_answer = $this->db->get_latest_answer_for_question($session_id, $question_index);
        $attempt_number = $latest_answer ? $latest_answer->attempt_number + 1 : 1;

        // Build analysis prompt
        $feedback_prompt = $scenario->feedback_prompt ?: $this->get_default_feedback_prompt();
        $feedback_prompt = $this->interpolate_variables($feedback_prompt, $variables);

        $analysis_prompt = $this->build_audio_analysis_prompt(
            $question_text,
            $scenario,
            $variables,
            $feedback_prompt
        );

        // Log prompt to prompts.log
        if (function_exists('bewerbungstrainer_log_prompt')) {
            bewerbungstrainer_log_prompt(
                'SIMULATOR_AUDIO_FEEDBACK',
                'Szenario-Training: Audio-Analyse und Feedback. Transkribiert Antwort, bewertet Inhalt und Sprechweise.',
                $analysis_prompt,
                array(
                    'Szenario' => $scenario->title,
                    'Frage' => $question_text,
                    'Frage-Index' => $question_index,
                    'Versuch-Nr' => $attempt_number,
                    'Audio-Größe' => strlen($audio_data) . ' bytes',
                    'MIME-Type' => $mime_type ?? 'audio/webm',
                    'Session-ID' => $session_id,
                )
            );
        }

        // Call Gemini with multimodal (audio + text)
        $analysis_result = $this->call_gemini_multimodal($analysis_prompt, $audio_data, $mime_type ?? 'audio/webm', $api_key);

        if (is_wp_error($analysis_result)) {
            // Log error response
            if (function_exists('bewerbungstrainer_log_response')) {
                bewerbungstrainer_log_response('SIMULATOR_AUDIO_FEEDBACK', $analysis_result->get_error_message(), true);
            }
            return $analysis_result;
        }

        // Log successful response
        if (function_exists('bewerbungstrainer_log_response')) {
            bewerbungstrainer_log_response('SIMULATOR_AUDIO_FEEDBACK', $analysis_result);
        }

        // Parse analysis response
        $parsed = $this->parse_audio_analysis_response($analysis_result);

        // Create answer record
        $answer_data = array(
            'session_id' => $session_id,
            'question_index' => $question_index,
            'question_text' => $question_text,
            'question_category' => isset($params['question_category']) ? $params['question_category'] : null,
            'audio_filename' => $audio_filename,
            'audio_url' => $audio_url,
            'audio_duration_seconds' => isset($params['audio_duration']) ? intval($params['audio_duration']) : null,
            'transcript' => $parsed['transcript'],
            'feedback_json' => $parsed['feedback'],
            'audio_analysis_json' => $parsed['audio_metrics'],
            'content_score' => isset($parsed['feedback']['scores']['content']) ? $parsed['feedback']['scores']['content'] : null,
            'delivery_score' => isset($parsed['feedback']['scores']['delivery']) ? $parsed['feedback']['scores']['delivery'] : null,
            'overall_score' => isset($parsed['feedback']['scores']['overall']) ? $parsed['feedback']['scores']['overall'] : null,
            'attempt_number' => $attempt_number,
            'is_final_attempt' => 1,
        );

        $answer_id = $this->db->create_answer($answer_data);

        if (!$answer_id) {
            return new WP_Error(
                'save_failed',
                __('Fehler beim Speichern der Antwort.', 'bewerbungstrainer'),
                array('status' => 500)
            );
        }

        // Update session progress
        $completed_count = count($this->db->get_session_answers($session_id, true));
        $this->db->update_session($session_id, array(
            'current_question_index' => $question_index,
            'completed_questions' => $completed_count,
        ));

        return new WP_REST_Response(array(
            'success' => true,
            'data' => array(
                'answer_id' => $answer_id,
                'transcript' => $parsed['transcript'],
                'feedback' => $parsed['feedback'],
                'audio_analysis' => $parsed['audio_metrics'],
            ),
        ), 200);
    }

    /**
     * Update session
     */
    public function update_session($request) {
        $session_id = intval($request['id']);
        $session = $this->db->get_session($session_id);

        if (!$session) {
            return new WP_Error(
                'not_found',
                __('Sitzung nicht gefunden.', 'bewerbungstrainer'),
                array('status' => 404)
            );
        }

        $params = $request->get_json_params();
        if (empty($params)) {
            $params = $request->get_params();
        }

        $update_data = array();

        if (isset($params['status'])) {
            $update_data['status'] = $params['status'];
        }

        if (isset($params['current_question_index'])) {
            $update_data['current_question_index'] = intval($params['current_question_index']);
        }

        if (isset($params['completed_questions'])) {
            $update_data['completed_questions'] = intval($params['completed_questions']);
        }

        if (!empty($update_data)) {
            $this->db->update_session($session_id, $update_data);
        }

        $session = $this->db->get_session($session_id);

        return new WP_REST_Response(array(
            'success' => true,
            'data' => $this->format_session($session),
        ), 200);
    }

    /**
     * Get session
     */
    public function get_session($request) {
        $session_id = intval($request['id']);
        $session = $this->db->get_session($session_id);

        if (!$session) {
            return new WP_Error(
                'not_found',
                __('Sitzung nicht gefunden.', 'bewerbungstrainer'),
                array('status' => 404)
            );
        }

        return new WP_REST_Response(array(
            'success' => true,
            'data' => $this->format_session($session),
        ), 200);
    }

    /**
     * Get all sessions for user
     */
    public function get_sessions($request) {
        $params = $request->get_params();

        $args = array(
            'limit' => isset($params['limit']) ? intval($params['limit']) : 50,
            'offset' => isset($params['offset']) ? intval($params['offset']) : 0,
            'orderby' => isset($params['orderby']) ? $params['orderby'] : 'created_at',
            'order' => isset($params['order']) ? $params['order'] : 'DESC',
            'status' => isset($params['status']) ? $params['status'] : null,
            'demo_code' => isset($params['demo_code']) ? strtoupper(sanitize_text_field($params['demo_code'])) : null,
        );

        $user_id = get_current_user_id();

        // Check if current user is demo user and filter by demo_code
        if (Bewerbungstrainer_Demo_Codes::is_demo_user() && !empty($args['demo_code'])) {
            // Demo user with code - filter by code
            $sessions = $this->db->get_user_sessions($user_id, $args);
            $total = $this->db->get_user_sessions_count($user_id, $args['status'], $args['demo_code']);
        } else if (Bewerbungstrainer_Demo_Codes::is_demo_user() && empty($args['demo_code'])) {
            // Demo user without code - return empty
            $sessions = array();
            $total = 0;
        } else {
            // Regular user - normal behavior
            $sessions = $this->db->get_user_sessions($user_id, $args);
            $total = $this->db->get_user_sessions_count($user_id, $args['status']);
        }

        $formatted = array_map(array($this, 'format_session'), $sessions);

        return new WP_REST_Response(array(
            'success' => true,
            'data' => array(
                'sessions' => $formatted,
                'pagination' => array(
                    'page' => floor($args['offset'] / $args['limit']) + 1,
                    'per_page' => $args['limit'],
                    'total' => $total,
                    'total_pages' => ceil($total / $args['limit']),
                ),
            ),
        ), 200);
    }

    /**
     * Delete session
     */
    public function delete_session($request) {
        $session_id = intval($request['id']);
        $user_id = get_current_user_id();

        $result = $this->db->delete_session($session_id, $user_id);

        if (!$result) {
            return new WP_Error(
                'delete_failed',
                __('Fehler beim Löschen der Sitzung.', 'bewerbungstrainer'),
                array('status' => 400)
            );
        }

        return new WP_REST_Response(array(
            'success' => true,
            'message' => __('Sitzung erfolgreich gelöscht.', 'bewerbungstrainer'),
        ), 200);
    }

    /**
     * Get answers for a session
     */
    public function get_session_answers($request) {
        $session_id = intval($request['id']);
        $session = $this->db->get_session($session_id);

        if (!$session) {
            return new WP_Error(
                'not_found',
                __('Sitzung nicht gefunden.', 'bewerbungstrainer'),
                array('status' => 404)
            );
        }

        $answers = $this->db->get_session_answers($session_id, true);

        $formatted = array_map(function($answer) {
            return array(
                'id' => (int) $answer->id,
                'question_index' => (int) $answer->question_index,
                'question_text' => $answer->question_text,
                'question_category' => $answer->question_category,
                'audio_url' => $answer->audio_url,
                'audio_duration_seconds' => $answer->audio_duration_seconds ? (int) $answer->audio_duration_seconds : null,
                'transcript' => $answer->transcript,
                'feedback' => $answer->feedback_json,
                'audio_analysis' => $answer->audio_analysis_json,
                'content_score' => $answer->content_score ? (float) $answer->content_score : null,
                'delivery_score' => $answer->delivery_score ? (float) $answer->delivery_score : null,
                'overall_score' => $answer->overall_score ? (float) $answer->overall_score : null,
                'attempt_number' => (int) $answer->attempt_number,
                'created_at' => $answer->created_at,
            );
        }, $answers);

        return new WP_REST_Response(array(
            'success' => true,
            'data' => array('answers' => $formatted),
        ), 200);
    }

    /**
     * Complete session and generate summary
     */
    public function complete_session($request) {
        $session_id = intval($request['id']);
        $session = $this->db->get_session($session_id);

        if (!$session) {
            return new WP_Error(
                'not_found',
                __('Sitzung nicht gefunden.', 'bewerbungstrainer'),
                array('status' => 404)
            );
        }

        // Get all final answers
        $answers = $this->db->get_session_answers($session_id, true);

        // Calculate overall score
        $total_score = 0;
        $score_count = 0;

        foreach ($answers as $answer) {
            if ($answer->overall_score !== null) {
                $total_score += (float) $answer->overall_score;
                $score_count++;
            }
        }

        $overall_score = $score_count > 0 ? round($total_score / $score_count, 2) : null;

        // Generate summary feedback
        $summary_feedback = array(
            'total_questions' => (int) $session->total_questions,
            'completed_questions' => count($answers),
            'overall_score' => $overall_score,
            'average_content_score' => $this->calculate_average_score($answers, 'content_score'),
            'average_delivery_score' => $this->calculate_average_score($answers, 'delivery_score'),
        );

        // Update session
        $this->db->update_session($session_id, array(
            'status' => 'completed',
            'completed_questions' => count($answers),
            'overall_score' => $overall_score,
            'summary_feedback_json' => $summary_feedback,
            'completed_at' => current_time('mysql'),
        ));

        $session = $this->db->get_session($session_id);

        return new WP_REST_Response(array(
            'success' => true,
            'data' => array(
                'session' => $this->format_session($session),
                'summary' => $summary_feedback,
            ),
        ), 200);
    }

    // =========================================================================
    // HELPER METHODS
    // =========================================================================

    /**
     * Format session for API response
     */
    private function format_session($session) {
        return array(
            'id' => (int) $session->id,
            'session_id' => $session->session_id,
            'scenario_id' => (int) $session->scenario_id,
            'scenario_title' => $session->scenario_title,
            'scenario_icon' => $session->scenario_icon,
            'variables' => $session->variables_json,
            'questions' => $session->questions_json,
            'current_question_index' => (int) $session->current_question_index,
            'status' => $session->status,
            'total_questions' => (int) $session->total_questions,
            'completed_questions' => (int) $session->completed_questions,
            'overall_score' => $session->overall_score ? (float) $session->overall_score : null,
            'summary_feedback' => $session->summary_feedback_json,
            'started_at' => $session->started_at,
            'completed_at' => $session->completed_at,
            'created_at' => $session->created_at,
        );
    }

    /**
     * Calculate average score from answers
     */
    private function calculate_average_score($answers, $field) {
        $total = 0;
        $count = 0;

        foreach ($answers as $answer) {
            if ($answer->$field !== null) {
                $total += (float) $answer->$field;
                $count++;
            }
        }

        return $count > 0 ? round($total / $count, 2) : null;
    }

    /**
     * Interpolate variables in a string
     *
     * Supports:
     * - ${key} - Simple replacement
     * - ${?key:prefix text } - Only adds "prefix text " if key has a value
     * - ${key:suffix text} - Adds "suffix text" after the value (only if value exists)
     * - ${key ? "text with value" : "text without"} - JS-style ternary (basic support)
     */
    private function interpolate_variables($string, $variables) {
        if (!$variables) {
            $variables = array();
        }

        // 1. Handle JS-style ternary: ${key ? "text" : "other"}
        // Pattern: ${variable ? "true text" : "false text"} or ${variable ? 'true text' : 'false text'}
        $string = preg_replace_callback(
            '/\$\{\s*(\w+)\s*\?\s*["\']([^"\']*)["\']?\s*\+?\s*\1?\s*["\']?([^"\']*)?["\']\s*:\s*["\']([^"\']*)["\']?\s*\}/',
            function($matches) use ($variables) {
                $key = $matches[1];
                $has_value = isset($variables[$key]) && $variables[$key] !== '' && $variables[$key] !== null;

                if ($has_value) {
                    // Combine prefix + value + suffix
                    $prefix = isset($matches[2]) ? $matches[2] : '';
                    $suffix = isset($matches[3]) ? $matches[3] : '';
                    return $prefix . $variables[$key] . $suffix;
                } else {
                    // Return the false case
                    return isset($matches[4]) ? $matches[4] : '';
                }
            },
            $string
        );

        // 2. Handle conditional prefix: ${?key:prefix text }
        // If key has value, outputs "prefix text VALUE"
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

        // 3. Handle simple ${key} format
        foreach ($variables as $key => $value) {
            if ($value === null) {
                $value = '';
            }
            $string = str_replace('${' . $key . '}', $value, $string);
            $string = str_replace('{' . $key . '}', $value, $string);
        }

        // 4. Clean up any remaining unresolved template expressions
        // Remove any ${...} that weren't matched (to avoid showing raw templates)
        $string = preg_replace('/\$\{[^}]+\?\s*["\'][^"\']*["\']\s*:\s*["\'][^"\']*["\']\s*\}/', '', $string);

        // Clean up double spaces that might result from empty replacements
        $string = preg_replace('/\s{2,}/', ' ', $string);
        $string = trim($string);

        return $string;
    }

    /**
     * Get default question generation prompt
     */
    private function get_default_question_prompt() {
        return 'Generiere realistische Interviewfragen.

Richtlinien:
1. Beginne mit einer Einstiegsfrage
2. Mische verschiedene Fragetypen
3. Passe die Schwierigkeit an das Erfahrungslevel an
4. Ende mit einer Frage nach offenen Punkten';
    }

    /**
     * Get default feedback prompt
     */
    private function get_default_feedback_prompt() {
        return 'Bewerte die Antwort.

Fokussiere auf:
- Inhaltliche Qualität
- Struktur und Klarheit
- Relevanz zur Frage
- Konkrete Beispiele

Sei konstruktiv und motivierend. Verwende die "Du"-Form.';
    }

    /**
     * Build question generation prompt
     *
     * @param string $system_prompt The system prompt for the AI
     * @param string $question_prompt Additional question generation instructions
     * @param array $variables User-provided variables
     * @param int $count Number of questions/situations to generate
     * @param string $mode Scenario mode: 'INTERVIEW' or 'SIMULATION'
     * @return string The complete prompt
     */
    private function build_question_generation_prompt($system_prompt, $question_prompt, $variables, $count, $mode = 'INTERVIEW') {
        $context = '';
        if ($variables) {
            $context = "\n\nKontext:\n";
            foreach ($variables as $key => $value) {
                if ($value) {
                    $context .= "- " . ucfirst(str_replace('_', ' ', $key)) . ": {$value}\n";
                }
            }
        }

        // Select prompt template based on mode
        if ($mode === 'SIMULATION') {
            $mode_prompt = $this->get_simulation_prompt_template($count);
        } else {
            $mode_prompt = $this->get_interview_prompt_template($count);
        }

        return "{$system_prompt}

{$question_prompt}
{$context}
{$mode_prompt}

JSON Output:";
    }

    /**
     * Get the interview prompt template (existing behavior)
     */
    private function get_interview_prompt_template($count) {
        return "Generiere genau {$count} Interviewfragen.

WICHTIG: Für JEDE Frage generiere auch 2-3 spezifische Tipps, die dem Bewerber helfen, diese konkrete Frage gut zu beantworten. Die Tipps sollen:
- Konkret auf die jeweilige Frage zugeschnitten sein
- Praktische Hinweise geben, was in der Antwort enthalten sein sollte
- Beispielformulierungen oder Strukturvorschläge enthalten

Antworte NUR mit einem JSON-Array im folgenden Format:
[
  {
    \"index\": 0,
    \"question\": \"Die Interviewfrage\",
    \"category\": \"Kategorie (z.B. Einstieg, Motivation, Fachlich, Soft Skills)\",
    \"estimated_answer_time\": 90,
    \"tips\": [
      \"Tipp 1: Konkreter, hilfreicher Tipp für diese spezifische Frage\",
      \"Tipp 2: Weiterer praktischer Hinweis mit Beispielformulierung\"
    ]
  }
]";
    }

    /**
     * Get the simulation prompt template (new behavior for roleplay/counterpart scenarios)
     */
    private function get_simulation_prompt_template($count) {
        return "Generiere einen realistischen Gesprächsverlauf mit genau {$count} aufeinanderfolgenden Phasen/Situationen.

WICHTIG: Das ist KEIN Interview. Du stellst KEINE Fragen an den Nutzer. Du bist der Gegenspieler (z.B. Kunde, Klient, Mitarbeiter) und generierst Aussagen, Einwände oder emotionale Reaktionen, auf die der Nutzer reagieren muss.

Mapping der JSON-Felder:
- Feld \"question\": Hier trägst du die WÖRTLICHE REDE oder HANDLUNG deiner Rolle ein (z.B. \"Das ist mir zu teuer!\" oder \"*Schlägt wütend auf den Tisch*\").
- Feld \"tips\": Hier generierst du 2-3 taktische Verhaltenstipps für den Nutzer (z.B. \"Nicht rechtfertigen, sondern Spiegeln\", \"Verständnis zeigen\").
- Feld \"category\": Die Phase des Gesprächs (z.B. \"Konfrontation\", \"Einwand\", \"Lösungssuche\", \"Eskalation\", \"Deeskalation\").

Antworte NUR mit einem JSON-Array im folgenden Format:
[
  {
    \"index\": 0,
    \"question\": \"Die Aussage oder Handlung des Gegenübers\",
    \"category\": \"Phase\",
    \"estimated_answer_time\": 60,
    \"tips\": [
      \"Taktischer Tipp 1: Konkreter Verhaltenshinweis für diese Situation\",
      \"Taktischer Tipp 2: Weiterer praktischer Hinweis zur Reaktion\"
    ]
  }
]";
    }

    /**
     * Build audio analysis prompt
     */
    private function build_audio_analysis_prompt($question_text, $scenario, $variables, $feedback_prompt) {
        $context = '';
        if ($variables) {
            foreach ($variables as $key => $value) {
                if ($value) {
                    $context .= "- " . ucfirst(str_replace('_', ' ', $key)) . ": {$value}\n";
                }
            }
        }

        // Determine mode-specific text
        $mode = $scenario->mode ?? 'INTERVIEW';
        $isSimulation = ($mode === 'SIMULATION');

        $situationLabel = $isSimulation
            ? "SITUATION/AUSSAGE DES GEGENÜBERS (auf die der Nutzer reagiert hat)"
            : "FRAGE DIE BEANTWORTET WURDE";

        $analysisContext = $isSimulation
            ? "Du analysierst die REAKTION des Nutzers auf eine Gesprächssituation.
WICHTIG: Der Nutzer hat auf folgende Situation reagiert - transkribiere NUR was der NUTZER gesagt hat, NICHT die Situation selbst!
Die Situation ist nur der Kontext. Das Audio enthält die REAKTION des Nutzers darauf."
            : "Du analysierst die ANTWORT des Nutzers auf eine Interviewfrage.";

        $feedbackFocus = $isSimulation
            ? "Bewerte die Reaktion des Nutzers:
- Angemessenheit der Reaktion auf die Situation
- Kommunikationstechnik (Deeskalation, Empathie, Lösungsorientierung)
- Professionalität unter Druck"
            : "Bewerte die Antwort des Nutzers:
- Relevanz für die gestellte Frage
- STAR-Methode (Situation, Task, Action, Result)
- Professionalität und Selbstbewusstsein";

        return "Du bist ein professioneller Karriere-Coach und analysierst Audioantworten.

{$analysisContext}

ABSOLUTE REGEL - KEINE HALLUZINATION:
Du DARFST NUR transkribieren, was TATSÄCHLICH in der Audio-Datei gesprochen wird.
- Bei Stille, Rauschen, oder unverständlichem Audio: transcript = \"[Keine Sprache erkannt]\"
- Bei nur 1-2 Sekunden Audio ohne klare Sprache: transcript = \"[Keine Sprache erkannt]\"
- ERFINDE NIEMALS Wörter, Sätze oder Inhalte!
- Wenn du unsicher bist, ob etwas gesagt wurde: NICHT transkribieren!
- Wenn jemand nur \"Weiß ich nicht\" oder \"Keine Ahnung\" sagt, transkribiere GENAU DAS
- Eine kurze Antwort wie \"Ich weiß es nicht\" ist eine valide Transkription
- HALLUZINIERE KEINE ausführlichen Antworten wenn der Sprecher das nicht gesagt hat
- WIEDERHOLE NIEMALS die Frage oder Situation als Transkript - transkribiere NUR die Audioaufnahme!

AUFGABE (NUR bei klar erkennbarer Sprache):
1. TRANSKRIBIERE die Audioantwort EXAKT wie gesprochen (keine Erfindungen!)
2. ANALYSIERE die tatsächlich gegebene Antwort/Reaktion inhaltlich
3. ANALYSIERE die Sprechweise (Füllwörter, Tempo, Klarheit)
4. GEBE konstruktives Feedback basierend auf dem was WIRKLICH gesagt wurde

KONTEXT:
- Szenario: {$scenario->title}
{$context}

{$situationLabel}:
\"{$question_text}\"

{$feedbackFocus}

{$feedback_prompt}

WICHTIG: Antworte NUR mit einem JSON-Objekt im folgenden Format:

Bei KEINER erkennbaren Sprache (Stille, Rauschen, unverständlich):
{
  \"transcript\": \"[Keine Sprache erkannt]\",
  \"feedback\": {
    \"summary\": \"Es wurde keine Sprache erkannt. Bitte sprich deutlich ins Mikrofon.\",
    \"strengths\": [],
    \"improvements\": [\"Bitte versuche es erneut und sprich klar und deutlich ins Mikrofon.\"],
    \"tips\": [\"Achte darauf, dass dein Mikrofon funktioniert und nicht stummgeschaltet ist.\"],
    \"scores\": { \"content\": 0, \"structure\": 0, \"relevance\": 0, \"delivery\": 0, \"overall\": 0 }
  },
  \"audio_metrics\": {
    \"speech_rate\": \"keine_sprache\",
    \"filler_words\": { \"count\": 0, \"words\": [], \"severity\": \"keine\" },
    \"confidence_score\": 0,
    \"clarity_score\": 0,
    \"notes\": \"Keine Sprache erkannt\"
  }
}

Bei ERKANNTER Sprache:
{
  \"transcript\": \"EXAKTE Transkription was gesprochen wurde (z.B. 'Weiß ich grad nicht' wenn das gesagt wurde)\",
  \"feedback\": {
    \"summary\": \"Kurze Zusammenfassung der Antwortqualität (1-2 Sätze)\",
    \"strengths\": [
      \"Stärke 1: Konkrete positive Beobachtung\",
      \"Stärke 2: Was gut gemacht wurde\"
    ],
    \"improvements\": [
      \"Verbesserung 1: Was besser gemacht werden könnte\",
      \"Verbesserung 2: Konkreter Verbesserungsvorschlag\"
    ],
    \"tips\": [
      \"Tipp 1: Konkreter, umsetzbarer Ratschlag\",
      \"Tipp 2: Praktische Empfehlung\"
    ],
    \"scores\": {
      \"content\": 7.5,
      \"structure\": 8.0,
      \"relevance\": 7.0,
      \"delivery\": 7.5,
      \"overall\": 7.5
    }
  },
  \"audio_metrics\": {
    \"speech_rate\": \"optimal\",
    \"filler_words\": {
      \"count\": 3,
      \"words\": [\"ähm\", \"also\", \"halt\"],
      \"severity\": \"niedrig\"
    },
    \"confidence_score\": 75,
    \"clarity_score\": 80,
    \"notes\": \"Optionale zusätzliche Beobachtungen zur Sprechweise\"
  }
}

Bewertungsskala für Scores: 1-10 (1=sehr schwach, 10=exzellent)

AUDIO ZUR ANALYSE:";
    }

    /**
     * Call Gemini API (text only) with retry logic and model fallback
     */
    private function call_gemini_api($prompt, $api_key, $max_retries = 3) {
        // Model fallback order (same as Smart Briefing)
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

                error_log("[SIMULATOR] Gemini API call - Model: $model, Attempt: $attempt/$max_retries");

                $response = wp_remote_post($url, array(
                    'headers' => array('Content-Type' => 'application/json'),
                    'body' => json_encode($body),
                    'timeout' => 60,
                ));

                if (is_wp_error($response)) {
                    $last_error = $response;
                    error_log("[SIMULATOR] Gemini API WP Error: " . $response->get_error_message());
                    // Wait before retry
                    if ($attempt < $max_retries) {
                        sleep(pow(2, $attempt - 1)); // Exponential backoff: 1s, 2s
                    }
                    continue;
                }

                $response_code = wp_remote_retrieve_response_code($response);

                // Check for model not found - try next model
                if ($response_code === 404) {
                    error_log("[SIMULATOR] Model $model not found (404), trying next model...");
                    break; // Break retry loop, try next model
                }

                // Check for rate limit or server error - retry
                if ($response_code === 429 || $response_code >= 500) {
                    $error_body = wp_remote_retrieve_body($response);
                    error_log("[SIMULATOR] Gemini API Error ($response_code): $error_body");
                    $last_error = new WP_Error(
                        'api_error',
                        __('Gemini API Fehler: ', 'bewerbungstrainer') . $response_code,
                        array('status' => 500)
                    );
                    // Wait before retry
                    if ($attempt < $max_retries) {
                        sleep(pow(2, $attempt - 1)); // Exponential backoff: 1s, 2s
                    }
                    continue;
                }

                // Other error codes - don't retry
                if ($response_code !== 200) {
                    $error_body = wp_remote_retrieve_body($response);
                    error_log("[SIMULATOR] Gemini API Error ($response_code): $error_body");
                    return new WP_Error(
                        'api_error',
                        __('Gemini API Fehler: ', 'bewerbungstrainer') . $response_code,
                        array('status' => 500)
                    );
                }

                $response_body = wp_remote_retrieve_body($response);
                $data = json_decode($response_body, true);

                // Log full response structure for debugging
                error_log("[SIMULATOR] Gemini API response structure: " . substr(json_encode($data), 0, 500));

                // Check for safety blocks
                if (isset($data['candidates'][0]['finishReason']) && $data['candidates'][0]['finishReason'] === 'SAFETY') {
                    error_log("[SIMULATOR] Response blocked by safety filter!");
                    $last_error = new WP_Error(
                        'safety_blocked',
                        __('Antwort wurde durch Sicherheitsfilter blockiert.', 'bewerbungstrainer'),
                        array('status' => 500)
                    );
                    if ($attempt < $max_retries) {
                        sleep(1);
                    }
                    continue;
                }

                // Check for empty candidates
                if (empty($data['candidates'])) {
                    error_log("[SIMULATOR] No candidates in response! Full response: " . json_encode($data));
                    $last_error = new WP_Error(
                        'no_candidates',
                        __('Keine Antwort von Gemini erhalten.', 'bewerbungstrainer'),
                        array('status' => 500)
                    );
                    if ($attempt < $max_retries) {
                        sleep(1);
                    }
                    continue;
                }

                if (!isset($data['candidates'][0]['content']['parts'][0]['text'])) {
                    error_log("[SIMULATOR] Invalid response structure. Candidate: " . json_encode($data['candidates'][0]));
                    $last_error = new WP_Error(
                        'invalid_response',
                        __('Ungültige Antwort von Gemini API.', 'bewerbungstrainer'),
                        array('status' => 500)
                    );
                    // Wait before retry
                    if ($attempt < $max_retries) {
                        sleep(1);
                    }
                    continue;
                }

                // Success!
                $text_response = $data['candidates'][0]['content']['parts'][0]['text'];
                error_log("[SIMULATOR] Gemini API success with model: $model, response length: " . strlen($text_response));
                return $text_response;
            }
        }

        // All models and retries exhausted
        error_log("[SIMULATOR] Gemini API failed after all retries and model fallbacks");
        return $last_error ?: new WP_Error(
            'api_error',
            __('Gemini API ist nicht verfügbar.', 'bewerbungstrainer'),
            array('status' => 500)
        );
    }

    /**
     * Call Gemini API with multimodal content (audio + text)
     */
    private function call_gemini_multimodal($prompt, $audio_data, $mime_type, $api_key) {
        $url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=' . $api_key;

        // Convert audio to base64
        $audio_base64 = base64_encode($audio_data);

        $body = array(
            'contents' => array(
                array(
                    'parts' => array(
                        array('text' => $prompt),
                        array(
                            'inline_data' => array(
                                'mime_type' => $mime_type,
                                'data' => $audio_base64
                            )
                        )
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

        error_log('Simulator: Sending multimodal request to Gemini...');
        error_log('Simulator: Audio size: ' . strlen($audio_data) . ' bytes');
        error_log('Simulator: MIME type: ' . $mime_type);

        $response = wp_remote_post($url, array(
            'headers' => array('Content-Type' => 'application/json'),
            'body' => json_encode($body),
            'timeout' => 120,
        ));

        if (is_wp_error($response)) {
            error_log('Simulator: Gemini request failed: ' . $response->get_error_message());
            return $response;
        }

        $response_code = wp_remote_retrieve_response_code($response);
        if ($response_code !== 200) {
            $error_body = wp_remote_retrieve_body($response);
            error_log('Simulator: Gemini API Error (Code ' . $response_code . '): ' . $error_body);
            return new WP_Error(
                'api_error',
                __('Gemini API Fehler: ', 'bewerbungstrainer') . $response_code,
                array('status' => 500)
            );
        }

        $response_body = wp_remote_retrieve_body($response);
        $data = json_decode($response_body, true);

        if (!isset($data['candidates'][0]['content']['parts'][0]['text'])) {
            error_log('Simulator: Invalid Gemini response structure');
            return new WP_Error(
                'invalid_response',
                __('Ungültige Antwort von Gemini API.', 'bewerbungstrainer'),
                array('status' => 500)
            );
        }

        error_log('Simulator: Gemini multimodal request successful');
        return $data['candidates'][0]['content']['parts'][0]['text'];
    }

    /**
     * Parse questions response from Gemini
     */
    private function parse_questions_response($response) {
        error_log("[SIMULATOR_PARSE] Starting to parse questions response");
        error_log("[SIMULATOR_PARSE] Response length: " . strlen($response));

        // Clean response: remove markdown code blocks if present
        $cleaned_response = $response;

        // Remove ```json ... ``` wrapper
        if (preg_match('/```(?:json)?\s*([\s\S]*?)\s*```/', $response, $markdown_match)) {
            $cleaned_response = $markdown_match[1];
            error_log("[SIMULATOR_PARSE] Removed markdown code block wrapper");
        }

        // Remove any leading/trailing whitespace
        $cleaned_response = trim($cleaned_response);

        // Try to extract JSON array from response
        $json_match = null;

        // Try to find JSON array
        if (preg_match('/\[[\s\S]*\]/', $cleaned_response, $json_match)) {
            $json_str = $json_match[0];
            error_log("[SIMULATOR_PARSE] Found JSON array, length: " . strlen($json_str));
            $questions = json_decode($json_str, true);

            if (json_last_error() === JSON_ERROR_NONE && is_array($questions)) {
                error_log("[SIMULATOR_PARSE] Successfully parsed " . count($questions) . " questions from JSON array");
                return $questions;
            } else {
                error_log("[SIMULATOR_PARSE] JSON decode failed: " . json_last_error_msg());
                error_log("[SIMULATOR_PARSE] JSON string preview: " . substr($json_str, 0, 300));
            }
        } else {
            error_log("[SIMULATOR_PARSE] No JSON array found in cleaned response");
        }

        // Try to find JSON object with questions array
        if (preg_match('/\{[\s\S]*"questions"[\s\S]*\}/', $cleaned_response, $json_match)) {
            $json_str = $json_match[0];
            error_log("[SIMULATOR_PARSE] Found JSON object with questions key");
            $data = json_decode($json_str, true);

            if (json_last_error() === JSON_ERROR_NONE && isset($data['questions'])) {
                error_log("[SIMULATOR_PARSE] Successfully parsed " . count($data['questions']) . " questions from JSON object");
                return $data['questions'];
            } else {
                error_log("[SIMULATOR_PARSE] JSON object decode failed: " . json_last_error_msg());
            }
        } else {
            error_log("[SIMULATOR_PARSE] No JSON object with questions key found");
        }

        error_log("[SIMULATOR_PARSE] FAILED to parse questions!");
        error_log("[SIMULATOR_PARSE] Full response (first 1000 chars): " . substr($response, 0, 1000));
        return array();
    }

    /**
     * Parse audio analysis response from Gemini
     */
    private function parse_audio_analysis_response($response) {
        // Default structure
        $default = array(
            'transcript' => '',
            'feedback' => array(
                'summary' => 'Feedback konnte nicht generiert werden.',
                'strengths' => array(),
                'improvements' => array(),
                'tips' => array(),
                'scores' => array(
                    'content' => null,
                    'structure' => null,
                    'relevance' => null,
                    'delivery' => null,
                    'overall' => null
                )
            ),
            'audio_metrics' => array(
                'speech_rate' => 'unbekannt',
                'filler_words' => array('count' => 0, 'words' => array()),
                'confidence_score' => null,
                'clarity_score' => null
            )
        );

        // Try to extract JSON from response
        $json_match = null;
        if (preg_match('/\{[\s\S]*\}/', $response, $json_match)) {
            $json_str = $json_match[0];
            $parsed = json_decode($json_str, true);

            if (json_last_error() === JSON_ERROR_NONE) {
                return array(
                    'transcript' => isset($parsed['transcript']) ? $parsed['transcript'] : $default['transcript'],
                    'feedback' => isset($parsed['feedback']) ? $parsed['feedback'] : $default['feedback'],
                    'audio_metrics' => isset($parsed['audio_metrics']) ? $parsed['audio_metrics'] : $default['audio_metrics'],
                );
            }
        }

        error_log('Simulator: Failed to parse audio analysis from response: ' . substr($response, 0, 500));
        return $default;
    }
}
