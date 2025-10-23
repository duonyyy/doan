const { NhaCungCap } = require('../models');
const { getDbConnection } = require('../config/db.config');
const { Op } = require('sequelize');

// Lấy tất cả nhà cung cấp
const getAllNhaCungCap = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = search ? {
      [Op.or]: [
        { TenNCC: { [Op.like]: `%${search}%` } },
        { DiaChi: { [Op.like]: `%${search}%` } },
        { SDT: { [Op.like]: `%${search}%` } }
      ]
    } : {};

    const { count, rows } = await NhaCungCap.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['MaNCC', 'ASC']]
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
    console.error('Error getting all NhaCungCap:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách nhà cung cấp',
      error: error.message
    });
  }
};

// Lấy nhà cung cấp theo ID
const getNhaCungCapById = async (req, res) => {
  try {
    const { id } = req.params;
    const nhaCungCap = await NhaCungCap.findByPk(id);

    if (!nhaCungCap) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhà cung cấp'
      });
    }

    res.json({
      success: true,
      data: nhaCungCap
    });
  } catch (error) {
    console.error('Error getting NhaCungCap by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin nhà cung cấp',
      error: error.message
    });
  }
};

// Tạo nhà cung cấp mới
const createNhaCungCap = async (req, res) => {
  try {
    const { TenNCC, DiaChi, SDT } = req.body;

    // Validation
    if (!TenNCC) {
      return res.status(400).json({
        success: false,
        message: 'Tên nhà cung cấp là bắt buộc'
      });
    }

    // Kiểm tra tên nhà cung cấp đã tồn tại
    const existingNCC = await NhaCungCap.findOne({
      where: { TenNCC: TenNCC }
    });

    if (existingNCC) {
      return res.status(400).json({
        success: false,
        message: 'Tên nhà cung cấp đã tồn tại'
      });
    }

    const nhaCungCap = await NhaCungCap.create({
      TenNCC,
      DiaChi,
      SDT
    });

    res.status(201).json({
      success: true,
      message: 'Tạo nhà cung cấp thành công',
      data: nhaCungCap
    });
  } catch (error) {
    console.error('Error creating NhaCungCap:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo nhà cung cấp',
      error: error.message
    });
  }
};

// Cập nhật nhà cung cấp
const updateNhaCungCap = async (req, res) => {
  try {
    const { id } = req.params;
    const { TenNCC, DiaChi, SDT } = req.body;

    const nhaCungCap = await NhaCungCap.findByPk(id);

    if (!nhaCungCap) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhà cung cấp'
      });
    }

    // Kiểm tra tên nhà cung cấp đã tồn tại (nếu có thay đổi)
    if (TenNCC && TenNCC !== nhaCungCap.TenNCC) {
      const existingNCC = await NhaCungCap.findOne({
        where: { 
          TenNCC: TenNCC,
          MaNCC: { [Op.ne]: id }
        }
      });

      if (existingNCC) {
        return res.status(400).json({
          success: false,
          message: 'Tên nhà cung cấp đã tồn tại'
        });
      }
    }

    await nhaCungCap.update({
      TenNCC: TenNCC || nhaCungCap.TenNCC,
      DiaChi: DiaChi !== undefined ? DiaChi : nhaCungCap.DiaChi,
      SDT: SDT !== undefined ? SDT : nhaCungCap.SDT
    });

    res.json({
      success: true,
      message: 'Cập nhật nhà cung cấp thành công',
      data: nhaCungCap
    });
  } catch (error) {
    console.error('Error updating NhaCungCap:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật nhà cung cấp',
      error: error.message
    });
  }
};

// Xóa nhà cung cấp
const deleteNhaCungCap = async (req, res) => {
  try {
    const { id } = req.params;

    const nhaCungCap = await NhaCungCap.findByPk(id);

    if (!nhaCungCap) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhà cung cấp'
      });
    }

    // Kiểm tra xem nhà cung cấp có đang được sử dụng không
    const { SanPham } = require('../models');
    const productsUsingNCC = await SanPham.count({
      where: { MaNCC: id }
    });

    if (productsUsingNCC > 0) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa nhà cung cấp vì đang có sản phẩm sử dụng'
      });
    }

    await nhaCungCap.destroy();

    res.json({
      success: true,
      message: 'Xóa nhà cung cấp thành công'
    });
  } catch (error) {
    console.error('Error deleting NhaCungCap:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa nhà cung cấp',
      error: error.message
    });
  }
};

// Tìm kiếm nhà cung cấp
const searchNhaCungCap = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập từ khóa tìm kiếm'
      });
    }

    const nhaCungCap = await NhaCungCap.findAll({
      where: {
        [Op.or]: [
          { TenNCC: { [Op.like]: `%${q}%` } },
          { DiaChi: { [Op.like]: `%${q}%` } },
          { SDT: { [Op.like]: `%${q}%` } }
        ]
      },
      order: [['TenNCC', 'ASC']]
    });

    res.json({
      success: true,
      data: nhaCungCap
    });
  } catch (error) {
    console.error('Error searching NhaCungCap:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tìm kiếm nhà cung cấp',
      error: error.message
    });
  }
};

module.exports = {
  getAllNhaCungCap,
  getNhaCungCapById,
  createNhaCungCap,
  updateNhaCungCap,
  deleteNhaCungCap,
  searchNhaCungCap
};
