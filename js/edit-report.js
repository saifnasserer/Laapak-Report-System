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
        console.log(`Loading report data for ID: ${reportId}`);
        const response = await apiService.getReport(reportId);
        console.log('API response:', response);
        
        // Handle different response formats
        let reportData;
        if (response.report) {
            // If response has a report property (from single report endpoint)
            reportData = response.report;
        } else if (response.id) {
            // If response is the report object directly
            reportData = response;
        } else {
            throw new Error('Invalid report data format');
        }
        
        console.log('Extracted report data:', reportData);
        return reportData;
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
    console.log('Populating form with report data:', report);
    
    // Populate each step
    populateGeneralInformation(report);
    populateTechnicalTests(report);
    populateExternalInspection(report);
    populateNotes(report);
    populateInvoice(report);
    
    // Update step indicators and progress
    updateStepIndicators(currentStep);
    updateProgressBar();
}

/**
 * Populate general information step
 * @param {Object} report - The report data
 */
function populateGeneralInformation(report) {
    console.log('Populating general information:', report);
    
    // Client information
    if (report.client) {
        const clientSearchInput = document.getElementById('clientSearchInput');
        if (clientSearchInput) {
            clientSearchInput.value = report.client.name || report.client_name || '';
        }
        
        // Update client info display
        updateClientInfoDisplay(report.client);
    } else if (report.client_name) {
        // If client is not loaded but we have client_name, create a client object
        const clientSearchInput = document.getElementById('clientSearchInput');
        if (clientSearchInput) {
            clientSearchInput.value = report.client_name;
        }
        
        const clientInfo = {
            name: report.client_name,
            phone: report.client_phone,
            email: report.client_email,
            address: report.client_address
        };
        updateClientInfoDisplay(clientInfo);
    }
    
    // Device information
    const orderNumberInput = document.getElementById('orderNumber');
    if (orderNumberInput) {
        orderNumberInput.value = report.order_number || '';
    }
    
    const inspectionDateInput = document.getElementById('inspectionDate');
    if (inspectionDateInput) {
        const inspectionDate = new Date(report.inspection_date);
        if (!isNaN(inspectionDate.getTime())) {
            inspectionDateInput.value = inspectionDate.toISOString().split('T')[0];
        } else {
            inspectionDateInput.value = new Date().toISOString().split('T')[0];
        }
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
    
    console.log('Hardware status data:', hardwareStatus);
    
    // Create technical tests content
    const content = createTechnicalTestsContent(hardwareStatus);
    contentContainer.innerHTML = content;
    
    // Set up technical tests functionality and populate existing values
    setupTechnicalTests();
    populateTechnicalTestsValues(hardwareStatus);
}

/**
 * Create technical tests content with table format
 * @param {Array} hardwareStatus - The hardware status data
 * @returns {string} HTML content
 */
function createTechnicalTestsContent(hardwareStatus) {
    return `
        <div class="card mb-4 shadow-sm">
            <div class="card-header bg-success bg-opacity-10 d-flex justify-content-between align-items-center">
                <h5 class="mb-0 text-success"><i class="fas fa-check-square me-2"></i> فحص المكونات الأساسية</h5>
            </div>
            <div class="card-body">
                <p class="text-muted mb-3">تحقق من حالة المكونات الأساسية للجهاز</p>
                
                <div class="table-responsive rounded overflow-hidden" style="box-shadow: 0 2px 8px rgba(0,0,0,0.03);">
                    <table class="table table-bordered" id="hardwareComponentsTable">
                        <thead class="table-light">
                            <tr>
                                <th>المكون</th>
                                <th class="text-center" width="150">يعمل</th>
                                <th class="text-center" width="150">غير متوفر</th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- Camera -->
                            <tr>
                                <td><i class="fas fa-camera text-primary me-2"></i> الكاميرا</td>
                                <td class="text-center">
                                    <div class="form-check d-inline-block">
                                        <input data-hardwarecomponent="camera" class="form-check-input" type="radio" name="camera_status" id="camera_working" value="working">
                                        <label class="form-check-label" for="camera_working"></label>
                                    </div>
                                </td>
                                <td class="text-center">
                                    <div class="form-check d-inline-block">
                                        <input class="form-check-input" type="radio" name="camera_status" id="camera_not_available" value="not_available">
                                        <label class="form-check-label" for="camera_not_available"></label>
                                    </div>
                                </td>
                            </tr>
                            
                            <!-- Speakers -->
                            <tr>
                                <td><i class="fas fa-volume-up text-primary me-2"></i> السماعات</td>
                                <td class="text-center">
                                    <div class="form-check d-inline-block">
                                        <input data-hardwarecomponent="speakers" class="form-check-input" type="radio" name="speakers_status" id="speakers_working" value="working">
                                        <label class="form-check-label" for="speakers_working"></label>
                                    </div>
                                </td>
                                <td class="text-center">
                                    <div class="form-check d-inline-block">
                                        <input class="form-check-input" type="radio" name="speakers_status" id="speakers_not_available" value="not_available">
                                        <label class="form-check-label" for="speakers_not_available"></label>
                                    </div>
                                </td>
                            </tr>
                            
                            <!-- Microphone -->
                            <tr>
                                <td><i class="fas fa-microphone text-primary me-2"></i> الميكروفون</td>
                                <td class="text-center">
                                    <div class="form-check d-inline-block">
                                        <input data-hardwarecomponent="microphone" class="form-check-input" type="radio" name="microphone_status" id="microphone_working" value="working">
                                        <label class="form-check-label" for="microphone_working"></label>
                                    </div>
                                </td>
                                <td class="text-center">
                                    <div class="form-check d-inline-block">
                                        <input class="form-check-input" type="radio" name="microphone_status" id="microphone_not_available" value="not_available">
                                        <label class="form-check-label" for="microphone_not_available"></label>
                                    </div>
                                </td>
                            </tr>
                            
                            <!-- Wi-Fi -->
                            <tr>
                                <td><i class="fas fa-wifi text-primary me-2"></i> واي فاي</td>
                                <td class="text-center">
                                    <div class="form-check d-inline-block">
                                        <input data-hardwarecomponent="Wi-Fi" class="form-check-input" type="radio" name="wifi_status" id="wifi_working" value="working">
                                        <label class="form-check-label" for="wifi_working"></label>
                                    </div>
                                </td>
                                <td class="text-center">
                                    <div class="form-check d-inline-block">
                                        <input class="form-check-input" type="radio" name="wifi_status" id="wifi_not_available" value="not_available">
                                        <label class="form-check-label" for="wifi_not_available"></label>
                                    </div>
                                </td>
                            </tr>
                            
                            <!-- LAN -->
                            <tr>
                                <td><i class="fas fa-network-wired text-primary me-2"></i> منفذ الشبكة (LAN)</td>
                                <td class="text-center">
                                    <div class="form-check d-inline-block">
                                        <input data-hardwarecomponent="LAN" class="form-check-input" type="radio" name="lan_status" id="lan_working" value="working">
                                        <label class="form-check-label" for="lan_working"></label>
                                    </div>
                                </td>
                                <td class="text-center">
                                    <div class="form-check d-inline-block">
                                        <input class="form-check-input" type="radio" name="lan_status" id="lan_not_available" value="not_available">
                                        <label class="form-check-label" for="lan_not_available"></label>
                                    </div>
                                </td>
                            </tr>
                            
                            <!-- USB Ports -->
                            <tr>
                                <td><i class="fas fa-usb text-primary me-2"></i> منافذ USB</td>
                                <td class="text-center">
                                    <div class="form-check d-inline-block">
                                        <input data-hardwarecomponent="Ports" class="form-check-input" type="radio" name="usb_status" id="usb_working" value="working">
                                        <label class="form-check-label" for="usb_working"></label>
                                    </div>
                                </td>
                                <td class="text-center">
                                    <div class="form-check d-inline-block">
                                        <input class="form-check-input" type="radio" name="usb_status" id="usb_not_available" value="not_available">
                                        <label class="form-check-label" for="usb_not_available"></label>
                                    </div>
                                </td>
                            </tr>
                            
                            <!-- Keyboard -->
                            <tr>
                                <td><i class="fas fa-keyboard text-primary me-2"></i> لوحة المفاتيح</td>
                                <td class="text-center">
                                    <div class="form-check d-inline-block">
                                        <input data-hardwarecomponent="keyboard" class="form-check-input" type="radio" name="keyboard_status" id="keyboard_working" value="working">
                                        <label class="form-check-label" for="keyboard_working"></label>
                                    </div>
                                </td>
                                <td class="text-center">
                                    <div class="form-check d-inline-block">
                                        <input class="form-check-input" type="radio" name="keyboard_status" id="keyboard_not_available" value="not_available">
                                        <label class="form-check-label" for="keyboard_not_available"></label>
                                    </div>
                                </td>
                            </tr>
                            
                            <!-- Touchpad -->
                            <tr>
                                <td><i class="fas fa-hand-pointer text-primary me-2"></i> لوحة اللمس</td>
                                <td class="text-center">
                                    <div class="form-check d-inline-block">
                                        <input data-hardwarecomponent="Touchpad" class="form-check-input" type="radio" name="touchpad_status" id="touchpad_working" value="working">
                                        <label class="form-check-label" for="touchpad_working"></label>
                                    </div>
                                </td>
                                <td class="text-center">
                                    <div class="form-check d-inline-block">
                                        <input class="form-check-input" type="radio" name="touchpad_status" id="touchpad_not_available" value="not_available">
                                        <label class="form-check-label" for="touchpad_not_available"></label>
                                    </div>
                                </td>
                            </tr>
                            
                            <!-- Card Reader -->
                            <tr>
                                <td><i class="fas fa-sd-card text-primary me-2"></i> قارئ البطاقات</td>
                                <td class="text-center">
                                    <div class="form-check d-inline-block">
                                        <input data-hardwarecomponent="card" class="form-check-input" type="radio" name="card_reader_status" id="card_reader_working" value="working">
                                        <label class="form-check-label" for="card_reader_working"></label>
                                    </div>
                                </td>
                                <td class="text-center">
                                    <div class="form-check d-inline-block">
                                        <input class="form-check-input" type="radio" name="card_reader_status" id="card_reader_not_available" value="not_available">
                                        <label class="form-check-label" for="card_reader_not_available"></label>
                                    </div>
                                </td>
                            </tr>
                            
                            <!-- Audio Jack -->
                            <tr>
                                <td><i class="fas fa-headphones text-primary me-2"></i> منفذ الصوت</td>
                                <td class="text-center">
                                    <div class="form-check d-inline-block">
                                        <input data-hardwarecomponent="audio_jack" class="form-check-input" type="radio" name="audio_jack_status" id="audio_jack_working" value="working">
                                        <label class="form-check-label" for="audio_jack_working"></label>
                                    </div>
                                </td>
                                <td class="text-center">
                                    <div class="form-check d-inline-block">
                                        <input class="form-check-input" type="radio" name="audio_jack_status" id="audio_jack_not_available" value="not_available">
                                        <label class="form-check-label" for="audio_jack_not_available"></label>
                                    </div>
                                </td>
                            </tr>
                            
                            <!-- Display Ports -->
                            <tr>
                                <td><i class="fas fa-desktop text-primary me-2"></i> منافذ العرض (HDMI/DisplayPort)</td>
                                <td class="text-center">
                                    <div class="form-check d-inline-block">
                                        <input data-hardwarecomponent="DisplayPort" class="form-check-input" type="radio" name="display_ports_status" id="display_ports_working" value="working">
                                        <label class="form-check-label" for="display_ports_working"></label>
                                    </div>
                                </td>
                                <td class="text-center">
                                    <div class="form-check d-inline-block">
                                        <input class="form-check-input" type="radio" name="display_ports_status" id="display_ports_not_available" value="not_available">
                                        <label class="form-check-label" for="display_ports_not_available"></label>
                                    </div>
                                </td>
                            </tr>
                            
                            <!-- Bluetooth -->
                            <tr>
                                <td><i class="fab fa-bluetooth-b text-primary me-2"></i> بلوتوث</td>
                                <td class="text-center">
                                    <div class="form-check d-inline-block">
                                        <input data-hardwarecomponent="Bluetooth" class="form-check-input" type="radio" name="bluetooth_status" id="bluetooth_working" value="working">
                                        <label class="form-check-label" for="bluetooth_working"></label>
                                    </div>
                                </td>
                                <td class="text-center">
                                    <div class="form-check d-inline-block">
                                        <input class="form-check-input" type="radio" name="bluetooth_status" id="bluetooth_not_available" value="not_available">
                                        <label class="form-check-label" for="bluetooth_not_available"></label>
                                    </div>
                                </td>
                            </tr>
                            
                            <!-- Touchscreen -->
                            <tr>
                                <td><i class="fas fa-hand-pointer text-primary me-2"></i> الشاشة تاتش</td>
                                <td class="text-center">
                                    <div class="form-check d-inline-block">
                                        <input data-hardwarecomponent="touchscreen" class="form-check-input" type="radio" name="touchscreen_status" id="touchscreen_working" value="working">
                                        <label class="form-check-label" for="touchscreen_working"></label>
                                    </div>
                                </td>
                                <td class="text-center">
                                    <div class="form-check d-inline-block">
                                        <input class="form-check-input" type="radio" name="touchscreen_status" id="touchscreen_not_available" value="not_available">
                                        <label class="form-check-label" for="touchscreen_not_available"></label>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

/**
 * Populate technical tests values from existing data
 * @param {Array} hardwareStatus - The hardware status data
 */
function populateTechnicalTestsValues(hardwareStatus) {
    console.log('Populating technical tests values:', hardwareStatus);
    
    if (!Array.isArray(hardwareStatus)) {
        console.warn('Hardware status is not an array:', hardwareStatus);
        return;
    }
    
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
        'Bluetooth': 'bluetooth_status',
        'touchscreen': 'touchscreen_status'
    };
    
    hardwareStatus.forEach(component => {
        const componentName = component.componentName;
        const status = component.status;
        
        if (!componentName || !status) {
            console.warn('Invalid component data:', component);
            return;
        }
        
        // Find the corresponding form field name
        const formFieldName = componentMapping[componentName];
        if (!formFieldName) {
            console.warn(`No mapping found for component: ${componentName}`);
            return;
        }
        
        // Find and check the appropriate radio button
        const radioButton = document.querySelector(`input[name="${formFieldName}"][value="${status}"]`);
        if (radioButton) {
            radioButton.checked = true;
            console.log(`Set ${formFieldName} to ${status} for component ${componentName}`);
        } else {
            console.warn(`Radio button not found for ${formFieldName} with value ${status}`);
        }
    });
}

/**
 * Set up technical tests functionality
 */
function setupTechnicalTests() {
    // Add event listeners for technical tests if needed
    // Currently, the radio buttons are handled by the populateTechnicalTestsValues function
    console.log('Technical tests setup completed');
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
    
    console.log('External images data:', externalImages);
    
    // Create external inspection content
    const content = createExternalInspectionContent(externalImages);
    contentContainer.innerHTML = content;
    
    // Set up external inspection functionality and populate existing media
    setupExternalInspection();
    populateExternalInspectionMedia(externalImages);
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
 * Populate external inspection media from existing data
 * @param {Array} externalImages - The external images data
 */
function populateExternalInspectionMedia(externalImages) {
    console.log('Populating external inspection media:', externalImages);
    
    if (!Array.isArray(externalImages)) return;
    
    externalImages.forEach(media => {
        if (media.type === 'image') {
            addImageBadge(media.url);
            createImagePreview(media.url);
        } else if (media.type === 'video' || media.type === 'youtube' || media.type === 'vimeo' || media.type === 'gdrive') {
            addVideoBadge(media.url, media.type);
            createVideoPreview(media.url, media.type);
        }
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
 * Create image preview
 * @param {string} imageUrl - The image URL
 */
function createImagePreview(imageUrl) {
    const previewContainer = document.getElementById('externalImagesPreview');
    if (!previewContainer) return;
    
    const imageCard = document.createElement('div');
    imageCard.className = 'image-card col-md-4 mb-3';
    
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = 'External inspection image';
    img.className = 'img-fluid rounded';
    img.style.height = '200px';
    img.style.width = '100%';
    img.style.objectFit = 'cover';
    img.onerror = function() {
        this.src = 'img/image-error.png';
        this.alt = 'Image failed to load';
    };
    
    imageCard.appendChild(img);
    previewContainer.appendChild(imageCard);
}

/**
 * Create video preview
 * @param {string} videoUrl - The video URL
 * @param {string} videoType - The video type
 */
function createVideoPreview(videoUrl, videoType) {
    const previewContainer = document.getElementById('videoPreviewContainer');
    if (!previewContainer) return;
    
    const videoCard = document.createElement('div');
    videoCard.className = 'card mb-3';
    videoCard.setAttribute('data-url', videoUrl);
    
    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';
    
    const cardTitle = document.createElement('h6');
    cardTitle.className = 'card-title';
    cardTitle.textContent = getVideoTypeTitle(videoType);
    
    cardBody.appendChild(cardTitle);
    
    if (videoType === 'youtube') {
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
        }
    } else if (videoType === 'vimeo') {
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
        }
    } else {
        const video = document.createElement('video');
        video.controls = true;
        video.className = 'w-100';
        video.style.maxHeight = '300px';
        const source = document.createElement('source');
        source.src = videoUrl;
        source.type = 'video/mp4';
        video.appendChild(source);
        cardBody.appendChild(video);
    }
    
    videoCard.appendChild(cardBody);
    previewContainer.appendChild(videoCard);
}

/**
 * Get video type title
 * @param {string} videoType - The video type
 * @returns {string} The video type title
 */
function getVideoTypeTitle(videoType) {
    switch (videoType) {
        case 'youtube': return 'YouTube Video';
        case 'vimeo': return 'Vimeo Video';
        case 'gdrive': return 'Google Drive Video';
        default: return 'Video File';
    }
}

/**
 * Get YouTube video ID
 * @param {string} url - The YouTube URL
 * @returns {string|null} The video ID
 */
function getYoutubeVideoId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

/**
 * Get Vimeo video ID
 * @param {string} url - The Vimeo URL
 * @returns {string|null} The video ID
 */
function getVimeoVideoId(url) {
    const regExp = /vimeo\.com\/(?:video\/)?([0-9]+)/;
    const match = url.match(regExp);
    return match ? match[1] : null;
}

/**
 * Set up external inspection functionality
 */
function setupExternalInspection() {
    // Set up image URL functionality
    const addImageUrlBtn = document.getElementById('addImageUrlBtn');
    const imageUrlInput = document.getElementById('imageUrlInput');
    
    if (addImageUrlBtn && imageUrlInput) {
        addImageUrlBtn.addEventListener('click', function() {
            const imageUrl = imageUrlInput.value.trim();
            
            if (!imageUrl) {
                alert('الرجاء إدخال رابط صورة');
                return;
            }
            
            if (!isValidImageUrl(imageUrl)) {
                alert('الرجاء إدخال رابط صورة صالح');
                return;
            }
            
            // Check if URL already exists
            const existingBadges = document.querySelectorAll(`#imageUrlBadges .badge[data-url="${imageUrl}"]`);
            if (existingBadges.length > 0) {
                alert('تم إضافة هذا الرابط مسبقاً');
                return;
            }
            
            addImageBadge(imageUrl);
            createImagePreview(imageUrl);
            
            // Clear input
            imageUrlInput.value = '';
        });
        
        // Allow pressing Enter to add image URL
        imageUrlInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                addImageUrlBtn.click();
            }
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
            
            addVideoBadge(videoUrl, videoType);
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
 * Check if URL is a valid image URL
 * @param {string} url - The URL to check
 * @returns {boolean} True if valid image URL
 */
