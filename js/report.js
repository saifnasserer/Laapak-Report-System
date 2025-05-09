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
    walkthroughContainer.className = 'walkthrough-container card shadow-sm mb-4 sticky-top';
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
            <p class="text-muted mb-3">هذا الدليل سيساعدك في فهم تقرير فحص جهازك خطوة بخطوة</p>
            
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
                <div class="dropdown">
                    <button class="btn btn-outline-success dropdown-toggle" type="button" id="quickNavDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                        الانتقال السريع
                    </button>
                    <ul class="dropdown-menu" id="quickNavMenu" aria-labelledby="quickNavDropdown">
                        <!-- Quick navigation links will be inserted here -->
                    </ul>
                </div>
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
    
    for (let i = 0; i < stepCount; i++) {
        const indicator = document.createElement('div');
        indicator.className = 'step-indicator';
        indicator.setAttribute('data-step', i);
        indicator.innerHTML = `<span>${i + 1}</span>`;
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
    
    // Define section titles and icons
    const sectionInfo = [
        { title: 'معلومات عامة', icon: 'fas fa-info-circle' },
        { title: 'فحوصات الجهاز', icon: 'fas fa-laptop-medical' },
        { title: 'فحص الشكل الخارجي', icon: 'fas fa-camera' },
        { title: 'الملاحظات', icon: 'fas fa-clipboard-list' },
        { title: 'روابط مساعدة', icon: 'fas fa-link' }
    ];
    
    // Create navigation items
    sections.forEach((section, index) => {
        if (index < sectionInfo.length) {
            const item = document.createElement('li');
            item.innerHTML = `
                <a class="dropdown-item" href="#" data-step="${index}">
                    <i class="${sectionInfo[index].icon} me-2"></i> ${sectionInfo[index].title}
                </a>
            `;
            
            item.querySelector('a').addEventListener('click', function(e) {
                e.preventDefault();
                const step = parseInt(this.getAttribute('data-step'));
                activateStep(step);
            });
            
            quickNavMenu.appendChild(item);
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
    const totalSteps = document.querySelectorAll('.step-indicator').length;
    
    if (currentStep < totalSteps - 1) {
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
    if (stepIndex < 0 || stepIndex >= reportSections.length) return;
    
    // Update step indicators
    stepIndicators.forEach((indicator, index) => {
        if (index === stepIndex) {
            indicator.classList.add('active');
        } else {
            indicator.classList.remove('active');
        }
        
        // Mark completed steps
        if (index < stepIndex) {
            indicator.classList.add('completed');
        } else {
            indicator.classList.remove('completed');
        }
    });
    
    // Update navigation buttons
    document.getElementById('prevStepBtn').disabled = (stepIndex === 0);
    document.getElementById('nextStepBtn').disabled = (stepIndex === reportSections.length - 1);
    
    // If it's the last step, change the next button text to "Finish"
    if (stepIndex === reportSections.length - 1) {
        document.getElementById('nextStepBtn').innerHTML = 'إنهاء <i class="fas fa-check ms-1"></i>';
    } else {
        document.getElementById('nextStepBtn').innerHTML = 'التالي <i class="fas fa-arrow-left ms-1"></i>';
    }
    
    // Update step description
    updateStepDescription(stepIndex);
    
    // Scroll to the section
    scrollToSection(reportSections[stepIndex]);
    
    // Highlight the current section
    highlightCurrentSection(reportSections, stepIndex);
}

/**
 * Update the step description based on the current step
 * @param {number} stepIndex - The index of the current step
 */
function updateStepDescription(stepIndex) {
    const descriptionContainer = document.getElementById('stepDescription');
    const stepDescriptions = [
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
    
    if (stepIndex < stepDescriptions.length) {
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
