/**
 * Laapak Report System - Edit Report
 * Handles the report editing functionality
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

// Local references for convenience
let globalDeviceDetails = window.globalDeviceDetails;
let clientsData = window.clientsData;

// Global variables
let currentReport = null;
let currentStep = 0;
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
        
        // Set up client quick actions
        setupClientQuickActions();
        
        // Set up billing toggle
        setupBillingToggle();
        
        // Set up test screenshot URL functionality for Step 2
        setupTestScreenshotFunctionality();
        
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
        
        // Debug: Check external_images and hardware_status
        if (reportData.external_images) {
            try {
                const parsedExternalImages = JSON.parse(reportData.external_images);
                console.log('Parsed external_images:', parsedExternalImages);
                const testScreenshots = parsedExternalImages.filter(item => item.type === 'test_screenshot');
                console.log('Test screenshots found in external_images:', testScreenshots);
            } catch (error) {
                console.error('Error parsing external_images:', error);
            }
        }
        
        if (reportData.hardware_status) {
            try {
                const parsedHardwareStatus = JSON.parse(reportData.hardware_status);
                console.log('Parsed hardware_status:', parsedHardwareStatus);
            } catch (error) {
                console.error('Error parsing hardware_status:', error);
            }
        }
        
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
    
    console.log('Populating technical tests with report data:', report);
    
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
    
    // Populate test screenshots from external_images if available
    populateTestScreenshots(report);
}

/**
 * Create technical tests content with table format and test screenshots
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

        <!-- Test Screenshots Section -->
        <div class="row">
            <div class="col-12">
                <h4 class="mb-4" style="color: var(--primary-color);">
                    <i class="fas fa-images me-2"></i>صور نتائج الاختبارات
                </h4>
                <p class="text-muted mb-4">أضف صور نتائج الاختبارات المختلفة للجهاز</p>
            </div>
        </div>

        <div class="row">
            <!-- info Test -->
            <div class="col-lg-6 mb-4">
                <div class="card component-test-card mb-4" data-component="info">
                    <div class="card-header bg-success bg-opacity-10 d-flex justify-content-between align-items-center">
                        <h5 class="mb-0 text-success"><i class="fas fa-info-circle me-2"></i> تفاصيل اللابتوب</h5>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <label for="infoScreenshotUrl" class="form-label">رابط صورة نتيجة الاختبار</label>
                            <div class="input-group mb-2">
                                <input type="url" class="form-control test-screenshot-url" id="infoScreenshotUrl" placeholder="https://example.com/image.jpg" data-component="info">
                                <button type="button" class="btn btn-primary add-screenshot-url-btn" data-target="infoScreenshotUrl" data-component="info">
                                    <i class="fas fa-plus me-1"></i> إضافة
                                </button>
                            </div>
                            <small class="text-muted">أدخل رابط صورة صالح (jpg, jpeg, png, gif, webp)</small>
                            <div class="mt-2 screenshot-preview" id="infoScreenshotPreview"></div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- CPU Test -->
            <div class="col-lg-6 mb-4">
                <div class="card component-test-card mb-4" data-component="cpu">
                    <div class="card-header bg-light d-flex justify-content-between align-items-center">
                        <h5 class="mb-0"><i class="fas fa-microchip me-2"></i> اختبار البروسيسور</h5>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <label for="cpuScreenshotUrl" class="form-label">رابط صورة نتيجة الاختبار</label>
                            <div class="input-group mb-2">
                                <input type="url" class="form-control test-screenshot-url" id="cpuScreenshotUrl" placeholder="https://example.com/image.jpg" data-component="cpu">
                                <button type="button" class="btn btn-primary add-screenshot-url-btn" data-target="cpuScreenshotUrl" data-component="cpu">
                                    <i class="fas fa-plus me-1"></i> إضافة
                                </button>
                            </div>
                            <small class="text-muted">أدخل رابط صورة صالح (jpg, jpeg, png, gif, webp)</small>
                            <div class="mt-2 screenshot-preview" id="cpuScreenshotPreview"></div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- GPU Test (Optional) -->
            <div class="col-lg-6 mb-4">
                <div class="card component-test-card mb-4" data-component="gpu">
                    <div class="card-header bg-light d-flex justify-content-between align-items-center">
                        <h5 class="mb-0"><i class="fas fa-tv me-2"></i> اختبار كارت الشاشة</h5>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <label for="gpuScreenshotUrl" class="form-label">رابط صورة نتيجة الاختبار</label>
                            <div class="input-group mb-2">
                                <input type="url" class="form-control test-screenshot-url" id="gpuScreenshotUrl" placeholder="https://example.com/image.jpg" data-component="gpu">
                                <button type="button" class="btn btn-primary add-screenshot-url-btn" data-target="gpuScreenshotUrl" data-component="gpu">
                                    <i class="fas fa-plus me-1"></i> إضافة
                                </button>
                            </div>
                            <small class="text-muted">أدخل رابط صورة صالح (jpg, jpeg, png, gif, webp)</small>
                            <div class="mt-2 screenshot-preview" id="gpuScreenshotPreview"></div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Hard Drive Test -->
            <div class="col-lg-6 mb-4">
                <div class="card component-test-card mb-4" data-component="hdd">
                    <div class="card-header bg-light d-flex justify-content-between align-items-center">
                        <h5 class="mb-0"><i class="fas fa-hdd me-2"></i> اختبار القرص الصلب</h5>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <label for="hddScreenshotUrl" class="form-label">رابط صورة نتيجة الاختبار</label>
                            <div class="input-group mb-2">
                                <input type="url" class="form-control test-screenshot-url" id="hddScreenshotUrl" placeholder="https://example.com/image.jpg" data-component="hdd">
                                <button type="button" class="btn btn-primary add-screenshot-url-btn" data-target="hddScreenshotUrl" data-component="hdd">
                                    <i class="fas fa-plus me-1"></i> إضافة
                                </button>
                            </div>
                            <small class="text-muted">أدخل رابط صورة صالح (jpg, jpeg, png, gif, webp)</small>
                            <div class="mt-2 screenshot-preview" id="hddScreenshotPreview"></div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Keyboard Test -->
            <div class="col-lg-6 mb-4">
                <div class="card component-test-card mb-4" data-component="keyboard">
                    <div class="card-header bg-light d-flex justify-content-between align-items-center">
                        <h5 class="mb-0"><i class="fas fa-keyboard me-2"></i> اختبار لوحة المفاتيح</h5>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <label for="keyboardScreenshotUrl" class="form-label">رابط صورة نتيجة الاختبار</label>
                            <div class="input-group mb-2">
                                <input type="url" class="form-control test-screenshot-url" id="keyboardScreenshotUrl" placeholder="https://example.com/image.jpg" data-component="keyboard">
                                <button type="button" class="btn btn-primary add-screenshot-url-btn" data-target="keyboardScreenshotUrl" data-component="keyboard">
                                    <i class="fas fa-plus me-1"></i> إضافة
                                </button>
                            </div>
                            <small class="text-muted">أدخل رابط صورة صالح (jpg, jpeg, png, gif, webp)</small>
                            <div class="mt-2 screenshot-preview" id="keyboardScreenshotPreview"></div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Battery Test -->
            <div class="col-lg-6 mb-4">
                <div class="card component-test-card mb-4" data-component="battery">
                    <div class="card-header bg-light d-flex justify-content-between align-items-center">
                        <h5 class="mb-0"><i class="fas fa-battery-three-quarters me-2"></i> اختبار البطارية</h5>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <label for="batteryScreenshotUrl" class="form-label">رابط صورة نتيجة الاختبار</label>
                            <div class="input-group mb-2">
                                <input type="url" class="form-control test-screenshot-url" id="batteryScreenshotUrl" placeholder="https://example.com/image.jpg" data-component="battery">
                                <button type="button" class="btn btn-primary add-screenshot-url-btn" data-target="batteryScreenshotUrl" data-component="battery">
                                    <i class="fas fa-plus me-1"></i> إضافة
                                </button>
                            </div>
                            <small class="text-muted">أدخل رابط صورة صالح (jpg, jpeg, png, gif, webp)</small>
                            <div class="mt-2 screenshot-preview" id="batteryScreenshotPreview"></div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- DxDiag Test -->
            <div class="col-lg-6 mb-4">
                <div class="card component-test-card mb-4" data-component="dxdiag">
                    <div class="card-header bg-light d-flex justify-content-between align-items-center">
                        <h5 class="mb-0"><i class="fas fa-laptop me-2"></i> اختبار معلومات النظام (DxDiag)</h5>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <label for="dxdiagScreenshotUrl" class="form-label">رابط صورة نتيجة الاختبار</label>
                            <div class="input-group mb-2">
                                <input type="url" class="form-control test-screenshot-url" id="dxdiagScreenshotUrl" placeholder="https://example.com/image.jpg" data-component="dxdiag">
                                <button type="button" class="btn btn-primary add-screenshot-url-btn" data-target="dxdiagScreenshotUrl" data-component="dxdiag">
                                    <i class="fas fa-plus me-1"></i> إضافة
                                </button>
                            </div>
                            <small class="text-muted">أدخل رابط صورة صالح (jpg, jpeg, png, gif, webp)</small>
                            <div class="mt-2 screenshot-preview" id="dxdiagScreenshotPreview"></div>
                        </div>
                    </div>
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
 * Populate test screenshots from existing report data
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
    
    console.log('Parsed external images:', externalImages);
    
    if (!Array.isArray(externalImages)) {
        console.warn('External images is not an array:', externalImages);
        return;
    }
    
    // Filter test screenshots from external images
    const testScreenshots = externalImages.filter(item => item.type === 'test_screenshot');
    
    console.log('Found test screenshots:', testScreenshots);
    
    // Also check if there are any images that might be test screenshots but stored differently
    const allImages = externalImages.filter(item => item.type === 'image');
    console.log('All images in external_images:', allImages);
    
    // Add a small delay to ensure DOM elements are created
    setTimeout(() => {
        // Check if preview containers exist
        const components = ['info', 'cpu', 'gpu', 'hdd', 'keyboard', 'battery', 'dxdiag'];
        components.forEach(component => {
            const previewContainer = document.getElementById(`${component}ScreenshotPreview`);
            console.log(`Preview container for ${component}:`, previewContainer);
        });
        
        // Populate each test screenshot
        testScreenshots.forEach(screenshot => {
            const component = screenshot.component;
            const url = screenshot.url;
            
            console.log(`Adding test screenshot for component ${component}:`, url);
            
            if (component && url) {
                // Check if the preview container exists
                const previewContainer = document.getElementById(`${component}ScreenshotPreview`);
                if (!previewContainer) {
                    console.error(`Preview container for ${component} not found!`);
                    return;
                }
                
                // Add the screenshot preview
                const success = addTestScreenshotPreview(url, component);
                if (success) {
                    console.log(`Successfully added test screenshot for ${component}`);
                } else {
                    console.error(`Failed to add test screenshot for ${component}`);
                }
            }
        });
        
        // If no test screenshots found, try to populate from hardware_status if it contains screenshot data
        if (testScreenshots.length === 0) {
            console.log('No test screenshots found in external_images, checking hardware_status...');
            try {
                if (report.hardware_status) {
                    const hardwareStatus = JSON.parse(report.hardware_status);
                    console.log('Hardware status for screenshot check:', hardwareStatus);
                    
                    // Look for any components that might have screenshot URLs
                    hardwareStatus.forEach(item => {
                        if (item.screenshots && Array.isArray(item.screenshots)) {
                            console.log(`Found screenshots in hardware component ${item.componentName}:`, item.screenshots);
                            item.screenshots.forEach(screenshotUrl => {
                                // Try to determine the component from the hardware status
                                const component = item.componentName;
                                if (component && screenshotUrl) {
                                    console.log(`Adding screenshot from hardware status for ${component}:`, screenshotUrl);
                                    addTestScreenshotPreview(screenshotUrl, component);
                                }
                            });
                        }
                    });
                }
            } catch (error) {
                console.error('Error checking hardware_status for screenshots:', error);
            }
        }
    }, 200); // Increased delay to ensure DOM is ready
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
 * Show a toast notification
 * @param {string} message - The message to display
 * @param {string} type - The notification type (success, info, warning, error)
 */
