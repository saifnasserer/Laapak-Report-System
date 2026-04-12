const express = require('express');
const router = express.Router();
const { 
  Report, Client, ReportTechnicalTest, Invoice, InvoiceItem, 
  auth, Op, Sequelize, sequelize, 
  REPORT_BASE_ATTRIBUTES, checkDeviceSpecColumnsExist, Notifier 
} = require('./_shared');
const { notifySubscribers } = require('../../utils/webhook-dispatcher');

// GET /reports - List all reports with complex filtering
router.get('/', async (req, res) => {
  const { id } = req.query;
  
  if (id) {
    try {
      const reportInstance = await Report.findByPk(id, {
        attributes: REPORT_BASE_ATTRIBUTES,
        include: [
          {
            model: Client,
            as: 'client',
            attributes: ['id', 'name', 'phone', 'email', 'address', 'orderCode'],
          },
          {
            model: ReportTechnicalTest,
            as: 'technical_tests',
            attributes: ['componentName', 'status', 'notes', 'type', 'icon'],
          },
          {
            model: InvoiceItem,
            as: 'invoiceItems',
            attributes: ['cost_price', 'totalAmount']
          }
        ],
      });

      if (!reportInstance) {
        return res.status(404).json({ error: 'Report not found' });
      }

      const responseData = {
        report: {
          id: reportInstance.id,
          client_name: reportInstance.client_name,
          order_number: reportInstance.order_number,
          inspection_date: reportInstance.inspection_date,
          device_model: reportInstance.device_model,
          device_serial: reportInstance.serial_number,
          cpu: reportInstance.cpu || null,
          gpu: reportInstance.gpu || null,
          ram: reportInstance.ram || null,
          storage: reportInstance.storage || null,
          device_price: reportInstance.device_price || 0,
          status_badge: reportInstance.status,
          external_images: reportInstance.external_images,
          hardware_status: reportInstance.hardware_status,
          notes: reportInstance.notes,
          client: reportInstance.client ? reportInstance.client.toJSON() : null,
          supplier_id: reportInstance.supplier_id || null,
        },
        technical_tests: reportInstance.technical_tests ? reportInstance.technical_tests.map(tt => tt.toJSON()) : []
      };

      return res.json(responseData);
    } catch (error) {
      console.error(`Failed to fetch report with ID ${id}:`, error);
      return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }

  // Fetch all reports logic
  try {
    const whereConditions = [];

    if (req.query.billing_enabled !== undefined) {
      const beParam = req.query.billing_enabled.toString().toLowerCase();
      if (beParam === 'false' || beParam === '0') {
        whereConditions.push({ billing_enabled: false });
      } else if (beParam === 'true' || beParam === '1') {
        whereConditions.push({ billing_enabled: true });
      }
    }

    if (req.query.startDate || req.query.endDate) {
      const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
      const endDate = req.query.endDate ? new Date(req.query.endDate + 'T23:59:59') : null;

      let inspectionDateCondition = {};
      if (startDate && endDate) {
        inspectionDateCondition = { [Op.between]: [startDate, endDate] };
      } else if (startDate) {
        inspectionDateCondition = { [Op.gte]: startDate };
      } else if (endDate) {
        inspectionDateCondition = { [Op.lte]: endDate };
      }

      let createdDateCondition = {};
      if (startDate && endDate) {
        createdDateCondition = { [Op.between]: [startDate, endDate] };
      } else if (startDate) {
        createdDateCondition = { [Op.gte]: startDate };
      } else if (endDate) {
        createdDateCondition = { [Op.lte]: endDate };
      }

      const pendingStatusCondition = {
        [Op.or]: [
          { status: 'قيد الانتظار' }, { status: 'pending' }, { status: 'active' },
          { status: 'new_order' }, { status: 'shipping' }, { status: null }
        ]
      };

      const completedStatusCondition = {
        [Op.or]: [
          { status: 'مكتمل' }, { status: 'completed' }, { status: 'ملغي' },
          { status: 'ملغى' }, { status: 'cancelled' }, { status: 'canceled' }
        ]
      };

      const dateRangeCondition = {
        [Op.or]: [
          { inspection_date: inspectionDateCondition },
          {
            [Op.and]: [
              { inspection_date: { [Op.is]: null } },
              { created_at: createdDateCondition }
            ]
          }
        ]
      };

      whereConditions.push({
        [Op.and]: [
          { [Op.or]: [pendingStatusCondition, completedStatusCondition] },
          dateRangeCondition
        ]
      });
    }

    if (req.query.client_id) {
      whereConditions.push({ client_id: req.query.client_id });
    }

    if (req.query.status) {
      whereConditions.push({ status: req.query.status });
    }

    if (req.query.fetch_mode !== 'all_reports') {
      whereConditions.push({
        id: {
          [Op.notIn]: [
            Sequelize.literal(`SELECT report_id FROM invoice_reports WHERE report_id IS NOT NULL`)
          ]
        }
      });
    }

    if (req.query.exclude_inventory === 'true') {
      whereConditions.push({
        [Op.and]: [
          { client_name: { [Op.notLike]: '%Laapak%' } },
          { client_name: { [Op.notLike]: '%لاباك%' } }
        ]
      });
    }

    const whereClause = whereConditions.length > 0 ? { [Op.and]: whereConditions } : {};

    const reports = await Report.findAll({
      where: whereClause,
      attributes: REPORT_BASE_ATTRIBUTES,
      include: [
        {
          model: Client,
          as: 'client',
          attributes: ['id', 'name', 'phone', 'email', 'orderCode'],
        },
        {
          model: Invoice,
          as: 'relatedInvoices',
          through: { attributes: [] },
          attributes: ['id', 'total', 'paymentStatus'],
          required: false
        },
        {
          model: InvoiceItem,
          as: 'invoiceItems',
          attributes: ['cost_price', 'totalAmount']
        }
      ],
      order: [
        [sequelize.literal('COALESCE(`Report`.`inspection_date`, `Report`.`created_at`)'), 'DESC']
      ]
    });

    const mappedReports = reports.map(r => {
      const report = r.toJSON();
      return {
        ...report,
        device_price: report.device_price || 0
      };
    });

    res.json(mappedReports);
  } catch (error) {
    console.error('Failed to fetch all reports:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// GET /reports/:id - Get single report by ID
router.get('/:id', async (req, res) => {
  try {
    const report = await Report.findByPk(req.params.id, {
      attributes: REPORT_BASE_ATTRIBUTES,
      include: [
        {
          model: Client,
          as: 'client',
          attributes: ['id', 'name', 'phone', 'email', 'address', 'orderCode'],
        },
        {
          model: Invoice,
          as: 'relatedInvoices',
          through: { attributes: [] },
          attributes: ['id', 'total', 'paymentStatus', 'paymentMethod', 'date'],
          required: false
        },
        {
          model: InvoiceItem,
          as: 'invoiceItems',
          attributes: ['cost_price', 'totalAmount']
        }
      ],
    });
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const reportData = report.toJSON ? report.toJSON() : report;
    reportData.device_price = reportData.device_price || 0;

    res.json({ success: true, report: reportData });
  } catch (error) {
    console.error('Failed to fetch report:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// POST /reports - Create new report
router.post('/', async (req, res) => {
  try {
    if (req.body.client_id && req.body.device_model) {
      const reportData = { ...req.body };
      const hasDeviceSpecColumns = await checkDeviceSpecColumnsExist();

      if (!hasDeviceSpecColumns) {
        ['cpu', 'gpu', 'ram', 'storage'].forEach(field => delete reportData[field]);
      }

      if (!reportData.id) {
        reportData.id = 'RPT' + Date.now() + Math.floor(Math.random() * 1000);
      }

      const newReport = await Report.create(reportData);
      
      notifySubscribers('report.created', {
        report_id: newReport.id,
        client_name: newReport.client_name,
        status: newReport.status,
        source: 'Manual (Direct)'
      });

      res.status(201).json(newReport);
    } else {
      const { clientId, title, description, data } = req.body;
      if (!clientId || !title) {
        return res.status(400).json({ error: 'clientId and title are required' });
      }

      const reportId = 'RPT' + Date.now() + Math.floor(Math.random() * 1000);
      const newReport = await Report.create({
        id: reportId,
        clientId,
        title,
        description,
        data,
      });

      notifySubscribers('report.created', {
        report_id: newReport.id,
        client_id: clientId,
        status: newReport.status,
        source: 'Manual (Legacy)'
      });

      res.status(201).json(newReport);
    }
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// PUT /reports/:id - Update report
router.put('/:id', auth, async (req, res) => {
  try {
    const report = await Report.findByPk(req.params.id, {
      attributes: REPORT_BASE_ATTRIBUTES,
      include: [{ model: Client, as: 'client', attributes: ['phone'] }]
    });
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const oldStatus = report.status;

    // Status normalization
    if (req.body.status !== undefined) {
      const statusMap = {
        'مكتمل': 'completed', 'قيد الانتظار': 'pending', 'ملغي': 'cancelled',
        'ملغى': 'cancelled', 'قيد المعالجة': 'pending', 'شحن': 'shipped',
        'تم الشحن': 'shipped', 'completed': 'completed', 'pending': 'pending',
        'shipped': 'shipped', 'cancelled': 'cancelled', 'canceled': 'cancelled',
        'active': 'pending', 'in-progress': 'pending'
      };
      
      const englishStatus = statusMap[req.body.status];
      if (englishStatus) req.body.status = englishStatus;
    }

    // Auto-transition from new_order
    if (report.status === 'new_order' && !req.body.status) {
      const triggers = ['device_brand', 'device_model', 'serial_number', 'cpu', 'gpu', 'ram', 'storage', 'hardware_status'];
      if (triggers.some(field => req.body[field] !== undefined)) {
        req.body.status = 'pending';
      }
    }

    const baseFields = [
      'client_id', 'client_name', 'client_phone', 'client_email', 'client_address',
      'order_number', 'device_model', 'serial_number',
      'inspection_date', 'hardware_status', 'external_images', 'invoice_items', 'notes', 
      'billing_enabled', 'amount', 'device_price', 'status', 'tracking_code', 'tracking_method',
      'created_at', 'updated_at', 'supplier_id', 'update_history',
      'is_confirmed', 'payment_method', 'selected_accessories', 'invoice_id', 'invoice_created', 'invoice_date'
    ];

    const updateData = {};
    baseFields.forEach(field => {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
    });

    const hasSpecs = await checkDeviceSpecColumnsExist();
    if (hasSpecs) {
      ['cpu', 'gpu', 'ram', 'storage'].forEach(field => {
        if (req.body[field] !== undefined) updateData[field] = req.body[field];
      });
    }

    if (req.body.update_description) {
      let history = [];
      try {
        if (report.update_history) {
          history = typeof report.update_history === 'string' ? JSON.parse(report.update_history) : report.update_history;
        }
      } catch (e) {}
      
      history.push({
        timestamp: new Date(),
        description: req.body.update_description,
        admin_id: req.user.id,
        status_at_update: req.body.status || report.status
      });
      updateData.update_history = history;
    }

    await report.update(updateData);

    notifySubscribers('report.updated', {
      report_id: report.id,
      client_name: report.client_name,
      status: report.status,
      old_status: oldStatus
    });

    // Invoice Sync & WhatsApp Notification
    const normalize = (s) => {
      if (!s) return '';
      const map = {
        'مكتمل': 'completed', 'قيد الانتظار': 'pending', 'ملغي': 'cancelled',
        'ملغى': 'cancelled', 'cancelled': 'cancelled', 'شحن': 'shipped',
        'تم الشحن': 'shipped', 'shipped': 'shipped'
      };
      return map[s] || s.toLowerCase();
    };

    const normNew = normalize(req.body.status);
    const normOld = normalize(oldStatus);

    if (normNew && normNew !== normOld) {
      if (normNew === 'shipped') {
        const phone = report.client_phone || report.client?.phone;
        if (phone) {
          const link = `https://reports.laapak.com/ar/reports/${report.id}`;
          const msg = `تم تسليم طلبك لشركة الشحن، يمكنك متابعته من خلال صفحة التقرير:\n${link}`;
          await Notifier.sendText(phone, msg).catch(e => console.error('WA Error:', e));
        }
      }

      let invStatus = null;
      if (normNew === 'completed') invStatus = 'completed';
      else if (normNew === 'cancelled') invStatus = 'cancelled';
      else if (normNew === 'pending') invStatus = 'pending';

      if (invStatus) {
        const invItems = await InvoiceItem.findAll({ where: { report_id: report.id }, attributes: ['invoiceId'] });
        const invIds = [...new Set([...invItems.map(i => i.invoiceId), report.invoice_id].filter(id => id))];
        
        if (invIds.length > 0) {
          const invoices = await Invoice.findAll({ where: { id: { [Op.in]: invIds } } });
          for (const inv of invoices) {
            const prev = inv.paymentStatus;
            if (prev !== invStatus) {
              await inv.update({
                paymentStatus: invStatus,
                paymentMethod: invStatus === 'completed' ? (req.body.paymentMethod || 'cash') : inv.paymentMethod
              });
              if (invStatus === 'completed' && prev !== 'completed') await Invoice.recordPayment(inv.id, inv.paymentMethod, req.user.id);
              if (prev === 'completed' && invStatus !== 'completed') await Invoice.revertPayment(inv.id, req.user.id);
            }
          }
        }
      }
    }

    res.json({ message: 'Report updated successfully', report });
  } catch (error) {
    console.error('Update failed:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// DELETE /reports/:id - Delete report
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Report.destroy({ where: { id: req.params.id } });
    if (deleted === 0) return res.status(404).json({ error: 'Report not found' });
    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Delete failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
