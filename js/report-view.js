document.addEventListener('DOMContentLoaded', () => {
    // Global variables for gallery and lightbox
    let currentZoomLevel = 1;
    const zoomStep = 0.25;
    const maxZoom = 3;
    const minZoom = 0.5;
    let galleryImages = [];
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
            galleryContainer.innerHTML = '<div class="col-12"><div class="alert alert-light text-center py-5"><i class="fas fa-images fa-3x mb-3 text-muted"></i><p>لا توجد صور خارجية للجهاز.</p></div></div>';
            
            // Disable gallery controls
            const galleryControls = document.getElementById('galleryControls');
            if (galleryControls) galleryControls.style.display = 'none';
            return;
        }
        
        // Set up gallery control buttons
        setupGalleryControls(imageItems.length);
        
        // Create gallery items
        imageItems.forEach((item, index) => {
            const col = document.createElement('div');
            col.className = 'col-lg-4 col-md-6 col-sm-6 gallery-item';
            
            const imgContainer = document.createElement('div');
            imgContainer.className = 'card border-0 shadow-sm h-100 overflow-hidden';
            imgContainer.dataset.index = index;
            
            const img = document.createElement('img');
            img.src = item.url;
            img.alt = item.name || 'صورة الجهاز';
            img.className = 'img-fluid card-img-top';
            img.loading = 'lazy'; // Lazy loading for better performance
            
            // Add overlay with info and view button
            const overlay = document.createElement('div');
            overlay.className = 'card-img-overlay d-flex flex-column justify-content-end p-3';
            overlay.style.background = 'linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0))';
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.3s ease';
            
            const viewBtn = document.createElement('button');
            viewBtn.className = 'btn btn-sm btn-light mt-auto align-self-end';
            viewBtn.innerHTML = '<i class="fas fa-search-plus me-1"></i> عرض';
            viewBtn.onclick = (e) => {
                e.stopPropagation();
                openGalleryLightbox(index);
            };
            
            if (item.name) {
                const caption = document.createElement('h6');
                caption.className = 'card-title text-white mb-2';
                caption.textContent = item.name;
                overlay.appendChild(caption);
            }
            
            overlay.appendChild(viewBtn);
            
            // Container click opens lightbox
            imgContainer.onclick = () => openGalleryLightbox(index);
            
            // Show overlay on hover
            imgContainer.onmouseenter = () => overlay.style.opacity = '1';
            imgContainer.onmouseleave = () => overlay.style.opacity = '0';
            
            imgContainer.appendChild(img);
            imgContainer.appendChild(overlay);
            col.appendChild(imgContainer);
            galleryContainer.appendChild(col);
        });
    }
    
    // Set up gallery control buttons
    function setupGalleryControls(imageCount) {
        const gridBtn = document.getElementById('galleryGrid');
        const sliderBtn = document.getElementById('gallerySlider');
        const galleryControls = document.getElementById('galleryControls');
        
        if (!gridBtn || !sliderBtn) return;
        
        if (imageCount <= 1) {
            galleryControls.style.display = 'none';
            return;
        }
        
        galleryControls.style.display = 'flex';
        
        // Grid view (default)
        gridBtn.classList.add('active');
        gridBtn.onclick = () => {
            gridBtn.classList.add('active');
            sliderBtn.classList.remove('active');
            document.getElementById('externalImagesGallery').className = 'row g-3 gallery-grid';
        };
        
        // Slider view
        sliderBtn.onclick = () => {
            sliderBtn.classList.add('active');
            gridBtn.classList.remove('active');
            document.getElementById('externalImagesGallery').className = 'row gallery-slider';
            // Initialize slider if needed
        };
    }
    
    // Enhanced lightbox function with navigation
    function openGalleryLightbox(index) {
        if (!galleryImages || galleryImages.length === 0) return;
        
        currentImageIndex = index;
        const lightboxModal = new bootstrap.Modal(document.getElementById('imageLightbox'));
        updateLightboxContent();
        lightboxModal.show();
        
        // Set up navigation handlers
        document.getElementById('prevImage').onclick = navigatePrevImage;
        document.getElementById('nextImage').onclick = navigateNextImage;
        
        // Add keyboard navigation
        document.addEventListener('keydown', handleLightboxKeyboard);
        
        // Update counter
        updateImageCounter();
        
        // Clean up event listeners when modal is closed
        document.getElementById('imageLightbox').addEventListener('hidden.bs.modal', () => {
            document.removeEventListener('keydown', handleLightboxKeyboard);
        }, { once: true });
    }
    
    // Update lightbox content with current image
    function updateLightboxContent() {
        if (!galleryImages || galleryImages.length === 0) return;
        
        const currentImage = galleryImages[currentImageIndex];
        const lightboxImage = document.getElementById('lightboxImage');
        const lightboxTitle = document.getElementById('imageLightboxLabel');
        
        // Reset zoom level
        currentZoomLevel = 1;
        lightboxImage.style.transform = `scale(${currentZoomLevel})`;
        
        lightboxImage.src = currentImage.url;
        lightboxImage.alt = currentImage.name || 'صورة الجهاز';
        lightboxTitle.textContent = currentImage.name || 'صورة الجهاز';
        
        // Update navigation buttons visibility
        document.getElementById('prevImage').style.visibility = currentImageIndex > 0 ? 'visible' : 'hidden';
        document.getElementById('nextImage').style.visibility = currentImageIndex < galleryImages.length - 1 ? 'visible' : 'hidden';
        
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
            document.getElementById('imageLightbox').querySelector('.btn-close').click();
        }
    }
    
    // Update image counter
    function updateImageCounter() {
        const currentIndexElement = document.getElementById('currentImageIndex');
        const totalImagesElement = document.getElementById('totalImages');
        
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
    
    // Helper to embed YouTube videos
    function embedYouTubeVideo(url, container) {
        try {
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
                const iframe = document.createElement('iframe');
                iframe.src = `https://www.youtube.com/embed/${videoId}?rel=0`;
                iframe.setAttribute('allowfullscreen', 'true');
                iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
                iframe.style.width = '100%';
                iframe.style.height = '500px';
                iframe.style.border = 'none';
                container.appendChild(iframe);
            } else {
                throw new Error('Invalid YouTube URL');
            }
        } catch (e) {
            console.error('YouTube embedding error:', e);
            container.innerHTML = '<div class="alert alert-warning text-center">خطأ في تضمين فيديو YouTube</div>';
        }
    }
    
    // Helper to embed direct video files
    function embedDirectVideo(url, container, autoplay = false) {
        const video = document.createElement('video');
        video.src = url;
        video.controls = true;
        video.autoplay = autoplay || false;
        video.muted = autoplay || false; // Must be muted for autoplay to work on most browsers
        video.playsInline = true;
        video.style.width = '100%';
        video.style.maxHeight = '80vh';
        video.style.backgroundColor = '#000';
        video.className = 'shadow';
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
        const testScreenshots = [...screenshotItems];
        
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
                else if (comp.includes('memory') || comp.includes('ram')) iconClass = 'fa-memory';
                else if (comp.includes('disk') || comp.includes('storage')) iconClass = 'fa-hdd';
                else if (comp.includes('battery')) iconClass = 'fa-battery-full';
                else if (comp.includes('display') || comp.includes('screen')) iconClass = 'fa-desktop';
                else if (comp.includes('keyboard')) iconClass = 'fa-keyboard';
            }
            componentIcon.className = `fas ${iconClass} me-2 text-primary`;
            componentName.appendChild(componentIcon);
            
            const nameText = document.createElement('span');
            nameText.textContent = item.component ? 
                `اختبار ${item.component}` : 
                (item.name || `اختبار المكون #${index + 1}`);
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
                    descriptionText = 'اختبار المعالج يقيس أداء وحدة المعالجة المركزية وقدرتها على تنفيذ العمليات الحسابية.';
                }
                else if(comp.includes('gpu')){
                    descriptionText = 'ليه بنعمل الاختبار؟\n\nالهدف إننا نتأكد إن الكارت شغال كويس ويقدر يستحمل المهام التقيلة زي الألعاب أو البرامج اللي محتاجة جرافيكس، من غير ما يسخن أكتر من اللازم أو يتعطل.\n\nتبص على إيه؟\n\nالحرارة: لازم تكون في المستوى الطبيعي مش عالية أوي عشان متعملش مشكلة.\nنسبة الاستخدام: تبقى ثابتة ومرتفعة، يعني الاختبار شغال صح.\n\nالمخرجات إيه؟\n\nممتاز: الحرارة معقولة، الكارت شغال ودرجة الحرارة في المستوى الطبيعي في حالة الضغط.\nمشكلة: الكارت بيتوقف، او بيحصل تهنيج (freeze) وقت اختبار الضغط.'
                }
                else if (comp.includes('disk') || comp.includes('storage')) {
                    descriptionText = 'الصورة دي بتوضح نتيجة فحص لهاردات الجهاز باستخدام برنامج اسمه "Hard Disk Sentinel"، والبرنامج بيقيّم الهارد من حيث الأداء والصحة العامة، وبيكشف لو فيه قطاعات بايظة أو مشاكل محتملة.\n\n✅ إزاي نقيم الحالة؟\n🔹 الصحة (Health):\nدي بتوضح قد إيه الهارد سليم ومفيهوش مشاكل.\n\nمن 85% لـ 100% → حالة ممتازة\n\nمن 75% لـ 85% → حالة متوسطة \n\nأقل من 75% → حالة سيئة\n\n🔹 الأداء (Performance):\nده بيقيّم سرعة الهارد وكفاءته.\n\n100% → أداء ممتاز\n\nأقل من 90% → محتاج تراجع لو فيه بطء أو مشاكل في نقل البيانات\n\n\n🔹 درجة الحرارة\n🔹 عدد القطاعات البايظة (Bad Sectors) لو موجود\n🔹 العُمر\n\n🟢 النتيجة العامة حسب الصورة:\nالهارد حالته ممتازة جدًا، ينفع للاستخدام بدون أي قلق .';
                    
                }
                else if (comp.includes('battery')) {
                    descriptionText = 'الصورة دي لقطة من شاشة بتبين تفاصيل حالة بطارية اللابتوب، من خلال الـ BIOS .\n\nليه بنعمل الاختبار؟\n\nالهدف إنك تتأكد إن البطارية شغالة كويس وسليمة، يعني مش بتسخن أكتر من اللازم، ومش بتفقد شحن بسرعة، وبتدي الأداء اللي المفروض.\n\nتبص على إيه؟\n\nالحالة العامة: لو مكتوب إن البطارية سليمة، يبقى تمام.\nالسعة الحالية: لو السعة قليلة جدًا، يبقى البطارية بقت ضعيفة.\nلو فيه رسايل تحذير أو مشاكل، يعني فيه عيب في البطارية.\nالمخرجات إيه؟\n\nالحالة: (ممتاز) البطارية سليمة وسعتها كويسة،وبتعدي اقل وقت استخدام داخل الضمان ساعتين.';
                }
                else if(comp.includes('keyboard')){
                    descriptionText = 'الصورة دي بتوضح نتيجة اختبار للكيبورد باستخدام برنامج بيكشف إذا كانت المفاتيح اللي موجودة فعليًا في الكيبورد شغالة ولا لأ. كل مفتاح بيتضغط وبيشتغل، بيظهر باللون الأخضر، وده معناه إنه بيشتغل بشكل سليم وسَلِس.✅ إزاي نقيم الحالة؟🔹 المفاتيح اللي ظهرت باللون الأخضر:دي المفاتيح اللي البرنامج اكتشف إنها موجودة في الكيبورد وتم اختبارها، وكلها شغالة بدون أي مشكلة.🔹 المفاتيح اللي مش مضيئة:دي مش معناها إن هي مش موجودة في الكيبورد.🔹 سلاسة الضغط:الاختبار كمان بيوضح إن المفاتيح اشتغلت من أول ضغطة، وده معناه إن مفيش تعليق أو تهنيج في أي زرار.🟢 النتيجة العامة حسب الصورة:الكيبورد شغال بكفاءة وكل المفاتيح اللي موجودة عليه شغالة بشكل طبيعي وسَلِس، ومفيش أي ملاحظات أو مشاكل ظاهرة في الاستخدام.';
                }
                else if (comp.includes('info')){
                    descriptionText = 'ليه بنعمل الاختبار؟\nالهدف إنك تعرف مواصفات وتفاصيل اللابتوب كاملة، عشان تتأكد إن كل حاجة شغالة تمام ومفيش مشاكل في المكونات، علي سبيل المثال تفاصيل الرامات وسيريال الجهاز.\n\nتبص على إيه؟\n\nالسيريال (الرقم التسلسلي): ده عامل زي البصمة لكل لابتوب رقم فريد مختلف لكل لابتوب عن التاني ومش بيتكرر.\nالرامات: نوعها وسعتها وسرعتها واماكنها.\nالبروسيسور: اسمه وعدد الأنوية، عشان تشوف قوته وetailed.\nكارت الجرافيكس: نوعه واسمة عشان تأكد علي المواصفات.\nنظام التشغيل: إصدار الويندوز أو النظام وetailed.';
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
            hardwareStatusTableBody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">لا توجد بيانات عن حالة مكونات الجهاز.</td></tr>';
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
        };

        hardwareStatusData.forEach(item => {
            const row = hardwareStatusTableBody.insertRow();
            const cellComponent = row.insertCell();
            const cellStatus = row.insertCell();
            const cellNotes = row.insertCell();

            cellComponent.textContent = componentNameMap[item.componentName] || item.componentName;
            
            const statusBadge = document.createElement('span');
            statusBadge.className = `badge ${getComponentStatusClass(item.status)}`;
            statusBadge.textContent = translateComponentStatus(item.status);
            cellStatus.appendChild(statusBadge);

            cellNotes.textContent = item.notes || '-';
            if (item.notes) {
                cellNotes.setAttribute('data-bs-toggle', 'tooltip');
                cellNotes.setAttribute('data-bs-placement', 'top');
                cellNotes.setAttribute('title', item.notes);
            }
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
