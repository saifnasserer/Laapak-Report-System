/**
 * Laapak Report System - Report Page JavaScript
 * Handles functionality specific to the report viewing page
 * Enhanced with step-by-step walkthrough for clients
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize header component
    const header = new LpkHeader({
        containerId: 'header-container',
        activeItem: 'reports',
    });
    
    // Initialize components
    initCopyLink();
    initStarRating();
    initReviewForm();
    initDeviceGallery();
    initTechGallery();
    
    // Initialize step-by-step walkthrough
    initReportWalkthrough();
    
    // Cache report data for offline access
    cacheReportData();
    
    // Check for URL parameters to auto-scroll to specific section
    handleUrlParameters();
});

/**
 * Initialize Copy Link functionality 
 * This function handles copying the report URL to clipboard
 */
function initCopyLink() {
    const copyLinkBtn = document.getElementById('copyLinkBtn');
    
    if (copyLinkBtn) {
        copyLinkBtn.addEventListener('click', function() {
            // Get the current URL
            const reportUrl = window.location.href;
            
            // Copy to clipboard
            navigator.clipboard.writeText(reportUrl).then(function() {
                // Change button text temporarily to indicate success
                const originalText = copyLinkBtn.innerHTML;
                copyLinkBtn.innerHTML = '<i class="fas fa-check me-2"></i> تم نسخ الرابط';
                
                // Revert button text after 2 seconds
                setTimeout(() => {
                    copyLinkBtn.innerHTML = originalText;
                }, 2000);
            }).catch(function() {
                // Fallback for browsers that don't support clipboard API
                const textArea = document.createElement('textarea');
                textArea.value = reportUrl;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                alert('تم نسخ رابط التقرير بنجاح');
            });
        });
    }
}

/**
 * Cache report data for offline access
 */
function cacheReportData() {
    // If we're online and have the Cache API available
    if (navigator.onLine && 'caches' in window) {
        const reportId = getReportIdFromUrl();
        const reportData = {
            id: reportId,
            customerName: document.querySelector('.customer-name')?.textContent || 'أحمد محمد السيد',
            orderNumber: document.querySelector('.order-number')?.textContent || 'LAP-2025-0001',
            deviceModel: document.querySelector('.device-model')?.textContent || 'Dell XPS 15 9570',
            inspectionDate: document.querySelector('.inspection-date')?.textContent || '07-05-2025',
            status: document.querySelector('.status-badge')?.textContent || 'سليم',
            // Add more fields as needed
        };
        
        // Store in localStorage for simplicity
        localStorage.setItem(`report_${reportId}`, JSON.stringify(reportData));
        
        console.log('Report data cached for offline use');
    }
}

/**
 * Get the report ID from the URL
 * @returns {string} The report ID
 */
function getReportIdFromUrl() {
    // In a real implementation, this would extract the report ID from the URL parameters
    // For the prototype, we'll return a placeholder ID
    return 'LAP-2025-0001';
}

/**
 * Initialize star rating system
 */
function initStarRating() {
    const starLabels = document.querySelectorAll('.star-label');
    const ratingOutput = document.querySelector('.selected-rating');
    
    if (!starLabels.length || !ratingOutput) return;
    
    // Add hover effect and click handling
    starLabels.forEach(label => {
        // Hover effects
        label.addEventListener('mouseenter', function() {
            // Get current star and all previous stars
            const currentStar = this;
            const currentStarValue = currentStar.getAttribute('for').replace('star', '');
            
            // Reset all stars first
            starLabels.forEach(s => s.querySelector('i').className = 'far fa-star fa-2x mx-1');
            
            // Fill current and all previous stars
            starLabels.forEach(star => {
                const starValue = star.getAttribute('for').replace('star', '');
                if (starValue <= currentStarValue) {
                    star.querySelector('i').className = 'fas fa-star fa-2x mx-1 text-warning';
                }
            });
        });
        
        // Mouse leave - restore actual rating
        label.addEventListener('mouseleave', function() {
            updateStarDisplay();
        });
        
        // Click handling
        label.addEventListener('click', function() {
            const input = document.getElementById(this.getAttribute('for'));
            input.checked = true;
            updateStarDisplay();
            ratingOutput.textContent = input.value + ' من 5';
        });
    });
    
    // Function to update star display based on selected rating
    function updateStarDisplay() {
        // Reset all stars first
        starLabels.forEach(s => s.querySelector('i').className = 'far fa-star fa-2x mx-1');
        
        // Find selected rating
        const selectedInput = document.querySelector('input[name="rating"]:checked');
        if (selectedInput) {
            const value = parseInt(selectedInput.value);
            
            // Fill in stars up to the selected rating
            starLabels.forEach(star => {
                const starValue = parseInt(star.getAttribute('for').replace('star', ''));
                if (starValue <= value) {
                    star.querySelector('i').className = 'fas fa-star fa-2x mx-1 text-warning';
                }
            });
        }
    }
}

