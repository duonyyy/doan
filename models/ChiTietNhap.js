const { DataTypes } = require('sequelize');
const { getDbConnection } = require('../config/db.config');

const ChiTietNhap = getDbConnection().define('ChiTietNhap', {
  MaNhap: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
    field: 'MaNhap',
    references: {
      model: 'NhapKho',
      key: 'MaNhap'
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
  GiaNhap: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false,
    validate: {
      min: 0
    },
    field: 'GiaNhap'
  },
  Note: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'Note'
  }
}, {
  tableName: 'ChiTietNhap',
  timestamps: false
});

module.exports = ChiTietNhap;
