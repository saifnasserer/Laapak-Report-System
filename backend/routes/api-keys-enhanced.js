/**
 * Laapak Report System - Enhanced API Key Routes
 * Comprehensive client data access with advanced features
 */

const express = require('express');
const router = express.Router();
const { Client, Report, Invoice, InvoiceItem, ApiKey, ApiUsageLog, Expense, ExpenseCategory, Admin } = require('../models');
const { Op } = require('sequelize');
const { apiKeyAuth, clientApiKeyAuth, systemApiKeyAuth } = require('../middleware/apiKeyAuth');

// Helper to verify superadmin status
const isSuperAdmin = async (adminId) => {
    if (!adminId) return false;
    const admin = await Admin.findByPk(adminId);
    return admin && admin.role === 'superadmin';
};

// ==================== CLIENT AUTHENTICATION ====================

/**
 * Verify client credentials and get client info
 */
router.post('/auth/verify-client', apiKeyAuth(), async (req, res) => {
    try {
        const { phone, orderCode, email } = req.body;

        if (!phone && !email) {
            return res.status(400).json({
                message: 'Phone number or email is required',
                error: 'MISSING_PARAMETERS'
            });
        }

        let whereClause = {};

        if (phone) {
            whereClause.phone = phone;
        }

        if (email) {
            whereClause.email = email;
        }

        if (orderCode) {
            whereClause.orderCode = orderCode;
        }

        const client = await Client.findOne({
            where: whereClause,
            attributes: ['id', 'name', 'phone', 'email', 'status', 'createdAt', 'lastLogin']
        });

        if (!client) {
            return res.status(404).json({
                message: 'Client not found',
                error: 'CLIENT_NOT_FOUND'
            });
        }

        if (client.status !== 'active') {
            return res.status(403).json({
                message: 'Client account is inactive',
                error: 'CLIENT_INACTIVE'
            });
        }

        res.json({
            success: true,
            client: client,
            message: 'Client verified successfully'
        });
    } catch (error) {
        console.error('Error verifying client:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
});

/**
 * Get client profile information
 */
router.get('/clients/:id/profile', apiKeyAuth({ clients: { read: true } }), async (req, res) => {
    try {
        const clientId = req.params.id;

        const client = await Client.findByPk(clientId, {
            attributes: ['id', 'name', 'phone', 'email', 'address', 'status', 'createdAt', 'lastLogin']
        });

        if (!client) {
            return res.status(404).json({
                message: 'Client not found',
                error: 'CLIENT_NOT_FOUND'
            });
        }

        res.json({
            success: true,
            client: client
        });
    } catch (error) {
        console.error('Error fetching client profile:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
});

// ==================== REPORTS ACCESS ====================

/**
 * Get client's reports with advanced filtering
 */
router.get('/clients/:id/reports', apiKeyAuth({ reports: { read: true } }), async (req, res) => {
    try {
        const clientId = req.params.id;
        const {
            status,
            startDate,
            endDate,
            deviceModel,
            limit = 50,
            offset = 0,
            sortBy = 'created_at',
            sortOrder = 'DESC'
        } = req.query;

        let whereClause = { client_id: clientId };

        // Apply filters
        if (status) {
            whereClause.status = status;
        }

        if (startDate || endDate) {
            whereClause.inspection_date = {};
            if (startDate) whereClause.inspection_date[Op.gte] = new Date(startDate);
            if (endDate) whereClause.inspection_date[Op.lte] = new Date(endDate);
        }

        if (deviceModel) {
            whereClause.device_model = { [Op.like]: `%${deviceModel}%` };
        }

        const reports = await Report.findAll({
            where: whereClause,
            attributes: [
                'id', 'device_model', 'serial_number', 'inspection_date',
                'status', 'billing_enabled', 'amount', 'invoice_created',
                'invoice_id', 'invoice_date', 'created_at', 'updated_at'
            ],
            order: [[sortBy, sortOrder]],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        // Get total count for pagination
        const totalCount = await Report.count({ where: whereClause });

        res.json({
            success: true,
            reports: reports,
            pagination: {
                total: totalCount,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: (parseInt(offset) + parseInt(limit)) < totalCount
            }
        });
    } catch (error) {
        console.error('Error fetching client reports:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
});

/**
 * Get specific report details
 */
router.get('/reports/:id', apiKeyAuth({ reports: { read: true } }), async (req, res) => {
    try {
        const reportId = req.params.id;

        const report = await Report.findByPk(reportId, {
            attributes: [
                'id', 'client_id', 'client_name', 'client_phone', 'client_email',
                'client_address', 'order_number', 'device_model', 'serial_number',
                'inspection_date', 'hardware_status', 'external_images', 'notes',
                'billing_enabled', 'amount', 'status', 'invoice_created',
                'invoice_id', 'invoice_date', 'created_at', 'updated_at'
            ]
        });

        if (!report) {
            return res.status(404).json({
                message: 'Report not found',
                error: 'REPORT_NOT_FOUND'
            });
        }

        res.json({
            success: true,
            report: report
        });
    } catch (error) {
        console.error('Error fetching report:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
});

// ==================== INVOICES ACCESS ====================

/**
 * Get client's invoices with advanced filtering
 */
router.get('/clients/:id/invoices', apiKeyAuth({ invoices: { read: true } }), async (req, res) => {
    try {
        const clientId = req.params.id;
        const {
            paymentStatus,
            startDate,
            endDate,
            limit = 50,
            offset = 0,
            sortBy = 'created_at',
            sortOrder = 'DESC'
        } = req.query;

        let whereClause = { client_id: clientId };

        // Apply filters
        if (paymentStatus) {
            whereClause.paymentStatus = paymentStatus;
        }

        if (startDate || endDate) {
            whereClause.date = {};
            if (startDate) whereClause.date[Op.gte] = new Date(startDate);
            if (endDate) whereClause.date[Op.lte] = new Date(endDate);
        }

        const invoices = await Invoice.findAll({
            where: whereClause,
            attributes: [
                'id', 'date', 'subtotal', 'discount', 'taxRate', 'tax', 'total',
                'paymentStatus', 'paymentMethod', 'paymentDate', 'reportId',
                'report_id', 'created_from_report', 'report_order_number',
                'created_at', 'updated_at'
            ],
            order: [[sortBy, sortOrder]],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        // Get total count for pagination
        const totalCount = await Invoice.count({ where: whereClause });

        res.json({
            success: true,
            invoices: invoices,
            pagination: {
                total: totalCount,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: (parseInt(offset) + parseInt(limit)) < totalCount
            }
        });
    } catch (error) {
        console.error('Error fetching client invoices:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
});

/**
 * Get specific invoice with items
 */
router.get('/invoices/:id', apiKeyAuth({ invoices: { read: true } }), async (req, res) => {
    try {
        const invoiceId = req.params.id;

        const invoice = await Invoice.findByPk(invoiceId, {
            attributes: [
                'id', 'client_id', 'date', 'subtotal', 'discount', 'taxRate', 'tax', 'total',
                'paymentStatus', 'paymentMethod', 'paymentDate', 'reportId', 'report_id',
                'created_from_report', 'report_order_number', 'created_at', 'updated_at'
            ],
            include: [{
                model: InvoiceItem,
                as: 'InvoiceItems',
                attributes: [
                    'id', 'description', 'type', 'amount', 'quantity', 'totalAmount',
                    'serialNumber', 'cost_price', 'profit_amount', 'profit_margin'
                ]
            }]
        });

        if (!invoice) {
            return res.status(404).json({
                message: 'Invoice not found',
                error: 'INVOICE_NOT_FOUND'
            });
        }

        res.json({
            success: true,
            invoice: invoice
        });
    } catch (error) {
        console.error('Error fetching invoice:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
});

// ==================== BULK OPERATIONS ====================

/**
 * Bulk client lookup
 */
router.post('/clients/bulk-lookup', apiKeyAuth({ clients: { read: true } }), async (req, res) => {
    try {
        const { phones, emails, orderCodes } = req.body;

        if (!phones && !emails && !orderCodes) {
            return res.status(400).json({
                message: 'At least one search parameter is required',
                error: 'MISSING_PARAMETERS'
            });
        }

        let whereClause = { [Op.or]: [] };

        if (phones && phones.length > 0) {
            whereClause[Op.or].push({ phone: { [Op.in]: phones } });
        }

        if (emails && emails.length > 0) {
            whereClause[Op.or].push({ email: { [Op.in]: emails } });
        }

        if (orderCodes && orderCodes.length > 0) {
            whereClause[Op.or].push({ orderCode: { [Op.in]: orderCodes } });
        }

        const clients = await Client.findAll({
            where: whereClause,
            attributes: ['id', 'name', 'phone', 'email', 'status', 'createdAt']
        });

        res.json({
            success: true,
            clients: clients,
            count: clients.length
        });
    } catch (error) {
        console.error('Error in bulk client lookup:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
});

/**
 * Get comprehensive client data export
 */
router.get('/clients/:id/data-export', apiKeyAuth({
    reports: { read: true },
    invoices: { read: true },
    clients: { read: true }
}), async (req, res) => {
    try {
        const clientId = req.params.id;
        const { format = 'json' } = req.query;

        // Get client info
        const client = await Client.findByPk(clientId, {
            attributes: ['id', 'name', 'phone', 'email', 'address', 'status', 'createdAt', 'lastLogin']
        });

        if (!client) {
            return res.status(404).json({
                message: 'Client not found',
                error: 'CLIENT_NOT_FOUND'
            });
        }

        // Get all reports
        const reports = await Report.findAll({
            where: { client_id: clientId },
            attributes: [
                'id', 'device_model', 'serial_number', 'inspection_date',
                'status', 'billing_enabled', 'amount', 'invoice_created',
                'invoice_id', 'invoice_date', 'created_at'
            ],
            order: [['created_at', 'DESC']]
        });

        // Get all invoices
        const invoices = await Invoice.findAll({
            where: { client_id: clientId },
            attributes: [
                'id', 'date', 'subtotal', 'discount', 'tax', 'total',
                'paymentStatus', 'paymentMethod', 'paymentDate', 'created_at'
            ],
            order: [['created_at', 'DESC']]
        });

        const exportData = {
            client: client,
            reports: reports,
            invoices: invoices,
            summary: {
                total_reports: reports.length,
                total_invoices: invoices.length,
                total_amount: invoices.reduce((sum, inv) => sum + parseFloat(inv.total), 0),
                export_date: new Date().toISOString()
            }
        };

        if (format === 'csv') {
            // TODO: Implement CSV export
            res.json(exportData);
        } else {
            res.json({
                success: true,
                data: exportData
            });
        }
    } catch (error) {
        console.error('Error in data export:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
});

// ==================== FINANCIAL ACCESS ====================

/**
 * Get Financial Summary (KPIs)
 */
router.get('/financial/summary', apiKeyAuth({ financial: { read: true } }), async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        let dateFilter = {};
        if (startDate && endDate) {
            dateFilter = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        } else {
            // Default to current month if no date provided
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            dateFilter = {
                [Op.between]: [startOfMonth, endOfMonth]
            };
        }

        // 1. Calculate Revenue (Invoices)
        // We consider 'paid' and 'completed' invoices as realized revenue
        const invoices = await Invoice.findAll({
            where: {
                date: dateFilter,
                paymentStatus: ['paid', 'completed']
            },
            attributes: ['total']
        });

        const totalRevenue = invoices.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);

        // 2. Calculate Expenses
        const expenses = await Expense.findAll({
            where: {
                date: dateFilter,
                status: 'approved'
            },
            attributes: ['amount']
        });

        const totalExpenses = expenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);

        // 3. Calculate COGS (Cost of Goods Sold)
        // This requires joining invoices with invoice items
        const invoiceItems = await InvoiceItem.findAll({
            include: [{
                model: Invoice,
                as: 'invoice',
                where: {
                    date: dateFilter,
                    paymentStatus: ['paid', 'completed']
                },
                attributes: []
            }],
            attributes: ['cost_price', 'quantity']
        });

        const totalCOGS = invoiceItems.reduce((sum, item) => {
            const cost = parseFloat(item.cost_price) || 0;
            const qty = parseInt(item.quantity) || 1;
            return sum + (cost * qty);
        }, 0);

        // 4. Calculate Net Profit
        // Net Profit = Revenue - COGS - Expenses
        const grossProfit = totalRevenue - totalCOGS;
        const netProfit = grossProfit - totalExpenses;

        res.json({
            success: true,
            period: {
                startDate: startDate || 'current-month-start',
                endDate: endDate || 'current-month-end'
            },
            summary: {
                revenue: totalRevenue,
                cogs: totalCOGS,
                grossProfit: grossProfit,
                expenses: totalExpenses,
                netProfit: netProfit,
                profitMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0
            }
        });

    } catch (error) {
        console.error('Error fetching financial summary:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
});

/**
 * Get Financial Ledger (Invoices & Expenses)
 */
router.get('/financial/ledger', apiKeyAuth({ financial: { read: true } }), async (req, res) => {
    try {
        const { startDate, endDate, limit = 50, offset = 0, type } = req.query; // type: 'income' | 'expense' | 'all'

        const effectiveLimit = parseInt(limit);
        const effectiveOffset = parseInt(offset);

        let dateFilter = {};
        if (startDate && endDate) {
            dateFilter = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }

        let transactions = [];

        // Fetch Income (Invoices)
        if (!type || type === 'all' || type === 'income') {
            const invoices = await Invoice.findAll({
                where: {
                    ...(startDate || endDate ? { date: dateFilter } : {}),
                    paymentStatus: ['paid', 'completed'] // Only confirmed income
                },
                attributes: ['id', 'date', 'total', 'client_id'], // fetch minimal fields
                include: [{
                    model: Client,
                    as: 'client',
                    attributes: ['name']
                }, {
                    model: InvoiceItem,
                    as: 'InvoiceItems',
                    attributes: ['cost_price', 'quantity']
                }],
                order: [['date', 'DESC']],
                limit: effectiveLimit,
                offset: effectiveOffset // Note: handling mixed pagination is tricky, simplifying here to separate or fetch-all-and-sort
            });

            transactions.push(...invoices.map(inv => {
                const totalCost = inv.InvoiceItems
                    ? inv.InvoiceItems.reduce((sum, item) => sum + ((parseFloat(item.cost_price) || 0) * (parseInt(item.quantity) || 1)), 0)
                    : 0;

                // Check if any item has zero/missing cost
                const hasMissingCosts = inv.InvoiceItems
                    ? inv.InvoiceItems.some(item => (parseFloat(item.cost_price) || 0) === 0)
                    : true; // Default to true if no items (or strictly dependent on if invoice is empty, but usually safe)

                return {
                    id: inv.id,
                    date: inv.date,
                    amount: parseFloat(inv.total),
                    type: 'income',
                    category: 'Sales',
                    description: `Invoice #${inv.id} - ${inv.client ? inv.client.name : 'Unknown Client'}`,
                    status: 'verified',
                    cost: totalCost,
                    profit: parseFloat(inv.total) - totalCost,
                    has_missing_costs: hasMissingCosts
                };
            }));
        }

        // Fetch Expenses
        if (!type || type === 'all' || type === 'expense') {
            const expenses = await Expense.findAll({
                where: {
                    ...(startDate || endDate ? { date: dateFilter } : {}),
                    status: 'approved'
                },
                include: [{
                    model: ExpenseCategory,
                    as: 'category',
                    attributes: ['name']
                }],
                attributes: ['id', 'date', 'amount', 'name', 'description'], // Fixed: 'notes' -> 'description'
                order: [['date', 'DESC']],
                limit: effectiveLimit,
                offset: effectiveOffset
            });

            transactions.push(...expenses.map(exp => ({
                id: `EXP-${exp.id}`,
                date: exp.date,
                amount: parseFloat(exp.amount),
                type: 'expense',
                category: exp.category ? exp.category.name : 'Uncategorized',
                description: exp.name || exp.description || 'Expense',
                status: 'verified'
            })));
        }

        // Sort combined results
        transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

        // If 'mixed' pagination is needed properly, one would usually fetch limit items from EACH and then merge/slice.
        // For simplicity in this implementation, we return the combined list. 
        // A robust solution would require a UNION query or more complex logic.
        // We will slice the memory array to simulate pagination on the merged set.
        const paginatedTransactions = transactions.slice(0, effectiveLimit);

        res.json({
            success: true,
            count: paginatedTransactions.length,
            transactions: paginatedTransactions
        });

    } catch (error) {
        console.error('Error fetching financial ledger:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
});

/**
 * Create Expense
 */
router.post('/financial/expenses', apiKeyAuth({ financial: { write: true } }), async (req, res) => {
    try {
        if (!await isSuperAdmin(req.apiKey.created_by)) {
            return res.status(401).json({
                message: 'Superadmin privileges required',
                error: 'SUPERADMIN_REQUIRED'
            });
        }

        const {
            name, name_ar, amount, category_id, type, date, repeat_monthly, description, receipt_url
        } = req.body;

        // Validation
        if (!name && !name_ar) return res.status(400).json({ message: 'Name required', error: 'VALIDATION_ERROR' });
        if (!amount || isNaN(amount)) return res.status(400).json({ message: 'Valid amount required', error: 'VALIDATION_ERROR' });
        if (!category_id) return res.status(400).json({ message: 'Category ID required', error: 'VALIDATION_ERROR' });
        if (!date) return res.status(400).json({ message: 'Date required', error: 'VALIDATION_ERROR' });

        const expense = await Expense.create({
            name: name || name_ar,
            name_ar: name_ar || name,
            amount,
            category_id,
            type: type || 'variable',
            date,
            repeat_monthly: repeat_monthly || false,
            description,
            receipt_url,
            created_by: req.apiKey.created_by,
            status: 'approved'
        });

        const newExpense = await Expense.findByPk(expense.id, {
            include: [{ model: ExpenseCategory, as: 'category', attributes: ['name', 'name_ar', 'color'] }]
        });

        res.status(201).json({
            success: true,
            message: 'Expense created successfully',
            data: { expense: newExpense }
        });

    } catch (error) {
        console.error('Error creating expense:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

/**
 * Update Expense
 */
router.put('/financial/expenses/:id', apiKeyAuth({ financial: { write: true } }), async (req, res) => {
    try {
        if (!await isSuperAdmin(req.apiKey.created_by)) {
            return res.status(401).json({
                message: 'Superadmin privileges required',
                error: 'SUPERADMIN_REQUIRED'
            });
        }

        const { id } = req.params;
        const updateData = req.body;

        const expense = await Expense.findByPk(id);
        if (!expense) return res.status(404).json({ message: 'Expense not found', error: 'NOT_FOUND' });

        await expense.update(updateData);

        res.json({
            success: true,
            message: 'Expense updated successfully',
            data: { expense }
        });

    } catch (error) {
        console.error('Error updating expense:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

/**
 * Delete Expense
 */
router.delete('/financial/expenses/:id', apiKeyAuth({ financial: { delete: true } }), async (req, res) => {
    try {
        if (!await isSuperAdmin(req.apiKey.created_by)) {
            return res.status(401).json({
                message: 'Superadmin privileges required',
                error: 'SUPERADMIN_REQUIRED'
            });
        }

        const { id } = req.params;
        const expense = await Expense.findByPk(id);

        if (!expense) return res.status(404).json({ message: 'Expense not found', error: 'NOT_FOUND' });

        await expense.destroy();

        res.json({ success: true, message: 'Expense deleted successfully' });

    } catch (error) {
        console.error('Error deleting expense:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

/**
 * Record Invoice Payment
 */
router.post('/financial/invoices/:id/payment', apiKeyAuth({ financial: { write: true } }), async (req, res) => {
    try {
        if (!await isSuperAdmin(req.apiKey.created_by)) {
            return res.status(401).json({
                message: 'Superadmin privileges required',
                error: 'SUPERADMIN_REQUIRED'
            });
        }

        const { id } = req.params;
        const { paymentDate, paymentMethod } = req.body;

        const invoice = await Invoice.findByPk(id);
        if (!invoice) return res.status(404).json({ message: 'Invoice not found', error: 'NOT_FOUND' });
        if (invoice.paymentStatus === 'paid') return res.status(400).json({ message: 'Invoice is already paid', error: 'ALREADY_PAID' });

        await invoice.update({
            paymentStatus: 'paid',
            paymentDate: paymentDate || new Date(),
            paymentMethod: paymentMethod || invoice.paymentMethod
        });

        res.json({
            success: true,
            message: 'Payment recorded successfully',
            data: { id: invoice.id, status: 'paid', paymentDate: invoice.paymentDate }
        });

    } catch (error) {
        console.error('Error recording payment:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

/**
 * Update Invoice Item Cost
 */
router.patch('/financial/invoice-items/:id/cost', apiKeyAuth({ financial: { write: true } }), async (req, res) => {
    // ... (Route: PATCH /financial/invoice-items/:id/cost)
    try {
        if (!await isSuperAdmin(req.apiKey.created_by)) {
            return res.status(401).json({
                message: 'Superadmin privileges required',
                error: 'SUPERADMIN_REQUIRED'
            });
        }

        const { id } = req.params;
        const { cost_price } = req.body;

        console.log(`[ItemCostUpdate] Update request for item ${id}, cost: ${cost_price}`);

        if (cost_price === undefined) return res.status(400).json({ message: 'Cost price required', error: 'VALIDATION_ERROR' });

        const item = await InvoiceItem.findByPk(id);
        if (!item) {
            console.error(`[ItemCostUpdate] Item ${id} not found`);
            return res.status(404).json({ message: 'Invoice item not found', error: 'NOT_FOUND' });
        }

        const parsedCost = parseFloat(cost_price);
        if (isNaN(parsedCost)) {
            return res.status(400).json({ message: 'Invalid cost price value', error: 'VALIDATION_ERROR' });
        }

        console.log(`[ItemCostUpdate] Updating item ${id} with cost ${parsedCost}. Prev cost: ${item.cost_price}`);

        await item.update({ cost_price: parsedCost });

        // Reload the item to get the DB-calculated generated columns (profit_amount, profit_margin)
        await item.reload();

        res.json({
            success: true,
            data: {
                item_id: item.id,
                cost_price: item.cost_price,
                profit_amount: item.profit_amount,
                profit_margin: item.profit_margin
            }
        });

    } catch (error) {
        console.error('Error updating item cost [CRITICAL]:', error);
        // Ensure we send a useful error message back
        res.status(500).json({
            message: 'Server error updating item cost',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// ==================== HEALTH & STATUS ====================

/**
 * API health check
 */
router.get('/health', apiKeyAuth(), (req, res) => {
    res.json({
        success: true,
        message: 'API key authentication successful',
        timestamp: new Date().toISOString(),
        apiKey: {
            name: req.apiKey.name,
            permissions: req.apiKey.permissions,
            rateLimit: req.apiKey.rateLimit
        }
    });
});

/**
 * Get API key usage statistics
 */
router.get('/usage-stats', systemApiKeyAuth(), async (req, res) => {
    try {
        const { days = 30 } = req.query;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        const stats = await ApiUsageLog.findAll({
            where: {
                created_at: { [Op.gte]: startDate }
            },
            attributes: [
                'endpoint',
                'method',
                'response_status',
                [ApiUsageLog.sequelize.fn('COUNT', ApiUsageLog.sequelize.col('id')), 'count'],
                [ApiUsageLog.sequelize.fn('AVG', ApiUsageLog.sequelize.col('response_time')), 'avg_response_time']
            ],
            group: ['endpoint', 'method', 'response_status'],
            order: [[ApiUsageLog.sequelize.fn('COUNT', ApiUsageLog.sequelize.col('id')), 'DESC']]
        });

        res.json({
            success: true,
            period: `${days} days`,
            stats: stats
        });
    } catch (error) {
        console.error('Error fetching usage stats:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
});

module.exports = router;