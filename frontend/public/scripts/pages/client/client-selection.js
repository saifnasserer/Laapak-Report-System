/**
 * Laapak Report System
 * Client Selection and Management (In-Memory)
 *
 * This script handles:
 * 1. Client selection from dropdown
 * 2. Adding new clients via modal
 * 3. Viewing client details
 * 4. Auto-filling client data in forms
 */

// In-memory client list (not persistent)
let clients = [
    {
        id: 1,
        name: 'محمد أحمد',
        phone: '0501234567',
        email: 'mohammed@example.com',
        history: [
            { date: '2025-02-15', deviceType: 'لابتوب', brand: 'HP', model: 'Pavilion' },
            { date: '2024-11-03', deviceType: 'لابتوب', brand: 'Lenovo', model: 'ThinkPad' }
        ]
    },
    {
        id: 2,
        name: 'فاطمة علي',
        phone: '0509876543',
        email: 'fatima@example.com',
        history: [
            { date: '2025-03-01', deviceType: 'لابتوب', brand: 'Dell', model: 'XPS' }
        ]
    },
    {
        id: 3,
        name: 'سارة محمد',
        phone: '0553219876',
        email: 'sara@example.com',
        history: []
    }
];

// Handle dropdown client selection
function clientSelectionChanged(selectElement) {
    const selectedValue = selectElement.value;
    const viewClientBtn = document.getElementById('viewClientBtn');

    if (viewClientBtn) {
        viewClientBtn.disabled = (selectedValue === '' || selectedValue === 'new');
    }

    if (selectedValue === 'new') {
        showAddClientModal();
        setTimeout(() => {
            selectElement.value = '';
            resetClientFields();
        }, 100);
    } else if (selectedValue === '') {
        resetClientFields();
    } else {
        const selectedClient = clients.find(c => c.id === parseInt(selectedValue));
        if (selectedClient) {
            fillClientFields(selectedClient);
        } else {
            console.warn(`Client with ID ${selectedValue} not found`);
            resetClientFields();
        }
    }
}

// Fill form with client data
function fillClientFields(client) {
    document.getElementById('clientName').value = client.name || '';
    document.getElementById('clientPhone').value = client.phone || '';
    document.getElementById('clientEmail').value = client.email || '';
}

// Reset all form fields
function resetClientFields() {
    const fieldIds = [
        'clientName', 'clientPhone', 'clientEmail',
        'deviceType', 'deviceBrand', 'deviceModel', 'serialNumber',
        'problemDescription', 'deviceStatus'
    ];

    fieldIds.forEach(id => {
        const field = document.getElementById(id);
        if (field) {
            field.tagName === 'SELECT' ? field.selectedIndex = 0 : field.value = '';
        }
    });
}

