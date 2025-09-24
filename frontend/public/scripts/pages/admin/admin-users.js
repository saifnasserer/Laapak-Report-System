/**
 * Laapak Report System - Admin Users Management
 * Handles user management functionality in the admin dashboard
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize auth middleware
    if (!authMiddleware.requireAdminAuth()) {
        return; // Stop execution if not authenticated as admin
    }
    
    // Update UI with admin info
    authMiddleware.updateUserUI('admin-name', 'admin-role');
    
    // API endpoints
    const API_URL = window.config ? window.config.api.baseUrl : window.location.origin;
    const ADMINS_URL = `${API_URL}/api/users/admins`;
    const CLIENTS_URL = `${API_URL}/api/users/clients`;
    
    // DOM elements
    const adminTableBody = document.getElementById('admin-users-table-body');
    const clientTableBody = document.getElementById('client-users-table-body');
    const addAdminForm = document.getElementById('add-admin-form');
    const addClientForm = document.getElementById('add-client-form');
    const adminUsersTab = document.getElementById('admin-users-tab');
    const clientUsersTab = document.getElementById('client-users-tab');
    
    // Get admin token
    const getToken = () => {
        return localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
    };
    
    // Show error message
    const showError = (message, containerId) => {
        const container = document.getElementById(containerId);
        if (container) {
            const alertDiv = document.createElement('div');
            alertDiv.className = 'alert alert-danger alert-dismissible fade show';
            alertDiv.role = 'alert';
            alertDiv.innerHTML = `
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            `;
            container.appendChild(alertDiv);
            
            // Auto dismiss after 5 seconds
            setTimeout(() => {
                alertDiv.classList.remove('show');
                setTimeout(() => alertDiv.remove(), 150);
            }, 5000);
        }
    };
    
    // Show success message
    const showSuccess = (message, containerId) => {
        const container = document.getElementById(containerId);
        if (container) {
            const alertDiv = document.createElement('div');
            alertDiv.className = 'alert alert-success alert-dismissible fade show';
            alertDiv.role = 'alert';
            alertDiv.innerHTML = `
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            `;
            container.appendChild(alertDiv);
            
            // Auto dismiss after 5 seconds
            setTimeout(() => {
                alertDiv.classList.remove('show');
                setTimeout(() => alertDiv.remove(), 150);
            }, 5000);
        }
    };
    
    // Load admin users
    const loadAdminUsers = async () => {
        try {
            const response = await fetch(ADMINS_URL, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': getToken()
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to load admin users');
            }
            
            const admins = await response.json();
            
            // Clear table body
            adminTableBody.innerHTML = '';
            
            // Add admin rows
            admins.forEach(admin => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${admin.id}</td>
                    <td>${admin.name}</td>
                    <td>${admin.username}</td>
                    <td>${admin.role}</td>
                    <td>${admin.email || '-'}</td>
                    <td>${new Date(admin.createdAt).toLocaleDateString()}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary edit-admin-btn" data-id="${admin.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger delete-admin-btn" data-id="${admin.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                adminTableBody.appendChild(row);
            });
            
            // Add event listeners to edit buttons
            document.querySelectorAll('.edit-admin-btn').forEach(button => {
                button.addEventListener('click', function() {
                    const adminId = this.getAttribute('data-id');
                    openEditAdminModal(adminId);
                });
            });
            
            // Add event listeners to delete buttons
            document.querySelectorAll('.delete-admin-btn').forEach(button => {
                button.addEventListener('click', function() {
                    const adminId = this.getAttribute('data-id');
                    confirmDeleteAdmin(adminId);
                });
            });
        } catch (error) {
            console.error('Error loading admin users:', error);
            showError('فشل في تحميل بيانات المستخدمين الإداريين', 'admin-alerts');
        }
    };
    
    // Load client users
    const loadClientUsers = async () => {
        try {
            const response = await fetch(CLIENTS_URL, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': getToken()
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to load client users');
            }
            
            const clients = await response.json();
            
            // Clear table body
            clientTableBody.innerHTML = '';
            
            // Add client rows
            clients.forEach(client => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${client.id}</td>
                    <td>${client.name}</td>
                    <td>${client.phone}</td>
                    <td>${client.orderCode}</td>
                    <td>${client.email || '-'}</td>
                    <td>${new Date(client.createdAt).toLocaleDateString()}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary edit-client-btn" data-id="${client.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger delete-client-btn" data-id="${client.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                clientTableBody.appendChild(row);
            });
            
            // Add event listeners to edit buttons
            document.querySelectorAll('.edit-client-btn').forEach(button => {
                button.addEventListener('click', function() {
                    const clientId = this.getAttribute('data-id');
                    openEditClientModal(clientId);
                });
            });
            
            // Add event listeners to delete buttons
            document.querySelectorAll('.delete-client-btn').forEach(button => {
                button.addEventListener('click', function() {
                    const clientId = this.getAttribute('data-id');
                    confirmDeleteClient(clientId);
                });
            });
        } catch (error) {
            console.error('Error loading client users:', error);
            showError('فشل في تحميل بيانات العملاء', 'client-alerts');
        }
    };
    
    // Add new admin
    const addAdmin = async (event) => {
        event.preventDefault();
        
        const username = document.getElementById('admin-username').value;
        const password = document.getElementById('admin-password').value;
        const name = document.getElementById('admin-name-input').value;
        const role = document.getElementById('admin-role-input').value;
        const email = document.getElementById('admin-email').value;
        
        try {
            const response = await fetch(ADMINS_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': getToken()
                },
                body: JSON.stringify({
                    username,
                    password,
                    name,
                    role,
                    email
                })
            });
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to add admin user');
            }
            
            // Reset form
            addAdminForm.reset();
            
            // Show success message
            showSuccess('تم إضافة المستخدم الإداري بنجاح', 'admin-alerts');
            
            // Reload admin users
            loadAdminUsers();
        } catch (error) {
            console.error('Error adding admin user:', error);
            showError(error.message || 'فشل في إضافة المستخدم الإداري', 'admin-alerts');
        }
    };
    
    // Add new client
    const addClient = async (event) => {
        event.preventDefault();
        
        const name = document.getElementById('client-name-input').value;
        const phone = document.getElementById('client-phone').value;
        const orderCode = document.getElementById('client-order-code').value;
        const email = document.getElementById('client-email').value;
        const address = document.getElementById('client-address').value;
        
        try {
            const response = await fetch(CLIENTS_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': getToken()
                },
                body: JSON.stringify({
                    name,
                    phone,
                    orderCode,
                    email,
                    address
                })
            });
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to add client user');
            }
            
            // Reset form
            addClientForm.reset();
            
            // Show success message
            showSuccess('تم إضافة العميل بنجاح', 'client-alerts');
            
            // Reload client users
            loadClientUsers();
        } catch (error) {
            console.error('Error adding client user:', error);
            showError(error.message || 'فشل في إضافة العميل', 'client-alerts');
        }
    };
    
    // Open edit admin modal
    const openEditAdminModal = async (adminId) => {
        try {
            const response = await fetch(`${ADMINS_URL}/${adminId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': getToken()
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to load admin details');
            }
            
            const admin = await response.json();
            
            // Populate modal form
            document.getElementById('edit-admin-id').value = admin.id;
            document.getElementById('edit-admin-username').value = admin.username;
            document.getElementById('edit-admin-name').value = admin.name;
            document.getElementById('edit-admin-role').value = admin.role;
            document.getElementById('edit-admin-email').value = admin.email || '';
            
            // Show modal
            const editAdminModal = new bootstrap.Modal(document.getElementById('editAdminModal'));
            editAdminModal.show();
        } catch (error) {
            console.error('Error loading admin details:', error);
            showError('فشل في تحميل بيانات المستخدم الإداري', 'admin-alerts');
        }
    };
    
    // Open edit client modal
    const openEditClientModal = async (clientId) => {
        try {
            const response = await fetch(`${CLIENTS_URL}/${clientId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': getToken()
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to load client details');
            }
            
            const client = await response.json();
            
            // Populate modal form
            document.getElementById('edit-client-id').value = client.id;
            document.getElementById('edit-client-name').value = client.name;
            document.getElementById('edit-client-phone').value = client.phone;
            document.getElementById('edit-client-order-code').value = client.orderCode;
            document.getElementById('edit-client-email').value = client.email || '';
            document.getElementById('edit-client-address').value = client.address || '';
            
            // Show modal
            const editClientModal = new bootstrap.Modal(document.getElementById('editClientModal'));
            editClientModal.show();
        } catch (error) {
            console.error('Error loading client details:', error);
            showError('فشل في تحميل بيانات العميل', 'client-alerts');
        }
    };
    
    // Update admin
    const updateAdmin = async (event) => {
        event.preventDefault();
        
        const adminId = document.getElementById('edit-admin-id').value;
        const name = document.getElementById('edit-admin-name').value;
        const role = document.getElementById('edit-admin-role').value;
        const email = document.getElementById('edit-admin-email').value;
        const password = document.getElementById('edit-admin-password').value;
        
        try {
            const data = {
                name,
                role,
                email
            };
            
            // Only include password if provided
            if (password) {
                data.password = password;
            }
            
            const response = await fetch(`${ADMINS_URL}/${adminId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': getToken()
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update admin user');
            }
            
            // Hide modal
            const editAdminModal = bootstrap.Modal.getInstance(document.getElementById('editAdminModal'));
            editAdminModal.hide();
            
            // Show success message
            showSuccess('تم تحديث بيانات المستخدم الإداري بنجاح', 'admin-alerts');
            
            // Reload admin users
            loadAdminUsers();
        } catch (error) {
            console.error('Error updating admin user:', error);
            showError(error.message || 'فشل في تحديث بيانات المستخدم الإداري', 'admin-alerts');
        }
    };
    
    // Update client
    const updateClient = async (event) => {
        event.preventDefault();
        
        const clientId = document.getElementById('edit-client-id').value;
        const name = document.getElementById('edit-client-name').value;
        const phone = document.getElementById('edit-client-phone').value;
        const orderCode = document.getElementById('edit-client-order-code').value;
        const email = document.getElementById('edit-client-email').value;
        const address = document.getElementById('edit-client-address').value;
        
        try {
            const response = await fetch(`${CLIENTS_URL}/${clientId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': getToken()
                },
                body: JSON.stringify({
                    name,
                    phone,
                    orderCode,
                    email,
                    address
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update client user');
            }
            
            // Hide modal
            const editClientModal = bootstrap.Modal.getInstance(document.getElementById('editClientModal'));
            editClientModal.hide();
            
            // Show success message
            showSuccess('تم تحديث بيانات العميل بنجاح', 'client-alerts');
            
            // Reload client users
            loadClientUsers();
        } catch (error) {
            console.error('Error updating client user:', error);
            showError(error.message || 'فشل في تحديث بيانات العميل', 'client-alerts');
        }
    };
    
    // Confirm delete admin
    const confirmDeleteAdmin = (adminId) => {
        if (confirm('هل أنت متأكد من حذف هذا المستخدم الإداري؟')) {
            deleteAdmin(adminId);
        }
    };
    
    // Delete admin
    const deleteAdmin = async (adminId) => {
        try {
            const response = await fetch(`${ADMINS_URL}/${adminId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': getToken()
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete admin user');
            }
            
            // Show success message
            showSuccess('تم حذف المستخدم الإداري بنجاح', 'admin-alerts');
            
            // Reload admin users
            loadAdminUsers();
        } catch (error) {
            console.error('Error deleting admin user:', error);
            showError(error.message || 'فشل في حذف المستخدم الإداري', 'admin-alerts');
        }
    };
    
    // Confirm delete client
    const confirmDeleteClient = (clientId) => {
        if (confirm('هل أنت متأكد من حذف هذا العميل؟')) {
            deleteClient(clientId);
        }
    };
    
    // Delete client
    const deleteClient = async (clientId) => {
        try {
            const response = await fetch(`${CLIENTS_URL}/${clientId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': getToken()
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete client user');
            }
            
            // Show success message
            showSuccess('تم حذف العميل بنجاح', 'client-alerts');
            
            // Reload client users
            loadClientUsers();
        } catch (error) {
            console.error('Error deleting client user:', error);
            showError(error.message || 'فشل في حذف العميل', 'client-alerts');
        }
    };
    
    // Event listeners
    if (addAdminForm) {
        addAdminForm.addEventListener('submit', addAdmin);
    }
    
    if (addClientForm) {
        addClientForm.addEventListener('submit', addClient);
    }
    
    // Edit form submit handlers
    document.getElementById('edit-admin-form').addEventListener('submit', updateAdmin);
    document.getElementById('edit-client-form').addEventListener('submit', updateClient);
    
    // Tab change handlers
    if (adminUsersTab) {
        adminUsersTab.addEventListener('shown.bs.tab', loadAdminUsers);
    }
    
    if (clientUsersTab) {
        clientUsersTab.addEventListener('shown.bs.tab', loadClientUsers);
    }
    
    // Initial load
    if (adminTableBody) {
        loadAdminUsers();
    }
    
    if (clientTableBody) {
        loadClientUsers();
    }
});
