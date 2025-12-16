<?php
/**
 * Corporate Interview API Class
 *
 * Handles turn-based interview conversations for corporate environments
 * where WebSocket connections are blocked by firewalls.
 *
 * Flow:
 * 1. User records audio answer → HTTP POST to server
 * 2. Server transcribes audio via Gemini STT
 * 3. Server generates interviewer response via Gemini LLM
 * 4. Server generates audio via ElevenLabs TTS REST API
 * 5. Audio file URL returned to client
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

class Bewerbungstrainer_Corporate_Interview_API {

    /**
     * Instance of this class
     */
    private static $instance = null;

    /**
     * API namespace
     */
    private $namespace = 'bewerbungstrainer/v1';

    /**
     * Gemini API endpoint
     */
    private $gemini_api_endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

    /**
     * ElevenLabs API base
     */
    private $elevenlabs_api_base = 'https://api.elevenlabs.io/v1';

    /**
     * Default ElevenLabs voice ID (German female)
     */
    private $default_voice_id = '21m00Tcm4TlvDq8ikWAM'; // Rachel - can be changed

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
        add_action('rest_api_init', array($this, 'register_routes'));
    }

    /**
     * Register REST API routes
     */
    public function register_routes() {
        // Start a new corporate mode session
        register_rest_route($this->namespace, '/corporate-interview/start', array(
            'methods' => 'POST',
            'callback' => array($this, 'start_session'),
            'permission_callback' => array($this, 'allow_all_users'),
        ));

        // Process user turn (upload audio, get interviewer response)
        register_rest_route($this->namespace, '/corporate-interview/turn', array(
            'methods' => 'POST',
            'callback' => array($this, 'process_turn'),
            'permission_callback' => array($this, 'allow_all_users'),
        ));

        // Test WebSocket connectivity
        register_rest_route($this->namespace, '/corporate-interview/test-websocket', array(
            'methods' => 'GET',
            'callback' => array($this, 'test_websocket'),
            'permission_callback' => array($this, 'allow_all_users'),
        ));

        // Get available voices for TTS
        register_rest_route($this->namespace, '/corporate-interview/voices', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_voices'),
            'permission_callback' => array($this, 'allow_all_users'),
        ));
    }

    /**
     * Allow all users (logged in or guest)
     */
    public function allow_all_users() {
        return true;
    }

    /**
     * Start a new corporate interview session
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response|WP_Error Response or error
     */
    public function start_session($request) {
        $scenario_id = $request->get_param('scenario_id');
        $scenario_content = $request->get_param('scenario_content');
        $initial_message = $request->get_param('initial_message');
        $variables = $request->get_param('variables') ?? array();
        $voice_id = $request->get_param('voice_id') ?? $this->default_voice_id;
        $interviewer_profile = $request->get_param('interviewer_profile');

        // Generate session ID
        $session_id = wp_generate_uuid4();

        // Store session data in transient (expires in 2 hours)
        $session_data = array(
            'id' => $session_id,
            'scenario_id' => $scenario_id,
            'scenario_content' => $scenario_content,
            'variables' => $variables,
            'voice_id' => $voice_id,
            'interviewer_profile' => $interviewer_profile,
            'transcript' => array(),
            'created_at' => current_time('mysql'),
        );

        set_transient('corporate_interview_' . $session_id, $session_data, 2 * HOUR_IN_SECONDS);

        // Generate initial interviewer message audio
        $initial_text = $initial_message ?: 'Hallo! Schön, dass Sie heute hier sind. Ich freue mich auf unser Gespräch.';

        // Replace variables in initial message
        foreach ($variables as $key => $value) {
            $initial_text = str_replace('{{' . $key . '}}', $value, $initial_text);
            $initial_text = str_replace('${' . $key . '}', $value, $initial_text);
        }

        $audio_result = $this->generate_tts_audio($initial_text, $voice_id);

        if (is_wp_error($audio_result)) {
            return $audio_result;
        }

        // Add initial message to transcript
        $session_data['transcript'][] = array(
            'role' => 'interviewer',
            'text' => $initial_text,
            'timestamp' => time(),
        );
        set_transient('corporate_interview_' . $session_id, $session_data, 2 * HOUR_IN_SECONDS);

        return rest_ensure_response(array(
            'success' => true,
            'session_id' => $session_id,
            'initial_message' => array(
                'text' => $initial_text,
                'audio_url' => $audio_result['url'],
            ),
        ));
    }

    /**
     * Process a turn in the conversation
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response|WP_Error Response or error
     */
    public function process_turn($request) {
        $session_id = $request->get_param('session_id');
        $audio_base64 = $request->get_param('audio_base64');
        $end_conversation = $request->get_param('end_conversation') ?? false;

        // Get session data
        $session_data = get_transient('corporate_interview_' . $session_id);

        if (!$session_data) {
            return new WP_Error(
                'session_not_found',
                __('Session nicht gefunden oder abgelaufen.', 'bewerbungstrainer'),
                array('status' => 404)
            );
        }

        // Step 1: Transcribe user audio using Gemini
        $transcript_result = $this->transcribe_audio($audio_base64);

        if (is_wp_error($transcript_result)) {
            return $transcript_result;
        }

        $user_text = $transcript_result['text'];

        // Add user message to transcript
        $session_data['transcript'][] = array(
            'role' => 'user',
            'text' => $user_text,
            'timestamp' => time(),
        );

        // Check if conversation should end
        if ($end_conversation) {
            // Save final transcript
            set_transient('corporate_interview_' . $session_id, $session_data, 2 * HOUR_IN_SECONDS);

            return rest_ensure_response(array(
                'success' => true,
                'user_transcript' => $user_text,
                'conversation_ended' => true,
                'full_transcript' => $session_data['transcript'],
            ));
        }

        // Step 2: Generate interviewer response using Gemini LLM
        $interviewer_response = $this->generate_interviewer_response(
            $session_data['scenario_content'],
            $session_data['transcript'],
            $session_data['variables'],
            $session_data['interviewer_profile']
        );

        if (is_wp_error($interviewer_response)) {
            return $interviewer_response;
        }

        // Step 3: Generate TTS audio for interviewer response
        $audio_result = $this->generate_tts_audio(
            $interviewer_response['text'],
            $session_data['voice_id']
        );

        if (is_wp_error($audio_result)) {
            return $audio_result;
        }

        // Add interviewer message to transcript
        $session_data['transcript'][] = array(
            'role' => 'interviewer',
            'text' => $interviewer_response['text'],
            'timestamp' => time(),
        );

        // Save updated session
        set_transient('corporate_interview_' . $session_id, $session_data, 2 * HOUR_IN_SECONDS);

        return rest_ensure_response(array(
            'success' => true,
            'user_transcript' => $user_text,
            'interviewer_response' => array(
                'text' => $interviewer_response['text'],
                'audio_url' => $audio_result['url'],
            ),
            'should_end' => $interviewer_response['should_end'] ?? false,
        ));
    }

    /**
     * Transcribe audio using Gemini multimodal API
     *
     * @param string $audio_base64 Base64 encoded audio
     * @return array|WP_Error Transcription result or error
     */
    private function transcribe_audio($audio_base64) {
        $api_key = get_option('bewerbungstrainer_gemini_api_key', '');

        if (empty($api_key)) {
            return new WP_Error(
                'missing_api_key',
                __('Gemini API Key ist nicht konfiguriert.', 'bewerbungstrainer')
            );
        }

        // Detect audio format from base64 header or default to webm
        $mime_type = 'audio/webm';
        if (strpos($audio_base64, 'data:') === 0) {
            preg_match('/data:([^;]+);/', $audio_base64, $matches);
            if (isset($matches[1])) {
                $mime_type = $matches[1];
            }
            // Remove data URL prefix
            $audio_base64 = preg_replace('/^data:[^;]+;base64,/', '', $audio_base64);
        }

        $url = $this->gemini_api_endpoint . '?key=' . $api_key;

        $body = array(
            'contents' => array(
                array(
                    'parts' => array(
                        array(
                            'text' => 'Transkribiere die folgende Audio-Aufnahme auf Deutsch. Gib NUR den transkribierten Text zurück, ohne zusätzliche Erklärungen oder Formatierung.'
                        ),
                        array(
                            'inline_data' => array(
                                'mime_type' => $mime_type,
                                'data' => $audio_base64,
                            )
                        )
                    )
                )
            ),
            'generationConfig' => array(
                'temperature' => 0.1,
                'maxOutputTokens' => 2048,
            )
        );

        $response = wp_remote_post($url, array(
            'headers' => array(
                'Content-Type' => 'application/json',
            ),
            'body' => json_encode($body),
            'timeout' => 60,
        ));

        if (is_wp_error($response)) {
            return $response;
        }

        $response_code = wp_remote_retrieve_response_code($response);
        $response_body = wp_remote_retrieve_body($response);

        if ($response_code !== 200) {
            error_log('Gemini STT Error: ' . $response_body);
            return new WP_Error(
                'transcription_failed',
                __('Fehler bei der Transkription: ', 'bewerbungstrainer') . $response_code
            );
        }

        $data = json_decode($response_body, true);

        if (!isset($data['candidates'][0]['content']['parts'][0]['text'])) {
            return new WP_Error(
                'invalid_response',
                __('Ungültige Antwort von der Transkriptions-API.', 'bewerbungstrainer')
            );
        }

        return array(
            'text' => trim($data['candidates'][0]['content']['parts'][0]['text']),
        );
    }

    /**
     * Generate interviewer response using Gemini LLM
     *
     * @param string $scenario_content Scenario system prompt
     * @param array $transcript Conversation transcript so far
     * @param array $variables Session variables
     * @param array $interviewer_profile Interviewer profile data
     * @return array|WP_Error Response or error
     */
    private function generate_interviewer_response($scenario_content, $transcript, $variables, $interviewer_profile) {
        $api_key = get_option('bewerbungstrainer_gemini_api_key', '');

        if (empty($api_key)) {
            return new WP_Error(
                'missing_api_key',
                __('Gemini API Key ist nicht konfiguriert.', 'bewerbungstrainer')
            );
        }

        // Build system prompt
        $system_prompt = $this->build_interviewer_prompt($scenario_content, $variables, $interviewer_profile);

        // Build conversation history
        $conversation_history = "BISHERIGER GESPRÄCHSVERLAUF:\n\n";
        foreach ($transcript as $entry) {
            $role_label = $entry['role'] === 'interviewer' ? 'Interviewer' : 'Bewerber';
            $conversation_history .= "{$role_label}: {$entry['text']}\n\n";
        }

        $full_prompt = $system_prompt . "\n\n" . $conversation_history . "\n\n" .
            "Basierend auf dem bisherigen Gespräch, generiere deine nächste Antwort als Interviewer. " .
            "Antworte natürlich und führe das Gespräch weiter. Halte deine Antwort kurz und prägnant (1-3 Sätze).\n\n" .
            "Falls das Gespräch natürlich zu Ende gehen sollte (z.B. nach 5-8 Fragen oder wenn alle wichtigen Themen besprochen wurden), " .
            "beende das Gespräch höflich.\n\n" .
            "Antworte im folgenden JSON-Format:\n" .
            "{\n" .
            "  \"text\": \"Deine Antwort als Interviewer\",\n" .
            "  \"should_end\": false\n" .
            "}";

        $url = $this->gemini_api_endpoint . '?key=' . $api_key;

        $body = array(
            'contents' => array(
                array(
                    'parts' => array(
                        array('text' => $full_prompt)
                    )
                )
            ),
            'generationConfig' => array(
                'temperature' => 0.8,
                'topK' => 40,
                'topP' => 0.95,
                'maxOutputTokens' => 1024,
            )
        );

        $response = wp_remote_post($url, array(
            'headers' => array(
                'Content-Type' => 'application/json',
            ),
            'body' => json_encode($body),
            'timeout' => 60,
        ));

        if (is_wp_error($response)) {
            return $response;
        }

        $response_code = wp_remote_retrieve_response_code($response);
        $response_body = wp_remote_retrieve_body($response);

        if ($response_code !== 200) {
            error_log('Gemini LLM Error: ' . $response_body);
            return new WP_Error(
                'llm_failed',
                __('Fehler bei der Antwort-Generierung: ', 'bewerbungstrainer') . $response_code
            );
        }

        $data = json_decode($response_body, true);

        if (!isset($data['candidates'][0]['content']['parts'][0]['text'])) {
            return new WP_Error(
                'invalid_response',
                __('Ungültige Antwort von der LLM-API.', 'bewerbungstrainer')
            );
        }

        $response_text = $data['candidates'][0]['content']['parts'][0]['text'];

        // Try to parse JSON response
        if (preg_match('/\{[\s\S]*\}/', $response_text, $json_match)) {
            $parsed = json_decode($json_match[0], true);
            if (json_last_error() === JSON_ERROR_NONE && isset($parsed['text'])) {
                return array(
                    'text' => $parsed['text'],
                    'should_end' => $parsed['should_end'] ?? false,
                );
            }
        }

        // Fallback: Use raw text
        return array(
            'text' => $response_text,
            'should_end' => false,
        );
    }

    /**
     * Build the interviewer system prompt
     *
     * @param string $scenario_content Base scenario content
     * @param array $variables Session variables
     * @param array $interviewer_profile Interviewer profile
     * @return string Complete system prompt
     */
    private function build_interviewer_prompt($scenario_content, $variables, $interviewer_profile) {
        $prompt = $scenario_content ?: '';

        // Replace variables
        if (!empty($variables)) {
            foreach ($variables as $key => $value) {
                $prompt = str_replace('{{' . $key . '}}', $value, $prompt);
                $prompt = str_replace('${' . $key . '}', $value, $prompt);
            }
        }

        // Add interviewer profile
        if (!empty($interviewer_profile)) {
            $prompt .= "\n\n## Dein Profil:\n";

            if (!empty($interviewer_profile['name'])) {
                $prompt .= "\nDein Name: {$interviewer_profile['name']}";
            }

            if (!empty($interviewer_profile['role'])) {
                $prompt .= "\nDeine Rolle: {$interviewer_profile['role']}";
            }

            if (!empty($interviewer_profile['properties'])) {
                $prompt .= "\n\n### Deine Eigenschaften:\n{$interviewer_profile['properties']}";
            }

            if (!empty($interviewer_profile['typical_objections'])) {
                $prompt .= "\n\n### Typische Einwände:\n{$interviewer_profile['typical_objections']}";
            }

            if (!empty($interviewer_profile['important_questions'])) {
                $prompt .= "\n\n### Wichtige Fragen:\n{$interviewer_profile['important_questions']}";
            }
        }

        return $prompt;
    }

    /**
     * Generate TTS audio using ElevenLabs REST API
     *
     * @param string $text Text to convert to speech
     * @param string $voice_id ElevenLabs voice ID
     * @return array|WP_Error Audio URL or error
     */
    private function generate_tts_audio($text, $voice_id = null) {
        $api_key = get_option('bewerbungstrainer_elevenlabs_api_key', '');

        if (empty($api_key)) {
            return new WP_Error(
                'missing_api_key',
                __('ElevenLabs API Key ist nicht konfiguriert.', 'bewerbungstrainer')
            );
        }

        $voice_id = $voice_id ?: $this->default_voice_id;
        $url = $this->elevenlabs_api_base . '/text-to-speech/' . $voice_id;

        $body = array(
            'text' => $text,
            'model_id' => 'eleven_multilingual_v2',
            'voice_settings' => array(
                'stability' => 0.5,
                'similarity_boost' => 0.75,
                'style' => 0.0,
                'use_speaker_boost' => true,
            ),
        );

        $response = wp_remote_post($url, array(
            'headers' => array(
                'Content-Type' => 'application/json',
                'xi-api-key' => $api_key,
                'Accept' => 'audio/mpeg',
            ),
            'body' => json_encode($body),
            'timeout' => 60,
        ));

        if (is_wp_error($response)) {
            return $response;
        }

        $response_code = wp_remote_retrieve_response_code($response);

        if ($response_code !== 200) {
            $error_body = wp_remote_retrieve_body($response);
            error_log('ElevenLabs TTS Error: ' . $error_body);
            return new WP_Error(
                'tts_failed',
                __('Fehler bei der Sprachsynthese: ', 'bewerbungstrainer') . $response_code
            );
        }

        // Get audio data
        $audio_data = wp_remote_retrieve_body($response);

        // Save to uploads directory
        $upload_dir = wp_upload_dir();
        $corporate_dir = $upload_dir['basedir'] . '/bewerbungstrainer/corporate-audio';

        if (!file_exists($corporate_dir)) {
            wp_mkdir_p($corporate_dir);

            // Create .htaccess to allow audio access
            file_put_contents($corporate_dir . '/.htaccess', "Allow from all\n");
        }

        $filename = 'tts_' . wp_generate_uuid4() . '.mp3';
        $file_path = $corporate_dir . '/' . $filename;
        $file_url = $upload_dir['baseurl'] . '/bewerbungstrainer/corporate-audio/' . $filename;

        file_put_contents($file_path, $audio_data);

        // Schedule cleanup after 1 hour
        wp_schedule_single_event(time() + HOUR_IN_SECONDS, 'bewerbungstrainer_cleanup_tts_file', array($file_path));

        return array(
            'url' => $file_url,
            'path' => $file_path,
        );
    }

    /**
     * Test WebSocket connectivity (for auto-detection)
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response Response indicating WebSocket availability
     */
    public function test_websocket($request) {
        // This endpoint just returns info - the actual WebSocket test happens client-side
        // But we provide the WebSocket URL for testing
        $agent_id = get_option('bewerbungstrainer_elevenlabs_agent_id', '');

        return rest_ensure_response(array(
            'websocket_url' => 'wss://api.elevenlabs.io/v1/convai/conversation?agent_id=' . $agent_id,
            'test_instructions' => 'Client should attempt WebSocket connection to this URL with a 5-second timeout',
        ));
    }

    /**
     * Get available ElevenLabs voices
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response|WP_Error Response or error
     */
    public function get_voices($request) {
        $api_key = get_option('bewerbungstrainer_elevenlabs_api_key', '');

        if (empty($api_key)) {
            return new WP_Error(
                'missing_api_key',
                __('ElevenLabs API Key ist nicht konfiguriert.', 'bewerbungstrainer')
            );
        }

        $url = $this->elevenlabs_api_base . '/voices';

        $response = wp_remote_get($url, array(
            'headers' => array(
                'xi-api-key' => $api_key,
            ),
            'timeout' => 30,
        ));

        if (is_wp_error($response)) {
            return $response;
        }

        $response_code = wp_remote_retrieve_response_code($response);

        if ($response_code !== 200) {
            return new WP_Error(
                'voices_failed',
                __('Fehler beim Abrufen der Stimmen.', 'bewerbungstrainer')
            );
        }

        $data = json_decode(wp_remote_retrieve_body($response), true);

        // Filter to German-friendly voices
        $voices = array();
        if (isset($data['voices'])) {
            foreach ($data['voices'] as $voice) {
                $voices[] = array(
                    'voice_id' => $voice['voice_id'],
                    'name' => $voice['name'],
                    'labels' => $voice['labels'] ?? array(),
                    'preview_url' => $voice['preview_url'] ?? null,
                );
            }
        }

        return rest_ensure_response(array(
            'voices' => $voices,
            'default_voice_id' => $this->default_voice_id,
        ));
    }
}

// Initialize the API
add_action('plugins_loaded', function() {
    Bewerbungstrainer_Corporate_Interview_API::get_instance();
});

// Cleanup scheduled TTS files
add_action('bewerbungstrainer_cleanup_tts_file', function($file_path) {
    if (file_exists($file_path)) {
        unlink($file_path);
    }
});
