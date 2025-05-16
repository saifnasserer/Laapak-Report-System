/**
 * Laapak Report System - Report Model
 * Defines the structure for device inspection reports
 */

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
    field: 'client_id',
    references: {
      model: 'clients',
      key: 'id'
    }
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
  inspection_date: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'inspection_date'
  },
  hardware_status: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'hardware_status'
  },
  external_images: {
    type: DataTypes.JSON,
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
    defaultValue: 0,
  },
  status: {
    type: DataTypes.ENUM('pending', 'in-progress', 'completed', 'cancelled', 'active'),
    defaultValue: 'active'
  }
}, {
  tableName: 'reports',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Report;
