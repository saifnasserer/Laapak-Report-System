/**
 * Laapak Report System - Invoices API Routes
 * Handles all invoice-related API endpoints including print and sharing
 */

const express = require('express');
const router = express.Router();
const { Invoice, InvoiceItem, Report, Client, InvoiceReport, sequelize } = require('../models');
const { auth, adminAuth, clientAuth } = require('../middleware/auth');
const { Op } = require('sequelize');
const Notifier = require('../utils/notifier');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

// JWT Secret for print token verification
const JWT_SECRET = process.env.JWT_SECRET;

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

/**
 * Helper to authenticate for print view (supports token in query)
 */
const printAuth = async (req, res, next) => {
  const token = req.query.token || req.header('x-auth-token') || req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).send('<html dir="rtl"><body><h1>غير مصرح</h1><p>يجب توفير مفتاح الوصول للوصول إلى هذه الصفحة.</p></body></html>');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded.user || decoded;
    next();
  } catch (err) {
    return res.status(401).send('<html dir="rtl"><body><h1>جلسة منتهية</h1><p>انتهت صلاحية مفتاح الوصول، يرجى تسجيل الدخول مجدداً.</p></body></html>');
  }
};

// Get all invoices (admin only)
router.get('/', adminAuth, async (req, res) => {
  try {
    const invoices = await Invoice.findAll({
      include: [
        { model: Client, as: 'client', attributes: ['id', 'name', 'phone'] },
        { model: Report, as: 'relatedReports', attributes: ['id', 'device_model', 'serial_number', 'order_number'] }
      ],
      order: [['created_at', 'DESC']]
    });
    res.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ message: 'Failed to fetch invoices', error: error.message });
  }
});

// Get client invoices
router.get('/client', clientAuth, async (req, res) => {
  try {
    const invoices = await Invoice.findAll({
      where: { client_id: req.user.id },
      include: [
        { model: Report, as: 'relatedReports', attributes: ['id', 'device_model', 'serial_number', 'order_number'] }
      ],
      order: [['created_at', 'DESC']]
    });
    res.json(invoices);
  } catch (error) {
    console.error('Error fetching client invoices:', error);
    res.status(500).json({ message: 'Failed to fetch client invoices', error: error.message });
  }
});

// Get single invoice
router.get('/:id', auth, async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id, {
      include: [
        { model: Client, as: 'client', attributes: ['id', 'name', 'phone', 'email'] },
        { model: Report, as: 'relatedReports', attributes: ['id', 'device_model', 'serial_number', 'order_number'] },
        { model: InvoiceItem, as: 'InvoiceItems' }
      ]
    });

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Check permission
    if (!req.user.isAdmin && invoice.client_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view this invoice' });
    }

    res.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ message: 'Failed to fetch invoice', error: error.message });
  }
});

// Create new invoice
router.post('/', adminAuth, async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      date,
      report_ids,
      client_id,
      items,
      subtotal,
      taxRate,
      tax,
      discount,
      total,
      paymentMethod,
      paymentStatus,
      notes
    } = req.body;

    if (!client_id) return res.status(400).json({ message: 'Client ID is required' });
    if (!items || !items.length) return res.status(400).json({ message: 'Items are required' });

    // Generate unique ID
    const invoiceId = 'INV-' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 1000);

    const invoice = await Invoice.create({
      id: invoiceId,
      client_id,
      date: date ? new Date(date) : new Date(),
      subtotal,
      taxRate: taxRate || 0,
      tax,
      discount: discount || 0,
      total,
      paymentStatus: paymentStatus || 'unpaid',
      paymentMethod: paymentMethod || 'cash',
      created_at: new Date(),
      updated_at: new Date()
    }, { transaction });

    // Add items
    await Promise.all(items.map(item =>
      InvoiceItem.create({
        invoiceId: invoice.id,
        description: item.description,
        type: item.type || 'standard',
        amount: item.amount,
        quantity: item.quantity || 1,
        totalAmount: item.totalAmount || (item.amount * (item.quantity || 1)),
        created_at: new Date()
      }, { transaction })
    ));

    // Link reports
    if (report_ids && Array.isArray(report_ids)) {
      await InvoiceReport.bulkCreate(
        report_ids.map(rid => ({ invoice_id: invoice.id, report_id: rid })),
        { transaction }
      );

      // Mark reports as invoiced
      await Report.update(
        { invoice_created: true, billing_enabled: true, invoice_id: invoice.id, invoice_date: new Date() },
        { where: { id: { [Op.in]: report_ids } }, transaction }
      );
    }

    await transaction.commit();

    const result = await Invoice.findByPk(invoice.id, {
      include: [
        { model: Client, as: 'client' },
        { model: Report, as: 'relatedReports' },
        { model: InvoiceItem, as: 'InvoiceItems' }
      ]
    });

    res.status(201).json(result);
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error('Error creating invoice:', error);
    res.status(500).json({ message: 'Failed to create invoice', error: error.message });
  }
});

