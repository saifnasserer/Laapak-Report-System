/**
 * Laapak Report System - Invoices API Routes
 * Handles all invoice-related API endpoints
 */

const express = require('express');
const router = express.Router();
const { Invoice, InvoiceItem, Report, Client, InvoiceReport, sequelize } = require('../models');
const { auth, adminAuth, clientAuth } = require('../middleware/auth');
const { Op } = require('sequelize');

// Get all invoices (admin only)
router.get('/', adminAuth, async (req, res) => {
    try {
        const invoices = await Invoice.findAll({
            include: [
                { model: Client, attributes: ['id', 'name', 'phone'] },
                { model: Report, as: 'reports', attributes: ['id', 'device_model', 'serial_number'] }
            ],
            order: [['created_at', 'DESC']]
        });
        res.json(invoices);
    } catch (error) {
        console.error('Error fetching invoices:', error);
        
        // Log detailed error information for debugging
        if (error.name) console.error('Error name:', error.name);
        if (error.message) console.error('Error message:', error.message);
        
        // Check for specific error types
        if (error.name === 'SequelizeEagerLoadingError') {
            return res.status(500).json({
                message: 'Failed to load associated data',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
        
        if (error.name && error.name.includes('Sequelize')) {
            return res.status(500).json({
                message: 'Database error occurred',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
        
        res.status(500).json({ 
            message: 'Failed to fetch invoices', 
            error: process.env.NODE_ENV === 'development' ? error.message : undefined 
        });
    }
});

// Get client invoices
router.get('/client', clientAuth, async (req, res) => {
    try {
        const invoices = await Invoice.findAll({
            where: { client_id: req.user.id },
            include: [
                { model: Report, as: 'reports', attributes: ['id', 'device_model', 'serial_number'] }
            ],
            order: [['created_at', 'DESC']]
        });
        res.json(invoices);
    } catch (error) {
        console.error('Error fetching client invoices:', error);
        
        // Log detailed error information for debugging
        if (error.name) console.error('Error name:', error.name);
        if (error.message) console.error('Error message:', error.message);
        
        // Check for specific error types
        if (error.name === 'SequelizeEagerLoadingError') {
            return res.status(500).json({
                message: 'Failed to load associated data',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
        
        if (error.name && error.name.includes('Sequelize')) {
            return res.status(500).json({
                message: 'Database error occurred',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
        
        res.status(500).json({ 
            message: 'Failed to fetch client invoices', 
            error: process.env.NODE_ENV === 'development' ? error.message : undefined 
        });
    }
});

// Get single invoice
router.get('/:id', auth, async (req, res) => {
    try {
        const invoice = await Invoice.findByPk(req.params.id, {
            include: [
                { model: Client, attributes: ['id', 'name', 'phone', 'email'] },
                { model: Report, as: 'reports', attributes: ['id', 'device_model', 'serial_number'] },
                { model: InvoiceItem, as: 'InvoiceItems' }
            ]
        });
        
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }
        
        // Check if user has permission to view this invoice
        if (!req.user.isAdmin && invoice.client_id !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to view this invoice' });
        }
        
        res.json(invoice);
    } catch (error) {
        console.error('Error fetching invoice:', error);
        
        // Log detailed error information for debugging
        if (error.name) console.error('Error name:', error.name);
        if (error.message) console.error('Error message:', error.message);
        
        // Check for specific error types
        if (error.name === 'SequelizeEagerLoadingError') {
            return res.status(500).json({
                message: 'Failed to load associated data',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
        
        if (error.name && error.name.includes('Sequelize')) {
            return res.status(500).json({
                message: 'Database error occurred',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
        
        res.status(500).json({ 
            message: 'Failed to fetch invoice', 
            error: process.env.NODE_ENV === 'development' ? error.message : undefined 
        });
    }
});

// Create new invoice
router.post('/', adminAuth, async (req, res) => {
    let transaction;
    
    try {
        // Make sure sequelize is properly initialized before creating a transaction
        if (!sequelize || typeof sequelize.transaction !== 'function') {
            throw new Error('Sequelize instance is not properly initialized');
        }
        
        transaction = await sequelize.transaction();
        
        console.log('CREATE INVOICE REQUEST BODY:', JSON.stringify(req.body, null, 2));
        
        // Extract data from request body
        const { 
            date, // Added date here
            report_ids, // Changed from report_id to report_ids (array)
            client_id: client_id, 
            client_name: clientName, 
            client_phone: clientPhone, 
            client_email: clientEmail, 
            client_address: clientAddress, 
            items, 
            subtotal, 
            taxRate, // Assuming taxRate is sent in req.body for tax_rate field
            tax, 
            discount, 
            total, 
            paymentMethod, // Assuming paymentMethod is sent for payment_method
            paymentStatus, // Assuming paymentStatus is sent for payment_status
            notes, 
            status 
        } = req.body;
        
        // Validate required fields
        if (!client_id) {
            return res.status(400).json({
                message: 'معرف العميل مطلوب',
                error: 'client_id is required'
            });
        }
        
        // Validate client_id is a number
        const client_idNum = Number(client_id);
        if (isNaN(client_idNum)) {
            return res.status(400).json({
                message: 'معرف العميل يجب أن يكون رقمًا',
                error: 'client_id must be a number'
            });
        }
        
        // Validate items array
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                message: 'يجب توفير عناصر الفاتورة',
                error: 'Invoice items are required'
            });
        }
        
        // Generate a unique invoice number
        const invoiceNumber = 'INV' + Date.now().toString() + Math.floor(Math.random() * 1000);
        console.log('Creating invoice with number:', invoiceNumber);
        
        // Handle empty email to be null (to pass validation)
        const validatedEmail = clientEmail?.trim() === '' ? null : clientEmail;

        // Original date string from req.body (already destructured as 'date')
        const dateStringFromRequest = date;
        const dateObjectForSequelize = new Date(dateStringFromRequest);

        console.log('--- DEBUG: Original date string from request:', dateStringFromRequest);
        console.log('--- DEBUG: Converted Date object for Sequelize:', dateObjectForSequelize);
        console.log('--- DEBUG: Is converted Date object valid?:', !isNaN(dateObjectForSequelize.getTime()));

        // Log the data just before creating the invoice
        const invoiceDataToCreate = {
            id: invoiceNumber, // This is the PK for the 'invoices' table (varchar)
            // report_id: reportId || null, // Removed: report_id is no longer in invoices table
            client_id: client_idNum, // Parsed from req.body.client_id
            date: dateObjectForSequelize, // Use the Date object here
            subtotal: Number(subtotal || 0),
            discount: Number(discount || 0),
            taxRate: Number(taxRate || 0),
            tax: Number(tax || 0),
            total: Number(total || 0),
            paymentStatus: paymentStatus || 'unpaid',
            paymentMethod: paymentMethod || null
        };
        // Note: JSON.stringify will convert the Date object to an ISO string in the log below
        console.log('--- DEBUG: Object being passed to Invoice.create (date field should be a Date object):', JSON.stringify(invoiceDataToCreate, null, 2));

        // Create the invoice
        const invoice = await Invoice.create(invoiceDataToCreate, { transaction });
        
        // Create invoice items
        if (items && items.length > 0) {
            console.log('Creating invoice items:', JSON.stringify(items, null, 2));
            
            try {
                await Promise.all(items.map(item => 
{
                    const itemPayload = {
                        invoiceId: invoice.id, // Corrected from invoice_id to invoiceId
                        description: item.description || '',
                        type: item.type,
                        quantity: Number(item.quantity || 1),
                        amount: Number(item.amount || 0),
                        totalAmount: Number(item.totalAmount || 0),
                        serialNumber: item.serialNumber || null
                    };
                    console.log('--- DEBUG: Payload for InvoiceItem.create:', JSON.stringify(itemPayload, null, 2));
                    return InvoiceItem.create(itemPayload, { transaction });
}
                )); // Close Promise.all and map
                console.log(`Created ${items.length} invoice items successfully`);
            } catch (itemError) {
                console.error('Error creating invoice items:', itemError);
                // No need to rollback here if the outer catch will handle it, 
                // but re-throwing ensures the main transaction fails.
                throw itemError; // Re-throw to be caught by the outer transaction catch block
            }
        }
        
        // Link reports to the invoice using the InvoiceReport junction table
        if (report_ids && Array.isArray(report_ids) && report_ids.length > 0) {
            console.log('Linking reports to invoice:', report_ids);
            try {
                const invoiceReportEntries = report_ids.map(rId => ({
                    invoice_id: invoice.id,
                    report_id: rId
                }));
                await InvoiceReport.bulkCreate(invoiceReportEntries, { transaction });
                console.log(`Created ${invoiceReportEntries.length} entries in InvoiceReport table.`);

                // Update each report to mark it as having an invoice and update billing status
                // Consider if 'amount' should be updated here or if it's report-specific
                const [affectedRows] = await Report.update(
                    { billingEnabled: true }, 
                    { 
                        where: { id: { [Op.in]: report_ids } },
                        transaction,
                        returning: false // Not typically needed for MySQL/MariaDB for simple count
                    }
                );
                console.log(`Report.update for billingEnabled: Matched ${report_ids.length} report IDs, Affected rows: ${affectedRows}`);

            } catch (linkError) {
                console.error('Error linking reports or updating report status:', linkError);
                throw linkError; // Re-throw to be caught by the outer transaction catch block
            }
        }
        
        await transaction.commit();
        
        // Fetch the complete invoice with all associations
        const completeInvoice = await Invoice.findByPk(invoice.id, {
            include: [
                { model: Client, attributes: ['id', 'name', 'phone', 'email'] },
                { 
                    model: Report, 
                    as: 'reports', // Use the alias defined in Invoice.belongsToMany(Report)
                    attributes: ['id', 'device_model', 'serial_number'] 
                },
                { model: InvoiceItem, as: 'InvoiceItems' }
            ]
        });
        
        res.status(201).json(completeInvoice);
    } catch (error) {
        // Only try to rollback if the transaction exists and is valid
        if (transaction && typeof transaction.rollback === 'function') {
            try {
                await transaction.rollback();
                console.log('Transaction rolled back successfully');
            } catch (rollbackError) {
                console.error('Error rolling back transaction:', rollbackError);
            }
        } else {
            console.error('Could not roll back: Transaction was not properly initialized');
        }
        
        console.error('Error creating invoice:', error);
        
        // Log detailed error information for debugging
        if (error.name) console.error('Error name:', error.name);
        if (error.message) console.error('Error message:', error.message);
        if (error.parent) {
            console.error('Parent error:', error.parent.message);
            console.error('SQL error code:', error.parent.code);
            if (error.parent.sql) console.error('SQL query:', error.parent.sql);
        }
        if (error.errors) console.error('Validation errors:', JSON.stringify(error.errors, null, 2));
        
        // Check for specific error types
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(400).json({
                message: 'العميل المحدد غير موجود', // Selected client does not exist
                error: 'Foreign key constraint error: ' + error.message,
                details: {
                    field: error.fields?.[0] || 'client_id',
                    table: error.table,
                    value: error.value
                }
            });
        }
        
        // Validation error
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                message: 'خطأ في التحقق من صحة البيانات', // Data validation error
                error: error.message,
                details: error.errors.map(err => ({ field: err.path, message: err.message }))
            });
        }
        
        // Database connection error
        if (error.name === 'SequelizeConnectionError' || error.name === 'SequelizeConnectionRefusedError') {
            return res.status(503).json({
                message: 'فشل الاتصال بقاعدة البيانات', // Database connection failed
                error: error.message
            });
        }
        
        // Generic error
        res.status(500).json({
            message: 'خطأ في الخادم', // Server error
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Update invoice
router.put('/:id', adminAuth, async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
        console.log('UPDATE INVOICE REQUEST BODY:', JSON.stringify(req.body, null, 2));
        
        // Find the invoice
        const invoice = await Invoice.findByPk(req.params.id);
        
        if (!invoice) {
            return res.status(404).json({ message: 'الفاتورة غير موجودة', error: 'Invoice not found' });
        }
        
        // Extract data from request body
        const { 
            title,
            date,
            client_id,
            subtotal,
            discount,
            taxRate,
            tax,
            total,
            paymentStatus,
            paymentMethod,
            notes,
            items
        } = req.body;
        
        // Update invoice
        await invoice.update({
            title: title || invoice.title,
            date: date ? new Date(date) : invoice.date,
            client_id: client_id || invoice.client_id,
            subtotal: Number(subtotal || invoice.subtotal),
            discount: Number(discount || invoice.discount),
            tax: Number(tax || invoice.tax),
            total: Number(total || invoice.total),
            paymentStatus: paymentStatus || invoice.paymentStatus,
            paymentMethod: paymentMethod || invoice.paymentMethod,
            notes: notes || invoice.notes,
            updated_at: new Date()
        }, { transaction });
        
        // Update invoice items
        if (items && Array.isArray(items)) {
            // Delete existing items
            await InvoiceItem.destroy({
                where: { invoiceId: invoice.id },
                transaction
            });
            
            // Create new items
            await Promise.all(items.map(item => 
                InvoiceItem.create({
                    invoiceId: invoice.id,
                    description: item.description || '',
                    type: item.type || 'service',
                    amount: Number(item.amount || item.unitPrice || 0),
                    quantity: Number(item.quantity || 1),
                    totalAmount: Number(item.totalAmount || item.total || 0),
                    serialNumber: item.serialNumber || null,
                    created_at: new Date(),
                    invoice_id: invoice.id
                }, { transaction })
            ));
        }
        
        await transaction.commit();
        
        // Fetch the updated invoice with all related data
        const updatedInvoice = await Invoice.findByPk(invoice.id, {
            include: [
                { model: Client, attributes: ['id', 'name', 'phone', 'email'] },
                { model: Report, as: 'reports', attributes: ['id', 'device_model', 'serial_number'] },
                { model: InvoiceItem, as: 'InvoiceItems' }
            ]
        });
        
        res.json(updatedInvoice);
    } catch (error) {
        await transaction.rollback();
        console.error('Error updating invoice:', error);
        
        // Log detailed error information for debugging
        if (error.name) console.error('Error name:', error.name);
        if (error.message) console.error('Error message:', error.message);
        
        // Handle specific error types
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(400).json({
                message: 'العميل المحدد غير موجود', // Selected client does not exist
                error: 'Foreign key constraint error: ' + error.message,
                details: {
                    field: error.fields?.[0] || 'client_id',
                    table: error.table,
                    value: error.value
                }
            });
        }
        
        // Validation error
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                message: 'خطأ في التحقق من صحة البيانات', // Data validation error
                error: error.message,
                details: error.errors.map(err => ({ field: err.path, message: err.message }))
            });
        }
        
        // Generic error
        res.status(500).json({
            message: 'خطأ في الخادم', // Server error
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Update invoice payment status
router.put('/:id/payment', adminAuth, async (req, res) => {
    try {
        const { paymentStatus, paymentMethod } = req.body;
        
        const invoice = await Invoice.findByPk(req.params.id);
        
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }
        
        // Update payment information
        await invoice.update({
            paymentStatus,
            paymentMethod,
            paymentDate: paymentStatus === 'paid' ? new Date() : null
        });
        
        res.json(invoice);
    } catch (error) {
        console.error('Error updating invoice payment:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete invoice
router.delete('/:id', adminAuth, async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
        const invoice = await Invoice.findByPk(req.params.id);
        
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }
        
        // If invoice has a report, update the report to mark it as not having an invoice
        if (invoice.reportId) {
            try {
                await Report.update(
                    { 
                        billingEnabled: false,
                        amount: 0
                    },
                    { 
                        where: { id: invoice.reportId },
                        transaction 
                    }
                );
                console.log(`Updated report ${invoice.reportId} to remove billing information`);
            } catch (updateError) {
                console.error('Error updating report billing status during invoice deletion:', updateError);
                // Continue with invoice deletion even if report update fails
            }
        }
        
        // Delete invoice items
        await InvoiceItem.destroy({
            where: { invoiceId: invoice.id },
            transaction
        });
        
        // Delete the invoice
        await invoice.destroy({ transaction });
        
        await transaction.commit();
        
        res.json({ message: 'Invoice deleted successfully' });
    } catch (error) {
        await transaction.rollback();
        console.error('Error deleting invoice:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
