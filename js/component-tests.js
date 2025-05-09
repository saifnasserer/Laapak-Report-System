/**
 * Laapak Report System
 * Component Tests Management
 */

// Make sure all scripts and styles are fully loaded
window.addEventListener('load', function() {
    // Default test descriptions
    const defaultDescriptions = {
        cpu: "تم فحص المعالج بنجاح وهو يعمل بشكل ممتاز. جميع الاختبارات اجتازها بنجاح.",
        gpu: "تم فحص كارت الشاشة وهو يعمل بشكل ممتاز بدون أي مشاكل في الأداء أو الحرارة.",
        hardDrive: "تم فحص القرص الصلب ولم يتم العثور على أي قطاعات تالفة أو مشاكل في الأداء.",
        battery: "تم فحص البطارية وهي في حالة ممتازة. الشحن يعمل بشكل صحيح ومدة البطارية جيدة.",
        keyboard: "تم فحص لوحة المفاتيح وجميع المفاتيح تعمل بشكل صحيح بدون أي مشاكل.",
        deviceDetails: "تم فحص تفاصيل الجهاز ومواصفاته مطابقة للمعلومات المقدمة.",
        dxDiag: "تم استخراج تقرير DxDiag وتحليله، ولم يتم العثور على أي مشاكل تقنية.",
        custom: "تم إجراء الفحص بنجاح وتم اجتياز جميع الاختبارات."
    };

    // Available test types
    const testTypes = [
        { id: 'cpu', name: 'اختبار المعالج', icon: 'microchip' },
        { id: 'gpu', name: 'اختبار كارت الشاشة', icon: 'vr-cardboard' },
        { id: 'hardDrive', name: 'اختبار القرص الصلب', icon: 'hdd' },
        { id: 'battery', name: 'اختبار البطارية', icon: 'battery-full' },
        { id: 'keyboard', name: 'اختبار لوحة المفاتيح', icon: 'keyboard' },
        { id: 'deviceDetails', name: 'تفاصيل الجهاز', icon: 'laptop-code' },
        { id: 'dxDiag', name: 'تقرير DxDiag', icon: 'file-code' },
        { id: 'custom', name: 'فحص مخصص', icon: 'tools' }
    ];

    // Elements
    const addComponentTestBtn = document.getElementById('addComponentTest');
    const componentTestsContainer = document.getElementById('componentTestsContainer');
    const addComponentModal = document.getElementById('addComponentModal');
    const testTypeCards = document.querySelectorAll('.test-type-card');
    const confirmAddTest = document.getElementById('confirmAddTest');
    const customTestNameContainer = document.getElementById('customTestNameContainer');

    // Add styles for the icons if not already added
    const styles = `
        .icon-circle {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.25rem;
        }
        .test-type-card {
            cursor: pointer;
            transition: all 0.3s ease;
            border: 2px solid transparent;
        }
        .test-type-card:hover {
            transform: translateY(-3px);
        }
        .test-type-card.selected {
            border-color: var(--laapak-medium-green);
            background-color: rgba(14, 175, 84, 0.05);
        }
    `;

    // Add styles if they don't exist
    if (!document.getElementById('component-test-styles')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'component-test-styles';
        styleElement.textContent = styles;
        document.head.appendChild(styleElement);
    }

    // Add click event listener to the Add Component Test button
    if (addComponentTestBtn) {
        addComponentTestBtn.addEventListener('click', function() {
            const modalElement = document.getElementById('addComponentModal');
            if (modalElement) {
                const modal = new bootstrap.Modal(modalElement);
                modal.show();
            }
        });
    }

    // Initialize existing reset buttons
    document.querySelectorAll('.reset-default-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const defaultText = this.getAttribute('data-default-text');
            const textareaId = this.closest('.input-group').querySelector('textarea').id;
            document.getElementById(textareaId).value = defaultText;
        });
    });

    // Add event listener to the confirmAddTest button
    if (confirmAddTest) {
        confirmAddTest.addEventListener('click', function() {
            const selectedCard = document.querySelector('.test-type-card.selected');
    
    // Add event delegation for remove test buttons
    if (componentTestsContainer) {
        componentTestsContainer.addEventListener('click', function(e) {
            if (e.target.classList.contains('remove-test-btn') || 
                e.target.closest('.remove-test-btn')) {
                const btn = e.target.closest('.remove-test-btn');
                if (!btn.disabled) {
                    removeComponentTest(btn);
                }
            }
        });
    }
    
    /**
     * Initialize component tests
     */
    function initializeComponentTests() {
        // Enable remove buttons except for CPU test (which is required)
        const removeButtons = document.querySelectorAll('.remove-test-btn');
        removeButtons.forEach(btn => {
            const card = btn.closest('.component-test-card');
            if (card && card.dataset.component !== 'cpu') {
                btn.disabled = false;
            }
        });
    }
    
    /**
     * Show component test selection modal
     */
    function showComponentTestModal() {
        // Get existing component types
        const existingComponents = [];
        document.querySelectorAll('.component-test-card').forEach(card => {
            if (card.dataset.component) {
                existingComponents.push(card.dataset.component);
            }
        });
        
        // Show modal (using Bootstrap modal)
        const modal = new bootstrap.Modal(document.getElementById('addComponentModal'));
        modal.show();
        
        // Disable already added components in the modal
        document.querySelectorAll('.test-type-card').forEach(card => {
            const testType = card.dataset.testType;
            if (existingComponents.includes(testType)) {
                card.classList.add('disabled');
                card.style.opacity = '0.5';
            } else {
                card.classList.remove('disabled');
                card.style.opacity = '1';
            }
        });
        
        // Reset selection
        document.querySelectorAll('.test-type-card').forEach(card => {
            card.classList.remove('selected');
        });
        document.getElementById('confirmAddTest').disabled = true;
        
        // Handle test type selection
        const testTypeCards = document.querySelectorAll('.test-type-card');
        testTypeCards.forEach(card => {
            // Remove existing listeners
            card.removeEventListener('click', handleTestTypeSelection);
            // Add new listener
            card.addEventListener('click', handleTestTypeSelection);
        });
        
        // Handle custom test name visibility
        const customTestNameContainer = document.getElementById('customTestNameContainer');
        if (customTestNameContainer) {
            customTestNameContainer.classList.add('d-none');
        }
    }
    
    /**
     * Handle test type selection in modal
     */
    function handleTestTypeSelection(e) {
        const card = e.currentTarget;
        
        // Skip if disabled
        if (card.classList.contains('disabled')) {
            return;
        }
        
        // Toggle selection
        document.querySelectorAll('.test-type-card').forEach(c => {
            c.classList.remove('selected');
        });
        card.classList.add('selected');
        
        // Enable confirm button
        document.getElementById('confirmAddTest').disabled = false;
        
        // Show custom test name field if custom test selected
        const customTestNameContainer = document.getElementById('customTestNameContainer');
        if (customTestNameContainer) {
            if (card.dataset.testType === 'custom') {
                customTestNameContainer.classList.remove('d-none');
                document.getElementById('customTestName').focus();
            } else {
                customTestNameContainer.classList.add('d-none');
            }
        }
        
        // Add event listener to confirm button
        const confirmBtn = document.getElementById('confirmAddTest');
        confirmBtn.removeEventListener('click', handleConfirmAddTest);
        confirmBtn.addEventListener('click', handleConfirmAddTest);
    }
    
    /**
     * Handle confirm add test button click
     */
    function handleConfirmAddTest() {
        const selectedCard = document.querySelector('.test-type-card.selected');
        if (!selectedCard) return;
        
        const testType = selectedCard.dataset.testType;
        let testName = '';
        
        // Get test name based on type
        switch(testType) {
            case 'cpu':
                testName = 'اختبار المعالج';
                break;
            case 'gpu':
                testName = 'اختبار كارت الشاشة';
                break;
            case 'ram':
                testName = 'اختبار الذاكرة';
                break;
            case 'hdd':
                testName = 'اختبار القرص الصلب';
                break;
            case 'battery':
                testName = 'اختبار البطارية';
                break;
            case 'custom':
                testName = document.getElementById('customTestName').value.trim();
                if (!testName) {
                    alert('الرجاء إدخال اسم للفحص المخصص');
                    return;
                }
                break;
            default:
                testName = 'فحص جديد';
        }
        
        // Add the new test card
        addComponentTestCard(testType, testName);
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('addComponentModal'));
        modal.hide();
    }
    
    /**
     * Add a new component test card
     * @param {string} testType - Type of test
     * @param {string} testName - Display name for the test
     */
    function addComponentTestCard(testType, testName) {
        // Create a unique ID for the test
        const testId = testType + '_' + Date.now();
        
        // Get icon based on test type
        let icon = 'fa-microchip';
        switch(testType) {
            case 'gpu': icon = 'fa-tv'; break;
            case 'ram': icon = 'fa-memory'; break;
            case 'hdd': icon = 'fa-hdd'; break;
            case 'battery': icon = 'fa-battery-three-quarters'; break;
            case 'custom': icon = 'fa-tools'; break;
        }
        
        // Create the test card HTML
        const cardHTML = `
        <div class="card component-test-card mb-4" data-component="${testType}" data-test-id="${testId}">
            <div class="card-header bg-light d-flex justify-content-between align-items-center">
                <h5 class="mb-0"><i class="fas ${icon} me-2"></i> ${testName}</h5>
                <div>
                    <button type="button" class="btn btn-sm btn-outline-danger remove-test-btn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div class="card-body">
                <div class="row mb-3">
                    <div class="col-md-6">
                        <label class="form-label">نتيجة الفحص</label>
                        <select class="form-select test-result" name="test_result_${testId}">
                            <option value="pass">ناجح</option>
                            <option value="fail">فاشل</option>
                            <option value="warning">تحذير</option>
                        </select>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">القيمة / النتيجة</label>
                        <input type="text" class="form-control test-value" name="test_value_${testId}" placeholder="أدخل قيمة أو نتيجة الفحص">
                    </div>
                </div>
                <div class="mb-3">
                    <label class="form-label">ملاحظات</label>
                    <textarea class="form-control test-notes" name="test_notes_${testId}" rows="2" placeholder="أدخل أي ملاحظات إضافية"></textarea>
                </div>
                <div class="mb-3">
                    <label class="form-label">صورة الفحص (اختياري)</label>
                    <input type="file" class="form-control test-image" name="test_image_${testId}" accept="image/*">
                </div>
            </div>
        </div>
        `;
        
        // Add the card to the container
        componentTestsContainer.insertAdjacentHTML('beforeend', cardHTML);
    }
    
    /**
     * Remove a component test card
     * @param {HTMLElement} button - The remove button element
     */
    function removeComponentTest(button) {
        const card = button.closest('.component-test-card');
        if (card) {
            // Confirm removal
            if (confirm('هل أنت متأكد من حذف هذا الفحص؟')) {
                card.remove();
            }
        }
    }
    
    /**
     * Collect component tests data
     * @returns {Array} Array of component test data
     */
    function collectComponentTestsData() {
        const testsData = [];
        const testCards = document.querySelectorAll('.component-test-card');
        
        testCards.forEach(card => {
            const testId = card.dataset.testId;
            const testType = card.dataset.component;
            const testName = card.querySelector('.card-header h5').textContent.trim();
            const testResult = card.querySelector('.test-result').value;
            const testValue = card.querySelector('.test-value').value;
            const testNotes = card.querySelector('.test-notes').value;
            
            testsData.push({
                id: testId,
                type: testType,
                name: testName,
                result: testResult,
                value: testValue,
                notes: testNotes
            });
        });
        
        return testsData;
    }
    
    // Expose the function to the global scope
    window.componentTestsHandler = window.componentTestsHandler || {};
    window.componentTestsHandler.collectComponentTestsData = collectComponentTestsData;
});

