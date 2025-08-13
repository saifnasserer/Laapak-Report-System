/**
 * Laapak Report System - Edit Report
 * Handles the report editing functionality
 */

// Global variables
let currentReport = null;
let currentStep = 0;
let clientsData = [];
let originalReportData = null;

// Initialize the edit report functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    if (typeof authMiddleware !== 'undefined' && !authMiddleware.isAdminLoggedIn()) {
        window.location.href = 'index.html';
        return;
    }
    
    // Get report ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const reportId = urlParams.get('id');
    
    if (!reportId) {
        showError('معرف التقرير مطلوب');
        return;
    }
    
    // Initialize the edit form
    initializeEditForm(reportId);
});

/**
 * Initialize the edit form
 * @param {string} reportId - The report ID to edit
 */
async function initializeEditForm(reportId) {
    try {
        showLoading(true);
        
        // Load report data
        const report = await loadReportData(reportId);
        if (!report) {
            showError('لم يتم العثور على التقرير');
            return;
        }
        
        currentReport = report;
        originalReportData = JSON.parse(JSON.stringify(report)); // Deep copy for comparison
        
        // Load clients data
        await loadClients();
        
        // Populate form with report data
        populateFormWithReportData(report);
        
        // Set up form navigation
        setupFormNavigation();
        
        // Set up client search
        setupClientSearch();
        
        // Set up billing toggle
        setupBillingToggle();
        
        showLoading(false);
        
    } catch (error) {
        console.error('Error initializing edit form:', error);
        showError('حدث خطأ أثناء تحميل بيانات التقرير');
        showLoading(false);
    }
}

/**
 * Load report data from API
 * @param {string} reportId - The report ID
 * @returns {Promise<Object>} The report data
 */
async function loadReportData(reportId) {
    try {
        const response = await apiService.getReport(reportId);
        return response.report;
    } catch (error) {
        console.error('Error loading report:', error);
        throw error;
    }
}

/**
 * Load clients data
 * @returns {Promise<Array>} Array of clients
 */
async function loadClients() {
    try {
        clientsData = await apiService.getClients();
        return clientsData;
    } catch (error) {
        console.error('Error loading clients:', error);
        // Use cached data if available
        const cachedClients = localStorage.getItem('lpk_clients');
        if (cachedClients) {
            clientsData = JSON.parse(cachedClients);
        }
        return clientsData || [];
    }
}

/**
 * Populate form with report data
 * @param {Object} report - The report data
 */
function populateFormWithReportData(report) {
    // Step 1: General Information
    populateGeneralInformation(report);
    
    // Step 2: Technical Tests
    populateTechnicalTests(report);
    
    // Step 3: External Inspection
    populateExternalInspection(report);
    
    // Step 4: Notes
    populateNotes(report);
    
    // Step 5: Invoice
    populateInvoice(report);
}

/**
 * Populate general information step
 * @param {Object} report - The report data
 */
function populateGeneralInformation(report) {
    // Client information
    if (report.client) {
        const clientSearchInput = document.getElementById('clientSearchInput');
        if (clientSearchInput) {
            clientSearchInput.value = report.client.name || report.client_name;
        }
        
        // Update client info display
        updateClientInfoDisplay(report.client);
    }
    
    // Device information
    const orderNumberInput = document.getElementById('orderNumber');
    if (orderNumberInput) {
        orderNumberInput.value = report.order_number || '';
    }
    
    const inspectionDateInput = document.getElementById('inspectionDate');
    if (inspectionDateInput) {
        const inspectionDate = new Date(report.inspection_date);
        inspectionDateInput.value = inspectionDate.toISOString().split('T')[0];
    }
    
    const deviceModelInput = document.getElementById('deviceModel');
    if (deviceModelInput) {
        deviceModelInput.value = report.device_model || '';
    }
    
    const serialNumberInput = document.getElementById('serialNumber');
    if (serialNumberInput) {
        serialNumberInput.value = report.serial_number || '';
    }
}

/**
 * Populate technical tests step
 * @param {Object} report - The report data
 */