function isValidImageUrl(url) {
    if (!url || !url.match(/^https?:\/\/.+/i)) {
        return false;
    }
    
    const imageExtensions = /\.(jpeg|jpg|png|gif|bmp|webp)$/i;
    return imageExtensions.test(url);
}

/**
 * Get video URL type
 * @param {string} url - The video URL
 * @returns {string|null} The video type
 */
function getVideoUrlType(url) {
    if (!url || !url.match(/^https?:\/\/.+/i)) {
        return null;
    }
    
    if (url.match(/youtube\.com\/watch\?v=|youtu\.be\//i)) {
        return 'youtube';
    }
    
    if (url.match(/vimeo\.com\//i)) {
        return 'vimeo';
    }
    
    if (url.match(/drive\.google\.com\//i)) {
        return 'gdrive';
    }
    
    const videoExtensions = /\.(mp4|webm|ogg|mov)$/i;
    if (videoExtensions.test(url)) {
        return 'video';
    }
    
    return null;
}

/**
 * Populate notes step
 * @param {Object} report - The report data
 */
function populateNotes(report) {
    const contentContainer = document.getElementById('notesContent');
    if (!contentContainer) return;
    
    console.log('Populating notes:', report.notes);
    
    const content = `
        <div class="card border-0 shadow-sm mb-4" style="margin: 1rem; padding: 1rem;">
            <div class="card-body p-4">
                <div class="mb-4" style="margin: 1rem 0;">
                    <div class="position-relative" style="box-shadow: 0 4px 15px rgba(0,0,0,0.05); border-radius: var(--input-radius); overflow: hidden;">
                        <textarea class="form-control border-0" id="generalNotes" rows="6" placeholder="أدخل أي ملاحظات إضافية عن حالة الجهاز" style="padding: 1rem; background-color: #fafafa;">${report.notes || ''}</textarea>
                    </div>
                    <div class="text-muted small mt-2">
                        <i class="fas fa-info-circle me-1"></i>
                        يمكنك إضافة أي ملاحظات أو تفاصيل إضافية لم يتم ذكرها في الخطوات السابقة
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
    
    console.log('Populating invoice:', report);
    
    const content = `
        <div class="card border-0 shadow-sm mb-4">
            <div class="card-header bg-success bg-opacity-10 d-flex justify-content-between align-items-center">
                <h5 class="mb-0 text-success"><i class="fas fa-file-invoice me-2"></i> تفاصيل الفاتورة</h5>
                
                <!-- Billing Toggle Button -->
                <div class="form-check form-switch ps-0 d-flex align-items-center">
                    <div class="toggle-container d-inline-flex align-items-center gap-2" style="background: rgba(255,255,255,0.8); padding: 0.5rem 1rem; border-radius: 50px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                        <span class="fw-bold small" id="billingStatusText" style="color: var(--primary-color);">الفاتورة مفعلة</span>
                        <input class="form-check-input ms-2 me-0" type="checkbox" id="enableBilling" ${report.billing_enabled ? 'checked' : ''} style="width: 3rem; height: 1.5rem;">
                    </div>
                </div>
            </div>
            <div class="card-body">
                <!-- Billing Info Text -->
                <div class="alert alert-light border-0 mb-4" style="background: rgba(14, 175, 84, 0.05);">
                    <div class="d-flex">
                        <div class="me-3 text-success">
                            <i class="fas fa-info-circle fa-2x"></i>
                        </div>
                        <div>
                            <h6 class="fw-bold mb-1">معلومات الفاتورة</h6>
                            <p class="mb-0">عند تفعيل الفاتورة، سيتم إنشاء فاتورة تلقائيًا مع التقرير. إذا كنت ترغب في إنشاء فاتورة لاحقًا، يمكنك إلغاء تفعيل هذا الخيار.</p>
                        </div>
                    </div>
                </div>
                
                <!-- Invoice Fields Container -->
                <div id="invoiceFieldsContainer" style="display: ${report.billing_enabled ? 'block' : 'none'};">
                    <!-- Device Details Section -->
                    <div class="mb-4">
                        <h6 class="fw-bold mb-3">تفاصيل الأجهزة</h6>
                        <div id="laptopsContainer">
                            <div class="row mb-3 laptop-row">
                                <div class="col-md-4">
                                    <label class="form-label">اسم الجهاز</label>
                                    <div class="input-group">
                                        <input type="text" class="form-control laptop-name" id="invoiceDeviceName" placeholder="موديل الجهاز" value="${report.device_model || ''}" readonly />
                                        <span class="input-group-text bg-light text-muted"><i class="fas fa-laptop"></i></span>
                                    </div>
                                    <small class="text-muted">تم نقله تلقائيًا من الخطوة الأولى</small>
                                </div>
                                <div class="col-md-3">
                                    <label class="form-label">الرقم التسلسلي</label>
                                    <div class="input-group">
                                        <input type="text" class="form-control laptop-serial" id="invoiceSerialNumber" placeholder="الرقم التسلسلي" value="${report.serial_number || ''}" readonly />
                                        <span class="input-group-text bg-light text-muted"><i class="fas fa-barcode"></i></span>
                                    </div>
                                    <small class="text-muted">تم نقله تلقائيًا من الخطوة الأولى</small>
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label">السعر</label>
                                    <div class="input-group">
                                        <input type="number" class="form-control laptop-price" id="invoicePrice" placeholder="أدخل السعر" min="0" step="1" value="${report.amount || 250}" />
                                        <span class="input-group-text">جنية</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Additional Items Section -->
                    <div class="mb-4">
                        <h6 class="fw-bold mb-3">عناصر إضافية</h6>
                        <div id="itemsContainer">
                            <!-- Additional items will be added here -->
                        </div>
                        <button type="button" class="btn btn-sm btn-outline-success mt-2" id="addItemBtn">
                            <i class="fas fa-plus me-1"></i> إضافة عنصر
                        </button>
                    </div>
                    
                    <!-- Service Fees Section -->
                    <div class="mb-4">
                        <div class="row">
                            <div class="col-md-6">
                                <label class="form-label">نسبة الضريبة</label>
                                <div class="input-group">
                                    <input type="number" class="form-control" id="taxRate" value="0" min="0" max="100" oninput="updateTaxDisplay()" />
                                    <span class="input-group-text">%</span>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">خصم (إن وجد)</label>
                                <div class="input-group">
                                    <input type="number" class="form-control" id="discount" value="0" min="0" step="0.01" />
                                    <span class="input-group-text">جنية</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Invoice Preview -->
                    <div class="card bg-light">
                        <div class="card-body">
                            <h6 class="fw-bold mb-3">ملخص الفاتورة</h6>
                            <div class="d-flex justify-content-between mb-2">
                                <span>المجموع الفرعي:</span>
                                <span id="subtotalDisplay">${report.amount || 0}.00 جنية</span>
                            </div>
                            <div class="d-flex justify-content-between mb-2">
                                <span>الخصم:</span>
                                <span id="discountDisplay">0.00 جنية</span>
                            </div>
                            <div class="d-flex justify-content-between mb-2">
                                <span id="taxRateLabel">الضريبة (0%):</span>
                                <span id="taxDisplay">0.00 جنية</span>
                            </div>
                            <hr>
                            <div class="d-flex justify-content-between fw-bold">
                                <span>الإجمالي:</span>
                                <span id="totalDisplay">${report.amount || 0}.00 جنية</span>
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
 * Get technical notes from hardware status
 * @param {string} hardwareStatus - The hardware status JSON string
 * @returns {string} Technical notes
 */
function getTechnicalNotes(hardwareStatus) {
    if (!hardwareStatus) return '';
    
    try {
        const status = JSON.parse(hardwareStatus);
        if (!Array.isArray(status)) return '';
        
        const notes = status.filter(item => item.type === 'note' || item.componentName === 'notes');
        return notes.map(note => note.notes || note.status).join('\n');
    } catch (error) {
        console.error('Error parsing hardware status for notes:', error);
        return '';
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
 * @param {string} message - Error message to display
 */
function showError(message) {
    const errorContainer = document.getElementById('errorContainer');
    if (errorContainer) {
        errorContainer.textContent = message;
        errorContainer.style.display = 'block';
    }
}

/**
 * Hide error message
 */
function hideError() {
    const errorContainer = document.getElementById('errorContainer');
    if (errorContainer) {
        errorContainer.style.display = 'none';
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
        form.addEventListener('submit', handleFormSubmit);
    }
});

/**
 * Handle form submission
 * @param {Event} e - The form submission event
 */
async function handleFormSubmit(e) {
    e.preventDefault();
    
    if (!validateCurrentStep(currentStep)) {
        showError('يرجى تصحيح الأخطاء في النموذج');
        return;
    }
    
    try {
        showLoading(true);
        
        const formData = collectFormData();
        const reportId = getReportIdFromUrl();
        
        if (!reportId) {
            throw new Error('Report ID not found in URL');
        }
        
        console.log('Updating report with data:', formData);
        
        const response = await apiService.updateReport(reportId, formData);
        
        showLoading(false);
        showSuccess('تم تحديث التقرير بنجاح');
        
        // Redirect to reports page after a short delay
        setTimeout(() => {
            window.location.href = 'reports.html';
        }, 2000);
        
    } catch (error) {
        console.error('Error updating report:', error);
        showLoading(false);
        showError('حدث خطأ أثناء تحديث التقرير: ' + error.message);
    }
}

/**
 * Collect form data
 * @returns {Object} The collected form data
 */
function collectFormData() {
    console.log('Collecting form data...');
    
    // Collect data from all steps
    const formData = {
        // General information
        order_number: document.getElementById('orderNumber')?.value || '',
        inspection_date: document.getElementById('inspectionDate')?.value || '',
        device_model: document.getElementById('deviceModel')?.value || '',
        serial_number: document.getElementById('serialNumber')?.value || '',
        
        // Notes
        notes: document.getElementById('generalNotes')?.value || ''
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
    
    // Add invoice data
    const enableBillingCheckbox = document.getElementById('enableBilling');
    if (enableBillingCheckbox && enableBillingCheckbox.checked) {
        formData.billing_enabled = true;
        
        // Get device price
        const invoicePriceInput = document.getElementById('invoicePrice');
        if (invoicePriceInput) {
            formData.amount = parseFloat(invoicePriceInput.value || '0');
        }
        
        // Get tax rate and discount
        const taxRateInput = document.getElementById('taxRate');
        const discountInput = document.getElementById('discount');
        
        if (taxRateInput) {
            formData.tax_rate = parseFloat(taxRateInput.value || '0');
        }
        if (discountInput) {
            formData.discount = parseFloat(discountInput.value || '0');
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
        
        formData.additional_items = additionalItems;
    } else {
        formData.billing_enabled = false;
        formData.amount = 0;
    }
    
    console.log('Collected form data:', formData);
    return formData;
}

/**
 * Collect technical tests data
 * @returns {string} JSON string of technical tests data
 */
function collectTechnicalTestsData() {
    const hardwareStatus = [];
    
    // Collect main component statuses from the table
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
    
    console.log('Collected technical tests data:', hardwareStatus);
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

/**
 * Update client info display
 * @param {Object} client - The client data
 */
function updateClientInfoDisplay(client) {
    const selectedClientInfo = document.getElementById('selectedClientInfo');
    const clientQuickActions = document.getElementById('clientQuickActions');
    
    if (!selectedClientInfo) return;
    
    // Update the client info card
    const selectedClientName = document.getElementById('selectedClientName');
    const selectedClientPhone = document.getElementById('selectedClientPhone');
    const selectedClientEmail = document.getElementById('selectedClientEmail');
    
    if (selectedClientName) selectedClientName.textContent = client.name;
    if (selectedClientPhone) {
        selectedClientPhone.innerHTML = `<i class="fas fa-phone me-1"></i> ${client.phone || 'غير متوفر'}`;
    }
    if (selectedClientEmail) {
        selectedClientEmail.innerHTML = `<i class="fas fa-envelope me-1"></i> ${client.email || 'غير متوفر'}`;
    }
    
    // Update additional client details if the elements exist
    if (document.getElementById('selectedClientOrderCode')) {
        document.getElementById('selectedClientOrderCode').textContent = client.orderCode || 'غير متوفر';
    }
    
    if (document.getElementById('selectedClientStatus')) {
        const statusElement = document.getElementById('selectedClientStatus');
        statusElement.textContent = getStatusText(client.status);
        
        // Update status badge color based on status
        statusElement.className = 'badge ms-1 text-white';
        switch(client.status) {
            case 'active':
                statusElement.classList.add('bg-success');
                break;
            case 'inactive':
                statusElement.classList.add('bg-secondary');
                break;
            case 'pending':
                statusElement.classList.add('bg-warning');
                break;
            default:
                statusElement.classList.add('bg-secondary');
        }
    }
    
    if (document.getElementById('selectedClientAddress')) {
        document.getElementById('selectedClientAddress').textContent = 
            client.address || 'غير متوفر';
    }
    
    // Try to get last report date if available
    if (document.getElementById('selectedClientLastReport')) {
        const lastReportElement = document.getElementById('selectedClientLastReport');
        
        if (client.lastReportDate) {
            const date = new Date(client.lastReportDate);
            lastReportElement.textContent = date.toLocaleDateString('ar-SA');
        } else {
            lastReportElement.textContent = 'لا يوجد تقارير سابقة';
        }
    }
    
    // Setup edit button if it exists
    const editButton = document.getElementById('editSelectedClient');
    if (editButton) {
        editButton.onclick = function() {
            openEditClientModal(client);
        };
    }
    
    // Show the client info card with a subtle animation
    selectedClientInfo.style.opacity = '0';
    selectedClientInfo.style.display = 'block';
    setTimeout(() => {
        selectedClientInfo.style.transition = 'opacity 0.3s ease-in-out';
        selectedClientInfo.style.opacity = '1';
    }, 10);
    
    // Show quick actions if they exist
    if (clientQuickActions) {
        clientQuickActions.style.display = 'flex';
        
        // Setup view history button if it exists
        const historyButton = document.getElementById('viewClientHistory');
        if (historyButton) {
            historyButton.onclick = function() {
                viewClientHistory(client.id);
            };
        }
        
        // Setup view reports button if it exists
        const reportsButton = document.getElementById('viewClientReports');
        if (reportsButton) {
            reportsButton.onclick = function() {
                viewClientReports(client.id);
            };
        }
    }
}

/**
 * Get status text
 * @param {string} status - The status
 * @returns {string} The status text
 */
function getStatusText(status) {
    switch(status) {
        case 'active': return 'نشط';
        case 'inactive': return 'غير نشط';
        case 'pending': return 'في الانتظار';
        default: return status || 'غير محدد';
    }
}

/**
 * Set up client search functionality
 */
function setupClientSearch() {
    const searchInput = document.getElementById('clientSearchInput');
    const searchResults = document.getElementById('clientSearchResults');
    const searchIcon = document.getElementById('clientSearchIcon');
    
    if (!searchInput || !searchResults) return;
    
    let searchTimeout;
    let selectedIndex = -1;
    
    // Handle search input
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.trim();
        
        // Clear previous timeout
        clearTimeout(searchTimeout);
        
        // Hide results if search is empty
        if (!searchTerm) {
            hideSearchResults();
            return;
        }
        
        // Debounce search to avoid too many searches
        searchTimeout = setTimeout(() => {
            performSearch(searchTerm);
        }, 300);
    });
    
    // Handle keyboard navigation
    searchInput.addEventListener('keydown', function(e) {
        const results = searchResults.querySelectorAll('.client-result-item');
        
        switch(e.key) {
            case 'ArrowDown':
                e.preventDefault();
                selectedIndex = Math.min(selectedIndex + 1, results.length - 1);
                updateSelection(results);
                break;
            case 'ArrowUp':
                e.preventDefault();
                selectedIndex = Math.max(selectedIndex - 1, -1);
                updateSelection(results);
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && results[selectedIndex]) {
                    selectClient(results[selectedIndex]);
                }
                break;
            case 'Escape':
                hideSearchResults();
                break;
        }
    });
    
    // Handle search icon click
    if (searchIcon) {
        searchIcon.addEventListener('click', function() {
            if (searchResults.style.display === 'none') {
                performSearch(searchInput.value.trim());
            } else {
                hideSearchResults();
            }
        });
    }
    
    // Handle click outside to close results
    document.addEventListener('click', function(e) {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            hideSearchResults();
        }
    });
    
    // Perform search and show results
    function performSearch(searchTerm) {
        if (!searchTerm || !Array.isArray(clientsData)) {
            hideSearchResults();
            return;
        }
        
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
        
        displaySearchResults(filteredClients);
    }
    
    // Display search results
    function displaySearchResults(clients) {
        if (!clients || clients.length === 0) {
            searchResults.innerHTML = '<div class="p-3 text-muted">لا توجد نتائج</div>';
            searchResults.style.display = 'block';
            return;
        }
        
        const resultsHTML = clients.map((client, index) => `
            <div class="client-result-item p-2 border-bottom" data-client-id="${client.id}" data-index="${index}">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <div class="fw-bold">${client.name}</div>
                        <small class="text-muted">
                            <i class="fas fa-phone me-1"></i>${client.phone || 'غير متوفر'}
                        </small>
                    </div>
                    <small class="text-muted">${client.email || ''}</small>
                </div>
            </div>
        `).join('');
        
        searchResults.innerHTML = resultsHTML;
        searchResults.style.display = 'block';
        
        // Add click handlers
        searchResults.querySelectorAll('.client-result-item').forEach(item => {
            item.addEventListener('click', function() {
                selectClient(this);
            });
        });
    }
    
    // Select a client
    function selectClient(element) {
        const clientId = element.getAttribute('data-client-id');
        const client = clientsData.find(c => c.id == clientId);
        
        if (client) {
            searchInput.value = client.name;
            updateClientInfoDisplay(client);
            hideSearchResults();
        }
    }
    
    // Update selection
    function updateSelection(results) {
        results.forEach((result, index) => {
            result.classList.toggle('bg-light', index === selectedIndex);
        });
    }
    
    // Hide search results
    function hideSearchResults() {
        searchResults.style.display = 'none';
        selectedIndex = -1;
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
        submitButton.textContent = isEnabled ? 'إنشاء التقرير والفاتورة' : 'إنشاء التقرير';
    }
    
    // Set initial state
    updateBillingUI();
    
    // Add event listener for checkbox changes
    enableBillingCheckbox.addEventListener('change', updateBillingUI);
}

/**
 * Set up form navigation
 */
function setupFormNavigation() {
    console.log('Setting up form navigation...');
    
    // Add event listeners for individual navigation buttons
    document.querySelectorAll('.btn-next-step').forEach(button => {
        button.addEventListener('click', function() {
            console.log('Next button clicked');
            if (validateCurrentStep(currentStep)) {
                nextStep();
            }
        });
    });
    
    document.querySelectorAll('.btn-prev-step').forEach(button => {
        button.addEventListener('click', function() {
            console.log('Previous button clicked');
            previousStep();
        });
    });
    
    console.log('Form navigation setup completed');
}

/**
 * Navigate to next step
 */
function nextStep() {
    if (currentStep < 4) { // 5 steps total (0-4)
        currentStep++;
        showStep(currentStep);
        updateStepIndicators(currentStep);
        updateProgressBar();
        console.log('Moved to step:', currentStep);
    }
}

/**
 * Navigate to previous step
 */
function previousStep() {
    if (currentStep > 0) {
        currentStep--;
        showStep(currentStep);
        updateStepIndicators(currentStep);
        updateProgressBar();
        console.log('Moved to step:', currentStep);
    }
}

/**
 * Show specific step
 * @param {number} stepIndex - The step index to show
 */
function showStep(stepIndex) {
    // Hide all steps
    document.querySelectorAll('.form-step').forEach(step => {
        step.style.display = 'none';
        step.classList.remove('active');
    });
    
    // Show the current step
    const currentStepElement = document.getElementById(`step${stepIndex + 1}`);
    if (currentStepElement) {
        currentStepElement.style.display = 'block';
        currentStepElement.classList.add('active');
    }
    
    // Update navigation buttons visibility
    updateNavigationButtons(stepIndex);
}

/**
 * Update navigation buttons visibility
 * @param {number} stepIndex - The current step index
 */
function updateNavigationButtons(stepIndex) {
    const prevButtons = document.querySelectorAll('.btn-prev-step');
    const nextButtons = document.querySelectorAll('.btn-next-step');
    
    // Show/hide previous buttons
    prevButtons.forEach(btn => {
        btn.style.display = stepIndex > 0 ? 'inline-block' : 'none';
    });
    
    // Update next buttons text and visibility
    nextButtons.forEach(btn => {
        if (stepIndex === 4) { // Last step
            btn.style.display = 'none';
        } else {
            btn.style.display = 'inline-block';
            btn.textContent = 'التالي';
        }
    });
}

/**
 * Update step indicators
 * @param {number} currentStep - The current step
 */
function updateStepIndicators(currentStep) {
    // Remove active class from all step buttons
    document.querySelectorAll('.step-button').forEach(button => {
        button.classList.remove('btn-primary');
        button.classList.add('btn-outline-primary');
    });
    
    // Add active class to current step button
    const currentStepButton = document.querySelector(`.step-button[data-step="${currentStep}"]`);
    if (currentStepButton) {
        currentStepButton.classList.remove('btn-outline-primary');
        currentStepButton.classList.add('btn-primary');
    }
    
    console.log('Step indicators updated for step:', currentStep);
}

/**
 * Update progress bar
 */
function updateProgressBar() {
    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) {
        const progressPercentage = (currentStep / 4) * 100; // 5 steps total (0-4)
        progressBar.style.width = progressPercentage + '%';
        progressBar.setAttribute('aria-valuenow', progressPercentage);
    }
    console.log('Progress bar updated to:', (currentStep / 4) * 100 + '%');
}

/**
 * Get report ID from URL
 * @returns {string|null} The report ID
 */
function getReportIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

/**
 * Validate current step
 * @param {number} step - The step to validate
 * @returns {boolean} True if valid
 */
function validateCurrentStep(step) {
    // Basic validation - can be enhanced based on requirements
    console.log('Validating step:', step);
    return true;
}

/**
 * Open edit client modal
 * @param {Object} client - The client data
 */
function openEditClientModal(client) {
    console.log('Opening edit client modal for:', client);
    // Implementation can be added if needed
}

/**
 * View client history
 * @param {string} clientId - The client ID
 */
function viewClientHistory(clientId) {
    console.log('Viewing client history for:', clientId);
    // Implementation can be added if needed
}

/**
 * View client reports
 * @param {string} clientId - The client ID
 */
function viewClientReports(clientId) {
    console.log('Viewing client reports for:', clientId);
    // Implementation can be added if needed
} 

/**
 * Set up invoice functionality
 */
function setupInvoiceFunctionality() {
    // Set up billing toggle
    const enableBillingCheckbox = document.getElementById('enableBilling');
    const invoiceFieldsContainer = document.getElementById('invoiceFieldsContainer');
    const billingStatusText = document.getElementById('billingStatusText');
    
    if (enableBillingCheckbox && invoiceFieldsContainer) {
        // Function to update UI based on checkbox state
        function updateBillingUI() {
            const isEnabled = enableBillingCheckbox.checked;
            
            // Update invoice fields container visibility
            invoiceFieldsContainer.style.display = isEnabled ? 'block' : 'none';
            
            // Update billing status text if it exists
            if (billingStatusText) {
                billingStatusText.textContent = isEnabled ? 'الفاتورة مفعلة' : 'الفاتورة معطلة';
                billingStatusText.style.color = isEnabled ? 'var(--primary-color)' : '#dc3545';
            }
        }
        
        // Set initial state
        updateBillingUI();
        
        // Add event listener for checkbox changes
        enableBillingCheckbox.addEventListener('change', updateBillingUI);
    }
    
    // Set up additional items functionality
    const addItemBtn = document.getElementById('addItemBtn');
    const itemsContainer = document.getElementById('itemsContainer');
    
    if (addItemBtn && itemsContainer) {
        addItemBtn.addEventListener('click', function() {
            addInvoiceItem();
        });
    }
    
    // Set up tax and discount calculations
    const taxRateInput = document.getElementById('taxRate');
    const discountInput = document.getElementById('discount');
    const invoicePriceInput = document.getElementById('invoicePrice');
    
    if (taxRateInput) {
        taxRateInput.addEventListener('input', updateTaxDisplay);
    }
    if (discountInput) {
        discountInput.addEventListener('input', updateTaxDisplay);
    }
    if (invoicePriceInput) {
        invoicePriceInput.addEventListener('input', updateTaxDisplay);
    }
    
    // Initial tax display update
    updateTaxDisplay();
}

/**
 * Add invoice item
 */
function addInvoiceItem() {
    const itemsContainer = document.getElementById('itemsContainer');
    if (!itemsContainer) return;
    
    const itemId = Date.now();
    const itemHtml = `
        <div class="row mb-3 invoice-item" data-item-id="${itemId}">
            <div class="col-md-4">
                <label class="form-label">وصف العنصر</label>
                <input type="text" class="form-control item-description" placeholder="وصف العنصر">
            </div>
            <div class="col-md-2">
                <label class="form-label">الكمية</label>
                <input type="number" class="form-control item-quantity" value="1" min="1" oninput="updateItemTotal(${itemId})">
            </div>
            <div class="col-md-3">
                <label class="form-label">سعر الوحدة</label>
                <input type="number" class="form-control item-unit-price" value="0" min="0" step="0.01" oninput="updateItemTotal(${itemId})">
            </div>
            <div class="col-md-2">
                <label class="form-label">الإجمالي</label>
                <input type="text" class="form-control item-total" value="0.00" readonly>
            </div>
            <div class="col-md-1">
                <label class="form-label">&nbsp;</label>
                <button type="button" class="btn btn-outline-danger btn-sm" onclick="removeInvoiceItem(${itemId})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `;
    
    itemsContainer.insertAdjacentHTML('beforeend', itemHtml);
}

/**
 * Remove invoice item
 * @param {number} itemId - The item ID to remove
 */
function removeInvoiceItem(itemId) {
    const item = document.querySelector(`[data-item-id="${itemId}"]`);
    if (item) {
        item.remove();
        updateTaxDisplay();
    }
}

/**
 * Update item total
 * @param {number} itemId - The item ID to update
 */
function updateItemTotal(itemId) {
    const item = document.querySelector(`[data-item-id="${itemId}"]`);
    if (!item) return;
    
    const quantity = parseFloat(item.querySelector('.item-quantity').value) || 0;
    const unitPrice = parseFloat(item.querySelector('.item-unit-price').value) || 0;
    const total = quantity * unitPrice;
    
    item.querySelector('.item-total').value = total.toFixed(2);
    updateTaxDisplay();
}

/**
 * Update tax display in the invoice preview
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
            // Calculate subtotal from device price and additional items
            let subtotal = 0;
            
            // Add device price
            const invoicePriceInput = document.getElementById('invoicePrice');
            if (invoicePriceInput) {
                subtotal += parseFloat(invoicePriceInput.value || '0');
            }
            
            // Add additional items
            const additionalItems = document.querySelectorAll('.invoice-item');
            additionalItems.forEach(item => {
                const itemTotal = parseFloat(item.querySelector('.item-total').value || '0');
                subtotal += itemTotal;
            });
            
            // Get discount
            const discountInput = document.getElementById('discount');
            const discount = parseFloat(discountInput?.value || '0');
            
            // Calculate tax and total
            const taxAmount = (subtotal - discount) * (taxRate / 100);
            const total = subtotal - discount + taxAmount;
            
            // Update the display elements
            subtotalDisplay.textContent = subtotal.toFixed(2) + ' جنية';
            discountDisplay.textContent = discount.toFixed(2) + ' جنية';
            taxDisplay.textContent = taxAmount.toFixed(2) + ' جنية';
            totalDisplay.textContent = total.toFixed(2) + ' جنية';
        }
    }
} 