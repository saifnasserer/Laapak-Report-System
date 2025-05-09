/**
 * Laapak Report System - Client Dashboard JavaScript
 * Handles client dashboard functionality and authentication
 */

document.addEventListener('DOMContentLoaded', function() {
    // Check if client is logged in using auth-middleware
    if (!authMiddleware.isClientLoggedIn()) {
        console.log('Client not logged in, redirecting to login page');
        window.location.href = 'index.html';
        return;
    }
    
    // Get client info from storage
    const clientInfo = JSON.parse(localStorage.getItem('clientInfo') || sessionStorage.getItem('clientInfo') || '{}');
    
    // Display client information
    const clientNameEl = document.getElementById('clientName');
    const welcomeClientNameEl = document.getElementById('welcomeClientName');
    
    if (clientNameEl && clientInfo.name) {
        clientNameEl.textContent = clientInfo.name;
    }
    
    if (welcomeClientNameEl && clientInfo.name) {
        welcomeClientNameEl.textContent = clientInfo.name;
    }
    
    // Handle logout using auth-middleware
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Client logout button clicked');
            // Use auth-middleware for logout
            authMiddleware.logout();
            // No need to redirect as auth-middleware.logout() handles it
        });
    }
    
    // Load client reports and related data
    async function loadClientReports(clientId) {
        if (!clientId) {
            console.error('No client ID provided for loading reports');
            return;
        }
        
        console.log('Loading reports for client ID:', clientId);
        
        try {
            // Get client token
            const clientToken = localStorage.getItem('clientToken') || sessionStorage.getItem('clientToken');
            if (!clientToken) {
                throw new Error('No authentication token found');
            }
            
            // Try to fetch reports from the API
            const response = await fetch(`${REPORTS_API_URL}/${clientId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${clientToken}`
                }
            });
            
            // If API fails, use mock data
            if (!response.ok) {
                console.warn('Failed to fetch reports from API, using mock data');
                displayReportsAndInvoices(getMockReports(clientId), getMockInvoices(clientId));
                return;
            }
            
            const data = await response.json();
            console.log('Reports data from API:', data);
            
            // Display the reports and invoices
            displayReportsAndInvoices(data.reports || [], data.invoices || []);
        } catch (error) {
            console.error('Error loading client reports:', error);
            // Fallback to mock data if API fails
            displayReportsAndInvoices(getMockReports(clientId), getMockInvoices(clientId));
        }
    }

    // Display reports and invoices in the UI
    function displayReportsAndInvoices(reports, invoices) {
        // Display reports
        const reportsList = document.getElementById('reportsList');
        const noReportsMessage = document.getElementById('noReportsMessage');
        
        if (reportsList) {
            if (reports.length === 0) {
                if (noReportsMessage) {
                    noReportsMessage.style.display = 'block';
                }
            } else {
                if (noReportsMessage) {
                    noReportsMessage.style.display = 'none';
                }
                
                // Clear existing reports
                reportsList.innerHTML = '';
                
                // Add report cards
                reports.forEach(report => {
                    const reportCard = createReportCard(report);
                    reportsList.appendChild(reportCard);
                });
            }
        }
        
        // Display invoices
        const invoicesList = document.getElementById('invoicesList');
        const noInvoicesMessage = document.getElementById('noInvoicesMessage');
        
        if (invoicesList) {
            if (invoices.length === 0) {
                if (noInvoicesMessage) {
                    noInvoicesMessage.style.display = 'block';
                }
            } else {
                if (noInvoicesMessage) {
                    noInvoicesMessage.style.display = 'none';
                }
                
                // Clear existing invoices
                invoicesList.innerHTML = '';
                
                // Add invoice cards
                invoices.forEach(invoice => {
                    const invoiceCard = createInvoiceCard(invoice);
                    invoicesList.appendChild(invoiceCard);
                });
            }
        }
    }

    // API URLs for client data
    const API_BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:3001/api' : '/api';
    const REPORTS_API_URL = `${API_BASE_URL}/reports/client`;
    
    // Check for offline status
    function updateOfflineStatus() {
        const offlineAlert = document.getElementById('offlineAlert');
        if (offlineAlert) {
            if (navigator.onLine) {
                offlineAlert.style.display = 'none';
            } else {
                offlineAlert.style.display = 'block';
            }
        }
    }

    // Initial check
    updateOfflineStatus();

    // Listen for online/offline events
    window.addEventListener('online', updateOfflineStatus);
    window.addEventListener('offline', updateOfflineStatus);
    
    // Load client data
    loadClientReports(clientInfo.clientId);
});