function populateTechnicalTests(report) {
    const contentContainer = document.getElementById('technicalTestsContent');
    if (!contentContainer) return;
    
    // Parse hardware status from JSON
    let hardwareStatus = [];
    try {
        if (report.hardware_status) {
            hardwareStatus = JSON.parse(report.hardware_status);
        }
    } catch (error) {
        console.error('Error parsing hardware status:', error);
    }
    
    // Create technical tests content
    const content = createTechnicalTestsContent(hardwareStatus);
    contentContainer.innerHTML = content;
    
    // Set up technical tests functionality
    setupTechnicalTests();
}

/**
 * Create technical tests content
 * @param {Array} hardwareStatus - The hardware status data
 * @returns {string} HTML content
 */
function createTechnicalTestsContent(hardwareStatus) {
    return `
        <div class="row">
            <div class="col-12">
                <div class="card">
                    <div class="card-header bg-light">
                        <h6 class="mb-0">
                            <i class="fas fa-cogs me-2"></i>حالة المكونات
                        </h6>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="form-label">المعالج (CPU)</label>
                                <div class="btn-group w-100" role="group">
                                    <input type="radio" class="btn-check" name="cpuStatus" id="cpuWorking" value="working">
                                    <label class="btn btn-outline-success" for="cpuWorking">يعمل</label>
                                    <input type="radio" class="btn-check" name="cpuStatus" id="cpuNotWorking" value="not_working">
                                    <label class="btn btn-outline-danger" for="cpuNotWorking">لا يعمل</label>
                                    <input type="radio" class="btn-check" name="cpuStatus" id="cpuUnknown" value="unknown">
                                    <label class="btn btn-outline-secondary" for="cpuUnknown">غير معروف</label>
                                </div>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="form-label">الذاكرة (RAM)</label>
                                <div class="btn-group w-100" role="group">
                                    <input type="radio" class="btn-check" name="ramStatus" id="ramWorking" value="working">
                                    <label class="btn btn-outline-success" for="ramWorking">تعمل</label>
                                    <input type="radio" class="btn-check" name="ramStatus" id="ramNotWorking" value="not_working">
                                    <label class="btn btn-outline-danger" for="ramNotWorking">لا تعمل</label>
                                    <input type="radio" class="btn-check" name="ramStatus" id="ramUnknown" value="unknown">
                                    <label class="btn btn-outline-secondary" for="ramUnknown">غير معروف</label>
                                </div>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="form-label">القرص الصلب (HDD/SSD)</label>
                                <div class="btn-group w-100" role="group">
                                    <input type="radio" class="btn-check" name="storageStatus" id="storageWorking" value="working">
                                    <label class="btn btn-outline-success" for="storageWorking">يعمل</label>
                                    <input type="radio" class="btn-check" name="storageStatus" id="storageNotWorking" value="not_working">
                                    <label class="btn btn-outline-danger" for="storageNotWorking">لا يعمل</label>
                                    <input type="radio" class="btn-check" name="storageStatus" id="storageUnknown" value="unknown">
                                    <label class="btn btn-outline-secondary" for="storageUnknown">غير معروف</label>
                                </div>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="form-label">البطارية</label>
                                <div class="btn-group w-100" role="group">
                                    <input type="radio" class="btn-check" name="batteryStatus" id="batteryWorking" value="working">
                                    <label class="btn btn-outline-success" for="batteryWorking">تعمل</label>
                                    <input type="radio" class="btn-check" name="batteryStatus" id="batteryNotWorking" value="not_working">
                                    <label class="btn btn-outline-danger" for="batteryNotWorking">لا تعمل</label>
                                    <input type="radio" class="btn-check" name="batteryStatus" id="batteryUnknown" value="unknown">
                                    <label class="btn btn-outline-secondary" for="batteryUnknown">غير معروف</label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Set up technical tests functionality
 */
function setupTechnicalTests() {
    // Add event listeners for technical tests
    // This will be implemented based on the specific requirements
}

/**
 * Populate external inspection step
 * @param {Object} report - The report data
 */
function populateExternalInspection(report) {
    const contentContainer = document.getElementById('externalInspectionContent');
    if (!contentContainer) return;
    
    // Parse external images from JSON
    let externalImages = [];
    try {
        if (report.external_images) {
            externalImages = JSON.parse(report.external_images);
        }
    } catch (error) {
        console.error('Error parsing external images:', error);
    }
    
    // Create external inspection content
    const content = createExternalInspectionContent(externalImages);
    contentContainer.innerHTML = content;
    
    // Set up external inspection functionality
    setupExternalInspection();
}

/**
 * Create external inspection content
 * @param {Array} externalImages - The external images data
 * @returns {string} HTML content
 */
function createExternalInspectionContent(externalImages) {
    return `
        <div class="row">
            <div class="col-12">
                <div class="card">
                    <div class="card-header bg-light">
                        <h6 class="mb-0">
                            <i class="fas fa-camera me-2"></i>الصور والفيديوهات
                        </h6>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label for="imageUrlInput" class="form-label">إضافة صورة</label>
                                <div class="input-group">
                                    <input type="url" class="form-control" id="imageUrlInput" placeholder="رابط الصورة">
                                    <button class="btn btn-outline-primary" type="button" id="addImageUrlBtn">
                                        <i class="fas fa-plus"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label for="videoUrlInput" class="form-label">إضافة فيديو</label>
                                <div class="input-group">
                                    <input type="url" class="form-control" id="videoUrlInput" placeholder="رابط الفيديو">
                                    <button class="btn btn-outline-primary" type="button" id="addVideoUrlBtn">
                                        <i class="fas fa-plus"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Image URLs -->
                        <div class="mb-3">
                            <label class="form-label">الصور المضافة</label>
                            <div id="imageUrlBadges" class="mb-2">
                                <!-- Image badges will be added here -->
                            </div>
                            <div id="externalImagesPreview" class="row">
                                <!-- Image previews will be added here -->
                            </div>
                        </div>
                        
                        <!-- Video URLs -->
                        <div class="mb-3">
                            <label class="form-label">الفيديوهات المضافة</label>
                            <div id="videoUrlBadges" class="mb-2">
                                <!-- Video badges will be added here -->
                            </div>
                            <div id="videoPreviewContainer">
                                <!-- Video previews will be added here -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Set up external inspection functionality
 */
function setupExternalInspection() {
    // Add event listeners for external inspection
    // This will be implemented based on the specific requirements
}

/**
 * Populate notes step
 * @param {Object} report - The report data
 */
function populateNotes(report) {
    const contentContainer = document.getElementById('notesContent');
    if (!contentContainer) return;
    
    const content = `
        <div class="row">
            <div class="col-12">
                <div class="card">
                    <div class="card-header bg-light">
                        <h6 class="mb-0">
                            <i class="fas fa-sticky-note me-2"></i>ملاحظات التقرير
                        </h6>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <label for="reportNotes" class="form-label">ملاحظات عامة</label>
                            <textarea class="form-control" id="reportNotes" rows="4" placeholder="أضف ملاحظاتك هنا...">${report.notes || ''}</textarea>
                        </div>
                        <div class="mb-3">
                            <label for="generalNotes" class="form-label">ملاحظات تقنية</label>
                            <textarea class="form-control" id="generalNotes" rows="4" placeholder="أضف الملاحظات التقنية هنا..."></textarea>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    contentContainer.innerHTML = content;
}

/**
 * Populate invoice step
 * @param {Object} report - The report data
 */
function populateInvoice(report) {
    const contentContainer = document.getElementById('invoiceContent');
    if (!contentContainer) return;
    
    const content = `
        <div class="row">
            <div class="col-12">
                <div class="card">
                    <div class="card-header bg-light">
                        <h6 class="mb-0">
                            <i class="fas fa-file-invoice me-2"></i>معلومات الفاتورة
                        </h6>
                    </div>
                    <div class="card-body">
                        <div class="form-check form-switch mb-3">
                            <input class="form-check-input" type="checkbox" id="enableBilling" ${report.billing_enabled ? 'checked' : ''}>
                            <label class="form-check-label" for="enableBilling">
                                تفعيل الفاتورة
                            </label>
                        </div>
                        
                        <div id="invoiceFieldsContainer" style="display: ${report.billing_enabled ? 'block' : 'none'};">
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="devicePrice" class="form-label">سعر الجهاز</label>
                                    <input type="number" class="form-control" id="devicePrice" value="${report.amount || 250}" step="0.01">
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="taxRate" class="form-label">نسبة الضريبة (%)</label>
                                    <input type="number" class="form-control" id="taxRate" value="14" step="0.01">
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="discount" class="form-label">الخصم</label>
                                    <input type="number" class="form-control" id="discount" value="0" step="0.01">
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="paymentStatus" class="form-label">حالة الدفع</label>
                                    <select class="form-select" id="paymentStatus">
                                        <option value="unpaid" ${report.paymentStatus === 'unpaid' ? 'selected' : ''}>غير مدفوع</option>
                                        <option value="partial" ${report.paymentStatus === 'partial' ? 'selected' : ''}>مدفوع جزئياً</option>
                                        <option value="paid" ${report.paymentStatus === 'paid' ? 'selected' : ''}>مدفوع</option>
                                    </select>
                                </div>
                            </div>
                            
                            <!-- Invoice Summary -->
                            <div class="card bg-light">
                                <div class="card-body">
                                    <h6 class="card-title">ملخص الفاتورة</h6>
                                    <div class="row">
                                        <div class="col-md-3">
                                            <small class="text-muted">المجموع الفرعي:</small>
                                            <div id="subtotalDisplay" class="fw-bold">${report.amount || 250} جنية</div>
                                        </div>
                                        <div class="col-md-3">
                                            <small class="text-muted">الضريبة:</small>
                                            <div id="taxDisplay" class="fw-bold">${((report.amount || 250) * 0.14).toFixed(2)} جنية</div>
                                        </div>
                                        <div class="col-md-3">
                                            <small class="text-muted">الخصم:</small>
                                            <div id="discountDisplay" class="fw-bold">0 جنية</div>
                                        </div>
                                        <div class="col-md-3">
                                            <small class="text-muted">الإجمالي:</small>
                                            <div id="totalDisplay" class="fw-bold text-success">${((report.amount || 250) * 1.14).toFixed(2)} جنية</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    contentContainer.innerHTML = content;
    
    // Set up invoice functionality
    setupInvoiceFunctionality();
}

/**
 * Set up invoice functionality
 */
function setupInvoiceFunctionality() {
    const enableBilling = document.getElementById('enableBilling');
    const invoiceFieldsContainer = document.getElementById('invoiceFieldsContainer');
    
    if (enableBilling && invoiceFieldsContainer) {
        enableBilling.addEventListener('change', function() {
            invoiceFieldsContainer.style.display = this.checked ? 'block' : 'none';
        });
    }
    
    // Add other invoice-related event listeners
}

/**
 * Set up form navigation
 */
function setupFormNavigation() {
    const nextButtons = document.querySelectorAll('.btn-next-step');
    const prevButtons = document.querySelectorAll('.btn-prev-step');
    
    nextButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (validateCurrentStep()) {
                nextStep();
            }
        });
    });
    
    prevButtons.forEach(button => {
        button.addEventListener('click', () => {
            prevStep();
        });
    });
}

