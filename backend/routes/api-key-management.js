/**
 * Laapak Report System - API Key Management Routes
 * Admin routes for managing API keys, permissions, and usage analytics
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { ApiKey, ApiUsageLog, Client, Admin } = require('../models');
const { Op } = require('sequelize');
const { adminAuth } = require('../middleware/auth');

/**
 * Generate a new API key
 */
function generateApiKey(prefix = 'ak_live_') {
    const randomBytes = crypto.randomBytes(32);
    const key = prefix + randomBytes.toString('hex');
    return key;
}

/**
 * Hash API key for storage
 */
function hashApiKey(apiKey) {
    return crypto.createHash('sha256').update(apiKey).digest('hex');
}

// ==================== API KEY MANAGEMENT ====================

/**
 * Create a new API key
 */
router.post('/api-keys', adminAuth, async (req, res) => {
    try {
        const {
            key_name,
            client_id,
            permissions = {
                reports: { read: true, write: false, delete: false },
                invoices: { read: true, write: false, delete: false },
                clients: { read: true, write: false, delete: false },
                financial: { read: false, write: false, delete: false }
            },
            rate_limit = 1000,
            expires_at,
            ip_whitelist,
            description
        } = req.body;
        
        if (!key_name) {
            return res.status(400).json({ 
                message: 'Key name is required',
                error: 'MISSING_KEY_NAME'
            });
        }
        
        // Generate API key
        const apiKey = generateApiKey();
        const hashedKey = hashApiKey(apiKey);
        
        // Create API key record
        const apiKeyRecord = await ApiKey.create({
            key_name,
            api_key: hashedKey,
            key_prefix: 'ak_live_',
            client_id: client_id || null,
            permissions,
            rate_limit,
            expires_at: expires_at ? new Date(expires_at) : null,
            ip_whitelist,
            description,
            created_by: req.user.id
        });
        
        res.status(201).json({
            success: true,
            apiKey: {
                id: apiKeyRecord.id,
                key_name: apiKeyRecord.key_name,
                api_key: apiKey, // Return the plain key only once
                client_id: apiKeyRecord.client_id,
                permissions: apiKeyRecord.permissions,
                rate_limit: apiKeyRecord.rate_limit,
                expires_at: apiKeyRecord.expires_at,
                created_at: apiKeyRecord.created_at
            },
            message: 'API key created successfully. Store the key securely as it will not be shown again.'
        });
    } catch (error) {
        console.error('Error creating API key:', error);
        res.status(500).json({ 
            message: 'Server error', 
            error: error.message 
        });
    }
});

/**
 * Get all API keys
 */
