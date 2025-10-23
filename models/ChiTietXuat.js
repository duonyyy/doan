const { DataTypes } = require('sequelize');
const { getDbConnection } = require('../config/db.config');

const ChiTietXuat = getDbConnection().define('ChiTietXuat', {
  MaXuat: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
    field: 'MaXuat',
    references: {
      model: 'XuatKho',
      key: 'MaXuat'
    }
  },
  MaSP: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
    field: 'MaSP',
    references: {
      model: 'SanPham',
      key: 'MaSP'
    }
  },
  SoLuong: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    },
    field: 'SoLuong'
  },
  GiaXuat: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false,
    validate: {
      min: 0
    },
    field: 'GiaXuat'
  },
  Note: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'Note'
  }
}, {
  tableName: 'ChiTietXuat',
  timestamps: false
});

module.exports = ChiTietXuat;
