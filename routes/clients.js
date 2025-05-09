/**
 * Laapak Report System - Client Management Routes
 * Handles client CRUD operations and authentication
 */

const express = require('express');
const router = express.Router();
const { Client } = require('../models');
const { auth, adminAuth } = require('../middleware/auth');
const { check, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { Op } = require('sequelize');

// @route   GET api/clients
// @desc    Get all clients
// @access  Private (Admin only)
router.get('/', adminAuth, (req, res) => {
    try {
        // Find all clients
        Client.findAll({
            order: [['createdAt', 'DESC']]
        })
        .then(clients => {
            res.json({ clients });
        })
        .catch(err => {
            console.error('Error fetching clients:', err);
            res.status(500).json({ message: 'خطأ في الخادم' });
        });
    } catch (err) {
        console.error('Error in GET /clients route:', err);
        res.status(500).json({ message: 'خطأ في الخادم' });
    }
});

// @route   GET api/clients/:id
// @desc    Get client by ID
// @access  Private (Admin only)
router.get('/:id', adminAuth, (req, res) => {
    Client.findByPk(req.params.id)
        .then(client => {
            if (!client) {
                return res.status(404).json({ message: 'العميل غير موجود' });
            }
            res.json({ client });
        })
        .catch(err => {
            console.error('Error fetching client:', err);
            res.status(500).json({ message: 'خطأ في الخادم' });
        });
});

// @route   POST api/clients
// @desc    Create a new client
// @access  Private (Admin only)
router.post('/', [
    adminAuth,
    [
        check('name', 'اسم العميل مطلوب').not().isEmpty(),
        check('phone', 'رقم الهاتف مطلوب').not().isEmpty(),
        check('orderCode', 'كود الطلب مطلوب').not().isEmpty(),
        check('email', 'البريد الإلكتروني غير صالح').optional().isEmail()
    ]
], (req, res) => {
    // Check validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, phone, email, address, orderCode, status } = req.body;

    // Check if client with phone already exists
    Client.findOne({ where: { phone } })
        .then(existingClient => {
            if (existingClient) {
                return res.status(400).json({ message: 'يوجد عميل مسجل بهذا الرقم بالفعل' });
            }

            // Create new client
            return Client.create({
                name,
                phone,
                email: email || null,
                address: address || null,
                orderCode,
                status: status || 'active'
            });
        })
        .then(client => {
            res.status(201).json({ client });
        })
        .catch(err => {
            console.error('Error creating client:', err);
            res.status(500).json({ message: 'خطأ في الخادم' });
        });
});

// @route   PUT api/clients/:id
// @desc    Update a client
// @access  Private (Admin only)
router.put('/:id', adminAuth, (req, res) => {
    const { name, phone, email, address, status } = req.body;
    
    // Find client
    Client.findByPk(req.params.id)
        .then(client => {
            if (!client) {
                return res.status(404).json({ message: 'العميل غير موجود' });
            }

            // Check if phone is being changed and already exists
            if (phone && phone !== client.phone) {
                return Client.findOne({ where: { phone } })
                    .then(existingClient => {
                        if (existingClient) {
                            throw new Error('يوجد عميل آخر مسجل بهذا الرقم بالفعل');
                        }
                        return client;
                    });
            }
            return client;
        })
        .then(client => {
            // Update client
            return client.update({
                name: name || client.name,
                phone: phone || client.phone,
                email: email !== undefined ? email : client.email,
                address: address !== undefined ? address : client.address,
                status: status || client.status
            });
        })
        .then(updatedClient => {
            res.json({ client: updatedClient });
        })
        .catch(err => {
            console.error('Error updating client:', err);
            if (err.message === 'يوجد عميل آخر مسجل بهذا الرقم بالفعل') {
                return res.status(400).json({ message: err.message });
            }
            res.status(500).json({ message: 'خطأ في الخادم' });
        });
});

// @route   DELETE api/clients/:id
// @desc    Delete a client
// @access  Private (Admin only)
router.delete('/:id', adminAuth, (req, res) => {
    // Find client
    Client.findByPk(req.params.id)
        .then(client => {
            if (!client) {
                return res.status(404).json({ message: 'العميل غير موجود' });
            }
            // Delete client
            return client.destroy();
        })
        .then(() => {
            res.json({ message: 'تم حذف العميل بنجاح' });
        })
        .catch(err => {
            console.error('Error deleting client:', err);
            res.status(500).json({ message: 'خطأ في الخادم' });
        });
});

// @route   POST api/clients/auth
// @desc    Authenticate client & get token
// @access  Public
router.post('/auth', [
    check('phone', 'رقم الهاتف مطلوب').not().isEmpty(),
    check('orderCode', 'كود الطلب مطلوب').not().isEmpty()
], (req, res) => {
    // Check validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { phone, orderCode } = req.body;
    console.log('Client login attempt:', { phone, orderCode });

    // Find client by phone
    Client.findOne({ where: { phone } })
        .then(client => {
            if (!client) {
                console.log('Client not found with phone:', phone);
                return res.status(400).json({ message: 'بيانات الدخول غير صحيحة' });
            }

            console.log('Client found:', client.name, 'Expected orderCode:', client.orderCode, 'Received orderCode:', orderCode);

            // Check order code
            if (client.orderCode !== orderCode) {
                console.log('Order code mismatch');
                return res.status(400).json({ message: 'بيانات الدخول غير صحيحة' });
            }

            console.log('Order code matched, updating last login');

            // Update last login
            return client.update({ lastLogin: new Date() })
                .then(() => {
                    // Create JWT payload
                    const payload = {
                        user: {
                            id: client.id,
                            isClient: true,
                            isAdmin: false
                        }
                    };

                    console.log('Creating token with payload:', payload);

                    // Sign token
                    jwt.sign(
                        payload,
                        config.jwtSecret,
                        { expiresIn: '1d' },
                        (err, token) => {
                            if (err) {
                                console.error('Token signing error:', err);
                                throw err;
                            }
                            
                            const response = {
                                token,
                                client: {
                                    id: client.id,
                                    name: client.name,
                                    phone: client.phone,
                                    email: client.email
                                }
                            };
                            
                            console.log('Sending successful login response');
                            res.json(response);
                        }
                    );
                });
        })
        .catch(err => {
            console.error('Error authenticating client:', err);
            res.status(500).json({ message: 'خطأ في الخادم' });
        });
});

module.exports = router;