// Print Invoice
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
    // Use ID directly if it's already formatted, otherwise format it
    let invoiceNumber = invoice.id;
    if (!invoiceNumber.includes('INV-')) {
      invoiceNumber = `INV-${invoiceDate.getFullYear()}${String(invoiceDate.getMonth() + 1).padStart(2, '0')}${String(invoiceDate.getDate()).padStart(2, '0')}-${String(invoice.id).padStart(3, '0')}`;
    }

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
        .invoice-grid-system {
          display: grid;
          grid-template-areas: 
            "client warranty"
            "items items"
            "totals totals";
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 12px;
        }
        .customer-details { 
          grid-area: client;
          background: ${systemColors.background};
          padding: 16px;
          border-radius: 0;
          border: 1px solid ${systemColors.border};
        }
        .warranty-details { 
          grid-area: warranty;
          background: ${systemColors.background};
          padding: 16px;
          border-radius: 0;
          border: 1px solid ${systemColors.border};
        }
        .items-area {
          grid-area: items;
        }
        .totals-area {
          grid-area: totals;
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
          .invoice-grid-system {
            page-break-inside: avoid;
            margin-bottom: 20px;
          }
          .customer-details, .warranty-details {
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
          .table, .totals-table, .customer-details, .warranty-details {
            box-shadow: none !important;
            border: 1px solid ${systemColors.border} !important;
          }
          * {
            box-shadow: none !important;
          }
        }
        @media screen and (max-width: 768px) {
            .container {
                padding: 15mm 10mm;
                max-width: 100%;
            }
            .header-bottom {
                flex-direction: column;
                gap: 15px;
                text-align: center;
            }
            .company-info {
                text-align: center;
            }
            .invoice-grid-system {
                display: flex;
                flex-direction: column;
                grid-template-areas: none;
            }
            .totals-table {
                width: 100%;
            }
            .table th, .table td {
                padding: 8px 6px;
                font-size: 11px !important;
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
            ${(() => {
        let logoSrc = '/assets/images/logo.png'; // Default fallback
        try {
          const fs = require('fs');
          const logoPath = '/media/saif/brain/Projects/Laapak-Softwares/Laapak-Report-System/frontend-react/public/logo-full.png';
          if (fs.existsSync(logoPath)) {
            const logoData = fs.readFileSync(logoPath);
            logoSrc = `data:image/png;base64,${logoData.toString('base64')}`;
          }
        } catch (e) { console.error('Logo read error:', e); }

        return `<div style="margin-bottom:12px; text-align:center;">
                    <img src="${logoSrc}" alt="Laapak Logo" style="height:${getSetting('logoHeight', 80)}px; max-width:250px; width:auto; object-fit:contain;" />
                </div>`;
      })()}
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

        <div class="invoice-grid-system">
          ${getSetting('showCustomerInfo', true) ? `
          <div class="customer-details" style="order: 1;">
            <div class="section-title">بيانات العميل</div>
            <div class="info-row"><span class="label">الاسم:</span><span class="value">${customerName}</span></div>
            <div class="info-row"><span class="label">الهاتف:</span><span class="value">${customerPhone}</span></div>
            ${customerEmail ? `<div class="info-row"><span class="label">البريد:</span><span class="value">${customerEmail}</span></div>` : ''}
            ${customerAddress ? `<div class="info-row"><span class="label">العنوان:</span><span class="value">${customerAddress}</span></div>` : ''}
            ${getSetting('showInvoiceDate', true) ? `<div class="info-row" style="margin-top: 8px; padding-top: 8px; border-top: 1px solid ${systemColors.border};"><span class="label">تاريخ الإصدار:</span><span class="value">${dates.primary}</span></div>` : ''}
            <div class="info-row"><span class="label">الحالة:</span><span class="value">${statusText}</span></div>
          </div>
          ` : ''}

          <div class="warranty-details" style="order: 3;">
            <div class="section-title">شروط وأحكام الضمان</div>
            <div class="info-row">
              <span class="label">• 14 يوم استبدال واسترجاع</span>
            </div>
            <div style="font-size: 11px; color: ${systemColors.textSecondary}; margin-right: 12px; margin-bottom: 6px;">
              في حالة وجود مشكلة يتم تأكيدها بواسطة مركزنا فيكس زون
            </div>
            <div class="info-row">
              <span class="label">• 6 شهور ضد عيوب الصناعة فقط</span>
            </div>
            <div class="info-row">
              <span class="label">• 12 شهر ضمان صيانة دورية</span>
            </div>
            <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid ${systemColors.border};">
              <div style="font-size: 12px; font-weight: 600; color: ${systemColors.textPrimary}; margin-bottom: 6px;">استثناءات الضمان:</div>
              <div style="font-size: 11px; color: ${systemColors.textSecondary}; line-height: 1.6;">
                • الكسر أو التلف الناتج عن سوء الاستخدام<br>
                • دخول السوائل أو الرطوبة<br>
                • التعديلات غير المصرح بها<br>
              </div>
            </div>
          </div>

          <div class="items-area" style="order: 2;">
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
        </div>

          <div class="totals-area" style="order: 4;">
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
          </div>
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
        <div class="no-print" style="text-align:center; margin-top:40px; padding:20px;">
          <div style="display:flex; justify-content:center;">
            <button onclick="window.print()" style="width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; border: 1px solid ${systemColors.border}; border-radius: 50%; background: ${systemColors.surface}; color: ${systemColors.textPrimary}; cursor: pointer; font-size: 24px; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 4px 12px rgba(0,0,0,0.08);" onmouseover="this.style.background='${systemColors.background}'; this.style.transform='translateY(-2px) scale(1.05)'; this.style.boxShadow='0 6px 15px rgba(0,0,0,0.12)';" onmouseout="this.style.background='${systemColors.surface}'; this.style.transform='translateY(0) scale(1)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)';" title="طباعة الفاتورة">
              🖨️
            </button>
          </div>
          <p style="margin-top:16px; color:${systemColors.textSecondary}; font-size:13px; font-weight: 500;">اضبط إعدادات الطباعة للحصول على أفضل نتيجة</p>
        </div>
        <script>
          // Print logic is handled by window.print()
        </script>
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
    res.send(html);
  } catch (error) {
    console.error('Print error:', error);
    res.status(500).send('Error generating print view');
  }
});

