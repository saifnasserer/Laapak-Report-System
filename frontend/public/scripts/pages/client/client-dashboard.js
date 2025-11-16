/**
 * Laapak Report System - Client Dashboard JavaScript
 * Handles client dashboard functionality and authentication
 */

// Ensure we have access to the API service
if (typeof apiService === 'undefined' && window.ApiService) {
    console.log('Creating apiService instance');
    window.apiService = new ApiService();
}

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
    
    // Note: Logout is now handled by the client-header-component.js
    // The logoutBtn event listener is set up in that component
    
    // Load client reports and related data will be defined outside
    
    // Functions moved to global scope
    
    // showLoading function moved to global scope
    
    /**
     * Show error message
     */
    // showErrorMessage function moved to global scope
    
    // Check for offline status with enhanced glass-style alert
    

    // Initial check
    updateOfflineStatus();

    // Listen for online/offline events
    window.addEventListener('online', updateOfflineStatus);
    window.addEventListener('offline', updateOfflineStatus);
    
    // Load client data
    loadClientReports();
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
 * Show glass-style loading indicator
 */
function showLoading(show, message = 'جاري تحميل البيانات...') {
    let loadingOverlay = document.getElementById('glassLoadingOverlay');
    
    if (show) {
        if (!loadingOverlay) {
            // Create glass loading overlay
            loadingOverlay = document.createElement('div');
            loadingOverlay.id = 'glassLoadingOverlay';
            loadingOverlay.className = 'glass-loading-overlay';
            loadingOverlay.innerHTML = `
                <div class="glass-spinner" role="status" aria-label="Loading"></div>
                <p class="glass-loading-text">${message}</p>
            `;
            document.body.appendChild(loadingOverlay);
        } else {
            // Update message if overlay exists
            const textEl = loadingOverlay.querySelector('.glass-loading-text');
            if (textEl) {
                textEl.textContent = message;
            }
            loadingOverlay.classList.remove('hide');
        }
    } else if (loadingOverlay) {
        // Hide with animation
        loadingOverlay.classList.add('hide');
        setTimeout(() => {
            if (loadingOverlay && loadingOverlay.parentNode) {
                loadingOverlay.remove();
            }
        }, 300);
    }
}

/**
 * Show glass-style notification (error, success, warning)
 */
function showErrorMessage(message, type = 'error', duration = 5000) {
    showGlassNotification(message, type, duration);
}

/**
 * Load cached reports from localStorage when offline
 */
function loadCachedReports() {
    try {
        const cachedReports = JSON.parse(localStorage.getItem('cached_client_reports') || '[]');
        const cachedInvoices = JSON.parse(localStorage.getItem('cached_client_invoices') || '[]');
        
        if (cachedReports.length > 0) {
            console.log('Loaded cached reports:', cachedReports.length);
            displayReportsAndInvoices(cachedReports, cachedInvoices);
        } else {
            // If no cached data, use mock data as last resort
            const clientInfo = JSON.parse(localStorage.getItem('clientInfo') || '{}');
            displayReportsAndInvoices(getMockReports(clientInfo.id), getMockInvoices(clientInfo.id));
        }
    } catch (error) {
        console.error('Error loading cached reports:', error);
        // Fall back to mock data
        const clientInfo = JSON.parse(localStorage.getItem('clientInfo') || '{}');
        displayReportsAndInvoices(getMockReports(clientInfo.id), getMockInvoices(clientInfo.id));
    }
}

/**
 * Cache reports for offline use
 */
function cacheReportsForOffline(reports, invoices) {
    try {
        localStorage.setItem('cached_client_reports', JSON.stringify(reports));
        localStorage.setItem('cached_client_invoices', JSON.stringify(invoices));
        console.log('Reports cached for offline use');
    } catch (error) {
        console.error('Error caching reports:', error);
    }
}

/**
 * Display reports and invoices in the UI with animations
 */
function displayReportsAndInvoices(reportsArray, invoicesArray) {
    // Remove any skeleton loaders first
    const skeletonLoaders = document.querySelectorAll('.skeleton-card');
    skeletonLoaders.forEach(skeleton => {
        skeleton.style.opacity = '0';
        skeleton.style.transform = 'translateY(-20px)';
        setTimeout(() => skeleton.remove(), 300);
    });
    
    // Call functions from client-display.js (which should now be globally available)
    if (typeof displayReports === 'function') {
        displayReports(reportsArray);
        // Trigger card animations and re-initialize magnetic effect
        setTimeout(() => {
            const cards = document.querySelectorAll('.report-card, .card');
            cards.forEach((card, index) => {
                card.style.animationDelay = `${index * 0.1}s`;
            });
            // Re-initialize magnetic cards if function exists
            if (typeof initMagneticCards === 'function') {
                initMagneticCards();
            }
        }, 100);
    } else {
        console.error('displayReports function is not defined. Check script loading order.');
        showErrorMessage('خطأ في عرض محتوى التقارير.');
    }

    // Call function from client-warranty.js to populate warranty tab
    if (typeof displayWarrantyInfo === 'function') {
        displayWarrantyInfo(reportsArray);
    } else {
        console.error('displayWarrantyInfo function is not defined. Check script loading order.');
        showErrorMessage('خطأ في عرض معلومات الضمان.');
    }

    // Call function from client-maintenance.js to populate maintenance tab
    if (typeof displayMaintenanceSchedule === 'function') {
        displayMaintenanceSchedule(reportsArray);
    } else {
        console.error('displayMaintenanceSchedule function is not defined. Check script loading order.');
        showErrorMessage('خطأ في عرض جدول الصيانة.');
    }

    if (typeof displayInvoices === 'function') {
        displayInvoices(invoicesArray);
        // Trigger invoice card animations and re-initialize magnetic effect
        setTimeout(() => {
            const invoiceCards = document.querySelectorAll('#invoicesList .card');
            invoiceCards.forEach((card, index) => {
                card.style.animationDelay = `${index * 0.1}s`;
            });
            // Re-initialize magnetic cards if function exists
            if (typeof initMagneticCards === 'function') {
                initMagneticCards();
            }
        }, 100);
    } else {
        console.error('displayInvoices function is not defined. Check script loading order.');
        showErrorMessage('خطأ في عرض محتوى الفواتير.');
    }
}

