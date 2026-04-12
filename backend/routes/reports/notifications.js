const express = require('express');
const router = express.Router();
const { Report, Client, auth, Notifier } = require('./_shared');

// POST /reports/:id/share/whatsapp - share report via WhatsApp
router.post('/:id/share/whatsapp', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    const report = await Report.findByPk(id, {
      include: [{ model: Client, as: 'client', attributes: ['id', 'name', 'phone', 'email'] }]
    });

    if (!report) {
      return res.status(404).json({ message: 'التقرير غير موجود' });
    }

    const phone = report.client_phone || report.client?.phone;
    if (!phone) {
      return res.status(400).json({ message: 'رقم الهاتف غير متوفر للعميل' });
    }

    if (!message) {
      return res.status(400).json({ message: 'الرسالة مطلوبة' });
    }

    await Notifier.sendText(phone, message);
    res.json({ success: true, message: 'Message sent successfully' });

  } catch (error) {
    console.error('Error sharing report via WhatsApp:', error);
    res.status(500).json({ message: 'Sharing failed', error: error.message });
  }
});

module.exports = router;
