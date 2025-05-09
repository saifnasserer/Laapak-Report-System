/**
 * Laapak Report System - Authentication Middleware
 * Handles JWT verification and user authentication for protected routes
 */

const jwt = require('jsonwebtoken');
const { Admin, Client } = require('../models');

// JWT Secret Key
const JWT_SECRET = process.env.JWT_SECRET || 'laapak-secret-key-change-in-production';

// General Authentication Middleware
const auth = async (req, res, next) => {
    const token = req.header('x-auth-token');
    
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

// Admin Authentication Middleware
const adminAuth = async (req, res, next) => {
    const token = req.header('x-auth-token');
    
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        if (decoded.type !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
        }
        
        // Verify admin exists in database
        const admin = await Admin.findByPk(decoded.id);
        
        if (!admin) {
            return res.status(401).json({ message: 'Invalid admin credentials' });
        }
        
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

// Client Authentication Middleware
const clientAuth = async (req, res, next) => {
    const token = req.header('x-auth-token');
    
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        if (decoded.type !== 'client') {
            return res.status(403).json({ message: 'Access denied. Client privileges required.' });
        }
        
        // Verify client exists in database
        const client = await Client.findByPk(decoded.id);
        
        if (!client) {
            return res.status(401).json({ message: 'Invalid client credentials' });
        }
        
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

// Role-based Admin Authentication Middleware
const adminRoleAuth = (roles = []) => {
    return async (req, res, next) => {
        const token = req.header('x-auth-token');
        
        if (!token) {
            return res.status(401).json({ message: 'No token, authorization denied' });
        }
        
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            
            if (decoded.type !== 'admin') {
                return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
            }
            
            // If roles are specified, check if admin has required role
            if (roles.length && !roles.includes(decoded.role)) {
                return res.status(403).json({ 
                    message: `Access denied. Required role: ${roles.join(' or ')}`
                });
            }
            
            // Verify admin exists in database
            const admin = await Admin.findByPk(decoded.id);
            
            if (!admin) {
                return res.status(401).json({ message: 'Invalid admin credentials' });
            }
            
            req.user = decoded;
            next();
        } catch (err) {
            res.status(401).json({ message: 'Token is not valid' });
        }
    };
};

module.exports = {
    auth,
    adminAuth,
    clientAuth,
    adminRoleAuth
};
