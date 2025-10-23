const { TonKho, SanPham, KhoHang } = require('../models');
const { Op } = require('sequelize');

// GET /api/tonkho - Lấy danh sách tồn kho
const getAllTonKho = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, MaKho, MaSP, minQuantity, maxQuantity } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = {};
    if (MaKho) whereClause.MaKho = MaKho;
    if (MaSP) whereClause.MaSP = MaSP;
    if (minQuantity !== undefined || maxQuantity !== undefined) {
      whereClause.SoLuongTon = {};
      if (minQuantity !== undefined) whereClause.SoLuongTon[Op.gte] = minQuantity;
      if (maxQuantity !== undefined) whereClause.SoLuongTon[Op.lte] = maxQuantity;
    }

    const { count, rows } = await TonKho.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['MaKho', 'ASC'], ['MaSP', 'ASC']],
      include: [
        {
          model: SanPham,
          as: 'SanPham',
          where: search ? {
            [Op.or]: [
              { TenSP: { [Op.like]: `%${search}%` } },
              { MoTa: { [Op.like]: `%${search}%` } }
            ]
          } : undefined
        },
        {
          model: KhoHang,
          as: 'KhoHang',
          include: [
            {
              model: require('../models').KhuVuc,
              as: 'KhuVuc'
            }
          ]
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
      message: 'Lỗi khi lấy danh sách tồn kho',
      error: error.message
    });
  }
};

// GET /api/tonkho/:maSP/:maKho - Lấy tồn kho theo ID
const getTonKhoById = async (req, res) => {
  try {
    const { maSP, maKho } = req.params;

    const tonKho = await TonKho.findOne({
      where: { MaSP: maSP, MaKho: maKho },
      include: [
        {
          model: SanPham,
          as: 'SanPham',
          include: [
            {
              model: require('../models').NhaCungCap,
              as: 'NhaCungCap'
            }
          ]
        },
        {
          model: KhoHang,
          as: 'KhoHang',
          include: [
            {
              model: require('../models').KhuVuc,
              as: 'KhuVuc'
            }
          ]
        }
      ]
    });

    if (!tonKho) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tồn kho'
      });
    }

    res.json({
      success: true,
      data: tonKho
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin tồn kho',
      error: error.message
    });
  }
};

// GET /api/tonkho/summary - Lấy tổng kết tồn kho
const getTonKhoSummary = async (req, res) => {
  try {
    const { MaKho } = req.query;

    let whereClause = {};
    if (MaKho) whereClause.MaKho = MaKho;

    const tonKhoData = await TonKho.findAll({
      where: whereClause,
      include: [
        {
          model: SanPham,
          as: 'SanPham'
        },
        {
          model: KhoHang,
          as: 'KhoHang',
          include: [
            {
              model: require('../models').KhuVuc,
              as: 'KhuVuc'
            }
          ]
        }
      ]
    });

    // Calculate summary statistics
    const totalProducts = tonKhoData.length;
    const totalQuantity = tonKhoData.reduce((sum, item) => sum + item.SoLuongTon, 0);
    const lowStockItems = tonKhoData.filter(item => item.SoLuongTon <= 10).length;
    const outOfStockItems = tonKhoData.filter(item => item.SoLuongTon === 0).length;

    // Group by warehouse
    const warehouseSummary = tonKhoData.reduce((acc, item) => {
      const warehouseName = item.KhoHang.TenKho;
      if (!acc[warehouseName]) {
        acc[warehouseName] = {
          totalProducts: 0,
          totalQuantity: 0,
          lowStockItems: 0
        };
      }
      acc[warehouseName].totalProducts++;
      acc[warehouseName].totalQuantity += item.SoLuongTon;
      if (item.SoLuongTon <= 10) acc[warehouseName].lowStockItems++;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        summary: {
          totalProducts,
          totalQuantity,
          lowStockItems,
          outOfStockItems
        },
        warehouseSummary
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy tổng kết tồn kho',
      error: error.message
    });
  }
};

// PUT /api/tonkho/:maSP/:maKho - Cập nhật tồn kho (chỉ cho phép cập nhật số lượng)
const updateTonKho = async (req, res) => {
  try {
    const { maSP, maKho } = req.params;
    const { SoLuongTon } = req.body;

    if (SoLuongTon === undefined || SoLuongTon < 0) {
      return res.status(400).json({
        success: false,
        message: 'Số lượng tồn kho phải >= 0'
      });
    }

    const tonKho = await TonKho.findOne({
      where: { MaSP: maSP, MaKho: maKho }
    });

    if (!tonKho) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tồn kho'
      });
    }

    await tonKho.update({
      SoLuongTon
    });

    res.json({
      success: true,
      message: 'Cập nhật tồn kho thành công',
      data: tonKho
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật tồn kho',
      error: error.message
    });
  }
};

// DELETE /api/tonkho/:maSP/:maKho - Xóa tồn kho (chỉ khi số lượng = 0)
const deleteTonKho = async (req, res) => {
  try {
    const { maSP, maKho } = req.params;

    const tonKho = await TonKho.findOne({
      where: { MaSP: maSP, MaKho: maKho }
    });

    if (!tonKho) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tồn kho'
      });
    }

    if (tonKho.SoLuongTon > 0) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa tồn kho khi còn số lượng > 0'
      });
    }

    await tonKho.destroy();

    res.json({
      success: true,
      message: 'Xóa tồn kho thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa tồn kho',
      error: error.message
    });
  }
};

module.exports = {
  getAllTonKho,
  getTonKhoById,
  getTonKhoSummary,
  updateTonKho,
  deleteTonKho
};
