/**
 * create-report.js
 * Handles client management, data collection, and form interaction for the report creation form.
 * Works in conjunction with form-steps.js for the multi-step form functionality.
 */

// Global variables
let clientsData = [];
let selectedClient = null;
let uploadedExternalImages = [];
let uploadedVideoFile = null;

// Initialize when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeCreateReport();
});

/**
 * Initialize the report creation page
 */
function initializeCreateReport() {
    // Load clients data
    loadClients();
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize invoice calculation
    setupInvoiceCalculation();
    
    // Initialize component test management
    setupComponentTests();
    
    // Initialize file uploads
    setupFileUploads();
}

/**
 * Set up all event listeners for the form
 */
function setupEventListeners() {
    // Client search filter
    const clientSearchFilter = document.getElementById('clientSearchFilter');
    if (clientSearchFilter) {
        clientSearchFilter.addEventListener('input', filterClients);
    }
    
    // Clear client search button
    const clearClientSearch = document.getElementById('clearClientSearch');
    if (clearClientSearch) {
        clearClientSearch.addEventListener('click', clearClientFilter);
    }
    
    // Add client button
    const addClientBtn = document.querySelector('[data-bs-target="#addClientModal"]');
    if (addClientBtn) {
        // The modal is handled by Bootstrap, we just need to set up the form submission
        const addClientForm = document.getElementById('addClientForm');
        if (addClientForm) {
            addClientForm.addEventListener('submit', saveNewClient);
        }
    }
    
    // Edit selected client button
    const editSelectedClient = document.getElementById('editSelectedClient');
    if (editSelectedClient) {
        editSelectedClient.addEventListener('click', function() {
            // Open the edit client modal with the selected client data
            if (selectedClient) {
                openEditClientModal(selectedClient);
            }
        });
    }
    
    // Add custom component button
    const addCustomComponentBtn = document.getElementById('addCustomComponentBtn');
    if (addCustomComponentBtn) {
        addCustomComponentBtn.addEventListener('click', addCustomComponent);
    }
    
    // Add component test button
    const addComponentTest = document.getElementById('addComponentTest');
    if (addComponentTest) {
        addComponentTest.addEventListener('click', function() {
            // Show the component test modal
            const modal = new bootstrap.Modal(document.getElementById('addComponentModal'));
            modal.show();
        });
    }
    
    // Component test type selection in modal
    const testTypeCards = document.querySelectorAll('.test-type-card');
    testTypeCards.forEach(card => {
        card.addEventListener('click', function() {
            const testType = this.getAttribute('data-test-type');
            addComponentTestCard(testType);
            
            // Close the modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('addComponentModal'));
            if (modal) {
                modal.hide();
            }
        });
    });
    
    // Reset default text buttons
    const resetDefaultButtons = document.querySelectorAll('.reset-default-btn');
    resetDefaultButtons.forEach(button => {
        button.addEventListener('click', function() {
            const defaultText = this.getAttribute('data-default-text');
            const textareaId = this.closest('.input-group').querySelector('textarea').id;
            document.getElementById(textareaId).value = defaultText;
        });
    });
    
    // Remove test buttons
    setupRemoveTestButtons();
    
    // Add laptop button
    const addLaptopBtn = document.getElementById('addLaptopBtn');
    if (addLaptopBtn) {
        addLaptopBtn.addEventListener('click', addLaptopRow);
    }
    
    // Add item button
    const addItemBtn = document.getElementById('addItemBtn');
    if (addItemBtn) {
        addItemBtn.addEventListener('click', addItemRow);
    }
}

/**
 * Load clients from the API or localStorage
 */
async function loadClients() {
    const clientSelect = document.getElementById('clientSelect');
    const loadingIndicator = document.getElementById('clientLoadingIndicator');
    
    if (!clientSelect || !loadingIndicator) return;
    
    // Show loading indicator
    loadingIndicator.style.display = 'inline-block';
    
    try {
        // Try to load from API first
        if (typeof apiService !== 'undefined' && apiService.getClients) {
            clientsData = await apiService.getClients();
        } else {
            // Fallback to localStorage
            clientsData = JSON.parse(localStorage.getItem('clients') || '[]');
        }
        
        // Populate the dropdown
        populateClientDropdown(clientsData);
    } catch (error) {
        console.error('Error loading clients:', error);
        
        // Fallback to localStorage if API fails
        clientsData = JSON.parse(localStorage.getItem('clients') || '[]');
        populateClientDropdown(clientsData);
        
        // Show error message
        showToast('فشل تحميل بيانات العملاء من الخادم. تم استخدام البيانات المحلية.', 'warning');
    } finally {
        // Hide loading indicator
        loadingIndicator.style.display = 'none';
    }
}