/**
 * Validate current step
 * @returns {boolean} True if validation passes
 */
function validateCurrentStep() {
    const currentStepElement = document.querySelector(`#step${currentStep + 1}`);
    if (!currentStepElement) return true;
    
    // Add validation logic for each step
    switch (currentStep) {
        case 0: // Step 1: General Information
            return validateGeneralInformation();
        case 1: // Step 2: Technical Tests
            return validateTechnicalTests();
        case 2: // Step 3: External Inspection
            return validateExternalInspection();
        case 3: // Step 4: Notes
            return validateNotes();
        case 4: // Step 5: Invoice
            return validateInvoice();
        default:
            return true;
    }
}

/**
 * Validate general information step
 * @returns {boolean} True if validation passes
 */
function validateGeneralInformation() {
    const requiredFields = ['orderNumber', 'inspectionDate', 'deviceModel'];
    let isValid = true;
    
    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field && !field.value.trim()) {
            field.classList.add('is-invalid');
            isValid = false;
        } else if (field) {
            field.classList.remove('is-invalid');
        }
    });
    
    // Check if client is selected
    const clientSearchInput = document.getElementById('clientSearchInput');
    if (clientSearchInput && !clientSearchInput.value.trim()) {
        clientSearchInput.classList.add('is-invalid');
        isValid = false;
    } else if (clientSearchInput) {
        clientSearchInput.classList.remove('is-invalid');
    }
    
    return isValid;
}

