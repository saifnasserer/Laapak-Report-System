/**
 * Laapak Report System - Expense Category Model
 * Defines expense categories for financial management
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ExpenseCategory = sequelize.define('ExpenseCategory', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    name_ar: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'name_ar',
        validate: {
            notEmpty: true
        }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    color: {
        type: DataTypes.STRING(7),
        defaultValue: '#007553',
        validate: {
            is: /^#[0-9A-F]{6}$/i // Validates hex color format
        }
    },
    budget_limit: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        field: 'budget_limit'
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active'
    }
}, {
    tableName: 'expense_categories',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = ExpenseCategory; 