/**
 * Populate the client dropdown with the loaded clients
 * @param {Array} clients - Array of client objects
 */
function populateClientDropdown(clients) {
    const clientSelect = document.getElementById('clientSelect');
    if (!clientSelect) return;
    
    // Clear existing options except the first one
    while (clientSelect.options.length > 1) {
        clientSelect.remove(1);
    }
    
    // Add clients to the dropdown
    clients.forEach(client => {
        const option = document.createElement('option');
        option.value = client.id;
        option.textContent = `${client.name} - ${client.phone}`;
        clientSelect.appendChild(option);
    });
}

/**
 * Filter clients based on search input
 */
function filterClients() {
    const searchInput = document.getElementById('clientSearchFilter');
    const clientSelect = document.getElementById('clientSelect');
    
    if (!searchInput || !clientSelect) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    
    // Reset dropdown first
    populateClientDropdown(clientsData);
    
    // If search term is empty, show all clients
    if (!searchTerm) return;
    
    // Filter options
    for (let i = 1; i < clientSelect.options.length; i++) {
        const option = clientSelect.options[i];
        const optionText = option.textContent.toLowerCase();
        
        if (!optionText.includes(searchTerm)) {
            option.style.display = 'none';
        } else {
            option.style.display = '';
        }
    }
}

/**
 * Clear the client filter
 */
function clearClientFilter() {
    const searchInput = document.getElementById('clientSearchFilter');
    const clientSelect = document.getElementById('clientSelect');
    
    if (!searchInput || !clientSelect) return;
    
    // Clear search input
    searchInput.value = '';
    
    // Reset dropdown
    populateClientDropdown(clientsData);
}

/**
 * Handle client selection change
 * @param {HTMLSelectElement} select - The client select element
 */
window.clientSelectionChanged = function(select) {
    const clientId = select.value;
    const selectedClientInfo = document.getElementById('selectedClientInfo');
    const clientQuickActions = document.getElementById('clientQuickActions');
    
    if (!selectedClientInfo) return;
    
    // If no client is selected, hide the client info
    if (!clientId) {
        selectedClientInfo.style.display = 'none';
        if (clientQuickActions) clientQuickActions.style.display = 'none';
        selectedClient = null;
        return;
    }
    
    // Find the selected client
    selectedClient = clientsData.find(client => client.id == clientId);
    if (!selectedClient) return;
    
    // Update the client info display
    document.getElementById('selectedClientName').textContent = selectedClient.name || 'غير متوفر';
    document.getElementById('selectedClientPhone').innerHTML = `<i class="fas fa-phone me-1"></i> ${selectedClient.phone || 'غير متوفر'}`;
    document.getElementById('selectedClientEmail').innerHTML = `<i class="fas fa-envelope me-1"></i> ${selectedClient.email || 'غير متوفر'}`;
    document.getElementById('selectedClientAddress').textContent = selectedClient.address || 'غير متوفر';
    document.getElementById('selectedClientOrderCode').textContent = selectedClient.orderCode || 'غير متوفر';
    document.getElementById('selectedClientStatus').textContent = selectedClient.status || 'نشط';
    document.getElementById('selectedClientLastReport').textContent = selectedClient.lastReport || 'لا يوجد تقارير سابقة';
    
    // Show the client info
    selectedClientInfo.style.display = 'block';
    if (clientQuickActions) clientQuickActions.style.display = 'flex';
};

/**
 * Save a new client
 * @param {Event} event - The form submit event
 */
