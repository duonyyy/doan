const express = require('express');
const router = express.Router();
const {
  getAllKhoHang,
  getKhoHangById,
  createKhoHang,
  updateKhoHang,
  deleteKhoHang
} = require('../controllers/khoHangController');

// GET /api/khohang - Lấy danh sách kho hàng
router.get('/', getAllKhoHang);

// GET /api/khohang/:id - Lấy kho hàng theo ID
router.get('/:id', getKhoHangById);

// POST /api/khohang - Tạo kho hàng mới
router.post('/', createKhoHang);

// PUT /api/khohang/:id - Cập nhật kho hàng
router.put('/:id', updateKhoHang);

// DELETE /api/khohang/:id - Xóa kho hàng
router.delete('/:id', deleteKhoHang);

module.exports = router;
