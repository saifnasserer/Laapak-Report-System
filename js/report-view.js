document.addEventListener('DOMContentLoaded', () => {
    // Global variables for gallery and lightbox
    let currentZoomLevel = 1;
    const zoomStep = 0.25;
    const maxZoom = 3;
    const minZoom = 0.5;
    let galleryImages = [];
    let testScreenshots = [];
    let currentImageIndex = 0;
    const reportId = new URLSearchParams(window.location.search).get('id');

    // Step navigation elements
    const steps = document.querySelectorAll('.form-step');
    const stepItems = document.querySelectorAll('.step-item');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const progressBar = document.querySelector('.steps-progress-bar');
    let currentStep = 1;

    // HTML elements to populate
    const reportTitle = document.getElementById('reportTitle');
    const reportOrderNumberHeader = document.getElementById('reportOrderNumberHeader');
    const clientName = document.getElementById('clientName');
    const clientPhone = document.getElementById('clientPhone');
    const clientEmail = document.getElementById('clientEmail');
    const clientAddress = document.getElementById('clientAddress');
    const orderNumber = document.getElementById('orderNumber');
    const deviceModel = document.getElementById('deviceModel');
    const serialNumber = document.getElementById('serialNumber');
    const inspectionDate = document.getElementById('inspectionDate');
    const reportStatus = document.getElementById('reportStatus');

    const externalImagesGallery = document.getElementById('externalImagesGallery');
    // const deviceVideoEmbed = document.getElementById('deviceVideoEmbed'); // Replaced by specific player elements
    const testScreenshotsGallery = document.getElementById('testScreenshotsGallery');
    const hardwareStatusTableBody = document.getElementById('hardwareStatusTableBody');

    // Video Player Elements
    let player; // To store YouTube or HTML5 player instance
    const videoPlaceholder = document.getElementById('videoPlaceholder');
    const videoThumbnail = document.getElementById('videoThumbnail'); // New thumbnail element
    const deviceVideoContainer = document.getElementById('deviceVideoContainer');
    const videoPlayerWrapper = document.getElementById('videoPlayerWrapper');
    const videoControlsOverlay = document.getElementById('videoControlsOverlay');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const playIcon = document.getElementById('playIcon');
    const pauseIcon = document.getElementById('pauseIcon');
    const videoProgressBarEl = document.getElementById('videoProgressBar'); // Renamed for video controls
    const currentTimeEl = document.getElementById('currentTime');
    const durationEl = document.getElementById('durationTime');
    const muteBtn = document.getElementById('muteBtn');
    const volumeHighIcon = document.getElementById('volumeHighIcon');
    const volumeMuteIcon = document.getElementById('volumeMuteIcon');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const standaloneFullscreenBtn = document.getElementById('standaloneFullscreenBtn'); // New standalone button
    
    const billingEnabled = document.getElementById('billingEnabled');
    const billingAmount = document.getElementById('billingAmount');
    const billingSummaryContainer = document.getElementById('billingSummaryContainer');
    const noBillingInfo = document.getElementById('noBillingInfo');
    const technicianNotes = document.getElementById('technicianNotes');

    if (!reportId) {
        document.body.innerHTML = '<div class="alert alert-danger m-5">لم يتم تحديد معرف التقرير. يرجى التأكد من صحة الرابط.</div>';
        return;
    }

    async function fetchReportData() {
        try {
            // Try to get apiService from different sources
            const service = typeof apiService !== 'undefined' ? apiService : 
                          (window && window.apiService) ? window.apiService : null;
            
            // Determine base URL safely
            const apiBaseUrl = service && service.baseUrl ? service.baseUrl : 
                             (window.config && window.config.api && window.config.api.baseUrl) ? window.config.api.baseUrl :
                             'https://reports.laapak.com';
                             
            console.log('Using API base URL:', apiBaseUrl);
            console.log('Fetching report with ID:', reportId);
            
            // The correct API endpoint structure
            const response = await fetch(`${apiBaseUrl}/api/reports/${reportId}`);
            
            if (!response.ok) {
                // Try alternative endpoint if the first one fails
                console.log('First endpoint failed, trying alternative endpoint...');
                const altResponse = await fetch(`${apiBaseUrl}/api/client/reports/${reportId}`);
                
                if (!altResponse.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                return await altResponse.json();
            }
            const data = await response.json();
            if (data.success && data.report) {
                populateReportDetails(data.report);
            } else {
                console.error('Problematic API Response or missing report data:', JSON.stringify(data, null, 2));
                throw new Error(data.message || 'فشل تحميل بيانات التقرير، أو أن البيانات المستلمة غير مكتملة.');
            }
        } catch (error) {
            console.error('Error fetching report data:', error);
            document.getElementById('step1').innerHTML = `<div class="alert alert-danger">فشل تحميل بيانات التقرير: ${error.message}</div>`;
        }
    }

    function populateReportDetails(report) {
        // Helper to safely get potentially missing data
        const get = (obj, path, defaultValue = '-') => {
            const value = path.split('.').reduce((acc, part) => acc && acc[part], obj);
            return value !== undefined && value !== null && value !== '' ? value : defaultValue;
        };

        reportTitle.textContent = `تقرير فحص جهاز: ${get(report, 'device_model')}`;
        reportOrderNumberHeader.textContent = get(report, 'order_number');

        // Step 1: General Information
        clientName.textContent = get(report, 'client_name');
        clientPhone.textContent = get(report, 'client_phone');
        clientEmail.textContent = get(report, 'client_email');
        clientAddress.textContent = get(report, 'client_address');
        orderNumber.textContent = get(report, 'order_number');
        deviceModel.textContent = get(report, 'device_model');
        serialNumber.textContent = get(report, 'serial_number');
        inspectionDate.textContent = report.inspection_date ? new Date(report.inspection_date).toLocaleDateString('ar-EG-u-nu-arab') : '-';
        
        const statusText = get(report, 'status');
        reportStatus.textContent = translateStatus(statusText);
        reportStatus.className = `badge ${getStatusBadgeClass(statusText)}`;

        // Step 2: External Inspection
        const externalImagesData = safeJsonParse(report.external_images, []);
        populateExternalInspectionGallery(externalImagesData); // Handles images for Step 2
        renderDeviceVideo(externalImagesData); // Handles video for Step 2
        renderNewTestScreenshots(externalImagesData); // Handles test screenshots for new Step 4

        // Step 3: Technical Hardware Tests
        const hardwareStatusData = safeJsonParse(report.hardware_status, []);
        populateHardwareComponentsTable(hardwareStatusData);

        // Step 4: Technician Notes
        let hasNotes = false;
        let notesContent = '';
        
        // First check if there are notes in hardware_status with type 'note'
        const notesComponent = hardwareStatusData.find(item => item.type === 'note' && item.componentName === 'notes');
        if (notesComponent && notesComponent.notes && notesComponent.notes.trim()) {
            notesContent = notesComponent.notes;
            hasNotes = true;
        } else {
            // Fallback to the regular notes field if no notes found in hardware_status
            const regularNotes = get(report, 'notes');
            if (regularNotes && regularNotes.trim() && regularNotes !== '-') {
                notesContent = regularNotes;
                hasNotes = true;
            }
        }
        
        // Set notes content if available
        if (technicianNotes) {
            technicianNotes.textContent = notesContent;
        }
        
        // Hide notes step if no content
        if (!hasNotes) {
            hideNotesStep();
        }

        // Step 5: Billing Summary (Now handled by static content in Step 6 in HTML)
    }
    
    /**
     * Hide the notes step if there's no content
     */
    function hideNotesStep() {
        // Find the notes step element (assuming it's step 4)
        const notesStep = document.querySelector('.form-step[data-step="4"], .step-4, #step4');
        const notesStepItem = document.querySelector('.step-item[data-step="4"], .step-item:nth-child(4)');
        
        if (notesStep) {
            notesStep.style.display = 'none';
        }
        
        if (notesStepItem) {
            notesStepItem.style.display = 'none';
        }
        
        // Also hide the entire notes section container if it exists
        const notesSection = document.getElementById('notesSection');
        if (notesSection) {
            notesSection.style.display = 'none';
        }
        
        // Update step navigation to skip the hidden step
        updateStepNavigation();
    }
    
    /**
     * Update step navigation to handle hidden steps
     */
    function updateStepNavigation() {
        // Recalculate total steps after hiding notes step
        const visibleSteps = document.querySelectorAll('.form-step:not([style*="display: none"])');
        const visibleStepItems = document.querySelectorAll('.step-item:not([style*="display: none"])');
        
        // Update step navigation logic to account for hidden steps
        if (visibleSteps.length !== steps.length) {
            console.log(`Notes step hidden. Total steps: ${visibleSteps.length} (was ${steps.length})`);
            
            // If we're currently on a step that's now hidden, move to the next visible step
            const currentStepElement = document.querySelector('.form-step.active');
            if (currentStepElement && currentStepElement.style.display === 'none') {
                const nextVisibleStep = Array.from(visibleSteps).find(step => 
                    step.style.display !== 'none' && 
                    Array.from(steps).indexOf(step) > Array.from(steps).indexOf(currentStepElement)
                );
                
                if (nextVisibleStep) {
                    currentStep = Array.from(visibleSteps).indexOf(nextVisibleStep) + 1;
                } else {
                    // If no next step, go to the last visible step
                    currentStep = visibleSteps.length;
                }
                
                updateSteps();
            }
        }
    }

    function safeJsonParse(jsonString, defaultValue = []) {
        try {
            return JSON.parse(jsonString) || defaultValue;
        } catch (e) {
            console.warn('Failed to parse JSON string:', jsonString, e);
            return defaultValue;
        }
    }
    
    function translateStatus(status) {
        const statuses = {
            'pending': 'قيد الانتظار',
            'in-progress': 'قيد المعالجة',
            'completed': 'مكتمل',
            'cancelled': 'ملغى',
            'active': 'نشط'
        };
        return statuses[status.toLowerCase()] || status;
    }

    function getStatusBadgeClass(status) {
        const lowerStatus = status.toLowerCase();
        if (lowerStatus === 'completed') return 'bg-success';
        if (lowerStatus === 'in-progress') return 'bg-info text-dark';
        if (lowerStatus === 'pending') return 'bg-warning text-dark';
        if (lowerStatus === 'cancelled') return 'bg-danger';
        if (lowerStatus === 'active') return 'bg-primary';
        return 'bg-secondary';
    }

    function populateExternalInspectionGallery(imagesData) {
        const galleryContainer = document.getElementById('externalImagesGallery');
        if (!galleryContainer) {
            console.error('Gallery container not found');
            return;
        }
        
        galleryContainer.innerHTML = ''; // Clear previous
        
        // Filter only image items and exclude test_screenshots
        const imageItems = imagesData.filter(item => {
            return (item.type === 'image' && !item.url.match(/\.(mp4|webm|ogg|mov)$/i)) && 
                   item.type !== 'test_screenshot' && 
                   item.type !== 'youtube' && 
                   item.type !== 'video';
        });
        
        // Store gallery images globally for navigation
        galleryImages = imageItems;
        
        if (imageItems.length === 0) {
            galleryContainer.innerHTML = `
                <div class="col-12">
                    <div class="text-center py-5">
                        <i class="fas fa-images fa-3x mb-3" style="color: #e9ecef;"></i>
                        <h5 class="text-muted">لا توجد صور خارجية للجهاز</h5>
                        <p class="text-muted small">لم يتم اضافة أي صور خارجية للجهاز في هذا التقرير</p>
                    </div>
                </div>`;
            
            // Disable gallery controls
            const galleryControls = document.getElementById('galleryControls');
            if (galleryControls) {
                const galleryControlsParent = galleryControls.closest('.card-header');
                if (galleryControlsParent) galleryControlsParent.style.display = 'none';
                else galleryControls.style.display = 'none';
            }
            return;
        }
        
        // Set up gallery control buttons
        // setupGalleryControls(imageItems.length);
        
        // Create gallery items
        imageItems.forEach((item, index) => {
            const col = document.createElement('div');
            col.className = 'col-lg-4 col-md-6 col-sm-6 gallery-item';
            
            const imgContainer = document.createElement('div');
            imgContainer.className = 'card border-0 shadow-sm h-100 overflow-hidden';
            imgContainer.style.borderRadius = 'var(--card-radius)';
            imgContainer.style.transition = 'all 0.3s ease';
            imgContainer.dataset.index = index;
            
            // Image wrapper for fixed aspect ratio
            const imgWrapper = document.createElement('div');
            imgWrapper.className = 'img-wrapper position-relative';
            imgWrapper.style.overflow = 'hidden';
            imgWrapper.style.aspectRatio = '4/3';
            imgWrapper.style.backgroundColor = '#f8f9fa';
            
            const img = document.createElement('img');
            img.src = item.url;
            img.alt = item.name || 'صورة الجهاز';
            img.className = 'img-fluid w-100 h-100';
            img.style.objectFit = 'cover';
            img.style.transition = 'transform 0.5s ease';
            img.loading = 'lazy'; // Lazy loading for better performance
            
            // Add hover effect
            imgContainer.onmouseenter = () => {
                imgContainer.style.transform = 'translateY(-5px)';
                imgContainer.style.boxShadow = '0 15px 30px rgba(0,0,0,0.1)';
                img.style.transform = 'scale(1.05)';
            };
            
            imgContainer.onmouseleave = () => {
                imgContainer.style.transform = 'translateY(0)';
                imgContainer.style.boxShadow = '';
                img.style.transform = 'scale(1)';
            };
            
            // Add modern overlay with actions
            const overlay = document.createElement('div');
            overlay.className = 'position-absolute d-flex flex-column justify-content-between w-100 h-100 p-3';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.background = 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.2) 100%)';
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.3s ease';
            
            // Top row with image number
            const topRow = document.createElement('div');
            topRow.className = 'd-flex justify-content-between align-items-center';
            
            const imageNumber = document.createElement('span');
            imageNumber.className = 'badge bg-dark bg-opacity-50 fw-normal';
            imageNumber.innerHTML = `<i class="fas fa-image me-1"></i> ${index + 1}/${imageItems.length}`;
            topRow.appendChild(imageNumber);
            
            // Bottom row with caption and action button
            const bottomRow = document.createElement('div');
            bottomRow.className = 'd-flex justify-content-between align-items-end';
            
            if (item.name) {
                const caption = document.createElement('h6');
                caption.className = 'text-white mb-0 text-shadow';
                caption.textContent = item.name;
                caption.style.textShadow = '0 1px 3px rgba(0,0,0,0.5)';
                bottomRow.appendChild(caption);
            }
            
            const viewBtn = document.createElement('button');
            viewBtn.className = 'btn btn-sm btn-light rounded-circle';
            viewBtn.style.width = '32px';
            viewBtn.style.height = '32px';
            viewBtn.style.display = 'flex';
            viewBtn.style.alignItems = 'center';
            viewBtn.style.justifyContent = 'center';
            viewBtn.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
            viewBtn.innerHTML = '<i class="fas fa-expand"></i>';
            viewBtn.setAttribute('title', 'عرض بالحجم الكامل');
            viewBtn.onclick = (e) => {
                e.stopPropagation();
                openGalleryLightbox(index);
            };
            
            bottomRow.appendChild(viewBtn);
            
            overlay.appendChild(topRow);
            overlay.appendChild(bottomRow);
            
            // Show overlay on hover
            imgContainer.addEventListener('mouseenter', () => overlay.style.opacity = '1');
            imgContainer.addEventListener('mouseleave', () => overlay.style.opacity = '0');
            
            // Container click opens lightbox
            imgContainer.onclick = () => openGalleryLightbox(index);
            
            imgWrapper.appendChild(img);
            imgWrapper.appendChild(overlay);
            imgContainer.appendChild(imgWrapper);
            
            // Add optional footer with description if available
            if (item.description) {
                const cardBody = document.createElement('div');
                cardBody.className = 'card-body p-2';
                cardBody.style.borderTop = '1px solid rgba(0,0,0,0.05)';
                
                const description = document.createElement('p');
                description.className = 'card-text small text-muted mb-0';
                description.textContent = item.description.length > 60 ? 
                    item.description.substring(0, 60) + '...' : 
                    item.description;
                cardBody.appendChild(description);
                imgContainer.appendChild(cardBody);
            }
            
            col.appendChild(imgContainer);
            galleryContainer.appendChild(col);
        });
    }
    
    // Set up gallery control buttons
    function setupGalleryControls(imageCount) {
        
        const galleryControls = document.getElementById('galleryControls');
        
        if (imageCount <= 1) {
            galleryControls.style.display = 'none';
            return;
        }
        
        galleryControls.style.display = 'flex';
        
        document.getElementById('externalImagesGallery').className = 'row g-3 gallery-grid';
        
    }
    
    // Simple lightbox function with navigation
    function openGalleryLightbox(index) {
        if (!galleryImages || galleryImages.length === 0) return;
        
        currentImageIndex = index;
        const simpleLightbox = document.getElementById('simpleLightbox');
        
        // Show the lightbox
        simpleLightbox.classList.remove('d-none');
        document.body.style.overflow = 'hidden'; // Prevent scrolling while lightbox is open
        
        // Update content
        updateLightboxContent();
        
        // Set up event handlers if not already set
        setupLightboxEvents();
    }
    
    // Set up all event handlers for the simple lightbox
    function setupLightboxEvents() {
        // Close button event
        const closeBtn = document.getElementById('closeLightbox');
        if (closeBtn) {
            closeBtn.onclick = closeLightbox;
        }
        
        // Previous button event
        const prevBtn = document.getElementById('prevImageSimple');
        if (prevBtn) {
            prevBtn.onclick = navigatePrevImage;
        }
        
        // Next button event
        const nextBtn = document.getElementById('nextImageSimple');
        if (nextBtn) {
            nextBtn.onclick = navigateNextImage;
        }
        
        // Add keyboard navigation
        document.addEventListener('keydown', handleLightboxKeyboard);
    }
    
    // Close the lightbox
    function closeLightbox() {
        const simpleLightbox = document.getElementById('simpleLightbox');
        simpleLightbox.classList.add('d-none');
        document.body.style.overflow = ''; // Restore scrolling
        document.removeEventListener('keydown', handleLightboxKeyboard);
    }
    
    // Update lightbox content with current image
    function updateLightboxContent() {
        if (!galleryImages || galleryImages.length === 0) return;
        
        const currentImage = galleryImages[currentImageIndex];
        const lightboxImage = document.getElementById('lightboxImageSimple');
        
        // Set the image source
        lightboxImage.src = currentImage.url;
        lightboxImage.alt = currentImage.name || 'صورة الجهاز';
        
        // Update navigation buttons visibility
        const prevBtn = document.getElementById('prevImageSimple');
        const nextBtn = document.getElementById('nextImageSimple');
        
        if (prevBtn) {
            prevBtn.style.visibility = currentImageIndex > 0 ? 'visible' : 'hidden';
        }
        
        if (nextBtn) {
            nextBtn.style.visibility = currentImageIndex < galleryImages.length - 1 ? 'visible' : 'hidden';
        }
        
        // Update counter
        updateImageCounter();
    }
    
    // Navigate to previous image
    function navigatePrevImage() {
        if (currentImageIndex > 0) {
            currentImageIndex--;
            updateLightboxContent();
        }
    }
    
    // Navigate to next image
    function navigateNextImage() {
        if (currentImageIndex < galleryImages.length - 1) {
            currentImageIndex++;
            updateLightboxContent();
        }
    }
    
    // Handle keyboard navigation in lightbox
    function handleLightboxKeyboard(e) {
        if (e.key === 'ArrowLeft') {
            navigateNextImage(); // RTL direction - left means next
        } else if (e.key === 'ArrowRight') {
            navigatePrevImage(); // RTL direction - right means previous
        } else if (e.key === 'Escape') {
            closeLightbox();
        }
    }
    
    // Update image counter
    function updateImageCounter() {
        const currentIndexElement = document.getElementById('currentIndexSimple');
        const totalImagesElement = document.getElementById('totalImagesSimple');
        
        if (currentIndexElement && totalImagesElement) {
            currentIndexElement.textContent = (currentImageIndex + 1).toString();
            totalImagesElement.textContent = galleryImages.length.toString();
        }
    }

    function renderDeviceVideo(externalImages) {
        // const videoContainer = document.getElementById('deviceVideoContainer'); // Already defined globally
        if (!deviceVideoContainer || !videoPlayerWrapper || !videoPlaceholder) {
            console.error('Video container, player wrapper, or placeholder element not found');
            return;
        }
        
        videoPlayerWrapper.innerHTML = ''; // Clear previous player
        videoPlaceholder.style.display = 'flex'; // Show loading placeholder
        if(videoControlsOverlay) videoControlsOverlay.style.visibility = 'hidden'; // Hide controls initially
        
        // Show thumbnail if it exists
        if (videoThumbnail) {
            videoThumbnail.style.display = 'flex';
            // Add click event to play video
            videoThumbnail.onclick = function() {
                if (player) {
                    // Hide thumbnail
                    videoThumbnail.style.display = 'none';
                    // Play video
                    if (player.playVideo) { // YouTube
                        player.playVideo();
                    } else if (player.play) { // HTML5 video
                        player.play();
                    }
                    // Show controls
                    if (videoControlsOverlay) {
                        videoControlsOverlay.style.visibility = 'visible';
                        videoControlsOverlay.style.opacity = '1';
                    }
                }
            };
        }
        
        // Find any video media (supports multiple types)
        const videoItems = externalImages.filter(item => {
            return item.type === 'youtube' || 
                  item.type === 'video' || 
                  (item.type === 'image' && item.url && 
                   (item.url.endsWith('.mp4') || item.url.endsWith('.webm') || item.url.endsWith('.mov')));
        });
        
        if (videoItems.length === 0) {
            videoPlaceholder.innerHTML = '<div class="text-muted text-center py-5"><i class="fas fa-video-slash fa-3x mb-3 text-secondary"></i><p>لا يوجد فيديو مرفق للجهاز.</p></div>';
            videoPlaceholder.style.display = 'flex';
            if(videoPlayerWrapper) videoPlayerWrapper.innerHTML = ''; // Clear player wrapper if no video
            if(videoControlsOverlay) videoControlsOverlay.style.visibility = 'hidden';
            return;
        }
        
        // Process the first video (primary video)
        const videoItem = videoItems[0];
        try {
            // Determine video type by URL or explicit type
            if (videoPlaceholder) {
                videoPlaceholder.style.display = 'none';
                videoPlaceholder.style.visibility = 'hidden';
                videoPlaceholder.style.opacity = '0';
            } // Hide placeholder completely
            // Controls overlay visibility will be handled by initializeVideoControls or player readiness

            if (videoItem.type === 'youtube' || (videoItem.url && isYouTubeUrl(videoItem.url))) {
                embedYouTubeVideo(videoItem.url, videoPlayerWrapper);
            } else if (videoItem.url.match(/\.(mp4|webm|ogg|mov)$/i)) {
                // Direct video file
                embedDirectVideo(videoItem.url, videoPlayerWrapper, videoItem.autoplay);
            } else if (videoItem.url.includes('vimeo.com')) {
                // Vimeo video (Note: Custom controls might not work with Vimeo iframe without specific API)
                embedVimeoVideo(videoItem.url, videoPlayerWrapper);
                // For Vimeo, custom controls might be limited. Consider hiding custom controls if Vimeo.
                if (videoControlsOverlay) videoControlsOverlay.style.visibility = 'hidden'; 
            } else {
                // Unknown format - try iframe as fallback
                if (videoPlaceholder) {
                    videoPlaceholder.innerHTML = '<div class="alert alert-warning text-center">صيغة الفيديو غير مدعومة.</div>';
                    videoPlaceholder.style.display = 'flex';
                }
                if (videoControlsOverlay) videoControlsOverlay.style.visibility = 'hidden';
                videoPlayerWrapper.innerHTML = ''; // Clear player wrapper for unsupported format
            }
            
            // If there are multiple videos, add thumbnails below (optional feature for later)
            if (videoItems.length > 1) {
                const videoNav = document.createElement('div');
                videoNav.className = 'video-thumbnails d-flex mt-3 overflow-auto';
                // ... Implementation for multiple video navigation (future feature)
            }
            
        } catch (e) {
            console.error('Error processing video:', e);
            if (videoPlaceholder) {
                videoPlaceholder.innerHTML = '<div class="alert alert-warning text-center">خطأ في معالجة الفيديو. يرجى التحقق من صحة الرابط.</div>';
                videoPlaceholder.style.display = 'flex';
            }
            if (videoPlayerWrapper) videoPlayerWrapper.innerHTML = '';
            if (videoControlsOverlay) videoControlsOverlay.style.visibility = 'hidden';
        }
    } // Closing brace for renderDeviceVideo function

// Helper function to check if URL is YouTube
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

// Helper to embed YouTube videos with modern player interface
function embedYouTubeVideo(url, playerWrapperArgument) { // Renamed argument to avoid conflict with global
    try {
        playerWrapperArgument.innerHTML = ''; // Clear previous player
        const youtubeHostDiv = document.createElement('div');
        youtubeHostDiv.id = 'youtubePlayerHost'; // API will replace this div
        playerWrapperArgument.appendChild(youtubeHostDiv);

        const videoUrl = new URL(url);
        let videoId = '';
        if (videoUrl.hostname === 'youtu.be') {
            videoId = videoUrl.pathname.substring(1);
        } else if (videoUrl.pathname === '/watch') {
            videoId = videoUrl.searchParams.get('v');
        } else if (videoUrl.pathname.startsWith('/embed/')) {
            videoId = videoUrl.pathname.split('/').pop();
        }

        if (videoId) {
            const initPlayer = () => {
                if (document.getElementById('youtubePlayerHost')) { // Ensure host element exists
                    player = new YT.Player('youtubePlayerHost', {
                        height: '100%',
                        width: '100%',
                        videoId: videoId,
                        playerVars: {
                            'playsinline': 1,
                            'rel': 0,       // No related videos
                            'controls': 0,  // Hide default YouTube controls
                            'showinfo': 0,  // Hide video title, uploader before video starts
                            'modestbranding': 1 // Hide YouTube logo as much as possible
                        },
                        events: {
                            'onReady': onYouTubePlayerReady,
                            'onStateChange': onYouTubePlayerStateChange
                        }
                    });
                } else {
                    console.error('YouTube player host element not found for initialization.');
                }
            };

            if (window.YT && window.YT.Player) {
                initPlayer();
            } else {
                window.onYouTubeIframeAPIReady = initPlayer; // This will be called once API is loaded
                if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
                    const tag = document.createElement('script');
                    tag.src = 'https://www.youtube.com/iframe_api';
                    const firstScriptTag = document.getElementsByTagName('script')[0];
                    if (firstScriptTag && firstScriptTag.parentNode) {
                       firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
                    } else {
                       document.head.appendChild(tag);
                    }
                }
            }
        } else {
            throw new Error('Invalid YouTube URL');
        }
    } catch (e) {
        console.error('YouTube embedding error:', e);
        playerWrapperArgument.innerHTML = `<div class="text-center p-4 alert alert-danger"><i class="fas fa-exclamation-triangle fa-2x mb-3"></i><p class="mb-0">خطأ في تضمين فيديو YouTube</p></div>`;
        if (videoPlaceholder) videoPlaceholder.style.display = 'none';
        if (videoControlsOverlay) videoControlsOverlay.style.visibility = 'hidden';
    }
}

