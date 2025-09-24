/**
 * Laapak Report System - Invoice Generator
 * Automatically generates invoices when reports are created
 */

/**
 * Generate a new invoice based on report data and invoice form data
 * @param {object} reportData - The complete report data
 * @param {object} invoiceFormData - Data from the invoice form (optional)
 * @returns {object} The generated invoice object
 */
function generateInvoice(reportData, invoiceFormData = null) {
    // Generate unique invoice ID
    const invoiceId = 'INV' + Date.now().toString().slice(-6);
    
    // Current date for invoice
    const invoiceDate = new Date();
    
    // Initialize variables
    let subtotal = 0;
    let tax = 0;
    let total = 0;
    let discount = 0;
    let taxRate = 0; // Default 14%
    let invoiceItems = [];
    let paymentStatus = 'unpaid';
    let paymentMethod = '';
    let laptops = [];
    let additionalItems = [];
    
    // If invoice form data is provided, use it
    if (invoiceFormData) {
        // // Add diagnostic fee
        // if (invoiceFormData.diagnosticFee > 0) {
        //     invoiceItems.push({
        //         description: 'رسوم التشخيص والفحص',
        //         amount: invoiceFormData.diagnosticFee,
        //         quantity: 1,
        //         type: 'service'
        //     });
        // }
        
        // // Add labor fee
        // if (invoiceFormData.laborFee > 0) {
        //     invoiceItems.push({
        //         description: 'أجور الصيانة والإصلاح',
        //         amount: invoiceFormData.laborFee,
        //         quantity: 1,
        //         type: 'service'
        //     });
        // }
        
        // Add laptops
        if (invoiceFormData.laptops && invoiceFormData.laptops.length > 0) {
            laptops = invoiceFormData.laptops;
            
            // Add laptops to invoice items
            invoiceFormData.laptops.forEach((laptop, index) => {
                // Create separate reports for each laptop or serial number
                if (laptop.quantity === 1) {
                    // Single laptop - one report
                    let serialInfo = laptop.serial ? ` (SN: ${laptop.serial})` : '';
                    
                    // Generate unique invoice ID for each laptop
                    const laptopInvoiceId = invoiceId + '-' + (index + 1);
                    
                    invoiceItems.push({
                        invoiceId: invoiceId, // Link to main invoice
                        description: laptop.name + serialInfo,
                        amount: parseFloat(laptop.price) || 0,
                        quantity: 1,
                        totalAmount: parseFloat(laptop.price) || 0,
                        type: 'laptop',
                        serialNumber: laptop.serial || null
                    });
                } else {
                    // Multiple laptops - create separate report for each one
                    // Start with the main serial number
                    if (laptop.serial) {
                        invoiceItems.push({
                            invoiceId: invoiceId, // Link to main invoice
                            description: laptop.name + ` (SN: ${laptop.serial})`,
                            amount: parseFloat(laptop.price) || 0,
                            quantity: 1,
                            totalAmount: parseFloat(laptop.price) || 0,
                            type: 'laptop',
                            serialNumber: laptop.serial || null
                        });
                    }
                    
                    // Add each additional serial number as a separate item
                    if (laptop.additionalSerials && laptop.additionalSerials.length > 0) {
                        laptop.additionalSerials.forEach((serial, serialIndex) => {
                            if (serial) {
                                invoiceItems.push({
                                    invoiceId: invoiceId, // Link to main invoice
                                    description: laptop.name + ` (SN: ${serial})`,
                                    amount: parseFloat(laptop.price) || 0,
                                    quantity: 1,
                                    totalAmount: parseFloat(laptop.price) || 0,
                                    type: 'laptop',
                                    serialNumber: serial || null
                                });
                            }
                        });
                    }
                }
            });
        }
        
        // Add additional items
        if (invoiceFormData.additionalItems && invoiceFormData.additionalItems.length > 0) {
            additionalItems = invoiceFormData.additionalItems;
            
            // Add additional items to invoice items
            invoiceFormData.additionalItems.forEach(item => {
                invoiceItems.push({
                    invoiceId: invoiceId, // Link to main invoice
                    description: item.name,
                    amount: parseFloat(item.price) || 0,
                    quantity: parseInt(item.quantity) || 1,
                    totalAmount: parseFloat(item.totalPrice) || 0,
                    type: 'item', // Assuming 'item' is a valid enum, or could be 'service'
                    serialNumber: item.serialNumber || null // If additional items can have serial numbers
                });
            });
        }
        
        // Set other values from form
        discount = invoiceFormData.discount || 0;
        taxRate = invoiceFormData.taxRate || 14;
        paymentStatus = invoiceFormData.paymentStatus || 'unpaid';
        paymentMethod = invoiceFormData.paymentMethod || '';
        
        // Calculate totals
        subtotal = calculateSubtotal(invoiceItems);
        tax = ((subtotal - discount) * (taxRate / 100));
        total = subtotal - discount + tax;
    } else {
        // Legacy fallback if no form data is provided
        // Add diagnostic fee
        // invoiceItems.push({
        //     description: 'رسوم التشخيص والفحص',
        //     amount: 150.00,
        //     quantity: 1,
        //     type: 'service'
        // });
        // subtotal += 150.00;
        
        // Add device as a laptop if available in report data
        if (reportData.deviceModel) {
            const serialNumber = reportData.serialNumber || '';
            const serialInfo = serialNumber ? ` (SN: ${serialNumber})` : '';
            
            // Default price if not specified
            const price = 0;
            
            invoiceItems.push({
                invoiceId: invoiceId, // Link to main invoice
                description: reportData.deviceModel + serialInfo,
                amount: parseFloat(price) || 0,
                quantity: 1,
                totalAmount: parseFloat(price) || 0,
                type: 'laptop',
                serialNumber: reportData.serialNumber || null
            });
            
            // Add to laptops array
            laptops.push({
                name: reportData.deviceModel,
                serial: serialNumber,
                price: price,
                quantity: 1,
                totalPrice: price
            });
            
            subtotal += price;
        }
        
        // Add labor costs if applicable
        // if (reportData.solution && (reportData.solution.includes('استبدال') || reportData.solution.includes('إصلاح'))) {
        //     invoiceItems.push({
        //         description: 'أجور الصيانة والإصلاح',
        //         amount: 100.00,
        //         quantity: 1,
        //         type: 'service'
        //     });
        //     subtotal += 100.00;
        // }
        
        // Calculate tax (14%)
        tax = subtotal * 0.14;
        total = subtotal + tax;
    }
    
    // Create invoice object
    const invoice = {
        id: invoiceId, // Matches 'invoices.id'
        client_id: parseInt(reportData.client_id), // Matches 'invoices.client_id', ensure integer
        date: invoiceDate.toISOString(), // Matches 'invoices.date'
        subtotal: parseFloat(subtotal.toFixed(2)) || 0,
        discount: parseFloat(discount.toFixed(2)) || 0,
        taxRate: parseFloat(taxRate) || 0, // Matches 'invoices.taxRate'
        tax: parseFloat(tax.toFixed(2)) || 0,
        total: parseFloat(total.toFixed(2)) || 0,
        paymentStatus: paymentStatus, // Matches 'invoices.paymentStatus' enum ('unpaid', 'partial', 'paid')
        paymentMethod: paymentMethod || null, // Matches 'invoices.paymentMethod'
        paymentDate: (paymentStatus === 'paid' || paymentStatus === 'partial') ? invoiceDate.toISOString() : null, // Matches 'invoices.paymentDate'
        report_id: reportData.id || null, // Matches 'invoices.report_id'
        // created_at and updated_at are typically handled by the backend/database

        // The 'items' array will be handled separately when saving, 
        // as it corresponds to the 'invoice_items' table, not columns in the 'invoices' table.
        // For the purpose of the object returned by this function, we can include it,
        // but the API call to save the invoice might need to send 'items' in a specific way
        // or make separate calls to save invoice items.
        items: invoiceItems 
    };
    
    // Save the invoice to storage
    saveInvoice(invoice);
    
    return invoice;
}

