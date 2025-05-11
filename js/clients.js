/**
 * Laapak Report System - Clients Management JavaScript
 * Handles client management functionality and initializes the header component
 * Updated to use Laravel API service
 */

// Store clients data globally to make it accessible across functions
let clientsData = [];

document.addEventListener('DOMContentLoaded', function() {
    // Check if admin is logged in
    if (!apiService.isLoggedIn('admin')) {
        console.log('Admin not logged in, redirecting to login page');
        window.location.href = 'index.html';
        return;
    }

    // Initialize the header component
    const header = new LpkHeader('header-container', {
        showLogo: true,
        logoPath: 'img/logo.png',
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
                apiService.logout('admin');
                window.location.href = 'index.html';
            }}
        ]
    });

    // Load clients from the backend
    loadClients();
    
    // Set up event delegation for client table actions
    setupEventDelegation();

    // Form submission for client search
    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const searchName = document.getElementById('searchName').value;
            const searchStatus = document.getElementById('searchStatus').value;
            const searchDate = document.getElementById('searchDate').value;
            
            // Search clients with filters
            loadClients({
                name: searchName,
                status: searchStatus,
                date: searchDate
            });
        });
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
                if (!apiService.isLoggedIn('admin')) {
                    throw new Error('غير مصرح لك بإضافة عملاء');
                }
                
                // Use Laravel API service to create client
                const newClient = await apiService.createClient({
                    name: clientName,
                    phone: clientPhone,
                    email: clientEmail,
                    address: clientAddress,
                    order_code: clientOrderCode,
                    status: clientStatus
                });
                
                // Show success message and close modal
                alert('تم إضافة العميل بنجاح');
                const modal = bootstrap.Modal.getInstance(document.getElementById('addClientModal'));
                if (modal) {
                    modal.hide();
                }
                document.getElementById('addClientForm').reset();
                
                // Reload clients from API
                await loadClients();
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
                if (!apiService.isLoggedIn('admin')) {
                    throw new Error('غير مصرح لك بتعديل بيانات العملاء');
                }
                
                // Use Laravel API service to update client
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
                
                // Reload clients from API
                await loadClients();
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
                if (!clientId) return;
                
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
     * Load clients from the Laravel API
     * @param {Object} filters - Optional filters for clients
     */
    async function loadClients(filters = {}) {
        try {
            // Check if admin is logged in
            if (!apiService.isLoggedIn('admin')) {
                throw new Error('غير مصرح لك بعرض بيانات العملاء');
            }
            
            // Show loading state
            document.getElementById('clientsTableBody').innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-4">
                        <div class="d-flex justify-content-center">
                            <div class="spinner-border text-primary" role="status">
                                <span class="visually-hidden">جاري التحميل...</span>
                            </div>
                        </div>
                        <p class="mt-2">جاري تحميل بيانات العملاء...</p>
                    </td>
                </tr>
            `;
            
            // Fetch clients from Laravel API
            const response = await apiService.getClients(filters);
            
            if (response.error) {
                throw new Error(response.message || 'حدث خطأ أثناء تحميل بيانات العملاء');
            }
            
            // Process the response data
            if (Array.isArray(response)) {
                clientsData = response;
            } else if (response.data && Array.isArray(response.data)) {
                clientsData = response.data;
            } else if (response.clients && Array.isArray(response.clients)) {
                clientsData = response.clients;
            } else {
                console.warn('Unexpected clients data format:', response);
                clientsData = [];
            }
            
            // Display clients in the table
            displayClients(clientsData);
            
            // Update pagination if available
            if (response.meta && response.meta.pagination) {
                updatePagination(response.meta.pagination);
            }
        } catch (error) {
            console.error('Error loading clients:', error);
            document.getElementById('clientsTableBody').innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-4">
                        <div class="alert alert-danger">
                            <i class="fas fa-exclamation-triangle me-2"></i>
                            ${error.message || 'حدث خطأ أثناء تحميل بيانات العملاء'}
                        </div>
                    </td>
                </tr>
            `;
            
            // If API fails, try to load from mock data for development purposes
            if (window.location.hostname === 'localhost') {
                clientsData = getMockClients();
                displayClients(clientsData);
            }
        }
    }
    
    /**
     * Display clients in the table
     * @param {Array} clients - Array of client objects
     */
    function displayClients(clients) {
        const tableBody = document.getElementById('clientsTableBody');
        if (!tableBody) return;
        
        if (!clients || clients.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-4">
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle me-2"></i>
                            لا يوجد عملاء لعرضهم
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        // Generate table rows for each client
        let html = '';
        clients.forEach((client, index) => {
            const statusClass = client.status === 'active' ? 'bg-success' : 'bg-secondary';
            const statusText = client.status === 'active' ? 'نشط' : 'غير نشط';
            const createdAt = new Date(client.created_at || client.createdAt || new Date()).toLocaleDateString('ar-SA');
            
            html += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${client.name || ''}</td>
                    <td>${client.phone || ''}</td>
                    <td>${client.email || ''}</td>
                    <td>${client.address || ''}</td>
                    <td><span class="badge ${statusClass}">${statusText}</span></td>
                    <td>${createdAt}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary edit-client-btn me-1" data-client-id="${client.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger delete-client-btn" data-client-id="${client.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        tableBody.innerHTML = html;
    }
    
    /**
     * Open edit client modal and populate with client data
     * @param {string|number} clientId - Client ID
     */
    async function openEditClientModal(clientId) {
        try {
            // Find client in the cached data first
            let client = clientsData.find(c => c.id == clientId);
            
            // If not found in cache, fetch from API
            if (!client) {
                const response = await apiService.getClient(clientId);
                if (response.error) {
                    throw new Error(response.message || 'حدث خطأ أثناء تحميل بيانات العميل');
                }
                client = response.data || response;
            }
            
            if (!client) {
                throw new Error('لم يتم العثور على العميل');
            }
            
            // Populate form fields
            document.getElementById('editClientId').value = client.id;
            document.getElementById('editClientName').value = client.name || '';
            document.getElementById('editClientPhone').value = client.phone || '';
            document.getElementById('editClientEmail').value = client.email || '';
            document.getElementById('editClientAddress').value = client.address || '';
            
            // Set status radio button
            const statusActive = document.getElementById('editStatusActive');
            const statusInactive = document.getElementById('editStatusInactive');
            if (client.status === 'active') {
                statusActive.checked = true;
            } else {
                statusInactive.checked = true;
            }
            
            // Show the modal
            const modal = new bootstrap.Modal(document.getElementById('editClientModal'));
            modal.show();
        } catch (error) {
            console.error('Error opening edit modal:', error);
            alert(`خطأ: ${error.message}`);
        }
    }
    
    /**
     * Delete a client
     * @param {string|number} clientId - Client ID
     */
    async function deleteClient(clientId) {
        try {
            if (!apiService.isLoggedIn('admin')) {
                throw new Error('غير مصرح لك بحذف العملاء');
            }
            
            // Delete client using Laravel API service
            const response = await apiService.deleteClient(clientId);
            
            if (response.error) {
                throw new Error(response.message || 'حدث خطأ أثناء حذف العميل');
            }
            
            // Show success message
            alert('تم حذف العميل بنجاح');
            
            // Reload clients from API
            await loadClients();
        } catch (error) {
            console.error('Error deleting client:', error);
            alert(`خطأ: ${error.message}`);
        }
    }
    
    /**
     * Update pagination controls
     * @param {Object} pagination - Pagination metadata
     */
    function updatePagination(pagination) {
        const paginationContainer = document.getElementById('clientsPagination');
        if (!paginationContainer) return;
        
        const { current_page, last_page, total } = pagination;
        
        // Generate pagination HTML
        let html = `
            <div class="d-flex justify-content-between align-items-center">
                <p class="mb-0">إجمالي: ${total} عميل</p>
                <ul class="pagination mb-0">
        `;
        
        // Previous page button
        html += `
            <li class="page-item ${current_page === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${current_page - 1}" aria-label="Previous">
                    <span aria-hidden="true">&laquo;</span>
                </a>
            </li>
        `;
        
        // Page numbers
        for (let i = 1; i <= last_page; i++) {
            html += `
                <li class="page-item ${i === current_page ? 'active' : ''}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `;
        }
        
        // Next page button
        html += `
            <li class="page-item ${current_page === last_page ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${current_page + 1}" aria-label="Next">
                    <span aria-hidden="true">&raquo;</span>
                </a>
            </li>
        `;
        
        html += `
                </ul>
            </div>
        `;
        
        paginationContainer.innerHTML = html;
        
        // Add event listeners to pagination links
        const pageLinks = paginationContainer.querySelectorAll('.page-link');
        pageLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const page = this.getAttribute('data-page');
                if (page) {
                    loadClients({ page });
                }
            });
        });
    }
    
    /**
     * Get mock clients data for development purposes
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
     */
    function displayClients(clients) {
        const tableBody = document.getElementById('clientsTableBody');
        if (!tableBody) return;
        
        // Clear existing rows
        tableBody.innerHTML = '';
        
        if (clients.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-5">
                        <i class="fas fa-users fa-3x mb-3 text-muted"></i>
                        <p class="mb-0">لا يوجد عملاء للعرض</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        // Add client rows
        clients.forEach((client, index) => {
            const row = document.createElement('tr');
            
            // Format date
            const createdAt = client.createdAt ? new Date(client.createdAt).toLocaleDateString('ar-SA') : 'غير محدد';
            
            // Status badge class
            const statusClass = client.status === 'active' ? 'bg-success' : 'bg-secondary';
            const statusText = client.status === 'active' ? 'نشط' : 'غير نشط';
            
            row.innerHTML = `
                <td class="py-3">${index + 1}</td>
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
});
