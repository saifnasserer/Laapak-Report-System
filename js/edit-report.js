/**
 * Edit Report JavaScript
 * Handles editing existing reports
 */

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
        return false ;
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
    imageCard.className = 'image-card col-md-4 col-sm-6';
    
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
    img.style.maxHeight = '200px';
    img.style.objectFit = 'cover';
    img.onerror = function() {
        this.onerror = null;
        this.src = 'img/image-error.png'; // Fallback image
        this.alt = 'Image failed to load';
    };
    
    const overlay = document.createElement('div');
    overlay.className = 'position-absolute top-0 end-0 p-2';
    
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

// Helper function to add test screenshot preview
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
    
    // Set up image URL functionality
    const addImageUrlBtn = document.getElementById('addImageUrlBtn');
    const imageUrlInput = document.getElementById('imageUrlInput');
    
    if (addImageUrlBtn && imageUrlInput) {
        // Add Enter key functionality to the image URL input
        imageUrlInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                addImageUrlBtn.click();
                console.log('Enter key pressed in external image input - triggering add button');
            }
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
        videoUrlInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                addVideoUrlBtn.click();
            }
        });
        
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
    }
    
    // Set up test screenshot URL functionality
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
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                const component = this.getAttribute('data-component');
                const button = document.querySelector(`.add-screenshot-url-btn[data-component="${component}"]`);
                if (button) {
                    console.log(`Enter key pressed in ${component} input - triggering add button`);
                    button.click();
                }
            }
        });
    });
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
        
        // Store original report data for preservation
        window.originalReportData = reportData.report;
        
        // Populate form with report data
        populateForm(reportData.report);
        
        // Update status field with automatic status
        updateStatusField();
        
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
    
    // Test screenshots
    if (report.external_images) {
        populateTestScreenshots(report.external_images);
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
 * Populate device video with URL badges and previews
 */
function populateDeviceVideo(externalImages) {
    const badgesContainer = document.getElementById('videoUrlBadges');
    const previewContainer = document.getElementById('videoPreviewContainer');
    
    if (!badgesContainer || !previewContainer) return;
    
    // Clear existing content
    badgesContainer.innerHTML = '';
    previewContainer.innerHTML = '';
    
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
    
    // Find video items (same logic as report-view.js)
    const videoItems = imagesData.filter(item => 
        item.type === 'youtube' || 
        item.type === 'video' || 
        (item.type === 'image' && item.url && 
         (item.url.endsWith('.mp4') || item.url.endsWith('.webm') || item.url.endsWith('.mov')))
    );
    
    if (videoItems.length === 0) {
        previewContainer.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-video-slash fa-3x text-muted mb-3"></i>
                <p class="text-muted">لا يوجد فيديو مرفق للجهاز</p>
            </div>
        `;
        return;
    }
    
    // Create badges and previews for each video
    videoItems.forEach(item => {
        const videoType = getVideoUrlType(item.url);
        
        // Create badge
        const badge = document.createElement('span');
        badge.className = 'badge bg-info text-dark me-1 mb-1';
        badge.setAttribute('data-url', item.url);
        badge.setAttribute('data-type', videoType);
        
        // Create a short display version of the URL
        const displayUrl = item.url.length > 30 ? item.url.substring(0, 27) + '...' : item.url;
        badge.innerHTML = `${displayUrl} <button type="button" class="btn-close btn-close-white ms-1" aria-label="Close"></button>`;
        
        // Add remove functionality
        const closeBtn = badge.querySelector('.btn-close');
        closeBtn.addEventListener('click', function() {
            badge.remove();
            
            // Also remove the video preview if it exists
            const videoPreviews = document.querySelectorAll(`#videoPreviewContainer .card[data-url="${item.url}"]`);
            videoPreviews.forEach(preview => preview.remove());
        });
        
        badgesContainer.appendChild(badge);
        
        // Create preview
        createVideoPreview(item.url, videoType);
    });
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
 * Populate external images with URL badges and previews
 */
function populateExternalImages(externalImages) {
    const badgesContainer = document.getElementById('imageUrlBadges');
    const previewContainer = document.getElementById('externalImagesPreview');
    
    if (!badgesContainer || !previewContainer) return;
    
    // Clear existing content
    badgesContainer.innerHTML = '';
    previewContainer.innerHTML = '';
    
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
    
    // Filter only image items (not videos or test screenshots)
    const imageItems = imagesData.filter(item => 
        item.type === 'image' && 
        !item.url.match(/\.(mp4|webm|ogg|mov)$/i) &&
        item.type !== 'test_screenshot' &&
        item.type !== 'youtube' &&
        item.type !== 'video'
    );
    
    if (imageItems.length === 0) {
        previewContainer.innerHTML = '<div class="col-12 text-center text-muted">لا توجد صور خارجية</div>';
        return;
    }
    
    // Create badges and previews for each image
    imageItems.forEach(item => {
        // Create badge
        const badge = document.createElement('span');
        badge.className = 'badge bg-primary me-1 mb-1';
        badge.setAttribute('data-url', item.url);
        
        // Create a short display version of the URL
        const displayUrl = item.url.length > 30 ? item.url.substring(0, 27) + '...' : item.url;
        badge.innerHTML = `${displayUrl} <button type="button" class="btn-close btn-close-white ms-1" aria-label="Close"></button>`;
        
        // Add remove functionality
        const closeBtn = badge.querySelector('.btn-close');
        closeBtn.addEventListener('click', function() {
            badge.remove();
            
            // Also remove the image preview if it exists
            const imagePreviews = document.querySelectorAll(`#externalImagesPreview .image-card img[src="${item.url}"]`);
            imagePreviews.forEach(preview => {
                const card = preview.closest('.image-card');
                if (card) card.remove();
            });
        });
        
        badgesContainer.appendChild(badge);
        
        // Create preview
        createImagePreview(item.url);
    });
}

