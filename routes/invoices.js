/**
 * Laapak Report System - Invoices API Routes
 * Handles all invoice-related API endpoints
 */

const express = require('express');
const router = express.Router();
const { Invoice, InvoiceItem, Report, Client, InvoiceReport, sequelize } = require('../models');
const { auth, adminAuth, clientAuth } = require('../middleware/auth');
const { Op } = require('sequelize');
const { handleInvoiceCreation, handleInvoicePaymentStatusChange, handleInvoiceDeletion } = require('./invoice-hooks');

// Get invoice statistics by payment method
router.get('/stats/payment-methods', adminAuth, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        let whereClause = {};
        
        // Filter by date range if provided
        if (startDate && endDate) {
            whereClause.date = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        } else if (startDate) {
            whereClause.date = {
                [Op.gte]: new Date(startDate)
            };
        } else if (endDate) {
            whereClause.date = {
                [Op.lte]: new Date(endDate)
            };
        }
        
        // Get invoices with payment methods
        const invoices = await Invoice.findAll({
            where: whereClause,
            attributes: ['paymentMethod', 'total', 'paymentStatus'],
            order: [['date', 'DESC']]
        });
        
        // Calculate statistics
        const stats = {
            totalInvoices: invoices.length,
            totalAmount: 0,
            byPaymentMethod: {
                cash: { count: 0, amount: 0, paid: 0, pending: 0 },
                instapay: { count: 0, amount: 0, paid: 0, pending: 0 },
                محفظة: { count: 0, amount: 0, paid: 0, pending: 0 },
                بنك: { count: 0, amount: 0, paid: 0, pending: 0 },
                other: { count: 0, amount: 0, paid: 0, pending: 0 }
            },
            byStatus: {
                paid: { count: 0, amount: 0 },
                pending: { count: 0, amount: 0 },
                partial: { count: 0, amount: 0 },
                cancelled: { count: 0, amount: 0 }
            }
        };
        
        invoices.forEach(invoice => {
            const amount = parseFloat(invoice.total) || 0;
            const method = invoice.paymentMethod || 'other';
            const status = invoice.paymentStatus || 'pending';
            
            // Add to total
            stats.totalAmount += amount;
            
            // Add to payment method stats
            if (stats.byPaymentMethod.hasOwnProperty(method)) {
                stats.byPaymentMethod[method].count++;
                stats.byPaymentMethod[method].amount += amount;
                
                if (status === 'paid' || status === 'completed') {
                    stats.byPaymentMethod[method].paid += amount;
                } else {
                    stats.byPaymentMethod[method].pending += amount;
                }
            } else {
                stats.byPaymentMethod.other.count++;
                stats.byPaymentMethod.other.amount += amount;
                
                if (status === 'paid' || status === 'completed') {
                    stats.byPaymentMethod.other.paid += amount;
                } else {
                    stats.byPaymentMethod.other.pending += amount;
                }
            }
            
            // Add to status stats
            if (stats.byStatus.hasOwnProperty(status)) {
                stats.byStatus[status].count++;
                stats.byStatus[status].amount += amount;
            } else {
                stats.byStatus.pending.count++;
                stats.byStatus.pending.amount += amount;
            }
        });
        
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error fetching invoice statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching invoice statistics',
            error: error.message
        });
    }
});

