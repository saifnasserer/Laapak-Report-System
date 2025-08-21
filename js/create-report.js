/**
 * Laapak Report System - Create Report
 * Handles the report creation form and API integration
 */

// Store clients data and device details globally to make them accessible across files
// Attach to window object to ensure it's available across all files
window.clientsData = window.clientsData || [];

// Global variables to store device details from step 1 (attached to window for cross-file access)
window.globalDeviceDetails = window.globalDeviceDetails || {
    orderNumber: '',
    inspectionDate: '',
    deviceModel: '',
    serialNumber: '',
    devicePrice: ''
};

// Global client details object for storing selected client information
window.globalClientDetails = window.globalClientDetails || {
    client_id: null,
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    clientAddress: ''
};

// Multi-functional mode detection and state management
window.reportMode = window.reportMode || {
    mode: 'create', // 'create' or 'edit'
    reportId: null,
    originalData: null,
    isInitialized: false
};

// Local references for convenience
let globalDeviceDetails = window.globalDeviceDetails;
let clientsData = window.clientsData;
let reportMode = window.reportMode;

/**
 * Enhanced initialization for multi-functional report handling
 */
function initializeReportForm() {
    console.log('Initializing multi-functional report form...');
    
    // Detect mode from URL parameters
    detectReportMode();
    
    // Initialize based on mode
    if (reportMode.mode === 'edit') {
        initializeEditMode();
    } else {
        initializeCreateMode();
    }
}

/**
 * Detect report mode from URL parameters
 */
function detectReportMode() {
    const urlParams = new URLSearchParams(window.location.search);
    const reportId = urlParams.get('id');
    
    if (reportId) {
        reportMode.mode = 'edit';
        reportMode.reportId = reportId;
        console.log(`Edit mode detected for report ID: ${reportId}`);
    } else {
        reportMode.mode = 'create';
        reportMode.reportId = null;
        console.log('Create mode detected');
    }
}

/**
 * Initialize create mode
 */
function initializeCreateMode() {
    console.log('Initializing create mode...');
    
    // Set up form for new report creation
    setupFormForCreate();
    
    // Initialize all form components
    initializeFormComponents();
    
    // Mark as initialized
    reportMode.isInitialized = true;
}

/**
 * Initialize edit mode
 */
async function initializeEditMode() {
    console.log('Initializing edit mode...');
    console.log('Report ID:', reportMode.reportId);
    
    try {
        showLoading(true);
        
        // First, ensure clients are loaded
        console.log('Loading clients...');
        await loadClients();
        console.log('Clients loaded, count:', clientsData ? clientsData.length : 0);
        
        // Load existing report data
        console.log('Loading report data...');
        const report = await loadExistingReport(reportMode.reportId);
        console.log('Report loaded:', report);
        
        if (!report) {
            throw new Error('Report not found');
        }
        
        // Store original data for comparison
        reportMode.originalData = JSON.parse(JSON.stringify(report));
        
        // Transform and populate form data
        console.log('Transforming and populating report data...');
        transformAndPopulateReportData(report);
        
        // Set up form for editing
        console.log('Setting up form for editing...');
        setupFormForEdit();
        
        // Initialize all form components
        console.log('Initializing form components...');
        initializeFormComponents();
        
        // Mark as initialized
        reportMode.isInitialized = true;
        console.log('Edit mode initialization complete');
        
        showLoading(false);
        
    } catch (error) {
        console.error('Error initializing edit mode:', error);
        showError('Failed to load report data: ' + error.message);
        showLoading(false);
        
        // Fallback to create mode
        console.log('Falling back to create mode');
        reportMode.mode = 'create';
        initializeCreateMode();
    }
}

/**
 * Load existing report data
 * @param {string} reportId - The report ID to load
 * @returns {Promise<Object>} The report data
 */
async function loadExistingReport(reportId) {
    try {
        console.log(`Loading existing report: ${reportId}`);
        
        // Use the basic getReport method first to get the correct structure
        const response = await apiService.getReport(reportId);
        console.log('API response:', response);
        
        // Handle different response formats
        let reportData;
        if (response.success && response.report) {
            // If response has success and report properties
            reportData = response.report;
        } else if (response.report) {
            // If response has a report property
            reportData = response.report;
        } else if (response.id) {
            // If response is the report object directly
            reportData = response;
        } else {
            throw new Error('Invalid report data format');
        }
        
        console.log('Extracted report data:', reportData);
        
        // If we need client data and it's not included, fetch it separately
        if (reportData.client_id && !reportData.client) {
            try {
                const client = await apiService.getClient(reportData.client_id);
                reportData.client = client;
            } catch (error) {
                console.warn('Could not fetch client data:', error);
            }
        }
        
        return reportData;
        
    } catch (error) {
        console.error('Error loading existing report:', error);
        throw error;
    }
}

/**
 * Transform and populate report data into the form
 * @param {Object} report - The report data
 */
function transformAndPopulateReportData(report) {
    console.log('Starting data transformation and population...');
    console.log('Report data received:', report);
    
    try {
        // Populate general information (client and device details)
        console.log('Populating general information...');
        populateGeneralInformation(report);
        
        // Populate technical tests (hardware status and test screenshots)
        console.log('Populating technical tests...');
        populateTechnicalTests(report);
        
        // Populate external inspection (images and videos)
        console.log('Populating external inspection...');
        populateExternalInspection(report);
        
        // Populate notes
        console.log('Populating notes...');
        populateNotes(report);
        
        // Populate invoice data
        console.log('Populating invoice data...');
        populateInvoiceData(report);
        
        // Update page UI for edit mode
        console.log('Updating page UI for edit mode...');
        updatePageForEditMode();
        
        console.log('Data transformation and population complete');
        
    } catch (error) {
        console.error('Error in transformAndPopulateReportData:', error);
        throw error;
    }
}

/**
 * Populate general information from report data
 * @param {Object} report - The report data
 */
function populateGeneralInformation(report) {
    console.log('Populating general information:', report);
    console.log('Report client data:', report.client);
    console.log('Report client_id:', report.client_id);
    console.log('Available clients data:', clientsData);
    
    // Client information
    if (report.client) {
        console.log('Using report.client data');
        // Update global client details
        window.globalClientDetails = {
            client_id: report.client.id,
            clientName: report.client.name || '',
            clientPhone: report.client.phone || '',
            clientEmail: report.client.email || '',
            clientAddress: report.client.address || ''
        };
        
        // Update client search input
        const clientSearchInput = document.getElementById('clientSearchInput');
        if (clientSearchInput) {
            clientSearchInput.value = report.client.name || '';
        }
        
        // Update client info display
        updateClientInfoDisplay(report.client);
    } else if (report.client_id) {
        console.log('Looking for client in clientsData with ID:', report.client_id);
        // If we have client_id but no client object, try to find client in loaded data
        const client = clientsData.find(c => c.id == report.client_id);
        if (client) {
            console.log('Found client in clientsData:', client);
            window.globalClientDetails = {
                client_id: client.id,
                clientName: client.name || '',
                clientPhone: client.phone || '',
                clientEmail: client.email || '',
                clientAddress: client.address || ''
            };
            
            const clientSearchInput = document.getElementById('clientSearchInput');
            if (clientSearchInput) {
                clientSearchInput.value = client.name || '';
            }
            
            updateClientInfoDisplay(client);
        } else {
            console.warn('Client not found in clientsData for ID:', report.client_id);
        }
    }
    
    // Device information - handle both database field names and form field names
    console.log('Setting device information:');
    console.log('- order_number:', report.order_number);
    console.log('- device_model:', report.device_model);
    console.log('- serial_number:', report.serial_number);
    console.log('- inspection_date:', report.inspection_date);
    
    const orderNumberInput = document.getElementById('orderNumber');
    if (orderNumberInput) {
        orderNumberInput.value = report.order_number || '';
        console.log('Set orderNumberInput value to:', orderNumberInput.value);
    }
    
    const inspectionDateInput = document.getElementById('inspectionDate');
    if (inspectionDateInput) {
        let inspectionDate;
        if (report.inspection_date) {
            inspectionDate = new Date(report.inspection_date);
        } else if (report.inspectionDate) {
            inspectionDate = new Date(report.inspectionDate);
        }
        
        if (inspectionDate && !isNaN(inspectionDate.getTime())) {
            inspectionDateInput.value = inspectionDate.toISOString().split('T')[0];
        } else {
            inspectionDateInput.value = new Date().toISOString().split('T')[0];
        }
        console.log('Set inspectionDateInput value to:', inspectionDateInput.value);
    }
    
    const deviceModelInput = document.getElementById('deviceModel');
    if (deviceModelInput) {
        deviceModelInput.value = report.device_model || report.deviceModel || '';
        console.log('Set deviceModelInput value to:', deviceModelInput.value);
    }
    
    const serialNumberInput = document.getElementById('serialNumber');
    if (serialNumberInput) {
        serialNumberInput.value = report.serial_number || report.serialNumber || '';
        console.log('Set serialNumberInput value to:', serialNumberInput.value);
    }
    
    // Update global device details
    updateGlobalDeviceDetails();
}

/**
 * Populate technical tests from report data
 * @param {Object} report - The report data
 */
function populateTechnicalTests(report) {
    console.log('Populating technical tests:', report);
    
    // Parse hardware status
    let hardwareStatus = [];
    try {
        if (report.hardware_status) {
            hardwareStatus = JSON.parse(report.hardware_status);
        }
    } catch (error) {
        console.error('Error parsing hardware status:', error);
    }
    
    // Populate hardware component statuses
    populateHardwareStatus(hardwareStatus);
    
    // Populate test screenshots
    populateTestScreenshots(report);
}

/**
 * Populate hardware status from data
 * @param {Array} hardwareStatus - The hardware status data
 */
