<?php
/**
 * Shortcodes Class
 *
 * Handles all shortcodes for the Bewerbungstrainer plugin
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

class Bewerbungstrainer_Shortcodes {

    /**
     * Instance of this class
     */
    private static $instance = null;

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
        add_shortcode('bewerbungstrainer_interview', array($this, 'interview_shortcode'));
        add_shortcode('bewerbungstrainer_video_training', array($this, 'video_training_shortcode'));
        add_shortcode('bewerbungstrainer_uebungen', array($this, 'exercises_list_shortcode'));
        add_shortcode('bewerbungstrainer_dokumente', array($this, 'documents_shortcode'));
        // Alias for easier usage
        add_shortcode('bewerbungscoach', array($this, 'interview_shortcode'));
    }

    /**
     * Interview shortcode
     *
     * Usage: [bewerbungstrainer_interview]
     */
    public function interview_shortcode($atts) {
        // Allow all users (logged in or not) to use the interview app
        // The wizard will let them enter their name manually if not logged in

        // Enqueue assets
        $this->enqueue_interview_assets();

        // Return container div where React app will mount
        ob_start();
        ?>
        <div id="bewerbungstrainer-app" class="bewerbungstrainer-interview-container">
            <div class="bewerbungstrainer-loading">
                <div class="spinner"></div>
                <p><?php esc_html_e('Bewerbungstrainer wird geladen...', 'bewerbungstrainer'); ?></p>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }

    /**
     * Video Training shortcode
     *
     * Usage: [bewerbungstrainer_video_training]
     */
    public function video_training_shortcode($atts) {
        // Allow all users (logged in or not)
        // Enqueue assets
        $this->enqueue_video_training_assets();

        // Prepare configuration for JavaScript
        $config = array(
            'apiUrl' => rest_url('bewerbungstrainer/v1'),
            'nonce' => wp_create_nonce('wp_rest'),
            'currentUser' => array(
                'id' => get_current_user_id(),
                'name' => wp_get_current_user()->display_name,
            ),
        );

        // Return container div where React app will mount
        ob_start();
        ?>
        <script type="text/javascript">
            window.bewerbungstrainerVideoTraining = <?php echo wp_json_encode($config); ?>;
        </script>
        <div id="bewerbungstrainer-video-training-app" class="bewerbungstrainer-video-training-container">
            <div class="bewerbungstrainer-loading">
                <div class="spinner"></div>
                <p><?php esc_html_e('Video-Training wird geladen...', 'bewerbungstrainer'); ?></p>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }

    /**
     * Exercises list shortcode
     *
     * Usage: [bewerbungstrainer_uebungen]
     */
    public function exercises_list_shortcode($atts) {
        // Check if user is logged in
        if (!is_user_logged_in()) {
            return $this->render_login_message();
        }

        // Parse attributes
        $atts = shortcode_atts(array(
            'limit' => 20,
            'show_pagination' => 'yes',
        ), $atts, 'bewerbungstrainer_uebungen');

        // Get database instance
        $db = Bewerbungstrainer_Database::get_instance();

        // Get sessions
        $page = isset($_GET['bt_page']) ? max(1, intval($_GET['bt_page'])) : 1;
        $limit = max(1, intval($atts['limit']));
        $offset = ($page - 1) * $limit;

        $sessions = $db->get_user_sessions(get_current_user_id(), array(
            'limit' => $limit,
            'offset' => $offset,
            'orderby' => 'created_at',
            'order' => 'DESC',
        ));

        $total = $db->get_user_sessions_count(get_current_user_id());
        $total_pages = ceil($total / $limit);

        // Enqueue styles
        $this->enqueue_exercises_assets();

        // Render exercises list
        ob_start();
        ?>
        <div class="bewerbungstrainer-exercises-container">
            <div class="bewerbungstrainer-exercises-header">
                <h2><?php esc_html_e('Meine Übungen', 'bewerbungstrainer'); ?></h2>
                <p class="bewerbungstrainer-exercises-count">
                    <?php
                    printf(
                        esc_html__('Gesamt: %d Übungen', 'bewerbungstrainer'),
                        $total
                    );
                    ?>
                </p>
            </div>

            <?php if (empty($sessions)) : ?>
                <div class="bewerbungstrainer-no-exercises">
                    <div class="bewerbungstrainer-no-exercises-icon">
                        <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                    </div>
                    <h3><?php esc_html_e('Noch keine Übungen vorhanden', 'bewerbungstrainer'); ?></h3>
                    <p><?php esc_html_e('Starte dein erstes Bewerbungsgespräch, um Feedback zu erhalten.', 'bewerbungstrainer'); ?></p>
                </div>
            <?php else : ?>
                <div class="bewerbungstrainer-exercises-grid">
                    <?php foreach ($sessions as $session) : ?>
                        <?php $this->render_exercise_card($session); ?>
                    <?php endforeach; ?>
                </div>

                <?php if ($atts['show_pagination'] === 'yes' && $total_pages > 1) : ?>
                    <div class="bewerbungstrainer-pagination">
                        <?php
                        $current_url = remove_query_arg('bt_page');

                        // Previous button
                        if ($page > 1) {
                            $prev_url = add_query_arg('bt_page', $page - 1, $current_url);
                            echo '<a href="' . esc_url($prev_url) . '" class="bewerbungstrainer-pagination-link bewerbungstrainer-pagination-prev">&laquo; ' . esc_html__('Zurück', 'bewerbungstrainer') . '</a>';
                        }

                        // Page numbers
                        echo '<span class="bewerbungstrainer-pagination-info">';
                        printf(
                            esc_html__('Seite %d von %d', 'bewerbungstrainer'),
                            $page,
                            $total_pages
                        );
                        echo '</span>';

                        // Next button
                        if ($page < $total_pages) {
                            $next_url = add_query_arg('bt_page', $page + 1, $current_url);
                            echo '<a href="' . esc_url($next_url) . '" class="bewerbungstrainer-pagination-link bewerbungstrainer-pagination-next">' . esc_html__('Weiter', 'bewerbungstrainer') . ' &raquo;</a>';
                        }
                        ?>
                    </div>
                <?php endif; ?>
            <?php endif; ?>
        </div>
        <?php
        return ob_get_clean();
    }

    /**
     * Render single exercise card
     *
     * @param object $session Session object
     */
    private function render_exercise_card($session) {
        $feedback = $session->feedback_json ? json_decode($session->feedback_json, true) : null;
        $audio_analysis = $session->audio_analysis_json ? json_decode($session->audio_analysis_json, true) : null;

        // Calculate overall rating
        $overall_rating = null;
        if ($feedback && isset($feedback['rating']['overall'])) {
            $overall_rating = $feedback['rating']['overall'];
        }

        // Format date
        $date = new DateTime($session->created_at);
        $formatted_date = $date->format('d.m.Y H:i');
        ?>
        <div class="bewerbungstrainer-exercise-card" data-session-id="<?php echo esc_attr($session->id); ?>">
            <div class="bewerbungstrainer-exercise-header">
                <div class="bewerbungstrainer-exercise-date">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"></path>
                    </svg>
                    <?php echo esc_html($formatted_date); ?>
                </div>
                <?php if ($overall_rating !== null) : ?>
                    <div class="bewerbungstrainer-exercise-rating">
                        <span class="rating-stars">
                            <?php for ($i = 1; $i <= 10; $i++) : ?>
                                <span class="star <?php echo $i <= $overall_rating ? 'filled' : ''; ?>">★</span>
                            <?php endfor; ?>
                        </span>
                        <span class="rating-value"><?php echo esc_html($overall_rating); ?>/10</span>
                    </div>
                <?php endif; ?>
            </div>

            <div class="bewerbungstrainer-exercise-body">
                <h3 class="bewerbungstrainer-exercise-title">
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clip-rule="evenodd"></path>
                        <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z"></path>
                    </svg>
                    <?php echo esc_html($session->position); ?>
                </h3>
                <p class="bewerbungstrainer-exercise-company">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clip-rule="evenodd"></path>
                    </svg>
                    <?php echo esc_html($session->company); ?>
                </p>

                <?php if ($feedback && isset($feedback['summary'])) : ?>
                    <div class="bewerbungstrainer-exercise-summary">
                        <?php echo esc_html(wp_trim_words($feedback['summary'], 20)); ?>
                    </div>
                <?php endif; ?>
            </div>

            <div class="bewerbungstrainer-exercise-footer">
                <button
                    class="bewerbungstrainer-btn bewerbungstrainer-btn-primary bewerbungstrainer-view-details"
                    data-session-id="<?php echo esc_attr($session->id); ?>"
                    onclick="bewerbungstrainerViewDetails(<?php echo esc_attr($session->id); ?>)"
                >
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path>
                        <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"></path>
                    </svg>
                    <?php esc_html_e('Details', 'bewerbungstrainer'); ?>
                </button>

                <?php if ($feedback) : ?>
                    <a
                        href="<?php echo esc_url(rest_url('bewerbungstrainer/v1/sessions/' . $session->id . '/export-pdf')); ?>"
                        class="bewerbungstrainer-btn bewerbungstrainer-btn-success bewerbungstrainer-export-pdf"
                        target="_blank"
                    >
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clip-rule="evenodd"></path>
                        </svg>
                        <?php esc_html_e('PDF', 'bewerbungstrainer'); ?>
                    </a>
                <?php endif; ?>

                <?php if ($session->audio_url) : ?>
                    <button
                        class="bewerbungstrainer-btn bewerbungstrainer-btn-secondary bewerbungstrainer-play-audio"
                        data-audio-url="<?php echo esc_url($session->audio_url); ?>"
                        onclick="bewerbungstrainerPlayAudio('<?php echo esc_url($session->audio_url); ?>', this)"
                    >
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"></path>
                        </svg>
                        <?php esc_html_e('Audio', 'bewerbungstrainer'); ?>
                    </button>
                <?php endif; ?>
            </div>
        </div>

        <!-- Details Modal (hidden by default) -->
        <div id="bewerbungstrainer-modal-<?php echo esc_attr($session->id); ?>" class="bewerbungstrainer-modal" style="display: none;">
            <div class="bewerbungstrainer-modal-overlay" onclick="bewerbungstrainerCloseModal(<?php echo esc_attr($session->id); ?>)"></div>
            <div class="bewerbungstrainer-modal-content">
                <button class="bewerbungstrainer-modal-close" onclick="bewerbungstrainerCloseModal(<?php echo esc_attr($session->id); ?>)">
                    <svg width="24" height="24" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                    </svg>
                </button>

                <div class="bewerbungstrainer-modal-header">
                    <h2><?php echo esc_html($session->position); ?> - <?php echo esc_html($session->company); ?></h2>
                    <p class="bewerbungstrainer-modal-date"><?php echo esc_html($formatted_date); ?></p>
                </div>

                <div class="bewerbungstrainer-modal-body">
                    <?php if ($feedback) : ?>
                        <?php $this->render_feedback_section($feedback); ?>
                    <?php endif; ?>

                    <?php if ($audio_analysis && !isset($audio_analysis['error'])) : ?>
                        <?php $this->render_audio_analysis_section($audio_analysis); ?>
                    <?php endif; ?>

                    <?php if ($session->audio_url) : ?>
                        <div class="bewerbungstrainer-audio-player">
                            <h3><?php esc_html_e('Gesprächsaufzeichnung', 'bewerbungstrainer'); ?></h3>
                            <audio controls controlsList="nodownload">
                                <source src="<?php echo esc_url($session->audio_url); ?>" type="audio/mpeg">
                                <?php esc_html_e('Dein Browser unterstützt kein Audio-Element.', 'bewerbungstrainer'); ?>
                            </audio>
                        </div>
                    <?php endif; ?>
                </div>
            </div>
        </div>
        <?php
    }

    /**
     * Render feedback section
     *
     * @param array $feedback Feedback data
     */
    private function render_feedback_section($feedback) {
        ?>
        <div class="bewerbungstrainer-feedback-section">
            <h3><?php esc_html_e('Feedback', 'bewerbungstrainer'); ?></h3>

            <?php if (isset($feedback['summary'])) : ?>
                <div class="bewerbungstrainer-feedback-summary">
                    <h4><?php esc_html_e('Gesamteindruck', 'bewerbungstrainer'); ?></h4>
                    <p><?php echo esc_html($feedback['summary']); ?></p>
                </div>
            <?php endif; ?>

            <?php if (isset($feedback['rating'])) : ?>
                <div class="bewerbungstrainer-feedback-ratings">
                    <h4><?php esc_html_e('Bewertungen', 'bewerbungstrainer'); ?></h4>
                    <div class="bewerbungstrainer-ratings-grid">
                        <?php foreach ($feedback['rating'] as $category => $rating) : ?>
                            <div class="bewerbungstrainer-rating-item">
                                <span class="rating-label"><?php echo esc_html(ucfirst($category)); ?></span>
                                <span class="rating-value"><?php echo esc_html($rating); ?>/10</span>
                            </div>
                        <?php endforeach; ?>
                    </div>
                </div>
            <?php endif; ?>

            <?php if (isset($feedback['strengths']) && !empty($feedback['strengths'])) : ?>
                <div class="bewerbungstrainer-feedback-strengths">
                    <h4><?php esc_html_e('Stärken', 'bewerbungstrainer'); ?></h4>
                    <ul>
                        <?php foreach ($feedback['strengths'] as $strength) : ?>
                            <li><?php echo esc_html($strength); ?></li>
                        <?php endforeach; ?>
                    </ul>
                </div>
            <?php endif; ?>

            <?php if (isset($feedback['improvements']) && !empty($feedback['improvements'])) : ?>
                <div class="bewerbungstrainer-feedback-improvements">
                    <h4><?php esc_html_e('Verbesserungspotenzial', 'bewerbungstrainer'); ?></h4>
                    <ul>
                        <?php foreach ($feedback['improvements'] as $improvement) : ?>
                            <li><?php echo esc_html($improvement); ?></li>
                        <?php endforeach; ?>
                    </ul>
                </div>
            <?php endif; ?>

            <?php if (isset($feedback['tips']) && !empty($feedback['tips'])) : ?>
                <div class="bewerbungstrainer-feedback-tips">
                    <h4><?php esc_html_e('Tipps', 'bewerbungstrainer'); ?></h4>
                    <ul>
                        <?php foreach ($feedback['tips'] as $tip) : ?>
                            <li><?php echo esc_html($tip); ?></li>
                        <?php endforeach; ?>
                    </ul>
                </div>
            <?php endif; ?>
        </div>
        <?php
    }

    /**
     * Render audio analysis section
     *
     * @param array $audio_analysis Audio analysis data
     */
    private function render_audio_analysis_section($audio_analysis) {
        ?>
        <div class="bewerbungstrainer-audio-analysis-section">
            <h3><?php esc_html_e('Audio-Analyse', 'bewerbungstrainer'); ?></h3>

            <?php if (isset($audio_analysis['summary'])) : ?>
                <div class="bewerbungstrainer-audio-summary">
                    <p><?php echo esc_html($audio_analysis['summary']); ?></p>
                </div>
            <?php endif; ?>

            <div class="bewerbungstrainer-audio-metrics">
                <?php
                $metrics = array('clarity', 'pace', 'confidence', 'tonalModulation');
                foreach ($metrics as $metric) :
                    if (isset($audio_analysis[$metric])) :
                ?>
                    <div class="bewerbungstrainer-audio-metric">
                        <span class="metric-label"><?php echo esc_html(ucfirst($metric)); ?></span>
                        <span class="metric-rating"><?php echo esc_html($audio_analysis[$metric]['rating']); ?>/10</span>
                    </div>
                <?php
                    endif;
                endforeach;
                ?>
            </div>
        </div>
        <?php
    }

    /**
     * Documents shortcode
     *
     * Usage: [bewerbungstrainer_dokumente]
     */
    public function documents_shortcode($atts) {
        // Check if user is logged in
        if (!is_user_logged_in()) {
            return $this->render_login_message();
        }

        // Get database instance
        $db = Bewerbungstrainer_Database::get_instance();

        // Get documents
        $documents = $db->get_user_documents(get_current_user_id(), array(
            'limit' => 100,
            'orderby' => 'created_at',
            'order' => 'DESC',
        ));

        // Enqueue styles
        $this->enqueue_documents_assets();

        // Render documents view
        ob_start();
        ?>
        <div class="bewerbungstrainer-documents-container">
            <div class="bewerbungstrainer-documents-header">
                <h2><?php esc_html_e('Dokumenten-Bewertung', 'bewerbungstrainer'); ?></h2>
                <p><?php esc_html_e('Lade deinen Lebenslauf oder dein Anschreiben hoch und erhalte professionelles Feedback.', 'bewerbungstrainer'); ?></p>
            </div>

            <!-- Upload Section -->
            <div class="bewerbungstrainer-upload-section">
                <div class="bewerbungstrainer-upload-box">
                    <div class="bewerbungstrainer-upload-icon">
                        <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                        </svg>
                    </div>
                    <h3><?php esc_html_e('Dokument hochladen', 'bewerbungstrainer'); ?></h3>
                    <p><?php esc_html_e('Nur PDF-Dateien, max. 10MB', 'bewerbungstrainer'); ?></p>

                    <form id="bewerbungstrainer-document-upload-form" enctype="multipart/form-data">
                        <div class="bewerbungstrainer-upload-type">
                            <label>
                                <input type="radio" name="document_type" value="cv" checked>
                                <span><?php esc_html_e('Lebenslauf', 'bewerbungstrainer'); ?></span>
                            </label>
                            <label>
                                <input type="radio" name="document_type" value="cover_letter">
                                <span><?php esc_html_e('Anschreiben', 'bewerbungstrainer'); ?></span>
                            </label>
                        </div>

                        <div class="bewerbungstrainer-file-input-wrapper">
                            <input type="file" id="bewerbungstrainer-file-input" name="file" accept=".pdf" required>
                            <label for="bewerbungstrainer-file-input" class="bewerbungstrainer-btn bewerbungstrainer-btn-primary">
                                <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clip-rule="evenodd"></path>
                                </svg>
                                <?php esc_html_e('Datei auswählen', 'bewerbungstrainer'); ?>
                            </label>
                            <span class="bewerbungstrainer-file-name"><?php esc_html_e('Keine Datei ausgewählt', 'bewerbungstrainer'); ?></span>
                        </div>

                        <button type="submit" class="bewerbungstrainer-btn bewerbungstrainer-btn-success bewerbungstrainer-submit-upload">
                            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                            </svg>
                            <?php esc_html_e('Hochladen und analysieren', 'bewerbungstrainer'); ?>
                        </button>

                        <div class="bewerbungstrainer-upload-status" style="display: none;"></div>
                    </form>
                </div>
            </div>

            <!-- Documents List -->
            <?php if (!empty($documents)) : ?>
                <div class="bewerbungstrainer-documents-list">
                    <h3><?php esc_html_e('Meine Dokumente', 'bewerbungstrainer'); ?></h3>
                    <div class="bewerbungstrainer-documents-grid">
                        <?php foreach ($documents as $document) : ?>
                            <?php $this->render_document_card($document); ?>
                        <?php endforeach; ?>
                    </div>
                </div>
            <?php endif; ?>
        </div>
        <?php
        return ob_get_clean();
    }

    /**
     * Render single document card
     *
     * @param object $document Document object
     */
    private function render_document_card($document) {
        $feedback = $document->feedback_json ? json_decode($document->feedback_json, true) : null;
        $date = new DateTime($document->created_at);
        $formatted_date = $date->format('d.m.Y H:i');

        $type_label = $document->document_type === 'cv' ? __('Lebenslauf', 'bewerbungstrainer') : __('Anschreiben', 'bewerbungstrainer');
        ?>
        <div class="bewerbungstrainer-document-card">
            <div class="bewerbungstrainer-document-header">
                <div class="bewerbungstrainer-document-type">
                    <?php echo esc_html($type_label); ?>
                </div>
                <?php if ($document->overall_rating) : ?>
                    <div class="bewerbungstrainer-document-rating">
                        <span class="rating-value"><?php echo esc_html(number_format($document->overall_rating, 1)); ?>/10</span>
                    </div>
                <?php endif; ?>
            </div>

            <div class="bewerbungstrainer-document-body">
                <h4><?php echo esc_html($document->filename); ?></h4>
                <p class="bewerbungstrainer-document-date"><?php echo esc_html($formatted_date); ?></p>

                <?php if ($feedback && isset($feedback['summary'])) : ?>
                    <div class="bewerbungstrainer-document-summary">
                        <?php echo esc_html(wp_trim_words($feedback['summary'], 15)); ?>
                    </div>
                <?php endif; ?>
            </div>

            <div class="bewerbungstrainer-document-footer">
                <?php if ($feedback) : ?>
                    <button
                        class="bewerbungstrainer-btn bewerbungstrainer-btn-primary bewerbungstrainer-view-document-details"
                        onclick="bewerbungstrainerViewDocumentDetails(<?php echo esc_attr($document->id); ?>)"
                    >
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path>
                            <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"></path>
                        </svg>
                        <?php esc_html_e('Feedback ansehen', 'bewerbungstrainer'); ?>
                    </button>
                <?php else : ?>
                    <span class="bewerbungstrainer-processing-badge"><?php esc_html_e('Wird verarbeitet...', 'bewerbungstrainer'); ?></span>
                <?php endif; ?>
            </div>
        </div>

        <!-- Details Modal -->
        <?php if ($feedback) : ?>
        <div id="bewerbungstrainer-document-modal-<?php echo esc_attr($document->id); ?>" class="bewerbungstrainer-modal" style="display: none;">
            <div class="bewerbungstrainer-modal-overlay" onclick="bewerbungstrainerCloseDocumentModal(<?php echo esc_attr($document->id); ?>)"></div>
            <div class="bewerbungstrainer-modal-content">
                <button class="bewerbungstrainer-modal-close" onclick="bewerbungstrainerCloseDocumentModal(<?php echo esc_attr($document->id); ?>)">
                    <svg width="24" height="24" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                    </svg>
                </button>

                <div class="bewerbungstrainer-modal-header">
                    <h2><?php echo esc_html($type_label); ?> - Feedback</h2>
                    <p class="bewerbungstrainer-modal-date"><?php echo esc_html($formatted_date); ?></p>
                </div>

                <div class="bewerbungstrainer-modal-body">
                    <?php $this->render_document_feedback($feedback); ?>
                </div>
            </div>
        </div>
        <?php endif; ?>
        <?php
    }

    /**
     * Render document feedback
     *
     * @param array $feedback Feedback data
     */
    private function render_document_feedback($feedback) {
        ?>
        <div class="bewerbungstrainer-document-feedback">
            <?php if (isset($feedback['overall_rating'])) : ?>
                <div class="bewerbungstrainer-rating-box">
                    <h3><?php esc_html_e('Gesamtbewertung', 'bewerbungstrainer'); ?></h3>
                    <div class="rating-value-large"><?php echo esc_html(number_format($feedback['overall_rating'], 1)); ?>/10</div>
                </div>
            <?php endif; ?>

            <?php if (isset($feedback['summary'])) : ?>
                <div class="bewerbungstrainer-feedback-summary">
                    <h4><?php esc_html_e('Zusammenfassung', 'bewerbungstrainer'); ?></h4>
                    <p><?php echo esc_html($feedback['summary']); ?></p>
                </div>
            <?php endif; ?>

            <?php if (isset($feedback['ratings']) && !empty($feedback['ratings'])) : ?>
                <div class="bewerbungstrainer-feedback-ratings">
                    <h4><?php esc_html_e('Detailbewertungen', 'bewerbungstrainer'); ?></h4>
                    <div class="bewerbungstrainer-ratings-grid">
                        <?php foreach ($feedback['ratings'] as $category => $rating) : ?>
                            <div class="bewerbungstrainer-rating-item">
                                <span class="rating-label"><?php echo esc_html(ucfirst($category)); ?></span>
                                <span class="rating-value"><?php echo esc_html($rating); ?>/10</span>
                            </div>
                        <?php endforeach; ?>
                    </div>
                </div>
            <?php endif; ?>

            <?php if (isset($feedback['strengths']) && !empty($feedback['strengths'])) : ?>
                <div class="bewerbungstrainer-feedback-strengths">
                    <h4><?php esc_html_e('Stärken', 'bewerbungstrainer'); ?></h4>
                    <ul>
                        <?php foreach ($feedback['strengths'] as $strength) : ?>
                            <li><?php echo esc_html($strength); ?></li>
                        <?php endforeach; ?>
                    </ul>
                </div>
            <?php endif; ?>

            <?php if (isset($feedback['improvements']) && !empty($feedback['improvements'])) : ?>
                <div class="bewerbungstrainer-feedback-improvements">
                    <h4><?php esc_html_e('Verbesserungspotenzial', 'bewerbungstrainer'); ?></h4>
                    <ul>
                        <?php foreach ($feedback['improvements'] as $improvement) : ?>
                            <li><?php echo esc_html($improvement); ?></li>
                        <?php endforeach; ?>
                    </ul>
                </div>
            <?php endif; ?>

            <?php if (isset($feedback['recommendations']) && !empty($feedback['recommendations'])) : ?>
                <div class="bewerbungstrainer-feedback-tips">
                    <h4><?php esc_html_e('Handlungsempfehlungen', 'bewerbungstrainer'); ?></h4>
                    <ul>
                        <?php foreach ($feedback['recommendations'] as $recommendation) : ?>
                            <li><?php echo esc_html($recommendation); ?></li>
                        <?php endforeach; ?>
                    </ul>
                </div>
            <?php endif; ?>
        </div>
        <?php
    }

    /**
     * Render login message
     */
    private function render_login_message() {
        ob_start();
        ?>
        <div class="bewerbungstrainer-login-required">
            <div class="bewerbungstrainer-login-icon">
                <svg width="48" height="48" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"></path>
                </svg>
            </div>
            <h3><?php esc_html_e('Anmeldung erforderlich', 'bewerbungstrainer'); ?></h3>
            <p><?php esc_html_e('Bitte melde dich an, um den Bewerbungstrainer zu nutzen.', 'bewerbungstrainer'); ?></p>
            <a href="<?php echo esc_url(wp_login_url(get_permalink())); ?>" class="bewerbungstrainer-btn bewerbungstrainer-btn-primary">
                <?php esc_html_e('Jetzt anmelden', 'bewerbungstrainer'); ?>
            </a>
        </div>
        <?php
        return ob_get_clean();
    }

    /**
     * Enqueue assets for interview shortcode
     */
    private function enqueue_interview_assets() {
        // React app will be enqueued by main plugin class
        // Add custom styles for shortcode wrapper - override theme container styles
        wp_add_inline_style('bewerbungstrainer-app', '
            /* Override theme container restrictions */
            .bewerbungstrainer-interview-container {
                width: 100% !important;
                max-width: none !important;
                margin: 0 !important;
                padding: 0 !important;
                box-sizing: border-box !important;
            }

            /* Ensure the React app takes full width */
            #bewerbungstrainer-app {
                width: 100% !important;
                max-width: none !important;
                margin: 0 !important;
            }

            /* Override Elementor/theme container constraints */
            .elementor-widget-container:has(#bewerbungstrainer-app),
            .elementor-element:has(#bewerbungstrainer-app),
            .e-con:has(#bewerbungstrainer-app),
            .entry-content:has(#bewerbungstrainer-app),
            .page-content:has(#bewerbungstrainer-app),
            article:has(#bewerbungstrainer-app) {
                width: 100% !important;
                max-width: none !important;
                padding-left: 0 !important;
                padding-right: 0 !important;
            }

            /* Hello Elementor specific overrides */
            .site-main:has(#bewerbungstrainer-app) {
                padding: 0 !important;
                max-width: none !important;
            }

            /* Session layout specific overrides */
            .bewerbungstrainer-session-layout {
                display: block !important;
                width: 100% !important;
            }

            .bewerbungstrainer-session-layout > div {
                display: flex !important;
            }

            @media (min-width: 1024px) {
                .bewerbungstrainer-session-layout > div {
                    display: grid !important;
                }
            }

            /* Ensure grid children are visible */
            #bewerbungstrainer-app * {
                box-sizing: border-box;
            }

            .bewerbungstrainer-loading {
                text-align: center;
                padding: 60px 20px;
            }
            .bewerbungstrainer-loading .spinner {
                width: 50px;
                height: 50px;
                margin: 0 auto 20px;
                border: 4px solid #f3f3f3;
                border-top: 4px solid #3498db;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        ');
    }

    /**
     * Enqueue assets for exercises shortcode
     */
    private function enqueue_exercises_assets() {
        wp_enqueue_style(
            'bewerbungstrainer-exercises',
            BEWERBUNGSTRAINER_PLUGIN_URL . 'assets/css/exercises.css',
            array(),
            BEWERBUNGSTRAINER_VERSION
        );

        wp_enqueue_script(
            'bewerbungstrainer-exercises',
            BEWERBUNGSTRAINER_PLUGIN_URL . 'assets/js/exercises.js',
            array('jquery'),
            BEWERBUNGSTRAINER_VERSION,
            true
        );
    }

    /**
     * Enqueue assets for documents shortcode
     */
    private function enqueue_documents_assets() {
        wp_enqueue_style(
            'bewerbungstrainer-documents',
            BEWERBUNGSTRAINER_PLUGIN_URL . 'assets/css/documents.css',
            array(),
            BEWERBUNGSTRAINER_VERSION
        );

        wp_enqueue_script(
            'bewerbungstrainer-documents',
            BEWERBUNGSTRAINER_PLUGIN_URL . 'assets/js/documents.js',
            array('jquery'),
            BEWERBUNGSTRAINER_VERSION,
            true
        );

        // Pass config to JavaScript
        wp_localize_script('bewerbungstrainer-documents', 'bewerbungstrainerDocuments', array(
            'apiUrl' => rest_url('bewerbungstrainer/v1'),
            'nonce' => wp_create_nonce('wp_rest'),
        ));
    }

    /**
     * Enqueue assets for video training shortcode
     */
    private function enqueue_video_training_assets() {
        // Only enqueue once per page load
        static $enqueued = false;
        if ($enqueued) {
            return;
        }
        $enqueued = true;

        // Enqueue main CSS
        wp_enqueue_style(
            'bewerbungstrainer-video-training',
            BEWERBUNGSTRAINER_PLUGIN_URL . 'dist/assets/wordpress-api.css',
            array(),
            BEWERBUNGSTRAINER_VERSION
        );

        // Find and register the shared chunk file (wordpress-api-*.js)
        $assets_dir = BEWERBUNGSTRAINER_PLUGIN_DIR . 'dist/assets/';
        $shared_chunk = null;
        if (is_dir($assets_dir)) {
            $files = glob($assets_dir . 'wordpress-api-*.js');
            if (!empty($files)) {
                $shared_chunk = basename($files[0]);
            }
        }

        // If shared chunk exists, register it first
        if ($shared_chunk) {
            wp_register_script(
                'bewerbungstrainer-wordpress-api-chunk',
                BEWERBUNGSTRAINER_PLUGIN_URL . 'dist/assets/' . $shared_chunk,
                array(),
                BEWERBUNGSTRAINER_VERSION,
                true
            );
        }

        // Register and enqueue video training React app as ES module
        wp_register_script(
            'bewerbungstrainer-video-training',
            BEWERBUNGSTRAINER_PLUGIN_URL . 'dist/assets/video-training.js',
            $shared_chunk ? array('bewerbungstrainer-wordpress-api-chunk') : array(), // Depend on shared chunk if it exists
            BEWERBUNGSTRAINER_VERSION,
            true
        );

        // Add type="module" attribute to script tags
        add_filter('script_loader_tag', array($this, 'add_module_type_to_video_training_script'), 10, 3);

        // Enqueue shared chunk first if it exists
        if ($shared_chunk) {
            wp_enqueue_script('bewerbungstrainer-wordpress-api-chunk');
        }

        wp_enqueue_script('bewerbungstrainer-video-training');

        // Add custom styles for shortcode wrapper
        wp_add_inline_style('bewerbungstrainer-video-training', '
            .bewerbungstrainer-video-training-container {
                width: 100%;
                margin: 0 auto;
            }
            .bewerbungstrainer-loading {
                text-align: center;
                padding: 60px 20px;
            }
            .bewerbungstrainer-loading .spinner {
                width: 50px;
                height: 50px;
                margin: 0 auto 20px;
                border: 4px solid #f3f3f3;
                border-top: 4px solid #3498db;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        ');
    }

    /**
     * Add type="module" attribute to video training script
     *
     * @param string $tag Script tag
     * @param string $handle Script handle
     * @param string $src Script source
     * @return string Modified script tag
     */
    public function add_module_type_to_video_training_script($tag, $handle, $src) {
        if ($handle === 'bewerbungstrainer-video-training' || $handle === 'bewerbungstrainer-wordpress-api-chunk') {
            // Replace the opening <script tag to add type="module"
            // This preserves any inline scripts WordPress adds
            $tag = str_replace('<script ', '<script type="module" ', $tag);
        }
        return $tag;
    }
}
