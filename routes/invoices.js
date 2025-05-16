/**
 * Laapak Report System - Invoices API Routes
 * Handles all invoice-related API endpoints
 */

const express = require('express');
const router = express.Router();
const { Invoice, InvoiceItem, Report, Client, sequelize } = require('../models');
const { auth, adminAuth, clientAuth } = require('../middleware/auth');
const { Op } = require('sequelize');

// Get all invoices (admin only)
router.get('/', adminAuth, async (req, res) => {
    try {
        const invoices = await Invoice.findAll({
            include: [
                { model: Client, attributes: ['id', 'name', 'phone'] },
                { model: Report, attributes: ['id', 'deviceModel', 'serialNumber'] }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json(invoices);
    } catch (error) {
        console.error('Error fetching invoices:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get client invoices
router.get('/client', clientAuth, async (req, res) => {
    try {
        const invoices = await Invoice.findAll({
            where: { clientId: req.user.id },
            include: [
                { model: Report, attributes: ['id', 'deviceModel', 'serialNumber'] }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json(invoices);
    } catch (error) {
        console.error('Error fetching client invoices:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get single invoice
router.get('/:id', auth, async (req, res) => {
    try {
        const invoice = await Invoice.findByPk(req.params.id, {
            include: [
                { model: Client, attributes: ['id', 'name', 'phone', 'email'] },
                { model: Report, attributes: ['id', 'deviceModel', 'serialNumber'] },
                { model: InvoiceItem }
            ]
        });
        
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }
        
        // Check if user has permission to view this invoice
        if (!req.user.isAdmin && invoice.clientId !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to view this invoice' });
        }
        
        res.json(invoice);
    } catch (error) {
        console.error('Error fetching invoice:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create new invoice
router.post('/', adminAuth, async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
        console.log('Creating invoice with data:', JSON.stringify(req.body, null, 2));
        
        const {
            reportId,
            clientId,
            subtotal,
            discount,
            taxRate,
            tax,
            total,
            paymentStatus,
            paymentMethod,
            items
        } = req.body;
        
        // Validate required fields
        if (!clientId) {
            return res.status(400).json({ 
                message: 'معرف العميل مطلوب',
                error: 'Client ID is required'
            });
        }
        
        if (!reportId) {
            return res.status(400).json({ 
                message: 'معرف التقرير مطلوب',
                error: 'Report ID is required'
            });
        }
        
        // Generate a unique invoice ID
        const invoiceId = 'INV' + Date.now().toString().slice(-6);
        console.log('Generated invoice ID:', invoiceId);
        
        // Create invoice
        const invoice = await Invoice.create({
            id: invoiceId,
            reportId,
            clientId,
            date: new Date(),
            subtotal,
            discount: discount || 0,
            taxRate: taxRate || 14.00,
            tax,
            total,
            paymentStatus: paymentStatus || 'unpaid',
            paymentMethod,
            paymentDate: paymentStatus === 'paid' ? new Date() : null
        }, { transaction });
        
        // Create invoice items
        if (items && items.length > 0) {
            await Promise.all(items.map(item => 
                InvoiceItem.create({
                    invoiceId: invoice.id,
                    description: item.description,
                    type: item.type,
                    amount: item.amount,
                    quantity: item.quantity || 1,
                    totalAmount: item.totalAmount,
                    serialNumber: item.serialNumber
                }, { transaction })
            ));
        }
        
        // Update report to mark it as having an invoice and update billing status
        if (reportId) {
            try {
                await Report.update(
                    { 
                        billingEnabled: true,
                        amount: total || 0
                    },
                    { 
                        where: { id: reportId },
                        transaction 
                    }
                );
                console.log(`Updated report ${reportId} with billing information`);
            } catch (updateError) {
                console.error('Error updating report billing status:', updateError);
                // Continue with invoice creation even if report update fails
            }
        }
        
        await transaction.commit();
        
        // Fetch the complete invoice with all associations
        const completeInvoice = await Invoice.findByPk(invoice.id, {
            include: [
                { model: Client, attributes: ['id', 'name', 'phone', 'email'] },
                { model: Report, attributes: ['id', 'deviceModel', 'serialNumber'] },
                { model: InvoiceItem }
            ]
        });
        
        res.status(201).json(completeInvoice);
    } catch (error) {
        await transaction.rollback();
        console.error('Error creating invoice:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update invoice payment status
router.put('/:id/payment', adminAuth, async (req, res) => {
    try {
        const { paymentStatus, paymentMethod } = req.body;
        
        const invoice = await Invoice.findByPk(req.params.id);
        
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }
        
        // Update payment information
        await invoice.update({
            paymentStatus,
            paymentMethod,
            paymentDate: paymentStatus === 'paid' ? new Date() : null
        });
        
        res.json(invoice);
    } catch (error) {
        console.error('Error updating invoice payment:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete invoice
router.delete('/:id', adminAuth, async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
        const invoice = await Invoice.findByPk(req.params.id);
        
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }
        
        // If invoice has a report, update the report to mark it as not having an invoice
        if (invoice.reportId) {
            try {
                await Report.update(
                    { 
                        billingEnabled: false,
                        amount: 0
                    },
                    { 
                        where: { id: invoice.reportId },
                        transaction 
                    }
                );
                console.log(`Updated report ${invoice.reportId} to remove billing information`);
            } catch (updateError) {
                console.error('Error updating report billing status during invoice deletion:', updateError);
                // Continue with invoice deletion even if report update fails
            }
        }
        
        // Delete invoice items
        await InvoiceItem.destroy({
            where: { invoiceId: invoice.id },
            transaction
        });
        
        // Delete the invoice
        await invoice.destroy({ transaction });
        
        await transaction.commit();
        
        res.json({ message: 'Invoice deleted successfully' });
    } catch (error) {
        await transaction.rollback();
        console.error('Error deleting invoice:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
