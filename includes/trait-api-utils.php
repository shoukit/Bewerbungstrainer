<?php
/**
 * API Utilities Trait
 *
 * Provides common functionality for REST API classes to reduce code duplication.
 *
 * Usage:
 *   class Bewerbungstrainer_My_API {
 *       use Bewerbungstrainer_API_Utils;
 *       ...
 *   }
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

trait Bewerbungstrainer_API_Utils {

    /**
     * API namespace (can be overridden in using class)
     */
    protected function get_api_namespace() {
        return 'bewerbungstrainer/v1';
    }

    // =========================================================================
    // PERMISSION CALLBACKS
    // =========================================================================

    /**
     * Check if user is logged in
     *
     * @return bool
     */
    public function check_user_logged_in() {
        return is_user_logged_in();
    }

    /**
     * Check if current user has admin permissions
     *
     * @return bool
     */
    public function check_admin_permission() {
        return current_user_can('manage_options');
    }

    /**
     * Allow all users (both logged-in and guests)
     * Useful for public endpoints or demo user access
     *
     * @param WP_REST_Request $request The request object
     * @return bool Always returns true
     */
    public function allow_all_users($request) {
        return true;
    }

    /**
     * Allow all users with optional nonce verification for logged-in users
     *
     * @param WP_REST_Request $request The request object
     * @return bool
     */
    public function allow_all_users_with_nonce($request) {
        if (is_user_logged_in()) {
            $nonce = $request->get_header('X-WP-Nonce');
            if (!$nonce) {
                $nonce = $request->get_param('_wpnonce');
            }
            if ($nonce && wp_verify_nonce($nonce, 'wp_rest')) {
                return true;
            }
            // For logged-in users without valid nonce, still allow (demo users may not have proper cookies)
            return true;
        }
        // For non-logged-in users, allow access (demo code users)
        return true;
    }

    // =========================================================================
    // RESPONSE HELPERS
    // =========================================================================

    /**
     * Create a successful API response
     *
     * @param mixed  $data    Response data (will be wrapped in 'data' key)
     * @param int    $status  HTTP status code (default: 200)
     * @param string $message Optional success message
     * @return WP_REST_Response
     */
    protected function success_response($data, $status = 200, $message = null) {
        $response = array(
            'success' => true,
            'data' => $data,
        );

        if ($message) {
            $response['message'] = $message;
        }

        return new WP_REST_Response($response, $status);
    }

    /**
     * Create an error response
     *
     * @param string $code    Error code
     * @param string $message Error message
     * @param int    $status  HTTP status code (default: 400)
     * @param array  $data    Additional error data
     * @return WP_Error
     */
    protected function error_response($code, $message, $status = 400, $data = array()) {
        $error_data = array_merge(array('status' => $status), $data);
        return new WP_Error($code, $message, $error_data);
    }

    /**
     * Create a not found error response
     *
     * @param string $item_type Type of item not found (for message)
     * @return WP_Error
     */
    protected function not_found_response($item_type = 'Eintrag') {
        return $this->error_response(
            'not_found',
            sprintf(__('%s nicht gefunden.', 'bewerbungstrainer'), $item_type),
            404
        );
    }

    /**
     * Create a forbidden error response
     *
     * @param string $message Custom message (optional)
     * @return WP_Error
     */
    protected function forbidden_response($message = null) {
        return $this->error_response(
            'forbidden',
            $message ?: __('Du hast keine Berechtigung für diese Aktion.', 'bewerbungstrainer'),
            403
        );
    }

    /**
     * Create a validation error response
     *
     * @param string $message Validation error message
     * @return WP_Error
     */
    protected function validation_error($message) {
        return $this->error_response('validation_error', $message, 400);
    }

    /**
     * Create a server error response
     *
     * @param string $message Error message
     * @return WP_Error
     */
    protected function server_error($message = null) {
        return $this->error_response(
            'server_error',
            $message ?: __('Ein interner Fehler ist aufgetreten.', 'bewerbungstrainer'),
            500
        );
    }

    // =========================================================================
    // REQUEST HELPERS
    // =========================================================================

    /**
     * Get JSON params from request, with fallback to regular params
     *
     * @param WP_REST_Request $request
     * @return array
     */
    protected function get_request_params($request) {
        $params = $request->get_json_params();
        if (empty($params)) {
            $params = $request->get_params();
        }
        return $params;
    }

    /**
     * Get a required parameter from request
     *
     * @param WP_REST_Request $request
     * @param string          $key
     * @param string          $label   Human-readable label for error message
     * @return mixed|WP_Error Value if found, WP_Error if missing
     */
    protected function get_required_param($request, $key, $label = null) {
        $params = $this->get_request_params($request);

        if (empty($params[$key])) {
            $label = $label ?: $key;
            return $this->validation_error(
                sprintf(__('%s ist erforderlich.', 'bewerbungstrainer'), $label)
            );
        }

        return $params[$key];
    }

    /**
     * Get an optional parameter from request with default value
     *
     * @param WP_REST_Request $request
     * @param string          $key
     * @param mixed           $default
     * @return mixed
     */
    protected function get_optional_param($request, $key, $default = null) {
        $params = $this->get_request_params($request);
        return isset($params[$key]) ? $params[$key] : $default;
    }

    // =========================================================================
    // OWNERSHIP HELPERS
    // =========================================================================

    /**
     * Check if current user owns a resource
     *
     * @param int|object $resource   Resource or user_id
     * @param string     $user_field Field name containing user_id (default: 'user_id')
     * @return bool
     */
    protected function check_ownership($resource, $user_field = 'user_id') {
        $user_id = is_object($resource) ? $resource->$user_field : $resource;
        return (int) $user_id === get_current_user_id();
    }

    /**
     * Verify ownership or return forbidden error
     *
     * @param int|object $resource   Resource or user_id
     * @param string     $user_field Field name containing user_id
     * @return true|WP_Error True if owned, WP_Error if not
     */
    protected function verify_ownership($resource, $user_field = 'user_id') {
        if (!$this->check_ownership($resource, $user_field)) {
            return $this->forbidden_response(__('Du hast keinen Zugriff auf diese Ressource.', 'bewerbungstrainer'));
        }
        return true;
    }

    // =========================================================================
    // GEMINI API HELPERS
    // =========================================================================

    /**
     * Get Gemini API key or return error
     *
     * @return string|WP_Error API key or error if not configured
     */
    protected function get_gemini_api_key() {
        $api_key = get_option('bewerbungstrainer_gemini_api_key', '');

        if (empty($api_key)) {
            return $this->error_response(
                'missing_api_key',
                __('Gemini API Key ist nicht konfiguriert.', 'bewerbungstrainer'),
                500
            );
        }

        return $api_key;
    }

    /**
     * Get available Gemini models in fallback order
     *
     * @return array
     */
    protected function get_gemini_models() {
        return array(
            'gemini-2.0-flash-exp',
            'gemini-2.0-flash',
            'gemini-1.5-flash-latest',
            'gemini-1.5-pro-latest',
        );
    }

    // =========================================================================
    // JSON HELPERS
    // =========================================================================

    /**
     * Safely parse JSON with error handling
     *
     * @param string $json_string
     * @param mixed  $default Default value if parsing fails
     * @return mixed Parsed value or default
     */
    protected function safe_json_decode($json_string, $default = null) {
        if (empty($json_string)) {
            return $default;
        }

        if (!is_string($json_string)) {
            return $json_string; // Already decoded
        }

        $decoded = json_decode($json_string, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            return $default;
        }

        return $decoded;
    }

    /**
     * Parse tips JSON field (common pattern across scenarios)
     *
     * @param mixed $tips Tips data (string or already decoded)
     * @return array|null
     */
    protected function parse_tips_json($tips) {
        if (empty($tips)) {
            return null;
        }

        if (is_string($tips)) {
            $parsed = json_decode($tips, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                return null;
            }
            return $parsed;
        }

        return $tips;
    }

    // =========================================================================
    // DEMO CODE HELPERS
    // =========================================================================

    /**
     * Check if current request is from a demo user
     *
     * @return bool
     */
    protected function is_demo_user() {
        if (class_exists('Bewerbungstrainer_Demo_Codes')) {
            return Bewerbungstrainer_Demo_Codes::is_demo_user();
        }
        return false;
    }

    /**
     * Update demo code usage counter
     *
     * @param string $demo_code
     * @return void
     */
    protected function update_demo_code_usage($demo_code) {
        if (!empty($demo_code) && class_exists('Bewerbungstrainer_Demo_Codes')) {
            $demo_codes = Bewerbungstrainer_Demo_Codes::get_instance();
            $demo_codes->update_usage(strtoupper(sanitize_text_field($demo_code)));
        }
    }
}
