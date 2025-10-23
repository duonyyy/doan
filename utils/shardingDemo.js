const { getDbConnection } = require('../config/db.config');

/**
 * Demo cách API lấy dữ liệu từ 4 server SQL
 */
class ShardingDemo {
  
  /**
   * Demo 1: Lấy dữ liệu Global (Master DB)
   */
  static async demoGlobalQueries() {
    console.log('🌐 === GLOBAL QUERIES (Master DB) ===');
    
    // Lấy connection cho global queries
    const masterConnection = getDbConnection(null, true, false);
    console.log('📡 Connection: Master DB');
    
    // Ví dụ: Lấy danh sách nhà cung cấp
    console.log('📋 Lấy danh sách nhà cung cấp...');
    // const nhaCungCaps = await masterConnection.models.NhaCungCap.findAll();
    
    // Ví dụ: Lấy danh sách sản phẩm
    console.log('📦 Lấy danh sách sản phẩm...');
    // const sanPhams = await masterConnection.models.SanPham.findAll();
    
    console.log('✅ Global queries luôn lấy từ Master DB\n');
  }

  /**
   * Demo 2: Lấy dữ liệu theo Khu Vực (Sharded)
   */
  static async demoShardedQueries() {
    console.log('🏢 === SHARDED QUERIES (Theo Khu Vực) ===');
    
    const khuVucs = [
      { maKhuVuc: 1, tenKhuVuc: 'KV1', shard: 'shard1' },
      { maKhuVuc: 2, tenKhuVuc: 'KV2', shard: 'shard2' },
      { maKhuVuc: 3, tenKhuVuc: 'KV3', shard: 'shard3' },
      { maKhuVuc: 4, tenKhuVuc: 'KV4', shard: 'shard4' }
    ];

    for (const kv of khuVucs) {
      console.log(`\n📍 Khu vực: ${kv.tenKhuVuc} (MaKhuVuc: ${kv.maKhuVuc})`);
      
      // Lấy connection cho khu vực này
      const shardConnection = getDbConnection(kv.maKhuVuc, false, false);
      console.log(`📡 Connection: ${kv.shard}`);
      
      // Ví dụ: Lấy kho hàng của khu vực này
      console.log(`🏪 Lấy kho hàng của ${kv.tenKhuVuc}...`);
      // const khoHangs = await shardConnection.models.KhoHang.findAll({
      //   where: { MaKhuVuc: kv.maKhuVuc }
      // });
      
      // Ví dụ: Lấy tồn kho của khu vực này
      console.log(`📊 Lấy tồn kho của ${kv.tenKhuVuc}...`);
      // const tonKhos = await shardConnection.models.TonKho.findAll({
      //   include: [{ model: shardConnection.models.KhoHang, where: { MaKhuVuc: kv.maKhuVuc } }]
      // });
    }
    
    console.log('\n✅ Sharded queries lấy từ shard tương ứng\n');
  }

  /**
   * Demo 3: Cross-Shard Operations
   */
  static async demoCrossShardOperations() {
    console.log('🔄 === CROSS-SHARD OPERATIONS ===');
    
    // Lấy dữ liệu từ tất cả shards
    const allShards = ['shard1', 'shard2', 'shard3', 'shard4'];
    const allTonKho = [];
    
    for (const shardName of allShards) {
      console.log(`📡 Querying ${shardName}...`);
      
      // Giả sử có connection đến shard
      // const shardConnection = shards[shardName];
      // const tonKho = await shardConnection.models.TonKho.findAll();
      // allTonKho.push(...tonKho);
    }
    
    console.log('📊 Merge data from all shards...');
    console.log('✅ Cross-shard operations query từ tất cả shards\n');
  }

  /**
   * Demo 4: Business Logic Flow
   */
  static async demoBusinessLogicFlow() {
    console.log('💼 === BUSINESS LOGIC FLOW ===');
    
    // Scenario: Tạo nhập kho cho kho thuộc KV2
    const maKho = 5; // Giả sử kho này thuộc KV2
    const maKhuVuc = 2; // KV2
    
    console.log(`📥 Tạo nhập kho cho kho ${maKho} (thuộc ${maKhuVuc})`);
    
    // 1. Lấy connection cho khu vực này
    const shardConnection = getDbConnection(maKhuVuc, false, false);
    console.log(`📡 Connection: shard2 (vì MaKhuVuc = ${maKhuVuc})`);
    
    // 2. Tạo phiếu nhập kho
    console.log('📝 Tạo phiếu nhập kho...');
    // const nhapKho = await shardConnection.models.NhapKho.create({
    //   MaKho: maKho,
    //   MaNCC: 1,
    //   NgayNhap: '2024-01-15',
    //   GhiChu: 'Nhập hàng test'
    // });
    
    // 3. Tạo chi tiết nhập kho
    console.log('📋 Tạo chi tiết nhập kho...');
    // const chiTietNhap = await shardConnection.models.ChiTietNhap.create({
    //   MaNhap: nhapKho.MaNhap,
    //   MaSP: 1,
    //   SoLuong: 100,
    //   GiaNhap: 50000
    // });
    
    // 4. Cập nhật tồn kho
    console.log('📊 Cập nhật tồn kho...');
    // const tonKho = await shardConnection.models.TonKho.findOne({
    //   where: { MaSP: 1, MaKho: maKho }
    // });
    // await tonKho.update({ SoLuongTon: tonKho.SoLuongTon + 100 });
    
    console.log('✅ Tất cả operations đều thực hiện trên shard2\n');
  }

  /**
   * Demo 5: Error Handling & Fallback
   */
  static async demoErrorHandling() {
    console.log('⚠️ === ERROR HANDLING & FALLBACK ===');
    
    // Scenario: Shard2 bị down
    const maKhuVuc = 2; // KV2
    
    try {
      console.log(`🔍 Thử kết nối đến shard2 (KV${maKhuVuc})...`);
      const shardConnection = getDbConnection(maKhuVuc, false, false);
      
      // Giả sử connection bị lỗi
      // await shardConnection.authenticate();
      
    } catch (error) {
      console.log('❌ Shard2 bị down!');
      console.log('🔄 Fallback về Master DB...');
      
      // Fallback về Master DB
      const masterConnection = getDbConnection(null, true, false);
      console.log('✅ Sử dụng Master DB làm fallback');
    }
    
    console.log('✅ Error handling hoạt động tốt\n');
  }

  /**
   * Chạy tất cả demos
   */
  static async runAllDemos() {
    console.log('🚀 === DEMO SHARDING ARCHITECTURE ===\n');
    
    await this.demoGlobalQueries();
    await this.demoShardedQueries();
    await this.demoCrossShardOperations();
    await this.demoBusinessLogicFlow();
    await this.demoErrorHandling();
    
    console.log('🎉 === DEMO COMPLETED ===');
  }
}

module.exports = ShardingDemo;
