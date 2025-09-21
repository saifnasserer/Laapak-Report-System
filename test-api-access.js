/**
 * Laapak Report System - API Access Test Script
 * Use this script to test API access and authentication
 */

const fetch = require('node-fetch'); // Install with: npm install node-fetch

class LaapakAPITester {
    constructor(baseUrl = 'http://localhost:3000/api') {
        this.baseUrl = baseUrl;
        this.token = null;
    }

    async testConnection() {
        try {
            console.log('Testing API connection...');
            const response = await fetch(`${this.baseUrl}/health`);
            const data = await response.json();
            console.log('✅ API Connection successful:', data);
            return true;
        } catch (error) {
            console.error('❌ API Connection failed:', error.message);
            return false;
        }
    }

    async testAdminLogin(username, password) {
        try {
            console.log('Testing admin login...');
            const response = await fetch(`${this.baseUrl}/auth/admin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Login failed: ${response.status} - ${errorData.message}`);
            }

            const data = await response.json();
            this.token = data.token;
            console.log('✅ Admin login successful');
            console.log('User:', data.user);
            console.log('Token:', data.token.substring(0, 20) + '...');
            return data;
        } catch (error) {
            console.error('❌ Admin login failed:', error.message);
            return null;
        }
    }

    async testClientLogin(phone, orderCode) {
        try {
            console.log('Testing client login...');
            const response = await fetch(`${this.baseUrl}/clients/auth`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, orderCode })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Login failed: ${response.status} - ${errorData.message}`);
            }

            const data = await response.json();
            this.token = data.token;
            console.log('✅ Client login successful');
            console.log('Client:', data.client);
            console.log('Token:', data.token.substring(0, 20) + '...');
            return data;
        } catch (error) {
            console.error('❌ Client login failed:', error.message);
            return null;
        }
    }

    async testAuthenticatedRequest(endpoint, method = 'GET', data = null) {
        if (!this.token) {
            console.error('❌ No token available. Please login first.');
            return null;
        }

        try {
            console.log(`Testing ${method} ${endpoint}...`);
            const options = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': this.token
                }
            };

            if (data) {
                options.body = JSON.stringify(data);
            }

            const response = await fetch(`${this.baseUrl}${endpoint}`, options);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Request failed: ${response.status} - ${errorData.message}`);
            }

            const result = await response.json();
            console.log(`✅ ${method} ${endpoint} successful`);
            console.log('Response:', Array.isArray(result) ? `${result.length} items` : 'Object received');
            return result;
        } catch (error) {
            console.error(`❌ ${method} ${endpoint} failed:`, error.message);
            return null;
        }
    }

    async runFullTest() {
        console.log('🚀 Starting Laapak API Access Test\n');

        // Test 1: Connection
        const connected = await this.testConnection();
        if (!connected) {
            console.log('❌ Cannot proceed without API connection');
            return;
        }

        console.log('\n' + '='.repeat(50) + '\n');

        // Test 2: Admin Login (you need to provide real credentials)
        console.log('📝 To test admin login, update the credentials below:');
        console.log('const adminResult = await tester.testAdminLogin("your_username", "your_password");');
        
        // Uncomment and update with real credentials:
        // const adminResult = await this.testAdminLogin("admin", "password");
        
        if (this.token) {
            console.log('\n' + '='.repeat(50) + '\n');

            // Test 3: Authenticated requests
            await this.testAuthenticatedRequest('/reports');
            await this.testAuthenticatedRequest('/invoices');
            await this.testAuthenticatedRequest('/users/clients');
        }

        console.log('\n' + '='.repeat(50) + '\n');
        console.log('✅ API Access Test Complete');
    }
}

// Usage Examples
async function main() {
    const tester = new LaapakAPITester();

    // Option 1: Run full test
    await tester.runFullTest();

    // Option 2: Test specific login
    // await tester.testAdminLogin('your_username', 'your_password');
    
    // Option 3: Test client login
    // await tester.testClientLogin('1234567890', 'ORD123456');

    // Option 4: Test with custom base URL
    // const tester = new LaapakAPITester('https://reports.laapak.com/api');
}

// Run the test
if (require.main === module) {
    main().catch(console.error);
}

module.exports = LaapakAPITester;
