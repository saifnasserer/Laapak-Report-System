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

// --- Outgoing Webhook Subscriptions ---

// GET All Outgoing Webhooks (admin only)
router.get('/webhooks/outgoing', adminAuth, async (req, res) => {
    try {
        const { OutgoingWebhook } = require('../models');
        const webhooks = await OutgoingWebhook.findAll({
            order: [['created_at', 'DESC']]
        });
        res.json(webhooks);
    } catch (error) {
        console.error('Get outgoing webhooks error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// CREATE Outgoing Webhook (superadmin only)
router.post('/webhooks/outgoing', adminRoleAuth(['superadmin']), async (req, res) => {
    try {
        const { OutgoingWebhook } = require('../models');
        const { url, name, events, status } = req.body;

        if (!url) return res.status(400).json({ message: 'URL is required' });

        const webhook = await OutgoingWebhook.create({
            url,
            name: name || 'Custom Webhook',
            events: events || ['report.created'],
            status: status || 'active'
        });

        res.status(201).json(webhook);
    } catch (error) {
        console.error('Create outgoing webhook error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// UPDATE Outgoing Webhook (superadmin only)
router.put('/webhooks/outgoing/:id', adminRoleAuth(['superadmin']), async (req, res) => {
    try {
        const { OutgoingWebhook } = require('../models');
        const { url, name, events, status, secret } = req.body;

        const webhook = await OutgoingWebhook.findByPk(req.params.id);
        if (!webhook) return res.status(404).json({ message: 'Webhook not found' });

        await webhook.update({
            url: url !== undefined ? url : webhook.url,
            name: name !== undefined ? name : webhook.name,
            events: events !== undefined ? events : webhook.events,
            status: status !== undefined ? status : webhook.status,
            secret: secret !== undefined ? secret : webhook.secret
        });

        res.json(webhook);
    } catch (error) {
        console.error('Update outgoing webhook error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE Outgoing Webhook (superadmin only)
router.delete('/webhooks/outgoing/:id', adminRoleAuth(['superadmin']), async (req, res) => {
    try {
        const { OutgoingWebhook } = require('../models');
        const webhook = await OutgoingWebhook.findByPk(req.params.id);
        if (!webhook) return res.status(404).json({ message: 'Webhook not found' });

        await webhook.destroy();
        res.json({ message: 'Webhook deleted successfully' });
    } catch (error) {
        console.error('Delete outgoing webhook error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// TEST Outgoing Webhook (admin only)
router.post('/webhooks/outgoing/:id/test', adminAuth, async (req, res) => {
    try {
        const { OutgoingWebhook } = require('../models');
        const { dispatchWebhook } = require('../utils/webhook-dispatcher');

        const webhook = await OutgoingWebhook.findByPk(req.params.id);
        if (!webhook) return res.status(404).json({ message: 'Webhook not found' });

        const testPayload = {
            event: 'webhook.test',
            timestamp: new Date(),
            message: 'This is a test notification from Laapak Report System',
            webhook_id: webhook.id
        };

        const result = await dispatchWebhook(webhook, 'webhook.test', testPayload);

        res.json({
            success: result.success,
            response_code: result.responseCode,
            message: result.success ? 'Test webhook sent successfully' : 'Test webhook failed',
            error: result.error
        });
    } catch (error) {
        console.error('Test outgoing webhook error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// GET Outgoing Webhook Logs (admin only)
router.get('/webhooks/outgoing/:id/logs', adminAuth, async (req, res) => {
    try {
        const { OutgoingWebhookLog } = require('../models');
        const logs = await OutgoingWebhookLog.findAll({
            where: { webhook_id: req.params.id },
            order: [['created_at', 'DESC']],
            limit: 20
        });
        res.json(logs);
    } catch (error) {
        console.error('Get outgoing webhook logs error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
