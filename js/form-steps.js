/**
 * form-steps.js
 * Handles multi-step form navigation, validation, and submission for the report creation form.
 * Includes integration with backend API for report submission.
 */

// Global variables
let currentStep = 0;
const totalSteps = 5;
let reportData = {};
let clientsData = [];

// Initialize the form when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeFormSteps();
    setupEventListeners();
    checkOnlineStatus();
});

/**
 * Initialize the form steps and set up the initial state
 */
function initializeFormSteps() {
    // Set the first step as active
    showStep(0);
    updateProgressBar();
    
    // Set today's date automatically for the inspection date field
    const today = new Date();
    const formattedDate = today.toISOString().substr(0, 10);
    const inspectionDateField = document.getElementById('inspectionDate');
    if (inspectionDateField) {
        inspectionDateField.value = formattedDate;
    }
}

/**
 * Set up event listeners for form navigation and submission
 */
function setupEventListeners() {
    // Set up next buttons
    const nextButtons = document.querySelectorAll('.btn-next-step');
    nextButtons.forEach(function(button) {
        button.addEventListener('click', handleNextButtonClick);
    });
    
    // Set up previous buttons
    const prevButtons = document.querySelectorAll('.btn-prev-step');
    prevButtons.forEach(function(button) {
        button.addEventListener('click', handlePrevButtonClick);
    });
    
    // Set up form submission
    const reportForm = document.getElementById('reportForm');
    if (reportForm) {
        reportForm.addEventListener('submit', handleFormSubmit);
    }
    
    // Set up step indicators for direct navigation
    const stepButtons = document.querySelectorAll('.step-button');
    stepButtons.forEach(function(button, index) {
        button.addEventListener('click', function() {
            // Only allow going to steps that have been completed or are next
            if (index <= currentStep + 1) {
                showStep(index);
            }
        });
    });
    
    // Set up billing toggle
    setupBillingToggle();
}

/**
 * Configure the billing toggle functionality
 */
function setupBillingToggle() {
    const enableBillingCheckbox = document.getElementById('enableBilling');
    const paymentInfoSection = document.getElementById('paymentInfoSection');
    const invoicePreviewSection = document.querySelector('.card.bg-light');
    const submitButton = document.getElementById('submitReportBtn');
    
    if (!enableBillingCheckbox || !paymentInfoSection || !invoicePreviewSection || !submitButton) return;
    
    // Function to update UI based on checkbox state
    function updateBillingUI() {
        const isEnabled = enableBillingCheckbox.checked;
        
        // Show/hide payment info section
        paymentInfoSection.style.display = isEnabled ? 'block' : 'none';
        
        // Show/hide invoice preview section
        invoicePreviewSection.style.display = isEnabled ? 'block' : 'none';
        
        // Update submit button text
        submitButton.textContent = isEnabled ? 'إنشاء التقرير والفاتورة' : 'إنشاء التقرير';
    }
    
    // Set initial state
    updateBillingUI();
    
    // Add event listener for checkbox changes
    enableBillingCheckbox.addEventListener('change', updateBillingUI);
}

/**
 * Handle click on the Next button
 * @param {Event} event - The click event
 */
window.handleNextButtonClick = function(event) {
    event.preventDefault();
    
    // Validate the current step
    if (validateStep(currentStep)) {
        // If validation passes, go to the next step
        if (currentStep < totalSteps - 1) {
            showStep(currentStep + 1);
        }
    }
};

/**
 * Handle click on the Previous button
 * @param {Event} event - The click event
 */
window.handlePrevButtonClick = function(event) {
    event.preventDefault();
    
    // Go to the previous step without validation
    if (currentStep > 0) {
        showStep(currentStep - 1);
    }
};

/**
 * Display the specified step and hide others
 * @param {number} stepIndex - The index of the step to show
 */
function showStep(stepIndex) {
    // Get all form steps
    const formSteps = document.querySelectorAll('.form-step');
    
    // Hide all steps
    formSteps.forEach(function(step) {
        step.style.display = 'none';
    });
    
    // Show the specified step
    if (formSteps[stepIndex]) {
        formSteps[stepIndex].style.display = 'block';
    }
    
    // Update the current step
    currentStep = stepIndex;
    
    // Update the progress bar and step indicators
    updateProgressBar();
    updateStepButtons();
    updateNavigationButtons();
}

/**
 * Update the progress bar based on the current step
 */
function updateProgressBar() {
    const progressBar = document.querySelector('.steps-progress-bar');
    if (progressBar) {
        const progressPercentage = (currentStep / (totalSteps - 1)) * 100;
        progressBar.style.width = progressPercentage + '%';
    }
}

/**
 * Update the step indicator buttons based on the current step
 */
