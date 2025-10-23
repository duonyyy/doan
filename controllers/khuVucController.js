const { KhuVuc, KhoHang } = require('../models');
const { Op } = require('sequelize');

// GET /api/khuvuc - Lấy danh sách khu vực
const getAllKhuVuc = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = {};
    if (search) {
      whereClause = {
        TenKhuVuc: { [Op.like]: `%${search}%` }
      };
    }

    const { count, rows } = await KhuVuc.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['MaKhuVuc', 'ASC']],
      include: [
        {
          model: KhoHang,
          as: 'KhoHangs'
        }
      ]
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách khu vực',
      error: error.message
    });
  }
};

// GET /api/khuvuc/:id - Lấy khu vực theo ID
const getKhuVucById = async (req, res) => {
  try {
    const { id } = req.params;
    const khuVuc = await KhuVuc.findByPk(id, {
      include: [
        {
          model: KhoHang,
          as: 'KhoHangs'
        }
      ]
    });

    if (!khuVuc) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khu vực'
      });
    }

    res.json({
      success: true,
      data: khuVuc
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin khu vực',
      error: error.message
    });
  }
};

// POST /api/khuvuc - Tạo khu vực mới
const createKhuVuc = async (req, res) => {
  try {
    const { TenKhuVuc } = req.body;

    if (!TenKhuVuc) {
      return res.status(400).json({
        success: false,
        message: 'Tên khu vực là bắt buộc'
      });
    }

    const khuVuc = await KhuVuc.create({
      TenKhuVuc
    });

    res.status(201).json({
      success: true,
      message: 'Tạo khu vực thành công',
      data: khuVuc
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Tên khu vực đã tồn tại'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo khu vực',
      error: error.message
    });
  }
};

// PUT /api/khuvuc/:id - Cập nhật khu vực
const updateKhuVuc = async (req, res) => {
  try {
    const { id } = req.params;
    const { TenKhuVuc } = req.body;

    const khuVuc = await KhuVuc.findByPk(id);
    if (!khuVuc) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khu vực'
      });
    }

    await khuVuc.update({
      TenKhuVuc: TenKhuVuc || khuVuc.TenKhuVuc
    });

    res.json({
      success: true,
      message: 'Cập nhật khu vực thành công',
      data: khuVuc
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Tên khu vực đã tồn tại'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật khu vực',
      error: error.message
    });
  }
};

// DELETE /api/khuvuc/:id - Xóa khu vực
const deleteKhuVuc = async (req, res) => {
  try {
    const { id } = req.params;

    const khuVuc = await KhuVuc.findByPk(id);
    if (!khuVuc) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khu vực'
      });
    }

    // Check if area has warehouses
    const khoHangCount = await KhoHang.count({
      where: { MaKhuVuc: id }
    });

    if (khoHangCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa khu vực vì còn kho hàng liên quan'
      });
    }

    await khuVuc.destroy();

    res.json({
      success: true,
      message: 'Xóa khu vực thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa khu vực',
      error: error.message
    });
  }
};

module.exports = {
  getAllKhuVuc,
  getKhuVucById,
  createKhuVuc,
  updateKhuVuc,
  deleteKhuVuc
};
