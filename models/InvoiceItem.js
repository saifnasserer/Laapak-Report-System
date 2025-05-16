const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const InvoiceItem = sequelize.define('InvoiceItem', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    invoiceId: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'invoiceId',
        references: { model: 'invoices', key: 'id' }
    },
    description: {
        type: DataTypes.STRING,
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('laptop', 'item', 'service'),
        allowNull: false
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    quantity: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    serialNumber: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'invoice_items',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
});

module.exports = InvoiceItem;
