/**
 * Laapak Report System - Enhanced API Key Authentication Middleware
 * Handles API key validation, permissions, rate limiting, and usage logging
 */

const crypto = require('crypto');
const { ApiKey, ApiUsageLog, Client } = require('../models');
const { Op } = require('sequelize');

// Rate limiting storage (in production, use Redis)
const rateLimitStore = new Map();

/**
 * Hash API key for storage/comparison
 */
function hashApiKey(apiKey) {
    return crypto.createHash('sha256').update(apiKey).digest('hex');
}

/**
 * Check if IP is whitelisted
 */
function isIpWhitelisted(clientIp, whitelist) {
    if (!whitelist || whitelist.trim() === '') return true;
    
    const allowedIps = whitelist.split(',').map(ip => ip.trim());
    return allowedIps.includes(clientIp);
}

/**
 * Check rate limit for API key
 */
function checkRateLimit(apiKeyId, rateLimit) {
    const now = Date.now();
    const key = `rate_limit_${apiKeyId}`;
    
    if (!rateLimitStore.has(key)) {
        rateLimitStore.set(key, { count: 0, resetTime: now + 3600000 }); // 1 hour
    }
    
    const limit = rateLimitStore.get(key);
    
    // Reset if hour has passed
    if (now > limit.resetTime) {
        limit.count = 0;
        limit.resetTime = now + 3600000;
    }
    
    if (limit.count >= rateLimit) {
        return false;
    }
    
    limit.count++;
    return true;
}

/**
 * Log API usage
 */
async function logApiUsage(apiKeyId, req, res, responseTime) {
    try {
        await ApiUsageLog.create({
            api_key_id: apiKeyId,
            endpoint: req.path,
            method: req.method,
            client_ip: req.ip || req.connection.remoteAddress,
            user_agent: req.get('User-Agent'),
            response_status: res.statusCode,
            response_time: responseTime,
            request_size: req.get('Content-Length') ? parseInt(req.get('Content-Length')) : null,
            response_size: res.get('Content-Length') ? parseInt(res.get('Content-Length')) : null,
            error_message: res.statusCode >= 400 ? res.statusMessage : null,
            request_data: req.method === 'POST' || req.method === 'PUT' ? 
                (req.body ? JSON.stringify(req.body).substring(0, 1000) : null) : null
        });
    } catch (error) {
        console.error('Failed to log API usage:', error);
    }
}

/**
 * Enhanced API Key Authentication Middleware
 */
const apiKeyAuth = (requiredPermissions = {}) => {
    return async (req, res, next) => {
        const startTime = Date.now();
        
        try {
            // Get API key from headers
            const apiKey = req.header('x-api-key') || req.header('Authorization')?.replace('Bearer ', '');
            
            if (!apiKey) {
                return res.status(401).json({ 
                    message: 'API key required',
                    error: 'API_KEY_REQUIRED'
                });
            }
            
            // Hash the provided API key for comparison
            const hashedApiKey = hashApiKey(apiKey);
            
            // Find API key in database
            const apiKeyRecord = await ApiKey.findOne({
                where: { 
                    api_key: hashedApiKey,
                    is_active: true
                },
                include: [
                    { model: Client, as: 'client', attributes: ['id', 'name', 'phone', 'status'] }
                ]
            });
            
            if (!apiKeyRecord) {
                return res.status(401).json({ 
                    message: 'Invalid API key',
                    error: 'INVALID_API_KEY'
                });
            }
            
            // Check if API key has expired
            if (apiKeyRecord.expires_at && new Date() > apiKeyRecord.expires_at) {
                return res.status(401).json({ 
                    message: 'API key has expired',
                    error: 'API_KEY_EXPIRED'
                });
            }
            
            // Check IP whitelist
            const clientIp = req.ip || req.connection.remoteAddress;
            if (!isIpWhitelisted(clientIp, apiKeyRecord.ip_whitelist)) {
                return res.status(403).json({ 
                    message: 'IP address not allowed',
                    error: 'IP_NOT_WHITELISTED'
                });
            }
            
            // Check rate limit
            if (!checkRateLimit(apiKeyRecord.id, apiKeyRecord.rate_limit)) {
                return res.status(429).json({ 
                    message: 'Rate limit exceeded',
                    error: 'RATE_LIMIT_EXCEEDED',
                    retry_after: 3600 // 1 hour
                });
            }
            
            // Check permissions
            const permissions = apiKeyRecord.permissions;
            for (const [resource, actions] of Object.entries(requiredPermissions)) {
                if (!permissions[resource]) {
                    return res.status(403).json({ 
                        message: `Access denied: No ${resource} permissions`,
                        error: 'INSUFFICIENT_PERMISSIONS'
                    });
                }
                
                for (const [action, required] of Object.entries(actions)) {
                    if (required && !permissions[resource][action]) {
                        return res.status(403).json({ 
                            message: `Access denied: ${action} permission required for ${resource}`,
                            error: 'INSUFFICIENT_PERMISSIONS'
                        });
                    }
                }
            }
            
            // Update usage statistics
            await apiKeyRecord.update({
                last_used: new Date(),
                usage_count: apiKeyRecord.usage_count + 1
            });
            
            // Add API key info to request
            req.apiKey = {
                id: apiKeyRecord.id,
                name: apiKeyRecord.key_name,
                client: apiKeyRecord.client,
                permissions: apiKeyRecord.permissions,
                rateLimit: apiKeyRecord.rate_limit
            };
            
            // Log the request
            const responseTime = Date.now() - startTime;
            
            // Override res.json to log after response
            const originalJson = res.json;
            res.json = function(data) {
                logApiUsage(apiKeyRecord.id, req, res, responseTime);
                return originalJson.call(this, data);
            };
            
            next();
            
        } catch (error) {
            console.error('API key authentication error:', error);
            res.status(500).json({ 
                message: 'Authentication error',
                error: 'AUTH_ERROR'
            });
        }
    };
};

/**
 * Client-specific API key middleware
 * Ensures API key is associated with a specific client
 */
const clientApiKeyAuth = (requiredPermissions = {}) => {
    return async (req, res, next) => {
        // First run the general API key auth
        await apiKeyAuth(requiredPermissions)(req, res, (err) => {
            if (err) return next(err);
            
            // Check if API key is client-specific
            if (!req.apiKey.client) {
                return res.status(403).json({ 
                    message: 'This API key is not associated with a client',
                    error: 'CLIENT_API_KEY_REQUIRED'
                });
            }
            
            // Add client info to request
            req.client = req.apiKey.client;
            next();
        });
    };
};

/**
 * System API key middleware
 * For system-wide API keys (not client-specific)
 */
const systemApiKeyAuth = (requiredPermissions = {}) => {
    return async (req, res, next) => {
        // First run the general API key auth
        await apiKeyAuth(requiredPermissions)(req, res, (err) => {
            if (err) return next(err);
            
            // Check if API key is system-wide (no client association)
            if (req.apiKey.client) {
                return res.status(403).json({ 
                    message: 'System API key required',
                    error: 'SYSTEM_API_KEY_REQUIRED'
                });
            }
            
            next();
        });
    };
};

module.exports = {
    apiKeyAuth,
    clientApiKeyAuth,
    systemApiKeyAuth,
    hashApiKey
};