function populateHardwareStatus(hardwareStatus) {
    if (!Array.isArray(hardwareStatus)) return;
    
    // Component mapping from database names to form field names
    const componentMapping = {
        'camera': 'camera_status',
        'speakers': 'speakers_status', 
        'microphone': 'microphone_status',
        'Wi-Fi': 'wifi_status',
        'LAN': 'lan_status',
        'Ports': 'usb_status',
        'keyboard': 'keyboard_status',
        'Touchpad': 'touchpad_status',
        'card': 'card_reader_status',
        'audio_jack': 'audio_jack_status',
        'DisplayPort': 'display_ports_status',
        'bluetooth_status': 'Bluetooth',
        'touchscreen_status': 'touchscreen'
    };
    
    hardwareStatus.forEach(component => {
        const componentName = component.componentName;
        const status = component.status;
        
        if (!componentName || !status) return;
        
        // Find the corresponding form field name
        const formFieldName = componentMapping[componentName];
        if (!formFieldName) return;
        
        // Find and check the appropriate radio button
        const radioButton = document.querySelector(`input[name="${formFieldName}"][value="${status}"]`);
        if (radioButton) {
            radioButton.checked = true;
        }
    });
}

/**
 * Populate test screenshots from report data
 * @param {Object} report - The report data
 */
function populateTestScreenshots(report) {
    console.log('Populating test screenshots from report data:', report);
    
    // Parse external images from JSON
    let externalImages = [];
    try {
        if (report.external_images) {
            externalImages = JSON.parse(report.external_images);
        }
    } catch (error) {
        console.error('Error parsing external images:', error);
    }
    
    if (!Array.isArray(externalImages)) return;
    
    // Filter test screenshots from external images
    const testScreenshots = externalImages.filter(item => item.type === 'test_screenshot');
    
    console.log('Found test screenshots:', testScreenshots);
    
    // Add a small delay to ensure DOM elements are created
    setTimeout(() => {
        // Populate each test screenshot
        testScreenshots.forEach(screenshot => {
            const component = screenshot.component;
            const url = screenshot.url;
            
            if (component && url) {
                // Check if the preview container exists
                const previewContainer = document.getElementById(`${component}ScreenshotPreview`);
                if (previewContainer) {
                    // Add the screenshot preview
                    addTestScreenshotPreview(url, component);
                }
            }
        });
    }, 200);
}

/**
 * Populate external inspection from report data
 * @param {Object} report - The report data
 */
function populateExternalInspection(report) {
    console.log('Populating external inspection:', report);
    
    // Parse external images from JSON
    let externalImages = [];
    try {
        if (report.external_images) {
            externalImages = JSON.parse(report.external_images);
        }
    } catch (error) {
        console.error('Error parsing external images:', error);
    }
    
    if (!Array.isArray(externalImages)) return;
    
    // Filter images and videos
    const images = externalImages.filter(item => item.type === 'image');
    const videos = externalImages.filter(item => item.type === 'video' || item.type === 'youtube' || item.type === 'vimeo' || item.type === 'gdrive');
    
    // Add a small delay to ensure DOM elements are created
    setTimeout(() => {
        // Populate images
        images.forEach(image => {
            if (image.url) {
                addImageBadge(image.url);
                createImagePreview(image.url);
            }
        });
        
        // Populate videos
        videos.forEach(video => {
            if (video.url) {
                addVideoBadge(video.url, video.type);
                createVideoPreview(video.url, video.type);
            }
        });
    }, 200);
}

/**
 * Populate notes from report data
 * @param {Object} report - The report data
 */
function populateNotes(report) {
    console.log('Populating notes:', report.notes);
    
    const notesInput = document.getElementById('reportNotes');
    if (notesInput) {
        notesInput.value = report.notes || '';
    }
}

/**
 * Populate invoice data from report data
 * @param {Object} report - The report data
 */
function populateInvoiceData(report) {
    console.log('Populating invoice data:', report);
    
    // Set billing toggle
    const enableBillingCheckbox = document.getElementById('enableBilling');
    if (enableBillingCheckbox) {
        enableBillingCheckbox.checked = report.billing_enabled || false;
    }
    
    // Set device price - handle both amount and devicePrice fields
    const devicePriceInput = document.getElementById('devicePrice');
    if (devicePriceInput) {
        devicePriceInput.value = report.amount || report.devicePrice || 250;
    }
    
    // Update tax display
    updateTaxDisplay();
    
    // Update billing UI to reflect the current state
    if (typeof updateBillingUI === 'function') {
        updateBillingUI();
    }
}

/**
 * Update page UI for edit mode
 */
function updatePageForEditMode() {
    // Update page title
    document.title = 'تعديل التقرير - Laapak Report System';
    
    // Update main heading
    const mainHeading = document.querySelector('h1, .main-heading');
    if (mainHeading) {
        mainHeading.textContent = 'تعديل التقرير';
    }
    
    // Update submit button text
    const submitBtn = document.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-save me-2"></i> حفظ التغييرات';
    }
    
    // Add invoice management section if billing is enabled
    addInvoiceManagementSection();
}

/**
 * Add invoice management section for edit mode
 */
function addInvoiceManagementSection() {
    const billingSection = document.getElementById('billingSection');
    if (!billingSection) return;
    
    // Check if billing is enabled
    const enableBillingCheckbox = document.getElementById('enableBilling');
    if (!enableBillingCheckbox || !enableBillingCheckbox.checked) return;
    
    // Create invoice management section
    const invoiceManagementDiv = document.createElement('div');
    invoiceManagementDiv.className = 'card mt-3 border-info';
    invoiceManagementDiv.innerHTML = `
        <div class="card-header bg-info text-white">
            <h6 class="mb-0">
                <i class="fas fa-file-invoice me-2"></i>إدارة الفواتير
            </h6>
        </div>
        <div class="card-body">
            <div class="row">
                <div class="col-md-6">
                    <button type="button" class="btn btn-outline-primary btn-sm" onclick="checkAndManageInvoice()">
                        <i class="fas fa-search me-1"></i>البحث عن الفواتير المرتبطة
                    </button>
                </div>
                <div class="col-md-6">
                    <button type="button" class="btn btn-outline-success btn-sm" onclick="createNewInvoiceForReport()">
                        <i class="fas fa-plus me-1"></i>إنشاء فاتورة جديدة
                    </button>
                </div>
            </div>
            <div id="invoiceStatusDisplay" class="mt-2"></div>
        </div>
    `;
    
    // Insert after billing section
    billingSection.parentNode.insertBefore(invoiceManagementDiv, billingSection.nextSibling);
}

/**
 * Check and manage invoice for current report
 */
async function checkAndManageInvoice() {
    try {
        const reportId = reportMode.reportId;
        if (!reportId) {
            showToast('معرف التقرير غير متوفر', 'error');
            return;
        }
        
        const existingInvoice = await checkExistingInvoice(reportId);
        const statusDisplay = document.getElementById('invoiceStatusDisplay');
        
        if (existingInvoice) {
            statusDisplay.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    <strong>تم العثور على فاتورة:</strong> ${existingInvoice.id}
                    <div class="mt-2">
                        <a href="edit-invoice.html?id=${existingInvoice.id}" class="btn btn-sm btn-primary me-2">
                            <i class="fas fa-edit me-1"></i>تعديل الفاتورة
                        </a>
                        <a href="view-invoice.html?id=${existingInvoice.id}" class="btn btn-sm btn-outline-primary">
                            <i class="fas fa-eye me-1"></i>عرض الفاتورة
                        </a>
                    </div>
                </div>
            `;
        } else {
            statusDisplay.innerHTML = `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    <strong>لا توجد فواتير مرتبطة بهذا التقرير</strong>
                    <div class="mt-2">
                        <button type="button" class="btn btn-sm btn-success" onclick="createNewInvoiceForReport()">
                            <i class="fas fa-plus me-1"></i>إنشاء فاتورة جديدة
                        </button>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error checking invoice:', error);
        showToast('حدث خطأ أثناء البحث عن الفواتير', 'error');
    }
}

/**
 * Create new invoice for current report
 */
function createNewInvoiceForReport() {
    const reportId = reportMode.reportId;
    if (!reportId) {
        showToast('معرف التقرير غير متوفر', 'error');
        return;
    }
    
    // Prepare invoice data
    const invoiceData = {
        client_id: window.globalClientDetails?.client_id,
        report_id: reportId,
        date: new Date().toISOString().split('T')[0],
        paymentStatus: 'unpaid',
        paymentMethod: '',
        discount: parseFloat(document.getElementById('discount')?.value || 0),
        taxRate: parseFloat(document.getElementById('taxRate')?.value || 0),
        items: [{
            description: `فحص وإصلاح ${document.getElementById('deviceModel')?.value || 'جهاز'}`,
            quantity: 1,
            amount: parseFloat(document.getElementById('devicePrice')?.value || 0),
            type: 'service'
        }]
    };
    
    // Store data for new invoice page
    localStorage.setItem('lpk_new_invoice_data', JSON.stringify(invoiceData));
    
    // Redirect to new invoice page
    window.open('edit-invoice.html?new=true', '_blank');
}

/**
 * Set up form for create mode
 */
function setupFormForCreate() {
    console.log('Setting up form for create mode...');
    
    // Reset form to default state
    const form = document.getElementById('reportForm');
    if (form) {
        form.reset();
    }
    
    // Set default values
    const inspectionDateInput = document.getElementById('inspectionDate');
    if (inspectionDateInput) {
        inspectionDateInput.value = new Date().toISOString().split('T')[0];
    }
    
    // Clear any existing data
    clearFormData();
}

/**
 * Set up form for edit mode
 */
function setupFormForEdit() {
    console.log('Setting up form for edit mode...');
    
    // Form is already populated by transformAndPopulateReportData
    // Just ensure all event listeners are properly set up
}

/**
 * Clear form data
 */
function clearFormData() {
    // Clear client selection
    window.globalClientDetails = {
        client_id: null,
        clientName: '',
        clientPhone: '',
        clientEmail: '',
        clientAddress: ''
    };
    
    // Clear device details
    window.globalDeviceDetails = {
        orderNumber: '',
        inspectionDate: '',
        deviceModel: '',
        serialNumber: '',
        devicePrice: ''
    };
    
    // Clear test screenshots
    const components = ['info', 'cpu', 'gpu', 'hdd', 'keyboard', 'battery', 'dxdiag'];
    components.forEach(component => {
        const previewContainer = document.getElementById(`${component}ScreenshotPreview`);
        if (previewContainer) {
            previewContainer.innerHTML = '';
        }
    });
    
    // Clear external images and videos
    const imageBadges = document.getElementById('imageUrlBadges');
    if (imageBadges) imageBadges.innerHTML = '';
    
    const videoBadges = document.getElementById('videoUrlBadges');
    if (videoBadges) videoBadges.innerHTML = '';
    
    const externalImagesPreview = document.getElementById('externalImagesPreview');
    if (externalImagesPreview) externalImagesPreview.innerHTML = '';
    
    const videoPreviewContainer = document.getElementById('videoPreviewContainer');
    if (videoPreviewContainer) videoPreviewContainer.innerHTML = '';
}

/**
 * Initialize all form components
 */
function initializeFormComponents() {
    // Add event listeners to update global device details when input values change
    const deviceInputs = ['orderNumber', 'inspectionDate', 'deviceModel', 'serialNumber'];
    deviceInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('change', updateGlobalDeviceDetails);
            input.addEventListener('input', updateGlobalDeviceDetails);
        }
    });
    
    // Set up order number field with LPK prefix and number-only input
    setupOrderNumberField();
    
    // Initial update of global device details
    updateGlobalDeviceDetails();
    
    // Load clients for the search (only if not already loaded)
    if (!clientsData || clientsData.length === 0) {
        loadClients();
    }
    
    // Set up event listener for adding a new client
    const saveClientBtn = document.getElementById('saveClientBtn');
    if (saveClientBtn) {
        saveClientBtn.addEventListener('click', saveNewClient);
    }
    
    // Set up client search functionality
    setupClientSearch();
    
    // Set up event listeners for client quick actions
    setupClientQuickActions();
    
    // Set up billing toggle functionality
    setupBillingToggle();
    
    // Set up test screenshot URL functionality for Step 2
    setupTestScreenshotFunctionality();
    
    // Set up image and video URL functionality for Step 3
    setupImageAndVideoFunctionality();
    
    // Set up form submission
    setupFormSubmission();
}

