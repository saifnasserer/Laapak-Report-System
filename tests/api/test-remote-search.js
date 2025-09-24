/**
 * Test Remote Search API
 * This script tests the remote search API with different authentication methods
 */

class RemoteSearchTester {
    constructor() {
        this.baseUrl = 'https://reports.laapak.com';
        this.apiKey = 'laapak-api-key-2024';
        this.clientId = '451'; // Your client ID
    }

    /**
     * Test search with API key only
     */
    async testSearchWithApiKey() {
        console.log('🔑 Testing search with API key only...');
        
        try {
            const response = await fetch(`${this.baseUrl}/api/reports/search?q=01061031292`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey
                }
            });

            console.log(`Status: ${response.status}`);
            console.log(`Headers:`, Object.fromEntries(response.headers.entries()));

            if (response.ok) {
                const data = await response.json();
                console.log('✅ Success! Found', data.length, 'results');
                return data;
            } else {
                const errorText = await response.text();
                console.log('❌ Error response:', errorText);
                return null;
            }
        } catch (error) {
            console.log('❌ Network error:', error.message);
            return null;
        }
    }

    /**
     * Test search with API key + client ID
     */
    async testSearchWithApiKeyAndClientId() {
        console.log('🔑👤 Testing search with API key + client ID...');
        
        try {
            const response = await fetch(`${this.baseUrl}/api/reports/search?q=01061031292`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'x-client-id': this.clientId
                }
            });

            console.log(`Status: ${response.status}`);
            console.log(`Headers:`, Object.fromEntries(response.headers.entries()));

            if (response.ok) {
                const data = await response.json();
                console.log('✅ Success! Found', data.length, 'results');
                return data;
            } else {
                const errorText = await response.text();
                console.log('❌ Error response:', errorText);
                return null;
            }
        } catch (error) {
            console.log('❌ Network error:', error.message);
            return null;
        }
    }

    /**
     * Test different search terms
     */
    async testDifferentSearchTerms() {
        console.log('🔍 Testing different search terms...');
        
        const searchTerms = [
            '01061031292',      // Your phone number
            '0106',             // Partial phone
            '+201061031292',    // Phone with country code
            'test',             // Generic test
            'iPhone',           // Device model
            'ORD-001'           // Order number
        ];

        for (const term of searchTerms) {
            console.log(`\n🔍 Testing search term: "${term}"`);
            
            try {
                const response = await fetch(`${this.baseUrl}/api/reports/search?q=${encodeURIComponent(term)}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': this.apiKey,
                        'x-client-id': this.clientId
                    }
                });

                console.log(`  Status: ${response.status}`);
                
                if (response.ok) {
                    const data = await response.json();
                    console.log(`  ✅ Found ${data.length} results`);
                } else {
                    const errorText = await response.text();
                    console.log(`  ❌ Error: ${errorText}`);
                }
            } catch (error) {
                console.log(`  ❌ Network error: ${error.message}`);
            }
        }
    }

    /**
     * Test server connectivity
     */
    async testServerConnectivity() {
        console.log('🌐 Testing server connectivity...');
        
        try {
            // Test basic connectivity
            const response = await fetch(`${this.baseUrl}/api/health`);
            console.log(`Health check status: ${response.status}`);
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Server is reachable:', data);
                return true;
            } else {
                console.log('❌ Server health check failed');
                return false;
            }
        } catch (error) {
            console.log('❌ Server connectivity failed:', error.message);
            return false;
        }
    }

    /**
     * Test alternative endpoints
     */
    async testAlternativeEndpoints() {
        console.log('🔄 Testing alternative endpoints...');
        
        const endpoints = [
            '/api/reports/search',
            '/api/reports/search/',
            '/api/search/reports',
            '/api/reports?search=01061031292',
            '/api/reports?q=01061031292'
        ];

        for (const endpoint of endpoints) {
            console.log(`\n🔍 Testing endpoint: ${endpoint}`);
            
            try {
                const response = await fetch(`${this.baseUrl}${endpoint}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': this.apiKey,
                        'x-client-id': this.clientId
                    }
                });

                console.log(`  Status: ${response.status}`);
                
                if (response.status === 200) {
                    console.log(`  ✅ ${endpoint} works!`);
                } else if (response.status === 404) {
                    console.log(`  ❌ ${endpoint} not found`);
                } else {
                    console.log(`  ⚠️  ${endpoint} returned ${response.status}`);
                }
            } catch (error) {
                console.log(`  ❌ ${endpoint} failed: ${error.message}`);
            }
        }
    }

    /**
     * Run all tests
     */
    async runAllTests() {
        console.log('🚀 Starting Remote Search API Tests');
        console.log('===================================');
        console.log(`Base URL: ${this.baseUrl}`);
        console.log(`API Key: ${this.apiKey}`);
        console.log(`Client ID: ${this.clientId}`);
        console.log('');

        // Test 1: Server connectivity
        const isServerReachable = await this.testServerConnectivity();
        if (!isServerReachable) {
            console.log('❌ Server is not reachable. Stopping tests.');
            return;
        }

        // Test 2: Search with API key only
        await this.testSearchWithApiKey();

        // Test 3: Search with API key + client ID
        await this.testSearchWithApiKeyAndClientId();

        // Test 4: Different search terms
        await this.testDifferentSearchTerms();

        // Test 5: Alternative endpoints
        await this.testAlternativeEndpoints();

        console.log('\n✅ All tests completed!');
    }
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
    const tester = new RemoteSearchTester();
    tester.runAllTests();
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RemoteSearchTester;
}
