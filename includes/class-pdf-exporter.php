<?php
/**
 * PDF Exporter Class
 *
 * Handles PDF export functionality for session ratings
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

        // Parse feedback
        $feedback = $session->feedback_json ? json_decode($session->feedback_json, true) : null;
        $audio_analysis = $session->audio_analysis_json ? json_decode($session->audio_analysis_json, true) : null;

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
}
