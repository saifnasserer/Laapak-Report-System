/**
 * Test Phone Number Search Functionality
 * This script demonstrates how to test the phone number search feature
 */

// Test data with phone numbers
const testReports = [
    {
        id: 1,
        order_number: 'ORD-001',
        device_model: 'iPhone 13',
        client_name: 'John Doe',
        client: {
            phone: '+1234567890',
            email: 'john@example.com'
        },
        status: 'completed'
    },
    {
        id: 2,
        order_number: 'ORD-002',
        device_model: 'Samsung Galaxy',
        client_name: 'Jane Smith',
        client: {
            phone: '+9876543210',
            email: 'jane@example.com'
        },
        status: 'pending'
    },
    {
        id: 3,
        order_number: 'ORD-003',
        device_model: 'iPad Pro',
        client_name: 'Bob Johnson',
        client: {
            phone: '+5555555555',
            email: 'bob@example.com'
        },
        status: 'completed'
    }
];

/**
 * Test the search functionality
 */
function testPhoneSearch() {
    console.log('🔍 Testing Phone Number Search Functionality');
    console.log('==========================================');
    
    // Test 1: Search by phone number
    console.log('\n📱 Test 1: Search by phone number');
    const phoneResults = searchReports(testReports, '1234567890');
    console.log('Search for "1234567890":', phoneResults.length, 'results');
    phoneResults.forEach(report => {
        console.log(`- ${report.order_number}: ${report.client_name} (${report.client.phone})`);
    });
    
    // Test 2: Search by partial phone number
    console.log('\n📱 Test 2: Search by partial phone number');
    const partialResults = searchReports(testReports, '555');
    console.log('Search for "555":', partialResults.length, 'results');
    partialResults.forEach(report => {
        console.log(`- ${report.order_number}: ${report.client_name} (${report.client.phone})`);
    });
    
    // Test 3: Search by client name
    console.log('\n👤 Test 3: Search by client name');
    const nameResults = searchReports(testReports, 'John');
    console.log('Search for "John":', nameResults.length, 'results');
    nameResults.forEach(report => {
        console.log(`- ${report.order_number}: ${report.client_name} (${report.client.phone})`);
    });
    
    // Test 4: Search by device model
    console.log('\n📱 Test 4: Search by device model');
    const deviceResults = searchReports(testReports, 'iPhone');
    console.log('Search for "iPhone":', deviceResults.length, 'results');
    deviceResults.forEach(report => {
        console.log(`- ${report.order_number}: ${report.device_model} - ${report.client_name}`);
    });
    
    // Test 5: Search by email
    console.log('\n📧 Test 5: Search by email');
    const emailResults = searchReports(testReports, 'jane@example.com');
    console.log('Search for "jane@example.com":', emailResults.length, 'results');
    emailResults.forEach(report => {
        console.log(`- ${report.order_number}: ${report.client_name} (${report.client.email})`);
    });
    
    console.log('\n✅ Phone search testing completed!');
}

/**
 * Test API search functionality
 */
async function testApiPhoneSearch() {
    console.log('\n🌐 Testing API Phone Search');
    console.log('============================');
    
    try {
        // Initialize API service
        const apiService = new ApiService('https://reports.laapak.com');
        
        // Test searches
        const searchTerms = [
            '+1234567890',  // Full phone number
            '1234567890',   // Phone without +
            '555',          // Partial phone
            'john@example.com', // Email
            'iPhone'        // Device model
        ];
        
        for (const term of searchTerms) {
            try {
                console.log(`\n🔍 Searching for: "${term}"`);
                const results = await apiService.searchReports(term);
                console.log(`✅ Found ${results.length} results`);
                
                if (results.length > 0) {
                    results.slice(0, 3).forEach(report => {
                        console.log(`  - ${report.order_number}: ${report.client_name || 'N/A'}`);
                        if (report.client && report.client.phone) {
                            console.log(`    Phone: ${report.client.phone}`);
                        }
                    });
                }
            } catch (error) {
                console.log(`❌ Search failed for "${term}":`, error.message);
            }
        }
        
    } catch (error) {
        console.error('❌ API test failed:', error);
    }
}

/**
 * Demo function to show phone search in action
 */
function demoPhoneSearch() {
    console.log('🎯 Phone Number Search Demo');
    console.log('============================');
    console.log('This demo shows how phone number search works:');
    console.log('');
    console.log('1. 📱 Full phone number: +1234567890');
    console.log('2. 📱 Partial phone: 1234');
    console.log('3. 📱 Phone without +: 1234567890');
    console.log('4. 👤 Client name: John');
    console.log('5. 📧 Email: john@example.com');
    console.log('6. 📱 Device: iPhone');
    console.log('');
    console.log('All these searches will find relevant reports!');
    
    // Run the tests
    testPhoneSearch();
}

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        testPhoneSearch,
        testApiPhoneSearch,
        demoPhoneSearch,
        searchReports
    };
}

// Auto-run demo if this script is loaded directly
if (typeof window !== 'undefined' && window.location.pathname.includes('test-phone-search')) {
    document.addEventListener('DOMContentLoaded', () => {
        demoPhoneSearch();
    });
}
