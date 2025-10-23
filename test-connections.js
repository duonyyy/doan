const { testConnections, getDbConnection } = require('./config/db.config');

/**
 * Test kết nối đến 4 server SQL
 */
async function testAllConnections() {
  console.log('🔍 === TESTING 4 SQL SERVERS ===\n');
  
  try {
    // Test Master DB
    console.log('1️⃣ Testing Master DB...');
    const masterDb = getDbConnection(null, true, false);
    await masterDb.authenticate();
    console.log('✅ Master DB connected successfully');
    
    // Test Shard 1 (KV1)
    console.log('\n2️⃣ Testing Shard 1 (KV1)...');
    const shard1 = getDbConnection(1, false, false);
    await shard1.authenticate();
    console.log('✅ Shard 1 connected successfully');
    
    // Test Shard 2 (KV2)
    console.log('\n3️⃣ Testing Shard 2 (KV2)...');
    const shard2 = getDbConnection(2, false, false);
    await shard2.authenticate();
    console.log('✅ Shard 2 connected successfully');
    
    // Test Shard 3 (KV3)
    console.log('\n4️⃣ Testing Shard 3 (KV3)...');
    const shard3 = getDbConnection(3, false, false);
    await shard3.authenticate();
    console.log('✅ Shard 3 connected successfully');
    
    // Test Shard 4 (KV4)
    console.log('\n5️⃣ Testing Shard 4 (KV4)...');
    const shard4 = getDbConnection(4, false, false);
    await shard4.authenticate();
    console.log('✅ Shard 4 connected successfully');
    
    console.log('\n🎉 All 4 servers connected successfully!');
    
    // Test routing logic
    console.log('\n🔀 === TESTING ROUTING LOGIC ===');
    
    const testCases = [
      { maKhuVuc: null, description: 'Global query (NhaCungCap, SanPham)' },
      { maKhuVuc: 1, description: 'KV1 query (KhoHang, NhapKho, XuatKho)' },
      { maKhuVuc: 2, description: 'KV2 query (KhoHang, NhapKho, XuatKho)' },
      { maKhuVuc: 3, description: 'KV3 query (KhoHang, NhapKho, XuatKho)' },
      { maKhuVuc: 4, description: 'KV4 query (KhoHang, NhapKho, XuatKho)' },
      { maKhuVuc: 5, description: 'Unknown KV (fallback to Master)' }
    ];
    
    for (const testCase of testCases) {
      const connection = getDbConnection(testCase.maKhuVuc, false, false);
      const connectionName = connection === masterDb ? 'Master DB' : 
                           connection === shard1 ? 'Shard 1' :
                           connection === shard2 ? 'Shard 2' :
                           connection === shard3 ? 'Shard 3' :
                           connection === shard4 ? 'Shard 4' : 'Unknown';
      
      console.log(`📡 MaKhuVuc ${testCase.maKhuVuc || 'null'}: ${testCase.description} → ${connectionName}`);
    }
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Kiểm tra file .env có đầy đủ thông tin kết nối');
    console.log('2. Đảm bảo SQL Server đang chạy trên tất cả 4 server');
    console.log('3. Kiểm tra firewall và network connectivity');
    console.log('4. Verify username/password cho từng server');
  }
}

// Chạy test
testAllConnections();
