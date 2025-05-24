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
    const deviceVideoEmbed = document.getElementById('deviceVideoEmbed');
    const testScreenshotsGallery = document.getElementById('testScreenshotsGallery');
    const hardwareStatusTableBody = document.getElementById('hardwareStatusTableBody');
    const technicianNotes = document.getElementById('technicianNotes');

    const billingEnabled = document.getElementById('billingEnabled');
    const billingAmount = document.getElementById('billingAmount');
    const billingSummaryContainer = document.getElementById('billingSummaryContainer');
    const noBillingInfo = document.getElementById('noBillingInfo');

    if (!reportId) {
        document.body.innerHTML = '<div class="alert alert-danger m-5">لم يتم تحديد معرف التقرير. يرجى التأكد من صحة الرابط.</div>';
        return;
    }

    async function fetchReportData() {
        try {
            // IMPORTANT: Adjust this API endpoint to your actual backend route for fetching a single report
            const response = await fetch(`http://localhost:3001/api/reports/${reportId}`); 
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
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
        technicianNotes.textContent = get(report, 'notes');

        // Step 5: Billing Summary (Now handled by static content in Step 6 in HTML)
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
        const videoContainer = document.getElementById('deviceVideoContainer');
        if (!videoContainer) {
            console.error('Video container element not found');
            return;
        }
        
        videoContainer.innerHTML = ''; // Clear previous content
        
        // Find any video media (supports multiple types)
        const videoItems = externalImages.filter(item => {
            return item.type === 'youtube' || 
                  item.type === 'video' || 
                  (item.type === 'image' && item.url && 
                   (item.url.endsWith('.mp4') || item.url.endsWith('.webm') || item.url.endsWith('.mov')));
        });
        
        if (videoItems.length === 0) {
            videoContainer.innerHTML = '<div class="text-muted text-center py-5"><i class="fas fa-video-slash fa-3x mb-3 text-secondary"></i><p>لا يوجد فيديو مرفق للجهاز.</p></div>';
            return;
        }
        
        // Process the first video (primary video)
        const videoItem = videoItems[0];
        try {
            // Determine video type by URL or explicit type
            if (videoItem.type === 'youtube' || (videoItem.url && isYouTubeUrl(videoItem.url))) {
                embedYouTubeVideo(videoItem.url, videoContainer);
            } else if (videoItem.url.match(/\.(mp4|webm|ogg|mov)$/i)) {
                // Direct video file
                embedDirectVideo(videoItem.url, videoContainer, videoItem.autoplay);
            } else if (videoItem.url.includes('vimeo.com')) {
                // Vimeo video
                embedVimeoVideo(videoItem.url, videoContainer);
            } else {
                // Unknown format - try iframe as fallback
                const iframe = document.createElement('iframe');
                iframe.src = videoItem.url;
                iframe.setAttribute('allowfullscreen', 'true');
                iframe.width = '100%';
                iframe.height = '500px';
                iframe.style.border = 'none';
                videoContainer.appendChild(iframe);
            }
            
            // If there are multiple videos, add thumbnails below (optional feature for later)
            if (videoItems.length > 1) {
                const videoNav = document.createElement('div');
                videoNav.className = 'video-thumbnails d-flex mt-3 overflow-auto';
                // ... Implementation for multiple video navigation (future feature)
            }
            
        } catch (e) {
            console.error('Error processing video:', e);
            videoContainer.innerHTML = '<div class="alert alert-warning text-center">خطأ في معالجة الفيديو. يرجى التحقق من صحة الرابط.</div>';
        }
    }
    
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
    function embedYouTubeVideo(url, container) {
        try {
            // Clear any loading placeholders
            container.innerHTML = '';
            
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
                // Create enhanced YouTube player with custom controls
                const iframe = document.createElement('iframe');
                iframe.id = 'youtubeVideo';
                // Add enablejsapi=1 to enable the YouTube Player API
                iframe.src = `https://www.youtube.com/embed/${videoId}?rel=0&enablejsapi=1`;
                iframe.setAttribute('allowfullscreen', 'true');
                iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
                iframe.style.width = '100%';
                iframe.style.height = '400px';
                iframe.style.border = 'none';
                container.appendChild(iframe);
                
                // Include YouTube API script if it's not already loaded
                if (!window.YT) {
                    const tag = document.createElement('script');
                    tag.src = 'https://www.youtube.com/iframe_api';
                    const firstScriptTag = document.getElementsByTagName('script')[0];
                    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
                }
                
                // Set up event handler for YouTube API Ready
                window.onYouTubeIframeAPIReady = function() {
                    // Initialize the player
                    new YT.Player('youtubeVideo', {
                        events: {
                            'onReady': onPlayerReady,
                            'onStateChange': onPlayerStateChange
                        }
                    });
                };
                
            } else {
                throw new Error('Invalid YouTube URL');
            }
        } catch (e) {
            console.error('YouTube embedding error:', e);
            container.innerHTML = `
                <div class="text-center p-4">
                    <i class="fas fa-exclamation-triangle text-warning fa-2x mb-3"></i>
                    <p class="mb-0">خطأ في تضمين فيديو YouTube</p>
                </div>`;
        }
    }
    
    // Helper to embed direct video files with modern controls
    function embedDirectVideo(url, container, autoplay = false) {
        // Clear any loading placeholders
        container.innerHTML = '';
        
        // Create custom video element
        const video = document.createElement('video');
        video.id = 'deviceVideo';
        video.src = url;
        video.controls = false; // We'll use our custom controls
        video.autoplay = autoplay || false;
        video.muted = autoplay || false; // Must be muted for autoplay to work on most browsers
        video.playsInline = true;
        video.style.width = '100%';
        video.style.maxHeight = '80vh';
        video.style.backgroundColor = '#000';
        video.className = 'w-100';
        container.appendChild(video);
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
            'card_reader_status': 'مدخل الكارت',
            'touchpad_status': 'التاتش باد',
            'keyboard_status': 'لوحة المفاتيح',
            'wifi_status': 'Wi-Fi',
            'Bluetooth_status': 'البلوتوث',
            'usb_status': 'المنافذ (USB, HDMI, etc.)',
            'speakers_status': 'مكبرات الصوت',
            'microphone_status': 'الميكروفون',
            'camera_status': 'الكاميرا',
            'audio_jack_status': 'مدخل السماعات',
            // Add more mappings for hardware components with data attributes
            'microphone': 'الميكروفون',
            'camera': 'الكاميرا',
            'Wi-Fi': 'واي فاي',
            'LAN': 'منفذ الشبكة',
            'Ports': 'منافذ USB',
            'keyboard': 'لوحة المفاتيح',
            'Touchpad': 'لوحة اللمس',
            'card': 'قارئ البطاقات',
            'audio_jack': 'منفذ الصوت',
            'DisplayPort': 'منافذ العرض',
            'Bluetooth': 'البلوتوث'
        };

        hardwareStatusData.forEach(item => {
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
            'good': 'جيد',
            'working': 'يعمل',
            'issues': 'به مشاكل',
            'damaged': 'تالف',
            'not_tested': 'لم يتم اختباره',
            'missing': 'مفقود',
            'fair': 'مقبول'
        };
        return statuses[status.toLowerCase()] || status;
    }

    function getComponentStatusClass(status) {
        const lowerStatus = status.toLowerCase();
        if (['good', 'working'].includes(lowerStatus)) return 'bg-success';
        if (lowerStatus === 'fair') return 'bg-warning text-dark';
        if (['issues', 'damaged'].includes(lowerStatus)) return 'bg-danger';
        if (lowerStatus === 'missing') return 'bg-secondary';
        if (lowerStatus === 'not_tested') return 'bg-info text-dark';
        return 'bg-light text-dark';
    }

    // Step navigation logic
    function updateSteps() {
        steps.forEach((step, index) => {
            if (index + 1 === currentStep) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });

        stepItems.forEach((item, index) => {
            const button = item.querySelector('.step-button');
            if (index + 1 === currentStep) {
                item.classList.add('active');
                button.classList.remove('btn-outline-primary');
                button.classList.add('btn-primary');
            } else if (index + 1 < currentStep) {
                item.classList.add('completed'); // Optional: Mark past steps as completed
                item.classList.remove('active');
                button.classList.remove('btn-primary');
                button.classList.add('btn-success'); // Mark completed steps with success color
            } else {
                item.classList.remove('active', 'completed');
                button.classList.remove('btn-primary', 'btn-success');
                button.classList.add('btn-outline-primary');
            }
        });

        prevBtn.disabled = currentStep === 1;
        nextBtn.disabled = currentStep === steps.length;
        
        // Update progress bar
        const progressPercentage = ((currentStep -1) / (steps.length -1)) * 100;
        progressBar.style.width = `${progressPercentage}%`;
    }

    nextBtn.addEventListener('click', () => {
        if (currentStep < steps.length) {
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
            // Allow navigation by clicking step items if needed and if step is not disabled
            const stepNumber = parseInt(item.dataset.step);
            if (stepNumber) {
                currentStep = stepNumber;
                updateSteps();
            }
        });
    });

    // Initial setup
    fetchReportData();
    updateSteps();
});
