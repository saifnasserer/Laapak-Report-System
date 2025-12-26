/**
 * Laapak Report System - Add Expense/Profit Page Logic
 * Handles recording expenses and profits with category and payment method selection
 */

// Global State
let selectedType = 'expense';
let isEditing = false;
let editingRecordId = null;

// Initialize
document.addEventListener('DOMContentLoaded', function () {
    // Initialize tooltips
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach(tooltip => {
        new bootstrap.Tooltip(tooltip);
    });

    // Setup Type Toggle
    setupTypeToggle();

    // Setup Payment Methods
    setupPaymentMethodCards();

    // Load Data
    loadCategories();
    loadRecentRecords();

    // Set Defaults
    setDefaultDate();
    updateAmountInputColor();

    // Handle URL Params
    handleUrlParams();

    // Setup Real-time Validation
    setupRealTimeValidation();

    // Form Submission
    document.getElementById('recordForm').addEventListener('submit', handleFormSubmit);
});

// Setup Type Toggle
function setupTypeToggle() {
    document.addEventListener('click', function (e) {
        if (e.target.classList.contains('type-option') || e.target.closest('.type-option')) {
            const button = e.target.classList.contains('type-option') ? e.target : e.target.closest('.type-option');

            document.querySelectorAll('.type-option').forEach(option => {
                option.classList.remove('active');
            });
            button.classList.add('active');
            selectedType = button.dataset.type;

            updateAmountInputColor();
        }
    });
}

// Update Amount Input Color
function updateAmountInputColor() {
    const amountInput = document.getElementById('recordAmount');
    if (amountInput) {
        if (selectedType === 'expense') {
            amountInput.style.color = 'var(--danger-color, #dc3545)';
        } else {
            amountInput.style.color = 'var(--success-color, #198754)';
        }
    }
}

// Set Default Date
function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('recordDate');
    if (dateInput) dateInput.value = today;
}

// Handle URL Params
function handleUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const typeParam = urlParams.get('type');
    if (typeParam === 'profit') {
        document.querySelectorAll('.type-option').forEach(option => option.classList.remove('active'));
        const profitBtn = document.querySelector('[data-type="profit"]');
        if (profitBtn) {
            profitBtn.classList.add('active');
            selectedType = 'profit';
            updateAmountInputColor();
        }
    }
}