/**
 * Initialize review form submission
 */
function initReviewForm() {
    const reviewForm = document.getElementById('reviewForm');
    const reviewThanks = document.getElementById('reviewThanks');
    
    if (reviewForm && reviewThanks) {
        reviewForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const rating = document.querySelector('input[name="rating"]:checked')?.value || 0;
            const feedback = document.getElementById('reviewFeedback').value;
            
            // In a real app, this would submit to a server
            console.log('Review submitted:', { rating, feedback });
            
            // Show thank you message
            reviewForm.classList.add('d-none');
            reviewThanks.classList.remove('d-none');
            
            // In a real app, this would be sent to a server via fetch/AJAX
            // fetch('/api/reviews', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({ rating, feedback, reportId: getReportIdFromUrl() })
            // });
        });
    }
}

/**
 * Initialize the step-by-step walkthrough for the report
 * This creates a guided tour of the report sections for better client understanding
 */
function initReportWalkthrough() {
    // Create the walkthrough container
    createWalkthroughUI();
    
    // Get all report sections
    const reportSections = document.querySelectorAll('.card.mb-4.shadow');
    
    // Create step indicators
    createStepIndicators(reportSections.length);
    
    // Initialize the first step
    activateStep(0);
    
    // Add event listeners to navigation buttons
    document.getElementById('prevStepBtn').addEventListener('click', navigateToPrevStep);
    document.getElementById('nextStepBtn').addEventListener('click', navigateToNextStep);
    
    // Add section links to quick navigation
    populateQuickNavigation(reportSections);
}

/**
 * Create the walkthrough UI elements
 */
function createWalkthroughUI() {
    // Create walkthrough container
    const walkthroughContainer = document.createElement('div');
    walkthroughContainer.className = 'walkthrough-container card shadow-sm mb-4 ';
    walkthroughContainer.style.top = '20px';
    walkthroughContainer.style.zIndex = '100';
    walkthroughContainer.innerHTML = `
        <div class="card-header bg-dark-green text-white d-flex justify-content-between align-items-center">
            <h5 class="mb-0"><i class="fas fa-route me-2"></i> دليل التقرير</h5>
            <button type="button" class="btn btn-sm btn-outline-light" id="toggleWalkthroughBtn">
                <i class="fas fa-minus"></i>
            </button>
        </div>
        <div class="card-body" id="walkthroughContent">   
            
            <div class="step-description mb-3" id="stepDescription">
                <!-- Step description will be inserted here -->
            </div>
            
            <div class="step-indicators d-flex justify-content-center mb-3" id="stepIndicators">
                <!-- Step indicators will be inserted here -->
            </div>
            
            <div class="d-flex justify-content-between">
                <button type="button" class="btn btn-outline-secondary" id="prevStepBtn" disabled>
                    <i class="fas fa-arrow-right me-1"></i> السابق
                </button>
                
                <button type="button" class="btn btn-primary" id="nextStepBtn">
                    التالي <i class="fas fa-arrow-left ms-1"></i>
                </button>
            </div>
        </div>
    `;
    
    // Insert the walkthrough container at the top of the content area
    const contentArea = document.querySelector('.container.py-4');
    contentArea.insertBefore(walkthroughContainer, contentArea.firstChild);
    
    // Add toggle functionality for the walkthrough
    document.getElementById('toggleWalkthroughBtn').addEventListener('click', function() {
        const content = document.getElementById('walkthroughContent');
        const icon = this.querySelector('i');
        
        if (content.style.display === 'none') {
            content.style.display = 'block';
            icon.className = 'fas fa-minus';
        } else {
            content.style.display = 'none';
            icon.className = 'fas fa-plus';
        }
    });
}

/**
 * Create step indicators based on the number of report sections
 * @param {number} stepCount - The number of steps/sections in the report
 */
