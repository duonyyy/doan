const { DataTypes } = require('sequelize');
const { getDbConnection } = require('../config/db.config');

const SanPham = getDbConnection().define('SanPham', {
  MaSP: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'MaSP'
  },
  TenSP: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'TenSP'
  },
  DonVi: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'DonVi'
  },
  MaNCC: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'MaNCC',
    references: {
      model: 'NhaCungCap',
      key: 'MaNCC'
    }
  },
  MoTa: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'MoTa'
  }
}, {
  tableName: 'SanPham',
  timestamps: false
});

module.exports = SanPham;
