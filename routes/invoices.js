/**
 * Laapak Report System - Invoices API Routes
 * Handles all invoice-related API endpoints
 */

const express = require('express');
const router = express.Router();
const { Invoice, InvoiceItem, Report, Client, sequelize } = require('../models');
const { auth, adminAuth, clientAuth } = require('../middleware/auth');
const { Op } = require('sequelize');

// Get all invoices (admin only)
router.get('/', adminAuth, async (req, res) => {
    try {
        const invoices = await Invoice.findAll({
            include: [
                { model: Client, attributes: ['id', 'name', 'phone'] },
                { model: Report, attributes: ['id', 'device_model', 'serial_number'] }
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
                { model: Report, attributes: ['id', 'device_model', 'serial_number'] }
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
                { model: Report, attributes: ['id', 'device_model', 'serial_number'] },
                { model: InvoiceItem }
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
    const transaction = await sequelize.transaction();
    
    try {
        console.log('CREATE INVOICE REQUEST BODY:', JSON.stringify(req.body, null, 2));
        
        // Extract data from request body
        const { 
            report_id: reportId, 
            client_id: client_id, 
            client_name: clientName, 
            client_phone: clientPhone, 
            client_email: clientEmail, 
            client_address: clientAddress, 
            items, 
            subtotal, 
            tax, 
            discount, 
            total, 
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
        
        // Create the invoice
        const invoice = await Invoice.create({
            invoice_number: invoiceNumber,
            report_id: reportId || null,
            client_id: clientdNum,
            client_name: clientName || '',
            client_phone: clientPhone || '',
            client_email: validatedEmail,
            client_address: clientAddress || '',
            subtotal: Number(subtotal || 0),
            tax: Number(tax || 0),
            discount: Number(discount || 0),
            total: Number(total || 0),
            notes: notes || '',
            status: status || 'pending',
            created_by: req.user.id
        }, { transaction });
        
        // Create invoice items
        if (items && items.length > 0) {
            console.log('Creating invoice items:', JSON.stringify(items, null, 2));
            
            try {
                await Promise.all(items.map(item => 
                    InvoiceItem.create({
                        invoice_id: invoice.id,
                        description: item.description || '',
                        quantity: Number(item.quantity || 1),
                        unit_price: Number(item.unit_price || 0),
                        total: Number(item.total || 0)
                    }, { transaction })
                ));
                console.log(`Created ${items.length} invoice items successfully`);
            } catch (itemError) {
                console.error('Error creating invoice items:', itemError);
                throw new Error(`Failed to create invoice items: ${itemError.message}`);
            }
        }
        
        // Update report to mark it as having an invoice and update billing status
        if (reportId) {
            try {
                await Report.update(
                    { 
                        billingEnabled: true,
                        amount: total || 0
                    },
                    { 
                        where: { id: reportId },
                        transaction 
                    }
                );
                console.log(`Updated report ${reportId} with billing information`);
            } catch (updateError) {
                console.error('Error updating report billing status:', updateError);
                // Continue with invoice creation even if report update fails
            }
        }
        
        await transaction.commit();
        
        // Fetch the complete invoice with all associations
        const completeInvoice = await Invoice.findByPk(invoice.id, {
            include: [
                { model: Client, attributes: ['id', 'name', 'phone', 'email'] },
                { model: Report, attributes: ['id', 'device_model', 'serial_number'] },
                { model: InvoiceItem }
            ]
        });
        
        res.status(201).json(completeInvoice);
    } catch (error) {
        await transaction.rollback();
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