function createStepIndicators(stepCount) {
    const indicatorsContainer = document.getElementById('stepIndicators');
    
    // Clear existing indicators
    indicatorsContainer.innerHTML = '';
    
    // Add welcome step indicator (step 0)
    const welcomeIndicator = document.createElement('div');
    welcomeIndicator.className = 'step-indicator active';
    welcomeIndicator.setAttribute('data-step', 0);
    welcomeIndicator.innerHTML = `<i class="fas fa-home"></i>`;
    welcomeIndicator.title = 'مرحباً';
    
    // Add click event to navigate to welcome step
    welcomeIndicator.addEventListener('click', function() {
        activateStep(0);
    });
    
    indicatorsContainer.appendChild(welcomeIndicator);
    
    // Create step indicators for the rest of the sections
    for (let i = 0; i < stepCount; i++) {
        const indicator = document.createElement('div');
        indicator.className = 'step-indicator';
        indicator.setAttribute('data-step', i + 1); // +1 because we added the welcome step
        indicator.innerHTML = `<span>${i + 1}</span>`;
        
        // Add click event to navigate to this step
        indicator.addEventListener('click', function() {
            activateStep(parseInt(this.getAttribute('data-step')));
        });
        
        indicatorsContainer.appendChild(indicator);
    }
}

/**
 * Populate the quick navigation dropdown with section links
 * @param {NodeList} sections - The report sections
 */
function populateQuickNavigation(sections) {
    const quickNavMenu = document.getElementById('quickNavMenu');
    
    // Clear existing menu items
    quickNavMenu.innerHTML = '';
    
    // Add welcome step to quick navigation
    const welcomeItem = document.createElement('li');
    const welcomeLink = document.createElement('a');
    welcomeLink.className = 'dropdown-item';
    welcomeLink.href = '#';
    welcomeLink.innerHTML = `<i class="fas fa-home me-2"></i> مرحباً بك`;
    
    // Add click event to navigate to welcome step
    welcomeLink.addEventListener('click', function(e) {
        e.preventDefault();
        activateStep(0);
    });
    
    welcomeItem.appendChild(welcomeLink);
    quickNavMenu.appendChild(welcomeItem);
    
    // Add divider
    const divider = document.createElement('li');
    divider.innerHTML = '<hr class="dropdown-divider">';
    quickNavMenu.appendChild(divider);
    
    // Section titles
    const sectionTitles = [
        'معلومات عامة',
        'فحوصات الجهاز',
        'فحص الشكل الخارجي',
        'الملاحظات',
        'روابط مساعدة'
    ];
    
    // Section icons
    const sectionIcons = [
        'fa-info-circle',
        'fa-microchip',
        'fa-laptop',
        'fa-clipboard-list',
        'fa-link'
    ];
    
    // Create menu items for each section
    sections.forEach((section, index) => {
        if (index < sectionTitles.length) {
            const menuItem = document.createElement('li');
            const link = document.createElement('a');
            link.className = 'dropdown-item';
            link.href = '#';
            link.innerHTML = `<i class="fas ${sectionIcons[index]} me-2"></i> ${sectionTitles[index]}`;
            
            // Add click event to navigate to this section
            link.addEventListener('click', function(e) {
                e.preventDefault();
                // Add 1 to index because step 0 is the welcome step
                activateStep(index + 1);
            });
            
            menuItem.appendChild(link);
            quickNavMenu.appendChild(menuItem);
        }
    });
}

/**
 * Navigate to the previous step
 */
function navigateToPrevStep() {
    const currentStep = getCurrentStep();
    
    if (currentStep > 0) {
        activateStep(currentStep - 1);
    }
}

/**
 * Navigate to the next step
 */
function navigateToNextStep() {
    const currentStep = getCurrentStep();
    const reportSections = document.querySelectorAll('.card.mb-4.shadow');
    const maxStep = reportSections.length; // Total sections + welcome step
    
    if (currentStep < maxStep) {
        activateStep(currentStep + 1);
    }
}

/**
 * Get the current active step
 * @returns {number} The current step index
 */
function getCurrentStep() {
    const activeIndicator = document.querySelector('.step-indicator.active');
    return activeIndicator ? parseInt(activeIndicator.getAttribute('data-step')) : 0;
}

/**
 * Activate a specific step in the walkthrough
 * @param {number} stepIndex - The index of the step to activate
 */
