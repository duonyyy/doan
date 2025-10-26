const { getDbFromRequest } = require('../config/db.config'); // <-- Chỉ import hàm này
const { Op } = require('sequelize');

// BỎ HOÀN TOÀN: const { KhoHang, KhuVuc, ... } = require('../models');

// GET /api/khohang - Lấy danh sách kho hàng
const getAllKhoHang = async (req, res) => {
  try {
    // 1. Lấy DB
    const db = await getDbFromRequest(req);
    if (!db) return res.status(500).json({ message: 'Lỗi cấu hình Shard' });

    // 2. Lấy Model từ DB
    const KhoHang = db.models.KhoHang;
    const KhuVuc = db.models.KhuVuc;

    // 3. Logic
    const { page = 1, limit = 10, search, MaKhuVuc } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};
    if (search) {
      whereClause = {
        [Op.or]: [
          { TenKho: { [Op.like]: `%${search}%` } },
          { DiaDiem: { [Op.like]: `%${search}%` } },
        ],
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
          as: 'KhuVuc',
        },
      ],
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách kho hàng',
      error: error.message,
    });
  }
};

// GET /api/khohang/:id - Lấy kho hàng theo ID
const getKhoHangById = async (req, res) => {
  try {
    // 1. Lấy DB
    const db = await getDbFromRequest(req);
    if (!db) return res.status(500).json({ message: 'Lỗi cấu hình Shard' });

    // 2. Lấy Models
    const KhoHang = db.models.KhoHang;
    const KhuVuc = db.models.KhuVuc;
    const TonKho = db.models.TonKho;
    const SanPham = db.models.SanPham;

    // 3. Logic
    const { id } = req.params;
    const khoHang = await KhoHang.findByPk(id, {
      include: [
        {
          model: KhuVuc,
          as: 'KhuVuc',
        },
        {
          model: TonKho,
          as: 'TonKhos',
          include: [
            {
              model: SanPham,
              as: 'SanPham',
            },
          ],
        },
      ],
    });

    if (!khoHang) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy kho hàng',
      });
    }

    res.json({
      success: true,
      data: khoHang,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin kho hàng',
      error: error.message,
    });
  }
};

// POST /api/khohang - Tạo kho hàng mới
const createKhoHang = async (req, res) => {
  try {
    // 1. Lấy DB
    const db = await getDbFromRequest(req);
    if (!db) return res.status(500).json({ message: 'Lỗi cấu hình Shard' });

    // 2. Lấy Models
    const KhoHang = db.models.KhoHang;
    const KhuVuc = db.models.KhuVuc;

    // 3. Logic
    const { TenKho, DiaDiem, MaKhuVuc } = req.body;

    if (!TenKho || !MaKhuVuc) {
      return res.status(400).json({
        success: false,
        message: 'Tên kho và mã khu vực là bắt buộc',
      });
    }

    const khuVuc = await KhuVuc.findByPk(MaKhuVuc);
    if (!khuVuc) {
      return res.status(400).json({
        success: false,
        message: 'Khu vực không tồn tại',
      });
    }

    const khoHangData = {
      TenKho,
      DiaDiem,
      MaKhuVuc,
    };

    // Thêm { returning: false } giống như SanPham, NhaCungCap
    await KhoHang.create(khoHangData, { returning: false });

    res.status(201).json({
      success: true,
      message: 'Tạo kho hàng thành công',
      data: khoHangData,
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Tên kho đã tồn tại',
      });
    }
    res.status(201).json({
       success: true,
      message: 'Tạo kho hàng thành công',
      error: error.message,
    });
  }
};

// PUT /api/khohang/:id - Cập nhật kho hàng
const updateKhoHang = async (req, res) => {
  try {
    // 1. Lấy DB
    const db = await getDbFromRequest(req);
    if (!db) return res.status(500).json({ message: 'Lỗi cấu hình Shard' });

    // 2. Lấy Models
    const KhoHang = db.models.KhoHang;
    const KhuVuc = db.models.KhuVuc;

    // 3. Logic
    const { id } = req.params;
    const { TenKho, DiaDiem, MaKhuVuc } = req.body;

    const khoHang = await KhoHang.findByPk(id);
    if (!khoHang) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy kho hàng',
      });
    }

    if (MaKhuVuc) {
      const khuVuc = await KhuVuc.findByPk(MaKhuVuc);
      if (!khuVuc) {
        return res.status(400).json({
          success: false,
          message: 'Khu vực không tồn tại',
        });
      }
    }

    const updatedData = {
      TenKho: TenKho || khoHang.TenKho,
      DiaDiem: DiaDiem !== undefined ? DiaDiem : khoHang.DiaDiem,
      MaKhuVuc: MaKhuVuc || khoHang.MaKhuVuc,
    };

    await khoHang.update(updatedData);

    res.json({
      success: true,
      message: 'Cập nhật kho hàng thành công',
      data: updatedData,
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Tên kho đã tồn tại',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật kho hàng',
      error: error.message,
    });
  }
};

// DELETE /api/khohang/:id - Xóa kho hàng
const deleteKhoHang = async (req, res) => {
  try {
    // 1. Lấy DB
    const db = await getDbFromRequest(req);
    if (!db) return res.status(500).json({ message: 'Lỗi cấu hình Shard' });

    // 2. Lấy Models
    const KhoHang = db.models.KhoHang;
    const TonKho = db.models.TonKho;

    // 3. Logic
    const { id } = req.params;

    const khoHang = await KhoHang.findByPk(id);
    if (!khoHang) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy kho hàng',
      });
    }

    // Check tồn kho trên CÙNG SHARD
    const tonKhoCount = await TonKho.count({
      where: { MaKho: id },
    });

    if (tonKhoCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa kho hàng vì còn tồn kho',
      });
    }

    await khoHang.destroy();

    res.json({
      success: true,
      message: 'Xóa kho hàng thành công',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa kho hàng',
      error: error.message,
    });
  }
};

module.exports = {
  getAllKhoHang,
  getKhoHangById,
  createKhoHang,
  updateKhoHang,
  deleteKhoHang,
};
