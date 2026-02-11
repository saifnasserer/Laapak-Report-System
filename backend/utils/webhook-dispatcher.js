const axios = require('axios');
const crypto = require('crypto');
const { OutgoingWebhook, OutgoingWebhookLog } = require('../models');

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
    const startTime = Date.now();
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

    let responseCode = 0;
    let responseBody = '';
    let errorMessage = null;
    let status = 'failure';

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

        responseCode = response.status;
        responseBody = JSON.stringify(response.data);
        status = 'success';

        await webhook.update({
            last_triggered_at: new Date(),
            last_response_code: responseCode,
            last_error_message: null
        });

        return { success: true, responseCode };
    } catch (error) {
        responseCode = error.response ? error.response.status : 0;
        responseBody = error.response ? JSON.stringify(error.response.data) : '';
        errorMessage = error.message;

        console.error(`[Webhook] Delivery failed to ${webhook.url}:`, errorMessage);

        await webhook.update({
            last_triggered_at: new Date(),
            last_response_code: responseCode,
            last_error_message: errorMessage
        });

        return {
            success: false,
            responseCode,
            error: errorMessage
        };
    } finally {
        const duration = Date.now() - startTime;
        try {
            await OutgoingWebhookLog.create({
                webhook_id: webhook.id,
                event,
                payload,
                response_code: responseCode,
                response_body: responseBody,
                duration,
                status,
                error_message: errorMessage
            });
        } catch (logError) {
            console.error('[Webhook] Failed to create execution log:', logError.message);
        }
    }
}

module.exports = {
    notifySubscribers,
    dispatchWebhook
};
