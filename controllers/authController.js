const { getDbConnection, masterDb } = require('../config/db.config');
const warehouseData = require('../constants/warehouseData');
const { findWarehouseByName, getAllWarehouses: getWarehouseData } =
  warehouseData;

// Login function (ĐÃ CẬP NHẬT)
const login = async (req, res) => {
  try {
    const { TenKho, MatKhau } = req.body; // Validate input

    if (!TenKho || !MatKhau) {
      return res.status(400).json({
        success: false,
        message: 'Tên kho và mật khẩu là bắt buộc',
      });
    } // Find warehouse by name

    // Giả sử findWarehouseByName có thể tìm thấy kho 'Tồng Công Ty'
    const warehouse = findWarehouseByName(TenKho);

    if (!warehouse) {
      return res.status(401).json({
        success: false,
        message: 'Tên kho không tồn tại',
      });
    } // Check password (simple comparison for fake data)

    if (warehouse.MatKhau !== MatKhau) {
      return res.status(401).json({
        success: false,
        message: 'Mật khẩu không đúng',
      });
    } // Test database connection (MASTER and SHARD)

    let connectionResult = {
      master: { status: 'not_tested', message: '' },
      shard: { status: 'not_tested', message: '' },
    }; // Test master database connection (Luôn luôn test master)

    try {
      await masterDb.authenticate();
      connectionResult.master = {
        status: 'connected',
        message: '✅ Kết nối thành công đến Master Database',
      };
    } catch (error) {
      console.error('Master DB connection error:', error);
      connectionResult.master = {
        status: 'failed',
        message: `❌ Không thể kết nối đến Master Database: ${error.message}`,
      };
    }

    // --- THAY ĐỔI LOGIC TẠI ĐÂY ---
    // Kiểm tra xem đây có phải là tài khoản Master (Tồng Công Ty) không
    // Dựa vào MaKhuVuc = 0 hoặc ShardKey = 'master'
    if (warehouse.MaKhuVuc === 0 || warehouse.ShardKey === 'master') {
      // Nếu là Master, bỏ qua kiểm tra Shard và gán trạng thái 'not_applicable'
      connectionResult.shard = {
        status: 'not_applicable',
        message: 'Đăng nhập tài khoản Master, không áp dụng Shard DB.',
      };
    } else {
      // Nếu là kho thường (Shard), tiến hành kiểm tra kết nối Shard như cũ
      try {
        const dbConnection = getDbConnection(warehouse.MaKhuVuc);
        await dbConnection.authenticate();
        connectionResult.shard = {
          status: 'connected',
          message: `✅ Kết nối thành công đến ${warehouse.ShardKey}`,
        };
      } catch (error) {
        console.error('Shard DB connection error:', error);
        connectionResult.shard = {
          status: 'failed',
          message: `❌ Không thể kết nối đến ${warehouse.ShardKey}: ${error.message}`,
        };
      }
    }
    // --- KẾT THÚC THAY ĐỔI ---

    // Cập nhật lại thông tin useCase trong response cho rõ ràng
    const shardUseCase =
      warehouse.MaKhuVuc === 0
        ? 'Không áp dụng cho tài khoản Master'
        : `Dữ liệu cụ thể của ${warehouse.TenKhuVuc}`;
    const shardName =
      warehouse.MaKhuVuc === 0
        ? 'Shard Database (N/A)'
        : `${warehouse.ShardKey} Database`;

    // Return success response with warehouse info
    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        MaKho: warehouse.MaKho,
        TenKho: warehouse.TenKho,
        DiaDiem: warehouse.DiaDiem,
        MaKhuVuc: warehouse.MaKhuVuc,
        TenKhuVuc: warehouse.TenKhuVuc,
        ShardKey: warehouse.ShardKey,
        DatabaseInfo: {
          region: warehouse.TenKhuVuc,
          shard: warehouse.ShardKey,
          description: `Kho ${warehouse.TenKho} thuộc ${warehouse.TenKhuVuc}, sử dụng ${warehouse.ShardKey}`,
          connections: {
            master: {
              name: 'Master Database',
              status: connectionResult.master.status,
              message: connectionResult.master.message,
              useCase: 'Dữ liệu chung, metadata',
            },
            shard: {
              name: shardName, // Cập nhật tên
              status: connectionResult.shard.status,
              message: connectionResult.shard.message,
              useCase: shardUseCase, // Cập nhật useCase
            },
          },
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi hệ thống khi đăng nhập',
    });
  }
};
// Get all warehouses (for testing)
const getAllWarehouses = async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Danh sách kho hàng',
      data: getWarehouseData(),
    });
  } catch (error) {
    console.error('Get warehouses error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi hệ thống khi lấy danh sách kho',
    });
  }
};

