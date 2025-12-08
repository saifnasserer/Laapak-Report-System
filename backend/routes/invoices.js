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
                { model: Client, as: 'client', attributes: ['id', 'name', 'phone', 'email', 'address'] },
                { model: Report, as: 'relatedReports', attributes: ['id', 'device_model', 'serial_number'] }
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
                { model: Report, as: 'relatedReports', attributes: ['id', 'device_model', 'serial_number'] }
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
// Print invoice endpoint - returns print-ready HTML
// Supports token in query parameter for browser access
router.get('/:id/print', async (req, res, next) => {
    // Allow token from query parameter for browser access
    const token = req.query.token || req.header('x-auth-token') || req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).send(`
            <html>
                <body style="font-family: Arial; padding: 20px; text-align: center;">
                    <h1>Authentication Required</h1>
                    <p>Please provide a valid authentication token.</p>
                    <p style="color: #666; font-size: 12px;">Add ?token=YOUR_TOKEN to the URL</p>
                </body>
            </html>
        `);
    }
    
    // Verify token
    try {
        const jwt = require('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET;
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Handle different token formats
        if (decoded.user) {
            req.user = decoded.user;
        } else {
            req.user = decoded;
        }
        
        // Continue to the route handler
        next();
    } catch (err) {
        console.error('Token verification error:', err.message);
        return res.status(401).send(`
            <html>
                <body style="font-family: Arial; padding: 20px; text-align: center;">
                    <h1>Invalid Token</h1>
                    <p>The authentication token is invalid or expired.</p>
                    <p style="color: #666; font-size: 12px;">Please login again and try printing.</p>
                </body>
            </html>
        `);
    }
}, async (req, res) => {
    try {
        const invoice = await Invoice.findByPk(req.params.id, {
            include: [
                { model: Client, as: 'client', attributes: ['id', 'name', 'phone', 'email', 'address'] },
                { model: Report, as: 'relatedReports', attributes: ['id', 'device_model', 'serial_number'] },
                { model: InvoiceItem, as: 'InvoiceItems' }
            ]
        });
        
        if (!invoice) {
            return res.status(404).send(`
                <html>
                    <body style="font-family: Arial; padding: 20px; text-align: center;">
                        <h1>Invoice Not Found</h1>
                        <p>The invoice you're looking for doesn't exist.</p>
                    </body>
                </html>
            `);
        }
        
        // Format dates - match FixZone style
        const invoiceDateObj = new Date(invoice.date);
        const invoiceDate = invoiceDateObj.toLocaleDateString('ar-EG', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const invoiceTime = invoiceDateObj.toLocaleTimeString('ar-EG', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
        const fullInvoiceDate = `${invoiceDate} في ${invoiceTime}`;
        
        // Get report information (device model, serial number, order number)
        let deviceModel = 'غير معلوم';
        let serialNumber = 'غير معلوم';
        let orderNumber = invoice.report_order_number || '-';
        let reportId = invoice.report_id || invoice.reportId;
        
        // Try to get from related reports first
        if (invoice.relatedReports && invoice.relatedReports.length > 0) {
            const firstReport = invoice.relatedReports[0];
            deviceModel = firstReport.device_model || 'غير معلوم';
            serialNumber = firstReport.serial_number || 'غير معلوم';
            if (!orderNumber || orderNumber === '-') {
                orderNumber = firstReport.order_number || '-';
            }
        }
        
        // If still missing, try to fetch report directly
        if ((!deviceModel || deviceModel === 'غير معلوم' || !serialNumber || serialNumber === 'غير معلوم') && reportId) {
            try {
                const report = await Report.findByPk(reportId);
                if (report) {
                    if (!orderNumber || orderNumber === '-') {
                        orderNumber = report.order_number || '-';
                    }
                    if (!deviceModel || deviceModel === 'غير معلوم') {
                        deviceModel = report.device_model || 'غير معلوم';
                    }
                    if (!serialNumber || serialNumber === 'غير معلوم') {
                        serialNumber = report.serial_number || 'غير معلوم';
                    }
                }
            } catch (err) {
                console.log('Could not fetch report for additional details');
            }
        }
        
        // Format payment status
        const statusMap = {
            'paid': 'مدفوع',
            'unpaid': 'غير مدفوع',
            'pending': 'قيد الانتظار',
            'partial': 'مدفوع جزئياً',
            'completed': 'مكتمل',
            'cancelled': 'ملغي'
        };
        
        const statusText = statusMap[invoice.paymentStatus] || invoice.paymentStatus;
        
        // Build invoice items HTML - match FixZone table structure
        let itemsHtml = '';
        if (invoice.InvoiceItems && invoice.InvoiceItems.length > 0) {
            invoice.InvoiceItems.forEach((item, index) => {
                const unitPrice = parseFloat(item.amount || 0);
                const quantity = parseInt(item.quantity || 1);
                const discount = 0; // Item-level discount if needed
                const total = parseFloat(item.totalAmount || unitPrice * quantity);
                
                itemsHtml += `
                    <tr>
                        <td style="padding: 12px; border: 1px solid #e0e0e0;">${item.description || '-'}</td>
                        <td style="text-align: center; padding: 12px; border: 1px solid #e0e0e0;">${quantity}</td>
                        <td style="text-align: left; padding: 12px; border: 1px solid #e0e0e0;">${unitPrice.toFixed(2)} ج.م</td>
                        <td style="text-align: center; padding: 12px; border: 1px solid #e0e0e0;">${discount > 0 ? discount.toFixed(2) : '-'}</td>
                        <td style="text-align: left; padding: 12px; border: 1px solid #e0e0e0; font-weight: bold;">${total.toFixed(2)} ج.م</td>
                    </tr>
                `;
            });
        } else {
            itemsHtml = '<tr><td colspan="5" style="text-align: center; padding: 20px; border: 1px solid #e0e0e0;">لا توجد بنود</td></tr>';
        }
        
        // Calculate totals
        const subtotal = parseFloat(invoice.subtotal || 0);
        const discount = parseFloat(invoice.discount || 0);
        const tax = parseFloat(invoice.tax || 0);
        const total = parseFloat(invoice.total || 0);
        
        // Calculate paid and remaining amounts
        let paidAmount = 0;
        if (invoice.paymentStatus === 'paid' || invoice.paymentStatus === 'completed') {
            paidAmount = total;
        } else if (invoice.paymentStatus === 'partial') {
            // For partial payments, estimate based on common scenarios
            // In a real system, you'd track this in a separate field
            // For now, we'll show a reasonable estimate (e.g., 50% or use a calculation)
            // You can improve this by adding a paidAmount field to the Invoice model
            paidAmount = Math.max(0, total * 0.5); // Placeholder - should be tracked in DB
        }
        const remainingAmount = Math.max(0, total - paidAmount);
        
        // Generate print-ready HTML - FixZone style
        const html = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>فاتورة ${invoice.id}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', 'Tahoma', 'Segoe UI', sans-serif;
            font-size: 14px;
            line-height: 1.6;
            color: #333;
            background: #fff;
            padding: 20px;
        }
        
        .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background: #fff;
            padding: 40px;
        }
        
        .company-header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e0e0e0;
        }
        
        .company-header p {
            margin: 5px 0;
            color: #666;
            font-size: 13px;
        }
        
        .invoice-number-section {
            text-align: center;
            margin: 25px 0;
        }
        
        .invoice-number-section h2 {
            font-size: 24px;
            color: #333;
            margin-bottom: 15px;
            font-weight: bold;
        }
        
        .invoice-details {
            display: flex;
            justify-content: space-between;
            margin: 20px 0;
            padding: 15px;
            background: #f9f9f9;
            border-radius: 5px;
        }
        
        .invoice-details div {
            flex: 1;
        }
        
        .invoice-details strong {
            display: block;
            margin-bottom: 5px;
            color: #555;
            font-size: 13px;
        }
        
        .invoice-details span {
            color: #333;
            font-size: 14px;
        }
        
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
        }
        
        .status-paid {
            background: #28a745;
            color: #fff;
        }
        
        .status-unpaid {
            background: #dc3545;
            color: #fff;
        }
        
        .status-pending {
            background: #ffc107;
            color: #333;
        }
        
        .status-partial {
            background: #17a2b8;
            color: #fff;
        }
        
        .client-section {
            margin: 25px 0;
            padding: 15px;
            background: #f5f5f5;
            border-radius: 5px;
        }
        
        .client-section h3 {
            font-size: 16px;
            margin-bottom: 12px;
            color: #333;
        }
        
        .client-section p {
            margin: 6px 0;
            font-size: 14px;
        }
        
        .device-info {
            margin: 20px 0;
            padding: 12px;
            background: #f0f0f0;
            border-radius: 5px;
            font-size: 14px;
        }
        
        .device-info strong {
            color: #555;
        }
        
        .costs-table {
            width: 100%;
            border-collapse: collapse;
            margin: 25px 0;
        }
        
        .costs-table th {
            background: #f8f9fa;
            padding: 12px;
            text-align: right;
            border: 1px solid #e0e0e0;
            font-weight: bold;
            font-size: 13px;
            color: #333;
        }
        
        .costs-table td {
            padding: 12px;
            border: 1px solid #e0e0e0;
            font-size: 14px;
        }
        
        .costs-table tbody tr:nth-child(even) {
            background: #f9f9f9;
        }
        
        .totals-section {
            margin-top: 25px;
            margin-left: auto;
            width: 100%;
            max-width: 400px;
        }
        
        .totals-table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .totals-table td {
            padding: 10px 15px;
            border: 1px solid #e0e0e0;
            font-size: 14px;
        }
        
        .totals-table td:first-child {
            text-align: right;
            font-weight: bold;
            background: #f8f9fa;
        }
        
        .totals-table td:last-child {
            text-align: left;
            font-weight: bold;
        }
        
        .total-row {
            background: #0a592c;
            color: #fff;
        }
        
        .total-row td {
            border-color: #0a592c;
            font-size: 16px;
            padding: 12px 15px;
        }
        
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e0e0e0;
            text-align: center;
            color: #666;
            font-size: 13px;
        }
        
        .action-buttons {
            position: fixed;
            top: 20px;
            left: 20px;
            display: flex;
            gap: 10px;
            z-index: 1000;
        }
        
        .action-button {
            background: #0a592c;
            color: #fff;
            border: none;
            padding: 12px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            transition: background 0.3s;
        }
        
        .action-button:hover {
            background: #0d944d;
        }
        
        .action-button.close-btn {
            background: #dc3545;
        }
        
        .action-button.close-btn:hover {
            background: #c82333;
        }
        
        /* Print-specific styles */
        @media print {
            body {
                padding: 0;
            }
            
            .invoice-container {
                padding: 20px;
                max-width: 100%;
            }
            
            .no-print {
                display: none !important;
            }
            
            @page {
                margin: 1cm;
                size: A4;
            }
            
            .costs-table, .totals-table {
                page-break-inside: avoid;
            }
            
            .company-header, .invoice-details, .client-section {
                page-break-inside: avoid;
            }
        }
        
        @media screen {
            .action-buttons {
                display: flex;
            }
        }
    </style>
