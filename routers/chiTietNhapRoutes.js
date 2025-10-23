const express = require('express');
const router = express.Router();
const {
  getAllChiTietNhap,
  getChiTietNhapById,
  createChiTietNhap,
  updateChiTietNhap,
  deleteChiTietNhap
} = require('../controllers/chiTietNhapController');

// GET /api/chitietnhap - Lấy danh sách chi tiết nhập
router.get('/', getAllChiTietNhap);

// GET /api/chitietnhap/:maNhap/:maSP - Lấy chi tiết nhập theo ID
router.get('/:maNhap/:maSP', getChiTietNhapById);

// POST /api/chitietnhap - Tạo chi tiết nhập mới
router.post('/', createChiTietNhap);

// PUT /api/chitietnhap/:maNhap/:maSP - Cập nhật chi tiết nhập
router.put('/:maNhap/:maSP', updateChiTietNhap);

// DELETE /api/chitietnhap/:maNhap/:maSP - Xóa chi tiết nhập
router.delete('/:maNhap/:maSP', deleteChiTietNhap);

module.exports = router;
