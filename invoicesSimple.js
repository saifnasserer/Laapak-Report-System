const express = require('express');
const router = express.Router();
const invoicesController = require('../controllers/invoicesControllerSimple');
const { validate, invoiceSchemas, commonSchemas } = require('../middleware/validation');
const authMiddleware = require('../middleware/authMiddleware');
const Joi = require('joi');
const db = require('../db');
const path = require('path');
const fs = require('fs');

// Public print endpoint with phone verification (must be before authMiddleware)
// This endpoint verifies phone number and then redirects to the regular print endpoint
router.get('/public/:id/print', async (req, res) => {
  const { id } = req.params;
  const { phoneNumber, repairRequestId } = req.query;
  
  try {
    if (!phoneNumber || !repairRequestId) {
      return res.status(400).send(`
        <html dir="rtl">
          <body style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
            <h1>خطأ في الطلب</h1>
            <p>يرجى إدخال رقم الهاتف ورقم طلب الإصلاح</p>
          </body>
        </html>
      `);
    }

    // Normalize phone numbers
    const normalizedPhone = phoneNumber.replace(/\D/g, '');

    // Verify phone number matches the repair request's customer
    const [repairRows] = await db.query(`
      SELECT rr.id, c.phone as customerPhone
      FROM RepairRequest rr
      LEFT JOIN Customer c ON rr.customerId = c.id
      WHERE rr.id = ? AND rr.deletedAt IS NULL
    `, [repairRequestId]);

    if (repairRows.length === 0) {
      return res.status(404).send(`
        <html dir="rtl">
          <body style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
            <h1>طلب الإصلاح غير موجود</h1>
          </body>
        </html>
      `);
    }

    const repair = repairRows[0];
    const normalizedCustomerPhone = (repair.customerPhone || '').replace(/\D/g, '');

    // Verify phone number matches
    if (normalizedCustomerPhone !== normalizedPhone) {
      return res.status(403).send(`
        <html dir="rtl">
          <body style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
            <h1>غير مصرح</h1>
            <p>رقم الهاتف غير صحيح</p>
          </body>
        </html>
      `);
    }

    // Verify invoice belongs to this repair request
    const [invoiceCheck] = await db.query(`
      SELECT id FROM Invoice 
      WHERE id = ? AND repairRequestId = ? AND deletedAt IS NULL
    `, [id, repairRequestId]);

    if (invoiceCheck.length === 0) {
      return res.status(404).send(`
        <html dir="rtl">
          <body style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
            <h1>الفاتورة غير موجودة</h1>
          </body>
        </html>
      `);
    }

    // If verification passes, redirect to print with verification parameters
    return res.redirect(`/api/invoices/${id}/print?public=true&phoneNumber=${encodeURIComponent(phoneNumber)}&repairRequestId=${repairRequestId}`);
  } catch (error) {
    console.error('Error in public print verification:', error);
    return res.status(500).send(`
      <html dir="rtl">
        <body style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
          <h1>خطأ في الخادم</h1>
          <p>${error.message || 'حدث خطأ أثناء التحقق'}</p>
        </body>
      </html>
    `);
  }
});

