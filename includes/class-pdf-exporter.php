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
     * Modern, clean design optimized for DomPDF
     */
    private function get_shared_styles() {
        return '
            @page {
                margin: 15mm 12mm 20mm 12mm;
            }
            * {
                box-sizing: border-box;
            }
            body {
                font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
                font-size: 10pt;
                line-height: 1.6;
                color: #1a1a2e;
                margin: 0;
                padding: 0;
                background: #ffffff;
            }

            /* ===== HERO HEADER WITH SCORE ===== */
            .hero-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
                margin: -15mm -12mm 0 -12mm;
                padding: 30px 40px;
                color: white;
                position: relative;
            }
            .hero-content {
                display: table;
                width: 100%;
            }
            .hero-left {
                display: table-cell;
                vertical-align: middle;
                width: 65%;
            }
            .hero-right {
                display: table-cell;
                vertical-align: middle;
                text-align: right;
                width: 35%;
            }
            .hero-badge {
                display: inline-block;
                background: rgba(255,255,255,0.2);
                padding: 6px 14px;
                border-radius: 20px;
                font-size: 9pt;
                font-weight: 600;
                letter-spacing: 0.5px;
                text-transform: uppercase;
                margin-bottom: 12px;
            }
            .hero-title {
                font-size: 26pt;
                font-weight: 800;
                margin: 0 0 8px 0;
                letter-spacing: -1px;
                line-height: 1.1;
            }
            .hero-subtitle {
                font-size: 13pt;
                opacity: 0.9;
                margin: 0 0 16px 0;
                font-weight: 400;
            }
            .hero-meta {
                font-size: 10pt;
                opacity: 0.8;
            }
            .hero-meta-item {
                display: inline-block;
                margin-right: 20px;
            }

            /* ===== SCORE CIRCLE ===== */
            .score-circle {
                display: inline-block;
                width: 130px;
                height: 130px;
                border-radius: 50%;
                background: rgba(255,255,255,0.15);
                border: 6px solid rgba(255,255,255,0.4);
                text-align: center;
                position: relative;
            }
            .score-circle-inner {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 100px;
                height: 100px;
                border-radius: 50%;
                background: white;
            }
            .score-number {
                font-size: 36pt;
                font-weight: 800;
                line-height: 1;
                margin-top: 22px;
            }
            .score-percent {
                font-size: 14pt;
                font-weight: 600;
            }
            .score-label {
                font-size: 9pt;
                color: #64748b;
                margin-top: 4px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .score-grade {
                display: block;
                font-size: 11pt;
                font-weight: 600;
                margin-top: 6px;
                padding: 4px 12px;
                border-radius: 12px;
                background: rgba(102,126,234,0.1);
            }

            /* ===== CONTENT AREA ===== */
            .content {
                padding: 24px 0;
            }

            /* ===== SECTION HEADERS ===== */
            .section-header {
                display: table;
                width: 100%;
                margin: 28px 0 16px 0;
            }
            .section-icon {
                display: table-cell;
                width: 36px;
                vertical-align: middle;
            }
            .section-icon-circle {
                width: 32px;
                height: 32px;
                border-radius: 8px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                text-align: center;
                line-height: 32px;
                font-size: 14pt;
            }
            .section-title {
                display: table-cell;
                vertical-align: middle;
                padding-left: 12px;
                font-size: 14pt;
                font-weight: 700;
                color: #1a1a2e;
            }

            /* ===== CATEGORY CARDS ===== */
            .category-card {
                background: #ffffff;
                border: 1px solid #e5e7eb;
                border-radius: 12px;
                padding: 18px 20px;
                margin-bottom: 12px;
                page-break-inside: avoid;
            }
            .category-header {
                display: table;
                width: 100%;
                margin-bottom: 10px;
            }
            .category-name {
                display: table-cell;
                vertical-align: middle;
                font-size: 12pt;
                font-weight: 600;
                color: #1a1a2e;
            }
            .category-score {
                display: table-cell;
                text-align: right;
                vertical-align: middle;
                font-size: 18pt;
                font-weight: 800;
            }
            .progress-bar-container {
                background: #f1f5f9;
                border-radius: 6px;
                height: 10px;
                overflow: hidden;
                margin-bottom: 10px;
            }
            .progress-bar-fill {
                height: 100%;
                border-radius: 6px;
                background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
            }
            .progress-bar-fill.excellent {
                background: linear-gradient(90deg, #10b981 0%, #059669 100%);
            }
            .progress-bar-fill.good {
                background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%);
            }
            .progress-bar-fill.fair {
                background: linear-gradient(90deg, #ef4444 0%, #dc2626 100%);
            }
            .category-feedback {
                font-size: 10pt;
                color: #64748b;
                line-height: 1.5;
                font-style: italic;
            }

            /* ===== INSIGHT CARDS ===== */
            .insight-card {
                border-radius: 12px;
                padding: 20px;
                margin: 16px 0;
                page-break-inside: avoid;
            }
            .insight-card.strengths {
                background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
                border-left: 4px solid #10b981;
            }
            .insight-card.tips {
                background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
                border-left: 4px solid #f59e0b;
            }
            .insight-card.summary {
                background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
                border-left: 4px solid #8b5cf6;
            }
            .insight-card.transcript {
                background: #f8fafc;
                border-left: 4px solid #94a3b8;
            }
            .insight-header {
                display: table;
                width: 100%;
                margin-bottom: 12px;
            }
            .insight-icon {
                display: table-cell;
                width: 28px;
                vertical-align: middle;
                font-size: 16pt;
            }
            .insight-title {
                display: table-cell;
                vertical-align: middle;
                font-size: 12pt;
                font-weight: 700;
            }
            .insight-card.strengths .insight-title { color: #059669; }
            .insight-card.tips .insight-title { color: #b45309; }
            .insight-card.summary .insight-title { color: #7c3aed; }
            .insight-card.transcript .insight-title { color: #475569; }
            .insight-list {
                margin: 0;
                padding-left: 20px;
            }
            .insight-list li {
                margin: 8px 0;
                color: #374151;
                line-height: 1.6;
            }
            .insight-text {
                color: #374151;
                line-height: 1.7;
            }

            /* ===== QUESTION CARDS ===== */
            .question-card {
                background: #ffffff;
                border: 1px solid #e5e7eb;
                border-radius: 12px;
                padding: 20px;
                margin: 16px 0;
                page-break-inside: avoid;
            }
            .question-header {
                display: table;
                width: 100%;
                margin-bottom: 14px;
            }
            .question-number {
                display: table-cell;
                width: 40px;
                height: 40px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                font-weight: 700;
                font-size: 14pt;
                text-align: center;
                vertical-align: middle;
                border-radius: 10px;
            }
            .question-text {
                display: table-cell;
                vertical-align: middle;
                padding-left: 14px;
                font-weight: 600;
                font-size: 11pt;
                color: #1a1a2e;
                line-height: 1.4;
            }
            .question-score {
                display: table-cell;
                width: 70px;
                text-align: right;
                vertical-align: middle;
                font-weight: 800;
                font-size: 18pt;
            }
            .answer-box {
                background: #f8fafc;
                border-radius: 10px;
                padding: 14px 16px;
                margin: 14px 0;
            }
            .answer-label {
                font-size: 9pt;
                font-weight: 600;
                color: #64748b;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 6px;
            }
            .answer-text {
                font-size: 10pt;
                color: #475569;
                line-height: 1.7;
                font-style: italic;
            }

            /* ===== SCORE GRID ===== */
            .scores-grid {
                display: table;
                width: 100%;
                margin: 14px 0;
                border-collapse: separate;
                border-spacing: 8px;
            }
            .score-item {
                display: table-cell;
                background: #f8fafc;
                border-radius: 10px;
                padding: 12px;
                text-align: center;
                width: 20%;
            }
            .score-item-value {
                font-size: 18pt;
                font-weight: 800;
            }
            .score-item-label {
                font-size: 8pt;
                color: #64748b;
                text-transform: uppercase;
                letter-spacing: 0.3px;
                margin-top: 4px;
            }

            /* ===== FOOTER ===== */
            .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 2px solid #e5e7eb;
                text-align: center;
            }
            .footer-logo {
                font-size: 11pt;
                font-weight: 700;
                color: #667eea;
                margin-bottom: 4px;
            }
            .footer-meta {
                font-size: 9pt;
                color: #94a3b8;
            }

            /* ===== COLORS ===== */
            .text-excellent { color: #10b981; }
            .text-good { color: #f59e0b; }
            .text-fair { color: #ef4444; }
            .text-primary { color: #667eea; }

            .page-break {
                page-break-before: always;
            }
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
     * Get score color hex code based on percentage
     */
    private function get_score_color($score) {
        if ($score >= 80) return '#10b981'; // green
        if ($score >= 60) return '#f59e0b'; // amber
        return '#ef4444'; // red
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
                <p><strong>Datum:</strong> <?php echo esc_html($formatted_date); ?></p>
                <p><strong>Position:</strong> <?php echo esc_html($session->position); ?></p>
                <p><strong>Unternehmen:</strong> <?php echo esc_html($session->company); ?></p>
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
                    <h3>Starken</h3>
                    <ul>
                        <?php foreach ($feedback['strengths'] as $strength) : ?>
                        <li><?php echo esc_html($strength); ?></li>
                        <?php endforeach; ?>
                    </ul>
                </div>
                <?php endif; ?>

                <?php if (isset($feedback['improvements']) && !empty($feedback['improvements'])) : ?>
                <div class="section improvements">
                    <h3>Verbesserungspotenzial</h3>
                    <ul>
                        <?php foreach ($feedback['improvements'] as $improvement) : ?>
                        <li><?php echo esc_html($improvement); ?></li>
                        <?php endforeach; ?>
                    </ul>
                </div>
                <?php endif; ?>

                <?php if (isset($feedback['tips']) && !empty($feedback['tips'])) : ?>
                <div class="section tips">
                    <h3>Tipps fur die Zukunft</h3>
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
        error_log('[PDF EXPORT] Starting html_to_pdf for session ' . $session_id);

        // Load Composer autoloader
        $autoload_path = BEWERBUNGSTRAINER_PLUGIN_DIR . 'vendor/autoload.php';
        error_log('[PDF EXPORT] Looking for autoload at: ' . $autoload_path);
        error_log('[PDF EXPORT] Plugin dir is: ' . BEWERBUNGSTRAINER_PLUGIN_DIR);

        if (!file_exists($autoload_path)) {
            // Check if vendor directory exists at all
            $vendor_dir = BEWERBUNGSTRAINER_PLUGIN_DIR . 'vendor';
            $vendor_exists = is_dir($vendor_dir);
            error_log('[PDF EXPORT] Vendor directory exists: ' . ($vendor_exists ? 'yes' : 'no'));
            error_log('[PDF EXPORT] DomPDF autoload not found at: ' . $autoload_path);

            // Try to run composer install if possible
            return new WP_Error(
                'missing_library',
                sprintf(
                    __('DomPDF-Bibliothek nicht gefunden (Pfad: %s). Bitte führen Sie "composer install" im Plugin-Verzeichnis aus.', 'bewerbungstrainer'),
                    $autoload_path
                )
            );
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

            error_log('[PDF EXPORT] PDF saved successfully to: ' . $file_path);

            return $file_path;

        } catch (Exception $e) {
            error_log('[PDF EXPORT] DomPDF error: ' . $e->getMessage());
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

            error_log('[PDF EXPORT] Starting export for session ' . $session_id . ', user ' . $user_id);

            if (!$this->simulator_db) {
                error_log('[PDF EXPORT] simulator_db is not available');
                return new WP_Error('not_available', __('Simulator-Modul nicht verfügbar.', 'bewerbungstrainer'));
            }

            // Get session with answers
            $session = $this->simulator_db->get_session($session_id);

            if (!$session) {
                error_log('[PDF EXPORT] Session not found: ' . $session_id);
                return new WP_Error('not_found', __('Sitzung nicht gefunden.', 'bewerbungstrainer'));
            }

            error_log('[PDF EXPORT] Found session with user_id: ' . $session->user_id . ', comparing to: ' . $user_id);

            // Check ownership
            if ((int) $session->user_id !== (int) $user_id) {
                error_log('[PDF EXPORT] Permission denied - session user: ' . $session->user_id . ', request user: ' . $user_id);
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
        $score_color = $this->get_score_color($overall_score);

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
            <!-- Hero Header with Score -->
            <div class="hero-header">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="vertical-align: middle; width: 60%;">
                            <div class="hero-badge">SZENARIO-TRAINING</div>
                            <h1 class="hero-title"><?php echo esc_html($scenario_title); ?></h1>
                            <div class="hero-meta">
                                <span class="hero-meta-item"><?php echo esc_html($formatted_date); ?></span>
                                <span class="hero-meta-item"><?php echo count($answers); ?> Fragen beantwortet</span>
                            </div>
                        </td>
                        <td style="vertical-align: middle; text-align: right; width: 40%;">
                            <div style="display: inline-block; text-align: center; background: white; border-radius: 12px; padding: 20px 30px;">
                                <div style="color: <?php echo $score_color; ?>;">
                                    <span style="font-size: 42pt; font-weight: 800; line-height: 1;"><?php echo round($overall_score); ?></span><span style="font-size: 18pt; font-weight: 600;">%</span>
                                </div>
                                <div style="font-size: 9pt; color: #64748b; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px;">Gesamtbewertung</div>
                                <div style="margin-top: 8px;">
                                    <span style="background: <?php echo $score_color; ?>; color: white; padding: 4px 12px; border-radius: 12px; font-size: 10pt; font-weight: 600;">
                                        <?php echo esc_html($grade_label); ?>
                                    </span>
                                </div>
                            </div>
                        </td>
                    </tr>
                </table>
            </div>

            <div class="content">
                <?php if ($summary_feedback) : ?>
                    <!-- Summary as Insight Card -->
                    <?php if (!empty($summary_feedback['summary'])) : ?>
                    <div class="insight-card summary">
                        <div class="insight-header">
                            <div class="insight-icon">
                                <span style="display: inline-block; width: 22px; height: 22px; background: #8b5cf6; color: white; border-radius: 50%; text-align: center; line-height: 22px; font-size: 12pt; font-weight: bold;">Z</span>
                            </div>
                            <div class="insight-title">Zusammenfassung</div>
                        </div>
                        <div class="insight-text"><?php echo esc_html($summary_feedback['summary']); ?></div>
                    </div>
                    <?php endif; ?>

                    <!-- Overall Scores as Category Cards -->
                    <?php if (!empty($summary_feedback['scores'])) : ?>
                    <div class="section-header">
                        <div class="section-icon">
                            <div class="section-icon-circle">B</div>
                        </div>
                        <div class="section-title">Bewertungsubersicht</div>
                    </div>

                    <?php
                    $category_labels = [
                        'inhalt' => 'Inhalt',
                        'struktur' => 'Struktur',
                        'relevanz' => 'Relevanz',
                        'praesentation' => 'Präsentation',
                        'kommunikation' => 'Kommunikation',
                        'ueberzeugungskraft' => 'Überzeugungskraft'
                    ];
                    foreach ($summary_feedback['scores'] as $category => $score) :
                        $score_100 = floatval($score) * 10;
                        $cat_class = $this->get_score_class($score_100);
                        $cat_color = $this->get_score_color($score_100);
                        $cat_label = isset($category_labels[strtolower($category)]) ? $category_labels[strtolower($category)] : ucfirst(str_replace('_', ' ', $category));
                    ?>
                    <div class="category-card">
                        <div class="category-header">
                            <div class="category-name"><?php echo esc_html($cat_label); ?></div>
                            <div class="category-score" style="color: <?php echo $cat_color; ?>;"><?php echo round($score_100); ?>%</div>
                        </div>
                        <div class="progress-bar-container">
                            <div class="progress-bar-fill <?php echo $cat_class; ?>" style="width: <?php echo $score_100; ?>%;"></div>
                        </div>
                    </div>
                    <?php endforeach; ?>
                    <?php endif; ?>

                    <!-- Key Takeaways -->
                    <?php if (!empty($summary_feedback['key_takeaways'])) : ?>
                    <div class="insight-card tips">
                        <div class="insight-header">
                            <div class="insight-icon">
                                <span style="display: inline-block; width: 22px; height: 22px; background: #f59e0b; color: white; border-radius: 50%; text-align: center; line-height: 22px; font-size: 14pt; font-weight: bold;">!</span>
                            </div>
                            <div class="insight-title">Wichtigste Erkenntnisse</div>
                        </div>
                        <ul class="insight-list">
                            <?php foreach ($summary_feedback['key_takeaways'] as $item) : ?>
                            <li><?php echo esc_html($item); ?></li>
                            <?php endforeach; ?>
                        </ul>
                    </div>
                    <?php endif; ?>
                <?php endif; ?>

                <!-- Individual Answers -->
                <?php if (!empty($answers)) : ?>
                <div class="section-header">
                    <div class="section-icon">
                        <div class="section-icon-circle">A</div>
                    </div>
                    <div class="section-title">Deine Antworten im Detail</div>
                </div>

                <?php foreach ($answers as $index => $answer) :
                    // feedback_json and audio_analysis_json are already decoded by get_session_answers()
                    $feedback = !empty($answer->feedback_json) ? $answer->feedback_json : null;
                    $audio_analysis = !empty($answer->audio_analysis_json) ? $answer->audio_analysis_json : null;
                    $answer_score = isset($answer->overall_score) ? floatval($answer->overall_score) * 10 : null;
                    $answer_class = $answer_score !== null ? $this->get_score_class($answer_score) : '';
                    $answer_color = $answer_score !== null ? $this->get_score_color($answer_score) : '#667eea';
                    $is_no_speech = $answer->transcript === '[Keine Sprache erkannt]';
                ?>
                <div class="question-card">
                    <div class="question-header">
                        <div class="question-number"><?php echo ($index + 1); ?></div>
                        <div class="question-text"><?php echo esc_html($answer->question_text ?: 'Frage ' . ($index + 1)); ?></div>
                        <?php if ($answer_score !== null && !$is_no_speech) : ?>
                        <div class="question-score" style="color: <?php echo $answer_color; ?>;"><?php echo round($answer_score); ?>%</div>
                        <?php endif; ?>
                    </div>

                    <!-- Transcript -->
                    <?php if (!empty($answer->transcript)) : ?>
                    <div class="answer-box">
                        <div class="answer-label">Deine Antwort</div>
                        <div class="answer-text"><?php echo esc_html($answer->transcript); ?></div>
                    </div>
                    <?php endif; ?>

                    <?php if ($feedback && !$is_no_speech) : ?>
                        <!-- Mini Scores -->
                        <?php if (!empty($feedback['scores'])) : ?>
                        <table style="width: 100%; margin: 12px 0; border-collapse: separate; border-spacing: 6px;">
                            <tr>
                            <?php
                            $score_labels = [
                                'content' => 'Inhalt',
                                'structure' => 'Struktur',
                                'relevance' => 'Relevanz',
                                'delivery' => 'Präsentation'
                            ];
                            foreach ($feedback['scores'] as $key => $value) :
                                if (!isset($score_labels[$key])) continue;
                                $val_100 = floatval($value) * 10;
                                $val_color = $this->get_score_color($val_100);
                            ?>
                                <td style="background: #f8fafc; border-radius: 8px; padding: 10px; text-align: center; width: 25%;">
                                    <div style="font-size: 16pt; font-weight: 800; color: <?php echo $val_color; ?>;"><?php echo round($val_100); ?></div>
                                    <div style="font-size: 8pt; color: #64748b; text-transform: uppercase; letter-spacing: 0.3px;"><?php echo esc_html($score_labels[$key]); ?></div>
                                </td>
                            <?php endforeach; ?>
                            </tr>
                        </table>
                        <?php endif; ?>

                        <!-- Strengths -->
                        <?php if (!empty($feedback['strengths'])) : ?>
                        <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-left: 4px solid #10b981; border-radius: 8px; padding: 14px; margin: 10px 0;">
                            <div style="font-size: 11pt; font-weight: 700; color: #059669; margin-bottom: 8px;">
                                <span style="display: inline-block; width: 18px; height: 18px; background: #10b981; color: white; border-radius: 50%; text-align: center; line-height: 18px; font-size: 12pt; margin-right: 8px;">+</span>
                                Starken
                            </div>
                            <ul style="margin: 0; padding-left: 28px; font-size: 10pt; color: #374151; line-height: 1.6;">
                                <?php foreach ($feedback['strengths'] as $item) : ?>
                                <li style="margin: 5px 0;"><?php echo esc_html($item); ?></li>
                                <?php endforeach; ?>
                            </ul>
                        </div>
                        <?php endif; ?>

                        <!-- Improvements -->
                        <?php if (!empty($feedback['improvements'])) : ?>
                        <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-left: 4px solid #f59e0b; border-radius: 8px; padding: 14px; margin: 10px 0;">
                            <div style="font-size: 11pt; font-weight: 700; color: #b45309; margin-bottom: 8px;">
                                <span style="display: inline-block; width: 18px; height: 18px; background: #f59e0b; color: white; border-radius: 50%; text-align: center; line-height: 18px; font-size: 12pt; margin-right: 8px;">!</span>
                                Verbesserungspotenzial
                            </div>
                            <ul style="margin: 0; padding-left: 28px; font-size: 10pt; color: #374151; line-height: 1.6;">
                                <?php foreach ($feedback['improvements'] as $item) : ?>
                                <li style="margin: 5px 0;"><?php echo esc_html($item); ?></li>
                                <?php endforeach; ?>
                            </ul>
                        </div>
                        <?php endif; ?>

                        <!-- Tips -->
                        <?php if (!empty($feedback['tips'])) : ?>
                        <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-left: 4px solid #3b82f6; border-radius: 8px; padding: 14px; margin: 10px 0;">
                            <div style="font-size: 11pt; font-weight: 700; color: #1d4ed8; margin-bottom: 8px;">
                                <span style="display: inline-block; width: 18px; height: 18px; background: #3b82f6; color: white; border-radius: 50%; text-align: center; line-height: 18px; font-size: 10pt; margin-right: 8px;">i</span>
                                Tipps
                            </div>
                            <ul style="margin: 0; padding-left: 28px; font-size: 10pt; color: #374151; line-height: 1.6;">
                                <?php foreach ($feedback['tips'] as $item) : ?>
                                <li style="margin: 5px 0;"><?php echo esc_html($item); ?></li>
                                <?php endforeach; ?>
                            </ul>
                        </div>
                        <?php endif; ?>
                    <?php endif; ?>

                    <!-- Audio Metrics -->
                    <?php if ($audio_analysis && !$is_no_speech) : ?>
                    <div style="margin-top: 14px; padding: 14px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 10px; border: 1px solid #e2e8f0;">
                        <div style="font-size: 11pt; font-weight: 700; color: #667eea; margin-bottom: 12px;">
                            <span style="display: inline-block; width: 20px; height: 20px; background: #667eea; color: white; border-radius: 50%; text-align: center; line-height: 20px; font-size: 10pt; margin-right: 8px;">S</span>
                            Sprechanalyse
                        </div>
                        <table style="width: 100%; border-collapse: separate; border-spacing: 8px;">
                            <tr>
                                <?php if (!empty($audio_analysis['speech_rate'])) : ?>
                                <td style="text-align: center; padding: 10px; background: white; border-radius: 8px; border: 1px solid #e5e7eb;">
                                    <?php
                                    $rate = $audio_analysis['speech_rate'];
                                    $rate_text = $rate === 'optimal' ? 'Optimal' : ($rate === 'zu_schnell' ? 'Schnell' : 'Langsam');
                                    $rate_color = $rate === 'optimal' ? '#10b981' : ($rate === 'zu_schnell' ? '#f59e0b' : '#3b82f6');
                                    ?>
                                    <div style="font-weight: 700; font-size: 12pt; color: <?php echo $rate_color; ?>;"><?php echo $rate_text; ?></div>
                                    <div style="font-size: 8pt; color: #64748b; margin-top: 3px; text-transform: uppercase;">Tempo</div>
                                </td>
                                <?php endif; ?>
                                <?php if (isset($audio_analysis['filler_words']['count'])) : ?>
                                <td style="text-align: center; padding: 10px; background: white; border-radius: 8px; border: 1px solid #e5e7eb;">
                                    <div style="font-weight: 700; font-size: 16pt; color: <?php echo $audio_analysis['filler_words']['count'] <= 2 ? '#10b981' : ($audio_analysis['filler_words']['count'] <= 5 ? '#f59e0b' : '#ef4444'); ?>;">
                                        <?php echo $audio_analysis['filler_words']['count']; ?>
                                    </div>
                                    <div style="font-size: 8pt; color: #64748b; margin-top: 3px; text-transform: uppercase;">Fullworter</div>
                                </td>
                                <?php endif; ?>
                                <?php if (isset($audio_analysis['confidence_score'])) : ?>
                                <td style="text-align: center; padding: 10px; background: white; border-radius: 8px; border: 1px solid #e5e7eb;">
                                    <div style="font-weight: 700; font-size: 16pt; color: <?php echo $this->get_score_color($audio_analysis['confidence_score']); ?>;">
                                        <?php echo $audio_analysis['confidence_score']; ?>%
                                    </div>
                                    <div style="font-size: 8pt; color: #64748b; margin-top: 3px; text-transform: uppercase;">Sicherheit</div>
                                </td>
                                <?php endif; ?>
                                <?php if (isset($audio_analysis['clarity_score'])) : ?>
                                <td style="text-align: center; padding: 10px; background: white; border-radius: 8px; border: 1px solid #e5e7eb;">
                                    <div style="font-weight: 700; font-size: 16pt; color: <?php echo $this->get_score_color($audio_analysis['clarity_score']); ?>;">
                                        <?php echo $audio_analysis['clarity_score']; ?>%
                                    </div>
                                    <div style="font-size: 8pt; color: #64748b; margin-top: 3px; text-transform: uppercase;">Klarheit</div>
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
                    <div class="footer-logo">Erstellt mit Karriereheld</div>
                    <div class="footer-meta"><?php echo esc_html(get_bloginfo('name')); ?> • <?php echo esc_html(date('d.m.Y H:i')); ?></div>
                </div>
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
        $score_color = $this->get_score_color($overall_score);

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
            <!-- Hero Header with Score -->
            <div class="hero-header">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="vertical-align: middle; width: 60%;">
                            <div class="hero-badge">Wirkungs-Analyse</div>
                            <h1 class="hero-title"><?php echo esc_html($scenario_title); ?></h1>
                            <div class="hero-meta">
                                <span class="hero-meta-item"><?php echo esc_html($formatted_date); ?></span>
                                <?php if ($duration_seconds > 0) : ?>
                                <span class="hero-meta-item"><?php echo esc_html($duration_formatted); ?> Min.</span>
                                <?php endif; ?>
                            </div>
                        </td>
                        <td style="vertical-align: middle; text-align: right; width: 40%;">
                            <div style="display: inline-block; text-align: center; background: white; border-radius: 12px; padding: 20px 30px;">
                                <div style="color: <?php echo $score_color; ?>;">
                                    <span style="font-size: 42pt; font-weight: 800; line-height: 1;"><?php echo round($overall_score); ?></span><span style="font-size: 18pt; font-weight: 600;">%</span>
                                </div>
                                <div style="font-size: 9pt; color: #64748b; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px;">Gesamtbewertung</div>
                                <div style="margin-top: 8px;">
                                    <span style="background: <?php echo $score_color; ?>; color: white; padding: 4px 12px; border-radius: 12px; font-size: 10pt; font-weight: 600;">
                                        <?php echo esc_html($grade_label); ?>
                                    </span>
                                </div>
                            </div>
                        </td>
                    </tr>
                </table>
            </div>

            <div class="content">
                <!-- Category Scores as Cards -->
                <?php if (!empty($category_scores)) : ?>
                <div class="section-header">
                    <div class="section-icon">
                        <div class="section-icon-circle">B</div>
                    </div>
                    <div class="section-title">Detaillierte Bewertung</div>
                </div>

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
                    $cat_color = $this->get_score_color($cat_score);
                    $cat_label = isset($category['label']) ? $category['label'] : (isset($category_labels[$category['category']]) ? $category_labels[$category['category']] : ucfirst($category['category']));
                ?>
                <div class="category-card">
                    <div class="category-header">
                        <div class="category-name"><?php echo esc_html($cat_label); ?></div>
                        <div class="category-score" style="color: <?php echo $cat_color; ?>;"><?php echo round($cat_score); ?>%</div>
                    </div>
                    <div class="progress-bar-container">
                        <div class="progress-bar-fill <?php echo $cat_class; ?>" style="width: <?php echo $cat_score; ?>%;"></div>
                    </div>
                    <?php if (!empty($category['feedback'])) : ?>
                    <div class="category-feedback"><?php echo esc_html($category['feedback']); ?></div>
                    <?php endif; ?>
                </div>
                <?php endforeach; ?>
                <?php endif; ?>

                <!-- Key Strengths -->
                <?php if (!empty($analysis['key_strengths'])) : ?>
                <div class="insight-card strengths">
                    <div class="insight-header">
                        <div class="insight-icon">
                            <span style="display: inline-block; width: 22px; height: 22px; background: #10b981; color: white; border-radius: 50%; text-align: center; line-height: 22px; font-size: 14pt; font-weight: bold;">+</span>
                        </div>
                        <div class="insight-title">Deine Starken</div>
                    </div>
                    <ul class="insight-list">
                        <?php foreach ($analysis['key_strengths'] as $item) : ?>
                        <li><?php echo esc_html($item); ?></li>
                        <?php endforeach; ?>
                    </ul>
                </div>
                <?php endif; ?>

                <!-- Actionable Tips -->
                <?php if (!empty($analysis['actionable_tips'])) : ?>
                <div class="insight-card tips">
                    <div class="insight-header">
                        <div class="insight-icon">
                            <span style="display: inline-block; width: 22px; height: 22px; background: #f59e0b; color: white; border-radius: 50%; text-align: center; line-height: 22px; font-size: 14pt; font-weight: bold;">!</span>
                        </div>
                        <div class="insight-title">Tipps zur Verbesserung</div>
                    </div>
                    <ul class="insight-list">
                        <?php foreach ($analysis['actionable_tips'] as $item) : ?>
                        <li><?php echo esc_html($item); ?></li>
                        <?php endforeach; ?>
                    </ul>
                </div>
                <?php endif; ?>

                <!-- Summary Feedback -->
                <?php if (!empty($session->summary_feedback)) : ?>
                <div class="insight-card summary">
                    <div class="insight-header">
                        <div class="insight-icon">
                            <span style="display: inline-block; width: 22px; height: 22px; background: #8b5cf6; color: white; border-radius: 50%; text-align: center; line-height: 22px; font-size: 12pt; font-weight: bold;">Z</span>
                        </div>
                        <div class="insight-title">Zusammenfassung</div>
                    </div>
                    <div class="insight-text"><?php echo esc_html($session->summary_feedback); ?></div>
                </div>
                <?php endif; ?>

                <!-- Footer -->
                <div class="footer">
                    <div class="footer-logo">Erstellt mit Karriereheld</div>
                    <div class="footer-meta"><?php echo esc_html(get_bloginfo('name')); ?> • <?php echo esc_html(date('d.m.Y H:i')); ?></div>
                </div>
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
