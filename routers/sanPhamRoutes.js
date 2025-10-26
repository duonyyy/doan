const express = require('express');
const router = express.Router();
const {
  getAllSanPham,
  getSanPhamById,
  createSanPham,
  updateSanPham,
  deleteSanPham,
  getTop5SanPhamTonKhoItNhatTheoKho,
} = require('../controllers/sanPhamController');

// ví dụ: GET /api/tonkho/top5?ShardKey=shard1&MaKho=2&MaKhuVuc=1
router.get('/top5', getTop5SanPhamTonKhoItNhatTheoKho);

// GET /api/sanpham - Lấy danh sách sản phẩm
router.get('/', getAllSanPham);

// GET /api/sanpham/:id - Lấy sản phẩm theo ID
router.get('/:id', getSanPhamById);

// POST /api/sanpham - Tạo sản phẩm mới
router.post('/', createSanPham);

// PUT /api/sanpham/:id - Cập nhật sản phẩm
router.put('/:id', updateSanPham);

// DELETE /api/sanpham/:id - Xóa sản phẩm
router.delete('/:id', deleteSanPham);

module.exports = router;