// Hardware Components Checklist Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Handle Add Custom Component button
    const addCustomComponentBtn = document.getElementById('addCustomComponentBtn');
    if (addCustomComponentBtn) {
        addCustomComponentBtn.addEventListener('click', addCustomComponent);
    }

    /**
     * Add a custom component to the hardware components table
     */
    function addCustomComponent() {
        // Show modal to get component name
        const componentName = prompt('أدخل اسم المكون الجديد:');
        
        if (!componentName || componentName.trim() === '') {
            return;
        }
        
        // Create a unique ID based on the component name
        const componentId = 'custom_' + componentName.toLowerCase().replace(/\s+/g, '_');
        
        // Check if component already exists
        if (document.querySelector(`[name="${componentId}_status"]`)) {
            alert('هذا المكون موجود بالفعل!');
            return;
        }
        
        // Create new table row
        const table = document.getElementById('hardwareComponentsTable').getElementsByTagName('tbody')[0];
        const newRow = table.insertRow();
        
        // Component name cell
        const nameCell = newRow.insertCell(0);
        nameCell.innerHTML = `<i class="fas fa-microchip text-primary me-2"></i> ${componentName}`;
        
        // Working status cell
        const workingCell = newRow.insertCell(1);
        workingCell.className = 'text-center';
        workingCell.innerHTML = `
            <div class="form-check d-inline-block">
                <input class="form-check-input" type="radio" name="${componentId}_status" id="${componentId}_working" value="working" checked>
                <label class="form-check-label" for="${componentId}_working"></label>
            </div>
        `;
        
        // Not working status cell
        const notWorkingCell = newRow.insertCell(2);
        notWorkingCell.className = 'text-center';
        notWorkingCell.innerHTML = `
            <div class="form-check d-inline-block">
                <input class="form-check-input" type="radio" name="${componentId}_status" id="${componentId}_not_working" value="not_working">
                <label class="form-check-label" for="${componentId}_not_working"></label>
            </div>
        `;
        
        // Not available status cell
        const notAvailableCell = newRow.insertCell(3);
        notAvailableCell.className = 'text-center';
        notAvailableCell.innerHTML = `
            <div class="form-check d-inline-block">
                <input class="form-check-input" type="radio" name="${componentId}_status" id="${componentId}_not_available" value="not_available">
                <label class="form-check-label" for="${componentId}_not_available"></label>
            </div>
        `;
        
        // Highlight the new row briefly
        newRow.classList.add('table-success');
        setTimeout(() => {
            newRow.classList.remove('table-success');
        }, 1500);
    }
    
    /**
     * Collect hardware components data
     * @returns {Array} Array of hardware components with their status
     */
    function collectHardwareComponentsData() {
        const componentsData = [];
        const statusRadios = document.querySelectorAll('#hardwareComponentsTable input[type="radio"]:checked');
        
        statusRadios.forEach(radio => {
            const name = radio.name.replace('_status', '');
            const status = radio.value;
            
            // Get component name from the table cell
            const row = radio.closest('tr');
            const componentNameCell = row.cells[0];
            const componentName = componentNameCell.textContent.trim();
            
            componentsData.push({
                id: name,
                name: componentName,
                status: status
            });
        });
        
        return componentsData;
    }
    
    // Expose the function to the global scope
    window.componentTestsHandler = window.componentTestsHandler || {};
    window.componentTestsHandler.collectHardwareComponentsData = collectHardwareComponentsData;
})}})