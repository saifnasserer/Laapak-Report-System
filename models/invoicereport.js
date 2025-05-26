const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const InvoiceReport = sequelize.define('InvoiceReport', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    invoice_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
        references: {
            model: 'invoices',
            key: 'id'
        }
    },
    report_id: {
        type: DataTypes.STRING(50),
        allowNull: false,
        references: {
            model: 'reports',
            key: 'id'
        }
    }
}, {
    tableName: 'invoice_reports',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = InvoiceReport;