// Public endpoint for invoice verification by phone number (must be before authMiddleware)
router.get('/public/verify', async (req, res) => {
  try {
    const { repairRequestId, phoneNumber } = req.query;
    
    if (!repairRequestId || !phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'repairRequestId and phoneNumber are required'
      });
    }

    // Normalize phone numbers (remove non-digits)
    const normalizedPhone = phoneNumber.replace(/\D/g, '');

    // Verify phone number matches the repair request's customer
    const [repairRows] = await db.query(`
      SELECT rr.id, c.phone as customerPhone
      FROM RepairRequest rr
      LEFT JOIN Customer c ON rr.customerId = c.id
      WHERE rr.id = ? AND rr.deletedAt IS NULL
    `, [repairRequestId]);

    if (repairRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Repair request not found'
      });
    }

    const repair = repairRows[0];
    const normalizedCustomerPhone = (repair.customerPhone || '').replace(/\D/g, '');

    // Verify phone number matches
    if (normalizedCustomerPhone !== normalizedPhone) {
      return res.status(403).json({
        success: false,
        error: 'Phone number does not match'
      });
    }

    // If phone matches, fetch invoices for this repair
    // Note: Only select columns that exist in Invoice table
    const [invoiceRows] = await db.query(`
      SELECT 
        i.id,
        i.totalAmount,
        i.amountPaid,
        i.status,
        i.currency,
        i.taxAmount,
        i.createdAt,
        (SELECT paymentMethod FROM Payment WHERE invoiceId = i.id ORDER BY createdAt DESC LIMIT 1) as paymentMethod,
        (SELECT COALESCE(SUM(amount), 0) FROM Payment WHERE invoiceId = i.id) as actualAmountPaid
      FROM Invoice i
      WHERE i.repairRequestId = ? AND i.deletedAt IS NULL
      ORDER BY i.createdAt DESC
      LIMIT 1
    `, [repairRequestId]);

    if (invoiceRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No invoices found for this repair request'
      });
    }

    const invoice = invoiceRows[0];
    
    // Use actual amount paid from payments if available, otherwise use amountPaid from invoice
    const actualPaid = parseFloat(invoice.actualAmountPaid || invoice.amountPaid || 0);
    const totalAmount = parseFloat(invoice.totalAmount || 0);
    
    res.json({
      success: true,
      data: {
        id: invoice.id,
        invoiceId: invoice.id, // Use id as invoiceId for consistency with frontend
        title: `فاتورة #${invoice.id}`, // Generate title from id since title column doesn't exist
        totalAmount: totalAmount,
        amountPaid: actualPaid,
        status: invoice.status,
        currency: invoice.currency || 'EGP',
        taxAmount: parseFloat(invoice.taxAmount || 0),
        createdAt: invoice.createdAt,
        paymentMethod: invoice.paymentMethod || null
      }
    });
  } catch (error) {
    console.error('Error verifying invoice:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      details: error.message
    });
  }
});

// Load print settings helper (needed for print route)
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
      companyName: 'FixZone'
    };
  }
}

// Format dates helper (needed for print route)
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

// Apply authentication middleware to all other routes
// Note: Print route below will handle phone verification for public requests
router.use(authMiddleware);

// GET /api/invoices - Get all invoices
router.get('/', validate(invoiceSchemas.getInvoices, 'query'), invoicesController.getAllInvoices);

// GET /api/invoices/stats - Get invoice statistics
router.get('/stats', invoicesController.getInvoiceStats);

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
      companyName: 'FixZone'
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

