const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const OutgoingWebhook = sequelize.define('OutgoingWebhook', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    url: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            isUrl: true
        }
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: true,
        defaultValue: 'Webhook Subscription'
    },
    secret: {
        type: DataTypes.STRING(255),
        allowNull: false,
        defaultValue: () => require('crypto').randomBytes(32).toString('hex')
    },
    events: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: ['report.created'],
        comment: 'JSON array of events to subscribe to'
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive'),
        defaultValue: 'active'
    },
    last_triggered_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    last_response_code: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    last_error_message: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'outgoing_webhooks',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = OutgoingWebhook;
