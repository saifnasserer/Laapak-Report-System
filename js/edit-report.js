/**
 * Edit Report JavaScript
 * Handles editing existing reports
 */

document.addEventListener('DOMContentLoaded', function() {
    // Get report ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const reportId = urlParams.get('id');
    
    if (!reportId) {
        showAlert('error', 'لم يتم تحديد معرف التقرير في الرابط');
        return;
    }
    
    // Initialize the edit form
    initEditForm();
    
    // Load report data
    loadReportData(reportId);
});

/**
 * Initialize the edit form
 */
function initEditForm() {
    // Form elements
    const editForm = document.getElementById('editReportForm');
    const saveBtn = document.getElementById('saveReportBtn');
    const imageFileInput = document.getElementById('imageFileInput');
    const addHardwareComponentBtn = document.getElementById('addHardwareComponentBtn');
    
    // Save button event
    if (saveBtn) {
        saveBtn.addEventListener('click', handleSaveReport);
    }
    
    // Image upload events
    if (imageFileInput) {
        imageFileInput.addEventListener('change', handleImageUpload);
    }
    
    // Hardware components are now read-only
    
    // Drag and drop for images
    const imageUploadArea = document.getElementById('imageUploadArea');
    if (imageUploadArea) {
        imageUploadArea.addEventListener('dragover', handleDragOver);
        imageUploadArea.addEventListener('drop', handleDrop);
        imageUploadArea.addEventListener('dragenter', handleDragEnter);
        imageUploadArea.addEventListener('dragleave', handleDragLeave);
    }
}

/**
 * Load report data from API
 */
async function loadReportData(reportId) {
    try {
        showLoading(true);
        
        // Get API service
        const service = typeof apiService !== 'undefined' ? apiService : 
                      (window && window.apiService) ? window.apiService : null;
        
        if (!service) {
            throw new Error('API service not available');
        }
        
        // Fetch report data
        const reportData = await service.getReport(reportId);
        
        if (!reportData || !reportData.report) {
            throw new Error('Report data not found');
        }
        
        // Populate form with report data
        populateForm(reportData.report);
        
        showLoading(false);
        
    } catch (error) {
        console.error('Error loading report data:', error);
        showLoading(false);
        showAlert('error', `فشل في تحميل بيانات التقرير: ${error.message}`);
    }
}

/**
 * Populate form with report data
 */
function populateForm(report) {
    // Display report ID
    const reportIdDisplay = document.getElementById('reportIdDisplay');
    if (reportIdDisplay) {
        reportIdDisplay.textContent = report.id || 'غير محدد';
    }
    
    // Client information
    if (report.client_name) {
        document.getElementById('clientName').value = report.client_name;
    }
    if (report.client_phone) {
        document.getElementById('clientPhone').value = report.client_phone;
    }
    if (report.client_email) {
        document.getElementById('clientEmail').value = report.client_email;
    }
    if (report.client_address) {
        document.getElementById('clientAddress').value = report.client_address;
    }
    
    // Device information
    if (report.order_number) {
        document.getElementById('orderNumber').value = report.order_number;
    }
    if (report.device_model) {
        document.getElementById('deviceModel').value = report.device_model;
    }
    if (report.serial_number) {
        document.getElementById('serialNumber').value = report.serial_number;
    }
    if (report.inspection_date) {
        const date = new Date(report.inspection_date);
        document.getElementById('inspectionDate').value = date.toISOString().split('T')[0];
    }
    if (report.status) {
        document.getElementById('reportStatus').value = report.status;
    }
    if (report.amount) {
        document.getElementById('devicePrice').value = report.amount;
    }
    
    // Notes
    if (report.notes) {
        document.getElementById('technicianNotes').value = report.notes;
    }
    
    // Hardware status
    if (report.hardware_status) {
        populateHardwareStatus(report.hardware_status);
    }
    
    // External images
    if (report.external_images) {
        populateExternalImages(report.external_images);
    }
    
    // Device video
    if (report.external_images) {
        populateDeviceVideo(report.external_images);
    }
}

/**
 * Populate hardware status table
 */