/**
     * Set up order number field with LPK prefix and number-only input
     */
    function setupOrderNumberField() {
        const orderNumberInput = document.getElementById('orderNumber');
        if (!orderNumberInput) return;
        
        // Set initial value with LPK prefix
        if (!orderNumberInput.value || orderNumberInput.value === 'LPK') {
            orderNumberInput.value = 'LPK';
        }
        
        // Add event listeners for input handling
        orderNumberInput.addEventListener('input', function(e) {
            let value = this.value;
            
            // Ensure LPK prefix is always present
            if (!value.startsWith('LPK')) {
                value = 'LPK' + value.replace(/^LPK/, '');
            }
            
            // Remove any non-numeric characters after LPK
            const prefix = 'LPK';
            const numericPart = value.substring(prefix.length).replace(/[^0-9]/g, '');
            
            // Limit to reasonable length (e.g., 6 digits)
            const limitedNumericPart = numericPart.substring(0, 6);
            
            // Combine prefix with numeric part
            const finalValue = prefix + limitedNumericPart;
            
            // Update input value
            this.value = finalValue;
            
            // Update global device details
            updateGlobalDeviceDetails();
        });
        
        // Handle paste events
        orderNumberInput.addEventListener('paste', function(e) {
            e.preventDefault();
            
            // Get pasted text
            const pastedText = (e.clipboardData || window.clipboardData).getData('text');
            
            // Process the pasted text
            let value = pastedText;
            
            // Remove LPK if it's in the pasted text
            value = value.replace(/^LPK/i, '');
            
            // Keep only numbers
            value = value.replace(/[^0-9]/g, '');
            
            // Limit length
            value = value.substring(0, 6);
            
            // Set the value with LPK prefix
            this.value = 'LPK' + value;
            
            // Update global device details
            updateGlobalDeviceDetails();
        });
        
        // Handle keydown for special keys
        orderNumberInput.addEventListener('keydown', function(e) {
            // Allow: backspace, delete, tab, escape, enter, and navigation keys
            if ([8, 9, 27, 13, 46, 37, 38, 39, 40].indexOf(e.keyCode) !== -1 ||
                // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                (e.keyCode === 65 && e.ctrlKey === true) ||
                (e.keyCode === 67 && e.ctrlKey === true) ||
                (e.keyCode === 86 && e.ctrlKey === true) ||
                (e.keyCode === 88 && e.ctrlKey === true)) {
                return;
            }
            
            // Allow numbers only
            if ((e.keyCode >= 48 && e.keyCode <= 57) || (e.keyCode >= 96 && e.keyCode <= 105)) {
                return;
            }
            
            // Prevent all other keys
            e.preventDefault();
        });
        
        // Handle focus to select numeric part only
        orderNumberInput.addEventListener('focus', function() {
            // Select only the numeric part (after LPK)
            const value = this.value;
            const prefixLength = 'LPK'.length;
            
            if (value.length > prefixLength) {
                this.setSelectionRange(prefixLength, value.length);
            } else {
                this.setSelectionRange(prefixLength, prefixLength);
            }
        });
        
        // Handle click to position cursor correctly
        orderNumberInput.addEventListener('click', function() {
            const value = this.value;
            const prefixLength = 'LPK'.length;
            const cursorPosition = this.selectionStart;
            
            // If cursor is in the prefix area, move it to the end
            if (cursorPosition < prefixLength) {
                this.setSelectionRange(prefixLength, prefixLength);
            }
        });
        
        console.log('Order number field setup completed');
    }
    
/**
 * Update global device details from form inputs
 */
function updateGlobalDeviceDetails() {
    window.globalDeviceDetails = {
        orderNumber: document.getElementById('orderNumber')?.value || '',
        inspectionDate: document.getElementById('inspectionDate')?.value || new Date().toISOString().split('T')[0],
        deviceModel: document.getElementById('deviceModel')?.value || '',
        serialNumber: document.getElementById('serialNumber')?.value || '',
        devicePrice: parseFloat(document.getElementById('devicePrice')?.value || '250')
    };
    console.log('Global device details updated:', window.globalDeviceDetails);
}

// Helper function to extract Google Drive File ID
function getGoogleDriveFileId(url) {
    console.log('[Debug GDrive] getGoogleDriveFileId received_url:', url);
    if (!url) return null;
    const gDrivePatterns = [
        /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
        /drive\.google\.com\/uc\?id=([a-zA-Z0-9_-]+)/,
        /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
        /lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/
    ];
    for (const pattern of gDrivePatterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }
    return null;
}

// Helper function to validate image URL
function isValidImageUrl(url) {
    // Basic URL validation
    if (!url || !url.match(/^https?:\/\/.+/i)) {
        return false;
    }

    // Check for Google Drive link
    if (getGoogleDriveFileId(url)) {
        return true;
    }
    
    // Check if URL ends with common image extensions
    const imageExtensions = /\.(jpeg|jpg|png|gif|bmp|webp)$/i;
    return imageExtensions.test(url);
}

