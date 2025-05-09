/**
 * Laapak Report System - Authentication Routes
 * Handles all authentication-related endpoints
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { Admin, Client } = require('../models');
const { auth, adminAuth, clientAuth } = require('../middleware/auth');

// JWT Secret Key
const JWT_SECRET = process.env.JWT_SECRET || 'laapak-secret-key-change-in-production';

// Admin Login
router.post('/admin', async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ message: 'Please provide username and password' });
    }
    
    try {
        // Find admin by username
        const admin = await Admin.findOne({ where: { username } });
        
        if (!admin) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        
        // Check password
        const isMatch = await admin.checkPassword(password);
        
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        
        // Update last login time
        await admin.update({ lastLogin: new Date() });
        
        // Create JWT token
        const token = jwt.sign(
            { id: admin.id, username: admin.username, role: admin.role, type: 'admin' },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.json({
            token,
            user: {
                id: admin.id,
                name: admin.name,
                username: admin.username,
                role: admin.role
            }
        });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Client Login
router.post('/client', async (req, res) => {
    const { phone, orderCode } = req.body;
    
    if (!phone || !orderCode) {
        return res.status(400).json({ message: 'Please provide phone number and order code' });
    }
    
    try {
        // Find client by phone and order code
        const client = await Client.findOne({ 
            where: { 
                phone,
                orderCode
            } 
        });
        
        if (!client) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        
        // Update last login time
        await client.update({ lastLogin: new Date() });
        
        // Create JWT token
        const token = jwt.sign(
            { id: client.id, phone: client.phone, type: 'client' },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.json({
            token,
            user: {
                id: client.id,
                name: client.name,
                phone: client.phone
            }
        });
    } catch (error) {
        console.error('Client login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get current user
router.get('/me', auth, async (req, res) => {
    try {
        if (req.user.type === 'admin') {
            const admin = await Admin.findByPk(req.user.id, {
                attributes: { exclude: ['password'] }
            });
            
            if (!admin) {
                return res.status(404).json({ message: 'User not found' });
            }
            
            return res.json({
                id: admin.id,
                name: admin.name,
                username: admin.username,
                role: admin.role,
                email: admin.email,
                type: 'admin'
            });
        } else {
            const client = await Client.findByPk(req.user.id);
            
            if (!client) {
                return res.status(404).json({ message: 'User not found' });
            }
            
            return res.json({
                id: client.id,
                name: client.name,
                phone: client.phone,
                email: client.email,
                type: 'client'
            });
        }
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
