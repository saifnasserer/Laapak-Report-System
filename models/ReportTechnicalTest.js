/**
 * Laapak Report System - Report Technical Test Model
 * Represents technical tests performed on devices
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ReportTechnicalTest = sequelize.define('ReportTechnicalTest', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  reportId: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'reportId',
    references: {
      model: 'reports',
      key: 'id'
    }
  },
  componentName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'componentName'
  },
  status: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'status'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'notes'
  }
}, {
  tableName: 'report_technical_tests',
  timestamps: false
});

module.exports = ReportTechnicalTest;
