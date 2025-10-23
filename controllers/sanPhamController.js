const { SanPham, NhaCungCap, ChiTietNhap, ChiTietXuat, TonKho } = require('../models');
const { Op } = require('sequelize');

// GET /api/sanpham - Lấy danh sách sản phẩm
const getAllSanPham = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, MaNCC } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = {};
    if (search) {
      whereClause = {
        [Op.or]: [
          { TenSP: { [Op.like]: `%${search}%` } },
          { MoTa: { [Op.like]: `%${search}%` } }
        ]
      };
    }
    if (MaNCC) {
      whereClause.MaNCC = MaNCC;
    }

    const { count, rows } = await SanPham.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['MaSP', 'ASC']],
      include: [
        {
          model: NhaCungCap,
          as: 'NhaCungCap'
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
      message: 'Lỗi khi lấy danh sách sản phẩm',
      error: error.message
    });
  }
};

// GET /api/sanpham/:id - Lấy sản phẩm theo ID
const getSanPhamById = async (req, res) => {
  try {
    const { id } = req.params;
    const sanPham = await SanPham.findByPk(id, {
      include: [
        {
          model: NhaCungCap,
          as: 'NhaCungCap'
        },
        {
          model: TonKho,
          as: 'TonKhos'
        }
      ]
    });

    if (!sanPham) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }

    res.json({
      success: true,
      data: sanPham
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin sản phẩm',
      error: error.message
    });
  }
};

// POST /api/sanpham - Tạo sản phẩm mới
const createSanPham = async (req, res) => {
  try {
    const { TenSP, DonVi, MaNCC, MoTa } = req.body;

    if (!TenSP || !DonVi || !MaNCC) {
      return res.status(400).json({
        success: false,
        message: 'Tên sản phẩm, đơn vị và mã nhà cung cấp là bắt buộc'
      });
    }

    // Check if supplier exists
    const nhaCungCap = await NhaCungCap.findByPk(MaNCC);
    if (!nhaCungCap) {
      return res.status(400).json({
        success: false,
        message: 'Nhà cung cấp không tồn tại'
      });
    }

    const sanPham = await SanPham.create({
      TenSP,
      DonVi,
      MaNCC,
      MoTa
    });

    res.status(201).json({
      success: true,
      message: 'Tạo sản phẩm thành công',
      data: sanPham
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo sản phẩm',
      error: error.message
    });
  }
};

// PUT /api/sanpham/:id - Cập nhật sản phẩm
const updateSanPham = async (req, res) => {
  try {
    const { id } = req.params;
    const { TenSP, DonVi, MaNCC, MoTa } = req.body;

    const sanPham = await SanPham.findByPk(id);
    if (!sanPham) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }

    // Check if new supplier exists
    if (MaNCC) {
      const nhaCungCap = await NhaCungCap.findByPk(MaNCC);
      if (!nhaCungCap) {
        return res.status(400).json({
          success: false,
          message: 'Nhà cung cấp không tồn tại'
        });
      }
    }

    await sanPham.update({
      TenSP: TenSP || sanPham.TenSP,
      DonVi: DonVi || sanPham.DonVi,
      MaNCC: MaNCC || sanPham.MaNCC,
      MoTa: MoTa !== undefined ? MoTa : sanPham.MoTa
    });

    res.json({
      success: true,
      message: 'Cập nhật sản phẩm thành công',
      data: sanPham
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật sản phẩm',
      error: error.message
    });
  }
};

// DELETE /api/sanpham/:id - Xóa sản phẩm
const deleteSanPham = async (req, res) => {
  try {
    const { id } = req.params;

    const sanPham = await SanPham.findByPk(id);
    if (!sanPham) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }

    // Check if product has inventory or transactions
    const tonKhoCount = await TonKho.count({
      where: { MaSP: id }
    });

    const chiTietNhapCount = await ChiTietNhap.count({
      where: { MaSP: id }
    });

    const chiTietXuatCount = await ChiTietXuat.count({
      where: { MaSP: id }
    });

    if (tonKhoCount > 0 || chiTietNhapCount > 0 || chiTietXuatCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa sản phẩm vì còn tồn kho hoặc giao dịch liên quan'
      });
    }

    await sanPham.destroy();

    res.json({
      success: true,
      message: 'Xóa sản phẩm thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa sản phẩm',
      error: error.message
    });
  }
};

module.exports = {
  getAllSanPham,
  getSanPhamById,
  createSanPham,
  updateSanPham,
  deleteSanPham
};