// Image removal is now handled by removeNewImage function

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
        
        // Add to new images array
        if (!window.newImages) {
            window.newImages = [];
        }
        window.newImages.push(imageData);
        
        // Show success message
        showAlert('success', `تم تحميل الصورة: ${file.name}`);
        
        // Update the images display
        updateImagesDisplay();
    };
    reader.readAsDataURL(file);
}

/**
 * Update images display with both existing and new images
 */
function updateImagesDisplay() {
    const container = document.getElementById('externalImagesContainer');
    if (!container) return;
    
    // Get existing images from original data
    let existingImages = [];
    if (window.originalReportData && window.originalReportData.external_images) {
        try {
            const parsed = typeof window.originalReportData.external_images === 'string' ? 
                          JSON.parse(window.originalReportData.external_images) : 
                          window.originalReportData.external_images;
            existingImages = Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            console.warn('Failed to parse existing images:', e);
        }
    }
    
    // Filter existing images (same logic as report-view.js)
    const existingImageItems = existingImages.filter(item => {
        return (item.type === 'image' && !item.url.match(/\.(mp4|webm|ogg|mov)$/i)) && 
               item.type !== 'test_screenshot' && 
               item.type !== 'youtube' && 
               item.type !== 'video';
    });
    
    // Combine existing and new images
    const allImages = [...existingImageItems, ...(window.newImages || [])];
    
    if (allImages.length === 0) {
        container.innerHTML = '<p class="text-muted text-center">لا توجد صور مرفقة</p>';
        return;
    }
    
    const row = document.createElement('div');
    row.className = 'row g-3';
    
    allImages.forEach((image, index) => {
        const col = document.createElement('div');
        col.className = 'col-md-4 col-lg-3';
        
        const isNewImage = index >= existingImageItems.length;
        
        col.innerHTML = `
            <div class="card position-relative">
                <img src="${image.url}" class="card-img-top" alt="${image.name || 'صورة الجهاز'}" style="height: 150px; object-fit: cover;">
                <div class="card-body p-2">
                    <p class="card-text small mb-1">${image.name || 'صورة الجهاز'}</p>
                    ${isNewImage ? 
                        `<button type="button" class="btn btn-sm btn-outline-danger" onclick="removeNewImage(${index - existingImageItems.length})">
                            <i class="fas fa-trash"></i>
                        </button>` : 
                        `<span class="badge bg-secondary">موجود</span>`
                    }
                </div>
            </div>
        `;
        
        row.appendChild(col);
    });
    
    container.appendChild(row);
}

/**
 * Remove new image
 */
function removeNewImage(index) {
    if (confirm('هل أنت متأكد من حذف هذه الصورة؟')) {
        window.newImages.splice(index, 1);
        updateImagesDisplay();
    }
}

/**
 * Populate test screenshots with input fields for editing
 */
