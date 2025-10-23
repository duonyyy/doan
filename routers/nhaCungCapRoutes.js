const express = require('express');
const router = express.Router();
const {
  getAllNhaCungCap,
  getNhaCungCapById,
  createNhaCungCap,
  updateNhaCungCap,
  deleteNhaCungCap
} = require('../controllers/nhaCungCapController');

// GET /api/nhacungcap - Lấy danh sách nhà cung cấp
router.get('/', getAllNhaCungCap);

// GET /api/nhacungcap/:id - Lấy nhà cung cấp theo ID
router.get('/:id', getNhaCungCapById);

// POST /api/nhacungcap - Tạo nhà cung cấp mới
router.post('/', createNhaCungCap);

// PUT /api/nhacungcap/:id - Cập nhật nhà cung cấp
router.put('/:id', updateNhaCungCap);

// DELETE /api/nhacungcap/:id - Xóa nhà cung cấp
router.delete('/:id', deleteNhaCungCap);

module.exports = router;
