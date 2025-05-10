/**
 * Laapak Report System - Create Report
 * Handles the report creation form and API integration
 */

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is authenticated
    if (typeof authMiddleware !== 'undefined' && !authMiddleware.isAdminLoggedIn()) {
        window.location.href = 'index.html';
        return;
    }

    // Get form element
    const reportForm = document.getElementById('reportForm');
    if (!reportForm) return;

    // Handle form submission
    reportForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Validate the current step (using the existing validation from form-steps.js)
        // This assumes the validateStep function is accessible
        if (typeof validateStep === 'function' && !validateStep(currentStep)) {
            return;
        }
        
        try {
            // Show loading indicator
            showLoading(true);
            
            // Collect form data
            const formData = collectReportData();
            
            // Submit to API
            const response = await apiService.createReport(formData);
            
            // Hide loading indicator
            showLoading(false);
            
            // Show success message
            showSuccessMessage(response);
            
            // Reset form
            resetForm();
        } catch (error) {
            console.error('Error creating report:', error);
            showLoading(false);
            showErrorMessage(error.message || 'Failed to create report. Please try again.');
        }
    });

    /**
     * Collect all report data from the form
     * @returns {Object} The report data
     */
    function collectReportData() {
        // Get client ID from selection or create new client
        const clientId = document.getElementById('clientSelect')?.value || null;
        
        return {
            // Basic information
            orderNumber: document.getElementById('orderNumber').value,
            inspectionDate: document.getElementById('inspectionDate').value,
            deviceModel: document.getElementById('deviceModel').value,
            serialNumber: document.getElementById('serialNumber').value,
            
            // Technical tests
            cpuStatus: document.getElementById('cpuStatus')?.value || 'Not tested',
            gpuStatus: document.getElementById('gpuStatus')?.value || 'Not tested',
            ramStatus: document.getElementById('ramStatus')?.value || 'Not tested',
            storageStatus: document.getElementById('storageStatus')?.value || 'Not tested',
            batteryStatus: document.getElementById('batteryStatus')?.value || 'Not tested',
            screenStatus: document.getElementById('screenStatus')?.value || 'Not tested',
            keyboardStatus: document.getElementById('keyboardStatus')?.value || 'Not tested',
            touchpadStatus: document.getElementById('touchpadStatus')?.value || 'Not tested',
            wifiStatus: document.getElementById('wifiStatus')?.value || 'Not tested',
            bluetoothStatus: document.getElementById('bluetoothStatus')?.value || 'Not tested',
            
            // External inspection
            externalCondition: document.getElementById('externalCondition')?.value || '',
            caseCondition: document.getElementById('caseCondition')?.value || '',
            screenCondition: document.getElementById('screenCondition')?.value || '',
            keyboardCondition: document.getElementById('keyboardCondition')?.value || '',
            
            // Notes
            notes: document.getElementById('notes')?.value || '',
            
            // Invoice information
            invoiceNumber: generateInvoiceNumber(),
            invoiceAmount: document.getElementById('invoiceAmount')?.value || 0,
            invoiceDate: new Date().toISOString(),
            
            // Warranty information
            warrantyStatus: document.getElementById('warrantyStatus')?.value || 'Not applicable',
            warrantyExpiration: document.getElementById('warrantyExpiration')?.value || null,
            
            // Status and relationships
            status: 'pending',
            clientId: clientId,
            // technicianId will be set by the backend based on the authenticated user
        };
    }

    /**
     * Generate a unique invoice number
     * @returns {string} Invoice number
     */
    function generateInvoiceNumber() {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const random = Math.floor(1000 + Math.random() * 9000);
        
        return `INV-${year}${month}${day}-${random}`;
    }

    /**
     * Show or hide loading indicator
     * @param {boolean} show - Whether to show or hide loading
     */
    function showLoading(show) {
        const submitBtn = reportForm.querySelector('button[type="submit"]');
        
        if (show) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> جاري الإنشاء...';
        } else {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'إنشاء التقرير';
        }
    }

    /**
     * Show success message and handle post-submission actions
     * @param {Object} response - API response with created report
     */
    function showSuccessMessage(response) {
        // Get the success modal
        const successModal = document.getElementById('reportCreatedModal');
        
        if (successModal) {
            // Update modal content with report information
            const reportLink = document.getElementById('reportLink');
            if (reportLink) {
                reportLink.value = `${window.location.origin}/report.html?id=${response.id}`;
            }
            
            // Show the modal
            const bsModal = new bootstrap.Modal(successModal);
            bsModal.show();
        } else {
            // Fallback if modal doesn't exist
            alert('تم إنشاء التقرير بنجاح!');
            window.location.href = `report.html?id=${response.id}`;
        }
    }

    /**
     * Show error message
     * @param {string} message - Error message to display
     */
    function showErrorMessage(message) {
        // Create alert if it doesn't exist
        let alertEl = document.getElementById('reportFormAlert');
        
        if (!alertEl) {
            alertEl = document.createElement('div');
            alertEl.id = 'reportFormAlert';
            alertEl.className = 'alert alert-danger mt-3';
            alertEl.role = 'alert';
            
            // Add alert to form
            reportForm.prepend(alertEl);
        }
        
        // Update alert message
        alertEl.textContent = message;
        
        // Scroll to alert
        alertEl.scrollIntoView({ behavior: 'smooth' });
    }

    /**
     * Reset form after successful submission
     */
    function resetForm() {
        reportForm.reset();
        
        // Reset to first step if using multi-step form
        if (typeof showStep === 'function') {
            currentStep = 0;
            showStep(currentStep);
            updateProgressBar();
        }
    }
});
