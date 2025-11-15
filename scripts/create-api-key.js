#!/usr/bin/env node

/**
 * Script to create API keys for third-party integrations
 * Usage: node scripts/create-api-key.js
 */

const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

async function createApiKey() {
    try {
        console.log('🔐 Creating API key for third-party integration...\n');

        // Step 1: Login as admin
        console.log('1. Authenticating as admin...');
        const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
            username: ADMIN_USERNAME,
            password: ADMIN_PASSWORD
        });

        const { token } = loginResponse.data;
        console.log('✅ Admin authentication successful\n');

        // Step 2: Create API key
        console.log('2. Creating API key...');
        const apiKeyData = {
            key_name: 'Third Party Integration Key',
            client_id: null, // null for system-wide access
            permissions: {
                reports: {
                    read: true,
                    write: false,
                    delete: false
                },
                invoices: {
                    read: true,
                    write: false,
                    delete: false
                },
                clients: {
                    read: true,
                    write: false,
                    delete: false
                },
                financial: {
                    read: false,
                    write: false,
                    delete: false
                }
            },
            rate_limit: 1000,
            expires_at: '2024-12-31T23:59:59Z',
            ip_whitelist: '', // Leave empty for no IP restrictions
            description: 'API key for third-party integration'
        };

        const apiKeyResponse = await axios.post(`${API_BASE_URL}/api/admin/api-keys`, apiKeyData, {
            headers: {
                'x-auth-token': token,
                'Content-Type': 'application/json'
            }
        });

        const { apiKey } = apiKeyResponse.data;
        
        console.log('✅ API key created successfully!\n');
        console.log('📋 API Key Details:');
        console.log('==================');
        console.log(`ID: ${apiKey.id}`);
        console.log(`Name: ${apiKey.key_name}`);
        console.log(`API Key: ${apiKey.api_key}`);
        console.log(`Rate Limit: ${apiKey.rate_limit} requests/hour`);
        console.log(`Expires: ${apiKey.expires_at}`);
        console.log(`Permissions: ${JSON.stringify(apiKey.permissions, null, 2)}`);
        console.log(`Created: ${apiKey.created_at}`);
        
        console.log('\n🔒 Security Notes:');
        console.log('==================');
        console.log('• Store this API key securely');
        console.log('• Never expose it in client-side code');
        console.log('• Use HTTPS for all API requests');
        console.log('• Monitor usage through admin dashboard');
        
        console.log('\n📖 Usage Example:');
        console.log('==================');
        console.log(`curl -X GET "${API_BASE_URL}/api/v2/external/health" \\`);
        console.log(`  -H "x-api-key: ${apiKey.api_key}"`);

        return apiKey;

    } catch (error) {
        console.error('❌ Error creating API key:', error.response?.data || error.message);
        process.exit(1);
    }
}

// Run the script
if (require.main === module) {
    createApiKey();
}

module.exports = { createApiKey };
