const { getDbFromRequest } = require('../config/db.config');
const {
  SanPham,
  NhaCungCap,
  ChiTietNhap,
  ChiTietXuat,
  TonKho,
} = require('../models');
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
          { MoTa: { [Op.like]: `%${search}%` } },
        ],
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
          as: 'NhaCungCap',
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
      message: 'Lỗi khi lấy danh sách sản phẩm',
      error: error.message,
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
          as: 'NhaCungCap',
        },
        {
          model: TonKho,
          as: 'TonKhos',
        },
      ],
    });

    if (!sanPham) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm',
      });
    }

    res.json({
      success: true,
      data: sanPham,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin sản phẩm',
      error: error.message,
    });
  }
};

// POST /api/sanpham - Tạo sản phẩm mới
// Giả sử:
// - getDbFromRequest: hàm của bạn
// - masterDb: là 1 instance Sequelize đã kết nối master
// - shards['key']: là 1 instance Sequelize đã kết nối shard
// RẤT QUAN TRỌNG: Tất cả model (SanPham, NhaCungCap) phải được
// định nghĩa trên TẤT CẢ các kết nối (masterDb và các shards)

// POST /api/sanpham - Tạo sản phẩm mới
const createSanPham = async (req, res) => {
  try {
    // BƯỚC 1: LẤY KẾT NỐI DB (masterDb hoặc 1 shard) TỪ REQUEST
    // Hàm của bạn sẽ chạy và trả về kết nối Sequelize tương ứng
    const db = await getDbFromRequest(req);

    // Nếu db không tồn tại (lỗi cấu hình)
    if (!db) {
      return res.status(500).json({ message: 'Lỗi cấu hình Shard' });
    }

    // BƯỚC 2: LẤY MODEL TỪ KẾT NỐI DB ĐÃ CHỌN
    // KHÔNG dùng SanPham import từ đầu file nữa
    const SanPham = db.models.SanPham;
    const NhaCungCap = db.models.NhaCungCap;

    // --- Logic controller của bạn bắt đầu từ đây ---
    const { TenSP, DonVi, MaNCC, MoTa } = req.body;

    if (!TenSP || !DonVi || !MaNCC) {
      return res.status(400).json({
        /* ... */
      });
    }

    // Check nhà cung cấp TRÊN DB ĐƯỢC CHỌN
    const nhaCungCap = await NhaCungCap.findByPk(MaNCC);
    if (!nhaCungCap) {
      return res.status(400).json({ message: 'Nhà cung cấp không tồn tại' });
    }

    const sanPhamData = {
      TenSP,
      DonVi,
      MaNCC,
      MoTa,
    };

    // Tạo sản phẩm TRÊN DB ĐƯỢC CHỌN
    await SanPham.create(sanPhamData, { returning: false });

    res.status(201).json({
      success: true,
      message: 'Tạo sản phẩm thành công',
      data: sanPhamData,
    });
  } catch (error) {
    res.status(201).json({
      success: true,
      message: 'Tạo sản phẩm thành công',
      error: error.message,
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
        message: 'Không tìm thấy sản phẩm',
      });
    }

    // Check if new supplier exists
    if (MaNCC) {
      const nhaCungCap = await NhaCungCap.findByPk(MaNCC);
      if (!nhaCungCap) {
        return res.status(400).json({
          success: false,
          message: 'Nhà cung cấp không tồn tại',
        });
      }
    }

    await sanPham.update({
      TenSP: TenSP || sanPham.TenSP,
      DonVi: DonVi || sanPham.DonVi,
      MaNCC: MaNCC || sanPham.MaNCC,
      MoTa: MoTa !== undefined ? MoTa : sanPham.MoTa,
    });

    res.json({
      success: true,
      message: 'Cập nhật sản phẩm thành công',
      data: sanPham,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật sản phẩm',
      error: error.message,
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
        message: 'Không tìm thấy sản phẩm',
      });
    }

    // Check if product has inventory or transactions
    const tonKhoCount = await TonKho.count({
      where: { MaSP: id },
    });

    const chiTietNhapCount = await ChiTietNhap.count({
      where: { MaSP: id },
    });

    const chiTietXuatCount = await ChiTietXuat.count({
      where: { MaSP: id },
    });

    if (tonKhoCount > 0 || chiTietNhapCount > 0 || chiTietXuatCount > 0) {
      return res.status(400).json({
        success: false,
        message:
          'Không thể xóa sản phẩm vì còn tồn kho hoặc giao dịch liên quan',
      });
    }

    await sanPham.destroy();

    res.json({
      success: true,
      message: 'Xóa sản phẩm thành công',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa sản phẩm',
      error: error.message,
    });
  }
};

const getTop5SanPhamTonKhoItNhatTheoKho = async (req, res) => {
  try {
    const db = await getDbFromRequest(req);

    // THÊM DÒNG NÀY ĐỂ DEBUG
    console.log('====================================');
    console.log('ĐANG TRUY VẤN CSDL:', db.config.database);
    console.log('====================================');
    // ---------------------------------
    const { MaKho: maKho } = req.query;

    if (!maKho) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp MaKho (mã kho).',
      });
    }

    // Sửa lại câu query cho SQL Server (dùng TOP 5)
    const query = `
        SELECT TOP 5
          tk.MaKho,
          kh.TenKho,
          tk.MaSP,
          sp.TenSP,
          tk.SoLuongTon,
          sp.DonVi
        FROM 
          TonKho tk
          INNER JOIN SanPham sp ON tk.MaSP = sp.MaSP
          INNER JOIN KhoHang kh ON tk.MaKho = kh.MaKho
        WHERE 
          tk.MaKho = :maKho
        ORDER BY 
          tk.SoLuongTon ASC;
      `;

    const results = await db.query(query, {
      replacements: { maKho: maKho },
      type: db.QueryTypes.SELECT,
    });

    res.json({
      success: true,
      message: `Lấy 5 sản phẩm tồn kho ít nhất cho kho ${maKho} thành công`,
      data: results,
    });
  } catch (error) {
    console.error('Lỗi khi truy vấn tồn kho ít nhất:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy dữ liệu tồn kho ít nhất',
      error: error.message,
    });
  }
};
module.exports = {
  getAllSanPham,
  getSanPhamById,
  createSanPham,
  updateSanPham,
  deleteSanPham,
  getTop5SanPhamTonKhoItNhatTheoKho,
};
