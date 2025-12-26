/**
 * Laapak Report System
 * Multi-step form handling
 */

// Get a reference to the global apiService if it exists
let formApiService;

document.addEventListener('DOMContentLoaded', function () {
    // Try to get apiService from global scope
    formApiService = window.apiService || (typeof apiService !== 'undefined' ? apiService : null);
    // Make sure error containers are hidden on page load
    if (typeof hideAllStepErrors === 'function') {
        hideAllStepErrors();
    } else {
        console.error('hideAllStepErrors function not found. Make sure form-steps-utils.js is loaded before form-steps.js');
        // Fallback implementation
        for (let i = 1; i <= 5; i++) {
            const errorContainer = document.getElementById(`step${i}ErrorContainer`);
            if (errorContainer) {
                errorContainer.style.display = 'none';
            }
        }
    }
    // Get all form steps and navigation buttons
    const formSteps = document.querySelectorAll('.form-step');
    const stepButtons = document.querySelectorAll('.step-button');
    const stepItems = document.querySelectorAll('.step-item');

    // Centralized navigation buttons
    const globalNextBtn = document.getElementById('globalNextBtn');
    const globalPrevBtn = document.getElementById('globalPrevBtn');
    const submitBtn = document.getElementById('submitReportBtn');
    const progressBar = document.querySelector('.steps-progress-bar');

    let currentStep = 0;

    // Initialize form
    showStep(currentStep);
    updateProgressBar();

    // Event listener for centralized next button
    if (globalNextBtn) {
        globalNextBtn.addEventListener('click', function () {
            // Hide all step errors before validation
            if (typeof hideAllStepErrors === 'function') {
                hideAllStepErrors();
            } else {
                // Fallback implementation
                for (let i = 1; i <= 5; i++) {
                    const errorContainer = document.getElementById(`step${i}ErrorContainer`);
                    if (errorContainer) {
                        errorContainer.style.display = 'none';
                    }
                }
            }

            // Special handling for step 1 - client validation
            if (currentStep === 0) {
                const clientSelect = document.getElementById('clientSelect');
                if (clientSelect && !clientSelect.value) {
                    // Show error in step1 error container
                    const errorContainer = document.getElementById('step1ErrorContainer');
                    const errorText = document.getElementById('step1ErrorText');
                    if (errorContainer && errorText) {
                        errorText.textContent = 'يجب اختيار عميل قبل المتابعة';
                        errorContainer.style.display = 'block';
                        errorContainer.scrollIntoView({ behavior: 'smooth' });
                    }

                    // Add red border to the client select
                    if (clientSelect.parentNode) {
                        clientSelect.parentNode.classList.add('border', 'border-danger');
                    }

                    return false; // Stop here, don't proceed to next step
                }
            }

            if (validateStep(currentStep)) {
                // If we're on step 1, update global device details and client details before moving to next step
                if (currentStep === 0) {
                    // Direct update to window.globalDeviceDetails
                    // Get the existing device price if available
                    const existingDevicePrice = window.globalDeviceDetails?.devicePrice || '';
                    const devicePriceInput = document.getElementById('devicePrice');

                    window.globalDeviceDetails = {
                        orderNumber: document.getElementById('orderNumber')?.value || '',
                        inspectionDate: document.getElementById('inspectionDate')?.value || new Date().toISOString().split('T')[0],
                        deviceModel: document.getElementById('deviceModel')?.value || '',
                        serialNumber: document.getElementById('serialNumber')?.value || '',
                        // Preserve existing device price or use value from input if available
                        devicePrice: devicePriceInput?.value ? parseFloat(devicePriceInput.value) : existingDevicePrice,
                        cpu: document.getElementById('deviceCPU')?.value || '',
                        gpu: document.getElementById('deviceGPU')?.value || '',
                        ram: document.getElementById('deviceRAM')?.value || '',
                        storage: document.getElementById('deviceStorage')?.value || ''
                    };

                    console.log('Updated globalDeviceDetails with price:', window.globalDeviceDetails);

                    // Store client selection in global variable
                    const clientSelect = document.getElementById('clientSelect');
                    if (clientSelect && clientSelect.value) {
                        // Create global client details object if it doesn't exist
                        if (!window.globalClientDetails) {
                            window.globalClientDetails = {};
                        }

                        window.globalClientDetails.client_id = clientSelect.value;
                        console.log('Selected client ID stored globally:', window.globalClientDetails.client_id);

                        // If we have client data available, store more details
                        if (Array.isArray(window.clientsData)) {
                            const selectedClient = window.clientsData.find(client => client.id == clientSelect.value);
                            if (selectedClient) {
                                window.globalClientDetails.clientName = selectedClient.name;
                                window.globalClientDetails.clientPhone = selectedClient.phone;
                                window.globalClientDetails.clientEmail = selectedClient.email || '';
                                window.globalClientDetails.clientAddress = selectedClient.address || '';
                                console.log('Full client details stored globally:', window.globalClientDetails);
                            }
                        }
                    }

                    // Call the update function if it exists
                    if (typeof updateGlobalDeviceDetails === 'function') {
                        updateGlobalDeviceDetails();
                    }

                    console.log('Step 1 → Step 2: Updated device details:', window.globalDeviceDetails);
                }

                currentStep++;
                showStep(currentStep);
                updateProgressBar();

                // For step 5 (invoice), auto-populate device details from global variables
                if (currentStep === 4) { // Zero-based index, so 4 is the fifth step
                    const invoiceDeviceInput = document.getElementById('invoiceDeviceName');
                    const invoiceSerialInput = document.getElementById('invoiceSerialNumber');
                    const invoicePriceInput = document.getElementById('invoicePrice');

                    console.log('Populating invoice device fields from global device details');
                    console.log('Global device details:', window.globalDeviceDetails);

                    // Force update global device details from the first step
                    if (typeof updateGlobalDeviceDetails === 'function') {
                        updateGlobalDeviceDetails();
                        console.log('Updated global device details before populating invoice fields:', window.globalDeviceDetails);
                    }

                    // Always use window.globalDeviceDetails to ensure we're accessing the global variable
                    if (window.globalDeviceDetails && invoiceDeviceInput && invoiceSerialInput) {
                        // Auto-fill device details from global variables
                        // Get device model from the first step
                        const deviceModelInput = document.getElementById('deviceModel');
                        if (deviceModelInput && deviceModelInput.value) {
                            invoiceDeviceInput.value = deviceModelInput.value;
                            console.log('Auto-filled device model from form:', deviceModelInput.value);
                        } else if (window.globalDeviceDetails.deviceModel) {
                            invoiceDeviceInput.value = window.globalDeviceDetails.deviceModel;
                            console.log('Auto-filled device model from global:', window.globalDeviceDetails.deviceModel);
                        }

                        // Get serial number from the first step
                        const serialNumberInput = document.getElementById('serialNumber');
                        if (serialNumberInput && serialNumberInput.value) {
                            invoiceSerialInput.value = serialNumberInput.value;
                            console.log('Auto-filled serial number from form:', serialNumberInput.value);
                        } else if (window.globalDeviceDetails.serialNumber) {
                            invoiceSerialInput.value = window.globalDeviceDetails.serialNumber;
                            console.log('Auto-filled serial number from global:', window.globalDeviceDetails.serialNumber);
                        }

                        // Get price from the first step
                        const priceInput = document.getElementById('invoicePrice');
                        if (priceInput) {
                            // Get price from the first step
                            const devicePriceInput = document.getElementById('devicePrice');
                            if (devicePriceInput && devicePriceInput.value) {
                                priceInput.value = devicePriceInput.value;
                                console.log('Auto-filled price from form:', devicePriceInput.value);
                            } else if (window.globalDeviceDetails.devicePrice) {
                                priceInput.value = window.globalDeviceDetails.devicePrice;
                                console.log('Auto-filled price from global:', window.globalDeviceDetails.devicePrice);
                            }
                        }
                    } else {
                        // Fallback to direct DOM access if global variables aren't available
                        const deviceModelInput = document.getElementById('deviceModel');
                        const serialNumberInput = document.getElementById('serialNumber');

                        if (deviceModelInput && serialNumberInput && invoiceDeviceInput && invoiceSerialInput) {
                            // Auto-fill device details from step 1
                            if (deviceModelInput.value) {
                                invoiceDeviceInput.value = deviceModelInput.value;
                            }

                            if (serialNumberInput.value) {
                                invoiceSerialInput.value = serialNumberInput.value;
                            }
                        }
                    }
                }
            }
        });
    }

    // Event listener for previous button
    if (globalPrevBtn) {
        globalPrevBtn.addEventListener('click', function () {
            currentStep--;
            showStep(currentStep);
            updateProgressBar();
        });
    }

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
        // Hide all form steps
        formSteps.forEach((step, index) => {
            step.style.display = 'none';
        });

        // Show the current step
        if (formSteps[stepIndex]) {
            formSteps[stepIndex].style.display = 'block';

            // Scroll to the top of the step
            formSteps[stepIndex].scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        // Add console logging for debugging
        console.log(`[form-steps] showStep called. currentStep (stepIndex): ${stepIndex}, formSteps.length: ${formSteps.length}`);
        if (submitBtn) {
            console.log(`[form-steps] submitBtn found. Initial display style: ${submitBtn.style.display}`);
        }
        if (globalNextBtn) {
            console.log(`[form-steps] globalNextBtn found. Initial display style: ${globalNextBtn.style.display}`);
        }

        // Update step indicators
        stepItems.forEach((item, index) => {
            // Reset all steps
            item.classList.remove('active', 'completed');
            const button = item.querySelector('.step-button');
            button.classList.remove('btn-primary');
            button.classList.add('btn-outline-primary');

            // Mark current and previous steps
            if (index < stepIndex) {
                // Previous steps: completed
                item.classList.add('completed');
                button.classList.remove('btn-outline-primary');
                button.classList.add('btn-primary');
            } else if (index === stepIndex) {
                // Current step: active
                item.classList.add('active');
                button.classList.remove('btn-outline-primary');
                button.classList.add('btn-primary');
            }
        });

        // Update centralized navigation buttons
        if (globalPrevBtn) {
            globalPrevBtn.style.display = stepIndex === 0 ? 'none' : 'inline-block';
        }

        // Debug formSteps length and current step index
        console.log(`[DEBUG] formSteps.length: ${formSteps.length}, stepIndex: ${stepIndex}, Last step index: ${formSteps.length - 1}`);

        // Handle the last step for Submit button - Step 5 has index 4 (zero-based)
        if (stepIndex === 4) { // Explicitly check for step 5 (index 4)
            if (globalNextBtn) {
                globalNextBtn.style.display = 'none';
                console.log(`[form-steps] Hiding globalNextBtn for last step (${stepIndex})`);
            }
            if (submitBtn) {
                submitBtn.classList.remove('d-none');
                console.log(`[form-steps] Showing submitBtn for last step (${stepIndex})`);
            }
        } else {
            if (globalNextBtn) {
                globalNextBtn.style.display = 'inline-block';
                console.log(`[form-steps] Showing globalNextBtn for step ${stepIndex}`);
            }
            if (submitBtn) {
                submitBtn.classList.add('d-none');
                console.log(`[form-steps] Hiding submitBtn for step ${stepIndex}`);
            }
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

    // Validate current step fields with enhanced validation
    function validateStep(stepIndex) {
        const currentStepEl = formSteps[stepIndex];
        let isValid = true;
        let errorMessages = [];

        // Clear previous validation messages
        const existingAlerts = currentStepEl.querySelectorAll('.validation-alert');
        existingAlerts.forEach(alert => alert.remove());

        // Hide step-specific error container
        const stepErrorContainer = document.getElementById(`step${stepIndex + 1}ErrorContainer`);
        if (stepErrorContainer) {
            stepErrorContainer.style.display = 'none';
        }

        // Step-specific validation
        switch (stepIndex) {
            case 0: // Basic Information
                isValid = validateBasicInfoStep(currentStepEl, errorMessages);
                break;
            case 1: // Technical Tests
                isValid = validateTechnicalTestsStep(currentStepEl, errorMessages);
                break;
            case 2: // External Inspection
                isValid = validateExternalInspectionStep(currentStepEl, errorMessages);
                break;
            case 3: // Notes
                isValid = validateNotesStep(currentStepEl, errorMessages);
                break;
            case 4: // Invoice
                isValid = validateInvoiceStep(currentStepEl, errorMessages);
                break;
            default:
                // Default validation for required fields
                isValid = validateRequiredFields(currentStepEl, errorMessages);
        }

        if (!isValid) {
            // Show error in the step-specific error container
            if (stepErrorContainer && document.getElementById(`step${stepIndex + 1}ErrorText`)) {
                const errorText = document.getElementById(`step${stepIndex + 1}ErrorText`);
                errorText.textContent = errorMessages.join('، ');
                stepErrorContainer.style.display = 'block';
                stepErrorContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                // Fallback to old method if error container doesn't exist
                const alertEl = createValidationAlert(currentStepEl, errorMessages);
                alertEl.style.display = 'block';
            }

            // Scroll to the first error field
            const firstInvalidField = currentStepEl.querySelector('.is-invalid');
            if (firstInvalidField) {
                firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setTimeout(() => firstInvalidField.focus(), 500);
            }
        }

        return isValid;
    }

    // Validate basic information step
    function validateBasicInfoStep(stepEl, errorMessages) {
        let isValid = true;

        // Client validation - this is now a critical requirement
        const clientSelect = stepEl.querySelector('#clientSelect');
        if (clientSelect && !clientSelect.value) {
            errorMessages.push('الرجاء اختيار عميل أو إضافة عميل جديد');
            isValid = false;

            // Add red border to the client select
            if (clientSelect.parentNode) {
                clientSelect.parentNode.classList.add('border', 'border-danger');

                // Remove highlight when client is selected
                clientSelect.addEventListener('change', function () {
                    if (this.value) {
                        this.parentNode.classList.remove('border', 'border-danger');
                    }
                }, { once: true });
            }

            // Show specific error in step1 error container
            const stepErrorContainer = document.getElementById('step1ErrorContainer');
            const stepErrorText = document.getElementById('step1ErrorText');
            if (stepErrorContainer && stepErrorText) {
                stepErrorText.textContent = 'يجب اختيار عميل قبل المتابعة';
                stepErrorContainer.style.display = 'block';
                stepErrorContainer.scrollIntoView({ behavior: 'smooth' });
            }

            // Add event listener to hide error when client is selected
            clientSelect.addEventListener('change', function () {
                if (this.value) {
                    const errorContainer = document.getElementById('step1ErrorContainer');
                    if (errorContainer) {
                        errorContainer.style.display = 'none';
                    }
                }
            }, { once: true });

            return false; // Stop validation here as client selection is required
        }

        // Order number validation
        const orderNumber = stepEl.querySelector('#orderNumber');
        if (orderNumber && !orderNumber.value.trim()) {
            errorMessages.push('الرجاء إدخال رقم الطلب');
            isValid = false;
            markInvalid(orderNumber, 'هذا الحقل مطلوب');
        }

        // Inspection date validation
        const inspectionDate = stepEl.querySelector('#inspectionDate');
        if (inspectionDate && !inspectionDate.value) {
            errorMessages.push('الرجاء تحديد تاريخ الفحص');
            isValid = false;
            markInvalid(inspectionDate, 'هذا الحقل مطلوب');
        }

        // Device model validation
        const deviceModel = stepEl.querySelector('#deviceModel');
        if (deviceModel && !deviceModel.value.trim()) {
            errorMessages.push('الرجاء إدخال موديل الجهاز');
            isValid = false;
            markInvalid(deviceModel, 'هذا الحقل مطلوب');
        }

        // Serial number validation
        const serialNumber = stepEl.querySelector('#serialNumber');
        if (serialNumber && !serialNumber.value.trim()) {
            errorMessages.push('الرجاء إدخال الرقم التسلسلي');
            isValid = false;
            markInvalid(serialNumber, 'هذا الحقل مطلوب');
        }

        // Device CPU validation
        const deviceCPU = stepEl.querySelector('#deviceCPU');
        if (deviceCPU && !deviceCPU.value.trim()) {
            errorMessages.push('الرجاء إدخال معلومات المعالج (CPU)');
            isValid = false;
            markInvalid(deviceCPU, 'هذا الحقل مطلوب');
        }

        // Device GPU validation
        const deviceGPU = stepEl.querySelector('#deviceGPU');
        if (deviceGPU && !deviceGPU.value.trim()) {
            errorMessages.push('الرجاء إدخال معلومات كرت الشاشة (GPU)');
            isValid = false;
            markInvalid(deviceGPU, 'هذا الحقل مطلوب');
        }

        // Device RAM validation
        const deviceRAM = stepEl.querySelector('#deviceRAM');
        if (deviceRAM && !deviceRAM.value.trim()) {
            errorMessages.push('الرجاء إدخال معلومات الذاكرة (RAM)');
            isValid = false;
            markInvalid(deviceRAM, 'هذا الحقل مطلوب');
        }

        // Device Storage validation
        const deviceStorage = stepEl.querySelector('#deviceStorage');
        if (deviceStorage && !deviceStorage.value.trim()) {
            errorMessages.push('الرجاء إدخال معلومات التخزين (Storage)');
            isValid = false;
            markInvalid(deviceStorage, 'هذا الحقل مطلوب');
        }

        return isValid;
    }

    // Validate technical tests step
    function validateTechnicalTestsStep(stepEl, errorMessages) {
        let isValid = true;

        // Check hardware components
        const hardwareComponents = [
            'camera_status', 'speakers_status', 'microphone_status', 'wifi_status',
            'lan_status', 'usb_status', 'keyboard_status', 'touchpad_status',
            'card_reader_status', 'audio_jack_status'
        ];

        const unselectedComponents = [];

        hardwareComponents.forEach(component => {
            const checkedInput = stepEl.querySelector(`input[name="${component}"]:checked`);
            if (!checkedInput) {
                unselectedComponents.push(component.replace('_status', '').replace('_', ' '));
                isValid = false;

                // Highlight the component row
                const componentRow = stepEl.querySelector(`input[name="${component}"]`).closest('tr');
                if (componentRow) {
                    componentRow.classList.add('table-danger');

                    // Remove highlight when a radio is selected
                    const radios = componentRow.querySelectorAll('input[type="radio"]');
                    radios.forEach(radio => {
                        radio.addEventListener('change', function () {
                            componentRow.classList.remove('table-danger');
                        }, { once: true });
                    });
                }
            }
        });

        if (unselectedComponents.length > 0) {
            errorMessages.push(`الرجاء تحديد حالة المكونات التالية: ${unselectedComponents.join('، ')}`);
        }

        // Check test screenshots (now using URLs instead of file uploads)
        // We'll make this a warning rather than an error, as it's not strictly required
        const components = ['cpu', 'gpu', 'hdd', 'battery'];
        const missingScreenshots = [];

        components.forEach(component => {
            const previewContainer = document.getElementById(`${component}ScreenshotPreview`);
            if (previewContainer) {
                const hasScreenshots = previewContainer.querySelectorAll('.card[data-url]').length > 0;
                if (!hasScreenshots) {
                    // Get component display name
                    let componentName = component;
                    switch (component) {
                        case 'cpu': componentName = 'المعالج'; break;
                        case 'gpu': componentName = 'كرت الشاشة'; break;
                        case 'hdd': componentName = 'القرص الصلب'; break;
                        case 'battery': componentName = 'البطارية'; break;
                    }
                    missingScreenshots.push(componentName);

                    // Highlight the input field
                    const input = document.getElementById(`${component}ScreenshotUrl`);
                    if (input) {
                        input.classList.add('border-warning');

                        // Remove highlight when a URL is entered
                        input.addEventListener('input', function () {
                            this.classList.remove('border-warning');
                        }, { once: true });
                    }
                }
            }
        });

        if (missingScreenshots.length > 0) {
            // Show warning in step2 warning container
            const stepWarningContainer = document.getElementById('step2WarningContainer');
            if (stepWarningContainer) {
                stepWarningContainer.innerHTML = `<div class="alert alert-warning"><i class="fas fa-exclamation-triangle me-2"></i>لم تقم بإضافة صور لنتائج الاختبارات التالية: ${missingScreenshots.join('، ')}. يُفضل إضافة صور لتوثيق نتائج الاختبارات.</div>`;
                stepWarningContainer.style.display = 'block';

                // Auto-hide after 5 seconds
                setTimeout(() => {
                    stepWarningContainer.style.display = 'none';
                }, 5000);
            }
        }

        // Check system components if they exist
        const systemComponents = [
            { id: 'cpuStatus', label: 'المعالج' },
            { id: 'gpuStatus', label: 'كرت الشاشة' },
            { id: 'ramStatus', label: 'الذاكرة' },
            { id: 'storageStatus', label: 'التخزين' },
            { id: 'batteryStatus', label: 'البطارية' }
        ];

        const unselectedSystemComponents = [];

        systemComponents.forEach(component => {
            const select = stepEl.querySelector(`#${component.id}`);
            if (select && !select.value) {
                unselectedSystemComponents.push(component.label);
                isValid = false;
                markInvalid(select, 'الرجاء تحديد الحالة');
            }
        });

        if (unselectedSystemComponents.length > 0) {
            errorMessages.push(`الرجاء تحديد حالة المكونات التالية: ${unselectedSystemComponents.join('، ')}`);
        }

        return isValid;
    }

    // Validate external inspection step
    function validateExternalInspectionStep(stepEl, errorMessages) {
        let isValid = true;

        // Check external condition fields if they exist
        const conditionFields = [
            { id: 'caseCondition', label: 'حالة الهيكل الخارجي' },
            { id: 'screenCondition', label: 'حالة الشاشة' },
            { id: 'keyboardCondition', label: 'حالة لوحة المفاتيح' },
            { id: 'touchpadCondition', label: 'حالة لوحة اللمس' },
            { id: 'portsCondition', label: 'حالة المنافذ' },
            { id: 'hingesCondition', label: 'حالة المفصلات' }
        ];

        const unselectedConditions = [];

        conditionFields.forEach(field => {
            const select = stepEl.querySelector(`#${field.id}`);
            if (select && select.required && !select.value) {
                unselectedConditions.push(field.label);
                isValid = false;
                markInvalid(select, 'الرجاء تحديد الحالة');
            }
        });

        if (unselectedConditions.length > 0) {
            errorMessages.push(`الرجاء تحديد ${unselectedConditions.join('، ')}`);
        }

        // Check if at least one image URL has been added
        const imageUrlBadges = document.querySelectorAll('#imageUrlBadges .badge');
        if (imageUrlBadges.length === 0) {
            // Not making this a hard requirement, just a warning
            const warningContainer = document.getElementById('step3WarningContainer') ||
                document.querySelector('.step-warning-container');

            if (warningContainer) {
                warningContainer.innerHTML = '<div class="alert alert-warning"><i class="fas fa-exclamation-triangle me-2"></i>لم تقم بإضافة أي صور للفحص الخارجي. يُفضل إضافة صور لتوثيق حالة الجهاز.</div>';
                warningContainer.style.display = 'block';

                // Auto-hide after 5 seconds
                setTimeout(() => {
                    warningContainer.style.display = 'none';
                }, 5000);
            }
        }

        return isValid;
    }

    // Validate notes step
    function validateNotesStep(stepEl, errorMessages) {
        // Notes step typically doesn't have required fields
        return validateRequiredFields(stepEl, errorMessages);
    }

    // Validate invoice step
    function validateInvoiceStep(stepEl, errorMessages) {
        // Check if billing is enabled
        const billingEnabled = document.getElementById('enableBilling')?.checked || false;

        // If billing is disabled, no validation needed
        if (!billingEnabled) {
            return true;
        }

        // Auto-fill device details from global variables if they exist
        const invoiceDeviceInput = document.getElementById('invoiceDeviceName');
        const invoiceSerialInput = document.getElementById('invoiceSerialNumber');

        // Check if global device details are available (from create-report.js)
        if (typeof globalDeviceDetails !== 'undefined') {
            // Only auto-fill if the invoice fields are empty
            if (invoiceDeviceInput && !invoiceDeviceInput.value && globalDeviceDetails.deviceModel) {
                invoiceDeviceInput.value = globalDeviceDetails.deviceModel;
            }

            if (invoiceSerialInput && !invoiceSerialInput.value && globalDeviceDetails.serialNumber) {
                invoiceSerialInput.value = globalDeviceDetails.serialNumber;
            }
        } else {
            // Fallback to direct DOM access if global variables aren't available
            const deviceModelInput = document.getElementById('deviceModel');
            const serialNumberInput = document.getElementById('serialNumber');

            if (deviceModelInput && serialNumberInput && invoiceDeviceInput && invoiceSerialInput) {
                // Only auto-fill if the invoice fields are empty
                if (!invoiceDeviceInput.value && deviceModelInput.value) {
                    invoiceDeviceInput.value = deviceModelInput.value;
                }

                if (!invoiceSerialInput.value && serialNumberInput.value) {
                    invoiceSerialInput.value = serialNumberInput.value;
                }
            }
        }

        // Validate required fields
        return validateRequiredFields(stepEl, errorMessages);
    }

    // General validation for required fields
    function validateRequiredFields(stepEl, errorMessages, addMessages = true) {
        const requiredFields = stepEl.querySelectorAll('[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                isValid = false;
                field.classList.add('is-invalid');

                // Add event listener to remove invalid class when user types
                field.addEventListener('input', function () {
                    if (this.value.trim()) {
                        this.classList.remove('is-invalid');
                    }
                }, { once: true });

                // Add error message if needed
                if (addMessages) {
                    const fieldLabel = getFieldLabel(field);
                    errorMessages.push(`الرجاء إدخال ${fieldLabel}`);
                }
            } else {
                field.classList.remove('is-invalid');
            }
        });

        return isValid;
    }

    // Mark a form input as invalid
    function markInvalid(input, message) {
        if (!input) return;

        input.classList.add('is-invalid');

        // Check if feedback element already exists
        let feedbackEl = input.nextElementSibling;
        if (!feedbackEl || !feedbackEl.classList.contains('invalid-feedback')) {
            feedbackEl = document.createElement('div');
            feedbackEl.className = 'invalid-feedback';
            input.parentNode.insertBefore(feedbackEl, input.nextSibling);
        }

        feedbackEl.textContent = message;

        // Add event listener to remove invalid class when user interacts
        input.addEventListener('input', function () {
            if ((this.type === 'text' || this.type === 'textarea' || this.type === 'email' || this.type === 'tel') && this.value.trim()) {
                this.classList.remove('is-invalid');
            } else if (this.type === 'select-one' && this.value) {
                this.classList.remove('is-invalid');
            }
        }, { once: true });
    }

    // Get field label for error messages
    function getFieldLabel(field) {
        // Try to find a label for this field
        const id = field.id;
        if (id) {
            const label = document.querySelector(`label[for="${id}"]`);
            if (label) {
                return label.textContent;
            }
        }

        // If no label found, use placeholder or name
        return field.placeholder || field.name || 'هذا الحقل';
    }

    // Validate all steps before current one when jumping to a step
    function validateStepsBeforeJump(targetIndex) {
        for (let i = 0; i < targetIndex; i++) {
            if (!validateStep(i)) return false;
        }
        return true;
    }

    // Handle form submission for the final step
    // Form submission is now handled by create-report.js to prevent duplication
    // document.getElementById('reportForm').addEventListener('submit', async function(e) {
    /* Commented out to prevent duplicate form submission
        e.preventDefault();
        if (validateStep(currentStep)) {
            // Use the collectReportData function from create-report.js
            // This ensures consistent data collection across the application
            if (typeof collectReportData === 'function') {
                // Use the apiService reference defined at the top of the file
                const currentApiService = formApiService;
                try {
                    // Show loading indicator
                    const submitBtn = this.querySelector('#submitReportBtn'); // Use specific ID
                    if (submitBtn) {
                        submitBtn.disabled = true;
                        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> جاري الإنشاء...';
                    }
                    
                    // Collect form data
                    const reportData = collectReportData();
                    
                    // Check if billing is enabled
                    const billingEnabled = document.getElementById('enableBilling')?.checked || false;
                    reportData.billing_enabled = billingEnabled;
                    
                    // First, ensure global device price is updated from the input field
                    const devicePriceInput = document.getElementById('devicePrice');
                    if (devicePriceInput && devicePriceInput.value) {
                        const priceValue = parseFloat(devicePriceInput.value) || 0;
                        if (window.globalDeviceDetails) {
                            window.globalDeviceDetails.devicePrice = priceValue;
                        }
                        // Also store directly in reportData object
                        reportData.devicePrice = priceValue;
                        console.log('Updated device price:', priceValue);
                    }
                    
                    // CRITICAL: Set amount field directly and explicitly
                    // Try multiple sources to ensure we get a value
                    let devicePrice = 0;
                    
                    // Source priority (most reliable first):
                    if (devicePriceInput && devicePriceInput.value) {
                        // 1. Direct from input field (most reliable)
                        devicePrice = parseFloat(devicePriceInput.value) || 0;
                    } else if (reportData.devicePrice) {
                        // 2. From report data if already set
                        devicePrice = parseFloat(reportData.devicePrice) || 0;
                    } else if (window.globalDeviceDetails && window.globalDeviceDetails.devicePrice) {
                        // 3. From global device details if input field isn't available
                        devicePrice = parseFloat(window.globalDeviceDetails.devicePrice) || 0;
                    }
                    
                    // Always set the amount field EXPLICITLY regardless of billing_enabled status
                    reportData.amount = devicePrice;
                    console.log('Final report amount set to:', reportData.amount);
                    
                    // Force direct assignment to window.reportData for debugging purposes
                    window.reportData = reportData;
                    console.log('Report data with amount:', reportData);
                    
                    // Prepare technical tests data
                    const technicalTests = [];
                    
                    // Hardware components
                    const hardwareComponents = [
                        'camera_status', 'speakers_status', 'microphone_status', 'wifi_status',
                        'lan_status', 'usb_status', 'keyboard_status', 'touchpad_status',
                        'card_reader_status', 'audio_jack_status'
                    ];
                    
                    hardwareComponents.forEach(component => {
                        const checkedInput = document.querySelector(`input[name="${component}"]:checked`);
                        if (checkedInput) {
                            technicalTests.push({
                                componentName: component.replace('_status', ''),
                                status: checkedInput.value,
                                notes: ''
                            });
                        }
                    });
                    
                    // System components
                    const systemComponents = [
                        { id: 'cpuStatus', name: 'cpu' },
                        { id: 'gpuStatus', name: 'gpu' },
                        { id: 'ramStatus', name: 'ram' },
                        { id: 'storageStatus', name: 'storage' },
                        { id: 'batteryStatus', name: 'battery' }
                    ];
                    
                    systemComponents.forEach(component => {
                        const select = document.getElementById(component.id);
                        if (select && select.value) {
                            technicalTests.push({
                                componentName: component.name,
                                status: select.value,
                                notes: ''
                            });
                        }
                    });
                    
                    // Prepare external inspection data
                    const externalInspection = [];
                    
                    // External condition fields
                    const conditionFields = [
                        { id: 'caseCondition', name: 'case' },
                        { id: 'screenCondition', name: 'screen' },
                        { id: 'keyboardCondition', name: 'keyboard' },
                        { id: 'touchpadCondition', name: 'touchpad' },
                        { id: 'portsCondition', name: 'ports' },
                        { id: 'hingesCondition', name: 'hinges' }
                    ];
                    
                    conditionFields.forEach(field => {
                        const select = document.getElementById(field.id);
                        if (select && select.value) {
                            externalInspection.push({
                                componentName: field.name,
                                status: select.value,
                                notes: ''
                            });
                        }
                    });
                    
                    // Add technical tests and external inspection to report data
                    reportData.technicalTests = technicalTests;
                    reportData.externalInspection = externalInspection;
                    
                    // Save report data to API
                    let savedReport;
                    console.log('Attempting to save report to API...');
                    console.log('API Service available:', !!currentApiService);
                    console.log('createReport function available:', typeof currentApiService?.createReport === 'function');
                    
                    if (currentApiService && typeof currentApiService.createNewReport === 'function') {
                        try {
                            console.log('Making API call to create report with data using dedicated endpoint:', JSON.stringify(reportData, null, 2));
                            savedReport = await currentApiService.createNewReport(reportData);
                            console.log('Report saved to API successfully:', savedReport);
                        } catch (apiError) {
                            console.error('Error saving report to API:', apiError);
                            // Fall back to localStorage
                            saveReportData(reportData);
                            savedReport = reportData;
                        }
                    } else {
                        console.error('API service or createReport function not available');
                        // Fall back to localStorage
                        saveReportData(reportData);
                        savedReport = reportData;
                    }
                    
                    // Generate invoice if billing is enabled
                    let invoice = null;
                    
                    // Get the billing toggle state
                    const freshBillingToggle = document.getElementById('enableBilling');
                    let isBillingEnabled = false;
                    
                    if (freshBillingToggle) {
                        isBillingEnabled = freshBillingToggle.checked;
                        console.log('Billing toggle checked property:', isBillingEnabled);
                    } else {
                        console.warn('Billing toggle element not found in the DOM');
                    }
                    
                    // Always ensure devicePrice is captured in amount field regardless of billing status
                    // This ensures that reports show the correct price even if billing is disabled
                    if (!reportData.amount && window.globalDeviceDetails?.devicePrice) {
                        reportData.amount = window.globalDeviceDetails.devicePrice;
                        console.log('Setting report amount from globalDeviceDetails.devicePrice:', reportData.amount);
                    }
                    
                    // If amount is still not set, check for devicePrice directly
                    if (!reportData.amount && reportData.devicePrice) {
                        reportData.amount = reportData.devicePrice;
                        console.log('Setting report amount from reportData.devicePrice:', reportData.amount);
                    }
                    
                    // Ensure savedReport also has the amount
                    if (savedReport && !savedReport.amount && (window.globalDeviceDetails?.devicePrice || reportData.amount)) {
                        savedReport.amount = window.globalDeviceDetails?.devicePrice || reportData.amount;
                        console.log('Updating savedReport.amount:', savedReport.amount);
                    }
                    
                    console.log('Report created with billing_enabled:', isBillingEnabled);
                    
                    // Create invoice only if billing is enabled
                    if (isBillingEnabled && savedReport && savedReport.id && currentApiService && 
                        typeof currentApiService.getInvoices === 'function' && 
                        typeof currentApiService.createInvoice === 'function') {
                        
                        try {
                            // First verify no invoice exists for this report
                            console.log('Checking if invoice already exists for report:', savedReport.id);
                            const existingInvoices = await currentApiService.getInvoices();
                            const existingInvoice = existingInvoices.find(inv => 
                                inv.report_id === savedReport.id);
                                
                            if (existingInvoice) {
                                // Already exists, just use it
                                console.log('Found existing invoice for this report:', existingInvoice);
                                invoice = existingInvoice;
                            } else {
                                // Create a basic invoice for the report
                                const basicInvoiceData = {
                                    id: `INV${Date.now()}`, // Generate a unique ID for the invoice
                                    client_id: Number(savedReport.client_id), // Convert to number to pass validation
                                    report_id: savedReport.id,
                                    date: new Date().toISOString(),
                                    // Use device price from report or global, or default to 0
                                    subtotal: savedReport.amount || window.globalDeviceDetails?.devicePrice || 0,
                                    taxRate: 0, // Default tax rate set to 0% as requested
                                    discount: 0, // Default discount
                                    paymentStatus: 'unpaid',
                                    items: [{
                                        description: `${savedReport.deviceModel || window.globalDeviceDetails?.deviceModel || 'Device'} (SN: ${savedReport.serialNumber || window.globalDeviceDetails?.serialNumber || 'N/A'})`,
                                        amount: savedReport.amount || window.globalDeviceDetails?.devicePrice || 0,
                                        quantity: 1,
                                        totalAmount: (savedReport.amount || window.globalDeviceDetails?.devicePrice || 0) * 1, // Calculate line total (price * quantity)
                                        type: 'laptop',
                                        serialNumber: savedReport.serialNumber || window.globalDeviceDetails?.serialNumber || ''
                                    }]
                                };
                                
                                // Calculate tax and total
                                const taxAmount = basicInvoiceData.subtotal * (basicInvoiceData.taxRate / 100);
                                basicInvoiceData.tax = parseFloat(taxAmount.toFixed(2));
                                basicInvoiceData.total = basicInvoiceData.subtotal + basicInvoiceData.tax - basicInvoiceData.discount;
                                
                                console.log('Creating basic invoice for report:', basicInvoiceData);
                                invoice = await currentApiService.createInvoice(basicInvoiceData);
                                console.log('Successfully created invoice:', invoice);
                            }
                        } catch (invoiceError) {
                            console.warn('Error during invoice creation:', invoiceError);
                            // Continue with the report creation process even if invoice creation fails
                        }
                    }
                    
                    // Clear all validation errors before showing success
                    // Hide all step error containers
                    if (typeof hideAllStepErrors === 'function') {
                        hideAllStepErrors();
                    } else {
                        // Fallback implementation
                        for (let i = 1; i <= 5; i++) {
                            const stepErrorContainer = document.getElementById(`step${i}ErrorContainer`);
                            if (stepErrorContainer) {
                                stepErrorContainer.style.display = 'none';
                            }
                        }
                    }
                    
                    // Hide any form validation markings
                    const invalidFields = document.querySelectorAll('.is-invalid');
                    invalidFields.forEach(field => {
                        field.classList.remove('is-invalid');
                        // Remove any invalid-feedback elements next to this field
                        const feedback = field.nextElementSibling;
                        if (feedback && feedback.classList.contains('invalid-feedback')) {
                            feedback.textContent = '';
                        }
                    });
                    
                    // Hide any general form alert
                    const reportFormAlert = document.getElementById('reportFormAlert');
                    if (reportFormAlert) {
                        reportFormAlert.style.display = 'none';
                    }
                    
                    // Update success modal with report and invoice info
                    updateSuccessModal(savedReport, invoice);
                    
                    // Show success modal
                    const successModal = new bootstrap.Modal(document.getElementById('reportCreatedModal'));
                    successModal.show();
                    
                    // Reset form
                    this.reset();
                    currentStep = 0;
                    showStep(currentStep);
                    updateProgressBar();
                } catch (error) {
                    console.error('Error creating report:', error);
                    alert('حدث خطأ أثناء إنشاء التقرير. الرجاء المحاولة مرة أخرى.');
                    
                    // Re-enable submit button
                    const submitBtn = this.querySelector('#submitReportBtn'); // Use specific ID
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = 'إنشاء التقرير';
                    }
                }
            } else {
                console.error('collectReportData function not found. Make sure create-report.js is loaded before form-steps.js');
                alert('خطأ في معالجة البيانات. الرجاء المحاولة مرة أخرى.');
            }
        }
    }); */

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

        // Also save to client-specific reports if client_id exists
        if (reportData.client_id) {
            let clientReports = JSON.parse(localStorage.getItem(`lpk_client_${reportData.client_id}_reports`) || '[]');
            clientReports.push(reportData);
            localStorage.setItem(`lpk_client_${reportData.client_id}_reports`, JSON.stringify(clientReports));
        }
    }

    /**
     * Generate a unique invoice number
     * @returns {string} The generated invoice number
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
     * Update success modal with report and invoice information
     * @param {Object} reportData - The saved report data
     * @param {Object} invoice - The generated invoice
     */
    function updateSuccessModal(reportData, invoice) {
        const modal = document.getElementById('reportCreatedModal');
        if (!modal) return;

        // Update report ID
        const reportIdEl = modal.querySelector('#createdReportId');
        if (reportIdEl) reportIdEl.textContent = reportData.id;

        // Update report link
        const reportLinkEl = modal.querySelector('#reportLink');
        if (reportLinkEl) reportLinkEl.value = `${window.location.origin}/report.html?id=${reportData.id}`;

        // Update invoice information if available
        const invoiceInfoEl = modal.querySelector('#invoiceInfo');
        if (invoiceInfoEl) {
            if (invoice) {
                invoiceInfoEl.innerHTML = `
                    <div class="alert alert-success">
                        <i class="fas fa-file-invoice me-2"></i>
                        تم إنشاء الفاتورة رقم <strong>${invoice.id}</strong>
                    </div>
                `;
            } else if (reportData.billing_enabled) {
                invoiceInfoEl.innerHTML = `
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle me-2"></i>
                        تم تفعيل الفوترة لهذا التقرير. يمكنك إنشاء فاتورة من صفحة <a href="create-invoice.html" class="alert-link">إنشاء فاتورة</a>.
                    </div>
                `;
            } else {
                invoiceInfoEl.innerHTML = '';
            }
        }

        // Set up view report button
        const viewReportBtn = modal.querySelector('#viewReportBtn');
        if (viewReportBtn) {
            viewReportBtn.onclick = function (e) {
                e.preventDefault();
                window.location.href = `report.html?id=${reportData.id}`;
            };
        }

        // Set up create invoice button if billing is enabled but no invoice was created
        const createInvoiceBtn = modal.querySelector('#createInvoiceBtn');
        if (createInvoiceBtn) {
            if (reportData.billing_enabled && !invoice) {
                createInvoiceBtn.style.display = 'inline-block';
                createInvoiceBtn.onclick = function (e) {
                    e.preventDefault();
                    window.location.href = 'create-invoice.html';
                };
            } else {
                createInvoiceBtn.style.display = 'none';
            }
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
                    <img src="assets/images/logo.png" alt="Laapak" width="120" class="mb-3">
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
        document.getElementById('deviceVideo').addEventListener('change', function (e) {
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
                btn.addEventListener('click', function () {
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
        document.getElementById('copyLinkBtn').addEventListener('click', function () {
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
        document.getElementById('whatsappShareBtn').addEventListener('click', function (e) {
            e.preventDefault();
            const reportLink = document.getElementById('reportLink').value;
            const whatsappLink = `https://wa.me/?text=${encodeURIComponent('تقرير الفحص الخاص بك من Laapak: ' + reportLink)}`;
            window.open(whatsappLink, '_blank');
        });
    }

    if (document.getElementById('copyLinkBtn')) {
        document.getElementById('copyLinkBtn').addEventListener('click', function (e) {
            e.preventDefault();
            // Get the current URL
            const reportUrl = window.location.href;

            // Copy to clipboard
            navigator.clipboard.writeText(reportUrl).then(function () {
                // Show success message
                alert('تم نسخ رابط التقرير بنجاح');
            }).catch(function () {
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
