<?php
/**
 * Plugin Name: FAQ Chatbot
 * Description: A chatbot UI built with HTML,Tailwind CSS, and Javascript (OOP).
 * Version: 1.0
 * Author: Belle
 */

// Exit if accessed directly.
if (!defined('ABSPATH')) {
    exit;
}

// Enqueue the JavaScript file and localize script data.
function chatbot_enqueue_assets() {
    wp_enqueue_script(
        'chatbot-main',
        plugins_url('main.js', __FILE__),
        array('jquery'), // Add jQuery as a dependency for AJAX
        '1.0',
        true
    );

    // Pass data to the JavaScript file
    wp_localize_script('chatbot-main', 'chatbot_data', array(
        'ajax_url' => admin_url('admin-ajax.php'),
        'nonce'    => wp_create_nonce('chatbot_nonce')
    ));
}
add_action('wp_enqueue_scripts', 'chatbot_enqueue_assets');

// Render the chatbot's root HTML element and the Tailwind CSS CDN.
function chatbot_render_ui() {
    echo '<div id="app"></div>';
    echo '<script src="https://cdn.tailwindcss.com"></script>';
}
add_action('wp_footer', 'chatbot_render_ui');

// Custom AJAX handler for the chatbot
function chatbot_handle_request() {
    // Check for nonce security.
    check_ajax_referer('chatbot_nonce', 'nonce');

    // Sanitize the message.
    $message = sanitize_text_field($_POST['message']);

    // Define the URL for your n8n webhook.
    $n8n_webhook_url = 'http://localhost:5678/webhook/4091fa09-fb9a-4039-9411-7104d213f601/chat';

    // Forward the message to your n8n webhook.
    $response = wp_remote_post($n8n_webhook_url, array(
        'body' => json_encode(array('message' => $message)),
        'headers' => array('Content-Type' => 'application/json'),
    ));

    // Get the body of the response from n8n.
    $body = wp_remote_retrieve_body($response);
    echo $body;

    wp_die(); // This is required to terminate the AJAX request properly.
}
add_action('wp_ajax_chatbot_request', 'chatbot_handle_request'); // For logged-in users
add_action('wp_ajax_nopriv_chatbot_request', 'chatbot_handle_request'); // For non-logged-in users