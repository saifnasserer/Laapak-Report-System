#!/usr/bin/env node

/**
 * Interactive script to create API keys
 * Usage: node scripts/create-api-key-simple.js
 */

const { ApiKey, Admin } = require('../backend/models');
const crypto = require('crypto');
const readline = require('readline');

// Create readline interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Helper function to ask questions
function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, resolve);
    });
}

// Display API key type options
function displayApiKeyTypes() {
    console.log('🔐 Laapak Report System - API Key Creator\n');
    console.log('Choose the type of API key you want to create:\n');
    
    console.log('1️⃣  ADMIN API KEY');
    console.log('==================');
    console.log('🎯 Purpose: Full system access for administrators');
    console.log('🔑 Features:');
    console.log('   • Full read/write/delete permissions on all resources');
    console.log('   • Access to financial data and system management');
    console.log('   • High rate limits (5000+ requests/hour)');
    console.log('   • System-wide access (not client-specific)');
    console.log('   • Long expiration periods');
    console.log('   • IP whitelisting support');
    console.log('   • Usage analytics and monitoring');
    console.log('   • Can create/update/delete other API keys');
    console.log('   • Access to admin management endpoints');
    console.log('   • Full audit logging capabilities');
    console.log('');
    
    console.log('2️⃣  THIRD-PARTY API KEY');
    console.log('=======================');
    console.log('🎯 Purpose: Limited access for external integrations');
    console.log('🔑 Features:');
    console.log('   • Read-only access to client data (reports, invoices)');
    console.log('   • No access to financial or system management data');
    console.log('   • Moderate rate limits (1000-2000 requests/hour)');
    console.log('   • Can be client-specific or system-wide');
    console.log('   • Shorter expiration periods for security');
    console.log('   • IP whitelisting for enhanced security');
    console.log('   • Limited to specific endpoints');
    console.log('   • Cannot modify system settings');
    console.log('   • Perfect for client portals and integrations');
    console.log('   • Bulk operations support');
    console.log('');
}

// Create admin API key
async function createAdminApiKey() {
    try {
        console.log('🔐 Creating ADMIN API key...\n');

        // Generate API key
        const randomBytes = crypto.randomBytes(32);
        const apiKey = 'ak_live_' + randomBytes.toString('hex');
        const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex');

        // Get admin details
        const adminName = await askQuestion('Enter admin name for this key: ');
        const rateLimit = await askQuestion('Enter rate limit (default 5000): ') || '5000';
        const expirationDays = await askQuestion('Enter expiration days (default 365): ') || '365';
        const ipWhitelist = await askQuestion('Enter IP whitelist (comma-separated, or press Enter for no restrictions): ');

        // Calculate expiration date
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + parseInt(expirationDays));

        // Create API key record with admin permissions
        const apiKeyRecord = await ApiKey.create({
            key_name: `Admin Key - ${adminName}`,
            api_key: hashedKey,
            key_prefix: 'ak_live_',
            client_id: null, // System-wide access
            permissions: {
                reports: {
                    read: true,
                    write: true,
                    delete: true
                },
                invoices: {
                    read: true,
                    write: true,
                    delete: true
                },
                clients: {
                    read: true,
                    write: true,
                    delete: true
                },
                financial: {
                    read: true,
                    write: true,
                    delete: true
                },
                admin: {
                    read: true,
                    write: true,
                    delete: true
                }
            },
            rate_limit: parseInt(rateLimit),
            expires_at: expirationDate,
            ip_whitelist: ipWhitelist,
            description: `Admin API key for ${adminName} - Full system access`,
            created_by: 1 // Assuming admin ID 1 exists
        });

        console.log('\n✅ ADMIN API key created successfully!\n');
        console.log('📋 Admin API Key Details:');
        console.log('=========================');
        console.log(`ID: ${apiKeyRecord.id}`);
        console.log(`Name: ${apiKeyRecord.key_name}`);
        console.log(`API Key: ${apiKey}`);
        console.log(`Rate Limit: ${apiKeyRecord.rate_limit} requests/hour`);
        console.log(`Expires: ${apiKeyRecord.expires_at}`);
        console.log(`IP Whitelist: ${apiKeyRecord.ip_whitelist || 'No restrictions'}`);
        console.log(`Permissions: FULL ADMIN ACCESS`);
        console.log(`Created: ${apiKeyRecord.created_at}`);
        
        console.log('\n🔒 Admin Security Notes:');
        console.log('========================');
        console.log('• This key has FULL SYSTEM ACCESS');
        console.log('• Can read/write/delete all data');
        console.log('• Can manage other API keys');
        console.log('• Can access financial data');
        console.log('• Store this key in a secure location');
        console.log('• Monitor usage carefully');
        console.log('• Rotate regularly for security');
        
        console.log('\n📖 Admin Usage Examples:');
        console.log('=========================');
        console.log(`# Health check`);
        console.log(`curl -X GET "http://localhost:3000/api/v2/external/health" \\`);
        console.log(`  -H "x-api-key: ${apiKey}"`);
        console.log('');
        console.log(`# List all API keys`);
        console.log(`curl -X GET "http://localhost:3000/api/admin/api-keys" \\`);
        console.log(`  -H "x-api-key: ${apiKey}"`);
        console.log('');
        console.log(`# Get usage analytics`);
        console.log(`curl -X GET "http://localhost:3000/api/v2/external/usage-stats" \\`);
        console.log(`  -H "x-api-key: ${apiKey}"`);

        return { apiKey, apiKeyRecord, type: 'admin' };

    } catch (error) {
        console.error('❌ Error creating admin API key:', error.message);
        throw error;
    }
}

