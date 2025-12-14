const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const BudgetAllocation = sequelize.define('BudgetAllocation', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    category_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'category_id',
        references: { model: 'expense_categories', key: 'id' }
    },
    month_year: {
        type: DataTypes.STRING(7),
        allowNull: false,
        field: 'month_year',
        comment: 'Format: YYYY-MM'
    },
    allocated_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: 'allocated_amount'
    },
    spent_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0.00,
        field: 'spent_amount'
    },
    remaining_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        field: 'remaining_amount',
        comment: 'STORED GENERATED: allocated_amount - spent_amount'
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'created_by',
        references: { model: 'admins', key: 'id' }
    }
}, {
    tableName: 'budget_allocations',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = BudgetAllocation;