function showToast(message, type = 'info') {
    // Check if toast container exists, create if not
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toastId = 'toast-' + Date.now();
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.id = toastId;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    // Set toast color based on type
    let bgClass = 'bg-light';
    let iconClass = 'fas fa-info-circle text-info';
    
    switch(type) {
        case 'success':
            bgClass = 'bg-success text-white';
            iconClass = 'fas fa-check-circle';
            break;
        case 'warning':
            bgClass = 'bg-warning';
            iconClass = 'fas fa-exclamation-triangle';
            break;
        case 'error':
        case 'danger':
            bgClass = 'bg-danger text-white';
            iconClass = 'fas fa-times-circle';
            break;
    }
    
    // Create toast content
    toast.innerHTML = `
        <div class="toast-header ${bgClass}">
            <i class="${iconClass} me-2"></i>
            <strong class="me-auto">نظام لاباك</strong>
            <small>الآن</small>
            <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="إغلاق"></button>
        </div>
        <div class="toast-body">
            ${message}
        </div>
    `;
    
    // Add toast to container
    toastContainer.appendChild(toast);
    
    // Initialize and show toast
    const bsToast = new bootstrap.Toast(toast, { delay: 3000 });
    bsToast.show();
    
    // Remove toast after it's hidden
    toast.addEventListener('hidden.bs.toast', function() {
        toast.remove();
    });
}