async function saveNewClient(event) {
    event.preventDefault();
    
    const form = event.target;
    const nameInput = form.querySelector('#clientName');
    const phoneInput = form.querySelector('#clientPhone');
    const emailInput = form.querySelector('#clientEmail');
    const addressInput = form.querySelector('#clientAddress');
    
    // Validate required fields
    if (!nameInput.value || !phoneInput.value) {
        showToast('يرجى إدخال اسم العميل ورقم الهاتف', 'error');
        return;
    }
    
    // Create client object
    const newClient = {
        id: 'local_' + Date.now(), // Generate a temporary ID
        name: nameInput.value,
        phone: phoneInput.value,
        email: emailInput.value || '',
        address: addressInput.value || '',
        orderCode: generateOrderCode(),
        status: 'نشط',
        createdAt: new Date().toISOString()
    };
    
    try {
        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> جاري الحفظ...';
        
        // Try to save to API
        let savedClient = newClient;
        if (typeof apiService !== 'undefined' && apiService.createClient) {
            savedClient = await apiService.createClient(newClient);
        } else {
            // Fallback to localStorage
            savedClient = saveClientToLocalStorage(newClient);
        }
        
        // Add to clients array and dropdown
        clientsData.push(savedClient);
        addClientToDropdown(savedClient);
        
        // Select the new client
        const clientSelect = document.getElementById('clientSelect');
        if (clientSelect) {
            clientSelect.value = savedClient.id;
            clientSelectionChanged(clientSelect);
        }
        
        // Close the modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('addClientModal'));
        if (modal) {
            modal.hide();
        }
        
        // Reset the form
        form.reset();
        
        // Show success message
        showToast('تم إضافة العميل بنجاح', 'success');
    } catch (error) {
        console.error('Error saving client:', error);
        showToast('حدث خطأ أثناء حفظ بيانات العميل', 'error');
    } finally {
        // Restore button state
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

/**
 * Save a client to localStorage as a fallback
 * @param {Object} client - The client object to save
 * @returns {Object} - The saved client object
 */
function saveClientToLocalStorage(client) {
    // Get existing clients from localStorage
    let clients = JSON.parse(localStorage.getItem('clients') || '[]');
    
    // Add the new client
    clients.push(client);
    
    // Save back to localStorage
    localStorage.setItem('clients', JSON.stringify(clients));
    
    return client;
}

/**
 * Add a client to the dropdown
 * @param {Object} client - The client object to add
 */
function addClientToDropdown(client) {
    const clientSelect = document.getElementById('clientSelect');
    if (!clientSelect) return;
    
    const option = document.createElement('option');
    option.value = client.id;
    option.textContent = `${client.name} - ${client.phone}`;
    clientSelect.appendChild(option);
}

/**
 * Generate a random order code
 * @returns {string} - A random order code
 */
function generateOrderCode() {
    return 'LPK' + Math.floor(100000 + Math.random() * 900000);
}

/**
 * Set up component tests management
 */
function setupComponentTests() {
    // Set up remove test buttons
    setupRemoveTestButtons();
    
    // Set up test status radio buttons
    setupTestStatusRadios();
}

/**
 * Set up the remove test buttons functionality
 */
function setupRemoveTestButtons() {
    const removeButtons = document.querySelectorAll('.remove-test-btn');
    removeButtons.forEach(button => {
        if (button.disabled) return; // Skip disabled buttons
        
        button.addEventListener('click', function() {
            const testCard = this.closest('.component-test-card');
            if (testCard) {
                // Ask for confirmation before removing
                if (confirm('هل أنت متأكد من حذف هذا الاختبار؟')) {
                    testCard.remove();
                }
            }
        });
    });
}

/**
 * Set up test status radio buttons
 */
function setupTestStatusRadios() {
    const testRadios = document.querySelectorAll('.component-test-card input[type="radio"]');
    testRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            const testCard = this.closest('.component-test-card');
            const cardHeader = testCard.querySelector('.card-header');
            
            // Remove existing status classes
            cardHeader.classList.remove('bg-success', 'bg-warning', 'bg-danger', 'bg-light', 'bg-opacity-10');
            
            // Add appropriate class based on selected status
            if (this.value === 'pass') {
                cardHeader.classList.add('bg-success', 'bg-opacity-10');
            } else if (this.value === 'warning') {
                cardHeader.classList.add('bg-warning', 'bg-opacity-10');
            } else if (this.value === 'fail') {
                cardHeader.classList.add('bg-danger', 'bg-opacity-10');
            } else {
                cardHeader.classList.add('bg-light');
            }
        });
    });
}

/**
 * Add a custom hardware component to the table
 */
