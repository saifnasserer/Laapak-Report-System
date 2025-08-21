/**
 * Laapak Report System - Expense Model
 * Defines business expenses for financial tracking
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Expense = sequelize.define('Expense', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    name_ar: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'name_ar',
        validate: {
            notEmpty: true
        }
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    },
    category_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'category_id',
        references: { model: 'expense_categories', key: 'id' }
    },
    type: {
        type: DataTypes.ENUM('fixed', 'variable'),
        allowNull: false,
        defaultValue: 'variable'
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    repeat_monthly: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'repeat_monthly'
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    receipt_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: 'receipt_url',
        validate: {
            isUrl: true
        }
    },
    status: {
        type: DataTypes.ENUM('pending', 'approved', 'paid', 'cancelled'),
        defaultValue: 'approved'
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'created_by',
        references: { model: 'admins', key: 'id' }
    },
    approved_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'approved_by',
        references: { model: 'admins', key: 'id' }
    },
    money_location_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'money_location_id',
        references: { model: 'money_locations', key: 'id' }
    }
}, {
    tableName: 'expenses',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = Expense; 