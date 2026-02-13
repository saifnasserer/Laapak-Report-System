/**
 * Daily Ads Sync Script
 * Fetches data from Facebook Graph API, saves to database, and sends WhatsApp summary.
 */
require('dotenv').config({ path: '../.env' });
const facebookService = require('../utils/facebook-service');
const { sequelize } = require('../config/db');
const notifier = require('../utils/notifier');

// Admin phone number for alerts - replace with actual admin number if needed
const ADMIN_PHONE = '201019672658';

async function syncAdsData() {
    console.log(`🚀 [${new Date().toISOString()}] Starting Ads Data Sync...`);

    try {
        const accounts = await facebookService.getAdAccounts();

        if (!accounts.data || accounts.data.length === 0) {
            console.log('No ad accounts found to sync.');
            return;
        }

        let totalSpendYesterday = 0;
        let summaryMessage = "📊 *Daily Ad Performance Summary*\n\n";
        let hasDataYesterday = false;

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        for (const account of accounts.data) {
            console.log(`Syncing account: ${account.name} (${account.id})`);

            const insights = await facebookService.getDailyInsights(account.id);

            if (!insights.data || insights.data.length === 0) {
                console.log(`No insights found for account ${account.name}`);
                continue;
            }

            console.log(`Received ${insights.data.length} days of data for ${account.name}`);

            const yesterdayData = insights.data.find(d => d.date_start === yesterdayStr);
            if (yesterdayData) {
                const spend = parseFloat(yesterdayData.spend || 0);
                totalSpendYesterday += spend;
                summaryMessage += `🔹 *${account.name}*\nSpend: ${spend} ${account.currency}\nClicks: ${yesterdayData.clicks}\nImpressions: ${yesterdayData.impressions}\n\n`;
                hasDataYesterday = true;
            }

            for (const day of insights.data) {
                const { date_start, spend, impressions, clicks } = day;

                await sequelize.query(`
                    INSERT INTO facebook_ad_spend (ad_account_id, ad_account_name, date, spend, impressions, clicks, currency)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                        spend = VALUES(spend),
                        impressions = VALUES(impressions),
                        clicks = VALUES(clicks),
                        ad_account_name = VALUES(ad_account_name)
                `, {
                    replacements: [
                        account.id,
                        account.name,
                        date_start,
                        spend || 0,
                        impressions || 0,
                        clicks || 0,
                        account.currency || 'EGP'
                    ]
                });
            }

            console.log(`✅ Successfully synced ${account.name}`);
        }

        if (hasDataYesterday) {
            summaryMessage += `💰 *Total Spend Yesterday:* ${totalSpendYesterday.toFixed(2)} EGP`;
            await notifier.sendText(ADMIN_PHONE, summaryMessage);
            console.log('WhatsApp summary sent.');
        }

        console.log('🏁 Ads Data Sync Completed.');
    } catch (error) {
        console.error('❌ Sync Failed:', error.message);
    }
}

syncAdsData();