/**
 * Validate technical tests step
 * @returns {boolean} True if validation passes
 */
function validateTechnicalTests() {
    // Add validation logic for technical tests
    return true;
}

/**
 * Validate external inspection step
 * @returns {boolean} True if validation passes
 */
function validateExternalInspection() {
    // Add validation logic for external inspection
    return true;
}

/**
 * Validate notes step
 * @returns {boolean} True if validation passes
 */
function validateNotes() {
    // Add validation logic for notes
    return true;
}

/**
 * Validate invoice step
 * @returns {boolean} True if validation passes
 */
function validateInvoice() {
    const enableBilling = document.getElementById('enableBilling');
    if (enableBilling && enableBilling.checked) {
        const devicePrice = document.getElementById('devicePrice');
        if (devicePrice && (!devicePrice.value || parseFloat(devicePrice.value) <= 0)) {
            devicePrice.classList.add('is-invalid');
            return false;
        } else if (devicePrice) {
            devicePrice.classList.remove('is-invalid');
        }
    }
    return true;
}

/**
 * Navigate to next step
 */
function nextStep() {
    if (currentStep < 4) {
        currentStep++;
        showStep(currentStep);
        updateProgressBar();
    }
}

/**
 * Navigate to previous step
 */
function prevStep() {
    if (currentStep > 0) {
        currentStep--;
        showStep(currentStep);
        updateProgressBar();
    }
}

