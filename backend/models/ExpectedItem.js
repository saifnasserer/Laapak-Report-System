/**
 * ExpectedItem Model
 * Tracks expected payments, work in progress, and inventory items
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ExpectedItem = sequelize.define('ExpectedItem', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    type: {
        type: DataTypes.ENUM('expected_payment', 'work_in_progress', 'inventory_item', 'liability'),
        allowNull: false,
        comment: 'Type of expected item'
    },
    title: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: 'Title or name of the item'
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Detailed description'
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        comment: 'Expected amount in EGP'
    },
    expected_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        comment: 'Expected date for payment/completion'
    },
    from_whom: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: 'Client name or source'
    },
    contact: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Phone number or contact info'
    },
    status: {
        type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
        comment: 'Current status of the item'
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Additional notes'
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Admin ID who created this item'
    }
}, {
    tableName: 'expected_items',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            fields: ['type']
        },
        {
            fields: ['status']
        },
        {
            fields: ['expected_date']
        },
        {
            fields: ['created_at']
        }
    ]
});

module.exports = ExpectedItem;
