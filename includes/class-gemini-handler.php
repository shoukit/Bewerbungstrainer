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
     * Gemini API endpoint
     */
    private $api_endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

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

        // Call Gemini API
        $response = $this->call_gemini_api($prompt, $api_key);

        if (is_wp_error($response)) {
            return $response;
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
        if ($response_code !== 200) {
            $error_body = wp_remote_retrieve_body($response);
            error_log('Gemini API Error: ' . $error_body);
            return new WP_Error(
                'api_error',
                __('Gemini API Fehler: ', 'bewerbungstrainer') . $response_code
            );
        }

        $response_body = wp_remote_retrieve_body($response);
        $data = json_decode($response_body, true);

        if (!isset($data['candidates'][0]['content']['parts'][0]['text'])) {
            return new WP_Error(
                'invalid_response',
                __('Ungültige Antwort von Gemini API.', 'bewerbungstrainer')
            );
        }

        return $data['candidates'][0]['content']['parts'][0]['text'];
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
}
