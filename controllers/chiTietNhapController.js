const { ChiTietNhap, NhapKho, SanPham, TonKho } = require('../models');

// GET /api/chitietnhap - Lấy danh sách chi tiết nhập
const getAllChiTietNhap = async (req, res) => {
  try {
    const { MaNhap, MaSP } = req.query;
    
    let whereClause = {};
    if (MaNhap) whereClause.MaNhap = MaNhap;
    if (MaSP) whereClause.MaSP = MaSP;

    const chiTietNhap = await ChiTietNhap.findAll({
      where: whereClause,
      include: [
        {
          model: NhapKho,
          as: 'NhapKho',
          include: [
            {
              model: require('../models').KhoHang,
              as: 'KhoHang'
            },
            {
              model: require('../models').NhaCungCap,
              as: 'NhaCungCap'
            }
          ]
        },
        {
          model: SanPham,
          as: 'SanPham'
        }
      ],
      order: [['MaNhap', 'DESC']]
    });

    res.json({
      success: true,
      data: chiTietNhap
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách chi tiết nhập',
      error: error.message
    });
  }
};

// GET /api/chitietnhap/:maNhap/:maSP - Lấy chi tiết nhập theo ID
const getChiTietNhapById = async (req, res) => {
  try {
    const { maNhap, maSP } = req.params;

    const chiTietNhap = await ChiTietNhap.findOne({
      where: { MaNhap: maNhap, MaSP: maSP },
      include: [
        {
          model: NhapKho,
          as: 'NhapKho',
          include: [
            {
              model: require('../models').KhoHang,
              as: 'KhoHang'
            },
            {
              model: require('../models').NhaCungCap,
              as: 'NhaCungCap'
            }
          ]
        },
        {
          model: SanPham,
          as: 'SanPham'
        }
      ]
    });

    if (!chiTietNhap) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chi tiết nhập'
      });
    }

    res.json({
      success: true,
      data: chiTietNhap
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin chi tiết nhập',
      error: error.message
    });
  }
};

// POST /api/chitietnhap - Tạo chi tiết nhập mới
const createChiTietNhap = async (req, res) => {
  const transaction = await require('../config/db.config').getDbConnection().transaction();
  
  try {
    const { MaNhap, MaSP, SoLuong, GiaNhap, Note } = req.body;

    if (!MaNhap || !MaSP || !SoLuong || !GiaNhap) {
      return res.status(400).json({
        success: false,
        message: 'Mã nhập, mã sản phẩm, số lượng và giá nhập là bắt buộc'
      });
    }

    // Validate import record and product
    const [nhapKho, sanPham] = await Promise.all([
      NhapKho.findByPk(MaNhap),
      SanPham.findByPk(MaSP)
    ]);

    if (!nhapKho) {
      return res.status(400).json({
        success: false,
        message: 'Phiếu nhập kho không tồn tại'
      });
    }

    if (!sanPham) {
      return res.status(400).json({
        success: false,
        message: 'Sản phẩm không tồn tại'
      });
    }

    // Check if detail already exists
    const existingDetail = await ChiTietNhap.findOne({
      where: { MaNhap, MaSP }
    });

    if (existingDetail) {
      return res.status(400).json({
        success: false,
        message: 'Chi tiết nhập đã tồn tại'
      });
    }

    // Create import detail
    const chiTietNhap = await ChiTietNhap.create({
      MaNhap,
      MaSP,
      SoLuong,
      GiaNhap,
      Note
    }, { transaction });

    // Update inventory
    const [tonKho, created] = await TonKho.findOrCreate({
      where: { MaSP, MaKho: nhapKho.MaKho },
      defaults: { SoLuongTon: 0 },
      transaction
    });

    await tonKho.update({
      SoLuongTon: tonKho.SoLuongTon + SoLuong
    }, { transaction });

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: 'Tạo chi tiết nhập thành công',
      data: chiTietNhap
    });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo chi tiết nhập',
      error: error.message
    });
  }
};

// PUT /api/chitietnhap/:maNhap/:maSP - Cập nhật chi tiết nhập
const updateChiTietNhap = async (req, res) => {
  const transaction = await require('../config/db.config').getDbConnection().transaction();
  
  try {
    const { maNhap, maSP } = req.params;
    const { SoLuong, GiaNhap, Note } = req.body;

    const chiTietNhap = await ChiTietNhap.findOne({
      where: { MaNhap: maNhap, MaSP: maSP }
    });

    if (!chiTietNhap) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chi tiết nhập'
      });
    }

    const oldSoLuong = chiTietNhap.SoLuong;
    const newSoLuong = SoLuong || chiTietNhap.SoLuong;

    // Update detail
    await chiTietNhap.update({
      SoLuong: newSoLuong,
      GiaNhap: GiaNhap || chiTietNhap.GiaNhap,
      Note: Note !== undefined ? Note : chiTietNhap.Note
    }, { transaction });

    // Update inventory if quantity changed
    if (oldSoLuong !== newSoLuong) {
      const nhapKho = await NhapKho.findByPk(maNhap);
      const tonKho = await TonKho.findOne({
        where: { MaSP: maSP, MaKho: nhapKho.MaKho }
      });

      if (tonKho) {
        const quantityDiff = newSoLuong - oldSoLuong;
        await tonKho.update({
          SoLuongTon: tonKho.SoLuongTon + quantityDiff
        }, { transaction });
      }
    }

    await transaction.commit();

    res.json({
      success: true,
      message: 'Cập nhật chi tiết nhập thành công',
      data: chiTietNhap
    });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật chi tiết nhập',
      error: error.message
    });
  }
};

// DELETE /api/chitietnhap/:maNhap/:maSP - Xóa chi tiết nhập
const deleteChiTietNhap = async (req, res) => {
  const transaction = await require('../config/db.config').getDbConnection().transaction();
  
  try {
    const { maNhap, maSP } = req.params;

    const chiTietNhap = await ChiTietNhap.findOne({
      where: { MaNhap: maNhap, MaSP: maSP }
    });

    if (!chiTietNhap) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chi tiết nhập'
      });
    }

    // Update inventory
    const nhapKho = await NhapKho.findByPk(maNhap);
    const tonKho = await TonKho.findOne({
      where: { MaSP: maSP, MaKho: nhapKho.MaKho }
    });

    if (tonKho) {
      await tonKho.update({
        SoLuongTon: tonKho.SoLuongTon - chiTietNhap.SoLuong
      }, { transaction });
    }

    // Delete detail
    await chiTietNhap.destroy({ transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Xóa chi tiết nhập thành công'
    });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa chi tiết nhập',
      error: error.message
    });
  }
};

module.exports = {
  getAllChiTietNhap,
  getChiTietNhapById,
  createChiTietNhap,
  updateChiTietNhap,
  deleteChiTietNhap
};
