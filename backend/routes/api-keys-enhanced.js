/**
 * Laapak Report System - Enhanced API Key Routes
 * Comprehensive client data access with advanced features
 */

const express = require('express');
const router = express.Router();
const { Client, Report, Invoice, InvoiceItem, ApiKey, ApiUsageLog } = require('../models');
const { Op } = require('sequelize');
const { apiKeyAuth, clientApiKeyAuth, systemApiKeyAuth } = require('../middleware/apiKeyAuth');

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