/**
 * Get client info from storage
 */
function getClientInfo() {
    // First check sessionStorage
    let clientInfo = sessionStorage.getItem('clientInfo');
    
    // If not in sessionStorage, check localStorage
    if (!clientInfo) {
        clientInfo = localStorage.getItem('clientInfo');
    }
    
    // If found, parse and return
    if (clientInfo) {
        return JSON.parse(clientInfo);
    }
    
    return null;
}

/**
 * Log out the client
 */
function logout() {
    sessionStorage.removeItem('clientInfo');
    localStorage.removeItem('clientInfo');
}

/**
 * Load client reports and related data
 */
function loadClientReports(clientId) {
    // Get reports - try localStorage first, fall back to mock data
    let reports = [];
    let invoices = [];
    
    // Try to get real reports from localStorage
    const storedReports = localStorage.getItem(`lpk_client_${clientId}_reports`);
    if (storedReports) {
        try {
            reports = JSON.parse(storedReports);
            console.log('Loaded reports from localStorage:', reports.length);
        } catch (e) {
            console.error('Error parsing reports from localStorage:', e);
            reports = getMockReports(clientId);
        }
    } else {
        // Fall back to mock data
        reports = getMockReports(clientId);
    }
    
    // Try to get real invoices from localStorage
    const storedInvoices = localStorage.getItem(`lpk_client_${clientId}_invoices`);
    if (storedInvoices) {
        try {
            invoices = JSON.parse(storedInvoices);
            console.log('Loaded invoices from localStorage:', invoices.length);
        } catch (e) {
            console.error('Error parsing invoices from localStorage:', e);
            invoices = getMockInvoices(clientId);
        }
    } else {
        // Fall back to mock data
        invoices = getMockInvoices(clientId);
    }
    
    // Set up tab change handlers
    setupTabHandlers();
    
    // Display the reports
    displayReports(reports);
    
    // Display warranty information
    displayWarrantyInfo(reports);
    
    // Display maintenance schedule
    displayMaintenanceSchedule(reports);
    
    // Display invoices
    displayInvoices(invoices);
}

/**
 * Get mock reports for a client
 */