function addCustomComponent() {
    // Prompt for component name
    const componentName = prompt('أدخل اسم المكون:');
    if (!componentName || componentName.trim() === '') return;
    
    // Create a unique ID for the component
    const componentId = 'custom_' + Date.now();
    
    // Create the new row HTML
    const newRowHTML = `
        <tr>
            <td><i class="fas fa-microchip text-primary me-2"></i> ${componentName}</td>
            <td class="text-center">
                <div class="form-check d-inline-block">
                    <input class="form-check-input" type="radio" name="${componentId}_status" id="${componentId}_working" value="working">
                    <label class="form-check-label" for="${componentId}_working"></label>
                </div>
            </td>
            <td class="text-center">
                <div class="form-check d-inline-block">
                    <input class="form-check-input" type="radio" name="${componentId}_status" id="${componentId}_not_working" value="not_working">
                    <label class="form-check-label" for="${componentId}_not_working"></label>
                </div>
            </td>
            <td class="text-center">
                <div class="form-check d-inline-block">
                    <input class="form-check-input" type="radio" name="${componentId}_status" id="${componentId}_not_available" value="not_available">
                    <label class="form-check-label" for="${componentId}_not_available"></label>
                </div>
            </td>
        </tr>
    `;
    
    // Add the new row to the table
    const tableBody = document.querySelector('#hardwareComponentsTable tbody');
    if (tableBody) {
        tableBody.insertAdjacentHTML('beforeend', newRowHTML);
    }
}

/**
 * Add a component test card based on the selected test type
 * @param {string} testType - The type of test to add
 */
function addComponentTestCard(testType) {
    // Check if this test type already exists
    const existingCard = document.querySelector(`.component-test-card[data-component="${testType}"]`);
    if (existingCard) {
        alert('هذا الاختبار موجود بالفعل');
        return;
    }
    
    // Define test properties based on type
    const testProps = {
        cpu: {
            icon: 'microchip',
            title: 'اختبار المعالج',
            defaultText: 'تم فحص المعالج بنجاح وهو يعمل بشكل ممتاز. جميع الاختبارات اجتازها بنجاح.'
        },
        gpu: {
            icon: 'tv',
            title: 'اختبار كارت الشاشة',
            defaultText: 'تم فحص كارت الشاشة وهو يعمل بشكل جيد.'
        },
        hardDrive: {
            icon: 'hdd',
            title: 'اختبار القرص الصلب',
            defaultText: 'تم فحص القرص الصلب وهو يعمل بشكل جيد.'
        },
        battery: {
            icon: 'battery-three-quarters',
            title: 'اختبار البطارية',
            defaultText: 'تم فحص البطارية وهي تعمل بشكل جيد.'
        },
        keyboard: {
            icon: 'keyboard',
            title: 'اختبار لوحة المفاتيح',
            defaultText: 'تم فحص لوحة المفاتيح وهي تعمل بشكل جيد.'
        },
        memory: {
            icon: 'memory',
            title: 'اختبار الذاكرة',
            defaultText: 'تم فحص الذاكرة وهي تعمل بشكل جيد.'
        },
        cooling: {
            icon: 'fan',
            title: 'اختبار نظام التبريد',
            defaultText: 'تم فحص نظام التبريد وهو يعمل بشكل جيد.'
        },
        custom: {
            icon: 'cog',
            title: 'اختبار مخصص',
            defaultText: 'تم الفحص بنجاح.'
        }
    };
    
    // Use custom if the type is not defined
    const props = testProps[testType] || testProps.custom;
    
    // Create a unique ID for the test
    const testId = testType + '_' + Date.now();
    
    // Create the new test card HTML
    const newCardHTML = `
        <div class="card component-test-card mb-4" data-component="${testType}">
            <div class="card-header bg-light d-flex justify-content-between align-items-center">
                <h5 class="mb-0"><i class="fas fa-${props.icon} me-2"></i> ${props.title}</h5>
                <div>
                    <button type="button" class="btn btn-sm btn-outline-danger remove-test-btn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div class="card-body">
                <div class="mb-3">
                    <div class="d-flex">
                        <div class="form-check form-check-inline">
                            <input class="form-check-input" type="radio" name="${testId}_test" id="${testId}_pass" value="pass">
                            <label class="form-check-label" for="${testId}_pass">ممتاز</label>
                        </div>
                        <div class="form-check form-check-inline">
                            <input class="form-check-input" type="radio" name="${testId}_test" id="${testId}_warning" value="warning">
                            <label class="form-check-label" for="${testId}_warning">به ملاحظات</label>
                        </div>
                        <div class="form-check form-check-inline">
                            <input class="form-check-input" type="radio" name="${testId}_test" id="${testId}_fail" value="fail">
                            <label class="form-check-label" for="${testId}_fail">مرفوض</label>
                        </div>
                    </div>
                </div>
                <div class="mb-3">
                    <label for="${testId}_description" class="form-label">وصف التقرير</label>
                    <div class="input-group mb-1">
                        <textarea class="form-control" id="${testId}_description" rows="2">${props.defaultText}</textarea>
                        <button class="btn btn-outline-secondary reset-default-btn" type="button" title="استعادة النص الافتراضي" data-default-text="${props.defaultText}">
                            <i class="fas fa-undo"></i>
                        </button>
                    </div>
                    <small class="text-muted">يمكنك تعديل النص أو استخدام النص الافتراضي</small>
                </div>
                <div class="mb-3">
                    <label for="${testId}_screenshot" class="form-label">إرفاق صورة نتيجة الاختبار</label>
                    <input type="file" class="form-control" id="${testId}_screenshot" accept="image/*">
                </div>
                <div class="mb-3">
                    <label for="${testId}_notes" class="form-label">ملاحظات</label>
                    <textarea class="form-control" id="${testId}_notes" rows="2"></textarea>
                </div>
            </div>
        </div>
    `;
    
    // Add the new card to the container
    const container = document.getElementById('componentTestsContainer');
    if (container) {
        container.insertAdjacentHTML('beforeend', newCardHTML);
    }
    
    // Set up event listeners for the new card
    setupRemoveTestButtons();
    setupTestStatusRadios();
    
    // Set up reset default text button
    const resetButtons = document.querySelectorAll('.reset-default-btn');
    resetButtons.forEach(button => {
        button.addEventListener('click', function() {
            const defaultText = this.getAttribute('data-default-text');
            const textareaId = this.closest('.input-group').querySelector('textarea').id;
            document.getElementById(textareaId).value = defaultText;
        });
    });
}

