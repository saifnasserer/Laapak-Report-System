const express = require('express');
const router = express.Router();
const { Setting } = require('../models');
const { adminAuth, adminRoleAuth } = require('../middleware/auth');

// Get all settings (admin only)
router.get('/', adminAuth, async (req, res) => {
    try {
        const settings = await Setting.findAll();
        // Convert to object for easier frontend use
        const settingsMap = {};
        settings.forEach(s => {
            let value = s.value;
            if (s.type === 'number') value = parseFloat(value);
            if (s.type === 'boolean') value = value === 'true';
            if (s.type === 'json') {
                try { value = JSON.parse(value); } catch (e) { value = {}; }
            }
            settingsMap[s.key] = value;
        });
        res.json(settingsMap);
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update multiple settings (superadmin only)
router.put('/', adminRoleAuth(['superadmin']), async (req, res) => {
    const settings = req.body; // Expecting { key: value, ... }

    try {
        const updatePromises = Object.entries(settings).map(async ([key, value]) => {
            const setting = await Setting.findOne({ where: { key } });
            if (setting) {
                let stringValue = value;
                if (setting.type === 'json') stringValue = JSON.stringify(value);
                if (setting.type === 'boolean' || setting.type === 'number') stringValue = String(value);

                setting.value = stringValue;
                await setting.save();
            }
        });

        await Promise.all(updatePromises);
        res.json({ message: 'Settings updated successfully' });
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET Webhook Logs (admin only)
router.get('/webhooks/logs', adminAuth, async (req, res) => {
    try {
        const { WebhookLog } = require('../models');
        const logs = await WebhookLog.findAll({
            order: [['created_at', 'DESC']],
            limit: 50
        });
        res.json(logs);
    } catch (error) {
        console.error('Get webhook logs error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE Webhook Log (superadmin only)
router.delete('/webhooks/logs/:id', adminRoleAuth(['superadmin']), async (req, res) => {
    try {
        const { WebhookLog } = require('../models');
        await WebhookLog.destroy({ where: { id: req.params.id } });
        res.json({ message: 'Log deleted successfully' });
    } catch (error) {
        console.error('Delete webhook log error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// CLEAR ALL Webhook Logs (superadmin only)
router.delete('/webhooks/logs', adminRoleAuth(['superadmin']), async (req, res) => {
    try {
        const { WebhookLog } = require('../models');
        await WebhookLog.destroy({ where: {}, truncate: true });
        res.json({ message: 'All logs cleared' });
    } catch (error) {
        console.error('Clear webhook logs error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
