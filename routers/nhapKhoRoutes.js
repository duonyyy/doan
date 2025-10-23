const express = require('express');
const router = express.Router();
const {
  getAllNhapKho,
  getNhapKhoById,
  createNhapKho,
  updateNhapKho,
  deleteNhapKho
} = require('../controllers/nhapKhoController');

// GET /api/nhapkho - Lấy danh sách nhập kho
router.get('/', getAllNhapKho);

// GET /api/nhapkho/:id - Lấy nhập kho theo ID
router.get('/:id', getNhapKhoById);

// POST /api/nhapkho - Tạo phiếu nhập kho mới
router.post('/', createNhapKho);

// PUT /api/nhapkho/:id - Cập nhật phiếu nhập kho
router.put('/:id', updateNhapKho);

// DELETE /api/nhapkho/:id - Xóa phiếu nhập kho
router.delete('/:id', deleteNhapKho);

module.exports = router;
