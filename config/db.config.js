const { Sequelize } = require('sequelize');
require('dotenv').config();

// Map MaKhuVuc tới shard
const shardMap = {
  'KV1': '1',
  'KV2': '2',
  'KV3': '3'
};

// Master connection
const masterDb = new Sequelize({
  dialect: 'mssql',
  host: process.env.MASTER_HOST, // 100.81.38.120\WAREHOUSE_MAIN
  port: process.env.MASTER_PORT || 1433,
  username: process.env.MASTER_USER, // sa
  password: process.env.MASTER_PASS, // 123
  database: process.env.MASTER_DATABASE, // QUAN_LY_KHO_HANG
  dialectOptions: {
    options: { encrypt: true, instanceName: 'WAREHOUSE_MAIN' } // Xử lý instance name
  }
});

// Shard connections
const shards = {
  shard1: new Sequelize({
    dialect: 'mssql',
    host: process.env.SHARD1_HOST,
    port: process.env.SHARD1_PORT || 1433,
    username: process.env.SHARD1_USER,
    password: process.env.SHARD1_PASS,
    database: process.env.SHARD1_DATABASE,
    dialectOptions: { options: { encrypt: true } }
  }),
  shard2: new Sequelize({
    dialect: 'mssql',
    host: process.env.SHARD2_HOST,
    port: process.env.SHARD2_PORT || 1433,
    username: process.env.SHARD2_USER,
    password: process.env.SHARD2_PASS,
    database: process.env.SHARD2_DATABASE,
    dialectOptions: { options: { encrypt: true } }
  }),
  shard3: new Sequelize({
    dialect: 'mssql',
    host: process.env.SHARD3_HOST,
    port: process.env.SHARD3_PORT || 1433,
    username: process.env.SHARD3_USER,
    password: process.env.SHARD3_PASS,
    database: process.env.SHARD3_DATABASE,
    dialectOptions: { options: { encrypt: true } }
  })
 
};

// Hàm lấy connection
function getDbConnection(maKhuVuc, isGlobalQuery = false, isReplicatedTable = false) {
  if (isGlobalQuery || isReplicatedTable || !maKhuVuc) {
    return masterDb;
  }
  const shardKey = shardMap[maKhuVuc];
  return shards[shardKey] || masterDb;
}

// Kiểm tra kết nối
async function testConnections() {
  try {
    await masterDb.authenticate();
    console.log('Master DB connected');
    for (const [key, shard] of Object.entries(shards)) {
      await shard.authenticate();
      console.log(`${key} connected`);
    }
  } catch (error) {
    console.error('Connection error:', error);
  }
}

module.exports = { masterDb, shards, getDbConnection, testConnections };