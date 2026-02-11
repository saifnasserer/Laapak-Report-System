const axios = require('axios');
const crypto = require('crypto');
const { OutgoingWebhook } = require('../models');

/**
 * Dispatch a webhook event to all subscribed active webhooks
 * @param {string} event - Event name (e.g., 'report.created')
 * @param {object} payload - Data to send
 */
async function notifySubscribers(event, payload) {
    try {
        const webhooks = await OutgoingWebhook.findAll({
            where: { status: 'active' }
        });

        const activeSubscribers = webhooks.filter(w => {
            try {
                const events = typeof w.events === 'string' ? JSON.parse(w.events) : w.events;
                return Array.isArray(events) && events.includes(event);
            } catch (e) {
                return false;
            }
        });

        console.log(`[Webhook] Notifying ${activeSubscribers.length} subscribers for event: ${event}`);

        const promises = activeSubscribers.map(webhook => dispatchWebhook(webhook, event, payload));
        return await Promise.all(promises);
    } catch (error) {
        console.error('[Webhook] Broadcast Error:', error);
        return [];
    }
}

/**
 * Dispatch a single webhook request
 * @param {object} webhook - OutgoingWebhook instance
 * @param {string} event - Event name
 * @param {object} payload - Data to send
 */
async function dispatchWebhook(webhook, event, payload) {
    const timestamp = Date.now();
    const data = {
        event,
        timestamp,
        payload
    };

    const body = JSON.stringify(data);
    const signature = crypto
        .createHmac('sha256', webhook.secret)
        .update(body)
        .digest('hex');

    try {
        const response = await axios.post(webhook.url, data, {
            headers: {
                'Content-Type': 'application/json',
                'X-Laapak-Event': event,
                'X-Laapak-Signature': signature,
                'X-Laapak-Timestamp': timestamp.toString(),
                'User-Agent': 'Laapak-Webhook-Dispatcher/1.0'
            },
            timeout: 10000 // 10 seconds timeout
        });

        await webhook.update({
            last_triggered_at: new Date(),
            last_response_code: response.status,
            last_error_message: null
        });

        return { success: true, responseCode: response.status };
    } catch (error) {
        console.error(`[Webhook] Delivery failed to ${webhook.url}:`, error.message);

        await webhook.update({
            last_triggered_at: new Date(),
            last_response_code: error.response ? error.response.status : 0,
            last_error_message: error.message
        });

        return {
            success: false,
            responseCode: error.response ? error.response.status : 0,
            error: error.message
        };
    }
}

module.exports = {
    notifySubscribers,
    dispatchWebhook
};