/**
 * Save a new client to the database with enhanced error handling and validation
 * @returns {Promise<Object|null>} The saved client object or null if operation failed
 */
async function saveNewClient() {
    // Get form elements
    const saveBtn = document.getElementById('saveClientBtn');
    const clientNameInput = document.getElementById('clientName');
    const clientPhoneInput = document.getElementById('clientPhone');
    const clientEmailInput = document.getElementById('clientEmail');
    const clientAddressInput = document.getElementById('clientAddress');
    const clientOrderCodeInput = document.getElementById('clientOrderCode');
    const statusInputs = document.querySelectorAll('input[name="clientStatus"]');
    const formFeedback = document.getElementById('clientFormFeedback') || createFeedbackElement();
    
    // Clear previous validation states
    [clientNameInput, clientPhoneInput, clientEmailInput, clientOrderCodeInput].forEach(input => {
        if (input) {
            input.classList.remove('is-invalid');
            const feedbackEl = input.nextElementSibling;
            if (feedbackEl && feedbackEl.classList.contains('invalid-feedback')) {
                feedbackEl.textContent = '';
            }
        }
    });
    
    try {
        // Get form values
        const clientName = clientNameInput?.value.trim() || '';
        const clientPhone = clientPhoneInput?.value.trim() || '';
        const clientEmail = clientEmailInput?.value.trim() || '';
        const clientAddress = clientAddressInput?.value.trim() || '';
        const clientOrderCode = clientOrderCodeInput?.value.trim() || '';
        const clientStatus = Array.from(statusInputs).find(input => input.checked)?.value || 'active';
        
        // Validate required fields
        let isValid = true;
        let focusSet = false;
        
        // Validate name
        if (!clientName) {
            markInvalid(clientNameInput, 'الرجاء إدخال اسم العميل');
            isValid = false;
            if (!focusSet) {
                clientNameInput.focus();
                focusSet = true;
            }
        }
        
        // Validate phone
        if (!clientPhone) {
            markInvalid(clientPhoneInput, 'الرجاء إدخال رقم الهاتف');
            isValid = false;
            if (!focusSet) {
                clientPhoneInput.focus();
                focusSet = true;
            }
        } else if (!/^\d{11}$/.test(clientPhone.replace(/[\s-]/g, ''))) {
            markInvalid(clientPhoneInput, 'الرجاء إدخال رقم هاتف صحيح (11 أرقام)');
            isValid = false;
            if (!focusSet) {
                clientPhoneInput.focus();
                focusSet = true;
            }
        }
        
        // Validate email (if provided)
        if (clientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
            markInvalid(clientEmailInput, 'الرجاء إدخال بريد إلكتروني صحيح (اختياري)');
            isValid = false;
            if (!focusSet) {
                clientEmailInput.focus();
                focusSet = true;
            }
        } else if (!clientEmail) {
            clientEmailInput.classList.remove('is-invalid');
            const feedbackEl = clientEmailInput.nextElementSibling;
            if (feedbackEl && feedbackEl.classList.contains('invalid-feedback')) {
                feedbackEl.textContent = '';
            }
        }
        
        // Validate order code
        if (!clientOrderCode) {
            markInvalid(clientOrderCodeInput, 'الرجاء إدخال رقم الطلب');
            isValid = false;
            if (!focusSet) {
                clientOrderCodeInput.focus();
                focusSet = true;
            }
        } else if (!clientOrderCode.startsWith('LPK')) {
            markInvalid(clientOrderCodeInput, 'يجب أن يبدأ رقم الطلب بـ LPK');
            isValid = false;
            if (!focusSet) {
                clientOrderCodeInput.focus();
                focusSet = true;
            }
        } else if (clientOrderCode.length < 4) { // LPK + at least 1 digit
            markInvalid(clientOrderCodeInput, 'يجب أن يحتوي رقم الطلب على أرقام بعد LPK');
            isValid = false;
            if (!focusSet) {
                clientOrderCodeInput.focus();
                focusSet = true;
            }
        }
        
        if (!isValid) {
            showFeedback(formFeedback, 'الرجاء تصحيح الأخطاء في النموذج', 'danger');
            return null;
        }
        
        // Check if client with same phone already exists
        const existingClient = clientsData.find(client => client.phone === clientPhone);
        if (existingClient) {
            const confirmUpdate = confirm('يوجد عميل بنفس رقم الهاتف. هل تريد تحديث بياناته؟');
            if (!confirmUpdate) {
                return null;
            }
        }
        
        // Show loading state
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> جاري الحفظ...';
        }
        
        // Prepare client data
        const clientData = {
            name: clientName,
            phone: clientPhone,
            email: clientEmail || null,
            address: clientAddress || null,
            orderCode: clientOrderCode,
            status: clientStatus,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // If client exists, update it, otherwise create new
        let response;
        let operationSuccess = false;
        let errorMessage = '';
        
        // Check network status
        const isOnline = navigator.onLine;
        
        if (isOnline) {
            try {
                // Set timeout for API request
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('API request timeout')), 5000);
                });
                
                if (existingClient) {
                    if (typeof apiService !== 'undefined' && typeof apiService.updateClient === 'function') {
                        console.log(`Attempting to update client ID ${existingClient.id}...`);
                        
                        // Race between API request and timeout
                        response = await Promise.race([
                            apiService.updateClient(existingClient.id, clientData),
                            timeoutPromise
                        ]);
                        
                        if (response && response.id) {
                            console.log(`Successfully updated client ID ${response.id}`);
                            operationSuccess = true;
                        } else {
                            throw new Error('API returned invalid response');
                        }
                    } else {
                        throw new Error('API service not available');
                    }
                } else {
                    if (typeof apiService !== 'undefined' && typeof apiService.createClient === 'function') {
                        console.log('Attempting to create new client...');
                        
                        // Race between API request and timeout
                        response = await Promise.race([
                            apiService.createClient(clientData),
                            timeoutPromise
                        ]);
                        
                        if (response && response.id) {
                            console.log(`Successfully created client ID ${response.id}`);
                            operationSuccess = true;
                        } else {
                            throw new Error('API returned invalid response');
                        }
                    } else {
                        throw new Error('API service not available');
                    }
                }
            } catch (apiError) {
                console.warn(`API error: ${apiError.message}. Using local data instead.`);
                errorMessage = apiError.message;
                // Continue with local data update
            }
        } else {
            console.log('Device is offline. Using local data only.');
            errorMessage = 'الجهاز غير متصل بالإنترنت. سيتم حفظ البيانات محلياً.';
        }
        
        // If API failed, use local data
        if (!operationSuccess) {
            if (existingClient) {
                // Update existing client in local data
                response = { ...existingClient, ...clientData, id: existingClient.id };
                console.log(`Updated client ID ${response.id} in local data`);
            } else {
                // Create new client with generated ID
                const maxId = clientsData.reduce((max, c) => Math.max(max, c.id || 0), 0);
                response = { ...clientData, id: maxId + 1 };
                console.log(`Created client ID ${response.id} in local data`);
            }
        }
        
        // Update local data
        if (existingClient) {
            // Update existing client in the array
            const index = clientsData.findIndex(c => c.id === existingClient.id);
            if (index !== -1) {
                clientsData[index] = { ...clientsData[index], ...clientData, id: existingClient.id };
            }
        } else {
            // Add new client to the array
            clientsData.push(response);
        }
        
        // Update localStorage cache
        localStorage.setItem('lpk_clients', JSON.stringify(clientsData));
        localStorage.setItem('lpk_clients_timestamp', Date.now().toString());
        
        // Update the search input and select the new/updated client
        const clientSearchInput = document.getElementById('clientSearchInput');
        if (clientSearchInput) {
            // Select the new/updated client
            const client_id = existingClient ? existingClient.id : response.id;
            const selectedClient = clientsData.find(client => client.id == client_id);
            
            if (selectedClient) {
                // Update search input with client name
                clientSearchInput.value = selectedClient.name;
                
                // Update global client details
                window.globalClientDetails = {
                    client_id: selectedClient.id,
                    clientName: selectedClient.name || '',
                    clientPhone: selectedClient.phone || '',
                    clientEmail: selectedClient.email || '',
                    clientAddress: selectedClient.address || ''
                };
                
                // Update client info display
                updateClientInfoDisplay(selectedClient);
            }
        }
        
        // Hide the modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('addClientModal'));
        if (modal) {
            modal.hide();
        }
        
        // Reset the form
        const addClientForm = document.getElementById('addClientForm');
        if (addClientForm) {
            addClientForm.reset();
        }
        
        // Show success message with warning if offline
        if (operationSuccess) {
            showFeedback(formFeedback, existingClient ? 
                'تم تحديث بيانات العميل بنجاح' : 
                'تم إضافة العميل بنجاح', 
                'success');
        } else {
            showFeedback(formFeedback, (existingClient ? 
                'تم تحديث بيانات العميل محلياً' : 
                'تم إضافة العميل محلياً') + 
                (errorMessage ? `: ${errorMessage}` : ''), 
                'warning');
        }
        
        return response;
        
    } catch (error) {
        console.error('Error saving client:', error);
        showFeedback(formFeedback, `حدث خطأ أثناء حفظ بيانات العميل: ${error.message}`, 'danger');
        return null;
    } finally {
        // Reset button state
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fas fa-save me-2"></i> حفظ العميل';
        }
    }
}

