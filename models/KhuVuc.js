const { DataTypes } = require('sequelize');
const { getDbConnection } = require('../config/db.config');

const KhuVuc = getDbConnection().define('KhuVuc', {
  MaKhuVuc: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'MaKhuVuc'
  },
  TenKhuVuc: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    field: 'TenKhuVuc'
  }
}, {
  tableName: 'KhuVuc',
  timestamps: false
});

module.exports = KhuVuc;