function activateStep(stepIndex) {
    // Get all report sections and step indicators
    const reportSections = document.querySelectorAll('.card.mb-4.shadow');
    const stepIndicators = document.querySelectorAll('.step-indicator');
    
    // Validate step index
    const maxStepIndex = reportSections.length; // +1 for welcome step
    if (stepIndex < 0 || stepIndex > maxStepIndex) return;
    
    // Update step indicators
    stepIndicators.forEach((indicator, index) => {
        const indicatorStep = parseInt(indicator.getAttribute('data-step'));
        if (indicatorStep === stepIndex) {
            indicator.classList.add('active');
        } else {
            indicator.classList.remove('active');
        }
        
        // Mark completed steps
        if (indicatorStep < stepIndex) {
            indicator.classList.add('completed');
        } else {
            indicator.classList.remove('completed');
        }
    });
    
    // Update navigation buttons
    const prevBtn = document.getElementById('prevStepBtn');
    const nextBtn = document.getElementById('nextStepBtn');
    
    if (prevBtn && nextBtn) {
        // Update previous button state
        prevBtn.disabled = (stepIndex === 0);
        
        // Update next button state
        nextBtn.disabled = (stepIndex === reportSections.length);
        
        // If it's the last step, change the next button text to "Finish"
        if (stepIndex === reportSections.length) {
            nextBtn.innerHTML = 'إنهاء <i class="fas fa-check ms-1"></i>';
        } else {
            nextBtn.innerHTML = 'التالي <i class="fas fa-arrow-left ms-1"></i>';
        }
    }
    
    // Update step description
    updateStepDescription(stepIndex);
    
    // Scroll to the corresponding section
    if (stepIndex === 0) {
        // For welcome step, scroll to the top of the page
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    } else if (stepIndex <= reportSections.length) {
        // For other steps, scroll to the corresponding section
        // Subtract 1 from stepIndex because step 0 is the welcome step
        scrollToSection(reportSections[stepIndex - 1]);
    }
    
    // Highlight the current section
    if (stepIndex > 0 && stepIndex <= reportSections.length) {
        highlightCurrentSection(reportSections, stepIndex - 1);
    }
}

/**
 * Update the step description based on the current step
 * @param {number} stepIndex - The index of the current step
 */
function updateStepDescription(stepIndex) {
    const descriptionContainer = document.getElementById('stepDescription');
    const stepDescriptions = [
        {
            title: 'مرحباً بك في تقرير جهازك الجديد!',
            description: 'هذا التقرير يشبه "شهادة صحة" لجهازك الجديد! يوضح لك أن كل شيء في جهازك يعمل بشكل ممتاز، تماماً مثل الطبيب عندما يخبرك أنك بصحة جيدة. 😊'
        },
        {
            title: 'معلومات عامة',
            description: 'هذا القسم يعرض المعلومات الأساسية عن جهازك وبيانات الطلب وتاريخ الفحص. يمكنك مسح رمز QR لمشاركة التقرير.'
        },
        {
            title: 'فحوصات الجهاز',
            description: 'يعرض هذا القسم نتائج الاختبارات التقنية التي تم إجراؤها على مكونات جهازك مثل المعالج وكرت الشاشة والذاكرة والتخزين والبطارية. يمكنك النقر على الصور لعرضها بحجم أكبر.'
        },
        {
            title: 'فحص الشكل الخارجي',
            description: 'يوضح هذا القسم حالة الجهاز الخارجية مع صور للواجهات المختلفة للجهاز. يمكنك مشاهدة فيديو الفحص 360 درجة للجهاز.'
        },
        {
            title: 'الملاحظات',
            description: 'يعرض هذا القسم أي ملاحظات مهمة حول جهازك والتوصيات المقترحة للصيانة أو التحسين.'
        },
        {
            title: 'روابط مساعدة',
            description: 'يوفر هذا القسم روابط مفيدة لمشاركة التقرير أو التواصل مع فريق الدعم الفني.'
        }
    ];
    
    if (stepIndex === 0) {
        // Special welcome card for step 0
        descriptionContainer.innerHTML = `
            <div class="welcome-step">
                <div class="row">
                    <div class="col-lg-8">
                        <div class="simple-explanation">
                            <div class="simple-explanation-title">
                                <i class="fas fa-info-circle"></i> ما هذا التقرير؟
                            </div>
                            <p>${stepDescriptions[0].description}</p>
                        </div>
                    </div>
                    <div class="col-lg-4 text-center">
                        <div class="emoji-status">🥳</div>
                        <h4 class="text-success">جهازك بحالة ممتازة!</h4>
                        <p class="text-muted mb-0">رقم التقرير: <span class="fw-bold">${getReportIdFromUrl() || 'LAP-2025-0001'}</span></p>
                    </div>
                </div>
                
                <div class="mt-4">
                    <h5 class="mb-3"><i class="fas fa-map-signs me-2"></i> دليلك لفهم التقرير:</h5>
                    <p>هيا نتعرف على جهازك الجديد خطوة بخطوة! 🚶‍♂️</p>
                </div>
            </div>
        `;
    } else if (stepIndex < stepDescriptions.length) {
        // Regular step descriptions for steps 1 and beyond
        descriptionContainer.innerHTML = `
            <h5 class="text-success mb-2">
                <i class="fas fa-info-circle me-2"></i> ${stepDescriptions[stepIndex].title}
            </h5>
            <p>${stepDescriptions[stepIndex].description}</p>
        `;
    }
}