// Show modal to add new client
function showAddClientModal() {
    const existingModal = document.getElementById('addClientModal');
    if (existingModal) existingModal.remove();

    const modalHTML = `
    <div class="modal fade" id="addClientModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content border-0 shadow">
                <div class="modal-header" style="background: linear-gradient(135deg, #007553 0%, #004d35 100%); color: white;">
                    <h5 class="modal-title"><i class="fas fa-user-plus me-2"></i> إضافة عميل جديد</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body p-4">
                    <form id="newClientForm">
                        <div class="mb-3">
                            <label for="newClientName" class="form-label">اسم العميل</label>
                            <input type="text" class="form-control" id="newClientName" required>
                        </div>
                        <div class="mb-3">
                            <label for="newClientPhone" class="form-label">رقم الجوال</label>
                            <input type="tel" class="form-control" id="newClientPhone" placeholder="05xxxxxxxx" required>
                        </div>
                        <div class="mb-3">
                            <label for="newClientEmail" class="form-label">البريد الإلكتروني <small class="text-muted">(اختياري)</small></label>
                            <input type="email" class="form-control" id="newClientEmail" placeholder="اختياري">
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إلغاء</button>
                    <button type="button" class="btn btn-success" id="saveClientBtn">
                        <i class="fas fa-save me-2"></i> حفظ البيانات
                    </button>
                </div>
            </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const modal = new bootstrap.Modal(document.getElementById('addClientModal'));
    modal.show();

    setTimeout(() => {
        document.getElementById('newClientName').focus();
    }, 500);

    document.getElementById('saveClientBtn').addEventListener('click', () => {
        saveNewClient(modal);
    });
}

// Save new client (in-memory only)
function saveNewClient(modal) {
    const nameField = document.getElementById('newClientName');
    const phoneField = document.getElementById('newClientPhone');
    const emailField = document.getElementById('newClientEmail');

    if (!nameField.value.trim()) {
        alert('الرجاء إدخال اسم العميل');
        nameField.focus();
        return;
    }

    if (!phoneField.value.trim()) {
        alert('الرجاء إدخال رقم الجوال');
        phoneField.focus();
        return;
    }

    const phoneExists = clients.some(client => client.phone === phoneField.value.trim());
    if (phoneExists) {
        alert('رقم الجوال موجود بالفعل لعميل آخر');
        phoneField.focus();
        return;
    }

    const maxId = clients.reduce((max, c) => Math.max(max, c.id), 0);
    const newClient = {
        id: maxId + 1,
        name: nameField.value.trim(),
        phone: phoneField.value.trim(),
        email: emailField.value.trim(),
        history: []
    };

    clients.push(newClient);
    updateClientDropdown();

    const clientSelect = document.getElementById('clientSelect');
    if (clientSelect) {
        clientSelect.value = newClient.id;
        const viewClientBtn = document.getElementById('viewClientBtn');
        if (viewClientBtn) viewClientBtn.disabled = false;
        fillClientFields(newClient);
    }

    modal.hide();
    alert('تم إضافة العميل بنجاح');
}

// Update the client dropdown options
function updateClientDropdown() {
    const select = document.getElementById('clientSelect');
    if (!select) return;

    select.innerHTML = '<option value="">-- اختر عميلًا --</option><option value="new">+ عميل جديد</option>';
    clients.forEach(client => {
        const option = document.createElement('option');
        option.value = client.id;
        option.textContent = client.name;
        select.appendChild(option);
    });
}

// Show modal with client details
function showClientDetails(clientId) {
    const client = clients.find(c => c.id === parseInt(clientId));
    if (!client) {
        alert('لم يتم العثور على بيانات العميل');
        return;
    }

    let existingModal = document.getElementById('clientDetailsModal');
    if (existingModal) existingModal.remove();

    let historyHTML = client.history.length > 0
        ? client.history.map(item => {
            const date = new Date(item.date).toLocaleDateString('ar-SA');
            return `
                <div class="list-group-item d-flex align-items-center">
                    <div class="me-3">
                        <i class="fas fa-laptop fs-5 text-primary"></i>
                    </div>
                    <div>
                        <div class="fw-bold">${item.brand} ${item.model}</div>
                        <div class="small text-muted">تاريخ الصيانة: ${date}</div>
                        <div class="small">${item.deviceType}</div>
                    </div>
                </div>`;
        }).join('')
        : `<div class="text-center py-3">
                <i class="fas fa-history text-muted mb-2 d-block" style="font-size: 2rem;"></i>
                <p class="text-muted mb-0">لا يوجد سجل صيانة سابق</p>
           </div>`;

    const modalHTML = `
    <div class="modal fade" id="clientDetailsModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-scrollable">
            <div class="modal-content border-0 shadow">
                <div class="modal-header bg-dark text-white">
                    <h5 class="modal-title"><i class="fas fa-user me-2"></i> بيانات العميل</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body p-4">
                    <div class="mb-3">
                        <strong>الاسم:</strong> ${client.name}<br>
                        <strong>الجوال:</strong> ${client.phone}<br>
                        <strong>البريد:</strong> ${client.email || '—'}
                    </div>
                    <div class="mt-4">
                        <h6>سجل الصيانة</h6>
                        <div class="list-group">${historyHTML}</div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إغلاق</button>
                </div>
            </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    new bootstrap.Modal(document.getElementById('clientDetailsModal')).show();
}
