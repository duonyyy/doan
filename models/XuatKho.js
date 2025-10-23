const { DataTypes } = require('sequelize');
const { getDbConnection } = require('../config/db.config');

const XuatKho = getDbConnection().define('XuatKho', {
  MaXuat: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'MaXuat'
  },
  MaKho: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'MaKho',
    references: {
      model: 'KhoHang',
      key: 'MaKho'
    }
  },
  NgayXuat: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'NgayXuat'
  },
  GhiChu: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'GhiChu'
  }
}, {
  tableName: 'XuatKho',
  timestamps: false
});

module.exports = XuatKho;