// Test database connection for specific warehouse
const testDatabaseConnection = async (req, res) => {
  try {
    const { TenKho } = req.params;

    // Find warehouse by name
    const warehouse = findWarehouseByName(TenKho);

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy kho',
      });
    }

    // Test connections to both master and shard
    let connectionResult = {
      warehouse: {
        MaKho: warehouse.MaKho,
        TenKho: warehouse.TenKho,
        MaKhuVuc: warehouse.MaKhuVuc,
        ShardKey: warehouse.ShardKey,
      },
      connections: {
        master: {
          status: 'testing',
          message: '',
          timestamp: new Date().toISOString(),
        },
        shard: {
          status: 'testing',
          message: '',
          timestamp: new Date().toISOString(),
        },
      },
    };

    // Test master database connection
    try {
      await masterDb.authenticate();
      connectionResult.connections.master = {
        status: 'connected',
        message: '✅ Kết nối thành công đến Master Database',
        timestamp: new Date().toISOString(),
      };

      // Test a simple query on master
      const [masterResult] = await masterDb.query('SELECT 1 as test');
      connectionResult.connections.master.queryTest = 'success';
      connectionResult.connections.master.queryResult = masterResult;
    } catch (error) {
      connectionResult.connections.master = {
        status: 'failed',
        message: `❌ Không thể kết nối đến Master Database: ${error.message}`,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }

    // Test shard database connection
    try {
      const dbConnection = getDbConnection(warehouse.MaKhuVuc);
      await dbConnection.authenticate();

      connectionResult.connections.shard = {
        status: 'connected',
        message: `✅ Kết nối thành công đến ${warehouse.ShardKey}`,
        timestamp: new Date().toISOString(),
      };

      // Test a simple query on shard
      const [shardResult] = await dbConnection.query('SELECT 1 as test');
      connectionResult.connections.shard.queryTest = 'success';
      connectionResult.connections.shard.queryResult = shardResult;
    } catch (error) {
      connectionResult.connections.shard = {
        status: 'failed',
        message: `❌ Không thể kết nối đến ${warehouse.ShardKey}: ${error.message}`,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }

    res.json({
      success: true,
      message: 'Kết quả test kết nối database',
      data: connectionResult,
    });
  } catch (error) {
    console.error('Test database connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi hệ thống khi test kết nối database',
    });
  }
};

// Test master database connection only
const testMasterConnection = async (req, res) => {
  try {
    let connectionResult = {
      database: 'Master Database',
      connection: {
        status: 'testing',
        message: '',
        timestamp: new Date().toISOString(),
      },
    };

    try {
      await masterDb.authenticate();

      connectionResult.connection = {
        status: 'connected',
        message: '✅ Kết nối thành công đến Master Database',
        timestamp: new Date().toISOString(),
      };

      // Test a simple query
      const [result] = await masterDb.query(
        'SELECT 1 as test, GETDATE() as current_time'
      );
      connectionResult.connection.queryTest = 'success';
      connectionResult.connection.queryResult = result;
    } catch (error) {
      connectionResult.connection = {
        status: 'failed',
        message: `❌ Không thể kết nối đến Master Database: ${error.message}`,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }

    res.json({
      success: true,
      message: 'Kết quả test kết nối Master Database',
      data: connectionResult,
    });
  } catch (error) {
    console.error('Test master connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi hệ thống khi test kết nối Master Database',
    });
  }
};

module.exports = {
  login,
  getAllWarehouses,
  testDatabaseConnection,
  testMasterConnection,
};
