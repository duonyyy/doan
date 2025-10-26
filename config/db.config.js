const { Sequelize } = require('sequelize');
require('dotenv').config();

// Map MaKhuVuc tới shard (1=Miền Bắc, 2=Miền Trung, 3=Miền Nam)
const shardMap = {
  1: 'shard1', // Miền Bắc
  2: 'shard2', // Miền Trung
  3: 'shard3', // Miền Nam
};

// Master connection
const masterDb = new Sequelize({
  dialect: 'mssql',
  host: process.env.MASTER_HOST,
  port: parseInt(process.env.MASTER_PORT || 1433), // <-- SỬ DỤNG LẠI PORT
  username: process.env.MASTER_USER,
  password: process.env.MASTER_PASS,
  database: process.env.MASTER_DATABASE,
  logging: false,
  dialectOptions: {
    options: {
      encrypt: true,
      trustServerCertificate: true, // instanceName: process.env.MASTER_INSTANCE // <-- XÓA DÒNG NÀY
    },
  },
});

// Shard connections
const shards = {
  shard1: new Sequelize({
    dialect: 'mssql',
    host: process.env.SHARD1_HOST,
    port: parseInt(process.env.SHARD1_PORT || 1434), // <-- SỬ DỤNG LẠI PORT
    username: process.env.SHARD1_USER,
    password: process.env.SHARD1_PASS,
    database: process.env.SHARD1_DATABASE,
    logging: false,
    dialectOptions: {
      options: {
        encrypt: true,
        trustServerCertificate: true, // instanceName: process.env.SHARD1_INSTANCE // <-- XÓA DÒNG NÀY
      },
    },
  }),
  shard2: new Sequelize({
    dialect: 'mssql',
    host: process.env.SHARD2_HOST,
    port: parseInt(process.env.SHARD2_PORT || 1434), // <-- SỬ DỤNG LẠI PORT
    username: process.env.SHARD2_USER,
    password: process.env.SHARD2_PASS,
    database: process.env.SHARD2_DATABASE,
    logging: false,
    dialectOptions: {
      options: {
        encrypt: true,
        trustServerCertificate: true, // instanceName: process.env.SHARD2_INSTANCE // <-- XÓA DÒNG NÀY
      },
    },
  }),
  shard3: new Sequelize({
    dialect: 'mssql',
    host: process.env.SHARD3_HOST,
    port: parseInt(process.env.SHARD3_PORT || 1435), // <-- SỬ DỤNG LẠI PORT
    username: process.env.SHARD3_USER,
    password: process.env.SHARD3_PASS,
    database: process.env.SHARD3_DATABASE,
    logging: false,
    dialectOptions: {
      options: {
        encrypt: true,
        trustServerCertificate: true, // instanceName: process.env.SHARD3_INSTANCE // <-- XÓA DÒNG NÀY
      },
    },
  }),
};

async function getDbFromRequest(req) {
  const { MaKhuVuc: maKhuVuc, ShardKey: shardKey } = req.query; // 1. Ưu tiên ShardKey
  if (shardKey) {
    // Lấy thử kết nối từ ShardKey
    const dbConnection = shards[shardKey]; // QUAN TRỌNG: Chỉ return nếu kết nối này TỒN TẠI
    if (dbConnection) {
      console.log(
        `DEBUG: Đã tìm thấy kết nối hợp lệ cho ShardKey: ${shardKey}`
      );
      return dbConnection;
    } // Nếu shardKey được cung cấp nhưng không hợp lệ, // hãy để code chạy tiếp xuống kiểm tra maKhuVuc
    console.warn(
      `DEBUG: ShardKey "${shardKey}" không hợp lệ. Fallback sang MaKhuVuc...`
    );
  } // 2. Fallback sang MaKhuVuc
  if (maKhuVuc) {
    console.log(`DEBUG: Sử dụng MaKhuVuc: ${maKhuVuc}`);
    return getDbConnection(maKhuVuc);
  } // 3. Fallback cuối cùng
  console.warn('Không có ShardKey hoặc MaKhuVuc hợp lệ, dùng master DB');
  return masterDb;
}

// Hàm lấy connection
function getDbConnection(
  maKhuVuc,
  isGlobalQuery = false,
  isReplicatedTable = false
) {
  // Nếu là query toàn cục hoặc bảng replicated hoặc không có maKhuVuc -> dùng master
  if (isGlobalQuery || isReplicatedTable || !maKhuVuc) {
    return masterDb;
  } // Lấy shard key từ maKhuVuc

  const shardKey = shardMap[maKhuVuc];
  if (!shardKey) {
    console.warn(
      `Không tìm thấy shard cho MaKhuVuc: ${maKhuVuc}, sử dụng master DB`
    );
    return masterDb;
  }

  return shards[shardKey] || masterDb;
}

// Kiểm tra kết nối
async function testConnections() {
  console.log('🔍 Testing database connections...');

  try {
    // Test master connection
    await masterDb.authenticate();
    console.log('✅ Master DB connected successfully'); // Test shard connections

    for (const [key, shard] of Object.entries(shards)) {
      try {
        await shard.authenticate();
        console.log(`✅ ${key} connected successfully`);
      } catch (error) {
        console.error(`❌ ${key} connection failed:`, error.message);
      }
    }

    console.log('🎉 Database connection test completed');
  } catch (error) {
    console.error('❌ Master DB connection failed:', error.message);
  }
}

module.exports = {
  masterDb,
  shards,
  getDbConnection,
  testConnections,
  getDbFromRequest,
};
