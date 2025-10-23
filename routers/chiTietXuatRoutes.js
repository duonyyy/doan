const express = require('express');
const router = express.Router();
const {
  getAllChiTietXuat,
  getChiTietXuatById,
  createChiTietXuat,
  updateChiTietXuat,
  deleteChiTietXuat
} = require('../controllers/chiTietXuatController');

// GET /api/chitietxuat - Lấy danh sách chi tiết xuất
router.get('/', getAllChiTietXuat);

// GET /api/chitietxuat/:maXuat/:maSP - Lấy chi tiết xuất theo ID
router.get('/:maXuat/:maSP', getChiTietXuatById);

// POST /api/chitietxuat - Tạo chi tiết xuất mới
router.post('/', createChiTietXuat);

// PUT /api/chitietxuat/:maXuat/:maSP - Cập nhật chi tiết xuất
router.put('/:maXuat/:maSP', updateChiTietXuat);

// DELETE /api/chitietxuat/:maXuat/:maSP - Xóa chi tiết xuất
router.delete('/:maXuat/:maSP', deleteChiTietXuat);

module.exports = router;
