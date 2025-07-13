/**
 * Clients Management JavaScript
 * Handles client listing, search, and management
 */

// Global variables
let allClients = [];
let filteredClients = [];
let currentPage = 1;
const clientsPerPage = 50; // Show 50 clients per page to show all clients

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔍 [DEBUG] Clients page initialized');
    
    // Initialize components
    initSearch();
    initEventListeners();
    
    // Load clients
    loadClients();
});

/**
 * Initialize search functionality
 */
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.trim().toLowerCase();
            filterClients(searchTerm);
        });
    }
    
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', function() {
            if (searchInput) {
                searchInput.value = '';
                filterClients('');
            }
        });
    }
}

/**
 * Initialize event listeners
 */
function initEventListeners() {
    // Add client button
    const addClientBtn = document.querySelector('[data-bs-target="#addClientModal"]');
    if (addClientBtn) {
        addClientBtn.addEventListener('click', function() {
            // Reset form
                document.getElementById('addClientForm').reset();
        });
    }
    
    // Save client button
    const saveClientBtn = document.getElementById('saveClientBtn');
    if (saveClientBtn) {
        saveClientBtn.addEventListener('click', saveClient);
    }
    
    // Update client button
    const updateClientBtn = document.getElementById('updateClientBtn');
    if (updateClientBtn) {
        updateClientBtn.addEventListener('click', updateClient);
    }
}

/**
 * Load clients from API
 */
async function loadClients() {
    try {
        showLoading(true);
        
        // Get API service
        const service = typeof apiService !== 'undefined' ? apiService : 
                      (window && window.apiService) ? window.apiService : null;
        
        if (!service) {
            throw new Error('API service not available');
        }
        
        console.log('🔍 [DEBUG] Loading clients...');
        
        // Fetch clients
        const clients = await service.getClients();
        console.log('🔍 [DEBUG] Clients loaded:', clients);
        console.log('🔍 [DEBUG] Clients type:', typeof clients);
        console.log('🔍 [DEBUG] Clients is array:', Array.isArray(clients));
        if (clients && typeof clients === 'object') {
            console.log('🔍 [DEBUG] Clients keys:', Object.keys(clients));
        }
        
        // Store all clients - handle different response formats
        if (Array.isArray(clients)) {
            allClients = clients;
        } else if (clients && clients.clients && Array.isArray(clients.clients)) {
            allClients = clients.clients;
        } else if (clients && clients.data && Array.isArray(clients.data)) {
            allClients = clients.data;
        } else {
            console.warn('🔍 [DEBUG] Unexpected clients response format:', clients);
            allClients = [];
        }
        filteredClients = [...allClients];
        
        console.log('🔍 [DEBUG] Final allClients array length:', allClients.length);
        
        // Cache clients in localStorage for offline use
        try {
            localStorage.setItem('lpk_clients', JSON.stringify(allClients));
            localStorage.setItem('lpk_clients_timestamp', Date.now().toString());
        } catch (cacheError) {
            console.warn('❌ [DEBUG] Failed to cache clients:', cacheError);
        }
        
        // Display clients
        displayClients();
        
        showLoading(false);
        
            } catch (error) {
        console.error('❌ [DEBUG] Error loading clients:', error);
        showLoading(false);
        
        // Try to load from localStorage as fallback
        try {
            const storedClients = localStorage.getItem('lpk_clients');
            if (storedClients) {
                allClients = JSON.parse(storedClients);
                filteredClients = [...allClients];
                displayClients();
                showAlert('warning', 'تم تحميل العملاء من الذاكرة المحلية (لا يوجد اتصال بالخادم)');
                return;
            }
        } catch (localStorageError) {
            console.error('❌ [DEBUG] Error loading from localStorage:', localStorageError);
        }
        
        showAlert('error', `فشل في تحميل العملاء: ${error.message}`);
    }
}



/**
 * Filter clients based on search term
 */