/**
 * Set up file uploads for external inspection images and video
 */
function setupFileUploads() {
    // Set up external images upload
    const externalImagesInput = document.getElementById('externalImages');
    if (externalImagesInput) {
        externalImagesInput.addEventListener('change', handleExternalImagesUpload);
        
        // Set up drag and drop for the upload container
        const uploadContainer = externalImagesInput.closest('.upload-container');
        if (uploadContainer) {
            uploadContainer.addEventListener('dragover', function(e) {
                e.preventDefault();
                this.classList.add('dragover');
            });
            
            uploadContainer.addEventListener('dragleave', function(e) {
                e.preventDefault();
                this.classList.remove('dragover');
            });
            
            uploadContainer.addEventListener('drop', function(e) {
                e.preventDefault();
                this.classList.remove('dragover');
                
                if (e.dataTransfer.files.length > 0) {
                    externalImagesInput.files = e.dataTransfer.files;
                    handleExternalImagesUpload({ target: externalImagesInput });
                }
            });
        }
    }
    
    // Set up device video upload
    const deviceVideoInput = document.getElementById('deviceVideo');
    if (deviceVideoInput) {
        deviceVideoInput.addEventListener('change', handleDeviceVideoUpload);
        
        // Set up drag and drop for the video upload container
        const videoUploadContainer = deviceVideoInput.closest('.upload-container');
        if (videoUploadContainer) {
            videoUploadContainer.addEventListener('dragover', function(e) {
                e.preventDefault();
                this.classList.add('dragover');
            });
            
            videoUploadContainer.addEventListener('dragleave', function(e) {
                e.preventDefault();
                this.classList.remove('dragover');
            });
            
            videoUploadContainer.addEventListener('drop', function(e) {
                e.preventDefault();
                this.classList.remove('dragover');
                
                if (e.dataTransfer.files.length > 0) {
                    deviceVideoInput.files = e.dataTransfer.files;
                    handleDeviceVideoUpload({ target: deviceVideoInput });
                }
            });
        }
    }
}

/**
 * Handle external images upload
 * @param {Event} event - The change event from the file input
 */
function handleExternalImagesUpload(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const previewContainer = document.getElementById('externalImagesPreview');
    if (!previewContainer) return;
    
    // Process each file
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Check if it's an image
        if (!file.type.startsWith('image/')) continue;
        
        // Create a preview item
        const previewItem = document.createElement('div');
        previewItem.className = 'external-image-item';
        
        // Create image preview
        const img = document.createElement('img');
        img.className = 'img-thumbnail';
        img.alt = file.name;
        
        // Create remove button
        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn btn-sm btn-danger remove-image-btn';
        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
        removeBtn.title = 'إزالة الصورة';
        
        // Add event listener to remove button
        removeBtn.addEventListener('click', function() {
            previewItem.remove();
            
            // Remove from uploadedExternalImages array
            const index = uploadedExternalImages.findIndex(img => img.file === file);
            if (index !== -1) {
                uploadedExternalImages.splice(index, 1);
            }
        });
        
        // Read the file and create a data URL
        const reader = new FileReader();
        reader.onload = function(e) {
            img.src = e.target.result;
            
            // Add to uploadedExternalImages array
            uploadedExternalImages.push({
                file: file,
                dataUrl: e.target.result,
                name: file.name
            });
        };
        reader.readAsDataURL(file);
        
        // Add elements to the preview item
        previewItem.appendChild(img);
        previewItem.appendChild(removeBtn);
        
        // Add the preview item to the container
        previewContainer.appendChild(previewItem);
    }
}

