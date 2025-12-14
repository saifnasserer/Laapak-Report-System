/**
 * Laapak Report System - Interactive Device Gallery
 * This script adds interactive gallery functionality to the device inspection section
 */

document.addEventListener('DOMContentLoaded', function() {
    initializeGallery();
    setupZoomFunctionality();
    setupGalleryControls();
});

/**
 * Initialize the interactive gallery
 */
function initializeGallery() {
    // Get all thumbnails
    const thumbnails = document.querySelectorAll('.thumbnail');
    const mainImage = document.getElementById('mainGalleryImage');
    const imageCaption = document.getElementById('imageCaption');
    
    // Add click event to each thumbnail
    thumbnails.forEach(thumbnail => {
        thumbnail.addEventListener('click', function() {
            // Remove active class from all thumbnails
            thumbnails.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked thumbnail
            this.classList.add('active');
            
            // Update main image source and caption
            const imgSrc = this.getAttribute('data-img');
            const imgTitle = this.getAttribute('data-title');
            
            // Add animation to main image
            mainImage.classList.add('animate__animated', 'animate__fadeIn');
            
            // Update image source and caption
            mainImage.src = imgSrc;
            imageCaption.textContent = imgTitle;
            
            // Remove animation classes after animation completes
            setTimeout(() => {
                mainImage.classList.remove('animate__animated', 'animate__fadeIn');
            }, 1000);
        });
    });
}

/**
 * Setup zoom functionality for the main image
 */
function setupZoomFunctionality() {
    const mainImage = document.getElementById('mainGalleryImage');
    const zoomOverlay = document.querySelector('.zoom-overlay');
    
    if (mainImage && zoomOverlay) {
        // Create a modal for zoomed image
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'imageZoomModal';
        modal.setAttribute('tabindex', '-1');
        modal.setAttribute('aria-labelledby', 'imageZoomModalLabel');
        modal.setAttribute('aria-hidden', 'true');
        
        modal.innerHTML = `
            <div class="modal-dialog modal-xl modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="imageZoomModalLabel">صورة مكبرة</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body text-center">
                        <img src="" id="zoomedImage" class="img-fluid" alt="صورة مكبرة للجهاز">
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to body
        document.body.appendChild(modal);
        
        // Initialize Bootstrap modal
        const zoomModal = new bootstrap.Modal(document.getElementById('imageZoomModal'));
        
        // Add click event to main image
        mainImage.parentElement.addEventListener('click', function() {
            const zoomedImage = document.getElementById('zoomedImage');
            zoomedImage.src = mainImage.src;
            zoomModal.show();
        });
        
        // Add hover effect
        mainImage.parentElement.addEventListener('mouseenter', function() {
            zoomOverlay.style.opacity = '1';
        });
        
        mainImage.parentElement.addEventListener('mouseleave', function() {
            zoomOverlay.style.opacity = '0';
        });
    }
}

/**
 * Setup gallery navigation controls
 */
function setupGalleryControls() {
    const prevButton = document.querySelector('.gallery-prev');
    const nextButton = document.querySelector('.gallery-next');
    const fullscreenButton = document.querySelector('.gallery-fullscreen');
    const thumbnails = document.querySelectorAll('.thumbnail');
    
    if (prevButton && nextButton && thumbnails.length > 0) {
        // Previous button click
        prevButton.addEventListener('click', function() {
            const activeThumb = document.querySelector('.thumbnail.active');
            let prevThumb;
            
            if (activeThumb) {
                // Find the previous thumbnail
                const parent = activeThumb.parentElement;
                const prevParent = parent.previousElementSibling;
                
                if (prevParent) {
                    prevThumb = prevParent.querySelector('.thumbnail');
                } else {
                    // If no previous sibling, go to the last thumbnail
                    const allParents = document.querySelectorAll('.thumbnail');
                    prevThumb = allParents[allParents.length - 1];
                }
                
                // Trigger click on the previous thumbnail
                if (prevThumb) {
                    prevThumb.click();
                    prevThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            }
        });
        
        // Next button click
        nextButton.addEventListener('click', function() {
            const activeThumb = document.querySelector('.thumbnail.active');
            let nextThumb;
            
            if (activeThumb) {
                // Find the next thumbnail
                const parent = activeThumb.parentElement;
                const nextParent = parent.nextElementSibling;
                
                if (nextParent) {
                    nextThumb = nextParent.querySelector('.thumbnail');
                } else {
                    // If no next sibling, go to the first thumbnail
                    nextThumb = document.querySelector('.thumbnail');
                }
                
                // Trigger click on the next thumbnail
                if (nextThumb) {
                    nextThumb.click();
                    nextThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            }
        });
        
        // Fullscreen button click
        if (fullscreenButton) {
            fullscreenButton.addEventListener('click', function() {
                const activeThumb = document.querySelector('.thumbnail.active');
                if (activeThumb) {
                    // Trigger click on the main image to open modal
                    document.getElementById('mainGalleryImage').parentElement.click();
                }
            });
        }
    }
}