function populateTestScreenshots(externalImages) {
    let imagesData = [];
    try {
        if (typeof externalImages === 'string') {
            imagesData = JSON.parse(externalImages);
        } else {
            imagesData = externalImages;
        }
    } catch (e) {
        console.warn('Failed to parse external images for test screenshots:', e);
        imagesData = [];
    }

    const screenshotItems = imagesData.filter(item => item.type === 'test_screenshot');

    // Clear all preview containers first
    const components = ['info', 'cpu', 'gpu', 'hdd', 'keyboard', 'battery', 'dxdiag'];
    components.forEach(component => {
        const previewContainer = document.getElementById(`${component}ScreenshotPreview`);
        if (previewContainer) {
            previewContainer.innerHTML = '';
        }
    });

    // Populate each component's preview with existing screenshots
    screenshotItems.forEach((item) => {
        if (item.component && item.url) {
            const component = item.component.toLowerCase();
            const previewContainer = document.getElementById(`${component}ScreenshotPreview`);
            
            if (previewContainer) {
                // Add the screenshot to the preview
                addTestScreenshotPreview(item.url, component);
            }
        }
    });
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
    
    // Collect external images and videos from badges
    const externalImagesData = [];
    
    // Get image URLs from the badges
    const imageUrlBadges = document.querySelectorAll('#imageUrlBadges .badge');
    imageUrlBadges.forEach(badge => {
        const imageUrl = badge.getAttribute('data-url');
        if (imageUrl) {
            externalImagesData.push({
                type: 'image',
                url: imageUrl
            });
        }
    });
    
    // Get video URLs from the badges
    const videoUrlBadges = document.querySelectorAll('#videoUrlBadges .badge');
    videoUrlBadges.forEach(badge => {
        const videoUrl = badge.getAttribute('data-url');
        const videoType = badge.getAttribute('data-type') || 'video';
        if (videoUrl) {
            externalImagesData.push({
                type: videoType, // 'video', 'youtube', 'vimeo', etc.
                url: videoUrl
            });
        }
    });
    
    // Collect test screenshots from preview containers
    const components = ['info', 'cpu', 'gpu', 'hdd', 'keyboard', 'battery', 'dxdiag'];
    components.forEach(component => {
        const urls = getTestScreenshotUrls(component);
        urls.forEach(url => {
            externalImagesData.push({
                type: 'test_screenshot',
                component: component,
                url: url
            });
        });
    });
    
    data.external_images = JSON.stringify(externalImagesData);
    
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

/**
 * Automatically determine report status based on linked invoice payment status
 * @param {Object} reportData - The report data object
 * @returns {string} The appropriate status
 */
async function determineReportStatus(reportData) {
    try {
        // Check if report has a linked invoice
        if (typeof apiService !== 'undefined' && typeof apiService.getInvoiceByReportId === 'function') {
            const invoice = await apiService.getInvoiceByReportId(reportData.id);
            
            if (invoice && invoice.paymentStatus) {
                switch (invoice.paymentStatus) {
                    case 'paid':
                        return 'مكتمل'; // Completed
                    case 'partial':
                    case 'unpaid':
                        return 'في المخزن'; // In storage
                    default:
                        return 'في المخزن'; // Default to in storage
                }
            }
        }
        
        // If no invoice or API not available, check if billing is enabled
        if (reportData.billing_enabled) {
            return 'في المخزن'; // Has billing but no invoice found
        }
        
        return 'مكتمل'; // No billing, consider completed
    } catch (error) {
        console.warn('Error determining report status:', error);
        return 'في المخزن'; // Default to in storage on error
    }
}

/**
 * Update status field with automatic status and show current invoice info
 */
async function updateStatusField() {
    const statusSelect = document.getElementById('reportStatus');
    if (!statusSelect) return;
    
    try {
        // Get current report data
        const reportData = window.originalReportData;
        if (!reportData) return;
        
        // Determine automatic status
        const automaticStatus = await determineReportStatus(reportData);
        
        // Update status select with automatic status
        statusSelect.value = automaticStatus;
        
        // Add visual indicator that this is an automatic status
        const statusContainer = statusSelect.parentElement;
        if (statusContainer) {
            // Remove any existing indicator
            const existingIndicator = statusContainer.querySelector('.auto-status-indicator');
            if (existingIndicator) {
                existingIndicator.remove();
            }
            
            // Add new indicator
            const indicator = document.createElement('small');
            indicator.className = 'text-muted auto-status-indicator';
            indicator.innerHTML = `<i class="fas fa-robot me-1"></i>تم تحديد الحالة تلقائياً بناءً على حالة الدفع`;
            statusContainer.appendChild(indicator);
        }
        
        // Try to get invoice information for display
        if (typeof apiService !== 'undefined' && typeof apiService.getInvoiceByReportId === 'function') {
            try {
                const invoice = await apiService.getInvoiceByReportId(reportData.id);
                if (invoice) {
                    // Add invoice info display
                    const invoiceInfoContainer = document.getElementById('invoiceInfoContainer');
                    if (invoiceInfoContainer) {
                        const paymentStatusText = {
                            'paid': 'مدفوع',
                            'partial': 'مدفوع جزئياً',
                            'unpaid': 'غير مدفوع'
                        };
                        
                        invoiceInfoContainer.innerHTML = `
                            <div class="alert alert-info">
                                <h6><i class="fas fa-file-invoice me-2"></i>معلومات الفاتورة المرتبطة</h6>
                                <p class="mb-1"><strong>رقم الفاتورة:</strong> ${invoice.id}</p>
                                <p class="mb-1"><strong>حالة الدفع:</strong> 
                                    <span class="badge bg-${invoice.paymentStatus === 'paid' ? 'success' : invoice.paymentStatus === 'partial' ? 'warning' : 'danger'}">
                                        ${paymentStatusText[invoice.paymentStatus] || invoice.paymentStatus}
                                    </span>
                                </p>
                                <p class="mb-0"><strong>المبلغ الإجمالي:</strong> ${invoice.total} جنية</p>
                            </div>
                        `;
                        invoiceInfoContainer.style.display = 'block';
                    }
                }
            } catch (invoiceError) {
                console.warn('Could not fetch invoice information:', invoiceError);
            }
        }
        
    } catch (error) {
        console.error('Error updating status field:', error);
    }
} 