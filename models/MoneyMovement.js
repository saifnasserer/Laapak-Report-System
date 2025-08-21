/**
 * Laapak Report System - Money Movement Model
 * Tracks all money movements between different locations (transfers, deposits, withdrawals)
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const MoneyMovement = sequelize.define('MoneyMovement', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    from_location_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'from_location_id',
        references: { model: 'money_locations', key: 'id' }
    },
    to_location_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'to_location_id',
        references: { model: 'money_locations', key: 'id' }
    },
    amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    },
    movement_type: {
        type: DataTypes.ENUM('transfer', 'deposit', 'withdrawal', 'payment_received', 'expense_paid'),
        allowNull: false,
        field: 'movement_type'
    },
    reference_type: {
        type: DataTypes.ENUM('invoice', 'expense', 'manual', 'other'),
        allowNull: false,
        field: 'reference_type'
    },
    reference_id: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'reference_id'
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    movement_date: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'movement_date',
        defaultValue: DataTypes.NOW
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'created_by',
        references: { model: 'admins', key: 'id' }
    }
}, {
    tableName: 'money_movements',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Static method to create a transfer between locations
MoneyMovement.createTransfer = async function(fromLocationId, toLocationId, amount, description, createdBy) {
    const { MoneyLocation } = require('./index');
    
    // Validate locations exist
    const fromLocation = fromLocationId ? await MoneyLocation.findByPk(fromLocationId) : null;
    const toLocation = await MoneyLocation.findByPk(toLocationId);
    
    if (!toLocation) {
        throw new Error('Destination location not found');
    }
    
    if (fromLocationId && !fromLocation) {
        throw new Error('Source location not found');
    }
    
    // Create the movement record
    const movement = await this.create({
        from_location_id: fromLocationId,
        to_location_id: toLocationId,
        amount: amount,
        movement_type: 'transfer',
        reference_type: 'manual',
        description: description,
        movement_date: new Date(),
        created_by: createdBy
    });
    
    // Update balances
    if (fromLocation) {
        await fromLocation.updateBalance(amount, 'withdrawal');
    }
    await toLocation.updateBalance(amount, 'deposit');
    
    return movement;
};

// Static method to record payment received
MoneyMovement.recordPaymentReceived = async function(locationId, amount, invoiceId, createdBy) {
    const { MoneyLocation } = require('./index');
    
    const location = await MoneyLocation.findByPk(locationId);
    if (!location) {
        throw new Error('Location not found');
    }
    
    const movement = await this.create({
        to_location_id: locationId,
        amount: amount,
        movement_type: 'payment_received',
        reference_type: 'invoice',
        reference_id: invoiceId,
        description: `Payment received for invoice ${invoiceId}`,
        movement_date: new Date(),
        created_by: createdBy
    });
    
    await location.updateBalance(amount, 'payment_received');
    return movement;
};

// Static method to record expense paid
MoneyMovement.recordExpensePaid = async function(locationId, amount, expenseId, createdBy) {
    const { MoneyLocation } = require('./index');
    
    const location = await MoneyLocation.findByPk(locationId);
    if (!location) {
        throw new Error('Location not found');
    }
    
    const movement = await this.create({
        from_location_id: locationId,
        amount: amount,
        movement_type: 'expense_paid',
        reference_type: 'expense',
        reference_id: expenseId,
        description: `Expense paid from ${location.name}`,
        movement_date: new Date(),
        created_by: createdBy
    });
    
    await location.updateBalance(amount, 'expense_paid');
    return movement;
};

module.exports = MoneyMovement;