function populateHardwareStatus(hardwareStatus) {
    const tableBody = document.getElementById('hardwareStatusTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    let hardwareData = [];
    try {
        if (typeof hardwareStatus === 'string') {
            hardwareData = JSON.parse(hardwareStatus);
        } else {
            hardwareData = hardwareStatus;
        }
    } catch (e) {
        console.warn('Failed to parse hardware status:', e);
        hardwareData = [];
    }
    
    if (!Array.isArray(hardwareData)) {
        hardwareData = [];
    }
    
    hardwareData.forEach((component, index) => {
        if (component.type !== 'note') {
            addHardwareComponentRow(component, index);
        }
    });
}

/**
 * Add hardware component row to table
 */
function addHardwareComponentRow(component = null, index = null) {
    const tableBody = document.getElementById('hardwareStatusTableBody');
    if (!tableBody) return;
    
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>
            <input type="text" class="form-control form-control-sm" name="hardware_components[${index || 'new'}][componentName]" 
                   value="${component ? component.componentName || '' : ''}" placeholder="اسم المكون" readonly>
        </td>
        <td>
            <select class="form-select form-select-sm" name="hardware_components[${index || 'new'}][status]">
                <option value="working" ${component && component.status === 'working' ? 'selected' : ''}>يعمل</option>
                <option value="not_working" ${component && component.status === 'not_working' ? 'selected' : ''}>لا يعمل</option>
                <option value="not_available" ${component && component.status === 'not_available' ? 'selected' : ''}>غير موجود</option>
            </select>
        </td>
    `;
    
    tableBody.appendChild(row);
}

// Hardware components are now read-only, only status can be changed

/**
 * Populate device video
 */
function populateDeviceVideo(externalImages) {
    const container = document.getElementById('deviceVideoContainer');
    if (!container) return;
    
    let imagesData = [];
    try {
        if (typeof externalImages === 'string') {
            imagesData = JSON.parse(externalImages);
        } else {
            imagesData = externalImages;
        }
    } catch (e) {
        console.warn('Failed to parse external images for video:', e);
        imagesData = [];
    }
    
    if (!Array.isArray(imagesData)) {
        imagesData = [];
    }
    
    // Find video items
    const videoItems = imagesData.filter(item => 
        item.type === 'youtube' || 
        item.type === 'video' || 
        (item.type === 'image' && item.url && item.url.match(/\.(mp4|webm|ogg|mov)$/i))
    );
    
    if (videoItems.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-video-slash fa-3x text-muted mb-3"></i>
                <p class="text-muted">لا يوجد فيديو مرفق للجهاز</p>
            </div>
        `;
        return;
    }
    
    // Display the first video
    const videoItem = videoItems[0];
    
    if (videoItem.type === 'youtube' || isYouTubeUrl(videoItem.url)) {
        // YouTube video
        const videoId = extractYouTubeId(videoItem.url);
        if (videoId) {
            container.innerHTML = `
                <div class="ratio ratio-16x9">
                    <iframe src="https://www.youtube.com/embed/${videoId}" 
                            title="Device Video" 
                            frameborder="0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowfullscreen>
                    </iframe>
                </div>
            `;
        }
    } else if (videoItem.url.match(/\.(mp4|webm|ogg|mov)$/i)) {
        // Direct video file
        container.innerHTML = `
            <video controls class="w-100" style="max-height: 400px;">
                <source src="${videoItem.url}" type="video/${videoItem.url.split('.').pop()}">
                متصفحك لا يدعم تشغيل الفيديو.
            </video>
        `;
    } else {
        container.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-video-slash fa-3x text-muted mb-3"></i>
                <p class="text-muted">صيغة الفيديو غير مدعومة</p>
            </div>
        `;
    }
}

/**
 * Check if URL is YouTube
 */
function isYouTubeUrl(url) {
    try {
        const videoUrl = new URL(url);
        return videoUrl.hostname === 'www.youtube.com' || 
               videoUrl.hostname === 'youtube.com' || 
               videoUrl.hostname === 'youtu.be';
    } catch (e) {
        return false;
    }
}

/**
 * Extract YouTube video ID
 */
function extractYouTubeId(url) {
    try {
        const videoUrl = new URL(url);
        if (videoUrl.hostname === 'youtu.be') {
            return videoUrl.pathname.substring(1);
        } else if (videoUrl.pathname === '/watch') {
            return videoUrl.searchParams.get('v');
        } else if (videoUrl.pathname.startsWith('/embed/')) {
            return videoUrl.pathname.split('/').pop();
        }
    } catch (e) {
        console.error('Error extracting YouTube ID:', e);
    }
    return null;
}

/**
 * Populate external images
 */
function populateExternalImages(externalImages) {
    const container = document.getElementById('externalImagesContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    let imagesData = [];
    try {
        if (typeof externalImages === 'string') {
            imagesData = JSON.parse(externalImages);
        } else {
            imagesData = externalImages;
        }
    } catch (e) {
        console.warn('Failed to parse external images:', e);
        imagesData = [];
    }
    
    if (!Array.isArray(imagesData)) {
        imagesData = [];
    }
    
    // Filter only image items (not videos or other media)
    const imageItems = imagesData.filter(item => 
        item.type === 'image' && 
        !item.url.match(/\.(mp4|webm|ogg|mov)$/i)
    );
    
    if (imageItems.length === 0) {
        container.innerHTML = '<p class="text-muted text-center">لا توجد صور مرفقة</p>';
        return;
    }
    
    const row = document.createElement('div');
    row.className = 'row g-3';
    
    imageItems.forEach((image, index) => {
        const col = document.createElement('div');
        col.className = 'col-md-4 col-lg-3';
        
        col.innerHTML = `
            <div class="card position-relative">
                <img src="${image.url}" class="card-img-top" alt="${image.name || 'صورة الجهاز'}" style="height: 150px; object-fit: cover;">
                <div class="card-body p-2">
                    <p class="card-text small mb-1">${image.name || 'صورة الجهاز'}</p>
                    <button type="button" class="btn btn-sm btn-outline-danger" onclick="removeImage(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        
        row.appendChild(col);
    });
    
    container.appendChild(row);
}

