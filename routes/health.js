/**
 * Laapak Report System - Health Check Routes
 * Provides endpoints for checking system health and status
 */

const express = require('express');
const router = express.Router();
const { sequelize } = require('../config/db');

// Health check endpoint
router.get('/', async (req, res) => {
    try {
        // Check database connection
        await sequelize.authenticate();
        
        return res.status(200).json({
            status: 'ok',
            message: 'System is healthy',
            timestamp: new Date().toISOString(),
            database: 'connected'
        });
    } catch (error) {
        console.error('Health check failed:', error);
        
        return res.status(500).json({
            status: 'error',
            message: 'System health check failed',
            timestamp: new Date().toISOString(),
            database: 'disconnected',
            error: error.message
        });
    }
});

module.exports = router;