/**
 * Show specific step
 * @param {number} stepIndex - The step index to show
 */
function showStep(stepIndex) {
    // Hide all steps
    const steps = document.querySelectorAll('.form-step');
    steps.forEach(step => {
        step.style.display = 'none';
    });
    
    // Show current step
    const currentStepElement = document.querySelector(`#step${stepIndex + 1}`);
    if (currentStepElement) {
        currentStepElement.style.display = 'block';
    }
    
    // Update step indicators
    updateStepIndicators(stepIndex);
}

/**
 * Update step indicators
 * @param {number} stepIndex - The current step index
 */
function updateStepIndicators(stepIndex) {
    const stepItems = document.querySelectorAll('.step-item');
    const stepButtons = document.querySelectorAll('.step-button');
    
    stepItems.forEach((item, index) => {
        if (index <= stepIndex) {
            item.classList.add('active');
            stepButtons[index].classList.remove('btn-outline-primary');
            stepButtons[index].classList.add('btn-primary');
        } else {
            item.classList.remove('active');
            stepButtons[index].classList.remove('btn-primary');
            stepButtons[index].classList.add('btn-outline-primary');
        }
    });
}

/**
 * Update progress bar
 */
function updateProgressBar() {
    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) {
        const progress = ((currentStep + 1) / 5) * 100;
        progressBar.style.width = `${progress}%`;
        progressBar.setAttribute('aria-valuenow', progress);
    }
}

/**
 * Set up client search functionality
 */
function setupClientSearch() {
    const searchInput = document.getElementById('clientSearchInput');
    const searchResults = document.getElementById('clientSearchResults');
    
    if (!searchInput || !searchResults) return;
    
    let searchTimeout;
    
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.trim();
        
        clearTimeout(searchTimeout);
        
        if (!searchTerm) {
            searchResults.style.display = 'none';
            return;
        }
        
        searchTimeout = setTimeout(() => {
            performClientSearch(searchTerm);
        }, 300);
    });
    
    // Handle click outside to close results
    document.addEventListener('click', function(e) {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.style.display = 'none';
        }
    });
}

/**
 * Perform client search
 * @param {string} searchTerm - The search term
 */
function performClientSearch(searchTerm) {
    const searchResults = document.getElementById('clientSearchResults');
    if (!searchResults) return;
    
    const filteredClients = clientsData.filter(client => {
        const name = (client.name || '').toLowerCase();
        const phone = (client.phone || '').toLowerCase();
        const email = (client.email || '').toLowerCase();
        const orderCode = (client.orderCode || '').toLowerCase();
        const searchLower = searchTerm.toLowerCase();
        
        return name.includes(searchLower) || 
               phone.includes(searchLower) || 
               email.includes(searchLower) ||
               orderCode.includes(searchLower);
    });
    
    displayClientSearchResults(filteredClients);
}

/**
 * Display client search results
 * @param {Array} clients - The filtered clients
 */