function filterClients(searchTerm) {
    if (!searchTerm) {
        filteredClients = [...allClients];
    } else {
        filteredClients = allClients.filter(client => {
            const name = (client.name || '').toLowerCase();
            const phone = (client.phone || '').toLowerCase();
            const orderNumber = (client.order_number || '').toLowerCase();
            
            return name.includes(searchTerm) || 
                   phone.includes(searchTerm) || 
                   orderNumber.includes(searchTerm);
        });
    }
    
    currentPage = 1; // Reset to first page
    displayClients();
}

/**
 * Display clients in card grid
 */
function displayClients() {
    const clientsGrid = document.getElementById('clientsGrid');
    const emptyState = document.getElementById('emptyState');
    const loadingState = document.getElementById('loadingState');
    
    if (!clientsGrid) return;
    
    // Hide loading state
    if (loadingState) {
        loadingState.style.display = 'none';
    }
    
    // Check if no clients
    if (filteredClients.length === 0) {
        clientsGrid.innerHTML = '';
        if (emptyState) {
            emptyState.classList.remove('d-none');
        }
        return;
    }
    

    
    // Hide empty state
    if (emptyState) {
        emptyState.classList.add('d-none');
    }
    
    // Calculate pagination
    const startIndex = (currentPage - 1) * clientsPerPage;
    const endIndex = startIndex + clientsPerPage;
    const clientsToShow = filteredClients.slice(startIndex, endIndex);
    
    // Generate client cards
    const cardsHTML = clientsToShow.map((client, index) => {
        const actualIndex = startIndex + index;
        return createClientCard(client, actualIndex);
    }).join('');
    
    console.log('🔍 [DEBUG] Generated cards HTML length:', cardsHTML.length);
    console.log('🔍 [DEBUG] Number of clients to show:', clientsToShow.length);
    
    clientsGrid.innerHTML = cardsHTML;
    
    // Force the grid to display as flex
    clientsGrid.style.display = 'flex';
    clientsGrid.style.flexWrap = 'wrap';
    
    console.log('🔍 [DEBUG] Grid container:', clientsGrid);
    console.log('🔍 [DEBUG] Grid container classes:', clientsGrid.className);
    console.log('🔍 [DEBUG] Grid container style:', clientsGrid.style.display);
    
    // Update pagination
    updatePagination();
    
    // Add event listeners to action buttons
    addCardEventListeners();
}

/**
 * Create a client card HTML
 */
