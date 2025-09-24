const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const InvoiceReportSummary = sequelize.define('InvoiceReportSummary', {
    invoice_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'invoice_id',
        primaryKey: true
    },
    reportId: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'reportId'
    },
    client_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'client_id',
        references: { model: 'clients', key: 'id' }
    },
    invoice_date: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'invoice_date'
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    invoice_status: {
        type: DataTypes.ENUM('pending', 'completed', 'cancelled', 'unpaid', 'partial', 'paid'),
        defaultValue: 'pending',
        field: 'invoice_status'
    },
    order_number: {
        type: DataTypes.STRING(20),
        allowNull: true,
        field: 'order_number'
    },
    inspection_date: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'inspection_date'
    },
    report_status: {
        type: DataTypes.ENUM('قيد الانتظار', 'قيد المعالجة', 'مكتمل', 'ملغى', 'pending', 'in-progress', 'completed', 'cancelled', 'canceled', 'active'),
        defaultValue: 'قيد الانتظار',
        field: 'report_status'
    },
    invoice_created: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'invoice_created'
    },
    report_invoice_id: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'report_invoice_id'
    }
}, {
    tableName: 'invoice_report_summary',
    timestamps: false
});

module.exports = InvoiceReportSummary;
