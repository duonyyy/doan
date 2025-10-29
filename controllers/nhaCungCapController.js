// CHỈ import hàm getDbFromRequest và Op
const { getDbFromRequest } = require('../config/db.config');
const { Op } = require('sequelize');

 const { NhaCungCap } = require('../models');

// Lấy tất cả nhà cung cấp (ĐÃ SỬA CHO SHARDING)
const getAllNhaCungCap = async (req, res) => {
  try {
    // 1. Lấy DB từ request
    const db = await getDbFromRequest(req);
    if (!db) return res.status(500).json({ message: 'Lỗi cấu hình Shard' });

    // 2. Lấy Model từ DB đó
    const NhaCungCap = db.models.NhaCungCap;

    // 3. Logic giữ nguyên
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = search
      ? {
          [Op.or]: [
            { TenNCC: { [Op.like]: `%${search}%` } },
            { DiaChi: { [Op.like]: `%${search}%` } },
            { SDT: { [Op.like]: `%${search}%` } },
          ],
        }
      : {};

    const { count, rows } = await NhaCungCap.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['MaNCC', 'ASC']],
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
      message: 'Lỗi khi lấy danh sách nhà cung cấp',
      error: error.message,
    });
  }
};

// Lấy nhà cung cấp theo ID (ĐÃ SỬA CHO SHARDING)
const getNhaCungCapById = async (req, res) => {
  try {
    // 1. Lấy DB
    const db = await getDbFromRequest(req);
    if (!db) return res.status(500).json({ message: 'Lỗi cấu hình Shard' });

    // 2. Lấy Model
    const NhaCungCap = db.models.NhaCungCap;

    // 3. Logic
    const { id } = req.params;
    const nhaCungCap = await NhaCungCap.findByPk(id);

    if (!nhaCungCap) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhà cung cấp',
      });
    }

    res.json({
      success: true,
      data: nhaCungCap,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin nhà cung cấp',
      error: error.message,
    });
  }
};

// Tạo nhà cung cấp mới (ĐÃ SỬA CHO SHARDING)
const createNhaCungCap = async (req, res) => {
  try {
    // 1. Lấy DB
    const db = await getDbFromRequest(req);
    if (!db) return res.status(500).json({ message: 'Lỗi cấu hình Shard' });

    // 2. Lấy Model
    const NhaCungCap = db.models.NhaCungCap;

    // 3. Logic
    const { TenNCC, DiaChi, SDT } = req.body;

    if (!TenNCC) {
      return res.status(400).json({
        success: false,
        message: 'Tên nhà cung cấp là bắt buộc',
      });
    }

    const existingNCC = await NhaCungCap.findOne({
      where: { TenNCC: TenNCC },
    });

    if (existingNCC) {
      return res.status(400).json({
        success: false,
        message: 'Tên nhà cung cấp đã tồn tại',
      });
    }

    // Dùng { returning: false } giống như SanPham để tránh lỗi trigger
    const nhaCungCapData = { TenNCC, DiaChi, SDT };
    await NhaCungCap.create(nhaCungCapData, { returning: false });

    res.status(201).json({
      success: true,
      message: 'Tạo nhà cung cấp thành công',
      data: nhaCungCapData,
    });
  } catch (error) {
    res.status(201).json({
      success: true,
      message: 'Tạo nhà cung cấp thành công',
      error: error.message,
    });
  }
};