// Get count of invoices
router.get('/count', auth, async (req, res) => {
    try {
        const { paymentStatus, startDate, endDate } = req.query;
        
        let whereClause = {};
        
        // If payment status filter is provided
        if (paymentStatus) {
            whereClause.paymentStatus = paymentStatus;
        }
        
        // If date range is provided
        if (startDate && endDate) {
            whereClause.date = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        } else if (startDate) {
            whereClause.date = {
                [Op.gte]: new Date(startDate)
            };
        } else if (endDate) {
            whereClause.date = {
                [Op.lte]: new Date(endDate)
            };
        }
        
        const count = await Invoice.count({ where: whereClause });
        
        res.json({ count });
    } catch (error) {
        console.error('Error counting invoices:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get all invoices (admin only)
router.get('/', adminAuth, async (req, res) => {
    try {
        const { paymentMethod, paymentStatus, startDate, endDate, clientId } = req.query;
        
        // Build where clause for filtering
        let whereClause = {};
        
        // Filter by payment method
        if (paymentMethod && paymentMethod !== 'all') {
            whereClause.paymentMethod = paymentMethod;
        }
        
        // Filter by payment status
        if (paymentStatus && paymentStatus !== 'all') {
            whereClause.paymentStatus = paymentStatus;
        }
        
        // Filter by client
        if (clientId && clientId !== 'all') {
            whereClause.client_id = clientId;
        }
        
        // Filter by date range
        if (startDate && endDate) {
            whereClause.date = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        } else if (startDate) {
            whereClause.date = {
                [Op.gte]: new Date(startDate)
            };
        } else if (endDate) {
            whereClause.date = {
                [Op.lte]: new Date(endDate)
            };
        }
        
        const invoices = await Invoice.findAll({
            where: whereClause,
            include: [
                { model: Client, as: 'client', attributes: ['id', 'name', 'phone'] },
                { model: Report, as: 'reports', attributes: ['id', 'device_model', 'serial_number'] }
            ],
            order: [['created_at', 'DESC']]
        });
        
        // Calculate totals for filtered results
        const totals = {
            totalAmount: 0,
            totalPaid: 0,
            totalPending: 0,
            byPaymentMethod: {
                cash: 0,
                instapay: 0,
                محفظة: 0,
                بنك: 0,
                other: 0
            }
        };
        
        invoices.forEach(invoice => {
            const amount = parseFloat(invoice.total) || 0;
            totals.totalAmount += amount;
            
            // Add to payment method totals
            if (invoice.paymentMethod) {
                const method = invoice.paymentMethod;
                if (totals.byPaymentMethod.hasOwnProperty(method)) {
                    totals.byPaymentMethod[method] += amount;
                } else {
                    totals.byPaymentMethod.other += amount;
                }
            }
            
            // Add to status totals
            if (invoice.paymentStatus === 'paid' || invoice.paymentStatus === 'completed') {
                totals.totalPaid += amount;
            } else {
                totals.totalPending += amount;
            }
        });
        
        res.json({
            invoices,
            totals,
            filters: {
                paymentMethod,
                paymentStatus,
                startDate,
                endDate,
                clientId
            }
        });
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
                { model: Client, as: 'client', attributes: ['id', 'name', 'phone', 'email'] },
                { model: Report, as: 'reports', attributes: ['id', 'device_model', 'serial_number'] },
                { model: InvoiceItem, as: 'InvoiceItems' }
            ]
        });
        
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }
        
        // TEMPORARILY DISABLED PERMISSION CHECK FOR TESTING
        // Allowing all requests to access invoice data regardless of permissions
        console.log('Permission check bypassed for testing');
        
        /* Original permission check (temporarily commented out)
        if (!req.user.isAdmin && invoice.client_id !== req.user.id) {
            console.log('Access denied: User is not admin and not the invoice owner');
            console.log('User ID:', req.user.id, 'Invoice client_id:', invoice.client_id);
            return res.status(403).json({ message: 'Not authorized to view this invoice' });
        }
        */
        
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

// Create bulk invoice for multiple reports
router.post('/bulk', adminAuth, async (req, res) => {
    let transaction;
    
    try {
        if (!sequelize || typeof sequelize.transaction !== 'function') {
            throw new Error('Sequelize instance is not properly initialized');
        }
        
        transaction = await sequelize.transaction();
        
        console.log('CREATE BULK INVOICE REQUEST BODY:', JSON.stringify(req.body, null, 2));
        
        // Extract data from request body
        const { 
            date,
            reportIds, // Array of report IDs
            client_id: client_id, 
            items, 
            subtotal, 
            taxRate,
            tax, 
            discount, 
            total, 
            paymentMethod,
            paymentStatus,
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
        
        if (!reportIds || !Array.isArray(reportIds) || reportIds.length === 0) {
            return res.status(400).json({
                message: 'يجب تحديد تقارير واحدة على الأقل',
                error: 'At least one report ID is required'
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
        console.log('Creating bulk invoice with number:', invoiceNumber);
        
        // Convert date string to Date object
        const dateStringFromRequest = date;
        const dateObjectForSequelize = new Date(dateStringFromRequest);
        
        console.log('--- DEBUG: Original date string from request:', dateStringFromRequest);
        console.log('--- DEBUG: Converted Date object for Sequelize:', dateObjectForSequelize);
        
        // Create the invoice
        const invoiceDataToCreate = {
            id: invoiceNumber,
            client_id: client_idNum,
            date: dateObjectForSequelize,
            subtotal: Number(subtotal || 0),
            discount: Number(discount || 0),
            taxRate: Number(taxRate || 0),
            tax: Number(tax || 0),
            total: Number(total || 0),
            paymentStatus: paymentStatus || 'unpaid',
            paymentMethod: paymentMethod || null
        };
        
        console.log('--- DEBUG: Object being passed to Invoice.create:', JSON.stringify(invoiceDataToCreate, null, 2));
        
        const invoice = await Invoice.create(invoiceDataToCreate, { transaction });
        
        // Create invoice items
        if (items && items.length > 0) {
            console.log('Creating invoice items:', JSON.stringify(items, null, 2));
            
            try {
                await Promise.all(items.map(item => {
                    const itemPayload = {
                        invoiceId: invoice.id,
                        description: item.description || '',
                        type: item.type || 'service',
                        quantity: Number(item.quantity || 1),
                        amount: Number(item.amount || 0),
                        totalAmount: Number(item.totalAmount || (item.quantity * item.amount) || 0),
                        serialNumber: item.serialNumber || null
                    };
                    console.log('--- DEBUG: Payload for InvoiceItem.create:', JSON.stringify(itemPayload, null, 2));
                    return InvoiceItem.create(itemPayload, { transaction });
                }));
                console.log(`Created ${items.length} invoice items successfully`);
            } catch (itemError) {
                console.error('Error creating invoice items:', itemError);
                throw itemError;
            }
        }
        
        // Link reports to the invoice using the InvoiceReport junction table
        if (reportIds && Array.isArray(reportIds) && reportIds.length > 0) {
            console.log('Linking reports to bulk invoice:', reportIds);
            try {
                const invoiceReportEntries = reportIds.map(rId => ({
                    invoice_id: invoice.id,
                    report_id: rId
                }));
                await InvoiceReport.bulkCreate(invoiceReportEntries, { transaction });
                console.log(`Created ${invoiceReportEntries.length} entries in InvoiceReport table.`);
                
                // Update each report to mark it as having an invoice
                const [affectedRows] = await Report.update(
                    { 
                        billingEnabled: true,
                        invoice_created: true,
                        invoice_id: invoice.id,
                        invoice_date: new Date()
                    }, 
                    { 
                        where: { id: { [Op.in]: reportIds } },
                        transaction
                    }
                );
                console.log(`Updated ${affectedRows} reports with invoice information`);
                
            } catch (linkError) {
                console.error('Error linking reports or updating report status:', linkError);
                throw linkError;
            }
        }
        
        await transaction.commit();
        
        // Fetch the complete invoice with all associations
        const completeInvoice = await Invoice.findByPk(invoice.id, {
            include: [
                { model: Client, as: 'client', attributes: ['id', 'name', 'phone', 'email'] },
                { 
                    model: Report, 
                    as: 'reports',
                    attributes: ['id', 'device_model', 'serial_number', 'invoice_created', 'invoice_id'] 
                },
                { model: InvoiceItem, as: 'InvoiceItems' }
            ]
        });
        
        res.status(201).json(completeInvoice);
    } catch (error) {
        // Rollback transaction if it exists
        if (transaction && typeof transaction.rollback === 'function') {
            try {
                await transaction.rollback();
                console.log('Bulk invoice transaction rolled back successfully');
            } catch (rollbackError) {
                console.error('Error rolling back bulk invoice transaction:', rollbackError);
            }
        }
        
        console.error('Error creating bulk invoice:', error);
        
        // Log detailed error information
        if (error.name) console.error('Error name:', error.name);
        if (error.message) console.error('Error message:', error.message);
        if (error.parent) {
            console.error('Parent error:', error.parent.message);
            console.error('SQL error code:', error.parent.code);
        }
        
        res.status(500).json({ 
            message: 'فشل في إنشاء الفاتورة المجمعة', 
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
                await Promise.all(items.map(item => {
                    const itemPayload = {
                        invoiceId: invoice.id, // Corrected from invoice_id to invoiceId
                        description: item.description || '',
                        type: item.type,
                        quantity: Number(item.quantity || 1),
                        amount: Number(item.amount || 0),
                        totalAmount: Number(item.totalAmount || 0),
                        serialNumber: item.serialNumber || null,
                        report_id: item.report_id || null // Add report_id field
                    };
                    console.log('--- DEBUG: Payload for InvoiceItem.create:', JSON.stringify(itemPayload, null, 2));
                    return InvoiceItem.create(itemPayload, { transaction });
                })); // Close Promise.all and map
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
        
        // Handle invoice creation hook for money management
        try {
            await handleInvoiceCreation(invoice);
        } catch (hookError) {
            console.error('Error in invoice creation hook:', hookError);
            // Don't fail the request if the hook fails
        }
        
        // Fetch the complete invoice with all associations
        const completeInvoice = await Invoice.findByPk(invoice.id, {
            include: [
                { model: Client, as: 'client', attributes: ['id', 'name', 'phone', 'email'] },
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
            // Get current invoice items to check which reports were removed
            const currentItems = await InvoiceItem.findAll({
                where: { invoiceId: invoice.id },
                attributes: ['report_id'],
                transaction
            });
            
            const currentReportIds = currentItems
                .map(item => item.report_id)
                .filter(reportId => reportId !== null);
            
            // Delete existing items
            await InvoiceItem.destroy({
                where: { invoiceId: invoice.id },
                transaction
            });
            
            // Collect all report IDs from new items
            const reportIdsFromItems = [];
            
            // Create new items
            await Promise.all(items.map(item => {
                // Collect report IDs for linking
                if (item.report_id && item.type === 'report') {
                    reportIdsFromItems.push(item.report_id);
                }
                
                return InvoiceItem.create({
                    invoiceId: invoice.id,
                    description: item.description || '',
                    type: item.type || 'service',
                    amount: Number(item.amount || item.unitPrice || 0),
                    quantity: Number(item.quantity || 1),
                    totalAmount: Number(item.totalAmount || item.total || 0),
                    serialNumber: item.serialNumber || null,
                    report_id: item.report_id || null, // Add report_id field
                    created_at: new Date(),
                    invoice_id: invoice.id
                }, { transaction });
            }));
            
            // Find reports that were removed (in current but not in new items)
            const removedReportIds = currentReportIds.filter(reportId => 
                !reportIdsFromItems.includes(reportId)
            );
            
            // Unlink removed reports
            if (removedReportIds.length > 0) {
                console.log('Unlinking removed reports:', removedReportIds);
                
                // Remove entries from InvoiceReport junction table
                await InvoiceReport.destroy({
                    where: {
                        invoice_id: invoice.id,
                        report_id: { [Op.in]: removedReportIds }
                    },
                    transaction
                });
                
                // Update reports to mark them as not having an invoice
                await Report.update(
                    { 
                        billingEnabled: false,
                        invoice_created: false,
                        invoice_id: null,
                        invoice_date: null
                    }, 
                    { 
                        where: { id: { [Op.in]: removedReportIds } },
                        transaction
                    }
                );
                
                console.log(`Unlinked ${removedReportIds.length} reports from invoice ${invoice.id}`);
            }
            
            // Link new reports to invoice if any items have report_id
            if (reportIdsFromItems.length > 0) {
                console.log('Linking reports from invoice items:', reportIdsFromItems);
                
                // Create entries in InvoiceReport junction table
                const invoiceReportEntries = reportIdsFromItems.map(reportId => ({
                    invoice_id: invoice.id,
                    report_id: reportId
                }));
                
                await InvoiceReport.bulkCreate(invoiceReportEntries, { transaction });
                
                // Update reports to mark them as having an invoice
                await Report.update(
                    { 
                        billingEnabled: true,
                        invoice_created: true,
                        invoice_id: invoice.id,
                        invoice_date: new Date()
                    }, 
                    { 
                        where: { id: { [Op.in]: reportIdsFromItems } },
                        transaction
                    }
                );
                
                console.log(`Linked ${reportIdsFromItems.length} reports to invoice ${invoice.id}`);
            }
        }
        
        await transaction.commit();
        
        // Handle payment status change hook for money management
        try {
            const oldStatus = invoice.paymentStatus;
            const newStatus = paymentStatus || invoice.paymentStatus;
            if (oldStatus !== newStatus) {
                await handleInvoicePaymentStatusChange(invoice, oldStatus, newStatus);
            }
        } catch (hookError) {
            console.error('Error in payment status change hook:', hookError);
            // Don't fail the request if the hook fails
        }
        
        // Fetch the updated invoice with all related data
        const updatedInvoice = await Invoice.findByPk(invoice.id, {
            include: [
                { model: Client, as: 'client', attributes: ['id', 'name', 'phone', 'email'] },
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
        
        // Store old status for comparison
        const oldStatus = invoice.paymentStatus;
        
        // Update payment information
        await invoice.update({
            paymentStatus,
            paymentMethod,
            paymentDate: paymentStatus === 'paid' ? new Date() : null
        });
        
        // Handle payment status change hook for money management
        try {
            await handleInvoicePaymentStatusChange(invoice, oldStatus, paymentStatus);
        } catch (hookError) {
            console.error('Error in payment status change hook:', hookError);
            // Don't fail the request if the hook fails
        }
        
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
        
        // Store invoice data before deletion for hook
        const invoiceData = invoice.toJSON();
        
        // Delete the invoice
        await invoice.destroy({ transaction });
        
        await transaction.commit();
        
        // Handle invoice deletion hook for money management
        try {
            await handleInvoiceDeletion(invoiceData);
        } catch (hookError) {
            console.error('Error in invoice deletion hook:', hookError);
            // Don't fail the request if the hook fails
        }
        
        res.json({ message: 'Invoice deleted successfully' });
    } catch (error) {
        await transaction.rollback();
        console.error('Error deleting invoice:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
