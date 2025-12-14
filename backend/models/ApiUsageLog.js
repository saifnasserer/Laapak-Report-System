const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ApiUsageLog = sequelize.define('ApiUsageLog', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    api_key_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'api_key_id',
        references: { model: 'api_keys', key: 'id' }
    },
    endpoint: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: 'API endpoint accessed'
    },
    method: {
        type: DataTypes.ENUM('GET', 'POST', 'PUT', 'DELETE', 'PATCH'),
        allowNull: false,
        comment: 'HTTP method used'
    },
    client_ip: {
        type: DataTypes.STRING(45),
        allowNull: false,
        field: 'client_ip',
        comment: 'Client IP address'
    },
    user_agent: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'user_agent',
        comment: 'User agent string'
    },
    response_status: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'response_status',
        comment: 'HTTP response status code'
    },
    response_time: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'response_time',
        comment: 'Response time in milliseconds'
    },
    request_size: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'request_size',
        comment: 'Request size in bytes'
    },
    response_size: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'response_size',
        comment: 'Response size in bytes'
    },
    error_message: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'error_message',
        comment: 'Error message if request failed'
    },
    request_data: {
        type: DataTypes.JSON,
        allowNull: true,
        field: 'request_data',
        comment: 'Request data (for debugging, limited size)'
    }
}, {
    tableName: 'api_usage_logs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
        {
            fields: ['api_key_id']
        },
        {
            fields: ['endpoint']
        },
        {
            fields: ['response_status']
        },
        {
            fields: ['created_at']
        },
        {
            fields: ['client_ip']
        }
    ]
});

module.exports = ApiUsageLog;
