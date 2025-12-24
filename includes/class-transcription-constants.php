<?php
/**
 * Centralized Transcription Constants
 *
 * Provides shared transcription constants for all Gemini-based audio analysis.
 * Mirrors the JavaScript constants in src/config/prompts/transcriptionCore.js
 *
 * Used by:
 * - class-simulator-api.php (Szenario-Training)
 * - class-game-api.php (Rhetorik-Gym)
 *
 * @package Bewerbungstrainer
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Class Bewerbungstrainer_Transcription_Constants
 *
 * Centralized constants for transcription across the plugin.
 */
class Bewerbungstrainer_Transcription_Constants {

    /**
     * Standard message when no speech is detected
     * MUST match the JavaScript constant in transcriptionCore.js
     */
    const NO_SPEECH_DETECTED = '[Keine Sprache erkannt]';

    /**
     * Minimum audio size in bytes to consider as potentially containing speech
     * Anything smaller is likely silence or noise
     * MUST match the JavaScript constant in transcriptionCore.js
     */
    const MIN_AUDIO_SIZE_BYTES = 5000;

    /**
     * Get the anti-hallucination rules for prompts
     * MUST match the JavaScript function getAntiHallucinationRules()
     *
     * @return string The anti-hallucination prompt section
     */
    public static function get_anti_hallucination_rules() {
        $no_speech = self::NO_SPEECH_DETECTED;

        return "ABSOLUTE REGEL - KEINE HALLUZINATION:
Du DARFST NUR transkribieren, was TATSÄCHLICH in der Audio-Datei gesprochen wird.
- Bei Stille, Rauschen, oder unverständlichem Audio: transcript = \"{$no_speech}\"
- Bei nur 1-2 Sekunden Audio ohne klare Sprache: transcript = \"{$no_speech}\"
- ERFINDE NIEMALS Wörter, Sätze oder Inhalte!
- Wenn du unsicher bist, ob etwas gesagt wurde: NICHT transkribieren!
- Wenn jemand nur \"Weiß ich nicht\" oder \"Keine Ahnung\" sagt, transkribiere GENAU DAS
- Eine kurze Antwort wie \"Ich weiß es nicht\" ist eine valide Transkription
- HALLUZINIERE KEINE ausführlichen Antworten wenn der Sprecher das nicht gesagt hat";
    }

    /**
     * Get the standard empty result for simulator mode
     *
     * @return array Empty result structure for simulator
     */
    public static function get_empty_simulator_result() {
        return array(
            'transcript' => self::NO_SPEECH_DETECTED,
            'feedback' => array(
                'summary' => 'Es wurde keine Sprache erkannt. Bitte sprechen Sie deutlich ins Mikrofon.',
                'strengths' => array(),
                'improvements' => array('Bitte versuchen Sie es erneut und sprechen Sie klar und deutlich ins Mikrofon.'),
                'tips' => array('Achten Sie darauf, dass Ihr Mikrofon funktioniert und nicht stummgeschaltet ist.'),
                'scores' => array(
                    'content' => 0,
                    'structure' => 0,
                    'relevance' => 0,
                    'delivery' => 0,
                    'overall' => 0,
                ),
            ),
            'audio_metrics' => array(
                'speech_rate' => 'keine_sprache',
                'filler_words' => array(
                    'count' => 0,
                    'words' => array(),
                    'severity' => 'keine',
                ),
                'confidence_score' => 0,
                'clarity_score' => 0,
                'notes' => 'Keine Sprache erkannt',
            ),
        );
    }

    /**
     * Check if a transcript indicates no speech was detected
     *
     * @param string $transcript The transcript to check
     * @return bool True if no speech was detected
     */
    public static function is_empty_transcript($transcript) {
        if (empty($transcript)) {
            return true;
        }

        $normalized = strtolower(trim($transcript));
        $no_speech_lower = strtolower(self::NO_SPEECH_DETECTED);

        return (
            $normalized === '' ||
            $normalized === $no_speech_lower ||
            strpos($normalized, 'keine sprache erkannt') !== false ||
            strpos($normalized, 'no speech detected') !== false
        );
    }
}
