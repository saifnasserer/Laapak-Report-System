/**
 * Laapak Report System - API Keys Routes
 * Handles API key authentication for external systems
 */

const express = require('express');
const router = express.Router();
const { Client } = require('../models');
const { Op } = require('sequelize');

// API Key middleware
const apiKeyAuth = (req, res, next) => {
    const apiKey = req.header('x-api-key') || req.header('Authorization')?.replace('Bearer ', '');
    
    // For now, we'll use a simple API key. In production, store this in environment variables
    const validApiKeys = [
        process.env.API_KEY || 'laapak-api-key-2024',
        'laapak-external-access-key',
        'laapak-integration-key'
    ];
    
    if (!apiKey || !validApiKeys.includes(apiKey)) {
        return res.status(401).json({ 
            message: 'Invalid or missing API key',
            error: 'API_KEY_REQUIRED'
        });
    }
    
    req.apiKey = apiKey;
    next();
};

// Public client lookup by phone (for external systems)
router.get('/clients/lookup', apiKeyAuth, async (req, res) => {
    try {
        const { phone, email } = req.query;
        
        if (!phone && !email) {
            return res.status(400).json({ 
                message: 'Phone number or email is required',
                error: 'MISSING_PARAMETERS'
            });
        }
        
        let whereClause = {};
        
        if (phone) {
            whereClause.phone = phone;
        }
        
        if (email) {
            whereClause.email = email;
        }
        
        const client = await Client.findOne({
            where: whereClause,
            attributes: ['id', 'name', 'phone', 'email', 'status', 'createdAt']
        });
        
        if (!client) {
            return res.status(404).json({ 
                message: 'Client not found',
                error: 'CLIENT_NOT_FOUND'
            });
        }
        
        res.json({
            success: true,
            client: client
        });
    } catch (error) {
        console.error('Error looking up client:', error);
        res.status(500).json({ 
            message: 'Server error', 
            error: error.message 
        });
    }
});

// Public client lookup by phone with order code verification
router.post('/clients/verify', apiKeyAuth, async (req, res) => {
    try {
        const { phone, orderCode } = req.body;
        
        if (!phone || !orderCode) {
            return res.status(400).json({ 
                message: 'Phone number and order code are required',
                error: 'MISSING_PARAMETERS'
            });
        }
        
        const client = await Client.findOne({
            where: { 
                phone: phone,
                orderCode: orderCode
            },
            attributes: ['id', 'name', 'phone', 'email', 'status', 'createdAt']
        });
        
        if (!client) {
            return res.status(404).json({ 
                message: 'Invalid credentials',
                error: 'INVALID_CREDENTIALS'
            });
        }
        
        res.json({
            success: true,
            client: client,
            message: 'Client verified successfully'
        });
    } catch (error) {
        console.error('Error verifying client:', error);
        res.status(500).json({ 
            message: 'Server error', 
            error: error.message 
        });
    }
});

// Get client's reports (public access with API key)
router.get('/clients/:id/reports', apiKeyAuth, async (req, res) => {
    try {
        const clientId = req.params.id;
        
        // Import Report model
        const { Report } = require('../models');
        
        const reports = await Report.findAll({
            where: { client_id: clientId },
            attributes: ['id', 'device_model', 'serial_number', 'inspection_date', 'status', 'createdAt'],
            order: [['createdAt', 'DESC']]
        });
        
        res.json({
            success: true,
            reports: reports,
            count: reports.length
        });
    } catch (error) {
        console.error('Error fetching client reports:', error);
        res.status(500).json({ 
            message: 'Server error', 
            error: error.message 
        });
    }
});

// Get client's invoices (public access with API key)
router.get('/clients/:id/invoices', apiKeyAuth, async (req, res) => {
    try {
        const clientId = req.params.id;
        
        // Import Invoice model
        const { Invoice } = require('../models');
        
        const invoices = await Invoice.findAll({
            where: { client_id: clientId },
            attributes: ['id', 'total', 'paymentStatus', 'date', 'createdAt'],
            order: [['createdAt', 'DESC']]
        });
        
        res.json({
            success: true,
            invoices: invoices,
            count: invoices.length
        });
    } catch (error) {
        console.error('Error fetching client invoices:', error);
        res.status(500).json({ 
            message: 'Server error', 
            error: error.message 
        });
    }
});

// Health check for API key authentication
router.get('/health', apiKeyAuth, (req, res) => {
    res.json({
        success: true,
        message: 'API key authentication successful',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
