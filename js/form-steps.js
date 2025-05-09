/**
 * Laapak Report System
 * Multi-step form handling
 */

document.addEventListener('DOMContentLoaded', function() {
    // Get all form steps and navigation buttons
    const formSteps = document.querySelectorAll('.form-step');
    const stepButtons = document.querySelectorAll('.step-button');
    const stepItems = document.querySelectorAll('.step-item');
    const nextButtons = document.querySelectorAll('.btn-next-step');
    const prevButtons = document.querySelectorAll('.btn-prev-step');
    const progressBar = document.querySelector('.steps-progress-bar');
    
    let     currentStep = 0;
    
    // Initialize form
    showStep(currentStep);
    updateProgressBar();
    
    // Event listeners for next/prev buttons
    nextButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (validateStep(currentStep)) {
                currentStep++;
                showStep(currentStep);
                updateProgressBar();
            }
        });
    });
    
    prevButtons.forEach(button => {
        button.addEventListener('click', () => {
            currentStep--;
            showStep(currentStep);
            updateProgressBar();
        });
    });
    
    // Allow clicking directly on step indicators (if previous steps are complete)
    stepButtons.forEach((button, index) => {
        button.addEventListener('click', () => {
            if (index < currentStep || validateStepsBeforeJump(index)) {
                currentStep = index;
                showStep(currentStep);
                updateProgressBar();
            }
        });
    });
    
    // Show specific step and update indicators
    function showStep(stepIndex) {
        // Hide all steps
        formSteps.forEach(step => {
            step.style.display = 'none';
        });
        
        // Show current step
        formSteps[stepIndex].style.display = 'block';
        
        // Update step indicators
        stepItems.forEach((item, idx) => {
            if (idx < stepIndex) {
                // Completed steps
                item.classList.remove('active');
                item.classList.add('completed');
                item.querySelector('.step-button').classList.remove('btn-outline-primary', 'btn-primary');
                item.querySelector('.step-button').classList.add('btn-success');
                // Add check icon
                item.querySelector('.step-button').innerHTML = '<i class="fas fa-check"></i>';
            } else if (idx === stepIndex) {
                // Current step
                item.classList.add('active');
                item.classList.remove('completed');
                item.querySelector('.step-button').classList.remove('btn-outline-primary', 'btn-success');
                item.querySelector('.step-button').classList.add('btn-primary');
                // Restore step number
                item.querySelector('.step-button').textContent = idx + 1;
            } else {
                // Future steps
                item.classList.remove('active', 'completed');
                item.querySelector('.step-button').classList.remove('btn-primary', 'btn-success');
                item.querySelector('.step-button').classList.add('btn-outline-primary');
                // Restore step number
                item.querySelector('.step-button').textContent = idx + 1;
            }
        });
        
        // Show/hide prev button based on step
        if (stepIndex === 0) {
            document.querySelectorAll('.btn-prev-step').forEach(btn => btn.style.display = 'none');
        } else {
            document.querySelectorAll('.btn-prev-step').forEach(btn => btn.style.display = 'inline-block');
        }
        
        // Change next button text on last step
        if (stepIndex === formSteps.length - 1) {
            document.querySelectorAll('.btn-next-step').forEach(btn => btn.textContent = 'إنشاء التقرير');
        } else {
            document.querySelectorAll('.btn-next-step').forEach(btn => btn.textContent = 'التالي');
        }
    }
    
    // Update progress bar
    function updateProgressBar() {
        if (progressBar) {
            const progressPercentage = (currentStep / (formSteps.length - 1)) * 100;
            progressBar.style.width = progressPercentage + '%';
        }
    }
    
    // Validate current step fields
    function validateStep(stepIndex) {
        const currentStepEl = formSteps[stepIndex];
        const requiredFields = currentStepEl.querySelectorAll('[required]');
        let isValid = true;
        
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                isValid = false;
                field.classList.add('is-invalid');
                
                // Add event listener to remove invalid class when user types
                field.addEventListener('input', function() {
                    if (this.value.trim()) {
                        this.classList.remove('is-invalid');
                    }
                }, { once: true });
            } else {
                field.classList.remove('is-invalid');
            }
        });
        
        if (!isValid) {
            // Show validation message
            const alertEl = currentStepEl.querySelector('.validation-alert') || 
                            createValidationAlert(currentStepEl);
            alertEl.style.display = 'block';
        }
        
        return isValid;
    }
    
    // Validate all steps before current one when jumping to a step
    function validateStepsBeforeJump(targetIndex) {
        for (let i = 0; i < targetIndex; i++) {
            if (!validateStep(i)) return false;
        }
        return true;
    }
    
    // Create validation alert element
    function createValidationAlert(container) {
        const alertEl = document.createElement('div');
        alertEl.className = 'alert alert-danger validation-alert mt-3';
        alertEl.role = 'alert';
        alertEl.innerHTML = 'الرجاء إكمال جميع الحقول المطلوبة';
        container.appendChild(alertEl);
        return alertEl;
    }
    
    // Handle form submission for the final step
    document.getElementById('reportForm').addEventListener('submit', function(e) {
        e.preventDefault();
        if (validateStep(currentStep)) {
            // Collect all form data
            const reportData = collectFormData();
            
            // Save report data
            saveReportData(reportData);
            
            // Collect invoice data from the form if available
            let invoiceFormData = null;
            if (window.invoiceFormHandler && typeof window.invoiceFormHandler.collectInvoiceData === 'function') {
                invoiceFormData = window.invoiceFormHandler.collectInvoiceData();
            }
            
            // Generate invoice with form data if available
            const invoice = generateInvoice(reportData, invoiceFormData);
            
            // Update success modal with report and invoice info
            updateSuccessModal(reportData, invoice);
            
            // Show success modal
            const successModal = new bootstrap.Modal(document.getElementById('reportCreatedModal'));
            successModal.show();
            
            // Reset form
            this.reset();
            currentStep = 0;
            showStep(currentStep);
            updateProgressBar();
        }
    });
    
    /**
     * Collect all form data from the report form
     * @returns {Object} The collected report data
     */
    function collectFormData() {
        const formData = {
            // Client information
            clientName: document.getElementById('clientName').value,
            clientPhone: document.getElementById('clientPhone').value,
            clientEmail: document.getElementById('clientEmail')?.value || '',
            orderCode: 'LP' + Math.floor(10000 + Math.random() * 90000), // Generate order code
            
            // Device information
            deviceType: document.getElementById('deviceType').value,
            brand: document.getElementById('deviceBrand').value,
            model: document.getElementById('deviceModel').value,
            serialNumber: document.getElementById('serialNumber').value,
            
            // Problem and solution
            problem: document.getElementById('problemDescription').value,
            diagnosis: document.getElementById('diagnosisNotes')?.value || '',
            solution: document.getElementById('solutionDescription')?.value || '',
            
            // Status
            status: document.getElementById('deviceStatus')?.value || 'تم الفحص',
            
            // Technician info
            technicianName: document.getElementById('technicianName')?.value || 'فني الدعم',
            
            // Additional notes
            generalNotes: document.getElementById('generalNotes')?.value || '',
            
            // Replacement parts
            parts: collectReplacementParts()
        };
        
        // Generate a client ID from phone number
        formData.clientId = 'C' + formData.clientPhone.slice(-6);
        
        return formData;
    }
    
    /**
     * Collect replacement parts and their costs
     * @returns {Array} Array of parts with names and costs
     */
    function collectReplacementParts() {
        const parts = [];
        
        // This is a placeholder - in a real implementation, you would collect this from form fields
        // For demo purposes, we'll add some sample parts if hardware issues were mentioned
        const problemDesc = document.getElementById('problemDescription').value.toLowerCase();
        
        if (problemDesc.includes('شاشة') || problemDesc.includes('عرض')) {
            parts.push({ name: 'كابل شاشة', cost: 150 });
        }
        
        if (problemDesc.includes('بطارية') || problemDesc.includes('شحن')) {
            parts.push({ name: 'بطارية جديدة', cost: 350 });
        }
        
        if (problemDesc.includes('هارد') || problemDesc.includes('تخزين')) {
            parts.push({ name: 'قرص SSD', cost: 450 });
        }
        
        if (problemDesc.includes('لوحة') || problemDesc.includes('مفاتيح')) {
            parts.push({ name: 'لوحة مفاتيح جديدة', cost: 250 });
        }
        
        return parts;
    }
    
    /**
     * Save report data to storage
     * @param {Object} reportData - The report data to save
     */
    function saveReportData(reportData) {
        // Get existing reports from storage
        let reports = JSON.parse(localStorage.getItem('lpk_reports') || '[]');
        
        // Add new report
        reports.push(reportData);
        
        // Save back to storage
        localStorage.setItem('lpk_reports', JSON.stringify(reports));
        
        // Also save to client-specific reports if clientId exists
        if (reportData.clientId) {
            let clientReports = JSON.parse(localStorage.getItem(`lpk_client_${reportData.clientId}_reports`) || '[]');
            clientReports.push(reportData);
            localStorage.setItem(`lpk_client_${reportData.clientId}_reports`, JSON.stringify(clientReports));
        }
    }
    
    /**
     * Update success modal with report and invoice information
     * @param {Object} reportData - The saved report data
     * @param {Object} invoice - The generated invoice
     */
    function updateSuccessModal(reportData, invoice) {
        // Set report link in modal
        const reportLink = document.getElementById('reportLink');
        if (reportLink) {
            reportLink.value = `${window.location.origin}/report.html?id=${reportData.id}`;
        }
        
        // Add invoice information to modal
        const successMessage = document.querySelector('#reportCreatedModal .modal-body p');
        if (successMessage) {
            successMessage.innerHTML = `تم إنشاء التقرير ورقم الفاتورة <strong>${invoice.id}</strong> بنجاح!`;
        }
        
        // Add invoice link to modal
        const modalFooter = document.querySelector('#reportCreatedModal .modal-footer');
        if (modalFooter) {
            const invoiceBtn = document.createElement('a');
            invoiceBtn.href = `#`;
            invoiceBtn.className = 'btn btn-info';
            invoiceBtn.innerHTML = '<i class="fas fa-file-invoice me-2"></i> عرض الفاتورة';
            invoiceBtn.onclick = function(e) {
                e.preventDefault();
                // Close the current modal
                bootstrap.Modal.getInstance(document.getElementById('reportCreatedModal')).hide();
                
                // Show invoice modal
                setTimeout(() => {
                    // Populate invoice modal
                    populateInvoiceModal(invoice);
                    
                    // Show the modal
                    const invoiceModal = new bootstrap.Modal(document.getElementById('invoiceModal'));
                    invoiceModal.show();
                }, 500);
            };
            
            // Add to modal footer before the last button
            modalFooter.insertBefore(invoiceBtn, modalFooter.lastElementChild);
        }
    }
    
    /**
     * Populate invoice modal with invoice data
     * @param {Object} invoice - The invoice data
     */
    function populateInvoiceModal(invoice) {
        const invoiceModalContent = document.getElementById('invoiceModalContent');
        const invoiceDate = new Date(invoice.date);
        
        if (invoiceModalContent) {
            invoiceModalContent.innerHTML = `
                <div class="mb-4 text-center">
                    <img src="img/logo.png" alt="Laapak" width="120" class="mb-3">
                    <h5 class="mb-0 fw-bold">فاتورة صيانة</h5>
                    <p class="text-muted small">رقم الفاتورة: ${invoice.id}</p>
                </div>
                
                <div class="row mb-4">
                    <div class="col-md-6 mb-3 mb-md-0">
                        <h6 class="fw-bold mb-2">معلومات العميل</h6>
                        <p class="mb-1">الاسم: ${invoice.clientName}</p>
                        <p class="mb-0">رقم الهاتف: ${invoice.clientPhone}</p>
                    </div>
                    <div class="col-md-6 text-md-end">
                        <h6 class="fw-bold mb-2">معلومات الفاتورة</h6>
                        <p class="mb-1">التاريخ: ${formatDate(invoiceDate)}</p>
                        <p class="mb-0">رقم التقرير: ${invoice.reportId}</p>
                    </div>
                </div>
                
                <div class="card mb-4 border-0 bg-light">
                    <div class="card-body">
                        <h6 class="card-title mb-3 text-primary"><i class="fas fa-list me-2"></i> تفاصيل الفاتورة</h6>
                        <div class="table-responsive">
                            <table class="table table-sm">
                                <thead>
                                    <tr>
                                        <th>البيان</th>
                                        <th class="text-end">المبلغ (ريال)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${invoice.items.map(item => `
                                        <tr>
                                            <td>${item.description}</td>
                                            <td class="text-end">${item.amount.toFixed(2)}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <th>المجموع الفرعي</th>
                                        <th class="text-end">${invoice.subtotal.toFixed(2)}</th>
                                    </tr>
                                    <tr>
                                        <th>الضريبة (15%)</th>
                                        <th class="text-end">${invoice.tax.toFixed(2)}</th>
                                    </tr>
                                    <tr>
                                        <th>المجموع الكلي</th>
                                        <th class="text-end">${invoice.total.toFixed(2)}</th>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>
                
                <div class="card mb-4 border-0 bg-light">
                    <div class="card-body">
                        <h6 class="card-title mb-3 text-primary"><i class="fas fa-money-check-alt me-2"></i> معلومات الدفع</h6>
                        <div class="row">
                            <div class="col-md-4 mb-3">
                                <p class="mb-1 fw-bold small">الحالة</p>
                                <p class="mb-0">
                                    <span class="badge ${invoice.paid ? 'bg-success' : 'bg-danger'} p-2">
                                        ${invoice.paid ? 'مدفوعة' : 'غير مدفوعة'}
                                    </span>
                                </p>
                            </div>
                            <div class="col-md-4 mb-3">
                                <p class="mb-1 fw-bold small">طريقة الدفع</p>
                                <p class="mb-0">${invoice.paymentMethod || 'غير محدد'}</p>
                            </div>
                            <div class="col-md-4 mb-3">
                                <p class="mb-1 fw-bold small">تاريخ الدفع</p>
                                <p class="mb-0">${invoice.paid ? formatDate(new Date(invoice.paymentDate)) : 'لم يتم الدفع بعد'}</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="text-center mt-4">
                    <p class="mb-1 small fw-bold text-muted">Laapak للصيانة والدعم الفني</p>
                    <p class="mb-0 small text-muted">الرياض، المملكة العربية السعودية</p>
                    <p class="mb-0 small text-muted">هاتف: 0595555555</p>
                </div>
            `;
        }
    }
    
    /**
     * Format date to local string
     * @param {Date} date - The date to format
     * @returns {string} Formatted date string
     */
    function formatDate(date) {
        try {
            return date.toLocaleDateString('ar-SA');
        } catch (e) {
            return date.toLocaleDateString();
        }
    }
    
    // Video upload handling
    if (document.getElementById('deviceVideo')) {
        document.getElementById('deviceVideo').addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            // Show video preview
            const videoPreviewContainer = document.getElementById('videoPreviewContainer');
            const videoPreview = document.getElementById('videoPreview');
            const videoFileName = document.getElementById('videoFileName');
            
            // Create object URL for the file
            const videoURL = URL.createObjectURL(file);
            videoPreview.src = videoURL;
            videoFileName.textContent = file.name;
            
            // Show the preview container
            videoPreviewContainer.classList.remove('d-none');
        });
    }
    
    // Component test add/remove handlers
    if (document.getElementById('addComponentTest')) {
        // document.getElementById('addComponentTest').addEventListener('click', function() {
            // Show component selection dialog
            // This would be implemented later
            // alert('سيتم إضافة فحص جديد قريباً...');
        // });
        
        // Add event listeners to remove buttons
        document.querySelectorAll('.remove-test-btn').forEach(btn => {
            if (!btn.disabled) {
                btn.addEventListener('click', function() {
                    const card = this.closest('.component-test-card');
                    if (card) {
                        // Add fade out animation
                        card.style.opacity = '1';
                        card.style.transition = 'opacity 0.3s ease';
                        card.style.opacity = '0';
                        
                        // Remove after animation completes
                        setTimeout(() => {
                            card.remove();
                        }, 300);
                    }
                });
            }
        });
    }
    
    // Success modal functionality
    if (document.getElementById('copyLinkBtn')) {
        document.getElementById('copyLinkBtn').addEventListener('click', function() {
            const reportLink = document.getElementById('reportLink');
            reportLink.select();
            document.execCommand('copy');
            
            // Show copy success message
            this.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => {
                this.innerHTML = '<i class="fas fa-copy"></i>';
            }, 2000);
        });
    }
    
    if (document.getElementById('whatsappShareBtn')) {
        document.getElementById('whatsappShareBtn').addEventListener('click', function(e) {
            e.preventDefault();
            const reportLink = document.getElementById('reportLink').value;
            const whatsappLink = `https://wa.me/?text=${encodeURIComponent('تقرير الفحص الخاص بك من Laapak: ' + reportLink)}`;
            window.open(whatsappLink, '_blank');
        });
    }
    
    if (document.getElementById('copyLinkBtn')) {
        document.getElementById('copyLinkBtn').addEventListener('click', function(e) {
            e.preventDefault();
            // Get the current URL
            const reportUrl = window.location.href;
            
            // Copy to clipboard
            navigator.clipboard.writeText(reportUrl).then(function() {
                // Show success message
                alert('تم نسخ رابط التقرير بنجاح');
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
});

