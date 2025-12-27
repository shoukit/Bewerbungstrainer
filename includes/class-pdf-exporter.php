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
     * Smart Briefing database instance
     */
    private $smartbriefing_db;

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
        if (class_exists('Bewerbungstrainer_SmartBriefing_Database')) {
            $this->smartbriefing_db = Bewerbungstrainer_SmartBriefing_Database::get_instance();
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
     * Strip emojis and special Unicode characters that DomPDF can't render
     * Replaces them with nothing or appropriate text alternatives
     */
    private function strip_emojis($text) {
        // Remove emoji characters (most common ranges)
        $text = preg_replace('/[\x{1F600}-\x{1F64F}]/u', '', $text); // Emoticons
        $text = preg_replace('/[\x{1F300}-\x{1F5FF}]/u', '', $text); // Misc Symbols and Pictographs
        $text = preg_replace('/[\x{1F680}-\x{1F6FF}]/u', '', $text); // Transport and Map
        $text = preg_replace('/[\x{1F700}-\x{1F77F}]/u', '', $text); // Alchemical Symbols
        $text = preg_replace('/[\x{1F780}-\x{1F7FF}]/u', '', $text); // Geometric Shapes Extended
        $text = preg_replace('/[\x{1F800}-\x{1F8FF}]/u', '', $text); // Supplemental Arrows-C
        $text = preg_replace('/[\x{1F900}-\x{1F9FF}]/u', '', $text); // Supplemental Symbols and Pictographs
        $text = preg_replace('/[\x{1FA00}-\x{1FA6F}]/u', '', $text); // Chess Symbols
        $text = preg_replace('/[\x{1FA70}-\x{1FAFF}]/u', '', $text); // Symbols and Pictographs Extended-A
        $text = preg_replace('/[\x{2600}-\x{26FF}]/u', '', $text);   // Misc symbols
        $text = preg_replace('/[\x{2700}-\x{27BF}]/u', '', $text);   // Dingbats
        $text = preg_replace('/[\x{FE00}-\x{FE0F}]/u', '', $text);   // Variation Selectors
        $text = preg_replace('/[\x{1F1E0}-\x{1F1FF}]/u', '', $text); // Flags

        // Clean up any double spaces left behind
        $text = preg_replace('/\s+/', ' ', $text);
        $text = trim($text);

        return $text;
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
        try {
            if ($user_id === null) {
                $user_id = get_current_user_id();
            }

            // Try roleplay sessions first (new table), then fall back to old sessions table
            $session = null;
            if (method_exists($this->db, 'get_roleplay_session')) {
                $session = $this->db->get_roleplay_session($session_id);
            }
            if (!$session) {
                $session = $this->db->get_session($session_id);
            }

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
        } catch (Exception $e) {
            error_log('[PDF EXPORT] Exception: ' . $e->getMessage());
            return new WP_Error('pdf_error', $e->getMessage());
        }
    }

    /**
     * Generate HTML content for PDF - Six Drivers Style
     *
     * @param object $session Session object
     * @param array $feedback Feedback data
     * @param array $audio_analysis Audio analysis data
     * @return string HTML content
     */
    private function generate_pdf_html($session, $feedback, $audio_analysis) {
        $date = new DateTime($session->created_at);
        $formatted_date = $date->format('d.m.Y H:i');
        $primary_color = '#0d6a7c';

        // Extract variables from JSON
        $variables = array();
        if (!empty($session->variables_json)) {
            $variables = is_array($session->variables_json)
                ? $session->variables_json
                : json_decode($session->variables_json, true);
            if (!is_array($variables)) {
                $variables = array();
            }
        }

        // Extract position - try multiple common key variations
        $position = '';
        if (isset($session->position) && !empty($session->position)) {
            $position = $session->position;
        } else {
            $position_keys = array('position', 'stelle', 'job_position', 'bewerber_position', 'rolle', 'job', 'ausbildung');
            foreach ($position_keys as $key) {
                if (isset($variables[$key]) && !empty($variables[$key])) {
                    $position = $variables[$key];
                    break;
                }
            }
        }

        // Extract company - try multiple common key variations
        $company = '';
        if (isset($session->company) && !empty($session->company)) {
            $company = $session->company;
        } else {
            $company_keys = array('company', 'unternehmen', 'firma', 'arbeitgeber', 'betrieb', 'organisation');
            foreach ($company_keys as $key) {
                if (isset($variables[$key]) && !empty($variables[$key])) {
                    $company = $variables[$key];
                    break;
                }
            }
        }

        // Get scenario title if available
        $scenario_title = '';
        if (isset($session->scenario_id) && $session->scenario_id) {
            $scenario_post = get_post($session->scenario_id);
            if ($scenario_post) {
                $scenario_title = $scenario_post->post_title;
            }
        }

        // Build display info - show relevant variables
        $display_info = array();
        if (!empty($scenario_title)) {
            $display_info['Szenario'] = $scenario_title;
        }
        if (!empty($position)) {
            $display_info['Position'] = $position;
        }
        if (!empty($company)) {
            $display_info['Unternehmen'] = $company;
        }
        // Add any other interesting variables (user_name excluded)
        $exclude_keys = array('position', 'stelle', 'job_position', 'bewerber_position', 'rolle', 'job', 'ausbildung',
                              'company', 'unternehmen', 'firma', 'arbeitgeber', 'betrieb', 'organisation',
                              'user_name', 'name', 'interviewer_name', 'interviewer_role');
        foreach ($variables as $key => $value) {
            if (!empty($value) && !in_array($key, $exclude_keys) && count($display_info) < 5) {
                // Convert key to readable label
                $label = ucfirst(str_replace('_', ' ', $key));
                $display_info[$label] = $value;
            }
        }

        $overall_rating = null;
        if ($feedback && isset($feedback['rating']['overall'])) {
            $overall_rating = $feedback['rating']['overall'];
        }
        $overall_score = $overall_rating ? $overall_rating * 10 : 0;
        $score_color = $this->get_score_color($overall_score);
        $grade_label = $this->get_grade_label($overall_score);

        ob_start();
        ?>
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                @page { margin: 12mm 15mm 15mm 15mm; }
                * { box-sizing: border-box; }
                body {
                    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
                    font-size: 10pt;
                    line-height: 1.6;
                    color: #1a1a2e;
                    margin: 0;
                    padding: 0;
                }
                .header-bar {
                    background-color: <?php echo $primary_color; ?>;
                    height: 8px;
                    margin-bottom: 25px;
                }
                .main-title {
                    font-size: 20pt;
                    font-weight: 700;
                    color: <?php echo $primary_color; ?>;
                    text-align: center;
                    margin: 0 0 10px 0;
                }
                .subtitle {
                    font-size: 11pt;
                    color: #475569;
                    text-align: center;
                    margin: 0 0 20px 0;
                }
                .header-wrapper {
                    width: 100%;
                    margin: 15px 0 20px 0;
                    overflow: hidden;
                }
                .info-card {
                    float: left;
                    width: 58%;
                    background-color: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    padding: 15px;
                }
                .info-card-title {
                    font-size: 9pt;
                    font-weight: 600;
                    color: #94a3b8;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 10px;
                    padding-bottom: 8px;
                    border-bottom: 1px solid #e2e8f0;
                }
                .info-item {
                    margin: 6px 0;
                    padding: 6px 10px;
                    background-color: #ffffff;
                    border-left: 3px solid <?php echo $primary_color; ?>;
                }
                .info-label {
                    font-size: 8pt;
                    font-weight: 600;
                    color: #64748b;
                    display: block;
                    margin-bottom: 2px;
                }
                .info-value {
                    font-size: 10pt;
                    color: #1e293b;
                    font-weight: 500;
                }
                .score-card {
                    float: right;
                    width: 38%;
                    background-color: #f0f9fa;
                    border: 2px solid <?php echo $primary_color; ?>;
                    border-radius: 8px;
                    padding: 20px 15px;
                    text-align: center;
                }
                .score-value {
                    font-size: 42pt;
                    font-weight: 800;
                    line-height: 1;
                    margin-bottom: 5px;
                }
                .score-label {
                    font-size: 11pt;
                    font-weight: 600;
                    color: <?php echo $primary_color; ?>;
                    text-transform: uppercase;
                }
                .score-sublabel {
                    font-size: 9pt;
                    color: #64748b;
                    margin-top: 3px;
                }
                .clearfix {
                    clear: both;
                }
                .divider {
                    border: none;
                    border-top: 1px solid #d1d5db;
                    margin: 25px 0;
                }
                .section-title {
                    font-size: 14pt;
                    font-weight: 700;
                    color: <?php echo $primary_color; ?>;
                    text-align: left;
                    margin: 25px 0 15px 0;
                }
                .text-content {
                    font-size: 10pt;
                    color: #374151;
                    line-height: 1.6;
                    text-align: justify;
                    margin-bottom: 10px;
                }
                .category-row {
                    margin: 8px 0;
                    padding: 10px 15px;
                    background-color: #f8fafc;
                    border-radius: 6px;
                }
                .category-name {
                    font-weight: 600;
                    color: #1e293b;
                    display: inline;
                }
                .category-score {
                    float: right;
                    font-weight: 700;
                    color: <?php echo $primary_color; ?>;
                }
                .info-box {
                    padding: 12px 15px;
                    border-radius: 6px;
                    margin: 10px 0;
                }
                .info-box.green {
                    background-color: #ecfdf5;
                    border-left: 3px solid #10b981;
                }
                .info-box.yellow {
                    background-color: #fffbeb;
                    border-left: 3px solid #f59e0b;
                }
                .info-box.blue {
                    background-color: #eff6ff;
                    border-left: 3px solid #3b82f6;
                }
                .info-box-title {
                    font-weight: 700;
                    margin-bottom: 8px;
                }
                .info-box.green .info-box-title { color: #059669; }
                .info-box.yellow .info-box-title { color: #b45309; }
                .info-box.blue .info-box-title { color: #1d4ed8; }
                .info-box ul {
                    margin: 0;
                    padding-left: 20px;
                }
                .info-box li {
                    margin: 4px 0;
                    color: #374151;
                }
                .footer {
                    margin-top: 40px;
                    padding-top: 15px;
                    border-top: 1px solid #d1d5db;
                    text-align: center;
                }
                .footer-logo {
                    font-size: 10pt;
                    font-weight: 600;
                    color: <?php echo $primary_color; ?>;
                }
                .footer-meta {
                    font-size: 9pt;
                    color: #9ca3af;
                }
            </style>
        </head>
        <body>
            <div class="header-bar"></div>

            <h1 class="main-title">Live-Simulation Auswertung</h1>

            <div class="header-wrapper">
                <?php if ($overall_rating !== null) : ?>
                <div class="score-card">
                    <div class="score-value" style="color: <?php echo $score_color; ?>;"><?php echo $overall_rating; ?>/10</div>
                    <div class="score-label"><?php echo esc_html($grade_label); ?></div>
                    <div class="score-sublabel">Gesamtbewertung</div>
                </div>
                <?php endif; ?>
                <div class="info-card">
                    <div class="info-card-title">Training Details</div>
                    <?php foreach ($display_info as $label => $value) : ?>
                    <div class="info-item">
                        <span class="info-label"><?php echo esc_html($label); ?></span>
                        <span class="info-value"><?php echo esc_html($value); ?></span>
                    </div>
                    <?php endforeach; ?>
                    <div class="info-item">
                        <span class="info-label">Datum</span>
                        <span class="info-value"><?php echo esc_html($formatted_date); ?></span>
                    </div>
                </div>
            </div>
            <div class="clearfix"></div>

            <hr class="divider">

            <?php if ($feedback && isset($feedback['summary'])) : ?>
            <div class="section-title">Gesamteindruck</div>
            <p class="text-content"><?php echo esc_html($feedback['summary']); ?></p>
            <?php endif; ?>

            <?php if ($feedback && isset($feedback['rating'])) : ?>
            <div class="section-title">Detaillierte Bewertungen</div>
            <?php
            $rating_labels = [
                'overall' => 'Gesamt',
                'kommunikation' => 'Kommunikation',
                'motivation' => 'Motivation',
                'professionalitaet' => 'Professionalität',
                'vorbereitung' => 'Vorbereitung',
                'fachwissen' => 'Fachwissen'
            ];
            foreach ($feedback['rating'] as $category => $rating) :
                $cat_label = isset($rating_labels[strtolower($category)]) ? $rating_labels[strtolower($category)] : ucfirst($category);
            ?>
            <div class="category-row">
                <span class="category-name"><?php echo esc_html($cat_label); ?></span>
                <span class="category-score"><?php echo esc_html($rating); ?>/10</span>
            </div>
            <?php endforeach; ?>
            <?php endif; ?>

            <?php if ($feedback && isset($feedback['strengths']) && !empty($feedback['strengths'])) : ?>
            <div class="info-box green">
                <div class="info-box-title">Stärken</div>
                <ul>
                    <?php foreach ($feedback['strengths'] as $strength) : ?>
                    <li><?php echo esc_html($strength); ?></li>
                    <?php endforeach; ?>
                </ul>
            </div>
            <?php endif; ?>

            <?php if ($feedback && isset($feedback['improvements']) && !empty($feedback['improvements'])) : ?>
            <div class="info-box yellow">
                <div class="info-box-title">Verbesserungspotenzial</div>
                <ul>
                    <?php foreach ($feedback['improvements'] as $improvement) : ?>
                    <li><?php echo esc_html($improvement); ?></li>
                    <?php endforeach; ?>
                </ul>
            </div>
            <?php endif; ?>

            <?php if ($feedback && isset($feedback['tips']) && !empty($feedback['tips'])) : ?>
            <div class="info-box blue">
                <div class="info-box-title">Tipps für die Zukunft</div>
                <ul>
                    <?php foreach ($feedback['tips'] as $tip) : ?>
                    <li><?php echo esc_html($tip); ?></li>
                    <?php endforeach; ?>
                </ul>
            </div>
            <?php endif; ?>

            <?php
            // Get audio_metrics from the analysis (may be nested or at top level)
            $metrics = isset($audio_analysis['audio_metrics']) ? $audio_analysis['audio_metrics'] : $audio_analysis;
            $has_audio_data = $metrics && !isset($metrics['error']) && (
                isset($metrics['confidence_score']) ||
                isset($metrics['speech_cleanliness']) ||
                isset($metrics['pacing']) ||
                isset($metrics['tonality'])
            );
            ?>
            <?php if ($has_audio_data) : ?>
            <hr class="divider">
            <div class="section-title">Paraverbale Analyse</div>

            <?php
            // Confidence Score
            if (isset($metrics['confidence_score'])) :
                $conf_score = $metrics['confidence_score'];
                $conf_color = $conf_score >= 80 ? '#22c55e' : ($conf_score >= 60 ? '#3b82f6' : ($conf_score >= 40 ? '#f59e0b' : '#ef4444'));
                $conf_label = $conf_score >= 80 ? 'Sehr selbstsicher' : ($conf_score >= 60 ? 'Selbstsicher' : ($conf_score >= 40 ? 'Ausbaufähig' : 'Unsicher'));
            ?>
            <div class="category-row">
                <span class="category-name">Selbstsicherheit</span>
                <span class="category-score" style="color: <?php echo $conf_color; ?>;"><?php echo $conf_score; ?>% - <?php echo $conf_label; ?></span>
            </div>
            <?php endif; ?>

            <?php
            // Speech Cleanliness (Filler Words)
            if (isset($metrics['speech_cleanliness'])) :
                $speech = $metrics['speech_cleanliness'];
                $filler_count = isset($speech['total_filler_count']) ? $speech['total_filler_count'] : 0;
                $filler_color = $filler_count <= 2 ? '#22c55e' : ($filler_count <= 5 ? '#f59e0b' : '#ef4444');
            ?>
            <div class="info-box" style="background-color: <?php echo $filler_count <= 2 ? '#f0fdf4' : ($filler_count <= 5 ? '#fffbeb' : '#fef2f2'); ?>; border-left: 3px solid <?php echo $filler_color; ?>;">
                <div class="info-box-title" style="color: <?php echo $filler_color; ?>;">Füllwörter: <?php echo $filler_count; ?> erkannt</div>
                <?php if (isset($speech['filler_word_analysis']) && is_array($speech['filler_word_analysis']) && !empty($speech['filler_word_analysis'])) : ?>
                <ul style="margin: 8px 0 0 0; padding-left: 20px;">
                    <?php foreach ($speech['filler_word_analysis'] as $item) : if (!is_array($item)) continue; ?>
                    <li style="margin: 4px 0; color: #374151;">
                        <strong>"<?php echo esc_html($item['word']); ?>"</strong> (<?php echo esc_html($item['count']); ?>x)
                        <?php if (isset($item['examples']) && !empty($item['examples'])) : ?>
                        - bei <?php
                            $timestamps = array_map(function($ex) {
                                return isset($ex['timestamp']) ? $ex['timestamp'] : '';
                            }, array_slice($item['examples'], 0, 3));
                            $timestamps = array_filter($timestamps); // Remove empty values
                            if (!empty($timestamps)) {
                                echo esc_html(implode(', ', $timestamps));
                            }
                        ?>
                        <?php endif; ?>
                    </li>
                    <?php endforeach; ?>
                </ul>
                <?php endif; ?>
                <?php if (isset($speech['feedback'])) : ?>
                <p style="font-size: 9pt; margin: 10px 0 0 0; color: #64748b;"><?php echo esc_html($speech['feedback']); ?></p>
                <?php endif; ?>
            </div>
            <?php endif; ?>

            <?php
            // Pacing
            if (isset($metrics['pacing'])) :
                $pacing = $metrics['pacing'];
                $rating = isset($pacing['rating']) ? $pacing['rating'] : '';
                $wpm = isset($pacing['estimated_wpm']) ? $pacing['estimated_wpm'] : null;
                $pacing_label = $rating === 'optimal' ? 'Optimal' : ($rating === 'zu_langsam' ? 'Zu langsam' : 'Zu schnell');
                $pacing_color = $rating === 'optimal' ? '#22c55e' : '#f59e0b';
            ?>
            <div class="category-row" style="border-left: 3px solid <?php echo $pacing_color; ?>;">
                <span class="category-name">Sprechtempo</span>
                <span class="category-score" style="color: <?php echo $pacing_color; ?>;">
                    <?php echo $pacing_label; ?>
                    <?php if ($wpm) : ?>(~<?php echo $wpm; ?> WPM)<?php endif; ?>
                </span>
            </div>
            <?php if (isset($pacing['feedback'])) : ?>
            <p class="text-content" style="margin-top: 8px; font-size: 9pt;"><?php echo esc_html($pacing['feedback']); ?></p>
            <?php endif; ?>
            <?php endif; ?>

            <?php
            // Tonality
            if (isset($metrics['tonality'])) :
                $tonality = $metrics['tonality'];
                $ton_rating = isset($tonality['rating']) ? $tonality['rating'] : '';
                $ton_label = $ton_rating === 'lebendig' ? 'Lebendig' : ($ton_rating === 'natürlich' ? 'Natürlich' : 'Monoton');
                $ton_color = $ton_rating === 'monoton' ? '#f59e0b' : '#0d9488';
            ?>
            <div class="category-row" style="border-left: 3px solid <?php echo $ton_color; ?>;">
                <span class="category-name">Tonalität</span>
                <span class="category-score" style="color: <?php echo $ton_color; ?>;"><?php echo $ton_label; ?></span>
            </div>
            <?php if (isset($tonality['highlights']) && is_array($tonality['highlights']) && !empty($tonality['highlights'])) : ?>
            <div style="margin: 8px 0; padding: 10px; background: #f0fdfa; border-radius: 6px;">
                <div style="font-size: 9pt; font-weight: 600; color: #0d9488; margin-bottom: 6px;">Bemerkenswerte Momente:</div>
                <?php foreach ($tonality['highlights'] as $highlight) : if (!is_array($highlight)) continue; ?>
                <div style="font-size: 9pt; color: #374151; margin: 4px 0;">
                    <span style="font-family: monospace; color: #0d9488;"><?php echo esc_html(isset($highlight['timestamp']) ? $highlight['timestamp'] : ''); ?></span>
                    - <?php echo esc_html(isset($highlight['note']) ? $highlight['note'] : ''); ?>
                </div>
                <?php endforeach; ?>
            </div>
            <?php endif; ?>
            <?php if (isset($tonality['feedback'])) : ?>
            <p class="text-content" style="margin-top: 8px; font-size: 9pt;"><?php echo esc_html($tonality['feedback']); ?></p>
            <?php endif; ?>
            <?php endif; ?>

            <?php endif; // has_audio_data ?>

            <?php
            // Legacy audio analysis format fallback
            if ($audio_analysis && !$has_audio_data && !isset($audio_analysis['error'])) : ?>
            <hr class="divider">
            <div class="section-title">Audio-Analyse</div>
            <?php if (isset($audio_analysis['summary'])) : ?>
            <p class="text-content"><?php echo esc_html($audio_analysis['summary']); ?></p>
            <?php endif; ?>
            <?php
            $legacy_metrics = array(
                'clarity' => 'Klarheit',
                'pace' => 'Tempo',
                'confidence' => 'Selbstsicherheit',
                'tonalModulation' => 'Tonale Modulation'
            );
            foreach ($legacy_metrics as $metric => $label) :
                if (isset($audio_analysis[$metric])) :
            ?>
            <div class="category-row">
                <span class="category-name"><?php echo esc_html($label); ?></span>
                <span class="category-score"><?php echo esc_html($audio_analysis[$metric]['rating']); ?>/10</span>
            </div>
            <?php
                endif;
            endforeach;
            endif; ?>

            <?php
            // Transcript Section (at the end)
            $transcript_data = null;
            if (!empty($session->transcript)) {
                $transcript_data = is_array($session->transcript)
                    ? $session->transcript
                    : json_decode($session->transcript, true);
            }
            if ($transcript_data && is_array($transcript_data) && !empty($transcript_data)) :
            ?>
            <hr class="divider">
            <div class="section-title">Gesprächsverlauf</div>
            <div style="background: #f8fafc; border-radius: 8px; padding: 15px; font-size: 9pt;">
                <?php foreach ($transcript_data as $entry) :
                    if (!is_array($entry)) continue;
                    $role = isset($entry['role']) ? $entry['role'] : '';
                    $text = isset($entry['text']) ? $entry['text'] : (isset($entry['message']) ? $entry['message'] : '');
                    $is_agent = ($role === 'agent' || $role === 'ai');
                    $speaker_label = $is_agent ? 'Interviewer' : 'Sie';
                    $speaker_color = $is_agent ? '#6366f1' : '#0d9488';
                ?>
                <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e2e8f0;">
                    <div style="font-weight: 600; color: <?php echo $speaker_color; ?>; margin-bottom: 4px;">
                        <?php echo $speaker_label; ?>
                    </div>
                    <div style="color: #374151; line-height: 1.5;">
                        <?php echo esc_html($text); ?>
                    </div>
                </div>
                <?php endforeach; ?>
            </div>
            <?php endif; ?>

            <div class="footer">
                <div class="footer-logo">Erstellt mit Karriereheld</div>
                <div class="footer-meta"><?php echo esc_html(date('d.m.Y')); ?></div>
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

        // Get session for filename (try both tables)
        $session = null;
        if (method_exists($this->db, 'get_roleplay_session')) {
            $session = $this->db->get_roleplay_session($session_id);
        }
        if (!$session) {
            $session = $this->db->get_session($session_id);
        }

        // Extract position from session or variables_json
        $position = '';
        if (isset($session->position)) {
            $position = $session->position;
        } elseif (!empty($session->variables_json)) {
            $variables = is_array($session->variables_json)
                ? $session->variables_json
                : json_decode($session->variables_json, true);
            if (is_array($variables) && isset($variables['position'])) {
                $position = $variables['position'];
            }
        }

        $date = new DateTime($session->created_at);
        $download_filename = 'Bewertung-' . sanitize_file_name($position ?: 'Session') . '-' . $date->format('Y-m-d') . '.pdf';

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

        // Get session for filename (try both tables)
        $session = null;
        if (method_exists($this->db, 'get_roleplay_session')) {
            $session = $this->db->get_roleplay_session($session_id);
        }
        if (!$session) {
            $session = $this->db->get_session($session_id);
        }

        // Extract position from session or variables_json
        $position = '';
        if (isset($session->position)) {
            $position = $session->position;
        } elseif (!empty($session->variables_json)) {
            $variables = is_array($session->variables_json)
                ? $session->variables_json
                : json_decode($session->variables_json, true);
            if (is_array($variables) && isset($variables['position'])) {
                $position = $variables['position'];
            }
        }

        $date = new DateTime($session->created_at);
        $download_filename = 'Live-Simulation-' . sanitize_file_name($position ?: 'Session') . '-' . $date->format('Y-m-d') . '.pdf';

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
     * Generate HTML content for Simulator PDF - Six Drivers Style
     */
    private function generate_simulator_pdf_html($session, $answers, $scenario_title) {
        $formatted_date = $this->format_date($session->created_at);
        $primary_color = '#0d6a7c';

        // Calculate overall score (convert from 0-10 to 0-100)
        $overall_score = isset($session->overall_score) ? floatval($session->overall_score) * 10 : 0;
        $grade_label = $this->get_grade_label($overall_score);
        $score_color = $this->get_score_color($overall_score);

        // Parse summary feedback
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
            <style>
                @page { margin: 12mm 15mm 15mm 15mm; }
                * { box-sizing: border-box; }
                body {
                    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
                    font-size: 10pt;
                    line-height: 1.6;
                    color: #1a1a2e;
                    margin: 0;
                    padding: 0;
                }
                .header-bar {
                    background-color: <?php echo $primary_color; ?>;
                    height: 8px;
                    margin-bottom: 25px;
                }
                .main-title {
                    font-size: 20pt;
                    font-weight: 700;
                    color: <?php echo $primary_color; ?>;
                    text-align: center;
                    margin: 0 0 10px 0;
                }
                .subtitle {
                    font-size: 11pt;
                    color: #475569;
                    text-align: center;
                    margin: 0 0 20px 0;
                }
                .score-box {
                    text-align: center;
                    margin: 20px auto;
                    padding: 20px;
                    background-color: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    max-width: 300px;
                }
                .score-value {
                    font-size: 36pt;
                    font-weight: 800;
                }
                .score-label {
                    font-size: 10pt;
                    color: #64748b;
                    text-transform: uppercase;
                    margin-top: 5px;
                }
                .divider {
                    border: none;
                    border-top: 1px solid #d1d5db;
                    margin: 25px 0;
                }
                .section-title {
                    font-size: 14pt;
                    font-weight: 700;
                    color: <?php echo $primary_color; ?>;
                    text-align: left;
                    margin: 25px 0 15px 0;
                }
                .subsection-title {
                    font-size: 12pt;
                    font-weight: 700;
                    color: <?php echo $primary_color; ?>;
                    margin: 20px 0 10px 0;
                }
                .text-content {
                    font-size: 10pt;
                    color: #374151;
                    line-height: 1.6;
                    text-align: justify;
                    margin-bottom: 10px;
                }
                .category-row {
                    margin: 8px 0;
                    padding: 10px 15px;
                    background-color: #f8fafc;
                    border-radius: 6px;
                }
                .category-name {
                    font-weight: 600;
                    color: #1e293b;
                    display: inline;
                }
                .category-score {
                    float: right;
                    font-weight: 700;
                }
                .info-box {
                    padding: 12px 15px;
                    border-radius: 6px;
                    margin: 10px 0;
                }
                .info-box.green {
                    background-color: #ecfdf5;
                    border-left: 3px solid #10b981;
                }
                .info-box.yellow {
                    background-color: #fffbeb;
                    border-left: 3px solid #f59e0b;
                }
                .info-box.blue {
                    background-color: #eff6ff;
                    border-left: 3px solid #3b82f6;
                }
                .info-box-title {
                    font-weight: 700;
                    margin-bottom: 8px;
                }
                .info-box.green .info-box-title { color: #059669; }
                .info-box.yellow .info-box-title { color: #b45309; }
                .info-box.blue .info-box-title { color: #1d4ed8; }
                .info-box ul {
                    margin: 0;
                    padding-left: 20px;
                }
                .info-box li {
                    margin: 4px 0;
                    color: #374151;
                }
                .question-box {
                    background-color: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    padding: 15px;
                    margin: 15px 0;
                    page-break-inside: avoid;
                }
                .question-header {
                    font-weight: 700;
                    color: <?php echo $primary_color; ?>;
                    margin-bottom: 10px;
                }
                .answer-box {
                    background-color: #ffffff;
                    border: 1px solid #e5e7eb;
                    border-radius: 6px;
                    padding: 12px;
                    margin: 10px 0;
                }
                .answer-label {
                    font-size: 9pt;
                    font-weight: 600;
                    color: #64748b;
                    text-transform: uppercase;
                    margin-bottom: 5px;
                }
                .metrics-row {
                    margin: 10px 0;
                }
                .metric-item {
                    display: inline-block;
                    text-align: center;
                    padding: 8px 12px;
                    background-color: #ffffff;
                    border: 1px solid #e5e7eb;
                    border-radius: 6px;
                    margin-right: 8px;
                    min-width: 70px;
                }
                .metric-value {
                    font-size: 14pt;
                    font-weight: 700;
                }
                .metric-label {
                    font-size: 8pt;
                    color: #64748b;
                    text-transform: uppercase;
                }
                .footer {
                    margin-top: 40px;
                    padding-top: 15px;
                    border-top: 1px solid #d1d5db;
                    text-align: center;
                }
                .footer-logo {
                    font-size: 10pt;
                    font-weight: 600;
                    color: <?php echo $primary_color; ?>;
                }
                .footer-meta {
                    font-size: 9pt;
                    color: #9ca3af;
                }
            </style>
        </head>
        <body>
            <div class="header-bar"></div>

            <h1 class="main-title">Szenario-Training Auswertung</h1>
            <p class="subtitle"><?php echo esc_html($scenario_title); ?></p>

            <div class="score-box">
                <div class="score-value" style="color: <?php echo $score_color; ?>;"><?php echo round($overall_score); ?>%</div>
                <div class="score-label">Gesamtbewertung - <?php echo esc_html($grade_label); ?></div>
            </div>

            <p class="subtitle"><?php echo esc_html($formatted_date); ?> · <?php echo count($answers); ?> Fragen beantwortet</p>

            <hr class="divider">

            <?php if ($summary_feedback && !empty($summary_feedback['summary'])) : ?>
            <div class="section-title">Zusammenfassung</div>
            <p class="text-content"><?php echo esc_html($summary_feedback['summary']); ?></p>
            <?php endif; ?>

            <?php if ($summary_feedback && !empty($summary_feedback['scores'])) : ?>
            <div class="section-title">Bewertungsübersicht</div>
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
                $cat_color = $this->get_score_color($score_100);
                $cat_label = isset($category_labels[strtolower($category)]) ? $category_labels[strtolower($category)] : ucfirst(str_replace('_', ' ', $category));
            ?>
            <div class="category-row">
                <span class="category-name"><?php echo esc_html($cat_label); ?></span>
                <span class="category-score" style="color: <?php echo $cat_color; ?>;"><?php echo round($score_100); ?>%</span>
            </div>
            <?php endforeach; ?>
            <?php endif; ?>

            <?php if ($summary_feedback && !empty($summary_feedback['key_takeaways'])) : ?>
            <div class="info-box yellow">
                <div class="info-box-title">Wichtigste Erkenntnisse</div>
                <ul>
                    <?php foreach ($summary_feedback['key_takeaways'] as $item) : ?>
                    <li><?php echo esc_html($item); ?></li>
                    <?php endforeach; ?>
                </ul>
            </div>
            <?php endif; ?>

            <hr class="divider">

            <?php if (!empty($answers)) : ?>
            <div class="section-title">Deine Antworten im Detail</div>

            <?php foreach ($answers as $index => $answer) :
                $feedback = !empty($answer->feedback_json) ? $answer->feedback_json : null;
                $audio_analysis = !empty($answer->audio_analysis_json) ? $answer->audio_analysis_json : null;
                $answer_score = isset($answer->overall_score) ? floatval($answer->overall_score) * 10 : null;
                $answer_color = $answer_score !== null ? $this->get_score_color($answer_score) : $primary_color;
                $is_no_speech = $answer->transcript === '[Keine Sprache erkannt]';
            ?>
            <div class="question-box">
                <div class="question-header">
                    Frage <?php echo ($index + 1); ?>: <?php echo esc_html($answer->question_text ?: 'Frage ' . ($index + 1)); ?>
                    <?php if ($answer_score !== null && !$is_no_speech) : ?>
                    <span style="float: right; color: <?php echo $answer_color; ?>;"><?php echo round($answer_score); ?>%</span>
                    <?php endif; ?>
                </div>

                <?php if (!empty($answer->transcript)) : ?>
                <div class="answer-box">
                    <div class="answer-label">Deine Antwort</div>
                    <div><?php echo esc_html($answer->transcript); ?></div>
                </div>
                <?php endif; ?>

                <?php if ($feedback && !$is_no_speech) : ?>
                    <?php if (!empty($feedback['strengths'])) : ?>
                    <div class="info-box green">
                        <div class="info-box-title">Stärken</div>
                        <ul>
                            <?php foreach ($feedback['strengths'] as $item) : ?>
                            <li><?php echo esc_html($item); ?></li>
                            <?php endforeach; ?>
                        </ul>
                    </div>
                    <?php endif; ?>

                    <?php if (!empty($feedback['improvements'])) : ?>
                    <div class="info-box yellow">
                        <div class="info-box-title">Verbesserungspotenzial</div>
                        <ul>
                            <?php foreach ($feedback['improvements'] as $item) : ?>
                            <li><?php echo esc_html($item); ?></li>
                            <?php endforeach; ?>
                        </ul>
                    </div>
                    <?php endif; ?>

                    <?php if (!empty($feedback['tips'])) : ?>
                    <div class="info-box blue">
                        <div class="info-box-title">Tipps</div>
                        <ul>
                            <?php foreach ($feedback['tips'] as $item) : ?>
                            <li><?php echo esc_html($item); ?></li>
                            <?php endforeach; ?>
                        </ul>
                    </div>
                    <?php endif; ?>
                <?php endif; ?>

                <?php if ($audio_analysis && !$is_no_speech) : ?>
                <div class="subsection-title">Sprechanalyse</div>
                <div class="metrics-row">
                    <?php if (!empty($audio_analysis['speech_rate'])) :
                        $rate = $audio_analysis['speech_rate'];
                        $rate_text = $rate === 'optimal' ? 'Optimal' : ($rate === 'zu_schnell' ? 'Schnell' : 'Langsam');
                        $rate_color = $rate === 'optimal' ? '#10b981' : '#f59e0b';
                    ?>
                    <span class="metric-item">
                        <div class="metric-value" style="color: <?php echo $rate_color; ?>;"><?php echo $rate_text; ?></div>
                        <div class="metric-label">Tempo</div>
                    </span>
                    <?php endif; ?>
                    <?php if (isset($audio_analysis['filler_words']['count'])) : ?>
                    <span class="metric-item">
                        <div class="metric-value" style="color: <?php echo $audio_analysis['filler_words']['count'] <= 2 ? '#10b981' : '#f59e0b'; ?>;"><?php echo $audio_analysis['filler_words']['count']; ?></div>
                        <div class="metric-label">Füllwörter</div>
                    </span>
                    <?php endif; ?>
                    <?php if (isset($audio_analysis['confidence_score'])) : ?>
                    <span class="metric-item">
                        <div class="metric-value" style="color: <?php echo $this->get_score_color($audio_analysis['confidence_score']); ?>;"><?php echo $audio_analysis['confidence_score']; ?>%</div>
                        <div class="metric-label">Sicherheit</div>
                    </span>
                    <?php endif; ?>
                </div>
                <?php endif; ?>
            </div>
            <?php endforeach; ?>
            <?php endif; ?>

            <div class="footer">
                <div class="footer-logo">Erstellt mit Karriereheld</div>
                <div class="footer-meta"><?php echo esc_html(date('d.m.Y')); ?></div>
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
     * Generate HTML content for Video Training PDF - Six Drivers Style
     */
    private function generate_video_pdf_html($session, $scenario_title) {
        $formatted_date = $this->format_date($session->created_at);
        $primary_color = '#0d6a7c';

        // Overall score is already 0-100 for video training
        $overall_score = isset($session->overall_score) ? floatval($session->overall_score) : 0;
        $grade_label = $this->get_grade_label($overall_score);
        $score_color = $this->get_score_color($overall_score);

        // Parse category scores and analysis
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
            <style>
                @page { margin: 12mm 15mm 15mm 15mm; }
                * { box-sizing: border-box; }
                body {
                    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
                    font-size: 10pt;
                    line-height: 1.6;
                    color: #1a1a2e;
                    margin: 0;
                    padding: 0;
                }
                .header-bar {
                    background-color: <?php echo $primary_color; ?>;
                    height: 8px;
                    margin-bottom: 25px;
                }
                .main-title {
                    font-size: 20pt;
                    font-weight: 700;
                    color: <?php echo $primary_color; ?>;
                    text-align: center;
                    margin: 0 0 10px 0;
                }
                .subtitle {
                    font-size: 11pt;
                    color: #475569;
                    text-align: center;
                    margin: 0 0 20px 0;
                }
                .score-box {
                    text-align: center;
                    margin: 20px auto;
                    padding: 20px;
                    background-color: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    max-width: 300px;
                }
                .score-value {
                    font-size: 36pt;
                    font-weight: 800;
                }
                .score-label {
                    font-size: 10pt;
                    color: #64748b;
                    text-transform: uppercase;
                    margin-top: 5px;
                }
                .divider {
                    border: none;
                    border-top: 1px solid #d1d5db;
                    margin: 25px 0;
                }
                .section-title {
                    font-size: 14pt;
                    font-weight: 700;
                    color: <?php echo $primary_color; ?>;
                    text-align: left;
                    margin: 25px 0 15px 0;
                }
                .text-content {
                    font-size: 10pt;
                    color: #374151;
                    line-height: 1.6;
                    text-align: justify;
                    margin-bottom: 10px;
                }
                .category-row {
                    margin: 8px 0;
                    padding: 10px 15px;
                    background-color: #f8fafc;
                    border-radius: 6px;
                }
                .category-name {
                    font-weight: 600;
                    color: #1e293b;
                    display: inline;
                }
                .category-score {
                    float: right;
                    font-weight: 700;
                }
                .category-feedback {
                    font-size: 9pt;
                    color: #64748b;
                    margin-top: 5px;
                    clear: both;
                }
                .info-box {
                    padding: 12px 15px;
                    border-radius: 6px;
                    margin: 10px 0;
                }
                .info-box.green {
                    background-color: #ecfdf5;
                    border-left: 3px solid #10b981;
                }
                .info-box.yellow {
                    background-color: #fffbeb;
                    border-left: 3px solid #f59e0b;
                }
                .info-box-title {
                    font-weight: 700;
                    margin-bottom: 8px;
                }
                .info-box.green .info-box-title { color: #059669; }
                .info-box.yellow .info-box-title { color: #b45309; }
                .info-box ul {
                    margin: 0;
                    padding-left: 20px;
                }
                .info-box li {
                    margin: 4px 0;
                    color: #374151;
                }
                .footer {
                    margin-top: 40px;
                    padding-top: 15px;
                    border-top: 1px solid #d1d5db;
                    text-align: center;
                }
                .footer-logo {
                    font-size: 10pt;
                    font-weight: 600;
                    color: <?php echo $primary_color; ?>;
                }
                .footer-meta {
                    font-size: 9pt;
                    color: #9ca3af;
                }
            </style>
        </head>
        <body>
            <div class="header-bar"></div>

            <h1 class="main-title">Wirkungs-Analyse Auswertung</h1>
            <p class="subtitle"><?php echo esc_html($scenario_title); ?></p>

            <div class="score-box">
                <div class="score-value" style="color: <?php echo $score_color; ?>;"><?php echo round($overall_score); ?>%</div>
                <div class="score-label">Gesamtbewertung - <?php echo esc_html($grade_label); ?></div>
            </div>

            <p class="subtitle"><?php echo esc_html($formatted_date); ?><?php if ($duration_seconds > 0) : ?> · <?php echo esc_html($duration_formatted); ?> Min.<?php endif; ?></p>

            <hr class="divider">

            <?php if (!empty($category_scores)) : ?>
            <div class="section-title">Detaillierte Bewertung</div>
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
                $cat_color = $this->get_score_color($cat_score);
                $cat_label = isset($category['label']) ? $category['label'] : (isset($category_labels[$category['category']]) ? $category_labels[$category['category']] : ucfirst($category['category']));
            ?>
            <div class="category-row">
                <span class="category-name"><?php echo esc_html($cat_label); ?></span>
                <span class="category-score" style="color: <?php echo $cat_color; ?>;"><?php echo round($cat_score); ?>%</span>
                <?php if (!empty($category['feedback'])) : ?>
                <div class="category-feedback"><?php echo esc_html($category['feedback']); ?></div>
                <?php endif; ?>
            </div>
            <?php endforeach; ?>
            <?php endif; ?>

            <?php if (!empty($analysis['key_strengths'])) : ?>
            <div class="info-box green">
                <div class="info-box-title">Deine Stärken</div>
                <ul>
                    <?php foreach ($analysis['key_strengths'] as $item) : ?>
                    <li><?php echo esc_html($item); ?></li>
                    <?php endforeach; ?>
                </ul>
            </div>
            <?php endif; ?>

            <?php if (!empty($analysis['actionable_tips'])) : ?>
            <div class="info-box yellow">
                <div class="info-box-title">Tipps zur Verbesserung</div>
                <ul>
                    <?php foreach ($analysis['actionable_tips'] as $item) : ?>
                    <li><?php echo esc_html($item); ?></li>
                    <?php endforeach; ?>
                </ul>
            </div>
            <?php endif; ?>

            <?php if (!empty($session->summary_feedback)) : ?>
            <hr class="divider">
            <div class="section-title">Zusammenfassung</div>
            <p class="text-content"><?php echo esc_html($session->summary_feedback); ?></p>
            <?php endif; ?>

            <div class="footer">
                <div class="footer-logo">Erstellt mit Karriereheld</div>
                <div class="footer-meta"><?php echo esc_html(date('d.m.Y')); ?></div>
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

    // =========================================================================
    // SMART BRIEFING PDF EXPORT
    // =========================================================================

    /**
     * Export smart briefing to PDF
     *
     * @param int $briefing_id Briefing ID
     * @param int $user_id User ID (for security check)
     * @return string|WP_Error PDF file path or WP_Error on failure
     */
    public function export_briefing_pdf($briefing_id, $user_id = null) {
        if ($user_id === null) {
            $user_id = get_current_user_id();
        }

        if (!$this->smartbriefing_db) {
            return new WP_Error('not_available', __('Smart Briefing Modul nicht verfugbar.', 'bewerbungstrainer'));
        }

        // Get briefing
        $briefing = $this->smartbriefing_db->get_briefing($briefing_id);

        if (!$briefing) {
            return new WP_Error('not_found', __('Briefing nicht gefunden.', 'bewerbungstrainer'));
        }

        // Check ownership
        if ((int) $briefing->user_id !== (int) $user_id) {
            return new WP_Error('forbidden', __('Keine Berechtigung.', 'bewerbungstrainer'));
        }

        // Get sections
        $sections = $this->smartbriefing_db->get_briefing_sections($briefing_id);

        // Get template info
        $template = $this->smartbriefing_db->get_template($briefing->template_id);

        // Generate HTML content
        $html = $this->generate_briefing_pdf_html($briefing, $sections, $template);

        // Create PDF
        $pdf_path = $this->html_to_pdf($html, 'briefing-' . $briefing_id);

        return $pdf_path;
    }

    /**
     * Generate HTML content for Smart Briefing PDF
     * Includes all items with user notes, or space for handwritten notes
     */
    private function generate_briefing_pdf_html($briefing, $sections, $template) {
        $formatted_date = $this->format_date($briefing->created_at);
        $briefing_title = $briefing->title ?: ($template ? $template->title : 'Smart Briefing');

        // Get variables for display
        $variables = $briefing->variables_json ?: [];

        // Primary color - teal like Six Drivers
        $primary_color = '#0d6a7c';

        ob_start();
        ?>
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                @page {
                    margin: 12mm 15mm 15mm 15mm;
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

                /* Header Bar */
                .header-bar {
                    background-color: <?php echo $primary_color; ?>;
                    height: 8px;
                    margin-bottom: 25px;
                }

                /* Main Title */
                .main-title {
                    font-size: 20pt;
                    font-weight: 700;
                    color: <?php echo $primary_color; ?>;
                    text-align: center;
                    margin: 0 0 20px 0;
                    line-height: 1.3;
                }

                /* Subtitle / Description */
                .subtitle {
                    font-size: 11pt;
                    color: #475569;
                    text-align: center;
                    margin: 0 0 25px 0;
                }

                /* Table of Contents */
                .toc-title {
                    font-size: 12pt;
                    font-weight: 700;
                    color: <?php echo $primary_color; ?>;
                    text-align: left;
                    margin: 20px 0 12px 0;
                }
                .toc-list {
                    margin: 0 0 30px 0;
                    padding-left: 20px;
                    list-style-type: none;
                }
                .toc-list li {
                    margin: 6px 0;
                    color: #374151;
                    font-size: 10pt;
                }

                /* Divider */
                .divider {
                    border: none;
                    border-top: 1px solid #d1d5db;
                    margin: 25px 0;
                }

                /* Section Title */
                .section-title {
                    font-size: 14pt;
                    font-weight: 700;
                    color: <?php echo $primary_color; ?>;
                    text-align: left;
                    margin: 30px 0 20px 0;
                }

                /* Subsection Title */
                .subsection-title {
                    font-size: 12pt;
                    font-weight: 700;
                    color: <?php echo $primary_color; ?>;
                    text-align: left;
                    margin: 20px 0 12px 0;
                }

                /* Item Title */
                .item-title {
                    font-size: 10pt;
                    font-weight: 700;
                    color: #1e293b;
                    margin: 16px 0 4px 0;
                }

                /* Item Content */
                .item-content {
                    font-size: 10pt;
                    color: #374151;
                    line-height: 1.6;
                    margin: 0 0 8px 0;
                    text-align: justify;
                }

                /* Variables Box */
                .variables-box {
                    padding: 15px 0;
                    margin: 20px 0;
                }
                .variables-title {
                    font-size: 10pt;
                    font-weight: 700;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 10px;
                    text-align: left;
                }
                .variable-row {
                    margin: 6px 0;
                }
                .variable-label {
                    font-weight: 600;
                    color: #475569;
                    display: inline;
                }
                .variable-value {
                    color: #1e293b;
                    display: inline;
                }

                /* Note Box - for user notes */
                .note-box {
                    margin-top: 8px;
                    padding: 10px 14px;
                    background-color: #fef9c3;
                    border-left: 3px solid #eab308;
                    border-radius: 4px;
                }
                .note-label {
                    font-size: 9pt;
                    font-weight: 700;
                    color: #854d0e;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 4px;
                }
                .note-content {
                    font-size: 10pt;
                    color: #713f12;
                    font-style: italic;
                    line-height: 1.5;
                }

                /* Empty Note Space - for handwritten notes */
                .note-space {
                    margin-top: 8px;
                    padding: 8px 14px;
                    background-color: #fffbeb;
                    border: 1px dashed #d97706;
                    border-radius: 4px;
                    min-height: 40px;
                }
                .note-space-label {
                    font-size: 8pt;
                    color: #92400e;
                    font-style: italic;
                }
                .note-lines {
                    margin-top: 6px;
                    border-bottom: 1px solid #e5e7eb;
                    height: 16px;
                }

                /* Footer */
                .footer {
                    margin-top: 40px;
                    padding-top: 15px;
                    border-top: 1px solid #d1d5db;
                    text-align: center;
                }
                .footer-logo {
                    font-size: 10pt;
                    font-weight: 600;
                    color: <?php echo $primary_color; ?>;
                    margin-bottom: 3px;
                }
                .footer-meta {
                    font-size: 9pt;
                    color: #9ca3af;
                }

                .page-break {
                    page-break-before: always;
                }
            </style>
        </head>
        <body>
            <!-- Header Bar -->
            <div class="header-bar"></div>

            <!-- Main Title -->
            <h1 class="main-title"><?php echo esc_html($briefing_title); ?></h1>

            <?php if ($template && !empty($template->description)) : ?>
            <p class="subtitle"><?php echo esc_html($template->description); ?></p>
            <?php endif; ?>

            <!-- Table of Contents -->
            <?php if (count($sections) > 1) : ?>
            <div class="toc-title">Inhalt</div>
            <ul class="toc-list">
                <?php foreach ($sections as $section) : ?>
                <li><?php echo esc_html($this->strip_emojis($section->section_title)); ?></li>
                <?php endforeach; ?>
            </ul>
            <?php endif; ?>

            <!-- Variables Box -->
            <?php if (!empty($variables)) : ?>
            <div class="variables-box">
                <div class="variables-title">Ihre Eingaben</div>
                <?php foreach ($variables as $key => $value) :
                    if (empty($value)) continue;
                    $label = ucfirst(str_replace('_', ' ', $key));
                ?>
                <div class="variable-row">
                    <span class="variable-label"><?php echo esc_html($label); ?>:</span>
                    <span class="variable-value"><?php echo esc_html($value); ?></span>
                </div>
                <?php endforeach; ?>
            </div>
            <?php endif; ?>

            <hr class="divider">

            <!-- Sections -->
            <?php foreach ($sections as $section) :
                // Parse ai_content
                $items = [];
                if (!empty($section->ai_content)) {
                    $parsed = json_decode($section->ai_content, true);
                    if ($parsed && isset($parsed['items']) && is_array($parsed['items'])) {
                        $items = array_filter($parsed['items'], function($item) {
                            return empty($item['deleted']);
                        });
                    }
                }
            ?>
            <div class="section-title"><?php echo esc_html($this->strip_emojis($section->section_title)); ?></div>

            <?php if (!empty($items)) : ?>
                <?php foreach ($items as $item) : ?>
                    <?php if (!empty($item['label'])) : ?>
                    <div class="subsection-title"><?php echo esc_html($this->strip_emojis($item['label'])); ?></div>
                    <?php endif; ?>

                    <?php if (!empty($item['content'])) : ?>
                    <p class="item-content"><?php echo nl2br(esc_html($item['content'])); ?></p>
                    <?php endif; ?>

                    <?php if (!empty($item['user_note'])) : ?>
                    <div class="note-box">
                        <div class="note-label">Meine Notiz</div>
                        <div class="note-content"><?php echo nl2br(esc_html($item['user_note'])); ?></div>
                    </div>
                    <?php else : ?>
                    <div class="note-space">
                        <div class="note-space-label">Notizen:</div>
                        <div class="note-lines"></div>
                        <div class="note-lines"></div>
                    </div>
                    <?php endif; ?>
                <?php endforeach; ?>
            <?php else : ?>
                <?php if (!empty($section->ai_content)) : ?>
                <p class="item-content"><?php echo nl2br(esc_html($section->ai_content)); ?></p>
                <div class="note-space">
                    <div class="note-space-label">Notizen:</div>
                    <div class="note-lines"></div>
                    <div class="note-lines"></div>
                </div>
                <?php endif; ?>
            <?php endif; ?>

            <?php if (!empty($section->user_notes)) : ?>
            <div class="note-box">
                <div class="note-label">Abschnitts-Notizen</div>
                <div class="note-content"><?php echo nl2br(esc_html($section->user_notes)); ?></div>
            </div>
            <?php endif; ?>

            <hr class="divider">
            <?php endforeach; ?>

            <!-- Footer -->
            <div class="footer">
                <div class="footer-logo">Erstellt mit Karriereheld</div>
                <div class="footer-meta"><?php echo esc_html(date('d.m.Y')); ?></div>
            </div>
        </body>
        </html>
        <?php
        return ob_get_clean();
    }

    /**
     * Get smart briefing PDF as base64 for REST API response
     *
     * @param int $briefing_id Briefing ID
     * @param int $user_id User ID (for security check)
     * @return array|WP_Error PDF data or WP_Error on failure
     */
    public function get_briefing_pdf_base64($briefing_id, $user_id = null) {
        $pdf_path = $this->export_briefing_pdf($briefing_id, $user_id);

        if (is_wp_error($pdf_path)) {
            return $pdf_path;
        }

        // Read PDF content and encode as base64
        $pdf_content = file_get_contents($pdf_path);
        $base64_content = base64_encode($pdf_content);

        // Get briefing for filename
        $briefing = $this->smartbriefing_db->get_briefing($briefing_id);
        $template = $this->smartbriefing_db->get_template($briefing->template_id);
        $briefing_title = $briefing->title ?: ($template ? $template->title : 'Briefing');
        $date = new DateTime($briefing->created_at);
        $download_filename = 'Smart-Briefing-' . sanitize_file_name($briefing_title) . '-' . $date->format('Y-m-d') . '.pdf';

        // Clean up temporary file
        wp_delete_file($pdf_path);

        return array(
            'pdf_base64' => $base64_content,
            'filename' => $download_filename,
            'content_type' => 'application/pdf',
        );
    }
}
