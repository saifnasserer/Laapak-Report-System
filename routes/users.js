/**
 * Laapak Report System - Users Routes
 * Handles user management endpoints for admins and clients
 */

const express = require('express');
const router = express.Router();
const { Admin, Client } = require('../models');
const { auth, adminAuth, adminRoleAuth } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// Get all admins (admin only)
router.get('/admins', adminRoleAuth(['admin']), async (req, res) => {
    try {
        const admins = await Admin.findAll({
            attributes: { exclude: ['password'] }
        });
        
        res.json(admins);
    } catch (error) {
        console.error('Get admins error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get admin by ID (admin only)
router.get('/admins/:id', adminAuth, async (req, res) => {
    try {
        const admin = await Admin.findByPk(req.params.id, {
            attributes: { exclude: ['password'] }
        });
        
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }
        
        res.json(admin);
    } catch (error) {
        console.error('Get admin error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create new admin (admin role only)
router.post('/admins', adminRoleAuth(['admin']), async (req, res) => {
    const { username, password, name, role, email } = req.body;
    
    if (!username || !password || !name || !role) {
        return res.status(400).json({ message: 'Please provide all required fields' });
    }
    
    try {
        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ where: { username } });
        
        if (existingAdmin) {
            return res.status(400).json({ message: 'Username already exists' });
        }
        
        // Create new admin
        const newAdmin = await Admin.create({
            username,
            password, // Will be hashed by the model hooks
            name,
            role,
            email
        });
        
        // Return new admin without password
        const adminData = newAdmin.toJSON();
        delete adminData.password;
        
        res.status(201).json(adminData);
    } catch (error) {
        console.error('Create admin error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update admin (admin role or self)
router.put('/admins/:id', adminAuth, async (req, res) => {
    const { name, email, password, role } = req.body;
    
    try {
        const admin = await Admin.findByPk(req.params.id);
        
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }
        
        // Only allow admins to update other admins' roles
        if (req.user.role !== 'admin' && req.user.id !== admin.id) {
            return res.status(403).json({ message: 'Not authorized to update this admin' });
        }
        
        // Only allow role changes by admins
        if (role && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admins can change roles' });
        }
        
        // Update fields
        if (name) admin.name = name;
        if (email) admin.email = email;
        if (password) admin.password = password; // Will be hashed by model hooks
        if (role && req.user.role === 'admin') admin.role = role;
        
        await admin.save();
        
        // Return updated admin without password
        const adminData = admin.toJSON();
        delete adminData.password;
        
        res.json(adminData);
    } catch (error) {
        console.error('Update admin error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete admin (admin role only)
router.delete('/admins/:id', adminRoleAuth(['admin']), async (req, res) => {
    try {
        const admin = await Admin.findByPk(req.params.id);
        
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }
        
        // Prevent deleting self
        if (req.user.id === admin.id) {
            return res.status(400).json({ message: 'Cannot delete your own account' });
        }
        
        await admin.destroy();
        
        res.json({ message: 'Admin deleted successfully' });
    } catch (error) {
        console.error('Delete admin error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all clients (admin only)
router.get('/clients', adminAuth, async (req, res) => {
    try {
        const clients = await Client.findAll();
        
        res.json(clients);
    } catch (error) {
        console.error('Get clients error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get client by ID (admin or self)
router.get('/clients/:id', auth, async (req, res) => {
    try {
        // Check if user is authorized to view this client
        if (req.user.type !== 'admin' && req.user.id !== req.params.id) {
            return res.status(403).json({ message: 'Not authorized to view this client' });
        }
        
        const client = await Client.findByPk(req.params.id);
        
        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }
        
        res.json(client);
    } catch (error) {
        console.error('Get client error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create new client (admin only)
router.post('/clients', adminAuth, async (req, res) => {
    const { name, phone, orderCode, email, address } = req.body;
    
    if (!name || !phone || !orderCode) {
        return res.status(400).json({ message: 'Please provide all required fields' });
    }
    
    try {
        // Check if client already exists
        const existingClient = await Client.findOne({ where: { phone } });
        
        if (existingClient) {
            return res.status(400).json({ message: 'Phone number already exists' });
        }
        
        // Create new client
        const newClient = await Client.create({
            name,
            phone,
            orderCode,
            email,
            address
        });
        
        res.status(201).json(newClient);
    } catch (error) {
        console.error('Create client error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update client (admin or self)
router.put('/clients/:id', auth, async (req, res) => {
    const { name, email, address } = req.body;
    
    try {
        // Check if user is authorized to update this client
        if (req.user.type !== 'admin' && req.user.id !== req.params.id) {
            return res.status(403).json({ message: 'Not authorized to update this client' });
        }
        
        const client = await Client.findByPk(req.params.id);
        
        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }
        
        // Update fields
        if (name) client.name = name;
        if (email) client.email = email;
        if (address) client.address = address;
        
        // Only admins can update phone and orderCode
        if (req.user.type === 'admin') {
            if (req.body.phone) client.phone = req.body.phone;
            if (req.body.orderCode) client.orderCode = req.body.orderCode;
        }
        
        await client.save();
        
        res.json(client);
    } catch (error) {
        console.error('Update client error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete client (admin only)
router.delete('/clients/:id', adminAuth, async (req, res) => {
    try {
        const client = await Client.findByPk(req.params.id);
        
        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }
        
        await client.destroy();
        
        res.json({ message: 'Client deleted successfully' });
    } catch (error) {
        console.error('Delete client error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Change password (admin or self)
router.post('/change-password', adminAuth, async (req, res) => {
    const { currentPassword, newPassword, userId } = req.body;
    
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Please provide current and new password' });
    }
    
    try {
        // If userId is provided and user is admin, change another admin's password
        const targetId = userId || req.user.id;
        
        // Only admins can change other users' passwords
        if (targetId !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to change this password' });
        }
        
        const admin = await Admin.findByPk(targetId);
        
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }
        
        // If changing own password, verify current password
        if (targetId === req.user.id) {
            const isMatch = await admin.checkPassword(currentPassword);
            
            if (!isMatch) {
                return res.status(400).json({ message: 'Current password is incorrect' });
            }
        }
        
        // Update password
        admin.password = newPassword; // Will be hashed by model hooks
        await admin.save();
        
        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