// Helper function to determine video URL type
function getVideoUrlType(url) {
    if (!url || !url.match(/^https?:\/\/.+/i)) {
        return null;
    }

    // Check for Google Drive URLs first
    if (getGoogleDriveFileId(url)) {
        // Further check if it's a known video player link or just a file
        // For simplicity, if it's GDrive, we'll try to embed it as a video.
        // More specific checks (e.g. mime type from API) would be more robust.
        return 'gdrive'; 
    }
    
    // Check for YouTube URLs
    if (url.match(/youtube\.com\/watch\?v=|youtu\.be\//i)) {
        return 'youtube';
    }
    
    // Check for Vimeo URLs
    if (url.match(/vimeo\.com\//i)) {
        return 'vimeo';
    }
    
    // Check for direct video file URLs
    const videoExtensions = /\.(mp4|webm|ogg|mov)$/i;
    if (videoExtensions.test(url)) {
        return 'video';
    }
    
    // Default to unknown but potentially valid video URL
    return 'unknown';
}

// Helper function to extract YouTube video ID
function getYoutubeVideoId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

// Helper function to extract Vimeo video ID
function getVimeoVideoId(url) {
    const regExp = /vimeo\.com\/(?:video\/)?([0-9]+)/;
    const match = url.match(regExp);
    return match ? match[1] : null;
}

// Helper function to create a preview for an image URL
function createImagePreview(imageUrl) {
    const previewContainer = document.getElementById('externalImagesPreview');
    
    const imageCard = document.createElement('div');
    imageCard.className = 'image-card';
    
    const img = document.createElement('img');
    let displayUrl = imageUrl;
    console.log('[Debug GDrive] createImagePreview original_imageUrl:', imageUrl);
    const gDriveFileId = getGoogleDriveFileId(imageUrl);
    console.log('[Debug GDrive] createImagePreview extracted_gDriveFileId:', gDriveFileId);

    if (gDriveFileId) {
        displayUrl = `https://lh3.googleusercontent.com/d/${gDriveFileId}`;
    }

    img.src = displayUrl;
    console.log('[Debug GDrive] createImagePreview final_displayUrl_for_img_src:', displayUrl);
    img.alt = 'External inspection image';
    img.className = 'img-fluid';
    img.onerror = function() {
        this.onerror = null;
        this.src = 'img/image-error.png'; // Fallback image
        this.alt = 'Image failed to load';
    };
    
    const overlay = document.createElement('div');
    overlay.className = 'image-overlay';
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn btn-sm btn-danger remove-image-btn';
    removeBtn.innerHTML = '<i class="fas fa-trash"></i>';
    removeBtn.setAttribute('data-url', imageUrl); // Store original URL for removal logic
    removeBtn.addEventListener('click', function() {
        imageCard.remove();
        const badges = document.querySelectorAll(`#imageUrlBadges .badge[data-url="${imageUrl}"]`);
        badges.forEach(badge => badge.remove());
    });
    
    overlay.appendChild(removeBtn);
    imageCard.appendChild(img);
    imageCard.appendChild(overlay);
    previewContainer.appendChild(imageCard);
}

// Helper function to create a preview for a video URL
function createVideoPreview(videoUrl, videoType) {
    const previewContainer = document.getElementById('videoPreviewContainer');
    
    const videoCard = document.createElement('div');
    videoCard.className = 'card mb-3';
    videoCard.setAttribute('data-url', videoUrl); // Store original URL
    
    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';
    console.log('[Debug GDrive] createVideoPreview original_videoUrl:', videoUrl, 'videoType:', videoType);
    
    const cardHeader = document.createElement('div');
    cardHeader.className = 'd-flex justify-content-between align-items-center mb-2';
    
    const cardTitle = document.createElement('h6');
    cardTitle.className = 'card-title mb-0';
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn btn-sm btn-danger';
    removeBtn.innerHTML = '<i class="fas fa-trash"></i>';
    removeBtn.addEventListener('click', function() {
        videoCard.remove();
        const badges = document.querySelectorAll(`#videoUrlBadges .badge[data-url="${videoUrl}"]`);
        badges.forEach(badge => badge.remove());
    });
    
    cardHeader.appendChild(cardTitle);
    cardHeader.appendChild(removeBtn);
    cardBody.appendChild(cardHeader);
    
    if (videoType === 'youtube') {
        cardTitle.textContent = 'YouTube Video';
        const videoId = getYoutubeVideoId(videoUrl);
        if (videoId) {
            const iframe = document.createElement('iframe');
            iframe.width = '100%';
            iframe.height = '300';
            iframe.src = `https://www.youtube.com/embed/${videoId}`;
            iframe.frameBorder = '0';
            iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
            iframe.allowFullscreen = true;
            cardBody.appendChild(iframe);
        } else {
            cardBody.appendChild(document.createTextNode('Invalid YouTube URL'));
        }
    } else if (videoType === 'vimeo') {
        cardTitle.textContent = 'Vimeo Video';
        const videoId = getVimeoVideoId(videoUrl);
        if (videoId) {
            const iframe = document.createElement('iframe');
            iframe.width = '100%';
            iframe.height = '300';
            iframe.src = `https://player.vimeo.com/video/${videoId}`;
            iframe.frameBorder = '0';
            iframe.allow = 'autoplay; fullscreen; picture-in-picture';
            iframe.allowFullscreen = true;
            cardBody.appendChild(iframe);
        } else {
            cardBody.appendChild(document.createTextNode('Invalid Vimeo URL'));
        }
    } else if (videoType === 'gdrive') {
        cardTitle.textContent = 'Google Drive Video';
        const gDriveFileId = getGoogleDriveFileId(videoUrl);
        console.log('[Debug GDrive] createVideoPreview (gdrive case) extracted_gDriveFileId:', gDriveFileId);
        if (gDriveFileId) {
            const iframe = document.createElement('iframe');
            iframe.width = '100%';
            iframe.height = '300';
            iframe.src = `https://drive.google.com/file/d/${gDriveFileId}/preview`;
            console.log('[Debug GDrive] createVideoPreview (gdrive case) final_iframe_src:', iframe.src);
            iframe.frameBorder = '0';
            iframe.allow = 'autoplay; fullscreen';
            iframe.allowFullscreen = true;
            cardBody.appendChild(iframe);
        } else {
            cardBody.appendChild(document.createTextNode('Invalid Google Drive Video URL'));
        }
    } else { // 'video' or 'unknown'
        cardTitle.textContent = 'Video File';
        const video = document.createElement('video');
        video.controls = true;
        video.className = 'w-100';
        video.style.maxHeight = '300px';
        const source = document.createElement('source');
        source.src = videoUrl;
        // Try to infer type, default to mp4 if not obvious
        if (videoUrl.endsWith('.webm')) source.type = 'video/webm';
        else if (videoUrl.endsWith('.ogg')) source.type = 'video/ogg';
        else if (videoUrl.endsWith('.mov')) source.type = 'video/quicktime';
        else source.type = 'video/mp4'; 
        video.appendChild(source);
        video.appendChild(document.createTextNode('Your browser does not support this video format.'));
        cardBody.appendChild(video);
    }
    
    videoCard.appendChild(cardBody);
    previewContainer.appendChild(videoCard);
}

// Helper function to add a test screenshot URL preview
function addTestScreenshotPreview(url, component) {
    // Validate URL - now uses updated isValidImageUrl which includes GDrive check
    if (!isValidImageUrl(url)) {
        alert('الرجاء إدخال رابط صورة صالح (jpg, jpeg, png, gif, webp, or valid Google Drive link)');
        return false;
    }
    
    const previewContainer = document.getElementById(`${component}ScreenshotPreview`);
    if (!previewContainer) {
        console.error(`Preview container for ${component} not found`);
        return false;
    }
    
    const card = document.createElement('div');
    card.className = 'card mb-2';
    card.setAttribute('data-url', url);
    
    const cardBody = document.createElement('div');
    cardBody.className = 'card-body p-2';
    
    const row = document.createElement('div');
    row.className = 'row align-items-center';
    
    const imgCol = document.createElement('div');
    imgCol.className = 'col-auto';
    
    const img = document.createElement('img');
    let displayUrl = url;
    console.log('[Debug GDrive] addTestScreenshotPreview original_url:', url);
    const gDriveFileId = getGoogleDriveFileId(url);
    console.log('[Debug GDrive] addTestScreenshotPreview extracted_gDriveFileId:', gDriveFileId);
    if (gDriveFileId) {
        displayUrl = `https://lh3.googleusercontent.com/d/${gDriveFileId}`;
    }
    img.src = displayUrl;
    console.log('[Debug GDrive] addTestScreenshotPreview final_displayUrl_for_img_src:', displayUrl);
    img.alt = 'Test screenshot';
    img.className = 'img-thumbnail';
    img.style.maxWidth = '100px';
    img.style.maxHeight = '100px';
    img.onerror = function() {
        this.onerror = null;
        this.src = 'img/image-error.png';
        this.alt = 'Image failed to load';
    };
    
    imgCol.appendChild(img);
    
    const urlCol = document.createElement('div');
    urlCol.className = 'col';
    
    const urlText = document.createElement('small');
    urlText.className = 'text-muted';
    urlText.textContent = url.length > 40 ? url.substring(0, 37) + '...' : url;
    urlText.title = url;
    
    urlCol.appendChild(urlText);
    
    const btnCol = document.createElement('div');
    btnCol.className = 'col-auto';
    
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn btn-sm btn-danger';
    removeBtn.innerHTML = '<i class="fas fa-trash"></i>';
    removeBtn.addEventListener('click', function() {
        card.remove();
    });
    
    btnCol.appendChild(removeBtn);
    
    row.appendChild(imgCol);
    row.appendChild(urlCol);
    row.appendChild(btnCol);
    cardBody.appendChild(row);
    card.appendChild(cardBody);
    
    previewContainer.appendChild(card);
    
    return true;
}

// Helper function to collect test screenshot URLs for a component
function getTestScreenshotUrls(component) {
    const urls = [];
    const previewContainer = document.getElementById(`${component}ScreenshotPreview`);
    if (previewContainer) {
        const cards = previewContainer.querySelectorAll('.card[data-url]');
        cards.forEach(card => {
            const url = card.getAttribute('data-url');
            if (url) {
                urls.push(url);
            }
        });
    }
    return urls;
}

/**
 * Update tax display in the invoice preview
 * This updates both the tax rate label and recalculates the tax amount
 */
function updateTaxDisplay() {
    const taxRateInput = document.getElementById('taxRate');
    const taxRateLabel = document.getElementById('taxRateLabel');
    const taxDisplay = document.getElementById('taxDisplay');
    const subtotalDisplay = document.getElementById('subtotalDisplay');
    const totalDisplay = document.getElementById('totalDisplay');
    const discountDisplay = document.getElementById('discountDisplay');
    
    if (taxRateInput && taxRateLabel) {
        // Get the current tax rate value
        const taxRate = parseFloat(taxRateInput.value || '0');
        
        // Update the tax rate label
        taxRateLabel.textContent = `الضريبة (${taxRate}%):`;
        
        // Recalculate tax and total if all needed elements exist
        if (taxDisplay && subtotalDisplay && totalDisplay && discountDisplay) {
            // Extract numeric values from the display elements
            const subtotalText = subtotalDisplay.textContent;
            const discountText = discountDisplay.textContent;
            
            // Parse numbers from text (removing 'جنية' and any non-numeric characters)
            const subtotal = parseFloat(subtotalText.replace(/[^\d.]/g, '')) || 0;
            const discount = parseFloat(discountText.replace(/[^\d.]/g, '')) || 0;
            
            // Calculate tax and total
            const taxAmount = (subtotal - discount) * (taxRate / 100);
            const total = subtotal - discount + taxAmount;
            
            // Update the display elements
            taxDisplay.textContent = taxAmount.toFixed(2) + ' جنية';
            totalDisplay.textContent = total.toFixed(2) + ' جنية';
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is authenticated
    if (typeof authMiddleware !== 'undefined' && !authMiddleware.isAdminLoggedIn()) {
        window.location.href = 'index.html';
        return;
    }
    
    // Initialize multi-functional report form
    initializeReportForm();
});

/**
 * Set up form submission for multi-functional mode
 */
function setupFormSubmission() {
    const form = document.getElementById('reportForm');
    if (!form) return;
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Hide all previous error messages
        hideAllStepErrors();
        
        // Only allow form submission on the final step
        if (typeof currentStep !== 'undefined' && currentStep < 4) {
            console.log('Form submission prevented: Not on final step');
            return;
        }
        
        // Validate the current step
        if (typeof validateStep === 'function' && !validateStep(currentStep)) {
            showStepError(currentStep + 1, 'يرجى إكمال جميع الحقول المطلوبة في هذه الخطوة');
            return;
        }
        
        try {
            // Show loading indicator
            showLoading(true);
            
            // Collect form data based on mode
            const formData = collectUnifiedReportData();
            
            // Add required fields for database storage
            formData.status = 'active';
            formData.createdAt = new Date().toISOString();
            formData.updatedAt = new Date().toISOString();
            
            // Ensure client_id is a valid value
            if (!formData.client_id) {
                showLoading(false);
                showErrorMessage('يرجى اختيار عميل قبل إنشاء التقرير');
                return;
            }
            
            console.log('Sending report data to API:', formData);
            
            // Submit using unified API method
            const response = await apiService.saveReport(formData, reportMode.mode);
            
            // Only create invoice automatically in CREATE mode when billing is enabled
            if (reportMode.mode === 'create' && formData.billing_enabled && formData.amount > 0) {
                try {
                    await createInvoiceForReport(response, formData);
                } catch (invoiceError) {
                    console.error('Error creating invoice for report:', invoiceError);
                    showToast('تم إنشاء التقرير بنجاح، لكن حدث خطأ في إنشاء الفاتورة', 'warning');
                }
            } else if (reportMode.mode === 'edit' && formData.billing_enabled && formData.amount > 0) {
                // In edit mode, check if invoice already exists and provide guidance
                try {
                    const existingInvoice = await checkExistingInvoice(formData.reportId);
                    if (existingInvoice) {
                        showToast('التقرير يحتوي على فاتورة موجودة. يمكنك تعديل الفاتورة من صفحة الفواتير.', 'info');
                    } else {
                        showToast('يمكنك إنشاء فاتورة للتقرير من صفحة الفواتير.', 'info');
                    }
                } catch (error) {
                    console.log('Could not check existing invoice:', error);
                }
            }
            
            // Hide loading indicator
            showLoading(false);
            
            // Show success message based on mode
            showSuccessMessage(response, formData.billing_enabled, reportMode.mode);
            
            // Reset form only in create mode
            if (reportMode.mode === 'create') {
                resetForm();
            }
            
            console.log('Report saved successfully:', response);
            
        } catch (error) {
            console.error('Error saving report:', error);
            showLoading(false);
            showErrorMessage(error.message || 'فشل في حفظ التقرير. يرجى المحاولة مرة أخرى.');
        }
    });
}

/**
 * Collect unified report data for both create and edit modes
 * @returns {Object} The collected report data
 */
function collectUnifiedReportData() {
    console.log('Collecting unified report data...');
    console.log('Current mode:', reportMode.mode);
    console.log('Report ID:', reportMode.reportId);
    
    // Base data with mode information
    const formData = {
        mode: reportMode.mode,
        reportId: reportMode.reportId,
        
        // General information
        ...collectGeneralInfo(),
        
        // Technical tests data
        ...collectTechnicalTestsData(),
        
        // External inspection data
        ...collectExternalInspectionData(),
        
        // Notes
        ...collectNotesData(),
        
        // Invoice data
        ...collectInvoiceData()
    };
    
    console.log('Collected unified report data:', formData);
    return formData;
}

/**
 * Collect general information
 * @returns {Object} General information data
 */
function collectGeneralInfo() {
    // Get client information
    let client_id = null;
    let clientDetails = {};
    
    if (window.globalClientDetails && window.globalClientDetails.client_id) {
        client_id = window.globalClientDetails.client_id;
        clientDetails = {
            clientName: window.globalClientDetails.clientName || '',
            clientPhone: window.globalClientDetails.clientPhone || '',
            clientEmail: window.globalClientDetails.clientEmail || '',
            clientAddress: window.globalClientDetails.clientAddress || ''
        };
    } else {
        // Fallback to search input
        const clientSearchInput = document.getElementById('clientSearchInput');
        const searchValue = clientSearchInput?.value || '';
        
        if (searchValue && Array.isArray(window.clientsData)) {
            const selectedClient = window.clientsData.find(client => 
                client.name === searchValue || 
                client.phone === searchValue ||
                client.email === searchValue ||
                client.orderCode === searchValue
            );
            
            if (selectedClient) {
                client_id = selectedClient.id;
                clientDetails = {
                    clientName: selectedClient.name,
                    clientPhone: selectedClient.phone,
                    clientEmail: selectedClient.email || '',
                    clientAddress: selectedClient.address || ''
                };
            }
        }
    }
    
    // Get device information
    const deviceInfo = {
        order_number: document.getElementById('orderNumber')?.value || '',
        inspection_date: document.getElementById('inspectionDate')?.value || '',
        device_model: document.getElementById('deviceModel')?.value || '',
        serial_number: document.getElementById('serialNumber')?.value || ''
    };
    
    return {
        client_id: client_id,
        client_name: clientDetails.clientName,
        client_phone: clientDetails.clientPhone,
        client_email: clientDetails.clientEmail,
        client_address: clientDetails.clientAddress,
        ...deviceInfo
    };
}

/**
 * Collect technical tests data
 * @returns {Object} Technical tests data
 */
function collectTechnicalTestsData() {
    // Collect hardware status
    const hardwareStatus = [];
    
    // Component mapping
    const componentMapping = {
        'camera_status': 'camera',
        'speakers_status': 'speakers', 
        'microphone_status': 'microphone',
        'wifi_status': 'Wi-Fi',
        'lan_status': 'LAN',
        'usb_status': 'Ports',
        'keyboard_status': 'keyboard',
        'touchpad_status': 'Touchpad',
        'card_reader_status': 'card',
        'audio_jack_status': 'audio_jack',
        'display_ports_status': 'DisplayPort',
        'bluetooth_status': 'Bluetooth',
        'touchscreen_status': 'touchscreen'
    };
    
    Object.entries(componentMapping).forEach(([formFieldName, componentName]) => {
        const selectedRadio = document.querySelector(`input[name="${formFieldName}"]:checked`);
        if (selectedRadio) {
            hardwareStatus.push({
                componentName: componentName,
                status: selectedRadio.value
            });
        }
    });
    
    // Add technical notes if available
    const technicalNotes = document.getElementById('generalNotes')?.value;
    if (technicalNotes && technicalNotes.trim()) {
        hardwareStatus.push({
            componentName: 'notes',
            status: 'info',
            notes: technicalNotes,
            type: 'note'
        });
    }
    
    return {
        hardware_status: JSON.stringify(hardwareStatus)
    };
}

/**
 * Collect external inspection data
 * @returns {Object} External inspection data
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
    
    // Collect test screenshot URLs
    const components = ['info', 'cpu', 'gpu', 'hdd', 'keyboard', 'battery', 'dxdiag'];
    components.forEach(component => {
        const urls = getTestScreenshotUrls(component);
        urls.forEach(url => {
            externalImages.push({
                type: 'test_screenshot',
                component: component,
                url: url
            });
        });
    });
    
    return {
        external_images: JSON.stringify(externalImages)
    };
}

/**
 * Collect notes data
 * @returns {Object} Notes data
 */
function collectNotesData() {
    return {
        notes: document.getElementById('reportNotes')?.value || ''
    };
}

/**
 * Collect invoice data
 * @returns {Object} Invoice data
 */
function collectInvoiceData() {
    const enableBillingCheckbox = document.getElementById('enableBilling');
    const billingEnabled = enableBillingCheckbox?.checked || false;
    
    const invoiceData = {
        billing_enabled: billingEnabled
    };
    
    if (billingEnabled) {
        // Get device price
        const devicePriceInput = document.getElementById('devicePrice');
        if (devicePriceInput) {
            invoiceData.amount = parseFloat(devicePriceInput.value || '0');
        }
        
        // Get tax rate and discount
        const taxRateInput = document.getElementById('taxRate');
        const discountInput = document.getElementById('discount');
        
        if (taxRateInput) {
            invoiceData.tax_rate = parseFloat(taxRateInput.value || '0');
        }
        if (discountInput) {
            invoiceData.discount = parseFloat(discountInput.value || '0');
        }
        
        // Collect additional items
        const additionalItems = [];
        document.querySelectorAll('.invoice-item').forEach(item => {
            const description = item.querySelector('.item-description')?.value || '';
            const quantity = parseFloat(item.querySelector('.item-quantity')?.value || '0');
            const unitPrice = parseFloat(item.querySelector('.item-unit-price')?.value || '0');
            
            if (description && quantity > 0 && unitPrice > 0) {
                additionalItems.push({
                    description: description,
                    quantity: quantity,
                    unitPrice: unitPrice,
                    totalPrice: quantity * unitPrice
            });
        }
    });
    
        invoiceData.additional_items = additionalItems;
    } else {
        invoiceData.amount = 0;
    }
    
    return invoiceData;
}

/**
 * Set up image and video URL functionality for Step 3
 */
function setupImageAndVideoFunctionality() {
    // Set up image URL functionality
    const addImageUrlBtn = document.getElementById('addImageUrlBtn');
    const imageUrlInput = document.getElementById('imageUrlInput');
    
    if (addImageUrlBtn && imageUrlInput) {
        // Add Enter key functionality
        ['keypress', 'keydown'].forEach(eventType => {
            imageUrlInput.addEventListener(eventType, function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    addImageUrlBtn.click();
                }
            });
        });
        
        // Click handler for the add image button
        addImageUrlBtn.addEventListener('click', function() {
            const imageUrl = imageUrlInput.value.trim();
            
            if (!imageUrl) {
                alert('الرجاء إدخال رابط صورة');
                return;
            }
            
            if (!isValidImageUrl(imageUrl)) {
                alert('الرجاء إدخال رابط صورة صالح (jpg, jpeg, png, gif, webp)');
                return;
            }
            
            // Check if URL already exists
            const existingBadges = document.querySelectorAll(`#imageUrlBadges .badge[data-url="${imageUrl}"]`);
            if (existingBadges.length > 0) {
                alert('تم إضافة هذا الرابط مسبقاً');
                return;
            }
            
            // Add URL as a badge
            const badgesContainer = document.getElementById('imageUrlBadges');
            const badge = document.createElement('span');
            badge.className = 'badge bg-primary me-1 mb-1';
            badge.setAttribute('data-url', imageUrl);
            
            // Create a short display version of the URL
            const displayUrl = imageUrl.length > 30 ? imageUrl.substring(0, 27) + '...' : imageUrl;
            badge.innerHTML = `${displayUrl} <button type="button" class="btn-close btn-close-white ms-1" aria-label="Close"></button>`;
            
            // Add remove functionality
            const closeBtn = badge.querySelector('.btn-close');
            closeBtn.addEventListener('click', function() {
                badge.remove();
                
                // Also remove the image preview if it exists
                const imagePreviews = document.querySelectorAll(`#externalImagesPreview .image-card img[src="${imageUrl}"]`);
                imagePreviews.forEach(preview => {
                    const card = preview.closest('.image-card');
                    if (card) card.remove();
                });
            });
            
            badgesContainer.appendChild(badge);
            
            // Create image preview
            createImagePreview(imageUrl);
            
            // Clear input
            imageUrlInput.value = '';
        });
    }
    
    // Set up video URL functionality
    const addVideoUrlBtn = document.getElementById('addVideoUrlBtn');
    const videoUrlInput = document.getElementById('videoUrlInput');
    
    if (addVideoUrlBtn && videoUrlInput) {
        addVideoUrlBtn.addEventListener('click', function() {
            const videoUrl = videoUrlInput.value.trim();
            
            if (!videoUrl) {
                alert('الرجاء إدخال رابط فيديو');
                return;
            }
            
            const videoType = getVideoUrlType(videoUrl);
            if (!videoType) {
                alert('الرجاء إدخال رابط فيديو صالح');
                return;
            }
            
            // Check if URL already exists
            const existingBadges = document.querySelectorAll(`#videoUrlBadges .badge[data-url="${videoUrl}"]`);
            if (existingBadges.length > 0) {
                alert('تم إضافة هذا الرابط مسبقاً');
                return;
            }
            
            // Add URL as a badge
            const badgesContainer = document.getElementById('videoUrlBadges');
            const badge = document.createElement('span');
            badge.className = 'badge bg-info text-dark me-1 mb-1';
            badge.setAttribute('data-url', videoUrl);
            badge.setAttribute('data-type', videoType);
            
            // Create a short display version of the URL
            const displayUrl = videoUrl.length > 30 ? videoUrl.substring(0, 27) + '...' : videoUrl;
            badge.innerHTML = `${displayUrl} <button type="button" class="btn-close btn-close-white ms-1" aria-label="Close"></button>`;
            
            // Add remove functionality
            const closeBtn = badge.querySelector('.btn-close');
            closeBtn.addEventListener('click', function() {
                badge.remove();
                
                // Also remove the video preview if it exists
                const videoPreviews = document.querySelectorAll(`#videoPreviewContainer .card[data-url="${videoUrl}"]`);
                videoPreviews.forEach(preview => preview.remove());
            });
            
            badgesContainer.appendChild(badge);
            
            // Create video preview
            createVideoPreview(videoUrl, videoType);
            
            // Clear input
            videoUrlInput.value = '';
        });
        
        // Allow pressing Enter to add video URL
        videoUrlInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                addVideoUrlBtn.click();
            }
        });
    }
}

