const axios = require('axios');

/**
 * Facebook Graph API Service
 * Handles interaction with Meta Ads API
 */
class FacebookService {
    constructor() {
        this.accessToken = process.env.FB_ACCESS_TOKEN;
        this.version = process.env.FB_GRAPH_VERSION || 'v18.0';
        this.baseUrl = `https://graph.facebook.com/${this.version}`;

        if (!this.accessToken) {
            console.error('❌ Facebook Access Token is missing in environment variables');
        }
    }

    /**
     * Get Ad Accounts associated with the token
     */
    async getAdAccounts() {
        try {
            const response = await axios.get(`${this.baseUrl}/me/adaccounts`, {
                params: {
                    fields: 'name,account_id,id,currency,account_status,timezone_name',
                    access_token: this.accessToken
                }
            });
            return response.data;
        } catch (error) {
            this._handleError('getAdAccounts', error);
        }
    }

    /**
     * Get Campaigns for a specific Ad Account
     * @param {string} adAccountId - Format: act_123456789
     */
    async getCampaigns(adAccountId) {
        try {
            const response = await axios.get(`${this.baseUrl}/${adAccountId}/campaigns`, {
                params: {
                    fields: 'name,status,objective,start_time,stop_time',
                    access_token: this.accessToken
                }
            });
            return response.data;
        } catch (error) {
            this._handleError('getCampaigns', error);
        }
    }

    /**
     * Get Insights for an Ad Account
     * @param {string} adAccountId - Format: act_123456789
     * @param {string} datePreset - e.g., 'today', 'yesterday', 'last_7d', 'this_month'
     */
    async getInsights(adAccountId, datePreset = 'last_30d') {
        try {
            const response = await axios.get(`${this.baseUrl}/${adAccountId}/insights`, {
                params: {
                    fields: 'spend,impressions,clicks,cpc,ctr,reach,account_name',
                    date_preset: datePreset,
                    access_token: this.accessToken
                }
            });
            return response.data;
        } catch (error) {
            this._handleError('getInsights', error);
        }
    }

    /**
     * Get Daily Insights breakdown for the last 30 days
     * @param {string} adAccountId 
     */
    async getDailyInsights(adAccountId) {
        try {
            const response = await axios.get(`${this.baseUrl}/${adAccountId}/insights`, {
                params: {
                    fields: 'date_start,spend,impressions,clicks',
                    time_increment: 1,
                    date_preset: 'last_30d',
                    access_token: this.accessToken
                }
            });
            return response.data;
        } catch (error) {
            this._handleError('getDailyInsights', error);
        }
    }

    /**
     * Internal error handler
     */
    _handleError(method, error) {
        const errorData = error.response?.data || error.message;
        console.error(`❌ FacebookService [${method}] Error:`, errorData);
        throw new Error(errorData.error?.message || error.message);
    }
}

module.exports = new FacebookService();
