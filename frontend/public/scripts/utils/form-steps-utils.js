/**
 * Laapak Report System
 * Form steps utility functions
 */

/**
 * Hide all step error containers
 */
function hideAllStepErrors() {
    for (let i = 1; i <= 5; i++) {
        const errorContainer = document.getElementById(`step${i}ErrorContainer`);
        if (errorContainer) {
            errorContainer.style.display = 'none';
        }
    }
}

/**
 * Show error in a specific step's error container
 * @param {number} stepNumber - The step number (1-5)
 * @param {string} message - The error message to display
 */
function showStepError(stepNumber, message) {
    if (stepNumber < 1 || stepNumber > 5) return;
    
    const errorContainer = document.getElementById(`step${stepNumber}ErrorContainer`);
    const errorText = document.getElementById(`step${stepNumber}ErrorText`);
    
    if (errorContainer && errorText) {
        errorText.textContent = message;
        errorContainer.style.display = 'block';
        errorContainer.scrollIntoView({ behavior: 'smooth' });
    }
}

/**
 * Hide error in a specific step's error container
 * @param {number} stepNumber - The step number (1-5)
 */
function hideStepError(stepNumber) {
    if (stepNumber < 1 || stepNumber > 5) return;
    
    const errorContainer = document.getElementById(`step${stepNumber}ErrorContainer`);
    if (errorContainer) {
        errorContainer.style.display = 'none';
    }
}