function displayClientSearchResults(clients) {
    const searchResults = document.getElementById('clientSearchResults');
    if (!searchResults) return;
    
    searchResults.innerHTML = '';
    
    if (clients.length === 0) {
        searchResults.innerHTML = `
            <div class="p-3 text-center text-muted">
                <i class="fas fa-search me-2"></i>
                لا توجد نتائج
            </div>
        `;
    } else {
        clients.forEach(client => {
            const resultItem = document.createElement('div');
            resultItem.className = 'client-result-item p-3 border-bottom cursor-pointer';
            resultItem.style.cursor = 'pointer';
            
            resultItem.innerHTML = `
                <div class="d-flex align-items-center">
                    <div class="flex-shrink-0">
                        <div class="client-avatar d-flex align-items-center justify-content-center rounded-circle bg-success bg-opacity-10 text-success" style="width: 40px; height: 40px;">
                            <i class="fas fa-user"></i>
                        </div>
                    </div>
                    <div class="flex-grow-1 ms-3">
                        <div class="fw-bold">${client.name}</div>
                        <div class="text-muted small">
                            <i class="fas fa-phone me-1"></i>${client.phone}
                            ${client.email ? `<br><i class="fas fa-envelope me-1"></i>${client.email}` : ''}
                            ${client.orderCode ? `<br><i class="fas fa-hashtag me-1"></i>${client.orderCode}` : ''}
                        </div>
                    </div>
                </div>
            `;
            
            resultItem.addEventListener('click', function() {
                selectClient(client);
            });
            
            searchResults.appendChild(resultItem);
        });
    }
    
    searchResults.style.display = 'block';
}

/**
 * Select a client from search results
 * @param {Object} client - The selected client
 */
function selectClient(client) {
    const searchInput = document.getElementById('clientSearchInput');
    const searchResults = document.getElementById('clientSearchResults');
    
    if (searchInput) {
        searchInput.value = client.name;
    }
    
    if (searchResults) {
        searchResults.style.display = 'none';
    }
    
    updateClientInfoDisplay(client);
}

/**
 * Update client info display
 * @param {Object} client - The client data
 */
function updateClientInfoDisplay(client) {
    const selectedClientInfo = document.getElementById('selectedClientInfo');
    if (!selectedClientInfo) return;
    
    const nameElement = document.getElementById('selectedClientName');
    const phoneElement = document.getElementById('selectedClientPhone');
    const emailElement = document.getElementById('selectedClientEmail');
    
    if (nameElement) nameElement.textContent = client.name;
    if (phoneElement) phoneElement.innerHTML = `<i class="fas fa-phone me-1"></i> ${client.phone || 'غير متوفر'}`;
    if (emailElement) emailElement.innerHTML = `<i class="fas fa-envelope me-1"></i> ${client.email || 'غير متوفر'}`;
    
    selectedClientInfo.style.display = 'block';
}

/**
 * Set up billing toggle functionality
 */
function setupBillingToggle() {
    const enableBilling = document.getElementById('enableBilling');
    const invoiceFieldsContainer = document.getElementById('invoiceFieldsContainer');
    
    if (enableBilling && invoiceFieldsContainer) {
        enableBilling.addEventListener('change', function() {
            invoiceFieldsContainer.style.display = this.checked ? 'block' : 'none';
        });
    }
}

/**
 * Show loading overlay
 * @param {boolean} show - Whether to show or hide loading
 */
function showLoading(show) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = show ? 'flex' : 'none';
    }
}

/**
 * Show error message
 * @param {string} message - The error message
 */
function showError(message) {
    // Create error alert
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-danger alert-dismissible fade show';
    alertDiv.innerHTML = `
        <i class="fas fa-exclamation-triangle me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Insert at the top of the container
    const container = document.querySelector('.container-fluid');
    if (container) {
        container.insertBefore(alertDiv, container.firstChild);
    }
}

/**
 * Show success message
 * @param {string} message - The success message
 */
function showSuccess(message) {
    // Create success alert
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-success alert-dismissible fade show';
    alertDiv.innerHTML = `
        <i class="fas fa-check-circle me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Insert at the top of the container
    const container = document.querySelector('.container-fluid');
    if (container) {
        container.insertBefore(alertDiv, container.firstChild);
    }
}

/**
 * Preview the report
 */
function previewReport() {
    if (currentReport) {
        window.open(`report.html?id=${currentReport.id}`, '_blank');
    }
}

// Set up form submission
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('editReportForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmission);
    }
});

