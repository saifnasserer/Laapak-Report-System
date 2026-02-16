const express = require('express');
const router = express.Router();
const { getExchangeRate } = require('../utils/currency-service');

/**
 * @route   GET /api/currency/rate/:from/:to
 * @desc    Get live exchange rate between two currencies
 * @access  Public
 */
router.get('/rate/:from/:to', async (req, res) => {
    try {
        const { from, to } = req.params;
        const rate = await getExchangeRate(from.toUpperCase(), to.toUpperCase());
        res.json({ success: true, rate });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