// Print invoice route (MUST come before /:id route)
router.get('/:id/print', async (req, res) => {
  const { id } = req.params;
  const { public, phoneNumber, repairRequestId } = req.query;
  
  // If this is a public request, verify phone number
  if (public === 'true' && phoneNumber && repairRequestId) {
    try {
      const normalizedPhone = phoneNumber.replace(/\D/g, '');
      const [repairRows] = await db.query(`
        SELECT rr.id, c.phone as customerPhone
        FROM RepairRequest rr
        LEFT JOIN Customer c ON rr.customerId = c.id
        WHERE rr.id = ? AND rr.deletedAt IS NULL
      `, [repairRequestId]);

      if (repairRows.length === 0) {
        return res.status(404).send('طلب الإصلاح غير موجود');
      }

      const repair = repairRows[0];
      const normalizedCustomerPhone = (repair.customerPhone || '').replace(/\D/g, '');

      if (normalizedCustomerPhone !== normalizedPhone) {
        return res.status(403).send('رقم الهاتف غير صحيح');
      }

      // Verify invoice belongs to this repair
      const [invoiceCheck] = await db.query(`
        SELECT id FROM Invoice 
        WHERE id = ? AND repairRequestId = ? AND deletedAt IS NULL
      `, [id, repairRequestId]);

      if (invoiceCheck.length === 0) {
        return res.status(404).send('الفاتورة غير موجودة');
      }
    } catch (verifyError) {
      return res.status(500).send('خطأ في التحقق: ' + verifyError.message);
    }
  }
  
  try {
    const settings = loadPrintSettings();
    const invoiceSettings = settings.invoice || {};
    
    // Helper function to get settings with fallback
    // Priority: invoiceSettings > settings (root) > defaultValue
    const getSetting = (key, defaultValue) => {
      if (key.includes('.')) {
        const parts = key.split('.');
        let value = invoiceSettings;
        let found = true;
        
        // Try invoiceSettings first
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
        
        // Try settings (root level) as fallback
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
      
      // Simple key (no dots)
      // Try invoiceSettings first
      if (invoiceSettings[key] !== undefined) {
        if (typeof invoiceSettings[key] === 'boolean') return invoiceSettings[key];
        if (invoiceSettings[key] !== null && invoiceSettings[key] !== '') return invoiceSettings[key];
      }
      // Try settings (root level) as fallback
      if (settings[key] !== undefined) {
        if (typeof settings[key] === 'boolean') return settings[key];
        if (settings[key] !== null && settings[key] !== '') return settings[key];
      }
      return defaultValue;
    };
    
    // Get invoice with customer and repair details
    const [invoiceRows] = await db.execute(`
      SELECT 
        i.*,
        c.name as customerName,
        c.phone as customerPhone,
        c.email as customerEmail,
        c.address as customerAddress,
        rr.id as repairRequestId,
        rr.reportedProblem as problemDescription,
        rr.createdAt as repairCreatedAt,
        d.deviceType,
        d.model as deviceModel,
        COALESCE(vo.label, d.brand) as deviceBrand,
        d.serialNumber as deviceSerial,
        u.name as technicianName,
        (SELECT paymentMethod FROM Payment WHERE invoiceId = i.id ORDER BY createdAt DESC LIMIT 1) as paymentMethod,
        COALESCE((SELECT SUM(amount) FROM Payment WHERE invoiceId = i.id), 0) as totalPaid
      FROM Invoice i
      LEFT JOIN RepairRequest rr ON i.repairRequestId = rr.id
      LEFT JOIN Customer c ON COALESCE(rr.customerId, i.customerId) = c.id
      LEFT JOIN User u ON rr.technicianId = u.id
      LEFT JOIN Device d ON rr.deviceId = d.id
      LEFT JOIN VariableOption vo ON d.brandId = vo.id
      WHERE i.id = ? AND i.deletedAt IS NULL
    `, [id]);

    if (!invoiceRows || invoiceRows.length === 0) {
      return res.status(404).send('الفاتورة غير موجودة');
    }

    const invoice = invoiceRows[0];

    // Get invoice items
    const [items] = await db.execute(`
      SELECT 
        ii.*,
        COALESCE(inv.name, s.name, ii.description, 'عنصر غير محدد') as itemName,
        COALESCE(inv.sku, CONCAT('SVC-', s.id), '') as itemCode
      FROM InvoiceItem ii
      LEFT JOIN InventoryItem inv ON ii.inventoryItemId = inv.id
      LEFT JOIN Service s ON ii.serviceId = s.id
      WHERE ii.invoiceId = ?
      ORDER BY ii.createdAt
    `, [id]);
    
    console.log(`[INVOICE PRINT] Invoice ID: ${id}, Items found: ${items.length}`);
    if (items.length > 0) {
      console.log(`[INVOICE PRINT] First item:`, items[0]);
    }

    // Calculate totals - use totalPrice if available, otherwise calculate
    let subtotal = 0;
    items.forEach(item => {
      const itemTotal = (item.totalPrice !== null && item.totalPrice !== undefined)
        ? Number(item.totalPrice)
        : ((Number(item.quantity) || 1) * (Number(item.unitPrice) || 0));
      subtotal += itemTotal;
    });
    
    // Calculate tax: use invoice taxAmount if available, otherwise calculate from items using settings
    const showTax = getSetting('financial.showTax', true);
    const taxPercent = getSetting('financial.defaultTaxPercent', 15) / 100; // Convert percentage to decimal
    
    let taxAmount = Number(invoice.taxAmount) || 0;
    if (taxAmount === 0 && subtotal > 0 && showTax) {
      taxAmount = subtotal * taxPercent;
    }
    // If tax is disabled, set to 0
    if (!showTax) {
      taxAmount = 0;
    }
    
    const discountAmount = Number(invoice.discountAmount) || 0;
    const shippingAmount = Number(invoice.shippingAmount) || 0;
    
    // Calculate final total based on settings
    const showShipping = getSetting('financial.showShipping', true);
    const total = subtotal - discountAmount + (showTax ? taxAmount : 0) + (showShipping ? shippingAmount : 0);
    
    // Calculate amount paid: use totalPaid from query if available, otherwise use invoice.amountPaid
    const amountPaid = Number(invoice.totalPaid) || Number(invoice.amountPaid) || 0;
    const remaining = total - amountPaid;

    // Status text mapping
    const statusTextMap = {
      'draft': 'مسودة',
      'sent': 'تم الإرسال',
      'paid': 'مدفوعة',
      'partially_paid': 'مدفوعة جزئياً',
      'overdue': 'متأخرة',
      'cancelled': 'ملغاة'
    };
    const statusText = statusTextMap[invoice.status] || invoice.status;

    const invoiceDate = new Date(invoice.createdAt || Date.now());
    
    // Generate repair request number if repair exists
    let repairRequestNumber = null;
    if (invoice.repairRequestId && invoice.repairCreatedAt) {
      const repairDate = new Date(invoice.repairCreatedAt);
      repairRequestNumber = `REP-${repairDate.getFullYear()}${String(repairDate.getMonth() + 1).padStart(2, '0')}${String(repairDate.getDate()).padStart(2, '0')}-${String(invoice.repairRequestId).padStart(3, '0')}`;
    }
    
    // Generate invoice number: always use INV-YYYYMMDD-XXX format (independent of repair request)
    // Invoice number is separate from repair request number
    const invoiceNumber = `INV-${invoiceDate.getFullYear()}${String(invoiceDate.getMonth() + 1).padStart(2, '0')}${String(invoiceDate.getDate()).padStart(2, '0')}-${String(invoice.id).padStart(3, '0')}`;

    // Format dates - always show only Gregorian (Miladi), ignore Hijri
    const dateDisplayMode = 'gregorian'; // Force Gregorian only
    const dates = formatDates(invoiceDate, dateDisplayMode);
    // System brand colors - defaults matching the application theme
    const systemColors = {
      primary: getSetting('colors', {}).primary || '#053887', // Brand blue
      primaryLight: '#3B82F6', // Lighter blue for gradients
      success: '#10B981', // Green for success states
      secondary: getSetting('colors', {}).secondary || '#475569',
      border: getSetting('colors', {}).border || '#E5E7EB',
      textPrimary: getSetting('colors', {}).primary || '#0F172A',
      textSecondary: getSetting('colors', {}).secondary || '#64748B',
      background: '#FFFFFF',
      surface: '#F9FAFB',
      surfaceLight: '#F8FAFC'
    };

    // Always show only Gregorian (Miladi) date, ignore Hijri
    const formattedDate = dates.primary;

    const html = `<!DOCTYPE html>
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
          /* Ensure colors print correctly */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          /* Remove all shadows, gradients, and simplify for print */
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
              <img src="http://localhost:3000/logo.png" alt="FixZone Logo" style="height:${getSetting('logoHeight', 60)}px; max-width:100%; object-fit:contain;" onerror="this.onerror=null; this.src='/Logo.png'; this.onerror=function(){this.style.display='none'; this.nextElementSibling.style.display='block';};" />
              <div class="logo" style="display:none;">${getSetting('showCompanyInfo', true) ? (getSetting('companyName', settings.companyName || 'FixZone')) : getSetting('title', 'فاتورة')}</div>
            </div>
            `}
          </div>
          <div class="header-bottom">
            ${getSetting('showCompanyInfo', true) ? `
            <div class="company-info">
              ${getSetting('branchAddress', getSetting('address', settings.branchAddress || settings.address || 'العنوان غير محدد'))}<br>
              ${getSetting('branchPhone', getSetting('phone', settings.branchPhone || settings.phone || '')) ? `هاتف: ${getSetting('branchPhone', getSetting('phone', settings.branchPhone || settings.phone || ''))}` : ''} ${getSetting('email', settings.email || '') ? `| بريد إلكتروني: ${getSetting('email', settings.email || '')}` : ''}
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
            ${repairRequestNumber ? `<div class="info-row"><span class="label">رقم طلب الإصلاح:</span><span class="value">${repairRequestNumber}</span></div>` : ''}
            ${getSetting('showInvoiceDate', true) ? `<div class="info-row"><span class="label">تاريخ الإصدار:</span><span class="value">${dates.primary}</span></div>` : ''}
            ${getSetting('showDueDate', true) && invoice.dueDate ? `<div class="info-row"><span class="label">تاريخ الاستحقاق:</span><span class="value">${formatDates(new Date(invoice.dueDate), 'gregorian').primary}</span></div>` : ''}
            <div class="info-row"><span class="label">الحالة:</span><span class="value">${statusText}</span></div>
          </div>
          ` : ''}
          ${getSetting('showCustomerInfo', true) ? `
          <div class="customer-details">
            <div class="section-title">بيانات العميل</div>
            <div class="info-row"><span class="label">الاسم:</span><span class="value">${invoice.customerName || 'غير محدد'}</span></div>
            <div class="info-row"><span class="label">الهاتف:</span><span class="value">${invoice.customerPhone || 'غير محدد'}</span></div>
            ${invoice.customerEmail ? `<div class="info-row"><span class="label">البريد:</span><span class="value">${invoice.customerEmail}</span></div>` : ''}
            ${invoice.customerAddress ? `<div class="info-row"><span class="label">العنوان:</span><span class="value">${invoice.customerAddress}</span></div>` : ''}
          </div>
          ` : ''}
        </div>

        ${(invoice.deviceType || invoice.deviceModel || invoice.deviceSerial) && getSetting('showDeviceSection', true) ? `
        <div style="margin-bottom: ${getSetting('spacing', {}).section || 16}px;">
          <div style="display: flex; flex-wrap: wrap; gap: 8px; font-size: ${getSetting('fontSize', 13)}px;">
            ${invoice.deviceType ? `<span style="color: ${systemColors.textSecondary};">نوع:</span> <span style="color: ${systemColors.textPrimary}; font-weight: 400;">${invoice.deviceType}</span>` : ''}
            ${invoice.deviceType && invoice.deviceModel ? `<span style="color: ${systemColors.border}; margin: 0 4px;">|</span>` : ''}
            ${invoice.deviceModel ? `<span style="color: ${systemColors.textSecondary};">الموديل:</span> <span style="color: ${systemColors.textPrimary}; font-weight: 400;">${invoice.deviceModel}</span>` : ''}
            ${(invoice.deviceType || invoice.deviceModel) && invoice.deviceSerial ? `<span style="color: ${systemColors.border}; margin: 0 4px;">|</span>` : ''}
            ${invoice.deviceSerial ? `<span style="color: ${systemColors.textSecondary};">السيريال:</span> <span style="color: ${systemColors.textPrimary}; font-weight: 400;">${invoice.deviceSerial}</span>` : ''}
          </div>
        </div>
        ` : ''}

        ${getSetting('showItemsTable', true) ? `
        <div class="section-title" style="margin-top: 5px; margin-bottom: 10px;">المشتريات</div>
        <table class="table">
          <thead>
            <tr>
              ${getSetting('showItemDescription', true) ? '<th>الوصف</th>' : ''}
              ${getSetting('showItemQuantity', true) ? '<th class="number">الكمية</th>' : ''}
              ${getSetting('showItemPrice', true) ? '<th class="number">سعر الوحدة</th>' : ''}
              ${getSetting('showItemDiscount', true) ? '<th class="number">الخصم</th>' : ''}
              ${getSetting('showItemTax', true) ? '<th class="number">الضريبة</th>' : ''}
              ${getSetting('showItemTotal', true) ? '<th class="number">الإجمالي</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${items.map(item => {
              // Use totalPrice if available, otherwise calculate from quantity * unitPrice
              const itemTotal = (item.totalPrice !== null && item.totalPrice !== undefined)
                ? Number(item.totalPrice)
                : ((Number(item.quantity) || 1) * (Number(item.unitPrice) || 0));
              // Calculate tax from itemTotal using settings tax percent
              const itemTax = getSetting('showItemTax', true) && showTax ? itemTotal * taxPercent : 0;
              return `
              <tr>
                ${getSetting('showItemDescription', true) ? `<td style="font-weight: 400; color: ${systemColors.textPrimary}; font-size: ${getSetting('tableFontSize', 13)}px;">${item.itemName || item.description || 'عنصر غير محدد'}${item.itemCode ? ` <span style="color: ${systemColors.textSecondary}; font-size: 11px;">(${item.itemCode})</span>` : ''}</td>` : ''}
                ${getSetting('showItemQuantity', true) ? `<td class="number">${Number(item.quantity) || 1}</td>` : ''}
                ${getSetting('showItemPrice', true) ? `<td class="number">${(Number(item.unitPrice) || 0).toFixed(getSetting('numberFormat', {}).decimalPlaces || 2)} ${getSetting('currency', {}).showSymbol ? (getSetting('currency', {}).symbolPosition === 'before' ? 'ج.م ' : '') : ''}${getSetting('currency', {}).showSymbol && getSetting('currency', {}).symbolPosition === 'after' ? ' ج.م' : ''}</td>` : ''}
                ${getSetting('showItemDiscount', true) ? `<td class="number">-</td>` : ''}
                ${getSetting('showItemTax', true) ? `<td class="number">${itemTax.toFixed(getSetting('numberFormat', {}).decimalPlaces || 2)} ${getSetting('currency', {}).showSymbol ? (getSetting('currency', {}).symbolPosition === 'before' ? 'ج.م ' : '') : ''}${getSetting('currency', {}).showSymbol && getSetting('currency', {}).symbolPosition === 'after' ? ' ج.م' : ''}</td>` : ''}
                ${getSetting('showItemTotal', true) ? `<td class="number" style="font-weight: 500;">${itemTotal.toFixed(getSetting('numberFormat', {}).decimalPlaces || 2)} ${getSetting('currency', {}).showSymbol ? (getSetting('currency', {}).symbolPosition === 'before' ? 'ج.م ' : '') : ''}${getSetting('currency', {}).showSymbol && getSetting('currency', {}).symbolPosition === 'after' ? ' ج.م' : ''}</td>` : ''}
              </tr>
            `;
            }).join('')}
            ${items.length === 0 ? `<tr><td colspan="${[getSetting('showItemDescription', true), getSetting('showItemQuantity', true), getSetting('showItemPrice', true), getSetting('showItemDiscount', true), getSetting('showItemTax', true), getSetting('showItemTotal', true)].filter(Boolean).length}" style="text-align:center; color:${systemColors.textSecondary};">لا توجد عناصر في الفاتورة</td></tr>` : ''}
          </tbody>
        </table>
        ` : ''}

        <div class="totals">
          <table class="totals-table">
            ${getSetting('showSubtotal', true) ? `
            <tr>
              <td>المجموع الفرعي:</td>
              <td class="number">${subtotal.toFixed(getSetting('numberFormat', {}).decimalPlaces || 2)} ${getSetting('currency', {}).showSymbol ? (getSetting('currency', {}).symbolPosition === 'before' ? 'ج.م ' : '') : ''}${getSetting('currency', {}).showSymbol && getSetting('currency', {}).symbolPosition === 'after' ? ' ج.م' : ''}</td>
            </tr>
            ` : ''}
            ${getSetting('showDiscount', true) && discountAmount > 0 ? `
            <tr>
              <td>الخصم:</td>
              <td class="number">-${discountAmount.toFixed(getSetting('numberFormat', {}).decimalPlaces || 2)} ${getSetting('currency', {}).showSymbol ? (getSetting('currency', {}).symbolPosition === 'before' ? 'ج.م ' : '') : ''}${getSetting('currency', {}).showSymbol && getSetting('currency', {}).symbolPosition === 'after' ? ' ج.م' : ''}</td>
            </tr>
            ` : ''}
            ${getSetting('financial.showTax', true) ? `
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
            <span style="font-weight:500; color:${systemColors.textPrimary}; font-size:13px;">${invoice.paymentMethod === 'cash' ? 'نقد' : invoice.paymentMethod === 'card' ? 'بطاقة' : invoice.paymentMethod === 'bank_transfer' ? 'تحويل بنكي' : invoice.paymentMethod === 'check' ? 'شيك' : invoice.paymentMethod || 'نقد'}</span>
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
          شكراً لثقتكم بنا | ${getSetting('companyName', settings.companyName || 'FixZone')}
          ${getSetting('footerText', '') ? `<br>${getSetting('footerText', '')}` : ''}
        </div>
        ` : ''}

        <div class="no-print" style="text-align:center; margin-top:30px; padding:20px; background:${systemColors.surface}; border-radius:12px; border:1px solid ${systemColors.border};">
          <div style="display:flex; gap:12px; justify-content:center; flex-wrap:wrap;">
            <button onclick="window.print()" style="padding:14px 32px; border:none; border-radius:6px; background:${systemColors.primary}; color:#fff; cursor:pointer; font-size:15px; font-weight:500;">
              🖨️ طباعة الفاتورة
            </button>
            <button onclick="window.close()" style="padding:14px 32px; border:1px solid ${systemColors.border}; border-radius:10px; background:${systemColors.background}; color:${systemColors.textPrimary}; cursor:pointer; font-size:15px; font-weight:600; transition: all 0.2s ease;" onmouseover="this.style.background=systemColors.surfaceLight;" onmouseout="this.style.background='${systemColors.background}';">
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
              var qrUrl = frontendUrl + '/invoices/${id}';
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
    console.error('Invoice ID:', id);
    res.status(500).send(`<html dir="rtl"><body><h1>خطأ في الخادم</h1><p>${err.message || 'حدث خطأ أثناء الطباعة'}</p><pre>${err.stack || ''}</pre></body></html>`);
  }
});

