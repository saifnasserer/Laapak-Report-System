const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class ReportTechnicalTest extends Model {}

ReportTechnicalTest.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  reportId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'reports', // name of the target table
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
  sequelize,
  modelName: 'ReportTechnicalTest',
  tableName: 'report_technical_tests',
  timestamps: false // Assuming no createdAt/updatedAt for this table based on schema, adjust if needed
});

module.exports = ReportTechnicalTest;
