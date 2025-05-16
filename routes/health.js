/**
 * Laapak Report System - Health Check Routes
 * Provides endpoints for checking system health and status
 */

const express = require('express');
const router = express.Router();
const { sequelize, Report } = require('../models');

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

// Database tables check endpoint
router.get('/db-tables', async (req, res) => {
    try {
        // Check if tables exist by querying them
        const tables = {};
        
        // Check reports table
        try {
            const reportsCount = await Report.count();
            tables.reports = { exists: true, count: reportsCount };
        } catch (error) {
            tables.reports = { exists: false, error: error.message };
        }
        
        // Check report_technical_tests table
        try {
            const [results] = await sequelize.query(
                "SELECT COUNT(*) as count FROM report_technical_tests"
            );
            tables.report_technical_tests = { 
                exists: true, 
                count: results[0].count 
            };
        } catch (error) {
            tables.report_technical_tests = { exists: false, error: error.message };
        }
        
        // Check report_external_inspection table
        try {
            const [results] = await sequelize.query(
                "SELECT COUNT(*) as count FROM report_external_inspection"
            );
            tables.report_external_inspection = { 
                exists: true, 
                count: results[0].count 
            };
        } catch (error) {
            tables.report_external_inspection = { exists: false, error: error.message };
        }
        
        return res.status(200).json({
            status: 'ok',
            message: 'Database tables check completed',
            timestamp: new Date().toISOString(),
            tables
        });
    } catch (error) {
        console.error('Database tables check failed:', error);
        
        return res.status(500).json({
            status: 'error',
            message: 'Database tables check failed',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

// Reports count endpoint
router.get('/reports/count', async (req, res) => {
    try {
        // Get count of reports
        const count = await Report.count();
        
        return res.status(200).json({
            status: 'ok',
            count,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Reports count check failed:', error);
        
        return res.status(500).json({
            status: 'error',
            message: 'Failed to get reports count',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

module.exports = router;