/**
 * Scroll to a specific section
 * @param {Element} section - The section element to scroll to
 */
function scrollToSection(section) {
    if (section) {
        // Add a small delay to ensure the UI has updated
        setTimeout(() => {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
}

/**
 * Highlight the current section
 * @param {NodeList} sections - All report sections
 * @param {number} currentIndex - The index of the current section
 */
function highlightCurrentSection(sections, currentIndex) {
    // Remove highlight from all sections
    sections.forEach(section => {
        section.classList.remove('section-highlight');
    });
    
    // Add highlight to current section
    if (sections[currentIndex]) {
        sections[currentIndex].classList.add('section-highlight');
    }
}

/**
 * Handle URL parameters to auto-scroll to specific section
 */
function handleUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const section = urlParams.get('section');
    
    if (section) {
        // Map section parameter to step index
        const sectionMap = {
            'general': 0,
            'tests': 1,
            'external': 2,
            'notes': 3,
            'links': 4
        };
        
        if (sectionMap[section] !== undefined) {
            // Activate the specified step after a short delay
            setTimeout(() => {
                activateStep(sectionMap[section]);
            }, 500);
        }
    }
}

/**
 * Load report data from cache when offline
 */
function loadReportFromCache() {
    const reportId = getReportIdFromUrl();
    const cachedData = localStorage.getItem(`report_${reportId}`);
    
    if (cachedData) {
        const reportData = JSON.parse(cachedData);
        // In a real implementation, we would populate the UI with this data
        console.log('Loaded cached report data:', reportData);
        return reportData;
    }
    
    return null;
}

/**
 * Initialize the device gallery functionality
 * This handles the interactive gallery for device images
 */
function initDeviceGallery() {
    const mainImage = document.getElementById('mainGalleryImage');
    const imageCaption = document.getElementById('imageCaption');
    const thumbnails = document.querySelectorAll('.thumbnail');
    const prevBtn = document.querySelector('.gallery-prev');
    const nextBtn = document.querySelector('.gallery-next');
    const fullscreenBtn = document.querySelector('.gallery-fullscreen');
    
    if (!mainImage || !thumbnails.length) return;
    
    // Set up thumbnails
    thumbnails.forEach(thumbnail => {
        thumbnail.addEventListener('click', function() {
            // Update active state
            thumbnails.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Update main image
            const imgSrc = this.querySelector('img').getAttribute('src');
            const imgAlt = this.querySelector('img').getAttribute('alt');
            mainImage.setAttribute('src', imgSrc);
            mainImage.setAttribute('alt', imgAlt);
            
            // Update caption
            if (imageCaption) {
                imageCaption.textContent = imgAlt || 'صورة الجهاز';
            }
        });
    });
    
    // Navigation buttons
    if (prevBtn && nextBtn) {
        prevBtn.addEventListener('click', function() {
            navigateGallery(-1);
        });
        
        nextBtn.addEventListener('click', function() {
            navigateGallery(1);
        });
    }
    
    // Fullscreen button
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', function() {
            const currentImg = mainImage.getAttribute('src');
            openImageInLightbox(currentImg);
        });
    }
    
    // Main image click for lightbox
    if (mainImage) {
        mainImage.addEventListener('click', function() {
            const currentImg = this.getAttribute('src');
            openImageInLightbox(currentImg);
        });
    }
    
    // Helper function to navigate through gallery
    function navigateGallery(direction) {
        const activeThumbnail = document.querySelector('.thumbnail.active');
        if (!activeThumbnail) return;
        
        let nextThumbnail;
        
        if (direction > 0) {
            // Next image
            nextThumbnail = activeThumbnail.nextElementSibling;
            if (!nextThumbnail || !nextThumbnail.classList.contains('thumbnail')) {
                // Loop back to first
                nextThumbnail = document.querySelector('.thumbnail:first-child');
            }
        } else {
            // Previous image
            nextThumbnail = activeThumbnail.previousElementSibling;
            if (!nextThumbnail || !nextThumbnail.classList.contains('thumbnail')) {
                // Loop to last
                nextThumbnail = document.querySelector('.thumbnail:last-child');
            }
        }
        
        if (nextThumbnail) {
            nextThumbnail.click();
        }
    }
    
    // Helper function to open image in lightbox
    function openImageInLightbox(imgSrc) {
        // If lightbox library is available
        if (typeof lightbox !== 'undefined') {
            // Find the matching anchor and trigger click
            const anchors = document.querySelectorAll('a[data-lightbox="gallery"]');
            for (let i = 0; i < anchors.length; i++) {
                if (anchors[i].href.includes(imgSrc)) {
                    anchors[i].click();
                    return;
                }
            }
        } else {
            // Fallback - open image in new tab
            window.open(imgSrc, '_blank');
        }
    }
}

