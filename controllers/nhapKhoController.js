const { NhapKho, ChiTietNhap, KhoHang, NhaCungCap, SanPham, TonKho } = require('../models');
const { Op } = require('sequelize');

// GET /api/nhapkho - Lấy danh sách nhập kho
const getAllNhapKho = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, MaKho, MaNCC, fromDate, toDate } = req.query;
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
    if (MaNCC) {
      whereClause.MaNCC = MaNCC;
    }
    if (fromDate && toDate) {
      whereClause.NgayNhap = {
        [Op.between]: [fromDate, toDate]
      };
    }

    const { count, rows } = await NhapKho.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['NgayNhap', 'DESC'], ['MaNhap', 'DESC']],
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
          model: NhaCungCap,
          as: 'NhaCungCap'
        },
        {
          model: ChiTietNhap,
          as: 'ChiTietNhaps',
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
      message: 'Lỗi khi lấy danh sách nhập kho',
      error: error.message
    });
  }
};

// GET /api/nhapkho/:id - Lấy nhập kho theo ID
const getNhapKhoById = async (req, res) => {
  try {
    const { id } = req.params;
    const nhapKho = await NhapKho.findByPk(id, {
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
          model: NhaCungCap,
          as: 'NhaCungCap'
        },
        {
          model: ChiTietNhap,
          as: 'ChiTietNhaps',
          include: [
            {
              model: SanPham,
              as: 'SanPham'
            }
          ]
        }
      ]
    });

    if (!nhapKho) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phiếu nhập kho'
      });
    }

    res.json({
      success: true,
      data: nhapKho
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin nhập kho',
      error: error.message
    });
  }
};

// POST /api/nhapkho - Tạo phiếu nhập kho mới
const createNhapKho = async (req, res) => {
  const transaction = await require('../config/db.config').getDbConnection().transaction();
  
  try {
    const { MaKho, MaNCC, NgayNhap, GhiChu, chiTietNhap } = req.body;

    if (!MaKho || !MaNCC || !NgayNhap || !chiTietNhap || chiTietNhap.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Thông tin bắt buộc: kho, nhà cung cấp, ngày nhập và chi tiết nhập'
      });
    }

    // Validate warehouse and supplier
    const [khoHang, nhaCungCap] = await Promise.all([
      KhoHang.findByPk(MaKho),
      NhaCungCap.findByPk(MaNCC)
    ]);

    if (!khoHang) {
      return res.status(400).json({
        success: false,
        message: 'Kho hàng không tồn tại'
      });
    }

    if (!nhaCungCap) {
      return res.status(400).json({
        success: false,
        message: 'Nhà cung cấp không tồn tại'
      });
    }

    // Create import record
    const nhapKho = await NhapKho.create({
      MaKho,
      MaNCC,
      NgayNhap,
      GhiChu
    }, { transaction });

    // Create import details and update inventory
    for (const chiTiet of chiTietNhap) {
      const { MaSP, SoLuong, GiaNhap, Note } = chiTiet;

      // Validate product
      const sanPham = await SanPham.findByPk(MaSP);
      if (!sanPham) {
        throw new Error(`Sản phẩm với mã ${MaSP} không tồn tại`);
      }

      // Create import detail
      await ChiTietNhap.create({
        MaNhap: nhapKho.MaNhap,
        MaSP,
        SoLuong,
        GiaNhap,
        Note
      }, { transaction });

      // Update or create inventory
      const [tonKho, created] = await TonKho.findOrCreate({
        where: { MaSP, MaKho },
        defaults: { SoLuongTon: 0 },
        transaction
      });

      await tonKho.update({
        SoLuongTon: tonKho.SoLuongTon + SoLuong
      }, { transaction });
    }

    await transaction.commit();

    // Broadcast real-time update
    if (global.socketServer) {
      global.socketServer.broadcastInventoryUpdate(
        khoHang.MaKhuVuc,
        MaKho,
        'nhap-kho',
        {
          maNhap: nhapKho.MaNhap,
          ngayNhap: NgayNhap,
          chiTiet: chiTietNhap
        }
      );
    }

    res.status(201).json({
      success: true,
      message: 'Tạo phiếu nhập kho thành công',
      data: { MaNhap: nhapKho.MaNhap }
    });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo phiếu nhập kho',
      error: error.message
    });
  }
};

// PUT /api/nhapkho/:id - Cập nhật phiếu nhập kho
const updateNhapKho = async (req, res) => {
  try {
    const { id } = req.params;
    const { NgayNhap, GhiChu } = req.body;

    const nhapKho = await NhapKho.findByPk(id);
    if (!nhapKho) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phiếu nhập kho'
      });
    }

    await nhapKho.update({
      NgayNhap: NgayNhap || nhapKho.NgayNhap,
      GhiChu: GhiChu !== undefined ? GhiChu : nhapKho.GhiChu
    });

    res.json({
      success: true,
      message: 'Cập nhật phiếu nhập kho thành công',
      data: nhapKho
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật phiếu nhập kho',
      error: error.message
    });
  }
};

// DELETE /api/nhapkho/:id - Xóa phiếu nhập kho
const deleteNhapKho = async (req, res) => {
  const transaction = await require('../config/db.config').getDbConnection().transaction();
  
  try {
    const { id } = req.params;

    const nhapKho = await NhapKho.findByPk(id, {
      include: [
        {
          model: ChiTietNhap,
          as: 'ChiTietNhaps'
        }
      ]
    });

    if (!nhapKho) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phiếu nhập kho'
      });
    }

    // Reverse inventory changes
    for (const chiTiet of nhapKho.ChiTietNhaps) {
      const tonKho = await TonKho.findOne({
        where: { MaSP: chiTiet.MaSP, MaKho: nhapKho.MaKho }
      });

      if (tonKho) {
        await tonKho.update({
          SoLuongTon: tonKho.SoLuongTon - chiTiet.SoLuong
        }, { transaction });
      }
    }

    // Delete import details
    await ChiTietNhap.destroy({
      where: { MaNhap: id },
      transaction
    });

    // Delete import record
    await nhapKho.destroy({ transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Xóa phiếu nhập kho thành công'
    });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa phiếu nhập kho',
      error: error.message
    });
  }
};

module.exports = {
  getAllNhapKho,
  getNhapKhoById,
  createNhapKho,
  updateNhapKho,
  deleteNhapKho
};
