const express = require('express');
const router = express.Router();
const {
  getAllSanPham,
  getSanPhamById,
  createSanPham,
  updateSanPham,
  deleteSanPham
} = require('../controllers/sanPhamController');

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
