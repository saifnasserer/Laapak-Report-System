/**
 * Laapak Report System - Authentication Middleware
 * Handles JWT verification and user authentication for protected routes
 */

const jwt = require('jsonwebtoken');
const { Admin, Client } = require('../models');

// JWT Secret Key
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET is not defined in environment variables. Please set it before running the application.");
    process.exit(1);
}

// General Authentication Middleware
const auth = async (req, res, next) => {
    // Get token from header (support both x-auth-token and Authorization Bearer)
    const token = req.header('x-auth-token') || req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        // Handle different token formats (direct payload or nested in user property)
        if (decoded.user) {
            req.user = decoded.user;
        } else {
            req.user = decoded;
        }

        next();
    } catch (err) {
        console.error('Token verification error:', err.message);
        res.status(401).json({ message: 'Token is not valid' });
    }
};

// Admin Authentication Middleware
const adminAuth = async (req, res, next) => {
    const token = req.header('x-auth-token') || req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        // Check if user is admin either by type or isAdmin flag
        if (decoded.type !== 'admin' && !decoded.user?.isAdmin) {
            return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
        }

        // Verify admin exists in database
        const adminId = decoded.id || decoded.user?.id;
        const admin = await Admin.findByPk(adminId);

        if (!admin) {
            return res.status(401).json({ message: 'Invalid admin credentials' });
        }

        // Set user info in request
        req.user = decoded.user || decoded;
        if (!req.user.isAdmin) req.user.isAdmin = true;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

// Client Authentication Middleware
const clientAuth = async (req, res, next) => {
    const token = req.header('x-auth-token') || req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        // Check if user is client either by type or isClient flag
        if (decoded.type !== 'client' && !decoded.user?.isClient) {
            return res.status(403).json({ message: 'Access denied. Client privileges required.' });
        }

        // Verify client exists in database
        const clientId = decoded.id || decoded.user?.id;
        const client = await Client.findByPk(clientId);

        if (!client) {
            return res.status(401).json({ message: 'Invalid client credentials' });
        }

        // Set user info in request
        req.user = decoded.user || {
            id: decoded.id,
            isClient: true
        };
        req.client = client;
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
                console.log('Role check failed:', {
                    required: roles,
                    actual: decoded.role,
                    decoded: decoded
                });
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
