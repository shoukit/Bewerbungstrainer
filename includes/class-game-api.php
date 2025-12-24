<?php
/**
 * Game API Class
 *
 * Handles REST API endpoints for Rhetorik-Gym game sessions
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

class Bewerbungstrainer_Game_API {

    use Bewerbungstrainer_API_Utils;

    /**
     * Instance of this class
     */
    private static $instance = null;

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
        $this->db = Bewerbungstrainer_Game_Database::get_instance();
        add_action('rest_api_init', array($this, 'register_routes'));
    }

    /**
     * Register REST API routes
     */
    public function register_routes() {
        $namespace = 'bewerbungstrainer/v1';

        // ===== Scenario Templates =====

        // GET /game/templates - List all scenario templates
        register_rest_route($namespace, '/game/templates', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_scenario_templates'),
            'permission_callback' => array($this, 'check_user_logged_in'),
        ));

        // GET /game/templates/(?P<id>\d+) - Get specific template
        register_rest_route($namespace, '/game/templates/(?P<id>\d+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_scenario_template'),
            'permission_callback' => array($this, 'check_user_logged_in'),
        ));

        // GET /game/templates/categories - Get available categories
        register_rest_route($namespace, '/game/templates/categories', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_scenario_categories'),
            'permission_callback' => array($this, 'check_user_logged_in'),
        ));

        // ===== Game Sessions =====

        // POST /game/sessions - Create new game session
        register_rest_route($namespace, '/game/sessions', array(
            'methods' => 'POST',
            'callback' => array($this, 'create_game_session'),
            'permission_callback' => array($this, 'allow_all_users'),
        ));

        // GET /game/sessions - Get user's game sessions
        register_rest_route($namespace, '/game/sessions', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_game_sessions'),
            'permission_callback' => array($this, 'allow_all_users'),
        ));

        // GET /game/sessions/(?P<id>\d+) - Get specific session
        register_rest_route($namespace, '/game/sessions/(?P<id>\d+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_game_session'),
            'permission_callback' => array($this, 'check_user_logged_in'),
        ));

        // PUT /game/sessions/(?P<id>\d+) - Update game session
        register_rest_route($namespace, '/game/sessions/(?P<id>\d+)', array(
            'methods' => 'PUT',
            'callback' => array($this, 'update_game_session'),
            'permission_callback' => array($this, 'check_user_logged_in'),
        ));

        // DELETE /game/sessions/(?P<id>\d+) - Delete game session
        register_rest_route($namespace, '/game/sessions/(?P<id>\d+)', array(
            'methods' => 'DELETE',
            'callback' => array($this, 'delete_game_session'),
            'permission_callback' => array($this, 'check_user_logged_in'),
        ));

        // ===== Stats & Leaderboard =====

        // GET /game/stats - Get user's game stats
        register_rest_route($namespace, '/game/stats', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_user_stats'),
            'permission_callback' => array($this, 'allow_all_users'),
        ));

        // GET /game/leaderboard - Get leaderboard
        register_rest_route($namespace, '/game/leaderboard', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_leaderboard'),
            'permission_callback' => array($this, 'check_user_logged_in'),
        ));

        // GET /game/highscore - Get user's highscore
        register_rest_route($namespace, '/game/highscore', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_user_highscore'),
            'permission_callback' => array($this, 'check_user_logged_in'),
        ));
    }

    // Note: Permission callbacks (check_user_logged_in, allow_all_users, etc.)
    // are provided by Bewerbungstrainer_API_Utils trait

    // ===== Scenario Template Endpoints =====

    /**
     * Get all scenario templates
     */
    public function get_scenario_templates($request) {
        $args = array(
            'category' => $request->get_param('category'),
            'difficulty' => $request->get_param('difficulty'),
            'active_only' => $request->get_param('active_only') !== 'false',
        );

        $templates = $this->db->get_scenario_templates($args);

        // Parse JSON fields
        foreach ($templates as &$template) {
            if (!empty($template->wizard_config_json)) {
                $template->wizard_config = json_decode($template->wizard_config_json);
                unset($template->wizard_config_json);
            }
        }

        return rest_ensure_response(array(
            'success' => true,
            'data' => $templates,
        ));
    }

    /**
     * Get specific scenario template
     */
    public function get_scenario_template($request) {
        $template_id = $request->get_param('id');
        $template = $this->db->get_scenario_template($template_id);

        if (!$template) {
            return new WP_Error('not_found', 'Scenario template not found', array('status' => 404));
        }

        // Parse JSON fields
        if (!empty($template->wizard_config_json)) {
            $template->wizard_config = json_decode($template->wizard_config_json);
            unset($template->wizard_config_json);
        }

        return rest_ensure_response(array(
            'success' => true,
            'data' => $template,
        ));
    }

    /**
     * Get scenario categories
     */
    public function get_scenario_categories($request) {
        $categories = $this->db->get_scenario_categories();

        return rest_ensure_response(array(
            'success' => true,
            'data' => $categories,
        ));
    }

    // ===== Game Session Endpoints =====

    /**
     * Create new game session
     */
    public function create_game_session($request) {
        $data = array(
            'user_id' => get_current_user_id(),
            'game_type' => sanitize_text_field($request->get_param('game_type')),
            'topic' => sanitize_text_field($request->get_param('topic')),
            'duration_seconds' => intval($request->get_param('duration_seconds')),
        );

        // Optional fields
        if ($request->get_param('score') !== null) {
            $data['score'] = intval($request->get_param('score'));
        }
        if ($request->get_param('filler_count') !== null) {
            $data['filler_count'] = intval($request->get_param('filler_count'));
        }
        if ($request->get_param('words_per_minute') !== null) {
            $data['words_per_minute'] = intval($request->get_param('words_per_minute'));
        }
        if ($request->get_param('transcript') !== null) {
            $data['transcript'] = wp_kses_post($request->get_param('transcript'));
        }
        if ($request->get_param('analysis_json') !== null) {
            $data['analysis_json'] = $request->get_param('analysis_json');
        }

        $session_id = $this->db->create_game_session($data);

        if (!$session_id) {
            return new WP_Error('create_failed', 'Failed to create game session', array('status' => 500));
        }

        $session = $this->db->get_game_session($session_id);

        return rest_ensure_response(array(
            'success' => true,
            'data' => $session,
            'message' => 'Game session created successfully',
        ));
    }

    /**
     * Get user's game sessions
     */
    public function get_game_sessions($request) {
        $args = array(
            'game_type' => $request->get_param('game_type'),
            'limit' => $request->get_param('limit') ?: 50,
            'offset' => $request->get_param('offset') ?: 0,
            'orderby' => $request->get_param('orderby') ?: 'created_at',
            'order' => $request->get_param('order') ?: 'DESC',
        );

        $sessions = $this->db->get_user_game_sessions(null, $args);

        // Parse JSON fields
        foreach ($sessions as &$session) {
            if (!empty($session->analysis_json)) {
                $session->analysis = json_decode($session->analysis_json);
                unset($session->analysis_json);
            }
        }

        return rest_ensure_response(array(
            'success' => true,
            'data' => $sessions,
        ));
    }

    /**
     * Get specific game session
     */
    public function get_game_session($request) {
        $session_id = $request->get_param('id');
        $session = $this->db->get_game_session($session_id);

        if (!$session) {
            return new WP_Error('not_found', 'Game session not found', array('status' => 404));
        }

        // Check ownership
        if ((int) $session->user_id !== get_current_user_id()) {
            return new WP_Error('forbidden', 'You do not have access to this session', array('status' => 403));
        }

        // Parse JSON fields
        if (!empty($session->analysis_json)) {
            $session->analysis = json_decode($session->analysis_json);
            unset($session->analysis_json);
        }

        return rest_ensure_response(array(
            'success' => true,
            'data' => $session,
        ));
    }

    /**
     * Update game session
     */
    public function update_game_session($request) {
        $session_id = $request->get_param('id');
        $session = $this->db->get_game_session($session_id);

        if (!$session) {
            return new WP_Error('not_found', 'Game session not found', array('status' => 404));
        }

        // Check ownership
        if ((int) $session->user_id !== get_current_user_id()) {
            return new WP_Error('forbidden', 'You do not have access to this session', array('status' => 403));
        }

        $data = array();

        $allowed_fields = array('topic', 'duration_seconds', 'score', 'filler_count', 'words_per_minute', 'transcript', 'analysis_json');

        foreach ($allowed_fields as $field) {
            if ($request->get_param($field) !== null) {
                $data[$field] = $request->get_param($field);
            }
        }

        $result = $this->db->update_game_session($session_id, $data);

        if (!$result) {
            return new WP_Error('update_failed', 'Failed to update game session', array('status' => 500));
        }

        $updated_session = $this->db->get_game_session($session_id);

        return rest_ensure_response(array(
            'success' => true,
            'data' => $updated_session,
            'message' => 'Game session updated successfully',
        ));
    }

    /**
     * Delete game session
     */
    public function delete_game_session($request) {
        $session_id = $request->get_param('id');

        $result = $this->db->delete_game_session($session_id);

        if (!$result) {
            return new WP_Error('delete_failed', 'Failed to delete game session', array('status' => 500));
        }

        return rest_ensure_response(array(
            'success' => true,
            'message' => 'Game session deleted successfully',
        ));
    }

    // ===== Stats & Leaderboard Endpoints =====

    /**
     * Get user's game stats
     */
    public function get_user_stats($request) {
        $stats = $this->db->get_user_game_stats();

        return rest_ensure_response(array(
            'success' => true,
            'data' => array(
                'total_games' => (int) $stats->total_games ?: 0,
                'best_score' => (int) $stats->best_score ?: 0,
                'avg_score' => $stats->avg_score ? round((float) $stats->avg_score, 1) : 0,
                'best_filler_count' => (int) $stats->best_filler_count ?: 0,
                'avg_filler_count' => $stats->avg_filler_count ? round((float) $stats->avg_filler_count, 1) : 0,
                'total_practice_time' => (int) $stats->total_practice_time ?: 0,
            ),
        ));
    }

    /**
     * Get leaderboard
     */
    public function get_leaderboard($request) {
        $game_type = $request->get_param('game_type');
        $limit = $request->get_param('limit') ?: 10;

        $leaderboard = $this->db->get_leaderboard($game_type, $limit);

        // Format leaderboard data
        $formatted = array_map(function($entry) {
            return array(
                'user_id' => (int) $entry->user_id,
                'display_name' => $entry->display_name ?: 'Anonym',
                'best_score' => (int) $entry->best_score,
                'total_games' => (int) $entry->total_games,
                'avg_score' => round((float) $entry->avg_score, 1),
            );
        }, $leaderboard);

        return rest_ensure_response(array(
            'success' => true,
            'data' => $formatted,
        ));
    }

    /**
     * Get user's highscore
     */
    public function get_user_highscore($request) {
        $game_type = $request->get_param('game_type');
        $highscore = $this->db->get_user_highscore(null, $game_type);

        return rest_ensure_response(array(
            'success' => true,
            'data' => array(
                'highscore' => (int) $highscore ?: 0,
            ),
        ));
    }
}
