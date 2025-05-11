<?php
/**
 * Simple API Test Script for Laapak Report System
 */

// Set error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Base URL for API
$baseUrl = 'http://127.0.0.1:8000/api';

// Test the health endpoint
echo "Testing health endpoint...\n";
$response = file_get_contents($baseUrl . '/health');
echo "Response: " . $response . "\n\n";

// Test admin login
echo "Testing admin login...\n";
$data = json_encode([
    'username' => 'admin',
    'password' => 'admin123'
]);

$options = [
    'http' => [
        'method' => 'POST',
        'header' => [
            'Content-Type: application/json',
            'Accept: application/json'
        ],
        'content' => $data
    ]
];

$context = stream_context_create($options);
$response = file_get_contents($baseUrl . '/auth/admin', false, $context);
echo "Response: " . $response . "\n\n";

// Parse the response to get the token
$responseData = json_decode($response, true);
$adminToken = $responseData['token'] ?? null;

if ($adminToken) {
    echo "Admin token received: " . substr($adminToken, 0, 20) . "...\n\n";
    
    // Test getting reports with the admin token
    echo "Testing get reports with admin token...\n";
    $options = [
        'http' => [
            'method' => 'GET',
            'header' => [
                'Authorization: Bearer ' . $adminToken,
                'Accept: application/json'
            ]
        ]
    ];
    
    $context = stream_context_create($options);
    $response = file_get_contents($baseUrl . '/admin/reports', false, $context);
    echo "Response: " . $response . "\n\n";
}

// Test client login
echo "Testing client login...\n";
$data = json_encode([
    'phone' => '1234567890',
    'orderCode' => '123456'
]);

$options = [
    'http' => [
        'method' => 'POST',
        'header' => [
            'Content-Type: application/json',
            'Accept: application/json'
        ],
        'content' => $data
    ]
];

$context = stream_context_create($options);
try {
    $response = file_get_contents($baseUrl . '/auth/client', false, $context);
    echo "Response: " . $response . "\n\n";
    
    // Parse the response to get the token
    $responseData = json_decode($response, true);
    $clientToken = $responseData['token'] ?? null;
    
    if ($clientToken) {
        echo "Client token received: " . substr($clientToken, 0, 20) . "...\n\n";
        
        // Test getting client profile with the client token
        echo "Testing get client profile with client token...\n";
        $options = [
            'http' => [
                'method' => 'GET',
                'header' => [
                    'Authorization: Bearer ' . $clientToken,
                    'Accept: application/json'
                ]
            ]
        ];
        
        $context = stream_context_create($options);
        $response = file_get_contents($baseUrl . '/client/profile', false, $context);
        echo "Response: " . $response . "\n\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n\n";
}

echo "Tests completed.\n";
