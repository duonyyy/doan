const express = require('express');
const router = express.Router();
const {
  getAllXuatKho,
  getXuatKhoById,
  createXuatKho,
  updateXuatKho,
  deleteXuatKho
} = require('../controllers/xuatKhoController');

// GET /api/xuatkho - Lấy danh sách xuất kho
router.get('/', getAllXuatKho);

// GET /api/xuatkho/:id - Lấy xuất kho theo ID
router.get('/:id', getXuatKhoById);

// POST /api/xuatkho - Tạo phiếu xuất kho mới
router.post('/', createXuatKho);

// PUT /api/xuatkho/:id - Cập nhật phiếu xuất kho
router.put('/:id', updateXuatKho);

// DELETE /api/xuatkho/:id - Xóa phiếu xuất kho
router.delete('/:id', deleteXuatKho);

module.exports = router;