function createClientCard(client, index) {
    const clientName = client.name || 'غير محدد';
    const clientPhone = client.phone || 'غير محدد';
    
    // Get first letter for avatar
    const firstLetter = clientName.charAt(0).toUpperCase();
    
    return `
        <div class="col-xl-3 col-lg-4 col-md-6 col-sm-12 mb-4">
            <div class="card client-card h-100" data-client-id="${client.id}">
                <div class="card-body">
                    <div class="client-info">
                        <div class="client-avatar">
                            ${firstLetter}
                        </div>
                        <div class="client-details">
                            <h6 class="mb-1">${clientName}</h6>
                            <p class="mb-0"><i class="fas fa-phone me-1"></i>${clientPhone}</p>
                        </div>
                        <div class="client-actions">
                            <button class="btn btn-outline-secondary btn-sm rounded-circle toggle-actions" 
                                    type="button" style="width: 32px; height: 32px; padding: 0;">
                                <i class="fas fa-ellipsis-v"></i>
                            </button>
                            <div class="action-buttons d-none">
                                <button class="btn btn-outline-secondary btn-sm rounded-circle" title="مشاركة" onclick="shareClient('${client.id}')">
                                    <i class="fas fa-share-alt"></i>
                                </button>
                                <button class="btn btn-outline-secondary btn-sm rounded-circle" title="عرض" onclick="viewClient('${client.id}')">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="btn btn-outline-secondary btn-sm rounded-circle" title="تعديل" onclick="editClient('${client.id}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-danger btn-sm rounded-circle" title="حذف" onclick="deleteClient('${client.id}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Add event listeners to card action buttons
 */
function addCardEventListeners() {
    // Add event listeners for toggle buttons
    document.addEventListener('click', function(e) {
        if (e.target.closest('.toggle-actions')) {
            e.preventDefault();
            e.stopPropagation();
            
            const card = e.target.closest('.client-card');
            const actionButtons = card.querySelector('.action-buttons');
            const toggleButton = card.querySelector('.toggle-actions');
            
            // Close all other open action buttons
            document.querySelectorAll('.action-buttons').forEach(btn => {
                if (btn !== actionButtons) {
                    btn.classList.add('d-none');
                }
            });
            
            // Toggle current action buttons
            actionButtons.classList.toggle('d-none');
            
            // Change toggle button icon
            const icon = toggleButton.querySelector('i');
            if (actionButtons.classList.contains('d-none')) {
                icon.className = 'fas fa-ellipsis-v';
            } else {
                icon.className = 'fas fa-times';
            }
        }
        
        // Close action buttons when clicking outside
        if (!e.target.closest('.client-actions')) {
            document.querySelectorAll('.action-buttons').forEach(btn => {
                btn.classList.add('d-none');
            });
            document.querySelectorAll('.toggle-actions i').forEach(icon => {
                icon.className = 'fas fa-ellipsis-v';
            });
        }
    });
}

/**
 * Update pagination
 */
function updatePagination() {
    const paginationContainer = document.getElementById('paginationContainer');
    const pagination = document.getElementById('clientsPagination');
    
    if (!pagination) return;
    
    const totalPages = Math.ceil(filteredClients.length / clientsPerPage);
    
    if (totalPages <= 1) {
        paginationContainer.style.display = 'none';
        return;
    }
    
    paginationContainer.style.display = 'block';
    
    let paginationHTML = '';
    
    // Previous button
    paginationHTML += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage - 1})">السابق</a>
        </li>
    `;
    
    // Page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
            </li>
        `;
    }
    
    // Next button
    paginationHTML += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage + 1})">التالي</a>
        </li>
    `;
    
    pagination.innerHTML = paginationHTML;
}

/**
 * Change page
 */