// Helper to embed direct video files with modern controls
function embedDirectVideo(url, playerWrapperArgument, autoplay = false) { // Renamed argument
    playerWrapperArgument.innerHTML = ''; // Clear previous player
    
    const video = document.createElement('video');
    video.id = 'html5VideoPlayer';
    video.src = url;
    video.controls = false; // We use custom controls
    video.autoplay = autoplay;
    video.style.width = '100%';
    video.style.height = '100%'; // Fill the wrapper
    video.style.objectFit = 'contain'; // Maintain aspect ratio and center
    video.style.maxHeight = '100vh';
    video.style.maxWidth = '100vw';
    playerWrapperArgument.appendChild(video);

    player = video; // Store HTML5 video element as the player

    // Event listeners for HTML5 video
    player.addEventListener('loadedmetadata', () => {
        console.log('Video metadata loaded');
        // Hide loading placeholder completely
        if (videoPlaceholder) {
            videoPlaceholder.style.display = 'none';
            videoPlaceholder.style.visibility = 'hidden';
            videoPlaceholder.style.opacity = '0';
        }
        
        // Use first frame as thumbnail background if possible
        if (videoThumbnail) {
            // Try to set video frame as background for the thumbnail
            try {
                const canvas = document.createElement('canvas');
                canvas.width = player.videoWidth;
                canvas.height = player.videoHeight;
                canvas.getContext('2d').drawImage(player, 0, 0, canvas.width, canvas.height);
                const thumbnailImage = canvas.toDataURL();
                videoThumbnail.style.backgroundImage = `url(${thumbnailImage})`;
                videoThumbnail.style.backgroundSize = 'cover';
                videoThumbnail.style.backgroundPosition = 'center';
            } catch (e) {
                console.log('Could not set video frame as thumbnail:', e);
            }
        }
        
        // Force controls to be visible
        if (videoControlsOverlay) {
            console.log('Setting video controls visible');
            videoControlsOverlay.style.visibility = 'visible';
            videoControlsOverlay.style.opacity = '1';
            videoControlsOverlay.style.display = 'block';
        }
        
        // Directly get fullscreen button
        const fsBtn = document.getElementById('fullscreenBtn');
        if (fsBtn) {
            console.log('Found fullscreen button, attaching event');
            fsBtn.onclick = function() {
                console.log('Fullscreen button clicked');
                toggleFullscreen();
            };
            // Make sure it's visible
            fsBtn.style.display = 'block';
        } else {
            console.warn('Fullscreen button not found!');
        }
        
        initializeVideoControls();
        updateVideoProgressBar(); // Initialize progress bar with duration
        updatePlayPauseButton();
        updateMuteButton();
    });
    
    // Add more event listeners for HTML5 video controls
    player.addEventListener('play', () => {
        updatePlayPauseButton();
    });
    
    player.addEventListener('pause', () => {
        updatePlayPauseButton();
    });
    
    player.addEventListener('volumechange', () => {
        updateMuteButton();
    });
    
    player.addEventListener('timeupdate', () => {
        updateVideoProgressBar();
    });
    
    player.addEventListener('ended', () => {
        updatePlayPauseButton();
        // Optionally reset to beginning
        player.currentTime = 0;
    });
    
    // Handle errors
    player.addEventListener('error', () => {
        console.error('Video error:', player.error);
        if (videoPlaceholder) {
            videoPlaceholder.innerHTML = '<div class="alert alert-danger text-center"><i class="fas fa-exclamation-triangle mb-2"></i><p>خطأ في تشغيل الفيديو</p></div>';
            videoPlaceholder.style.display = 'flex';
        }
    });
} // End of embedDirectVideo function

    function onYouTubePlayerStateChange(event) {
        updatePlayPauseButton();
        updateVideoProgressBar(); // Keep progress bar updated
        // YT.PlayerState.ENDED, YT.PlayerState.PLAYING, YT.PlayerState.PAUSED, etc.
        if (event.data === YT.PlayerState.PLAYING) {
            if (videoControlsOverlay) videoControlsOverlay.style.opacity = '1'; // Keep controls visible
        } else if (event.data === YT.PlayerState.ENDED) {
            if(playIcon && pauseIcon) {
                playIcon.style.display = 'inline-block';
                pauseIcon.style.display = 'none';
            }
            if(player && player.seekTo) player.seekTo(0, false); // Rewind to start, but don't play
        }
    }

    // Video Control Functions
    function initializeVideoControls() {
        // More robust check for elements
        if (!player || !deviceVideoContainer || !videoControlsOverlay) {
            console.warn('Essential video elements are missing.');
            return;
        }

        // Attach events to controls if they exist
        if (playPauseBtn) {
            playPauseBtn.onclick = togglePlayPause;
        } else {
            console.warn('Play/Pause button not found');
        }
        
        if (muteBtn) {
            muteBtn.onclick = toggleMute;
        } else {
            console.warn('Mute button not found');
        }
        
        if (fullscreenBtn) {
            console.log('Attaching fullscreen handler to button', fullscreenBtn);
            fullscreenBtn.onclick = toggleFullscreen;
        } else {
            console.warn('Fullscreen button not found');
            // Try to re-get the element in case it was added to DOM later
            setTimeout(() => {
                const fsBtn = document.getElementById('fullscreenBtn');
                if (fsBtn) {
                    console.log('Found fullscreenBtn after delay');
                    fsBtn.onclick = toggleFullscreen;
                }
            }, 1000);
        }
        
        if (videoProgressBarEl) {
            videoProgressBarEl.oninput = seekVideo;
        } else {
            console.warn('Progress bar not found');
        }

        // Always keep controls visible
        if (videoControlsOverlay) {
            videoControlsOverlay.style.opacity = '1';
            videoControlsOverlay.style.visibility = 'visible';
            videoControlsOverlay.style.display = 'block';
        }

        updatePlayPauseButton();
        updateMuteButton();
        updateVideoProgressBar();
    }

    function isPlaying() {
        if (!player) return false;
        if (player.getPlayerState) { // YouTube
            return player.getPlayerState() === YT.PlayerState.PLAYING;
        } else { // HTML5
            return !!(player.currentTime > 0 && !player.paused && !player.ended && player.readyState > player.HAVE_CURRENT_DATA);
        }
    }

    function togglePlayPause() {
        if (!player) return;
        if (player.getPlayerState) { // YouTube API
            isPlaying() ? player.pauseVideo() : player.playVideo();
        } else { // HTML5 Video
            player.paused || player.ended ? player.play() : player.pause();
        }
    }

    function updatePlayPauseButton() {
        if (!playIcon || !pauseIcon) return;
        if (isPlaying()) {
            playIcon.style.display = 'none';
            pauseIcon.style.display = 'inline-block';
        } else {
            playIcon.style.display = 'inline-block';
            pauseIcon.style.display = 'none';
        }
    }

    function toggleMute() {
        if (!player) return;
        if (player.isMuted) { // YouTube API
            player.isMuted() ? player.unMute() : player.mute();
            updateMuteButton(); // YouTube doesn't have a state change event for mute via API call
        } else { // HTML5 Video
            player.muted = !player.muted;
            // HTML5 'volumechange' event will call updateMuteButton
        }
    }

    function updateMuteButton() {
        if (!volumeHighIcon || !volumeMuteIcon || !player) return;
        let muted;
        if (player.isMuted) { // YouTube
            muted = player.isMuted();
        } else { // HTML5
            muted = player.muted;
        }
        if (muted) {
            volumeHighIcon.style.display = 'none';
            volumeMuteIcon.style.display = 'inline-block';
        } else {
            volumeHighIcon.style.display = 'inline-block';
            volumeMuteIcon.style.display = 'none';
        }
    }

    function toggleFullscreen() {
        // Get fullscreen button icons if they exist
        const fsIcon = fullscreenBtn ? fullscreenBtn.querySelector('i') : null;
        const standaloneFsIcon = standaloneFullscreenBtn ? standaloneFullscreenBtn.querySelector('i') : null;
        
        console.log('Toggle fullscreen called', { deviceVideoContainer });
        
        if (!deviceVideoContainer) {
            console.warn('Video container not found for fullscreen');
            return;
        }
        
        try {
            const isFullScreen = document.fullscreenElement || document.webkitFullscreenElement || 
                              document.mozFullScreenElement || document.msFullscreenElement;
                              
            if (isFullScreen) {
                // Exit fullscreen
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.webkitExitFullscreen) { /* Safari */
                    document.webkitExitFullscreen();
                } else if (document.mozCancelFullScreen) { /* Firefox */
                    document.mozCancelFullScreen();
                } else if (document.msExitFullscreen) { /* IE11 */
                    document.msExitFullscreen();
                }
                
                // Change icons to expand
                if (fsIcon) fsIcon.className = 'fas fa-expand';
                if (standaloneFsIcon) standaloneFsIcon.className = 'fas fa-expand text-white';
                
                // Reset video container styling
                setTimeout(() => {
                    if (deviceVideoContainer) {
                        deviceVideoContainer.style.width = '100%';
                        deviceVideoContainer.style.height = '100%';
                        deviceVideoContainer.classList.remove('fullscreen-active');
                    }
                    
                    if (videoPlayerWrapper) {
                        videoPlayerWrapper.style.width = '100%';
                        videoPlayerWrapper.style.height = '100%';
                    }
                    
                    if (player) {
                        if (player.tagName === 'VIDEO') {
                            // Reset direct video styling
                            player.style.width = '100%';
                            player.style.height = '100%';
                            player.style.maxHeight = 'none';
                            player.style.maxWidth = 'none';
                            player.style.objectFit = 'contain';
                        } else if (player.getIframe && typeof player.getIframe === 'function') {
                            // Reset YouTube player
                            const iframe = player.getIframe();
                            if (iframe) {
                                iframe.style.width = '100%';
                                iframe.style.height = '100%';
                            }
                        }
                    }
                    
                    // Force repaint
                    document.body.style.display = 'none';
                    document.body.offsetHeight; // Force reflow
                    document.body.style.display = '';
                }, 100);
            } else {
                // Enter fullscreen
                if (deviceVideoContainer.requestFullscreen) {
                    deviceVideoContainer.requestFullscreen();
                } else if (deviceVideoContainer.webkitRequestFullscreen) { /* Safari */
                    deviceVideoContainer.webkitRequestFullscreen();
                } else if (deviceVideoContainer.mozRequestFullScreen) { /* Firefox */
                    deviceVideoContainer.mozRequestFullScreen();
                } else if (deviceVideoContainer.msRequestFullscreen) { /* IE11 */
                    deviceVideoContainer.msRequestFullscreen();
                }
                
                // Change icons to compress
                if (fsIcon) fsIcon.className = 'fas fa-compress';
                if (standaloneFsIcon) standaloneFsIcon.className = 'fas fa-compress text-white';
                
                // Optimize video container for fullscreen
                setTimeout(() => {
                    if (deviceVideoContainer) {
                        deviceVideoContainer.style.width = '100vw';
                        deviceVideoContainer.style.height = '100vh';
                        deviceVideoContainer.style.display = 'flex';
                        deviceVideoContainer.style.alignItems = 'center';
                        deviceVideoContainer.style.justifyContent = 'center';
                        deviceVideoContainer.classList.add('fullscreen-active');
                    }
                    
                    if (videoPlayerWrapper) {
                        videoPlayerWrapper.style.width = '100%';
                        videoPlayerWrapper.style.height = '100%';
                        videoPlayerWrapper.style.display = 'flex';
                        videoPlayerWrapper.style.alignItems = 'center';
                        videoPlayerWrapper.style.justifyContent = 'center';
                    }
                    
                    if (player) {
                        if (player.tagName === 'VIDEO') {
                            // Direct video
                            player.style.width = '100%';
                            player.style.height = 'auto';
                            player.style.maxHeight = '100vh';
                            player.style.maxWidth = '100vw';
                            player.style.objectFit = 'contain';
                        } else if (player.getIframe && typeof player.getIframe === 'function') {
                            // YouTube player
                            const iframe = player.getIframe();
                            if (iframe) {
                                iframe.style.width = '100%';
                                iframe.style.height = '100%';
                                iframe.style.maxHeight = '100vh';
                                iframe.style.maxWidth = '100vw';
                            }
                        }
                    }

                    // Force repaint to ensure video fills the screen properly
                    document.body.style.display = 'none';
                    document.body.offsetHeight; // Force reflow
                    document.body.style.display = '';
                }, 100);
            }
        } catch (error) {
            console.error('Error toggling fullscreen:', error);
        }
    }

    function formatTime(timeInSeconds) {
        if (isNaN(timeInSeconds) || timeInSeconds < 0) timeInSeconds = 0;
        const result = new Date(timeInSeconds * 1000).toISOString().slice(11, 19);
        return result.startsWith('00:') ? result.slice(3) : result;
    }

    function updateVideoProgressBar() {
        if (!player || !videoProgressBarEl || !currentTimeEl || !durationEl) return;
        let currentTime, duration;
        if (player.getCurrentTime) { // YouTube
            currentTime = player.getCurrentTime();
            duration = player.getDuration();
        } else { // HTML5
            currentTime = player.currentTime;
            duration = player.duration;
        }

        if (isNaN(duration) || duration === 0) {
            videoProgressBarEl.value = 0;
            videoProgressBarEl.max = 0;
            currentTimeEl.textContent = formatTime(0);
            durationEl.textContent = formatTime(0);
            return;
        }
        
        currentTimeEl.textContent = formatTime(currentTime);
        durationEl.textContent = formatTime(duration);
        videoProgressBarEl.value = currentTime;
        videoProgressBarEl.max = duration;
    }

    function seekVideo() {
        if (!player || !videoProgressBarEl) return;
        const time = parseFloat(videoProgressBarEl.value);
        if (player.seekTo) { // YouTube
            player.seekTo(time, true);
        } else { // HTML5
            player.currentTime = time;
        }
    }

