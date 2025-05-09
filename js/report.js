/**
 * Laapak Report System - Report Page JavaScript
 * Handles functionality specific to the report viewing page
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
    
    // Cache report data for offline access
    cacheReportData();
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