/**
 * Enhanced success message handler for both create and edit modes
 * @param {Object} response - API response
 * @param {boolean} billingEnabled - Whether billing was enabled
 * @param {string} mode - 'create' or 'edit'
 */
function showSuccessMessage(response, billingEnabled = false, mode = 'create') {
    // Hide any existing error messages
    const errorAlert = document.getElementById('reportFormAlert');
    if (errorAlert) {
        errorAlert.style.display = 'none';
    }
    
    // Hide all step error containers
    if (typeof hideAllStepErrors === 'function') {
        hideAllStepErrors();
    } else {
        // Fallback implementation
        for (let i = 1; i <= 5; i++) {
            const stepErrorContainer = document.getElementById(`step${i}ErrorContainer`);
            if (stepErrorContainer) {
                stepErrorContainer.style.display = 'none';
            }
        }
    }
    
    if (mode === 'edit') {
        // For edit mode, show success message with invoice guidance
        let message = 'تم تحديث التقرير بنجاح';
        if (billingEnabled) {
            message += '. يمكنك إدارة الفواتير من صفحة الفواتير.';
        }
        showToast(message, 'success');
        
        // Redirect to reports page after a short delay
        setTimeout(() => {
            window.location.href = 'reports.html';
        }, 2000);
        
            return;
        }
        
    // For create mode, show the success modal
    const successModal = document.getElementById('reportCreatedModal');
    
    if (successModal) {
        // Get the report URL
        const reportUrl = `${window.location.origin}/report.html?id=${response.id}`;
        
        // Update modal content with report information
        const reportLink = document.getElementById('reportLink');
        if (reportLink) {
            reportLink.value = reportUrl;
        }
        
        // Update modal title to include billing information
        const modalTitle = successModal.querySelector('.modal-title');
        if (modalTitle && billingEnabled) {
            modalTitle.innerHTML = '<i class="fas fa-check-circle text-success me-2"></i>تم إنشاء التقرير والفاتورة بنجاح!';
        }
        
        // Setup WhatsApp share button
        const whatsappBtn = document.getElementById('whatsappShareBtn');
        if (whatsappBtn) {
            const encodedMessage = encodeURIComponent(`تقرير فحص جهازك جاهز للعرض: ${reportUrl}`);
            whatsappBtn.href = `https://wa.me/?text=${encodedMessage}`;
        }
        
        // Setup View Report button
        const viewReportBtn = document.getElementById('viewReportBtn');
        if (viewReportBtn) {
            viewReportBtn.href = reportUrl;
        }
        
        // Setup copy buttons functionality
        const setupCopyButton = (buttonId) => {
            const copyBtn = document.getElementById(buttonId);
            if (copyBtn) {
                copyBtn.addEventListener('click', function() {
                    navigator.clipboard.writeText(reportUrl).then(() => {
            // Show success message
                        const successMsg = document.querySelector('.copy-success-message');
                        if (successMsg) {
                            successMsg.style.display = 'block';
                            setTimeout(() => {
                                successMsg.style.display = 'none';
                            }, 3000);
                        }
                        
                        // Visual feedback on the button
                        this.innerHTML = '<i class="fas fa-check me-2"></i> تم النسخ';
                        setTimeout(() => {
                            if (buttonId === 'copyLinkBtn') {
                                this.innerHTML = '<i class="fas fa-copy"></i>';
                            } else {
                                this.innerHTML = '<i class="fas fa-copy me-2"></i> نسخ رابط التقرير';
                            }
                        }, 2000);
                        
                        // Show toast notification
                        showToast('تم نسخ رابط التقرير بنجاح', 'success');
                    }).catch(err => {
                        console.error('Could not copy text: ', err);
                        showToast('حدث خطأ أثناء نسخ الرابط', 'error');
                    });
                });
            }
        };
        
        // Setup both copy buttons
        setupCopyButton('copyLinkBtn');
        setupCopyButton('modalCopyLinkBtn');
        
        // Show the modal
        const bsModal = new bootstrap.Modal(successModal);
        bsModal.show();
    } else {
        // Fallback if modal doesn't exist
        alert('تم إنشاء التقرير بنجاح!');
        window.location.href = `report.html?id=${response.id}`;
    }
}