function changePage(page) {
    const totalPages = Math.ceil(filteredClients.length / clientsPerPage);
    
    if (page < 1 || page > totalPages) {
        return;
    }
    
    currentPage = page;
    displayClients();
    
    // Scroll to top of grid
    const clientsGrid = document.getElementById('clientsGrid');
    if (clientsGrid) {
        clientsGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

/**
 * Share client login information
 */
async function shareClient(clientId) {
    try {
        const client = allClients.find(c => c.id === clientId);
        if (!client) {
            showAlert('error', 'العميل غير موجود');
            return;
        }
        
        // Create share text
        const shareText = `معلومات الدخول للعميل ${client.name}:
        
اسم العميل: ${client.name}
رقم الهاتف: ${client.phone}
كود الطلب: ${client.order_number || 'غير محدد'}

رابط الدخول: ${window.location.origin}/client-login.html

ملاحظة: سيحتاج العميل إلى كود الطلب للدخول إلى حسابه.`;
        
        // Try to use native sharing if available
        if (navigator.share) {
            await navigator.share({
                title: `معلومات العميل - ${client.name}`,
                text: shareText
            });
        } else {
            // Fallback to clipboard
            await navigator.clipboard.writeText(shareText);
            showAlert('success', 'تم نسخ معلومات العميل إلى الحافظة');
        }
        
    } catch (error) {
        console.error('Error sharing client:', error);
        showAlert('error', 'فشل في مشاركة معلومات العميل');
    }
}

/**
 * View client profile (admin access)
 */
async function viewClient(clientId) {
    try {
        const client = allClients.find(c => c.id === clientId);
        if (!client) {
            showAlert('error', 'العميل غير موجود');
            return;
        }
        
        // Get admin token
        const adminToken = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
        if (!adminToken) {
            showAlert('error', 'جلسة الإدارة منتهية الصلاحية. يرجى تسجيل الدخول مرة أخرى.');
            window.location.href = 'admin-login.html';
            return;
        }
        
        // Set admin viewing flag
        sessionStorage.setItem('adminViewingClient', 'true');
        
        // Set client info for admin viewing
        const clientInfo = {
            id: client.id,
            name: client.name,
            phone: client.phone,
            email: client.email,
            address: client.address,
            order_number: client.order_number,
            adminToken: adminToken // Include admin token for API calls
        };
        
        // Store client info in sessionStorage for admin viewing
        sessionStorage.setItem('clientInfo', JSON.stringify(clientInfo));
        
        // Navigate to client dashboard
        window.location.href = `client-dashboard.html?client_id=${clientId}`;
        
    } catch (error) {
        console.error('Error viewing client:', error);
        showAlert('error', 'فشل في فتح ملف العميل');
    }
}

/**
 * Edit client
 */
async function editClient(clientId) {
    try {
        const client = allClients.find(c => c.id === clientId);
        if (!client) {
            showAlert('error', 'العميل غير موجود');
            return;
        }
        
        // Populate edit form
        document.getElementById('editClientId').value = client.id;
        document.getElementById('editClientName').value = client.name || '';
        document.getElementById('editClientPhone').value = client.phone || '';
        document.getElementById('editClientEmail').value = client.email || '';
        document.getElementById('editClientAddress').value = client.address || '';
        
        // Set status radio button
        const statusRadios = document.querySelectorAll('input[name="editClientStatus"]');
        statusRadios.forEach(radio => {
            radio.checked = radio.value === (client.status || 'active');
        });
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('editClientModal'));
        modal.show();
        
    } catch (error) {
        console.error('Error editing client:', error);
        showAlert('error', 'فشل في تحميل بيانات العميل');
    }
    }
    
    /**
 * Delete client
     */
    async function deleteClient(clientId) {
        try {
        const client = allClients.find(c => c.id === clientId);
        if (!client) {
            showAlert('error', 'العميل غير موجود');
            return;
        }
        
        // Confirm deletion
        if (!confirm(`هل أنت متأكد من حذف العميل "${client.name}"؟\n\nهذا الإجراء لا يمكن التراجع عنه.`)) {
            return;
        }
        
        // Get API service
        const service = typeof apiService !== 'undefined' ? apiService : 
                      (window && window.apiService) ? window.apiService : null;
        
        if (!service) {
                throw new Error('API service not available');
            }
            
        // Delete client
        await service.deleteClient(clientId);
            
        // Reload clients
                await loadClients();
        
        showAlert('success', 'تم حذف العميل بنجاح');
        
        } catch (error) {
            console.error('Error deleting client:', error);
        showAlert('error', `فشل في حذف العميل: ${error.message}`);
        }
    }
    
    /**
 * Save new client
 */
async function saveClient() {
    try {
        const form = document.getElementById('addClientForm');
        const formData = new FormData(form);
        
        // Validate form
        const clientName = formData.get('clientName') || document.getElementById('clientName').value;
        const clientPhone = formData.get('clientPhone') || document.getElementById('clientPhone').value;
        const clientEmail = formData.get('clientEmail') || document.getElementById('clientEmail').value;
        const clientAddress = formData.get('clientAddress') || document.getElementById('clientAddress').value;
        const clientOrderCode = formData.get('clientOrderCode') || document.getElementById('clientOrderCode').value;
        const clientStatus = formData.get('clientStatus') || document.querySelector('input[name="clientStatus"]:checked')?.value || 'active';
        
        if (!clientName || !clientPhone || !clientOrderCode) {
            showAlert('error', 'يرجى ملء جميع الحقول المطلوبة');
            return;
        }
        
        // Get API service
        const service = typeof apiService !== 'undefined' ? apiService : 
                      (window && window.apiService) ? window.apiService : null;
        
        if (!service) {
            throw new Error('API service not available');
        }
        
        // Prepare client data
        const clientData = {
            name: clientName,
            phone: clientPhone,
            email: clientEmail,
            address: clientAddress,
            order_number: clientOrderCode,
            status: clientStatus
        };
        
        console.log('🔍 [DEBUG] Creating client with data:', clientData);
        
        // Create client
        const newClient = await service.createClient(clientData);
        console.log('🔍 [DEBUG] Client created:', newClient);
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('addClientModal'));
        if (modal) {
            modal.hide();
        }
        
        // Reload clients
        await loadClients();
        
        showAlert('success', 'تم إضافة العميل بنجاح');
        
    } catch (error) {
        console.error('Error saving client:', error);
        showAlert('error', `فشل في إضافة العميل: ${error.message}`);
        }
    }

    /**
 * Update existing client
 */
