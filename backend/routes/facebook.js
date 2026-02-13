const express = require('express');
const router = express.Router();
const facebookService = require('../utils/facebook-service');
const { auth, adminAuth } = require('../middleware/auth');

/**
 * @route   GET /api/facebook/ad-accounts
 * @desc    Get Facebook Ad Accounts
 * @access  Admin
 */
router.get('/ad-accounts', auth, adminAuth, async (req, res) => {
    try {
        const accounts = await facebookService.getAdAccounts();
        res.json(accounts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route   GET /api/facebook/insights/:adAccountId
 * @desc    Get Insights for a specific Ad Account
 * @access  Admin
 */
router.get('/insights/:adAccountId', auth, adminAuth, async (req, res) => {
    try {
        const { adAccountId } = req.params;
        const { date_preset } = req.query;
        const insights = await facebookService.getInsights(adAccountId, date_preset);
        res.json(insights);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route   GET /api/facebook/daily-insights/:adAccountId
 * @desc    Get Daily Insights breakdown for a specific Ad Account
 * @access  Admin
 */
router.get('/daily-insights/:adAccountId', auth, adminAuth, async (req, res) => {
    try {
        const { adAccountId } = req.params;
        const insights = await facebookService.getDailyInsights(adAccountId);
        res.json(insights);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route   GET /api/facebook/campaigns/:adAccountId
 * @desc    Get Campaigns for a specific Ad Account
 * @access  Admin
 */
router.get('/campaigns/:adAccountId', auth, adminAuth, async (req, res) => {
    try {
        const { adAccountId } = req.params;
        const campaigns = await facebookService.getCampaigns(adAccountId);
        res.json(campaigns);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