/**
 * Show error message
 * @param {string} message - Error message to display
 */
function showError(message) {
    showToast(message, 'error');
}

/**
 * Show loading indicator
 * @param {boolean} show - Whether to show or hide loading
 */
function showLoading(show) {
    const submitBtn = document.querySelector('button[type="submit"]');
    const prevBtn = document.querySelector('#prevBtn');
    const nextBtn = document.querySelector('#nextBtn');

    if (show) {
        if (submitBtn) {
            submitBtn.disabled = true;
            const mode = reportMode.mode;
            const buttonText = mode === 'edit' ? 'جاري الحفظ...' : 'جاري الإنشاء...';
            submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> ${buttonText}`;
        }
        if (prevBtn) prevBtn.disabled = true;
        if (nextBtn) nextBtn.disabled = true;
            } else {
        if (submitBtn) {
            submitBtn.disabled = false;
            const mode = reportMode.mode;
            const buttonText = mode === 'edit' ? 'حفظ التغييرات' : 'إنشاء التقرير';
            submitBtn.innerHTML = `<i class="fas fa-save me-2"></i> ${buttonText}`;
        }
        if (prevBtn) prevBtn.disabled = false;
        if (nextBtn) nextBtn.disabled = false;
    }
}

/**
 * Set up test screenshot URL functionality for Step 2
 */
function setupTestScreenshotFunctionality() {
    // Set up event listeners for adding test screenshot URLs
    const addScreenshotButtons = document.querySelectorAll('.add-screenshot-url-btn');
    addScreenshotButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const component = this.getAttribute('data-component');
            const input = document.getElementById(targetId);
            
            if (input && component) {
                const url = input.value.trim();
                
                if (!url) {
                    alert('الرجاء إدخال رابط صورة');
                    return;
                }
                
                if (addTestScreenshotPreview(url, component)) {
                    // Clear input after successful addition
                    input.value = '';
                }
            }
        });
    });
    
    // Add Enter key press event for test screenshot URL inputs
    const testScreenshotInputs = document.querySelectorAll('.test-screenshot-url');
    testScreenshotInputs.forEach(input => {
        ['keypress', 'keydown'].forEach(eventType => {
            input.addEventListener(eventType, function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const component = this.getAttribute('data-component');
                    const button = document.querySelector(`.add-screenshot-url-btn[data-component="${component}"]`);
                    if (button) {
                        button.click();
                    }
                }
                });
            });
        });
}

/**
 * Add image badge
 * @param {string} imageUrl - The image URL
 */
function addImageBadge(imageUrl) {
    const badgesContainer = document.getElementById('imageUrlBadges');
    if (!badgesContainer) return;
    
    const badge = document.createElement('span');
    badge.className = 'badge bg-primary me-1 mb-1';
    badge.setAttribute('data-url', imageUrl);
    
    const displayUrl = imageUrl.length > 30 ? imageUrl.substring(0, 27) + '...' : imageUrl;
    badge.innerHTML = `${displayUrl} <button type="button" class="btn-close btn-close-white ms-1" aria-label="Close"></button>`;
    
    const closeBtn = badge.querySelector('.btn-close');
    closeBtn.addEventListener('click', function() {
        badge.remove();
        const imagePreviews = document.querySelectorAll(`#externalImagesPreview .image-card img[src="${imageUrl}"]`);
        imagePreviews.forEach(preview => {
            const card = preview.closest('.image-card');
            if (card) card.remove();
        });
    });
    
    badgesContainer.appendChild(badge);
}

