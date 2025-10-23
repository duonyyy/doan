const { DataTypes } = require('sequelize');
const { getDbConnection } = require('../config/db.config');

const TonKho = getDbConnection().define('TonKho', {
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
  MaKho: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
    field: 'MaKho',
    references: {
      model: 'KhoHang',
      key: 'MaKho'
    }
  },
  SoLuongTon: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0
    },
    field: 'SoLuongTon'
  }
}, {
  tableName: 'TonKho',
  timestamps: false
});

module.exports = TonKho;