// Helper to embed Vimeo videos
    function embedVimeoVideo(url, container) {
        try {
            const videoUrl = new URL(url);
            let videoId = videoUrl.pathname.split('/').pop();
            
            if (videoId) {
                const iframe = document.createElement('iframe');
                iframe.src = `https://player.vimeo.com/video/${videoId}`;
                iframe.setAttribute('allowfullscreen', 'true');
                iframe.style.width = '100%';
                iframe.style.height = '500px';
                iframe.style.border = 'none';
                container.appendChild(iframe);
            } else {
                throw new Error('Invalid Vimeo URL');
            }
        } catch (e) {
            console.error('Vimeo embedding error:', e);
            container.innerHTML = '<div class="alert alert-warning text-center">خطأ في تضمين فيديو Vimeo</div>';
        }
    }



    function renderNewTestScreenshots(externalImages) {
        const testScreenshotsContainer = document.getElementById('newTestScreenshotsContainer');
        if (!testScreenshotsContainer) {
            console.error('Element with ID newTestScreenshotsContainer not found.');
            return;
        }
        testScreenshotsContainer.innerHTML = ''; // Clear previous content

        const screenshotItems = externalImages.filter(item => item.type === 'test_screenshot');

        if (screenshotItems.length === 0) {
            testScreenshotsContainer.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-desktop fa-4x mb-3 text-muted"></i>
                    <h5 class="text-muted">لا توجد لقطات شاشة للاختبارات مرفقة.</h5>
                </div>`;
            return;
        }
        
        // Save test screenshots for lightbox navigation
        testScreenshots = [...screenshotItems]; // Assign to global variable
        
        // Create full-width test screenshots with detailed explanations
        screenshotItems.forEach((item, index) => {
            // Create the main screenshot section container
            const screenshotSection = document.createElement('div');
            screenshotSection.className = 'test-screenshot-section mb-5';
            
            // Create a premium card for the screenshot
            const card = document.createElement('div');
            card.className = 'card shadow-sm border-0 overflow-hidden';
            
            // Card header with component name
            const cardHeader = document.createElement('div');
            cardHeader.className = 'card-header bg-light py-3 border-0';
            
            const componentName = document.createElement('h5');
            componentName.className = 'mb-0 d-flex align-items-center';
            
            // Use appropriate icon based on component type
            const componentIcon = document.createElement('i');
            let iconClass = 'fa-laptop-code';
            if (item.component) {
                const comp = item.component.toLowerCase();
                if (comp.includes('cpu')) iconClass = 'fa-microchip';
                else if (comp.includes('gpu')) iconClass = 'fa-desktop';
                else if (comp.includes('hdd') || comp.includes('storage')) iconClass = 'fa-hdd';
                else if (comp.includes('battery')) iconClass = 'fa-battery-full';
                else if (comp.includes('keyboard')) iconClass = 'fa-keyboard';
                else if (comp.includes('info')) iconClass = 'fa-info-circle';
                else if (comp.includes('dxdiag')) iconClass = 'fa-laptop';
            }
            componentIcon.className = `fas ${iconClass} me-2 text-primary`;
            componentName.appendChild(componentIcon);
            
            const nameText = document.createElement('span');
            
            // Use specific names for known component types
            if (item.component) {
                const comp = item.component.toLowerCase();
                if (comp === 'info') {
                    nameText.textContent = 'تفاصيل اللابتوب';
                } else if (comp === 'cpu') {
                    nameText.textContent = 'اختبار البروسيسور';
                } else if (comp === 'gpu') {
                    nameText.textContent = 'اختبار كارت الشاشة';
                } else if (comp.includes('hdd') || comp.includes('storage')) {
                    nameText.textContent = 'اختبار الهارد';
                } else if (comp === 'battery') {
                    nameText.textContent = 'اختبار البطارية';
                } else if (comp === 'keyboard') {
                    nameText.textContent = 'اختبار الكيبورد';
                } else if (comp === 'dxdiag') {
                    nameText.textContent = 'اختبار DxDiag';
                } else {
                    nameText.textContent = `اختبار ${item.component}`;
                }
            } else {
                nameText.textContent = item.name || `اختبار المكون #${index + 1}`;
            }
            
            componentName.appendChild(nameText);
            
            cardHeader.appendChild(componentName);
            card.appendChild(cardHeader);
            
            // Create card body with the screenshot in a row layout
            const cardBody = document.createElement('div');
            cardBody.className = 'card-body p-0';
            
            const row = document.createElement('div');
            row.className = 'row g-0';
            
            // Screenshot column - larger on desktop
            const imgCol = document.createElement('div');
            imgCol.className = 'col-lg-8 col-md-7';
            
            const imgWrapper = document.createElement('div');
            imgWrapper.className = 'position-relative';
            
            const img = document.createElement('img');
            img.src = item.url;
            img.alt = item.name || 'لقطة شاشة اختبار';
            img.className = 'img-fluid w-100';
            img.style.maxHeight = '550px';
            img.style.objectFit = 'contain';
            
            // Add zoom button overlay
            const zoomOverlay = document.createElement('div');
            zoomOverlay.className = 'position-absolute bottom-0 end-0 p-3';
            
            const zoomBtn = document.createElement('button');
            zoomBtn.className = 'btn btn-light btn-sm shadow-sm';
            zoomBtn.innerHTML = '<i class="fas fa-search-plus me-2"></i>عرض';
            zoomBtn.onclick = () => {
                // Store current test screenshots for navigation
                galleryImages = testScreenshots; 
                openGalleryLightbox(index);
            };
            
            zoomOverlay.appendChild(zoomBtn);
            imgWrapper.appendChild(img);
            imgWrapper.appendChild(zoomOverlay);
            imgCol.appendChild(imgWrapper);
            
            // Explanation column
            const explanationCol = document.createElement('div');
            explanationCol.className = 'col-lg-4 col-md-5 bg-light';
            
            const explanationContent = document.createElement('div');
            explanationContent.className = 'p-4';
            
            // Test title and status
            const titleDiv = document.createElement('div');
            titleDiv.className = 'mb-4';
            
            const title = document.createElement('h5');
            title.className = 'mb-3 border-bottom pb-2';
            title.innerHTML = '<i class="fas fa-info-circle me-2 text-primary"></i>شرح الاختبار';
            titleDiv.appendChild(title);
            
            // Create description with default text if no notes provided
            const description = document.createElement('p');
            description.className = 'mb-4';
            
            // Default descriptions based on component type
            let descriptionText = '';
            if (item.notes) {
                descriptionText = item.notes;
            } else if (item.component) {
                const comp = item.component.toLowerCase();
                if (comp.includes('cpu')) {
                    descriptionText = 'لـ Stress Test للبروسيسور بيختبر قوة المعالج تحت ضغط تقيل، علشان يشوف لو هيقدر يشتغل بكفاءة في أقصى ظروف، وبيكشف لو في مشاكل زي السخونية أو الأداء الضعيف. يعني كأنك بتحط المعالج في "تمرين شاق" علشان تشوف هيستحمل ولا لأ..';
                }
                else if(comp.includes('gpu')){
                    descriptionText = 'برنامج FurMark بيعمل stress test لكارت الشاشة، يعني بيشغله بأقصى طاقته علشان يشوف هيسخن قد إيه ويقدر يستحمل الضغط ولا لأ. مفيد علشان تختبر التبريد وتشوف لو في مشاكل زي الحرارة العالية أو تهنيج الجهاز أثناء الألعاب او وقت الضغط.'
                }
                else if (comp.includes('hdd') || comp.includes('storage')) {
                    descriptionText = 'برنامج Hard Disk Sentinel بيكشف حالة الهارد، سواء HDD أو SSD، وبيقولك لو في مشاكل زي الباد سيكتور أو أداء ضعيف. كأنك بتعمل كشف شامل للهارد علشان تطمن إنه شغال تمام ومش هيفاجئك بعطل مفاجئ.';
                    
                }
                else if (comp.includes('battery')) {
                    descriptionText = 'الصورة دي لقطة من شاشة بتبين تفاصيل حالة بطارية اللابتوب، من خلال الـ BIOS .\n\nليه بنعمل الاختبار؟\n\nالهدف إنك تتأكد إن البطارية شغالة كويس وسليمة، يعني مش بتسخن أكتر من اللازم، ومش بتفقد شحن بسرعة، وبتدي الأداء اللي المفروض.\n\nتبص على إيه؟\n\nالحالة العامة: لو مكتوب إن البطارية سليمة، يبقى تمام.\nالسعة الحالية: لو السعة قليلة جدًا، يبقى البطارية بقت ضعيفة.\nلو فيه رسايل تحذير أو مشاكل، يعني فيه عيب في البطارية.\nالمخرجات إيه؟\n\nالحالة: (ممتاز) البطارية سليمة وسعتها كويسة،وبتعدي اقل وقت استخدام داخل الضمان ساعتين.';
                }
                else if(comp.includes('keyboard')){
                    descriptionText = 'اختبار زرار الكيبورد بيشوف إذا كانت كل الزراير شغالة صح ولا لأ. بتضغط على كل زر وبتشوف لو الجهاز بيستجيب، وده مفيد في ان نتأكد لو في زراير مش شغالة أو بتعلق.';
                }
                else if (comp.includes('info')){
                    descriptionText = 'الشاشة اللي بتعرض معلومات الجهاز بتوريك حاجات زي ال (Serial Number) واللي عامل زي البصمة لكل لابتوب ، نوع المعالج (CPU)، الرامات (Memory)، كارت الشاشة (GPU)، نسخة الـ BIOS، وكمان شوية معلومات عن النظام والتعريفات. يعني بتديك نظرة سريعة وشاملة عن مكونات الجهاز وتفاصيلة كاملة.';
                }
                else if (comp.includes('dxdiag')){
                    descriptionText = 'أداة dxdiag بتجمعلك معلومات عن الجهاز، زي كارت الشاشة، المعالج، الرامات، ونظام التشغيل، وكمان بتكشف لو في مشاكل في الـ DirectX. يعني باختصار، بتديك تقرير سريع عن حالة الجهاز، خصوصًا لو في مشكلة في الألعاب أو الجرافيكس.';
                }
                 else {
                    descriptionText = 'الصورة دي بتوضح نتايج الاختبارات اللي اتعملت على الجهاز عشان نقيس الأداء ونتأكد إن كل حاجة حالتها ممتازة.';
                }
            } else {
                descriptionText = 'الصورة دي بتوضح نتايج الاختبارات اللي اتعملت على الجهاز عشان نقيس الأداء ونتأكد إن كل حاجة حالتها ممتازة.';
            }
            
            description.textContent = descriptionText;
            explanationContent.appendChild(titleDiv);
            explanationContent.appendChild(description);
            
            // Show test result if available
            if (item.status || item.result) {
                const resultDiv = document.createElement('div');
                resultDiv.className = 'alert alert-info mt-3';
                
                const resultTitle = document.createElement('h6');
                resultTitle.className = 'alert-heading';
                resultTitle.innerHTML = '<i class="fas fa-clipboard-check me-2"></i>نتيجة الاختبار';
                
                const resultText = document.createElement('p');
                resultText.className = 'mb-0';
                resultText.textContent = item.result || item.status || 'اكتمل الاختبار بنجاح';
                
                resultDiv.appendChild(resultTitle);
                resultDiv.appendChild(resultText);
                explanationContent.appendChild(resultDiv);
            }
            
            explanationCol.appendChild(explanationContent);
            
            // Add columns to row
            row.appendChild(imgCol);
            row.appendChild(explanationCol);
            
            // Add row to card body
            cardBody.appendChild(row);
            card.appendChild(cardBody);
            
            // Add full card to section container
            screenshotSection.appendChild(card);
            
            // Add section to main container
            testScreenshotsContainer.appendChild(screenshotSection);
        });
    }

    function populateHardwareComponentsTable(hardwareStatusData) {
        hardwareStatusTableBody.innerHTML = ''; // Clear previous
        if (!Array.isArray(hardwareStatusData) || hardwareStatusData.length === 0) {
            hardwareStatusTableBody.innerHTML = '<tr><td colspan="2" class="text-center text-muted">لا توجد بيانات عن حالة مكونات الجهاز.</td></tr>';
            return;
        }

        const componentNameMap = {
            // Hardware components mapping
            'microphone': 'الميكروفون',
            'camera': 'الكاميرا',
            'Wi-Fi': 'Wi-Fi',
            'LAN': 'منفذ Ethernet (LAN)',
            'Ports': 'منافذ USB,Type-C',
            'keyboard': 'لوحة المفاتيح',
            'Touchpad': 'Touchpad',
            'card': 'Card Reader',
            'audio_jack': 'منفذ الصوت',
            'DisplayPort': 'منفذ العرض (HDMI)',
            'Bluetooth': 'بلوتوث',
            'speakers': 'السماعات',
            'touchscreen': 'شاشة التاتش'
        };

        // Filter out items with type "note"
        const filteredHardwareData = hardwareStatusData.filter(item => item.type !== 'note');
        
        filteredHardwareData.forEach(item => {
            const row = hardwareStatusTableBody.insertRow();
            const cellComponent = row.insertCell();
            const cellStatus = row.insertCell();

            cellComponent.textContent = componentNameMap[item.componentName] || item.componentName;
            
            const statusBadge = document.createElement('span');
            statusBadge.className = `badge ${getComponentStatusClass(item.status)}`;
            statusBadge.textContent = translateComponentStatus(item.status);
            cellStatus.appendChild(statusBadge);
        });
        // Initialize tooltips if any
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }

    function translateComponentStatus(status) {
        const statuses = {
            'working': 'يعمل',
            'not_working': 'لايعمل',
            'not_available': 'غير موجود بالجهاز'
        };
        return statuses[status.toLowerCase()] || status;
    }

    function getComponentStatusClass(status) {
        const lowerStatus = status.toLowerCase();
        if (['working'].includes(lowerStatus)) return 'bg-success';
        if (lowerStatus === 'not_working') return 'bg-danger';
        if (lowerStatus === 'not_available') return 'bg-secondary';
        return 'bg-light text-dark';
    }

    // Step navigation logic
    function updateSteps() {
        // Scroll to top of the page with a smooth animation
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
        
        // Get visible steps and step items (excluding hidden ones)
        const visibleSteps = Array.from(steps).filter(step => step.style.display !== 'none');
        const visibleStepItems = Array.from(stepItems).filter(item => item.style.display !== 'none');
        
        // Update step visibility
        steps.forEach((step, index) => {
            if (index + 1 === currentStep) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });

        // Update step items with proper indexing for visible items
        stepItems.forEach((item, index) => {
            const button = item.querySelector('.step-button');
            if (!button) return;
            
            // Skip hidden items
            if (item.style.display === 'none') {
                return;
            }
            
            // Calculate the visible step number for this item
            const visibleStepNumber = visibleStepItems.indexOf(item) + 1;
            
            if (visibleStepNumber === currentStep) {
                item.classList.add('active');
                button.classList.remove('btn-outline-primary');
                button.classList.add('btn-primary');
            } else if (visibleStepNumber < currentStep) {
                item.classList.add('completed');
                item.classList.remove('active');
                button.classList.remove('btn-primary');
                button.classList.add('btn-success');
            } else {
                item.classList.remove('active', 'completed');
                button.classList.remove('btn-primary', 'btn-success');
                button.classList.add('btn-outline-primary');
            }
        });

        // Update navigation buttons
        prevBtn.disabled = currentStep === 1;
        nextBtn.disabled = currentStep === visibleSteps.length;
        
        // Update progress bar based on visible steps
        const progressPercentage = ((currentStep - 1) / (visibleSteps.length - 1)) * 100;
        progressBar.style.width = `${progressPercentage}%`;
    }

    nextBtn.addEventListener('click', () => {
        const visibleSteps = Array.from(steps).filter(step => step.style.display !== 'none');
        if (currentStep < visibleSteps.length) {
            // Scroll to top of the page with a smooth animation
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
            
            currentStep++;
            updateSteps();
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentStep > 1) {
            currentStep--;
            updateSteps();
        }
    });

    stepItems.forEach(item => {
        item.addEventListener('click', (e) => {
            // Skip hidden items
            if (item.style.display === 'none') {
                return;
            }
            
            // Allow navigation by clicking step items if needed and if step is not disabled
            const stepNumber = parseInt(item.dataset.step);
            if (stepNumber) {
                currentStep = stepNumber;
                updateSteps();
            }
        });
    });

    // Set up standalone fullscreen button
    if (standaloneFullscreenBtn) {
        standaloneFullscreenBtn.addEventListener('click', function() {
            console.log('Standalone fullscreen button clicked');
            toggleFullscreen();
        });
    }
    
    // Initial setup
    fetchReportData();
    updateSteps();
});
