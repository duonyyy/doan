const express = require('express');
const router = express.Router();

// Import tất cả các hàm từ controller
const {
  getAllTonKho,
  getTonKhoById,
  getTonKhoSummary,
  getTonKhoSummaryByProduct, // <--- Hàm này chưa có route
  getTotalTonKhoByMaSP,
  getGrandTotalQuantity,
  updateTonKho,
  deleteTonKho,
  getDetailedInventoryList
} = require('../controllers/tonKhoController');

// --- CÁC ROUTE TỔNG HỢP (SUMMARY) ---

// GET /api/tonkho/summary - Lấy tổng kết tồn kho chung (theo kho)
router.get('/summary', getTonKhoSummary);

// GET /api/tonkho/summary-by-product - Lấy tổng tồn kho nhóm theo sản phẩm
router.get('/summary-by-product', getTonKhoSummaryByProduct);

// GET /api/tonkho/summary/product/:maSP - Lấy tổng tồn kho của 1 sản phẩm
router.get('/summary/product/:maSP', getTotalTonKhoByMaSP);

// GET /api/tonkho/grand-total - Lấy tổng số lượng tất cả sản phẩm
router.get('/grand-total', getGrandTotalQuantity);

// --- CÁC ROUTE CRUD CƠ BẢN ---

// GET /api/tonkho - Lấy danh sách tồn kho (phân trang, lọc)
router.get('/', getAllTonKho);

// GET /api/tonkho/:maSP/:maKho - Lấy tồn kho theo ID
router.get('/:maSP/:maKho', getTonKhoById);

// PUT /api/tonkho/:maSP/:maKho - Cập nhật tồn kho
router.put('/:maSP/:maKho', updateTonKho);

// DELETE /api/tonkho/:maSP/:maKho - Xóa tồn kho
router.delete('/:maSP/:maKho', deleteTonKho);

router.get('/detailed-list', getDetailedInventoryList);



module.exports = router;
