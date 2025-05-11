<?php
/**
 * Laapak Report System - API Test Script
 * 
 * This script tests the API endpoints to ensure they're working correctly
 * with the database.
 */

// Set error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Base URL for API
$baseUrl = 'http://127.0.0.1:8000/api';

// Test endpoints
$endpoints = [
    'health' => [
        'method' => 'GET',
        'url' => '/health',
        'data' => null,
        'description' => 'Health check endpoint'
    ],
    'admin_login' => [
        'method' => 'POST',
        'url' => '/auth/admin',
        'data' => [
            'username' => 'admin',
            'password' => 'admin123'
        ],
        'description' => 'Admin login endpoint'
    ],
    'client_login' => [
        'method' => 'POST',
        'url' => '/auth/client',
        'data' => [
            'phone' => '1234567890',
            'orderCode' => '123456'
        ],
        'description' => 'Client login endpoint'
    ]
];

// Function to make API requests
function makeRequest($method, $url, $data = null) {
    $curl = curl_init();
    
    $options = [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_ENCODING => '',
        CURLOPT_MAXREDIRS => 10,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Accept: application/json'
        ],
    ];
    
    if ($data !== null && ($method === 'POST' || $method === 'PUT')) {
        $options[CURLOPT_POSTFIELDS] = json_encode($data);
    }
    
    curl_setopt_array($curl, $options);
    
    $response = curl_exec($curl);
    $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    $error = curl_error($curl);
    
    curl_close($curl);
    
    // For debugging
    if ($response) {
        $decodedResponse = json_decode($response, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            echo "JSON Decode Error: " . json_last_error_msg() . "\n";
            echo "Raw Response: " . $response . "\n";
            $decodedResponse = null;
        }
    } else {
        $decodedResponse = null;
    }
    
    return [
        'status_code' => $httpCode,
        'response' => $decodedResponse,
        'raw_response' => $response,
        'error' => $error
    ];
}

// Run tests
echo "=== Laapak Report System API Tests ===\n\n";

$adminToken = null;
$clientToken = null;

foreach ($endpoints as $name => $endpoint) {
    echo "Testing {$endpoint['description']} ({$endpoint['method']} {$endpoint['url']})...\n";
    
    $url = $baseUrl . $endpoint['url'];
    $result = makeRequest($endpoint['method'], $url, $endpoint['data']);
    
    echo "Status Code: {$result['status_code']}\n";
    
    if ($result['error']) {
        echo "Error: {$result['error']}\n";
    } else {
        if ($result['response'] === null) {
            echo "Raw Response: {$result['raw_response']}\n";
        } else {
            echo "Response: " . json_encode($result['response'], JSON_PRETTY_PRINT) . "\n";
            
            // Save tokens if available
            if ($name === 'admin_login' && isset($result['response']['token'])) {
                $adminToken = $result['response']['token'];
                echo "Admin token saved.\n";
            } elseif ($name === 'client_login' && isset($result['response']['token'])) {
                $clientToken = $result['response']['token'];
                echo "Client token saved.\n";
            }
        }
    }
    
    echo "\n";
}

// Test protected endpoints if we have tokens
if ($adminToken) {
    echo "=== Testing Protected Admin Endpoints ===\n\n";
    
    $protectedEndpoints = [
        'admin_verify' => [
            'method' => 'GET',
            'url' => '/auth/verify',
            'data' => null,
            'description' => 'Verify admin token',
            'token' => $adminToken
        ],
        'admin_reports' => [
            'method' => 'GET',
            'url' => '/admin/reports',
            'data' => null,
            'description' => 'Get all reports (admin)',
            'token' => $adminToken
        ]
    ];
    
    foreach ($protectedEndpoints as $name => $endpoint) {
        echo "Testing {$endpoint['description']} ({$endpoint['method']} {$endpoint['url']})...\n";
        
        $url = $baseUrl . $endpoint['url'];
        $curl = curl_init();
        
        $options = [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_ENCODING => '',
            CURLOPT_MAXREDIRS => 10,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_CUSTOMREQUEST => $endpoint['method'],
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Accept: application/json',
                'Authorization: Bearer ' . $endpoint['token']
            ],
        ];
        
        if ($endpoint['data'] !== null && ($endpoint['method'] === 'POST' || $endpoint['method'] === 'PUT')) {
            $options[CURLOPT_POSTFIELDS] = json_encode($endpoint['data']);
        }
        
        curl_setopt_array($curl, $options);
        
        $response = curl_exec($curl);
        $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        $error = curl_error($curl);
        
        curl_close($curl);
        
        echo "Status Code: {$httpCode}\n";
        
        if ($error) {
            echo "Error: {$error}\n";
        } else {
            echo "Response: " . json_encode(json_decode($response, true), JSON_PRETTY_PRINT) . "\n";
        }
        
        echo "\n";
    }
}

if ($clientToken) {
    echo "=== Testing Protected Client Endpoints ===\n\n";
    
    $protectedEndpoints = [
        'client_verify' => [
            'method' => 'GET',
            'url' => '/auth/verify',
            'data' => null,
            'description' => 'Verify client token',
            'token' => $clientToken
        ],
        'client_profile' => [
            'method' => 'GET',
            'url' => '/client/profile',
            'data' => null,
            'description' => 'Get client profile',
            'token' => $clientToken
        ],
        'client_reports' => [
            'method' => 'GET',
            'url' => '/client/reports',
            'data' => null,
            'description' => 'Get client reports',
            'token' => $clientToken
        ]
    ];
    
    foreach ($protectedEndpoints as $name => $endpoint) {
        echo "Testing {$endpoint['description']} ({$endpoint['method']} {$endpoint['url']})...\n";
        
        $url = $baseUrl . $endpoint['url'];
        $curl = curl_init();
        
        $options = [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_ENCODING => '',
            CURLOPT_MAXREDIRS => 10,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_CUSTOMREQUEST => $endpoint['method'],
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Accept: application/json',
                'Authorization: Bearer ' . $endpoint['token']
            ],
        ];
        
        if ($endpoint['data'] !== null && ($endpoint['method'] === 'POST' || $endpoint['method'] === 'PUT')) {
            $options[CURLOPT_POSTFIELDS] = json_encode($endpoint['data']);
        }
        
        curl_setopt_array($curl, $options);
        
        $response = curl_exec($curl);
        $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        $error = curl_error($curl);
        
        curl_close($curl);
        
        echo "Status Code: {$httpCode}\n";
        
        if ($error) {
            echo "Error: {$error}\n";
        } else {
            echo "Response: " . json_encode(json_decode($response, true), JSON_PRETTY_PRINT) . "\n";
        }
        
        echo "\n";
    }
}

echo "=== Tests Completed ===\n";
