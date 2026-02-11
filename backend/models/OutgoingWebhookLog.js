const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const OutgoingWebhookLog = sequelize.define('OutgoingWebhookLog', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    webhook_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'outgoing_webhooks',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    event: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    payload: {
        type: DataTypes.JSON,
        allowNull: true
    },
    response_code: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    response_body: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    duration: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Response time in milliseconds'
    },
    status: {
        type: DataTypes.ENUM('success', 'failure'),
        allowNull: false
    },
    error_message: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'outgoing_webhook_logs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = OutgoingWebhookLog;
