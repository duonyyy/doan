const express = require('express');
const router = express.Router();

// Import all route modules
const authRoutes = require('./authRoutes');
const nhaCungCapRoutes = require('./nhaCungCapRoutes');
const khuVucRoutes = require('./khuVucRoutes');
const khoHangRoutes = require('./khoHangRoutes');
const sanPhamRoutes = require('./sanPhamRoutes');
const nhapKhoRoutes = require('./nhapKhoRoutes');
const chiTietNhapRoutes = require('./chiTietNhapRoutes');
const xuatKhoRoutes = require('./xuatKhoRoutes');
const chiTietXuatRoutes = require('./chiTietXuatRoutes');
const tonKhoRoutes = require('./tonKhoRoutes');
const doanhThuRoutes = require('./doanhThuRoutes');

// Mount all routes
router.use('/auth', authRoutes);
router.use('/nhacungcap', nhaCungCapRoutes);
router.use('/khuvuc', khuVucRoutes);
router.use('/khohang', khoHangRoutes);
router.use('/sanpham', sanPhamRoutes);
router.use('/nhapkho', nhapKhoRoutes);
router.use('/chitietnhap', chiTietNhapRoutes);
router.use('/xuatkho', xuatKhoRoutes);
router.use('/chitietxuat', chiTietXuatRoutes);
router.use('/tonkho', tonKhoRoutes);
router.use('/doanhthu', doanhThuRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

// API documentation endpoint
router.get('/docs', (req, res) => {
  res.json({
    success: true,
    message: 'API Documentation',
    endpoints: {
      auth: {
        base: '/api/auth',
        methods: ['POST', 'GET'],
        description: 'Xác thực kho hàng',
        routes: {
          login: 'POST /api/auth/login - Đăng nhập với tên kho và mật khẩu',
          warehouses: 'GET /api/auth/warehouses - Lấy danh sách tất cả kho',
          testConnection: 'GET /api/auth/test-connection/:TenKho - Test kết nối cả master và shard database',
          testMaster: 'GET /api/auth/test-master - Test kết nối Master Database'
        }
      },
      nhacungcap: {
        base: '/api/nhacungcap',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        description: 'Quản lý nhà cung cấp'
      },
      khuvuc: {
        base: '/api/khuvuc',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        description: 'Quản lý khu vực'
      },
      khohang: {
        base: '/api/khohang',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        description: 'Quản lý kho hàng'
      },
      sanpham: {
        base: '/api/sanpham',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        description: 'Quản lý sản phẩm'
      },
      nhapkho: {
        base: '/api/nhapkho',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        description: 'Quản lý nhập kho'
      },
      chitietnhap: {
        base: '/api/chitietnhap',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        description: 'Quản lý chi tiết nhập kho'
      },
      xuatkho: {
        base: '/api/xuatkho',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        description: 'Quản lý xuất kho'
      },
      chitietxuat: {
        base: '/api/chitietxuat',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        description: 'Quản lý chi tiết xuất kho'
      },
      tonkho: {
        base: '/api/tonkho',
        methods: ['GET', 'PUT', 'DELETE'],
        description: 'Quản lý tồn kho'
      }
    }
  });
});

module.exports = router;