/**
 * Mark a form input as invalid
 * @param {HTMLElement} input - The input element
 * @param {string} message - The error message
 */
function markInvalid(input, message) {
    if (!input) return;
    
    input.classList.add('is-invalid');
    
    // Check if feedback element already exists
    let feedbackEl = input.nextElementSibling;
    if (!feedbackEl || !feedbackEl.classList.contains('invalid-feedback')) {
        feedbackEl = document.createElement('div');
        feedbackEl.className = 'invalid-feedback';
        input.parentNode.insertBefore(feedbackEl, input.nextSibling);
    }
    
    feedbackEl.textContent = message;
}

/**
 * Show feedback message
 * @param {HTMLElement} element - The feedback element
 * @param {string} message - The message to display
 * @param {string} type - The message type (success, danger, warning, info)
 */
function showFeedback(element, message, type = 'info') {
    if (!element) return;
    
    // Remove previous alert classes
    element.className = 'alert mt-3';
    element.classList.add(`alert-${type}`);
    element.textContent = message;
    element.style.display = 'block';
    
    // Auto-hide success messages after 3 seconds
    if (type === 'success') {
        setTimeout(() => {
            element.style.display = 'none';
        }, 3000);
    }
}

/**
 * Create feedback element for client form
 * @returns {HTMLElement} The created feedback element
 */