/**
 * Add video badge
 * @param {string} videoUrl - The video URL
 * @param {string} videoType - The video type
 */
function addVideoBadge(videoUrl, videoType) {
    const badgesContainer = document.getElementById('videoUrlBadges');
    if (!badgesContainer) return;
    
    const badge = document.createElement('span');
    badge.className = 'badge bg-info text-dark me-1 mb-1';
    badge.setAttribute('data-url', videoUrl);
    badge.setAttribute('data-type', videoType);
    
    const displayUrl = videoUrl.length > 30 ? videoUrl.substring(0, 27) + '...' : videoUrl;
    badge.innerHTML = `${displayUrl} <button type="button" class="btn-close btn-close-white ms-1" aria-label="Close"></button>`;
    
    const closeBtn = badge.querySelector('.btn-close');
    closeBtn.addEventListener('click', function() {
        badge.remove();
        const videoPreviews = document.querySelectorAll(`#videoPreviewContainer .card[data-url="${videoUrl}"]`);
        videoPreviews.forEach(preview => preview.remove());
    });
    
    badgesContainer.appendChild(badge);
}

/**
 * Show error message in the main form alert
 * @param {string} message - Error message to display
 */
function showErrorMessage(message) {
    // Create alert if it doesn't exist
    let alertEl = document.getElementById('reportFormAlert');
    
    if (!alertEl) {
        alertEl = document.createElement('div');
        alertEl.id = 'reportFormAlert';
        alertEl.className = 'alert alert-danger mt-3';
        alertEl.role = 'alert';
        
        // Add alert to form
        const form = document.getElementById('reportForm');
        if (form) {
            form.prepend(alertEl);
        }
    }
    
    // Update alert message
    alertEl.textContent = message;
    
    // Scroll to alert
    alertEl.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Show error message in a specific step container
 * @param {number} stepNumber - The step number (1-5)
 * @param {string} message - Error message to display
 */
function showStepError(stepNumber, message) {
    if (stepNumber < 1 || stepNumber > 5) return;
    
    const errorContainer = document.getElementById(`step${stepNumber}ErrorContainer`);
    const errorText = document.getElementById(`step${stepNumber}ErrorText`);
    
    if (errorContainer && errorText) {
        errorText.textContent = message;
        errorContainer.style.display = 'block';
        
        // Scroll to error container
        errorContainer.scrollIntoView({ behavior: 'smooth' });
    } else {
        // Fallback to main error if step error container doesn't exist
        showErrorMessage(message);
    }
}

/**
 * Hide error message in a specific step container
 * @param {number} stepNumber - The step number (1-5)
 */
function hideStepError(stepNumber) {
    if (stepNumber < 1 || stepNumber > 5) return;
    
    const errorContainer = document.getElementById(`step${stepNumber}ErrorContainer`);
    
    if (errorContainer) {
        errorContainer.style.display = 'none';
    }
}

/**
 * Hide all step error containers
 */
function hideAllStepErrors() {
    for (let i = 1; i <= 5; i++) {
        hideStepError(i);
    }
}

/**
 * Reset form after successful submission
 */
function resetForm() {
    const form = document.getElementById('reportForm');
    if (form) {
        form.reset();
    }
    
    // Reset to first step if using multi-step form
    if (typeof showStep === 'function') {
        currentStep = 0;
        showStep(currentStep);
        updateProgressBar();
    }
    
    // Clear form data
    clearFormData();
}

/**
 * Check if a report already has an associated invoice
 * @param {string} reportId - The report ID to check
 * @returns {Promise<Object|null>} The existing invoice or null
 */
async function checkExistingInvoice(reportId) {
    try {
        if (!reportId) return null;
        
        // Try to get invoice data for this report
        if (typeof apiService !== 'undefined' && typeof apiService.getInvoices === 'function') {
            const invoices = await apiService.getInvoices({ report_id: reportId });
            return invoices && invoices.length > 0 ? invoices[0] : null;
        }
        
        return null;
    } catch (error) {
        console.log('Error checking existing invoice:', error);
        return null;
    }
}
    
    /**
     * Create invoice for a report automatically
     * @param {Object} reportResponse - The created report response
     * @param {Object} reportData - The original report data
     * @returns {Promise<Object>} The created invoice
     */
    async function createInvoiceForReport(reportResponse, reportData) {
        try {
        console.log('Creating invoice for report:', reportResponse);
        
            // Generate unique invoice ID
            const invoiceId = 'INV' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 1000);
            
            // Get billing data from form
            const taxRate = parseFloat(document.getElementById('taxRate')?.value || 0);
            const discount = parseFloat(document.getElementById('discount')?.value || 0);
            const paymentStatus = document.getElementById('paymentStatus')?.value || 'unpaid';
            const paymentMethod = document.getElementById('paymentMethod')?.value || '';
            
            // Calculate amounts
        const subtotal = reportData.amount || 0;
            const taxAmount = (subtotal * taxRate) / 100;
            const totalAmount = subtotal + taxAmount - discount;
        
        // Ensure report ID is valid
        const reportId = reportResponse.id || reportResponse.reportId || reportData.reportId;
        if (!reportId) {
            throw new Error('Invalid report ID for invoice creation');
        }
            
            // Prepare invoice data
            const invoiceData = {
                id: invoiceId,
                client_id: reportData.client_id,
            report_ids: [reportId], // Link to the created report
                date: new Date().toISOString(),
                subtotal: subtotal,
                taxRate: taxRate,
                tax: taxAmount,
                discount: discount,
                total: totalAmount,
                paymentStatus: paymentStatus,
                paymentMethod: paymentMethod,
            notes: `فاتورة تلقائية للتقرير ${reportData.order_number || 'غير محدد'}`,
                status: 'draft',
                items: [
                    {
                    description: `فحص وإصلاح ${reportData.device_model || 'جهاز'}`,
                        quantity: 1,
                        unitPrice: subtotal,
                        totalPrice: subtotal,
                        type: 'service'
                    }
                ]
            };
            
        console.log('Prepared invoice data:', invoiceData);
            
            // Create invoice via API
            if (typeof apiService !== 'undefined' && typeof apiService.createInvoice === 'function') {
                const invoiceResponse = await apiService.createInvoice(invoiceData);
                console.log('Invoice created successfully:', invoiceResponse);
                
                // Show success message for invoice creation
                showToast('تم إنشاء الفاتورة تلقائياً للتقرير', 'success');
                
                return invoiceResponse;
            } else {
                throw new Error('API service not available for invoice creation');
            }
        } catch (error) {
            console.error('Error creating invoice for report:', error);
        // Don't throw the error, just log it and continue
        // This prevents the entire report save from failing due to invoice creation issues
        showToast('تم إنشاء التقرير بنجاح، لكن حدث خطأ في إنشاء الفاتورة', 'warning');
        return null;
        }
    }
    
    /**
 * Set up billing toggle functionality
 */
