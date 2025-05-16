const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Invoice = sequelize.define('Invoice', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    reportId: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'reportId',
        references: { model: 'reports', key: 'id' }
    },
    client_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'clientId',
        references: { model: 'clients', key: 'id' }
    },
    date: {
        type: DataTypes.DATE,
        allowNull: false
    },
    subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    discount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0
    },
    taxRate: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 14.00
    },
    tax: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    paymentStatus: {
        type: DataTypes.ENUM('unpaid', 'partial', 'paid'),
        defaultValue: 'unpaid'
    },
    paymentMethod: {
        type: DataTypes.STRING,
        allowNull: true
    },
    paymentDate: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'invoices',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = Invoice;
