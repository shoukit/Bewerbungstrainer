<?php
/**
 * Video Training REST API Class
 *
 * Handles all REST API endpoints for the Video Training feature
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

class Bewerbungstrainer_Video_Training_API {

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
     * Video handler instance
     */
    private $video_handler;

    /**
     * Gemini handler instance
     */
    private $gemini_handler;

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
        $this->db = Bewerbungstrainer_Video_Training_Database::get_instance();
        $this->video_handler = Bewerbungstrainer_Video_Handler::get_instance();

        add_action('rest_api_init', array($this, 'register_routes'));
    }

    /**
     * Register REST API routes
     */
    public function register_routes() {
        // ===== Scenario Endpoints =====

        // Get all scenarios
        register_rest_route($this->namespace, '/video-training/scenarios', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_scenarios'),
            'permission_callback' => array($this, 'allow_all_users'),
        ));

        // Get specific scenario
        register_rest_route($this->namespace, '/video-training/scenarios/(?P<id>\d+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_scenario'),
            'permission_callback' => array($this, 'allow_all_users'),
        ));

        // ===== Session Endpoints =====

        // Create video training session
        register_rest_route($this->namespace, '/video-training/sessions', array(
            'methods' => 'POST',
            'callback' => array($this, 'create_session'),
            'permission_callback' => array($this, 'allow_all_users'),
        ));

        // Generate questions for session
        register_rest_route($this->namespace, '/video-training/sessions/(?P<id>\d+)/questions', array(
            'methods' => 'POST',
            'callback' => array($this, 'generate_questions'),
            'permission_callback' => array($this, 'allow_all_users'),
        ));

        // Upload video for session
        register_rest_route($this->namespace, '/video-training/sessions/(?P<id>\d+)/video', array(
            'methods' => 'POST',
            'callback' => array($this, 'upload_video'),
            'permission_callback' => array($this, 'allow_all_users'),
        ));

        // Analyze video and generate feedback
        register_rest_route($this->namespace, '/video-training/sessions/(?P<id>\d+)/analyze', array(
            'methods' => 'POST',
            'callback' => array($this, 'analyze_video'),
            'permission_callback' => array($this, 'allow_all_users'),
        ));

        // Update session (status, progress, timeline)
        register_rest_route($this->namespace, '/video-training/sessions/(?P<id>\d+)', array(
            'methods' => 'PUT',
            'callback' => array($this, 'update_session'),
            'permission_callback' => array($this, 'allow_all_users'),
        ));

        // Get specific session
        register_rest_route($this->namespace, '/video-training/sessions/(?P<id>\d+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_session'),
            'permission_callback' => array($this, 'allow_all_users'),
        ));

        // Get all sessions for user
        register_rest_route($this->namespace, '/video-training/sessions', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_sessions'),
            'permission_callback' => array($this, 'check_user_logged_in'),
        ));

        // Delete session
        register_rest_route($this->namespace, '/video-training/sessions/(?P<id>\d+)', array(
            'methods' => 'DELETE',
            'callback' => array($this, 'delete_session'),
            'permission_callback' => array($this, 'check_user_logged_in'),
        ));

        // Complete session
        register_rest_route($this->namespace, '/video-training/sessions/(?P<id>\d+)/complete', array(
            'methods' => 'POST',
            'callback' => array($this, 'complete_session'),
            'permission_callback' => array($this, 'allow_all_users'),
        ));

        // Export session as PDF
        register_rest_route($this->namespace, '/video-training/sessions/(?P<id>\d+)/export-pdf', array(
            'methods' => 'POST',
            'callback' => array($this, 'export_session_pdf'),
            'permission_callback' => array($this, 'check_user_logged_in'),
        ));
    }

    // Note: Permission callbacks (check_user_logged_in, allow_all_users, etc.)
    // are provided by Bewerbungstrainer_API_Utils trait

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
            'scenario_type' => isset($params['scenario_type']) ? $params['scenario_type'] : null,
            'is_active' => 1,
        );

        $scenarios = $this->db->get_scenarios($args);

        // Format for frontend
        $formatted = array_map(function($scenario) {
            // Parse tips JSON if it's a string
            $tips = null;
            if (!empty($scenario->tips)) {
                if (is_string($scenario->tips)) {
                    $tips = json_decode($scenario->tips, true);
                    if (json_last_error() !== JSON_ERROR_NONE) {
                        $tips = null;
                    }
                } else {
                    $tips = $scenario->tips;
                }
            }

            return array(
                'id' => (int) $scenario->id,
                'title' => $scenario->title,
                'description' => $scenario->description,
                'long_description' => $scenario->long_description ?? null,
                'icon' => $scenario->icon,
                'difficulty' => $scenario->difficulty,
                'category' => Bewerbungstrainer_Categories_Admin::get_categories_array($scenario->category),
                'scenario_type' => $scenario->scenario_type,
                'input_configuration' => $scenario->input_configuration,
                'question_count' => (int) $scenario->question_count,
                'time_limit_per_question' => (int) $scenario->time_limit_per_question,
                'total_time_limit' => (int) $scenario->total_time_limit,
                'enable_tips' => (bool) $scenario->enable_tips,
                'enable_navigation' => (bool) $scenario->enable_navigation,
                'target_audience' => $scenario->target_audience ?? '',
                'tips' => $tips,
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

        // Parse tips JSON if it's a string
        $tips = null;
        if (!empty($scenario->tips)) {
            if (is_string($scenario->tips)) {
                $tips = json_decode($scenario->tips, true);
                if (json_last_error() !== JSON_ERROR_NONE) {
                    $tips = null;
                }
            } else {
                $tips = $scenario->tips;
            }
        }

        return new WP_REST_Response(array(
            'success' => true,
            'data' => array(
                'id' => (int) $scenario->id,
                'title' => $scenario->title,
                'description' => $scenario->description,
                'long_description' => $scenario->long_description ?? null,
                'icon' => $scenario->icon,
                'difficulty' => $scenario->difficulty,
                'category' => Bewerbungstrainer_Categories_Admin::get_categories_array($scenario->category),
                'scenario_type' => $scenario->scenario_type,
                'system_prompt' => $scenario->system_prompt,
                'input_configuration' => $scenario->input_configuration,
                'question_count' => (int) $scenario->question_count,
                'time_limit_per_question' => (int) $scenario->time_limit_per_question,
                'total_time_limit' => (int) $scenario->total_time_limit,
                'enable_tips' => (bool) $scenario->enable_tips,
                'enable_navigation' => (bool) $scenario->enable_navigation,
                'tips' => $tips,
            ),
        ), 200);
    }

    // =========================================================================
    // SESSION ENDPOINTS
    // =========================================================================

    /**
     * Create a new video training session
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
                    'scenario_title' => $session->scenario_title,
                    'status' => $session->status,
                ),
            ),
        ), 201);
    }

    /**
     * Generate questions for a session using Gemini
     */
    public function generate_questions($request) {
        $session_id = intval($request['id']);
        $session = $this->db->get_session($session_id);

        if (!$session) {
            return new WP_Error(
                'not_found',
                __('Sitzung nicht gefunden.', 'bewerbungstrainer'),
                array('status' => 404)
            );
        }

        // Get scenario
        $scenario = $this->db->get_scenario($session->scenario_id);
        if (!$scenario) {
            return new WP_Error(
                'scenario_not_found',
                __('Szenario nicht gefunden.', 'bewerbungstrainer'),
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

        // Build prompt with variable interpolation
        $variables = $session->variables_json ?: array();
        $system_prompt = $this->interpolate_variables($scenario->system_prompt, $variables);
        $question_prompt = $scenario->question_generation_prompt ?: $this->get_default_question_prompt($scenario->scenario_type);
        $question_prompt = $this->interpolate_variables($question_prompt, $variables);

        // Build full prompt
        $full_prompt = $this->build_video_question_prompt(
            $system_prompt,
            $question_prompt,
            $variables,
            $scenario->question_count,
            $scenario->time_limit_per_question,
            $scenario->scenario_type
        );

        // Log prompt to prompts.log
        if (function_exists('bewerbungstrainer_log_prompt')) {
            bewerbungstrainer_log_prompt(
                'VIDEO_TRAINING_QUESTIONS',
                'Wirkungs-Analyse: Generierung von Interview-Fragen für Video-Training basierend auf Szenario und Benutzervariablen.',
                $full_prompt,
                array(
                    'Szenario' => $scenario->title,
                    'Szenario-ID' => $scenario->id,
                    'Szenario-Typ' => $scenario->scenario_type,
                    'Anzahl Fragen' => $scenario->question_count,
                    'Zeit pro Frage' => $scenario->time_limit_per_question . 's',
                    'Variablen' => $variables,
                    'Session-ID' => $session_id,
                )
            );
        }

        // Call Gemini API
        $response = $this->call_gemini_api($full_prompt, $api_key);

        if (is_wp_error($response)) {
            // Log error response
            if (function_exists('bewerbungstrainer_log_response')) {
                bewerbungstrainer_log_response('VIDEO_TRAINING_QUESTIONS', $response->get_error_message(), true);
            }
            return $response;
        }

        // Log successful response
        if (function_exists('bewerbungstrainer_log_response')) {
            bewerbungstrainer_log_response('VIDEO_TRAINING_QUESTIONS', $response);
        }

        // Parse questions from response
        $questions = $this->parse_questions_response($response);

        if (empty($questions)) {
            return new WP_Error(
                'generation_failed',
                __('Fehler beim Generieren der Fragen.', 'bewerbungstrainer'),
                array('status' => 500)
            );
        }

        // Update session with questions
        $this->db->update_session($session_id, array(
            'questions_json' => $questions,
            'status' => 'recording',
            'started_at' => current_time('mysql'),
        ));

        // Refresh session
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
     * Upload video for a session
     */
    public function upload_video($request) {
        $session_id = intval($request['id']);
        $session = $this->db->get_session($session_id);

        if (!$session) {
            return new WP_Error(
                'not_found',
                __('Sitzung nicht gefunden.', 'bewerbungstrainer'),
                array('status' => 404)
            );
        }

        // Handle video upload - check for file upload or base64
        $files = $request->get_file_params();
        $video_file = isset($files['video']) ? $files['video'] : null;

        $body_params = $request->get_json_params();
        if (empty($body_params)) {
            $body_params = $request->get_params();
        }
        $video_base64 = isset($body_params['video_base64']) ? $body_params['video_base64'] : null;

        if (!$video_file && !$video_base64) {
            return new WP_Error(
                'missing_video',
                __('Video-Datei ist erforderlich.', 'bewerbungstrainer'),
                array('status' => 400)
            );
        }

        $upload_result = null;

        if ($video_base64) {
            // Handle base64 video
            $video_data = base64_decode($video_base64);
            $mime_type = isset($body_params['video_mime_type']) ? $body_params['video_mime_type'] : 'video/webm';
            $upload_result = $this->video_handler->upload_video_blob($video_data, $session->session_id, $mime_type);
        } elseif ($video_file) {
            // Handle file upload
            $upload_result = $this->video_handler->upload_video($video_file, $session->session_id);
        }

        if (is_wp_error($upload_result)) {
            return $upload_result;
        }

        // Update session with video info
        $update_data = array(
            'video_filename' => $upload_result['filename'],
            'video_url' => $upload_result['url'],
            'status' => 'processing',
        );

        // Timeline from request
        if (isset($body_params['timeline'])) {
            $update_data['timeline_json'] = $body_params['timeline'];
        }

        // Video duration
        if (isset($body_params['video_duration'])) {
            $update_data['video_duration_seconds'] = intval($body_params['video_duration']);
        }

        $this->db->update_session($session_id, $update_data);

        $session = $this->db->get_session($session_id);

        return new WP_REST_Response(array(
            'success' => true,
            'data' => array(
                'session' => $this->format_session($session),
                'video_url' => $upload_result['url'],
            ),
        ), 200);
    }

    /**
     * Analyze video and generate feedback using Gemini
     */
    public function analyze_video($request) {
        $session_id = intval($request['id']);
        $session = $this->db->get_session($session_id);

        if (!$session) {
            return new WP_Error(
                'not_found',
                __('Sitzung nicht gefunden.', 'bewerbungstrainer'),
                array('status' => 404)
            );
        }

        if (!$session->video_filename) {
            return new WP_Error(
                'no_video',
                __('Kein Video vorhanden.', 'bewerbungstrainer'),
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

        // Get scenario
        $scenario = $this->db->get_scenario($session->scenario_id);
        $variables = $session->variables_json ?: array();

        // Get video file path
        $video_path = $this->video_handler->get_video_path($session->video_filename);

        if (!$video_path) {
            return new WP_Error(
                'video_not_found',
                __('Video-Datei nicht gefunden.', 'bewerbungstrainer'),
                array('status' => 404)
            );
        }

        // Build analysis prompt
        $feedback_prompt = $scenario->feedback_prompt ?: $this->get_default_feedback_prompt($scenario->scenario_type);
        $feedback_prompt = $this->interpolate_variables($feedback_prompt, $variables);

        $analysis_prompt = $this->build_video_analysis_prompt(
            $scenario,
            $variables,
            $session->questions_json ?: array(),
            $session->timeline_json ?: array(),
            $feedback_prompt
        );

        // Log prompt to prompts.log
        if (function_exists('bewerbungstrainer_log_prompt')) {
            bewerbungstrainer_log_prompt(
                'VIDEO_TRAINING_ANALYSIS',
                'Wirkungs-Analyse: Video-Analyse mit Gemini. Bewertet Auftreten, Selbstbewusstsein, Körpersprache, Kommunikation, Professionalität.',
                $analysis_prompt,
                array(
                    'Szenario' => $scenario->title,
                    'Szenario-Typ' => $scenario->scenario_type,
                    'Anzahl Fragen' => count($session->questions_json ?: array()),
                    'Video-Datei' => $session->video_filename,
                    'Variablen' => $variables,
                    'Session-ID' => $session_id,
                    'Bewertungskategorien' => 'Auftreten, Selbstbewusstsein, Körpersprache, Kommunikation, Professionalität, Inhalt',
                )
            );
        }

        // Upload video to Gemini File API and analyze
        $analysis_result = $this->analyze_video_with_gemini($video_path, $analysis_prompt, $api_key);

        if (is_wp_error($analysis_result)) {
            // Log error response
            if (function_exists('bewerbungstrainer_log_response')) {
                bewerbungstrainer_log_response('VIDEO_TRAINING_ANALYSIS', $analysis_result->get_error_message(), true);
            }
            // Update session with error status
            $this->db->update_session($session_id, array(
                'status' => 'failed',
            ));
            return $analysis_result;
        }

        // Log successful response
        if (function_exists('bewerbungstrainer_log_response')) {
            bewerbungstrainer_log_response('VIDEO_TRAINING_ANALYSIS', $analysis_result);
        }

        // Parse analysis response
        $parsed = $this->parse_video_analysis_response($analysis_result);

        // Calculate overall score from category scores
        $overall_score = null;
        if (!empty($parsed['category_scores'])) {
            $scores = array_filter(array_column($parsed['category_scores'], 'score'), 'is_numeric');
            if (!empty($scores)) {
                $overall_score = round(array_sum($scores) / count($scores), 2);
            }
        }

        // Update session with analysis results
        $this->db->update_session($session_id, array(
            'transcript' => $parsed['transcript'],
            'analysis_json' => $parsed['analysis'],
            'overall_score' => $overall_score,
            'category_scores_json' => $parsed['category_scores'],
            'summary_feedback' => $parsed['summary'],
            'status' => 'completed',
            'completed_at' => current_time('mysql'),
        ));

        $session = $this->db->get_session($session_id);

        return new WP_REST_Response(array(
            'success' => true,
            'data' => array(
                'session' => $this->format_session($session),
                'analysis' => $parsed['analysis'],
                'transcript' => $parsed['transcript'],
                'category_scores' => $parsed['category_scores'],
                'overall_score' => $overall_score,
                'summary' => $parsed['summary'],
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

        $allowed_updates = array(
            'status', 'current_question_index', 'timeline_json'
        );

        foreach ($allowed_updates as $field) {
            if (isset($params[$field])) {
                $update_data[$field] = $params[$field];
            }
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
     * Complete session
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

        // Mark as completed
        $this->db->update_session($session_id, array(
            'status' => 'completed',
            'completed_at' => current_time('mysql'),
        ));

        $session = $this->db->get_session($session_id);

        return new WP_REST_Response(array(
            'success' => true,
            'data' => array(
                'session' => $this->format_session($session),
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
            'scenario_type' => $session->scenario_type,
            'variables' => $session->variables_json,
            'questions' => $session->questions_json,
            'timeline' => $session->timeline_json,
            'current_question_index' => (int) $session->current_question_index,
            'status' => $session->status,
            'video_url' => $session->video_url,
            'video_duration_seconds' => $session->video_duration_seconds ? (int) $session->video_duration_seconds : null,
            'thumbnail_url' => $session->thumbnail_url,
            'transcript' => $session->transcript,
            'analysis' => $session->analysis_json,
            'overall_score' => $session->overall_score ? (float) $session->overall_score : null,
            'category_scores' => $session->category_scores_json,
            'summary_feedback' => $session->summary_feedback,
            'started_at' => $session->started_at,
            'completed_at' => $session->completed_at,
            'created_at' => $session->created_at,
        );
    }

    /**
     * Interpolate variables in a string
     */
    private function interpolate_variables($string, $variables) {
        if (!$variables || !is_array($variables)) {
            return $string;
        }

        foreach ($variables as $key => $value) {
            // Handle ${key} format
            $string = str_replace('${' . $key . '}', $value, $string);
            // Handle {key} format
            $string = str_replace('{' . $key . '}', $value, $string);
        }

        return $string;
    }

    /**
     * Get default question generation prompt based on scenario type
     */
    private function get_default_question_prompt($scenario_type) {
        $prompts = array(
            'self_presentation' => 'Generiere Aufgaben für eine Video-Selbstpräsentation.

Aufgabentypen:
1. Elevator Pitch (30-60 Sekunden)
2. Beruflicher Werdegang
3. Stärken präsentieren
4. Motivation erklären
5. Zukunftsziele beschreiben',

            'interview' => 'Generiere realistische Video-Interviewfragen.

Richtlinien:
1. Beginne mit einer Einstiegsfrage
2. Mische verschiedene Fragetypen
3. Passe an das Erfahrungslevel an
4. Beziehe Position und Branche ein
5. Ende mit einer Abschlussfrage',

            'pitch' => 'Generiere Elevator Pitch Aufgaben.

Fokus auf:
- Prägnante Selbstpräsentation
- Kernbotschaft in kurzer Zeit
- Überzeugende Darstellung',

            'negotiation' => 'Generiere Verhandlungssimulations-Fragen.

Szenarien:
- Gehaltsverhandlung
- Einwandbehandlung
- Win-Win-Argumentation',

            'custom' => 'Generiere passende Fragen für das Video-Training.',
        );

        return isset($prompts[$scenario_type]) ? $prompts[$scenario_type] : $prompts['custom'];
    }

    /**
     * Get default feedback prompt based on scenario type
     */
    private function get_default_feedback_prompt($scenario_type) {
        $base_prompt = 'Analysiere das Video und gib konstruktives Feedback in der "Du"-Form.

WICHTIG: Bewerte SOWOHL den INHALT der Antworten ALS AUCH die VISUELLE PRÄSENTATION.';

        $type_specific = array(
            'self_presentation' => '

Fokussiere auf:
- Erste Eindrücke und Gesamtwirkung
- Körpersprache (Haltung, Gestik, Mimik)
- Augenkontakt zur Kamera
- Sprechweise und Klarheit
- Struktur der Präsentation
- Authentizität und Selbstbewusstsein',

            'interview' => '

Bewerte:
- Inhaltliche Qualität der Antworten
- STAR-Methode Anwendung
- Körpersprache und Mimik
- Professionelles Erscheinungsbild
- Sprechweise und Überzeugungskraft',

            'pitch' => '

Kriterien:
- Einhaltung der Zeitvorgabe
- Klare Kernbotschaft
- Überzeugungskraft und Energie
- Körpersprache
- Memorability',
        );

        $specific = isset($type_specific[$scenario_type]) ? $type_specific[$scenario_type] : '';

        return $base_prompt . $specific;
    }

    /**
     * Build video question generation prompt
     */
    private function build_video_question_prompt($system_prompt, $question_prompt, $variables, $count, $time_limit, $scenario_type) {
        $context = '';
        if ($variables) {
            $context = "\n\nKontext:\n";
            foreach ($variables as $key => $value) {
                if ($value) {
                    $context .= "- " . ucfirst(str_replace('_', ' ', $key)) . ": {$value}\n";
                }
            }
        }

        return "{$system_prompt}

{$question_prompt}
{$context}
Generiere genau {$count} Fragen/Aufgaben für ein Video-Training.
Jede Frage sollte in etwa {$time_limit} Sekunden beantwortet werden können.

WICHTIG: Für JEDE Frage generiere auch 2-3 hilfreiche Tipps.

Antworte NUR mit einem JSON-Array im folgenden Format:
[
  {
    \"index\": 0,
    \"question\": \"Die Frage oder Aufgabe\",
    \"category\": \"Kategorie (z.B. Einstieg, Kernkompetenz, Soft Skills)\",
    \"estimated_time\": {$time_limit},
    \"tips\": [
      \"Tipp 1: Konkreter, hilfreicher Tipp\",
      \"Tipp 2: Weiterer praktischer Hinweis\"
    ]
  }
]

JSON Output:";
    }

    /**
     * Build video analysis prompt
     */
    private function build_video_analysis_prompt($scenario, $variables, $questions, $timeline, $feedback_prompt) {
        $questions_text = '';
        if (!empty($questions)) {
            $questions_text = "\n\nGESTELLTE FRAGEN:\n";
            foreach ($questions as $i => $q) {
                $question_text = is_array($q) ? ($q['question'] ?? 'Frage ' . ($i + 1)) : $q;
                $questions_text .= ($i + 1) . ". {$question_text}\n";
            }
        }

        $timeline_text = '';
        if (!empty($timeline)) {
            $timeline_text = "\n\nZEITLINIE DER AUFNAHME:\n";
            foreach ($timeline as $entry) {
                if (isset($entry['question_index']) && isset($entry['start_time'])) {
                    $timeline_text .= "- Frage " . ($entry['question_index'] + 1) . ": Start bei " . gmdate("i:s", $entry['start_time']) . "\n";
                }
            }
        }

        $context = '';
        if ($variables) {
            $context = "\nKONTEXT:\n";
            foreach ($variables as $key => $value) {
                if ($value) {
                    $context .= "- " . ucfirst(str_replace('_', ' ', $key)) . ": {$value}\n";
                }
            }
        }

        return "Du bist ein professioneller Karriere-Coach und Video-Analyse-Experte.

AUFGABE: Analysiere das folgende Video eines {$scenario->title}-Trainings.
{$context}
{$questions_text}
{$timeline_text}

{$feedback_prompt}

ANALYSE-KATEGORIEN:
1. **Auftreten** - Erste Eindrücke, Gesamtwirkung, Professionalität
2. **Selbstbewusstsein** - Sicherheit, Überzeugungskraft, Authentizität
3. **Körpersprache** - Haltung, Gestik, Mimik, Augenkontakt
4. **Kommunikation** - Sprechweise, Klarheit, Struktur, Füllwörter
5. **Professionalität** - Erscheinungsbild, Hintergrund, Technik
6. **Inhalt** - Qualität der Antworten, Relevanz, Beispiele

WICHTIG: Antworte NUR mit einem JSON-Objekt im folgenden Format:

{
  \"transcript\": \"Vollständige Transkription dessen, was gesprochen wurde\",
  \"summary\": \"2-3 Sätze Gesamteindruck und wichtigste Erkenntnisse\",
  \"category_scores\": [
    {
      \"category\": \"auftreten\",
      \"label\": \"Auftreten\",
      \"score\": 75,
      \"feedback\": \"Detailliertes Feedback zu dieser Kategorie\",
      \"strengths\": [\"Stärke 1\", \"Stärke 2\"],
      \"improvements\": [\"Verbesserung 1\", \"Verbesserung 2\"]
    },
    {
      \"category\": \"selbstbewusstsein\",
      \"label\": \"Selbstbewusstsein\",
      \"score\": 70,
      \"feedback\": \"...\",
      \"strengths\": [],
      \"improvements\": []
    },
    {
      \"category\": \"koerpersprache\",
      \"label\": \"Körpersprache\",
      \"score\": 65,
      \"feedback\": \"...\",
      \"strengths\": [],
      \"improvements\": []
    },
    {
      \"category\": \"kommunikation\",
      \"label\": \"Kommunikation\",
      \"score\": 80,
      \"feedback\": \"...\",
      \"strengths\": [],
      \"improvements\": []
    },
    {
      \"category\": \"professionalitaet\",
      \"label\": \"Professionalität\",
      \"score\": 85,
      \"feedback\": \"...\",
      \"strengths\": [],
      \"improvements\": []
    },
    {
      \"category\": \"inhalt\",
      \"label\": \"Inhalt\",
      \"score\": 72,
      \"feedback\": \"...\",
      \"strengths\": [],
      \"improvements\": []
    }
  ],
  \"analysis\": {
    \"overall_impression\": \"Gesamteindruck der Präsentation\",
    \"key_strengths\": [\"Hauptstärke 1\", \"Hauptstärke 2\", \"Hauptstärke 3\"],
    \"priority_improvements\": [\"Wichtigste Verbesserung 1\", \"Wichtigste Verbesserung 2\"],
    \"actionable_tips\": [
      \"Konkreter, umsetzbarer Tipp 1\",
      \"Konkreter, umsetzbarer Tipp 2\",
      \"Konkreter, umsetzbarer Tipp 3\"
    ],
    \"filler_words\": {
      \"count\": 5,
      \"words\": [\"ähm\", \"also\"],
      \"severity\": \"niedrig\"
    },
    \"speech_metrics\": {
      \"pace\": \"optimal\",
      \"clarity\": 80,
      \"energy\": 75
    }
  }
}

Bewertungsskala für Scores: 0-100 (0=sehr schwach, 100=exzellent)
Verwende die \"Du\"-Form im Feedback.

VIDEO ZUR ANALYSE:";
    }

    /**
     * Analyze video with Gemini using File API
     */
    private function analyze_video_with_gemini($video_path, $prompt, $api_key) {
        // Step 1: Upload video to Gemini File API
        $upload_result = $this->upload_to_gemini_file_api($video_path, $api_key);

        if (is_wp_error($upload_result)) {
            return $upload_result;
        }

        $file_uri = $upload_result['file_uri'];

        // Step 2: Wait for file to be processed
        $file_state = $this->wait_for_file_processing($upload_result['name'], $api_key);

        if (is_wp_error($file_state)) {
            return $file_state;
        }

        // Step 3: Call Gemini with video reference
        return $this->call_gemini_with_video($prompt, $file_uri, $api_key);
    }

    /**
     * Upload file to Gemini File API
     */
    private function upload_to_gemini_file_api($file_path, $api_key) {
        $file_size = filesize($file_path);
        $mime_type = mime_content_type($file_path);

        // Start resumable upload
        $start_url = 'https://generativelanguage.googleapis.com/upload/v1beta/files?key=' . $api_key;

        $response = wp_remote_post($start_url, array(
            'headers' => array(
                'X-Goog-Upload-Protocol' => 'resumable',
                'X-Goog-Upload-Command' => 'start',
                'X-Goog-Upload-Header-Content-Length' => $file_size,
                'X-Goog-Upload-Header-Content-Type' => $mime_type,
                'Content-Type' => 'application/json',
            ),
            'body' => json_encode(array(
                'file' => array(
                    'display_name' => basename($file_path),
                )
            )),
            'timeout' => 30,
        ));

        if (is_wp_error($response)) {
            error_log('[VIDEO TRAINING] File API start upload failed: ' . $response->get_error_message());
            return $response;
        }

        $response_code = wp_remote_retrieve_response_code($response);
        if ($response_code !== 200) {
            $error_body = wp_remote_retrieve_body($response);
            error_log('[VIDEO TRAINING] File API start error: ' . $error_body);
            return new WP_Error('upload_start_failed', 'Failed to start upload: ' . $response_code);
        }

        $upload_url = wp_remote_retrieve_header($response, 'x-goog-upload-url');

        if (empty($upload_url)) {
            return new WP_Error('no_upload_url', 'No upload URL received from Gemini');
        }

        // Upload file content
        $file_content = file_get_contents($file_path);

        $upload_response = wp_remote_request($upload_url, array(
            'method' => 'POST',
            'headers' => array(
                'Content-Length' => $file_size,
                'X-Goog-Upload-Offset' => '0',
                'X-Goog-Upload-Command' => 'upload, finalize',
            ),
            'body' => $file_content,
            'timeout' => 300, // 5 minutes for large files
        ));

        if (is_wp_error($upload_response)) {
            error_log('[VIDEO TRAINING] File upload failed: ' . $upload_response->get_error_message());
            return $upload_response;
        }

        $upload_code = wp_remote_retrieve_response_code($upload_response);
        if ($upload_code !== 200) {
            $error_body = wp_remote_retrieve_body($upload_response);
            error_log('[VIDEO TRAINING] File upload error: ' . $error_body);
            return new WP_Error('upload_failed', 'File upload failed: ' . $upload_code);
        }

        $upload_data = json_decode(wp_remote_retrieve_body($upload_response), true);

        if (!isset($upload_data['file']['uri']) || !isset($upload_data['file']['name'])) {
            error_log('[VIDEO TRAINING] Invalid upload response: ' . print_r($upload_data, true));
            return new WP_Error('invalid_response', 'Invalid response from Gemini File API');
        }

        return array(
            'file_uri' => $upload_data['file']['uri'],
            'name' => $upload_data['file']['name'],
        );
    }

    /**
     * Wait for file to be processed
     */
    private function wait_for_file_processing($file_name, $api_key, $max_attempts = 30) {
        $url = 'https://generativelanguage.googleapis.com/v1beta/' . $file_name . '?key=' . $api_key;

        for ($i = 0; $i < $max_attempts; $i++) {
            $response = wp_remote_get($url, array('timeout' => 10));

            if (is_wp_error($response)) {
                error_log('[VIDEO TRAINING] File status check failed: ' . $response->get_error_message());
                sleep(2);
                continue;
            }

            $data = json_decode(wp_remote_retrieve_body($response), true);
            $state = isset($data['state']) ? $data['state'] : 'UNKNOWN';

            if ($state === 'ACTIVE') {
                return true;
            }

            if ($state === 'FAILED') {
                return new WP_Error('file_processing_failed', 'Video processing failed');
            }

            // Wait before next check
            sleep(2);
        }

        return new WP_Error('timeout', 'Video processing timeout');
    }

    /**
     * Call Gemini API with video reference
     */
    private function call_gemini_with_video($prompt, $file_uri, $api_key) {
        $url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=' . $api_key;

        $body = array(
            'contents' => array(
                array(
                    'parts' => array(
                        array('text' => $prompt),
                        array(
                            'file_data' => array(
                                'mime_type' => 'video/webm',
                                'file_uri' => $file_uri,
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

        error_log('[VIDEO TRAINING] Sending video analysis request to Gemini...');

        $response = wp_remote_post($url, array(
            'headers' => array('Content-Type' => 'application/json'),
            'body' => json_encode($body),
            'timeout' => 180, // 3 minutes for video analysis
        ));

        if (is_wp_error($response)) {
            error_log('[VIDEO TRAINING] Gemini request failed: ' . $response->get_error_message());
            return $response;
        }

        $response_code = wp_remote_retrieve_response_code($response);
        if ($response_code !== 200) {
            $error_body = wp_remote_retrieve_body($response);
            error_log('[VIDEO TRAINING] Gemini API Error: ' . $error_body);
            return new WP_Error('api_error', 'Gemini API Error: ' . $response_code);
        }

        $response_body = wp_remote_retrieve_body($response);
        $data = json_decode($response_body, true);

        if (!isset($data['candidates'][0]['content']['parts'][0]['text'])) {
            error_log('[VIDEO TRAINING] Invalid Gemini response structure');
            return new WP_Error('invalid_response', 'Invalid response from Gemini');
        }

        error_log('[VIDEO TRAINING] Video analysis successful');
        return $data['candidates'][0]['content']['parts'][0]['text'];
    }

    /**
     * Call Gemini API (text only)
     */
    private function call_gemini_api($prompt, $api_key) {
        $url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=' . $api_key;

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
                'maxOutputTokens' => 4096,
            )
        );

        $response = wp_remote_post($url, array(
            'headers' => array('Content-Type' => 'application/json'),
            'body' => json_encode($body),
            'timeout' => 60,
        ));

        if (is_wp_error($response)) {
            return $response;
        }

        $response_code = wp_remote_retrieve_response_code($response);
        if ($response_code !== 200) {
            $error_body = wp_remote_retrieve_body($response);
            error_log('[VIDEO TRAINING] Gemini API Error: ' . $error_body);
            return new WP_Error('api_error', 'Gemini API Error: ' . $response_code);
        }

        $response_body = wp_remote_retrieve_body($response);
        $data = json_decode($response_body, true);

        if (!isset($data['candidates'][0]['content']['parts'][0]['text'])) {
            return new WP_Error('invalid_response', 'Invalid response from Gemini');
        }

        return $data['candidates'][0]['content']['parts'][0]['text'];
    }

    /**
     * Parse questions response from Gemini
     */
    private function parse_questions_response($response) {
        // Try to extract JSON array from response
        if (preg_match('/\[[\s\S]*\]/', $response, $json_match)) {
            $json_str = $json_match[0];
            $questions = json_decode($json_str, true);

            if (json_last_error() === JSON_ERROR_NONE && is_array($questions)) {
                return $questions;
            }
        }

        error_log('[VIDEO TRAINING] Failed to parse questions: ' . substr($response, 0, 500));
        return array();
    }

    /**
     * Parse video analysis response from Gemini
     */
    private function parse_video_analysis_response($response) {
        $default = array(
            'transcript' => '',
            'summary' => 'Analyse konnte nicht generiert werden.',
            'category_scores' => array(),
            'analysis' => array(
                'overall_impression' => '',
                'key_strengths' => array(),
                'priority_improvements' => array(),
                'actionable_tips' => array(),
            ),
        );

        // Try to extract JSON from response
        if (preg_match('/\{[\s\S]*\}/', $response, $json_match)) {
            $json_str = $json_match[0];
            $parsed = json_decode($json_str, true);

            if (json_last_error() === JSON_ERROR_NONE) {
                return array(
                    'transcript' => isset($parsed['transcript']) ? $parsed['transcript'] : $default['transcript'],
                    'summary' => isset($parsed['summary']) ? $parsed['summary'] : $default['summary'],
                    'category_scores' => isset($parsed['category_scores']) ? $parsed['category_scores'] : $default['category_scores'],
                    'analysis' => isset($parsed['analysis']) ? $parsed['analysis'] : $default['analysis'],
                );
            }
        }

        error_log('[VIDEO TRAINING] Failed to parse analysis: ' . substr($response, 0, 500));
        return $default;
    }

    // =========================================================================
    // PDF EXPORT
    // =========================================================================

    /**
     * Export session as PDF
     */
    public function export_session_pdf($request) {
        $session_id = intval($request['id']);
        $user_id = get_current_user_id();

        // Get PDF exporter instance
        $pdf_exporter = Bewerbungstrainer_PDF_Exporter::get_instance();

        // Get PDF as base64 for REST API response
        $result = $pdf_exporter->get_video_session_pdf_base64($session_id, $user_id);

        if (is_wp_error($result)) {
            return new WP_REST_Response(array(
                'success' => false,
                'error' => $result->get_error_message(),
            ), 400);
        }

        return new WP_REST_Response(array(
            'success' => true,
            'pdf_base64' => $result['pdf_base64'],
            'filename' => $result['filename'],
            'content_type' => $result['content_type'],
        ), 200);
    }
}
