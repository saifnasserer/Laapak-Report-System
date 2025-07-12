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

// Local references for convenience
let globalDeviceDetails = window.globalDeviceDetails;
let clientsData = window.clientsData;

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
    
    // Add event listeners to update global device details when input values change
    const deviceInputs = ['orderNumber', 'inspectionDate', 'deviceModel', 'serialNumber'];
    deviceInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('change', updateGlobalDeviceDetails);
            input.addEventListener('input', updateGlobalDeviceDetails);
        }
    });
    
    // Initial update of global device details
    updateGlobalDeviceDetails();

    // Get form element
    const reportForm = document.getElementById('reportForm');
    if (!reportForm) return;
    
    // Load clients for the dropdown
    loadClients();
    
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
        // Use only keydown for Enter key
        input.addEventListener('keydown', function(e) {
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
    
    // Ensure all inputs with URL type also have Enter key functionality
    document.querySelectorAll('input[type="url"]').forEach(input => {
        if (!input.classList.contains('test-screenshot-url')) { // Avoid duplicate handlers
            input.addEventListener('keydown', function(e) {
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
        }
    });
    
    // Set up image URL functionality for Step 3
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
        
        // Allow pressing Enter to add video URL
        videoUrlInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                addVideoUrlBtn.click();
            }
        });
    }

    // Make Enter key press navigate to the next step
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
            // Prevent the default form submission
            e.preventDefault();
            
            // Find the active step
            const activeStep = document.querySelector('.form-step.active');
            if (!activeStep) return;
            
            // Get the step number from the class name (e.g., 'step-1' -> 1)
            const stepClasses = Array.from(activeStep.classList);
            const stepClass = stepClasses.find(cls => cls.startsWith('step-'));
            if (!stepClass) return;
            
            const currentStepNumber = parseInt(stepClass.replace('step-', ''));
            
            // Find the next button in the current active step
            const nextBtn = activeStep.querySelector('.btn-next-step');
            
            // If we're on the final step, allow form submission
            if (currentStepNumber === 5) { // Assuming 5 is the final step
                const submitBtn = activeStep.querySelector('[type="submit"]');
                if (submitBtn) {
                    console.log('Form submitted via Enter key on final step');
                    submitBtn.click();
                }
            } 
            // Otherwise, move to the next step
            else if (nextBtn) {
                console.log('Moving to next step via Enter key');
                nextBtn.click();
            }
        }
    });

    // Handle form submission
    reportForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Hide all previous error messages
        hideAllStepErrors();
        
        // Only allow form submission on the final step
        if (typeof currentStep !== 'undefined' && currentStep < 4) { // 4 is the index of the final step (5th step)
            console.log('Form submission prevented: Not on final step');
            return;
        }
        
        // Validate the current step (using the existing validation from form-steps.js)
        // This assumes the validateStep function is accessible
        if (typeof validateStep === 'function' && !validateStep(currentStep)) {
            // Show error in the current step's error container
            showStepError(currentStep + 1, 'يرجى إكمال جميع الحقول المطلوبة في هذه الخطوة');
            return;
        }
        
        try {
            // Show loading indicator
            showLoading(true);
            
            // Collect form data
            const formData = collectReportData();
            
            // Add required fields for database storage
            formData.status = 'active';
            formData.createdAt = new Date().toISOString();
            formData.updatedAt = new Date().toISOString();
            
            // Ensure client_id is a valid value (not null or undefined)
            if (!formData.client_id) {
                showLoading(false);
                showErrorMessage('يرجى اختيار عميل قبل إنشاء التقرير');
                return;
            }
            
            // Log client ID for debugging
            console.log('Client ID validation passed:', formData.client_id);
            
            // Validate collected data
            const validationError = validateReportData(formData);
            if (validationError) {
                showLoading(false);
                showErrorMessage(validationError);
                return;
            }
            
            console.log('Sending report data to API:', formData);
            
            // Submit to API
            const response = await apiService.createReport(formData);
            
            // Hide loading indicator
            showLoading(false);
            
            // Show success message
            showSuccessMessage(response);
            
            // Reset form
            resetForm();
            
            // Log successful report creation
            console.log('Report created successfully:', response);
        } catch (error) {
            console.error('Error creating report:', error);
            showLoading(false);
            showErrorMessage(error.message || 'فشل في إنشاء التقرير. يرجى المحاولة مرة أخرى.');
        }
    });
    
    /**
     * Validate the collected report data
     * @param {Object} data - The report data to validate
     * @returns {string|null} Error message if validation fails, null if validation passes
     */
    function validateReportData(data) {
        // Validate client selection
        if (!data.client_id) {
            showStepError(1, 'يرجى اختيار عميل');
            return 'يرجى اختيار عميل';
        }
        
        // Validate device information
        if (!data.deviceModel) {
            showStepError(1, 'يرجى إدخال موديل الجهاز');
            return 'يرجى إدخال موديل الجهاز';
        }
        
        if (!data.orderNumber) {
            showStepError(1, 'يرجى إدخال رقم الطلب');
            return 'يرجى إدخال رقم الطلب';
        }
        
        // If billing is enabled, validate invoice data
        if (data.billingEnabled && data.invoice) {
            if (data.invoice.totalAmount <= 0) {
                showStepError(5, 'يجب أن يكون إجمالي الفاتورة أكبر من صفر');
                return 'يجب أن يكون إجمالي الفاتورة أكبر من صفر';
            }
            
            if (data.invoice.paymentStatus === 'paid' && !data.invoice.paymentMethod) {
                showStepError(5, 'يرجى اختيار طريقة الدفع');
                return 'يرجى اختيار طريقة الدفع';
            }
        }
        
        return null; // Validation passed
    }

    /**
     * Collect all report data from the form
     * This function is used by both create-report.js and form-steps.js
     * @returns {Object} The report data
     */
    window.collectReportData = function() {
        // First try to get client ID from the global client details (set in form-steps.js)
        let client_id = null;
        let clientDetails = {};
        
        if (window.globalClientDetails && window.globalClientDetails.client_id) {
            // Use the globally stored client details from step 1
            client_id = window.globalClientDetails.client_id;
            clientDetails = {
                clientName: window.globalClientDetails.clientName || '',
                clientPhone: window.globalClientDetails.clientPhone || '',
                clientEmail: window.globalClientDetails.clientEmail || '',
                clientAddress: window.globalClientDetails.clientAddress || ''
            };
            console.log('Using globally stored client details:', window.globalClientDetails);
        } else {
            // Fallback to getting client ID from the select element
            const clientSelect = document.getElementById('clientSelect');
            client_id = clientSelect?.value || null;
            
            // Log client selection for debugging
            console.log('Selected client ID from form element:', client_id);
            console.log('Client select element:', clientSelect);
            
            // Find selected client details from global clientsData
            if (client_id && Array.isArray(window.clientsData)) {
                const selectedClient = window.clientsData.find(client => client.id == client_id);
                console.log('Found client details:', selectedClient);
                if (selectedClient) {
                    clientDetails = {
                        clientName: selectedClient.name,
                        clientPhone: selectedClient.phone,
                        clientEmail: selectedClient.email || '',
                        clientAddress: selectedClient.address || ''
                    };
                } else {
                    console.warn('Client ID found but no matching client in clientsData');
                }
            } else {
                console.warn('clientsData is not an array or is undefined');
            }
        }
        
        // Validate client selection
        if (!client_id || client_id === '') {
            console.error('No client selected!');
            // Show error message
            const errorDiv = document.createElement('div');
            errorDiv.className = 'alert alert-danger';
            errorDiv.textContent = 'يرجى اختيار عميل قبل إنشاء التقرير';
            
            // Find the client selection container
            const clientContainer = document.querySelector('.client-selection-container') || document.body;
            clientContainer.prepend(errorDiv);
            
            // Remove the error message after 5 seconds
            setTimeout(() => errorDiv.remove(), 5000);
            
            throw new Error('يرجى اختيار عميل قبل إنشاء التقرير');
        } else {
            console.log('Client validation passed. Using client ID:', client_id);
        }
        // Get invoice data if billing is enabled
        let invoiceData = null;
        const billingToggle = document.getElementById('enableBilling');
        const billingEnabled = billingToggle?.checked || false;
        
        if (billingEnabled) {
            const taxRate = parseFloat(document.getElementById('taxRate')?.value || 15);
            const discount = parseFloat(document.getElementById('discount')?.value || 0);
            const paymentStatus = document.getElementById('paymentStatus')?.value || 'unpaid';
            const paymentMethod = document.getElementById('paymentMethod')?.value || '';
            
            // Calculate total amount
            const subtotal = 250; // This should be calculated based on actual services and parts
            const taxAmount = (subtotal * taxRate) / 100;
            const totalAmount = subtotal + taxAmount - discount;
            
            invoiceData = {
                taxRate,
                discount,
                paymentStatus,
                paymentMethod,
                subtotal,
                taxAmount,
                totalAmount
            };
        }
        
        // Collect all media URLs (test screenshots, external images, and videos)
        const mediaUrls = [];
        
        // Get test screenshot URLs from Step 2
        const components = ['info', 'cpu', 'gpu', 'hdd', 'keyboard', 'battery', 'dxdiag'];
        components.forEach(component => {
            const urls = getTestScreenshotUrls(component);
            urls.forEach(url => {
                mediaUrls.push({
                    type: 'test_screenshot',
                    component: component,
                    url: url
                });
            });
        });
        
        // Get image URLs from the badges in Step 3
        const imageUrlBadges = document.querySelectorAll('#imageUrlBadges .badge');
        imageUrlBadges.forEach(badge => {
            const imageUrl = badge.getAttribute('data-url');
            if (imageUrl) {
                mediaUrls.push({
                    type: 'image',
                    url: imageUrl
                });
            }
        });
        
        // Get video URLs from the badges in Step 3
        const videoUrlBadges = document.querySelectorAll('#videoUrlBadges .badge');
        videoUrlBadges.forEach(badge => {
            const videoUrl = badge.getAttribute('data-url');
            const videoType = badge.getAttribute('data-type') || 'video';
            if (videoUrl) {
                mediaUrls.push({
                    type: videoType, // 'video', 'youtube', 'vimeo', etc.
                    url: videoUrl
                });
            }
        });
        
        // Store all media URLs in the external_images field
        const externalImages = mediaUrls;
        
        // Update global device details
        window.globalDeviceDetails = {
            orderNumber: window.getFullOrderCode ? window.getFullOrderCode() : (document.getElementById('orderNumber')?.value || ''),
            inspectionDate: document.getElementById('inspectionDate')?.value || new Date().toISOString().split('T')[0],
            deviceModel: document.getElementById('deviceModel')?.value || '',
            serialNumber: document.getElementById('serialNumber')?.value || ''
        };
        
        // Use the updated global device details
        globalDeviceDetails = window.globalDeviceDetails;
        
        // Generate a unique report ID if not already exists
        const reportId = document.getElementById('reportId')?.value || 
                        'RPT' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 1000);
        
        // Format data to match the database schema - ONLY include fields that exist in the table
        // Table fields from database:
        // id (varchar 50), client_id (int), client_name (varchar 100), client_phone (varchar 20),
        // client_email (varchar 100), client_address (text), order_number (varchar 20),
        // device_model (varchar 100), serial_number (varchar 100), inspection_date (datetime),
        // hardware_status (longtext), external_images (longtext), notes (text),
        // billing_enabled (tinyint), amount (decimal 10,2), status (enum),
        // created_at (datetime), updated_at (datetime)
        
        // Convert inspection date to proper datetime format
        const inspectionDateStr = globalDeviceDetails.inspectionDate || new Date().toISOString().split('T')[0];
        const inspectionDateTime = new Date(inspectionDateStr);
        
        const reportData = {
            // Fields required by the API route handler
            clientId: client_id,
            title: globalDeviceDetails.deviceModel || 'تقرير فحص جهاز', // Report title (using device model or default text)
            description: document.getElementById('reportNotes')?.value || '',
            
            // Fields matching the database schema
            id: reportId,
            client_id: client_id,
            client_name: clientDetails.clientName || '',
            client_phone: clientDetails.clientPhone || '',
            client_email: clientDetails.clientEmail || '',
            client_address: clientDetails.clientAddress || '',
            order_number: globalDeviceDetails.orderNumber,
            device_model: globalDeviceDetails.deviceModel,
            serial_number: globalDeviceDetails.serialNumber,
            inspection_date: inspectionDateTime, // Proper datetime format
            // hardware_status and external_images will be added below
            notes: document.getElementById('reportNotes')?.value || '',
            billing_enabled: billingEnabled,
            amount: invoiceData ? parseFloat(invoiceData.totalAmount) : 0,
            status: 'active'
            // created_at and updated_at are handled automatically by Sequelize
        };
        
        // Store hardware status and system components separately for the related tables
        // const hardwareComponentsList = [
        //     'camera_status', 'speakers_status', 'microphone_status', 'wifi_status',
        //     'lan_status', 'usb_status', 'keyboard_status', 'touchpad_status',
        //     'card_reader_status', 'audio_jack_status', 'hdmi_status', 'power_status',
        //     'cpuStatus', 'gpuStatus', 'ramStatus', 'storageStatus', 'batteryStatus', 'screenStatus'
        // ];
        
        // Create array of hardware components for database
        const hardwareComponents = [];
        
        // Find all hardware component groups by their name pattern
        const componentGroups = {};
        document.querySelectorAll('input[data-hardwarecomponent]').forEach(input => {
            const componentName = input.getAttribute('data-hardwarecomponent');
            const radioGroupName = input.name;
            if (!componentGroups[componentName]) {
                componentGroups[componentName] = radioGroupName;
            }
        });
        
        // For each component, find which option is selected
        Object.entries(componentGroups).forEach(([componentName, radioGroupName]) => {
            const selectedInput = document.querySelector(`input[name="${radioGroupName}"]:checked`);
            if (selectedInput) {
                hardwareComponents.push({
                    componentName: componentName,
                    status: selectedInput.value
                });
            } else {
                // If no status is selected, default to 'unknown'
                hardwareComponents.push({
                    componentName: componentName,
                    status: 'unknown'
                });
            }
        });
        
        // Add general notes from Step 4 to hardware_status with type 'note'
        const generalNotes = document.getElementById('generalNotes')?.value;
        if (generalNotes && generalNotes.trim() !== '') {
            hardwareComponents.push({
                componentName: 'notes',
                status: 'info',
                notes: generalNotes,
                type: 'note'
            });
        }
        
        // Convert hardware components to JSON format for database
        // Since the database field is longtext, we need to stringify the object
        reportData.hardware_status = JSON.stringify(hardwareComponents);
        
        // Convert external images to JSON format for database
        // Since the database field is longtext, we need to stringify the object
        reportData.external_images = externalImages && externalImages.length > 0 ? JSON.stringify(externalImages) : null;
        
        // We don't include invoice data in the report creation request anymore
        // Invoice will be created separately after the report is created
        
        console.log('Report data prepared for database:', reportData);
        return reportData;
    };
    
    /**
     * Load clients from API or localStorage with enhanced error handling
     * @returns {Promise<Array>} Array of client objects
     */
    async function loadClients() {
        // Show loading state in the dropdown
        const clientSelect = document.getElementById('clientSelect');
        if (!clientSelect) return [];
        
        // Set loading state
        clientSelect.innerHTML = '<option value="" selected>جاري تحميل العملاء...</option>';
        clientSelect.disabled = true;
        
        // Show loading indicator if exists
        const loadingIndicator = document.getElementById('clientLoadingIndicator');
        if (loadingIndicator) loadingIndicator.style.display = 'inline-block';
        
        try {
            // Define mock data for testing when API is not available
            const mockClients = [
                {
                    id: 1,
                    name: 'محمد أحمد',
                    phone: '0501234567',
                    email: 'mohammed@example.com',
                    orderCode: 'LPK1001',
                    status: 'active'
                },
                {
                    id: 2,
                    name: 'فاطمة علي',
                    phone: '0509876543',
                    email: 'fatima@example.com',
                    orderCode: 'LPK1002',
                    status: 'active'
                },
                {
                    id: 3,
                    name: 'سارة محمد',
                    phone: '0553219876',
                    email: 'sara@example.com',
                    orderCode: 'LPK1003',
                    status: 'active'
                }
            ];
            
            // Try to get clients from API
            let clients = [];
            let dataSource = 'api'; // Track data source for logging
            
            // Check network status
            const isOnline = navigator.onLine;
            
            if (isOnline) {
                try {
                    // Check if apiService is defined and has getClients method
                    if (typeof apiService !== 'undefined' && typeof apiService.getClients === 'function') {
                        console.log('Attempting to fetch clients from API...');
                        // Set timeout for API request to prevent long waiting
                        const timeoutPromise = new Promise((_, reject) => {
                            setTimeout(() => reject(new Error('API request timeout')), 5000);
                        });
                        
                        // Race between API request and timeout
                        const response = await Promise.race([
                            apiService.getClients(),
                            timeoutPromise
                        ]);
                        
                        console.log('[DEBUG] LoadClients API response:', response);
                        // Fix: extract the array if response is an object
                        clients = Array.isArray(response) ? response : (response.clients || []);
                        console.log('[DEBUG] LoadClients extracted clients array:', clients);
                        console.log('[DEBUG] LoadClients number of clients found:', clients.length);
                        
                        if (Array.isArray(clients) && clients.length > 0) {
                            console.log(`Successfully fetched ${clients.length} clients from API`);
                            // Cache clients in localStorage for offline use
                            localStorage.setItem('lpk_clients', JSON.stringify(clients));
                            localStorage.setItem('lpk_clients_timestamp', Date.now().toString());
                            dataSource = 'api';
                        } else {
                            throw new Error('API returned empty or invalid data');
                        }
                    } else {
                        throw new Error('API service not available');
                    }
                } catch (apiError) {
                    console.warn(`API error: ${apiError.message}. Falling back to localStorage.`);
                    // Fall back to localStorage if API fails
                    dataSource = 'localStorage';
                }
            } else {
                console.log('Device is offline. Using cached data.');
                dataSource = 'localStorage';
            }
            
            // If API failed or offline, try localStorage
            if (dataSource === 'localStorage') {
                try {
                    const storedClients = localStorage.getItem('lpk_clients');
                    const timestamp = localStorage.getItem('lpk_clients_timestamp');
                    
                    if (storedClients) {
                        clients = JSON.parse(storedClients);
                        const age = timestamp ? Math.floor((Date.now() - parseInt(timestamp)) / (1000 * 60)) : 'unknown';
                        console.log(`Using ${clients.length} clients from localStorage (${age} minutes old)`);
                    } else {
                        throw new Error('No cached client data found');
                    }
                } catch (storageError) {
                    console.warn(`localStorage error: ${storageError.message}. Using mock data.`);
                    dataSource = 'mock';
                }
            }
            
            // If both API and localStorage failed, use mock data
            if (dataSource === 'mock' || clients.length === 0) {
                console.log('Using mock client data');
                clients = mockClients;
                // Cache mock data for future use
                localStorage.setItem('lpk_clients', JSON.stringify(mockClients));
                localStorage.setItem('lpk_clients_timestamp', Date.now().toString());
            }
            
            // Store clients data globally
            clientsData = clients;
            
            // Reset dropdown
            clientSelect.innerHTML = '<option value="" selected>اختر عميل...</option>';
            
            // Add clients to dropdown
            clients.forEach(client => {
                const option = document.createElement('option');
                option.value = client.id;
                option.textContent = `${client.name} - ${client.phone}`;
                clientSelect.appendChild(option);
            });
            
            // Add a data source indicator to the UI if in development mode
            // if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            //     const dataSourceIndicator = document.createElement('div');
            //     dataSourceIndicator.className = 'small text-muted mt-1';
            //     dataSourceIndicator.innerHTML = `<i class="fas fa-info-circle"></i> مصدر البيانات: ${
            //         dataSource === 'api' ? '' : 
            //         dataSource === 'localStorage' ? 'التخزين المحلي' : 'بيانات تجريبية'
            //     }`;
            //     clientSelect.parentNode.appendChild(dataSourceIndicator);
            // }
            
            return clients;
            
        } catch (error) {
            console.error('Fatal error loading clients:', error);
            // Show error in dropdown
            clientSelect.innerHTML = '<option value="" selected>خطأ في تحميل العملاء</option>';
            
            // Show error message to user
            const errorAlert = document.createElement('div');
            errorAlert.className = 'alert alert-danger mt-2';
            errorAlert.innerHTML = `<i class="fas fa-exclamation-triangle"></i> حدث خطأ أثناء تحميل بيانات العملاء: ${error.message}`;
            clientSelect.parentNode.appendChild(errorAlert);
            
            // Auto-remove error after 5 seconds
            setTimeout(() => {
                errorAlert.remove();
            }, 5000);
            
            return [];
        } finally {
            // Re-enable select
            clientSelect.disabled = false;
            
            // Hide loading indicator
            if (loadingIndicator) loadingIndicator.style.display = 'none';
        }
    }
    
    /**
     * Handle client selection change with enhanced UI updates
     * @param {HTMLSelectElement} selectElement - The client select element
     */
    window.clientSelectionChanged = function(selectElement) {
        const selectedClient_id = selectElement.value;
        const selectedClientInfo = document.getElementById('selectedClientInfo');
        const clientQuickActions = document.getElementById('clientQuickActions');
        
        if (!selectedClient_id) {
            // No client selected, hide the info card and actions
            selectedClientInfo.style.display = 'none';
            if (clientQuickActions) clientQuickActions.style.display = 'none';
            
            // Clear global client details
            window.globalClientDetails = {
                client_id: null,
                clientName: '',
                clientPhone: '',
                clientEmail: '',
                clientAddress: ''
            };
            
            return;
        }
        
        // Store selected client ID in global variable
        if (!window.globalClientDetails) {
            window.globalClientDetails = {};
        }
        
        // Find the selected client in the global clients data
        const selectedClient = clientsData.find(client => client.id == selectedClient_id);
        if (!selectedClient) {
            selectedClientInfo.style.display = 'none';
            if (clientQuickActions) clientQuickActions.style.display = 'none';
            showToast('لم يتم العثور على بيانات العميل', 'warning');
            return;
        }
        
        // Store client details in global variable
        window.globalClientDetails.client_id = selectedClient_id;
        window.globalClientDetails.clientName = selectedClient.name || '';
        window.globalClientDetails.clientPhone = selectedClient.phone || '';
        window.globalClientDetails.clientEmail = selectedClient.email || '';
        window.globalClientDetails.clientAddress = selectedClient.address || '';
        
        console.log('Updated global client details:', window.globalClientDetails);
        
        // Update the client info card with all available details
        document.getElementById('selectedClientName').textContent = selectedClient.name;
        document.getElementById('selectedClientPhone').innerHTML = 
            `<i class="fas fa-phone me-1"></i> ${selectedClient.phone || 'غير متوفر'}`;
        document.getElementById('selectedClientEmail').innerHTML = 
            `<i class="fas fa-envelope me-1"></i> ${selectedClient.email || 'غير متوفر'}`;
        
        // Update additional client details if the elements exist
        if (document.getElementById('selectedClientOrderCode')) {
            document.getElementById('selectedClientOrderCode').textContent = selectedClient.orderCode || 'غير متوفر';
        }
        
        if (document.getElementById('selectedClientStatus')) {
            const statusElement = document.getElementById('selectedClientStatus');
            statusElement.textContent = getStatusText(selectedClient.status);
            
            // Update status badge color based on status
            statusElement.className = 'badge ms-1 text-white';
            switch(selectedClient.status) {
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
                selectedClient.address || 'غير متوفر';
        }
        
        // Try to get last report date if available
        if (document.getElementById('selectedClientLastReport')) {
            const lastReportElement = document.getElementById('selectedClientLastReport');
            
            if (selectedClient.lastReportDate) {
                const date = new Date(selectedClient.lastReportDate);
                lastReportElement.textContent = date.toLocaleDateString('ar-SA');
            } else {
                lastReportElement.textContent = 'لا يوجد تقارير سابقة';
            }
        }
        
        // Setup edit button if it exists
        const editButton = document.getElementById('editSelectedClient');
        if (editButton) {
            editButton.onclick = function() {
                openEditClientModal(selectedClient);
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
                    viewClientHistory(selectedClient.id);
                };
            }
            
            // Setup view reports button if it exists
            const reportsButton = document.getElementById('viewClientReports');
            if (reportsButton) {
                reportsButton.onclick = function() {
                    viewClientReports(selectedClient.id);
                };
            }
        }
        
        // If we have an order code from the client, auto-fill the order number field
        if (selectedClient.orderCode && document.getElementById('orderNumber')) {
            document.getElementById('orderNumber').value = selectedClient.orderCode;
        }
        
        // Show a toast notification
        showToast(`تم اختيار العميل: ${selectedClient.name}`, 'success');
    };
    
    /**
     * Get human-readable status text
     * @param {string} status - The status code
     * @returns {string} The human-readable status text
     */
    function getStatusText(status) {
        switch(status) {
            case 'active':
                return 'نشط';
            case 'inactive':
                return 'غير نشط';
            case 'pending':
                return 'قيد الانتظار';
            default:
                return status || 'غير محدد';
        }
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
        // bootstrapModal.hide();
    }
    
    /**
     * View client history
     * @param {number|string} client_id - The client ID
     */
    function viewClientHistory(client_id) {
        // This would typically open a modal or navigate to a history page
        // For now, we'll just show a toast notification
        showToast('جاري تحميل سجل العميل...', 'info');
        
        // Simulate API call
        setTimeout(() => {
            showToast('لم يتم العثور على سجل للعميل', 'warning');
        }, 1500);
    }
    
    /**
     * View client reports
     * @param {number|string} client_id - The client ID
     */
    function viewClientReports(client_id) {
        // This would typically open a modal with a list of reports
        // For now, we'll just show a toast notification
        showToast('جاري تحميل تقارير العميل...', 'info');
        
        // Simulate API call
        setTimeout(() => {
            showToast('لم يتم العثور على تقارير سابقة للعميل', 'warning');
        }, 1500);
    }
    
    /**
     * Set up client search functionality
     */
    function setupClientSearch() {
        const searchInput = document.getElementById('clientSearchFilter');
        const clearButton = document.getElementById('clearClientSearch');
        const clientSelect = document.getElementById('clientSelect');
        
        if (!searchInput || !clientSelect) return;
        
        // Store original options for reset
        let originalOptions = [];
        
        // Wait for clients to load before capturing original options
        setTimeout(() => {
            Array.from(clientSelect.options).forEach(option => {
                if (option.value) { // Skip the placeholder option
                    originalOptions.push({
                        value: option.value,
                        text: option.text
                    });
                }
            });
        }, 1000);
        
        // Handle search input
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase().trim();
            
            // If search is empty, restore all options
            if (!searchTerm) {
                resetClientOptions();
                return;
            }
            
            // Filter client options based on search term
            filterClientOptions(searchTerm);
        });
        
        // Clear search button
        if (clearButton) {
            clearButton.addEventListener('click', function() {
                searchInput.value = '';
                resetClientOptions();
                searchInput.focus();
            });
        }
        
        // Filter client options based on search term
        function filterClientOptions(searchTerm) {
            // First, ensure we have the original options
            if (originalOptions.length === 0) {
                Array.from(clientSelect.options).forEach(option => {
                    if (option.value) { // Skip the placeholder option
                        originalOptions.push({
                            value: option.value,
                            text: option.text
                        });
                    }
                });
            }
            
            // Clear all options except the placeholder
            while (clientSelect.options.length > 1) {
                clientSelect.remove(1);
            }
            
            // Add filtered options
            let matchCount = 0;
            originalOptions.forEach(option => {
                if (option.text.toLowerCase().includes(searchTerm)) {
                    const newOption = document.createElement('option');
                    newOption.value = option.value;
                    newOption.text = option.text;
                    clientSelect.add(newOption);
                    matchCount++;
                }
            });
            
            // Update placeholder text based on results
            if (matchCount === 0) {
                clientSelect.options[0].text = `لا توجد نتائج لـ "${searchTerm}"`;
            } else {
                clientSelect.options[0].text = `تم العثور على ${matchCount} عميل`;
            }
        }
        
        // Reset client options to original state
        function resetClientOptions() {
            // Clear all options except the placeholder
            while (clientSelect.options.length > 1) {
                clientSelect.remove(1);
            }
            
            // Reset placeholder text
            clientSelect.options[0].text = 'اختر عميل...';
            
            // Add all original options
            originalOptions.forEach(option => {
                const newOption = document.createElement('option');
                newOption.value = option.value;
                newOption.text = option.text;
                clientSelect.add(newOption);
            });
        }
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
                const client_id = document.getElementById('clientSelect')?.value;
                if (client_id) {
                    const selectedClient = clientsData.find(client => client.id == client_id);
                    if (selectedClient) {
                        openEditClientModal(selectedClient);
                    }
                }
            });
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
     * Ensure modal backdrop is removed when addClientModal is hidden
     */
    const clientModalElement = document.getElementById('addClientModal');
    if (clientModalElement) {
        clientModalElement.addEventListener('hidden.bs.modal', function () {
            const backdrops = document.getElementsByClassName('modal-backdrop');
            while (backdrops[0]) {
                backdrops[0].parentNode.removeChild(backdrops[0]);
            }
            // Ensure body doesn't have 'modal-open' class and overflow style
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        });
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
            
            // Get full order code with LPK prefix
            const fullOrderCode = window.getFullClientOrderCode ? window.getFullClientOrderCode() : clientOrderCode;
            
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
                orderCode: fullOrderCode,
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
            
            // Update the dropdown
            const clientSelect = document.getElementById('clientSelect');
            if (clientSelect) {
                // Clear and rebuild options
                clientSelect.innerHTML = '<option value="" selected>اختر عميل...</option>';
                
                // Add all clients to dropdown
                clientsData.forEach(client => {
                    const option = document.createElement('option');
                    option.value = client.id;
                    option.textContent = `${client.name} - ${client.phone}`;
                    clientSelect.appendChild(option);
                });
                
                // Select the new/updated client
                const client_id = existingClient ? existingClient.id : response.id;
                clientSelect.value = client_id;
                
                // Trigger the change event to update the UI
                clientSelectionChanged(clientSelect);
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
            
            // In the saveNewClient function, after successfully adding a client (API or local), dispatch a custom event:
            // document.dispatchEvent(new CustomEvent('clientAdded', { detail: { client: response } }));
            // Remove any code that tries to repopulate or select in the old dropdown.
            
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
     * Show or hide loading indicator
     * @param {boolean} show - Whether to show or hide loading
     */
    function showLoading(show) {
        const submitBtn = reportForm.querySelector('button[type="submit"]');
        const prevBtn = reportForm.querySelector('#prevBtn'); // Standard ID, adjust if needed
        const nextBtn = reportForm.querySelector('#nextBtn'); // Standard ID, adjust if needed

        if (show) {
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> جاري الإنشاء...';
            }
            if (prevBtn) {
                prevBtn.disabled = true;
            }
            if (nextBtn) {
                nextBtn.disabled = true;
            }
        } else {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'إنشاء التقرير';
            }
            if (prevBtn) {
                prevBtn.disabled = false;
            }
            if (nextBtn) {
                nextBtn.disabled = false;
            }
        }
    }

    /**
     * Show success message and handle post-submission actions
     * @param {Object} response - API response with created report
     */
    function showSuccessMessage(response) {
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
        
        // Get the success modal
        const successModal = document.getElementById('reportCreatedModal');
        
        if (successModal) {
            // Get the report URL
            const reportUrl = `${window.location.origin}/report.html?id=${response.id}`;
            
            // Update modal content with report information
            const reportLink = document.getElementById('reportLink');
            if (reportLink) {
                reportLink.value = reportUrl;
            }
            
            // Setup WhatsApp share button
            const whatsappBtn = document.getElementById('whatsappShareBtn');
            if (whatsappBtn) {
                const encodedMessage = encodeURIComponent(`تقرير فحص جهازك جاهز للعرض: ${reportUrl}`);
                whatsappBtn.href = `https://wa.me/?text=${encodedMessage}`;
                
                whatsappBtn.addEventListener('click', function(e) {
                    // Track sharing event if analytics available
                    if (typeof gtag !== 'undefined') {
                        gtag('event', 'share', {
                            'method': 'whatsapp',
                            'content_type': 'report',
                            'item_id': response.id
                        });
                    }
                });
            }
            
            // Setup View Report button
            const viewReportBtn = document.getElementById('viewReportBtn');
            if (viewReportBtn) {
                viewReportBtn.href = reportUrl;
            }
            
            // Setup both copy buttons functionality
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
                            
                            // Track copy event if analytics available
                            if (typeof gtag !== 'undefined') {
                                gtag('event', 'share', {
                                    'method': 'copy_link',
                                    'content_type': 'report',
                                    'item_id': response.id
                                });
                            }
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
            reportForm.prepend(alertEl);
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
        reportForm.reset();
        
        // Reset to first step if using multi-step form
        if (typeof showStep === 'function') {
            currentStep = 0;
            showStep(currentStep);
            updateProgressBar();
        }
    }
    
    // Initialize the billing toggle functionality
    setupBillingToggle();

    // --- Customer Autocomplete Logic ---
    const clientSearchInput = document.getElementById('clientSearchInput');
    const clientSearchResults = document.getElementById('clientSearchResults');
    const selectedClientInfo = document.getElementById('selectedClientInfo');
    const selectedClientName = document.getElementById('selectedClientName');
    const selectedClientPhone = document.getElementById('selectedClientPhone');
    const selectedClientEmail = document.getElementById('selectedClientEmail');
    const selectedClientOrderCode = document.getElementById('selectedClientOrderCode');
    const selectedClientStatus = document.getElementById('selectedClientStatus');
    const clientLoadingIndicator = document.getElementById('clientLoadingIndicator');

    let clientSearchTimeout = null;

    if (clientSearchInput) {
        clientSearchInput.addEventListener('input', function() {
            const query = clientSearchInput.value.trim();
            if (clientSearchTimeout) clearTimeout(clientSearchTimeout);
            if (query.length < 2) {
                clientSearchResults.innerHTML = '';
                clientSearchResults.style.display = 'none';
                return;
            }
            clientLoadingIndicator.style.display = 'inline-block';
            clientSearchTimeout = setTimeout(async () => {
                try {
                    let clients = [];
                    if (window.apiService && typeof window.apiService.getClients === 'function') {
                        const response = await window.apiService.getClients({ search: query });
                        console.log('[DEBUG] Customer search API response:', response);
                        // Fix: extract the array if response is an object
                        clients = Array.isArray(response) ? response : (response.clients || []);
                        console.log('[DEBUG] Extracted clients array:', clients);
                        console.log('[DEBUG] Number of clients found:', clients.length);
                    }
                    clientSearchResults.innerHTML = '';
                    console.log('[DEBUG] About to display results. clients.length:', clients.length);
                    if (clients && clients.length > 0) {
                        console.log('[DEBUG] Creating result items for', clients.length, 'clients');
                        clients.forEach((client, index) => {
                            console.log('[DEBUG] Creating item', index + 1, 'for client:', client.name);
                            const item = document.createElement('button');
                            item.type = 'button';
                            item.className = 'list-group-item list-group-item-action';
                            item.textContent = `${client.name} (${client.phone})`;
                            item.onclick = function() {
                                selectClient(client);
                                clientSearchResults.innerHTML = '';
                                clientSearchResults.style.display = 'none';
                                clientSearchInput.value = '';
                            };
                            clientSearchResults.appendChild(item);
                        });
                        console.log('[DEBUG] Setting display to block for results');
                        clientSearchResults.style.display = 'block';
                        // More debug: parent info
                        console.log('[DEBUG] Results container parent:', clientSearchResults.parentElement);
                        console.log('[DEBUG] Results container parent overflow:', window.getComputedStyle(clientSearchResults.parentElement).overflow);
                        console.log('[DEBUG] Results container parent position:', window.getComputedStyle(clientSearchResults.parentElement).position);
                        // Remove debug styles and restore default look
                        clientSearchResults.style.border = '';
                        clientSearchResults.style.backgroundColor = '';
                        clientSearchResults.style.color = '';
                        clientSearchResults.style.fontWeight = '';
                        clientSearchResults.style.fontSize = '';
                        clientSearchResults.style.position = 'absolute';
                        clientSearchResults.style.zIndex = '1000';
                        clientSearchResults.style.top = '100%';
                        clientSearchResults.style.left = '0';
                        clientSearchResults.style.width = '100%';
                        clientSearchResults.style.minHeight = '';
                    } else {
                        console.log('[DEBUG] No clients found, showing no results message');
                        const noResult = document.createElement('div');
                        noResult.className = 'list-group-item text-muted';
                        noResult.textContent = 'لا يوجد عملاء مطابقون';
                        clientSearchResults.appendChild(noResult);
                        clientSearchResults.style.display = 'block';
                    }
                } catch (e) {
                    clientSearchResults.innerHTML = '<div class="list-group-item text-danger">حدث خطأ أثناء البحث</div>';
                    clientSearchResults.style.display = 'block';
                } finally {
                    clientLoadingIndicator.style.display = 'none';
                }
            }, 300);
        });
    }

    function selectClient(client) {
        console.log('[DEBUG] Selected client data:', client);
        
        // Always ensure order code has LPK prefix
        let fullOrderCode = client.orderCode || '';
        if (fullOrderCode && !fullOrderCode.startsWith('LPK')) {
            fullOrderCode = 'LPK' + fullOrderCode.replace(/\D/g, '');
        }

        window.globalClientDetails = {
            client_id: client.id,
            clientName: client.name,
            clientPhone: client.phone,
            clientEmail: client.email || '',
            clientAddress: client.address || '',
            clientOrderCode: fullOrderCode,
            clientStatus: client.status || ''
        };
        
        // Auto-fill only the order number field with client's order code
        const orderNumberInput = document.getElementById('orderNumber');
        console.log('[DEBUG] Order number input found:', !!orderNumberInput);
        console.log('[DEBUG] Client orderCode:', client.orderCode);
        
        if (orderNumberInput && client.orderCode) {
            // Use the new function to handle LPK prefix properly
            if (window.setOrderNumberFromFullCode) {
                window.setOrderNumberFromFullCode(client.orderCode);
                console.log('[DEBUG] Auto-filled order number with:', client.orderCode);
            } else {
                // Fallback to direct assignment
                orderNumberInput.value = client.orderCode;
                console.log('[DEBUG] Auto-filled order number with:', client.orderCode);
            }
        } else {
            console.log('[DEBUG] Could not auto-fill order number. Input exists:', !!orderNumberInput, 'Order code exists:', !!client.orderCode);
        }
        
        // Update selected client info display
        if (selectedClientInfo) {
            selectedClientInfo.style.display = 'block';
            selectedClientName.textContent = client.name;
            selectedClientPhone.innerHTML = `<i class='fas fa-phone me-1'></i> ${client.phone}`;
            selectedClientEmail.innerHTML = `<i class='fas fa-envelope me-1'></i> ${client.email || ''}`;
            selectedClientOrderCode.textContent = fullOrderCode;
            selectedClientStatus.textContent = client.status === 'active' ? 'نشط' : 'غير نشط';
            selectedClientStatus.className = 'badge ' + (client.status === 'active' ? 'bg-success' : 'bg-secondary') + ' text-white ms-1';
        }
        
        // Show success feedback
        showToast(`تم اختيار العميل: ${client.name}`, 'success');
    }

    // Listen for custom event when a new client is added from the modal
    document.addEventListener('clientAdded', function(e) {
        if (e.detail && e.detail.client) {
            selectClient(e.detail.client);
        }
    });

    // Hide results when clicking outside
    document.addEventListener('click', function(e) {
        if (!clientSearchResults.contains(e.target) && e.target !== clientSearchInput) {
            clientSearchResults.innerHTML = '';
            clientSearchResults.style.display = 'none';
        }
    });

    // LPK Order Number Prefix Functionality
    function setupOrderNumberPrefix() {
        const orderNumberInput = document.getElementById('orderNumber');
        if (!orderNumberInput) return;

        // Function to get full order code with LPK prefix
        function getFullOrderCode() {
            const numericPart = orderNumberInput.value.replace(/\D/g, ''); // Remove non-digits
            return numericPart ? `LPK${numericPart}` : '';
        }

        // Function to set order number from full code (handles LPK prefix)
        function setOrderNumberFromFullCode(fullCode) {
            if (!fullCode) return;
            
            // If the code already has LPK prefix, extract the numeric part
            if (fullCode.startsWith('LPK')) {
                orderNumberInput.value = fullCode.substring(3); // Remove LPK prefix
            } else {
                // If no LPK prefix, assume it's just the numeric part
                orderNumberInput.value = fullCode.replace(/\D/g, '');
            }
        }

        // Input validation - only allow digits
        orderNumberInput.addEventListener('input', function(e) {
            const value = e.target.value;
            const numericOnly = value.replace(/\D/g, '');
            if (value !== numericOnly) {
                e.target.value = numericOnly;
            }
        });

        // Prevent LPK from being typed
        orderNumberInput.addEventListener('keydown', function(e) {
            const value = e.target.value;
            if (e.key === 'L' || e.key === 'P' || e.key === 'K') {
                e.preventDefault();
            }
        });

        // Make functions globally available
        window.getFullOrderCode = getFullOrderCode;
        window.setOrderNumberFromFullCode = setOrderNumberFromFullCode;
    }

    // Initialize order number prefix functionality
    setupOrderNumberPrefix();

    // LPK Order Number Prefix Functionality for Add Client Modal
    function setupAddClientOrderCodePrefix() {
        const clientOrderCodeInput = document.getElementById('clientOrderCode');
        if (!clientOrderCodeInput) return;

        // Function to get full order code with LPK prefix
        function getFullClientOrderCode() {
            const numericPart = clientOrderCodeInput.value.replace(/\D/g, ''); // Remove non-digits
            return numericPart ? `LPK${numericPart}` : '';
        }

        // Function to set order code from full code (handles LPK prefix)
        function setClientOrderCodeFromFullCode(fullCode) {
            if (!fullCode) return;
            
            // If the code already has LPK prefix, extract the numeric part
            if (fullCode.startsWith('LPK')) {
                clientOrderCodeInput.value = fullCode.substring(3); // Remove LPK prefix
            } else {
                // If no LPK prefix, assume it's just the numeric part
                clientOrderCodeInput.value = fullCode.replace(/\D/g, '');
            }
        }

        // Input validation - only allow digits
        clientOrderCodeInput.addEventListener('input', function(e) {
            const value = e.target.value;
            const numericOnly = value.replace(/\D/g, '');
            if (value !== numericOnly) {
                e.target.value = numericOnly;
            }
        });

        // Prevent LPK from being typed
        clientOrderCodeInput.addEventListener('keydown', function(e) {
            if (e.key === 'L' || e.key === 'P' || e.key === 'K') {
                e.preventDefault();
            }
        });

        // Make functions globally available
        window.getFullClientOrderCode = getFullClientOrderCode;
        window.setClientOrderCodeFromFullCode = setClientOrderCodeFromFullCode;
    }

    // Initialize add client order code prefix functionality
    setupAddClientOrderCodePrefix();
});