/**
 * Handle device video upload
 * @param {Event} event - The change event from the file input
 */
function handleDeviceVideoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Check if it's a video
    if (!file.type.startsWith('video/')) {
        alert('الرجاء تحميل ملف فيديو فقط');
        return;
    }
    
    const videoPreviewContainer = document.getElementById('videoPreviewContainer');
    const videoPreview = document.getElementById('videoPreview');
    const videoFileName = document.getElementById('videoFileName');
    
    if (!videoPreviewContainer || !videoPreview || !videoFileName) return;
    
    // Set the file name
    videoFileName.textContent = file.name;
    
    // Create a URL for the video
    const videoURL = URL.createObjectURL(file);
    videoPreview.src = videoURL;
    
    // Show the preview container
    videoPreviewContainer.classList.remove('d-none');
    
    // Store the uploaded video
    uploadedVideoFile = {
        file: file,
        url: videoURL,
        name: file.name
    };
}

/**
 * Set up invoice calculation functionality
 */
function setupInvoiceCalculation() {
    // Set up event listeners for invoice inputs
    const taxRateInput = document.getElementById('taxRate');
    const discountInput = document.getElementById('discount');
    
    if (taxRateInput) {
        taxRateInput.addEventListener('input', updateInvoiceCalculation);
    }
    
    if (discountInput) {
        discountInput.addEventListener('input', updateInvoiceCalculation);
    }
    
    // Initial calculation
    updateInvoiceCalculation();
}

/**
 * Update the invoice calculation based on current inputs
 */
function updateInvoiceCalculation() {
    // Get input values
    const taxRate = parseFloat(document.getElementById('taxRate')?.value || 14);
    const discount = parseFloat(document.getElementById('discount')?.value || 0);
    
    // Calculate totals
    let subtotal = 0;
    
    // Add laptop prices
    const laptopRows = document.querySelectorAll('.laptop-row');
    laptopRows.forEach(row => {
        const price = parseFloat(row.querySelector('.laptop-price')?.value || 0);
        const quantity = parseInt(row.querySelector('.laptop-qty')?.value || 1);
        subtotal += price * quantity;
    });
    
    // Add item prices
    const itemRows = document.querySelectorAll('.item-row');
    itemRows.forEach(row => {
        const price = parseFloat(row.querySelector('.item-price')?.value || 0);
        const quantity = parseInt(row.querySelector('.item-qty')?.value || 1);
        subtotal += price * quantity;
    });
    
    // Calculate tax and total
    const taxAmount = (subtotal * taxRate) / 100;
    const totalAmount = subtotal - discount + taxAmount;
    
    // Update display
    document.getElementById('subtotalDisplay').textContent = subtotal.toFixed(2) + ' جنية';
    document.getElementById('discountDisplay').textContent = discount.toFixed(2) + ' جنية';
    document.getElementById('taxDisplay').textContent = taxAmount.toFixed(2) + ' جنية';
    document.getElementById('totalDisplay').textContent = totalAmount.toFixed(2) + ' جنية';
}

/**
 * Add a laptop row to the invoice
 */
