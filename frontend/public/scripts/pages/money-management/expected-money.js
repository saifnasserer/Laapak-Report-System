/**
 * Laapak Report System - Expected Money Page Logic
 * Handles expected items, work in progress, and inventory items
 */

// Global State
let items = [];
let editingItemId = null;
let currentFilters = {
    type: '',
    status: '',
    search: ''
};

// Initialize
document.addEventListener('DOMContentLoaded', async function () {
    // Initial Load
    await loadItems();
    setupEventListeners();
});

// Setup Event Listeners
function setupEventListeners() {
    // Filters
    document.getElementById('typeFilter').addEventListener('change', function () {
        currentFilters.type = this.value;
        loadItems(); // Re-fetch from API for server-side filtering
    });

    document.getElementById('statusFilter').addEventListener('change', function () {
        currentFilters.status = this.value;
        loadItems();
    });

    // Search with debounce
    let searchTimeout;
    document.getElementById('searchInput').addEventListener('input', function () {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            currentFilters.search = this.value;
            loadItems();
        }, 300);
    });

    // Form Submit
    document.getElementById('saveItemBtn').addEventListener('click', saveItem);
}

// Load Items from API
async function loadItems() {
    showLoading(true);
    try {
        // Get token from AuthMiddleware (best practice) or direct storage fallback
        let token = '';
        if (typeof authMiddleware !== 'undefined') {
            token = authMiddleware.getAdminToken();
        } else {
            token = localStorage.getItem('adminToken') ||
                (JSON.parse(localStorage.getItem('adminInfo') || '{}').token);
        }

        if (!token) {
            console.error('No auth token found in expected-money.js');
            // Don't throw yet, let the API call fail if real 401, but maybe alert/redirect? 
            // Auth check handles redirect usually.
        }
        const params = new URLSearchParams();

        const baseUrl = window.config ? window.config.api.baseUrl : 'http://localhost:3001';

        if (currentFilters.type) params.append('type', currentFilters.type);
        if (currentFilters.status) params.append('status', currentFilters.status);
        if (currentFilters.search) params.append('search', currentFilters.search);

        console.log('Fetching items from:', `${baseUrl}/api/money/expected-items`);

        const response = await fetch(`${baseUrl}/api/money/expected-items?${params}`, {
            headers: {
                'x-auth-token': token
            }
        });

        if (!response.ok) throw new Error('Failed to fetch items');

        const result = await response.json();
        items = result.data || [];

        renderItems();
        updateStats();
    } catch (error) {
        console.error('Error loading items:', error);
        // Fallback to empty state or show error
        items = [];
        renderItems();
        alert('خطأ في تحميل البيانات');
    } finally {
        showLoading(false);
    }
}