function updateStepButtons() {
    const stepItems = document.querySelectorAll('.step-item');
    const stepButtons = document.querySelectorAll('.step-button');
    
    stepItems.forEach(function(item, index) {
        // Remove all classes first
        item.classList.remove('active', 'completed');
        
        // Add appropriate classes based on step status
        if (index < currentStep) {
            item.classList.add('completed');
            stepButtons[index].classList.remove('btn-outline-primary');
            stepButtons[index].classList.add('btn-success');
        } else if (index === currentStep) {
            item.classList.add('active');
            stepButtons[index].classList.remove('btn-outline-primary', 'btn-success');
            stepButtons[index].classList.add('btn-primary');
        } else {
            stepButtons[index].classList.remove('btn-primary', 'btn-success');
            stepButtons[index].classList.add('btn-outline-primary');
        }
    });
}

/**
 * Update the navigation buttons based on the current step
 */
function updateNavigationButtons() {
    const prevButtons = document.querySelectorAll('.btn-prev-step');
    const nextButtons = document.querySelectorAll('.btn-next-step');
    const submitButton = document.getElementById('submitReportBtn');
    
    // Show/hide previous buttons
    prevButtons.forEach(function(button) {
        button.style.display = currentStep > 0 ? 'inline-block' : 'none';
    });
    
    // Show/hide next buttons and submit button
    nextButtons.forEach(function(button) {
        button.style.display = currentStep < totalSteps - 1 ? 'inline-block' : 'none';
    });
    
    if (submitButton) {
        submitButton.style.display = currentStep === totalSteps - 1 ? 'inline-block' : 'none';
    }
}

/**
 * Validate the current step
 * @param {number} stepIndex - The index of the step to validate
 * @returns {boolean} - Whether the step is valid
 */
function validateStep(stepIndex) {
    const stepEl = document.querySelectorAll('.form-step')[stepIndex];
    const errorMessages = [];
    
    let isValid = false;
    
    // Validate based on step type
    switch(stepIndex) {
        case 0: // Basic Info
            isValid = validateBasicInfoStep(stepEl, errorMessages);
            break;
        case 1: // Technical Tests
            isValid = validateTechnicalStep(stepEl, errorMessages);
            break;
        case 2: // External Inspection
            isValid = validateExternalStep(stepEl, errorMessages);
            break;
        case 3: // Notes
            isValid = validateNotesStep(stepEl, errorMessages);
            break;
        case 4: // Invoice
            isValid = validateInvoiceStep(stepEl, errorMessages);
            break;
    }
    
    // Display or clear error messages
    displayErrorMessages(stepEl, errorMessages);
    
    return isValid;
}

/**
 * Validate the basic information step
 * @param {HTMLElement} stepEl - The step element
 * @param {Array} errorMessages - Array to store error messages
 * @returns {boolean} - Whether the step is valid
 */
function validateBasicInfoStep(stepEl, errorMessages) {
    // Check if client is selected
    const clientSelect = document.getElementById('clientSelect');
    if (!clientSelect || !clientSelect.value) {
        errorMessages.push('يرجى اختيار عميل أو إضافة عميل جديد');
    }
    
    // Check required fields
    const requiredFields = [
        { id: 'orderNumber', message: 'يرجى إدخال رقم الطلب' },
        { id: 'inspectionDate', message: 'يرجى إدخال تاريخ الفحص' },
        { id: 'deviceModel', message: 'يرجى إدخال موديل الجهاز' },
        { id: 'serialNumber', message: 'يرجى إدخال الرقم التسلسلي' }
    ];
    
    requiredFields.forEach(field => {
        const element = document.getElementById(field.id);
        if (!element || !element.value.trim()) {
            errorMessages.push(field.message);
        }
    });
    
    return errorMessages.length === 0;
}

/**
 * Validate the technical tests step
 * @param {HTMLElement} stepEl - The step element
 * @param {Array} errorMessages - Array to store error messages
 * @returns {boolean} - Whether the step is valid
 */
function validateTechnicalStep(stepEl, errorMessages) {
    // Check if at least one hardware component is checked
    const hardwareTable = document.getElementById('hardwareComponentsTable');
    if (hardwareTable) {
        const radioGroups = hardwareTable.querySelectorAll('input[type="radio"]:checked');
        if (radioGroups.length === 0) {
            errorMessages.push('يرجى تحديد حالة مكون واحد على الأقل');
        }
    }
    
    // Check if CPU test description is filled
    const cpuDescription = document.getElementById('cpuDescription');
    if (!cpuDescription || !cpuDescription.value.trim()) {
        errorMessages.push('يرجى إدخال وصف اختبار المعالج');
    }
    
    return errorMessages.length === 0;
}

/**
 * Validate the external inspection step
 * @param {HTMLElement} stepEl - The step element
 * @param {Array} errorMessages - Array to store error messages
 * @returns {boolean} - Whether the step is valid
 */
