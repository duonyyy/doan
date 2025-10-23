const { ChiTietXuat, XuatKho, SanPham, TonKho } = require('../models');

// GET /api/chitietxuat - Lấy danh sách chi tiết xuất
const getAllChiTietXuat = async (req, res) => {
  try {
    const { MaXuat, MaSP } = req.query;
    
    let whereClause = {};
    if (MaXuat) whereClause.MaXuat = MaXuat;
    if (MaSP) whereClause.MaSP = MaSP;

    const chiTietXuat = await ChiTietXuat.findAll({
      where: whereClause,
      include: [
        {
          model: XuatKho,
          as: 'XuatKho',
          include: [
            {
              model: require('../models').KhoHang,
              as: 'KhoHang'
            }
          ]
        },
        {
          model: SanPham,
          as: 'SanPham'
        }
      ],
      order: [['MaXuat', 'DESC']]
    });

    res.json({
      success: true,
      data: chiTietXuat
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách chi tiết xuất',
      error: error.message
    });
  }
};

// GET /api/chitietxuat/:maXuat/:maSP - Lấy chi tiết xuất theo ID
const getChiTietXuatById = async (req, res) => {
  try {
    const { maXuat, maSP } = req.params;

    const chiTietXuat = await ChiTietXuat.findOne({
      where: { MaXuat: maXuat, MaSP: maSP },
      include: [
        {
          model: XuatKho,
          as: 'XuatKho',
          include: [
            {
              model: require('../models').KhoHang,
              as: 'KhoHang'
            }
          ]
        },
        {
          model: SanPham,
          as: 'SanPham'
        }
      ]
    });

    if (!chiTietXuat) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chi tiết xuất'
      });
    }

    res.json({
      success: true,
      data: chiTietXuat
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin chi tiết xuất',
      error: error.message
    });
  }
};

// POST /api/chitietxuat - Tạo chi tiết xuất mới
const createChiTietXuat = async (req, res) => {
  const transaction = await require('../config/db.config').getDbConnection().transaction();
  
  try {
    const { MaXuat, MaSP, SoLuong, GiaXuat, Note } = req.body;

    if (!MaXuat || !MaSP || !SoLuong || !GiaXuat) {
      return res.status(400).json({
        success: false,
        message: 'Mã xuất, mã sản phẩm, số lượng và giá xuất là bắt buộc'
      });
    }

    // Validate export record and product
    const [xuatKho, sanPham] = await Promise.all([
      XuatKho.findByPk(MaXuat),
      SanPham.findByPk(MaSP)
    ]);

    if (!xuatKho) {
      return res.status(400).json({
        success: false,
        message: 'Phiếu xuất kho không tồn tại'
      });
    }

    if (!sanPham) {
      return res.status(400).json({
        success: false,
        message: 'Sản phẩm không tồn tại'
      });
    }

    // Check if detail already exists
    const existingDetail = await ChiTietXuat.findOne({
      where: { MaXuat, MaSP }
    });

    if (existingDetail) {
      return res.status(400).json({
        success: false,
        message: 'Chi tiết xuất đã tồn tại'
      });
    }

    // Check inventory availability
    const tonKho = await TonKho.findOne({
      where: { MaSP, MaKho: xuatKho.MaKho }
    });

    if (!tonKho || tonKho.SoLuongTon < SoLuong) {
      return res.status(400).json({
        success: false,
        message: `Không đủ tồn kho. Tồn kho hiện tại: ${tonKho?.SoLuongTon || 0}`
      });
    }

    // Create export detail
    const chiTietXuat = await ChiTietXuat.create({
      MaXuat,
      MaSP,
      SoLuong,
      GiaXuat,
      Note
    }, { transaction });

    // Update inventory
    await tonKho.update({
      SoLuongTon: tonKho.SoLuongTon - SoLuong
    }, { transaction });

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: 'Tạo chi tiết xuất thành công',
      data: chiTietXuat
    });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo chi tiết xuất',
      error: error.message
    });
  }
};

// PUT /api/chitietxuat/:maXuat/:maSP - Cập nhật chi tiết xuất
const updateChiTietXuat = async (req, res) => {
  const transaction = await require('../config/db.config').getDbConnection().transaction();
  
  try {
    const { maXuat, maSP } = req.params;
    const { SoLuong, GiaXuat, Note } = req.body;

    const chiTietXuat = await ChiTietXuat.findOne({
      where: { MaXuat: maXuat, MaSP: maSP }
    });

    if (!chiTietXuat) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chi tiết xuất'
      });
    }

    const oldSoLuong = chiTietXuat.SoLuong;
    const newSoLuong = SoLuong || chiTietXuat.SoLuong;

    // Check inventory if quantity increased
    if (newSoLuong > oldSoLuong) {
      const xuatKho = await XuatKho.findByPk(maXuat);
      const tonKho = await TonKho.findOne({
        where: { MaSP: maSP, MaKho: xuatKho.MaKho }
      });

      const additionalQuantity = newSoLuong - oldSoLuong;
      if (!tonKho || tonKho.SoLuongTon < additionalQuantity) {
        return res.status(400).json({
          success: false,
          message: `Không đủ tồn kho. Cần thêm: ${additionalQuantity}, tồn kho hiện tại: ${tonKho?.SoLuongTon || 0}`
        });
      }
    }

    // Update detail
    await chiTietXuat.update({
      SoLuong: newSoLuong,
      GiaXuat: GiaXuat || chiTietXuat.GiaXuat,
      Note: Note !== undefined ? Note : chiTietXuat.Note
    }, { transaction });

    // Update inventory if quantity changed
    if (oldSoLuong !== newSoLuong) {
      const xuatKho = await XuatKho.findByPk(maXuat);
      const tonKho = await TonKho.findOne({
        where: { MaSP: maSP, MaKho: xuatKho.MaKho }
      });

      if (tonKho) {
        const quantityDiff = newSoLuong - oldSoLuong;
        await tonKho.update({
          SoLuongTon: tonKho.SoLuongTon - quantityDiff
        }, { transaction });
      }
    }

    await transaction.commit();

    res.json({
      success: true,
      message: 'Cập nhật chi tiết xuất thành công',
      data: chiTietXuat
    });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật chi tiết xuất',
      error: error.message
    });
  }
};

// DELETE /api/chitietxuat/:maXuat/:maSP - Xóa chi tiết xuất
const deleteChiTietXuat = async (req, res) => {
  const transaction = await require('../config/db.config').getDbConnection().transaction();
  
  try {
    const { maXuat, maSP } = req.params;

    const chiTietXuat = await ChiTietXuat.findOne({
      where: { MaXuat: maXuat, MaSP: maSP }
    });

    if (!chiTietXuat) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chi tiết xuất'
      });
    }

    // Update inventory
    const xuatKho = await XuatKho.findByPk(maXuat);
    const tonKho = await TonKho.findOne({
      where: { MaSP: maSP, MaKho: xuatKho.MaKho }
    });

    if (tonKho) {
      await tonKho.update({
        SoLuongTon: tonKho.SoLuongTon + chiTietXuat.SoLuong
      }, { transaction });
    }

    // Delete detail
    await chiTietXuat.destroy({ transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Xóa chi tiết xuất thành công'
    });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa chi tiết xuất',
      error: error.message
    });
  }
};

module.exports = {
  getAllChiTietXuat,
  getChiTietXuatById,
  createChiTietXuat,
  updateChiTietXuat,
  deleteChiTietXuat
};
