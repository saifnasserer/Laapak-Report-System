const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Invoice = sequelize.define('Invoice', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    reportId: {
        type: DataTypes.STRING(50),
        allowNull: false, // Make this required
        field: 'reportId',
        references: { 
            model: 'reports', 
            key: 'id' 
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
    client_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'client_id',
        references: { model: 'clients', key: 'id' }
    },
    date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
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
        type: DataTypes.ENUM('pending', 'completed', 'cancelled', 'unpaid', 'partial', 'paid'),
        defaultValue: 'pending'
    },
    paymentMethod: {
        type: DataTypes.STRING,
        allowNull: true
    },
    paymentDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    // Add metadata for better tracking
    created_from_report: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Indicates if invoice was created from a report'
    },
    report_order_number: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: 'Copy of report order number for quick reference'
    }
}, {
    tableName: 'invoices',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            fields: ['reportId']
        },
        {
            fields: ['client_id']
        },
        {
            fields: ['date']
        }
    ]
});

module.exports = Invoice;
