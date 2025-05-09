
/**
 * Invoice Form Handler
 * Manages the invoice form functionality in the create-report.html page
 * Focused on laptop sales with additional items
 */

document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const laptopsContainer = document.getElementById('laptopsContainer');
    const itemsContainer = document.getElementById('itemsContainer');
    const addLaptopBtn = document.getElementById('addLaptopBtn');
    const addItemBtn = document.getElementById('addItemBtn');
    // const diagnosticFee = document.getElementById('diagnosticFee');
    // const laborFee = document.getElementById('laborFee');
    const taxRate = document.getElementById('taxRate');
    const discount = document.getElementById('discount');
    
    // Display elements
    // const diagnosticFeeDisplay = document.getElementById('diagnosticFeeDisplay');
    // const laborFeeDisplay = document.getElementById('laborFeeDisplay');
    const partsTotalDisplay = document.getElementById('partsTotal');
    const subtotalDisplay = document.getElementById('subtotalDisplay');
    const discountDisplay = document.getElementById('discountDisplay');
    const taxDisplay = document.getElementById('taxDisplay');
    const totalDisplay = document.getElementById('totalDisplay');
    
    // Initialize
    updateInvoiceSummary();
    
    // Event Listeners
    if (addLaptopBtn) {
        addLaptopBtn.addEventListener('click', addNewLaptop);
    }
    
    if (addItemBtn) {
        addItemBtn.addEventListener('click', addNewItem);
    }
    
    // Add event listeners to existing input fields
    // if (diagnosticFee) diagnosticFee.addEventListener('input', updateInvoiceSummary);
    // if (laborFee) laborFee.addEventListener('input', updateInvoiceSummary);
    if (taxRate) taxRate.addEventListener('input', updateInvoiceSummary);
    if (discount) discount.addEventListener('input', updateInvoiceSummary);
    
    // Add event delegation for laptop rows
    if (laptopsContainer) {
        laptopsContainer.addEventListener('click', function(e) {
            if (e.target.classList.contains('remove-laptop-btn') || 
                e.target.closest('.remove-laptop-btn')) {
                const row = e.target.closest('.laptop-row');
                if (row) {
                    // Also remove any associated additional serials container
                    const nextElement = row.nextElementSibling;
                    if (nextElement && nextElement.classList.contains('additional-serials-container')) {
                        nextElement.remove();
                    }
                    row.remove();
                    updateInvoiceSummary();
                }
            }
        });
        
        laptopsContainer.addEventListener('input', function(e) {
            if (e.target.classList.contains('laptop-price') || 
                e.target.classList.contains('laptop-qty')) {
                updateInvoiceSummary();
                
                // If quantity changes, handle additional serial numbers
                if (e.target.classList.contains('laptop-qty')) {
                    handleAdditionalSerials(e.target);
                }
            }
        });
    }
    
    // Add event delegation for additional items
    if (itemsContainer) {
        itemsContainer.addEventListener('click', function(e) {
            if (e.target.classList.contains('remove-item-btn') || 
                e.target.closest('.remove-item-btn')) {
                const row = e.target.closest('.item-row');
                if (row) {
                    row.remove();
                    updateInvoiceSummary();
                }
            }
        });
        
        itemsContainer.addEventListener('input', function(e) {
            if (e.target.classList.contains('item-price') || 
                e.target.classList.contains('item-qty')) {
                updateInvoiceSummary();
            }
        });
    }
    
    /**
     * Add a new laptop row to the laptops container
     */
    function addNewLaptop() {
        const newRow = document.createElement('div');
        newRow.className = 'row mb-3 laptop-row';
        newRow.innerHTML = `
            <div class="col-md-4">
                <label class="form-label">اسم الجهاز</label>
                <input type="text" class="form-control laptop-name" placeholder="موديل الجهاز" />
            </div>
            <div class="col-md-3">
                <label class="form-label">الرقم التسلسلي</label>
                <input type="text" class="form-control laptop-serial" placeholder="الرقم التسلسلي" />
            </div>
            <div class="col-md-2">
                <label class="form-label">السعر</label>
                <input type="number" class="form-control laptop-price" placeholder="السعر" min="0" step="0.01" />
            </div>
            <div class="col-md-2">
                <label class="form-label">الكمية</label>
                <input type="number" class="form-control laptop-qty" value="1" min="1" max="100" onchange="handleQuantityChange(this)" />
            </div>
            <div class="col-md-1">
                <label class="form-label">&nbsp;</label>
                <button type="button" class="btn btn-outline-danger remove-laptop-btn d-block">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="col-12 additional-serials-container" style="display: none;">
                <div class="card mt-2 mb-2">
                    <div class="card-header bg-light">
                        <h6 class="mb-0">الأرقام التسلسلية الإضافية</h6>
                    </div>
                    <div class="card-body additional-serials-list">
                        <!-- Additional serial numbers will be added here -->
                    </div>
                </div>
            </div>
        `;
        
        laptopsContainer.appendChild(newRow);
        updateInvoiceSummary();
    }
    
    /**
     * Add a new additional item row
     */
    function addNewItem() {
        const newRow = document.createElement('div');
        newRow.className = 'row mb-3 item-row';
        newRow.innerHTML = `
            <div class="col-md-5">
                <label class="form-label">اسم العنصر</label>
                <input type="text" class="form-control item-name" placeholder="اسم العنصر" />
            </div>
            <div class="col-md-3">
                <label class="form-label">السعر</label>
                <input type="number" class="form-control item-price" placeholder="السعر" min="0" step="0.01" />
            </div>
            <div class="col-md-3">
                <label class="form-label">الكمية</label>
                <input type="number" class="form-control item-qty" value="1" min="1" />
            </div>
            <div class="col-md-1">
                <label class="form-label">&nbsp;</label>
                <button type="button" class="btn btn-outline-danger remove-item-btn d-block">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        itemsContainer.appendChild(newRow);
        updateInvoiceSummary();
    }
    
    /**
     * Handle the display of additional serial number fields based on quantity
     * @param {HTMLElement} qtyInput - The quantity input element
     */
    function handleAdditionalSerials(qtyInput) {
        const laptopRow = qtyInput.closest('.laptop-row');
        const qty = parseInt(qtyInput.value) || 1;
        
        // Find or create the additional serials container
        let serialsContainer = laptopRow.nextElementSibling;
        if (!serialsContainer || !serialsContainer.classList.contains('additional-serials-container')) {
            serialsContainer = document.createElement('div');
            serialsContainer.className = 'additional-serials-container mb-3';
            serialsContainer.innerHTML = `
                <div class="card">
                    <div class="card-header bg-light">
                        <h6 class="mb-0">الأرقام التسلسلية الإضافية</h6>
                    </div>
                    <div class="card-body pt-2 additional-serials">
                        <!-- Additional serial numbers will be added here dynamically -->
                    </div>
                </div>
            `;
            
            // Insert after the laptop row
            laptopRow.parentNode.insertBefore(serialsContainer, laptopRow.nextSibling);
        }
        
        const serialsFieldsContainer = serialsContainer.querySelector('.additional-serials');
        
        // If quantity is 1, hide the additional serials container
        if (qty <= 1) {
            serialsContainer.classList.add('d-none');
            return;
        }
        
        // Show the container and update the fields
        serialsContainer.classList.remove('d-none');
        
        // Clear existing fields
        serialsFieldsContainer.innerHTML = '';
        
        // Add fields for additional serials (qty - 1 because the first one is in the main row)
        for (let i = 2; i <= qty; i++) {
            const serialField = document.createElement('div');
            serialField.className = 'mb-2';
            serialField.innerHTML = `
                <div class="input-group">
                    <span class="input-group-text">جهاز ${i}</span>
                    <input type="text" class="form-control additional-serial" placeholder="الرقم التسلسلي للجهاز ${i}" data-index="${i}">
                </div>
            `;
            serialsFieldsContainer.appendChild(serialField);
        }
    }
    
    /**
     * Calculate and update the invoice summary
     */
    function updateInvoiceSummary() {
        // Get values
        // const diagnosticFeeValue = parseFloat(diagnosticFee?.value) || 0;
        // const laborFeeValue = parseFloat(laborFee?.value) || 0;
        const taxRateValue = parseFloat(taxRate?.value) || 0;
        const discountValue = parseFloat(discount?.value) || 0;
        
        // Calculate laptops total
        let laptopsTotal = 0;
        const laptopRows = document.querySelectorAll('.laptop-row');
        laptopRows.forEach(row => {
            const price = parseFloat(row.querySelector('.laptop-price')?.value) || 0;
            const qty = parseInt(row.querySelector('.laptop-qty')?.value) || 1;
            laptopsTotal += price * qty;
        });
        
        // Calculate additional items total
        let itemsTotal = 0;
        const itemRows = document.querySelectorAll('.item-row');
        itemRows.forEach(row => {
            const price = parseFloat(row.querySelector('.item-price')?.value) || 0;
            const qty = parseInt(row.querySelector('.item-qty')?.value) || 1;
            itemsTotal += price * qty;
        });
        
        // Calculate subtotal
        const subtotal = laptopsTotal + itemsTotal;
        
        // Calculate tax
        const taxAmount = (subtotal - discountValue) * (taxRateValue / 100);
        
        // Calculate total
        const total = subtotal - discountValue + taxAmount;
        
        // Update displays
        // if (diagnosticFeeDisplay) diagnosticFeeDisplay.textContent = diagnosticFeeValue.toFixed(2) + ' جنية';
        // if (laborFeeDisplay) laborFeeDisplay.textContent = laborFeeValue.toFixed(2) + ' جنية';
        if (partsTotalDisplay) partsTotalDisplay.textContent = (laptopsTotal + itemsTotal).toFixed(2) + ' جنية';
        if (subtotalDisplay) subtotalDisplay.textContent = subtotal.toFixed(2) + ' جنية';
        if (discountDisplay) discountDisplay.textContent = discountValue.toFixed(2) + ' جنية';
        if (taxDisplay) taxDisplay.textContent = taxAmount.toFixed(2) + ' جنية';
        if (totalDisplay) totalDisplay.textContent = total.toFixed(2) + ' جنية';
    }
    
    /**
     * Handle quantity change for laptops to manage additional serial numbers
     * @param {HTMLInputElement} qtyInput - The quantity input element
     */
    function handleQuantityChange(qtyInput) {
        const row = qtyInput.closest('.laptop-row');
        const quantity = parseInt(qtyInput.value) || 1;
        const serialsContainer = row.querySelector('.additional-serials-container');
        const serialsList = row.querySelector('.additional-serials-list');
        
        // Show/hide additional serials container based on quantity
        if (quantity > 1) {
            serialsContainer.style.display = 'block';
            
            // Update the number of serial number fields
            serialsList.innerHTML = '';
            
            // Add fields for additional serial numbers (quantity - 1 because the first one is in the main form)
            for (let i = 0; i < quantity - 1; i++) {
                const serialField = document.createElement('div');
                serialField.className = 'mb-2';
                serialField.innerHTML = `
                    <div class="input-group">
                        <span class="input-group-text">الرقم التسلسلي ${i + 2}</span>
                        <input type="text" class="form-control additional-serial" placeholder="الرقم التسلسلي الإضافي" />
                    </div>
                `;
                serialsList.appendChild(serialField);
            }
        } else {
            serialsContainer.style.display = 'none';
        }
        
        // Update invoice summary
        updateInvoiceSummary();
    }
    
    /**
     * Collect invoice data for submission
     * @returns {Object} Invoice data object
     */
    function collectInvoiceData() {
        // Collect laptops data
        const laptops = [];
        const laptopRows = document.querySelectorAll('.laptop-row');
        
        laptopRows.forEach(row => {
            const nameInput = row.querySelector('.laptop-name');
            const serialInput = row.querySelector('.laptop-serial');
            const priceInput = row.querySelector('.laptop-price');
            const qtyInput = row.querySelector('.laptop-qty');
            
            if (nameInput && nameInput.value.trim() !== '' && 
                priceInput && parseFloat(priceInput.value) > 0) {
                
                const laptopName = nameInput.value.trim();
                const serialNumber = serialInput ? serialInput.value.trim() : '';
                const price = parseFloat(priceInput.value) || 0;
                const qty = parseInt(qtyInput?.value) || 1;
                
                // Collect additional serial numbers if quantity > 1
                const additionalSerials = [];
                if (qty > 1) {
                    const serialsContainer = row.querySelector('.additional-serials-container');
                    if (serialsContainer) {
                        const serialInputs = serialsContainer.querySelectorAll('.additional-serial');
                        serialInputs.forEach(input => {
                            additionalSerials.push(input.value.trim());
                        });
                    }
                }
                
                laptops.push({
                    name: laptopName,
                    serial: serialNumber,
                    additionalSerials: additionalSerials,
                    price: price,
                    quantity: qty,
                    totalPrice: price * qty
                });
            }
        });
        
        // Collect additional items data
        const items = [];
        const itemRows = document.querySelectorAll('.item-row');
        
        itemRows.forEach(row => {
            const nameInput = row.querySelector('.item-name');
            const priceInput = row.querySelector('.item-price');
            const qtyInput = row.querySelector('.item-qty');
            
            if (nameInput && nameInput.value.trim() !== '' && 
                priceInput && parseFloat(priceInput.value) > 0) {
                
                const name = nameInput.value.trim();
                const price = parseFloat(priceInput.value) || 0;
                const qty = parseInt(qtyInput?.value) || 1;
                
                items.push({
                    name: name,
                    price: price,
                    quantity: qty,
                    totalPrice: price * qty
                });
            }
        });
        
        // Get other invoice data
        const invoiceData = {
            // diagnosticFee: parseFloat(diagnosticFee?.value) || 0,
            // laborFee: parseFloat(laborFee?.value) || 0,
            laptops: laptops,
            additionalItems: items,
            taxRate: parseFloat(taxRate?.value) || 0,
            discount: parseFloat(discount?.value) || 0,
            paymentStatus: document.getElementById('paymentStatus')?.value || 'unpaid',
            paymentMethod: document.getElementById('paymentMethod')?.value || '',
            subtotal: parseFloat(subtotalDisplay?.textContent) || 0,
            tax: parseFloat(taxDisplay?.textContent) || 0,
            total: parseFloat(totalDisplay?.textContent) || 0
        };
        
        return invoiceData;
    }
    
    // Expose functions to global scope for use in other scripts
    window.invoiceFormHandler = {
        collectInvoiceData: collectInvoiceData,
        updateInvoiceSummary: updateInvoiceSummary,
        addNewLaptop: addNewLaptop,
        addNewItem: addNewItem
    };
});