/**
 * Calculate subtotal from invoice items
 * @param {Array} items - Array of invoice items
 * @returns {number} Subtotal amount
 */
function calculateSubtotal(items) {
    return items.reduce((total, item) => {
        // If item has a totalAmount property, use that
        if (typeof item.totalAmount !== 'undefined') {
            return total + (parseFloat(item.totalAmount) || 0);
        }
        // Otherwise calculate based on amount and quantity
        const amount = parseFloat(item.amount) || 0;
        const quantity = parseInt(item.quantity) || 1;
        return total + (amount * quantity);
    }, 0);
}

/**
 * Save invoice to storage or API
 * @param {object} invoice - The invoice to save
 * @returns {Promise<object>} The saved invoice
 */
async function saveInvoice(invoice) {
    try {
        // Try to save to API first
        if (window.apiService && typeof window.apiService.createInvoice === 'function') {
            const apiInvoiceData = {
                id: invoice.id, // Main invoice ID
                client_id: invoice.client_id,
                date: invoice.date, // Invoice date
                subtotal: invoice.subtotal,
                discount: invoice.discount || 0,
                taxRate: invoice.taxRate || 0, // Default to 0 if not specified, DB default is 14
                tax: invoice.tax,
                total: invoice.total,
                paymentStatus: invoice.paymentStatus, // Direct use of the status string
                paymentMethod: invoice.paymentMethod || null,
                paymentDate: invoice.paymentDate || null, // Payment date
                report_id: invoice.report_id || null, // Use report_id
                items: invoice.items.map(item => ({
                    invoiceId: item.invoiceId, // Crucial: ID linking item to this invoice
                    description: item.description,
                    type: item.type,
                    amount: parseFloat(item.amount) || 0,
                    quantity: parseInt(item.quantity) || 1,
                    totalAmount: parseFloat(item.totalAmount) || 0,
                    serialNumber: item.serialNumber || null
                }))
            };
            
            console.log('Attempting to save invoice to API with data:', JSON.stringify(apiInvoiceData, null, 2)); // Log the data being sent
            const savedInvoice = await window.apiService.createInvoice(apiInvoiceData);
            console.log('Invoice saved to API:', savedInvoice);
            return savedInvoice;
        }
    } catch (error) {
        console.error('Detailed error saving invoice to API:');
        console.error('Error Message:', error.message);
        if (error.stack) {
            console.error('Error Stack:', error.stack);
        }
        if (error.response) {
            // If the error object has a 'response' property (common for HTTP errors from libraries like Axios)
            console.error('Error Response Data:', error.response.data);
            console.error('Error Response Status:', error.response.status);
            console.error('Error Response Headers:', error.response.headers);
        } else {
            // Log the whole error object if no 'response' property for more clues
            console.error('Full Error Object:', error);
        }
        // Optionally, re-throw the error if you want calling functions to handle it too
        // throw error;
    }
    
    // Fall back to localStorage if API fails or is not available
    // Get existing invoices from storage
    let invoices = JSON.parse(localStorage.getItem('lpk_invoices') || '[]');
    
    // Add new invoice
    invoices.push(invoice);
    
    // Save back to storage
    localStorage.setItem('lpk_invoices', JSON.stringify(invoices));
    
    // Also save to client-specific invoices if client_id exists
    if (invoice.client_id) {
        let clientInvoices = JSON.parse(localStorage.getItem(`lpk_client_${invoice.client_id}_invoices`) || '[]');
        clientInvoices.push(invoice);
        localStorage.setItem(`lpk_client_${invoice.client_id}_invoices`, JSON.stringify(clientInvoices));
    }
    
    return invoice;
}

