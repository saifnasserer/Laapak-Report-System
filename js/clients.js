/**
 * Laapak Report System - Clients Management JavaScript
 * Handles client management functionality and initializes the header component
 */

// API URLs
const API_BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:3000/api' : '/api';
const CLIENTS_API_URL = `${API_BASE_URL}/clients`;

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
                authMiddleware.logout();
                // No need to redirect as auth-middleware.logout() handles it
            }}
        ]
    });

    // Load clients from the backend
    loadClients();

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
                if (!authMiddleware.isAdminLoggedIn()) {
                    throw new Error('غير مصرح لك بإضافة عملاء');
                }
                
                // Use ApiService to create client
                await apiService.createClient({
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
                
                // Reload clients
                loadClients();
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
                
                // Use ApiService to update client
                await apiService.updateClient(clientId, {
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
                
                // Reload clients
                loadClients();
            } catch (error) {
                console.error('Error updating client:', error);
                alert(`خطأ: ${error.message}`);
            }
        });
    }

    // Handle client actions (view, edit, share, delete)
    document.querySelectorAll('.dropdown-menu .dropdown-item').forEach(item => {
        item.addEventListener('click', function(e) {
            if (e.currentTarget.textContent.includes('حذف')) {
                e.preventDefault();
                if (confirm('هل أنت متأكد من حذف هذا العميل؟')) {
                    // In a real implementation, this would delete the client
                    console.log('Client deleted');
                }
            }
        });
    });

    /**
     * Load clients from the backend API
     * @param {Object} filters - Optional filters for searching clients
     */
    async function loadClients(filters = {}) {
        try {
            if (!authMiddleware.isAdminLoggedIn()) {
                throw new Error('غير مصرح لك بعرض بيانات العملاء');
            }
            
            // Use ApiService to get clients
            const data = await apiService.getClients(filters);
            displayClients(data.clients || []);
        } catch (error) {
            console.error('Error loading clients:', error);
            // If API fails, try to load from mock data
            displayClients(getMockClients());
        }
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
        
        // Add event listeners to edit buttons
        const editButtons = document.querySelectorAll('.edit-client-btn');
        editButtons.forEach(button => {
            button.addEventListener('click', function() {
                const clientId = this.getAttribute('data-client-id');
                openEditClientModal(clientId, clients);
            });
        });
        
        // Add event listeners to delete buttons
        const deleteButtons = document.querySelectorAll('.delete-client-btn');
        deleteButtons.forEach(button => {
            button.addEventListener('click', function() {
                const clientId = this.getAttribute('data-client-id');
                if (confirm('هل أنت متأكد من حذف هذا العميل؟')) {
                    deleteClient(clientId);
                }
            });
        });
    }
    
    /**
     * Open the edit client modal and populate with client data
     * @param {string} clientId - ID of the client to edit
     * @param {Array} clients - Array of client objects
     */
    function openEditClientModal(clientId, clients) {
        const client = clients.find(c => c.id == clientId);
        if (!client) return;
        
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
            
            // Use ApiService to delete client
            await apiService.deleteClient(clientId);
            
            // Show success message
            alert('تم حذف العميل بنجاح');
            
            // Reload clients
            loadClients();
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
