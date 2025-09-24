/**
 * Debug Remote API Access
 * This script helps debug the remote API access issue
 */

class RemoteAPIDebugger {
    constructor() {
        this.baseUrl = 'https://reports.laapak.com';
        this.apiKey = 'laapak-api-key-2024';
    }

    /**
     * Test if the search endpoint exists
     */
    async testSearchEndpoint() {
        console.log('🔍 Testing Remote API Search Endpoint');
        console.log('=====================================');
        
        try {
            // Test 1: Check if endpoint exists without authentication
            console.log('\n1️⃣ Testing endpoint without authentication...');
            const response1 = await fetch(`${this.baseUrl}/api/reports/search?q=test`);
            console.log(`Status: ${response1.status}`);
            console.log(`Headers:`, Object.fromEntries(response1.headers.entries()));
            
            if (response1.status === 401) {
                console.log('✅ Endpoint exists but requires authentication');
            } else if (response1.status === 404) {
                console.log('❌ Endpoint does not exist (404)');
                return false;
            }
            
        } catch (error) {
            console.log('❌ Network error:', error.message);
            return false;
        }

        try {
            // Test 2: Check with API key authentication
            console.log('\n2️⃣ Testing with API key authentication...');
            const response2 = await fetch(`${this.baseUrl}/api/reports/search?q=test`, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey
                }
            });
            console.log(`Status: ${response2.status}`);
            
            if (response2.status === 200) {
                console.log('✅ API key authentication works');
                return true;
            } else if (response2.status === 401) {
                console.log('❌ API key authentication failed');
            } else if (response2.status === 404) {
                console.log('❌ Endpoint not found with API key');
            }
            
        } catch (error) {
            console.log('❌ API key test failed:', error.message);
        }

        try {
            // Test 3: Check with client ID
            console.log('\n3️⃣ Testing with API key + client ID...');
            const response3 = await fetch(`${this.baseUrl}/api/reports/search?q=test`, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'x-client-id': '451'
                }
            });
            console.log(`Status: ${response3.status}`);
            
            if (response3.status === 200) {
                console.log('✅ API key + client ID works');
                return true;
            }
            
        } catch (error) {
            console.log('❌ API key + client ID test failed:', error.message);
        }

        return false;
    }

    /**
     * Test alternative endpoints
     */
    async testAlternativeEndpoints() {
        console.log('\n🔄 Testing Alternative Endpoints');
        console.log('===============================');
        
        const endpoints = [
            '/api/reports/search',
            '/api/reports/search/',
            '/api/search/reports',
            '/api/reports',
            '/api/health'
        ];

        for (const endpoint of endpoints) {
            try {
                console.log(`\nTesting: ${endpoint}`);
                const response = await fetch(`${this.baseUrl}${endpoint}?q=test`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': this.apiKey
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
     * Test with different HTTP methods
     */
    async testHTTPMethods() {
        console.log('\n🌐 Testing Different HTTP Methods');
        console.log('=================================');
        
        const methods = ['GET', 'POST'];
        const endpoint = '/api/reports/search';
        
        for (const method of methods) {
            try {
                console.log(`\nTesting ${method} ${endpoint}`);
                const response = await fetch(`${this.baseUrl}${endpoint}?q=test`, {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': this.apiKey
                    }
                });
                console.log(`  Status: ${response.status}`);
                
                if (response.status === 200) {
                    console.log(`  ✅ ${method} works!`);
                } else if (response.status === 404) {
                    console.log(`  ❌ ${method} not found`);
                } else if (response.status === 405) {
                    console.log(`  ⚠️  ${method} not allowed`);
                } else {
                    console.log(`  ⚠️  ${method} returned ${response.status}`);
                }
            } catch (error) {
                console.log(`  ❌ ${method} failed: ${error.message}`);
            }
        }
    }

    /**
     * Test server health
     */
    async testServerHealth() {
        console.log('\n🏥 Testing Server Health');
        console.log('========================');
        
        try {
            const response = await fetch(`${this.baseUrl}/api/health`);
            console.log(`Health check status: ${response.status}`);
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Server is healthy:', data);
            } else {
                console.log('❌ Server health check failed');
            }
        } catch (error) {
            console.log('❌ Health check failed:', error.message);
        }
    }

    /**
     * Run all tests
     */
    async runAllTests() {
        console.log('🚀 Starting Remote API Debug Tests');
        console.log('==================================');
        
        await this.testServerHealth();
        await this.testSearchEndpoint();
        await this.testAlternativeEndpoints();
        await this.testHTTPMethods();
        
        console.log('\n✅ All tests completed!');
    }
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
    const debugger = new RemoteAPIDebugger();
    debugger.runAllTests();
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RemoteAPIDebugger;
}
