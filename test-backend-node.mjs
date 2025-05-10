/**
 * Laapak Report System - Backend Test Script (Node.js version)
 * Tests the backend API endpoints for reports and invoices
 */

import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';

// API URLs
const BASE_URL = 'http://localhost:3001';
const API_URL = `${BASE_URL}/api`;
const AUTH_URL = `${API_URL}/auth`;
const REPORTS_URL = `${API_URL}/reports`;
const INVOICES_URL = `${API_URL}/invoices`;
const CLIENTS_URL = `${API_URL}/clients`;

// Authentication token
let authToken = null;

// Test function to verify backend connectivity
async function testBackendConnection() {
    console.log('Testing backend connection...');
    try {
        const response = await fetch(`${API_URL}/health`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        console.log('Backend connection successful:', result);
        return true;
    } catch (error) {
        console.error('Backend connection failed:', error);
        return false;
    }
}

// Test function to authenticate
async function testAuthentication() {
    console.log('\nTesting authentication...');
    try {
        // Login with admin credentials
        const loginData = {
            username: 'admin',
            password: 'admin123'
        };
        
        const response = await fetch(`${AUTH_URL}/admin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loginData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const authResult = await response.json();
        authToken = authResult.token;
        
        console.log('Authentication successful, token received');
        return true;
    } catch (error) {
        console.error('Authentication failed:', error);
        return false;
    }
}

// Test function to get clients
async function testGetClients() {
    console.log('\nTesting get clients...');
    try {
        if (!authToken) {
            throw new Error('No authentication token available');
        }
        
        const response = await fetch(CLIENTS_URL, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        const clients = Array.isArray(result) ? result : (result.clients || []);
        console.log(`Retrieved ${clients.length} clients`);
        
        // Log the first client for debugging
        if (clients.length > 0) {
            console.log('First client:', clients[0]);
        }
        
        return clients;
    } catch (error) {
        console.error('Get clients failed:', error);
        return [];
    }
}

// Test function to create a report
async function testCreateReport(clientId) {
    console.log('\nTesting report creation...');
    try {
        if (!authToken) {
            throw new Error('No authentication token available');
        }
        
        // Mock report data
        const reportData = {
            clientId: clientId,
            orderCode: 'TEST-' + Date.now().toString().slice(-6),
            deviceModel: 'Test Laptop Model',
            serialNumber: 'SN' + Date.now().toString().slice(-8),
            inspectionDate: new Date().toISOString().split('T')[0],
            problemDescription: 'Test problem description',
            diagnosis: 'Test diagnosis',
            solution: 'Test solution',
            notes: 'Test notes',
            technicalTests: [
                {
                    componentName: 'cpu',
                    status: 'working',
                    notes: 'CPU working properly'
                },
                {
                    componentName: 'ram',
                    status: 'working',
                    notes: 'RAM working properly'
                }
            ],
            externalInspection: [
                {
                    componentName: 'case',
                    conditionStatus: 'good',
                    notes: 'Case in good condition'
                },
                {
                    componentName: 'screen',
                    conditionStatus: 'good',
                    notes: 'Screen in good condition'
                }
            ]
        };

        // Create report
        const response = await fetch(REPORTS_URL, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(reportData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const report = await response.json();
        console.log('Report created successfully:', report.id);
        
        // Return report for further testing
        return report;
    } catch (error) {
        console.error('Report creation failed:', error);
        return null;
    }
}

// Test function to create an invoice
async function testCreateInvoice(report) {
    console.log('\nTesting invoice creation...');
    try {
        if (!authToken) {
            throw new Error('No authentication token available');
        }
        
        if (!report) {
            console.error('No report available for invoice creation');
            return null;
        }

        // Mock invoice data
        const invoiceData = {
            reportId: report.id,
            clientId: report.clientId,
            date: new Date().toISOString(),
            subtotal: 500.00,
            discount: 50.00,
            taxRate: 14.00,
            tax: 63.00,
            total: 513.00,
            paymentStatus: 'unpaid',
            paymentMethod: '',
            items: [
                {
                    description: report.deviceModel + (report.serialNumber ? ` (SN: ${report.serialNumber})` : ''),
                    type: 'laptop',
                    amount: 500.00,
                    quantity: 1,
                    totalAmount: 500.00,
                    serialNumber: report.serialNumber
                }
            ]
        };

        // Create invoice
        const response = await fetch(INVOICES_URL, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(invoiceData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const invoice = await response.json();
        console.log('Invoice created successfully:', invoice.id);
        
        return invoice;
    } catch (error) {
        console.error('Invoice creation failed:', error);
        return null;
    }
}

// Test function to get reports
async function testGetReports() {
    console.log('\nTesting get reports...');
    try {
        if (!authToken) {
            throw new Error('No authentication token available');
        }
        
        const response = await fetch(REPORTS_URL, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const reports = await response.json();
        console.log(`Retrieved ${reports.length} reports`);
        return reports;
    } catch (error) {
        console.error('Get reports failed:', error);
        return [];
    }
}

// Test function to get invoices
async function testGetInvoices() {
    console.log('\nTesting get invoices...');
    try {
        if (!authToken) {
            throw new Error('No authentication token available');
        }
        
        const response = await fetch(INVOICES_URL, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const invoices = await response.json();
        console.log(`Retrieved ${invoices.length} invoices`);
        return invoices;
    } catch (error) {
        console.error('Get invoices failed:', error);
        return [];
    }
}

// Main test function
async function runTests() {
    console.log('Starting backend tests...');
    
    // Test backend connection
    const isConnected = await testBackendConnection();
    if (!isConnected) {
        console.error('Backend connection failed. Aborting tests.');
        return;
    }
    
    // Test authentication
    const isAuthenticated = await testAuthentication();
    if (!isAuthenticated) {
        console.error('Authentication failed. Aborting tests.');
        return;
    }
    
    // Get clients
    const clients = await testGetClients();
    let clientId = null;
    
    if (!clients || clients.length === 0) {
        console.log('No clients found. Using default client ID 1');
        clientId = 1; // Use the first seeded client from our database setup
    } else {
        clientId = clients[0].id;
        console.log(`Using client ID: ${clientId} for testing`);
    }
    
    // Test report creation with client
    const report = await testCreateReport(clientId);
    if (!report) {
        console.error('Report creation failed. Aborting tests.');
        return;
    }
    
    // Test invoice creation
    const invoice = await testCreateInvoice(report);
    
    // Test getting reports
    const reports = await testGetReports();
    
    // Test getting invoices
    const invoices = await testGetInvoices();
    
    console.log('\nTests completed.');
}

// Run the tests
runTests().catch(error => {
    console.error('Test error:', error);
});
