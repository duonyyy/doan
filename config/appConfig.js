// Application configuration constants
const CONFIG = {
  // Database shard mapping
  SHARD_MAPPING: {
    1: 'shard1', // Miền Bắc
    2: 'shard2', // Miền Trung
    3: 'shard3', // Miền Nam
  },

  // Pagination defaults
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
  },

  // API Response messages
  MESSAGES: {
    SUCCESS: 'Thành công',
    ERROR: 'Lỗi hệ thống',
    NOT_FOUND: 'Không tìm thấy dữ liệu',
    UNAUTHORIZED: 'Không có quyền truy cập',
    VALIDATION_ERROR: 'Dữ liệu không hợp lệ',
    LOGIN_SUCCESS: 'Đăng nhập thành công',
    LOGIN_FAILED: 'Tên đăng nhập hoặc mật khẩu không đúng',
    INVALID_TOKEN: 'Token không hợp lệ',
    TOKEN_EXPIRED: 'Token đã hết hạn',
  },

  // Warehouse regions
  REGIONS: {
    1: 'Miền Bắc',
    2: 'Miền Trung',
    3: 'Miền Nam',
  },

  // File upload limits
  UPLOAD: {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
  },

  // Socket.IO events
  SOCKET_EVENTS: {
    INVENTORY_UPDATE: 'inventory_update',
    REVENUE_UPDATE: 'revenue_update',
    CONNECTION: 'connection',
    DISCONNECT: 'disconnect',
  },
};

// Environment configuration
const ENV_CONFIG = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 8080,
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
};

module.exports = {
  CONFIG,
  ENV_CONFIG,
};