// Render Items List
function renderItems() {
    const container = document.getElementById('itemsList');

    if (items.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5 text-muted">
                <i class="fas fa-inbox fa-3x mb-3 opacity-25"></i>
                <h5>لا توجد عناصر</h5>
                <p>لم يتم العثور على عناصر تطابق الفلاتر المحددة</p>
                <button class="btn btn-primary mt-2" onclick="showAddItemModal()">
                    <i class="fas fa-plus me-2"></i>إضافة عنصر جديد
                </button>
            </div>`;
        return;
    }

    container.innerHTML = items.map(item => `
        <div class="finance-card item-card mb-3 p-3" onclick="editItem(${item.id})">
            <div class="d-flex align-items-center gap-3">
                <!-- Icon Badge -->
                <div class="item-icon-badge ${getIconClass(item.type)}">
                    <i class="fas ${getIcon(item.type)}"></i>
                </div>

                <!-- Content -->
                <div class="flex-grow-1">
                    <div class="d-flex justify-content-between align-items-start mb-1">
                        <h5 class="mb-0 fw-bold text-dark">${item.title}</h5>
                        <div class="d-flex gap-2">
                             ${FinancialUtils.getBadgeHtml(item.status, 'status')}
                             ${FinancialUtils.getBadgeHtml(item.type, 'type')}
                        </div>
                    </div>
                    
                    <p class="text-muted small mb-2">${item.description || ''}</p>
                    
                    <div class="d-flex gap-3 text-secondary x-small">
                        <span><i class="fas fa-user me-1"></i> ${item.from_whom}</span>
                        <span><i class="fas fa-calendar me-1"></i> ${FinancialUtils.formatDate(item.expected_date)}</span>
                        ${item.contact ? `<span><i class="fas fa-phone me-1"></i> ${item.contact}</span>` : ''}
                    </div>
                </div>

                <!-- Amount & Actions -->
                <div class="text-end border-start ps-3" style="min-width: 120px;">
                    <div class="h4 fw-bold text-primary mb-2">
                        ${FinancialUtils.formatCurrency(item.amount)}
                    </div>
                    <div class="d-flex justify-content-end gap-1">
                        <button class="btn btn-sm btn-outline-primary icon-btn" onclick="event.stopPropagation(); editItem(${item.id})" title="تعديل">
                            <i class="fas fa-edit"></i>
                        </button>
                        ${item.status !== 'completed' ? `
                        <button class="btn btn-sm btn-outline-success icon-btn" onclick="event.stopPropagation(); markAsCompleted(${item.id})" title="إكمال">
                            <i class="fas fa-check"></i>
                        </button>` : ''}
                        <button class="btn btn-sm btn-outline-danger icon-btn" onclick="event.stopPropagation(); deleteItem(${item.id})" title="حذف">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Stats Calculation
function updateStats() {
    const stats = items.reduce((acc, item) => {
        acc.total += parseFloat(item.amount || 0);
        if (item.status === 'pending') acc.pending += parseFloat(item.amount || 0);
        if (item.status === 'in_progress') acc.inProgress += parseFloat(item.amount || 0);
        if (item.status === 'completed') acc.completed += parseFloat(item.amount || 0);
        return acc;
    }, { total: 0, pending: 0, inProgress: 0, completed: 0 });

    document.getElementById('totalAmount').textContent = FinancialUtils.formatCurrency(stats.total);
    document.getElementById('pendingAmount').textContent = FinancialUtils.formatCurrency(stats.pending);
    document.getElementById('inProgressAmount').textContent = FinancialUtils.formatCurrency(stats.inProgress);
    document.getElementById('completedAmount').textContent = FinancialUtils.formatCurrency(stats.completed);
}

// Selection Functions
function selectType(element) {
    // Remove active state from all type cards
    document.querySelectorAll('[data-type]').forEach(card => {
        card.classList.remove('border-primary', 'bg-primary', 'bg-opacity-10');
        card.querySelector('.check-indicator').classList.remove('opacity-100');
        card.querySelector('.check-indicator').classList.add('opacity-0');
    });

    // Add active state to selected
    element.classList.add('border-primary', 'bg-primary', 'bg-opacity-10');
    element.querySelector('.check-indicator').classList.remove('opacity-0');
    element.querySelector('.check-indicator').classList.add('opacity-100');

    // Update hidden input
    document.getElementById('itemType').value = element.dataset.type;

    // Hide error if visible
    document.getElementById('typeError').style.setProperty('display', 'none', 'important');
}

// Modal Functions
function showAddItemModal() {
    editingItemId = null;
    document.getElementById('modalTitle').innerHTML = '<i class="fas fa-plus me-2"></i>إضافة عنصر جديد';
    document.getElementById('itemForm').reset();
    document.getElementById('itemExpectedDate').value = new Date().toISOString().split('T')[0];

    // Reset Type Selection
    document.querySelectorAll('[data-type]').forEach(card => {
        card.classList.remove('border-primary', 'bg-primary', 'bg-opacity-10');
        card.querySelector('.check-indicator').classList.remove('opacity-100');
        card.querySelector('.check-indicator').classList.add('opacity-0');
    });
    document.getElementById('itemType').value = '';

    // Explicitly set default status
    if (document.getElementById('itemStatus')) {
        document.getElementById('itemStatus').value = 'pending';
    }

    const modal = new bootstrap.Modal(document.getElementById('itemModal'));
    modal.show();
}

function editItem(id) {
    const item = items.find(i => i.id === id);
    if (!item) return;

    editingItemId = id;
    document.getElementById('modalTitle').innerHTML = '<i class="fas fa-edit me-2"></i>تعديل العنصر';

    // Populate Inputs
    document.getElementById('itemTitle').value = item.title;
    document.getElementById('itemAmount').value = item.amount;
    document.getElementById('itemExpectedDate').value = item.expected_date;
    document.getElementById('itemNotes').value = item.notes || '';

    // Hidden Fields / Reduced UI
    if (document.getElementById('itemStatus')) document.getElementById('itemStatus').value = item.status || 'pending';

    // Select Type
    const typeCard = document.querySelector(`[data-type="${item.type}"]`);
    if (typeCard) selectType(typeCard);

    const modal = new bootstrap.Modal(document.getElementById('itemModal'));
    modal.show();
}

async function saveItem() {
    const form = document.getElementById('itemForm');

    // Custom Validation for Hidden Type Input
    const typeInput = document.getElementById('itemType');
    if (!typeInput.value) {
        document.getElementById('typeError').style.setProperty('display', 'block', 'important');
        return;
    }

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const payload = {
        type: document.getElementById('itemType').value,
        status: document.getElementById('itemStatus') ? document.getElementById('itemStatus').value : 'pending',
        title: document.getElementById('itemTitle').value,
        description: '', // Removed from UI
        amount: parseFloat(document.getElementById('itemAmount').value),
        expected_date: document.getElementById('itemExpectedDate').value,
        from_whom: 'غير محدد', // Required by backend, default for now
        contact: '', // Removed from UI
        notes: document.getElementById('itemNotes').value
    };

    try {
        // Aggressive Token Retrieval Strategy
        let token = null;

        // 1. Try middleware if available
        if (typeof window.authMiddleware !== 'undefined') {
            token = window.authMiddleware.getAdminToken();
        }

        // 2. Direct localStorage (adminToken)
        if (!token) {
            token = localStorage.getItem('adminToken');
        }

        // 3. Direct sessionStorage
        if (!token) {
            token = sessionStorage.getItem('adminToken');
        }

        // 4. Parse from adminInfo (local)
        if (!token) {
            try {
                const info = JSON.parse(localStorage.getItem('adminInfo') || '{}');
                token = info.token;
            } catch (e) { }
        }

        // 5. Parse from clientInfo (fallback)
        if (!token) {
            try {
                const info = JSON.parse(localStorage.getItem('clientInfo') || '{}');
                token = info.token;
            } catch (e) { }
        }

        if (!token) {
            // Last resort: check if auth-check has passed but we can't find token
            console.error('CRITICAL: Auth check passed but token missing in saveItem');
            alert('Session expired. Please login again.');
            window.location.href = '/admin.html';
            return;
        }

        const apiBaseUrl = (window.config && window.config.api) ? window.config.api.baseUrl : 'http://localhost:3001';
        const url = editingItemId
            ? `${apiBaseUrl}/api/money/expected-items/${editingItemId}`
            : `${apiBaseUrl}/api/money/expected-items`;

        const method = editingItemId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error('Failed to save item');

        const modal = bootstrap.Modal.getInstance(document.getElementById('itemModal'));
        modal.hide();

        await loadItems(); // Refresh list
        alert(editingItemId ? 'تم التحديث بنجاح' : 'تم الإضافة بنجاح');

    } catch (error) {
        console.error('Error saving item:', error);
        alert('حدث خطأ أثناء الحفظ');
    }
}

async function deleteItem(id) {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;

    try {
        // Robust token retrieval
        let token = null;
        if (typeof window.authMiddleware !== 'undefined') token = window.authMiddleware.getAdminToken();
        if (!token) token = localStorage.getItem('adminToken');
        if (!token) token = sessionStorage.getItem('adminToken');
        if (!token) {
            try { token = JSON.parse(localStorage.getItem('adminInfo') || '{}').token; } catch (e) { }
        }

        if (!token) {
            alert('Session expired. Please login again.');
            window.location.href = '/admin.html';
            return;
        }

        const apiBaseUrl = (window.config && window.config.api) ? window.config.api.baseUrl : 'http://localhost:3001';
        const response = await fetch(`${apiBaseUrl}/api/money/expected-items/${id}`, {
            method: 'DELETE',
            headers: { 'x-auth-token': token }
        });

        if (!response.ok) throw new Error('Failed to delete');

        await loadItems();
        alert('تم الحذف بنجاح');
    } catch (error) {
        console.error('Error deleting:', error);
        alert('حدث خطأ أثناء الحذف');
    }
}

async function markAsCompleted(id) {
    if (!confirm('هل أنت متأكد من تحديد العنصر كمكتمل؟')) return;

    try {
        // Robust token retrieval
        let token = null;
        if (typeof window.authMiddleware !== 'undefined') token = window.authMiddleware.getAdminToken();
        if (!token) token = localStorage.getItem('adminToken');
        if (!token) token = sessionStorage.getItem('adminToken');
        if (!token) {
            try { token = JSON.parse(localStorage.getItem('adminInfo') || '{}').token; } catch (e) { }
        }

        if (!token) {
            alert('Session expired. Please login again.');
            window.location.href = '/admin.html';
            return;
        }

        const apiBaseUrl = (window.config && window.config.api) ? window.config.api.baseUrl : 'http://localhost:3001';

        const response = await fetch(`${apiBaseUrl}/api/money/expected-items/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            },
            body: JSON.stringify({ status: 'completed' })
        });

        if (!response.ok) throw new Error('Failed to update status');
        await loadItems();
    } catch (error) {
        console.error('Error updating status:', error);
        alert('حدث خطأ');
    }
}

// UI Helpers
function showLoading(show) {
    const list = document.getElementById('itemsList');
    if (show) {
        list.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status"></div>
                <p class="mt-2 text-muted">جاري المخالفة...</p>
            </div>`;
    }
}

function clearFilters() {
    document.getElementById('typeFilter').value = '';
    document.getElementById('statusFilter').value = '';
    document.getElementById('searchInput').value = '';
    currentFilters = { type: '', status: '', search: '' };
    loadItems();
}

function getIcon(type) {
    const map = {
        'expected_payment': 'fa-money-bill-wave',
        'work_in_progress': 'fa-tools',
        'inventory_item': 'fa-box',
        'liability': 'fa-hand-holding-usd'
    };
    return map[type] || 'fa-circle';
}

function getIconClass(type) {
    const map = {
        'expected_payment': 'text-primary bg-primary bg-opacity-10',
        'work_in_progress': 'text-info bg-info bg-opacity-10',
        'inventory_item': 'text-warning bg-warning bg-opacity-10',
        'liability': 'text-danger bg-danger bg-opacity-10'
    };
    return map[type] || 'text-secondary bg-secondary bg-opacity-10';
}

// Make functions available globally for HTML onclick handlers
window.showAddItemModal = showAddItemModal;
window.editItem = editItem;
window.saveItem = saveItem;
window.deleteItem = deleteItem;
window.markAsCompleted = markAsCompleted;
window.clearFilters = clearFilters;
window.loadItems = loadItems;
window.selectType = selectType;