function addLaptopRow() {
    const laptopsContainer = document.getElementById('laptopsContainer');
    if (!laptopsContainer) return;
    
    // Create a unique ID for the laptop
    const laptopId = 'laptop_' + Date.now();
    
    // Create the new row HTML
    const newRowHTML = `
        <div class="row mb-3 laptop-row">
            <div class="col-md-4">
                <input type="text" class="form-control laptop-name" placeholder="موديل الجهاز" />
            </div>
            <div class="col-md-3">
                <input type="text" class="form-control laptop-serial" placeholder="الرقم التسلسلي" />
            </div>
            <div class="col-md-2">
                <input type="number" class="form-control laptop-price" placeholder="السعر" min="0" step="0.01" />
            </div>
            <div class="col-md-2">
                <input type="number" class="form-control laptop-qty" value="1" min="1" max="100" />
            </div>
            <div class="col-md-1">
                <button type="button" class="btn btn-outline-danger remove-laptop-btn d-block">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `;
    
    // Add the new row to the container
    laptopsContainer.insertAdjacentHTML('beforeend', newRowHTML);
    
    // Set up event listeners for the new row
    const newRow = laptopsContainer.lastElementChild;
    
    // Price and quantity change events
    const priceInput = newRow.querySelector('.laptop-price');
    const qtyInput = newRow.querySelector('.laptop-qty');
    
    if (priceInput) {
        priceInput.addEventListener('input', updateInvoiceCalculation);
    }
    
    if (qtyInput) {
        qtyInput.addEventListener('input', updateInvoiceCalculation);
    }
    
    // Remove button event
    const removeButton = newRow.querySelector('.remove-laptop-btn');
    if (removeButton) {
        removeButton.addEventListener('click', function() {
            newRow.remove();
            updateInvoiceCalculation();
        });
    }
    
    // Update the calculation
    updateInvoiceCalculation();
}

/**
 * Add an item row to the invoice
 */
function addItemRow() {
    const itemsContainer = document.getElementById('itemsContainer');
    if (!itemsContainer) return;
    
    // Create a unique ID for the item
    const itemId = 'item_' + Date.now();
    
    // Create the new row HTML
    const newRowHTML = `
        <div class="row mb-3 item-row">
            <div class="col-md-6">
                <input type="text" class="form-control item-name" placeholder="اسم العنصر" />
            </div>
            <div class="col-md-2">
                <input type="number" class="form-control item-price" placeholder="السعر" min="0" step="0.01" />
            </div>
            <div class="col-md-2">
                <input type="number" class="form-control item-qty" value="1" min="1" max="100" />
            </div>
            <div class="col-md-2">
                <button type="button" class="btn btn-outline-danger remove-item-btn d-block">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `;
    
    // Add the new row to the container
    itemsContainer.insertAdjacentHTML('beforeend', newRowHTML);
    
    // Set up event listeners for the new row
    const newRow = itemsContainer.lastElementChild;
    
    // Price and quantity change events
    const priceInput = newRow.querySelector('.item-price');
    const qtyInput = newRow.querySelector('.item-qty');
    
    if (priceInput) {
        priceInput.addEventListener('input', updateInvoiceCalculation);
    }
    
    if (qtyInput) {
        qtyInput.addEventListener('input', updateInvoiceCalculation);
    }
    
    // Remove button event
    const removeButton = newRow.querySelector('.remove-item-btn');
    if (removeButton) {
        removeButton.addEventListener('click', function() {
            newRow.remove();
            updateInvoiceCalculation();
        });
    }
    
    // Update the calculation
    updateInvoiceCalculation();
}

/**
 * Collect all report data from the form
 * @returns {Object} - The collected report data
 */
