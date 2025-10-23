const express = require('express');
const router = express.Router();
const {
  getDoanhThuTheoThoiGian,
  getDoanhThuTheoSanPham,
  getDoanhThuTheoKho,
  getBaoCaoDoanhThu,
  getDoanhThuRealTime
} = require('../controllers/doanhThuController');

// GET /api/doanhthu/thoigian - Lấy doanh thu theo thời gian
router.get('/thoigian', getDoanhThuTheoThoiGian);

// GET /api/doanhthu/sanpham - Lấy doanh thu theo sản phẩm
router.get('/sanpham', getDoanhThuTheoSanPham);

// GET /api/doanhthu/kho - Lấy doanh thu theo kho
router.get('/kho', getDoanhThuTheoKho);

// GET /api/doanhthu/baocao - Lấy báo cáo doanh thu tổng hợp
router.get('/baocao', getBaoCaoDoanhThu);

// GET /api/doanhthu/realtime - Lấy doanh thu real-time
router.get('/realtime', getDoanhThuRealTime);

module.exports = router;
