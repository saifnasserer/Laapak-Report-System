/**
 * Laapak Report System - Settings Utilities
 * Contains utility functions used across the settings modules
 */

/**
 * Generate an avatar URL based on user's full name
 * @param {string} fullName - User's full name
 * @returns {string} Avatar URL
 */
export function generateAvatarUrl(fullName) {
    if (!fullName) return null;
    const initials = fullName.split(' ')
        .map(name => name.charAt(0).toUpperCase())
        .join('')
        .substring(0, 2);
    return `https://ui-avatars.com/api/?name=${initials}&background=007553&color=fff&size=128&rounded=true&bold=true`;
}

/**
 * Format date to localized string
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date string
 */
export function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Set the value of a select element
 * @param {HTMLSelectElement} selectElement - The select element to set
 * @param {string} value - The value to set
 */
export function setSelectValue(selectElement, value) {
    if (!selectElement) return;
    
    for (let i = 0; i < selectElement.options.length; i++) {
        if (selectElement.options[i].value === value) {
            selectElement.selectedIndex = i;
            break;
        }
    }
}

/**
 * Show a toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type of toast (success, error, warning, info)
 */
export function showToast(message, type = 'success') {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'position-fixed bottom-0 end-0 p-3';
        toastContainer.style.zIndex = '9999';
        document.body.appendChild(toastContainer);
    }
    
    // Set header background based on type
    let headerBg = 'linear-gradient(135deg, #007553 0%, #004d35 100%)';
    let icon = 'fas fa-info-circle';
    
    switch (type) {
        case 'error':
            headerBg = 'linear-gradient(135deg, #dc3545 0%, #b02a37 100%)';
            icon = 'fas fa-exclamation-circle';
            break;
        case 'warning':
            headerBg = 'linear-gradient(135deg, #ffc107 0%, #d39e00 100%)';
            icon = 'fas fa-exclamation-triangle';
            break;
        case 'info':
            headerBg = 'linear-gradient(135deg, #0dcaf0 0%, #0aa2c0 100%)';
            icon = 'fas fa-info-circle';
            break;
    }
    
    // Create toast element
    const toastId = 'toast-' + Date.now();
    const toastHTML = `
    <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="toast-header" style="background: ${headerBg}; color: white;">
            <i class="${icon} me-2"></i>
            <strong class="me-auto">Laapak</strong>
            <small>الآن</small>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">
            ${message}
        </div>
    </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHTML);
    
    // Initialize and show toast
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, { delay: 3000 });
    toast.show();
    
    // Remove toast after it's hidden
    toastElement.addEventListener('hidden.bs.toast', function() {
        toastElement.remove();
    });
}