function getMockReports(clientId) {
    // Common reports for all clients
    const reports = [
        {
            id: 'RPT1001',
            clientId: '1',
            creationDate: '2025-01-15',
            deviceType: 'لابتوب',
            brand: 'HP',
            model: 'Pavilion 15',
            serialNumber: 'HP12345678',
            problem: 'مشكلة في الشاشة والبطارية',
            diagnosis: 'تلف في كابل الشاشة وضعف في البطارية',
            solution: 'تم استبدال كابل الشاشة وتغيير البطارية',
            parts: [
                { name: 'كابل شاشة', cost: 150 },
                { name: 'بطارية جديدة', cost: 250 }
            ],
            technicianName: 'أحمد علي',
            status: 'مكتمل'
        },
        {
            id: 'RPT1002',
            clientId: '1',
            creationDate: '2024-11-20',
            deviceType: 'لابتوب',
            brand: 'Dell',
            model: 'XPS 13',
            serialNumber: 'DL98765432',
            problem: 'مشكلة في لوحة المفاتيح ونظام التشغيل',
            diagnosis: 'تلف في بعض أزرار لوحة المفاتيح وتلف في ملفات النظام',
            solution: 'تم استبدال لوحة المفاتيح وإعادة تثبيت نظام التشغيل',
            parts: [
                { name: 'لوحة مفاتيح', cost: 320 }
            ],
            technicianName: 'محمود خالد',
            status: 'مكتمل'
        },
        {
            id: 'RPT1003',
            clientId: '2',
            creationDate: '2025-03-05',
            deviceType: 'لابتوب',
            brand: 'Lenovo',
            model: 'ThinkPad X1',
            serialNumber: 'LN45678901',
            problem: 'مشكلة في التبريد والصوت',
            diagnosis: 'انسداد في نظام التبريد وتلف في مكبر الصوت',
            solution: 'تم تنظيف نظام التبريد واستبدال مكبر الصوت',
            parts: [
                { name: 'مكبر صوت', cost: 120 }
            ],
            technicianName: 'سامي علي',
            status: 'مكتمل'
        },
        {
            id: 'RPT1004',
            clientId: '3',
            creationDate: '2025-04-10',
            deviceType: 'لابتوب',
            brand: 'Apple',
            model: 'MacBook Pro',
            serialNumber: 'AP87654321',
            problem: 'مشكلة في القرص الصلب والشحن',
            diagnosis: 'تلف في القرص الصلب وعطل في شاحن الطاقة',
            solution: 'تم استبدال القرص الصلب بنوع SSD وإصلاح شاحن الطاقة',
            parts: [
                { name: 'قرص SSD', cost: 450 },
                { name: 'قطع غيار للشاحن', cost: 80 }
            ],
            technicianName: 'فهد محمد',
            status: 'مكتمل'
        }
    ];
    
    // Filter reports by client ID
    return reports.filter(report => report.clientId === clientId);
}

/**
 * Get mock invoices for a client
 */
function getMockInvoices(clientId) {
    const invoices = [
        {
            id: 'INV5001',
            reportId: 'RPT1001',
            clientId: '1',
            date: '2025-01-15',
            items: [
                { description: 'كابل شاشة', amount: 150 },
                { description: 'بطارية جديدة', amount: 250 },
                { description: 'أجور فني', amount: 200 }
            ],
            subtotal: 600,
            tax: 90,
            total: 690,
            paid: true,
            paymentMethod: 'بطاقة ائتمان',
            paymentDate: '2025-01-15'
        },
        {
            id: 'INV5002',
            reportId: 'RPT1002',
            clientId: '1',
            date: '2024-11-20',
            items: [
                { description: 'لوحة مفاتيح', amount: 320 },
                { description: 'إعادة تثبيت نظام التشغيل', amount: 150 },
                { description: 'أجور فني', amount: 200 }
            ],
            subtotal: 670,
            tax: 100.5,
            total: 770.5,
            paid: true,
            paymentMethod: 'نقداً',
            paymentDate: '2024-11-20'
        },
        {
            id: 'INV5003',
            reportId: 'RPT1003',
            clientId: '2',
            date: '2025-03-05',
            items: [
                { description: 'مكبر صوت', amount: 120 },
                { description: 'تنظيف نظام التبريد', amount: 100 },
                { description: 'أجور فني', amount: 200 }
            ],
            subtotal: 420,
            tax: 63,
            total: 483,
            paid: true,
            paymentMethod: 'بطاقة ائتمان',
            paymentDate: '2025-03-05'
        },
        {
            id: 'INV5004',
            reportId: 'RPT1004',
            clientId: '3',
            date: '2025-04-10',
            items: [
                { description: 'قرص SSD', amount: 450 },
                { description: 'قطع غيار للشاحن', amount: 80 },
                { description: 'أجور فني', amount: 200 }
            ],
            subtotal: 730,
            tax: 109.5,
            total: 839.5,
            paid: true,
            paymentMethod: 'نقداً',
            paymentDate: '2025-04-10'
        }
    ];
    
    // Filter invoices by client ID
    return invoices.filter(invoice => invoice.clientId === clientId);
}

// Import the other client dashboard modules for warranty, maintenance and display functions
document.write('<script src="js/client-warranty.js"></script>');
document.write('<script src="js/client-maintenance.js"></script>');
document.write('<script src="js/client-display.js"></script>');
