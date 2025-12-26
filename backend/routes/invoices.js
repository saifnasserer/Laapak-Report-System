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
const path = require('path');
const fs = require('fs');

// Load print settings helper
function loadPrintSettings() {
  try {
    const p = path.join(__dirname, '..', 'config', 'print-settings.json');
    const raw = fs.readFileSync(p, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return {
      title: 'فاتورة',
      showLogo: false,
      logoUrl: '',
      margins: { top: 16, right: 16, bottom: 16, left: 16 },
      dateDisplay: 'both',
      companyName: 'Laapak'
    };
  }
}

// Format dates helper
function formatDates(dateObj, mode) {
  const formats = { gregorian: '', hijri: '' };
  try {
    formats.gregorian = new Intl.DateTimeFormat('ar-EG', { dateStyle: 'full', timeStyle: 'short' }).format(dateObj);
  } catch (_) {
    formats.gregorian = dateObj.toLocaleString('ar-EG');
  }
  try {
    formats.hijri = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', { dateStyle: 'full' }).format(dateObj);
  } catch (_) {
    formats.hijri = '';
  }
  const selected = (mode || 'both').toLowerCase();
  if (selected === 'gregorian') return { primary: formats.gregorian, secondary: '' };
  if (selected === 'hijri') return { primary: formats.hijri || formats.gregorian, secondary: '' };
  return { primary: formats.gregorian, secondary: formats.hijri };
}

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
    const settings = loadPrintSettings();
    const invoiceSettings = settings.invoice || {};

    // Helper function to get settings with fallback
    const getSetting = (key, defaultValue) => {
      if (key.includes('.')) {
        const parts = key.split('.');
        let value = invoiceSettings;
        let found = true;

        for (let i = 0; i < parts.length; i++) {
          if (value && typeof value === 'object' && value[parts[i]] !== undefined) {
            value = value[parts[i]];
          } else {
            found = false;
            break;
          }
        }

        if (found && value !== undefined) {
          if (typeof value === 'boolean') return value;
          if (value !== null && value !== '') return value;
        }

        value = settings;
        found = true;
        for (let i = 0; i < parts.length; i++) {
          if (value && typeof value === 'object' && value[parts[i]] !== undefined) {
            value = value[parts[i]];
          } else {
            found = false;
            break;
          }
        }

        if (found && value !== undefined) {
          if (typeof value === 'boolean') return value;
          if (value !== null && value !== '') return value;
        }

        return defaultValue;
      }

      if (invoiceSettings[key] !== undefined) {
        if (typeof invoiceSettings[key] === 'boolean') return invoiceSettings[key];
        if (invoiceSettings[key] !== null && invoiceSettings[key] !== '') return invoiceSettings[key];
      }
      if (settings[key] !== undefined) {
        if (typeof settings[key] === 'boolean') return settings[key];
        if (settings[key] !== null && settings[key] !== '') return settings[key];
      }
      return defaultValue;
    };

    const invoice = await Invoice.findByPk(req.params.id, {
      include: [
        { model: Client, as: 'client', attributes: ['id', 'name', 'phone', 'email', 'address'] },
        {
          model: Report,
          as: 'relatedReports',
          attributes: ['id', 'device_model', 'serial_number', 'order_number', 'created_at', 'updated_at']
        },
        { model: InvoiceItem, as: 'InvoiceItems' }
      ]
    });

    if (!invoice) {
      return res.status(404).send(`
        <html dir="rtl">
          <body style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
            <h1>الفاتورة غير موجودة</h1>
          </body>
        </html>
      `);
    }

    // Get invoice items
    const items = invoice.InvoiceItems || [];

    console.log(`[INVOICE PRINT] Invoice ID: ${req.params.id}, Items found: ${items.length}`);
    if (items.length > 0) {
      console.log(`[INVOICE PRINT] First item:`, items[0]);
    }

    // Calculate totals from items
    let subtotal = 0;
    items.forEach(item => {
      const itemTotal = (item.totalAmount !== null && item.totalAmount !== undefined)
        ? Number(item.totalAmount)
        : ((Number(item.quantity) || 1) * (Number(item.amount) || 0));
      subtotal += itemTotal;
    });

    // Tax: only use invoice tax value, initialize to 0 by default
    let taxAmount = Number(invoice.tax) || 0;

    const discountAmount = Number(invoice.discount) || 0;
    const shippingAmount = 0; // Not used in current schema

    // Calculate final total
    const showShipping = getSetting('financial.showShipping', true);
    const total = subtotal - discountAmount + taxAmount + (showShipping ? shippingAmount : 0);

    // Calculate amount paid
    let amountPaid = 0;
    if (invoice.paymentStatus === 'paid' || invoice.paymentStatus === 'completed') {
      amountPaid = total;
    } else if (invoice.paymentStatus === 'partial') {
      amountPaid = Math.max(0, total * 0.5); // Estimate - should be tracked in DB
    }
    const remaining = total - amountPaid;

    // Status text mapping
    const statusTextMap = {
      'draft': 'مسودة',
      'sent': 'تم الإرسال',
      'paid': 'مدفوعة',
      'unpaid': 'غير مدفوعة',
      'pending': 'قيد الانتظار',
      'partially_paid': 'مدفوعة جزئياً',
      'completed': 'مكتمل',
      'overdue': 'متأخرة',
      'cancelled': 'ملغاة'
    };
    const statusText = statusTextMap[invoice.paymentStatus] || invoice.paymentStatus;

    const invoiceDate = new Date(invoice.date || invoice.createdAt || Date.now());

    // Generate repair request number if report exists
    let repairRequestNumber = null;
    if (invoice.relatedReports && invoice.relatedReports.length > 0) {
      const firstReport = invoice.relatedReports[0];
      const reportCreatedAt = firstReport.created_at || firstReport.createdAt;
      if (reportCreatedAt) {
        const repairDate = new Date(reportCreatedAt);
        repairRequestNumber = `REP-${repairDate.getFullYear()}${String(repairDate.getMonth() + 1).padStart(2, '0')}${String(repairDate.getDate()).padStart(2, '0')}-${String(firstReport.id).padStart(3, '0')}`;
      }
    }

    // Generate invoice number
    const invoiceNumber = `INV-${invoiceDate.getFullYear()}${String(invoiceDate.getMonth() + 1).padStart(2, '0')}${String(invoiceDate.getDate()).padStart(2, '0')}-${String(invoice.id).padStart(3, '0')}`;

    // Format dates - always show only Gregorian
    const dateDisplayMode = 'gregorian';
    const dates = formatDates(invoiceDate, dateDisplayMode);

    // System brand colors
    const systemColors = {
      primary: getSetting('colors', {}).primary || '#053887',
      primaryLight: '#3B82F6',
      success: '#10B981',
      secondary: getSetting('colors', {}).secondary || '#475569',
      border: getSetting('colors', {}).border || '#E5E7EB',
      textPrimary: getSetting('colors', {}).primary || '#0F172A',
      textSecondary: getSetting('colors', {}).secondary || '#64748B',
      background: '#FFFFFF',
      surface: '#F9FAFB',
      surfaceLight: '#F8FAFC'
    };

    const formattedDate = dates.primary;

    // Get device information
    let deviceModel = 'غير محدد';
    let serialNumber = 'غير محدد';
    let deviceType = 'غير محدد';

    if (invoice.relatedReports && invoice.relatedReports.length > 0) {
      const firstReport = invoice.relatedReports[0];
      deviceModel = firstReport.device_model || 'غير محدد';
      serialNumber = firstReport.serial_number || 'غير محدد';
    }

    // Prepare customer data
    const customerName = invoice.client ? invoice.client.name : 'غير محدد';
    const customerPhone = invoice.client ? invoice.client.phone : 'غير محدد';
    const customerEmail = invoice.client ? invoice.client.email : null;
    const customerAddress = invoice.client ? invoice.client.address : null;

    // Prepare payment method
    const paymentMethod = invoice.paymentMethod || 'cash';

    // Generate comprehensive HTML template matching invoicesSimple.js style
    const html = `
<!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>فاتورة - ${invoiceNumber}</title>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@200;300;400;500;600;700;800;900&family=Tajawal:wght@200;300;400;500;700;800;900&display=swap" rel="stylesheet" />
      <style>
        @page {
          size: ${getSetting('paperSize', 'A4')} ${getSetting('orientation', 'portrait') === 'landscape' ? 'landscape' : 'portrait'};
          margin: ${getSetting('margins', {}).top || 15}mm ${getSetting('margins', {}).right || 15}mm ${getSetting('margins', {}).bottom || 15}mm ${getSetting('margins', {}).left || 15}mm;
        }
        * { margin:0; padding:0; box-sizing:border-box; }
        body { 
          font-family: 'Cairo', 'Tajawal', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; 
          font-size:${getSetting('fontSize', 14)}px; 
          line-height:${getSetting('lineHeight', 1.7)}; 
          color:${systemColors.textPrimary}; 
          background:#fff; 
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          direction: rtl;
          text-align: right;
        }
        .container { 
          max-width: ${getSetting('paperSize', 'A4') === 'A4' ? '210mm' : getSetting('paperSize', 'A4') === 'A5' ? '148mm' : '216mm'};
          min-height: ${getSetting('paperSize', 'A4') === 'A4' ? '297mm' : getSetting('paperSize', 'A4') === 'A5' ? '210mm' : '279mm'};
          margin: 0 auto;
          padding: ${getSetting('margins', {}).top || 20}mm ${getSetting('margins', {}).right || 20}mm ${getSetting('margins', {}).bottom || 20}mm ${getSetting('margins', {}).left || 20}mm;
          background: #fff;
        }
        .header { 
          margin-bottom: ${getSetting('spacing', {}).section || 32}px;
          padding-bottom: ${getSetting('spacing', {}).section || 20}px;
          border-bottom: 1px solid ${systemColors.border};
        }
        .header-top {
          text-align: center;
          margin-bottom: 16px;
        }
        .header-bottom {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
        }
        .logo { 
          font-size:${getSetting('titleFontSize', 24)}px; 
          font-weight:500; 
          color:${systemColors.textPrimary}; 
          margin-bottom:4px;
        }
        .company-info { 
          font-size:${getSetting('fontSize', 13)}px; 
          color:${systemColors.textSecondary};
          line-height: 1.6;
          font-weight: 400;
          flex: 1;
        }
        .invoice-number-section {
          text-align: left;
          flex-shrink: 0;
        }
        .invoice-number-label {
          font-size: 11px;
          color: ${systemColors.textSecondary};
          font-weight: 400;
          margin-bottom: 4px;
        }
        .invoice-number-value {
          font-size: ${getSetting('titleFontSize', 16)}px;
          font-weight: 500;
          color: ${systemColors.textPrimary};
          font-family: 'Courier New', monospace;
        }
        .qr-code-container {
          text-align: center;
          width: ${Math.min(getSetting('qrCodeSize', 80), 100)}px;
          height: auto;
          flex-shrink: 0;
        }
        .qr-code-label {
          font-size: 9px;
          color: ${getSetting('colors', {}).secondary || '#6b7280'};
          margin-top: 4px;
          line-height: 1.2;
        }
        .barcode-container {
          text-align: center;
          margin: ${getSetting('spacing', {}).section || 20}px 0;
        }
        .barcode-container canvas {
          border: 1px solid ${getSetting('colors', {}).border || '#e5e7eb'};
          border-radius: 4px;
          padding: 8px;
        }
        .invoice-info { 
          display:grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 12px;
        }
        .invoice-details, .customer-details { 
          background: ${systemColors.background};
          padding: 16px;
          border-radius: 0;
          border: 1px solid ${systemColors.border};
        }
        .invoice-details {
          text-align: right;
          direction: rtl;
        }
        .invoice-details .section-title {
          text-align: right;
          direction: rtl;
        }
        .invoice-details .info-row {
          flex-direction: row;
          justify-content: space-between;
        }
        .invoice-details .info-row .value {
          text-align: left;
          direction: ltr;
          unicode-bidi: embed;
        }
        .section-title { 
          font-size: ${getSetting('sectionTitleFontSize', 15)}px;
          font-weight:600; 
          color:${systemColors.textPrimary}; 
          margin-bottom:${getSetting('spacing', {}).item || 10}px; 
          padding-bottom:6px;
          border-bottom: 1px solid ${systemColors.border};
        }
        .info-row { 
          margin-bottom:6px;
          display: flex;
          justify-content: space-between;
        }
        .info-row:last-child {
          margin-bottom: 0;
        }
        .label { 
          font-weight:400; 
          color:${systemColors.textSecondary};
          font-size: 13px;
        }
        .value {
          font-weight: 500;
          color: ${systemColors.textPrimary};
          font-size: 14px;
        }
        .table { 
          width:100%; 
          border-collapse: collapse;
          margin:20px 0;
          background: ${systemColors.background};
          border: 1px solid ${systemColors.border};
        }
        .table th, .table td { 
          padding:10px 12px; 
          text-align:right; 
          border-bottom:1px solid ${systemColors.border};
        }
        .table th { 
          background: ${systemColors.surface};
          color: ${systemColors.textPrimary};
          font-weight:500;
          font-size: ${getSetting('tableFontSize', 13)}px;
        }
        .table tbody tr:nth-child(even) {
          background: ${getSetting('tableStyle', 'bordered') === 'striped' ? systemColors.surfaceLight : 'transparent'};
        }
        .table tbody td {
          font-weight: 400;
          color: ${systemColors.textPrimary};
        }
        ${getSetting('pageBreak', {}).avoidItems ? `
        .table tbody tr {
          page-break-inside: avoid;
        }
        ` : ''}
        ${getSetting('pageBreak', {}).avoidCustomerInfo ? `
        .customer-details, .invoice-details {
          page-break-inside: avoid;
        }
        ` : ''}
        .table .number { 
          text-align:center; 
          font-family:'Courier New', monospace;
          font-weight: 400;
          font-size: ${getSetting('tableFontSize', 13)}px;
          color: ${systemColors.textPrimary};
        }
        .totals { 
          margin-top:12px;
          display: flex;
          justify-content: flex-end;
        }
        .totals-table { 
          width:380px;
          border-collapse: collapse;
          background: ${systemColors.background};
          border: 1px solid ${systemColors.border};
        }
        .totals-table td { 
          padding:8px 16px;
          border-bottom: 1px solid ${systemColors.border};
        }
        .totals-table td:first-child {
          text-align: right;
          color: ${systemColors.textSecondary};
          font-weight: 400;
          font-size: 14px;
        }
        .totals-table td:last-child {
          text-align: left;
          font-weight: 500;
          color: ${systemColors.textPrimary};
          font-size: 14px;
          font-family: 'Courier New', monospace;
        }
        .total-row { 
          font-weight:600; 
          font-size:${getSetting('sectionTitleFontSize', 16)}px; 
          border-top:1px solid ${systemColors.textPrimary};
          background: ${systemColors.surface};
        }
        .total-row td {
          color: ${systemColors.textPrimary};
          font-size: ${getSetting('sectionTitleFontSize', 16)}px;
          font-weight: 600;
        }
        .footer { 
          text-align:center; 
          margin-top:32px; 
          padding-top:16px;
          border-top:1px solid ${systemColors.border}; 
          font-size:12px; 
          color:${systemColors.textSecondary};
          line-height: 1.6;
          font-weight: 400;
        }
        @media print { 
          .no-print { display:none !important; }
          body { 
            margin: 0;
            background: #fff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .container { 
            padding: 0;
            margin: 0;
            max-width: 100%;
            min-height: auto;
            box-shadow: none;
          }
          .header {
            margin-bottom: 20px;
            padding-bottom: 15px;
            page-break-after: avoid;
          }
          .invoice-info {
            page-break-inside: avoid;
            margin-bottom: 20px;
          }
          .invoice-details, .customer-details {
            page-break-inside: avoid;
          }
          .table {
            page-break-inside: auto;
          }
          .table thead {
            display: table-header-group;
          }
          .table tbody tr {
            page-break-inside: avoid;
          }
          .totals {
            page-break-inside: avoid;
          }
          .totals-table {
            page-break-inside: avoid;
          }
          .section-title {
            page-break-after: avoid;
          }
          .footer {
            page-break-inside: avoid;
            position: relative;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          .invoice-number-box {
            box-shadow: none !important;
            background: ${systemColors.primary} !important;
          }
          .table, .totals-table, .invoice-details, .customer-details {
            box-shadow: none !important;
            border: 1px solid ${systemColors.border} !important;
          }
          * {
            box-shadow: none !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        ${getSetting('watermark', {}).enabled ? `
        <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%) rotate(-45deg); font-size:48px; color:${systemColors.primary}; opacity:${getSetting('watermark', {}).opacity || 0.1}; pointer-events:none; white-space:nowrap; z-index:1;">
          ${getSetting('watermark', {}).text || 'مسودة'}
        </div>
        ` : ''}
        <div class="header">
          <div class="header-top">
            ${getSetting('showLogo', false) && getSetting('logoUrl', '') ? `
            <div style="margin-bottom:12px; text-align:center;">
              <img src="${getSetting('logoUrl', '')}" alt="Logo" style="height:${getSetting('logoHeight', 50)}px; max-width:100%; object-fit:contain;" />
            </div>
            ` : `
            <div style="margin-bottom:12px; text-align:center;">
              <img src="/assets/images/logo.png" alt="Laapak Logo" style="height:${getSetting('logoHeight', 60)}px; max-width:100%; object-fit:contain;" onerror="this.onerror=null; this.src='/assets/images/logo.png'; this.onerror=function(){this.style.display='none'; this.nextElementSibling.style.display='block';};" />
              <div class="logo" style="display:none;">${getSetting('showCompanyInfo', true) ? (getSetting('companyName', settings.companyName || 'Laapak')) : getSetting('title', 'فاتورة')}</div>
            </div>
            `}
          </div>
          <div class="header-bottom">
            ${getSetting('showCompanyInfo', true) ? `
            <div class="company-info">
              ${getSetting('branchAddress', getSetting('address', settings.branchAddress || settings.address || '19 شارع يوسف الجندي - التحرير - القاهرة'))}<br>
              ${getSetting('branchPhone', getSetting('phone', settings.branchPhone || settings.phone || '01013148007')) ? `هاتف: ${getSetting('branchPhone', getSetting('phone', settings.branchPhone || settings.phone || '01013148007'))}` : ''} ${getSetting('email', settings.email || 'info@laapak.com') ? `| بريد إلكتروني: ${getSetting('email', settings.email || 'info@laapak.com')}` : ''}
            </div>
            ` : '<div></div>'}
            ${getSetting('showInvoiceNumber', true) ? `
            <div class="invoice-number-section">
              <div class="invoice-number-label">رقم الفاتورة</div>
              <div class="invoice-number-value">${invoiceNumber}</div>
            </div>
            ` : ''}
          </div>
          ${getSetting('showQrCode', false) ? `
          <div style="text-align:center; margin-top:16px;">
            <div class="qr-code-container" style="width:${Math.min(getSetting('qrCodeSize', 80), 100)}px; height:auto; display:inline-block;">
              <canvas id="qrCanvas" width="${Math.min(getSetting('qrCodeSize', 80), 100)}" height="${Math.min(getSetting('qrCodeSize', 80), 100)}" style="border:1px solid ${systemColors.border}; padding:4px; max-width:100%; height:auto;"></canvas>
              <div class="qr-code-label" style="font-size:9px; color:${systemColors.textSecondary}; margin-top:4px;">تتبع</div>
            </div>
          </div>
          ` : ''}
        </div>
        
            ${getSetting('showHeader', true) && getSetting('headerText', '') ? `
        <div style="text-align:center; margin-bottom:${getSetting('spacing', {}).section || 20}px; font-size:${getSetting('headerFontSize', 20)}px; font-weight:500; color:${systemColors.textPrimary};">
          ${getSetting('headerText', 'فاتورة')}
        </div>
        ` : ''}

        <div class="invoice-info">
          ${getSetting('showInvoiceNumber', true) || getSetting('showInvoiceDate', true) ? `
          <div class="invoice-details">
            ${getSetting('showHeader', true) ? `<div class="section-title">تفاصيل الفاتورة</div>` : ''}
            ${getSetting('showInvoiceNumber', true) ? `<div class="info-row"><span class="label">رقم الفاتورة:</span><span class="value">${invoiceNumber}</span></div>` : ''}
            ${repairRequestNumber ? `<div class="info-row"><span class="label">كود التقرير:</span><span class="value">${repairRequestNumber}</span></div>` : ''}
            ${getSetting('showInvoiceDate', true) ? `<div class="info-row"><span class="label">تاريخ الإصدار:</span><span class="value">${dates.primary}</span></div>` : ''}
            ${getSetting('showDueDate', true) && invoice.dueDate ? `<div class="info-row"><span class="label">تاريخ الاستحقاق:</span><span class="value">${formatDates(new Date(invoice.dueDate), 'gregorian').primary}</span></div>` : ''}
            <div class="info-row"><span class="label">الحالة:</span><span class="value">${statusText}</span></div>
          </div>
          ` : ''}
          ${getSetting('showCustomerInfo', true) ? `
          <div class="customer-details">
            <div class="section-title">بيانات العميل</div>
            <div class="info-row"><span class="label">الاسم:</span><span class="value">${customerName}</span></div>
            <div class="info-row"><span class="label">الهاتف:</span><span class="value">${customerPhone}</span></div>
            ${customerEmail ? `<div class="info-row"><span class="label">البريد:</span><span class="value">${customerEmail}</span></div>` : ''}
            ${customerAddress ? `<div class="info-row"><span class="label">العنوان:</span><span class="value">${customerAddress}</span></div>` : ''}
          </div>
          ` : ''}
        </div>


        ${getSetting('showItemsTable', true) ? `
        <div class="section-title" style="margin-top: 5px; margin-bottom: 10px;">المشتريات</div>
        <table class="table">
          <thead>
            <tr>
              <th>اسم الجهاز</th>
              <th>الرقم التسلسلي</th>
              <th class="number">الكمية</th>
              <th class="number">السعر</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => {
      const itemTotal = (item.totalAmount !== null && item.totalAmount !== undefined)
        ? Number(item.totalAmount)
        : ((Number(item.quantity) || 1) * (Number(item.amount) || 0));

      // Get device info from related reports or item
      let deviceName = item.description || 'غير محدد';
      let itemSerialNumber = item.serialNumber || 'غير محدد';

      // Try to match with related reports using report_id first, then by serial number
      if (invoice.relatedReports && invoice.relatedReports.length > 0) {
        let matchingReport = null;

        // First try to match by report_id
        if (item.report_id) {
          matchingReport = invoice.relatedReports.find(report => report.id === item.report_id);
        }

        // If no match by report_id, try by serial number
        if (!matchingReport && itemSerialNumber !== 'غير محدد') {
          matchingReport = invoice.relatedReports.find(report =>
            report.serial_number === itemSerialNumber
          );
        }

        // If still no match, try by device model in description
        if (!matchingReport) {
          matchingReport = invoice.relatedReports.find(report =>
            deviceName.includes(report.device_model) || report.device_model === deviceName
          );
        }

        if (matchingReport) {
          deviceName = matchingReport.device_model || deviceName;
          itemSerialNumber = matchingReport.serial_number || itemSerialNumber;
        }
      }

      return `
              <tr>
                <td style="font-weight: 400; color: ${systemColors.textPrimary}; font-size: ${getSetting('tableFontSize', 13)}px;">${deviceName}</td>
                <td style="font-weight: 400; color: ${systemColors.textPrimary}; font-size: ${getSetting('tableFontSize', 13)}px;">${itemSerialNumber}</td>
                <td class="number">${Number(item.quantity) || 1}</td>
                <td class="number">${(Number(item.amount) || 0).toFixed(getSetting('numberFormat', {}).decimalPlaces || 2)} ${getSetting('currency', {}).showSymbol ? (getSetting('currency', {}).symbolPosition === 'before' ? 'ج.م ' : '') : ''}${getSetting('currency', {}).showSymbol && getSetting('currency', {}).symbolPosition === 'after' ? ' ج.م' : ''}</td>
              </tr>
            `;
    }).join('')}
            ${items.length === 0 ? `<tr><td colspan="4" style="text-align:center; color:${systemColors.textSecondary};">لا توجد عناصر في الفاتورة</td></tr>` : ''}
          </tbody>
        </table>
        ` : ''}

        <div class="totals">
          <table class="totals-table">
            ${getSetting('showDiscount', true) && discountAmount > 0 ? `
            <tr>
              <td>الخصم:</td>
              <td class="number">-${discountAmount.toFixed(getSetting('numberFormat', {}).decimalPlaces || 2)} ${getSetting('currency', {}).showSymbol ? (getSetting('currency', {}).symbolPosition === 'before' ? 'ج.م ' : '') : ''}${getSetting('currency', {}).showSymbol && getSetting('currency', {}).symbolPosition === 'after' ? ' ج.م' : ''}</td>
            </tr>
            ` : ''}
            ${getSetting('financial.showTax', true) && taxAmount > 0 ? `
            <tr>
              <td>الضريبة:</td>
              <td class="number">${taxAmount.toFixed(getSetting('numberFormat', {}).decimalPlaces || 2)} ${getSetting('currency', {}).showSymbol ? (getSetting('currency', {}).symbolPosition === 'before' ? 'ج.م ' : '') : ''}${getSetting('currency', {}).showSymbol && getSetting('currency', {}).symbolPosition === 'after' ? ' ج.م' : ''}</td>
            </tr>
            ` : ''}
            ${getSetting('financial.showShipping', true) && shippingAmount > 0 ? `
            <tr>
              <td>الشحن:</td>
              <td class="number">${shippingAmount.toFixed(getSetting('numberFormat', {}).decimalPlaces || 2)} ${getSetting('currency', {}).showSymbol ? (getSetting('currency', {}).symbolPosition === 'before' ? 'ج.م ' : '') : ''}${getSetting('currency', {}).showSymbol && getSetting('currency', {}).symbolPosition === 'after' ? ' ج.م' : ''}</td>
            </tr>
            ` : ''}
            ${getSetting('showTotal', true) ? `
            <tr class="total-row">
              <td>الإجمالي:</td>
              <td class="number">${total.toFixed(getSetting('numberFormat', {}).decimalPlaces || 2)} ${getSetting('currency', {}).showSymbol ? (getSetting('currency', {}).symbolPosition === 'before' ? 'ج.م ' : '') : ''}${getSetting('currency', {}).showSymbol && getSetting('currency', {}).symbolPosition === 'after' ? ' ج.م' : ''}</td>
            </tr>
            ` : ''}
            <tr>
              <td>المدفوع:</td>
              <td class="number">${amountPaid.toFixed(getSetting('numberFormat', {}).decimalPlaces || 2)} ${getSetting('currency', {}).showSymbol ? (getSetting('currency', {}).symbolPosition === 'before' ? 'ج.م ' : '') : ''}${getSetting('currency', {}).showSymbol && getSetting('currency', {}).symbolPosition === 'after' ? ' ج.م' : ''}</td>
            </tr>
            <tr>
              <td>المتبقي:</td>
              <td class="number" style="font-weight: 500;">${remaining.toFixed(getSetting('numberFormat', {}).decimalPlaces || 2)} ${getSetting('currency', {}).showSymbol ? (getSetting('currency', {}).symbolPosition === 'before' ? 'ج.م ' : '') : ''}${getSetting('currency', {}).showSymbol && getSetting('currency', {}).symbolPosition === 'after' ? ' ج.م' : ''}</td>
            </tr>
          </table>
        </div>

        ${getSetting('showPaymentMethod', false) || getSetting('showPaymentStatus', false) ? `
        <div style="margin-top:${getSetting('spacing', {}).section || 16}px; margin-bottom:${getSetting('spacing', {}).section || 16}px; padding:12px 16px; background:${systemColors.background}; border:1px solid ${systemColors.border};">
          ${getSetting('showPaymentMethod', false) ? `
          <div style="margin-bottom:${getSetting('spacing', {}).item || 10}px; display:flex; justify-content:space-between; padding:8px 10px;">
            <span style="font-weight:400; color:${systemColors.textSecondary}; font-size:13px;">طريقة الدفع:</span>
            <span style="font-weight:500; color:${systemColors.textPrimary}; font-size:13px;">${paymentMethod === 'cash' ? 'نقد' : paymentMethod === 'card' ? 'بطاقة' : paymentMethod === 'bank_transfer' ? 'تحويل بنكي' : paymentMethod === 'check' ? 'شيك' : paymentMethod === 'instapay' ? 'Instapay' : paymentMethod || 'نقد'}</span>
          </div>
          ` : ''}
          ${getSetting('showPaymentStatus', false) ? `
          <div style="display:flex; justify-content:space-between; padding:8px 10px;">
            <span style="font-weight:400; color:${systemColors.textSecondary}; font-size:13px;">حالة الدفع:</span>
            <span style="font-weight:500; color:${systemColors.textPrimary}; font-size:13px;">${statusText}</span>
          </div>
          ` : ''}
        </div>
        ` : ''}

        ${getSetting('showNotes', false) && invoice.notes ? `
        <div style="margin-top:${getSetting('spacing', {}).section || 20}px; margin-bottom:${getSetting('spacing', {}).section || 20}px;">
          <div class="section-title">${getSetting('notesLabel', 'ملاحظات')}</div>
          <div style="background:${systemColors.surface}; padding:12px 14px; border:1px solid ${systemColors.border}; color:${systemColors.textSecondary};">
            ${invoice.notes}
          </div>
        </div>
        ` : ''}

        ${getSetting('showTerms', false) && getSetting('termsText', '') ? `
        <div style="margin-top:${getSetting('spacing', {}).section || 20}px; margin-bottom:${getSetting('spacing', {}).section || 20}px;">
          <div class="section-title">${getSetting('termsLabel', 'الشروط والأحكام')}</div>
          <div style="background:${systemColors.surface}; padding:12px 14px; border:1px solid ${systemColors.border}; color:${systemColors.textSecondary}; font-size:${getSetting('fontSize', 14) - 1}px; line-height:1.6;">
            ${getSetting('termsText', '')}
          </div>
        </div>
        ` : ''}

        ${getSetting('showBarcode', false) ? `
        <div class="barcode-container" style="text-align:${getSetting('barcodePosition', 'bottom') === 'top' ? 'center' : getSetting('barcodePosition', 'bottom') === 'bottom' ? 'center' : getSetting('barcodePosition', 'bottom')};">
          <canvas id="barcodeCanvas" style="width:${getSetting('barcodeWidth', 2) * 100}px; height:${getSetting('barcodeHeight', 40)}px;"></canvas>
        </div>
        ` : ''}

        ${getSetting('showFooter', true) ? `
        <div class="footer">
          شكراً لثقتكم بنا | ${getSetting('companyName', settings.companyName || 'Laapak')}
          ${getSetting('footerText', '') ? `<br>${getSetting('footerText', '')}` : ''}
        </div>
        ` : ''}

        <div class="no-print" style="text-align:center; margin-top:30px; padding:20px; background:${systemColors.surface}; border-radius:12px; border:1px solid ${systemColors.border};">
          <div style="display:flex; gap:12px; justify-content:center; flex-wrap:wrap;">
            <button onclick="window.print()" style="padding:14px 32px; border:none; border-radius:6px; background:${systemColors.primary}; color:#fff; cursor:pointer; font-size:15px; font-weight:500;">
              🖨️ طباعة الفاتورة
            </button>
            <button onclick="window.close()" style="padding:14px 32px; border:1px solid ${systemColors.border}; border-radius:10px; background:${systemColors.background}; color:${systemColors.textPrimary}; cursor:pointer; font-size:15px; font-weight:600; transition: all 0.2s ease;" onmouseover="this.style.background='${systemColors.surfaceLight}';" onmouseout="this.style.background='${systemColors.background}';">
              ✕ إغلاق
            </button>
          </div>
          <p style="margin-top:12px; color:${systemColors.textSecondary}; font-size:13px;">تأكد من إعدادات الطباعة قبل الطباعة</p>
        </div>
      </div>
      ${getSetting('showQrCode', false) ? `
      <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
      <script>
        (function(){
          try {
            var canvas = document.getElementById('qrCanvas');
            if (canvas && window.QRCode) {
              var qrSize = Math.min(${getSetting('qrCodeSize', 80)}, 100);
              var frontendUrl = window.location.origin;
              var qrUrl = frontendUrl + '/invoices/${req.params.id}';
              QRCode.toCanvas(canvas, qrUrl, { 
                width: qrSize, 
                margin: 1,
                color: {
                  dark: '${systemColors.primary}',
                  light: '#ffffff'
                }
              }, function (error) { 
                if (error) console.error(error); 
              });
            }
          } catch (e) { console.error(e); }
        })();
      </script>
      ` : ''}
      ${getSetting('showBarcode', false) ? `
      <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
      <script>
        (function(){
          try {
            var canvas = document.getElementById('barcodeCanvas');
            if (canvas && window.JsBarcode) {
              JsBarcode(canvas, '${invoiceNumber}', {
                format: "CODE128",
                width: ${getSetting('barcodeWidth', 2)},
                height: ${getSetting('barcodeHeight', 40)},
                displayValue: true,
                fontSize: 12,
                margin: 10
              });
            }
          } catch (e) { console.error(e); }
        })();
      </script>
      ` : ''}
    </body>
    </html>`;

    res.setHeader('Content-Type', 'text/html; charset=UTF-8');
    return res.send(html);
  } catch (err) {
    console.error('Error printing invoice:', err);
    console.error('Error stack:', err.stack);
    console.error('Invoice ID:', req.params.id);
    res.status(500).send(`<html dir="rtl"><body><h1>خطأ في الخادم</h1><p>${err.message || 'حدث خطأ أثناء الطباعة'}</p><pre>${err.stack || ''}</pre></body></html>`);
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
        // First, get existing links to avoid duplicate key errors
        const existingLinks = await InvoiceReport.findAll({
          where: {
            invoice_id: invoice.id,
            report_id: { [Op.in]: reportIds }
          },
          attributes: ['report_id'],
          raw: true,
          transaction // Include transaction for read operations within a transaction
        });

        const existingReportIds = existingLinks.map(link => link.report_id);
        const newReportIds = reportIds.filter(id => !existingReportIds.includes(id));

        console.log('Existing report links:', existingReportIds);
        console.log('New report links to create:', newReportIds);

        // Only create links for reports that don't already have a link
        if (newReportIds.length > 0) {
          const invoiceReportEntries = newReportIds.map(rId => ({
            invoice_id: invoice.id,
            report_id: rId
          }));
          await InvoiceReport.bulkCreate(invoiceReportEntries, { transaction });
          console.log(`Created ${invoiceReportEntries.length} new entries in InvoiceReport table.`);
        } else {
          console.log('All report links already exist, skipping creation');
        }

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
      const reportIdsToLink = [...new Set(reportIdsFromItems)]; // Remove duplicates
      if (reportIdsToLink.length > 0) {
        console.log('Linking reports from invoice items:', reportIdsToLink);

        // First, get existing links to avoid duplicate key errors
        const existingLinks = await InvoiceReport.findAll({
          where: {
            invoice_id: invoice.id,
            report_id: { [Op.in]: reportIdsToLink }
          },
          attributes: ['report_id'],
          raw: true,
          transaction
        });

        const existingReportIds = existingLinks.map(link => link.report_id);
        const newReportIds = reportIdsToLink.filter(id => !existingReportIds.includes(id));

        console.log('Existing report links:', existingReportIds);
        console.log('New report links to create:', newReportIds);

        // Only create links for reports that don't already have a link
        if (newReportIds.length > 0) {
          const invoiceReportEntries = newReportIds.map(reportId => ({
            invoice_id: invoice.id,
            report_id: reportId
          }));

          await InvoiceReport.bulkCreate(invoiceReportEntries, { transaction });
          console.log(`Created ${newReportIds.length} new invoice-report links`);
        } else {
          console.log('All report links already exist, skipping creation');
        }

        // Update reports to mark them as having an invoice
        await Report.update(
          {
            billingEnabled: true,
            invoice_created: true,
            invoice_id: invoice.id,
            invoice_date: new Date()
          },
          {
            where: { id: { [Op.in]: reportIdsToLink } },
            transaction
          }
        );

        console.log(`Linked ${reportIdsToLink.length} reports to invoice ${invoice.id}`);
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
