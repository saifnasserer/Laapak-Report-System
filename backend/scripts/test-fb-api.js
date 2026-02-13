/**
 * Test script for Facebook Graph API Service
 */
require('dotenv').config({ path: '../.env' });
const facebookService = require('../utils/facebook-service');

async function testFB() {
    console.log('🚀 Starting Facebook API Test...');

    try {
        console.log('\n--- Ad Accounts ---');
        const accounts = await facebookService.getAdAccounts();
        console.log(JSON.stringify(accounts, null, 2));

        if (accounts.data && accounts.data.length > 0) {
            const adAccountId = accounts.data[0].id;
            console.log(`\n--- Fetching Data for Account: ${adAccountId} ---`);

            console.log('\n--- Campaigns ---');
            const campaigns = await facebookService.getCampaigns(adAccountId);
            console.log(JSON.stringify(campaigns, null, 2));

            console.log('\n--- Insights (Last 30 Days) ---');
            const insights = await facebookService.getInsights(adAccountId);
            console.log(JSON.stringify(insights, null, 2));

            console.log('\n--- Daily Insights (Last 30 Days) ---');
            const daily = await facebookService.getDailyInsights(adAccountId);
            console.log(JSON.stringify(daily, null, 2));
        } else {
            console.log('No ad accounts found.');
        }

        console.log('\n✅ Test Completed Successfully!');
    } catch (error) {
        console.error('\n❌ Test Failed:', error.message);
    }
}

testFB();