window.collectReportData = function() {
    // Get client ID from selection
    const clientId = document.getElementById('clientSelect')?.value || null;
    
    // Find selected client details from global clientsData
    let clientDetails = {};
    if (clientId && Array.isArray(clientsData)) {
        const selectedClient = clientsData.find(client => client.id == clientId);
        if (selectedClient) {
            clientDetails = {
                clientName: selectedClient.name,
                clientPhone: selectedClient.phone,
                clientEmail: selectedClient.email || '',
                clientAddress: selectedClient.address || ''
            };
        }
    }
    
    // Get basic device information
    const orderNumber = document.getElementById('orderNumber')?.value || '';
    const inspectionDate = document.getElementById('inspectionDate')?.value || new Date().toISOString().split('T')[0];
    const deviceModel = document.getElementById('deviceModel')?.value || '';
    const serialNumber = document.getElementById('serialNumber')?.value || '';
    
    // Get hardware component statuses
    const hardwareStatus = {};
    const componentRows = document.querySelectorAll('#hardwareComponentsTable tbody tr');
    componentRows.forEach(row => {
        const componentName = row.querySelector('td:first-child').textContent.trim();
        const componentId = row.querySelector('input[type="radio"]').name.replace('_status', '');
        
        // Find the checked radio button
        const checkedRadio = row.querySelector('input[type="radio"]:checked');
        const status = checkedRadio ? checkedRadio.value : 'not_tested';
        
        hardwareStatus[componentId] = {
            name: componentName,
            status: status
        };
    });
    
    // Get component test results
    const componentTests = [];
    const testCards = document.querySelectorAll('.component-test-card');
    testCards.forEach(card => {
        const componentType = card.getAttribute('data-component');
        const testId = card.querySelector('input[type="radio"]').name.replace('_test', '');
        
        // Find the checked radio button
        const checkedRadio = card.querySelector('input[type="radio"]:checked');
        const status = checkedRadio ? checkedRadio.value : 'not_tested';
        
        // Get description and notes
        const description = card.querySelector(`#${testId}_description`)?.value || '';
        const notes = card.querySelector(`#${testId}_notes`)?.value || '';
        
        // Get screenshot if available
        const screenshotInput = card.querySelector(`#${testId}_screenshot`);
        let screenshot = null;
        if (screenshotInput && screenshotInput.files.length > 0) {
            const file = screenshotInput.files[0];
            screenshot = {
                name: file.name,
                type: file.type,
                size: file.size
            };
        }
        
        componentTests.push({
            id: testId,
            type: componentType,
            status: status,
            description: description,
            notes: notes,
            screenshot: screenshot
        });
    });
    
    // Get general notes
    const notes = document.getElementById('generalNotes')?.value || '';
    
    // Check if billing is enabled
    const billingEnabled = document.getElementById('enableBilling')?.checked || false;
    
    // Get invoice data if billing is enabled
    let invoiceData = null;
    if (billingEnabled) {
        // Get laptops
        const laptops = [];
        const laptopRows = document.querySelectorAll('.laptop-row');
        laptopRows.forEach(row => {
            const name = row.querySelector('.laptop-name')?.value || '';
            const serial = row.querySelector('.laptop-serial')?.value || '';
            const price = parseFloat(row.querySelector('.laptop-price')?.value || 0);
            const quantity = parseInt(row.querySelector('.laptop-qty')?.value || 1);
            
            laptops.push({
                name: name,
                serialNumber: serial,
                price: price,
                quantity: quantity,
                total: price * quantity
            });
        });
        
        // Get items
        const items = [];
        const itemRows = document.querySelectorAll('.item-row');
        itemRows.forEach(row => {
            const name = row.querySelector('.item-name')?.value || '';
            const price = parseFloat(row.querySelector('.item-price')?.value || 0);
            const quantity = parseInt(row.querySelector('.item-qty')?.value || 1);
            
            items.push({
                name: name,
                price: price,
                quantity: quantity,
                total: price * quantity
            });
        });
        
        // Calculate totals
        let subtotal = 0;
        
        // Add laptop totals
        laptops.forEach(laptop => {
            subtotal += laptop.total;
        });
        
        // Add item totals
        items.forEach(item => {
            subtotal += item.total;
        });
        
        // Get tax rate and discount
        const taxRate = parseFloat(document.getElementById('taxRate')?.value || 14);
        const discount = parseFloat(document.getElementById('discount')?.value || 0);
        
        // Calculate tax and total
        const taxAmount = (subtotal * taxRate) / 100;
        const totalAmount = subtotal - discount + taxAmount;
        
        // Get payment information
        const paymentStatus = document.getElementById('paymentStatus')?.value || 'unpaid';
        const paymentMethod = document.getElementById('paymentMethod')?.value || '';
        
        invoiceData = {
            laptops: laptops,
            items: items,
            taxRate: taxRate,
            discount: discount,
            subtotal: subtotal,
            taxAmount: taxAmount,
            totalAmount: totalAmount,
            paymentStatus: paymentStatus,
            paymentMethod: paymentMethod
        };
    }
    
    // Create a unique ID for the report
    const reportId = 'report_' + Date.now();
    
    // Return collected data
    return {
        id: reportId,
        clientId: clientId,
        ...clientDetails,
        orderNumber: orderNumber,
        inspectionDate: inspectionDate,
        deviceModel: deviceModel,
        serialNumber: serialNumber,
        hardwareStatus: hardwareStatus,
        componentTests: componentTests,
        externalImages: uploadedExternalImages.map(img => ({
            name: img.name,
            type: img.file.type,
            size: img.file.size
        })),
        video: uploadedVideoFile ? {
            name: uploadedVideoFile.name,
            type: uploadedVideoFile.file.type,
            size: uploadedVideoFile.file.size
        } : null,
        notes: notes,
        billingEnabled: billingEnabled,
        invoice: invoiceData,
        amount: invoiceData ? invoiceData.totalAmount : 0,
        createdAt: new Date().toISOString()
    };
};