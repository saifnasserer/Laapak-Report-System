const express = require('express');
const { ShoppingList, ShoppingListItem, Admin } = require('../models');
const { adminAuth } = require('../middleware/auth');
const { getExchangeRate } = require('../utils/currency-service');
const router = express.Router();

/**
 * @route   GET /api/shopping-lists/p/:publicId
 * @desc    Publicly access a shopping list
 * @access  Public
 */
router.get('/p/:publicId', async (req, res) => {
    try {
        const list = await ShoppingList.findOne({
            where: { public_id: req.params.publicId },
            include: [{
                model: ShoppingListItem,
                as: 'items',
                attributes: ['id', 'brand', 'model', 'quantity', 'price', 'is_checked']
            }]
        });

        if (!list) {
            return res.status(404).json({ success: false, message: 'Shopping list not found' });
        }

        res.json({ success: true, data: list });
    } catch (err) {
        console.error('Public List Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * @route   GET /api/shopping-lists
 * @desc    Get all lists for the logged-in admin
 * @access  Admin
 */
router.get('/', adminAuth, async (req, res) => {
    try {
        const lists = await ShoppingList.findAll({
            where: { user_id: req.user.id },
            include: [{
                model: ShoppingListItem,
                as: 'items',
                attributes: ['id', 'brand', 'model', 'quantity', 'price', 'is_checked']
            }],
            order: [['created_at', 'DESC']]
        });
        res.json({ success: true, data: lists });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * @route   POST /api/shopping-lists
 * @desc    Create a new shopping list
 * @access  Admin
 */
router.post('/', adminAuth, async (req, res) => {
    try {
        const { name, currency, settings, items } = req.body;

        const list = await ShoppingList.create({
            name,
            currency: currency || 'EGP',
            user_id: req.user.id,
            settings: settings || {
                showCheckboxes: true,
                allowPublicCheck: false
            }
        });

        // If items are provided during creation
        if (items && Array.isArray(items)) {
            const listItems = items.map(item => ({
                ...item,
                list_id: list.id
            }));
            await ShoppingListItem.bulkCreate(listItems);
        }

        res.json({ success: true, data: list });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * @route   PATCH /api/shopping-lists/:id
 * @desc    Update shopping list name or settings
 * @access  Admin
 */
router.patch('/:id', adminAuth, async (req, res) => {
    try {
        const list = await ShoppingList.findOne({
            where: { id: req.params.id, user_id: req.user.id }
        });

        if (!list) {
            return res.status(404).json({ success: false, message: 'List not found' });
        }

        // Check if currency is changing
        if (req.body.currency && req.body.currency !== list.currency) {
            const oldCurrency = list.currency;
            const newCurrency = req.body.currency;

            // Get live exchange rate
            const rate = await getExchangeRate(oldCurrency, newCurrency);

            // Update all items in this list
            const items = await ShoppingListItem.findAll({ where: { list_id: list.id } });

            for (const item of items) {
                const newPrice = Math.round((item.price * rate) * 100) / 100; // Round to 2 decimals
                await item.update({ price: newPrice });
            }
        }

        await list.update(req.body);

        // Return updated list with items to reflect price changes in frontend
        const updatedList = await ShoppingList.findByPk(list.id, {
            include: [{
                model: ShoppingListItem,
                as: 'items',
                attributes: ['id', 'brand', 'model', 'quantity', 'price', 'is_checked']
            }]
        });

        res.json({ success: true, data: updatedList });
    } catch (err) {
        console.error('List Update Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * @route   DELETE /api/shopping-lists/:id
 * @desc    Delete a shopping list
 * @access  Admin
 */
router.delete('/:id', adminAuth, async (req, res) => {
    try {
        const list = await ShoppingList.findOne({
            where: { id: req.params.id, user_id: req.user.id }
        });

        if (!list) {
            return res.status(404).json({ success: false, message: 'List not found' });
        }

        await list.destroy();
        res.json({ success: true, message: 'List deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * @route   POST /api/shopping-lists/:id/items
 * @desc    Add an item to a specific list
 * @access  Admin
 */
router.post('/:id/items', adminAuth, async (req, res) => {
    try {
        const list = await ShoppingList.findOne({
            where: { id: req.params.id, user_id: req.user.id }
        });

        if (!list) {
            return res.status(404).json({ success: false, message: 'List not found' });
        }

        const item = await ShoppingListItem.create({
            list_id: list.id,
            brand: req.body.brand,
            model: req.body.model,
            quantity: req.body.quantity || 1,
            price: req.body.price || 0
        });

        res.json({ success: true, data: item });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * @route   PATCH /api/shopping-lists/items/:itemId
 * @desc    Update a shopping list item (admin)
 * @access  Admin
 */
router.patch('/items/:itemId', adminAuth, async (req, res) => {
    try {
        const item = await ShoppingListItem.findByPk(req.params.itemId, {
            include: [{ model: ShoppingList, as: 'list' }]
        });

        if (!item || item.list.user_id !== req.user.id) {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }

        await item.update(req.body);
        res.json({ success: true, data: item });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * @route   DELETE /api/shopping-lists/items/:itemId
 * @desc    Remove an item from a shopping list
 * @access  Admin
 */
router.delete('/items/:itemId', adminAuth, async (req, res) => {
    try {
        const item = await ShoppingListItem.findByPk(req.params.itemId, {
            include: [{ model: ShoppingList, as: 'list' }]
        });

        if (!item || item.list.user_id !== req.user.id) {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }

        await item.destroy();
        res.json({ success: true, message: 'Item removed' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * @route   PATCH /api/shopping-lists/p/:publicId/check/:itemId
 * @desc    Allow toggling is_checked via public link (if enabled in settings)
 * @access  Public
 */
router.patch('/p/:publicId/check/:itemId', async (req, res) => {
    try {
        const item = await ShoppingListItem.findByPk(req.params.itemId, {
            include: [{ model: ShoppingList, as: 'list' }]
        });

        if (!item || item.list.public_id !== req.params.publicId) {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }

        // Security check: Only allow if list settings permit public toggling
        if (!item.list.settings?.allowPublicCheck) {
            return res.status(403).json({ success: false, message: 'Public modification is disabled for this list' });
        }

        await item.update({ is_checked: req.body.is_checked });
        res.json({ success: true, data: item });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