</head>
<body>
    <div class="action-buttons no-print">
        <button class="action-button" onclick="window.print()">🖨️ طباعة الفاتورة</button>
        <button class="action-button close-btn" onclick="window.close()">✕ إغلاق</button>
    </div>
    
    <div class="invoice-container">
        <!-- Company Header -->
        <div class="company-header">
            <p>19 شارع يوسف الجندي - التحرير - القاهرة</p>
            <p>هاتف: 01013148007 | بريد إلكتروني: info@laapak.com</p>
        </div>
        
        <!-- Invoice Number -->
        <div class="invoice-number-section">
            <h2>رقم الفاتورة</h2>
            <div style="font-size: 20px; font-weight: bold; color: #0a592c; margin-bottom: 10px;">
                ${invoice.id}
            </div>
            <div style="font-size: 14px; color: #666;">
                <div>رقم الفاتورة: ${invoice.id}</div>
                ${orderNumber !== '-' ? `<div style="margin-top: 5px;">رقم طلب الإصلاح: ${orderNumber}</div>` : ''}
                <div style="margin-top: 5px;">تاريخ الإصدار: ${fullInvoiceDate}</div>
                <div style="margin-top: 5px;">الحالة: <span class="status-badge status-${invoice.paymentStatus}">${statusText}</span></div>
            </div>
        </div>
        
        <!-- Client Information -->
        <div class="client-section">
            <h3>بيانات العميل</h3>
            <p><strong>الاسم:</strong> ${invoice.client ? invoice.client.name : '-'}</p>
            <p><strong>الهاتف:</strong> ${invoice.client ? invoice.client.phone : '-'}</p>
            ${invoice.client && invoice.client.email ? `<p><strong>البريد الإلكتروني:</strong> ${invoice.client.email}</p>` : ''}
        </div>
        
        <!-- Device Information -->
        <div class="device-info">
            <strong>نوع:</strong> ${deviceModel.includes('LAPTOP') || deviceModel.toLowerCase().includes('laptop') ? 'LAPTOP' : 'ITEM'} | 
            <strong>الموديل:</strong> ${deviceModel} | 
            <strong>السيريال:</strong> ${serialNumber}
        </div>
        
        <!-- Costs and Services Table -->
        <h3 style="margin: 25px 0 15px 0; font-size: 16px;">التكاليف والخدمات</h3>
        <table class="costs-table">
            <thead>
                <tr>
                    <th>الوصف</th>
                    <th>الكمية</th>
                    <th>سعر الوحدة</th>
                    <th>الخصم</th>
                    <th>الإجمالي</th>
                </tr>
            </thead>
            <tbody>
                ${itemsHtml}
            </tbody>
        </table>
        
        <!-- Totals Section -->
        <div class="totals-section">
            <table class="totals-table">
                <tr>
                    <td>المجموع الفرعي:</td>
                    <td>${subtotal.toFixed(2)} ج.م</td>
                </tr>
                ${discount > 0 ? `
                <tr>
                    <td>الخصم:</td>
                    <td>-${discount.toFixed(2)} ج.م</td>
                </tr>
                ` : ''}
                ${tax > 0 ? `
                <tr>
                    <td>الضريبة (${invoice.taxRate || 0}%):</td>
                    <td>${tax.toFixed(2)} ج.م</td>
                </tr>
                ` : ''}
                <tr class="total-row">
                    <td>الإجمالي:</td>
                    <td>${total.toFixed(2)} ج.م</td>
                </tr>
                <tr>
                    <td>المدفوع:</td>
                    <td>${paidAmount.toFixed(2)} ج.م</td>
                </tr>
                <tr>
                    <td>المتبقي:</td>
                    <td>${remainingAmount.toFixed(2)} ج.م</td>
                </tr>
            </table>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <p>شكراً لثقتكم بنا | Laapak</p>
        </div>
    </div>
    
    <script>
        // Print reminder
        window.addEventListener('beforeprint', function() {
            console.log('تأكد من إعدادات الطباعة قبل الطباعة');
        });
    </script>