// Load Categories
async function loadCategories() {
    try {
        const token = getAuthToken();
        const baseUrl = getBaseUrl();

        const response = await fetch(`${baseUrl}/api/records/categories`, {
            headers: {
                'x-auth-token': token,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Failed to load categories');

        const result = await response.json();
        populateCategoryCards(result.data.categories || []);

    } catch (error) {
        console.error('Categories error:', error);
        // Fallback categories
        populateCategoryCards([
            { id: 1, name_ar: 'مصاريف المكتب' },
            { id: 2, name_ar: 'مرتبات' },
            { id: 3, name_ar: 'مصاريف شخصية' },
            { id: 4, name_ar: 'تكاليف الشغل' }
        ]);
    }
}

// Populate Category Cards
function populateCategoryCards(categories) {
    const container = document.getElementById('categoryCards');
    if (!container) return;

    container.innerHTML = categories.map(category => `
        <div class="finance-card category-card p-3 mb-0 pointer" 
             data-category-id="${category.id}" 
             data-category-name="${category.name_ar}"
             onclick="selectCategory(this)">
            <div class="d-flex align-items-center gap-3">
                <div class="icon-circle ${getCategoryIconClass(category.id)}">
                    <i class="fas ${getCategoryIcon(category.id)}"></i>
                </div>
                <div>
                    <h6 class="mb-1 fw-bold">${category.name_ar}</h6>
                    <small class="text-muted">${getCategoryDescription(category.id)}</small>
                </div>
                <div class="ms-auto category-check opacity-0">
                    <i class="fas fa-check-circle text-primary"></i>
                </div>
            </div>
        </div>
    `).join('');
}

// Helper Functions for Categories
function getCategoryIcon(id) {
    const icons = { 1: 'fa-building', 2: 'fa-users', 3: 'fa-user', 4: 'fa-tools' };
    return icons[id] || 'fa-tag';
}

function getCategoryIconClass(id) {
    // You can customize colors here or return a generic class
    return 'bg-light text-primary';
}

function getCategoryDescription(id) {
    const descriptions = {
        1: 'إيجار، مرافق، مستلزمات',
        2: 'رواتب الموظفين والأجور',
        3: 'مصاريف شخصية للعمل',
        4: 'مواد وأدوات العمل'
    };
    return descriptions[id] || 'فئة مصروفات';
}

// Select Category
function selectCategory(card) {
    document.querySelectorAll('.category-card').forEach(c => {
        c.classList.remove('selected', 'border-primary');
        c.querySelector('.category-check').classList.add('opacity-0');
    });

    card.classList.add('selected', 'border-primary');
    card.querySelector('.category-check').classList.remove('opacity-0');

    document.getElementById('recordCategory').value = card.dataset.categoryId;

    // Validation visual update
    document.getElementById('recordCategory').classList.add('is-valid');
}

// Setup Payment Method Cards
function setupPaymentMethodCards() {
    const container = document.getElementById('paymentMethodsGrid');
    if (!container) return; // Should be in HTML

    // If HTML already has stricture, we just attach listeners.
    // Or we render them dynamically for consistency. 
    // Let's render dynamically to ensure clean HTML provided by JS.

    const methods = [
        { id: 'cash', name: 'نقداً', icon: 'fa-money-bill-wave', color: 'text-success' },
        { id: 'instapay', name: 'Instapay', icon: 'fa-mobile-alt', color: 'text-primary' },
        { id: 'wallet', name: 'محفظة', icon: 'fa-wallet', color: 'text-info' },
        { id: 'bank', name: 'بنك', icon: 'fa-university', color: 'text-warning' }
    ];

    container.innerHTML = methods.map(method => `
        <div class="finance-card payment-method-card p-3 mb-0 pointer" 
             data-method="${method.id}"
             onclick="selectPaymentMethod(this)">
            <div class="d-flex align-items-center gap-2">
                <i class="fas ${method.icon} ${method.color} fs-5"></i>
                <span class="fw-bold">${method.name}</span>
                <i class="fas fa-check-circle text-primary ms-auto payment-check opacity-0"></i>
            </div>
        </div>
    `).join('');
}

// Select Payment Method
function selectPaymentMethod(card) {
    document.querySelectorAll('.payment-method-card').forEach(c => {
        c.classList.remove('selected', 'border-primary');
        c.querySelector('.payment-check').classList.add('opacity-0');
    });

    card.classList.add('selected', 'border-primary');
    card.querySelector('.payment-check').classList.remove('opacity-0');

    document.getElementById('paymentMethod').value = card.dataset.method;
    document.getElementById('paymentMethod').classList.add('is-valid');
}

// Pagination State
let currentPage = 1;

// Load Recent Records (Paginated)
async function loadRecentRecords(page = 1) {
    const container = document.getElementById('recentRecords');
    if (page === 1) container.innerHTML = '<div class="text-center py-3"><div class="spinner-border text-primary"></div></div>'; // Simple Loading

    try {
        const token = getAuthToken();
        const baseUrl = getBaseUrl();
        const limit = 5;

        // Use main records API which supports pagination
        const response = await fetch(`${baseUrl}/api/records?page=${page}&limit=${limit}`, {
            headers: { 'x-auth-token': token }
        });

        if (!response.ok) throw new Error('Failed to load recent records');

        const result = await response.json();
        const records = result.data.records || [];
        const pagination = result.data.pagination;

        currentPage = page;
        renderRecentRecords(records);
        renderPagination(pagination);

    } catch (error) {
        console.error('Recent records error:', error);
        container.innerHTML = '<div class="text-center text-danger">خطأ في تحميل البيانات</div>';
    }
}

// Render Recent Records
function renderRecentRecords(records) {
    const container = document.getElementById('recentRecords');

    if (!records || records.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="fas fa-inbox fa-2x mb-2 opacity-50"></i>
                <p>لا توجد تسجيلات</p>
            </div>`;
        return;
    }

    container.innerHTML = records.map(record => `
        <div class="finance-card p-3 mb-2">
            <div class="d-flex align-items-center">
                <div class="icon-circle bg-light ${record.type === 'expense' ? 'text-danger' : 'text-success'} me-3">
                    <i class="fas ${record.type === 'expense' ? 'fa-minus' : 'fa-plus'}"></i>
                </div>
                <div class="flex-grow-1">
                    <div class="d-flex justify-content-between">
                        <h6 class="mb-0 fw-bold">${record.notes || record.name || 'بدون وصف'}</h6>
                        <span class="fw-bold ${record.type === 'expense' ? 'text-danger' : 'text-success'}" style="font-family: monospace; font-size: 1.1em;">
                            ${record.type === 'expense' ? '-' : '+'}${FinancialUtils.formatCurrency(record.amount)}
                        </span>
                    </div>
                    <div class="d-flex justify-content-between align-items-center mt-1">
                        <small class="text-muted">
                            <i class="fas fa-calendar-alt me-1"></i>${FinancialUtils.formatDate(record.date)}
                        </small>
                        <div>
                            <button class="btn btn-sm btn-link text-primary p-0 me-2" onclick="editRecord('${record.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-link text-danger p-0" onclick="deleteRecord('${record.id}', '${record.notes || record.name}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Render Pagination Controls
function renderPagination(pagination) {
    let container = document.getElementById('paginationControls');
    if (!container) {
        container = document.createElement('div');
        container.id = 'paginationControls';
        container.className = 'd-flex justify-content-between align-items-center mt-3 pt-2 border-top';
        document.getElementById('recentRecords').parentNode.appendChild(container);
    }

    if (pagination.pages <= 1) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = `
        <button class="btn btn-sm btn-light" ${pagination.page <= 1 ? 'disabled' : ''} onclick="loadRecentRecords(${pagination.page - 1})">
            <i class="fas fa-chevron-right"></i> السابق
        </button>
        <span class="small text-muted">صفحة ${pagination.page} من ${pagination.pages}</span>
        <button class="btn btn-sm btn-light" ${pagination.page >= pagination.pages ? 'disabled' : ''} onclick="loadRecentRecords(${pagination.page + 1})">
            التالي <i class="fas fa-chevron-left"></i>
        </button>
    `;
}

// Handle Form Submit
async function handleFormSubmit(e) {
    e.preventDefault();

    // Validation
    const category = document.getElementById('recordCategory').value;
    const description = document.getElementById('recordDescription').value.trim();
    const amount = document.getElementById('recordAmount').value;
    const date = document.getElementById('recordDate').value;
    const paymentMethod = document.getElementById('paymentMethod').value;

    if (!category) return showNotification('يرجى اختيار فئة المصروف', 'error');
    if (!description) return showNotification('يرجى إدخال وصف المعاملة', 'error');
    if (!amount || amount <= 0) return showNotification('يرجى إدخال مبلغ صحيح', 'error');
    if (!date) return showNotification('يرجى إدخال التاريخ', 'error');
    if (!paymentMethod) return showNotification('يرجى اختيار طريقة الدفع', 'error');

    const formData = {
        category_id: parseInt(category),
        amount: parseFloat(amount),
        type: selectedType,
        date: date,
        description: description,
        paymentMethod: paymentMethod
    };

    const submitBtn = document.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> جاري الحفظ...';
    submitBtn.disabled = true;

    try {
        const token = getAuthToken();
        const baseUrl = getBaseUrl();
        const method = isEditing ? 'PUT' : 'POST';
        const url = isEditing ? `${baseUrl}/api/records/${editingRecordId}` : `${baseUrl}/api/records`;

        const response = await fetch(url, {
            method: method,
            headers: {
                'x-auth-token': token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) throw new Error('Failed to save record');

        const result = await response.json();

        showNotification('تم الحفظ بنجاح', 'success');

        if (isEditing) {
            cancelEdit();
        } else {
            resetForm();
        }

        loadRecentRecords();

        // Notify others
        if (window.opener) {
            window.opener.postMessage({ type: 'REFRESH_MONEY_DATA' }, '*');
        }

    } catch (error) {
        console.error('Save error:', error);
        showNotification('خطأ في حفظ التسجيل', 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Edit Record
async function editRecord(id) {
    try {
        const token = getAuthToken();
        const baseUrl = getBaseUrl();

        const response = await fetch(`${baseUrl}/api/records/${id}`, {
            headers: { 'x-auth-token': token }
        });

        if (!response.ok) throw new Error('Failed to fetch record');

        const result = await response.json();
        const record = result.data.record;

        isEditing = true;
        editingRecordId = id;

        // Populate Form
        document.getElementById('recordAmount').value = record.amount;
        document.getElementById('recordDate').value = record.date.split('T')[0];
        document.getElementById('recordDescription').value = record.description || record.notes || '';

        // Type
        selectedType = (record.type === 'fixed' || record.type === 'profit') ? 'profit' : 'expense';
        document.querySelectorAll('.type-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === selectedType);
        });
        updateAmountInputColor();

        // Category
        if (record.category_id) {
            const card = document.querySelector(`.category-card[data-category-id="${record.category_id}"]`);
            if (card) selectCategory(card);
        }

        // Payment Method
        if (record.payment_method) {
            const card = document.querySelector(`.payment-method-card[data-method="${record.payment_method}"]`);
            if (card) selectPaymentMethod(card);
        }

        // UI Updates
        document.querySelector('.card-title').textContent = 'تعديل المعاملة';
        const submitBtn = document.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-save me-2"></i> حفظ التعديلات';
        submitBtn.classList.remove('btn-primary');
        submitBtn.classList.add('btn-warning');

        document.getElementById('cancelEditBtn').classList.remove('d-none');
        document.getElementById('recordForm').scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        console.error('Edit error:', error);
        showNotification('خطأ في تحميل بيانات للتعديل', 'error');
    }
}

// Cancel Edit
function cancelEdit() {
    isEditing = false;
    editingRecordId = null;
    resetForm();

    document.querySelector('.card-title').textContent = 'تسجيل مصروف/ربح جديد';
    const submitBtn = document.querySelector('button[type="submit"]');
    submitBtn.innerHTML = '<i class="fas fa-save me-2"></i> حفظ التسجيل';
    submitBtn.classList.add('btn-primary');
    submitBtn.classList.remove('btn-warning');

    document.getElementById('cancelEditBtn').classList.add('d-none');
}

// Reset Form
function resetForm() {
    document.getElementById('recordForm').reset();
    setDefaultDate();

    // Reset selections
    document.querySelectorAll('.category-card, .payment-method-card').forEach(c => {
        c.classList.remove('selected', 'border-primary');
        c.querySelector('.fa-check-circle').classList.add('opacity-0'); // Fix for mixed class usage
    });

    document.getElementById('recordCategory').value = '';
    document.getElementById('paymentMethod').value = '';

    // Default Type
    selectedType = 'expense';
    document.querySelectorAll('.type-option').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === 'expense');
    });
    updateAmountInputColor();

    // Default Payment Method: Cash
    const cashCard = document.querySelector('.payment-method-card[data-method="cash"]');
    if (cashCard) selectPaymentMethod(cashCard);
}

// Delete Record
async function deleteRecord(id, name) {
    if (!confirm(`هل أنت متأكد من حذف "${name}"؟`)) return;

    try {
        const token = getAuthToken();
        const baseUrl = getBaseUrl();

        const response = await fetch(`${baseUrl}/api/records/${id}`, {
            method: 'DELETE',
            headers: { 'x-auth-token': token }
        });

        if (!response.ok) throw new Error('Failed to delete');

        showNotification('تم الحذف بنجاح', 'success');
        loadRecentRecords(currentPage); // Reload current page

        if (window.opener) {
            window.opener.postMessage({ type: 'REFRESH_MONEY_DATA' }, '*');
        }
    } catch (error) {
        showNotification('خطأ في الحذف', 'error');
    }
}

// Helpers
function getAuthToken() {
    // Robust token retrieval with multiple fallbacks
    let token = '';
    if (typeof window.authMiddleware !== 'undefined') {
        token = window.authMiddleware.getAdminToken();
    }

    if (!token) token = localStorage.getItem('adminToken');
    if (!token) token = sessionStorage.getItem('adminToken');

    // Check adminInfo object
    if (!token) {
        try {
            const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
            token = adminInfo.token;
        } catch (e) { }
    }

    if (!token) {
        console.error('No auth token found in financial-add-expense.js');
        // Optional: Redirect if critical
        // window.location.href = '/admin.html';
    }

    return token;
}

function getBaseUrl() {
    return window.config ? window.config.api.baseUrl : window.location.origin;
}

function showNotification(msg, type = 'info') {
    // Check if toast container exists
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }

    const toastHtml = `
        <div class="toast align-items-center text-white bg-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'primary'} border-0" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">
                    ${msg}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;

    const div = document.createElement('div');
    div.innerHTML = toastHtml;
    const toastElement = div.firstElementChild;
    toastContainer.appendChild(toastElement);

    const toast = new bootstrap.Toast(toastElement);
    toast.show();

    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}

function setupRealTimeValidation() {
    // Basic valid/invalid class toggling
    const inputs = document.querySelectorAll('.form-control, .form-select');
    inputs.forEach(input => {
        input.addEventListener('input', function () {
            if (this.checkValidity()) {
                this.classList.remove('is-invalid');
                this.classList.add('is-valid');
            } else {
                this.classList.remove('is-valid');
                this.classList.add('is-invalid');
            }
        });
    });
}

// Expose globals for onclick
window.selectCategory = selectCategory;
window.selectPaymentMethod = selectPaymentMethod;
window.editRecord = editRecord;
window.deleteRecord = deleteRecord;
window.cancelEdit = cancelEdit;
window.resetForm = resetForm;