router.get('/api-keys', adminAuth, async (req, res) => {
    try {
        const { 
            client_id, 
            is_active, 
            limit = 50, 
            offset = 0,
            sortBy = 'created_at',
            sortOrder = 'DESC'
        } = req.query;
        
        let whereClause = {};
        
        if (client_id) {
            whereClause.client_id = client_id;
        }
        
        if (is_active !== undefined) {
            whereClause.is_active = is_active === 'true';
        }
        
        const apiKeys = await ApiKey.findAll({
            where: whereClause,
            attributes: [
                'id', 'key_name', 'key_prefix', 'client_id', 'permissions',
                'rate_limit', 'expires_at', 'last_used', 'usage_count',
                'is_active', 'ip_whitelist', 'description', 'created_at', 'updated_at'
            ],
            include: [
                { model: Client, as: 'client', attributes: ['id', 'name', 'phone'] },
                { model: Admin, as: 'creator', attributes: ['id', 'name', 'username'] }
            ],
            order: [[sortBy, sortOrder]],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
        
        const totalCount = await ApiKey.count({ where: whereClause });
        
        res.json({
            success: true,
            apiKeys: apiKeys,
            pagination: {
                total: totalCount,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: (parseInt(offset) + parseInt(limit)) < totalCount
            }
        });
    } catch (error) {
        console.error('Error fetching API keys:', error);
        res.status(500).json({ 
            message: 'Server error', 
            error: error.message 
        });
    }
});

/**
 * Get specific API key details
 */
router.get('/api-keys/:id', adminAuth, async (req, res) => {
    try {
        const apiKeyId = req.params.id;
        
        const apiKey = await ApiKey.findByPk(apiKeyId, {
            attributes: [
                'id', 'key_name', 'key_prefix', 'client_id', 'permissions',
                'rate_limit', 'expires_at', 'last_used', 'usage_count',
                'is_active', 'ip_whitelist', 'description', 'created_at', 'updated_at'
            ],
            include: [
                { model: Client, as: 'client', attributes: ['id', 'name', 'phone'] },
                { model: Admin, as: 'creator', attributes: ['id', 'name', 'username'] }
            ]
        });
        
        if (!apiKey) {
            return res.status(404).json({ 
                message: 'API key not found',
                error: 'API_KEY_NOT_FOUND'
            });
        }
        
        res.json({
            success: true,
            apiKey: apiKey
        });
    } catch (error) {
        console.error('Error fetching API key:', error);
        res.status(500).json({ 
            message: 'Server error', 
            error: error.message 
        });
    }
});

/**
 * Update API key
 */
router.put('/api-keys/:id', adminAuth, async (req, res) => {
    try {
        const apiKeyId = req.params.id;
        const {
            key_name,
            permissions,
            rate_limit,
            expires_at,
            ip_whitelist,
            description,
            is_active
        } = req.body;
        
        const apiKey = await ApiKey.findByPk(apiKeyId);
        
        if (!apiKey) {
            return res.status(404).json({ 
                message: 'API key not found',
                error: 'API_KEY_NOT_FOUND'
            });
        }
        
        // Update fields
        if (key_name !== undefined) apiKey.key_name = key_name;
        if (permissions !== undefined) apiKey.permissions = permissions;
        if (rate_limit !== undefined) apiKey.rate_limit = rate_limit;
        if (expires_at !== undefined) apiKey.expires_at = expires_at ? new Date(expires_at) : null;
        if (ip_whitelist !== undefined) apiKey.ip_whitelist = ip_whitelist;
        if (description !== undefined) apiKey.description = description;
        if (is_active !== undefined) apiKey.is_active = is_active;
        
        await apiKey.save();
        
        res.json({
            success: true,
            apiKey: apiKey,
            message: 'API key updated successfully'
        });
    } catch (error) {
        console.error('Error updating API key:', error);
        res.status(500).json({ 
            message: 'Server error', 
            error: error.message 
        });
    }
});

/**
 * Delete API key
 */
router.delete('/api-keys/:id', adminAuth, async (req, res) => {
    try {
        const apiKeyId = req.params.id;
        
        const apiKey = await ApiKey.findByPk(apiKeyId);
        
        if (!apiKey) {
            return res.status(404).json({ 
                message: 'API key not found',
                error: 'API_KEY_NOT_FOUND'
            });
        }
        
        await apiKey.destroy();
        
        res.json({
            success: true,
            message: 'API key deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting API key:', error);
        res.status(500).json({ 
            message: 'Server error', 
            error: error.message 
        });
    }
});

/**
 * Regenerate API key
 */
router.post('/api-keys/:id/regenerate', adminAuth, async (req, res) => {
    try {
        const apiKeyId = req.params.id;
        
        const apiKey = await ApiKey.findByPk(apiKeyId);
        
        if (!apiKey) {
            return res.status(404).json({ 
                message: 'API key not found',
                error: 'API_KEY_NOT_FOUND'
            });
        }
        
        // Generate new API key
        const newApiKey = generateApiKey(apiKey.key_prefix);
        const hashedKey = hashApiKey(newApiKey);
        
        // Update the API key
        apiKey.api_key = hashedKey;
        apiKey.usage_count = 0;
        apiKey.last_used = null;
        await apiKey.save();
        
        res.json({
            success: true,
            apiKey: {
                id: apiKey.id,
                key_name: apiKey.key_name,
                api_key: newApiKey, // Return the plain key only once
                message: 'API key regenerated successfully. Store the new key securely.'
            }
        });
    } catch (error) {
        console.error('Error regenerating API key:', error);
        res.status(500).json({ 
            message: 'Server error', 
            error: error.message 
        });
    }
});

// ==================== USAGE ANALYTICS ====================

/**
 * Get API key usage statistics
 */
router.get('/api-keys/:id/usage', adminAuth, async (req, res) => {
    try {
        const apiKeyId = req.params.id;
        const { days = 30 } = req.query;
        
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));
        
        const usageStats = await ApiUsageLog.findAll({
            where: {
                api_key_id: apiKeyId,
                created_at: { [Op.gte]: startDate }
            },
            attributes: [
                'endpoint',
                'method',
                'response_status',
                [ApiUsageLog.sequelize.fn('COUNT', ApiUsageLog.sequelize.col('id')), 'count'],
                [ApiUsageLog.sequelize.fn('AVG', ApiUsageLog.sequelize.col('response_time')), 'avg_response_time'],
                [ApiUsageLog.sequelize.fn('MAX', ApiUsageLog.sequelize.col('created_at')), 'last_used']
            ],
            group: ['endpoint', 'method', 'response_status'],
            order: [[ApiUsageLog.sequelize.fn('COUNT', ApiUsageLog.sequelize.col('id')), 'DESC']]
        });
        
        const totalUsage = await ApiUsageLog.count({
            where: {
                api_key_id: apiKeyId,
                created_at: { [Op.gte]: startDate }
            }
        });
        
        res.json({
            success: true,
            period: `${days} days`,
            total_usage: totalUsage,
            stats: usageStats
        });
    } catch (error) {
        console.error('Error fetching usage stats:', error);
        res.status(500).json({ 
            message: 'Server error', 
            error: error.message 
        });
    }
});

/**
 * Get system-wide usage analytics
 */
router.get('/analytics/usage', adminAuth, async (req, res) => {
    try {
        const { days = 30 } = req.query;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));
        
        const analytics = await ApiUsageLog.findAll({
            where: {
                created_at: { [Op.gte]: startDate }
            },
            attributes: [
                'api_key_id',
                'endpoint',
                'method',
                'response_status',
                [ApiUsageLog.sequelize.fn('COUNT', ApiUsageLog.sequelize.col('id')), 'count'],
                [ApiUsageLog.sequelize.fn('AVG', ApiUsageLog.sequelize.col('response_time')), 'avg_response_time']
            ],
            include: [
                { model: ApiKey, as: 'apiKey', attributes: ['id', 'key_name', 'client_id'] }
            ],
            group: ['api_key_id', 'endpoint', 'method', 'response_status'],
            order: [[ApiUsageLog.sequelize.fn('COUNT', ApiUsageLog.sequelize.col('id')), 'DESC']]
        });
        
        res.json({
            success: true,
            period: `${days} days`,
            analytics: analytics
        });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ 
            message: 'Server error', 
            error: error.message 
        });
    }
});

module.exports = router;