/**
 * Initialize the technical tests gallery functionality
 * This handles the interactive gallery for technical test results
 */
function initTechGallery() {
    const techGalleryWrapper = document.querySelector('.tech-gallery-wrapper');
    const techGalleryItems = document.querySelectorAll('.tech-gallery-item');
    const techGalleryDots = document.querySelectorAll('.tech-gallery-dot');
    const prevBtn = document.querySelector('.tech-gallery-prev-btn');
    const nextBtn = document.querySelector('.tech-gallery-next-btn');
    const techGalleryPrev = document.querySelector('.tech-gallery-prev');
    const techGalleryNext = document.querySelector('.tech-gallery-next');
    const techGalleryFullscreen = document.querySelector('.tech-gallery-fullscreen');
    
    if (!techGalleryWrapper || !techGalleryItems.length) return;
    
    let currentIndex = 0;
    const itemCount = techGalleryItems.length;
    
    // Initialize gallery
    updateGallery();
    
    // Set up navigation dots
    if (techGalleryDots.length) {
        techGalleryDots.forEach((dot, index) => {
            dot.addEventListener('click', function() {
                currentIndex = index;
                updateGallery();
            });
        });
    }
    
    // Set up navigation buttons
    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            navigateGallery(-1);
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            navigateGallery(1);
        });
    }
    
    // Additional navigation buttons
    if (techGalleryPrev) {
        techGalleryPrev.addEventListener('click', function() {
            navigateGallery(-1);
        });
    }
    
    if (techGalleryNext) {
        techGalleryNext.addEventListener('click', function() {
            navigateGallery(1);
        });
    }
    
    // Fullscreen button
    if (techGalleryFullscreen) {
        techGalleryFullscreen.addEventListener('click', function() {
            const currentItem = techGalleryItems[currentIndex];
            const imgElement = currentItem.querySelector('img');
            if (imgElement) {
                const imgSrc = imgElement.getAttribute('src');
                openTechImageInLightbox(imgSrc);
            }
        });
    }
    
    // Helper function to navigate through gallery
    function navigateGallery(direction) {
        currentIndex = (currentIndex + direction + itemCount) % itemCount;
        updateGallery();
    }
    
    // Helper function to update gallery display
    function updateGallery() {
        // Update wrapper transform
        techGalleryWrapper.style.transform = `translateX(${currentIndex * 100}%)`;
        
        // Update active dots
        if (techGalleryDots.length) {
            techGalleryDots.forEach((dot, index) => {
                if (index === currentIndex) {
                    dot.classList.add('active');
                } else {
                    dot.classList.remove('active');
                }
            });
        }
    }
    
    // Helper function to open tech image in lightbox
    function openTechImageInLightbox(imgSrc) {
        // If lightbox library is available
        if (typeof lightbox !== 'undefined') {
            // Find the matching anchor and trigger click
            const anchors = document.querySelectorAll('a[data-lightbox="tech-gallery"]');
            for (let i = 0; i < anchors.length; i++) {
                if (anchors[i].href.includes(imgSrc)) {
                    anchors[i].click();
                    return;
                }
            }
        } else {
            // Fallback - open image in new tab
            window.open(imgSrc, '_blank');
        }
    }
    
    // Add keyboard navigation
    document.addEventListener('keydown', function(e) {
        // Only if tech gallery tab is active
        const techTab = document.getElementById('technical');
        if (!techTab || !techTab.classList.contains('active')) return;
        
        if (e.key === 'ArrowLeft') {
            navigateGallery(1); // RTL layout, so left is next
        } else if (e.key === 'ArrowRight') {
            navigateGallery(-1); // RTL layout, so right is previous
        }
    });
}
