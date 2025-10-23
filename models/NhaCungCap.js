const { DataTypes } = require('sequelize');
const { getDbConnection } = require('../config/db.config');

const NhaCungCap = getDbConnection().define('NhaCungCap', {
  MaNCC: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'MaNCC'
  },
  TenNCC: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    field: 'TenNCC'
  },
  DiaChi: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'DiaChi'
  },
  SDT: {
    type: DataTypes.STRING(15),
    allowNull: true,
    field: 'SDT'
  }
}, {
  tableName: 'NhaCungCap',
  timestamps: false
});

module.exports = NhaCungCap;
