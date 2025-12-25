<?php
/**
 * PDF Exporter Class
 *
 * Handles PDF export functionality for session ratings
 * Supports: Live-Simulation, Szenario-Training, Wirkungs-Analyse
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

class Bewerbungstrainer_PDF_Exporter {

    /**
     * Instance of this class
     */
    private static $instance = null;

    /**
     * Database instance
     */
    private $db;

    /**
     * Simulator database instance
     */
    private $simulator_db;

    /**
     * Video training database instance
     */
    private $video_db;

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
        $this->db = Bewerbungstrainer_Database::get_instance();

        // Load simulator and video database if available
        if (class_exists('Bewerbungstrainer_Simulator_Database')) {
            $this->simulator_db = Bewerbungstrainer_Simulator_Database::get_instance();
        }
        if (class_exists('Bewerbungstrainer_Video_Training_Database')) {
            $this->video_db = Bewerbungstrainer_Video_Training_Database::get_instance();
        }
    }

    // =========================================================================
    // SHARED STYLES
    // =========================================================================

    /**
     * Get shared CSS styles for all PDF types
     */
    private function get_shared_styles() {
        return '
            @page {
                margin: 20mm 15mm;
            }
            * {
                box-sizing: border-box;
            }
            body {
                font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
                font-size: 11pt;
                line-height: 1.5;
                color: #1e293b;
                margin: 0;
                padding: 0;
            }
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 24px;
                margin: -20mm -15mm 20px -15mm;
                text-align: center;
            }
            .header h1 {
                font-size: 22pt;
                font-weight: 700;
                margin: 0 0 8px 0;
                letter-spacing: -0.5px;
            }
            .header .subtitle {
                font-size: 12pt;
                opacity: 0.9;
                margin: 0;
            }
            .header .meta {
                display: inline-block;
                margin-top: 12px;
                font-size: 10pt;
                opacity: 0.85;
            }
            .header .meta-item {
                display: inline-block;
                margin: 0 12px;
            }
            .score-box {
                background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
                border: 2px solid #667eea;
                border-radius: 12px;
                padding: 20px;
                text-align: center;
                margin: 20px 0;
            }
            .score-value {
                font-size: 42pt;
                font-weight: 800;
                color: #667eea;
                line-height: 1;
            }
            .score-label {
                font-size: 11pt;
                color: #64748b;
                margin-top: 4px;
            }
            .score-grade {
                font-size: 14pt;
                font-weight: 600;
                color: #7c3aed;
                margin-top: 8px;
            }
            h2 {
                font-size: 14pt;
                font-weight: 700;
                color: #1e293b;
                margin: 24px 0 12px 0;
                padding-bottom: 6px;
                border-bottom: 2px solid #e2e8f0;
            }
            h3 {
                font-size: 12pt;
                font-weight: 600;
                color: #475569;
                margin: 16px 0 8px 0;
            }
            .section {
                margin: 16px 0;
                padding: 16px;
                border-radius: 10px;
                page-break-inside: avoid;
            }
            .section.strengths {
                background: #f0fdf4;
                border-left: 4px solid #10b981;
            }
            .section.improvements {
                background: #fffbeb;
                border-left: 4px solid #f59e0b;
            }
            .section.tips {
                background: #eff6ff;
                border-left: 4px solid #3b82f6;
            }
            .section.summary {
                background: #faf5ff;
                border-left: 4px solid #7c3aed;
            }
            .section.transcript {
                background: #f8fafc;
                border-left: 4px solid #94a3b8;
            }
            .section h4 {
                font-size: 11pt;
                font-weight: 600;
                margin: 0 0 10px 0;
            }
            .section.strengths h4 { color: #059669; }
            .section.improvements h4 { color: #d97706; }
            .section.tips h4 { color: #2563eb; }
            .section.summary h4 { color: #7c3aed; }
            .section.transcript h4 { color: #475569; }
            ul {
                margin: 8px 0;
                padding-left: 20px;
            }
            li {
                margin: 6px 0;
                line-height: 1.5;
            }
            .ratings-grid {
                width: 100%;
                border-collapse: collapse;
                margin: 12px 0;
            }
            .ratings-grid td {
                padding: 10px 12px;
                border-bottom: 1px solid #e2e8f0;
            }
            .ratings-grid .label {
                font-weight: 500;
                color: #334155;
            }
            .ratings-grid .score {
                text-align: right;
                font-weight: 700;
                color: #667eea;
            }
            .ratings-grid .bar-cell {
                width: 120px;
            }
            .progress-bar {
                height: 8px;
                background: #e2e8f0;
                border-radius: 4px;
                overflow: hidden;
            }
            .progress-bar-fill {
                height: 100%;
                border-radius: 4px;
            }
            .question-card {
                background: #fff;
                border: 1px solid #e2e8f0;
                border-radius: 10px;
                padding: 16px;
                margin: 16px 0;
                page-break-inside: avoid;
            }
            .question-header {
                display: table;
                width: 100%;
                margin-bottom: 12px;
            }
            .question-number {
                display: table-cell;
                width: 36px;
                height: 36px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                font-weight: 700;
                font-size: 14pt;
                text-align: center;
                vertical-align: middle;
                border-radius: 8px;
            }
            .question-text {
                display: table-cell;
                vertical-align: middle;
                padding-left: 12px;
                font-weight: 600;
                color: #1e293b;
            }
            .question-score {
                display: table-cell;
                width: 60px;
                text-align: right;
                vertical-align: middle;
                font-weight: 700;
                font-size: 16pt;
            }
            .answer-text {
                font-style: italic;
                color: #64748b;
                background: #f8fafc;
                padding: 12px;
                border-radius: 8px;
                margin: 12px 0;
                font-size: 10pt;
                line-height: 1.6;
            }
            .metrics-grid {
                display: table;
                width: 100%;
                margin: 12px 0;
            }
            .metric-box {
                display: table-cell;
                width: 25%;
                padding: 8px;
                text-align: center;
                background: #f8fafc;
                border-radius: 8px;
            }
            .metric-value {
                font-size: 16pt;
                font-weight: 700;
                color: #667eea;
            }
            .metric-label {
                font-size: 9pt;
                color: #64748b;
                margin-top: 2px;
            }
            .footer {
                margin-top: 30px;
                padding-top: 16px;
                border-top: 1px solid #e2e8f0;
                text-align: center;
                font-size: 9pt;
                color: #94a3b8;
            }
            .page-break {
                page-break-before: always;
            }
            .score-excellent { color: #10b981; }
            .score-good { color: #f59e0b; }
            .score-fair { color: #ef4444; }
            .bg-excellent { background: #10b981; }
            .bg-good { background: #f59e0b; }
            .bg-fair { background: #ef4444; }
        ';
    }

    /**
     * Get score color class based on percentage
     */
    private function get_score_class($score) {
        if ($score >= 80) return 'excellent';
        if ($score >= 60) return 'good';
        return 'fair';
    }

    /**
     * Get grade label based on score
     */
    private function get_grade_label($score) {
        if ($score >= 90) return 'Ausgezeichnet!';
        if ($score >= 80) return 'Sehr gut!';
        if ($score >= 70) return 'Gut!';
        if ($score >= 60) return 'Solide Leistung';
        if ($score >= 50) return 'Ausbaufähig';
        return 'Weiter üben!';
    }

    /**
     * Format date for display
     */
    private function format_date($date_string) {
        $date = new DateTime($date_string);
        return $date->format('d.m.Y H:i');
    }

    /**
     * Render section HTML
     */
    private function render_section($type, $title, $items) {
        if (empty($items)) return '';

        $html = '<div class="section ' . esc_attr($type) . '">';
        $html .= '<h4>' . esc_html($title) . '</h4>';
        $html .= '<ul>';
        foreach ($items as $item) {
            $html .= '<li>' . esc_html($item) . '</li>';
        }
        $html .= '</ul></div>';
        return $html;
    }

    /**
     * Export session to PDF
     *
     * @param int $session_id Session ID
     * @param int $user_id User ID (for security check)
     * @return string|WP_Error PDF file path or WP_Error on failure
     */
    public function export_session_pdf($session_id, $user_id = null) {
        if ($user_id === null) {
            $user_id = get_current_user_id();
        }

        // Get session
        $session = $this->db->get_session($session_id);

        if (!$session) {
            return new WP_Error('not_found', __('Sitzung nicht gefunden.', 'bewerbungstrainer'));
        }

        // Check ownership
        if ((int) $session->user_id !== (int) $user_id) {
            return new WP_Error('forbidden', __('Keine Berechtigung.', 'bewerbungstrainer'));
        }

        // Parse feedback (handle both string and already-decoded array)
        $feedback = null;
        if (!empty($session->feedback_json)) {
            $feedback = is_array($session->feedback_json)
                ? $session->feedback_json
                : json_decode($session->feedback_json, true);
        }
        $audio_analysis = null;
        if (!empty($session->audio_analysis_json)) {
            $audio_analysis = is_array($session->audio_analysis_json)
                ? $session->audio_analysis_json
                : json_decode($session->audio_analysis_json, true);
        }

        // Generate HTML content
        $html = $this->generate_pdf_html($session, $feedback, $audio_analysis);

        // Create PDF using WordPress built-in functionality
        $pdf_path = $this->html_to_pdf($html, $session_id);

        return $pdf_path;
    }

    /**
     * Generate HTML content for PDF
     *
     * @param object $session Session object
     * @param array $feedback Feedback data
     * @param array $audio_analysis Audio analysis data
     * @return string HTML content
     */
    private function generate_pdf_html($session, $feedback, $audio_analysis) {
        $date = new DateTime($session->created_at);
        $formatted_date = $date->format('d.m.Y H:i');

        $overall_rating = null;
        if ($feedback && isset($feedback['rating']['overall'])) {
            $overall_rating = $feedback['rating']['overall'];
        }

        ob_start();
        ?>
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {
                    font-family: Arial, sans-serif;
                    font-size: 12pt;
                    line-height: 1.6;
                    color: #333;
                }
                h1 {
                    color: #667eea;
                    font-size: 24pt;
                    margin-bottom: 10px;
                    border-bottom: 3px solid #667eea;
                    padding-bottom: 10px;
                }
                h2 {
                    color: #667eea;
                    font-size: 18pt;
                    margin-top: 20px;
                    margin-bottom: 10px;
                }
                h3 {
                    color: #764ba2;
                    font-size: 14pt;
                    margin-top: 15px;
                    margin-bottom: 8px;
                }
                .header-info {
                    background: #f8fafc;
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                }
                .header-info p {
                    margin: 5px 0;
                }
                .rating-box {
                    background: #faf5ff;
                    padding: 20px;
                    border-left: 4px solid #7c3aed;
                    margin: 20px 0;
                    text-align: center;
                }
                .rating-value {
                    font-size: 36pt;
                    font-weight: bold;
                    color: #6d28d9;
                }
                .ratings-grid {
                    display: table;
                    width: 100%;
                    margin: 15px 0;
                }
                .rating-item {
                    display: table-row;
                }
                .rating-label, .rating-score {
                    display: table-cell;
                    padding: 8px;
                    border-bottom: 1px solid #e2e8f0;
                }
                .rating-label {
                    font-weight: bold;
                    width: 70%;
                }
                .rating-score {
                    text-align: right;
                    color: #6d28d9;
                    font-weight: bold;
                }
                .section {
                    margin: 20px 0;
                    padding: 15px;
                    border-radius: 8px;
                }
                .section.strengths {
                    background: #f0fdf4;
                    border-left: 4px solid #10b981;
                }
                .section.improvements {
                    background: #fff7ed;
                    border-left: 4px solid #f59e0b;
                }
                .section.tips {
                    background: #eff6ff;
                    border-left: 4px solid #3b82f6;
                }
                ul {
                    margin: 10px 0;
                    padding-left: 25px;
                }
                li {
                    margin: 5px 0;
                }
                .footer {
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 2px solid #e2e8f0;
                    text-align: center;
                    font-size: 10pt;
                    color: #64748b;
                }
            </style>
        </head>
        <body>
            <h1>Bewerbungstrainer - Bewertungsbericht</h1>

            <div class="header-info">
                <p><strong>📅 Datum:</strong> <?php echo esc_html($formatted_date); ?></p>
                <p><strong>💼 Position:</strong> <?php echo esc_html($session->position); ?></p>
                <p><strong>🏢 Unternehmen:</strong> <?php echo esc_html($session->company); ?></p>
            </div>

            <?php if ($overall_rating !== null) : ?>
            <div class="rating-box">
                <h2>Gesamtbewertung</h2>
                <div class="rating-value"><?php echo esc_html($overall_rating); ?>/10</div>
            </div>
            <?php endif; ?>

            <?php if ($feedback) : ?>
                <?php if (isset($feedback['summary'])) : ?>
                <h2>Gesamteindruck</h2>
                <p><?php echo esc_html($feedback['summary']); ?></p>
                <?php endif; ?>

                <?php if (isset($feedback['rating'])) : ?>
                <h2>Detaillierte Bewertungen</h2>
                <div class="ratings-grid">
                    <?php foreach ($feedback['rating'] as $category => $rating) : ?>
                    <div class="rating-item">
                        <div class="rating-label"><?php echo esc_html(ucfirst($category)); ?></div>
                        <div class="rating-score"><?php echo esc_html($rating); ?>/10</div>
                    </div>
                    <?php endforeach; ?>
                </div>
                <?php endif; ?>

                <?php if (isset($feedback['strengths']) && !empty($feedback['strengths'])) : ?>
                <div class="section strengths">
                    <h3>✓ Stärken</h3>
                    <ul>
                        <?php foreach ($feedback['strengths'] as $strength) : ?>
                        <li><?php echo esc_html($strength); ?></li>
                        <?php endforeach; ?>
                    </ul>
                </div>
                <?php endif; ?>

                <?php if (isset($feedback['improvements']) && !empty($feedback['improvements'])) : ?>
                <div class="section improvements">
                    <h3>⚡ Verbesserungspotenzial</h3>
                    <ul>
                        <?php foreach ($feedback['improvements'] as $improvement) : ?>
                        <li><?php echo esc_html($improvement); ?></li>
                        <?php endforeach; ?>
                    </ul>
                </div>
                <?php endif; ?>

                <?php if (isset($feedback['tips']) && !empty($feedback['tips'])) : ?>
                <div class="section tips">
                    <h3>💡 Tipps für die Zukunft</h3>
                    <ul>
                        <?php foreach ($feedback['tips'] as $tip) : ?>
                        <li><?php echo esc_html($tip); ?></li>
                        <?php endforeach; ?>
                    </ul>
                </div>
                <?php endif; ?>
            <?php endif; ?>

            <?php if ($audio_analysis && !isset($audio_analysis['error'])) : ?>
                <h2>Audio-Analyse</h2>
                <?php if (isset($audio_analysis['summary'])) : ?>
                <p><?php echo esc_html($audio_analysis['summary']); ?></p>
                <?php endif; ?>

                <div class="ratings-grid">
                    <?php
                    $metrics = array('clarity', 'pace', 'confidence', 'tonalModulation');
                    foreach ($metrics as $metric) :
                        if (isset($audio_analysis[$metric])) :
                    ?>
                    <div class="rating-item">
                        <div class="rating-label"><?php echo esc_html(ucfirst($metric)); ?></div>
                        <div class="rating-score"><?php echo esc_html($audio_analysis[$metric]['rating']); ?>/10</div>
                    </div>
                    <?php
                        endif;
                    endforeach;
                    ?>
                </div>
            <?php endif; ?>

            <div class="footer">
                <p>Erstellt mit Bewerbungstrainer</p>
                <p><?php echo esc_html(get_bloginfo('name')); ?> - <?php echo esc_html(date('d.m.Y H:i')); ?></p>
            </div>
        </body>
        </html>
        <?php
        return ob_get_clean();
    }

    /**
     * Convert HTML to PDF
     *
     * @param string $html HTML content
     * @param int $session_id Session ID
     * @return string|WP_Error PDF file path or WP_Error on failure
     */
    private function html_to_pdf($html, $session_id) {
        // Load Composer autoloader
        $autoload_path = BEWERBUNGSTRAINER_PLUGIN_DIR . 'vendor/autoload.php';
        if (!file_exists($autoload_path)) {
            return new WP_Error('missing_library', __('DomPDF-Bibliothek nicht gefunden. Bitte installieren Sie Composer-Abhängigkeiten.', 'bewerbungstrainer'));
        }

        require_once($autoload_path);

        try {
            $options = new \Dompdf\Options();
            $options->set('isHtml5ParserEnabled', true);
            $options->set('isRemoteEnabled', false);

            $dompdf = new \Dompdf\Dompdf($options);
            $dompdf->loadHtml($html);
            $dompdf->setPaper('A4', 'portrait');
            $dompdf->render();

            // Create uploads directory if it doesn't exist
            $upload_dir = wp_upload_dir();
            $bewerbungstrainer_dir = $upload_dir['basedir'] . '/bewerbungstrainer-pdfs';

            if (!file_exists($bewerbungstrainer_dir)) {
                wp_mkdir_p($bewerbungstrainer_dir);
            }

            // Generate unique filename
            $filename = 'bewertung-' . $session_id . '-' . time() . '.pdf';
            $file_path = $bewerbungstrainer_dir . '/' . $filename;

            // Save PDF
            file_put_contents($file_path, $dompdf->output());

            return $file_path;

        } catch (Exception $e) {
            error_log('Bewerbungstrainer PDF Export Error: ' . $e->getMessage());
            return new WP_Error('pdf_generation_failed', __('PDF-Generierung fehlgeschlagen: ', 'bewerbungstrainer') . $e->getMessage());
        }
    }

    /**
     * Stream PDF to browser
     *
     * @param int $session_id Session ID
     * @param int $user_id User ID
     * @return void
     */
    public function stream_session_pdf($session_id, $user_id = null) {
        $pdf_path = $this->export_session_pdf($session_id, $user_id);

        if (is_wp_error($pdf_path)) {
            wp_die($pdf_path->get_error_message());
        }

        // Get session for filename
        $session = $this->db->get_session($session_id);
        $date = new DateTime($session->created_at);
        $download_filename = 'Bewertung-' . sanitize_file_name($session->position) . '-' . $date->format('Y-m-d') . '.pdf';

        // Stream PDF
        header('Content-Type: application/pdf');
        header('Content-Disposition: attachment; filename="' . $download_filename . '"');
        header('Content-Length: ' . filesize($pdf_path));
        header('Cache-Control: private, max-age=0, must-revalidate');
        header('Pragma: public');

        readfile($pdf_path);

        // Clean up temporary file
        wp_delete_file($pdf_path);

        exit;
    }

    /**
     * Get roleplay session PDF as base64 for REST API response
     *
     * @param int $session_id Session ID
     * @param int $user_id User ID (for security check)
     * @return array|WP_Error PDF data or WP_Error on failure
     */
    public function get_session_pdf_base64($session_id, $user_id = null) {
        $pdf_path = $this->export_session_pdf($session_id, $user_id);

        if (is_wp_error($pdf_path)) {
            return $pdf_path;
        }

        // Read PDF content and encode as base64
        $pdf_content = file_get_contents($pdf_path);
        $base64_content = base64_encode($pdf_content);

        // Get session for filename
        $session = $this->db->get_session($session_id);
        $date = new DateTime($session->created_at);
        $download_filename = 'Live-Simulation-' . sanitize_file_name($session->position) . '-' . $date->format('Y-m-d') . '.pdf';

        // Clean up temporary file
        wp_delete_file($pdf_path);

        return array(
            'pdf_base64' => $base64_content,
            'filename' => $download_filename,
            'content_type' => 'application/pdf',
        );
    }

    // =========================================================================
    // SIMULATOR SESSION PDF EXPORT
    // =========================================================================

    /**
     * Export simulator session to PDF
     *
     * @param int $session_id Session ID
     * @param int $user_id User ID (for security check)
     * @return string|WP_Error PDF file path or WP_Error on failure
     */
    public function export_simulator_session_pdf($session_id, $user_id = null) {
        try {
            if ($user_id === null) {
                $user_id = get_current_user_id();
            }

            if (!$this->simulator_db) {
                return new WP_Error('not_available', __('Simulator-Modul nicht verfügbar.', 'bewerbungstrainer'));
            }

            // Get session with answers
            $session = $this->simulator_db->get_session($session_id);

            if (!$session) {
                return new WP_Error('not_found', __('Sitzung nicht gefunden.', 'bewerbungstrainer'));
            }

            // Check ownership
            if ((int) $session->user_id !== (int) $user_id) {
                return new WP_Error('forbidden', __('Keine Berechtigung.', 'bewerbungstrainer'));
            }

            // Get answers
            $answers = $this->simulator_db->get_session_answers($session_id);

            // Get scenario (stored in custom table, not as WordPress post)
            $scenario = $this->simulator_db->get_scenario($session->scenario_id);
            $scenario_title = $scenario ? $scenario->title : 'Szenario-Training';

            // Generate HTML content
            $html = $this->generate_simulator_pdf_html($session, $answers, $scenario_title);

            // Create PDF
            $pdf_path = $this->html_to_pdf($html, 'simulator-' . $session_id);

            return $pdf_path;
        } catch (Exception $e) {
            error_log('[PDF EXPORT] Simulator PDF error: ' . $e->getMessage());
            return new WP_Error('pdf_error', $e->getMessage());
        }
    }

    /**
     * Generate HTML content for Simulator PDF
     */
    private function generate_simulator_pdf_html($session, $answers, $scenario_title) {
        $formatted_date = $this->format_date($session->created_at);

        // Calculate overall score (convert from 0-10 to 0-100)
        $overall_score = isset($session->overall_score) ? floatval($session->overall_score) * 10 : 0;
        $score_class = $this->get_score_class($overall_score);
        $grade_label = $this->get_grade_label($overall_score);

        // Parse summary feedback (may already be decoded by database class)
        $summary_feedback = null;
        if (!empty($session->summary_feedback_json)) {
            $summary_feedback = is_array($session->summary_feedback_json)
                ? $session->summary_feedback_json
                : json_decode($session->summary_feedback_json, true);
        }

        ob_start();
        ?>
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style><?php echo $this->get_shared_styles(); ?></style>
        </head>
        <body>
            <!-- Header -->
            <div class="header">
                <h1>Szenario-Training</h1>
                <p class="subtitle"><?php echo esc_html($scenario_title); ?></p>
                <div class="meta">
                    <span class="meta-item">📅 <?php echo esc_html($formatted_date); ?></span>
                    <span class="meta-item">📝 <?php echo count($answers); ?> Fragen beantwortet</span>
                </div>
            </div>

            <!-- Score Box -->
            <div class="score-box">
                <div class="score-value score-<?php echo $score_class; ?>"><?php echo round($overall_score); ?>%</div>
                <div class="score-label">Gesamtbewertung</div>
                <div class="score-grade"><?php echo esc_html($grade_label); ?></div>
            </div>

            <?php if ($summary_feedback) : ?>
                <!-- Summary -->
                <?php if (!empty($summary_feedback['summary'])) : ?>
                <div class="section summary">
                    <h4>📋 Zusammenfassung</h4>
                    <p><?php echo esc_html($summary_feedback['summary']); ?></p>
                </div>
                <?php endif; ?>

                <!-- Overall Scores -->
                <?php if (!empty($summary_feedback['scores'])) : ?>
                <h2>Bewertungsübersicht</h2>
                <table class="ratings-grid">
                    <?php foreach ($summary_feedback['scores'] as $category => $score) :
                        $score_100 = floatval($score) * 10;
                        $cat_class = $this->get_score_class($score_100);
                    ?>
                    <tr>
                        <td class="label"><?php echo esc_html(ucfirst(str_replace('_', ' ', $category))); ?></td>
                        <td class="bar-cell">
                            <div class="progress-bar">
                                <div class="progress-bar-fill bg-<?php echo $cat_class; ?>" style="width: <?php echo $score_100; ?>%;"></div>
                            </div>
                        </td>
                        <td class="score score-<?php echo $cat_class; ?>"><?php echo round($score_100); ?>%</td>
                    </tr>
                    <?php endforeach; ?>
                </table>
                <?php endif; ?>

                <!-- Key Takeaways -->
                <?php if (!empty($summary_feedback['key_takeaways'])) : ?>
                <?php echo $this->render_section('tips', '💡 Wichtigste Erkenntnisse', $summary_feedback['key_takeaways']); ?>
                <?php endif; ?>
            <?php endif; ?>

            <!-- Individual Answers -->
            <?php if (!empty($answers)) : ?>
            <h2>Deine Antworten im Detail</h2>
            <?php foreach ($answers as $index => $answer) :
                // feedback_json and audio_analysis_json are already decoded by get_session_answers()
                $feedback = !empty($answer->feedback_json) ? $answer->feedback_json : null;
                $audio_analysis = !empty($answer->audio_analysis_json) ? $answer->audio_analysis_json : null;
                $answer_score = isset($answer->overall_score) ? floatval($answer->overall_score) * 10 : null;
                $answer_class = $answer_score !== null ? $this->get_score_class($answer_score) : '';
                $is_no_speech = $answer->transcript === '[Keine Sprache erkannt]';
            ?>
            <div class="question-card">
                <div class="question-header">
                    <div class="question-number"><?php echo ($index + 1); ?></div>
                    <div class="question-text"><?php echo esc_html($answer->question_text ?: 'Frage ' . ($index + 1)); ?></div>
                    <?php if ($answer_score !== null && !$is_no_speech) : ?>
                    <div class="question-score score-<?php echo $answer_class; ?>"><?php echo round($answer_score); ?>%</div>
                    <?php endif; ?>
                </div>

                <!-- Transcript -->
                <?php if (!empty($answer->transcript)) : ?>
                <div class="answer-text">
                    "<?php echo esc_html($answer->transcript); ?>"
                </div>
                <?php endif; ?>

                <?php if ($feedback && !$is_no_speech) : ?>
                    <!-- Scores Grid -->
                    <?php if (!empty($feedback['scores'])) : ?>
                    <table class="ratings-grid" style="margin-bottom: 12px;">
                        <?php
                        $score_labels = [
                            'content' => 'Inhalt',
                            'structure' => 'Struktur',
                            'relevance' => 'Relevanz',
                            'delivery' => 'Präsentation',
                            'overall' => 'Gesamt'
                        ];
                        foreach ($feedback['scores'] as $key => $value) :
                            if (!isset($score_labels[$key])) continue;
                            $val_100 = floatval($value) * 10;
                            $val_class = $this->get_score_class($val_100);
                        ?>
                        <tr>
                            <td class="label"><?php echo esc_html($score_labels[$key]); ?></td>
                            <td class="bar-cell">
                                <div class="progress-bar">
                                    <div class="progress-bar-fill bg-<?php echo $val_class; ?>" style="width: <?php echo $val_100; ?>%;"></div>
                                </div>
                            </td>
                            <td class="score score-<?php echo $val_class; ?>"><?php echo round($val_100); ?></td>
                        </tr>
                        <?php endforeach; ?>
                    </table>
                    <?php endif; ?>

                    <!-- Strengths -->
                    <?php if (!empty($feedback['strengths'])) : ?>
                    <div class="section strengths" style="margin: 8px 0; padding: 10px;">
                        <h4 style="font-size: 10pt;">✓ Stärken</h4>
                        <ul style="font-size: 10pt;">
                            <?php foreach ($feedback['strengths'] as $item) : ?>
                            <li><?php echo esc_html($item); ?></li>
                            <?php endforeach; ?>
                        </ul>
                    </div>
                    <?php endif; ?>

                    <!-- Improvements -->
                    <?php if (!empty($feedback['improvements'])) : ?>
                    <div class="section improvements" style="margin: 8px 0; padding: 10px;">
                        <h4 style="font-size: 10pt;">⚡ Verbesserungspotenzial</h4>
                        <ul style="font-size: 10pt;">
                            <?php foreach ($feedback['improvements'] as $item) : ?>
                            <li><?php echo esc_html($item); ?></li>
                            <?php endforeach; ?>
                        </ul>
                    </div>
                    <?php endif; ?>

                    <!-- Tips -->
                    <?php if (!empty($feedback['tips'])) : ?>
                    <div class="section tips" style="margin: 8px 0; padding: 10px;">
                        <h4 style="font-size: 10pt;">💡 Tipps</h4>
                        <ul style="font-size: 10pt;">
                            <?php foreach ($feedback['tips'] as $item) : ?>
                            <li><?php echo esc_html($item); ?></li>
                            <?php endforeach; ?>
                        </ul>
                    </div>
                    <?php endif; ?>
                <?php endif; ?>

                <!-- Audio Metrics -->
                <?php if ($audio_analysis && !$is_no_speech) : ?>
                <div style="margin-top: 12px; padding: 10px; background: #f8fafc; border-radius: 8px;">
                    <h4 style="font-size: 10pt; margin: 0 0 8px 0; color: #667eea;">🎤 Sprechanalyse</h4>
                    <table style="width: 100%; font-size: 9pt;">
                        <tr>
                            <?php if (!empty($audio_analysis['speech_rate'])) : ?>
                            <td style="text-align: center; padding: 4px;">
                                <div style="font-weight: 700; color: #667eea;">
                                    <?php
                                    $rate = $audio_analysis['speech_rate'];
                                    echo $rate === 'optimal' ? '✓ Optimal' : ($rate === 'zu_schnell' ? '⚡ Zu schnell' : '🐢 Zu langsam');
                                    ?>
                                </div>
                                <div style="color: #64748b;">Tempo</div>
                            </td>
                            <?php endif; ?>
                            <?php if (isset($audio_analysis['filler_words']['count'])) : ?>
                            <td style="text-align: center; padding: 4px;">
                                <div style="font-weight: 700; color: <?php echo $audio_analysis['filler_words']['count'] <= 2 ? '#10b981' : ($audio_analysis['filler_words']['count'] <= 5 ? '#f59e0b' : '#ef4444'); ?>;">
                                    <?php echo $audio_analysis['filler_words']['count']; ?>
                                </div>
                                <div style="color: #64748b;">Füllwörter</div>
                            </td>
                            <?php endif; ?>
                            <?php if (isset($audio_analysis['confidence_score'])) : ?>
                            <td style="text-align: center; padding: 4px;">
                                <div style="font-weight: 700;" class="score-<?php echo $this->get_score_class($audio_analysis['confidence_score']); ?>">
                                    <?php echo $audio_analysis['confidence_score']; ?>%
                                </div>
                                <div style="color: #64748b;">Selbstsicherheit</div>
                            </td>
                            <?php endif; ?>
                            <?php if (isset($audio_analysis['clarity_score'])) : ?>
                            <td style="text-align: center; padding: 4px;">
                                <div style="font-weight: 700;" class="score-<?php echo $this->get_score_class($audio_analysis['clarity_score']); ?>">
                                    <?php echo $audio_analysis['clarity_score']; ?>%
                                </div>
                                <div style="color: #64748b;">Klarheit</div>
                            </td>
                            <?php endif; ?>
                        </tr>
                    </table>
                </div>
                <?php endif; ?>
            </div>
            <?php endforeach; ?>
            <?php endif; ?>

            <!-- Footer -->
            <div class="footer">
                <p>Erstellt mit Karriereheld</p>
                <p><?php echo esc_html(get_bloginfo('name')); ?> • <?php echo esc_html(date('d.m.Y H:i')); ?></p>
            </div>
        </body>
        </html>
        <?php
        return ob_get_clean();
    }

    /**
     * Stream simulator session PDF to browser
     *
     * @return bool|WP_Error True on success, WP_Error on failure
     */
    public function stream_simulator_session_pdf($session_id, $user_id = null) {
        $pdf_path = $this->export_simulator_session_pdf($session_id, $user_id);

        if (is_wp_error($pdf_path)) {
            return $pdf_path;
        }

        // Get session for filename
        $session = $this->simulator_db->get_session($session_id);
        $scenario = $this->simulator_db->get_scenario($session->scenario_id);
        $scenario_title = $scenario ? $scenario->title : 'Training';
        $date = new DateTime($session->created_at);
        $download_filename = 'Szenario-Training-' . sanitize_file_name($scenario_title) . '-' . $date->format('Y-m-d') . '.pdf';

        $this->stream_pdf_file($pdf_path, $download_filename);
        return true;
    }

    /**
     * Get simulator session PDF as base64 for REST API response
     *
     * @param int $session_id Session ID
     * @param int $user_id User ID (for security check)
     * @return array|WP_Error PDF data or WP_Error on failure
     */
    public function get_simulator_session_pdf_base64($session_id, $user_id = null) {
        $pdf_path = $this->export_simulator_session_pdf($session_id, $user_id);

        if (is_wp_error($pdf_path)) {
            return $pdf_path;
        }

        // Read PDF content and encode as base64
        $pdf_content = file_get_contents($pdf_path);
        $base64_content = base64_encode($pdf_content);

        // Get session for filename
        $session = $this->simulator_db->get_session($session_id);
        $scenario = $this->simulator_db->get_scenario($session->scenario_id);
        $scenario_title = $scenario ? $scenario->title : 'Training';
        $date = new DateTime($session->created_at);
        $download_filename = 'Szenario-Training-' . sanitize_file_name($scenario_title) . '-' . $date->format('Y-m-d') . '.pdf';

        // Clean up temporary file
        wp_delete_file($pdf_path);

        return array(
            'pdf_base64' => $base64_content,
            'filename' => $download_filename,
            'content_type' => 'application/pdf',
        );
    }

    // =========================================================================
    // VIDEO TRAINING SESSION PDF EXPORT
    // =========================================================================

    /**
     * Export video training session to PDF
     *
     * @param int $session_id Session ID
     * @param int $user_id User ID (for security check)
     * @return string|WP_Error PDF file path or WP_Error on failure
     */
    public function export_video_session_pdf($session_id, $user_id = null) {
        if ($user_id === null) {
            $user_id = get_current_user_id();
        }

        if (!$this->video_db) {
            return new WP_Error('not_available', __('Video-Training-Modul nicht verfügbar.', 'bewerbungstrainer'));
        }

        // Get session
        $session = $this->video_db->get_session($session_id);

        if (!$session) {
            return new WP_Error('not_found', __('Sitzung nicht gefunden.', 'bewerbungstrainer'));
        }

        // Check ownership
        if ((int) $session->user_id !== (int) $user_id) {
            return new WP_Error('forbidden', __('Keine Berechtigung.', 'bewerbungstrainer'));
        }

        // Get scenario (stored in custom table, not as WordPress post)
        $scenario = $this->video_db->get_scenario($session->scenario_id);
        $scenario_title = $scenario ? $scenario->title : 'Wirkungs-Analyse';

        // Generate HTML content
        $html = $this->generate_video_pdf_html($session, $scenario_title);

        // Create PDF
        $pdf_path = $this->html_to_pdf($html, 'video-' . $session_id);

        return $pdf_path;
    }

    /**
     * Generate HTML content for Video Training PDF
     */
    private function generate_video_pdf_html($session, $scenario_title) {
        $formatted_date = $this->format_date($session->created_at);

        // Overall score is already 0-100 for video training
        $overall_score = isset($session->overall_score) ? floatval($session->overall_score) : 0;
        $score_class = $this->get_score_class($overall_score);
        $grade_label = $this->get_grade_label($overall_score);

        // Parse category scores and analysis (may already be decoded by database class)
        $category_scores = [];
        if (!empty($session->category_scores_json)) {
            $category_scores = is_array($session->category_scores_json)
                ? $session->category_scores_json
                : json_decode($session->category_scores_json, true);
        }
        $analysis = [];
        if (!empty($session->analysis_json)) {
            $analysis = is_array($session->analysis_json)
                ? $session->analysis_json
                : json_decode($session->analysis_json, true);
        }

        // Format duration
        $duration_seconds = isset($session->video_duration_seconds) ? intval($session->video_duration_seconds) : 0;
        $duration_formatted = sprintf('%d:%02d', floor($duration_seconds / 60), $duration_seconds % 60);

        ob_start();
        ?>
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style><?php echo $this->get_shared_styles(); ?></style>
        </head>
        <body>
            <!-- Header -->
            <div class="header">
                <h1>Wirkungs-Analyse</h1>
                <p class="subtitle"><?php echo esc_html($scenario_title); ?></p>
                <div class="meta">
                    <span class="meta-item">📅 <?php echo esc_html($formatted_date); ?></span>
                    <?php if ($duration_seconds > 0) : ?>
                    <span class="meta-item">⏱️ <?php echo esc_html($duration_formatted); ?> min</span>
                    <?php endif; ?>
                </div>
            </div>

            <!-- Score Box -->
            <div class="score-box">
                <div class="score-value score-<?php echo $score_class; ?>"><?php echo round($overall_score); ?>%</div>
                <div class="score-label">Gesamtbewertung</div>
                <div class="score-grade"><?php echo esc_html($grade_label); ?></div>
            </div>

            <!-- Category Scores -->
            <?php if (!empty($category_scores)) : ?>
            <h2>Kategorie-Bewertungen</h2>
            <table class="ratings-grid">
                <?php
                $category_labels = [
                    'auftreten' => 'Auftreten',
                    'selbstbewusstsein' => 'Selbstbewusstsein',
                    'koerpersprache' => 'Körpersprache',
                    'kommunikation' => 'Kommunikation',
                    'professionalitaet' => 'Professionalität',
                    'inhalt' => 'Inhalt'
                ];
                foreach ($category_scores as $category) :
                    $cat_score = isset($category['score']) ? floatval($category['score']) : 0;
                    $cat_class = $this->get_score_class($cat_score);
                    $cat_label = isset($category['label']) ? $category['label'] : (isset($category_labels[$category['category']]) ? $category_labels[$category['category']] : ucfirst($category['category']));
                ?>
                <tr>
                    <td class="label"><?php echo esc_html($cat_label); ?></td>
                    <td class="bar-cell">
                        <div class="progress-bar">
                            <div class="progress-bar-fill bg-<?php echo $cat_class; ?>" style="width: <?php echo $cat_score; ?>%;"></div>
                        </div>
                    </td>
                    <td class="score score-<?php echo $cat_class; ?>"><?php echo round($cat_score); ?>%</td>
                </tr>
                <?php if (!empty($category['feedback'])) : ?>
                <tr>
                    <td colspan="3" style="padding: 8px 12px; font-size: 10pt; color: #64748b; font-style: italic;">
                        <?php echo esc_html($category['feedback']); ?>
                    </td>
                </tr>
                <?php endif; ?>
                <?php endforeach; ?>
            </table>
            <?php endif; ?>

            <!-- Key Strengths -->
            <?php if (!empty($analysis['key_strengths'])) : ?>
            <?php echo $this->render_section('strengths', '✓ Deine Stärken', $analysis['key_strengths']); ?>
            <?php endif; ?>

            <!-- Actionable Tips -->
            <?php if (!empty($analysis['actionable_tips'])) : ?>
            <?php echo $this->render_section('tips', '💡 Tipps zur Verbesserung', $analysis['actionable_tips']); ?>
            <?php endif; ?>

            <!-- Summary Feedback -->
            <?php if (!empty($session->summary_feedback)) : ?>
            <div class="section summary">
                <h4>📋 Zusammenfassung</h4>
                <p><?php echo esc_html($session->summary_feedback); ?></p>
            </div>
            <?php endif; ?>

            <!-- Footer -->
            <div class="footer">
                <p>Erstellt mit Karriereheld</p>
                <p><?php echo esc_html(get_bloginfo('name')); ?> • <?php echo esc_html(date('d.m.Y H:i')); ?></p>
            </div>
        </body>
        </html>
        <?php
        return ob_get_clean();
    }

    /**
     * Stream video training session PDF to browser
     */
    public function stream_video_session_pdf($session_id, $user_id = null) {
        $pdf_path = $this->export_video_session_pdf($session_id, $user_id);

        if (is_wp_error($pdf_path)) {
            wp_die($pdf_path->get_error_message());
        }

        // Get session for filename
        $session = $this->video_db->get_session($session_id);
        $scenario = $this->video_db->get_scenario($session->scenario_id);
        $scenario_title = $scenario ? $scenario->title : 'Video-Training';
        $date = new DateTime($session->created_at);
        $download_filename = 'Wirkungs-Analyse-' . sanitize_file_name($scenario_title) . '-' . $date->format('Y-m-d') . '.pdf';

        $this->stream_pdf_file($pdf_path, $download_filename);
    }

    /**
     * Get video training session PDF as base64 for REST API response
     *
     * @param int $session_id Session ID
     * @param int $user_id User ID (for security check)
     * @return array|WP_Error PDF data or WP_Error on failure
     */
    public function get_video_session_pdf_base64($session_id, $user_id = null) {
        $pdf_path = $this->export_video_session_pdf($session_id, $user_id);

        if (is_wp_error($pdf_path)) {
            return $pdf_path;
        }

        // Read PDF content and encode as base64
        $pdf_content = file_get_contents($pdf_path);
        $base64_content = base64_encode($pdf_content);

        // Get session for filename
        $session = $this->video_db->get_session($session_id);
        $scenario = $this->video_db->get_scenario($session->scenario_id);
        $scenario_title = $scenario ? $scenario->title : 'Video-Training';
        $date = new DateTime($session->created_at);
        $download_filename = 'Wirkungs-Analyse-' . sanitize_file_name($scenario_title) . '-' . $date->format('Y-m-d') . '.pdf';

        // Clean up temporary file
        wp_delete_file($pdf_path);

        return array(
            'pdf_base64' => $base64_content,
            'filename' => $download_filename,
            'content_type' => 'application/pdf',
        );
    }

    // =========================================================================
    // HELPER METHODS
    // =========================================================================

    /**
     * Stream a PDF file to the browser and clean up
     */
    private function stream_pdf_file($pdf_path, $filename) {
        header('Content-Type: application/pdf');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Content-Length: ' . filesize($pdf_path));
        header('Cache-Control: private, max-age=0, must-revalidate');
        header('Pragma: public');

        readfile($pdf_path);

        // Clean up temporary file
        wp_delete_file($pdf_path);

        exit;
    }
}
