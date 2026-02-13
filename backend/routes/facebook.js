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

/**
 * @route   POST /api/facebook/update-budget/:campaignId
 * @desc    Update Facebook Campaign Budget
 * @access  Admin
 */
router.post('/update-budget/:campaignId', auth, adminAuth, async (req, res) => {
    try {
        const { campaignId } = req.params;
        const { daily_budget } = req.body;

        if (!daily_budget) {
            return res.status(400).json({ error: 'daily_budget is required' });
        }

        const result = await facebookService.updateCampaignBudget(campaignId, daily_budget);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route   POST /api/facebook/toggle-status/:id
 * @desc    Toggle Status (ACTIVE/PAUSED)
 * @access  Admin
 */
router.post('/toggle-status/:id', auth, adminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['ACTIVE', 'PAUSED'].includes(status)) {
            return res.status(400).json({ error: 'status must be ACTIVE or PAUSED' });
        }

        const result = await facebookService.toggleStatus(id, status);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route   POST /api/facebook/create-campaign/:adAccountId
 * @desc    Create a basic Facebook Campaign
 * @access  Admin
 */
router.post('/create-campaign/:adAccountId', auth, adminAuth, async (req, res) => {
    try {
        const { adAccountId } = req.params;
        const result = await facebookService.createCampaign(adAccountId, req.body);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const adAnalyst = require('../utils/ad-analyst');

/**
 * @route   GET /api/facebook/product-performance
 * @desc    Get Product-Specific Performance Matrix
 * @access  Admin
 */
router.get('/product-performance', auth, adminAuth, async (req, res) => {
    try {
        const matrix = await adAnalyst.getProductPerformanceMatrix();
        res.json(matrix);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route   GET /api/facebook/recommendations
 * @desc    Get AI Scaling Recommendations
 * @access  Admin
 */
router.get('/recommendations', auth, adminAuth, async (req, res) => {
    try {
        const recommendations = await adAnalyst.getScalingRecommendations();
        res.json(recommendations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