async function updateClient() {
    try {
        const form = document.getElementById('editClientForm');
        const formData = new FormData(form);
        
        // Get client ID
        const clientId = document.getElementById('editClientId').value;
        if (!clientId) {
            showAlert('error', 'معرف العميل غير موجود');
            return;
        }
        
        // Validate form
        const clientName = formData.get('editClientName') || document.getElementById('editClientName').value;
        const clientPhone = formData.get('editClientPhone') || document.getElementById('editClientPhone').value;
        const clientEmail = formData.get('editClientEmail') || document.getElementById('editClientEmail').value;
        const clientAddress = formData.get('editClientAddress') || document.getElementById('editClientAddress').value;
        const clientStatus = formData.get('editClientStatus') || document.querySelector('input[name="editClientStatus"]:checked')?.value || 'active';
        
        if (!clientName || !clientPhone) {
            showAlert('error', 'يرجى ملء جميع الحقول المطلوبة');
            return;
        }
        
        // Get API service
        const service = typeof apiService !== 'undefined' ? apiService : 
                      (window && window.apiService) ? window.apiService : null;
        
        if (!service) {
            throw new Error('API service not available');
        }
        
        // Prepare client data
        const clientData = {
            name: clientName,
            phone: clientPhone,
            email: clientEmail,
            address: clientAddress,
            status: clientStatus
        };
        
        console.log('🔍 [DEBUG] Updating client with data:', clientData);
        
        // Update client
        const updatedClient = await service.updateClient(clientId, clientData);
        console.log('🔍 [DEBUG] Client updated:', updatedClient);
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('editClientModal'));
        if (modal) {
            modal.hide();
        }
        
        // Reload clients
        await loadClients();
        
        showAlert('success', 'تم تحديث العميل بنجاح');
        
    } catch (error) {
        console.error('Error updating client:', error);
        showAlert('error', `فشل في تحديث العميل: ${error.message}`);
    }
}

/**
 * Show loading state
 */
function showLoading(show) {
    const loadingState = document.getElementById('loadingState');
    const clientsGrid = document.getElementById('clientsGrid');
    const emptyState = document.getElementById('emptyState');
    
    if (loadingState) {
        loadingState.style.display = show ? 'block' : 'none';
    }
    
    if (clientsGrid) {
        clientsGrid.style.display = show ? 'none' : 'block';
    }
    
    if (emptyState) {
        emptyState.style.display = show ? 'none' : 'none'; // Keep hidden during loading
    }
}

/**
 * Show alert message
 */
function showAlert(type, message) {
    // Create alert element
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type === 'error' ? 'danger' : 'success'} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    alertDiv.innerHTML = `
        <i class="fas fa-${type === 'error' ? 'exclamation-triangle' : 'check-circle'} me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Add to page
    document.body.appendChild(alertDiv);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}
