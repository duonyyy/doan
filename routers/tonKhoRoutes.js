const express = require('express');
const router = express.Router();
const {
  getAllTonKho,
  getTonKhoById,
  getTonKhoSummary,
  updateTonKho,
  deleteTonKho
} = require('../controllers/tonKhoController');

// GET /api/tonkho - Lấy danh sách tồn kho
router.get('/', getAllTonKho);

// GET /api/tonkho/summary - Lấy tổng kết tồn kho
router.get('/summary', getTonKhoSummary);

// GET /api/tonkho/:maSP/:maKho - Lấy tồn kho theo ID
router.get('/:maSP/:maKho', getTonKhoById);

// PUT /api/tonkho/:maSP/:maKho - Cập nhật tồn kho
router.put('/:maSP/:maKho', updateTonKho);

// DELETE /api/tonkho/:maSP/:maKho - Xóa tồn kho
router.delete('/:maSP/:maKho', deleteTonKho);

module.exports = router;
