const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const WebhookLog = sequelize.define('WebhookLog', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    source: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: 'WooCommerce'
    },
    event: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: 'order.created'
    },
    payload: {
        type: DataTypes.JSON,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('success', 'error'),
        defaultValue: 'success'
    },
    errorMessage: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'error_message'
    },
    ipAddress: {
        type: DataTypes.STRING(45),
        allowNull: true,
        field: 'ip_address'
    }
}, {
    tableName: 'webhook_logs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = WebhookLog;