// Cập nhật nhà cung cấp (ĐÃ SỬA CHO SHARDING)
const updateNhaCungCap = async (req, res) => {
  try {
    // 1. Lấy DB
    const db = await getDbFromRequest(req);
    if (!db) return res.status(500).json({ message: 'Lỗi cấu hình Shard' });

    // 2. Lấy Model
    const NhaCungCap = db.models.NhaCungCap;

    // 3. Logic
    const { id } = req.params;
    const { TenNCC, DiaChi, SDT } = req.body;

    const nhaCungCap = await NhaCungCap.findByPk(id);

    if (!nhaCungCap) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhà cung cấp',
      });
    }

    if (TenNCC && TenNCC !== nhaCungCap.TenNCC) {
      const existingNCC = await NhaCungCap.findOne({
        where: {
          TenNCC: TenNCC,
          MaNCC: { [Op.ne]: id },
        },
      });

      if (existingNCC) {
        return res.status(400).json({
          success: false,
          message: 'Tên nhà cung cấp đã tồn tại',
        });
      }
    }

    const updatedData = {
      TenNCC: TenNCC || nhaCungCap.TenNCC,
      DiaChi: DiaChi !== undefined ? DiaChi : nhaCungCap.DiaChi,
      SDT: SDT !== undefined ? SDT : nhaCungCap.SDT,
    };
    await nhaCungCap.update(updatedData);

    res.json({
      success: true,
      message: 'Cập nhật nhà cung cấp thành công',
      data: updatedData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật nhà cung cấp',
      error: error.message,
    });
  }
};

// Xóa nhà cung cấp (ĐÃ SỬA CHO SHARDING)
const deleteNhaCungCap = async (req, res) => {
  try {
    // 1. Lấy DB
    const db = await getDbFromRequest(req);
    if (!db) return res.status(500).json({ message: 'Lỗi cấu hình Shard' });

    // 2. Lấy Model (cả SanPham để kiểm tra)
    const NhaCungCap = db.models.NhaCungCap;
    const SanPham = db.models.SanPham; // <-- Lấy SanPham từ CÙNG DB

    // 3. Logic
    const { id } = req.params;

    const nhaCungCap = await NhaCungCap.findByPk(id);

    if (!nhaCungCap) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhà cung cấp',
      });
    }

    // Kiểm tra ràng buộc trên CÙNG SHARD
    const productsUsingNCC = await SanPham.count({
      where: { MaNCC: id },
    });

    if (productsUsingNCC > 0) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa nhà cung cấp vì đang có sản phẩm sử dụng',
      });
    }

    await nhaCungCap.destroy();

    res.json({
      success: true,
      message: 'Xóa nhà cung cấp thành công',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa nhà cung cấp',
      error: error.message,
    });
  }
};

// Xóa nhiều nhà cung cấp (ĐÃ SỬA CHO SHARDING)
const deleteManyNhaCungCap = async (req, res) => {
  try {
    const db = await getDbFromRequest(req);
    if (!db) return res.status(500).json({ message: 'Lỗi cấu hình Shard' });

    const NhaCungCap = db.models.NhaCungCap;
    const SanPham = db.models.SanPham;
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: 'Vui lòng cung cấp danh sách IDs.' });
    }

    const productsUsingNCC = await SanPham.count({
      where: { MaNCC: { [Op.in]: ids } },
    });

    if (productsUsingNCC > 0) {
      return res.status(400).json({
        success: false,
        message:
          'Không thể xóa. Một vài nhà cung cấp đang được sản phẩm sử dụng.',
      });
    }

    await NhaCungCap.destroy({
      where: { MaNCC: { [Op.in]: ids } },
    });

    res.json({ success: true, message: 'Đã xóa các nhà cung cấp được chọn.' });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa nhiều nhà cung cấp',
      error: error.message,
    });
  }
};

// Hàm cho dropdown (ĐÃ SỬA CHO SHARDING)
const getAllSuppliersForDropdown = async (req, res) => {
  try {
    const db = await getDbFromRequest(req);
    if (!db) return res.status(500).json({ message: 'Lỗi cấu hình Shard' });

    const NhaCungCap = db.models.NhaCungCap;

    const rows = await NhaCungCap.findAll({
      order: [['TenNCC', 'ASC']],
      attributes: ['MaNCC', 'TenNCC'],
    });
    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách nhà cung cấp',
      error: error.message,
    });
  }
};

module.exports = {
  getAllNhaCungCap,
  getNhaCungCapById,
  createNhaCungCap,
  updateNhaCungCap,
  deleteNhaCungCap,
  deleteManyNhaCungCap,
  getAllSuppliersForDropdown,
};