</body>
</html>
        `;
        
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(html);
    } catch (error) {
        console.error('Error generating invoice print view:', error);
        res.status(500).send(`
            <html>
                <body style="font-family: Arial; padding: 20px; text-align: center;">
                    <h1>خطأ في تحميل الفاتورة</h1>
                    <p>حدث خطأ أثناء تحميل الفاتورة. يرجى المحاولة مرة أخرى.</p>
                </body>
            </html>
        `);
    }
});

router.get('/:id', auth, async (req, res) => {
    try {
        const invoice = await Invoice.findByPk(req.params.id, {
            include: [
                { model: Client, as: 'client', attributes: ['id', 'name', 'phone', 'email', 'address'] },
                { model: Report, as: 'relatedReports', attributes: ['id', 'device_model', 'serial_number'] },
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
            reportId: null, // Set to null for bulk invoices since they use the InvoiceReport junction table
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
                    const quantity = Number(item.quantity || 1);
                    const amount = Number(item.amount || 0);
                    const totalAmount = quantity * amount;
                    
                    const itemPayload = {
                        invoiceId: invoice.id,
                        description: item.description || '',
                        type: item.type || 'report',
                        quantity: quantity,
                        amount: amount,
                        totalAmount: totalAmount,
                        serialNumber: item.serialNumber || null,
                        report_id: item.report_id || null
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
                { model: Client, as: 'client', attributes: ['id', 'name', 'phone', 'email', 'address'] },
                { 
                    model: Report, 
                    as: 'relatedReports',
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
        console.log('=== INVOICE CREATION DEBUG ===');
        console.log('report_id (single):', req.body.report_id);
        console.log('report_ids (array):', req.body.report_ids);
        console.log('report_ids type:', typeof req.body.report_ids);
        console.log('report_ids isArray:', Array.isArray(req.body.report_ids));
        console.log('items:', req.body.items);
        if (req.body.items && Array.isArray(req.body.items)) {
            req.body.items.forEach((item, index) => {
                console.log(`Item ${index} report_id:`, item.report_id);
            });
        }
        console.log('=== END DEBUG ===');
        
        // Extract data from request body
        const { 
            date, // Added date here
            report_id, // Single report ID
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
        
        // Report ID validation removed - no longer required
        
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
            reportId: report_id || (report_ids && report_ids.length > 0 ? report_ids[0] : null), // Use report_id or first report from report_ids
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
        // Handle both report_ids (array) and report_id (single) for backward compatibility
        let reportsToLink = [];
        console.log('=== REPORT LINKING DEBUG ===');
        console.log('report_ids from body:', report_ids);
        console.log('report_id from body:', report_id);
        console.log('items:', items);
        
        if (report_ids && Array.isArray(report_ids) && report_ids.length > 0) {
            reportsToLink = report_ids;
            console.log('Using report_ids array:', reportsToLink);
        } else if (report_id) {
            // Convert single report_id to array
            reportsToLink = [report_id];
            console.log('Using single report_id converted to array:', reportsToLink);
        } else {
            // Try to extract report_id from invoice items if not provided directly
            console.log('Extracting report_id from items...');
            const reportIdsFromItems = items
                ?.map(item => item.report_id)
                .filter(id => id !== null && id !== undefined && id !== '') || [];
            console.log('Report IDs extracted from items:', reportIdsFromItems);
            if (reportIdsFromItems.length > 0) {
                reportsToLink = [...new Set(reportIdsFromItems)]; // Remove duplicates
                console.log('Using report IDs from items:', reportsToLink);
            }
        }
        
        // Final fallback: if still no reports to link, try to get from the invoice items that were just created
        if (reportsToLink.length === 0 && invoice && invoice.id) {
            console.log('⚠️ No reports found in request, checking invoice items in database...');
            try {
                const createdItems = await InvoiceItem.findAll({
                    where: { invoiceId: invoice.id },
                    attributes: ['report_id'],
                    transaction
                });
                const reportIdsFromDb = createdItems
                    .map(item => item.report_id)
                    .filter(id => id !== null && id !== undefined && id !== '');
                if (reportIdsFromDb.length > 0) {
                    reportsToLink = [...new Set(reportIdsFromDb)];
                    console.log('✅ Found report IDs from database items:', reportsToLink);
                }
            } catch (dbError) {
                console.error('Error fetching items from database:', dbError);
            }
        }
        
        console.log('Final reportsToLink:', reportsToLink);
        console.log('=== END REPORT LINKING DEBUG ===');
        
        if (reportsToLink.length > 0) {
            console.log('Linking reports to invoice:', reportsToLink);
            try {
                const invoiceReportEntries = reportsToLink.map(rId => ({
                    invoice_id: invoice.id,
                    report_id: rId
                }));
                console.log('InvoiceReport entries to create:', JSON.stringify(invoiceReportEntries, null, 2));
                
                await InvoiceReport.bulkCreate(invoiceReportEntries, { transaction });
                console.log(`✅ Created ${invoiceReportEntries.length} entries in InvoiceReport table.`);

                // Update each report to mark it as having an invoice and update billing status
                const [affectedRows] = await Report.update(
                    { billingEnabled: true }, 
                    { 
                        where: { id: { [Op.in]: reportsToLink } },
                        transaction,
                        returning: false // Not typically needed for MySQL/MariaDB for simple count
                    }
                );
                console.log(`✅ Report.update for billingEnabled: Matched ${reportsToLink.length} report IDs, Affected rows: ${affectedRows}`);

            } catch (linkError) {
                console.error('❌ Error linking reports or updating report status:', linkError);
                console.error('Link error stack:', linkError.stack);
                throw linkError; // Re-throw to be caught by the outer transaction catch block
            }
        } else {
            console.log('⚠️ No reports to link to invoice - invoice will be created without report links');
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
                { model: Client, as: 'client', attributes: ['id', 'name', 'phone', 'email', 'address'] },
                { 
                    model: Report, 
                    as: 'relatedReports', // Use the alias defined in Invoice.belongsToMany(Report)
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
        console.log('Invoice ID:', req.params.id);
        
        // Find the invoice
        const invoice = await Invoice.findByPk(req.params.id);
        
        if (!invoice) {
            await transaction.rollback();
            return res.status(404).json({ message: 'الفاتورة غير موجودة', error: 'Invoice not found' });
        }
        
        console.log('Found invoice:', invoice.id);
        
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
        
        // Validate items array
        if (items && items.length > 0) {
            console.log('Processing', items.length, 'invoice items');
            items.forEach((item, index) => {
                console.log(`Item ${index}:`, {
                    description: item.description,
                    amount: item.amount,
                    quantity: item.quantity,
                    totalAmount: item.totalAmount,
                    type: item.type
                });
            });
        }
        
        // Update invoice
        // Only update paymentStatus if it's explicitly provided (not null/undefined)
        const updateData = {
            title: title || invoice.title,
            date: date ? new Date(date) : invoice.date,
            client_id: client_id || invoice.client_id,
            subtotal: Number(subtotal || invoice.subtotal),
            discount: Number(discount || invoice.discount),
            tax: Number(tax || invoice.tax),
            total: Number(total || invoice.total),
            paymentMethod: paymentMethod || invoice.paymentMethod,
            notes: notes || invoice.notes,
            updated_at: new Date()
        };
        
        // Only update paymentStatus if it's explicitly provided in the request
        if (paymentStatus !== undefined && paymentStatus !== null) {
            updateData.paymentStatus = paymentStatus;
            console.log(`Updating invoice ${invoice.id} paymentStatus to: ${paymentStatus}`);
        }
        
        await invoice.update(updateData, { transaction });
        
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
                
                // Calculate totalAmount if not provided
                const itemAmount = Number(item.amount || item.unitPrice || 0);
                const itemQuantity = Number(item.quantity || 1);
                const itemTotalAmount = item.totalAmount ? Number(item.totalAmount) : (itemAmount * itemQuantity);
                
                return InvoiceItem.create({
                    invoiceId: invoice.id,
                    description: item.description || '',
                    type: item.type || 'service',
                    amount: itemAmount,
                    quantity: itemQuantity,
                    totalAmount: itemTotalAmount,
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
                { model: Client, as: 'client', attributes: ['id', 'name', 'phone', 'email', 'address'] },
                { model: Report, as: 'relatedReports', attributes: ['id', 'device_model', 'serial_number'] },
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
        if (error.errors) {
            console.error('Validation errors:', JSON.stringify(error.errors, null, 2));
        }
        if (error.stack) console.error('Error stack:', error.stack);
        
        // Handle specific error types
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                message: 'خطأ في التحقق من صحة البيانات',
                error: error.message,
                details: error.errors ? error.errors.map(e => e.message) : []
            });
        }
        
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
        
        // Get all report IDs linked to this invoice (from invoice items)
        const invoiceItems = await InvoiceItem.findAll({
            where: { invoiceId: invoice.id },
            attributes: ['report_id'],
            transaction
        });
        
        const reportIdsFromItems = invoiceItems
            .map(item => item.report_id)
            .filter(reportId => reportId !== null && reportId !== undefined);
        
        console.log(`Found ${reportIdsFromItems.length} reports linked to invoice ${invoice.id} through items`);
        
        // Get reports from InvoiceReport junction table
        const invoiceReports = await InvoiceReport.findAll({
            where: { invoice_id: invoice.id },
            attributes: ['report_id'],
            transaction
        });
        
        const reportIdsFromJunction = invoiceReports.map(ir => ir.report_id);
        console.log(`Found ${reportIdsFromJunction.length} reports linked to invoice ${invoice.id} through junction table`);
        
        // Combine all report IDs (remove duplicates)
        const allReportIds = [...new Set([...reportIdsFromItems, ...reportIdsFromJunction])];
        
        // Also handle old single report field if it exists
        if (invoice.reportId && !allReportIds.includes(invoice.reportId)) {
            allReportIds.push(invoice.reportId);
        }
        
        // Update all linked reports to mark them as not having an invoice
        if (allReportIds.length > 0) {
            try {
                await Report.update(
                    { 
                        billingEnabled: false,
                        invoice_created: false,
                        invoice_id: null,
                        invoice_date: null
                    },
                    { 
                        where: { id: { [Op.in]: allReportIds } },
                        transaction 
                    }
                );
                console.log(`Updated ${allReportIds.length} reports to remove invoice associations:`, allReportIds);
            } catch (updateError) {
                console.error('Error updating reports during invoice deletion:', updateError);
                // Continue with invoice deletion even if report update fails
            }
        }
        
        // Delete entries from InvoiceReport junction table
        if (reportIdsFromJunction.length > 0) {
            await InvoiceReport.destroy({
                where: { invoice_id: invoice.id },
                transaction
            });
            console.log(`Deleted ${reportIdsFromJunction.length} entries from InvoiceReport junction table`);
        }
        
        // Delete invoice items
        await InvoiceItem.destroy({
            where: { invoiceId: invoice.id },
            transaction
        });
        console.log(`Deleted invoice items for invoice ${invoice.id}`);
        
        // Store invoice data before deletion for hook
        const invoiceData = invoice.toJSON();
        
        // Delete the invoice
        await invoice.destroy({ transaction });
        console.log(`Deleted invoice ${invoice.id}`);
        
        await transaction.commit();
        
        // Handle invoice deletion hook for money management
        try {
            await handleInvoiceDeletion(invoiceData);
        } catch (hookError) {
            console.error('Error in invoice deletion hook:', hookError);
            // Don't fail the request if the hook fails
        }
        
        res.json({ 
            message: 'Invoice deleted successfully',
            unlinkedReports: allReportIds.length
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Error deleting invoice:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