// Create third-party API key
async function createThirdPartyApiKey() {
    try {
        console.log('🔐 Creating THIRD-PARTY API key...\n');

        // Get third-party details
        const integrationName = await askQuestion('Enter integration name: ');
        const clientSpecific = await askQuestion('Is this for a specific client? (y/n): ');
        let clientId = null;
        
        if (clientSpecific.toLowerCase() === 'y') {
            clientId = await askQuestion('Enter client ID: ');
        }

        const rateLimit = await askQuestion('Enter rate limit (default 1000): ') || '1000';
        const expirationDays = await askQuestion('Enter expiration days (default 90): ') || '90';
        const ipWhitelist = await askQuestion('Enter IP whitelist (comma-separated, or press Enter for no restrictions): ');

        // Calculate expiration date
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + parseInt(expirationDays));

        // Generate API key
        const randomBytes = crypto.randomBytes(32);
        const apiKey = 'ak_live_' + randomBytes.toString('hex');
        const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex');

        // Create API key record with third-party permissions
        const apiKeyRecord = await ApiKey.create({
            key_name: `Third Party - ${integrationName}`,
            api_key: hashedKey,
            key_prefix: 'ak_live_',
            client_id: clientId ? parseInt(clientId) : null,
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
            rate_limit: parseInt(rateLimit),
            expires_at: expirationDate,
            ip_whitelist: ipWhitelist,
            description: `Third-party API key for ${integrationName}${clientId ? ` (Client ID: ${clientId})` : ' (System-wide)'}`,
            created_by: 1 // Assuming admin ID 1 exists
        });

        console.log('\n✅ THIRD-PARTY API key created successfully!\n');
        console.log('📋 Third-Party API Key Details:');
        console.log('===============================');
        console.log(`ID: ${apiKeyRecord.id}`);
        console.log(`Name: ${apiKeyRecord.key_name}`);
        console.log(`API Key: ${apiKey}`);
        console.log(`Client ID: ${apiKeyRecord.client_id || 'System-wide'}`);
        console.log(`Rate Limit: ${apiKeyRecord.rate_limit} requests/hour`);
        console.log(`Expires: ${apiKeyRecord.expires_at}`);
        console.log(`IP Whitelist: ${apiKeyRecord.ip_whitelist || 'No restrictions'}`);
        console.log(`Permissions: READ-ONLY ACCESS`);
        console.log(`Created: ${apiKeyRecord.created_at}`);
        
        console.log('\n🔒 Third-Party Security Notes:');
        console.log('==============================');
        console.log('• This key has LIMITED ACCESS');
        console.log('• Can only READ client data (reports, invoices)');
        console.log('• Cannot modify or delete data');
        console.log('• Cannot access financial data');
        console.log('• Perfect for client portals');
        console.log('• Store this key securely');
        console.log('• Monitor usage for security');
        
        console.log('\n📖 Third-Party Usage Examples:');
        console.log('===============================');
        console.log(`# Health check`);
        console.log(`curl -X GET "http://localhost:3000/api/v2/external/health" \\`);
        console.log(`  -H "x-api-key: ${apiKey}"`);
        console.log('');
        console.log(`# Verify client`);
        console.log(`curl -X POST "http://localhost:3000/api/v2/external/auth/verify-client" \\`);
        console.log(`  -H "Content-Type: application/json" \\`);
        console.log(`  -H "x-api-key: ${apiKey}" \\`);
        console.log(`  -d '{"phone": "01128260256", "orderCode": "ORD123456"}'`);
        console.log('');
        console.log(`# Get client reports`);
        console.log(`curl -X GET "http://localhost:3000/api/v2/external/clients/1/reports" \\`);
        console.log(`  -H "x-api-key: ${apiKey}"`);

        return { apiKey, apiKeyRecord, type: 'third-party' };

    } catch (error) {
        console.error('❌ Error creating third-party API key:', error.message);
        throw error;
    }
}

// Main function
async function createApiKey() {
    try {
        // Display options
        displayApiKeyTypes();
        
        // Get user choice
        const choice = await askQuestion('Enter your choice (1 for Admin, 2 for Third-Party): ');
        
        if (choice === '1') {
            await createAdminApiKey();
        } else if (choice === '2') {
            await createThirdPartyApiKey();
        } else {
            console.log('❌ Invalid choice. Please run the script again and select 1 or 2.');
            process.exit(1);
        }

    } catch (error) {
        console.error('❌ Error creating API key:', error.message);
        process.exit(1);
    } finally {
        rl.close();
    }
}

// Run the script
if (require.main === module) {
    createApiKey().then(() => {
        console.log('\n🎉 API key creation completed!');
        process.exit(0);
    }).catch(error => {
        console.error('❌ Script failed:', error.message);
        process.exit(1);
    });
}

module.exports = { createApiKey };
