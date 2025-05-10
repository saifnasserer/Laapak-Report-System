/**
 * Laapak Report System - Report Model
 * Defines the structure for device inspection reports
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Report = sequelize.define('Report', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderNumber: {
    type: DataTypes.STRING,
    allowNull: false
  },
  inspectionDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  deviceModel: {
    type: DataTypes.STRING,
    allowNull: false
  },
  serialNumber: {
    type: DataTypes.STRING,
    allowNull: false
  },
  // Technical component tests
  cpuStatus: DataTypes.STRING,
  gpuStatus: DataTypes.STRING,
  ramStatus: DataTypes.STRING,
  storageStatus: DataTypes.STRING,
  batteryStatus: DataTypes.STRING,
  screenStatus: DataTypes.STRING,
  keyboardStatus: DataTypes.STRING,
  touchpadStatus: DataTypes.STRING,
  wifiStatus: DataTypes.STRING,
  bluetoothStatus: DataTypes.STRING,
  
  // External physical inspection
  externalCondition: DataTypes.TEXT,
  caseCondition: DataTypes.STRING,
  screenCondition: DataTypes.STRING,
  keyboardCondition: DataTypes.STRING,
  
  // General notes
  notes: DataTypes.TEXT,
  
  // Invoice information
  invoiceNumber: DataTypes.STRING,
  invoiceAmount: DataTypes.DECIMAL(10, 2),
  invoiceDate: DataTypes.DATE,
  
  // Warranty information
  warrantyStatus: DataTypes.STRING,
  warrantyExpiration: DataTypes.DATE,
  
  // Status and relationships
  status: {
    type: DataTypes.ENUM('pending', 'in-progress', 'completed', 'cancelled'),
    defaultValue: 'pending'
  },
  clientId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Clients',
      key: 'id'
    }
  },
  technicianId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Admins',
      key: 'id'
    }
  },
  // Timestamps are automatically added by Sequelize (createdAt, updatedAt)
});

module.exports = Report;
