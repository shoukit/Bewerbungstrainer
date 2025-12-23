<?php
/**
 * Gemini AI Handler Class
 *
 * Handles document analysis using Google Gemini API
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

class Bewerbungstrainer_Gemini_Handler {

    /**
     * Instance of this class
     */
    private static $instance = null;

    /**
     * Model configuration
     * - DEFAULT: gemini-2.5-flash for audio/text (fast, good quality)
     * - VIDEO: gemini-2.5-pro for video analysis (best vision quality)
     */
    private const DEFAULT_MODEL = 'gemini-2.5-flash';
    private const VIDEO_MODEL = 'gemini-2.5-pro';

    /**
     * Gemini API endpoint (default model for text/audio)
     */
    private $api_endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

    /**
     * Enable/disable detailed prompt logging
     */
    private $debug_prompts = true;

    /**
     * Log a Gemini prompt for debugging (uses global function)
     */
    private function log_prompt_debug($scenario, $description, $prompt, $metadata = array()) {
        if (!$this->debug_prompts) {
            return;
        }
        // Use global logging function that writes to prompts.log
        if (function_exists('bewerbungstrainer_log_prompt')) {
            bewerbungstrainer_log_prompt($scenario, $description, $prompt, $metadata);
        }
    }

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
        // Nothing to initialize
    }

    /**
     * Analyze document (CV or Cover Letter)
     *
     * @param string $file_path Path to PDF file
     * @param string $document_type Type of document ('cv' or 'cover_letter')
     * @return array|WP_Error Feedback array or WP_Error on failure
     */
    public function analyze_document($file_path, $document_type) {
        // Get API key
        $api_key = get_option('bewerbungstrainer_gemini_api_key', '');

        if (empty($api_key)) {
            return new WP_Error(
                'missing_api_key',
                __('Gemini API Key ist nicht konfiguriert.', 'bewerbungstrainer')
            );
        }

        // Extract text from PDF
        $text = $this->extract_pdf_text($file_path);

        if (is_wp_error($text)) {
            return $text;
        }

        // Generate prompt based on document type
        $prompt = $this->get_analysis_prompt($text, $document_type);

        // Debug logging
        $this->log_prompt_debug(
            $document_type === 'cv' ? 'CV_ANALYSIS' : 'COVER_LETTER_ANALYSIS',
            $document_type === 'cv'
                ? 'Lebenslauf-Analyse: Bewertet Struktur, Inhalt, Vollständigkeit und Professionalität des CVs.'
                : 'Anschreiben-Analyse: Bewertet Aufbau, Argumentation, Motivation und Sprache des Bewerbungsschreibens.',
            $prompt,
            array(
                'Dokument-Typ' => $document_type === 'cv' ? 'Lebenslauf' : 'Anschreiben',
                'Text-Länge' => strlen($text) . ' Zeichen',
                'Bewertungskategorien' => $document_type === 'cv'
                    ? 'Struktur, Inhalt, Vollständigkeit, Professionalität'
                    : 'Aufbau, Inhalt, Motivation, Sprache',
            )
        );

        // Call Gemini API
        $response = $this->call_gemini_api($prompt, $api_key);

        $scenario_name = $document_type === 'cv' ? 'CV_ANALYSIS' : 'COVER_LETTER_ANALYSIS';

        if (is_wp_error($response)) {
            // Log error response
            if (function_exists('bewerbungstrainer_log_response')) {
                bewerbungstrainer_log_response($scenario_name, $response->get_error_message(), true);
            }
            return $response;
        }

        // Log successful response
        if (function_exists('bewerbungstrainer_log_response')) {
            bewerbungstrainer_log_response($scenario_name, $response);
        }

        // Parse response
        $feedback = $this->parse_gemini_response($response, $document_type);

        return $feedback;
    }

    /**
     * Extract text from PDF file
     *
     * @param string $file_path Path to PDF file
     * @return string|WP_Error Extracted text or WP_Error on failure
     */
    private function extract_pdf_text($file_path) {
        // Check if file exists
        if (!file_exists($file_path)) {
            return new WP_Error('file_not_found', __('Datei nicht gefunden.', 'bewerbungstrainer'));
        }

        // Use pdftotext if available (more accurate)
        if (function_exists('shell_exec') && !empty(shell_exec('which pdftotext'))) {
            $output = shell_exec('pdftotext ' . escapeshellarg($file_path) . ' -');
            if (!empty($output)) {
                return $output;
            }
        }

        // Fallback: Use basic PDF text extraction
        $content = file_get_contents($file_path);

        if ($content === false) {
            return new WP_Error('read_failed', __('Fehler beim Lesen der Datei.', 'bewerbungstrainer'));
        }

        // Basic text extraction from PDF
        $text = '';
        if (preg_match_all('/\((.*?)\)/s', $content, $matches)) {
            foreach ($matches[1] as $match) {
                $text .= $match . ' ';
            }
        }

        // Clean up text
        $text = preg_replace('/[^\x20-\x7E\xC0-\xFF]/u', '', $text);
        $text = trim($text);

        if (empty($text)) {
            return new WP_Error('no_text', __('Kein Text konnte aus dem PDF extrahiert werden.', 'bewerbungstrainer'));
        }

        return $text;
    }

    /**
     * Get analysis prompt based on document type
     *
     * @param string $text Document text
     * @param string $document_type Document type
     * @return string Prompt for Gemini
     */
    private function get_analysis_prompt($text, $document_type) {
        if ($document_type === 'cv') {
            return $this->get_cv_prompt($text);
        } else {
            return $this->get_cover_letter_prompt($text);
        }
    }

    /**
     * Get CV analysis prompt
     *
     * @param string $text CV text
     * @return string Prompt
     */
    private function get_cv_prompt($text) {
        return "Du bist ein professioneller Bewerbungsberater mit jahrelanger Erfahrung. Analysiere den folgenden Lebenslauf und gib umfangreiches, professionelles Feedback.

LEBENSLAUF:
{$text}

Bitte analysiere den Lebenslauf nach folgenden Kriterien und gib eine strukturierte Bewertung:

1. **Gesamtbewertung** (1-10): Gib eine Gesamtbewertung für den Lebenslauf.

2. **Struktur und Formatierung** (1-10):
   - Ist der Lebenslauf übersichtlich und professionell gestaltet?
   - Ist die Struktur logisch und leicht zu navigieren?

3. **Inhaltliche Qualität** (1-10):
   - Sind die Informationen relevant und aussagekräftig?
   - Werden Erfolge und Leistungen konkret dargestellt?

4. **Vollständigkeit** (1-10):
   - Sind alle wichtigen Informationen enthalten?
   - Fehlen wichtige Abschnitte?

5. **Professionalität** (1-10):
   - Wirkt der Lebenslauf professionell?
   - Gibt es Rechtschreib- oder Grammatikfehler?

6. **Stärken** (3-5 Punkte):
   - Was macht der Bewerber besonders gut?

7. **Verbesserungspotenzial** (3-5 Punkte):
   - Was könnte verbessert werden?

8. **Konkrete Handlungsempfehlungen** (3-5 Punkte):
   - Welche konkreten Schritte sollte der Bewerber unternehmen?

9. **Zusammenfassung**:
   - Eine kurze Zusammenfassung des Gesamteindrucks (2-3 Sätze)

Bitte gib deine Antwort im folgenden JSON-Format zurück:
{
  \"overall_rating\": 8.5,
  \"ratings\": {
    \"struktur\": 9,
    \"inhalt\": 8,
    \"vollstaendigkeit\": 8,
    \"professionalitaet\": 9
  },
  \"summary\": \"Zusammenfassung hier...\",
  \"strengths\": [
    \"Stärke 1\",
    \"Stärke 2\",
    \"Stärke 3\"
  ],
  \"improvements\": [
    \"Verbesserung 1\",
    \"Verbesserung 2\",
    \"Verbesserung 3\"
  ],
  \"recommendations\": [
    \"Empfehlung 1\",
    \"Empfehlung 2\",
    \"Empfehlung 3\"
  ]
}";
    }

    /**
     * Get cover letter analysis prompt
     *
     * @param string $text Cover letter text
     * @return string Prompt
     */
    private function get_cover_letter_prompt($text) {
        return "Du bist ein professioneller Bewerbungsberater mit jahrelanger Erfahrung. Analysiere das folgende Anschreiben und gib umfangreiches, professionelles Feedback.

ANSCHREIBEN:
{$text}

Bitte analysiere das Anschreiben nach folgenden Kriterien und gib eine strukturierte Bewertung:

1. **Gesamtbewertung** (1-10): Gib eine Gesamtbewertung für das Anschreiben.

2. **Aufbau und Struktur** (1-10):
   - Ist das Anschreiben logisch aufgebaut (Einleitung, Hauptteil, Schluss)?
   - Sind die Absätze sinnvoll strukturiert?

3. **Inhalt und Argumentation** (1-10):
   - Wird überzeugend dargelegt, warum der Bewerber zur Stelle passt?
   - Werden relevante Qualifikationen hervorgehoben?

4. **Motivation und Begeisterung** (1-10):
   - Wird die Motivation für die Position deutlich?
   - Wirkt das Anschreiben authentisch und überzeugend?

5. **Sprache und Stil** (1-10):
   - Ist die Sprache professionell und angemessen?
   - Gibt es Rechtschreib- oder Grammatikfehler?

6. **Stärken** (3-5 Punkte):
   - Was macht das Anschreiben besonders gut?

7. **Verbesserungspotenzial** (3-5 Punkte):
   - Was könnte verbessert werden?

8. **Konkrete Handlungsempfehlungen** (3-5 Punkte):
   - Welche konkreten Schritte sollte der Bewerber unternehmen?

9. **Zusammenfassung**:
   - Eine kurze Zusammenfassung des Gesamteindrucks (2-3 Sätze)

Bitte gib deine Antwort im folgenden JSON-Format zurück:
{
  \"overall_rating\": 8.5,
  \"ratings\": {
    \"aufbau\": 9,
    \"inhalt\": 8,
    \"motivation\": 9,
    \"sprache\": 8
  },
  \"summary\": \"Zusammenfassung hier...\",
  \"strengths\": [
    \"Stärke 1\",
    \"Stärke 2\",
    \"Stärke 3\"
  ],
  \"improvements\": [
    \"Verbesserung 1\",
    \"Verbesserung 2\",
    \"Verbesserung 3\"
  ],
  \"recommendations\": [
    \"Empfehlung 1\",
    \"Empfehlung 2\",
    \"Empfehlung 3\"
  ]
}";
    }

    /**
     * Call Gemini API
     *
     * @param string $prompt Prompt for Gemini
     * @param string $api_key API key
     * @return string|WP_Error Response text or WP_Error on failure
     */
    private function call_gemini_api($prompt, $api_key) {
        $url = $this->api_endpoint . '?key=' . $api_key;

        error_log('Gemini API Endpoint: ' . $this->api_endpoint);
        error_log('Full URL (with key): ' . substr($url, 0, 100) . '... (key hidden)');

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
                'maxOutputTokens' => 16384,
            )
        );

        error_log('Request body size: ' . strlen(json_encode($body)) . ' bytes');

        $response = wp_remote_post($url, array(
            'headers' => array(
                'Content-Type' => 'application/json',
            ),
            'body' => json_encode($body),
            'timeout' => 60,
        ));

        if (is_wp_error($response)) {
            error_log('WordPress HTTP Error: ' . $response->get_error_message());
            return $response;
        }

        $response_code = wp_remote_retrieve_response_code($response);
        error_log('Gemini API Response Code: ' . $response_code);

        if ($response_code !== 200) {
            $error_body = wp_remote_retrieve_body($response);
            error_log('Gemini API Error Response Body: ' . $error_body);
            error_log('Gemini API Error (Code ' . $response_code . '): ' . $error_body);

            // Try to parse error message from response
            $error_data = json_decode($error_body, true);
            $error_message = 'HTTP ' . $response_code;

            if (isset($error_data['error']['message'])) {
                $error_message .= ': ' . $error_data['error']['message'];
            }

            // Add helpful context for common errors
            if ($response_code === 404) {
                $error_message .= ' (Überprüfen Sie den API-Key und stellen Sie sicher, dass die Gemini API aktiviert ist)';
            } elseif ($response_code === 403) {
                $error_message .= ' (API-Key ungültig oder Berechtigungen fehlen)';
            }

            return new WP_Error(
                'api_error',
                __('Gemini API Fehler: ', 'bewerbungstrainer') . $error_message
            );
        }

        $response_body = wp_remote_retrieve_body($response);
        error_log('Gemini API Response Body (first 500 chars): ' . substr($response_body, 0, 500));

        $data = json_decode($response_body, true);

        if ($data && isset($data['candidates'])) {
            error_log('Found ' . count($data['candidates']) . ' candidates');
            if (isset($data['candidates'][0])) {
                error_log('Candidate 0 keys: ' . json_encode(array_keys($data['candidates'][0])));

                // Check finishReason for issues
                if (isset($data['candidates'][0]['finishReason'])) {
                    $finish_reason = $data['candidates'][0]['finishReason'];
                    error_log('Finish reason: ' . $finish_reason);

                    if ($finish_reason === 'MAX_TOKENS') {
                        error_log('MAX_TOKENS hit. ThoughtsTokenCount: ' . ($data['usageMetadata']['thoughtsTokenCount'] ?? 'unknown'));

                        // Check if we got any content despite MAX_TOKENS
                        if (!isset($data['candidates'][0]['content']['parts'][0]['text'])) {
                            return new WP_Error(
                                'max_tokens_exceeded',
                                __('Die Antwort war zu lang. Das Modell hat die Token-Grenze erreicht, bevor eine Antwort generiert werden konnte. Bitte versuchen Sie es mit einer kürzeren Anfrage oder kontaktieren Sie den Support.', 'bewerbungstrainer')
                            );
                        }
                    }
                }
            }
        }

        if (!isset($data['candidates'][0]['content']['parts'][0]['text'])) {
            error_log('Expected path not found in response. Full response (first 1000 chars): ' . substr($response_body, 0, 1000));
            return new WP_Error(
                'invalid_response',
                __('Ungültige Antwort von Gemini API.', 'bewerbungstrainer')
            );
        }

        $text = $data['candidates'][0]['content']['parts'][0]['text'];
        error_log('Extracted text (first 200 chars): ' . substr($text, 0, 200));

        return $text;
    }

    /**
     * Parse Gemini response
     *
     * @param string $response Response from Gemini
     * @param string $document_type Document type
     * @return array Parsed feedback
     */
    private function parse_gemini_response($response, $document_type) {
        // Try to extract JSON from response
        $json_match = null;
        if (preg_match('/\{[\s\S]*\}/', $response, $json_match)) {
            $json_str = $json_match[0];
            $feedback = json_decode($json_str, true);

            if (json_last_error() === JSON_ERROR_NONE && isset($feedback['overall_rating'])) {
                return $feedback;
            }
        }

        // Fallback: Create basic structure
        return array(
            'overall_rating' => 7.0,
            'ratings' => array(),
            'summary' => $response,
            'strengths' => array(),
            'improvements' => array(),
            'recommendations' => array(),
        );
    }

    /**
     * Generate interview questions based on position and experience level
     *
     * @param string $position Job position
     * @param string $company Company name (optional)
     * @param string $experience_level Experience level (student, entry, professional, senior)
     * @return array|WP_Error Array of questions or WP_Error on failure
     */
    public function generate_interview_questions($position, $company = '', $experience_level = 'professional') {
        // Get API key
        $api_key = get_option('bewerbungstrainer_gemini_api_key', '');

        error_log('=== VIDEO TRAINING DEBUG ===');
        error_log('API Key configured: ' . (!empty($api_key) ? 'YES (length: ' . strlen($api_key) . ')' : 'NO'));
        error_log('API Key first 10 chars: ' . substr($api_key, 0, 10) . '...');
        error_log('Position: ' . $position);
        error_log('Company: ' . $company);
        error_log('Experience Level: ' . $experience_level);

        if (empty($api_key)) {
            return new WP_Error(
                'missing_api_key',
                __('Gemini API Key ist nicht konfiguriert.', 'bewerbungstrainer')
            );
        }

        // First, let's list available models
        error_log('Fetching available Gemini models...');
        $available_models = $this->list_available_models($api_key);
        if (!is_wp_error($available_models)) {
            error_log('Available models: ' . json_encode($available_models));
        } else {
            error_log('Could not fetch models: ' . $available_models->get_error_message());
        }

        // Build prompt
        $prompt = $this->get_question_generation_prompt($position, $company, $experience_level);

        // Debug logging
        $this->log_prompt_debug(
            'QUESTION_GENERATION',
            'Video-Training: Generierung von Interview-Fragen. Erstellt 6-8 personalisierte Fragen basierend auf Position und Erfahrungslevel.',
            $prompt,
            array(
                'Position' => $position,
                'Firma' => !empty($company) ? $company : '(nicht angegeben)',
                'Erfahrungslevel' => $experience_level,
                'Erwartete Fragen' => '6-8 Fragen',
                'Kategorien' => 'Motivation, Fachlich, Soft Skills, Situativ',
            )
        );

        // Call Gemini API
        error_log('Calling Gemini API...');
        $response = $this->call_gemini_api($prompt, $api_key);

        if (is_wp_error($response)) {
            error_log('Gemini API returned error: ' . $response->get_error_message());
            // Log error response
            if (function_exists('bewerbungstrainer_log_response')) {
                bewerbungstrainer_log_response('QUESTION_GENERATION', $response->get_error_message(), true);
            }
            return $response;
        }

        error_log('Gemini API response received successfully');

        // Log successful response
        if (function_exists('bewerbungstrainer_log_response')) {
            bewerbungstrainer_log_response('QUESTION_GENERATION', $response);
        }

        // Parse response
        $questions = $this->parse_questions_response($response);

        error_log('Parsed ' . count($questions) . ' questions');
        error_log('=== END DEBUG ===');

        return $questions;
    }

    /**
     * List available Gemini models
     *
     * @param string $api_key API key
     * @return array|WP_Error List of model names or error
     */
    private function list_available_models($api_key) {
        $url = 'https://generativelanguage.googleapis.com/v1beta/models?key=' . $api_key;

        $response = wp_remote_get($url, array(
            'timeout' => 30,
        ));

        if (is_wp_error($response)) {
            return $response;
        }

        $response_code = wp_remote_retrieve_response_code($response);
        if ($response_code !== 200) {
            $error_body = wp_remote_retrieve_body($response);
            return new WP_Error('list_models_failed', 'Failed to list models: ' . $error_body);
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        if (!isset($data['models']) || !is_array($data['models'])) {
            return new WP_Error('invalid_response', 'Invalid response from ListModels API');
        }

        // Extract model names that support generateContent
        $model_names = array();
        foreach ($data['models'] as $model) {
            if (isset($model['name']) && isset($model['supportedGenerationMethods'])) {
                if (in_array('generateContent', $model['supportedGenerationMethods'])) {
                    // Extract just the model ID (e.g., "models/gemini-pro" -> "gemini-pro")
                    $model_names[] = str_replace('models/', '', $model['name']);
                }
            }
        }

        return $model_names;
    }

    /**
     * Get prompt for question generation
     *
     * @param string $position Job position
     * @param string $company Company name
     * @param string $experience_level Experience level
     * @return string Prompt
     */
    private function get_question_generation_prompt($position, $company, $experience_level) {
        $company_info = !empty($company) ? " bei {$company}" : '';

        $level_context = array(
            'student' => 'Schüler/Abiturient ohne Berufserfahrung',
            'entry' => 'Berufseinsteiger mit wenig Erfahrung',
            'professional' => 'Berufserfahrener Professional',
            'senior' => 'Senior-Level / Führungskraft',
        );

        $level_text = isset($level_context[$experience_level]) ? $level_context[$experience_level] : $level_context['professional'];

        return "Du bist ein erfahrener Recruiter und Interviewtrainer. Erstelle 6-8 passende Interviewfragen für folgende Position:

Position: {$position}{$company_info}
Erfahrungslevel: {$level_text}

Bitte erstelle eine ausgewogene Mischung aus:
- 2-3 Fragen zur Motivation und zum Interesse an der Position/Firma
- 2-3 fachliche/technische Fragen passend zur Position
- 1-2 Fragen zu Soft Skills und Arbeitsweise
- 1-2 situative/verhaltensbasierte Fragen

Die Fragen sollten:
- Realistisch und praxisnah sein
- Zum Erfahrungslevel passen
- Die Kandidaten zum Nachdenken anregen
- Authentische Antworten fördern

Gib die Fragen im folgenden JSON-Format zurück:
{
  \"questions\": [
    {
      \"id\": 1,
      \"question\": \"Warum möchten Sie als {$position}{$company_info} arbeiten?\",
      \"category\": \"motivation\",
      \"difficulty\": \"easy\"
    },
    {
      \"id\": 2,
      \"question\": \"Beschreiben Sie eine Situation, in der...\",
      \"category\": \"behavioral\",
      \"difficulty\": \"medium\"
    }
  ]
}

Kategorien: motivation, technical, soft_skills, behavioral
Schwierigkeit: easy, medium, hard";
    }

    /**
     * Parse questions response from Gemini
     *
     * @param string $response Response from Gemini
     * @return array Array of questions
     */
    private function parse_questions_response($response) {
        // Try to extract JSON from response
        $json_match = null;
        if (preg_match('/\{[\s\S]*\}/', $response, $json_match)) {
            $json_str = $json_match[0];
            $data = json_decode($json_str, true);

            if (json_last_error() === JSON_ERROR_NONE && isset($data['questions'])) {
                return $data['questions'];
            }
        }

        // Fallback: Return empty array
        return array();
    }

    /**
     * Analyze video interview
     *
     * @param string $video_path Path to video file
     * @param array $questions Array of interview questions
     * @param array $timeline Timeline of question changes
     * @param array $user_data User data (position, company, experience_level, name)
     * @return array|WP_Error Analysis result or WP_Error on failure
     */
    public function analyze_video_interview($video_path, $questions, $timeline, $user_data) {
        // Get API key
        $api_key = get_option('bewerbungstrainer_gemini_api_key', '');

        if (empty($api_key)) {
            return new WP_Error(
                'missing_api_key',
                __('Gemini API Key ist nicht konfiguriert.', 'bewerbungstrainer')
            );
        }

        // Check if video file exists
        if (!file_exists($video_path)) {
            return new WP_Error(
                'video_not_found',
                __('Video-Datei nicht gefunden.', 'bewerbungstrainer')
            );
        }

        // Upload video to Gemini and get transcript
        $video_data = $this->upload_video_to_gemini($video_path, $api_key);

        if (is_wp_error($video_data)) {
            return $video_data;
        }

        // Build analysis prompt
        $prompt = $this->get_video_analysis_prompt($questions, $user_data);

        // Debug logging
        $this->log_prompt_debug(
            'VIDEO_ANALYSIS',
            'Wirkungs-Analyse: Video-Interview-Bewertung. Analysiert Auftreten, Selbstbewusstsein, Körpersprache, Kommunikation, Professionalität.',
            $prompt,
            array(
                'Bewerber' => isset($user_data['name']) ? $user_data['name'] : '(nicht angegeben)',
                'Position' => isset($user_data['position']) ? $user_data['position'] : '(nicht angegeben)',
                'Firma' => isset($user_data['company']) ? $user_data['company'] : '(nicht angegeben)',
                'Anzahl Fragen' => count($questions),
                'Video URI' => $video_data['uri'],
                'Bewertungskategorien' => 'Auftreten, Selbstbewusstsein, Körpersprache, Kommunikation, Professionalität, Persönliche Wirkung',
            )
        );

        // Call Gemini API with video
        $analysis = $this->call_gemini_api_with_video($prompt, $video_data['uri'], $api_key);

        if (is_wp_error($analysis)) {
            // Log error response
            if (function_exists('bewerbungstrainer_log_response')) {
                bewerbungstrainer_log_response('VIDEO_ANALYSIS', $analysis->get_error_message(), true);
            }
            return $analysis;
        }

        // Log successful response
        if (function_exists('bewerbungstrainer_log_response')) {
            bewerbungstrainer_log_response('VIDEO_ANALYSIS', $analysis);
        }

        // Parse analysis response
        $result = $this->parse_video_analysis_response($analysis);

        // Add transcript if available
        if (isset($video_data['transcript'])) {
            $result['transcript'] = $video_data['transcript'];
        }

        return $result;
    }

    /**
     * Get prompt for video analysis
     *
     * @param array $questions Interview questions
     * @param array $user_data User data
     * @return string Prompt
     */
    private function get_video_analysis_prompt($questions, $user_data) {
        $questions_text = '';
        foreach ($questions as $i => $q) {
            $num = $i + 1;
            $question_text = isset($q['question']) ? $q['question'] : $q;
            $questions_text .= "{$num}. {$question_text}\n";
        }

        $name = isset($user_data['name']) ? $user_data['name'] : 'der Bewerber';
        $position = isset($user_data['position']) ? $user_data['position'] : '';
        $company = isset($user_data['company']) ? $user_data['company'] : '';

        return "Du bist ein erfahrener Recruiter, Kommunikationscoach und Körpersprache-Experte.
Du analysierst Video-Interviews neutral, professionell und konstruktiv.
Deine Aufgabe ist es, eine klare und hilfreiche Bewertung für einen Bewerber zu erstellen, der ein Video-Interview geübt hat.

KONTEXT:
Bewerber: {$name}
Position: {$position}" . (!empty($company) ? "\nFirma: {$company}" : "") . "

GESTELLTE FRAGEN:
{$questions_text}

Bewerte das Video-Interview anhand der folgenden Kategorien:

1. **Auftreten** - Wirkt die Person authentisch, professionell, sympathisch?
2. **Selbstbewusstsein** - Stimme, Klarheit, Sicherheit, Blickkontakt
3. **Körperhaltung & Körpersprache** - Haltung, Gestik, Mimik, Präsenz
4. **Kommunikation** - Struktur, Verständlichkeit, Wortwahl, roter Faden
5. **Eindruck der Professionalität** - Kleidung, Setting, Bild & Ton
6. **Persönliche Wirkung** - Was bleibt hängen? Was überzeugt?
7. **Stärken & positive Überraschungen**

Erstelle für jede Kategorie:
- Kurze Einschätzung
- Konkrete Verbesserungspotenziale
- Praktische Tipps, wie die Person ihren Eindruck im nächsten Video steigern kann

Sei direkt, hilfreich und konstruktiv.

Gib deine Bewertung im folgenden JSON-Format zurück:
{
  \"overall_score\": 75.5,
  \"categories\": {
    \"auftreten\": {
      \"score\": 80,
      \"einschaetzung\": \"...\",
      \"verbesserungspotenziale\": [\"...\"],
      \"praktische_tipps\": [\"...\"]
    },
    \"selbstbewusstsein\": {
      \"score\": 75,
      \"einschaetzung\": \"...\",
      \"verbesserungspotenziale\": [\"...\"],
      \"praktische_tipps\": [\"...\"]
    },
    \"koerpersprache\": {
      \"score\": 70,
      \"einschaetzung\": \"...\",
      \"verbesserungspotenziale\": [\"...\"],
      \"praktische_tipps\": [\"...\"]
    },
    \"kommunikation\": {
      \"score\": 80,
      \"einschaetzung\": \"...\",
      \"verbesserungspotenziale\": [\"...\"],
      \"praktische_tipps\": [\"...\"]
    },
    \"professionalitaet\": {
      \"score\": 85,
      \"einschaetzung\": \"...\",
      \"verbesserungspotenziale\": [\"...\"],
      \"praktische_tipps\": [\"...\"]
    },
    \"persoenliche_wirkung\": {
      \"score\": 75,
      \"einschaetzung\": \"...\",
      \"verbesserungspotenziale\": [\"...\"],
      \"praktische_tipps\": [\"...\"]
    }
  },
  \"staerken_und_positive_ueberraschungen\": [\"...\"],
  \"kurzfeedback_fuer_user\": \"...\"
}";
    }

    /**
     * Upload video to Gemini for analysis
     *
     * @param string $video_path Path to video file
     * @param string $api_key API key
     * @return array|WP_Error Video data with URI or WP_Error on failure
     */
    private function upload_video_to_gemini($video_path, $api_key) {
        error_log('=== UPLOAD VIDEO TO GEMINI ===');
        error_log('Video path: ' . $video_path);
        error_log('File exists: ' . (file_exists($video_path) ? 'YES' : 'NO'));

        // Read video file
        $video_content = file_get_contents($video_path);

        if ($video_content === false) {
            error_log('ERROR: Failed to read video file');
            return new WP_Error(
                'read_failed',
                __('Fehler beim Lesen der Video-Datei.', 'bewerbungstrainer')
            );
        }

        error_log('Video file read successfully, size: ' . strlen($video_content) . ' bytes');

        // Get mime type
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime_type = finfo_file($finfo, $video_path);
        finfo_close($finfo);
        error_log('MIME type: ' . $mime_type);

        // Upload to Gemini File API
        $upload_url = 'https://generativelanguage.googleapis.com/upload/v1beta/files?key=' . $api_key;

        $boundary = wp_generate_password(24, false);
        $body = '';
        $body .= "--{$boundary}\r\n";
        $body .= "Content-Type: application/json; charset=UTF-8\r\n\r\n";
        $body .= json_encode(array('file' => array('display_name' => basename($video_path)))) . "\r\n";
        $body .= "--{$boundary}\r\n";
        $body .= "Content-Type: {$mime_type}\r\n\r\n";
        $body .= $video_content . "\r\n";
        $body .= "--{$boundary}--\r\n";

        error_log('Uploading to Gemini File API...');
        error_log('Upload body size: ' . strlen($body) . ' bytes');

        $response = wp_remote_post($upload_url, array(
            'headers' => array(
                'Content-Type' => 'multipart/related; boundary=' . $boundary,
                'X-Goog-Upload-Protocol' => 'multipart',
            ),
            'body' => $body,
            'timeout' => 300,
        ));

        if (is_wp_error($response)) {
            error_log('ERROR: wp_remote_post returned WP_Error: ' . $response->get_error_message());
            return $response;
        }

        $response_code = wp_remote_retrieve_response_code($response);
        error_log('Upload response code: ' . $response_code);

        if ($response_code !== 200) {
            $error_body = wp_remote_retrieve_body($response);
            error_log('ERROR: Gemini File Upload failed');
            error_log('Response code: ' . $response_code);
            error_log('Response body: ' . $error_body);

            // Try to parse error message
            $error_data = json_decode($error_body, true);
            $error_message = 'Video-Upload zu Gemini fehlgeschlagen (HTTP ' . $response_code . ')';

            if (isset($error_data['error']['message'])) {
                $error_message .= ': ' . $error_data['error']['message'];
            }

            return new WP_Error(
                'upload_failed',
                __($error_message, 'bewerbungstrainer')
            );
        }

        $response_body = wp_remote_retrieve_body($response);
        error_log('Upload response body (first 500 chars): ' . substr($response_body, 0, 500));

        $data = json_decode($response_body, true);

        if (!isset($data['file']['uri'])) {
            error_log('ERROR: No file URI in response');
            error_log('Response data keys: ' . json_encode(array_keys($data ?? array())));
            return new WP_Error(
                'invalid_response',
                __('Ungültige Antwort vom Gemini File Upload.', 'bewerbungstrainer')
            );
        }

        error_log('Upload successful! File URI: ' . $data['file']['uri']);
        error_log('=== END UPLOAD ===');

        return array(
            'uri' => $data['file']['uri'],
            'name' => $data['file']['name'],
        );
    }

    /**
     * Call Gemini API with video
     *
     * @param string $prompt Text prompt
     * @param string $video_uri Gemini video URI
     * @param string $api_key API key
     * @return string|WP_Error Response or WP_Error
     */
    private function call_gemini_api_with_video($prompt, $video_uri, $api_key) {
        // Use VIDEO_MODEL (gemini-2.5-pro) for best video/vision analysis
        $url = 'https://generativelanguage.googleapis.com/v1beta/models/' . self::VIDEO_MODEL . ':generateContent?key=' . $api_key;

        $body = array(
            'contents' => array(
                array(
                    'parts' => array(
                        array('text' => $prompt),
                        array('file_data' => array('file_uri' => $video_uri))
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
            'headers' => array(
                'Content-Type' => 'application/json',
            ),
            'body' => json_encode($body),
            'timeout' => 120,
        ));

        if (is_wp_error($response)) {
            return $response;
        }

        $response_code = wp_remote_retrieve_response_code($response);
        if ($response_code !== 200) {
            $error_body = wp_remote_retrieve_body($response);
            error_log('Gemini API Error (Code ' . $response_code . '): ' . $error_body);

            // Try to parse error message from response
            $error_data = json_decode($error_body, true);
            $error_message = 'HTTP ' . $response_code;

            if (isset($error_data['error']['message'])) {
                $error_message .= ': ' . $error_data['error']['message'];
            }

            // Add helpful context for common errors
            if ($response_code === 404) {
                $error_message .= ' (Überprüfen Sie den API-Key und stellen Sie sicher, dass die Gemini API aktiviert ist)';
            } elseif ($response_code === 403) {
                $error_message .= ' (API-Key ungültig oder Berechtigungen fehlen)';
            }

            return new WP_Error(
                'api_error',
                __('Gemini API Fehler: ', 'bewerbungstrainer') . $error_message
            );
        }

        $response_body = wp_remote_retrieve_body($response);
        error_log('Gemini API Response Body (first 500 chars): ' . substr($response_body, 0, 500));

        $data = json_decode($response_body, true);

        if ($data && isset($data['candidates'])) {
            error_log('Found ' . count($data['candidates']) . ' candidates');
            if (isset($data['candidates'][0])) {
                error_log('Candidate 0 keys: ' . json_encode(array_keys($data['candidates'][0])));

                // Check finishReason for issues
                if (isset($data['candidates'][0]['finishReason'])) {
                    $finish_reason = $data['candidates'][0]['finishReason'];
                    error_log('Finish reason: ' . $finish_reason);

                    if ($finish_reason === 'MAX_TOKENS') {
                        error_log('MAX_TOKENS hit. ThoughtsTokenCount: ' . ($data['usageMetadata']['thoughtsTokenCount'] ?? 'unknown'));

                        // Check if we got any content despite MAX_TOKENS
                        if (!isset($data['candidates'][0]['content']['parts'][0]['text'])) {
                            return new WP_Error(
                                'max_tokens_exceeded',
                                __('Die Antwort war zu lang. Das Modell hat die Token-Grenze erreicht, bevor eine Antwort generiert werden konnte. Bitte versuchen Sie es mit einer kürzeren Anfrage oder kontaktieren Sie den Support.', 'bewerbungstrainer')
                            );
                        }
                    }
                }
            }
        }

        if (!isset($data['candidates'][0]['content']['parts'][0]['text'])) {
            error_log('Expected path not found in response. Full response (first 1000 chars): ' . substr($response_body, 0, 1000));
            return new WP_Error(
                'invalid_response',
                __('Ungültige Antwort von Gemini API.', 'bewerbungstrainer')
            );
        }

        $text = $data['candidates'][0]['content']['parts'][0]['text'];
        error_log('Extracted text (first 200 chars): ' . substr($text, 0, 200));

        return $text;
    }

    /**
     * Parse video analysis response
     *
     * @param string $response Response from Gemini
     * @return array Parsed analysis
     */
    private function parse_video_analysis_response($response) {
        // Try to extract JSON from response
        $json_match = null;
        if (preg_match('/\{[\s\S]*\}/', $response, $json_match)) {
            $json_str = $json_match[0];
            $analysis = json_decode($json_str, true);

            if (json_last_error() === JSON_ERROR_NONE && isset($analysis['overall_score'])) {
                return $analysis;
            }
        }

        // Fallback: Return basic structure
        return array(
            'overall_score' => 70.0,
            'categories' => array(),
            'staerken_und_positive_ueberraschungen' => array(),
            'kurzfeedback_fuer_user' => $response,
        );
    }
}