function validateExternalStep(stepEl, errorMessages) {
    // External inspection is optional, so always valid
    return true;
}

/**
 * Validate the notes step
 * @param {HTMLElement} stepEl - The step element
 * @param {Array} errorMessages - Array to store error messages
 * @returns {boolean} - Whether the step is valid
 */
function validateNotesStep(stepEl, errorMessages) {
    // Notes are optional, so always valid
    return true;
}

/**
 * Validate the invoice step
 * @param {HTMLElement} stepEl - The step element
 * @param {Array} errorMessages - Array to store error messages
 * @returns {boolean} - Whether the step is valid
 */
function validateInvoiceStep(stepEl, errorMessages) {
    const billingEnabled = document.getElementById('enableBilling')?.checked || false;
    if (!billingEnabled) {
        return true; // Skip validation if billing is disabled
    }
    
    // Check if payment status is selected when billing is enabled
    const paymentStatus = document.getElementById('paymentStatus');
    if (!paymentStatus || !paymentStatus.value) {
        errorMessages.push('يرجى اختيار حالة الدفع');
    }
    
    // If payment status is 'paid' or 'partial', payment method must be selected
    if (paymentStatus && (paymentStatus.value === 'paid' || paymentStatus.value === 'partial')) {
        const paymentMethod = document.getElementById('paymentMethod');
        if (!paymentMethod || !paymentMethod.value) {
            errorMessages.push('يرجى اختيار طريقة الدفع');
        }
    }
    
    return errorMessages.length === 0;
}

/**
 * Display error messages for a step
 * @param {HTMLElement} stepEl - The step element
 * @param {Array} errorMessages - Array of error messages
 */
