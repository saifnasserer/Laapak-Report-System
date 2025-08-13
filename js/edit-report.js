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