/**
 * Get all invoices
 * @returns {Array} Array of all invoices
 */
function getAllInvoices() {
    return JSON.parse(localStorage.getItem('lpk_invoices') || '[]');
}

/**
 * Get invoices for a specific client
 * @param {string} client_id - The client ID
 * @returns {Array} Array of client's invoices
 */
function getClientInvoices(client_id) {
    return JSON.parse(localStorage.getItem(`lpk_client_${client_id}_invoices`) || '[]');
}

/**
 * Get a specific invoice by ID
 * @param {string} invoiceId - The invoice ID
 * @returns {object|null} The invoice object or null if not found
 */
function getInvoiceById(invoiceId) {
    const invoices = getAllInvoices();
    return invoices.find(inv => inv.id === invoiceId) || null;
}

/**
 * Update invoice payment status
 * @param {string} invoiceId - The invoice ID
 * @param {boolean} paid - Payment status
 * @param {string} paymentMethod - Payment method
 */
function updateInvoicePaymentStatus(invoiceId, paid, paymentMethod) {
    // Get all invoices
    let invoices = getAllInvoices();
    const invoiceIndex = invoices.findIndex(inv => inv.id === invoiceId);
    
    if (invoiceIndex !== -1) {
        // Update payment info
        invoices[invoiceIndex].paid = paid;
        invoices[invoiceIndex].paymentMethod = paymentMethod;
        invoices[invoiceIndex].paymentDate = paid ? new Date().toISOString() : null;
        
        // Save back to storage
        localStorage.setItem('lpk_invoices', JSON.stringify(invoices));
        
        // Update in client-specific invoices if exists
        const client_id = invoices[invoiceIndex].client_id;
        if (client_id) {
            let clientInvoices = JSON.parse(localStorage.getItem(`lpk_client_${client_id}_invoices`) || '[]');
            const clientInvoiceIndex = clientInvoices.findIndex(inv => inv.id === invoiceId);
            
            if (clientInvoiceIndex !== -1) {
                clientInvoices[clientInvoiceIndex].paid = paid;
                clientInvoices[clientInvoiceIndex].paymentMethod = paymentMethod;
                clientInvoices[clientInvoiceIndex].paymentDate = paid ? new Date().toISOString() : null;
                
                localStorage.setItem(`lpk_client_${client_id}_invoices`, JSON.stringify(clientInvoices));
            }
        }
    }
}
