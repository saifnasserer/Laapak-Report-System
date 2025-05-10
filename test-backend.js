/**
 * Laapak Report System - Backend Test Script
 * Tests the backend API endpoints for reports and invoices
 */

const apiService = require('./js/api-service');

// Test function to verify backend connectivity
async function testBackendConnection() {
    console.log('Testing backend connection...');
    try {
        const result = await apiService.healthCheck();
        console.log('Backend connection successful:', result);
        return true;
    } catch (error) {
        console.error('Backend connection failed:', error);
        return false;
    }
}

// Test function to create a report
async function testCreateReport() {
    console.log('\nTesting report creation...');
    try {
        // Mock report data
        const reportData = {
            clientId: 1, // Using the first seeded client
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
                    status: 'good',
                    notes: 'Case in good condition'
                },
                {
                    componentName: 'screen',
                    status: 'good',
                    notes: 'Screen in good condition'
                }
            ]
        };

        // Create report
        const report = await apiService.createReport(reportData);
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
        if (!report) {
            console.error('No report available for invoice creation');
            return null;
        }

        // Mock invoice data
        const invoiceData = {
            reportId: report.id,
            clientId: report.clientId,
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
        const invoice = await apiService.createInvoice(invoiceData);
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
        const reports = await apiService.getReports();
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
        const invoices = await apiService.getInvoices();
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
    
    // Test report creation
    const report = await testCreateReport();
    
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
