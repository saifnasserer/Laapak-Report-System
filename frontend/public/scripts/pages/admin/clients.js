/**
 * Laapak Report System - Clients Management JavaScript
 * Handles client management functionality and initializes the header component
 */

// API URLs
const API_BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:3001/api' : '/api';
const CLIENTS_API_URL = `${API_BASE_URL}/clients`;

// Store clients data globally to make it accessible across functions
let clientsData = [];

// Pagination settings
const CLIENTS_PER_PAGE = 20;
let currentPage = 1;
let totalClients = 0;

document.addEventListener('DOMContentLoaded', function() {
    // Check if admin is logged in
    if (!authMiddleware.isAdminLoggedIn()) {
        console.log('Admin not logged in, redirecting to login page');
        window.location.href = 'index.html';
        return;
    }

    // Initialize the header component
    const header = new LpkHeader('header-container', {
        showLogo: true,
        logoPath: 'assets/images/logo.png',
        logoWidth: '100px',
        showNavigation: true,
        navigationItems: [
            { text: 'الرئيسية', url: 'admin.html', icon: 'fas fa-tachometer-alt' },
            { text: 'التقارير', url: 'reports.html', icon: 'fas fa-file-alt' },
            { text: 'العملاء', url: 'clients.html', icon: 'fas fa-users', active: true },
            { text: 'تقرير جديد', url: 'create-report.html', icon: 'fas fa-plus-circle' }
        ],
        showUserMenu: true,
        userMenuItems: [
            { text: 'الإعدادات', url: 'settings.html', icon: 'fas fa-cog' },
            { text: 'تسجيل الخروج', url: '#', icon: 'fas fa-sign-out-alt', onClick: function() {
                console.log('Logout clicked');
                authMiddleware.logout();
                // No need to redirect as auth-middleware.logout() handles it
            }}
        ]
    });

    // Load clients from the backend
    loadClients();
    
    // Set up event delegation for client table actions
    setupEventDelegation();
    
    // Initialize pagination
    initPagination();

    // Form submission for client search
    const searchForm = document.getElementById('searchForm');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            performSearch();
        });
        
        // Also trigger search on Enter key in input fields
        const searchInputs = searchForm.querySelectorAll('input, select');
        searchInputs.forEach(input => {
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    performSearch();
                }
            });
        });
    }
    
    // Clear search functionality
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', function() {
            clearSearch();
        });
    }
    
    /**
     * Perform client search with current form values
     */
    function performSearch() {
        const searchName = document.getElementById('searchName')?.value.trim() || '';
        const searchStatus = document.getElementById('searchStatus')?.value || '';
        const searchEmail = document.getElementById('searchEmail')?.value.trim() || '';
        
        // Build search filters
        const filters = {};
        if (searchName) {
            filters.name = searchName;
        }
        if (searchStatus) {
            filters.status = searchStatus;
        }
        if (searchEmail) {
            filters.email = searchEmail;
        }
        
        // Apply client-side filtering if we have clientsData loaded
        if (clientsData && clientsData.length > 0) {
            filterClientsLocally(filters);
        } else {
            // If no data loaded, try API search
            loadClients(filters);
        }
    }
    
    /**
     * Clear search and reset filters
     */
    function clearSearch() {
        // Clear all search inputs
        const searchName = document.getElementById('searchName');
        const searchStatus = document.getElementById('searchStatus');
        const searchEmail = document.getElementById('searchEmail');
        
        if (searchName) searchName.value = '';
        if (searchStatus) searchStatus.value = '';
        if (searchEmail) searchEmail.value = '';
        
        // Reset to show all clients
        currentPage = 1;
        totalClients = clientsData.length;
        displayClients(clientsData);
        updatePaginationControls();
    }
    
    /**
     * Filter clients locally based on search criteria
     * @param {Object} filters - Search filters (name, status, email)
     */
    function filterClientsLocally(filters) {
        if (!clientsData || clientsData.length === 0) {
            return;
        }
        
        let filteredClients = clientsData.filter(client => {
            // Filter by name or phone
            if (filters.name) {
                const searchTerm = filters.name.toLowerCase();
                const nameMatch = (client.name || '').toLowerCase().includes(searchTerm);
                const phoneMatch = (client.phone || '').toLowerCase().includes(searchTerm);
                if (!nameMatch && !phoneMatch) {
                    return false;
                }
            }
            
            // Filter by status
            if (filters.status) {
                if (client.status !== filters.status) {
                    return false;
                }
            }
            
            // Filter by email
            if (filters.email) {
                const emailTerm = filters.email.toLowerCase();
                const emailMatch = (client.email || '').toLowerCase().includes(emailTerm);
                if (!emailMatch) {
                    return false;
                }
            }
            
            return true;
        });
        
        // Update pagination to reflect filtered results
        totalClients = filteredClients.length;
        currentPage = 1;
        
        // Update display with filtered results
        displayClients(filteredClients);
        updatePaginationControls();
    }

    // Form submission for adding a new client
    const saveClientBtn = document.getElementById('saveClientBtn');
    if (saveClientBtn) {
        saveClientBtn.addEventListener('click', async function() {
            const clientName = document.getElementById('clientName').value;
            const clientPhone = document.getElementById('clientPhone').value;
            const clientEmail = document.getElementById('clientEmail').value;
            const clientAddress = document.getElementById('clientAddress').value;
            const clientOrderCode = document.getElementById('clientOrderCode').value;
            const clientStatus = document.querySelector('input[name="clientStatus"]:checked').value;
            
            if (!clientName || !clientPhone || !clientOrderCode) {
                alert('الرجاء ملء جميع الحقول المطلوبة');
                return;
            }
            
            try {
                if (!authMiddleware.isAdminLoggedIn()) {
                    throw new Error('غير مصرح لك بإضافة عملاء');
                }
                
                // Use ApiService's createClient method
                const newClient = await apiService.createClient({
                    name: clientName,
                    phone: clientPhone,
                    email: clientEmail,
                    address: clientAddress,
                    orderCode: clientOrderCode,
                    status: clientStatus
                });
                
                // Show success message and close modal
                alert('تم إضافة العميل بنجاح');
                const modal = bootstrap.Modal.getInstance(document.getElementById('addClientModal'));
                if (modal) {
                    modal.hide();
                }
                document.getElementById('addClientForm').reset();
                
                // Always reload all clients from the API to ensure we have the latest data
                try {
                    // Force a complete reload of clients from API
                    await loadClients();
                    console.log('Successfully refreshed client data after adding new client');
                } catch (refreshError) {
                    console.warn('Error refreshing client data, using local update:', refreshError);
                    // Fall back to local update if API refresh fails
                    if (newClient && Array.isArray(clientsData)) {
                        clientsData.push(newClient);
                        displayClients(clientsData);
                    }
                }
            } catch (error) {
                console.error('Error adding client:', error);
                alert(`خطأ: ${error.message}`);
            }
        });
    }
    
    // Handle edit client
    const updateClientBtn = document.getElementById('updateClientBtn');
    if (updateClientBtn) {
        updateClientBtn.addEventListener('click', async function() {
            const clientId = document.getElementById('editClientId').value;
            const clientName = document.getElementById('editClientName').value;
            const clientPhone = document.getElementById('editClientPhone').value;
            const clientEmail = document.getElementById('editClientEmail').value;
            const clientAddress = document.getElementById('editClientAddress').value;
            const clientStatus = document.querySelector('input[name="editClientStatus"]:checked').value;
            
            if (!clientId || !clientName || !clientPhone) {
                alert('الرجاء ملء جميع الحقول المطلوبة');
                return;
            }
            
            try {
                if (!authMiddleware.isAdminLoggedIn()) {
                    throw new Error('غير مصرح لك بتعديل بيانات العملاء');
                }
                
                // Use ApiService's updateClient method
                const updatedClient = await apiService.updateClient(clientId, {
                    name: clientName,
                    phone: clientPhone,
                    email: clientEmail,
                    address: clientAddress,
                    status: clientStatus
                });
                
                // Show success message and close modal
                alert('تم تحديث بيانات العميل بنجاح');
                const modal = bootstrap.Modal.getInstance(document.getElementById('editClientModal'));
                if (modal) {
                    modal.hide();
                }
                
                // Always reload all clients from the API to ensure we have the latest data
                try {
                    // Force a complete reload of clients from API
                    await loadClients();
                    console.log('Successfully refreshed client data after updating client');
                } catch (refreshError) {
                    console.warn('Error refreshing client data, using local update:', refreshError);
                    // Fall back to local update if API refresh fails
                    if (updatedClient) {
                        const index = clientsData.findIndex(c => c.id == clientId);
                        if (index !== -1) {
                            clientsData[index] = updatedClient;
                            displayClients(clientsData);
                        }
                    }
                }
            } catch (error) {
                console.error('Error updating client:', error);
                alert(`خطأ: ${error.message}`);
            }
        });
    }

    /**
     * Setup event delegation for the client table
     * This allows us to handle events for dynamically added elements
     */
    function setupEventDelegation() {
        // Use event delegation for edit and delete buttons
        const clientsTableBody = document.getElementById('clientsTableBody');
        if (clientsTableBody) {
            clientsTableBody.addEventListener('click', function(event) {
                // Find the closest button to the clicked element
                const button = event.target.closest('button');
                if (!button) return; // Not a button click
                
                // Get client ID from the button's data attribute
                const clientId = button.getAttribute('data-client-id');
                if (!clientId) return; // No client ID found
                
                // Handle edit button click
                if (button.classList.contains('edit-client-btn')) {
                    openEditClientModal(clientId);
                }
                
                // Handle delete button click
                if (button.classList.contains('delete-client-btn')) {
                    if (confirm('هل أنت متأكد من حذف هذا العميل؟')) {
                        deleteClient(clientId);
                    }
                }
            });
        }
    }

    /**
     * Load clients from the backend API
     * @param {Object} filters - Optional filters for searching clients
     */
    async function loadClients(filters = {}) {
        try {
            if (!authMiddleware.isAdminLoggedIn()) {
                throw new Error('غير مصرح لك بعرض بيانات العملاء');
            }
            
            // Show loading indicator
            const tableBody = document.getElementById('clientsTableBody');
            if (tableBody) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="8" class="text-center py-5">
                            <div class="spinner-border text-primary" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                            <p class="mt-2 mb-0">جاري تحميل البيانات...</p>
                        </td>
                    </tr>
                `;
            }
            
            // Build query string for filters
            let queryParams = '';
            if (Object.keys(filters).length > 0) {
                queryParams = '?' + Object.entries(filters)
                    .filter(([_, value]) => value) // Only include non-empty values
                    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
                    .join('&');
            }
            
            // Use ApiService's getClients method
            console.log('Fetching clients with filters:', filters);
            let data;
            try {
                // First try to get apiService from window global if it's not directly available
                const service = typeof apiService !== 'undefined' ? apiService : 
                              (window && window.apiService) ? window.apiService : null;
                
                if (service && typeof service.getClients === 'function') {
                    data = await service.getClients();
                } else {
                    // Wait a moment in case apiService is being initialized asynchronously
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    // Try one more time
                    const retryService = typeof apiService !== 'undefined' ? apiService : 
                                      (window && window.apiService) ? window.apiService : null;
                                      
                    if (retryService && typeof retryService.getClients === 'function') {
                        data = await retryService.getClients();
                    } else {
                        throw new Error('API service not available or not initialized yet');
                    }
                }
                console.log('Clients data received:', data);
            } catch (apiError) {
                console.error('Error calling API service:', apiError);
                throw apiError; // Re-throw to be caught by the outer try-catch
            }
            
            // Check if data has clients property or if the response is an array
            let allClients = [];
            if (Array.isArray(data)) {
                allClients = data;
            } else if (data && data.clients && Array.isArray(data.clients)) {
                allClients = data.clients;
            } else {
                console.warn('Unexpected clients data format:', data);
                allClients = [];
            }
            
            // Store all clients for client-side filtering
            clientsData = allClients;
            
            // Apply client-side filters if provided
            if (Object.keys(filters).length > 0) {
                filterClientsLocally(filters);
            } else {
                displayClients(clientsData);
            }
        } catch (error) {
            console.error('Error loading clients:', error);
            // If API fails, try to load from mock data
            clientsData = getMockClients();
            displayClients(clientsData);
        }
    }
    
    /**
     * Get mock clients data for fallback
     * @returns {Array} Array of mock client objects
     */
    function getMockClients() {
        return [
            {
                id: 1,
                name: 'أحمد محمد',
                phone: '0501234567',
                email: 'ahmed@example.com',
                address: 'الرياض، السعودية',
                status: 'active',
                createdAt: new Date().toISOString()
            },
            {
                id: 2,
                name: 'سارة علي',
                phone: '0509876543',
                email: 'sara@example.com',
                address: 'جدة، السعودية',
                status: 'active',
                createdAt: new Date().toISOString()
            },
            {
                id: 3,
                name: 'محمود خالد',
                phone: '0553219876',
                email: 'mahmoud@example.com',
                address: 'الدمام، السعودية',
                status: 'inactive',
                createdAt: new Date().toISOString()
            }
        ];
    }
    
    /**
     * Display clients in the table
     * @param {Array} clients - Array of client objects
     * @param {boolean} updatePagination - Whether to update pagination controls
     */
    function displayClients(clients, updatePagination = true) {
        const tableBody = document.getElementById('clientsTableBody');
        if (!tableBody) return;
        
        // Sort clients by creation date (newest first)
        const sortedClients = [...clients].sort((a, b) => {
            const dateA = new Date(a.createdAt || 0);
            const dateB = new Date(b.createdAt || 0);
            return dateB - dateA; // Descending order (newest first)
        });
        
        // Store all clients for pagination
        if (updatePagination) {
            clientsData = sortedClients;
            totalClients = sortedClients.length;
            // Reset to first page when new data is loaded
            currentPage = 1;
        }
        
        // Clear existing rows
        tableBody.innerHTML = '';
        
        if (sortedClients.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-5">
                        <i class="fas fa-users fa-3x mb-3 text-muted"></i>
                        <p class="mb-0">لا يوجد عملاء للعرض</p>
                    </td>
                </tr>
            `;
            
            // Hide pagination if no clients
            const paginationContainer = document.getElementById('clientsPagination');
            if (paginationContainer) {
                paginationContainer.parentElement.classList.add('d-none');
            }
            return;
        }
        
        // Show pagination if we have clients
        const paginationContainer = document.getElementById('clientsPagination');
        if (paginationContainer) {
            paginationContainer.parentElement.classList.remove('d-none');
        }
        
        // Calculate pagination
        const startIndex = (currentPage - 1) * CLIENTS_PER_PAGE;
        const endIndex = Math.min(startIndex + CLIENTS_PER_PAGE, sortedClients.length);
        const paginatedClients = sortedClients.slice(startIndex, endIndex);
        
        // Update pagination controls if needed
        if (updatePagination) {
            updatePaginationControls();
        }
        
        // Add client rows for current page only
        paginatedClients.forEach((client, index) => {
            const row = document.createElement('tr');
            
            // Format date
            let createdAt = 'غير محدد';
            if (client.createdAt) {
                const date = new Date(client.createdAt);
                const year = date.getFullYear();
                const month = ('0' + (date.getMonth() + 1)).slice(-2); // getMonth() is 0-indexed
                const day = ('0' + date.getDate()).slice(-2);
                createdAt = `${year}-${month}-${day}`;
            }
            
            // Status badge class
            const statusClass = client.status === 'active' ? 'bg-success' : 'bg-secondary';
            const statusText = client.status === 'active' ? 'نشط' : 'غير نشط';
            
            // Calculate the correct row number based on pagination
            const rowNumber = (currentPage - 1) * CLIENTS_PER_PAGE + index + 1;
            
            row.innerHTML = `
                <td class="py-3">${rowNumber}</td>
                <td class="py-3">${client.name || 'غير محدد'}</td>
                <td class="py-3">${client.phone || 'غير محدد'}</td>
                <td class="py-3">${client.email || 'غير محدد'}</td>
                <td class="py-3">${client.address || 'غير محدد'}</td>
                <td class="py-3">
                    <span class="badge ${statusClass}">${statusText}</span>
                </td>
                <td class="py-3">${createdAt}</td>
                <td class="py-3">
                    <div class="d-flex">
                        <button class="btn btn-sm btn-outline-primary me-2 edit-client-btn" data-client-id="${client.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger delete-client-btn" data-client-id="${client.id}">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
        
        // We no longer add event listeners here since we're using event delegation
    }
    
    /**
     * Open the edit client modal and populate with client data
     * @param {string} clientId - ID of the client to edit
     */
    function openEditClientModal(clientId) {
        const client = clientsData.find(c => c.id == clientId);
        if (!client) {
            console.error('Client not found with ID:', clientId);
            return;
        }
        
        // Set form values
        document.getElementById('editClientId').value = client.id;
        document.getElementById('editClientName').value = client.name || '';
        document.getElementById('editClientPhone').value = client.phone || '';
        document.getElementById('editClientEmail').value = client.email || '';
        document.getElementById('editClientAddress').value = client.address || '';
        
        // Set status radio button
        if (client.status === 'active') {
            document.getElementById('editStatusActive').checked = true;
        } else {
            document.getElementById('editStatusInactive').checked = true;
        }
        
        // Open modal
        const modal = new bootstrap.Modal(document.getElementById('editClientModal'));
        modal.show();
    }
    
    /**
     * Delete a client
     * @param {string} clientId - ID of the client to delete
     */
    async function deleteClient(clientId) {
        try {
            if (!authMiddleware.isAdminLoggedIn()) {
                throw new Error('غير مصرح لك بحذف العملاء');
            }
            
            // Use ApiService's deleteClient method
            if (typeof apiService !== 'undefined' && typeof apiService.deleteClient === 'function') {
                await apiService.deleteClient(clientId);
            } else {
                throw new Error('API service not available');
            }
            
            // Show success message
            alert('تم حذف العميل بنجاح');
            
            // Always reload all clients from the API to ensure we have the latest data
            try {
                // Force a complete reload of clients from API
                await loadClients();
                console.log('Successfully refreshed client data after deleting client');
            } catch (refreshError) {
                console.warn('Error refreshing client data, using local update:', refreshError);
                // Fall back to local update if API refresh fails
                const index = clientsData.findIndex(c => c.id == clientId);
                if (index !== -1) {
                    clientsData.splice(index, 1);
                    displayClients(clientsData);
                }
            }
        } catch (error) {
            console.error('Error deleting client:', error);
            alert(`خطأ: ${error.message}`);
        }
    }
    
    /**
     * Get mock clients for testing
     * @returns {Array} Array of mock client objects
     */
    function getMockClients() {
        return [
            {
                id: 1,
                name: 'أحمد محمد السيد',
                phone: '+966 50 123 4567',
                email: 'ahmed@example.com',
                address: 'الرياض، المملكة العربية السعودية',
                status: 'active',
                createdAt: new Date().toISOString()
            },
            {
                id: 2,
                name: 'سارة علي عبدالله',
                phone: '+966 54 987 6543',
                email: 'sara@example.com',
                address: 'جدة، المملكة العربية السعودية',
                status: 'active',
                createdAt: new Date().toISOString()
            },
            {
                id: 3,
                name: 'محمود خالد سعيد',
                phone: '+966 55 321 9876',
                email: 'mahmoud@example.com',
                address: 'الدمام، المملكة العربية السعودية',
                status: 'inactive',
                createdAt: new Date().toISOString()
            }
        ];
    }
    
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
    
    /**
     * Initialize pagination functionality
     */
    function initPagination() {
        // Get pagination elements
        const prevPageBtn = document.querySelector('#clientsPagination .page-item:first-child .page-link');
        const nextPageBtn = document.querySelector('#clientsPagination .page-item:last-child .page-link');
        
        // Add event listeners for pagination controls
        if (prevPageBtn) {
            prevPageBtn.addEventListener('click', function(e) {
                e.preventDefault();
                if (currentPage > 1) {
                    currentPage--;
                    displayClients(clientsData, false);
                    updatePaginationControls();
                }
            });
        }
        
        if (nextPageBtn) {
            nextPageBtn.addEventListener('click', function(e) {
                e.preventDefault();
                const totalPages = Math.ceil(totalClients / CLIENTS_PER_PAGE);
                if (currentPage < totalPages) {
                    currentPage++;
                    displayClients(clientsData, false);
                    updatePaginationControls();
                }
            });
        }
    }

    /**
     * Update pagination controls based on current page and total clients
     */
    function updatePaginationControls() {
        const paginationContainer = document.getElementById('clientsPagination');
        if (!paginationContainer) return;
        
        // Calculate total pages
        const totalPages = Math.ceil(totalClients / CLIENTS_PER_PAGE);
        
        // Clear existing page number buttons (keep prev/next buttons)
        const pageItems = paginationContainer.querySelectorAll('.page-item');
        for (let i = 1; i < pageItems.length - 1; i++) {
            pageItems[i].remove();
        }
        
        // Get prev/next buttons
        const prevPageItem = paginationContainer.querySelector('.page-item:first-child');
        const nextPageItem = paginationContainer.querySelector('.page-item:last-child');
        
        // Create page number buttons
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        // Adjust if we're near the end
        if (endPage - startPage + 1 < maxVisiblePages && startPage > 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        // Create page number elements
        for (let i = startPage; i <= endPage; i++) {
            const pageItem = document.createElement('li');
            pageItem.className = `page-item${i === currentPage ? ' active' : ''}`;
            
            const pageLink = document.createElement('a');
            pageLink.className = 'page-link';
            pageLink.href = '#';
            pageLink.textContent = i;
            
            // Add click event
            pageLink.addEventListener('click', function(e) {
                e.preventDefault();
                currentPage = i;
                displayClients(clientsData, false);
                updatePaginationControls();
            });
            
            pageItem.appendChild(pageLink);
            
            // Insert before the next button
            paginationContainer.insertBefore(pageItem, nextPageItem);
        }
        
        // Update prev/next button states
        if (prevPageItem) {
            if (currentPage <= 1) {
                prevPageItem.classList.add('disabled');
            } else {
                prevPageItem.classList.remove('disabled');
            }
        }
        
        if (nextPageItem) {
            if (currentPage >= totalPages) {
                nextPageItem.classList.add('disabled');
            } else {
                nextPageItem.classList.remove('disabled');
            }
        }
    }
});
