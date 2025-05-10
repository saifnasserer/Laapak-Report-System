/**
 * Laapak Report System - Report Technical Test Model
 * Defines the structure for technical component tests in reports
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
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'Reports',
      key: 'id'
    }
  },
  componentName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'report_technical_tests',
  timestamps: false
});

module.exports = ReportTechnicalTest;