function createFeedbackElement() {
    const formContainer = document.querySelector('#addClientModal .modal-body');
    if (!formContainer) return null;
    
    const feedbackEl = document.createElement('div');
    feedbackEl.id = 'clientFormFeedback';
    feedbackEl.className = 'alert mt-3';
    feedbackEl.style.display = 'none';
    formContainer.appendChild(feedbackEl);
    
    return feedbackEl;
}

/**
 * Generate a unique invoice number
 * @returns {string} The generated invoice number
 */
function generateInvoiceNumber() {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(1000 + Math.random() * 9000);
    
    return `INV-${year}${month}${day}-${random}`;
}

/**
 * Set up client quick actions
 */
function setupClientQuickActions() {
    // Add event listener for the Add Client modal events
    const addClientModal = document.getElementById('addClientModal');
    if (addClientModal) {
        // Reset form and update UI when modal is hidden
        addClientModal.addEventListener('hidden.bs.modal', function() {
            // Reset the form
            const addClientForm = document.getElementById('addClientForm');
            if (addClientForm) {
                addClientForm.reset();
            }
            
            // Reset the modal title
            const modalTitle = addClientModal.querySelector('.modal-title');
            if (modalTitle) {
                modalTitle.innerHTML = '<i class="fas fa-user-plus me-2"></i> إضافة عميل جديد';
            }
            
            // Reset the save button
            const saveButton = document.getElementById('saveClientBtn');
            if (saveButton) {
                saveButton.innerHTML = '<i class="fas fa-save me-2"></i> حفظ العميل';
            }
            
            // Remove client ID if it exists
            const client_idField = document.getElementById('client_id');
            if (client_idField) {
                client_idField.remove();
            }
            
            // Clear validation states
            const invalidFields = addClientForm.querySelectorAll('.is-invalid');
            invalidFields.forEach(field => {
                field.classList.remove('is-invalid');
            });
            
            // Hide any feedback messages
            const feedback = document.getElementById('clientFormFeedback');
            if (feedback) {
                feedback.style.display = 'none';
            }
        });
        
        // Set up event listeners for modal shown event
        addClientModal.addEventListener('shown.bs.modal', function() {
            // Focus on the first input field
            const firstInput = addClientModal.querySelector('input[type="text"]');
            if (firstInput) {
                firstInput.focus();
            }
        });
    }
    
    // Add event listener for the edit selected client button
    const editSelectedClientBtn = document.getElementById('editSelectedClient');
    if (editSelectedClientBtn) {
        editSelectedClientBtn.addEventListener('click', function() {
            // Get client from global client details
            if (window.globalClientDetails && window.globalClientDetails.client_id) {
                const selectedClient = clientsData.find(client => client.id == window.globalClientDetails.client_id);
                if (selectedClient) {
                    openEditClientModal(selectedClient);
                }
            }
        });
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
    
    // Add Enter key press event for test screenshot URL inputs with improved reliability
    const testScreenshotInputs = document.querySelectorAll('.test-screenshot-url');
    testScreenshotInputs.forEach(input => {
        // Use both keypress and keydown to ensure cross-browser compatibility
        ['keypress', 'keydown'].forEach(eventType => {
            input.addEventListener(eventType, function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault(); // Prevent form submission
                    e.stopPropagation(); // Stop event bubbling
                    
                    // Get the component name from data attribute
                    const component = this.getAttribute('data-component');
                    
                    // Find the corresponding add button
                    const button = document.querySelector(`.add-screenshot-url-btn[data-component="${component}"]`);
                    if (button) {
                        console.log(`Enter key pressed in ${component} input - triggering add button`);
                        button.click();
                    }
                }
            });
        });
    });
    
    // Ensure all inputs with URL type also have Enter key functionality
    document.querySelectorAll('input[type="url"]').forEach(input => {
        if (!input.classList.contains('test-screenshot-url')) { // Avoid duplicate handlers
            ['keypress', 'keydown'].forEach(eventType => {
                input.addEventListener(eventType, function(e) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        // Find the closest button that might be the add button
                        const parentGroup = this.closest('.input-group');
                        if (parentGroup) {
                            const addBtn = parentGroup.querySelector('button');
                            if (addBtn) {
                                console.log('Enter key pressed in URL input - triggering closest button');
                                addBtn.click();
                            }
                        }
                    }
                });
            });
        }
    });
}

