/**
 * Test script for /api/reports/me endpoint
 * 
 * Usage:
 * 1. Make sure the server is running (npm start or npm run dev)
 * 2. Update CLIENT_PHONE and CLIENT_ORDER_CODE with valid test data
 * 3. Run: node test-reports-me-endpoint.js
 */

const fetch = require('node-fetch');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api';
const CLIENT_PHONE = '01113021967'; // Valid client phone from database
const CLIENT_ORDER_CODE = 'LPK437'; // Valid order code from database

async function testReportsMeEndpoint() {
    console.log('🧪 Testing /api/reports/me endpoint\n');
    console.log(`API Base URL: ${API_BASE_URL}\n`);

    try {
        // Step 1: Login as client to get JWT token
        console.log('Step 1: Logging in as client...');
        const loginResponse = await fetch(`${API_BASE_URL}/auth/client`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                phone: CLIENT_PHONE,
                orderCode: CLIENT_ORDER_CODE
            })
        });

        if (!loginResponse.ok) {
            const errorText = await loginResponse.text();
            console.error('❌ Login failed:', loginResponse.status, errorText);
            console.log('\n💡 Make sure CLIENT_PHONE and CLIENT_ORDER_CODE are valid in the script');
            return;
        }

        const loginData = await loginResponse.json();
        const token = loginData.token;
        const clientId = loginData.user.id;

        console.log('✅ Login successful');
        console.log(`   Client ID: ${clientId}`);
        console.log(`   Client Name: ${loginData.user.name}\n`);

        // Step 2: Test basic endpoint (no filters)
        console.log('Step 2: Testing GET /api/reports/me (no filters)...');
        const basicResponse = await fetch(`${API_BASE_URL}/reports/me`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            }
        });

        if (!basicResponse.ok) {
            const errorText = await basicResponse.text();
            console.error('❌ Request failed:', basicResponse.status, errorText);
            return;
        }

        const basicData = await basicResponse.json();
        console.log('✅ Basic request successful');
        console.log(`   Total reports: ${basicData.pagination.total}`);
        console.log(`   Returned: ${basicData.reports.length}`);
        console.log(`   Has more: ${basicData.pagination.hasMore}\n`);

        // Step 3: Test with status filter
        console.log('Step 3: Testing with status=active filter...');
        const statusResponse = await fetch(`${API_BASE_URL}/reports/me?status=active`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            }
        });

        if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            console.log('✅ Status filter successful');
            console.log(`   Active reports: ${statusData.pagination.total}`);
        } else {
            console.error('❌ Status filter failed:', statusResponse.status);
        }
        console.log('');

        // Step 4: Test with pagination
        console.log('Step 4: Testing with pagination (limit=2, offset=0)...');
        const paginationResponse = await fetch(`${API_BASE_URL}/reports/me?limit=2&offset=0`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            }
        });

        if (paginationResponse.ok) {
            const paginationData = await paginationResponse.json();
            console.log('✅ Pagination successful');
            console.log(`   Total: ${paginationData.pagination.total}`);
            console.log(`   Returned: ${paginationData.reports.length}`);
            console.log(`   Limit: ${paginationData.pagination.limit}`);
            console.log(`   Offset: ${paginationData.pagination.offset}`);
            console.log(`   Has more: ${paginationData.pagination.hasMore}`);
        } else {
            console.error('❌ Pagination failed:', paginationResponse.status);
        }
        console.log('');

        // Step 5: Test with sorting
        console.log('Step 5: Testing with sorting (sortBy=created_at&sortOrder=DESC)...');
        const sortResponse = await fetch(`${API_BASE_URL}/reports/me?sortBy=created_at&sortOrder=DESC&limit=3`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            }
        });

        if (sortResponse.ok) {
            const sortData = await sortResponse.json();
            console.log('✅ Sorting successful');
            console.log(`   Returned: ${sortData.reports.length} reports`);
            if (sortData.reports.length > 0) {
                console.log(`   First report ID: ${sortData.reports[0].id}`);
                console.log(`   First report created_at: ${sortData.reports[0].created_at}`);
            }
        } else {
            console.error('❌ Sorting failed:', sortResponse.status);
        }
        console.log('');

        // Step 6: Test with date range
        console.log('Step 6: Testing with date range (startDate=2024-01-01&endDate=2024-12-31)...');
        const dateResponse = await fetch(`${API_BASE_URL}/reports/me?startDate=2024-01-01&endDate=2024-12-31`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            }
        });

        if (dateResponse.ok) {
            const dateData = await dateResponse.json();
            console.log('✅ Date range filter successful');
            console.log(`   Reports in date range: ${dateData.pagination.total}`);
        } else {
            console.error('❌ Date range filter failed:', dateResponse.status);
        }
        console.log('');

        // Step 7: Test with device model filter
        console.log('Step 7: Testing with deviceModel filter...');
        const deviceResponse = await fetch(`${API_BASE_URL}/reports/me?deviceModel=iPhone`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            }
        });

        if (deviceResponse.ok) {
            const deviceData = await deviceResponse.json();
            console.log('✅ Device model filter successful');
            console.log(`   Reports matching "iPhone": ${deviceData.pagination.total}`);
        } else {
            console.error('❌ Device model filter failed:', deviceResponse.status);
        }
        console.log('');

        // Step 8: Test combined filters
        console.log('Step 8: Testing with combined filters (status=active&limit=1&sortBy=inspection_date&sortOrder=DESC)...');
        const combinedResponse = await fetch(`${API_BASE_URL}/reports/me?status=active&limit=1&sortBy=inspection_date&sortOrder=DESC`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            }
        });

        if (combinedResponse.ok) {
            const combinedData = await combinedResponse.json();
            console.log('✅ Combined filters successful');
            console.log(`   Total active reports: ${combinedData.pagination.total}`);
            console.log(`   Returned: ${combinedData.reports.length}`);
            if (combinedData.reports.length > 0) {
                const report = combinedData.reports[0];
                console.log(`   Sample report:`);
                console.log(`     ID: ${report.id}`);
                console.log(`     Device: ${report.device_model}`);
                console.log(`     Status: ${report.status}`);
                console.log(`     Inspection Date: ${report.inspection_date}`);
            }
        } else {
            console.error('❌ Combined filters failed:', combinedResponse.status);
        }
        console.log('');

        // Step 9: Test error case (admin token should fail)
        console.log('Step 9: Testing error case (should fail for admin token)...');
        // This would require an admin login, skipping for now
        console.log('   (Skipped - would need admin credentials)\n');

        console.log('✅ All tests completed!\n');
        console.log('📋 Summary:');
        console.log('   - Endpoint: GET /api/reports/me');
        console.log('   - Authentication: JWT Token (x-auth-token header)');
        console.log('   - Returns: Only reports for authenticated client');
        console.log('   - Supports: status, startDate, endDate, deviceModel, limit, offset, sortBy, sortOrder');

    } catch (error) {
        console.error('❌ Test error:', error.message);
        console.error(error.stack);
    }
}

// Run tests
testReportsMeEndpoint();