/**
 * Show skeleton loaders while data is loading
 */
function showSkeletonLoaders(containerId, count = 3) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Clear existing content
    container.innerHTML = '';
    
    // Create skeleton cards
    for (let i = 0; i < count; i++) {
        const skeletonCard = document.createElement('div');
        skeletonCard.className = 'skeleton-card';
        skeletonCard.innerHTML = `
            <div class="skeleton-line long"></div>
            <div class="skeleton-line medium"></div>
            <div class="skeleton-line short"></div>
            <div class="skeleton-line medium" style="margin-top: 1rem;"></div>
        `;
        container.appendChild(skeletonCard);
    }
}

/**
 * Load client reports and related data
 */
async function loadClientReports() {
    try {
        showLoading(true, 'جاري تحميل البيانات...');
        
        // Show skeleton loaders
        showSkeletonLoaders('reportsList', 3);
        showSkeletonLoaders('invoicesList', 2);
        
        // Check if apiService exists, use window.apiService as fallback
        let service = typeof apiService !== 'undefined' ? apiService : window.apiService;
        
        if (!service) {
            console.error('API Service not available - creating emergency instance');
            // Create emergency instance if needed
            window.apiService = new ApiService();
            // Use the newly created instance
            service = window.apiService;
        }
        
        console.log('Using API service with base URL:', service.baseUrl);
        
        // Fetch reports from API
        const apiResponse = await service.getClientReports();
        console.log('Reports data from API:', apiResponse);
        
        // Hide loading indicator
        showLoading(false);

        if (apiResponse && apiResponse.success && Array.isArray(apiResponse.data)) {
            const reportsArray = apiResponse.data;
            
            // Fetch invoices from API for the client
            let invoicesArray = [];
            try {
                const invoiceApiResponse = await apiService.getClientInvoices(); // Fetch invoices for the authenticated client
                if (invoiceApiResponse && invoiceApiResponse.success && Array.isArray(invoiceApiResponse.data)) {
                    invoicesArray = invoiceApiResponse.data;
                    console.log('Invoices data from API:', invoicesArray);
                } else if (invoiceApiResponse && Array.isArray(invoiceApiResponse)) { // If API returns array directly
                    invoicesArray = invoiceApiResponse;
                    console.log('Invoices data from API (direct array):', invoicesArray);
                } else {
                    console.warn('API response for invoices was not a valid array or success object:', invoiceApiResponse);
                }
            } catch (invoiceError) {
                console.error('Error fetching client invoices:', invoiceError);
                // Optionally show a non-blocking error for invoices, or proceed with empty invoicesArray
            }
            
            // Display the reports and invoices with animations
            displayReportsAndInvoices(reportsArray, invoicesArray);
            
            // Cache reports and invoices for offline use
            cacheReportsForOffline(reportsArray, invoicesArray); // Pass both arrays
            
            // Show success notification if data loaded successfully
            if (reportsArray.length > 0 || invoicesArray.length > 0) {
                showGlassNotification(`تم تحميل ${reportsArray.length} تقرير و ${invoicesArray.length} فاتورة`, 'success', 3000);
            }
        } else {
            console.error('API response did not contain a valid reports array:', apiResponse);
            showErrorMessage('فشل في معالجة بيانات التقارير من الخادم.');
        }
    } catch (error) {
        console.error('Error loading client reports:', error);
        showLoading(false);
        
        // Show error message with glass notification
        const errorMsg = navigator.onLine 
            ? 'فشل تحميل التقارير. يرجى المحاولة مرة أخرى لاحقاً.' 
            : 'أنت غير متصل بالإنترنت حالياً. جاري تحميل البيانات المحفوظة محلياً.';
        showErrorMessage(errorMsg);
        
        // Try to load cached reports if offline
        loadCachedReports();
    }
}

/**
 * Load client reports and related data
 */
function loadClientReportsFromCacheOrMock(clientId) {
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

/**
 * Set up tab change handlers
 */
function setupTabHandlers() {
    // Handle tab changes
    const tabElements = document.querySelectorAll('#clientTabs .nav-link');
    
    if (tabElements.length > 0) {
        tabElements.forEach(tab => {
            tab.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Remove active class from all tabs
                tabElements.forEach(t => t.classList.remove('active'));
                
                // Add active class to clicked tab
                this.classList.add('active');
                
                // Get the target tab content ID
                const targetId = this.getAttribute('data-bs-target');
                
                // Hide all tab content
                const tabContents = document.querySelectorAll('.tab-pane');
                tabContents.forEach(content => {
                    content.classList.remove('show', 'active');
                });
                
                // Show target tab content
                const targetContent = document.querySelector(targetId);
                if (targetContent) {
                    targetContent.classList.add('show', 'active');
                }
            });
        });
    }
}

// Ensure the DOM is fully loaded before trying to access elements
document.addEventListener('DOMContentLoaded', async (event) => {
    // Set up tab handlers
    setupTabHandlers();
    
    // Ensure we are calling the API-fetching version
    if (typeof loadClientReports === 'function') {
        await loadClientReports(); 
    } else {
        console.error('Main loadClientReports function not found!');
    }
});
