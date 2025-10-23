const { DataTypes } = require('sequelize');
const { getDbConnection } = require('../config/db.config');

const NhapKho = getDbConnection().define('NhapKho', {
  MaNhap: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'MaNhap'
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
  MaNCC: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'MaNCC',
    references: {
      model: 'NhaCungCap',
      key: 'MaNCC'
    }
  },
  NgayNhap: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'NgayNhap'
  },
  GhiChu: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'GhiChu'
  }
}, {
  tableName: 'NhapKho',
  timestamps: false
});

module.exports = NhapKho;