function setupBillingToggle() {
    const enableBillingCheckbox = document.getElementById('enableBilling');
    const invoiceFieldsContainer = document.getElementById('invoiceFieldsContainer');
    const submitButton = document.getElementById('submitReportBtn');
    const billingStatusText = document.getElementById('billingStatusText');
    
    if (!enableBillingCheckbox || !invoiceFieldsContainer || !submitButton) {
        console.warn('Billing toggle setup failed: Required elements not found', {
            enableBillingCheckbox: !!enableBillingCheckbox,
            invoiceFieldsContainer: !!invoiceFieldsContainer,
            submitButton: !!submitButton
        });
        return;
    }
    
    // Function to update UI based on checkbox state
    function updateBillingUI() {
        const isEnabled = enableBillingCheckbox.checked;
        
        // Update invoice fields container visibility
        invoiceFieldsContainer.style.display = isEnabled ? 'block' : 'none';
        
        // Update billing status text if it exists
        if (billingStatusText) {
            billingStatusText.textContent = isEnabled ? 'الفاتورة مفعلة' : 'الفاتورة غير مفعلة';
            billingStatusText.style.color = isEnabled ? 'var(--primary-color)' : '#dc3545';
        }
        
        // Update submit button text
        const mode = reportMode.mode;
        if (mode === 'edit') {
            submitButton.textContent = isEnabled ? 'حفظ التقرير والفاتورة' : 'حفظ التقرير';
        } else {
            submitButton.textContent = isEnabled ? 'إنشاء التقرير والفاتورة' : 'إنشاء التقرير';
        }
    }
    
    // Set initial state
    updateBillingUI();
    
    // Add event listener for checkbox changes
    enableBillingCheckbox.addEventListener('change', updateBillingUI);
    
    // Make updateBillingUI globally available
    window.updateBillingUI = updateBillingUI;
}

/**
 * Load clients from API or localStorage
 */
async function loadClients() {
    try {
        console.log('Loading clients...');
        
        // Try to get clients from API
        let clients = [];
                try {
                    // Check if apiService is defined and has getClients method
                    if (typeof apiService !== 'undefined' && typeof apiService.getClients === 'function') {
                // Use ApiService to fetch clients
                clients = await apiService.getClients();
                console.log('Clients loaded from API:', clients.length);
                
                            // Cache clients in localStorage for offline use
                            localStorage.setItem('lpk_clients', JSON.stringify(clients));
                    } else {
                        throw new Error('API service not available');
                    }
                } catch (apiError) {
            console.warn('Error fetching clients from API, falling back to localStorage:', apiError);
                    // Fall back to localStorage if API fails
                    const storedClients = localStorage.getItem('lpk_clients');
            clients = storedClients ? JSON.parse(storedClients) : [];
            console.log('Clients loaded from localStorage:', clients.length);
            }
            
            // Store clients data globally
        window.clientsData = clients;
            clientsData = clients;
            
        console.log('Clients loaded successfully:', clients.length);
            return clients;
            
        } catch (error) {
        console.error('Error loading clients:', error);
            return [];
        }
    }
    
    /**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type of toast (success, error, warning, info)
 */
function showToast(message, type = 'info') {
    // Check if toastr is available
    if (typeof toastr !== 'undefined') {
        toastr[type](message);
            } else {
        // Fallback to alert
        alert(message);
    }
}

/**
 * Update client info display
 * @param {Object} client - Client data
 */
function updateClientInfoDisplay(client) {
    const clientInfoContainer = document.getElementById('clientInfoContainer');
    if (!clientInfoContainer || !client) return;
    
    clientInfoContainer.innerHTML = `
        <div class="card border-success">
            <div class="card-body p-3">
                <h6 class="card-title text-success mb-2">
                    <i class="fas fa-user-check me-2"></i>معلومات العميل
                </h6>
                <div class="row">
                    <div class="col-md-6">
                        <p class="mb-1"><strong>الاسم:</strong> ${client.name || ''}</p>
                        <p class="mb-1"><strong>الهاتف:</strong> ${client.phone || ''}</p>
                    </div>
                    <div class="col-md-6">
                        <p class="mb-1"><strong>البريد الإلكتروني:</strong> ${client.email || ''}</p>
                        <p class="mb-0"><strong>العنوان:</strong> ${client.address || ''}</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    clientInfoContainer.style.display = 'block';
    }
    
    /**
     * Set up client search functionality
     */
    function setupClientSearch() {
    const clientSearchInput = document.getElementById('clientSearchInput');
    const clientDropdown = document.getElementById('clientDropdown');
    
    if (!clientSearchInput || !clientDropdown) {
        console.warn('Client search setup failed: Required elements not found', {
            clientSearchInput: !!clientSearchInput,
            clientDropdown: !!clientDropdown
        });
                return;
            }
            
    clientSearchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        
        if (!clientsData) return;
        
        // Filter clients based on search term
        const filteredClients = clientsData.filter(client => 
            client.name.toLowerCase().includes(searchTerm) ||
            client.phone.includes(searchTerm) ||
            (client.email && client.email.toLowerCase().includes(searchTerm))
        );
        
        // Update dropdown
        clientDropdown.innerHTML = '';
        filteredClients.forEach(client => {
            const option = document.createElement('div');
            option.className = 'dropdown-item';
            option.textContent = `${client.name} (${client.phone})`;
            option.addEventListener('click', () => {
                clientSearchInput.value = client.name;
                clientSelectionChanged(client);
                clientDropdown.style.display = 'none';
            });
            clientDropdown.appendChild(option);
        });
        
        clientDropdown.style.display = filteredClients.length > 0 ? 'block' : 'none';
    });
    
    // Hide dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!clientSearchInput.contains(e.target) && !clientDropdown.contains(e.target)) {
            clientDropdown.style.display = 'none';
                }
            });
        }
        
/**
 * Handle client selection change
 * @param {Object} client - Selected client data
 */
function clientSelectionChanged(client) {
    if (!client) return;
    
                // Update global client details
                window.globalClientDetails = {
        client_id: client.id,
        clientName: client.name,
        clientPhone: client.phone,
        clientEmail: client.email || '',
        clientAddress: client.address || ''
    };
                
                // Update client info display
    updateClientInfoDisplay(client);
    }
    
    /**
     * Set up client quick actions
     */
    function setupClientQuickActions() {
    // Set up event listeners for client quick action buttons
    const addClientBtn = document.getElementById('addClientBtn');
    const editClientBtn = document.getElementById('editClientBtn');
    const viewHistoryBtn = document.getElementById('viewHistoryBtn');
    
    if (addClientBtn) {
        addClientBtn.addEventListener('click', function() {
            openEditClientModal();
        });
    }
    
    if (editClientBtn) {
        editClientBtn.addEventListener('click', function() {
            if (window.globalClientDetails && window.globalClientDetails.client_id) {
                const client = clientsData.find(c => c.id == window.globalClientDetails.client_id);
                if (client) {
                    openEditClientModal(client);
                }
            }
        });
    }
    
    if (viewHistoryBtn) {
        viewHistoryBtn.addEventListener('click', function() {
                if (window.globalClientDetails && window.globalClientDetails.client_id) {
                viewClientHistory(window.globalClientDetails.client_id);
                }
            });
        }
    }
    
    /**
 * Open edit client modal
 * @param {Object} client - Client data to edit (optional)
 */
function openEditClientModal(client = null) {
    const modal = document.getElementById('addClientModal');
    if (!modal) return;
    
    const modalTitle = modal.querySelector('.modal-title');
    const clientNameInput = document.getElementById('clientName');
    const clientPhoneInput = document.getElementById('clientPhone');
    const clientEmailInput = document.getElementById('clientEmail');
    const clientAddressInput = document.getElementById('clientAddress');
    
    if (client) {
        // Edit mode
        modalTitle.textContent = 'تعديل العميل';
        clientNameInput.value = client.name || '';
        clientPhoneInput.value = client.phone || '';
        clientEmailInput.value = client.email || '';
        clientAddressInput.value = client.address || '';
    } else {
        // Add mode
        modalTitle.textContent = 'إضافة عميل جديد';
        clientNameInput.value = '';
        clientPhoneInput.value = '';
        clientEmailInput.value = '';
        clientAddressInput.value = '';
    }
    
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
}

/**
 * View client history
 * @param {string} clientId - Client ID
 */
function viewClientHistory(clientId) {
    // Implementation for viewing client history
    console.log('Viewing client history for ID:', clientId);
    // This could open a modal or navigate to a history page
}

/**
 * Save new client
     */
    async function saveNewClient() {
    try {
        const clientName = document.getElementById('clientName').value.trim();
        const clientPhone = document.getElementById('clientPhone').value.trim();
        const clientEmail = document.getElementById('clientEmail').value.trim();
        const clientAddress = document.getElementById('clientAddress').value.trim();
        
        if (!clientName || !clientPhone) {
            showToast('يرجى إدخال اسم العميل ورقم الهاتف', 'error');
            return;
        }
        
            const clientData = {
                name: clientName,
                phone: clientPhone,
            email: clientEmail,
            address: clientAddress
        };
        
        // Save client using API
                        if (typeof apiService !== 'undefined' && typeof apiService.createClient === 'function') {
            const newClient = await apiService.createClient(clientData);
            
            // Add to local clients data
            clientsData.push(newClient);
            window.clientsData = clientsData;
            
            // Update client selection
            clientSelectionChanged(newClient);
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('addClientModal'));
            if (modal) {
                modal.hide();
            }
            
            showToast('تم حفظ العميل بنجاح', 'success');
            } else {
            throw new Error('API service not available');
        }
        
        } catch (error) {
            console.error('Error saving client:', error);
        showToast('فشل في حفظ العميل', 'error');
        }
    }
    
    /**
 * Collect report data (compatibility function for form-steps.js)
 * @returns {Object} The collected report data
 */
function collectReportData() {
    console.log('collectReportData called - using unified data collection');
    return collectUnifiedReportData();
}

// Make invoice management functions globally accessible
window.checkAndManageInvoice = checkAndManageInvoice;
window.createNewInvoiceForReport = createNewInvoiceForReport;