/**
 * Handle form submission
 * @param {Event} e - The form submission event
 */
async function handleFormSubmission(e) {
    e.preventDefault();
    
    if (!validateCurrentStep()) {
        showError('يرجى تصحيح الأخطاء في النموذج');
        return;
    }
    
    try {
        showLoading(true);
        
        // Collect form data
        const formData = collectFormData();
        
        // Update report
        const updatedReport = await apiService.updateReport(currentReport.id, formData);
        
        showLoading(false);
        
        // Show success message
        showSuccess('تم تحديث التقرير بنجاح');
        
        // Show success modal
        const successModal = new bootstrap.Modal(document.getElementById('reportUpdatedModal'));
        successModal.show();
        
        // Update current report
        currentReport = updatedReport;
        
    } catch (error) {
        console.error('Error updating report:', error);
        showLoading(false);
        showError('حدث خطأ أثناء تحديث التقرير');
    }
}

/**
 * Collect form data
 * @returns {Object} The collected form data
 */
function collectFormData() {
    // Collect data from all steps
    const formData = {
        // General information
        order_number: document.getElementById('orderNumber')?.value || '',
        inspection_date: document.getElementById('inspectionDate')?.value || '',
        device_model: document.getElementById('deviceModel')?.value || '',
        serial_number: document.getElementById('serialNumber')?.value || '',
        
        // Notes
        notes: document.getElementById('reportNotes')?.value || '',
        
        // Billing
        billing_enabled: document.getElementById('enableBilling')?.checked || false,
        amount: parseFloat(document.getElementById('devicePrice')?.value || 0),
        paymentStatus: document.getElementById('paymentStatus')?.value || 'unpaid'
    };
    
    // Add client information if selected
    const clientSearchInput = document.getElementById('clientSearchInput');
    if (clientSearchInput && clientSearchInput.value) {
        const selectedClient = clientsData.find(client => client.name === clientSearchInput.value);
        if (selectedClient) {
            formData.client_id = selectedClient.id;
            formData.client_name = selectedClient.name;
            formData.client_phone = selectedClient.phone;
            formData.client_email = selectedClient.email;
            formData.client_address = selectedClient.address;
        }
    }
    
    // Add technical tests data
    formData.hardware_status = collectTechnicalTestsData();
    
    // Add external inspection data
    formData.external_images = collectExternalInspectionData();
    
    return formData;
}

/**
 * Collect technical tests data
 * @returns {string} JSON string of technical tests data
 */
function collectTechnicalTestsData() {
    const hardwareStatus = [];
    
    // Collect CPU status
    const cpuStatus = document.querySelector('input[name="cpuStatus"]:checked')?.value || 'unknown';
    hardwareStatus.push({
        componentName: 'cpu',
        status: cpuStatus
    });
    
    // Collect RAM status
    const ramStatus = document.querySelector('input[name="ramStatus"]:checked')?.value || 'unknown';
    hardwareStatus.push({
        componentName: 'ram',
        status: ramStatus
    });
    
    // Collect storage status
    const storageStatus = document.querySelector('input[name="storageStatus"]:checked')?.value || 'unknown';
    hardwareStatus.push({
        componentName: 'storage',
        status: storageStatus
    });
    
    // Collect battery status
    const batteryStatus = document.querySelector('input[name="batteryStatus"]:checked')?.value || 'unknown';
    hardwareStatus.push({
        componentName: 'battery',
        status: batteryStatus
    });
    
    return JSON.stringify(hardwareStatus);
}

/**
 * Collect external inspection data
 * @returns {string} JSON string of external inspection data
 */
function collectExternalInspectionData() {
    const externalImages = [];
    
    // Collect image URLs
    const imageBadges = document.querySelectorAll('#imageUrlBadges .badge');
    imageBadges.forEach(badge => {
        const url = badge.getAttribute('data-url');
        if (url) {
            externalImages.push({
                type: 'image',
                url: url
            });
        }
    });
    
    // Collect video URLs
    const videoBadges = document.querySelectorAll('#videoUrlBadges .badge');
    videoBadges.forEach(badge => {
        const url = badge.getAttribute('data-url');
        const type = badge.getAttribute('data-type') || 'video';
        if (url) {
            externalImages.push({
                type: type,
                url: url
            });
        }
    });
    
    return JSON.stringify(externalImages);
} 