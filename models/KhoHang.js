const { DataTypes } = require('sequelize');
const { getDbConnection } = require('../config/db.config');

const KhoHang = getDbConnection().define('KhoHang', {
  MaKho: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'MaKho'
  },
  TenKho: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    field: 'TenKho'
  },
  DiaDiem: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'DiaDiem'
  },
  MaKhuVuc: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'MaKhuVuc',
    references: {
      model: 'KhuVuc',
      key: 'MaKhuVuc'
    }
  }
}, {
  tableName: 'KhoHang',
  timestamps: false
});

module.exports = KhoHang;
