const axios = require('axios');

class Notifier {
    constructor() {
        this.baseUrl = process.env.EVOLUTION_URL || 'https://wa.fixzzone.com';
        this.apiKey = process.env.EVOLUTION_API_KEY || 'laapak_wa_2026_secret';
        this.instance = process.env.EVOLUTION_INSTANCE || 'Laapak';
        this.token = process.env.EVOLUTION_TOKEN || '146F73F37CC4-40F6-AC65-0199CAE90CEA';
    }

    /**
     * Normalize phone number format (especially for Egypt)
     * @param {string} number 
     * @returns {string}
     */
    formatNumber(number) {
        if (!number) return '';

        // Remove all non-numeric characters
        let cleaned = number.toString().replace(/\D/g, '');

        // If it starts with 0 (like 010...), replace leading 0 with 20
        if (cleaned.startsWith('0')) {
            cleaned = '20' + cleaned.substring(1);
        }

        // If it's a standard Egyptian length (10 digits) without country code, add 20
        if (cleaned.length === 10 && (cleaned.startsWith('10') || cleaned.startsWith('11') || cleaned.startsWith('12') || cleaned.startsWith('15'))) {
            cleaned = '20' + cleaned;
        }

        // Final fallback: if it doesn't start with 20 and is roughly the right length, prepend 20
        if (!cleaned.startsWith('20') && cleaned.length >= 10 && cleaned.length <= 12) {
            cleaned = '20' + cleaned;
        }

        return cleaned;
    }

    /**
     * Send a text message via WhatsApp
     * @param {string} number - Phone number with country code (e.g., 201012345678)
     * @param {string} text - Message content
     */
    async sendText(number, text) {
        try {
            const formattedNumber = this.formatNumber(number);
            const response = await axios.post(`${this.baseUrl}/message/sendText/${this.instance}`, {
                number: formattedNumber,
                text: text,
                linkPreview: true
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': this.apiKey
                }
            });
            return response.data;
        } catch (error) {
            console.error('WhatsApp Notifier [Text] Error:', error.response?.data || error.message);
            if (error.response?.data) {
                console.error('Full Error Response:', JSON.stringify(error.response.data, null, 2));
            }
            throw error;
        }
    }

    /**
     * Send media (PDF, Image, etc.) via WhatsApp
     * @param {string} number - Phone number
     * @param {string} mediaUrl - URL or Base64 of the media
     * @param {string} fileName - Name of the file
     * @param {string} caption - Optional caption
     */
    async sendMedia(number, mediaUrl, fileName, caption = '') {
        try {
            const formattedNumber = this.formatNumber(number);
            const response = await axios.post(`${this.baseUrl}/message/sendMedia/${this.instance}`, {
                number: formattedNumber,
                media: mediaUrl,
                mediatype: mediaUrl.startsWith('http') ? 'url' : 'base64',
                fileName: fileName,
                caption: caption
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': this.apiKey
                }
            });
            return response.data;
        } catch (error) {
            console.error('WhatsApp Notifier [Media] Error:', error.response?.data || error.message);
            throw error;
        }
    }
}

module.exports = new Notifier();
