const express = require('express');
const router = express.Router();
const { 
  Report, Client, Invoice, auth, Op, 
  REPORT_BASE_ATTRIBUTES 
} = require('./_shared');

// GET /reports/me - Get reports for authenticated client
router.get('/me', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.type || (req.user.isClient ? 'client' : 'admin');

    if (userType !== 'client') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This endpoint is for clients only.'
      });
    }

    const clientId = userId;
    if (!clientId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication error: Client ID missing.'
      });
    }

    const whereClause = { client_id: clientId };

    if (req.query.status) {
      whereClause.status = req.query.status;
    }

    if (req.query.deviceModel) {
      whereClause.device_model = { [Op.like]: `%${req.query.deviceModel}%` };
    }

    if (req.query.startDate || req.query.endDate) {
      const dateCondition = {};
      if (req.query.startDate) {
        dateCondition[Op.gte] = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        const endDate = new Date(req.query.endDate);
        if (!req.query.endDate.includes('T')) {
          endDate.setHours(23, 59, 59, 999);
        }
        dateCondition[Op.lte] = endDate;
      }
      whereClause.inspection_date = dateCondition;
    }

    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = parseInt(req.query.offset) || 0;
    const sortBy = req.query.sortBy || 'created_at';
    const sortOrder = (req.query.sortOrder || 'DESC').toUpperCase();
    const validSortFields = ['created_at', 'inspection_date', 'status', 'device_model'];
    const validSortOrder = ['ASC', 'DESC'];

    const finalSortBy = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const finalSortOrder = validSortOrder.includes(sortOrder) ? sortOrder : 'DESC';

    const total = await Report.count({ where: whereClause });

    const reports = await Report.findAll({
      where: whereClause,
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
          attributes: ['id', 'total', 'paymentStatus'],
          required: false
        }
      ],
      order: [[finalSortBy, finalSortOrder]],
      limit: limit,
      offset: offset,
    });

    const formattedReports = reports.map(report => {
      const reportData = report.toJSON ? report.toJSON() : report;
      return {
        id: reportData.id,
        device_model: reportData.device_model,
        serial_number: reportData.serial_number,
        inspection_date: reportData.inspection_date,
        hardware_status: reportData.hardware_status,
        external_images: reportData.external_images,
        notes: reportData.notes,
        status: reportData.status,
        billing_enabled: reportData.billing_enabled,
        amount: reportData.amount ? reportData.amount.toString() : '0.00',
        invoice_created: reportData.invoice_created || (reportData.relatedInvoices && reportData.relatedInvoices.length > 0),
        invoice_id: reportData.invoice_id || (reportData.relatedInvoices && reportData.relatedInvoices.length > 0 ? reportData.relatedInvoices[0].id : null),
        created_at: reportData.created_at
      };
    });

    res.json({
      success: true,
      reports: formattedReports,
      pagination: {
        total: total,
        limit: limit,
        offset: offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error) {
    console.error('Failed to fetch reports for client:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /reports/client/me - get reports for client context
router.get('/client/me', auth, async (req, res) => {
  try {
    let clientId;
    const isClient = req.user.type === 'client' || req.user.isClient;
    const isAdmin = req.user.type === 'admin' || req.user.isAdmin;

    if (isAdmin && req.query.client_id) {
      clientId = req.query.client_id;
    } else if (isClient) {
      clientId = req.user.id;
    } else {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const reports = await Report.findAll({
      where: { client_id: clientId },
      attributes: REPORT_BASE_ATTRIBUTES,
      include: [
        {
          model: Client,
          as: 'client',
          attributes: ['id', 'name', 'phone', 'email', 'address', 'orderCode'],
        },
      ],
      order: [['inspection_date', 'DESC']],
    });

    res.json({ success: true, data: reports || [] });
  } catch (error) {
    console.error('Failed to fetch reports for client context:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /reports/:id/confirm - client confirms report
router.put('/:id/confirm', auth, async (req, res) => {
  try {
    const report = await Report.findByPk(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'التقرير غير موجود' });
    }

    const { selectedAccessories, paymentMethod } = req.body;
    await report.update({
      is_confirmed: true,
      selected_accessories: selectedAccessories || [],
      payment_method: paymentMethod || null
    });

    res.json({
      message: 'تم تأكيد الطلب بنجاح',
      is_confirmed: true,
      selected_accessories: selectedAccessories || [],
      payment_method: paymentMethod || null
    });
  } catch (error) {
    console.error('Error confirming report:', error);
    res.status(500).json({ message: 'حدث خطأ أثناء تأكيد الطلب', error: error.message });
  }
});

module.exports = router;