function displayErrorMessages(stepEl, errorMessages) {
    // Remove any existing error message container
    const existingErrorContainer = stepEl.querySelector('.error-container');
    if (existingErrorContainer) {
        existingErrorContainer.remove();
    }
    
    // If there are error messages, create and display them
    if (errorMessages.length > 0) {
        const errorContainer = document.createElement('div');
        errorContainer.className = 'error-container alert alert-danger mt-3';
        
        const errorList = document.createElement('ul');
        errorList.className = 'mb-0';
        
        errorMessages.forEach(message => {
            const errorItem = document.createElement('li');
            errorItem.textContent = message;
            errorList.appendChild(errorItem);
        });
        
        errorContainer.appendChild(errorList);
        stepEl.appendChild(errorContainer);
        
        // Scroll to the error messages
        errorContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

/**
 * Handle form submission
 * @param {Event} event - The submit event
 */
async function handleFormSubmit(event) {
    event.preventDefault();
    
    // Validate all steps before submission
    let allValid = true;
    for (let i = 0; i < totalSteps; i++) {
        if (!validateStep(i)) {
            allValid = false;
            showStep(i);
            break;
        }
    }
    
    if (!allValid) return;
    
    // Collect all form data
    const reportData = window.collectReportData();
    
    try {
        // Show loading state
        const submitBtn = document.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> جاري الحفظ...';
        
        // Save report to API or localStorage
        const result = await saveReport(reportData);
        
        // Show success message
        showSuccessModal(reportData, reportData.invoice);
        
        // Reset form
        resetForm();
    } catch (error) {
        console.error('Error saving report:', error);
        showToast('حدث خطأ أثناء حفظ التقرير. يرجى المحاولة مرة أخرى.', 'error');
    } finally {
        // Restore button state
        const submitBtn = document.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

/**
 * Save the report data to the backend API or localStorage
 * @param {Object} reportData - The collected report data
 * @returns {Promise} - A promise that resolves when the report is saved
 */
async function saveReport(reportData) {
    try {
        // Check if online
        if (navigator.onLine) {
            // Try to save to API using the apiService
            if (typeof apiService !== 'undefined' && apiService.createReport) {
                const result = await apiService.createReport(reportData);
                return result;
            } else {
                // Fallback to localStorage if apiService is not available
                return saveReportToLocalStorage(reportData);
            }
        } else {
            // Save to localStorage if offline
            return saveReportToLocalStorage(reportData);
        }
    } catch (error) {
        console.error('Error in saveReport:', error);
        // Fallback to localStorage if API call fails
        return saveReportToLocalStorage(reportData);
    }
}

/**
 * Save the report data to localStorage as a fallback
 * @param {Object} reportData - The collected report data
 * @returns {Object} - The saved report data with a generated ID
 */
function saveReportToLocalStorage(reportData) {
    // Generate a unique ID for the report
    reportData.id = 'local_' + Date.now();
    reportData.createdAt = new Date().toISOString();
    
    // Get existing reports from localStorage
    let reports = JSON.parse(localStorage.getItem('reports') || '[]');
    
    // Add the new report
    reports.push(reportData);
    
    // Save back to localStorage
    localStorage.setItem('reports', JSON.stringify(reports));
    
    // Show offline notification
    showToast('تم حفظ التقرير محليًا. سيتم مزامنته عند استعادة الاتصال.', 'warning');
    
    return reportData;
}

/**
 * Show a success modal after report submission
 * @param {Object} reportData - The submitted report data
 * @param {Object} invoice - The invoice data if billing was enabled
 */
function showSuccessModal(reportData, invoice) {
    // Create modal HTML
    const modalHTML = `
        <div class="modal fade" id="reportSuccessModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header bg-success text-white">
                        <h5 class="modal-title">تم إنشاء التقرير بنجاح</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body text-center py-4">
                        <div class="mb-4">
                            <i class="fas fa-check-circle text-success fa-4x mb-3"></i>
                            <h4>تم إنشاء التقرير بنجاح</h4>
                            <p class="text-muted">رقم التقرير: <strong>${reportData.id}</strong></p>
                        </div>
                        <div class="d-flex justify-content-center">
                            <a href="report.html?id=${reportData.id}" class="btn btn-primary me-2">
                                <i class="fas fa-eye me-1"></i> عرض التقرير
                            </a>
                            ${invoice ? `
                                <a href="invoice.html?id=${reportData.id}" class="btn btn-outline-primary">
                                    <i class="fas fa-file-invoice me-1"></i> عرض الفاتورة
                                </a>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add the modal to the document
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer.firstElementChild);
    
    // Initialize and show the modal
    const modal = new bootstrap.Modal(document.getElementById('reportSuccessModal'));
    modal.show();
    
    // Remove the modal from the DOM when it's hidden
    document.getElementById('reportSuccessModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

/**
 * Reset the form after successful submission
 */
function resetForm() {
    // Reset to the first step
    showStep(0);
    
    // Clear form fields
    document.getElementById('reportForm').reset();
    
    // Clear client selection
    const clientSelect = document.getElementById('clientSelect');
    if (clientSelect) {
        clientSelect.value = '';
    }
    
    // Hide selected client info
    const selectedClientInfo = document.getElementById('selectedClientInfo');
    if (selectedClientInfo) {
        selectedClientInfo.style.display = 'none';
    }
    
    // Reset hardware component status
    const radioButtons = document.querySelectorAll('#hardwareComponentsTable input[type="radio"]');
    radioButtons.forEach(radio => {
        radio.checked = false;
    });
    
    // Clear file inputs
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => {
        input.value = '';
    });
    
    // Clear image previews
    const externalImagesPreview = document.getElementById('externalImagesPreview');
    if (externalImagesPreview) {
        externalImagesPreview.innerHTML = '';
    }
    
    // Reset video preview
    const videoPreviewContainer = document.getElementById('videoPreviewContainer');
    if (videoPreviewContainer) {
        videoPreviewContainer.classList.add('d-none');
    }
    
    // Set today's date for inspection date
    const today = new Date();
    const formattedDate = today.toISOString().substr(0, 10);
    const inspectionDateField = document.getElementById('inspectionDate');
    if (inspectionDateField) {
        inspectionDateField.value = formattedDate;
    }
}

/**
 * Show a toast notification
 * @param {string} message - The message to display
 * @param {string} type - The type of toast (success, error, warning, info)
 */
function showToast(message, type = 'success') {
    // Create toast HTML
    const toastId = 'toast-' + Date.now();
    const toastHTML = `
        <div id="${toastId}" class="toast align-items-center text-white bg-${type === 'success' ? 'success' : type === 'error' ? 'danger' : type === 'warning' ? 'warning' : 'info'}" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;
    
    // Create toast container if it doesn't exist
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }
    
    // Add the toast to the container
    const toastElement = document.createElement('div');
    toastElement.innerHTML = toastHTML;
    toastContainer.appendChild(toastElement.firstElementChild);
    
    // Initialize and show the toast
    const toast = new bootstrap.Toast(document.getElementById(toastId), {
        autohide: true,
        delay: 5000
    });
    toast.show();
    
    // Remove the toast from the DOM when it's hidden
    document.getElementById(toastId).addEventListener('hidden.bs.toast', function() {
        this.remove();
    });
}

/**
 * Check online status and update UI accordingly
 */
function checkOnlineStatus() {
    const offlineAlert = document.getElementById('offlineAlert');
    
    function updateOnlineStatus() {
        if (navigator.onLine) {
            if (offlineAlert) {
                offlineAlert.style.display = 'none';
            }
        } else {
            if (offlineAlert) {
                offlineAlert.style.display = 'block';
            }
        }
    }
    
    // Initial check
    updateOnlineStatus();
    
    // Set up event listeners for online/offline events
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
}