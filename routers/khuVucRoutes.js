const express = require('express');
const router = express.Router();
const {
  getAllKhuVuc,
  getKhuVucById,
  createKhuVuc,
  updateKhuVuc,
  deleteKhuVuc
} = require('../controllers/khuVucController');

// GET /api/khuvuc - Lấy danh sách khu vực
router.get('/', getAllKhuVuc);

// GET /api/khuvuc/:id - Lấy khu vực theo ID
router.get('/:id', getKhuVucById);

// POST /api/khuvuc - Tạo khu vực mới
router.post('/', createKhuVuc);

// PUT /api/khuvuc/:id - Cập nhật khu vực
router.put('/:id', updateKhuVuc);

// DELETE /api/khuvuc/:id - Xóa khu vực
router.delete('/:id', deleteKhuVuc);

module.exports = router;