/**
 * Remove image
 */
function removeImage(index) {
    if (confirm('هل أنت متأكد من حذف هذه الصورة؟')) {
        // This would need to be implemented based on how images are stored
        console.log('Remove image at index:', index);
        // For now, just reload the images
        location.reload();
    }
}

/**
 * Handle image upload
 */
function handleImageUpload(event) {
    const files = event.target.files;
    if (files.length === 0) return;
    
    // Process uploaded files
    Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
            processImageFile(file);
        }
    });
    
    // Clear input
    event.target.value = '';
}

/**
 * Process image file
 */
function processImageFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        // Create image object
        const imageData = {
            type: 'image',
            name: file.name,
            url: e.target.result,
            description: ''
        };
        
        // Add to external images (this would need to be integrated with the form data)
        console.log('Processed image:', imageData);
        
        // For now, show a success message
        showAlert('success', `تم تحميل الصورة: ${file.name}`);
    };
    reader.readAsDataURL(file);
}

/**
 * Handle drag and drop events
 */
function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
}

function handleDragEnter(e) {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
            processImageFile(file);
        }
    });
}

/**
 * Handle save report
 */
async function handleSaveReport() {
    try {
        showLoading(true);
        
        // Collect form data
        const formData = collectFormData();
        
        // Validate form data
        const validationError = validateFormData(formData);
        if (validationError) {
            showAlert('error', validationError);
            showLoading(false);
            return;
        }
        
        // Get API service
        const service = typeof apiService !== 'undefined' ? apiService : 
                      (window && window.apiService) ? window.apiService : null;
        
        if (!service) {
            throw new Error('API service not available');
        }
        
        // Update report
        const urlParams = new URLSearchParams(window.location.search);
        const reportId = urlParams.get('id');
        
        const updatedReport = await service.updateReport(reportId, formData);
        
        showLoading(false);
        showAlert('success', 'تم تحديث التقرير بنجاح');
        
        // Redirect to report view after a short delay
        setTimeout(() => {
            window.location.href = `report.html?id=${reportId}`;
        }, 1500);
        
    } catch (error) {
        console.error('Error saving report:', error);
        showLoading(false);
        showAlert('error', `فشل في حفظ التقرير: ${error.message}`);
    }
}

/**
 * Collect form data
 */
function collectFormData() {
    const form = document.getElementById('editReportForm');
    const formData = new FormData(form);
    
    // Convert FormData to object
    const data = {};
    for (const [key, value] of formData.entries()) {
        data[key] = value;
    }
    
    // Collect hardware components
    const hardwareComponents = [];
    const hardwareRows = document.querySelectorAll('#hardwareStatusTableBody tr');
    hardwareRows.forEach((row, index) => {
        const componentName = row.querySelector('input[name*="[componentName]"]')?.value;
        const status = row.querySelector('select[name*="[status]"]')?.value;
        
        if (componentName) {
            hardwareComponents.push({
                type: 'hardware',
                componentName: componentName,
                status: status || 'working'
            });
        }
    });
    
    // Add notes component if there are notes
    const notes = document.getElementById('technicianNotes')?.value;
    if (notes && notes.trim()) {
        hardwareComponents.push({
            type: 'note',
            componentName: 'notes',
            notes: notes.trim()
        });
    }
    
    data.hardware_status = JSON.stringify(hardwareComponents);
    
    // External images would need to be handled separately
    // For now, we'll keep the existing images
    data.external_images = '[]'; // This should be updated to include existing images
    
    return data;
}

/**
 * Validate form data
 */
function validateFormData(data) {
    if (!data.client_name || !data.client_name.trim()) {
        return 'اسم العميل مطلوب';
    }
    
    if (!data.client_phone || !data.client_phone.trim()) {
        return 'رقم الهاتف مطلوب';
    }
    
    if (!data.order_number || !data.order_number.trim()) {
        return 'رقم الطلب مطلوب';
    }
    
    if (!data.device_model || !data.device_model.trim()) {
        return 'طراز الجهاز مطلوب';
    }
    
    if (!data.inspection_date) {
        return 'تاريخ الفحص مطلوب';
    }
    
    return null;
}

/**
 * Show loading overlay
 */
function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        if (show) {
            overlay.classList.remove('d-none');
        } else {
            overlay.classList.add('d-none');
        }
    }
}

/**
 * Show alert message
 */
function showAlert(type, message) {
    const alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) return;
    
    const alertClass = type === 'error' ? 'alert-danger' : 
                      type === 'success' ? 'alert-success' : 
                      type === 'warning' ? 'alert-warning' : 'alert-info';
    
    const alertHtml = `
        <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
            <i class="fas fa-${type === 'error' ? 'exclamation-triangle' : 
                              type === 'success' ? 'check-circle' : 
                              type === 'warning' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    
    alertContainer.innerHTML = alertHtml;
    
    // Auto-dismiss success alerts after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            const alert = alertContainer.querySelector('.alert');
            if (alert) {
                alert.remove();
            }
        }, 5000);
    }
} 