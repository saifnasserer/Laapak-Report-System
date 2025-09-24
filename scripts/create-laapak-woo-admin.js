#!/usr/bin/env node

/**
 * Auto script to create laapak-woo admin API key
 * Usage: node scripts/create-laapak-woo-admin.js
 */

const { ApiKey, Admin } = require('../backend/models');
const crypto = require('crypto');

async function createLaapakWooAdminKey() {
    try {
        console.log('🔐 Creating laapak-woo ADMIN API key...\n');

        // Generate API key
        const randomBytes = crypto.randomBytes(32);
        const apiKey = 'ak_live_' + randomBytes.toString('hex');
        const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex');

        // Calculate expiration date (10000 days from now)
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 10000);

        // Create API key record with admin permissions
        const apiKeyRecord = await ApiKey.create({
            key_name: 'Admin Key - laapak-woo',
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
            rate_limit: 5000,
            expires_at: expirationDate,
            ip_whitelist: '', // No IP restrictions
            description: 'Admin API key for laapak-woo - Full system access with 10000 days expiration',
            created_by: 9 // Using existing admin ID
        });

        console.log('✅ laapak-woo ADMIN API key created successfully!\n');
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
        console.log(`curl -X GET "https://reports.laapak.com/api/v2/external/health" \\`);
        console.log(`  -H "x-api-key: ${apiKey}"`);
        console.log('');
        console.log(`# List all API keys`);
        console.log(`curl -X GET "https://reports.laapak.com/api/admin/api-keys" \\`);
        console.log(`  -H "x-api-key: ${apiKey}"`);
        console.log('');
        console.log(`# Get usage analytics`);
        console.log(`curl -X GET "https://reports.laapak.com/api/v2/external/usage-stats" \\`);
        console.log(`  -H "x-api-key: ${apiKey}"`);

        console.log('\n🎉 laapak-woo Admin API key creation completed!');
        console.log(`\n🔑 Your laapak-woo Admin API Key: ${apiKey}`);
        console.log('⚠️  IMPORTANT: Store this key securely and never expose it in client-side code!');

        return { apiKey, apiKeyRecord, type: 'admin' };

    } catch (error) {
        console.error('❌ Error creating laapak-woo admin API key:', error.message);
        process.exit(1);
    }
}

// Run the script
if (require.main === module) {
    createLaapakWooAdminKey().then(() => {
        process.exit(0);
    }).catch(error => {
        console.error('❌ Script failed:', error.message);
        process.exit(1);
    });
}

module.exports = { createLaapakWooAdminKey };
