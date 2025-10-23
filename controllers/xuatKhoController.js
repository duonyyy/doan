const { XuatKho, ChiTietXuat, KhoHang, SanPham, TonKho } = require('../models');
const { Op } = require('sequelize');

// GET /api/xuatkho - Lấy danh sách xuất kho
const getAllXuatKho = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, MaKho, fromDate, toDate } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = {};
    if (search) {
      whereClause = {
        GhiChu: { [Op.like]: `%${search}%` }
      };
    }
    if (MaKho) {
      whereClause.MaKho = MaKho;
    }
    if (fromDate && toDate) {
      whereClause.NgayXuat = {
        [Op.between]: [fromDate, toDate]
      };
    }

    const { count, rows } = await XuatKho.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['NgayXuat', 'DESC'], ['MaXuat', 'DESC']],
      include: [
        {
          model: KhoHang,
          as: 'KhoHang',
          include: [
            {
              model: require('../models').KhuVuc,
              as: 'KhuVuc'
            }
          ]
        },
        {
          model: ChiTietXuat,
          as: 'ChiTietXuats',
          include: [
            {
              model: SanPham,
              as: 'SanPham'
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
      message: 'Lỗi khi lấy danh sách xuất kho',
      error: error.message
    });
  }
};

// GET /api/xuatkho/:id - Lấy xuất kho theo ID
const getXuatKhoById = async (req, res) => {
  try {
    const { id } = req.params;
    const xuatKho = await XuatKho.findByPk(id, {
      include: [
        {
          model: KhoHang,
          as: 'KhoHang',
          include: [
            {
              model: require('../models').KhuVuc,
              as: 'KhuVuc'
            }
          ]
        },
        {
          model: ChiTietXuat,
          as: 'ChiTietXuats',
          include: [
            {
              model: SanPham,
              as: 'SanPham'
            }
          ]
        }
      ]
    });

    if (!xuatKho) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phiếu xuất kho'
      });
    }

    res.json({
      success: true,
      data: xuatKho
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin xuất kho',
      error: error.message
    });
  }
};

// POST /api/xuatkho - Tạo phiếu xuất kho mới
const createXuatKho = async (req, res) => {
  const transaction = await require('../config/db.config').getDbConnection().transaction();
  
  try {
    const { MaKho, NgayXuat, GhiChu, chiTietXuat } = req.body;

    if (!MaKho || !NgayXuat || !chiTietXuat || chiTietXuat.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Thông tin bắt buộc: kho, ngày xuất và chi tiết xuất'
      });
    }

    // Validate warehouse
    const khoHang = await KhoHang.findByPk(MaKho);
    if (!khoHang) {
      return res.status(400).json({
        success: false,
        message: 'Kho hàng không tồn tại'
      });
    }

    // Check inventory availability
    for (const chiTiet of chiTietXuat) {
      const { MaSP, SoLuong } = chiTiet;
      
      const tonKho = await TonKho.findOne({
        where: { MaSP, MaKho }
      });

      if (!tonKho || tonKho.SoLuongTon < SoLuong) {
        const sanPham = await SanPham.findByPk(MaSP);
        return res.status(400).json({
          success: false,
          message: `Không đủ tồn kho cho sản phẩm ${sanPham?.TenSP || MaSP}. Tồn kho hiện tại: ${tonKho?.SoLuongTon || 0}`
        });
      }
    }

    // Create export record
    const xuatKho = await XuatKho.create({
      MaKho,
      NgayXuat,
      GhiChu
    }, { transaction });

    // Create export details and update inventory
    for (const chiTiet of chiTietXuat) {
      const { MaSP, SoLuong, GiaXuat, Note } = chiTiet;

      // Validate product
      const sanPham = await SanPham.findByPk(MaSP);
      if (!sanPham) {
        throw new Error(`Sản phẩm với mã ${MaSP} không tồn tại`);
      }

      // Create export detail
      await ChiTietXuat.create({
        MaXuat: xuatKho.MaXuat,
        MaSP,
        SoLuong,
        GiaXuat,
        Note
      }, { transaction });

      // Update inventory
      const tonKho = await TonKho.findOne({
        where: { MaSP, MaKho }
      });

      await tonKho.update({
        SoLuongTon: tonKho.SoLuongTon - SoLuong
      }, { transaction });
    }

    await transaction.commit();

    // Broadcast real-time update
    if (global.socketServer) {
      global.socketServer.broadcastInventoryUpdate(
        khoHang.MaKhuVuc,
        MaKho,
        'xuat-kho',
        {
          maXuat: xuatKho.MaXuat,
          ngayXuat: NgayXuat,
          chiTiet: chiTietXuat
        }
      );
    }

    res.status(201).json({
      success: true,
      message: 'Tạo phiếu xuất kho thành công',
      data: { MaXuat: xuatKho.MaXuat }
    });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo phiếu xuất kho',
      error: error.message
    });
  }
};

// PUT /api/xuatkho/:id - Cập nhật phiếu xuất kho
const updateXuatKho = async (req, res) => {
  try {
    const { id } = req.params;
    const { NgayXuat, GhiChu } = req.body;

    const xuatKho = await XuatKho.findByPk(id);
    if (!xuatKho) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phiếu xuất kho'
      });
    }

    await xuatKho.update({
      NgayXuat: NgayXuat || xuatKho.NgayXuat,
      GhiChu: GhiChu !== undefined ? GhiChu : xuatKho.GhiChu
    });

    res.json({
      success: true,
      message: 'Cập nhật phiếu xuất kho thành công',
      data: xuatKho
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật phiếu xuất kho',
      error: error.message
    });
  }
};

// DELETE /api/xuatkho/:id - Xóa phiếu xuất kho
const deleteXuatKho = async (req, res) => {
  const transaction = await require('../config/db.config').getDbConnection().transaction();
  
  try {
    const { id } = req.params;

    const xuatKho = await XuatKho.findByPk(id, {
      include: [
        {
          model: ChiTietXuat,
          as: 'ChiTietXuats'
        }
      ]
    });

    if (!xuatKho) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phiếu xuất kho'
      });
    }

    // Reverse inventory changes
    for (const chiTiet of xuatKho.ChiTietXuats) {
      const tonKho = await TonKho.findOne({
        where: { MaSP: chiTiet.MaSP, MaKho: xuatKho.MaKho }
      });

      if (tonKho) {
        await tonKho.update({
          SoLuongTon: tonKho.SoLuongTon + chiTiet.SoLuong
        }, { transaction });
      }
    }

    // Delete export details
    await ChiTietXuat.destroy({
      where: { MaXuat: id },
      transaction
    });

    // Delete export record
    await xuatKho.destroy({ transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Xóa phiếu xuất kho thành công'
    });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa phiếu xuất kho',
      error: error.message
    });
  }
};

module.exports = {
  getAllXuatKho,
  getXuatKhoById,
  createXuatKho,
  updateXuatKho,
  deleteXuatKho
};
