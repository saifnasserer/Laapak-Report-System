const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ApiKey = sequelize.define('ApiKey', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    key_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'key_name',
        comment: 'Human-readable name for the API key'
    },
    api_key: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        field: 'api_key',
        comment: 'Hashed API key'
    },
    key_prefix: {
        type: DataTypes.STRING(20),
        allowNull: false,
        field: 'key_prefix',
        comment: 'Key prefix (e.g., ak_live_, ak_test_)'
    },
    client_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'client_id',
        references: { model: 'clients', key: 'id' },
        comment: 'Associated client (optional for client-specific keys)'
    },
    permissions: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {
            reports: { read: true, write: false, delete: false },
            invoices: { read: true, write: false, delete: false },
            clients: { read: true, write: false, delete: false },
            financial: { read: false, write: false, delete: false }
        },
        comment: 'JSON object defining API key permissions'
    },
    rate_limit: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1000,
        field: 'rate_limit',
        comment: 'Requests per hour limit'
    },
    expires_at: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'expires_at',
        comment: 'Optional expiration date'
    },
    last_used: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'last_used',
        comment: 'Last usage timestamp'
    },
    usage_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'usage_count',
        comment: 'Total usage count'
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'is_active',
        comment: 'Enable/disable key'
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'created_by',
        references: { model: 'admins', key: 'id' },
        comment: 'Admin who created this key'
    },
    ip_whitelist: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'ip_whitelist',
        comment: 'Comma-separated list of allowed IP addresses'
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Description of the API key purpose'
    }
}, {
    tableName: 'api_keys',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            fields: ['api_key']
        },
        {
            fields: ['client_id']
        },
        {
            fields: ['is_active']
        },
        {
            fields: ['expires_at']
        }
    ]
});

module.exports = ApiKey;