/**
 * Open edit client modal with client data
 * @param {Object} client - The client object to edit
 */
function openEditClientModal(client) {
    if (!client) return;
    
    // Get the modal element
    const modal = document.getElementById('addClientModal');
    if (!modal) return;
    
    // Update modal title to indicate editing
    const modalTitle = modal.querySelector('.modal-title');
    if (modalTitle) {
        modalTitle.innerHTML = `<i class="fas fa-edit me-2"></i> تعديل بيانات العميل: ${client.name}`;
    }
    
    // Fill form fields with client data
    document.getElementById('clientName').value = client.name || '';
    document.getElementById('clientPhone').value = client.phone || '';
    document.getElementById('clientEmail').value = client.email || '';
    
    if (document.getElementById('clientAddress')) {
        document.getElementById('clientAddress').value = client.address || '';
    }
    
    document.getElementById('clientOrderCode').value = client.orderCode || '';
    
    // Set client status radio button
    const statusRadios = document.querySelectorAll('input[name="clientStatus"]');
    statusRadios.forEach(radio => {
        if (radio.value === client.status) {
            radio.checked = true;
        }
    });
    
    // Store client ID in a hidden field or data attribute for reference
    const client_idField = document.getElementById('client_id');
    if (client_idField) {
        client_idField.value = client.id;
    } else {
        // If no hidden field exists, create one
        const hiddenField = document.createElement('input');
        hiddenField.type = 'hidden';
        hiddenField.id = 'client_id';
        hiddenField.name = 'client_id';
        hiddenField.value = client.id;
        document.getElementById('addClientForm').appendChild(hiddenField);
    }
    
    // Update save button text
    const saveButton = document.getElementById('saveClientBtn');
    if (saveButton) {
        saveButton.innerHTML = '<i class="fas fa-save me-2"></i> حفظ التغييرات';
    }
    
    // Show the modal
    const bootstrapModal = new bootstrap.Modal(modal);
    bootstrapModal.show();
} 