// Repair-related invoice routes (MUST come before /:id routes)
router.get('/by-repair/:repairId', validate(Joi.object({ repairId: commonSchemas.id }), 'params'), invoicesController.getInvoiceByRepairId);
router.post('/create-from-repair/:repairId', validate(Joi.object({ repairId: commonSchemas.id }), 'params'), invoicesController.createInvoiceFromRepair);

// GET /api/invoices/:id - Get single invoice by ID
router.get('/:id', validate(Joi.object({ id: commonSchemas.id }), 'params'), invoicesController.getInvoiceById);

// POST /api/invoices - Create new invoice
router.post('/', validate(invoiceSchemas.createInvoice), invoicesController.createInvoice);

// PUT /api/invoices/:id - Update invoice
router.put('/:id', validate(Joi.object({ id: commonSchemas.id }), 'params'), validate(invoiceSchemas.updateInvoice, 'body'), invoicesController.updateInvoice);

// DELETE /api/invoices/:id - Delete invoice
router.delete('/:id', validate(Joi.object({ id: commonSchemas.id }), 'params'), invoicesController.deleteInvoice);

// POST /api/invoices/:id/recalculate - Recalculate invoice totalAmount from items
router.post('/:id/recalculate', validate(Joi.object({ id: commonSchemas.id }), 'params'), async (req, res) => {
  try {
    const { id } = req.params;
    const db = require('../db');
    
    // Recalculate totalAmount from InvoiceItems
    const [itemsTotal] = await db.execute(`
      SELECT COALESCE(SUM(totalPrice), 0) as calculatedTotal
      FROM InvoiceItem 
      WHERE invoiceId = ?
    `, [id]);
    
    const calculatedTotal = Number(itemsTotal[0]?.calculatedTotal || 0);
    
    // Update invoice totalAmount
    await db.execute(`
      UPDATE Invoice SET totalAmount = ?, updatedAt = NOW() WHERE id = ?
    `, [calculatedTotal, id]);
    
    res.json({
      success: true,
      message: 'تم إعادة حساب المجموع بنجاح',
      data: {
        invoiceId: id,
        oldTotal: null, // We don't fetch it to avoid extra query
        newTotal: calculatedTotal
      }
    });
  } catch (error) {
    console.error('Error recalculating invoice total:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      details: error.message
    });
  }
});

// Invoice Items routes
router.get('/:id/items', validate(Joi.object({ id: commonSchemas.id }), 'params'), invoicesController.getInvoiceItems);
router.post('/:id/items', validate(Joi.object({ id: commonSchemas.id }), 'params'), validate(invoiceSchemas.addInvoiceItem, 'body'), invoicesController.addInvoiceItem);
router.put('/:id/items/:itemId', validate(Joi.object({ id: commonSchemas.id, itemId: commonSchemas.id }), 'params'), validate(invoiceSchemas.updateInvoiceItem, 'body'), invoicesController.updateInvoiceItem);
router.delete('/:id/items/:itemId', validate(Joi.object({ id: commonSchemas.id, itemId: commonSchemas.id }), 'params'), invoicesController.removeInvoiceItem);

module.exports = router;