// Update invoice payment
router.put('/:id/payment', adminAuth, async (req, res) => {
  try {
    const { paymentStatus, paymentMethod } = req.body;
    const invoice = await Invoice.findByPk(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    await invoice.update({
      paymentStatus,
      paymentMethod,
      paymentDate: paymentStatus === 'paid' ? new Date() : null
    });
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete invoice
router.delete('/:id', adminAuth, async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const invoice = await Invoice.findByPk(req.params.id, {
      include: [{ model: Report, as: 'relatedReports' }]
    });
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    // Unlink reports
    if (invoice.relatedReports && invoice.relatedReports.length) {
      await Report.update(
        { invoice_created: false, invoice_id: null, invoice_date: null },
        { where: { id: { [Op.in]: invoice.relatedReports.map(r => r.id) } }, transaction }
      );
    }

    await InvoiceItem.destroy({ where: { invoiceId: invoice.id }, transaction });
    await invoice.destroy({ transaction });
    await transaction.commit();
    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    if (transaction) await transaction.rollback();
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Share via WhatsApp
router.post('/:id/share/whatsapp', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findByPk(id, {
      include: [{ model: Client, as: 'client' }]
    });
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    const phone = invoice.client?.phone;
    if (!phone) return res.status(400).json({ message: 'رقم الهاتف غير متوفر' });

    const token = req.headers.authorization?.replace('Bearer ', '');
    const protocol = req.protocol;
    const host = req.get('host');
    const printUrl = `${protocol}://${host}/api/invoices/${id}/print?token=${token}`;

    const msg = `🧾 فاتورة الضمان من لابك رقم ${id}\nإجمالي المبلغ: ${Number(invoice.total).toLocaleString()} ج.م\nيمكنك استعراض الفاتورة من هنا:\n${printUrl}\n\nشكراً لتعاملك معنا.`;

    await Notifier.sendText(phone, msg);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Sharing failed', error: error.message });
  }
});

module.exports = router;
