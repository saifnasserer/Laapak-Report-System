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
                        description: laptop.name + serialInfo,
                        amount: laptop.price,
                        quantity: 1,
                        totalAmount: laptop.price,
                        type: 'laptop',
                        serialNumber: laptop.serial,
                        reportId: reportData.id + '-' + (index + 1)
                    });
                } else {
                    // Multiple laptops - create separate report for each one
                    // Start with the main serial number
                    if (laptop.serial) {
                        invoiceItems.push({
                            description: laptop.name + ` (SN: ${laptop.serial})`,
                            amount: laptop.price,
                            quantity: 1,
                            totalAmount: laptop.price,
                            type: 'laptop',
                            serialNumber: laptop.serial,
                            reportId: reportData.id + '-' + (index + 1) + '-1'
                        });
                    }
                    
                    // Add each additional serial number as a separate item
                    if (laptop.additionalSerials && laptop.additionalSerials.length > 0) {
                        laptop.additionalSerials.forEach((serial, serialIndex) => {
                            if (serial) {
                                invoiceItems.push({
                                    description: laptop.name + ` (SN: ${serial})`,
                                    amount: laptop.price,
                                    quantity: 1,
                                    totalAmount: laptop.price,
                                    type: 'laptop',
                                    serialNumber: serial,
                                    reportId: reportData.id + '-' + (index + 1) + '-' + (serialIndex + 2)
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
                    description: item.name,
                    amount: item.price,
                    quantity: item.quantity,
                    totalAmount: item.totalPrice,
                    type: 'item'
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
                description: reportData.deviceModel + serialInfo,
                amount: price,
                quantity: 1,
                totalAmount: price,
                type: 'laptop'
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
        id: invoiceId,
        date: invoiceDate.toISOString(),
        reportId: reportData.id,
        client_id: reportData.client_id,
        clientName: reportData.clientName,
        clientPhone: reportData.clientPhone,
        orderCode: reportData.orderCode || 'LP' + Math.floor(10000 + Math.random() * 90000),
        items: invoiceItems,
        laptops: laptops,
        additionalItems: additionalItems,
        subtotal: subtotal,
        discount: discount,
        taxRate: taxRate,
        tax: tax,
        total: total,
        paid: paymentStatus === 'paid',
        partiallyPaid: paymentStatus === 'partial',
        paymentMethod: paymentMethod,
        paymentDate: (paymentStatus === 'paid' || paymentStatus === 'partial') ? new Date().toISOString() : null
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
                reportId: invoice.reportId,
                client_id: invoice.client_id,
                subtotal: invoice.subtotal,
                discount: invoice.discount || 0,
                taxRate: invoice.taxRate || 14,
                tax: invoice.tax,
                total: invoice.total,
                paymentStatus: invoice.paid ? 'paid' : (invoice.partiallyPaid ? 'partial' : 'unpaid'),
                paymentMethod: invoice.paymentMethod,
                items: invoice.items.map(item => ({
                    description: item.description,
                    type: item.type,
                    amount: item.amount,
                    quantity: item.quantity || 1,
                    totalAmount: item.totalAmount,
                    serialNumber: item.serialNumber
                }))
            };
            
            const savedInvoice = await window.apiService.createInvoice(apiInvoiceData);
            console.log('Invoice saved to API:', savedInvoice);
            return savedInvoice;
        }
    } catch (error) {
        console.error('Error saving invoice to API:', error);
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
