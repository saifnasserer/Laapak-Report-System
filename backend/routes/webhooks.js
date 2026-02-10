const express = require('express');
const router = express.Router();
const { Report, Client, WebhookLog } = require('../models');
const { Op } = require('sequelize');

/**
 * @route   POST api/webhooks/woocommerce/order-created
 * @desc    Handle WooCommerce Order Created webhook
 * @access  Public (Should be secured with Secret verification in production)
 */
router.post('/woocommerce/order-created', async (req, res) => {
    let webhookLog;
    try {
        // Create initial log
        webhookLog = await WebhookLog.create({
            source: 'WooCommerce',
            event: 'order.created',
            payload: req.body,
            ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            status: 'success'
        });

        const secret = req.headers['x-webhook-secret'];
        if (secret !== 'laapak_woo_2026_webhook_sec') {
            console.error('Webhook Error: Unauthorized access attempt');
            await webhookLog.update({ status: 'error', errorMessage: 'Unauthorized: Invalid secret' });
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        const orderData = req.body;
        console.log('Received WooCommerce Webhook:', JSON.stringify(orderData, null, 2));

        const { id: wooOrderId, billing, line_items } = orderData;

        if (!billing || !billing.phone) {
            console.error('Webhook Error: Billing information or phone missing');
            return res.status(400).json({ success: false, error: 'Missing billing information' });
        }

        // 1. Find or Create Client
        // We try to match by phone or email
        let client = await Client.findOne({
            where: {
                [Op.or]: [
                    { phone: billing.phone },
                    { email: billing.email || 'non-existent-email@laapak.com' }
                ]
            }
        });

        if (!client) {
            console.log('Creating new client from WooCommerce billing info...');
            // Generate a random 6-character order code for client login
            const generatedOrderCode = Math.random().toString(36).substring(2, 8).toUpperCase();

            client = await Client.create({
                name: `${billing.first_name} ${billing.last_name}`.trim(),
                phone: billing.phone,
                email: billing.email || null,
                address: `${billing.address_1}${billing.address_2 ? ' ' + billing.address_2 : ''}, ${billing.city}`.trim(),
                orderCode: generatedOrderCode,
                status: 'active'
            });
        }

        // 2. Create Report with 'new_order' status
        const reportId = `EXT-${wooOrderId}-${Date.now().toString().slice(-4)}`;
        const deviceModel = line_items && line_items.length > 0 ? line_items[0].name : 'Unknown Device';
        const totalAmount = orderData.total || 0;

        console.log(`Creating report ${reportId} for WooCommerce Order #${wooOrderId} (Amount: ${totalAmount})`);

        const report = await Report.create({
            id: reportId,
            client_id: client.id,
            client_name: client.name,
            client_phone: client.phone,
            client_email: client.email,
            client_address: client.address,
            order_number: wooOrderId.toString(),
            device_model: deviceModel,
            inspection_date: new Date(),
            status: 'new_order',
            amount: totalAmount,
            notes: `Automatically created from WooCommerce Order #${wooOrderId}. Please update device specifications.`
        });

        res.status(201).json({
            success: true,
            report_id: report.id,
            client_id: client.id,
            message: 'Report created successfully'
        });
    } catch (error) {
        console.error('WooCommerce Webhook Processing Error:', error);
        if (webhookLog) {
            await webhookLog.update({
                status: 'error',
                errorMessage: error.message
            });
        }
        res.status(500).json({ success: false, error: error.message, stack: error.stack });
    }
});

module.exports = router;
