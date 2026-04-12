const express = require('express');
const router = express.Router();
const { 
  Report, Client, Setting, auth, Op, 
  REPORT_BASE_ATTRIBUTES, Notifier 
} = require('./_shared');

// GET /reports/insights/warranty-alerts - get warranty alerts
router.get('/insights/warranty-alerts', auth, async (req, res) => {
  try {
    const currentDate = new Date();
    const sevenDaysFromNow = new Date(currentDate);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const reports = await Report.findAll({
      attributes: REPORT_BASE_ATTRIBUTES,
      include: [
        {
          model: Client,
          as: 'client',
          attributes: ['id', 'name', 'phone', 'email', 'address', 'orderCode']
        }
      ],
      order: [['inspection_date', 'DESC']]
    });

    const warrantyAlerts = [];

    reports.forEach(report => {
      const inspectionDate = new Date(report.inspection_date);
      const maintenance6MonthsEnd = new Date(inspectionDate);
      maintenance6MonthsEnd.setMonth(maintenance6MonthsEnd.getMonth() + 6);

      const maintenance12MonthsEnd = new Date(inspectionDate);
      maintenance12MonthsEnd.setFullYear(maintenance12MonthsEnd.getFullYear() + 1);

      const maintenanceWarranties = [
        { type: 'maintenance_6months', endDate: maintenance6MonthsEnd, days: 180 },
        { type: 'maintenance_12months', endDate: maintenance12MonthsEnd, days: 365 }
      ];

      maintenanceWarranties.forEach(warranty => {
        if (warranty.endDate >= currentDate && warranty.endDate <= sevenDaysFromNow) {
          const daysRemaining = Math.ceil((warranty.endDate - currentDate) / (1000 * 60 * 60 * 24));
          const alertKey = warranty.type === 'maintenance_12months' ? 'annual' : 'six_month';
          const sentDate = report.warranty_alerts_log ? report.warranty_alerts_log[alertKey] : null;

          warrantyAlerts.push({
            client_id: report.client_id,
            client_name: report.client_name,
            client_phone: report.client_phone,
            device_model: report.device_model,
            serial_number: report.serial_number,
            inspection_date: report.inspection_date,
            warranty_type: warranty.type,
            warranty_end_date: warranty.endDate,
            days_remaining: daysRemaining,
            report_id: report.id,
            sent_at: sentDate,
            is_sent: !!sentDate
          });
        }
      });
    });

    warrantyAlerts.sort((a, b) => a.days_remaining - b.days_remaining);
    res.json(warrantyAlerts);
  } catch (error) {
    console.error('Error getting warranty alerts:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /reports/:id/send-warranty-reminder - manually send warranty reminder
router.post('/:id/send-warranty-reminder', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { warranty_type, message: customMessage } = req.body;

    if (!warranty_type || !['maintenance_6months', 'maintenance_12months'].includes(warranty_type)) {
      return res.status(400).json({ message: 'Invalid warranty_type. Must be maintenance_6months or maintenance_12months' });
    }

    const report = await Report.findByPk(id, {
      include: [{
        model: Client,
        as: 'client',
        attributes: ['id', 'name', 'phone', 'email', 'address', 'orderCode']
      }]
    });

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    const phone = report.client_phone || report.client?.phone;
    if (!phone) {
      return res.status(400).json({ message: 'No phone number found for this client' });
    }

    let finalMessage = customMessage;

    if (!finalMessage) {
      const settings = await Setting.findAll({
        where: {
          key: ['template_warranty_alert_6m', 'template_warranty_alert_12m']
        }
      });

      const templates = {};
      settings.forEach(s => {
        templates[s.key] = s.value;
      });

      const inspectionDate = new Date(report.inspection_date);
      let warrantyEndDate;
      let wTypeArabic;
      let templateKey;

      if (warranty_type === 'maintenance_6months') {
        warrantyEndDate = new Date(inspectionDate);
        warrantyEndDate.setMonth(warrantyEndDate.getMonth() + 6);
        wTypeArabic = 'صيانة كل 6 أشهر';
        templateKey = 'template_warranty_alert_6m';
      } else {
        warrantyEndDate = new Date(inspectionDate);
        warrantyEndDate.setFullYear(warrantyEndDate.getFullYear() + 1);
        wTypeArabic = 'صيانة سنوية';
        templateKey = 'template_warranty_alert_12m';
      }

      const warrantyDateStr = warrantyEndDate.toISOString().split('T')[0];
      let template = templates[templateKey];

      if (template) {
        finalMessage = template
          .replace(/{{client_name}}/g, report.client_name || 'عميلنا العزيز')
          .replace(/{{device_model}}/g, report.device_model)
          .replace(/{{warranty_date}}/g, warrantyDateStr);
      } else {
        finalMessage = `🛠️ *تذكير بالصيانة المجانية*\n\n` +
          `أهلاً ${report.client_name || 'عميلنا العزيز'}،\n\n` +
          `نود تذكيركم بموعد *${wTypeArabic}* لجهازكم (*${report.device_model}*) في تاريخ *${warrantyDateStr}*.\n\n` +
          `يرجى العلم أن لديكم مهلة أسبوع قبل أو بعد هذا التاريخ للاستفادة من الصيانة المجانية، بعد ذلك سيتم احتساب رسوم على الصيانة.\n\n` +
          `يرجى التواصل معنا لترتيب الموعد.\n\n` +
          `_مع تحيات فريق عمل لابك_`;
      }
    }

    const result = await Notifier.sendText(phone, finalMessage);

    const alertKey = warranty_type === 'maintenance_12months' ? 'annual' : 'six_month';
    const alertsLog = report.warranty_alerts_log || {};
    alertsLog[alertKey] = new Date().toISOString();

    await report.update({ warranty_alerts_log: alertsLog });

    res.json({
      message: 'Warranty reminder sent successfully',
      sent_to: phone,
      sent_at: alertsLog[alertKey]
    });

  } catch (error) {
    console.error('Error sending warranty reminder:', error);
    res.status(500).json({
      message: 'Failed to send reminder',
      error: error.message,
      details: error.response?.data || null
    });
  }
});

module.exports = router;
