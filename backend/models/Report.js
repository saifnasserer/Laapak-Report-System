const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Report = sequelize.define('Report', {
    id: {
        type: DataTypes.STRING(50),
        primaryKey: true
    },
    client_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'clients', key: 'id' },
        field: 'client_id'
    },
    client_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'client_name'
    },
    client_phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
        field: 'client_phone'
    },
    client_email: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'client_email'
    },
    client_address: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'client_address'
    },
    order_number: {
        type: DataTypes.STRING(20),
        allowNull: false,
        field: 'order_number'
    },
    device_model: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'device_model'
    },
    serial_number: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'serial_number'
    },
    cpu: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'cpu',
        comment: 'CPU specification'
    },
    gpu: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'gpu',
        comment: 'GPU specification'
    },
    ram: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'ram',
        comment: 'RAM specification'
    },
    storage: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'storage',
        comment: 'Storage specification'
    },
    inspection_date: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'inspection_date'
    },
    hardware_status: {
        type: DataTypes.TEXT('long'),
        allowNull: true,
        field: 'hardware_status'
    },
    external_images: {
        type: DataTypes.TEXT('long'),
        allowNull: true,
        field: 'external_images'
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    billing_enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'billing_enabled'
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    // Add invoice tracking fields
    invoice_created: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'invoice_created',
        comment: 'Indicates if an invoice has been created for this report'
    },
    invoice_id: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'invoice_id',
        comment: 'Reference to the created invoice ID'
    },
    invoice_date: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'invoice_date',
        comment: 'Date when invoice was created'
    },
    status: {
        type: DataTypes.ENUM('قيد الانتظار', 'قيد المعالجة', 'مكتمل', 'ملغى', 'pending', 'in-progress', 'completed', 'cancelled', 'canceled', 'active'),
        defaultValue: 'قيد الانتظار'
    },
    admin_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'admin_id',
        comment: 'Admin who created or last modified this report'
    },
    warranty_alerts_log: {
        type: DataTypes.JSON,
        allowNull: true,
        field: 'warranty_alerts_log',
        comment: 'Log of sent warranty alerts (6-month, annual)'
    }
}, {
    tableName: 'reports',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = Report;
