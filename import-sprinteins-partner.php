<?php
/**
 * Import Script for SprintEins Partner
 *
 * Run this script once via WP-CLI or include it temporarily:
 * wp eval-file import-sprinteins-partner.php
 *
 * Or add to functions.php temporarily and visit any page, then remove it.
 */

// Exit if accessed directly without WordPress
if (!defined('ABSPATH')) {
    // If running via WP-CLI, ABSPATH will be defined
    exit('This script must be run within WordPress context.');
}

/**
 * Create SprintEins partner
 */
function import_sprinteins_partner() {
    // Check if partner already exists
    $existing = get_posts(array(
        'post_type' => 'whitelabel_partner',
        'meta_key' => '_partner_slug',
        'meta_value' => 'sprinteins',
        'posts_per_page' => 1,
    ));

    if (!empty($existing)) {
        return array(
            'success' => false,
            'message' => 'Partner "sprinteins" existiert bereits (ID: ' . $existing[0]->ID . ')',
        );
    }

    // SprintEins Branding based on screenshot
    // Primary color: Coral/Pink from "JOBS" button and "CASES" link
    $primary_color = '#F0506E';
    $primary_color_hover = '#D94460';
    $primary_color_light = '#FEF2F4';

    $branding = array(
        // App background - clean white
        '--app-bg-color' => 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',

        // Sidebar - white with dark text
        '--sidebar-bg-color' => '#ffffff',
        '--sidebar-text-color' => '#1a1a1a',
        '--sidebar-text-muted' => '#6b7280',
        '--sidebar-active-bg' => $primary_color_light,
        '--sidebar-active-text' => $primary_color,
        '--sidebar-hover-bg' => '#f9fafb',

        // Cards
        '--card-bg-color' => '#ffffff',

        // Primary accent - SprintEins Coral/Pink
        '--primary-accent' => $primary_color,
        '--primary-accent-light' => $primary_color_light,
        '--primary-accent-hover' => $primary_color_hover,

        // Buttons - solid coral style matching their brand
        '--button-gradient' => $primary_color,
        '--button-gradient-hover' => $primary_color_hover,
        '--button-solid' => $primary_color,
        '--button-solid-hover' => $primary_color_hover,
        '--button-text' => '#ffffff',

        // Header - coral gradient
        '--header-gradient' => 'linear-gradient(135deg, ' . $primary_color . ' 0%, #E8446A 100%)',
        '--header-text' => '#ffffff',

        // Icons
        '--icon-primary' => $primary_color,
        '--icon-secondary' => '#E8446A',
        '--icon-muted' => '#9ca3af',

        // Text - dark for readability
        '--text-main' => '#1a1a1a',
        '--text-secondary' => '#4b5563',
        '--text-muted' => '#9ca3af',

        // Borders - subtle gray
        '--border-color' => '#e5e7eb',
        '--border-color-light' => '#f3f4f6',

        // Focus ring
        '--focus-ring' => 'rgba(240, 80, 110, 0.3)',
    );

    // Create the partner post
    $post_id = wp_insert_post(array(
        'post_type' => 'whitelabel_partner',
        'post_title' => 'SprintEins',
        'post_status' => 'publish',
        'post_name' => 'sprinteins',
    ));

    if (is_wp_error($post_id)) {
        return array(
            'success' => false,
            'message' => 'Fehler beim Erstellen: ' . $post_id->get_error_message(),
        );
    }

    // Save meta data
    update_post_meta($post_id, '_partner_slug', 'sprinteins');
    update_post_meta($post_id, '_partner_branding', $branding);

    // Enable all modules
    update_post_meta($post_id, '_partner_visible_modules', array(
        'dashboard',
        'roleplay',
        'simulator',
        'video_training',
        'gym',
        'history',
        'smart_briefing',
    ));

    return array(
        'success' => true,
        'message' => 'Partner "SprintEins" erfolgreich erstellt (ID: ' . $post_id . ')',
        'post_id' => $post_id,
        'slug' => 'sprinteins',
        'url' => '?partner=sprinteins',
    );
}

// Run the import
$result = import_sprinteins_partner();

if (defined('WP_CLI') && WP_CLI) {
    if ($result['success']) {
        WP_CLI::success($result['message']);
        WP_CLI::log('URL: ' . site_url() . '?partner=' . $result['slug']);
    } else {
        WP_CLI::warning($result['message']);
    }
} else {
    // Output for browser
    echo '<pre>';
    print_r($result);
    echo '</pre>';
}
