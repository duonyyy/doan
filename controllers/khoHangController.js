const { KhoHang, KhuVuc, TonKho, SanPham } = require('../models');
const { Op } = require('sequelize');

// GET /api/khohang - Lấy danh sách kho hàng
const getAllKhoHang = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, MaKhuVuc } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = {};
    if (search) {
      whereClause = {
        [Op.or]: [
          { TenKho: { [Op.like]: `%${search}%` } },
          { DiaDiem: { [Op.like]: `%${search}%` } }
        ]
      };
    }
    if (MaKhuVuc) {
      whereClause.MaKhuVuc = MaKhuVuc;
    }

    const { count, rows } = await KhoHang.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['MaKho', 'ASC']],
      include: [
        {
          model: KhuVuc,
          as: 'KhuVuc'
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
      message: 'Lỗi khi lấy danh sách kho hàng',
      error: error.message
    });
  }
};

// GET /api/khohang/:id - Lấy kho hàng theo ID
const getKhoHangById = async (req, res) => {
  try {
    const { id } = req.params;
    const khoHang = await KhoHang.findByPk(id, {
      include: [
        {
          model: KhuVuc,
          as: 'KhuVuc'
        },
        {
          model: TonKho,
          as: 'TonKhos',
          include: [
            {
              model: SanPham,
              as: 'SanPham'
            }
          ]
        }
      ]
    });

    if (!khoHang) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy kho hàng'
      });
    }

    res.json({
      success: true,
      data: khoHang
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin kho hàng',
      error: error.message
    });
  }
};

// POST /api/khohang - Tạo kho hàng mới
const createKhoHang = async (req, res) => {
  try {
    const { TenKho, DiaDiem, MaKhuVuc } = req.body;

    if (!TenKho || !MaKhuVuc) {
      return res.status(400).json({
        success: false,
        message: 'Tên kho và mã khu vực là bắt buộc'
      });
    }

    // Check if area exists
    const khuVuc = await KhuVuc.findByPk(MaKhuVuc);
    if (!khuVuc) {
      return res.status(400).json({
        success: false,
        message: 'Khu vực không tồn tại'
      });
    }

    const khoHang = await KhoHang.create({
      TenKho,
      DiaDiem,
      MaKhuVuc
    });

    res.status(201).json({
      success: true,
      message: 'Tạo kho hàng thành công',
      data: khoHang
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Tên kho đã tồn tại'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo kho hàng',
      error: error.message
    });
  }
};

// PUT /api/khohang/:id - Cập nhật kho hàng
const updateKhoHang = async (req, res) => {
  try {
    const { id } = req.params;
    const { TenKho, DiaDiem, MaKhuVuc } = req.body;

    const khoHang = await KhoHang.findByPk(id);
    if (!khoHang) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy kho hàng'
      });
    }

    // Check if new area exists
    if (MaKhuVuc) {
      const khuVuc = await KhuVuc.findByPk(MaKhuVuc);
      if (!khuVuc) {
        return res.status(400).json({
          success: false,
          message: 'Khu vực không tồn tại'
        });
      }
    }

    await khoHang.update({
      TenKho: TenKho || khoHang.TenKho,
      DiaDiem: DiaDiem || khoHang.DiaDiem,
      MaKhuVuc: MaKhuVuc || khoHang.MaKhuVuc
    });

    res.json({
      success: true,
      message: 'Cập nhật kho hàng thành công',
      data: khoHang
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Tên kho đã tồn tại'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật kho hàng',
      error: error.message
    });
  }
};

// DELETE /api/khohang/:id - Xóa kho hàng
const deleteKhoHang = async (req, res) => {
  try {
    const { id } = req.params;

    const khoHang = await KhoHang.findByPk(id);
    if (!khoHang) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy kho hàng'
      });
    }

    // Check if warehouse has inventory or transactions
    const tonKhoCount = await TonKho.count({
      where: { MaKho: id }
    });

    if (tonKhoCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa kho hàng vì còn tồn kho'
      });
    }

    await khoHang.destroy();

    res.json({
      success: true,
      message: 'Xóa kho hàng thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa kho hàng',
      error: error.message
    });
  }
};

module.exports = {
  getAllKhoHang,
  getKhoHangById,
  createKhoHang,
  updateKhoHang,
  deleteKhoHang
};
